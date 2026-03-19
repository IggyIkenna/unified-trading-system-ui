"""
Unit tests for batch_query_engine module.

Tests cover:
- get_expected_dates_for_category
- query_specific_prefixes_for_category (with mocked dependencies)
- query_generic_prefixes_for_category (with mocked dependencies)
"""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from deployment_api.routes.batch_query_engine import (
    get_expected_dates_for_category,
    query_generic_prefixes_for_category,
    query_specific_prefixes_for_category,
)


class TestGetExpectedDatesForCategory:
    """Tests for get_expected_dates_for_category."""

    def test_no_start_date_returns_all_dates(self):
        all_dates = {"2026-01-01", "2026-01-02", "2026-01-03"}
        config = {}
        result = get_expected_dates_for_category(all_dates, config, "instruments-service", "CEFI")
        assert result == all_dates

    def test_filters_dates_before_category_start(self):
        all_dates = {"2026-01-01", "2026-01-15", "2026-02-01"}
        config = {"instruments-service": {"CEFI": {"category_start": "2026-01-10"}}}

        with patch(
            "deployment_api.routes.batch_query_engine.get_category_start_date"
        ) as mock_start:
            mock_start.return_value = "2026-01-10"
            result = get_expected_dates_for_category(
                all_dates, config, "instruments-service", "CEFI"
            )
        assert "2026-01-01" not in result
        assert "2026-01-15" in result
        assert "2026-02-01" in result

    def test_empty_all_dates_returns_empty(self):
        all_dates: set = set()
        with patch(
            "deployment_api.routes.batch_query_engine.get_category_start_date"
        ) as mock_start:
            mock_start.return_value = "2026-01-01"
            result = get_expected_dates_for_category(all_dates, {}, "svc", "CAT")
        assert result == set()

    def test_category_start_exactly_equal_to_date_is_included(self):
        all_dates = {"2026-03-01", "2026-03-02"}
        with patch(
            "deployment_api.routes.batch_query_engine.get_category_start_date"
        ) as mock_start:
            mock_start.return_value = "2026-03-01"
            result = get_expected_dates_for_category(all_dates, {}, "svc", "CAT")
        assert "2026-03-01" in result
        assert "2026-03-02" in result


class TestQuerySpecificPrefixesForCategory:
    """Tests for query_specific_prefixes_for_category."""

    def _make_combo(
        self,
        venue="BINANCE",
        data_type="trades",
        folder="spot",
        timeframe=None,
        start_date=None,
        tick_window_only=False,
    ):
        combo = MagicMock()
        combo.venue = venue
        combo.data_type = data_type
        combo.folder = folder
        combo.timeframe = timeframe
        combo.start_date = start_date
        combo.tick_window_only = tick_window_only
        combo.to_gcs_prefix.return_value = f"prefix/{venue}/{data_type}"
        return combo

    def test_returns_error_when_no_bucket(self):
        with patch("deployment_api.routes.batch_query_engine.BUCKET_MAPPING", {"svc": {}}):
            result = query_specific_prefixes_for_category(
                "svc", "UNKNOWN_CAT", {"2026-01-01"}, None, None, None, "", {}, set()
            )
        assert "error" in result

    def test_returns_empty_when_no_combinatorics(self):
        mock_pc = MagicMock()
        mock_pc.get_combinatorics.return_value = []

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"svc": {"CEFI": "bucket-cefi"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
        ):
            result = query_specific_prefixes_for_category(
                "svc", "CEFI", {"2026-01-01"}, None, None, None, "", {}, set()
            )
        assert result["found_dates"] == set()
        assert result["venue_data"] == {}

    def test_empty_dates_returns_empty(self):
        mock_pc = MagicMock()
        combo = self._make_combo()
        mock_pc.get_combinatorics.return_value = [combo]
        mock_pc.is_in_tick_window.return_value = False

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"svc": {"CEFI": "bucket-cefi"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
            patch("deployment_api.routes.batch_query_engine.list_objects", return_value=[]),
        ):
            result = query_specific_prefixes_for_category(
                "svc", "CEFI", set(), None, None, None, "", {}, set()
            )
        assert result["found_dates"] == set()

    def test_found_date_tracked_by_venue(self):
        mock_pc = MagicMock()
        combo = self._make_combo(venue="BINANCE", data_type="trades", folder="spot")
        mock_pc.get_combinatorics.return_value = [combo]
        mock_pc.is_in_tick_window.return_value = False
        mock_pc._get_base_prefix.return_value = ""

        blob = SimpleNamespace(updated=None, name="some/file.parquet")
        combo.to_gcs_prefix.return_value = "BINANCE/trades"

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"svc": {"CEFI": "bucket-cefi"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
            patch("deployment_api.routes.batch_query_engine.list_objects", return_value=[blob]),
        ):
            result = query_specific_prefixes_for_category(
                "svc", "CEFI", {"2026-01-15"}, None, None, None, "", {}, set()
            )
        assert "2026-01-15" in result["found_dates"]
        assert "BINANCE" in result["venue_data"]
        assert "2026-01-15" in result["venue_data"]["BINANCE"]

    def test_start_date_filter_skips_earlier_dates(self):
        mock_pc = MagicMock()
        combo = self._make_combo(start_date="2026-02-01")
        mock_pc.get_combinatorics.return_value = [combo]
        mock_pc.is_in_tick_window.return_value = False
        mock_pc._get_base_prefix.return_value = ""

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"svc": {"CEFI": "bucket-cefi"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
            patch(
                "deployment_api.routes.batch_query_engine.list_objects", return_value=[]
            ) as _mock_list,
        ):
            _result = query_specific_prefixes_for_category(
                "svc", "CEFI", {"2026-01-01"}, None, None, None, "", {}, set()
            )
        # Date 2026-01-01 is before combo start_date 2026-02-01, so it's skipped
        assert "2026-01-01" not in _result["found_dates"]

    def test_tick_window_only_skipped_outside_window(self):
        mock_pc = MagicMock()
        combo = self._make_combo(tick_window_only=True)
        mock_pc.get_combinatorics.return_value = [combo]
        mock_pc.is_in_tick_window.return_value = False
        mock_pc._get_base_prefix.return_value = ""

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"svc": {"CEFI": "bucket-cefi"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
            patch(
                "deployment_api.routes.batch_query_engine.list_objects", return_value=[]
            ) as mock_list,
        ):
            _result = query_specific_prefixes_for_category(
                "svc", "CEFI", {"2026-01-01"}, None, None, None, "", {}, set()
            )
        # Combo is tick_window_only but we're outside tick window — skipped
        mock_list.assert_not_called()

    def test_timeframe_tracked_when_present(self):
        mock_pc = MagicMock()
        combo = self._make_combo(venue="NYSE", data_type="ohlcv", folder="equities", timeframe="1m")
        mock_pc.get_combinatorics.return_value = [combo]
        mock_pc.is_in_tick_window.return_value = False
        mock_pc._get_base_prefix.return_value = ""
        combo.to_gcs_prefix.return_value = "NYSE/ohlcv"

        blob = SimpleNamespace(updated=None, name="data.parquet")

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"svc": {"CEFI": "bucket-cefi"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
            patch("deployment_api.routes.batch_query_engine.list_objects", return_value=[blob]),
        ):
            result = query_specific_prefixes_for_category(
                "svc", "CEFI", {"2026-01-15"}, None, None, None, "", {}, set()
            )
        assert "1m" in result["timeframe_data"]


class TestQueryGenericPrefixesForCategory:
    """Tests for query_generic_prefixes_for_category."""

    def test_returns_error_when_no_bucket(self):
        with patch("deployment_api.routes.batch_query_engine.BUCKET_MAPPING", {"svc": {}}):
            result = query_generic_prefixes_for_category(
                "svc", "UNKNOWN_CAT", {"2026-01-01"}, None, ""
            )
        assert "error" in result

    def test_returns_empty_when_no_entries(self):
        mock_pc = MagicMock()
        mock_pc.get_service_prefixes_for_date.return_value = []

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"svc": {"CEFI": "bucket"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
        ):
            result = query_generic_prefixes_for_category("svc", "CEFI", {"2026-01-01"}, None, "")
        assert result["found_dates"] == set()
        assert result["venue_data"] == {}

    def test_found_date_tracked(self):
        mock_pc = MagicMock()
        mock_pc.get_service_prefixes_for_date.return_value = [("BINANCE/spot/", "BINANCE")]

        blob = SimpleNamespace(updated=None, name="data.parquet")

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"instruments-service": {"CEFI": "bucket"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
            patch("deployment_api.routes.batch_query_engine.list_objects", return_value=[blob]),
        ):
            result = query_generic_prefixes_for_category(
                "instruments-service", "CEFI", {"2026-01-15"}, None, ""
            )
        assert "2026-01-15" in result["found_dates"]
        # instruments-service: sub_dim IS the venue
        assert "BINANCE" in result["venue_data"]

    def test_sub_dimension_tracked(self):
        mock_pc = MagicMock()
        mock_pc.get_service_prefixes_for_date.return_value = [
            ("feature_group_a/", "feature_group_a")
        ]

        blob = SimpleNamespace(updated=None, name="data.parquet")

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"features-delta-one": {"CEFI": "bucket"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
            patch("deployment_api.routes.batch_query_engine.list_objects", return_value=[blob]),
        ):
            result = query_generic_prefixes_for_category(
                "features-delta-one", "CEFI", {"2026-01-15"}, None, ""
            )
        assert "feature_group_a" in result["sub_dimension_data"]

    def test_no_data_date_not_found(self):
        mock_pc = MagicMock()
        mock_pc.get_service_prefixes_for_date.return_value = [("prefix/", "dim_a")]

        with (
            patch(
                "deployment_api.routes.batch_query_engine.BUCKET_MAPPING",
                {"svc": {"CEFI": "bucket"}},
            ),
            patch(
                "deployment_api.routes.batch_query_engine.get_path_combinatorics",
                return_value=mock_pc,
            ),
            patch("deployment_api.routes.batch_query_engine.list_objects", return_value=[]),
        ):
            result = query_generic_prefixes_for_category("svc", "CEFI", {"2026-01-15"}, None, "")
        assert "2026-01-15" not in result["found_dates"]
