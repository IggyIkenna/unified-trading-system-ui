"""
Data Status API Routes - Thin handlers only.

Endpoint for checking data completion status across services.
Business logic delegated to service layer modules.
"""

import logging

from fastapi import APIRouter, HTTPException, Query, Request

from deployment_api.deployment_api_config import DeploymentApiConfig
from deployment_api.services import DataAnalyticsService, DataQueryService, DataStatusService

_cfg = DeploymentApiConfig()

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize service instances
data_status_service = DataStatusService()
data_query_service = DataQueryService()
data_analytics_service = DataAnalyticsService()


@router.get("")
async def get_data_status(
    request: Request,
    service: str = Query(..., description="Service name"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    category: list[str] | None = Query(None, description="Filter by category"),
    venue: list[str] | None = Query(None, description="Filter by venue"),
    show_missing: bool = Query(False, description="Include list of missing dates"),
    check_venues: bool = Query(False, description="Check venue coverage inside parquet files"),
    check_data_types: bool = Query(False, description="Check per data_type completion"),
    check_feature_groups: bool = Query(False, description="Check per feature_group completion"),
    check_timeframes: bool = Query(False, description="Check per timeframe completion"),
    force_refresh: bool = Query(False, description="Skip cache and fetch fresh data"),
    mode: str = Query("batch", description="Data path mode: 'batch' or 'live'"),
):
    """
    Get data completion status for a service across a date range.

    Returns completion percentages broken down by category and venue,
    with optional list of missing dates.
    """
    if _cfg.is_mock_mode():
        sources: list[dict[str, object]] = []
        return {
            "status": "ok",
            "service": service,
            "start_date": start_date,
            "end_date": end_date,
            "sources": sources,
            "mock": True,
        }
    try:
        result = await data_status_service.run_data_status_cli(
            service=service,
            start_date=start_date,
            end_date=end_date,
            categories=category,
            venues=venue,
            show_missing=show_missing,
            check_venues=check_venues,
            check_data_types=check_data_types,
            check_feature_groups=check_feature_groups,
            check_timeframes=check_timeframes,
            mode=mode,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in get_data_status")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.post("/missing-shards")
async def calculate_missing_shards(
    request: Request,
    service: str = Query(..., description="Service name"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    category: list[str] | None = Query(None, description="Filter by category"),
    venue: list[str] | None = Query(None, description="Filter by venue"),
    mode: str = Query("batch", description="Data path mode: 'batch' or 'live'"),
):
    """Calculate missing shards for a service over a date range."""
    try:
        result = await data_status_service.calculate_missing_shards(
            service=service,
            start_date=start_date,
            end_date=end_date,
            categories=category,
            venues=venue,
            mode=mode,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in calculate_missing_shards")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.get("/last-updated")
async def get_last_updated(
    service: str = Query(..., description="Service name"),
    category: list[str] | None = Query(None, description="Filter by category"),
):
    """Get last updated information for a service."""
    try:
        result = await data_status_service.get_last_updated_info(
            service=service,
            categories=category,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in get_last_updated")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.get("/turbo")
async def get_data_status_turbo(
    request: Request,
    service: str = Query(..., description="Service name"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    category: list[str] | None = Query(None, description="Filter by category"),
    venue: list[str] | None = Query(None, description="Filter by venue"),
    include_sub_dimensions: bool = Query(False, description="Include sub-dimension breakdown"),
    include_instrument_types: bool = Query(False, description="Include instrument type breakdown"),
    include_file_counts: bool = Query(False, description="Include per-date file counts"),
    include_dates_list: bool = Query(False, description="Include sorted list of dates found"),
):
    """Get data status with turbo mode caching (5-minute cache TTL)."""
    if _cfg.is_mock_mode():
        sources: list[dict[str, object]] = []
        return {
            "status": "ok",
            "service": service,
            "start_date": start_date,
            "end_date": end_date,
            "sources": sources,
            "mock": True,
        }
    try:
        result = await data_analytics_service.get_data_status_turbo(
            service=service,
            start_date=start_date,
            end_date=end_date,
            from_data_status_service=data_status_service.run_data_status_cli,
            categories=category,
            venues=venue,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in get_data_status_turbo")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.get("/turbo/stats")
async def get_turbo_cache_stats():
    """Get turbo mode cache statistics."""
    try:
        return await data_analytics_service.get_cache_stats()
    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in get_turbo_cache_stats")
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.post("/turbo/clear")
async def clear_turbo_cache():
    """Clear the turbo mode cache."""
    try:
        return await data_analytics_service.clear_cache()
    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in clear_turbo_cache")
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.get("/venue-filters")
async def get_venue_filters(service: str = Query(..., description="Service name")):
    """Get available venue filters for a service."""
    try:
        result = await data_query_service.get_venue_filters(service)

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in get_venue_filters")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.get("/list-files")
async def list_files_in_path(
    bucket_name: str = Query(..., description="GCS bucket name"),
    path: str = Query("", description="Path within bucket"),
    max_results: int = Query(100, description="Maximum number of results"),
    show_dirs: bool = Query(False, description="Include directory-like prefixes"),
):
    """List files in a specific GCS bucket path."""
    try:
        result = await data_query_service.list_files_in_path(
            bucket_name=bucket_name,
            path=path,
            max_results=max_results,
            show_dirs=show_dirs,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    except (OSError, PermissionError) as e:
        if isinstance(e, HTTPException):
            raise
        logger.exception("Error in list_files_in_path")
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.get("/instruments")
async def get_instruments_list(
    category: str = Query(..., description="Category (cefi, tradfi, defi)"),
    venue: str | None = Query(None, description="Filter by venue"),
    instrument_type: str | None = Query(None, description="Filter by instrument type"),
    limit: int = Query(100, description="Maximum number of instruments"),
):
    """Get list of instruments for a category."""
    try:
        result = await data_query_service.get_instruments_list(
            category=category,
            venue=venue,
            instrument_type=instrument_type,
            limit=limit,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in get_instruments_list")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.get("/instrument-availability")
async def get_instrument_availability(
    venue: str = Query(..., description="Venue name"),
    instrument_type: str = Query(..., description="Instrument type"),
    instrument: str = Query(..., description="Instrument symbol"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    data_type: str | None = Query(None, description="Specific data type to check"),
    available_from: str | None = Query(None, description="Instrument availability start"),
    available_to: str | None = Query(None, description="Instrument availability end"),
):
    """Check instrument availability over a date range."""
    try:
        result = await data_query_service.get_instrument_availability(
            venue=venue,
            instrument_type=instrument_type,
            instrument=instrument,
            start_date=start_date,
            end_date=end_date,
            data_type=data_type,
            available_from=available_from,
            available_to=available_to,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in get_instrument_availability")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.post("/analyze")
async def analyze_data_patterns(
    service: str = Query(..., description="Service name"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    category: list[str] | None = Query(None, description="Filter by category"),
):
    """Analyze data patterns and trends for a service."""
    try:
        # First get the data status
        data_status_result = await data_status_service.run_data_status_cli(
            service=service,
            start_date=start_date,
            end_date=end_date,
            categories=category,
            show_missing=True,
        )

        if "error" in data_status_result:
            raise HTTPException(status_code=500, detail=data_status_result["error"])

        # Then analyze it
        result = await data_analytics_service.analyze_data_patterns(
            service=service,
            data_status_result=data_status_result,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in analyze_data_patterns")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e


@router.post("/multi-service")
async def get_multi_service_status(
    services: list[str] = Query(..., description="List of service names"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    category: list[str] | None = Query(None, description="Filter by category"),
):
    """Get aggregated data status across multiple services."""
    try:
        result = await data_analytics_service.aggregate_multi_service_status(
            services=services,
            start_date=start_date,
            end_date=end_date,
            from_data_status_service=data_status_service.run_data_status_cli,
            categories=category,
        )

        return result

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error in get_multi_service_status")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Internal server error. Check server logs."
        ) from e
