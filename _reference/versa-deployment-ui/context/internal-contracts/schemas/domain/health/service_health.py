"""Service health response schema."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class ServiceHealthResponse:
    """Standard health endpoint response for all services.

    Includes cloud_provider and mock_mode for monitoring dashboards.
    """

    status: str
    service_name: str
    version: str
    cloud_provider: str = "unknown"
    mock_mode: bool = False
    uptime_seconds: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    checks: dict[str, str] = field(default_factory=dict)
