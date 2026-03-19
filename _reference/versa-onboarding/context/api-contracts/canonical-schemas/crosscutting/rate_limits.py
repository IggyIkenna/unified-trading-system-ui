"""Rate limit type definitions for HTTP APIs."""

from pydantic import BaseModel, Field


class HttpRateLimitHeaders(BaseModel):
    """Standard HTTP rate limit headers."""

    x_ratelimit_limit: int | None = Field(None, description="Max requests per window")
    x_ratelimit_remaining: int | None = Field(None, description="Remaining requests")
    x_ratelimit_reset: int | None = Field(None, description="Unix timestamp")
    x_ratelimit_used: int | None = Field(None, description="Used in window")
    retry_after: int | None = Field(None, description="Seconds to wait")


class VenueRateLimitSpec(BaseModel):
    """Rate limit specification for a venue."""

    venue: str = Field(..., description="Venue identifier")
    requests_per_second: float | None = None
    requests_per_minute: int | None = None
    requests_per_day: int | None = None
    requests_per_month: int | None = None
    concurrent_connections: int | None = None
    rate_limit_endpoint: str | None = None
    rate_limit_header_format: str | None = None
    notes: str | None = None
