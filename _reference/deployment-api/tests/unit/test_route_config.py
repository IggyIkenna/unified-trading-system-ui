"""
Unit tests for routes/config.py module.

Tests get_config_loader, get_region_config, validate_region, get_venues,
get_venues_by_category, get_expected_start_dates, get_service_start_dates,
get_dependencies, and get_service_dependencies route handlers.
"""

import asyncio
import importlib
import importlib.util
import sys
import tempfile
from pathlib import Path
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import yaml
from fastapi import HTTPException

# Ensure deployment_service is mocked before importing config routes
sys.modules.setdefault("deployment_service", MagicMock())
_mock_config_loader_cls = MagicMock()
sys.modules.setdefault(
    "deployment_service.config_loader",
    MagicMock(ConfigLoader=_mock_config_loader_cls),
)
# Mock unified_cloud_interface to avoid ServiceMode import from unified_events_interface
sys.modules.setdefault("unified_cloud_interface", MagicMock(AsyncRedisProvider=MagicMock()))

# Mock the routes package so __init__ doesn't fire
if "deployment_api.routes" not in sys.modules:
    _routes_pkg = ModuleType("deployment_api.routes")
    _routes_pkg.__path__ = []  # type: ignore[attr-defined]
    _routes_pkg.__package__ = "deployment_api.routes"
    sys.modules["deployment_api.routes"] = _routes_pkg

# Import routes/config.py directly to bypass __init__
_spec = importlib.util.spec_from_file_location(
    "deployment_api.routes.config",
    str(Path(__file__).parent.parent.parent / "deployment_api" / "routes" / "config.py"),
)
_cfg_routes = importlib.util.module_from_spec(_spec)  # type: ignore[arg-type]
sys.modules["deployment_api.routes.config"] = _cfg_routes
_spec.loader.exec_module(_cfg_routes)  # type: ignore[union-attr]


def _make_request(config_dir=None):
    mock_request = MagicMock()
    mock_request.app.state.config_dir = config_dir or Path("/fake/configs")
    return mock_request


async def _pass_through(key, fetch_fn, ttl=None):
    return await fetch_fn()


# ---------------------------------------------------------------------------
# TestGetConfigLoader
# ---------------------------------------------------------------------------


class TestGetConfigLoader:
    """Tests for get_config_loader helper."""

    def setup_method(self):
        _cfg_routes._config_loader = None

    def test_returns_loader_instance(self):
        mock_request = _make_request()
        loader = _cfg_routes.get_config_loader(mock_request)
        assert loader is not None

    def test_caches_loader_on_second_call(self):
        mock_request = _make_request()
        loader1 = _cfg_routes.get_config_loader(mock_request)
        loader2 = _cfg_routes.get_config_loader(mock_request)
        assert loader1 is loader2


# ---------------------------------------------------------------------------
# TestGetRegionConfig
# ---------------------------------------------------------------------------


class TestGetRegionConfig:
    """Tests for get_region_config endpoint."""

    def test_returns_gcs_region(self):
        result = asyncio.run(_cfg_routes.get_region_config())
        assert "gcs_region" in result
        assert "zones" in result
        assert "enforce_single_region" in result

    def test_zones_contain_region_prefix(self):
        result = asyncio.run(_cfg_routes.get_region_config())
        for zone in result["zones"]:
            assert result["gcs_region"] in zone


# ---------------------------------------------------------------------------
# TestValidateRegion
# ---------------------------------------------------------------------------


class TestValidateRegion:
    """Tests for validate_region endpoint."""

    def test_same_region_no_cross_region(self):
        import deployment_api.settings as _settings

        original = _settings.GCS_REGION
        _settings.GCS_REGION = "asia-northeast1"
        try:
            result = asyncio.run(_cfg_routes.validate_region("asia-northeast1"))
        finally:
            _settings.GCS_REGION = original
        assert result["cross_region"] is False
        assert result["warning"] is None

    def test_different_region_cross_region_true(self):
        import deployment_api.settings as _settings

        original = _settings.GCS_REGION
        _settings.GCS_REGION = "asia-northeast1"
        try:
            result = asyncio.run(_cfg_routes.validate_region("us-central1"))
        finally:
            _settings.GCS_REGION = original
        assert result["cross_region"] is True


# ---------------------------------------------------------------------------
# TestGetVenues
# ---------------------------------------------------------------------------


class TestGetVenues:
    """Tests for get_venues endpoint."""

    def test_returns_venues_config(self):
        mock_loader = MagicMock()
        mock_loader.load_venues_config.return_value = {"categories": {}}
        mock_request = _make_request()
        with patch.object(_cfg_routes, "get_config_loader", return_value=mock_loader):
            result = asyncio.run(_cfg_routes.get_venues(mock_request))
        assert result == {"categories": {}}

    def test_raises_500_on_oserror(self):
        mock_loader = MagicMock()
        mock_loader.load_venues_config.side_effect = OSError("disk error")
        mock_request = _make_request()
        with (
            patch.object(_cfg_routes, "get_config_loader", return_value=mock_loader),
            pytest.raises(HTTPException) as exc,
        ):
            asyncio.run(_cfg_routes.get_venues(mock_request))
        assert exc.value.status_code == 500


# ---------------------------------------------------------------------------
# TestGetVenuesByCategory
# ---------------------------------------------------------------------------


class TestGetVenuesByCategory:
    """Tests for get_venues_by_category endpoint."""

    def test_returns_category_data(self):
        mock_loader = MagicMock()
        mock_loader.load_venues_config.return_value = {
            "categories": {
                "CEFI": {"venues": ["BINANCE"], "data_types": ["ohlcv"]},
            }
        }
        mock_request = _make_request()
        with patch.object(_cfg_routes, "get_config_loader", return_value=mock_loader):
            result = asyncio.run(_cfg_routes.get_venues_by_category("cefi", mock_request))
        assert result["category"] == "CEFI"
        assert "BINANCE" in result["venues"]

    def test_raises_404_for_unknown_category(self):
        mock_loader = MagicMock()
        mock_loader.load_venues_config.return_value = {"categories": {}}
        mock_request = _make_request()
        with (
            patch.object(_cfg_routes, "get_config_loader", return_value=mock_loader),
            pytest.raises(HTTPException) as exc,
        ):
            asyncio.run(_cfg_routes.get_venues_by_category("unknown", mock_request))
        assert exc.value.status_code == 404

    def test_raises_500_on_oserror(self):
        mock_loader = MagicMock()
        mock_loader.load_venues_config.side_effect = OSError("disk error")
        mock_request = _make_request()
        with (
            patch.object(_cfg_routes, "get_config_loader", return_value=mock_loader),
            pytest.raises(HTTPException) as exc,
        ):
            asyncio.run(_cfg_routes.get_venues_by_category("CEFI", mock_request))
        assert exc.value.status_code == 500


# ---------------------------------------------------------------------------
# TestGetExpectedStartDates
# ---------------------------------------------------------------------------


class TestGetExpectedStartDates:
    """Tests for get_expected_start_dates endpoint."""

    def test_returns_start_dates_from_yaml(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_dir = Path(tmpdir)
            data = {"instruments-service": {"CEFI": {"BINANCE": "2023-01-01"}}}
            with open(config_dir / "expected_start_dates.yaml", "w") as f:
                yaml.dump(data, f)
            mock_request = _make_request(config_dir)
            result = asyncio.run(_cfg_routes.get_expected_start_dates(mock_request))
        assert "instruments-service" in result

    def test_raises_404_when_file_missing(self):
        mock_request = _make_request(Path("/nonexistent/dir"))
        with pytest.raises(HTTPException) as exc:
            asyncio.run(_cfg_routes.get_expected_start_dates(mock_request))
        assert exc.value.status_code == 404

    def test_raises_500_on_oserror(self):
        with (
            patch.object(Path, "exists", return_value=True),
            patch("builtins.open", side_effect=OSError("disk error")),
            pytest.raises(HTTPException) as exc,
        ):
            asyncio.run(_cfg_routes.get_expected_start_dates(_make_request()))
        assert exc.value.status_code == 500


# ---------------------------------------------------------------------------
# TestGetServiceStartDates
# ---------------------------------------------------------------------------


class TestGetServiceStartDates:
    """Tests for get_service_start_dates endpoint."""

    def test_returns_service_start_dates(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_dir = Path(tmpdir)
            data = {"instruments-service": {"CEFI": {"BINANCE": "2023-01-01"}}}
            with open(config_dir / "expected_start_dates.yaml", "w") as f:
                yaml.dump(data, f)
            mock_request = _make_request(config_dir)
            result = asyncio.run(
                _cfg_routes.get_service_start_dates("instruments-service", mock_request)
            )
        assert result["service"] == "instruments-service"

    def test_raises_404_when_service_not_found(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_dir = Path(tmpdir)
            data = {"other-service": {}}
            with open(config_dir / "expected_start_dates.yaml", "w") as f:
                yaml.dump(data, f)
            mock_request = _make_request(config_dir)
            with pytest.raises(HTTPException) as exc:
                asyncio.run(_cfg_routes.get_service_start_dates("no-such-service", mock_request))
        assert exc.value.status_code == 404

    def test_raises_404_when_yaml_missing(self):
        mock_request = _make_request(Path("/nonexistent/dir"))
        with pytest.raises(HTTPException) as exc:
            asyncio.run(_cfg_routes.get_service_start_dates("svc", mock_request))
        assert exc.value.status_code == 404

    def test_raises_500_on_oserror(self):
        with (
            patch.object(Path, "exists", return_value=True),
            patch("builtins.open", side_effect=OSError("disk error")),
            pytest.raises(HTTPException) as exc,
        ):
            asyncio.run(_cfg_routes.get_service_start_dates("svc", _make_request()))
        assert exc.value.status_code == 500


# ---------------------------------------------------------------------------
# TestGetDependencies
# ---------------------------------------------------------------------------


class TestGetDependencies:
    """Tests for get_dependencies endpoint."""

    def _make_deps_yaml(self, tmpdir: str) -> Path:
        config_dir = Path(tmpdir)
        data = {
            "execution_order": ["instruments-service", "execution-service"],
            "services": {
                "instruments-service": {
                    "description": "Instruments data service",
                    "upstream": [],
                    "outputs": ["instruments"],
                },
                "execution-service": {
                    "description": "Execution service",
                    "upstream": [{"service": "instruments-service", "required": True}],
                    "outputs": ["orders"],
                },
            },
        }
        with open(config_dir / "dependencies.yaml", "w") as f:
            yaml.dump(data, f)
        return config_dir

    def test_returns_all_dependencies(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_dir = self._make_deps_yaml(tmpdir)
            mock_request = _make_request(config_dir)
            result = asyncio.run(_cfg_routes.get_dependencies(mock_request))
        assert "services" in result
        assert "execution_order" in result

    def test_raises_404_when_file_missing(self):
        mock_request = _make_request(Path("/nonexistent/dir"))
        with pytest.raises(HTTPException) as exc:
            asyncio.run(_cfg_routes.get_dependencies(mock_request))
        assert exc.value.status_code == 404

    def test_raises_500_on_oserror(self):
        with (
            patch.object(Path, "exists", return_value=True),
            patch("builtins.open", side_effect=OSError("disk error")),
            pytest.raises(HTTPException) as exc,
        ):
            asyncio.run(_cfg_routes.get_dependencies(_make_request()))
        assert exc.value.status_code == 500


# ---------------------------------------------------------------------------
# TestGetServiceDependencies
# ---------------------------------------------------------------------------


class TestGetServiceDependencies:
    """Tests for get_service_dependencies endpoint."""

    def _make_deps_yaml(self, tmpdir: str) -> Path:
        config_dir = Path(tmpdir)
        data = {
            "execution_order": ["instruments-service"],
            "services": {
                "instruments-service": {
                    "description": "Instruments service",
                    "upstream": [],
                    "outputs": ["instruments"],
                    "external_dependencies": [],
                },
            },
        }
        with open(config_dir / "dependencies.yaml", "w") as f:
            yaml.dump(data, f)
        return config_dir

    def test_returns_service_deps(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_dir = self._make_deps_yaml(tmpdir)
            mock_request = _make_request(config_dir)
            with patch.object(_cfg_routes, "cache") as mock_cache:
                mock_cache.get_or_fetch = _pass_through
                result = asyncio.run(
                    _cfg_routes.get_service_dependencies("instruments-service", mock_request)
                )
        assert result["service"] == "instruments-service"
        assert "upstream" in result
        assert "dag" in result

    def test_raises_404_when_service_not_found(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_dir = self._make_deps_yaml(tmpdir)
            mock_request = _make_request(config_dir)
            with (
                patch.object(_cfg_routes, "cache") as mock_cache,
                pytest.raises(HTTPException) as exc,
            ):
                mock_cache.get_or_fetch = _pass_through
                asyncio.run(_cfg_routes.get_service_dependencies("no-such-service", mock_request))
        assert exc.value.status_code == 404

    def test_raises_404_when_file_missing(self):
        mock_request = _make_request(Path("/nonexistent/dir"))
        with (
            patch.object(_cfg_routes, "cache") as mock_cache,
            pytest.raises(HTTPException) as exc,
        ):
            mock_cache.get_or_fetch = _pass_through
            asyncio.run(_cfg_routes.get_service_dependencies("instruments-service", mock_request))
        assert exc.value.status_code == 404

    def test_raises_500_on_oserror(self):
        with patch.object(_cfg_routes, "cache") as mock_cache:
            mock_cache.get_or_fetch = AsyncMock(side_effect=OSError("disk error"))
            with pytest.raises(HTTPException) as exc:
                asyncio.run(
                    _cfg_routes.get_service_dependencies("instruments-service", _make_request())
                )
        assert exc.value.status_code == 500
