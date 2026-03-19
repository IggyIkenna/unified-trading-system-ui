"""Scanning functions for data status display.

This module contains all the scanning-related helper functions used by the data status
display modules.
"""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

import click

logger = logging.getLogger(__name__)


def scan_venues_fast_mode(
    categories: list[str],
    bucket_info: dict[str, object],
    category_valid_dates: dict[str, object],
    all_dates: list[str],
    venues_config: dict[str, object],
    venue: tuple[str, ...],
    loader,
    service: str,
    gcs_config: dict[str, object],
    cloud_client,
    detailed: bool,
    _deployment_config,
) -> dict[str, object]:
    """Handle fast mode scanning for venues."""
    fast_results = {}

    for cat in categories:
        if cat not in bucket_info:
            continue
        info = bucket_info[cat]
        all_cat_venues = (
            list(venue)
            if venue
            else venues_config.get("categories") or {}.get(cat, {}).get("venues") or []
        )

        # Filter venues by their start dates - exclude venues launched AFTER the date range
        # Use the first requested date (start_date) to determine which venues should have data
        first_date = all_dates[0] if all_dates else None
        cat_venues = []
        excluded_venues = []

        if first_date:
            for v in all_cat_venues:
                venue_start = loader.get_venue_start_date(service, cat, v)
                if venue_start and venue_start > first_date:
                    excluded_venues.append((v, venue_start))
                else:
                    cat_venues.append(v)

            if excluded_venues:
                click.echo(
                    f"  {cat}: Excluding {len(excluded_venues)} venues launched after {first_date}:"
                )
                for v, start_dt in excluded_venues:
                    click.echo(click.style(f"    - {v} (launched {start_dt})", dim=True))

        # Build prefix template with venue
        path_template = info["path_template"]

        # Handle complex templates with additional dimensions (e.g., data_type)
        if "{timeframe}" in path_template:
            # market-data-processing-service: check all 7 timeframes and optionally data_types
            fast_results[cat] = check_timeframes_for_venues(
                cat,
                cat_venues,
                category_valid_dates,
                all_dates,
                gcs_config,
                info,
                cloud_client,
                detailed,
                loader,
                _deployment_config,
            )
        elif "{data_type}" in path_template:
            # market-tick-data-handler: venue-specific prefix search
            fast_results[cat] = check_data_types_for_venues(
                cat, cat_venues, category_valid_dates, path_template, info, cloud_client
            )
        elif "{venue}" in path_template:
            # General venue-based checking
            prefix_template = path_template.replace("{date}", "{date}").replace(
                "{venue}", "{venue}"
            )
            click.echo(f"  Checking {cat}: {len(cat_venues)} venues x {len(all_dates)} dates...")

            valid_dates = category_valid_dates.get(cat, all_dates)
            fast_results[cat] = cloud_client.check_venue_dates_fast(
                bucket_name=info["bucket"],
                prefix_template=prefix_template,
                venues=cat_venues,
                dates=valid_dates,
                file_pattern="*.parquet",
                max_workers=50,
            )
        else:
            # No venue in path - shouldn't hit this in this branch
            click.echo(f"  Checking {cat}: {len(all_dates)} dates...")

            valid_dates = category_valid_dates.get(cat, all_dates)
            result = cloud_client.check_dates_exist_fast(
                bucket_name=info["bucket"],
                prefix_template=path_template.split("{date}")[0] + "day={date}/",
                dates=valid_dates,
                file_pattern="*.parquet",
                max_workers=20,
            )
            fast_results[cat] = {"ALL": result}

    return fast_results


def scan_dates_fast_mode(
    categories: list[str],
    bucket_info: dict[str, object],
    category_valid_dates: dict[str, object],
    cloud_client,
    num_days: int,
) -> dict[str, object]:
    """Handle fast mode scanning for dates without venues."""
    fast_results = {}

    for cat in categories:
        if cat not in bucket_info:
            continue
        info = bucket_info[cat]
        path_template = info["path_template"]

        # Build prefix template (key=value format)
        if "{date}" in path_template:
            prefix_template = path_template.split("{date}")[0] + "day={date}/"
        else:
            prefix_template = "by_date/day={date}/"

        click.echo(f"  Checking {cat}: {num_days} dates...")

        valid_dates = category_valid_dates.get(cat, [])
        result = cloud_client.check_dates_exist_fast(
            bucket_name=info["bucket"],
            prefix_template=prefix_template,
            dates=valid_dates,
            file_pattern="*.parquet",
            max_workers=20,
        )
        fast_results[cat] = {"ALL": result}

    return fast_results


def scan_buckets_batch_mode(
    categories: list[str],
    bucket_info: dict[str, object],
    cloud_client,
) -> dict[str, object]:
    """Handle batch mode bucket scanning."""
    bucket_paths = []
    bucket_to_category = {}

    for cat in categories:
        if cat not in bucket_info:
            continue
        info = bucket_info[cat]
        path_template = info["path_template"]

        prefix = (
            path_template.split("{date}")[0]
            if "{date}" in path_template
            else path_template.split("/")[0] + "/"
        )

        gcs_path = f"gs://{info['bucket']}/{prefix}"  # noqa: gs-uri — CLI data status scanner builds GCS paths for bucket scanning
        bucket_paths.append(gcs_path)
        bucket_to_category[gcs_path] = cat

    def progress_cb(path: str, completed: int, total: int):
        cat = bucket_to_category.get(path, "?")
        click.echo(f"  [{completed}/{total}] Scanned {cat}...")

    bucket_indexes = cloud_client.parallel_scan_buckets(
        bucket_paths,
        pattern="*.parquet",
        max_workers=max(1, min(8, len(bucket_paths))),
        progress_callback=progress_cb if len(bucket_paths) > 1 else None,
    )

    return bucket_indexes


def check_timeframes_for_venues(
    cat: str,
    cat_venues: list[str],
    category_valid_dates: dict[str, object],
    all_dates: list[str],
    gcs_config: dict[str, object],
    info: dict[str, object],
    cloud_client,
    detailed: bool,
    loader,
    _deployment_config,
) -> dict[str, object]:
    """Check timeframes for market-data-processing-service venues."""
    expected_timeframes = gcs_config.get(
        "expected_timeframes", ["15s", "1m", "5m", "15m", "1h", "4h", "24h"]
    )
    expected_data_types_by_cat = gcs_config.get("expected_data_types") or {}
    expected_data_types = expected_data_types_by_cat.get(cat, [])
    total_tf = len(expected_timeframes)
    total_dt = len(expected_data_types)

    if detailed and expected_data_types:
        click.echo(
            f"  Checking {cat}: {len(cat_venues)} venues x {len(all_dates)} dates"
            f" x {total_tf} timeframes x {total_dt} data_types..."
        )
    else:
        click.echo(
            f"  Checking {cat}: {len(cat_venues)} venues x {len(all_dates)} dates"
            f" x {total_tf} timeframes..."
        )

    venue_results = {}
    valid_dates = category_valid_dates.get(cat, all_dates)

    # Store detailed breakdown at category level
    category_tf_breakdown = {tf: {"complete": 0, "total": 0} for tf in expected_timeframes}
    category_dt_breakdown = {dt: {"complete": 0, "total": 0} for dt in expected_data_types}

    # Get venue-specific data type expectations (uses tick_window logic)
    first_date = valid_dates[0] if valid_dates else all_dates[0]
    venue_expected_dt = loader.get_all_venue_data_type_expectations(cat, first_date)

    def check_venue_timeframes_detailed(venue_name):
        """Check all timeframes (and optionally data_types) for a venue across dates."""
        date_results = {}
        venue_tf_stats = dict.fromkeys(expected_timeframes, 0)  # tf -> days complete
        venue_dt_stats = dict.fromkeys(expected_data_types, 0)  # dt -> days complete

        # Get expected data types for THIS venue
        venue_specific_dt = venue_expected_dt.get(venue_name, expected_data_types)
        bucket = cloud_client.client.bucket(info["bucket"])

        def check_single_date(date_str):
            """Check all timeframes for a single date (runs in parallel)."""
            tf_found = 0
            tf_details = {}  # tf -> bool
            dt_details = {}  # dt -> count of timeframes where found

            for tf in expected_timeframes:
                # Check if timeframe folder has venue data (key=value format)
                prefix = f"processed_candles/by_date/day={date_str}/timeframe={tf}/"
                tf_exists = False
                dt_found_in_tf = set()

                try:
                    match_glob = f"{prefix}**/{venue_name}/*.parquet"
                    blobs = list(bucket.list_blobs(match_glob=match_glob, max_results=1))
                    if blobs:
                        tf_exists = True
                        tf_found += 1

                    # Check each data_type folder specifically (only those expected for this venue)
                    if detailed and venue_specific_dt:
                        for dt in venue_specific_dt:
                            dt_prefix = f"{prefix}data_type={dt}/"
                            dt_glob = f"{dt_prefix}**/{venue_name}/*.parquet"
                            dt_blobs = list(bucket.list_blobs(match_glob=dt_glob, max_results=1))
                            if dt_blobs:
                                dt_found_in_tf.add(dt)
                except OSError as e:
                    # Failed to list blobs - likely network or permissions issue
                    # Log and continue with next timeframe
                    logger.warning(
                        "Failed to list blobs for venue %s on %s timeframe %s: %s",
                        venue_name,
                        date_str,
                        tf,
                        e,
                    )
                except (ValueError, KeyError) as e:
                    # Invalid bucket configuration or path template
                    logger.warning(
                        "Invalid bucket configuration for venue %s on %s: %s",
                        venue_name,
                        date_str,
                        e,
                    )
                except RuntimeError as e:
                    # Other unexpected errors - log but continue
                    logger.warning(
                        "Unexpected error checking venue %s on %s timeframe %s: %s",
                        venue_name,
                        date_str,
                        tf,
                        e,
                    )

                tf_details[tf] = tf_exists

                # Track data_type presence (count timeframes where found)
                for dt in dt_found_in_tf:
                    if dt not in dt_details:
                        dt_details[dt] = 0
                    dt_details[dt] += 1

            return (date_str, tf_found, tf_details, dt_details)

        # Parallelize date checks within this venue (up to 10 concurrent)
        with ThreadPoolExecutor(max_workers=min(10, len(valid_dates))) as date_executor:
            date_futures = {date_executor.submit(check_single_date, d): d for d in valid_dates}
            for future in as_completed(date_futures):
                date_str, tf_found, tf_details, dt_details = future.result()

                # Update timeframe stats
                for tf, exists in tf_details.items():
                    if exists:
                        venue_tf_stats[tf] += 1

                # Update data_type stats (complete = found in all timeframes)
                for dt in venue_specific_dt:
                    if dt_details.get(dt, 0) == total_tf:
                        venue_dt_stats[dt] += 1

                # Complete only if ALL timeframes have data
                date_results[date_str] = {
                    "exists": tf_found == total_tf,
                    "file_count": tf_found,
                    "timeframes_complete": f"{tf_found}/{total_tf}",
                    "tf_details": tf_details if detailed else None,
                    "dt_details": dt_details if detailed else None,
                }

        # Return expected data types for this venue for proper total calculation
        return (venue_name, date_results, venue_tf_stats, venue_dt_stats, venue_specific_dt)

    # Process venues in parallel
    with ThreadPoolExecutor(max_workers=min(10, len(cat_venues))) as executor:
        futures = {executor.submit(check_venue_timeframes_detailed, v): v for v in cat_venues}
        for future in as_completed(futures):
            venue_name, result, tf_stats, dt_stats, venue_specific_dt = future.result()
            venue_results[venue_name] = result

            # Aggregate timeframe breakdown
            for tf, count in tf_stats.items():
                category_tf_breakdown[tf]["complete"] += count
                category_tf_breakdown[tf]["total"] += len(valid_dates)

            # Aggregate data_type breakdown (only for data types this venue should have)
            for dt in venue_specific_dt:
                if dt in category_dt_breakdown:
                    category_dt_breakdown[dt]["complete"] += dt_stats.get(dt, 0)
                    category_dt_breakdown[dt]["total"] += len(valid_dates)

    return venue_results


def check_data_types_for_venues(
    cat: str,
    cat_venues: list[str],
    category_valid_dates: dict[str, object],
    path_template: str,
    info: dict[str, object],
    cloud_client,
) -> dict[str, object]:
    """Check data types for market-tick-data-handler venues."""
    # market-tick-data-handler: venue-specific prefix search (key=value format)
    if "/day={date}/" in path_template or "/day-{date}/" in path_template:
        sep = "/day={date}/" if "/day={date}/" in path_template else "/day-{date}/"
        prefix_template = path_template.split(sep)[0] + "/day={date}/"
    else:
        prefix_template = path_template.split("{date}")[0] + "day={date}/"

    click.echo(
        f"  Checking {cat}: {len(cat_venues)} venues"
        f" x {len(category_valid_dates.get(cat, []))} dates (venue-specific search)..."
    )

    venue_results = {}
    valid_dates = category_valid_dates.get(cat, [])

    def check_one_venue(venue_name):
        """Check one venue's dates."""
        return (
            venue_name,
            cloud_client.check_venue_in_dates_fast(
                bucket_name=info["bucket"],
                prefix_template=prefix_template,
                venue=venue_name,
                dates=valid_dates,
                max_workers=10,
            ),
        )

    # Process venues in parallel
    with ThreadPoolExecutor(max_workers=min(10, len(cat_venues))) as executor:
        futures = {executor.submit(check_one_venue, v): v for v in cat_venues}
        for future in as_completed(futures):
            venue_name, result = future.result()
            venue_results[venue_name] = result

    return venue_results
