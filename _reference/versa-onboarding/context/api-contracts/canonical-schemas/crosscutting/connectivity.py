from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from pydantic import AwareDatetime

from ..domain._base import CanonicalBase


class WebSocketEvent(StrEnum):
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    PING = "ping"
    PONG = "pong"
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    ERROR = "error"
    RECONNECT = "reconnect"


class CanonicalWebSocketLifecycle(CanonicalBase):
    """Normalized WebSocket lifecycle event."""

    venue: str
    event: WebSocketEvent
    timestamp: AwareDatetime
    channel: str | None = None
    reason: str | None = None
    code: int | None = None
    latency_ms: float | None = None
    schema_version: str = "1.0"


@dataclass
class HealthPingResponse:
    """Generic health/ping endpoint response."""

    status: str
    latency_ms: float | None = None
    timestamp: AwareDatetime | None = None


@dataclass
class WebSocketConnectionOpened:
    """WebSocket connection opened lifecycle event."""

    venue: str
    url: str
    timestamp: AwareDatetime
    connection_id: str | None = None


@dataclass
class WebSocketConnectionClosed:
    """WebSocket connection closed lifecycle event."""

    venue: str
    code: int
    reason: str | None = None
    timestamp: AwareDatetime | None = None
    was_clean: bool = False
