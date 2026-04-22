# 07 — Trading tab target state (BP-1, Stream B)

**Status:** PRE-FILLED DRAFT — Harsh to correct/extend
**Last updated:** 2026-04-15
**Linked boss-point:** BP-1 — SSOT docs + target state
**Scope:** the **trading lifecycle tab only**. Other tabs come in later passes.

---

## How to use this doc

- Every section is **pre-filled from the codebase** (file paths inline). It describes **current state** — which for a working system that Harsh is happy with is probably very close to target state.
- Harsh reads each section and either (a) ticks it off as accurate, (b) corrects a line, or (c) adds a short "target delta" at the bottom of a section if current state is wrong.
- **Open (not in code)** bullets at the end of each section are the only things I genuinely couldn't determine by reading the code — these are the real questions.
- A section becomes **[STABLE]** when Harsh explicitly marks it so.

---

## Section 1 — Context: where trading fits [STABLE]

**Found in code** (`components/shell/service-tabs.tsx`, `app/(platform)/`):

The product has a **row-1 lifecycle nav**, each tab carrying its own tab-set export. All of them live in this repo under `app/(platform)/services/` and share one Next.js App Router + one widget registry.

| Row-1 tab         | Tab-set export                 | Route prefix                               |
| ----------------- | ------------------------------ | ------------------------------------------ |
| Acquire           | `DATA_TABS`                    | `/services/data/*`                         |
| Build (Research)  | `BUILD_TABS` / `RESEARCH_TABS` | `/services/research/*`                     |
| Promote           | (lifecycle nav)                | `/services/promote/*`                      |
| **Trading (Run)** | **`TRADING_TABS`**             | **`/services/trading/*`**                  |
| Observe           | `OBSERVE_TABS`                 | `/services/observe/*`                      |
| Manage            | `MANAGE_TABS`                  | `/services/manage/*`                       |
| Report            | `REPORTS_TABS`                 | `/services/reports/*`                      |
| Admin/Ops         | `ADMIN_TABS`                   | `/admin/*`, `/ops/*`, `/config`, `/devops` |

`/services/execution/*` is an **internal-only service**. It is NOT archived / dead code — the routes, tab-sets (`EXECUTE_TABS` / `EXECUTION_TABS`), and 26+ cross-references in `next.config.mjs`, lifecycle nav, command palette, `UI_STRUCTURE_MANIFEST.json`, and e2e tests all **stay in place as-is**. The "archived" label only means _not sold as a standalone external service_ — internal users still need it and it remains fully functional.

**Future decision (deferred, not BP-1):** whether execution becomes a standalone lifecycle tab bundled with another service, gets merged into another existing tab, or stays independent as it is today. No removal, no refactor, no cleanup planned — leave it alone until that decision is made.

**Widgets are trading-only for now.** Only `/services/trading/*` uses the widget-grid pattern. Every other lifecycle tab is a fixed-layout page. This is the **target state for BP-1 scope** — widgets may expand to other tabs in the future, but that is explicitly out of scope for BP-1 → BP-2 work.

**Login landing — `/dashboard`.** Authenticated users land on [`/dashboard`](<../../app/(platform)/dashboard/page.tsx>), a lifecycle-aware overview rendered from `SERVICE_REGISTRY` and `PLATFORM_LIFECYCLE_STAGES`. It is **not** a marketing page — the `(public)/page.tsx` is the unauthenticated landing. From `/dashboard` the user navigates into whichever lifecycle tab they have entitlements for. Most lifecycle tabs also have their own `overview` sub-page (e.g. `/services/trading/overview`, `/services/data/overview`) which is similarly entitlement-gated.

Route groups: `(public)` (unauth landing/docs/demo), `(platform)` (authenticated product — `/dashboard` + all `/services/*` lifecycle tabs live here), `(ops)` (internal admin).

**Known-good status:** login scoping and entitlement gating are considered working correctly today. A lightweight security audit of the `(platform)` gate + per-tab entitlement wiring is captured as a follow-up below — not a blocker for BP-1 but worth a defensive pass.

**Follow-up actions from this section:**

- [ ] **Security audit** of the authenticated route gate (`app/(platform)/layout.tsx`), per-tab entitlement checks, and the landing redirect to `/dashboard`. Goal: confirm no path lets an unauthenticated or under-entitled user reach a `(platform)` page. Owner: TBD — likely a dedicated mini-task, not part of BP-1 proper.

---

## Section 2 — Trading tab internal structure [STABLE]

**Found in code** (`app/(platform)/services/trading/layout.tsx`, `components/shell/trading-vertical-nav.tsx`):

Persistent layout for every trading sub-page:

```
┌──────────────────────────────────────────────────────────────┐
│                    (no top nav — row-1 is elsewhere)         │
├────────┬───────────────────────────────────────┬─────────────┤
│        │ WorkspaceToolbar (widget tabs only)   │             │
│ Vert.  ├───────────────────────────────────────┤ Quick View  │
│ Nav    │                                       │ (right,     │
│ (left, │        Widget Grid  /  Page content   │ collapsible)│
│ TRADING│        (EntitlementGate wraps it)     │             │
│ _TABS) │                                       │             │
│        │                                       │             │
└────────┴───────────────────────────────────────┴─────────────┘
```

- **Left vertical nav** — `TradingVerticalNav` renders `TRADING_TABS`, grouped by `familyGroup` (DeFi, Sports, Options & Futures, Predictions are collapsible families). Bottom slot holds `LiveAsOfToggle`.
- **Widget toolbar** — `WorkspaceToolbar` only appears on tabs that use the grid. Standalone pages (see sub-tab list below) opt out.
- **Main content** — resizable panel (default 82%), wrapped in `EntitlementGate(entitlement="execution-basic")`, wraps `ErrorBoundary` around `children`.
- **Quick View** — resizable panel (default 18%, collapsible to 2%), contains 6 cards in `TradingSidebar()`: Positions / Alerts / Recent Fills / System Health / Accounts / News. Each card is a `Link` that navigates to the relevant sub-tab.
- **Workspace persistence** — `useWorkspaceStore` (Zustand) with `useWorkspaceSync` (Firestore sync, no-op if Firebase not configured). Layout is per-tab + per-user.

**Trading sub-tabs (24)** — organized into 5 groups in `TRADING_TABS`:

| Group                     | Tabs                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Shared (always visible)   | Overview · Terminal · Book · Orders · Positions · Alerts · Risk · P&L · Accounts · Instructions · Markets · Strategies |
| DeFi family (collapsible) | DeFi · Bundles · Staking                                                                                               |
| Sports family             | Sports · Place Bets · Accumulators                                                                                     |
| Options & Futures family  | Options · Combo Builder · Pricing                                                                                      |
| Predictions family        | Predictions · Aggregators                                                                                              |

**Standalone pages** (widget toolbar hidden, render their own layout):
`sports/bet`, `sports/accumulators`, `options/combos`, `options/pricing`, `predictions/aggregators`, `defi/staking`, `strategies/model-portfolios`, `strategies/basis-trade`.

**Layout presets** — yes, they exist. See `components/widgets/preset-registry.ts` and per-domain `register.ts`. E.g. `terminal` ships with "Default" and "Full" presets; `orders` ships with "Default" and "Full". Users can create their own; presets are the starting point, not fully user-driven from day 1.

### Confirmed target state (2026-04-15)

- **Grouping [STABLE]** — 12 shared + 4 families (DeFi · Sports · Options & Futures · Predictions) is the right shape. Changes will be made inline and the doc updated if that happens, but nothing is missing or dead today.
- **Standalone pages → eventually widgets.** All 8 standalone pages (`sports/bet`, `sports/accumulators`, `options/combos`, `options/pricing`, `predictions/aggregators`, `defi/staking`, `strategies/model-portfolios`, `strategies/basis-trade`) will be migrated into the widget grid. Not for BP-1 — captured as a future conversion pass.
- **Immediate scope for BP-1 → BP-2:** all **shared tabs** + the **DeFi family** (DeFi, Bundles — but **not Staking**, which is the final DeFi stage and comes last). Backend integration for DeFi strategies starts **next week**, so this must be solid and fully working. Other strategy families (Sports, Options & Futures, Predictions) come later once DeFi proves the shape.
- **Layout presets [STABLE for now].** The current "Default" / "Full" presets per domain are fine. Harsh will update the default placements per tab once each tab is considered "done" — not a BP-1 concern.

### Cross-cutting additions raised here (detailed in Section 7)

- **"Show + lock, never hide."** All tabs and services are visible to every user regardless of subscription. Unentitled tabs render with a padlock; backend enforces independently. See Section 7 for the full model and proposed status-code convention.
- **New widget field: `tier: "basic" | "premium"`.** Trading service will have two tiers. For now **every widget is `basic`** — actual split happens in a later BP once the product is fully built and the basic/premium boundary is clear. Add the field to `WidgetDefinition` now so the data shape is ready. See Section 7.

- **Quick View [STABLE]** — all 6 cards (Positions / Alerts / Recent Fills / System Health / Accounts / News) confirmed as the right default. No additions or removals.

---

## Section 3 — What "widget" means here (and why) [STABLE]

**Found in code** (`components/widgets/widget-registry.ts`, `widget-grid.tsx`, `widget-wrapper.tsx`, per-domain `register.ts`):

A **widget** in this codebase is:

1. A React component registered via `registerWidget(def: WidgetDefinition)` into a module-level `Map<string, WidgetDefinition>` — the registry is a singleton, imported once at app boot via `register-all.ts`.
2. A `WidgetDefinition` carries: `id`, `label`, `description`, `icon`, `category` (catalogue grouping), `minW/minH/maxW/maxH/defaultW/defaultH`, `requiredEntitlements: string[]`, `availableOn: string[]` (tab ids), `singleton?: boolean`, and the `component` itself.
3. A `**WidgetPlacement`\*\* is separate — it's the instance record for a user's workspace: `widgetId`, `instanceId`, `x/y/w/h`, optional `config`, and `coTabs[]` / `activeTabId` for tab-merging multiple widgets into one grid cell.
4. The grid is `react-grid-layout`'s `ResponsiveGridLayout` — 12 cols, 80px row height, `[2,2]` margin. Widgets are draggable/resizable in edit mode. A single instance can be expanded to fullscreen via the `widget-fullscreen-boundary` div.

**Widget vs plain component:** the distinguishing feature is **registration** + **placement lifecycle**. A widget is addressable by `id`, lives in a grid slot, persists its placement in the workspace store, and is entitlement-gated. A plain component is just JSX.

**Domain mapping:** every widget lives under a domain folder (e.g. `components/widgets/orders/`) and is registered in that folder's `register.ts`. There are 17 domain folders (accounts, alerts, book, bundles, defi, instructions, markets, options, orders, overview, pnl, positions, predictions, risk, sports, strategies, terminal). Each domain has a `*-data-context.tsx` for shared data fetching across its widgets.

**Nesting:** widgets are always leaves in the grid. Tab-merging via `coTabs` is the escape hatch — multiple widgets can share one grid cell, switchable via a tab header inside the cell.

### Confirmed target state (2026-04-15)

- **Widget definition [STABLE]** — widget = registry entry + placement + entitlement, not just a component. Confirmed.
- **Grid granularity [TARGET DELTA]** — current grid in `widget-grid.tsx`: **12 columns, 80px row height, `[2,2]` margin, rows unlimited (extend vertically)**. The fallback minimum when a widget doesn't declare its own is `minW: 3, minH: 2` (= 25% width, 160px). Across all 17 domains' `register.ts` files, widgets declare `minW` in the range 1–6 and `defaultW` typically 4–12 (many default to full-width 12). `minH` ranges 1–6, `defaultH` ranges 1–11. Target: **increase column count** (e.g. 24 or 36) and **reduce row height** (e.g. 40px) for finer-grained control. Every widget's `minW/minH/defaultW/defaultH` will need proportional scaling (e.g. 12→24 cols means current `minW: 3` → `minW: 6` to keep the same minimum visual size). Exact numbers TBD.

- **`coTabs` [PERMANENT]** — tab-merging multiple widgets in one grid cell is the long-term pattern. Two guardrails need adding:
  1. **Max co-tabs per cell** — currently no limit enforced (code: `widget-wrapper.tsx` line 191 filters only by "not already in this cell", no cap). **Target: default limit of 3.** Store this as a configurable constant (in widget config or `WidgetDefinition` or a global default in `widget-registry.ts`) so it's easy to raise/lower. Prevents a user stacking 20 widgets in one cell, which would hammer the backend with concurrent data requests from the active + background tabs.

  2. **Co-tab compatibility** — not every widget makes logical sense together (e.g. Transfer History + Kill Switch + Alert Summary in one cell is nonsensical). Need a compatibility mechanism so the "+" button only offers widgets that make sense alongside the existing ones.

     **Starting approach:** use `category` (already on `WidgetDefinition`) — only widgets in the same category can be co-tabbed. Categories aren't perfectly defined today (see Section 4 for extraction priorities), but it's a reasonable first filter.

     **Future refinement:** may need a dedicated field (e.g. `compatibilityGroup: string` or `compatibleWith: string[]`) once categories are settled and edge cases appear (cross-category widgets that logically belong together, or same-category widgets that shouldn't be stacked).

- **Widget nesting — no.** Widgets always stay as leaves in the grid. `coTabs` is the only multi-widget-per-cell mechanism.

**Open (not in code) — raised here, deferred:**

- **Data policy for inactive co-tabs.** When a co-tab is in the background (not the active tab in a cell), does it still fetch data? Should it pause requests and resume on tab switch? What transport per widget (WebSocket vs REST poll vs PubSub)? This is a separate discussion — not BP-1, but it shapes how coTabs interact with the backend. Captured for future scoping.

---

## Section 4 — Widget classes and base widgets [STABLE]

**Full audit:** [`docs/archived/WIDGET_CATALOGUE.md`](../archived/WIDGET_CATALOGUE.md) — 114 widgets across 17 domains, each classified by UI class, chart library, and behaviour. Audited 2026-04-16.

### Existing base widgets (4)

| Base                     | File                                       | Actual adoption                                                                                                                                                     | Notes                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **KpiSummaryWidget**     | `kpi-summary-widget.tsx` + `kpi-strip.tsx` | **9 widgets** (orders, positions, alerts, accounts, strategies, predictions, risk, instructions, bundles) + 5 more using `KpiStrip` directly                        | Well-adopted                                                                                                                                                                                                 |
| **LiveFeedWidget**       | `live-feed-widget.tsx`                     | **8 widgets** (market-trades, markets-order-flow, markets-live-book, markets-defi-amm, instr-pipeline-table, strategy-table, pred-recent-fills, defi-trade-history) | Well-adopted                                                                                                                                                                                                 |
| **DataTableWidget\<T\>** | `data-table-widget.tsx` + `data-table.tsx` | **2 widgets** (sports-my-bets, pred-settled-positions) — but **14 inline-table widgets exist** that could migrate to it                                             | Under-adopted. Currently has sort only — **filtering will be added to DataTable itself** (not via FilterBar). Target: DataTable owns its own column-level filters.                                           |
| **FilterBar**            | `filter-bar-widget.tsx` + `filter-bar.tsx` | **2 widgets** (sports-fixtures, pred-markets-grid)                                                                                                                  | Under-adopted. **May not remain a base widget.** If DataTable gets its own filters and other widgets handle filtering inline, FilterBar may be demoted to a utility component or removed. Decision deferred. |

### Widget classes (16 total, from audit)

| Class          | Count | Has base?                    | Examples                                                                  |
| -------------- | ----- | ---------------------------- | ------------------------------------------------------------------------- |
| kpi-strip      | 9     | Yes (`KpiSummaryWidget`)     | orders-kpi, positions-kpi, risk-kpi, alerts-kpi                           |
| live-feed      | 8     | Yes (`LiveFeedWidget`)       | market-trades, markets-order-flow, defi-trade-history                     |
| form           | 15    | **No**                       | order-entry, defi-lending, defi-swap, book-order-entry, accounts-transfer |
| inline-table   | 14    | Should use `DataTableWidget` | orders-table, positions-table, alerts-table, options-chain                |
| recharts-chart | 10    | **No**                       | risk-var-chart, pnl-time-series, risk-margin, risk-term-structure         |
| card-grid      | 7     | **No**                       | alerts-preview, health-grid, risk-circuit-breakers, bundle-templates      |
| detail-panel   | 7     | **No**                       | instr-detail-panel, sports-fixture-detail, bundle-steps                   |
| control-bar    | 7     | **No**                       | instrument-bar, pnl-controls, markets-controls, options-control-bar       |
| bespoke        | 9     | N/A                          | pnl-chart, calendar-events, pred-odum-focus, options-greek-surface        |
| heatmap        | 3     | **No**                       | risk-correlation-heatmap, risk-strategy-heatmap, defi-funding-matrix      |
| order-book     | 3     | **No**                       | order-book, depth-chart, markets-live-book                                |
| waterfall      | 3     | **No**                       | pnl-waterfall, pnl-attribution, defi-waterfall-weights                    |
| data-table     | 2     | Yes (`DataTableWidget`)      | sports-my-bets, pred-settled-positions                                    |
| filter-grid    | 2     | `FilterBar` (may be demoted) | sports-fixtures, pred-markets-grid                                        |
| action-panel   | 2     | N/A (too small)              | alerts-kill-switch, pnl-report-button                                     |
| lw-chart       | 1     | Via `CandlestickChart`       | price-chart                                                               |

### Chart library policy

| Library                | Use case                                   | Widgets                                                                            |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| **lightweight-charts** | Candlestick, OHLCV, high-volume historical | `price-chart` (via `CandlestickChart`); also 3 research components outside widgets |
| **recharts**           | Area, bar, line, pie — simple statistical  | 10 widgets across risk, pnl, markets, defi                                         |

**Policy:** lightweight-charts for anything candlestick or high-data-volume. recharts for simple aggregation/summary. Per-widget decision based on rendering performance vs visual quality — avoid CPU/RAM bloat.

### Confirmed target state (2026-04-16)

- **3 confirmed bases + 1 uncertain.** KpiSummaryWidget and LiveFeedWidget are well-adopted. DataTableWidget is under-adopted (2 of 16 table widgets) — migration of inline-table widgets to DataTableWidget is a BP-2 action, and **DataTable will get its own built-in column filters** (not via FilterBar). FilterBar's status as a base widget is uncertain — may be demoted to utility or removed once DataTable handles filtering natively.
- **9 candidate new bases** identified in priority order (see full table in `WIDGET_CATALOGUE.md` → "Class Summary" section): RechartsWidget (10 widgets) → FormWidget (15) → inline-table migration (14) → DetailPanelWidget (7) → ControlBarWidget (7) → CardGridWidget (7) → HeatmapWidget (3) → OrderBookWidget (3) → WaterfallWidget (3).
- **Per-widget deep audit deferred.** Some widgets are duplicated, some need layout fixes, some need rewrites. This is execution work done per-tab when building each one out — not part of BP-1 target-state scoping. The class catalogue provides the foundation for those per-widget decisions.
- **"Done / don't touch" vs "rebuild on base"** — deferred to per-tab build-out. Harsh will make this call per widget when he gets to each tab.

---

## Section 5 — Base widget extension pattern [STABLE]

### The principle: base owns layout + chrome, child owns content + config

Every base widget owns the **structural shell**: where things go, how they look by default, shared interactive behaviours (sort, filter, refresh, export). The child widget provides the **what**: which data, which columns, which filters, which metrics. The child never re-implements layout or chrome that the base already handles — exceptions only when a specific child genuinely needs a different visual treatment.

### Base → child boundary (target pattern, using DataTable as the primary example)

**What the base owns** (structural shell — consistent across all children):

- **Filter bar placement** — where filters render, how they collapse/expand, consistent spacing
- **Common action buttons** — Refresh, Column Selection, Export (CSV/clipboard), placed in a standard toolbar slot
- **Header row** — column headers with sort indicators, resize handles, column reorder
- **Cell rendering** — default typography, alignment rules, number formatting, colour scheme (positive = green, negative = red, neutral = muted)
- **Sort logic** — click-to-sort cycling (asc → desc → none), multi-column sort if needed
- **Empty state** — consistent "No data" message, placement, styling
- **Loading state** — skeleton/shimmer while data is fetching
- **Scroll container** — horizontal + vertical scroll, sticky first column option
- **Pagination / virtual scroll** — if the data set is large
- **Selection** — row select, multi-select, select-all (if applicable to the base class)

**What the child provides** (content + config — unique per widget):

- **Column definitions** — which columns, their labels, their types (string/number/date/custom), accessor functions, per-column formatting overrides
- **Filter definitions** — which filters to show (e.g. status dropdown, date range, venue picker), what options each filter has, default values
- **Data source** — reads from the domain's `useXxxContext()` hook and passes the typed array to the base
- **Row-level overrides** — per-row class (e.g. highlight cancelled orders), row click handler, expandable row content
- **Specific action overrides** — e.g. "Cancel Order" button in the orders table toolbar, "Claim Rewards" in staking — these are child-specific actions that slot into the base's action bar

### How the flow works end-to-end

```
1. DOMAIN CONTEXT (e.g. components/widgets/orders/orders-data-context.tsx)
   │  Wraps a data-fetching hook (e.g. useOrders()) into a React Context.
   │  Provides typed data + loading/error state to all widgets in the domain.
   │
2. CHILD WIDGET (e.g. components/widgets/orders/orders-table-widget.tsx)
   │  - Imports the base: import { DataTableWidget } from "@/components/shared/data-table-widget"
   │  - Reads data: const { orders, isLoading } = useOrdersContext()
   │  - Defines columns: const columns: DataTableColumn<Order>[] = [...]
   │  - Defines filters: const filters: FilterDef[] = [{ key: "status", options: [...] }]
   │  - Returns: <DataTableWidget columns={columns} filters={filters} data={orders} ... />
   │
3. REGISTRATION (e.g. components/widgets/orders/register.ts)
   │  - registerWidget({ id: "orders-table", component: OrdersTableWidget, category: "Orders", ... })
   │  - registerPresets("orders-default", [{ widgetId: "orders-table", x: 0, y: 1, w: 12, h: 10 }])
   │
4. BOOT (components/widgets/register-all.ts)
   │  - import "./orders/register" — runs registration at app boot
   │
5. RUNTIME
      - User navigates to /services/trading/orders
      - WidgetGrid reads placements from workspace store
      - orders-data-context.tsx provider wraps the grid
      - OrdersTableWidget renders DataTableWidget with its columns + data
      - Base handles all layout, sorting, filtering, actions chrome
```

### Same pattern applies to every base class

| Base                          | Base owns                                                                                                                                        | Child provides                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **DataTable**                 | Filter bar, action buttons (refresh/export/column-select), headers, sort, cell rendering, colour scheme, empty/loading state, scroll, pagination | Column defs, filter defs, data array, row overrides, custom actions            |
| **KpiSummary**                | Layout mode dropdown (fluid/cols-2/cols-3/single-row), card spacing, card chrome, colour scale (red/amber/green by threshold)                    | Metrics array (label, value, delta, format, threshold), storage key            |
| **LiveFeed**                  | Auto-scroll, row entry animation, max-rows buffer, timestamp column, empty state                                                                 | Row shape, row renderer, feed data source, buffer size                         |
| **RechartsWidget** (proposed) | ResponsiveContainer sizing, dark theme, axis defaults, tooltip chrome, legend, loading/empty state                                               | Chart type (Area/Bar/Line), data series, axis config, colour overrides         |
| **FormWidget** (proposed)     | Submit button + loading state, validation display, error banner, field layout (vertical/horizontal), section headers                             | Field definitions, validation rules, submit handler, field-specific components |

### Naming convention

`<domain>-<descriptive-name>-widget.tsx` — current convention, keeps it. No change needed.

### Escape hatch

Bespoke widgets that don't fit any base class import directly from `components/ui/*` (shadcn primitives) and render freely. The only hard requirement for any widget is registration via `registerWidget()`. Bespoke is fine — the goal is to extract bases where 3+ widgets share structural patterns, not to force every widget into a base.

### Audit approach for BP-2

When building out each base: audit child widgets **one by one**, compare what's currently bespoke in each child vs what can be pulled into the base. The base grows from real children, not from a theoretical design. If a child needs an exception, document it — don't bloat the base to handle every edge case.

---

## Section 6 — Data flow (quick capture) [STABLE]

**Found in code** (per-domain `*-data-context.tsx` × 17):

The current pattern is one `*-data-context.tsx` per domain (17 total), each wrapping hooks from `hooks/api/*` (e.g. `useOrders`, `usePositionsSummary`, `useAlertsSummary`) into a React Context. `AllWidgetProviders` in `components/widgets/all-widget-providers.tsx` composes them for the active tab.

Rule in practice: widgets **in the same domain** share the fetch via that domain's context. Widgets **across domains** on the same tab use their own domain's context — no cross-domain sharing.

Yesterday's regression (2026-04-14) came from `components/widgets/orders/orders-data-context.tsx` — it's currently modified in `git status`, still uncommitted. This is BP-5's load-bearing evidence and should be the first example Layer C tests should protect.

### Confirmed target state (2026-04-16)

- **Current data layer: mock data files + data contexts.** All widget data currently comes from static mock data files, consumed via `hooks/api/*` → `*-data-context.tsx`. This is the working state and is fine for now.
- **One data-context per domain stays as-is.** No consolidation or splitting needed at this stage — the current structure is logical and works.
- **Backend wiring, data sharing, and transport decisions are all deferred.** The actual pattern for how widgets talk to the backend (REST vs WebSocket vs PubSub), how data is shared across domains, cross-domain deduplication, and caching strategy will be decided when backend integration begins. Not a BP-1 concern.
- **OpenAPI alignment is a future step.** Backend schema is still evolving. When it stabilises, frontend mock data will be regenerated from OpenAPI specs (`lib/registry/openapi.json` already exists as a starting point) to ensure frontend mocks and backend responses stay aligned. This is a separate task.
- **For now: do what's logical.** Keep the current pattern (mock data → hooks → context → widgets). Don't over-engineer the data layer for a backend that doesn't exist yet. The real architecture will be designed when backend wiring starts (DeFi backend integration next week is the first real test).

---

## Section 7 — Entitlements within trading [STABLE]

**Found in code** (`TRADING_TABS` in `service-tabs.tsx`, `EntitlementGate`, `register.ts` per widget):

Trading is a **standalone service** with its own whole-tab entitlement gate. Entitlement gating happens at **three levels** — confirmed as the right long-term structure:

1. **Whole trading tab** — `EntitlementGate(entitlement="execution-basic")` wraps all children in `app/(platform)/services/trading/layout.tsx`. No `execution-basic`, no trading at all.
2. **Per sub-tab** — individual `TRADING_TABS` entries carry `requiredEntitlement`. Tabs without the entitlement render locked (grey + padlock icon via the nav component). The entitlements in use today: `markets-data`, `strategy-families`, `defi-trading`, `defi-bundles`, `defi-staking`, `sports-trading`, `options-trading`, `predictions-trading`.
3. **Per widget** — each `WidgetDefinition.requiredEntitlements: string[]`. The catalogue + placement hide widgets the user doesn't have entitlements for. Common pattern: `["execution-basic", "execution-full"]` so basic AND full both see it. Newer strategy widgets (from `ab98f92`) also use this pattern.

**Two tiers** — `execution-basic` and `execution-full` — limit which tabs and widgets a user sees within trading.

### Data scoping — same widget, different data (confirmed 2026-04-16)

The widget itself is identical for every user. What differs is the **data** the backend returns, filtered by the user's scope and access level:

- **Scope dimensions:** organisation, client, strategy. An internal admin sees everything; an external client sees their org's data only.
- **Market-level data** (market data, order book, news) is the **same for everyone** who is entitled — no per-user bifurcation needed.
- **Account-level data** (orders, positions, P&L) has columns like `account`, `organisation`, `strategy` — the **backend filters** rows according to the user's scope. The UI renders the same widget with the same columns for everyone; the data set is just smaller.
- This is data-scoping, not widget-scoping — all users see the same widget set for their tier, and the backend decides what data populates it.
- Different personas (internal admin, client-full, client-premium, DeFi client, data-only, etc.) exist to test and visualise these scope boundaries. This will be improved in future versions.

### Target model — "Show + lock, never hide" (2026-04-15)

The confirmed target behaviour, cross-cutting every level:

- **All tabs + services are always visible** to every logged-in user, regardless of subscription.
- Unentitled surfaces render **locked with a padlock icon**, not removed from the DOM.
- **Backend enforces independently** — the frontend lock is UX only. The API returns an entitlement error when an unentitled user requests a gated endpoint.
- This means the 3-level gate today (whole-tab / per-sub-tab / per-widget) keeps its **structure**, but the behaviour shifts from "hide if not entitled" → "render locked if not entitled, backend refuses data".

**Implication for the Patrick-persona lockdown work:** those commits probably need to be revisited — the current pattern may be hiding rather than locking. Not a BP-1 change, but worth flagging for BP-6/BP-7 when the entitlement matrix is captured.

### Backend status code for entitlement failure — `402 Payment Required`

Convention picked now so UI ↔ backend wiring later is straightforward.

**`402 Payment Required`** for entitlement failures where upgrade is possible, with a structured JSON body:

```json
{
  "code": "ENTITLEMENT_REQUIRED",
  "entitlement": "defi-trading",
  "upgrade_available": true,
  "message": "This feature requires the defi-trading entitlement."
}
```

**Single-source requirement:** the 402 response shape and message text must be defined in **one place** in the codebase. All widgets reference that single definition — if the message or shape ever changes, it's a one-file edit. This applies to both the backend response constructor and the frontend error handler that renders the padlock/upgrade CTA.

Rationale:

- `401 Unauthorized` = "you're not logged in" — wrong semantics.
- `403 Forbidden` = "you're logged in but you can't and never will" — too final for a subscription tier.
- `402 Payment Required` = the literal spec meaning is "content requires payment" — aligns perfectly with "you need to upgrade to access this", and is underused in the wild so we're not stepping on anyone else's convention.
- The UI can branch on `upgrade_available: true/false` to show "Upgrade" vs "Contact admin" CTAs without extra round-trips.
- For permanent non-entitlements (e.g. a geo-block or admin-removed feature), use `403 Forbidden` with the same JSON shape but `upgrade_available: false`.

### New field: `WidgetDefinition.tier: "basic" | "premium"`

Add a `tier` field to `WidgetDefinition` in `components/widgets/widget-registry.ts`:

```typescript
export type WidgetTier = "basic" | "premium";

export interface WidgetDefinition {
  id: string;
  label: string;
  // …existing fields…
  tier: WidgetTier; // NEW — default to "basic" everywhere for now
  requiredEntitlements: string[];
}
```

- **Every widget is `basic` today.** The field exists so the split happens by editing registration calls later, not by reshaping the type.
- **Actual split is deferred** to the dedicated entitlements BP (likely BP-6/BP-7) — Harsh will decide which widgets go premium once the full product exists and the boundary is clear.
- Runtime behaviour matches the show+lock model: a `premium` widget in the catalogue will render with a padlock for `basic`-tier users, backend refuses data.

**Open (not in code):**

- The exact audience × tier × persona matrix. BP-6 + BP-7 will capture this properly — this section just confirms the mechanism is correct.
- Which entitlements are deprecated / should be renamed / should be merged — deferred to entitlement matrix work.

---

## Section 8 — Explicit non-goals [STABLE]

**Target audience:** institutional-grade / professional traders. Not targeting retail at this point.

### Hard non-goals

- **Mobile** — grid is `12` cols at all breakpoints, no meaningful phone reflow. Desktop browser with left nav + 12-col grid + Quick View assumed.
- **Offline** — no service worker, no cache persistence beyond Firestore workspace sync.
- **Localization** — no i18n files, all strings English in-component.
- **White-label theming** — no tenant theme provider. Colors are Tailwind defaults + dark theme.
- **Nested workspaces / tabs-within-widgets** — `coTabs` allows tab-merging in a cell, but no deeper nesting.
- **Non-trading lifecycle tabs** — this doc and all BP-1/BP-2 work covers the trading lifecycle tab only. The widget-grid pattern and base-widget architecture _can_ extend to other tabs (observe, data, etc.) but that is not planned or prioritised here.
- **Standalone page conversions** — pages that are not widget-grid today stay as they are. No converting standalone pages to widget-grid or vice versa.

### Priority and attention model

| Lane                                                     | Harsh attention needed | Work type                                                                                                                                       |
| -------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Common tabs + DeFi tabs**                              | **Yes — top priority** | Fully functional and tested. This is where Harsh's time goes.                                                                                   |
| Other strategy tabs (Sports, Options, Predictions, etc.) | No — parallelisable    | UI/widget enhancements (base widget extraction, extension pattern, catalogue cleanup). Agents can do this independently without blocking Harsh. |

> Note: `/services/execution/*` is **not** a non-goal or dead code — see Section 1. It is an internal-only service that stays as-is.

> Note: `/services/observe/risk` and `/services/observe/alerts` re-import their pages from the trading tab (thin wrappers around `trading/risk/page.tsx` and `trading/alerts/page.tsx`). This sharing stays as-is for now — both observe and trading will evolve independently later.

---

## Open questions surfaced during this doc

_(Only the genuine ones — things the code doesn't answer.)_

1. **BP-2 extraction priority** — of the bespoke classes without a base (time-series chart, order book, heatmap, etc.), which does Harsh want extracted first? See Section 4.
2. ~~**Entitlement data-scoping vs widget-scoping**~~ — **RESOLVED**: it's data-scoping. Same widget for everyone, backend filters by user scope. See Section 7.
3. **Canonical data layer** — is `hooks/api/`_ or `_-data-context.tsx` the SSOT for BP-5, or do both remain? See Section 6.
4. **Standalone pages** — should any be pulled into the widget grid, or any widget-grid tabs pushed out to standalone? See Section 2.

---

## Changelog

- 2026-04-16: All 8 sections [STABLE]. Merged 2 remote commits (`ab98f92` sports parity + `64153fd` formula corrections — 10 new widgets, 2 new pages, 3 new hooks/stores). Folded Section 7 answers (three-level model, data-scoping, 402 single-source). Section 8 confirmed: institutional audience, non-goals locked, priority = common + DeFi tabs. Observe/risk and observe/alerts page sharing documented.
- 2026-04-15: Sections 2-6 marked [STABLE] after Q&A. Full 114-widget audit → `WIDGET_CATALOGUE.md` rewrite with Class + Chart Lib columns. Section 1 corrected (execution = internal-only, not dead code). Section 7 pre-staged with show+lock model, 402 proposal, tier field.
- 2026-04-15: Skeleton replaced with pre-filled findings from codebase exploration. Sections 1-8 all DISCUSSING but now have concrete state; Harsh confirms/corrects rather than brain-dumps.
- 2026-04-15: Initial empty skeleton (superseded).
