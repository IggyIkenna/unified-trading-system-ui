# Tab: P&L Breakdown

**Route:** `/services/trading/pnl`
**Page file:** `app/(platform)/services/trading/pnl/page.tsx`
**Lines:** 1,715 | **Status:** Full implementation

---

## Current State

P&L attribution and decomposition page. Shows where P&L came from broken down by factors and strategies.

**What it renders:**

- Stacked area charts: cumulative P&L over time by factor/strategy
- Waterfall chart: period P&L decomposed into components
- `PnLValue` / `EntityLink` — clickable P&L components linking to strategy detail
- By-client column view: P&L contribution per client
- Factor drill-down: attribution components (alpha, delta, carry, basis, funding, fees, residual/unexplained)
- Live/batch toggle and date range selector
- Cross-section vs time-series view toggle
- Optional extras from `tickersData`: `reconRuns`, `latencyMetrics`, `structuralPnL`, `residualPnL`

**Data sources:** `useTickers`, `useStrategyPerformance`, `useOrganizationsList`, `useGlobalScope`

**Note:** This page and `markets/page.tsx` overlap thematically. The `markets/page.tsx` has a separate **Trade Desk / Latency / Reconciliation** tab set but uses only mock/generated data — not this page's API-backed structure.

---

## Meeting Review Items

From `trading-accounts-risk-pnl-reconciliation.md`:

- **P&L attribution metrics are also risk metrics:** Basis, carry, funding are both P&L components and risk exposures. Two options discussed: (1) add a toggle to view the same metrics in "risk framing" vs "P&L framing" on this tab, or (2) keep separate Risk tab for risk framing.
- **Unexplained residual alert:** The `residualPnL` component already exists. Need to alert when the residual exceeds a configurable threshold (e.g., >10% of total P&L). Surface a warning banner on this page and fire an alert in the Alerts tab.
- **P&L reconciliation:** The unexplained residual is already there — "that's actually already fine." The missing piece is the threshold-based alert.

---

## Improvements Needed

1. **Unexplained residual threshold alert:** Add a banner warning on this page when `residualPnL / totalPnL` exceeds a threshold. Also link to the Alerts tab where a corresponding alert should be created.
2. **Risk-framing toggle:** Add a view toggle: "P&L View" vs "Risk Exposure View". In risk view, the same components (basis, carry, funding, delta) are presented as exposure levels rather than P&L contributors. Reuses the same data, just different framing and chart types.
3. **Time series on all components:** Some components are shown as snapshots in the waterfall. Clicking a waterfall component should show its time series.
4. **Reconciliation runs linkage:** `reconRuns` from `tickersData` is optionally loaded — make this more prominent. Show when the last reconciliation ran and what the reconciled vs unreconciled P&L split is.
5. **Overlap with Markets page:** The Markets page has a Reconciliation sub-tab that duplicates some of this. Decide whether Markets/Reconciliation should be merged into P&L Breakdown or remain separate (see Markets tab doc).

---

## Asset-Class Relevance

**Common** — P&L attribution applies to all asset classes. Some attribution components are asset-class specific:

- CeFi/DeFi: funding rate P&L component
- DeFi: gas costs as a P&L component
- TradFi: dividend, carry components
- Sports+Predictions: market-making edge, settlement P&L
  These should appear conditionally based on which instruments are in the portfolio.

---

## Action

**Enhance** — add residual alert banner, risk-framing toggle, time series drill-down on waterfall components, clarify overlap with Markets page.
