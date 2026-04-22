# BP-2 — Base Widget Migration Specification

**Date:** 2026-04-16
**Status:** AGENT-READY — each section is an independent work unit
**Purpose:** Central specification for parallel agents to audit and migrate widgets to base classes
**Related:** [BP2-widget-foundation-audit.md](BP2-widget-foundation-audit.md), [WIDGET_CATALOGUE.md](../trading/WIDGET_CATALOGUE.md)

---

## How to Use This Document

Each **Work Unit** below is a self-contained task for one agent. The agent should:

1. **Read this section** + the cross-cutting requirements (§ 0)
2. **Audit every child widget listed** — read each file fully, identify shared patterns
3. **Write a findings doc** in `docs/audits/findings/` named `{base-id}-findings.md` documenting:
   - What goes in the base (shared props, shared layout, shared state)
   - What stays in each child (domain-specific logic, custom rendering)
   - Any issues found (mock imports, missing loading states, dead code)
4. **Implement the migration** — create or update the base, migrate children, delete duplicated code
5. **Apply all cross-cutting requirements** from § 0 to every widget touched

**Bespoke widgets (11 total — 10 original + `risk-strategy-heatmap` reclassified from heatmap) are OUT OF SCOPE.** After all migrations are complete, we review whether any bespoke widget fits a base. Don't force it.

**Thin shell widgets (<50 lines that delegate to a domain component) should NOT be migrated to a base.** They are already correctly structured. Only apply the cross-cutting requirements (§ 0) to them.

---

## § 0 — Cross-Cutting Requirements (applies to ALL work units)

Every agent must apply these to every widget they touch during migration:

### 0.1 — Widget Error Boundary

Every widget rendered in the grid MUST be wrapped in a per-widget error boundary. If the grid doesn't already do this, the agent working on the first work unit creates `components/widgets/widget-error-boundary.tsx`:

```
Props: { widgetId: string; children: ReactNode }
On error: render fallback with widget name + "Something went wrong" + Retry button
Does NOT crash neighbouring widgets
```

This wrapping should happen in the grid renderer (`widget-grid.tsx`), not inside each widget. One agent does this; the rest verify it's in place.

### 0.2 — Widget Loading Skeleton

Every base must provide a loading state. The base component accepts `isLoading?: boolean` and renders a skeleton/spinner when true. Children pass loading state from their data context.

For bases that already handle this (`TableWidget`, `LiveFeedWidget`): no change needed.
For new bases: implement a sensible default skeleton.

### 0.3 — Mock Import Cleanup

**No widget may import directly from `lib/mocks/`.** All data must come through the domain's `*-data-context.tsx` via the `use*Data()` hook.

For each widget that currently imports mocks:

- If the mock data is needed for the widget's function: move it into the domain's data context
- If it's reference data (token lists, venue lists, config constants): move to `lib/constants/` or a domain config file
- If it's `isMockDataMode()` gated: acceptable, but the mock import stays in the data context, not the widget

### 0.4 — Dead Code

Delete widget files that are stubs or marked for deletion. Currently known:

- `pnl/pnl-report-button-widget.tsx` (3 lines, comment: "can be safely deleted")
- `pnl/pnl-controls-widget.tsx` (4 lines, comment: "can be safely deleted")

Remove their registrations from `pnl/register.ts` and presets.

---

## § 1 — RechartsWidget (recharts-chart class)

**Base file:** `components/shared/recharts-widget.tsx` (NEW)
**Child count:** 10

### Children

| Widget ID                   | File                                        | Lines | Chart Types Used                     |
| --------------------------- | ------------------------------------------- | ----- | ------------------------------------ |
| `risk-var-chart`            | `risk/risk-var-chart-widget.tsx`            | 83    | BarChart + Cell                      |
| `risk-term-structure`       | `risk/risk-term-structure-widget.tsx`       | 62    | BarChart                             |
| `risk-exposure-attribution` | `risk/risk-exposure-attribution-widget.tsx` | 172   | LineChart + Cell (stacked)           |
| `risk-greeks-summary`       | `risk/risk-greeks-summary-widget.tsx`       | 196   | LineChart + Cell                     |
| `risk-margin`               | `risk/risk-margin-widget.tsx`               | 188   | AreaChart + BarChart + LineChart     |
| `pnl-time-series`           | `pnl/pnl-time-series-widget.tsx`            | 302   | LineChart + AreaChart (tab-switched) |
| `pnl-factor-drilldown`      | `pnl/pnl-factor-drilldown-widget.tsx`       | 196   | AreaChart + BarChart (side-by-side)  |
| `markets-latency-detail`    | `markets/markets-latency-detail-widget.tsx` | 258   | AreaChart + Line (overlay)           |
| `defi-yield-chart`          | `defi/defi-yield-chart-widget.tsx`          | 202   | AreaChart + LineChart (dual-mode)    |
| `risk-kpi-strip`            | `risk/risk-kpi-strip-widget.tsx`            | 421   | LineChart (sparklines inside KPI)    |

### What should go in the base

All 10 widgets share:

- `ResponsiveContainer` wrapper with `width="100%" height={...}`
- Recharts `Tooltip` with custom dark-theme formatter
- `useMemo` for data transformation before passing to chart
- No loading state (all 10 lack it)
- No empty state guard (only 2 of 10 have it)

The base should provide:

| Feature     | Base provides                                                  |
| ----------- | -------------------------------------------------------------- |
| Container   | `ResponsiveContainer` with configurable height, handles resize |
| Loading     | Skeleton placeholder when `isLoading` is true                  |
| Empty state | "No data" message when data array is empty                     |
| Theme       | Dark-themed tooltip, consistent axis styling, tick formatting  |
| Error state | Error message + retry button when `error` is set               |

### What stays in each child

- Which chart type(s) to render (BarChart, LineChart, AreaChart, etc.)
- Data transformation logic (`useMemo` calls)
- Domain-specific tooltip content
- Multi-chart layouts (some widgets have 2-3 charts side by side)
- Tab switching between chart views

### Agent notes

- `risk-kpi-strip` (421 lines) is a hybrid — KPI metrics with sparkline charts. It may only partially adopt the recharts base (for the sparkline portion). Assess during audit.
- None of these widgets import mocks directly — they all use their domain context. Clean on § 0.3.

---

## § 2 — FormWidget (form class)

> **Update 2026-04-22:** The three `book-*` form widgets listed below (`book-order-form`, `book-algo-config`, `book-record-details`) were merged into `book-order-entry` (WU-1 widget consolidation). Effective FormWidget child count: 13 (was 16). Historical rows retained for traceability.
>
> **Update 2026-04-22 (WU-3):** `options-trade-panel` and `futures-trade-panel` were absorbed into their host widgets (`options-chain` and `futures-table` respectively) as docked panes. Effective FormWidget child count: 11. Historical rows retained for traceability.

**Base file:** `components/shared/form-widget.tsx` (NEW)
**Child count:** 16

### Children

| Widget ID              | File                                             | Lines | Domain      |
| ---------------------- | ------------------------------------------------ | ----- | ----------- |
| `order-entry`          | `terminal/order-entry-widget.tsx`                | 212   | Terminal    |
| `book-order-form`      | `book/book-order-form-widget.tsx`                | 250   | Book        |
| `book-algo-config`     | `book/book-algo-config-widget.tsx`               | 194   | Book        |
| `book-record-details`  | `book/book-record-details-widget.tsx`            | ~150  | Book        |
| `defi-lending`         | `defi/defi-lending-widget.tsx`                   | 272   | DeFi        |
| `defi-swap`            | `defi/defi-swap-widget.tsx`                      | 365   | DeFi        |
| `defi-liquidity`       | `defi/defi-liquidity-widget.tsx`                 | ~250  | DeFi        |
| `defi-staking`         | `defi/defi-staking-widget.tsx`                   | ~200  | DeFi        |
| `defi-flash-loans`     | `defi/defi-flash-loans-widget.tsx`               | ~300  | DeFi        |
| `defi-transfer`        | `defi/defi-transfer-widget.tsx`                  | 407   | DeFi        |
| `defi-strategy-config` | `defi/defi-strategy-config-widget.tsx`           | 1,157 | DeFi        |
| `defi-staking-rewards` | `defi/defi-staking-rewards-widget.tsx`           | ~200  | DeFi        |
| `accounts-transfer`    | `accounts/accounts-transfer-widget.tsx`          | 426   | Accounts    |
| `options-trade-panel`  | `options/options-trade-panel-widget.tsx`         | 10    | Options     |
| `futures-trade-panel`  | `options/options-futures-trade-panel-widget.tsx` | 27    | Options     |
| `pred-trade-panel`     | `predictions/pred-trade-panel-widget.tsx`        | 25    | Predictions |
| `cefi-strategy-config` | `strategies/cefi-strategy-config-widget.tsx`     | 567   | Strategies  |

### What should go in the base

All form widgets share:

- Raw `useState` for form state (zero use `react-hook-form` or `zod`)
- A submit action (button click → call context method like `executeDeFiOrder`)
- shadcn `Input`, `Select`, `Switch`, `Button` components
- No validation
- No loading/submitting state management
- No error display after failed submission

The base should provide:

| Feature          | Base provides                                               |
| ---------------- | ----------------------------------------------------------- |
| Submit state     | `isSubmitting` boolean, disables form during submission     |
| Error display    | Error banner after failed submission, clearable             |
| Success feedback | Brief success toast/indicator after submission              |
| Layout shell     | Consistent padding, vertical stack, submit button at bottom |
| Loading          | Skeleton when data context is loading                       |

### What stays in each child

- Form fields (which inputs, which selects, domain-specific labels)
- Form state shape (each form has completely different fields)
- Submit handler logic (what context method to call)
- Mode switching (e.g., `accounts-transfer` has 4 modes)
- Domain-specific validation rules (if added later)

### Agent notes

- `options-trade-panel` (10 lines) and `futures-trade-panel` (27 lines) and `pred-trade-panel` (25 lines) are thin shells — they delegate to domain components. They may not need the base at all; assess during audit.
- `defi-strategy-config` at 1,157 lines needs decomposition regardless. The agent should break it into smaller sub-components as part of this migration.
- **Mock import cleanup (§ 0.3):** `defi-swap`, `defi-transfer`, `defi-lending`, `defi-flash-loans`, `defi-staking-rewards` all import directly from `lib/mocks/`. These must be moved to the data context.

---

## § 3 — InlineTableWidget → DataTableWidget Migration (inline-table class)

**Base file:** `components/shared/data-table-widget.tsx` (EXISTS — under-adopted)
**Also relevant:** `components/shared/table-widget.tsx` (the `TableWidget` shell with filters)
**Child count:** 18 inline-table widgets to migrate

### Children

| Widget ID                   | File                                            | Lines | Domain      |
| --------------------------- | ----------------------------------------------- | ----- | ----------- |
| `orders-table`              | `orders/orders-table-widget.tsx`                | 417   | Orders      |
| `positions-table`           | `positions/positions-table-widget.tsx`          | 439   | Positions   |
| `alerts-table`              | `alerts/alerts-table-widget.tsx`                | 448   | Alerts      |
| `book-trade-history`        | `book/book-trade-history-widget.tsx`            | ~200  | Book        |
| `accounts-balance-table`    | `accounts/accounts-balance-table-widget.tsx`    | ~200  | Accounts    |
| `accounts-transfer-history` | `accounts/accounts-transfer-history-widget.tsx` | ~150  | Accounts    |
| `risk-stress-table`         | `risk/risk-stress-table-widget.tsx`             | 134   | Risk        |
| `risk-limits-hierarchy`     | `risk/risk-limits-hierarchy-widget.tsx`         | ~300  | Risk        |
| `pnl-by-client`             | `pnl/pnl-by-client-widget.tsx`                  | ~200  | P&L         |
| `markets-my-orders`         | `markets/markets-my-orders-widget.tsx`          | ~150  | Markets     |
| `markets-recon`             | `markets/markets-recon-widget.tsx`              | ~150  | Markets     |
| `markets-latency-summary`   | `markets/markets-latency-summary-widget.tsx`    | ~150  | Markets     |
| `options-watchlist`         | `options/options-watchlist-widget.tsx`          | 20    | Options     |
| `options-chain`             | `options/options-chain-widget.tsx`              | 22    | Options     |
| `options-futures-table`     | `options/options-futures-table-widget.tsx`      | 29    | Options     |
| `pred-open-positions`       | `predictions/pred-open-positions-widget.tsx`    | ~150  | Predictions |
| `pred-arb-closed`           | `predictions/pred-arb-closed-widget.tsx`        | 22    | Predictions |
| `defi-rates-overview`       | `defi/defi-rates-overview-widget.tsx`           | ~150  | DeFi        |
| `sports-standings`          | `sports/sports-standings-widget.tsx`            | ~150  | Sports      |
| `lending-arb-dashboard`     | `strategies/lending-arb-dashboard-widget.tsx`   | ~200  | Strategies  |
| `liquidation-monitor`       | `strategies/liquidation-monitor-widget.tsx`     | ~200  | Strategies  |
| `active-lp-dashboard`       | `strategies/active-lp-dashboard-widget.tsx`     | ~200  | Strategies  |

### What the migration looks like

`DataTableWidget<T>` and `TableWidget` already exist and handle:

- TanStack Table v8 with typed `ColumnDef<T>[]`
- Search, select filters, asset-class multi-select
- Column visibility toggle
- Export dropdown
- Data freshness badge
- Loading / error / empty states
- Sorting

The migration per widget is:

1. Replace bespoke `<table>` / `map()` rendering with `TableWidget` or `DataTableWidget`
2. Define typed `ColumnDef<T>[]` columns (most already have these or similar)
3. Pass data from context hook
4. Remove duplicated filter/search UI — let `TableWidget` handle it
5. Verify sorting, visibility, export all work

### What stays in each child

- Column definitions (domain-specific)
- Row click / row action handlers
- Any domain-specific toolbar extras (passed via `actions.extraActions`)
- Custom cell renderers (status badges, links, etc.)

### Agent notes

- `orders-table` (417), `positions-table` (439), `alerts-table` (448) are the largest — they already use `TableWidget`. The migration for these is more about verifying consistency than rewriting.
- `options-watchlist` (20 lines), `options-chain` (22 lines), `options-futures-table` (29 lines), `pred-arb-closed` (22 lines) are thin shells. Assess whether they need `TableWidget` or are fine as-is.
- **Mock import cleanup (§ 0.3):** `lending-arb-dashboard`, `liquidation-monitor`, `active-lp-dashboard` have inline `MOCK_*` constants — these are the 3 of 4 fully disconnected strategy widgets. They need to be wired into `strategies-data-context.tsx`.
- **`sports-standings`** imports `MOCK_STANDINGS` directly. Move to `sports-data-context.tsx`.

---

## § 4 — DetailPanelWidget (detail-panel class)

> **Update 2026-04-22:** `book-preview-compliance` was absorbed into `book-order-entry` (WU-1 widget consolidation). Effective DetailPanelWidget child count: 9. Historical row retained for traceability.
>
> **Update 2026-04-22 (WU-2):** `bundle-steps` was absorbed into `bundle-builder` (bundles widget consolidation). Effective DetailPanelWidget child count: 8. Historical row retained for traceability.
>
> **Update 2026-04-22 (WU-3):** `options-scenario` was absorbed into `options-strategies` (options widget consolidation — scenario payoff is now an embedded right pane). Effective DetailPanelWidget child count: 7. Historical row retained for traceability.

**Base file:** `components/shared/detail-panel-widget.tsx` (NEW)
**Child count:** 10

### Children

| Widget ID                 | File                                                | Lines | Domain       |
| ------------------------- | --------------------------------------------------- | ----- | ------------ |
| `book-preview-compliance` | `book/book-preview-compliance-widget.tsx`           | ~200  | Book         |
| `instr-detail-panel`      | `instructions/instructions-detail-panel-widget.tsx` | 24    | Instructions |
| `sports-fixture-detail`   | `sports/sports-fixture-detail-widget.tsx`           | 32    | Sports       |
| `sports-clv`              | `sports/sports-clv-widget.tsx`                      | ~150  | Sports       |
| `sports-ml-status`        | `sports/sports-ml-status-widget.tsx`                | ~200  | Sports       |
| `pred-market-detail`      | `predictions/pred-market-detail-widget.tsx`         | 31    | Predictions  |
| `options-scenario`        | `options/options-scenario-widget.tsx`               | 10    | Options      |
| `bundle-steps`            | `bundles/bundle-steps-widget.tsx`                   | ~300  | Bundles      |
| `defi-health-factor`      | `defi/defi-health-factor-widget.tsx`                | ~200  | DeFi         |
| `defi-reward-pnl`         | `defi/defi-reward-pnl-widget.tsx`                   | ~150  | DeFi         |
| `commodity-regime`        | `strategies/commodity-regime-widget.tsx`            | ~200  | Strategies   |

### What should go in the base

Common patterns observed:

- Selection state sourced from data context (not local)
- Empty state when nothing selected: "Select a row to view details"
- Header area (entity name, status badge)
- Body area (detail content)
- Optional action area (buttons at bottom)

The base should provide:

| Feature     | Base provides                                                |
| ----------- | ------------------------------------------------------------ |
| Empty state | Configurable "nothing selected" message                      |
| Layout      | Header slot + scrollable body + optional footer/actions slot |
| Loading     | Skeleton when data context is loading                        |
| Selection   | `selectedItem` prop — base handles empty check               |

### What stays in each child

- What to render in header, body, and actions
- Domain-specific data shape
- Drill-down logic

### Agent notes

- `instr-detail-panel` (24 lines), `sports-fixture-detail` (32 lines), `pred-market-detail` (31 lines), `options-scenario` (10 lines) are thin shells. Assess whether the base adds value or just adds indirection.
- **Mock import cleanup (§ 0.3):** `sports-clv` imports `MOCK_CLV_RECORDS`, `sports-ml-status` imports `MOCK_MODEL_FAMILIES` and `MOCK_FEATURE_FRESHNESS`. Move to `sports-data-context.tsx`.
- **`commodity-regime`** has inline `MOCK_FACTORS` and `MOCK_POSITIONS`. Wire into `strategies-data-context.tsx`.

---

## § 5 — ControlBarWidget (control-bar class)

> **Update 2026-04-22 (WU-4):** `instrument-bar` was archived — instrument selection moved to `terminal-watchlist` (shared `WatchlistPanel`); account picker moved into `order-entry`. Effective ControlBarWidget child count: 6. Historical row retained for traceability.

**Base file:** `components/shared/control-bar-widget.tsx` (NEW)
**Child count:** 7

### Children

| Widget ID             | File                                     | Lines | Domain   |
| --------------------- | ---------------------------------------- | ----- | -------- |
| `scope-summary`       | `overview/scope-summary-widget.tsx`      | ~150  | Overview |
| `instrument-bar`      | `terminal/instrument-bar-widget.tsx`     | ~200  | Terminal |
| `book-hierarchy-bar`  | `book/book-hierarchy-bar-widget.tsx`     | ~150  | Book     |
| `pnl-controls`        | `pnl/pnl-controls-widget.tsx`            | 4     | P&L      |
| `markets-controls`    | `markets/markets-controls-widget.tsx`    | ~200  | Markets  |
| `options-control-bar` | `options/options-control-bar-widget.tsx` | 33    | Options  |
| `sports-live-scores`  | `sports/sports-live-scores-widget.tsx`   | ~100  | Sports   |

### What should go in the base

Common patterns:

- Horizontal `flex flex-wrap` layout
- shadcn `Select`, `Button`, `Badge` components
- Responsive collapse via `flex-wrap`
- No loading/error states (control bars display controls, not data)

The base should provide:

| Feature      | Base provides                                                  |
| ------------ | -------------------------------------------------------------- |
| Layout       | Horizontal flex-wrap container with consistent padding/gap     |
| Responsive   | Wraps gracefully on narrow viewports                           |
| Slot pattern | `left`, `center`, `right` slots for flexible content placement |

### What stays in each child

- Which controls to render (domain-specific selects, toggles, badges)
- Control state management (each bar manages completely different state)
- Any custom actions (links, icon buttons)

### Agent notes

- `pnl-controls` is a 4-line stub (marked for deletion in § 0.4). Delete it.
- `options-control-bar` (33 lines) is a thin shell delegating to `OptionsToolbar`. Assess if base adds value.
- This is the lowest-complexity base — a simple layout wrapper.

---

## § 6 — CardGridWidget (card-grid class)

> **Update 2026-04-22 (WU-2):** `bundle-templates` was absorbed into `bundle-builder` (bundles widget consolidation). Effective CardGridWidget child count: 7. Historical row retained for traceability.

**Base file:** `components/shared/card-grid-widget.tsx` (NEW)
**Child count:** 8

### Children

| Widget ID                 | File                                            | Lines | Domain      |
| ------------------------- | ----------------------------------------------- | ----- | ----------- |
| `alerts-preview`          | `overview/bottom-widgets.tsx` (alerts section)  | ~50   | Overview    |
| `recent-fills`            | `overview/bottom-widgets.tsx` (fills section)   | ~50   | Overview    |
| `health-grid`             | `overview/bottom-widgets.tsx` (health section)  | ~50   | Overview    |
| `risk-circuit-breakers`   | `risk/risk-circuit-breakers-widget.tsx`         | 47    | Risk        |
| `saft-portfolio`          | `accounts/saft-portfolio-widget.tsx`            | ~150  | Accounts    |
| `bundle-templates`        | `bundles/bundle-templates-widget.tsx`           | ~200  | Bundles     |
| `defi-atomic-bundle`      | `bundles/defi-atomic-bundle-widget.tsx`         | 472   | Bundles     |
| `strategies-catalogue`    | `strategies/strategies-catalogue-widget.tsx`    | 392   | Strategies  |
| `pred-top-markets`        | `predictions/pred-top-markets-widget.tsx`       | 34    | Predictions |
| `strategy-family-browser` | `strategies/strategy-family-browser-widget.tsx` | ~300  | Strategies  |

### What should go in the base

Common patterns:

- CSS `grid` with Tailwind responsive breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Cards using shadcn `Card` / `CardContent`
- Empty state when no items
- Some have search/filter (only `strategies-catalogue` has full filter UI)

The base should provide:

| Feature     | Base provides                                            |
| ----------- | -------------------------------------------------------- |
| Grid layout | Responsive CSS grid with configurable column breakpoints |
| Empty state | "No items" message when data array is empty              |
| Loading     | Skeleton grid of placeholder cards                       |
| Card click  | Optional `onCardClick` handler                           |

### What stays in each child

- Card content rendering (completely domain-specific)
- Filter/search UI (only relevant for some)
- Card styling and badge logic

### Agent notes

- `defi-atomic-bundle` (472 lines) is complex — it's a bundle builder, not just a card grid. Assess whether the base helps or hinders.
- **Mock import cleanup (§ 0.3):** `saft-portfolio` imports `MOCK_SAFTS`. Move to `accounts-data-context.tsx`.

---

## § 7 — HeatmapWidget (heatmap class) — NO BASE NEEDED

**Base file:** None — base creation skipped after audit
**Child count:** 2 (was 3 — `risk-strategy-heatmap` reclassified as bespoke)
**Findings:** [`heatmap-findings.md`](findings/heatmap-findings.md)

### Audit Outcome

After auditing all 3 original children, no shared base is justified:

- **`risk-strategy-heatmap`** (212 lines) is **misclassified** — it's a row-based strategy status list with action buttons (Trip/Reset/Scale/Kill), not a matrix/heatmap. Reclassified as **bespoke**. Loading state added (skeleton via `isLoading` from risk context).
- **`risk-correlation-heatmap`** (27 lines) is a **thin shell** delegating to a self-contained `CorrelationHeatmap` domain component that already handles loading, empty, hover, and rendering. Per spec rule, thin shells skip base migration.
- **`defi-funding-matrix`** (141 lines) is the only true matrix widget. Creating a base for a single consumer adds indirection without deduplication. § 0.3 violation fixed (constants moved to `lib/config/services/defi.config.ts`). Empty state guard added.

### Remaining Children (cross-cutting only)

| Widget ID                  | File                                       | Lines | Domain | Status                         |
| -------------------------- | ------------------------------------------ | ----- | ------ | ------------------------------ |
| `risk-correlation-heatmap` | `risk/risk-correlation-heatmap-widget.tsx` | 27    | Risk   | Thin shell — no changes needed |
| `defi-funding-matrix`      | `defi/defi-funding-matrix-widget.tsx`      | ~150  | DeFi   | § 0.3 fixed, empty state added |

### Reclassified to Bespoke

| Widget ID               | File                                    | Lines | Domain | Reason                                      |
| ----------------------- | --------------------------------------- | ----- | ------ | ------------------------------------------- |
| `risk-strategy-heatmap` | `risk/risk-strategy-heatmap-widget.tsx` | ~220  | Risk   | Row list with action buttons, not a heatmap |

---

## § 8 — OrderBookWidget (order-book class)

**Base file:** `components/shared/order-book-widget.tsx` (NEW)
**Child count:** 3

### Children

| Widget ID           | File                                   | Lines | Domain   |
| ------------------- | -------------------------------------- | ----- | -------- |
| `order-book`        | `terminal/order-book-widget.tsx`       | 25    | Terminal |
| `depth-chart`       | `terminal/depth-chart-widget.tsx`      | 15    | Terminal |
| `markets-live-book` | `markets/markets-live-book-widget.tsx` | ~200  | Markets  |

### What should go in the base

| Feature           | Base provides                                         |
| ----------------- | ----------------------------------------------------- |
| Bid/ask layout    | Two-column bid/ask display with price level alignment |
| Spread display    | Mid-price and spread calculation                      |
| Depth aggregation | Configurable price level grouping                     |
| Loading/empty     | Standard states                                       |

### What stays in each child

- Data source (different contexts)
- Rendering mode (ladder vs depth curve)
- Custom interactions

### Agent notes

- `order-book` (25 lines) and `depth-chart` (15 lines) are thin shells delegating to `OrderBook` and `DepthChart` from `@/components/trading/order-book`. The real shared logic lives there.
- `markets-live-book` (200 lines) has HFT-style rendering with `Array.from` placeholder rows.
- The base may actually already exist in `components/trading/order-book/` — audit that first before creating a new one.

---

## § 9 — WaterfallWidget (waterfall class)

**Base file:** `components/shared/waterfall-widget.tsx` (NEW)
**Child count:** 3

### Children

| Widget ID                | File                                     | Lines | Domain   |
| ------------------------ | ---------------------------------------- | ----- | -------- |
| `pnl-waterfall`          | `pnl/pnl-waterfall-widget.tsx`           | ~200  | P&L      |
| `pnl-attribution`        | `overview/` (part of overview)           | ~100  | Overview |
| `defi-waterfall-weights` | `defi/defi-waterfall-weights-widget.tsx` | ~150  | DeFi     |
| `risk-utilization`       | `risk/risk-utilization-widget.tsx`       | 30    | Risk     |

### What should go in the base

Both waterfall widgets render bars as plain `div` elements with inline `width` style — no charting library. Common patterns:

| Feature           | Base provides                                               |
| ----------------- | ----------------------------------------------------------- |
| Bar rendering     | Horizontal bars with proportional width, configurable color |
| Positive/negative | Red/green or custom colour for positive vs negative values  |
| Running total     | Optional running total line                                 |
| Drill-down        | Click bar → drill into child data                           |
| Empty/loading     | Standard states                                             |

### What stays in each child

- Data transformation (factor breakdown, weight allocation, etc.)
- Custom colour palettes
- Drill-down target

### Agent notes

- `risk-utilization` (30 lines) uses `LimitBar` from `components/trading/limit-bar` — may be a thin shell. Assess during audit.
- Small scope — 3-4 widgets. Quick win.

---

## Work Unit Priority and Parallelisation

| Priority | Work Unit               | §   | Widgets | Impact                                                         | Complexity | Can run in parallel with |
| -------- | ----------------------- | --- | ------- | -------------------------------------------------------------- | ---------- | ------------------------ |
| **1**    | InlineTable → DataTable | 3   | 18-22   | Highest — most widgets + fixes 4 disconnected strategy widgets | Medium     | All except § 3           |
| **2**    | RechartsWidget          | 1   | 10      | High — no loading/empty states on any chart                    | Medium     | All except § 1           |
| **3**    | FormWidget              | 2   | 16      | High — mock imports + no submit state                          | Medium     | All except § 2           |
| **4**    | DetailPanelWidget       | 4   | 10      | Medium                                                         | Low        | All except § 4           |
| **5**    | CardGridWidget          | 6   | 8       | Medium                                                         | Low        | All except § 6           |
| **6**    | ControlBarWidget        | 5   | 7       | Low                                                            | Low        | All except § 5           |
| **7**    | HeatmapWidget           | 7   | 2       | ~~Low~~ No base — cross-cutting only                           | Done       | All except § 7           |
| **8**    | OrderBookWidget         | 8   | 3       | Low                                                            | Low        | All except § 8           |
| **9**    | WaterfallWidget         | 9   | 3       | Low                                                            | Low        | All except § 9           |

**All 9 work units can run in parallel.** No work unit modifies another's files. The only shared dependency is § 0 (cross-cutting) — the first agent to start should implement the `WidgetErrorBoundary` in `widget-grid.tsx`; all others verify it's in place.

---

## Acceptance Criteria (per work unit)

- [ ] Base component created (or existing one extended)
- [ ] All child widgets migrated to use the base
- [ ] All mock imports removed from widget files (§ 0.3)
- [ ] Loading state works via base
- [ ] Empty state works via base
- [ ] No `any` types or `@ts-ignore` introduced
- [ ] Widget error boundary is in place (§ 0.1)
- [ ] Findings doc written to `docs/audits/findings/{base-id}-findings.md`
- [ ] `tsc --noEmit` passes
- [ ] Dev server runs without errors
