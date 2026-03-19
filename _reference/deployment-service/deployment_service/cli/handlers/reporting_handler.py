"""Reporting command handlers."""

import json
import logging
from datetime import UTC, datetime, timedelta
from typing import cast

import click

from ...services.deployment_service import DeploymentService
from ...services.log_service import LogService
from ...services.status_service import StatusService

logger = logging.getLogger(__name__)


class ReportingHandler:
    """Handler for reporting and analysis CLI commands."""

    def __init__(self, ctx: click.Context):
        """Initialize reporting handler.

        Args:
            ctx: Click context with configuration
        """
        self.ctx = ctx
        ctx_obj = cast("dict[str, object]", ctx.obj)
        self.config_dir = cast("str | None", ctx_obj.get("config_dir"))
        self.project_id = cast("str | None", ctx_obj.get("project_id"))

        # Initialize services
        self.deployment_service = DeploymentService(self.config_dir)
        self.status_service = StatusService(self.project_id)
        self.log_service = LogService(self.project_id)

    def handle_report(
        self,
        output_format: str = "text",
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        service_filter: str | None = None,
        include_details: bool = False,
    ) -> None:
        """Handle report generation command.

        Args:
            output_format: Output format (text, json, csv)
            start_date: Report start date
            end_date: Report end date
            service_filter: Filter by service
            include_details: Include detailed information
        """
        try:
            # Set default date range if not provided
            if not end_date:
                end_date = datetime.now(UTC)
            if not start_date:
                start_date = end_date - timedelta(days=7)  # Last 7 days

            click.echo("Generating deployment report...")
            click.echo(f"Date range: {start_date.date()} to {end_date.date()}")

            if service_filter:
                click.echo(f"Service filter: {service_filter}")

            # Generate report data
            report_data = self._generate_report_data(
                start_date, end_date, service_filter, include_details
            )

            # Output in requested format
            self._output_report(report_data, output_format)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Report generation failed: %s", e)
            raise click.ClickException(f"Report generation failed: {e}") from e

    def _generate_report_data(
        self,
        start_date: datetime,
        end_date: datetime,
        service_filter: str | None,
        include_details: bool,
    ) -> dict[str, object]:
        """Generate report data structure.

        Args:
            start_date: Start date
            end_date: End date
            service_filter: Service filter
            include_details: Include details

        Returns:
            Report data dictionary
        """
        # Get deployments in date range
        deployments = self._get_deployments_in_range(start_date, end_date, service_filter)

        # Generate summary statistics
        summary = self._generate_summary_stats(deployments)

        # Generate service breakdown
        service_breakdown = self._generate_service_breakdown(deployments)

        # Generate daily statistics
        daily_stats = self._generate_daily_stats(deployments, start_date, end_date)

        report_data = {
            "metadata": {
                "generated_at": datetime.now(UTC).isoformat(),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "service_filter": service_filter,
                "total_deployments": len(deployments),
            },
            "summary": summary,
            "service_breakdown": service_breakdown,
            "daily_statistics": daily_stats,
        }

        if include_details:
            report_data["detailed_deployments"] = deployments

        return cast("dict[str, object]", report_data)

    def _get_deployments_in_range(
        self, start_date: datetime, end_date: datetime, service_filter: str | None
    ) -> list[dict[str, object]]:
        """Get deployments within date range.

        Args:
            start_date: Start date
            end_date: End date
            service_filter: Service filter

        Returns:
            List of deployment data
        """
        # Get all deployments (in real implementation, this would filter by date)
        all_deployments = self.status_service.list_deployments(limit=1000)

        # Filter by date range and service
        filtered_deployments = []

        for deployment in all_deployments:
            # Parse deployment date
            created_str = deployment.get("created_at") or ""
            try:
                created_date = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                created_date = created_date.replace(tzinfo=None)  # Remove timezone for comparison
            except (ValueError, TypeError):
                continue  # Skip deployments with invalid dates

            # Check date range
            if not (start_date <= created_date <= end_date):
                continue

            # Check service filter
            if service_filter:
                deployment_service = deployment.get("service") or ""
                if deployment_service != service_filter:
                    continue

            filtered_deployments.append(deployment)

        return filtered_deployments

    def _generate_summary_stats(self, deployments: list[dict[str, object]]) -> dict[str, object]:
        """Generate summary statistics.

        Args:
            deployments: List of deployments

        Returns:
            Summary statistics
        """
        total = len(deployments)

        if total == 0:
            return {
                "total_deployments": 0,
                "successful": 0,
                "failed": 0,
                "running": 0,
                "cancelled": 0,
                "success_rate": 0.0,
            }

        # Count by status
        status_counts = {}
        for deployment in deployments:
            status = deployment.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1

        successful = status_counts.get("completed", 0) + status_counts.get("success", 0)
        failed = status_counts.get("failed", 0)
        running = status_counts.get("running", 0) + status_counts.get("in_progress", 0)
        cancelled = status_counts.get("cancelled", 0)

        success_rate = (successful / total) * 100 if total > 0 else 0

        return {
            "total_deployments": total,
            "successful": successful,
            "failed": failed,
            "running": running,
            "cancelled": cancelled,
            "success_rate": round(success_rate, 2),
            "status_breakdown": status_counts,
        }

    def _generate_service_breakdown(
        self, deployments: list[dict[str, object]]
    ) -> dict[str, object]:
        """Generate service breakdown statistics.

        Args:
            deployments: List of deployments

        Returns:
            Service breakdown data
        """
        service_stats = {}

        for deployment in deployments:
            service = deployment.get("service", "unknown")
            status = deployment.get("status", "unknown")

            if service not in service_stats:
                service_stats[service] = {
                    "total": 0,
                    "successful": 0,
                    "failed": 0,
                    "running": 0,
                    "cancelled": 0,
                }

            service_stats[service]["total"] += 1

            if status in ("completed", "success"):
                service_stats[service]["successful"] += 1
            elif status == "failed":
                service_stats[service]["failed"] += 1
            elif status in ("running", "in_progress"):
                service_stats[service]["running"] += 1
            elif status == "cancelled":
                service_stats[service]["cancelled"] += 1

        # Calculate success rates
        for _service, stats in service_stats.items():
            total = stats["total"]
            successful = stats["successful"]
            stats["success_rate"] = round((successful / total) * 100, 2) if total > 0 else 0

        return service_stats

    def _generate_daily_stats(
        self, deployments: list[dict[str, object]], start_date: datetime, end_date: datetime
    ) -> list[dict[str, object]]:
        """Generate daily deployment statistics.

        Args:
            deployments: List of deployments
            start_date: Start date
            end_date: End date

        Returns:
            Daily statistics list
        """
        daily_stats = []
        current_date = start_date.date()
        end_date_only = end_date.date()

        while current_date <= end_date_only:
            # Count deployments for this day
            day_deployments = []

            for deployment in deployments:
                created_str = deployment.get("created_at") or ""
                try:
                    created_date = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                    if created_date.date() == current_date:
                        day_deployments.append(deployment)
                except (ValueError, TypeError) as e:
                    logger.debug("Skipping item due to %s: %s", type(e).__name__, e)
                    continue

            # Calculate day statistics
            day_stats = {
                "date": current_date.isoformat(),
                "total": len(day_deployments),
                "successful": len(
                    [d for d in day_deployments if d.get("status") in ("completed", "success")]
                ),
                "failed": len([d for d in day_deployments if d.get("status") == "failed"]),
                "running": len(
                    [d for d in day_deployments if d.get("status") in ("running", "in_progress")]
                ),
            }

            daily_stats.append(day_stats)
            current_date += timedelta(days=1)

        return daily_stats

    def _output_report(self, report_data: dict[str, object], output_format: str) -> None:
        """Output report in specified format.

        Args:
            report_data: Report data
            output_format: Output format
        """
        if output_format == "json":
            self._output_json_report(report_data)
        elif output_format == "csv":
            self._output_csv_report(report_data)
        else:  # default to text
            self._output_text_report(report_data)

    def _output_text_report(self, report_data: dict[str, object]) -> None:
        """Output report in text format.

        Args:
            report_data: Report data
        """
        metadata = cast(dict[str, object], report_data["metadata"])
        summary = cast(dict[str, object], report_data["summary"])
        service_breakdown = cast(dict[str, dict[str, object]], report_data["service_breakdown"])

        click.echo("\n" + "=" * 60)
        click.echo("DEPLOYMENT REPORT")
        click.echo("=" * 60)

        # Metadata
        click.echo(f"Generated: {metadata['generated_at']}")
        click.echo(f"Date Range: {metadata['start_date']} to {metadata['end_date']}")
        if metadata.get("service_filter"):
            click.echo(f"Service Filter: {metadata['service_filter']}")

        # Summary
        click.echo("\nSUMMARY")
        click.echo("-" * 20)
        click.echo(f"Total Deployments: {summary['total_deployments']}")
        click.echo(f"Successful: {summary['successful']}")
        click.echo(f"Failed: {summary['failed']}")
        click.echo(f"Running: {summary['running']}")
        click.echo(f"Cancelled: {summary['cancelled']}")
        click.echo(f"Success Rate: {summary['success_rate']}%")

        # Service breakdown
        if service_breakdown:
            click.echo("\nSERVICE BREAKDOWN")
            click.echo("-" * 20)
            click.echo(f"{'Service':<30} {'Total':<8} {'Success':<8} {'Failed':<8} {'Rate':<8}")
            click.echo("-" * 62)

            for service, stats in service_breakdown.items():
                service_name = service[:29] if len(service) > 29 else service
                click.echo(
                    f"{service_name:<30} {stats['total']:<8} "
                    f"{stats['successful']:<8} {stats['failed']:<8} "
                    f"{stats['success_rate']:<8.1f}%"
                )

        # Daily statistics
        daily_stats = cast("list[dict[str, object]]", report_data["daily_statistics"])
        if daily_stats:
            click.echo("\nDAILY STATISTICS")
            click.echo("-" * 20)
            click.echo(f"{'Date':<12} {'Total':<8} {'Success':<8} {'Failed':<8}")
            click.echo("-" * 36)

            for day in daily_stats:
                if int(cast(int, day["total"])) > 0:  # Only show days with activity
                    click.echo(
                        f"{day['date']:<12} {day['total']:<8}"
                        f" {day['successful']:<8} {day['failed']:<8}"
                    )

    def _output_json_report(self, report_data: dict[str, object]) -> None:
        """Output report in JSON format.

        Args:
            report_data: Report data
        """
        click.echo(json.dumps(report_data, indent=2))

    def _output_csv_report(self, report_data: dict[str, object]) -> None:
        """Output report in CSV format.

        Args:
            report_data: Report data
        """
        # Output service breakdown as CSV
        service_breakdown = report_data["service_breakdown"]

        if service_breakdown:
            click.echo("Service,Total,Successful,Failed,Running,Cancelled,Success_Rate")

            for service, stats in service_breakdown.items():
                click.echo(
                    f"{service},{stats['total']},{stats['successful']},"
                    f"{stats['failed']},{stats['running']},{stats['cancelled']},"
                    f"{stats['success_rate']}"
                )

        # Output daily statistics as CSV
        click.echo("\nDate,Total,Successful,Failed,Running")

        daily_stats = cast("list[dict[str, object]]", report_data["daily_statistics"])
        for day in daily_stats:
            if int(cast(int, day["total"])) > 0:
                click.echo(
                    f"{day['date']},{day['total']},{day['successful']},{day['failed']},{day['running']}"
                )

    def handle_versions(self, service: str | None = None) -> None:
        """Handle versions command.

        Args:
            service: Service to get version info for
        """
        try:
            if service:
                self._show_service_version(service)
            else:
                self._show_all_service_versions()

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Version check failed: %s", e)
            raise click.ClickException(f"Version check failed: {e}") from e

    def _show_service_version(self, service: str) -> None:
        """Show version information for a specific service.

        Args:
            service: Service name
        """
        try:
            info = self.deployment_service.get_service_info(service)
            config = cast(dict[str, object], info.get("config") or {})
            metadata = cast(dict[str, object], info.get("metadata") or {})

            click.echo(f"Service: {service}")

            version = metadata.get("version", config.get("version", "unknown"))
            click.echo(f"Version: {version}")

            # Show additional version-related info
            if "docker_image" in config:
                click.echo(f"Docker Image: {config['docker_image']}")

            if "git_commit" in config:
                click.echo(f"Git Commit: {config['git_commit']}")

            if "build_date" in config:
                click.echo(f"Build Date: {config['build_date']}")

        except (OSError, ValueError, RuntimeError) as e:
            click.echo(f"Failed to get version for service {service}: {e}")

    def _show_all_service_versions(self) -> None:
        """Show version information for all services."""
        try:
            services = self.deployment_service.list_available_services()

            if not services:
                click.echo("No services found")
                return

            click.echo(f"{'Service':<30} {'Version':<20} {'Status':<10}")
            click.echo("-" * 60)

            for service in services:
                try:
                    info = self.deployment_service.get_service_info(service)
                    config = info.get("config") or {}
                    metadata = info.get("metadata") or {}

                    version = metadata.get("version", config.get("version", "unknown"))
                    status = "available"

                    # Truncate long service names
                    service_name = service[:29] if len(service) > 29 else service
                    version_str = version[:19] if len(str(version)) > 19 else str(version)

                    click.echo(f"{service_name:<30} {version_str:<20} {status:<10}")

                except (OSError, ValueError, RuntimeError):
                    click.echo(f"{service[:29]:<30} {'error':<20} {'unavailable':<10}")

        except (OSError, ValueError, RuntimeError) as e:
            click.echo(f"Failed to list service versions: {e}")

    def handle_data_flow(self, category: str | None = None, output: str = "text") -> None:
        """Handle data flow analysis command.

        Args:
            category: Category to analyze
            output: Output format
        """
        try:
            click.echo("Analyzing data flow...")

            if category:
                click.echo(f"Category: {category}")

            # Get data flow information
            flow_data = self._analyze_data_flow(category)

            # Output results
            self._output_data_flow(flow_data, output)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Data flow analysis failed: %s", e)
            raise click.ClickException(f"Data flow analysis failed: {e}") from e

    def _analyze_data_flow(self, category: str | None) -> dict[str, object]:
        """Analyze data flow patterns.

        Args:
            category: Category filter

        Returns:
            Data flow analysis
        """
        # Placeholder for data flow analysis
        # This would analyze deployment patterns, data dependencies, etc.

        services = self.deployment_service.list_available_services()

        flow_analysis = {
            "total_services": len(services),
            "categories": {},
            "dependencies": [],
            "data_paths": [],
        }

        if category:
            # Filter by category
            category_services = [s for s in services if category.lower() in s.lower()]
            flow_analysis["filtered_services"] = len(category_services)
            flow_analysis["services"] = category_services
        else:
            flow_analysis["services"] = services

        return cast("dict[str, object]", flow_analysis)

    def _output_data_flow(self, flow_data: dict[str, object], output_format: str) -> None:
        """Output data flow analysis.

        Args:
            flow_data: Flow data
            output_format: Output format
        """
        if output_format == "json":
            click.echo(json.dumps(flow_data, indent=2))
        else:
            # Text format
            click.echo("Data Flow Analysis")
            click.echo(f"Total Services: {flow_data['total_services']}")

            if "filtered_services" in flow_data:
                click.echo(f"Filtered Services: {flow_data['filtered_services']}")

            services = cast("list[str]", flow_data.get("services") or [])
            if services:
                click.echo("\nServices:")
                for service in services:
                    click.echo(f"  - {service}")
