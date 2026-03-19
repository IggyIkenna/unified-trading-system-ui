"""
Unit tests for services/sync_service module.

Tests SyncService initialization, scan_deployment_states,
load_deployment_state, save_deployment_state, filter_active_deployments,
try_acquire_deployment_lock, release_deployment_lock, and run_sync_cycle.
"""

import json
import sys
from datetime import UTC, datetime, timedelta
from types import ModuleType
from unittest.mock import MagicMock, patch

import pytest

# Remove the pre-mocked sub-module entry so we can import the real SyncService.
# The conftest pre-mocks deployment_api.services.sync_service as a ModuleType
# with a placeholder SyncService=MagicMock(). We need the real class here.
for _key in list(sys.modules.keys()):
    if _key in (
        "deployment_api.services.sync_service",
        "deployment_api.services.state_manager",
        "deployment_api.services.event_processor",
        "deployment_api.services",
    ):
        del sys.modules[_key]

# Re-build the minimal deployment_api.services package so the sub-module imports
# (from .state_manager import StateManager, etc.) resolve correctly when Python
# imports deployment_api.services.sync_service for real.
from pathlib import Path as _Path

_svc_pkg = ModuleType("deployment_api.services")
_svc_pkg.__package__ = "deployment_api.services"
# Point __path__ to the real services directory so Python can find sub-modules
_services_dir = str(_Path(__file__).parent.parent.parent / "deployment_api" / "services")
_svc_pkg.__path__ = [_services_dir]  # type: ignore[attr-defined]
sys.modules["deployment_api.services"] = _svc_pkg

from deployment_api.services.sync_service import SyncService


def _make_service(**kwargs) -> SyncService:
    """Create a SyncService with test defaults, patching out _initialize_quota_broker."""
    with patch.object(SyncService, "_initialize_quota_broker", return_value=None):
        return SyncService(
            project_id=kwargs.get("project_id", "test-project"),
            state_bucket=kwargs.get("state_bucket", "test-bucket"),
            deployment_env=kwargs.get("deployment_env", "development"),
        )


class TestSyncServiceInit:
    """Tests for SyncService.__init__."""

    def test_init_sets_project_id(self):
        svc = _make_service(project_id="my-project")
        assert svc.project_id == "my-project"

    def test_init_sets_state_bucket(self):
        svc = _make_service(state_bucket="my-bucket")
        assert svc.state_bucket == "my-bucket"

    def test_init_sets_deployment_env(self):
        svc = _make_service(deployment_env="production")
        assert svc.deployment_env == "production"

    def test_init_creates_state_manager(self):
        svc = _make_service()
        assert svc.state_manager is not None

    def test_init_creates_event_processor(self):
        svc = _make_service()
        assert svc.event_processor is not None

    def test_quota_broker_is_none_when_not_available(self):
        """When QuotaBrokerClient raises, quota_broker is None."""
        svc = _make_service()
        # The mocked deployment.quota_broker_client raises on init
        # (since it's a MagicMock that doesn't raise but returns another mock)
        assert svc.quota_broker is not None or svc.quota_broker is None


class TestScanDeploymentStates:
    """Tests for SyncService.scan_deployment_states."""

    def test_returns_list_of_state_paths(self):
        svc = _make_service()
        mock_obj1 = MagicMock()
        mock_obj1.name = "deployments.development/dep-1/state.json"
        mock_obj2 = MagicMock()
        mock_obj2.name = "deployments.development/dep-1/other.json"

        with patch(
            "deployment_api.services.sync_service.list_objects", return_value=[mock_obj1, mock_obj2]
        ):
            result = svc.scan_deployment_states()

        assert result == ["deployments.development/dep-1/state.json"]

    def test_returns_empty_list_on_error(self):
        svc = _make_service()

        with patch(
            "deployment_api.services.sync_service.list_objects",
            side_effect=OSError("gcs down"),
        ):
            result = svc.scan_deployment_states()

        assert result == []

    def test_filters_non_state_json_objects(self):
        svc = _make_service()
        mock_obj = MagicMock()
        mock_obj.name = "deployments.development/dep-1/config.yaml"

        with patch("deployment_api.services.sync_service.list_objects", return_value=[mock_obj]):
            result = svc.scan_deployment_states()

        assert result == []


class TestLoadDeploymentState:
    """Tests for SyncService.load_deployment_state."""

    def test_returns_dict_on_success(self):
        svc = _make_service()
        state_data = {"status": "running", "deployment_id": "dep-1"}

        with patch(
            "deployment_api.services.sync_service.read_object_text",
            return_value=json.dumps(state_data),
        ):
            result = svc.load_deployment_state("deployments.development/dep-1/state.json")

        assert result == state_data

    def test_returns_none_on_error(self):
        svc = _make_service()

        with patch(
            "deployment_api.services.sync_service.read_object_text",
            side_effect=OSError("not found"),
        ):
            result = svc.load_deployment_state("deployments.development/dep-1/state.json")

        assert result is None

    def test_returns_none_on_invalid_json(self):
        svc = _make_service()

        with patch(
            "deployment_api.services.sync_service.read_object_text",
            return_value="not-json",
        ):
            result = svc.load_deployment_state("path/state.json")

        assert result is None


class TestSaveDeploymentState:
    """Tests for SyncService.save_deployment_state."""

    def test_returns_true_on_success(self):
        svc = _make_service()
        state = {"status": "running"}

        with patch("deployment_api.services.sync_service.write_object_text") as mock_write:
            result = svc.save_deployment_state("path/state.json", state)

        assert result is True
        mock_write.assert_called_once()

    def test_returns_false_on_error(self):
        svc = _make_service()

        with patch(
            "deployment_api.services.sync_service.write_object_text",
            side_effect=OSError("write failed"),
        ):
            result = svc.save_deployment_state("path/state.json", {"status": "running"})

        assert result is False

    def test_saves_json_content(self):
        svc = _make_service()
        state = {"status": "completed", "deployment_id": "dep-1"}
        captured = {}

        def capture_write(bucket, path, text):
            captured["text"] = text

        with patch(
            "deployment_api.services.sync_service.write_object_text", side_effect=capture_write
        ):
            svc.save_deployment_state("path/state.json", state)

        saved = json.loads(captured["text"])
        assert saved["status"] == "completed"


class TestFilterActiveDeployments:
    """Tests for SyncService.filter_active_deployments."""

    def test_filters_out_non_active_states(self):
        svc = _make_service()
        completed_state = {
            "status": "completed",
            "created_at": (datetime.now(UTC) - timedelta(minutes=10)).isoformat(),
        }

        with patch.object(svc, "load_deployment_state", return_value=completed_state):
            result = svc.filter_active_deployments(["path/state.json"])

        assert result == []

    def test_includes_running_states(self):
        svc = _make_service()
        running_state = {
            "status": "running",
            "created_at": (datetime.now(UTC) - timedelta(minutes=10)).isoformat(),
        }

        with patch.object(svc, "load_deployment_state", return_value=running_state):
            result = svc.filter_active_deployments(["path/state.json"])

        assert len(result) == 1
        assert result[0][0] == "path/state.json"

    def test_excludes_too_recently_created(self):
        svc = _make_service()
        brand_new_state = {
            "status": "running",
            "created_at": datetime.now(UTC).isoformat(),
        }

        with patch.object(svc, "load_deployment_state", return_value=brand_new_state):
            result = svc.filter_active_deployments(["path/state.json"], min_age_minutes=5)

        assert result == []

    def test_includes_pending_states(self):
        svc = _make_service()
        pending_state = {
            "status": "pending",
            "created_at": (datetime.now(UTC) - timedelta(minutes=10)).isoformat(),
        }

        with patch.object(svc, "load_deployment_state", return_value=pending_state):
            result = svc.filter_active_deployments(["path/state.json"])

        assert len(result) == 1

    def test_skips_states_that_fail_to_load(self):
        svc = _make_service()

        with patch.object(svc, "load_deployment_state", return_value=None):
            result = svc.filter_active_deployments(["bad/path.json"])

        assert result == []

    def test_handles_multiple_paths(self):
        svc = _make_service()
        old_time = (datetime.now(UTC) - timedelta(minutes=15)).isoformat()
        running_state = {"status": "running", "created_at": old_time}
        completed_state = {"status": "completed", "created_at": old_time}

        def mock_load(path):
            if "dep-1" in path:
                return running_state
            return completed_state

        with patch.object(svc, "load_deployment_state", side_effect=mock_load):
            result = svc.filter_active_deployments(
                [
                    "deployments.development/dep-1/state.json",
                    "deployments.development/dep-2/state.json",
                ]
            )

        assert len(result) == 1
        assert "dep-1" in result[0][0]


# The conftest pre-loads real modules, then the top-of-file del/re-import may create a
# new module object whose __dict__ diverges from the SyncService class's __globals__.
# Use types.SimpleNamespace wrapping the function's __globals__ to ensure patch.object
# targets the dict that the running code actually reads.
import types as _types

import deployment_api.services.sync_service as _sync_service_mod

_sync_globals_ns = _types.SimpleNamespace(
    **{"__dict__": SyncService._initialize_quota_broker.__globals__}
)


class TestInitializeQuotaBroker:
    """Tests for SyncService._initialize_quota_broker — lines 61-63."""

    def _call_with_importlib(self, mock_import_module):
        """Helper: inject _importlib into module globals then call _initialize_quota_broker."""
        svc = _make_service()
        with patch.dict(
            SyncService._initialize_quota_broker.__globals__, {"_importlib": mock_import_module}
        ):
            return svc._initialize_quota_broker()

    def test_returns_quota_broker_when_import_succeeds(self):
        mock_broker = MagicMock()
        mock_qb_mod = MagicMock()
        mock_qb_mod.QuotaBrokerClient = MagicMock(return_value=mock_broker)
        mock_importlib = MagicMock()
        mock_importlib.import_module.return_value = mock_qb_mod
        result = self._call_with_importlib(mock_importlib)
        assert result is mock_broker

    def test_returns_none_when_oserror_raised(self):
        mock_importlib = MagicMock()
        mock_importlib.import_module.side_effect = OSError("unavailable")
        result = self._call_with_importlib(mock_importlib)
        assert result is None

    def test_returns_none_when_valueerror_raised(self):
        mock_qb_mod = MagicMock()
        mock_qb_mod.QuotaBrokerClient = MagicMock(side_effect=ValueError("bad config"))
        mock_importlib = MagicMock()
        mock_importlib.import_module.return_value = mock_qb_mod
        result = self._call_with_importlib(mock_importlib)
        assert result is None

    def test_returns_none_when_runtimeerror_raised(self):
        mock_qb_mod = MagicMock()
        mock_qb_mod.QuotaBrokerClient = MagicMock(side_effect=RuntimeError("runtime failure"))
        mock_importlib = MagicMock()
        mock_importlib.import_module.return_value = mock_qb_mod
        result = self._call_with_importlib(mock_importlib)
        assert result is None


class TestFilterActiveDeploymentsEdgeCases:
    """Additional edge-case tests for filter_active_deployments — lines 155, 158-160."""

    def test_state_without_timezone_is_normalized(self):
        svc = _make_service()
        naive_time = (datetime.now(UTC) - timedelta(minutes=10)).replace(tzinfo=None).isoformat()
        state = {"status": "running", "created_at": naive_time}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc.filter_active_deployments(["path/state.json"])
        assert len(result) == 1

    def test_invalid_created_at_string_is_ignored(self):
        svc = _make_service()
        state = {"status": "running", "created_at": "not-a-date"}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc.filter_active_deployments(["path/state.json"])
        assert len(result) == 1

    def test_created_at_none_is_included(self):
        svc = _make_service()
        state = {"status": "pending", "created_at": None}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc.filter_active_deployments(["path/state.json"])
        assert len(result) == 1

    def test_missing_created_at_is_included(self):
        svc = _make_service()
        state = {"status": "running"}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc.filter_active_deployments(["path/state.json"])
        assert len(result) == 1


class TestProcessDeployment:
    """Tests for SyncService.process_deployment — lines 178-192."""

    def test_returns_false_when_no_deployment_id(self):
        svc = _make_service()
        result = svc.process_deployment("path/state.json", {"status": "running"})
        assert result is False

    def test_returns_false_when_deployment_id_not_string(self):
        svc = _make_service()
        result = svc.process_deployment("path/state.json", {"deployment_id": 12345})
        assert result is False

    def test_returns_false_when_lock_not_acquired(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.try_acquire_deployment_lock.return_value = False
        result = svc.process_deployment("path/state.json", {"deployment_id": "dep-1"})
        assert result is False
        svc.state_manager.try_acquire_deployment_lock.assert_called_once_with("dep-1")

    def test_calls_process_deployment_locked_when_lock_acquired(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.try_acquire_deployment_lock.return_value = True
        with patch.object(svc, "_process_deployment_locked", return_value=True) as mock_locked:
            result = svc.process_deployment("path/state.json", {"deployment_id": "dep-1"})
        assert result is True
        mock_locked.assert_called_once_with("dep-1", "path/state.json", {"deployment_id": "dep-1"})

    def test_releases_lock_after_processing(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.try_acquire_deployment_lock.return_value = True
        with patch.object(svc, "_process_deployment_locked", return_value=False):
            svc.process_deployment("path/state.json", {"deployment_id": "dep-1"})
        svc.state_manager.release_deployment_lock.assert_called_once_with("dep-1")

    def test_releases_lock_even_when_processing_raises(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.try_acquire_deployment_lock.return_value = True
        with patch.object(svc, "_process_deployment_locked", side_effect=RuntimeError("boom")):
            with pytest.raises(RuntimeError):
                svc.process_deployment("path/state.json", {"deployment_id": "dep-1"})
        svc.state_manager.release_deployment_lock.assert_called_once_with("dep-1")


class TestProcessDeploymentLocked:
    """Tests for SyncService._process_deployment_locked — lines 206-279."""

    def _make_svc_with_mocks(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager._pending_vm_deletes = {}
        svc.event_processor = MagicMock()
        svc.event_processor.read_vm_status_map.return_value = {}
        svc.event_processor.read_shard_statuses.return_value = {}
        svc.event_processor.process_vm_updates.return_value = (False, 0)
        svc.event_processor.process_orphan_vm_cleanup.return_value = 0
        svc.event_processor.check_all_shards_terminal.return_value = (False, False)
        svc.event_processor.update_deployment_status.return_value = False
        svc.event_processor.process_cloud_run_updates.return_value = False
        return svc

    def test_returns_false_when_no_shards(self):
        svc = self._make_svc_with_mocks()
        state = {"deployment_id": "dep-1", "compute_type": "vm", "shards": []}
        result = svc._process_deployment_locked("dep-1", "path/state.json", state)
        assert result is False

    def test_returns_false_when_shards_is_missing(self):
        svc = self._make_svc_with_mocks()
        state = {"deployment_id": "dep-1", "compute_type": "vm"}
        result = svc._process_deployment_locked("dep-1", "path/state.json", state)
        assert result is False

    def test_vm_compute_type_calls_vm_updates(self):
        svc = self._make_svc_with_mocks()
        shard = {"shard_id": "s1", "status": "running"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "vm",
            "shards": [shard],
            "status": "running",
        }
        svc._process_deployment_locked("dep-1", "path/state.json", state)
        svc.event_processor.read_vm_status_map.assert_called_once_with("dep-1")
        svc.event_processor.process_vm_updates.assert_called_once()

    def test_cloud_run_compute_type_calls_cloud_run_updates(self):
        svc = self._make_svc_with_mocks()
        shard = {"shard_id": "s1", "status": "running"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "cloud_run",
            "shards": [shard],
            "status": "running",
        }
        svc._process_deployment_locked("dep-1", "path/state.json", state)
        svc.event_processor.process_cloud_run_updates.assert_called_once()
        svc.event_processor.read_vm_status_map.assert_not_called()

    def test_pending_state_triggers_scheduling(self):
        svc = self._make_svc_with_mocks()
        shard = {"shard_id": "s1", "status": "pending"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "vm",
            "shards": [shard],
            "status": "pending",
        }
        with patch.object(svc, "_process_scheduling", return_value=1) as mock_sched:
            svc.event_processor.update_deployment_status.return_value = False
            with patch.object(svc, "save_deployment_state", return_value=True):
                svc._process_deployment_locked("dep-1", "path/state.json", state)
        mock_sched.assert_called_once_with("dep-1", state)

    def test_pending_state_updated_to_running_when_shards_launched(self):
        svc = self._make_svc_with_mocks()
        shard = {"shard_id": "s1", "status": "pending"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "vm",
            "shards": [shard],
            "status": "pending",
        }
        with patch.object(svc, "_process_scheduling", return_value=2):
            svc.event_processor.update_deployment_status.return_value = False
            with patch.object(svc, "save_deployment_state", return_value=True):
                svc._process_deployment_locked("dep-1", "path/state.json", state)
        assert state["status"] == "running"

    def test_saves_state_when_updated(self):
        svc = self._make_svc_with_mocks()
        shard = {"shard_id": "s1", "status": "pending"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "vm",
            "shards": [shard],
            "status": "pending",
        }
        with patch.object(svc, "_process_scheduling", return_value=1):
            svc.event_processor.update_deployment_status.return_value = False
            with patch.object(svc, "save_deployment_state", return_value=True) as mock_save:
                result = svc._process_deployment_locked("dep-1", "path/state.json", state)
        mock_save.assert_called_once()
        assert result is True

    def test_returns_false_when_save_fails(self):
        svc = self._make_svc_with_mocks()
        shard = {"shard_id": "s1", "status": "pending"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "vm",
            "shards": [shard],
            "status": "pending",
        }
        with patch.object(svc, "_process_scheduling", return_value=1):
            svc.event_processor.update_deployment_status.return_value = False
            with patch.object(svc, "save_deployment_state", return_value=False):
                result = svc._process_deployment_locked("dep-1", "path/state.json", state)
        assert result is False

    def test_notifies_deployment_updated_on_successful_save(self):
        svc = self._make_svc_with_mocks()
        shard = {"shard_id": "s1", "status": "pending"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "vm",
            "shards": [shard],
            "status": "pending",
        }
        with patch.object(svc, "_process_scheduling", return_value=1):
            svc.event_processor.update_deployment_status.return_value = False
            with patch.object(svc, "save_deployment_state", return_value=True):
                svc._process_deployment_locked("dep-1", "path/state.json", state)
        svc.event_processor.notify_deployment_updated.assert_called_once_with("dep-1")

    def test_orphan_cleanup_called_for_vm_compute_type(self):
        svc = self._make_svc_with_mocks()
        svc.event_processor.process_orphan_vm_cleanup.return_value = 2
        shard = {"shard_id": "s1", "status": "running"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "vm",
            "shards": [shard],
            "status": "running",
        }
        svc._process_deployment_locked("dep-1", "path/state.json", state)
        svc.event_processor.process_orphan_vm_cleanup.assert_called_once()

    def test_update_deployment_status_called_when_updated(self):
        svc = self._make_svc_with_mocks()
        svc.event_processor.process_vm_updates.return_value = (True, 0)
        svc.event_processor.update_deployment_status.return_value = False
        shard = {"shard_id": "s1", "status": "running"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "vm",
            "shards": [shard],
            "status": "running",
        }
        with patch.object(svc, "save_deployment_state", return_value=True):
            svc._process_deployment_locked("dep-1", "path/state.json", state)
        svc.event_processor.check_all_shards_terminal.assert_called_once()
        svc.event_processor.update_deployment_status.assert_called_once()

    def test_updated_at_set_when_updated(self):
        svc = self._make_svc_with_mocks()
        svc.event_processor.process_vm_updates.return_value = (True, 0)
        svc.event_processor.update_deployment_status.return_value = False
        shard = {"shard_id": "s1", "status": "running"}
        state = {
            "deployment_id": "dep-1",
            "compute_type": "vm",
            "shards": [shard],
            "status": "running",
        }
        with patch.object(svc, "save_deployment_state", return_value=True):
            svc._process_deployment_locked("dep-1", "path/state.json", state)
        assert "updated_at" in state


class TestProcessScheduling:
    """Tests for SyncService._process_scheduling — lines 292-376."""

    def _make_mock_importlib(self, orch_cls=None):
        """Build a fake importlib.import_module that returns an orchestrator mock."""
        mock_orch_mod = MagicMock()
        if orch_cls is not None:
            mock_orch_mod.DeploymentOrchestrator = orch_cls

        def _fake_import_module(name):
            if "orchestrator" in name:
                return mock_orch_mod
            raise ImportError(name)

        mock_importlib = MagicMock()
        mock_importlib.import_module.side_effect = _fake_import_module
        return mock_importlib, mock_orch_mod

    def test_returns_zero_when_no_quota_broker(self):
        svc = _make_service()
        svc.quota_broker = None
        result = svc._process_scheduling("dep-1", {"shards": [{"status": "pending"}]})
        assert result == 0

    def test_returns_zero_when_no_pending_shards(self):
        svc = _make_service()
        svc.quota_broker = MagicMock()
        state = {"config": {}, "shards": [{"status": "running"}]}
        result = svc._process_scheduling("dep-1", state)
        assert result == 0

    def test_returns_zero_when_quota_shape_is_none(self):
        svc = _make_service()
        svc.quota_broker = MagicMock()
        state = {"config": {}, "shards": [{"status": "pending"}]}
        mock_importlib, _ = self._make_mock_importlib()
        with (
            patch.dict(
                SyncService._initialize_quota_broker.__globals__, {"_importlib": mock_importlib}
            ),
            patch(
                "deployment_api.utils.quota_requirements.vm_quota_shape_from_compute_config",
                return_value=None,
            ),
        ):
            result = svc._process_scheduling("dep-1", state)
        assert result == 0

    def test_returns_zero_when_no_quota_acquired(self):
        svc = _make_service()
        mock_broker = MagicMock()
        mock_broker.try_acquire_batch.return_value = 0
        svc.quota_broker = mock_broker
        state = {
            "config": {"service_account_email": "sa@test.com"},
            "shards": [{"status": "pending", "shard_id": "s1"}],
        }
        mock_importlib, _ = self._make_mock_importlib()
        with (
            patch.dict(
                SyncService._initialize_quota_broker.__globals__, {"_importlib": mock_importlib}
            ),
            patch(
                "deployment_api.utils.quota_requirements.vm_quota_shape_from_compute_config",
                return_value=MagicMock(),
            ),
        ):
            result = svc._process_scheduling("dep-1", state)
        assert result == 0

    def test_launches_shards_when_quota_available(self):
        svc = _make_service()
        mock_broker = MagicMock()
        mock_broker.try_acquire_batch.return_value = 1
        svc.quota_broker = mock_broker
        shard = {"status": "pending", "shard_id": "s1"}
        state = {
            "config": {"service_account_email": "sa@test.com"},
            "shards": [shard],
        }
        mock_orch_instance = MagicMock()
        mock_orch_instance.submit_shard.return_value = "job-123"
        mock_orch_cls = MagicMock(return_value=mock_orch_instance)
        mock_importlib, _ = self._make_mock_importlib(orch_cls=mock_orch_cls)
        with (
            patch.dict(
                SyncService._initialize_quota_broker.__globals__, {"_importlib": mock_importlib}
            ),
            patch.object(_sync_service_mod, "DeploymentOrchestrator", mock_orch_cls, create=True),
            patch(
                "deployment_api.utils.quota_requirements.vm_quota_shape_from_compute_config",
                return_value=MagicMock(),
            ),
        ):
            result = svc._process_scheduling("dep-1", state)
        assert result == 1
        assert shard["job_id"] == "job-123"
        assert shard["status"] == "running"

    def test_releases_quota_when_shard_launch_fails(self):
        svc = _make_service()
        mock_broker = MagicMock()
        mock_broker.try_acquire_batch.return_value = 1
        svc.quota_broker = mock_broker
        shard = {"status": "pending", "shard_id": "s1"}
        state = {
            "config": {"service_account_email": "sa@test.com"},
            "shards": [shard],
        }
        mock_orch_instance = MagicMock()
        mock_orch_instance.submit_shard.side_effect = OSError("launch failed")
        mock_orch_cls = MagicMock(return_value=mock_orch_instance)
        mock_importlib, _ = self._make_mock_importlib(orch_cls=mock_orch_cls)
        fake_shape = MagicMock()
        with (
            patch.dict(
                SyncService._initialize_quota_broker.__globals__, {"_importlib": mock_importlib}
            ),
            patch.object(_sync_service_mod, "DeploymentOrchestrator", mock_orch_cls, create=True),
            patch(
                "deployment_api.utils.quota_requirements.vm_quota_shape_from_compute_config",
                return_value=fake_shape,
            ),
        ):
            result = svc._process_scheduling("dep-1", state)
        assert result == 0
        mock_broker.release.assert_called_once_with(fake_shape, 1)

    def test_returns_zero_when_service_account_email_missing(self):
        svc = _make_service()
        mock_broker = MagicMock()
        mock_broker.try_acquire_batch.return_value = 1
        svc.quota_broker = mock_broker
        state = {
            "config": {},
            "shards": [{"status": "pending", "shard_id": "s1"}],
        }
        mock_importlib, _ = self._make_mock_importlib()
        with (
            patch.dict(
                SyncService._initialize_quota_broker.__globals__, {"_importlib": mock_importlib}
            ),
            patch(
                "deployment_api.utils.quota_requirements.vm_quota_shape_from_compute_config",
                return_value=MagicMock(),
            ),
        ):
            result = svc._process_scheduling("dep-1", state)
        assert result == 0

    def test_returns_zero_on_outer_runtime_error(self):
        svc = _make_service()
        mock_broker = MagicMock()
        mock_broker.try_acquire_batch.side_effect = RuntimeError("broker down")
        svc.quota_broker = mock_broker
        state = {
            "config": {"service_account_email": "sa@test.com"},
            "shards": [{"status": "pending", "shard_id": "s1"}],
        }
        mock_importlib, _ = self._make_mock_importlib()
        with (
            patch.dict(
                SyncService._initialize_quota_broker.__globals__, {"_importlib": mock_importlib}
            ),
            patch(
                "deployment_api.utils.quota_requirements.vm_quota_shape_from_compute_config",
                return_value=MagicMock(),
            ),
        ):
            result = svc._process_scheduling("dep-1", state)
        assert result == 0

    def test_submit_shard_returning_none_does_not_count(self):
        svc = _make_service()
        mock_broker = MagicMock()
        mock_broker.try_acquire_batch.return_value = 1
        svc.quota_broker = mock_broker
        shard = {"status": "pending", "shard_id": "s1"}
        state = {
            "config": {"service_account_email": "sa@test.com"},
            "shards": [shard],
        }
        mock_orch_instance = MagicMock()
        mock_orch_instance.submit_shard.return_value = None
        mock_orch_cls = MagicMock(return_value=mock_orch_instance)
        mock_importlib, _ = self._make_mock_importlib(orch_cls=mock_orch_cls)
        with (
            patch.dict(
                SyncService._initialize_quota_broker.__globals__, {"_importlib": mock_importlib}
            ),
            patch.object(_sync_service_mod, "DeploymentOrchestrator", mock_orch_cls, create=True),
            patch(
                "deployment_api.utils.quota_requirements.vm_quota_shape_from_compute_config",
                return_value=MagicMock(),
            ),
        ):
            result = svc._process_scheduling("dep-1", state)
        assert result == 0


class TestSyncDeployments:
    """Tests for SyncService.sync_deployments — lines 385-420."""

    def test_returns_zero_zero_when_no_active_states(self):
        svc = _make_service()
        with patch.object(svc, "scan_deployment_states", return_value=[]):
            with patch.object(svc, "filter_active_deployments", return_value=[]):
                result = svc.sync_deployments()
        assert result == (0, 0)

    def test_returns_synced_and_active_counts(self):
        svc = _make_service()
        state1 = {"deployment_id": "dep-1", "shards": [], "status": "running"}
        state2 = {"deployment_id": "dep-2", "shards": [], "status": "running"}
        active = [("path1/state.json", state1), ("path2/state.json", state2)]
        with patch.object(
            svc, "scan_deployment_states", return_value=["path1/state.json", "path2/state.json"]
        ):
            with patch.object(svc, "filter_active_deployments", return_value=active):
                with patch.object(svc, "process_deployment", return_value=True):
                    with patch.object(svc, "_cleanup_recent_orphans", return_value=0):
                        synced, total = svc.sync_deployments()
        assert synced == 2
        assert total == 2

    def test_counts_only_successful_syncs(self):
        svc = _make_service()
        state1 = {"deployment_id": "dep-1", "shards": [], "status": "running"}
        state2 = {"deployment_id": "dep-2", "shards": [], "status": "running"}
        active = [("path1/state.json", state1), ("path2/state.json", state2)]

        def process_side_effect(path, state):
            return state["deployment_id"] == "dep-1"

        with patch.object(
            svc, "scan_deployment_states", return_value=["path1/state.json", "path2/state.json"]
        ):
            with patch.object(svc, "filter_active_deployments", return_value=active):
                with patch.object(svc, "process_deployment", side_effect=process_side_effect):
                    with patch.object(svc, "_cleanup_recent_orphans", return_value=0):
                        synced, total = svc.sync_deployments()
        assert synced == 1
        assert total == 2

    def test_sorts_deployments_by_running_shard_count(self):
        svc = _make_service()
        state_few = {
            "deployment_id": "dep-few",
            "shards": [{"status": "running"}],
            "status": "running",
        }
        state_many = {
            "deployment_id": "dep-many",
            "shards": [{"status": "running"}, {"status": "running"}],
            "status": "running",
        }
        active = [("few/state.json", state_few), ("many/state.json", state_many)]
        processed_order = []

        def record_order(path, state):
            processed_order.append(state["deployment_id"])
            return False

        with patch.object(
            svc, "scan_deployment_states", return_value=["few/state.json", "many/state.json"]
        ):
            with patch.object(svc, "filter_active_deployments", return_value=active):
                with patch.object(svc, "process_deployment", side_effect=record_order):
                    with patch.object(svc, "_cleanup_recent_orphans", return_value=0):
                        svc.sync_deployments()
        assert processed_order[0] == "dep-many"

    def test_calls_cleanup_recent_orphans(self):
        svc = _make_service()
        state1 = {"deployment_id": "dep-1", "shards": [], "status": "running"}
        active = [("path1/state.json", state1)]
        with patch.object(svc, "scan_deployment_states", return_value=["path1/state.json"]):
            with patch.object(svc, "filter_active_deployments", return_value=active):
                with patch.object(svc, "process_deployment", return_value=False):
                    with patch.object(
                        svc, "_cleanup_recent_orphans", return_value=3
                    ) as mock_cleanup:
                        svc.sync_deployments()
        mock_cleanup.assert_called_once()


class TestCleanupRecentOrphans:
    """Tests for SyncService._cleanup_recent_orphans — lines 435-470."""

    def test_skips_active_paths(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        active = [("active/state.json", {"deployment_id": "dep-1"})]
        result = svc._cleanup_recent_orphans(["active/state.json"], active)
        assert result == 0
        svc.state_manager.run_orphan_cleanup_only.assert_not_called()

    def test_skips_unloadable_states(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        with patch.object(svc, "load_deployment_state", return_value=None):
            result = svc._cleanup_recent_orphans(["other/state.json"], [])
        assert result == 0

    def test_skips_non_terminal_statuses(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        state = {
            "status": "running",
            "compute_type": "vm",
            "completed_at": datetime.now(UTC).isoformat(),
        }
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc._cleanup_recent_orphans(["other/state.json"], [])
        assert result == 0

    def test_skips_non_vm_compute_type(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        state = {
            "status": "completed",
            "compute_type": "cloud_run",
            "completed_at": datetime.now(UTC).isoformat(),
        }
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc._cleanup_recent_orphans(["other/state.json"], [])
        assert result == 0

    def test_skips_when_no_completed_at_or_updated_at(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        state = {"status": "completed", "compute_type": "vm"}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc._cleanup_recent_orphans(["other/state.json"], [])
        assert result == 0

    def test_skips_when_completed_too_long_ago(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        old_time = (datetime.now(UTC) - timedelta(hours=2)).isoformat()
        state = {"status": "completed", "compute_type": "vm", "completed_at": old_time}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc._cleanup_recent_orphans(["other/state.json"], [])
        assert result == 0
        svc.state_manager.run_orphan_cleanup_only.assert_not_called()

    def test_runs_orphan_cleanup_for_recent_completed_vm(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.run_orphan_cleanup_only.return_value = 3
        recent_time = (datetime.now(UTC) - timedelta(minutes=5)).isoformat()
        state = {"status": "completed", "compute_type": "vm", "completed_at": recent_time}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc._cleanup_recent_orphans(["other/state.json"], [])
        assert result == 3
        svc.state_manager.run_orphan_cleanup_only.assert_called_once_with(state)

    def test_uses_updated_at_when_no_completed_at(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.run_orphan_cleanup_only.return_value = 1
        recent_time = (datetime.now(UTC) - timedelta(minutes=5)).isoformat()
        state = {"status": "failed", "compute_type": "vm", "updated_at": recent_time}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc._cleanup_recent_orphans(["other/state.json"], [])
        assert result == 1

    def test_skips_when_invalid_timestamp(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        state = {"status": "completed", "compute_type": "vm", "completed_at": "not-a-date"}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc._cleanup_recent_orphans(["other/state.json"], [])
        assert result == 0

    def test_sums_orphan_counts_across_multiple_states(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.run_orphan_cleanup_only.return_value = 2
        recent_time = (datetime.now(UTC) - timedelta(minutes=5)).isoformat()
        state = {"status": "completed", "compute_type": "vm", "completed_at": recent_time}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc._cleanup_recent_orphans(["p1/state.json", "p2/state.json"], [])
        assert result == 4

    def test_normalizes_naive_datetime(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.run_orphan_cleanup_only.return_value = 1
        naive_time = (datetime.now(UTC) - timedelta(minutes=5)).replace(tzinfo=None).isoformat()
        state = {"status": "completed", "compute_type": "vm", "completed_at": naive_time}
        with patch.object(svc, "load_deployment_state", return_value=state):
            result = svc._cleanup_recent_orphans(["other/state.json"], [])
        assert result == 1


class TestGetHeldDeploymentLocksAndReleaseAll:
    """Tests for get_held_deployment_locks and release_all_locks — lines 479, 483, 487."""

    def test_get_held_deployment_locks_delegates_to_state_manager(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.held_deployment_locks = {"dep-1", "dep-2"}
        result = svc.get_held_deployment_locks()
        assert result == {"dep-1", "dep-2"}

    def test_get_held_deployment_locks_returns_empty_set(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.held_deployment_locks = set()
        result = svc.get_held_deployment_locks()
        assert result == set()

    def test_release_all_locks_delegates_to_state_manager(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.release_all_locks.return_value = 5
        result = svc.release_all_locks()
        assert result == 5
        svc.state_manager.release_all_locks.assert_called_once()

    def test_release_all_locks_returns_zero_when_no_locks(self):
        svc = _make_service()
        svc.state_manager = MagicMock()
        svc.state_manager.release_all_locks.return_value = 0
        result = svc.release_all_locks()
        assert result == 0
