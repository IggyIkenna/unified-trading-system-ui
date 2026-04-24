"""Canonical progressive match schemas — 30-second interval time-series snapshots.

Originally in SFMatchProgressiveStats / SFMatchProgressiveOdds in
sports-betting-services-previous.  These capture live match state at every
30-second tick: team-level stats (possession, attacks, shots, cards, etc.)
and market odds (1X2, Asian handicap, over/under, first-half markets).
"""

from __future__ import annotations

from decimal import Decimal
from typing import Self

from pydantic import BaseModel, ConfigDict


class CanonicalProgressiveStats(BaseModel):
    """Team-level stats snapshot at a single 30-second interval."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    timer_seconds: int
    team: str  # home / away identifier

    # Score & possession
    goals: int | None = None
    possession_pct: float | None = None

    # Attacks
    dangerous_attacks: int | None = None
    attacks: int | None = None

    # Shots
    shots_on_target: int | None = None
    shots_off_target: int | None = None

    # Set pieces & discipline
    corners: int | None = None
    fouls: int | None = None
    yellow_cards: int | None = None
    red_cards: int | None = None

    # Other
    substitutions: int | None = None

    # Dominance (legacy flat field)
    dominance_pct: float | None = None

    # --- Enhanced fields (SFI nested data) ---

    # xG per team (SFI provides per-team xG at each interval)
    xg_home: float | None = None
    xg_away: float | None = None

    # Dominance index + rolling average per team
    dominance_index_home: float | None = None
    dominance_index_away: float | None = None
    dominance_avg_home: float | None = None
    dominance_avg_away: float | None = None

    # Attacks split (normal vs dangerous) — home
    attacks_normal: int | None = None
    attacks_dangerous: int | None = None
    # Attacks split — away
    attacks_normal_away: int | None = None
    attacks_dangerous_away: int | None = None

    # Shots breakdown
    shoots_total: int | None = None
    shoots_on_target: int | None = None
    shoots_off_target: int | None = None

    # In-play odds — 1X2
    odds_1x2_home: float | None = None
    odds_1x2_draw: float | None = None
    odds_1x2_away: float | None = None

    # In-play odds — Over/Under
    odds_ou_over: float | None = None
    odds_ou_under: float | None = None
    odds_ou_line: float | None = None

    # In-play odds — Asian Handicap
    odds_ah_home: float | None = None
    odds_ah_away: float | None = None
    odds_ah_line: float | None = None

    # In-play odds — Asian Corner
    odds_asian_corner_over: float | None = None
    odds_asian_corner_under: float | None = None
    odds_asian_corner_line: float | None = None

    # Halftime detection (seconds — derived from stats freeze detection)
    ht_start_timer: int | None = None
    ht_end_timer: int | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)


class CanonicalProgressiveOdds(BaseModel):
    """Market odds snapshot at a single 30-second interval."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    timer_seconds: int

    # 1X2 (full-time match result)
    home_win_odds: Decimal | None = None
    draw_odds: Decimal | None = None
    away_win_odds: Decimal | None = None

    # Over / Under 2.5 goals
    over_2_5_odds: Decimal | None = None
    under_2_5_odds: Decimal | None = None

    # Asian handicap
    asian_handicap_line: Decimal | None = None
    asian_handicap_home_odds: Decimal | None = None
    asian_handicap_away_odds: Decimal | None = None

    # First-half markets
    first_half_home_odds: Decimal | None = None
    first_half_draw_odds: Decimal | None = None
    first_half_away_odds: Decimal | None = None
    first_half_over_odds: Decimal | None = None
    first_half_under_odds: Decimal | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)
