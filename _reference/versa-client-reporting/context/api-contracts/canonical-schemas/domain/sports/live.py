"""Canonical live-mode schemas — real-time event wrappers for live sports trading.

Defines the Pub/Sub message schemas that wrap existing canonical types for live
data flow through the UTS pipeline (MTDS → FSS → strategy → execution).
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, ConfigDict

from .odds import CanonicalOdds


class MatchPeriod(StrEnum):
    """Current period of a live match."""

    PRE_MATCH = "pre_match"
    FIRST_HALF = "1H"
    HALF_TIME = "HT"
    SECOND_HALF = "2H"
    EXTRA_TIME_FIRST = "ET1"
    EXTRA_TIME_SECOND = "ET2"
    PENALTIES = "PEN"
    FULL_TIME = "FT"
    ABANDONED = "abandoned"
    POSTPONED = "postponed"


class LiveOddsUpdate(BaseModel):
    """Pub/Sub message wrapping a CanonicalOdds snapshot for live streaming.

    Published by market-tick-data-service (category=sports) whenever a new
    odds snapshot arrives from any tier (Odds API, OpticOdds/OddsJam, own scrapers).
    Consumed by features-sports-service in live mode.
    """

    model_config = ConfigDict(frozen=True)

    event_type: str = "ODDS_UPDATE"
    fixture_id: str
    bookmaker_key: str
    timestamp_utc: datetime
    is_in_play: bool
    match_minute: int | None = None
    odds: CanonicalOdds
    source_tier: str  # "odds_api", "opticodds", "oddsjam", "scraper", "exchange"

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)


class LiveMatchState(BaseModel):
    """Unified match state combining score, time, and period.

    Drives feature recomputation triggers in FSS live mode. Published by
    MTDS (from live stats scrapers or API sources) to the coordination topic.
    """

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    timestamp_utc: datetime
    period: MatchPeriod
    match_minute: int
    stoppage_time: int = 0
    is_live: bool
    home_score: int
    away_score: int
    home_red_cards: int = 0
    away_red_cards: int = 0
    home_penalties: int | None = None
    away_penalties: int | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)


class ScraperVersionMeta(BaseModel):
    """Website version tracking for a bookmaker scraper adapter.

    Stored per bookmaker in USEI. When a scraper fails, the registry flags
    the bookmaker as stale and alerts for CSS selector updates.
    """

    model_config = ConfigDict(frozen=True)

    bookmaker_key: str
    scraper_schema_version: str  # e.g. "bet365-v3"
    css_selector_hash: str  # SHA-256 of the selector set
    last_validated_utc: datetime
    page_structure_version: str  # e.g. "2026-03-01"
    is_stale: bool = False
    last_error: str | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)
