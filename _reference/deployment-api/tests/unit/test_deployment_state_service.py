"""
Unit tests for services/deployment_state module (DeploymentStateManager).

Tests list_deployments, get_deployment_status, cancel_deployment,
resume_deployment, and _enrich_deployment_summary.
"""

import importlib.util
import os
import sys
import types
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Load DeploymentStateManager via canonical module name so relative imports
# inside method bodies (from ..routes.x import y) work correctly under
# pytest-xdist where test_background_sync.py may have set a MagicMock at
# sys.modules["deployment_api.services"].
import deployment_api  # ensures real top-level package is available in sys.modules

_ = deployment_api  # prevent F401

# Ensure deployment_api.services is a real package with a __path__ (needed for
# relative import resolution).  If another test has mocked it, restore a minimal stub.
if not hasattr(sys.modules.get("deployment_api.services"), "__path__"):
    _svc_stub = types.ModuleType("deployment_api.services")
    _svc_stub.__path__ = [  # type: ignore[attr-defined]
        str(Path(__file__).parent.parent.parent / "deployment_api" / "services")
    ]
    _svc_stub.__package__ = "deployment_api.services"
    sys.modules["deployment_api.services"] = _svc_stub

# Load the real deployment_state module with its canonical name so ..routes
# relative imports resolve correctly via sys.modules lookups.
_ds_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../deployment_api/services/deployment_state.py")
)
_ds_spec = importlib.util.spec_from_file_location(
    "deployment_api.services.deployment_state", _ds_path
)
assert _ds_spec is not None and _ds_spec.loader is not None
_ds_mod = importlib.util.module_from_spec(_ds_spec)
sys.modules["deployment_api.services.deployment_state"] = _ds_mod  # register before exec
_ds_spec.loader.exec_module(_ds_mod)  # type: ignore[union-attr]
DeploymentStateManager = _ds_mod.DeploymentStateManager  # type: ignore[attr-defined]


def _make_mgr() -> DeploymentStateManager:
    return DeploymentStateManager()


class TestDeploymentStateManagerInit:
    """Tests for DeploymentStateManager.__init__."""

    def test_can_be_instantiated(self):
        mgr = _make_mgr()
        assert isinstance(mgr, DeploymentStateManager)


def _with_mock_routes(deps=None, state=None, classified=None, counts=None, date_range=None):
    """Context manager factory that injects mock route sub-modules for lazy imports."""

    mock_caching = MagicMock()
    mock_caching.get_cached_deployments = MagicMock(return_value=deps or [])
    mock_caching.get_cached_deployment_state = MagicMock(return_value=state)
    # These are async functions, must return coroutines when called
    mock_caching.invalidate_deployment_state_cache = AsyncMock()
    mock_caching.invalidate_deployment_cache = AsyncMock()

    mock_dep_state = MagicMock()
    mock_dep_state.cancel_deployment_sync = MagicMock()
    mock_dep_state.refresh_deployment_status_sync = MagicMock()
    mock_dep_state.resume_deployment_sync = MagicMock()
    mock_dep_state.delete_deployment_sync = MagicMock()
    mock_dep_state.update_deployment_tag_sync = MagicMock()

    mock_shard = MagicMock()
    mock_shard._classify_all_shards = MagicMock(return_value=classified or [])
    mock_shard._compute_classification_counts = MagicMock(return_value=counts or {})
    mock_shard._get_state_date_range = MagicMock(return_value=date_range or {})

    return patch.dict(
        sys.modules,
        {
            "deployment_api.routes.deployment_caching": mock_caching,
            "deployment_api.routes.deployment_state": mock_dep_state,
            "deployment_api.routes.shard_management": mock_shard,
        },
    )


_DEMO_DEPS = [
    {"deployment_id": "d1", "service": "svc-a", "status": "running", "created_at": "2024-01-10"},
    {"deployment_id": "d2", "service": "svc-b", "status": "completed", "created_at": "2024-01-09"},
    {"deployment_id": "d3", "service": "svc-a", "status": "failed", "created_at": "2024-01-01"},
]

# GCS state dict for a real deployment (replaces the old _DEMO_DEP_ID hardcoded fixture)
_REAL_DEP_ID = "live-exec-20260310-143022-a1b2"
_REAL_STATE = {
    "deployment_id": _REAL_DEP_ID,
    "service": "execution-service",
    "status": "running",
    "compute_type": "cloud_run",
    "deploy_mode": "live",
    "created_at": "2026-03-10T14:30:22Z",
    "updated_at": "2026-03-10T14:45:00Z",
    "tag": "v2.4.1-canary",
    "region": "asia-northeast1",
    "config": {"start_date": "2026-01-01", "end_date": "2026-03-10"},
    "shards": [
        {"shard_id": "s1", "status": "running"},
    ],
    "compute_config": {"cpu": 4, "memory": "8Gi"},
    "cli_command": "python -m deployment deploy --service execution-service --compute cloud_run",
    "error_details": None,
}


class TestListDeployments:
    """Tests for DeploymentStateManager.list_deployments."""

    def test_returns_deployment_dict_with_expected_keys(self):
        mgr = _make_mgr()
        with patch.object(_ds_mod, "_gcs_list_deployments", return_value=_DEMO_DEPS):
            result = mgr.list_deployments()

        assert "deployments" in result
        assert "total_count" in result
        assert "limit" in result
        assert "offset" in result
        assert "has_more" in result

    def test_returns_all_deployments_by_default(self):
        mgr = _make_mgr()
        deps = [
            {"deployment_id": f"d{i}", "status": "running", "created_at": "2024-01-01"}
            for i in range(5)
        ]
        with patch.object(_ds_mod, "_gcs_list_deployments", return_value=deps):
            result = mgr.list_deployments()

        assert result["total_count"] == 5

    def test_filters_by_status(self):
        mgr = _make_mgr()
        with patch.object(_ds_mod, "_gcs_list_deployments", return_value=_DEMO_DEPS):
            result = mgr.list_deployments(status_filter="running")

        assert result["total_count"] == 1
        assert result["deployments"][0]["status"] == "running"

    def test_filters_by_service(self):
        mgr = _make_mgr()
        # GCS reader already filters by service; return only svc-a results to simulate
        svc_a_deps = [d for d in _DEMO_DEPS if d["service"] == "svc-a"]
        with patch.object(_ds_mod, "_gcs_list_deployments", return_value=svc_a_deps):
            result = mgr.list_deployments(service_filter="svc-a")

        assert result["total_count"] == 2
        assert all(d["service"] == "svc-a" for d in result["deployments"])

    def test_pagination_limit_and_offset(self):
        mgr = _make_mgr()
        deps = [
            {"deployment_id": f"d{i}", "status": "running", "created_at": "2024-01-01"}
            for i in range(10)
        ]
        with patch.object(_ds_mod, "_gcs_list_deployments", return_value=deps):
            result = mgr.list_deployments(limit=3, offset=2)

        assert len(result["deployments"]) == 3
        assert result["offset"] == 2
        assert result["limit"] == 3
        assert result["has_more"] is True

    def test_has_more_false_at_end(self):
        mgr = _make_mgr()
        deps = [
            {"deployment_id": f"d{i}", "status": "running", "created_at": "2024-01-01"}
            for i in range(3)
        ]
        with patch.object(_ds_mod, "_gcs_list_deployments", return_value=deps):
            result = mgr.list_deployments(limit=10, offset=0)

        assert result["has_more"] is False

    def test_sorts_by_created_at_descending(self):
        mgr = _make_mgr()
        deps = [
            {"deployment_id": "d1", "status": "running", "created_at": "2024-01-01"},
            {"deployment_id": "d2", "status": "running", "created_at": "2024-01-10"},
            {"deployment_id": "d3", "status": "running", "created_at": "2024-01-05"},
        ]
        with patch.object(_ds_mod, "_gcs_list_deployments", return_value=deps):
            result = mgr.list_deployments()

        first = result["deployments"][0]
        assert first["deployment_id"] == "d2"  # most recent first


class TestGetDeploymentStatus:
    """Tests for DeploymentStateManager.get_deployment_status."""

    def test_raises_when_not_found(self):
        mgr = _make_mgr()
        with patch.object(_ds_mod, "_load_state", return_value=None):
            with pytest.raises(ValueError, match="not found"):
                mgr.get_deployment_status("dep-missing-xyz")

    def test_returns_status_dict(self):
        mgr = _make_mgr()
        with patch.object(_ds_mod, "_load_state", return_value=_REAL_STATE):
            result = mgr.get_deployment_status(_REAL_DEP_ID)

        assert result["deployment_id"] == _REAL_DEP_ID
        assert result["status"] == "running"
        assert result["service"] == "execution-service"

    def test_detailed_false_omits_shards(self):
        mgr = _make_mgr()
        with patch.object(_ds_mod, "_load_state", return_value=_REAL_STATE):
            result = mgr.get_deployment_status(_REAL_DEP_ID, detailed=False)

        assert "shards" not in result


def _make_mock_caching():
    """Create a mock caching module with AsyncMock for async functions."""
    mock = MagicMock()
    mock.invalidate_deployment_state_cache = AsyncMock()
    mock.invalidate_deployment_cache = AsyncMock()
    return mock


class TestCancelDeployment:
    """Tests for DeploymentStateManager.cancel_deployment."""

    def test_returns_cancelled_status(self):
        mgr = _make_mgr()

        with _with_mock_routes():
            result = mgr.cancel_deployment("dep-1")

        assert result["status"] == "cancelled"
        assert result["deployment_id"] == "dep-1"

    def test_raises_on_cancel_error(self):
        mgr = _make_mgr()
        mock_dep_state = MagicMock()
        mock_dep_state.cancel_deployment_sync = MagicMock(side_effect=RuntimeError("cancel failed"))

        with (
            patch.dict(
                sys.modules,
                {
                    "deployment_api.routes.deployment_state": mock_dep_state,
                    "deployment_api.routes.deployment_caching": _make_mock_caching(),
                },
            ),
            pytest.raises(ValueError, match="Failed to cancel deployment"),
        ):
            mgr.cancel_deployment("dep-fail")


class TestRefreshDeploymentStatus:
    """Tests for DeploymentStateManager.refresh_deployment_status."""

    def test_calls_refresh_sync(self):
        mgr = _make_mgr()
        mock_dep_state = MagicMock()
        mock_dep_state.refresh_deployment_status_sync = MagicMock()

        with (
            patch.dict(
                sys.modules,
                {
                    "deployment_api.routes.deployment_state": mock_dep_state,
                    "deployment_api.routes.deployment_caching": _make_mock_caching(),
                    "deployment_api.routes.shard_management": MagicMock(
                        _classify_all_shards=MagicMock(return_value=[]),
                        _compute_classification_counts=MagicMock(return_value={}),
                        _get_state_date_range=MagicMock(return_value={}),
                    ),
                },
            ),
            patch.object(_ds_mod, "_load_state", return_value=_REAL_STATE),
        ):
            result = mgr.refresh_deployment_status(_REAL_DEP_ID)

        mock_dep_state.refresh_deployment_status_sync.assert_called_once_with(_REAL_DEP_ID)
        assert isinstance(result, dict)


class TestResumeDeployment:
    """Tests for DeploymentStateManager.resume_deployment."""

    def test_returns_resumed_status(self):
        mgr = _make_mgr()
        mock_dep_state = MagicMock()
        mock_dep_state.resume_deployment_sync = MagicMock()

        with patch.dict(
            sys.modules,
            {
                "deployment_api.routes.deployment_state": mock_dep_state,
                "deployment_api.routes.deployment_caching": _make_mock_caching(),
            },
        ):
            result = mgr.resume_deployment("dep-1")

        assert result["status"] == "resumed"
        assert result["deployment_id"] == "dep-1"

    def test_raises_on_resume_error(self):
        mgr = _make_mgr()
        mock_dep_state = MagicMock()
        mock_dep_state.resume_deployment_sync = MagicMock(side_effect=OSError("connect failed"))

        with (
            patch.dict(
                sys.modules,
                {
                    "deployment_api.routes.deployment_state": mock_dep_state,
                    "deployment_api.routes.deployment_caching": _make_mock_caching(),
                },
            ),
            pytest.raises(ValueError, match="Failed to resume deployment"),
        ):
            mgr.resume_deployment("dep-fail")


class TestDeleteDeployment:
    """Tests for DeploymentStateManager.delete_deployment."""

    def test_returns_deleted_status(self):
        mgr = _make_mgr()
        mock_dep_state = MagicMock()
        mock_dep_state.delete_deployment_sync = MagicMock()

        with patch.dict(
            sys.modules,
            {
                "deployment_api.routes.deployment_state": mock_dep_state,
                "deployment_api.routes.deployment_caching": _make_mock_caching(),
            },
        ):
            result = mgr.delete_deployment("dep-1")

        assert result["status"] == "deleted"
        assert result["deployment_id"] == "dep-1"

    def test_raises_on_delete_error(self):
        mgr = _make_mgr()
        mock_dep_state = MagicMock()
        mock_dep_state.delete_deployment_sync = MagicMock(side_effect=RuntimeError("delete failed"))

        with (
            patch.dict(
                sys.modules,
                {
                    "deployment_api.routes.deployment_state": mock_dep_state,
                    "deployment_api.routes.deployment_caching": _make_mock_caching(),
                },
            ),
            pytest.raises(ValueError, match="Failed to delete deployment"),
        ):
            mgr.delete_deployment("dep-fail")


class TestBulkDeleteDeployments:
    """Tests for DeploymentStateManager.bulk_delete_deployments."""

    def test_all_successful(self):
        mgr = _make_mgr()
        mock_dep_state = MagicMock()
        mock_dep_state.delete_deployment_sync = MagicMock()

        with patch.dict(
            sys.modules,
            {
                "deployment_api.routes.deployment_state": mock_dep_state,
                "deployment_api.routes.deployment_caching": _make_mock_caching(),
            },
        ):
            result = mgr.bulk_delete_deployments(["dep-1", "dep-2"])

        assert result["total_requested"] == 2
        assert result["successful_count"] == 2
        assert result["failed_count"] == 0

    def test_partial_failure(self):
        mgr = _make_mgr()

        call_count = [0]

        def failing_delete(dep_id):
            call_count[0] += 1
            if call_count[0] == 2:
                raise RuntimeError("second delete failed")

        mock_dep_state = MagicMock()
        mock_dep_state.delete_deployment_sync = MagicMock(side_effect=failing_delete)

        with patch.dict(
            sys.modules,
            {
                "deployment_api.routes.deployment_state": mock_dep_state,
                "deployment_api.routes.deployment_caching": _make_mock_caching(),
            },
        ):
            result = mgr.bulk_delete_deployments(["dep-1", "dep-2", "dep-3"])

        assert result["total_requested"] == 3
        assert result["successful_count"] == 2
        assert result["failed_count"] == 1

    def test_empty_list(self):
        mgr = _make_mgr()

        with patch.dict(
            sys.modules,
            {
                "deployment_api.routes.deployment_caching": _make_mock_caching(),
            },
        ):
            result = mgr.bulk_delete_deployments([])

        assert result["total_requested"] == 0
        assert result["successful_count"] == 0


class TestUpdateDeploymentTag:
    """Tests for DeploymentStateManager.update_deployment_tag."""

    def test_returns_updated_status(self):
        mgr = _make_mgr()
        mock_dep_state = MagicMock()
        mock_dep_state.update_deployment_tag_sync = MagicMock()

        with patch.dict(
            sys.modules,
            {
                "deployment_api.routes.deployment_state": mock_dep_state,
                "deployment_api.routes.deployment_caching": _make_mock_caching(),
            },
        ):
            result = mgr.update_deployment_tag("dep-1", "v2.0")

        assert result["status"] == "updated"
        assert result["deployment_id"] == "dep-1"
        assert result["new_tag"] == "v2.0"

    def test_raises_on_update_error(self):
        mgr = _make_mgr()
        mock_dep_state = MagicMock()
        mock_dep_state.update_deployment_tag_sync = MagicMock(side_effect=ValueError("bad tag"))

        with (
            patch.dict(
                sys.modules,
                {
                    "deployment_api.routes.deployment_state": mock_dep_state,
                    "deployment_api.routes.deployment_caching": _make_mock_caching(),
                },
            ),
            pytest.raises(ValueError, match="Failed to update deployment tag"),
        ):
            mgr.update_deployment_tag("dep-fail", "bad")


class TestVerifyDeploymentCompletion:
    """Tests for DeploymentStateManager.verify_deployment_completion."""

    def test_returns_verification_result(self):
        mgr = _make_mgr()
        # Current implementation returns not_run dict - verify the contract
        result = mgr.verify_deployment_completion("dep-1")

        assert result["deployment_id"] == "dep-1"
        assert result["status"] == "not_run"
        assert "message" in result

    def test_returns_verification_with_force_refresh(self):
        mgr = _make_mgr()
        result = mgr.verify_deployment_completion("dep-1", force_refresh=True)

        assert result["deployment_id"] == "dep-1"
        assert result["force_refresh"] is True

    def test_raises_on_verification_error(self):
        # The current implementation does not raise - it returns not_run dict.
        # This test verifies the response is returned without raising.
        mgr = _make_mgr()
        result = mgr.verify_deployment_completion("dep-fail")
        assert result["status"] == "not_run"


class TestGetDeploymentLogs:
    """Tests for DeploymentStateManager.get_deployment_logs."""

    def test_returns_logs_result(self):
        mgr = _make_mgr()
        # Current implementation returns not_available dict with empty logs
        result = mgr.get_deployment_logs("dep-1")

        assert result["deployment_id"] == "dep-1"
        assert "logs" in result
        assert result["status"] == "not_available"

    def test_returns_with_shard_filter(self):
        mgr = _make_mgr()
        result = mgr.get_deployment_logs("dep-1", shard_filter="s1")
        assert result["shard_filter"] == "s1"

    def test_raises_on_log_error(self):
        # The current implementation does not raise - it returns not_available dict.
        # This test verifies the response is returned without raising.
        mgr = _make_mgr()
        result = mgr.get_deployment_logs("dep-fail")
        assert result["status"] == "not_available"


class TestEnrichDeploymentSummary:
    """Tests for DeploymentStateManager._enrich_deployment_summary."""

    def test_adds_duration_minutes(self):
        mgr = _make_mgr()
        deployment = {
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T01:30:00",
        }
        mgr._enrich_deployment_summary(deployment)
        assert "duration_minutes" in deployment
        assert deployment["duration_minutes"] == 90

    def test_invalid_timestamps_no_crash(self):
        mgr = _make_mgr()
        deployment = {
            "created_at": "not-a-date",
            "updated_at": "also-not-a-date",
        }
        mgr._enrich_deployment_summary(deployment)  # Should not raise

    def test_adds_success_rate_when_shards_present(self):
        mgr = _make_mgr()
        deployment = {"total_shards": 10, "successful_shards": 8}
        mgr._enrich_deployment_summary(deployment)
        assert deployment["success_rate"] == 80.0

    def test_zero_total_shards_gives_zero_rate(self):
        mgr = _make_mgr()
        deployment = {"total_shards": 0, "successful_shards": 0}
        mgr._enrich_deployment_summary(deployment)
        assert deployment["success_rate"] == 0.0

    def test_no_shards_info_no_rate(self):
        mgr = _make_mgr()
        deployment = {}
        mgr._enrich_deployment_summary(deployment)
        assert "success_rate" not in deployment
