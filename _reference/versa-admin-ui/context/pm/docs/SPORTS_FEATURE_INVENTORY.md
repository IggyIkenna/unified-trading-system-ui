# Sports Feature Inventory

Reference for sports migration master plan. SSOT: archive sources.

## Archive Sources

| Source                           | Path                                     | Package                | Feature Count |
| -------------------------------- | ---------------------------------------- | ---------------------- | ------------- |
| sports-betting-services-previous | archive/sports-betting-services-previous | footballbets           | 857           |
| sports-betting-service           | archive/sports-betting-service           | sports_betting_service | 26 modules    |

## sports-betting-services-previous (footballbets)

**Catalog:** footballbets/features/docs/core/FEATURES_CATALOG.md

| Category  | Count   |
| --------- | ------- |
| MARKET    | 108     |
| TEAM      | 262     |
| LEAGUE    | 27      |
| H2H       | 20      |
| LINEUP    | 40      |
| REFEREE   | 20      |
| WEATHER   | 10      |
| HT        | 8       |
| OTHER     | 356     |
| **Total** | **857** |

## sports-betting-service

**Feature modules:** sports_betting_service/app/core/features/ (26 modules)

- advanced_features_service, advanced_xg_features_service
- features_service, feature_selector, feature_groups
- inplay_event_service, inplay_state_service
- market_dynamics_service, market_response_service
- pinnacle_features_service, player_fatigue_service
- poisson_priors_service, pseudo_tracking_service
- sentiment_features_service, sentiment_family_mapper
- shot_level_xg_service, squad_value_service
- tactical_style_service, target_service
- time_since_feature_service, visualize_service
- weather_features_service

**Additional:** Betfair historical, 1-min candles, CLV, CatBoost.

## Target

1000+ features across both archives + planned (HT arbitrage, ML schedule predictions, GCS migration).
