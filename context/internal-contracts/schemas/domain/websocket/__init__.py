"""WebSocket domain contracts — lifecycle and subscription schemas."""

from unified_internal_contracts.domain.websocket.lifecycle import (
    HealthPingResponse,
    UnsubscribeRequest,
    WebSocketConnectionClosed,
    WebSocketConnectionOpened,
)

__all__ = [
    "HealthPingResponse",
    "UnsubscribeRequest",
    "WebSocketConnectionClosed",
    "WebSocketConnectionOpened",
]
