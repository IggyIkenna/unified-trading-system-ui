"""
Unit tests for batch_result_processor module.

Tests cover file count calculation, venue-weighted totals, category completion
percentage updates, and final response building.
"""

from deployment_api.routes.batch_result_processor import (
    build_final_response,
    calculate_overall_file_counts,
    calculate_venue_weighted_totals,
    update_category_completion_percentages,
)


class TestCalculateOverallFileCounts:
    """Tests for calculate_overall_file_counts."""

    def test_returns_none_when_not_requested(self):
        results = {"CEFI": {"file_counts": {"total_files": 100, "dates_with_file_counts": 5}}}
        result = calculate_overall_file_counts(results, include_file_counts=False)
        assert result is None

    def test_aggregates_across_categories(self):
        results = {
            "CEFI": {"file_counts": {"total_files": 100, "dates_with_file_counts": 5}},
            "DEFI": {"file_counts": {"total_files": 200, "dates_with_file_counts": 10}},
        }
        result = calculate_overall_file_counts(results, include_file_counts=True)
        assert result is not None
        assert result["total_files"] == 300
        assert result["dates_with_file_counts"] == 15
        assert result["avg_files_per_date"] == 20.0

    def test_skips_error_categories(self):
        results = {
            "CEFI": {"file_counts": {"total_files": 100, "dates_with_file_counts": 5}},
            "DEFI": {"error": "Failed to load"},
        }
        result = calculate_overall_file_counts(results, include_file_counts=True)
        assert result is not None
        assert result["total_files"] == 100

    def test_returns_none_when_no_files(self):
        results = {"CEFI": {"file_counts": {"total_files": 0, "dates_with_file_counts": 0}}}
        result = calculate_overall_file_counts(results, include_file_counts=True)
        assert result is None

    def test_avg_files_zero_when_no_dates_with_counts(self):
        results = {"CEFI": {"file_counts": {"total_files": 100, "dates_with_file_counts": 0}}}
        result = calculate_overall_file_counts(results, include_file_counts=True)
        assert result is not None
        assert result["avg_files_per_date"] == 0


class TestCalculateVenueWeightedTotals:
    """Tests for calculate_venue_weighted_totals."""

    def test_venue_weighted_sums(self):
        results = {
            "CEFI": {
                "venues": {
                    "BINANCE": {
                        "_dim_weighted_expected": 30,
                        "_dim_weighted_found": 28,
                        "is_expected": True,
                    }
                },
                "venue_summary": {"expected_but_missing": []},
                "dates_expected": 30,
                "dates_found": 28,
            }
        }
        exp, found, missing, _unexpected = calculate_venue_weighted_totals(
            results, set(), {}, "instruments-service"
        )
        assert exp == 30
        assert found == 28
        assert missing == 2

    def test_skips_bonus_venues(self):
        results = {
            "CEFI": {
                "venues": {
                    "BONUS_VENUE": {
                        "_dim_weighted_expected": 30,
                        "_dim_weighted_found": 10,
                        "is_expected": False,
                    }
                },
                "venue_summary": {"expected_but_missing": []},
                "dates_expected": 0,
                "dates_found": 0,
            }
        }
        exp, found, _missing, _ = calculate_venue_weighted_totals(
            results, set(), {}, "instruments-service"
        )
        assert exp == 0
        assert found == 0

    def test_skips_error_categories(self):
        results = {"CEFI": {"error": "Failed"}}
        exp, found, _missing, _ = calculate_venue_weighted_totals(
            results, set(), {}, "instruments-service"
        )
        assert exp == 0
        assert found == 0

    def test_fallback_to_category_level_when_no_venues(self):
        results = {
            "CEFI": {
                "venues": {},
                "venue_summary": {},
                "dates_expected": 20,
                "dates_found": 18,
            }
        }
        exp, found, missing, _ = calculate_venue_weighted_totals(
            results, set(), {}, "instruments-service"
        )
        assert exp == 20
        assert found == 18
        assert missing == 2

    def test_missing_venue_dim_expected_counted(self):
        # _missing_venue_dim_expected is only used when venues dict is non-empty
        results = {
            "CEFI": {
                "venues": {
                    "EXISTING": {
                        "_dim_weighted_expected": 10,
                        "_dim_weighted_found": 10,
                        "is_expected": True,
                    }
                },
                "venue_summary": {"expected_but_missing": []},
                "_missing_venue_dim_expected": 15,
                "dates_expected": 0,
                "dates_found": 0,
            }
        }
        exp, _found, missing, _ = calculate_venue_weighted_totals(
            results, set(), {}, "instruments-service"
        )
        assert missing == 15
        assert exp == 25  # 10 from venue + 15 from missing_dim_expected


class TestUpdateCategoryCompletionPercentages:
    """Tests for update_category_completion_percentages."""

    def test_updates_completion_pct(self):
        results = {
            "CEFI": {
                "venues": {
                    "BINANCE": {
                        "_dim_weighted_expected": 100,
                        "_dim_weighted_found": 75,
                        "is_expected": True,
                    }
                },
                "venue_summary": {"expected_but_missing": []},
            }
        }
        update_category_completion_percentages(results, set(), {}, "instruments-service")
        assert results["CEFI"]["completion_pct"] == 75.0
        assert results["CEFI"]["venue_weighted"] is True

    def test_skips_error_categories(self):
        results = {"CEFI": {"error": "Failed"}}
        # Should not raise
        update_category_completion_percentages(results, set(), {}, "svc")
        assert "completion_pct" not in results["CEFI"]

    def test_skips_when_no_venues(self):
        results = {"CEFI": {"venues": {}, "completion_pct": 50.0}}
        update_category_completion_percentages(results, set(), {}, "svc")
        # No venues means no update
        assert results["CEFI"]["completion_pct"] == 50.0

    def test_100_percent_when_all_found(self):
        results = {
            "CEFI": {
                "venues": {
                    "BINANCE": {
                        "_dim_weighted_expected": 30,
                        "_dim_weighted_found": 30,
                        "is_expected": True,
                    }
                },
                "venue_summary": {"expected_but_missing": []},
            }
        }
        update_category_completion_percentages(results, set(), {}, "svc")
        assert results["CEFI"]["completion_pct"] == 100.0

    def test_skips_bonus_venues_in_completion(self):
        results = {
            "CEFI": {
                "venues": {
                    "EXPECTED_VENUE": {
                        "_dim_weighted_expected": 10,
                        "_dim_weighted_found": 10,
                        "is_expected": True,
                    },
                    "BONUS_VENUE": {
                        "_dim_weighted_expected": 100,
                        "_dim_weighted_found": 50,
                        "is_expected": False,
                    },
                },
                "venue_summary": {"expected_but_missing": []},
            }
        }
        update_category_completion_percentages(results, set(), {}, "svc")
        # Should be 100% based only on expected venue
        assert results["CEFI"]["completion_pct"] == 100.0


class TestBuildFinalResponse:
    """Tests for build_final_response."""

    def _base_call(self, **overrides):
        kwargs = {
            "service": "instruments-service",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "first_day_of_month_only": False,
            "sub_dimension_name": "venue",
            "include_sub_dimensions": True,
            "include_file_counts": False,
            "all_dates": {f"2024-01-{d:02d}" for d in range(1, 32)},
            "total_venue_expected": 31,
            "total_venue_found": 28,
            "total_expected_category": 31,
            "total_found_category": 28,
            "expected_missing": 3,
            "unexpected_missing": 0,
            "results": {"CEFI": {"completion_pct": 90.3}},
            "overall_file_counts": None,
        }
        kwargs.update(overrides)
        return build_final_response(**kwargs)

    def test_basic_response_structure(self):
        resp = self._base_call()
        assert resp["service"] == "instruments-service"
        assert "date_range" in resp
        assert "overall_completion_pct" in resp
        assert "categories" in resp

    def test_completion_pct_venue_weighted(self):
        resp = self._base_call(total_venue_expected=100, total_venue_found=90)
        assert resp["overall_completion_pct"] == 90.0

    def test_completion_pct_falls_back_to_category(self):
        resp = self._base_call(
            total_venue_expected=0,
            total_venue_found=0,
            total_expected_category=100,
            total_found_category=80,
        )
        assert resp["overall_completion_pct"] == 80.0

    def test_zero_expected_is_zero_pct(self):
        resp = self._base_call(
            total_venue_expected=0,
            total_venue_found=0,
            total_expected_category=0,
            total_found_category=0,
        )
        assert resp["overall_completion_pct"] == 0.0

    def test_sub_dimension_included(self):
        resp = self._base_call(include_sub_dimensions=True)
        assert resp["sub_dimension"] == "venue"

    def test_sub_dimension_excluded(self):
        resp = self._base_call(include_sub_dimensions=False)
        assert resp["sub_dimension"] is None

    def test_file_counts_included_when_present(self):
        file_counts = {
            "total_files": 1000,
            "dates_with_file_counts": 31,
            "avg_files_per_date": 32.3,
        }
        resp = self._base_call(overall_file_counts=file_counts)
        assert "overall_file_counts" in resp
        assert resp["overall_file_counts"]["total_files"] == 1000

    def test_file_counts_absent_when_none(self):
        resp = self._base_call(overall_file_counts=None)
        assert "overall_file_counts" not in resp

    def test_date_range_days(self):
        dates = {"2024-01-01", "2024-01-02", "2024-01-03"}
        resp = self._base_call(all_dates=dates)
        assert resp["date_range"]["days"] == 3

    def test_mode_is_turbo(self):
        resp = self._base_call()
        assert resp["mode"] == "turbo"
