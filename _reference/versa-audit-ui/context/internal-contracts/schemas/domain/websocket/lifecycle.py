"""WebSocket lifecycle and subscription schemas."""

from __future__ import annotations

from dataclasses import dataclass, field

from pydantic import AwareDatetime


@dataclass
class HealthPingResponse:
    """Generic health/ping endpoint response (status, latency_ms)."""

    status: str  # ok, healthy, etc.
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


@dataclass
class UnsubscribeRequest:
    """Unsubscribe from a WebSocket channel."""

    venue: str
    channel: str
    symbols: list[str] = field(default_factory=list)
