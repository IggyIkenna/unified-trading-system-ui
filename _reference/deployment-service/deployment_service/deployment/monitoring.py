"""
Monitoring utilities for tracking shard progress and status.

Handles monitoring running shards, automatic retries on failure,
and status updates with progress tracking.
"""

import logging
import time
from collections.abc import Callable
from datetime import UTC, datetime
from typing import cast

from deployment_service.backends import ComputeBackend, JobStatus

from .quota_broker_client import ComputeType, QuotaBrokerClient
from .state import DeploymentState, DeploymentStatus, ShardState, ShardStatus

logger = logging.getLogger(__name__)


def monitor_shards(
    state: DeploymentState,
    backend: ComputeBackend,
    state_manager: object,
    progress_display: object,
    rate_limiter: object = None,
    quota_broker: QuotaBrokerClient | None = None,
    vm_resource_request_fn: object = None,
    poll_interval: int = 10,
    max_retries: int = 3,
    docker_image: str | None = None,
    environment_variables: dict[str, str] | None = None,
    compute_config: dict[str, object] | None = None,
) -> None:
    """
    Monitor running shards until all complete, with automatic retry on failure.

    Args:
        state: DeploymentState to update
        backend: ComputeBackend to check status
        state_manager: StateManager for persisting state
        progress_display: ProgressDisplay for showing updates
        rate_limiter: Optional RateLimiter for API throttling
        quota_broker: Optional quota broker client
        vm_resource_request_fn: Function to map VM config to resource requirements
        poll_interval: Seconds between status checks
        max_retries: Maximum number of retries for failed shards (default 3)
        docker_image: Docker image for retries (from state.config if not provided)
        environment_variables: Environment variables for retries
        compute_config: Compute config for retries
    """
    # Get retry parameters from state config if not provided
    if docker_image is None:
        docker_image = cast(str | None, state.config.get("docker_image"))
    if environment_variables is None:
        environment_variables = cast(
            dict[str, str], state.config.get("environment_variables") or {}
        )
    if compute_config is None:
        compute_config = cast(dict[str, object], state.config.get("compute_config") or {})

    labels = {
        "service": state.service,
        "deployment_id": state.deployment_id,
    }

    # Build active jobs map
    active_jobs: dict[str, ShardState] = {
        shard.shard_id: shard for shard in state.shards if shard.status == ShardStatus.RUNNING
    }

    logger.info("Monitoring %s running shards...", len(active_jobs))

    while active_jobs:
        # Check status of active jobs
        completed_shards: list[str] = []
        shards_to_retry: list[ShardState] = []

        for shard_id, shard in active_jobs.items():
            if not shard.job_id:
                continue

            job_info = backend.get_status_with_context(
                shard.job_id,
                deployment_id=state.deployment_id,
                shard_id=shard.shard_id,
            )

            if job_info.status == JobStatus.SUCCEEDED:
                shard.status = ShardStatus.SUCCEEDED
                shard.end_time = datetime.now(UTC).isoformat()
                completed_shards.append(shard_id)
                # Release quota lease (best-effort)
                try:
                    if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                        quota_broker.release(lease_id=str(shard.quota_lease_id))
                        shard.quota_lease_id = None
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Unexpected error during operation: %s", e, exc_info=True)
                    pass
                # Log retry success clearly so it's visible when grepping logs
                if shard.retries > 0:
                    logger.info(
                        "[RETRY_SUCCESS] Shard %s succeeded after %s retry(ies)",
                        shard_id,
                        shard.retries,
                    )
            elif job_info.status == JobStatus.FAILED:
                # Release quota lease (best-effort) before retrying/marking failed
                try:
                    if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                        quota_broker.release(lease_id=str(shard.quota_lease_id))
                        shard.quota_lease_id = None
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Unexpected error during operation: %s", e, exc_info=True)
                    pass
                # Check if we should retry
                if shard.retries < max_retries:
                    logger.warning(
                        "[RETRY_PENDING] Shard %s failed (attempt %s/%s), will retry. Error: %s",
                        shard_id,
                        shard.retries + 1,
                        max_retries + 1,
                        job_info.error_message,
                    )
                    shards_to_retry.append(shard)
                    completed_shards.append(shard_id)  # Remove from active to re-add after retry
                else:
                    shard.status = ShardStatus.FAILED
                    shard.error_message = job_info.error_message
                    shard.end_time = datetime.now(UTC).isoformat()
                    completed_shards.append(shard_id)
                    logger.error(
                        "[RETRY_EXHAUSTED] Shard %s failed after %s attempts"
                        " (max retries reached): %s",
                        shard_id,
                        shard.retries + 1,
                        job_info.error_message,
                    )
            elif job_info.status == JobStatus.CANCELLED:
                shard.status = ShardStatus.CANCELLED
                shard.end_time = datetime.now(UTC).isoformat()
                completed_shards.append(shard_id)
                # Release quota lease (best-effort)
                try:
                    if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                        quota_broker.release(lease_id=str(shard.quota_lease_id))
                        shard.quota_lease_id = None
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Unexpected error during operation: %s", e, exc_info=True)
                    pass

        # Remove completed from active
        for shard_id in completed_shards:
            del active_jobs[shard_id]

        # Retry failed shards (if any)
        for retry_idx, shard in enumerate(shards_to_retry):
            shard.retries += 1
            logger.info(
                "Retrying shard %s (attempt %s/%s)",
                shard.shard_id,
                shard.retries + 1,
                max_retries + 1,
            )

            try:
                # Admission control (optional) - block until granted.
                if quota_broker and quota_broker.enabled():
                    broker_region = getattr(backend, "region", "us-central1")
                    if state.compute_type == "vm":
                        if callable(vm_resource_request_fn):
                            _fn = cast(Callable[[object], dict[str, float]], vm_resource_request_fn)
                            resources: dict[str, float] = _fn(compute_config)
                        else:
                            resources = {}
                        ttl_override: int | None = None
                    else:
                        resources = {"RUNNING_EXECUTIONS": 1.0}
                        timeout_s = int(
                            cast(int, (compute_config or {}).get("timeout_seconds") or 3600)
                        )
                        ttl_override = max(300, min(timeout_s, 6 * 3600))

                    while True:
                        admission = quota_broker.acquire(
                            deployment_id=state.deployment_id,
                            shard_id=shard.shard_id,
                            compute_type=cast(ComputeType, state.compute_type),
                            region=broker_region,
                            resources=resources,
                            ttl_seconds=ttl_override,
                        )
                        if admission.granted:
                            shard.quota_lease_id = admission.lease_id
                            shard.quota_denied_reason = None
                            shard.quota_retry_after_seconds = None
                            break
                        shard.quota_denied_reason = admission.reason or "denied"
                        shard.quota_retry_after_seconds = admission.retry_after_seconds or 30
                        time.sleep(float(shard.quota_retry_after_seconds))

                # Rate limit to avoid hitting GCP API quotas (retry = create = write operation)
                if rate_limiter:
                    rate_limiter.acquire()

                # Use hash of shard_id for consistent SHARD_INDEX on retries
                # This ensures the same shard always gets the same API key
                # Use modulo with a reasonable total to keep within validation bounds
                shard_index = hash(shard.shard_id) % 100
                retry_env_vars = {
                    **environment_variables,
                    "SHARD_INDEX": str(shard_index),
                    "TOTAL_SHARDS": "100",
                }

                retry_compute_config = dict(compute_config or {})
                # Zone distribution for VM retries (spread across zones)
                if state.compute_type == "vm" and hasattr(backend, "_get_zones_for_region"):
                    zones = backend._get_zones_for_region(backend.region)
                    retry_compute_config["zone"] = zones[retry_idx % len(zones)]

                job_info = backend.deploy_shard(
                    shard_id=shard.shard_id,
                    docker_image=docker_image,
                    args=shard.args,
                    environment_variables=retry_env_vars,
                    compute_config=retry_compute_config,
                    labels=labels,
                )

                if job_info and job_info.status != JobStatus.FAILED:
                    shard.status = ShardStatus.RUNNING
                    shard.job_id = job_info.job_id
                    shard.start_time = datetime.now(UTC).isoformat()
                    shard.error_message = None
                    active_jobs[shard.shard_id] = shard
                else:
                    # Release admission lease on failed retry launch (best-effort)
                    try:
                        if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                            quota_broker.release(lease_id=str(shard.quota_lease_id))
                            shard.quota_lease_id = None
                    except (OSError, ValueError, RuntimeError) as e:
                        logger.warning("Unexpected error during operation: %s", e, exc_info=True)
                        pass
                    # Retry launch failed, mark as failed if max retries reached
                    if shard.retries >= max_retries:
                        shard.status = ShardStatus.FAILED
                        shard.error_message = f"Failed to relaunch after {shard.retries} retries"
                        shard.end_time = datetime.now(UTC).isoformat()
                    else:
                        # Will retry again next loop
                        shard.status = ShardStatus.PENDING
            except (OSError, ValueError, RuntimeError) as retry_err:
                logger.error("Failed to retry shard %s: %s", shard.shard_id, retry_err)
                # Release admission lease on exception (best-effort)
                try:
                    if quota_broker and quota_broker.enabled() and shard.quota_lease_id:
                        quota_broker.release(lease_id=str(shard.quota_lease_id))
                        shard.quota_lease_id = None
                except (OSError, ValueError, RuntimeError) as inner_err:
                    logger.warning(
                        "Unexpected error during operation: %s", inner_err, exc_info=True
                    )
                if shard.retries >= max_retries:
                    shard.status = ShardStatus.FAILED
                    shard.error_message = f"Retry failed: {retry_err}"
                    shard.end_time = datetime.now(UTC).isoformat()

        # Save state and display progress
        state_manager.save_state(state)
        if progress_display:
            progress_display.display_progress(state)

        # Wait before next check
        if active_jobs:
            time.sleep(poll_interval)

    # Update final status
    if state.failed_shards:
        state.status = DeploymentStatus.FAILED
    else:
        state.status = DeploymentStatus.COMPLETED

    state_manager.save_state(state)
