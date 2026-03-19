"""
Application lifespan management for FastAPI.

Handles startup and shutdown events including background tasks,
cache initialization, and resource cleanup.
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager, suppress
from typing import cast

from fastapi import FastAPI

from deployment_api.background_sync import (
    STATE_BUCKET,
    auto_sync_running_deployments,
    get_held_deployment_locks,
    get_owner_id,
    set_shutdown_event,
)
from deployment_api.utils.service_utils import (
    get_codex_dir,
    get_config_dir,
    get_epics_dir,
    get_plans_dir,
)
from deployment_api.utils.storage_facade import (
    delete_object as _delete_storage_object,
)
from deployment_api.utils.storage_facade import (
    object_exists as _storage_object_exists,
)
from deployment_api.utils.storage_facade import (
    read_object_text as _read_storage_object_text,
)

logger = logging.getLogger(__name__)

# Private alias for testability (tests can patch this name)
_auto_sync_running_deployments = auto_sync_running_deployments

# Background task handles
_background_task = None
_events_drain_task = None
_shutdown_event = None


async def _cancel_background_tasks() -> None:
    """Cancel and await the background sync and events drain tasks."""
    global _background_task, _events_drain_task
    if _background_task:
        _background_task.cancel()
        try:
            await asyncio.wait_for(_background_task, timeout=5)
        except asyncio.CancelledError as e:
            logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)
        except TimeoutError:
            logger.warning("Background auto-sync task did not stop in time")
    if _events_drain_task:
        _events_drain_task.cancel()
        with suppress(TimeoutError, asyncio.CancelledError):
            await asyncio.wait_for(_events_drain_task, timeout=2)


def _release_one_lock(deployment_id: str, held_locks: set[str]) -> int:
    """Attempt to release a single deployment lock. Returns 1 if released, 0 otherwise."""
    try:
        lock_blob_name = f"locks/deployment_{deployment_id}.lock"
        if _storage_object_exists(STATE_BUCKET, lock_blob_name):
            lock_data = cast(
                dict[str, object],
                json.loads(_read_storage_object_text(STATE_BUCKET, lock_blob_name) or "{}"),
            )
            if lock_data.get("owner") == get_owner_id():
                _delete_storage_object(STATE_BUCKET, lock_blob_name)
                held_locks.discard(deployment_id)
                return 1
    except (OSError, ValueError, RuntimeError):
        pass  # Lock may have been taken by another instance
    held_locks.discard(deployment_id)
    return 0


def _release_deployment_locks() -> None:
    """Release all per-deployment locks held by this instance on graceful shutdown."""
    try:
        released_count = 0
        held_deployment_locks = get_held_deployment_locks()
        for deployment_id in list(held_deployment_locks):
            released_count += _release_one_lock(deployment_id, held_deployment_locks)
        if released_count > 0:
            logger.info("[SHUTDOWN] Released %s per-deployment lock(s)", released_count)
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("[SHUTDOWN] Could not release locks: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown."""
    global _background_task, _shutdown_event, _events_drain_task

    # Startup
    app.state.config_dir = get_config_dir()
    logger.info("Config directory: %s", app.state.config_dir)

    app.state.codex_dir = get_codex_dir()
    if app.state.codex_dir is not None:
        logger.info("Codex readiness dir: %s", app.state.codex_dir)
    else:
        logger.warning(
            "Codex readiness dir: not found — checklist endpoints will return 404 "
            "(codex v3.0 is SSOT)"
        )

    app.state.epics_dir = get_epics_dir()
    if app.state.epics_dir is not None:
        logger.info("Epics dir: %s", app.state.epics_dir)
    else:
        logger.warning(
            "Epics dir: not found — /api/epics will return 503 "
            "(codex 11-project-management/epics/ must be present)"
        )

    app.state.plans_dir = get_plans_dir()
    if app.state.plans_dir is not None:
        logger.info("PM plans dir: %s", app.state.plans_dir)
    else:
        logger.info("PM plans dir: not found — plans visualization endpoints unavailable")

    # Initialize cache
    from .utils.cache import cache

    await cache.initialize()

    # Start background sync task
    _shutdown_event = asyncio.Event()
    set_shutdown_event(_shutdown_event)
    _background_task = asyncio.create_task(_auto_sync_running_deployments())
    logger.info("Background auto-sync task started")

    # Start deployment events drain (for low-latency SSE notify when state is saved from sync code)
    from deployment_api.utils.deployment_events import drain_sync_queue

    _events_drain_task = asyncio.create_task(drain_sync_queue())
    logger.info("Deployment events drain task started")

    yield

    # Shutdown
    logger.info("Shutting down API...")
    _shutdown_event.set()
    await _cancel_background_tasks()
    _release_deployment_locks()

    try:
        from .utils.cache import cache

        await cache.shutdown()
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Cache shutdown failed: %s", e)
