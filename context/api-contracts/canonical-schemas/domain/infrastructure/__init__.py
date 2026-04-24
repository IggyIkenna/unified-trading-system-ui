"""Cloud-agnostic infrastructure canonical types.

Maps canonical names to provider-specific implementations in external/cloud_sdks/.
UCI (unified-cloud-interface) uses these canonical names to abstract over GCP/AWS.
"""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from .ci import (
    CanonicalPullRequest,
    CanonicalRepository,
    CanonicalWorkflowRun,
    SourceControlProvider,
)
from .compute import ComputeType as ComputeType
from .compute import VmQuotaShape as VmQuotaShape


class _InfraBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CloudProvider(StrEnum):
    GCP = "gcp"
    AWS = "aws"


class ComputeTarget(StrEnum):
    """Cloud-agnostic compute deployment target.

    Aligns with runtime-topology.yaml deploy_type values.
    """

    CLOUD_SERVICE = "cloud_service"
    CLOUD_JOB = "cloud_job"
    VM = "vm"


class ScalingMode(StrEnum):
    """Service scaling behavior.

    Aligns with runtime-topology.yaml scaling values.
    """

    ALWAYS_ON = "always_on"
    AUTO_SCALE = "auto_scale"
    SCALE_TO_ZERO = "scale_to_zero"
    MANUAL = "manual"


class CanonicalComputeService(_InfraBase):
    """Long-lived service — Cloud Run Service, ECS Service, or VM-hosted.

    UIs, APIs, and always-on services all resolve to this type with
    different scaling modes.
    """

    provider: CloudProvider
    service_name: str
    compute_target: ComputeTarget
    scaling: ScalingMode = ScalingMode.AUTO_SCALE
    region: str | None = None
    port: int | None = None
    min_instances: int = 0
    max_instances: int | None = None
    cpu: str | None = Field(default=None, description="vCPU allocation, e.g. '2'")
    memory: str | None = Field(default=None, description="Memory allocation, e.g. '4Gi'")


INFRA_CANONICAL_TO_PROVIDER: dict[tuple[str, str], str] = {
    ("ComputeService", "gcp"): "cloud_run",
    ("ComputeService", "aws"): "ecs",
}
