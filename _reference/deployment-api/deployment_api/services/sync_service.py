"""
Core synchronization service for deployment management.

Orchestrates the synchronization of running deployments, coordinating
state management, event processing, and scheduling operations.
"""

import importlib as _importlib
import json
import logging
import time as _time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from typing import cast

from deployment_api import settings
from deployment_api.utils.config_validation import ConfigurationError, ValidationUtils
from deployment_api.utils.storage_facade import list_objects, read_object_text, write_object_text

from .event_processor import EventProcessor
from .state_manager import StateManager

logger = logging.getLogger(__name__)


def _save_and_notify(
    save_fn: "Callable[[str, dict[str, object]], bool]",
    notify_fn: "Callable[[str], None]",
    state_path: str,
    state: dict[str, object],
    deployment_id: str,
    launched_this_tick: int,
) -> bool:
    """Save deployment state and send update notification. Returns True on success."""
    if save_fn(state_path, state):
        notify_fn(deployment_id)
        if launched_this_tick > 0:
            logger.info(
                "[SYNC_SERVICE] Updated %s (launched %s)", deployment_id, launched_this_tick
            )
        else:
            logger.info("[SYNC_SERVICE] Updated %s", deployment_id)
        return True
    logger.error("[SYNC_SERVICE] Failed to save state for %s", deployment_id)
    return False


class SyncService:
    """
    Core synchronization service for deployment management.

    This service orchestrates:
    - Scanning and identifying active deployments
    - Coordinating state updates through event processing
    - Managing concurrent deployment processing
    - Scheduling new shards for pending deployments
    """

    def __init__(
        self,
        project_id: str | None = None,
        state_bucket: str | None = None,
        deployment_env: str | None = None,
    ):
        """Initialize sync service with configuration."""
        self.project_id = project_id or settings.gcp_project_id
        self.state_bucket = state_bucket or settings.STATE_BUCKET
        self.deployment_env = deployment_env or settings.DEPLOYMENT_ENV

        # Initialize composed services
        self.state_manager = StateManager(project_id, state_bucket, deployment_env)
        self.event_processor = EventProcessor(project_id, state_bucket, deployment_env)

        # Quota broker (optional)
        self.quota_broker = self._initialize_quota_broker()

    def _initialize_quota_broker(self):
        """Initialize quota broker if available."""
        try:
            _quota_broker_client_cls = cast(
                type[object],
                _importlib.import_module(
                    "deployment_service.deployment.quota_broker_client"
                ).QuotaBrokerClient,
            )

            return _quota_broker_client_cls()
        except (OSError, ValueError, RuntimeError) as e:
            logger.info("[SYNC_SERVICE] Quota broker not available: %s", e)
            return None

    def scan_deployment_states(self) -> list[str]:
        """
        Scan for all deployment state files.

        Returns:
            List of state file paths for active deployments
        """
        deployments_prefix = f"deployments.{self.deployment_env}/"

        def scan_one(path: str) -> list[str]:
            """Scan a single path for state files."""
            objects = list_objects(self.state_bucket, path, max_results=1000)
            return [obj.name for obj in objects if obj.name.endswith("/state.json")]

        try:
            # Get all state.json files under deployments prefix
            state_paths = scan_one(deployments_prefix)
            logger.debug("[SYNC_SERVICE] Found %s deployment state files", len(state_paths))
            return state_paths
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("[SYNC_SERVICE] Error scanning deployments: %s", e)
            return []

    def load_deployment_state(self, state_path: str) -> dict[str, object] | None:
        """
        Load deployment state from storage.

        Args:
            state_path: Path to the state.json file

        Returns:
            Deployment state dictionary or None if error
        """
        try:
            raw = read_object_text(self.state_bucket, state_path)
            return cast(dict[str, object], json.loads(raw))
        except (OSError, ValueError, RuntimeError) as e:
            logger.debug("[SYNC_SERVICE] Error loading %s: %s", state_path, e)
            return None

    def save_deployment_state(self, state_path: str, state: dict[str, object]) -> bool:
        """
        Save deployment state to storage.

        Args:
            state_path: Path to the state.json file
            state: Deployment state dictionary

        Returns:
            True if saved successfully, False otherwise
        """
        try:
            write_object_text(self.state_bucket, state_path, json.dumps(state, indent=2))
            return True
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("[SYNC_SERVICE] Error saving %s: %s", state_path, e)
            return False

    def filter_active_deployments(
        self, state_paths: list[str], min_age_minutes: int = 5
    ) -> list[tuple[str, dict[str, object]]]:
        """
        Filter for active deployments that need synchronization.

        Args:
            state_paths: List of state file paths
            min_age_minutes: Minimum age to avoid syncing actively-launching deployments

        Returns:
            List of (state_path, state_dict) tuples for active deployments
        """
        active_states: list[tuple[str, dict[str, object]]] = []
        cutoff = datetime.now(UTC) - timedelta(minutes=min_age_minutes)

        for state_path in state_paths:
            state = self.load_deployment_state(state_path)
            if not state:
                continue

            # Skip if not in a syncable state
            status = state.get("status")
            if status not in ("pending", "running"):
                continue

            # Skip if too recently created (avoid syncing actively-launching deployments)
            created_at_raw = state.get("created_at")
            created_at_str = str(created_at_raw) if created_at_raw is not None else None
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    if created_at.tzinfo is None:
                        created_at = created_at.replace(tzinfo=UTC)
                    if created_at > cutoff:
                        continue
                except (ValueError, TypeError) as e:
                    logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)
                    pass

            active_states.append((state_path, state))

        logger.debug("[SYNC_SERVICE] Found %s active deployments to sync", len(active_states))
        return active_states

    def process_deployment(self, state_path: str, state: dict[str, object]) -> bool:
        """
        Process a single deployment for synchronization.

        Args:
            state_path: Path to the state.json file
            state: Deployment state dictionary

        Returns:
            True if deployment was updated, False otherwise
        """
        deployment_id_raw: object = state.get("deployment_id")
        if not deployment_id_raw or not isinstance(deployment_id_raw, str):
            return False
        deployment_id = deployment_id_raw

        # Try to acquire lock for this deployment
        if not self.state_manager.try_acquire_deployment_lock(deployment_id):
            logger.debug("[SYNC_SERVICE] Skipping %s (locked by another instance)", deployment_id)
            return False

        try:
            return self._process_deployment_locked(deployment_id, state_path, state)
        finally:
            # Always release lock after processing
            self.state_manager.release_deployment_lock(deployment_id)

    def _acquire_and_launch(  # noqa: C901
        self,
        deployment_id: str,
        config: dict[str, object],
        shards_to_launch: list[dict[str, object]],
    ) -> int:
        """Acquire quota and launch pending shards. Returns count launched."""
        from deployment_api.utils.quota_requirements import vm_quota_shape_from_compute_config

        _orchestrator_cls = cast(
            type[object],
            _importlib.import_module(
                "deployment_service.deployment.orchestrator"
            ).DeploymentOrchestrator,
        )

        quota_shape = vm_quota_shape_from_compute_config(config)
        if not quota_shape:
            return 0

        batch_size = min(len(shards_to_launch), settings.DEFAULT_MAX_CONCURRENT)
        _broker = self.quota_broker
        if _broker is None:
            return 0
        _try_acquire: object = getattr(_broker, "try_acquire_batch", None)
        if not callable(_try_acquire):
            return 0
        acquired = int(_try_acquire(quota_shape, batch_size))
        if acquired == 0:
            logger.debug("[SYNC_SERVICE] %s: No quota available for scheduling", deployment_id)
            return 0

        try:
            service_account_email = str(
                ValidationUtils.get_required(
                    config, "service_account_email", "deployment orchestrator"
                )
            )
        except ConfigurationError as e:
            logger.error("[SYNC_SERVICE] %s: %s", deployment_id, e)
            return 0

        _orch_factory = cast(Callable[..., object], _orchestrator_cls)
        orch = _orch_factory(
            project_id=self.project_id,
            region=config.get("region") or "asia-northeast1",
            service_account_email=service_account_email,
            state_bucket=self.state_bucket,
            state_prefix=f"deployments.{self.deployment_env}",
        )

        launched = 0
        launch_start = _time.time()
        for i in range(min(acquired, len(shards_to_launch))):
            shard = shards_to_launch[i]
            try:
                _submit_fn: object = getattr(orch, "submit_shard", None)
                job_id = _submit_fn(shard, config) if callable(_submit_fn) else None
                if job_id:
                    shard["job_id"] = job_id
                    shard["status"] = "running"
                    shard["started_at"] = datetime.now(UTC).isoformat()
                    launched += 1
            except (OSError, ValueError, RuntimeError) as e:
                logger.error(
                    "[SYNC_SERVICE] Error launching shard %s: %s", shard.get("shard_id"), e
                )
                _release_fn: object = getattr(self.quota_broker, "release", None)
                if callable(_release_fn):
                    _release_fn(quota_shape, 1)

        if launched > 0:
            elapsed = _time.time() - launch_start
            vms_per_min = launched / (elapsed / 60) if elapsed > 0 else 0
            logger.info(
                "[SYNC_SERVICE] %s: Launched %s shards in %.1fs (%.0f shards/min)",
                deployment_id,
                launched,
                elapsed,
                vms_per_min,
            )
        return launched

    def _dispatch_compute_updates(
        self,
        compute_type: str,
        deployment_id: str,
        state: dict[str, object],
        shards: list[dict[str, object]],
        shard_statuses: dict[str, tuple[str, dict[str, object]]],
    ) -> tuple[bool, int]:
        """Dispatch status updates for VM or Cloud Run compute types."""
        updated = False
        launched_this_tick = 0
        if compute_type == "vm":
            vm_map = self.event_processor.read_vm_status_map(deployment_id)
            vm_updated, vm_launched = self.event_processor.process_vm_updates(
                deployment_id, state, vm_map, shard_statuses
            )
            updated = updated or vm_updated
            launched_this_tick += vm_launched
            orphan_count = self.event_processor.process_orphan_vm_cleanup(
                deployment_id,
                state,
                vm_map,
                shard_statuses,
                cast(dict[str, object], getattr(self.state_manager, "_pending_vm_deletes", {})),
            )
            if orphan_count > 0:
                logger.info(
                    "[SYNC_SERVICE] %s: Fired %s orphan VM deletes", deployment_id, orphan_count
                )
        elif compute_type == "cloud_run":
            updated = updated or self.event_processor.process_cloud_run_updates(
                deployment_id, state, shard_statuses
            )
        return updated, launched_this_tick

    def _process_deployment_locked(
        self, deployment_id: str, state_path: str, state: dict[str, object]
    ) -> bool:
        """
        Process a deployment while holding its lock.

        Args:
            deployment_id: Unique identifier for the deployment
            state_path: Path to the state.json file
            state: Deployment state dictionary

        Returns:
            True if deployment was updated, False otherwise
        """
        compute_type_raw: object = state.get("compute_type", "vm")
        compute_type = compute_type_raw if isinstance(compute_type_raw, str) else "vm"
        shards_raw: object = state.get("shards") or []
        shards = cast(list[dict[str, object]], shards_raw) if isinstance(shards_raw, list) else []
        updated = False
        launched_this_tick = 0
        now = datetime.now(UTC)

        if not shards:
            return False

        shard_statuses = self.event_processor.read_shard_statuses(deployment_id, shards)
        updated, launched_this_tick = self._dispatch_compute_updates(
            compute_type, deployment_id, state, shards, shard_statuses
        )

        # Handle scheduling for pending deployments
        if state.get("status") == "pending":
            scheduled_count = self._process_scheduling(deployment_id, state)
            launched_this_tick += scheduled_count
            if scheduled_count > 0:
                updated = True
                if state.get("status") == "pending":
                    state["status"] = "running"

        # Update overall deployment status if all shards are terminal
        if updated:
            all_terminal, has_failures = self.event_processor.check_all_shards_terminal(shards)
            if self.event_processor.update_deployment_status(
                state, all_terminal, has_failures, now
            ):
                updated = True
            state["updated_at"] = now.isoformat()

        # Save updated state
        if updated:
            return _save_and_notify(
                self.save_deployment_state,
                self.event_processor.notify_deployment_updated,
                state_path,
                state,
                deployment_id,
                launched_this_tick,
            )

        return False

    def _process_scheduling(self, deployment_id: str, state: dict[str, object]) -> int:
        """
        Process scheduling for pending deployments.

        Args:
            deployment_id: Unique identifier for the deployment
            state: Deployment state dictionary

        Returns:
            Number of new shards launched
        """
        if not self.quota_broker:
            return 0

        config_raw: object = state.get("config") or {}
        config = cast(dict[str, object], config_raw) if isinstance(config_raw, dict) else {}
        shards_raw2: object = state.get("shards") or []
        shards2 = (
            cast(list[dict[str, object]], shards_raw2) if isinstance(shards_raw2, list) else []
        )

        # Find shards that need to be launched
        shards_to_launch = [s for s in shards2 if s.get("status") == "pending"]
        if not shards_to_launch:
            return 0

        try:
            return self._acquire_and_launch(deployment_id, config, shards_to_launch)
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("[SYNC_SERVICE] Scheduling error for %s: %s", deployment_id, e)
            return 0

    def sync_deployments(self) -> tuple[int, int]:
        """
        Synchronize all active deployments.

        Returns:
            Tuple of (synced_count, active_count)
        """
        logger.info("[SYNC_SERVICE] Starting sync cycle...")

        # Scan for active deployments
        state_paths = self.scan_deployment_states()
        active_states = self.filter_active_deployments(state_paths)

        if not active_states:
            return 0, 0

        # Process deployments concurrently; prioritize those with running VMs
        def _running_count(state_tuple: tuple[str, dict[str, object]]) -> int:
            shards_r: object = state_tuple[1].get("shards") or []
            shards_l = cast(list[dict[str, object]], shards_r) if isinstance(shards_r, list) else []
            return sum(1 for s in shards_l if s.get("status") == "running")

        active_states.sort(key=_running_count, reverse=True)

        max_parallel = min(len(active_states), settings.AUTO_SYNC_MAX_PARALLEL)

        def process_deployment_tuple(state_tuple: tuple[str, dict[str, object]]) -> int:
            """Process a (state_path, state) tuple."""
            state_path, state = state_tuple
            return 1 if self.process_deployment(state_path, state) else 0

        # Process in parallel
        with ThreadPoolExecutor(max_workers=max_parallel) as executor:
            results = list(executor.map(process_deployment_tuple, active_states))

        synced = sum(results)

        # Run orphan cleanup for recently-completed deployments
        orphan_count = self._cleanup_recent_orphans(state_paths, active_states)
        if orphan_count > 0:
            logger.info(
                "[SYNC_SERVICE] Fired %s orphan deletes for recently-completed deployments",
                orphan_count,
            )

        return synced, len(active_states)

    def _cleanup_recent_orphans(
        self, state_paths: list[str], active_states: list[tuple[str, dict[str, object]]]
    ) -> int:
        """
        Clean up orphan VMs for recently-completed deployments.

        Args:
            state_paths: All state file paths
            active_states: Currently active deployment states

        Returns:
            Number of orphan VMs cleaned up
        """
        active_paths = {path for path, _ in active_states}
        recent_min = getattr(settings, "ORPHAN_CLEANUP_RECENTLY_COMPLETED_MINUTES", 30)
        cutoff = datetime.now(UTC) - timedelta(minutes=recent_min)
        orphan_count = 0

        for state_path in state_paths:
            if state_path in active_paths:
                continue

            state = self.load_deployment_state(state_path)
            if not state:
                continue

            if state.get("status") not in ("completed", "failed"):
                continue

            if state.get("compute_type") != "vm":
                continue

            completed_at_raw = state.get("completed_at") or state.get("updated_at")
            completed_at = str(completed_at_raw) if completed_at_raw is not None else None
            if not completed_at:
                continue

            try:
                completed_dt = datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
                if completed_dt.tzinfo is None:
                    completed_dt = completed_dt.replace(tzinfo=UTC)
                if completed_dt < cutoff:
                    continue
            except (ValueError, TypeError) as e:
                logger.debug("Skipping item due to %s: %s", type(e).__name__, e)
                continue

            orphan_count += self.state_manager.run_orphan_cleanup_only(state)

        return orphan_count

    def cleanup_state_ttl(self) -> int:
        """
        Perform state TTL cleanup.

        Returns:
            Number of old deployments deleted
        """
        return self.state_manager.cleanup_state_ttl()

    def get_held_deployment_locks(self) -> set[str]:
        """Get currently held deployment locks."""
        return self.state_manager.held_deployment_locks

    def release_all_locks(self) -> int:
        """Release all held locks."""
        return self.state_manager.release_all_locks()
