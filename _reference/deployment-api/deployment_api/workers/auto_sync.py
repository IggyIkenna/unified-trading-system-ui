"""
Auto-sync background task for deployment monitoring.

Handles automatic synchronization of running deployment statuses,
VM health checks, orphan cleanup, and deployment scheduling.
"""

import asyncio
import importlib as _importlib
import json
import logging
import os
import socket
import time as _time
import uuid
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Protocol, cast

from deployment_api import settings
from deployment_api.utils.config_validation import ConfigurationError, ValidationUtils
from deployment_api.utils.storage_client import get_storage_client as get_storage_client_with_pool


class _QuotaBrokerProtocol(Protocol):
    def enabled(self) -> bool: ...
    def release(self, *, lease_id: str) -> None: ...


class _GCSBlob(Protocol):
    """Protocol for GCS blob methods used in auto_sync."""

    name: str
    metageneration: int

    def upload_from_string(
        self,
        data: str | bytes,
        content_type: str = "application/octet-stream",
        if_generation_match: int | None = None,
        if_metageneration_match: int | None = None,
    ) -> None: ...
    def download_as_text(self, encoding: str | None = None) -> str: ...
    def exists(self) -> bool: ...
    def delete(self) -> None: ...


class _GCSBucket(Protocol):
    """Protocol for GCS bucket methods used in auto_sync."""

    def blob(self, blob_name: str) -> _GCSBlob: ...
    def get_blob(self, blob_name: str) -> _GCSBlob | None: ...


class _GCSClient(Protocol):
    """Protocol for GCS client methods used in auto_sync."""

    def bucket(self, name: str) -> _GCSBucket: ...


logger = logging.getLogger(__name__)

# Auto-sync configuration (from centralized settings)
PROJECT_ID = settings.gcp_project_id
STATE_BUCKET = settings.STATE_BUCKET
DEFAULT_MAX_CONCURRENT = settings.DEFAULT_MAX_CONCURRENT
SYNC_INTERVAL = settings.AUTO_SYNC_INTERVAL_SECONDS
AUTO_SYNC_ENABLED = settings.AUTO_SYNC_ENABLED
LOCK_TTL_SECONDS = settings.AUTO_SYNC_LOCK_TTL_SECONDS
OWNER_ID = f"{socket.gethostname()}:{os.getpid()}:{uuid.uuid4().hex[:8]}"
# Environment-based state separation (development vs production)
DEPLOYMENT_ENV = settings.DEPLOYMENT_ENV
# Track held locks for cleanup on shutdown
_held_deployment_locks: set[str] = set()
# Fire-and-forget VM delete tracking: job_id -> (timestamp, zone)
# Cleaned when VM no longer in vm_map; retried if still RUNNING after ORPHAN_DELETE_RETRY_SECONDS
pending_vm_deletes: dict[str, tuple[float, str | None]] = {}

# Underscore-prefixed alias for pending_vm_deletes so tests can access
# via `auto_sync._pending_vm_deletes` or import `_pending_vm_deletes` directly.
# Both names refer to the same dict object.
_pending_vm_deletes = pending_vm_deletes

# Background task handles for auto-sync
_background_task: asyncio.Task[None] | None = None
_events_drain_task: asyncio.Task[None] | None = None
_shutdown_event: asyncio.Event | None = None


def get_config_dir() -> Path:
    """Get the configs directory path."""
    # Try relative to this file
    api_dir = Path(__file__).parent.parent
    repo_root = api_dir.parent
    configs_dir = repo_root / "configs"

    if configs_dir.exists():
        return configs_dir

    raise RuntimeError(f"Could not find configs directory at {configs_dir}")


# ---------------------------------------------------------------------------
# Module-level helpers extracted from nested closures
# ---------------------------------------------------------------------------


def _get_deployment_lock_blob_name(deployment_id: str) -> str:
    return f"locks/deployment_{deployment_id}.lock"


def _try_acquire_deployment_lock(
    deployment_id: str,
    bucket: _GCSBucket,
    now: datetime,
) -> bool:
    """Acquire lock for a specific deployment."""
    lock_blob_name = _get_deployment_lock_blob_name(deployment_id)
    try:
        lock_blob = bucket.blob(lock_blob_name)
        payload = {
            "owner": OWNER_ID,
            "deployment_id": deployment_id,
            "acquired_at": now.isoformat(),
            "expires_at": now.timestamp() + LOCK_TTL_SECONDS,
        }

        # Fast path: create if missing
        lock_blob.upload_from_string(
            json.dumps(payload),
            content_type="application/json",
            if_generation_match=0,
        )
        _held_deployment_locks.add(deployment_id)
        return True
    except (OSError, ValueError, KeyError):
        return _try_acquire_deployment_lock_fallback(deployment_id, bucket, now, lock_blob_name)


def _try_acquire_deployment_lock_fallback(
    deployment_id: str,
    bucket: _GCSBucket,
    now: datetime,
    lock_blob_name: str,
) -> bool:
    """Fallback path: steal or renew an existing lock if expired or owned by us."""
    try:
        existing = bucket.get_blob(lock_blob_name)
        if not existing:
            return False
        meta = existing.metageneration
        try:
            existing_payload = cast(
                dict[str, object],
                json.loads(existing.download_as_text() or "{}"),
            )
        except (OSError, ValueError, RuntimeError):
            existing_payload = {}

        expires_at_raw2: object = existing_payload.get("expires_at", 0)
        expires_at = (
            float(cast(float, expires_at_raw2))
            if isinstance(expires_at_raw2, (int, float))
            else 0.0
        )
        owner_raw2: object = existing_payload.get("owner")
        owner = owner_raw2 if isinstance(owner_raw2, str) else None

        # Allow renewal if we already own the lock or it's expired
        is_expired = expires_at <= now.timestamp()
        if not is_expired and owner != OWNER_ID:
            return False

        new_payload = {
            "owner": OWNER_ID,
            "deployment_id": deployment_id,
            "acquired_at": now.isoformat(),
            "expires_at": now.timestamp() + LOCK_TTL_SECONDS,
            "prev_owner": owner,
        }

        lock_blob = bucket.blob(lock_blob_name)
        lock_blob.upload_from_string(
            json.dumps(new_payload),
            content_type="application/json",
            if_metageneration_match=meta,
        )
        _held_deployment_locks.add(deployment_id)
        return True
    except (OSError, ValueError, RuntimeError):
        return False


def _release_deployment_lock(
    deployment_id: str,
    bucket: _GCSBucket,
) -> bool:
    """Release lock for a specific deployment."""
    lock_blob_name = _get_deployment_lock_blob_name(deployment_id)
    try:
        lock_blob = bucket.blob(lock_blob_name)
        if lock_blob.exists():
            lock_data = cast(dict[str, object], json.loads(lock_blob.download_as_text() or "{}"))
            if lock_data.get("owner") == OWNER_ID:
                lock_blob.delete()
                _held_deployment_locks.discard(deployment_id)
                return True
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Unexpected error during release deployment lock: %s", e, exc_info=True)
    _held_deployment_locks.discard(deployment_id)
    return False


def _scan_one_state_path(
    path: str,
    read_object_text: Callable[[str, str], str],
) -> tuple[str, dict[str, object]] | None:
    """Load state.json and return (path, data) if active, else None."""
    try:
        raw = cast(dict[str, object], json.loads(read_object_text(STATE_BUCKET, path)))
        if raw.get("status") in (
            "pending",
            "running",
            "completed_pending_delete",
        ):
            return (path, raw)
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Unexpected error during scan one: %s", e, exc_info=True)
    return None


def _vm_status_from_map(m: dict[str, object], jid: str) -> str | None:
    v = m.get(jid)
    if isinstance(v, dict):
        status_val = cast(dict[str, object], v).get("status")
        return str(status_val) if isinstance(status_val, str) else None
    return str(v) if isinstance(v, str) else None


def _vm_zone_from_map(m: dict[str, object], jid: str) -> str | None:
    v = m.get(jid)
    if isinstance(v, dict):
        zone_val = cast(dict[str, object], v).get("zone")
        return str(zone_val) if isinstance(zone_val, str) else None
    return None


def _read_shard_status_from_obj(
    obj: object,
    read_object_text: Callable[[str, str], str],
) -> tuple[str, str] | None:
    obj_name = getattr(obj, "name", "")
    parts = str(obj_name).split("/")
    if len(parts) < 3:
        return None
    shard_id = parts[2]
    try:
        content = read_object_text(STATE_BUCKET, str(obj_name)).strip()
        status_part = content.split(":")[0]
        if status_part == "SUCCESS":
            return (shard_id, "succeeded")
        if status_part in ("FAILED", "ZOMBIE"):
            return (shard_id, "failed")
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Unexpected error during read status: %s", e, exc_info=True)
    return None


def _build_vm_map(service_name: str, deployment_id: str) -> dict[str, object] | None:
    """Query compute engine for running VMs matching service_name.

    Returns populated vm_map on success, None on failure.
    """
    vm_map: dict[str, object] = {}
    try:
        from unified_cloud_interface import get_compute_engine_client

        ce = get_compute_engine_client(project_id=PROJECT_ID)
        instances = ce.aggregated_list_instances(PROJECT_ID, f"name:{service_name}-*")
        for inst in instances:
            inst_d = inst
            vm_map[str(inst_d["name"])] = {
                "status": inst_d.get("status"),
                "zone": inst_d.get("zone"),
            }
        return vm_map
    except (OSError, ValueError, RuntimeError) as e:
        logger.debug(
            "[AUTO_SYNC] Orphan cleanup aggregatedList failed for %s: %s",
            deployment_id,
            e,
        )
        return None


def _fire_orphan_vm_deletes(
    to_fire: list[tuple[str, str | None]],
    config: dict[str, object],
    deployment_id: str,
    orphan_max: int,
) -> int:
    """Fire cancel_job_fire_and_forget for each orphan VM job. Returns count fired."""
    try:
        _orchestrator_cls = cast(
            type[object],
            _importlib.import_module(
                "deployment_service.deployment.orchestrator"
            ).DeploymentOrchestrator,
        )

        try:
            service_account_email = ValidationUtils.get_required(
                config, "service_account_email", "auto_sync orchestrator"
            )
            job_name = ValidationUtils.get_required(config, "job_name", "auto_sync VM backend")
        except ConfigurationError as e:
            logger.error("[AUTO_SYNC] %s: Configuration error - %s", deployment_id, e)
            return 0

        _orch_factory = cast(Callable[..., object], _orchestrator_cls)
        orch: object = _orch_factory(
            project_id=PROJECT_ID,
            region=config.get("region") or "asia-northeast1",
            service_account_email=service_account_email,
            state_bucket=STATE_BUCKET,
            state_prefix=f"deployments.{DEPLOYMENT_ENV}",
        )
        _get_backend_fn: object = getattr(orch, "get_backend", None)
        backend: object = (
            _get_backend_fn(
                "vm",
                job_name=job_name,
                zone=config.get("zone"),
            )
            if callable(_get_backend_fn)
            else None
        )
        if backend and hasattr(backend, "cancel_job_fire_and_forget"):
            _cancel_fn = backend.cancel_job_fire_and_forget
            with ThreadPoolExecutor(max_workers=min(len(to_fire), orphan_max)) as pool:
                for job_id, zone in to_fire:
                    pool.submit(
                        _cancel_fn,
                        job_id,
                        zone,
                    )
            logger.info(
                "[AUTO_SYNC] Fired %s orphan VM deletes (recently completed: %s)",
                len(to_fire),
                deployment_id,
            )
            return len(to_fire)
    except (OSError, ValueError, RuntimeError) as e:
        logger.debug("[AUTO_SYNC] Orphan cleanup fire failed for %s: %s", deployment_id, e)
    return 0


def _collect_shard_statuses(
    deployment_id: str,
    list_objects: Callable[..., object],
    read_object_text: Callable[[str, str], str],
) -> dict[str, tuple[str, str]]:
    """Scan GCS status objects for a deployment; return {shard_id: (status, source)}."""
    status_prefix = f"deployments.{DEPLOYMENT_ENV}/{deployment_id}/"
    status_objs = [
        o
        for o in cast(list[object], list_objects(STATE_BUCKET, status_prefix))
        if "/status" in getattr(o, "name", "")
        and not str(getattr(o, "name", "")).endswith("/state.json")
    ]

    shard_statuses: dict[str, tuple[str, str]] = {}
    if status_objs:

        def _fetch(obj: object) -> tuple[str, str] | None:
            return _read_shard_status_from_obj(obj, read_object_text)

        with ThreadPoolExecutor(max_workers=min(len(status_objs), 20)) as pool:
            for result in pool.map(_fetch, status_objs):
                if result:
                    shard_statuses[result[0]] = (result[1], "gcs")
    return shard_statuses


def _find_orphan_vms_to_fire(
    shards: list[dict[str, object]],
    shard_statuses: dict[str, tuple[str, str]],
    vm_map: dict[str, object],
) -> list[tuple[str, str | None]]:
    """Find VMs that finished (GCS) but are still RUNNING; register and return them."""
    orphan_max = settings.ORPHAN_DELETE_MAX_PARALLEL
    orphan_tuples: list[tuple[str, str | None, str, tuple[str, str]]] = []
    for s in shards:
        job_id_raw = s.get("job_id")
        shard_id_raw = s.get("shard_id")
        if not job_id_raw or not shard_id_raw:
            continue
        job_id = str(job_id_raw)
        shard_id = str(shard_id_raw)
        st = shard_statuses.get(shard_id)
        if not st or st[0] not in ("succeeded", "failed"):
            continue
        if _vm_status_from_map(vm_map, job_id) == "RUNNING":
            orphan_tuples.append((job_id, _vm_zone_from_map(vm_map, job_id), shard_id, st))

    now_ts = _time.time()
    to_fire = [
        (job_id, zone)
        for job_id, zone, _shard_id, _st in orphan_tuples[:orphan_max]
        if job_id not in pending_vm_deletes
    ]
    for job_id, zone in to_fire:
        pending_vm_deletes[job_id] = (now_ts, zone)
    return to_fire


def _run_orphan_cleanup_only(
    dep_state_path: str,
    state: dict[str, object],
    list_objects: Callable[..., object],
    read_object_text: Callable[[str, str], str],
) -> int:
    """Run orphan VM cleanup only (GCS + vm_map + fire).

    No state write. Returns count fired.
    """
    config_raw: object = state.get("config") or {}
    config = cast(dict[str, object], config_raw) if isinstance(config_raw, dict) else {}
    deployment_id = dep_state_path.split("/")[1]
    compute_type = state.get("compute_type", "vm")
    if compute_type != "vm":
        return 0
    shards_raw: object = state.get("shards") or []
    shards = cast(list[dict[str, object]], shards_raw) if isinstance(shards_raw, list) else []
    service_name = cast(str, state.get("service") or "")
    if not service_name:
        return 0

    shard_statuses = _collect_shard_statuses(deployment_id, list_objects, read_object_text)
    vm_map = _build_vm_map(service_name, deployment_id)
    if vm_map is None:
        return 0

    to_fire = _find_orphan_vms_to_fire(shards, shard_statuses, vm_map)
    if not to_fire:
        return 0

    orphan_max = settings.ORPHAN_DELETE_MAX_PARALLEL
    return _fire_orphan_vm_deletes(to_fire, config, deployment_id, orphan_max)


def _load_quota_broker() -> _QuotaBrokerProtocol | None:
    """Attempt to load and instantiate the quota broker client."""
    try:
        _quota_broker_client_cls = cast(
            type[_QuotaBrokerProtocol],
            _importlib.import_module(
                "deployment_service.deployment.quota_broker_client"
            ).QuotaBrokerClient,
        )
        quota_broker = _quota_broker_client_cls()
        logger.info("[AUTO_SYNC] Quota broker initialized")
        return quota_broker
    except (OSError, ValueError, RuntimeError) as e:
        logger.info("[AUTO_SYNC] Quota broker not available: %s", e)
        return None


def _parallel_scan_active_states(
    state_paths: list[str],
    read_object_text: Callable[[str, str], str],
) -> tuple[list[tuple[str, dict[str, object]]], int]:
    """Scan state paths in parallel; return (active_states, skipped_count)."""
    active_states: list[tuple[str, dict[str, object]]] = []
    skipped = 0
    scan_start = _time.monotonic()

    with ThreadPoolExecutor(max_workers=20) as scan_pool:
        futures = {
            scan_pool.submit(_scan_one_state_path, p, read_object_text): p for p in state_paths
        }
        for future in as_completed(futures, timeout=30):
            try:
                result = future.result(timeout=10)
                if result:
                    active_states.append(result)
                else:
                    skipped += 1
            except (OSError, ValueError, RuntimeError):
                skipped += 1

    scan_elapsed = _time.monotonic() - scan_start
    logger.info(
        "[AUTO_SYNC] Scan complete in %.1fs: %s active, %s terminal/skipped",
        scan_elapsed,
        len(active_states),
        skipped,
    )
    return active_states, skipped


def sync_running_deployments() -> tuple[int, int]:
    """Execute one synchronization cycle. Returns (synced_count, active_count)."""
    logger.info("[AUTO_SYNC] Sync cycle starting...")
    _raw_client = cast(_GCSClient, get_storage_client_with_pool(PROJECT_ID))
    bucket = _raw_client.bucket(STATE_BUCKET)
    logger.info("[AUTO_SYNC] Using bucket: %s", STATE_BUCKET)
    now = datetime.now(UTC)

    # Optional centralized quota broker (Cloud Run IAM). If not configured,
    # acquire/release calls become no-ops and scheduling behaves as before.
    quota_broker = _load_quota_broker()

    # Per-deployment lock helpers: each deployment gets its own lock
    # This allows multiple instances to work on different deployments concurrently
    def try_acquire_deployment_lock(deployment_id: str) -> bool:
        return _try_acquire_deployment_lock(deployment_id, bucket, now)

    def release_deployment_lock(deployment_id: str) -> bool:
        return _release_deployment_lock(deployment_id, bucket)

    # List deployment directories via storage facade (FUSE when production)
    deployments_prefix = f"deployments.{DEPLOYMENT_ENV}/"
    logger.info("[AUTO_SYNC] Listing deployment directories (prefix=%s)...", deployments_prefix)
    try:
        from deployment_api.utils.storage_facade import (
            list_objects,
            list_prefixes,
            read_object_text,
        )

        prefixes = list_prefixes(STATE_BUCKET, deployments_prefix)
        logger.info("[AUTO_SYNC] Found %s deployment directories", len(prefixes))

        # State paths for each deployment
        state_paths = [f"{p}state.json" for p in prefixes]
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("[AUTO_SYNC] Error listing directories: %s", e)
        import traceback

        logger.error(traceback.format_exc())
        return 0, 0

    # ---- Phase 1: Parallel scan to find active deployments ----
    active_states, _skipped = _parallel_scan_active_states(state_paths, read_object_text)

    # Bind storage callables for orphan cleanup
    def run_orphan_cleanup(dep_state_path: str, state: dict[str, object]) -> int:
        return _run_orphan_cleanup_only(dep_state_path, state, list_objects, read_object_text)

    # Process deployment implementations...
    # (This would be the large _process_one_deployment function -
    # extracted separately for brevity)
    from .deployment_processor import process_deployments_batch

    synced, num_active = process_deployments_batch(
        active_states,
        cast(object, bucket),
        now,
        quota_broker,
        try_acquire_deployment_lock,
        release_deployment_lock,
        run_orphan_cleanup,
    )

    return synced, num_active


def _run_state_ttl_cleanup(current_interval: float) -> None:
    """Delete old deployment states (once per hour) to keep STATE_BUCKET bounded."""
    if not (_time.time() % 3600) < current_interval:
        return

    try:
        ttl_hours = getattr(settings, "STATE_TTL_HOURS", 48)
        cutoff = datetime.now(UTC) - timedelta(hours=ttl_hours)
        logger.info(
            "[AUTO_SYNC] State TTL cleanup: removing deployments older than %sh",
            ttl_hours,
        )

        from deployment_api.utils.storage_facade import delete_objects, list_prefixes

        deployments_prefix = f"deployments.{DEPLOYMENT_ENV}/"
        prefixes = list_prefixes(STATE_BUCKET, deployments_prefix)
        deleted_count = 0

        for dep_prefix in prefixes:
            deleted_count += _check_and_delete_old_deployment(dep_prefix, cutoff, delete_objects)

        if deleted_count > 0:
            logger.info("[AUTO_SYNC] TTL cleanup: deleted %s old deployment(s)", deleted_count)
    except (OSError, ValueError, RuntimeError) as e:
        logger.debug("[AUTO_SYNC] State TTL cleanup error: %s", e)


def _check_and_delete_old_deployment(
    dep_prefix: str,
    cutoff: datetime,
    delete_objects: Callable[..., object],
) -> int:
    """Check one deployment directory and delete if older than cutoff. Returns 1 if deleted."""
    # dep_prefix: deployments.development/{deployment-id}/
    deployment_id = dep_prefix.rstrip("/").split("/")[-1]
    state_path = f"{dep_prefix}state.json"

    try:
        from deployment_api.utils.storage_facade import get_object_metadata

        metadata = get_object_metadata(STATE_BUCKET, state_path)
        if not metadata:
            return 0

        # Check if state.json is older than TTL
        updated_raw: object = metadata.get("updated")
        updated = updated_raw if isinstance(updated_raw, datetime) else None
        if updated and updated < cutoff:
            # Delete entire deployment directory
            delete_objects(STATE_BUCKET, dep_prefix, max_results=1000)
            logger.info(
                "[AUTO_SYNC] TTL cleanup: deleted %s (age: %sd)",
                deployment_id,
                (datetime.now(UTC) - updated).days,
            )
            return 1
    except (OSError, ValueError, RuntimeError) as e:
        logger.debug("[AUTO_SYNC] TTL cleanup error for %s: %s", deployment_id, e)
    return 0


async def auto_sync_running_deployments() -> None:
    """
    Background task that periodically syncs status for running deployments.

    This ensures that when VMs complete and self-delete, their completion
    status gets persisted to state.json without manual intervention.

    Runs every 60 seconds, syncing deployments that have been "running"
    for more than 5 minutes (to avoid syncing actively-launching deployments).
    """
    sync_interval_active = getattr(
        settings, "AUTO_SYNC_INTERVAL_ACTIVE", 30
    )  # 30 = default when active; fallback for CI/package version mismatch
    sync_interval_idle = 60  # seconds when no active deployments
    current_interval = sync_interval_active  # start fast in case there's something active

    logger.info(
        "[AUTO_SYNC] Started background sync task (active_interval=%ss, idle_interval=%ss)",
        sync_interval_active,
        sync_interval_idle,
    )

    # Run first sync immediately (don't wait for interval)
    first_run = True

    while _shutdown_event is None or not _shutdown_event.is_set():
        try:
            if first_run:
                # Small delay on first run to let API fully start, but don't wait full interval
                await asyncio.sleep(5)
                first_run = False
            else:
                await asyncio.sleep(current_interval)

            if _shutdown_event is not None and _shutdown_event.is_set():
                break

            # Run GCS operations in thread pool to not block event loop
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor(max_workers=1) as executor:
                synced, num_active = await loop.run_in_executor(executor, sync_running_deployments)

            if synced > 0:
                logger.info("[AUTO_SYNC] Synced %s deployment(s)", synced)

            # State TTL cleanup: delete old deployment states (once per hour)
            # Keeps STATE_BUCKET bounded, prevents unbounded gcsfuse metadata growth
            _run_state_ttl_cleanup(current_interval)

            # Adaptive interval: fast when active, slow when idle
            if num_active > 0:
                current_interval = sync_interval_active
                logger.debug(
                    "[AUTO_SYNC] %s active → next cycle in %ss", num_active, current_interval
                )
            else:
                current_interval = sync_interval_idle
                logger.debug(
                    "[AUTO_SYNC] No active deployments → next cycle in %ss", current_interval
                )

        except asyncio.CancelledError:
            break
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("[AUTO_SYNC] Error: %s", e)

    logger.info("[AUTO_SYNC] Background sync task stopped")


# Underscore-prefixed alias so tests can call via
# `auto_sync._auto_sync_running_deployments()` or patch it directly.
_auto_sync_running_deployments = auto_sync_running_deployments


def get_background_task_handles():
    """Get references to background task handles."""
    return _background_task, _events_drain_task, _shutdown_event


def set_background_task_handles(
    background_task: asyncio.Task[None],
    events_drain_task: asyncio.Task[None],
    shutdown_event: asyncio.Event,
) -> None:
    """Set references to background task handles."""
    global _background_task, _events_drain_task, _shutdown_event
    _background_task = background_task
    _events_drain_task = events_drain_task
    _shutdown_event = shutdown_event


def get_held_deployment_locks():
    """Get the set of held deployment locks."""
    return _held_deployment_locks


def get_owner_id():
    """Get the unique owner ID for this instance."""
    return OWNER_ID
