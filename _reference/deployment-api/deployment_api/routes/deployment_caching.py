"""
Deployment caching utilities.

Contains functions for caching deployment data, states, logs, and verification results
to improve performance and reduce API calls.
"""

import asyncio
import logging
import time
from typing import cast

logger = logging.getLogger(__name__)

# In-memory cache for logs API to avoid exceeding Cloud Logging 60 reads/min quota
_LOGS_CACHE_TTL_SEC = 90
_LOGS_CACHE_MAX_ENTRIES = 100
_logs_cache: dict[str, tuple[float, dict[str, object]]] = {}

# In-memory cache for VM logs (GCS fetch) to avoid hammering GCS on rapid log tab opens
_VM_LOGS_CACHE_TTL_SEC = 15
_VM_LOGS_CACHE_MAX_ENTRIES = 50
_vm_logs_cache: dict[
    str, tuple[float, tuple[list[object], str]]
] = {}  # key -> (expiry_ts, (logs, message))

# In-memory cache for expensive completion verification breakdown (data-status turbo)
_VERIFICATION_CACHE_TTL_SEC = 15 * 60
_VERIFICATION_CACHE_MAX_ENTRIES = 100
_verification_cache: dict[str, tuple[float, dict[str, object]]] = {}
_verification_pending: set[str] = set()


def get_verification_cache(deployment_id: str) -> dict[str, object] | None:
    """Get verification cache for a deployment."""
    entry = _verification_cache.get(deployment_id)
    if not entry:
        return None

    expiry_ts, cached = entry
    if time.time() > expiry_ts:
        _verification_cache.pop(deployment_id, None)
        return None

    return cached


def set_verification_cache(deployment_id: str, data: dict[str, object]) -> None:
    """Set verification cache for a deployment."""
    # Prune old entries if cache is getting too large
    if len(_verification_cache) >= _VERIFICATION_CACHE_MAX_ENTRIES:
        oldest_key = min(_verification_cache.keys(), key=lambda k: _verification_cache[k][0])
        _verification_cache.pop(oldest_key, None)

    expiry_ts = time.time() + _VERIFICATION_CACHE_TTL_SEC
    _verification_cache[deployment_id] = (expiry_ts, data)


def get_logs_cache(cache_key: str) -> dict[str, object] | None:
    """Get logs from cache if not expired."""
    entry = _logs_cache.get(cache_key)
    if not entry:
        return None

    expiry_ts, cached = entry
    if time.time() > expiry_ts:
        _logs_cache.pop(cache_key, None)
        return None

    return cached


def set_logs_cache(cache_key: str, data: dict[str, object]) -> None:
    """Set logs cache with TTL."""
    # Prune old entries if cache is getting too large
    if len(_logs_cache) >= _LOGS_CACHE_MAX_ENTRIES:
        oldest_key = min(_logs_cache.keys(), key=lambda k: _logs_cache[k][0])
        _logs_cache.pop(oldest_key, None)

    expiry_ts = time.time() + _LOGS_CACHE_TTL_SEC
    _logs_cache[cache_key] = (expiry_ts, data)


def get_vm_logs_cache(cache_key: str) -> tuple[list[object], str] | None:
    """Get VM logs from cache if not expired."""
    entry = _vm_logs_cache.get(cache_key)
    if not entry:
        return None

    expiry_ts, cached = entry
    if time.time() > expiry_ts:
        _vm_logs_cache.pop(cache_key, None)
        return None

    return cached


def set_vm_logs_cache(cache_key: str, logs: list[object], message: str) -> None:
    """Set VM logs cache with TTL."""
    # Prune old entries if cache is getting too large
    if len(_vm_logs_cache) >= _VM_LOGS_CACHE_MAX_ENTRIES:
        oldest_key = min(_vm_logs_cache.keys(), key=lambda k: _vm_logs_cache[k][0])
        _vm_logs_cache.pop(oldest_key, None)

    expiry_ts = time.time() + _VM_LOGS_CACHE_TTL_SEC
    _vm_logs_cache[cache_key] = (expiry_ts, (logs, message))


def add_verification_pending(deployment_id: str) -> None:
    """Add deployment to pending verification set."""
    _verification_pending.add(deployment_id)


def remove_verification_pending(deployment_id: str) -> None:
    """Remove deployment from pending verification set."""
    _verification_pending.discard(deployment_id)


def is_verification_pending(deployment_id: str) -> bool:
    """Check if verification is pending for deployment."""
    return deployment_id in _verification_pending


async def get_cached_deployments(
    state_manager: object, service: str | None = None, limit: int = 50, force_refresh: bool = False
) -> object:
    """Get deployments with smart caching (Redis + in-memory fallback)."""
    from deployment_api.utils.cache import TTL_DEPLOYMENT_LIST, cache, deployment_list_key

    cache_key = deployment_list_key(service, limit)

    async def fetch_fresh() -> list[object]:
        """Fetch fresh deployment list from GCS with timeout."""
        try:
            # Add timeout to prevent hanging forever (30 second max)
            list_fn = getattr(state_manager, "list_deployments", None)
            if not callable(list_fn):
                return []
            raw: object = await asyncio.wait_for(
                asyncio.to_thread(
                    list_fn,
                    service=service,
                    limit=limit,  # Only fetch what we need, not 100
                ),
                timeout=30.0,
            )
            return cast(list[object], raw) if isinstance(raw, list) else []
        except TimeoutError:
            logger.error("Timeout fetching deployments (service=%s, limit=%s)", service, limit)
            return []
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error fetching deployments: %s", e)
            return []

    return await cache.get_or_fetch(cache_key, fetch_fresh, TTL_DEPLOYMENT_LIST, force_refresh)


async def invalidate_deployment_cache(deployment_id: str | None = None):
    """Invalidate deployment-related caches."""
    from deployment_api.utils.cache import cache, deployment_key

    if deployment_id:
        await cache.delete(deployment_key(deployment_id))
    # Clear all deployment list caches
    await cache.clear_pattern("deployments:*")


async def get_cached_deployment_state(
    state_manager: object, deployment_id: str, force_refresh: bool = False
) -> object:
    """Get deployment state with smart caching (Redis + in-memory fallback).

    Uses shorter TTL (10s) for active deployments and longer TTL (60s) for terminal ones.
    """
    from deployment_api.utils.cache import (
        TTL_DEPLOYMENT_STATE,
        TTL_DEPLOYMENT_STATE_TERMINAL,
        cache,
        deployment_key,
    )

    cache_key = deployment_key(deployment_id)

    async def fetch_fresh() -> object:
        """Fetch fresh state from GCS."""
        load_fn = getattr(state_manager, "load_state", None)
        if not callable(load_fn):
            return None
        raw: object = await asyncio.to_thread(load_fn, deployment_id)
        return raw

    state: object = await cache.get_or_fetch(
        cache_key, fetch_fresh, TTL_DEPLOYMENT_STATE, force_refresh
    )

    # Re-cache with longer TTL if the deployment is in a terminal state
    if state and hasattr(state, "status"):
        status_attr: object = getattr(state, "status", "")
        status = str(getattr(status_attr, "value", None) or status_attr)
    elif state and isinstance(state, dict):
        status_raw = cast(dict[str, object], state).get("status")
        status = str(status_raw) if isinstance(status_raw, str) else ""
    else:
        status = ""
    if status in (
        "completed",
        "failed",
        "cancelled",
        "clean",
        "completed_with_warnings",
        "completed_with_errors",
    ):
        state_to_cache: object = cast(object, state)
        await cache.set(cache_key, state_to_cache, TTL_DEPLOYMENT_STATE_TERMINAL)

    return cast(object, state)


async def invalidate_deployment_state_cache(deployment_id: str | None = None):
    """Invalidate state cache for a specific deployment or all."""
    from deployment_api.utils.cache import cache, deployment_key

    if deployment_id:
        await cache.delete(deployment_key(deployment_id))
    else:
        await cache.clear_pattern("deployment:*")


def clear_all_caches():
    """Clear all in-memory caches."""
    global _logs_cache, _vm_logs_cache, _verification_cache, _verification_pending
    _logs_cache.clear()
    _vm_logs_cache.clear()
    _verification_cache.clear()
    _verification_pending.clear()


def invalidate_log_analysis_cache(deployment_id: str | None = None):
    """Invalidate log analysis cache for specific deployment or all deployments."""
    # This function is defined in log_analysis.py and should be imported from there
    from deployment_api.routes.log_analysis import (
        invalidate_log_analysis_cache as _invalidate_log_analysis_cache,
    )

    return _invalidate_log_analysis_cache(deployment_id)
