"""Sports odds tick domain schemas for market-tick-data-service.

Canonical Pydantic models for sports odds data normalized into tick-like format.
These are the SSOT for SportsOddsTick / SportsBookUpdate across all services.

- SportsOddsTick: Individual odds tick from a single bookmaker for one outcome
- SportsBookUpdate: Canonical snapshot of all outcomes for a fixture/market at a point in time

UIC may import from UAC — this is the correct direction per TIER-ARCHITECTURE.md
(UAC = T0 pure leaf; UIC = T0-with-UAC-dependency, builds after UAC).

Schema version bump rules:
  MAJOR = breaking field change or removal
  MINOR = optional field added
  PATCH = docs/metadata only
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, computed_field
from unified_api_contracts import (
    MarketStatus,
    OddsType,
    OutcomeType,
)

__schema_version__ = "1.0.0"

__all__ = [
    "SportsBookUpdate",
    "SportsOddsTick",
]


class SportsOddsTick(BaseModel):
    """Individual odds tick — one bookmaker's price for one outcome at one moment.

    Maps sports concepts to tick-data concepts:
    - bookmaker_key  -> venue (the "exchange" quoting the price)
    - fixture_key    -> instrument_key (the "instrument" being priced)
    - market_type    -> market classification (h2h, over_under, etc.)
    - outcome        -> which side of the market (home, draw, away, etc.)
    - odds_value     -> price (decimal odds)
    - volume         -> available liquidity (exchange venues only)
    - ts_event_ns    -> event timestamp in nanoseconds for parquet compat
    """

    model_config = ConfigDict(frozen=True)

    timestamp_utc: datetime
    bookmaker_key: str
    fixture_key: str
    market_type: OddsType
    outcome: OutcomeType
    odds_value: Decimal
    volume: Decimal | None = None
    market_status: MarketStatus = MarketStatus.ACTIVE
    source: str = ""

    @computed_field
    @property
    def implied_probability(self) -> Decimal:
        """Implied probability from decimal odds: 1 / odds_value."""
        if self.odds_value > 0:
            return Decimal("1") / self.odds_value
        return Decimal("0")

    @computed_field
    @property
    def ts_event_ns(self) -> int:
        """Event timestamp as nanoseconds (int64) for parquet compatibility."""
        return int(self.timestamp_utc.timestamp() * 1_000_000_000)

    @computed_field
    @property
    def instrument_key(self) -> str:
        """Canonical instrument key: BOOKMAKER:MARKET_TYPE:FIXTURE_KEY."""
        return f"{self.bookmaker_key}:{self.market_type.value}:{self.fixture_key}"


class SportsBookUpdate(BaseModel):
    """Canonical book update for a fixture/market — all outcomes at a point in time.

    Analogous to an order-book snapshot in crypto: captures every bookmaker's
    quote for every outcome in a single market at a given timestamp.

    This is the "wide" representation complementing the tick-level SportsOddsTick.
    """

    model_config = ConfigDict(frozen=True)

    timestamp_utc: datetime
    fixture_key: str
    market_type: OddsType
    market_status: MarketStatus = MarketStatus.ACTIVE
    ticks: tuple[SportsOddsTick, ...]
    source: str = ""

    @computed_field
    @property
    def ts_event_ns(self) -> int:
        """Event timestamp as nanoseconds (int64) for parquet compatibility."""
        return int(self.timestamp_utc.timestamp() * 1_000_000_000)

    @computed_field
    @property
    def bookmaker_count(self) -> int:
        """Number of distinct bookmakers in this update."""
        return len({t.bookmaker_key for t in self.ticks})

    @computed_field
    @property
    def outcome_count(self) -> int:
        """Number of distinct outcomes in this update."""
        return len({t.outcome for t in self.ticks})
