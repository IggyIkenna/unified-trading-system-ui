"""
Deployment Worker - Runs deployments in a separate process.

This isolates long-running deployment orchestration from the API event loop,
ensuring the API remains responsive even during large deployments (6000+ shards).

Architecture:
- API receives deployment request, creates initial state in GCS
- API spawns a worker process using multiprocessing
- Worker process runs the orchestrator completely independently
- API immediately returns, allowing other requests to be served
- Frontend polls GCS state file for progress updates

NOTE: This module MUST NOT import from deployment_service. State updates
use deployment_api.utils.local_state_manager (GCS via storage_facade).
"""

import logging
import multiprocessing
import os
import sys
from typing import cast

logger = logging.getLogger(__name__)

# Status string constants (match deployment_service enum values)
_STATUS_FAILED = "failed"


def run_deployment_in_process(
    deployment_id: str,
    service: str,
    compute_type: str,
    docker_image: str,
    shards: list[dict[str, object]],
    environment_variables: dict[str, str],
    compute_config: dict[str, object],
    start_date: str,
    end_date: str,
    job_name: str,
    zone: str | None,
    max_workers: int | None,
    max_concurrent: int | None,
    tag: str | None,
    project_id: str,
    region: str,
    service_account_email: str,
    state_bucket: str,
    config_dir: str,
):
    """
    Run deployment orchestration in a completely separate process.

    This function is the target for multiprocessing.Process.
    It runs entirely isolated from the API process, so blocking operations
    here do NOT affect API responsiveness.
    """
    try:
        logger.info("Worker started for deployment %s", deployment_id)
        logger.info("Service: %s, Shards: %s, Compute: %s", service, len(shards), compute_type)

        # Add project root to path
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        sys.path.insert(0, project_root)

        # All deployments are now managed by the API auto-scheduler in `api/main.py`.
        # The worker exits immediately - the auto-scheduler handles launching shards
        # with rolling concurrency and proper quota management.
        logger.info(
            "Deployment %s created. API auto-scheduler will launch shards"
            " with rolling concurrency.",
            deployment_id,
        )
        return

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Worker failed for deployment %s: %s", deployment_id, e)

        # Mark deployment FAILED via local_state_manager (no deployment_service import)
        try:
            from deployment_api.utils.local_state_manager import (
                load_state as _load_state,
            )
            from deployment_api.utils.local_state_manager import (
                save_state as _save_state,
            )

            state = _load_state(deployment_id, bucket=state_bucket)
            if state:
                state["status"] = _STATUS_FAILED
                config = cast(dict[str, object], state.get("config") or {})
                config["error_message"] = str(e)
                state["config"] = config
                _save_state(state, bucket=state_bucket)
                logger.info("Updated state to FAILED for %s", deployment_id)
        except (OSError, ValueError, RuntimeError) as state_err:
            logger.error("Failed to update state after error: %s", state_err)


def spawn_deployment_worker(
    deployment_id: str,
    service: str,
    compute_type: str,
    docker_image: str,
    shards: list[dict[str, object]],
    environment_variables: dict[str, str],
    compute_config: dict[str, object],
    start_date: str,
    end_date: str,
    job_name: str,
    zone: str | None,
    max_workers: int | None,
    max_concurrent: int | None,
    tag: str | None,
    project_id: str,
    region: str,
    service_account_email: str,
    state_bucket: str,
    config_dir: str,
) -> multiprocessing.Process:
    """
    Spawn a worker process to run the deployment.

    Returns the Process object (already started).
    The caller does NOT need to wait for this process - it runs independently.
    """
    # Use 'spawn' method for clean process isolation (especially important on macOS)
    ctx = multiprocessing.get_context("spawn")

    process = ctx.Process(
        target=run_deployment_in_process,
        kwargs={
            "deployment_id": deployment_id,
            "service": service,
            "compute_type": compute_type,
            "docker_image": docker_image,
            "shards": shards,
            "environment_variables": environment_variables,
            "compute_config": compute_config,
            "start_date": start_date,
            "end_date": end_date,
            "job_name": job_name,
            "zone": zone,
            "max_workers": max_workers,
            "max_concurrent": max_concurrent,
            "tag": tag,
            "project_id": project_id,
            "region": region,
            "service_account_email": service_account_email,
            "state_bucket": state_bucket,
            "config_dir": config_dir,
        },
        daemon=True,  # Daemon process - won't prevent API from shutting down
        name=f"deployment-{deployment_id[:20]}",
    )

    process.start()
    logger.info("Spawned worker process %s for deployment %s", process.pid, deployment_id)

    # SpawnProcess is a subtype of Process at runtime; basedpyright needs an intermediate cast.
    return cast(multiprocessing.Process, cast(object, process))


# Registry of active worker processes (for monitoring/cleanup)
_active_workers: dict[str, multiprocessing.Process] = {}


def get_active_workers() -> dict[str, dict[str, object]]:
    """Get status of all active worker processes."""
    result: dict[str, dict[str, object]] = {}
    for deployment_id, process in list(_active_workers.items()):
        result[deployment_id] = {
            "pid": process.pid,
            "alive": process.is_alive(),
            "exitcode": process.exitcode,
        }
        # Clean up dead processes
        if not process.is_alive():
            del _active_workers[deployment_id]
    return result


def register_worker(deployment_id: str, process: multiprocessing.Process):
    """Register a worker process for monitoring."""
    _active_workers[deployment_id] = process


def terminate_worker(deployment_id: str) -> bool:
    """Terminate a worker process by deployment ID."""
    if deployment_id in _active_workers:
        process = _active_workers[deployment_id]
        if process.is_alive():
            process.terminate()
            process.join(timeout=5)
            if process.is_alive():
                process.kill()
            del _active_workers[deployment_id]
            return True
    return False
