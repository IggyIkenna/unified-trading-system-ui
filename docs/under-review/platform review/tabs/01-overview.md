# Tab: Overview

**Route:** `/services/trading/overview`
**Page file:** `app/(platform)/services/trading/overview/page.tsx`
**Lines:** 1,277 | **Status:** Full implementation

---

## Current State

Command-center dashboard for the entire trading operation. The most complete page in the terminal.

**What it renders:**

- `ScopeSummary` + `InterventionControls` — org/client/strategy context + manual override buttons
- Live/batch P&L, NAV, and exposure charts (`LiveBatchComparison`, `DriftAnalysisPanel`)
- Strategy performance table grouped by org/client — links to `/services/trading/strategies/[id]`
- P&L attribution snippet (`PnLAttributionPanel`)
- Alerts preview (recent unacknowledged)
- Recent fills (from orders API)
- `HealthStatusGrid` for service health
- Link to open the Trading Terminal
- Optional `PromoteFlowModal` preview

**Data sources:** `useTradingOrgs`, `useTradingClients`, `useTradingPnl`, `useTradingTimeseries`, `useTradingPerformance`, `useTradingLiveBatchDelta`, `useAlerts`, `useOrders`, `usePositions`, `useServiceHealth`, `useGlobalScope`, `useWebSocket` (live PnL on `analytics` channel)

**Filtering/scoping:** Global scope (org / client / strategy IDs) filters strategy performance table; local search, asset class, status; `ValueFormatToggle`; batch date selector for charts.

---

## Meeting Review Items

- The "quick view" concept from the meeting (always-visible high-level info on every tab) essentially describes what this page is — but it should be accessible as a persistent panel across all tabs, not just as a dedicated page.
- Live vs As-Of toggle should be prominently integrated here (it's the primary view users check).

---

## Improvements Needed

1. **Quick View panel derivation:** Extract the alert preview + key metric cards into a shell-level `QuickViewBar` component that renders on every tab. The Overview page can remain a full-dashboard view, but the critical metrics travel with the user.
2. **No time series on accounts metrics:** Accounts-level NAV and margin is shown here as a snapshot — should link/match what the Accounts tab shows including time series.
3. **Strategy performance table:** Currently links to strategy detail but no quick inline actions (pause, intervene). Consider adding inline intervention controls consistent with `InterventionControls`.
4. **Health grid:** Service health shown here should match what Observe/Health shows — confirm they share the same data source.
5. **P&L residual alert:** When P&L unexplained residual exceeds threshold, surface a warning here (see reconciliation doc).

---

## Asset-Class Relevance

**Common** — spans all asset classes. When scoped to a single asset class or strategy family, it filters down automatically via `useGlobalScope`.

---

## Action

**Enhance** — good foundation, needs Quick View extraction and minor additions above.
