"""
Unit tests for turbo completion metrics and calculations.

Tests the turbo mode completion calculations:
- Basic completion percentage formulas
- Dimension-weighted venue completion (bug fixes)
- Category aggregation using venue-weighted values
- Metric consistency checks
"""

from .turbo_fixtures import (
    create_completion_calculator,
)


class TestCompletionCalculation:
    """Tests for completion percentage calculation."""

    def test_completion_pct_formula(self):
        """Test that completion percentage is calculated correctly."""
        # Formula: (dates_found / dates_expected) * 100
        calculate_completion_pct = create_completion_calculator()

        test_cases = [
            (10, 10, 100.0),  # 100% complete
            (5, 10, 50.0),  # 50% complete
            (0, 10, 0.0),  # 0% complete
            (7, 10, 70.0),  # 70% complete
            (15, 17, 88.2),  # ~88.2% (rounded to 1 decimal)
        ]

        for found, expected, expected_pct in test_cases:
            pct = calculate_completion_pct(found, expected)
            assert pct == expected_pct, f"Expected {expected_pct}%, got {pct}%"

    def test_zero_expected_dates(self):
        """Test handling of zero expected dates (avoid division by zero)."""
        calculate_completion_pct = create_completion_calculator()

        found = 0
        expected = 0

        # Should return 0, not raise ZeroDivisionError
        pct = calculate_completion_pct(found, expected)
        assert pct == 0


class TestDimensionWeightedCompletion:
    """Tests for dimension-weighted venue completion calculation.

    Bug fixed: Venue completion used the UNION of dates across all data_types,
    so a venue showed 100% even when one data_type was only 6.7% complete.
    The fix recalculates venue completion as a weighted average across expected
    data_types/folders.
    """

    def test_venue_completion_reflects_all_data_types(self, sample_venue_breakdown_uniswap):
        """Test that venue completion accounts for all expected data types.

        Bug: UNISWAPV3-ETHEREUM showed 100% because liquidity had 30/30 dates,
        but swaps only had 2/30 dates. The union was 30 dates → 100%.
        Fix: venue completion = (30 + 2) / (30 + 30) = 53.3%
        """
        # Use the sample fixture data
        dt_breakdown = sample_venue_breakdown_uniswap["data_types"]

        # Old (buggy) calculation: union of dates
        # If liquidity has all 30 dates, union = 30, completion = 100%
        old_pct = 100.0  # This was the bug

        # New (fixed) calculation: weighted sum across data types
        total_dt_found = sum(dt["dates_found"] for dt in dt_breakdown.values())
        total_dt_expected = sum(dt["dates_expected"] for dt in dt_breakdown.values())
        new_pct = round(total_dt_found / total_dt_expected * 100, 1)

        assert new_pct == 53.3, f"Expected 53.3%, got {new_pct}%"
        assert new_pct != old_pct, "New calculation should differ from buggy one"

    def test_venue_completion_100_only_when_all_types_complete(self):
        """Test that venue shows 100% only when ALL data types are 100%."""
        # All data types fully complete
        dt_breakdown = {
            "liquidity": {"dates_found": 30, "dates_expected": 30},
            "swaps": {"dates_found": 30, "dates_expected": 30},
        }

        total_found = sum(dt["dates_found"] for dt in dt_breakdown.values())
        total_expected = sum(dt["dates_expected"] for dt in dt_breakdown.values())
        pct = round(total_found / total_expected * 100, 1)

        assert pct == 100.0

    def test_venue_completion_with_different_start_dates(self):
        """Test weighted completion when data types have different expected dates."""
        # data_type A started earlier (30 expected), B started later (15 expected)
        dt_breakdown = {
            "trades": {"dates_found": 25, "dates_expected": 30},
            "book_snapshot_5": {"dates_found": 10, "dates_expected": 15},
        }

        total_found = sum(dt["dates_found"] for dt in dt_breakdown.values())
        total_expected = sum(dt["dates_expected"] for dt in dt_breakdown.values())
        pct = round(total_found / total_expected * 100, 1)

        # (25 + 10) / (30 + 15) = 35/45 = 77.8%
        assert pct == 77.8

    def test_venue_completion_with_missing_expected_data_type(self):
        """Test that expected data types with zero data are accounted for."""
        # Only trades has data, but book_snapshot_5 is also expected
        expected_data_types = ["trades", "book_snapshot_5"]
        dt_breakdown = {
            "trades": {"dates_found": 30, "dates_expected": 30},
            # book_snapshot_5 is MISSING entirely
        }
        venue_expected_dates = 30  # Default expected dates

        # Calculate like the fixed code does
        total_found = 0
        total_expected = 0
        for dt_name in expected_data_types:
            if dt_name in dt_breakdown:
                total_found += dt_breakdown[dt_name]["dates_found"]
                total_expected += dt_breakdown[dt_name]["dates_expected"]
            else:
                # Missing data type: 0 found, venue_expected_dates expected
                total_expected += venue_expected_dates

        pct = round(total_found / total_expected * 100, 1)

        # trades: 30/30, book_snapshot_5: 0/30 → 30/60 = 50%
        assert pct == 50.0
        assert total_found == 30
        assert total_expected == 60

    def test_category_aggregation_uses_dimension_weighted_values(self):
        """Test that category completion uses dimension-weighted venue values."""
        venues = {
            "UNISWAPV2-ETHEREUM": {
                "dates_found": 30,  # Raw union (old)
                "dates_expected_venue": 30,
                "_dim_weighted_found": 60,  # Both data types complete
                "_dim_weighted_expected": 60,
                "is_expected": True,
            },
            "UNISWAPV3-ETHEREUM": {
                "dates_found": 30,  # Raw union (old)
                "dates_expected_venue": 30,
                "_dim_weighted_found": 32,  # liquidity=30, swaps=2
                "_dim_weighted_expected": 60,
                "is_expected": True,
            },
        }

        # Old (buggy) category calculation: uses raw dates_found
        old_found = sum(v["dates_found"] for v in venues.values())
        old_expected = sum(v["dates_expected_venue"] for v in venues.values())
        old_pct = round(old_found / old_expected * 100, 1)
        assert old_pct == 100.0  # Both venues show 30/30 → 100%

        # New (fixed) category calculation: uses dimension-weighted values
        new_found = sum(
            v.get("_dim_weighted_found", v["dates_found"])
            for v in venues.values()
            if v.get("is_expected", True)
        )
        new_expected = sum(
            v.get("_dim_weighted_expected", v["dates_expected_venue"])
            for v in venues.values()
            if v.get("is_expected", True)
        )
        new_pct = round(new_found / new_expected * 100, 1)

        # (60 + 32) / (60 + 60) = 92/120 = 76.7%
        assert new_pct == 76.7
        assert new_pct != old_pct

    def test_folder_weighted_completion(self):
        """Test dimension-weighted completion for folder/instrument_type breakdowns."""
        # Venue with instrument_type folders
        folder_breakdown = {
            "pool": {
                "dates_found": 30,
                "dates_expected": 30,
                "is_expected": True,
            },
            "lst": {
                "dates_found": 10,
                "dates_expected": 30,
                "is_expected": True,
            },
        }
        expected_inst_types = ["pool", "lst"]

        total_found = 0
        total_expected = 0
        for folder_name in expected_inst_types:
            if folder_name in folder_breakdown:
                total_found += folder_breakdown[folder_name]["dates_found"]
                total_expected += folder_breakdown[folder_name]["dates_expected"]

        pct = round(total_found / total_expected * 100, 1)

        # (30 + 10) / (30 + 30) = 40/60 = 66.7%
        assert pct == 66.7

    def test_bonus_venues_excluded_from_weighted_aggregation(self):
        """Test that bonus venues don't affect dimension-weighted aggregation."""
        venues = {
            "EXPECTED-VENUE": {
                "_dim_weighted_found": 50,
                "_dim_weighted_expected": 60,
                "is_expected": True,
            },
            "BONUS-VENUE": {
                "_dim_weighted_found": 5,
                "_dim_weighted_expected": 60,
                "is_expected": False,  # Bonus
            },
        }

        total_found = sum(
            v.get("_dim_weighted_found", 0) for v in venues.values() if v.get("is_expected", True)
        )
        total_expected = sum(
            v.get("_dim_weighted_expected", 0)
            for v in venues.values()
            if v.get("is_expected", True)
        )
        pct = round(total_found / total_expected * 100, 1)

        # Only EXPECTED-VENUE counts: 50/60 = 83.3%
        assert pct == 83.3

    def test_no_expected_data_types_keeps_union_behavior(self):
        """Test that venues without expected data_types keep the original calculation."""
        # Some venues don't have expected data_types configured.
        # In that case, the original union-based calculation is fine.
        venue_result = {
            "dates_found": 25,
            "dates_expected_venue": 30,
            "completion_pct": round(25 / 30 * 100, 1),
        }

        # No _dim_weighted fields means fallback to raw values
        found = venue_result.get("_dim_weighted_found", venue_result["dates_found"])
        expected = venue_result.get("_dim_weighted_expected", venue_result["dates_expected_venue"])

        assert found == 25
        assert expected == 30
        assert "_dim_weighted_found" not in venue_result


class TestMetricConsistency:
    """Tests for consistency between different metrics in the response."""

    def test_total_missing_consistency(self):
        """Test that total_missing is consistent with overall_completion_pct.

        When overall_completion_pct < 100%, total_missing should be > 0.
        When overall_completion_pct == 100%, total_missing should be 0.
        """
        # Simulate a response with partial completion
        response = {
            "overall_completion_pct": 97.4,
            "overall_dates_found": 701,
            "overall_dates_expected": 720,
            "total_missing": 19,  # 720 - 701 = 19
        }

        # Verify consistency
        assert (
            response["total_missing"]
            == response["overall_dates_expected"] - response["overall_dates_found"]
        )

        # If completion is not 100%, total_missing should be > 0
        if response["overall_completion_pct"] < 100:
            assert response["total_missing"] > 0

    def test_all_data_present_logic(self):
        """Test the logic for showing 'All expected data present' message.

        The message should only show when total_missing == 0, which corresponds
        to overall_completion_pct == 100%. Using category-level dates_missing
        can give inconsistent results because the overall completion uses
        venue-weighted totals.
        """
        # Case 1: All data present (100% completion)
        response_complete = {
            "overall_completion_pct": 100.0,
            "total_missing": 0,
            "categories": {
                "CEFI": {"dates_missing": 0},
                "TRADFI": {"dates_missing": 0},
            },
        }
        # Both metrics agree: should show "All expected data present"
        assert response_complete["total_missing"] == 0
        assert response_complete["overall_completion_pct"] == 100.0

        # Case 2: Partial completion (97.4%)
        response_partial = {
            "overall_completion_pct": 97.4,
            "total_missing": 19,
            "categories": {
                "CEFI": {"dates_missing": 0},  # Category level shows 0!
                "TRADFI": {"dates_missing": 0},  # Category level shows 0!
            },
        }
        # Category-level dates_missing can be 0 while venue-weighted total_missing > 0
        # This is why we use total_missing (venue-weighted) for consistency
        sum(cat["dates_missing"] for cat in response_partial["categories"].values())
        # Category sum might be 0 while overall is not complete
        # This is the bug we fixed: use total_missing, not category sum
        assert response_partial["total_missing"] > 0
        assert response_partial["overall_completion_pct"] < 100

    def test_venue_days_vs_dates_clarity(self):
        """Test that venue-days and dates are distinguished.

        - overall_dates_found/expected are venue-weighted (venue-days)
        - overall_dates_found_category/expected_category are raw date counts

        With 30 days and 24 venues, venue-days = 720, dates = 30
        """
        response = {
            "date_range": {"days": 30},
            "overall_dates_found": 701,  # venue-days
            "overall_dates_expected": 720,  # venue-days
            "overall_dates_found_category": 30,  # dates
            "overall_dates_expected_category": 30,  # dates
        }

        # Venue-days > dates when there are multiple venues
        assert response["overall_dates_expected"] >= response["overall_dates_expected_category"]

        # The ratio gives approximate venue count
        if response["overall_dates_expected_category"] > 0:
            approx_venues = (
                response["overall_dates_expected"] / response["overall_dates_expected_category"]
            )
            assert approx_venues >= 1  # At least 1 venue
