"""Internal error schemas — classification, context, recovery strategy."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class ErrorCategory(StrEnum):
    RATE_LIMIT = "rate_limit"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    NOT_FOUND = "not_found"
    VALIDATION = "validation"
    VALIDATION_ERROR = "validation_error"
    TIMEOUT = "timeout"
    NETWORK = "network"
    SERVER_ERROR = "server_error"
    DATA_QUALITY = "data_quality"
    DEPENDENCY = "dependency"
    UNKNOWN = "unknown"
    # High-level error hierarchy (ci_cd_agent_error_hierarchy_2026_03_16)
    INFRASTRUCTURE = "infrastructure"
    APPLICATION = "application"
    DATA = "data"
    EXECUTION = "execution"
    COMPLIANCE = "compliance"
    CONFIGURATION = "configuration"


class ErrorSeverity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorRecoveryStrategy(StrEnum):
    RETRY = "retry"
    RETRY_WITH_BACKOFF = "retry_with_backoff"
    FALLBACK = "fallback"
    FAIL_FAST = "fail_fast"
    SKIP = "skip"
    ALERT = "alert"
    DEAD_LETTER = "dead_letter"


class ErrorContext(BaseModel):
    service: str | None = None
    operation: str | None = None
    venue: str | None = None
    instrument_key: str | None = None
    shard: str | None = None
    retry_count: int = 0
    timestamp: datetime | None = None
    request_id: str | None = None
    extra: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    schema_version: str = "1.0.0"


class EnhancedError(BaseModel):
    """Serialised form of a handled API error (from handle_api_errors decorator)."""

    error_type: str = "EnhancedError"
    message: str
    category: ErrorCategory
    severity: ErrorSeverity
    recovery_strategy: ErrorRecoveryStrategy
    context: ErrorContext
    correlation_id: str = ""
    retry_count: int = 0
    max_retries: int = 3
    original_error: dict[str, str] = Field(default_factory=dict)
    additional_info: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    schema_version: str = "1.0.0"


class StartupValidationError(Exception):
    """Raised when service startup validation fails.

    One error code, one library (UTL), clear message. Format:
    STARTUP_VALIDATION_FAILED: {message}

    Examples:
        STARTUP_VALIDATION_FAILED: Invalid CLOUD_PROVIDER='azure'. Valid: gcp, aws, local.
        STARTUP_VALIDATION_FAILED: Invalid --mode='stream'. Valid: batch, live.
        STARTUP_VALIDATION_FAILED: TESTNET_MODE=true but BINANCE has no testnet in UAC.
    """

    CODE = "STARTUP_VALIDATION_FAILED"

    def __init__(self, message: str) -> None:
        self.detail = message
        super().__init__(f"{self.CODE}: {message}")


class DeadLetterRecord(BaseModel):
    """Record for messages sent to dead letter queue after exhausting retries."""

    record_id: str
    original_event: str
    original_payload: str | None = None
    error_category: ErrorCategory
    error_message: str
    retry_count: int
    max_retries: int
    first_failure_at: datetime
    last_failure_at: datetime
    source_service: str
    dead_lettered_at: datetime
    correlation_id: str | None = None
    trace_id: str | None = None
    venue: str | None = None
    recovery_strategy: ErrorRecoveryStrategy = ErrorRecoveryStrategy.DEAD_LETTER
    metadata: dict[str, str] = Field(default_factory=dict)
    schema_version: str = "1.0.0"
