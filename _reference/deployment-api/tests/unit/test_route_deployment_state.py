"""
Unit tests for routes/deployment_state.py sync helper functions.

Tests call sync helpers directly, patching load_state/save_state and storage utilities.
"""

from unittest.mock import MagicMock, patch

import deployment_api.routes.deployment_state as _ds_routes
from deployment_api.routes.deployment_state import (
    _check_shard_logs_for_errors,
    _parse_execution_name,
    cancel_deployment_sync,
    delete_deployment_sync,
    resume_deployment_sync,
    update_deployment_tag_sync,
)


def _make_state_dict(
    status="running",
    compute_type="cloud_run",
    shards=None,
    deployment_id="dep-1",
    tag=None,
) -> dict:
    """Create a minimal dict-based deployment state."""
    return {
        "deployment_id": deployment_id,
        "status": status,
        "compute_type": compute_type,
        "shards": shards if shards is not None else [],
        "tag": tag,
        "updated_at": None,
    }


class TestParseExecutionName:
    def test_extracts_region_and_job(self):
        name = "projects/my-proj/locations/us-central1/jobs/my-job/executions/exec-1"
        region, job_name = _parse_execution_name(name)
        assert region == "us-central1"
        assert job_name == "my-job"

    def test_returns_none_for_unknown_parts(self):
        name = "some/other/path"
        region, job_name = _parse_execution_name(name)
        assert region is None
        assert job_name is None

    def test_handles_empty_string(self):
        region, job_name = _parse_execution_name("")
        assert region is None
        assert job_name is None

    def test_partial_path_extracts_available(self):
        name = "projects/p/locations/us-east1"
        region, job_name = _parse_execution_name(name)
        assert region == "us-east1"
        assert job_name is None


class TestCheckShardLogsForErrors:
    def _make_shard(self, shard_id="shard-1") -> dict:
        return {"shard_id": shard_id}

    def test_returns_false_when_log_not_found(self):
        shard = self._make_shard()
        with patch.object(_ds_routes, "object_exists", return_value=False):
            result = _check_shard_logs_for_errors(shard, "dep-1")
        assert result is False

    def test_returns_false_when_no_errors_in_log(self):
        shard = self._make_shard()
        log_content = "INFO:mymodule:Process started\nINFO:mymodule:Completed"
        with (
            patch.object(_ds_routes, "object_exists", return_value=True),
            patch.object(_ds_routes, "read_object_text", return_value=log_content),
        ):
            result = _check_shard_logs_for_errors(shard, "dep-1")
        assert result is False

    def test_returns_true_when_error_in_log(self):
        shard = self._make_shard()
        log_content = "INFO:mymodule:Starting\nERROR:mymodule:Something failed\nINFO:done"
        with (
            patch.object(_ds_routes, "object_exists", return_value=True),
            patch.object(_ds_routes, "read_object_text", return_value=log_content),
        ):
            result = _check_shard_logs_for_errors(shard, "dep-1")
        assert result is True

    def test_returns_false_on_oserror(self):
        shard = self._make_shard()
        with patch.object(_ds_routes, "object_exists", side_effect=OSError("failed")):
            result = _check_shard_logs_for_errors(shard, "dep-1")
        assert result is False

    def test_skips_empty_lines(self):
        shard = self._make_shard()
        log_content = "\n\nNo logs available\n\n"
        with (
            patch.object(_ds_routes, "object_exists", return_value=True),
            patch.object(_ds_routes, "read_object_text", return_value=log_content),
        ):
            result = _check_shard_logs_for_errors(shard, "dep-1")
        assert result is False


class TestCancelDeploymentSync:
    def test_returns_not_found_when_state_missing(self):
        with patch.object(_ds_routes, "load_state", return_value=None):
            result = cancel_deployment_sync("missing-dep")
        assert result["error"] == "not_found"
        assert result["deployment_id"] == "missing-dep"

    def test_returns_already_terminal_message(self):
        state = _make_state_dict(status="completed")
        with patch.object(_ds_routes, "load_state", return_value=state):
            result = cancel_deployment_sync("dep-1")
        assert result["cancelled"] is False

    def test_cancels_running_shards(self):
        shard1 = {"status": "running"}
        shard2 = {"status": "pending"}
        shard3 = {"status": "completed"}  # should not be cancelled
        state = _make_state_dict(status="running", shards=[shard1, shard2, shard3])

        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "save_state") as mock_save,
            patch.object(_ds_routes, "notify_deployment_updated_sync"),
        ):
            result = cancel_deployment_sync("dep-1")

        assert result["cancelled"] is True
        assert result["cancelled_shards"] == 2
        assert shard1["status"] == "cancelled"
        assert shard2["status"] == "cancelled"
        assert shard3["status"] == "completed"  # unchanged
        mock_save.assert_called_once()

    def test_swallows_notify_error(self):
        state = _make_state_dict(status="running", shards=[])
        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "save_state"),
            patch.object(
                _ds_routes, "notify_deployment_updated_sync", side_effect=OSError("notify failed")
            ),
        ):
            result = cancel_deployment_sync("dep-1")
        assert result["cancelled"] is True


class TestResumeDeploymentSync:
    def test_returns_not_found_when_state_missing(self):
        with patch.object(_ds_routes, "load_state", return_value=None):
            result = resume_deployment_sync("missing-dep")
        assert result["error"] == "not_found"

    def test_returns_cannot_resume_for_running(self):
        state = _make_state_dict(status="running")
        with patch.object(_ds_routes, "load_state", return_value=state):
            result = resume_deployment_sync("dep-1")
        assert result["resumed"] is False

    def test_resumes_failed_and_cancelled_shards(self):
        shard1 = {"status": "failed"}
        shard2 = {"status": "cancelled"}
        shard3 = {"status": "completed"}  # should not be resumed
        state = _make_state_dict(status="cancelled", shards=[shard1, shard2, shard3])

        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "save_state") as mock_save,
            patch.object(_ds_routes, "notify_deployment_updated_sync"),
        ):
            result = resume_deployment_sync("dep-1")

        assert result["resumed"] is True
        assert result["resumed_shards"] == 2
        assert shard1["status"] == "pending"
        assert shard2["status"] == "pending"
        assert shard3["status"] == "completed"  # unchanged
        mock_save.assert_called_once()

    def test_returns_no_shards_to_resume_message(self):
        shard1 = {"status": "completed"}
        state = _make_state_dict(status="failed", shards=[shard1])

        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "save_state") as mock_save,
        ):
            result = resume_deployment_sync("dep-1")

        assert result["resumed"] is False
        assert result["resumed_shards"] == 0
        mock_save.assert_not_called()

    def test_swallows_notify_error(self):
        shard1 = {"status": "failed"}
        state = _make_state_dict(status="failed", shards=[shard1])

        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "save_state"),
            patch.object(
                _ds_routes,
                "notify_deployment_updated_sync",
                side_effect=RuntimeError("notify failed"),
            ),
        ):
            result = resume_deployment_sync("dep-1")
        assert result["resumed"] is True


class TestDeleteDeploymentSync:
    def test_returns_not_found_when_state_missing(self):
        with patch.object(_ds_routes, "load_state", return_value=None):
            result = delete_deployment_sync("missing-dep")
        assert result["error"] == "not_found"

    def test_deletes_state_and_objects(self):
        state = _make_state_dict()
        mock_obj = MagicMock()
        mock_obj.name = "deployments.test/dep-1/some-file.txt"

        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "list_objects", return_value=[mock_obj]),
            patch.object(_ds_routes, "delete_object") as mock_delete,
        ):
            result = delete_deployment_sync("dep-1")

        assert result["deleted"] is True
        # Should have at least the state file deletion + listed object deletion
        assert mock_delete.call_count >= 1
        mock_delete.assert_any_call(_ds_routes.DEFAULT_STATE_BUCKET, mock_obj.name)

    def test_continues_when_delete_state_fails(self):
        state = _make_state_dict()
        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "delete_object", side_effect=OSError("bucket unavailable")),
            patch.object(_ds_routes, "list_objects", return_value=[]),
        ):
            result = delete_deployment_sync("dep-1")

        assert result["deleted"] is True  # function still returns deleted=True

    def test_continues_when_list_objects_fails(self):
        state = _make_state_dict()
        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "delete_object"),
            patch.object(_ds_routes, "list_objects", side_effect=OSError("failed")),
        ):
            result = delete_deployment_sync("dep-1")

        assert result["deleted"] is True


class TestUpdateDeploymentTagSync:
    def test_returns_not_found_when_state_missing(self):
        with patch.object(_ds_routes, "load_state", return_value=None):
            result = update_deployment_tag_sync("missing-dep", "v2.0")
        assert result["error"] == "not_found"

    def test_updates_tag_and_saves(self):
        state = _make_state_dict(tag="v1.0")

        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "save_state") as mock_save,
        ):
            result = update_deployment_tag_sync("dep-1", "v2.0")

        assert result["updated"] is True
        assert result["old_tag"] == "v1.0"
        assert result["new_tag"] == "v2.0"
        assert state["tag"] == "v2.0"
        mock_save.assert_called_once()

    def test_updates_to_none_tag(self):
        state = _make_state_dict(tag="v1.0")

        with (
            patch.object(_ds_routes, "load_state", return_value=state),
            patch.object(_ds_routes, "save_state"),
        ):
            result = update_deployment_tag_sync("dep-1", None)

        assert result["updated"] is True
        assert result["new_tag"] is None
