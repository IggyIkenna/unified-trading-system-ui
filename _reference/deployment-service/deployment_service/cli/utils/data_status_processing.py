"""Result processing functions for data status display.

This module contains functions that process scan results into the display hierarchy.
"""

import re
from typing import cast


def process_fast_results(
    fast_results: dict[str, object],
    categories: list[str],
    category_valid_dates: dict[str, object],
    category_excluded: dict[str, object],
    has_venue_dimension: bool,
    venues_config: dict[str, object],
    venue: tuple[str, ...],
    loader,
    service: str,
    hierarchy: dict[str, dict[str, dict[str, object]]],
    show_timestamps: bool,
) -> tuple[int, int, int]:
    """Process fast scan results into hierarchy."""
    overall_complete = 0
    overall_total = 0
    overall_excluded = 0

    for cat in categories:
        if cat not in fast_results:
            continue

        valid_dates = category_valid_dates.get(cat, [])
        excluded_count = category_excluded.get(cat, 0)

        if has_venue_dimension:
            cat_venues = (
                list(venue)
                if venue
                else venues_config.get("categories") or {}.get(cat, {}).get("venues") or []
            )
        else:
            cat_venues = ["ALL"]

        for v in cat_venues:
            venue_results = fast_results[cat].get(v, {})

            # Get venue-specific start date if available
            venue_start = loader.get_venue_start_date(service, cat, v)
            if venue_start and v != "ALL":
                venue_valid_dates = [d for d in valid_dates if d >= venue_start]
                venue_excluded = len(valid_dates) - len(venue_valid_dates)
            else:
                venue_valid_dates = valid_dates
                venue_excluded = 0

            missing_dates = []
            oldest_updated = None
            newest_updated = None

            venue_entry = hierarchy[cat][v]
            for date_str in venue_valid_dates:
                venue_entry["total"] = int(cast(int, venue_entry["total"])) + 1
                overall_total += 1

                date_info = venue_results.get(date_str, {})
                if date_info.get("exists", False):
                    venue_entry["complete"] = int(cast(int, venue_entry["complete"])) + 1
                    overall_complete += 1

                    # Track timestamps
                    date_oldest = date_info.get("oldest_updated")
                    date_newest = date_info.get("newest_updated")
                    if date_oldest and (oldest_updated is None or date_oldest < oldest_updated):
                        oldest_updated = date_oldest
                    if date_newest and (newest_updated is None or date_newest > newest_updated):
                        newest_updated = date_newest
                else:
                    missing_dates.append(date_str)

            venue_entry["excluded"] = venue_excluded + excluded_count
            venue_entry["missing_dates"] = missing_dates
            venue_entry["oldest"] = oldest_updated
            venue_entry["newest"] = newest_updated
            overall_excluded += venue_excluded

    return overall_complete, overall_total, overall_excluded


def process_batch_results(
    bucket_indexes: dict[str, object],
    categories: list[str],
    bucket_info: dict[str, object],
    category_valid_dates: dict[str, object],
    category_excluded: dict[str, object],
    has_venue_dimension: bool,
    venues_config: dict[str, object],
    venue: tuple[str, ...],
    loader,
    service: str,
    hierarchy: dict[str, dict[str, dict[str, object]]],
    show_timestamps: bool,
    all_dates: list[str],
) -> tuple[int, int, int]:
    """Process batch scan results into hierarchy."""
    overall_complete = 0
    overall_total = 0
    overall_excluded = 0

    bucket_to_category = {
        (
            f"gs://{bucket_info[cat]['bucket']}/"  # noqa: gs-uri — CLI data status builds GCS bucket paths for category mapping
            + (
                bucket_info[cat]["path_template"].split("{date}")[0]
                if "{date}" in bucket_info[cat]["path_template"]
                else ""
            )
        ): cat
        for cat in categories
        if cat in bucket_info
    }

    for gcs_path, index in bucket_indexes.items():
        cat = bucket_to_category.get(gcs_path)
        if not cat:
            # Try to find category from path
            for c in categories:
                if c.lower() in gcs_path.lower():
                    cat = c
                    break
        if not cat:
            continue

        # Get valid dates for this category (filtered by expected start date)
        valid_dates = category_valid_dates.get(cat, all_dates)
        valid_dates_set = set(valid_dates)
        excluded_count = category_excluded.get(cat, 0)

        if has_venue_dimension:
            cat_venues = (
                list(venue)
                if venue
                else venues_config.get("categories") or {}.get(cat, {}).get("venues") or []
            )
        else:
            cat_venues = ["ALL"]

        # Filter dates to only those in our valid range (already filtered by expected start)
        dates_in_bucket = index.dates_found & valid_dates_set

        # For services without venue dimension, just check dates
        if not has_venue_dimension or cat_venues == ["ALL"]:
            all_entry = hierarchy[cat]["ALL"]
            missing_dates = []
            for date_str in valid_dates:
                all_entry["total"] = int(cast(int, all_entry["total"])) + 1
                overall_total += 1
                if date_str in dates_in_bucket:
                    all_entry["complete"] = int(cast(int, all_entry["complete"])) + 1
                    overall_complete += 1
                else:
                    missing_dates.append(date_str)

            all_entry["excluded"] = excluded_count
            all_entry["missing_dates"] = missing_dates
            overall_excluded += int(cast(int, excluded_count))

            # Get timestamps from index
            if show_timestamps:
                stats = index.get_stats()
                all_entry["oldest"] = stats.oldest_update_time
                all_entry["newest"] = stats.newest_update_time
        else:
            # For services with venue dimension, check each venue
            for v in cat_venues:
                # Get venue-specific start date if available
                venue_start = loader.get_venue_start_date(service, cat, v)
                if venue_start:
                    venue_valid_dates = [d for d in valid_dates if d >= venue_start]
                    venue_excluded = len(valid_dates) - len(venue_valid_dates)
                else:
                    venue_valid_dates = valid_dates
                    venue_excluded = 0

                set(venue_valid_dates)

                # Filter blobs for this venue
                venue_blobs = [b for b in index.blobs if v.lower() in b["name"].lower()]
                venue_dates = set()
                for b in venue_blobs:
                    match = re.search(r"day=(\d{4}-\d{2}-\d{2})", b["name"])
                    if match:
                        venue_dates.add(match.group(1))

                # Only count valid dates (after venue start date)
                venue_entry = hierarchy[cat][v]
                missing_dates = []
                for date_str in venue_valid_dates:
                    venue_entry["total"] = int(cast(int, venue_entry["total"])) + 1
                    overall_total += 1
                    if date_str in venue_dates:
                        venue_entry["complete"] = int(cast(int, venue_entry["complete"])) + 1
                        overall_complete += 1
                    else:
                        missing_dates.append(date_str)

                venue_entry["excluded"] = venue_excluded + excluded_count
                venue_entry["missing_dates"] = missing_dates
                overall_excluded += venue_excluded

                # Get timestamps for this venue
                if show_timestamps and venue_blobs:
                    oldest = None
                    newest = None
                    for b in venue_blobs:
                        updated = b.get("updated")
                        if updated:
                            if oldest is None or updated < oldest:
                                oldest = updated
                            if newest is None or updated > newest:
                                newest = updated
                    hierarchy[cat][v]["oldest"] = oldest
                    hierarchy[cat][v]["newest"] = newest

    return overall_complete, overall_total, overall_excluded
