"""Calculation commands for shard calculation and service information."""

import json
import sys
from datetime import datetime
from typing import cast

import click

from ...calculators.base_calculator import Shard
from ...config_loader import ConfigLoader
from ...shard_calculator import ShardCalculator, ShardLimitExceeded


def _output_table(shards: list[Shard], summary: dict[str, object], dry_run: bool) -> None:
    """Output shards in table format."""
    click.echo()
    click.echo(click.style(f"Service: {summary['service']}", fg="cyan", bold=True))
    click.echo(click.style(f"Total Shards: {summary['total_shards']}", fg="green", bold=True))
    click.echo()

    # Breakdown
    click.echo("Dimension Breakdown:")
    for dim, count in cast(dict[str, int], summary.get("breakdown") or {}).items():
        click.echo(f"  - {dim}: {count} values")
    click.echo()

    # Show first 10 shards as preview
    preview_count = min(10, len(shards))
    click.echo(f"Shards Preview (showing {preview_count} of {len(shards)}):")
    click.echo("-" * 60)

    for shard in shards[:preview_count]:
        dims_str = ", ".join(f"{k}={v}" for k, v in shard.dimensions.items())
        click.echo(f"  [{shard.shard_index + 1}/{shard.total_shards}] {dims_str}")

    if len(shards) > preview_count:
        click.echo(f"  ... and {len(shards) - preview_count} more")

    click.echo()

    if dry_run:
        click.echo(click.style("DRY RUN - No deployment triggered", fg="yellow"))
    else:
        click.echo("Ready to deploy. Use --dry-run to preview without deploying.")


def _output_json(shards: list[Shard], summary: dict[str, object]) -> None:
    """Output shards in JSON format."""
    output = {
        "summary": summary,
        "shards": [shard.to_dict() for shard in shards],
    }
    click.echo(json.dumps(output, indent=2, default=str))


def _output_commands(shards: list[Shard], summary: dict[str, object]) -> None:
    """Output CLI commands for each shard."""
    click.echo(f"# Service: {summary['service']}")
    click.echo(f"# Total Shards: {summary['total_shards']}")
    click.echo()

    for shard in shards:
        click.echo(f"# Shard {shard.shard_index + 1}/{shard.total_shards}")
        click.echo(shard.cli_command)
        click.echo()


@click.command()
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
@click.option(
    "--cloud-config-path",
    help="Cloud storage path to config directory (gs://bucket/... or s3://bucket/...). "
    "Dynamically discovers all .json configs in directory and subdirectories. "
    "Creates one shard per config x date combination. Use with execution-service.",
)
@click.option("--category", multiple=True, help="Filter by category (can specify multiple)")
@click.option("--venue", multiple=True, help="Filter by venue (can specify multiple)")
@click.option("--feature-group", multiple=True, help="Filter by feature group")
@click.option("--instrument", multiple=True, help="Filter by instrument")
@click.option(
    "--output",
    "-o",
    type=click.Choice(["table", "json", "commands"]),
    default="table",
    help="Output format",
)
@click.option("--dry-run", is_flag=True, help="Show shards without deploying")
@click.option(
    "--respect-start-dates/--ignore-start-dates",
    "respect_start_dates",
    default=True,
    help="Filter out shards for dates before venue launch (default: respect). "
    "Use --ignore-start-dates to include all date-venue combinations.",
)
@click.pass_context
def calculate(
    ctx: click.Context,
    service: str,
    start_date: datetime | None,
    end_date: datetime | None,
    max_shards: int,
    cloud_config_path: str | None,
    category: tuple[str, ...],
    venue: tuple[str, ...],
    feature_group: tuple[str, ...],
    instrument: tuple[str, ...],
    output: str,
    dry_run: bool,
    respect_start_dates: bool,
):
    """
    Calculate deployment shards for a service.

    Examples:

        # Calculate shards for instruments-service (all categories, daily)
        python -m deployment_service.cli calculate -s instruments-service
          --start-date 2024-01-01 --end-date 2024-01-31

        # Calculate shards for market-tick-data-service (CEFI only)
        python -m deployment_service.cli calculate -s market-tick-data-service
          --category CEFI --start-date 2024-01-01 --end-date 2024-01-07

        # Show CLI commands for each shard
        python -m deployment_service.cli calculate -s instruments-service
          --start-date 2024-01-01 --end-date 2024-01-03 -o commands

        # Calculate execution-service shards from a config directory (dynamic discovery)
        python -m deployment_service.cli calculate -s execution-service
          --start-date 2024-01-01 --end-date 2024-01-03 \\
          --cloud-config-path gs://execution-store-{GCP_PROJECT_ID}/configs/
            V1/CEFI_BTC_momentum-macd/ -o table

        # Show commands for execution-service (all configs in bucket)
        python -m deployment_service.cli calculate -s execution-service
          --start-date 2024-01-01 --end-date 2024-01-01 \\
          --cloud-config-path gs://execution-store-{GCP_PROJECT_ID}/configs/ -o commands
    """
    config_dir = cast(str, cast(dict[str, object], ctx.obj or {}).get("config_dir") or "configs")

    try:
        calculator = ShardCalculator(config_dir)

        # Build filters from options
        filters: dict[str, list[str]] = {}
        if category:
            filters["category"] = list(category)
        if venue:
            filters["venue"] = list(venue)
        if feature_group:
            filters["feature_group"] = list(feature_group)
        if instrument:
            filters["instrument"] = list(instrument)

        # Calculate shards
        dim_filters: dict[str, object] = {k: v for k, v in filters.items()}
        shards = calculator.calculate_shards(
            service=service,
            start_date=start_date.date() if start_date else None,
            end_date=end_date.date() if end_date else None,
            max_shards=max_shards,
            cloud_config_path=cloud_config_path,
            respect_start_dates=respect_start_dates,
            **dim_filters,
        )

        # Get summary
        summary = calculator.get_shard_summary(shards)

        # Output based on format
        if output == "json":
            _output_json(shards, summary)
        elif output == "commands":
            _output_commands(shards, summary)
        else:
            _output_table(shards, summary, dry_run)

    except ShardLimitExceeded as e:
        click.echo(click.style(str(e), fg="red"), err=True)
        sys.exit(1)
    except ValueError as e:
        click.echo(click.style(f"Error: {e}", fg="red"), err=True)
        sys.exit(1)
    except FileNotFoundError as e:
        click.echo(click.style(f"Error: {e}", fg="red"), err=True)
        sys.exit(1)


@click.command("list-services")
@click.pass_context
def list_services(ctx: click.Context):
    """List all available services with sharding configs."""
    config_dir = cast(str, cast(dict[str, object], ctx.obj or {}).get("config_dir") or "configs")

    try:
        loader = ConfigLoader(config_dir)
        services = loader.list_available_services()

        if not services:
            click.echo("No services found. Check configs directory.")
            return

        click.echo(click.style("Available Services:", fg="cyan", bold=True))
        click.echo()

        for service in services:
            config = loader.load_service_config(service)
            description = config.get("description", "No description")
            dims = [
                str(d["name"])
                for d in cast(list[dict[str, object]], config.get("dimensions") or [])
            ]

            click.echo(click.style(f"  {service}", fg="green"))
            click.echo(f"    {description}")
            click.echo(f"    Dimensions: {', '.join(dims)}")
            click.echo()

    except (OSError, ValueError, RuntimeError) as e:
        click.echo(click.style(f"Error: {e}", fg="red"), err=True)
        sys.exit(1)


@click.command()
@click.option("--service", "-s", required=True, help="Service to show info for")
@click.pass_context
def info(ctx: click.Context, service: str):
    """Show detailed information about a service's sharding config."""
    config_dir = cast(str, cast(dict[str, object], ctx.obj or {}).get("config_dir") or "configs")

    try:
        loader = ConfigLoader(config_dir)
        config = loader.load_service_config(service)
        loader.load_venues_config()

        click.echo()
        click.echo(click.style(f"Service: {service}", fg="cyan", bold=True))
        click.echo(f"Description: {config.get('description', 'N/A')}")
        click.echo()

        # Dimensions
        click.echo(click.style("Dimensions:", fg="green", bold=True))
        for dim in cast(list[dict[str, object]], config.get("dimensions") or []):
            click.echo(f"\n  {click.style(dim['name'], fg='yellow')} ({dim['type']})")

            if dim["type"] == "fixed":
                values = cast(list[object], dim.get("values") or [])
                if len(values) <= 10:
                    click.echo(f"    Values: {values}")
                else:
                    click.echo(f"    Values: {values[:5]} ... ({len(values)} total)")

            elif dim["type"] == "hierarchical":
                click.echo(f"    Parent: {dim['parent']}")
                click.echo(f"    Source: {dim.get('source', 'venues.yaml')}")

            elif dim["type"] == "date_range":
                click.echo(f"    Granularity: {dim.get('granularity', 'daily')}")

            elif dim["type"] == "gcs_dynamic":
                bucket = dim.get("source_bucket")
                click.echo(f"    Bucket: {bucket}")
                click.echo(f"    Prefix: {dim.get('gcs_prefix') or ''}")
                click.echo(f"    Pattern: {dim.get('file_pattern', '*')}")

            if "description" in dim:
                click.echo(f"    Description: {dim['description']}")

        # CLI args mapping
        click.echo()
        click.echo(click.style("CLI Argument Mapping:", fg="green", bold=True))
        for dim_name, cli_arg in cast(dict[str, object], config.get("cli_args") or {}).items():
            click.echo(f"  {dim_name} -> {cli_arg}")

        # Compute recommendations
        click.echo()
        click.echo(click.style("Compute Recommendations:", fg="green", bold=True))
        compute = cast(dict[str, dict[str, object]], config.get("compute") or {})
        for compute_type, specs in compute.items():
            click.echo(f"\n  {compute_type}:")
            for k, v in specs.items():
                click.echo(f"    {k}: {v}")

        # Runtime estimate
        runtime = cast(dict[str, object], config.get("runtime") or {})
        if runtime:
            click.echo()
            click.echo(click.style("Runtime Estimate:", fg="green", bold=True))
            click.echo(f"  ~{runtime.get('estimated_minutes', 'N/A')} minutes per shard")
            if "notes" in runtime:
                click.echo(f"  Notes: {runtime['notes']}")

    except FileNotFoundError as e:
        click.echo(click.style(f"Error: {e}", fg="red"), err=True)
        sys.exit(1)


@click.command()
@click.pass_context
def venues(ctx: click.Context):
    """Show available venues by category."""
    config_dir = cast(str, cast(dict[str, object], ctx.obj or {}).get("config_dir") or "configs")

    try:
        loader = ConfigLoader(config_dir)
        config = loader.load_venues_config()

        click.echo()
        click.echo(click.style("Venues by Category:", fg="cyan", bold=True))
        click.echo()

        for category, cat_config in cast(
            dict[str, dict[str, object]], config.get("categories") or {}
        ).items():
            click.echo(click.style(f"  {category}", fg="green", bold=True))
            click.echo(f"    {cat_config.get('description') or ''}")
            click.echo()

            click.echo("    Venues:")
            for venue in cast(list[object], cat_config.get("venues") or []):
                click.echo(f"      - {venue}")

            click.echo()
            click.echo("    Data Types:")
            for dt in cast(list[object], cat_config.get("data_types") or []):
                click.echo(f"      - {dt}")

            click.echo()

    except (OSError, ValueError, RuntimeError) as e:
        click.echo(click.style(f"Error: {e}", fg="red"), err=True)
        sys.exit(1)


# List of calculation commands to export
calculation_commands = [
    calculate,
    list_services,
    info,
    venues,
]
