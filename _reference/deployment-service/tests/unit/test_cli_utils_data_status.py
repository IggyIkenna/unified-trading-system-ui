"""
Unit tests for CLI utils data_status_* modules.

Covers:
- data_status_formatters.py   — pure formatting functions
- data_status_processing.py  — result-processing logic
- data_status_scanning.py    — scanning helpers (mocked cloud)
- data_status_checkers.py    — detailed checker functions (mocked cloud + config)
- data_status_display_fixed.py  — fixed-service display orchestration
- data_status_display_dynamic.py — dynamic-service display orchestration
- data_status_venue_utils.py — venue coverage check
"""

import json
from collections import defaultdict
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_hierarchy(
    cat: str = "CEFI",
    venue: str = "BINANCE-SPOT",
    complete: int = 5,
    total: int = 7,
    missing: list[str] | None = None,
) -> dict[str, dict[str, dict[str, object]]]:
    """Build a minimal hierarchy dict as produced by processing functions."""
    return {
        cat: {
            venue: {
                "complete": complete,
                "total": total,
                "oldest": datetime(2024, 1, 1, tzinfo=UTC),
                "newest": datetime(2024, 1, 7, tzinfo=UTC),
                "excluded": 0,
                "missing_dates": missing or ["2024-01-03", "2024-01-06"],
            }
        }
    }


# ===========================================================================
# data_status_formatters.py
# ===========================================================================


class TestFormatSummaryOutput:
    @pytest.mark.unit
    def test_prints_overall_percentage(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_summary_output

        hierarchy = _make_hierarchy(complete=3, total=4)
        format_summary_output(hierarchy, overall_complete=3, overall_total=4)
        captured = capsys.readouterr()
        assert "75.0%" in captured.out

    @pytest.mark.unit
    def test_zero_total_does_not_raise(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_summary_output

        format_summary_output({}, overall_complete=0, overall_total=0)
        captured = capsys.readouterr()
        assert "0.0%" in captured.out

    @pytest.mark.unit
    def test_multiple_categories_sorted(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_summary_output

        hierarchy: dict[str, dict[str, dict[str, object]]] = {
            "TRADFI": {
                "CME": {
                    "complete": 2,
                    "total": 4,
                    "oldest": None,
                    "newest": None,
                    "excluded": 0,
                    "missing_dates": [],
                }
            },
            "CEFI": {
                "BINANCE": {
                    "complete": 4,
                    "total": 4,
                    "oldest": None,
                    "newest": None,
                    "excluded": 0,
                    "missing_dates": [],
                }
            },
        }
        format_summary_output(hierarchy, overall_complete=6, overall_total=8)
        captured = capsys.readouterr()
        # CEFI should appear before TRADFI (sorted)
        assert captured.out.index("CEFI") < captured.out.index("TRADFI")


class TestFormatTreeOutput:
    @pytest.mark.unit
    def test_100_percent_shows_checkmark(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_tree_output

        hierarchy = _make_hierarchy(complete=5, total=5, missing=[])
        format_tree_output(
            hierarchy,
            overall_complete=5,
            overall_total=5,
            overall_excluded=0,
            category_excluded={"CEFI": 0},
        )
        captured = capsys.readouterr()
        assert "100.0%" in captured.out

    @pytest.mark.unit
    def test_excluded_note_shown_when_nonzero(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_tree_output

        hierarchy = _make_hierarchy(complete=3, total=5)
        format_tree_output(
            hierarchy,
            overall_complete=3,
            overall_total=5,
            overall_excluded=2,
            category_excluded={"CEFI": 2},
        )
        captured = capsys.readouterr()
        assert "excluded" in captured.out

    @pytest.mark.unit
    def test_timestamps_shown_when_flag_set(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_tree_output

        hierarchy = _make_hierarchy(complete=3, total=5)
        format_tree_output(
            hierarchy,
            overall_complete=3,
            overall_total=5,
            overall_excluded=0,
            category_excluded={"CEFI": 0},
            show_timestamps=True,
        )
        captured = capsys.readouterr()
        assert "updated" in captured.out

    @pytest.mark.unit
    def test_zero_total_in_category(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_tree_output

        hierarchy: dict[str, dict[str, dict[str, object]]] = {
            "CEFI": {
                "ALL": {
                    "complete": 0,
                    "total": 0,
                    "oldest": None,
                    "newest": None,
                    "excluded": 0,
                    "missing_dates": [],
                }
            }
        }
        format_tree_output(
            hierarchy,
            overall_complete=0,
            overall_total=0,
            overall_excluded=0,
            category_excluded={"CEFI": 0},
        )
        captured = capsys.readouterr()
        assert "0.0%" in captured.out


class TestFormatJsonOutput:
    @pytest.mark.unit
    def test_valid_json_emitted(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_json_output

        hierarchy = _make_hierarchy()
        format_json_output(
            service="instruments-service",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 7),
            hierarchy=hierarchy,
            overall_complete=5,
            overall_total=7,
            overall_excluded=0,
            category_start_dates={"CEFI": "2024-01-01"},
            category_excluded={"CEFI": 0},
        )
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["service"] == "instruments-service"
        assert "categories" in data
        assert "CEFI" in data["categories"]

    @pytest.mark.unit
    def test_completion_percent_calculation(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_json_output

        hierarchy = _make_hierarchy(complete=3, total=4)
        format_json_output(
            service="test-svc",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 4),
            hierarchy=hierarchy,
            overall_complete=3,
            overall_total=4,
            overall_excluded=0,
            category_start_dates={},
            category_excluded={},
        )
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert abs(data["overall_completion"] - 75.0) < 0.01


class TestFormatMissingDatesOutput:
    @pytest.mark.unit
    def test_missing_dates_listed(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_missing_dates_output

        hierarchy = _make_hierarchy(missing=["2024-01-03", "2024-01-05"])
        format_missing_dates_output(hierarchy)
        captured = capsys.readouterr()
        assert "2024-01-03" in captured.out
        assert "2024-01-05" in captured.out

    @pytest.mark.unit
    def test_no_missing_shows_checkmark(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_missing_dates_output

        hierarchy: dict[str, dict[str, dict[str, object]]] = {
            "CEFI": {
                "ALL": {
                    "complete": 5,
                    "total": 5,
                    "oldest": None,
                    "newest": None,
                    "excluded": 0,
                    "missing_dates": [],
                }
            }
        }
        format_missing_dates_output(hierarchy)
        captured = capsys.readouterr()
        assert "No missing" in captured.out

    @pytest.mark.unit
    def test_more_than_10_missing_truncated(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_missing_dates_output

        many_dates = [f"2024-01-{d:02d}" for d in range(1, 16)]
        hierarchy: dict[str, dict[str, dict[str, object]]] = {
            "CEFI": {
                "VENUE": {
                    "complete": 0,
                    "total": 15,
                    "oldest": None,
                    "newest": None,
                    "excluded": 0,
                    "missing_dates": many_dates,
                }
            }
        }
        format_missing_dates_output(hierarchy)
        captured = capsys.readouterr()
        assert "15 dates" in captured.out or "more" in captured.out


class TestFormatBenchmarkInfo:
    @pytest.mark.unit
    def test_benchmark_output_includes_throughput(self, capsys):
        import time

        from deployment_service.cli.utils.data_status_formatters import format_benchmark_info

        start_time = time.time() - 2.0  # Simulate 2 seconds elapsed
        format_benchmark_info(
            start_time=start_time,
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 10),
        )
        captured = capsys.readouterr()
        assert "Throughput" in captured.out
        assert "days/second" in captured.out


class TestFormatBackfillHint:
    @pytest.mark.unit
    def test_hint_shown_when_incomplete(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_backfill_hint

        format_backfill_hint(
            service="instruments-service",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 7),
            overall_pct=75.0,
        )
        captured = capsys.readouterr()
        assert "backfill" in captured.out.lower() or "deploy" in captured.out.lower()

    @pytest.mark.unit
    def test_no_hint_when_complete(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_backfill_hint

        format_backfill_hint(
            service="instruments-service",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 7),
            overall_pct=100.0,
        )
        captured = capsys.readouterr()
        assert captured.out == ""


class TestFormatHeaders:
    @pytest.mark.unit
    def test_dynamic_service_header(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import (
            format_dynamic_service_header,
        )

        format_dynamic_service_header(
            service="strategy-service",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 7),
        )
        captured = capsys.readouterr()
        assert "strategy-service" in captured.out
        assert "2024-01-01" in captured.out

    @pytest.mark.unit
    def test_fixed_service_header_with_exclusions(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import format_fixed_service_header

        format_fixed_service_header(
            service="instruments-service",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 10),
            total_requested_days=10,
            category_excluded={"CEFI": 2, "TRADFI": 0},
            categories=["CEFI", "TRADFI"],
            category_start_dates={"CEFI": "2024-01-03", "TRADFI": "2024-01-01"},
        )
        captured = capsys.readouterr()
        assert "instruments-service" in captured.out
        assert "excluded" in captured.out

    @pytest.mark.unit
    def test_venue_coverage_header(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import (
            format_venue_coverage_header,
        )

        format_venue_coverage_header(
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 7),
        )
        captured = capsys.readouterr()
        assert "instruments-service" in captured.out


class TestFormatVenueCoverageResults:
    @pytest.mark.unit
    def test_json_output_mode(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import (
            format_venue_coverage_results,
        )

        results: dict[str, dict[str, object]] = {
            "CEFI": {
                "2024-01-01": {
                    "found_venues": {"BINANCE"},
                    "expected_venues": {"BINANCE"},
                    "missing_venues": set(),
                    "file_exists": True,
                }
            }
        }
        format_venue_coverage_results(
            results=results,
            output="json",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 1),
        )
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["service"] == "instruments-service"

    @pytest.mark.unit
    def test_tree_output_complete(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import (
            format_venue_coverage_results,
        )

        results: dict[str, dict[str, object]] = {
            "CEFI": {
                "2024-01-01": {
                    "found_venues": {"BINANCE"},
                    "expected_venues": {"BINANCE"},
                    "missing_venues": set(),
                    "file_exists": True,
                }
            }
        }
        format_venue_coverage_results(
            results=results,
            output="tree",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 1),
        )
        captured = capsys.readouterr()
        assert "All expected venues" in captured.out

    @pytest.mark.unit
    def test_tree_output_with_missing(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import (
            format_venue_coverage_results,
        )

        results: dict[str, dict[str, object]] = {
            "CEFI": {
                "2024-01-01": {
                    "found_venues": set(),
                    "expected_venues": {"BINANCE"},
                    "missing_venues": {"BINANCE"},
                    "file_exists": True,
                }
            }
        }
        format_venue_coverage_results(
            results=results,
            output="tree",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 1),
        )
        captured = capsys.readouterr()
        assert "VENUE COVERAGE ISSUES" in captured.out


class TestFormatDetailedBreakdown:
    @pytest.mark.unit
    def test_timeframe_breakdown_shown(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import (
            format_detailed_breakdown,
        )

        fast_results: dict[str, object] = {
            "_tf_breakdown": {
                "CEFI": {
                    "1m": {"complete": 3, "total": 5},
                    "5m": {"complete": 5, "total": 5},
                }
            }
        }
        format_detailed_breakdown(fast_results)
        captured = capsys.readouterr()
        assert "DETAILED BREAKDOWN" in captured.out
        assert "1m" in captured.out
        assert "5m" in captured.out

    @pytest.mark.unit
    def test_empty_breakdown_no_output(self, capsys):
        from deployment_service.cli.utils.data_status_formatters import (
            format_detailed_breakdown,
        )

        format_detailed_breakdown({})
        captured = capsys.readouterr()
        assert captured.out == ""


# ===========================================================================
# data_status_processing.py
# ===========================================================================


class TestProcessFastResults:
    @pytest.mark.unit
    def test_complete_count_increments(self):
        from deployment_service.cli.utils.data_status_processing import process_fast_results

        fast_results: dict[str, object] = {
            "CEFI": {
                "BINANCE": {
                    "2024-01-01": {"exists": True},
                    "2024-01-02": {"exists": False},
                }
            }
        }

        mock_loader = MagicMock()
        mock_loader.get_venue_start_date.return_value = None

        hierarchy: dict[str, dict[str, dict[str, object]]] = defaultdict(
            lambda: defaultdict(
                lambda: {"complete": 0, "total": 0, "oldest": None, "newest": None, "excluded": 0}
            )
        )

        # Pass venue explicitly so cat_venues = ["BINANCE"] (avoids the operator-precedence
        # quirk in the source where `venues_config.get("categories") or {}.get(...)` iterates
        # the categories dict keys rather than the venues list).
        complete, total, excluded = process_fast_results(
            fast_results=fast_results,
            categories=["CEFI"],
            category_valid_dates={"CEFI": ["2024-01-01", "2024-01-02"]},
            category_excluded={"CEFI": 0},
            has_venue_dimension=True,
            venues_config={},
            venue=("BINANCE",),
            loader=mock_loader,
            service="instruments-service",
            hierarchy=hierarchy,
            show_timestamps=False,
        )

        assert complete == 1
        assert total == 2
        assert excluded == 0

    @pytest.mark.unit
    def test_venue_start_date_filtering(self):
        from deployment_service.cli.utils.data_status_processing import process_fast_results

        fast_results: dict[str, object] = {
            "CEFI": {
                "BINANCE": {
                    "2024-01-01": {"exists": True},
                    "2024-01-02": {"exists": True},
                    "2024-01-03": {"exists": True},
                }
            }
        }

        mock_loader = MagicMock()
        # Venue starts on 2024-01-02 → 2024-01-01 excluded
        mock_loader.get_venue_start_date.return_value = "2024-01-02"

        hierarchy: dict[str, dict[str, dict[str, object]]] = defaultdict(
            lambda: defaultdict(
                lambda: {"complete": 0, "total": 0, "oldest": None, "newest": None, "excluded": 0}
            )
        )

        complete, total, excluded = process_fast_results(
            fast_results=fast_results,
            categories=["CEFI"],
            category_valid_dates={"CEFI": ["2024-01-01", "2024-01-02", "2024-01-03"]},
            category_excluded={"CEFI": 0},
            has_venue_dimension=True,
            venues_config={},
            venue=("BINANCE",),
            loader=mock_loader,
            service="instruments-service",
            hierarchy=hierarchy,
            show_timestamps=False,
        )

        # Only 2024-01-02 and 2024-01-03 should count
        assert total == 2
        assert complete == 2

    @pytest.mark.unit
    def test_no_venue_dimension_uses_all(self):
        from deployment_service.cli.utils.data_status_processing import process_fast_results

        fast_results: dict[str, object] = {
            "CEFI": {
                "ALL": {
                    "2024-01-01": {"exists": True},
                    "2024-01-02": {"exists": True},
                }
            }
        }

        mock_loader = MagicMock()
        mock_loader.get_venue_start_date.return_value = None

        hierarchy: dict[str, dict[str, dict[str, object]]] = defaultdict(
            lambda: defaultdict(
                lambda: {"complete": 0, "total": 0, "oldest": None, "newest": None, "excluded": 0}
            )
        )

        complete, total, excluded = process_fast_results(
            fast_results=fast_results,
            categories=["CEFI"],
            category_valid_dates={"CEFI": ["2024-01-01", "2024-01-02"]},
            category_excluded={"CEFI": 0},
            has_venue_dimension=False,
            venues_config={},
            venue=(),
            loader=mock_loader,
            service="features-calendar-service",
            hierarchy=hierarchy,
            show_timestamps=False,
        )

        assert complete == 2
        assert total == 2

    @pytest.mark.unit
    def test_missing_category_in_fast_results_skipped(self):
        from deployment_service.cli.utils.data_status_processing import process_fast_results

        # fast_results has no CEFI
        fast_results: dict[str, object] = {}

        mock_loader = MagicMock()
        hierarchy: dict[str, dict[str, dict[str, object]]] = defaultdict(
            lambda: defaultdict(
                lambda: {"complete": 0, "total": 0, "oldest": None, "newest": None, "excluded": 0}
            )
        )

        complete, total, excluded = process_fast_results(
            fast_results=fast_results,
            categories=["CEFI"],
            category_valid_dates={"CEFI": ["2024-01-01"]},
            category_excluded={"CEFI": 0},
            has_venue_dimension=False,
            venues_config={},
            venue=(),
            loader=mock_loader,
            service="instruments-service",
            hierarchy=hierarchy,
            show_timestamps=False,
        )

        assert complete == 0
        assert total == 0


class TestProcessBatchResults:
    @pytest.mark.unit
    def test_dates_matched_from_index(self):
        from deployment_service.cli.utils.data_status_processing import process_batch_results

        mock_index = MagicMock()
        mock_index.dates_found = {"2024-01-01", "2024-01-02"}
        mock_index.blobs = []
        mock_index.get_stats.return_value = MagicMock(
            oldest_update_time=None, newest_update_time=None
        )

        # The path_template "by_date/day={date}/" → prefix = "by_date/day="
        # so bucket_to_category key = "gs://test-bucket/by_date/day="
        bucket_indexes: dict[str, object] = {"gs://test-bucket/by_date/day=": mock_index}

        mock_loader = MagicMock()
        mock_loader.get_venue_start_date.return_value = None

        hierarchy: dict[str, dict[str, dict[str, object]]] = defaultdict(
            lambda: defaultdict(
                lambda: {"complete": 0, "total": 0, "oldest": None, "newest": None, "excluded": 0}
            )
        )

        complete, total, excluded = process_batch_results(
            bucket_indexes=bucket_indexes,
            categories=["CEFI"],
            bucket_info={
                "CEFI": {
                    "bucket": "test-bucket",
                    "path_template": "by_date/day={date}/",
                }
            },
            category_valid_dates={"CEFI": ["2024-01-01", "2024-01-02", "2024-01-03"]},
            category_excluded={"CEFI": 0},
            has_venue_dimension=False,
            venues_config={},
            venue=(),
            loader=mock_loader,
            service="features-calendar-service",
            hierarchy=hierarchy,
            show_timestamps=False,
            all_dates=["2024-01-01", "2024-01-02", "2024-01-03"],
        )

        assert total == 3
        assert complete == 2  # Only 2 dates found in index

    @pytest.mark.unit
    def test_unrecognized_path_skipped(self):
        from deployment_service.cli.utils.data_status_processing import process_batch_results

        mock_index = MagicMock()
        mock_index.dates_found = {"2024-01-01"}
        mock_index.blobs = []

        bucket_indexes: dict[str, object] = {"gs://unknown-bucket/": mock_index}

        mock_loader = MagicMock()
        hierarchy: dict[str, dict[str, dict[str, object]]] = defaultdict(
            lambda: defaultdict(
                lambda: {"complete": 0, "total": 0, "oldest": None, "newest": None, "excluded": 0}
            )
        )

        complete, total, excluded = process_batch_results(
            bucket_indexes=bucket_indexes,
            categories=["CEFI"],
            bucket_info={
                "CEFI": {
                    "bucket": "test-bucket",
                    "path_template": "by_date/day={date}/",
                }
            },
            category_valid_dates={"CEFI": ["2024-01-01"]},
            category_excluded={"CEFI": 0},
            has_venue_dimension=False,
            venues_config={},
            venue=(),
            loader=mock_loader,
            service="instruments-service",
            hierarchy=hierarchy,
            show_timestamps=False,
            all_dates=["2024-01-01"],
        )

        assert total == 0  # Path didn't match, nothing counted


# ===========================================================================
# data_status_scanning.py
# ===========================================================================


class TestScanDatesNoVenue:
    @pytest.mark.unit
    def test_returns_all_cats_fast_results(self):
        from deployment_service.cli.utils.data_status_scanning import scan_dates_fast_mode

        mock_cloud = MagicMock()
        mock_cloud.check_dates_exist_fast.return_value = {
            "2024-01-01": {"exists": True},
            "2024-01-02": {"exists": False},
        }

        result = scan_dates_fast_mode(
            categories=["CEFI", "TRADFI"],
            bucket_info={
                "CEFI": {"bucket": "bucket-cefi", "path_template": "by_date/day={date}/"},
                "TRADFI": {"bucket": "bucket-tradfi", "path_template": "by_date/day={date}/"},
            },
            category_valid_dates={
                "CEFI": ["2024-01-01", "2024-01-02"],
                "TRADFI": ["2024-01-01", "2024-01-02"],
            },
            cloud_client=mock_cloud,
            num_days=2,
        )

        assert "CEFI" in result
        assert "TRADFI" in result
        assert "ALL" in result["CEFI"]

    @pytest.mark.unit
    def test_missing_cat_in_bucket_info_skipped(self):
        from deployment_service.cli.utils.data_status_scanning import scan_dates_fast_mode

        mock_cloud = MagicMock()
        mock_cloud.check_dates_exist_fast.return_value = {}

        result = scan_dates_fast_mode(
            categories=["CEFI", "DEFI"],
            bucket_info={"CEFI": {"bucket": "bucket-cefi", "path_template": "by_date/day={date}/"}},
            category_valid_dates={"CEFI": ["2024-01-01"], "DEFI": ["2024-01-01"]},
            cloud_client=mock_cloud,
            num_days=1,
        )

        # DEFI not in bucket_info, should not appear
        assert "DEFI" not in result
        assert "CEFI" in result


class TestScanBucketsBatchMode:
    @pytest.mark.unit
    def test_calls_parallel_scan(self):
        from deployment_service.cli.utils.data_status_scanning import scan_buckets_batch_mode

        mock_cloud = MagicMock()
        mock_cloud.parallel_scan_buckets.return_value = {"gs://test-bucket/by_date/": MagicMock()}

        result = scan_buckets_batch_mode(
            categories=["CEFI"],
            bucket_info={"CEFI": {"bucket": "test-bucket", "path_template": "by_date/day={date}/"}},
            cloud_client=mock_cloud,
        )

        mock_cloud.parallel_scan_buckets.assert_called_once()
        assert len(result) == 1

    @pytest.mark.unit
    def test_empty_categories_no_paths(self):
        from deployment_service.cli.utils.data_status_scanning import scan_buckets_batch_mode

        mock_cloud = MagicMock()
        mock_cloud.parallel_scan_buckets.return_value = {}

        result = scan_buckets_batch_mode(
            categories=[],
            bucket_info={},
            cloud_client=mock_cloud,
        )

        assert result == {}


class TestCheckDataTypesForVenues:
    @pytest.mark.unit
    def test_returns_dict_per_venue(self):
        from deployment_service.cli.utils.data_status_scanning import check_data_types_for_venues

        mock_cloud = MagicMock()
        mock_cloud.check_venue_in_dates_fast.return_value = {
            "2024-01-01": {"exists": True},
        }

        result = check_data_types_for_venues(
            cat="TRADFI",
            cat_venues=["CME", "NYSE"],
            category_valid_dates={"TRADFI": ["2024-01-01"]},
            path_template="raw_data/day={date}/",
            info={"bucket": "test-bucket"},
            cloud_client=mock_cloud,
        )

        assert "CME" in result
        assert "NYSE" in result

    @pytest.mark.unit
    def test_key_value_date_path_parsed(self):
        from deployment_service.cli.utils.data_status_scanning import check_data_types_for_venues

        mock_cloud = MagicMock()
        mock_cloud.check_venue_in_dates_fast.return_value = {}

        check_data_types_for_venues(
            cat="TRADFI",
            cat_venues=["CME"],
            category_valid_dates={"TRADFI": ["2024-01-01"]},
            path_template="raw_data/day={date}/venue={venue}/",
            info={"bucket": "test-bucket"},
            cloud_client=mock_cloud,
        )

        call_args = mock_cloud.check_venue_in_dates_fast.call_args
        # prefix_template should contain day={date}
        assert "day={date}" in call_args.kwargs.get(
            "prefix_template", call_args.args[1] if len(call_args.args) > 1 else ""
        )


# ===========================================================================
# data_status_checkers.py — check_timeframes_detailed (most testable path)
# ===========================================================================


class TestCheckTimeframesDetailed:
    @pytest.mark.unit
    def test_json_output_structure(self, capsys):

        with (
            patch("deployment_service.cli.utils.data_status_checkers.CloudClient") as MockCC,
            patch("deployment_service.cli.utils.data_status_checkers.ConfigLoader"),
            patch(
                "deployment_service.cli.utils.data_status_checkers.SERVICE_GCS_CONFIGS",
                {
                    "market-data-processing-service": {
                        "bucket_template": "market-data-{category_lower}-{project_id}",
                        "expected_timeframes": ["1m", "5m"],
                    }
                },
            ),
            patch("deployment_service.cli.utils.data_status_checkers.DeploymentConfig") as MockDC,
        ):
            mock_dc_instance = MagicMock()
            mock_dc_instance.gcp_project_id = "test-project"
            MockDC.return_value = mock_dc_instance

            mock_cc_instance = MagicMock()
            mock_cc_instance.check_prefix_exists.return_value = True
            MockCC.return_value = mock_cc_instance

            from deployment_service.cli.utils.data_status_checkers import (
                check_timeframes_detailed,
            )

            start = datetime(2024, 1, 1)
            end = datetime(2024, 1, 2)

            check_timeframes_detailed(
                start_date=start,
                end_date=end,
                category=("CEFI",),
                venue=(),
                config_dir="/fake/configs",
                output="json",
            )

        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["service"] == "market-data-processing-service"
        assert "categories" in data
        assert "overall" in data

    @pytest.mark.unit
    def test_non_tradfi_shows_warning(self, capsys):
        with (
            patch("deployment_service.cli.utils.data_status_checkers.CloudClient"),
            patch("deployment_service.cli.utils.data_status_checkers.ConfigLoader"),
            patch(
                "deployment_service.cli.utils.data_status_checkers.SERVICE_GCS_CONFIGS",
                {"market-tick-data-handler": {"bucket_template": "bucket-{category_lower}"}},
            ),
            patch("deployment_service.cli.utils.data_status_checkers.DeploymentConfig") as MockDC,
        ):
            mock_dc = MagicMock()
            mock_dc.gcp_project_id = "test-project"
            MockDC.return_value = mock_dc

            from deployment_service.cli.utils.data_status_checkers import (
                check_data_types_detailed,
            )

            check_data_types_detailed(
                start_date=datetime(2024, 1, 1),
                end_date=datetime(2024, 1, 2),
                category=("CEFI",),  # Not TRADFI
                venue=(),
                config_dir="/fake/configs",
                output="tree",
            )

        captured = capsys.readouterr()
        assert "TRADFI" in captured.out


class TestCheckFeatureGroupsDetailed:
    @pytest.mark.unit
    def test_calendar_service_uses_hardcoded_groups(self, capsys):
        with (
            patch("deployment_service.cli.utils.data_status_checkers.CloudClient") as MockCC,
            patch("deployment_service.cli.utils.data_status_checkers.ConfigLoader") as MockCL,
            patch(
                "deployment_service.cli.utils.data_status_checkers.SERVICE_GCS_CONFIGS",
                {
                    "features-calendar-service": {
                        "bucket_template": "features-calendar-{project_id}",
                    }
                },
            ),
            patch("deployment_service.cli.utils.data_status_checkers.DeploymentConfig") as MockDC,
        ):
            mock_dc = MagicMock()
            mock_dc.gcp_project_id = "test-project"
            MockDC.return_value = mock_dc

            mock_loader = MagicMock()
            mock_loader.load_service_config.return_value = {
                "dimensions": [{"name": "category", "type": "fixed", "values": ["ALL"]}]
            }
            MockCL.return_value = mock_loader

            mock_cc = MagicMock()
            mock_cc.check_prefix_exists.return_value = True
            MockCC.return_value = mock_cc

            from deployment_service.cli.utils.data_status_checkers import (
                check_feature_groups_detailed,
            )

            check_feature_groups_detailed(
                service="features-calendar-service",
                start_date=datetime(2024, 1, 1),
                end_date=datetime(2024, 1, 2),
                category=("ALL",),
                config_dir="/fake/configs",
                output="json",
            )

        captured = capsys.readouterr()
        data = json.loads(captured.out)
        # Should have the three hardcoded groups
        assert "temporal" in data["expected_feature_groups"]
        assert "scheduled_events" in data["expected_feature_groups"]

    @pytest.mark.unit
    def test_no_feature_groups_returns_early(self, capsys):
        with (
            patch("deployment_service.cli.utils.data_status_checkers.CloudClient"),
            patch("deployment_service.cli.utils.data_status_checkers.ConfigLoader") as MockCL,
            patch("deployment_service.cli.utils.data_status_checkers.SERVICE_GCS_CONFIGS", {}),
            patch("deployment_service.cli.utils.data_status_checkers.DeploymentConfig"),
        ):
            mock_loader = MagicMock()
            mock_loader.load_service_config.return_value = {"dimensions": []}
            MockCL.return_value = mock_loader

            from deployment_service.cli.utils.data_status_checkers import (
                check_feature_groups_detailed,
            )

            check_feature_groups_detailed(
                service="unknown-service",
                start_date=datetime(2024, 1, 1),
                end_date=datetime(2024, 1, 2),
                category=(),
                config_dir="/fake/configs",
                output="tree",
            )

        captured = capsys.readouterr()
        assert "No feature_group" in captured.out


# ===========================================================================
# data_status_display_fixed.py
# ===========================================================================


class TestDisplayFixedServiceStatus:
    @pytest.mark.unit
    def test_no_gcs_config_returns_early(self, capsys):
        with (
            patch("deployment_service.cli.utils.data_status_display_fixed.ConfigLoader") as MockCL,
            patch("deployment_service.cli.utils.data_status_display_fixed.CloudClient"),
            patch("deployment_service.cli.utils.data_status_display_fixed.SERVICE_GCS_CONFIGS", {}),
            patch(
                "deployment_service.cli.utils.data_status_display_fixed.DeploymentConfig"
            ) as MockDC,
        ):
            MockDC.return_value = MagicMock(gcp_project_id="test-project")
            mock_loader = MagicMock()
            mock_loader.load_service_config.return_value = {"dimensions": []}
            mock_loader.load_venues_config.return_value = {}
            mock_loader.get_category_start_date.return_value = None
            MockCL.return_value = mock_loader

            from deployment_service.cli.utils.data_status_display_fixed import (
                display_fixed_service_status,
            )

            display_fixed_service_status(
                service="unknown-service",
                start_date=datetime(2024, 1, 1),
                end_date=datetime(2024, 1, 2),
                category=(),
                venue=(),
                output="tree",
                show_timestamps=False,
                show_missing=False,
                config_dir="/fake/configs",
            )

        captured = capsys.readouterr()
        assert "No GCS config" in captured.out

    @pytest.mark.unit
    def test_summary_output_invoked(self, capsys):
        with (
            patch("deployment_service.cli.utils.data_status_display_fixed.ConfigLoader") as MockCL,
            patch("deployment_service.cli.utils.data_status_display_fixed.CloudClient") as MockCC,
            patch(
                "deployment_service.cli.utils.data_status_display_fixed.SERVICE_GCS_CONFIGS",
                {
                    "features-calendar-service": {
                        "bucket_template": "features-calendar-{project_id}",
                        "path_template": "by_date/day={date}/",
                    }
                },
            ),
            patch(
                "deployment_service.cli.utils.data_status_display_fixed.DeploymentConfig"
            ) as MockDC,
            patch(
                "deployment_service.cli.utils.data_status_display_fixed.scan_buckets_batch_mode"
            ) as mock_scan,
            patch(
                "deployment_service.cli.utils.data_status_display_fixed.process_batch_results"
            ) as mock_proc,
        ):
            MockDC.return_value = MagicMock(gcp_project_id="test-project")

            mock_loader = MagicMock()
            mock_loader.load_service_config.return_value = {
                "dimensions": [{"name": "category", "type": "fixed", "values": ["CEFI"]}]
            }
            mock_loader.load_venues_config.return_value = {}
            mock_loader.get_category_start_date.return_value = None
            MockCL.return_value = mock_loader

            mock_cc_instance = MagicMock()
            MockCC.return_value = mock_cc_instance

            mock_scan.return_value = {}
            mock_proc.return_value = (3, 4, 0)

            from deployment_service.cli.utils.data_status_display_fixed import (
                display_fixed_service_status,
            )

            display_fixed_service_status(
                service="features-calendar-service",
                start_date=datetime(2024, 1, 1),
                end_date=datetime(2024, 1, 4),
                category=("CEFI",),
                venue=(),
                output="summary",
                show_timestamps=False,
                show_missing=False,
                config_dir="/fake/configs",
                fast=False,
            )

        captured = capsys.readouterr()
        assert "75.0%" in captured.out or "Overall" in captured.out


# ===========================================================================
# data_status_display_dynamic.py
# ===========================================================================


class TestDisplayDynamicServiceStatus:
    @pytest.mark.unit
    def test_no_gcs_dynamic_dim_returns_early(self, capsys):
        with (
            patch(
                "deployment_service.cli.utils.data_status_display_dynamic.ConfigLoader"
            ) as MockCL,
            patch("deployment_service.cli.utils.data_status_display_dynamic.CloudClient"),
            patch(
                "deployment_service.cli.utils.data_status_display_dynamic.DeploymentConfig"
            ) as MockDC,
        ):
            MockDC.return_value = MagicMock(gcp_project_id="test-project")
            mock_loader = MagicMock()
            mock_loader.load_service_config.return_value = {
                "dimensions": [{"name": "category", "type": "fixed", "values": ["CEFI"]}]
            }
            MockCL.return_value = mock_loader

            from deployment_service.cli.utils.data_status_display_dynamic import (
                display_dynamic_service_status,
            )

            display_dynamic_service_status(
                service="strategy-service",
                start_date=datetime(2024, 1, 1),
                end_date=datetime(2024, 1, 2),
                category=(),
                output="tree",
                config_dir="/fake/configs",
            )

        captured = capsys.readouterr()
        assert "No GCS dynamic dimension" in captured.out

    @pytest.mark.unit
    def test_execution_service_scans_results(self, capsys):
        with (
            patch(
                "deployment_service.cli.utils.data_status_display_dynamic.ConfigLoader"
            ) as MockCL,
            patch("deployment_service.cli.utils.data_status_display_dynamic.CloudClient") as MockCC,
            patch(
                "deployment_service.cli.utils.data_status_display_dynamic.DeploymentConfig"
            ) as MockDC,
        ):
            MockDC.return_value = MagicMock(gcp_project_id="test-project")

            mock_loader = MagicMock()
            mock_loader.load_service_config.return_value = {
                "dimensions": [
                    {
                        "name": "config",
                        "type": "gcs_dynamic",
                        "source_bucket": "exec-configs-{domain}",
                        "gcs_prefix": "grid_configs/",
                    },
                    {"name": "domain", "type": "fixed", "values": ["cefi"]},
                ]
            }
            MockCL.return_value = mock_loader

            mock_cc_instance = MagicMock()
            mock_config_index = MagicMock()
            mock_config_stats = MagicMock()
            mock_config_stats.file_count = 5
            mock_config_stats.oldest_file_time = None
            mock_config_stats.newest_update_time = None
            mock_config_index.get_stats.return_value = mock_config_stats

            mock_results_index = MagicMock()
            mock_results_stats = MagicMock()
            mock_results_stats.file_count = 3
            mock_results_index.get_stats.return_value = mock_results_stats

            # First call = config scan, second call = results scan
            mock_cc_instance.parallel_scan_buckets.side_effect = [
                {"gs://exec-configs-cefi/grid_configs/": mock_config_index},
                {"gs://exec-configs-cefi/results/": mock_results_index},
            ]
            MockCC.return_value = mock_cc_instance

            from deployment_service.cli.utils.data_status_display_dynamic import (
                display_dynamic_service_status,
            )

            display_dynamic_service_status(
                service="execution-service",
                start_date=datetime(2024, 1, 1),
                end_date=datetime(2024, 1, 2),
                category=("cefi",),
                output="tree",
                config_dir="/fake/configs",
            )

        captured = capsys.readouterr()
        assert "execution-service" in captured.out or "Configs" in captured.out


# ===========================================================================
# data_status_venue_utils.py
# ===========================================================================


class TestCheckInstrumentsVenueCoverage:
    @pytest.mark.unit
    def test_runs_with_mocked_io(self, capsys):
        """Smoke test: entire function runs without real GCS calls."""
        with (
            patch(
                "deployment_service.cli.utils.data_status_venue_utils.DeploymentConfig"
            ) as MockDC,
            patch("deployment_service.cli.utils.data_status_venue_utils.ConfigLoader") as MockCL,
            patch("deployment_service.cli.utils.data_status_venue_utils.gcsfs.GCSFileSystem"),
            patch("deployment_service.cli.utils.data_status_venue_utils.pq.read_table"),
            patch(
                "deployment_service.cli.utils.data_status_venue_utils.ThreadPoolExecutor"
            ) as MockTPE,
        ):
            MockDC.return_value = MagicMock(gcp_project_id="test-project")

            mock_loader = MagicMock()
            mock_loader.load_expected_start_dates.return_value = {
                "instruments-service": {
                    "CEFI": {
                        "category_start": "2024-01-01",
                        "venues": {"BINANCE": "2024-01-01"},
                    }
                }
            }
            MockCL.return_value = mock_loader

            # Make ThreadPoolExecutor a context manager that yields itself
            mock_executor = MagicMock()
            MockTPE.return_value.__enter__ = MagicMock(return_value=mock_executor)
            MockTPE.return_value.__exit__ = MagicMock(return_value=False)

            # Simulate one future
            from concurrent.futures import Future

            future: Future[object] = Future()
            future.set_result(
                {
                    "date": "2024-01-01",
                    "cat": "CEFI",
                    "found_venues": {"BINANCE"},
                    "error": None,
                }
            )
            mock_executor.submit.return_value = future

            # as_completed needs to be patched too
            with patch(
                "deployment_service.cli.utils.data_status_venue_utils.as_completed",
                return_value=iter([future]),
            ):
                from deployment_service.cli.utils.data_status_venue_utils import (
                    check_instruments_venue_coverage,
                )

                check_instruments_venue_coverage(
                    start_date=datetime(2024, 1, 1),
                    end_date=datetime(2024, 1, 1),
                    category=("CEFI",),
                    output="tree",
                    config_dir="/fake/configs",
                )

        captured = capsys.readouterr()
        # Should get at least a header
        assert "instruments-service" in captured.out or "CEFI" in captured.out
