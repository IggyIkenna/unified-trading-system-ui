"""Canonical injury schema — player injuries and suspensions per fixture."""

from __future__ import annotations

from enum import StrEnum
from typing import Self

from pydantic import BaseModel, ConfigDict


class AbsenceType(StrEnum):
    """Structured classification of why a player is unavailable.

    Derived deterministically from the raw ``reason`` string returned by
    data providers (e.g. API Football sidelined endpoint).
    """

    INJURY = "injury"
    SUSPENSION_RED_CARD = "suspension_red_card"
    SUSPENSION_YELLOW_ACCUMULATION = "suspension_yellow_accumulation"
    DOMESTIC_BAN = "domestic_ban"
    INTERNATIONAL_DUTY = "international_duty"
    PERSONAL = "personal"
    ILLNESS = "illness"
    OTHER = "other"


# ---------------------------------------------------------------------------
# Deterministic classifier: raw reason string → AbsenceType
# ---------------------------------------------------------------------------

_SUSPENSION_KEYWORDS = frozenset(
    {
        "red card",
        "suspended",
        "suspension",
        "ban",
        "banned",
        "violent conduct",
        "violent behaviour",
        "violent behavior",
        "straight red",
        "sending off",
        "sent off",
        "dismissal",
    }
)

_YELLOW_ACCUMULATION_KEYWORDS = frozenset(
    {
        "yellow card",
        "yellow cards",
        "accumulated yellow",
        "booking",
        "bookings",
        "caution accumulation",
    }
)

_INTERNATIONAL_KEYWORDS = frozenset(
    {
        "international duty",
        "national team",
        "international",
        "world cup",
        "afcon",
        "copa america",
        "euros",
    }
)

_PERSONAL_KEYWORDS = frozenset(
    {
        "personal",
        "personal reasons",
        "family",
        "compassionate",
        "bereavement",
    }
)

_ILLNESS_KEYWORDS = frozenset(
    {
        "illness",
        "ill",
        "sick",
        "flu",
        "covid",
        "virus",
        "fever",
        "infection",
    }
)


def classify_absence(reason: str | None) -> AbsenceType:
    """Classify a raw reason string into an ``AbsenceType``.

    The classifier checks keywords in priority order:
    suspension > yellow accumulation > international > personal > illness > injury.
    """
    if not reason:
        return AbsenceType.OTHER

    lower = reason.lower().strip()

    if any(kw in lower for kw in _YELLOW_ACCUMULATION_KEYWORDS):
        return AbsenceType.SUSPENSION_YELLOW_ACCUMULATION

    if any(kw in lower for kw in _SUSPENSION_KEYWORDS):
        return AbsenceType.SUSPENSION_RED_CARD

    if any(kw in lower for kw in _INTERNATIONAL_KEYWORDS):
        return AbsenceType.INTERNATIONAL_DUTY

    if any(kw in lower for kw in _PERSONAL_KEYWORDS):
        return AbsenceType.PERSONAL

    if any(kw in lower for kw in _ILLNESS_KEYWORDS):
        return AbsenceType.ILLNESS

    # Default: if there's a reason string and none of the above matched,
    # it's an injury (hamstring, knee, ankle, muscle, etc.)
    return AbsenceType.INJURY


class CanonicalInjury(BaseModel):
    """Normalised player absence record (injury, suspension, or other) across all data sources."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    team_id: str
    player_id: str
    player_name: str
    reason: str | None = None
    severity: str | None = None
    absence_type: AbsenceType = AbsenceType.OTHER

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        """Construct from a flat dictionary.

        If ``absence_type`` is not provided in the data, it is derived
        automatically from the ``reason`` field.
        """
        if "absence_type" not in data:
            reason = data.get("reason")
            if reason:
                data = {**data, "absence_type": classify_absence(str(reason))}
            # If no reason, absence_type stays at default (OTHER) — don't guess from empty string
        return cls.model_validate(data)
