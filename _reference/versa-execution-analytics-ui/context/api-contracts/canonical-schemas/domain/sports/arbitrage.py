"""Arbitrage opportunity and market schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, ConfigDict

from .odds import OddsType


class ArbitrageStatus(StrEnum):
    """Lifecycle of an arbitrage opportunity."""

    DETECTED = "detected"
    STALE = "stale"
    EXECUTED = "executed"
    MISSED = "missed"


class ArbitrageMarket(BaseModel):
    """One leg of an arbitrage opportunity — a single bookmaker's best price."""

    model_config = ConfigDict(frozen=True)

    bookmaker_key: str
    selection: str
    odds: Decimal
    implied_prob: Decimal
    max_stake: Decimal | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)


class ExpectedValue(BaseModel):
    """Expected value calculation for a single bet selection."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    market: OddsType
    selection: str
    bookmaker_key: str
    offered_odds: Decimal
    fair_odds: Decimal
    edge_pct: Decimal
    kelly_fraction: Decimal | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)


class ArbitrageOpportunity(BaseModel):
    """A cross-bookmaker arbitrage opportunity."""

    model_config = ConfigDict(frozen=True)

    opportunity_id: str
    fixture_id: str
    market: OddsType
    legs: list[ArbitrageMarket]
    total_implied_prob: Decimal
    expected_return_pct: Decimal
    detected_at_utc: datetime
    status: ArbitrageStatus

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)
