# DeFi AAVE Lending

> **Asset class:** DeFi **Strategy type:** Pure Lending Yield **Strategy ID pattern:** `DEFI_USDT_LENDING_SCE_1H`

## Overview

Deposit USDT into Aave V3 to earn lending yield. The simplest DeFi yield strategy -- no hedging, no staking, no
leverage. PnL comes entirely from Aave liquidity index growth as borrowers pay interest.

## Token / Position Flow

```
Start:  WALLET:SPOT_ASSET:USDT  (100% USDT)

Step 1 - LEND:  USDT --> aUSDT   (supply to AAVE_V3_ETH)
                You send USDT to Aave Pool contract.
                Aave mints aUSDT to your wallet.
                Records entry_liquidity_index.

Wallet after deploy:
  - AAVE_V3_ETH:A_TOKEN:AUSDT@ETHEREUM = initial_amount (but growing via index)

On exit:
Step 2 - WITHDRAW: aUSDT --> USDT  (burn aUSDT, receive USDT + accrued interest)
```

## Instruments

| Instrument Key                       | Venue   | Type   | Role                   |
| ------------------------------------ | ------- | ------ | ---------------------- |
| `WALLET:SPOT_ASSET:USDT`             | Wallet  | Spot   | Initial capital        |
| `AAVE_V3_ETH:A_TOKEN:AUSDT@ETHEREUM` | Aave V3 | aToken | Yield-bearing position |

## Data Architecture

| Dimension              | Value                                                                             | SSOT                                |
| ---------------------- | --------------------------------------------------------------------------------- | ----------------------------------- |
| **Raw data source**    | `CloudDataProvider` (live) / `CSVDataProvider` (backtest)                         | `strategy-service/config.py`        |
| **Processed data**     | `market_data` dict: `aave_supply_apy`, `aave_utilization`, `aave_liquidity_index` | Features hydrated alongside candles |
| **Features**           | `features` dict: `aave_supply_apy`, `aave_utilization`, `aave_liquidity_index`    | `features-onchain-service`          |
| **Interval**           | Time-driven (candle-based), not event-driven                                      | `timeframe` in strategy config      |
| **Lowest granularity** | 1H (currently hardcoded in factory, not configurable)                             | `defi_lending.py` factory           |
| **Execution mode**     | `same_candle_exit` — entry and exit can occur in same candle                      | Strategy config                     |

**Gap:** Timeframe is hardcoded to 1H. For a pure lending strategy, longer timeframes (4H/1D) would reduce gas costs.

## Instrument Selection

**Currently: STATIC (supply token configurable at init, not dynamic)**

The supply token is a factory parameter (`supply_token="USDT"`) set once at initialisation:

- Instrument: `AAVE_V3_ETH:A_TOKEN:A{supply_token}@ETHEREUM`

There is **no dynamic token selection** — the strategy does NOT compare USDT vs USDC vs DAI supply APYs and pick the
best one. This is a gap: a "lending SOR" could select the highest-yielding stablecoin that meets utilization and
withdrawal risk thresholds.

**SSOT for venue capabilities:** See
[`VENUE_CAPABILITIES`](../../../unified-api-contracts/unified_api_contracts/registry/venue_constants.py)

## Smart Order Routing (SOR)

**SOR is NOT used for this strategy.** Pure lending has no swap leg — only LEND/WITHDRAW operations directly with Aave
V3. There are no alternative venues for the same aToken.

**Future consideration:** If the strategy expanded to compare Aave vs Morpho vs Compound for the same stablecoin,
SOR-like logic could pick the highest-yielding protocol. This would be "protocol SOR" rather than "venue SOR".

## Aave V3 aToken Mechanics

aUSDT is internally tracked using **scaled balances** and a **liquidity index**:

- **At deposit:** `scaledBalance = amount / liquidityIndex_at_deposit`
- **At any time:** `actualBalance = scaledBalance * currentLiquidityIndex`
- **RAY = 10^27** (Aave precision unit)
- `liquidityIndex` starts at 1.0 \* RAY and **monotonically increases** as borrowers pay interest
- Your visible balance grows with every block -- no claim action needed
- When you withdraw: burn aUSDT, receive USDT (now > initial amount)

**This is NOT an APY approximation.** The system reads `liquidityIndex` directly from on-chain
(`pool.functions.getReserveData(token).call()`) and calculates yield from actual index changes:

```
yield = position_size * (current_index - last_index) / last_index
```

## Key Features Consumed

| Feature                | Source Service   | SLA | Used For                                 |
| ---------------------- | ---------------- | --- | ---------------------------------------- |
| `aave_supply_apy`      | features-onchain | 60s | Signal: deploy if APY >= threshold       |
| `aave_utilization`     | features-onchain | 60s | Risk: high utilization = withdrawal risk |
| `aave_liquidity_index` | features-onchain | 60s | PnL: actual yield calculation            |

## PnL Attribution

| Component           | Settlement Type           | Mechanism                                                   |
| ------------------- | ------------------------- | ----------------------------------------------------------- |
| `lending_yield_pnl` | `AAVE_INDEX` (per candle) | `position_size * (current_index - last_index) / last_index` |
| `transaction_costs` | Per-fill                  | Gas for supply (~200k) and withdraw (~250k)                 |

**Source of truth:** `total_pnl = aUSDT_balance * price - initial_deposit` (balance-based).

Settlement service applies AAVE_INDEX events directly to position sizes -- the position balance grows to reflect actual
on-chain aToken balance. The `lending_yield_pnl` attribution bucket captures the same delta for PnL reporting.

**Entry/exit logic (signal generation only, NOT PnL):**

```
Deploy if: aave_supply_apy >= MIN_APY_THRESHOLD (e.g., 3%)
Exit if:   aave_supply_apy < 50% of MIN_APY_THRESHOLD
           OR aave_utilization > 95% (withdrawal risk)
```

## Risk Profile

| Metric               | Target | Notes                                                         |
| -------------------- | ------ | ------------------------------------------------------------- |
| Target annual return | 3-8%   | Varies with Aave utilization and market demand                |
| Target Sharpe ratio  | 3.0+   | Very stable -- yield accrues monotonically                    |
| Max drawdown         | 1%     | Primarily from gas costs on entry/exit during low-APY periods |
| Max leverage         | 1x     | No leverage                                                   |
| Capital scalability  | $50M+  | Aave V3 USDT pool has $1B+ TVL                                |

## Latency Profile

| Segment                               | p50 Target | p99 Target | Co-location Needed?          |
| ------------------------------------- | ---------- | ---------- | ---------------------------- |
| Market data -> feature                | 100ms      | 500ms      | No                           |
| Feature -> signal                     | 10ms       | 50ms       | No                           |
| Signal -> instruction                 | 5ms        | 20ms       | No                           |
| Instruction -> fill (supply/withdraw) | 2s         | 30s        | No (on-chain, gas dependent) |
| **End-to-end**                        | **~3s**    | **~31s**   | **No**                       |

Extremely low-frequency. Decisions made on 1h+ candles. Speed is irrelevant.

## Execution Details

- **Venues:** Aave V3 (Ethereum mainnet)
- **Order types:** Supply (deposit), Withdraw (redeem)
- **Atomic execution required?** No -- single transaction per operation
- **Gas budget:** ~200k gas for supply, ~250k for withdraw

### Rebalancing

**Trigger type:** Event-driven (NOT periodic). No rebalance without new market data.

This strategy has **no delta to rebalance** — it's a single lending position. Rebalancing only applies to entry/exit
decisions based on APY and utilization thresholds.

| Level    | Condition                          | Action         | Notes                |
| -------- | ---------------------------------- | -------------- | -------------------- |
| Minor    | >5% APY drift from entry           | LOG_ONLY       | Log APY change       |
| Major    | >10% APY drift OR utilization >90% | REBALANCE      | Consider exit        |
| Critical | >20% APY drift OR utilization >95% | EMERGENCY_EXIT | Withdraw immediately |

Thresholds from `defi_base.py:_parse_thresholds()` — wider than basis strategies because lending is lower risk. SSOT:
[`rebalancing_config.yaml`](../../../strategy-service/strategy_service/configs/rebalancing_config.yaml)

## Risk & Exposure Subscriptions

**Flow:** ExposureMonitor (positions → exposures) → RiskMonitor (exposures → risk assessment) → Strategy (risk
assessment → rebalance/exit decisions)

### Exposure Subscriptions

| Instrument Pattern       | Exposure Type                      | Used For         |
| ------------------------ | ---------------------------------- | ---------------- |
| `AAVE_V3:A_TOKEN:*`      | aToken balance (growing via index) | Yield tracking   |
| `WALLET:SPOT_ASSET:USDT` | Wallet balance (pre/post deploy)   | Capital tracking |

Config: `defi_mode.enabled=True`, `defi_mode.track_aave_positions=True` SSOT:
[`ExposureMonitorConfig`](../../../strategy-service/strategy_service/config.py)

### Risk Type Subscriptions

| Risk Type          | Subscribed? | Threshold              | Action on Breach                    |
| ------------------ | ----------- | ---------------------- | ----------------------------------- |
| `protocol_risk`    | YES         | Aave utilization > 95% | Emergency withdraw                  |
| `liquidity`        | YES         | Aave utilization > 90% | Alert, consider exit                |
| `staking_yield`    | NO          | —                      | No staking                          |
| `delta`            | NO          | —                      | No delta exposure (single position) |
| `funding`          | NO          | —                      | No perp positions                   |
| `basis`            | NO          | —                      | No basis trade                      |
| `borrow_cost`      | NO          | —                      | No borrowing                        |
| `aave_liquidation` | NO          | —                      | No debt = no liquidation risk       |
| `venue_protocol`   | NO          | —                      | Single venue (Aave V3)              |

Config: `enabled_risk_types: ["aave_liquidation"]` (for utilization monitoring), `defi_risk.enabled=True`,
`defi_risk.aave_liquidation=True` SSOT: [`RiskMonitorConfig`](../../../strategy-service/strategy_service/config.py)

Note: `aave_liquidation` is enabled in config even though there's no debt — the RiskMonitor uses this flag to also
monitor utilization risk (which affects withdrawal ability).

**Gap:** Risk subscriptions are implicit in code defaults. Plan item `p5-risk-strategy-subscription` will create
`StrategyRiskProfile` per strategy type.

### Custom Strategy Risk Types

| Custom Risk              | What It Measures                                     | Evaluation Method  |
| ------------------------ | ---------------------------------------------------- | ------------------ |
| Utilization spike risk   | Aave utilization approaches 100% → can't withdraw    | `threshold_breach` |
| Supply APY collapse      | APY drops below profitable threshold after gas costs | `rate_sensitivity` |
| Protocol governance risk | Aave governance changes reserve parameters           | monitoring only    |

**Gap:** Custom risk types planned (`p5-risk-custom-risk-types`) but not yet implemented.

## Margin & Liquidation

- **Margin model:** None -- this is a supply-only position (no borrowing)
- **Health factor threshold:** N/A (no debt)
- **Liquidation risk:** Zero (no collateral/debt relationship)
- **Withdrawal risk:** If Aave utilization hits 100%, cannot withdraw until borrowers repay
- **Smart contract risk:** Aave V3 has been audited extensively but protocol risk always exists
- **Monitoring:** Utilization rate checked per candle; alert at >90%

## Authentication & Credentials

| Venue             | Secret Name                   | Testnet Available? | Notes                               |
| ----------------- | ----------------------------- | ------------------ | ----------------------------------- |
| Aave V3 (via RPC) | `alchemy-api-key`             | Yes (Sepolia)      | Aave V3 deployed on Sepolia testnet |
| Wallet            | `wallet-{client}-private-key` | Yes (dev wallet)   | Signs supply/withdraw transactions  |

See: [credentials-registry.yaml](../../../unified-trading-pm/credentials-registry.yaml)

## Client Onboarding

See [cross-cutting/client-onboarding.md](../cross-cutting/client-onboarding.md) for the standard flow.

**Strategy-specific:**

1. Wallet per client (separate aUSDT holdings)
2. No venue accounts needed (Aave is permissionless -- interact via wallet)
3. Config: `initial_capital`, `min_apy_threshold` (default 3%)
4. **Restart required?** No -- hot-reload via GCS config

## UI Visualisation

### Standard views

- PnL waterfall, position breakdown (from monitoring UI plans)
- Margin health is N/A for this strategy (no debt)

### Strategy-specific views

- **Aave supply APY time series** -- current APY vs threshold, with utilization overlay
- **Liquidity index growth chart** -- monotonically increasing, shows compounding
- **Utilization rate monitor** -- with 90% and 95% alert zones
- **Yield comparison panel** -- Aave vs Morpho vs Euler vs Compound (which has best rate now)

## Testing Stage Status

| Stage        | Status  | Notes                                                                 |
| ------------ | ------- | --------------------------------------------------------------------- |
| MOCK         | Pending | Need MockDeFiDynamics with utilization-driven APY spikes              |
| HISTORICAL   | Pending | Aave liquidity_index available since V3 launch via AaveScan/Graph     |
| LIVE_MOCK    | Pending | Blocked by features-onchain aave_supply_apy calculator (#6)           |
| LIVE_TESTNET | Pending | Aave V3 on Sepolia -- testnet contract addresses needed (#3)          |
| BATCH_REAL   | Pending | Best data availability of all DeFi strategies (full on-chain history) |
| STAGING      | Pending | Tenderly fork                                                         |
| LIVE_REAL    | Pending | All above + real capital approval                                     |

## References

- **Implementation:** `strategy-service/strategy_service/engine/strategies/defi_lending.py`
- **Config schema:** `strategy-service/docs/STRATEGY_MODES.md`
- **Aave connector:** `unified-defi-execution-interface/protocols/aave.py`
- **Aave positions:** `unified-market-interface/adapters/defi/aave_positions.py`
- **Settlement:** `strategy-service/strategy_service/engine/core/settlement_service.py`
- **PnL calculator:** `strategy-service/strategy_service/engine/core/pnl_calculator.py`
