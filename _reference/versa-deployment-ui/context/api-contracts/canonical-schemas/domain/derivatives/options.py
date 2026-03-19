"""Canonical options schemas for normalized-strike vol strategies.

Key design: features and ML layers operate in normalized (delta/moneyness)
strike space. The StrikeMapper in execution-service resolves delta coordinates
to real venue strikes at order time. These schemas represent the normalized
coordinate system used in signal generation and backtesting.

Note: OptionChainSnapshot.contracts uses CanonicalOptionsChainEntry (from domain.py)
which already captures strike, option_type, expiration, bid/ask, IV, and greeks.
No duplicate OptionContract is created — CanonicalOptionsChainEntry is reused.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, field_validator

from . import CanonicalOptionsChainEntry


class NormalizedStrikeCoordinate(BaseModel):
    """A strike identified by delta and expiry (not raw price).

    Used in ExecutionInstruction.legs for options combos.
    The execution-service StrikeMapper resolves this to a real strike.
    """

    delta: float  # e.g. 0.25 = 25-delta call; 0.5 = ATM
    expiry_days: int  # calendar days to expiry
    option_type: Literal["call", "put"]
    moneyness: float | None = None  # ln(K/F); optional, computed by StrikeMapper

    @field_validator("delta")
    @classmethod
    def validate_delta(cls, v: float) -> float:
        if not (0.0 < v <= 1.0):
            raise ValueError(f"delta must be in (0, 1], got {v}")
        return v

    @field_validator("expiry_days")
    @classmethod
    def validate_expiry_days(cls, v: int) -> int:
        if v <= 0:
            raise ValueError(f"expiry_days must be positive, got {v}")
        return v


class OptionChainSnapshot(BaseModel):
    """A snapshot of an options chain from a single venue at a point in time.

    Used by StrikeMapper to resolve NormalizedStrikeCoordinate → real strike.
    contracts uses CanonicalOptionsChainEntry — the UAC-owned canonical options
    chain entry type that captures strike, IV, greeks, bid/ask, and expiry.
    """

    venue: str
    underlying: str  # e.g. "BTC", "ETH", "SPY"
    underlying_price: Decimal
    timestamp: datetime
    expiry: str  # ISO date "YYYY-MM-DD"
    contracts: list[CanonicalOptionsChainEntry]


__all__ = [
    "NormalizedStrikeCoordinate",
    "OptionChainSnapshot",
]
