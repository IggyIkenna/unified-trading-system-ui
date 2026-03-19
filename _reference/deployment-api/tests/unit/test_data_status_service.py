"""
Unit tests for data_status_service module.

Tests cover pure methods: build_bucket_name, _calculate_completion_rate,
run_data_status_cli, calculate_missing_shards, get_last_updated_info,
validate_data_completeness.
"""

import importlib.util
import json
import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Load directly to avoid circular import via services/__init__.py
_path = os.path.join(
    os.path.dirname(__file__), "../../deployment_api/services/data_status_service.py"
)
_spec = importlib.util.spec_from_file_location("_dss_standalone", os.path.abspath(_path))
assert _spec is not None and _spec.loader is not None
_dss_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_dss_mod)  # type: ignore[union-attr]
DataStatusService = _dss_mod.DataStatusService


def _make_svc(**kwargs) -> DataStatusService:
    return DataStatusService(project_id=kwargs.get("project_id", "test-project"))


def _mock_process(returncode: int = 0, stdout: bytes = b"{}", stderr: bytes = b"") -> MagicMock:
    """Build a mock asyncio Process object."""
    proc = MagicMock()
    proc.returncode = returncode
    proc.communicate = AsyncMock(return_value=(stdout, stderr))
    return proc


class TestBuildBucketName:
    """Tests for DataStatusService.build_bucket_name."""

    def test_format(self):
        svc = DataStatusService(project_id="my-project")
        assert svc.build_bucket_name("instruments", "CEFI") == "instruments-cefi-my-project"

    def test_lowercases_category(self):
        svc = DataStatusService(project_id="proj")
        result = svc.build_bucket_name("market-data", "TRADFI")
        assert "tradfi" in result
        assert "TRADFI" not in result

    def test_project_id_appended(self):
        svc = DataStatusService(project_id="test-123")
        result = svc.build_bucket_name("prefix", "DEFI")
        assert result.endswith("test-123")


class TestCalculateCompletionRate:
    """Tests for DataStatusService._calculate_completion_rate."""

    def setup_method(self):
        self.svc = DataStatusService(project_id="test-proj")

    def test_no_dates_returns_zero(self):
        assert self.svc._calculate_completion_rate({}) == 0.0

    def test_non_list_dates_returns_zero(self):
        assert self.svc._calculate_completion_rate({"dates": "invalid"}) == 0.0

    def test_all_present_returns_100(self):
        data = {
            "dates": [
                {"venues": [{"status": "present"}, {"status": "present"}]},
                {"venues": [{"status": "present"}]},
            ]
        }
        assert self.svc._calculate_completion_rate(data) == 100.0

    def test_all_missing_returns_zero(self):
        data = {
            "dates": [
                {"venues": [{"status": "missing"}, {"status": "missing"}]},
            ]
        }
        assert self.svc._calculate_completion_rate(data) == 0.0

    def test_partial_completion(self):
        data = {
            "dates": [
                {"venues": [{"status": "present"}, {"status": "missing"}]},
            ]
        }
        assert self.svc._calculate_completion_rate(data) == 50.0

    def test_empty_dates_returns_zero(self):
        data = {"dates": []}
        assert self.svc._calculate_completion_rate(data) == 0.0

    def test_non_dict_venue_entries_skipped(self):
        data = {
            "dates": [
                {"venues": [None, "string", {"status": "present"}]},
            ]
        }
        # Only the dict entry counts
        result = self.svc._calculate_completion_rate(data)
        assert result == 100.0

    def test_non_list_venues_skipped(self):
        data = {
            "dates": [
                {"venues": None},
                {"venues": [{"status": "present"}]},
            ]
        }
        result = self.svc._calculate_completion_rate(data)
        assert result == 100.0


class TestRunDataStatusCli:
    """Tests for DataStatusService.run_data_status_cli."""

    @pytest.mark.asyncio
    async def test_returns_json_on_success(self):
        svc = _make_svc()
        expected = {"completion": 85.0, "categories": {}}
        proc = _mock_process(stdout=json.dumps(expected).encode())

        with patch("asyncio.create_subprocess_exec", new=AsyncMock(return_value=proc)):
            result = await svc.run_data_status_cli("svc-a", "2024-01-01", "2024-01-31")

        assert result == expected

    @pytest.mark.asyncio
    async def test_returns_error_on_nonzero_returncode(self):
        svc = _make_svc()
        proc = _mock_process(returncode=1, stderr=b"command failed")

        with patch("asyncio.create_subprocess_exec", new=AsyncMock(return_value=proc)):
            result = await svc.run_data_status_cli("svc-a", "2024-01-01", "2024-01-31")

        assert "error" in result
        assert "1" in result["error"]

    @pytest.mark.asyncio
    async def test_returns_error_on_invalid_json(self):
        svc = _make_svc()
        proc = _mock_process(stdout=b"not-json")

        with patch("asyncio.create_subprocess_exec", new=AsyncMock(return_value=proc)):
            result = await svc.run_data_status_cli("svc-a", "2024-01-01", "2024-01-31")

        assert "error" in result

    @pytest.mark.asyncio
    async def test_returns_error_on_subprocess_exception(self):
        svc = _make_svc()

        async def _raise(*a, **kw):
            raise OSError("spawn failed")

        with patch("asyncio.create_subprocess_exec", new=_raise):
            result = await svc.run_data_status_cli("svc-a", "2024-01-01", "2024-01-31")

        assert "error" in result

    @pytest.mark.asyncio
    async def test_includes_category_filters_in_cmd(self):
        svc = _make_svc()
        captured: dict[str, object] = {}

        async def _capture(*args, **kwargs):
            captured["args"] = list(args)
            return _mock_process()

        with patch("asyncio.create_subprocess_exec", new=_capture):
            await svc.run_data_status_cli(
                "svc-a", "2024-01-01", "2024-01-31", categories=["CEFI", "DEFI"]
            )

        assert "-c" in captured["args"]
        assert "CEFI" in captured["args"]
        assert "DEFI" in captured["args"]

    @pytest.mark.asyncio
    async def test_includes_venue_filters_in_cmd(self):
        svc = _make_svc()
        captured: dict[str, object] = {}

        async def _capture(*args, **kwargs):
            captured["args"] = list(args)
            return _mock_process()

        with patch("asyncio.create_subprocess_exec", new=_capture):
            await svc.run_data_status_cli(
                "svc-a", "2024-01-01", "2024-01-31", venues=["BINANCE", "OKX"]
            )

        assert "-v" in captured["args"]
        assert "BINANCE" in captured["args"]

    @pytest.mark.asyncio
    async def test_includes_show_missing_flag(self):
        svc = _make_svc()
        captured: dict[str, object] = {}

        async def _capture(*args, **kwargs):
            captured["args"] = list(args)
            return _mock_process()

        with patch("asyncio.create_subprocess_exec", new=_capture):
            await svc.run_data_status_cli("svc-a", "2024-01-01", "2024-01-31", show_missing=True)

        assert "--show-missing" in captured["args"]

    @pytest.mark.asyncio
    async def test_includes_check_venues_flag(self):
        svc = _make_svc()
        captured: dict[str, object] = {}

        async def _capture(*args, **kwargs):
            captured["args"] = list(args)
            return _mock_process()

        with patch("asyncio.create_subprocess_exec", new=_capture):
            await svc.run_data_status_cli("svc-a", "2024-01-01", "2024-01-31", check_venues=True)

        assert "--check-venues" in captured["args"]

    @pytest.mark.asyncio
    async def test_adds_fast_flag_for_market_tick_service(self):
        svc = _make_svc()
        captured: dict[str, object] = {}

        async def _capture(*args, **kwargs):
            captured["args"] = list(args)
            return _mock_process()

        with patch("asyncio.create_subprocess_exec", new=_capture):
            await svc.run_data_status_cli("market-tick-data-handler", "2024-01-01", "2024-01-31")

        assert "--fast" in captured["args"]

    @pytest.mark.asyncio
    async def test_adds_fast_flag_for_market_data_processing(self):
        svc = _make_svc()
        captured: dict[str, object] = {}

        async def _capture(*args, **kwargs):
            captured["args"] = list(args)
            return _mock_process()

        with patch("asyncio.create_subprocess_exec", new=_capture):
            await svc.run_data_status_cli(
                "market-data-processing-service", "2024-01-01", "2024-01-31"
            )

        assert "--fast" in captured["args"]

    @pytest.mark.asyncio
    async def test_includes_check_data_types_flag(self):
        svc = _make_svc()
        captured: dict[str, object] = {}

        async def _capture(*args, **kwargs):
            captured["args"] = list(args)
            return _mock_process()

        with patch("asyncio.create_subprocess_exec", new=_capture):
            await svc.run_data_status_cli(
                "svc-a", "2024-01-01", "2024-01-31", check_data_types=True
            )

        assert "--check-data-types" in captured["args"]

    @pytest.mark.asyncio
    async def test_includes_check_feature_groups_flag(self):
        svc = _make_svc()
        captured: dict[str, object] = {}

        async def _capture(*args, **kwargs):
            captured["args"] = list(args)
            return _mock_process()

        with patch("asyncio.create_subprocess_exec", new=_capture):
            await svc.run_data_status_cli(
                "svc-a", "2024-01-01", "2024-01-31", check_feature_groups=True
            )

        assert "--check-feature-groups" in captured["args"]

    @pytest.mark.asyncio
    async def test_includes_check_timeframes_flag(self):
        svc = _make_svc()
        captured: dict[str, object] = {}

        async def _capture(*args, **kwargs):
            captured["args"] = list(args)
            return _mock_process()

        with patch("asyncio.create_subprocess_exec", new=_capture):
            await svc.run_data_status_cli(
                "svc-a", "2024-01-01", "2024-01-31", check_timeframes=True
            )

        assert "--check-timeframes" in captured["args"]


class TestCalculateMissingShards:
    """Tests for DataStatusService.calculate_missing_shards."""

    @pytest.mark.asyncio
    async def test_returns_error_when_cli_fails(self):
        svc = _make_svc()
        with patch.object(
            svc, "run_data_status_cli", new=AsyncMock(return_value={"error": "cli failed"})
        ):
            result = await svc.calculate_missing_shards("svc-a", "2024-01-01", "2024-01-31")
        assert "error" in result

    @pytest.mark.asyncio
    async def test_returns_missing_analysis_structure(self):
        svc = _make_svc()
        cli_result = {
            "dates": [
                {
                    "date": "2024-01-01",
                    "venues": [
                        {"venue": "BINANCE", "status": "missing", "category": "CEFI"},
                        {"venue": "OKX", "status": "present", "category": "CEFI"},
                    ],
                },
                {
                    "date": "2024-01-02",
                    "venues": [
                        {"venue": "BINANCE", "status": "present", "category": "CEFI"},
                    ],
                },
            ]
        }

        with patch.object(svc, "run_data_status_cli", new=AsyncMock(return_value=cli_result)):
            result = await svc.calculate_missing_shards("svc-a", "2024-01-01", "2024-01-02")

        assert result["service"] == "svc-a"
        assert "total_missing" in result
        assert result["total_missing"] == 1
        assert "BINANCE" in result["missing_by_venue"]
        assert "summary" in result

    @pytest.mark.asyncio
    async def test_handles_empty_dates(self):
        svc = _make_svc()
        cli_result = {"dates": []}

        with patch.object(svc, "run_data_status_cli", new=AsyncMock(return_value=cli_result)):
            result = await svc.calculate_missing_shards("svc-a", "2024-01-01", "2024-01-31")

        assert result["total_missing"] == 0

    @pytest.mark.asyncio
    async def test_handles_no_dates_key(self):
        svc = _make_svc()
        cli_result = {"categories": {}}

        with patch.object(svc, "run_data_status_cli", new=AsyncMock(return_value=cli_result)):
            result = await svc.calculate_missing_shards("svc-a", "2024-01-01", "2024-01-31")

        assert "total_missing" in result
        assert result["total_missing"] == 0

    @pytest.mark.asyncio
    async def test_counts_by_category(self):
        svc = _make_svc()
        cli_result = {
            "dates": [
                {
                    "date": "2024-01-01",
                    "venues": [
                        {"venue": "BINANCE", "status": "missing", "category": "CEFI"},
                        {"venue": "UNI", "status": "missing", "category": "DEFI"},
                    ],
                }
            ]
        }

        with patch.object(svc, "run_data_status_cli", new=AsyncMock(return_value=cli_result)):
            result = await svc.calculate_missing_shards("svc-a", "2024-01-01", "2024-01-01")

        assert result["missing_by_category"]["CEFI"] == 1
        assert result["missing_by_category"]["DEFI"] == 1

    @pytest.mark.asyncio
    async def test_skips_non_dict_venue_entries(self):
        svc = _make_svc()
        cli_result = {
            "dates": [
                {
                    "date": "2024-01-01",
                    "venues": [
                        "not-a-dict",
                        {"venue": "BINANCE", "status": "missing", "category": "CEFI"},
                    ],
                }
            ]
        }

        with patch.object(svc, "run_data_status_cli", new=AsyncMock(return_value=cli_result)):
            result = await svc.calculate_missing_shards("svc-a", "2024-01-01", "2024-01-01")

        assert result["total_missing"] == 1

    @pytest.mark.asyncio
    async def test_passes_mode_to_cli(self):
        svc = _make_svc()
        cli_mock = AsyncMock(return_value={"dates": []})

        with patch.object(svc, "run_data_status_cli", new=cli_mock):
            await svc.calculate_missing_shards("svc-a", "2024-01-01", "2024-01-31", mode="live")

        cli_mock.assert_called_once()
        _, kwargs = cli_mock.call_args
        assert kwargs.get("mode") == "live" or "live" in str(cli_mock.call_args)


class TestGetLastUpdatedInfo:
    """Tests for DataStatusService.get_last_updated_info."""

    @pytest.mark.asyncio
    async def test_returns_error_for_unknown_service(self):
        svc = _make_svc()
        result = await svc.get_last_updated_info("unknown-service")
        assert "error" in result

    @pytest.mark.asyncio
    async def test_returns_dict_for_known_service(self):
        svc = _make_svc()
        mock_obj = MagicMock()
        mock_obj.name = "some/path/file.parquet"

        with patch.object(_dss_mod, "list_objects", return_value=[mock_obj, mock_obj]):
            result = await svc.get_last_updated_info("market-tick-data-handler")

        assert "service" in result
        assert result["service"] == "market-tick-data-handler"
        assert "categories" in result

    @pytest.mark.asyncio
    async def test_returns_empty_category_when_no_objects(self):
        svc = _make_svc()

        with patch.object(_dss_mod, "list_objects", return_value=[]):
            result = await svc.get_last_updated_info(
                "market-tick-data-handler", categories=["cefi"]
            )

        assert result["categories"]["cefi"]["status"] == "empty"

    @pytest.mark.asyncio
    async def test_handles_list_objects_error(self):
        svc = _make_svc()

        with patch.object(_dss_mod, "list_objects", side_effect=OSError("bucket not found")):
            result = await svc.get_last_updated_info("instruments-service", categories=["cefi"])

        assert result["categories"]["cefi"]["status"] == "error"

    @pytest.mark.asyncio
    async def test_uses_default_categories_when_none_given(self):
        svc = _make_svc()

        with patch.object(_dss_mod, "list_objects", return_value=[]):
            result = await svc.get_last_updated_info("instruments-service")

        # Should have checked cefi, tradfi, defi
        assert "cefi" in result["categories"]
        assert "tradfi" in result["categories"]
        assert "defi" in result["categories"]


class TestValidateDataCompleteness:
    """Tests for DataStatusService.validate_data_completeness."""

    @pytest.mark.asyncio
    async def test_returns_error_when_cli_fails(self):
        svc = _make_svc()
        with patch.object(
            svc, "run_data_status_cli", new=AsyncMock(return_value={"error": "failed"})
        ):
            result = await svc.validate_data_completeness("svc-a", "2024-01-01")
        assert "error" in result

    @pytest.mark.asyncio
    async def test_returns_validation_structure(self):
        svc = _make_svc()
        cli_result = {
            "dates": [
                {
                    "date": "2024-01-01",
                    "venues": [
                        {"venue": "BINANCE", "status": "present"},
                        {"venue": "OKX", "status": "present"},
                    ],
                }
            ]
        }
        with patch.object(svc, "run_data_status_cli", new=AsyncMock(return_value=cli_result)):
            result = await svc.validate_data_completeness("svc-a", "2024-01-01")

        assert result["service"] == "svc-a"
        assert result["date"] == "2024-01-01"
        assert result["is_complete"] is True
        assert result["total_venues"] == 2
        assert result["completed_venues"] == 2
        assert result["completion_rate"] == 100.0

    @pytest.mark.asyncio
    async def test_reports_missing_venues(self):
        svc = _make_svc()
        cli_result = {
            "dates": [
                {
                    "date": "2024-01-01",
                    "venues": [
                        {"venue": "BINANCE", "status": "missing"},
                        {"venue": "OKX", "status": "present"},
                    ],
                }
            ]
        }
        with patch.object(svc, "run_data_status_cli", new=AsyncMock(return_value=cli_result)):
            result = await svc.validate_data_completeness("svc-a", "2024-01-01")

        assert result["is_complete"] is False
        assert "BINANCE" in result["missing_venues"]

    @pytest.mark.asyncio
    async def test_handles_no_dates_in_result(self):
        svc = _make_svc()
        cli_result = {"categories": {}}
        with patch.object(svc, "run_data_status_cli", new=AsyncMock(return_value=cli_result)):
            result = await svc.validate_data_completeness("svc-a", "2024-01-01")

        assert result["total_venues"] == 0
        assert result["completion_rate"] == 0.0
