# Tab: Markets

**Route:** `/services/trading/markets`
**Page file:** `app/(platform)/services/trading/markets/page.tsx`
**Lines:** ~1,725 | **Status:** Full implementation but **entirely mock/generated data** — no API hooks

---

## Current State

Market intelligence and microstructure page. Three sub-tabs using TanStack `Tabs`:

**Trade Desk sub-tab:**

- Market order flow (generated mock data)
- Live book depth (mock)
- Own orders in context of market (mock)
- DeFi AMM table (mock)
- Asset-class and date range selectors

**Latency sub-tab:**

- Service latency metrics (mock generators)
- Latency charts

**Reconciliation sub-tab:**

- Reconciliation runs (mock)
- Recon status and diff view

**Data sources:** None. Uses `ORGANIZATIONS`, `CLIENTS`, `STRATEGIES` from `@/lib/trading-data` and in-file mock generators for all data. `React.useState` / `useMemo` only — no `hooks/api` calls.

**Filtering/scoping:** Local `selectedOrgIds` / `selectedClientIds` / `selectedStrategyIds` for P&L multipliers on generated data. Asset class and range selectors local only.

---

## Meeting Review Items

From `trading-accounts-risk-pnl-reconciliation.md`:

- **Reconciliation:** The Reconciliation sub-tab here is entirely mock. Real reconciliation needs to be driven by the backend reconciliation process. The position health + quick reconcile flow should eventually feed into a proper reconciliation view — whether that's here or on Positions.

From `trading-sports-predictions.md`:

- **Arb streaming:** The concept of showing live and historical arb opportunities across bookmakers/venues is essentially a "markets" concept. The arb grid for sports and predictions could live here or on the Sports/Predictions tabs.

---

## Improvements Needed

1. **Wire to real API:** The Markets page is entirely mock. This is the biggest gap — it needs proper hooks:
   - Trade Desk: `useOrderFlow`, `useMarketDepth`, or similar
   - Latency: `useServiceLatency` or pull from observability
   - Reconciliation: `useReconciliationRuns` — or move this to a dedicated reconcile section within Positions
2. **Reconciliation sub-tab decision:** Decide whether reconciliation lives here (Markets → Reconciliation) or within Positions (as a quick reconcile drawer + deep dive). Likely: quick reconcile from Positions, deep-dive recon runs here. They serve different audiences (trader vs ops).
3. **Arb grid (new sub-tab):** Add a cross-venue arb detection sub-tab — shows current bid/ask across all subscribed venues for a given instrument, highlighting arb opportunities. This applies to CeFi/TradFi instruments. Sports arb grid belongs on the Sports tab.
4. **DeFi AMM view:** The DeFi AMM table is already in Trade Desk as a mock. Wire to real on-chain pool data when available.
5. **Markets page scope:** Consider renaming or clarifying scope — "Markets" currently means microstructure/market data, not "instrument browse". Make the distinction clear in the tab label or add a sub-title.

---

## Asset-Class Relevance

**Common** — microstructure and market data exists for all asset classes. Sub-tab composition may differ:

- **CeFi/TradFi:** Order flow, book depth, latency, cross-venue arb
- **DeFi:** AMM pool data, on-chain liquidity, gas prices
- **Sports+Predictions:** Odds movement, bookmaker availability, arb grid (but this may belong on Sports tab)

---

## Action

**Rebuild** — the structure is good, but it's entirely mock. Must be wired to real APIs. Reconciliation sub-tab ownership needs a decision. Arb grid sub-tab to be added.
