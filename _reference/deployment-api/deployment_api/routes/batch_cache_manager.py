"""
Cache management for batch data processing.

Handles cache operations for data status results to improve performance
and reduce redundant cloud storage queries.
"""

import logging

from deployment_api.utils.data_status_cache import (
    get_cached_result,
    set_cached_result,
    truncate_dates_list,
)

logger = logging.getLogger(__name__)


def check_cache_for_result(
    service: str,
    start_date: str,
    end_date: str,
    category: list[str] | None,
    venue: list[str] | None,
    folder: list[str] | None,
    data_type: list[str] | None,
    include_sub_dimensions: bool,
    include_instrument_types: bool,
    include_file_counts: bool,
    check_upstream_availability: bool,
    first_day_of_month_only: bool,
    freshness_date: str | None,
    mode: str,
    include_dates_list: bool,
    full_dates_list: bool,
) -> dict[str, object] | None:
    """Check cache for existing result and return it if found.

    Args:
        All parameters needed to identify a unique cache entry

    Returns:
        Cached result dict if found, None if not cached or dates_list not requested
    """
    # Only check cache if dates_list is requested
    if not include_dates_list:
        return None

    cached = get_cached_result(
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
    )

    if cached is not None:
        logger.info("[CACHE] Cache hit for %s %s-%s", service, start_date, end_date)
        # Return full result if requested, otherwise truncated
        if full_dates_list:
            return cached
        else:
            return truncate_dates_list(cached)

    return None


def store_result_in_cache(
    response: dict[str, object],
    service: str,
    start_date: str,
    end_date: str,
    category: list[str] | None,
    venue: list[str] | None,
    folder: list[str] | None,
    data_type: list[str] | None,
    include_sub_dimensions: bool,
    include_instrument_types: bool,
    include_file_counts: bool,
    check_upstream_availability: bool,
    first_day_of_month_only: bool,
    freshness_date: str | None,
    mode: str,
    include_dates_list: bool,
    full_dates_list: bool,
) -> dict[str, object]:
    """Store result in cache and return potentially truncated response.

    Args:
        response: The complete response dict to cache
        All other parameters needed to identify the cache entry

    Returns:
        The response, potentially truncated if full_dates_list is False
    """
    # Store in cache (if dates_list was requested)
    # We store the FULL (non-truncated) response for reuse by deploy_missing_only
    if include_dates_list:
        set_cached_result(
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
            result=response,
            mode=mode,
        )

        logger.info("[CACHE] Stored result for %s %s-%s", service, start_date, end_date)

        # Truncate if full_dates_list was not requested
        if not full_dates_list:
            response = truncate_dates_list(response)

    return response
