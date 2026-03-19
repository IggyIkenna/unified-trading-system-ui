# {STRATEGY_NAME}

> **Asset class:** {DeFi | CeFi | TradFi | Sports | Cross-Asset} **Strategy type:** {Basis | Yield | Momentum | Mean
> Reversion | Arbitrage | Options | Value Betting | ...} **Strategy ID pattern:**
> `{CATEGORY}_{ASSET}_{TYPE}_{INDICATOR}_{MODE}_{TIMEFRAME}`

## Overview

2-3 sentence description of what this strategy does and why it exists.

## Token / Position Flow

Step-by-step flow of what happens when the strategy deploys:

```
Start:  WALLET:SPOT_ASSET:USDT  (100% USDT)

Step 1 - {OPERATION}: {description}
Step 2 - {OPERATION}: {description}
...

Wallet after deploy:
  - {INSTRUMENT_KEY} = {amount} ({long/short})
  - ...
```

## Instruments

| Instrument Key           | Venue  | Type | Role            |
| ------------------------ | ------ | ---- | --------------- |
| `WALLET:SPOT_ASSET:USDT` | Wallet | Spot | Initial capital |
| ...                      | ...    | ...  | ...             |

## Key Features Consumed

| Feature        | Source Service     | SLA | Used For           |
| -------------- | ------------------ | --- | ------------------ |
| `funding_rate` | features-delta-one | 10s | Signal: entry/exit |
| ...            | ...                | ... | ...                |

## PnL Attribution

| Component     | Settlement Type | Mechanism                                 |
| ------------- | --------------- | ----------------------------------------- |
| `funding_pnl` | `FUNDING_8H`    | Short perp receives funding when rate > 0 |
| ...           | ...             | ...                                       |

**Source of truth:** `total_pnl = equity_current - equity_initial` (balance-based). All attribution components must sum
to match within 2% annualized tolerance.

## Risk Profile

| Metric               | Target | Notes                                      |
| -------------------- | ------ | ------------------------------------------ |
| Target annual return | {X%}   |                                            |
| Target Sharpe ratio  | {X}    |                                            |
| Max drawdown         | {X%}   |                                            |
| Max leverage         | {X}x   |                                            |
| Capital scalability  | ${X}M  | Above this, market impact degrades returns |

## Latency Profile

| Segment               | p50 Target | p99 Target | Co-location Needed? |
| --------------------- | ---------- | ---------- | ------------------- |
| Market data → feature | {X}ms      | {X}ms      |                     |
| Feature → signal      | {X}ms      | {X}ms      |                     |
| Signal → instruction  | {X}ms      | {X}ms      |                     |
| Instruction → fill    | {X}ms      | {X}ms      |                     |
| **End-to-end**        | **{X}ms**  | **{X}ms**  | **{Yes/No}**        |

## Execution Details

- **Venues:** {list of venues used}
- **Order types:** {Market, Limit, TWAP, Flash Loan, etc.}
- **Atomic execution required?** {Yes/No — if yes, explain which steps must be atomic}
- **Rebalancing:** {frequency, trigger conditions}
- **Gas budget:** {estimated gas per operation, per rebalance}

## Risk & Exposure Subscriptions

Which risk dimensions this strategy subscribes to. Unsubscribed dimensions = zero in the risk matrix.

**Flow:** ExposureMonitor (positions → exposures) → RiskMonitor (exposures → risk assessment) → Strategy (risk
assessment → rebalance/exit decisions)

### Exposure Subscriptions

What the ExposureMonitor tracks for this strategy:

| Instrument Pattern          | Exposure Type            | Used For                        |
| --------------------------- | ------------------------ | ------------------------------- |
| {e.g., `AAVE_V3:A_TOKEN:*`} | {e.g., Collateral value} | {e.g., Health factor numerator} |
| ...                         | ...                      | ...                             |

**SSOT:** `component_config.exposure_monitor.instrument_subscriptions` in strategy config. Schema:
[`ExposureMonitorConfig`](../../strategy-service/strategy_service/config.py)

### Risk Type Subscriptions

| Risk Type       | Subscribed? | Threshold        | Action on Breach       |
| --------------- | ----------- | ---------------- | ---------------------- |
| `delta`         | {Yes/No}    | {e.g., 2% drift} | {e.g., Rebalance perp} |
| `funding`       | {Yes/No}    | —                | —                      |
| `basis`         | {Yes/No}    | —                | —                      |
| `protocol_risk` | {Yes/No}    | {e.g., HF < 1.2} | {e.g., Emergency exit} |
| `liquidity`     | {Yes/No}    | —                | —                      |
| ...             | ...         | ...              | ...                    |

**SSOT:** `component_config.risk_monitor.enabled_risk_types` in strategy config. Schema:
[`RiskMonitorConfig`](../../strategy-service/strategy_service/config.py) Formal subscription type:
[`StrategyRiskProfile`](../../unified-internal-contracts/unified_internal_contracts/risk.py)

**Gap:** `StrategyRiskProfile` exists in UIC but is NOT yet wired into strategy-service config. Risk subscriptions are
currently implicit in code (per-strategy TypedDict defaults), not in a machine-readable registry. Plan item
`p5-risk-strategy-subscription` in `uac_errors_package_cleanup` will create a YAML-based subscription registry.

### Custom Strategy Risk Types

Strategy-specific risk metrics beyond the standard set:

| Custom Risk                           | What It Measures                         | Evaluation Method  | SSOT          |
| ------------------------------------- | ---------------------------------------- | ------------------ | ------------- |
| {e.g., "ETH borrow rate sensitivity"} | {e.g., PnL impact of +100bp borrow rate} | `rate_sensitivity` | {config path} |
| ...                                   | ...                                      | ...                | ...           |

**Gap:** Custom risk types are planned (plan item `p5-risk-custom-risk-types`) but not yet implemented. Currently no
machine-readable custom risk definitions exist.

## Margin & Liquidation

- **Margin model:** {Cross/Isolated for CeFi, Health Factor for DeFi, Reg-T for TradFi}
- **Health factor threshold:** {minimum before deleverage}
- **Liquidation penalty:** {X% of collateral}
- **Monitoring:** {how often HF is checked, alert thresholds}

## Authentication & Credentials

Links to SSOT — do not duplicate:

- **API keys needed:** See [credentials-registry.yaml](../../unified-trading-pm/credentials-registry.yaml)
- **Secret names:** See
  [CredentialsRegistry](../../unified-cloud-interface/unified_cloud_interface/credentials_registry.py)
- **Venue capabilities:** See
  [capability_declarations/](../../unified-api-contracts/unified_api_contracts/registry/capability_declarations/)

| Venue | Secret Name | Testnet Available? | Notes |
| ----- | ----------- | ------------------ | ----- |
| ...   | ...         | ...                | ...   |

## Client Onboarding

### Adding a new client to this strategy

1. **Execution accounts:** Which venue accounts need to be created?
2. **Secret Manager:** Which per-client secrets? Pattern: `exec-{client}-{venue}-{account_type}`
3. **Config:** New entry in strategy config YAML with client-specific params
4. **Position isolation:** One strategy instance per client (positions diverge due to execution timing)
5. **Restart required?** {Yes — service restart / No — hot-reload via UCI config watcher}

### Services requiring per-client configuration

| Service           | What Changes            | Restart?        |
| ----------------- | ----------------------- | --------------- |
| strategy-service  | New config entry in GCS | No (hot-reload) |
| execution-service | New client routing rule | No (hot-reload) |
| ...               | ...                     | ...             |

## UI Visualisation

### Standard views (already in plans)

- PnL waterfall (risk matrix plan Stream D)
- Margin health time series (Stream D)
- Position breakdown

### Strategy-specific views (extensions)

Describe any visualisation needs that deviate from the standard monitoring UI:

- {e.g., "Funding rate vs basis spread overlay chart"}
- {e.g., "Flash loan gas cost tracker"}
- {e.g., "Health factor with liquidation threshold line"}

## Testing Stage Status

| Stage        | Status         | Notes                                     |
| ------------ | -------------- | ----------------------------------------- |
| MOCK         | {Done/Pending} | Static seed data + paper execution        |
| HISTORICAL   | {Done/Pending} | {X} days data, min sample certified       |
| LIVE_MOCK    | {Done/Pending} | Real market data + paper execution        |
| LIVE_TESTNET | {Done/Pending} | Testnet execution (Sepolia/Holesky/Anvil) |
| BATCH_REAL   | {Done/Pending} | Real historical, config optimised         |
| STAGING      | {Done/Pending} | Tenderly fork + real secrets              |
| LIVE_REAL    | {Done/Pending} | Production mainnet                        |

## References

- **Strategy implementation:** `strategy-service/strategy_service/engine/strategies/{file}.py`
- **Config schema:** `strategy-service/docs/CONFIG_SCHEMA.md`
- **Strategy modes:** `strategy-service/docs/STRATEGY_MODES.md`
- **Contracts:** `unified-api-contracts/` and `unified-internal-contracts/`
- **Execution adapters:** `unified-defi-execution-interface/` or `unified-trade-execution-interface/`
