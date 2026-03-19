"""League data - the canonical LEAGUE_REGISTRY dict and query helpers.

Assembles all Prediction, Features, Reference, and Non-football leagues into a
single ``LEAGUE_REGISTRY`` dict keyed by canonical league_id string.

Also exposes convenience lookup functions used throughout the system.

Data is split across:
- ``league_data_prediction.py`` - top-tier domestic football leagues
- ``league_data_other.py``      - Features, Reference, and Non-football leagues

Source: Ported from instruments-service/instruments_service/sports/ into UAC so
all downstream consumers (features-sports-service, instruments-service, USRI)
share a single SSOT.
"""

from __future__ import annotations

from .league_data_other import FEATURES_LEAGUES as FEATURES_LEAGUES
from .league_data_other import NON_FOOTBALL_LEAGUES as NON_FOOTBALL_LEAGUES
from .league_data_other import REFERENCE_LEAGUES as REFERENCE_LEAGUES
from .league_data_prediction import PREDICTION_LEAGUES as PREDICTION_LEAGUES
from .league_registry import LeagueDefinition

# ---------------------------------------------------------------------------
# LEAGUE_REGISTRY - single source of truth for all leagues
# ---------------------------------------------------------------------------

LEAGUE_REGISTRY: dict[str, LeagueDefinition] = {
    **PREDICTION_LEAGUES,
    **FEATURES_LEAGUES,
    **REFERENCE_LEAGUES,
    **NON_FOOTBALL_LEAGUES,
}

# ---------------------------------------------------------------------------
# Reverse lookup - API-Football ID -> league_id
# ---------------------------------------------------------------------------

_API_FOOTBALL_ID_TO_LEAGUE: dict[int, str] = {
    league.api_football_id: league.league_id
    for league in LEAGUE_REGISTRY.values()
    if league.api_football_id is not None
}


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------


def get_league(league_id: str) -> LeagueDefinition | None:
    """Look up a league by its canonical identifier (case-insensitive)."""
    return LEAGUE_REGISTRY.get(league_id.upper())


def get_league_by_api_football_id(api_football_id: int) -> LeagueDefinition | None:
    """Look up a league by its API-Football numeric ID."""
    lid = _API_FOOTBALL_ID_TO_LEAGUE.get(api_football_id)
    if lid is None:
        return None
    return LEAGUE_REGISTRY.get(lid)


def get_leagues_for_sport(sport: str) -> list[LeagueDefinition]:
    """Return all leagues for a given sport type (case-insensitive)."""
    sport_upper = sport.upper()
    return [league for league in LEAGUE_REGISTRY.values() if league.sport == sport_upper]


def get_leagues_by_classification(classification: str) -> list[LeagueDefinition]:
    """Return all leagues matching a classification label."""
    cls_lower = classification.lower()
    return [league for league in LEAGUE_REGISTRY.values() if league.classification.lower() == cls_lower]


def get_leagues_by_country(country: str) -> list[LeagueDefinition]:
    """Return all leagues for a given ISO country code (case-insensitive)."""
    country_upper = country.upper()
    return [league for league in LEAGUE_REGISTRY.values() if league.country == country_upper]


def get_prediction_leagues() -> list[LeagueDefinition]:
    """Return all Prediction-tier leagues (suitable for model-based betting)."""
    return get_leagues_by_classification("Prediction")


__all__ = [
    "FEATURES_LEAGUES",
    "LEAGUE_REGISTRY",
    "NON_FOOTBALL_LEAGUES",
    "PREDICTION_LEAGUES",
    "REFERENCE_LEAGUES",
    "get_league",
    "get_league_by_api_football_id",
    "get_leagues_by_classification",
    "get_leagues_by_country",
    "get_leagues_for_sport",
    "get_prediction_leagues",
]
