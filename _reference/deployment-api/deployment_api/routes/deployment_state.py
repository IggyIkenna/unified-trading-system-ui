"""
Deployment state management utilities.

Contains functions for managing deployment lifecycle, status updates,
and state synchronization with cloud resources.

NOTE: This module MUST NOT import from deployment_service. All state
reads/writes go through deployment_api.utils.local_state_manager (GCS via
storage_facade) and cloud-status queries go through deployment_service_client
(HTTP).
"""

import asyncio as _asyncio
import json
import logging
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from datetime import UTC, datetime
from typing import cast

from deployment_api import settings as _settings
from deployment_api.clients import deployment_service_client as _ds_client
from deployment_api.utils.deployment_events import notify_deployment_updated_sync
from deployment_api.utils.local_state_manager import (
    STATUS_CANCELLED,
    STATUS_COMPLETED,
    STATUS_FAILED,
    STATUS_PENDING,
    STATUS_RUNNING,
    get_shards,
    get_status,
    load_state,
    recompute_status,
    save_state,
)
from deployment_api.utils.storage_facade import (
    delete_object,
    list_objects,
    object_exists,
    read_object_text,
)

logger = logging.getLogger(__name__)

# Default GCP settings
DEFAULT_PROJECT_ID = _settings.gcp_project_id
DEFAULT_REGION = _settings.GCS_REGION
DEFAULT_STATE_BUCKET = _settings.STATE_BUCKET
DEPLOYMENT_ENV = getattr(_settings, "DEPLOYMENT_ENV", "default")


def _extract_severity_and_logger(line: str) -> tuple[str, str | None]:
    """
    Extract severity level and logger name from log line.

    Handles various log formats:
    - Python logging: "ERROR:service_name:Message"
    - Structured JSON: {"level": "error", "logger": "service_name"}
    - Cloud Logging: severity field
    """
    severity = "INFO"  # default
    logger_name = None

    # Try Python logging format first
    if ":" in line:
        parts = line.split(":", 2)
        if len(parts) >= 2:
            potential_level = parts[0].strip().upper()
            if potential_level in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
                severity = potential_level
                logger_name = parts[1].strip() if len(parts) > 1 else None

    # Try to extract from JSON if it looks like structured logging
    if line.strip().startswith("{"):
        try:
            log_obj = cast(dict[str, object], json.loads(line.strip()))
            if "level" in log_obj:
                severity = str(log_obj["level"]).upper()
            if "logger" in log_obj:
                logger_name = str(log_obj["logger"])
            elif "name" in log_obj:
                logger_name = str(log_obj["name"])
        except (json.JSONDecodeError, AttributeError) as e:
            logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)
            pass

    # Map severity levels to standard format
    severity_map = {
        "WARN": "WARNING",
        "ERR": "ERROR",
        "CRIT": "CRITICAL",
        "FATAL": "CRITICAL",
        "TRACE": "DEBUG",
    }
    severity = severity_map.get(severity, severity)

    return severity, logger_name


def _refresh_live_cloud_run_status(state: dict[str, object]) -> int:
    """
    Refresh deployment state for live mode by checking Cloud Run Service revision health.

    Uses Cloud Run Services API (revisions, conditions). Updates state shards or status
    based on service/revision readiness. Returns number of shards updated, or -1 if live
    refresh not applicable (e.g. no service_name in config).
    """
    config = cast(dict[str, object], state.get("config") or {})
    service_name = cast(str, config.get("service_name") or state.get("service") or "")
    region = cast(str, config.get("region") or DEFAULT_REGION)
    project_id = cast(str, config.get("project_id") or DEFAULT_PROJECT_ID)
    # Normalize service name for Cloud Run (lowercase, no underscores)
    service_name = service_name.replace("_", "-").lower()
    if not service_name:
        return -1

    shards = get_shards(state)

    try:
        from unified_cloud_interface import get_compute_client

        compute = get_compute_client(project_id=project_id)
        revisions_list = compute.list_revisions(service_name, region)

        if not revisions_list:
            return 0

        latest = max(revisions_list, key=lambda r: cast(float, r.get("create_time", 0.0)))

        # Revision conditions: type "Ready" with state CONDITION_SUCCEEDED = healthy
        ready = False
        for cond in cast(list[object], latest.get("conditions") or []):
            if not isinstance(cond, dict):
                continue
            cond_dict = cast(dict[str, object], cond)
            type_val: object = cond_dict.get("type")
            if type_val == "Ready":
                state_val: object = cond_dict.get("state")
                if state_val is not None:
                    ready = "SUCCEEDED" in str(state_val).upper()
                break

        # Map to shard status: if we have shards, update the first running one or all
        updated = 0
        for shard in shards:
            if cast(str, shard.get("status") or "") != "running":
                continue
            if ready:
                shard["status"] = "succeeded"
                shard["end_time"] = datetime.now(UTC).isoformat()
            else:
                shard["status"] = "failed"
                shard["end_time"] = datetime.now(UTC).isoformat()
                shard["error_message"] = "Live service revision not ready"
            updated += 1

        if not shards and ready:
            state["status"] = STATUS_COMPLETED
            updated = 1
        elif not shards and not ready:
            state["status"] = STATUS_FAILED
            updated = 1

        return updated
    except (OSError, ValueError, RuntimeError):
        return -1


def _parse_execution_name(name: str) -> tuple[str | None, str | None]:
    """Parse execution name to extract region and job name."""
    # projects/{p}/locations/{r}/jobs/{j}/executions/{e}
    parts = name.split("/")
    region = None
    job_name = None
    for i, p in enumerate(parts):
        if p == "locations" and i + 1 < len(parts):
            region = parts[i + 1]
        if p == "jobs" and i + 1 < len(parts):
            job_name = parts[i + 1]
    return region, job_name


def _check_shard_logs_for_errors(shard: dict[str, object], deployment_id: str) -> bool:
    """Check if shard logs contain ERROR severity. Returns True if errors found."""
    shard_id = cast(str, shard.get("shard_id") or "")
    try:
        logs_path = f"deployments.{DEPLOYMENT_ENV}/{deployment_id}/{shard_id}/logs.txt"
        if object_exists(DEFAULT_STATE_BUCKET, logs_path):
            content = read_object_text(DEFAULT_STATE_BUCKET, logs_path)
            # Check each line for ERROR severity using same logic as log display
            for line in content.split("\n"):
                stripped = line.strip()
                if not stripped or stripped == "No logs available":
                    continue
                severity, _ = _extract_severity_and_logger(line)
                if severity == "ERROR":
                    logger.warning("[BATCH_REFRESH] Found ERROR in %s: %s", shard_id, line[:200])
                    return True
        return False
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("[BATCH_REFRESH] Failed to check logs for %s: %s", shard_id, e)
        return False


def refresh_deployment_status_sync(deployment_id: str) -> dict[str, object]:
    """
    Synchronous helper for refresh_deployment_status.
    All blocking GCP/GCS calls are done here.
    """
    state = load_state(deployment_id, bucket=DEFAULT_STATE_BUCKET)
    if not state:
        return {"error": "not_found", "deployment_id": deployment_id}

    current_status = get_status(state)

    # Only refresh if deployment is still "running" or "pending"
    if current_status not in [STATUS_RUNNING, STATUS_PENDING]:
        return {
            "deployment_id": deployment_id,
            "message": f"Deployment already in terminal state: {current_status}",
            "updated": False,
        }

    updated_count = 0
    deployment_mode = cast(str, state.get("deployment_mode") or "batch")
    compute_type = cast(str, state.get("compute_type") or "")
    shards = get_shards(state)

    # Live mode: monitor Cloud Run Services (revisions/health), not Jobs.
    if deployment_mode == "live" and compute_type == "cloud_run":
        updated_count = _refresh_live_cloud_run_status(state)
        if updated_count >= 0:
            state["updated_at"] = datetime.now(UTC).isoformat()
            save_state(state, bucket=DEFAULT_STATE_BUCKET)
            return {
                "deployment_id": deployment_id,
                "updated": updated_count > 0,
                "updated_count": updated_count,
            }
        # Fall through to batch path if live status unsupported (e.g. no service_name)

    config = cast(dict[str, object], state.get("config") or {})

    if compute_type == "cloud_run":
        # Batch refresh for Cloud Run: group executions by region/job and list once per group.
        # This avoids N get_execution() calls for large deployments.
        running_shards = [
            s for s in shards if cast(str, s.get("status") or "") == "running" and s.get("job_id")
        ]

        # Group by (region, job_name)
        groups: dict[tuple[str, str], list[str]] = {}
        for shard in running_shards:
            r, j = _parse_execution_name(cast(str, shard.get("job_id") or ""))
            r = r or cast(str, config.get("region") or DEFAULT_REGION)
            j = j or "unknown"
            key = (r, j)
            if key not in groups:
                groups[key] = []
            groups[key].append(cast(str, shard["job_id"]))

        # Build mapping from execution_name -> our shard
        exec_to_shard = {cast(str, s.get("job_id")): s for s in running_shards}

        for (region, job_name), exec_names in groups.items():
            try:
                project_id = cast(str, config.get("project_id") or DEFAULT_PROJECT_ID)
                service_account_email = cast(str, config.get("service_account_email") or "")

                # Query Cloud Run execution statuses via deployment-service HTTP API
                raw_statuses = _asyncio.run(
                    _ds_client.get_cloud_run_status_batch(
                        project_id=project_id,
                        region=region,
                        service_account_email=service_account_email,
                        job_name=job_name,
                        job_ids=exec_names,
                    )
                )

                for execution_name, status in raw_statuses.items():
                    shard = exec_to_shard.get(execution_name)
                    if not shard:
                        continue

                    # Update based on execution status
                    if status == "SUCCEEDED":
                        shard["status"] = "succeeded"
                        shard["end_time"] = datetime.now(UTC).isoformat()
                        updated_count += 1
                    elif status == "FAILED":
                        shard["status"] = "failed"
                        shard["end_time"] = datetime.now(UTC).isoformat()
                        shard["error_message"] = "Job failed"
                        updated_count += 1
                    elif status == "CANCELLED":
                        shard["status"] = "cancelled"
                        shard["end_time"] = datetime.now(UTC).isoformat()
                        updated_count += 1

            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Failed to refresh deployment shards: %s", e)

    elif compute_type == "vm":
        # VM refresh: check if compute instances are still running via deployment-service HTTP API
        running_shards = [s for s in shards if cast(str, s.get("status") or "") == "running"]
        if running_shards:
            zones: list[str] = []
            # Extract zones from VM names or use default
            for shard in running_shards[:10]:  # Sample to avoid too many API calls
                shard_compute_info = cast("dict[str, object] | None", shard.get("compute_info"))
                if shard_compute_info:
                    zone_val = cast(str, shard_compute_info.get("zone") or "")
                    if zone_val and zone_val not in zones:
                        zones.append(zone_val)

            if not zones:
                zones = [f"{DEFAULT_REGION}-a"]

            project_id = cast(str, config.get("project_id") or DEFAULT_PROJECT_ID)

            # Check VM status in batches
            for zone in zones:
                try:
                    zone_shards = [
                        s
                        for s in running_shards
                        if isinstance(s.get("compute_info"), dict)
                        and cast("dict[str, object]", s["compute_info"]).get("zone") == zone
                    ]

                    if not zone_shards:
                        continue

                    vm_names = [
                        cast(
                            str,
                            cast("dict[str, object]", s["compute_info"]).get("vm_name") or "",
                        )
                        for s in zone_shards
                        if isinstance(s.get("compute_info"), dict)
                        and cast("dict[str, object]", s["compute_info"]).get("vm_name")
                    ]

                    if vm_names:
                        vm_statuses = _asyncio.run(
                            _ds_client.get_vm_status_batch(
                                project_id=project_id,
                                zone=zone,
                                vm_names=vm_names,
                            )
                        )

                        for shard in zone_shards:
                            shard_ci = cast("dict[str, object] | None", shard.get("compute_info"))
                            vm_name = cast(str, shard_ci.get("vm_name") or "") if shard_ci else ""
                            if vm_name and vm_name in vm_statuses:
                                vm_status = vm_statuses[vm_name]
                                if vm_status == "TERMINATED":
                                    shard["status"] = "succeeded"
                                    shard["end_time"] = datetime.now(UTC).isoformat()
                                    updated_count += 1
                                elif vm_status in ["STOPPED", "STOPPING"]:
                                    shard["status"] = "failed"
                                    shard["end_time"] = datetime.now(UTC).isoformat()
                                    shard["error_message"] = f"VM {vm_status}"
                                    updated_count += 1

                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("[BATCH_REFRESH] Failed to refresh VMs for zone %s: %s", zone, e)

    # CRITICAL FIX: Check succeeded shards for ERROR logs (VMs for now)
    # VMs may write SUCCESS to GCS even when there are ERROR severity logs.
    # We must validate logs before finalizing shard status.
    _done_statuses = {"succeeded", "failed", "cancelled"}
    shards_all_done = all(cast(str, s.get("status") or "") in _done_statuses for s in shards)
    if compute_type == "vm" and shards_all_done:
        logger.info("[BATCH_REFRESH] Checking logs for ERROR severity in succeeded shards...")
        succeeded_shards = [s for s in shards if cast(str, s.get("status") or "") == "succeeded"]

        # Check succeeded shards in parallel for errors
        shards_with_errors: list[dict[str, object]] = []
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures: dict[Future[bool], dict[str, object]] = {
                executor.submit(_check_shard_logs_for_errors, shard, deployment_id): shard
                for shard in succeeded_shards[:100]  # Limit to first 100 for performance
            }
            for future in as_completed(futures, timeout=30):
                try:
                    shard = futures[future]
                    has_errors = future.result(timeout=5)
                    if has_errors:
                        shards_with_errors.append(shard)
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Unexpected error during operation: %s", e, exc_info=True)
                    pass

        # Mark shards with errors as FAILED
        if shards_with_errors:
            logger.warning(
                "[BATCH_REFRESH] Marking %s shards as FAILED due to ERROR logs",
                len(shards_with_errors),
            )
            for shard in shards_with_errors:
                shard["status"] = "failed"
                shard["error_message"] = "Job reported SUCCESS but logs contain ERROR severity"
                updated_count += 1

    # Update overall deployment status
    old_status = current_status
    new_status = recompute_status(shards)

    if new_status != old_status:
        state["status"] = new_status
        state["updated_at"] = datetime.now(UTC).isoformat()

    # Also update total_shards if it's 0 but we have shards
    if cast(int, state.get("total_shards") or 0) == 0 and len(shards) > 0:
        state["total_shards"] = len(shards)
        updated_count += 1

    # Save if shards changed OR overall status changed
    status_changed = old_status != new_status
    if updated_count > 0 or status_changed:
        save_state(state, bucket=DEFAULT_STATE_BUCKET)

    deployment_id_str = cast(str, state.get("deployment_id") or deployment_id)
    try:
        notify_deployment_updated_sync(deployment_id_str)
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Unexpected error during operation: %s", e, exc_info=True)
        pass

    return {
        "deployment_id": deployment_id,
        "status": new_status,
        "updated": updated_count > 0,
        "shards_updated": updated_count,
        "message": (
            f"Refreshed {updated_count} shard(s)" if updated_count > 0 else "No changes detected"
        ),
    }


def cancel_deployment_sync(deployment_id: str) -> dict[str, object]:
    """
    Synchronous cancellation logic.

    Cancels running shards, updates state, and cleans up resources.
    """
    state = load_state(deployment_id, bucket=DEFAULT_STATE_BUCKET)
    if not state:
        return {"error": "not_found", "deployment_id": deployment_id}

    current_status = get_status(state)
    _terminal = {STATUS_COMPLETED, STATUS_FAILED, STATUS_CANCELLED}

    # Only cancel if deployment is still running
    if current_status in _terminal:
        return {
            "deployment_id": deployment_id,
            "message": f"Deployment already in terminal state: {current_status}",
            "cancelled": False,
        }

    cancelled_count = 0
    shards = get_shards(state)

    # Cancel running/pending shards
    for shard in shards:
        shard_status = cast(str, shard.get("status") or "")
        if shard_status in ("running", "pending"):
            shard["status"] = "cancelled"
            shard["end_time"] = datetime.now(UTC).isoformat()
            shard["error_message"] = "Cancelled by user"
            cancelled_count += 1

    # Update overall deployment status
    state["status"] = STATUS_CANCELLED
    state["updated_at"] = datetime.now(UTC).isoformat()

    # Save state
    save_state(state, bucket=DEFAULT_STATE_BUCKET)

    deployment_id_str = cast(str, state.get("deployment_id") or deployment_id)
    try:
        notify_deployment_updated_sync(deployment_id_str)
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Unexpected error during operation: %s", e, exc_info=True)
        pass

    return {
        "deployment_id": deployment_id,
        "cancelled": True,
        "cancelled_shards": cancelled_count,
        "message": f"Cancelled deployment and {cancelled_count} shard(s)",
    }


def resume_deployment_sync(deployment_id: str) -> dict[str, object]:
    """
    Synchronous resume logic.

    Resumes cancelled deployment by resetting failed/cancelled shards to pending.
    """
    state = load_state(deployment_id, bucket=DEFAULT_STATE_BUCKET)
    if not state:
        return {"error": "not_found", "deployment_id": deployment_id}

    current_status = get_status(state)

    # Only resume cancelled or failed deployments
    if current_status not in [STATUS_CANCELLED, STATUS_FAILED]:
        return {
            "deployment_id": deployment_id,
            "message": f"Cannot resume deployment with status: {current_status}",
            "resumed": False,
        }

    resumed_count = 0
    shards = get_shards(state)

    # Resume failed/cancelled shards
    for shard in shards:
        shard_status = cast(str, shard.get("status") or "")
        if shard_status in ("failed", "cancelled"):
            shard["status"] = STATUS_PENDING
            shard["start_time"] = None
            shard["end_time"] = None
            shard["error_message"] = None
            resumed_count += 1

    # Update overall deployment status
    if resumed_count > 0:
        state["status"] = STATUS_PENDING
        state["updated_at"] = datetime.now(UTC).isoformat()

        # Save state
        save_state(state, bucket=DEFAULT_STATE_BUCKET)

        deployment_id_str = cast(str, state.get("deployment_id") or deployment_id)
        try:
            notify_deployment_updated_sync(deployment_id_str)
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Unexpected error during operation: %s", e, exc_info=True)
            pass

    return {
        "deployment_id": deployment_id,
        "resumed": resumed_count > 0,
        "resumed_shards": resumed_count,
        "message": f"Resumed {resumed_count} shard(s)"
        if resumed_count > 0
        else "No shards to resume",
    }


def delete_deployment_sync(deployment_id: str) -> dict[str, object]:
    """
    Synchronous deletion logic.

    Removes deployment state and cleans up associated resources.
    """
    state = load_state(deployment_id, bucket=DEFAULT_STATE_BUCKET)
    if not state:
        return {"error": "not_found", "deployment_id": deployment_id}

    # Delete state file
    try:
        env = DEPLOYMENT_ENV
        state_path = f"deployments.{env}/{deployment_id}/state.json"
        delete_object(DEFAULT_STATE_BUCKET, state_path)
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Failed to delete state for %s: %s", deployment_id, e)

    # Delete associated files (logs, etc.)
    try:
        prefix = f"deployments.{DEPLOYMENT_ENV}/{deployment_id}/"
        objects = list_objects(DEFAULT_STATE_BUCKET, prefix=prefix)
        for obj in objects:
            try:
                delete_object(DEFAULT_STATE_BUCKET, obj.name)
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Failed to delete object %s: %s", obj.name, e)
    except (OSError, PermissionError) as e:
        logger.warning("Failed to delete deployment artifacts: %s", e)

    return {
        "deployment_id": deployment_id,
        "deleted": True,
        "message": "Deployment deleted successfully",
    }


def update_deployment_tag_sync(deployment_id: str, tag: str | None) -> dict[str, object]:
    """
    Synchronous tag update logic.

    Updates the tag field in deployment state.
    """
    state = load_state(deployment_id, bucket=DEFAULT_STATE_BUCKET)
    if not state:
        return {"error": "not_found", "deployment_id": deployment_id}

    # Update tag
    old_tag = state.get("tag")
    state["tag"] = tag
    state["updated_at"] = datetime.now(UTC).isoformat()

    # Save state
    save_state(state, bucket=DEFAULT_STATE_BUCKET)

    return {
        "deployment_id": deployment_id,
        "updated": True,
        "old_tag": old_tag,
        "new_tag": tag,
        "message": f"Tag updated from '{old_tag}' to '{tag}'",
    }
