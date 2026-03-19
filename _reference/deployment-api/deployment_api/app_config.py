"""
Application configuration and lifecycle management.

Handles FastAPI app setup, CORS configuration, and application lifespan.
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager, suppress
from pathlib import Path
from typing import cast

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from deployment_api import __version__ as _api_version
from deployment_api import settings
from deployment_api.auth import AUTH_ENVIRONMENT as _AUTH_ENVIRONMENT
from deployment_api.utils.storage_client import get_storage_client as get_storage_client_with_pool
from deployment_api.workers.auto_sync import (
    auto_sync_running_deployments as _auto_sync_running_deployments,
)
from deployment_api.workers.auto_sync import (
    get_held_deployment_locks,
    get_owner_id,
    set_background_task_handles,
)

logger = logging.getLogger(__name__)


async def _cancel_tasks(
    background_task: asyncio.Task[None] | None,
    events_drain_task: asyncio.Task[None] | None,
) -> None:
    """Cancel and await the background sync and events drain tasks."""
    if background_task:
        background_task.cancel()
        try:
            await asyncio.wait_for(background_task, timeout=5)
        except asyncio.CancelledError as e:
            logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)
        except TimeoutError:
            logger.warning("Background auto-sync task did not stop in time")
    if events_drain_task:
        events_drain_task.cancel()
        with suppress(TimeoutError, asyncio.CancelledError):
            await asyncio.wait_for(events_drain_task, timeout=2)


def _release_one_lock_gcs(
    client: object,
    state_bucket: str,
    deployment_id: str,
    owner_id: str,
    held_locks: set[str],
) -> int:
    """Attempt to release a single deployment lock via GCS client. Returns 1 if released."""
    blob_exists_fn = getattr(client, "blob_exists", None)
    download_fn = getattr(client, "download_bytes", None)
    delete_fn = getattr(client, "delete_blob", None)
    try:
        lock_blob_name = f"locks/deployment_{deployment_id}.lock"
        if callable(blob_exists_fn) and blob_exists_fn(state_bucket, lock_blob_name):
            raw_bytes: bytes = cast(
                bytes, download_fn(state_bucket, lock_blob_name) if callable(download_fn) else b"{}"
            )
            lock_data = cast(dict[str, object], json.loads(raw_bytes.decode("utf-8") or "{}"))
            if lock_data.get("owner") == owner_id:
                if callable(delete_fn):
                    delete_fn(state_bucket, lock_blob_name)
                held_locks.discard(deployment_id)
                return 1
    except (OSError, ValueError, RuntimeError):
        pass  # Lock may have been taken by another instance
    held_locks.discard(deployment_id)
    return 0


def _release_deployment_locks_gcs() -> None:
    """Release all per-deployment locks held by this instance on graceful shutdown."""
    try:
        project_id = settings.gcp_project_id
        state_bucket = settings.STATE_BUCKET
        owner_id = get_owner_id()
        held_deployment_locks = get_held_deployment_locks()
        client = get_storage_client_with_pool(project_id)
        released_count = 0
        for deployment_id in list(held_deployment_locks):
            released_count += _release_one_lock_gcs(
                client, state_bucket, deployment_id, owner_id, held_deployment_locks
            )
        if released_count > 0:
            logger.info("[SHUTDOWN] Released %s per-deployment lock(s)", released_count)
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("[SHUTDOWN] Could not release locks: %s", e)


def get_config_dir() -> Path:
    """Get the operational configs directory path.

    Search order:
    1. repo_root/pm-configs/  -- symlink to ../unified-trading-pm/configs (local dev)
                              -- real dir populated by cloudbuild before docker build (prod)
    2. workspace sibling      -- ../unified-trading-pm/configs

    SSOT: unified-trading-pm/configs/ (PM is the canonical source for operational configs)
    """
    api_dir = Path(__file__).parent  # deployment_api/
    repo_root = api_dir.parent  # deployment-api/

    bundled = repo_root / "pm-configs"
    if bundled.exists():
        return bundled

    sibling = repo_root.parent / "unified-trading-pm" / "configs"
    if sibling.exists():
        return sibling

    raise RuntimeError(
        "Could not find operational configs directory. "
        "Expected pm-configs/ (bundled) or ../unified-trading-pm/configs (sibling)."
    )


def get_ui_dist_dir() -> Path | None:
    """Get the UI dist directory if it exists (for production serving)."""
    api_dir = Path(__file__).parent
    repo_root = api_dir.parent
    ui_dist = repo_root / "ui" / "dist"

    if ui_dist.exists() and (ui_dist / "index.html").exists():
        return ui_dist
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown."""
    # Startup
    app.state.config_dir = get_config_dir()
    logger.info("Config directory: %s", app.state.config_dir)

    # Initialize cache
    from .utils.cache import cache

    await cache.initialize()

    # Start background sync task
    shutdown_event = asyncio.Event()
    background_task = asyncio.create_task(_auto_sync_running_deployments())
    logger.info("Background auto-sync task started")

    # Start deployment events drain (for low-latency SSE notify when state is saved from sync code)
    from deployment_api.utils.deployment_events import drain_sync_queue

    events_drain_task = asyncio.create_task(drain_sync_queue())
    logger.info("Deployment events drain task started")

    # Store task handles in the auto_sync module
    set_background_task_handles(background_task, events_drain_task, shutdown_event)

    yield

    # Shutdown
    logger.info("Shutting down API...")
    shutdown_event.set()
    await _cancel_tasks(background_task, events_drain_task)
    _release_deployment_locks_gcs()

    try:
        await cache.shutdown()
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Cache shutdown failed: %s", e)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Deployment Monitoring API",
        description="API for managing and monitoring service deployments",
        version=_api_version,
        lifespan=lifespan,
        docs_url="/docs" if _AUTH_ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if _AUTH_ENVIRONMENT != "production" else None,
        openapi_url="/openapi.json" if _AUTH_ENVIRONMENT != "production" else None,
    )

    # Build CORS allowed origins from env vars
    _api_port = settings.API_PORT
    _frontend_port = settings.FRONTEND_PORT
    allowed_origins = [
        "http://localhost:3000",
        f"http://localhost:{_frontend_port}",
        f"http://127.0.0.1:{_frontend_port}",
        # Keep 5174 allowed for execution-service visualizer UI by default.
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        f"http://localhost:{_api_port}",
        "http://localhost:8080",
    ]
    # Allow specific Cloud Run origins (restrict to known project)
    project_id = settings.gcp_project_id or "unknown-project"
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=rf"https://{project_id}--.*\.run\.app",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    )

    return app
