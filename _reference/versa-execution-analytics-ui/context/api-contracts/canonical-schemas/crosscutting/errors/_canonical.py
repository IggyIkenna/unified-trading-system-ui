"""Canonical error schemas — imports shared types from _types."""

from __future__ import annotations

from dataclasses import dataclass

from ._types import ErrorAction, VenueErrorClassification


@dataclass
class RateLimitInfo:
    """Extracted rate limit headers from HTTP response."""

    retry_after: float | None = None  # seconds to wait
    limit: int | None = None
    remaining: int | None = None
    reset: float | None = None  # unix timestamp
    endpoint: str | None = None
    venue: str | None = None


class CanonicalError:
    """Canonical error (grouped from venue-specific errors). Phase 1 placeholder."""

    def __init__(
        self,
        code: str,
        message: str,
        action: ErrorAction,
        venue: str | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.action = action
        self.venue = venue


class CanonicalRateLimitError(CanonicalError):
    """Canonical rate limit error (retry with backoff)."""

    def __init__(self, message: str = "Rate limit exceeded", venue: str | None = None) -> None:
        super().__init__(
            code="RATE_LIMIT",
            message=message,
            action=ErrorAction.RETRY,
            venue=venue,
        )


class CanonicalAuthenticationError(CanonicalError):
    """Authentication credentials missing or invalid."""

    def __init__(self, message: str = "Authentication failed", venue: str | None = None) -> None:
        super().__init__(
            code="AUTH_FAILED",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalAuthorizationError(CanonicalError):
    """Authenticated but not authorized to perform the action."""

    def __init__(self, message: str = "Unauthorized", venue: str | None = None) -> None:
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalInternalServerError(CanonicalError):
    """Venue internal server error (5xx)."""

    def __init__(self, message: str = "Internal server error", venue: str | None = None) -> None:
        super().__init__(
            code="SERVER_ERROR",
            message=message,
            action=ErrorAction.RETRY,
            venue=venue,
        )


class CanonicalServiceUnavailableError(CanonicalError):
    """Venue service temporarily unavailable."""

    def __init__(self, message: str = "Service unavailable", venue: str | None = None) -> None:
        super().__init__(
            code="SERVICE_UNAVAILABLE",
            message=message,
            action=ErrorAction.RETRY,
            venue=venue,
        )


class CanonicalNetworkError(CanonicalError):
    """Network-level connectivity error."""

    def __init__(self, message: str = "Network error", venue: str | None = None) -> None:
        super().__init__(
            code="NETWORK_ERROR",
            message=message,
            action=ErrorAction.RETRY,
            venue=venue,
        )


class CanonicalInvalidRequestError(CanonicalError):
    """Request parameters are invalid or malformed."""

    def __init__(self, message: str = "Invalid request", venue: str | None = None) -> None:
        super().__init__(
            code="INVALID_REQUEST",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalInsufficientBalanceError(CanonicalError):
    """Insufficient account balance to fulfill the request."""

    def __init__(self, message: str = "Insufficient balance", venue: str | None = None) -> None:
        super().__init__(
            code="INSUFFICIENT_BALANCE",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalInsufficientMarginError(CanonicalError):
    """Insufficient margin for position."""

    def __init__(self, message: str = "Insufficient margin", venue: str | None = None) -> None:
        super().__init__(
            code="INSUFFICIENT_MARGIN",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalPriceBoundError(CanonicalError):
    """Order price outside allowed bounds."""

    def __init__(self, message: str = "Price out of bounds", venue: str | None = None) -> None:
        super().__init__(
            code="PRICE_BOUND",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalOrderRejectedError(CanonicalError):
    """Order was rejected by the venue."""

    def __init__(self, message: str = "Order rejected", venue: str | None = None) -> None:
        super().__init__(
            code="ORDER_REJECTED",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalMarketClosedError(CanonicalError):
    """Market is closed and not accepting orders."""

    def __init__(self, message: str = "Market closed", venue: str | None = None) -> None:
        super().__init__(
            code="MARKET_CLOSED",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalInstrumentHaltedError(CanonicalError):
    """Instrument is halted from trading."""

    def __init__(self, message: str = "Instrument halted", venue: str | None = None) -> None:
        super().__init__(
            code="INSTRUMENT_HALTED",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalDuplicateOrderError(CanonicalError):
    """Duplicate order detected (client order ID reuse)."""

    def __init__(self, message: str = "Duplicate order", venue: str | None = None) -> None:
        super().__init__(
            code="DUPLICATE_ORDER",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalPositionLimitExceededError(CanonicalError):
    """Position limit exceeded for this instrument or account."""

    def __init__(self, message: str = "Position limit exceeded", venue: str | None = None) -> None:
        super().__init__(
            code="POSITION_LIMIT",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalSizeLimitError(CanonicalError):
    """Order size outside allowed min/max bounds."""

    def __init__(self, message: str = "Size limit exceeded", venue: str | None = None) -> None:
        super().__init__(
            code="SIZE_LIMIT",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalContractExpiredError(CanonicalError):
    """Derivative contract has expired."""

    def __init__(self, message: str = "Contract expired", venue: str | None = None) -> None:
        super().__init__(
            code="CONTRACT_EXPIRED",
            message=message,
            action=ErrorAction.FAIL,
            venue=venue,
        )


class CanonicalMaintenanceModeError(CanonicalError):
    """Venue is in scheduled maintenance mode."""

    def __init__(self, message: str = "Venue in maintenance", venue: str | None = None) -> None:
        super().__init__(
            code="MAINTENANCE",
            message=message,
            action=ErrorAction.RECONNECT,
            venue=venue,
        )


class CanonicalSchemaError(CanonicalError):
    """Unexpected schema or unparseable response from venue."""

    def __init__(self, message: str = "Schema error", venue: str | None = None) -> None:
        super().__init__(
            code="SCHEMA_ERROR",
            message=message,
            action=ErrorAction.SKIP,
            venue=venue,
        )


class CanonicalUnknownVenueError(CanonicalError):
    """Fired when a venue returns an error code not in VENUE_ERROR_MAP.

    Callers must explicitly handle this error; action defaults to FAIL.
    The raw_code and raw_message fields capture the original venue response
    so ops can review and add missing codes to the canonical map.
    """

    def __init__(
        self,
        raw_code: str,
        raw_message: str,
        venue: str,
        endpoint: str | None = None,
    ) -> None:
        super().__init__(
            code="UNKNOWN_VENUE_ERROR",
            message=f"Unknown venue error from {venue}: [{raw_code}] {raw_message}",
            action=ErrorAction.FAIL,
            venue=venue,
        )
        self.raw_code = raw_code
        self.raw_message = raw_message
        self.endpoint = endpoint


__all__ = [
    "CanonicalAuthenticationError",
    "CanonicalAuthorizationError",
    "CanonicalContractExpiredError",
    "CanonicalDuplicateOrderError",
    "CanonicalError",
    "CanonicalInstrumentHaltedError",
    "CanonicalInsufficientBalanceError",
    "CanonicalInsufficientMarginError",
    "CanonicalInternalServerError",
    "CanonicalInvalidRequestError",
    "CanonicalMaintenanceModeError",
    "CanonicalMarketClosedError",
    "CanonicalNetworkError",
    "CanonicalOrderRejectedError",
    "CanonicalPositionLimitExceededError",
    "CanonicalPriceBoundError",
    "CanonicalRateLimitError",
    "CanonicalSchemaError",
    "CanonicalServiceUnavailableError",
    "CanonicalSizeLimitError",
    "CanonicalUnknownVenueError",
    "ErrorAction",
    "RateLimitInfo",
    "VenueErrorClassification",
]
