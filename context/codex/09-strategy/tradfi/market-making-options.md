# TradFi Options Market Making

> **Asset class:** TradFi / CeFi (options available on Deribit, CME, IBKR) **Strategy type:** Options Market Making
> (multi-strike quoting, delta hedging) **Strategy ID pattern:** `{asset_group}_{UNDERLYING}_MM_OPT_{VENUE}_EVT_SUB1S`

## Overview

Quote bid/ask across multiple strikes and expiries on an options exchange. Earn the spread between bid and ask on
options while managing Greeks exposure (delta, gamma, vega, theta). The most complex market-making strategy due to
multi-dimensional risk and the need for continuous delta hedging.

## How This Fits the Unified Trading System

Same event-driven architecture. Triggered by underlying price move (same as CeFi MM). Key difference: multi-strike means
many simultaneous orders, and delta hedging requires the ref pricing / underlying fixing mechanism from
[config-architecture.md](../cross-cutting/config-architecture.md).

```
features-volatility-service (publishes: IV surface, realized vol, skew)
features-delta-one-service (publishes: underlying price, funding rate)
  → pub/sub events (on underlying move > threshold)
    → strategy-service receives event
      → strategy.generate_signal(features, positions, risk)
        → emit StrategyInstruction[] (update quotes across N strikes + delta hedge)
```

**Multi-strike quoting:** Strategy sends N×2 instructions (N strikes × bid+ask) on each trigger. This is a **batch of
instructions**, not a single instruction. Whether the venue supports mass quote (single API call for all) or requires
individual orders is an execution concern.

## Mass Quote Capabilities

> **TODO — CODIFY:** `VenueCapability` in UAC needs:
>
> - `MASS_QUOTE` — can submit quotes for multiple instruments in one API call
> - `MASS_PULL` — can cancel by underlying/account/all in one call
>
> Per-venue support:

| Venue           | Mass Quote?               | Mass Pull by Underlying? | Mass Pull All?      | Pull by Instrument? |
| --------------- | ------------------------- | ------------------------ | ------------------- | ------------------- |
| Deribit         | YES (mass_quote endpoint) | YES                      | YES                 | YES                 |
| CME (via FIX)   | YES (MassQuote message)   | YES (via QuoteCancel)    | YES                 | YES                 |
| IBKR            | NO (individual orders)    | NO                       | YES (global cancel) | YES                 |
| Binance Options | NO                        | NO                       | YES                 | YES                 |

> These capabilities MUST be in `venue_constants.py` so execution-service can validate before attempting mass
> operations. If venue doesn't support mass_quote, execution falls back to sequential individual orders.

## Key Features Consumed

| Feature            | Source Service      | Trigger            | Used For                 |
| ------------------ | ------------------- | ------------------ | ------------------------ |
| `underlying_price` | features-delta-one  | Move > threshold   | Reprice all options      |
| `iv_surface`       | features-volatility | Periodic (1m)      | Option pricing model     |
| `realized_vol`     | features-volatility | Periodic (5m)      | Vol edge calculation     |
| `skew`             | features-volatility | Change > threshold | Strike-level adjustments |
| `portfolio_greeks` | ExposureMonitor     | After each fill    | Delta hedge trigger      |

## Underlying Fixing for Options

When the underlying moves, ALL option quotes need updating. This uses the reference pricing mechanism from
[config-architecture.md](../cross-cutting/config-architecture.md):

```
Strategy sends for each strike:
  instruction.price = theo_option_price (at current underlying)
  instruction.ref_underlying = "ETH-USD"
  instruction.edge_offset = theo - market_mid  (our edge)

When underlying moves $10:
  Execution-service recalculates each option price using delta:
    new_price ≈ old_price + delta * underlying_change
  Updates all orders simultaneously (mass quote if supported)
```

**Strategy concern:** What's the theo price for each strike? What's our edge? **Execution concern:** How to update all
orders when underlying moves. Mass quote vs individual.

> **TODO — CODIFY:** Options-specific ref pricing needs execution-service to: (a) Know the delta of each option (passed
> in instruction metadata or computed from IV) (b) Recalculate all option prices simultaneously on underlying move (c)
> Submit via mass_quote if venue supports it, else sequential This is an extension of the generic UnderlyingTracker
> concept.

## Delta Hedging

After fills, portfolio delta changes. Strategy monitors and hedges:

| Condition                                | Action                                        |
| ---------------------------------------- | --------------------------------------------- |
| `abs(portfolio_delta) > hedge_threshold` | Hedge: trade underlying to flatten delta      |
| Fill on a bid (bought option)            | Delta increases → may need to sell underlying |
| Fill on an ask (sold option)             | Delta decreases → may need to buy underlying  |

**Hedge instruction uses leader/follower model:**

- Follower: option quote (passive, wait for fill)
- Leader: delta hedge on underlying (aggressive, execute immediately on option fill)

## Risk & Exposure Subscriptions

### Risk Type Subscriptions

| Risk Type        | Subscribed?      | Threshold                            | Action on Breach                   |
| ---------------- | ---------------- | ------------------------------------ | ---------------------------------- |
| `delta`          | YES              | Portfolio delta > hedge threshold    | Hedge underlying                   |
| `gamma`          | YES              | Gamma exposure > max                 | Reduce near-ATM positions          |
| `vega`           | YES              | Vega exposure > max                  | Reduce vol exposure                |
| `theta`          | YES (monitoring) | —                                    | Expected daily P&L from time decay |
| `volga`          | YES              | Vol-of-vol risk                      | Widen spreads on wings             |
| `vanna`          | YES              | Delta-vol cross-risk                 | Adjust skew quotes                 |
| `venue_protocol` | YES              | Exchange issues                      | Cancel all (mass pull)             |
| `concentration`  | YES              | Too much open interest in one strike | Reduce                             |

## Risk Profile

| Metric               | Target             | Notes                                       |
| -------------------- | ------------------ | ------------------------------------------- |
| Target annual return | 20-40%             | Theta capture + spread, minus hedging costs |
| Target Sharpe ratio  | 2.0+               | Depends on hedging discipline               |
| Max drawdown         | 10%                | Vol spike / gap risk is primary             |
| Max leverage         | N/A                | Notional leverage high but Greeks-managed   |
| Capital scalability  | $5M per underlying | Depends on options market depth             |

## Latency Profile

| Segment                             | p50 Target | p99 Target | Co-location Needed?            |
| ----------------------------------- | ---------- | ---------- | ------------------------------ |
| Feature → strategy                  | 2ms        | 10ms       | **YES**                        |
| Strategy → instructions (N strikes) | 1ms        | 5ms        | —                              |
| Instructions → mass quote           | 5ms        | 20ms       | **YES**                        |
| Delta hedge (after fill)            | 10ms       | 50ms       | **YES**                        |
| **End-to-end**                      | **~18ms**  | **~85ms**  | **YES for competitive venues** |

Options MM is the MOST latency-sensitive strategy due to adverse selection risk on stale quotes.

## Testing Stage Status

| Stage        | Status  | Notes                                               |
| ------------ | ------- | --------------------------------------------------- |
| MOCK         | Pending | Need MockOptionsExchange with IV surface simulation |
| HISTORICAL   | Pending | Deribit historical options data (via Tardis.dev)    |
| LIVE_MOCK    | Pending | Real IV features, paper quotes                      |
| LIVE_TESTNET | Pending | Deribit testnet (`test.deribit.com`)                |
| BATCH_REAL   | Pending | Historical options data replay                      |
| STAGING      | Pending | Deribit testnet with real timing                    |
| LIVE_REAL    | Pending | All above + co-location decision                    |

## References

- **Implementation:** TBD — options MM not yet implemented
- **Deribit adapter:** `unified-market-interface/adapters/deribit_execution.py`
- **Greeks schemas:** `unified-api-contracts/canonical/domain/derivatives/`
- **Hard rules:** [config-architecture.md](../cross-cutting/config-architecture.md)
