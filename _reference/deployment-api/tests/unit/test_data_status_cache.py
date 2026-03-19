"""
Unit tests for data_status_cache module.

Tests cover cache get/set/clear/stats operations, TTL expiration,
truncation logic, and execution-service cache functions.
"""

from deployment_api.utils.data_status_cache import (
    _make_cache_key,
    clear_cache,
    get_cache_stats,
    get_cached_result,
    get_exec_cached_result,
    set_cached_result,
    set_exec_cached_result,
    truncate_dates_list,
)


class TestMakeCacheKey:
    """Tests for _make_cache_key."""

    def test_same_params_give_same_key(self):
        k1 = _make_cache_key("svc", "2024-01-01", "2024-01-31", ["CEFI"])
        k2 = _make_cache_key("svc", "2024-01-01", "2024-01-31", ["CEFI"])
        assert k1 == k2

    def test_different_service_different_key(self):
        k1 = _make_cache_key("svc-a", "2024-01-01", "2024-01-31", None)
        k2 = _make_cache_key("svc-b", "2024-01-01", "2024-01-31", None)
        assert k1 != k2

    def test_different_dates_different_key(self):
        k1 = _make_cache_key("svc", "2024-01-01", "2024-01-31", None)
        k2 = _make_cache_key("svc", "2024-02-01", "2024-02-28", None)
        assert k1 != k2

    def test_category_order_normalized(self):
        k1 = _make_cache_key("svc", "2024-01-01", "2024-01-31", ["CEFI", "DEFI"])
        k2 = _make_cache_key("svc", "2024-01-01", "2024-01-31", ["DEFI", "CEFI"])
        assert k1 == k2

    def test_mode_affects_key(self):
        k1 = _make_cache_key("svc", "2024-01-01", "2024-01-31", None, mode="batch")
        k2 = _make_cache_key("svc", "2024-01-01", "2024-01-31", None, mode="live")
        assert k1 != k2

    def test_flags_affect_key(self):
        k1 = _make_cache_key("svc", "2024-01-01", "2024-01-31", None, include_sub_dimensions=False)
        k2 = _make_cache_key("svc", "2024-01-01", "2024-01-31", None, include_sub_dimensions=True)
        assert k1 != k2


class TestGetSetCachedResult:
    """Tests for get_cached_result and set_cached_result."""

    def setup_method(self):
        clear_cache()

    def test_miss_returns_none(self):
        result = get_cached_result("svc", "2024-01-01", "2024-01-31", None)
        assert result is None

    def test_set_then_get_returns_result(self):
        data = {"service": "svc", "overall_completion_pct": 90.0}
        set_cached_result("svc", "2024-01-01", "2024-01-31", None, result=data)
        retrieved = get_cached_result("svc", "2024-01-01", "2024-01-31", None)
        assert retrieved is not None
        assert retrieved["overall_completion_pct"] == 90.0

    def test_different_params_miss(self):
        data = {"service": "svc"}
        set_cached_result("svc", "2024-01-01", "2024-01-31", ["CEFI"], result=data)
        # Different category filter should miss
        result = get_cached_result("svc", "2024-01-01", "2024-01-31", ["DEFI"])
        assert result is None

    def test_expired_entry_returns_none(self):
        from datetime import UTC, datetime

        data = {"service": "svc"}
        set_cached_result("svc", "2024-01-01", "2024-01-31", None, result=data)

        # Manually expire the entry
        from deployment_api.utils import data_status_cache

        for key in list(data_status_cache._cache.keys()):
            result_val, _ = data_status_cache._cache[key]
            data_status_cache._cache[key] = (result_val, datetime(2000, 1, 1, tzinfo=UTC))

        result = get_cached_result("svc", "2024-01-01", "2024-01-31", None)
        assert result is None

    def test_set_with_none_result_does_not_store(self):
        set_cached_result("svc", "2024-01-01", "2024-01-31", None, result=None)
        result = get_cached_result("svc", "2024-01-01", "2024-01-31", None)
        assert result is None


class TestClearCache:
    """Tests for clear_cache."""

    def setup_method(self):
        clear_cache()

    def test_clear_returns_count(self):
        set_cached_result("svc", "2024-01-01", "2024-01-31", None, result={"a": 1})
        set_cached_result("svc", "2024-02-01", "2024-02-28", None, result={"b": 2})
        count = clear_cache()
        assert count == 2

    def test_clear_empty_cache_returns_zero(self):
        count = clear_cache()
        assert count == 0

    def test_after_clear_cache_is_empty(self):
        set_cached_result("svc", "2024-01-01", "2024-01-31", None, result={"a": 1})
        clear_cache()
        result = get_cached_result("svc", "2024-01-01", "2024-01-31", None)
        assert result is None


class TestGetCacheStats:
    """Tests for get_cache_stats."""

    def setup_method(self):
        clear_cache()

    def test_empty_cache_stats(self):
        stats = get_cache_stats()
        assert stats["entries"] == 0
        assert stats["entries_detail"] == []

    def test_stats_with_entries(self):
        set_cached_result("svc", "2024-01-01", "2024-01-31", None, result={"service": "svc"})
        stats = get_cache_stats()
        assert stats["entries"] == 1
        assert len(stats["entries_detail"]) == 1
        entry = stats["entries_detail"][0]
        assert "key" in entry
        assert "service" in entry
        assert "age_seconds" in entry
        assert "expires_in_seconds" in entry


class TestTruncateDatesList:
    """Tests for truncate_dates_list."""

    def test_short_list_not_truncated(self):
        result = {
            "categories": {
                "CEFI": {
                    "dates_found_list": ["2024-01-01", "2024-01-02"],
                    "venues": {},
                }
            }
        }
        truncated = truncate_dates_list(result)
        cefi = truncated["categories"]["CEFI"]
        assert "dates_found_truncated" not in cefi
        assert len(cefi["dates_found_list"]) == 2

    def test_long_list_gets_truncated(self):
        long_dates = [f"2024-{m:02d}-{d:02d}" for m in range(1, 6) for d in range(1, 12)]
        result = {
            "categories": {
                "CEFI": {
                    "dates_found_list": long_dates,
                    "venues": {},
                }
            }
        }
        truncated = truncate_dates_list(result, max_items=10)
        cefi = truncated["categories"]["CEFI"]
        assert cefi.get("dates_found_truncated") is True
        assert len(cefi["dates_found_list"]) == 5  # half of 10
        assert "dates_found_list_tail" in cefi

    def test_original_not_modified(self):
        long_dates = list(range(60))
        result = {"categories": {"CEFI": {"dates_found_list": long_dates, "venues": {}}}}
        truncate_dates_list(result)
        # Original unchanged
        assert len(result["categories"]["CEFI"]["dates_found_list"]) == 60

    def test_venue_level_dates_truncated(self):
        long_dates = [f"2024-01-{d:02d}" for d in range(1, 56)]
        result = {
            "categories": {
                "CEFI": {
                    "venues": {
                        "BINANCE": {
                            "dates_found_list": long_dates,
                            "data_types": {},
                        }
                    },
                    "dates_found_list": [],
                    "dates_missing_list": [],
                }
            }
        }
        truncated = truncate_dates_list(result, max_items=10)
        venue = truncated["categories"]["CEFI"]["venues"]["BINANCE"]
        assert venue.get("dates_found_truncated") is True

    def test_missing_dates_list_truncated(self):
        long_dates = [f"2024-01-{d:02d}" for d in range(1, 56)]
        result = {
            "categories": {
                "CEFI": {
                    "dates_missing_list": long_dates,
                    "venues": {},
                }
            }
        }
        truncated = truncate_dates_list(result, max_items=10)
        cefi = truncated["categories"]["CEFI"]
        assert cefi.get("dates_missing_truncated") is True

    def test_data_type_level_truncated(self):
        long_dates = [f"2024-01-{d:02d}" for d in range(1, 56)]
        result = {
            "categories": {
                "CEFI": {
                    "dates_found_list": [],
                    "dates_missing_list": [],
                    "venues": {
                        "BINANCE": {
                            "dates_found_list": [],
                            "dates_missing_list": [],
                            "data_types": {"trades": {"dates_found_list": long_dates}},
                        }
                    },
                }
            }
        }
        truncated = truncate_dates_list(result, max_items=10)
        dt = truncated["categories"]["CEFI"]["venues"]["BINANCE"]["data_types"]["trades"]
        assert dt.get("dates_found_truncated") is True


class TestExecCache:
    """Tests for execution-service cache functions."""

    def setup_method(self):
        clear_cache()

    def test_exec_miss_returns_none(self):
        result = get_exec_cached_result("/path/to/config.yaml", "2024-01-01", "2024-01-31")
        assert result is None

    def test_exec_set_then_get(self):
        data = {"config_path": "/path/to/config.yaml", "status": "ok"}
        set_exec_cached_result("/path/to/config.yaml", "2024-01-01", "2024-01-31", data)
        result = get_exec_cached_result("/path/to/config.yaml", "2024-01-01", "2024-01-31")
        assert result is not None
        assert result["status"] == "ok"

    def test_exec_different_dates_miss(self):
        data = {"status": "ok"}
        set_exec_cached_result("/path/config.yaml", "2024-01-01", "2024-01-31", data)
        result = get_exec_cached_result("/path/config.yaml", "2024-02-01", "2024-02-28")
        assert result is None

    def test_exec_expired_returns_none(self):
        from datetime import UTC, datetime

        data = {"status": "ok"}
        set_exec_cached_result("/cfg.yaml", None, None, data)

        from deployment_api.utils import data_status_cache

        for key in list(data_status_cache._cache.keys()):
            result_val, _ = data_status_cache._cache[key]
            data_status_cache._cache[key] = (result_val, datetime(2000, 1, 1, tzinfo=UTC))

        result = get_exec_cached_result("/cfg.yaml", None, None)
        assert result is None
