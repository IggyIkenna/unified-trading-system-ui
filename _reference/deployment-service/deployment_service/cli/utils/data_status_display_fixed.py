"""Fixed service status display functions for data status commands.

This module handles status display for services with fixed dimensions.
"""

import logging
import time
from collections import defaultdict
from datetime import timedelta

import click

from ...catalog import SERVICE_GCS_CONFIGS
from ...cloud_client import CloudClient
from ...config_loader import ConfigLoader
from ...deployment_config import DeploymentConfig
from .data_status_formatters import (
    format_backfill_hint,
    format_detailed_breakdown,
    format_fixed_service_header,
    format_json_output,
    format_missing_dates_output,
    format_summary_output,
    format_tree_output,
)
from .data_status_processing import process_batch_results, process_fast_results
from .data_status_scanning import (
    scan_buckets_batch_mode,
    scan_dates_fast_mode,
    scan_venues_fast_mode,
)

logger = logging.getLogger(__name__)


def display_fixed_service_status(
    service: str,
    start_date,
    end_date,
    category: tuple[str, ...],
    venue: tuple[str, ...],
    output: str,
    show_timestamps: bool,
    show_missing: bool,
    config_dir: str,
    fast: bool = False,
    detailed: bool = False,
    mode: str = "batch",
):
    """
    Display status for fixed-dimension services with completion %.

    OPTIMIZED: Two modes available:
    1. Default mode: Batch bucket scan (1 API call per bucket, fast for small buckets)
    2. Fast mode (--fast): Targeted date queries (fast for large buckets + short date ranges)

    Use --fast when:
    - Checking a short date range (< 30 days) against a large bucket
    - Bucket has 10k+ files (like market-tick-data-handler with years of data)
    """
    _deployment_config = DeploymentConfig()
    scan_start = time.time()

    loader = ConfigLoader(config_dir)
    service_config = loader.load_service_config(service)
    gcs_config = SERVICE_GCS_CONFIGS.get(service)

    if not gcs_config or not gcs_config.get("bucket_template"):
        click.echo(click.style(f"No GCS config found for {service}", fg="red"))
        return

    venues_config = loader.load_venues_config()
    cloud_client = CloudClient()

    # Check if service has venue dimension (affects scan strategy)
    has_venue_dimension = any(d["name"] == "venue" for d in service_config.get("dimensions") or [])

    # Build dimension values
    categories = list(category) if category else ["CEFI", "TRADFI", "DEFI"]

    # Filter categories based on service config
    for dim in service_config.get("dimensions") or []:
        if dim["name"] == "category" and dim["type"] == "fixed":
            available_cats = dim.get("values") or []
            categories = [c for c in categories if c in available_cats]
            break

    # Generate date list
    all_dates = []
    current = start_date
    while current <= end_date:
        all_dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    total_requested_days = len(all_dates)

    # Load expected start dates to filter pre-launch dates
    category_valid_dates = {}  # cat -> [valid dates]
    category_excluded = {}  # cat -> number of excluded days
    category_start_date = {}  # cat -> start date string

    for cat in categories:
        expected_start = loader.get_category_start_date(service, cat)
        if expected_start:
            # Filter dates to only those >= expected start
            valid = [d for d in all_dates if d >= expected_start]
            excluded = len(all_dates) - len(valid)
            category_valid_dates[cat] = valid
            category_excluded[cat] = excluded
            category_start_date[cat] = expected_start
        else:
            # No expected start date configured, use all dates
            category_valid_dates[cat] = all_dates
            category_excluded[cat] = 0
            category_start_date[cat] = None

    format_fixed_service_header(
        service,
        start_date,
        end_date,
        total_requested_days,
        category_excluded,
        categories,
        category_start_date,
    )

    # Decide on scan mode: fast (targeted queries) vs batch (full bucket scan)
    # Auto-enable fast mode for services with venue dimension + short date range
    num_days = len(all_dates)
    auto_fast = fast or (has_venue_dimension and num_days <= 60)

    if auto_fast:
        click.echo(
            click.style(f"Scanning buckets (fast targeted mode - {num_days} dates)...", dim=True)
        )
    else:
        click.echo(click.style("Scanning buckets (batch mode)...", dim=True))

    # Live mode: persisted data under live/ prefix (same buckets). See codex batch-live-symmetry.
    path_prefix = "live/" if mode == "live" else ""

    # Build bucket/path info for each category
    bucket_info = {}  # cat -> {bucket, prefix_template}
    for cat in categories:
        template_vars = {
            "category": cat,
            "category_lower": cat.lower(),
            "project_id": _deployment_config.gcp_project_id,
        }
        try:
            bucket = gcs_config["bucket_template"].format(**template_vars)
            path_template = (
                path_prefix + gcs_config["path_template"]
                if path_prefix
                else gcs_config["path_template"]
            )
            bucket_info[cat] = {
                "bucket": bucket,
                "path_template": path_template,
            }
        except KeyError as e:
            logger.debug("Skipping item due to %s: %s", type(e).__name__, e)
            continue

    # Scan using appropriate method
    bucket_indexes = {}
    fast_results = {}  # cat -> {venue -> {date -> exists}}

    if auto_fast and has_venue_dimension:
        # FAST MODE: Targeted venuexdate queries (best for large buckets + short date range)
        fast_results = scan_venues_fast_mode(
            categories,
            bucket_info,
            category_valid_dates,
            all_dates,
            venues_config,
            venue,
            loader,
            service,
            gcs_config,
            cloud_client,
            detailed,
            _deployment_config,
        )
    elif auto_fast:
        # FAST MODE: Targeted date queries for non-venue services
        fast_results = scan_dates_fast_mode(
            categories, bucket_info, category_valid_dates, cloud_client, num_days
        )
    else:
        # BATCH MODE: Scan full bucket (original method - best for small buckets)
        bucket_indexes = scan_buckets_batch_mode(categories, bucket_info, cloud_client)

    scan_time = time.time() - scan_start
    click.echo(click.style(f"Scan complete in {scan_time:.1f}s", fg="green"))
    click.echo()

    # Build hierarchical structure: category -> venue -> dates
    hierarchy = defaultdict(
        lambda: defaultdict(
            lambda: {
                "complete": 0,
                "total": 0,
                "oldest": None,
                "newest": None,
                "excluded": 0,
            }
        )
    )
    overall_complete = 0
    overall_total = 0
    overall_excluded = 0

    # Process results based on scan mode
    if fast_results:
        # FAST MODE results: fast_results[cat][venue][date] = {"exists": bool, ...}
        overall_complete, overall_total, overall_excluded = process_fast_results(
            fast_results,
            categories,
            category_valid_dates,
            category_excluded,
            has_venue_dimension,
            venues_config,
            venue,
            loader,
            service,
            hierarchy,
            show_timestamps,
        )
    else:
        # BATCH MODE results: bucket_indexes[gcs_path] = BucketIndex
        overall_complete, overall_total, overall_excluded = process_batch_results(
            bucket_indexes,
            categories,
            bucket_info,
            category_valid_dates,
            category_excluded,
            has_venue_dimension,
            venues_config,
            venue,
            loader,
            service,
            hierarchy,
            show_timestamps,
            all_dates,
        )

    # Output based on format
    if output == "json":
        format_json_output(
            service,
            start_date,
            end_date,
            hierarchy,
            overall_complete,
            overall_total,
            overall_excluded,
            category_start_date,
            category_excluded,
        )
    elif output == "summary":
        format_summary_output(hierarchy, overall_complete, overall_total)
    else:
        # Tree view (default)
        overall_pct = (overall_complete / overall_total * 100) if overall_total > 0 else 0
        format_tree_output(
            hierarchy,
            overall_complete,
            overall_total,
            overall_excluded,
            category_excluded,
            show_timestamps,
        )

        click.echo()
        click.echo("-" * 70)

        # Show detailed breakdown if requested (data_type x timeframe)
        if detailed and fast_results:
            format_detailed_breakdown(fast_results)

        # Show missing data command hint
        format_backfill_hint(service, start_date, end_date, overall_pct)

    # Show missing dates if requested
    if show_missing:
        format_missing_dates_output(hierarchy)
