"""Venue, referee, player-lineup, odds and basic xG feature groups for SportsFeatureVector."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class VenueContextFeaturesMixin(BaseModel):
    """Venue context feature fields (VenueContextFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    venue_capacity: int | None = None
    venue_altitude_m: float | None = None
    venue_surface: str | None = None
    attendance_rate: float | None = None
    venue_home_win_rate: float | None = None
    venue_avg_goals: float | None = None

    # -- Venue Context Extended (VenueContextFeatureCalculator) --
    attendance_pct_capacity: float | None = None
    expected_attendance: float | None = None
    is_derby: bool | None = None
    is_european_spot_contest: bool | None = None
    is_relegation_battle: bool | None = None
    is_sellout_expected: bool | None = None
    is_title_decider: bool | None = None
    kickoff_day_of_week: int | None = None
    kickoff_hour: int | None = None
    kickoff_is_afternoon: bool | None = None
    kickoff_is_early: bool | None = None
    kickoff_is_evening: bool | None = None
    kickoff_is_midweek: bool | None = None
    kickoff_is_weekend: bool | None = None
    match_importance_away: float | None = None
    match_importance_home: float | None = None
    stakes_differential: float | None = None
    venue_age: int | None = None
    venue_altitude_meters: float | None = None
    venue_avg_attendance_season: float | None = None
    venue_has_roof: bool | None = None
    venue_is_artificial_turf: bool | None = None
    venue_is_high_altitude: bool | None = None
    venue_pitch_length: float | None = None
    venue_pitch_size: float | None = None
    venue_pitch_width: float | None = None
    venue_surface_type: str | None = None


class RefereeFeaturesMixin(BaseModel):
    """Referee feature fields (RefereeFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    ref_cards_per_game: float | None = None
    ref_penalty_rate: float | None = None
    ref_home_bias_score: float | None = None
    ref_fouls_per_game: float | None = None
    ref_avg_added_time: float | None = None
    ref_matches_count: int | None = None

    # -- Referee Extended (RefereeFeatureCalculator) --
    referee_fouls_per_game: float | None = None
    referee_games_with_away_team: int | None = None
    referee_games_with_home_team: int | None = None
    referee_has_red_card_rate: float | None = None
    referee_home_foul_bias: float | None = None
    referee_home_penalty_bias: float | None = None
    referee_home_team_win_rate: float | None = None
    referee_home_yellow_card_bias: float | None = None
    referee_is_lenient: bool | None = None
    referee_is_strict: bool | None = None
    referee_penalties_per_game: float | None = None
    referee_penalty_rate_season: float | None = None
    referee_red_cards_per_game: float | None = None
    referee_red_cards_season: int | None = None
    referee_total_cards_per_game: float | None = None
    referee_yellow_card_rate: float | None = None
    referee_yellow_cards_per_game: float | None = None
    referee_yellow_cards_season: int | None = None

    # -- Referee Interaction (RefereeInteractionFeatureCalculator) --
    away_card_diff_under_ref: float | None = None
    away_cards_under_ref: float | None = None
    away_discipline_risk: float | None = None
    away_pen_attack_style: float | None = None
    away_penalty_propensity: float | None = None
    away_reds_under_ref: float | None = None
    away_ref_foul_rate: float | None = None
    away_ref_home_bias: float | None = None
    away_ref_penalty_rate: float | None = None
    away_ref_style_match: float | None = None
    away_yellows_under_ref: float | None = None
    home_card_diff_under_ref: float | None = None
    home_cards_under_ref: float | None = None
    home_discipline_risk: float | None = None
    home_pen_attack_style: float | None = None
    home_penalty_propensity: float | None = None
    home_reds_under_ref: float | None = None
    home_ref_foul_rate: float | None = None
    home_ref_home_bias: float | None = None
    home_ref_penalty_rate: float | None = None
    home_ref_style_match: float | None = None
    home_yellows_under_ref: float | None = None


class PlayerLineupFeaturesMixin(BaseModel):
    """Player lineup feature fields (PlayerLineupFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    home_key_player_absent: bool | None = None
    away_key_player_absent: bool | None = None
    home_lineup_strength: float | None = None
    away_lineup_strength: float | None = None
    home_missing_key_players: int | None = None
    away_missing_key_players: int | None = None

    # -- Player Lineup Extended (PlayerLineupFeatureCalculator) --
    away_bench_avg_rating: float | None = None
    away_formation_consistency: float | None = None
    away_gk_clean_sheet_rate: float | None = None
    away_gk_save_percentage: float | None = None
    away_gk_saves_per_game: float | None = None
    away_goal_concentration: float | None = None
    away_injured_players_count: int | None = None
    away_key_players_available: int | None = None
    away_key_players_missing: int | None = None
    away_lineup_changes_from_last: int | None = None
    away_players_on_yellow_card_warning: int | None = None
    away_squad_depth_score: float | None = None
    away_suspended_players_count: int | None = None
    away_top_assist_provider_assists: int | None = None
    away_top_scorer_available: bool | None = None
    away_top_scorer_form_last5: int | None = None
    away_top_scorer_goals: int | None = None
    away_top_scorer_goals_per_game: float | None = None
    away_xi_avg_age: float | None = None
    away_xi_avg_appearances: float | None = None
    away_xi_avg_goals_per_game: float | None = None
    away_xi_avg_rating: float | None = None
    away_xi_interceptions_per_game: float | None = None
    away_xi_key_passes_per_game: float | None = None
    away_xi_tackles_per_game: float | None = None
    away_xi_total_assists: int | None = None
    away_xi_yellow_cards_season: int | None = None
    home_bench_avg_rating: float | None = None
    home_formation_consistency: float | None = None
    home_gk_clean_sheet_rate: float | None = None
    home_gk_save_percentage: float | None = None
    home_gk_saves_per_game: float | None = None
    home_goal_concentration: float | None = None
    home_injured_players_count: int | None = None
    home_key_players_available: int | None = None
    home_key_players_missing: int | None = None
    home_lineup_changes_from_last: int | None = None
    home_players_on_yellow_card_warning: int | None = None
    home_squad_depth_score: float | None = None
    home_suspended_players_count: int | None = None
    home_top_assist_provider_assists: int | None = None
    home_top_scorer_available: bool | None = None
    home_top_scorer_form_last5: int | None = None
    home_top_scorer_goals: int | None = None
    home_top_scorer_goals_per_game: float | None = None
    home_xi_avg_age: float | None = None
    home_xi_avg_appearances: float | None = None
    home_xi_avg_goals_per_game: float | None = None
    home_xi_avg_rating: float | None = None
    home_xi_interceptions_per_game: float | None = None
    home_xi_key_passes_per_game: float | None = None
    home_xi_tackles_per_game: float | None = None
    home_xi_total_assists: int | None = None
    home_xi_yellow_cards_season: int | None = None


class OddsFeaturesMixin(BaseModel):
    """Odds feature fields (OddsFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    # Implied probabilities
    market_home_implied_prob: float | None = None
    market_draw_implied_prob: float | None = None
    market_away_implied_prob: float | None = None
    # Market efficiency
    market_overround: float | None = None
    market_consensus_home_prob: float | None = None
    market_consensus_draw_prob: float | None = None
    market_consensus_away_prob: float | None = None
    market_vig_pct: float | None = None
    market_num_bookmakers: int | None = None
    # Raw 1X2 odds
    odds_home_win: float | None = None
    odds_draw: float | None = None
    odds_away_win: float | None = None
    odds_home_away_ratio: float | None = None
    market_home_away_odds_ratio: float | None = None
    # Over/Under lines
    odds_over_2_5: float | None = None
    odds_under_2_5: float | None = None
    market_over_25_implied_prob: float | None = None
    market_under_25_implied_prob: float | None = None
    odds_over_1_5: float | None = None
    odds_under_1_5: float | None = None
    odds_over_3_5: float | None = None
    odds_under_3_5: float | None = None
    # Market consensus (cross-bookmaker)
    market_home_odds_best: float | None = None
    market_away_odds_best: float | None = None
    market_home_odds_variance: float | None = None
    market_away_odds_variance: float | None = None
    # Odds movement (opening / closing)
    odds_home_opening: float | None = None
    odds_home_closing: float | None = None
    odds_home_movement: float | None = None
    odds_home_movement_pct: float | None = None
    odds_away_opening: float | None = None
    odds_away_closing: float | None = None
    odds_away_movement: float | None = None
    odds_away_movement_pct: float | None = None
    # Sharp money indicators
    odds_sharp_money_on_home: int | None = None
    odds_sharp_money_on_away: int | None = None

    # -- Odds Extended (OddsFeatureCalculator) --
    asian_handicap_line: float | None = None
    ev_away_win: float | None = None
    ev_home_win: float | None = None
    implied_prob_btts_no: float | None = None
    implied_prob_btts_yes: float | None = None
    odds_asian_handicap_away: float | None = None
    odds_asian_handicap_home: float | None = None
    odds_btts_no: float | None = None
    odds_btts_yes: float | None = None
    value_away_win: float | None = None
    value_btts: float | None = None
    value_home_win: float | None = None
    value_over_2_5: float | None = None
