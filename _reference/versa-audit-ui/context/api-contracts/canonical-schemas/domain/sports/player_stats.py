"""Canonical player match statistics schema — per-player per-fixture performance."""

from __future__ import annotations

from typing import Self

from pydantic import BaseModel, ConfigDict


class CanonicalPlayerMatchStats(BaseModel):
    """Normalised player statistics for a single fixture across all data sources.

    Maps from ``FixturePlayerStats`` (sports-betting-services-previous) with 33
    columns of per-player per-match data covering shots, goals, passes, tackles,
    duels, dribbles, fouls, cards, and penalties.
    """

    model_config = ConfigDict(frozen=True)

    # Identifiers (required)
    fixture_id: str
    team_id: str
    player_id: str

    # Player metadata
    player_name: str | None = None

    # Match participation
    minutes_played: int | None = None
    rating: float | None = None
    is_captain: bool = False
    is_substitute: bool = False

    # Shooting
    shots_total: int | None = None
    shots_on_target: int | None = None

    # Goals
    goals_total: int | None = None
    goals_conceded: int | None = None
    assists: int | None = None
    saves: int | None = None

    # Passing
    passes_total: int | None = None
    passes_key: int | None = None
    passes_accuracy: int | None = None

    # Defending
    tackles_total: int | None = None
    tackles_blocks: int | None = None
    tackles_interceptions: int | None = None

    # Duels
    duels_total: int | None = None
    duels_won: int | None = None

    # Dribbling
    dribbles_attempts: int | None = None
    dribbles_success: int | None = None
    dribbles_past: int | None = None

    # Fouls
    fouls_drawn: int | None = None
    fouls_committed: int | None = None

    # Discipline
    cards_yellow: int | None = None
    cards_red: int | None = None

    # Penalties
    penalty_won: int | None = None
    penalty_committed: int | None = None
    penalty_scored: int | None = None
    penalty_missed: int | None = None
    penalty_saved: int | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)
