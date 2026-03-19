"""
Unit tests for InMemoryCache in cache.py.

Tests cover async get/set/delete/clear_pattern/cleanup_expired.
"""

import time

import pytest

from deployment_api.utils.cache import InMemoryCache


@pytest.mark.asyncio
class TestInMemoryCache:
    """Tests for InMemoryCache."""

    async def test_set_and_get(self):
        cache = InMemoryCache()
        await cache.set("key1", {"data": "value"}, ttl=60)
        result = await cache.get("key1")
        assert result == {"data": "value"}

    async def test_get_missing_key_returns_none(self):
        cache = InMemoryCache()
        result = await cache.get("nonexistent")
        assert result is None

    async def test_get_expired_key_returns_none(self):
        cache = InMemoryCache()
        await cache.set("key1", "value", ttl=1)
        # Manually expire it
        cache._cache["key1"]["expires_at"] = time.time() - 1
        result = await cache.get("key1")
        assert result is None
        assert "key1" not in cache._cache

    async def test_delete_existing_key(self):
        cache = InMemoryCache()
        await cache.set("key1", "value", ttl=60)
        await cache.delete("key1")
        assert await cache.get("key1") is None

    async def test_delete_nonexistent_key_no_error(self):
        cache = InMemoryCache()
        await cache.delete("nonexistent")  # Should not raise

    async def test_clear_pattern_removes_matching_keys(self):
        cache = InMemoryCache()
        await cache.set("dep:dep1", "v1", ttl=60)
        await cache.set("dep:dep2", "v2", ttl=60)
        await cache.set("other:key", "v3", ttl=60)
        count = await cache.clear_pattern("dep:*")
        assert count == 2
        assert await cache.get("dep:dep1") is None
        assert await cache.get("dep:dep2") is None
        assert await cache.get("other:key") == "v3"

    async def test_clear_pattern_returns_zero_when_no_match(self):
        cache = InMemoryCache()
        await cache.set("unrelated", "val", ttl=60)
        count = await cache.clear_pattern("dep:*")
        assert count == 0

    async def test_cleanup_expired_removes_old_entries(self):
        cache = InMemoryCache()
        await cache.set("fresh", "value", ttl=60)
        await cache.set("stale", "value", ttl=60)
        cache._cache["stale"]["expires_at"] = time.time() - 1
        await cache.cleanup_expired()
        assert "fresh" in cache._cache
        assert "stale" not in cache._cache

    async def test_cleanup_expired_no_entries_no_error(self):
        cache = InMemoryCache()
        await cache.cleanup_expired()  # Should not raise

    async def test_overwrite_key_with_new_ttl(self):
        cache = InMemoryCache()
        await cache.set("key", "old_value", ttl=60)
        await cache.set("key", "new_value", ttl=120)
        result = await cache.get("key")
        assert result == "new_value"
