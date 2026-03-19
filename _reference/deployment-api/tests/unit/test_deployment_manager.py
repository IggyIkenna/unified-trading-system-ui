"""
Unit tests for services/deployment_manager module.

Tests DeploymentManager initialization and methods with mocked external
dependencies (deployment_service_client HTTP API, ConfigLoader,
validation functions).
"""

import sys
from pathlib import Path as _Path
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Remove the pre-mocked deployment_api.services entry so we can import the real DeploymentManager.
# Save the original so we can restore it after import for subsequent test files.
_SAVED_SVC_PKG = sys.modules.get("deployment_api.services")
_SAVED_SVC_DM = sys.modules.get("deployment_api.services.deployment_manager")

for _key in list(sys.modules.keys()):
    if _key in (
        "deployment_api.services.deployment_manager",
        "deployment_api.services",
    ):
        del sys.modules[_key]

# Re-build the minimal deployment_api.services package for this module's import
_svc_pkg = ModuleType("deployment_api.services")
_svc_pkg.__package__ = "deployment_api.services"
_services_dir = str(_Path(__file__).parent.parent.parent / "deployment_api" / "services")
_svc_pkg.__path__ = [_services_dir]  # type: ignore[attr-defined]
sys.modules["deployment_api.services"] = _svc_pkg

# Mock heavy external modules before importing deployment_manager
sys.modules.setdefault("deployment_service", MagicMock())
sys.modules.setdefault("deployment_service.shard_calculator", MagicMock())
sys.modules.setdefault("deployment_service.deployment", MagicMock())
sys.modules.setdefault("deployment_service.deployment.orchestrator", MagicMock())

# Mock routes sub-modules to prevent routes/__init__.py from loading heavy deps.
# We save originals so we can restore them; test_deployments_helpers.py needs the real modules.
_ROUTE_MOCKS = {
    "deployment_api.routes.deployment_validation": MagicMock(
        validate_deployment_request=MagicMock(return_value=None),
        validate_shard_configuration=MagicMock(return_value=None),
        validate_quota_requirements=MagicMock(return_value=None),
        validate_image_availability=MagicMock(return_value=None),
        generate_deployment_report=MagicMock(return_value={}),
        resolve_deploy_dates=MagicMock(return_value=(None, None)),
    ),
    "deployment_api.routes.deployments_helpers": MagicMock(
        build_deploy_env_vars=MagicMock(return_value={}),
        _deployment_config=MagicMock(),
    ),
}
_SAVED_ROUTES: dict = {}
for _rmod, _rmock in _ROUTE_MOCKS.items():
    _SAVED_ROUTES[_rmod] = sys.modules.get(_rmod)
    if _rmod not in sys.modules:
        sys.modules[_rmod] = _rmock

# Ensure unified_events_interface is mocked so log_event is importable
sys.modules.setdefault("unified_events_interface", MagicMock(log_event=MagicMock()))

from deployment_api.services.deployment_manager import DeploymentManager

# Restore only the route modules so subsequent test files get the real route modules.
# We do NOT restore deployment_api.services since other tests use the conftest mock.
for _rmod, _orig in _SAVED_ROUTES.items():
    if _orig is None:
        # Remove our temporary mock so the real module can be imported fresh later
        sys.modules.pop(_rmod, None)
    else:
        sys.modules[_rmod] = _orig

# Restore the conftest's original deployment_api.services mock so other test files work.
# But keep deployment_api.services.deployment_manager as the real module we just imported.
if _SAVED_SVC_PKG is not None:
    # Restore the services package mock but keep our imported sub-module
    _SAVED_SVC_PKG.deployment_manager = sys.modules.get(
        "deployment_api.services.deployment_manager"
    )  # type: ignore[attr-defined]
    sys.modules["deployment_api.services"] = _SAVED_SVC_PKG


def _make_deploy_request(**kwargs):
    """Build a minimal DeployRequest-like mock."""
    req = MagicMock()
    req.service = kwargs.get("service", "test-service")
    req.compute = kwargs.get("compute", "vm")
    req.region = kwargs.get("region", "us-central1")
    req.start_date = kwargs.get("start_date", "2026-01-01")
    req.end_date = kwargs.get("end_date", "2026-01-31")
    req.max_shards = kwargs.get("max_shards", 100)
    req.max_concurrent = kwargs.get("max_concurrent", 10)
    req.cloud_config_path = kwargs.get("cloud_config_path")
    req.ignore_start_dates = kwargs.get("ignore_start_dates", False)
    req.deploy_missing = kwargs.get("deploy_missing", False)
    req.skip_dimensions = kwargs.get("skip_dimensions", [])
    req.date_granularity = kwargs.get("date_granularity")
    req.filters = kwargs.get("filters", {})
    req.max_workers = kwargs.get("max_workers")
    req.tag = kwargs.get("tag")
    req.vm_zone = kwargs.get("vm_zone")
    req.deploy_env = kwargs.get("deploy_env")
    req.mode = kwargs.get("mode", "default")
    return req


def _make_raw_shard(shard_index=0, total_shards=1):
    """Build a raw shard dict as returned by deployment_service_client."""
    return {
        "shard_index": shard_index,
        "total_shards": total_shards,
        "dimensions": {"date": "2026-01-01"},
        "cli_command": "python -m service --date 2026-01-01",
    }


class TestDeploymentManagerInit:
    """Tests for DeploymentManager.__init__."""

    def test_init_sets_default_max_concurrent(self):
        manager = DeploymentManager()
        assert manager.default_max_concurrent == 100

    def test_init_sets_default_region(self):
        manager = DeploymentManager()
        assert isinstance(manager.default_region, str)
        assert len(manager.default_region) > 0

    def test_init_sets_default_project_id(self):
        manager = DeploymentManager()
        # May be None if not set in settings, but attribute must exist
        assert hasattr(manager, "default_project_id")


class TestValidateDeploymentRequest:
    """Tests for DeploymentManager.validate_deployment_request."""

    def test_returns_none_on_valid_request(self):
        manager = DeploymentManager()
        req = _make_deploy_request()

        with patch(
            "deployment_api.services.deployment_manager.validate_deployment_request",
            return_value=None,
        ):
            result = manager.validate_deployment_request(req)

        assert result is None

    def test_returns_error_dict_on_invalid_request(self):
        manager = DeploymentManager()
        req = _make_deploy_request()
        error = {"error": "invalid request", "field": "service"}

        with patch(
            "deployment_api.services.deployment_manager.validate_deployment_request",
            return_value=error,
        ):
            result = manager.validate_deployment_request(req)

        assert result == error


class TestCalculateQuotaRequirements:
    """Tests for DeploymentManager.calculate_quota_requirements."""

    def test_zero_shards_returns_quota_ok(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request()

        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {}
        mock_loader.get_scaled_compute_config.return_value = {"cpu": 2, "memory": "4Gi"}

        mock_ds = MagicMock()
        mock_ds.calculate_shards = AsyncMock(return_value=[])

        with (
            patch(
                "deployment_api.services.deployment_manager.ConfigLoader", return_value=mock_loader
            ),
            patch("deployment_api.services.deployment_manager._ds_client", mock_ds),
        ):
            result = asyncio.run(manager.calculate_quota_requirements(req))

        assert result["total_shards"] == 0
        assert result["quota_ok"] is True

    def test_vm_compute_returns_quota_info(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request(compute="vm")

        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {}
        mock_loader.get_scaled_compute_config.return_value = {
            "cpu": 4,
            "memory": "16Gi",
            "machine_type": "n1-standard-4",
        }

        mock_vm_shape = MagicMock()
        mock_vm_shape.per_shard.return_value = {"cpu": 4.0, "memory_gb": 16.0}

        raw_shards = [_make_raw_shard(i, 2) for i in range(2)]

        mock_ds = MagicMock()
        mock_ds.calculate_shards = AsyncMock(return_value=raw_shards)

        with (
            patch(
                "deployment_api.services.deployment_manager.ConfigLoader", return_value=mock_loader
            ),
            patch("deployment_api.services.deployment_manager._ds_client", mock_ds),
            patch(
                "deployment_api.services.deployment_manager.vm_quota_shape_from_compute_config",
                return_value=mock_vm_shape,
            ),
        ):
            result = asyncio.run(manager.calculate_quota_requirements(req))

        assert result["total_shards"] == 2
        assert "resource_requirements" in result

    def test_cloud_run_compute_returns_quota_info(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request(compute="cloud_run")

        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {}
        mock_loader.get_scaled_compute_config.return_value = {"cpu": 2, "memory": "4Gi"}

        raw_shards = [_make_raw_shard(0, 1)]

        mock_ds = MagicMock()
        mock_ds.calculate_shards = AsyncMock(return_value=raw_shards)

        with (
            patch(
                "deployment_api.services.deployment_manager.ConfigLoader", return_value=mock_loader
            ),
            patch("deployment_api.services.deployment_manager._ds_client", mock_ds),
        ):
            result = asyncio.run(manager.calculate_quota_requirements(req))

        assert result["total_shards"] == 1

    def test_raises_value_error_on_runtime_error(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request()

        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {}

        mock_ds = MagicMock()
        mock_ds.calculate_shards = AsyncMock(side_effect=RuntimeError("shard calc failed"))

        with (
            patch(
                "deployment_api.services.deployment_manager.ConfigLoader", return_value=mock_loader
            ),
            patch("deployment_api.services.deployment_manager._ds_client", mock_ds),
            patch("deployment_api.services.deployment_manager.log_event"),
        ):
            with pytest.raises(ValueError, match="Failed to calculate shards"):
                asyncio.run(manager.calculate_quota_requirements(req))


class TestCreateDeployment:
    """Tests for DeploymentManager.create_deployment."""

    def test_raises_when_validation_fails(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request()

        with (
            patch(
                "deployment_api.services.deployment_manager.validate_deployment_request",
                return_value={"error": "bad request"},
            ),
            patch("deployment_api.services.deployment_manager.log_event"),
            pytest.raises(ValueError),
        ):
            asyncio.run(manager.create_deployment(req))

    def test_raises_when_no_shards(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request()

        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {}
        mock_loader.get_compute_recommendation.return_value = {}
        mock_loader.get_scaled_compute_config.return_value = {"cpu": 2, "memory": "4Gi"}

        mock_ds = MagicMock()
        mock_ds.calculate_shards = AsyncMock(return_value=[])

        with (
            patch(
                "deployment_api.services.deployment_manager.validate_deployment_request",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_shard_configuration",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_quota_requirements",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_image_availability",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.ConfigLoader", return_value=mock_loader
            ),
            patch("deployment_api.services.deployment_manager._ds_client", mock_ds),
            patch("deployment_api.services.deployment_manager.log_event"),
        ):
            with pytest.raises(ValueError, match="No shards to deploy"):
                asyncio.run(manager.create_deployment(req))

    def test_returns_deployment_info_on_success(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request()

        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {"docker_image": None}
        mock_loader.get_compute_recommendation.return_value = {}
        mock_loader.get_scaled_compute_config.return_value = {"cpu": 2, "memory": "4Gi"}

        raw_shards = [_make_raw_shard(i, 2) for i in range(2)]

        mock_ds = MagicMock()
        mock_ds.calculate_shards = AsyncMock(return_value=raw_shards)
        mock_ds.create_deployment = AsyncMock()

        with (
            patch(
                "deployment_api.services.deployment_manager.validate_deployment_request",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_shard_configuration",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_quota_requirements",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_image_availability",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.ConfigLoader", return_value=mock_loader
            ),
            patch("deployment_api.services.deployment_manager._ds_client", mock_ds),
            patch(
                "deployment_api.services.deployment_manager.build_deploy_env_vars", return_value={}
            ),
            patch("deployment_api.services.deployment_manager.log_event"),
        ):
            result = asyncio.run(manager.create_deployment(req))

        assert "deployment_id" in result
        assert "shard_list" in result
        assert len(result["shard_list"]) == 2

    def test_raises_when_shard_validation_fails(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request()

        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {}

        with (
            patch(
                "deployment_api.services.deployment_manager.validate_deployment_request",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_shard_configuration",
                return_value={"error": "shard invalid"},
            ),
            patch(
                "deployment_api.services.deployment_manager.ConfigLoader", return_value=mock_loader
            ),
            patch("deployment_api.services.deployment_manager.log_event"),
            pytest.raises(ValueError),
        ):
            asyncio.run(manager.create_deployment(req))

    def test_status_is_pending_in_result(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request()

        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {"docker_image": None}
        mock_loader.get_compute_recommendation.return_value = {}

        raw_shards = [_make_raw_shard(0, 1)]

        mock_ds = MagicMock()
        mock_ds.calculate_shards = AsyncMock(return_value=raw_shards)
        mock_ds.create_deployment = AsyncMock()

        with (
            patch(
                "deployment_api.services.deployment_manager.validate_deployment_request",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_shard_configuration",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_quota_requirements",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_image_availability",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.ConfigLoader", return_value=mock_loader
            ),
            patch("deployment_api.services.deployment_manager._ds_client", mock_ds),
            patch(
                "deployment_api.services.deployment_manager.build_deploy_env_vars", return_value={}
            ),
            patch("deployment_api.services.deployment_manager.log_event"),
        ):
            result = asyncio.run(manager.create_deployment(req))

        assert result["status"] == "pending"

    def test_calls_background_task_when_provided(self):
        import asyncio

        manager = DeploymentManager()
        req = _make_deploy_request()
        background_called = []

        def background_fn(*args, **kwargs):
            background_called.append(True)

        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {"docker_image": None}
        mock_loader.get_compute_recommendation.return_value = {}

        raw_shards = [_make_raw_shard(0, 1)]

        mock_ds = MagicMock()
        mock_ds.calculate_shards = AsyncMock(return_value=raw_shards)
        mock_ds.create_deployment = AsyncMock()

        with (
            patch(
                "deployment_api.services.deployment_manager.validate_deployment_request",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_shard_configuration",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_quota_requirements",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.validate_image_availability",
                return_value=None,
            ),
            patch(
                "deployment_api.services.deployment_manager.ConfigLoader", return_value=mock_loader
            ),
            patch("deployment_api.services.deployment_manager._ds_client", mock_ds),
            patch(
                "deployment_api.services.deployment_manager.build_deploy_env_vars", return_value={}
            ),
            patch("deployment_api.services.deployment_manager.log_event"),
        ):
            asyncio.run(manager.create_deployment(req, background_task_func=background_fn))

        assert background_called


class TestGetDeploymentReport:
    """Tests for DeploymentManager.get_deployment_report."""

    def test_returns_error_when_deployment_not_found(self):
        import sys

        manager = DeploymentManager()
        mock_state_service = MagicMock()
        mock_state_service.get_deployment_state.return_value = None
        mock_dst_mod = MagicMock()
        mock_dst_mod.DeploymentStateService = MagicMock(return_value=mock_state_service)

        with patch.dict(sys.modules, {"deployment_api.services.deployment_state": mock_dst_mod}):
            result = manager.get_deployment_report("nonexistent-id")

        assert "error" in result

    def test_returns_report_when_deployment_found(self):
        import sys

        manager = DeploymentManager()
        state = {"deployment_id": "dep-1", "status": "running", "shards": []}
        mock_state_service = MagicMock()
        mock_state_service.get_deployment_state.return_value = state
        mock_dst_mod = MagicMock()
        mock_dst_mod.DeploymentStateService = MagicMock(return_value=mock_state_service)

        with (
            patch.dict(sys.modules, {"deployment_api.services.deployment_state": mock_dst_mod}),
            patch(
                "deployment_api.services.deployment_manager.generate_deployment_report",
                return_value={"deployment_id": "dep-1", "summary": "OK"},
            ),
        ):
            result = manager.get_deployment_report("dep-1")

        assert result["deployment_id"] == "dep-1"
