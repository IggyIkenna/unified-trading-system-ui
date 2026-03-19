"""Data status command and related functions."""

import logging
import sys
import time
from datetime import datetime

import click

from ..utils.data_status_checkers import (
    check_data_types_detailed,
    check_feature_groups_detailed,
    check_timeframes_detailed,
)
from ..utils.data_status_display_dynamic import display_dynamic_service_status
from ..utils.data_status_display_fixed import display_fixed_service_status
from ..utils.data_status_formatters import format_benchmark_info
from ..utils.data_status_venue_utils import check_instruments_venue_coverage

logger = logging.getLogger(__name__)

# Services with dynamic GCS configs (completion % is not applicable)
DYNAMIC_DIMENSION_SERVICES = {
    "execution-service",
    "ml-training-service",
    "strategy-service",
}

# Fixed dimension services (can show completion %)
FIXED_DIMENSION_SERVICES = {
    "instruments-service",
    "corporate-actions",
    "market-tick-data-service",
    "market-data-processing-service",
    "features-delta-one-service",
    "features-volatility-service",
    "features-onchain-service",
    "ml-inference-service",
}


@click.command("data-status")
@click.option("--service", "-s", required=True, help="Service to check data status for")
@click.option(
    "--start-date",
    required=True,
    type=click.DateTime(formats=["%Y-%m-%d"]),
    help="Start date (YYYY-MM-DD)",
)
@click.option(
    "--end-date",
    required=True,
    type=click.DateTime(formats=["%Y-%m-%d"]),
    help="End date (YYYY-MM-DD)",
)
@click.option("--category", "-c", multiple=True, help="Filter by category (default: all)")
@click.option("--venue", "-v", multiple=True, help="Filter by venue")
@click.option(
    "--output",
    "-o",
    type=click.Choice(["tree", "json", "summary"]),
    default="tree",
    help="Output format",
)
@click.option("--show-timestamps", "-t", is_flag=True, help="Show file timestamps (oldest/newest)")
@click.option("--show-missing", "-m", is_flag=True, help="List specific missing dates")
@click.option("--benchmark", "-b", is_flag=True, help="Show performance benchmark info")
@click.option(
    "--check-venues",
    is_flag=True,
    help="[instruments-service] Check venue coverage within parquet files",
)
@click.option(
    "--check-data-types",
    is_flag=True,
    help="[market-tick-data-service] Check per-data_type completion (detailed)",
)
@click.option(
    "--check-feature-groups",
    is_flag=True,
    help="[features-*-service] Check per-feature_group completion",
)
@click.option(
    "--check-timeframes",
    is_flag=True,
    help="[market-data-processing-service] Check per-timeframe completion",
)
@click.option(
    "--detailed",
    "-d",
    is_flag=True,
    help="Show detailed breakdown by data_type and timeframe",
)
@click.option(
    "--fast",
    is_flag=True,
    help="Use targeted date queries (faster for short date ranges)",
)
@click.option(
    "--mode",
    type=click.Choice(["batch", "live"], case_sensitive=False),
    default="batch",
    help=(
        "Data path mode: batch (historical by_date/day=) or live"
        " (persisted live sink under live/ prefix)."
    ),
)
@click.pass_context
def data_status(
    ctx,
    service: str,
    start_date: datetime,
    end_date: datetime,
    category: tuple[str, ...],
    venue: tuple[str, ...],
    output: str,
    show_timestamps: bool,
    show_missing: bool,
    benchmark: bool,
    check_venues: bool,
    check_data_types: bool,
    check_feature_groups: bool,
    check_timeframes: bool,
    detailed: bool,
    fast: bool,
    mode: str,
):
    """
    Check data completion status for a service across a date range.

    OPTIMIZED for speed: Uses batch blob listing (1 API call per bucket instead
    of 1 per date) and parallel scanning. Can check years of data in seconds.

    Shows hierarchical breakdown of data completion by dimensions (category, venue, etc.)
    with percentages and optionally file timestamps.

    For dynamic-dimension services (execution-service, ml-training-service, strategy-service),
    only timestamp information is shown since completion % is not applicable.

    Examples:
        # Check instruments-service completion (1 day)
        data-status -s instruments-service --start-date 2024-01-01 --end-date 2024-01-01

        # Check 1 month (fast - batch scanning)
        data-status -s instruments-service --start-date 2024-01-01 --end-date 2024-01-31

        # Check 1 year with timestamps
        data-status -s instruments-service --start-date 2024-01-01 --end-date 2024-12-31 -t

        # Show missing dates
        data-status -s instruments-service --start-date 2024-01-01 --end-date 2024-12-31 -m

        # Benchmark performance
        data-status -s instruments-service --start-date 2024-01-01 --end-date 2024-12-31 -b

        # Check venue coverage within instruments parquet files (instruments-service only)
        data-status -s instruments-service --start-date 2024-01-01 --end-date 2024-01-31
          --check-venues
    """
    config_dir = ctx.obj.get("config_dir", "configs")
    total_start = time.time()

    try:
        # Import specialized checking functions when needed
        if check_venues:
            if service != "instruments-service":
                click.echo(
                    click.style(
                        "--check-venues is only supported for instruments-service",
                        fg="red",
                    ),
                    err=True,
                )
                sys.exit(1)
            check_instruments_venue_coverage(start_date, end_date, category, output, config_dir)

        elif check_data_types:
            if service != "market-tick-data-service":
                click.echo(
                    click.style(
                        "--check-data-types is only supported for market-tick-data-service",
                        fg="red",
                    ),
                    err=True,
                )
                sys.exit(1)
            check_data_types_detailed(start_date, end_date, category, venue, config_dir, output)

        elif check_feature_groups:
            # Feature groups check for features-*-service
            feature_services = [
                "features-delta-one-service",
                "features-volatility-service",
                "features-onchain-service",
                "features-calendar-service",
            ]
            if service not in feature_services:
                click.echo(
                    click.style(
                        "--check-feature-groups is only supported for:"
                        f" {', '.join(feature_services)}",
                        fg="red",
                    ),
                    err=True,
                )
                sys.exit(1)
            check_feature_groups_detailed(
                service, start_date, end_date, category, config_dir, output
            )

        elif check_timeframes:
            if service != "market-data-processing-service":
                click.echo(
                    click.style(
                        "--check-timeframes is only supported for market-data-processing-service",
                        fg="red",
                    ),
                    err=True,
                )
                sys.exit(1)
            check_timeframes_detailed(start_date, end_date, category, venue, config_dir, output)

        elif service in DYNAMIC_DIMENSION_SERVICES:
            display_dynamic_service_status(
                service, start_date, end_date, category, output, config_dir, mode
            )

        else:
            display_fixed_service_status(
                service,
                start_date,
                end_date,
                category,
                venue,
                output,
                show_timestamps,
                show_missing,
                config_dir,
                fast,
                detailed,
                mode,
            )

        if benchmark:
            format_benchmark_info(total_start, start_date, end_date)

    except (OSError, ValueError, RuntimeError) as e:
        click.echo(click.style(f"Error: {e}", fg="red"), err=True)
        logger.exception("Data status check failed")
        sys.exit(1)
