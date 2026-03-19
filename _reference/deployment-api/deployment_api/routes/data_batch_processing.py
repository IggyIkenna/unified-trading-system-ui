"""
Data Batch Processing API Routes

Batch processing endpoints for data status checks with optimized querying
and result aggregation.
"""

import logging
from collections.abc import Mapping
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime
from typing import cast

from fastapi import APIRouter, HTTPException, Query, Request

from deployment_api.utils.path_combinatorics import PathCombinatorics, get_path_combinatorics
from deployment_api.utils.storage_facade import (
    list_objects,
)

from .batch_cache_manager import (
    check_cache_for_result,
    store_result_in_cache,
)

# Import our extracted modules
from .batch_config_utils import (
    BUCKET_MAPPING,
    LIVE_PATH_PREFIX,
    SERVICE_CONFIG,
    generate_date_range_and_year_months,
    get_expected_dates_for_venue,
    get_expected_venues_for_category,
    is_venue_expected,
    load_expected_start_dates,
    load_venue_data_types,
)
from .batch_query_engine import (
    get_expected_dates_for_category,
    query_generic_prefixes_for_category,
    query_specific_prefixes_for_category,
)
from .batch_result_processor import (
    build_final_response,
    calculate_overall_file_counts,
    calculate_venue_weighted_totals,
    update_category_completion_percentages,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/last-updated/batch")
async def get_last_updated_batch(
    request: Request,
    services: list[str] | None = Query(None, description="List of services (default: all known)"),
):
    """
    Batch endpoint to get last updated timestamps for multiple services at once.

    Much faster than calling /last-updated for each service individually.
    """
    services_to_check = services or list(BUCKET_MAPPING.keys())

    results: dict[str, object] = {}

    def check_bucket_latest(service: str, cat: str, bucket_name: str) -> dict[str, object]:
        """Check latest file in a bucket. Uses storage facade (FUSE when production)."""
        try:
            blobs = list_objects(bucket_name, "", max_results=10)

            if not blobs:
                return {"service": service, "category": cat, "latest": None}

            # Find most recent
            latest_blob = max(
                blobs,
                key=lambda b: (b.updated or b.time_created) or datetime.min.replace(tzinfo=UTC),
            )
            return {
                "service": service,
                "category": cat,
                "latest": (latest_blob.updated.isoformat() if latest_blob.updated else None),
            }
        except (OSError, ValueError, RuntimeError) as e:
            return {"service": service, "category": cat, "error": str(e)}

    # Build all tasks
    tasks: list[tuple[str, str, str]] = []
    for svc in services_to_check:
        if svc in BUCKET_MAPPING:
            for cat, bucket in BUCKET_MAPPING[svc].items():
                tasks.append((str(svc), str(cat), str(bucket)))

    # Parallel check (max 15 concurrent to avoid overwhelming GCS)
    from concurrent.futures import Future

    with ThreadPoolExecutor(max_workers=min(15, len(tasks))) as executor:
        futures: dict[Future[dict[str, object]], tuple[str, str]] = {
            executor.submit(check_bucket_latest, svc, cat, bucket): (svc, cat)
            for svc, cat, bucket in tasks
        }
        for future in as_completed(futures):
            result: dict[str, object] = future.result()
            svc_val = result.get("service")
            svc = str(svc_val) if isinstance(svc_val, str) else ""
            if svc not in results:
                results[svc] = {"categories": {}}
            svc_entry_raw = results[svc]
            svc_entry: dict[str, object] = (
                cast(dict[str, object], svc_entry_raw) if isinstance(svc_entry_raw, dict) else {}
            )
            cats_raw = svc_entry.get("categories")
            cats: dict[str, object] = (
                cast(dict[str, object], cats_raw) if isinstance(cats_raw, dict) else {}
            )
            cat_val = result.get("category")
            cat_key = str(cat_val) if isinstance(cat_val, str) else ""
            cats[cat_key] = {
                "latest": result.get("latest"),
                "error": result.get("error"),
            }
            svc_entry["categories"] = cats
            results[svc] = svc_entry

    return {"services": results}


def _parse_freshness_date(freshness_date: str) -> "datetime | None":
    """Parse a freshness_date string into a UTC datetime, trying multiple formats."""
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(freshness_date, fmt).replace(tzinfo=UTC)
        except ValueError as e:
            logger.debug("Skipping item due to %s: %s", type(e).__name__, e)
            continue
    logger.warning("[TURBO] Invalid freshness_date format: %s", freshness_date)
    return datetime.strptime(freshness_date[:10], "%Y-%m-%d").replace(tzinfo=UTC)


def _check_instruments_request_size(
    service: str,
    include_sub_dimensions: bool,
    categories: list[str],
    start_date: str,
    end_date: str,
    path_combinatorics: PathCombinatorics,
) -> None:
    """Raise HTTPException if the instruments-service request is estimated to be too large."""
    max_estimated_checks = 35_000
    if service != "instruments-service" or not include_sub_dimensions:
        return
    end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=UTC)
    start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=UTC)
    total_venues = sum(
        len(path_combinatorics.get_all_venues_for_category(cat)) for cat in categories
    )
    days = (end_dt - start_dt).days + 1
    estimated = days * total_venues
    if estimated > max_estimated_checks:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Request too large: {days} days x {total_venues} venues"
                f" x {len(categories)} categories"
                f" = ~{estimated:,} GCS checks (limit {max_estimated_checks:,}). "
                "Narrow the date range (e.g. last 6-12 months),"
                " select specific categories, or add venue filter."
            ),
        )


def _sum_category_totals(results: dict[str, object]) -> tuple[int, int]:
    """Sum dates_expected and dates_found across all non-error category results."""
    total_expected = 0
    total_found = 0
    for _r_raw in results.values():
        if not isinstance(_r_raw, dict):
            continue
        _r = cast(dict[str, object], _r_raw)
        if "error" in _r:
            continue
        _exp_raw = _r.get("dates_expected")
        _fnd_raw = _r.get("dates_found")
        total_expected += int(_exp_raw) if isinstance(_exp_raw, int) else 0
        total_found += int(_fnd_raw) if isinstance(_fnd_raw, int) else 0
    return total_expected, total_found


def _build_venue_entry(
    venue_name: str,
    venue_dates: set[str],
    venue_expected_dates: set[str],
    cat: str,
    venue_data_types_config: object,
    include_dates_list: bool,
) -> dict[str, object]:
    """Build a single venue result dict with completion stats."""
    venue_dict: dict[str, object] = {
        "dates_found": len(venue_dates),
        "dates_expected": len(venue_expected_dates),
        "dates_expected_venue": len(venue_expected_dates),
        "is_expected": is_venue_expected(
            cast(Mapping[str, object], venue_data_types_config), cat, venue_name
        ),
        "completion_pct": (
            round(len(venue_dates) / len(venue_expected_dates) * 100, 1)
            if venue_expected_dates
            else 0
        ),
    }
    if include_dates_list:
        venue_dict["dates_found_list"] = sorted(venue_dates)
        venue_dict["dates_missing_list"] = sorted(venue_expected_dates - venue_dates)
    return venue_dict


def _build_venues_result(
    venue_data: dict[str, object],
    cat: str,
    service: str,
    all_dates: set[str],
    expected_start_dates_config: Mapping[str, object],
    upstream_dates: dict[str, dict[str, set[str]]] | None,
    venue_data_types_config: object,
    include_dates_list: bool,
) -> tuple[dict[str, object], dict[str, object]]:
    """Build venues dict and venue_summary for a category result."""
    venues_dict: dict[str, object] = {}
    for venue_name_raw, venue_dates_raw in venue_data.items():
        venue_name = str(venue_name_raw)
        venue_dates: set[str] = (
            cast(set[str], venue_dates_raw) if isinstance(venue_dates_raw, set) else set()
        )
        venue_expected_dates = get_expected_dates_for_venue(
            all_dates,
            expected_start_dates_config,
            service,
            cat,
            venue_name,
            upstream_avail_dates=upstream_dates,
        )
        venues_dict[venue_name] = _build_venue_entry(
            venue_name,
            venue_dates,
            venue_expected_dates,
            cat,
            venue_data_types_config,
            include_dates_list,
        )
    expected_venues = get_expected_venues_for_category(
        cast(Mapping[str, object], venue_data_types_config), cat
    )
    actual_venues: set[str] = set(venue_data.keys())
    venue_summary: dict[str, object] = {
        "expected": sorted(expected_venues),
        "found": sorted(actual_venues),
        "missing": sorted(expected_venues - actual_venues),
        "unexpected": sorted(actual_venues - expected_venues),
        "expected_but_missing": sorted(expected_venues - actual_venues),
    }
    return venues_dict, venue_summary


def _check_category(
    cat: str,
    service: str,
    all_dates: set[str],
    expected_start_dates_config: Mapping[str, object],
    venue: list[str] | None,
    folder: list[str] | None,
    data_type: list[str] | None,
    path_prefix: str,
    upstream_dates: dict[str, dict[str, set[str]]] | None,
    path_combinatorics: object,
    venue_data_types_config: object,
    include_dates_list: bool,
    include_sub_dimensions: bool,
    sub_dimension_name: str | None,
) -> dict[str, object]:
    """Check all date directories for a category using optimized queries."""
    bucket_name = BUCKET_MAPPING[service].get(cat)
    if not bucket_name:
        return {"category": cat, "error": f"No bucket for category {cat}"}

    expected_dates_for_cat = get_expected_dates_for_category(
        all_dates, expected_start_dates_config, service, cat
    )

    try:
        if (
            service in ["market-tick-data-handler", "market-data-processing-service"]
            and path_combinatorics
        ):
            query_result = query_specific_prefixes_for_category(
                service=service,
                cat=cat,
                dates_to_check=expected_dates_for_cat,
                venue=venue,
                folder=folder,
                data_type=data_type,
                path_prefix=path_prefix,
                expected_start_dates_config=expected_start_dates_config,
                all_dates=all_dates,
                upstream_avail_dates=upstream_dates,
            )
        else:
            query_result = query_generic_prefixes_for_category(
                service=service,
                cat=cat,
                dates_to_check=expected_dates_for_cat,
                venue=venue,
                path_prefix=path_prefix,
            )

        if "error" in query_result:
            return query_result

        found_dates_raw = query_result.get("found_dates")
        found_dates: set[str] = (
            cast(set[str], found_dates_raw) if isinstance(found_dates_raw, set) else set()
        )
        venue_data_raw = query_result.get("venue_data")
        venue_data: dict[str, object] = (
            cast(dict[str, object], venue_data_raw) if isinstance(venue_data_raw, dict) else {}
        )
        sub_dimension_data_raw = query_result.get("sub_dimension_data")
        sub_dimension_data: dict[str, object] = (
            cast(dict[str, object], sub_dimension_data_raw)
            if isinstance(sub_dimension_data_raw, dict)
            else {}
        )
        # consume but discard unused fields from query result
        _ = query_result.get("inst_type_data")
        _ = query_result.get("venue_data_types")
        _ = query_result.get("venue_folders")
        _ = query_result.get("timeframe_data")
        _ = query_result.get("venue_timeframes")
        _ = query_result.get("venue_date_blob_timestamps")

        result: dict[str, object] = {
            "category": cat,
            "bucket": bucket_name,
            "dates_found": len(found_dates),
            "dates_expected": len(expected_dates_for_cat),
            "completion_pct": round(len(found_dates) / len(expected_dates_for_cat) * 100, 1)
            if expected_dates_for_cat
            else 0,
        }

        if include_dates_list:
            result.update(
                {
                    "dates_found_list": sorted(found_dates),
                    "dates_expected_list": sorted(expected_dates_for_cat),
                    "dates_missing_list": sorted(expected_dates_for_cat - found_dates),
                }
            )

        if include_sub_dimensions and sub_dimension_data:
            sub_dim_result: dict[str, object] = {}
            for sd_name_raw, sd_dates_raw in sub_dimension_data.items():
                sd_name = str(sd_name_raw)
                sd_dates: set[str] = (
                    cast(set[str], sd_dates_raw) if isinstance(sd_dates_raw, set) else set()
                )
                sub_dim_result[sd_name] = {
                    "dates_found": len(sd_dates),
                    "dates_found_list": sorted(sd_dates) if include_dates_list else None,
                }
            result[sub_dimension_name or "sub_dimension"] = sub_dim_result

        if venue_data:
            venues_dict, venue_summary = _build_venues_result(
                venue_data=venue_data,
                cat=cat,
                service=service,
                all_dates=all_dates,
                expected_start_dates_config=expected_start_dates_config,
                upstream_dates=upstream_dates,
                venue_data_types_config=venue_data_types_config,
                include_dates_list=include_dates_list,
            )
            result["venues"] = venues_dict
            result["venue_summary"] = venue_summary

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.error("Error checking %s: %s", bucket_name, e)
        return {"category": cat, "bucket": bucket_name, "error": str(e)}


def _parse_upstream_tick_result(
    tick_result: dict[str, object],
) -> dict[str, dict[str, set[str]]]:
    """Parse a tick-handler turbo result into {category: {venue: set(dates)}} structure."""
    upstream_dates: dict[str, dict[str, set[str]]] = {}
    tick_categories_raw = tick_result.get("categories")
    tick_categories: dict[str, object] = (
        cast(dict[str, object], tick_categories_raw)
        if isinstance(tick_categories_raw, dict)
        else {}
    )
    for cat_name_raw, cat_data_raw in tick_categories.items():
        cat_name = str(cat_name_raw)
        if not isinstance(cat_data_raw, dict):
            continue
        cat_data = cast(dict[str, object], cat_data_raw)
        upstream_dates[cat_name] = {}
        dfl_raw = cat_data.get("dates_found_list")
        dfl: list[object] = cast(list[object], dfl_raw) if isinstance(dfl_raw, list) else []
        upstream_dates[cat_name]["__category__"] = {str(d) for d in dfl if d}
        venues_raw = cat_data.get("venues")
        venues_dict: dict[str, object] = (
            cast(dict[str, object], venues_raw) if isinstance(venues_raw, dict) else {}
        )
        for venue_name_raw, venue_data_raw in venues_dict.items():
            venue_name = str(venue_name_raw)
            if isinstance(venue_data_raw, dict):
                venue_data = cast(dict[str, object], venue_data_raw)
                vdfl_raw = venue_data.get("dates_found_list")
                vdfl: list[object] = (
                    cast(list[object], vdfl_raw) if isinstance(vdfl_raw, list) else []
                )
                upstream_dates[cat_name][venue_name] = {str(d) for d in vdfl if d}
    return upstream_dates


async def _fetch_upstream_dates(
    start_date: str,
    end_date: str,
    category: list[str] | None,
    venue: list[str] | None,
    mode: str,
) -> dict[str, dict[str, set[str]]]:
    """Fetch upstream market-tick-data-handler dates for cascading expected-date calculation."""
    logger.info(
        "[TURBO] Fetching upstream market-tick-data-handler data for cascading expected dates"
    )
    tick_result = await get_data_status_turbo_impl(
        service="market-tick-data-handler",
        start_date=start_date,
        end_date=end_date,
        category=category,
        venue=venue,
        include_sub_dimensions=True,
        include_instrument_types=False,
        include_file_counts=False,
        include_dates_list=True,
        full_dates_list=True,
        check_upstream_availability=False,
        _upstream_dates=None,
        mode=mode,
    )
    upstream_dates = _parse_upstream_tick_result(tick_result)
    logger.info(
        "[TURBO] Upstream dates extracted: %s venue-date combinations",
        sum(len(v) for c in upstream_dates.values() for v in c.values()),
    )
    return upstream_dates


async def get_data_status_turbo_impl(
    service: str,
    start_date: str,
    end_date: str,
    category: list[str] | None = None,
    venue: list[str] | None = None,
    folder: list[str] | None = None,
    data_type: list[str] | None = None,
    include_sub_dimensions: bool = False,
    include_instrument_types: bool = False,
    include_file_counts: bool = False,
    include_dates_list: bool = False,
    full_dates_list: bool = False,
    check_upstream_availability: bool = True,
    first_day_of_month_only: bool = False,
    freshness_date: str | None = None,
    _upstream_dates: dict[str, dict[str, set[str]]] | None = None,
    mode: str = "batch",
) -> dict[str, object]:
    """
    Internal implementation of TURBO data status check.

    This function has normal Python defaults (not Query objects) so it can be
    called directly from other modules (e.g., deployments.py, tests).

    For the FastAPI endpoint with Query parameter docs, see get_data_status_turbo().
    """
    if mode not in ("batch", "live"):
        return {"error": f"Invalid mode: {mode}. Use 'batch' or 'live'."}
    path_prefix = LIVE_PATH_PREFIX if mode == "live" else ""

    # Pre-validate freshness_date format (result not yet consumed by _check_category callers)
    if freshness_date:
        _parse_freshness_date(freshness_date)

    # Check cache first
    cached_result = check_cache_for_result(
        service=service,
        start_date=start_date,
        end_date=end_date,
        category=category,
        venue=venue,
        folder=folder,
        data_type=data_type,
        include_sub_dimensions=include_sub_dimensions,
        include_instrument_types=include_instrument_types,
        include_file_counts=include_file_counts,
        check_upstream_availability=check_upstream_availability,
        first_day_of_month_only=first_day_of_month_only,
        freshness_date=freshness_date,
        mode=mode,
        include_dates_list=include_dates_list,
        full_dates_list=full_dates_list,
    )

    if cached_result is not None:
        return cached_result

    # For market-data-processing-service, fetch upstream (market-tick-data-handler) data
    # to determine which dates are actually available as candidates for processing.
    upstream_dates: dict[str, dict[str, set[str]]] | None = _upstream_dates  # May be pre-computed
    if (
        service == "market-data-processing-service"
        and check_upstream_availability
        and upstream_dates is None
    ):
        upstream_dates = await _fetch_upstream_dates(
            start_date=start_date,
            end_date=end_date,
            category=category,
            venue=venue,
            mode=mode,
        )

    if service not in BUCKET_MAPPING:
        return {
            "error": (
                f"Service {service} not supported for turbo mode."
                f" Supported: {list(BUCKET_MAPPING.keys())}"
            )
        }

    categories = category if category else list(BUCKET_MAPPING[service].keys())
    config = SERVICE_CONFIG[service]

    # Load expected start dates config for filtering
    expected_start_dates_config = load_expected_start_dates()

    # Load venue data types config for expected vs actual tracking
    venue_data_types_config = load_venue_data_types()

    # Generate ALL dates in range (before category filtering) for year-month prefixes
    all_dates, _year_months = generate_date_range_and_year_months(
        start_date, end_date, first_day_of_month_only
    )

    # Use PathCombinatorics for highly optimized parallel specific queries
    path_combinatorics = get_path_combinatorics()

    # Guard: prevent 503 timeout for very large requests
    _check_instruments_request_size(
        service, include_sub_dimensions, categories, start_date, end_date, path_combinatorics
    )

    sub_dimension_name = cast(str | None, config.get("sub_dimension"))
    results: dict[str, object] = {}

    # Parallel check across categories
    with ThreadPoolExecutor(max_workers=len(categories)) as executor:
        futures = {
            executor.submit(
                _check_category,
                cat,
                service,
                all_dates,
                expected_start_dates_config,
                venue,
                folder,
                data_type,
                path_prefix,
                upstream_dates,
                path_combinatorics,
                venue_data_types_config,
                include_dates_list,
                include_sub_dimensions,
                sub_dimension_name,
            ): cat
            for cat in categories
        }
        for future in as_completed(futures):
            result = future.result()
            cat_key_raw = result.get("category")
            cat_key = str(cat_key_raw) if isinstance(cat_key_raw, str) else ""
            results[cat_key] = result

    # Calculate overall totals using extracted functions
    total_venue_expected, total_venue_found, expected_missing, unexpected_missing = (
        calculate_venue_weighted_totals(
            results, all_dates, expected_start_dates_config, service, upstream_dates
        )
    )

    # Update category completion percentages to be venue-weighted
    update_category_completion_percentages(
        results, all_dates, expected_start_dates_config, service, upstream_dates
    )

    # Calculate category-level totals for reference
    total_expected_category, total_found_category = _sum_category_totals(results)

    # Calculate overall file counts if requested
    overall_file_counts = calculate_overall_file_counts(results, include_file_counts)

    # Build final response
    response = build_final_response(
        service=service,
        start_date=start_date,
        end_date=end_date,
        first_day_of_month_only=first_day_of_month_only,
        sub_dimension_name=sub_dimension_name,
        include_sub_dimensions=include_sub_dimensions,
        include_file_counts=include_file_counts,
        all_dates=all_dates,
        total_venue_expected=total_venue_expected,
        total_venue_found=total_venue_found,
        total_expected_category=total_expected_category,
        total_found_category=total_found_category,
        expected_missing=expected_missing,
        unexpected_missing=unexpected_missing,
        results=results,
        overall_file_counts=overall_file_counts,
    )

    # Store in cache and return (potentially truncated) response
    response = store_result_in_cache(
        response=response,
        service=service,
        start_date=start_date,
        end_date=end_date,
        category=category,
        venue=venue,
        folder=folder,
        data_type=data_type,
        include_sub_dimensions=include_sub_dimensions,
        include_instrument_types=include_instrument_types,
        include_file_counts=include_file_counts,
        check_upstream_availability=check_upstream_availability,
        first_day_of_month_only=first_day_of_month_only,
        freshness_date=freshness_date,
        mode=mode,
        include_dates_list=include_dates_list,
        full_dates_list=full_dates_list,
    )

    return response
