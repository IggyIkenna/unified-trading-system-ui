"""Betting schemas — orders, executions, signals."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, ConfigDict

from .odds import OddsType


class BetStatus(StrEnum):
    """Lifecycle status of a bet."""

    PENDING = "pending"
    PLACED = "placed"
    PARTIALLY_MATCHED = "partially_matched"
    MATCHED = "matched"
    SETTLED_WIN = "settled_win"
    SETTLED_LOSS = "settled_loss"
    SETTLED_VOID = "settled_void"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class BetSide(StrEnum):
    """Side of a bet: back (for outcome) or lay (against outcome)."""

    BACK = "back"
    LAY = "lay"


class CommissionModel(StrEnum):
    """Fee model for a sports venue."""

    NET_WINNINGS_PCT = "net_winnings_pct"
    BUILT_INTO_ODDS = "built_into_odds"
    NOTIONAL_PCT = "notional_pct"
    FLAT_FEE = "flat_fee"
    MAKER_TAKER = "maker_taker"
    LOW_VIG_EXCHANGE = "low_vig_exchange"
    EXCHANGE_COMMISSION = "exchange_commission"


class SignalSource(StrEnum):
    """Origin of a betting signal."""

    ARBITRAGE = "arbitrage"
    ML_MODEL = "ml_model"


class BettingSignal(BaseModel):
    """A signal recommending a bet, from ML model or arbitrage detector."""

    model_config = ConfigDict(frozen=True)

    signal_id: str
    fixture_id: str
    market: OddsType
    selection: str
    confidence: Decimal
    expected_value: Decimal
    source: SignalSource
    model_version: str | None = None
    created_at_utc: datetime

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)


class BetOrder(BaseModel):
    """A bet order to be placed at a bookmaker or exchange."""

    model_config = ConfigDict(frozen=True)

    order_id: str
    fixture_id: str
    bookmaker_key: str
    market: OddsType
    selection: str
    requested_odds: Decimal
    stake: Decimal
    max_acceptable_odds: Decimal
    strategy_source: SignalSource
    signal_id: str | None = None
    opportunity_id: str | None = None
    created_at_utc: datetime

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)


class BetExecution(BaseModel):
    """Result of a bet placement attempt."""

    model_config = ConfigDict(frozen=True)

    execution_id: str
    order_id: str
    bet_id: str | None = None
    status: BetStatus
    filled_odds: Decimal | None = None
    filled_stake: Decimal | None = None
    bookmaker_ref: str | None = None
    error_message: str | None = None
    odds_at_placement: Decimal | None = None
    closing_odds: Decimal | None = None
    closing_line_source: str | None = None
    clv_edge_pct: Decimal | None = None
    executed_at_utc: datetime

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)


class CLVRecord(BaseModel):
    """Aggregated CLV tracking for model validation.

    CLV (Closing Line Value) measures whether bets consistently beat the closing line.
    A positive mean_clv over 500+ bets is strong evidence of a genuine edge.
    """

    model_config = ConfigDict(frozen=True)

    model_version: str
    sport_key: str
    market_type: str
    bookmaker_key: str | None = None
    period_start: datetime
    period_end: datetime
    total_bets: int
    bets_beating_close: int
    mean_clv_pct: Decimal
    median_clv_pct: Decimal
    clv_hit_rate: Decimal
    total_stake: Decimal
    total_pnl: Decimal
    roi_pct: Decimal
