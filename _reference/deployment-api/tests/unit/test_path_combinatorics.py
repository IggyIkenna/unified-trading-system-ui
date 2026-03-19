"""
Unit tests for path_combinatorics module.

Tests cover CombinatoricEntry, PathCombinatorics methods, service prefix
generation, and the base prefix / combinatorics filtering logic.
"""

from deployment_api.utils.path_combinatorics import (
    CALENDAR_FEATURE_TYPES,
    INSTRUMENT_TYPE_TO_FOLDER,
    PROCESSING_DATA_TYPES,
    PROCESSING_TIMEFRAMES,
    SERVICE_PATH_TEMPLATES,
    CombinatoricEntry,
    PathCombinatorics,
)


class TestCombinatoricEntry:
    """Tests for CombinatoricEntry dataclass."""

    def test_to_gcs_prefix_basic(self):
        entry = CombinatoricEntry(
            category="CEFI",
            venue="BINANCE-FUTURES",
            folder="perpetuals",
            data_type="trades",
        )
        prefix = entry.to_gcs_prefix("2024-01-15", "raw_tick_data/by_date")
        assert "day=2024-01-15" in prefix
        assert "data_type=trades" in prefix
        assert "instrument_type=perpetuals" in prefix
        assert "venue=BINANCE-FUTURES" in prefix

    def test_to_gcs_prefix_with_timeframe(self):
        entry = CombinatoricEntry(
            category="CEFI",
            venue="BINANCE",
            folder="spot",
            data_type="trades",
            timeframe="1h",
        )
        prefix = entry.to_gcs_prefix("2024-01-15", "processed_candles/by_date")
        assert "day=2024-01-15" in prefix
        assert "timeframe=1h" in prefix
        assert "data_type=trades" in prefix
        # Flat path for processing service — no venue/instrument_type
        assert "BINANCE" not in prefix

    def test_hash_consistency(self):
        e1 = CombinatoricEntry("CEFI", "BINANCE", "spot", "trades")
        e2 = CombinatoricEntry("CEFI", "BINANCE", "spot", "trades")
        assert hash(e1) == hash(e2)

    def test_hash_differs_for_different_entries(self):
        e1 = CombinatoricEntry("CEFI", "BINANCE", "spot", "trades")
        e2 = CombinatoricEntry("CEFI", "COINBASE", "spot", "trades")
        assert hash(e1) != hash(e2)

    def test_default_values(self):
        entry = CombinatoricEntry("CEFI", "BINANCE", "spot", "trades")
        assert entry.start_date is None
        assert entry.timeframe is None
        assert entry.tick_window_only is False


class TestPathCombinatoricsWithMinimalConfig:
    """Tests for PathCombinatorics using minimal mocked config."""

    def _make_pc(self, config=None):
        """Create a PathCombinatorics with a given config dict (bypasses YAML loading)."""
        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.config = config or {}
        pc.combinatorics = []
        pc.service_dimensions = {}
        pc.tick_windows = []
        pc._loaded = False
        # Manually build combinatorics from the config
        pc._build_combinatorics()
        pc._load_tick_windows()
        pc._load_service_dimensions()
        return pc

    def _minimal_config(self):
        return {
            "CEFI": {
                "venues": {
                    "BINANCE": {
                        "folders": ["spot", "perpetuals"],
                        "data_types": ["trades", "book_snapshot_5"],
                        "start_date": "2023-01-01",
                    }
                }
            }
        }

    def test_build_combinatorics_creates_entries(self):
        pc = self._make_pc(self._minimal_config())
        assert len(pc.combinatorics) > 0

    def test_all_combinatorics_have_correct_category(self):
        pc = self._make_pc(self._minimal_config())
        for c in pc.combinatorics:
            assert c.category == "CEFI"

    def test_get_combinatorics_filter_by_category(self):
        config = {
            "CEFI": {"venues": {"BINANCE": {"folders": ["spot"], "data_types": ["trades"]}}},
            "TRADFI": {"venues": {"NYSE": {"folders": ["equities"], "data_types": ["trades"]}}},
        }
        pc = self._make_pc(config)
        cefi = pc.get_combinatorics(category="CEFI")
        tradfi = pc.get_combinatorics(category="TRADFI")
        assert all(c.category == "CEFI" for c in cefi)
        assert all(c.category == "TRADFI" for c in tradfi)

    def test_get_combinatorics_filter_by_data_type(self):
        pc = self._make_pc(self._minimal_config())
        trades_only = pc.get_combinatorics(data_types=["trades"])
        assert all(c.data_type == "trades" for c in trades_only)

    def test_get_combinatorics_filter_by_venue(self):
        config = {
            "CEFI": {
                "venues": {
                    "BINANCE": {"folders": ["spot"], "data_types": ["trades"]},
                    "COINBASE": {"folders": ["spot"], "data_types": ["trades"]},
                }
            }
        }
        pc = self._make_pc(config)
        binance_only = pc.get_combinatorics(venues=["BINANCE"])
        assert all(c.venue == "BINANCE" for c in binance_only)

    def test_get_combinatorics_filter_by_folder(self):
        pc = self._make_pc(self._minimal_config())
        spot_only = pc.get_combinatorics(folders=["spot"])
        assert all(c.folder == "spot" for c in spot_only)

    def test_get_all_venues_for_category(self):
        pc = self._make_pc(self._minimal_config())
        venues = pc.get_all_venues_for_category("CEFI")
        assert "BINANCE" in venues

    def test_get_all_folders_for_category(self):
        pc = self._make_pc(self._minimal_config())
        folders = pc.get_all_folders_for_category("CEFI")
        assert "spot" in folders
        assert "perpetuals" in folders

    def test_get_all_data_types_for_category(self):
        pc = self._make_pc(self._minimal_config())
        data_types = pc.get_all_data_types_for_category("CEFI")
        assert "trades" in data_types

    def test_skips_venue_with_empty_accessible_types(self):
        config = {
            "CEFI": {
                "venues": {
                    "NO_ACCESS": {
                        "folders": ["spot"],
                        "data_types": ["trades"],
                        "accessible_instrument_types": [],
                    }
                }
            }
        }
        pc = self._make_pc(config)
        assert len(pc.combinatorics) == 0

    def test_filters_folders_by_accessible_types(self):
        config = {
            "CEFI": {
                "venues": {
                    "PARTIAL": {
                        "folders": ["spot", "perpetuals"],
                        "data_types": ["trades"],
                        "accessible_instrument_types": ["SPOT_PAIR"],  # Only spot
                    }
                }
            }
        }
        pc = self._make_pc(config)
        # Only spot folder entries should exist
        assert all(c.folder == "spot" for c in pc.combinatorics)

    def test_tradfi_data_types_as_dict(self):
        config = {
            "TRADFI": {
                "venues": {
                    "NYSE": {
                        "folders": ["equities"],
                        "data_types": {
                            "default": ["ohlcv_1m"],
                            "tick_window": ["ohlcv_1m", "trades"],
                        },
                    }
                }
            }
        }
        pc = self._make_pc(config)
        # Should have entries for both ohlcv_1m and trades
        data_types = {c.data_type for c in pc.combinatorics}
        assert "ohlcv_1m" in data_types
        assert "trades" in data_types

    def test_tradfi_tick_window_only_flag(self):
        config = {
            "TRADFI": {
                "venues": {
                    "NYSE": {
                        "folders": ["equities"],
                        "data_types": {
                            "default": ["ohlcv_1m"],
                            "tick_window": ["ohlcv_1m", "trades"],
                        },
                    }
                }
            }
        }
        pc = self._make_pc(config)
        # trades is tick_window_only, ohlcv_1m is not
        trades_entries = [c for c in pc.combinatorics if c.data_type == "trades"]
        ohlcv_entries = [c for c in pc.combinatorics if c.data_type == "ohlcv_1m"]
        assert all(c.tick_window_only for c in trades_entries)
        assert all(not c.tick_window_only for c in ohlcv_entries)


class TestIsInTickWindow:
    """Tests for is_in_tick_window."""

    def test_date_in_window(self):
        from deployment_api.utils.path_combinatorics import PathCombinatorics

        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.tick_windows = [("2024-01-01", "2024-03-31")]
        assert pc.is_in_tick_window("2024-02-15") is True

    def test_date_outside_window(self):
        from deployment_api.utils.path_combinatorics import PathCombinatorics

        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.tick_windows = [("2024-01-01", "2024-03-31")]
        assert pc.is_in_tick_window("2024-05-01") is False

    def test_no_tick_windows(self):
        from deployment_api.utils.path_combinatorics import PathCombinatorics

        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.tick_windows = []
        assert pc.is_in_tick_window("2024-02-15") is False

    def test_boundary_dates_inclusive(self):
        from deployment_api.utils.path_combinatorics import PathCombinatorics

        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.tick_windows = [("2024-01-01", "2024-03-31")]
        assert pc.is_in_tick_window("2024-01-01") is True
        assert pc.is_in_tick_window("2024-03-31") is True


class TestGetBasePrefix:
    """Tests for _get_base_prefix."""

    def _make_minimal_pc(self):
        from deployment_api.utils.path_combinatorics import PathCombinatorics

        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.config = {}
        pc.combinatorics = []
        pc.service_dimensions = {}
        pc.tick_windows = []
        return pc

    def test_instruments_service(self):
        pc = self._make_minimal_pc()
        assert pc._get_base_prefix("instruments-service") == "instruments"

    def test_processing_service(self):
        pc = self._make_minimal_pc()
        assert pc._get_base_prefix("market-data-processing-service") == "processed_candles/by_date"

    def test_other_service_is_tick_data(self):
        pc = self._make_minimal_pc()
        assert pc._get_base_prefix("market-tick-data-handler") == "raw_tick_data/by_date"


class TestServicePathTemplates:
    """Tests for SERVICE_PATH_TEMPLATES constants."""

    def test_instruments_has_date_and_venue(self):
        template = SERVICE_PATH_TEMPLATES["instruments-service"]
        assert "{date}" in template
        assert "{venue}" in template

    def test_features_delta_one_has_feature_group(self):
        template = SERVICE_PATH_TEMPLATES["features-delta-one-service"]
        assert "{feature_group}" in template

    def test_calendar_has_feature_type(self):
        template = SERVICE_PATH_TEMPLATES["features-calendar-service"]
        assert "{feature_type}" in template

    def test_corporate_actions_is_date_only(self):
        template = SERVICE_PATH_TEMPLATES["corporate-actions"]
        assert "{date}" in template


class TestProcessingServiceCombinatorics:
    """Tests for market-data-processing-service combinatoric expansion."""

    def _make_pc_with_cefi(self):
        config = {
            "CEFI": {
                "venues": {
                    "BINANCE": {
                        "folders": ["spot"],
                        "data_types": ["trades", "derivative_ticker", "book_snapshot_5"],
                    }
                }
            }
        }
        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.config = config
        pc.combinatorics = []
        pc.service_dimensions = {}
        pc.tick_windows = []
        pc._loaded = False
        pc._build_combinatorics()
        return pc

    def test_processing_service_filters_to_valid_data_types(self):
        pc = self._make_pc_with_cefi()
        combos = pc.get_combinatorics(service="market-data-processing-service")
        # Only PROCESSING_DATA_TYPES should appear
        dt_set = {c.data_type for c in combos}
        assert dt_set.issubset(set(PROCESSING_DATA_TYPES))
        # book_snapshot_5 should NOT be present
        assert "book_snapshot_5" not in dt_set

    def test_processing_service_adds_timeframes(self):
        pc = self._make_pc_with_cefi()
        combos = pc.get_combinatorics(service="market-data-processing-service")
        timeframes = {c.timeframe for c in combos}
        assert timeframes == set(PROCESSING_TIMEFRAMES)

    def test_processing_service_with_timeframe_filter(self):
        pc = self._make_pc_with_cefi()
        combos = pc.get_combinatorics(
            service="market-data-processing-service", timeframes=["1h", "4h"]
        )
        timeframes = {c.timeframe for c in combos}
        assert timeframes == {"1h", "4h"}


class TestCalendarFeatureTypes:
    """Tests for CALENDAR_FEATURE_TYPES constant."""

    def test_has_three_types(self):
        assert len(CALENDAR_FEATURE_TYPES) == 3

    def test_expected_types(self):
        assert "temporal" in CALENDAR_FEATURE_TYPES
        assert "scheduled_events" in CALENDAR_FEATURE_TYPES
        assert "macro" in CALENDAR_FEATURE_TYPES


class TestInstrumentTypeToFolder:
    """Tests for INSTRUMENT_TYPE_TO_FOLDER mapping."""

    def test_spot_pair_maps_to_spot(self):
        assert INSTRUMENT_TYPE_TO_FOLDER["SPOT_PAIR"] == "spot"

    def test_perpetual_maps_to_perpetuals(self):
        assert INSTRUMENT_TYPE_TO_FOLDER["PERPETUAL"] == "perpetuals"

    def test_equity_maps_to_equities(self):
        assert INSTRUMENT_TYPE_TO_FOLDER["EQUITY"] == "equities"

    def test_pool_maps_to_pool(self):
        assert INSTRUMENT_TYPE_TO_FOLDER["POOL"] == "pool"


class TestHasServiceCombinatorics:
    """Tests for has_service_combinatorics."""

    def test_market_tick_with_entries(self):
        config = {"CEFI": {"venues": {"BINANCE": {"folders": ["spot"], "data_types": ["trades"]}}}}
        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.config = config
        pc.combinatorics = []
        pc.service_dimensions = {}
        pc.tick_windows = []
        pc._build_combinatorics()
        assert pc.has_service_combinatorics("market-tick-data-handler", "CEFI") is True

    def test_market_tick_with_no_entries(self):
        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.config = {}
        pc.combinatorics = []
        pc.service_dimensions = {}
        pc.tick_windows = []
        assert pc.has_service_combinatorics("market-tick-data-handler", "CEFI") is False


class TestGetServicePrefixesForDate:
    """Tests for get_service_prefixes_for_date."""

    def _make_pc_with_venues(self):
        config = {
            "CEFI": {
                "venues": {
                    "BINANCE": {
                        "folders": ["spot"],
                        "data_types": ["trades"],
                    },
                    "COINBASE": {
                        "folders": ["spot"],
                        "data_types": ["trades"],
                    },
                }
            }
        }
        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.config = config
        pc.combinatorics = []
        pc.service_dimensions = {}
        pc.tick_windows = []
        pc._loaded = False
        pc._build_combinatorics()
        pc._load_service_dimensions()
        return pc

    def test_unknown_service_returns_empty(self):
        pc = self._make_pc_with_venues()
        result = pc.get_service_prefixes_for_date("unknown-service", "CEFI", "2024-01-15")
        assert result == []

    def test_instruments_service_returns_prefixes(self):
        pc = self._make_pc_with_venues()
        result = pc.get_service_prefixes_for_date("instruments-service", "CEFI", "2024-01-15")
        assert len(result) > 0
        # Each result is a (prefix, venue) tuple
        assert all(len(r) == 2 for r in result)

    def test_instruments_service_venue_filter(self):
        pc = self._make_pc_with_venues()
        result = pc.get_service_prefixes_for_date(
            "instruments-service", "CEFI", "2024-01-15", venue_filter=["BINANCE"]
        )
        # Only BINANCE prefixes
        assert all("BINANCE" in r[0] for r in result)

    def test_unknown_category_returns_empty(self):
        pc = self._make_pc_with_venues()
        # Service dimensions limit to valid categories
        # Instruments service will try to get_all_venues_for_category("UNKNOWN")
        result = pc.get_service_prefixes_for_date("instruments-service", "UNKNOWN", "2024-01-15")
        assert result == []

    def test_calendar_service_returns_feature_types(self):
        pc = self._make_pc_with_venues()
        result = pc.get_service_prefixes_for_date("features-calendar-service", "CEFI", "2024-01-15")
        assert len(result) == len(CALENDAR_FEATURE_TYPES)

    def test_corporate_actions_returns_single_prefix(self):
        pc = self._make_pc_with_venues()
        # corporate-actions is TRADFI-only per sharding config
        result = pc.get_service_prefixes_for_date("corporate-actions", "TRADFI", "2024-01-15")
        assert len(result) == 1
        assert result[0][1] is None  # No sub-dimension


class TestGetPrefixesForDate:
    """Tests for get_prefixes_for_date method."""

    def _make_pc_with_cefi(self):
        config = {
            "CEFI": {
                "venues": {
                    "BINANCE": {
                        "folders": ["spot"],
                        "data_types": ["trades"],
                    }
                }
            }
        }
        pc = PathCombinatorics.__new__(PathCombinatorics)
        pc.config = config
        pc.combinatorics = []
        pc.service_dimensions = {}
        pc.tick_windows = []
        pc._loaded = False
        pc._build_combinatorics()
        pc._load_tick_windows()
        pc._load_service_dimensions()
        return pc

    def test_returns_list_of_strings(self):
        pc = self._make_pc_with_cefi()
        result = pc.get_prefixes_for_date("market-tick-data-handler", "2024-01-15", category="CEFI")
        assert isinstance(result, list)
        assert all(isinstance(p, str) for p in result)

    def test_with_category_filter(self):
        pc = self._make_pc_with_cefi()
        result = pc.get_prefixes_for_date("market-tick-data-handler", "2024-01-15", category="CEFI")
        assert len(result) > 0
        assert all("BINANCE" in p for p in result)

    def test_with_no_matching_combos(self):
        pc = self._make_pc_with_cefi()
        result = pc.get_prefixes_for_date("market-tick-data-handler", "2024-01-15", category="DEFI")
        assert result == []

    def test_start_date_filter(self):
        pc = self._make_pc_with_cefi()
        # Add a start_date to the combinatoric entry
        for c in pc.combinatorics:
            c.start_date = "2025-01-01"
        # Date before start should yield no results
        result = pc.get_prefixes_for_date("market-tick-data-handler", "2024-06-01", category="CEFI")
        assert result == []

    def test_tick_window_only_skipped_outside_window(self):
        pc = self._make_pc_with_cefi()
        # Mark all combos as tick_window_only
        for c in pc.combinatorics:
            c.tick_window_only = True
        # No tick windows configured → outside tick window
        result = pc.get_prefixes_for_date("market-tick-data-handler", "2024-01-15", category="CEFI")
        assert result == []
