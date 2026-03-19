"""
Helper functions for data status routes.

Contains utility functions for data status checking and processing.
"""

import logging

from fastapi import HTTPException

from deployment_api.clients import deployment_service_client as _ds_client
from deployment_api.settings import gcp_project_id as _pid

logger = logging.getLogger(__name__)


# Helper: build bucket name from prefix, category, and project ID
def _bucket(prefix: str, category: str) -> str:
    """Build a GCS bucket name: {prefix}-{category_lower}-{project_id}."""
    return f"{prefix}-{category.lower()}-{_pid}"


async def _run_data_status_cli(
    service: str,
    start_date: str,
    end_date: str,
    categories: list[str] | None = None,
    venues: list[str] | None = None,
    show_missing: bool = False,
    check_venues: bool = False,
    check_data_types: bool = False,
    check_feature_groups: bool = False,
    check_timeframes: bool = False,
    mode: str = "batch",
) -> dict[str, object]:
    """
    Fetch data status from the deployment-service HTTP API.

    Previously invoked `python -m deployment_service.cli data-status` as a subprocess.
    Replaced with an HTTP call to GET /api/v1/data-status on the deployment-service.
    """
    try:
        result = await _ds_client.get_data_status(
            service=service,
            start_date=start_date,
            end_date=end_date,
            categories=categories,
            venues=venues,
            show_missing=show_missing,
            check_venues=check_venues,
            check_data_types=check_data_types,
            check_feature_groups=check_feature_groups,
            check_timeframes=check_timeframes,
            mode=mode,
        )
        return result
    except RuntimeError as e:
        logger.error("deployment-service data-status call failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Data status check failed: {e!s}") from e
