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


class CanonicalCloudStorage(_InfraBase):
    provider: CloudProvider
    bucket: str
    region: str | None = None


class CanonicalOLAPTable(_InfraBase):
    provider: CloudProvider
    dataset: str
    table: str
    project: str | None = None


class CanonicalSecretStore(_InfraBase):
    provider: CloudProvider
    project: str
    secret_id: str
    version: str = "latest"


class CanonicalMessageQueue(_InfraBase):
    provider: CloudProvider
    topic: str
    subscription: str | None = None


class CanonicalContainerRegistry(_InfraBase):
    provider: CloudProvider
    repository: str
    region: str | None = None


class CanonicalScheduledJob(_InfraBase):
    provider: CloudProvider
    job_id: str
    schedule: str = Field(description="Cron expression")
    target: str | None = None


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


class CanonicalComputeJob(_InfraBase):
    """Ephemeral job — Cloud Run Job, AWS Batch.

    Scale-to-zero workloads: instruments refresh, calendar features,
    reconciliation runs.
    """

    provider: CloudProvider
    job_name: str
    region: str | None = None
    schedule: str | None = Field(default=None, description="Cron expression if scheduled")
    timeout_seconds: int | None = None
    cpu: str | None = Field(default=None, description="vCPU allocation")
    memory: str | None = Field(default=None, description="Memory allocation")


class CanonicalVirtualMachine(_InfraBase):
    """Dedicated VM — GCE, EC2.

    For co-located services (market-tick-data + execution on same VM)
    or heavy compute (ml-training long GPU jobs).
    """

    provider: CloudProvider
    instance_name: str
    machine_type: str = Field(description="e.g. 'c2-standard-8', 'c5.2xlarge'")
    region: str | None = None
    zone: str | None = None
    disk_size_gb: int | None = None
    co_located_services: list[str] = Field(default_factory=list)


INFRA_CANONICAL_TO_PROVIDER: dict[tuple[str, str], str] = {
    ("CloudStorage", "gcp"): "gcs",
    ("CloudStorage", "aws"): "s3",
    ("OLAPTable", "gcp"): "bigquery",
    ("OLAPTable", "aws"): "redshift",
    ("SecretStore", "gcp"): "secret_manager",
    ("SecretStore", "aws"): "secrets_manager",
    ("MessageQueue", "gcp"): "pubsub",
    ("MessageQueue", "aws"): "sqs",
    ("ContainerRegistry", "gcp"): "artifact_registry",
    ("ContainerRegistry", "aws"): "ecr",
    ("ScheduledJob", "gcp"): "cloud_scheduler",
    ("ScheduledJob", "aws"): "eventbridge",
    ("ComputeService", "gcp"): "cloud_run",
    ("ComputeService", "aws"): "ecs",
    ("ComputeJob", "gcp"): "cloud_run_job",
    ("ComputeJob", "aws"): "batch",
    ("VirtualMachine", "gcp"): "compute_engine",
    ("VirtualMachine", "aws"): "ec2",
}
