"""Canonical fixture-event schema — goals, cards, substitutions, VAR decisions."""

from __future__ import annotations

from typing import Self

from pydantic import BaseModel, ConfigDict


class CanonicalFixtureEvent(BaseModel):
    """Normalised in-game event (goal, card, substitution, VAR) across all data sources."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    team_id: str
    player_id: str | None = None
    player_name: str | None = None
    minute: int
    extra_time: int | None = None
    event_type: str  # goal, card, substitution, var
    detail: str | None = None
    comments: str | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)
