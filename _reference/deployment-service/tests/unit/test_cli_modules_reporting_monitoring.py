"""Unit tests for cli_modules/reporting.py and cli_modules/monitoring.py."""

from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

import pytest

from deployment_service.cli_modules.monitoring import MonitoringCLI
from deployment_service.cli_modules.reporting import ReportingCLI

# ---------------------------------------------------------------------------
# ReportingCLI
# ---------------------------------------------------------------------------


@pytest.fixture
def reporting_cli(tmp_path: Path) -> ReportingCLI:
    with patch("deployment_service.cli_modules.base.Path.cwd", return_value=tmp_path):
        cli = ReportingCLI()
    return cli


@pytest.mark.unit
def test_reporting_cli_init(reporting_cli: ReportingCLI) -> None:
    assert isinstance(reporting_cli.report_dir, Path)


@pytest.mark.unit
def test_generate_deployment_report_all_services(reporting_cli: ReportingCLI) -> None:
    report = reporting_cli.generate_deployment_report()
    assert report["title"] == "Deployment Report"
    assert "generated_at" in report
    assert "services" in report
    assert "summary" in report
    services = report["services"]
    assert isinstance(services, dict)
    assert len(services) > 0


@pytest.mark.unit
def test_generate_deployment_report_single_service(reporting_cli: ReportingCLI) -> None:
    report = reporting_cli.generate_deployment_report(service="instruments-service")
    services = report["services"]
    assert isinstance(services, dict)
    assert "instruments-service" in services
    assert len(services) == 1


@pytest.mark.unit
def test_generate_deployment_report_summary_fields(reporting_cli: ReportingCLI) -> None:
    report = reporting_cli.generate_deployment_report()
    summary = report["summary"]
    assert isinstance(summary, dict)
    assert "total_services" in summary
    assert "deployed_services" in summary
    assert "total_shards" in summary


@pytest.mark.unit
def test_generate_deployment_report_saves_json(reporting_cli: ReportingCLI, tmp_path: Path) -> None:
    output = str(tmp_path / "report.json")
    reporting_cli.generate_deployment_report(output_file=output, format="json")
    assert Path(output).exists()
    with open(output) as f:
        data = json.load(f)
    assert data["title"] == "Deployment Report"


@pytest.mark.unit
def test_generate_deployment_report_saves_markdown(
    reporting_cli: ReportingCLI, tmp_path: Path
) -> None:
    output = str(tmp_path / "report.md")
    reporting_cli.generate_deployment_report(output_file=output, format="markdown")
    content = Path(output).read_text()
    assert "# Deployment Report" in content
    assert "## Summary" in content
    assert "## Services" in content


@pytest.mark.unit
def test_generate_deployment_report_saves_csv(reporting_cli: ReportingCLI, tmp_path: Path) -> None:
    output = str(tmp_path / "report.csv")
    reporting_cli.generate_deployment_report(output_file=output, format="csv")
    content = Path(output).read_text()
    assert "Service,Metric,Value" in content


@pytest.mark.unit
def test_generate_performance_report_all_services(reporting_cli: ReportingCLI) -> None:
    report = reporting_cli.generate_performance_report()
    assert report["title"] == "Performance Report"
    assert "aggregate" in report
    assert "services" in report
    assert "time_range" in report


@pytest.mark.unit
def test_generate_performance_report_single_service(reporting_cli: ReportingCLI) -> None:
    report = reporting_cli.generate_performance_report(
        service="execution-service", time_range=timedelta(days=1)
    )
    services = report["services"]
    assert isinstance(services, dict)
    assert "execution-service" in services
    assert len(services) == 1


@pytest.mark.unit
def test_generate_performance_report_aggregate(reporting_cli: ReportingCLI) -> None:
    report = reporting_cli.generate_performance_report()
    agg = report["aggregate"]
    assert isinstance(agg, dict)
    assert "total_requests" in agg
    assert "total_errors" in agg
    assert "overall_error_rate" in agg
    assert "average_uptime" in agg


@pytest.mark.unit
def test_generate_performance_report_saves_file(
    reporting_cli: ReportingCLI, tmp_path: Path
) -> None:
    output = str(tmp_path / "perf.json")
    reporting_cli.generate_performance_report(output_file=output)
    assert Path(output).exists()


@pytest.mark.unit
def test_generate_cost_report_all_services(reporting_cli: ReportingCLI) -> None:
    report = reporting_cli.generate_cost_report()
    assert report["title"] == "Cost Report"
    assert "total_cost" in report
    assert "cost_breakdown" in report
    assert isinstance(report["total_cost"], float)
    assert report["total_cost"] > 0


@pytest.mark.unit
def test_generate_cost_report_single_service(reporting_cli: ReportingCLI) -> None:
    report = reporting_cli.generate_cost_report(
        service="risk-service", time_range=timedelta(days=7)
    )
    services = report["services"]
    assert isinstance(services, dict)
    assert "risk-service" in services


@pytest.mark.unit
def test_generate_cost_report_breakdown_fields(reporting_cli: ReportingCLI) -> None:
    report = reporting_cli.generate_cost_report()
    breakdown = report["cost_breakdown"]
    assert isinstance(breakdown, dict)
    assert "compute" in breakdown
    assert "storage" in breakdown
    assert "network" in breakdown
    assert "other" in breakdown


@pytest.mark.unit
def test_generate_cost_report_saves_file(reporting_cli: ReportingCLI, tmp_path: Path) -> None:
    output = str(tmp_path / "cost.json")
    reporting_cli.generate_cost_report(output_file=output)
    assert Path(output).exists()


@pytest.mark.unit
def test_get_all_services_returns_list(reporting_cli: ReportingCLI) -> None:
    services = reporting_cli._get_all_services()
    assert isinstance(services, list)
    assert len(services) > 0
    assert all(isinstance(s, str) for s in services)


@pytest.mark.unit
def test_get_service_deployment_info(reporting_cli: ReportingCLI) -> None:
    info = reporting_cli._get_service_deployment_info("instruments-service")
    assert info["status"] == "deployed"
    assert "version" in info
    assert "resources" in info


@pytest.mark.unit
def test_get_service_performance_metrics(reporting_cli: ReportingCLI) -> None:
    metrics = reporting_cli._get_service_performance_metrics("execution-service", timedelta(days=1))
    assert "uptime" in metrics
    assert "avg_response_time" in metrics
    assert "requests_processed" in metrics


@pytest.mark.unit
def test_calculate_service_cost(reporting_cli: ReportingCLI) -> None:
    cost = reporting_cli._calculate_service_cost("strategy-service", timedelta(days=7))
    assert "total" in cost
    assert "compute" in cost
    assert float(cost["total"]) > 0


@pytest.mark.unit
def test_calculate_deployment_summary_all_deployed(reporting_cli: ReportingCLI) -> None:
    services = {
        "svc-a": {"status": "deployed", "shards": 5, "replicas": 2},
        "svc-b": {"status": "deployed", "shards": 3, "replicas": 1},
    }
    summary = reporting_cli._calculate_deployment_summary(services)
    assert summary["total_services"] == 2
    assert summary["deployed_services"] == 2
    assert summary["total_shards"] == 8
    assert summary["total_replicas"] == 3


@pytest.mark.unit
def test_calculate_deployment_summary_partial(reporting_cli: ReportingCLI) -> None:
    services = {
        "svc-a": {"status": "deployed", "shards": 5, "replicas": 2},
        "svc-b": {"status": "failed", "shards": 0, "replicas": 0},
    }
    summary = reporting_cli._calculate_deployment_summary(services)
    assert summary["deployed_services"] == 1


@pytest.mark.unit
def test_calculate_aggregate_performance(reporting_cli: ReportingCLI) -> None:
    services = {
        "svc-a": {"requests_processed": 1000, "errors": 10, "uptime": "99.9%"},
        "svc-b": {"requests_processed": 2000, "errors": 20, "uptime": "98.5%"},
    }
    agg = reporting_cli._calculate_aggregate_performance(services)
    assert agg["total_requests"] == 3000
    assert agg["total_errors"] == 30


@pytest.mark.unit
def test_calculate_aggregate_performance_zero_requests(reporting_cli: ReportingCLI) -> None:
    services: dict[str, dict[str, object]] = {
        "svc-a": {"requests_processed": 0, "errors": 0, "uptime": "100%"},
    }
    agg = reporting_cli._calculate_aggregate_performance(services)
    assert agg["overall_error_rate"] == "0%"


@pytest.mark.unit
def test_calculate_cost_breakdown(reporting_cli: ReportingCLI) -> None:
    services = {
        "svc-a": {"compute": 100.0, "storage": 20.0, "network": 10.0, "other": 5.0},
        "svc-b": {"compute": 50.0, "storage": 10.0, "network": 5.0, "other": 2.0},
    }
    breakdown = reporting_cli._calculate_cost_breakdown(services)
    assert breakdown["compute"] == 150.0
    assert breakdown["storage"] == 30.0


@pytest.mark.unit
def test_save_report_unsupported_format_no_error(
    reporting_cli: ReportingCLI, tmp_path: Path
) -> None:
    """Unknown format: no file written, no exception."""
    output = str(tmp_path / "report.xml")
    reporting_cli._save_report({"title": "Test"}, output, format="xml")
    assert not Path(output).exists()


@pytest.mark.unit
def test_save_markdown_nested_dict(reporting_cli: ReportingCLI, tmp_path: Path) -> None:
    report = {
        "title": "Test",
        "generated_at": "2024-01-01",
        "summary": {"key": "value"},
        "services": {
            "svc-a": {
                "status": "deployed",
                "resources": {"cpu": "4 cores"},
            }
        },
    }
    output = tmp_path / "report.md"
    reporting_cli._save_markdown_report(report, output)
    content = output.read_text()
    assert "# Test" in content
    assert "svc-a" in content


# ---------------------------------------------------------------------------
# MonitoringCLI
# ---------------------------------------------------------------------------


@pytest.fixture
def monitoring_cli(tmp_path: Path) -> MonitoringCLI:
    with patch("deployment_service.cli_modules.base.Path.cwd", return_value=tmp_path):
        cli = MonitoringCLI()
    return cli


@pytest.mark.unit
def test_monitoring_cli_init(monitoring_cli: MonitoringCLI) -> None:
    assert monitoring_cli.metrics_window == timedelta(minutes=5)


@pytest.mark.unit
def test_check_health_single_service(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.check_health(service="execution-service")
    assert result["service"] == "execution-service"
    assert result["status"] == "healthy"
    assert "endpoints" in result
    assert "metrics" in result


@pytest.mark.unit
def test_check_health_all_services(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.check_health()
    assert "overall_status" in result
    assert "services" in result
    assert "timestamp" in result
    services = result["services"]
    assert isinstance(services, dict)
    assert len(services) > 0


@pytest.mark.unit
def test_check_health_overall_healthy(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.check_health()
    assert result["overall_status"] == "healthy"


@pytest.mark.unit
def test_check_service_health_returns_last_check(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli._check_service_health("risk-service")
    assert "last_check" in result
    assert "uptime" in result


@pytest.mark.unit
def test_get_all_services(monitoring_cli: MonitoringCLI) -> None:
    services = monitoring_cli._get_all_services()
    assert isinstance(services, list)
    assert len(services) >= 5


@pytest.mark.unit
def test_log_health_status_healthy(monitoring_cli: MonitoringCLI) -> None:
    status: dict[str, object] = {
        "service": "instruments-service",
        "status": "healthy",
        "metrics": {
            "cpu_usage": "30%",
            "memory_usage": "50%",
            "request_rate": "100/s",
            "error_rate": "0%",
        },
    }
    # Should not raise
    monitoring_cli._log_health_status(status)


@pytest.mark.unit
def test_log_health_status_degraded(monitoring_cli: MonitoringCLI) -> None:
    status: dict[str, object] = {"service": "market-data-service", "status": "degraded"}
    monitoring_cli._log_health_status(status)


@pytest.mark.unit
def test_log_health_status_unhealthy(monitoring_cli: MonitoringCLI) -> None:
    status: dict[str, object] = {"service": "strategy-service", "status": "unhealthy"}
    monitoring_cli._log_health_status(status)


@pytest.mark.unit
def test_log_health_status_no_metrics(monitoring_cli: MonitoringCLI) -> None:
    status: dict[str, object] = {"service": "svc", "status": "healthy"}
    monitoring_cli._log_health_status(status)


@pytest.mark.unit
def test_get_metrics_all(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.get_metrics("execution-service")
    assert result["service"] == "execution-service"
    data = result["data"]
    assert isinstance(data, dict)
    assert "performance" in data
    assert "errors" in data
    assert "resources" in data


@pytest.mark.unit
def test_get_metrics_performance_only(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.get_metrics("execution-service", metric_type="performance")
    data = result["data"]
    assert "performance" in data
    assert "errors" not in data
    assert "resources" not in data


@pytest.mark.unit
def test_get_metrics_errors_only(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.get_metrics("risk-service", metric_type="errors")
    data = result["data"]
    assert "errors" in data
    assert "performance" not in data


@pytest.mark.unit
def test_get_metrics_resources_only(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.get_metrics("strategy-service", metric_type="resources")
    data = result["data"]
    assert "resources" in data
    assert "performance" not in data


@pytest.mark.unit
def test_get_metrics_custom_time_range(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.get_metrics("svc", time_range=timedelta(hours=1))
    assert "1:00:00" in result["time_range"]


@pytest.mark.unit
def test_get_metrics_unknown_type_empty_data(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.get_metrics("svc", metric_type="unknown")
    assert result["data"] == {}


@pytest.mark.unit
def test_get_logs_all_severity(monitoring_cli: MonitoringCLI) -> None:
    logs = monitoring_cli.get_logs("execution-service")
    assert isinstance(logs, list)
    assert len(logs) > 0
    assert all(isinstance(line, str) for line in logs)


@pytest.mark.unit
def test_get_logs_filter_error(monitoring_cli: MonitoringCLI) -> None:
    logs = monitoring_cli.get_logs("execution-service", severity="error")
    assert all("ERROR" in line for line in logs)


@pytest.mark.unit
def test_get_logs_filter_warning(monitoring_cli: MonitoringCLI) -> None:
    logs = monitoring_cli.get_logs("execution-service", severity="warning")
    assert all("WARNING" in line for line in logs)


@pytest.mark.unit
def test_get_logs_filter_info(monitoring_cli: MonitoringCLI) -> None:
    logs = monitoring_cli.get_logs("execution-service", severity="info")
    assert all("INFO" in line for line in logs)


@pytest.mark.unit
def test_get_logs_lines_limit(monitoring_cli: MonitoringCLI) -> None:
    logs = monitoring_cli.get_logs("execution-service", lines=2)
    assert len(logs) <= 2


@pytest.mark.unit
def test_set_alert_success(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.set_alert("execution-service", "cpu_usage", threshold=80.0)
    assert result is True


@pytest.mark.unit
def test_set_alert_with_action(monitoring_cli: MonitoringCLI) -> None:
    result = monitoring_cli.set_alert(
        "risk-service", "memory_usage", threshold=90.0, action="scale"
    )
    assert result is True


@pytest.mark.unit
def test_check_all_services_health_counts_unhealthy(monitoring_cli: MonitoringCLI) -> None:
    """Patch _check_service_health to return unhealthy for one service."""
    call_count = 0
    original = monitoring_cli._check_service_health

    def patched(service: str) -> dict[str, object]:
        nonlocal call_count
        call_count += 1
        result = original(service)
        if call_count == 1:
            result = dict(result)
            result["status"] = "unhealthy"
        return result

    monitoring_cli._check_service_health = patched  # type: ignore[method-assign]
    report = monitoring_cli._check_all_services_health()
    assert report["overall_status"] in {"degraded", "unhealthy"}
