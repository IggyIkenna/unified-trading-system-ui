# 4.13 DeFi — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **Page route:** `/services/trading/defi`

---

## Current Widget Inventory

| widgetId | Label | Component | Singleton | Default Preset |
|----------|-------|-----------|-----------|----------------|
| `defi-wallet-summary` | Wallet Summary | `DeFiWalletSummaryWidget` | yes | 12x2 at (0,0) |
| `defi-lending` | DeFi Lending | `DeFiLendingWidget` | yes | 4x6 at (0,2) |
| `defi-swap` | DeFi Swap | `DeFiSwapWidget` | yes | 4x6 at (4,2) |
| `defi-liquidity` | Liquidity Provision | `DeFiLiquidityWidget` | yes | Only in "Advanced" preset |
| `defi-staking` | Staking | `DeFiStakingWidget` | yes | 4x6 at (8,2) |
| `defi-flash-loans` | Flash Loan Builder | `DeFiFlashLoansWidget` | yes | Only in "Advanced" preset |
| `defi-transfer` | Transfer & Bridge | `DeFiTransferWidget` | yes | 4x4 at (8,8) |
| `defi-rates-overview` | Rates Overview | `DeFiRatesOverviewWidget` | yes | 8x4 at (0,8) |

**Total: 8 widgets.**

**Data provider:** `DeFiDataProvider` wraps the page.

**Presets:** 2 presets:
1. **"Default"** — Wallet Summary → Lending + Swap + Staking (3 equal columns) → Rates Overview + Transfer
2. **"Advanced"** — Wallet Summary → Flash Loans + Liquidity (2 columns) → Lending + Swap + Staking (3 columns)

---

## What Each Widget Does

### defi-wallet-summary
- Token balances, connected wallet address, chain selector.
- Global context for all DeFi operations.

### defi-lending
- Protocol selector (AAVE, Compound, Morpho), action tabs (Lend/Borrow/Withdraw/Repay), APY display, health factor preview.

### defi-swap
- Token pair selector, amount input, slippage tolerance, route preview with price impact and gas estimate.

### defi-liquidity
- Add/remove liquidity, pool selector, fee tier, price range (concentrated liquidity), TVL/APR display.

### defi-staking
- Stake/unstake forms, protocol APY, yield metrics, TVL, unbonding period info.

### defi-flash-loans
- Multi-step flash loan bundle builder, borrow/repay legs, P&L preview.

### defi-transfer
- Send on one chain or bridge cross-chain with gas estimate.

### defi-rates-overview
- Protocol APY comparison table across lending, staking, and LP yields.

---

## Testing Checklist

- [ ] **Wallet Summary:** Token balances render; chain selector works
- [ ] **Lending:** Protocol selector works; action tabs switch correctly; APY and HF values show
- [ ] **Swap:** Token pair selector works; slippage and route preview render
- [ ] **Liquidity:** Pool selector, fee tier, price range controls work
- [ ] **Staking:** Stake/unstake forms render; APY and TVL values show
- [ ] **Flash Loans:** Step builder renders; borrow/repay legs and P&L preview
- [ ] **Transfer:** Chain selector, amount, gas estimate render
- [ ] **Rates Overview:** APY comparison table populates

---

## Merge Proposal

### Option A — No merge (recommended)
- Each widget represents a distinct DeFi operation (lending, swapping, staking, LPing, flash loans, bridging).
- They're naturally independent actions — users may want to show some and hide others.
- The 2 presets handle "beginner" (Default) vs "advanced" (with flash loans + liquidity) well.
- **Result:** 8 widgets (no change).

### Option B — Merge wallet-summary into a global header
- Embed wallet info as a persistent bar at the top of the page (outside widget grid).
- Delete `defi-wallet-summary` widget.
- **Result:** 7 widgets.

### Option C — Merge lending + staking (both are yield operations)
- Combine into a single "Yield" widget with protocol and action tabs.
- **Result:** 7 widgets.

---

## Questions for User

1. **Merge?** A (no merge), B (wallet as page header), or C (lending+staking)?
2. **Flash Loans + Liquidity:** These are only in the Advanced preset. Are they tested and functional?
3. **Any broken data?** Which widgets show data and which are empty/placeholder?
