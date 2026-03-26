"""Commodity signal schemas for the unified trading system.

These schemas define the contract for commodity signal events published to the
event bus by signal-generation services and consumed by trading-agent-service.

Cross-service contract SSOT: this module. Both features-commodity-service and
trading-agent-service must import from unified_api_contracts.internal.domain.features_commodity.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class RegimeState(StrEnum):
    """Market regime classification."""

    HIGH_VOL_TRENDING = "HIGH_VOL_TRENDING"
    LOW_VOL_MEAN_REVERTING = "LOW_VOL_MEAN_REVERTING"
    CRISIS = "CRISIS"
    TRENDING = "TRENDING"
    MEAN_REVERTING = "MEAN_REVERTING"
    VOLATILE = "VOLATILE"
    UNKNOWN = "UNKNOWN"


class FactorValue(BaseModel):
    """A single factor contribution to the master signal."""

    factor_id: str = Field(description="Unique identifier for this factor")
    raw_value: float = Field(description="Raw factor value before normalisation")
    normalized_value: float = Field(description="Normalised factor value in [-1, 1]")
    weight: float = Field(description="Weight of this factor in the master signal")
    staleness_seconds: int = Field(default=0, description="Age of the underlying data in seconds")


class CommoditySignal(BaseModel):
    """Aggregated signal for a single commodity, published by signal services.

    Consumed by trading-agent-service L2SignalLoop to drive trade decisions.
    """

    commodity: str = Field(description="Commodity identifier (e.g. 'BTC', 'ETH')")
    master_signal: float = Field(
        description="Composite signal in [-1, 1]; negative = bearish, positive = bullish"
    )
    regime: RegimeState = Field(
        default=RegimeState.UNKNOWN, description="Current market regime classification"
    )
    regime_confidence: float = Field(
        default=0.0, description="Confidence in regime classification [0, 1]"
    )
    factors: list[FactorValue] = Field(
        default_factory=list, description="Individual factor contributions"
    )
    signal_timestamp: datetime = Field(description="UTC timestamp when this signal was computed")
    stale_factor_ids: list[str] = Field(
        default_factory=list,
        description="Factor IDs whose underlying data exceeded the staleness threshold",
    )
