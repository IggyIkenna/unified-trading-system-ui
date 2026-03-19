# Sports Halftime ML Strategy

> **Asset class:** Sports **Strategy type:** ML Value Betting (two-phase) **Strategy ID pattern:**
> `SPORTS_HT_ML_{MODEL_ID}`

## Overview

The Halftime ML strategy uses machine learning predictions at two distinct decision points -- pre-game and halftime --
to identify value bets in sports markets. At each phase, a dedicated ML model compares its probability estimates against
bookmaker implied probabilities, and the strategy places Kelly-sized bets when the edge exceeds a configurable
threshold. The strategy supports multiple venue types (exchange and bookmaker) with appropriate order routing via
`BetSide` from unified-api-contracts.

## Token / Position Flow

```
Start:  Bankroll (e.g. 10,000 GBP/USD)

Phase 1 - PRE_GAME:
  ML model predicts match outcome probabilities (home/draw/away)
  Compare model probability vs bookmaker implied probability
  If edge > min_edge_threshold and confidence > confidence_threshold:
    Kelly-size the stake (fractional Kelly, capped at max_stake_fraction)
    Place BACK bet at best-odds venue

Phase 2 - HALFTIME:
  Updated ML model ingests in-play stats (score, xG, possession, shots)
  Re-evaluate: new probability estimates against live halftime odds
  If edge persists:
    Place additional BACK bet sized by Kelly criterion
  If edge reversed:
    No action (close via exchange LAY handled by execution layer)

Settlement:
  Win:  bankroll += stake * (decimal_odds - 1)
  Loss: bankroll -= stake
```

## Instruments

| Instrument Key                  | Venue    | Type     | Role            |
| ------------------------------- | -------- | -------- | --------------- |
| `SPORTS:HT_ML:{MODEL_ID}`       | Multiple | Bet      | Strategy anchor |
| `BETFAIR:EXCHANGE:{EVENT_ID}`   | Betfair  | Exchange | BACK/LAY orders |
| `PINNACLE:BOOKMAKER:{EVENT_ID}` | Pinnacle | Fixed    | BACK only       |
| `BET365:BOOKMAKER:{EVENT_ID}`   | Bet365   | Fixed    | BACK only       |

## Key Features Consumed

| Feature               | Source Service             | SLA | Used For                         |
| --------------------- | -------------------------- | --- | -------------------------------- |
| `team_form_5`         | features-sports-service    | 60s | Pre-game model input             |
| `head_to_head`        | features-sports-service    | 60s | Pre-game model input             |
| `xg_rolling`          | features-sports-service    | 60s | Pre-game + halftime model input  |
| `odds_movement`       | features-sports-service    | 10s | Pre-game edge detection          |
| `possession_pct`      | features-sports-service    | 10s | Halftime model input (live stat) |
| `shots_on_target`     | features-sports-service    | 10s | Halftime model input (live stat) |
| `ht_score`            | unified-market-interface   | 5s  | Halftime context                 |
| `ml_prediction_probs` | ml-inference-api (via UEI) | 30s | Model probability estimates      |

All features arrive via the UEI event bus (PredictionEvent). Strategy never imports from features-sports-service
directly (wrong tier).

## PnL Attribution

| Component      | Settlement Type | Mechanism                                           |
| -------------- | --------------- | --------------------------------------------------- |
| `pre_game_pnl` | `SPORTS_SETTLE` | Pre-game bet settles at match end                   |
| `halftime_pnl` | `SPORTS_SETTLE` | Halftime bet settles at match end                   |
| `commission`   | `EXCHANGE_FEE`  | Exchange commission on net winnings (Betfair ~2-5%) |
| `closing_line` | `CLV_TRACKING`  | Closing line value for model validation             |

**Source of truth:** `total_pnl = settled_returns - total_stakes`. All attribution components must sum to match within
2% annualized tolerance.

## Risk Profile

| Metric              | Target | Notes                                                   |
| ------------------- | ------ | ------------------------------------------------------- |
| Target annual ROI   | 5-15%  | On bankroll, depends on market liquidity and bet volume |
| Target Sharpe ratio | 1.5+   | Measured over rolling 6-month window                    |
| Max drawdown        | 20%    | Bankroll drawdown trigger for strategy pause            |
| Max stake per bet   | 5%     | `max_stake_fraction` of bankroll                        |
| Capital scalability | $100K  | Above this, exchange liquidity and account limits bite  |

## Latency Profile

| Segment                | p50 Target | p99 Target | Co-location Needed? |
| ---------------------- | ---------- | ---------- | ------------------- |
| Feature event -> model | 500ms      | 2s         | No                  |
| Model -> signal        | 50ms       | 200ms      | No                  |
| Signal -> instruction  | 100ms      | 500ms      | No                  |
| Instruction -> fill    | 1s         | 5s         | No                  |
| **End-to-end**         | **1.6s**   | **7.7s**   | **No**              |

Sports betting is latency-tolerant compared to HFT. Pre-game signals have minutes to hours of validity. Halftime signals
have 15-20 minutes. Co-location is not required.

## Execution Details

- **Venues:** Betfair (exchange, BACK/LAY), Pinnacle (bookmaker, BACK), Bet365 (bookmaker, BACK)
- **Order types:** Fixed-odds BACK at bookmakers; limit BACK/LAY on exchanges
- **BetSide routing:** `BetSide.BACK` from `unified_api_contracts.sports` for value entries; `BetSide.LAY` for
  hedging/closing on exchanges (handled by execution layer)
- **Atomic execution required?** No -- bets are independent, no multi-leg atomicity needed
- **Rebalancing:** Event-driven at two fixed decision points (pre-game, halftime); no periodic rebalancing
- **Gas budget:** N/A (fiat betting, no on-chain execution)

### Venue Routing Logic

```
venue_type = strategy.venue_types.get(bookmaker_key, "bookmaker")

if venue_type == "exchange":
    # Betfair, Smarkets, Matchbook
    # Can BACK and LAY
    # Commission: net_winnings_pct (typically 2-5%)
    bet_side = BetSide.BACK  (for value entry)
    # LAY for hedging delegated to execution-service

elif venue_type == "bookmaker":
    # Pinnacle, Bet365, William Hill
    # BACK only
    # Commission: built into odds (vig)
    bet_side = BetSide.BACK
```

## Risk & Exposure Subscriptions

**Flow:** No ExposureMonitor/RiskMonitor for sports strategies. Risk is managed via:

- `max_stake_fraction`: caps individual bet size
- `fractional_kelly`: reduces variance vs full Kelly (typically 0.5 = half-Kelly)
- `confidence_threshold`: minimum model confidence to consider a bet
- `min_edge_threshold`: minimum edge before placing a bet

### Exposure Subscriptions

| Instrument Pattern   | Exposure Type      | Used For                     |
| -------------------- | ------------------ | ---------------------------- |
| `SPORTS:HT_ML:*`     | Open bet liability | Total open exposure tracking |
| `BETFAIR:EXCHANGE:*` | Exchange exposure  | Net position across BACK/LAY |

### Risk Type Subscriptions

| Risk Type         | Subscribed? | Threshold           | Action on Breach         |
| ----------------- | ----------- | ------------------- | ------------------------ |
| `bankroll_dd`     | Yes         | 20% drawdown        | Pause strategy           |
| `daily_loss`      | Yes         | 10% of bankroll/day | Stop betting for the day |
| `concurrent_bets` | Yes         | 10 max              | Queue new bets           |
| `delta`           | No          | --                  | --                       |
| `funding`         | No          | --                  | --                       |
| `protocol_risk`   | No          | --                  | --                       |

### Custom Strategy Risk Types

| Custom Risk              | What It Measures                     | Evaluation Method   | SSOT                              |
| ------------------------ | ------------------------------------ | ------------------- | --------------------------------- |
| Closing line value (CLV) | Whether bets beat the closing line   | `mean_clv_pct`      | `CLVRecord` in UAC sports.betting |
| Model confidence drift   | Model accuracy degradation over time | Rolling accuracy    | ml-inference-api monitoring       |
| Venue account limits     | Risk of account restriction/closure  | Bet volume tracking | Strategy-level metadata           |

## Margin & Liquidation

- **Margin model:** Not applicable (fixed-odds sports betting, no margin)
- **Health factor threshold:** N/A
- **Liquidation penalty:** N/A -- maximum loss per bet is the stake
- **Monitoring:** Daily bankroll reconciliation; CLV tracking per model version

## Authentication & Credentials

Links to SSOT -- do not duplicate:

- **API keys needed:** See [credentials-registry.yaml](../../unified-trading-pm/credentials-registry.yaml)
- **Secret names:** See
  [CredentialsRegistry](../../unified-cloud-interface/unified_cloud_interface/credentials_registry.py)
- **Venue capabilities:** See
  [capability_declarations/](../../unified-api-contracts/unified_api_contracts/registry/capability_declarations/)

| Venue    | Secret Name                      | Testnet Available? | Notes                             |
| -------- | -------------------------------- | ------------------ | --------------------------------- |
| Betfair  | `exec-{client}-betfair-exchange` | No                 | Delayed API for testing available |
| Pinnacle | `exec-{client}-pinnacle-api`     | No                 | Paper trading via odds snapshot   |
| Bet365   | `exec-{client}-bet365-api`       | No                 | Scraper-based, rate limited       |

## Client Onboarding

### Adding a new client to this strategy

1. **Execution accounts:** Betfair exchange account, Pinnacle API account, Bet365 account (optional)
2. **Secret Manager:** `exec-{client}-betfair-exchange`, `exec-{client}-pinnacle-api`
3. **Config:** New YAML in `strategy_service/configs/` with client-specific params (bankroll, Kelly fraction, leagues)
4. **Position isolation:** One strategy instance per (client, sport, league) tuple
5. **Restart required?** No -- hot-reload via UCI config watcher

### Services requiring per-client configuration

| Service           | What Changes                           | Restart?        |
| ----------------- | -------------------------------------- | --------------- |
| strategy-service  | New halftime_ml config YAML in GCS     | No (hot-reload) |
| execution-service | New client routing rule for bet venues | No (hot-reload) |
| ml-inference-api  | Model endpoint already shared          | No              |

## UI Visualisation

### Standard views (already in plans)

- PnL waterfall by bet / by day
- Bankroll equity curve
- Open bets tracker

### Strategy-specific views (extensions)

- Pre-game vs halftime signal comparison chart (edge at each phase)
- Closing line value (CLV) histogram per model version
- Odds movement timeline with signal overlay
- Model confidence calibration plot (predicted vs actual win rate)
- Venue-level ROI breakdown (exchange vs bookmaker)

## Testing Stage Status

| Stage        | Status  | Notes                                        |
| ------------ | ------- | -------------------------------------------- |
| MOCK         | Done    | 22 unit + 8 integration tests with mock data |
| HISTORICAL   | Pending | Requires 180+ days of odds + results data    |
| LIVE_MOCK    | Pending | Live odds feed + paper execution             |
| LIVE_TESTNET | N/A     | No testnet for sports betting venues         |
| BATCH_REAL   | Pending | Historical backtest with real odds snapshots |
| STAGING      | Pending | Paper betting with real odds, no real money  |
| LIVE_REAL    | Pending | Production with real bankroll                |

## Config Reference

### YAML configs

- `strategy_service/configs/halftime_ml_soccer.yaml` -- Soccer (EPL, Champions League)
- `strategy_service/configs/halftime_ml_nba.yaml` -- NBA basketball
- `strategy_service/configs/halftime_ml_nfl.yaml` -- NFL American football

### Key config parameters

| Parameter              | Type      | Default | Description                                   |
| ---------------------- | --------- | ------- | --------------------------------------------- |
| `pre_game_model_id`    | str       | --      | ML model identifier for pre-game predictions  |
| `halftime_model_id`    | str       | --      | ML model identifier for halftime predictions  |
| `confidence_threshold` | float     | 0.55    | Minimum ML confidence to consider a bet       |
| `fractional_kelly`     | float     | 0.5     | Fraction of full Kelly (0.5 = half-Kelly)     |
| `min_edge_threshold`   | float     | 0.03    | Minimum edge (model_prob - implied_prob)      |
| `max_stake_fraction`   | float     | 0.05    | Maximum bet as fraction of bankroll           |
| `supported_markets`    | list[str] | ["h2h"] | Market types: h2h, totals, btts, spreads      |
| `venue_types`          | dict      | --      | Override: venue_key -> "exchange"/"bookmaker" |

### TypedDicts

- `HalftimeMLConfigDict` -- halftime ML config validation (types.py)
- `SportsVenueType` -- exchange vs bookmaker enum (types.py)
- `SportsStrategyConfigDict` -- base sports config (types.py)

## References

- **Strategy implementation:** `strategy-service/strategy_service/engine/strategies/sports/halftime_ml.py`
- **Config schema:** `strategy-service/strategy_service/types.py` (`HalftimeMLConfigDict`)
- **Sports base:** `strategy-service/strategy_service/engine/strategies/sports/sports_base.py`
- **Kelly sizing:** `strategy-service/strategy_service/engine/strategies/sports/kelly.py`
- **BetSide enum:** `unified-api-contracts/unified_api_contracts/canonical/domain/sports/betting.py`
- **CLV tracking:** `unified-api-contracts/unified_api_contracts/canonical/domain/sports/betting.py` (`CLVRecord`)
- **Venue execution:** `unified-api-contracts/unified_api_contracts/canonical/domain/sports/venue_execution.py`
- **YAML configs:** `strategy-service/strategy_service/configs/halftime_ml_*.yaml`
- **Unit tests:** `strategy-service/tests/unit/test_halftime_ml_strategy.py`
- **Integration tests:** `strategy-service/tests/integration/test_halftime_ml_integration.py`
