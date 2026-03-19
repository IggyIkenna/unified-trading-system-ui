# TradFi ML Directional

> **Asset class:** TradFi **Strategy type:** ML Directional **Strategy ID pattern:**
> `TRADFI_{ASSET}_{TYPE}_{MODE}_{TIMEFRAME}` (e.g., `tradfi_spy_ml_directional_v1`)

## Overview

ML-driven directional strategy for traditional finance instruments (equities, ETFs, FX futures, commodity futures).
Consumes prediction scores from ml-inference-api to generate long/short/flat signals. The strategy never accesses raw
market data directly -- all inputs arrive as ML prediction scores (direction + confidence) and the strategy converts
them into sized, risk-managed trade signals routed to IBKR or exchange-specific venues.

Two implementations exist in strategy-service:

1. **TradFiMLDirectionalStrategy** (`engine/strategies/tradfi_ml/`) -- prediction-score-based, standalone class with
   config validation, portfolio exposure caps, and rebalance logic.
2. **TradFiMLSwingStrategy** (`engine/strategies/tradfi_ml_directional.py`) -- swing-prediction-based, extends
   BaseStrategy with SCE/HUF execution modes.

## Token / Position Flow

```
Start:  USD cash in brokerage account (100% USD)

Step 1 - ML PREDICTION: ml-inference-api produces prediction_score [-1, 1] + confidence [0, 1]
Step 2 - SIGNAL: Strategy computes direction (LONG/SHORT/FLAT) from score vs threshold
Step 3 - SIZING: position_size = max_position_usd * |score| * confidence, capped by exposure limit
Step 4 - INSTRUCTION: TradFiMLSignal emitted with direction, size, SL/TP, venue
Step 5 - EXECUTION: execution-service routes to venue (IBKR, CME, NYMEX)

Wallet after deploy:
  - NASDAQ:EQUITY:SPY = sized position (LONG or SHORT)
  - USD cash = remaining capital
```

## Instruments

| Instrument Key      | Venue | Type    | Role                   |
| ------------------- | ----- | ------- | ---------------------- |
| `NASDAQ:EQUITY:SPY` | IBKR  | ETF     | SPY directional        |
| `NASDAQ:EQUITY:QQQ` | IBKR  | ETF     | QQQ directional        |
| `CME:FUTURES:6E`    | CME   | Futures | EUR/USD FX directional |
| `NYMEX:FUTURES:CL`  | NYMEX | Futures | Crude Oil directional  |

## Key Features Consumed

| Feature                 | Source Service   | SLA  | Used For                  |
| ----------------------- | ---------------- | ---- | ------------------------- |
| `prediction_score`      | ml-inference-api | <30s | Direction: LONG/SHORT     |
| `prediction_confidence` | ml-inference-api | <30s | Position sizing (scaling) |
| `momentum`              | features-service | 10s  | ML model input feature    |
| `rsi`                   | features-service | 10s  | ML model input feature    |
| `macd`                  | features-service | 10s  | ML model input feature    |
| `atr`                   | features-service | 10s  | ML model input feature    |
| `vol`                   | features-service | 10s  | ML model input feature    |

## PnL Attribution

| Component          | Settlement Type | Mechanism                                         |
| ------------------ | --------------- | ------------------------------------------------- |
| `directional_pnl`  | MARK_TO_MARKET  | Price change in direction of position             |
| `transaction_cost` | PER_TRADE       | Commissions + spread cost on entry/exit           |
| `slippage`         | PER_TRADE       | Difference between benchmark price and fill price |

**Source of truth:** `total_pnl = equity_current - equity_initial` (balance-based). All attribution components must sum
to match within 2% annualized tolerance.

## Risk Profile

| Metric                 | Target  | Notes                                                       |
| ---------------------- | ------- | ----------------------------------------------------------- |
| Target annual return   | 12-18%  | Depends on asset class and market regime                    |
| Target Sharpe ratio    | 1.2-1.8 | After transaction costs                                     |
| Max drawdown           | 8-10%   | Configurable per asset via `risk_config.max_drawdown_pct`   |
| Max leverage           | 1.0x    | No leverage for equities/ETFs; up to 1x for FX futures      |
| Capital scalability    | $5M     | Above this, market impact degrades returns for single names |
| Max portfolio exposure | 15-20%  | Per-position cap via `max_portfolio_exposure_pct`           |

## Latency Profile

| Segment                | p50 Target | p99 Target | Co-location Needed? |
| ---------------------- | ---------- | ---------- | ------------------- |
| ML inference -> signal | 50ms       | 200ms      | No                  |
| Signal -> instruction  | 5ms        | 20ms       | No                  |
| Instruction -> fill    | 100ms      | 500ms      | No                  |
| **End-to-end**         | **155ms**  | **720ms**  | **No**              |

## Execution Details

- **Venues:** IBKR (equities/ETFs), CME (FX futures), NYMEX (commodity futures)
- **Order types:** Market (default), Limit (configurable via `order_type`)
- **Atomic execution required?** No -- single-leg directional trades
- **Rebalancing:** Every `rebalance_interval_bars` bars (default 12) when direction unchanged. Triggered by config, not
  timer. Adjusts position size based on updated score/confidence.
- **Gas budget:** N/A (not on-chain)
- **Stop-loss:** Configurable `stop_loss_pct` (default 2% of entry)
- **Take-profit:** Configurable `take_profit_pct` (default 4% of entry)

## Risk & Exposure Subscriptions

**Flow:** ExposureMonitor (positions -> exposures) -> RiskMonitor (exposures -> risk assessment) -> Strategy (risk
assessment -> rebalance/exit decisions)

### Exposure Subscriptions

What the ExposureMonitor tracks for this strategy:

| Instrument Pattern | Exposure Type  | Used For                   |
| ------------------ | -------------- | -------------------------- |
| `NASDAQ:EQUITY:*`  | Equity value   | Position mark-to-market    |
| `CME:FUTURES:*`    | Notional value | FX futures exposure        |
| `NYMEX:FUTURES:*`  | Notional value | Commodity futures exposure |

**SSOT:** `component_config.exposure_monitor.instrument_subscriptions` in strategy config. Schema:
[`ExposureMonitorConfig`](../../strategy-service/strategy_service/config.py)

### Risk Type Subscriptions

| Risk Type       | Subscribed? | Threshold                  | Action on Breach       |
| --------------- | ----------- | -------------------------- | ---------------------- |
| `delta`         | Yes         | max_portfolio_exposure_pct | Reduce position to cap |
| `drawdown`      | Yes         | max_drawdown_pct           | EXIT signal            |
| `funding`       | No          | --                         | --                     |
| `basis`         | No          | --                         | --                     |
| `protocol_risk` | No          | --                         | --                     |
| `liquidity`     | Yes         | Low volume warning         | Widen max_slippage_bps |

**SSOT:** `component_config.risk_monitor.enabled_risk_types` in strategy config. Schema:
[`RiskMonitorConfig`](../../strategy-service/strategy_service/config.py)

### Custom Strategy Risk Types

| Custom Risk                 | What It Measures                        | Evaluation Method            | SSOT                      |
| --------------------------- | --------------------------------------- | ---------------------------- | ------------------------- |
| Portfolio concentration     | Single position % of total portfolio    | `max_portfolio_exposure_pct` | TradFiMLDirectionalConfig |
| ML model confidence decay   | Confidence trending below threshold     | Rolling average              | ml-inference-api metrics  |
| Prediction score volatility | Rapid score oscillations (whipsaw risk) | Score std dev                | Strategy internal state   |

## Margin & Liquidation

- **Margin model:** Reg-T for equities (50% initial, 25% maintenance); exchange margin for futures
- **Health factor threshold:** N/A (not DeFi). Margin call at 25% maintenance for equities.
- **Liquidation penalty:** Broker-specific (IBKR: forced liquidation at maintenance margin breach)
- **Monitoring:** ExposureMonitor tracks margin utilization; RiskMonitor triggers position reduction before margin call

## Authentication & Credentials

Links to SSOT -- do not duplicate:

- **API keys needed:** See [credentials-registry.yaml](../../unified-trading-pm/credentials-registry.yaml)
- **Secret names:** See
  [CredentialsRegistry](../../unified-cloud-interface/unified_cloud_interface/credentials_registry.py)
- **Venue capabilities:** See
  [capability_declarations/](../../unified-api-contracts/unified_api_contracts/registry/capability_declarations/)

| Venue | Secret Name               | Testnet Available?  | Notes                      |
| ----- | ------------------------- | ------------------- | -------------------------- |
| IBKR  | `exec-{client}-ibkr-api`  | Yes (paper trading) | TWS or IB Gateway required |
| CME   | `exec-{client}-cme-fix`   | Yes (CME sandbox)   | FIX protocol               |
| NYMEX | `exec-{client}-nymex-fix` | Yes (NYMEX sandbox) | FIX protocol via CME Group |

## Client Onboarding

### Adding a new client to this strategy

1. **Execution accounts:** IBKR paper or live account; CME/NYMEX clearing member account for futures
2. **Secret Manager:** `exec-{client}-ibkr-api`, `exec-{client}-cme-fix` as needed
3. **Config:** New YAML config in `strategy_service/configs/tradfi_ml_directional_{asset}.yaml`
4. **Position isolation:** One strategy instance per (client, instrument) pair
5. **Restart required?** No -- hot-reload via UCI config watcher

### Services requiring per-client configuration

| Service           | What Changes                      | Restart?        |
| ----------------- | --------------------------------- | --------------- |
| strategy-service  | New config YAML entry in GCS      | No (hot-reload) |
| execution-service | New client routing rule for venue | No (hot-reload) |
| ml-inference-api  | Model endpoint per asset class    | No              |

## UI Visualisation

### Standard views (already in plans)

- PnL waterfall (risk matrix plan Stream D)
- Margin health time series (Stream D)
- Position breakdown

### Strategy-specific views (extensions)

- ML prediction score time series with entry/exit overlay
- Confidence vs position size scatter
- Prediction threshold vs realized PnL heatmap
- Rebalance event markers on price chart

## Testing Stage Status

| Stage        | Status  | Notes                                             |
| ------------ | ------- | ------------------------------------------------- |
| MOCK         | Done    | Unit + integration tests with mock ML predictions |
| HISTORICAL   | Pending | Backtest on 2+ years SPY/QQQ/6E/CL data           |
| LIVE_MOCK    | Pending | Real market data + paper execution                |
| LIVE_TESTNET | Pending | IBKR paper trading account                        |
| BATCH_REAL   | Pending | Real historical, config optimised                 |
| STAGING      | Pending | Full pipeline with paper accounts                 |
| LIVE_REAL    | Pending | Production with real capital                      |

## References

- **Strategy implementation (score-based):**
  `strategy-service/strategy_service/engine/strategies/tradfi_ml/tradfi_ml_directional_strategy.py`
- **Strategy implementation (swing-based):**
  `strategy-service/strategy_service/engine/strategies/tradfi_ml_directional.py`
- **Config TypedDict:** `strategy-service/strategy_service/config.py` (`TradFiMLDirectionalConfig`)
- **Config validation:** `validate_config()` in `tradfi_ml_directional_strategy.py`
- **YAML configs:** `strategy-service/strategy_service/configs/tradfi_ml_directional_{spy,qqq,fx}.yaml`
- **Unit tests:** `strategy-service/tests/unit/test_tradfi_ml_directional_strategy.py`
- **Integration tests:** `strategy-service/tests/integration/test_tradfi_ml_directional_integration.py`
- **Strategy modes:** `strategy-service/docs/STRATEGY_MODES.md`
- **Contracts:** `unified-api-contracts/` and `unified-internal-contracts/`
- **Execution adapters:** `unified-trade-execution-interface/`
