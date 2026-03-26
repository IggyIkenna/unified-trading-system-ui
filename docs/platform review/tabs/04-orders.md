# Tab: Orders

**Route:** `/services/trading/orders`
**Page file:** `app/(platform)/services/trading/orders/page.tsx`
**Lines:** 823 | **Status:** Full implementation

---

## Current State

Full orders blotter with cancel/amend actions. Second of the two strong "blotter" pages.

**What it renders:**

- Orders table (`DataTable` with TanStack columns): instrument, side, type, price, quantity, filled qty, status, venue, strategy, timestamp
- Instrument-type filter chips: All / Spot / Perp / Futures / Options / DeFi / Prediction
- `FilterBar` (search, venue, status)
- Status summary badges (open, filled, cancelled, partial)
- Cancel action on actionable orders
- Amend flow via `Dialog` (price and qty inputs)
- `ExportDropdown` (CSV/XLS)
- Links to instrument views via `classifyInstrument` / `getInstrumentRoute`

**Data sources:** `useOrders`, `useCancelOrder`, `useAmendOrder`, `useGlobalScope`

**Filtering/scoping:** `scopedOrders` filtered by `globalScope.strategyIds`; instrument-type chips; search; venue; status dropdowns.

---

## Meeting Review Items

From `trading-accounts-risk-pnl-reconciliation.md`:

- **Full order blotter:** Every order placed (filled + unfilled) — this page already does this, good.
- **Full trade blotter (fills):** Every individual fill/execution needs to be viewable. The orders page shows orders but not individual fills. Fills are currently only visible as "recent fills" on the Overview page. A dedicated fills/trade blotter is missing.

---

## Improvements Needed

1. **Fills / trade blotter:** Add a second sub-tab or toggle within this page (or a separate Trades tab) showing individual fill records — not just the parent order. Each fill: fill price, fill qty, fill timestamp, venue, fees, strategy. This is what "every single trade we've done" means from the meeting.
2. **Duplicate filter UI:** Same issue as positions — `FilterBar` plus inline search/selects. Consolidate.
3. **Sports/predictions order display:** Back/lay orders from sports or prediction markets need adapted display (odds format, event name, market type) rather than generic price/qty.
4. **Order grouping:** For strategies that generate many orders, a collapsible-by-strategy grouping would reduce noise for internal users managing multiple strategies.
5. **Latency column:** For algo orders, show latency from signal-to-order-send. Important for execution quality monitoring.

---

## Asset-Class Relevance

**Common** — all asset classes place orders here. Instrument-type chips provide lightweight scoping. Sports/predictions orders need display adaptations but the same underlying data model applies.

---

## Action

**Enhance** — add fills/trade blotter sub-view, consolidate filters, adapt display for sports/predictions order types.
