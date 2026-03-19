# 09 — Strategy Documentation

Canonical reference for all trading strategies in the Unified Trading System. Each strategy has a dedicated document
following the [strategy description template](templates/strategy-description-template.md).

## Organisation

```
09-strategy/
├── cross-cutting/          # Concerns shared by ALL strategies
├── defi/                   # DeFi strategies (4 active)
├── cefi/                   # CeFi strategies (momentum, mean reversion)
├── tradfi/                 # TradFi strategies (ML directional, options)
├── sports/                 # Sports betting strategies (arb, value, ML)
└── templates/              # Strategy description template
```

## Strategy Index

### DeFi (4 strategies + 1 MM)

| Strategy                                                 | File                      | Status        | Capital Target |
| -------------------------------------------------------- | ------------------------- | ------------- | -------------- |
| [Basis Trade](defi/basis-trade.md)                       | `defi_basis.py`           | Code complete | TBD            |
| [Staked Basis](defi/staked-basis.md)                     | `defi_staked_basis.py`    | Code complete | TBD            |
| [AAVE Lending](defi/aave-lending.md)                     | `defi_lending.py`         | Code complete | TBD            |
| [Recursive Staked Basis](defi/recursive-staked-basis.md) | `defi_recursive_basis.py` | Code complete | TBD            |
| [AMM Liquidity Provision](defi/market-making-lp.md)      | TBD                       | Documented    | TBD            |

### CeFi (2 strategies + 1 MM)

| Strategy                                 | File                         | Status        | Capital Target |
| ---------------------------------------- | ---------------------------- | ------------- | -------------- |
| [Momentum](cefi/momentum.md)             | `cefi_momentum.py`           | Code complete | TBD            |
| [Mean Reversion](cefi/mean-reversion.md) | `mean_reversion_strategy.py` | Code complete | TBD            |
| [Market Making](cefi/market-making.md)   | TBD                          | Documented    | TBD            |

### TradFi (2 strategies + 1 MM)

| Strategy                                                 | File                                | Status        | Capital Target |
| -------------------------------------------------------- | ----------------------------------- | ------------- | -------------- |
| [ML Directional](tradfi/ml-directional.md)               | `tradfi_ml_directional_strategy.py` | Code complete | TBD            |
| [Options ML](tradfi/options-ml.md)                       | `options_ml_strategy.py`            | Code complete | TBD            |
| [Options Market Making](tradfi/market-making-options.md) | TBD                                 | Documented    | TBD            |

### Sports (5 strategies + 1 MM)

| Strategy                                 | File                        | Status        | Capital Target |
| ---------------------------------------- | --------------------------- | ------------- | -------------- |
| [Arbitrage](sports/arbitrage.md)         | `arbitrage_strategy.py`     | Code complete | TBD            |
| [Value Betting](sports/value-betting.md) | `value_betting_strategy.py` | Code complete | TBD            |
| [ML Sports](sports/ml-sports.md)         | `ml_sports_strategy.py`     | Code complete | TBD            |
| [Market Making](sports/market-making.md) | `market_making.py`          | Documented    | TBD            |

## Cross-Cutting Concerns

These apply to ALL strategies regardless of asset class:

| Document                                                     | What It Covers                                                        |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| [PnL Attribution](cross-cutting/pnl-attribution.md)          | Balance-based SOT, 7 attribution buckets, 2% reconciliation tolerance |
| [Cost Modeling](cross-cutting/cost-modeling.md)              | Transaction costs, gas, slippage, flash loan fees, opportunity cost   |
| [ML Pipeline](cross-cutting/ml-pipeline.md)                  | Feature ingestion, model lifecycle, signal generation, retraining     |
| [Latency Profiles](cross-cutting/latency-profiles.md)        | p50/p99 targets per segment, co-location decision framework           |
| [Strategy Onboarding](cross-cutting/onboarding-checklist.md) | Checklist for adding a new strategy to the system                     |
| [Client Onboarding](cross-cutting/client-onboarding.md)      | Adding a new client to an existing strategy                           |
| [Config Architecture](cross-cutting/config-architecture.md)  | Config-driven PnL, live=batch parity, hot-reload vs restart           |
| [Margin & Health](cross-cutting/margin-health.md)            | LTV, health factor, liquidation across CeFi/DeFi/TradFi               |
| [Prediction Markets](cross-cutting/prediction-markets.md)    | Polymarket/Kalshi as features, execution, and arb surface             |

## Key Principles

### Hard Rules (MUST NOT be violated)

1. **Strategies NEVER access raw data** — no streaming from market-tick-data-service or market-data-processing-service.
   All data arrives via features or ML inference. Strategy doesn't deal with WebSocket connections, orderbook snapshots,
   or candle assembly. See [config-architecture.md](cross-cutting/config-architecture.md) rule 1.

2. **All strategies are event-driven** — there are no "timer-based" strategies. What looks time-based is actually
   event-driven from upstream feature updates. Market-making triggers on underlying move threshold; DeFi triggers on
   hourly features; sports triggers on odds update. See [config-architecture.md](cross-cutting/config-architecture.md)
   rule 2.

3. **Strategy receives, never calculates** — strategy receives positions (ExposureMonitor), risk assessments
   (RiskMonitor), PnL (PnLCalculator), features (pub/sub). Strategy's only job: decide what to do and emit
   `StrategyInstruction`.

4. **Execution-service executes, strategy decides** — strategy sends instructions with `allowed_venues`,
   `max_slippage_bps`, `benchmark_price`. Execution-service handles SOR, order type selection, fill monitoring, and
   alpha measurement. Strategy never picks execution venue.

### Architecture Principles

5. **Unit of execution: `(strategy_id, client_id, config)`** — positions diverge due to execution timing; shared
   strategy template, isolated instances. Multiple tuples run in one process (async). Same architecture for live and
   batch. See [config-architecture.md](cross-cutting/config-architecture.md) rule 5.

6. **Config-driven, mode-independent** — same PnL calculator, same settlement service, same attribution for live and
   batch. Config defines rules; data defines events; time window is a slice.

7. **Balance-based PnL is source of truth** — `total_pnl = equity_current - equity_initial`. Attribution components must
   sum to match. Unexplained > 2% = alert.

8. **Index-based yield, never APY approximation** — Aave liquidity_index, weETH exchange rate, funding rate settlements.
   APY is display-only for signal generation; never used in PnL.

9. **Hot-reload where possible** — strategy config params reload from GCS via UCI without restart. New strategy types or
   risk types require restart.

## Related SSOTs

- **Strategy implementation:** `strategy-service/strategy_service/engine/strategies/`
- **Config schema:** `strategy-service/docs/CONFIG_SCHEMA.md` + `STRATEGY_MODES.md`
- **Contracts:** `unified-api-contracts/` (external), `unified-internal-contracts/` (internal)
- **Credentials:** `unified-cloud-interface/credentials_registry.py` + `unified-trading-pm/credentials-registry.yaml`
- **Venue capabilities:** `unified-api-contracts/registry/capability_declarations/`
- **Testing stages:** `unified-internal-contracts/` TestingStage enum (planned)
