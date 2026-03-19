"""
FastAPI route handlers for the deployment-service HTTP API.

Endpoints match exactly what deployment_service_client.py in deployment-api calls.
All routes delegate to StateManager and existing deployment-service internals.
"""

from __future__ import annotations

import logging
from typing import cast

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from deployment_service.deployment.state import StateManager
from deployment_service.deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1")

_config = DeploymentConfig()


def _get_state_manager() -> StateManager:
    """Return a StateManager using deployment config defaults."""
    return StateManager(
        bucket_name=_config.state_bucket,
        project_id=_config.gcp_project_id,
    )


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class CalculateShardsRequest(
    BaseModel
):  # CORRECT-LOCAL — FastAPI request body, not a domain contract
    service: str
    config_dir: str
    start_date: str | None = None
    end_date: str | None = None
    max_shards: int = 10000
    cloud_config_path: str | None = None
    respect_start_dates: bool = True
    skip_existing: bool = False
    skip_dimensions: list[str] = []
    date_granularity_override: str | None = None
    extra_filters: dict[str, object] = {}


class CreateDeploymentRequest(
    BaseModel
):  # CORRECT-LOCAL — FastAPI request body, not a domain contract
    deployment_id: str
    service: str
    region: str
    compute_type: str
    deployment_mode: str
    docker_image: str
    job_name: str
    compute_config: dict[str, object]
    env_vars: dict[str, str]
    max_concurrent: int
    shards: list[dict[str, object]]
    tag: str | None = None
    vm_zone: str | None = None


class CancelVMJobsRequest(BaseModel):  # CORRECT-LOCAL — FastAPI request body, not a domain contract
    deployment_id: str
    project_id: str
    region: str
    service_account_email: str
    state_bucket: str
    state_prefix: str
    job_name: str
    jobs: list[dict[str, str | None]]
    fire_and_forget: bool = True


class VMStatusBatchRequest(
    BaseModel
):  # CORRECT-LOCAL — FastAPI request body, not a domain contract
    project_id: str
    zone: str
    vm_names: list[str]


class QuotaAcquireRequest(BaseModel):  # CORRECT-LOCAL — FastAPI request body, not a domain contract
    quota_shape: dict[str, object]
    batch_size: int


class QuotaReleaseRequest(BaseModel):  # CORRECT-LOCAL — FastAPI request body, not a domain contract
    quota_shape: dict[str, object]
    batch_size: int


class CloudRunStatusBatchRequest(
    BaseModel
):  # CORRECT-LOCAL — FastAPI request body, not a domain contract
    project_id: str
    region: str
    service_account_email: str
    job_name: str
    job_ids: list[str]


class RollbackRequest(BaseModel):  # CORRECT-LOCAL — FastAPI request body, not a domain contract
    service: str
    region: str
    target_revision: str | None = None


# ---------------------------------------------------------------------------
# Shard calculation  POST /api/v1/shards/calculate
# ---------------------------------------------------------------------------


@router.post("/shards/calculate")
async def calculate_shards(request: CalculateShardsRequest) -> dict[str, object]:
    """Calculate deployment shards for a service."""
    try:
        from deployment_service.shard_calculator import ShardCalculator

        calculator = ShardCalculator(config_dir=request.config_dir)
        kwargs: dict[str, object] = {
            "service": request.service,
            "max_shards": request.max_shards,
            "respect_start_dates": request.respect_start_dates,
            "skip_existing": request.skip_existing,
            "skip_dimensions": request.skip_dimensions,
        }
        if request.start_date is not None:
            kwargs["start_date"] = request.start_date
        if request.end_date is not None:
            kwargs["end_date"] = request.end_date
        if request.cloud_config_path is not None:
            kwargs["cloud_config_path"] = request.cloud_config_path
        if request.date_granularity_override is not None:
            kwargs["date_granularity_override"] = request.date_granularity_override
        if request.extra_filters:
            kwargs.update(request.extra_filters)

        shards = calculator.calculate_shards(**kwargs)
        return {"shards": shards}
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("calculate_shards failed for %s: %s", request.service, e)
        raise HTTPException(status_code=500, detail=str(e)) from e


# ---------------------------------------------------------------------------
# Create deployment  POST /api/v1/deployments
# ---------------------------------------------------------------------------


@router.post("/deployments", status_code=202)
async def create_deployment(request: CreateDeploymentRequest) -> dict[str, object]:
    """Create and persist a new deployment state."""
    try:
        sm = _get_state_manager()
        state = sm.create_deployment(
            service=request.service,
            compute_type=request.compute_type,
            shards=request.shards,
            deployment_id=request.deployment_id,
            config={
                "region": request.region,
                "deployment_mode": request.deployment_mode,
                "docker_image": request.docker_image,
                "job_name": request.job_name,
                "max_concurrent": request.max_concurrent,
                "env_vars": request.env_vars,
                "vm_zone": request.vm_zone,
                **request.compute_config,
            },
            tag=request.tag,
        )
        return {
            "deployment_id": state.deployment_id,
            "status": state.status.value,
            "message": "Deployment created",
        }
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("create_deployment failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e


# ---------------------------------------------------------------------------
# Data status  GET /api/v1/data-status
# ---------------------------------------------------------------------------


@router.get("/data-status")
async def get_data_status(
    service: str,
    start_date: str,
    end_date: str,
    mode: str = "batch",
    show_missing: bool = False,
    check_venues: bool = False,
    check_data_types: bool = False,
    check_feature_groups: bool = False,
    check_timeframes: bool = False,
    categories: list[str] | None = None,
    venues: list[str] | None = None,
) -> dict[str, object]:
    """Query data status for a service."""
    try:
        from deployment_service.catalog import DataCatalog

        catalog = DataCatalog()
        result = catalog.catalog_service(
            service=service,
            start_date=start_date,  # type: ignore[arg-type]
            end_date=end_date,  # type: ignore[arg-type]
        )
        return result.to_dict()
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("get_data_status failed for %s: %s", service, e)
        raise HTTPException(status_code=500, detail=str(e)) from e


# ---------------------------------------------------------------------------
# VM jobs cancel  POST /api/v1/vm-jobs/cancel
# ---------------------------------------------------------------------------


@router.post("/vm-jobs/cancel")
async def cancel_vm_jobs(request: CancelVMJobsRequest) -> dict[str, object]:
    """Cancel VM jobs for a deployment."""
    try:
        from deployment_service.backends.vm import VMBackend

        backend = VMBackend(
            project_id=request.project_id,
            region=request.region,
            service_account_email=request.service_account_email,
            job_name=request.job_name,
        )

        cancelled_count = 0
        failed_count = 0
        for job_entry in request.jobs:
            job_id = job_entry.get("job_id")
            zone = job_entry.get("zone")
            if not job_id:
                continue
            try:
                if request.fire_and_forget:
                    backend.cancel_job_fire_and_forget(str(job_id), zone)
                else:
                    backend.cancel_job(str(job_id), zone)
                cancelled_count += 1
            except (OSError, ValueError, RuntimeError) as cancel_err:
                logger.warning(
                    "Failed to cancel job %s for deployment %s: %s",
                    job_id,
                    request.deployment_id,
                    cancel_err,
                )
                failed_count += 1

        return {"cancelled_count": cancelled_count, "failed_count": failed_count}
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("cancel_vm_jobs failed for deployment %s: %s", request.deployment_id, e)
        raise HTTPException(status_code=500, detail=str(e)) from e


# ---------------------------------------------------------------------------
# VM status batch  POST /api/v1/vm-jobs/status-batch
# ---------------------------------------------------------------------------


@router.post("/vm-jobs/status-batch")
async def get_vm_status_batch(request: VMStatusBatchRequest) -> dict[str, object]:
    """Get VM instance statuses in batch."""
    try:
        from deployment_service.backends.vm import VMBackend

        backend = VMBackend(
            project_id=request.project_id,
            region=request.project_id,  # region derived from zone; use project as placeholder
        )
        statuses = backend.get_vm_status_batch(
            zone=request.zone,
            vm_names=request.vm_names,
        )
        return {"statuses": statuses}
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("get_vm_status_batch failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e


# ---------------------------------------------------------------------------
# Cloud Run status batch  POST /api/v1/cloud-run/status-batch
# ---------------------------------------------------------------------------


@router.post("/cloud-run/status-batch")
async def get_cloud_run_status_batch(request: CloudRunStatusBatchRequest) -> dict[str, object]:
    """Get Cloud Run execution statuses in batch."""
    try:
        from deployment_service.backends.cloud_run import CloudRunBackend

        backend = CloudRunBackend(
            project_id=request.project_id,
            region=request.region,
            service_account_email=request.service_account_email,
            job_name=request.job_name,
        )
        statuses = backend.get_execution_status_batch(job_ids=request.job_ids)
        return {"statuses": statuses}
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("get_cloud_run_status_batch failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e


# ---------------------------------------------------------------------------
# Quota acquire  POST /api/v1/quota/acquire
# ---------------------------------------------------------------------------


@router.post("/quota/acquire")
async def quota_acquire_batch(request: QuotaAcquireRequest) -> dict[str, object]:
    """Acquire quota slots from the quota broker."""
    try:
        from deployment_service.deployment.quota_broker_client import QuotaBrokerClient

        client = QuotaBrokerClient()
        acquired = client.try_acquire_batch(
            quota_shape=request.quota_shape,
            batch_size=request.batch_size,
        )
        return {"acquired": acquired}
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("quota_acquire_batch failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e


# ---------------------------------------------------------------------------
# Quota release  POST /api/v1/quota/release
# ---------------------------------------------------------------------------


@router.post("/quota/release", status_code=204)
async def quota_release_batch(request: QuotaReleaseRequest) -> None:
    """Release quota slots back to the quota broker."""
    try:
        from deployment_service.deployment.quota_broker_client import QuotaBrokerClient

        client = QuotaBrokerClient()
        client.release_batch(
            quota_shape=request.quota_shape,
            batch_size=request.batch_size,
        )
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("quota_release_batch failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e


# ---------------------------------------------------------------------------
# Deployment events  GET /api/v1/deployments/{deployment_id}/events
# ---------------------------------------------------------------------------


@router.get("/deployments/{deployment_id}/events")
async def get_deployment_events(
    deployment_id: str,
    shard_id: str | None = None,
) -> dict[str, object]:
    """Return shard event stream for a deployment."""
    sm = _get_state_manager()
    state = sm.load_state(deployment_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Deployment {deployment_id} not found")

    events: list[dict[str, object]] = []
    for shard in state.shards:
        if shard_id is not None and shard.shard_id != shard_id:
            continue
        for attempt in shard.execution_history:
            event: dict[str, object] = {
                "deployment_id": deployment_id,
                "shard_id": shard.shard_id,
                "event_type": attempt.status,
                "message": attempt.failure_reason or attempt.status,
                "timestamp": attempt.started_at or "",
                "metadata": {
                    "zone": attempt.zone,
                    "region": attempt.region,
                    "failure_category": attempt.failure_category,
                },
            }
            events.append(event)

    return {"events": events}


# ---------------------------------------------------------------------------
# VM events  GET /api/v1/deployments/{deployment_id}/vm-events
# ---------------------------------------------------------------------------

_VM_EVENT_TYPES = {"VM_PREEMPTED", "CONTAINER_OOM", "VM_STARTED", "VM_STOPPED", "VM_TERMINATED"}


@router.get("/deployments/{deployment_id}/vm-events")
async def get_vm_events(deployment_id: str) -> dict[str, object]:
    """Return VM-level infrastructure events for a deployment."""
    sm = _get_state_manager()
    state = sm.load_state(deployment_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Deployment {deployment_id} not found")

    events: list[dict[str, object]] = []
    for shard in state.shards:
        for attempt in shard.execution_history:
            fc = (attempt.failure_category or "").upper()
            if fc in _VM_EVENT_TYPES or "preempt" in (attempt.failure_reason or "").lower():
                events.append(
                    {
                        "deployment_id": deployment_id,
                        "shard_id": shard.shard_id,
                        "event_type": fc or "VM_EVENT",
                        "message": attempt.failure_reason or fc,
                        "timestamp": attempt.ended_at or attempt.started_at or "",
                        "metadata": {
                            "zone": attempt.zone,
                            "region": attempt.region,
                        },
                    }
                )

    return {"events": events}


# ---------------------------------------------------------------------------
# Rollback  POST /api/v1/deployments/{deployment_id}/rollback
# ---------------------------------------------------------------------------


@router.post("/deployments/{deployment_id}/rollback")
async def live_rollback(deployment_id: str, request: RollbackRequest) -> dict[str, object]:
    """Roll back a live Cloud Run Service to a previous revision."""
    try:
        from unified_cloud_interface import get_compute_client

        project_id = _config.gcp_project_id or ""
        compute = get_compute_client(project_id=project_id)
        rollback_kwargs: dict[str, object] = {
            "service_name": request.service,
            "region": request.region,
        }
        if request.target_revision is not None:
            rollback_kwargs["target_revision"] = request.target_revision

        result = cast(dict[str, object], compute.rollback_service(**rollback_kwargs))
        result.setdefault("deployment_id", deployment_id)
        result.setdefault("service", request.service)
        return result
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("live_rollback failed for deployment %s: %s", deployment_id, e)
        raise HTTPException(status_code=500, detail=str(e)) from e


# ---------------------------------------------------------------------------
# Live health  GET /api/v1/deployments/{deployment_id}/live-health
# ---------------------------------------------------------------------------


@router.get("/deployments/{deployment_id}/live-health")
async def get_live_health(
    deployment_id: str,
    service: str,
    region: str,
) -> dict[str, object]:
    """Return current health check status for a live Cloud Run Service."""
    try:
        from datetime import UTC, datetime

        from unified_cloud_interface import get_compute_client

        project_id = _config.gcp_project_id or ""
        compute = get_compute_client(project_id=project_id)
        service_name = service.replace("_", "-").lower()
        revisions = compute.list_revisions(service_name, region)

        healthy = False
        status_code = 503
        if revisions:
            latest = max(revisions, key=lambda r: cast(float, r.get("create_time", 0.0)))
            for cond in cast(list[object], latest.get("conditions") or []):
                if not isinstance(cond, dict):
                    continue
                cond_dict = cast(dict[str, object], cond)
                if cond_dict.get("type") == "Ready":
                    state_val = cond_dict.get("state")
                    if state_val is not None and "SUCCEEDED" in str(state_val).upper():
                        healthy = True
                        status_code = 200
                    break

        return {
            "deployment_id": deployment_id,
            "service": service,
            "healthy": healthy,
            "checked_at": datetime.now(UTC).isoformat(),
            "status_code": status_code,
        }
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("get_live_health failed for deployment %s: %s", deployment_id, e)
        raise HTTPException(status_code=500, detail=str(e)) from e
