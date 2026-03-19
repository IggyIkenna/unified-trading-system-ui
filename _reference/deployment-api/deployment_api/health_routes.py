"""
Health check and utility routes for the FastAPI application.

Contains endpoints for health monitoring, worker status, cache management,
and serving the UI application.
"""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter
from fastapi.responses import FileResponse
from unified_config_interface import UnifiedCloudConfig

from deployment_api import __version__ as _api_version
from deployment_api.utils.service_utils import get_ui_dist_dir

logger = logging.getLogger(__name__)

router = APIRouter()

_cloud_cfg = UnifiedCloudConfig()


def _data_freshness() -> dict[str, object]:
    """Return data freshness info for health endpoint.

    Reports the age of the most recent deployment data processed by the service.
    Placeholder -- real implementation would check actual deployment timestamps.
    """
    return {
        "last_processed_date": datetime.now(UTC).strftime("%Y-%m-%d"),
        "stale": False,
    }


@router.get("/")
async def root():
    """Serve UI index.html if available, else health check."""
    ui_dist = get_ui_dist_dir()
    if ui_dist:
        return FileResponse(ui_dist / "index.html")
    return {"status": "ok", "message": "Deployment Monitoring API"}


@router.get("/health")
async def health() -> dict[str, object]:
    """Standard Cloud Run liveness probe."""
    return {
        "status": "ok",
        "service": "deployment-api",
        "cloud_provider": _cloud_cfg.cloud_provider,
        "mock_mode": _cloud_cfg.is_mock_mode(),
        "data_freshness": _data_freshness(),
    }


@router.get("/api/health")
async def health_check():
    """Detailed health check. Includes GCS FUSE status for UI display."""
    from deployment_api.utils.storage_facade import get_gcs_fuse_status

    return {
        "status": "healthy",
        "version": _api_version,
        "config_dir": None,  # Will be set by main app
        "gcs_fuse": get_gcs_fuse_status(),
    }


@router.get("/version")
async def version() -> dict[str, str]:
    """Return service version information."""
    return {"version": _api_version, "service": "deployment-api"}


@router.get("/readiness")
async def readiness() -> dict[str, str]:
    """Standard Cloud Run readiness probe."""
    return {"status": "ready", "service": "deployment-api"}


@router.get("/api/readiness")
async def readiness_check() -> dict[str, str]:
    """Readiness probe — returns 503 if service is not ready to handle requests."""
    return {"status": "ready", "service": "deployment-api"}


@router.get("/api/workers")
async def get_workers_status() -> dict[str, object]:
    """
    Get status of all active deployment worker processes.

    Useful for debugging and monitoring.
    """
    try:
        from .workers.deployment_worker import get_active_workers

        workers = get_active_workers()
        return {
            "active_workers": len(workers),
            "workers": workers,
        }
    except (OSError, ValueError, RuntimeError) as e:
        return {
            "active_workers": 0,
            "workers": {},
            "error": str(e),
        }


@router.post("/api/cache/clear")
async def clear_cache():
    """
    Clear all API caches.

    This invalidates:
    - In-memory cache
    - Redis cache (if available)
    - GCS cache (if available)

    Use this to force fresh data on next request.
    """
    from .utils.cache import cache

    try:
        # Clear all cache patterns
        patterns = [
            "deployment*",
            "deployments*",
            "data-status*",
            "service-status*",
            "build*",
            "trigger*",
        ]

        total_cleared = 0
        for pattern in patterns:
            count = await cache.clear_pattern(pattern)
            total_cleared += count

        # Also clear the GCS-based file cache used by service_status
        try:
            from .routes.service_status_cache import clear_gcs_cache

            clear_gcs_cache()
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Unexpected error during operation: %s", e, exc_info=True)
            pass

        # Clear the data status turbo cache (separate in-memory cache)
        try:
            from .utils.data_status_cache import clear_cache as clear_turbo_cache

            turbo_cleared = clear_turbo_cache()
            total_cleared += turbo_cleared
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Unexpected error during operation: %s", e, exc_info=True)
            pass

        logger.info("[CACHE] Cleared %s cache entries", total_cleared)

        return {
            "status": "success",
            "cleared": total_cleared,
            "message": "All caches cleared. Next requests will fetch fresh data.",
        }
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("[CACHE] Clear failed: %s", e)
        return {
            "status": "error",
            "error": str(e),
        }


# Catch-all route for SPA client-side routing (must be last)
# This allows React Router to handle routes like /history, /status, etc.
@router.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve index.html for client-side routing (SPA)."""
    ui_dist = get_ui_dist_dir()
    if ui_dist:
        # Check if it's a static file that exists
        file_path = ui_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # Otherwise serve index.html for client-side routing
        return FileResponse(ui_dist / "index.html")
    # No UI dist - return 404 for non-API paths
    return {"error": "Not found", "path": full_path}
