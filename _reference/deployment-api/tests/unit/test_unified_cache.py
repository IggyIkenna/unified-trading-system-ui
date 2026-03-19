"""
Unit tests for UnifiedCache in cache.py.

Tests use in-memory only mode (no Redis, no GCS).
"""

import pytest

from deployment_api.utils.cache import UnifiedCache


def _make_cache() -> UnifiedCache:
    """Create UnifiedCache with no Redis/GCS for unit testing."""
    cache = UnifiedCache(redis_url=None, storage_bucket=None, gcs_path=None)
    # Disable Redis and GCS backends explicitly
    cache.redis = None
    cache.gcs = None
    return cache


@pytest.mark.asyncio
class TestUnifiedCacheInMemoryOnly:
    """Tests for UnifiedCache using only in-memory tier."""

    async def test_set_and_get(self):
        cache = _make_cache()
        await cache.set("key1", {"data": "value"}, ttl=60)
        result = await cache.get("key1")
        assert result == {"data": "value"}

    async def test_get_missing_returns_none(self):
        cache = _make_cache()
        result = await cache.get("missing")
        assert result is None

    async def test_delete_key(self):
        cache = _make_cache()
        await cache.set("key1", "value", ttl=60)
        await cache.delete("key1")
        result = await cache.get("key1")
        assert result is None

    async def test_clear_pattern(self):
        cache = _make_cache()
        await cache.set("dep:1", "v1", ttl=60)
        await cache.set("dep:2", "v2", ttl=60)
        await cache.set("other:1", "v3", ttl=60)
        count = await cache.clear_pattern("dep:*")
        assert count == 2
        assert await cache.get("dep:1") is None
        assert await cache.get("other:1") == "v3"

    async def test_clear_pattern_returns_count(self):
        cache = _make_cache()
        await cache.set("dep:1", "v1", ttl=60)
        await cache.set("dep:2", "v2", ttl=60)
        count = await cache.clear_pattern("dep:*")
        assert count == 2

    async def test_shutdown_when_not_initialized(self):
        """Shutdown when not initialized should not raise."""
        cache = _make_cache()
        await cache.shutdown()  # No error expected

    async def test_initialize_skips_if_already_initialized(self):
        """Double-initialize should be a no-op."""
        cache = _make_cache()
        cache._initialized = True
        await cache.initialize()  # Should return early without error
        assert cache._initialized is True


@pytest.mark.asyncio
class TestUnifiedCacheGetOrFetch:
    """Tests for UnifiedCache.get_or_fetch."""

    async def test_fetches_when_cache_miss(self):
        cache = _make_cache()

        async def fetch():
            return {"fresh": "data"}

        result = await cache.get_or_fetch("key", fetch, ttl=60)
        assert result == {"fresh": "data"}

    async def test_uses_cache_on_second_call(self):
        cache = _make_cache()
        call_count = 0

        async def fetch():
            nonlocal call_count
            call_count += 1
            return {"fresh": "data"}

        await cache.get_or_fetch("key", fetch, ttl=60)
        await cache.get_or_fetch("key", fetch, ttl=60)
        assert call_count == 1  # Only fetched once

    async def test_force_refresh_bypasses_cache(self):
        cache = _make_cache()
        call_count = 0

        async def fetch():
            nonlocal call_count
            call_count += 1
            return {"fresh": "data"}

        await cache.get_or_fetch("key", fetch, ttl=60)
        await cache.get_or_fetch("key", fetch, ttl=60, force_refresh=True)
        assert call_count == 2  # Fetched both times

    async def test_none_result_not_cached(self):
        cache = _make_cache()
        call_count = 0

        async def fetch():
            nonlocal call_count
            call_count += 1
            return None

        await cache.get_or_fetch("key", fetch, ttl=60)
        await cache.get_or_fetch("key", fetch, ttl=60)
        assert call_count == 2  # None not cached, so fetched again

    async def test_backends_state(self):
        """Verify no Redis/GCS backends are attached in test mode."""
        cache = _make_cache()
        assert cache.redis is None
        assert cache.gcs is None
