"""
Unit tests for utils/local_state_manager.py.

Tests load_state, save_state, get_shards, get_status, is_terminal, recompute_status.
"""

import json
from unittest.mock import patch

import pytest

import deployment_api.utils.local_state_manager as _lsm
from deployment_api.utils.local_state_manager import (
    STATUS_CANCELLED,
    STATUS_COMPLETED,
    STATUS_FAILED,
    STATUS_PENDING,
    STATUS_RUNNING,
    get_shards,
    get_status,
    is_terminal,
    load_state,
    recompute_status,
    save_state,
)


class TestLoadState:
    def test_returns_dict_on_success(self):
        state = {"deployment_id": "dep-1", "status": "running"}
        with patch.object(_lsm, "read_object_text", return_value=json.dumps(state)):
            result = load_state("dep-1")
        assert result == state

    def test_returns_none_on_empty_content(self):
        with patch.object(_lsm, "read_object_text", return_value=""):
            result = load_state("dep-1")
        assert result is None

    def test_returns_none_on_oserror(self):
        with patch.object(_lsm, "read_object_text", side_effect=OSError("not found")):
            result = load_state("dep-1")
        assert result is None

    def test_returns_none_on_json_decode_error(self):
        with patch.object(_lsm, "read_object_text", return_value="not-json{{{"):
            result = load_state("dep-1")
        assert result is None

    def test_returns_none_on_value_error(self):
        with patch.object(_lsm, "read_object_text", side_effect=ValueError("bad")):
            result = load_state("dep-1")
        assert result is None

    def test_uses_provided_bucket(self):
        state = {"deployment_id": "dep-1", "status": "pending"}
        with patch.object(_lsm, "read_object_text", return_value=json.dumps(state)) as mock_read:
            load_state("dep-1", bucket="my-bucket")
        mock_read.assert_called_once()
        assert mock_read.call_args[0][0] == "my-bucket"


class TestSaveState:
    def test_writes_json_to_gcs(self):
        state = {"deployment_id": "dep-1", "status": "running"}
        with patch.object(_lsm, "write_object_text") as mock_write:
            save_state(state)
        mock_write.assert_called_once()
        written_content = mock_write.call_args[0][2]
        loaded = json.loads(written_content)
        assert loaded["deployment_id"] == "dep-1"

    def test_sets_updated_at(self):
        state: dict = {"deployment_id": "dep-1", "status": "running"}
        with patch.object(_lsm, "write_object_text"):
            save_state(state)
        assert "updated_at" in state

    def test_reraises_oserror(self):
        state = {"deployment_id": "dep-1", "status": "running"}
        with (
            patch.object(_lsm, "write_object_text", side_effect=OSError("write failed")),
            pytest.raises(OSError, match="write failed"),
        ):
            save_state(state)

    def test_uses_provided_bucket(self):
        state = {"deployment_id": "dep-1", "status": "running"}
        with patch.object(_lsm, "write_object_text") as mock_write:
            save_state(state, bucket="custom-bucket")
        assert mock_write.call_args[0][0] == "custom-bucket"


class TestGetShards:
    def test_returns_list_when_present(self):
        shards = [{"shard_id": "s1"}, {"shard_id": "s2"}]
        state = {"shards": shards}
        result = get_shards(state)
        assert result == shards

    def test_returns_empty_when_absent(self):
        result = get_shards({})
        assert result == []

    def test_returns_empty_when_not_list(self):
        result = get_shards({"shards": "not-a-list"})
        assert result == []


class TestGetStatus:
    def test_returns_status_string(self):
        assert get_status({"status": "running"}) == "running"

    def test_returns_pending_when_absent(self):
        assert get_status({}) == STATUS_PENDING

    def test_returns_pending_when_none(self):
        assert get_status({"status": None}) == STATUS_PENDING


class TestIsTerminal:
    def test_completed_is_terminal(self):
        assert is_terminal(STATUS_COMPLETED) is True

    def test_failed_is_terminal(self):
        assert is_terminal(STATUS_FAILED) is True

    def test_cancelled_is_terminal(self):
        assert is_terminal(STATUS_CANCELLED) is True

    def test_running_is_not_terminal(self):
        assert is_terminal(STATUS_RUNNING) is False

    def test_pending_is_not_terminal(self):
        assert is_terminal(STATUS_PENDING) is False


class TestRecomputeStatus:
    def test_empty_shards_returns_pending(self):
        assert recompute_status([]) == STATUS_PENDING

    def test_all_succeeded_returns_completed(self):
        shards = [{"status": "succeeded"}, {"status": "succeeded"}]
        assert recompute_status(shards) == STATUS_COMPLETED

    def test_all_failed_returns_failed(self):
        shards = [{"status": "failed"}, {"status": "failed"}]
        assert recompute_status(shards) == STATUS_FAILED

    def test_some_failed_returns_failed(self):
        shards = [{"status": "succeeded"}, {"status": "failed"}]
        assert recompute_status(shards) == STATUS_FAILED

    def test_any_running_returns_running(self):
        shards = [{"status": "running"}, {"status": "pending"}]
        assert recompute_status(shards) == STATUS_RUNNING

    def test_any_pending_returns_running(self):
        shards = [{"status": "succeeded"}, {"status": "pending"}]
        assert recompute_status(shards) == STATUS_RUNNING
