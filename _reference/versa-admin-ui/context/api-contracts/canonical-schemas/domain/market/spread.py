"""Canonical schemas for spread/pairs trading products.

UAC owns these — they are the execution-layer contracts for stat arb,
relative vol, and cross-exchange arb strategies.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, field_validator


class SpreadLeg(BaseModel):
    """One leg of a two-legged spread position."""

    instrument_key: str  # "VENUE:TYPE:SYMBOL" canonical key
    side: Literal["long", "short"]
    hedge_ratio: Decimal  # β from rolling OLS regression; always positive


class CanonicalSpread(BaseModel):
    """A cointegrated pair / spread product for stat arb and relative vol strategies.

    Created by strategy-service when a spread signal fires.
    Passed to execution-service for multi-leg order decomposition.
    """

    spread_id: str  # uuid4
    strategy_id: str
    leg_a: SpreadLeg
    leg_b: SpreadLeg
    cointegration_score: Decimal  # [0, 1]; higher = stronger cointegration
    half_life_bars: Decimal  # Ornstein-Uhlenbeck half-life in bars
    entry_zscore: Decimal  # spread z-score at signal time
    timestamp: datetime

    @field_validator("cointegration_score")
    @classmethod
    def validate_cointegration_score(cls, v: Decimal) -> Decimal:
        if not (Decimal("0") <= v <= Decimal("1")):
            raise ValueError(f"cointegration_score must be in [0, 1], got {v}")
        return v

    @field_validator("half_life_bars")
    @classmethod
    def validate_half_life(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError(f"half_life_bars must be positive, got {v}")
        return v


__all__ = [
    "CanonicalSpread",
    "SpreadLeg",
]
