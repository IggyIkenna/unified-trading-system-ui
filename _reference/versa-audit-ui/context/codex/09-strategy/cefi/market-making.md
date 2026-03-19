# CeFi Market Making

> **Asset class:** CeFi **Strategy type:** Market Making (continuous quoting, inventory management) **Strategy ID
> pattern:** `CEFI_BTC_MM_{VENUE}_EVT_SUB1S`

## Overview

Continuously quote bid/ask on a CeFi exchange (e.g., Binance, Deribit). Earn the spread while managing inventory risk.
The key difference from other strategies: triggered by underlying price moves (event-driven on sub-second threshold),
not by periodic candle features.

## How This Fits the Unified Trading System

Market-making follows the EXACT same architecture as all other strategies. It does NOT bypass the system or stream raw
data. The difference is the trigger frequency and threshold:

```
Same flow:
  features-service (publishes on underlying move > threshold)
    → pub/sub event
      → strategy-service receives event
        → strategy.generate_signal(features, positions, risk)
          → emit StrategyInstruction (update quotes)

Different from DeFi/momentum:
  - Trigger: underlying price change > X bps (not 1H candle)
  - Frequency: sub-second to seconds (not hourly)
  - Action: update bid/ask quotes (not single entry/exit)
  - Always active: no "flat" state, always quoting
```

**Hard rule preserved:** Strategy NEVER streams from market-tick-data-service directly. A features service (e.g.,
`features-delta-one-service` or a dedicated `features-mm-service`) computes the relevant features (mid-price, spread,
volatility, inventory skew) and publishes on meaningful change. Strategy receives pre-computed features only.

## Token / Position Flow

```
Start:  Exchange account with USDT + BTC inventory

Continuous loop (event-driven, on underlying move):
  Step 1 - Receive feature update (mid-price changed by > threshold)
  Step 2 - Calculate fair value, spread, skew
  Step 3 - Cancel stale orders
  Step 4 - Place new bid + ask (limit orders)
  Step 5 - If filled: inventory changes → exposure update → risk check

Wallet state (always):
  - BINANCE:SPOT:BTC     = variable (long inventory, oscillates around target)
  - BINANCE:SPOT:USDT    = variable (short leg of inventory)
  - Open limit orders     = bid + ask quotes
```

## Instruments

| Instrument Key          | Venue   | Type | Role                    |
| ----------------------- | ------- | ---- | ----------------------- |
| `BINANCE:SPOT:BTC-USDT` | Binance | Spot | Quoted pair             |
| `BINANCE:SPOT:USDT`     | Binance | Spot | Quote currency balance  |
| `BINANCE:SPOT:BTC`      | Binance | Spot | Base currency inventory |

## Data Architecture

| Dimension              | Value                                                                                  | SSOT                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Raw data source**    | NEVER direct — via features service                                                    | Hard rule: [config-architecture.md](../cross-cutting/config-architecture.md) |
| **Features consumed**  | `mid_price`, `bid_ask_spread`, `realized_vol`, `orderbook_imbalance`, `inventory_skew` | `features-mm-service` (or features-delta-one)                                |
| **Interval**           | Event-driven on underlying move threshold                                              | NOT time-based                                                               |
| **Trigger threshold**  | Underlying moves > X bps (configurable per strategy config)                            | Strategy trigger subscription                                                |
| **Lowest granularity** | Sub-second (limited by feature publication frequency)                                  | Feature service config                                                       |

## Key Features Consumed

| Feature               | Source Service                    | Trigger            | Used For                    |
| --------------------- | --------------------------------- | ------------------ | --------------------------- |
| `mid_price`           | features-delta-one or features-mm | Change > threshold | Recalculate quotes          |
| `bid_ask_spread`      | features-delta-one                | Change > threshold | Spread decision             |
| `realized_vol`        | features-volatility               | Periodic (1m/5m)   | Spread widening in high vol |
| `orderbook_imbalance` | features-mm                       | Change > threshold | Skew adjustment             |
| `inventory_skew`      | ExposureMonitor                   | Internal threshold | Inventory management        |

## Trigger Model

**This is the key architectural difference from DeFi/momentum strategies.**

All strategies are event-driven (see [config-architecture.md](../cross-cutting/config-architecture.md)). Market-making
just has a different trigger definition:

| Strategy Type     | Trigger Source     | Trigger Condition           | Typical Frequency              |
| ----------------- | ------------------ | --------------------------- | ------------------------------ |
| DeFi Basis        | features-delta-one | New 1H candle features      | Every 1 hour                   |
| Momentum          | features-delta-one | New candle features         | Every 1H-4H                    |
| **Market Making** | features-mm        | **Underlying move > X bps** | **Sub-second to seconds**      |
| Sports Arb        | features-sports    | New odds update             | Event-driven (match-dependent) |

```yaml
# Market-making trigger subscription
trigger_subscriptions:
  - source: features-mm
    filter: mid_price_change_bps > 5 # recalculate on 5bp move
  - source: features-volatility
    filter: realized_vol_changed # widen spread on vol spike
  - source: exposure-monitor
    filter: inventory_skew > 0.1 # rebalance inventory
```

**Gap:** Trigger subscription config doesn't exist as formal schema yet. Currently implicit.

## Instrument Selection

**Currently: STATIC per config (single pair per strategy instance)**

Each market-making strategy instance quotes ONE pair on ONE venue. To market-make BTC-USDT on Binance AND Deribit, you
need two strategy instances with different configs.

**Gap:** No instrument SOR for market-making. Could dynamically select which pairs to quote based on volume/spread
opportunity.

## Smart Order Routing (SOR)

**SOR is NOT applicable in the traditional sense.** Market-making places limit orders on a specific venue — it doesn't
need to route across venues for the same instrument.

However, **cross-venue market-making** (quoting on Binance and hedging on Deribit) would need a form of SOR for the
hedge leg. This is a separate strategy type (cross-exchange arb/MM hybrid).

## PnL Attribution

| Component           | Settlement Type | Mechanism                                           |
| ------------------- | --------------- | --------------------------------------------------- |
| `spread_pnl`        | Per-fill        | `(ask_fill_price - bid_fill_price) * filled_qty`    |
| `inventory_pnl`     | Mark-to-market  | `inventory_qty * (current_price - avg_entry_price)` |
| `trading_pnl`       | Per-fill        | Realized from inventory management trades           |
| `transaction_costs` | Per-fill        | Exchange maker/taker fees                           |

**Source of truth:** `total_pnl = total_balance_value - initial_balance_value` (balance-based).

## Risk & Exposure Subscriptions

### Exposure Subscriptions

| Instrument Pattern  | Exposure Type   | Used For                    |
| ------------------- | --------------- | --------------------------- |
| `BINANCE:SPOT:BTC*` | Inventory value | Inventory skew calculation  |
| `BINANCE:SPOT:USDT` | Quote balance   | Available margin for orders |

### Risk Type Subscriptions

| Risk Type        | Subscribed? | Threshold                       | Action on Breach                |
| ---------------- | ----------- | ------------------------------- | ------------------------------- |
| `delta`          | YES         | Inventory skew > max            | Skew quotes to reduce inventory |
| `liquidity`      | YES         | Spread widens beyond max        | Widen quotes or pause           |
| `venue_protocol` | YES         | Exchange circuit breaker        | Cancel all orders               |
| `concentration`  | YES         | Too much inventory in one asset | Reduce position                 |
| `funding`        | NO          | —                               | No perp positions               |
| `protocol_risk`  | NO          | —                               | CeFi, not DeFi                  |

### Custom Strategy Risk Types

| Custom Risk         | What It Measures                            | Evaluation Method  |
| ------------------- | ------------------------------------------- | ------------------ |
| Adverse selection   | Fill rate on one side >> other side         | `threshold_breach` |
| Inventory half-life | Time to mean-revert inventory to target     | `rate_sensitivity` |
| Quote staleness     | Time since last quote update vs market move | `threshold_breach` |

## Risk Profile

| Metric               | Target       | Notes                                             |
| -------------------- | ------------ | ------------------------------------------------- |
| Target annual return | 15-30%       | Spread capture, depends on volume                 |
| Target Sharpe ratio  | 3.0+         | High frequency = smoother equity curve            |
| Max drawdown         | 5%           | Primarily from adverse selection / inventory risk |
| Max leverage         | 1x           | No leverage (spot only)                           |
| Capital scalability  | $2M per pair | Above this, adverse selection increases           |

## Latency Profile

| Segment                    | p50 Target | p99 Target | Co-location Needed?            |
| -------------------------- | ---------- | ---------- | ------------------------------ |
| Feature update → strategy  | 5ms        | 20ms       | Depends on venue               |
| Strategy → instruction     | 1ms        | 5ms        | —                              |
| Instruction → order placed | 10ms       | 50ms       | **YES for competitive venues** |
| Cancel → confirmed         | 10ms       | 50ms       | **YES**                        |
| **End-to-end**             | **~26ms**  | **~125ms** | **YES for Tier-1 venues**      |

**Co-location decision:** For Binance/Deribit where sub-100ms matters, co-location provides meaningful edge. For less
competitive venues (sports exchanges, DeFi), not needed.

## Execution Details

- **Venues:** Single CeFi exchange per strategy instance
- **Order types:** Limit only (maker fees preferred over taker)
- **Atomic execution required?** No — individual limit orders
- **Gas budget:** N/A (CeFi, no gas)

### Rebalancing

**Trigger type:** Event-driven on inventory skew threshold.

| Level    | Inventory Skew    | Action                                                   |
| -------- | ----------------- | -------------------------------------------------------- |
| Normal   | < 10% from target | Skew quotes (tighten on heavy side, widen on light side) |
| Elevated | > 10% from target | Aggressively skew + place market order to reduce         |
| Critical | > 25% from target | Cancel all quotes, market-sell excess inventory          |

Inventory target is configurable per strategy config. Default: 50/50 BTC/USDT split.

## Margin & Liquidation

- **Margin model:** Spot only — no margin/leverage
- **Liquidation risk:** None (fully funded spot inventory)
- **Inventory risk:** Holding BTC during price drops = mark-to-market loss

## Authentication & Credentials

| Venue   | Secret Name               | Testnet Available?           | Notes                                       |
| ------- | ------------------------- | ---------------------------- | ------------------------------------------- |
| Binance | `binance-api-credentials` | Yes (testnet.binance.vision) | API key + secret, needs trading permissions |

See: [credentials-registry.yaml](../../../unified-trading-pm/credentials-registry.yaml)

## Client Onboarding

See [cross-cutting/client-onboarding.md](../cross-cutting/client-onboarding.md).

**Strategy-specific:**

1. Exchange account per client with trading permissions
2. Pre-fund with initial inventory (BTC + USDT split)
3. Config: `initial_capital`, `spread_bps`, `inventory_target`, `move_threshold_bps`
4. **Restart required?** No — hot-reload via GCS config

## UI Visualisation

### Standard views

- PnL waterfall, position breakdown (from monitoring UI plans)

### Strategy-specific views

- **Live orderbook with our quotes highlighted** — show where our bid/ask sits
- **Inventory skew gauge** — current vs target, with threshold zones
- **Fill rate chart** — bid fills vs ask fills over time (adverse selection detector)
- **Spread vs volatility overlay** — are we widening spread enough in high vol?
- **Quote staleness monitor** — time since last quote update

## Testing Stage Status

| Stage        | Status  | Notes                                                        |
| ------------ | ------- | ------------------------------------------------------------ |
| MOCK         | Pending | Need MockMMDynamics with orderbook simulation                |
| HISTORICAL   | Pending | Need historical orderbook snapshots (Tardis.dev has L2 data) |
| LIVE_MOCK    | Pending | Real orderbook features, paper limit orders                  |
| LIVE_TESTNET | Pending | Binance testnet (testnet.binance.vision)                     |
| BATCH_REAL   | Pending | Historical L2 data replay                                    |
| STAGING      | Pending | Testnet with real timing                                     |
| LIVE_REAL    | Pending | All above + co-location decision                             |

## References

- **Implementation:** TBD — market-making strategy not yet implemented
- **Config schema:** `strategy-service/docs/STRATEGY_MODES.md`
- **Execution adapter:** `unified-trade-execution-interface/` (CeFi adapters)
- **Venue capabilities:**
  [`VENUE_CAPABILITIES`](../../../unified-api-contracts/unified_api_contracts/registry/venue_constants.py)
- **Hard rules:** [config-architecture.md](../cross-cutting/config-architecture.md)
