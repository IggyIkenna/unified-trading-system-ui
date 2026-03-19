"""
Unit tests for deployment_caching module pure helper functions.

Tests cover the synchronous, in-memory cache operations:
- get/set/clear for verification_cache, logs_cache, vm_logs_cache
- verification_pending set operations
- clear_all_caches
- invalidate_log_analysis_cache delegation
"""

import time

import pytest

import deployment_api.routes.deployment_caching as caching_mod
from deployment_api.routes.deployment_caching import (
    add_verification_pending,
    clear_all_caches,
    get_logs_cache,
    get_verification_cache,
    get_vm_logs_cache,
    is_verification_pending,
    remove_verification_pending,
    set_logs_cache,
    set_verification_cache,
    set_vm_logs_cache,
)


@pytest.fixture(autouse=True)
def reset_caches():
    """Clear all in-memory caches before and after each test."""
    clear_all_caches()
    yield
    clear_all_caches()


class TestVerificationCache:
    """Tests for get/set verification cache."""

    def test_get_missing_key_returns_none(self):
        assert get_verification_cache("nonexistent") is None

    def test_set_and_get_returns_data(self):
        data = {"verified": True, "date": "2026-01-01"}
        set_verification_cache("dep-001", data)
        result = get_verification_cache("dep-001")
        assert result == data

    def test_expired_entry_returns_none(self):
        # Manually insert an already-expired entry
        caching_mod._verification_cache["dep-exp"] = (time.time() - 1, {"old": True})
        assert get_verification_cache("dep-exp") is None

    def test_expired_entry_is_evicted(self):
        caching_mod._verification_cache["dep-exp"] = (time.time() - 1, {"old": True})
        get_verification_cache("dep-exp")
        assert "dep-exp" not in caching_mod._verification_cache

    def test_set_overwrites_existing(self):
        set_verification_cache("dep-001", {"v": 1})
        set_verification_cache("dep-001", {"v": 2})
        assert get_verification_cache("dep-001") == {"v": 2}

    def test_prunes_when_at_max_entries(self):
        max_entries = caching_mod._VERIFICATION_CACHE_MAX_ENTRIES
        # Fill to max - 1
        for i in range(max_entries - 1):
            set_verification_cache(f"dep-{i:04d}", {"i": i})
        assert len(caching_mod._verification_cache) == max_entries - 1
        # Adding one more should not exceed max
        set_verification_cache("dep-new", {"new": True})
        assert len(caching_mod._verification_cache) <= max_entries


class TestLogsCache:
    """Tests for get/set logs cache."""

    def test_get_missing_returns_none(self):
        assert get_logs_cache("no-key") is None

    def test_set_and_get(self):
        data = {"lines": ["line1", "line2"]}
        set_logs_cache("key-001", data)
        result = get_logs_cache("key-001")
        assert result == data

    def test_expired_returns_none(self):
        caching_mod._logs_cache["key-old"] = (time.time() - 1, {"stale": True})
        assert get_logs_cache("key-old") is None

    def test_expired_evicted(self):
        caching_mod._logs_cache["key-old"] = (time.time() - 1, {"stale": True})
        get_logs_cache("key-old")
        assert "key-old" not in caching_mod._logs_cache

    def test_prunes_when_at_max_entries(self):
        max_entries = caching_mod._LOGS_CACHE_MAX_ENTRIES
        for i in range(max_entries - 1):
            set_logs_cache(f"log-{i:04d}", {"i": i})
        set_logs_cache("log-new", {"new": True})
        assert len(caching_mod._logs_cache) <= max_entries


class TestVmLogsCache:
    """Tests for get/set VM logs cache."""

    def test_get_missing_returns_none(self):
        assert get_vm_logs_cache("no-key") is None

    def test_set_and_get(self):
        logs = ["log line 1", "log line 2"]
        message = "2 log lines"
        set_vm_logs_cache("vm-001", logs, message)
        result = get_vm_logs_cache("vm-001")
        assert result is not None
        returned_logs, returned_msg = result
        assert returned_logs == logs
        assert returned_msg == message

    def test_expired_returns_none(self):
        caching_mod._vm_logs_cache["vm-old"] = (time.time() - 1, ([], "stale"))
        assert get_vm_logs_cache("vm-old") is None

    def test_expired_evicted(self):
        caching_mod._vm_logs_cache["vm-old"] = (time.time() - 1, ([], "stale"))
        get_vm_logs_cache("vm-old")
        assert "vm-old" not in caching_mod._vm_logs_cache

    def test_prunes_when_at_max_entries(self):
        max_entries = caching_mod._VM_LOGS_CACHE_MAX_ENTRIES
        for i in range(max_entries - 1):
            set_vm_logs_cache(f"vm-{i:04d}", [], f"msg {i}")
        set_vm_logs_cache("vm-new", ["line"], "new msg")
        assert len(caching_mod._vm_logs_cache) <= max_entries


class TestVerificationPending:
    """Tests for add/remove/is_verification_pending."""

    def test_initially_not_pending(self):
        assert not is_verification_pending("dep-xyz")

    def test_add_makes_it_pending(self):
        add_verification_pending("dep-001")
        assert is_verification_pending("dep-001")

    def test_remove_clears_pending(self):
        add_verification_pending("dep-001")
        remove_verification_pending("dep-001")
        assert not is_verification_pending("dep-001")

    def test_remove_nonexistent_does_not_raise(self):
        remove_verification_pending("never-added")

    def test_multiple_deployments_tracked_independently(self):
        add_verification_pending("dep-a")
        add_verification_pending("dep-b")
        assert is_verification_pending("dep-a")
        assert is_verification_pending("dep-b")
        remove_verification_pending("dep-a")
        assert not is_verification_pending("dep-a")
        assert is_verification_pending("dep-b")


class TestClearAllCaches:
    """Tests for clear_all_caches."""

    def test_clears_verification_cache(self):
        set_verification_cache("dep-001", {"x": 1})
        clear_all_caches()
        assert get_verification_cache("dep-001") is None

    def test_clears_logs_cache(self):
        set_logs_cache("key-001", {"lines": []})
        clear_all_caches()
        assert get_logs_cache("key-001") is None

    def test_clears_vm_logs_cache(self):
        set_vm_logs_cache("vm-001", ["line"], "msg")
        clear_all_caches()
        assert get_vm_logs_cache("vm-001") is None

    def test_clears_verification_pending(self):
        add_verification_pending("dep-001")
        clear_all_caches()
        assert not is_verification_pending("dep-001")


class TestInvalidateLogAnalysisCache:
    """Tests for invalidate_log_analysis_cache delegation."""

    def test_delegation_works(self):
        from deployment_api.routes.deployment_caching import invalidate_log_analysis_cache
        from deployment_api.routes.log_analysis import _log_analysis_cache

        _log_analysis_cache["dep-001"] = {"data": {}, "timestamp": time.time()}
        invalidate_log_analysis_cache("dep-001")
        assert "dep-001" not in _log_analysis_cache

    def test_clear_all_delegation(self):
        from deployment_api.routes.deployment_caching import invalidate_log_analysis_cache
        from deployment_api.routes.log_analysis import _log_analysis_cache

        _log_analysis_cache["dep-a"] = {"data": {}, "timestamp": time.time()}
        _log_analysis_cache["dep-b"] = {"data": {}, "timestamp": time.time()}
        invalidate_log_analysis_cache(None)
        assert len(_log_analysis_cache) == 0
