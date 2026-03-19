"""Canonical sports feature vector — ML feature schema for a single fixture."""

from __future__ import annotations

from datetime import datetime

from ._features_league_halftime_goals import (
    GoalTimingFeaturesMixin,
    HalftimeFeaturesMixin,
    LeagueFeaturesMixin,
    SeasonContextFeaturesMixin,
)
from ._features_promoted_synthetic_schedule import (
    PromotedTeamFeaturesMixin,
    ScheduleFatigueFeaturesMixin,
    SyntheticXGFeaturesMixin,
)
from ._features_team_h2h import H2HFeaturesMixin, TeamFeaturesMixin
from ._features_venue_referee_player_odds import (
    OddsFeaturesMixin,
    PlayerLineupFeaturesMixin,
    RefereeFeaturesMixin,
    VenueContextFeaturesMixin,
)
from ._features_xg_advanced_market import (
    AdvancedStatsFeaturesMixin,
    ManagerFeaturesMixin,
    MarketEfficiencyFeaturesMixin,
    TeamStyleFeaturesMixin,
    WeatherFeaturesMixin,
    XGFeaturesMixin,
)


class SportsFeatureVector(
    TeamFeaturesMixin,
    H2HFeaturesMixin,
    LeagueFeaturesMixin,
    HalftimeFeaturesMixin,
    GoalTimingFeaturesMixin,
    SeasonContextFeaturesMixin,
    VenueContextFeaturesMixin,
    RefereeFeaturesMixin,
    PlayerLineupFeaturesMixin,
    OddsFeaturesMixin,
    XGFeaturesMixin,
    AdvancedStatsFeaturesMixin,
    WeatherFeaturesMixin,
    TeamStyleFeaturesMixin,
    ManagerFeaturesMixin,
    MarketEfficiencyFeaturesMixin,
    PromotedTeamFeaturesMixin,
    SyntheticXGFeaturesMixin,
    ScheduleFatigueFeaturesMixin,
):
    """Complete ML feature vector for a single fixture."""

    fixture_id: str
    computed_at_utc: datetime
