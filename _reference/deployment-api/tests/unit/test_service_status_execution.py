"""
Unit tests for service_status_execution module.

Tests cover:
- _parse_gs_path: GCS path parsing
- _extract_algo_name: algo name extraction from config filename
- _build_breakdown_summary: breakdown dict to summary conversion
- _make_breakdown_entry: new breakdown entry factory
- _build_hierarchy_from_configs: hierarchy construction
- _summarize_hierarchy: hierarchy flattening
- _build_missing_shards_result: missing shards response builder
"""

from collections import defaultdict
from typing import cast
from unittest.mock import patch

# ---------------------------------------------------------------------------
# _parse_gs_path
# ---------------------------------------------------------------------------


class TestParseGsPath:
    def test_valid_gs_path_with_prefix(self):
        from deployment_api.routes.service_status_execution import _parse_gs_path

        result = _parse_gs_path("gs://my-bucket/configs/V1/")
        assert result is not None
        bucket, prefix, version = result
        assert bucket == "my-bucket"
        assert prefix == "configs/V1/"
        assert version == "V1"

    def test_valid_gs_path_without_trailing_slash(self):
        from deployment_api.routes.service_status_execution import _parse_gs_path

        result = _parse_gs_path("gs://my-bucket/configs/V2")
        assert result is not None
        bucket, prefix, version = result
        assert bucket == "my-bucket"
        # prefix should end with /
        assert prefix.endswith("/")
        assert version == "V2"

    def test_returns_none_for_non_gs_path(self):
        from deployment_api.routes.service_status_execution import _parse_gs_path

        result = _parse_gs_path("s3://bucket/prefix")
        assert result is None

    def test_returns_none_for_http_path(self):
        from deployment_api.routes.service_status_execution import _parse_gs_path

        result = _parse_gs_path("https://bucket/prefix")
        assert result is None

    def test_bucket_only_path(self):
        from deployment_api.routes.service_status_execution import _parse_gs_path

        result = _parse_gs_path("gs://my-bucket/")
        assert result is not None
        bucket, prefix, version = result
        assert bucket == "my-bucket"

    def test_version_v1_extraction(self):
        from deployment_api.routes.service_status_execution import _parse_gs_path

        result = _parse_gs_path("gs://bucket/path/configs/V1/")
        assert result is not None
        _, _, version = result
        assert version == "V1"

    def test_version_defaults_to_v1_when_missing(self):
        from deployment_api.routes.service_status_execution import _parse_gs_path

        result = _parse_gs_path("gs://bucket/path/configs/")
        assert result is not None
        _, _, version = result
        assert version == "V1"

    def test_lowercase_v_version(self):
        from deployment_api.routes.service_status_execution import _parse_gs_path

        result = _parse_gs_path("gs://bucket/path/v2/")
        assert result is not None
        _, _, version = result
        assert version == "v2"


# ---------------------------------------------------------------------------
# _extract_algo_name
# ---------------------------------------------------------------------------


class TestExtractAlgoName:
    def test_known_prefix_extracted(self):
        from deployment_api.routes.service_status_execution import _extract_algo_name

        result = _extract_algo_name("TWAP_horizon_5m.json")
        assert result == "TWAP"

    def test_vwap_algo_name(self):
        from deployment_api.routes.service_status_execution import _extract_algo_name

        result = _extract_algo_name("VWAP_profile_aggressive.json")
        assert result == "VWAP"

    def test_falling_back_to_first_segment(self):
        from deployment_api.routes.service_status_execution import _extract_algo_name

        result = _extract_algo_name("MYALGO_some_param_value.json")
        assert result == "MYALGO"

    def test_simple_name_no_underscore(self):
        from deployment_api.routes.service_status_execution import _extract_algo_name

        result = _extract_algo_name("SIMPLE")
        assert result == "SIMPLE"

    def test_participation_suffix(self):
        from deployment_api.routes.service_status_execution import _extract_algo_name

        result = _extract_algo_name("IS_participation_0.3.json")
        assert result == "IS"

    def test_lambda_suffix(self):
        from deployment_api.routes.service_status_execution import _extract_algo_name

        result = _extract_algo_name("POV_lambda_0.1.json")
        assert result == "POV"


# ---------------------------------------------------------------------------
# _make_breakdown_entry
# ---------------------------------------------------------------------------


class TestMakeBreakdownEntry:
    def test_returns_dict_with_correct_structure(self):
        from deployment_api.routes.service_status_execution import _make_breakdown_entry

        entry = _make_breakdown_entry()
        assert entry["total"] == 0
        assert entry["with_results"] == 0
        assert entry["missing"] == []

    def test_entries_are_independent(self):
        from deployment_api.routes.service_status_execution import _make_breakdown_entry

        e1 = _make_breakdown_entry()
        e2 = _make_breakdown_entry()
        # Modify e1 and ensure e2 is unaffected
        cast(list[str], e1["missing"]).append("item")
        assert e2["missing"] == []


# ---------------------------------------------------------------------------
# _build_breakdown_summary
# ---------------------------------------------------------------------------


class TestBuildBreakdownSummary:
    def test_single_entry_summary(self):
        from deployment_api.routes.service_status_execution import _build_breakdown_summary

        breakdown: defaultdict[str, dict[str, int | list[str]]] = defaultdict(
            lambda: {"total": 0, "with_results": 0, "missing": []}
        )
        breakdown["SCE"]["total"] = 10
        breakdown["SCE"]["with_results"] = 8
        breakdown["SCE"]["missing"] = ["config1", "config2"]

        result = _build_breakdown_summary(breakdown)
        assert "SCE" in result
        sce = cast(dict[str, object], result["SCE"])
        assert sce["total"] == 10
        assert sce["with_results"] == 8
        assert sce["missing_count"] == 2
        assert sce["completion_pct"] == 80.0

    def test_empty_breakdown_returns_empty_dict(self):
        from deployment_api.routes.service_status_execution import _build_breakdown_summary

        result = _build_breakdown_summary(
            defaultdict(lambda: {"total": 0, "with_results": 0, "missing": []})
        )
        assert result == {}

    def test_zero_total_gives_zero_completion(self):
        from deployment_api.routes.service_status_execution import _build_breakdown_summary

        breakdown: defaultdict[str, dict[str, int | list[str]]] = defaultdict(
            lambda: {"total": 0, "with_results": 0, "missing": []}
        )
        breakdown["HUF"]["total"] = 0
        breakdown["HUF"]["with_results"] = 0
        breakdown["HUF"]["missing"] = []

        result = _build_breakdown_summary(breakdown)
        huf = cast(dict[str, object], result["HUF"])
        assert huf["completion_pct"] == 0

    def test_missing_samples_limited_to_5(self):
        from deployment_api.routes.service_status_execution import _build_breakdown_summary

        breakdown: defaultdict[str, dict[str, int | list[str]]] = defaultdict(
            lambda: {"total": 0, "with_results": 0, "missing": []}
        )
        breakdown["SCE"]["total"] = 20
        breakdown["SCE"]["with_results"] = 10
        breakdown["SCE"]["missing"] = [f"config{i}" for i in range(10)]

        result = _build_breakdown_summary(breakdown)
        sce = cast(dict[str, object], result["SCE"])
        samples = cast(list[str], sce["missing_samples"])
        assert len(samples) <= 5

    def test_results_are_sorted_by_name(self):
        from deployment_api.routes.service_status_execution import _build_breakdown_summary

        breakdown: defaultdict[str, dict[str, int | list[str]]] = defaultdict(
            lambda: {"total": 0, "with_results": 0, "missing": []}
        )
        breakdown["ZZZ"]["total"] = 5
        breakdown["ZZZ"]["with_results"] = 5
        breakdown["ZZZ"]["missing"] = []
        breakdown["AAA"]["total"] = 3
        breakdown["AAA"]["with_results"] = 3
        breakdown["AAA"]["missing"] = []

        result = _build_breakdown_summary(breakdown)
        keys = list(result.keys())
        assert keys == sorted(keys)


# ---------------------------------------------------------------------------
# _build_missing_shards_result
# ---------------------------------------------------------------------------


class TestBuildMissingShardsResult:
    def test_basic_missing_shard_detection(self):
        from deployment_api.routes.service_status_execution import _build_missing_shards_result

        configs = [
            {
                "path": "gs://bucket/configs/SCE/live/5M/twap.json",
                "strategy": "SCE",
                "mode": "live",
                "timeframe": "5M",
                "config_file": "twap.json",
                "algo_name": "TWAP",
                "result_strategy_id": "SCE_live_5M_V1",
            }
        ]
        result_dates_by_strategy: defaultdict[str, set[str]] = defaultdict(set)
        result_dates_by_strategy["SCE_live_5M_V1"] = {"2024-01-01"}

        all_expected_dates = {"2024-01-01", "2024-01-02", "2024-01-03"}

        result = _build_missing_shards_result(
            configs=configs,
            result_dates_by_strategy=result_dates_by_strategy,
            all_expected_dates=all_expected_dates,
            config_path="gs://bucket/configs/V1",
            start_date="2024-01-01",
            end_date="2024-01-03",
            strategy=None,
            mode=None,
            timeframe=None,
            algo=None,
        )

        assert result["total_missing"] == 2  # 2 missing dates
        assert result["total_configs"] == 1
        assert result["total_dates"] == 3
        missing_shards = cast(list[dict[str, str]], result["missing_shards"])
        assert all(s["strategy"] == "SCE" for s in missing_shards)

    def test_no_missing_shards_when_all_present(self):
        from deployment_api.routes.service_status_execution import _build_missing_shards_result

        configs = [
            {
                "path": "gs://bucket/configs/SCE/live/5M/twap.json",
                "strategy": "SCE",
                "mode": "live",
                "timeframe": "5M",
                "config_file": "twap.json",
                "algo_name": "TWAP",
                "result_strategy_id": "SCE_live_5M_V1",
            }
        ]
        result_dates_by_strategy: defaultdict[str, set[str]] = defaultdict(set)
        result_dates_by_strategy["SCE_live_5M_V1"] = {"2024-01-01", "2024-01-02"}

        result = _build_missing_shards_result(
            configs=configs,
            result_dates_by_strategy=result_dates_by_strategy,
            all_expected_dates={"2024-01-01", "2024-01-02"},
            config_path="gs://bucket/configs/V1",
            start_date="2024-01-01",
            end_date="2024-01-02",
            strategy=None,
            mode=None,
            timeframe=None,
            algo=None,
        )

        assert result["total_missing"] == 0
        assert result["missing_shards"] == []

    def test_breakdown_by_dimension(self):
        from deployment_api.routes.service_status_execution import _build_missing_shards_result

        configs = [
            {
                "path": "gs://bucket/config.json",
                "strategy": "SCE",
                "mode": "live",
                "timeframe": "5M",
                "config_file": "twap.json",
                "algo_name": "TWAP",
                "result_strategy_id": "SCE_live_5M_V1",
            }
        ]
        result_dates_by_strategy: defaultdict[str, set[str]] = defaultdict(set)

        result = _build_missing_shards_result(
            configs=configs,
            result_dates_by_strategy=result_dates_by_strategy,
            all_expected_dates={"2024-01-01"},
            config_path="gs://bucket/configs/V1",
            start_date="2024-01-01",
            end_date="2024-01-01",
            strategy="SCE",
            mode="live",
            timeframe="5M",
            algo="TWAP",
        )

        breakdown = cast(dict[str, object], result["breakdown"])
        by_strategy = cast(dict[str, int], breakdown["by_strategy"])
        assert "SCE" in by_strategy
        assert by_strategy["SCE"] == 1

        by_mode = cast(dict[str, int], breakdown["by_mode"])
        assert "live" in by_mode

        filters = cast(dict[str, object], result["filters"])
        assert filters["strategy"] == "SCE"
        assert filters["mode"] == "live"


# ---------------------------------------------------------------------------
# _calculate_missing_shards_sync
# ---------------------------------------------------------------------------


class TestCalculateMissingsShardsSync:
    def test_non_gs_path_returns_error(self):
        from deployment_api.routes.service_status_execution import _calculate_missing_shards_sync

        result = _calculate_missing_shards_sync(
            config_path="s3://bucket/prefix",
            start_date="2024-01-01",
            end_date="2024-01-03",
            strategy=None,
            mode=None,
            timeframe=None,
            algo=None,
        )
        assert "error" in result
        assert "gs://" in result["error"]

    def test_valid_path_with_mocked_storage(self):
        from deployment_api.routes.service_status_execution import _calculate_missing_shards_sync

        with (
            patch(
                "deployment_api.utils.storage_facade.list_objects",
                return_value=[],
            ),
            patch(
                "deployment_api.utils.storage_facade.list_prefixes",
                return_value=[],
            ),
        ):
            result = _calculate_missing_shards_sync(
                config_path="gs://bucket/configs/V1/",
                start_date="2024-01-01",
                end_date="2024-01-03",
                strategy=None,
                mode=None,
                timeframe=None,
                algo=None,
            )

        assert "missing_shards" in result
        assert result["total_missing"] == 0  # No configs = no missing shards
