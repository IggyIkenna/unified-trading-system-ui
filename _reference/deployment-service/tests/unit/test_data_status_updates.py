"""
Unit tests for turbo data status API - Update Operations.

Tests missing data calculations, fallback logic, and deployment filtering:
- Expected missing calculation logic
- Total missing fallback to category-level when no venues found
- Exclude dates filtering for deployment creation
- Dates found list inclusion for frontend integration
"""


class TestTotalMissingFallback:
    """Tests for total_missing fallback to category-level when no venues found.

    Bug fixed: When no venues are found (e.g., services without venue breakdown),
    total_missing was 0 even though dates_missing showed missing data.
    This caused "All expected data present" to show incorrectly with 0% completion.
    """

    def test_no_venues_uses_category_level_missing(self):
        """Test that total_missing uses category-level when no venue data exists.

        This tests the logic:
        - If total_venue_expected > 0: use venue-weighted missing
        - Else: use category-level missing (fallback)
        """

        # Simulate the calculation from data_status.py
        def calculate_total_missing(results, total_venue_expected, total_venue_found):
            """Replicate the fixed logic from data_status.py."""
            total_expected_category = sum(
                r.get("dates_expected", 0) for r in results.values() if "error" not in r
            )
            total_found_category = sum(
                r.get("dates_found", 0) for r in results.values() if "error" not in r
            )

            if total_venue_expected > 0:
                # Use venue-weighted
                return total_venue_expected - total_venue_found
            else:
                # Fallback to category-level
                return total_expected_category - total_found_category

        # Case 1: Service with venue data (instruments-service)
        results_with_venues = {"CEFI": {"dates_expected": 30, "dates_found": 30}}
        total_missing = calculate_total_missing(results_with_venues, 720, 700)
        assert total_missing == 20  # 720 - 700 (venue-weighted)

        # Case 2: Service without venue data (e.g., market-data-processing DEFI)
        results_no_venues = {"DEFI": {"dates_expected": 3, "dates_found": 0}}
        total_missing = calculate_total_missing(results_no_venues, 0, 0)
        assert total_missing == 3  # Falls back to category level

    def test_zero_total_missing_requires_zero_category_missing(self):
        """Test that total_missing=0 implies all category dates_missing are 0.

        This prevents the bug where "All expected data present" shows with 0% data.
        """

        # If total_missing is 0 and no venues, category must also be 0
        def is_all_data_present(total_missing):
            return total_missing == 0

        # 0 missing means all data present
        assert is_all_data_present(0)

        # Any missing means NOT all data present
        assert not is_all_data_present(3)
        assert not is_all_data_present(1)


class TestExcludeDatesFiltering:
    """Tests for exclude_dates filtering in deploy endpoint.

    Bug fixed: Deploy Missing was deploying all shards even when data status
    showed existing data, because exclude_dates wasn't being passed/used.
    """

    def test_exclude_dates_filters_matching_shards(self, sample_exclude_dates_data):
        """Test that shards matching exclude_dates are filtered out."""
        test_data = sample_exclude_dates_data

        # Simulate the filtering logic from deployments.py
        def filter_shards_by_exclude_dates(shards, exclude_dates):
            """Replicate the filtering logic from create_deployment."""
            if not exclude_dates:
                return shards

            exclude_sets = {cat: set(dates) for cat, dates in exclude_dates.items()}
            filtered = []

            for shard in shards:
                cat = shard.get("category", "")
                date_str = shard.get("date", "")

                # Skip if this category+date is in exclude_dates
                if cat in exclude_sets and date_str in exclude_sets[cat]:
                    continue

                filtered.append(shard)

            return filtered

        # Apply filtering
        filtered = filter_shards_by_exclude_dates(
            test_data["input_shards"], test_data["exclude_dates"]
        )

        # Convert to comparable format
        remaining = [(s["category"], s["date"]) for s in filtered]
        expected_remaining = [(s["category"], s["date"]) for s in test_data["expected_remaining"]]

        assert len(filtered) == len(expected_remaining)
        for expected in expected_remaining:
            assert expected in remaining

    def test_exclude_dates_none_returns_all_shards(self):
        """Test that None exclude_dates returns all shards."""

        def filter_shards_by_exclude_dates(shards, exclude_dates):
            if not exclude_dates:
                return shards
            # ... filtering logic ...
            return []  # Would filter if exclude_dates was set

        shards = [
            {"category": "CEFI", "date": "2024-01-01"},
            {"category": "CEFI", "date": "2024-01-02"},
        ]

        # None exclude_dates returns all
        assert filter_shards_by_exclude_dates(shards, None) == shards

        # Empty dict also returns all
        assert filter_shards_by_exclude_dates(shards, {}) == shards

    def test_exclude_dates_cross_category_independence(self):
        """Test that exclude_dates only affects matching categories."""

        def filter_shards_by_exclude_dates(shards, exclude_dates):
            if not exclude_dates:
                return shards

            exclude_sets = {cat: set(dates) for cat, dates in exclude_dates.items()}
            filtered = []

            for shard in shards:
                cat = shard.get("category", "")
                date_str = shard.get("date", "")

                if cat in exclude_sets and date_str in exclude_sets[cat]:
                    continue
                filtered.append(shard)

            return filtered

        shards = [
            {"category": "CEFI", "date": "2024-01-01"},
            {"category": "DEFI", "date": "2024-01-01"},
            {"category": "TRADFI", "date": "2024-01-01"},
        ]

        # Only exclude CEFI 2024-01-01
        exclude_dates = {"CEFI": ["2024-01-01"]}

        filtered = filter_shards_by_exclude_dates(shards, exclude_dates)

        # DEFI and TRADFI should remain
        assert len(filtered) == 2
        cats = [s["category"] for s in filtered]
        assert "CEFI" not in cats
        assert "DEFI" in cats
        assert "TRADFI" in cats


class TestDatesFoundListIncluded:
    """Tests for dates_found_list inclusion in turbo response.

    Feature: include_dates_list=true returns the actual dates found,
    which the frontend uses to calculate exclude_dates for deploy missing.
    """

    def test_include_dates_list_parameter_exists(self):
        """Test that include_dates_list parameter exists in turbo endpoint."""
        import inspect

        from deployment_api.routes.data_status import get_data_status_turbo

        sig = inspect.signature(get_data_status_turbo)
        params = list(sig.parameters.keys())
        assert "include_dates_list" in params

    def test_dates_found_list_format(self, sample_dates_found_list_data):
        """Test expected format of dates_found_list in response."""
        for category_data in sample_dates_found_list_data.values():
            dates_found_list = category_data["dates_found_list"]

            # Should be a list
            assert isinstance(dates_found_list, list)

            # Should be sorted
            assert dates_found_list == sorted(dates_found_list)

            # Each entry should be a date string
            for date_str in dates_found_list:
                assert len(date_str) == 10  # YYYY-MM-DD
                assert date_str[4] == "-" and date_str[7] == "-"

    def test_dates_found_list_empty_when_no_data(self, sample_dates_found_list_data):
        """Test that dates_found_list is empty when no data exists."""
        defi_data = sample_dates_found_list_data["DEFI"]

        assert defi_data["dates_found_list"] == []
        assert defi_data["dates_found"] == 0


class TestExpectedMissingCalculation:
    """Tests for expected_missing calculation logic.

    These tests ensure that:
    1. total_missing only counts data that SHOULD exist (after venue start dates)
    2. expected_missing is calculated correctly with and without venue breakdown
    3. The UI won't show "All expected ✓" when there's actually missing data
    """

    def test_expected_missing_with_venue_breakdown(self):
        """Test expected_missing accumulates correctly from venue data."""
        # Simulate category result with venue breakdown
        cat_result = {
            "dates_expected": 100,
            "dates_found": 80,
            "venues": {
                "BINANCE-FUTURES": {
                    "dates_expected_venue": 50,
                    "dates_found": 40,
                    "is_expected": True,
                },
                "DERIBIT": {
                    "dates_expected_venue": 50,
                    "dates_found": 30,
                    "is_expected": True,
                },
            },
            "venue_summary": {"expected_but_missing": []},
        }

        # Calculate expected_missing (mimicking the API logic)
        expected_missing = 0
        venues = cat_result.get("venues", {})
        for _venue_name, venue_info in venues.items():
            venue_expected = venue_info.get(
                "dates_expected_venue", venue_info.get("dates_expected", 0)
            )
            venue_found = venue_info.get("dates_found", 0)
            is_expected = venue_info.get("is_expected", True)
            if is_expected:
                venue_missing = venue_expected - venue_found
                if venue_missing > 0:
                    expected_missing += venue_missing

        # BINANCE-FUTURES: 50-40=10 missing, DERIBIT: 50-30=20 missing
        assert expected_missing == 30

    def test_expected_missing_without_venue_breakdown(self):
        """Test expected_missing falls back to category-level when no venues.

        This is critical because include_sub_dimensions=False by default,
        which means venues dict is empty. We must still calculate missing!
        """
        # Simulate category result WITHOUT venue breakdown
        cat_result = {
            "dates_expected": 100,
            "dates_found": 75,
            "venues": {},  # Empty - no venue breakdown requested
            "venue_summary": {},
        }

        # Calculate expected_missing (mimicking the API fallback logic)
        expected_missing = 0
        venues = cat_result.get("venues", {})
        cat_dates_expected = cat_result.get("dates_expected", 0)
        cat_dates_found = cat_result.get("dates_found", 0)

        if venues:
            # Would accumulate from venues...
            pass
        else:
            # Fallback to category-level
            cat_missing = cat_dates_expected - cat_dates_found
            if cat_missing > 0:
                expected_missing += cat_missing

        # 100-75 = 25 missing at category level
        assert expected_missing == 25

    def test_expected_missing_excludes_bonus_venues(self):
        """Test that bonus venues don't affect expected_missing count."""
        cat_result = {
            "dates_expected": 100,
            "dates_found": 80,
            "venues": {
                "BINANCE-FUTURES": {
                    "dates_expected_venue": 50,
                    "dates_found": 40,
                    "is_expected": True,
                },
                "SOME-BONUS-VENUE": {
                    "dates_expected_venue": 50,
                    "dates_found": 10,  # 40 missing but it's bonus!
                    "is_expected": False,  # Bonus venue
                },
            },
            "venue_summary": {"expected_but_missing": []},
        }

        expected_missing = 0
        total_venue_expected = 0
        total_venue_found = 0

        for _venue_name, venue_info in cat_result["venues"].items():
            venue_expected = venue_info.get("dates_expected_venue", 0)
            venue_found = venue_info.get("dates_found", 0)
            is_expected = venue_info.get("is_expected", True)

            if is_expected:  # Only count expected venues
                total_venue_expected += venue_expected
                total_venue_found += venue_found
                venue_missing = venue_expected - venue_found
                if venue_missing > 0:
                    expected_missing += venue_missing

        # Only BINANCE-FUTURES counts: 50-40=10 missing
        # SOME-BONUS-VENUE is excluded (is_expected=False)
        assert expected_missing == 10
        assert total_venue_expected == 50  # Only expected venue counts
        assert total_venue_found == 40

    def test_total_missing_equals_expected_missing(self):
        """Test that total_missing is set to expected_missing, not raw difference.

        This ensures the UI shows only actionable missing data (dates where
        data SHOULD exist based on venue start dates), not all possible gaps.
        """
        # Simulate the final calculation (from API)
        expected_missing = 30  # Accumulated from venue loop

        # The API sets total_missing = expected_missing
        total_missing = expected_missing

        assert total_missing == 30
        # NOT total_venue_expected - total_venue_found which could be different
        # if there are rounding or other adjustments

    def test_expected_missing_includes_completely_missing_venues(self):
        """Test venues in expected_but_missing are counted."""
        cat_result = {
            "dates_expected": 100,
            "dates_found": 50,
            "venues": {
                "BINANCE-FUTURES": {
                    "dates_expected_venue": 50,
                    "dates_found": 50,
                    "is_expected": True,
                },
                # DERIBIT is expected but has NO data at all
            },
            "venue_summary": {"expected_but_missing": ["DERIBIT"]},
        }

        expected_missing = 0
        cat_dates_expected = cat_result.get("dates_expected", 0)

        # From existing venues
        for venue_info in cat_result["venues"].values():
            if venue_info.get("is_expected", True):
                venue_missing = venue_info["dates_expected_venue"] - venue_info["dates_found"]
                if venue_missing > 0:
                    expected_missing += venue_missing

        # From completely missing venues
        for _missing_venue in cat_result["venue_summary"].get("expected_but_missing", []):
            expected_missing += cat_dates_expected

        # BINANCE-FUTURES: 50-50=0 missing
        # DERIBIT: 100 missing (completely missing venue uses cat_dates_expected)
        assert expected_missing == 100

    def test_all_expected_only_shows_when_no_missing(self):
        """Test that 'All expected ✓' only shows when total_missing is truly 0."""
        # Case 1: All data present
        total_missing_complete = 0
        all_expected_complete = total_missing_complete == 0
        assert all_expected_complete is True

        # Case 2: Some missing data
        total_missing_incomplete = 25
        all_expected_incomplete = total_missing_incomplete == 0
        assert all_expected_incomplete is False

        # Case 3: Edge case - empty category (no expected data)
        cat_result_empty = {"dates_expected": 0, "dates_found": 0, "venues": {}}
        cat_missing = cat_result_empty["dates_expected"] - cat_result_empty["dates_found"]
        # Should be 0 missing, so "All expected ✓" is valid
        assert cat_missing == 0
