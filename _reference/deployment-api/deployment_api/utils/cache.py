"""
Unified Caching Layer for API

Two-tier caching architecture:
- Tier 1 (Hot): Redis (distributed) or In-Memory (fallback) - fast, volatile
- Tier 2 (Warm): GCS (persistent) - slower, survives restarts

Read path:  In-Memory -> Redis -> GCS -> Fetch
Write path: Fetch -> In-Memory + Redis + GCS (async)

Usage:
    from deployment_api.utils.cache import cache

    # Basic operations
    value = await cache.get("my_key")
    await cache.set("my_key", {"data": "value"}, ttl=60)
    await cache.delete("my_key")

    # Get or fetch with automatic caching
    value = await cache.get_or_fetch("key", fetch_func, ttl=60)

    # With GCS persistence (survives restarts)
    value = await cache.get_or_fetch("key", fetch_func, ttl=60, persist_to_gcs=True)

Environment Variables:
    REDIS_URL: Redis connection URL (default: redis://localhost:6379/0)
    STATE_BUCKET: GCS bucket for persistent cache (default: deployment-orchestration-{project})
    gcp_project_id: GCP project ID (required, no default — fail fast if missing)
"""

import asyncio
import importlib.util
import json
import logging
import time
from collections.abc import Callable, Coroutine
from typing import cast

from deployment_api.settings import REDIS_URL, STATE_BUCKET

logger = logging.getLogger(__name__)

# Configuration from centralized settings
GCS_CACHE_PATH = "cache/unified_cache.json"


# Serialization helpers
# SECURITY: jsonpickle removed — it can execute arbitrary code during decode.
# Cache values must be plain JSON-serializable (dicts, lists, strings, numbers).
def serialize(value: object) -> str:
    """Serialize Python objects into JSON string."""
    return json.dumps(value, default=str)


def deserialize(value: object) -> object:
    """Deserialize JSON string (or bytes) into Python objects."""
    if isinstance(value, (bytes, bytearray)):
        value = value.decode("utf-8")
    if not isinstance(value, str):
        raise TypeError(f"Expected str for JSON deserialization, got {type(value).__name__}")
    return cast(object, json.loads(value))


from unified_cloud_interface import AsyncRedisProvider

REDIS_AVAILABLE = True

# Check if GCS is available
GCS_AVAILABLE = importlib.util.find_spec("google.cloud.storage") is not None
if not GCS_AVAILABLE:
    logger.info("GCS not available, persistent caching disabled")


class CacheBackend:
    """Abstract cache backend interface."""

    async def get(self, key: str) -> object | None:
        raise NotImplementedError(f"{self.__class__.__name__} does not implement get()")

    async def set(self, key: str, value: object, ttl: int) -> None:
        raise NotImplementedError(f"{self.__class__.__name__} does not implement set()")

    async def delete(self, key: str) -> None:
        raise NotImplementedError(f"{self.__class__.__name__} does not implement delete()")

    async def clear_pattern(self, pattern: str) -> int:
        raise NotImplementedError(f"{self.__class__.__name__} does not implement clear_pattern()")


class InMemoryCache(CacheBackend):
    """In-memory cache with TTL support (fastest, volatile)."""

    def __init__(self):
        self._cache: dict[str, dict[str, object]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> object | None:
        async with self._lock:
            if key not in self._cache:
                return None

            entry = self._cache[key]
            expires_at = entry.get("expires_at")
            if isinstance(expires_at, float) and time.time() > expires_at:
                del self._cache[key]
                return None

            return entry.get("value")

    async def set(self, key: str, value: object, ttl: int) -> None:
        async with self._lock:
            self._cache[key] = {
                "value": value,
                "expires_at": time.time() + ttl,
            }

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._cache.pop(key, None)

    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern (simple prefix matching)."""
        async with self._lock:
            prefix = pattern.replace("*", "")
            keys_to_delete = [k for k in self._cache if k.startswith(prefix)]
            for k in keys_to_delete:
                del self._cache[k]
            return len(keys_to_delete)

    async def cleanup_expired(self):
        """Remove expired entries (called periodically)."""
        async with self._lock:
            now = time.time()

            def _is_expired(v: dict[str, object]) -> bool:
                exp = v.get("expires_at")
                return isinstance(exp, float) and now > exp

            expired = [k for k, v in self._cache.items() if _is_expired(v)]
            for k in expired:
                del self._cache[k]
            if expired:
                logger.debug("Cleaned up %s expired cache entries", len(expired))


class RedisCache(CacheBackend):
    """Redis-backed cache with JSON serialization (distributed, volatile)."""

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._provider: AsyncRedisProvider | None = None

    async def connect(self):
        """Connect to Redis."""
        try:
            provider = AsyncRedisProvider(url=self.redis_url)
            _get_client_attr: object = getattr(provider, "_get_client", None)
            if callable(_get_client_attr):
                get_client_fn = cast(
                    Callable[[], Coroutine[object, object, object]],
                    _get_client_attr,
                )
                await get_client_fn()
            self._provider = provider
            logger.info("Connected to Redis at %s", self.redis_url)
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Failed to connect to Redis: %s", e)
            self._provider = None

    async def close(self):
        """Close Redis connection."""
        if not self._provider:
            return
        try:
            await self._provider.close()
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Failed to close Redis connection: %s", e)

    async def get(self, key: str) -> object | None:
        if not self._provider:
            return None

        try:
            value = await self._provider.get(key)
            if value is None:
                return None
            return deserialize(value)
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Redis GET error for %s: %s", key, e)
            return None

    async def set(self, key: str, value: object, ttl: int) -> None:
        if not self._provider:
            return

        try:
            await self._provider.set(key, serialize(value).encode("utf-8"), ttl_seconds=ttl)
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Redis SET error for %s: %s", key, e)

    async def delete(self, key: str) -> None:
        if not self._provider:
            return

        try:
            await self._provider.delete(key)
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Redis DELETE error for %s: %s", key, e)

    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern."""
        if not self._provider:
            return 0

        try:
            _get_client_attr: object = getattr(self._provider, "_get_client", None)
            if not callable(_get_client_attr):
                return 0
            get_client_fn = cast(
                Callable[[], Coroutine[object, object, object]],
                _get_client_attr,
            )
            client: object = await get_client_fn()
            _keys_attr: object = getattr(client, "keys", None)
            _del_attr: object = getattr(client, "delete", None)
            if not callable(_keys_attr) or not callable(_del_attr):
                return 0
            keys_fn = cast(
                Callable[[str], Coroutine[object, object, object]],
                _keys_attr,
            )
            del_fn = cast(
                Callable[..., Coroutine[object, object, object]],
                _del_attr,
            )
            keys_raw: object = await keys_fn(pattern)
            keys: list[object] = cast(list[object], keys_raw) if isinstance(keys_raw, list) else []
            if keys:
                await del_fn(*keys)
            return len(keys)
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Redis CLEAR_PATTERN error for %s: %s", pattern, e)
            return 0


class GCSCache:
    """
    GCS-backed persistent cache (survives restarts, shared across instances).

    Stores all cached data in a single JSON file in GCS.
    Uses local in-memory copy for fast reads, syncs to GCS on writes.
    """

    def __init__(self, bucket_name: str, blob_path: str):
        self.bucket_name = bucket_name
        self.blob_path = blob_path
        self._local_cache: dict[str, dict[str, object]] = {}
        self._loaded = False
        self._lock = asyncio.Lock()

    def _get_client(self):
        """Get GCS client (lazy initialization)."""
        if not GCS_AVAILABLE:
            return None
        from deployment_api.utils.storage_client import get_storage_client

        return get_storage_client()

    async def _load_from_gcs(self) -> None:
        """Load cache from GCS into local memory."""
        if self._loaded:
            return

        async with self._lock:
            if self._loaded:
                return

            try:
                try:
                    from deployment_api.utils.storage_facade import (
                        object_exists,
                        read_object_text,
                    )

                    if object_exists(self.bucket_name, self.blob_path):
                        data = cast(
                            dict[str, dict[str, object]],
                            json.loads(read_object_text(self.bucket_name, self.blob_path)),
                        )
                        self._local_cache = data
                        logger.info("Loaded GCS cache: %s keys", len(data))
                    else:
                        self._local_cache = {}
                        logger.info("No existing GCS cache, starting fresh")
                except (OSError, ValueError, RuntimeError):
                    client = self._get_client()
                    if not client:
                        self._local_cache = {}
                    else:
                        bucket = client.bucket(self.bucket_name)
                        blob = bucket.blob(self.blob_path)
                        if blob.exists():
                            data = cast(
                                dict[str, dict[str, object]], json.loads(blob.download_as_text())
                            )
                            self._local_cache = data
                            logger.info("Loaded GCS cache: %s keys", len(data))
                        else:
                            self._local_cache = {}
                            logger.info("No existing GCS cache, starting fresh")

                self._loaded = True
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Failed to load GCS cache: %s", e)
                self._local_cache = {}
                self._loaded = True

    def _save_to_gcs_sync(self) -> None:
        """Save cache to GCS (synchronous, for background task)."""
        try:
            data = json.dumps(self._local_cache, default=str)
            try:
                from deployment_api.utils.storage_facade import write_object_text

                write_object_text(self.bucket_name, self.blob_path, data)
                logger.debug("Saved cache to GCS (FUSE)")
            except (OSError, ValueError, RuntimeError):
                client = self._get_client()
                if not client:
                    return
                client.upload_bytes(
                    self.bucket_name,
                    self.blob_path,
                    data.encode("utf-8"),
                    content_type="application/json",
                )
                logger.debug("Saved cache to GCS")
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Failed to save cache to GCS: %s", e)

    async def get(self, key: str) -> object | None:
        """Get value from GCS cache."""
        await self._load_from_gcs()

        entry = self._local_cache.get(key)
        if entry is None:
            return None

        # Check TTL
        expires_at_raw = entry.get("expires_at")
        expires_at = float(expires_at_raw) if isinstance(expires_at_raw, (int, float)) else 0.0
        if time.time() > expires_at:
            del self._local_cache[key]
            return None

        return entry.get("value")

    async def set(self, key: str, value: object, ttl: int) -> None:
        """Set value in GCS cache (async save to GCS)."""
        await self._load_from_gcs()

        self._local_cache[key] = {
            "value": value,
            "expires_at": time.time() + ttl,
        }

        # Save to GCS in background (fire and forget)
        asyncio.get_event_loop().run_in_executor(None, self._save_to_gcs_sync)

    async def delete(self, key: str) -> None:
        """Delete key from GCS cache."""
        await self._load_from_gcs()

        if key in self._local_cache:
            del self._local_cache[key]
            asyncio.get_event_loop().run_in_executor(None, self._save_to_gcs_sync)

    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern."""
        await self._load_from_gcs()

        prefix = pattern.replace("*", "")
        keys_to_delete = [k for k in self._local_cache if k.startswith(prefix)]

        for k in keys_to_delete:
            del self._local_cache[k]

        if keys_to_delete:
            asyncio.get_event_loop().run_in_executor(None, self._save_to_gcs_sync)

        return len(keys_to_delete)


class UnifiedCache:
    """
    Unified caching layer with three tiers:

    1. In-Memory (fastest, per-instance)
    2. Redis (fast, distributed) - optional
    3. GCS (persistent, survives restarts) - optional

    Read order: In-Memory -> Redis -> GCS -> Fetch
    Write order: All tiers simultaneously (GCS async)
    """

    def __init__(
        self,
        redis_url: str | None = None,
        storage_bucket: str | None = None,
        gcs_path: str | None = None,
    ):
        redis_url = redis_url or REDIS_URL
        storage_bucket = storage_bucket or STATE_BUCKET
        gcs_path = gcs_path or GCS_CACHE_PATH

        self.in_memory = InMemoryCache()
        self.redis = RedisCache(redis_url) if REDIS_AVAILABLE else None
        self.gcs = GCSCache(storage_bucket, gcs_path) if GCS_AVAILABLE else None
        self._initialized = False
        self._cleanup_task: asyncio.Task[None] | None = None
        self._shutdown_event = asyncio.Event()

    async def initialize(self):
        """Initialize all cache backends."""
        if self._initialized:
            return

        if self.redis:
            await self.redis.connect()

        # Pre-load GCS cache
        if self.gcs:
            load_fn = getattr(self.gcs, "_load_from_gcs", None)
            if callable(load_fn):
                _coro: Coroutine[object, object, None] = cast(
                    Coroutine[object, object, None], load_fn()
                )
                await _coro

        # Start background cleanup task
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())

        self._initialized = True
        logger.info(
            "Unified cache initialized (Redis: %s, GCS: %s)",
            "enabled" if self.redis and getattr(self.redis, "_provider", None) else "disabled",
            "enabled" if self.gcs else "disabled",
        )

    async def _cleanup_loop(self):
        """Background task to clean up expired in-memory entries."""
        while not self._shutdown_event.is_set():
            try:
                await asyncio.wait_for(self._shutdown_event.wait(), timeout=60)
            except TimeoutError:
                await self.in_memory.cleanup_expired()

    async def shutdown(self):
        """Shutdown cache background tasks and connections."""
        if not self._initialized:
            return
        self._shutdown_event.set()
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError as e:
                logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)
                pass
        if self.redis:
            await self.redis.close()
        self._initialized = False

    async def get(self, key: str) -> object | None:
        """
        Get value from cache (checks all tiers).

        Order: In-Memory -> Redis -> GCS
        If found in lower tier, promotes to higher tiers.
        """
        # Tier 1: In-Memory (fastest)
        value = await self.in_memory.get(key)
        if value is not None:
            return value

        # Tier 2: Redis (distributed)
        if self.redis:
            value = await self.redis.get(key)
            if value is not None:
                # Promote to in-memory
                await self.in_memory.set(key, value, ttl=60)
                return value

        # Tier 3: GCS (persistent)
        if self.gcs:
            value = await self.gcs.get(key)
            if value is not None:
                # Promote to faster tiers
                await self.in_memory.set(key, value, ttl=60)
                if self.redis:
                    await self.redis.set(key, value, ttl=60)
                return value

        return None

    async def set(self, key: str, value: object, ttl: int, persist_to_gcs: bool = False) -> None:
        """
        Set value in cache (all applicable tiers).

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            persist_to_gcs: If True, also persist to GCS for restart survival
        """
        # Always set in in-memory
        await self.in_memory.set(key, value, ttl)

        # Set in Redis if available
        if self.redis:
            await self.redis.set(key, value, ttl)

        # Set in GCS if requested (for persistence)
        if persist_to_gcs and self.gcs:
            await self.gcs.set(key, value, ttl)

    async def delete(self, key: str) -> None:
        """Delete key from all cache tiers."""
        await self.in_memory.delete(key)
        if self.redis:
            await self.redis.delete(key)
        if self.gcs:
            await self.gcs.delete(key)

    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern from all tiers."""
        count = await self.in_memory.clear_pattern(pattern)
        if self.redis:
            count += await self.redis.clear_pattern(pattern)
        if self.gcs:
            count += await self.gcs.clear_pattern(pattern)
        return count

    async def get_or_fetch(
        self,
        key: str,
        fetch_func: Callable[[], Coroutine[object, object, object]],
        ttl: int,
        force_refresh: bool = False,
        persist_to_gcs: bool = False,
    ) -> object:
        """
        Get from cache or fetch if missing.

        Args:
            key: Cache key
            fetch_func: Async function to call if cache miss
            ttl: Time to live in seconds
            force_refresh: Skip cache and fetch fresh data
            persist_to_gcs: Persist to GCS (survives restarts)

        Returns:
            Cached or freshly fetched value

        Note:
            None values are NOT cached to avoid infinite re-fetch loops.
        """
        if not force_refresh:
            cached = await self.get(key)
            if cached is not None:
                return cached

        # Fetch fresh data
        value: object = await fetch_func()

        # Only cache non-None values
        if value is not None:
            await self.set(key, value, ttl, persist_to_gcs=persist_to_gcs)

        return value


# =============================================================================
# Singleton instance and backwards-compatible aliases
# =============================================================================

# Primary unified cache instance
cache = UnifiedCache()

# Backwards compatibility: SmartCache alias
SmartCache = UnifiedCache


# =============================================================================
# Cache key builders
# =============================================================================


def deployment_key(deployment_id: str) -> str:
    """Cache key for deployment state."""
    return f"deployment:{deployment_id}"


def deployment_list_key(service: str | None = None, limit: int = 20) -> str:
    """Cache key for deployment list."""
    return f"deployments:{service or 'all'}:limit-{limit}"


def data_status_key(service: str, start_date: str, end_date: str, categories: str = "") -> str:
    """Cache key for data status."""
    return f"data-status:{service}:{start_date}:{end_date}:{categories}"


def service_status_key(service: str) -> str:
    """Cache key for service status (data timestamps, deployments, builds)."""
    return f"service-status:{service}"


def build_info_key(service: str) -> str:
    """Cache key for Cloud Build info."""
    return f"build:{service}"


def trigger_id_key(service: str) -> str:
    """Cache key for Cloud Build trigger ID."""
    return f"trigger:{service}"


# =============================================================================
# Cache invalidation helpers
# =============================================================================


# Background tasks set to prevent GC of fire-and-forget tasks
_background_tasks: set[asyncio.Task[None]] = set()


def invalidate_deployment_cache_async(deployment_id: str | None = None):
    """Invalidate deployment-related caches."""

    async def _invalidate():
        if deployment_id:
            await cache.delete(deployment_key(deployment_id))
        await cache.clear_pattern("deployments:*")

    task = asyncio.create_task(_invalidate())
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)


def invalidate_service_status_cache_async(service: str | None = None):
    """Invalidate service status caches."""

    async def _invalidate():
        if service:
            await cache.delete(service_status_key(service))
            await cache.delete(build_info_key(service))
        else:
            await cache.clear_pattern("service-status:*")
            await cache.clear_pattern("build:*")

    task = asyncio.create_task(_invalidate())
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)


# =============================================================================
# Cache TTL recommendations by endpoint
# =============================================================================

TTL_HEALTH = 5  # Health checks - very short
TTL_DEPLOYMENT_STATE = (
    10  # Individual deployment state (active deployments - short for near-real-time)
)
TTL_DEPLOYMENT_STATE_TERMINAL = (
    60  # Terminal deployment state (completed/failed/cancelled - longer)
)
TTL_DEPLOYMENT_LIST = 30  # Deployment list (30s - keep list fresh for running/pending status)
TTL_DATA_STATUS = 1800  # Data status checks (30 min - expensive queries, data rarely changes)
TTL_SERVICE_STATUS = 120  # Service status (2 min)
TTL_BUILD_INFO = 300  # Cloud Build info (5 min, slow API)
TTL_TRIGGER_ID = 3600  # Trigger IDs (1 hour, rarely changes)
TTL_SERVICE_CONFIG = 600  # Service configs (10 min)
TTL_LOGS = 10  # Logs - short (real-time important)
