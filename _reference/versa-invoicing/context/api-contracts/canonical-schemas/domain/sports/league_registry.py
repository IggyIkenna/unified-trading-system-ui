"""League registry — canonical types and classification data for sports leagues.

Provides:
- ``LeagueDefinition``               — frozen dataclass for a sports league
- ``LeagueClassificationType``        — StrEnum (Prediction / Features / Reference)
- ``LeagueClassification``            — Pydantic frozen model (API-Football classification)
- ``LeagueClassificationRegistry``    — registry with query helpers
- Helper frozensets: ``PRED_FULL``, ``PRED_NO_UNDERSTAT``, etc.
- Country / season helpers: ``COUNTRY_MAP``, ``SEASON_BY_COUNTRY``

Ported from ``instruments-service/instruments_service/sports/`` into UAC so all
downstream consumers share a single SSOT for sports reference types.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# LeagueDefinition — frozen dataclass used by the LEAGUE_REGISTRY
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class LeagueDefinition:
    """Canonical definition of a sports league.

    Attributes:
        league_id: Unique string identifier (e.g. ``EPL``, ``BUN``, ``NBA``).
        display_name: Human-readable name.
        sport: Sport type (``FOOTBALL``, ``BASKETBALL``, ``TENNIS``, etc.).
        country: ISO 3166-1 alpha-2 code or ``INTL`` for international.
        season_months: ``(start_month, end_month)`` — 1-indexed calendar months.
        has_playoffs: Whether the league has a playoff/knockout phase.
        data_sources: Which data APIs cover this league.
        api_football_id: API-Football numeric league ID, or ``None`` for
            non-football or unmapped leagues.
        tier: 1 = top division, 2 = second tier, etc. 0 = cup/non-football.
        classification: ``Prediction``, ``Features``, ``Reference``, or ``Other``.
    """

    league_id: str
    display_name: str
    sport: str
    country: str
    season_months: tuple[int, int]
    has_playoffs: bool
    data_sources: frozenset[str]
    api_football_id: int | None
    tier: int
    classification: str


# ---------------------------------------------------------------------------
# Data-source frozenset presets (convenience builders for league data modules)
# ---------------------------------------------------------------------------


def _sources(*names: str) -> frozenset[str]:
    """Build a frozenset of data-source names."""
    return frozenset(names)


# Prediction leagues with all 7 sources
PRED_FULL: frozenset[str] = _sources(
    "api_football",
    "soccerfootball_info",
    "footystats",
    "transfermarkt",
    "understat",
    "odds_api",
    "open_meteo",
)

# Prediction leagues — all sources except Understat
PRED_NO_UNDERSTAT: frozenset[str] = _sources(
    "api_football",
    "soccerfootball_info",
    "footystats",
    "transfermarkt",
    "odds_api",
    "open_meteo",
)

# Prediction leagues — no FootyStats (subscription limit)
PRED_NO_FOOTYSTATS: frozenset[str] = _sources(
    "api_football",
    "soccerfootball_info",
    "transfermarkt",
    "odds_api",
    "open_meteo",
)

# Features leagues — API-Football + FootyStats + Transfermarkt
FEAT_STANDARD: frozenset[str] = _sources(
    "api_football",
    "footystats",
    "transfermarkt",
)

# Features leagues — no FootyStats
FEAT_NO_FOOTYSTATS: frozenset[str] = _sources(
    "api_football",
    "transfermarkt",
)

# Reference / cup leagues — API-Football only
REF_API_ONLY: frozenset[str] = _sources("api_football")

# Non-football leagues — no football-specific sources
NO_FOOTBALL_SOURCES: frozenset[str] = frozenset()


# ---------------------------------------------------------------------------
# Country helpers — source country names → ISO alpha-2
# ---------------------------------------------------------------------------

COUNTRY_MAP: dict[str, str] = {
    "England": "GB",
    "Spain": "ES",
    "Germany": "DE",
    "Italy": "IT",
    "France": "FR",
    "Netherlands": "NL",
    "Portugal": "PT",
    "Belgium": "BE",
    "Turkey": "TR",
    "Greece": "GR",
    "Scotland": "GB",
    "Austria": "AT",
    "Switzerland": "CH",
    "Denmark": "DK",
    "Sweden": "SE",
    "Norway": "NO",
    "Poland": "PL",
    "Argentina": "AR",
    "Brazil": "BR",
    "Chile": "CL",
    "USA": "US",
    "Mexico": "MX",
    "Japan": "JP",
    "South Korea": "KR",
    "Australia": "AU",
    "Multi": "INTL",
}

# Season month defaults by ISO country code
# European leagues: August-May
_EURO: tuple[int, int] = (8, 5)
# South American / MLS / calendar year: February-November
_CAL: tuple[int, int] = (2, 11)
# Japanese / Korean / Scandinavian: March-November
_SPRING: tuple[int, int] = (3, 11)
# Australian A-League: October-May
_AUS: tuple[int, int] = (10, 5)

SEASON_BY_COUNTRY: dict[str, tuple[int, int]] = {
    "GB": _EURO,
    "ES": _EURO,
    "DE": _EURO,
    "IT": _EURO,
    "FR": _EURO,
    "NL": _EURO,
    "PT": _EURO,
    "BE": _EURO,
    "TR": _EURO,
    "GR": _EURO,
    "AT": _EURO,
    "CH": _EURO,
    "DK": _EURO,
    "PL": _EURO,
    "AR": _CAL,
    "BR": (4, 12),
    "CL": _CAL,
    "US": _CAL,
    "MX": _EURO,
    "JP": _SPRING,
    "KR": _SPRING,
    "AU": _AUS,
    "SE": _SPRING,
    "NO": _SPRING,
    "INTL": (9, 6),
}


# ---------------------------------------------------------------------------
# LeagueClassificationType — StrEnum for classification labels
# ---------------------------------------------------------------------------


class LeagueClassificationType(StrEnum):
    """Classification label for a football league."""

    PREDICTION = "Prediction"
    FEATURES = "Features"
    REFERENCE = "Reference"


# ---------------------------------------------------------------------------
# LeagueClassification — Pydantic model (API-Football classification entry)
# ---------------------------------------------------------------------------


class LeagueClassification(BaseModel):
    """Canonical classification entry for a football league.

    Migrated from the old ``LEAGUE_CLASSIFICATION`` dict in
    ``sports-betting-services-previous``.

    Attributes:
        league_id: API-Football numeric league ID.
        name: League display name (from ``api_football_league_name``).
        country: Country or region (e.g. ``England``, ``Spain``).
        tier: League tier (1 = top division, 2 = second, 3 = third, etc.).
        classification: ``Prediction``, ``Reference``, or ``Features``.
        odds_api_name: The Odds API league key, or ``None`` if not available.
        data_sources: Map of data provider name to enabled flag.
    """

    league_id: int = Field(description="API-Football numeric league ID")
    name: str = Field(description="League display name")
    country: str = Field(description="Country or region")
    tier: int = Field(ge=1, description="League tier (1=top, 2=second, ...)")
    classification: LeagueClassificationType = Field(description="Prediction / Reference / Features")
    odds_api_name: str | None = Field(default=None, description="The Odds API league key")
    data_sources: dict[str, bool] = Field(
        default_factory=dict,
        description="Data provider name -> enabled flag",
    )

    model_config = {"frozen": True}


# ---------------------------------------------------------------------------
# LeagueClassificationRegistry — dict-backed registry with query helpers
# ---------------------------------------------------------------------------


class LeagueClassificationRegistry:
    """Registry of league classifications with query helpers.

    Loads from a Python dict mapping ``league_id (int) -> LeagueClassification``.
    """

    def __init__(self, data: dict[int, LeagueClassification]) -> None:
        self._leagues: dict[int, LeagueClassification] = dict(data)

    @classmethod
    def from_raw_dict(
        cls,
        raw: dict[int, dict[str, str | int | bool | dict[str, bool] | None]],
    ) -> LeagueClassificationRegistry:
        """Build registry from a raw dict matching the old config format.

        Each value is expected to have keys: ``country_region``,
        ``api_football_id``, ``api_football_league_name``, ``odds_api_league_name``,
        ``classification``, ``tier``, ``data_sources``.
        """
        leagues: dict[int, LeagueClassification] = {}
        for league_id, entry in raw.items():
            country_val: str = str(entry["country_region"])
            name_val: str = str(entry["api_football_league_name"])
            tier_val = entry.get("tier", 1)
            classification_val = entry.get("classification", "Prediction")
            odds_api_val = entry.get("odds_api_league_name")
            raw_data_sources = entry.get("data_sources")
            data_sources_val: dict[str, bool] = (
                {k: bool(v) for k, v in raw_data_sources.items()} if isinstance(raw_data_sources, dict) else {}
            )
            leagues[league_id] = LeagueClassification(
                league_id=league_id,
                name=name_val,
                country=country_val,
                tier=int(str(tier_val)),
                classification=LeagueClassificationType(str(classification_val)),
                odds_api_name=str(odds_api_val) if odds_api_val is not None else None,
                data_sources=data_sources_val,
            )
        return cls(leagues)

    def get_league(self, league_id: int) -> LeagueClassification | None:
        """Look up a league by its API-Football numeric ID."""
        return self._leagues.get(league_id)

    def get_prediction_leagues(self) -> list[LeagueClassification]:
        """Return tier 1 and 2 Prediction leagues."""
        return [
            league
            for league in self._leagues.values()
            if league.classification == LeagueClassificationType.PREDICTION and league.tier <= 2
        ]

    def get_leagues_by_tier(self, tier: int) -> list[LeagueClassification]:
        """Return all leagues at a given tier."""
        return [league for league in self._leagues.values() if league.tier == tier]

    def get_data_sources(self, league_id: int) -> dict[str, bool]:
        """Return data-source flags for a league, or empty dict if unknown."""
        league = self._leagues.get(league_id)
        if league is None:
            return {}
        return dict(league.data_sources)

    def get_all_leagues(self) -> list[LeagueClassification]:
        """Return all leagues in the registry."""
        return list(self._leagues.values())

    @property
    def league_count(self) -> int:
        """Number of leagues in the registry."""
        return len(self._leagues)


__all__ = [
    "COUNTRY_MAP",
    "FEAT_NO_FOOTYSTATS",
    "FEAT_STANDARD",
    "NO_FOOTBALL_SOURCES",
    "PRED_FULL",
    "PRED_NO_FOOTYSTATS",
    "PRED_NO_UNDERSTAT",
    "REF_API_ONLY",
    "SEASON_BY_COUNTRY",
    "LeagueClassification",
    "LeagueClassificationRegistry",
    "LeagueClassificationType",
    "LeagueDefinition",
]
