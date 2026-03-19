"""WebSocket lifecycle event schemas.

Covers connect, disconnect, reconnect, error, ping/pong, and subscribe_ack events.
"""

from __future__ import annotations

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field


def _utc_now() -> datetime:
    return datetime.now(UTC)


class WebSocketConnectEvent(BaseModel):
    """Emitted when a WebSocket connection is successfully established to a venue."""

    model_config = ConfigDict(frozen=True)

    venue: str
    timestamp: datetime = Field(default_factory=_utc_now)
    endpoint_url: str
    connection_id: str
    schema_version: str = "1.0.0"


class WebSocketDisconnectEvent(BaseModel):
    """Emitted when a WebSocket connection is closed (clean or otherwise)."""

    model_config = ConfigDict(frozen=True)

    venue: str
    timestamp: datetime = Field(default_factory=_utc_now)
    connection_id: str
    reason: str
    was_clean: bool
    schema_version: str = "1.0.0"


class WebSocketReconnectEvent(BaseModel):
    """Emitted when a reconnection attempt is initiated after a disconnection."""

    model_config = ConfigDict(frozen=True)

    venue: str
    timestamp: datetime = Field(default_factory=_utc_now)
    connection_id: str
    attempt_number: int
    delay_seconds: float
    schema_version: str = "1.0.0"


class WebSocketErrorEvent(BaseModel):
    """Emitted when a WebSocket-level error occurs (not a normal close)."""

    model_config = ConfigDict(frozen=True)

    venue: str
    timestamp: datetime = Field(default_factory=_utc_now)
    connection_id: str
    error_code: str | None = None
    error_message: str
    schema_version: str = "1.0.0"


class WebSocketPingEvent(BaseModel):
    """Emitted when a ping frame is sent to the venue."""

    model_config = ConfigDict(frozen=True)

    venue: str
    timestamp: datetime = Field(default_factory=_utc_now)
    connection_id: str
    ping_id: str | None = None
    schema_version: str = "1.0.0"


class WebSocketPongEvent(BaseModel):
    """Emitted when a pong frame is received from the venue."""

    model_config = ConfigDict(frozen=True)

    venue: str
    timestamp: datetime = Field(default_factory=_utc_now)
    connection_id: str
    ping_id: str | None = None
    latency_ms: float | None = None
    schema_version: str = "1.0.0"


class WebSocketSubscribeAckEvent(BaseModel):
    """Emitted when a subscription request receives an acknowledgement from the venue."""

    model_config = ConfigDict(frozen=True)

    venue: str
    timestamp: datetime = Field(default_factory=_utc_now)
    connection_id: str
    channel: str
    subscribed: bool
    error_message: str | None = None
    schema_version: str = "1.0.0"
