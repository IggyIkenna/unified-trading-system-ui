"""Error classification type definitions — shared by errors.py and _venue_error_data.py."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from pydantic import BaseModel, Field


class ErrorAction(StrEnum):
    RETRY = "retry"
    RECONNECT = "reconnect"
    SKIP = "skip"
    FAIL = "fail"


@dataclass
class VenueErrorClassification:
    venue: str
    error_code: str
    retry_safe: bool
    reconnect: bool
    action: ErrorAction
    description: str | None = None


@dataclass
class DatabentoError:
    code: str
    message: str
    retry_safe: bool
    reconnect: bool


class RateLimitResponse(BaseModel):
    """HTTP 429 rate limit response schema (REST venues).

    Common headers: Retry-After (seconds or HTTP-date), X-RateLimit-Limit,
    X-RateLimit-Remaining, X-RateLimit-Reset (Unix timestamp).
    """

    retry_after: int | None = Field(None, description="Seconds to wait (Retry-After header)")
    x_rate_limit_limit: int | None = Field(None, alias="X-RateLimit-Limit")
    x_rate_limit_remaining: int | None = Field(None, alias="X-RateLimit-Remaining")
    x_rate_limit_reset: int | None = Field(None, alias="X-RateLimit-Reset")
    message: str | None = None
    code: str | int | None = None

    model_config = {"populate_by_name": True}


class WebSocketCloseInfo(BaseModel):
    """WebSocket close frame (RFC 6455): code + reason.

    Common codes: 1000=normal, 1006=abnormal, 1008=policy, 1011=server error.
    """

    code: int = Field(..., description="Close code (1000-1015)")
    reason: str | None = Field(None, description="Close reason string")
    message: str | None = None


DATABENTO_ERROR_MAP: dict[str, DatabentoError] = {
    "RATE_LIMIT": DatabentoError("RATE_LIMIT", "Rate limit exceeded", retry_safe=True, reconnect=False),
    "AUTH_FAILURE": DatabentoError("AUTH_FAILURE", "Authentication failed", retry_safe=False, reconnect=False),
    "CONNECTION_RESET": DatabentoError("CONNECTION_RESET", "Connection reset", retry_safe=True, reconnect=True),
    "SUBSCRIPTION_ERROR": DatabentoError("SUBSCRIPTION_ERROR", "Subscription failed", retry_safe=True, reconnect=False),
    "VALIDATION_ERROR": DatabentoError(
        "VALIDATION_ERROR",
        "Request validation failed (e.g. date range, T+2 embargo)",
        retry_safe=False,
        reconnect=False,
    ),
    "NOT_FOUND": DatabentoError("NOT_FOUND", "Dataset or resource not found", retry_safe=False, reconnect=False),
    "SERVER_ERROR": DatabentoError("SERVER_ERROR", "Databento internal server error", retry_safe=True, reconnect=False),
}


def ve(
    venue: str, code: str, *, retry: bool, reconnect: bool, action: ErrorAction, desc: str
) -> VenueErrorClassification:
    return VenueErrorClassification(venue, code, retry_safe=retry, reconnect=reconnect, action=action, description=desc)
