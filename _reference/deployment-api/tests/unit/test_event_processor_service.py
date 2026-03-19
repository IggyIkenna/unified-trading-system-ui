"""
Unit tests for services/event_processor module (EventProcessor class).

Tests initialization, get_vm_status, get_vm_zone, check_all_shards_terminal,
read_vm_status_map, read_shard_statuses, notify_deployment_updated.
"""

import json
import sys
from pathlib import Path
from types import ModuleType
from unittest.mock import MagicMock, patch

# Remove pre-mocked entries so we import the real EventProcessor.
for _key in list(sys.modules.keys()):
    if _key in (
        "deployment_api.services.event_processor",
        "deployment_api.services",
    ):
        del sys.modules[_key]

# Re-build minimal package pointing to the real services directory.
_svc_pkg = ModuleType("deployment_api.services")
_svc_pkg.__package__ = "deployment_api.services"
_services_dir = str(Path(__file__).parent.parent.parent / "deployment_api" / "services")
_svc_pkg.__path__ = [_services_dir]  # type: ignore[attr-defined]
sys.modules["deployment_api.services"] = _svc_pkg

from deployment_api.services.event_processor import EventProcessor

# The conftest pre-loads real modules, then del/re-import may diverge the module __dict__
# from the class __globals__. Use the class __globals__ directly for reliable patching.
_ep_globals = EventProcessor.read_vm_status_map.__globals__


def _make_ep(**kwargs) -> EventProcessor:
    return EventProcessor(
        project_id=kwargs.get("project_id", "test-project"),
        state_bucket=kwargs.get("state_bucket", "test-bucket"),
        deployment_env=kwargs.get("deployment_env", "development"),
    )


class TestEventProcessorInit:
    """Tests for EventProcessor.__init__."""

    def test_sets_project_id(self):
        ep = _make_ep(project_id="proj-x")
        assert ep.project_id == "proj-x"

    def test_sets_state_bucket(self):
        ep = _make_ep(state_bucket="bkt-x")
        assert ep.state_bucket == "bkt-x"

    def test_sets_deployment_env(self):
        ep = _make_ep(deployment_env="production")
        assert ep.deployment_env == "production"


class TestGetVmStatus:
    """Tests for EventProcessor.get_vm_status."""

    def test_returns_status_for_matching_job_id(self):
        ep = _make_ep()
        vm_map = {
            "vm-abc": {"job_id": "vm-abc", "status": "RUNNING", "zone": "us-central1-a"},
        }
        result = ep.get_vm_status(vm_map, "vm-abc")
        assert result == "RUNNING"

    def test_returns_none_when_not_found(self):
        ep = _make_ep()
        vm_map = {"vm-abc": {"job_id": "vm-abc", "status": "RUNNING"}}
        result = ep.get_vm_status(vm_map, "vm-missing")
        assert result is None

    def test_returns_none_for_empty_map(self):
        ep = _make_ep()
        assert ep.get_vm_status({}, "any-job") is None

    def test_skips_non_dict_entries(self):
        ep = _make_ep()
        vm_map = {"vm-1": "not-a-dict", "vm-2": {"job_id": "vm-2", "status": "TERMINATED"}}
        result = ep.get_vm_status(vm_map, "vm-2")
        assert result == "TERMINATED"


class TestGetVmZone:
    """Tests for EventProcessor.get_vm_zone."""

    def test_returns_zone_for_matching_job_id(self):
        ep = _make_ep()
        vm_map = {"vm-abc": {"job_id": "vm-abc", "zone": "us-east1-b"}}
        result = ep.get_vm_zone(vm_map, "vm-abc")
        assert result == "us-east1-b"

    def test_returns_none_when_not_found(self):
        ep = _make_ep()
        vm_map = {"vm-abc": {"job_id": "vm-abc", "zone": "us-east1-b"}}
        result = ep.get_vm_zone(vm_map, "vm-missing")
        assert result is None

    def test_returns_none_when_zone_missing_from_entry(self):
        ep = _make_ep()
        vm_map = {"vm-abc": {"job_id": "vm-abc"}}  # No zone key
        result = ep.get_vm_zone(vm_map, "vm-abc")
        assert result is None


class TestCheckAllShardsTerminal:
    """Tests for EventProcessor.check_all_shards_terminal."""

    def test_all_succeeded_returns_true_true(self):
        ep = _make_ep()
        shards = [
            {"shard_id": "s1", "status": "succeeded"},
            {"shard_id": "s2", "status": "succeeded"},
        ]
        all_done, any_failed = ep.check_all_shards_terminal(shards)
        assert all_done is True
        assert any_failed is False

    def test_all_failed_returns_true_true(self):
        ep = _make_ep()
        shards = [
            {"shard_id": "s1", "status": "failed"},
        ]
        all_done, any_failed = ep.check_all_shards_terminal(shards)
        assert all_done is True
        assert any_failed is True

    def test_mixed_running_returns_false(self):
        ep = _make_ep()
        shards = [
            {"shard_id": "s1", "status": "succeeded"},
            {"shard_id": "s2", "status": "running"},
        ]
        all_done, _any_failed = ep.check_all_shards_terminal(shards)
        assert all_done is False

    def test_empty_shards_returns_true_false(self):
        ep = _make_ep()
        all_done, any_failed = ep.check_all_shards_terminal([])
        assert all_done is True
        assert any_failed is False

    def test_partial_failed_with_remaining_running(self):
        ep = _make_ep()
        shards = [
            {"shard_id": "s1", "status": "failed"},
            {"shard_id": "s2", "status": "running"},
        ]
        all_done, any_failed = ep.check_all_shards_terminal(shards)
        assert all_done is False
        assert any_failed is True


class TestReadVmStatusMap:
    """Tests for EventProcessor.read_vm_status_map."""

    def test_returns_dict_from_valid_json(self):
        ep = _make_ep()
        vm_data = {"vm-1": {"status": "RUNNING", "job_id": "vm-1"}}

        with patch.dict(
            _ep_globals, {"read_object_text": MagicMock(return_value=json.dumps(vm_data))}
        ):
            result = ep.read_vm_status_map("dep-1")

        assert result == vm_data

    def test_returns_empty_on_read_error(self):
        ep = _make_ep()

        with patch.dict(
            _ep_globals, {"read_object_text": MagicMock(side_effect=OSError("not found"))}
        ):
            result = ep.read_vm_status_map("dep-1")

        assert result == {}

    def test_returns_empty_on_invalid_json(self):
        ep = _make_ep()

        with patch.dict(_ep_globals, {"read_object_text": MagicMock(return_value="not-json")}):
            result = ep.read_vm_status_map("dep-1")

        assert result == {}


class TestReadShardStatuses:
    """Tests for EventProcessor.read_shard_statuses."""

    def test_returns_dict_from_valid_status_text(self):
        ep = _make_ep()
        shards = [{"shard_id": "s1"}, {"shard_id": "s2"}]
        event_json = json.dumps({"status": "succeeded", "some_key": "val"})

        with patch.dict(
            _ep_globals,
            {
                "read_object_text": MagicMock(return_value=event_json),
                "parse_service_event": MagicMock(
                    return_value={"status": "succeeded", "some_key": "val"}
                ),
            },
        ):
            result = ep.read_shard_statuses("dep-1", shards)

        assert "s1" in result
        assert result["s1"][0] == "succeeded"

    def test_returns_empty_on_read_error(self):
        ep = _make_ep()
        shards = [{"shard_id": "s1"}]

        with patch.dict(
            _ep_globals, {"read_object_text": MagicMock(side_effect=OSError("not found"))}
        ):
            result = ep.read_shard_statuses("dep-1", shards)

        assert result == {}

    def test_skips_shards_without_shard_id(self):
        ep = _make_ep()
        shards = [{"no_shard_id": True}]

        result = ep.read_shard_statuses("dep-1", shards)

        assert result == {}

    def test_skips_shards_when_parse_returns_none(self):
        ep = _make_ep()
        shards = [{"shard_id": "s1"}]

        with patch.dict(
            _ep_globals,
            {
                "read_object_text": MagicMock(return_value="some text"),
                "parse_service_event": MagicMock(return_value=None),
            },
        ):
            result = ep.read_shard_statuses("dep-1", shards)

        assert result == {}

    def test_returns_empty_for_empty_shards(self):
        ep = _make_ep()
        result = ep.read_shard_statuses("dep-1", [])
        assert result == {}


class TestNotifyDeploymentUpdated:
    """Tests for EventProcessor.notify_deployment_updated."""

    def test_calls_notify_sync(self):
        ep = _make_ep()
        mock_notify = MagicMock()
        mock_events_mod = MagicMock()
        mock_events_mod.notify_deployment_updated_sync = mock_notify

        with patch.dict(
            sys.modules,
            {"deployment_api.utils.deployment_events": mock_events_mod},
        ):
            ep.notify_deployment_updated("dep-1")

        mock_notify.assert_called_once_with("dep-1")

    def test_handles_notify_error_gracefully(self):
        ep = _make_ep()
        mock_events_mod = MagicMock()
        mock_events_mod.notify_deployment_updated_sync = MagicMock(
            side_effect=RuntimeError("queue full")
        )

        with patch.dict(
            sys.modules,
            {"deployment_api.utils.deployment_events": mock_events_mod},
        ):
            # Should not raise
            ep.notify_deployment_updated("dep-1")
