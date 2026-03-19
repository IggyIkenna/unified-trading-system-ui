"""
Deployment event types and ShardEvent dataclass.

Provides a structured event stream for each shard's lifecycle, including
VM-level infrastructure events that surface in the UI as coloured badges
in DeploymentDetails.

Events are written to GCS as:
  deployments/{deployment_id}/shards/{shard_id}/events.jsonl
(one JSON object per line, newline-delimited)
"""

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import cast


class VMEventType(StrEnum):
    """
    Shard + VM lifecycle event types.

    Values mirror the TypeScript VMEventType union in deployment-ui.
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


#: VM event types — subset used for the vm-events endpoint filter
VM_EVENT_TYPES: frozenset[VMEventType] = frozenset(
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


@dataclass
class ShardEvent:
    """
    A single event in a shard's lifecycle.

    Written to GCS as one JSON line in:
      deployments/{deployment_id}/shards/{shard_id}/events.jsonl
    """

    deployment_id: str
    shard_id: str
    event_type: VMEventType
    message: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    metadata: dict[str, str] = field(default_factory=dict)

    @property
    def is_vm_event(self) -> bool:
        return self.event_type in VM_EVENT_TYPES

    def to_dict(self) -> dict[str, object]:
        return {
            "deployment_id": self.deployment_id,
            "shard_id": self.shard_id,
            "event_type": str(self.event_type),
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }

    def to_jsonl(self) -> str:
        """Single-line JSON suitable for JSONL append."""
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> "ShardEvent":
        return cls(
            deployment_id=str(data["deployment_id"]),
            shard_id=str(data["shard_id"]),
            event_type=VMEventType(str(data["event_type"])),
            message=str(data["message"]),
            timestamp=datetime.fromisoformat(str(data["timestamp"])),
            metadata=(
                {str(k): str(v) for k, v in cast(dict[str, object], data.get("metadata")).items()}
                if isinstance(data.get("metadata"), dict)
                else {}
            ),
        )

    @classmethod
    def from_jsonl(cls, line: str) -> "ShardEvent":
        return cls.from_dict(cast(dict[str, object], json.loads(line)))
