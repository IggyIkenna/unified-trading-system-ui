"""
Services API Routes

Endpoints for listing services, getting service configs, and venue information.
"""

import asyncio
import logging
from pathlib import Path
from typing import cast

from fastapi import APIRouter, FastAPI, HTTPException, Request

from deployment_api.config_loader import ConfigLoader
from deployment_api.deployment_api_config import DeploymentApiConfig
from deployment_api.settings import (
    EXECUTION_STORE_BUCKET,
    ML_CONFIGS_STORE_BUCKET,
    STRATEGY_STORE_CEFI_BUCKET,
    STRATEGY_STORE_DEFI_BUCKET,
    STRATEGY_STORE_TRADFI_BUCKET,
)
from deployment_api.utils.cache import TTL_SERVICE_CONFIG, cache

_cfg = DeploymentApiConfig()

logger = logging.getLogger(__name__)

router = APIRouter()

# Module-level cached ConfigLoader (avoids re-creating per request)
_config_loader: ConfigLoader | None = None


def get_config_loader(request: Request) -> ConfigLoader:
    """Get shared ConfigLoader instance using app's config directory."""
    global _config_loader
    if _config_loader is None:
        fapp = cast(FastAPI, request.app)
        config_dir = cast(Path, fapp.state.config_dir)
        _config_loader = ConfigLoader(str(config_dir))
    return _config_loader


@router.get("")
async def list_services(request: Request):
    """
    List all available services with their sharding configurations.

    Returns:
        List of services with their descriptions and dimensions.
    """
    if _cfg.is_mock_mode():
        from deployment_api.mock_state import get_store

        items = get_store().list("services")
        return {"services": items, "count": len(items)}

    def _load_services_sync():
        """Sync function to load services - runs in thread pool."""
        loader = get_config_loader(request)
        services = loader.list_available_services()

        result: list[dict[str, object]] = []
        for service in services:
            try:
                config = loader.load_service_config(service)
                dims_raw = cast(list[dict[str, object]], config.get("dimensions") or [])
                result.append(
                    {
                        "name": service,
                        "description": config.get("description", "No description"),
                        "dimensions": [d["name"] for d in dims_raw],
                        "docker_image": config.get("docker_image"),
                        "cloud_run_job_name": config.get("cloud_run_job_name"),
                    }
                )
            except (OSError, ValueError, RuntimeError) as e:
                result.append(
                    {
                        "name": service,
                        "description": f"Error loading config: {e}",
                        "dimensions": [],
                    }
                )
        return result

    result = await asyncio.to_thread(_load_services_sync)
    return {"services": result, "count": len(result)}


@router.get("/{service_name}")
async def get_service_config(service_name: str, request: Request):
    """
    Get detailed configuration for a specific service.

    Args:
        service_name: Name of the service

    Returns:
        Full sharding configuration for the service.
    """

    def _load_config_sync():
        loader = get_config_loader(request)
        return loader.load_service_config(service_name)

    try:
        config = await asyncio.to_thread(_load_config_sync)
        return {
            "service": service_name,
            "config": config,
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found") from None
    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Internal error in get_service_config")
        raise HTTPException(status_code=500, detail="Internal server error") from e


def _build_dim_info(dim: dict[str, object], venues_config: dict[str, object]) -> dict[str, object]:
    """Build dimension info dict for a single dimension entry."""
    dim_info: dict[str, object] = {
        "name": dim["name"],
        "type": dim["type"],
        "description": dim.get("description") or "",
    }
    if dim["type"] == "fixed":
        dim_info["values"] = dim.get("values") or []
    elif dim["type"] == "hierarchical":
        dim_info["parent"] = dim.get("parent")
        if dim["name"] == "venue":
            values_by_parent: dict[str, object] = {}
            dim_info["values_by_parent"] = values_by_parent
            categories_raw: object = venues_config.get("categories") or {}
            categories_map = cast(dict[str, object], categories_raw)
            for category, cat_data in categories_map.items():
                cat_data_dict = (
                    cast(dict[str, object], cat_data) if isinstance(cat_data, dict) else {}
                )
                cat_venues_raw: object = cat_data_dict.get("venues") or []
                cat_venues: list[object] = (
                    cast(list[object], cat_venues_raw) if isinstance(cat_venues_raw, list) else []
                )
                values_by_parent[category] = cat_venues
    elif dim["type"] == "date_range":
        dim_info["granularity"] = dim.get("granularity", "daily")
    return dim_info


def _load_dimensions_sync(loader: ConfigLoader, service_name: str) -> dict[str, object]:
    """Load and build dimension config for a service."""
    config = loader.load_service_config(service_name)
    venues_config = loader.load_venues_config()
    dimensions: list[dict[str, object]] = [
        _build_dim_info(dim, venues_config)
        for dim in cast(list[dict[str, object]], config.get("dimensions") or [])
    ]
    cli_args_raw: object = config.get("cli_args") or {}
    cli_args: dict[str, object] = (
        cast(dict[str, object], cli_args_raw) if isinstance(cli_args_raw, dict) else {}
    )
    return {"service": service_name, "dimensions": dimensions, "cli_args": cli_args}


@router.get("/{service_name}/dimensions")
async def get_service_dimensions(service_name: str, request: Request):
    """
    Get dimension values for a specific service.

    Args:
        service_name: Name of the service

    Returns:
        Dimension definitions with their possible values.
    """
    cache_key = f"config:dimensions:{service_name}"

    async def _fetch():
        loader = get_config_loader(request)
        return await asyncio.to_thread(_load_dimensions_sync, loader, service_name)

    try:
        return await cache.get_or_fetch(cache_key, _fetch, TTL_SERVICE_CONFIG)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found") from None
    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Internal error in get_service_dimensions")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/{service_name}/discover-configs")
async def discover_configs(
    service_name: str,
    cloud_path: str,
    request: Request,
):
    """
    Discover config files from a cloud storage path.

    This endpoint lists all .json config files in a cloud storage directory
    and returns the count for shard estimation.

    Args:
        service_name: Name of the service (for validation)
        cloud_path: Cloud storage path (gs://... or s3://...)

    Returns:
        List of discovered config file paths and count.
    """

    def _discover_configs_sync():
        from deployment_api.utils.cloud_storage_client import list_cloud_files

        # Validate cloud path format
        if not cloud_path.startswith("gs://") and not cloud_path.startswith("s3://"):  # noqa: gs-uri
            raise ValueError(
                f"Invalid cloud path format. Must start with gs:// or s3://. Got: {cloud_path}"
            )

        # List all JSON files recursively (increased limit to 10000 for large config sets)
        all_files = list_cloud_files(cloud_path, "**/*.json", max_results=10000)

        # Filter out non-config files (manifest.json, package.json, etc.)
        excluded_filenames = {
            "manifest.json",
            "package.json",
            "tsconfig.json",
            "schema.json",
        }
        config_files = [
            f
            for f in all_files
            if not any(f.endswith(f"/{excl}") or f.endswith(excl) for excl in excluded_filenames)
        ]

        return config_files

    try:
        configs = await asyncio.to_thread(_discover_configs_sync)

        # Return a sample of configs (max 20) for preview + total count
        sample_size = min(20, len(configs))
        return {
            "service": service_name,
            "cloud_path": cloud_path,
            "total_configs": len(configs),
            "sample": configs[:sample_size],
            "truncated": len(configs) > sample_size,
        }
    except ValueError as e:
        logger.exception("Invalid request for config discovery")
        raise HTTPException(status_code=400, detail="Internal error — see server logs") from e
    except (OSError, RuntimeError) as e:
        logger.exception("Failed to discover configs: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/{service_name}/list-directories")
async def list_directories(
    service_name: str,
    cloud_path: str,
    request: Request,
):
    """
    List subdirectories in a cloud storage path.

    This enables hierarchical browsing of GCS directories for config selection.

    Args:
        service_name: Name of the service (for context)
        cloud_path: Cloud storage path (gs://bucket/prefix/)

    Returns:
        List of immediate subdirectory names.
    """

    def _list_directories_sync():
        # Validate cloud path format
        if not cloud_path.startswith("gs://"):  # noqa: gs-uri
            raise ValueError(f"Invalid GCS path format. Must start with gs://. Got: {cloud_path}")

        # Parse bucket and prefix from gs:// path
        path_without_scheme = cloud_path[5:]  # Remove gs:// prefix
        parts = path_without_scheme.split("/", 1)
        bucket_name = parts[0]
        prefix = parts[1] if len(parts) > 1 else ""

        # Ensure prefix ends with /
        if prefix and not prefix.endswith("/"):
            prefix += "/"

        from deployment_api.utils.storage_facade import list_prefixes

        # List prefixes (directories) via storage facade (FUSE when production)
        prefix_names = list_prefixes(bucket_name, prefix)

        # Extract just the directory name from the full prefix
        # e.g., "configs/V1/" -> "V1"
        directories: set[str] = set()
        for prefix_name in prefix_names:
            dir_name = prefix_name[len(prefix) :].rstrip("/")
            if dir_name:
                directories.add(dir_name)

        return sorted(directories)

    try:
        directories = await asyncio.to_thread(_list_directories_sync)
        return {
            "service": service_name,
            "cloud_path": cloud_path,
            "directories": directories,
            "count": len(directories),
        }
    except ValueError as e:
        logger.exception("Invalid request for directory listing")
        raise HTTPException(status_code=400, detail="Internal error — see server logs") from e
    except (OSError, RuntimeError) as e:
        logger.exception("Failed to list directories: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/{service_name}/config-buckets")
async def get_config_buckets(service_name: str, request: Request):
    """
    Get the default config bucket(s) for a service.

    Returns the GCS bucket path where configs are typically stored.
    """
    # Service-specific bucket mappings.
    # Bucket names come from config fields (EXECUTION_STORE_BUCKET, etc.) populated via
    # DeploymentApiConfig env vars. Defaults derived from gcp_project_id when env vars unset.
    bucket_mappings: dict[str, dict[str, object]] = {
        "execution-service": {
            "default_bucket": f"gs://{EXECUTION_STORE_BUCKET}/configs/",  # noqa: gs-uri
            "buckets": [
                {
                    "name": "execution-store (main)",
                    "path": f"gs://{EXECUTION_STORE_BUCKET}/configs/",  # noqa: gs-uri
                },
            ],
        },
        "strategy-service": {
            "default_bucket": f"gs://{STRATEGY_STORE_CEFI_BUCKET}/configs_grid/",  # noqa: gs-uri
            "buckets": [
                {
                    "name": "strategy-store-cefi",
                    "path": f"gs://{STRATEGY_STORE_CEFI_BUCKET}/configs_grid/",  # noqa: gs-uri
                },
                {
                    "name": "strategy-store-tradfi",
                    "path": f"gs://{STRATEGY_STORE_TRADFI_BUCKET}/configs_grid/",  # noqa: gs-uri
                },
                {
                    "name": "strategy-store-defi",
                    "path": f"gs://{STRATEGY_STORE_DEFI_BUCKET}/configs_grid/",  # noqa: gs-uri
                },
            ],
        },
        "ml-training-service": {
            "default_bucket": f"gs://{ML_CONFIGS_STORE_BUCKET}/training/grid_configs/",  # noqa: gs-uri
            "buckets": [
                {
                    "name": "ml-configs-store",
                    "path": f"gs://{ML_CONFIGS_STORE_BUCKET}/training/grid_configs/",  # noqa: gs-uri
                },
            ],
        },
    }

    if service_name not in bucket_mappings:
        no_buckets: list[dict[str, object]] = []
        return {
            "service": service_name,
            "default_bucket": None,
            "buckets": no_buckets,
            "message": f"No config buckets configured for {service_name}",
        }

    return {
        "service": service_name,
        **bucket_mappings[service_name],
    }
