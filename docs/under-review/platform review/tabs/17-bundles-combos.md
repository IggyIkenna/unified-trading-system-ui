# Tab: Bundles / Combos

**Route:** `/services/trading/bundles`
**Page file:** `app/(platform)/services/trading/bundles/page.tsx`
**Lines:** 19 | **Status:** Placeholder
**Component:** `BundleBuilder` — lines unknown (not yet fully explored)

---

## Current State

Thin page rendering `BundleBuilder`. This is the most under-specified tab in the terminal.

**What it renders:**

- Page title and `BundleBuilder` component

**Data sources:** None at page level. Unknown at component level.

**Filtering/scoping:** None.

---

## Meeting Review Items

From `trading-defi-ops-combo-builder.md`:

- **Combos are a unified concept across all asset classes** — each asset class has its version:
  - DeFi: atomic bundles (all-or-nothing on-chain, but these go to DeFi Ops tab)
  - Options & Futures: multi-leg spreads (straddle, strangle, butterfly, calendar) — but these may live on Options tab too
  - Sports: accumulators (multi-match parlay — all legs must win)
  - Predictions: multi-outcome prediction market positions
  - Spot: no combos (spot trades are always single-leg)
- **This tab = cross-asset combo builder** — the general-purpose multi-leg trade construction tool that works across asset classes. Asset-class-specific complex instruments (DeFi atomic bundles, options vol strategies) may also link from here.
- **Combos feed into research/strategy:** A user should be able to create a combo here and push it to the Research environment for backtesting, then through the promote pipeline to live.
- **Rename suggestion:** "Bundles" → "Combos" or "Combo Builder" for clarity. "Bundles" is ambiguous (could mean atomic DeFi bundles or multi-leg combos).

---

## What This Tab Should Become

A **cross-asset combo/multi-leg trade builder** that:

1. Lets the user build a combo from multiple legs
2. Adapts the leg-entry UI based on asset class
3. Shows the combined profile: net Greeks, net P&L at various prices, breakeven
4. Can be saved as a named combo template
5. Can be executed directly (sends all legs simultaneously or as near-simultaneous as possible)
6. Can be sent to Research for backtesting (future phase)

**Combo types by asset class:**

| Asset Class    | Combo Type                   | Example                              |
| -------------- | ---------------------------- | ------------------------------------ |
| CeFi           | Basis trades, cash-and-carry | Buy BTC spot + short BTC perp        |
| DeFi           | Cross-protocol combos        | Borrow on Aave → LP on Uniswap       |
| TradFi Options | Multi-leg option strategies  | Straddle, butterfly, calendar spread |
| TradFi Futures | Spread trades                | Front month vs back month            |
| Sports         | Accumulator                  | 3-match parlay                       |
| Predictions    | Multi-outcome                | BTC up AND EPL Arsenal win           |

---

## Improvements Needed

1. **Define the scope clearly:** Decide what goes here vs. the DeFi Ops tab (atomic bundles) vs. the Options tab (multi-leg options). Recommendation: this tab is the **generic combo builder** — DeFi Ops handles DeFi-specific atomic execution, Options tab handles options-specific construction. Combos here focus on **cross-asset** and **simpler multi-leg** trades.
2. **Asset-class selector in the builder:** User picks their asset-class context first, then the leg-entry UI adapts. A sports accumulator builder looks nothing like a futures calendar spread builder.
3. **Leg builder UI:**
   - Add legs one at a time (or as a template)
   - Each leg: instrument, side, quantity, price type
   - See combined P&L preview at each combination
4. **Combined risk profile:** After specifying all legs, show: combined delta, combined max loss, breakeven price(s), payoff diagram.
5. **Execution flow:** Submit all legs. For options, try to execute as a strategy (block trade or combo order to the venue if supported). For sports, submit as an accumulator bet. For DeFi cross-protocol, link out to DeFi Ops with the steps pre-filled.
6. **Save as template:** Name and save a combo structure for reuse (e.g., "My standard BTC carry trade").
7. **Research integration (future):** "Send to Research for backtesting" button that creates a strategy candidate from this combo definition.
8. **Rename tab:** "Bundles" → "Combos" in `TRADING_TABS` and throughout the UI.

---

## Asset-Class Relevance

**Common** (cross-asset) — but only for asset classes that support multi-leg trades. Spot has no combos. Each asset class uses the same tab with adapted UI.

---

## Action

**Rebuild** — entirely placeholder. Needs a full spec and implementation from scratch. Scope clarification with DeFi Ops tab needed before building. Rename to "Combos" recommended.
