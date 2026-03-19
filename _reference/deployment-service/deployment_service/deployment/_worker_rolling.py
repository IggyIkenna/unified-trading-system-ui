"""Rolling-concurrency shard launcher — extracted from worker_manager for SRP."""

from __future__ import annotations

import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime
from typing import cast

from deployment_service.backends import ComputeBackend, JobInfo, JobStatus
from deployment_service.deployment_config import DeploymentConfig
from deployment_service.shard_builder import build_storage_env_vars

from .quota_broker_client import ComputeType, QuotaBrokerClient
from .rate_limiter import RateLimiter
from .state import DeploymentState, DeploymentStatus, ShardState, ShardStatus, StateManager

_config = DeploymentConfig()
logger = logging.getLogger(__name__)


def launch_shards_rolling(
    state: DeploymentState,
    backend: ComputeBackend,
    docker_image: str,
    environment_variables: dict[str, str],
    compute_config: dict[str, object],
    rate_limiter: RateLimiter,
    state_manager: StateManager,
    quota_broker: QuotaBrokerClient | None = None,
    vm_resource_request_fn: object = None,
    max_workers: int = 50,
    max_concurrent: int = 2000,
    venue_overrides: dict[str, dict[str, object]] | None = None,
    compute_type: str = "vm",
    no_wait: bool = False,
    poll_interval: int = 30,
) -> None:
    """
    Launch shards with rolling concurrency - maintains max_concurrent running at any time.

    When total shards > max_concurrent, this method:
    1. Launches initial batch of max_concurrent shards
    2. Monitors for completions
    3. Launches new shards to fill available slots
    4. Continues until all shards are launched and completed

    Args:
        state: DeploymentState to update
        backend: ComputeBackend to use
        docker_image: Docker image URL
        environment_variables: Environment variables
        compute_config: Default compute configuration
        rate_limiter: RateLimiter instance for API throttling
        state_manager: StateManager for persisting state
        quota_broker: Optional quota broker client
        vm_resource_request_fn: Function to map VM config to resource requirements
        max_workers: Maximum concurrent API calls for launching
        max_concurrent: Maximum simultaneously running VMs/jobs
        venue_overrides: Per-venue compute overrides
        compute_type: "vm" or "cloud_run"
        no_wait: If True, return after launching initial batch
        poll_interval: Seconds between monitoring checks
    """
    labels = {
        "service": state.service,
        "deployment_id": state.deployment_id,
    }
    venue_overrides = venue_overrides or {}

    total_shards = len(state.pending_shards)
    logger.info(
        "[ROLLING_LAUNCH] Starting rolling launch: %s total shards, max_concurrent=%s",
        total_shards,
        max_concurrent,
    )

    def get_shard_compute_config(shard: ShardState) -> dict[str, object]:
        """Get compute config for shard, applying venue overrides if applicable."""
        venue = cast("str | None", shard.dimensions.get("venue"))
        if venue and venue in venue_overrides:
            venue_config = cast("dict[str, object]", venue_overrides[venue].get(compute_type, {}))
            if venue_config:
                return {**compute_config, **venue_config}
        return compute_config

    # Track shard index for environment variables
    shard_index_counter = [0]
    shard_index_lock = threading.Lock()

    def launch_single_shard(shard: ShardState) -> tuple[ShardState, JobInfo | None]:
        """Launch a single shard and return result."""
        lease_id: str | None = None
        try:
            shard_compute_config = get_shard_compute_config(shard)

            # Centralized admission control (optional)
            if quota_broker and quota_broker.enabled():
                broker_region: str = str(getattr(backend, "region", "us-central1"))
                _resources: dict[str, float]
                _ttl_override: int | None
                if compute_type == "vm":
                    _resources = (
                        cast(dict[str, float], vm_resource_request_fn(shard_compute_config))
                        if callable(vm_resource_request_fn)
                        else {}
                    )
                    _ttl_override = None
                else:
                    _resources = {"RUNNING_EXECUTIONS": 1.0}
                    timeout_s = int(
                        cast(int, (shard_compute_config or {}).get("timeout_seconds", 3600) or 3600)
                    )
                    _ttl_override = max(300, min(timeout_s, 6 * 3600))

                admission = quota_broker.acquire(
                    deployment_id=state.deployment_id,
                    shard_id=shard.shard_id,
                    compute_type=cast(ComputeType, compute_type),
                    region=broker_region,
                    resources=_resources,
                    ttl_seconds=_ttl_override,
                )
                if not admission.granted:
                    shard.quota_denied_reason = admission.reason or "denied"
                    shard.quota_retry_after_seconds = admission.retry_after_seconds
                    return (shard, None)

                lease_id = admission.lease_id
                shard.quota_lease_id = lease_id
                shard.quota_denied_reason = None
                shard.quota_retry_after_seconds = None

            # Rate limit (GCP writes)
            rate_limiter.acquire()

            # Get unique shard index
            with shard_index_lock:
                shard_index = shard_index_counter[0]
                shard_index_counter[0] += 1

            # Zone distribution for VM: round-robin across zones (shard_index % 3)
            if compute_type == "vm" and hasattr(backend, "_get_zones_for_region"):
                _get_zones_fn2 = cast(object, getattr(backend, "_get_zones_for_region", None))
                _backend_region2: str = str(getattr(backend, "region", "us-central1"))
                zones2: list[str] = (
                    cast(list[str], _get_zones_fn2(_backend_region2))
                    if callable(_get_zones_fn2)
                    else [_backend_region2]
                )
                assigned_zone2: str = zones2[shard_index % len(zones2)]
                shard_compute_config = {
                    **(shard_compute_config or {}),
                    "zone": assigned_zone2,
                }

            # Add SHARD_INDEX and TOTAL_SHARDS to environment for round-robin API key selection
            shard_env_vars = {
                **environment_variables,
                **build_storage_env_vars(state.service, shard.dimensions),
                "SHARD_INDEX": str(shard_index),
                "TOTAL_SHARDS": str(total_shards),
            }

            job_info = backend.deploy_shard(
                shard_id=shard.shard_id,
                docker_image=docker_image,
                args=shard.args,
                environment_variables=shard_env_vars,
                compute_config=shard_compute_config,
                labels=labels,
            )
            return (shard, job_info)
        except (OSError, ValueError, RuntimeError) as e:
            # Release admission lease on launch failure (best-effort)
            try:
                if quota_broker and quota_broker.enabled() and (lease_id or shard.quota_lease_id):
                    quota_broker.release(lease_id=str(lease_id or shard.quota_lease_id))
                    shard.quota_lease_id = None
            except (ConnectionError, TimeoutError) as e2:
                logger.warning(
                    "Failed to release quota lease for %s (connection issue): %s",
                    shard.shard_id,
                    e2,
                )
            except (OSError, ValueError, RuntimeError) as e2:
                logger.warning("Failed to release quota lease for %s: %s", shard.shard_id, e2)
            logger.error("[ROLLING_LAUNCH] Failed to launch %s: %s", shard.shard_id, e)
            return (shard, None)

    def check_shard_status(shard: ShardState) -> JobStatus:
        """Check current backend job status for a running shard."""
        if not shard.job_id:
            return JobStatus.UNKNOWN
        try:
            job_info = backend.get_status_with_context(
                shard.job_id,
                deployment_id=state.deployment_id,
                shard_id=shard.shard_id,
            )
            return job_info.status if job_info else JobStatus.UNKNOWN
        except (ConnectionError, TimeoutError) as e:
            # Network issues - treat as unknown and retry next poll
            logger.debug("Connection error checking status for %s: %s", shard.shard_id, e)
            return JobStatus.UNKNOWN
        except (OSError, ValueError, RuntimeError) as e:
            # Other errors - log warning but don't spam in large deployments
            logger.debug("Error checking status for %s: %s", shard.shard_id, e)
            return JobStatus.UNKNOWN

    # Track which shards have been launched
    launched_shard_ids: set[str] = set()

    # Initial launch of up to max_concurrent shards
    pending_to_launch = [s for s in state.pending_shards if s.shard_id not in launched_shard_ids]
    initial_batch = pending_to_launch[:max_concurrent]

    # Configurable mini-batch size and delay to avoid overwhelming GCP
    # 50 VMs per batch is safe since GCP provisions in parallel (~15-20s for 50)
    # The delay between batches lets GCP's provisioning queue clear
    mini_batch_size = _config.vm_launch_mini_batch_size
    mini_batch_delay_seconds = _config.vm_launch_mini_batch_delay_seconds

    logger.info(
        "[ROLLING_LAUNCH] Launching initial batch of %s shards"
        " (mini-batches of %s with %ss delay)...",
        len(initial_batch),
        mini_batch_size,
        mini_batch_delay_seconds,
    )

    # Split initial batch into mini-batches to avoid overwhelming GCP
    launched = 0
    for mini_batch_idx in range(0, len(initial_batch), mini_batch_size):
        mini_batch = initial_batch[mini_batch_idx : mini_batch_idx + mini_batch_size]
        mini_batch_num = (mini_batch_idx // mini_batch_size) + 1
        total_mini_batches = (len(initial_batch) + mini_batch_size - 1) // mini_batch_size

        logger.info(
            "[ROLLING_LAUNCH] Launching mini-batch %s/%s (%s shards)...",
            mini_batch_num,
            total_mini_batches,
            len(mini_batch),
        )

        with ThreadPoolExecutor(max_workers=min(max_workers, len(mini_batch))) as executor:
            futures = {executor.submit(launch_single_shard, shard): shard for shard in mini_batch}

            for future in as_completed(futures):
                shard, job_info = future.result()
                launched += 1

                # If broker denied admission, keep shard pending for later retry.
                if job_info is None and shard.quota_denied_reason:
                    continue

                shard.start_time = datetime.now(UTC).isoformat()
                launched_shard_ids.add(shard.shard_id)

                if job_info is None or job_info.status == JobStatus.FAILED:
                    shard.status = ShardStatus.FAILED
                    shard.error_message = job_info.error_message if job_info else "Launch failed"
                    shard.end_time = datetime.now(UTC).isoformat()

                    # Release admission lease on failed launch (best-effort)
                    try:
                        if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                            quota_broker.release(lease_id=str(shard.quota_lease_id))
                            shard.quota_lease_id = None
                    except (OSError, ValueError, RuntimeError) as e:
                        logger.warning("Failed to release quota lease on failed launch: %s", e)
                else:
                    shard.status = ShardStatus.RUNNING
                    shard.job_id = job_info.job_id

        # Save state after every mini-batch for better UI sync
        state_manager.save_state(state)
        logger.info(
            "[ROLLING_LAUNCH] Mini-batch %s complete: %s/%s total launched",
            mini_batch_num,
            launched,
            len(initial_batch),
        )

        # Delay between mini-batches to let GCP provision VMs
        if mini_batch_idx + mini_batch_size < len(initial_batch):
            logger.debug(
                "[ROLLING_LAUNCH] Waiting %ss before next mini-batch...", mini_batch_delay_seconds
            )
            time.sleep(mini_batch_delay_seconds)

    logger.info("[ROLLING_LAUNCH] Initial batch complete: %s shards launched", launched)

    if no_wait:
        logger.info("[ROLLING_LAUNCH] no_wait=True, returning after initial batch")
        return

    # Rolling launch loop - monitor and launch more as slots become available
    remaining_to_launch = [s for s in state.pending_shards if s.shard_id not in launched_shard_ids]

    while remaining_to_launch or any(s.status == ShardStatus.RUNNING for s in state.shards):
        unknown_threshold = _config.unknown_status_max_polls

        # Count current running shards
        running_shards = [s for s in state.shards if s.status == ShardStatus.RUNNING]
        running_count = len(running_shards)

        # Check status of running shards
        completed_this_round = 0
        for shard in running_shards:
            status = check_shard_status(shard)

            if status == JobStatus.SUCCEEDED:
                shard.status = ShardStatus.SUCCEEDED
                shard.end_time = datetime.now(UTC).isoformat()
                shard.unknown_polls = 0
                completed_this_round += 1
                # Release quota lease (best-effort)
                try:
                    if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                        quota_broker.release(lease_id=str(shard.quota_lease_id))
                        shard.quota_lease_id = None
                except (ConnectionError, TimeoutError) as e:
                    logger.warning(
                        "Failed to release quota lease for %s (connection issue): %s",
                        shard.shard_id,
                        e,
                    )
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Failed to release quota lease for %s: %s", shard.shard_id, e)
            elif status == JobStatus.FAILED:
                shard.status = ShardStatus.FAILED
                shard.end_time = datetime.now(UTC).isoformat()
                shard.unknown_polls = 0
                completed_this_round += 1
                # Release quota lease (best-effort)
                try:
                    if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                        quota_broker.release(lease_id=str(shard.quota_lease_id))
                        shard.quota_lease_id = None
                except (ConnectionError, TimeoutError) as e:
                    logger.warning(
                        "Failed to release quota lease for %s (connection issue): %s",
                        shard.shard_id,
                        e,
                    )
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Failed to release quota lease for %s: %s", shard.shard_id, e)
            elif status == JobStatus.CANCELLED:
                shard.status = ShardStatus.CANCELLED
                shard.end_time = datetime.now(UTC).isoformat()
                shard.unknown_polls = 0
                completed_this_round += 1
                # Release quota lease (best-effort)
                try:
                    if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                        quota_broker.release(lease_id=str(shard.quota_lease_id))
                        shard.quota_lease_id = None
                except (ConnectionError, TimeoutError) as e:
                    logger.warning(
                        "Failed to release quota lease for %s (connection issue): %s",
                        shard.shard_id,
                        e,
                    )
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Failed to release quota lease for %s: %s", shard.shard_id, e)
            elif status == JobStatus.UNKNOWN:
                shard.unknown_polls = (shard.unknown_polls or 0) + 1
                if shard.unknown_polls >= unknown_threshold:
                    shard.status = ShardStatus.FAILED
                    shard.end_time = datetime.now(UTC).isoformat()
                    shard.error_message = (
                        f"Backend status UNKNOWN for {shard.unknown_polls} polls;"
                        f" marking shard as failed"
                    )
                    completed_this_round += 1
                    # Release quota lease (best-effort)
                    try:
                        if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                            quota_broker.release(lease_id=str(shard.quota_lease_id))
                            shard.quota_lease_id = None
                    except (OSError, ValueError, RuntimeError) as e:
                        logger.warning("Failed to release quota lease (UNKNOWN status): %s", e)
            else:
                # Any non-UNKNOWN response resets the consecutive UNKNOWN counter.
                shard.unknown_polls = 0

        # Recalculate running after status updates
        running_count = sum(1 for s in state.shards if s.status == ShardStatus.RUNNING)

        # Calculate available slots
        available_slots = max_concurrent - running_count

        # Launch more shards if we have capacity and pending shards
        if available_slots > 0 and remaining_to_launch:
            batch_to_launch = remaining_to_launch[:available_slots]

            logger.info(
                "[ROLLING_LAUNCH] Launching %s more shards (running: %s, available: %s)",
                len(batch_to_launch),
                running_count,
                available_slots,
            )

            # Use mini-batching for subsequent launches too
            for mini_batch_idx in range(0, len(batch_to_launch), mini_batch_size):
                mini_batch = batch_to_launch[mini_batch_idx : mini_batch_idx + mini_batch_size]

                with ThreadPoolExecutor(max_workers=min(max_workers, len(mini_batch))) as executor:
                    futures = {
                        executor.submit(launch_single_shard, shard): shard for shard in mini_batch
                    }

                    for future in as_completed(futures):
                        shard, job_info = future.result()
                        # If broker denied admission, keep shard pending for later retry.
                        if job_info is None and shard.quota_denied_reason:
                            continue

                        launched_shard_ids.add(shard.shard_id)

                        shard.start_time = datetime.now(UTC).isoformat()

                        if job_info is None or job_info.status == JobStatus.FAILED:
                            shard.status = ShardStatus.FAILED
                            shard.error_message = (
                                job_info.error_message if job_info else "Launch failed"
                            )
                            shard.end_time = datetime.now(UTC).isoformat()

                            # Release admission lease on failed launch (best-effort)
                            try:
                                if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                                    quota_broker.release(lease_id=str(shard.quota_lease_id))
                                    shard.quota_lease_id = None
                            except (OSError, ValueError, RuntimeError) as e:
                                logger.warning(
                                    "Failed to release quota lease on failed launch: %s", e
                                )
                        else:
                            shard.status = ShardStatus.RUNNING
                            shard.job_id = job_info.job_id

                # Save state after each mini-batch for better UI sync
                state_manager.save_state(state)

                # Delay between mini-batches to let GCP provision VMs
                if mini_batch_idx + mini_batch_size < len(batch_to_launch):
                    time.sleep(mini_batch_delay_seconds)

            # Update remaining list
            remaining_to_launch = [
                s for s in state.pending_shards if s.shard_id not in launched_shard_ids
            ]

        # Save state and display progress
        state_manager.save_state(state)

        # Log progress
        succeeded = sum(1 for s in state.shards if s.status == ShardStatus.SUCCEEDED)
        failed = sum(1 for s in state.shards if s.status == ShardStatus.FAILED)
        running = sum(1 for s in state.shards if s.status == ShardStatus.RUNNING)
        pending = sum(1 for s in state.shards if s.status == ShardStatus.PENDING)

        logger.info(
            "[ROLLING_LAUNCH] Progress: running=%s, succeeded=%s, failed=%s,"
            " pending=%s, remaining_to_launch=%s",
            running,
            succeeded,
            failed,
            pending,
            len(remaining_to_launch),
        )

        # Exit if all done
        if running == 0 and len(remaining_to_launch) == 0:
            break

        # Wait before next check
        time.sleep(poll_interval)

    # Final status
    succeeded = sum(1 for s in state.shards if s.status == ShardStatus.SUCCEEDED)
    failed = sum(1 for s in state.shards if s.status == ShardStatus.FAILED)

    if failed == len(state.shards) or failed > 0:
        state.status = DeploymentStatus.FAILED
    else:
        state.status = DeploymentStatus.COMPLETED

    state_manager.save_state(state)
    logger.info("[ROLLING_LAUNCH] Complete: succeeded=%s, failed=%s", succeeded, failed)
