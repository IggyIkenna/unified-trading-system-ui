# 4.2 Orders — Widget Audit & Merge Plan

> **Status:** APPROVED — ready for agent implementation
> **WORK_TRACKER ref:** §4.2
> **Page route:** `/services/trading/orders`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `orders-kpi-strip` | Order Summary | `OrdersKpiStripWidget` | 26 | yes | 12x1 at (0,0) |
| `orders-table` | Orders Table | `OrdersTableWidget` | 443 | yes | 12x10 at (0,1) |

**Data provider:** `OrdersDataProvider` (358 lines) wraps the page. Both widgets consume `useOrdersData()`.

---

## Decisions (user-approved)

### 1. Order Summary — keep separate, make responsive, add cards

Keep `orders-kpi-strip` as a **separate** widget (same treatment as positions KPI strip).

**Change 1 — Responsive layout:** Use the responsive `KpiStrip` mode (being added in §4.1) so the KPI cards reflow based on widget container size:

- Full-width: all cards in a row (6×1)
- Half-width: 3 × 2 grid
- Narrow: 2 × 3 grid
- Very narrow: stacked vertically (1×6)

**Change 2 — Add Rejected and Failed cards:** Currently shows 4 KPIs (Total, Open, Partial, Filled). Add two more:

- **Rejected** — count of orders with status `REJECTED` (sentiment: negative when > 0)
- **Failed** — count of orders with status `FAILED` (sentiment: negative when > 0)

This brings the total to 6 KPI cards. The data context's `summary` object needs `rejected` and `failed` counts added.

**Change 3 — Widget registration minW/minH:** Currently `orders-kpi-strip` has `minW: 4, minH: 1` which prevents narrow layouts (2×3, 1×6). Change to:

- `minW: 2` (allows 2-column-wide placement)
- `minH: 2` (accommodates multi-row card layouts)

**Files to change:**

- `components/widgets/orders/orders-kpi-strip-widget.tsx` — replace `columns={4}` with `responsive` prop, add Rejected and Failed metric cards
- `components/widgets/orders/orders-data-context.tsx` — add `rejected` and `failed` counts to the `summary` computation
- `components/widgets/orders/register.ts` — change `orders-kpi-strip` registration: `minW: 4` → `minW: 2`, `minH: 1` → `minH: 2`

### 2. Orders Table — filter bar overhaul (same pattern as positions)

Apply the same filter cleanup as the positions table:

**Remove:**

- The "Hide Filters" / "Show Filters" toggle button and the `showFilters` state
- Filters should always be visible (no toggle)

**Keep:**

- Search bar
- Venue dropdown
- Status dropdown
- Refresh / Export buttons on the right

**Change — Asset Class filter:**

- The row of `INSTRUMENT_TYPES` buttons (All, Spot, Perp, Futures, Options, DeFi, Prediction) currently uses single-select toggle buttons
- Replace with a **multi-select dropdown** (same component as positions)
- User can select multiple asset classes at once
- "All" is the default (no filter applied)
- Update `instrumentTypeFilter` from `InstrumentType` (single) to `InstrumentType[]` (array) in `OrdersDataProvider`

**Add — Side filter:**

- The orders table currently has no side filter dropdown (positions has one). Add a **Side dropdown** (BUY / SELL) to the filter bar.
- This requires adding `sideFilter` / `setSideFilter` to the data context (similar to positions).

**Files to change:**

- `components/widgets/orders/orders-table-widget.tsx`:
  - Remove `showFilters` state, the toggle `<button>`, and the conditional `{showFilters && ...}` wrapper
  - Replace instrument type buttons with a multi-select dropdown
  - Add Side dropdown to `filterDefs`
  - Filters always visible
- `components/widgets/orders/orders-data-context.tsx`:
  - Change `instrumentTypeFilter: InstrumentType` → `instrumentTypeFilters: InstrumentType[]`
  - Change `setInstrumentTypeFilter` → `setInstrumentTypeFilters`
  - Add `sideFilter: "all" | "BUY" | "SELL"` and `setSideFilter`
  - Update `filteredOrders` logic for multi-select instrument types and side filter

### 3. Strategy filter — add to filter bar

The positions table has a Strategy dropdown but the orders table does not. Add a **Strategy dropdown** to the orders filter bar.

**Files to change:**

- `components/widgets/orders/orders-data-context.tsx` — add `strategyFilter` / `setStrategyFilter`, `uniqueStrategies`, update `filteredOrders`
- `components/widgets/orders/orders-table-widget.tsx` — add strategy to `filterDefs`

---

## Summary of All File Changes

| File | Action |
|------|--------|
| `components/widgets/orders/orders-kpi-strip-widget.tsx` | Pass `responsive` prop to KpiStrip, add Rejected + Failed cards |
| `components/widgets/orders/orders-table-widget.tsx` | Remove filter toggle, replace instrument type buttons with multi-select dropdown, add side + strategy dropdowns, filters always visible |
| `components/widgets/orders/orders-data-context.tsx` | Change instrumentTypeFilter to array, add sideFilter, add strategyFilter + uniqueStrategies, add rejected + failed to summary |
| `components/widgets/orders/register.ts` | Change `orders-kpi-strip` minW: 4 → 2, minH: 1 → 2 |

---

## Implementation Order

1. Update `orders-kpi-strip-widget.tsx` — add `responsive` prop (depends on §4.1 completing KpiStrip enhancement)
2. Update `orders-data-context.tsx` — multi-select instrument types, add side filter, add strategy filter
3. Update `orders-table-widget.tsx` — remove filter toggle, replace instrument type buttons with dropdown, add side + strategy to filter bar

---

## Notes

- No widgets to delete on this page — both widgets are kept
- No new pages needed
- The multi-select dropdown component for asset classes should be the same shared component used by §4.1 (positions). If §4.1 creates it, reuse it here. If not, create a shared `MultiSelectDropdown` in `components/shared/`.
- Preset layout stays the same: KPI strip 12x1 at (0,0), table 12x10 at (0,1)

## IMPORTANT — Reference Implementation

**Before making any changes to the orders widgets, read the current positions widgets first:**

- `components/widgets/positions/positions-kpi-widget.tsx` — reference for KPI strip responsive layout, card styling, and any enhancements made
- `components/widgets/positions/positions-table-widget.tsx` — reference for filter bar layout, multi-select dropdown, always-visible filters, column patterns
- `components/widgets/positions/positions-data-context.tsx` — reference for multi-select instrument type filter, side filter, strategy filter patterns

The positions page (§4.1) may have been implemented first with improvements beyond what this doc specifies. The orders page must match the positions page in terms of:

1. KPI strip responsive behavior, card min-width, grid reflow
2. Filter bar structure (search, dropdowns, multi-select asset class)
3. Consistent styling and shared components used
4. Any new patterns introduced (e.g. shared multi-select component)

Read the positions widgets at implementation time and replicate the same approach.
