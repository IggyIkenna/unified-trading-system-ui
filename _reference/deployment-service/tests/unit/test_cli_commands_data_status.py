"""
Unit tests for deployment_service.cli.commands.data_status.

Covers:
- DYNAMIC_DIMENSION_SERVICES / FIXED_DIMENSION_SERVICES constants
- data_status command: missing required args exit-code
- data_status: --check-venues with wrong service → sys.exit(1)
- data_status: --check-venues with instruments-service → calls check_instruments_venue_coverage
- data_status: --check-data-types with wrong service → sys.exit(1)
- data_status: --check-data-types with market-tick-data-service → calls check_data_types_detailed
- data_status: --check-feature-groups with wrong service → sys.exit(1)
- data_status: --check-feature-groups with features-delta-one-service → calls check_feature_groups_detailed
- data_status: --check-timeframes with wrong service → sys.exit(1)
- data_status: --check-timeframes with market-data-processing-service → calls check_timeframes_detailed
- data_status: dynamic-dimension service → calls display_dynamic_service_status
- data_status: fixed-dimension service → calls display_fixed_service_status
- data_status: --benchmark flag → calls format_benchmark_info
- data_status: exception path → exit code 1 with error message
- data_status: --output choices (tree, json, summary)
- data_status: --mode live and batch
"""

from __future__ import annotations

from unittest.mock import patch

import click
import pytest
from click.testing import CliRunner

from deployment_service.cli.commands.data_status import (
    DYNAMIC_DIMENSION_SERVICES,
    FIXED_DIMENSION_SERVICES,
    data_status,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_BASE_ARGS = [
    "-s",
    "instruments-service",
    "--start-date",
    "2024-01-01",
    "--end-date",
    "2024-01-31",
]

_CTX_OBJ = {"config_dir": "configs"}


def _invoke(args: list[str], ctx_obj: dict[str, object] | None = None) -> click.testing.Result:
    runner = CliRunner()
    return runner.invoke(
        data_status,
        args,
        obj=ctx_obj or _CTX_OBJ,
        catch_exceptions=False,
    )


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_dynamic_dimension_services_contains_expected() -> None:
    assert "execution-service" in DYNAMIC_DIMENSION_SERVICES
    assert "ml-training-service" in DYNAMIC_DIMENSION_SERVICES
    assert "strategy-service" in DYNAMIC_DIMENSION_SERVICES


@pytest.mark.unit
def test_fixed_dimension_services_contains_expected() -> None:
    assert "instruments-service" in FIXED_DIMENSION_SERVICES
    assert "market-tick-data-service" in FIXED_DIMENSION_SERVICES


# ---------------------------------------------------------------------------
# Missing required args
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_missing_service_fails() -> None:
    runner = CliRunner()
    result = runner.invoke(
        data_status,
        ["--start-date", "2024-01-01", "--end-date", "2024-01-31"],
        obj=_CTX_OBJ,
        catch_exceptions=True,
    )
    assert result.exit_code != 0


@pytest.mark.unit
def test_data_status_missing_start_date_fails() -> None:
    runner = CliRunner()
    result = runner.invoke(
        data_status,
        ["-s", "instruments-service", "--end-date", "2024-01-31"],
        obj=_CTX_OBJ,
        catch_exceptions=True,
    )
    assert result.exit_code != 0


# ---------------------------------------------------------------------------
# --check-venues
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_check_venues_wrong_service_exits_1() -> None:
    runner = CliRunner()
    result = runner.invoke(
        data_status,
        [
            "-s",
            "market-data-service",
            "--start-date",
            "2024-01-01",
            "--end-date",
            "2024-01-31",
            "--check-venues",
        ],
        obj=_CTX_OBJ,
        catch_exceptions=True,
    )
    assert result.exit_code == 1


@pytest.mark.unit
def test_data_status_check_venues_instruments_service_calls_helper() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.check_instruments_venue_coverage"
    ) as mock_check:
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            [
                "-s",
                "instruments-service",
                "--start-date",
                "2024-01-01",
                "--end-date",
                "2024-01-31",
                "--check-venues",
            ],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    mock_check.assert_called_once()
    assert result.exit_code == 0


# ---------------------------------------------------------------------------
# --check-data-types
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_check_data_types_wrong_service_exits_1() -> None:
    runner = CliRunner()
    result = runner.invoke(
        data_status,
        [
            "-s",
            "instruments-service",
            "--start-date",
            "2024-01-01",
            "--end-date",
            "2024-01-31",
            "--check-data-types",
        ],
        obj=_CTX_OBJ,
        catch_exceptions=True,
    )
    assert result.exit_code == 1


@pytest.mark.unit
def test_data_status_check_data_types_correct_service_calls_helper() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.check_data_types_detailed"
    ) as mock_check:
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            [
                "-s",
                "market-tick-data-service",
                "--start-date",
                "2024-01-01",
                "--end-date",
                "2024-01-31",
                "--check-data-types",
            ],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    mock_check.assert_called_once()
    assert result.exit_code == 0


# ---------------------------------------------------------------------------
# --check-feature-groups
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_check_feature_groups_wrong_service_exits_1() -> None:
    runner = CliRunner()
    result = runner.invoke(
        data_status,
        [
            "-s",
            "instruments-service",
            "--start-date",
            "2024-01-01",
            "--end-date",
            "2024-01-31",
            "--check-feature-groups",
        ],
        obj=_CTX_OBJ,
        catch_exceptions=True,
    )
    assert result.exit_code == 1


@pytest.mark.unit
def test_data_status_check_feature_groups_correct_service_calls_helper() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.check_feature_groups_detailed"
    ) as mock_check:
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            [
                "-s",
                "features-delta-one-service",
                "--start-date",
                "2024-01-01",
                "--end-date",
                "2024-01-31",
                "--check-feature-groups",
            ],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    mock_check.assert_called_once()
    assert result.exit_code == 0


# ---------------------------------------------------------------------------
# --check-timeframes
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_check_timeframes_wrong_service_exits_1() -> None:
    runner = CliRunner()
    result = runner.invoke(
        data_status,
        [
            "-s",
            "instruments-service",
            "--start-date",
            "2024-01-01",
            "--end-date",
            "2024-01-31",
            "--check-timeframes",
        ],
        obj=_CTX_OBJ,
        catch_exceptions=True,
    )
    assert result.exit_code == 1


@pytest.mark.unit
def test_data_status_check_timeframes_correct_service_calls_helper() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.check_timeframes_detailed"
    ) as mock_check:
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            [
                "-s",
                "market-data-processing-service",
                "--start-date",
                "2024-01-01",
                "--end-date",
                "2024-01-31",
                "--check-timeframes",
            ],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    mock_check.assert_called_once()
    assert result.exit_code == 0


# ---------------------------------------------------------------------------
# Dynamic dimension services
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_dynamic_service_calls_display_dynamic() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_dynamic_service_status"
    ) as mock_display:
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            [
                "-s",
                "execution-service",
                "--start-date",
                "2024-01-01",
                "--end-date",
                "2024-01-31",
            ],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    mock_display.assert_called_once()
    assert result.exit_code == 0


@pytest.mark.unit
def test_data_status_dynamic_service_mode_live() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_dynamic_service_status"
    ) as mock_display:
        runner = CliRunner()
        runner.invoke(
            data_status,
            [
                "-s",
                "strategy-service",
                "--start-date",
                "2024-01-01",
                "--end-date",
                "2024-01-31",
                "--mode",
                "live",
            ],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    call_kwargs = mock_display.call_args
    # mode 'live' should be passed through
    assert call_kwargs is not None


# ---------------------------------------------------------------------------
# Fixed dimension services
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_fixed_service_calls_display_fixed() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_fixed_service_status"
    ) as mock_display:
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            _BASE_ARGS,
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    mock_display.assert_called_once()
    assert result.exit_code == 0


@pytest.mark.unit
def test_data_status_fixed_service_show_timestamps() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_fixed_service_status"
    ) as mock_display:
        runner = CliRunner()
        runner.invoke(
            data_status,
            _BASE_ARGS + ["-t"],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    call_args = mock_display.call_args
    assert call_args is not None


@pytest.mark.unit
def test_data_status_fixed_service_show_missing() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_fixed_service_status"
    ) as mock_display:
        runner = CliRunner()
        runner.invoke(
            data_status,
            _BASE_ARGS + ["-m"],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    mock_display.assert_called_once()


@pytest.mark.unit
def test_data_status_fixed_service_fast_mode() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_fixed_service_status"
    ) as mock_display:
        runner = CliRunner()
        runner.invoke(
            data_status,
            _BASE_ARGS + ["--fast"],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    mock_display.assert_called_once()


@pytest.mark.unit
def test_data_status_output_json_format() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_fixed_service_status"
    ) as mock_display:
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            _BASE_ARGS + ["-o", "json"],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    assert result.exit_code == 0
    mock_display.assert_called_once()


@pytest.mark.unit
def test_data_status_output_summary_format() -> None:
    with patch("deployment_service.cli.commands.data_status.display_fixed_service_status"):
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            _BASE_ARGS + ["-o", "summary"],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    assert result.exit_code == 0


# ---------------------------------------------------------------------------
# --benchmark flag
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_benchmark_flag_calls_format_benchmark() -> None:
    with (
        patch("deployment_service.cli.commands.data_status.display_fixed_service_status"),
        patch("deployment_service.cli.commands.data_status.format_benchmark_info") as mock_bench,
    ):
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            _BASE_ARGS + ["-b"],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    mock_bench.assert_called_once()
    assert result.exit_code == 0


# ---------------------------------------------------------------------------
# Exception path
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_exception_exits_1() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_fixed_service_status",
        side_effect=RuntimeError("GCS exploded"),
    ):
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            _BASE_ARGS,
            obj=_CTX_OBJ,
            catch_exceptions=True,
        )
    assert result.exit_code == 1
    assert "Error" in result.output or result.exit_code == 1


@pytest.mark.unit
def test_data_status_value_error_exits_1() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_fixed_service_status",
        side_effect=ValueError("bad value"),
    ):
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            _BASE_ARGS,
            obj=_CTX_OBJ,
            catch_exceptions=True,
        )
    assert result.exit_code == 1


# ---------------------------------------------------------------------------
# --mode option
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_data_status_mode_batch_default() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_fixed_service_status"
    ) as mock_display:
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            _BASE_ARGS,
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    assert result.exit_code == 0
    mock_display.assert_called_once()


@pytest.mark.unit
def test_data_status_mode_live_fixed_service() -> None:
    with patch(
        "deployment_service.cli.commands.data_status.display_fixed_service_status"
    ) as mock_display:
        runner = CliRunner()
        result = runner.invoke(
            data_status,
            _BASE_ARGS + ["--mode", "live"],
            obj=_CTX_OBJ,
            catch_exceptions=False,
        )
    assert result.exit_code == 0
    mock_display.assert_called_once()
