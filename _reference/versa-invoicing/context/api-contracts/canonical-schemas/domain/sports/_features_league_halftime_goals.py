"""League, halftime, goal-timing and season-context feature groups for SportsFeatureVector."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class LeagueFeaturesMixin(BaseModel):
    """League-level feature fields (LeagueFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    league_avg_goals_per_game: float | None = None
    league_home_win_rate: float | None = None
    league_btts_rate: float | None = None
    league_over_25_rate: float | None = None
    league_draw_rate: float | None = None
    league_avg_cards_per_game: float | None = None
    league_avg_corners_per_game: float | None = None
    # Attack/defense strength relative to league average
    home_attack_strength: float | None = None
    away_attack_strength: float | None = None
    home_defense_strength: float | None = None
    away_defense_strength: float | None = None
    # Games played per team in league (season context)
    home_league_games_played: int | None = None
    away_league_games_played: int | None = None
    # Derived league aggregates
    league_home_advantage: float | None = None
    league_avg_goals_per_team: float | None = None

    # -- League Extended (LeagueFeatureCalculator) --
    away_goals_conceded_vs_league_avg: float | None = None
    away_goals_vs_league_avg: float | None = None
    away_is_bottom_6: bool | None = None
    away_is_top_6: bool | None = None
    away_is_top_half: bool | None = None
    away_league_position: int | None = None
    away_points_from_leader: float | None = None
    away_position_pct: float | None = None
    away_xg_conceded_vs_league_avg: float | None = None
    away_xg_vs_league_avg: float | None = None
    home_goals_conceded_vs_league_avg: float | None = None
    home_goals_vs_league_avg: float | None = None
    home_is_bottom_6: bool | None = None
    home_is_top_6: bool | None = None
    home_is_top_half: bool | None = None
    home_league_position: int | None = None
    home_points_from_leader: float | None = None
    home_position_pct: float | None = None
    home_xg_conceded_vs_league_avg: float | None = None
    home_xg_vs_league_avg: float | None = None
    league_avg_possession: float | None = None
    league_avg_shots_per_game: float | None = None
    league_avg_xg_per_game: float | None = None
    league_over_2_5_rate: float | None = None
    league_position_diff: int | None = None


class HalftimeFeaturesMixin(BaseModel):
    """Halftime feature fields (HalfTimeFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    home_ht_goal_rate: float | None = None
    away_ht_goal_rate: float | None = None
    home_ht_concede_rate: float | None = None
    away_ht_concede_rate: float | None = None
    home_ht_lead_rate: float | None = None
    away_ht_lead_rate: float | None = None
    # Extended HT features (from old system)
    home_ht_goals_avg: float | None = None
    away_ht_goals_avg: float | None = None
    home_ht_conceded_avg: float | None = None
    away_ht_conceded_avg: float | None = None
    home_ht_clean_sheet_rate: float | None = None
    away_ht_clean_sheet_rate: float | None = None
    home_ht_win_conversion_rate: float | None = None
    away_ht_win_conversion_rate: float | None = None
    home_ht_comeback_rate: float | None = None
    away_ht_comeback_rate: float | None = None
    home_ht_scoring_rate: float | None = None
    away_ht_scoring_rate: float | None = None

    # -- Halftime Extended (HalfTimeFeatureCalculator) --
    ht_away_comeback_rate_history: float | None = None
    ht_away_corners: int | None = None
    ht_away_goals: int | None = None
    ht_away_goals_vs_xg: float | None = None
    ht_away_hold_lead_rate: float | None = None
    ht_away_momentum_score: float | None = None
    ht_away_outperforming: bool | None = None
    ht_away_possession: float | None = None
    ht_away_red_cards: int | None = None
    ht_away_scored_early: bool | None = None
    ht_away_scored_late: bool | None = None
    ht_away_shots: int | None = None
    ht_away_shots_on_target: int | None = None
    ht_away_subs_made: int | None = None
    ht_away_tactical_sub: bool | None = None
    ht_away_winning: bool | None = None
    ht_away_xg: float | None = None
    ht_away_yellow_cards: int | None = None
    ht_dominance_score_away: float | None = None
    ht_dominance_score_home: float | None = None
    ht_efficiency_score_away: float | None = None
    ht_efficiency_score_home: float | None = None
    ht_game_state_code: str | None = None
    ht_goal_diff: int | None = None
    ht_has_red_card: bool | None = None
    ht_home_comeback_rate_history: float | None = None
    ht_home_corners: int | None = None
    ht_home_goals: int | None = None
    ht_home_goals_vs_xg: float | None = None
    ht_home_hold_lead_rate: float | None = None
    ht_home_momentum_score: float | None = None
    ht_home_outperforming: bool | None = None
    ht_home_possession: float | None = None
    ht_home_red_cards: int | None = None
    ht_home_scored_early: bool | None = None
    ht_home_scored_late: bool | None = None
    ht_home_shots: int | None = None
    ht_home_shots_on_target: int | None = None
    ht_home_subs_made: int | None = None
    ht_home_tactical_sub: bool | None = None
    ht_home_winning: bool | None = None
    ht_home_xg: float | None = None
    ht_home_yellow_cards: int | None = None
    ht_is_draw: bool | None = None
    ht_last_goal_minute: int | None = None
    ht_last_goal_team: str | None = None
    ht_league_avg_2h_goals: float | None = None
    ht_match_tempo: float | None = None
    ht_odds_away_win: float | None = None
    ht_odds_draw: float | None = None
    ht_odds_home_win: float | None = None
    ht_odds_movement_away: float | None = None
    ht_odds_movement_home: float | None = None
    ht_possession_trend_away: float | None = None
    ht_possession_trend_home: float | None = None
    ht_predicted_2h_away_goals: float | None = None
    ht_predicted_2h_home_goals: float | None = None
    ht_predicted_ft_away_goals: float | None = None
    ht_predicted_ft_home_goals: float | None = None
    ht_predicted_ft_total_goals: float | None = None
    ht_shots_trend_away: float | None = None
    ht_shots_trend_home: float | None = None
    ht_total_goals: int | None = None
    ht_win_prob_away: float | None = None
    ht_win_prob_draw: float | None = None
    ht_win_prob_home: float | None = None

    # -- HT Sequencing (HTSequencingFeatureCalculator) --
    away_attack_dominance_late: float | None = None
    away_dangerous_attacks_last_10: int | None = None
    away_event_rate_decline: float | None = None
    away_game_state_xg_modifier: float | None = None
    away_late_surge: bool | None = None
    away_match_intensity: float | None = None
    away_max_momentum: float | None = None
    away_momentum_at_35: float | None = None
    away_momentum_score_ht: float | None = None
    away_momentum_trend: float | None = None
    away_response_when_ahead: float | None = None
    away_response_when_behind: float | None = None
    away_shot_pressure_ratio: float | None = None
    away_shots_last_10min_ht: int | None = None
    away_shots_last_5min_ht: int | None = None
    away_xg_acceleration: float | None = None
    away_xg_first_15min: float | None = None
    away_xg_first_half_trend: float | None = None
    away_xg_last_15min: float | None = None
    away_xg_middle_15min: float | None = None
    comeback_attempted: bool | None = None
    game_state_at_ht: str | None = None
    high_intensity_match: bool | None = None
    home_attack_dominance_late: float | None = None
    home_dangerous_attacks_last_10: int | None = None
    home_event_rate_decline: float | None = None
    home_game_state_xg_modifier: float | None = None
    home_late_surge: bool | None = None
    home_match_intensity: float | None = None
    home_max_momentum: float | None = None
    home_momentum_at_35: float | None = None
    home_momentum_score_ht: float | None = None
    home_momentum_trend: float | None = None
    home_response_when_ahead: float | None = None
    home_response_when_behind: float | None = None
    home_shot_pressure_ratio: float | None = None
    home_shots_last_10min_ht: int | None = None
    home_shots_last_5min_ht: int | None = None
    home_xg_acceleration: float | None = None
    home_xg_first_15min: float | None = None
    home_xg_first_half_trend: float | None = None
    home_xg_last_15min: float | None = None
    home_xg_middle_15min: float | None = None
    lead_changes: int | None = None
    time_in_lead: int | None = None


class GoalTimingFeaturesMixin(BaseModel):
    """Goal timing feature fields (GoalTimingFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    home_early_goal_rate: float | None = None
    home_late_goal_rate: float | None = None
    away_early_goal_rate: float | None = None
    away_late_concede_rate: float | None = None
    home_first_goal_rate: float | None = None
    away_first_goal_rate: float | None = None

    # -- Goal Timing Extended (GoalTimingFeatureCalculator) --
    away_avg_first_goal_minute: float | None = None
    away_comeback_rate: float | None = None
    away_first_goal_before_30min_rate: float | None = None
    away_goals_0_15_min_avg: float | None = None
    away_goals_15_30_min_avg: float | None = None
    away_goals_30_45_min_avg: float | None = None
    away_goals_45_60_min_avg: float | None = None
    away_goals_60_75_min_avg: float | None = None
    away_goals_75_90_min_avg: float | None = None
    away_late_goal_rate: float | None = None
    away_scores_first_win_rate: float | None = None
    home_avg_first_goal_minute: float | None = None
    home_comeback_rate: float | None = None
    home_first_goal_before_30min_rate: float | None = None
    home_goals_0_15_min_avg: float | None = None
    home_goals_15_30_min_avg: float | None = None
    home_goals_30_45_min_avg: float | None = None
    home_goals_45_60_min_avg: float | None = None
    home_goals_60_75_min_avg: float | None = None
    home_goals_75_90_min_avg: float | None = None
    home_scores_first_win_rate: float | None = None


class SeasonContextFeaturesMixin(BaseModel):
    """Season context feature fields (SeasonContextFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    match_week: int | None = None
    season_stage: str | None = None
    home_relegation_pressure: float | None = None
    away_relegation_pressure: float | None = None
    home_title_pressure: float | None = None
    season_progress_pct: float | None = None

    # -- Season Context Extended (SeasonContextFeatureCalculator) --
    away_days_rest: float | None = None
    days_since_season_start: int | None = None
    games_played_season_away: int | None = None
    games_played_season_home: int | None = None
    home_days_rest: float | None = None
    home_rest_advantage: float | None = None
    is_early_season: bool | None = None
    is_first_3_games: bool | None = None
    is_season_finale: bool | None = None
