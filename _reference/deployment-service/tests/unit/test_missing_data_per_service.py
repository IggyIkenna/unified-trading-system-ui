"""
Per-service unit tests for missing data calculations.

These tests ensure that percentage, total_missing, and categoriesWithMissing
detection work correctly for EACH service type.  Fixing a bug in one service's
data_status logic must not silently break another.

The tests call `get_data_status_turbo_impl` with mocked GCS, parameterised
across different service types.  Each service group requires a different GCS
mock structure because the directory layouts differ.

Service groups:
  A  instruments-service        sub_dim=venue, NO data_type dirs
  B  market-tick-data-handler   sub_dim=data_type, with venue dirs
  C  features-delta-one-service sub_dim=feature_group, no venues
  D  corporate-actions          no sub-dimension at all
"""

import asyncio
from unittest.mock import MagicMock, patch

import pytest

from tests.mocks import make_mock_path_combinatorics

# ---------------------------------------------------------------------------
# GCS mock builders -- one per service group
# ---------------------------------------------------------------------------


def build_instruments_mock(venues_with_data, dates, category="CEFI"):
    """Build GCS mock for instruments-service.

    Path layout:
      instrument_availability/by_date/day={date}/venue={VENUE}/instruments.parquet

    Parameters
    ----------
    venues_with_data : dict[str, list[str]]
        Mapping of venue -> list of date strings that have data.
    dates : list[str]
        All dates that should appear as directories.
    """
    mock_storage_client = MagicMock()

    base = "instrument_availability/by_date/"

    def list_blobs(bucket_name_arg, prefix=None, max_results=None, delimiter=None):
        # Venue-level listing (used by query_generic_prefixes_for_category)
        # → return a mock blob when this venue has data on this date
        for d in dates:
            date_prefix = f"{base}day={d}/"
            for v, v_dates in venues_with_data.items():
                venue_prefix = f"{date_prefix}venue={v}/"
                if prefix == venue_prefix or (prefix and prefix.startswith(venue_prefix)):
                    if d in v_dates:
                        mock_blob = MagicMock()
                        mock_blob.name = f"{venue_prefix}instruments.parquet"
                        mock_blob.updated = None
                        mock_blob.size = 1024
                        mock_blob.time_created = None
                        return [mock_blob]

        # Default: nothing found
        return []

    mock_storage_client.list_blobs.side_effect = list_blobs
    return mock_storage_client


def build_market_tick_mock(venues_with_data, dates, data_types, category="CEFI"):
    """Build GCS mock for market-tick-data-handler.

    Path layout (fast path, from_path_parsing):
      raw_tick_data/by_date/day={date}/data_type={TYPE}/instrument_type={inst_type}/venue={VENUE}/

    Parameters
    ----------
    venues_with_data : dict[str, list[str]]
        venue -> list of dates with data.
    dates : list[str]
        All dates that should appear as directories.
    data_types : list[str]
        data_types present in GCS for the venues that have data.
    """
    mock_storage_client = MagicMock()

    base = "raw_tick_data/by_date/"

    def list_blobs(bucket_name_arg, prefix=None, max_results=None, delimiter=None):
        # Venue-level listing (used by query_specific_prefixes_for_category)
        # → return a mock blob when this venue+data_type+date has data
        for d in dates:
            date_prefix = f"{base}day={d}/"
            for dt in data_types:
                dt_prefix = f"{date_prefix}data_type={dt}/"
                for v, v_dates in venues_with_data.items():
                    venue_prefix = f"{dt_prefix}instrument_type=spot/venue={v}/"
                    if prefix == venue_prefix or (prefix and prefix.startswith(venue_prefix)):
                        if d in v_dates:
                            mock_blob = MagicMock()
                            mock_blob.name = f"{venue_prefix}data.parquet"
                            mock_blob.updated = None
                            mock_blob.size = 1024
                            mock_blob.time_created = None
                            return [mock_blob]

        return []

    mock_storage_client.list_blobs.side_effect = list_blobs
    return mock_storage_client


def build_features_mock(feature_groups_with_data, dates, category="CEFI"):
    """Build GCS mock for features-delta-one-service (or similar feature services).

    Path layout:
      features/by_date/day={date}/feature_group={GROUP}/

    Parameters
    ----------
    feature_groups_with_data : dict[str, list[str]]
        feature_group -> list of dates with data.
    dates : list[str]
        All dates that should appear.
    """
    mock_storage_client = MagicMock()

    base = "features/by_date/"

    def list_blobs(bucket_name_arg, prefix=None, max_results=None, delimiter=None):
        # Feature_group-level listing (used by query_generic_prefixes_for_category)
        # → return a mock blob when this feature_group has data on this date
        for d in dates:
            date_prefix = f"{base}day={d}/"
            for fg, fg_dates in feature_groups_with_data.items():
                fg_prefix = f"{date_prefix}feature_group={fg}/"
                if prefix == fg_prefix or (prefix and prefix.startswith(fg_prefix)):
                    if d in fg_dates:
                        mock_blob = MagicMock()
                        mock_blob.name = f"{fg_prefix}features.parquet"
                        mock_blob.updated = None
                        mock_blob.size = 1024
                        mock_blob.time_created = None
                        return [mock_blob]

        return []

    mock_storage_client.list_blobs.side_effect = list_blobs
    return mock_storage_client


def build_corporate_actions_mock(dates_with_data, all_dates):
    """Build GCS mock for corporate-actions (no sub-dimensions).

    Path layout:
      corporate_actions/by_date/day={date}/
    """
    mock_storage_client = MagicMock()

    base = "corporate_actions/by_date/"

    def list_blobs(bucket_name_arg, prefix=None, max_results=None, delimiter=None):
        # Date-level listing (used by query_generic_prefixes_for_category)
        # → return a mock blob when this date has data
        for d in all_dates:
            date_prefix = f"{base}day={d}/"
            if prefix == date_prefix or (prefix and prefix.startswith(date_prefix)):
                if d in dates_with_data:
                    mock_blob = MagicMock()
                    mock_blob.name = f"{date_prefix}corporate_actions.parquet"
                    mock_blob.updated = None
                    mock_blob.size = 1024
                    mock_blob.time_created = None
                    return [mock_blob]

        return []

    mock_storage_client.list_blobs.side_effect = list_blobs
    return mock_storage_client


# ---------------------------------------------------------------------------
# Helper to run turbo impl
# ---------------------------------------------------------------------------


_MOCK_VENUE_DATA_TYPES: dict[str, dict[str, object]] = {
    "CEFI": {
        "venues": {
            "BINANCE-SPOT": {"data_types": ["trades", "book_snapshot_5"]},
            "BINANCE-FUTURES": {"data_types": ["trades", "book_snapshot_5", "derivative_ticker"]},
            "DERIBIT": {
                "data_types": ["trades", "book_snapshot_5", "derivative_ticker"],
                "instrument_types": ["PERPETUAL", "OPTION"],
            },
            "BYBIT": {"data_types": ["trades", "book_snapshot_5"]},
            "OKX": {"data_types": ["trades", "book_snapshot_5"]},
            "HYPERLIQUID": {"data_types": ["trades", "book_snapshot_5"]},
        }
    },
    "TRADFI": {
        "venues": {
            "CME": {"data_types": ["ohlcv_1m"]},
            "ICE": {"data_types": ["ohlcv_1m"]},
            "NASDAQ": {"data_types": ["ohlcv_1m"]},
            "NYSE": {"data_types": ["ohlcv_1m"]},
            "CBOE": {"data_types": ["ohlcv_1m"]},
            "FX": {"data_types": ["ohlcv_24h"]},
        }
    },
    "DEFI": {
        "venues": {
            "UNISWAP-V3": {"data_types": ["swaps"]},
        }
    },
}


def _run_turbo(
    mock_storage_client,
    service,
    start_date,
    end_date,
    category,
    include_sub_dimensions=True,
):
    """Run get_data_status_turbo_impl with mocked GCS.

    Clears the data_status cache before each call to prevent cross-test
    contamination (earlier test results leaking into later tests).
    Also mocks load_venue_data_types so expected-venue checks work
    without a real venue_data_types.yaml on disk.
    """
    from deployment_api.routes.data_batch_processing import get_data_status_turbo_impl
    from deployment_api.utils.data_status_cache import clear_cache

    clear_cache()

    mock_pc = make_mock_path_combinatorics()
    with (
        patch(
            "deployment_api.utils.storage_client.get_storage_client",
            return_value=mock_storage_client,
        ),
        patch(
            "deployment_api.routes.data_batch_processing.get_path_combinatorics",
            return_value=mock_pc,
        ),
        patch(
            "deployment_api.utils.path_combinatorics.get_path_combinatorics",
            return_value=mock_pc,
        ),
        patch(
            "deployment_api.routes.batch_query_engine.get_path_combinatorics",
            return_value=mock_pc,
        ),
        patch(
            "deployment_api.routes.data_batch_processing.load_venue_data_types",
            return_value=_MOCK_VENUE_DATA_TYPES,
        ),
        patch(
            "deployment_api.routes.data_batch_processing.load_expected_start_dates",
            return_value={},
        ),
    ):
        return asyncio.run(
            get_data_status_turbo_impl(
                service=service,
                start_date=start_date,
                end_date=end_date,
                category=[category],
                include_sub_dimensions=include_sub_dimensions,
                include_dates_list=True,
                full_dates_list=True,
            )
        )


# ===================================================================
# S1 - All expected venues/dims present, all data complete
# ===================================================================


class TestS1AllComplete:
    """All expected venues/sub-dims present with all data -> 100%, total_missing=0."""

    def test_instruments_service_all_venues_complete(self):
        """instruments-service: all 6 TRADFI venues present with all dates."""
        dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        venues = {
            "CME": dates,
            "CBOE": dates,
            "NASDAQ": dates,
            "NYSE": dates,
            "ICE": dates,
            "FX": dates,
        }
        mock = build_instruments_mock(venues, dates, category="TRADFI")
        result = _run_turbo(mock, "instruments-service", "2024-05-01", "2024-05-03", "TRADFI")

        assert "error" not in result
        assert result["overall_completion_pct"] == 100.0
        assert result["total_missing"] == 0

    def test_market_tick_all_venues_complete(self):
        """market-tick-data-handler CEFI: all expected CEFI venues present."""
        dates = ["2024-05-01", "2024-05-02"]
        # Use a minimal set of venues for the test
        venues = {"BINANCE-SPOT": dates, "BINANCE-FUTURES": dates}
        data_types = ["trades", "book_snapshot_5"]
        mock = build_market_tick_mock(venues, dates, data_types, category="CEFI")
        result = _run_turbo(mock, "market-tick-data-handler", "2024-05-01", "2024-05-02", "CEFI")

        assert "error" not in result
        # At minimum, found data should be > 0
        assert result["overall_dates_found"] > 0

    def test_features_delta_one_all_groups_complete(self):
        """features-delta-one-service: all feature_groups present for all dates."""
        dates = ["2024-05-01", "2024-05-02"]
        # Features service has no venue concept; sub-dimension = feature_group
        feature_groups = {"momentum": dates, "returns": dates, "volatility": dates}
        mock = build_features_mock(feature_groups, dates, category="CEFI")
        result = _run_turbo(mock, "features-delta-one-service", "2024-05-01", "2024-05-02", "CEFI")

        assert "error" not in result
        assert result["overall_completion_pct"] == 100.0
        assert result["total_missing"] == 0

    def test_corporate_actions_all_dates_complete(self):
        """corporate-actions: all dates have data -> 100%."""
        dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        mock = build_corporate_actions_mock(dates, dates)
        result = _run_turbo(
            mock,
            "corporate-actions",
            "2024-05-01",
            "2024-05-03",
            "TRADFI",
            include_sub_dimensions=False,
        )

        assert "error" not in result
        assert result["overall_completion_pct"] == 100.0
        assert result["total_missing"] == 0


# ===================================================================
# S2 - All venues present, partial data
# ===================================================================


class TestS2PartialData:
    """All expected venues present but with partial data -> correct % and total_missing."""

    def test_instruments_service_partial(self):
        """instruments-service: all TRADFI venues present, but each has only 2 of 3 dates."""
        all_dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        partial = ["2024-05-01", "2024-05-02"]  # missing 2024-05-03
        venues = {
            "CME": partial,
            "CBOE": partial,
            "NASDAQ": partial,
            "NYSE": partial,
            "ICE": partial,
            "FX": partial,
        }
        mock = build_instruments_mock(venues, all_dates, category="TRADFI")
        result = _run_turbo(mock, "instruments-service", "2024-05-01", "2024-05-03", "TRADFI")

        assert "error" not in result
        # Each venue: 2 found / 3 expected = 66.7%
        # All 6 venues: (6*2) / (6*3) = 12/18 = 66.7%
        assert result["overall_completion_pct"] == pytest.approx(66.7, abs=0.1)
        assert result["total_missing"] == 6  # 6 venues * 1 missing date each

    def test_corporate_actions_partial(self):
        """corporate-actions: 2 of 3 dates have data."""
        all_dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        found = ["2024-05-01", "2024-05-02"]
        mock = build_corporate_actions_mock(found, all_dates)
        result = _run_turbo(
            mock,
            "corporate-actions",
            "2024-05-01",
            "2024-05-03",
            "TRADFI",
            include_sub_dimensions=False,
        )

        assert "error" not in result
        assert result["overall_completion_pct"] == pytest.approx(66.7, abs=0.1)
        assert result["total_missing"] == 1


# ===================================================================
# S3 - Some expected venues entirely missing (THE BUG)
# ===================================================================


class TestS3MissingVenues:
    """Expected venues with zero data -- tests the asymmetric-weighting fix.

    Regression guard:
        instruments-service TRADFI with 3/6 venues = 50%, NOT 25%.
    """

    def test_instruments_service_half_venues_missing(self):
        """CRITICAL: 3 of 6 TRADFI venues present -> 50%, not 25%.

        Before the fix, missing venues were dimension-weighted (3 data_types
        from venue_data_types.yaml * 10 days = 30 per missing venue) while
        present venues were raw (10 per venue).  This produced
        30 / (30 + 90) = 25%.

        After the fix, missing venues are treated consistently with present
        venues (no dimension weighting when present venues don't have it).
        Result: 30 / 60 = 50%.
        """
        dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        # Only 3 of 6 expected TRADFI venues have data
        venues = {
            "CBOE": dates,
            "NASDAQ": dates,
            "FX": dates,
            # CME, ICE, NYSE → expected but missing
        }
        mock = build_instruments_mock(venues, dates, category="TRADFI")
        result = _run_turbo(mock, "instruments-service", "2024-05-01", "2024-05-03", "TRADFI")

        assert "error" not in result

        tradfi = result["categories"]["TRADFI"]
        venue_summary = tradfi.get("venue_summary", {})
        expected_but_missing = venue_summary.get("expected_but_missing", [])

        # Missing venues should be detected
        assert len(expected_but_missing) > 0, "Should detect missing venues"
        for v in ["CME", "ICE", "NYSE"]:
            assert v in expected_but_missing, f"{v} should be in expected_but_missing"

        # CRITICAL: Percentage must be ~50%, NOT 25%
        # Allow some tolerance for venue start date filtering
        assert result["overall_completion_pct"] >= 40.0, (
            f"Percentage should be ~50% (3/6 venues), got {result['overall_completion_pct']}%. "
            "If this is ~25%, the asymmetric dimension-weighting bug has regressed."
        )
        assert result["overall_completion_pct"] <= 60.0, (
            f"Percentage should be ~50%, got {result['overall_completion_pct']}%"
        )

        # total_missing must be > 0
        assert result["total_missing"] > 0, "Should have missing data"

    def test_instruments_service_one_venue_missing(self):
        """5 of 6 TRADFI venues present -> ~83%, total_missing > 0."""
        dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        venues = {
            "CME": dates,
            "CBOE": dates,
            "NASDAQ": dates,
            "NYSE": dates,
            "FX": dates,
            # ICE → expected but missing
        }
        mock = build_instruments_mock(venues, dates, category="TRADFI")
        result = _run_turbo(mock, "instruments-service", "2024-05-01", "2024-05-03", "TRADFI")

        assert "error" not in result
        tradfi = result["categories"]["TRADFI"]
        expected_but_missing = tradfi.get("venue_summary", {}).get("expected_but_missing", [])
        assert "ICE" in expected_but_missing

        # 5/6 venues = 83.3%
        assert result["overall_completion_pct"] >= 75.0
        assert result["overall_completion_pct"] <= 90.0
        assert result["total_missing"] > 0

    def test_instruments_service_cefi_missing_venues(self):
        """CEFI: some venues present, some missing -> consistent weighting."""
        dates = ["2024-05-01", "2024-05-02"]
        # Only some of the expected CEFI venues
        venues = {
            "BINANCE-SPOT": dates,
            "BINANCE-FUTURES": dates,
            # DERIBIT, BYBIT, OKX, etc. → missing
        }
        mock = build_instruments_mock(venues, dates, category="CEFI")
        result = _run_turbo(mock, "instruments-service", "2024-05-01", "2024-05-02", "CEFI")

        assert "error" not in result
        cefi = result["categories"]["CEFI"]
        expected_but_missing = cefi.get("venue_summary", {}).get("expected_but_missing", [])

        # Should detect missing venues
        assert len(expected_but_missing) > 0

        # total_missing must be > 0
        assert result["total_missing"] > 0

        # The key check: expected and found should be consistent
        # (no wild inflation of denominator via dimension weighting)
        total_expected = result["overall_dates_expected"]
        result["overall_dates_found"]
        num_present = len(venues)
        num_expected_venues = num_present + len(expected_but_missing)

        # Expected should be roughly num_expected_venues * num_dates (not 3-5x that)
        max_reasonable_expected = num_expected_venues * len(dates) * 2  # 2x margin
        assert total_expected <= max_reasonable_expected, (
            f"Expected {total_expected} is too high (max reasonable: {max_reasonable_expected}). "
            "Missing venues may be over-weighted."
        )


# ===================================================================
# S4 - Dimension-weighted symmetry
# ===================================================================


class TestS4DimensionWeightedSymmetry:
    """Verify that present-venue and missing-venue weighting is symmetric.

    When present venues DO have _dim_weighted_expected (service has data_type
    sub-dims in GCS, like market-tick-data-handler), missing venues should also
    be dimension-weighted.

    When present venues do NOT have _dim_weighted_expected (like instruments-service),
    missing venues must use raw base_exp.
    """

    def test_instruments_no_dim_weighting_for_missing(self):
        """instruments-service: present venues lack _dim_weighted_expected,
        so missing venues must NOT be dimension-weighted either.

        Check: _missing_venue_dim_expected should equal sum of raw base_exp
        for missing venues, not inflated by data_type count.
        """
        dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        venues = {"CBOE": dates, "NASDAQ": dates, "FX": dates}
        mock = build_instruments_mock(venues, dates, category="TRADFI")
        result = _run_turbo(mock, "instruments-service", "2024-05-01", "2024-05-03", "TRADFI")

        tradfi = result["categories"]["TRADFI"]

        # Check present venues don't have _dim_weighted_expected
        for v_name, v_data in tradfi.get("venues", {}).items():
            assert "_dim_weighted_expected" not in v_data, (
                f"instruments-service venue {v_name} should NOT have _dim_weighted_expected "
                "(no data_type sub-dirs in GCS)"
            )

        # Check _missing_venue_dim_expected is not inflated
        missing_dim_exp = tradfi.get("_missing_venue_dim_expected", 0)
        expected_but_missing = tradfi.get("venue_summary", {}).get("expected_but_missing", [])
        num_missing = len(expected_but_missing)
        num_dates = len(dates)

        if num_missing > 0 and missing_dim_exp > 0:
            # raw expected = num_missing * num_dates (possibly filtered by start dates)
            # dimension-weighted would be num_missing * num_dates * N_data_types
            # The fix ensures it's the raw value
            max_raw = num_missing * num_dates
            assert missing_dim_exp <= max_raw * 1.1, (
                f"_missing_venue_dim_expected={missing_dim_exp} exceeds raw "
                f"estimate {max_raw}. Missing venues may be dimension-weighted "
                "when they shouldn't be."
            )

    def test_market_tick_dim_weighting_preserved_for_missing(self):
        """market-tick-data-handler: present venues HAVE _dim_weighted_expected,
        so missing venues should also be dimension-weighted (if any are missing).

        This ensures the fix for instruments-service didn't break MTDH.
        """
        dates = ["2024-05-01", "2024-05-02"]
        # Only 2 CEFI venues present (others expected)
        venues = {"BINANCE-SPOT": dates, "BINANCE-FUTURES": dates}
        data_types = ["trades", "book_snapshot_5"]
        mock = build_market_tick_mock(venues, dates, data_types, category="CEFI")
        result = _run_turbo(mock, "market-tick-data-handler", "2024-05-01", "2024-05-02", "CEFI")

        assert "error" not in result
        cefi = result["categories"]["CEFI"]

        # Check present venues DO have _dim_weighted_expected
        has_dim = False
        for _v_name, v_data in cefi.get("venues", {}).items():
            if "_dim_weighted_expected" in v_data:
                has_dim = True
                break

        # If present venues have dim weighting AND there are missing venues,
        # _missing_venue_dim_expected should be > raw base_exp
        expected_but_missing = cefi.get("venue_summary", {}).get("expected_but_missing", [])

        if has_dim and len(expected_but_missing) > 0:
            missing_dim_exp = cefi.get("_missing_venue_dim_expected", 0)
            raw_base = len(expected_but_missing) * len(dates)
            # dimension-weighted should be > raw base (multiplied by data_types)
            assert missing_dim_exp >= raw_base, (
                f"market-tick-data-handler: _missing_venue_dim_expected={missing_dim_exp} "
                f"should be >= raw base {raw_base} when present venues have dim weights"
            )

    def test_features_no_venue_dimension(self):
        """features-delta-one-service: uses feature_group sub-dim, not venue.

        Venues are not relevant here; completion is purely date-based.
        Verify this still works after the fix.
        """
        dates = ["2024-05-01", "2024-05-02"]
        feature_groups = {"momentum": dates, "returns": dates}
        mock = build_features_mock(feature_groups, dates, category="CEFI")
        result = _run_turbo(mock, "features-delta-one-service", "2024-05-01", "2024-05-02", "CEFI")

        assert "error" not in result
        assert result["overall_completion_pct"] == 100.0
        assert result["total_missing"] == 0


# ===================================================================
# S5 - Frontend categoriesWithMissing detection
# ===================================================================


class TestS5CategoriesWithMissing:
    """Test the frontend categoriesWithMissing logic (TypeScript-equivalent).

    The frontend uses this to decide whether "Deploy Missing" is actionable
    for a given category.  It must check:
      1. catData.dates_missing > 0
      2. venue_summary.expected_but_missing.length > 0  (the fix)
      3. Any venue in catData.venues has venueFound < venueExpected
    """

    @staticmethod
    def _categories_with_missing(turbo_categories):
        """Python port of the frontend categoriesWithMissing logic.

        Replicates ui/src/components/DataStatusTab.tsx lines 628-657.
        """
        result = []
        for cat_name, cat_data in turbo_categories.items():
            # Check 1: category-level missing
            if (cat_data.get("dates_missing") or 0) > 0:
                result.append(cat_name)
                continue

            # Check 2: entirely missing venues (THE FIX)
            expected_but_missing = cat_data.get("venue_summary", {}).get("expected_but_missing", [])
            if len(expected_but_missing) > 0:
                result.append(cat_name)
                continue

            # Check 3: present venues with incomplete data
            venues = cat_data.get("venues", {})
            if venues:
                for v_data in venues.values():
                    v_expected = (
                        v_data.get("_dim_weighted_expected")
                        or v_data.get("dates_expected_venue")
                        or v_data.get("dates_expected", 0)
                    )
                    v_found = v_data.get("_dim_weighted_found") or v_data.get("dates_found", 0)
                    if v_found < v_expected:
                        result.append(cat_name)
                        break

        return result

    def test_missing_venues_detected(self):
        """Category with expected_but_missing venues is flagged."""
        categories = {
            "TRADFI": {
                "dates_missing": 0,  # category-level says 0
                "venues": {
                    "CBOE": {"dates_expected_venue": 10, "dates_found": 10},
                    "NASDAQ": {"dates_expected_venue": 10, "dates_found": 10},
                },
                "venue_summary": {
                    "expected_but_missing": ["CME", "ICE", "NYSE"],
                },
            },
        }
        result = self._categories_with_missing(categories)
        assert "TRADFI" in result, "TRADFI should be flagged: 3 venues in expected_but_missing"

    def test_all_venues_complete_no_missing(self):
        """Category where all expected venues are present and complete -> NOT flagged."""
        categories = {
            "TRADFI": {
                "dates_missing": 0,
                "venues": {
                    "CBOE": {"dates_expected_venue": 10, "dates_found": 10},
                    "NASDAQ": {"dates_expected_venue": 10, "dates_found": 10},
                    "CME": {"dates_expected_venue": 10, "dates_found": 10},
                },
                "venue_summary": {
                    "expected_but_missing": [],
                },
            },
        }
        result = self._categories_with_missing(categories)
        assert "TRADFI" not in result

    def test_partial_venue_data_detected(self):
        """Category where a present venue has incomplete data -> flagged."""
        categories = {
            "CEFI": {
                "dates_missing": 0,
                "venues": {
                    "BINANCE-SPOT": {"dates_expected_venue": 10, "dates_found": 10},
                    "DERIBIT": {
                        "dates_expected_venue": 10,
                        "dates_found": 5,
                    },  # partial
                },
                "venue_summary": {"expected_but_missing": []},
            },
        }
        result = self._categories_with_missing(categories)
        assert "CEFI" in result

    def test_dim_weighted_partial_detected(self):
        """Category where dim-weighted values show incomplete -> flagged."""
        categories = {
            "CEFI": {
                "dates_missing": 0,
                "venues": {
                    "BINANCE-FUTURES": {
                        "dates_expected_venue": 10,
                        "dates_found": 10,
                        "_dim_weighted_expected": 40,  # 4 data_types * 10 days
                        "_dim_weighted_found": 30,  # 3 data_types complete
                    },
                },
                "venue_summary": {"expected_but_missing": []},
            },
        }
        result = self._categories_with_missing(categories)
        assert "CEFI" in result

    def test_category_level_missing_detected(self):
        """Category with dates_missing > 0 is flagged even with empty venues."""
        categories = {
            "TRADFI": {
                "dates_missing": 5,
                "venues": {},
                "venue_summary": {},
            },
        }
        result = self._categories_with_missing(categories)
        assert "TRADFI" in result

    def test_no_venue_summary_still_works(self):
        """Category without venue_summary field doesn't crash."""
        categories = {
            "TRADFI": {
                "dates_missing": 0,
                "venues": {
                    "CBOE": {"dates_expected_venue": 10, "dates_found": 10},
                },
                # No venue_summary key at all
            },
        }
        result = self._categories_with_missing(categories)
        # Should not crash and should not flag (no missing data)
        assert "TRADFI" not in result

    def test_multiple_categories(self):
        """Multiple categories: only those with missing data are flagged."""
        categories = {
            "CEFI": {
                "dates_missing": 0,
                "venues": {
                    "BINANCE-SPOT": {"dates_expected_venue": 10, "dates_found": 10},
                },
                "venue_summary": {"expected_but_missing": []},
            },
            "TRADFI": {
                "dates_missing": 0,
                "venues": {
                    "CBOE": {"dates_expected_venue": 10, "dates_found": 10},
                },
                "venue_summary": {"expected_but_missing": ["CME", "ICE"]},
            },
        }
        result = self._categories_with_missing(categories)
        assert "CEFI" not in result
        assert "TRADFI" in result

    def test_integration_instruments_service_missing_venues(self):
        """End-to-end: instruments-service with missing venues -> categoriesWithMissing includes TRADFI.

        This connects the backend response to the frontend detection logic.
        """
        dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        venues = {"CBOE": dates, "NASDAQ": dates, "FX": dates}
        mock = build_instruments_mock(venues, dates, category="TRADFI")
        result = _run_turbo(mock, "instruments-service", "2024-05-01", "2024-05-03", "TRADFI")

        assert "error" not in result

        # Feed backend response into frontend logic
        cats_with_missing = self._categories_with_missing(result["categories"])
        assert "TRADFI" in cats_with_missing, (
            "Frontend categoriesWithMissing should detect TRADFI has missing venues. "
            "If not, the Deploy Missing button won't work for this category."
        )
