"""Season start dates and reference-data trigger calendar.

Combines per-league season boundaries (from LeagueDefinition.season_months)
with transfer window dates (from transfer_windows.py) to produce a unified
trigger calendar.  The orchestrator uses this to decide WHEN to refresh
slow-moving reference data (teams, player values, mappings) instead of
re-fetching identical data every day.

Trigger dates per league per year:
  1. Season start (first day of start_month) - promotion/relegation changes
  2. Transfer window open dates - squad changes begin
  3. Transfer window close dates - squad changes finalize

For historical backfill, fetch reference data at each trigger date.
For live mode, check ``is_reference_refresh_date()`` on each batch run.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import NamedTuple

from .league_data import LEAGUE_REGISTRY
from .league_registry import LeagueDefinition
from .transfer_windows import (
    _LEAGUE_TO_COUNTRY,
    get_transfer_windows_for_year,
)

# Bridge LeagueDefinition.country (ISO 3166-1 alpha-2) to
# transfer_windows.py country codes (ISO 3166-1 alpha-3).
_COUNTRY_2_TO_3: dict[str, str] = {
    "GB": "ENG",
    "ES": "ESP",
    "DE": "DEU",
    "IT": "ITA",
    "FR": "FRA",
    "NL": "NLD",
    "PT": "PRT",
    "BE": "BEL",
    "TR": "TUR",
    "GR": "GRC",
    "AT": "AUT",
    "CH": "CHE",
    "DK": "DNK",
    "NO": "NOR",
    "SE": "SWE",
    "PL": "POL",
    "AR": "ARG",
    "BR": "BRA",
    "CL": "CHL",
    "US": "USA",
    "MX": "MEX",
    "JP": "JPN",
    "KR": "KOR",
    "AU": "AUS",
    "SC": "SCO",
}


class SeasonBoundary(NamedTuple):
    """Season start and end dates for a league-year."""

    league_id: str
    season_year: int
    start_date: date
    end_date: date


def get_season_start(league_id: str, season_year: int) -> date:
    """Return the approximate season start date for a league.

    Uses ``season_months`` from the league registry.  The start date is the
    first day of the start month in ``season_year``.

    For cross-year seasons (e.g. EPL Aug 2025 - May 2026), ``season_year``
    is the year the season STARTS (2025 for the 2025-26 EPL season).
    """
    league_def = _get_league_def(league_id)
    if league_def is None:
        # Unknown league -- fall back to generic European Aug 1
        return date(season_year, 8, 1)
    start_month = league_def.season_months[0]
    return date(season_year, start_month, 1)


def get_season_end(league_id: str, season_year: int) -> date:
    """Return the approximate season end date for a league.

    For cross-year seasons, the end date is in ``season_year + 1``.
    For calendar-year seasons, the end is in ``season_year``.
    """
    league_def = _get_league_def(league_id)
    if league_def is None:
        return date(season_year + 1, 5, 31)
    start_month, end_month = league_def.season_months
    # Cross-year season (e.g. Aug-May): end is in the next calendar year
    end_year = season_year + 1 if end_month < start_month else season_year
    # Last day of end month (approximate with 28 for safety)
    if end_month == 12:
        return date(end_year, 12, 31)
    return date(end_year, end_month + 1, 1) - timedelta(days=1)


def get_season_boundary(league_id: str, season_year: int) -> SeasonBoundary:
    """Return the full season boundary for a league-year."""
    return SeasonBoundary(
        league_id=league_id,
        season_year=season_year,
        start_date=get_season_start(league_id, season_year),
        end_date=get_season_end(league_id, season_year),
    )


def get_reference_refresh_dates(league_id: str, year: int) -> list[date]:
    """Return all dates when reference data should be refreshed for a league.

    Combines:
      1. Season start date (teams change via promotion/relegation)
      2. Transfer window open dates (squad changes begin)
      3. Transfer window close dates (squad changes finalize)

    Returns sorted, deduplicated list of trigger dates.
    """
    triggers: set[date] = set()

    # 1. Season start
    triggers.add(get_season_start(league_id, year))

    # 2. Transfer window dates
    tw_country = _LEAGUE_TO_COUNTRY.get(league_id, "_GENERIC")
    for window in get_transfer_windows_for_year(tw_country, year):
        triggers.add(window.open_date)
        triggers.add(window.close_date)

    # Also check prior year's windows that might close in this year
    # (e.g. Sweden's off-season window opens Nov, closes Mar+1)
    for window in get_transfer_windows_for_year(tw_country, year - 1):
        if window.close_date.year == year:
            triggers.add(window.close_date)

    return sorted(triggers)


def is_reference_refresh_date(
    league_id: str,
    d: date,
    *,
    tolerance_days: int = 3,
) -> bool:
    """Check if date ``d`` is within ``tolerance_days`` of a trigger date.

    The tolerance allows the batch scheduler to hit the trigger even if
    it doesn't run on the exact date (e.g. weekends, outages).
    """
    triggers = get_reference_refresh_dates(league_id, d.year)
    return any(abs((d - t).days) <= tolerance_days for t in triggers)


def is_any_league_refresh_date(
    d: date,
    *,
    tolerance_days: int = 3,
) -> bool:
    """Check if date ``d`` is a refresh trigger for ANY tracked league.

    Used by the orchestrator to decide whether to run the slow-moving
    reference data fetch on a given batch date.
    """
    for league_id in _LEAGUE_TO_COUNTRY:
        if is_reference_refresh_date(league_id, d, tolerance_days=tolerance_days):
            return True
    return False


def get_leagues_needing_refresh(
    d: date,
    *,
    tolerance_days: int = 3,
) -> list[str]:
    """Return league IDs that need reference data refresh on date ``d``."""
    return [
        league_id
        for league_id in _LEAGUE_TO_COUNTRY
        if is_reference_refresh_date(league_id, d, tolerance_days=tolerance_days)
    ]


def get_transfer_window_country(league_id: str) -> str:
    """Get the 3-letter country code used by transfer_windows.py for a league.

    Falls back to looking up LeagueDefinition.country and bridging via
    _COUNTRY_2_TO_3.  Returns '_GENERIC' if no mapping found.
    """
    # Direct lookup in transfer_windows mapping
    direct = _LEAGUE_TO_COUNTRY.get(league_id)
    if direct is not None:
        return direct

    # Bridge via LeagueDefinition.country (2-letter)
    league_def = _get_league_def(league_id)
    if league_def is not None:
        return _COUNTRY_2_TO_3.get(league_def.country, "_GENERIC")

    return "_GENERIC"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_league_def(league_id: str) -> LeagueDefinition | None:
    """Lookup a LeagueDefinition by league_id."""
    return LEAGUE_REGISTRY.get(league_id)
