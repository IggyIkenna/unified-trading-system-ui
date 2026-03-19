"""Cloud-agnostic deployment schemas — shared across all repos.

These types are the canonical source of truth for deployment state, shard events,
and VM lifecycle events. All other repos (deployment-service, deployment-api,
deployment-ui backend) import from here rather than defining their own.

NO cloud SDKs (google-cloud-*, boto3). Pure Pydantic schemas + StrEnum only.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from enum import StrEnum  # still needed for DeploymentStatus, ComputeType, VMEventType
from typing import cast

from pydantic import BaseModel, Field

from unified_internal_contracts.modes import CloudProvider, PhaseMode, RuntimeMode


class DeploymentStatus(StrEnum):
    """Lifecycle status of a deployment."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMED_OUT = "timed_out"


class ComputeType(StrEnum):
    """Compute substrate used for the deployment."""

    CLOUD_RUN = "cloud_run"
    VM = "vm"
    BATCH = "batch"
    EC2 = "ec2"


class VMEventType(StrEnum):
    """Shard + VM lifecycle event types.

    Mirrors the TypeScript VMEventType union in deployment-ui.
    Values use UPPER_SNAKE_CASE to match the existing deployment-service events.py.
    """

    # VM infrastructure events
    VM_PREEMPTED = "VM_PREEMPTED"
    VM_DELETED = "VM_DELETED"
    VM_QUOTA_EXHAUSTED = "VM_QUOTA_EXHAUSTED"
    VM_ZONE_UNAVAILABLE = "VM_ZONE_UNAVAILABLE"
    VM_TIMEOUT = "VM_TIMEOUT"
    CONTAINER_OOM = "CONTAINER_OOM"

    # Cloud Run events
    CLOUD_RUN_REVISION_FAILED = "CLOUD_RUN_REVISION_FAILED"

    # Job lifecycle events
    JOB_RETRY = "JOB_RETRY"
    JOB_STARTED = "JOB_STARTED"
    JOB_COMPLETED = "JOB_COMPLETED"
    JOB_FAILED = "JOB_FAILED"
    JOB_CANCELLED = "JOB_CANCELLED"

    # Live deployment events
    LIVE_HEALTH_CHECK_PASSED = "LIVE_HEALTH_CHECK_PASSED"
    LIVE_HEALTH_CHECK_FAILED = "LIVE_HEALTH_CHECK_FAILED"
    LIVE_ROLLBACK_EXECUTED = "LIVE_ROLLBACK_EXECUTED"


#: VM infrastructure event types — subset used for the /vm-events endpoint filter
VM_INFRASTRUCTURE_EVENTS: frozenset[VMEventType] = frozenset(
    {
        VMEventType.VM_PREEMPTED,
        VMEventType.VM_DELETED,
        VMEventType.VM_QUOTA_EXHAUSTED,
        VMEventType.VM_ZONE_UNAVAILABLE,
        VMEventType.VM_TIMEOUT,
        VMEventType.CONTAINER_OOM,
        VMEventType.CLOUD_RUN_REVISION_FAILED,
    }
)


class ShardEvent(BaseModel):
    """A single event in a shard's lifecycle.

    Written to GCS as one JSON line in:
      deployments/{deployment_id}/shards/{shard_id}/events.jsonl

    Compatible with the dataclass ShardEvent in deployment-service/events.py —
    same field names and serialisation format.
    """

    deployment_id: str
    shard_id: str
    event_type: VMEventType
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    metadata: dict[str, str] = Field(default_factory=dict)

    @property
    def is_vm_event(self) -> bool:
        """True if this is a VM infrastructure event (not a job lifecycle event)."""
        return self.event_type in VM_INFRASTRUCTURE_EVENTS

    def to_jsonl(self) -> str:
        """Single-line JSON suitable for JSONL append."""
        return json.dumps(
            {
                "deployment_id": self.deployment_id,
                "shard_id": self.shard_id,
                "event_type": str(self.event_type),
                "message": self.message,
                "timestamp": self.timestamp.isoformat(),
                "metadata": self.metadata,
            }
        )

    @classmethod
    def from_jsonl(cls, line: str) -> ShardEvent:
        """Parse a single JSONL line back into a ShardEvent."""
        raw = cast(dict[str, object], json.loads(line))
        raw_metadata = raw.get("metadata")
        metadata: dict[str, str] = (
            {str(k): str(v) for k, v in cast(dict[str, object], raw_metadata).items()}
            if isinstance(raw_metadata, dict)
            else {}
        )
        return cls(
            deployment_id=str(raw["deployment_id"]),
            shard_id=str(raw["shard_id"]),
            event_type=VMEventType(str(raw["event_type"])),
            message=str(raw["message"]),
            timestamp=datetime.fromisoformat(str(raw["timestamp"])),
            metadata=metadata,
        )


class DeploymentState(BaseModel):
    """Canonical state record for a deployment.

    Stored as JSON in GCS at:
      deployments/{deployment_id}/state.json

    All fields added after the initial schema version have defaults to maintain
    backwards compatibility when reading older state files.
    """

    deployment_id: str
    service: str
    status: DeploymentStatus
    tag: str
    region: str
    created_at: str
    updated_at: str
    total_shards: int
    completed_shards: int
    failed_shards: int

    # Fields added in schema v2 — default for backwards compat
    deploy_mode: RuntimeMode = RuntimeMode.BATCH
    compute_type: ComputeType = ComputeType.VM
    cloud_provider: CloudProvider = CloudProvider.GCP
    phase_mode: PhaseMode = PhaseMode.PHASE_3

    parameters: dict[str, object] = Field(default_factory=dict)

    @property
    def is_terminal(self) -> bool:
        """True if the deployment has reached a terminal state."""
        return self.status in {
            DeploymentStatus.COMPLETED,
            DeploymentStatus.FAILED,
            DeploymentStatus.CANCELLED,
            DeploymentStatus.TIMED_OUT,
        }

    @property
    def progress_pct(self) -> float:
        """Percentage of shards completed (0-100)."""
        if self.total_shards == 0:
            return 0.0
        return round(self.completed_shards / self.total_shards * 100, 1)


__all__ = [
    "VM_INFRASTRUCTURE_EVENTS",
    "ComputeType",
    "DeploymentState",
    "DeploymentStatus",
    "ShardEvent",
    "VMEventType",
]
