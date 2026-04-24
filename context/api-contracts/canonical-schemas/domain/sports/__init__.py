"""Canonical sports schemas — execution types and reference data.

Execution-style schemas (CanonicalOdds, CanonicalBetMarket, etc.) use
CanonicalBase with extra="forbid".

Reference types (CanonicalFixture, BookmakerInfo, mappings, etc.) use
frozen BaseModel — moved here from external/sports/canonical/.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Literal, Self

from pydantic import AwareDatetime, BaseModel, ConfigDict

from unified_api_contracts.external.soccer_football_info.team_mappings import (
    resolve_sfi_team as resolve_sfi_team,
)

from .._base import CanonicalBase
from .arb import SportsArbLeg as SportsArbLeg
from .arb import SportsArbPosition as SportsArbPosition
from .betting import BetExecution as BetExecution
from .betting import BetOrder as BetOrder
from .betting import BetSide as BetSide
from .betting import BetStatus as BetStatus
from .betting import BettingSignal as BettingSignal
from .betting import CLVRecord as CLVRecord
from .betting import CommissionModel as CommissionModel
from .betting import SignalSource as SignalSource
from .canonical_ids import (
    ODDS_API_MARKET_TO_CANONICAL as ODDS_API_MARKET_TO_CANONICAL,
)
from .canonical_ids import (
    ODDS_API_OUTCOME_TO_CANONICAL as ODDS_API_OUTCOME_TO_CANONICAL,
)
from .canonical_ids import build_crypto_prediction_id as build_crypto_prediction_id
from .canonical_ids import build_fixture_id as build_fixture_id
from .canonical_ids import build_instrument_id as build_instrument_id
from .canonical_ids import build_league_id as build_league_id
from .canonical_ids import build_macro_prediction_id as build_macro_prediction_id
from .canonical_ids import build_player_id as build_player_id
from .canonical_ids import build_prediction_instrument_id as build_prediction_instrument_id
from .canonical_ids import build_referee_id as build_referee_id
from .canonical_ids import build_season_id as build_season_id
from .canonical_ids import build_team_id as build_team_id
from .canonical_ids import build_venue_id as build_venue_id
from .injury import AbsenceType as AbsenceType
from .injury import classify_absence as classify_absence
from .league_classification_data import DEFAULT_CLASSIFICATION_REGISTRY as DEFAULT_CLASSIFICATION_REGISTRY
from .league_classification_data import LEAGUE_CLASSIFICATION_DATA as LEAGUE_CLASSIFICATION_DATA
from .league_data import LEAGUE_EXPECTED_TEAM_COUNTS as LEAGUE_EXPECTED_TEAM_COUNTS
from .league_data import LEAGUE_REGISTRY as LEAGUE_REGISTRY
from .league_data import get_all_prediction_league_ids as get_all_prediction_league_ids
from .league_data import get_expected_leagues_for_source as get_expected_leagues_for_source
from .league_data import get_expected_team_count_for_league as get_expected_team_count_for_league
from .league_data import get_league as get_league
from .league_data import get_league_by_api_football_id as get_league_by_api_football_id
from .league_data import get_league_fixture_calendar as get_league_fixture_calendar
from .league_data import get_leagues_by_classification as get_leagues_by_classification
from .league_data import get_leagues_by_country as get_leagues_by_country
from .league_data import get_leagues_for_sport as get_leagues_for_sport
from .league_data import get_prediction_leagues as get_prediction_leagues
from .league_registry import COUNTRY_MAP as COUNTRY_MAP
from .league_registry import FEAT_NO_FOOTYSTATS as FEAT_NO_FOOTYSTATS
from .league_registry import FEAT_STANDARD as FEAT_STANDARD
from .league_registry import NO_FOOTBALL_SOURCES as NO_FOOTBALL_SOURCES
from .league_registry import PRED_FULL as PRED_FULL
from .league_registry import PRED_NO_FOOTYSTATS as PRED_NO_FOOTYSTATS
from .league_registry import PRED_NO_UNDERSTAT as PRED_NO_UNDERSTAT
from .league_registry import REF_API_ONLY as REF_API_ONLY
from .league_registry import SEASON_BY_COUNTRY as SEASON_BY_COUNTRY
from .league_registry import LeagueClassification as LeagueClassification
from .league_registry import LeagueClassificationRegistry as LeagueClassificationRegistry
from .league_registry import LeagueClassificationType as LeagueClassificationType
from .league_registry import LeagueDefinition as LeagueDefinition
from .live import LiveMatchState as LiveMatchState
from .live import LiveOddsUpdate as LiveOddsUpdate
from .live import MatchPeriod as MatchPeriod
from .live import ScraperVersionMeta as ScraperVersionMeta
from .mapping_resolver import clear_mapping_cache as clear_mapping_cache
from .mapping_resolver import resolve_fixture_mapping as resolve_fixture_mapping
from .mapping_resolver import resolve_league_mapping as resolve_league_mapping
from .mapping_resolver import resolve_team_mapping as resolve_team_mapping
from .odds import CanonicalBookmakerMarket as CanonicalBookmakerMarket
from .odds import MarketStatus as MarketStatus
from .odds import OddsType as OddsType
from .odds import OutcomeType as OutcomeType
from .odds_api_mapping import ODDS_API_KEY_TO_VENUE as ODDS_API_KEY_TO_VENUE
from .odds_api_mapping import ODDS_API_KEY_TO_VENUE_CATEGORY as ODDS_API_KEY_TO_VENUE_CATEGORY
from .progressive import CanonicalProgressiveOdds as CanonicalProgressiveOdds
from .progressive import CanonicalProgressiveStats as CanonicalProgressiveStats
from .provider_league_ids import FOOTYSTATS_HISTORICAL_SEASON_IDS as FOOTYSTATS_HISTORICAL_SEASON_IDS
from .provider_league_ids import FOOTYSTATS_SEASON_IDS as FOOTYSTATS_SEASON_IDS
from .provider_league_ids import SOCCER_FOOTBALL_INFO_IDS as SOCCER_FOOTBALL_INFO_IDS
from .provider_league_ids import SPORTS_ENTITY_LEAGUE_COVERAGE as SPORTS_ENTITY_LEAGUE_COVERAGE
from .provider_league_ids import SPORTS_ENTITY_START_DATES as SPORTS_ENTITY_START_DATES
from .provider_league_ids import TRANSFERMARKT_IDS as TRANSFERMARKT_IDS
from .provider_league_ids import UNDERSTAT_NAMES as UNDERSTAT_NAMES
from .provider_league_ids import get_entity_league_coverage as get_entity_league_coverage
from .provider_league_ids import get_provider_league_id as get_provider_league_id
from .provider_league_ids import get_sports_entity_start_date as get_sports_entity_start_date
from .round_names import ROUND_NAMES as ROUND_NAMES
from .round_names import ROUND_PREFIXES as ROUND_PREFIXES
from .round_names import RoundMatch as RoundMatch
from .round_names import is_known_round as is_known_round
from .round_names import resolve_round_name as resolve_round_name
from .season_dates import SeasonBoundary as SeasonBoundary
from .season_dates import get_leagues_needing_refresh as get_leagues_needing_refresh
from .season_dates import get_reference_refresh_dates as get_reference_refresh_dates
from .season_dates import get_season_boundary as get_season_boundary
from .season_dates import get_season_end as get_season_end
from .season_dates import get_season_start as get_season_start
from .season_dates import get_transfer_window_country as get_transfer_window_country
from .season_dates import is_any_league_refresh_date as is_any_league_refresh_date
from .season_dates import is_reference_refresh_date as is_reference_refresh_date
from .team_mapping_data import get_all_teams as get_all_teams
from .team_mapping_data import get_team_by_af_id as get_team_by_af_id
from .team_mapping_data import get_team_provider_ids as get_team_provider_ids
from .team_mapping_data import resolve_footystats_team as resolve_footystats_team
from .team_mapping_data import resolve_understat_team as resolve_understat_team
from .team_mapping_data_bundesliga import BUNDESLIGA_TEAM_MAPPINGS as BUNDESLIGA_TEAM_MAPPINGS
from .team_mapping_data_epl import EPL_TEAM_MAPPINGS as EPL_TEAM_MAPPINGS
from .transfer_windows import TransferWindowPeriod as TransferWindowPeriod
from .transfer_windows import days_since_window_close as days_since_window_close
from .transfer_windows import days_until_window_open as days_until_window_open
from .transfer_windows import get_active_window as get_active_window
from .transfer_windows import get_transfer_windows_for_year as get_transfer_windows_for_year
from .transfer_windows import get_windows_for_league as get_windows_for_league
from .transfer_windows import is_transfer_data_expected as is_transfer_data_expected
from .transfer_windows import is_transfer_window_open as is_transfer_window_open
from .transfer_windows import most_recent_window_close as most_recent_window_close
from .transfer_windows import next_window_open as next_window_open
from .transfer_windows import window_closed_within as window_closed_within
from .venue_execution import (
    AccountVerificationLevel as AccountVerificationLevel,
)
from .venue_execution import (
    AntiDetectionLevel as AntiDetectionLevel,
)
from .venue_execution import (
    CredentialType as CredentialType,
)
from .venue_execution import (
    ExecutionMethod as ExecutionMethod,
)
from .venue_execution import (
    VenueCategory as VenueCategory,
)
from .venue_execution import (
    VenueExecutionProfile as VenueExecutionProfile,
)
from .venue_execution_registry import VENUE_EXECUTION_REGISTRY as VENUE_EXECUTION_REGISTRY


class BookmakerCategory(StrEnum):
    """How we connect to the bookmaker."""

    EXCHANGE = "exchange"
    BOOKMAKER_API = "bookmaker_api"
    AGGREGATOR = "aggregator"
    STREAMING_API = "streaming_api"
    SCRAPER = "scraper"


class BookmakerInfo(BaseModel):
    """Metadata for a single bookmaker or exchange."""

    model_config = ConfigDict(frozen=True)

    key: str
    display_name: str
    category: BookmakerCategory
    currency: str
    supports_live_betting: bool
    supports_cash_out: bool
    min_bet_gbp: Decimal
    max_bet_gbp: Decimal | None = None
    api_docs_url: str | None = None
    scrape_url: str | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


class BookmakerTier(StrEnum):
    """ML-oriented bookmaker tier for feature engineering.

    SHARP: Low-margin bookmakers that accept sharp bettors (Pinnacle, 3et, etc.).
    EXCHANGE: Peer-to-peer betting exchanges (Betfair, Smarkets, etc.).
    SOFT: High-margin retail bookmakers (bet365, William Hill, etc.).
    """

    SHARP = "sharp"
    EXCHANGE = "exchange"
    SOFT = "soft"


# Bookmaker keys classified as sharp (low-vig, accept sharps)
_SHARP_BOOKMAKERS: frozenset[str] = frozenset(
    {
        "pinnacle",
        "pinnaclesports",
        "3et",
        "isn",
        "cris",
        "sharpbet",
        "singbet",
        "asianodds",
        "sbobet",
        "ps3838",
    }
)

# Bookmaker keys classified as exchange
_EXCHANGE_BOOKMAKERS: frozenset[str] = frozenset(
    {
        "betfair",
        "betfair_ex_uk",
        "betfair_ex_eu",
        "betfair_ex_au",
        "smarkets",
        "matchbook",
        "betdaq",
        "polymarket",
    }
)


def classify_bookmaker(bookmaker_key: str) -> BookmakerTier:
    """Classify a bookmaker key into a tier for ML features.

    Args:
        bookmaker_key: Lowercase bookmaker identifier (e.g. "pinnacle", "bet365").

    Returns:
        BookmakerTier classification.
    """
    key = bookmaker_key.lower().replace(" ", "").replace("-", "")
    if key in _SHARP_BOOKMAKERS:
        return BookmakerTier.SHARP
    if key in _EXCHANGE_BOOKMAKERS:
        return BookmakerTier.EXCHANGE
    return BookmakerTier.SOFT


class OddsFormat(StrEnum):
    DECIMAL = "decimal"
    AMERICAN = "american"
    FRACTIONAL = "fractional"


class CanonicalOdds(CanonicalBase):
    """Normalized odds from any bookmaker/exchange.

    Canonical instrument ID format for odds markets:
        {fixture_id}::{market_type}::{outcome}::{bookmaker_key}
    Example: "1034567::h2h::home::betfair_ex_uk"
    """

    venue: str
    event_id: str
    market_id: str
    selection_id: str
    selection_name: str
    decimal_odds: Decimal
    timestamp: AwareDatetime
    is_back: bool = True
    available_size: Decimal | None = None
    runner_name: str | None = None
    event_name: str | None = None
    sport: str | None = None
    competition: str | None = None
    schema_version: str = "1.0"


class CanonicalBetMarket(CanonicalBase):
    """Normalized betting market metadata."""

    venue: str
    market_id: str
    event_id: str
    market_name: str
    event_name: str
    sport: str | None = None
    competition: str | None = None
    status: str | None = None
    in_play: bool | None = None
    timestamp: AwareDatetime
    close_time: AwareDatetime | None = None
    schema_version: str = "1.0"


class CanonicalBetOrder(CanonicalBase):
    """Normalized bet order/placement."""

    venue: str
    order_id: str
    market_id: str
    selection_id: str
    side: str
    price: Decimal
    size: Decimal
    status: str
    timestamp: AwareDatetime
    matched_size: Decimal | None = None
    remaining_size: Decimal | None = None
    american_odds: int | None = None
    odds_format: OddsFormat = OddsFormat.DECIMAL
    schema_version: str = "1.0"


class CanonicalComboLeg(CanonicalBase):
    """One leg of a multi-leg combo bet or options combo."""

    venue: str
    market_id: str
    selection_id: str
    side: Literal["back", "lay"]
    decimal_odds: Decimal
    american_odds: int | None = None
    stake: Decimal
    odds_format: OddsFormat = OddsFormat.DECIMAL


class CanonicalComboBet(CanonicalBase):
    """Multi-leg combo bet or options spread."""

    venue: str
    order_id: str
    legs: tuple[CanonicalComboLeg, ...]
    combined_decimal_odds: Decimal
    total_stake: Decimal
    net_premium: Decimal | None = None
    status: str
    timestamp: datetime


class CanonicalVenue(BaseModel):
    """Normalised venue/stadium across all data sources.

    Canonical venue_id format: SCREAMING_SNAKE_CASE (e.g. ANFIELD, ALLIANZ_ARENA).
    """

    model_config = ConfigDict(frozen=True)

    venue_id: str
    name: str
    city: str | None = None
    country: str | None = None
    capacity: int | None = None
    surface: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    altitude: float | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


class CanonicalReferee(BaseModel):
    """Normalised referee across all data sources.

    Canonical referee_id format: {LASTNAME}_{INITIAL} (e.g. ATKINSON_M, OLIVER_M).
    """

    model_config = ConfigDict(frozen=True)

    referee_id: str
    name: str
    nationality: str | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


class CanonicalPlayer(BaseModel):
    """Normalised player across all data sources.

    Canonical player_id format: {LASTNAME}_{INITIAL} or {LASTNAME}_{FIRSTNAME}
    (e.g. PICKFORD_J, FERNANDES_BRUNO). Diacritics stripped via NFKD normalization.
    """

    model_config = ConfigDict(frozen=True)

    player_id: str
    name: str
    first_name: str | None = None
    last_name: str | None = None
    nationality: str | None = None
    position: str | None = None
    date_of_birth: str | None = None
    height_cm: int | None = None
    weight_kg: int | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


class CanonicalTeam(BaseModel):
    """Normalised team across all data sources.

    Canonical team_id format: SCREAMING_SNAKE_CASE (e.g. MAN_CITY, TOTTENHAM, DORTMUND).
    """

    model_config = ConfigDict(frozen=True)

    team_id: str
    name: str
    short_name: str | None = None
    country: str | None = None
    founded: int | None = None
    logo_url: str | None = None
    venue: CanonicalVenue | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


class CanonicalLeague(BaseModel):
    """Normalised league/competition across all data sources.

    Canonical league_id format: {COUNTRY_CODE}_{LEAGUE_ABBR} (e.g. EPL, BUN, ENG_CHAMPIONSHIP).
    """

    model_config = ConfigDict(frozen=True)

    league_id: str
    name: str
    country: str
    league_type: str | None = None
    logo_url: str | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


class CanonicalFixture(BaseModel):
    """Normalised fixture/match across all data sources.

    Canonical fixture_id format: {api_football_fixture_id} as string (e.g. "1034567").
    Season format: {YYYY}-{YY} (e.g. "2024-25"). Hyphen, not slash — safe for GCS paths.
    """

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    source_fixture_id: str | None = None
    home_team: CanonicalTeam
    away_team: CanonicalTeam
    league: CanonicalLeague
    kickoff_utc: datetime
    venue: CanonicalVenue | None = None
    referee: CanonicalReferee | None = None
    season: str
    match_week: int | None = None
    source: str
    status: str | None = None
    home_goals: int | None = None
    away_goals: int | None = None
    home_goals_halftime: int | None = None
    away_goals_halftime: int | None = None
    home_xg: float | None = None
    away_xg: float | None = None
    home_shots_on_target: int | None = None
    away_shots_on_target: int | None = None
    home_total_shots: int | None = None
    away_total_shots: int | None = None
    home_possession: int | None = None
    away_possession: int | None = None
    home_corners: int | None = None
    away_corners: int | None = None
    home_fouls: int | None = None
    away_fouls: int | None = None
    home_yellow_cards: int | None = None
    away_yellow_cards: int | None = None
    home_red_cards: int | None = None
    away_red_cards: int | None = None
    home_shots_blocked: int | None = None
    away_shots_blocked: int | None = None
    home_offsides: int | None = None
    away_offsides: int | None = None
    home_passes_total: int | None = None
    away_passes_total: int | None = None
    home_passes_accuracy: int | None = None
    away_passes_accuracy: int | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


# ---------------------------------------------------------------------------
# Per-entity canonical schemas — validated before every GCS write
# ---------------------------------------------------------------------------


class CanonicalStanding(BaseModel):
    """League standings row — shared by API Football and SFI."""

    model_config = ConfigDict(frozen=True)

    league_id: str
    season: str | None = None
    rank: int
    team_id: str
    team_name: str
    points: int
    goals_diff: int | None = None
    group: str | None = None
    form: str | None = None
    status: str | None = None
    description: str | None = None
    played: int | None = None
    wins: int | None = None
    draws: int | None = None
    losses: int | None = None
    goals_for: int | None = None
    goals_against: int | None = None
    home_played: int | None = None
    home_wins: int | None = None
    home_draws: int | None = None
    home_losses: int | None = None
    home_goals_for: int | None = None
    home_goals_against: int | None = None
    away_played: int | None = None
    away_wins: int | None = None
    away_draws: int | None = None
    away_losses: int | None = None
    away_goals_for: int | None = None
    away_goals_against: int | None = None


class CanonicalInjury(BaseModel):
    """Player injury or suspension record."""

    model_config = ConfigDict(frozen=True)

    player_id: str
    player_name: str
    team_id: str
    team_name: str
    league_id: str | None = None
    season: int | None = None
    fixture_id: str | None = None
    injury_type: str
    reason: str | None = None
    absence_type: AbsenceType = AbsenceType.OTHER


class CanonicalFixtureStats(BaseModel):
    """Per-team aggregate stats for a single fixture."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    team_id: str
    team_name: str
    shots_on_goal: int | None = None
    shots_off_goal: int | None = None
    total_shots: int | None = None
    blocked_shots: int | None = None
    shots_inside_box: int | None = None
    shots_outside_box: int | None = None
    fouls: int | None = None
    corner_kicks: int | None = None
    offsides: int | None = None
    ball_possession: int | None = None
    yellow_cards: int | None = None
    red_cards: int | None = None
    goalkeeper_saves: int | None = None
    total_passes: int | None = None
    passes_accurate: int | None = None
    passes_pct: int | None = None
    expected_goals: float | None = None


class CanonicalFixtureEvent(BaseModel):
    """Single match event — goal, card, substitution, VAR."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    elapsed_min: int
    extra_min: int | None = None
    team_id: str
    team_name: str
    player_id: str | None = None
    player_name: str | None = None
    assist_id: str | None = None
    assist_name: str | None = None
    event_type: str
    detail: str | None = None
    comments: str | None = None


class CanonicalLineupEntry(BaseModel):
    """Single lineup entry — one per player per fixture."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    team_id: str
    team_name: str
    formation: str | None = None
    player_id: str
    player_name: str
    player_number: int | None = None
    player_position: str | None = None
    player_grid: str | None = None
    is_starter: bool
    coach_id: str | None = None
    coach_name: str | None = None


class CanonicalPlayerPerformance(BaseModel):
    """Per-player stats for a single fixture."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    team_id: str
    team_name: str
    player_id: str
    player_name: str
    minutes_played: int | None = None
    position: str | None = None
    rating: float | None = None
    captain: bool | None = None
    substitute: bool | None = None
    offsides: int | None = None
    shots_total: int | None = None
    shots_on: int | None = None
    goals_total: int | None = None
    goals_conceded: int | None = None
    assists: int | None = None
    saves: int | None = None
    passes_total: int | None = None
    passes_key: int | None = None
    passes_accuracy: int | None = None
    tackles_total: int | None = None
    blocks: int | None = None
    interceptions: int | None = None
    duels_total: int | None = None
    duels_won: int | None = None
    dribbles_attempts: int | None = None
    dribbles_success: int | None = None
    dribbles_past: int | None = None
    fouls_drawn: int | None = None
    fouls_committed: int | None = None
    yellow_cards: int | None = None
    red_cards: int | None = None
    penalty_won: int | None = None
    penalty_committed: int | None = None
    penalty_scored: int | None = None
    penalty_missed: int | None = None
    penalty_saved: int | None = None


class CanonicalPrediction(BaseModel):
    """Pre-match predictive signals — FootyStats potentials, prematch xG.

    Null-rate expectations (validated at shard write time):
      - REQUIRED (0% null): fixture_id, source, kickoff_utc, home_team, away_team,
        btts_potential, o25_potential, o35_potential, o45_potential,
        xg_prematch_home, xg_prematch_away
      - SPARSE (>80% null typical): corners_potential, corners_o85/o95/o105_potential,
        cards_potential, offsides_potential, avg_potential
      - VARIABLE: all other potentials and PPG fields
    """

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    source: str
    kickoff_utc: str
    home_team: str
    away_team: str
    # --- Core potentials (expected 0% null) ---
    btts_potential: int | None = None
    o25_potential: int | None = None
    o35_potential: int | None = None
    o45_potential: int | None = None
    xg_prematch_home: float | None = None
    xg_prematch_away: float | None = None
    # --- Extended potentials (variable null rate) ---
    btts_fhg_potential: int | None = None
    btts_2hg_potential: int | None = None
    o05_potential: int | None = None
    o15_potential: int | None = None
    u05_potential: int | None = None
    u15_potential: int | None = None
    u25_potential: int | None = None
    u35_potential: int | None = None
    u45_potential: int | None = None
    xg_prematch_total: float | None = None
    pre_match_home_ppg: float | None = None
    pre_match_away_ppg: float | None = None
    pre_match_home_overall_ppg: float | None = None
    pre_match_away_overall_ppg: float | None = None
    # --- Sparse potentials (>80% null typical from API) ---
    corners_potential: int | None = None
    corners_o85_potential: int | None = None
    corners_o95_potential: int | None = None
    corners_o105_potential: int | None = None
    cards_potential: int | None = None
    offsides_potential: int | None = None
    avg_potential: int | None = None


class CanonicalWeather(BaseModel):
    """Weather observation for a venue at match time."""

    model_config = ConfigDict(frozen=True)

    latitude: float
    longitude: float
    temperature_celsius: float
    wind_speed_ms: float | None = None
    humidity_pct: int | None = None
    precipitation_mm: float | None = None
    cloud_cover_pct: int | None = None
    condition: str | None = None
    observation_time: str
    date: str


class TeamMapping(BaseModel):
    """Maps a team identity across all data providers."""

    model_config = ConfigDict(frozen=True)

    canonical_team_id: str
    display_name: str
    api_football_id: int | None = None
    footystats_id: str | None = None
    understat_name: str | None = None
    soccer_football_id: int | None = None
    betfair_id: str | None = None
    pinnacle_id: int | None = None
    odds_api_key: str | None = None
    aliases: frozenset[str] = frozenset()


class FixtureMapping(BaseModel):
    """Maps a fixture identity across all data providers."""

    model_config = ConfigDict(frozen=True)

    canonical_fixture_id: str
    api_football_fixture_id: int | None = None
    footystats_match_id: str | None = None
    understat_match_id: int | None = None
    date: str
    home_team_id: str
    away_team_id: str


class PlayerMapping(BaseModel):
    """Maps a player identity across all data providers."""

    model_config = ConfigDict(frozen=True)

    canonical_player_id: str
    display_name: str
    api_football_player_id: int | None = None
    footystats_player_id: str | None = None
    understat_player_id: int | None = None
    soccer_football_player_id: int | None = None
