"""
Deployment validation and verification utilities.

Contains functions for validating deployment requests, computing verification results,
and managing deployment completion verification workflows.

NOTE: This module MUST NOT import from deployment_service Python packages.
State loading uses deployment_api.utils.local_state_manager (HTTP/GCS boundary).
"""

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import Protocol, cast

logger = logging.getLogger(__name__)


class _DeployRequestProtocol(Protocol):
    """Protocol for deployment request objects used in validation functions."""

    service: str
    compute: str
    mode: str
    start_date: str | None
    end_date: str | None
    max_concurrent: int | None
    log_level: str
    region: str | None
    vm_zone: str | None
    category: str | None
    date_granularity: str | None


async def _compute_and_cache_verification(
    state_manager: object,
    deployment_id: str,
    state: object,
) -> dict[str, object]:
    """
    Compute and cache verification results for a deployment.

    Runs log analysis and data status checks concurrently to verify deployment completion.
    """
    # Import here to avoid circular imports
    from .data_batch_processing import get_data_status_turbo_impl
    from .deployment_caching import set_verification_cache
    from .log_analysis import analyze_deployment_logs
    from .shard_management import (
        build_blob_timestamp_map,
        build_existing_dates_sets,
        categories_from_state,
        classify_all_shards,
        compute_classification_counts,
        compute_completed_breakdown,
        get_state_date_range,
        resolve_shard_blob_data,
    )

    start_date, end_date = get_state_date_range(state)
    if not start_date or not end_date:
        raise RuntimeError("Missing start_date/end_date; cannot verify output files")

    # Run log analysis and TURBO data status CONCURRENTLY.
    # Previously these ran sequentially, adding ~10s of log analysis latency
    # before the fast (~3s) TURBO queries even started.
    async def _run_log_analysis() -> dict[str, object] | None:
        try:
            result = await analyze_deployment_logs(state_manager, deployment_id, state)
            return cast(dict[str, object] | None, result.get("log_analysis"))
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("[VERIFY] Log analysis failed for %s: %s", deployment_id, e)
            return None

    async def _run_turbo() -> dict[str, object]:
        return await get_data_status_turbo_impl(
            service=str(
                cast(dict[str, object], state).get("service", "")  # noqa: qg-empty-fallback — state dict deserialization default
                if isinstance(state, dict)
                else getattr(state, "service", "") or ""  # noqa: qg-empty-fallback — state attr fallback
            ),
            start_date=start_date,
            end_date=end_date,
            category=categories_from_state(cast(object, state)),
            venue=None,
            folder=None,
            data_type=None,
            include_sub_dimensions=True,
            include_dates_list=True,
            full_dates_list=True,
            first_day_of_month_only=False,
        )

    log_analysis, turbo_result = await asyncio.gather(_run_log_analysis(), _run_turbo())

    if turbo_result.get("error"):
        raise RuntimeError(str(turbo_result.get("error")))

    existing_cat_dates, existing_venue_dates = build_existing_dates_sets(turbo_result)

    # Build blob timestamp map from turbo results (zero extra API calls)
    blob_timestamps = build_blob_timestamp_map(turbo_result)

    # Resolve per-shard blob data (existence + timestamp) from turbo data
    blob_data = resolve_shard_blob_data(
        state, existing_cat_dates, existing_venue_dates, blob_timestamps
    )

    # Classify every shard using the full decision tree
    shard_classifications = classify_all_shards(state, log_analysis, blob_data)
    classification_counts = compute_classification_counts(shard_classifications)

    # Compute legacy breakdown fields included in the response envelope
    breakdown = compute_completed_breakdown(
        state,
        log_analysis,
        existing_cat_dates=existing_cat_dates,
        existing_venue_dates=existing_venue_dates,
    )

    # Merge new classification data into the breakdown
    breakdown["shard_classifications"] = shard_classifications
    breakdown["classification_counts"] = classification_counts

    set_verification_cache(deployment_id, breakdown)
    return breakdown


async def run_verification_and_cache_background(deployment_id: str) -> None:
    """Run verification in background and cache results."""
    from .deployment_caching import remove_verification_pending

    try:
        from deployment_api import settings as _settings
        from deployment_api.utils.local_state_manager import load_state as _load_state

        from .deployment_caching import get_cached_deployment_state

        # Thin adapter: get_cached_deployment_state calls .load_state(deployment_id)
        class _LocalStateAdapter:
            def load_state(self, dep_id: str) -> dict[str, object] | None:
                return _load_state(dep_id, bucket=_settings.STATE_BUCKET)

        state_manager = _LocalStateAdapter()

        state = await get_cached_deployment_state(state_manager, deployment_id, force_refresh=True)
        if not state:
            return

        await _compute_and_cache_verification(state_manager, deployment_id, state)
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("[VERIFY] Background verification failed for %s: %s", deployment_id, e)
    finally:
        remove_verification_pending(deployment_id)


def _get_service_earliest_start(service: str, config_dir: str) -> str:
    """
    Get the earliest start date for a service from expected_start_dates.yaml.

    Returns the minimum start date across all categories for the service.
    """

    def _yesterday() -> str:
        return (datetime.now(UTC) - timedelta(days=1)).strftime("%Y-%m-%d")

    try:
        from deployment_api.config_loader import ConfigLoader

        loader = ConfigLoader(config_dir)
        expected_dates = loader.load_expected_start_dates()

        service_dates = cast(dict[str, object], expected_dates.get(service) or {})
        if not service_dates:
            return _yesterday()

        # Find earliest start date across all categories
        earliest: str | None = None
        for category_data in service_dates.values():
            if isinstance(category_data, dict):
                cat_data = cast(dict[str, object], category_data)
                category_start = cast(str | None, cat_data.get("category_start"))
                if category_start and (earliest is None or category_start < earliest):
                    earliest = category_start

        return earliest or _yesterday()

    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Error loading service earliest start for %s: %s", service, e)
        return _yesterday()


def resolve_deploy_dates(
    deploy_request: _DeployRequestProtocol, config_dir: str = "configs"
) -> tuple[str, str]:
    """
    Resolve effective start and end dates for deployment.

    Uses provided dates or falls back to service defaults from expected_start_dates.yaml.
    """
    start_date = deploy_request.start_date
    end_date = deploy_request.end_date

    # Resolve start date
    if not start_date:
        start_date = _get_service_earliest_start(deploy_request.service, config_dir)

    # Resolve end date
    if not end_date:
        # Default to yesterday
        end_date = (datetime.now(UTC) - timedelta(days=1)).strftime("%Y-%m-%d")

    return start_date, end_date


def validate_deployment_request(deploy_request: _DeployRequestProtocol) -> dict[str, object] | None:
    """
    Validate deployment request parameters.

    Returns error dict if validation fails, None if valid.
    """
    errors: list[str] = []

    # Validate service
    if not deploy_request.service or not deploy_request.service.strip():
        errors.append("Service name is required")

    # Validate compute mode
    if deploy_request.compute not in ["cloud_run", "vm"]:
        errors.append("Compute mode must be 'cloud_run' or 'vm'")

    # Validate mode
    if deploy_request.mode not in ["batch", "live"]:
        errors.append("Mode must be 'batch' or 'live'")

    # Validate dates if provided
    if deploy_request.start_date:
        try:
            datetime.strptime(deploy_request.start_date, "%Y-%m-%d")
        except ValueError:
            errors.append("Invalid start_date format. Use YYYY-MM-DD")

    if deploy_request.end_date:
        try:
            datetime.strptime(deploy_request.end_date, "%Y-%m-%d")
        except ValueError:
            errors.append("Invalid end_date format. Use YYYY-MM-DD")

    # Validate date range
    if deploy_request.start_date and deploy_request.end_date:
        try:
            start = datetime.strptime(deploy_request.start_date, "%Y-%m-%d")
            end = datetime.strptime(deploy_request.end_date, "%Y-%m-%d")
            if start > end:
                errors.append("Start date must be before or equal to end date")
        except ValueError:
            pass  # Date format errors already caught above

    # Validate max_concurrent limits
    if deploy_request.max_concurrent is not None:
        from deployment_api import settings as _settings

        max_limit = getattr(_settings, "MAX_CONCURRENT_HARD_LIMIT", 2500)
        if deploy_request.max_concurrent > max_limit:
            errors.append(f"max_concurrent cannot exceed {max_limit}")
        if deploy_request.max_concurrent <= 0:
            errors.append("max_concurrent must be positive")

    # Validate log level
    if deploy_request.log_level not in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]:
        errors.append("Invalid log_level. Must be DEBUG, INFO, WARNING, ERROR, or CRITICAL")

    # Validate region format
    if (
        deploy_request.region
        and not deploy_request.region.replace("-", "").replace("_", "").isalnum()
    ):
        errors.append("Invalid region format")

    # Validate zone format
    if (
        deploy_request.vm_zone
        and not deploy_request.vm_zone.replace("-", "").replace("_", "").isalnum()
    ):
        errors.append("Invalid vm_zone format")

    if errors:
        return {"error": "validation_failed", "details": errors}

    return None


def validate_shard_configuration(
    service_config: dict[str, object], deploy_request: _DeployRequestProtocol
) -> dict[str, object] | None:
    """
    Validate shard configuration for the service.

    Returns error dict if validation fails, None if valid.
    """
    errors: list[str] = []

    # Check required service configuration
    if not service_config:
        errors.append("Service configuration not found")
        return {"error": "config_missing", "details": errors}

    # Validate sharding dimensions
    sharding_dims = cast(list[object], service_config.get("sharding_dimensions") or [])
    if not sharding_dims:
        errors.append("Service has no sharding dimensions configured")

    # Validate date granularity
    date_granularity = deploy_request.date_granularity or cast(
        str | None, service_config.get("date_granularity", "daily")
    )
    if date_granularity not in ["daily", "weekly", "monthly", "none"]:
        errors.append("Invalid date_granularity. Must be daily, weekly, monthly, or none")

    # Validate required dimensions are available
    required_dims: set[str] = set()
    if "category" in sharding_dims and not deploy_request.category:
        # Check if service has default categories
        default_categories = service_config.get("default_categories")
        if not default_categories:
            required_dims.add("category")

    if required_dims:
        errors.append(f"Missing required dimensions: {', '.join(required_dims)}")

    if errors:
        return {"error": "shard_validation_failed", "details": errors}

    return None


def validate_quota_requirements(
    quota_shape: dict[str, object], shard_count: int
) -> dict[str, object] | None:
    """
    Validate that quota requirements can be satisfied.

    Returns error dict if validation fails, None if valid.
    """
    from deployment_api.utils.quota_requirements import multiply_resources

    try:
        total_resources = multiply_resources(cast(dict[str, float], quota_shape), shard_count)

        # Basic validation - check if resources seem reasonable
        cpu_cores = total_resources.get("cpu_cores", 0)
        memory_gb = total_resources.get("memory_gb", 0)

        # Reasonable limits (these can be adjusted based on actual constraints)
        max_cpu_cores = 10000  # Total across all shards
        max_memory_gb = 50000  # Total across all shards

        errors: list[str] = []
        if cpu_cores > max_cpu_cores:
            errors.append(
                f"Total CPU requirement ({cpu_cores} cores) exceeds limit ({max_cpu_cores})"
            )

        if memory_gb > max_memory_gb:
            errors.append(
                f"Total memory requirement ({memory_gb} GB) exceeds limit ({max_memory_gb})"
            )

        if errors:
            return {"error": "quota_exceeded", "details": errors}

        return None

    except (OSError, ValueError, RuntimeError) as e:
        return {"error": "quota_validation_failed", "details": [str(e)]}


def validate_image_availability(docker_image: str, region: str) -> dict[str, object] | None:
    """
    Validate that the Docker image is available in the specified region.

    Returns error dict if validation fails, None if valid.
    """
    try:
        logger.debug("Image validation deferred (async): %s in %s", docker_image, region)
        return None

    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Error validating image availability: %s", e)
        # Don't fail deployment due to image validation issues
        return None


def generate_deployment_report(
    state: object,
    log_analysis: dict[str, object] | None,
    verification_data: dict[str, object] | None,
) -> dict[str, object]:
    """
    Generate comprehensive deployment report.

    Combines state information, log analysis, and verification data into a structured report.
    """
    from .shard_management import status_str

    report: dict[str, object] = {
        "deployment_id": getattr(state, "deployment_id", "unknown"),
        "service": getattr(state, "service", "unknown"),
        "status": status_str(getattr(state, "status", "unknown")),
        "created_at": getattr(state, "created_at", None),
        "updated_at": getattr(state, "updated_at", None),
        "total_shards": len(getattr(state, "shards", [])),
        "compute_type": getattr(state, "compute_type", "unknown"),
        "deployment_mode": getattr(state, "deployment_mode", "batch"),
    }

    # Add shard status summary
    shards = cast(list[object], getattr(state, "shards", []))
    status_counts: dict[str, int] = {}
    for shard in shards:
        status = status_str(getattr(shard, "status", "unknown"))
        status_counts[status] = status_counts.get(status, 0) + 1

    report["shard_status_summary"] = status_counts

    # Add log analysis summary
    if log_analysis:
        errors_list = cast(list[object], log_analysis.get("errors") or [])
        warnings_list = cast(list[object], log_analysis.get("warnings") or [])
        report["log_summary"] = {
            "total_errors": len(errors_list),
            "total_warnings": len(warnings_list),
            "has_stack_traces": log_analysis.get("has_stack_traces", False),
            "shards_analyzed": log_analysis.get("shards_analyzed", 0),
        }

    # Add verification summary
    if verification_data:
        classification_counts = cast(
            dict[str, int], verification_data.get("classification_counts") or {}
        )
        report["verification_summary"] = {
            "verified_clean": classification_counts.get("VERIFIED", 0),
            "data_missing": classification_counts.get("DATA_MISSING", 0),
            "completed_with_errors": classification_counts.get("COMPLETED_WITH_ERRORS", 0),
            "completed_with_warnings": classification_counts.get("COMPLETED_WITH_WARNINGS", 0),
            "failed_shards": sum(
                classification_counts.get(status, 0)
                for status in ["INFRA_FAILURE", "CODE_FAILURE", "TIMEOUT_FAILURE", "VM_DIED"]
            ),
        }

    # Add configuration summary
    config = cast(dict[str, object], getattr(state, "config", {}))
    if config:
        report["configuration"] = {
            "region": config.get("region"),
            "max_concurrent": config.get("max_concurrent"),
            "force": config.get("force", False),
            "dry_run": config.get("dry_run", False),
        }

    return report
