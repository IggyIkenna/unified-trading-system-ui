"""DeFi alert model — canonical shape for DeFi-specific alerts."""

from __future__ import annotations

from pydantic import BaseModel, Field
from unified_api_contracts import DefiAlertType


class DefiAlert(BaseModel):
    """A DeFi-specific alert emitted by alerting-service DeFi rules."""

    alert_type: DefiAlertType
    severity: str = "warning"
    protocol: str | None = None
    asset: str | None = None
    message: str
    details: dict[str, str | int | float | bool] = Field(default_factory=dict)
