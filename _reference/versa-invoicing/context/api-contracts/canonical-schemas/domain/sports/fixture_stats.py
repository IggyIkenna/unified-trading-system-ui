"""Canonical fixture statistics — per-team stats for a single match."""

from __future__ import annotations

from typing import Self

from pydantic import BaseModel, ConfigDict


class CanonicalFixtureStatsDetail(BaseModel):
    """Normalised per-team fixture statistics across all data sources.

    Maps the 19 statistical columns from FixtureStats (sports-betting-services-previous)
    into a canonical, frozen Pydantic model.  Each row represents one team's
    statistics in a single fixture.
    """

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    team_id: str

    # Shot statistics
    shots_on_target: int | None = None
    shots_off_target: int | None = None
    shots_total: int | None = None
    shots_blocked: int | None = None
    shots_inside_box: int | None = None
    shots_outside_box: int | None = None

    # Match event statistics
    fouls: int | None = None
    corners: int | None = None
    offsides: int | None = None

    # Possession
    possession_pct: int | None = None

    # Disciplinary
    yellow_cards: int | None = None
    red_cards: int | None = None

    # Goalkeeper
    goalkeeper_saves: int | None = None

    # Passing
    passes_total: int | None = None
    passes_accurate: int | None = None
    passes_accuracy_pct: int | None = None

    # Advanced metrics
    expected_goals: float | None = None
    goals_prevented: float | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)
