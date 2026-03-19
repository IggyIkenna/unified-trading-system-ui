"""
Unit tests for deployment_service/cli.py (the top-level refactored CLI entry point).

IMPORTANT: This file is deployment_service/cli.py — NOT deployment_service/cli/main.py.
Because the cli/ package directory shadows cli.py for normal imports, this test file
loads it via importlib to get the correct module under test.

Covers:
- cli group --help and top-level options (--verbose, --cloud, --project-id, --config-dir)
- get_config_dir() utility: found / not found paths
- calculate subcommand wiring
- list-services subcommand wiring
- info subcommand wiring
- venues subcommand wiring
- deploy subcommand wiring (dry-run path)
- resume subcommand wiring
- status subcommand wiring
- cancel subcommand wiring
- logs subcommand wiring
- cleanup-gcs subcommand wiring
- fix-stale subcommand wiring
- validate-buckets subcommand wiring
- retry-failed subcommand wiring
- report subcommand wiring
- versions subcommand wiring
- data-flow subcommand wiring
- check-deps legacy command
- plan-t1 legacy command
- cascade-failure legacy command
- main() entry point
"""

from __future__ import annotations

import importlib.util
import sys
import types
from pathlib import Path
from unittest.mock import MagicMock, patch

import click
import pytest
from click.testing import CliRunner

# ---------------------------------------------------------------------------
# Load deployment_service/cli.py as a separate module (not the cli/ package)
# ---------------------------------------------------------------------------

_CLI_PY_PATH = Path(__file__).parent.parent.parent / "deployment_service" / "cli.py"


def _load_cli_module() -> types.ModuleType:
    """Load deployment_service/cli.py as deployment_service._cli_entry.

    The file uses relative imports (from .cli.handlers...), so it must be
    registered under the deployment_service package to resolve them correctly.
    """

    mod_name = "deployment_service._cli_entry"
    spec = importlib.util.spec_from_file_location(
        mod_name,
        str(_CLI_PY_PATH),
        submodule_search_locations=[],
    )
    assert spec is not None and spec.loader is not None, f"Cannot find {_CLI_PY_PATH}"
    mod = importlib.util.module_from_spec(spec)
    mod.__package__ = "deployment_service"
    sys.modules[mod_name] = mod
    with (
        patch("deployment_service.cli.handlers.calculation_handler.DeploymentService"),
        patch("deployment_service.cli.handlers.deployment_handler.DeploymentService"),
        patch("deployment_service.cli.handlers.deployment_handler.StatusService"),
        patch("deployment_service.cli.handlers.deployment_handler.LogService"),
        patch("deployment_service.cli.handlers.maintenance_handler.DeploymentService"),
        patch("deployment_service.cli.handlers.maintenance_handler.StatusService"),
        patch("deployment_service.cli.handlers.reporting_handler.DeploymentService"),
        patch("deployment_service.cli.handlers.reporting_handler.StatusService"),
        patch("deployment_service.cli.handlers.reporting_handler.LogService"),
    ):
        spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


# Pre-load once; individual tests patch inside invocations
_cli_module = _load_cli_module()
_cli_group: click.Group = _cli_module.cli

# Patch targets inside the cli.py module namespace
# Module is registered as deployment_service._cli_entry
_MOD = "deployment_service._cli_entry"
_PATCH_SETUP_EVENTS = f"{_MOD}.setup_events"
_PATCH_GRACEFUL = f"{_MOD}.GracefulShutdownHandler"
_PATCH_CALC_HANDLER = f"{_MOD}.CalculationHandler"
_PATCH_DEPLOY_HANDLER = f"{_MOD}.DeploymentHandler"
_PATCH_MAINT_HANDLER = f"{_MOD}.MaintenanceHandler"
_PATCH_REPORT_HANDLER = f"{_MOD}.ReportingHandler"


def _invoke(args: list[str], input_str: str | None = None) -> click.testing.Result:
    """Invoke the top-level CLI (from cli.py) with network patches active."""
    runner = CliRunner()
    with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_GRACEFUL):
        result = runner.invoke(_cli_group, args, catch_exceptions=False, input=input_str)
    return result


# ---------------------------------------------------------------------------
# Top-level cli group
# ---------------------------------------------------------------------------


class TestCliGroup:
    """Tests for the root CLI group defined in cli.py."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_help_exits_zero(self) -> None:
        result = _invoke(["--help"])
        assert result.exit_code == 0
        assert "Unified Trading Deployment" in result.output

    @pytest.mark.unit
    @pytest.mark.cli
    def test_help_lists_subcommands(self) -> None:
        result = _invoke(["--help"])
        assert result.exit_code == 0
        for cmd in ("calculate", "deploy", "status", "report"):
            assert cmd in result.output

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cloud_option_gcp(self) -> None:
        result = _invoke(["--cloud", "gcp", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cloud_option_aws(self) -> None:
        result = _invoke(["--cloud", "aws", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_invalid_cloud_option_rejected(self) -> None:
        # Invoke a real subcommand (not --help) so Click validates the Choice
        runner = CliRunner()
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_CALC_HANDLER, return_value=mock_handler),
        ):
            result = runner.invoke(_cli_group, ["--cloud", "azure", "list-services"])
        assert result.exit_code != 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_verbose_flag_accepted(self) -> None:
        result = _invoke(["--verbose", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_project_id_option_accepted(self) -> None:
        result = _invoke(["--project-id", "my-proj", "--help"])
        assert result.exit_code == 0


# ---------------------------------------------------------------------------
# get_config_dir utility
# ---------------------------------------------------------------------------


class TestGetConfigDir:
    """Tests for the get_config_dir() function in cli.py."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_returns_existing_configs_dir(self, tmp_path: Path) -> None:
        configs_dir = tmp_path / "configs"
        configs_dir.mkdir()
        # Point __file__ to a location whose sibling.parent has configs/
        fake_cli_py = tmp_path / "deployment_service" / "cli.py"
        with patch.object(_cli_module, "__file__", str(fake_cli_py)):
            result = _cli_module.get_config_dir()
        assert result == configs_dir

    @pytest.mark.unit
    @pytest.mark.cli
    def test_raises_when_not_found(self, tmp_path: Path) -> None:
        # tmp_path has no configs/ subdirectory
        with (
            patch.object(_cli_module, "__file__", str(tmp_path / "cli.py")),
            patch("pathlib.Path.cwd", return_value=tmp_path),
            pytest.raises(click.ClickException, match="Could not find configs"),
        ):
            _cli_module.get_config_dir()


# ---------------------------------------------------------------------------
# CALCULATION subcommands
# ---------------------------------------------------------------------------


class TestCalculateCommand:
    """Tests for the calculate subcommand wiring in cli.py."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_calculate_help(self) -> None:
        result = _invoke(["calculate", "--help"])
        assert result.exit_code == 0
        assert "--service" in result.output

    @pytest.mark.unit
    @pytest.mark.cli
    def test_calculate_missing_service_fails(self) -> None:
        runner = CliRunner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_GRACEFUL):
            result = runner.invoke(_cli_group, ["calculate"])
        assert result.exit_code != 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_calculate_delegates_to_handler(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_CALC_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(
                _cli_group,
                ["calculate", "--service", "svc-a"],
                catch_exceptions=False,
            )
        mock_handler.handle_calculate.assert_called_once()
        call_kwargs = mock_handler.handle_calculate.call_args[1]
        assert call_kwargs["service"] == "svc-a"

    @pytest.mark.unit
    @pytest.mark.cli
    def test_calculate_output_choices(self) -> None:
        mock_handler = MagicMock()
        for fmt in ("table", "json", "commands"):
            with (
                patch(_PATCH_SETUP_EVENTS),
                patch(_PATCH_GRACEFUL),
                patch(_PATCH_CALC_HANDLER, return_value=mock_handler),
            ):
                runner = CliRunner()
                result = runner.invoke(
                    _cli_group,
                    ["calculate", "--service", "svc-a", "--output", fmt],
                    catch_exceptions=False,
                )
            assert result.exit_code == 0, f"Failed for format={fmt}: {result.output}"

    @pytest.mark.unit
    @pytest.mark.cli
    def test_calculate_dry_run_flag(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_CALC_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(
                _cli_group,
                ["calculate", "--service", "svc-a", "--dry-run"],
                catch_exceptions=False,
            )
        call_kwargs = mock_handler.handle_calculate.call_args[1]
        assert call_kwargs["dry_run"] is True


class TestListServicesCommand:
    """Tests for the list-services subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_list_services_help(self) -> None:
        result = _invoke(["list-services", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_list_services_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_CALC_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["list-services"], catch_exceptions=False)
        mock_handler.handle_list_services.assert_called_once()


class TestInfoCommand:
    """Tests for the info subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_info_help(self) -> None:
        result = _invoke(["info", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_info_missing_service_fails(self) -> None:
        runner = CliRunner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_GRACEFUL):
            result = runner.invoke(_cli_group, ["info"])
        assert result.exit_code != 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_info_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_CALC_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["info", "--service", "svc-a"], catch_exceptions=False)
        mock_handler.handle_service_info.assert_called_once_with("svc-a")


class TestVenuesCommand:
    """Tests for the venues subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_venues_help(self) -> None:
        result = _invoke(["venues", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_venues_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_CALC_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["venues"], catch_exceptions=False)
        mock_handler.handle_venues.assert_called_once()


# ---------------------------------------------------------------------------
# DEPLOYMENT subcommands
# ---------------------------------------------------------------------------


class TestDeployCommand:
    """Tests for the deploy subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_deploy_help(self) -> None:
        result = _invoke(["deploy", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_deploy_missing_service_fails(self) -> None:
        runner = CliRunner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_GRACEFUL):
            result = runner.invoke(_cli_group, ["deploy"])
        assert result.exit_code != 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_deploy_dry_run_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_DEPLOY_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(
                _cli_group,
                ["deploy", "--service", "svc-a", "--dry-run"],
                catch_exceptions=False,
            )
        mock_handler.handle_deploy.assert_called_once()
        call_kwargs = mock_handler.handle_deploy.call_args[1]
        assert call_kwargs["dry_run"] is True
        assert call_kwargs["service"] == "svc-a"


class TestResumeCommand:
    """Tests for the resume subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_resume_help(self) -> None:
        result = _invoke(["resume", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_resume_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_DEPLOY_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["resume", "dep-001"], catch_exceptions=False)
        mock_handler.handle_resume.assert_called_once_with("dep-001", force=False)


class TestStatusCommand:
    """Tests for the status subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_status_help(self) -> None:
        result = _invoke(["status", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_status_delegates_no_args(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_DEPLOY_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["status"], catch_exceptions=False)
        mock_handler.handle_status.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.cli
    def test_status_with_deployment_id(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_DEPLOY_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(
                _cli_group,
                ["status", "--deployment-id", "dep-001"],
                catch_exceptions=False,
            )
        call_kwargs = mock_handler.handle_status.call_args[1]
        assert call_kwargs["deployment_id"] == "dep-001"


class TestCancelCommand:
    """Tests for the cancel subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cancel_help(self) -> None:
        result = _invoke(["cancel", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cancel_with_force(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_DEPLOY_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["cancel", "dep-001", "--force"], catch_exceptions=False)
        mock_handler.handle_cancel.assert_called_once_with("dep-001", True)


class TestLogsCommand:
    """Tests for the logs subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_logs_help(self) -> None:
        result = _invoke(["logs", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_logs_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_DEPLOY_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["logs", "dep-001"], catch_exceptions=False)
        mock_handler.handle_logs.assert_called_once()
        call_kwargs = mock_handler.handle_logs.call_args[1]
        assert call_kwargs["deployment_id"] == "dep-001"


# ---------------------------------------------------------------------------
# MAINTENANCE subcommands
# ---------------------------------------------------------------------------


class TestCleanupGcsCommand:
    """Tests for the cleanup-gcs subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cleanup_gcs_help(self) -> None:
        result = _invoke(["cleanup-gcs", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cleanup_gcs_missing_bucket_fails(self) -> None:
        runner = CliRunner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_GRACEFUL):
            result = runner.invoke(_cli_group, ["cleanup-gcs"])
        assert result.exit_code != 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cleanup_gcs_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_MAINT_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(
                _cli_group,
                ["cleanup-gcs", "--state-bucket", "my-bucket"],
                catch_exceptions=False,
            )
        mock_handler.handle_cleanup_gcs.assert_called_once()
        call_kwargs = mock_handler.handle_cleanup_gcs.call_args[1]
        assert call_kwargs["state_bucket"] == "my-bucket"


class TestFixStaleCommand:
    """Tests for the fix-stale subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_fix_stale_help(self) -> None:
        result = _invoke(["fix-stale", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_fix_stale_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_MAINT_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["fix-stale", "--auto-fix"], catch_exceptions=False)
        mock_handler.handle_fix_stale.assert_called_once()
        # auto_fix positional or keyword
        args, kwargs = mock_handler.handle_fix_stale.call_args
        auto_fix_val = kwargs.get("auto_fix", args[1] if len(args) > 1 else None)
        assert auto_fix_val is True


class TestValidateBucketsCommand:
    """Tests for the validate-buckets subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_validate_buckets_help(self) -> None:
        result = _invoke(["validate-buckets", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_validate_buckets_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_MAINT_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(
                _cli_group,
                ["validate-buckets", "--service", "svc-a"],
                catch_exceptions=False,
            )
        mock_handler.handle_validate_buckets.assert_called_once()
        call_kwargs = mock_handler.handle_validate_buckets.call_args[1]
        assert call_kwargs["service"] == "svc-a"


class TestRetryFailedCommand:
    """Tests for the retry-failed subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_retry_failed_help(self) -> None:
        result = _invoke(["retry-failed", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_retry_failed_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_MAINT_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["retry-failed", "dep-001"], catch_exceptions=False)
        mock_handler.handle_retry_failed.assert_called_once()
        call_kwargs = mock_handler.handle_retry_failed.call_args[1]
        assert call_kwargs["deployment_id"] == "dep-001"


# ---------------------------------------------------------------------------
# REPORTING subcommands
# ---------------------------------------------------------------------------


class TestReportCommand:
    """Tests for the report subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_report_help(self) -> None:
        result = _invoke(["report", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_report_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_REPORT_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["report"], catch_exceptions=False)
        mock_handler.handle_report.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.cli
    def test_report_output_choices(self) -> None:
        mock_handler = MagicMock()
        for fmt in ("text", "json", "csv"):
            with (
                patch(_PATCH_SETUP_EVENTS),
                patch(_PATCH_GRACEFUL),
                patch(_PATCH_REPORT_HANDLER, return_value=mock_handler),
            ):
                runner = CliRunner()
                result = runner.invoke(
                    _cli_group, ["report", "--output", fmt], catch_exceptions=False
                )
            assert result.exit_code == 0, f"Failed for output={fmt}: {result.output}"


class TestVersionsCommand:
    """Tests for the versions subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_versions_help(self) -> None:
        result = _invoke(["versions", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_versions_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_REPORT_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["versions"], catch_exceptions=False)
        mock_handler.handle_versions.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.cli
    def test_versions_with_service_option(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_REPORT_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["versions", "--service", "svc-a"], catch_exceptions=False)
        mock_handler.handle_versions.assert_called_once_with("svc-a")


class TestDataFlowCommand:
    """Tests for the data-flow subcommand."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_data_flow_help(self) -> None:
        result = _invoke(["data-flow", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_data_flow_delegates(self) -> None:
        mock_handler = MagicMock()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_GRACEFUL),
            patch(_PATCH_REPORT_HANDLER, return_value=mock_handler),
        ):
            runner = CliRunner()
            runner.invoke(_cli_group, ["data-flow"], catch_exceptions=False)
        mock_handler.handle_data_flow.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.cli
    def test_data_flow_output_choices(self) -> None:
        mock_handler = MagicMock()
        for fmt in ("text", "json"):
            with (
                patch(_PATCH_SETUP_EVENTS),
                patch(_PATCH_GRACEFUL),
                patch(_PATCH_REPORT_HANDLER, return_value=mock_handler),
            ):
                runner = CliRunner()
                result = runner.invoke(
                    _cli_group, ["data-flow", "--output", fmt], catch_exceptions=False
                )
            assert result.exit_code == 0, f"Failed for output={fmt}: {result.output}"


# ---------------------------------------------------------------------------
# Legacy / utility commands
# ---------------------------------------------------------------------------


class TestCheckDepsCommand:
    """Tests for the check-deps legacy command."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_check_deps_help(self) -> None:
        result = _invoke(["check-deps", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_check_deps_runs(self) -> None:
        runner = CliRunner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_GRACEFUL):
            result = runner.invoke(
                _cli_group, ["check-deps", "--service", "svc-a"], catch_exceptions=False
            )
        assert result.exit_code == 0
        assert "svc-a" in result.output


class TestPlanT1Command:
    """Tests for the plan-t1 legacy command."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_plan_t1_help(self) -> None:
        result = _invoke(["plan-t1", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_plan_t1_runs(self) -> None:
        runner = CliRunner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_GRACEFUL):
            result = runner.invoke(
                _cli_group,
                ["plan-t1", "2024-01-15", "--category", "CEFI"],
                catch_exceptions=False,
            )
        assert result.exit_code == 0
        assert "2024-01-15" in result.output
        assert "CEFI" in result.output

    @pytest.mark.unit
    @pytest.mark.cli
    def test_plan_t1_with_save_flag(self) -> None:
        runner = CliRunner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_GRACEFUL):
            result = runner.invoke(
                _cli_group,
                ["plan-t1", "2024-01-15", "--category", "CEFI", "--save"],
                catch_exceptions=False,
            )
        assert result.exit_code == 0
        assert "saved" in result.output.lower()


class TestCascadeFailureCommand:
    """Tests for the cascade-failure legacy command."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cascade_failure_help(self) -> None:
        result = _invoke(["cascade-failure", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    @pytest.mark.cli
    def test_cascade_failure_runs(self) -> None:
        runner = CliRunner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_GRACEFUL):
            result = runner.invoke(
                _cli_group,
                ["cascade-failure", "--service", "svc-a"],
                catch_exceptions=False,
            )
        assert result.exit_code == 0
        assert "svc-a" in result.output


# ---------------------------------------------------------------------------
# main() entry point
# ---------------------------------------------------------------------------


class TestMainEntryPoint:
    """Tests for the main() function in cli.py."""

    @pytest.mark.unit
    @pytest.mark.cli
    def test_main_invokes_cli(self) -> None:
        with (
            patch.object(_cli_module, "setup_events"),
            patch.object(_cli_module, "GracefulShutdownHandler"),
            patch.object(_cli_module, "cli") as mock_cli,
        ):
            _cli_module.main()
        mock_cli.assert_called_once()
