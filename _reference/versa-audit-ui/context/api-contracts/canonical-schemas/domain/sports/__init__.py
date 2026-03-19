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
from .league_classification_data import DEFAULT_CLASSIFICATION_REGISTRY as DEFAULT_CLASSIFICATION_REGISTRY
from .league_classification_data import LEAGUE_CLASSIFICATION_DATA as LEAGUE_CLASSIFICATION_DATA
from .league_data import LEAGUE_REGISTRY as LEAGUE_REGISTRY
from .league_data import get_league as get_league
from .league_data import get_league_by_api_football_id as get_league_by_api_football_id
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
from .odds import CanonicalBookmakerMarket as CanonicalBookmakerMarket
from .odds import MarketStatus as MarketStatus
from .odds import OddsType as OddsType
from .odds import OutcomeType as OutcomeType
from .odds_api_mapping import ODDS_API_KEY_TO_VENUE as ODDS_API_KEY_TO_VENUE
from .odds_api_mapping import ODDS_API_KEY_TO_VENUE_CATEGORY as ODDS_API_KEY_TO_VENUE_CATEGORY
from .team_mapping_data_bundesliga import BUNDESLIGA_TEAM_MAPPINGS as BUNDESLIGA_TEAM_MAPPINGS
from .team_mapping_data_epl import EPL_TEAM_MAPPINGS as EPL_TEAM_MAPPINGS
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


class OddsFormat(StrEnum):
    DECIMAL = "decimal"
    AMERICAN = "american"
    FRACTIONAL = "fractional"


class CanonicalOdds(CanonicalBase):
    """Normalized odds from any bookmaker/exchange."""

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
    """Normalised venue/stadium across all data sources."""

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
    """Normalised referee across all data sources."""

    model_config = ConfigDict(frozen=True)

    referee_id: str
    name: str
    nationality: str | None = None

    @classmethod
    def from_raw(cls, data: dict[str, str | int | float | bool | None]) -> Self:
        return cls.model_validate(data)


class CanonicalPlayer(BaseModel):
    """Normalised player across all data sources."""

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
    """Normalised team across all data sources."""

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
    """Normalised league/competition across all data sources."""

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
    """Normalised fixture/match across all data sources."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
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
