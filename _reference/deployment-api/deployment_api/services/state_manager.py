"""
State management service for deployment synchronization.

Handles VM state tracking, deployment locks, and cleanup operations
to manage the lifecycle of deployment synchronization.
"""

import importlib as _importlib
import json
import logging
import os
import socket
import time as _time
import uuid
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor as _Tpe
from datetime import UTC, datetime, timedelta
from typing import Protocol, cast

from unified_cloud_interface import StorageClient
from unified_trading_library import get_storage_client as _get_storage_client

from deployment_api import settings
from deployment_api.utils.config_validation import ConfigurationError, ValidationUtils


class _BackendProtocol(Protocol):
    """Minimal protocol for deployment backend used in orphan cleanup."""

    def cancel_job_fire_and_forget(self, job_id: str, zone: str | None) -> None: ...


class _OrchestratorProtocol(Protocol):
    """Minimal protocol for deployment orchestrator used in orphan cleanup."""

    def get_backend(
        self, backend_type: str, job_name: str, zone: str | None
    ) -> _BackendProtocol | None: ...


logger = logging.getLogger(__name__)


def _get_vm_field(vm_map: dict[str, object], job_id: str, field: str) -> str | None:
    """Get a string field from the vm_map entry matching job_id."""
    for raw_entry in vm_map.values():
        if not isinstance(raw_entry, dict):
            continue
        entry = cast(dict[str, object], raw_entry)
        if entry.get("job_id") == job_id:
            val = entry.get(field)
            return val if isinstance(val, str) else None
    return None


def _read_vm_map(state_bucket: str, deployment_env: str, deployment_id: str) -> dict[str, object]:
    """Read VM status map from GCS."""
    from deployment_api.utils.storage_facade import read_object_text

    status_path = f"deployments.{deployment_env}/{deployment_id}/vm_status.json"
    try:
        status_raw = read_object_text(state_bucket, status_path)
        return cast(dict[str, object], json.loads(status_raw))
    except (OSError, ValueError, RuntimeError):
        return {}


def _read_shard_statuses(
    state_bucket: str,
    deployment_env: str,
    deployment_id: str,
    shards: list[dict[str, object]],
) -> dict[str, tuple[object, dict[str, object]]]:
    """Read status for each shard from GCS."""
    from deployment_api.utils.service_utils import parse_service_event
    from deployment_api.utils.storage_facade import read_object_text

    shard_statuses: dict[str, tuple[object, dict[str, object]]] = {}
    for shard in shards:
        shard_id = shard.get("shard_id")
        if not shard_id:
            continue
        path = f"deployments.{deployment_env}/{deployment_id}/shards/{shard_id}/status.txt"
        try:
            text = read_object_text(state_bucket, path)
            event_data = parse_service_event(text)
            if event_data:
                shard_statuses[str(shard_id)] = (event_data.get("status"), event_data)
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Skipping item during operation: %s", e)
    return shard_statuses


def _fire_orphan_deletes(
    orphan_tuples: "list[tuple[str, str | None, str, tuple[object, dict[str, object]]]]",
    config: dict[str, object],
    project_id: str,
    deployment_env: str,
    state_bucket: str,
    orch_cls: "Callable[..., _OrchestratorProtocol]",
) -> int:
    """Create orchestrator and fire cancel for each orphan VM. Returns count fired."""
    try:
        _sae_raw = ValidationUtils.get_required(config, "service_account_email", "orchestrator")
        _jn_raw = ValidationUtils.get_required(config, "job_name", "VM backend")
        if not isinstance(_sae_raw, str) or not isinstance(_jn_raw, str):
            logger.error("[ORPHAN_CLEANUP] Config values must be strings")
            return 0
        service_account_email: str = _sae_raw
        job_name: str = _jn_raw
    except ConfigurationError as e:
        logger.error("[ORPHAN_CLEANUP] Configuration error: %s", e)
        return 0

    region_raw = config.get("region")
    region = region_raw if isinstance(region_raw, str) else "asia-northeast1"
    zone_raw = config.get("zone")
    zone_cfg = zone_raw if isinstance(zone_raw, str) else None

    orch = orch_cls(
        project_id=project_id,
        region=region,
        service_account_email=service_account_email,
        state_bucket=state_bucket,
        state_prefix=f"deployments.{deployment_env}",
    )
    backend = orch.get_backend("vm", job_name=job_name, zone=zone_cfg)
    if backend is None:
        return 0

    max_parallel = min(len(orphan_tuples), settings.ORPHAN_DELETE_MAX_PARALLEL)
    with _Tpe(max_workers=max_parallel) as pool:
        for job_id, zone, _shard_id, _st in orphan_tuples:
            pool.submit(backend.cancel_job_fire_and_forget, job_id, zone)

    logger.info("[ORPHAN_CLEANUP] Fired %s orphan VM deletes", len(orphan_tuples))
    return len(orphan_tuples)


def _find_orphan_vms(
    shards: list[dict[str, object]],
    shard_statuses: dict[str, tuple[object, dict[str, object]]],
    vm_map: dict[str, object],
) -> list[tuple[str, str | None, str, tuple[object, dict[str, object]]]]:
    """Identify shards that are terminal but whose VM is still RUNNING."""
    orphan_tuples: list[tuple[str, str | None, str, tuple[object, dict[str, object]]]] = []
    for shard in shards:
        shard_id_raw: object = shard.get("shard_id")
        job_id_raw: object = shard.get("job_id")
        if not job_id_raw or not shard_id_raw:
            continue
        shard_id = cast(str, shard_id_raw)
        job_id = cast(str, job_id_raw)
        st = shard_statuses.get(shard_id)
        if not st or st[0] not in ("succeeded", "failed"):
            continue
        if _get_vm_field(vm_map, job_id, "status") == "RUNNING":
            zone = _get_vm_field(vm_map, job_id, "zone")
            orphan_tuples.append((job_id, zone, shard_id, st))
    return orphan_tuples


class StateManager:
    """
    Manages deployment state, locks, and VM lifecycle operations.

    This service provides:
    - Per-deployment lock management for safe concurrent operations
    - VM status tracking and orphan cleanup
    - State TTL management to prevent unbounded storage growth
    """

    def __init__(
        self,
        project_id: str | None = None,
        state_bucket: str | None = None,
        deployment_env: str | None = None,
    ):
        """Initialize state manager with configuration."""
        self.project_id = project_id or settings.gcp_project_id
        self.state_bucket = state_bucket or settings.STATE_BUCKET
        self.deployment_env = deployment_env or settings.DEPLOYMENT_ENV
        self.lock_ttl_seconds = settings.AUTO_SYNC_LOCK_TTL_SECONDS

        # Create unique owner ID for lock management
        self.owner_id = f"{socket.gethostname()}:{os.getpid()}:{uuid.uuid4().hex[:8]}"

        # Track held locks for cleanup on shutdown
        self._held_deployment_locks: set[str] = set()

        # Fire-and-forget VM delete tracking: job_id -> (timestamp, zone)
        self._pending_vm_deletes: dict[str, tuple[float, str | None] | float] = {}

    def _client(self) -> StorageClient:
        """Get UCI StorageClient for this project."""
        return _get_storage_client(project_id=self.project_id)

    @property
    def held_deployment_locks(self) -> set[str]:
        """Get the set of currently held deployment locks."""
        return self._held_deployment_locks.copy()

    def get_deployment_lock_blob_name(self, deployment_id: str) -> str:
        """Get the GCS blob name for a deployment lock."""
        return f"locks/deployment_{deployment_id}.lock"

    def try_acquire_deployment_lock(self, deployment_id: str) -> bool:
        """
        Acquire lock for a specific deployment.

        Uses conditional uploads to prevent race conditions.
        Supports lock renewal if already owned by this instance.

        Args:
            deployment_id: Unique identifier for the deployment

        Returns:
            True if lock was acquired, False otherwise
        """
        lock_blob_name = self.get_deployment_lock_blob_name(deployment_id)
        now = datetime.now(UTC)
        client = self._client()

        payload = {
            "owner": self.owner_id,
            "deployment_id": deployment_id,
            "acquired_at": now.isoformat(),
            "expires_at": now.timestamp() + self.lock_ttl_seconds,
        }

        try:
            # Fast path: try to upload (will overwrite if exists — GCS conditional
            # upload via native API not available via UCI, so we use existence check)
            if not client.blob_exists(self.state_bucket, lock_blob_name):
                client.upload_bytes(
                    self.state_bucket,
                    lock_blob_name,
                    json.dumps(payload).encode("utf-8"),
                    content_type="application/json",
                )
                self._held_deployment_locks.add(deployment_id)
                return True

            # Lock exists: read it and check expiry/ownership
            try:
                raw_bytes = client.download_bytes(self.state_bucket, lock_blob_name)
                existing_payload: dict[str, object] = cast(
                    dict[str, object], json.loads(raw_bytes.decode("utf-8"))
                )
            except (OSError, ValueError, RuntimeError):
                existing_payload = {}

            expires_at_raw: object = existing_payload.get("expires_at", 0)
            expires_at = (
                float(cast(float, expires_at_raw))
                if isinstance(expires_at_raw, (int, float))
                else 0.0
            )
            owner_raw: object = existing_payload.get("owner")
            owner: str | None = owner_raw if isinstance(owner_raw, str) else None

            # Allow renewal if we already own the lock or it's expired
            is_expired = expires_at <= now.timestamp()
            if not is_expired and owner != self.owner_id:
                return False

            new_payload = {
                "owner": self.owner_id,
                "deployment_id": deployment_id,
                "acquired_at": now.isoformat(),
                "expires_at": now.timestamp() + self.lock_ttl_seconds,
                "prev_owner": owner,
            }

            client.upload_bytes(
                self.state_bucket,
                lock_blob_name,
                json.dumps(new_payload).encode("utf-8"),
                content_type="application/json",
            )
            self._held_deployment_locks.add(deployment_id)
            return True

        except (OSError, ValueError, RuntimeError):
            return False

    def release_deployment_lock(self, deployment_id: str) -> bool:
        """
        Release lock for a specific deployment.

        Only succeeds if the lock is owned by this instance.

        Args:
            deployment_id: Unique identifier for the deployment

        Returns:
            True if lock was released, False otherwise
        """
        lock_blob_name = self.get_deployment_lock_blob_name(deployment_id)
        client = self._client()

        try:
            if client.blob_exists(self.state_bucket, lock_blob_name):
                raw_bytes = client.download_bytes(self.state_bucket, lock_blob_name)
                lock_data = cast(dict[str, object], json.loads(raw_bytes.decode("utf-8") or "{}"))
                if lock_data.get("owner") == self.owner_id:
                    client.delete_blob(self.state_bucket, lock_blob_name)
                    self._held_deployment_locks.discard(deployment_id)
                    return True
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Unexpected error during release deployment lock: %s", e, exc_info=True)

        self._held_deployment_locks.discard(deployment_id)
        return False

    def run_orphan_cleanup_only(self, state: dict[str, object]) -> int:
        """
        Run orphan VM cleanup for a completed deployment.

        Terminates VMs that are still running after their shards completed.

        Args:
            state: Deployment state dictionary

        Returns:
            Number of orphan VMs fired for deletion
        """
        if state.get("compute_type") != "vm":
            return 0

        config_raw: object = state.get("config") or {}
        config = cast(dict[str, object], config_raw) if isinstance(config_raw, dict) else {}
        shards_raw: object = state.get("shards") or []
        shards = cast(list[dict[str, object]], shards_raw) if isinstance(shards_raw, list) else []

        if not shards:
            return 0

        deployment_id = cast(str, state.get("deployment_id") or "")
        try:
            vm_map = _read_vm_map(self.state_bucket, self.deployment_env, deployment_id)
            shard_statuses = _read_shard_statuses(
                self.state_bucket, self.deployment_env, deployment_id, shards
            )
            orphan_tuples = _find_orphan_vms(shards, shard_statuses, vm_map)

            if orphan_tuples:
                try:
                    _raw_module = _importlib.import_module(
                        "deployment_service.deployment.orchestrator"
                    )
                    orch_cls = cast(
                        Callable[..., _OrchestratorProtocol], _raw_module.DeploymentOrchestrator
                    )
                    return _fire_orphan_deletes(
                        orphan_tuples,
                        config,
                        self.project_id,
                        self.deployment_env,
                        self.state_bucket,
                        orch_cls,
                    )
                except (OSError, ValueError, RuntimeError) as e:
                    logger.debug("[ORPHAN_CLEANUP] VM fire-and-forget failed: %s", e)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("[ORPHAN_CLEANUP] Error during cleanup: %s", e)

        return 0

    def track_pending_vm_delete(self, job_id: str, zone: str | None = None) -> None:
        """Track a VM deletion request for retry logic."""
        self._pending_vm_deletes[job_id] = (_time.time(), zone)

    def cleanup_pending_vm_deletes(self, vm_map: dict[str, object]) -> None:
        """Clean up pending VM deletes that are no longer in the VM map."""
        for jid in list(self._pending_vm_deletes.keys()):
            if jid not in vm_map:
                del self._pending_vm_deletes[jid]

    def get_retry_vm_deletes(self, vm_map: dict[str, object]) -> list[str]:
        """Get job IDs that should be retried for deletion."""
        now_ts = _time.time()
        retry_seconds = settings.ORPHAN_DELETE_RETRY_SECONDS

        def pending_ts(p: tuple[float, str | None] | float) -> float:
            return p[0] if isinstance(p, tuple) else p

        return [
            jid
            for jid, val in self._pending_vm_deletes.items()
            if (
                now_ts - pending_ts(val) >= retry_seconds
                and _get_vm_field(vm_map, jid, "status") == "RUNNING"
            )
        ]

    def cleanup_state_ttl(self) -> int:
        """
        Clean up old deployment states based on TTL.

        Simplified implementation using UCI StorageClient operations.

        Returns:
            Number of deployments deleted
        """
        try:
            ttl_hours = getattr(settings, "STATE_TTL_HOURS", 48)
            cutoff = datetime.now(UTC) - timedelta(hours=ttl_hours)

            logger.info("[STATE_TTL] Cleanup: removing deployments older than %sh", ttl_hours)

            client = self._client()
            deployments_prefix = f"deployments.{self.deployment_env}/"
            deleted_count = 0

            # List all state.json blobs and check their metadata via get_blob_metadata
            for blob_meta in client.list_blobs(self.state_bucket, prefix=deployments_prefix):
                if not blob_meta.name.endswith("/state.json"):
                    continue

                try:
                    # Parse last_modified from metadata string
                    last_modified_str: str = blob_meta.last_modified or ""
                    if not last_modified_str:
                        continue

                    # Parse ISO format last_modified
                    try:
                        blob_dt = datetime.fromisoformat(last_modified_str.replace("Z", "+00:00"))
                    except ValueError:
                        continue

                    if blob_dt < cutoff:
                        # Extract deployment ID from path
                        parts = blob_meta.name.split("/")
                        if len(parts) >= 3:
                            deployment_id = parts[-2]

                            # Delete entire deployment directory
                            dep_prefix = "/".join(parts[:-1]) + "/"
                            blobs_to_delete = list(
                                client.list_blobs(self.state_bucket, prefix=dep_prefix)
                            )

                            deleted_paths = [b.name for b in blobs_to_delete[:1000]]
                            client.delete_blobs(self.state_bucket, deleted_paths)

                            deleted_count += 1
                            age_days = (datetime.now(UTC) - blob_dt).days
                            logger.info(
                                "[STATE_TTL] Deleted %s (age: %sd)", deployment_id, age_days
                            )

                except (OSError, ValueError, RuntimeError) as e:
                    logger.debug("[STATE_TTL] Error processing blob %s: %s", blob_meta.name, e)

            if deleted_count > 0:
                logger.info("[STATE_TTL] Deleted %s old deployment(s)", deleted_count)

            return deleted_count

        except (OSError, ValueError, RuntimeError) as e:
            logger.debug("[STATE_TTL] Cleanup error: %s", e)
            return 0

    def release_all_locks(self) -> int:
        """
        Release all locks held by this instance.

        Used during graceful shutdown to clean up resources.

        Returns:
            Number of locks released
        """
        try:
            client = self._client()
            released_count = 0

            for deployment_id in list(self._held_deployment_locks):
                try:
                    lock_blob_name = self.get_deployment_lock_blob_name(deployment_id)

                    if client.blob_exists(self.state_bucket, lock_blob_name):
                        raw_bytes = client.download_bytes(self.state_bucket, lock_blob_name)
                        lock_data = cast(
                            dict[str, object],
                            json.loads(raw_bytes.decode("utf-8") or "{}"),
                        )
                        if lock_data.get("owner") == self.owner_id:
                            client.delete_blob(self.state_bucket, lock_blob_name)
                            released_count += 1

                except (OSError, ValueError, RuntimeError):
                    pass  # Lock may have been taken by another instance

                self._held_deployment_locks.discard(deployment_id)

            return released_count

        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("[SHUTDOWN] Could not release locks: %s", e)
            return 0
