# Sports Market Making

> **Asset class:** Sports **Strategy type:** Market Making (two-way quoting on betting exchange) **Strategy ID
> pattern:** `SPORTS_{SPORT}_{MARKET}_MM_{VENUE}_EVT`

## Overview

Two-way quoting (back + lay) on a sports betting exchange (Betfair, Smarkets, Betdaq). Earn the spread between back and
lay odds around a theoretical fair price. The sports equivalent of market-making: post bids (backs) and offers (lays) on
an outcome, manage exposure inventory.

Key difference from CeFi MM: no continuous underlying price — the "underlying" is the implied probability of an outcome,
derived from the market odds themselves. Market suspensions (goals, red cards) halt all trading.

## How This Fits the Unified Trading System

Same event-driven architecture. The "underlying" is the odds market itself:

```
features-sports-service (publishes: theo_price, back_price, lay_price, suspension_state)
  → pub/sub event (on odds move > threshold)
    → strategy-service receives event
      → strategy.generate_signal(features, positions, risk)
        → emit StrategyInstruction (place back + lay at theo ± spread)
```

**Ref underlying for sports:** The market mid-price (vig-free average of best back and lay). Betfair is typically the
"lead" exchange — its odds move first and inform other venues.

## Token / Position Flow

```
Start:  Exchange account with GBP balance

Continuous loop (event-driven, on odds move):
  Step 1 - Receive feature update (odds changed by > threshold)
  Step 2 - Calculate theo, spread, skew based on model + exposure
  Step 3 - Cancel stale orders (or let marketVersion lapse them)
  Step 4 - Place back at theo - half_spread, lay at theo + half_spread
  Step 5 - If filled: exposure changes → risk check

Position state:
  - Net exposure per outcome (backed = long, laid = short)
  - Inventory oscillates around target (typically flat across all outcomes)
```

## Instruments

| Instrument Key                              | Venue   | Type   | Role             |
| ------------------------------------------- | ------- | ------ | ---------------- |
| `BETFAIR:MATCH_ODDS:MAN_UTD_V_ARSENAL@HOME` | Betfair | Sports | Home win outcome |
| `BETFAIR:MATCH_ODDS:MAN_UTD_V_ARSENAL@DRAW` | Betfair | Sports | Draw outcome     |
| `BETFAIR:MATCH_ODDS:MAN_UTD_V_ARSENAL@AWAY` | Betfair | Sports | Away win outcome |

## Key Features Consumed

| Feature                    | Source Service  | Trigger                   | Used For                 |
| -------------------------- | --------------- | ------------------------- | ------------------------ |
| `theo_price`               | features-sports | Odds move > threshold     | Fair value for quoting   |
| `back_price` / `lay_price` | features-sports | Odds move                 | Current market state     |
| `market_suspended`         | features-sports | Immediate                 | HALT all quoting         |
| `suspension_reason`        | features-sports | On suspension             | Goal/RedCard/Penalty/VAR |
| `model_probability`        | ml-inference    | New prediction            | Theo adjustment          |
| `sharp_book_odds`          | features-sports | Pinnacle/other sharp move | Theo calibration         |

## Data Architecture

| Dimension              | Value                                               | SSOT                          |
| ---------------------- | --------------------------------------------------- | ----------------------------- |
| **Raw data source**    | NEVER direct — via features-sports-service          | Hard rule                     |
| **Features consumed**  | Odds, theo, suspension state                        | `features-sports-service`     |
| **Interval**           | Event-driven on odds move > threshold               | Strategy trigger subscription |
| **Lowest granularity** | Sub-second (Betfair Stream API publishes on change) | Feature service config        |

## Market Suspensions

**Critical for sports MM.** During suspension, NO orders can be placed, cancelled, or modified.

| Suspension Reason | Trigger               | Duration | Strategy Action                                          |
| ----------------- | --------------------- | -------- | -------------------------------------------------------- |
| Goal              | Goal scored           | 30-120s  | All quotes auto-lapse (marketVersion). Recalculate theo. |
| Red Card          | Red card shown        | 15-60s   | Recalculate theo (team weakened)                         |
| Penalty           | Penalty awarded       | 30-90s   | Recalculate theo (high-impact event)                     |
| VAR Review        | VAR check in progress | Variable | Cancel-on-resume, recalculate                            |
| Half Time         | Interval              | ~15min   | No action needed (market reforms at HT)                  |

**marketVersion protection:** Pass `marketVersion` with every `placeOrders` call. If the market has been suspended and
reformed since the version you passed, your order is automatically rejected. This prevents stale quotes from being
matched post-suspension.

> **TODO — CODIFY:** `BetfairAdapter` in USEI needs to: (a) Pass `marketVersion` on all placeOrders calls (b) Subscribe
> to suspension events from Betfair Stream API (c) Emit `MARKET_SUSPENDED` / `MARKET_RESUMED` events via UEI (d)
> Strategy-service must handle these events (halt quoting on suspend, recalculate on resume)

## Batch Operations

Betfair API supports batch operations within a single market:

| Operation              | API Call        | Batch?                                          | Notes                    |
| ---------------------- | --------------- | ----------------------------------------------- | ------------------------ |
| Place multiple orders  | `placeOrders`   | YES — array of PlaceOrderInstruction            | One market per call      |
| Cancel all orders      | `cancelOrders`  | YES — empty instructions = cancel ALL on market | Mass cancel              |
| Cancel specific        | `cancelOrders`  | YES — array of CancelOrderInstruction           | Selective cancel         |
| Replace (cancel+place) | `replaceOrders` | YES — atomic cancel+place per order             | NOT atomic across orders |

> **TODO — CODIFY:** `VenueCapability` in UAC `venue_constants.py` needs new capabilities:
>
> - `BATCH_PLACE` — can submit multiple orders in one API call
> - `BATCH_CANCEL` — can cancel multiple/all orders in one call
> - `REPLACE_ORDER` — can atomically cancel+replace a single order
> - `CANCEL_ALL_MARKET` — can cancel all orders on a market in one call
> - `MARKET_VERSION_SAFETY` — supports marketVersion for stale-quote protection
>
> These apply to: Betfair (all), Smarkets (BATCH_PLACE, BATCH_CANCEL), Kalshi (BATCH_PLACE). CeFi exchanges also need
> some: Binance (BATCH_PLACE via batch endpoint), Deribit (mass cancel).
>
> Execution-service should validate: if strategy sends batch instructions for a venue without BATCH_PLACE, fall back to
> sequential submission.

## Theo Price Sources

Strategy config selects theo source:

| Source         | How                                        | When to Use               |
| -------------- | ------------------------------------------ | ------------------------- |
| `vig_free_avg` | Average of best back and lay, vig removed  | Simple, default           |
| `sharp_book`   | Pinnacle/sharp bookmaker odds              | When sharp odds available |
| `model`        | ML model probability                       | When model is calibrated  |
| `hybrid`       | Weighted blend of model + market           | Most robust               |
| `consensus`    | Weighted average across multiple exchanges | Multi-venue               |
| `ml_model`     | Pure ML prediction                         | High-confidence model     |

SSOT: `strategy-service/engine/strategies/sports/market_making.py` — `SportsMarketMakingStrategy`

## PnL Attribution

| Component           | Settlement Type | Mechanism                                                  |
| ------------------- | --------------- | ---------------------------------------------------------- |
| `spread_pnl`        | Per-fill        | `(lay_fill_odds - back_fill_odds) / lay_fill_odds * stake` |
| `inventory_pnl`     | Settlement      | Outcome occurs: profit/loss on net exposure                |
| `trading_pnl`       | Per-fill        | Realized from inventory management trades                  |
| `transaction_costs` | Per-fill        | Betfair commission (2-5% on net profit)                    |

**Source of truth:** `total_pnl = current_balance - initial_balance` (balance-based).

## Risk & Exposure Subscriptions

### Risk Type Subscriptions

| Risk Type           | Subscribed? | Threshold                             | Action on Breach                   |
| ------------------- | ----------- | ------------------------------------- | ---------------------------------- |
| `delta`             | YES         | Net exposure > max per outcome        | Skew quotes to reduce              |
| `market_suspension` | YES         | Immediate on suspension               | Halt all quoting                   |
| `edge_decay`        | YES         | Theo confidence drops below threshold | Widen spread or pause              |
| `concentration`     | YES         | Too much exposure on one outcome      | Reduce position                    |
| `venue_protocol`    | YES         | Exchange API issues                   | Cancel all orders                  |
| `liquidity`         | NO          | —                                     | Sports liquidity is fixed by match |

### Custom Strategy Risk Types

| Custom Risk              | What It Measures                            | Evaluation Method  |
| ------------------------ | ------------------------------------------- | ------------------ |
| Adverse selection        | Getting picked off by sharp bettors         | `threshold_breach` |
| In-play latency          | Our quote update speed vs suspension speed  | `threshold_breach` |
| Match state sensitivity  | How much does our theo change on goal/card? | `scenario_pnl`     |
| Settlement concentration | Too many open markets settling at same time | `threshold_breach` |

## Risk Profile

| Metric               | Target        | Notes                                               |
| -------------------- | ------------- | --------------------------------------------------- |
| Target annual return | 10-20%        | Spread capture, depends on volume and edge          |
| Target Sharpe ratio  | 2.0+          | Diversified across many matches                     |
| Max drawdown         | 10%           | Adverse selection + wrong theo                      |
| Max leverage         | 1x            | No leverage                                         |
| Capital scalability  | $1M per sport | Above this, adverse selection from sharps increases |

## Latency Profile

| Segment                    | p50 Target | p99 Target | Co-location Needed?       |
| -------------------------- | ---------- | ---------- | ------------------------- |
| Feature → strategy         | 10ms       | 50ms       | No                        |
| Strategy → instruction     | 2ms        | 10ms       | No                        |
| Instruction → order placed | 50ms       | 200ms      | Helpful but not critical  |
| Cancel → confirmed         | 50ms       | 200ms      | Helpful                   |
| **End-to-end**             | **~112ms** | **~460ms** | **Helpful, not required** |

Sports MM is less latency-sensitive than CeFi MM because:

- In-play delay (1-12s) built into exchange protects against stale quotes
- marketVersion provides structural protection
- Competition is lower than CeFi HFT

## Execution Details

- **Venues:** Betfair Exchange (primary), Smarkets, Betdaq
- **Order types:** Limit (back/lay) — no market orders on exchanges
- **Atomic execution required?** No — individual limit orders
- **Gas budget:** N/A (no blockchain)

### Rebalancing

**Trigger type:** Event-driven on exposure imbalance.

| Level    | Exposure Imbalance     | Action                                      |
| -------- | ---------------------- | ------------------------------------------- |
| Normal   | Within target range    | Skew quotes (tighter on heavy side)         |
| Elevated | > 1 standard position  | Aggressively skew + reduce                  |
| Critical | > 2 standard positions | Cancel all, market-cross to reduce exposure |

**No periodic rebalancing.** Once a bet is placed, you hold until settlement (match result). You can only reduce
exposure by taking the opposite side at current market odds.

## Authentication & Credentials

| Venue    | Secret Name               | Testnet Available?   | Notes                           |
| -------- | ------------------------- | -------------------- | ------------------------------- |
| Betfair  | `betfair-api-credentials` | NO (real money only) | app_key + session_token (SSOID) |
| Smarkets | `smarkets-api-key`        | NO                   | API key                         |

See: [credentials-registry.yaml](../../../unified-trading-pm/credentials-registry.yaml)

**NOTE:** Sports betting exchanges have NO testnet. Testing requires real money on a test account with small stakes.
This is documented in the testing progression.

## Testing Stage Status

| Stage        | Status  | Notes                                                               |
| ------------ | ------- | ------------------------------------------------------------------- |
| MOCK         | Pending | Need MockSportsExchange with odds simulation + suspension events    |
| HISTORICAL   | Pending | Need historical Betfair odds data (Betfair historical data product) |
| LIVE_MOCK    | Pending | Real odds features, paper betting                                   |
| LIVE_TESTNET | N/A     | **No testnet exists** — skip to real with small stakes              |
| BATCH_REAL   | Pending | Historical odds replay                                              |
| STAGING      | N/A     | Real account, small stakes (£1-£5 per bet)                          |
| LIVE_REAL    | Pending | Scale up stake sizes after validation                               |

## References

- **Implementation:** `strategy-service/engine/strategies/sports/market_making.py`
- **Betfair adapter:** `unified-sports-execution-interface/adapters/exchanges/betfair.py`
- **Betfair market data:** `unified-market-interface/adapters/sports/betfair_adapter.py`
- **Hard rules:** [config-architecture.md](../cross-cutting/config-architecture.md)
