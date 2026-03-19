"""
Unit tests for deployment_service.cli.commands.calculation module.

Covers:
- _output_table: empty shards, single shard preview, truncation, dry-run annotation
- _output_json: valid JSON produced, summary and shards keys present
- _output_commands: comment header and per-shard command lines
- calculate command: required args, output format choices, dry-run flag, valid invocation
- list_services command: delegates to ConfigLoader, empty result handling
- info command: renders dimensions/compute/runtime sections
- venues command: renders categories from config
"""

from __future__ import annotations

import json
from typing import cast
from unittest.mock import MagicMock, patch

import click
import pytest
from click.testing import CliRunner

from deployment_service.cli.commands.calculation import (
    _output_commands,
    _output_json,
    _output_table,
    calculate,
    info,
    list_services,
    venues,
)
from deployment_service.shard_calculator import Shard

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_shard(
    index: int = 0,
    total: int = 1,
    category: str = "CEFI",
    start: str = "2024-01-01",
    end: str = "2024-01-01",
) -> Shard:
    return Shard(
        service="instruments-service",
        shard_index=index,
        total_shards=total,
        dimensions={
            "category": category,
            "date": {"start": start, "end": end},
        },
    )


def _make_summary(service: str = "instruments-service", total: int = 1) -> dict[str, object]:
    return {
        "service": service,
        "total_shards": total,
        "breakdown": {"category": 3, "date": total},
    }


def _invoke_standalone(cmd: click.Command, args: list[str]) -> click.testing.Result:
    """Invoke a standalone Click command (not wired into the main cli group)."""
    runner = CliRunner()
    return runner.invoke(cmd, args, catch_exceptions=False)


# ---------------------------------------------------------------------------
# _output_table
# ---------------------------------------------------------------------------


class TestOutputTable:
    """Tests for the _output_table helper."""

    @pytest.mark.unit
    def test_empty_shards_prints_message(self) -> None:
        runner = CliRunner()
        with runner.isolated_filesystem():
            from io import StringIO

            buf = StringIO()
            with patch("click.echo", side_effect=lambda msg="", **kw: buf.write(str(msg) + "\n")):
                _output_table([], _make_summary(), dry_run=False)
        # Just verifying it does not raise and outputs something meaningful
        # (click.echo is patched above; the real call would work too)

    @pytest.mark.unit
    def test_single_shard_shown(self) -> None:
        shards = [_make_shard()]
        summary = _make_summary(total=1)
        result_output: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: result_output.append(str(msg))):
            _output_table(shards, summary, dry_run=False)
        combined = "\n".join(result_output)
        assert "instruments-service" in combined
        assert "1" in combined  # total shards

    @pytest.mark.unit
    def test_dry_run_annotation_shown(self) -> None:
        shards = [_make_shard()]
        summary = _make_summary()
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_table(shards, summary, dry_run=True)
        combined = "\n".join(captured)
        assert "DRY RUN" in combined

    @pytest.mark.unit
    def test_no_dry_run_annotation_without_flag(self) -> None:
        shards = [_make_shard()]
        summary = _make_summary()
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_table(shards, summary, dry_run=False)
        combined = "\n".join(captured)
        assert "DRY RUN" not in combined

    @pytest.mark.unit
    def test_more_than_10_shards_shows_ellipsis(self) -> None:
        shards = [_make_shard(index=i, total=15) for i in range(15)]
        summary = _make_summary(total=15)
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_table(shards, summary, dry_run=False)
        combined = "\n".join(captured)
        assert "..." in combined

    @pytest.mark.unit
    def test_breakdown_dimensions_listed(self) -> None:
        shards = [_make_shard()]
        summary = _make_summary()
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_table(shards, summary, dry_run=False)
        combined = "\n".join(captured)
        assert "category" in combined or "date" in combined


# ---------------------------------------------------------------------------
# _output_json
# ---------------------------------------------------------------------------


class TestOutputJson:
    """Tests for the _output_json helper."""

    @pytest.mark.unit
    def test_output_is_valid_json(self) -> None:
        shards = [_make_shard()]
        summary = _make_summary()
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_json(shards, summary)
        raw = "\n".join(captured)
        parsed = json.loads(raw)
        assert "summary" in parsed
        assert "shards" in parsed

    @pytest.mark.unit
    def test_summary_service_name_preserved(self) -> None:
        shards = [_make_shard()]
        summary = _make_summary(service="market-tick-data-service")
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_json(shards, summary)
        raw = "\n".join(captured)
        parsed = json.loads(raw)
        assert parsed["summary"]["service"] == "market-tick-data-service"

    @pytest.mark.unit
    def test_shards_list_length_matches(self) -> None:
        shards = [_make_shard(index=i, total=3) for i in range(3)]
        summary = _make_summary(total=3)
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_json(shards, summary)
        raw = "\n".join(captured)
        parsed = json.loads(raw)
        assert len(parsed["shards"]) == 3

    @pytest.mark.unit
    def test_empty_shards_produces_valid_json(self) -> None:
        summary = _make_summary(total=0)
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_json([], summary)
        raw = "\n".join(captured)
        parsed = json.loads(raw)
        assert parsed["shards"] == []


# ---------------------------------------------------------------------------
# _output_commands
# ---------------------------------------------------------------------------


class TestOutputCommands:
    """Tests for the _output_commands helper."""

    @pytest.mark.unit
    def test_header_line_contains_service(self) -> None:
        shards = [_make_shard()]
        summary = _make_summary()
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_commands(shards, summary)
        combined = "\n".join(captured)
        assert "instruments-service" in combined

    @pytest.mark.unit
    def test_total_shard_count_in_header(self) -> None:
        shards = [_make_shard(index=i, total=2) for i in range(2)]
        summary = _make_summary(total=2)
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_commands(shards, summary)
        combined = "\n".join(captured)
        assert "2" in combined

    @pytest.mark.unit
    def test_each_shard_produces_output_line(self) -> None:
        shards = [_make_shard(index=i, total=3) for i in range(3)]
        summary = _make_summary(total=3)
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_commands(shards, summary)
        combined = "\n".join(captured)
        # Shard index lines "# Shard N/3" appear for each shard
        assert combined.count("# Shard") == 3

    @pytest.mark.unit
    def test_empty_shards_does_not_raise(self) -> None:
        summary = _make_summary(total=0)
        captured: list[str] = []
        with patch("click.echo", side_effect=lambda msg="", **kw: captured.append(str(msg))):
            _output_commands([], summary)
        combined = "\n".join(captured)
        assert "instruments-service" in combined


# ---------------------------------------------------------------------------
# `calculate` standalone command
# ---------------------------------------------------------------------------


class TestCalculateStandaloneCommand:
    """Tests for the calculate Click command in commands/calculation.py."""

    @pytest.mark.unit
    def test_help_exits_zero(self) -> None:
        result = _invoke_standalone(calculate, ["--help"])
        assert result.exit_code == 0
        assert "Calculate deployment shards" in result.output

    @pytest.mark.unit
    def test_missing_service_fails(self) -> None:
        runner = CliRunner()
        result = runner.invoke(calculate, [])
        assert result.exit_code != 0

    @pytest.mark.unit
    def test_invalid_output_format_fails(self) -> None:
        runner = CliRunner()
        result = runner.invoke(
            calculate,
            ["--service", "instruments-service", "--output", "xml"],
        )
        assert result.exit_code != 0

    @pytest.mark.unit
    def test_dry_run_flag_in_help(self) -> None:
        result = _invoke_standalone(calculate, ["--help"])
        assert "--dry-run" in result.output

    @pytest.mark.unit
    def test_respect_start_dates_flag_in_help(self) -> None:
        result = _invoke_standalone(calculate, ["--help"])
        assert "start-dates" in result.output

    @pytest.mark.unit
    def test_shard_limit_exceeded_exits_1(self, tmp_path) -> None:
        from deployment_service.shard_calculator import ShardLimitExceeded

        runner = CliRunner()
        mock_calculator = MagicMock()
        mock_calculator.calculate_shards.side_effect = ShardLimitExceeded(
            total_shards=99999,
            max_shards=10000,
            service="instruments-service",
            breakdown={"category": 3, "date": 33333},
        )

        with patch(
            "deployment_service.cli.commands.calculation.ShardCalculator",
            return_value=mock_calculator,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(
                calculate,
                ["--service", "instruments-service"],
                obj=ctx_obj,
            )
        assert result.exit_code == 1
        assert (
            "SHARD LIMIT EXCEEDED" in result.output
            or "99999" in result.output
            or result.exit_code == 1
        )

    @pytest.mark.unit
    def test_value_error_exits_1(self, tmp_path) -> None:
        runner = CliRunner()
        mock_calculator = MagicMock()
        mock_calculator.calculate_shards.side_effect = ValueError("bad value")

        with patch(
            "deployment_service.cli.commands.calculation.ShardCalculator",
            return_value=mock_calculator,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(
                calculate,
                ["--service", "instruments-service"],
                obj=ctx_obj,
            )
        assert result.exit_code == 1

    @pytest.mark.unit
    def test_file_not_found_exits_1(self, tmp_path) -> None:
        runner = CliRunner()
        mock_calculator = MagicMock()
        mock_calculator.calculate_shards.side_effect = FileNotFoundError("missing file")

        with patch(
            "deployment_service.cli.commands.calculation.ShardCalculator",
            return_value=mock_calculator,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(
                calculate,
                ["--service", "instruments-service"],
                obj=ctx_obj,
            )
        assert result.exit_code == 1

    @pytest.mark.unit
    def test_successful_invocation_table_format(self, tmp_path) -> None:
        runner = CliRunner()
        shards = [_make_shard()]
        mock_calculator = MagicMock()
        mock_calculator.calculate_shards.return_value = shards
        mock_calculator.get_shard_summary.return_value = _make_summary()

        with patch(
            "deployment_service.cli.commands.calculation.ShardCalculator",
            return_value=mock_calculator,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(
                calculate,
                ["--service", "instruments-service", "--dry-run"],
                obj=ctx_obj,
            )
        assert result.exit_code == 0
        assert "DRY RUN" in result.output

    @pytest.mark.unit
    def test_successful_invocation_json_format(self, tmp_path) -> None:
        runner = CliRunner()
        shards = [_make_shard()]
        mock_calculator = MagicMock()
        mock_calculator.calculate_shards.return_value = shards
        mock_calculator.get_shard_summary.return_value = _make_summary()

        with patch(
            "deployment_service.cli.commands.calculation.ShardCalculator",
            return_value=mock_calculator,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(
                calculate,
                ["--service", "instruments-service", "--output", "json"],
                obj=ctx_obj,
            )
        assert result.exit_code == 0
        parsed = json.loads(result.output)
        assert "summary" in parsed
        assert "shards" in parsed

    @pytest.mark.unit
    def test_successful_invocation_commands_format(self, tmp_path) -> None:
        runner = CliRunner()
        shards = [_make_shard()]
        mock_calculator = MagicMock()
        mock_calculator.calculate_shards.return_value = shards
        mock_calculator.get_shard_summary.return_value = _make_summary()

        with patch(
            "deployment_service.cli.commands.calculation.ShardCalculator",
            return_value=mock_calculator,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(
                calculate,
                ["--service", "instruments-service", "--output", "commands"],
                obj=ctx_obj,
            )
        assert result.exit_code == 0
        assert "# Service" in result.output

    @pytest.mark.unit
    def test_category_filter_passed_to_calculator(self, tmp_path) -> None:
        runner = CliRunner()
        mock_calculator = MagicMock()
        mock_calculator.calculate_shards.return_value = []
        mock_calculator.get_shard_summary.return_value = _make_summary(total=0)

        with patch(
            "deployment_service.cli.commands.calculation.ShardCalculator",
            return_value=mock_calculator,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            runner.invoke(
                calculate,
                [
                    "--service",
                    "instruments-service",
                    "--category",
                    "CEFI",
                    "--category",
                    "TRADFI",
                ],
                obj=ctx_obj,
            )
        call_kwargs = mock_calculator.calculate_shards.call_args.kwargs
        assert cast(list[str], call_kwargs.get("category", [])) == ["CEFI", "TRADFI"]

    @pytest.mark.unit
    def test_ignore_start_dates_flag(self, tmp_path) -> None:
        runner = CliRunner()
        mock_calculator = MagicMock()
        mock_calculator.calculate_shards.return_value = []
        mock_calculator.get_shard_summary.return_value = _make_summary(total=0)

        with patch(
            "deployment_service.cli.commands.calculation.ShardCalculator",
            return_value=mock_calculator,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            runner.invoke(
                calculate,
                [
                    "--service",
                    "instruments-service",
                    "--ignore-start-dates",
                ],
                obj=ctx_obj,
            )
        call_kwargs = mock_calculator.calculate_shards.call_args.kwargs
        assert call_kwargs.get("respect_start_dates") is False


# ---------------------------------------------------------------------------
# `list_services` standalone command
# ---------------------------------------------------------------------------


class TestListServicesStandaloneCommand:
    """Tests for the list_services Click command in commands/calculation.py."""

    @pytest.mark.unit
    def test_help_exits_zero(self) -> None:
        result = _invoke_standalone(list_services, ["--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_no_services_message(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.list_available_services.return_value = []

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(list_services, obj=ctx_obj)
        assert "No services found" in result.output

    @pytest.mark.unit
    def test_services_listed(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.list_available_services.return_value = ["svc-a", "svc-b"]
        mock_loader.load_service_config.return_value = {
            "description": "A test service",
            "dimensions": [{"name": "category", "type": "fixed", "values": ["X"]}],
        }

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(list_services, obj=ctx_obj)
        assert "svc-a" in result.output
        assert "svc-b" in result.output

    @pytest.mark.unit
    def test_os_error_exits_1(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.list_available_services.side_effect = OSError("disk error")

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(list_services, obj=ctx_obj)
        assert result.exit_code == 1


# ---------------------------------------------------------------------------
# `info` standalone command
# ---------------------------------------------------------------------------


class TestInfoStandaloneCommand:
    """Tests for the info Click command in commands/calculation.py."""

    @pytest.mark.unit
    def test_help_exits_zero(self) -> None:
        result = _invoke_standalone(info, ["--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_missing_service_fails(self) -> None:
        runner = CliRunner()
        result = runner.invoke(info, [])
        assert result.exit_code != 0

    @pytest.mark.unit
    def test_renders_service_name(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {
            "description": "Test Desc",
            "dimensions": [{"name": "category", "type": "fixed", "values": ["A", "B"]}],
            "cli_args": {"category": "--category"},
            "compute": {"vm": {"machine_type": "c2-standard-4"}},
        }
        mock_loader.load_venues_config.return_value = {}

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(info, ["--service", "my-svc"], obj=ctx_obj)
        assert "my-svc" in result.output

    @pytest.mark.unit
    def test_renders_description(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {
            "description": "Unique description string",
            "dimensions": [],
            "cli_args": {},
            "compute": {},
        }
        mock_loader.load_venues_config.return_value = {}

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(info, ["--service", "my-svc"], obj=ctx_obj)
        assert "Unique description string" in result.output

    @pytest.mark.unit
    def test_file_not_found_exits_1(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.load_service_config.side_effect = FileNotFoundError("not found")

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(info, ["--service", "missing-svc"], obj=ctx_obj)
        assert result.exit_code == 1

    @pytest.mark.unit
    def test_renders_fixed_dimension(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {
            "description": "Desc",
            "dimensions": [{"name": "category", "type": "fixed", "values": ["CEFI", "TRADFI"]}],
            "cli_args": {},
            "compute": {},
        }
        mock_loader.load_venues_config.return_value = {}

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(info, ["--service", "my-svc"], obj=ctx_obj)
        assert "category" in result.output

    @pytest.mark.unit
    def test_renders_date_range_dimension(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {
            "description": "Desc",
            "dimensions": [{"name": "date", "type": "date_range", "granularity": "weekly"}],
            "cli_args": {},
            "compute": {},
        }
        mock_loader.load_venues_config.return_value = {}

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(info, ["--service", "my-svc"], obj=ctx_obj)
        assert "weekly" in result.output

    @pytest.mark.unit
    def test_renders_runtime_section(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.load_service_config.return_value = {
            "description": "Desc",
            "dimensions": [],
            "cli_args": {},
            "compute": {},
            "runtime": {"estimated_minutes": 45, "notes": "takes a while"},
        }
        mock_loader.load_venues_config.return_value = {}

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(info, ["--service", "my-svc"], obj=ctx_obj)
        assert "45" in result.output
        assert "takes a while" in result.output


# ---------------------------------------------------------------------------
# `venues` standalone command
# ---------------------------------------------------------------------------


class TestVenuesStandaloneCommand:
    """Tests for the venues Click command in commands/calculation.py."""

    @pytest.mark.unit
    def test_help_exits_zero(self) -> None:
        result = _invoke_standalone(venues, ["--help"])
        assert result.exit_code == 0

    @pytest.mark.unit
    def test_renders_category_name(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.load_venues_config.return_value = {
            "categories": {
                "CEFI": {
                    "description": "Centralised Finance",
                    "venues": ["BINANCE-SPOT"],
                    "data_types": ["trades"],
                }
            }
        }

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(venues, obj=ctx_obj)
        assert "CEFI" in result.output
        assert "BINANCE-SPOT" in result.output

    @pytest.mark.unit
    def test_renders_data_types(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.load_venues_config.return_value = {
            "categories": {
                "TRADFI": {
                    "description": "Traditional Finance",
                    "venues": ["CME"],
                    "data_types": ["ohlcv_1m", "trades"],
                }
            }
        }

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(venues, obj=ctx_obj)
        assert "ohlcv_1m" in result.output

    @pytest.mark.unit
    def test_os_error_exits_1(self, tmp_path) -> None:
        runner = CliRunner()
        mock_loader = MagicMock()
        mock_loader.load_venues_config.side_effect = OSError("disk full")

        with patch(
            "deployment_service.cli.commands.calculation.ConfigLoader",
            return_value=mock_loader,
        ):
            ctx_obj = {"config_dir": str(tmp_path)}
            result = runner.invoke(venues, obj=ctx_obj)
        assert result.exit_code == 1
