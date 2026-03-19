"""
Worker management utilities for deploying shards.

Handles launching shards in parallel or rolling fashion, managing
concurrency limits, retries, and progress tracking.
"""

import logging
import random
import time
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
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


def launch_shards_parallel(
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
    venue_overrides: dict[str, dict[str, object]] | None = None,
    compute_type: str = "vm",
    auto_retry_failed: bool = True,
    max_launch_retry_rounds: int = 3,
) -> None:
    """
    Launch all shards in parallel using threading.

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
        max_workers: Maximum concurrent API calls
        venue_overrides: Per-venue compute overrides (e.g., COINBASE needs 256GB RAM)
        compute_type: "vm" or "cloud_run" for applying overrides
        auto_retry_failed: If True, automatically retry shards that failed during launch
            (default True)
        max_launch_retry_rounds: Maximum number of retry rounds for failed launch shards
            (default 3)
    """
    labels = {
        "service": state.service,
        "deployment_id": state.deployment_id,
    }

    pending_shards = state.pending_shards[:]  # Copy list
    venue_overrides = venue_overrides or {}

    def get_shard_compute_config(shard: ShardState) -> dict[str, object]:
        """Get compute config for shard, applying venue overrides if applicable."""
        venue = cast("str | None", shard.dimensions.get("venue"))
        if venue and venue in venue_overrides:
            venue_config = cast("dict[str, object]", venue_overrides[venue].get(compute_type, {}))
            if venue_config:
                logger.info(
                    "[%s] Applying venue override for %s: %s", shard.shard_id, venue, venue_config
                )
                return {**compute_config, **venue_config}
        return compute_config

    def launch_single_shard(
        shard_with_index: tuple[int, ShardState],
        max_launch_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 30.0,
    ) -> tuple[ShardState, JobInfo | None]:
        """Launch a single shard with retry logic and exponential backoff.

        Args:
            shard_with_index: Tuple of (index, shard)
            max_launch_retries: Maximum number of retry attempts for transient errors (default 3)
            base_delay: Base delay in seconds for exponential backoff (default 1.0)
            max_delay: Maximum delay in seconds between retries (default 30.0)

        Returns:
            Tuple of (shard, job_info) where job_info is None if all retries failed
        """
        shard_index, shard = shard_with_index
        last_error = None
        lease_id: str | None = None

        # Centralized admission control (optional) - block until granted.
        if quota_broker and quota_broker.enabled():
            shard_compute_config = get_shard_compute_config(shard)
            broker_region: str = str(getattr(backend, "region", "us-central1"))
            resources: dict[str, float]
            ttl_override: int | None
            if compute_type == "vm":
                resources = (
                    cast(dict[str, float], vm_resource_request_fn(shard_compute_config))
                    if callable(vm_resource_request_fn)
                    else {}
                )
                ttl_override = None
            else:
                resources = {"RUNNING_EXECUTIONS": 1.0}
                timeout_s = int(
                    cast(int, (shard_compute_config or {}).get("timeout_seconds", 3600) or 3600)
                )
                ttl_override = max(300, min(timeout_s, 6 * 3600))

            started_wait = time.time()
            max_wait_seconds = _config.broker_max_wait_seconds
            while True:
                admission = quota_broker.acquire(
                    deployment_id=state.deployment_id,
                    shard_id=shard.shard_id,
                    compute_type=cast(ComputeType, compute_type),
                    region=broker_region,
                    resources=resources,
                    ttl_seconds=ttl_override,
                )
                if admission.granted:
                    lease_id = admission.lease_id
                    shard.quota_lease_id = lease_id
                    shard.quota_denied_reason = None
                    shard.quota_retry_after_seconds = None
                    break

                shard.quota_denied_reason = admission.reason or "denied"
                shard.quota_retry_after_seconds = admission.retry_after_seconds or 30

                if (time.time() - started_wait) > max_wait_seconds:
                    # Give up and mark as launch failure.
                    return (shard, None)

                time.sleep(float(shard.quota_retry_after_seconds))

        for attempt in range(max_launch_retries + 1):
            try:
                # Rate limit to avoid hitting GCP API quotas (create = write operation)
                rate_limiter.acquire()

                # Add SHARD_INDEX and TOTAL_SHARDS to environment for round-robin API key selection
                # This allows services like TheGraphBaseClient to distribute API keys
                # TOTAL_SHARDS is needed because some services validate shard_index < total_shards
                total_shards = len(pending_shards)
                shard_env_vars = {
                    **environment_variables,
                    # Inject per-shard bucket names so containers resolve the right env's bucket
                    # without hard-coding names. DEPLOYMENT_ENV in the template is substituted
                    # from os.environ at launch time — staging containers get staging buckets,
                    # prod containers get prod buckets, automatically.
                    **build_storage_env_vars(state.service, shard.dimensions),
                    "SHARD_INDEX": str(shard_index),
                    "TOTAL_SHARDS": str(total_shards),
                }

                shard_compute_config = get_shard_compute_config(shard)
                # Zone distribution for VM: round-robin across zones (shard_index % 3)
                if compute_type == "vm" and hasattr(backend, "_get_zones_for_region"):
                    _get_zones_fn = cast(object, getattr(backend, "_get_zones_for_region", None))
                    _backend_region: str = str(getattr(backend, "region", "us-central1"))
                    zones: list[str] = (
                        cast(list[str], _get_zones_fn(_backend_region))
                        if callable(_get_zones_fn)
                        else [_backend_region]
                    )
                    assigned_zone: str = zones[shard_index % len(zones)]
                    shard_compute_config = {
                        **(shard_compute_config or {}),
                        "zone": assigned_zone,
                    }
                job_info = backend.deploy_shard(
                    shard_id=shard.shard_id,
                    docker_image=docker_image,
                    args=shard.args,
                    environment_variables=shard_env_vars,
                    compute_config=shard_compute_config,
                    labels=labels,
                )

                # Release admission lease on failed launch (best-effort)
                if job_info.status == JobStatus.FAILED:
                    try:
                        if (
                            quota_broker
                            and quota_broker.enabled()
                            and (lease_id or shard.quota_lease_id)
                        ):
                            quota_broker.release(lease_id=str(lease_id or shard.quota_lease_id))
                            shard.quota_lease_id = None
                    except (ConnectionError, TimeoutError) as e:
                        logger.warning(
                            "Failed to release quota lease for %s (connection issue): %s",
                            shard.shard_id,
                            e,
                        )
                    except (OSError, ValueError, RuntimeError) as e:
                        logger.warning(
                            "Failed to release quota lease for %s: %s", shard.shard_id, e
                        )

                # Log success after retries
                if attempt > 0:
                    logger.info(
                        "[LAUNCH_RETRY_SUCCESS] Shard %s launched successfully after %s retry(ies)",
                        shard.shard_id,
                        attempt,
                    )

                return (shard, job_info)

            except (OSError, ValueError, RuntimeError) as e:
                last_error = e
                error_str = str(e).lower()

                # Check if this is a retryable error (SSL, connection, timeout issues)
                is_retryable = any(
                    keyword in error_str
                    for keyword in [
                        "ssl",
                        "ssleof",
                        "connection",
                        "timeout",
                        "temporary",
                        "unavailable",
                        "reset",
                        "broken pipe",
                        "eof occurred",
                        "max retries exceeded",
                        "connectionpool",
                        "httpsconnectionpool",
                    ]
                )

                if is_retryable and attempt < max_launch_retries:
                    # Exponential backoff with jitter
                    delay: float = min(base_delay * (2.0**attempt), max_delay)
                    jitter: float = random.uniform(0, delay * 0.3)  # Up to 30% jitter
                    total_delay: float = delay + jitter

                    logger.warning(
                        "[LAUNCH_RETRY] Shard %s failed (attempt %s/%s),"
                        " retrying in %.1fs. Error: %s",
                        shard.shard_id,
                        attempt + 1,
                        max_launch_retries + 1,
                        total_delay,
                        e,
                    )
                    time.sleep(total_delay)
                else:
                    # Non-retryable error or max retries reached
                    if attempt >= max_launch_retries:
                        logger.error(
                            "[LAUNCH_FAILED] Shard %s failed after %s attempt(s): %s",
                            shard.shard_id,
                            attempt + 1,
                            e,
                        )
                    else:
                        logger.error(
                            "[LAUNCH_FAILED] Shard %s failed (non-retryable): %s", shard.shard_id, e
                        )
                    # Release admission lease on ultimate failure (best-effort)
                    try:
                        if (
                            quota_broker
                            and quota_broker.enabled()
                            and (lease_id or shard.quota_lease_id)
                        ):
                            quota_broker.release(lease_id=str(lease_id or shard.quota_lease_id))
                            shard.quota_lease_id = None
                    except (ConnectionError, TimeoutError) as e:
                        logger.warning(
                            "Failed to release quota lease for %s (connection issue): %s",
                            shard.shard_id,
                            e,
                        )
                    except (OSError, ValueError, RuntimeError) as e:
                        logger.warning(
                            "Failed to release quota lease for %s: %s", shard.shard_id, e
                        )
                    return (shard, None)

        # Should not reach here, but just in case
        logger.error(
            "[LAUNCH_FAILED] Shard %s failed after all retries: %s", shard.shard_id, last_error
        )
        # Release admission lease on ultimate failure (best-effort)
        try:
            if quota_broker and quota_broker.enabled() and (lease_id or shard.quota_lease_id):
                quota_broker.release(lease_id=str(lease_id or shard.quota_lease_id))
                shard.quota_lease_id = None
        except (ConnectionError, TimeoutError) as e:
            logger.warning(
                "Failed to release quota lease for %s (connection issue): %s", shard.shard_id, e
            )
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Failed to release quota lease for %s: %s", shard.shard_id, e)
        return (shard, None)

    # Launch all shards in parallel using ThreadPoolExecutor with mini-batching
    # Enumerate shards to pass index for round-robin API key selection
    indexed_shards = list(enumerate(pending_shards))

    # Configurable mini-batch size and delay to avoid overwhelming GCP
    # 50 VMs per batch is safe since GCP provisions in parallel (~15-20s for 50)
    # The delay between batches lets GCP's provisioning queue clear
    mini_batch_size = _config.vm_launch_mini_batch_size
    mini_batch_delay_seconds = _config.vm_launch_mini_batch_delay_seconds

    total_mini_batches = (len(indexed_shards) + mini_batch_size - 1) // mini_batch_size
    logger.info(
        "Launching %s shards with %s parallel workers"
        " (mini-batches of %s with %ss delay, %s batches)...",
        len(pending_shards),
        max_workers,
        mini_batch_size,
        mini_batch_delay_seconds,
        total_mini_batches,
    )

    completed = 0

    # Process shards in mini-batches to avoid overwhelming GCP
    for mini_batch_idx in range(0, len(indexed_shards), mini_batch_size):
        mini_batch = indexed_shards[mini_batch_idx : mini_batch_idx + mini_batch_size]
        mini_batch_num = (mini_batch_idx // mini_batch_size) + 1

        logger.info(
            "[MINI_BATCH] Launching mini-batch %s/%s (%s shards)...",
            mini_batch_num,
            total_mini_batches,
            len(mini_batch),
        )

        with ThreadPoolExecutor(max_workers=min(max_workers, len(mini_batch))) as executor:
            futures: dict[Future[tuple[ShardState, JobInfo | None]], ShardState] = {
                executor.submit(launch_single_shard, indexed_shard): indexed_shard[1]
                for indexed_shard in mini_batch
            }

            for future in as_completed(futures):
                shard, job_info = future.result()
                completed += 1

                # Update shard state
                shard.start_time = datetime.now(UTC).isoformat()

                if job_info is None or job_info.status == JobStatus.FAILED:
                    shard.status = ShardStatus.FAILED
                    shard.error_message = job_info.error_message if job_info else "Launch failed"
                    shard.end_time = datetime.now(UTC).isoformat()
                else:
                    shard.status = ShardStatus.RUNNING
                    shard.job_id = job_info.job_id

        # Log and save state after each mini-batch for better UI sync
        running = sum(1 for s in state.shards if s.status == ShardStatus.RUNNING)
        failed = sum(1 for s in state.shards if s.status == ShardStatus.FAILED)
        state_manager.save_state(state)
        logger.info(
            "[MINI_BATCH] Mini-batch %s complete: %s/%s total (running: %s, failed: %s)",
            mini_batch_num,
            completed,
            len(pending_shards),
            running,
            failed,
        )

        # Delay between mini-batches to let GCP provision VMs
        if mini_batch_idx + mini_batch_size < len(indexed_shards):
            logger.debug(
                "[MINI_BATCH] Waiting %ss before next mini-batch...", mini_batch_delay_seconds
            )
            time.sleep(mini_batch_delay_seconds)

    # Recalculate overall deployment status after launch
    succeeded = sum(1 for s in state.shards if s.status == ShardStatus.SUCCEEDED)
    failed = sum(1 for s in state.shards if s.status == ShardStatus.FAILED)
    running = sum(1 for s in state.shards if s.status == ShardStatus.RUNNING)

    state_manager.save_state(state)
    logger.info(
        "Initial launch complete: %s shards (running: %s, failed: %s, succeeded: %s)",
        len(pending_shards),
        running,
        failed,
        succeeded,
    )

    # Auto-retry failed shards if enabled
    if auto_retry_failed and failed > 0:
        logger.info("[AUTO_RETRY] Starting automatic retry of %s failed launch shards...", failed)

        for retry_round in range(max_launch_retry_rounds):
            # Get currently failed shards
            failed_shards = [s for s in state.shards if s.status == ShardStatus.FAILED]
            if not failed_shards:
                logger.info("[AUTO_RETRY] All shards succeeded, no more retries needed")
                break

            # Exponential backoff between retry rounds
            if retry_round > 0:
                round_delay: float = min(
                    30.0 * (2.0 ** (retry_round - 1)), 120.0
                )  # 30s, 60s, 120s max
                logger.info(
                    "[AUTO_RETRY] Waiting %ss before retry round %s...",
                    round_delay,
                    retry_round + 1,
                )
                time.sleep(round_delay)

            logger.info(
                "[AUTO_RETRY] Retry round %s/%s: retrying %s failed shards...",
                retry_round + 1,
                max_launch_retry_rounds,
                len(failed_shards),
            )

            # Reset failed shards to pending for retry
            for shard in failed_shards:
                shard.status = ShardStatus.PENDING
                shard.error_message = None
                shard.retries += 1

            # Re-enumerate with fresh indices for retry
            indexed_retry_shards = list(enumerate(failed_shards))

            # Use fewer workers for retry to reduce connection pressure
            retry_workers = max(10, max_workers // 3)

            with ThreadPoolExecutor(max_workers=retry_workers) as executor:
                retry_futures: dict[Future[tuple[ShardState, JobInfo | None]], ShardState] = {
                    executor.submit(launch_single_shard, indexed_shard): indexed_shard[1]
                    for indexed_shard in indexed_retry_shards
                }

                for retry_completed, future in enumerate(as_completed(retry_futures), 1):
                    shard, job_info = future.result()

                    shard.start_time = datetime.now(UTC).isoformat()

                    if job_info is None or job_info.status == JobStatus.FAILED:
                        shard.status = ShardStatus.FAILED
                        shard.error_message = (
                            job_info.error_message if job_info else "Launch failed"
                        )
                        shard.end_time = datetime.now(UTC).isoformat()
                    else:
                        shard.status = ShardStatus.RUNNING
                        shard.job_id = job_info.job_id

                    if retry_completed % 10 == 0 or retry_completed == len(failed_shards):
                        logger.info(
                            "[AUTO_RETRY] Round %s: %s/%s shards processed",
                            retry_round + 1,
                            retry_completed,
                            len(failed_shards),
                        )

            # Recalculate counts after this retry round
            succeeded = sum(1 for s in state.shards if s.status == ShardStatus.SUCCEEDED)
            still_failed = sum(1 for s in state.shards if s.status == ShardStatus.FAILED)
            running = sum(1 for s in state.shards if s.status == ShardStatus.RUNNING)

            state_manager.save_state(state)
            logger.info(
                "[AUTO_RETRY] Round %s complete: running=%s, failed=%s, succeeded=%s",
                retry_round + 1,
                running,
                still_failed,
                succeeded,
            )

            if still_failed == 0:
                break

        # Final count after all retry rounds
        failed = sum(1 for s in state.shards if s.status == ShardStatus.FAILED)
        running = sum(1 for s in state.shards if s.status == ShardStatus.RUNNING)
        succeeded = sum(1 for s in state.shards if s.status == ShardStatus.SUCCEEDED)

        if failed > 0:
            logger.warning(
                "[AUTO_RETRY] %s shards still failed after %s retry rounds",
                failed,
                max_launch_retry_rounds,
            )

    # Set final deployment status
    if failed == len(state.shards):
        # All shards failed
        state.status = DeploymentStatus.FAILED
    elif succeeded == len(state.shards):
        # All shards succeeded
        state.status = DeploymentStatus.COMPLETED
    elif failed > 0 and running == 0:
        # Some failed, none running = partial failure / failed
        state.status = DeploymentStatus.FAILED
    elif running > 0:
        # Some still running
        state.status = DeploymentStatus.RUNNING

    state_manager.save_state(state)
    logger.info(
        "Launch phase complete: %s total shards (running: %s, failed: %s, succeeded: %s)",
        len(pending_shards),
        running,
        failed,
        succeeded,
    )


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
) -> None:
    """
    Launch shards in a rolling fashion, maintaining at most max_concurrent running at any time.

    Unlike launch_shards_parallel which launches all shards at once, this function
    launches shards in waves — as running shards complete, new ones are launched to
    fill the slots up to max_concurrent.

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
        max_workers: Maximum concurrent API calls per launch wave
        max_concurrent: Maximum simultaneously running VMs/jobs
        venue_overrides: Per-venue compute overrides
        compute_type: "vm" or "cloud_run"
        no_wait: If True, launch first wave and return without monitoring remaining
    """
    all_pending = state.pending_shards[:]
    total = len(all_pending)
    poll_interval = 30  # seconds between status checks

    logger.info(
        "[ROLLING_LAUNCH] Starting rolling launch: %s total shards, max_concurrent=%s",
        total,
        max_concurrent,
    )

    wave_number = 0
    launched_count = 0

    while all_pending or state.running_shards:
        # Count currently running shards
        currently_running = len(state.running_shards)
        slots_available = max(0, max_concurrent - currently_running)

        if slots_available > 0 and all_pending:
            # Take up to slots_available shards from the pending list
            wave = all_pending[:slots_available]
            all_pending = all_pending[slots_available:]
            wave_number += 1
            launched_count += len(wave)

            logger.info(
                "[ROLLING_LAUNCH] Wave %s: launching %s shards (%s/%s total, %s slots available)",
                wave_number,
                len(wave),
                launched_count,
                total,
                slots_available,
            )

            # Hide non-wave pending shards so launch_shards_parallel only processes this wave
            wave_ids = {s.shard_id for s in wave}
            non_wave_pending = [
                s
                for s in state.shards
                if s.status == ShardStatus.PENDING and s.shard_id not in wave_ids
            ]
            # Temporarily mark non-wave pending shards as QUEUED to hide from parallel launcher
            # We use FAILED as a safe sentinel (will be restored immediately after)
            _HIDDEN_STATUS = ShardStatus.FAILED
            original_statuses: dict[str, ShardStatus] = {}
            for shard in non_wave_pending:
                original_statuses[shard.shard_id] = shard.status
                shard.status = _HIDDEN_STATUS

            launch_shards_parallel(
                state=state,
                backend=backend,
                docker_image=docker_image,
                environment_variables=environment_variables,
                compute_config=compute_config,
                rate_limiter=rate_limiter,
                state_manager=state_manager,
                quota_broker=quota_broker,
                vm_resource_request_fn=vm_resource_request_fn,
                max_workers=min(max_workers, len(wave)),
                venue_overrides=venue_overrides,
                compute_type=compute_type,
                auto_retry_failed=False,  # Rolling launch handles retries via waves
            )

            # Restore non-wave pending shards to PENDING (only those still in FAILED sentinel state)
            for shard in non_wave_pending:
                if shard.shard_id in original_statuses and shard.status == _HIDDEN_STATUS:
                    shard.status = original_statuses[shard.shard_id]

            if no_wait and wave_number == 1:
                # Fire and forget — launch first wave only, leave rest pending
                logger.info(
                    "[ROLLING_LAUNCH] no_wait=True: launched first wave of %s shards,"
                    " %s remain pending",
                    len(wave),
                    len(all_pending),
                )
                state_manager.save_state(state)
                return

        if not all_pending:
            # All shards have been launched; rolling launch phase complete
            logger.info(
                "[ROLLING_LAUNCH] All %s shards have been launched across %s waves",
                total,
                wave_number,
            )
            break

        # Wait before checking running count again
        logger.info(
            "[ROLLING_LAUNCH] %s shards running (max_concurrent=%s), %s pending — waiting %ss",
            currently_running,
            max_concurrent,
            len(all_pending),
            poll_interval,
        )
        time.sleep(poll_interval)

        # Poll backend to refresh running shard statuses
        for shard in state.running_shards:
            if not shard.job_id:
                continue
            try:
                rate_limiter.acquire()
                job_info: JobInfo = backend.get_status(shard.job_id)
                if job_info.status == JobStatus.SUCCEEDED:
                    shard.status = ShardStatus.SUCCEEDED
                    shard.end_time = datetime.now(UTC).isoformat()
                elif job_info.status == JobStatus.FAILED:
                    shard.status = ShardStatus.FAILED
                    shard.error_message = job_info.error_message
                    shard.end_time = datetime.now(UTC).isoformat()
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("[ROLLING_LAUNCH] Failed to poll shard %s: %s", shard.shard_id, e)

        state_manager.save_state(state)

    # Final status summary
    succeeded = sum(1 for s in state.shards if s.status == ShardStatus.SUCCEEDED)
    failed = sum(1 for s in state.shards if s.status == ShardStatus.FAILED)
    running = sum(1 for s in state.shards if s.status == ShardStatus.RUNNING)

    logger.info(
        "[ROLLING_LAUNCH] Complete: %s total shards (running: %s, failed: %s, succeeded: %s)",
        total,
        running,
        failed,
        succeeded,
    )
