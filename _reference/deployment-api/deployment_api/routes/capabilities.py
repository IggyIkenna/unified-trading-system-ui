"""API capabilities and runtime info for UI display."""

from typing import cast

import yaml
from fastapi import APIRouter, HTTPException

from deployment_api.utils.service_utils import get_config_dir
from deployment_api.utils.storage_facade import get_gcs_fuse_status

router = APIRouter()


@router.get("")
async def get_capabilities():
    """
    Get API capabilities for UI display.

    Includes GCS Fuse status: whether the API is using FUSE mounts for GCS
    reads (faster) or falling back to GCS API.
    """
    return {"gcs_fuse": get_gcs_fuse_status()}


@router.get("/service-categories/{service}")
async def get_service_categories(service: str) -> dict[str, object]:
    """
    Get supported categories for a service from its sharding config.

    Returns the categories that can be used for deployment and data status checks.
    This allows the UI to hide irrelevant category filters (e.g., hide CEFI/DEFI
    when viewing corporate-actions which is TRADFI-only).

    Args:
        service: Service name (e.g., "instruments-service", "corporate-actions")

    Returns:
        {"service": str, "categories": List[str]}

    Examples:
        - instruments-service: ["CEFI", "DEFI", "TRADFI"]
        - corporate-actions: ["TRADFI"]
        - features-calendar-service: []  # No category dimension
    """
    # Load sharding config
    config_path = get_config_dir() / f"sharding.{service}.yaml"

    if not config_path.exists():
        raise HTTPException(
            status_code=404, detail=f"Sharding config not found for service: {service}"
        )

    try:
        with open(config_path) as f:
            config = cast(dict[str, object], yaml.safe_load(f))

        # Find the category dimension
        dimensions = cast(list[dict[str, object]], config.get("dimensions") or [])
        for dim in dimensions:
            if dim.get("name") == "category":
                values_raw: object = dim.get("values") or []
                values: list[object] = (
                    cast(list[object], values_raw) if isinstance(values_raw, list) else []
                )
                return {"service": service, "categories": values}

        # No category dimension found
        no_categories: list[object] = []
        return {"service": service, "categories": no_categories}

    except (OSError, ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sharding config: {e}") from e
