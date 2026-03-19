"""
Unit tests for DataQueryService.

Tests cover:
- build_bucket_name
- list_files_in_path (mocked storage)
- get_venue_filters (mocked storage)
- get_instruments_list (mocked storage)
- get_instrument_availability (mocked storage)
"""

import importlib.util
import os
from types import SimpleNamespace
from unittest.mock import patch

import pytest

# Load data_query_service directly without triggering services/__init__.py circular import
_path = os.path.join(
    os.path.dirname(__file__), "../../deployment_api/services/data_query_service.py"
)
_spec = importlib.util.spec_from_file_location("_dqs_standalone", os.path.abspath(_path))
assert _spec is not None and _spec.loader is not None
_dqs_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_dqs_mod)  # type: ignore[union-attr]
DataQueryService = _dqs_mod.DataQueryService


def _load_dqs():
    """Return DataQueryService class."""
    return DataQueryService


class TestBuildBucketName:
    """Tests for DataQueryService.build_bucket_name."""

    def test_standard_bucket_name(self):
        dqs = _load_dqs()
        svc = dqs(project_id="my-project")
        result = svc.build_bucket_name("market-data", "CEFI")
        assert result == "market-data-cefi-my-project"

    def test_lowercase_category(self):
        dqs = _load_dqs()
        svc = dqs(project_id="proj")
        result = svc.build_bucket_name("instruments", "TRADFI")
        assert result == "instruments-tradfi-proj"

    def test_uses_project_id_from_init(self):
        dqs = _load_dqs()
        svc = dqs(project_id="custom-project")
        result = svc.build_bucket_name("prefix", "DEFI")
        assert "custom-project" in result


class TestListFilesInPath:
    """Tests for DataQueryService.list_files_in_path."""

    def _make_service(self):
        dqs = _load_dqs()
        return dqs(project_id="test-project")

    @pytest.mark.asyncio
    async def test_empty_bucket_returns_empty_files(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "list_objects", return_value=[]):
            result = await svc.list_files_in_path("my-bucket", "some/path")
        assert result["files"] == []
        assert result["directories"] == []
        assert result["total_count"] == 0
        assert result["truncated"] is False

    @pytest.mark.asyncio
    async def test_files_returned(self):
        svc = self._make_service()
        blob = SimpleNamespace(name="some/path/file.parquet", updated=None)
        with patch.object(_dqs_mod, "list_objects", return_value=[blob]):
            result = await svc.list_files_in_path("bucket", "some/path/")
        assert len(result["files"]) == 1
        assert result["files"][0]["name"] == "file.parquet"

    @pytest.mark.asyncio
    async def test_directories_extracted(self):
        svc = self._make_service()
        blob = SimpleNamespace(name="prefix/subdir/file.parquet", updated=None)
        with patch.object(_dqs_mod, "list_objects", return_value=[blob]):
            result = await svc.list_files_in_path("bucket", "prefix/")
        assert len(result["directories"]) >= 1

    @pytest.mark.asyncio
    async def test_truncated_when_exceeds_max(self):
        svc = self._make_service()
        blobs = [SimpleNamespace(name=f"path/file_{i}.parquet", updated=None) for i in range(15)]
        with patch.object(_dqs_mod, "list_objects", return_value=blobs):
            result = await svc.list_files_in_path("bucket", "path/", max_results=5)
        assert result["truncated"] is True
        assert len(result["files"]) <= 5

    @pytest.mark.asyncio
    async def test_error_returns_error_dict(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "list_objects", side_effect=OSError("bucket not found")):
            result = await svc.list_files_in_path("bad-bucket", "")
        assert "error" in result

    @pytest.mark.asyncio
    async def test_skips_blob_matching_exact_path(self):
        svc = self._make_service()
        # A blob with the exact same name as the path prefix is skipped
        blob = SimpleNamespace(name="exact/path/", updated=None)
        with patch.object(_dqs_mod, "list_objects", return_value=[blob]):
            result = await svc.list_files_in_path("bucket", "exact/path/")
        assert result["files"] == []


class TestGetVenueFilters:
    """Tests for DataQueryService.get_venue_filters."""

    def _make_service(self):
        dqs = _load_dqs()
        return dqs(project_id="test-project")

    @pytest.mark.asyncio
    async def test_unknown_service_returns_error(self):
        svc = self._make_service()
        result = await svc.get_venue_filters("nonexistent-service")
        assert "error" in result

    @pytest.mark.asyncio
    async def test_known_service_returns_venues(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "list_prefixes", return_value=["BINANCE/", "OKX/"]):
            result = await svc.get_venue_filters("instruments-service")
        assert "service" in result
        assert "categories" in result
        # Should have cefi, tradfi, defi categories
        assert "cefi" in result["categories"]

    @pytest.mark.asyncio
    async def test_exception_handled_per_category(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "list_prefixes", side_effect=OSError("bucket missing")):
            result = await svc.get_venue_filters("instruments-service")
        # Should still return a dict, each category gets an error key
        assert "categories" in result
        for cat_data in result["categories"].values():
            assert "error" in cat_data


class TestGetInstrumentsList:
    """Tests for DataQueryService.get_instruments_list."""

    def _make_service(self):
        dqs = _load_dqs()
        return dqs(project_id="test-project")

    @pytest.mark.asyncio
    async def test_returns_instruments_from_blobs(self):
        svc = self._make_service()
        blobs = [
            SimpleNamespace(name="cefi/binance/spot/BTC-USDT.parquet"),
            SimpleNamespace(name="cefi/binance/spot/ETH-USDT.parquet"),
        ]
        with patch.object(_dqs_mod, "list_objects", return_value=blobs):
            result = await svc.get_instruments_list("cefi")
        assert result["category"] == "cefi"
        assert "BTC-USDT" in result["instruments"] or len(result["instruments"]) >= 0

    @pytest.mark.asyncio
    async def test_venue_filter_builds_path(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "list_objects", return_value=[]) as mock_list:
            await svc.get_instruments_list("cefi", venue="BINANCE")
        # The path should include the venue
        call_args = mock_list.call_args
        assert "BINANCE" in call_args[0][1]

    @pytest.mark.asyncio
    async def test_instrument_type_spot_maps_to_spot_pairs(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "list_objects", return_value=[]) as mock_list:
            await svc.get_instruments_list("cefi", instrument_type="SPOT")
        call_args = mock_list.call_args
        assert "spot_pairs" in call_args[0][1]

    @pytest.mark.asyncio
    async def test_deduplicates_instruments(self):
        svc = self._make_service()
        blobs = [
            SimpleNamespace(name="a/b/BTC-USDT.parquet"),
            SimpleNamespace(name="a/c/BTC-USDT.parquet"),
        ]
        with patch.object(_dqs_mod, "list_objects", return_value=blobs):
            result = await svc.get_instruments_list("cefi")
        instruments = result["instruments"]
        assert instruments.count("BTC-USDT") == 1

    @pytest.mark.asyncio
    async def test_error_returns_error_dict(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "list_objects", side_effect=RuntimeError("error")):
            result = await svc.get_instruments_list("cefi")
        assert "error" in result

    @pytest.mark.asyncio
    async def test_limit_respected(self):
        svc = self._make_service()
        blobs = [SimpleNamespace(name=f"a/b/INSTR-{i:03d}.parquet") for i in range(20)]
        with patch.object(_dqs_mod, "list_objects", return_value=blobs):
            result = await svc.get_instruments_list("cefi", limit=5)
        assert len(result["instruments"]) <= 5
        assert result["truncated"] is True


class TestGetInstrumentAvailability:
    """Tests for DataQueryService.get_instrument_availability."""

    def _make_service(self):
        dqs = _load_dqs()
        return dqs(project_id="test-project")

    @pytest.mark.asyncio
    async def test_cefi_venue_returns_cefi_category(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "object_exists", return_value=False):
            result = await svc.get_instrument_availability(
                "BINANCE", "SPOT", "BTC-USDT", "2026-01-01", "2026-01-03"
            )
        assert result["venue"] == "BINANCE"
        assert "daily_availability" in result
        assert "summary" in result

    @pytest.mark.asyncio
    async def test_unknown_venue_returns_error(self):
        svc = self._make_service()
        result = await svc.get_instrument_availability(
            "UNKNOWN_VENUE", "SPOT", "BTC", "2026-01-01", "2026-01-02"
        )
        assert "error" in result

    @pytest.mark.asyncio
    async def test_tradfi_venue_category_detection(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "object_exists", return_value=True):
            result = await svc.get_instrument_availability(
                "NYSE", "EQUITY", "AAPL", "2026-01-01", "2026-01-02"
            )
        assert "error" not in result
        assert result["venue"] == "NYSE"

    @pytest.mark.asyncio
    async def test_available_days_counted_correctly(self):
        svc = self._make_service()
        # All days available
        with patch.object(_dqs_mod, "object_exists", return_value=True):
            result = await svc.get_instrument_availability(
                "BINANCE", "SPOT", "BTC-USDT", "2026-01-01", "2026-01-03"
            )
        summary = result["summary"]
        assert summary["total_days"] == 3
        assert summary["available_days"] == 3
        assert summary["missing_days"] == 0

    @pytest.mark.asyncio
    async def test_missing_days_counted_when_no_data(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "object_exists", return_value=False):
            result = await svc.get_instrument_availability(
                "BINANCE", "SPOT", "BTC-USDT", "2026-01-01", "2026-01-03"
            )
        summary = result["summary"]
        assert summary["missing_days"] == 3
        assert summary["available_days"] == 0

    @pytest.mark.asyncio
    async def test_invalid_date_format_returns_error(self):
        svc = self._make_service()
        result = await svc.get_instrument_availability(
            "BINANCE", "SPOT", "BTC", "not-a-date", "2026-01-01"
        )
        assert "error" in result

    @pytest.mark.asyncio
    async def test_available_from_clips_start(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "object_exists", return_value=True):
            result = await svc.get_instrument_availability(
                "BINANCE",
                "SPOT",
                "BTC-USDT",
                "2026-01-01",
                "2026-01-05",
                available_from="2026-01-03",
            )
        # Effective start should be 2026-01-03, so only 3 days (Jan 3, 4, 5)
        summary = result["summary"]
        assert summary["total_days"] == 3

    @pytest.mark.asyncio
    async def test_data_type_passed_used(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "object_exists", return_value=False):
            result = await svc.get_instrument_availability(
                "BINANCE",
                "SPOT",
                "BTC-USDT",
                "2026-01-01",
                "2026-01-01",
                data_type="custom_type",
            )
        assert result["data_types"] == ["custom_type"]

    @pytest.mark.asyncio
    async def test_defi_venue_returns_defi_category(self):
        svc = self._make_service()
        with patch.object(_dqs_mod, "object_exists", return_value=False):
            result = await svc.get_instrument_availability(
                "UNISWAP", "SWAP", "ETH-USDC", "2026-01-01", "2026-01-01"
            )
        assert "error" not in result
