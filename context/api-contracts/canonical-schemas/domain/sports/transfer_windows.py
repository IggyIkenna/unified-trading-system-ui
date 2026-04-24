"""Transfer window calendar — per-country, per-season SSOT.

Every national FA sets its own registration windows within FIFA's framework.
This module provides exact dates for all 20+ countries covered by our
prediction leagues, including COVID-era overrides (2020 extensions) and
non-European patterns (MLS primary/secondary, Brazil, Japan, etc.).

Consumers:
  - features-sports-service: transfer_window_calculator (replaces hardcoded dates)
  - deployment-api: data_status_service (window-aware denominator for transfer_records)
  - instruments-service: optional skip of transfer_records fetch outside windows

Usage:
    from unified_api_contracts.sports import (
        is_transfer_window_open,
        get_transfer_windows_for_year,
        most_recent_window_close,
    )
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class TransferWindowPeriod:
    """A single transfer registration window."""

    country: str  # ISO 3166-1 alpha-3
    window_type: str  # "summer" | "winter" | "primary" | "secondary" | "mid_season"
    open_date: date
    close_date: date

    @property
    def duration_days(self) -> int:
        return (self.close_date - self.open_date).days

    def contains(self, d: date) -> bool:
        return self.open_date <= d <= self.close_date


# ---------------------------------------------------------------------------
# League → country mapping (canonical league IDs from LEAGUE_REGISTRY)
# ---------------------------------------------------------------------------

_LEAGUE_TO_COUNTRY: dict[str, str] = {
    # England
    "EPL": "ENG",
    "ENG_CHAMPIONSHIP": "ENG",
    "ENG_LEAGUE_ONE": "ENG",
    "ENG_LEAGUE_TWO": "ENG",
    # Spain
    "LA_LIGA": "ESP",
    "SEGUNDA_DIVISION": "ESP",
    # Germany
    "BUNDESLIGA": "DEU",
    "BUNDESLIGA_2": "DEU",
    "LIGA_3": "DEU",
    # Italy
    "SERIE_A": "ITA",
    "SERIE_B": "ITA",
    # France
    "LIGUE_1": "FRA",
    "LIGUE_2": "FRA",
    # Netherlands
    "EREDIVISIE": "NLD",
    # Portugal
    "PRIMEIRA_LIGA": "PRT",
    # Belgium
    "JUPILER_PRO": "BEL",
    # Turkey
    "SUPER_LIG": "TUR",
    # Scotland
    "SCOTTISH_PREMIERSHIP": "SCO",
    # Austria
    "AUSTRIAN_BUNDESLIGA": "AUT",
    # Switzerland
    "SWISS_SUPER_LEAGUE": "CHE",
    # Denmark
    "DANISH_SUPERLIGA": "DNK",
    # Norway (calendar-year season)
    "ELITESERIEN": "NOR",
    # Sweden (calendar-year season)
    "ALLSVENSKAN": "SWE",
    # Poland
    "EKSTRAKLASA": "POL",
    # South Korea
    "K_LEAGUE_1": "KOR",
    # Argentina
    "ARGENTINA_PRIMERA": "ARG",
    # Brazil
    "BRASILEIRAO": "BRA",
    # Chile
    "CHILE_PRIMERA": "CHL",
    # USA
    "MLS": "USA",
    # Mexico
    "LIGA_MX": "MEX",
    # Japan
    "J1_LEAGUE": "JPN",
    # Australia
    "A_LEAGUE": "AUS",
    # Greece (if added)
    "GREEK_SUPER_LEAGUE": "GRC",
}


# ---------------------------------------------------------------------------
# Default window patterns per country (month, day)
# These represent typical/recent-year patterns. Year-specific overrides below.
# ---------------------------------------------------------------------------

# (open_month, open_day, close_month, close_day, window_type)
_WindowSpec = tuple[int, int, int, int, str]

_COUNTRY_DEFAULTS: dict[str, tuple[_WindowSpec, ...]] = {
    # --- EUROPE (standard FIFA dual-window) ---
    "ENG": (
        (6, 14, 8, 30, "summer"),  # FA usually Jun 14 - Aug 30
        (1, 1, 2, 3, "winter"),  # Jan 1 - ~Feb 3
    ),
    "ESP": (
        (7, 1, 8, 31, "summer"),  # Jul 1 - Aug 31
        (1, 1, 1, 31, "winter"),
    ),
    "DEU": (
        (7, 1, 8, 31, "summer"),  # Jul 1 - Aug 31 (Bundesliga)
        (1, 1, 1, 31, "winter"),
    ),
    "ITA": (
        (6, 1, 8, 31, "summer"),  # Jun 1 - Aug 31 (FIGC)
        (1, 1, 1, 31, "winter"),
    ),
    "FRA": (
        (6, 10, 8, 31, "summer"),  # Jun 10 - Aug 31 (LFP)
        (1, 1, 1, 31, "winter"),
    ),
    "NLD": (
        (6, 10, 8, 31, "summer"),
        (1, 1, 1, 31, "winter"),
    ),
    "PRT": (
        (7, 1, 9, 1, "summer"),  # Jul 1 - Sep 1
        (1, 1, 2, 2, "winter"),  # Jan 1 - Feb 2
    ),
    "BEL": (
        (6, 15, 9, 6, "summer"),  # Jun 15 - Sep 6
        (1, 1, 1, 31, "winter"),
    ),
    "TUR": (
        (6, 10, 9, 1, "summer"),
        (1, 1, 2, 1, "winter"),
    ),
    "SCO": (
        (6, 10, 8, 31, "summer"),
        (1, 1, 1, 31, "winter"),
    ),
    "AUT": (
        (7, 1, 9, 5, "summer"),
        (1, 7, 2, 6, "winter"),  # ~Jan 7 - Feb 6
    ),
    "CHE": (
        (6, 10, 9, 1, "summer"),
        (1, 15, 2, 15, "winter"),  # Jan 15 - Feb 15
    ),
    "DNK": (
        (6, 10, 9, 1, "summer"),
        (1, 1, 1, 31, "winter"),
    ),
    "NOR": (
        # Calendar-year season. "Summer" is mid-season.
        (8, 1, 8, 31, "mid_season"),
        (1, 1, 3, 31, "winter"),  # Off-season: Jan-Mar
    ),
    "SWE": (
        # Calendar-year season.
        (7, 1, 8, 31, "mid_season"),
        (11, 15, 3, 31, "winter"),  # Off-season crosses year boundary
    ),
    "POL": (
        (6, 22, 9, 1, "summer"),
        (1, 1, 2, 28, "winter"),
    ),
    "KOR": (
        # Calendar-year season. Windows align roughly with FIFA.
        (2, 15, 3, 31, "primary"),
        (7, 8, 8, 14, "mid_season"),
    ),
    "GRC": (
        (6, 10, 9, 1, "summer"),
        (1, 1, 1, 31, "winter"),
    ),
    # --- NON-EUROPEAN ---
    "ARG": (
        # AFA: two windows per year (Apertura/Clausura cycle)
        (7, 1, 8, 31, "summer"),
        (1, 1, 2, 28, "winter"),
    ),
    "BRA": (
        # CBF: first window Apr-May, second window Jul-Aug
        (4, 1, 5, 30, "primary"),
        (7, 10, 8, 31, "secondary"),
    ),
    "CHL": (
        (7, 1, 8, 31, "summer"),
        (1, 1, 2, 28, "winter"),
    ),
    "USA": (
        # MLS: primary Feb-May, secondary Jul-Aug
        (2, 13, 5, 1, "primary"),
        (7, 7, 8, 14, "secondary"),
    ),
    "MEX": (
        # Liga MX: Apertura Jun-Sep, Clausura Dec-Jan
        (6, 10, 9, 1, "summer"),
        (12, 15, 1, 31, "winter"),  # Crosses year boundary
    ),
    "JPN": (
        # J-League: calendar year. First window Jan-Apr, second Jul-Aug.
        (1, 6, 4, 1, "primary"),
        (7, 20, 8, 18, "secondary"),
    ),
    "AUS": (
        # A-League: off-season Jun-Aug, mid-season Jan
        (6, 15, 8, 31, "summer"),
        (1, 1, 1, 31, "mid_season"),
    ),
}


# ---------------------------------------------------------------------------
# Year-specific overrides
#
# Each entry replaces ALL windows for that country+year. The year key is the
# calendar year the window OPENS in (not the season year).
#
# COVID 2020: FIFA extended the summer 2020 window to Oct 5 for most European
# FAs. Some also had a "domestic-only" extension to Oct 16. We use the
# international deadline (Oct 5) as the close date.
#
# England 2019: FA experimented with an early close (Aug 8) for the summer
# window to reduce uncertainty before the season started.
# ---------------------------------------------------------------------------

_YEAR_OVERRIDES: dict[str, dict[int, tuple[_WindowSpec, ...]]] = {
    "ENG": {
        2019: (
            (5, 16, 8, 8, "summer"),  # Early close experiment
            (1, 1, 1, 31, "winter"),
        ),
        2020: (
            (7, 27, 10, 5, "summer"),  # COVID extension
            (1, 1, 2, 2, "winter"),
        ),
        2021: (
            (6, 9, 8, 31, "summer"),
            (1, 1, 2, 1, "winter"),
        ),
        2022: (
            (6, 10, 9, 1, "summer"),
            (1, 1, 1, 31, "winter"),
        ),
        2023: (
            (6, 14, 9, 1, "summer"),
            (1, 1, 2, 1, "winter"),
        ),
        2024: (
            (6, 14, 8, 30, "summer"),
            (1, 1, 2, 1, "winter"),
        ),
    },
    "ESP": {
        2020: (
            (7, 1, 10, 5, "summer"),  # COVID
            (1, 1, 1, 31, "winter"),
        ),
    },
    "DEU": {
        2020: (
            (7, 1, 10, 5, "summer"),  # COVID
            (1, 1, 1, 31, "winter"),
        ),
    },
    "ITA": {
        2020: (
            (9, 1, 10, 5, "summer"),  # COVID — delayed start
            (1, 4, 2, 1, "winter"),
        ),
    },
    "FRA": {
        2020: (
            (6, 10, 10, 5, "summer"),  # COVID
            (1, 1, 1, 31, "winter"),
        ),
    },
    "NLD": {
        2020: (
            (6, 10, 10, 5, "summer"),  # COVID
            (1, 1, 1, 31, "winter"),
        ),
    },
    "PRT": {
        2020: (
            (7, 1, 10, 5, "summer"),  # COVID
            (1, 1, 2, 2, "winter"),
        ),
    },
    "BEL": {
        2020: (
            (6, 15, 10, 5, "summer"),  # COVID
            (1, 1, 1, 31, "winter"),
        ),
    },
    "TUR": {
        2020: (
            (6, 10, 10, 5, "summer"),  # COVID
            (1, 1, 2, 1, "winter"),
        ),
    },
    "SCO": {
        2020: (
            (6, 10, 10, 5, "summer"),  # COVID
            (1, 1, 1, 31, "winter"),
        ),
    },
    "AUT": {
        2020: (
            (7, 1, 10, 5, "summer"),  # COVID
            (1, 7, 2, 6, "winter"),
        ),
    },
    "CHE": {
        2020: (
            (6, 10, 10, 5, "summer"),  # COVID
            (1, 15, 2, 15, "winter"),
        ),
    },
    "DNK": {
        2020: (
            (6, 10, 10, 5, "summer"),  # COVID
            (1, 1, 1, 31, "winter"),
        ),
    },
    "POL": {
        2020: (
            (6, 22, 10, 5, "summer"),  # COVID
            (1, 1, 2, 28, "winter"),
        ),
    },
    "USA": {
        2020: (
            (2, 12, 5, 1, "primary"),  # COVID — MLS paused, extended secondary
            (7, 7, 10, 29, "secondary"),
        ),
        2024: (
            (2, 14, 5, 1, "primary"),
            (7, 18, 8, 14, "secondary"),
        ),
    },
    "BRA": {
        2020: (
            (4, 1, 5, 30, "primary"),  # COVID — 2020 season shifted
            (7, 10, 10, 20, "secondary"),
        ),
    },
    "JPN": {
        2020: (
            (1, 6, 4, 3, "primary"),  # COVID - J-League suspended Mar-Jul
            (7, 20, 10, 16, "secondary"),
        ),
    },
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_country_for_league(canonical_league_id: str) -> str | None:
    """Return ISO alpha-3 country code for a canonical league ID."""
    return _LEAGUE_TO_COUNTRY.get(canonical_league_id)


def _resolve_specs(country: str, year: int) -> tuple[_WindowSpec, ...]:
    """Return window specs for a country+year, with override fallback."""
    overrides = _YEAR_OVERRIDES.get(country, {})
    if year in overrides:
        return overrides[year]
    defaults = _COUNTRY_DEFAULTS.get(country)
    if defaults is None:
        # Unknown country — fall back to generic European pattern
        return (
            (6, 10, 8, 31, "summer"),
            (1, 1, 1, 31, "winter"),
        )
    return defaults


def _spec_to_period(
    country: str,
    year: int,
    spec: _WindowSpec,
) -> TransferWindowPeriod:
    """Convert a window spec to a concrete TransferWindowPeriod.

    Handles cross-year windows (e.g. Mexico winter: Dec 15 → Jan 31).
    For Nordic off-season windows (Nov → Mar), the open_date is in `year`
    and close_date rolls into `year + 1`.
    """
    open_m, open_d, close_m, close_d, wtype = spec
    open_dt = date(year, open_m, open_d)
    # Cross-year windows (e.g. Dec->Jan or Nov->Mar) roll close into next year
    close_dt = date(year + 1, close_m, close_d) if close_m < open_m else date(year, close_m, close_d)
    return TransferWindowPeriod(
        country=country,
        window_type=wtype,
        open_date=open_dt,
        close_date=close_dt,
    )


def get_transfer_windows_for_year(
    country: str,
    year: int,
) -> list[TransferWindowPeriod]:
    """Return all transfer windows for a country in a given calendar year.

    Includes windows that OPEN in this year. Cross-year windows (e.g.
    Sweden's Nov→Mar off-season) open in `year` and close in `year+1`.
    """
    specs = _resolve_specs(country, year)
    return [_spec_to_period(country, year, s) for s in specs]


def get_windows_for_league(
    canonical_league_id: str,
    year: int,
) -> list[TransferWindowPeriod]:
    """Return transfer windows for a league in a given calendar year."""
    country = _LEAGUE_TO_COUNTRY.get(canonical_league_id)
    if country is None:
        # Unknown league — generic European fallback
        country = "_GENERIC"
    return get_transfer_windows_for_year(country, year)


def _get_candidate_windows(country: str, d: date) -> list[TransferWindowPeriod]:
    """Get windows that could contain date d (current + prior year for cross-year)."""
    windows: list[TransferWindowPeriod] = []
    windows.extend(get_transfer_windows_for_year(country, d.year))
    # Prior year's windows might still be open (cross-year: Nov→Mar)
    windows.extend(get_transfer_windows_for_year(country, d.year - 1))
    return windows


def is_transfer_window_open(canonical_league_id: str, d: date) -> bool:
    """Check if any transfer window is open for this league on date d."""
    country = _LEAGUE_TO_COUNTRY.get(canonical_league_id, "_GENERIC")
    return any(w.contains(d) for w in _get_candidate_windows(country, d))


def get_active_window(
    canonical_league_id: str,
    d: date,
) -> TransferWindowPeriod | None:
    """Return the currently open window, or None if no window is open."""
    country = _LEAGUE_TO_COUNTRY.get(canonical_league_id, "_GENERIC")
    for w in _get_candidate_windows(country, d):
        if w.contains(d):
            return w
    return None


def most_recent_window_close(
    canonical_league_id: str,
    d: date,
) -> date | None:
    """Return the most recent window close date strictly before d.

    Returns None if no prior close can be found (shouldn't happen for
    realistic dates 2019+).
    """
    country = _LEAGUE_TO_COUNTRY.get(canonical_league_id, "_GENERIC")
    # Check current and prior 2 years for close dates
    close_dates: list[date] = []
    for yr in (d.year, d.year - 1, d.year - 2):
        for w in get_transfer_windows_for_year(country, yr):
            if w.close_date < d:
                close_dates.append(w.close_date)
    return max(close_dates) if close_dates else None


def days_since_window_close(
    canonical_league_id: str,
    d: date,
) -> int | None:
    """Return number of days since the last window close, or None if open/unknown."""
    if is_transfer_window_open(canonical_league_id, d):
        return None  # Window currently open
    last = most_recent_window_close(canonical_league_id, d)
    return (d - last).days if last is not None else None


def next_window_open(
    canonical_league_id: str,
    d: date,
) -> date | None:
    """Return the next window open date on or after d."""
    country = _LEAGUE_TO_COUNTRY.get(canonical_league_id, "_GENERIC")
    open_dates: list[date] = []
    for yr in (d.year, d.year + 1):
        for w in get_transfer_windows_for_year(country, yr):
            if w.open_date >= d:
                open_dates.append(w.open_date)
    return min(open_dates) if open_dates else None


def days_until_window_open(
    canonical_league_id: str,
    d: date,
) -> int | None:
    """Days until the next window opens, or None if currently open."""
    if is_transfer_window_open(canonical_league_id, d):
        return None
    nxt = next_window_open(canonical_league_id, d)
    return (nxt - d).days if nxt is not None else None


def window_closed_within(
    canonical_league_id: str,
    d: date,
    days: int,
) -> bool:
    """Return True if a window closed within the last N days.

    Returns False if a window is currently open.
    """
    if is_transfer_window_open(canonical_league_id, d):
        return False
    last = most_recent_window_close(canonical_league_id, d)
    if last is None:
        return False
    return (d - last).days <= days


def is_transfer_data_expected(
    canonical_league_id: str,
    d: date,
    *,
    grace_days: int = 14,
) -> bool:
    """Whether transfer_records data is expected for this league+date.

    Returns True if a window is currently open or closed within grace_days.
    Player values (squad data) are expected year-round regardless.
    """
    if is_transfer_window_open(canonical_league_id, d):
        return True
    return window_closed_within(canonical_league_id, d, grace_days)
