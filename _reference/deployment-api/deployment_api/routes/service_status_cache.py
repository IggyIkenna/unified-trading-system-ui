"""
Service Status Cache Management

GCS-based caching for service status data.
"""

import json
import logging
from typing import cast

from deployment_api.settings import STATE_BUCKET as DEFAULT_STATE_BUCKET

logger = logging.getLogger(__name__)

# GCS-based cache for trigger IDs and deployment info (shared, persistent)
# Cache is stored in: gs://deployment-orchestration-{project}/cache/service_status_cache.json
_local_cache: dict[str, object] = {}  # In-memory copy of GCS cache
_cache_loaded: bool = False
CACHE_BUCKET = DEFAULT_STATE_BUCKET
CACHE_BLOB_PATH = "cache/service_status_cache.json"


def _load_gcs_cache() -> dict[str, object]:
    """Load cache from GCS (shared across all instances).

    Uses storage facade (FUSE when production).
    """
    global _local_cache, _cache_loaded

    if _cache_loaded:
        return _local_cache

    try:
        from deployment_api.utils.storage_facade import object_exists, read_object_text

        if object_exists(CACHE_BUCKET, CACHE_BLOB_PATH):
            data = cast(
                dict[str, object], json.loads(read_object_text(CACHE_BUCKET, CACHE_BLOB_PATH))
            )
            _local_cache = data
            logger.info(
                "Loaded service status cache from GCS: %s triggers, %s deployments",
                len(cast(dict[str, object], data.get("trigger_ids") or {})),
                len(cast(dict[str, object], data.get("deployments") or {})),
            )
        else:
            _local_cache = {
                "trigger_ids": {},
                "deployments": {},
                "deployment_times": {},
            }
            logger.info("No existing cache in GCS, starting fresh")

        _cache_loaded = True
        return _local_cache
    except (OSError, ValueError, RuntimeError):
        _local_cache = {"trigger_ids": {}, "deployments": {}, "deployment_times": {}}
        _cache_loaded = True
        return _local_cache


def _save_gcs_cache():
    """Save cache to GCS (async-friendly, fire and forget).

    Uses storage facade (FUSE when production).
    """
    try:
        from deployment_api.utils.storage_facade import write_object_text

        write_object_text(
            CACHE_BUCKET,
            CACHE_BLOB_PATH,
            json.dumps(_local_cache, default=str),
        )
        logger.debug("Saved service status cache to GCS")
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Failed to save service status cache to GCS: %s", e)


def _clear_gcs_cache():
    """Clear the in-memory and GCS cache. Called by /api/cache/clear endpoint."""
    global _local_cache, _cache_loaded

    _local_cache = {
        "trigger_ids": {},
        "deployments": {},
        "deployment_times": {},
        "data_timestamps": {},
        "data_timestamp_times": {},
        "builds": {},
        "build_times": {},
    }
    _cache_loaded = True

    # Save empty cache to GCS
    _save_gcs_cache()
    logger.info("Cleared service status GCS cache")


def load_gcs_cache() -> dict[str, object]:
    """Public interface for loading GCS cache."""
    return _load_gcs_cache()


def save_gcs_cache():
    """Public interface for saving GCS cache."""
    return _save_gcs_cache()


def clear_gcs_cache():
    """Public interface for clearing GCS cache."""
    return _clear_gcs_cache()
