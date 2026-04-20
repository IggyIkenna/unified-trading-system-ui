---
title: "§ 3 — InlineTable → DataTable Migration Findings"
date: 2026-04-16
status: AUDIT COMPLETE
spec: BP2-base-widget-migration-spec.md § 3
---

# § 3 — InlineTable → DataTableWidget Migration Findings

## 1. Base Component Assessment

Two base components already exist and are production-ready:

### `components/shared/data-table-widget.tsx` (160 lines)

- Lightweight generic `DataTableWidget<T>` with custom `DataTableColumn<T>[]` API
- Built-in sorting (asc/desc/null cycle), empty state, compact mode, sticky first column
- Uses shadcn `Table` + `WidgetScroll`
- **Not TanStack-based** — uses a bespoke column interface (`key`, `label`, `accessor`)
- No filter/search/export/refresh/column-visibility support
- Currently under-adopted (spec confirms this)

### `components/shared/table-widget.tsx` (306 lines)

- Full-featured `TableWidget<TData>` shell wrapping `DataTable` (TanStack v8)
- **Features:** search, select filters, asset-class multi-select, column visibility toggle, export dropdown, data freshness badge, refresh button, loading/error/empty states
- Uses `LiveFeedWidget` for loading/error wrapper
- Accepts TanStack `ColumnDef<TData, unknown>[]`
- **This is the target base.** Already handles everything the spec asks for.

**Recommendation:** `TableWidget` is the migration target. `DataTableWidget` is a simpler alternative for widgets that don't need the full toolbar — but all new migrations should prefer `TableWidget` for consistency.

---

## 2. Widget Classification

### Category A — Already Using `TableWidget` (11 widgets, NO migration needed)

These widgets are **correctly structured** and only need § 0 cross-cutting verification.

| Widget ID                   | File                                            | Lines | Uses TableWidget | Has Filters                      | Has Export | Has Loading | Has Error |
| --------------------------- | ----------------------------------------------- | ----- | ---------------- | -------------------------------- | ---------- | ----------- | --------- |
| `orders-table`              | `orders/orders-table-widget.tsx`                | 417   | Yes              | search + 4 selects + asset class | Yes        | Yes         | Yes       |
| `positions-table`           | `positions/positions-table-widget.tsx`          | 439   | Yes              | search + 3 selects + asset class | Yes        | Yes         | Yes       |
| `alerts-table`              | `alerts/alerts-table-widget.tsx`                | 448   | Yes              | search + 2 selects               | Yes        | Yes         | Yes       |
| `book-trade-history`        | `book/book-trade-history-widget.tsx`            | 181   | Yes              | search                           | No         | No          | No        |
| `accounts-balance-table`    | `accounts/accounts-balance-table-widget.tsx`    | 122   | Yes              | None                             | No         | Yes         | Yes       |
| `accounts-transfer-history` | `accounts/accounts-transfer-history-widget.tsx` | 129   | Yes              | 1 select                         | No         | Yes         | Yes       |
| `risk-stress-table`         | `risk/risk-stress-table-widget.tsx`             | 183   | Yes              | None (custom toolbar)            | No         | No          | No        |
| `markets-my-orders`         | `markets/markets-my-orders-widget.tsx`          | 123   | Yes              | None                             | No         | No          | No        |
| `markets-recon`             | `markets/markets-recon-widget.tsx`              | 80    | Yes              | None                             | No         | No          | No        |
| `defi-rates-overview`       | `defi/defi-rates-overview-widget.tsx`           | 134   | Yes              | None                             | No         | No          | No        |
| `pred-open-positions`       | `predictions/pred-open-positions-widget.tsx`    | 138   | Yes              | None                             | No         | No          | No        |

**Issues found in Category A:**

- `book-trade-history`: Missing `isLoading` and `error` props — data context provides data but loading/error states are not passed through.
- `risk-stress-table`: Missing `isLoading`/`error` on the `TableWidget` — only the on-demand stress result has a loading skeleton.
- `markets-my-orders`, `markets-recon`: No loading or error handling at all.
- `defi-rates-overview`, `pred-open-positions`: No loading or error handling.

### Category B — Inline `<table>` / `<Table>` (Need Full Migration) (4 widgets)

These use raw shadcn `Table` with manual `map()` rendering and need migration to `TableWidget`.

| Widget ID               | File                                          | Lines | Current Pattern                                                                                      | Mock Data?                                                                 |
| ----------------------- | --------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `risk-limits-hierarchy` | `risk/risk-limits-hierarchy-widget.tsx`       | 153   | shadcn `Table` + `TableBody` with manual `.map()`, nested hierarchy with indent, collapsible section | No — uses `useRiskData()`                                                  |
| `sports-standings`      | `sports/sports-standings-widget.tsx`          | 77    | Raw `<table>` with manual `<thead>`/`<tbody>` + `.map()`                                             | **YES — imports `MOCK_STANDINGS` from `@/lib/mocks/fixtures/sports-data`** |
| `lending-arb-dashboard` | `strategies/lending-arb-dashboard-widget.tsx` | 90    | shadcn `Table` inside `Card`, summary header + table                                                 | **YES — inline `MOCK_DATA` constant (16 rows)**                            |
| `liquidation-monitor`   | `strategies/liquidation-monitor-widget.tsx`   | 117   | shadcn `Table` inside `Card`, KPI grid + table                                                       | **YES — inline `MOCK_POSITIONS` constant (8 rows)**                        |
| `active-lp-dashboard`   | `strategies/active-lp-dashboard-widget.tsx`   | 117   | shadcn `Table` inside `Card`, KPI grid + alert banner + table                                        | **YES — inline `MOCK_LP_POSITIONS` constant (6 rows)**                     |

### Category C — Thin Shells (Delegate to Domain Components, NO migration needed)

These are correctly structured thin shells — they delegate to domain-specific components and should NOT be wrapped in `TableWidget`.

| Widget ID               | File                                       | Lines | Delegates To                                                                                  |
| ----------------------- | ------------------------------------------ | ----- | --------------------------------------------------------------------------------------------- |
| `options-watchlist`     | `options/options-watchlist-widget.tsx`     | 20    | `WatchlistPanel` from `@/components/trading/watchlist-panel`                                  |
| `options-chain`         | `options/options-chain-widget.tsx`         | 22    | `OptionsChainTab` / `TradFiOptionsChainTab` from `@/components/trading/options-futures-panel` |
| `options-futures-table` | `options/options-futures-table-widget.tsx` | 29    | `FuturesTab` from `@/components/trading/options-futures-panel`                                |
| `pred-arb-closed`       | `predictions/pred-arb-closed-widget.tsx`   | 22    | `PredClosedArbCard` via `CollapsibleSection` — card list, not a table                         |

### Category D — NOT a Table Widget (Misclassified in Spec)

| Widget ID                 | File                                         | Lines | Actual Pattern                                                                                                 | Notes                                                                                                                                               |
| ------------------------- | -------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnl-by-client`           | `pnl/pnl-by-client-widget.tsx`               | 94    | **Card list** — iterates clients with click-to-navigate cards, summary footer, P&L values                      | Not a table at all. Uses `EntityLink`, `PnLValue`, `PnLChange`. No `<table>` element. Belongs in card-grid or detail-panel class, not inline-table. |
| `markets-latency-summary` | `markets/markets-latency-summary-widget.tsx` | 207   | **Interactive metric card list** — button cards with latency p50/p95/p99, view mode toggles, data mode toggles | Not a table. Custom interactive cards with mode switching. Belongs in bespoke category.                                                             |

---

## 3. Mock Import Violations (§ 0.3)

| Widget                  | Violation Type                 | Details                                                                                      | Remediation                                                                                           |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `sports-standings`      | **Direct `lib/mocks/` import** | `import { MOCK_STANDINGS } from "@/lib/mocks/fixtures/sports-data"`                          | Move `MOCK_STANDINGS` into `sports-data-context.tsx` behind `isMockDataMode()` gate                   |
| `lending-arb-dashboard` | **Inline mock constant**       | `const MOCK_DATA: LendingArbRow[]` — 16 hardcoded rows, fully disconnected from data context | Wire into `strategies-data-context.tsx`. Create `useLendingArbData()` hook or add to existing context |
| `liquidation-monitor`   | **Inline mock constant**       | `const MOCK_POSITIONS: AtRiskPosition[]` — 8 hardcoded rows, fully disconnected              | Wire into `strategies-data-context.tsx`. Create `useLiquidationData()` hook                           |
| `active-lp-dashboard`   | **Inline mock constant**       | `const MOCK_LP_POSITIONS: LPPosition[]` — 6 hardcoded rows, fully disconnected               | Wire into `strategies-data-context.tsx`. Create `useLPDashboardData()` hook                           |

---

## 4. Migration Work Items

### 4.1 — Widgets Requiring Full Migration (Category B → TableWidget)

#### `risk-limits-hierarchy` (153 lines)

- **Complexity: HIGH** — has hierarchical indentation, breadcrumb scope display, collapsible "All Limits Detail" section
- **Challenge:** TreeTable pattern with `level`-based indentation doesn't map cleanly to flat `TableWidget`
- **Recommendation:** Migrate the flat "All Limits Detail" section to `TableWidget`. Keep the hierarchy section as-is since indented tree rendering is domain-specific. Alternatively, use `DataTableWidget` with a custom accessor that renders the indented entity name.
- **No mock violations.**

#### `sports-standings` (77 lines)

- **Complexity: MEDIUM** — raw `<table>` with league badge header, hardcoded column structure, form dots component
- **Migration:** Replace raw `<table>` with `TableWidget`, define `ColumnDef<Standing>[]`, move `MOCK_STANDINGS` to data context
- **Mock violation: YES** — `MOCK_STANDINGS` imported from `lib/mocks/`

#### `lending-arb-dashboard` (90 lines)

- **Complexity: MEDIUM** — `Card` wrapper with "Best Arb" summary banner + `Table`
- **Migration:** Replace with `TableWidget`. Move summary banner to `extraActions` or a header KPI strip. Move `MOCK_DATA` to data context.
- **Mock violation: YES** — inline `MOCK_DATA`

#### `liquidation-monitor` (117 lines)

- **Complexity: MEDIUM** — `Card` wrapper with 3-column KPI grid + `Table`
- **Migration:** Replace with `TableWidget`. Move KPI grid to a header panel (similar pattern to `risk-stress-table`). Move `MOCK_POSITIONS` to data context.
- **Mock violation: YES** — inline `MOCK_POSITIONS`

#### `active-lp-dashboard` (117 lines)

- **Complexity: MEDIUM** — `Card` wrapper with 4-column KPI grid + rebalance alert + `Table`
- **Migration:** Replace with `TableWidget`. Move KPI grid and alert to header. Move `MOCK_LP_POSITIONS` to data context.
- **Mock violation: YES** — inline `MOCK_LP_POSITIONS`

### 4.2 — Already Migrated Widgets Needing Fixes (Category A)

| Widget                | Issue                                | Fix                                                                         |
| --------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `book-trade-history`  | No `isLoading`/`error` props passed  | Add loading/error from `useBookTradeData()` if available, or add to context |
| `risk-stress-table`   | No `isLoading`/`error` on main table | Pass loading state from `useRiskData()`                                     |
| `markets-my-orders`   | No `isLoading`/`error`               | Add loading/error from `useMarketsData()`                                   |
| `markets-recon`       | No `isLoading`/`error`               | Add loading/error from `useMarketsData()`                                   |
| `defi-rates-overview` | No `isLoading`/`error`               | Add loading/error from `useDeFiData()`                                      |
| `pred-open-positions` | No `isLoading`/`error`               | Add loading/error from `usePredictionsData()`                               |

---

## 5. Summary

| Category                           | Count | Action                                                           |
| ---------------------------------- | ----- | ---------------------------------------------------------------- |
| **A — Already on TableWidget**     | 11    | Apply § 0 cross-cutting (add missing loading/error to 6 widgets) |
| **B — Needs full migration**       | 5     | Migrate to `TableWidget`, resolve mock violations                |
| **C — Thin shells**                | 4     | No migration. Apply § 0 cross-cutting only                       |
| **D — Misclassified (not tables)** | 2     | Remove from § 3 scope. Reassign to correct class                 |
| **Total**                          | 22    | 5 full migrations + 6 loading/error fixes + 4 mock cleanups      |

### Mock Cleanup Summary

- **1 direct `lib/mocks/` import:** `sports-standings`
- **3 inline mock constants:** `lending-arb-dashboard`, `liquidation-monitor`, `active-lp-dashboard`
- All 3 strategy widgets are **fully disconnected** from any data context — they need to be wired into `strategies-data-context.tsx`

### Priority Order

1. **Wire strategy widgets to data context** (lending-arb, liquidation, active-lp) — highest impact, currently completely disconnected
2. **Fix `sports-standings` mock import** — direct `lib/mocks/` violation
3. **Migrate 5 Category B widgets to TableWidget** — standardize rendering
4. **Add missing loading/error states to 6 Category A widgets** — cross-cutting compliance
