# DeFi Recursive Staked Basis

> **Asset class:** DeFi **Strategy type:** Leveraged Basis + LST Yield (flash loan amplified, atomic execution)
> **Strategy ID pattern:** `DEFI_ETH_RECURSIVE_BASIS_SCE_1H`

## Overview

The most complex DeFi strategy. Uses flash loans to create leveraged exposure to weETH staking yield while hedging delta
with a short perp. Flash borrow ETH, stake to weETH, deposit as Aave collateral, borrow ETH against it, repay flash loan
-- all in one atomic transaction. Net position: long leveraged weETH collateral, short ETH debt, short ETH perp.
Amplifies combined APY by leverage factor.

**WARNING:** This strategy involves liquidation risk. If health factor drops below 1.0, Aave liquidators will seize
collateral at a 5-10% penalty. Backtest liquidation enforcement is critical.

## Token / Position Flow

### Entry (Atomic Bundle)

```
Start:  WALLET:SPOT_ASSET:USDT  (100% USDT)

ATOMIC BUNDLE (all-or-nothing, single transaction):
Step 1 - FLASH_BORROW: Borrow WETH from Morpho    (amount = initial_eth * (leverage - 1))
Step 2 - SWAP:         USDT --> WETH               (90% of USDT capital)
Step 3 - SWAP:         WETH --> weETH              (initial_eth + flash_amount combined)
Step 4 - LEND:         Deposit weETH to AAVE       (total_weeth --> receive aweETH)
Step 5 - BORROW:       Borrow WETH from AAVE       (amount = flash_amount, against weETH collateral)
Step 6 - FLASH_REPAY:  Repay flash loan with WETH  (flash_amount + fee)

NON-ATOMIC (separate transactions):
Step 7 - TRANSFER:     USDC to Hyperliquid         (10% of USDT as margin)
Step 8 - TRADE:        Short ETH-USDC perp         (size = total_weeth * weeth_rate)
```

### Concrete Example (2.5x leverage, $10,000)

```
initial_usdt     = $10,000
spot_allocation  = $9,000 (90%)
margin           = $1,000 (10%)
eth_price        = $3,000
initial_eth      = $9,000 / $3,000 = 3 ETH
flash_amount     = 3 * (2.5 - 1) = 4.5 ETH  (from Morpho, 0% fee)
total_eth        = 3 + 4.5 = 7.5 ETH
weeth_rate       = 1.035
total_weeth      = 7.5 / 1.035 = 7.246 weETH

After atomic bundle:
  AAVE collateral (aweETH) = 7.246 weETH  (worth $22,500)
  AAVE debt (debtWETH)     = 4.5 ETH      (worth $13,500)
  Net AAVE equity          = $9,000

After perp hedge:
  Perp short               = -7.5 ETH
  Margin                   = $1,000 USDC

Health Factor = ($22,500 * 0.825) / $13,500 = 1.375
```

### Wallet After Deploy

```
AAVEV3_ETHEREUM:A_TOKEN:AWEETH@ETHEREUM              = 7.246 weETH (collateral, positive)
AAVEV3_ETHEREUM:DEBT_TOKEN:DEBTWETH@ETHEREUM          = 4.5 ETH    (debt, negative in equity)
HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID    = -7.5 ETH   (short)
```

### Exit (Atomic Bundle)

```
ATOMIC BUNDLE:
Step 1 - FLASH_BORROW: Borrow WETH (= debt_balance * 1.001, slight buffer)
Step 2 - REPAY:        Repay AAVE debt with borrowed WETH
Step 3 - WITHDRAW:     Withdraw weETH collateral from AAVE (burn aweETH)
Step 4 - SWAP:         weETH --> WETH
Step 5 - FLASH_REPAY:  Repay flash loan with WETH from step 4

NON-ATOMIC:
Step 6 - TRADE:        Close perp short (buy to close)
Step 7 - SWAP:         Remaining WETH --> USDT (back to stablecoin)
```

## Data Architecture

| Dimension              | Value                                                                                                                                                                                                                        | SSOT                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Raw data source**    | `CloudDataProvider` (live) / `CSVDataProvider` (backtest)                                                                                                                                                                    | `strategy-service/config.py`                              |
| **Processed data**     | `market_data` dict: `eth_price`, `funding_rate`, `weeth_eth_rate`, `aave_borrow_apy_eth`, `aave_ltv`, `morpho_flash_loan_liquidity`, `health_factor`, `weekly_rewards`, `aave_liquidity_index`, `aave_liquidation_threshold` | Features hydrated alongside candles                       |
| **Features**           | `features` dict: all above keys                                                                                                                                                                                              | `features-onchain-service` + `features-delta-one-service` |
| **Interval**           | Time-driven (candle-based), not event-driven                                                                                                                                                                                 | `timeframe` in strategy config                            |
| **Lowest granularity** | 1H (currently hardcoded in factory, not configurable)                                                                                                                                                                        | `defi_recursive_basis.py` factory                         |
| **Execution mode**     | `same_candle_exit` — entry and exit can occur in same candle                                                                                                                                                                 | Strategy config                                           |

**Gap:** Timeframe is hardcoded to 1H. For health factor monitoring, sub-1H (15m or 5m) would be safer for detecting
rapid liquidation risk.

## Instrument Selection

**Currently: STATIC (hardcoded per config, no dynamic selection)**

All instruments are fixed at strategy initialisation:

- Collateral: `AAVEV3_ETHEREUM:A_TOKEN:AWEETH@ETHEREUM` — always weETH as collateral
- Debt: `AAVEV3_ETHEREUM:DEBT_TOKEN:DEBTWETH@ETHEREUM` — always borrow WETH
- Perp: `{perp_venue}:PERPETUAL:ETH-USDC@LIN@{perp_venue}` — venue configurable, instrument fixed
- Flash loan: Morpho Blue (0% fee) preferred over Aave (0.05%) or Balancer (0%)

There is **no dynamic collateral selection** — the strategy does NOT compare weETH vs wstETH as collateral, nor pick the
cheapest borrowing asset. This is a gap: a "recursive SOR" could optimise the leverage loop by selecting the best
collateral/debt pair across Aave markets.

**SSOT for instrument types per venue:** See
[`INSTRUMENT_TYPES_BY_VENUE`](../../../unified-api-contracts/unified_api_contracts/registry/venue_constants.py)

## Smart Order Routing (SOR)

**SOR is ON by default for the swap legs only.**

| Leg                               | SOR? | Allowed Venues                                         | SSOT                 |
| --------------------------------- | ---- | ------------------------------------------------------ | -------------------- |
| Step 3 (WETH→weETH swap)          | YES  | `CURVE-ETHEREUM`, `BALANCER-ETH`, `UNISWAPV3-ETHEREUM` | `defi_base.py:84-86` |
| Step 1 (Flash borrow from Morpho) | NO   | Morpho Blue only (hardcoded)                           | —                    |
| Step 4 (Deposit to Aave)          | NO   | Aave V3 only                                           | —                    |
| Step 8 (Short perp)               | NO   | Hyperliquid only                                       | —                    |

SOR applies ONLY to the ETH→weETH swap within the atomic bundle. Flash loan provider, lending protocol, and perp venue
are all fixed.

**Same-wallet constraint:** All SOR venues must be on Ethereum mainnet (same ERC-20 wallet). SSOT:
[`SHARED_WALLET_GROUPS`](../../../unified-api-contracts/unified_api_contracts/registry/venue_constants.py)

**Execution boundary:** Strategy sends `StrategyInstruction` with `is_atomic=True` for the flash loan bundle.
Execution-service MUST execute all atomic steps in a single transaction — if any step fails, all revert. Non-atomic
steps (perp hedge) are separate instructions.

## Instruments

| Instrument Key                                   | Venue       | Type      | Role                              |
| ------------------------------------------------ | ----------- | --------- | --------------------------------- |
| `WALLET:SPOT_ASSET:USDT`                         | Wallet      | Spot      | Initial capital                   |
| `AAVEV3_ETHEREUM:A_TOKEN:AWEETH@ETHEREUM`        | Aave V3     | aToken    | Collateral (long, leveraged)      |
| `AAVEV3_ETHEREUM:DEBT_TOKEN:DEBTWETH@ETHEREUM`   | Aave V3     | debtToken | Debt (negative equity)            |
| `HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID` | Hyperliquid | Perp      | Short leg (hedge, leveraged size) |

## Key Features Consumed

| Feature                       | Source Service     | SLA | Used For                          |
| ----------------------------- | ------------------ | --- | --------------------------------- |
| `lst_staking_apy`             | features-onchain   | 60s | Signal: staking yield component   |
| `funding_rate`                | features-delta-one | 10s | Signal: funding yield component   |
| `weeth_eth_rate`              | features-onchain   | 60s | Position sizing, rebalancing      |
| `aave_borrow_apy_eth`         | features-onchain   | 60s | Cost: leverage cost calculation   |
| `aave_ltv`                    | features-onchain   | 60s | Leverage cap: max safe LTV        |
| `morpho_flash_loan_liquidity` | features-onchain   | 60s | Pre-check: can we flash borrow?   |
| `health_factor`               | features-onchain   | 60s | Risk: liquidation proximity       |
| `weekly_rewards`              | features-onchain   | 24h | EtherFi/EIGEN reward distribution |
| `eth_price`                   | market-tick-data   | 1s  | PnL, sizing, HF calculation       |

## Dual-Index Position Mechanics

aweETH has **two simultaneous yield sources**:

1. **weETH/ETH rate appreciation** (staking yield) -- the underlying weETH token appreciates
2. **Aave liquidity_index growth** (tiny supply interest) -- Aave pays interest on deposited collateral

The system tracks these via separate settlement types (`LST_YIELD` and `AAVE_INDEX`). They are orthogonal dimensions:

- LST_YIELD affects the **price** of the underlying (weETH rate)
- AAVE_INDEX affects the **quantity** of the aToken (scaled balance)

Composite value: `aweETH_value = weeth_amount * weeth_rate * eth_price * (current_liq_index / entry_liq_index)`

debtWETH grows independently via `variableBorrowIndex` -- this is the cost of leverage.

## PnL Attribution

| Component           | Settlement Type          | Mechanism                                                                         |
| ------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `staking_yield_pnl` | `LST_YIELD` (per candle) | `aweETH_amount * (weeth_rate_new - weeth_rate_old) / weeth_rate_old` -- LEVERAGED |
| `lending_yield_pnl` | `AAVE_INDEX` (supply)    | aweETH balance growth from liquidity_index (small)                                |
| `borrow_cost_pnl`   | `AAVE_INDEX` (borrow)    | debtWETH balance growth from borrow_index (NEGATIVE cost)                         |
| `funding_pnl`       | `FUNDING_8H`             | Short perp receives positive funding (LEVERAGED position)                         |
| `rewards_pnl`       | `SEASONAL_WEEKLY`        | EtherFi/EIGEN weekly distributions                                                |
| `trading_pnl`       | Entry/exit fills         | Realized from closing all legs                                                    |
| `transaction_costs` | Per-fill                 | Flash loan fee (Morpho=0%) + gas (~500k) + swap slippage                          |

**Source of truth:**

```
equity = aweETH_value - debtWETH_value + perp_pnl + margin - initial
```

The `_calculate_total_equity` function correctly subtracts debt tokens:

```
if ":DEBT_TOKEN:" in instrument_id:
    total -= abs(value)      # Debt is subtracted
else:
    total += value           # Everything else added
```

**Net APY formula (signal generation only):**

```
net_apy = (staking_apy + funding_apy + reward_yield) * leverage
        - borrow_apy * (leverage - 1)

Example: (3.5% + 8% + 2%) * 2.5 - 2% * 1.5 = 33.75% - 3% = 30.75% net
```

**Double-counting prevention:**

- aweETH collateral: weETH rate change (staking) and liquidity_index change (Aave supply) are tracked by separate
  settlement types and are orthogonal
- debtWETH: grows independently via borrow_index -- always negative (cost)
- Perp: sized at full leveraged ETH exposure, receives amplified funding
- Reconciliation: composite index check verifies expected vs actual value each candle

## Risk Profile

| Metric               | Target | Notes                                                         |
| -------------------- | ------ | ------------------------------------------------------------- |
| Target annual return | 25-35% | Leveraged staking + funding - borrow cost                     |
| Target Sharpe ratio  | 2.0+   | Higher absolute return but higher vol than unleveraged        |
| Max drawdown         | 15%    | Liquidation cascade is the tail risk                          |
| Max leverage         | 3.0x   | Capped by strategy; Aave allows up to ~5x in E-Mode           |
| Capital scalability  | $5M    | Constrained by Morpho flash loan liquidity + Aave utilization |

## Latency Profile

| Segment                             | p50 Target | p99 Target | Co-location Needed?                    |
| ----------------------------------- | ---------- | ---------- | -------------------------------------- |
| Market data -> feature              | 50ms       | 200ms      | No                                     |
| Feature -> signal                   | 10ms       | 50ms       | No                                     |
| Signal -> instruction               | 5ms        | 20ms       | No                                     |
| Instruction -> fill (atomic bundle) | 5s         | 60s        | No (gas-dependent, may need gas boost) |
| Instruction -> fill (perp)          | 100ms      | 500ms      | No (Hyperliquid CLOB)                  |
| **End-to-end**                      | **~6s**    | **~61s**   | **No**                                 |

Low-frequency (1h candles). Atomic bundle may need priority gas in congested conditions.

## Execution Details

- **Venues:** Morpho (flash loan), Aave V3 (collateral + borrow), Uniswap/Curve (swaps), Hyperliquid (perp)
- **Order types:** Atomic bundle (flash loan sequence), Market (swaps), Limit (perp)
- **Atomic execution required?** YES -- Steps 1-6 MUST be atomic. If any step fails, all revert.
- **Rebalancing triggers:**
  - Delta drift > 2%: adjust perp size
  - Health factor < 1.5: deleverage 20% (partial atomic unwind)
  - Health factor < 1.2: emergency full exit
  - weETH depeg > 2%: emergency full exit
- **Deleverage sequence:** Flash borrow WETH -> partial repay debt -> partial withdraw collateral -> swap weETH to WETH
  -> flash repay. Leverage decreases: `current_leverage *= (1 - 0.20)`
- **Gas budget:** ~500k gas for atomic bundle (entry), ~600k for exit (more steps)

### Rebalancing

**Trigger type:** Event-driven (NOT periodic). No rebalance without new market data.

| Level    | Position Deviation | Health Factor | Action                                   |
| -------- | ------------------ | ------------- | ---------------------------------------- |
| Minor    | >2% delta drift    | HF > 1.5      | LOG_ONLY                                 |
| Major    | >5% delta drift    | HF < 1.4      | REBALANCE — deleverage 20% + adjust perp |
| Critical | >10% delta drift   | HF < 1.25     | EMERGENCY_EXIT — full atomic unwind      |

**Additional rebalance triggers (unique to this strategy):**

- Dynamic LTV change: If Aave governance reduces weETH LTV, cap leverage accordingly
- Flash loan liquidity dry-up: If Morpho pool liquidity < required flash amount, deleverage
- weETH depeg >2%: Emergency exit regardless of HF

**Deleverage is itself an atomic bundle:** Flash borrow → partial repay debt → partial withdraw collateral → swap →
flash repay. This is expensive (~500k gas) so minor drifts are logged only.

Thresholds from `defi_base.py:_parse_thresholds()` + `defi_recursive_basis.py` health factor overrides. SSOT:
[`rebalancing_config.yaml`](../../../strategy-service/strategy_service/configs/rebalancing_config.yaml)

## Risk & Exposure Subscriptions

**Flow:** ExposureMonitor (positions → exposures) → RiskMonitor (exposures → risk assessment) → Strategy (risk
assessment → rebalance/exit decisions)

### Exposure Subscriptions

| Instrument Pattern        | Exposure Type                      | Used For               |
| ------------------------- | ---------------------------------- | ---------------------- |
| `AAVE_V3:A_TOKEN:*`       | Collateral value (leveraged weETH) | HF numerator           |
| `AAVE_V3:DEBT_TOKEN:*`    | Debt value (borrowed WETH)         | HF denominator         |
| `HYPERLIQUID:PERPETUAL:*` | Perp notional (short, leveraged)   | Delta calculation      |
| `WALLET:LST:*`            | Underlying LST appreciation        | Staking yield tracking |

Config: `defi_mode.enabled=True`, `defi_mode.track_aave_positions=True`, `defi_mode.track_staking_positions=True`,
`ml_mode.track_perp_positions=True` SSOT:
[`ExposureMonitorConfig`](../../../strategy-service/strategy_service/config.py)

### Risk Type Subscriptions

| Risk Type          | Subscribed?        | Threshold                                           | Action on Breach                 |
| ------------------ | ------------------ | --------------------------------------------------- | -------------------------------- |
| `aave_liquidation` | **YES (CRITICAL)** | HF < 1.5 deleverage, HF < 1.2 emergency exit        | Atomic deleverage bundle         |
| `delta`            | YES                | 2% net delta drift                                  | Adjust perp size                 |
| `funding`          | YES (signal)       | Net APY below threshold                             | Exit decision                    |
| `staking_yield`    | YES (signal)       | `min_staking_apy` config param                      | Exit decision                    |
| `borrow_cost`      | YES                | Borrow rate spike erodes net APY                    | Deleverage or exit               |
| `protocol_risk`    | YES                | weETH depeg > 2%, Morpho liquidity dry-up           | Emergency exit                   |
| `venue_protocol`   | YES                | Hyperliquid circuit breaker, Aave governance change | Pause/exit                       |
| `liquidity`        | YES                | Flash loan liquidity < required amount              | Cannot rebalance/exit atomically |
| `basis`            | NO                 | —                                                   | —                                |

Config: `enabled_risk_types: ["aave_liquidation"]`, `defi_risk.enabled=True`, `defi_risk.aave_liquidation=True`,
`cex_risk.enabled=True` Strategy-specific: `min_health_factor=1.2`, `target_health_factor=1.5` (lines 81-82 in
`defi_recursive_basis.py`) SSOT: [`RiskMonitorConfig`](../../../strategy-service/strategy_service/config.py)

**Gap:** Risk subscriptions are implicit in code defaults. Plan item `p5-risk-strategy-subscription` will create
`StrategyRiskProfile` per strategy type. This strategy has the MOST subscriptions of all 4 DeFi strategies.

### Custom Strategy Risk Types

| Custom Risk                        | What It Measures                                                        | Evaluation Method  |
| ---------------------------------- | ----------------------------------------------------------------------- | ------------------ |
| ETH borrow rate sensitivity        | PnL impact of +100bp borrow rate on leveraged position                  | `rate_sensitivity` |
| Health factor degradation velocity | Rate of HF decline → time-to-liquidation estimate                       | `threshold_breach` |
| Flash loan liquidity risk          | Morpho pool liquidity vs required flash amount                          | `threshold_breach` |
| Recursive leverage amplification   | How leverage multiplies losses in stress scenario                       | `scenario_pnl`     |
| weETH depeg cascade                | weETH depeg → HF drop → forced deleverage → more selling → deeper depeg | `scenario_pnl`     |

**Gap:** Custom risk types planned (`p5-risk-custom-risk-types`) but not yet implemented. This strategy has the most
custom risk needs of all 4 DeFi strategies due to leverage.

## Margin & Liquidation

- **Margin model:** Aave V3 health factor (DeFi side) + Hyperliquid cross-margin (perp side)
- **Health factor:** `HF = (collateral_value * liquidation_threshold) / debt_value`
  - Default liquidation_threshold for weETH: 0.825 (82.5%)
  - Default LTV: 0.50 (50%)
  - E-Mode (ETH-correlated): LTV up to ~90%, liq threshold ~93%
- **Liquidation penalty:** 5-10% of collateral (asset-dependent)
- **Liquidation trigger:** HF < 1.0
- **Strategy thresholds:**
  - HF < 1.5: deleverage 20%
  - HF < 1.2: emergency full exit
- **Monitoring:** Health factor checked EVERY candle (critical for this strategy)
- **Backtest enforcement:** If HF < 1.0 in backtest, forced exit with penalty applied (plan item
  p5-backtest-liquidation-enforcement)

### What Causes Health Factor to Drop

1. **ETH price drops** -- collateral (weETH) loses value faster than debt (in ETH terms, net effect is the weETH/ETH
   rate component only)
2. **weETH depegs** -- collateral drops relative to debt (most dangerous scenario)
3. **Borrow rate spikes** -- debt grows faster than expected
4. **Aave parameter changes** -- governance reduces LTV or liquidation threshold

## Authentication & Credentials

| Venue                     | Secret Name                   | Testnet Available? | Notes                                  |
| ------------------------- | ----------------------------- | ------------------ | -------------------------------------- |
| Morpho (flash loan)       | `alchemy-api-key` (RPC)       | Yes (Sepolia)      | No API key needed; interact via wallet |
| Aave V3 (collateral/debt) | `alchemy-api-key` (RPC)       | Yes (Sepolia)      | Permissionless via wallet              |
| Uniswap (swaps)           | `alchemy-api-key` (RPC)       | Yes (Sepolia)      | Permissionless via wallet              |
| Hyperliquid               | `hyperliquid-api-credentials` | Yes (testnet)      | API key + secret                       |
| Wallet                    | `wallet-{client}-private-key` | Yes (dev wallet)   | Signs ALL on-chain transactions        |

See: [credentials-registry.yaml](../../../unified-trading-pm/credentials-registry.yaml)

## Client Onboarding

See [cross-cutting/client-onboarding.md](../cross-cutting/client-onboarding.md) for the standard flow.

**Strategy-specific:**

1. Wallet per client (signs atomic bundles -- MUST have sufficient ETH for gas)
2. Hyperliquid account per client (separate margin)
3. Config: `initial_capital`, `max_leverage` (default 2.5x), `min_health_factor` (default 1.5)
4. **Restart required?** No -- hot-reload via GCS config
5. **Gas funding:** Client wallet needs ~0.1 ETH pre-funded for gas on atomic bundles

### Higher Risk -- Additional Onboarding Steps

- Client must acknowledge liquidation risk
- Initial capital minimum: $50,000 (gas costs make smaller amounts unprofitable)
- Leverage cap agreed per client (default 2.5x, max 3.0x with approval)
- Health factor alert thresholds configured per client risk tolerance

## UI Visualisation

### Standard views

- PnL waterfall, margin health, position breakdown (from monitoring UI plans)

### Strategy-specific views

- **Health factor time series** -- with 1.5 (deleverage), 1.2 (emergency), 1.0 (liquidation) threshold lines
- **Leverage gauge** -- current leverage vs max, with colour zones (green/yellow/red)
- **Collateral vs debt chart** -- stacked: aweETH value (green) vs debtWETH value (red), net equity line
- **Dual-index decomposition** -- weETH rate growth vs Aave liquidity_index growth (shows which yield source dominates)
- **Net APY waterfall** -- staking + funding + rewards - borrow_cost = net APY (per candle)
- **Flash loan execution log** -- entry/exit bundle success/failure, gas used, Morpho liquidity at time
- **Deleverage history** -- when and why deleverage events fired, HF before/after

## Testing Stage Status

| Stage        | Status  | Notes                                                                 |
| ------------ | ------- | --------------------------------------------------------------------- |
| MOCK         | Pending | Need MockDeFiDynamics with HF degradation scenarios                   |
| HISTORICAL   | Pending | Need 365 days data (must see at least one market stress event)        |
| LIVE_MOCK    | Pending | Blocked by features-onchain health_factor + aave_borrow_apy (#6)      |
| LIVE_TESTNET | Pending | Blocked by AAVEConnector live execution (#1) + testnet contracts (#3) |
| BATCH_REAL   | Pending | Blocked by historical APY storage (#4) + liquidation enforcement (p5) |
| STAGING      | Pending | Tenderly fork (atomic bundles execute against fork)                   |
| LIVE_REAL    | Pending | All above + real capital approval + client risk acknowledgment        |

## References

- **Implementation:** `strategy-service/strategy_service/engine/strategies/defi_recursive_basis.py`
- **Mixins:** `strategy-service/strategy_service/engine/strategies/_defi_recursive_basis_mixins.py`
- **Config schema:** `strategy-service/docs/STRATEGY_MODES.md`
- **Aave connector:** `unified-defi-execution-interface/protocols/aave.py`
- **EtherFi connector:** `unified-defi-execution-interface/protocols/etherfi.py`
- **Morpho connector:** `unified-defi-execution-interface/protocols/morpho.py`
- **Flash loan simulator:** `strategy-service/strategy_service/engine/backtest/flash_loan_simulator.py`
- **Settlement:** `strategy-service/strategy_service/engine/core/settlement_service.py`
- **PnL calculator:** `strategy-service/strategy_service/engine/core/pnl_calculator.py`
- **Yield reconciliation:** `execution-service/execution_service/services/yield_recon_engine.py`
