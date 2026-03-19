"""
Unit tests for deployment_service/smoke_test_framework.py.

Covers:
- SmokeTestResult: to_dict structure and values
- ShardCombinatoricsGenerator.__init__: stores config_dir
- ShardCombinatoricsGenerator.get_smoke_test_shards: delegates to ShardCalculator,
  passes filters correctly
- ShardCombinatoricsGenerator.get_all_category_venue_combinations: fixed + hierarchical paths,
  no-venue fallback
- GCSTestBucketManager.__init__: raises ValueError when no project_id, stores values
- GCSTestBucketManager.get_test_bucket_name: returns prefixed name
- GCSTestBucketManager.storage_client: lazy initialization
- GCSTestBucketManager.clean_test_bucket: deletes blobs, returns count, handles errors
- GCSTestBucketManager.list_output_files: filters by suffix pattern, handles errors
- GCSTestBucketManager.verify_output_exists: returns True when files >= min_files
- SmokeTestRunner.__init__: defaults service_module correctly
- SmokeTestRunner._build_cli_command: date dict dimension, config dim, generic dim
- SmokeTestRunner._run_single_test: dry_run path, success path, failure (non-zero exit),
  timeout, OSError
- SmokeTestRunner.run_smoke_tests: iterates shards, collects results
- SmokeTestRunner.generate_test_report: pass_rate, failed_shards, zero-result edge case
"""

from __future__ import annotations

import subprocess
from datetime import date
from unittest.mock import MagicMock, patch

import pytest

from deployment_service.calculators.base_calculator import Shard
from deployment_service.smoke_test_framework import (
    GCSTestBucketManager,
    ShardCombinatoricsGenerator,
    SmokeTestResult,
    SmokeTestRunner,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_shard(
    dimensions: dict[str, object] | None = None,
    service: str = "test-service",
    shard_index: int = 0,
) -> Shard:
    dims: dict[str, object] = dimensions or {"category": "CEFI", "venue": "BINANCE-SPOT"}
    return Shard(service=service, shard_index=shard_index, total_shards=10, dimensions=dims)


# ---------------------------------------------------------------------------
# SmokeTestResult
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_smoke_test_result_to_dict_passed() -> None:
    shard = _make_shard()
    result = SmokeTestResult(
        shard=shard,
        passed=True,
        output_files=["gs://bucket/file1.parquet", "gs://bucket/file2.parquet"],
        execution_time_seconds=12.5,
    )
    d = result.to_dict()
    assert d["passed"] is True
    assert d["output_files_count"] == 2
    assert d["execution_time_seconds"] == pytest.approx(12.5)
    assert d["error_message"] is None


@pytest.mark.unit
def test_smoke_test_result_to_dict_failed() -> None:
    shard = _make_shard()
    result = SmokeTestResult(
        shard=shard,
        passed=False,
        output_files=[],
        error_message="Exit code 1: stderr output",
        execution_time_seconds=3.2,
    )
    d = result.to_dict()
    assert d["passed"] is False
    assert d["output_files_count"] == 0
    assert "Exit code 1" in str(d["error_message"])


@pytest.mark.unit
def test_smoke_test_result_shard_dimensions_included() -> None:
    dims = {"category": "TRADFI", "venue": "CME"}
    shard = _make_shard(dimensions=dims)
    result = SmokeTestResult(shard=shard, passed=True, output_files=[])
    assert result.to_dict()["shard_dimensions"] == dims


# ---------------------------------------------------------------------------
# ShardCombinatoricsGenerator
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ShardCalculator")
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_generator_init_stores_config_dir(
    mock_loader_cls: MagicMock, mock_calc_cls: MagicMock
) -> None:
    gen = ShardCombinatoricsGenerator(config_dir="custom_configs")
    assert gen.config_dir == "custom_configs"
    mock_calc_cls.assert_called_once_with("custom_configs")
    mock_loader_cls.assert_called_once_with("custom_configs")


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ShardCalculator")
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_get_smoke_test_shards_calls_calculator(
    mock_loader_cls: MagicMock, mock_calc_cls: MagicMock
) -> None:
    mock_calc = MagicMock()
    shards = [_make_shard(), _make_shard(shard_index=1)]
    mock_calc.calculate_shards.return_value = shards
    mock_calc_cls.return_value = mock_calc
    mock_loader_cls.return_value = MagicMock()

    gen = ShardCombinatoricsGenerator()
    result = gen.get_smoke_test_shards(service="my-service", test_date=date(2024, 1, 15))

    mock_calc.calculate_shards.assert_called_once()
    call_kwargs = mock_calc.calculate_shards.call_args.kwargs
    assert call_kwargs["service"] == "my-service"
    assert call_kwargs["start_date"] == date(2024, 1, 15)
    assert call_kwargs["end_date"] == date(2024, 1, 15)
    assert call_kwargs["respect_start_dates"] is True
    assert result == shards


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ShardCalculator")
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_get_smoke_test_shards_applies_category_filter(
    mock_loader_cls: MagicMock, mock_calc_cls: MagicMock
) -> None:
    mock_calc = MagicMock()
    mock_calc.calculate_shards.return_value = []
    mock_calc_cls.return_value = mock_calc
    mock_loader_cls.return_value = MagicMock()

    gen = ShardCombinatoricsGenerator()
    gen.get_smoke_test_shards(
        service="svc",
        test_date=date(2024, 1, 15),
        category_filter=["CEFI"],
        venue_filter=["BINANCE-SPOT"],
    )

    call_kwargs = mock_calc.calculate_shards.call_args.kwargs
    assert call_kwargs.get("category") == ["CEFI"]
    assert call_kwargs.get("venue") == ["BINANCE-SPOT"]


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ShardCalculator")
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_get_all_category_venue_combinations_hierarchical(
    mock_loader_cls: MagicMock, mock_calc_cls: MagicMock
) -> None:
    mock_calc_cls.return_value = MagicMock()

    service_config = {
        "dimensions": [
            {"name": "category", "type": "fixed", "values": ["CEFI", "TRADFI"]},
            {"name": "venue", "type": "hierarchical", "parent": "category"},
        ]
    }
    venues_config = {
        "categories": {
            "CEFI": {"venues": ["BINANCE-SPOT", "DERIBIT"]},
            "TRADFI": {"venues": ["CME"]},
        }
    }

    mock_loader = MagicMock()
    mock_loader.load_service_config.return_value = service_config
    mock_loader.load_venues_config.return_value = venues_config
    mock_loader_cls.return_value = mock_loader

    gen = ShardCombinatoricsGenerator()
    combos = gen.get_all_category_venue_combinations("market-tick-data")

    assert len(combos) == 3  # CEFI×2 + TRADFI×1
    categories = [c["category"] for c in combos]
    assert "CEFI" in categories
    assert "TRADFI" in categories


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ShardCalculator")
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_get_all_category_venue_combinations_no_venue_dim(
    mock_loader_cls: MagicMock, mock_calc_cls: MagicMock
) -> None:
    """Service with no hierarchical venue dim should get one combo per category."""
    mock_calc_cls.return_value = MagicMock()

    service_config = {
        "dimensions": [
            {"name": "category", "type": "fixed", "values": ["CEFI", "TRADFI"]},
        ]
    }
    venues_config = {"categories": {}}

    mock_loader = MagicMock()
    mock_loader.load_service_config.return_value = service_config
    mock_loader.load_venues_config.return_value = venues_config
    mock_loader_cls.return_value = mock_loader

    gen = ShardCombinatoricsGenerator()
    combos = gen.get_all_category_venue_combinations("simple-service")

    assert len(combos) == 2
    assert all(c["venue"] is None for c in combos)


# ---------------------------------------------------------------------------
# GCSTestBucketManager
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework._config")
def test_gcs_bucket_manager_raises_when_no_project_id(mock_cfg: MagicMock) -> None:
    mock_cfg.gcp_project_id = None

    with pytest.raises(ValueError, match="GCP project ID required"):
        GCSTestBucketManager()


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework._config")
def test_gcs_bucket_manager_stores_project_id(mock_cfg: MagicMock) -> None:
    mock_cfg.gcp_project_id = "proj-123"
    manager = GCSTestBucketManager()
    assert manager.project_id == "proj-123"
    assert manager.test_bucket_prefix == "test-smoke-"


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework._config")
def test_gcs_bucket_manager_explicit_project_id(mock_cfg: MagicMock) -> None:
    mock_cfg.gcp_project_id = None
    manager = GCSTestBucketManager(project_id="explicit-proj")
    assert manager.project_id == "explicit-proj"


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework._config")
def test_get_test_bucket_name(mock_cfg: MagicMock) -> None:
    mock_cfg.gcp_project_id = "p"
    manager = GCSTestBucketManager(test_bucket_prefix="smoke-")
    name = manager.get_test_bucket_name("my-service", "CEFI")
    assert name == "smoke-my-service-cefi"


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.get_storage_client")
@patch("deployment_service.smoke_test_framework._config")
def test_storage_client_lazy_init(mock_cfg: MagicMock, mock_get_client: MagicMock) -> None:
    mock_cfg.gcp_project_id = "proj"
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    manager = GCSTestBucketManager()
    assert manager._storage_client is None

    client = manager.storage_client
    assert client is mock_client
    mock_get_client.assert_called_once_with(project_id="proj")

    # Second access should NOT re-initialize
    _ = manager.storage_client
    mock_get_client.assert_called_once()


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.get_storage_client")
@patch("deployment_service.smoke_test_framework._config")
def test_clean_test_bucket_deletes_blobs_and_returns_count(
    mock_cfg: MagicMock, mock_get_client: MagicMock
) -> None:
    mock_cfg.gcp_project_id = "proj"

    blob1 = MagicMock()
    blob2 = MagicMock()
    mock_bucket = MagicMock()
    mock_bucket.list_blobs.return_value = [blob1, blob2]
    mock_storage = MagicMock()
    mock_storage.bucket.return_value = mock_bucket
    mock_get_client.return_value = mock_storage

    manager = GCSTestBucketManager()
    count = manager.clean_test_bucket("my-bucket", prefix="data/")

    assert count == 2
    blob1.delete.assert_called_once()
    blob2.delete.assert_called_once()


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.get_storage_client")
@patch("deployment_service.smoke_test_framework._config")
def test_clean_test_bucket_handles_error_returns_zero(
    mock_cfg: MagicMock, mock_get_client: MagicMock
) -> None:
    mock_cfg.gcp_project_id = "proj"
    mock_storage = MagicMock()
    mock_storage.bucket.side_effect = OSError("network error")
    mock_get_client.return_value = mock_storage

    manager = GCSTestBucketManager()
    count = manager.clean_test_bucket("my-bucket")

    assert count == 0


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.get_storage_client")
@patch("deployment_service.smoke_test_framework._config")
def test_list_output_files_filters_by_suffix(
    mock_cfg: MagicMock, mock_get_client: MagicMock
) -> None:
    mock_cfg.gcp_project_id = "proj"

    parquet_blob = MagicMock()
    parquet_blob.name = "data/file.parquet"
    json_blob = MagicMock()
    json_blob.name = "data/file.json"

    mock_bucket = MagicMock()
    mock_bucket.list_blobs.return_value = [parquet_blob, json_blob]
    mock_storage = MagicMock()
    mock_storage.bucket.return_value = mock_bucket
    mock_get_client.return_value = mock_storage

    manager = GCSTestBucketManager()
    files = manager.list_output_files("my-bucket", "data/", "*.parquet")

    assert len(files) == 1
    assert files[0] == "gs://my-bucket/data/file.parquet"


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.get_storage_client")
@patch("deployment_service.smoke_test_framework._config")
def test_list_output_files_handles_error_returns_empty(
    mock_cfg: MagicMock, mock_get_client: MagicMock
) -> None:
    mock_cfg.gcp_project_id = "proj"
    mock_storage = MagicMock()
    mock_storage.bucket.side_effect = OSError("permission denied")
    mock_get_client.return_value = mock_storage

    manager = GCSTestBucketManager()
    files = manager.list_output_files("my-bucket", "data/")

    assert files == []


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.get_storage_client")
@patch("deployment_service.smoke_test_framework._config")
def test_verify_output_exists_returns_true_when_enough_files(
    mock_cfg: MagicMock, mock_get_client: MagicMock
) -> None:
    mock_cfg.gcp_project_id = "proj"

    blob = MagicMock()
    blob.name = "by_date/day-2024-01-15/data.parquet"
    mock_bucket = MagicMock()
    mock_bucket.list_blobs.return_value = [blob]
    mock_storage = MagicMock()
    mock_storage.bucket.return_value = mock_bucket
    mock_get_client.return_value = mock_storage

    manager = GCSTestBucketManager()
    shard = _make_shard(dimensions={"date": {"start": "2024-01-15", "end": "2024-01-15"}})
    result = manager.verify_output_exists("my-bucket", shard, min_files=1)

    assert result is True


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.get_storage_client")
@patch("deployment_service.smoke_test_framework._config")
def test_verify_output_exists_returns_false_when_no_files(
    mock_cfg: MagicMock, mock_get_client: MagicMock
) -> None:
    mock_cfg.gcp_project_id = "proj"

    mock_bucket = MagicMock()
    mock_bucket.list_blobs.return_value = []
    mock_storage = MagicMock()
    mock_storage.bucket.return_value = mock_bucket
    mock_get_client.return_value = mock_storage

    manager = GCSTestBucketManager()
    shard = _make_shard(dimensions={"date": "2024-01-15"})
    result = manager.verify_output_exists("my-bucket", shard, min_files=1)

    assert result is False


# ---------------------------------------------------------------------------
# SmokeTestRunner
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_runner_default_service_module(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    assert runner.service_module == "my_service"


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_runner_custom_service_module(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service", service_module="custom_module")
    assert runner.service_module == "custom_module"


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_build_cli_command_date_dict_dimension(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    shard = _make_shard(dimensions={"date": {"start": "2024-01-01", "end": "2024-01-01"}})
    cmd = runner._build_cli_command(shard, max_instruments=1)

    assert "--start-date" in cmd
    assert "2024-01-01" in cmd
    assert "--end-date" in cmd
    assert "--max-instruments" in cmd
    assert "1" in cmd


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_build_cli_command_config_dimension(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    shard = _make_shard(dimensions={"config": "gs://bucket/config.json"})
    cmd = runner._build_cli_command(shard, max_instruments=5)

    assert "--config-gcs" in cmd
    assert "gs://bucket/config.json" in cmd


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_build_cli_command_generic_dimension_hyphenated(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    shard = _make_shard(dimensions={"venue_type": "SPOT"})
    cmd = runner._build_cli_command(shard, max_instruments=1)

    assert "--venue-type" in cmd
    assert "SPOT" in cmd


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_run_single_test_dry_run_returns_passed(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    shard = _make_shard()
    result = runner._run_single_test(
        shard=shard, max_instruments=1, timeout_seconds=30, dry_run=True
    )

    assert result.passed is True
    assert result.error_message is not None
    assert "Dry run" in str(result.error_message)


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_run_single_test_success_exit_code_zero(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    shard = _make_shard()

    mock_proc = MagicMock()
    mock_proc.returncode = 0
    mock_proc.stderr = ""

    with patch("deployment_service.smoke_test_framework.subprocess.run", return_value=mock_proc):
        result = runner._run_single_test(
            shard=shard, max_instruments=1, timeout_seconds=30, dry_run=False
        )

    assert result.passed is True
    assert result.error_message is None


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_run_single_test_non_zero_exit_fails(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    shard = _make_shard()

    mock_proc = MagicMock()
    mock_proc.returncode = 1
    mock_proc.stderr = "Some error output"

    with patch("deployment_service.smoke_test_framework.subprocess.run", return_value=mock_proc):
        result = runner._run_single_test(
            shard=shard, max_instruments=1, timeout_seconds=30, dry_run=False
        )

    assert result.passed is False
    assert "Exit code 1" in str(result.error_message)


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_run_single_test_timeout_returns_failure(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    shard = _make_shard()

    with patch(
        "deployment_service.smoke_test_framework.subprocess.run",
        side_effect=subprocess.TimeoutExpired(cmd=["python"], timeout=30),
    ):
        result = runner._run_single_test(
            shard=shard, max_instruments=1, timeout_seconds=30, dry_run=False
        )

    assert result.passed is False
    assert "Timeout" in str(result.error_message)
    assert result.execution_time_seconds == 30


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_run_single_test_os_error_returns_failure(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    shard = _make_shard()

    with patch(
        "deployment_service.smoke_test_framework.subprocess.run",
        side_effect=OSError("cannot execute"),
    ):
        result = runner._run_single_test(
            shard=shard, max_instruments=1, timeout_seconds=30, dry_run=False
        )

    assert result.passed is False
    assert "cannot execute" in str(result.error_message)


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_run_smoke_tests_iterates_all_shards(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-service")
    shards = [_make_shard(shard_index=i) for i in range(4)]

    with patch.object(runner, "_run_single_test") as mock_run:
        mock_run.return_value = SmokeTestResult(shard=shards[0], passed=True, output_files=[])
        results = runner.run_smoke_tests(shards, max_instruments=1)

    assert len(results) == 4
    assert mock_run.call_count == 4


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_generate_test_report_all_passed(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-svc")
    shards = [_make_shard(shard_index=i) for i in range(3)]
    results = [SmokeTestResult(shard=s, passed=True, output_files=[]) for s in shards]

    report = runner.generate_test_report(results)

    assert report["service"] == "my-svc"
    assert report["total_tests"] == 3
    assert report["passed"] == 3
    assert report["failed"] == 0
    assert report["pass_rate"] == pytest.approx(1.0)
    assert report["failed_shards"] == []


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_generate_test_report_mixed_results(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-svc")
    shards = [_make_shard(shard_index=i) for i in range(4)]
    results = [
        SmokeTestResult(shard=shards[0], passed=True, output_files=[]),
        SmokeTestResult(shard=shards[1], passed=True, output_files=[]),
        SmokeTestResult(shard=shards[2], passed=False, output_files=[], error_message="timeout"),
        SmokeTestResult(shard=shards[3], passed=False, output_files=[], error_message="OOM"),
    ]

    report = runner.generate_test_report(results)

    assert report["total_tests"] == 4
    assert report["passed"] == 2
    assert report["failed"] == 2
    assert report["pass_rate"] == pytest.approx(0.5)
    assert len(report["failed_shards"]) == 2
    error_msgs = [fs["error"] for fs in report["failed_shards"]]
    assert "timeout" in error_msgs
    assert "OOM" in error_msgs


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_generate_test_report_empty_results(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-svc")
    report = runner.generate_test_report([])

    assert report["total_tests"] == 0
    assert report["pass_rate"] == 0
    assert report["failed_shards"] == []
    assert report["total_execution_time"] == pytest.approx(0.0)


@pytest.mark.unit
@patch("deployment_service.smoke_test_framework.ConfigLoader")
def test_generate_test_report_execution_time_summed(mock_loader_cls: MagicMock) -> None:
    runner = SmokeTestRunner(service="my-svc")
    shards = [_make_shard(shard_index=i) for i in range(2)]
    results = [
        SmokeTestResult(shard=shards[0], passed=True, output_files=[], execution_time_seconds=5.0),
        SmokeTestResult(shard=shards[1], passed=True, output_files=[], execution_time_seconds=3.5),
    ]

    report = runner.generate_test_report(results)
    assert report["total_execution_time"] == pytest.approx(8.5)
