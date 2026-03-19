"""Reporting CLI module for generating deployment and performance reports."""

import csv
import json
import logging
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import cast

from deployment_service.cli_modules.base import BaseCLI

logger = logging.getLogger(__name__)


class ReportingCLI(BaseCLI):
    """Handle reporting operations for unified trading services."""

    def __init__(self):
        """Initialize reporting CLI."""
        super().__init__()
        self.report_dir = Path.cwd() / "reports"
        self.report_dir.mkdir(exist_ok=True)

    def generate_deployment_report(
        self, service: str | None = None, format: str = "json", output_file: str | None = None
    ) -> dict[str, object]:
        """Generate deployment report for services.

        Args:
            service: Specific service or None for all
            format: Output format (json, csv, markdown)
            output_file: Output file path

        Returns:
            Report data dictionary
        """
        logger.info("Generating deployment report for %s", service or "all services")

        report_services: dict[str, dict[str, object]] = {}
        report: dict[str, object] = {
            "title": "Deployment Report",
            "generated_at": datetime.now(UTC).isoformat(),
            "services": report_services,
        }

        services = [service] if service else self._get_all_services()

        for svc in services:
            report_services[svc] = self._get_service_deployment_info(svc)

        # Calculate summary statistics
        report["summary"] = self._calculate_deployment_summary(report_services)

        # Save report if output file specified
        if output_file:
            self._save_report(report, output_file, format)

        return report

    def generate_performance_report(
        self,
        service: str | None = None,
        time_range: timedelta | None = None,
        format: str = "json",
        output_file: str | None = None,
    ) -> dict[str, object]:
        """Generate performance report for services.

        Args:
            service: Specific service or None for all
            time_range: Time range for report
            format: Output format
            output_file: Output file path

        Returns:
            Performance report dictionary
        """
        logger.info("Generating performance report for %s", service or "all services")

        time_range = time_range or timedelta(days=7)

        perf_services: dict[str, dict[str, object]] = {}
        report: dict[str, object] = {
            "title": "Performance Report",
            "generated_at": datetime.now(UTC).isoformat(),
            "time_range": str(time_range),
            "services": perf_services,
        }

        services = [service] if service else self._get_all_services()

        for svc in services:
            perf_services[svc] = self._get_service_performance_metrics(svc, time_range)

        # Calculate aggregate metrics
        report["aggregate"] = self._calculate_aggregate_performance(perf_services)

        # Save report if output file specified
        if output_file:
            self._save_report(report, output_file, format)

        return report

    def generate_cost_report(
        self,
        service: str | None = None,
        time_range: timedelta | None = None,
        format: str = "json",
        output_file: str | None = None,
    ) -> dict[str, object]:
        """Generate cost report for services.

        Args:
            service: Specific service or None for all
            time_range: Time range for report
            format: Output format
            output_file: Output file path

        Returns:
            Cost report dictionary
        """
        logger.info("Generating cost report for %s", service or "all services")

        time_range = time_range or timedelta(days=30)

        cost_services: dict[str, dict[str, object]] = {}
        report: dict[str, object] = {
            "title": "Cost Report",
            "generated_at": datetime.now(UTC).isoformat(),
            "time_range": str(time_range),
            "currency": "USD",
            "services": cost_services,
        }

        services = [service] if service else self._get_all_services()

        total_cost = 0.0
        for svc in services:
            service_cost = self._calculate_service_cost(svc, time_range)
            cost_services[svc] = service_cost
            total_cost += float(cast(float, service_cost["total"]))

        report["total_cost"] = total_cost
        report["cost_breakdown"] = self._calculate_cost_breakdown(cost_services)

        # Save report if output file specified
        if output_file:
            self._save_report(report, output_file, format)

        return report

    def _get_all_services(self) -> list[str]:
        """Get list of all services."""
        return [
            "instruments-service",
            "market-data-service",
            "execution-service",
            "risk-service",
            "strategy-service",
        ]

    def _get_service_deployment_info(self, service: str) -> dict[str, object]:
        """Get deployment information for a service."""
        # This would query actual deployment data
        return {
            "status": "deployed",
            "version": "1.0.0",
            "environment": "production",
            "shards": 10,
            "replicas": 3,
            "last_deployed": (datetime.now(UTC) - timedelta(days=2)).isoformat(),
            "deployment_duration": "5m 23s",
            "resources": {"cpu": "4 cores", "memory": "8 GB", "storage": "50 GB"},
        }

    def _get_service_performance_metrics(
        self, service: str, time_range: timedelta
    ) -> dict[str, object]:
        """Get performance metrics for a service."""
        # This would query actual metrics
        return {
            "uptime": "99.95%",
            "avg_response_time": "125ms",
            "p95_response_time": "450ms",
            "p99_response_time": "850ms",
            "requests_processed": 15_000_000,
            "errors": 3_000,
            "error_rate": "0.02%",
            "peak_rps": 2_500,
            "avg_rps": 1_250,
        }

    def _calculate_service_cost(self, service: str, time_range: timedelta) -> dict[str, object]:
        """Calculate cost for a service."""
        # This would query actual billing data
        days = time_range.days
        daily_cost = 125.50  # Example daily cost

        return {
            "compute": daily_cost * days * 0.6,
            "storage": daily_cost * days * 0.2,
            "network": daily_cost * days * 0.15,
            "other": daily_cost * days * 0.05,
            "total": daily_cost * days,
        }

    def _calculate_deployment_summary(
        self, services: dict[str, dict[str, object]]
    ) -> dict[str, object]:
        """Calculate deployment summary statistics."""
        total_services = len(services)
        deployed = sum(1 for s in services.values() if s["status"] == "deployed")
        total_shards = sum(int(cast(int, s.get("shards") or 0)) for s in services.values())
        total_replicas = sum(int(cast(int, s.get("replicas") or 0)) for s in services.values())

        return {
            "total_services": total_services,
            "deployed_services": deployed,
            "total_shards": total_shards,
            "total_replicas": total_replicas,
            "deployment_success_rate": f"{(deployed / total_services) * 100:.1f}%",
        }

    def _calculate_aggregate_performance(
        self, services: dict[str, dict[str, object]]
    ) -> dict[str, object]:
        """Calculate aggregate performance metrics."""
        total_requests = sum(
            int(cast(int, s.get("requests_processed") or 0)) for s in services.values()
        )
        total_errors = sum(int(cast(int, s.get("errors") or 0)) for s in services.values())

        avg_uptime = sum(
            float(str(s.get("uptime") or "0%").rstrip("%")) for s in services.values()
        ) / len(services)

        result: dict[str, object] = {
            "total_requests": total_requests,
            "total_errors": total_errors,
            "overall_error_rate": f"{(total_errors / total_requests) * 100:.3f}%"
            if total_requests > 0
            else "0%",
            "average_uptime": f"{avg_uptime:.2f}%",
        }
        return result

    def _calculate_cost_breakdown(
        self, services: dict[str, dict[str, object]]
    ) -> dict[str, object]:
        """Calculate cost breakdown by category."""
        breakdown: dict[str, float] = {"compute": 0.0, "storage": 0.0, "network": 0.0, "other": 0.0}

        for service in services.values():
            for category in breakdown:
                breakdown[category] += float(cast(float, service.get(category) or 0.0))

        result: dict[str, object] = dict(breakdown)
        return result

    def _save_report(self, report: dict[str, object], output_file: str, format: str):
        """Save report to file in specified format."""
        output_path = Path(output_file)

        if format == "json":
            with open(output_path, "w") as f:
                json.dump(report, f, indent=2)
        elif format == "markdown":
            self._save_markdown_report(report, output_path)
        elif format == "csv":
            self._save_csv_report(report, output_path)

        logger.info("Report saved to %s", output_path)

    def _save_markdown_report(self, report: dict[str, object], output_path: Path):
        """Save report as markdown."""
        with open(output_path, "w") as f:
            f.write(f"# {report['title']}\n\n")
            f.write(f"Generated: {report['generated_at']}\n\n")

            # Write summary section
            if "summary" in report:
                f.write("## Summary\n\n")
                summary_data = cast(dict[str, object], report["summary"])
                for key, value in summary_data.items():
                    f.write(f"- **{key.replace('_', ' ').title()}**: {value}\n")
                f.write("\n")

            # Write services section
            if "services" in report:
                f.write("## Services\n\n")
                services_data = cast(dict[str, dict[str, object]], report["services"])
                for service, data in services_data.items():
                    f.write(f"### {service}\n\n")
                    for key, value in data.items():
                        if isinstance(value, dict):
                            value_dict = cast(dict[str, object], value)
                            f.write(f"**{key.replace('_', ' ').title()}**:\n")
                            for k, v in value_dict.items():
                                f.write(f"  - {k}: {v}\n")
                        else:
                            f.write(f"- **{key.replace('_', ' ').title()}**: {value}\n")
                    f.write("\n")

    def _save_csv_report(self, report: dict[str, object], output_path: Path):
        """Save report as CSV."""
        with open(output_path, "w", newline="") as f:
            writer = csv.writer(f)

            # Write header
            writer.writerow(["Service", "Metric", "Value"])

            # Write data rows
            services_data = cast(dict[str, dict[str, object]], report.get("services") or {})
            for service, data in services_data.items():
                for key, value in data.items():
                    if not isinstance(value, dict):
                        writer.writerow([service, key, value])
