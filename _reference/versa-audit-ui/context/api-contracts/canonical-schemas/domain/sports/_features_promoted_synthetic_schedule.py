"""Promoted team, synthetic xG and schedule fatigue feature groups for SportsFeatureVector."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class PromotedTeamFeaturesMixin(BaseModel):
    """Promoted team feature fields (PromotedTeamFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    away_decay_weighted_goals_against: float | None = None
    away_decay_weighted_goals_for: float | None = None
    away_decay_weighted_ppg: float | None = None
    away_decay_weighted_xg_against: float | None = None
    away_decay_weighted_xg_for: float | None = None
    away_history_depth_last1: int | None = None
    away_history_depth_last3: int | None = None
    away_history_depth_last5: int | None = None
    away_insufficient_data_flag: bool | None = None
    away_is_promoted_team: bool | None = None
    away_league_adjusted_attack: float | None = None
    away_league_adjusted_defense: float | None = None
    away_league_normalized_attack: float | None = None
    away_preseason_form: float | None = None
    away_preseason_goals_per_game: float | None = None
    away_preseason_xg_avg: float | None = None
    away_prior_goals_against_avg: float | None = None
    away_prior_goals_for_avg: float | None = None
    away_prior_league_position: int | None = None
    away_prior_ppg: float | None = None
    away_prior_xg_attack: float | None = None
    away_prior_xg_defense: float | None = None
    away_relative_league_difficulty: float | None = None
    away_squad_turnover_rate: float | None = None
    away_squad_xg_aggregate: float | None = None
    away_style_pc1: float | None = None
    away_style_pc2: float | None = None
    away_total_history_depth: int | None = None
    games_since_season_start: int | None = None
    home_decay_weighted_goals_against: float | None = None
    home_decay_weighted_goals_for: float | None = None
    home_decay_weighted_ppg: float | None = None
    home_decay_weighted_xg_against: float | None = None
    home_decay_weighted_xg_for: float | None = None
    home_history_depth_last1: int | None = None
    home_history_depth_last3: int | None = None
    home_history_depth_last5: int | None = None
    home_insufficient_data_flag: bool | None = None
    home_is_promoted_team: bool | None = None
    home_league_adjusted_attack: float | None = None
    home_league_adjusted_defense: float | None = None
    home_league_normalized_attack: float | None = None
    home_preseason_form: float | None = None
    home_preseason_goals_per_game: float | None = None
    home_preseason_xg_avg: float | None = None
    home_prior_goals_against_avg: float | None = None
    home_prior_goals_for_avg: float | None = None
    home_prior_league_position: int | None = None
    home_prior_ppg: float | None = None
    home_prior_xg_attack: float | None = None
    home_prior_xg_defense: float | None = None
    home_relative_league_difficulty: float | None = None
    home_squad_turnover_rate: float | None = None
    home_squad_xg_aggregate: float | None = None
    home_style_pc1: float | None = None
    home_style_pc2: float | None = None
    home_total_history_depth: int | None = None


class SyntheticXGFeaturesMixin(BaseModel):
    """Synthetic xG feature fields (SyntheticXGFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    synthetic_big_chance_conversion_away: float | None = None
    synthetic_big_chance_conversion_home: float | None = None
    synthetic_xg_away: float | None = None
    synthetic_xg_confidence: float | None = None
    synthetic_xg_diff: float | None = None
    synthetic_xg_home: float | None = None
    synthetic_xg_last5_away: float | None = None
    synthetic_xg_last5_home: float | None = None
    synthetic_xg_model_residual_away: float | None = None
    synthetic_xg_model_residual_home: float | None = None
    synthetic_xg_per_shot_away: float | None = None
    synthetic_xg_per_shot_home: float | None = None
    synthetic_xg_season_away: float | None = None
    synthetic_xg_season_home: float | None = None
    synthetic_xg_source: int | None = None
    synthetic_xg_total: float | None = None
    synthetic_xg_vs_goals_away: float | None = None
    synthetic_xg_vs_goals_home: float | None = None


class ScheduleFatigueFeaturesMixin(BaseModel):
    """Schedule fatigue feature fields (ScheduleFatigueFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    away_away_travel_km: float | None = None
    away_congestion_score_14d: float | None = None
    away_continental_hangover: float | None = None
    away_fixture_pile_up: bool | None = None
    away_games_last_21d: int | None = None
    away_midweek_european: bool | None = None
    away_played_continental_last_week: bool | None = None
    away_schedule_days_rest: int | None = None
    away_schedule_games_14d: int | None = None
    away_short_rest: bool | None = None
    away_total_travel_14d: float | None = None
    away_travel_band: int | None = None
    away_travel_fatigue: float | None = None
    both_short_rest: bool | None = None
    home_away_travel_km: float | None = None
    home_congestion_score_14d: float | None = None
    home_continental_hangover: float | None = None
    home_fixture_pile_up: bool | None = None
    home_games_last_21d: int | None = None
    home_midweek_european: bool | None = None
    home_played_continental_last_week: bool | None = None
    home_schedule_days_rest: int | None = None
    home_schedule_games_14d: int | None = None
    home_short_rest: bool | None = None
    home_total_travel_14d: float | None = None
    home_travel_band: int | None = None
    home_travel_fatigue: float | None = None
    schedule_rest_diff: int | None = None
