"""Fixture-level odds + re-exports of shared enums from canonical.domain.sports.

CanonicalOdds here is the fixture-level model (fixture_id, bookmaker_key, etc.).
The execution-level CanonicalOdds lives in canonical.domain.sports.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, ConfigDict


class OddsType(StrEnum):
    """Supported betting market types."""

    H2H = "h2h"
    OVER_UNDER = "over_under"
    ASIAN_HANDICAP = "asian_handicap"
    BOTH_TEAMS_SCORE = "both_teams_score"
    CORRECT_SCORE = "correct_score"
    OUTRIGHT = "outright"
    HALF_TIME_RESULT = "half_time_result"
    FIRST_HALF_OVER_UNDER = "first_half_over_under"
    CORNERS = "corners"
    CARDS = "cards"
    PLAYER_PROPS = "player_props"
    DRAW_NO_BET = "draw_no_bet"
    DOUBLE_CHANCE = "double_chance"
    GOAL_SCORER = "goal_scorer"


class OutcomeType(StrEnum):
    """Possible bet outcomes."""

    HOME = "home"
    DRAW = "draw"
    AWAY = "away"
    OVER = "over"
    UNDER = "under"
    YES = "yes"
    NO = "no"


class MarketStatus(StrEnum):
    """Status of an odds market."""

    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"
    SETTLED = "settled"


class CanonicalBookmakerMarket(BaseModel):
    """Single bookmaker offering for a specific market."""

    model_config = ConfigDict(frozen=True)

    bookmaker_key: str
    market: OddsType
    outcomes: dict[str, Decimal]
    margin: Decimal | None = None
    last_updated_utc: datetime | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


class CanonicalOdds(BaseModel):
    """Normalised fixture-level odds from a single bookmaker."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    bookmaker_key: str
    market: OddsType
    home_odds: Decimal | None = None
    draw_odds: Decimal | None = None
    away_odds: Decimal | None = None
    over_line: Decimal | None = None
    over_odds: Decimal | None = None
    under_odds: Decimal | None = None
    handicap_line: Decimal | None = None
    handicap_home_odds: Decimal | None = None
    handicap_away_odds: Decimal | None = None
    implied_home_prob: Decimal | None = None
    implied_draw_prob: Decimal | None = None
    implied_away_prob: Decimal | None = None
    margin: Decimal | None = None
    timestamp_utc: datetime
    source: str

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


__all__ = ["CanonicalBookmakerMarket", "CanonicalOdds", "MarketStatus", "OddsType", "OutcomeType"]
