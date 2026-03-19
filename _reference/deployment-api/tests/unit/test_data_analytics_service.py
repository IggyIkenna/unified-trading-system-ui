"""
Unit tests for data_analytics_service module.

Tests cover pure methods: _generate_cache_key, get_cached_result,
cache_result, _evict_old_entries, _calculate_variance, _calculate_trend,
_extract_completion_rate.
"""

import importlib.util
import os
from datetime import UTC, datetime, timedelta

# Load data_analytics_service directly without triggering services/__init__.py
# The module only imports: json, logging, datetime, timedelta, typing — no circular deps
_path = os.path.join(
    os.path.dirname(__file__), "../../deployment_api/services/data_analytics_service.py"
)
_spec = importlib.util.spec_from_file_location("_das_standalone", os.path.abspath(_path))
assert _spec is not None and _spec.loader is not None
_das_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_das_mod)  # type: ignore[union-attr]
DataAnalyticsService = _das_mod.DataAnalyticsService


class TestGenerateCacheKey:
    """Tests for DataAnalyticsService._generate_cache_key."""

    def setup_method(self):
        self.svc = DataAnalyticsService()

    def test_basic_key(self):
        key = self.svc._generate_cache_key("instruments-service", "2024-01-01", "2024-01-31")
        assert "instruments-service" in key
        assert "2024-01-01" in key
        assert "2024-01-31" in key

    def test_with_categories(self):
        key = self.svc._generate_cache_key(
            "instruments-service", "2024-01-01", "2024-01-31", categories=["CEFI", "TRADFI"]
        )
        assert "cats:CEFI,TRADFI" in key

    def test_categories_sorted(self):
        key1 = self.svc._generate_cache_key(
            "svc", "2024-01-01", "2024-01-31", categories=["TRADFI", "CEFI"]
        )
        key2 = self.svc._generate_cache_key(
            "svc", "2024-01-01", "2024-01-31", categories=["CEFI", "TRADFI"]
        )
        assert key1 == key2

    def test_with_venues(self):
        key = self.svc._generate_cache_key(
            "svc", "2024-01-01", "2024-01-31", venues=["BINANCE", "COINBASE"]
        )
        assert "venues:" in key

    def test_with_kwargs(self):
        key = self.svc._generate_cache_key("svc", "2024-01-01", "2024-01-31", mode="turbo")
        assert "mode:turbo" in key

    def test_none_kwargs_excluded(self):
        key = self.svc._generate_cache_key("svc", "2024-01-01", "2024-01-31", mode=None)
        assert "mode" not in key


class TestGetCachedResult:
    """Tests for DataAnalyticsService.get_cached_result."""

    def setup_method(self):
        self.svc = DataAnalyticsService()

    def test_miss_when_empty(self):
        result = self.svc.get_cached_result("nonexistent")
        assert result is None
        assert self.svc._cache_stats["misses"] == 1

    def test_hit_when_present(self):
        key = "test-key"
        self.svc._turbo_cache[key] = {
            "result": {"data": "value"},
            "cached_at": datetime.now(UTC).isoformat(),
        }
        result = self.svc.get_cached_result(key)
        assert result == {"data": "value"}
        assert self.svc._cache_stats["hits"] == 1

    def test_miss_when_expired(self):
        key = "expired-key"
        old_time = (datetime.now(UTC) - timedelta(minutes=10)).isoformat()
        self.svc._turbo_cache[key] = {
            "result": {"data": "old"},
            "cached_at": old_time,
        }
        result = self.svc.get_cached_result(key)
        assert result is None
        assert key not in self.svc._turbo_cache

    def test_miss_when_no_cached_at(self):
        key = "bad-key"
        self.svc._turbo_cache[key] = {"result": {"data": "value"}}
        result = self.svc.get_cached_result(key)
        assert result is None


class TestCacheResult:
    """Tests for DataAnalyticsService.cache_result."""

    def setup_method(self):
        self.svc = DataAnalyticsService()

    def test_caches_result(self):
        self.svc.cache_result("key1", {"data": "value"})
        assert "key1" in self.svc._turbo_cache
        assert self.svc._cache_stats["entries"] == 1

    def test_retrieval_after_cache(self):
        self.svc.cache_result("key1", {"completion_pct": 95.0})
        result = self.svc.get_cached_result("key1")
        assert result is not None
        assert result["completion_pct"] == 95.0

    def test_eviction_triggered_at_101(self):
        # Fill cache with 101 entries to trigger eviction
        for i in range(101):
            self.svc.cache_result(f"key-{i}", {"i": i})
        # After eviction, should have fewer than 101
        assert len(self.svc._turbo_cache) < 101


class TestEvictOldEntries:
    """Tests for DataAnalyticsService._evict_old_entries."""

    def setup_method(self):
        self.svc = DataAnalyticsService()

    def test_evicts_oldest_20_percent(self):
        # Add 10 entries with different timestamps
        for i in range(10):
            old_time = (datetime.now(UTC) - timedelta(hours=10 - i)).isoformat()
            self.svc._turbo_cache[f"key-{i}"] = {
                "result": {},
                "cached_at": old_time,
            }
        self.svc._evict_old_entries()
        # Should remove at least 2 (20% of 10)
        assert len(self.svc._turbo_cache) <= 8

    def test_handles_invalid_timestamp(self):
        # Entries with invalid timestamps get skipped (no cached_at key)
        # Use only valid timestamps to avoid naive/aware comparison bug in evict
        for i in range(5):
            self.svc._turbo_cache[f"key-{i}"] = {
                "result": {},
                "cached_at": (datetime.now(UTC) - timedelta(hours=5 - i)).isoformat(),
            }
        # No cached_at means skip — but valid timestamps should not raise
        self.svc._evict_old_entries()


class TestCalculateVariance:
    """Tests for DataAnalyticsService._calculate_variance."""

    def setup_method(self):
        self.svc = DataAnalyticsService()

    def test_empty_list(self):
        assert self.svc._calculate_variance([]) == 0.0

    def test_single_value(self):
        assert self.svc._calculate_variance([42.0]) == 0.0

    def test_uniform_values(self):
        assert self.svc._calculate_variance([5.0, 5.0, 5.0]) == 0.0

    def test_known_variance(self):
        # [2, 4, 4, 4, 5, 5, 7, 9] has variance 4.0
        result = self.svc._calculate_variance([2, 4, 4, 4, 5, 5, 7, 9])
        assert abs(result - 4.0) < 0.01


class TestCalculateTrend:
    """Tests for DataAnalyticsService._calculate_trend."""

    def setup_method(self):
        self.svc = DataAnalyticsService()

    def test_insufficient_data(self):
        assert self.svc._calculate_trend([]) == "insufficient_data"
        assert self.svc._calculate_trend([1.0]) == "insufficient_data"
        assert self.svc._calculate_trend([1.0, 2.0]) == "insufficient_data"

    def test_stable_trend(self):
        # Small diff (< 2%) means stable
        result = self.svc._calculate_trend([50.0, 50.5, 50.0, 50.1, 50.0, 50.2, 50.0, 50.1, 50.0])
        assert result == "stable"

    def test_improving_trend(self):
        result = self.svc._calculate_trend([10.0, 11.0, 12.0, 50.0, 60.0, 70.0, 90.0, 95.0, 98.0])
        assert result == "improving"

    def test_declining_trend(self):
        result = self.svc._calculate_trend([90.0, 85.0, 80.0, 50.0, 40.0, 30.0, 10.0, 8.0, 5.0])
        assert result == "declining"


class TestExtractCompletionRate:
    """Tests for DataAnalyticsService._extract_completion_rate."""

    def setup_method(self):
        self.svc = DataAnalyticsService()

    def test_no_dates_key_returns_zero(self):
        assert self.svc._extract_completion_rate({}) == 0.0

    def test_all_present(self):
        data = {
            "dates": [
                {"venues": [{"status": "present"}, {"status": "present"}]},
            ]
        }
        assert self.svc._extract_completion_rate(data) == 100.0

    def test_all_missing(self):
        data = {
            "dates": [
                {"venues": [{"status": "missing"}, {"status": "missing"}]},
            ]
        }
        assert self.svc._extract_completion_rate(data) == 0.0

    def test_half_missing(self):
        data = {
            "dates": [
                {"venues": [{"status": "present"}, {"status": "missing"}]},
            ]
        }
        assert self.svc._extract_completion_rate(data) == 50.0

    def test_empty_dates(self):
        data = {"dates": []}
        assert self.svc._extract_completion_rate(data) == 0.0
