"""Canonical lineup schemas — starting XI, substitutes, and coach information."""

from __future__ import annotations

from typing import Self

from pydantic import BaseModel, ConfigDict

# Raw dict value type covering primitives + nested structures (list/dict).
type _RawValue = (
    str
    | int
    | float
    | bool
    | None
    | list[dict[str, str | int | float | bool | None]]
    | dict[str, str | int | float | bool | None]
)


class LineupPlayer(BaseModel):
    """Single player entry within a fixture lineup."""

    model_config = ConfigDict(frozen=True)

    player_id: str
    player_name: str | None = None
    shirt_number: int | None = None
    position: str | None = None
    grid_position: str | None = None  # e.g. "1:1", "2:3"
    is_substitute: bool = False

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)


class CanonicalLineup(BaseModel):
    """Normalised fixture lineup across all data sources.

    Maps from *FixtureLineup* + *FixtureCoach* in the legacy
    ``sports-betting-services-previous`` schema.
    """

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    team_id: str
    formation: str | None = None  # e.g. "4-3-3"
    coach_name: str | None = None
    coach_id: str | None = None
    starting: tuple[LineupPlayer, ...] = ()
    substitutes: tuple[LineupPlayer, ...] = ()

    @classmethod
    def from_raw(cls, data: dict[str, _RawValue]) -> Self:
        """Construct from a nested dictionary (players as sub-dicts)."""
        return cls.model_validate(data)
