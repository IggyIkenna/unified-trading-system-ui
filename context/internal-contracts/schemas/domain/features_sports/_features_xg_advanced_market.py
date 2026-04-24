"""xG, advanced stats, weather, team-style, manager and market features."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class XGFeaturesMixin(BaseModel):
    """xG feature fields (MultiSourceXGFeatureCalculator + PoissonXGFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    understat_home_xg: float | None = None
    understat_away_xg: float | None = None
    footystats_home_xg: float | None = None
    footystats_away_xg: float | None = None
    consensus_home_xg: float | None = None
    consensus_away_xg: float | None = None
    poisson_home_win_prob: float | None = None
    poisson_draw_prob: float | None = None
    poisson_away_win_prob: float | None = None
    poisson_over_25_prob: float | None = None
    poisson_btts_prob: float | None = None

    # -- Multi-Source xG (MultiSourceXGFeatureCalculator) --
    away_xg_af: float | None = None
    away_xg_consensus: float | None = None
    away_xg_consensus_std: float | None = None
    away_xg_ft: float | None = None
    away_xg_ft_prematch: float | None = None
    away_xg_ft_vs_af: float | None = None
    away_xg_max_provider: float | None = None
    away_xg_min_provider: float | None = None
    away_xg_sf_kickoff: float | None = None
    away_xg_sf_vs_af: float | None = None
    away_xg_spread: float | None = None
    away_xg_us: float | None = None
    away_xg_us_vs_af: float | None = None
    away_xg_variance: float | None = None
    home_xg_af: float | None = None
    home_xg_consensus: float | None = None
    home_xg_consensus_std: float | None = None
    home_xg_ft: float | None = None
    home_xg_ft_prematch: float | None = None
    home_xg_ft_vs_af: float | None = None
    home_xg_max_provider: float | None = None
    home_xg_min_provider: float | None = None
    home_xg_sf_kickoff: float | None = None
    home_xg_sf_vs_af: float | None = None
    home_xg_spread: float | None = None
    home_xg_us: float | None = None
    home_xg_us_vs_af: float | None = None
    home_xg_variance: float | None = None
    xg_providers_agree: bool | None = None
    xg_providers_count: int | None = None

    # -- Poisson xG (PoissonXGFeatureCalculator) --
    away_attack_lambda: float | None = None
    away_defense_lambda: float | None = None
    away_expected_regression: float | None = None
    away_xg_overperformance: float | None = None
    away_xg_overperformance_pct: float | None = None
    away_xg_std_last10: float | None = None
    away_xg_trend: float | None = None
    dixon_coles_away_win_prob: float | None = None
    dixon_coles_draw_prob: float | None = None
    dixon_coles_home_win_prob: float | None = None
    dixon_coles_rho: float | None = None
    home_attack_lambda: float | None = None
    home_defense_lambda: float | None = None
    home_expected_regression: float | None = None
    home_xg_overperformance: float | None = None
    home_xg_overperformance_pct: float | None = None
    home_xg_std_last10: float | None = None
    home_xg_trend: float | None = None
    hybrid_away_expected_goals: float | None = None
    hybrid_btts_prob: float | None = None
    hybrid_home_expected_goals: float | None = None
    hybrid_over_2_5_prob: float | None = None
    poisson_away_expected_goals: float | None = None
    poisson_home_expected_goals: float | None = None
    poisson_over_0_5_prob: float | None = None
    poisson_over_1_5_prob: float | None = None
    poisson_over_2_5_prob: float | None = None
    poisson_over_3_5_prob: float | None = None
    poisson_total_expected_goals: float | None = None


class AdvancedStatsFeaturesMixin(BaseModel):
    """Advanced stats feature fields (AdvancedStatsFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    home_shots_on_target_avg: float | None = None
    away_shots_on_target_avg: float | None = None
    home_total_shots_avg: float | None = None
    away_total_shots_avg: float | None = None
    home_shot_accuracy: float | None = None
    away_shot_accuracy: float | None = None
    home_corners_avg: float | None = None
    away_corners_avg: float | None = None
    home_possession_avg: float | None = None
    away_possession_avg: float | None = None
    home_fouls_avg: float | None = None
    away_fouls_avg: float | None = None
    home_yellow_cards_avg: float | None = None
    away_yellow_cards_avg: float | None = None

    # -- Advanced Stats Extended (AdvancedStatsFeatureCalculator) --
    away_attacking_momentum: float | None = None
    away_defense_percentile_league: float | None = None
    away_defensive_momentum: float | None = None
    away_goals_autocorr: float | None = None
    away_goals_entropy: float | None = None
    away_goals_ewma_14d: float | None = None
    away_goals_ewma_60d: float | None = None
    away_goals_percentile_league: float | None = None
    away_goals_volatility_last10: float | None = None
    away_goals_xg_correlation: float | None = None
    away_is_outlier_performance: bool | None = None
    away_luck_factor: float | None = None
    away_momentum_composite: float | None = None
    away_possession_goals_correlation: float | None = None
    away_ppg_autocorr: float | None = None
    away_ppg_volatility_season: float | None = None
    away_regression_pressure: float | None = None
    away_result_entropy: float | None = None
    away_xg_ewma_14d: float | None = None
    away_xg_percentile_league: float | None = None
    away_xg_volatility_last10: float | None = None
    home_attacking_momentum: float | None = None
    home_defense_percentile_league: float | None = None
    home_defensive_momentum: float | None = None
    home_goals_autocorr: float | None = None
    home_goals_entropy: float | None = None
    home_goals_ewma_14d: float | None = None
    home_goals_ewma_60d: float | None = None
    home_goals_percentile_league: float | None = None
    home_goals_volatility_last10: float | None = None
    home_goals_xg_correlation: float | None = None
    home_is_outlier_performance: bool | None = None
    home_luck_factor: float | None = None
    home_momentum_composite: float | None = None
    home_possession_goals_correlation: float | None = None
    home_ppg_autocorr: float | None = None
    home_ppg_volatility_season: float | None = None
    home_regression_pressure: float | None = None
    home_result_entropy: float | None = None
    home_xg_ewma_14d: float | None = None
    home_xg_percentile_league: float | None = None
    home_xg_volatility_last10: float | None = None


class WeatherFeaturesMixin(BaseModel):
    """Weather feature fields (WeatherFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    weather_temp_c: float | None = None
    weather_wind_speed_ms: float | None = None
    weather_precipitation_mm: float | None = None
    weather_condition: str | None = None

    # -- Weather Extended (WeatherFeatureCalculator) --
    cloud_cover_pct: float | None = None
    humidity_pct: float | None = None
    is_adverse_weather: bool | None = None
    is_cold_weather: bool | None = None
    is_heavy_rain: bool | None = None
    is_hot_weather: bool | None = None
    is_raining: bool | None = None
    is_windy: bool | None = None
    precipitation_mm: float | None = None
    temperature_celsius: float | None = None
    weather_severity_score: float | None = None
    wind_speed_kmh: float | None = None


class TeamStyleFeaturesMixin(BaseModel):
    """Team style feature fields (TeamStyleFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    away_aerial_dominance: float | None = None
    away_attack_directness: float | None = None
    away_attack_width: float | None = None
    away_attacking_style_clash: float | None = None
    away_counter_attack_opportunity: float | None = None
    away_counter_attack_ratio: float | None = None
    away_cross_reliance: float | None = None
    away_defensive_block_height: float | None = None
    away_defensive_style_clash: float | None = None
    away_game_control: float | None = None
    away_interception_rate: float | None = None
    away_match_tempo: float | None = None
    away_pass_tempo: float | None = None
    away_physical_mismatch: float | None = None
    away_possession_battle: float | None = None
    away_possession_style: float | None = None
    away_ppda_style: float | None = None
    away_press_vs_build: float | None = None
    away_set_piece_reliance: float | None = None
    away_style_similarity: float | None = None
    away_tackle_aggression: float | None = None
    away_tempo_differential: float | None = None
    away_transition_speed: float | None = None
    away_xg_per_shot: float | None = None
    home_aerial_dominance: float | None = None
    home_attack_directness: float | None = None
    home_attack_width: float | None = None
    home_attacking_style_clash: float | None = None
    home_counter_attack_opportunity: float | None = None
    home_counter_attack_ratio: float | None = None
    home_cross_reliance: float | None = None
    home_defensive_block_height: float | None = None
    home_defensive_style_clash: float | None = None
    home_game_control: float | None = None
    home_interception_rate: float | None = None
    home_match_tempo: float | None = None
    home_pass_tempo: float | None = None
    home_physical_mismatch: float | None = None
    home_possession_battle: float | None = None
    home_possession_style: float | None = None
    home_ppda_style: float | None = None
    home_press_vs_build: float | None = None
    home_set_piece_reliance: float | None = None
    home_style_similarity: float | None = None
    home_tackle_aggression: float | None = None
    home_tempo_differential: float | None = None
    home_transition_speed: float | None = None
    home_xg_per_shot: float | None = None


class ManagerFeaturesMixin(BaseModel):
    """Manager feature fields (ManagerFeatureCalculator)."""

    model_config = ConfigDict(frozen=False)

    away_days_since_manager_change: int | None = None
    away_games_under_manager: int | None = None
    away_manager_attack_style: float | None = None
    away_manager_avg_possession: float | None = None
    away_manager_avg_ppda: float | None = None
    away_manager_clean_sheet_rate: float | None = None
    away_manager_defensive_style: float | None = None
    away_manager_goals_per_game: float | None = None
    away_manager_honeymoon: bool | None = None
    away_manager_ppg_last5: float | None = None
    away_manager_set_piece_focus: float | None = None
    away_manager_win_rate: float | None = None
    away_manager_xg_diff_last5: float | None = None
    away_new_manager_flag: bool | None = None
    home_days_since_manager_change: int | None = None
    home_games_under_manager: int | None = None
    home_manager_attack_style: float | None = None
    home_manager_avg_possession: float | None = None
    home_manager_avg_ppda: float | None = None
    home_manager_clean_sheet_rate: float | None = None
    home_manager_defensive_style: float | None = None
    home_manager_goals_per_game: float | None = None
    home_manager_honeymoon: bool | None = None
    home_manager_ppg_last5: float | None = None
    home_manager_set_piece_focus: float | None = None
    home_manager_win_rate: float | None = None
    home_manager_xg_diff_last5: float | None = None
    home_new_manager_flag: bool | None = None
    manager_experience_diff: int | None = None
    manager_h2h_home_wins: int | None = None
    manager_h2h_matches: int | None = None
    manager_trophy_diff: int | None = None


class MarketEfficiencyFeaturesMixin(BaseModel):
    """Market efficiency and structure feature fields."""

    model_config = ConfigDict(frozen=False)

    # -- Market Efficiency (MarketEfficiencyFeatureCalculator) --
    market_betfair_volume_estimate: float | None = None
    market_bookmaker_agreement: float | None = None
    market_bookmaker_count: int | None = None
    market_closing_line_predictability: float | None = None
    market_confidence: float | None = None
    market_data_completeness_score: float | None = None
    market_entropy: float | None = None
    market_gap_max_vs_pinnacle_away: float | None = None
    market_gap_max_vs_pinnacle_draw: float | None = None
    market_gap_max_vs_pinnacle_home: float | None = None
    market_league_liquidity_tier: int | None = None
    market_liquidity_score: float | None = None
    market_max_odds_away: float | None = None
    market_max_odds_draw: float | None = None
    market_max_odds_home: float | None = None
    market_max_stake_estimate: float | None = None
    market_odds_range_home: float | None = None
    market_odds_stability_score: float | None = None
    market_pinnacle_away: float | None = None
    market_pinnacle_draw: float | None = None
    market_pinnacle_home: float | None = None
    market_price_discovery_score: float | None = None
    market_sharp_book_available: bool | None = None
    market_soft_book_value_home: float | None = None

    # -- Market Structure (MarketStructureFeatureCalculator) --
    market_betfair_weight: float | None = None
    market_consensus_confidence: float | None = None
    market_league_avg_margin: float | None = None
    market_league_bookmaker_count_avg: float | None = None
    market_league_closing_line_accuracy: float | None = None
    market_league_efficiency_score: float | None = None
    market_league_exchange_available: bool | None = None
    market_league_odds_variance: float | None = None
    market_league_pinnacle_coverage: bool | None = None
    market_league_sharp_coverage: float | None = None
    market_league_steam_frequency: float | None = None
    market_league_tier: int | None = None
    market_league_total_liquidity: float | None = None
    market_maturity_score: float | None = None
    market_max_min_spread: float | None = None
    market_pinnacle_weight: float | None = None
    market_sharp_book_count: int | None = None
    market_sharp_consensus_away: float | None = None
    market_sharp_consensus_draw: float | None = None
    market_sharp_consensus_home: float | None = None
    market_sharp_soft_delta_away: float | None = None
    market_sharp_soft_delta_draw: float | None = None
    market_sharp_soft_delta_home: float | None = None
    market_sharp_vs_all_weight: float | None = None
    market_soft_consensus_away: float | None = None
    market_soft_consensus_draw: float | None = None
    market_soft_consensus_home: float | None = None
    market_weighted_consensus_home: float | None = None

    # -- Price Dynamics (PriceDynamicsFeatureCalculator) --
    price_acceleration_away_1h: float | None = None
    price_acceleration_away_6h: float | None = None
    price_acceleration_draw_1h: float | None = None
    price_acceleration_draw_6h: float | None = None
    price_acceleration_home_1h: float | None = None
    price_acceleration_home_6h: float | None = None
    price_asian_leads_european: bool | None = None
    price_bet365_lag: float | None = None
    price_book_fragmentation: float | None = None
    price_books_in_sync: float | None = None
    price_market_maker_spread: float | None = None
    price_max_single_move_away: float | None = None
    price_max_single_move_draw: float | None = None
    price_max_single_move_home: float | None = None
    price_path_smoothness: float | None = None
    price_pinnacle_lead_time: float | None = None
    price_sharp_soft_spread_current: float | None = None
    price_steam_bookmaker_sync: int | None = None
    price_steam_detected: bool | None = None
    price_steam_direction: int | None = None
    price_steam_magnitude: float | None = None
    price_steam_recovery: float | None = None
    price_steam_timing: float | None = None
    price_velocity_away_10m: float | None = None
    price_velocity_away_12h: float | None = None
    price_velocity_away_24h: float | None = None
    price_velocity_away_30m: float | None = None
    price_velocity_away_6h: float | None = None
    price_velocity_away_90m: float | None = None
    price_velocity_draw_10m: float | None = None
    price_velocity_draw_12h: float | None = None
    price_velocity_draw_24h: float | None = None
    price_velocity_draw_30m: float | None = None
    price_velocity_draw_6h: float | None = None
    price_velocity_draw_90m: float | None = None
    price_velocity_home_10m: float | None = None
    price_velocity_home_12h: float | None = None
    price_velocity_home_24h: float | None = None
    price_velocity_home_30m: float | None = None
    price_velocity_home_6h: float | None = None
    price_velocity_home_90m: float | None = None
    price_volatility_away_24h: float | None = None
    price_volatility_draw_24h: float | None = None
    price_volatility_home_24h: float | None = None
    price_volatility_ratio: float | None = None
