"""
Result processing and aggregation for batch data processing.

Contains functions for calculating overall completion percentages,
venue-weighted statistics, and building the final response.
"""

import logging
from collections.abc import Mapping
from typing import cast

from .batch_config_utils import get_expected_dates_for_venue

logger = logging.getLogger(__name__)


def _get_venue_expected_count(venue_info: dict[str, object]) -> int:
    """Extract venue expected count using dimension-weighted value if available."""
    dim_exp_raw = venue_info.get("_dim_weighted_expected")
    dates_exp_venue_raw = venue_info.get("dates_expected_venue")
    dates_exp_raw = venue_info.get("dates_expected")
    if isinstance(dim_exp_raw, int):
        return dim_exp_raw
    if isinstance(dates_exp_venue_raw, int):
        return dates_exp_venue_raw
    if isinstance(dates_exp_raw, int):
        return dates_exp_raw
    return 0


def _get_venue_found_count(venue_info: dict[str, object]) -> int:
    """Extract venue found count using dimension-weighted value if available."""
    dim_found_raw = venue_info.get("_dim_weighted_found")
    dates_found_raw = venue_info.get("dates_found")
    if isinstance(dim_found_raw, int):
        return dim_found_raw
    if isinstance(dates_found_raw, int):
        return dates_found_raw
    return 0


def _count_missing_venue_expected(
    cat_result: dict[str, object],
    venue_summary: dict[str, object],
    all_dates: set[str],
    expected_start_dates_config: Mapping[str, object],
    service: str,
    cat_name: str,
    upstream_dates: dict[str, dict[str, set[str]]] | None,
) -> int:
    """Return expected count for venues that are completely missing from results."""
    missing_dim_exp_raw = cat_result.get("_missing_venue_dim_expected")
    if isinstance(missing_dim_exp_raw, int) and missing_dim_exp_raw > 0:
        return missing_dim_exp_raw
    exp_but_missing_raw = venue_summary.get("expected_but_missing")
    exp_but_missing: list[object] = (
        cast(list[object], exp_but_missing_raw) if isinstance(exp_but_missing_raw, list) else []
    )
    total = 0
    for missing_venue_raw in exp_but_missing:
        missing_venue = str(missing_venue_raw) if missing_venue_raw else ""
        if not missing_venue:
            continue
        venue_specific_expected = get_expected_dates_for_venue(
            all_dates,
            expected_start_dates_config,
            service,
            cat_name,
            missing_venue,
            upstream_avail_dates=upstream_dates,
        )
        total += len(venue_specific_expected)
    return total


def calculate_overall_file_counts(
    results: dict[str, object], include_file_counts: bool
) -> dict[str, object] | None:
    """Calculate overall file counts across all categories.

    Args:
        results: Category results dictionary
        include_file_counts: Whether file counts were requested

    Returns:
        Overall file counts dict or None if not requested/unavailable
    """
    if not include_file_counts:
        return None

    total_files_all = 0
    total_dates_with_files = 0
    for cat_result_raw in results.values():
        if not isinstance(cat_result_raw, dict):
            continue
        cat_result = cast(dict[str, object], cat_result_raw)
        if "error" in cat_result:
            continue
        file_counts_raw = cat_result.get("file_counts")
        file_counts: dict[str, object] = (
            cast(dict[str, object], file_counts_raw) if isinstance(file_counts_raw, dict) else {}
        )
        total_files_raw = file_counts.get("total_files")
        dates_raw = file_counts.get("dates_with_file_counts")
        total_files_all += int(total_files_raw) if isinstance(total_files_raw, int) else 0
        total_dates_with_files += int(dates_raw) if isinstance(dates_raw, int) else 0

    if total_files_all > 0:
        return {
            "total_files": total_files_all,
            "dates_with_file_counts": total_dates_with_files,
            "avg_files_per_date": (
                round(total_files_all / total_dates_with_files, 1)
                if total_dates_with_files > 0
                else 0
            ),
        }
    return None


def calculate_venue_weighted_totals(
    results: dict[str, object],
    all_dates: set[str],
    expected_start_dates_config: Mapping[str, object],
    service: str,
    upstream_dates: dict[str, dict[str, set[str]]] | None = None,
) -> tuple[int, int, int, int]:
    """Calculate venue-weighted totals across all categories.

    Args:
        results: Category results dictionary
        all_dates: Set of all dates in the range
        expected_start_dates_config: Expected start dates configuration
        service: Service name
        upstream_dates: Upstream availability data for cascading

    Returns:
        Tuple of (total_venue_expected, total_venue_found, expected_missing, unexpected_missing)
    """
    total_venue_expected = 0
    total_venue_found = 0
    expected_missing = 0  # Missing data that SHOULD exist (date >= venue start)
    unexpected_missing = 0  # Kept for backwards compat but always 0 now

    for cat_name_raw, cat_result_raw in results.items():
        cat_name = str(cat_name_raw)
        if not isinstance(cat_result_raw, dict):
            continue
        cat_result = cast(dict[str, object], cat_result_raw)
        if "error" in cat_result:
            continue

        venue_summary_raw = cat_result.get("venue_summary")
        venue_summary: dict[str, object] = (
            cast(dict[str, object], venue_summary_raw)
            if isinstance(venue_summary_raw, dict)
            else {}
        )
        venues_raw = cat_result.get("venues")
        venues: dict[str, object] = (
            cast(dict[str, object], venues_raw) if isinstance(venues_raw, dict) else {}
        )
        cat_dates_expected_raw = cat_result.get("dates_expected")
        cat_dates_expected = (
            int(cat_dates_expected_raw) if isinstance(cat_dates_expected_raw, int) else 0
        )
        cat_dates_found_raw = cat_result.get("dates_found")
        cat_dates_found = int(cat_dates_found_raw) if isinstance(cat_dates_found_raw, int) else 0

        if venues:
            for _venue_name, venue_info_raw in venues.items():
                if not isinstance(venue_info_raw, dict):
                    continue
                venue_info = cast(dict[str, object], venue_info_raw)
                venue_expected = _get_venue_expected_count(venue_info)
                venue_found = _get_venue_found_count(venue_info)
                is_expected_raw = venue_info.get("is_expected", True)
                is_expected = bool(is_expected_raw) if isinstance(is_expected_raw, bool) else True
                if is_expected:
                    total_venue_expected += venue_expected
                    total_venue_found += venue_found
                    venue_missing = venue_expected - venue_found
                    if venue_missing > 0:
                        expected_missing += venue_missing

            missing_count = _count_missing_venue_expected(
                cat_result,
                venue_summary,
                all_dates,
                expected_start_dates_config,
                service,
                cat_name,
                upstream_dates,
            )
            expected_missing += missing_count
            total_venue_expected += missing_count
        else:
            total_venue_expected += cat_dates_expected
            total_venue_found += cat_dates_found
            cat_missing = cat_dates_expected - cat_dates_found
            if cat_missing > 0:
                expected_missing += cat_missing

    return total_venue_expected, total_venue_found, expected_missing, unexpected_missing


def update_category_completion_percentages(
    results: dict[str, object],
    all_dates: set[str],
    expected_start_dates_config: Mapping[str, object],
    service: str,
    upstream_dates: dict[str, dict[str, set[str]]] | None = None,
) -> None:
    """Update category-level completion percentages to be venue-weighted.

    This ensures "100%" only shows when ALL expected venues have ALL dates.

    Args:
        results: Category results dictionary (modified in place)
        all_dates: Set of all dates in the range
        expected_start_dates_config: Expected start dates configuration
        service: Service name
        upstream_dates: Upstream availability data for cascading
    """
    for cat_name_raw, cat_result_raw in results.items():
        cat_name = str(cat_name_raw)
        if not isinstance(cat_result_raw, dict):
            continue
        cat_result = cast(dict[str, object], cat_result_raw)
        if "error" in cat_result:
            continue
        venues_raw = cat_result.get("venues")
        venues: dict[str, object] = (
            cast(dict[str, object], venues_raw) if isinstance(venues_raw, dict) else {}
        )
        if not venues:
            # No venue breakdown, keep date-level calculation
            continue

        # Calculate venue-weighted completion for this category
        # Only count EXPECTED venues - bonus venues shouldn't affect completion %
        cat_venue_expected = 0
        cat_venue_found = 0
        for _venue_name, venue_info_raw in venues.items():
            if not isinstance(venue_info_raw, dict):
                continue
            venue_info = cast(dict[str, object], venue_info_raw)
            is_expected_raw = venue_info.get("is_expected", True)
            is_expected = bool(is_expected_raw) if isinstance(is_expected_raw, bool) else True
            if not is_expected:
                continue  # Skip bonus venues
            cat_venue_expected += _get_venue_expected_count(venue_info)
            cat_venue_found += _get_venue_found_count(venue_info)

        # Add missing expected venues (they have 0 found but should count as expected)
        venue_summary_raw = cat_result.get("venue_summary")
        venue_summary: dict[str, object] = (
            cast(dict[str, object], venue_summary_raw)
            if isinstance(venue_summary_raw, dict)
            else {}
        )
        cat_venue_expected += _count_missing_venue_expected(
            cat_result,
            venue_summary,
            all_dates,
            expected_start_dates_config,
            service,
            cat_name,
            upstream_dates,
        )

        # Update completion_pct to venue-weighted value
        if cat_venue_expected > 0:
            cat_result["completion_pct"] = round(cat_venue_found / cat_venue_expected * 100, 1)
            cat_result["venue_weighted"] = True
            cat_result["venue_dates_found"] = cat_venue_found
            cat_result["venue_dates_expected"] = cat_venue_expected


def build_final_response(
    service: str,
    start_date: str,
    end_date: str,
    first_day_of_month_only: bool,
    sub_dimension_name: str | None,
    include_sub_dimensions: bool,
    include_file_counts: bool,
    all_dates: set[str],
    total_venue_expected: int,
    total_venue_found: int,
    total_expected_category: int,
    total_found_category: int,
    expected_missing: int,
    unexpected_missing: int,
    results: dict[str, object],
    overall_file_counts: dict[str, object] | None,
) -> dict[str, object]:
    """Build the final response dictionary.

    Args:
        All the calculated totals and metadata needed for the response

    Returns:
        Complete response dictionary
    """
    # Calculate overall percentage - use venue-weighted if available, else category-level
    # This handles services without venue breakdown (e.g., market-data-processing-service)
    if total_venue_expected > 0:
        overall_pct = total_venue_found / total_venue_expected * 100
        # total_missing = expected_missing (only counts dates >= venue start)
        total_missing = expected_missing
    else:
        # No venue data - fall back to category-level calculation
        overall_pct = (
            (total_found_category / total_expected_category * 100) if total_expected_category else 0
        )
        total_missing = total_expected_category - total_found_category

    response: dict[str, object] = {
        "service": service,
        "date_range": {"start": start_date, "end": end_date, "days": len(all_dates)},
        "mode": "turbo",
        "first_day_of_month_only": first_day_of_month_only,
        "sub_dimension": sub_dimension_name if include_sub_dimensions else None,
        "include_file_counts": include_file_counts,
        "overall_completion_pct": round(overall_pct, 1),
        "overall_dates_found": total_venue_found,
        "overall_dates_expected": total_venue_expected,
        # Category-level totals for reference (not venue-weighted)
        "overall_dates_found_category": total_found_category,
        "overall_dates_expected_category": total_expected_category,
        "total_missing": total_missing,
        "unexpected_missing": unexpected_missing,
        "expected_missing": expected_missing,
        "categories": results,
    }

    # Add overall file counts if available
    if overall_file_counts:
        response["overall_file_counts"] = overall_file_counts

    return response
