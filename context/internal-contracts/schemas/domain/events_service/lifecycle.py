"""Internal lifecycle event schemas — envelope structure, all event types, per-type metadata."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field

from unified_api_contracts.internal.modes import LogLevel

REQUIRED_EVENT_FIELDS: dict[str, list[str]] = {
    "ALL": ["correlation_id", "service_version", "local_timestamp"],
    "FAILED": ["stack_trace", "error_category"],
    "COMPLETED": ["duration_ms"],
    "MARKET_DATA": ["exchange_timestamp", "local_timestamp", "sequence_number"],
    "EXECUTION": ["client_order_id", "exchange_timestamp", "venue_response_id"],
}


class LifecycleEventType(StrEnum):
    # Universal
    STARTED = "STARTED"
    VALIDATION_STARTED = "VALIDATION_STARTED"
    VALIDATION_COMPLETED = "VALIDATION_COMPLETED"
    DATA_INGESTION_STARTED = "DATA_INGESTION_STARTED"
    DATA_INGESTION_COMPLETED = "DATA_INGESTION_COMPLETED"
    PROCESSING_STARTED = "PROCESSING_STARTED"
    PROCESSING_COMPLETED = "PROCESSING_COMPLETED"
    STOPPED = "STOPPED"
    FAILED = "FAILED"
    DATA_BROADCAST = "DATA_BROADCAST"
    PERSISTENCE_STARTED = "PERSISTENCE_STARTED"
    PERSISTENCE_COMPLETED = "PERSISTENCE_COMPLETED"
    # Restart detection
    RESTART_DETECTED = "RESTART_DETECTED"
    # Security / audit
    AUTH_SUCCESS = "AUTH_SUCCESS"
    AUTH_FAILURE = "AUTH_FAILURE"
    CONFIG_CHANGED = "CONFIG_CHANGED"
    SECRET_ACCESSED = "SECRET_ACCESSED"
    # Coordination — cross-service pipeline readiness signals
    DATA_READY = "DATA_READY"
    PREDICTIONS_READY = "PREDICTIONS_READY"
    STRATEGY_SIGNALS_READY = "STRATEGY_SIGNALS_READY"
    # CI/CD pipeline lifecycle
    QG_PASSED = "QG_PASSED"
    QG_FAILED = "QG_FAILED"
    DEPLOYMENT_STARTED = "DEPLOYMENT_STARTED"
    DEPLOYMENT_COMPLETED = "DEPLOYMENT_COMPLETED"
    DEPLOYMENT_FAILED = "DEPLOYMENT_FAILED"
    DEPLOYMENT_ROLLED_BACK = "DEPLOYMENT_ROLLED_BACK"
    WORKFLOW_TRIGGERED = "WORKFLOW_TRIGGERED"
    VERSION_BUMPED = "VERSION_BUMPED"
    CASCADE_DISPATCHED = "CASCADE_DISPATCHED"
    SIT_STARTED = "SIT_STARTED"
    SIT_PASSED = "SIT_PASSED"
    SIT_FAILED = "SIT_FAILED"
    # Agent lifecycle
    AGENT_INVESTIGATION_TRIGGERED = "AGENT_INVESTIGATION_TRIGGERED"
    AGENT_INVESTIGATION_COMPLETED = "AGENT_INVESTIGATION_COMPLETED"
    AGENT_FIX_APPLIED = "AGENT_FIX_APPLIED"
    AGENT_FIX_FAILED = "AGENT_FIX_FAILED"


# Backward-compat alias — LogLevel is the canonical severity enum (modes.py).
# EventSeverity was previously a standalone StrEnum with INFO/WARNING/ERROR/CRITICAL.
# Now it points to LogLevel which adds DEBUG; existing code that uses
# EventSeverity.INFO etc. continues to work unchanged.
EventSeverity = LogLevel


class ServiceMode(StrEnum):
    BATCH = "batch"
    LIVE = "live"


# ---------------------------------------------------------------------------
# Per-event metadata payloads (the ``details`` dict typed as a model)
# ---------------------------------------------------------------------------


class StartedDetails(BaseModel):
    """Metadata for STARTED events."""

    mode: ServiceMode | None = None
    config_snapshot: dict[str, str | int | float | bool] | None = None


class ValidationStartedDetails(BaseModel):
    validation_type: str = "preflight"
    dependencies: list[str] | None = None


class ValidationCompletedDetails(BaseModel):
    duration_ms: float | None = None
    dependencies_checked: int | None = None
    all_available: bool | None = None


class DataIngestionDetails(BaseModel):
    source: str | None = None
    shard: str | None = None
    date: str | None = None
    venue: str | None = None


class DataIngestionCompletedDetails(DataIngestionDetails):
    rows_loaded: int | None = None
    bytes_read: int | None = None
    duration_ms: float | None = None


class ProcessingStartedDetails(BaseModel):
    shard: str | None = None
    instrument_count: int | None = None


class ProcessingCompletedDetails(BaseModel):
    shard: str | None = None
    rows: int | None = None
    duration_ms: float | None = None
    success: bool | None = None


class DataBroadcastDetails(BaseModel):
    topic: str | None = None
    messages_published: int | None = None
    instrument_key: str | None = None


class PersistenceStartedDetails(BaseModel):
    bucket: str | None = None
    path: str | None = None


class PersistenceCompletedDetails(BaseModel):
    bucket: str | None = None
    path: str | None = None
    files_written: int | None = None
    total_bytes: int | None = None


class StoppedDetails(BaseModel):
    reason: str | None = None
    total_duration_ms: float | None = None


class RestartDetectedDetails(BaseModel):
    """Details for RESTART_DETECTED event."""

    restart_count: int = Field(description="number of restarts detected in current window")
    last_known_state: str | None = Field(
        default=None, description="last lifecycle state before unclean shutdown"
    )
    shutdown_reason: str | None = Field(default=None, description="OOM, SIGKILL, unknown")
    time_since_last_started_seconds: float | None = None


class FailedDetails(BaseModel):
    error_type: str | None = None
    error_message: str | None = None
    traceback: str | None = None
    stage: str | None = None
    shard: str | None = None
    error_category: str | None = None  # ErrorCategory value
    is_retryable: bool = False
    escalation_level: int = 0  # 0=none, 1=warn, 2=page, 3=incident
    retry_count: int = 0
    first_occurrence_ts: str | None = None  # ISO 8601 timestamp


class AuthFailureDetails(BaseModel):
    auth_type: Annotated[str, Field(description="api_key | oauth | jwt | mtls")] | None = None
    username: str | None = None
    failure_reason: str | None = None
    ip_address: str | None = None
    endpoint: str | None = None
    attempt_count: int | None = None


class ConfigChangedDetails(BaseModel):
    config_file: str | None = None
    changed_by: str | None = None
    change_type: Annotated[str, Field(description="update | create | delete")] | None = None
    authorized: bool | None = None
    git_commit_sha: str | None = None
    fields_changed: list[str] | None = None


class SecretAccessedDetails(BaseModel):
    secret_name: str
    caller_identity: str
    operation: Annotated[str, Field(description="access | create | delete | rotate")] = "access"
    success: bool = True
    version: str | None = None


# ---------------------------------------------------------------------------
# Event envelope — what GCSEventSink writes (one JSON line in JSONL)
# ---------------------------------------------------------------------------


class EventMetadata(BaseModel):
    """Inner metadata dict embedded in every event."""

    timestamp: datetime
    service_name: str
    severity: EventSeverity = EventSeverity.INFO
    details: dict[str, str | int | float | bool | list[str] | None] = Field(default_factory=dict)
    client_id: str | None = Field(default=None, json_schema_extra={"pii": True})
    correlation_id: str | None = None


class LifecycleEventEnvelope(BaseModel):
    """Top-level shape of every event written to GCS JSONL or published to Pub/Sub.

    GCS path: ```events/{service_name}/{YYYY-MM-DD}/events.jsonl```
    """

    event: LifecycleEventType
    service: str
    timestamp: datetime
    metadata: EventMetadata


class PubSubLifecycleEventMessage(BaseModel):
    """Pub/Sub variant — no top-level timestamp (only in metadata)."""

    event: LifecycleEventType
    service: str
    metadata: EventMetadata


# ---------------------------------------------------------------------------
# Typed convenience wrappers for well-known event types
# ---------------------------------------------------------------------------


class StartedEvent(BaseModel):
    event: Literal[LifecycleEventType.STARTED] = LifecycleEventType.STARTED
    service: str
    timestamp: datetime
    details: StartedDetails = Field(default_factory=StartedDetails)


class FailedEvent(BaseModel):
    event: Literal[LifecycleEventType.FAILED] = LifecycleEventType.FAILED
    service: str
    timestamp: datetime
    details: FailedDetails = Field(default_factory=FailedDetails)


class AuthFailureEvent(BaseModel):
    event: Literal[LifecycleEventType.AUTH_FAILURE] = LifecycleEventType.AUTH_FAILURE
    service: str
    timestamp: datetime
    details: AuthFailureDetails


class ConfigChangedEvent(BaseModel):
    event: Literal[LifecycleEventType.CONFIG_CHANGED] = LifecycleEventType.CONFIG_CHANGED
    service: str
    timestamp: datetime
    details: ConfigChangedDetails


class RestartDetectedEvent(BaseModel):
    event: Literal[LifecycleEventType.RESTART_DETECTED] = LifecycleEventType.RESTART_DETECTED
    service: str
    timestamp: datetime
    details: RestartDetectedDetails


class SecretAccessedEvent(BaseModel):
    event: Literal[LifecycleEventType.SECRET_ACCESSED] = LifecycleEventType.SECRET_ACCESSED
    service: str
    timestamp: datetime
    details: SecretAccessedDetails


# ---------------------------------------------------------------------------
# Resource metrics snapshot — shard-aware monitoring labels
# ---------------------------------------------------------------------------


class ResourceMetricsSnapshot(BaseModel):
    """System resource metrics for monitoring."""

    service_name: str
    timestamp: datetime
    cpu_usage_pct: float | None = None
    memory_rss_bytes: int | None = None
    memory_rss_pct: float | None = None
    active_connections: int | None = None
    queue_depth: int | None = None
    shard_id: str | None = Field(default=None, description="batch shard ID if applicable")
    venue_id: str | None = Field(default=None, description="live venue ID if applicable")
    strategy_id: str | None = Field(default=None, description="live strategy ID if applicable")
