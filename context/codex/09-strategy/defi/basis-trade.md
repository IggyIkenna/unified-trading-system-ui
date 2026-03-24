# DeFi Basis Trade

> **Asset class:** DeFi **Strategy type:** Basis (delta-neutral funding rate arbitrage) **Strategy ID pattern:**
> `DEFI_ETH_BASIS_SCE_1H`

## Overview

Long spot ETH + short ETH perpetual on Hyperliquid. Delta-neutral: collects funding rate when perps trade at a premium
to spot. The simplest DeFi strategy — no staking, no lending, no flash loans.

## Token / Position Flow

```
Start:  WALLET:SPOT_ASSET:USDT  (100% USDT)

Step 1 - SWAP:     USDT --> ETH          (90% of capital, via Uniswap/Curve SOR)
Step 2 - TRANSFER: USDT --> USDC         (10% to Hyperliquid as margin)
Step 3 - TRADE:    Short ETH-USDC perp   (size = ETH amount from step 1)

Wallet after deploy:
  - WALLET:SPOT_ASSET:ETH              = eth_amount  (long)
  - HYPERLIQUID:PERPETUAL:ETH-USDC     = -eth_amount (short)
  - HYPERLIQUID margin                 = 10% USDC

Net delta = 0 (long spot + short perp cancel)
```

## Instruments

| Instrument Key                                   | Venue       | Type | Role              |
| ------------------------------------------------ | ----------- | ---- | ----------------- |
| `WALLET:SPOT_ASSET:USDT`                         | Wallet      | Spot | Initial capital   |
| `WALLET:SPOT_ASSET:ETH`                          | Wallet      | Spot | Long leg          |
| `HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID` | Hyperliquid | Perp | Short leg (hedge) |

## Key Features Consumed

| Feature        | Source Service     | SLA | Used For                               |
| -------------- | ------------------ | --- | -------------------------------------- |
| `funding_rate` | features-delta-one | 10s | Signal: entry when funding > threshold |
| `eth_price`    | market-tick-data   | 1s  | Position sizing, PnL                   |
| `basis_bps`    | features-delta-one | 10s | Spread monitoring                      |

## Data Architecture

| Dimension              | Value                                                        | SSOT                                |
| ---------------------- | ------------------------------------------------------------ | ----------------------------------- |
| **Raw data source**    | `CloudDataProvider` (live) / `CSVDataProvider` (backtest)    | `strategy-service/config.py`        |
| **Processed data**     | `market_data` dict: `eth_price`, `funding_rate`              | Features hydrated alongside candles |
| **Features**           | `features` dict: `funding_rate`, `basis_bps`                 | `features-delta-one-service`        |
| **Interval**           | Time-driven (candle-based), not event-driven                 | `timeframe` in strategy config      |
| **Lowest granularity** | 1H (currently hardcoded in factory, not configurable)        | `defi_basis.py` factory             |
| **Execution mode**     | `same_candle_exit` — entry and exit can occur in same candle | Strategy config                     |

**Gap:** Timeframe is hardcoded to 1H. Should be configurable via strategy config to support 15m/4H/1D.

## Instrument Selection

**Currently: STATIC (hardcoded per config, no dynamic selection)**

Instruments are set at strategy initialisation and never change:

- Spot: `WALLET:SPOT_ASSET:ETH` — always ETH
- Perp: `HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID` — always ETH-USDC on Hyperliquid

There is **no instrument SOR** — the strategy does NOT dynamically pick BTC vs ETH vs SOL perps based on which has the
best funding rate. This is a gap: an "instrument selection" layer could scan all perp instruments and pick the one with
the highest funding rate above threshold.

**This is different from execution SOR**, which picks the best DEX venue for the same instrument.

**SSOT for instrument types per venue:** See
[`INSTRUMENT_TYPES_BY_VENUE`](../../../unified-api-contracts/unified_api_contracts/registry/venue_constants.py)

## Smart Order Routing (SOR)

**SOR is ON by default for the swap leg only.**

| Leg                    | SOR? | Allowed Venues                                         | SSOT                 |
| ---------------------- | ---- | ------------------------------------------------------ | -------------------- |
| Step 1 (USDT→ETH swap) | YES  | `UNISWAPV3-ETHEREUM`, `CURVE-ETHEREUM`, `BALANCER-ETH` | `defi_base.py:84-86` |
| Step 3 (Short perp)    | NO   | Hyperliquid only (CLOB, no alternative)                | —                    |

SOR picks the best price across DEX venues for the same ERC-20 token on the same chain. The `allowed_venues` list is
passed in `StrategyInstruction` to execution-service, which handles the actual routing. Strategy-service does NOT pick
the venue — it provides the allowed set.

**Same-wallet constraint:** All SOR venues must be on the same blockchain (Ethereum mainnet). SSOT:
[`SHARED_WALLET_GROUPS`](../../../unified-api-contracts/unified_api_contracts/registry/venue_constants.py)

**Execution boundary:** Strategy sends `StrategyInstruction` with `allowed_venues` and `max_slippage_bps`.
Execution-service converts to `ExecutionInstruction`, picks venue, chooses order type (MARKET/LIMIT/TWAP), executes, and
measures alpha vs benchmark.

## PnL Attribution

| Component           | Settlement Type             | Mechanism                                           |
| ------------------- | --------------------------- | --------------------------------------------------- |
| `funding_pnl`       | `FUNDING_8H` (00/08/16 UTC) | `+notional * funding_rate` (positive when rate > 0) |
| `basis_spread_pnl`  | Mark-to-market              | `abs(perp_size) * (last_premium - current_premium)` |
| `trading_pnl`       | Entry/exit fills            | Realized price difference on swap + perp close      |
| `transaction_costs` | Per-fill                    | Swap fee + gas + Hyperliquid taker fee              |

**Source of truth:** `total_pnl = equity_current - equity_initial` (balance-based).

## Risk Profile

| Metric               | Target | Notes                                             |
| -------------------- | ------ | ------------------------------------------------- |
| Target annual return | 8-15%  | Depends on funding rate regime                    |
| Target Sharpe ratio  | 2.0+   | High Sharpe due to delta neutrality               |
| Max drawdown         | 5%     | Primarily from basis spread widening              |
| Max leverage         | 1x     | No leverage (spot + perp hedge)                   |
| Capital scalability  | $5M    | Above this, Hyperliquid funding rate impact grows |

## Latency Profile

| Segment                   | p50 Target | p99 Target | Co-location Needed?   |
| ------------------------- | ---------- | ---------- | --------------------- |
| Market data → feature     | 50ms       | 200ms      | No                    |
| Feature → signal          | 10ms       | 50ms       | No                    |
| Signal → instruction      | 5ms        | 20ms       | No                    |
| Instruction → fill (swap) | 2s         | 15s        | No (on-chain)         |
| Instruction → fill (perp) | 100ms      | 500ms      | No (Hyperliquid CLOB) |
| **End-to-end**            | **~3s**    | **~16s**   | **No**                |

This is a low-frequency strategy (1h candles). Co-location provides no benefit.

## Execution Details

- **Venues:** Uniswap V3 (swap), Hyperliquid (perp)
- **Order types:** Market (swap via SOR), Limit (perp)
- **Atomic execution required?** No — legs are independent
- **Gas budget:** ~200k gas for swap, 0 gas for Hyperliquid (off-chain CLOB)

### Rebalancing

**Trigger type:** Event-driven (NOT periodic). No rebalance without new signal/market data.

| Level    | Position Deviation | Action         | Notes                                     |
| -------- | ------------------ | -------------- | ----------------------------------------- |
| Minor    | >2% delta drift    | LOG_ONLY       | Log deviation, no action                  |
| Major    | >5% delta drift    | REBALANCE      | Adjust perp size to restore delta-neutral |
| Critical | >10% delta drift   | EMERGENCY_EXIT | Full exit both legs                       |

Delta = `abs(spot_exposure + perp_exposure) / notional`. Target = 0. Thresholds from `defi_base.py:_parse_thresholds()`.
SSOT: [`rebalancing_config.yaml`](../../../strategy-service/strategy_service/configs/rebalancing_config.yaml)

## Risk & Exposure Subscriptions

**Flow:** ExposureMonitor (positions → exposures) → RiskMonitor (exposures → risk assessment) → Strategy (risk
assessment → rebalance/exit decisions)

### Exposure Subscriptions

| Instrument Pattern        | Exposure Type         | Used For          |
| ------------------------- | --------------------- | ----------------- |
| `WALLET:SPOT_ASSET:ETH`   | Spot value (long)     | Delta calculation |
| `HYPERLIQUID:PERPETUAL:*` | Perp notional (short) | Delta calculation |

Config: `defi_mode.enabled=True`, `ml_mode.track_perp_positions=True` SSOT:
[`ExposureMonitorConfig`](../../../strategy-service/strategy_service/config.py)

### Risk Type Subscriptions

| Risk Type        | Subscribed?       | Threshold                          | Action on Breach    |
| ---------------- | ----------------- | ---------------------------------- | ------------------- |
| `delta`          | YES               | 2% net delta drift                 | Adjust perp size    |
| `funding`        | YES (signal only) | `min_funding_rate` config param    | Entry/exit decision |
| `basis`          | YES (signal only) | `max_basis_deviation` config param | Entry/exit decision |
| `venue_protocol` | YES               | Hyperliquid circuit breaker state  | Pause trading       |
| `liquidity`      | NO                | —                                  | —                   |
| `protocol_risk`  | NO                | —                                  | No Aave positions   |
| `staking_yield`  | NO                | —                                  | No staking          |
| `borrow_cost`    | NO                | —                                  | No borrowing        |

Config: `enabled_risk_types: ["cex_margin"]`, `defi_risk.enabled=False`, `cex_risk.enabled=True` SSOT:
[`RiskMonitorConfig`](../../../strategy-service/strategy_service/config.py)

**Gap:** Risk subscriptions are implicit in code defaults, not in a machine-readable YAML registry. Plan item
`p5-risk-strategy-subscription` will create `StrategyRiskProfile` per strategy type.

### Custom Strategy Risk Types

| Custom Risk               | What It Measures                                   | Evaluation Method  |
| ------------------------- | -------------------------------------------------- | ------------------ |
| Funding rate regime shift | Sustained negative funding → strategy unprofitable | `threshold_breach` |
| Basis spread blow-out     | Spot-perp spread exceeds historical norms          | `threshold_breach` |

**Gap:** Custom risk types planned (`p5-risk-custom-risk-types`) but not yet implemented.

## Margin & Liquidation

- **Margin model:** Hyperliquid cross-margin on perp side
- **Health factor threshold:** N/A (no Aave positions)
- **Liquidation risk:** Only on Hyperliquid if margin depleted (extreme basis widening)
- **Monitoring:** Margin usage checked per candle, alert at >80%

## Authentication & Credentials

| Venue       | Secret Name                   | Testnet Available?                  | Notes                                   |
| ----------- | ----------------------------- | ----------------------------------- | --------------------------------------- |
| Uniswap V3  | `alchemy-api-key` (RPC)       | Yes (Sepolia)                       | Read: public. Write: wallet private key |
| Hyperliquid | `hyperliquid-api-credentials` | Yes (`api.hyperliquid-testnet.xyz`) | API key + secret                        |
| Wallet      | `wallet-{client}-private-key` | Yes (dev wallet)                    | Signs swap transactions                 |

See: [credentials-registry.yaml](../../../unified-trading-pm/credentials-registry.yaml)

## Client Onboarding

See [cross-cutting/client-onboarding.md](../cross-cutting/client-onboarding.md) for the standard flow.

**Strategy-specific:**

1. Hyperliquid account per client (separate margin)
2. Wallet per client (separate ETH holdings)
3. Config: `initial_capital`, `min_funding_rate`, `max_basis_deviation`
4. **Restart required?** No — hot-reload via GCS config

## UI Visualisation

### Standard views

- PnL waterfall, margin health, position breakdown (from monitoring UI plans)

### Strategy-specific views

- **Funding rate vs basis spread overlay** — time series showing when funding justifies the spread
- **Delta drift chart** — shows how far from delta-neutral over time
- **Funding collection timeline** — 8h settlement markers with cumulative funding

## Testing Stage Status

| Stage        | Status  | Notes                                                 |
| ------------ | ------- | ----------------------------------------------------- |
| MOCK         | Pending | Need MockDeFiDynamics with funding rate oscillation   |
| HISTORICAL   | Pending | Need Hyperliquid funding rate history from Tardis.dev |
| LIVE_MOCK    | Pending | Blocked by feature computation (#6)                   |
| LIVE_TESTNET | Pending | Blocked by Hyperliquid testnet integration            |
| BATCH_REAL   | Pending | Blocked by historical APY storage (#4)                |
| STAGING      | Pending | Tenderly fork + Hyperliquid testnet                   |
| LIVE_REAL    | Pending | All above + real capital approval                     |

## References

- **Implementation:** `strategy-service/strategy_service/engine/strategies/defi_basis.py`
- **Config schema:** `strategy-service/docs/STRATEGY_MODES.md` § DeFi Basis
- **Execution adapter:** `unified-defi-execution-interface/protocols/uniswap.py` + `hyperliquid.py`
- **Settlement:** `strategy-service/strategy_service/engine/core/settlement_service.py`
- **PnL calculator:** `strategy-service/strategy_service/engine/core/pnl_calculator.py`
