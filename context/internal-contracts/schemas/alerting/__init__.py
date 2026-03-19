"""Alerting contracts for unified trading system."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AlertEvent(BaseModel):
    """A fired alert event emitted by the alerting service."""

    alert_id: str = Field(description="Unique identifier for this alert event")
    rule_id: str = Field(description="ID of the alert rule that fired")
    triggered_at: datetime = Field(description="UTC timestamp when alert was triggered")
    severity: Literal["DEBUG", "INFO", "WARNING", "CRITICAL", "FATAL"] = Field(
        description="Severity level of the alert"
    )
    message: str = Field(description="Human-readable alert message")
    metric_value: float = Field(description="Current value of the monitored metric")
    threshold: float = Field(description="Threshold value that was breached")
    strategy_id: str | None = Field(
        default=None, description="Strategy that triggered the alert, if applicable"
    )
    venue: str | None = Field(default=None, description="Trading venue, if applicable")
