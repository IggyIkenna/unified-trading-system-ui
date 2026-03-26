"""WebSocket domain contracts — lifecycle and subscription schemas."""

from unified_api_contracts.internal.domain.websocket.lifecycle import (
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
