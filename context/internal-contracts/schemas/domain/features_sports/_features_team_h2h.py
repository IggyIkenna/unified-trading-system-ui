"""Team and H2H feature field groups for SportsFeatureVector."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class TeamFeaturesMixin(BaseModel):
    """Team performance feature fields (TeamFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    # Form (points per game over rolling windows)
    home_form_5: float | None = None
    away_form_5: float | None = None
    home_ppg_last3: float | None = None
    away_ppg_last3: float | None = None
    home_ppg_season: float | None = None
    away_ppg_season: float | None = None
    # Win / draw / loss rates
    home_win_rate_season: float | None = None
    away_win_rate_season: float | None = None
    home_win_rate_last5: float | None = None
    away_win_rate_last5: float | None = None
    # Goals
    home_goals_scored_avg: float | None = None
    away_goals_scored_avg: float | None = None
    home_goals_conceded_avg: float | None = None
    away_goals_conceded_avg: float | None = None
    home_goal_diff_season: float | None = None
    away_goal_diff_season: float | None = None
    # xG (team-level rolling averages)
    home_xg_season: float | None = None
    away_xg_season: float | None = None
    home_xg_conceded_season: float | None = None
    away_xg_conceded_season: float | None = None
    # Home advantage
    home_home_advantage_factor: float | None = None
    # Rest & congestion
    home_rest_days: int | None = None
    away_rest_days: int | None = None
    home_congestion_score: float | None = None
    away_congestion_score: float | None = None
    # Streaks
    home_current_streak: int | None = None
    away_current_streak: int | None = None
    home_unbeaten_run: int | None = None
    away_unbeaten_run: int | None = None
    # Clean sheets & BTTS
    home_clean_sheet_rate: float | None = None
    away_clean_sheet_rate: float | None = None
    home_btts_rate: float | None = None
    away_btts_rate: float | None = None
    # Over/Under
    home_over_25_rate: float | None = None
    away_over_25_rate: float | None = None
    # Consistency
    home_goal_variance: float | None = None
    away_goal_variance: float | None = None

    # -- Team Extended (TeamFeatureCalculator) --
    away_aerials_won_pct: float | None = None
    away_avg_opponent_rank: float | None = None
    away_away_goals_avg: float | None = None
    away_away_ppg_season: float | None = None
    away_away_xg_avg: float | None = None
    away_big_chances_created: float | None = None
    away_blocks_per_game: float | None = None
    away_btts_rate_last5: float | None = None
    away_cards_season: int | None = None
    away_clean_sheet_rate_last5: float | None = None
    away_clearances_per_game: float | None = None
    away_conversion_rate_season: float | None = None
    away_corners_last3: float | None = None
    away_corners_last5: float | None = None
    away_corners_season: float | None = None
    away_cup_ppg: float | None = None
    away_current_clean_sheet_streak: int | None = None
    away_current_scoring_streak: int | None = None
    away_current_unbeaten_streak: int | None = None
    away_current_win_streak: int | None = None
    away_dangerous_attacks_last3: float | None = None
    away_dangerous_attacks_last5: float | None = None
    away_dangerous_attacks_season: float | None = None
    away_draw_rate_last5: float | None = None
    away_duels_won_pct: float | None = None
    away_elo: int | None = None
    away_european_ppg: float | None = None
    away_failed_to_score_rate_last5: float | None = None
    away_first_half_goals_avg: float | None = None
    away_form_momentum: float | None = None
    away_form_string: float | None = None
    away_fouls_per_game: float | None = None
    away_games_last_14d: int | None = None
    away_goals_avg_last_5: float | None = None
    away_goals_conceded_last1: int | None = None
    away_goals_conceded_last3: float | None = None
    away_goals_conceded_last5: float | None = None
    away_goals_conceded_season: float | None = None
    away_goals_last1: int | None = None
    away_goals_last3: float | None = None
    away_goals_last5: float | None = None
    away_goals_season: float | None = None
    away_goals_std_last10: float | None = None
    away_goals_trend_last10: float | None = None
    away_interceptions_per_game: float | None = None
    away_key_passes_per_game: float | None = None
    away_late_goals_rate: float | None = None
    away_league_ppg: float | None = None
    away_loss_rate_last5: float | None = None
    away_offsides_per_game: float | None = None
    away_over_2_5_rate_last5: float | None = None
    away_pass_accuracy_season: float | None = None
    away_passes_per_game_season: float | None = None
    away_performance_under_pressure: float | None = None
    away_possession_last1: float | None = None
    away_possession_last3: float | None = None
    away_possession_last5: float | None = None
    away_possession_season: float | None = None
    away_ppg_last1: float | None = None
    away_ppg_last5: float | None = None
    away_ppg_trend_last10: float | None = None
    away_ppg_vs_bottom6: float | None = None
    away_ppg_vs_top6: float | None = None
    away_red_cards_last5: int | None = None
    away_save_pct_season: float | None = None
    away_saves_per_game: float | None = None
    away_second_half_goals_avg: float | None = None
    away_shot_accuracy_season: float | None = None
    away_shots_inside_box_pct: float | None = None
    away_shots_last1: float | None = None
    away_shots_last3: float | None = None
    away_shots_last5: float | None = None
    away_shots_on_target_last3: float | None = None
    away_shots_on_target_last5: float | None = None
    away_shots_on_target_season: float | None = None
    away_shots_per_goal_season: float | None = None
    away_shots_season: float | None = None
    away_tackles_per_game: float | None = None
    away_xg_conceded_last1: float | None = None
    away_xg_conceded_last3: float | None = None
    away_xg_conceded_last5: float | None = None
    away_xg_diff_season: float | None = None
    away_xg_last1: float | None = None
    away_xg_last3: float | None = None
    away_xg_last5: float | None = None
    away_xg_trend_last10: float | None = None
    away_yellow_cards_last5: float | None = None
    home_aerials_won_pct: float | None = None
    home_avg_opponent_rank: float | None = None
    home_big_chances_created: float | None = None
    home_blocks_per_game: float | None = None
    home_btts_rate_last5: float | None = None
    home_cards_season: int | None = None
    home_clean_sheet_rate_last5: float | None = None
    home_clearances_per_game: float | None = None
    home_conversion_rate_season: float | None = None
    home_corners_last3: float | None = None
    home_corners_last5: float | None = None
    home_corners_season: float | None = None
    home_cup_ppg: float | None = None
    home_current_clean_sheet_streak: int | None = None
    home_current_scoring_streak: int | None = None
    home_current_unbeaten_streak: int | None = None
    home_current_win_streak: int | None = None
    home_dangerous_attacks_last3: float | None = None
    home_dangerous_attacks_last5: float | None = None
    home_dangerous_attacks_season: float | None = None
    home_draw_rate_last5: float | None = None
    home_duels_won_pct: float | None = None
    home_elo: int | None = None
    home_european_ppg: float | None = None
    home_failed_to_score_rate_last5: float | None = None
    home_first_half_goals_avg: float | None = None
    home_form_momentum: float | None = None
    home_form_string: float | None = None
    home_fouls_per_game: float | None = None
    home_games_last_14d: int | None = None
    home_goals_avg_last_5: float | None = None
    home_goals_conceded_last1: int | None = None
    home_goals_conceded_last3: float | None = None
    home_goals_conceded_last5: float | None = None
    home_goals_conceded_season: float | None = None
    home_goals_last1: int | None = None
    home_goals_last3: float | None = None
    home_goals_last5: float | None = None
    home_goals_season: float | None = None
    home_goals_std_last10: float | None = None
    home_goals_trend_last10: float | None = None
    home_home_goals_avg: float | None = None
    home_home_ppg_season: float | None = None
    home_home_xg_avg: float | None = None
    home_interceptions_per_game: float | None = None
    home_key_passes_per_game: float | None = None
    home_late_goals_rate: float | None = None
    home_league_ppg: float | None = None
    home_loss_rate_last5: float | None = None
    home_offsides_per_game: float | None = None
    home_over_2_5_rate_last5: float | None = None
    home_pass_accuracy_season: float | None = None
    home_passes_per_game_season: float | None = None
    home_performance_under_pressure: float | None = None
    home_possession_last1: float | None = None
    home_possession_last3: float | None = None
    home_possession_last5: float | None = None
    home_possession_season: float | None = None
    home_ppg_last1: float | None = None
    home_ppg_last5: float | None = None
    home_ppg_trend_last10: float | None = None
    home_ppg_vs_bottom6: float | None = None
    home_ppg_vs_top6: float | None = None
    home_red_cards_last5: int | None = None
    home_save_pct_season: float | None = None
    home_saves_per_game: float | None = None
    home_second_half_goals_avg: float | None = None
    home_shot_accuracy_season: float | None = None
    home_shots_inside_box_pct: float | None = None
    home_shots_last1: float | None = None
    home_shots_last3: float | None = None
    home_shots_last5: float | None = None
    home_shots_on_target_last3: float | None = None
    home_shots_on_target_last5: float | None = None
    home_shots_on_target_season: float | None = None
    home_shots_per_goal_season: float | None = None
    home_shots_season: float | None = None
    home_tackles_per_game: float | None = None
    home_xg_conceded_last1: float | None = None
    home_xg_conceded_last3: float | None = None
    home_xg_conceded_last5: float | None = None
    home_xg_diff_season: float | None = None
    home_xg_last1: float | None = None
    home_xg_last3: float | None = None
    home_xg_last5: float | None = None
    home_xg_trend_last10: float | None = None
    home_yellow_cards_last5: float | None = None
    ppg_diff: float | None = None
    xg_diff_season: float | None = None


class H2HFeaturesMixin(BaseModel):
    """Head-to-head feature fields (H2HFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    # Basic H2H stats (all-time)
    h2h_home_wins: int | None = None
    h2h_draws: int | None = None
    h2h_away_wins: int | None = None
    h2h_avg_goals: float | None = None
    h2h_matches_played: int | None = None
    h2h_home_goals_avg: float | None = None
    h2h_away_goals_avg: float | None = None
    h2h_home_win_pct: float | None = None
    h2h_away_win_pct: float | None = None
    h2h_home_goals_conceded_avg: float | None = None
    h2h_away_goals_conceded_avg: float | None = None
    # H2H patterns
    h2h_btts_rate: float | None = None
    h2h_over_25_rate: float | None = None
    # Streaks
    h2h_home_current_streak: int | None = None
    h2h_away_current_streak: int | None = None
    # Time since last meeting
    h2h_days_since_last_meeting: int | None = None
    # Recent H2H (last meeting)
    h2h_last_home_wins: int | None = None
    h2h_last_away_wins: int | None = None
    h2h_last_draws: int | None = None
    h2h_last_home_goals_avg: float | None = None
    h2h_last_away_goals_avg: float | None = None
    # Recent H2H (last 3 meetings)
    h2h_last3_home_wins: int | None = None
    h2h_last3_away_wins: int | None = None
    h2h_last3_draws: int | None = None
    h2h_last3_home_goals_avg: float | None = None
    h2h_last3_away_goals_avg: float | None = None
    # Recent H2H (last 5 meetings)
    h2h_last5_home_wins: int | None = None
    h2h_last5_away_wins: int | None = None
    h2h_last5_draws: int | None = None
    h2h_last5_home_goals_avg: float | None = None
    h2h_last5_away_goals_avg: float | None = None
    # Venue-specific H2H (home team)
    h2h_home_at_home_venue_wins: int | None = None
    h2h_home_at_home_venue_draws: int | None = None
    h2h_home_at_away_venue_wins: int | None = None
    h2h_home_at_away_venue_draws: int | None = None
    # Venue-specific H2H (away team)
    h2h_away_at_away_venue_wins: int | None = None
    h2h_away_at_away_venue_draws: int | None = None
    h2h_away_at_home_venue_wins: int | None = None
    h2h_away_at_home_venue_draws: int | None = None
    # Advanced H2H stats (possession and xG)
    h2h_possession_home_avg: float | None = None
    h2h_possession_away_avg: float | None = None
    h2h_xg_home_avg: float | None = None
    h2h_xg_away_avg: float | None = None
