"""
Unit tests for routes/services.py module.

Tests get_config_buckets, get_config_loader, discover_configs, list_directories,
and list_services route handlers by importing the module directly (bypass __init__).
"""

import asyncio
import importlib
import sys
from pathlib import Path
from types import ModuleType
from unittest.mock import MagicMock, patch

import pytest

# Ensure all dependencies are mocked before we import routes.services directly.
# We avoid triggering routes/__init__.py by importing the module directly.
sys.modules.setdefault("deployment_service", MagicMock())
_mock_config_loader_cls = MagicMock()
sys.modules.setdefault(
    "deployment_service.config_loader",
    MagicMock(ConfigLoader=_mock_config_loader_cls),
)
# Mock the routes package itself so __init__ import doesn't fire
if "deployment_api.routes" not in sys.modules:
    _routes_pkg = ModuleType("deployment_api.routes")
    _routes_pkg.__path__ = []  # type: ignore[attr-defined]
    _routes_pkg.__package__ = "deployment_api.routes"
    sys.modules["deployment_api.routes"] = _routes_pkg

# Now safely import just the services route module directly
_spec = importlib.util.spec_from_file_location(
    "deployment_api.routes.services",
    str(Path(__file__).parent.parent.parent / "deployment_api" / "routes" / "services.py"),
)
_svc_routes = importlib.util.module_from_spec(_spec)  # type: ignore[arg-type]
sys.modules["deployment_api.routes.services"] = _svc_routes
_spec.loader.exec_module(_svc_routes)  # type: ignore[union-attr]


# Suppress cloud_mock_mode deprecation warnings from fixture save/restore
pytestmark = pytest.mark.filterwarnings("ignore::DeprecationWarning")


@pytest.fixture(autouse=True)
def _disable_mock_mode():
    """Force live code path so patches on config_loader take effect."""
    original_data_mode = _svc_routes._cfg.data_mode
    original_cloud_mock = _svc_routes._cfg.cloud_mock_mode
    _svc_routes._cfg.data_mode = "real"
    _svc_routes._cfg.cloud_mock_mode = False
    yield
    _svc_routes._cfg.data_mode = original_data_mode
    _svc_routes._cfg.cloud_mock_mode = original_cloud_mock


def _make_request(config_dir=None):
    mock_request = MagicMock()
    mock_request.app.state.config_dir = config_dir or Path("/fake/configs")
    return mock_request


# ---------------------------------------------------------------------------
# Module-level event loop setup so get_event_loop() always returns a valid loop
# ---------------------------------------------------------------------------


def _ensure_event_loop():
    """Ensure a fresh event loop exists for asyncio.get_event_loop() callers."""
    import asyncio

    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            asyncio.set_event_loop(asyncio.new_event_loop())
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())


# ---------------------------------------------------------------------------
# TestGetConfigBuckets
# ---------------------------------------------------------------------------


class TestGetConfigBuckets:
    """Tests for get_config_buckets route handler."""

    def setup_method(self):
        _ensure_event_loop()

    def test_known_execution_service_returns_buckets(self):
        mock_request = _make_request()
        result = asyncio.get_event_loop().run_until_complete(
            _svc_routes.get_config_buckets("execution-service", mock_request)
        )
        assert result["service"] == "execution-service"
        assert result["default_bucket"] is not None
        assert len(result["buckets"]) >= 1

    def test_unknown_service_returns_empty_buckets(self):
        mock_request = _make_request()
        result = asyncio.get_event_loop().run_until_complete(
            _svc_routes.get_config_buckets("no-such-service", mock_request)
        )
        assert result["service"] == "no-such-service"
        assert result["default_bucket"] is None
        assert result["buckets"] == []
        assert "No config buckets" in result["message"]

    def test_strategy_service_has_three_buckets(self):
        mock_request = _make_request()
        result = asyncio.get_event_loop().run_until_complete(
            _svc_routes.get_config_buckets("strategy-service", mock_request)
        )
        assert len(result["buckets"]) == 3

    def test_ml_training_service_has_one_bucket(self):
        mock_request = _make_request()
        result = asyncio.get_event_loop().run_until_complete(
            _svc_routes.get_config_buckets("ml-training-service", mock_request)
        )
        assert len(result["buckets"]) == 1


# ---------------------------------------------------------------------------
# TestGetConfigLoader
# ---------------------------------------------------------------------------


class TestGetConfigLoader:
    """Tests for get_config_loader helper."""

    def setup_method(self):
        _ensure_event_loop()

    def test_returns_loader_instance(self):
        _svc_routes._config_loader = None
        mock_request = _make_request()
        loader = _svc_routes.get_config_loader(mock_request)
        assert loader is not None

    def test_caches_loader_on_second_call(self):
        _svc_routes._config_loader = None
        mock_request = _make_request()
        loader1 = _svc_routes.get_config_loader(mock_request)
        loader2 = _svc_routes.get_config_loader(mock_request)
        assert loader1 is loader2


# ---------------------------------------------------------------------------
# TestListDirectories
# ---------------------------------------------------------------------------


class TestListDirectories:
    """Tests for list_directories route handler."""

    def setup_method(self):
        _ensure_event_loop()

    def test_raises_400_for_non_gcs_path(self):
        from fastapi import HTTPException

        mock_request = _make_request()
        with pytest.raises(HTTPException) as exc_info:
            asyncio.get_event_loop().run_until_complete(
                _svc_routes.list_directories("my-svc", "s3://bucket/prefix/", mock_request)
            )
        assert exc_info.value.status_code == 400

    def test_returns_directories_from_prefixes(self):
        mock_request = _make_request()
        mock_list_prefixes = MagicMock(return_value=["configs/V1/", "configs/V2/"])

        with patch.dict(
            sys.modules,
            {"deployment_api.utils.storage_facade": MagicMock(list_prefixes=mock_list_prefixes)},
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _svc_routes.list_directories("my-svc", "gs://my-bucket/configs/", mock_request)
            )

        assert result["service"] == "my-svc"
        assert "directories" in result
        assert result["count"] == 2

    def test_empty_directories_when_no_prefixes(self):
        mock_request = _make_request()
        mock_list_prefixes = MagicMock(return_value=[])

        with patch.dict(
            sys.modules,
            {"deployment_api.utils.storage_facade": MagicMock(list_prefixes=mock_list_prefixes)},
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _svc_routes.list_directories("my-svc", "gs://my-bucket/", mock_request)
            )

        assert result["count"] == 0
        assert result["directories"] == []

    def test_raises_500_on_oserror(self):
        from fastapi import HTTPException

        mock_request = _make_request()
        mock_list_prefixes = MagicMock(side_effect=OSError("GCS down"))

        with (
            patch.dict(
                sys.modules,
                {
                    "deployment_api.utils.storage_facade": MagicMock(
                        list_prefixes=mock_list_prefixes
                    )
                },
            ),
            pytest.raises(HTTPException) as exc_info,
        ):
            asyncio.get_event_loop().run_until_complete(
                _svc_routes.list_directories("my-svc", "gs://my-bucket/", mock_request)
            )
        assert exc_info.value.status_code == 500


# ---------------------------------------------------------------------------
# TestDiscoverConfigs
# ---------------------------------------------------------------------------


class TestDiscoverConfigs:
    """Tests for discover_configs route handler."""

    def setup_method(self):
        _ensure_event_loop()

    def test_raises_400_for_invalid_scheme(self):
        from fastapi import HTTPException

        mock_request = _make_request()
        with pytest.raises(HTTPException) as exc_info:
            asyncio.get_event_loop().run_until_complete(
                _svc_routes.discover_configs("svc", "http://invalid", mock_request)
            )
        assert exc_info.value.status_code == 400

    def test_excludes_manifest_json(self):
        mock_request = _make_request()

        with patch(
            "deployment_api.utils.cloud_storage_client.list_cloud_files",
            return_value=[
                "gs://bucket/cfg1.json",
                "gs://bucket/manifest.json",
                "gs://bucket/package.json",
            ],
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _svc_routes.discover_configs("svc", "gs://bucket/", mock_request)
            )

        assert result["total_configs"] == 1  # Only cfg1.json passes

    def test_truncates_sample_at_20(self):
        mock_request = _make_request()

        with patch(
            "deployment_api.utils.cloud_storage_client.list_cloud_files",
            return_value=[f"gs://bucket/cfg{i}.json" for i in range(25)],
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _svc_routes.discover_configs("svc", "gs://bucket/", mock_request)
            )

        assert result["total_configs"] == 25
        assert len(result["sample"]) == 20
        assert result["truncated"] is True

    def test_s3_path_works(self):
        mock_request = _make_request()

        with patch(
            "deployment_api.utils.cloud_storage_client.list_cloud_files",
            return_value=["s3://bucket/cfg.json"],
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _svc_routes.discover_configs("svc", "s3://bucket/", mock_request)
            )

        assert result["total_configs"] == 1


# ---------------------------------------------------------------------------
# TestListServices
# ---------------------------------------------------------------------------


class TestListServices:
    """Tests for list_services route handler."""

    def setup_method(self):
        _ensure_event_loop()

    def test_returns_service_list(self):
        mock_request = _make_request()
        mock_loader = MagicMock()
        mock_loader.list_available_services.return_value = ["svc-a", "svc-b"]
        mock_loader.load_service_config.return_value = {
            "description": "A service",
            "dimensions": [],
        }
        with patch.object(_svc_routes, "get_config_loader", return_value=mock_loader):
            result = asyncio.get_event_loop().run_until_complete(
                _svc_routes.list_services(mock_request)
            )

        assert "services" in result
        assert result["count"] == 2

    def test_handles_load_error_per_service(self):
        mock_request = _make_request()
        mock_loader = MagicMock()
        mock_loader.list_available_services.return_value = ["bad-svc"]
        mock_loader.load_service_config.side_effect = OSError("no file")
        with patch.object(_svc_routes, "get_config_loader", return_value=mock_loader):
            result = asyncio.get_event_loop().run_until_complete(
                _svc_routes.list_services(mock_request)
            )

        assert result["count"] == 1
        assert "Error loading config" in result["services"][0]["description"]


# ---------------------------------------------------------------------------
# TestGetServiceConfig
# ---------------------------------------------------------------------------


class TestGetServiceConfig:
    """Tests for get_service_config route handler."""

    def setup_method(self):
        _ensure_event_loop()

    def test_returns_service_config_dict(self):
        mock_request = _make_request()
        mock_loader = MagicMock()
        mock_config = {"docker_image": "my-image", "cloud_run_job_name": "job"}
        mock_loader.load_service_config.return_value = mock_config
        with patch.object(_svc_routes, "get_config_loader", return_value=mock_loader):
            result = asyncio.get_event_loop().run_until_complete(
                _svc_routes.get_service_config("my-svc", mock_request)
            )

        assert result["service"] == "my-svc"
        assert result["config"] == mock_config

    def test_raises_404_when_file_not_found(self):
        from fastapi import HTTPException

        mock_request = _make_request()
        mock_loader = MagicMock()
        mock_loader.load_service_config.side_effect = FileNotFoundError("not found")
        with (
            patch.object(_svc_routes, "get_config_loader", return_value=mock_loader),
            pytest.raises(HTTPException) as exc_info,
        ):
            asyncio.get_event_loop().run_until_complete(
                _svc_routes.get_service_config("missing-svc", mock_request)
            )
        assert exc_info.value.status_code == 404

    def test_raises_500_on_oserror(self):
        from fastapi import HTTPException

        mock_request = _make_request()
        mock_loader = MagicMock()
        mock_loader.load_service_config.side_effect = OSError("GCS error")
        with (
            patch.object(_svc_routes, "get_config_loader", return_value=mock_loader),
            pytest.raises(HTTPException) as exc_info,
        ):
            asyncio.get_event_loop().run_until_complete(
                _svc_routes.get_service_config("svc", mock_request)
            )
        assert exc_info.value.status_code == 500
