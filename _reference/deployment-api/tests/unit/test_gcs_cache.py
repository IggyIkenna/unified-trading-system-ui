"""
Unit tests for GCSCache in cache.py.

Tests avoid GCS calls by pre-loading _local_cache and _loaded=True.
"""

import asyncio
import time
from unittest.mock import MagicMock, patch

import pytest

from deployment_api.utils.cache import GCSCache


def _make_loaded_cache(**initial_data) -> GCSCache:
    """Create a GCSCache with data pre-loaded (no GCS needed)."""
    cache = GCSCache(bucket_name="test-bucket", blob_path="test/cache.json")
    cache._loaded = True
    cache._local_cache = dict(initial_data)
    return cache


@pytest.mark.asyncio
class TestGCSCacheGetSet:
    """Tests for GCSCache.get and .set."""

    async def test_get_missing_key_returns_none(self):
        cache = _make_loaded_cache()
        result = await cache.get("nonexistent")
        assert result is None

    async def test_get_present_key(self):
        cache = _make_loaded_cache(key1={"value": "hello", "expires_at": time.time() + 60})
        result = await cache.get("key1")
        assert result == "hello"

    async def test_get_expired_key_returns_none(self):
        cache = _make_loaded_cache(key1={"value": "old", "expires_at": time.time() - 1})
        result = await cache.get("key1")
        assert result is None
        assert "key1" not in cache._local_cache

    async def test_set_stores_value(self):
        cache = _make_loaded_cache()
        with patch.object(
            asyncio, "get_event_loop", return_value=MagicMock(run_in_executor=MagicMock())
        ):
            await cache.set("key1", {"data": "value"}, ttl=60)
        assert "key1" in cache._local_cache
        assert cache._local_cache["key1"]["value"] == {"data": "value"}

    async def test_set_respects_ttl(self):
        cache = _make_loaded_cache()
        with patch.object(
            asyncio, "get_event_loop", return_value=MagicMock(run_in_executor=MagicMock())
        ):
            await cache.set("key1", "value", ttl=60)
        expires_at = cache._local_cache["key1"]["expires_at"]
        assert expires_at > time.time()
        assert expires_at < time.time() + 65


@pytest.mark.asyncio
class TestGCSCacheDelete:
    """Tests for GCSCache.delete."""

    async def test_delete_existing_key(self):
        cache = _make_loaded_cache(key1={"value": "v", "expires_at": time.time() + 60})
        with patch.object(
            asyncio, "get_event_loop", return_value=MagicMock(run_in_executor=MagicMock())
        ):
            await cache.delete("key1")
        assert "key1" not in cache._local_cache

    async def test_delete_nonexistent_no_error(self):
        cache = _make_loaded_cache()
        with patch.object(
            asyncio, "get_event_loop", return_value=MagicMock(run_in_executor=MagicMock())
        ):
            await cache.delete("nonexistent")  # Should not raise


@pytest.mark.asyncio
class TestGCSCacheClearPattern:
    """Tests for GCSCache.clear_pattern."""

    async def test_clears_matching_keys(self):
        cache = _make_loaded_cache(
            **{
                "dep:1": {"value": "v1", "expires_at": time.time() + 60},
                "dep:2": {"value": "v2", "expires_at": time.time() + 60},
                "other": {"value": "v3", "expires_at": time.time() + 60},
            }
        )
        with patch.object(
            asyncio, "get_event_loop", return_value=MagicMock(run_in_executor=MagicMock())
        ):
            count = await cache.clear_pattern("dep:*")
        assert count == 2
        assert "dep:1" not in cache._local_cache
        assert "dep:2" not in cache._local_cache
        assert "other" in cache._local_cache

    async def test_clear_nonmatching_returns_zero(self):
        cache = _make_loaded_cache(key1={"value": "v", "expires_at": time.time() + 60})
        with patch.object(
            asyncio, "get_event_loop", return_value=MagicMock(run_in_executor=MagicMock())
        ):
            count = await cache.clear_pattern("dep:*")
        assert count == 0


class TestGCSCacheSaveToGcsSync:
    """Tests for GCSCache._save_to_gcs_sync."""

    def test_save_via_storage_facade(self):
        cache = _make_loaded_cache(key1={"value": "v", "expires_at": 999})
        with patch("deployment_api.utils.storage_facade.write_object_text") as mock_write:
            import deployment_api.utils.storage_facade as sf_mod

            sf_mod.write_object_text = mock_write
            cache._save_to_gcs_sync()
            # write_object_text should have been called once
            mock_write.assert_called_once()

    def test_save_does_not_raise_on_storage_error(self):
        cache = _make_loaded_cache()
        with patch(
            "deployment_api.utils.storage_facade.write_object_text",
            side_effect=OSError("write failed"),
        ):
            cache._save_to_gcs_sync()  # Should not raise
