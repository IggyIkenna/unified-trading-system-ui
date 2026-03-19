"""
Refactored CLI - Command-line interface for shard calculation and deployment

This is the refactored version that uses modular handlers instead of massive functions.
The old cli.py will be renamed to cli_original.py for backup.
"""

import logging
import warnings
from datetime import datetime
from pathlib import Path
from typing import cast

import click

# Suppress Pydantic deprecation warnings from third-party libraries
warnings.filterwarnings("ignore", category=DeprecationWarning, module="pydantic.*")
warnings.filterwarnings("ignore", message=".*PydanticDeprecatedSince.*")

from unified_events_interface import setup_events
from unified_trading_library import GracefulShutdownHandler

# Import modular handlers
from .cli.handlers.calculation_handler import CalculationHandler
from .cli.handlers.deployment_handler import DeploymentHandler
from .cli.handlers.maintenance_handler import MaintenanceHandler
from .cli.handlers.reporting_handler import ReportingHandler

logger = logging.getLogger(__name__)

# Deployment concurrency defaults
from deployment_service.deployment_config import DeploymentConfig as _DeploymentConfig

_cli_config = _DeploymentConfig()
DEFAULT_MAX_CONCURRENT = _cli_config.default_max_concurrent
MAX_CONCURRENT_HARD_LIMIT = _cli_config.max_concurrent_hard_limit

# Global shutdown handler
_shutdown_handler: GracefulShutdownHandler | None = None


def get_config_dir() -> Path:
    """Get the configs directory path."""
    cwd = Path.cwd()

    # Try relative to script location
    script_dir = Path(__file__).parent.parent
    configs_dir = script_dir / "configs"
    if configs_dir.exists():
        return configs_dir

    # Try current directory
    if (cwd / "configs").exists():
        return cwd / "configs"

    # Try deployment-service
    if cwd.name == "deployment-service":
        return cwd / "configs"

    # Try parent directories
    for parent in cwd.parents:
        if parent.name == "deployment-service":
            return parent / "configs"

    raise click.ClickException(
        "Could not find configs directory. Run from deployment-service or specify --config-dir"
    )


@click.group()
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose logging")
@click.option("--config-dir", type=click.Path(exists=True), help="Path to configs directory")
@click.option(
    "--cloud",
    type=click.Choice(["gcp", "aws"]),
    default="gcp",
    help="Cloud provider (default: gcp). Set via CLOUD_PROVIDER env var or CLI flag.",
)
@click.option("--project-id", help="GCP Project ID for operations requiring cloud access")
@click.pass_context
def cli(
    ctx: click.Context, verbose: bool, config_dir: str | None, cloud: str, project_id: str | None
):
    """Unified Trading Deployment - Shard Calculator

    Multi-cloud deployment CLI supporting both GCP and AWS.

    Set cloud provider via:
    - CLI flag: --cloud gcp|aws
    - Environment variable: CLOUD_PROVIDER=gcp|aws
    """
    global _shutdown_handler

    # Event logging for deployment observability
    setup_events(service_name="deployment-service", mode="batch", sink=None)

    # Initialize graceful shutdown handler (handles SIGTERM/SIGINT)
    _shutdown_handler = GracefulShutdownHandler()

    ctx.ensure_object(dict)

    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    obj: dict[str, object] = cast(dict[str, object], ctx.obj)

    # Set configuration directory
    if config_dir:
        obj["config_dir"] = config_dir
    else:
        try:
            obj["config_dir"] = str(get_config_dir())
        except click.ClickException:
            # Allow CLI to work without config dir for some commands
            obj["config_dir"] = None

    # Set cloud provider
    env_cloud = (_cli_config.cloud_provider or "gcp").lower()
    cloud_provider: str = cloud or env_cloud or "gcp"
    obj["cloud"] = cloud_provider

    # Set project ID
    obj["project_id"] = project_id or cast(str | None, _cli_config.gcp_project_id)

    if verbose:
        logger.info("Cloud provider: %s", cloud_provider)
        logger.info("Config directory: %s", obj["config_dir"])
        logger.info("Project ID: %s", obj["project_id"])


# =============================================================================
# CALCULATION COMMANDS
# =============================================================================


@cli.command()
@click.option("--service", "-s", required=True, help="Service to calculate shards for")
@click.option(
    "--start-date",
    type=click.DateTime(formats=["%Y-%m-%d"]),
    help="Start date (YYYY-MM-DD)",
)
@click.option(
    "--end-date",
    type=click.DateTime(formats=["%Y-%m-%d"]),
    help="End date (YYYY-MM-DD)",
)
@click.option(
    "--max-shards",
    default=10000,
    type=int,
    help="Maximum allowed shards (default: 10000)",
)
@click.option("--venue", help="Filter by venue")
@click.option("--category", help="Filter by category")
@click.option(
    "--output",
    "-o",
    type=click.Choice(["table", "json", "commands"]),
    default="table",
    help="Output format",
)
@click.option("--dry-run", is_flag=True, help="Show shards without deploying")
@click.pass_context
def calculate(
    ctx: click.Context,
    service: str,
    start_date: datetime | None,
    end_date: datetime | None,
    max_shards: int,
    venue: str | None,
    category: str | None,
    output: str,
    dry_run: bool,
):
    """Calculate deployment shards for a service."""
    handler = CalculationHandler(ctx)
    handler.handle_calculate(
        service=service,
        start_date=start_date,
        end_date=end_date,
        venue=venue,
        category=category,
        max_shards=max_shards,
        output=output,
        dry_run=dry_run,
    )


@cli.command("list-services")
@click.pass_context
def list_services(ctx: click.Context):
    """List available services."""
    handler = CalculationHandler(ctx)
    handler.handle_list_services()


@cli.command()
@click.option("--service", "-s", required=True, help="Service to get info for")
@click.pass_context
def info(ctx: click.Context, service: str):
    """Show detailed information about a service."""
    handler = CalculationHandler(ctx)
    handler.handle_service_info(service)


@cli.command()
@click.pass_context
def venues(ctx: click.Context):
    """List venues configured for all services."""
    handler = CalculationHandler(ctx)
    handler.handle_venues()


# =============================================================================
# DEPLOYMENT COMMANDS
# =============================================================================


@cli.command()
@click.option("--service", "-s", required=True, help="Service to deploy")
@click.option("--config-override", help="Override configuration file")
@click.option("--dry-run", is_flag=True, help="Perform dry run")
@click.option(
    "--max-concurrent",
    default=50,
    help="Maximum concurrent deployments",
)
@click.option("--force", is_flag=True, help="Force deployment")
@click.pass_context
def deploy(
    ctx: click.Context,
    service: str,
    config_override: str | None,
    dry_run: bool,
    max_concurrent: int,
    force: bool,
):
    """Deploy a service."""
    handler = DeploymentHandler(ctx)
    handler.handle_deploy(
        service=service,
        config_override=config_override,
        dry_run=dry_run,
        max_concurrent=max_concurrent,
        force=force,
    )


@cli.command()
@click.argument("deployment_id")
@click.option("--force", is_flag=True, help="Force resume")
@click.pass_context
def resume(ctx: click.Context, deployment_id: str, force: bool):
    """Resume a paused deployment."""
    handler = DeploymentHandler(ctx)
    handler.handle_resume(deployment_id, force=force)


@cli.command()
@click.option("--deployment-id", help="Specific deployment ID to check")
@click.option("--all", "show_all", is_flag=True, help="Show all deployments")
@click.option("--details", is_flag=True, help="Show detailed information")
@click.pass_context
def status(ctx: click.Context, deployment_id: str | None, show_all: bool, details: bool):
    """Check deployment status."""
    handler = DeploymentHandler(ctx)
    handler.handle_status(
        deployment_id=deployment_id,
        show_all=show_all,
        show_details=details,
    )


@cli.command("list-deployments")
@click.option("--limit", default=50, help="Maximum deployments to show")
@click.option("--status-filter", help="Filter by status")
@click.pass_context
def list_deployments(ctx: click.Context, limit: int, status_filter: str | None):
    """List recent deployments."""
    handler = DeploymentHandler(ctx)
    handler.handle_status(show_all=True)


@cli.command()
@click.argument("deployment_id")
@click.option("--force", is_flag=True, help="Force cancellation")
@click.pass_context
def cancel(ctx: click.Context, deployment_id: str, force: bool):
    """Cancel a running deployment."""
    handler = DeploymentHandler(ctx)
    handler.handle_cancel(deployment_id, force)


@cli.command()
@click.argument("deployment_id")
@click.option("--service", help="Filter by service")
@click.option("--shard-id", help="Filter by shard ID")
@click.option("--since", default="1h", help="Time period (1h, 30m, 1d)")
@click.option("--follow", is_flag=True, help="Follow logs in real-time")
@click.option("--lines", default=100, help="Number of log lines")
@click.pass_context
def logs(
    ctx: click.Context,
    deployment_id: str,
    service: str | None,
    shard_id: str | None,
    since: str,
    follow: bool,
    lines: int,
):
    """Get logs for a deployment."""
    handler = DeploymentHandler(ctx)
    handler.handle_logs(
        deployment_id=deployment_id,
        service=service,
        shard_id=shard_id,
        since=since,
        follow=follow,
        lines=lines,
    )


# =============================================================================
# MAINTENANCE COMMANDS
# =============================================================================


@cli.command("cleanup-gcs")
@click.option("--state-bucket", required=True, help="State bucket to clean")
@click.option("--dry-run", is_flag=True, default=True, help="Show what would be deleted")
@click.option("--older-than-days", default=30, help="Delete files older than N days")
@click.pass_context
def cleanup_gcs(ctx: click.Context, state_bucket: str, dry_run: bool, older_than_days: int):
    """Clean up old files from GCS state bucket."""
    handler = MaintenanceHandler(ctx)
    handler.handle_cleanup_gcs(
        state_bucket=state_bucket,
        dry_run=dry_run,
        older_than_days=older_than_days,
    )


@cli.command("fix-stale")
@click.option("--deployment-id", help="Specific deployment to fix")
@click.option("--auto-fix", is_flag=True, help="Automatically fix without confirmation")
@click.pass_context
def fix_stale(ctx: click.Context, deployment_id: str | None, auto_fix: bool):
    """Fix stale deployments."""
    handler = MaintenanceHandler(ctx)
    handler.handle_fix_stale(deployment_id, auto_fix)


@cli.command("validate-buckets")
@click.option("--service", "-s", required=True, help="Service to validate")
@click.option("--category", multiple=True, help="Categories to validate")
@click.option("--fix", is_flag=True, help="Fix found issues")
@click.pass_context
def validate_buckets(ctx: click.Context, service: str, category: tuple[str, ...], fix: bool):
    """Validate service bucket configurations."""
    handler = MaintenanceHandler(ctx)
    handler.handle_validate_buckets(
        service=service,
        categories=category,
        fix_issues=fix,
    )


@cli.command("retry-failed")
@click.argument("deployment_id")
@click.option("--shard-id", help="Specific shard to retry")
@click.option("--max-retries", default=3, help="Maximum retry attempts")
@click.pass_context
def retry_failed(ctx: click.Context, deployment_id: str, shard_id: str | None, max_retries: int):
    """Retry failed shards in a deployment."""
    handler = MaintenanceHandler(ctx)
    handler.handle_retry_failed(
        deployment_id=deployment_id,
        shard_id=shard_id,
        max_retries=max_retries,
    )


# =============================================================================
# REPORTING COMMANDS
# =============================================================================


@cli.command()
@click.option(
    "--output",
    type=click.Choice(["text", "json", "csv"]),
    default="text",
    help="Output format",
)
@click.option(
    "--start-date",
    type=click.DateTime(formats=["%Y-%m-%d"]),
    help="Report start date",
)
@click.option(
    "--end-date",
    type=click.DateTime(formats=["%Y-%m-%d"]),
    help="Report end date",
)
@click.option("--service", help="Filter by service")
@click.option("--details", is_flag=True, help="Include detailed information")
@click.pass_context
def report(
    ctx: click.Context,
    output: str,
    start_date: datetime | None,
    end_date: datetime | None,
    service: str | None,
    details: bool,
):
    """Generate deployment report."""
    handler = ReportingHandler(ctx)
    handler.handle_report(
        output_format=output,
        start_date=start_date,
        end_date=end_date,
        service_filter=service,
        include_details=details,
    )


@cli.command()
@click.option("--service", help="Specific service to check")
@click.pass_context
def versions(ctx: click.Context, service: str | None):
    """Show version information for services."""
    handler = ReportingHandler(ctx)
    handler.handle_versions(service)


@cli.command("data-flow")
@click.option("--category", help="Category to analyze")
@click.option(
    "--output",
    type=click.Choice(["text", "json"]),
    default="text",
    help="Output format",
)
@click.pass_context
def data_flow(ctx: click.Context, category: str | None, output: str):
    """Analyze data flow patterns."""
    handler = ReportingHandler(ctx)
    handler.handle_data_flow(category, output)


# =============================================================================
# UTILITY COMMANDS (Legacy compatibility)
# =============================================================================


@cli.command("check-deps")
@click.option("--service", "-s", required=True, help="Service to check dependencies")
@click.pass_context
def check_deps(ctx: click.Context, service: str):
    """Check service dependencies."""
    # Legacy command - could be expanded to use dependency service
    click.echo(f"Checking dependencies for {service}...")
    click.echo("Dependencies check completed (placeholder)")


@cli.command("plan-t1")
@click.argument("date", type=click.DateTime(formats=["%Y-%m-%d"]))
@click.option("--category", required=True, help="Category for planning")
@click.option("--output", default="text", help="Output format")
@click.option("--save", is_flag=True, help="Save plan")
@click.pass_context
def plan_t1(ctx: click.Context, date: datetime, category: str, output: str, save: bool):
    """Generate T+1 deployment plan."""
    # Legacy command - simplified placeholder
    click.echo(f"T+1 plan for {date.date()} category {category}")
    if save:
        click.echo("Plan saved (placeholder)")


@cli.command("cascade-failure")
@click.option("--service", "-s", required=True, help="Service to analyze")
@click.pass_context
def cascade_failure(ctx: click.Context, service: str):
    """Analyze cascade failure potential."""
    # Legacy command - simplified placeholder
    click.echo(f"Cascade failure analysis for {service}")
    click.echo("Analysis completed (placeholder)")


def main():
    """Main entry point."""
    cli()


if __name__ == "__main__":
    main()
