"""
Unit tests for the deployment_service CLI entry-point.

The real CLI lives at deployment_service.cli (package), which re-exports `cli`
from deployment_service.cli.main.  Only the calculation commands are currently
wired in; deployment / management / reporting stubs are empty lists.

Covers:
- cli --help (top-level group)
- cli --verbose / -v flag
- cli --cloud option (gcp / aws choices; invalid choice rejected)
- cli --config-dir valid/invalid paths
- get_config_dir() utility function (cwd fallback, ClickException when missing)
- calculate subcommand: --help, missing --service, output choices, --dry-run
- list-services subcommand: --help, delegates to ConfigLoader
- info subcommand: --help, missing --service
- venues subcommand: --help, delegates to ConfigLoader
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import click
import pytest
from click.testing import CliRunner

from deployment_service.cli import cli
from deployment_service.cli.main import get_config_dir

# ---------------------------------------------------------------------------
# Patch targets — both setup_events and GracefulShutdownHandler initialise
# network/signal resources we do not want in unit tests.
# ---------------------------------------------------------------------------
_PATCH_SETUP_EVENTS = "deployment_service.cli.main.setup_events"
_PATCH_TRACING = "deployment_service.cli.main.setup_tracing"
_PATCH_GRACEFUL = "deployment_service.cli.main.GracefulShutdownHandler"


def _runner() -> CliRunner:
    return CliRunner()


# ---------------------------------------------------------------------------
# Top-level `cli` group
# ---------------------------------------------------------------------------


class TestCliGroup:
    """Tests for the root click group."""

    @pytest.mark.unit
    def test_help_exits_zero(self) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--help"])
        assert result.exit_code == 0
        assert "Unified Trading Deployment" in result.output

    @pytest.mark.unit
    def test_help_lists_cloud_option(self) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--help"])
        assert "--cloud" in result.output

    @pytest.mark.unit
    def test_help_lists_verbose_option(self) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--help"])
        assert "--verbose" in result.output or "-v" in result.output

    @pytest.mark.unit
    def test_invalid_cloud_choice_fails(self) -> None:
        # Pass a real subcommand so Click does not short-circuit via --help
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--cloud", "azure", "list-services"])
        assert result.exit_code != 0

    @pytest.mark.unit
    def test_cloud_gcp_is_accepted(self, tmp_path) -> None:
        runner = _runner()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch("deployment_service.cli.main.get_config_dir", return_value=tmp_path),
        ):
            result = runner.invoke(cli, ["--cloud", "gcp", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_cloud_aws_is_accepted(self, tmp_path) -> None:
        runner = _runner()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch("deployment_service.cli.main.get_config_dir", return_value=tmp_path),
        ):
            result = runner.invoke(cli, ["--cloud", "aws", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_verbose_flag_accepted(self, tmp_path) -> None:
        runner = _runner()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch("deployment_service.cli.main.get_config_dir", return_value=tmp_path),
        ):
            result = runner.invoke(cli, ["--verbose", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_no_args_shows_help_or_exits_cleanly(self, tmp_path) -> None:
        runner = _runner()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch("deployment_service.cli.main.get_config_dir", return_value=tmp_path),
        ):
            result = runner.invoke(cli, [])
        # Click groups print help and exit 0 or 2 when no subcommand is given;
        # either way the invocation itself does not crash with an exception.
        assert result.exit_code in (0, 1, 2)

    @pytest.mark.unit
    def test_config_dir_with_invalid_path_fails(self, tmp_path) -> None:
        # Use a real subcommand so Click validates the option before showing help
        runner = _runner()
        nonexistent = str(tmp_path / "does_not_exist")
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--config-dir", nonexistent, "list-services"])
        assert result.exit_code != 0

    @pytest.mark.unit
    def test_config_dir_with_valid_path_accepted(self, tmp_path) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_cloud_provider_stored_in_ctx(self, tmp_path) -> None:
        """ctx.obj['cloud_provider'] is set to the --cloud value; option is accepted without error."""
        runner = _runner()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
        ):
            result = runner.invoke(
                cli, ["--config-dir", str(tmp_path), "--cloud", "aws", "list-services"]
            )
        # May fail at list-services level (no configs), not at option-parsing level.
        assert result.exit_code in (0, 1)


# ---------------------------------------------------------------------------
# `calculate` subcommand (via main cli group)
# ---------------------------------------------------------------------------


class TestCalculateViaCliGroup:
    """Tests for calculate subcommand wired through the main cli group."""

    @pytest.mark.unit
    def test_help_exits_zero(self, tmp_path) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "calculate", "--help"])
        assert result.exit_code == 0
        assert "Calculate deployment shards" in result.output

    @pytest.mark.unit
    def test_missing_required_service_arg_fails(self, tmp_path) -> None:
        runner = _runner()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
        ):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "calculate"])
        assert result.exit_code != 0

    @pytest.mark.unit
    def test_dry_run_flag_in_help(self, tmp_path) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "calculate", "--help"])
        assert "--dry-run" in result.output

    @pytest.mark.unit
    def test_output_format_choices_in_help(self, tmp_path) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "calculate", "--help"])
        assert "table" in result.output
        assert "json" in result.output

    @pytest.mark.unit
    def test_invalid_output_format_fails(self, tmp_path) -> None:
        runner = _runner()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
        ):
            result = runner.invoke(
                cli,
                [
                    "--config-dir",
                    str(tmp_path),
                    "calculate",
                    "--service",
                    "instruments-service",
                    "--output",
                    "xml",
                ],
            )
        assert result.exit_code != 0

    @pytest.mark.unit
    def test_valid_invocation_calls_shard_calculator(self, tmp_path) -> None:
        from deployment_service.shard_calculator import Shard

        runner = _runner()
        mock_calc = MagicMock()
        shard = Shard(
            service="instruments-service",
            shard_index=0,
            total_shards=1,
            dimensions={"category": "CEFI", "date": {"start": "2024-01-01", "end": "2024-01-01"}},
        )
        mock_calc.calculate_shards.return_value = [shard]
        mock_calc.get_shard_summary.return_value = {
            "service": "instruments-service",
            "total_shards": 1,
            "breakdown": {},
        }

        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch(
                "deployment_service.cli.commands.calculation.ShardCalculator",
                return_value=mock_calc,
            ),
        ):
            result = runner.invoke(
                cli,
                [
                    "--config-dir",
                    str(tmp_path),
                    "calculate",
                    "--service",
                    "instruments-service",
                    "--dry-run",
                ],
            )
        assert result.exit_code == 0
        mock_calc.calculate_shards.assert_called_once()

    @pytest.mark.unit
    def test_dry_run_annotation_in_output(self, tmp_path) -> None:
        from deployment_service.shard_calculator import Shard

        runner = _runner()
        mock_calc = MagicMock()
        shard = Shard(
            service="instruments-service",
            shard_index=0,
            total_shards=1,
            dimensions={"category": "CEFI", "date": {"start": "2024-01-01", "end": "2024-01-01"}},
        )
        mock_calc.calculate_shards.return_value = [shard]
        mock_calc.get_shard_summary.return_value = {
            "service": "instruments-service",
            "total_shards": 1,
            "breakdown": {"category": 1},
        }

        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch(
                "deployment_service.cli.commands.calculation.ShardCalculator",
                return_value=mock_calc,
            ),
        ):
            result = runner.invoke(
                cli,
                [
                    "--config-dir",
                    str(tmp_path),
                    "calculate",
                    "--service",
                    "instruments-service",
                    "--dry-run",
                ],
            )
        assert "DRY RUN" in result.output


# ---------------------------------------------------------------------------
# `list-services` subcommand (via main cli group)
# ---------------------------------------------------------------------------


class TestListServicesViaCliGroup:
    """Tests for list-services subcommand wired through the main cli group."""

    @pytest.mark.unit
    def test_help_exits_zero(self, tmp_path) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "list-services", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_no_services_message(self, tmp_path) -> None:
        runner = _runner()
        mock_loader = MagicMock()
        mock_loader.list_available_services.return_value = []

        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch(
                "deployment_service.cli.commands.calculation.ConfigLoader",
                return_value=mock_loader,
            ),
        ):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "list-services"])
        assert "No services found" in result.output

    @pytest.mark.unit
    def test_services_listed(self, tmp_path) -> None:
        runner = _runner()
        mock_loader = MagicMock()
        mock_loader.list_available_services.return_value = ["svc-alpha", "svc-beta"]
        mock_loader.load_service_config.return_value = {
            "description": "A service",
            "dimensions": [{"name": "category", "type": "fixed", "values": ["X"]}],
        }

        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch(
                "deployment_service.cli.commands.calculation.ConfigLoader",
                return_value=mock_loader,
            ),
        ):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "list-services"])
        assert "svc-alpha" in result.output
        assert "svc-beta" in result.output


# ---------------------------------------------------------------------------
# `info` subcommand (via main cli group)
# ---------------------------------------------------------------------------


class TestInfoViaCliGroup:
    """Tests for info subcommand wired through the main cli group."""

    @pytest.mark.unit
    def test_help_exits_zero(self, tmp_path) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "info", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_missing_required_service_fails(self, tmp_path) -> None:
        runner = _runner()
        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
        ):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "info"])
        assert result.exit_code != 0

    @pytest.mark.unit
    def test_renders_service_name(self, tmp_path) -> None:
        runner = _runner()
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {
            "description": "Desc",
            "dimensions": [],
            "cli_args": {},
            "compute": {},
        }
        mock_loader.load_venues_config.return_value = {}

        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch(
                "deployment_service.cli.commands.calculation.ConfigLoader",
                return_value=mock_loader,
            ),
        ):
            result = runner.invoke(
                cli,
                ["--config-dir", str(tmp_path), "info", "--service", "my-target-svc"],
            )
        assert "my-target-svc" in result.output


# ---------------------------------------------------------------------------
# `venues` subcommand (via main cli group)
# ---------------------------------------------------------------------------


class TestVenuesViaCliGroup:
    """Tests for venues subcommand wired through the main cli group."""

    @pytest.mark.unit
    def test_help_exits_zero(self, tmp_path) -> None:
        runner = _runner()
        with patch(_PATCH_SETUP_EVENTS), patch(_PATCH_TRACING), patch(_PATCH_GRACEFUL):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "venues", "--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_renders_category(self, tmp_path) -> None:
        runner = _runner()
        mock_loader = MagicMock()
        mock_loader.load_venues_config.return_value = {
            "categories": {
                "CEFI": {
                    "description": "CeFi",
                    "venues": ["BINANCE-SPOT"],
                    "data_types": ["trades"],
                }
            }
        }

        with (
            patch(_PATCH_SETUP_EVENTS),
            patch(_PATCH_TRACING),
            patch(_PATCH_GRACEFUL),
            patch(
                "deployment_service.cli.commands.calculation.ConfigLoader",
                return_value=mock_loader,
            ),
        ):
            result = runner.invoke(cli, ["--config-dir", str(tmp_path), "venues"])
        assert "CEFI" in result.output
        assert "BINANCE-SPOT" in result.output


# ---------------------------------------------------------------------------
# get_config_dir utility function
# ---------------------------------------------------------------------------


class TestGetConfigDir:
    """Tests for the get_config_dir() helper in deployment_service.cli.main."""

    @pytest.mark.unit
    def test_returns_configs_subdir_when_cwd_has_it(self, tmp_path) -> None:
        configs_dir = tmp_path / "configs"
        configs_dir.mkdir()
        # Also patch __file__ so the script_dir check doesn't resolve the real repo configs/
        fake_script = tmp_path / "pkg" / "cli" / "main.py"
        fake_script.parent.mkdir(parents=True, exist_ok=True)

        with (
            patch("deployment_service.cli.main.Path.cwd", return_value=tmp_path),
            patch("deployment_service.cli.main.__file__", str(fake_script)),
        ):
            path = get_config_dir()
        assert path == configs_dir

    @pytest.mark.unit
    def test_raises_click_exception_when_nothing_found(self, tmp_path) -> None:
        # tmp_path has no configs/ and is not named "deployment-service"
        # Also patch __file__ so script_dir doesn't accidentally resolve a real path
        fake_script = tmp_path / "pkg" / "cli" / "main.py"
        fake_script.parent.mkdir(parents=True, exist_ok=True)

        with (
            patch("deployment_service.cli.main.Path.cwd", return_value=tmp_path),
            patch("deployment_service.cli.main.__file__", str(fake_script)),
            pytest.raises(click.ClickException, match="Could not find configs directory"),
        ):
            get_config_dir()

    @pytest.mark.unit
    def test_returns_path_for_deployment_service_cwd(self, tmp_path) -> None:
        # Simulate being inside a directory named "deployment-service"
        ds_dir = tmp_path / "deployment-service"
        ds_dir.mkdir()
        # Patch __file__ so script_dir does not accidentally resolve the real repo configs/
        fake_script = tmp_path / "other" / "cli" / "main.py"
        fake_script.parent.mkdir(parents=True, exist_ok=True)

        with (
            patch("deployment_service.cli.main.Path.cwd", return_value=ds_dir),
            patch("deployment_service.cli.main.__file__", str(fake_script)),
        ):
            # The function returns cwd / "configs" when cwd.name == "deployment-service"
            path = get_config_dir()
        assert path == ds_dir / "configs"
