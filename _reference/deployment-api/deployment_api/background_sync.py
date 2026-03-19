"""
Background synchronization task for deployment status monitoring.

Thin orchestrator that coordinates the sync service and state management
to ensure deployment completion status gets persisted when VMs complete and self-delete.
"""

import asyncio
import logging
import time as _time
from concurrent.futures import ThreadPoolExecutor

from deployment_api import settings
from deployment_api.services import SyncService

logger = logging.getLogger(__name__)

# Global sync service instance
_sync_service: SyncService | None = None
_shutdown_event: asyncio.Event | None = None


def get_held_deployment_locks() -> set[str]:
    """Get the set of currently held deployment locks."""
    if _sync_service:
        return _sync_service.get_held_deployment_locks()
    return set()


def set_shutdown_event(event: asyncio.Event) -> None:
    """Set the shutdown event for graceful shutdown."""
    global _shutdown_event
    _shutdown_event = event


async def _run_ttl_cleanup(loop: asyncio.AbstractEventLoop, current_interval: float) -> None:
    """Run state TTL cleanup once per hour."""
    if (_time.time() % 3600) >= current_interval:
        return
    assert _sync_service is not None
    try:
        with ThreadPoolExecutor(max_workers=1) as executor:
            deleted_count = await loop.run_in_executor(executor, _sync_service.cleanup_state_ttl)
        if deleted_count > 0:
            logger.info("[AUTO_SYNC] TTL cleanup: deleted %s old deployment(s)", deleted_count)
    except (OSError, ValueError, RuntimeError) as e:
        logger.debug("[AUTO_SYNC] State TTL cleanup error: %s", e)


def _compute_next_interval(
    num_active: int, sync_interval_active: int, sync_interval_idle: int
) -> int:
    """Return next sync interval based on number of active deployments."""
    if num_active > 0:
        logger.debug("[AUTO_SYNC] %s active → next cycle in %ss", num_active, sync_interval_active)
        return sync_interval_active
    logger.debug("[AUTO_SYNC] No active deployments → next cycle in %ss", sync_interval_idle)
    return sync_interval_idle


async def auto_sync_running_deployments():
    """
    Background task that periodically syncs status for running deployments.

    This ensures that when VMs complete and self-delete, their completion
    status gets persisted to state.json without manual intervention.

    Runs every 30-60 seconds with adaptive intervals based on activity.
    """
    global _sync_service

    _sync_service = SyncService(
        project_id=settings.gcp_project_id,
        state_bucket=settings.STATE_BUCKET,
        deployment_env=settings.DEPLOYMENT_ENV,
    )
    _set_owner_id(_sync_service.state_manager.owner_id)

    sync_interval_active = getattr(settings, "AUTO_SYNC_INTERVAL_ACTIVE", 30)
    sync_interval_idle = 60
    current_interval = sync_interval_active

    logger.info(
        "[AUTO_SYNC] Started background sync task (active_interval=%ss, idle_interval=%ss)",
        sync_interval_active,
        sync_interval_idle,
    )

    first_run = True
    while _shutdown_event is None or not _shutdown_event.is_set():
        try:
            if first_run:
                await asyncio.sleep(5)
                first_run = False
            else:
                await asyncio.sleep(current_interval)

            if _shutdown_event is not None and _shutdown_event.is_set():
                break

            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor(max_workers=1) as executor:
                synced, num_active = await loop.run_in_executor(
                    executor, _sync_service.sync_deployments
                )

            if synced > 0:
                logger.info("[AUTO_SYNC] Synced %s deployment(s)", synced)

            await _run_ttl_cleanup(loop, current_interval)
            current_interval = _compute_next_interval(
                num_active, sync_interval_active, sync_interval_idle
            )

        except asyncio.CancelledError:
            break
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("[AUTO_SYNC] Error: %s", e)

    logger.info("[AUTO_SYNC] Background sync task stopped")


# Private alias for testability (tests can patch this name)
_auto_sync_running_deployments = auto_sync_running_deployments

# Module-level aliases for settings constants used by processors in this module
PROJECT_ID = settings.gcp_project_id
STATE_BUCKET = settings.STATE_BUCKET


def get_owner_id() -> str:
    """Get the owner ID from the sync service state manager."""
    if _sync_service:
        return _sync_service.state_manager.owner_id
    return ""


# Mutable container for OWNER_ID — set after sync service initialization.
# Using a list avoids reportConstantRedefinition on the uppercase symbol.
_owner_id_store: list[str] = [""]


def _set_owner_id(value: str) -> None:
    """Update owner ID in the shared mutable store."""
    _owner_id_store[0] = value
