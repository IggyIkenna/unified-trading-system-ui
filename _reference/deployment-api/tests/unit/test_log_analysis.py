"""
Unit tests for log_analysis module.

Tests cover:
- invalidate_log_analysis_cache
- analyze_deployment_logs_sync (status filtering behavior)
"""

import time
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from deployment_api.routes.log_analysis import (
    _log_analysis_cache,
    analyze_deployment_logs_sync,
    invalidate_log_analysis_cache,
)


class TestInvalidateLogAnalysisCache:
    """Tests for invalidate_log_analysis_cache."""

    def setup_method(self):
        _log_analysis_cache.clear()

    def test_clear_all(self):
        _log_analysis_cache["dep1"] = {"timestamp": 0, "data": {}}
        _log_analysis_cache["dep2"] = {"timestamp": 0, "data": {}}
        invalidate_log_analysis_cache()
        assert len(_log_analysis_cache) == 0

    def test_clear_specific(self):
        _log_analysis_cache["dep1"] = {"timestamp": 0, "data": {}}
        _log_analysis_cache["dep2"] = {"timestamp": 0, "data": {}}
        invalidate_log_analysis_cache("dep1")
        assert "dep1" not in _log_analysis_cache
        assert "dep2" in _log_analysis_cache

    def test_clear_nonexistent_no_error(self):
        invalidate_log_analysis_cache("nonexistent")  # Should not raise

    def test_clear_empty_no_error(self):
        invalidate_log_analysis_cache()  # Should not raise


class TestAnalyzeDeploymentLogsSyncStatusFilter:
    """Tests for analyze_deployment_logs_sync status filtering."""

    def setup_method(self):
        _log_analysis_cache.clear()

    def test_running_returns_status_detail(self):
        """Running deployments skip log analysis."""
        state = SimpleNamespace(status=SimpleNamespace(value="running"))
        state_manager = MagicMock()
        result = analyze_deployment_logs_sync(state_manager, "dep-1", state)
        assert result["status_detail"] == "running"
        assert result["log_analysis"] is None

    def test_pending_returns_status_detail(self):
        state = SimpleNamespace(status=SimpleNamespace(value="pending"))
        state_manager = MagicMock()
        result = analyze_deployment_logs_sync(state_manager, "dep-1", state)
        assert result["status_detail"] == "pending"

    def test_completed_analyzes_logs_no_shards(self):
        """Completed deployments with no shards return empty log analysis."""
        state = SimpleNamespace(status=SimpleNamespace(value="completed"))
        state_manager = MagicMock()
        state_manager.get_deployment_shards.return_value = []
        result = analyze_deployment_logs_sync(state_manager, "dep-1", state)
        assert result.get("log_analysis") is not None
        assert result["log_analysis"]["shards_analyzed"] == 0

    def test_failed_with_string_status(self):
        """String status values also work (for backwards compatibility)."""
        state = SimpleNamespace(status="running")  # plain string, no .value
        state_manager = MagicMock()
        result = analyze_deployment_logs_sync(state_manager, "dep-1", state)
        assert result["status_detail"] == "running"

    def test_result_cached(self):
        """Results are cached after full log analysis completes."""
        state = SimpleNamespace(status=SimpleNamespace(value="completed"))
        state_manager = MagicMock()
        # Shard with status=completed but no compute_info (vm_name missing → no logs)
        state_manager.get_deployment_shards.return_value = [
            {"status": "completed", "shard_id": "s1", "compute_info": {}},
        ]
        result1 = analyze_deployment_logs_sync(state_manager, "dep-cached2", state)
        assert "dep-cached2" in _log_analysis_cache
        # Second call should return from cache
        state_manager_unused = MagicMock()
        result2 = analyze_deployment_logs_sync(state_manager_unused, "dep-cached2", state)
        assert result1 == result2


class TestAnalyzeDeploymentLogsWithShards:
    """Tests for analyze_deployment_logs_sync with shard log data."""

    def setup_method(self):
        _log_analysis_cache.clear()

    def test_no_completed_shards_returns_none_analysis(self):
        state = SimpleNamespace(status=SimpleNamespace(value="completed"))
        state_manager = MagicMock()
        # Shards all pending — not completed/succeeded/failed
        state_manager.get_deployment_shards.return_value = [
            {"status": "pending", "shard_id": "s1"},
        ]
        result = analyze_deployment_logs_sync(state_manager, "dep-1", state)
        assert result["log_analysis"] is None
        assert result["status_detail"] == "no_completed_shards"


@pytest.fixture(autouse=True)
def _clear_log_analysis_cache():
    _log_analysis_cache.clear()
    yield
    _log_analysis_cache.clear()


def _make_log_state(status_val: str = "completed"):
    return SimpleNamespace(status=SimpleNamespace(value=status_val))


def _make_log_state_manager(shards=None, vm_logs=None):
    sm = MagicMock()
    sm.get_deployment_shards.return_value = shards or []
    sm.get_vm_serial_console.return_value = vm_logs or ""
    return sm


class TestAnalyzeDeploymentLogsSync:
    """Tests for analyze_deployment_logs_sync - detailed log paths."""

    def test_running_state_returns_early(self):
        state = _make_log_state("running")
        sm = _make_log_state_manager()
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "running"
        assert result["log_analysis"] is None
        sm.get_deployment_shards.assert_not_called()

    def test_pending_state_returns_early(self):
        state = _make_log_state("pending")
        sm = _make_log_state_manager()
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "pending"

    def test_no_shards_returns_no_shards(self):
        state = _make_log_state("completed")
        sm = _make_log_state_manager(shards=[])
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "no_shards"
        assert result["log_analysis"]["shards_analyzed"] == 0

    def test_no_completed_shards_returns_no_completed_shards(self):
        state = _make_log_state("completed")
        shards = [{"status": "running", "shard_id": "s1"}]
        sm = _make_log_state_manager(shards=shards)
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "no_completed_shards"

    def test_completed_shard_no_compute_info(self):
        state = _make_log_state("completed")
        shards = [{"status": "completed", "shard_id": "s1", "compute_info": {}}]
        sm = _make_log_state_manager(shards=shards)
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["log_analysis"]["shards_analyzed"] == 1

    def test_completed_shard_with_error_in_logs(self):
        state = _make_log_state("completed")
        shards = [{"status": "completed", "shard_id": "s1", "compute_info": {"vm_name": "vm-01"}}]
        sm = _make_log_state_manager(
            shards=shards,
            vm_logs="some text\nERROR: something went wrong\nmore text",
        )
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "failed_with_errors"
        assert len(result["log_analysis"]["errors"]) >= 1

    def test_completed_shard_with_warning_in_logs(self):
        state = _make_log_state("completed")
        shards = [{"status": "completed", "shard_id": "s1", "compute_info": {"vm_name": "vm-01"}}]
        sm = _make_log_state_manager(
            shards=shards,
            vm_logs="WARNING: disk almost full\nok",
        )
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] in ("completed_with_warnings", "completed")
        assert len(result["log_analysis"]["warnings"]) >= 1

    def test_completed_shard_with_success_indicators(self):
        state = _make_log_state("completed")
        shards = [{"status": "completed", "shard_id": "s1", "compute_info": {"vm_name": "vm-01"}}]
        sm = _make_log_state_manager(
            shards=shards,
            vm_logs="Processing complete\nAll done",
        )
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "succeeded"

    def test_failed_state_keeps_failed(self):
        state = _make_log_state("failed")
        shards = [{"status": "failed", "shard_id": "s1", "compute_info": {"vm_name": "vm-01"}}]
        sm = _make_log_state_manager(shards=shards, vm_logs="")
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "failed"

    def test_succeeded_state_keeps_succeeded(self):
        state = _make_log_state("succeeded")
        shards = [{"status": "succeeded", "shard_id": "s1", "compute_info": {"vm_name": "vm-01"}}]
        sm = _make_log_state_manager(shards=shards, vm_logs="")
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "succeeded"

    def test_stack_trace_detected(self):
        state = _make_log_state("completed")
        shards = [{"status": "completed", "shard_id": "s1", "compute_info": {"vm_name": "vm-01"}}]
        sm = _make_log_state_manager(
            shards=shards,
            vm_logs="Traceback (most recent call last):\n  File foo.py line 10\nValueError: bad value",
        )
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["log_analysis"]["has_stack_traces"] is True
        assert result["status_detail"] == "failed_with_errors"

    def test_result_is_cached(self):
        state = _make_log_state("completed")
        shards = [{"status": "completed", "shard_id": "s1", "compute_info": {}}]
        sm = _make_log_state_manager(shards=shards)
        analyze_deployment_logs_sync(sm, "dep-001", state)
        assert "dep-001" in _log_analysis_cache

    def test_cache_hit_skips_shards_call(self):
        state = _make_log_state("completed")
        sm = _make_log_state_manager()
        _log_analysis_cache["dep-001"] = {
            "data": {"status_detail": "cached", "log_analysis": {}},
            "timestamp": time.time(),
        }
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "cached"
        sm.get_deployment_shards.assert_not_called()

    def test_expired_cache_re_runs(self):
        state = _make_log_state("completed")
        shards = [{"status": "completed", "shard_id": "s1", "compute_info": {}}]
        sm = _make_log_state_manager(shards=shards)
        _log_analysis_cache["dep-001"] = {
            "data": {"status_detail": "old_cached", "log_analysis": {}},
            "timestamp": 0,
        }
        analyze_deployment_logs_sync(sm, "dep-001", state)
        sm.get_deployment_shards.assert_called_once()

    def test_status_via_str_not_value(self):
        state = SimpleNamespace(status="completed")
        shards = [{"status": "completed", "shard_id": "s1", "compute_info": {}}]
        sm = _make_log_state_manager(shards=shards)
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert "status_detail" in result

    def test_exception_from_state_manager_returns_error(self):
        state = _make_log_state("completed")
        sm = MagicMock()
        sm.get_deployment_shards.side_effect = OSError("GCS down")
        result = analyze_deployment_logs_sync(sm, "dep-001", state)
        assert result["status_detail"] == "analysis_error"
        assert "error" in result
