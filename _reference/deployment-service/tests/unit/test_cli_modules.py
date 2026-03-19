"""
Unit tests for cli_modules/base.py, cli_modules/calculation.py, cli_modules/deployment.py,
and deployment_commands.py.

Covers:
BaseCLI:
- _get_config_dir: returns Path that resolves from script dir, cwd, parent, deployment-service
- setup_logging: sets root logger level correctly for INFO, DEBUG, WARNING
- load_config: delegates to ConfigLoader and returns dict on success
- load_config: returns None when ConfigLoader raises

CalculationCLI:
- calculate_shards: returns {} when config missing, calls ShardCalculator on success
- calculate_shards: returns error dict on ShardLimitExceeded
- calculate_shards: returns error dict on RuntimeError
- calculate_resources: uses provided shard_count, auto-calculates when None
- optimize_shards: returns optimization result dict
- _prepare_calculation_params: builds params dict with optional fields
- _format_shard_results: json / table / summary output formats
- _calculate_shard_summary: empty list, non-empty list with categories
- _format_shards_as_table: index, id, category, date fields
- _calculate_resource_requirements: multiplier per environment

DeploymentCLI:
- deploy_service: returns False when config missing
- deploy_service: returns False when validation fails (missing fields / invalid env)
- deploy_service: dry_run path returns True without executing
- deploy_service: execute path returns True
- _validate_deployment: required field missing returns False
- _validate_deployment: invalid environment returns False
- _validate_deployment: valid config returns True
- _calculate_deployment_shards: delegates to ShardCalculator
- _print_deployment_plan: runs without error (logging only)
- rollback_deployment: returns True
- get_deployment_status: returns dict with service key

deployment_commands.get_default_config:
- gcp provider: returns project_id, region, service_account, state_bucket
- aws provider: returns project_id (account_id), region keys
"""

from __future__ import annotations

import logging
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from deployment_service.cli_modules.base import BaseCLI
from deployment_service.cli_modules.calculation import CalculationCLI
from deployment_service.cli_modules.deployment import DeploymentCLI
from deployment_service.deployment_commands import get_default_config

# ---------------------------------------------------------------------------
# BaseCLI
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_base_cli_init_creates_config_dir(mock_loader_cls: MagicMock) -> None:
    cli = BaseCLI()
    assert isinstance(cli.config_dir, Path)


@pytest.mark.unit
def test_base_cli_setup_logging_info() -> None:
    """setup_logging sets root logger level to INFO."""
    root = logging.getLogger()
    original = root.level
    try:
        BaseCLI.setup_logging("INFO")
        assert root.level == logging.INFO
    finally:
        root.setLevel(original)


@pytest.mark.unit
def test_base_cli_setup_logging_debug() -> None:
    """setup_logging sets root logger level to DEBUG."""
    root = logging.getLogger()
    original = root.level
    try:
        BaseCLI.setup_logging("DEBUG")
        assert root.level == logging.DEBUG
    finally:
        root.setLevel(original)


@pytest.mark.unit
def test_base_cli_setup_logging_invalid_level_defaults_to_info() -> None:
    """Unknown level string falls back to logging.INFO."""
    root = logging.getLogger()
    original = root.level
    try:
        BaseCLI.setup_logging("NOTAVALIDLEVEL")
        assert root.level == logging.INFO
    finally:
        root.setLevel(original)


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_base_cli_load_config_success(mock_loader_cls: MagicMock) -> None:
    mock_loader = MagicMock()
    mock_loader.load_service_config.return_value = {"service": "test"}
    mock_loader_cls.return_value = mock_loader

    cli = BaseCLI()
    result = cli.load_config("test-service")

    assert result == {"service": "test"}
    mock_loader.load_service_config.assert_called_once_with("test-service")


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_base_cli_load_config_returns_none_on_error(mock_loader_cls: MagicMock) -> None:
    mock_loader = MagicMock()
    mock_loader.load_service_config.side_effect = OSError("file not found")
    mock_loader_cls.return_value = mock_loader

    cli = BaseCLI()
    result = cli.load_config("bad-service")

    assert result is None


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_base_cli_load_config_returns_none_on_value_error(mock_loader_cls: MagicMock) -> None:
    mock_loader = MagicMock()
    mock_loader.load_service_config.side_effect = ValueError("bad yaml")
    mock_loader_cls.return_value = mock_loader

    cli = BaseCLI()
    result = cli.load_config("bad-service")

    assert result is None


# ---------------------------------------------------------------------------
# CalculationCLI
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.cli_modules.calculation.ShardCalculator")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculation_cli_calculate_shards_no_config(
    mock_base_loader: MagicMock, mock_calc_cls: MagicMock
) -> None:
    """When config loading fails, calculate_shards returns empty dict."""
    cli = CalculationCLI()

    with patch.object(cli, "load_config", return_value=None):
        result = cli.calculate_shards("unknown-service")

    assert result == {}
    mock_calc_cls.assert_not_called()


@pytest.mark.unit
@patch("deployment_service.cli_modules.calculation.ShardCalculator")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculation_cli_calculate_shards_success(
    mock_base_loader: MagicMock, mock_calc_cls: MagicMock
) -> None:
    """When config loads and calculator succeeds, result contains shard_count."""
    mock_calc = MagicMock()
    mock_shard = MagicMock()
    mock_shard.dimensions = {"category": "CEFI"}
    mock_calc.calculate_shards.return_value = [mock_shard, mock_shard]
    mock_calc_cls.return_value = mock_calc

    cli = CalculationCLI()

    with patch.object(cli, "load_config", return_value={"service": "svc"}):
        result = cli.calculate_shards("my-service")

    assert result.get("shard_count") == 2
    assert "service" in result


@pytest.mark.unit
@patch("deployment_service.cli_modules.calculation.ShardCalculator")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculation_cli_calculate_shards_limit_exceeded(
    mock_base_loader: MagicMock, mock_calc_cls: MagicMock
) -> None:
    from deployment_service.shard_calculator import ShardLimitExceeded

    mock_calc = MagicMock()
    mock_calc.calculate_shards.side_effect = ShardLimitExceeded(
        total_shards=1000, max_shards=5, service="my-service", breakdown={}
    )
    mock_calc_cls.return_value = mock_calc

    cli = CalculationCLI()

    with patch.object(cli, "load_config", return_value={"service": "svc"}):
        result = cli.calculate_shards("my-service", max_shards=5)

    assert "error" in result
    assert result["max_shards"] == 5


@pytest.mark.unit
@patch("deployment_service.cli_modules.calculation.ShardCalculator")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculation_cli_calculate_shards_runtime_error(
    mock_base_loader: MagicMock, mock_calc_cls: MagicMock
) -> None:
    mock_calc = MagicMock()
    mock_calc.calculate_shards.side_effect = RuntimeError("backend error")
    mock_calc_cls.return_value = mock_calc

    cli = CalculationCLI()

    with patch.object(cli, "load_config", return_value={"service": "svc"}):
        result = cli.calculate_shards("my-service")

    assert "error" in result


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculation_cli_calculate_resources_with_shard_count(
    mock_base_loader: MagicMock,
) -> None:
    cli = CalculationCLI()
    config = {"resources": {"cpu": 2, "memory": 4, "storage": 20}}

    with patch.object(cli, "load_config", return_value=config):
        result = cli.calculate_resources("my-service", shard_count=10, environment="production")

    assert result["shard_count"] == 10
    assert result["environment"] == "production"
    assert "total_resources" in result
    assert "per_shard" in result
    assert "estimated_cost" in result


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculation_cli_calculate_resources_auto_shard_count(
    mock_base_loader: MagicMock,
) -> None:
    """When shard_count is None, calculate_shards is called automatically."""
    cli = CalculationCLI()
    config = {"resources": {}}

    with (
        patch.object(cli, "load_config", return_value=config),
        patch.object(cli, "calculate_shards", return_value={"shards": [{}, {}]}) as mock_calc,
    ):
        result = cli.calculate_resources("my-service", shard_count=None)

    mock_calc.assert_called_once_with("my-service")
    assert result["shard_count"] == 2


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculation_cli_calculate_resources_no_config_returns_empty(
    mock_base_loader: MagicMock,
) -> None:
    cli = CalculationCLI()

    with patch.object(cli, "load_config", return_value=None):
        result = cli.calculate_resources("svc")

    assert result == {}


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculation_cli_optimize_shards_no_config_returns_empty(
    mock_base_loader: MagicMock,
) -> None:
    cli = CalculationCLI()

    with patch.object(cli, "load_config", return_value=None):
        result = cli.optimize_shards("svc")

    assert result == {}


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculation_cli_optimize_shards_returns_result(
    mock_base_loader: MagicMock,
) -> None:
    cli = CalculationCLI()

    with patch.object(cli, "load_config", return_value={"max_shards": 100}):
        result = cli.optimize_shards("svc", target_metric="cost")

    assert result["target_metric"] == "cost"
    assert "optimized_shards" in result
    assert "improvements" in result


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_prepare_calculation_params_all_fields(mock_loader_cls: MagicMock) -> None:
    cli = CalculationCLI()
    params = cli._prepare_calculation_params("2024-01-01", "2024-01-31", "CEFI", 50)

    assert params["start_date"] == "2024-01-01"
    assert params["end_date"] == "2024-01-31"
    assert params["category"] == "CEFI"
    assert params["limit"] == 50


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_prepare_calculation_params_no_optional_fields(mock_loader_cls: MagicMock) -> None:
    cli = CalculationCLI()
    params = cli._prepare_calculation_params(None, None, None, 100)

    assert "start_date" not in params
    assert "end_date" not in params
    assert "category" not in params
    assert params["limit"] == 100


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculate_shard_summary_empty(mock_loader_cls: MagicMock) -> None:
    cli = CalculationCLI()
    result = cli._calculate_shard_summary([])
    assert result == {}


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculate_shard_summary_with_categories(mock_loader_cls: MagicMock) -> None:
    cli = CalculationCLI()
    shards = [
        {"category": "CEFI", "date_range": {"start": "2024-01-01", "end": "2024-01-31"}},
        {"category": "CEFI", "date_range": {}},
        {"category": "TRADFI", "date_range": {}},
    ]
    result = cli._calculate_shard_summary(shards)

    assert result["total_shards"] == 3
    assert "CEFI" in result["categories"]
    assert "TRADFI" in result["categories"]
    dist = result["category_distribution"]
    assert dist["CEFI"]["count"] == 2
    assert dist["TRADFI"]["count"] == 1


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_format_shards_as_table_structure(mock_loader_cls: MagicMock) -> None:
    cli = CalculationCLI()
    shards = [
        {"category": "CEFI", "date_range": {"start": "2024-01-01", "end": "2024-01-31"}},
    ]
    table = cli._format_shards_as_table(shards)

    assert len(table) == 1
    row = table[0]
    assert row["index"] == 0
    assert row["category"] == "CEFI"
    assert row["date_start"] == "2024-01-01"


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculate_resource_requirements_staging_multiplier(mock_loader_cls: MagicMock) -> None:
    cli = CalculationCLI()
    config = {"resources": {"cpu": 2, "memory": 4, "storage": 10}}
    result = cli._calculate_resource_requirements(config, shard_count=10, environment="staging")

    # staging multiplier = 0.5
    assert result["environment"] == "staging"
    assert "1.0 cores" in result["per_shard"]["cpu"]  # 2 * 0.5 = 1.0


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_calculate_resource_requirements_unknown_env_defaults_to_1x(
    mock_loader_cls: MagicMock,
) -> None:
    cli = CalculationCLI()
    config = {"resources": {"cpu": 4}}
    result = cli._calculate_resource_requirements(config, shard_count=1, environment="unknown")

    # multiplier 1.0 — 4 cores
    assert "4.0 cores" in result["per_shard"]["cpu"]


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_format_shard_results_json_format(mock_loader_cls: MagicMock) -> None:
    cli = CalculationCLI()
    # Use minimal mock shards (just objects that pass isinstance checks)
    shards = [MagicMock(), MagicMock()]
    params: dict[str, object] = {"limit": 10}

    with (
        patch("deployment_service.cli_modules.calculation.build_shard_id", return_value="id-0"),
        patch("deployment_service.cli_modules.calculation.build_shard_args", return_value=[]),
    ):
        result = cli._format_shard_results("svc", shards, params, "json")

    assert result["service"] == "svc"
    assert result["shard_count"] == 2
    shards_list = result["shards"]
    assert isinstance(shards_list, list)


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_format_shard_results_summary_format(mock_loader_cls: MagicMock) -> None:
    cli = CalculationCLI()
    shards = [{"category": "CEFI"}]
    params: dict[str, object] = {"limit": 5}

    result = cli._format_shard_results("svc", shards, params, "summary")
    assert "summary" in result


@pytest.mark.unit
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_format_shard_results_table_format(mock_loader_cls: MagicMock) -> None:
    cli = CalculationCLI()
    shards = [{"category": "CEFI", "date_range": {}}]
    params: dict[str, object] = {"limit": 5}

    with patch("deployment_service.cli_modules.calculation.build_shard_id", return_value="id"):
        result = cli._format_shard_results("svc", shards, params, "table")

    assert isinstance(result["shards"], list)


# ---------------------------------------------------------------------------
# DeploymentCLI
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_deploy_service_no_config_returns_false(
    mock_base_loader: MagicMock, mock_dep_cfg: MagicMock
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    cli = DeploymentCLI()

    with patch.object(cli, "load_config", return_value=None):
        result = cli.deploy_service("missing-service")

    assert result is False


@pytest.mark.unit
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_deploy_service_validation_fails_returns_false(
    mock_base_loader: MagicMock, mock_dep_cfg: MagicMock
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    cli = DeploymentCLI()

    # Config missing required fields
    bad_config: dict[str, object] = {}
    with patch.object(cli, "load_config", return_value=bad_config):
        result = cli.deploy_service("svc")

    assert result is False


@pytest.mark.unit
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_deploy_service_invalid_env_returns_false(
    mock_base_loader: MagicMock, mock_dep_cfg: MagicMock
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    cli = DeploymentCLI()

    config = {"service_name": "svc", "image": "img:latest", "resources": {}}
    with patch.object(cli, "load_config", return_value=config):
        result = cli.deploy_service("svc", environment="nonexistent-env")

    assert result is False


@pytest.mark.unit
@patch("deployment_service.cli_modules.deployment.ShardCalculator")
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_deploy_service_dry_run_returns_true(
    mock_base_loader: MagicMock,
    mock_dep_cfg: MagicMock,
    mock_calc_cls: MagicMock,
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    mock_calc = MagicMock()
    mock_calc.calculate_shards.return_value = []
    mock_calc_cls.return_value = mock_calc

    cli = DeploymentCLI()
    config = {"service_name": "svc", "image": "img:latest", "resources": {}}

    with patch.object(cli, "load_config", return_value=config):
        result = cli.deploy_service("svc", dry_run=True)

    assert result is True


@pytest.mark.unit
@patch("deployment_service.cli_modules.deployment.ShardCalculator")
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_deploy_service_executes_successfully(
    mock_base_loader: MagicMock,
    mock_dep_cfg: MagicMock,
    mock_calc_cls: MagicMock,
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    mock_calc = MagicMock()
    mock_calc.calculate_shards.return_value = []
    mock_calc_cls.return_value = mock_calc

    cli = DeploymentCLI()
    config = {"service_name": "svc", "image": "img:latest", "resources": {}}

    with patch.object(cli, "load_config", return_value=config):
        result = cli.deploy_service("svc", environment="staging")

    assert result is True


@pytest.mark.unit
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_validate_deployment_missing_field(
    mock_base_loader: MagicMock, mock_dep_cfg: MagicMock
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    cli = DeploymentCLI()

    config: dict[str, object] = {"service_name": "svc"}  # missing image, resources
    assert cli._validate_deployment(config, "production") is False


@pytest.mark.unit
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_validate_deployment_invalid_env(
    mock_base_loader: MagicMock, mock_dep_cfg: MagicMock
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    cli = DeploymentCLI()

    config: dict[str, object] = {"service_name": "svc", "image": "img", "resources": {}}
    assert cli._validate_deployment(config, "fantasy-env") is False


@pytest.mark.unit
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_validate_deployment_valid(
    mock_base_loader: MagicMock, mock_dep_cfg: MagicMock
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    cli = DeploymentCLI()

    config: dict[str, object] = {"service_name": "svc", "image": "img", "resources": {}}
    assert cli._validate_deployment(config, "production") is True


@pytest.mark.unit
@patch("deployment_service.cli_modules.deployment.ShardCalculator")
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_calculate_shards_uses_max_shards(
    mock_base_loader: MagicMock,
    mock_dep_cfg: MagicMock,
    mock_calc_cls: MagicMock,
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    mock_shard = MagicMock()
    mock_shard.service = "svc"
    mock_shard.dimensions = {}
    mock_calc = MagicMock()
    mock_calc.calculate_shards.return_value = [mock_shard]
    mock_calc_cls.return_value = mock_calc

    cli = DeploymentCLI()
    config: dict[str, object] = {"service_name": "svc", "max_shards": 200}
    result = cli._calculate_deployment_shards(config, max_shards=50)

    call_kwargs = mock_calc.calculate_shards.call_args.kwargs
    assert call_kwargs.get("max_shards") == 50
    assert len(result) == 1


@pytest.mark.unit
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_rollback_returns_true(
    mock_base_loader: MagicMock, mock_dep_cfg: MagicMock
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    cli = DeploymentCLI()
    assert cli.rollback_deployment("svc") is True
    assert cli.rollback_deployment("svc", version="1.2.3") is True


@pytest.mark.unit
@patch("deployment_service.deployment_config.DeploymentConfig")
@patch("deployment_service.cli_modules.base.ConfigLoader")
def test_deployment_cli_get_deployment_status_returns_dict(
    mock_base_loader: MagicMock, mock_dep_cfg: MagicMock
) -> None:
    mock_dep_cfg.return_value = MagicMock(default_max_concurrent=50, max_concurrent_hard_limit=500)
    cli = DeploymentCLI()
    status = cli.get_deployment_status("my-service")

    assert status["service"] == "my-service"
    assert "status" in status
    assert "shards" in status


# ---------------------------------------------------------------------------
# deployment_commands.get_default_config
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment_commands.DeploymentConfig")
def test_get_default_config_gcp(mock_cfg_cls: MagicMock) -> None:
    mock_cfg = MagicMock()
    mock_cfg.gcp_project_id = "my-gcp-proj"
    mock_cfg.gcs_region = "us-central1"
    mock_cfg.service_account_email = "svc@proj.iam.gserviceaccount.com"
    mock_cfg.effective_state_bucket = "deployment-state-bucket"
    mock_cfg_cls.return_value = mock_cfg

    result = get_default_config("gcp")

    assert result["project_id"] == "my-gcp-proj"
    assert result["region"] == "us-central1"
    assert "svc@proj.iam.gserviceaccount.com" in str(result["service_account"])
    assert result["state_bucket"] == "deployment-state-bucket"


@pytest.mark.unit
@patch("deployment_service.deployment_commands.DeploymentConfig")
def test_get_default_config_aws(mock_cfg_cls: MagicMock) -> None:
    mock_cfg = MagicMock()
    mock_cfg.aws_account_id = "123456789012"
    mock_cfg.aws_region = "us-east-1"
    mock_cfg_cls.return_value = mock_cfg

    result = get_default_config("aws")

    assert result["project_id"] == "123456789012"
    assert result["region"] == "us-east-1"
    assert result["service_account"] == ""


@pytest.mark.unit
@patch("deployment_service.deployment_commands.DeploymentConfig")
def test_get_default_config_no_service_account_falls_back(mock_cfg_cls: MagicMock) -> None:
    mock_cfg = MagicMock()
    mock_cfg.gcp_project_id = "fallback-proj"
    mock_cfg.gcs_region = "us-west1"
    mock_cfg.service_account_email = None
    mock_cfg.effective_state_bucket = "state-bucket"
    mock_cfg_cls.return_value = mock_cfg

    result = get_default_config("gcp")

    # Should use the default template when service_account_email is None
    assert "fallback-proj" in str(result["service_account"])
