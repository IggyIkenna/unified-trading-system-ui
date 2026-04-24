"""Canonical ID builders for all sports entities.

SSOT for human-readable canonical ID generation. All normalize functions in
UAC external/{source}/normalize.py call these builders. USRI adapters call
normalize functions. Services never build canonical IDs directly.

Each entity has:
  - A canonical ID format (human-readable, deterministic, case-normalised)
  - A mapping from each data source's raw ID to the canonical ID
  - A reverse lookup from canonical ID back to source-specific IDs

Canonical ID Formats::

    League:     {COUNTRY}_{LEAGUE_ABBR}         → ENG_PREMIER_LEAGUE
    Team:       SCREAMING_SNAKE_CASE             → ARSENAL, MAN_CITY
    Fixture:    {LEAGUE}:{HOME}_v_{AWAY}:{DATE}  → EPL:ARSENAL_v_CHELSEA:20260322
    Player:     {LAST}_{INITIAL}                 → SAKA_B, FERNANDES_BRUNO
    Referee:    {LAST}_{INITIAL}                 → OLIVER_M
    Venue:      SCREAMING_SNAKE_CASE             → EMIRATES_STADIUM
    Season:     {YYYY}-{YY}                       → 2025-26
    Instrument: FOOTBALL:{BK}:{MKT}:{LG}:{SN}:{H}-{A}::{SEL}

Instrument example::

    FOOTBALL:BETFAIR_EX_UK:MATCH_ODDS:ENG_PREMIER_LEAGUE:2025-26:ARSENAL-CHELSEA::HOME

Human-readable so anyone can understand what it represents without a lookup.
"""

from __future__ import annotations

import re
import unicodedata


def _slug(name: str) -> str:
    """Convert a display name to SCREAMING_SNAKE_CASE slug.

    Strips diacritics, replaces spaces/hyphens with underscores,
    removes non-alphanumeric chars, uppercases.
    """
    # Strip diacritics (e.g. ü → u, é → e)
    nfkd = unicodedata.normalize("NFKD", name)
    ascii_only = nfkd.encode("ascii", "ignore").decode("ascii")
    # Replace separators with underscore
    slug = re.sub(r"[\s\-/&.]+", "_", ascii_only)
    # Remove non-alphanumeric (keep underscores)
    slug = re.sub(r"[^A-Za-z0-9_]", "", slug)
    # Collapse multiple underscores
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug.upper()


def _handicap_str(value: float) -> str:
    """Format handicap/point value for instrument IDs.

    Replaces `.` with `_` and negative sign with `M` prefix:
    2.5 → 2_5, -1.5 → M1_5, 0 → 0
    """
    if value < 0:
        return f"M{abs(value):g}".replace(".", "_")
    return f"{value:g}".replace(".", "_")


# ---------------------------------------------------------------------------
# Entity ID builders
# ---------------------------------------------------------------------------


def build_league_id(country: str, league_name: str) -> str:
    """Build canonical league ID: {COUNTRY}_{LEAGUE_ABBR}.

    Args:
        country: Country name or ISO code (e.g. "England", "ENG").
        league_name: League display name (e.g. "Premier League").

    Returns:
        Canonical league ID, e.g. "ENG_PREMIER_LEAGUE".
    """
    return f"{_slug(country)}_{_slug(league_name)}" if country else _slug(league_name)


def build_team_id(team_name: str) -> str:
    """Build canonical team ID: SCREAMING_SNAKE_CASE.

    Args:
        team_name: Team display name (e.g. "Manchester City").

    Returns:
        Canonical team ID, e.g. "MANCHESTER_CITY".
    """
    return _slug(team_name)


def build_fixture_id(
    league_id: str,
    home_team_id: str,
    away_team_id: str,
    date_str: str,
    time_str: str = "",
) -> str:
    """Build canonical fixture ID: {LEAGUE}:{HOME}_v_{AWAY}:{YYYYMMDD_HHMM}.

    Args:
        league_id: Canonical league ID (e.g. "ENG_PREMIER_LEAGUE").
        home_team_id: Canonical home team ID (e.g. "ARSENAL").
        away_team_id: Canonical away team ID (e.g. "CHELSEA").
        date_str: Date in any parseable format; YYYYMMDD digits extracted.
        time_str: Optional kickoff time. Accepts "HH:MM", "HHMM", or "HH:MM:SS".
            If empty, only the date is used (backwards compatible).

    Returns:
        Canonical fixture ID, e.g. "ENG_PREMIER_LEAGUE:ARSENAL_v_CHELSEA:20260322_1500".
        Without time: "ENG_PREMIER_LEAGUE:ARSENAL_v_CHELSEA:20260322".
    """
    date_digits = re.sub(r"[^0-9]", "", date_str)[:8]
    if time_str:
        time_digits = re.sub(r"[^0-9]", "", time_str)[:4]
        return f"{league_id}:{home_team_id}_v_{away_team_id}:{date_digits}_{time_digits}"
    return f"{league_id}:{home_team_id}_v_{away_team_id}:{date_digits}"


def build_player_id(last_name: str, first_name: str) -> str:
    """Build canonical player ID: {LASTNAME}_{INITIAL} or {LASTNAME}_{FIRSTNAME}.

    Single-name players (e.g. "Neymar") use just the name.
    Common first names use initial; uncommon use full first name.
    """
    last = _slug(last_name)
    first = _slug(first_name)
    if not first:
        return last
    return f"{last}_{first[0]}" if len(first) > 1 else f"{last}_{first}"


def build_referee_id(name: str) -> str:
    """Build canonical referee ID: {LASTNAME}_{INITIAL}.

    Args:
        name: Full referee name (e.g. "Michael Oliver").

    Returns:
        Canonical referee ID, e.g. "OLIVER_M".
    """
    parts = _slug(name).split("_")
    if len(parts) < 2:
        return _slug(name)
    return f"{parts[-1]}_{parts[0][0]}"


def build_venue_id(venue_name: str) -> str:
    """Build canonical venue/stadium ID: SCREAMING_SNAKE_CASE.

    Args:
        venue_name: Stadium name (e.g. "Emirates Stadium").

    Returns:
        Canonical venue ID, e.g. "EMIRATES_STADIUM".
    """
    return _slug(venue_name)


def build_season_id(start_year: int) -> str:
    """Build canonical season ID: {YYYY}-{YY}.

    Uses hyphen (not slash) to avoid GCS path separator and BigQuery
    external table partition issues.

    Args:
        start_year: Season start year (e.g. 2025).

    Returns:
        Season ID, e.g. "2025-26".
    """
    end_yy = (start_year + 1) % 100
    return f"{start_year}-{end_yy:02d}"


def build_instrument_id(
    bookmaker_key: str,
    market_type: str,
    league_id: str,
    season: str,
    home_team_id: str,
    away_team_id: str,
    selection: str,
    sport: str = "FOOTBALL",
    point: float | None = None,
) -> str:
    """Build canonical instrument ID for a betting market position.

    Format: {SPORT}:{VENUE}:{MARKET}:{LEAGUE}:{SEASON}:{HOME}-{AWAY}::{SELECTION}

    Args:
        bookmaker_key: Bookmaker identifier (e.g. "betfair_ex_uk", "pinnacle").
        market_type: Market type in SCREAMING_SNAKE (e.g. "MATCH_ODDS", "OVER_UNDER_2_5").
        league_id: Canonical league ID.
        season: Season string (e.g. "2025/26").
        home_team_id: Canonical home team ID.
        away_team_id: Canonical away team ID.
        selection: Selection name (e.g. "HOME", "AWAY", "DRAW", "OVER_2_5").
        sport: Sport name (default "FOOTBALL").
        point: Handicap/total points value (e.g. 2.5 for over/under).

    Returns:
        Full canonical instrument ID.
    """
    venue = _slug(bookmaker_key)
    market = _slug(market_type)
    sel = _slug(selection)

    # Append point to market type for spreads/totals (e.g. OVER_UNDER_2_5)
    if point is not None:
        market = f"{market}_{_handicap_str(point)}"

    return f"{sport}:{venue}:{market}:{league_id}:{season}:{home_team_id}-{away_team_id}::{sel}"


# ---------------------------------------------------------------------------
# Market type mapping (Odds API key → canonical SCREAMING_SNAKE_CASE)
# ---------------------------------------------------------------------------

ODDS_API_MARKET_TO_CANONICAL: dict[str, str] = {
    "h2h": "MATCH_ODDS",
    "h2h_lay": "MATCH_ODDS_LAY",
    "spreads": "ASIAN_HANDICAP",
    "totals": "OVER_UNDER",
    "btts": "BOTH_TEAMS_TO_SCORE",
    "draw_no_bet": "DRAW_NO_BET",
    "double_chance": "DOUBLE_CHANCE",
    "correct_score": "CORRECT_SCORE",
    "outrights": "OUTRIGHT",
    "alternate_totals": "ALT_TOTAL_GOALS",
    "alternate_spreads": "ALT_ASIAN_HANDICAP",
}

ODDS_API_OUTCOME_TO_CANONICAL: dict[str, str] = {
    "Home": "HOME",
    "Away": "AWAY",
    "Draw": "DRAW",
    "Over": "OVER",
    "Under": "UNDER",
    "Yes": "YES",
    "No": "NO",
}


# ---------------------------------------------------------------------------
# Polymarket market type → canonical SCREAMING_SNAKE_CASE
# ---------------------------------------------------------------------------

POLYMARKET_MARKET_TO_CANONICAL: dict[str, str] = {
    "moneyline": "MATCH_ODDS",
    "spreads": "ASIAN_HANDICAP",
    "totals": "OVER_UNDER",
    "btts": "BOTH_TEAMS_TO_SCORE",
}


def build_prediction_instrument_id(
    venue: str,
    market_type: str,
    league_id: str,
    season: str,
    home_team_id: str,
    away_team_id: str,
    selection: str,
    point: float | None = None,
) -> str:
    """Build canonical instrument ID for a prediction market sports position.

    Uses the SAME format as ``build_instrument_id()`` so that:
    - ``FOOTBALL:POLYMARKET:MATCH_ODDS:EPL:2025-26:ARSENAL-CHELSEA::HOME``
    - ``FOOTBALL:BETFAIR_EX_UK:MATCH_ODDS:EPL:2025-26:ARSENAL-CHELSEA::HOME``
    share the same fixture part and differ only in venue.

    Arb detection = GROUP BY everything except venue, compare prices.
    """
    return build_instrument_id(
        bookmaker_key=venue,
        market_type=market_type,
        league_id=league_id,
        season=season,
        home_team_id=home_team_id,
        away_team_id=away_team_id,
        selection=selection,
        sport="FOOTBALL",
        point=point,
    )


def build_crypto_prediction_id(
    venue: str,
    asset: str,
    timeframe: str,
    window_end: str,
) -> str:
    """Build canonical instrument ID for a crypto up/down prediction market.

    Format: PREDICTION:{VENUE}:UP_DOWN:{ASSET}:{TIMEFRAME}:{WINDOW_END}
    Example: PREDICTION:POLYMARKET:UP_DOWN:BTC:5M:1774230900
    """
    return f"PREDICTION:{_slug(venue)}:UP_DOWN:{_slug(asset)}:{_slug(timeframe)}:{window_end}"


def build_macro_prediction_id(
    venue: str,
    index: str,
    timeframe: str,
    date: str,
) -> str:
    """Build canonical instrument ID for a macro/equity up/down prediction market.

    Format: PREDICTION:{VENUE}:UP_DOWN:{INDEX}:{TIMEFRAME}:{DATE}
    Example: PREDICTION:POLYMARKET:UP_DOWN:SPX:1D:20260325
    """
    date_digits = re.sub(r"[^0-9]", "", date)[:8]
    return f"PREDICTION:{_slug(venue)}:UP_DOWN:{_slug(index)}:{_slug(timeframe)}:{date_digits}"
