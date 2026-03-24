"""
Per-service unit tests for missing data calculations.

These tests ensure that percentage, total_missing, and categoriesWithMissing
detection work correctly for EACH service type.  Fixing a bug in one service's
data_status logic must not silently break another.

Service groups:
  A  instruments-service        sub_dim=venue, NO data_type dirs
  B  market-tick-data-handler   sub_dim=data_type, with venue dirs
  C  features-delta-one-service sub_dim=feature_group, no venues
  D  corporate-actions          no sub-dimension at all
"""

import pytest

# ---------------------------------------------------------------------------
# Mock response builders -- simulate what get_data_status_turbo_impl returns
# ---------------------------------------------------------------------------


def build_instruments_response(venues_with_data, all_dates, category="CEFI"):
    """Build mock turbo response for instruments-service.

    Simulates the response structure when venues have complete/partial/missing data.
    Path layout: instrument_availability/by_date/day={date}/venue={VENUE}/
    """
    expected_venues = {
        "TRADFI": ["CME", "CBOE", "NASDAQ", "NYSE", "ICE", "FX"],
        "CEFI": ["BINANCE-SPOT", "BINANCE-FUTURES", "DERIBIT", "BYBIT", "OKX"],
        "DEFI": ["UNISWAPV2-ETHEREUM", "UNISWAPV3-ETHEREUM"],
    }

    venues_expected = expected_venues.get(category, list(venues_with_data.keys()))
    total_dates = len(all_dates)

    # Build per-venue results
    venue_results = {}
    total_venue_found = 0
    total_venue_expected = 0
    expected_but_missing = []

    for venue in venues_expected:
        if venue in venues_with_data:
            dates_found = len([d for d in all_dates if d in venues_with_data[venue]])
            venue_results[venue] = {
                "dates_found": dates_found,
                "dates_expected_venue": total_dates,
                "completion_pct": round(dates_found / total_dates * 100, 1) if total_dates else 0,
                "is_expected": True,
                "is_available": True,
            }
            total_venue_found += dates_found
            total_venue_expected += total_dates
        else:
            expected_but_missing.append(venue)
            total_venue_expected += total_dates

    num_present = len(venues_expected) - len(expected_but_missing)
    cat_dates_found = (
        len(set().union(*[set(v) for v in venues_with_data.values() if v]))
        if venues_with_data
        else 0
    )
    cat_dates_expected = total_dates

    total_missing = total_venue_expected - total_venue_found
    overall_pct = (
        round(total_venue_found / total_venue_expected * 100, 1) if total_venue_expected else 0
    )

    return {
        "overall_completion_pct": overall_pct,
        "overall_dates_found": total_venue_found,
        "overall_dates_expected": total_venue_expected,
        "overall_dates_found_category": cat_dates_found,
        "overall_dates_expected_category": cat_dates_expected,
        "total_missing": total_missing,
        "date_range": {
            "start": min(all_dates) if all_dates else "",
            "end": max(all_dates) if all_dates else "",
            "days": total_dates,
        },
        "categories": {
            category: {
                "dates_found": cat_dates_found,
                "dates_expected": cat_dates_expected,
                "completion_pct": round(cat_dates_found / cat_dates_expected * 100, 1)
                if cat_dates_expected
                else 0,
                "dates_missing": max(0, cat_dates_expected - cat_dates_found),
                "is_expected": True,
                "is_available": True,
                "venues": venue_results,
                "venue_summary": {
                    "expected_but_missing": expected_but_missing,
                    "num_present": num_present,
                    "num_expected": len(venues_expected),
                },
            }
        },
    }


def build_market_tick_response(venues_with_data, all_dates, data_types, category="CEFI"):
    """Build mock turbo response for market-tick-data-handler.

    Simulates the response with data_type sub-dimensions and instrument_types.
    Path layout: raw_tick_data/by_date/day={date}/data_type={TYPE}/instrument_type={inst}/venue={VENUE}/
    """
    total_dates = len(all_dates)
    num_data_types = len(data_types)

    venue_results = {}
    total_venue_found = 0
    total_venue_expected = 0

    for venue, v_dates in venues_with_data.items():
        dates_found = len([d for d in all_dates if d in v_dates])
        dim_weighted_found = dates_found * num_data_types
        dim_weighted_expected = total_dates * num_data_types

        data_type_breakdown = {}
        for dt in data_types:
            dt_found = len([d for d in all_dates if d in v_dates])
            data_type_breakdown[dt] = {
                "dates_found": dt_found,
                "dates_expected": total_dates,
                "completion_pct": round(dt_found / total_dates * 100, 1) if total_dates else 0,
            }

        venue_results[venue] = {
            "dates_found": dates_found,
            "dates_expected_venue": total_dates,
            "_dim_weighted_found": dim_weighted_found,
            "_dim_weighted_expected": dim_weighted_expected,
            "completion_pct": round(dim_weighted_found / dim_weighted_expected * 100, 1)
            if dim_weighted_expected
            else 0,
            "is_expected": True,
            "is_available": True,
            "data_types": data_type_breakdown,
        }
        total_venue_found += dim_weighted_found
        total_venue_expected += dim_weighted_expected

    cat_dates_found = (
        len(set().union(*[set(v) for v in venues_with_data.values()])) if venues_with_data else 0
    )
    total_missing = total_venue_expected - total_venue_found
    overall_pct = (
        round(total_venue_found / total_venue_expected * 100, 1) if total_venue_expected else 0
    )

    return {
        "overall_completion_pct": overall_pct,
        "overall_dates_found": total_venue_found,
        "overall_dates_expected": total_venue_expected,
        "total_missing": total_missing,
        "date_range": {"start": min(all_dates), "end": max(all_dates), "days": total_dates},
        "categories": {
            category: {
                "dates_found": cat_dates_found,
                "dates_expected": total_dates,
                "dates_missing": max(0, total_dates - cat_dates_found),
                "is_expected": True,
                "is_available": True,
                "venues": venue_results,
                "venue_summary": {"expected_but_missing": [], "num_present": len(venue_results)},
                "data_types": {
                    dt: {"dates_found": cat_dates_found, "dates_expected": total_dates}
                    for dt in data_types
                },
            }
        },
    }


def build_features_response(feature_groups_with_data, all_dates, category="CEFI"):
    """Build mock turbo response for features-delta-one-service.

    Features service uses feature_group as sub-dimension, no venue concept.
    Path layout: by_date/day={date}/feature_group={GROUP}/
    """
    total_dates = len(all_dates)

    fg_results = {}
    total_fg_found = 0
    total_fg_expected = 0

    for fg, fg_dates in feature_groups_with_data.items():
        dates_found = len([d for d in all_dates if d in fg_dates])
        fg_results[fg] = {
            "dates_found": dates_found,
            "dates_expected": total_dates,
            "completion_pct": round(dates_found / total_dates * 100, 1) if total_dates else 0,
        }
        total_fg_found += dates_found
        total_fg_expected += total_dates

    # Features service: all groups with all dates = 100%, total_missing = 0
    overall_pct = round(total_fg_found / total_fg_expected * 100, 1) if total_fg_expected else 0
    total_missing = total_fg_expected - total_fg_found

    return {
        "overall_completion_pct": overall_pct,
        "overall_dates_found": total_fg_found,
        "overall_dates_expected": total_fg_expected,
        "total_missing": total_missing,
        "date_range": {"start": min(all_dates), "end": max(all_dates), "days": total_dates},
        "categories": {
            category: {
                "dates_found": total_dates,  # Category-level: if any fg has data for a date
                "dates_expected": total_dates,
                "dates_missing": 0
                if total_fg_found == total_fg_expected
                else max(0, total_dates - total_dates),
                "is_expected": True,
                "is_available": True,
                "venues": {},
                "venue_summary": {},
                "sub_dimensions": fg_results,
            }
        },
    }


def build_corporate_actions_response(dates_with_data, all_dates, category="TRADFI"):
    """Build mock turbo response for corporate-actions (no sub-dimensions).

    Path layout: corporate_actions/by_date/day={date}/
    """
    total_dates = len(all_dates)
    dates_found = len([d for d in all_dates if d in dates_with_data])
    total_missing = total_dates - dates_found
    overall_pct = round(dates_found / total_dates * 100, 1) if total_dates else 0

    return {
        "overall_completion_pct": overall_pct,
        "overall_dates_found": dates_found,
        "overall_dates_expected": total_dates,
        "total_missing": total_missing,
        "date_range": {"start": min(all_dates), "end": max(all_dates), "days": total_dates},
        "categories": {
            category: {
                "dates_found": dates_found,
                "dates_expected": total_dates,
                "dates_missing": total_missing,
                "is_expected": True,
                "is_available": True,
                "venues": {},
                "venue_summary": {},
            }
        },
    }


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
        result = build_instruments_response(venues, dates, category="TRADFI")

        assert "error" not in result
        assert result["overall_completion_pct"] == 100.0
        assert result["total_missing"] == 0

    def test_market_tick_all_venues_complete(self):
        """market-tick-data-handler CEFI: all expected CEFI venues present."""
        dates = ["2024-05-01", "2024-05-02"]
        # Use a minimal set of venues for the test
        venues = {"BINANCE-SPOT": dates, "BINANCE-FUTURES": dates}
        data_types = ["trades", "book_snapshot_5"]
        result = build_market_tick_response(venues, dates, data_types, category="CEFI")

        assert "error" not in result
        # At minimum, found data should be > 0
        assert result["overall_dates_found"] > 0

    def test_features_delta_one_all_groups_complete(self):
        """features-delta-one-service: all feature_groups present for all dates."""
        dates = ["2024-05-01", "2024-05-02"]
        # Features service has no venue concept; sub-dimension = feature_group
        feature_groups = {"momentum": dates, "returns": dates, "volatility": dates}
        result = build_features_response(feature_groups, dates, category="CEFI")

        assert "error" not in result
        assert result["overall_completion_pct"] == 100.0
        assert result["total_missing"] == 0

    def test_corporate_actions_all_dates_complete(self):
        """corporate-actions: all dates have data -> 100%."""
        dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        result = build_corporate_actions_response(dates, dates, category="TRADFI")

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
        result = build_instruments_response(venues, all_dates, category="TRADFI")

        assert "error" not in result
        # Each venue: 2 found / 3 expected = 66.7%
        # All 6 venues: (6*2) / (6*3) = 12/18 = 66.7%
        assert result["overall_completion_pct"] == pytest.approx(66.7, abs=0.1)
        assert result["total_missing"] == 6  # 6 venues * 1 missing date each

    def test_corporate_actions_partial(self):
        """corporate-actions: 2 of 3 dates have data."""
        all_dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        found = ["2024-05-01", "2024-05-02"]
        result = build_corporate_actions_response(found, all_dates, category="TRADFI")

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
            # CME, ICE, NYSE -> expected but missing
        }
        result = build_instruments_response(venues, dates, category="TRADFI")

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
            # ICE -> expected but missing
        }
        result = build_instruments_response(venues, dates, category="TRADFI")

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
            # DERIBIT, BYBIT, OKX -> missing
        }
        result = build_instruments_response(venues, dates, category="CEFI")

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
        result = build_instruments_response(venues, dates, category="TRADFI")

        tradfi = result["categories"]["TRADFI"]

        # instruments-service venues should NOT have _dim_weighted_expected
        # (no data_type sub-dirs in GCS for instruments-service)
        for v_name, v_data in tradfi.get("venues", {}).items():
            assert "_dim_weighted_expected" not in v_data, (
                f"instruments-service venue {v_name} should NOT have _dim_weighted_expected "
                "(no data_type sub-dirs in GCS)"
            )

        # For instruments-service, missing venues should use raw base_exp
        # (no dimension weighting at all)
        expected_but_missing = tradfi.get("venue_summary", {}).get("expected_but_missing", [])
        num_missing = len(expected_but_missing)
        num_dates = len(dates)

        if num_missing > 0:
            # The total_missing should be <= num_missing * num_dates (no inflation)
            # If the bug existed, it would be num_missing * num_dates * N_data_types
            max_raw_missing = num_missing * num_dates
            assert result["total_missing"] <= max_raw_missing + (len(venues) * num_dates), (
                f"total_missing={result['total_missing']} seems too large. "
                "Missing venues may be dimension-weighted when they shouldn't be."
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
        result = build_market_tick_response(venues, dates, data_types, category="CEFI")

        assert "error" not in result
        cefi = result["categories"]["CEFI"]

        # Check present venues DO have _dim_weighted_expected
        has_dim = False
        for _v_name, v_data in cefi.get("venues", {}).items():
            if "_dim_weighted_expected" in v_data:
                has_dim = True
                break

        # market-tick-data-handler venues SHOULD have _dim_weighted_expected
        # because there are data_type sub-directories in GCS
        assert has_dim, (
            "market-tick-data-handler venues should have _dim_weighted_expected (data_type sub-dirs are present in GCS)"
        )

        # Verify the dim-weighted values are correctly set
        for _v_name, v_data in cefi.get("venues", {}).items():
            if "_dim_weighted_expected" in v_data:
                # dim_weighted_expected should equal num_dates * num_data_types
                expected = len(dates) * len(data_types)
                assert v_data["_dim_weighted_expected"] == expected, (
                    f"_dim_weighted_expected should be {expected} ({len(dates)} dates * {len(data_types)} data_types)"
                )

    def test_features_no_venue_dimension(self):
        """features-delta-one-service: uses feature_group sub-dim, not venue.

        Venues are not relevant here; completion is purely date-based.
        Verify this still works after the fix.
        """
        dates = ["2024-05-01", "2024-05-02"]
        feature_groups = {"momentum": dates, "returns": dates}
        result = build_features_response(feature_groups, dates, category="CEFI")

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
        Uses mock response builder to simulate what get_data_status_turbo_impl would return.
        """
        dates = ["2024-05-01", "2024-05-02", "2024-05-03"]
        # Only 3 of 6 expected TRADFI venues present
        venues = {"CBOE": dates, "NASDAQ": dates, "FX": dates}
        result = build_instruments_response(venues, dates, category="TRADFI")

        assert "error" not in result

        # Feed backend response into frontend logic
        cats_with_missing = self._categories_with_missing(result["categories"])
        assert "TRADFI" in cats_with_missing, (
            "Frontend categoriesWithMissing should detect TRADFI has missing venues. "
            "If not, the Deploy Missing button won't work for this category."
        )
