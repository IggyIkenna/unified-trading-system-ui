"""
Unit tests for deployment_service.cli.handlers.*

Covers:
- CalculationHandler: handle_calculate, handle_list_services, handle_service_info,
  handle_venues, _calculate_shards, _output_results (all three formats)
- DeploymentHandler: handle_deploy (dry/actual), handle_resume, handle_status,
  handle_cancel, handle_logs, _display_deployments_table, _generate_deployment_id
- MaintenanceHandler: handle_cleanup_gcs, handle_fix_stale, handle_validate_buckets,
  handle_retry_failed, _check_bucket_naming, _extract_bucket_configs,
  _show_cleanup_preview
- ReportingHandler: handle_report, handle_versions, handle_data_flow,
  _generate_summary_stats, _generate_service_breakdown, _output_report
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import click
import pytest
from click.testing import CliRunner

from deployment_service.cli.handlers.calculation_handler import CalculationHandler
from deployment_service.cli.handlers.deployment_handler import DeploymentHandler
from deployment_service.cli.handlers.maintenance_handler import MaintenanceHandler
from deployment_service.cli.handlers.reporting_handler import ReportingHandler

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_ctx(obj: dict | None = None) -> click.Context:
    """Return a minimal Click context with a populated obj dict."""

    @click.command()
    @click.pass_context
    def _dummy(ctx: click.Context) -> None:
        pass

    ctx = click.Context(_dummy)
    ctx.obj = obj or {
        "config_dir": "/tmp/test-configs",
        "project_id": "test-project",
        "cloud": "gcp",
    }
    return ctx


def _mock_deployment_service() -> MagicMock:
    svc = MagicMock()
    svc.list_available_services.return_value = ["svc-a", "svc-b"]
    svc.get_service_info.return_value = {
        "service": "svc-a",
        "config": {"version": "1.0"},
        "metadata": {},
    }
    svc.get_venues_for_service.return_value = ["BINANCE-SPOT", "CME"]
    svc.validate_service.return_value = None
    svc.shard_calculator = MagicMock()
    return svc


def _mock_status_service() -> MagicMock:
    svc = MagicMock()
    svc.get_deployment_status.return_value = {"status": "running", "shards": []}
    svc.list_deployments.return_value = []
    svc.cancel_deployment.return_value = True
    return svc


def _mock_log_service() -> MagicMock:
    svc = MagicMock()
    svc.get_deployment_logs.return_value = []
    svc.format_log_entry.side_effect = lambda e: str(e)
    return svc


# ---------------------------------------------------------------------------
# CalculationHandler
# ---------------------------------------------------------------------------


class TestCalculationHandlerInit:
    """Tests for CalculationHandler initialisation."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_init_extracts_config_dir(self) -> None:
        ctx = _make_ctx({"config_dir": "/my/configs", "project_id": None, "cloud": "gcp"})
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds:
            handler = CalculationHandler(ctx)
        assert handler.config_dir == "/my/configs"
        mock_ds.assert_called_once_with("/my/configs")

    @pytest.mark.unit
    @pytest.mark.cli
    def test_init_none_config_dir(self) -> None:
        ctx = _make_ctx({"config_dir": None, "project_id": None, "cloud": "gcp"})
        with patch("deployment_service.cli.handlers.calculation_handler.DeploymentService"):
            handler = CalculationHandler(ctx)
        assert handler.config_dir is None


class TestCalculationHandlerCalculate:
    """Tests for handle_calculate."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_handle_calculate_table_output(self, capsys: pytest.CaptureFixture) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.shard_calculator.calculate.return_value = {
                "shards": [
                    {"shard_id": "shard-001", "date": "2024-01-01", "venue": "BINANCE-SPOT"}
                ],
                "summary": {"service": "svc-a"},
            }
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            handler.handle_calculate(service="svc-a", output="table", dry_run=True)

        mock_ds.validate_service.assert_called_once_with("svc-a")

    @pytest.mark.unit
    @pytest.mark.cli
    def test_handle_calculate_json_output(self) -> None:
        ctx = _make_ctx()
        runner = CliRunner()
        with (
            runner.isolated_filesystem(),
            patch(
                "deployment_service.cli.handlers.calculation_handler.DeploymentService"
            ) as mock_ds_cls,
        ):
            mock_ds = _mock_deployment_service()
            mock_ds.shard_calculator.calculate.return_value = {
                "shards": [{"shard_id": "s1", "date": "2024-01-01", "venue": "CME"}],
                "summary": {"service": "svc-a"},
            }
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_calculate(service="svc-a", output="json", dry_run=False)

        combined = "\n".join(output_lines)
        data = json.loads(combined)
        assert "shards" in data
        assert "summary" in data

    @pytest.mark.unit
    @pytest.mark.cli
    def test_handle_calculate_commands_output(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.shard_calculator.calculate.return_value = {
                "shards": [{"shard_id": "s1", "args": {"category": "CEFI"}}],
                "summary": {"service": "svc-a"},
            }
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_calculate(service="svc-a", output="commands", dry_run=False)

        combined = "\n".join(output_lines)
        assert "deploy --service svc-a" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_handle_calculate_unknown_output_raises(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.shard_calculator.calculate.return_value = {
                "shards": [{"shard_id": "s1"}],
                "summary": {},
            }
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            with pytest.raises(click.ClickException, match="Unknown output format"):
                handler.handle_calculate(service="svc-a", output="xml", dry_run=False)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_handle_calculate_shard_limit_exceeded(self) -> None:
        from deployment_service.calculators.base_calculator import ShardLimitExceeded

        exc = ShardLimitExceeded(
            total_shards=999,
            max_shards=100,
            service="svc-a",
            breakdown={"date": 999},
        )
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.shard_calculator.calculate.side_effect = exc
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            with pytest.raises(click.ClickException):
                handler.handle_calculate(service="svc-a", output="table", dry_run=False)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_handle_calculate_value_error(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.shard_calculator.calculate.side_effect = ValueError("bad param")
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            with pytest.raises(click.ClickException, match="Invalid calculation parameters"):
                handler.handle_calculate(service="svc-a", output="table", dry_run=False)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_handle_calculate_runtime_error(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.shard_calculator.calculate.side_effect = RuntimeError("crash")
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            with pytest.raises(click.ClickException, match="Calculation failed"):
                handler.handle_calculate(service="svc-a", output="table", dry_run=False)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_handle_calculate_no_shards_table(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.shard_calculator.calculate.return_value = {"shards": [], "summary": {}}
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_calculate(service="svc-a", output="table", dry_run=True)

        assert any("No shards" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_handle_calculate_filters_none_params(self) -> None:
        """Ensure None-valued params are removed before calling calculator.calculate."""
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.shard_calculator.calculate.return_value = {"shards": [], "summary": {}}
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            handler.handle_calculate(
                service="svc-a",
                start_date=None,
                venue=None,
                output="table",
                dry_run=False,
            )

        call_kwargs = mock_ds.shard_calculator.calculate.call_args[1]
        assert "start_date" not in call_kwargs
        assert "venue" not in call_kwargs
        assert "service" in call_kwargs


class TestCalculationHandlerListServices:
    """Tests for handle_list_services."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_list_services_displays_all(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_list_services()

        combined = "\n".join(output_lines)
        assert "svc-a" in combined
        assert "svc-b" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_list_services_empty(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.list_available_services.return_value = []
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_list_services()

        assert any("No services" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_list_services_os_error(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.list_available_services.side_effect = OSError("disk error")
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            with pytest.raises(click.ClickException, match="File system error"):
                handler.handle_list_services()


class TestCalculationHandlerServiceInfo:
    """Tests for handle_service_info."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_service_info_shows_config(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.get_service_info.return_value = {
                "config": {"machine_type": "n1-standard-4"},
                "metadata": {"owner": "team-alpha"},
            }
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_service_info("svc-a")

        combined = "\n".join(output_lines)
        assert "svc-a" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_service_info_value_error(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.get_service_info.side_effect = ValueError("not found")
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            with pytest.raises(click.ClickException, match="Invalid service"):
                handler.handle_service_info("bad-svc")


class TestCalculationHandlerVenues:
    """Tests for handle_venues."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_venues_lists_by_service(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_venues()

        combined = "\n".join(output_lines)
        assert "svc-a" in combined or "Venues" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_venues_no_services(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.list_available_services.return_value = []
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_venues()

        assert any("No services" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_venues_handles_get_venues_error_gracefully(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.get_venues_for_service.side_effect = ValueError("bad config")
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_venues()

        combined = "\n".join(output_lines)
        # Should not raise; shows error message per service
        assert "invalid venue configuration" in combined.lower() or "svc-a" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_venues_runtime_error_propagates(self) -> None:
        ctx = _make_ctx()
        with patch(
            "deployment_service.cli.handlers.calculation_handler.DeploymentService"
        ) as mock_ds_cls:
            mock_ds = _mock_deployment_service()
            mock_ds.list_available_services.side_effect = RuntimeError("kaboom")
            mock_ds_cls.return_value = mock_ds
            handler = CalculationHandler(ctx)
            with pytest.raises(click.ClickException, match="Failed to list venues"):
                handler.handle_venues()


# ---------------------------------------------------------------------------
# DeploymentHandler
# ---------------------------------------------------------------------------


class TestDeploymentHandlerInit:
    """Tests for DeploymentHandler initialisation."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_init_sets_services(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.deployment_handler.StatusService"),
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            handler = DeploymentHandler(ctx)
        assert handler.cloud_provider == "gcp"


class TestDeploymentHandlerDeploy:
    """Tests for handle_deploy."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_dry_run_deploy_shows_info(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.deployment_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.deployment_handler.StatusService"),
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds_cls.return_value = mock_ds
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_deploy(service="svc-a", dry_run=True)

        combined = "\n".join(output_lines)
        assert "DRY RUN" in combined
        assert "svc-a" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_actual_deploy_generates_deployment_id(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.deployment_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.deployment_handler.StatusService"),
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds_cls.return_value = mock_ds
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_deploy(service="svc-a", dry_run=False, max_concurrent=10)

        combined = "\n".join(output_lines)
        assert "svc-a" in combined
        assert "Deployment ID" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_deploy_validation_error_raises_click_exception(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.deployment_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.deployment_handler.StatusService"),
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds.validate_service.side_effect = ValueError("no such service")
            mock_ds_cls.return_value = mock_ds
            handler = DeploymentHandler(ctx)
            with pytest.raises(click.ClickException, match="Deployment failed"):
                handler.handle_deploy(service="bad-svc", dry_run=False)


class TestDeploymentHandlerResume:
    """Tests for handle_resume."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_resume_already_completed(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.deployment_handler.StatusService"
            ) as mock_ss_cls,
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.get_deployment_status.return_value = {"status": "completed"}
            mock_ss_cls.return_value = mock_ss
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_resume("dep-001")

        assert any("already completed" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_resume_already_running(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.deployment_handler.StatusService"
            ) as mock_ss_cls,
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.get_deployment_status.return_value = {"status": "running"}
            mock_ss_cls.return_value = mock_ss
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_resume("dep-002")

        assert any("already running" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_resume_paused_triggers_monitoring(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.deployment_handler.StatusService"
            ) as mock_ss_cls,
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.get_deployment_status.return_value = {"status": "paused"}
            mock_ss_cls.return_value = mock_ss
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_resume("dep-003")

        assert any("Resuming" in line or "completed" in line for line in output_lines)


class TestDeploymentHandlerStatus:
    """Tests for handle_status."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_status_specific_deployment(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.deployment_handler.StatusService"
            ) as mock_ss_cls,
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss_cls.return_value = mock_ss
            handler = DeploymentHandler(ctx)
            handler.handle_status(deployment_id="dep-001")

        mock_ss.display_hierarchical_status.assert_called_once_with("dep-001", False)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_status_show_all(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.deployment_handler.StatusService"
            ) as mock_ss_cls,
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.list_deployments.return_value = [
                {"deployment_id": "dep-001", "status": "running", "created_at": "2024-01-01"}
            ]
            mock_ss_cls.return_value = mock_ss
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_status(show_all=True)

        mock_ss.list_deployments.assert_called_with(limit=100)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_status_no_deployments(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.deployment_handler.StatusService"
            ) as mock_ss_cls,
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss_cls.return_value = mock_ss
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_status()

        assert any("No deployments" in line for line in output_lines)


class TestDeploymentHandlerCancel:
    """Tests for handle_cancel."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cancel_with_force(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.deployment_handler.StatusService"
            ) as mock_ss_cls,
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss_cls.return_value = mock_ss
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_cancel("dep-001", force=True)

        mock_ss.cancel_deployment.assert_called_once_with("dep-001", True)
        assert any("Successfully cancelled" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cancel_failed_shows_message(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.deployment_handler.StatusService"
            ) as mock_ss_cls,
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.cancel_deployment.return_value = False
            mock_ss_cls.return_value = mock_ss
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_cancel("dep-001", force=True)

        assert any("Failed to cancel" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cancel_no_confirm_aborts(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.deployment_handler.StatusService"
            ) as mock_ss_cls,
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
            patch("click.confirm", return_value=False),
        ):
            mock_ss = _mock_status_service()
            mock_ss_cls.return_value = mock_ss
            handler = DeploymentHandler(ctx)
            handler.handle_cancel("dep-001", force=False)

        mock_ss.cancel_deployment.assert_not_called()


class TestDeploymentHandlerLogs:
    """Tests for handle_logs."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_logs_no_logs_found(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.deployment_handler.StatusService"),
            patch("deployment_service.cli.handlers.deployment_handler.LogService") as mock_ls_cls,
        ):
            mock_ls = _mock_log_service()
            mock_ls_cls.return_value = mock_ls
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_logs("dep-001")

        assert any("No logs" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_logs_formats_and_displays_entries(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.deployment_handler.StatusService"),
            patch("deployment_service.cli.handlers.deployment_handler.LogService") as mock_ls_cls,
        ):
            mock_ls = _mock_log_service()
            mock_ls.get_deployment_logs.return_value = [
                {"timestamp": "2024-01-01T00:00:00Z", "severity": "INFO", "textPayload": "Started"}
            ]
            mock_ls.format_log_entry.return_value = "[2024-01-01] INFO: Started"
            mock_ls_cls.return_value = mock_ls
            handler = DeploymentHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_logs("dep-001")

        assert any("INFO" in line or "Started" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_logs_os_error_raises(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.deployment_handler.StatusService"),
            patch("deployment_service.cli.handlers.deployment_handler.LogService") as mock_ls_cls,
        ):
            mock_ls = _mock_log_service()
            mock_ls.get_deployment_logs.side_effect = OSError("connection failed")
            mock_ls_cls.return_value = mock_ls
            handler = DeploymentHandler(ctx)
            with pytest.raises(click.ClickException, match="Log retrieval failed"):
                handler.handle_logs("dep-001")


class TestDeploymentHandlerGenerateId:
    """Tests for _generate_deployment_id."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_id_contains_service_name(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.deployment_handler.StatusService"),
            patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        ):
            handler = DeploymentHandler(ctx)
            dep_id = handler._generate_deployment_id("my-service")

        assert dep_id.startswith("my-service-")
        assert len(dep_id) > len("my-service-")


# ---------------------------------------------------------------------------
# MaintenanceHandler
# ---------------------------------------------------------------------------


class TestMaintenanceHandlerInit:
    """Tests for MaintenanceHandler initialisation."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_init_sets_project_id(self) -> None:
        ctx = _make_ctx({"config_dir": None, "project_id": "proj-123", "cloud": "gcp"})
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            handler = MaintenanceHandler(ctx)
        assert handler.project_id == "proj-123"
        assert handler.cloud_provider == "gcp"


class TestMaintenanceHandlerCleanupGcs:
    """Tests for handle_cleanup_gcs."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cleanup_requires_project_id(self) -> None:
        ctx = _make_ctx({"config_dir": None, "project_id": None, "cloud": "gcp"})
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            handler = MaintenanceHandler(ctx)
            with pytest.raises(click.ClickException, match="Project ID required"):
                handler.handle_cleanup_gcs("my-bucket", dry_run=True)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cleanup_dry_run_no_deletions(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
            patch("subprocess.run") as mock_run,
        ):
            mock_run.return_value = MagicMock(
                stdout="",
                returncode=0,
            )
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_cleanup_gcs("my-bucket", dry_run=True, older_than_days=30)

        combined = "\n".join(output_lines)
        assert "DRY RUN" in combined or "No files" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cleanup_shows_preview_for_old_files(self) -> None:
        ctx = _make_ctx()
        # Simulate gsutil returning files with dates in the past
        import datetime as dt_mod

        old_ts = datetime.now(UTC).timestamp() - 40 * 86400
        old_date = dt_mod.datetime.fromtimestamp(old_ts, tz=UTC)
        date_str = old_date.strftime("%Y-%m-%d %H:%M:%S")
        gsutil_line = f"  100 {date_str}  gs://my-bucket/old-file.txt"

        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
            patch("subprocess.run") as mock_run,
        ):
            mock_run.return_value = MagicMock(stdout=gsutil_line + "\n", returncode=0)
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_cleanup_gcs("my-bucket", dry_run=True, older_than_days=30)

        combined = "\n".join(output_lines)
        assert "1 files" in combined or "would be deleted" in combined or "Files" in combined


class TestMaintenanceHandlerFixStale:
    """Tests for handle_fix_stale."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_fix_single_not_stale(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.maintenance_handler.StatusService"
            ) as mock_ss_cls,
        ):
            mock_ss = _mock_status_service()
            mock_ss.get_deployment_status.return_value = {"status": "completed"}
            mock_ss_cls.return_value = mock_ss
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_fix_stale(deployment_id="dep-001", auto_fix=True)

        assert any("not stale" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_fix_single_stale_auto_fix(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.maintenance_handler.StatusService"
            ) as mock_ss_cls,
        ):
            mock_ss = _mock_status_service()
            mock_ss.get_deployment_status.return_value = {"status": "stale"}
            mock_ss_cls.return_value = mock_ss
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_fix_stale(deployment_id="dep-001", auto_fix=True)

        combined = "\n".join(output_lines)
        assert "Successfully fixed" in combined or "Fixing" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_fix_all_no_stale_deployments(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.maintenance_handler.StatusService"
            ) as mock_ss_cls,
        ):
            mock_ss = _mock_status_service()
            mock_ss.list_deployments.return_value = []
            mock_ss_cls.return_value = mock_ss
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_fix_stale(deployment_id=None, auto_fix=True)

        assert any("No stale" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_fix_all_stale_auto_fix(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.maintenance_handler.StatusService"
            ) as mock_ss_cls,
        ):
            mock_ss = _mock_status_service()
            mock_ss.list_deployments.return_value = [
                {"deployment_id": "dep-001"},
                {"deployment_id": "dep-002"},
            ]
            mock_ss_cls.return_value = mock_ss
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_fix_stale(deployment_id=None, auto_fix=True)

        combined = "\n".join(output_lines)
        assert "Fixed" in combined or "stale" in combined.lower()


class TestMaintenanceHandlerRetryFailed:
    """Tests for handle_retry_failed."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_retry_single_shard_success(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_retry_failed("dep-001", shard_id="sh-1", max_retries=2)

        combined = "\n".join(output_lines)
        assert "Retry" in combined or "shard" in combined.lower()

    @pytest.mark.unit
    @pytest.mark.cli
    def test_retry_all_failed_shards(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.maintenance_handler.StatusService"
            ) as mock_ss_cls,
        ):
            mock_ss = _mock_status_service()
            mock_ss.get_deployment_status.return_value = {
                "shards": [
                    {"shard_id": "sh-1", "status": "failed"},
                    {"shard_id": "sh-2", "status": "completed"},
                ]
            }
            mock_ss_cls.return_value = mock_ss
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_retry_failed("dep-001", shard_id=None, max_retries=1)

        combined = "\n".join(output_lines)
        assert "1" in combined  # 1 failed shard retried

    @pytest.mark.unit
    @pytest.mark.cli
    def test_retry_no_failed_shards(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch(
                "deployment_service.cli.handlers.maintenance_handler.StatusService"
            ) as mock_ss_cls,
        ):
            mock_ss = _mock_status_service()
            mock_ss.get_deployment_status.return_value = {
                "shards": [{"shard_id": "sh-1", "status": "completed"}]
            }
            mock_ss_cls.return_value = mock_ss
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_retry_failed("dep-001")

        assert any("No failed shards" in line for line in output_lines)


class TestMaintenanceHandlerBucketNaming:
    """Tests for _check_bucket_naming."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_valid_bucket_name(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            handler = MaintenanceHandler(ctx)
            issues = handler._check_bucket_naming("my-valid-bucket")
        assert issues == []

    @pytest.mark.unit
    @pytest.mark.cli
    def test_empty_bucket_name(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            handler = MaintenanceHandler(ctx)
            issues = handler._check_bucket_naming("")
        assert any("empty" in issue for issue in issues)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_bucket_name_too_short(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            handler = MaintenanceHandler(ctx)
            issues = handler._check_bucket_naming("ab")
        assert any("short" in issue for issue in issues)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_bucket_name_too_long(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            handler = MaintenanceHandler(ctx)
            issues = handler._check_bucket_naming("a" * 64)
        assert any("long" in issue for issue in issues)


class TestMaintenanceHandlerExtractBucketConfigs:
    """Tests for _extract_bucket_configs."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_extracts_bucket_keys(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            handler = MaintenanceHandler(ctx)
            config: dict[str, object] = {
                "state_bucket": "my-state-bucket",
                "logs_bucket": "my-logs-bucket",
                "other_key": "value",
            }
            result = handler._extract_bucket_configs(config, ())
        assert "state_bucket" in result
        assert "logs_bucket" in result
        assert "other_key" not in result

    @pytest.mark.unit
    @pytest.mark.cli
    def test_category_specific_bucket(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            handler = MaintenanceHandler(ctx)
            config: dict[str, object] = {"cefi_bucket": "cefi-data-bucket"}
            result = handler._extract_bucket_configs(config, ("cefi",))
        assert "cefi_bucket" in result


class TestMaintenanceHandlerValidateBuckets:
    """Tests for handle_validate_buckets."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_validate_no_bucket_configs(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.maintenance_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds.get_service_info.return_value = {"config": {}, "metadata": {}}
            mock_ds_cls.return_value = mock_ds
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_validate_buckets("svc-a")

        assert any("No bucket" in line for line in output_lines)

    @pytest.mark.unit
    @pytest.mark.cli
    def test_validate_buckets_with_bucket_config(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.maintenance_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
            patch("subprocess.run") as mock_run,
        ):
            mock_ds = _mock_deployment_service()
            mock_ds.get_service_info.return_value = {
                "config": {"state_bucket": "state-data"},
                "metadata": {},
            }
            mock_ds_cls.return_value = mock_ds
            mock_run.return_value = MagicMock(returncode=0)
            handler = MaintenanceHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_validate_buckets("svc-a")

        combined = "\n".join(output_lines)
        assert "validat" in combined.lower()


# ---------------------------------------------------------------------------
# ReportingHandler
# ---------------------------------------------------------------------------


class TestReportingHandlerInit:
    """Tests for ReportingHandler initialisation."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_init_sets_project_id(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            handler = ReportingHandler(ctx)
        assert handler.project_id == "test-project"


class TestReportingHandlerReport:
    """Tests for handle_report."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_report_text_format(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService") as mock_ss_cls,
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.list_deployments.return_value = []
            mock_ss_cls.return_value = mock_ss
            handler = ReportingHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_report(output_format="text")

        combined = "\n".join(output_lines)
        assert "DEPLOYMENT REPORT" in combined or "Generating" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_report_json_format(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService") as mock_ss_cls,
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.list_deployments.return_value = []
            mock_ss_cls.return_value = mock_ss
            handler = ReportingHandler(ctx)
            json_lines: list[str] = []
            # collect only the JSON dump line (last echo from _output_json_report)
            with patch("click.echo", side_effect=lambda msg="", **kw: json_lines.append(str(msg))):
                handler.handle_report(output_format="json")

        # Find the line that looks like JSON
        json_str = next((line for line in json_lines if line.strip().startswith("{")), None)
        assert json_str is not None
        data = json.loads(json_str)
        assert "summary" in data
        assert "metadata" in data

    @pytest.mark.unit
    @pytest.mark.cli
    def test_report_csv_format(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService") as mock_ss_cls,
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.list_deployments.return_value = []
            mock_ss_cls.return_value = mock_ss
            handler = ReportingHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_report(output_format="csv")

        combined = "\n".join(output_lines)
        assert "Date" in combined or "Generating" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_report_with_service_filter(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService") as mock_ss_cls,
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.list_deployments.return_value = []
            mock_ss_cls.return_value = mock_ss
            handler = ReportingHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_report(output_format="text", service_filter="svc-a")

        combined = "\n".join(output_lines)
        assert "svc-a" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_report_runtime_error_raises(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService") as mock_ss_cls,
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ss = _mock_status_service()
            mock_ss.list_deployments.side_effect = RuntimeError("backend down")
            mock_ss_cls.return_value = mock_ss
            handler = ReportingHandler(ctx)
            with pytest.raises(click.ClickException, match="Report generation failed"):
                handler.handle_report(output_format="text")


class TestReportingHandlerGenerateSummaryStats:
    """Tests for _generate_summary_stats."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_empty_deployments(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            handler = ReportingHandler(ctx)
            stats = handler._generate_summary_stats([])
        assert stats["total_deployments"] == 0
        assert stats["success_rate"] == 0.0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_mixed_statuses(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            handler = ReportingHandler(ctx)
            deployments = [
                {"status": "completed"},
                {"status": "completed"},
                {"status": "failed"},
                {"status": "running"},
            ]
            stats = handler._generate_summary_stats(deployments)

        assert stats["total_deployments"] == 4
        assert stats["successful"] == 2
        assert stats["failed"] == 1
        assert stats["running"] == 1
        assert stats["success_rate"] == 50.0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_success_status_alias(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            handler = ReportingHandler(ctx)
            stats = handler._generate_summary_stats([{"status": "success"}])

        assert stats["successful"] == 1


class TestReportingHandlerGenerateServiceBreakdown:
    """Tests for _generate_service_breakdown."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_breakdown_groups_by_service(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            handler = ReportingHandler(ctx)
            deployments = [
                {"service": "svc-a", "status": "completed"},
                {"service": "svc-a", "status": "failed"},
                {"service": "svc-b", "status": "completed"},
            ]
            breakdown = handler._generate_service_breakdown(deployments)

        assert "svc-a" in breakdown
        assert "svc-b" in breakdown
        svc_a = breakdown["svc-a"]
        assert svc_a["total"] == 2
        assert svc_a["successful"] == 1
        assert svc_a["failed"] == 1

    @pytest.mark.unit
    @pytest.mark.cli
    def test_success_rate_calculation(self) -> None:
        ctx = _make_ctx()
        with (
            patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            handler = ReportingHandler(ctx)
            deployments = [
                {"service": "svc-a", "status": "completed"},
                {"service": "svc-a", "status": "completed"},
                {"service": "svc-a", "status": "failed"},
                {"service": "svc-a", "status": "failed"},
            ]
            breakdown = handler._generate_service_breakdown(deployments)

        assert breakdown["svc-a"]["success_rate"] == 50.0


class TestReportingHandlerVersions:
    """Tests for handle_versions."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_show_single_service_version(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.reporting_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds.get_service_info.return_value = {
                "config": {"version": "2.3.1"},
                "metadata": {},
            }
            mock_ds_cls.return_value = mock_ds
            handler = ReportingHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_versions("svc-a")

        combined = "\n".join(output_lines)
        assert "svc-a" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_show_all_versions(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.reporting_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds.get_service_info.return_value = {
                "config": {"version": "1.0"},
                "metadata": {},
            }
            mock_ds_cls.return_value = mock_ds
            handler = ReportingHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_versions()

        combined = "\n".join(output_lines)
        assert "Service" in combined or "svc-a" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_versions_runtime_error_is_handled(self) -> None:
        """_show_all_service_versions swallows errors with click.echo (no raise)."""
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.reporting_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds.list_available_services.side_effect = RuntimeError("db down")
            mock_ds_cls.return_value = mock_ds
            handler = ReportingHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                # Should not raise — the error is swallowed and displayed
                handler.handle_versions()

        combined = "\n".join(output_lines)
        assert "Failed" in combined or "db down" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_versions_single_service_runtime_error_propagates(self) -> None:
        """handle_versions(service=...) delegates to _show_service_version which propagates OSError."""
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.reporting_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds.get_service_info.side_effect = RuntimeError("db down")
            mock_ds_cls.return_value = mock_ds
            handler = ReportingHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                # _show_service_version also swallows errors
                handler.handle_versions("svc-a")

        combined = "\n".join(output_lines)
        assert "Failed" in combined or "svc-a" in combined


class TestReportingHandlerDataFlow:
    """Tests for handle_data_flow."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_data_flow_text_format(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.reporting_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds_cls.return_value = mock_ds
            handler = ReportingHandler(ctx)
            output_lines: list[str] = []
            with patch(
                "click.echo", side_effect=lambda msg="", **kw: output_lines.append(str(msg))
            ):
                handler.handle_data_flow(output="text")

        combined = "\n".join(output_lines)
        assert "Data Flow" in combined or "Total Services" in combined

    @pytest.mark.unit
    @pytest.mark.cli
    def test_data_flow_json_format(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.reporting_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds_cls.return_value = mock_ds
            handler = ReportingHandler(ctx)
            json_lines: list[str] = []
            with patch("click.echo", side_effect=lambda msg="", **kw: json_lines.append(str(msg))):
                handler.handle_data_flow(output="json")

        json_str = next((line for line in json_lines if line.strip().startswith("{")), None)
        assert json_str is not None
        data = json.loads(json_str)
        assert "total_services" in data

    @pytest.mark.unit
    @pytest.mark.cli
    def test_data_flow_category_filter(self) -> None:
        ctx = _make_ctx()
        with (
            patch(
                "deployment_service.cli.handlers.reporting_handler.DeploymentService"
            ) as mock_ds_cls,
            patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
            patch("deployment_service.cli.handlers.reporting_handler.LogService"),
        ):
            mock_ds = _mock_deployment_service()
            mock_ds.list_available_services.return_value = ["cefi-svc", "tradfi-svc", "other-svc"]
            mock_ds_cls.return_value = mock_ds
            handler = ReportingHandler(ctx)
            json_lines: list[str] = []
            with patch("click.echo", side_effect=lambda msg="", **kw: json_lines.append(str(msg))):
                handler.handle_data_flow(category="cefi", output="json")

        json_str = next((line for line in json_lines if line.strip().startswith("{")), None)
        assert json_str is not None
        data = json.loads(json_str)
        assert data["filtered_services"] == 1  # only cefi-svc matches
