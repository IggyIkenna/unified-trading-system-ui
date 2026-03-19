"""Canonical injury schema — player injuries per fixture."""

from __future__ import annotations

from typing import Self

from pydantic import BaseModel, ConfigDict


class CanonicalInjury(BaseModel):
    """Normalised player injury record across all data sources."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    team_id: str
    player_id: str
    player_name: str
    reason: str | None = None
    severity: str | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary."""
        return cls.model_validate(data)
