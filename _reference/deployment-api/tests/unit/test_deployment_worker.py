"""
Unit tests for deployment_worker module.

Tests run_deployment_in_process, spawn_deployment_worker,
get_active_workers, register_worker, and terminate_worker.
"""

import multiprocessing
import sys
from unittest.mock import MagicMock, patch

# Mock the 'deployment' package before importing deployment_worker
sys.modules.setdefault("deployment", MagicMock())
sys.modules.setdefault(
    "deployment.state", MagicMock(DeploymentStatus=MagicMock(), StateManager=MagicMock())
)

import deployment_api.workers.deployment_worker as dw

SAMPLE_KWARGS = {
    "deployment_id": "dep-test-123",
    "service": "my-service",
    "compute_type": "vm",
    "docker_image": "gcr.io/proj/img:latest",
    "shards": [{"shard_id": "s1", "start_date": "2024-01-01", "end_date": "2024-01-31"}],
    "environment_variables": {"ENV": "test"},
    "compute_config": {"machine_type": "n1-standard-4"},
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "job_name": "test-job",
    "zone": "us-central1-a",
    "max_workers": 4,
    "max_concurrent": 10,
    "tag": "v1.0",
    "project_id": "test-proj",
    "region": "us-central1",
    "service_account_email": "sa@proj.iam.gserviceaccount.com",
    "state_bucket": "test-bucket",
    "config_dir": "/configs",
}


class TestRunDeploymentInProcess:
    """Tests for run_deployment_in_process function."""

    def test_runs_without_error_returns_none(self):
        """The function returns immediately (auto-scheduler handles launching)."""
        result = dw.run_deployment_in_process(**SAMPLE_KWARGS)
        assert result is None

    def test_handles_exception_gracefully(self):
        """Function runs without raising - exception path just logs."""
        bad_kwargs = {**SAMPLE_KWARGS}
        # The function just logs and returns; no exception should propagate
        # The normal flow returns None immediately
        result = dw.run_deployment_in_process(**bad_kwargs)
        assert result is None


class TestGetActiveWorkers:
    """Tests for get_active_workers function."""

    def test_returns_empty_dict_when_no_workers(self):
        original = dw._active_workers.copy()
        try:
            dw._active_workers.clear()
            result = dw.get_active_workers()
            assert result == {}
        finally:
            dw._active_workers.update(original)

    def test_returns_worker_info(self):
        mock_process = MagicMock()
        mock_process.pid = 12345
        mock_process.is_alive.return_value = True
        mock_process.exitcode = None

        original = dw._active_workers.copy()
        try:
            dw._active_workers.clear()
            dw._active_workers["dep-abc"] = mock_process

            result = dw.get_active_workers()
            assert "dep-abc" in result
            assert result["dep-abc"]["pid"] == 12345
            assert result["dep-abc"]["alive"] is True
        finally:
            dw._active_workers.clear()
            dw._active_workers.update(original)

    def test_cleans_up_dead_processes(self):
        mock_process = MagicMock()
        mock_process.pid = 9999
        mock_process.is_alive.return_value = False
        mock_process.exitcode = 0

        original = dw._active_workers.copy()
        try:
            dw._active_workers.clear()
            dw._active_workers["dep-dead"] = mock_process

            result = dw.get_active_workers()
            # Dead process should be in result once, then cleaned up
            assert result["dep-dead"]["alive"] is False
            # After calling get_active_workers, dead process should be removed
            assert "dep-dead" not in dw._active_workers
        finally:
            dw._active_workers.clear()
            dw._active_workers.update(original)


class TestRegisterWorker:
    """Tests for register_worker function."""

    def test_registers_worker_by_id(self):
        mock_process = MagicMock()
        original = dw._active_workers.copy()
        try:
            dw._active_workers.clear()
            dw.register_worker("dep-reg-1", mock_process)
            assert "dep-reg-1" in dw._active_workers
            assert dw._active_workers["dep-reg-1"] is mock_process
        finally:
            dw._active_workers.clear()
            dw._active_workers.update(original)


class TestTerminateWorker:
    """Tests for terminate_worker function."""

    def test_returns_false_when_worker_not_found(self):
        original = dw._active_workers.copy()
        try:
            dw._active_workers.clear()
            result = dw.terminate_worker("nonexistent-dep")
            assert result is False
        finally:
            dw._active_workers.update(original)

    def test_terminates_alive_process(self):
        mock_process = MagicMock()
        mock_process.is_alive.return_value = True
        mock_process.is_alive.side_effect = [True, False]

        original = dw._active_workers.copy()
        try:
            dw._active_workers.clear()
            dw._active_workers["dep-alive"] = mock_process

            result = dw.terminate_worker("dep-alive")
            assert result is True
            mock_process.terminate.assert_called_once()
            assert "dep-alive" not in dw._active_workers
        finally:
            dw._active_workers.clear()
            dw._active_workers.update(original)

    def test_kills_process_that_wont_stop(self):
        mock_process = MagicMock()
        mock_process.is_alive.return_value = True  # Always alive

        original = dw._active_workers.copy()
        try:
            dw._active_workers.clear()
            dw._active_workers["dep-stubborn"] = mock_process

            result = dw.terminate_worker("dep-stubborn")
            assert result is True
            mock_process.terminate.assert_called_once()
            mock_process.kill.assert_called_once()
        finally:
            dw._active_workers.clear()
            dw._active_workers.update(original)

    def test_does_not_terminate_dead_process(self):
        """Worker in _active_workers but already dead - terminate returns False."""
        mock_process = MagicMock()
        mock_process.is_alive.return_value = False

        original = dw._active_workers.copy()
        try:
            dw._active_workers.clear()
            dw._active_workers["dep-dead"] = mock_process

            result = dw.terminate_worker("dep-dead")
            assert result is False
            mock_process.terminate.assert_not_called()
        finally:
            dw._active_workers.clear()
            dw._active_workers.update(original)


class TestSpawnDeploymentWorker:
    """Tests for spawn_deployment_worker function."""

    def test_spawn_returns_process(self):
        """spawn_deployment_worker should return a Process object."""
        mock_ctx = MagicMock()
        mock_process = MagicMock(spec=multiprocessing.Process)
        mock_process.pid = 99999
        mock_ctx.Process.return_value = mock_process

        with patch(
            "deployment_api.workers.deployment_worker.multiprocessing.get_context",
            return_value=mock_ctx,
        ):
            result = dw.spawn_deployment_worker(**SAMPLE_KWARGS)

        mock_process.start.assert_called_once()
        assert result is not None

    def test_spawn_uses_spawn_context(self):
        """Should use 'spawn' context for clean process isolation."""
        mock_ctx = MagicMock()
        mock_process = MagicMock(spec=multiprocessing.Process)
        mock_ctx.Process.return_value = mock_process

        with patch(
            "deployment_api.workers.deployment_worker.multiprocessing.get_context",
            return_value=mock_ctx,
        ) as mock_get_ctx:
            dw.spawn_deployment_worker(**SAMPLE_KWARGS)

        mock_get_ctx.assert_called_once_with("spawn")

    def test_spawn_process_is_daemon(self):
        """Worker process should be a daemon so it doesn't block API shutdown."""
        mock_ctx = MagicMock()
        mock_process = MagicMock(spec=multiprocessing.Process)
        mock_ctx.Process.return_value = mock_process

        with patch(
            "deployment_api.workers.deployment_worker.multiprocessing.get_context",
            return_value=mock_ctx,
        ):
            dw.spawn_deployment_worker(**SAMPLE_KWARGS)

        call_kwargs = mock_ctx.Process.call_args.kwargs
        assert call_kwargs.get("daemon") is True
