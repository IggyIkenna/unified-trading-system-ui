"""
Query engine functions for batch data processing.

Contains specialized and generic query engines for retrieving data
from cloud storage with optimized parallel processing.
"""

import logging
from collections.abc import Mapping
from concurrent.futures import Future, ThreadPoolExecutor
from datetime import UTC, datetime
from typing import cast

from deployment_api.utils.path_combinatorics import CombinatoricEntry, get_path_combinatorics
from deployment_api.utils.storage_facade import list_objects

from .batch_config_utils import (
    BUCKET_MAPPING,
    get_category_start_date,
)

logger = logging.getLogger(__name__)

# Type aliases for tracking dicts used in combinatoric query functions
_VenueTimeframes = dict[str, dict[str, set[str]]]
_VenueDateTs = dict[str, dict[str, datetime]]


def _accumulate_combo_result(
    date_str: str,
    combo: "CombinatoricEntry",
    blob_updated: datetime | None,
    found_dates: set[str],
    venue_data: dict[str, set[str]],
    sub_dimension_data: dict[str, set[str]],
    inst_type_data: dict[str, set[str]],
    venue_data_types: dict[str, dict[str, set[str]]],
    venue_folders: dict[str, dict[str, set[str]]],
    timeframe_data: dict[str, set[str]],
    venue_timeframes: _VenueTimeframes,
    venue_date_blob_timestamps: _VenueDateTs,
) -> None:
    """Accumulate a successful combinatoric prefix result into all tracking dicts."""
    found_dates.add(date_str)
    venue_data.setdefault(combo.venue, set()).add(date_str)
    sub_dimension_data.setdefault(combo.data_type, set()).add(date_str)
    inst_type_data.setdefault(combo.folder, set()).add(date_str)
    venue_data_types.setdefault(combo.venue, {}).setdefault(combo.data_type, set()).add(date_str)
    venue_folders.setdefault(combo.venue, {}).setdefault(combo.folder, set()).add(date_str)
    if combo.timeframe:
        timeframe_data.setdefault(combo.timeframe, set()).add(date_str)
        venue_timeframes.setdefault(combo.venue, {}).setdefault(combo.timeframe, set()).add(
            date_str
        )
    if blob_updated is not None:
        existing_ts = venue_date_blob_timestamps.get(combo.venue, {}).get(date_str)
        if existing_ts is None or blob_updated < existing_ts:
            venue_date_blob_timestamps.setdefault(combo.venue, {})[date_str] = blob_updated


def _build_prefixes_by_date(
    combos: list["CombinatoricEntry"],
    dates_to_check: set[str],
    path_combinatorics: object,
    service: str,
) -> dict[str, list[tuple[str, "CombinatoricEntry"]]]:
    """Build mapping of date -> list of (prefix, combo) to query."""
    prefixes_by_date: dict[str, list[tuple[str, CombinatoricEntry]]] = {}
    is_in_tick_window_fn = getattr(path_combinatorics, "is_in_tick_window", None)
    get_base_prefix_fn = getattr(path_combinatorics, "get_base_prefix", None)
    for date_str in dates_to_check:
        prefixes: list[tuple[str, CombinatoricEntry]] = []
        in_tick_window = bool(callable(is_in_tick_window_fn) and is_in_tick_window_fn(date_str))
        base_prefix: str = (
            cast(str, get_base_prefix_fn(service)) if callable(get_base_prefix_fn) else ""
        )
        for combo in combos:
            if combo.start_date:
                try:
                    start_dt = datetime.strptime(combo.start_date, "%Y-%m-%d").replace(tzinfo=UTC)
                    if datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=UTC) < start_dt:
                        continue
                except ValueError as e:
                    logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)
            if combo.tick_window_only and not in_tick_window:
                continue
            prefix = combo.to_gcs_prefix(date_str, base_prefix)
            prefixes.append((prefix, combo))
        if prefixes:
            prefixes_by_date[date_str] = prefixes
    return prefixes_by_date


def query_specific_prefixes_for_category(
    service: str,
    cat: str,
    dates_to_check: set[str],
    venue: list[str] | None,
    folder: list[str] | None,
    data_type: list[str] | None,
    path_prefix: str,
    expected_start_dates_config: Mapping[str, object],
    all_dates: set[str],
    upstream_avail_dates: dict[str, dict[str, set[str]]] | None = None,
) -> dict[str, object]:
    """
    Use PathCombinatorics to query specific GCS prefixes in parallel.

    This is MUCH faster than hierarchical scanning when we know the exact
    combinatorics of (data_type, folder, venue) that are valid.

    Returns:
        Dict with found_dates, venue_data, sub_dimension_data, etc.
    """
    bucket_name = BUCKET_MAPPING[service].get(cat)
    if not bucket_name:
        return {"error": f"No bucket for category {cat}"}

    path_combinatorics = get_path_combinatorics()
    combos = path_combinatorics.get_combinatorics(
        category=cat,
        venues=venue,
        folders=folder,
        data_types=data_type,
        service=service,
    )

    if not combos:
        logger.warning("[TURBO] No valid combinatorics for %s with venue=%s", cat, venue)
        return {
            "found_dates": set(),
            "venue_data": {},
            "sub_dimension_data": {},
            "inst_type_data": {},
            "venue_data_types": {},
            "venue_folders": {},
            "timeframe_data": {},
        }

    prefixes_by_date = _build_prefixes_by_date(combos, dates_to_check, path_combinatorics, service)

    # Tracking dicts
    found_dates: set[str] = set()
    venue_data: dict[str, set[str]] = {}
    sub_dimension_data: dict[str, set[str]] = {}
    inst_type_data: dict[str, set[str]] = {}
    timeframe_data: dict[str, set[str]] = {}
    venue_data_types: dict[str, dict[str, set[str]]] = {}
    venue_folders: dict[str, dict[str, set[str]]] = {}
    venue_timeframes: _VenueTimeframes = {}
    venue_date_blob_timestamps: _VenueDateTs = {}

    total_queries = sum(len(p) for p in prefixes_by_date.values())
    logger.info(
        "[TURBO] Querying %s specific prefixes for %s (%s dates, %s combos per date)",
        total_queries,
        cat,
        len(prefixes_by_date),
        len(combos),
    )

    with ThreadPoolExecutor(max_workers=100) as executor:
        all_futures: list[tuple[object, str]] = []
        for date_str, prefix_combos in prefixes_by_date.items():
            for prefix, combo in prefix_combos:
                future = executor.submit(
                    _check_specific_prefix, bucket_name, path_prefix, prefix, combo
                )
                all_futures.append((future, date_str))

        for future_obj, date_str in all_futures:
            try:
                typed_future: Future[tuple[bool, CombinatoricEntry, datetime | None]] = cast(
                    Future[tuple[bool, CombinatoricEntry, datetime | None]],
                    future_obj,
                )
                has_data, combo, blob_updated = typed_future.result(timeout=30)
                if has_data:
                    _accumulate_combo_result(
                        date_str,
                        combo,
                        blob_updated,
                        found_dates,
                        venue_data,
                        sub_dimension_data,
                        inst_type_data,
                        venue_data_types,
                        venue_folders,
                        timeframe_data,
                        venue_timeframes,
                        venue_date_blob_timestamps,
                    )
            except (OSError, ValueError, RuntimeError) as e:
                logger.debug("Query failed: %s", e)

    logger.info(
        "[TURBO] Found data in %s dates, %s venues, %s data_types, %s folders, %s timeframes",
        len(found_dates),
        len(venue_data),
        len(sub_dimension_data),
        len(inst_type_data),
        len(timeframe_data),
    )

    return {
        "found_dates": found_dates,
        "venue_data": venue_data,
        "sub_dimension_data": sub_dimension_data,
        "inst_type_data": inst_type_data,
        "venue_data_types": venue_data_types,
        "venue_folders": venue_folders,
        "timeframe_data": timeframe_data,
        "venue_timeframes": venue_timeframes,
        "venue_date_blob_timestamps": venue_date_blob_timestamps,
    }


def _check_specific_prefix(
    bucket_name: str, path_prefix: str, prefix: str, combo: "CombinatoricEntry"
) -> tuple[bool, "CombinatoricEntry", datetime | None]:
    """Check if a specific prefix has data. Returns (has_data, combo, oldest_blob_updated)."""
    try:
        effective_prefix = (path_prefix + prefix) if path_prefix else prefix
        blobs = list_objects(bucket_name, effective_prefix, max_results=50)
        if blobs:
            oldest = min(
                (b.updated for b in blobs if b.updated is not None),
                default=None,
            )
            return (True, combo, oldest)
        return (False, combo, None)
    except (OSError, ValueError, RuntimeError) as e:
        logger.debug("Prefix check failed for %s: %s", prefix, e)
        return (False, combo, None)


def _check_prefix_generic(
    bucket_name: str, path_prefix: str, prefix: str
) -> tuple[bool, datetime | None]:
    """Quick existence check for a prefix, returns (has_data, oldest_blob_updated)."""
    try:
        effective_prefix = (path_prefix + prefix) if path_prefix else prefix
        blobs = list_objects(bucket_name, effective_prefix, max_results=50)
        if blobs:
            oldest = min(
                (b.updated for b in blobs if b.updated is not None),
                default=None,
            )
            return (True, oldest)
        return (False, None)
    except (OSError, ValueError, RuntimeError) as e:
        logger.debug("Prefix check failed for %s: %s", prefix, e)
        return (False, None)


def _accumulate_generic_result(
    date_str: str,
    sub_dim_value: str | None,
    blob_updated: datetime | None,
    service: str,
    found_dates: set[str],
    sub_dimension_data: dict[str, set[str]],
    venue_data: dict[str, set[str]],
    venue_date_blob_timestamps: _VenueDateTs,
) -> None:
    """Accumulate a successful generic prefix result into tracking dicts."""
    found_dates.add(date_str)
    if sub_dim_value:
        sub_dimension_data.setdefault(sub_dim_value, set()).add(date_str)
    if service == "instruments-service" and sub_dim_value:
        venue_data.setdefault(sub_dim_value, set()).add(date_str)
    venue_key = sub_dim_value or "_all"
    if blob_updated is not None:
        existing_ts = venue_date_blob_timestamps.get(venue_key, {}).get(date_str)
        if existing_ts is None or blob_updated < existing_ts:
            venue_date_blob_timestamps.setdefault(venue_key, {})[date_str] = blob_updated


def query_generic_prefixes_for_category(
    service: str,
    cat: str,
    dates_to_check: set[str],
    venue: list[str] | None,
    path_prefix: str,
) -> dict[str, object]:
    """
    Use generic service combinatorics to query GCS prefixes in parallel.

    Supports all services by loading dimensions from their sharding configs.
    Queries exact known paths with list_blobs for O(1) existence checks.

    Returns:
        Dict with found_dates, venue_data, sub_dimension_data, etc.
    """
    bucket_name = BUCKET_MAPPING[service].get(cat)
    if not bucket_name:
        return {"error": f"No bucket for category {cat}"}

    path_combinatorics = get_path_combinatorics()
    all_entries: list[tuple[str, str, str | None]] = []
    for date_str in dates_to_check:
        entries = path_combinatorics.get_service_prefixes_for_date(
            service=service,
            category=cat,
            date_str=date_str,
            venue_filter=venue,
        )
        for prefix, sub_dim_value in entries:
            all_entries.append((date_str, prefix, sub_dim_value))

    if not all_entries:
        logger.warning("[TURBO] No combinatoric prefixes for %s/%s", cat, service)
        return {
            "found_dates": set(),
            "venue_data": {},
            "sub_dimension_data": {},
            "inst_type_data": {},
            "venue_data_types": {},
            "venue_folders": {},
            "timeframe_data": {},
            "venue_timeframes": {},
            "venue_date_blob_timestamps": {},
        }

    found_dates: set[str] = set()
    sub_dimension_data: dict[str, set[str]] = {}
    venue_data: dict[str, set[str]] = {}
    venue_date_blob_timestamps: _VenueDateTs = {}

    logger.info(
        "[TURBO] Querying %s generic combinatoric prefixes for %s/%s (%s dates)",
        len(all_entries),
        cat,
        service,
        len(dates_to_check),
    )

    with ThreadPoolExecutor(max_workers=100) as executor:
        futures: list[tuple[Future[tuple[bool, datetime | None]], str, str | None]] = []
        for date_str, prefix, sub_dim_value in all_entries:
            future = executor.submit(_check_prefix_generic, bucket_name, path_prefix, prefix)
            futures.append((future, date_str, sub_dim_value))

        for future, date_str, sub_dim_value in futures:
            try:
                has_data, blob_updated = future.result(timeout=30)
                if has_data:
                    _accumulate_generic_result(
                        date_str,
                        sub_dim_value,
                        blob_updated,
                        service,
                        found_dates,
                        sub_dimension_data,
                        venue_data,
                        venue_date_blob_timestamps,
                    )
            except (OSError, ValueError, RuntimeError) as e:
                logger.debug("Generic prefix query failed: %s", e)

    logger.info(
        "[TURBO] Generic combinatorics found data in %s dates, %s sub-dimensions for %s/%s",
        len(found_dates),
        len(sub_dimension_data),
        cat,
        service,
    )

    return {
        "found_dates": found_dates,
        "venue_data": venue_data,
        "sub_dimension_data": sub_dimension_data,
        "inst_type_data": {},
        "venue_data_types": {},
        "venue_folders": {},
        "timeframe_data": {},
        "venue_timeframes": {},
        "venue_date_blob_timestamps": venue_date_blob_timestamps,
    }


def get_expected_dates_for_category(
    all_dates: set[str],
    expected_start_dates_config: Mapping[str, object],
    service: str,
    cat: str,
) -> set[str]:
    """Get expected dates for a category, respecting category_start from config."""
    cat_start = get_category_start_date(expected_start_dates_config, service, cat)
    if not cat_start:
        return all_dates  # No start date configured, use all dates
    # Filter to dates >= category_start
    return {d for d in all_dates if d >= cat_start}
