"""
CLI - Command-line interface for shard calculation and deployment

Usage:
    python -m src.cli calculate --service instruments-service
        --start-date 2024-01-01 --end-date 2024-12-31
    python -m src.cli calculate --service market-tick-data-handler
        --category CEFI --max-shards 100
"""

import logging
import warnings
from pathlib import Path

# Suppress Pydantic deprecation warnings from third-party libraries
# These are not our code and spamming stdout
warnings.filterwarnings("ignore", category=DeprecationWarning, module="pydantic.*")
warnings.filterwarnings("ignore", message=".*PydanticDeprecatedSince.*")

import click
from unified_events_interface import setup_events
from unified_trading_library import (
    GracefulShutdownHandler,
    setup_tracing,
)

from ..deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

# Initialize deployment configuration
_deployment_config = DeploymentConfig()

# Global shutdown handler
_shutdown_handler: GracefulShutdownHandler | None = None


def get_config_dir() -> Path:
    """Get the configs directory path."""
    cwd = Path.cwd()

    # Try relative to script location
    script_dir = Path(__file__).parent.parent.parent
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
@click.pass_context
def cli(ctx, verbose: bool, config_dir: str | None, cloud: str):
    """Unified Trading Deployment - Shard Calculator

    Multi-cloud deployment CLI supporting both GCP and AWS.

    Set cloud provider via:
    - CLI flag: --cloud gcp|aws
    - Environment variable: CLOUD_PROVIDER=gcp|aws
    """
    global _shutdown_handler

    # Event logging for UTD v2 progress/observability (before any log_event)
    setup_events(service_name="deployment-service", mode="batch", sink=None)
    setup_tracing("deployment-service")

    # Initialize graceful shutdown handler (handles SIGTERM/SIGINT)
    _shutdown_handler = GracefulShutdownHandler()

    ctx.ensure_object(dict)

    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if config_dir:
        ctx.obj["config_dir"] = config_dir
    else:
        ctx.obj["config_dir"] = str(get_config_dir())

    # Set cloud provider (CLI flag takes precedence over config)
    config_cloud = _deployment_config.cloud_provider.lower()
    cloud_provider = cloud or config_cloud or "gcp"
    ctx.obj["cloud_provider"] = cloud_provider

    if verbose:
        logger.info("Cloud provider: %s", cloud_provider)


# Import command modules after defining cli
from .commands.analysis import analysis_commands
from .commands.calculation import calculation_commands
from .commands.deployment import deployment_commands
from .commands.management import management_commands
from .commands.reporting import reporting_commands
from .commands.validation import validation_commands

# Add command groups
for command in (
    calculation_commands
    + deployment_commands
    + management_commands
    + analysis_commands
    + validation_commands
    + reporting_commands
):
    cli.add_command(command)


def main():
    """Entry point for the CLI."""
    cli()


if __name__ == "__main__":
    main()
