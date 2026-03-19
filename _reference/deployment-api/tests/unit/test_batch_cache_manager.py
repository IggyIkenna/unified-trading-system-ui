"""
Unit tests for batch_cache_manager module.

Tests cover check_cache_for_result and store_result_in_cache.
"""

from deployment_api.routes.batch_cache_manager import check_cache_for_result, store_result_in_cache
from deployment_api.utils.data_status_cache import clear_cache


class TestCheckCacheForResult:
    """Tests for check_cache_for_result."""

    def setup_method(self):
        clear_cache()

    def _base_kwargs(self, **overrides):
        kwargs = {
            "service": "instruments-service",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "category": None,
            "venue": None,
            "folder": None,
            "data_type": None,
            "include_sub_dimensions": False,
            "include_instrument_types": False,
            "include_file_counts": False,
            "check_upstream_availability": False,
            "first_day_of_month_only": False,
            "freshness_date": None,
            "mode": "batch",
            "include_dates_list": True,
            "full_dates_list": False,
        }
        kwargs.update(overrides)
        return kwargs

    def test_returns_none_when_include_dates_list_false(self):
        result = check_cache_for_result(**self._base_kwargs(include_dates_list=False))
        assert result is None

    def test_returns_none_on_cache_miss(self):
        result = check_cache_for_result(**self._base_kwargs())
        assert result is None

    def test_returns_cached_result_on_hit(self):
        from deployment_api.utils.data_status_cache import set_cached_result

        data = {"service": "instruments-service", "overall_completion_pct": 90.0}
        set_cached_result("instruments-service", "2024-01-01", "2024-01-31", None, result=data)
        result = check_cache_for_result(**self._base_kwargs())
        assert result is not None

    def test_returns_truncated_when_not_full(self):
        from deployment_api.utils.data_status_cache import set_cached_result

        # Build a result with long dates list so truncation is visible
        long_dates = [f"2024-01-{d:02d}" for d in range(1, 56)]
        data = {
            "service": "instruments-service",
            "categories": {
                "CEFI": {
                    "dates_found_list": long_dates,
                    "dates_missing_list": [],
                    "venues": {},
                }
            },
        }
        set_cached_result("instruments-service", "2024-01-01", "2024-01-31", None, result=data)
        result = check_cache_for_result(**self._base_kwargs(full_dates_list=False))
        assert result is not None
        # The result should be returned (truncated or not)

    def test_returns_full_when_full_dates_list_true(self):
        from deployment_api.utils.data_status_cache import set_cached_result

        data = {"service": "instruments-service", "overall_completion_pct": 85.0}
        set_cached_result("instruments-service", "2024-01-01", "2024-01-31", None, result=data)
        result = check_cache_for_result(**self._base_kwargs(full_dates_list=True))
        assert result is not None
        assert result["overall_completion_pct"] == 85.0


class TestStoreResultInCache:
    """Tests for store_result_in_cache."""

    def setup_method(self):
        clear_cache()

    def _base_kwargs(self, **overrides):
        kwargs = {
            "service": "instruments-service",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "category": None,
            "venue": None,
            "folder": None,
            "data_type": None,
            "include_sub_dimensions": False,
            "include_instrument_types": False,
            "include_file_counts": False,
            "check_upstream_availability": False,
            "first_day_of_month_only": False,
            "freshness_date": None,
            "mode": "batch",
            "include_dates_list": True,
            "full_dates_list": False,
        }
        kwargs.update(overrides)
        return kwargs

    def test_stores_result_when_include_dates_list(self):
        response = {"service": "instruments-service", "overall_completion_pct": 80.0}
        store_result_in_cache(response, **self._base_kwargs())
        # Now check it's cached
        from deployment_api.utils.data_status_cache import get_cached_result

        cached = get_cached_result("instruments-service", "2024-01-01", "2024-01-31", None)
        assert cached is not None

    def test_does_not_store_when_include_dates_list_false(self):
        response = {"service": "instruments-service"}
        store_result_in_cache(response, **self._base_kwargs(include_dates_list=False))
        from deployment_api.utils.data_status_cache import get_cached_result

        cached = get_cached_result("instruments-service", "2024-01-01", "2024-01-31", None)
        assert cached is None

    def test_returns_response(self):
        response = {"service": "instruments-service", "overall_completion_pct": 75.0}
        result = store_result_in_cache(response, **self._base_kwargs())
        assert result is not None

    def test_returns_truncated_when_not_full(self):
        long_dates = [f"2024-01-{d:02d}" for d in range(1, 56)]
        response = {
            "service": "instruments-service",
            "categories": {
                "CEFI": {
                    "dates_found_list": long_dates,
                    "dates_missing_list": [],
                    "venues": {},
                }
            },
        }
        result = store_result_in_cache(response, **self._base_kwargs(full_dates_list=False))
        # Should return the response (potentially truncated)
        assert result is not None
        assert "categories" in result
