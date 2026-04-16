# Tab: Options & Futures

**Route:** `/services/trading/options`
**Page file:** `app/(platform)/services/trading/options/page.tsx`
**Lines:** 19 | **Status:** Placeholder
**Component:** `components/trading/options-futures-panel.tsx` — 3,281 lines (the actual implementation — largest component in the trading directory)

---

## Current State

Thin page that renders `OptionsFuturesPanel`. The component is the largest in the trading area at 3,281 lines.

**`OptionsFuturesPanel` internal structure:**

- Internal `Asset` and `Settlement` type definitions
- Options chain-style UI with `Checkbox`, `Slider`, `ScrollArea`, tooltips
- Uses `placeMockOrder` from `@/lib/api/mock-trade-ledger` — not wired to `hooks/api`
- Appears to cover: options chain viewing, options strategy construction, futures, vol surface

**Note:** The Terminal page already has dynamic `OptionsChain` and `VolSurfaceChart` available when an options instrument is selected. There is overlap between what the Terminal offers for options and what this dedicated panel offers.

---

## Meeting Review Items

From the meeting (research/build context):

- **Strategy comparison in absolute vs comparison mode:** Options strategies need comparison mode — straddle vs strangle vs butterfly side-by-side.
- **Multi-leg combos:** Options multi-leg strategies (straddle, strangle, butterfly, calendar spread) are a specific type of Combo (from `trading-defi-ops-combo-builder.md`). They can be constructed here and also via the Bundles/Combos tab.

From `trading-accounts-risk-pnl-reconciliation.md`:

- **Full Greeks display:** Greeks (delta, gamma, vega, theta) are mentioned as missing in the main Risk tab. The Options tab should be the definitive home for per-option-position Greeks, with the Risk tab showing portfolio-level Greeks.
- **Scenario analysis:** Options are the most complex case for scenario analysis (Deribit-style sliders). Options-specific scenarios (underlying move + vol shift) are core to this tab.

---

## Improvements Needed

1. **Wire to real options/futures API:** Replace `placeMockOrder` with real order placement via `hooks/api/`. Connect options chain data to a live feed (Deribit, OKX options API, or equivalent).
2. **Options chain improvements:**
   - Live bid/ask on options
   - Greeks per strike (delta, gamma, vega, theta) displayed inline in the chain
   - IV (implied volatility) per strike
   - Open interest and volume per strike
3. **Vol surface:** Vol surface chart already exists on the Terminal (dynamic import). Ensure the dedicated panel here has a full interactive vol surface — not just the simplified chart from the Terminal.
4. **Multi-leg strategy builder:** Options spreads, straddles, strangles, butterflies, calendar spreads. User selects legs and sees combined Greek profile, combined P&L, max profit/loss, breakeven points. This is the options-specific version of the Combo Builder.
5. **Scenario analysis panel:** Deribit-style — move the underlying price slider, move vol up/down, see the combined position P&L and Greeks at each scenario point. Liquidation distance indicator.
6. **Terminal overlap:** Define the boundary between Terminal (quick single-leg trade on an options instrument) and this tab (complex multi-leg analysis and construction). Recommendation: Terminal for execution, Options & Futures tab for analysis and multi-leg construction.
7. **Futures-specific content:** The tab is named "Options & Futures" but likely skews heavily options. Futures-specific content: basis charts, funding/roll calendar, futures curve (term structure), basis trade construction.

---

## Asset-Class Relevance

**TradFi + CeFi** — options and futures exist in both traditional finance (equity options, commodity futures) and centralised crypto (Deribit BTC/ETH options, perpetual futures). The panel should handle both:

- TradFi: equity options, index options, commodity futures, FX forwards
- CeFi: crypto options (Deribit), perpetual futures (Binance, OKX), dated futures

DeFi options exist (Lyra, Dopex) but are lower priority — can be added later via DeFi Ops or here.

---

## Action

**Rebuild** — the 3,281-line component exists but is mock-only. Needs real API wiring, proper options chain with live Greeks and IV, vol surface, multi-leg strategy builder, and clear boundary with the Terminal.
