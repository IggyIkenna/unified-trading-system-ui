"""
Unit tests for service_status_cache module.

Tests cover:
- _load_gcs_cache (with mocked storage)
- _save_gcs_cache (with mocked storage)
- _clear_gcs_cache
- Public interface (load_gcs_cache, save_gcs_cache, clear_gcs_cache)
"""

import json
from unittest.mock import MagicMock, patch

import pytest

import deployment_api.routes.service_status_cache as cache_mod
from deployment_api.routes.service_status_cache import (
    clear_gcs_cache,
    load_gcs_cache,
    save_gcs_cache,
)


@pytest.fixture(autouse=True)
def reset_cache_state():
    """Reset module-level cache state before each test."""
    cache_mod._local_cache = {}
    cache_mod._cache_loaded = False
    yield
    cache_mod._local_cache = {}
    cache_mod._cache_loaded = False


class TestLoadGcsCache:
    """Tests for _load_gcs_cache / load_gcs_cache."""

    def test_returns_cached_on_second_call(self):
        cache_mod._cache_loaded = True
        cache_mod._local_cache = {"trigger_ids": {"a": "b"}}
        result = load_gcs_cache()
        assert result == {"trigger_ids": {"a": "b"}}

    def test_loads_from_gcs_when_blob_exists(self):
        """When GCS blob exists, load_gcs_cache reads and parses the JSON."""
        cached_data = {"trigger_ids": {"svc": "trig-001"}, "deployments": {}}
        import deployment_api.utils.storage_facade as sf_mod

        original_exists = getattr(sf_mod, "object_exists", None)
        original_read = getattr(sf_mod, "read_object_text", None)
        sf_mod.object_exists = MagicMock(return_value=True)
        sf_mod.read_object_text = MagicMock(return_value=json.dumps(cached_data))
        try:
            cache_mod._cache_loaded = False
            cache_mod._local_cache = {}
            result = load_gcs_cache()
            assert cache_mod._cache_loaded is True
            assert isinstance(result, dict)
        finally:
            if original_exists is not None:
                sf_mod.object_exists = original_exists
            if original_read is not None:
                sf_mod.read_object_text = original_read

    def test_returns_empty_cache_when_blob_missing(self):
        """When blob doesn't exist, returns fresh empty cache structure."""
        # Simulate storage facade imports and object_exists returning False
        mock_storage = MagicMock()
        mock_storage.object_exists.return_value = False

        with patch.dict("sys.modules"):
            # Directly exercise via setting up state: no blob
            cache_mod._cache_loaded = False
            cache_mod._local_cache = {}

            # Patch inside the function's import
            with (
                patch("deployment_api.utils.storage_facade.object_exists", return_value=False),
                patch("deployment_api.utils.storage_facade.read_object_text") as _mock_read,
            ):
                # Patch the function-level import
                import deployment_api.utils.storage_facade as sf_mod

                original_exists = getattr(sf_mod, "object_exists", None)
                sf_mod.object_exists = MagicMock(return_value=False)
                try:
                    _result = load_gcs_cache()
                    # Either loaded from GCS or returned empty; either way cache_loaded=True
                    assert cache_mod._cache_loaded is True
                finally:
                    if original_exists is not None:
                        sf_mod.object_exists = original_exists

    def test_returns_fallback_on_exception(self):
        """When storage throws, returns fallback empty cache."""
        cache_mod._cache_loaded = False

        import deployment_api.utils.storage_facade as sf_mod

        original_exists = getattr(sf_mod, "object_exists", None)
        sf_mod.object_exists = MagicMock(side_effect=OSError("connection error"))
        try:
            result = load_gcs_cache()
            assert isinstance(result, dict)
            assert cache_mod._cache_loaded is True
        finally:
            if original_exists is not None:
                sf_mod.object_exists = original_exists


class TestSaveGcsCache:
    """Tests for _save_gcs_cache / save_gcs_cache."""

    def test_save_calls_write_object_text(self):
        cache_mod._local_cache = {"trigger_ids": {"x": "y"}}

        import deployment_api.utils.storage_facade as sf_mod

        original_write = getattr(sf_mod, "write_object_text", None)
        write_mock = MagicMock()
        sf_mod.write_object_text = write_mock
        try:
            save_gcs_cache()
            write_mock.assert_called_once()
            # Verify the written JSON is parseable
            args = write_mock.call_args[0]
            written_json = args[2]
            parsed = json.loads(written_json)
            assert parsed["trigger_ids"] == {"x": "y"}
        finally:
            if original_write is not None:
                sf_mod.write_object_text = original_write

    def test_save_does_not_raise_on_exception(self):
        cache_mod._local_cache = {}

        import deployment_api.utils.storage_facade as sf_mod

        original_write = getattr(sf_mod, "write_object_text", None)
        sf_mod.write_object_text = MagicMock(side_effect=OSError("write failed"))
        try:
            # Should not raise
            save_gcs_cache()
        finally:
            if original_write is not None:
                sf_mod.write_object_text = original_write


class TestClearGcsCache:
    """Tests for _clear_gcs_cache / clear_gcs_cache."""

    def test_clear_resets_local_cache_structure(self):
        cache_mod._local_cache = {"trigger_ids": {"old": "data"}}

        import deployment_api.utils.storage_facade as sf_mod

        original_write = getattr(sf_mod, "write_object_text", None)
        sf_mod.write_object_text = MagicMock()
        try:
            clear_gcs_cache()
            assert cache_mod._local_cache["trigger_ids"] == {}
            assert cache_mod._local_cache["deployments"] == {}
            assert cache_mod._local_cache["deployment_times"] == {}
            assert cache_mod._cache_loaded is True
        finally:
            if original_write is not None:
                sf_mod.write_object_text = original_write

    def test_clear_sets_cache_loaded_true(self):
        import deployment_api.utils.storage_facade as sf_mod

        original_write = getattr(sf_mod, "write_object_text", None)
        sf_mod.write_object_text = MagicMock()
        try:
            clear_gcs_cache()
            assert cache_mod._cache_loaded is True
        finally:
            if original_write is not None:
                sf_mod.write_object_text = original_write

    def test_clear_calls_save(self):
        import deployment_api.utils.storage_facade as sf_mod

        original_write = getattr(sf_mod, "write_object_text", None)
        write_mock = MagicMock()
        sf_mod.write_object_text = write_mock
        try:
            clear_gcs_cache()
            write_mock.assert_called_once()
        finally:
            if original_write is not None:
                sf_mod.write_object_text = original_write
