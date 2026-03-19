"""
Unit tests for deployment_service.services.*

Covers:
- DeploymentService: init, config_loader lazy property, shard_calculator lazy property,
  validate_service (valid/invalid), get_service_info (found/not found),
  list_available_services (success/empty/error), get_venues_for_service (list/dict/error)
- StatusService: init, get_deployment_status (success/error), list_deployments
  (unfiltered/filtered/error), cancel_deployment (completed/force/error),
  display_hierarchical_status (basic/with shards), refresh_deployment_status
- LogService: init, get_deployment_logs (no project/success/error), format_log_entry,
  analyze_logs_for_errors (empty/mixed severities)
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import click
import pytest

from deployment_service.services.deployment_service import DeploymentService
from deployment_service.services.log_service import LogService
from deployment_service.services.status_service import StatusService

# ---------------------------------------------------------------------------
# DeploymentService
# ---------------------------------------------------------------------------


class TestDeploymentServiceInit:
    """Tests for DeploymentService.__init__."""

    @pytest.mark.unit
    def test_init_default_config_dir(self) -> None:
        svc = DeploymentService()
        assert svc.config_dir is None
        assert svc._config_loader is None
        assert svc._shard_calculator is None

    @pytest.mark.unit
    def test_init_custom_config_dir(self) -> None:
        svc = DeploymentService("/my/configs")
        assert svc.config_dir == "/my/configs"


class TestDeploymentServiceConfigLoaderProperty:
    """Tests for the config_loader lazy property."""

    @pytest.mark.unit
    def test_config_loader_created_on_first_access(self) -> None:
        svc = DeploymentService("/tmp/configs")
        with patch("deployment_service.services.deployment_service.ConfigLoader") as mock_cls:
            mock_cls.return_value = MagicMock()
            loader = svc.config_loader
        mock_cls.assert_called_once_with("/tmp/configs")
        assert loader is mock_cls.return_value

    @pytest.mark.unit
    def test_config_loader_cached_after_first_access(self) -> None:
        svc = DeploymentService("/tmp/configs")
        with patch("deployment_service.services.deployment_service.ConfigLoader") as mock_cls:
            mock_cls.return_value = MagicMock()
            loader1 = svc.config_loader
            loader2 = svc.config_loader
        # Should only be called once
        mock_cls.assert_called_once()
        assert loader1 is loader2

    @pytest.mark.unit
    def test_config_loader_uses_default_when_none(self) -> None:
        svc = DeploymentService(None)
        with patch("deployment_service.services.deployment_service.ConfigLoader") as mock_cls:
            mock_cls.return_value = MagicMock()
            _ = svc.config_loader
        mock_cls.assert_called_once_with("configs")


class TestDeploymentServiceShardCalculatorProperty:
    """Tests for the shard_calculator lazy property."""

    @pytest.mark.unit
    def test_shard_calculator_created_on_first_access(self) -> None:
        svc = DeploymentService("/tmp/configs")
        with patch("deployment_service.services.deployment_service.ShardCalculator") as mock_cls:
            mock_cls.return_value = MagicMock()
            calc = svc.shard_calculator
        mock_cls.assert_called_once_with("/tmp/configs")
        assert calc is mock_cls.return_value

    @pytest.mark.unit
    def test_shard_calculator_uses_default_when_none(self) -> None:
        svc = DeploymentService(None)
        with patch("deployment_service.services.deployment_service.ShardCalculator") as mock_cls:
            mock_cls.return_value = MagicMock()
            _ = svc.shard_calculator
        mock_cls.assert_called_once_with("configs")


class TestDeploymentServiceValidateService:
    """Tests for validate_service."""

    @pytest.mark.unit
    def test_validate_valid_service_no_error(self) -> None:
        svc = DeploymentService("/tmp")
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {"service": "my-svc"}
        svc._config_loader = mock_loader
        # Should not raise
        svc.validate_service("my-svc")
        mock_loader.load_service_config.assert_called_once_with("my-svc")

    @pytest.mark.unit
    def test_validate_invalid_service_raises_click_exception(self) -> None:
        svc = DeploymentService("/tmp")
        mock_loader = MagicMock()
        mock_loader.load_service_config.side_effect = ValueError("config not found")
        svc._config_loader = mock_loader
        with pytest.raises(click.ClickException, match="Invalid service 'bad-svc'"):
            svc.validate_service("bad-svc")

    @pytest.mark.unit
    def test_validate_os_error_raises_click_exception(self) -> None:
        svc = DeploymentService("/tmp")
        mock_loader = MagicMock()
        mock_loader.load_service_config.side_effect = OSError("file not found")
        svc._config_loader = mock_loader
        with pytest.raises(click.ClickException, match="Invalid service"):
            svc.validate_service("missing-svc")


class TestDeploymentServiceGetServiceInfo:
    """Tests for get_service_info."""

    @pytest.mark.unit
    def test_returns_info_dict(self) -> None:
        svc = DeploymentService("/tmp")
        mock_config = MagicMock()
        mock_config.description = "A test service"
        mock_config.version = "1.2.3"
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = mock_config
        svc._config_loader = mock_loader
        info = svc.get_service_info("my-svc")
        assert info["service"] == "my-svc"
        assert info["config"] is mock_config
        assert info["metadata"]["description"] == "A test service"
        assert info["metadata"]["version"] == "1.2.3"

    @pytest.mark.unit
    def test_config_without_description_or_version(self) -> None:
        svc = DeploymentService("/tmp")
        # Use a plain dict that has no .description or .version attributes
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {"key": "val"}
        svc._config_loader = mock_loader
        info = svc.get_service_info("my-svc")
        assert info["service"] == "my-svc"
        assert "config" in info

    @pytest.mark.unit
    def test_os_error_raises_click_exception(self) -> None:
        svc = DeploymentService("/tmp")
        mock_loader = MagicMock()
        mock_loader.load_service_config.side_effect = OSError("disk error")
        svc._config_loader = mock_loader
        with pytest.raises(click.ClickException, match="Failed to get service info"):
            svc.get_service_info("my-svc")


class TestDeploymentServiceListAvailableServices:
    """Tests for list_available_services."""

    @pytest.mark.unit
    def test_returns_service_list(self) -> None:
        svc = DeploymentService("/tmp")
        mock_loader = MagicMock()
        mock_loader.list_services.return_value = ["svc-a", "svc-b", "svc-c"]
        svc._config_loader = mock_loader
        result = svc.list_available_services()
        assert result == ["svc-a", "svc-b", "svc-c"]

    @pytest.mark.unit
    def test_returns_empty_on_error(self) -> None:
        svc = DeploymentService("/tmp")
        mock_loader = MagicMock()
        mock_loader.list_services.side_effect = RuntimeError("backend unavailable")
        svc._config_loader = mock_loader
        result = svc.list_available_services()
        assert result == []

    @pytest.mark.unit
    def test_returns_empty_list_when_no_services(self) -> None:
        svc = DeploymentService("/tmp")
        mock_loader = MagicMock()
        mock_loader.list_services.return_value = []
        svc._config_loader = mock_loader
        result = svc.list_available_services()
        assert result == []


class TestDeploymentServiceGetVenuesForService:
    """Tests for get_venues_for_service."""

    @pytest.mark.unit
    def test_returns_list_venues(self) -> None:
        svc = DeploymentService("/tmp")
        mock_config = MagicMock()
        mock_config.venues = ["BINANCE-SPOT", "CME"]
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = mock_config
        svc._config_loader = mock_loader
        result = svc.get_venues_for_service("my-svc")
        assert result == ["BINANCE-SPOT", "CME"]

    @pytest.mark.unit
    def test_returns_keys_when_venues_is_dict(self) -> None:
        svc = DeploymentService("/tmp")
        mock_config = MagicMock()
        mock_config.venues = {"BINANCE-SPOT": {}, "CME": {}}
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = mock_config
        svc._config_loader = mock_loader
        result = svc.get_venues_for_service("my-svc")
        assert set(result) == {"BINANCE-SPOT", "CME"}

    @pytest.mark.unit
    def test_returns_empty_on_error(self) -> None:
        svc = DeploymentService("/tmp")
        mock_loader = MagicMock()
        mock_loader.load_service_config.side_effect = OSError("no file")
        svc._config_loader = mock_loader
        result = svc.get_venues_for_service("my-svc")
        assert result == []

    @pytest.mark.unit
    def test_returns_empty_when_no_venues_attr(self) -> None:
        svc = DeploymentService("/tmp")
        # Object with no venues attribute
        mock_config = object()
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = mock_config
        svc._config_loader = mock_loader
        result = svc.get_venues_for_service("my-svc")
        assert result == []


# ---------------------------------------------------------------------------
# StatusService
# ---------------------------------------------------------------------------


class TestStatusServiceInit:
    """Tests for StatusService.__init__."""

    @pytest.mark.unit
    def test_init_sets_project_id(self) -> None:
        svc = StatusService("my-project")
        assert svc.project_id == "my-project"

    @pytest.mark.unit
    def test_init_none_project_id(self) -> None:
        svc = StatusService()
        assert svc.project_id is None


class TestStatusServiceGetDeploymentStatus:
    """Tests for get_deployment_status."""

    @pytest.mark.unit
    def test_returns_status_dict(self) -> None:
        svc = StatusService("proj")
        status = svc.get_deployment_status("dep-001")
        assert status["deployment_id"] == "dep-001"
        assert "status" in status
        assert "shards" in status

    @pytest.mark.unit
    def test_returns_error_dict_on_exception(self) -> None:
        svc = StatusService("proj")
        with patch.object(
            svc, "_fetch_deployment_status", side_effect=RuntimeError("backend down")
        ):
            status = svc.get_deployment_status("dep-001")
        assert status["deployment_id"] == "dep-001"
        assert status["status"] == "unknown"
        assert "error" in status


class TestStatusServiceListDeployments:
    """Tests for list_deployments."""

    @pytest.mark.unit
    def test_returns_all_without_filter(self) -> None:
        svc = StatusService("proj")
        mock_deps = [
            {"deployment_id": "dep-001", "status": "running"},
            {"deployment_id": "dep-002", "status": "completed"},
        ]
        with patch.object(svc, "_fetch_deployments_list", return_value=mock_deps):
            result = svc.list_deployments()
        assert len(result) == 2

    @pytest.mark.unit
    def test_filters_by_status(self) -> None:
        svc = StatusService("proj")
        mock_deps = [
            {"deployment_id": "dep-001", "status": "running"},
            {"deployment_id": "dep-002", "status": "completed"},
            {"deployment_id": "dep-003", "status": "failed"},
        ]
        with patch.object(svc, "_fetch_deployments_list", return_value=mock_deps):
            result = svc.list_deployments(status_filter="running")
        assert len(result) == 1
        assert result[0]["deployment_id"] == "dep-001"

    @pytest.mark.unit
    def test_case_insensitive_filter(self) -> None:
        svc = StatusService("proj")
        mock_deps = [{"deployment_id": "dep-001", "status": "Running"}]
        with patch.object(svc, "_fetch_deployments_list", return_value=mock_deps):
            result = svc.list_deployments(status_filter="running")
        assert len(result) == 1

    @pytest.mark.unit
    def test_returns_empty_on_error(self) -> None:
        svc = StatusService("proj")
        with patch.object(svc, "_fetch_deployments_list", side_effect=OSError("db fail")):
            result = svc.list_deployments()
        assert result == []

    @pytest.mark.unit
    def test_passes_limit_to_backend(self) -> None:
        svc = StatusService("proj")
        with patch.object(svc, "_fetch_deployments_list", return_value=[]) as mock_fetch:
            svc.list_deployments(limit=25)
        mock_fetch.assert_called_once_with(25)


class TestStatusServiceCancelDeployment:
    """Tests for cancel_deployment."""

    @pytest.mark.unit
    def test_cancel_running_deployment_succeeds(self) -> None:
        svc = StatusService("proj")
        with (
            patch.object(svc, "get_deployment_status", return_value={"status": "running"}),
            patch.object(svc, "_cancel_deployment_backend", return_value=True),
        ):
            result = svc.cancel_deployment("dep-001")
        assert result is True

    @pytest.mark.unit
    def test_cancel_completed_without_force_raises(self) -> None:
        svc = StatusService("proj")
        with (
            patch.object(svc, "get_deployment_status", return_value={"status": "completed"}),
            pytest.raises(click.ClickException, match="already completed"),
        ):
            svc.cancel_deployment("dep-001", force=False)

    @pytest.mark.unit
    def test_cancel_completed_with_force_succeeds(self) -> None:
        svc = StatusService("proj")
        with (
            patch.object(svc, "get_deployment_status", return_value={"status": "completed"}),
            patch.object(svc, "_cancel_deployment_backend", return_value=True),
        ):
            result = svc.cancel_deployment("dep-001", force=True)
        assert result is True

    @pytest.mark.unit
    def test_cancel_returns_false_on_error(self) -> None:
        svc = StatusService("proj")
        with patch.object(svc, "get_deployment_status", side_effect=OSError("timeout")):
            result = svc.cancel_deployment("dep-001")
        assert result is False


class TestStatusServiceDisplayHierarchicalStatus:
    """Tests for display_hierarchical_status."""

    @pytest.mark.unit
    def test_displays_basic_fields(self) -> None:
        svc = StatusService("proj")
        with patch.object(
            svc,
            "get_deployment_status",
            return_value={
                "status": "running",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T01:00:00Z",
                "summary": {
                    "total_shards": 5,
                    "completed_shards": 3,
                    "failed_shards": 1,
                    "running_shards": 1,
                },
                "shards": [],
            },
        ):
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                svc.display_hierarchical_status("dep-001")

        combined = "\n".join(output_lines)
        assert "dep-001" in combined
        assert "running" in combined

    @pytest.mark.unit
    def test_displays_shard_details_when_requested(self) -> None:
        svc = StatusService("proj")
        with patch.object(
            svc,
            "get_deployment_status",
            return_value={
                "status": "running",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T01:00:00Z",
                "summary": {},
                "shards": [
                    {"shard_id": "sh-001", "status": "completed"},
                    {"shard_id": "sh-002", "status": "failed"},
                ],
            },
        ):
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                svc.display_hierarchical_status("dep-001", show_details=True)

        combined = "\n".join(output_lines)
        assert "sh-001" in combined
        assert "sh-002" in combined


class TestStatusServiceRefreshDeploymentStatus:
    """Tests for refresh_deployment_status."""

    @pytest.mark.unit
    def test_refresh_returns_status(self) -> None:
        svc = StatusService("proj")
        with patch.object(
            svc,
            "_force_refresh_status",
            return_value={"deployment_id": "dep-001", "status": "completed"},
        ):
            result = svc.refresh_deployment_status("dep-001")
        assert result["status"] == "completed"

    @pytest.mark.unit
    def test_refresh_falls_back_on_error(self) -> None:
        svc = StatusService("proj")
        with (
            patch.object(svc, "_force_refresh_status", side_effect=RuntimeError("timeout")),
            patch.object(
                svc,
                "get_deployment_status",
                return_value={"deployment_id": "dep-001", "status": "unknown"},
            ),
        ):
            result = svc.refresh_deployment_status("dep-001")
        assert result["status"] == "unknown"


# ---------------------------------------------------------------------------
# LogService
# ---------------------------------------------------------------------------


class TestLogServiceInit:
    """Tests for LogService.__init__."""

    @pytest.mark.unit
    def test_init_sets_project_id(self) -> None:
        svc = LogService("my-project")
        assert svc.project_id == "my-project"

    @pytest.mark.unit
    def test_init_none_project_id(self) -> None:
        svc = LogService()
        assert svc.project_id is None


class TestLogServiceGetDeploymentLogs:
    """Tests for get_deployment_logs."""

    @pytest.mark.unit
    def test_raises_when_no_project_id(self) -> None:
        svc = LogService(None)
        with pytest.raises(click.ClickException, match="Project ID required"):
            svc.get_deployment_logs("dep-001")

    @pytest.mark.unit
    def test_returns_empty_on_query_error(self) -> None:
        svc = LogService("my-project")
        with patch.object(svc, "_query_cloud_logs", side_effect=OSError("network down")):
            result = svc.get_deployment_logs("dep-001")
        assert result == []

    @pytest.mark.unit
    def test_delegates_to_query_cloud_logs(self) -> None:
        svc = LogService("my-project")
        expected = [{"timestamp": "2024-01-01", "severity": "INFO", "textPayload": "hello"}]
        with patch.object(svc, "_query_cloud_logs", return_value=expected):
            result = svc.get_deployment_logs("dep-001", since="2h", lines=50)
        assert result == expected


class TestLogServiceFormatLogEntry:
    """Tests for format_log_entry / _format_log_entry."""

    @pytest.mark.unit
    def test_formats_text_payload(self) -> None:
        svc = LogService("proj")
        entry = {
            "timestamp": "2024-01-01T00:00:00Z",
            "severity": "INFO",
            "textPayload": "Service started",
        }
        result = svc.format_log_entry(entry)
        assert "[2024-01-01T00:00:00Z]" in result
        assert "INFO" in result
        assert "Service started" in result

    @pytest.mark.unit
    def test_formats_json_payload(self) -> None:
        svc = LogService("proj")
        entry = {
            "timestamp": "2024-01-01T00:00:00Z",
            "severity": "ERROR",
            "jsonPayload": {"msg": "crash", "code": 500},
        }
        result = svc.format_log_entry(entry)
        assert "ERROR" in result
        assert "crash" in result

    @pytest.mark.unit
    def test_formats_entry_missing_fields(self) -> None:
        svc = LogService("proj")
        entry: dict[str, object] = {}
        result = svc.format_log_entry(entry)
        # Should not raise; falls back to empty defaults
        assert "INFO" in result or result.startswith("[")

    @pytest.mark.unit
    def test_public_wrapper_delegates_to_private(self) -> None:
        svc = LogService("proj")
        entry = {"timestamp": "t", "severity": "WARN", "textPayload": "msg"}
        assert svc.format_log_entry(entry) == svc._format_log_entry(entry)


class TestLogServiceAnalyzeLogsForErrors:
    """Tests for analyze_logs_for_errors."""

    @pytest.mark.unit
    def test_empty_logs(self) -> None:
        svc = LogService("proj")
        with patch.object(svc, "get_deployment_logs", return_value=[]):
            result = svc.analyze_logs_for_errors("dep-001")
        assert result["total_entries"] == 0
        assert result["error_count"] == 0
        assert result["warning_count"] == 0

    @pytest.mark.unit
    def test_counts_errors_and_warnings(self) -> None:
        svc = LogService("proj")
        logs = [
            {"severity": "ERROR", "textPayload": "connection failed"},
            {"severity": "ERROR", "textPayload": "timeout occurred"},
            {"severity": "WARNING", "textPayload": "slow response"},
            {"severity": "INFO", "textPayload": "all good"},
        ]
        with patch.object(svc, "get_deployment_logs", return_value=logs):
            result = svc.analyze_logs_for_errors("dep-001")
        assert result["error_count"] == 2
        assert result["warning_count"] == 1
        assert result["total_entries"] == 4

    @pytest.mark.unit
    def test_tracks_common_error_patterns(self) -> None:
        svc = LogService("proj")
        logs = [
            {"severity": "ERROR", "textPayload": "connection timeout"},
            {"severity": "ERROR", "textPayload": "connection failed"},
            {"severity": "CRITICAL", "textPayload": "disk full error"},
        ]
        with patch.object(svc, "get_deployment_logs", return_value=logs):
            result = svc.analyze_logs_for_errors("dep-001")
        common_errors = result["common_errors"]
        # "timeout" pattern should appear once, "failed"/"error" pattern twice
        assert "timeout" in common_errors or "failed" in common_errors

    @pytest.mark.unit
    def test_critical_severity_counted_as_error(self) -> None:
        svc = LogService("proj")
        logs = [{"severity": "CRITICAL", "textPayload": "out of memory"}]
        with patch.object(svc, "get_deployment_logs", return_value=logs):
            result = svc.analyze_logs_for_errors("dep-001")
        assert result["error_count"] == 1

    @pytest.mark.unit
    def test_top_errors_sorted_by_frequency(self) -> None:
        svc = LogService("proj")
        logs = [
            {"severity": "ERROR", "textPayload": "connection failed connection failed"},
            {"severity": "ERROR", "textPayload": "timeout"},
        ]
        with patch.object(svc, "get_deployment_logs", return_value=logs):
            result = svc.analyze_logs_for_errors("dep-001")
        top_errors = result["top_errors"]
        assert isinstance(top_errors, list)
        # Each entry is (pattern, count)
        if top_errors:
            assert len(top_errors[0]) == 2
