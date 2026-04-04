# DeFi Strategy Guide — Demo Reference

> Plain-English reference for a trading veteran who knows CeFi/TradFi but not DeFi.
> Covers all 4 strategies Patrick will see in the demo.

---

## DeFi Concepts You Need to Know First

| Concept                | What it is                                                                                                                                                       | CeFi analogy                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **aToken**             | Receipt token Aave gives you when you deposit (e.g. aUSDC = USDC deposited in Aave)                                                                              | Like a repo confirmation — proves you lent money, balance auto-grows  |
| **Liquidity Index**    | Aave's internal multiplier that grows every block as borrowers pay interest                                                                                      | Like a NAV for a money market fund                                    |
| **Health Factor (HF)** | (collateral × liquidation_threshold) / debt. Must stay above 1.0                                                                                                 | Like a margin ratio — below 1.0 = auto-liquidation                    |
| **weETH**              | EtherFi's wrapped staking token. Token count stays fixed; the ETH exchange rate grows (~3.5% APY)                                                                | Like a non-rebasing bond — face value slowly increases                |
| **Flash loan**         | Borrow any amount with zero collateral, but MUST repay in the same blockchain transaction (atomic). If repayment fails → whole tx reverts like it never happened | Like a repo that must settle in same-day, otherwise it cancels itself |
| **SOR (DEX)**          | Smart Order Router — finds best price across Uniswap, Curve, Balancer for a token swap                                                                           | Like best execution across lit venues but on-chain                    |
| **Funding rate**       | Same as CeFi — perp premium over spot, paid 3× per day. Positive = longs pay shorts                                                                              | Same as Binance/Bybit funding                                         |
| **CLOB**               | Central limit order book. Hyperliquid uses a CLOB (fast, off-chain matching, on-chain settlement)                                                                | Same as a normal exchange                                             |
| **Gas**                | Transaction fee paid in ETH to execute on-chain operations. Varies with network congestion                                                                       | Like exchange commission but paid to network validators               |
| **Atomic bundle**      | Multiple operations bundled into ONE transaction — all succeed or all revert                                                                                     | Like a block trade that only executes if all legs fill                |
| **Depeg**              | LST token's price falls below its expected ETH value (e.g. weETH < 1.035 ETH when it should be 1.037)                                                            | Like a covered bond trading below NAV                                 |

---

## Strategy 1: AAVE Lending

**ID:** `AAVE_LENDING` | **Risk:** Low | **Target APY:** 3–8%

### What it does

Deposit stablecoins (USDC/USDT/DAI) into Aave V3 on Ethereum. Aave pays interest because borrowers are paying to borrow those stablecoins. You earn yield automatically — no active management needed.

### Position Structure

```
BEFORE:  $100K USDC in treasury wallet

AFTER DEPLOY:
  - Trading wallet: 100,000 aUSDC (interest-bearing receipt)
  - Treasury: reduced by $100K + gas (~$14)
  - No debt, no perp, no leverage
```

### How P&L is Generated

| Source           | Mechanism                              | Size                             |
| ---------------- | -------------------------------------- | -------------------------------- |
| Lending interest | Aave liquidity index grows every block | ~$13.15/day on $100K at 4.8% APY |
| Gas costs        | Entry: ~$14, Exit: ~$14                | One-time                         |

No funding rate, no staking yield, no basis. Purely lending interest.

### Key Numbers for Demo

- Entry cost: ~$14 total (TRANSFER $2 + LEND $12)
- Break-even: ~1.1 days
- Daily interest at 4.8% APY on $100K: **$13.15/day**
- HF: N/A (no borrowing)
- Liquidation risk: **None**

### Instruction Sequence (E2E)

| #   | Instruction                             | Venue           | Gas  |
| --- | --------------------------------------- | --------------- | ---- |
| 1   | TRANSFER USDC treasury → trading wallet | Copper MPC      | ~$2  |
| 2   | LEND USDC → aUSDC                       | AAVEV3-ETHEREUM | ~$12 |

### What to Show in Demo

1. Wallet Summary: see treasury balance
2. Lending widget → select "Aave V3 (AAVEV3-ETHEREUM)" → select USDC → enter amount → Execute
3. Trade history: see TRANSFER + LEND rows with P&L decomposition
4. Positions: aUSDC position appears, balance slowly growing
5. Risk: no HF metric (pure lending = no debt)

### Risk to Highlight

- **Protocol risk**: Aave smart contract (well-audited but exists)
- **Utilization risk**: If pool utilization hits ~100%, can't withdraw until borrowers repay (rare)

---

## Strategy 2: Basis Trade

**ID:** `BASIS_TRADE` | **Risk:** Medium | **Target APY:** 8–15%

### What it does

Classic funding rate arbitrage with a DeFi spot leg. Long spot ETH on-chain (held in Ethereum wallet via DEX swap), short ETH perp across 5 CeFi venues. Delta neutral. Collects funding rate.

The DeFi twist vs CeFi basis: spot leg is held as actual ETH in a self-custody wallet (not on an exchange). Perp legs are on Hyperliquid, Binance, OKX, Bybit, Aster — weighted proportionally to which venue has the best funding rate.

### Position Structure

```
BEFORE:  $100K USDC

AFTER DEPLOY (90/10 split):
  - Ethereum wallet: ~30 ETH LONG (spot, $90K)
  - Hyperliquid:     ~8 ETH SHORT (30% weight, best funding)
  - Binance:         ~8 ETH SHORT (25% weight)
  - OKX:             ~6 ETH SHORT (20% weight)
  - Bybit:           ~5 ETH SHORT (15% weight)
  - Aster:           ~3 ETH SHORT (10% weight)
  - Margin spread:   $2K USDC on each venue
  - Net delta:       ≈ 0
```

### How P&L is Generated

| Source         | Mechanism                               | Size                    |
| -------------- | --------------------------------------- | ----------------------- |
| Funding income | Collected 3×/day from all 5 venues      | ~$13.56/day at 5.5% avg |
| Entry costs    | Swap gas + slippage + perp trading fees | ~$46.50 one-time        |

Two-waterfall weighting: coins ranked by avg funding across venues, then venues ranked by per-venue funding for that coin. Max 50% concentration per venue.

### Key Numbers for Demo

- Entry cost: ~$46.50 total (gas $15 + slippage $4.50 + 5 perp fees ~$27)
- Break-even: ~3.4 days
- Daily funding at 5.5% avg APY on $90K: **$13.56/day**
- Net delta: **0** (if both legs executing correctly)
- HF: N/A for Aave (Hyperliquid margin is monitored separately — alert >80% usage)

### Instruction Sequence (E2E)

| #   | Instruction                          | Venue         | Gas                   |
| --- | ------------------------------------ | ------------- | --------------------- |
| 1   | TRANSFER USDC treasury → wallet      | Copper MPC    | ~$2                   |
| 2   | SWAP USDC → ETH (SOR picks best DEX) | Uniswap/Curve | ~$15 + $4.50 slippage |
| 3   | TRANSFER $2K USDC → Hyperliquid      | Hyperliquid   | $0                    |
| 4   | TRANSFER $2K USDC → Binance          | Binance       | $0                    |
| 5   | TRANSFER $2K USDC → OKX              | OKX           | $0                    |
| 6   | TRANSFER $2K USDC → Bybit            | Bybit         | $0                    |
| 7   | TRANSFER $2K USDC → Aster            | Aster         | $0                    |
| 8   | TRADE SHORT ETH perp                 | Hyperliquid   | ~$5.40 fee            |
| 9   | TRADE SHORT ETH perp                 | Binance       | ~$5.22 fee            |
| 10  | TRADE SHORT ETH perp                 | OKX           | ~$4.68 fee            |
| 11  | TRADE SHORT ETH perp                 | Bybit         | ~$4.32 fee            |
| 12  | TRADE SHORT ETH perp                 | Aster         | ~$2.70 fee            |

### What to Show in Demo

1. Book tab: instruction type SWAP → algo SOR_DEX → execute USDC→ETH
2. Book tab: instruction type TRANSFER → DIRECT → send margin to each venue
3. Book tab: instruction type TRADE → DIRECT_MARKET → SHORT ETH on each venue
4. Positions: ETH LONG + 5 perp SHORTs → net delta ≈ 0
5. P&L: funding income accumulating (shown as daily income)
6. Alert: if funding rate goes negative, alert fires

### Risk to Highlight

- **Funding reversal**: if market conditions flip, all 5 venues pay negative funding → exit signal
- **Basis blow-out**: spot-perp spread widens temporarily → unrealized P&L hit
- **Venue concentration**: max 50% per venue to avoid single-venue risk

---

## Strategy 3: Staked Basis

**ID:** `STAKED_BASIS` | **Risk:** Medium | **Target APY:** 12–20%

### What it does

Enhanced basis trade: instead of holding raw ETH on the spot leg, you hold **weETH** (EtherFi liquid staking token). weETH appreciates vs ETH at ~3.5% APY (staking rewards). You collect staking yield on top of funding.

The catch: since weETH/ETH rate increases over time, your ETH-equivalent long exposure slowly grows while the perp short stays fixed → delta drift. Strategy periodically adjusts perp size upward to compensate.

Two swaps on entry (vs one for basic basis trade): USDC→ETH (via DEX), then ETH→weETH (via DEX). weETH liquidity is thinner than ETH → 25bps slippage on that leg vs 5bps for ETH.

### Position Structure

```
BEFORE:  $100K USDC

AFTER DEPLOY:
  - Ethereum wallet: 28.125 weETH LONG (worth ~$90K, weETH rate 1.035)
  - Hyperliquid: ~29.1 ETH SHORT (sized at weETH × rate = full ETH exposure)
  - Margin: $10K USDC on Hyperliquid
  - Net delta: ≈ 0
```

### How P&L is Generated

| Source         | Mechanism                                             | Daily on $90K               |
| -------------- | ----------------------------------------------------- | --------------------------- |
| Staking yield  | weETH/ETH rate appreciation (~3.5% APY)               | ~$8.63/day                  |
| Funding income | Short perp collects positive funding (~5% APY)        | ~$12.33/day                 |
| Rewards        | EtherFi loyalty points + EIGEN airdrop (~2% APY est.) | ~$4.93/day                  |
| **Total**      |                                                       | **~$20.96/day (~8.5% APY)** |
| Entry costs    | Gas + slippage (weETH leg is expensive)               | ~$66.40 one-time            |

### Key Numbers for Demo

- Entry cost: ~$66.40 (notably higher than basis due to 25bps weETH slippage)
- Break-even: ~3.2 days
- HF: N/A (weETH is held in wallet, NOT as Aave collateral)
- weETH depeg threshold: **2%** → emergency exit
- Delta drift tolerance: **5%** before perp adjustment (weETH appreciation causes it)

### Instruction Sequence (E2E)

| #   | Instruction                     | Venue         | Cost                       |
| --- | ------------------------------- | ------------- | -------------------------- |
| 1   | TRANSFER USDC treasury → wallet | Copper MPC    | ~$2                        |
| 2   | SWAP USDC → ETH                 | Uniswap (SOR) | ~$15 + $4.50 slippage      |
| 3   | SWAP ETH → weETH                | Uniswap/Curve | ~$15 + **$22.50 slippage** |
| 4   | TRANSFER USDC → Hyperliquid     | Hyperliquid   | ~$2                        |
| 5   | TRADE SHORT ETH perp            | Hyperliquid   | ~$5.40 fee                 |

### What to Show in Demo

1. Swap widget: USDC→ETH swap with SOR
2. Swap widget: ETH→weETH swap (note the higher slippage 25bps — intentional, weETH liquidity is thinner)
3. Positions: weETH LONG + ETH SHORT perp — net delta ≈ 0
4. Risk: depeg alert threshold at 2% — weETH/ETH rate should be displayed
5. Staking widget: show weETH staking yield

### Risk to Highlight

- **weETH depeg**: if EtherFi has validator issues → weETH falls below fair ETH value → emergency exit triggers
- **Delta drift**: weETH appreciation naturally creates long drift → strategy rebalances perp
- **Illiquidity on ETH→weETH**: 25bps slippage vs 5bps for plain ETH swap

---

## Strategy 4: Recursive Staked Basis

**ID:** `RECURSIVE_STAKED_BASIS` | **Risk:** High (liquidation risk) | **Target APY:** 25–35%

### What it does

Uses a **flash loan** to create **leveraged** exposure to weETH staking yield, while remaining delta neutral via perp short. The leverage amplifies all yield sources (staking + funding + rewards) and reduces per-unit borrow cost. But it introduces **Health Factor** and **liquidation risk** — if HF falls below 1.0, Aave automatically seizes collateral.

This is the "demo highlight" — most complex, highest yield, most impressive to show.

### The Flash Loan Loop (Atomic Bundle, 1 Transaction)

Example: $10K capital, 2.5x leverage, ETH @ $3,000:

```
ATOMIC (all-or-nothing, single tx):
  1. FLASH_BORROW 4.5 ETH from Morpho (free, must repay same tx)
  2. SWAP $9K USDC → 3 ETH        (your capital)
  3. SWAP 7.5 ETH → 7.246 weETH   (3 ETH yours + 4.5 ETH flash)
  4. LEND 7.246 weETH → AAVE      (receive 7.246 aweETH as collateral)
  5. BORROW 4.5 ETH from AAVE     (against weETH collateral)
  6. FLASH_REPAY 4.5 ETH to Morpho (repay the flash loan)

NON-ATOMIC (separate txs):
  7. TRANSFER $1K USDC → Hyperliquid
  8. TRADE SHORT 7.5 ETH perp (full leveraged exposure)
```

Result: you invested $10K, you now control $22.5K worth of weETH collateral.

### Position Structure After Deploy

```
AAVE collateral: 7.246 aweETH  (worth $22,500 = 2.5x leverage)
AAVE debt:       4.5 debtWETH  (worth $13,500 = borrowed)
Net AAVE equity: $9,000         (your actual capital)
Hyperliquid:     -7.5 ETH short (full leveraged exposure hedged)
Margin:          $1,000 USDC

Health Factor:   ($22,500 × 0.825) / $13,500 = 1.375
```

### Health Factor Explained

```
HF = (collateral USD × liquidation_threshold) / debt USD

At deploy: HF = 1.375 (safe)
Alert at:  HF < 1.25 → deleverage 20%
Exit at:   HF < 1.20 → emergency atomic unwind
LIQUIDATED:HF < 1.0  → Aave liquidators seize collateral (-5-10% penalty)
```

HF drops if: ETH price drops (debt grows, collateral worth less), weETH depegs, or Aave changes LTV parameters.

### How P&L is Generated

| Source         | Mechanism            | On $10K at 2.5x |
| -------------- | -------------------- | --------------- |
| Staking yield  | 3.5% × 2.5x leverage | ~8.75% of $10K  |
| Funding income | 8% × 2.5x leverage   | ~20% of $10K    |
| Rewards        | 2% × 2.5x leverage   | ~5% of $10K     |
| Borrow cost    | –2% × 1.5x (debt)    | –3% of $10K     |
| **Net APY**    |                      | **~30.75%**     |

### Net APY Formula

```
net_apy = (staking_apy + funding_apy + reward_yield) × leverage
        - borrow_apy × (leverage - 1)
= (3.5% + 8% + 2%) × 2.5 - 2% × 1.5
= 33.75% - 3% = 30.75%
```

### Hedged vs Unhedged Mode

| Mode                 | Perp hedge?          | Yield                       | Risk                   |
| -------------------- | -------------------- | --------------------------- | ---------------------- |
| **Hedged** (default) | Yes, full perp short | Amplified staking + funding | Delta neutral          |
| **Unhedged**         | No perp              | Amplified staking only      | Long ETH (directional) |

### Reward Mode

| Mode         | What happens with EIGEN/ETHFI rewards           |
| ------------ | ----------------------------------------------- |
| `all`        | Hold reward tokens in wallet (accumulate)       |
| `eigen_only` | Hold EIGEN, sell ETHFI → compound into position |
| `ethfi_only` | Hold ETHFI, sell EIGEN                          |

### Key Numbers for Demo

- Entry cost: ~$150 (atomic bundle ~500k gas + slippage on 2 swaps)
- Target HF at entry: 1.375 (comfortable buffer above 1.25 alert)
- Break-even: ~4-5 days
- Daily income at 30.75% APY on $10K: ~$8.42/day

### Instruction Sequence (E2E)

| #   | Instruction           | Venue           | Notes                      |
| --- | --------------------- | --------------- | -------------------------- |
| 1   | FLASH_BORROW WETH     | Morpho Blue     | Atomic — 0% flash fee      |
| 2   | SWAP USDC → WETH      | Uniswap/SOR     | Atomic                     |
| 3   | SWAP WETH → weETH     | Curve/Uniswap   | Atomic, 25bps slippage     |
| 4   | LEND weETH → aweETH   | AAVEV3-ETHEREUM | Atomic                     |
| 5   | BORROW WETH from AAVE | AAVEV3-ETHEREUM | Atomic                     |
| 6   | FLASH_REPAY WETH      | Morpho Blue     | Atomic — closes flash loan |
| 7   | TRANSFER USDC         | Hyperliquid     | Separate tx                |
| 8   | TRADE SHORT ETH perp  | Hyperliquid     | Separate tx                |

### What to Show in Demo

1. Flash loan widget → build atomic bundle (steps 1-6)
2. P&L preview: shows gross/fee/gas/net before executing
3. Execute → trade history shows ALL steps at same timestamp (atomic)
4. Positions: aweETH collateral + debtWETH + perp SHORT — with HF displayed
5. Strategy config widget: show target leverage 2.5x, hedged=true, reward mode
6. Risk tab: HF time series, LTV display
7. Alert: HF < 1.25 alert configured and visible

### Risk to Highlight (the honest pitch)

- **Liquidation**: HF < 1.0 → Aave liquidators seize 5-10% of collateral. This is the real risk.
- **Gas**: Atomic bundle costs ~$100-150 in gas. At small sizes, this eats returns.
- **Complexity**: 6-step atomic bundle — any step failure = entire tx reverts, gas wasted
- **weETH depeg**: At 3%+ depeg → emergency exit regardless of HF

> **Note for demo**: This strategy will be locked post-demo (`RECURSIVE_STAKED_BASIS` → demo-only flag). Show it as a preview of capabilities.

---

## P&L Decomposition (All Strategies)

Every instruction in trade history shows these components:

| Field                | What it is                                              |
| -------------------- | ------------------------------------------------------- |
| `gross_pnl`          | Raw price movement (expected vs actual output)          |
| `price_slippage_usd` | Cost of executing at worse than benchmark price         |
| `gas_cost_usd`       | Actual gas paid (ETH gas price × gas units × ETH price) |
| `trading_fee_usd`    | Exchange or protocol fee (Aave, Hyperliquid taker fee)  |
| `bridge_fee_usd`     | Cross-chain bridge fee (for transfers across chains)    |
| `net_pnl`            | gross - slippage - gas - fees                           |
| `running_pnl`        | Cumulative sum of all net_pnl to date                   |

---

## Instrument ID Format

All positions and trade history use canonical IDs. Key patterns:

| Instrument             | Canonical ID                                     |
| ---------------------- | ------------------------------------------------ |
| USDC in wallet         | `WALLET:SPOT_ASSET:USDC`                         |
| ETH in wallet          | `WALLET:SPOT_ASSET:ETH`                          |
| weETH in wallet        | `ETHERFI:LST:WEETH@ETHEREUM`                     |
| aUSDC (Aave)           | `AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM`         |
| aweETH (Aave)          | `AAVEV3-ETHEREUM:A_TOKEN:AWEETH@ETHEREUM`        |
| debtWETH (Aave)        | `AAVEV3-ETHEREUM:DEBT_TOKEN:DEBTWETH@ETHEREUM`   |
| ETH perp (Hyperliquid) | `HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID` |

For display in the UI, these should be shortened to just the human-readable part (e.g. "aUSDC @ AAVE V3", "ETH-USDC PERP @ Hyperliquid").

---

## What Makes DeFi Positions Different from CeFi

| Aspect           | CeFi (Binance/OKX)       | DeFi                                                 |
| ---------------- | ------------------------ | ---------------------------------------------------- |
| Position storage | Exchange database        | On-chain, you own the wallet                         |
| Settlement       | Exchange IOUs            | Blockchain transactions                              |
| Interest         | Paid/charged by exchange | Accrues on-chain automatically                       |
| Liquidation      | Exchange margin call     | Smart contract auto-liquidation                      |
| Custody          | Exchange custodies funds | You custody (or Copper MPC does)                     |
| Gas cost         | Zero (exchange pays)     | You pay ~$2–150 per transaction                      |
| Speed            | Milliseconds             | Seconds to minutes                                   |
| Health Factor    | Margin ratio (varies)    | Defined per protocol (Aave: HF = collateral×LT/debt) |
| aToken           | No equivalent            | Balance grows automatically every block              |
