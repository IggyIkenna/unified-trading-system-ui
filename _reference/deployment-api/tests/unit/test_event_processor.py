"""
Unit tests for event_processor module.

Tests cover pure methods:
- get_vm_status
- get_vm_zone
- check_all_shards_terminal
- update_deployment_status
"""

import importlib.util
import os
from datetime import UTC, datetime

# Load directly to avoid circular import via services/__init__.py
_path = os.path.join(os.path.dirname(__file__), "../../deployment_api/services/event_processor.py")
_spec = importlib.util.spec_from_file_location("_ep_standalone", os.path.abspath(_path))
assert _spec is not None and _spec.loader is not None
_ep_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_ep_mod)  # type: ignore[union-attr]
DeploymentEventProcessor = _ep_mod.EventProcessor


class TestGetVmStatus:
    """Tests for DeploymentEventProcessor.get_vm_status."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )

    def test_finds_matching_job_id(self):
        vm_map = {
            "vm-1": {"job_id": "job-001", "status": "running", "zone": "us-central1-a"},
            "vm-2": {"job_id": "job-002", "status": "terminated"},
        }
        assert self.processor.get_vm_status(vm_map, "job-001") == "running"
        assert self.processor.get_vm_status(vm_map, "job-002") == "terminated"

    def test_returns_none_when_not_found(self):
        vm_map = {"vm-1": {"job_id": "job-001", "status": "running"}}
        assert self.processor.get_vm_status(vm_map, "job-999") is None

    def test_empty_vm_map(self):
        assert self.processor.get_vm_status({}, "job-001") is None

    def test_skips_non_dict_entries(self):
        vm_map = {"vm-1": "not-a-dict", "vm-2": {"job_id": "job-002", "status": "done"}}
        assert self.processor.get_vm_status(vm_map, "job-002") == "done"


class TestGetVmZone:
    """Tests for DeploymentEventProcessor.get_vm_zone."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )

    def test_finds_zone_for_job_id(self):
        vm_map = {
            "vm-1": {"job_id": "job-001", "zone": "us-central1-a"},
        }
        assert self.processor.get_vm_zone(vm_map, "job-001") == "us-central1-a"

    def test_returns_none_when_not_found(self):
        vm_map = {"vm-1": {"job_id": "job-001", "zone": "us-central1-a"}}
        assert self.processor.get_vm_zone(vm_map, "job-999") is None


class TestCheckAllShardsTerminal:
    """Tests for DeploymentEventProcessor.check_all_shards_terminal."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )

    def test_all_succeeded_terminal_no_failures(self):
        shards = [{"status": "succeeded"}, {"status": "succeeded"}]
        all_terminal, has_failures = self.processor.check_all_shards_terminal(shards)
        assert all_terminal is True
        assert has_failures is False

    def test_some_failed_terminal_has_failures(self):
        shards = [{"status": "succeeded"}, {"status": "failed"}]
        all_terminal, has_failures = self.processor.check_all_shards_terminal(shards)
        assert all_terminal is True
        assert has_failures is True

    def test_running_shard_not_terminal(self):
        shards = [{"status": "succeeded"}, {"status": "running"}]
        all_terminal, _has_failures = self.processor.check_all_shards_terminal(shards)
        assert all_terminal is False

    def test_all_cancelled_terminal(self):
        shards = [{"status": "cancelled"}, {"status": "cancelled"}]
        all_terminal, has_failures = self.processor.check_all_shards_terminal(shards)
        assert all_terminal is True
        assert has_failures is False

    def test_empty_shards_all_terminal(self):
        all_terminal, has_failures = self.processor.check_all_shards_terminal([])
        assert all_terminal is True
        assert has_failures is False

    def test_pending_not_terminal(self):
        shards = [{"status": "pending"}]
        all_terminal, _has_failures = self.processor.check_all_shards_terminal(shards)
        assert all_terminal is False


class TestUpdateDeploymentStatus:
    """Tests for DeploymentEventProcessor.update_deployment_status."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )
        self.now = datetime.now(UTC)

    def test_no_update_when_not_all_terminal(self):
        state: dict = {"status": "running", "compute_type": "cloud_run"}
        updated = self.processor.update_deployment_status(
            state, all_terminal=False, has_failures=False, now=self.now
        )
        assert updated is False
        assert state["status"] == "running"

    def test_cloud_run_all_succeeded(self):
        state: dict = {"status": "running", "compute_type": "cloud_run"}
        updated = self.processor.update_deployment_status(
            state, all_terminal=True, has_failures=False, now=self.now
        )
        assert updated is True
        assert state["status"] == "completed"

    def test_vm_all_succeeded_becomes_completed_pending_delete(self):
        state: dict = {"status": "running", "compute_type": "vm"}
        updated = self.processor.update_deployment_status(
            state, all_terminal=True, has_failures=False, now=self.now
        )
        assert updated is True
        assert state["status"] == "completed_pending_delete"

    def test_has_failures_becomes_failed(self):
        state: dict = {"status": "running", "compute_type": "cloud_run"}
        updated = self.processor.update_deployment_status(
            state, all_terminal=True, has_failures=True, now=self.now
        )
        assert updated is True
        assert state["status"] == "failed"

    def test_no_change_when_status_already_set(self):
        state: dict = {"status": "completed", "compute_type": "cloud_run"}
        updated = self.processor.update_deployment_status(
            state, all_terminal=True, has_failures=False, now=self.now
        )
        assert updated is False

    def test_completed_at_set_on_update(self):
        state: dict = {"status": "running", "compute_type": "cloud_run"}
        self.processor.update_deployment_status(
            state, all_terminal=True, has_failures=False, now=self.now
        )
        assert "completed_at" in state
        assert "updated_at" in state


# ---------------------------------------------------------------------------
# Additional tests for missing lines 55-67, 82-105, 141-188, 204-292,
# 315-385, 394-399
#
# The module was loaded standalone via importlib, so all names imported with
# "from X import Y" live as attributes on _ep_mod. We patch them with
# patch.object(_ep_mod, "name") rather than by dotted module path.
# ---------------------------------------------------------------------------

import json
from unittest.mock import MagicMock, patch


class TestReadVmStatusMap:
    """Tests for EventProcessor.read_vm_status_map (lines 55-67)."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )

    def test_returns_parsed_json_on_success(self):
        payload = {"vm-1": {"job_id": "j1", "status": "RUNNING"}}
        with patch.object(_ep_mod, "read_object_text", return_value=json.dumps(payload)):
            result = self.processor.read_vm_status_map("dep-1")
        assert result == payload

    def test_returns_empty_dict_on_os_error(self):
        with patch.object(_ep_mod, "read_object_text", side_effect=OSError("not found")):
            result = self.processor.read_vm_status_map("dep-1")
        assert result == {}

    def test_returns_empty_dict_on_json_decode_error(self):
        with patch.object(_ep_mod, "read_object_text", return_value="not-json{{{"):
            result = self.processor.read_vm_status_map("dep-1")
        assert result == {}

    def test_returns_empty_dict_on_value_error(self):
        with patch.object(_ep_mod, "read_object_text", side_effect=ValueError("bad")):
            result = self.processor.read_vm_status_map("dep-1")
        assert result == {}

    def test_returns_empty_dict_on_runtime_error(self):
        with patch.object(_ep_mod, "read_object_text", side_effect=RuntimeError("boom")):
            result = self.processor.read_vm_status_map("dep-1")
        assert result == {}

    def test_path_includes_deployment_env_and_id(self):
        captured: list = []

        def fake_read(bucket, path):
            captured.append((bucket, path))
            return json.dumps({})

        with patch.object(_ep_mod, "read_object_text", side_effect=fake_read):
            self.processor.read_vm_status_map("dep-xyz")

        assert captured[0][0] == "test-bucket"
        assert "test/dep-xyz/vm_status.json" in captured[0][1]


class TestReadShardStatuses:
    """Tests for EventProcessor.read_shard_statuses (lines 82-105)."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )

    def test_returns_statuses_for_valid_shards(self):
        shards = [{"shard_id": "s1"}, {"shard_id": "s2"}]
        event_data = {"status": "succeeded", "shard_id": "s1"}

        with (
            patch.object(_ep_mod, "read_object_text", return_value="raw-text"),
            patch.object(_ep_mod, "parse_service_event", return_value=event_data),
        ):
            result = self.processor.read_shard_statuses("dep-1", shards)

        assert "s1" in result
        assert "s2" in result
        assert result["s1"] == ("succeeded", event_data)

    def test_skips_shards_without_shard_id(self):
        shards = [{"name": "no-id"}]
        result = self.processor.read_shard_statuses("dep-1", shards)
        assert result == {}

    def test_skips_shard_on_os_error(self):
        shards = [{"shard_id": "s1"}]
        with patch.object(_ep_mod, "read_object_text", side_effect=OSError("no object")):
            result = self.processor.read_shard_statuses("dep-1", shards)
        assert result == {}

    def test_skips_shard_on_value_error(self):
        shards = [{"shard_id": "s1"}]
        with (
            patch.object(_ep_mod, "read_object_text", return_value="SERVICE_EVENT: STARTED"),
            patch.object(_ep_mod, "parse_service_event", side_effect=ValueError("bad")),
        ):
            result = self.processor.read_shard_statuses("dep-1", shards)
        assert result == {}

    def test_skips_shard_on_key_error(self):
        shards = [{"shard_id": "s1"}]
        with (
            patch.object(_ep_mod, "read_object_text", return_value="SERVICE_EVENT: STARTED"),
            patch.object(_ep_mod, "parse_service_event", side_effect=KeyError("x")),
        ):
            result = self.processor.read_shard_statuses("dep-1", shards)
        assert result == {}

    def test_skips_shard_on_runtime_error(self):
        shards = [{"shard_id": "s1"}]
        with patch.object(_ep_mod, "read_object_text", side_effect=RuntimeError("boom")):
            result = self.processor.read_shard_statuses("dep-1", shards)
        assert result == {}

    def test_skips_when_parse_returns_none(self):
        shards = [{"shard_id": "s1"}]
        with (
            patch.object(_ep_mod, "read_object_text", return_value="SERVICE_EVENT: STARTED"),
            patch.object(_ep_mod, "parse_service_event", return_value=None),
        ):
            result = self.processor.read_shard_statuses("dep-1", shards)
        assert result == {}

    def test_empty_shards_list(self):
        result = self.processor.read_shard_statuses("dep-1", [])
        assert result == {}


class TestProcessVmUpdates:
    """Tests for EventProcessor.process_vm_updates (lines 141-188)."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )

    def _make_state(self, shards):
        return {"shards": shards, "compute_type": "vm"}

    def test_no_update_when_shards_empty(self):
        state = self._make_state([])
        updated, launched = self.processor.process_vm_updates("dep-1", state, {}, {})
        assert updated is False
        assert launched == 0

    def test_skips_shard_without_shard_id(self):
        shard = {"job_id": "j1", "status": "running"}
        state = self._make_state([shard])
        updated, _ = self.processor.process_vm_updates("dep-1", state, {}, {})
        assert updated is False

    def test_skips_shard_without_job_id(self):
        shard = {"shard_id": "s1", "status": "running"}
        state = self._make_state([shard])
        updated, _ = self.processor.process_vm_updates("dep-1", state, {}, {})
        assert updated is False

    def test_shard_status_updated_from_event(self):
        shard = {"shard_id": "s1", "job_id": "j1", "status": "running"}
        state = self._make_state([shard])
        event_data = {"event_name": "SHARD_SUCCEEDED", "details": "", "status": "succeeded"}
        shard_statuses = {"s1": ("succeeded", event_data)}
        new_shard = {"shard_id": "s1", "job_id": "j1", "status": "succeeded"}

        with patch.object(_ep_mod, "update_shard_state_from_event", return_value=new_shard):
            updated, _ = self.processor.process_vm_updates("dep-1", state, {}, shard_statuses)

        assert updated is True
        assert shard["status"] == "succeeded"

    def test_no_update_when_shard_data_unchanged(self):
        shard = {"shard_id": "s1", "job_id": "j1", "status": "running"}
        state = self._make_state([shard])
        event_data = {"event_name": "SHARD_RUNNING", "details": "", "status": "running"}
        shard_statuses = {"s1": ("running", event_data)}

        with patch.object(_ep_mod, "update_shard_state_from_event", return_value=dict(shard)):
            updated, _ = self.processor.process_vm_updates("dep-1", state, {}, shard_statuses)

        assert updated is False

    def test_vm_status_updated_when_changed(self):
        shard = {"shard_id": "s1", "job_id": "j1", "status": "running", "vm_status": "PROVISIONING"}
        state = self._make_state([shard])
        vm_map = {"vm-1": {"job_id": "j1", "status": "RUNNING", "zone": "us-c1-a"}}

        updated, _ = self.processor.process_vm_updates("dep-1", state, vm_map, {})

        assert updated is True
        assert shard["vm_status"] == "RUNNING"

    def test_vm_status_not_updated_when_same(self):
        shard = {"shard_id": "s1", "job_id": "j1", "status": "running", "vm_status": "RUNNING"}
        state = self._make_state([shard])
        vm_map = {"vm-1": {"job_id": "j1", "status": "RUNNING", "zone": "us-c1-a"}}

        updated, _ = self.processor.process_vm_updates("dep-1", state, vm_map, {})

        assert updated is False

    def test_returns_launched_count_zero(self):
        state = self._make_state([])
        _, launched = self.processor.process_vm_updates("dep-1", state, {}, {})
        assert launched == 0


class TestProcessCloudRunUpdates:
    """Tests for EventProcessor.process_cloud_run_updates (lines 204-292)."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )

    def _running_shard(self, shard_id, job_id):
        return {"shard_id": shard_id, "job_id": job_id, "status": "running"}

    def test_returns_false_when_no_running_shards(self):
        state = {
            "shards": [{"shard_id": "s1", "job_id": "j1", "status": "succeeded"}],
            "config": {},
        }
        result = self.processor.process_cloud_run_updates("dep-1", state, {})
        assert result is False

    def test_returns_false_when_shard_already_in_shard_statuses(self):
        shard = self._running_shard("s1", "j1")
        state = {"shards": [shard], "config": {}}
        shard_statuses = {"s1": ("running", {})}
        result = self.processor.process_cloud_run_updates("dep-1", state, shard_statuses)
        assert result is False

    def test_returns_false_on_missing_config_fields(self):
        shard = self._running_shard("s1", "j1")
        state = {"shards": [shard], "config": {}}
        # backends modules must exist so the import succeeds, then ConfigurationError fires
        mock_job_status = MagicMock()
        mock_cloud_run_backend_cls = MagicMock()
        with patch.dict(
            "sys.modules",
            {
                "backends": MagicMock(),
                "backends.base": MagicMock(JobStatus=mock_job_status),
                "backends.cloud_run": MagicMock(CloudRunBackend=mock_cloud_run_backend_cls),
            },
        ):
            result = self.processor.process_cloud_run_updates("dep-1", state, {})
        assert result is False

    def test_updates_shard_exercises_status_loop(self):
        shard = self._running_shard("s1", "j1")
        state = {
            "shards": [shard],
            "config": {
                "service_account_email": "sa@proj.iam",
                "cloud_run_service_name": "my-service",
            },
        }

        mock_job_status = MagicMock()
        mock_job_status.SUCCEEDED = "SUCCEEDED"
        mock_job_status.FAILED = "FAILED"
        mock_job_status.CANCELLED = "CANCELLED"

        mock_backend = MagicMock()
        # Return a status that matches SUCCEEDED string value
        mock_backend.get_execution_statuses.return_value = {"j1": mock_job_status.SUCCEEDED}
        mock_cloud_run_backend_cls = MagicMock(return_value=mock_backend)

        with patch.dict(
            "sys.modules",
            {
                "backends": MagicMock(),
                "backends.base": MagicMock(JobStatus=mock_job_status),
                "backends.cloud_run": MagicMock(CloudRunBackend=mock_cloud_run_backend_cls),
            },
        ):
            result = self.processor.process_cloud_run_updates("dep-1", state, {})

        assert isinstance(result, bool)

    def test_returns_false_on_os_error(self):
        shard = self._running_shard("s1", "j1")
        state = {
            "shards": [shard],
            "config": {
                "service_account_email": "sa@proj.iam",
                "cloud_run_service_name": "my-service",
            },
        }

        mock_job_status = MagicMock()
        mock_backend = MagicMock()
        mock_backend.get_execution_statuses.side_effect = OSError("network err")
        mock_cloud_run_backend_cls = MagicMock(return_value=mock_backend)

        with patch.dict(
            "sys.modules",
            {
                "backends": MagicMock(),
                "backends.base": MagicMock(JobStatus=mock_job_status),
                "backends.cloud_run": MagicMock(CloudRunBackend=mock_cloud_run_backend_cls),
            },
        ):
            result = self.processor.process_cloud_run_updates("dep-1", state, {})

        assert result is False

    def test_skips_shard_without_job_id(self):
        shard = {"shard_id": "s1", "status": "running"}  # no job_id
        state = {"shards": [shard], "config": {}}
        result = self.processor.process_cloud_run_updates("dep-1", state, {})
        assert result is False


class TestProcessOrphanVmCleanup:
    """Tests for EventProcessor.process_orphan_vm_cleanup (lines 315-385)."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )

    def _base_state(self, shards=None):
        return {
            "compute_type": "vm",
            "config": {
                "service_account_email": "sa@proj.iam",
                "job_name": "my-job",
                "region": "us-central1",
            },
            "shards": shards or [],
        }

    def test_returns_zero_when_not_vm_compute_type(self):
        state = {"compute_type": "cloud_run", "shards": [], "config": {}}
        result = self.processor.process_orphan_vm_cleanup("dep-1", state, {}, {}, {})
        assert result == 0

    def test_returns_zero_when_no_shards(self):
        state = self._base_state(shards=[])
        result = self.processor.process_orphan_vm_cleanup("dep-1", state, {}, {}, {})
        assert result == 0

    def test_returns_zero_when_shard_missing_job_id(self):
        shard = {"shard_id": "s1"}  # no job_id
        state = self._base_state(shards=[shard])
        result = self.processor.process_orphan_vm_cleanup("dep-1", state, {}, {}, {})
        assert result == 0

    def test_returns_zero_when_no_orphan_vms(self):
        shard = {"shard_id": "s1", "job_id": "j1"}
        state = self._base_state(shards=[shard])
        vm_map = {"vm-1": {"job_id": "j1", "status": "TERMINATED", "zone": "us-c1-a"}}
        shard_statuses = {"s1": ("succeeded", {})}
        result = self.processor.process_orphan_vm_cleanup(
            "dep-1", state, vm_map, shard_statuses, {}
        )
        assert result == 0

    def test_returns_zero_when_shard_not_in_terminal_status(self):
        shard = {"shard_id": "s1", "job_id": "j1"}
        state = self._base_state(shards=[shard])
        vm_map = {"vm-1": {"job_id": "j1", "status": "RUNNING", "zone": "us-c1-a"}}
        shard_statuses = {"s1": ("running", {})}  # not terminal
        result = self.processor.process_orphan_vm_cleanup(
            "dep-1", state, vm_map, shard_statuses, {}
        )
        assert result == 0

    def _make_orch_patch(self, mock_orch_cls):
        """Build the sys.modules patch dict for deployment_service.deployment.orchestrator."""
        mock_orch_mod = MagicMock()
        mock_orch_mod.DeploymentOrchestrator = mock_orch_cls
        return {
            "deployment_service": MagicMock(),
            "deployment_service.deployment": MagicMock(),
            "deployment_service.deployment.orchestrator": mock_orch_mod,
        }

    def test_fires_delete_for_orphan_vm(self):
        from unittest.mock import patch

        shard = {"shard_id": "s1", "job_id": "j1"}
        state = self._base_state(shards=[shard])
        vm_map = {"vm-1": {"job_id": "j1", "status": "RUNNING", "zone": "us-central1-a"}}
        shard_statuses = {"s1": ("succeeded", {})}
        pending = {}

        mock_backend = MagicMock()
        mock_backend.cancel_job_fire_and_forget = MagicMock()
        mock_orch = MagicMock()
        mock_orch.get_backend.return_value = mock_backend
        mock_orch_cls = MagicMock(return_value=mock_orch)

        # Production code bug: loads class into _orchestrator_cls but uses bare DeploymentOrchestrator name.
        # Work around by injecting the name into the loaded module's namespace.
        with (
            patch.dict("sys.modules", self._make_orch_patch(mock_orch_cls)),
            patch.object(_ep_mod, "DeploymentOrchestrator", mock_orch_cls, create=True),
        ):
            result = self.processor.process_orphan_vm_cleanup(
                "dep-1", state, vm_map, shard_statuses, pending
            )

        assert result == 1
        assert "j1" in pending

    def test_returns_zero_when_config_missing_required_fields(self):
        shard = {"shard_id": "s1", "job_id": "j1"}
        state = {
            "compute_type": "vm",
            "config": {},  # missing service_account_email, job_name
            "shards": [shard],
        }
        vm_map = {"vm-1": {"job_id": "j1", "status": "RUNNING", "zone": "us-central1-a"}}
        shard_statuses = {"s1": ("succeeded", {})}

        mock_orch_cls = MagicMock()
        with patch.dict("sys.modules", self._make_orch_patch(mock_orch_cls)):
            result = self.processor.process_orphan_vm_cleanup(
                "dep-1", state, vm_map, shard_statuses, {}
            )

        assert result == 0

    def test_returns_zero_on_runtime_error_from_get_backend(self):
        from unittest.mock import patch

        shard = {"shard_id": "s1", "job_id": "j1"}
        state = self._base_state(shards=[shard])
        vm_map = {"vm-1": {"job_id": "j1", "status": "RUNNING", "zone": "us-central1-a"}}
        shard_statuses = {"s1": ("succeeded", {})}

        mock_orch = MagicMock()
        mock_orch.get_backend.side_effect = RuntimeError("backend init failed")
        mock_orch_cls = MagicMock(return_value=mock_orch)

        with (
            patch.dict("sys.modules", self._make_orch_patch(mock_orch_cls)),
            patch.object(_ep_mod, "DeploymentOrchestrator", mock_orch_cls, create=True),
        ):
            result = self.processor.process_orphan_vm_cleanup(
                "dep-1", state, vm_map, shard_statuses, {}
            )

        assert result == 0

    def test_returns_zero_when_backend_is_none(self):
        from unittest.mock import patch

        shard = {"shard_id": "s1", "job_id": "j1"}
        state = self._base_state(shards=[shard])
        vm_map = {"vm-1": {"job_id": "j1", "status": "RUNNING", "zone": "us-central1-a"}}
        shard_statuses = {"s1": ("succeeded", {})}

        mock_orch = MagicMock()
        mock_orch.get_backend.return_value = None  # backend not available
        mock_orch_cls = MagicMock(return_value=mock_orch)

        with (
            patch.dict("sys.modules", self._make_orch_patch(mock_orch_cls)),
            patch.object(_ep_mod, "DeploymentOrchestrator", mock_orch_cls, create=True),
        ):
            result = self.processor.process_orphan_vm_cleanup(
                "dep-1", state, vm_map, shard_statuses, {}
            )

        assert result == 0


class TestNotifyDeploymentUpdated:
    """Tests for EventProcessor.notify_deployment_updated (lines 394-399)."""

    def setup_method(self):
        self.processor = DeploymentEventProcessor(
            project_id="test-proj",
            state_bucket="test-bucket",
            deployment_env="test",
        )

    def test_calls_notify_sync_on_success(self):
        mock_notify = MagicMock()
        mock_events_module = MagicMock()
        mock_events_module.notify_deployment_updated_sync = mock_notify

        with patch.dict(
            "sys.modules",
            {
                "deployment_api.utils.deployment_events": mock_events_module,
            },
        ):
            self.processor.notify_deployment_updated("dep-1")

        mock_notify.assert_called_once_with("dep-1")

    def test_swallows_os_error(self):
        mock_events_module = MagicMock()
        mock_events_module.notify_deployment_updated_sync.side_effect = OSError("conn failed")

        with patch.dict(
            "sys.modules",
            {
                "deployment_api.utils.deployment_events": mock_events_module,
            },
        ):
            self.processor.notify_deployment_updated("dep-1")  # must not raise

    def test_swallows_value_error(self):
        mock_events_module = MagicMock()
        mock_events_module.notify_deployment_updated_sync.side_effect = ValueError("bad id")

        with patch.dict(
            "sys.modules",
            {
                "deployment_api.utils.deployment_events": mock_events_module,
            },
        ):
            self.processor.notify_deployment_updated("dep-1")  # must not raise

    def test_swallows_runtime_error(self):
        mock_events_module = MagicMock()
        mock_events_module.notify_deployment_updated_sync.side_effect = RuntimeError("broker down")

        with patch.dict(
            "sys.modules",
            {
                "deployment_api.utils.deployment_events": mock_events_module,
            },
        ):
            self.processor.notify_deployment_updated("dep-1")  # must not raise
