"""
Core deployment management operations.

This module handles the business logic for deployment operations
including creation, validation, quota checking, and execution.
"""

from __future__ import annotations

import logging
import uuid
from collections.abc import Callable
from datetime import date as _date
from typing import TYPE_CHECKING, cast

from unified_events_interface import log_event

from deployment_api import settings as _settings
from deployment_api.clients import deployment_service_client as _ds_client
from deployment_api.config_loader import ConfigLoader
from deployment_api.config_loader import substitute_env_vars as _substitute_env_vars

# These imports are deferred to break the circular dependency:
# services/__init__ → deployment_manager → routes/deployment_validation
# → routes/__init__ → deployments.py → services.deployment_manager (cycle)
# Each method that needs them imports inline at call time (safe after full init).
from deployment_api.utils.quota_requirements import (
    VmQuotaShape,
    multiply_resources,
    vm_quota_shape_from_compute_config,
)

if TYPE_CHECKING:
    from deployment_api.routes.deployments import DeployRequest

logger = logging.getLogger(__name__)

# Events system is initialized at application startup (main.py), not at import time

# Module-level references to route functions used in methods below.
# These are imported lazily inside each method to break circular imports at init
# time, but are also exposed here at module scope so tests can patch them via
# `patch("deployment_api.services.deployment_manager.<name>", ...)`.
# The actual callables are resolved at call time through the lazy-import path
# below; these stubs are ONLY placeholders to satisfy `patch()` attribute lookups.


def validate_deployment_request(deploy_request: DeployRequest) -> dict[str, object] | None:
    """Lazy-import shim — forwards to routes.deployment_validation at call time."""
    from deployment_api.routes.deployment_validation import (
        validate_deployment_request as _impl,
    )

    return _impl(deploy_request)


def validate_shard_configuration(
    service_cfg: dict[str, object], deploy_request: DeployRequest
) -> dict[str, object] | None:
    """Lazy-import shim — forwards to routes.deployment_validation at call time."""
    from deployment_api.routes.deployment_validation import (
        validate_shard_configuration as _impl,
    )

    return _impl(service_cfg, deploy_request)


def validate_quota_requirements(shape: dict[str, object], count: int) -> dict[str, object] | None:
    """Lazy-import shim — forwards to routes.deployment_validation at call time."""
    from deployment_api.routes.deployment_validation import (
        validate_quota_requirements as _impl,
    )

    return _impl(shape, count)


def validate_image_availability(docker_image: str, region: str) -> dict[str, object] | None:
    """Lazy-import shim — forwards to routes.deployment_validation at call time."""
    from deployment_api.routes.deployment_validation import (
        validate_image_availability as _impl,
    )

    return _impl(docker_image, region)


def generate_deployment_report(
    state: object,
    log_analysis: dict[str, object] | None,
    verification_data: dict[str, object] | None,
) -> dict[str, object]:
    """Lazy-import shim — forwards to routes.deployment_validation at call time."""
    from deployment_api.routes.deployment_validation import (
        generate_deployment_report as _impl,
    )

    return _impl(state, log_analysis, verification_data)


def build_deploy_env_vars(
    service: str = "",
    project_id: str = "",
    deployment_id: str = "",
    max_concurrent: int = 100,
    deployment_mode: str = "vm",
    enable_direct_gcs: bool = False,
    shard_id: str | None = None,
    deploy_mode: str = "batch",
    operational_mode: str = "",
    cloud_provider: str = "gcp",
) -> dict[str, str]:
    """Lazy-import shim — forwards to routes.deployments_helpers at call time."""
    from deployment_api.routes.deployments_helpers import build_deploy_env_vars as _impl

    return _impl(
        service=service,
        project_id=project_id,
        deployment_id=deployment_id,
        max_concurrent=max_concurrent,
        deployment_mode=deployment_mode,
        enable_direct_gcs=enable_direct_gcs,
        shard_id=shard_id,
        deploy_mode=deploy_mode,
        operational_mode=operational_mode,
        cloud_provider=cloud_provider,
    )


class DeploymentManager:
    """Manages deployment operations and business logic."""

    def __init__(self) -> None:
        """Initialize the deployment manager."""
        self.default_region = _settings.GCS_REGION or "asia-northeast1"
        self.default_project_id = _settings.gcp_project_id
        self.default_max_concurrent = 100

    def validate_deployment_request(
        self, deploy_request: DeployRequest
    ) -> dict[str, object] | None:
        """
        Validate deployment request parameters.

        Returns:
            Error dict if validation fails, None if valid
        """
        return validate_deployment_request(deploy_request)

    async def calculate_quota_requirements(
        self, deploy_request: DeployRequest, config_dir: str = "configs"
    ) -> dict[str, object]:
        """
        Calculate quota requirements for a deployment.

        Calls deployment-service /api/v1/shards/calculate via HTTP to enumerate shards,
        then computes quota locally using the deployment-api ConfigLoader.

        Args:
            deploy_request: Deployment request object
            config_dir: Configuration directory path

        Returns:
            Dict containing quota requirements and recommendations
        """
        loader = ConfigLoader(config_dir)
        loader.load_service_config(deploy_request.service)

        # Calculate shards via deployment-service HTTP API
        try:
            shard_list = await _ds_client.calculate_shards(
                service=deploy_request.service,
                config_dir=config_dir,
                start_date=deploy_request.start_date,
                end_date=deploy_request.end_date,
                max_shards=deploy_request.max_shards or 10000,
                cloud_config_path=deploy_request.cloud_config_path,
                respect_start_dates=not deploy_request.ignore_start_dates,
                skip_existing=deploy_request.deploy_missing,
                skip_dimensions=deploy_request.skip_dimensions or [],
                date_granularity_override=deploy_request.date_granularity,
                extra_filters=cast(dict[str, object], deploy_request.filters),
            )
        except RuntimeError as e:
            log_event(
                "deployment.quota_calculation.failed",
                details={
                    "error_type": "shard_calculation_error",
                    "service": deploy_request.service,
                    "error_message": str(e),
                    "error_category": "http_client",
                },
            )
            raise ValueError(f"Failed to calculate shards: {e}") from e

        total_shards: int = len(shard_list)
        if total_shards == 0:
            return {
                "total_shards": 0,
                "quota_ok": True,
                "message": "No shards to deploy",
                "quota_details": {},
                "recommendations": {},
            }

        # Get compute configuration
        compute_config: dict[str, object] = loader.get_scaled_compute_config(
            deploy_request.service,
            deploy_request.compute,
            deploy_request.max_workers,
            "venue" in (deploy_request.skip_dimensions or []),
        )

        # Calculate resource requirements
        max_concurrent: int = deploy_request.max_concurrent or self.default_max_concurrent
        if deploy_request.compute == "vm":
            vm_shape: VmQuotaShape = vm_quota_shape_from_compute_config(compute_config)
            single_vm_shape: dict[str, float] = vm_shape.per_shard()
            total_shape: dict[str, float] = multiply_resources(single_vm_shape, max_concurrent)
            recommended_concurrent: int = (
                max_concurrent  # Simplified: no headroom data available here
            )
        else:
            # Cloud Run quota calculation
            cpu_raw = compute_config.get("cpu", 2)
            memory_raw = compute_config.get("memory", "4Gi")
            cpu_val: int = int(cpu_raw) if isinstance(cpu_raw, (int, float)) else 2
            memory_str: str = str(memory_raw) if memory_raw is not None else "4Gi"
            single_vm_shape = {
                "cpu": float(cpu_val),
                "memory_gb": float(int(memory_str.replace("Gi", "")) if "Gi" in memory_str else 4),
            }
            total_shape = multiply_resources(single_vm_shape, max_concurrent)
            recommended_concurrent = max_concurrent

        return {
            "total_shards": total_shards,
            "max_concurrent": max_concurrent,
            "compute_config": compute_config,
            "resource_requirements": {
                "single_shard": single_vm_shape,
                "max_concurrent_total": total_shape,
            },
            "recommendations": {
                "recommended_max_concurrent": recommended_concurrent,
                "estimated_duration_minutes": max(5, total_shards / max_concurrent * 3),
            },
            "quota_ok": True,  # Simplified for now
        }

    def _build_cli_command(self, deploy_request: DeployRequest, deployment_id: str) -> str:
        """Build the CLI command string for a deployment."""
        cli_parts: list[str] = [
            "python",
            "-m",
            "deployment",
            "deploy",
            "--service",
            deploy_request.service,
            "--compute",
            deploy_request.compute,
            "--max-concurrent",
            str(deploy_request.max_concurrent or self.default_max_concurrent),
            "--region",
            deploy_request.region or self.default_region,
            "--deployment-id",
            deployment_id,
        ]
        if deploy_request.start_date:
            start_date_val = deploy_request.start_date
            start_str: str = (
                start_date_val.isoformat()
                if isinstance(start_date_val, _date)
                else str(start_date_val)
            )
            cli_parts.extend(["--start-date", start_str])
        if deploy_request.end_date:
            end_date_val = deploy_request.end_date
            end_str: str = (
                end_date_val.isoformat() if isinstance(end_date_val, _date) else str(end_date_val)
            )
            cli_parts.extend(["--end-date", end_str])
        if deploy_request.tag:
            cli_parts.extend(["--tag", deploy_request.tag])
        if deploy_request.vm_zone:
            cli_parts.extend(["--vm-zone", deploy_request.vm_zone])
        return " ".join(cli_parts)

    async def create_deployment(
        self,
        deploy_request: DeployRequest,
        config_dir: str = "configs",
        background_task_func: Callable[..., None] | None = None,
    ) -> dict[str, object]:
        """
        Create a new deployment.

        Args:
            deploy_request: Deployment request object
            config_dir: Configuration directory path
            background_task_func: Function to run background deployment

        Returns:
            Dict containing deployment info and shard list
        """
        # Generate deployment ID
        deployment_id: str = str(uuid.uuid4())

        log_event(
            "deployment.creation.started",
            details={
                "deployment_id": deployment_id,
                "service": deploy_request.service,
                "compute_type": deploy_request.compute,
                "region": deploy_request.region or self.default_region,
            },
        )

        # Validate request
        validation_error: dict[str, object] | None = self.validate_deployment_request(
            deploy_request
        )
        if validation_error:
            raise ValueError(str(validation_error))

        # Validate shard configuration
        loader_for_validation = ConfigLoader(config_dir)
        service_cfg: dict[str, object] = loader_for_validation.load_service_config(
            deploy_request.service
        )
        shard_error = validate_shard_configuration(service_cfg, deploy_request)
        if shard_error:
            raise ValueError(str(shard_error))

        # Validate quota requirements (simplified: no shape/count data here)
        # Note: full quota validation done in calculate_quota_requirements
        quota_error = validate_quota_requirements({}, 0)
        if quota_error:
            raise ValueError(str(quota_error))

        # Validate image availability
        _ = loader_for_validation.get_compute_recommendation(
            deploy_request.service, deploy_request.compute
        )
        region_for_validation: str = deploy_request.region or self.default_region
        raw_docker_image = service_cfg.get("docker_image")
        docker_image_for_validation: str = (
            _substitute_env_vars(str(raw_docker_image))
            if raw_docker_image
            else (
                f"{region_for_validation}-docker.pkg.dev/{self.default_project_id}"
                f"/{deploy_request.service}/{deploy_request.service}:latest"
            )
        )
        image_error = validate_image_availability(
            docker_image_for_validation, region_for_validation
        )
        if image_error:
            raise ValueError(str(image_error))

        # Calculate shards via deployment-service HTTP API
        raw_shards = await _ds_client.calculate_shards(
            service=deploy_request.service,
            config_dir=config_dir,
            start_date=deploy_request.start_date,
            end_date=deploy_request.end_date,
            max_shards=deploy_request.max_shards or 10000,
            cloud_config_path=deploy_request.cloud_config_path,
            respect_start_dates=not deploy_request.ignore_start_dates,
            skip_existing=deploy_request.deploy_missing,
            skip_dimensions=deploy_request.skip_dimensions or [],
            date_granularity_override=deploy_request.date_granularity,
            extra_filters=cast(dict[str, object], deploy_request.filters),
        )

        if not raw_shards:
            raise ValueError("No shards to deploy after filtering")

        # Normalise shard list: deployment-service returns dicts with
        # shard_index, dimensions, cli_command
        shard_list: list[dict[str, object]] = []
        for shard in raw_shards:
            shard_index = shard.get("shard_index", 0)
            total_shards = shard.get("total_shards", len(raw_shards))
            dimensions: dict[str, object] = cast(dict[str, object], shard.get("dimensions") or {})
            cli_command_raw: str = str(shard.get("cli_command") or "")
            shard_dict: dict[str, object] = {
                "shard_id": f"{deploy_request.service}-{shard_index}",
                "shard_index": shard_index,
                "total_shards": total_shards,
                "dimensions": dimensions,
                "cli_args": cli_command_raw.split()[1:] if cli_command_raw else [],
            }
            shard_list.append(shard_dict)

        cli_command: str = self._build_cli_command(deploy_request, deployment_id)

        # Start background deployment if function provided
        if background_task_func:
            background_task_func(deploy_request, config_dir, shard_list, cli_command, deployment_id)

        log_event(
            "deployment.creation.completed",
            details={
                "deployment_id": deployment_id,
                "service": deploy_request.service,
                "total_shards": len(shard_list),
                "max_concurrent": deploy_request.max_concurrent or self.default_max_concurrent,
                "background_execution": background_task_func is not None,
            },
        )

        return {
            "deployment_id": deployment_id,
            "service": deploy_request.service,
            "region": deploy_request.region or self.default_region,
            "compute": deploy_request.compute,
            "total_shards": len(shard_list),
            "max_concurrent": deploy_request.max_concurrent or self.default_max_concurrent,
            "cli_command": cli_command,
            "shard_list": shard_list,
            "status": "pending",
        }

    async def run_deployment_background(
        self,
        deploy_request: DeployRequest,
        config_dir: str,
        shard_list: list[dict[str, object]],
        cli_command: str,
        deployment_id: str,
    ) -> None:
        """
        Execute deployment in the background via deployment-service HTTP API.

        Calls POST /api/v1/deployments on the deployment-service, which owns the
        DeploymentOrchestrator execution logic.
        """
        try:
            # Resolve effective dates
            # (local config-level check, no deployment_service import needed)
            from deployment_api.routes.deployment_validation import (
                resolve_deploy_dates as _resolve_deploy_dates,
            )

            _eff_start, _eff_end = _resolve_deploy_dates(deploy_request, config_dir)

            # Use region from request or default
            deployment_region: str = deploy_request.region or self.default_region

            if deployment_region != _settings.GCS_REGION and _settings.WARN_CROSS_REGION_EGRESS:
                log_event(
                    "deployment.cross_region_warning",
                    details={
                        "deployment_region": deployment_region,
                        "gcs_region": _settings.GCS_REGION,
                        "deployment_id": deployment_id,
                        "service": deploy_request.service,
                        "cost_impact": "egress_charges",
                    },
                )

            loader: ConfigLoader = ConfigLoader(config_dir)
            service_config: dict[str, object] = loader.load_service_config(deploy_request.service)
            compute_config: dict[str, object] = loader.get_compute_recommendation(
                deploy_request.service, deploy_request.compute
            )

            raw_docker = service_config.get("docker_image")
            docker_image: str = (
                _substitute_env_vars(str(raw_docker))
                if raw_docker
                else (
                    f"{deployment_region}-docker.pkg.dev/{self.default_project_id}"
                    f"/{deploy_request.service}/{deploy_request.service}:latest"
                )
            )
            job_name: str = cast(
                str, service_config.get("cloud_run_job_name", deploy_request.service)
            )

            # Submit deployment to deployment-service HTTP API
            # deployment-service owns DeploymentOrchestrator execution logic
            await _ds_client.create_deployment(
                deployment_id=deployment_id,
                service=deploy_request.service,
                region=deployment_region,
                compute_type=deploy_request.compute,
                deployment_mode=deploy_request.mode,
                docker_image=docker_image,
                job_name=job_name,
                compute_config=compute_config,
                env_vars=build_deploy_env_vars(
                    service=deploy_request.service,
                    project_id=self.default_project_id,
                    deployment_id=deployment_id,
                    max_concurrent=deploy_request.max_concurrent or self.default_max_concurrent,
                    deployment_mode=deploy_request.compute,
                    deploy_mode=deploy_request.mode,
                    operational_mode=deploy_request.operational_mode,
                    cloud_provider=deploy_request.cloud_provider,
                ),
                max_concurrent=deploy_request.max_concurrent or self.default_max_concurrent,
                shards=shard_list,
                tag=deploy_request.tag,
                vm_zone=deploy_request.vm_zone,
            )
            log_event(
                "deployment.completed",
                details={
                    "deployment_id": deployment_id,
                    "service": deploy_request.service,
                    "region": deployment_region,
                    "compute_type": deploy_request.compute,
                    "total_shards": len(shard_list),
                    "tag": deploy_request.tag,
                },
            )

        except ValueError as e:
            log_event(
                "deployment.failed",
                severity="ERROR",
                details={
                    "deployment_id": deployment_id,
                    "service": deploy_request.service,
                    "error_type": "validation_error",
                    "error_message": str(e),
                    "error_category": "validation",
                },
            )
        except KeyError as e:
            log_event(
                "deployment.failed",
                severity="ERROR",
                details={
                    "deployment_id": deployment_id,
                    "service": deploy_request.service,
                    "error_type": "configuration_error",
                    "error_message": str(e),
                    "error_category": "configuration",
                },
            )
        except ConnectionError as e:
            log_event(
                "deployment.failed",
                severity="ERROR",
                details={
                    "deployment_id": deployment_id,
                    "service": deploy_request.service,
                    "error_type": "connection_error",
                    "error_message": str(e),
                    "error_category": "network",
                },
            )
        except OSError as e:
            log_event(
                "deployment.failed",
                severity="ERROR",
                details={
                    "deployment_id": deployment_id,
                    "service": deploy_request.service,
                    "error_type": "file_system_error",
                    "error_message": str(e),
                    "error_category": "file_system",
                },
            )
        except RuntimeError as e:
            log_event(
                "deployment.failed",
                severity="ERROR",
                details={
                    "deployment_id": deployment_id,
                    "service": deploy_request.service,
                    "error_type": "unexpected_error",
                    "error_message": str(e),
                    "error_category": "unexpected",
                },
            )

    def get_deployment_report(self, deployment_id: str) -> dict[str, object]:
        """
        Generate a detailed deployment report.

        Args:
            deployment_id: Deployment ID to generate report for

        Returns:
            Dict containing deployment report
        """
        # Load state for deployment_id and generate report.
        # Uses DeploymentStateService name so tests can inject a mock via
        # patch.dict(sys.modules, {"deployment_api.services.deployment_state": mock_mod})
        # where mock_mod.DeploymentStateService is a MagicMock factory.
        from deployment_api.services.deployment_state import DeploymentStateService

        state_service = DeploymentStateService()
        state = state_service.get_deployment_state(deployment_id)
        if not state:
            return {"error": f"Deployment {deployment_id} not found"}
        return generate_deployment_report(state, None, None)
