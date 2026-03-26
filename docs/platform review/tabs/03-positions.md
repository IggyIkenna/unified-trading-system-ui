# Tab: Positions

**Route:** `/services/trading/positions`
**Page file:** `app/(platform)/services/trading/positions/page.tsx`
**Lines:** 911 | **Status:** Full implementation

---

## Current State

Full positions blotter with balances summary. One of the strongest implementations in the terminal.

**What it renders:**

- KPI cards (total positions, total notional, unrealised P&L, margin used)
- Collapsible balances table (per-venue breakdown)
- Main positions table with columns: instrument, side, quantity, entry price, mark price, unrealised P&L, DeFi health factor (for DeFi positions), venue, strategy
- Instrument-type filter chips: All / Spot / Perp / Futures / Options / DeFi / Prediction
- `FilterBar` (search, strategy, venue, side)
- `ExportDropdown` (CSV/XLS)
- `DataFreshness` indicator (live vs batch)
- Links via `getInstrumentRoute` to instrument-specific views
- WebSocket integration for live PnL updates merging into React Query cache

**Data sources:** `usePositions`, `useBalances`, `useGlobalScope`, `useWebSocket`, `useExecutionMode`, `useQueryClient`

**Filtering/scoping:** Global `strategyIds` from scope store; URL `strategy_id` parameter; instrument-type chips; search; strategy/venue/side dropdowns.

---

## Meeting Review Items

From `trading-accounts-risk-pnl-reconciliation.md`:

- **Position health status:** Each position needs a health indicator (Reconciled / Unreconciled / Pending) showing whether our position matches what the exchange reports.
- **Sort by health:** When positions are unhealthy, allow sorting/filtering by health status.
- **Quick reconcile flow:** Clicking an unhealthy position should navigate to a quick reconcile view — this is a frequent workflow.
- **Deep dive trade matching:** From an unhealthy position, user can drill into our trades vs exchange trades side-by-side with algorithmic match highlighting.

---

## Improvements Needed

1. **Health column:** Add a `Health` column to the positions table: Reconciled (green) / Unreconciled (red) / Pending (amber). Driven by backend reconciliation status.
2. **Sort/filter by health:** Make health column sortable; add a "Show only unhealthy" quick filter chip.
3. **Quick reconcile navigation:** Row action on unhealthy positions → either a drawer or navigation to a reconcile view. This should be fast — it's a daily workflow.
4. **Cross-venue consistency check:** For instruments held on multiple venues, surface a warning when positions diverge.
5. **Asset-class label:** The `InstrumentType` chips (Spot, Perp, etc.) are derived heuristically from instrument strings. Consider aligning these with a canonical `asset_class` field from the API when available.
6. **Time series view:** Currently snapshot only. Add a time series toggle to see how position sizes/P&L evolved over time (borrowing the chart pattern from the Overview page).
7. **Duplicate filter UI:** There is a `FilterBar` AND a separate inline search/selects row — consolidate into one filter row.

---

## Asset-Class Relevance

**Common** — all asset classes show positions here. The instrument-type chips already provide lightweight asset-class scoping. The DeFi health factor column already adapts conditionally.

---

## Action

**Enhance** — strong foundation, needs health status, quick reconcile navigation, time series, and filter consolidation.
