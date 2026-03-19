"""
Event processing service for deployment synchronization.

Handles VM status updates, Cloud Run execution monitoring, and shard
status processing for deployment state management.
"""

import asyncio as _asyncio
import importlib as _importlib
import json
import logging
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor as _Tpe
from datetime import UTC, datetime
from typing import cast

from deployment_api import settings
from deployment_api.clients import deployment_service_client as _ds_client
from deployment_api.utils.config_validation import ConfigurationError, ValidationUtils
from deployment_api.utils.service_utils import parse_service_event, update_shard_state_from_event
from deployment_api.utils.storage_facade import read_object_text

logger = logging.getLogger(__name__)


class EventProcessor:
    """
    Processes deployment events and status updates.

    This service handles:
    - VM status monitoring and updates
    - Cloud Run execution tracking
    - Shard status processing and state updates
    - Event-driven state transitions
    """

    def __init__(
        self,
        project_id: str | None = None,
        state_bucket: str | None = None,
        deployment_env: str | None = None,
    ):
        """Initialize event processor with configuration."""
        self.project_id = project_id or settings.gcp_project_id
        self.state_bucket = state_bucket or settings.STATE_BUCKET
        self.deployment_env = deployment_env or settings.DEPLOYMENT_ENV

    def read_vm_status_map(self, deployment_id: str) -> dict[str, object]:
        """
        Read VM status map for a deployment.

        Args:
            deployment_id: Unique identifier for the deployment

        Returns:
            Dictionary mapping VM instances to their status
        """
        status_path = f"deployments.{self.deployment_env}/{deployment_id}/vm_status.json"
        try:
            status_raw = read_object_text(self.state_bucket, status_path)
            return cast(dict[str, object], json.loads(status_raw))
        except OSError as e:
            logger.warning("Failed to read VM status map for deployment %s: %s", deployment_id, e)
            return {}
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("Invalid JSON in VM status map for deployment %s: %s", deployment_id, e)
            return {}
        except RuntimeError as e:
            logger.error(
                "Unexpected error reading VM status map for deployment %s: %s", deployment_id, e
            )
            return {}

    def read_shard_statuses(
        self, deployment_id: str, shards: list[dict[str, object]]
    ) -> dict[str, tuple[str, dict[str, object]]]:
        """
        Read status for all shards in a deployment.

        Args:
            deployment_id: Unique identifier for the deployment
            shards: List of shard configurations

        Returns:
            Dictionary mapping shard_id to (status, event_data) tuples
        """
        shard_statuses: dict[str, tuple[str, dict[str, object]]] = {}

        for shard in shards:
            shard_id_raw = shard.get("shard_id")
            shard_id = str(shard_id_raw) if shard_id_raw is not None else ""
            if not shard_id:
                continue

            status_obj_path = (
                f"deployments.{self.deployment_env}/{deployment_id}/shards/{shard_id}/status.txt"
            )
            try:
                status_text = read_object_text(self.state_bucket, status_obj_path)
                event_data = parse_service_event(status_text)
                if event_data:
                    status_raw = event_data.get("status")
                    status_str = str(status_raw) if status_raw is not None else "unknown"
                    shard_statuses[shard_id] = (status_str, event_data)
            except OSError as e:
                logger.warning("Failed to read shard status for %s: %s", shard_id, e)
                continue
            except (ValueError, KeyError) as e:
                logger.warning("Invalid shard status data for %s: %s", shard_id, e)
                continue
            except RuntimeError as e:
                logger.warning("Unexpected error reading shard status for %s: %s", shard_id, e)
                continue

        return shard_statuses

    def get_vm_status(self, vm_map: dict[str, object], job_id: str) -> str | None:
        """Get VM status from VM map."""
        for entry in vm_map.values():
            if isinstance(entry, dict):
                entry_dict = cast(dict[str, object], entry)
                if entry_dict.get("job_id") == job_id:
                    raw = entry_dict.get("status")
                    return str(raw) if raw is not None else None
        return None

    def get_vm_zone(self, vm_map: dict[str, object], job_id: str) -> str | None:
        """Get VM zone from VM map."""
        for entry in vm_map.values():
            if isinstance(entry, dict):
                entry_dict = cast(dict[str, object], entry)
                if entry_dict.get("job_id") == job_id:
                    raw = entry_dict.get("zone")
                    return str(raw) if raw is not None else None
        return None

    def process_vm_updates(
        self,
        deployment_id: str,
        state: dict[str, object],
        vm_map: dict[str, object],
        shard_statuses: dict[str, tuple[str, dict[str, object]]],
    ) -> tuple[bool, int]:
        """
        Process VM status updates for a deployment.

        Args:
            deployment_id: Unique identifier for the deployment
            state: Current deployment state
            vm_map: VM status mapping
            shard_statuses: Shard status mapping

        Returns:
            Tuple of (updated, launched_count) indicating if state was updated
            and how many new VMs were launched
        """
        updated = False
        launched_this_tick = 0
        shards_raw: object = state.get("shards") or []
        shards = cast(list[dict[str, object]], shards_raw) if isinstance(shards_raw, list) else []

        # Process shard status updates
        for shard in shards:
            shard_id_r: object = shard.get("shard_id")
            if not shard_id_r:
                continue
            shard_id = cast(str, shard_id_r)

            job_id_r: object = shard.get("job_id")
            if not job_id_r:
                continue
            job_id = cast(str, job_id_r)

            # Update shard status from events
            if shard_id in shard_statuses:
                _status, event_data = shard_statuses[shard_id]
                old_status = shard.get("status")
                new_shard_data = update_shard_state_from_event(shard, event_data)

                if new_shard_data != shard:
                    # Update shard in place
                    for key, value in new_shard_data.items():
                        shard[key] = value
                    updated = True

                    if old_status != shard.get("status"):
                        logger.info(
                            "[EVENT_PROCESSOR] %s: Shard %s %s → %s",
                            deployment_id,
                            shard_id,
                            old_status,
                            shard.get("status"),
                        )

            # Check for VM status changes
            current_vm_status = self.get_vm_status(vm_map, job_id)
            if current_vm_status and shard.get("vm_status") != current_vm_status:
                shard["vm_status"] = current_vm_status
                updated = True
                logger.debug(
                    "[EVENT_PROCESSOR] %s: Shard %s VM status → %s",
                    deployment_id,
                    shard_id,
                    current_vm_status,
                )

        return updated, launched_this_tick

    def _parse_exec_name(self, name: str) -> tuple[str | None, str | None]:
        """Parse Cloud Run execution name to extract region and job_name."""
        parts = name.split("/")
        region: str | None = None
        job_name: str | None = None
        for i, p in enumerate(parts):
            if p == "locations" and i + 1 < len(parts):
                region = parts[i + 1]
            if p == "jobs" and i + 1 < len(parts):
                job_name = parts[i + 1]
        return region, job_name

    def _update_shard_from_cr_status(
        self,
        deployment_id: str,
        shards: list[dict[str, object]],
        shard_id: str,
        status: str,
    ) -> bool:
        """Update a single shard's status from Cloud Run execution status.

        Returns True if the shard status changed.
        """
        for shard in shards:
            if shard.get("shard_id") != shard_id:
                continue
            old_status = shard.get("status")
            if status == "SUCCEEDED":
                shard["status"] = "succeeded"
                shard["completed_at"] = datetime.now(UTC).isoformat()
            elif status == "FAILED":
                shard["status"] = "failed"
                shard["completed_at"] = datetime.now(UTC).isoformat()
            elif status == "CANCELLED":
                shard["status"] = "cancelled"
                shard["completed_at"] = datetime.now(UTC).isoformat()
            if old_status != shard.get("status"):
                logger.info(
                    "[EVENT_PROCESSOR] %s: Cloud Run shard %s %s -> %s",
                    deployment_id,
                    shard_id,
                    old_status,
                    shard.get("status"),
                )
                return True
            break
        return False

    def _collect_running_job_ids(
        self,
        shards: list[dict[str, object]],
        shard_statuses: dict[str, tuple[str, dict[str, object]]],
    ) -> tuple[list[str], dict[str, str]]:
        """Collect job IDs for running shards not yet in shard_statuses."""
        job_ids: list[str] = []
        job_id_to_shard_id: dict[str, str] = {}
        for shard in shards:
            if shard.get("status") != "running":
                continue
            shard_id_raw = shard.get("shard_id")
            shard_id_s = str(shard_id_raw) if shard_id_raw is not None else ""
            if not shard_id_s or shard_id_s in shard_statuses:
                continue
            job_id_raw = shard.get("job_id")
            job_id_s = str(job_id_raw) if job_id_raw is not None else ""
            if not job_id_s:
                continue
            job_ids.append(job_id_s)
            job_id_to_shard_id[job_id_s] = shard_id_s
        return job_ids, job_id_to_shard_id

    def _apply_cr_status_groups(
        self,
        deployment_id: str,
        shards: list[dict[str, object]],
        job_ids: list[str],
        job_id_to_shard_id: dict[str, str],
        config: dict[str, object],
        service_account_email: str,
    ) -> bool:
        """Fetch Cloud Run statuses by region/job group and apply to shards."""
        groups: dict[tuple[str, str], list[str]] = {}
        for job_id in job_ids[:50]:
            r, j = self._parse_exec_name(job_id)
            r = r or cast(str, config.get("region") or "asia-northeast1")
            j = j or cast(str, config.get("job_name") or "unknown")
            groups.setdefault((r, j), []).append(job_id)

        updated = False
        for (region, job_name), group_job_ids in groups.items():
            try:
                raw_statuses = _asyncio.run(
                    _ds_client.get_cloud_run_status_batch(
                        project_id=self.project_id,
                        region=region,
                        service_account_email=service_account_email,
                        job_name=job_name,
                        job_ids=group_job_ids,
                    )
                )
            except (OSError, ValueError, RuntimeError) as e:
                logger.debug(
                    "[EVENT_PROCESSOR] Cloud Run status batch failed for %s/%s: %s",
                    region,
                    job_name,
                    e,
                )
                continue
            for job_id, status in raw_statuses.items():
                shard_id = job_id_to_shard_id.get(job_id)
                if not shard_id:
                    continue
                if self._update_shard_from_cr_status(deployment_id, shards, shard_id, status):
                    updated = True
        return updated

    def process_cloud_run_updates(
        self,
        deployment_id: str,
        state: dict[str, object],
        shard_statuses: dict[str, tuple[str, dict[str, object]]],
    ) -> bool:
        """
        Process Cloud Run execution updates for a deployment.

        Returns True if state was updated, False otherwise.
        """
        try:
            shards_raw2: object = state.get("shards") or []
            shards = (
                cast(list[dict[str, object]], shards_raw2) if isinstance(shards_raw2, list) else []
            )
            config_raw2: object = state.get("config") or {}
            config = cast(dict[str, object], config_raw2) if isinstance(config_raw2, dict) else {}

            job_ids, job_id_to_shard_id = self._collect_running_job_ids(shards, shard_statuses)
            if not job_ids:
                return False

            try:
                service_account_email = str(
                    ValidationUtils.get_required(
                        config, "service_account_email", "Cloud Run backend"
                    )
                )
            except ConfigurationError as e:
                logger.error("[EVENT_PROCESSOR] %s: %s", deployment_id, e)
                return False

            return self._apply_cr_status_groups(
                deployment_id, shards, job_ids, job_id_to_shard_id, config, service_account_email
            )

        except (OSError, ValueError, RuntimeError) as e:
            logger.debug("[EVENT_PROCESSOR] Cloud Run update error: %s", e)
            return False

    def process_orphan_vm_cleanup(
        self,
        deployment_id: str,
        state: dict[str, object],
        vm_map: dict[str, object],
        shard_statuses: dict[str, tuple[str, dict[str, object]]],
        pending_vm_deletes: dict[str, object],
    ) -> int:
        """
        Process orphan VM cleanup for completed shards.

        Args:
            deployment_id: Unique identifier for the deployment
            state: Current deployment state
            vm_map: VM status mapping
            shard_statuses: Shard status mapping
            pending_vm_deletes: Tracking for pending deletions

        Returns:
            Number of orphan VMs fired for deletion
        """
        if state.get("compute_type") != "vm":
            return 0

        config_raw3: object = state.get("config") or {}
        config = cast(dict[str, object], config_raw3) if isinstance(config_raw3, dict) else {}
        shards_raw3: object = state.get("shards") or []
        shards = cast(list[dict[str, object]], shards_raw3) if isinstance(shards_raw3, list) else []

        if not shards:
            return 0

        try:
            orphan_tuples: list[tuple[str, str | None, str, tuple[str, dict[str, object]]]] = []
            for shard in shards:
                shard_id_raw2: object = shard.get("shard_id")
                job_id_raw2: object = shard.get("job_id")
                if not job_id_raw2 or not shard_id_raw2:
                    continue
                shard_id = cast(str, shard_id_raw2)
                job_id = cast(str, job_id_raw2)
                st = shard_statuses.get(shard_id)
                if not st or st[0] not in ("succeeded", "failed"):
                    continue
                if self.get_vm_status(vm_map, job_id) == "RUNNING":
                    zone = self.get_vm_zone(vm_map, job_id)
                    orphan_tuples.append((job_id, zone, shard_id, st))

            if not orphan_tuples:
                return 0

            return self._fire_orphan_cleanup(
                deployment_id, config, orphan_tuples, pending_vm_deletes
            )

        except (OSError, ValueError, RuntimeError) as e:
            logger.debug("[EVENT_PROCESSOR] Orphan cleanup failed: %s", e)

        return 0

    def _fire_orphan_cleanup(
        self,
        deployment_id: str,
        config: dict[str, object],
        orphan_tuples: list[tuple[str, str | None, str, tuple[str, dict[str, object]]]],
        pending_vm_deletes: dict[str, object],
    ) -> int:
        """Create orchestrator backend and fire cancel for each orphan VM."""
        _orchestrator_cls = cast(
            type[object],
            _importlib.import_module(
                "deployment_service.deployment.orchestrator"
            ).DeploymentOrchestrator,
        )

        try:
            service_account_email = str(
                ValidationUtils.get_required(config, "service_account_email", "VM orchestrator")
            )
            job_name = str(ValidationUtils.get_required(config, "job_name", "VM backend"))
        except ConfigurationError as e:
            logger.error("[EVENT_PROCESSOR] Orphan cleanup failed: %s", e)
            return 0

        _orch_factory = cast(Callable[..., object], _orchestrator_cls)
        orch = _orch_factory(
            project_id=self.project_id,
            region=config.get("region") or "asia-northeast1",
            service_account_email=service_account_email,
            state_bucket=self.state_bucket,
            state_prefix=f"deployments.{self.deployment_env}",
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

        if not backend or not hasattr(backend, "cancel_job_fire_and_forget"):
            return 0

        _cancel_fn = backend.cancel_job_fire_and_forget
        max_parallel = min(len(orphan_tuples), settings.ORPHAN_DELETE_MAX_PARALLEL)
        with _Tpe(max_workers=max_parallel) as pool:
            for job_id, zone, _shard_id, _st in orphan_tuples:
                pool.submit(_cancel_fn, job_id, zone)
                pending_vm_deletes[job_id] = (datetime.now(UTC).timestamp(), zone)

        logger.info("[EVENT_PROCESSOR] Fired %s orphan VM deletes", len(orphan_tuples))
        return len(orphan_tuples)

    def notify_deployment_updated(self, deployment_id: str) -> None:
        """
        Send deployment update notification.

        Args:
            deployment_id: Unique identifier for the deployment
        """
        try:
            from deployment_api.utils.deployment_events import notify_deployment_updated_sync

            notify_deployment_updated_sync(deployment_id)
        except (OSError, ValueError, RuntimeError):
            pass  # Notification is best-effort

    def check_all_shards_terminal(self, shards: list[dict[str, object]]) -> tuple[bool, bool]:
        """
        Check if all shards have reached terminal states.

        Args:
            shards: List of shard configurations

        Returns:
            Tuple of (all_terminal, has_failures)
        """
        terminal_states = ["succeeded", "failed", "cancelled"]
        all_terminal = all(s.get("status") in terminal_states for s in shards)
        has_failures = any(s.get("status") == "failed" for s in shards)

        return all_terminal, has_failures

    def update_deployment_status(
        self, state: dict[str, object], all_terminal: bool, has_failures: bool, now: datetime
    ) -> bool:
        """
        Update overall deployment status based on shard states.

        Args:
            state: Current deployment state
            all_terminal: True if all shards are in terminal states
            has_failures: True if any shards failed
            now: Current timestamp

        Returns:
            True if status was updated, False otherwise
        """
        if not all_terminal:
            return False

        compute_type = state.get("compute_type")
        old_status = state.get("status")

        if has_failures:
            new_status = "failed"
        elif compute_type == "vm":
            # VM: use completed_pending_delete until no RUNNING VMs (then -> completed)
            new_status = "completed_pending_delete"
        else:
            new_status = "completed"

        if old_status != new_status:
            state["status"] = new_status
            state["completed_at"] = now.isoformat()
            state["updated_at"] = now.isoformat()
            return True

        return False
