"""Detailed data checking functions for data status commands."""

import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

import click

from ...catalog import SERVICE_GCS_CONFIGS
from ...cloud_client import CloudClient
from ...config_loader import ConfigLoader
from ...deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)


def check_data_types_detailed(
    start_date: datetime,
    end_date: datetime,
    category: tuple[str, ...],
    venue: tuple[str, ...],
    config_dir: str,
    output: str = "tree",
):
    """
    Detailed data_type checking for market-tick-data-handler.

    Checks each expected data_type (ohlcv_1m, trades, tbbo, etc.) per venue/date
    based on the venue_data_types config in venues.yaml.

    Supports output formats: tree, json, summary
    """
    _deployment_config = DeploymentConfig()
    scan_start = time.time()
    loader = ConfigLoader(config_dir)
    venues_config = loader.load_venues_config()
    cloud_client = CloudClient()
    gcs_config = SERVICE_GCS_CONFIGS.get("market-tick-data-handler") or {}

    # Get TRADFI config (only category with detailed data_type config)
    tradfi_config = venues_config.get("categories") or {}.get("TRADFI") or {}
    venue_data_types = tradfi_config.get("venue_data_types") or {}
    tick_windows = tradfi_config.get("tick_windows") or []
    instrument_types_config = venues_config.get("instrument_types") or {}

    # Filter categories (only TRADFI has detailed config for now)
    categories = list(category) if category else ["TRADFI"]
    if "TRADFI" not in categories:
        click.echo(
            click.style(
                "--check-data-types currently only supports TRADFI category",
                fg="yellow",
            )
        )
        return

    # Generate date list
    all_dates = []
    current = start_date
    while current <= end_date:
        all_dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    # Determine which dates are in tick windows (have expanded data types)
    def is_tick_window(date_str: str) -> bool:
        return any(window["start"] <= date_str <= window["end"] for window in tick_windows)

    # Filter venues
    all_venues = tradfi_config.get("venues") or []
    venues_to_check = list(venue) if venue else all_venues

    # Only show progress in tree mode (not JSON)
    show_progress = output != "json"

    if show_progress:
        click.echo()
        click.echo(
            "DETAILED DATA TYPE STATUS: "
            + click.style("market-tick-data-handler", fg="cyan", bold=True)
        )
        click.echo(
            f"Date Range: {start_date.strftime('%Y-%m-%d')}"
            f" to {end_date.strftime('%Y-%m-%d')} ({len(all_dates)} days)"
        )
        click.echo("=" * 70)
        click.echo()

    # Get bucket for TRADFI
    bucket = gcs_config["bucket_template"].format(
        category="TRADFI",
        category_lower="tradfi",
        project_id=_deployment_config.gcp_project_id,
    )

    # Map instrument types for GCS folder names
    inst_type_folder_map = {
        "EQUITY": "equities",
        "ETF": "etf",
        "FUTURE": "futures_chain",
        "OPTION": "options_chain",
        "INDEX": "indices",
    }

    results_by_venue = {}

    # Pre-compute venue configs
    venue_configs = {}
    for v in venues_to_check:
        venue_dt_config = venue_data_types.get(v, {})
        if not venue_dt_config:
            if show_progress:
                click.echo(click.style(f"  {v}: No data_type config found, skipping", fg="yellow"))
            continue

        # Get instrument types for this venue
        venue_inst_types = instrument_types_config.get(v, [])
        inst_folders = [inst_type_folder_map.get(it, it.lower()) for it in venue_inst_types]

        # Build expected data types for each date
        venue_results = {}
        all_expected_dt = set()

        for date_str in all_dates:
            in_tick_window = is_tick_window(date_str)

            # Get expected data types based on instrument types and tick window
            expected_dts = set()
            for inst_type in venue_inst_types:
                inst_config = venue_dt_config.get(inst_type, {})
                if in_tick_window:
                    expected_dts.update(
                        inst_config.get("tick_window", inst_config.get("default") or [])
                    )
                else:
                    expected_dts.update(inst_config.get("default") or [])

            all_expected_dt.update(expected_dts)
            venue_results[date_str] = {
                "expected": list(expected_dts),
                "in_tick_window": in_tick_window,
            }

        venue_configs[v] = {
            "venue_results": venue_results,
            "all_expected_dt": all_expected_dt,
            "inst_folders": inst_folders,
        }

    # Parallel venue checking with ThreadPoolExecutor
    def check_venue(v: str) -> tuple[str, dict[str, object]]:
        config = venue_configs[v]
        detailed_results = cloud_client.check_venue_data_types_detailed(
            bucket_name=bucket,
            venue=v,
            dates=all_dates,
            expected_data_types=list(config["all_expected_dt"]),
            instrument_types=config["inst_folders"],
            max_workers=min(10, len(all_dates)),  # Parallel within venue
        )

        # Merge with expected
        venue_results = config["venue_results"].copy()
        for date_str in all_dates:
            venue_results[date_str]["actual"] = detailed_results.get(date_str, {})

        return v, venue_results

    if show_progress:
        click.echo(f"  Checking {len(venue_configs)} venues in parallel...")

    with ThreadPoolExecutor(max_workers=min(10, len(venue_configs))) as executor:
        futures = {executor.submit(check_venue, v): v for v in venue_configs}

        for future in as_completed(futures):
            v, venue_results = future.result()
            results_by_venue[v] = venue_results
            if show_progress:
                click.echo(f"    ✓ {v} complete")

    scan_time = time.time() - scan_start

    # Calculate statistics
    total_expected = 0
    total_found = 0
    venue_stats = {}

    for v, venue_results in results_by_venue.items():
        venue_expected = 0
        venue_found = 0
        missing_by_dt = {}
        data_types_detail = {}

        for date_str, date_info in venue_results.items():
            expected_dts = date_info.get("expected") or []
            actual_results = date_info.get("actual") or {}

            for dt in expected_dts:
                venue_expected += 1
                total_expected += 1

                # Track per data_type stats
                if dt not in data_types_detail:
                    data_types_detail[dt] = {
                        "expected": 0,
                        "found": 0,
                        "missing_dates": [],
                    }
                data_types_detail[dt]["expected"] += 1

                if actual_results.get(dt, {}).get("exists"):
                    venue_found += 1
                    total_found += 1
                    data_types_detail[dt]["found"] += 1
                else:
                    if dt not in missing_by_dt:
                        missing_by_dt[dt] = []
                    missing_by_dt[dt].append(date_str)
                    data_types_detail[dt]["missing_dates"].append(date_str)

        # Calculate percentage
        pct = (venue_found / venue_expected * 100) if venue_expected > 0 else 0

        venue_stats[v] = {
            "expected": venue_expected,
            "found": venue_found,
            "completion_percent": round(pct, 1),
            "missing_by_data_type": missing_by_dt,
            "data_types": {
                dt: {
                    "expected": info["expected"],
                    "found": info["found"],
                    "completion_percent": (
                        round(info["found"] / info["expected"] * 100, 1)
                        if info["expected"] > 0
                        else 0
                    ),
                    "missing_dates": info["missing_dates"],
                }
                for dt, info in data_types_detail.items()
            },
        }

    overall_pct = (total_found / total_expected * 100) if total_expected > 0 else 0

    # JSON output
    if output == "json":
        result = {
            "service": "market-tick-data-handler",
            "category": "TRADFI",
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "days": len(all_dates),
            "scan_time_seconds": round(scan_time, 2),
            "overall": {
                "completion_percent": round(overall_pct, 1),
                "expected": total_expected,
                "found": total_found,
            },
            "venues": venue_stats,
        }
        click.echo(json.dumps(result, indent=2))
        return

    # Tree output (default)
    click.echo(click.style(f"Scan complete in {scan_time:.1f}s", fg="green"))
    click.echo()

    for v, stats in venue_stats.items():
        pct = stats["completion_percent"]

        # Status icon
        if pct >= 100:
            status = click.style("✅", fg="green")
        elif pct >= 50:
            status = click.style("⏳", fg="yellow")
        else:
            status = click.style("🕐", fg="red")

        click.echo(f"{status} {v}: {stats['found']}/{stats['expected']} ({pct:.0f}%)")

        # Show missing data types
        if stats["missing_by_data_type"]:
            for dt, missing_dates in stats["missing_by_data_type"].items():
                if len(missing_dates) <= 3:
                    dates_str = ", ".join(missing_dates)
                else:
                    dates_str = f"{missing_dates[0]}, ... ({len(missing_dates)} dates)"
                click.echo(click.style(f"   └── {dt}: missing on {dates_str}", fg="red"))

    click.echo()
    click.echo("-" * 70)

    # Overall summary
    if overall_pct >= 100:
        click.echo(
            click.style(
                f"✅ Overall: {overall_pct:.1f}% ({total_found}/{total_expected})",
                fg="green",
                bold=True,
            )
        )
    else:
        click.echo(
            click.style(
                f"⏳ Overall: {overall_pct:.1f}% ({total_found}/{total_expected})",
                fg="yellow",
                bold=True,
            )
        )


def check_feature_groups_detailed(
    service: str,
    start_date: datetime,
    end_date: datetime,
    category: tuple[str, ...],
    config_dir: str,
    output: str = "tree",
):
    """
    Detailed feature_group checking for features-*-service.

    Checks each expected feature_group per category/date based on the
    sharding config dimensions. Shows completion percentage per feature_group.

    Supports output formats: tree, json, summary
    """
    _deployment_config = DeploymentConfig()
    scan_start = time.time()
    loader = ConfigLoader(config_dir)
    service_config = loader.load_service_config(service)
    cloud_client = CloudClient()
    gcs_config = SERVICE_GCS_CONFIGS.get(service) or {}

    show_progress = output != "json"

    # Get expected feature groups from sharding config
    expected_feature_groups = []
    supported_categories = ["CEFI", "TRADFI", "DEFI"]

    for dim in service_config.get("dimensions") or []:
        if dim["name"] == "feature_group" and dim["type"] == "fixed":
            expected_feature_groups = dim.get("values") or []
        elif dim["name"] == "category" and dim["type"] == "fixed":
            supported_categories = dim.get("values") or []

    # Special handling for features-calendar-service (no feature_group dimension)
    if service == "features-calendar-service":
        expected_feature_groups = ["temporal", "scheduled_events", "event_actuals"]

    if not expected_feature_groups:
        click.echo(click.style(f"No feature_group dimension found for {service}", fg="red"))
        return

    # Services with SHARED buckets (no category in bucket name) - only scan once
    shared_bucket_services = [
        "features-calendar-service",
        "features-onchain-service",
        "strategy-service",
    ]
    is_shared_bucket = service in shared_bucket_services

    # Filter categories
    if is_shared_bucket:
        # Shared bucket services: only need one "category" to scan (bucket is same for all)
        categories = ["ALL"]  # Use placeholder since bucket doesn't use category
    else:
        categories = list(category) if category else supported_categories
        categories = [c for c in categories if c in supported_categories]

    if not categories:
        click.echo(click.style(f"No valid categories for {service}", fg="red"))
        return

    # Generate date list
    all_dates = []
    current = start_date
    while current <= end_date:
        all_dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    if show_progress:
        click.echo()
        click.echo(f"FEATURE GROUP STATUS: {click.style(service, fg='cyan', bold=True)}")
        click.echo(
            f"Date Range: {start_date.strftime('%Y-%m-%d')}"
            f" to {end_date.strftime('%Y-%m-%d')} ({len(all_dates)} days)"
        )
        click.echo(f"Expected Feature Groups: {len(expected_feature_groups)}")
        click.echo("=" * 70)
        click.echo()

    results_by_category = {}

    for cat in categories:
        if show_progress:
            click.echo(f"Scanning {cat}...")

        # Build bucket name from SERVICE_GCS_CONFIGS
        bucket_template = gcs_config.get("bucket_template") or ""

        try:
            bucket = bucket_template.format(
                category=cat,
                category_lower=cat.lower(),
                project_id=_deployment_config.gcp_project_id,
            )
        except KeyError:
            if show_progress:
                click.echo(
                    click.style(f"  Could not format bucket template for {cat}", fg="yellow")
                )
            continue

        category_results = {}

        for date_str in all_dates:
            date_results = {}

            for fg in expected_feature_groups:
                # Build GCS path based on service
                if service == "features-calendar-service":
                    # Calendar service uses different path structure (key=value format)
                    prefix = f"calendar/category={fg}/by_date/day={date_str}/"
                else:
                    # Other features services: by_date/day={date}/feature_group={fg}/
                    prefix = f"by_date/day={date_str}/feature_group={fg}/"

                # Check if any files exist with this prefix
                exists = cloud_client.check_prefix_exists(bucket, prefix)

                date_results[fg] = {"exists": exists, "prefix": prefix}

            category_results[date_str] = date_results

        results_by_category[cat] = category_results

    scan_time = time.time() - scan_start

    # Calculate statistics
    stats_by_category = {}
    total_expected = 0
    total_found = 0

    for cat, cat_results in results_by_category.items():
        cat_feature_groups: dict[str, object] = {}
        cat_stats: dict[str, object] = {
            "feature_groups": cat_feature_groups,
            "total_expected": 0,
            "total_found": 0,
        }

        for fg in expected_feature_groups:
            fg_expected = len(all_dates)
            fg_found = sum(
                1
                for _, date_results in cat_results.items()
                if date_results.get(fg, {}).get("exists", False)
            )
            fg_missing = [
                date_str
                for date_str, date_results in cat_results.items()
                if not date_results.get(fg, {}).get("exists", False)
            ]

            cat_feature_groups[fg] = {
                "expected": fg_expected,
                "found": fg_found,
                "completion_percent": (
                    round(fg_found / fg_expected * 100, 1) if fg_expected > 0 else 0
                ),
                "missing_dates": (fg_missing[:10] if len(fg_missing) > 10 else fg_missing),
                "total_missing": len(fg_missing),
            }

            cat_stats["total_expected"] += fg_expected
            cat_stats["total_found"] += fg_found
            total_expected += fg_expected
            total_found += fg_found

        cat_stats["completion_percent"] = (
            round(cat_stats["total_found"] / cat_stats["total_expected"] * 100, 1)
            if cat_stats["total_expected"] > 0
            else 0
        )

        stats_by_category[cat] = cat_stats

    overall_pct = (total_found / total_expected * 100) if total_expected > 0 else 0

    # JSON output
    if output == "json":
        result = {
            "service": service,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "days": len(all_dates),
            "expected_feature_groups": expected_feature_groups,
            "scan_time_seconds": round(scan_time, 2),
            "overall": {
                "completion_percent": round(overall_pct, 1),
                "expected": total_expected,
                "found": total_found,
            },
            "categories": stats_by_category,
        }
        click.echo(json.dumps(result, indent=2))
        return

    # Tree output (default)
    click.echo(click.style(f"Scan complete in {scan_time:.1f}s", fg="green"))
    click.echo()

    for cat, cat_stats in stats_by_category.items():
        pct = cat_stats["completion_percent"]

        # Category header
        if pct >= 100:
            status = click.style("✅", fg="green")
        elif pct >= 50:
            status = click.style("⏳", fg="yellow")
        else:
            status = click.style("🕐", fg="red")

        click.echo(
            f"{status} {cat}: {cat_stats['total_found']}/{cat_stats['total_expected']} ({pct:.0f}%)"
        )

        # Show per-feature_group breakdown
        for fg, fg_stats in cat_stats["feature_groups"].items():
            fg_pct = fg_stats["completion_percent"]

            if fg_pct >= 100:
                fg_icon = click.style("✓", fg="green")
            elif fg_pct >= 50:
                fg_icon = click.style("○", fg="yellow")
            else:
                fg_icon = click.style("✗", fg="red")

            click.echo(
                f"   {fg_icon} {fg}: {fg_stats['found']}/{fg_stats['expected']} ({fg_pct:.0f}%)"
            )

            # Show missing dates if any
            if fg_stats["total_missing"] > 0:
                missing_preview = fg_stats["missing_dates"]
                if fg_stats["total_missing"] > 10:
                    dates_str = (
                        f"{', '.join(missing_preview[:3])}, ... ({fg_stats['total_missing']} dates)"
                    )
                else:
                    dates_str = ", ".join(missing_preview)
                click.echo(click.style(f"      └── missing: {dates_str}", fg="red", dim=True))

        click.echo()

    click.echo("-" * 70)

    # Overall summary
    if overall_pct >= 100:
        click.echo(
            click.style(
                f"✅ Overall: {overall_pct:.1f}% ({total_found}/{total_expected})",
                fg="green",
                bold=True,
            )
        )
    else:
        click.echo(
            click.style(
                f"⏳ Overall: {overall_pct:.1f}% ({total_found}/{total_expected})",
                fg="yellow",
                bold=True,
            )
        )


def check_timeframes_detailed(
    start_date: datetime,
    end_date: datetime,
    category: tuple[str, ...],
    venue: tuple[str, ...],
    config_dir: str,
    output: str = "tree",
):
    """
    Detailed timeframe checking for market-data-processing-service.

    Checks each expected timeframe per category/date. Shows completion
    percentage per timeframe. Expected timeframes: 15s, 1m, 5m, 15m, 1h, 4h, 24h

    Supports output formats: tree, json, summary
    """
    _deployment_config = DeploymentConfig()
    scan_start = time.time()
    ConfigLoader(config_dir)
    cloud_client = CloudClient()
    gcs_config = SERVICE_GCS_CONFIGS.get("market-data-processing-service") or {}

    show_progress = output != "json"

    # Expected timeframes
    expected_timeframes = gcs_config.get(
        "expected_timeframes", ["15s", "1m", "5m", "15m", "1h", "4h", "24h"]
    )

    # Filter categories
    categories = list(category) if category else ["CEFI", "TRADFI", "DEFI"]

    # Generate date list
    all_dates = []
    current = start_date
    while current <= end_date:
        all_dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    if show_progress:
        click.echo()
        click.echo(
            "TIMEFRAME STATUS: "
            + click.style("market-data-processing-service", fg="cyan", bold=True)
        )
        click.echo(
            f"Date Range: {start_date.strftime('%Y-%m-%d')}"
            f" to {end_date.strftime('%Y-%m-%d')} ({len(all_dates)} days)"
        )
        click.echo(f"Expected Timeframes: {', '.join(expected_timeframes)}")
        click.echo("=" * 70)
        click.echo()

    results_by_category = {}

    for cat in categories:
        if show_progress:
            click.echo(f"Scanning {cat}...")

        # Build bucket name
        bucket = f"market-data-tick-{cat.lower()}-{_deployment_config.gcp_project_id}"

        category_results = {}

        for date_str in all_dates:
            date_results = {}

            for tf in expected_timeframes:
                # Path: processed_candles/by_date/day={date}/timeframe={timeframe}/
                prefix = f"processed_candles/by_date/day={date_str}/timeframe={tf}/"

                # Check if any files exist with this prefix
                exists = cloud_client.check_prefix_exists(bucket, prefix)

                date_results[tf] = {"exists": exists, "prefix": prefix}

            category_results[date_str] = date_results

        results_by_category[cat] = category_results

    scan_time = time.time() - scan_start

    # Calculate statistics
    stats_by_category = {}
    total_expected = 0
    total_found = 0

    for cat, cat_results in results_by_category.items():
        cat_timeframes: dict[str, object] = {}
        cat_stats: dict[str, object] = {
            "timeframes": cat_timeframes,
            "total_expected": 0,
            "total_found": 0,
        }

        for tf in expected_timeframes:
            tf_expected = len(all_dates)
            tf_found = sum(
                1
                for _, date_results in cat_results.items()
                if date_results.get(tf, {}).get("exists", False)
            )
            tf_missing = [
                date_str
                for date_str, date_results in cat_results.items()
                if not date_results.get(tf, {}).get("exists", False)
            ]

            cat_timeframes[tf] = {
                "expected": tf_expected,
                "found": tf_found,
                "completion_percent": (
                    round(tf_found / tf_expected * 100, 1) if tf_expected > 0 else 0
                ),
                "missing_dates": (tf_missing[:10] if len(tf_missing) > 10 else tf_missing),
                "total_missing": len(tf_missing),
            }

            cat_stats["total_expected"] += tf_expected
            cat_stats["total_found"] += tf_found
            total_expected += tf_expected
            total_found += tf_found

        cat_stats["completion_percent"] = (
            round(cat_stats["total_found"] / cat_stats["total_expected"] * 100, 1)
            if cat_stats["total_expected"] > 0
            else 0
        )

        stats_by_category[cat] = cat_stats

    overall_pct = (total_found / total_expected * 100) if total_expected > 0 else 0

    # JSON output
    if output == "json":
        result = {
            "service": "market-data-processing-service",
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "days": len(all_dates),
            "expected_timeframes": expected_timeframes,
            "scan_time_seconds": round(scan_time, 2),
            "overall": {
                "completion_percent": round(overall_pct, 1),
                "expected": total_expected,
                "found": total_found,
            },
            "categories": stats_by_category,
        }
        click.echo(json.dumps(result, indent=2))
        return

    # Tree output (default)
    click.echo(click.style(f"Scan complete in {scan_time:.1f}s", fg="green"))
    click.echo()

    for cat, cat_stats in stats_by_category.items():
        pct = cat_stats["completion_percent"]

        # Category header
        if pct >= 100:
            status = click.style("✅", fg="green")
        elif pct >= 50:
            status = click.style("⏳", fg="yellow")
        else:
            status = click.style("🕐", fg="red")

        click.echo(
            f"{status} {cat}: {cat_stats['total_found']}/{cat_stats['total_expected']} ({pct:.0f}%)"
        )

        # Show per-timeframe breakdown
        for tf, tf_stats in cat_stats["timeframes"].items():
            tf_pct = tf_stats["completion_percent"]

            if tf_pct >= 100:
                tf_icon = click.style("✓", fg="green")
            elif tf_pct >= 50:
                tf_icon = click.style("○", fg="yellow")
            else:
                tf_icon = click.style("✗", fg="red")

            click.echo(
                f"   {tf_icon} {tf}: {tf_stats['found']}/{tf_stats['expected']} ({tf_pct:.0f}%)"
            )

            # Show missing dates if any
            if tf_stats["total_missing"] > 0:
                missing_preview = tf_stats["missing_dates"]
                if tf_stats["total_missing"] > 10:
                    dates_str = (
                        f"{', '.join(missing_preview[:3])}, ... ({tf_stats['total_missing']} dates)"
                    )
                else:
                    dates_str = ", ".join(missing_preview)
                click.echo(click.style(f"      └── missing: {dates_str}", fg="red", dim=True))

        click.echo()

    click.echo("-" * 70)

    # Overall summary
    if overall_pct >= 100:
        click.echo(
            click.style(
                f"✅ Overall: {overall_pct:.1f}% ({total_found}/{total_expected})",
                fg="green",
                bold=True,
            )
        )
    else:
        click.echo(
            click.style(
                f"⏳ Overall: {overall_pct:.1f}% ({total_found}/{total_expected})",
                fg="yellow",
                bold=True,
            )
        )
