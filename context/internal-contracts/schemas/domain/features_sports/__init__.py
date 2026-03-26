"""Domain schemas for features-sports-service.

Canonical Pydantic models for sports ML feature outputs consumed by downstream
services (strategy-service, ML training/inference services).

Features computed by features-sports-service calculators:
    ht_features: Half-time state, performance (shots, possession, xG), delta, momentum,
                 implied probabilities from HT odds.
    season_context: Round name, matchday, competition phase, promotion/relegation stakes.
    venue_context: Home advantage, travel distance, altitude, capacity, surface type.
    referee_features: Avg cards/fouls/penalties, card rate band, home bias.
    ml_predictions: Pre-match outcome probabilities from trained models
                    (pred_home_win, pred_draw, pred_away_win, goals, over_2.5).

The storage-layer TypedDicts (LeagueRecord, TeamRecord, FixtureRecord, etc.) are in
``unified_api_contracts.internal.sports`` — those are flat GCS parquet shapes.

These Pydantic models are the runtime feature contracts passed between services via
PubSub events and ML inference APIs.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class HalfTimeFeatureRecord(BaseModel):
    """Feature record for half-time performance and odds-derived features.

    Produced by features-sports-service ht_features calculator.
    Consumed by ML inference service for in-play / second-half models.
    """

    fixture_id: str = Field(description="Canonical fixture identifier")
    timestamp: datetime = Field(description="UTC timestamp when features were computed")
    feature_group: Literal["ht_features"] = Field(default="ht_features")

    # HT goal / win / comeback history
    home_ht_goals_avg: float | None = Field(
        default=None, description="Home team historical avg first-half goals"
    )
    home_ht_win_rate: float | None = Field(
        default=None, description="Home team historical HT win rate [0.0, 1.0]"
    )
    home_ht_comeback_rate: float | None = Field(
        default=None, description="Home team historical second-half comeback rate [0.0, 1.0]"
    )

    # Second-half predictions
    pred_2h_home_goals: float | None = Field(
        default=None, description="Predicted second-half home goals"
    )
    pred_2h_away_goals: float | None = Field(
        default=None, description="Predicted second-half away goals"
    )
    pred_comeback_probability: float | None = Field(
        default=None, description="Predicted comeback probability for trailing team [0.0, 1.0]"
    )

    # HT state
    ht_state: str | None = Field(
        default=None,
        description="HT state label: LEAD_HOME | LEAD_AWAY | DRAW",
    )

    # HT performance metrics
    ht_performance_shots_home: float | None = Field(
        default=None, description="Home shots in first half"
    )
    ht_performance_shots_away: float | None = Field(
        default=None, description="Away shots in first half"
    )
    ht_performance_possession_home: float | None = Field(
        default=None, description="Home possession percentage in first half [0.0, 100.0]"
    )
    ht_performance_possession_away: float | None = Field(
        default=None, description="Away possession percentage in first half [0.0, 100.0]"
    )
    ht_performance_xg_home: float | None = Field(
        default=None, description="Home expected goals in first half"
    )
    ht_performance_xg_away: float | None = Field(
        default=None, description="Away expected goals in first half"
    )

    # HT delta features
    ht_delta_goals: float | None = Field(
        default=None, description="Goal delta (home - away) at half time"
    )
    ht_delta_possession: float | None = Field(
        default=None, description="Possession delta (home - away) at half time"
    )
    ht_delta_xg: float | None = Field(
        default=None, description="xG delta (home - away) at half time"
    )

    # HT momentum
    ht_momentum_home: float | None = Field(
        default=None, description="Home momentum score (goals + shots + xG weighted)"
    )
    ht_momentum_away: float | None = Field(
        default=None, description="Away momentum score (negative of home momentum)"
    )

    # Odds-derived implied probabilities
    ht_odds_home_implied: float | None = Field(
        default=None, description="Implied HT home win probability from first-half odds [0.0, 1.0]"
    )
    ht_odds_draw_implied: float | None = Field(
        default=None, description="Implied HT draw probability from first-half odds [0.0, 1.0]"
    )
    ht_odds_away_implied: float | None = Field(
        default=None, description="Implied HT away win probability from first-half odds [0.0, 1.0]"
    )


class SeasonContextFeatureRecord(BaseModel):
    """Feature record for season/competition context.

    Produced by features-sports-service season_context calculator.
    Consumed by pre-match ML models.
    """

    fixture_id: str = Field(description="Canonical fixture identifier")
    timestamp: datetime = Field(description="UTC timestamp when features were computed")
    feature_group: Literal["season_context"] = Field(default="season_context")

    round_name: str | None = Field(
        default=None, description="Round name (e.g. 'Regular Season - 10')"
    )
    matchday: int | None = Field(default=None, description="Matchday number in competition")
    competition_phase: str | None = Field(
        default=None,
        description="Phase label: group_stage | knockout | final | regular | playoff",
    )
    is_promotion_relegation: bool | None = Field(
        default=None,
        description="True if either team is in promotion or relegation zone",
    )
    games_remaining: int | None = Field(
        default=None, description="Games remaining in the season for the competing teams"
    )
    points_at_stake: int | None = Field(
        default=None, description="Points still available (3 per win) in remaining fixtures"
    )


class VenueContextFeatureRecord(BaseModel):
    """Feature record for venue and travel context.

    Produced by features-sports-service venue_context calculator.
    Encodes structural home advantage and physical travel disadvantage.
    """

    fixture_id: str = Field(description="Canonical fixture identifier")
    timestamp: datetime = Field(description="UTC timestamp when features were computed")
    feature_group: Literal["venue_context"] = Field(default="venue_context")

    home_advantage_pct: float | None = Field(
        default=None,
        description="Historical home win rate for the home team at this venue [0.0, 1.0]",
    )
    travel_distance_km: float | None = Field(
        default=None, description="Estimated travel distance for away team in kilometres"
    )
    altitude_m: float | None = Field(
        default=None, description="Stadium altitude above sea level in metres"
    )
    stadium_capacity: int | None = Field(
        default=None, description="Stadium capacity (proxy for crowd pressure)"
    )
    surface_type: str | None = Field(
        default=None, description="Pitch surface: grass | artificial | hybrid"
    )
    is_neutral_venue: bool | None = Field(
        default=None, description="True if match is played at a neutral venue"
    )


class RefereeFeatureRecord(BaseModel):
    """Feature record for referee tendency features.

    Produced by features-sports-service referee_features calculator.
    Encodes officiating patterns that affect match dynamics.
    """

    fixture_id: str = Field(description="Canonical fixture identifier")
    timestamp: datetime = Field(description="UTC timestamp when features were computed")
    feature_group: Literal["referee_features"] = Field(default="referee_features")

    referee_avg_cards: float | None = Field(
        default=None, description="Referee historical average total cards per match"
    )
    referee_avg_fouls: float | None = Field(
        default=None, description="Referee historical average total fouls per match"
    )
    referee_avg_penalties: float | None = Field(
        default=None, description="Referee historical average penalties awarded per match"
    )
    referee_card_rate_band: str | None = Field(
        default=None,
        description="Card rate band: low | medium | high (based on historical percentile)",
    )
    referee_home_bias: float | None = Field(
        default=None,
        description=(
            "Referee home advantage bias: fraction of decisions favouring home team "
            "relative to expected neutral rate. Positive = home-favourable."
        ),
    )


class SportsMLPredictionRecord(BaseModel):
    """Pre-match ML prediction features for a fixture.

    Output from ml-inference-service consumed by features-sports-service
    and strategy-service. Captures model confidence and outcome probabilities
    derived from trained pre-match models.
    """

    fixture_id: str = Field(description="Canonical fixture identifier")
    timestamp: datetime = Field(description="UTC timestamp of prediction")
    feature_group: Literal["ml_predictions"] = Field(default="ml_predictions")
    model_version: str | None = Field(default=None, description="Trained model version identifier")
    feature_vector_hash: str | None = Field(
        default=None, description="Hash of the feature vector used for this prediction"
    )

    # Outcome probabilities
    pred_home_win: float | None = Field(
        default=None, description="Predicted home win probability [0.0, 1.0]"
    )
    pred_draw: float | None = Field(
        default=None, description="Predicted draw probability [0.0, 1.0]"
    )
    pred_away_win: float | None = Field(
        default=None, description="Predicted away win probability [0.0, 1.0]"
    )

    # Goals predictions
    pred_home_goals: float | None = Field(
        default=None, description="Predicted home goals (expected value)"
    )
    pred_away_goals: float | None = Field(
        default=None, description="Predicted away goals (expected value)"
    )
    pred_over_25: float | None = Field(
        default=None, description="Predicted probability of over 2.5 total goals [0.0, 1.0]"
    )

    # Model confidence
    model_confidence: float | None = Field(
        default=None,
        description=(
            "Overall model confidence score [0.0, 1.0]. "
            "Low confidence may indicate sparse historical data for these teams."
        ),
    )


__all__ = [
    "HalfTimeFeatureRecord",
    "RefereeFeatureRecord",
    "SeasonContextFeatureRecord",
    "SportsMLPredictionRecord",
    "VenueContextFeatureRecord",
]
