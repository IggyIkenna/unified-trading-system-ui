# DeFi Market Making (AMM Liquidity Provision)

> **Asset class:** DeFi **Strategy type:** Market Making via AMM LP (concentrated liquidity, fee collection) **Strategy
> ID pattern:** `DEFI_{PAIR}_MM_LP_{POOL_TYPE}_EVT_{GRANULARITY}`

## Overview

Provide liquidity to AMM pools (Uniswap V2/V3/V4, Curve, Balancer) and earn swap fees. The DeFi equivalent of
market-making: instead of posting bid/ask on an order book, you deposit assets into a pool within a price range.
Swappers trade against your liquidity and you earn fees.

Key difference from CeFi MM: no order book, no bid/ask quotes. Instead you define a price RANGE and the AMM
automatically makes markets for you within that range.

## How This Fits the Unified Trading System

Same event-driven architecture. Strategy receives features (pool metrics, price, volatility), decides when to
add/remove/rebalance liquidity, and emits instructions. Strategy NEVER reads pool state directly —
features-onchain-service computes pool metrics and publishes them.

```
features-onchain-service (publishes: pool_price, tick, fee_apy, IL_pct, utilization)
  → pub/sub event (on price move > threshold OR periodic)
    → strategy-service receives event
      → strategy.generate_signal(features, positions, risk)
        → emit StrategyInstruction (ADD_LIQUIDITY / REMOVE_LIQUIDITY / REBALANCE_RANGE)
```

## Pool Types & Mechanics

| Pool Type  | Venue         | Liquidity Model                         | LP Token                       | IL Profile                       |
| ---------- | ------------- | --------------------------------------- | ------------------------------ | -------------------------------- |
| Uniswap V2 | UNISWAPV2-ETH | Uniform (0→∞)                           | ERC-20 (fungible)              | Standard (~5.7% at 2x move)      |
| Uniswap V3 | UNISWAPV3-ETH | Concentrated (tick range)               | ERC-721 NFT (unique per range) | Amplified within range           |
| Uniswap V4 | UNISWAPV4-ETH | Concentrated + hooks                    | ERC-721 NFT                    | Hook-dependent                   |
| Curve      | CURVE-ETH     | StableSwap (auto-concentrated near peg) | ERC-20 (fungible)              | Very low for like-kind assets    |
| Balancer   | BALANCER-ETH  | Weighted (custom weights 2-8 tokens)    | ERC-20 (fungible)              | Weight-dependent (80/20 < 50/50) |

### Uniswap V3 Concentrated Liquidity (primary use case)

Strategy provides liquidity in a specific price range `[tickLower, tickUpper]`:

- Within range: your liquidity earns fees on every swap
- Outside range: earns zero fees, holds 100% of the depreciating token
- Rebalancing: when price exits range, must remove + re-add at new range

Capital efficiency: up to 4000x vs V2 for tight ranges. Trade-off: higher IL within range.

### Curve StableSwap

For like-kind assets (USDT/USDC/DAI, ETH/stETH, ETH/weETH):

- Amplification parameter `A` concentrates liquidity near peg automatically
- LP cannot choose custom range — the algorithm does it
- Much lower IL for pegged assets (100-1000x less slippage than Uniswap V2)

## Token / Position Flow (Uniswap V3 Example)

```
Start:  WALLET:SPOT_ASSET:USDT + WALLET:SPOT_ASSET:ETH

Step 1 - ADD_LIQUIDITY:
  Deposit ETH + USDT into Uniswap V3 pool within [tickLower, tickUpper]
  Receive: NFT position token representing your LP position

Wallet after deploy:
  - UNISWAPV3-ETH:LP_POSITION:ETH-USDT@ETHEREUM = NFT position
  - Accruing: swap fees in ETH + USDT (claimable via COLLECT_FEES)

On rebalance (price exits range):
Step 2 - REMOVE_LIQUIDITY: burn NFT, receive ETH + USDT
Step 3 - ADD_LIQUIDITY: deposit at new range [newTickLower, newTickUpper]

On exit:
Step 4 - REMOVE_LIQUIDITY + COLLECT_FEES: burn NFT, claim all fees
```

## Instruments

| Instrument Key                                | Venue      | Type   | Role               |
| --------------------------------------------- | ---------- | ------ | ------------------ |
| `UNISWAPV3-ETH:LP_POSITION:ETH-USDT@ETHEREUM` | Uniswap V3 | LP NFT | Active LP position |
| `WALLET:SPOT_ASSET:ETH`                       | Wallet     | Spot   | Deposited asset    |
| `WALLET:SPOT_ASSET:USDT`                      | Wallet     | Spot   | Deposited asset    |

## Key Features Consumed

| Feature        | Source Service      | Trigger                | Used For                        |
| -------------- | ------------------- | ---------------------- | ------------------------------- |
| `pool_price`   | features-onchain    | Price move > threshold | Rebalance trigger               |
| `current_tick` | features-onchain    | Tick change            | Range vs current position check |
| `fee_apy_24h`  | features-onchain    | Periodic (1h)          | Is LP profitable?               |
| `il_pct`       | features-onchain    | Price move             | IL monitoring                   |
| `pool_tvl`     | features-onchain    | Periodic (1h)          | Concentration / crowding risk   |
| `realized_vol` | features-volatility | Periodic (5m)          | Range width decision            |

## Data Architecture

| Dimension              | Value                                                      | SSOT                          |
| ---------------------- | ---------------------------------------------------------- | ----------------------------- |
| **Raw data source**    | NEVER direct — via features-onchain-service                | Hard rule                     |
| **Features consumed**  | Pool metrics computed from The Graph + RPC                 | `features-onchain-service`    |
| **Interval**           | Event-driven on price move OR periodic for rebalance check | Strategy trigger subscription |
| **Lowest granularity** | Per-block (~12s on Ethereum) via feature service           | Feature service config        |

## Instruction Types Needed

> **TODO — CODIFY:** New `OperationType` values needed in both UAC and UDEI:

| Operation          | What It Does                            | Parameters                                                      | Exists?                        |
| ------------------ | --------------------------------------- | --------------------------------------------------------------- | ------------------------------ |
| `ADD_LIQUIDITY`    | Deposit tokens into AMM pool            | pool_id, token_amounts[], tick_lower, tick_upper, min_amounts[] | **NO — needs adding**          |
| `REMOVE_LIQUIDITY` | Burn LP token, withdraw assets          | pool_id, lp_token_id/amount, min_amounts[]                      | **NO — needs adding**          |
| `COLLECT_FEES`     | Claim accrued fees from LP position     | position_id                                                     | **NO — needs adding**          |
| `REBALANCE`        | Remove + re-add at new range (compound) | old_position_id, new_ticks                                      | EXISTS (but needs LP metadata) |

`VenueCapability.PROVIDE_LIQUIDITY` already exists in `venue_constants.py` and is tagged on Uniswap V2/V3/V4, Curve,
Aerodrome. But the instruction path lacks corresponding operation types.

> **TODO — CODIFY:** Also add `INSTRUCTION_VALID_DOMAINS` mapping: `ADD_LIQUIDITY` → `defi` domain, `LP_POSITION`
> instrument type. Update venue_constants.py accordingly.

## Smart Order Routing (SOR)

**SOR applies to POOL SELECTION, not venue selection:**

For the same token pair (ETH-USDT), multiple pools exist with different fee tiers:

- Uniswap V3: 0.01%, 0.05%, 0.3%, 1% fee tiers
- Curve: 0.04% for stableswaps
- Balancer: custom fees

Strategy decides which pool(s) to LP based on: fee tier, TVL, volume, IL risk. This is an "LP SOR" — selecting the best
pool to provide liquidity to.

> **TODO — CODIFY:** LP pool selection logic should be in strategy-service, not execution. Strategy evaluates pool
> metrics and selects target pool(s). Execution just executes the add/remove.

## PnL Attribution

| Component           | Settlement Type               | Mechanism                                          |
| ------------------- | ----------------------------- | -------------------------------------------------- |
| `fee_income_pnl`    | `LP_FEE_ACCRUAL` (per period) | Fees earned from swappers trading through position |
| `il_pnl`            | Mark-to-market                | Impermanent loss from price divergence             |
| `inventory_pnl`     | Mark-to-market                | Value change of underlying tokens in pool          |
| `transaction_costs` | Per-fill                      | Gas for add/remove/rebalance (~300k-500k gas each) |

**Source of truth:** `total_pnl = (current_position_value + collected_fees) - initial_deposit`

> **TODO — CODIFY:** `LP_FEE_ACCRUAL` settlement type doesn't exist. Add to `SettlementType` enum. IL calculation needs:
> `il_pnl = position_value_if_held - position_value_in_pool`.

## Risk & Exposure Subscriptions

### Risk Type Subscriptions

| Risk Type          | Subscribed? | Threshold                              | Action on Breach             |
| ------------------ | ----------- | -------------------------------------- | ---------------------------- |
| `impermanent_loss` | YES         | IL > X% of position                    | Widen range or exit          |
| `protocol_risk`    | YES         | Smart contract risk, pool manipulation | Emergency exit               |
| `liquidity`        | YES         | Pool TVL drops significantly           | Exit (crowding risk inverts) |
| `delta`            | YES (V3)    | Price exits range → 100% single-sided  | Rebalance to new range       |
| `concentration`    | YES         | Our share of pool TVL > X%             | Reduce position              |
| `venue_protocol`   | YES         | Pool pause, governance attack          | Emergency exit               |

### Custom Strategy Risk Types

| Custom Risk            | What It Measures                              | Evaluation Method  |
| ---------------------- | --------------------------------------------- | ------------------ |
| Range utilisation      | % of time price is within our LP range        | `rate_sensitivity` |
| Fee APY vs IL          | Net of fees minus IL — is LP profitable?      | `threshold_breach` |
| MEV extraction risk    | Are sandwich attacks eating our LP position?  | monitoring         |
| Pool TVL concentration | Our % of pool — adverse selection if too high | `threshold_breach` |

## Risk Profile

| Metric               | Target       | Notes                                                 |
| -------------------- | ------------ | ----------------------------------------------------- |
| Target annual return | 10-25%       | Fee APY minus IL, depends on pool                     |
| Target Sharpe ratio  | 1.5+         | Lower than delta-neutral strategies due to IL         |
| Max drawdown         | 15%          | Primarily from IL during large price moves            |
| Max leverage         | 1x           | No leverage                                           |
| Capital scalability  | $5M per pool | Larger = higher share of pool TVL = adverse selection |

## Latency Profile

| Segment                             | p50 Target | p99 Target | Co-location Needed? |
| ----------------------------------- | ---------- | ---------- | ------------------- |
| Feature → signal                    | 50ms       | 200ms      | No                  |
| Signal → instruction                | 10ms       | 50ms       | No                  |
| Instruction → on-chain (add/remove) | 5s         | 60s        | No (gas-dependent)  |
| **End-to-end**                      | **~6s**    | **~61s**   | **No**              |

Rebalancing is not time-critical — a few blocks delay is acceptable. However, during high volatility when rapid
rebalancing is needed, priority gas may help.

## Execution Details

- **Venues:** Uniswap V3 (primary), Curve (stableswaps), Balancer (weighted)
- **Order types:** Protocol interactions (not order book)
- **Atomic execution required?** No (single tx per add/remove), unless combining with hedge
- **Gas budget:** ~300k (add V3), ~200k (remove V3), ~150k (collect fees)

### Rebalancing

**Trigger type:** Event-driven on price exiting LP range.

| Level    | Condition                          | Action                                                 |
| -------- | ---------------------------------- | ------------------------------------------------------ |
| Normal   | Price within range, fees accruing  | No action                                              |
| Minor    | Price near range edge (within 5%)  | Log, prepare rebalance                                 |
| Major    | Price exits range (earning 0 fees) | Remove + re-add at new range centered on current price |
| Critical | IL exceeds threshold               | Full exit, return to flat                              |

## Margin & Liquidation

- **Margin model:** None — fully funded LP (no leverage)
- **Liquidation risk:** None (no debt)
- **IL risk:** Position value can decrease vs holding — not liquidation but real loss
- **Smart contract risk:** Pool exploit, governance attack, oracle manipulation

## Testing Stage Status

| Stage        | Status  | Notes                                                |
| ------------ | ------- | ---------------------------------------------------- |
| MOCK         | Pending | Need MockAMMPool with price simulation + fee accrual |
| HISTORICAL   | Pending | Uniswap V3 pool data available via The Graph         |
| LIVE_MOCK    | Pending | Blocked by ADD_LIQUIDITY operation type gap          |
| LIVE_TESTNET | Pending | Uniswap V3 on Sepolia, Curve on Sepolia              |
| BATCH_REAL   | Pending | Historical pool data backfill needed                 |
| STAGING      | Pending | Tenderly fork                                        |
| LIVE_REAL    | Pending | All above + IL risk accepted                         |

## References

- **Implementation:** TBD — LP strategy not yet implemented
- **Matching engine (simulation):** `matching-engine-library/hooks.py` (V4 hooks)
- **Pool data adapters:** `unified-market-interface/adapters/defi/uniswap_v3_adapter.py`
- **Venue capabilities:** `VENUE_CAPABILITIES.PROVIDE_LIQUIDITY` in `venue_constants.py`
- **Hard rules:** [config-architecture.md](../cross-cutting/config-architecture.md)
