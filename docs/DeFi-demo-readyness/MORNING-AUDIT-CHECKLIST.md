# Morning Audit Checklist — DeFi Demo

> Work through this top to bottom before the demo.
> Login: `patrick@bankelysium.com` / `demo` / Elysium / role: client
> App URL: localhost (run `npm run dev` first)

---

## PART 1: Login & Tab Visibility

### 1.1 Login

- Login with `patrick@bankelysium.com` / `demo` / org: Elysium
- Correct name and org shown in top bar / profile
- No error on login

### 1.2 Lifecycle Tab Visibility (outer navigation)

Patrick should only see the **Trading** lifecycle group. Everything else should be hidden or inaccessible.

| Lifecycle Tab    | Expected for Patrick                                 | Check |
| ---------------- | ---------------------------------------------------- | ----- |
| Build / Research | NOT visible                                          | [ ]   |
| Data             | NOT visible                                          | [ ]   |
| **Trading**      | VISIBLE, fully accessible                            | [ ]   |
| Observe / Ops    | NOT visible                                          | [ ]   |
| Admin            | NOT visible                                          | [ ]   |
| Reports          | **QUESTION: visible or hidden?** — confirm with team | [ ]   |

> **⚠️ If any of these are visible when they shouldn't be, that's a tab-visibility bug to fix before demo.**

### 1.3 Trading Left Nav — Tab Lock State

Within the Trading lifecycle, Patrick should see these tabs:

| Tab                   | Expected                                                | Check |
| --------------------- | ------------------------------------------------------- | ----- |
| Overview              | Unlocked, visible                                       | [ ]   |
| Book                  | Unlocked, visible                                       | [ ]   |
| Orders                | Unlocked, visible                                       | [ ]   |
| Positions             | Unlocked, visible                                       | [ ]   |
| Alerts                | Unlocked, visible                                       | [ ]   |
| Risk                  | Unlocked, visible                                       | [ ]   |
| P&L                   | Unlocked, visible                                       | [ ]   |
| Accounts              | Unlocked, visible                                       | [ ]   |
| Instructions          | Unlocked, visible                                       | [ ]   |
| **DeFi**              | Unlocked, visible — full sub-tab set                    | [ ]   |
| **Strategies**        | FOMO-LOCKED (padlock + upgrade CTA)                     | [ ]   |
| **Strategy Families** | FOMO-LOCKED (padlock + upgrade CTA)                     | [ ]   |
| **Sports**            | FOMO-LOCKED (`sports-trading` entitlement missing)      | [ ]   |
| **Predictions**       | FOMO-LOCKED (`predictions-trading` entitlement missing) | [ ]   |
| **Options**           | FOMO-LOCKED (`options-trading` entitlement missing)     | [ ]   |
| Terminal              | Visible but not DeFi-relevant (check it's not broken)   | [ ]   |

> **⚠️ Any locked tab that is showing as unlocked, or any widget from a locked page that is accessible = fix before demo.**

### 1.4 DeFi Sub-Tabs

Within the DeFi tab, Patrick should see ALL of:

- Wallet / Summary
- Lending
- Swap
- LP (Liquidity)
- Staking
- Flash Loans
- Transfer
- Rates
- Trade History ← new widget
- Strategy Config ← new widget

---

## PART 2: DeFi Tab — Widget-by-Widget Audit

### 2.1 Wallet Summary Widget

**What to check:**

- Connected wallet address shown (truncated, e.g. `0x7a23…abcd`)
- Chain selector dropdown works (switches between Ethereum, Arbitrum, etc.)
- Portfolio USD value displayed (mock: ~$208K based on mock balances)
- Tracked token count shown
- Treasury status badge visible
- Treasury balance displayed in USD
- Net Delta KPI visible (with color: amber if nonzero, green if zero)

**Rebalance Button — KNOWN BUG TO FIX:**

- Currently the button only shows when `treasury.status !== "normal"` but mock data has `status: "normal"` → **button is invisible**
- Fix needed: button should always be visible, just disabled/grayed when treasury is normal
- Fix needed: when treasury is "high" (35% > 20% target), button is enabled/amber
- Fix needed: clicking it should open the `DeFiRebalanceDialog` modal — currently the dialog component exists but is NEVER rendered anywhere

**After fix, check:**

- Rebalance button visible and DISABLED when treasury = normal
- Rebalance button ENABLED (amber) when treasury = high
- Clicking enabled button opens full rebalance dialog modal
- Dialog shows: current % / target % / capital to deploy / per-strategy allocations / gas estimate
- "Deploy Capital" button in dialog triggers state change
- After confirm: treasury flips to normal, button grays out

**Mock data changes needed for demo flow:**

- Need two treasury states: `"high"` (35% → show Rebalance button enabled) and `"normal"` (20% → button disabled)
- Confirming rebalance should flip from high to normal

### 2.2 Lending Widget

**What to check:**

- Protocol dropdown shows Aave V3 (AAVEV3-ETHEREUM) as first option
- Other protocols listed: Morpho, Compound V3
- Selected protocol shows current supply APY for each asset
- Asset selector shows USDC, USDT, DAI
- Amount input field works
- Slippage selector shows options (0.1%, 0.5%, 1.0%, custom)
- Expected output shown (should show aUSDC 1:1 for lending)
- Execute button works and adds to trade history

**DeFi-specific things to audit:**

- Protocol shows `venue_id` in canonical format (e.g. `AAVEV3-ETHEREUM`) not just "Aave"
- Utilization rate shown (high utilization = withdrawal risk)
- Health Factor shown as N/A or not shown at all (lending-only = no HF)

### 2.3 Swap Widget

**What to check:**

- From/To token dropdowns work
- USDC, USDT, ETH, WETH, weETH, DAI all present
- Price impact shown
- Gas estimate shown
- Slippage tolerance selector present
- Algo type selector present (SOR_DEX should be default for swaps)
- Expected output updates when amount changes
- Execute button works

**DeFi-specific things to audit:**

- ETH→weETH swap shows higher slippage warning (weETH liquidity is thinner: ~25bps vs ~5bps for ETH)
- Route shown (e.g. "Via Uniswap V3" or "Via Curve → Uniswap")

### 2.4 Staking Widget

**What to check:**

- Protocols: Lido (stETH), EtherFi (weETH), RocketPool (rETH) all showing
- Current APY for each
- Unbonding period shown (Lido: 7 days, RocketPool: variable, EtherFi: ~3 days)
- Venue IDs in canonical format (not just "EtherFi")
- Stake / Unstake actions present

### 2.5 Flash Loans Widget

**What to check:**

- Atomic bundle builder shows pre-loaded steps (SWAP + SWAP as defaults)
- Can add/remove steps
- Each step has: operation type, algo type, asset, amount, venue, max slippage
- Operation types include: FLASH_BORROW, SWAP, LEND, BORROW, FLASH_REPAY
- P&L preview shows: gross profit, flash fee, gas estimate, net P&L
- For Recursive Staked Basis demo: can build the 6-step bundle (FLASH_BORROW → SWAP → SWAP → LEND → BORROW → FLASH_REPAY)
- Execute button present

### 2.6 Transfer Widget

**What to check:**

- Send mode and Bridge mode tabs work
- Chain selector (from/to) for bridge
- Token selector
- Bridge routes shown with fees and estimated time
- Venue/bridge selection (Across, Stargate, etc.)

### 2.7 Rates Overview Widget

**What to check:**

- Shows lending rates across protocols (Aave, Morpho, Compound)
- Shows rates per asset (USDC, USDT, ETH, WETH)
- Venue IDs shown
- Sort/filter by rate works

### 2.8 Trade History Widget ← NEW

**What to check:**

- Widget loads without error
- Summary KPIs show: trade count, total gas, total slippage, net P&L
- Table shows 3 mock rows (TRANSFER, LEND, interest accrual for AAVE lending)
- Instruction type badges have correct colors (TRANSFER=slate, LEND=green, etc.)
- Amount, Expected, Actual columns show correct values
- Slippage column shows "--" for zero-slippage ops (TRANSFER)
- Gas column shows red amount for on-chain txs, "--" for off-chain
- Net P&L column shows green/red coloring
- Running P&L column shows cumulative total
- Status badge shows "filled" for completed trades

**DeFi-specific things to audit:**

- Instrument IDs are readable (not showing full canonical ID like `AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM`)
- Consider: should we show instrument as "aUSDC @ Aave V3" for readability?
- Timestamp format is human-readable (HH:MM)

### 2.9 Strategy Config Widget ← NEW

**What to check:**

- Strategy selector shows all 4 demo strategies: AAVE_LENDING, BASIS_TRADE, STAKED_BASIS, RECURSIVE_STAKED_BASIS
- AAVE_LENDING form shows: lending basket multi-select, min APY threshold, chain selector
- BASIS_TRADE form shows: basis coins, perp venues, min funding rate, max venue %, max coin %
- STAKED_BASIS form shows: LST token, perp venue, max delta deviation
- RECURSIVE_STAKED_BASIS form shows: target leverage, max leverage, min net APY, hedged toggle, reward mode, depeg tolerance, flash loan provider
- RECURSIVE_STAKED_BASIS shows "Demo Only" warning banner
- Save Config button shows toast notification
- Promote from Backtest button shows toast
- Mode badge shows "Active" or "Paper"

---

## PART 3: Other Tabs — DeFi-Specific Content

### 3.1 Positions Tab

**DeFi-specific columns to verify:**

- "Net Delta" column visible for DeFi positions
- "Health Factor" column visible (with color coding: green >1.5, yellow 1.25–1.5, red <1.25)
- DeFi positions appear alongside CeFi positions (not separate tab)
- weETH position shows as LONG with staking yield note
- aUSDC position shows balance growing (interest-bearing)
- debtWETH shows as negative (debt subtracted from equity)
- aweETH position shows as collateral
- Net Delta near 0 for basis/staked-basis strategies
- HF = N/A or blank for AAVE lending (no debt)
- HF = 1.52 for recursive staked basis (from mock data)

**Things to audit for DeFi accuracy:**

- Are instrument IDs shown in human-readable form or raw canonical IDs?
- Does P&L column show daily interest accrual correctly?
- Is "venue" column showing DeFi venues (AAVEV3-ETHEREUM, HYPERLIQUID) correctly?

### 3.2 Risk Tab

**DeFi section to verify:**

- KPI strip shows "DeFi Delta Exposure" cards for active DeFi strategies
- Strategy Risk Profiles table visible with columns: Strategy, Protocol Risk, Basis Risk, Funding Risk, Liquidity Risk
- Risk level badges color-coded: green=low, yellow=medium, red=high, red=critical
- RECURSIVE_STAKED_BASIS shows: protocol=medium, basis=medium, funding=high
- AAVE_LENDING shows: protocol=low, no basis risk, no funding risk
- HF time series accessible (toggle to chart view)
- DeFi section hidden if no DeFi strategies active (verify this logic)

**Things to audit:**

- Is the delta exposure shown in USD and ETH terms? (should be both for DeFi)
- Are the risk profiles for all 4 strategies present?

### 3.3 Book Tab (Order Form)

**DeFi instruction types to verify:**

- When venue category is "defi", instruction type dropdown appears
- Instruction types available: SWAP, LEND, BORROW, REPAY, WITHDRAW, TRANSFER, TRADE, STAKE, UNSTAKE, FLASH_BORROW, FLASH_REPAY, ADD_LIQUIDITY, REMOVE_LIQUIDITY, COLLECT_FEES
- Algo dropdown filters based on selected instruction type (e.g. SWAP shows SOR_DEX, not DIRECT_MARKET)
- Max slippage selector shows for relevant instruction types
- Buy/Sell buttons hidden in DeFi mode (replaced by Execute)
- CeFi order form unchanged when non-DeFi venue selected

**For the demo flows, specifically test:**

- SWAP → SOR_DEX → USDC/ETH → slippage 0.5% → Execute
- TRANSFER → DIRECT → USDC → to Hyperliquid → Execute
- TRADE → DIRECT_MARKET → ETH-USDC → SHORT → Execute

**Algo config widget:**

- SOR_DEX algo shows venue list (Uniswap, Curve, Balancer)
- DIRECT_MARKET shows venue + order type options
- FLASH_LOAN_MORPHO shows flash provider details

### 3.4 Alerts Tab

**DeFi alerts to verify:**

- 5 DeFi-specific alerts visible in the list:
  1. `alert-defi-001`: HF dropped to 1.18 — CRITICAL severity (red)
  2. `alert-defi-002`: ETH funding negative on Hyperliquid — MEDIUM severity
  3. `alert-defi-003`: Treasury below minimum 8% — HIGH severity
  4. `alert-defi-004`: Impermanent Loss > Fee income — MEDIUM severity
  5. `alert-defi-005`: weETH/ETH deviation 1.2% — HIGH severity
- DeFi alerts coexist with CeFi alerts (not a separate section)
- Severity badges color-coded correctly
- Alerts filterable by strategy / severity

### 3.5 Overview Tab (KPI Strip)

**DeFi KPI to verify:**

- "DeFi Delta" KPI card visible in overview strip
- Shows net delta in USD
- Color: amber if nonzero, green if zero

### 3.6 Reconciliation

**DeFi reconciliation records to verify:**

- Navigate to reconciliation (in Reports or dedicated page — confirm location)
- DeFi venues appear in filter dropdown: AAVEV3-ETHEREUM, HYPERLIQUID, UNISWAPV3-ETHEREUM, ETHENA-ETHEREUM
- Break types include: balance, gas, position, fee, pnl
- 5 mock DeFi records visible:
  - DREC-001: aUSDC position break, AAVEV3-ETHEREUM, pending
  - DREC-002: USDC balance discrepancy, Hyperliquid, resolved
  - DREC-003: Fee discrepancy, Uniswap V3, investigating
  - DREC-004: Funding P&L difference, Ethena, resolved
  - DREC-005: Gas cost break, AAVEV3-ETHEREUM, resolved
- Accept / Reject / Investigate buttons update status
- Resolved records show resolved state

### 3.7 P&L Tab

**DeFi P&L to verify:**

- `strat-defi-yield` strategy shows daily P&L data (mock: avg $1,500/day, vol $2,000)
- P&L chart visible and working
- Funding income component visible in attribution (if waterfall is shown)
- Interest accrual component visible

---

## PART 4: Known Bugs to Fix

### BUG-1: Rebalance Button Hidden (HIGH — blocks demo flow 5)

**File:** `components/widgets/defi/defi-wallet-summary-widget.tsx` line 102

**Current behavior:** Button only renders when `treasury.status !== "normal"`. Mock data has `status: "normal"` → button never shows.

**Fix required:**

1. Button always visible — remove the conditional render
2. Button disabled/grayed when `treasury.status === "normal"`
3. Button enabled/amber when `treasury.status === "high"` or `"low"`
4. Change mock treasury status to `"high"` (35% is above 20% target = high)

### BUG-2: Rebalance Dialog Never Rendered (HIGH — blocks demo flow 5)

**File:** `components/widgets/defi/defi-rebalance-dialog.tsx` — component exists, never imported/used

**Current behavior:** Clicking rebalance (once fix #1 is done) shows an inline panel in wallet summary. The full `DeFiRebalanceDialog` modal with per-strategy allocation breakdown is never shown.

**Fix required:**

1. Import `DeFiRebalanceDialog` in `defi-wallet-summary-widget.tsx`
2. Render it conditionally when `rebalancePreview !== null`
3. Pass `onConfirm` handler that: clears preview + flips treasury to "normal"
4. Pass `onCancel` handler that clears preview

### BUG-3: TypeScript Errors in api-generated.ts (LOW — not blocking)

**File:** `lib/types/api-generated.ts` — duplicate identifier errors in auto-generated OpenAPI types

**Impact:** Zero on demo — DeFi code doesn't use this file. App runs fine (Next.js uses SWC, not tsc for dev).

**Fix:** Regenerate using `bash unified-trading-pm/scripts/openapi/generate-unified-openapi.sh` — but not urgent for demo.

---

## PART 5: UI Improvements to Consider for DeFi

These are things that might look "off" to a DeFi-aware client. Review each and decide if worth fixing before demo.

### 5.1 Instrument ID Display

**Issue:** DeFi canonical IDs are long and technical:
`AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM`

**Consider:** Display as short labels: "aUSDC (Aave V3)" or just "aUSDC"

**Affects:** Trade history widget, positions table, anywhere instrument IDs are shown raw.

### 5.2 Health Factor Prominence

**Issue:** For Recursive Staked Basis, HF is the most critical metric. If it's just a column in a positions table, the client may miss it.

**Consider:** Show HF prominently in Risk tab with a large gauge or warning color bands. Make it clear: green >1.5, yellow 1.25–1.5, red <1.25, danger <1.0.

### 5.3 aToken Position Display

**Issue:** In lending strategies, the "position" is aUSDC, not USDC. The balance grows automatically every block.

**Consider:** In positions table, show both: token amount (aUSDC 100,000) AND accrued interest since entry (+13.15 USD today). Make it visually distinct from a regular long position.

### 5.4 Delta Display in ETH Terms

**Issue:** Net delta shown in USD only. For basis traders, ETH delta matters more.

**Consider:** Show delta as both: "$0" and "0 ETH" for DeFi positions. The client will think in ETH terms for the hedge.

### 5.5 Debt Token Visualization

**Issue:** For Recursive Staked Basis, `debtWETH` is a negative position. How is it displayed?

**Consider:** Debt tokens should be clearly red/negative in positions table. Show label "DEBT" or "Borrowed" to distinguish from a regular short position. Should NOT look like a perp short.

### 5.6 Flash Loan Atomicity Indicator

**Issue:** The 6 steps in the flash loan bundle are atomic (all-or-nothing). This is different from regular multi-leg execution.

**Consider:** In flash loan widget and trade history, visually group atomic steps (e.g. bracket or shared background). Label them "ATOMIC BUNDLE" so the client understands they all execute in one transaction.

### 5.7 Gas Cost Prominence

**Issue:** Every on-chain DeFi transaction has gas cost. This is a P&L drag that CeFi traders don't think about.

**Consider:** Show estimated gas (in USD) prominently in every form before executing. Show "estimated cost including gas: $12" not just the trade amount.

### 5.8 Funding Rate Display for Basis Strategies

**Issue:** For Basis Trade and Staked Basis, the funding rate is the core return driver. Is it visible anywhere per-venue?

**Consider:** In positions table or a dedicated section, show current funding rate per venue/instrument for the active basis positions. Include: venue, funding rate %, annualized APY equivalent, next settlement time.

### 5.9 Treasury % Gauge

**Issue:** Treasury management is core to the demo flow. "Treasury at 35% of AUM" should be immediately visible.

**Consider:** In Wallet Summary, add a simple bar or gauge: [===Treasury===][=====Deployed=====] with target line marked. Makes the "deploy capital" narrative visual.

### 5.10 Weighting Display for Multi-Venue Basis

**Issue:** Basis trade splits shorts across 5 venues weighted by funding rate. How is the allocation visible?

**Consider:** In positions or a dedicated basis view, show per-venue breakdown: Hyperliquid 30% ($27K notional, 6.5% funding), Binance 25% ($22.5K, 5.8% funding), etc. This is key to the strategy story.

---

## PART 6: Demo Day Flow (Script)

Pre-demo: have the app running with treasury status = "high" (35% > 20% target)

### Flow 1: AAVE Lending (~3 min)

1. DeFi → Wallet Summary: point to treasury balance $350K, treasury status
2. DeFi → Lending: select AAVEV3-ETHEREUM, USDC, enter $100K, set slippage → Execute
3. DeFi → Trade History: show TRANSFER + LEND rows, P&L decomposition ($2 gas + $12 gas = -$14 net)
4. Positions: show aUSDC position appearing
5. P&L: mention interest will accrue daily at ~$13/day

### Flow 2: Basis Trade (~3 min)

1. Book → instruction: SWAP, algo: SOR_DEX → USDC→ETH → Execute
2. Book → instruction: TRANSFER × 5 venues (Hyperliquid, Binance, OKX, Bybit, Aster)
3. Book → instruction: TRADE × 5 venues → SHORT ETH
4. Positions: show ETH LONG + 5 SHORTs → net delta ≈ 0
5. P&L: show funding income building

### Flow 3: Recursive Staked Basis (~4 min)

1. DeFi → Flash Loans: show pre-built bundle (FLASH_BORROW → SWAP → SWAP → LEND → BORROW → FLASH_REPAY)
2. Show P&L preview: gross/fee/gas/net
3. Execute → Trade History: all 6 steps at same timestamp (atomic)
4. Positions: show aweETH collateral + debtWETH + perp SHORT, HF = 1.375
5. DeFi → Strategy Config: show recursive params (leverage 2.5x, hedged=true, MORPHO flash)
6. Risk: show HF gauge

### Flow 4: Rebalance (~2 min)

1. Wallet Summary: point to treasury at 35% (above 20% target), Rebalance button enabled
2. Click Rebalance → dialog shows per-strategy allocation
3. Confirm → treasury moves toward 20%, button grays out
4. Trade History: TRANSFER instructions appeared for each strategy

### Flow 5: Reconciliation (~1 min)

1. Navigate to reconciliation
2. Show DeFi breaks in filter/table
3. Click Accept on one → status updates

---

## PART 7: Questions for the Team

- **Reports tab**: should Patrick see Reports/Reconciliation tab? Confirm visibility rule.
- **Account balances**: what currency/denomination should AUM be shown in for Patrick? USD or ETH?
- **Demo-only flag**: RECURSIVE_STAKED_BASIS should be locked post-demo. Is the demo-only banner in Strategy Config sufficient, or does it need an actual entitlement gate?
- **Rebalance flow**: after confirming rebalance, should trade history auto-populate with TRANSFER instructions, or is it just a mock state change?
- **Time zone**: what time zone should trade history timestamps be displayed in? UTC or client's local time?
