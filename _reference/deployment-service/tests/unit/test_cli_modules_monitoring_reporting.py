"""
Unit tests for cli_modules/monitoring.py and cli_modules/reporting.py.

Covers:
MonitoringCLI:
- __init__: metrics_window default
- check_health: delegates to _check_service_health when service given
- check_health: delegates to _check_all_services_health when None
- _check_service_health: returns expected keys; logs healthy status
- _check_all_services_health: aggregates per-service statuses; unhealthy/degraded paths
- _get_all_services: returns non-empty list
- _log_health_status: healthy, degraded, unhealthy, no-metrics branches
- get_metrics: all / performance / errors / resources metric_type branches
- get_metrics: default time_range falls back to metrics_window
- get_logs: all severity; filtered severity; lines truncation
- set_alert: returns True on success; covers alert_config logging

ReportingCLI:
- __init__: report_dir created
- generate_deployment_report: single service; all services; with output_file
- generate_performance_report: custom time_range; default time_range; with output_file
- generate_cost_report: single service; with output_file; total_cost accumulation
- _get_all_services: returns list
- _get_service_deployment_info: keys present
- _get_service_performance_metrics: keys present
- _calculate_service_cost: compute/storage/network/other/total keys
- _calculate_deployment_summary: correct totals
- _calculate_aggregate_performance: total_requests / total_errors / average_uptime
- _calculate_aggregate_performance: zero total_requests branch
- _calculate_cost_breakdown: sums per category
- _save_report: json format written; markdown format; csv format; unknown format no-op
- _save_markdown_report: summary section; nested dict sub-keys
- _save_csv_report: header row + data rows
"""

from __future__ import annotations

import csv
import json
import logging
from datetime import timedelta
from pathlib import Path
from typing import cast
from unittest.mock import MagicMock, patch

import pytest

from deployment_service.cli_modules.monitoring import MonitoringCLI
from deployment_service.cli_modules.reporting import ReportingCLI

# ===========================================================================
# Helpers
# ===========================================================================


def _make_monitoring_cli() -> MonitoringCLI:
    return MonitoringCLI()


def _make_reporting_cli(tmp_path: Path) -> ReportingCLI:
    with patch.object(Path, "mkdir"):
        cli = ReportingCLI.__new__(ReportingCLI)
        # Call parent init manually
        from deployment_service.cli_modules.base import BaseCLI

        BaseCLI.__init__(cli)
        cli.report_dir = tmp_path / "reports"
        cli.report_dir.mkdir(parents=True, exist_ok=True)
    return cli


# ===========================================================================
# MonitoringCLI
# ===========================================================================


@pytest.mark.unit
def test_monitoring_cli_init_metrics_window() -> None:
    cli = _make_monitoring_cli()
    assert cli.metrics_window == timedelta(minutes=5)


@pytest.mark.unit
def test_monitoring_check_health_with_service() -> None:
    cli = _make_monitoring_cli()
    result = cli.check_health(service="instruments-service")
    assert result["service"] == "instruments-service"
    assert "status" in result


@pytest.mark.unit
def test_monitoring_check_health_all_services() -> None:
    cli = _make_monitoring_cli()
    result = cli.check_health()
    assert "services" in result
    assert "overall_status" in result
    assert "timestamp" in result


@pytest.mark.unit
def test_monitoring_check_service_health_keys() -> None:
    cli = _make_monitoring_cli()
    result = cli._check_service_health("risk-service")
    assert result["service"] == "risk-service"
    assert result["status"] == "healthy"
    assert "uptime" in result
    assert "endpoints" in result
    assert "metrics" in result


@pytest.mark.unit
def test_monitoring_check_all_services_health_all_healthy() -> None:
    cli = _make_monitoring_cli()
    result = cli._check_all_services_health()
    assert result["overall_status"] == "healthy"
    services = cast(dict[str, object], result["services"])
    assert len(services) == 5


@pytest.mark.unit
def test_monitoring_check_all_services_health_degraded() -> None:
    """When some services are unhealthy but <50%, overall_status is degraded."""
    cli = _make_monitoring_cli()

    # Patch _check_service_health to return unhealthy for first service only
    original = cli._check_service_health

    call_count: list[int] = [0]

    def patched_check(service: str) -> dict[str, object]:
        call_count[0] += 1
        result = original(service)
        if call_count[0] == 1:
            result = dict(result)
            result["status"] = "unhealthy"
        return result

    with patch.object(cli, "_check_service_health", side_effect=patched_check):
        result = cli._check_all_services_health()

    assert result["overall_status"] == "degraded"


@pytest.mark.unit
def test_monitoring_check_all_services_health_unhealthy() -> None:
    """When majority of services are unhealthy, overall_status is unhealthy."""
    cli = _make_monitoring_cli()

    def all_unhealthy(service: str) -> dict[str, object]:
        return {"service": service, "status": "unhealthy"}

    with patch.object(cli, "_check_service_health", side_effect=all_unhealthy):
        result = cli._check_all_services_health()

    assert result["overall_status"] == "unhealthy"


@pytest.mark.unit
def test_monitoring_get_all_services_non_empty() -> None:
    cli = _make_monitoring_cli()
    services = cli._get_all_services()
    assert isinstance(services, list)
    assert len(services) > 0


@pytest.mark.unit
def test_monitoring_log_health_status_healthy(caplog: pytest.LogCaptureFixture) -> None:
    cli = _make_monitoring_cli()
    with caplog.at_level(logging.INFO, logger="deployment_service.cli_modules.monitoring"):
        cli._log_health_status(
            {
                "service": "test-svc",
                "status": "healthy",
                "metrics": {
                    "cpu_usage": "10%",
                    "memory_usage": "20%",
                    "request_rate": "100 req/s",
                    "error_rate": "0.01%",
                },
            }
        )
    assert any("HEALTHY" in r.message for r in caplog.records)


@pytest.mark.unit
def test_monitoring_log_health_status_degraded(caplog: pytest.LogCaptureFixture) -> None:
    cli = _make_monitoring_cli()
    with caplog.at_level(logging.WARNING, logger="deployment_service.cli_modules.monitoring"):
        cli._log_health_status({"service": "test-svc", "status": "degraded"})
    assert any("DEGRADED" in r.message for r in caplog.records)


@pytest.mark.unit
def test_monitoring_log_health_status_unhealthy(caplog: pytest.LogCaptureFixture) -> None:
    cli = _make_monitoring_cli()
    with caplog.at_level(logging.ERROR, logger="deployment_service.cli_modules.monitoring"):
        cli._log_health_status({"service": "test-svc", "status": "critical"})
    assert any("UNHEALTHY" in r.message for r in caplog.records)


@pytest.mark.unit
def test_monitoring_log_health_status_no_metrics() -> None:
    """_log_health_status with no metrics key runs without error."""
    cli = _make_monitoring_cli()
    # Should not raise
    cli._log_health_status({"service": "test-svc", "status": "healthy"})


@pytest.mark.unit
def test_monitoring_get_metrics_all() -> None:
    cli = _make_monitoring_cli()
    result = cli.get_metrics("execution-service", metric_type="all")
    data = cast(dict[str, object], result["data"])
    assert "performance" in data
    assert "errors" in data
    assert "resources" in data


@pytest.mark.unit
def test_monitoring_get_metrics_performance_only() -> None:
    cli = _make_monitoring_cli()
    result = cli.get_metrics("execution-service", metric_type="performance")
    data = cast(dict[str, object], result["data"])
    assert "performance" in data
    assert "errors" not in data
    assert "resources" not in data


@pytest.mark.unit
def test_monitoring_get_metrics_errors_only() -> None:
    cli = _make_monitoring_cli()
    result = cli.get_metrics("execution-service", metric_type="errors")
    data = cast(dict[str, object], result["data"])
    assert "errors" in data
    assert "performance" not in data


@pytest.mark.unit
def test_monitoring_get_metrics_resources_only() -> None:
    cli = _make_monitoring_cli()
    result = cli.get_metrics("execution-service", metric_type="resources")
    data = cast(dict[str, object], result["data"])
    assert "resources" in data
    assert "performance" not in data


@pytest.mark.unit
def test_monitoring_get_metrics_custom_time_range() -> None:
    cli = _make_monitoring_cli()
    custom_range = timedelta(hours=1)
    result = cli.get_metrics("execution-service", time_range=custom_range)
    assert result["time_range"] == str(custom_range)


@pytest.mark.unit
def test_monitoring_get_metrics_default_time_range() -> None:
    cli = _make_monitoring_cli()
    result = cli.get_metrics("execution-service")
    assert result["time_range"] == str(cli.metrics_window)


@pytest.mark.unit
def test_monitoring_get_logs_all_severity() -> None:
    cli = _make_monitoring_cli()
    logs = cli.get_logs("strategy-service", severity="all")
    assert isinstance(logs, list)
    assert len(logs) > 0


@pytest.mark.unit
def test_monitoring_get_logs_filtered_severity() -> None:
    cli = _make_monitoring_cli()
    logs = cli.get_logs("strategy-service", severity="error")
    assert all("ERROR" in log for log in logs)


@pytest.mark.unit
def test_monitoring_get_logs_warning_filter() -> None:
    cli = _make_monitoring_cli()
    logs = cli.get_logs("strategy-service", severity="warning")
    assert all("WARNING" in log for log in logs)


@pytest.mark.unit
def test_monitoring_get_logs_lines_limit() -> None:
    cli = _make_monitoring_cli()
    # Request only 2 lines
    logs = cli.get_logs("strategy-service", severity="all", lines=2)
    assert len(logs) <= 2


@pytest.mark.unit
def test_monitoring_set_alert_returns_true() -> None:
    cli = _make_monitoring_cli()
    result = cli.set_alert("market-data-service", metric="cpu_usage", threshold=80.0)
    assert result is True


@pytest.mark.unit
def test_monitoring_set_alert_with_action() -> None:
    cli = _make_monitoring_cli()
    result = cli.set_alert(
        "market-data-service", metric="memory_usage", threshold=90.0, action="scale"
    )
    assert result is True


# ===========================================================================
# ReportingCLI
# ===========================================================================


@pytest.mark.unit
def test_reporting_cli_init_creates_report_dir(tmp_path: Path) -> None:
    with patch("deployment_service.cli_modules.reporting.Path") as mock_path_cls:
        mock_cwd = MagicMock()
        mock_dir = tmp_path / "reports"
        mock_path_cls.cwd.return_value = mock_cwd
        mock_cwd.__truediv__ = MagicMock(return_value=mock_dir)
        cli = ReportingCLI()
    # Just check report_dir is a Path-like object
    assert hasattr(cli, "report_dir")


@pytest.mark.unit
def test_reporting_get_all_services() -> None:
    with (
        patch.object(Path, "mkdir"),
        patch("deployment_service.cli_modules.reporting.Path") as mock_path_cls,
    ):
        mock_cwd = MagicMock()
        mock_path_cls.cwd.return_value = mock_cwd
        mock_cwd.__truediv__ = MagicMock(return_value=MagicMock())
        reporting = ReportingCLI()
    services = reporting._get_all_services()
    assert isinstance(services, list)
    assert len(services) == 5


@pytest.mark.unit
def test_reporting_get_service_deployment_info(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    info = reporting._get_service_deployment_info("instruments-service")
    assert info["status"] == "deployed"
    assert "version" in info
    assert "shards" in info
    assert "replicas" in info


@pytest.mark.unit
def test_reporting_get_service_performance_metrics(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    metrics = reporting._get_service_performance_metrics("instruments-service", timedelta(days=7))
    assert "uptime" in metrics
    assert "avg_response_time" in metrics
    assert "error_rate" in metrics


@pytest.mark.unit
def test_reporting_calculate_service_cost(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    cost = reporting._calculate_service_cost("instruments-service", timedelta(days=30))
    assert "compute" in cost
    assert "storage" in cost
    assert "network" in cost
    assert "other" in cost
    assert "total" in cost
    total = float(cast(float, cost["total"]))
    assert total > 0


@pytest.mark.unit
def test_reporting_calculate_deployment_summary(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    services: dict[str, dict[str, object]] = {
        "svc-a": {"status": "deployed", "shards": 5, "replicas": 3},
        "svc-b": {"status": "deployed", "shards": 10, "replicas": 2},
        "svc-c": {"status": "failed", "shards": 0, "replicas": 0},
    }
    summary = reporting._calculate_deployment_summary(services)
    assert summary["total_services"] == 3
    assert summary["deployed_services"] == 2
    assert summary["total_shards"] == 15
    assert summary["total_replicas"] == 5


@pytest.mark.unit
def test_reporting_calculate_aggregate_performance(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    services: dict[str, dict[str, object]] = {
        "svc-a": {"requests_processed": 1_000_000, "errors": 500, "uptime": "99.9%"},
        "svc-b": {"requests_processed": 2_000_000, "errors": 100, "uptime": "99.5%"},
    }
    agg = reporting._calculate_aggregate_performance(services)
    assert agg["total_requests"] == 3_000_000
    assert agg["total_errors"] == 600
    assert "overall_error_rate" in agg
    assert "average_uptime" in agg


@pytest.mark.unit
def test_reporting_calculate_aggregate_performance_zero_requests(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    services: dict[str, dict[str, object]] = {
        "svc-a": {"requests_processed": 0, "errors": 0, "uptime": "100%"},
    }
    agg = reporting._calculate_aggregate_performance(services)
    assert agg["overall_error_rate"] == "0%"


@pytest.mark.unit
def test_reporting_calculate_cost_breakdown(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    services: dict[str, dict[str, object]] = {
        "svc-a": {"compute": 100.0, "storage": 20.0, "network": 15.0, "other": 5.0},
        "svc-b": {"compute": 200.0, "storage": 40.0, "network": 30.0, "other": 10.0},
    }
    breakdown = reporting._calculate_cost_breakdown(services)
    assert float(cast(float, breakdown["compute"])) == 300.0
    assert float(cast(float, breakdown["storage"])) == 60.0
    assert float(cast(float, breakdown["network"])) == 45.0
    assert float(cast(float, breakdown["other"])) == 15.0


@pytest.mark.unit
def test_reporting_generate_deployment_report_single_service(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report = reporting.generate_deployment_report(service="instruments-service")
    assert report["title"] == "Deployment Report"
    services = cast(dict[str, object], report["services"])
    assert "instruments-service" in services
    assert "summary" in report


@pytest.mark.unit
def test_reporting_generate_deployment_report_all_services(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report = reporting.generate_deployment_report()
    services = cast(dict[str, object], report["services"])
    assert len(services) == 5


@pytest.mark.unit
def test_reporting_generate_deployment_report_with_json_file(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    output_file = str(tmp_path / "deployment_report.json")
    reporting.generate_deployment_report(
        service="instruments-service", format="json", output_file=output_file
    )
    assert Path(output_file).exists()
    with open(output_file) as f:
        saved = json.load(f)
    assert saved["title"] == "Deployment Report"


@pytest.mark.unit
def test_reporting_generate_performance_report_single_service(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report = reporting.generate_performance_report(service="execution-service")
    assert report["title"] == "Performance Report"
    services = cast(dict[str, object], report["services"])
    assert "execution-service" in services
    assert "aggregate" in report


@pytest.mark.unit
def test_reporting_generate_performance_report_all_services(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report = reporting.generate_performance_report()
    services = cast(dict[str, object], report["services"])
    assert len(services) == 5


@pytest.mark.unit
def test_reporting_generate_performance_report_custom_time_range(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    custom_range = timedelta(days=14)
    report = reporting.generate_performance_report(time_range=custom_range)
    assert report["time_range"] == str(custom_range)


@pytest.mark.unit
def test_reporting_generate_performance_report_default_time_range(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report = reporting.generate_performance_report()
    # default is 7 days
    assert report["time_range"] == str(timedelta(days=7))


@pytest.mark.unit
def test_reporting_generate_cost_report_single_service(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report = reporting.generate_cost_report(service="risk-service")
    assert report["title"] == "Cost Report"
    assert report["currency"] == "USD"
    services = cast(dict[str, object], report["services"])
    assert "risk-service" in services
    total = float(cast(float, report["total_cost"]))
    assert total > 0


@pytest.mark.unit
def test_reporting_generate_cost_report_all_services(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report = reporting.generate_cost_report()
    services = cast(dict[str, object], report["services"])
    assert len(services) == 5


@pytest.mark.unit
def test_reporting_generate_cost_report_default_time_range(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report = reporting.generate_cost_report()
    assert report["time_range"] == str(timedelta(days=30))


@pytest.mark.unit
def test_reporting_save_report_json(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report: dict[str, object] = {"title": "Test", "generated_at": "2024-01-01", "services": {}}
    output_file = str(tmp_path / "test.json")
    reporting._save_report(report, output_file, "json")
    assert Path(output_file).exists()
    with open(output_file) as f:
        loaded = json.load(f)
    assert loaded["title"] == "Test"


@pytest.mark.unit
def test_reporting_save_report_markdown(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report: dict[str, object] = {
        "title": "Test Markdown Report",
        "generated_at": "2024-01-01",
        "summary": {"total_services": 5, "deployed_services": 5},
        "services": {
            "svc-a": {
                "status": "deployed",
                "version": "1.0",
                "resources": {"cpu": "4 cores"},
            }
        },
    }
    output_file = str(tmp_path / "test.md")
    reporting._save_report(report, output_file, "markdown")
    assert Path(output_file).exists()
    content = Path(output_file).read_text()
    assert "Test Markdown Report" in content
    assert "## Summary" in content
    assert "## Services" in content


@pytest.mark.unit
def test_reporting_save_report_csv(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    report: dict[str, object] = {
        "title": "Test CSV Report",
        "generated_at": "2024-01-01",
        "services": {
            "svc-a": {"status": "deployed", "version": "1.0"},
        },
    }
    output_file = str(tmp_path / "test.csv")
    reporting._save_report(report, output_file, "csv")
    assert Path(output_file).exists()
    with open(output_file, newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)
    assert rows[0] == ["Service", "Metric", "Value"]
    assert len(rows) > 1


@pytest.mark.unit
def test_reporting_save_report_unknown_format_no_write(tmp_path: Path) -> None:
    """Unknown format — no file written, no exception."""
    reporting = _make_reporting_cli(tmp_path)
    report: dict[str, object] = {"title": "Test", "generated_at": "2024-01-01", "services": {}}
    output_file = str(tmp_path / "test.xml")
    reporting._save_report(report, output_file, "xml")
    # File should NOT exist for unknown format
    assert not Path(output_file).exists()


@pytest.mark.unit
def test_reporting_save_markdown_report_no_summary_section(tmp_path: Path) -> None:
    """Markdown report without summary key writes services only."""
    reporting = _make_reporting_cli(tmp_path)
    report: dict[str, object] = {
        "title": "No Summary",
        "generated_at": "2024-01-01",
        "services": {"svc-a": {"status": "deployed"}},
    }
    output_file = tmp_path / "nosummary.md"
    reporting._save_markdown_report(report, output_file)
    content = output_file.read_text()
    assert "## Summary" not in content
    assert "svc-a" in content


@pytest.mark.unit
def test_reporting_save_csv_no_services(tmp_path: Path) -> None:
    """CSV report with no services writes header only."""
    reporting = _make_reporting_cli(tmp_path)
    report: dict[str, object] = {
        "title": "Empty",
        "generated_at": "2024-01-01",
    }
    output_file = tmp_path / "empty.csv"
    reporting._save_csv_report(report, output_file)
    with open(output_file, newline="") as f:
        rows = list(csv.reader(f))
    assert rows[0] == ["Service", "Metric", "Value"]
    assert len(rows) == 1


@pytest.mark.unit
def test_reporting_generate_deployment_report_with_markdown_file(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    output_file = str(tmp_path / "deployment.md")
    reporting.generate_deployment_report(
        service="instruments-service", format="markdown", output_file=output_file
    )
    assert Path(output_file).exists()


@pytest.mark.unit
def test_reporting_generate_performance_report_with_output_file(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    output_file = str(tmp_path / "perf.json")
    reporting.generate_performance_report(
        service="execution-service", format="json", output_file=output_file
    )
    assert Path(output_file).exists()


@pytest.mark.unit
def test_reporting_generate_cost_report_with_output_file(tmp_path: Path) -> None:
    reporting = _make_reporting_cli(tmp_path)
    output_file = str(tmp_path / "cost.json")
    reporting.generate_cost_report(service="risk-service", format="json", output_file=output_file)
    assert Path(output_file).exists()
