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

from collections.abc import Iterable
from datetime import date, timedelta

from .league_data_other import FEATURES_LEAGUES as FEATURES_LEAGUES
from .league_data_other import NON_FOOTBALL_LEAGUES as NON_FOOTBALL_LEAGUES
from .league_data_other import REFERENCE_LEAGUES as REFERENCE_LEAGUES
from .league_data_prediction import PREDICTION_LEAGUES as PREDICTION_LEAGUES
from .league_registry import SEASON_BY_COUNTRY, LeagueDefinition

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


def get_live_stats_api_football_ids() -> frozenset[int]:
    """Return API Football league IDs that support live in-play statistics.

    API Football provides live stats (possession, shots, corners, fouls) for
    top-tier football leagues (Tier 0 cups/continental + Tier 1 national top
    divisions). Lower tiers only get score + events (goals/cards/subs).

    Used by instruments-service live poller to decide which fixtures get the
    extra ``/fixtures/statistics`` call vs just score + events.
    """
    return frozenset(
        league.api_football_id
        for league in LEAGUE_REGISTRY.values()
        if league.api_football_id is not None and league.sport == "FOOTBALL" and league.tier <= 1
    )


def get_all_prediction_league_ids() -> list[str]:
    """Return canonical league_id strings for all Prediction-tier leagues.

    Used by data-status to iterate leagues and show 0% for newly added ones.
    """
    return [league.league_id for league in get_prediction_leagues()]


def _is_in_season(d: date, season_start: int, season_end: int) -> bool:
    """Check if a date falls within a season defined by start/end months.

    Handles wrap-around seasons (e.g. Aug-May crosses year boundary).
    """
    month = d.month
    if season_start <= season_end:
        # Calendar-year season (e.g. Feb-Nov)
        return season_start <= month <= season_end
    # Wrap-around season (e.g. Aug-May)
    return month >= season_start or month <= season_end


def get_league_fixture_calendar(
    league_id: str,
    start: str,
    end: str,
) -> list[str]:
    """Return expected fixture dates for a league within a date range.

    Uses the league's country → ``SEASON_BY_COUNTRY`` season months to
    determine which dates fall within the active season. Off-season dates are
    excluded. Only returns dates that are NOT in the off-season gap.

    Args:
        league_id: Canonical league identifier (e.g. ``EPL``, ``BUN``).
        start: Start date (``YYYY-MM-DD`` inclusive).
        end: End date (``YYYY-MM-DD`` inclusive).

    Returns:
        Sorted list of date strings (``YYYY-MM-DD``) within the league's
        active season. Empty list if the league is not found or the entire
        range is off-season.
    """
    league = get_league(league_id)
    if league is None:
        return []

    season_months = SEASON_BY_COUNTRY.get(league.country, league.season_months)
    season_start, season_end = season_months

    start_date = date.fromisoformat(start)
    end_date = date.fromisoformat(end)

    result: list[str] = []
    current = start_date
    while current <= end_date:
        if _is_in_season(current, season_start, season_end):
            result.append(current.isoformat())
        current += timedelta(days=1)

    return result


# ---------------------------------------------------------------------------
# Expected team-count seed per league per season
# ---------------------------------------------------------------------------

# Drift-check denominator used by Transfermarkt + API-Football adapters to
# detect silent partial fetches (e.g. EPL returning 17 teams instead of 20).
#
# Keys are canonical ``league_id`` strings; values are ``{season_year:
# expected_team_count}``. Most top-tier football leagues have stable rosters
# across decades; MLS expansion is the headline exception. Seed values here
# are slow-moving — see ``get_expected_team_count_for_league`` for the
# lookup contract.
#
# SSOT: ``codex/02-data/sports-scheduling-and-sharding.md`` §2.7.
LEAGUE_EXPECTED_TEAM_COUNTS: dict[str, dict[int, int]] = {
    # England
    "EPL": dict.fromkeys(range(2020, 2027), 20),
    "ENG_CHAMPIONSHIP": dict.fromkeys(range(2020, 2027), 24),
    "ENG_LEAGUE_ONE": dict.fromkeys(range(2020, 2027), 24),
    "ENG_LEAGUE_TWO": dict.fromkeys(range(2020, 2027), 24),
    # Spain
    "LA_LIGA": dict.fromkeys(range(2020, 2027), 20),
    "SEGUNDA_DIVISION": dict.fromkeys(range(2020, 2027), 22),
    # Germany
    "BUNDESLIGA": dict.fromkeys(range(2020, 2027), 18),
    "BUNDESLIGA_2": dict.fromkeys(range(2020, 2027), 18),
    "LIGA_3": dict.fromkeys(range(2020, 2027), 20),
    # Italy
    "SERIE_A": dict.fromkeys(range(2020, 2027), 20),
    "SERIE_B": dict.fromkeys(range(2020, 2027), 20),
    # France
    "LIGUE_1": {2020: 20, 2021: 20, 2022: 20, 2023: 18, 2024: 18, 2025: 18, 2026: 18},
    "LIGUE_2": dict.fromkeys(range(2020, 2027), 20),
    # Netherlands / Portugal / Belgium
    "EREDIVISIE": dict.fromkeys(range(2020, 2027), 18),
    "PRIMEIRA_LIGA": dict.fromkeys(range(2020, 2027), 18),
    "JUPILER_PRO": dict.fromkeys(range(2020, 2027), 18),
    # Turkey / Greece / Scotland / Austria / Switzerland
    "SUPER_LIG": dict.fromkeys(range(2020, 2024), 20) | dict.fromkeys(range(2024, 2027), 19),
    "GREEK_SUPER_LEAGUE": dict.fromkeys(range(2020, 2027), 14),
    "SCOTTISH_PREMIERSHIP": dict.fromkeys(range(2020, 2027), 12),
    "AUSTRIAN_BUNDESLIGA": dict.fromkeys(range(2020, 2027), 12),
    "SWISS_SUPER_LEAGUE": dict.fromkeys(range(2020, 2023), 10) | dict.fromkeys(range(2023, 2027), 12),
    # Nordics / Poland
    "DANISH_SUPERLIGA": dict.fromkeys(range(2020, 2027), 12),
    "ELITESERIEN": dict.fromkeys(range(2020, 2027), 16),
    "ALLSVENSKAN": dict.fromkeys(range(2020, 2027), 16),
    "EKSTRAKLASA": dict.fromkeys(range(2020, 2027), 18),
    # Americas
    "ARGENTINA_PRIMERA": dict.fromkeys(range(2020, 2027), 28),
    "BRASILEIRAO": dict.fromkeys(range(2020, 2027), 20),
    "CHILE_PRIMERA": dict.fromkeys(range(2020, 2027), 16),
    "MLS": {2020: 26, 2021: 27, 2022: 28, 2023: 29, 2024: 29, 2025: 30, 2026: 30},
    "LIGA_MX": dict.fromkeys(range(2020, 2027), 18),
    # Asia-Pacific
    "J1_LEAGUE": dict.fromkeys(range(2020, 2027), 18),
    "K_LEAGUE_1": dict.fromkeys(range(2020, 2027), 12),
    "A_LEAGUE": dict.fromkeys(range(2020, 2024), 12) | dict.fromkeys(range(2024, 2027), 13),
}


def get_expected_team_count_for_league(league_id: str, season: int) -> int | None:
    """Return expected team count for a league in a given season, or ``None``.

    Lookup order:
      1. The league's own ``LeagueDefinition.expected_team_count_per_season``
         (per-instance override for test fixtures / future inline migration).
      2. The module-level seed dict ``LEAGUE_EXPECTED_TEAM_COUNTS`` (primary
         SSOT for production adapters).

    ``None`` signals "unknown" and MUST be interpreted by callers as
    "skip the drift check silently" — never as zero.

    Args:
        league_id: Canonical league identifier (case-insensitive).
        season: Season year (e.g. ``2024`` for the 2024-25 EPL season).

    Returns:
        Expected team count, or ``None`` when the league / season is not seeded.
    """
    lid = league_id.upper()
    league = LEAGUE_REGISTRY.get(lid)
    if league is not None and league.expected_team_count_per_season is not None:
        override = league.expected_team_count_per_season.get(season)
        if override is not None:
            return override
    seeded = LEAGUE_EXPECTED_TEAM_COUNTS.get(lid)
    if seeded is None:
        return None
    return seeded.get(season)


def get_expected_leagues_for_source(
    source_key: str,
    classifications: Iterable[str] | None = None,
) -> list[LeagueDefinition]:
    """Return leagues expected to produce data for a given source.

    Canonical denominator for deployment-api data-status coverage %. For a
    given source (``api_football``, ``footystats``, ``odds_api``,
    ``open_meteo``, ``soccer_football_info``, ``transfermarkt``,
    ``understat``), returns the list of leagues whose ``data_sources``
    frozenset contains ``source_key``. Optionally restrict by league
    classification (``Prediction`` / ``Features`` / ``Reference`` /
    ``Other``).

    SSOT: ``codex/02-data/sports-data-source-coverage-matrix.md``.

    Args:
        source_key: Data-source identifier as stored in
            ``LeagueDefinition.data_sources`` (e.g. ``"api_football"``).
        classifications: Optional iterable of classification strings.
            ``None`` means all classifications.

    Returns:
        List of ``LeagueDefinition`` entries matching the filter.
        Empty list if the source key is unknown or no leagues match.
    """
    allowed = {c.lower() for c in classifications} if classifications is not None else None
    return [
        league
        for league in LEAGUE_REGISTRY.values()
        if source_key in league.data_sources and (allowed is None or league.classification.lower() in allowed)
    ]


__all__ = [
    "FEATURES_LEAGUES",
    "LEAGUE_EXPECTED_TEAM_COUNTS",
    "LEAGUE_REGISTRY",
    "NON_FOOTBALL_LEAGUES",
    "PREDICTION_LEAGUES",
    "REFERENCE_LEAGUES",
    "get_all_prediction_league_ids",
    "get_expected_leagues_for_source",
    "get_expected_team_count_for_league",
    "get_league",
    "get_league_by_api_football_id",
    "get_league_fixture_calendar",
    "get_leagues_by_classification",
    "get_leagues_by_country",
    "get_leagues_for_sport",
    "get_live_stats_api_football_ids",
    "get_prediction_leagues",
]
