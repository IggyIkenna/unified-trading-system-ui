"""Sports feature-service storage schemas — TypedDicts for GCS parquet tables.

Each TypedDict defines the column names and types for one GCS table written by
features-sports-service. Column names are derived from TypedDict __annotations__
by output_schemas.py (single source of truth).

These are flat storage schemas (not Pydantic models) — fields map directly to
parquet columns. Optional fields use ``| None`` and map to nullable parquet types.

Relationship to UAC canonical sports models:
  UAC unified_api_contracts.external.api_football (and related sports sources)
  defines the Pydantic wire schemas (CanonicalFixture, CanonicalTeam, etc.)
  used for API normalisation.
  These TypedDicts are the flattened GCS output shapes — one row per entity.
"""

from __future__ import annotations

from typing import TypedDict


class LeagueRecord(TypedDict, total=False):
    """One row in the ``leagues`` GCS table."""

    league_id: str
    name: str
    country: str
    league_type: str | None
    logo_url: str | None
    season: str | None


class TeamRecord(TypedDict, total=False):
    """One row in the ``teams`` GCS table."""

    team_id: str
    name: str
    short_name: str | None
    country: str | None
    founded: int | None
    logo_url: str | None
    venue_id: str | None


class VenueRecord(TypedDict, total=False):
    """One row in the ``venues`` GCS table (stadiums)."""

    venue_id: str
    name: str
    city: str | None
    country: str | None
    capacity: int | None
    surface: str | None
    latitude: float | None
    longitude: float | None


class PlayerRecord(TypedDict, total=False):
    """One row in the ``players`` GCS table."""

    player_id: str
    name: str
    first_name: str | None
    last_name: str | None
    nationality: str | None
    position: str | None
    date_of_birth: str | None
    height_cm: int | None
    weight_kg: int | None
    team_id: str | None


class CoachRecord(TypedDict, total=False):
    """One row in the ``coaches`` GCS table."""

    coach_id: str
    name: str
    nationality: str | None
    team_id: str | None
    date_of_birth: str | None


class RefereeRecord(TypedDict, total=False):
    """One row in the ``referees`` GCS table."""

    referee_id: str
    name: str
    nationality: str | None


class FixtureRecord(TypedDict, total=False):
    """One row in the ``fixtures`` GCS table — flat fixture with embedded team/league info."""

    fixture_id: str
    league_id: str
    season: str
    match_week: int | None
    kickoff_utc: str  # ISO-8601
    status: str | None
    home_team_id: str
    away_team_id: str
    venue_id: str | None
    referee_id: str | None
    home_goals: int | None
    away_goals: int | None
    home_goals_halftime: int | None
    away_goals_halftime: int | None
    home_xg: float | None
    away_xg: float | None
    home_shots_on_target: int | None
    away_shots_on_target: int | None
    home_total_shots: int | None
    away_total_shots: int | None
    home_possession: int | None
    away_possession: int | None
    round_name: str | None


class FixtureStatsRecord(TypedDict, total=False):
    """One row in the ``fixture_stats`` GCS table — per-team per-fixture statistics."""

    fixture_id: str
    team_id: str
    shots_on_target: int | None
    shots_off_target: int | None
    shots_total: int | None
    shots_blocked: int | None
    shots_inside_box: int | None
    shots_outside_box: int | None
    fouls: int | None
    corners: int | None
    offsides: int | None
    possession_pct: int | None
    yellow_cards: int | None
    red_cards: int | None
    goalkeeper_saves: int | None
    passes_total: int | None
    passes_accurate: int | None
    passes_accuracy_pct: int | None
    expected_goals: float | None
    goals_prevented: float | None


class FixtureEventsRecord(TypedDict, total=False):
    """One row in the ``fixture_events`` GCS table — goals, cards, substitutions, VAR."""

    fixture_id: str
    team_id: str
    player_id: str | None
    player_name: str | None
    minute: int
    extra_time: int | None
    event_type: str  # goal | card | substitution | var
    detail: str | None
    comments: str | None


class FixtureLineupsRecord(TypedDict, total=False):
    """One row in the ``fixture_lineups`` GCS table — one row per player per fixture-team."""

    fixture_id: str
    team_id: str
    player_id: str
    player_name: str | None
    shirt_number: int | None
    position: str | None
    grid_position: str | None
    is_substitute: bool
    formation: str | None
    coach_name: str | None
    coach_id: str | None


class FixturePlayerStatsRecord(TypedDict, total=False):
    """One row in the ``fixture_player_stats`` GCS table — per-player per-fixture performance."""

    fixture_id: str
    team_id: str
    player_id: str
    player_name: str | None
    minutes_played: int | None
    rating: float | None
    is_captain: bool
    is_substitute: bool
    shots_total: int | None
    shots_on_target: int | None
    goals_total: int | None
    goals_conceded: int | None
    assists: int | None
    saves: int | None
    passes_total: int | None
    passes_key: int | None
    passes_accuracy: int | None
    tackles_total: int | None
    tackles_blocks: int | None
    tackles_interceptions: int | None
    duels_total: int | None
    duels_won: int | None
    dribbles_attempts: int | None
    dribbles_success: int | None
    dribbles_past: int | None
    fouls_drawn: int | None
    fouls_committed: int | None
    cards_yellow: int | None
    cards_red: int | None
    penalty_won: int | None
    penalty_committed: int | None
    penalty_scored: int | None
    penalty_missed: int | None
    penalty_saved: int | None


class InjuryRecord(TypedDict, total=False):
    """One row in the ``injuries`` GCS table."""

    fixture_id: str
    team_id: str
    player_id: str
    player_name: str
    reason: str | None
    severity: str | None


class StandingsRecord(TypedDict, total=False):
    """One row in the ``standings`` GCS table — league table entry."""

    league_id: str
    season: str
    team_id: str
    rank: int
    points: int
    goals_diff: int | None
    form: str | None
    played: int | None
    won: int | None
    drawn: int | None
    lost: int | None
    goals_for: int | None
    goals_against: int | None
    group: str | None
    description: str | None


class RoundRecord(TypedDict, total=False):
    """One row in the ``rounds`` GCS table."""

    league_id: str
    season: str
    round_name: str
    start_date: str | None
    end_date: str | None
    is_current: bool


__all__ = [
    "CoachRecord",
    "FixtureEventsRecord",
    "FixtureLineupsRecord",
    "FixturePlayerStatsRecord",
    "FixtureRecord",
    "FixtureStatsRecord",
    "InjuryRecord",
    "LeagueRecord",
    "PlayerRecord",
    "RefereeRecord",
    "RoundRecord",
    "StandingsRecord",
    "TeamRecord",
    "VenueRecord",
]
