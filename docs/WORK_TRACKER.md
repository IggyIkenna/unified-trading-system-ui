# UI Work Tracker — Master Task Registry

> **Created:** 2026-03-28
> **Source:** Platform review meeting (2026-03-25), follow-up chat (2026-03-28), UI-UX-Enhancements.md, codebase audit
> **Format:** Each task has two checkboxes:
>
> - `[ ] doc` — task document created with scope, files, acceptance criteria
> - `[ ] done` — implementation complete and verified

---

## 1. Nav & Shell Bugs

### 1.1 Trading lifecycle button not highlighted on alerts / strategy family tabs

- [x] doc
- [x] done
- **Root cause:** `getRouteMapping()` in `lib/lifecycle-mapping.ts` has no `/services/trading` prefix fallback. Routes like `/services/trading/alerts`, `/services/trading/defi`, `/services/trading/sports` return `undefined`, so `currentStage !== "run"` and the Trading button never activates.
- **Fix:** Add a `/services/trading` prefix fallback block in `getRouteMapping` (same pattern as the existing `/services/observe` fallback), returning `primaryStage: "run"`.
- **Files:** `lib/lifecycle-mapping.ts`, `components/shell/lifecycle-nav.tsx`

### 1.2 Strategy family sibling tabs double-highlight

- [x] doc
- [x] done
- **Root cause:** Prefix-based `isActive` logic — parent `/services/trading/defi` is a prefix of child `/services/trading/defi/staking`, so both light up.
- **Fix:** Add `exact: true` on family index tabs (DeFi, Sports, Options, Predictions) in `TRADING_TABS`.
- **Files:** `components/shell/service-tabs.tsx` (TRADING_TABS), `components/shell/trading-vertical-nav.tsx`

### 1.3 Custom workspace panels — no delete button

- [x] doc
- [x] done
- **Root cause:** `deleteCustomPanel` exists in `workspace-store.ts` but `TradingVerticalNav` never calls it — no UI control exposed.
- **Fix:** Add a delete button/context-menu on each custom panel row in `TradingVerticalNav`, calling `deleteCustomPanel(panel.id)`.
- **Files:** `components/shell/trading-vertical-nav.tsx`, `lib/stores/workspace-store.ts`

---

## 2. UI-UX Enhancements (from UI-UX-Enhancements.md — remaining items)

### 2.1 Internal team enhanced help docs

- [ ] doc
- [ ] done
- **What:** For internal users, enhance the existing PageHelp descriptions to also cover backend functionality, API endpoints, data sources, and operational context.
- **Source:** UI-UX-Enhancements.md § help and tips

### 2.2 Sharded components standardization

- [ ] doc
- [ ] done
- **What:** Centralize and standardize across the UI:
  - Horizontal and vertical scroll bars (consistent styling)
  - Font size, font color, font type (design tokens)
  - Central color templates (theme tokens in `globals.css`)
  - Multiple card types by use case (stat card, action card, info card, etc.)
  - Form fields (checkboxes, switches, dropdowns, date ranges, inputs — consistent primitives)
- **Source:** UI-UX-Enhancements.md § sharded components list

### 2.3 Workspace selection across all pages

- [ ] doc
- [ ] done
- **What:** Currently workspace selection (WorkspaceToolbar) only appears on trading widget tabs. Should be available on all service pages that use WidgetGrid.
- **Source:** UI-UX-Enhancements.md § Widgets Enhancements

### 2.4 Workspace export — cover all pages

- [ ] doc
- [ ] done
- **What:** Workspace export currently only covers the current page's widgets. Should export the user's full workspace across all pages they have access to.
- **Source:** UI-UX-Enhancements.md § Widgets Enhancements

### 2.5 Add widget button placement

- [ ] doc
- [ ] done
- **What:** Better placement of "Add Widget" buttons and workspace selection controls. Current placement is inconsistent.
- **Source:** UI-UX-Enhancements.md § Widgets Enhancements

### 2.6 Cross-tab widget adding

- [ ] doc
- [ ] done
- **What:** Once widgets are properly merged, allow adding widgets from other tabs into the current workspace. Ultimate goal: user creates their own workspace from scratch (with backend limits). This removes the need for the service tab navbar entirely.
- **Source:** UI-UX-Enhancements.md § Widgets Enhancements
- **Note:** Big feature — depends on widget merging (§4) being complete first.

### 2.7 Top navbar layout — breadcrumbs and filters

- [ ] doc
- [ ] done
- **What:** Option A from UI-UX-Enhancements.md:
  - Move breadcrumbs to top bar, right side of ODUM logo
  - Move Org/Client/Strategy filters to top bar, right side of lifecycle tabs (currently in breadcrumbs row)
- **Note:** Needs design iteration to avoid crowding. May need team review (Option B).
- **Source:** UI-UX-Enhancements.md § Top NavBar Enhancements

---

## 3. Component Centralization (from codebase audit)

### 3.1 KPI metric strip primitive

- [ ] doc
- [ ] done
- **What:** 8+ separate `*-kpi-strip` widgets across domains (positions, orders, alerts, strategies, accounts, P&L, markets, risk) all implement similar metric-strip patterns. Extract a shared `MetricStrip` component driven by a config array `{label, value, format, trend}`.
- **Target:** `components/widgets/primitives/metric-strip.tsx`
- **Consumers:** All `*-kpi-strip` widgets refactored to use the shared primitive.

### 3.2 Toolbar/controls row primitive

- [ ] doc
- [ ] done
- **What:** 7+ separate controls widgets (`pnl-controls`, `markets-controls`, `options-control-bar`, `instr-summary`, `defi-wallet-summary`, `book-hierarchy-bar`, `instrument-bar`) each build similar toolbar layouts.
- **Target:** `components/widgets/primitives/toolbar-row.tsx`

### 3.3 Master-detail layout primitive

- [ ] doc
- [ ] done
- **What:** Sports (fixtures/detail), Predictions (grid/detail), Instructions (table/detail) all need responsive master-detail layouts (split on large screens, stack on small). Extract shared layout component.
- **Target:** `components/widgets/primitives/master-detail-layout.tsx`

### 3.4 Trading data-table shell

- [ ] doc
- [ ] done
- **What:** Repeated DataTable patterns across all `*-table-widget` files. Extract shared table wrapper with consistent density, empty state, column visibility, loading skeleton.
- **Target:** `components/ui/data-table-shell.tsx`

### 3.5 Quick stat card

- [ ] doc
- [ ] done
- **What:** Trading sidebar (`TradingSidebar` in layout) builds repeated Card + CardContent blocks for positions/alerts/orders/health/accounts/news with similar structure. Extract a reusable `QuickStatCard` component.
- **Target:** `components/trading/quick-stat-card.tsx`

### 3.6 Unify active-tab logic

- [ ] doc
- [ ] done
- **What:** `ServiceTabs` and `TradingVerticalNav` duplicate the exact same `isActive` logic (matchPrefix, exact, pathname.startsWith). Extract to a shared helper.
- **Target:** `lib/utils/nav-helpers.ts`
- **Consumers:** `components/shell/service-tabs.tsx`, `components/shell/trading-vertical-nav.tsx`

---

## 4. Widget Merging — Trading Panel

### 4.1 Positions: KPI + table → single widget

- [ ] doc
- [ ] done
- **Current:** `positions-kpi-strip` + `positions-table` (+ optional `account-balances`)
- **Target:** Single Positions workspace widget with sticky KPI row.
- **Files:** `components/widgets/positions/register.ts` and widget files

### 4.2 Orders: KPI + table → single widget

- [ ] doc
- [ ] done
- **Current:** `orders-kpi-strip` + `orders-table`
- **Target:** Single Orders widget with integrated filters and KPI.
- **Files:** `components/widgets/orders/register.ts`

### 4.3 Alerts: KPI + table + kill-switch → single console

- [ ] doc
- [ ] done
- **Current:** `alerts-kpi-strip` + `alerts-table` + `alerts-kill-switch`
- **Target:** Single Alerts console (summary strip + feed + action column).
- **Files:** `components/widgets/alerts/register.ts`

### 4.4 Strategies: KPI + catalogue → single panel

- [ ] doc
- [ ] done
- **Current:** `strategies-kpi` + `strategies-catalogue` + grid link
- **Target:** Single Strategies panel; keep grid link as CTA or inline.
- **Files:** `components/widgets/strategies/register.ts`

### 4.5 P&L: controls + charts → single widget with tabs

- [ ] doc
- [ ] done
- **Current:** `pnl-controls` + waterfall/TS/client/factor (6 widgets total)
- **Target:** Single P&L widget with internal tab sections.
- **Files:** `components/widgets/pnl/register.ts`

### 4.6 Sports: fixtures + detail → master-detail

- [ ] doc
- [ ] done
- **Current:** `sports-fixtures` + `sports-fixture-detail`
- **Target:** Single split widget using master-detail primitive (§3.3).
- **Files:** `components/widgets/sports/register.ts`

### 4.7 Predictions: grid + detail + trade → single desk

- [ ] doc
- [ ] done
- **Current:** `pred-markets-grid` + `pred-market-detail` + `pred-trade-panel` (12 total)
- **Target:** Single predictions desk; KPI + positions as sections.
- **Files:** `components/widgets/predictions/register.ts`

### 4.8 Instructions: summary + table + detail → master-detail

- [ ] doc
- [ ] done
- **Current:** `instr-summary` + `instr-pipeline-table` + `instr-detail-panel`
- **Target:** Master-detail using shared primitive.
- **Files:** `components/widgets/instructions/register.ts`

### 4.9 Book: 6 widgets → single book-trade wizard

- [ ] doc
- [ ] done
- **Current:** hierarchy + order form + algo + record + preview + actions (6 widgets)
- **Target:** Single book-trade wizard with step flow.
- **Files:** `components/widgets/book/register.ts`

### 4.10 Markets: controls + main surfaces → single desk

- [ ] doc
- [ ] done
- **Current:** `markets-controls` + flow/book/latency/recon (9 widgets)
- **Target:** Controls + main surface merged; recon/latency can stay as satellites.
- **Files:** `components/widgets/markets/register.ts`

---

## 5. Mock Data Audit — Centralization

### 5.1 Move promote mock data to lib/

- [ ] doc
- [ ] done
- **Source files:**
  - `components/promote/mock-data.ts` (~1,685 lines — candidate strategies)
  - `components/promote/mock-fixtures.ts` (~674 lines — regime/walk-forward/features)
- **Target:** `lib/mocks/fixtures/promote-candidates.ts`, `lib/mocks/fixtures/promote-fixtures.ts`
- **Update imports** in all promote components.

### 5.2 Move sports mock data to lib/

- [ ] doc
- [ ] done
- **Source files:**
  - `components/trading/sports/mock-data.ts` (~1,556 lines — fixtures, odds, arbs, bets)
  - `components/trading/sports/mock-fixtures.ts` (~46 lines — leagues, bookmakers)
- **Target:** `lib/mocks/fixtures/sports-data.ts`, `lib/mocks/fixtures/sports-fixtures.ts`

### 5.3 Move predictions mock data to lib/

- [ ] doc
- [ ] done
- **Source files:**
  - `components/trading/predictions/mock-data.ts` (~798 lines — markets, positions, arbs, fills)
- **Target:** `lib/mocks/fixtures/predictions-data.ts`

### 5.4 Move risk mock data to lib/

- [ ] doc
- [ ] done
- **Source files:**
  - `components/widgets/risk/risk-data-context.tsx` (inline `MOCK_STRATEGIES`, `STRATEGY_RISK_MAP`, `COMPONENT_TO_RISK_TYPE` — ~50 lines)
- **Target:** `lib/mocks/fixtures/risk-data.ts`
- **Note:** Extract mock data only; leave the context provider in place.

### 5.5 Move order-book mock generator to lib/

- [ ] doc
- [ ] done
- **Source:** `components/trading/order-book.tsx` — `generateMockOrderBook()` (~50 lines)
- **Target:** `lib/mocks/generators/order-book.ts`

### 5.6 Move app/ inline fallback data to lib/

- [ ] doc
- [ ] done
- **Source files:**
  - `app/(platform)/services/trading/strategies/grid/page.tsx` — `DEFAULT_BACKTEST_RESULTS` (~~114 lines), `METRICS` (~~8 lines)
  - `app/(platform)/services/trading/terminal/page.tsx` — `DEFAULT_INSTRUMENTS` (~~14 lines), `strategyInstruments` (~~5 lines), `generateCandleData()` (~20 lines)
- **Target:** `lib/mocks/fixtures/trading-grid-data.ts`, `lib/mocks/generators/candle-data.ts`

---

## 6. Mock Data Alignment — First Pass

### 6.1 Schema consistency audit

- [ ] doc
- [ ] done
- **What:** Review all mock data for consistent field naming conventions, required fields present, types matching TypeScript interfaces. Flag mismatches.

### 6.2 ID format standardization

- [ ] doc
- [ ] done
- **What:** Check ID formats across all mock data. Ensure consistent patterns (e.g., `strat-001` vs `strategy_001` vs UUIDs). Standardize to one convention per entity type.

### 6.3 Cross-domain reference integrity

- [ ] doc
- [ ] done
- **What:** Verify that strategy IDs referenced in positions match strategy IDs in the strategy mock data. Same for client IDs, org IDs, instrument IDs across trading/promote/research mock data.

### 6.4 Realistic values audit

- [ ] doc
- [ ] done
- **What:** Check that mock numeric values (P&L, prices, volumes, Greeks, etc.) are realistic and internally consistent. Flag nonsensical values (e.g., negative volumes, Sharpe > 10, etc.).

### 6.5 Persona scoping readiness

- [ ] doc
- [ ] done
- **What:** Review whether mock data is structured to support the 4 demo personas (`internal-trader`, `client-full`, `client-data-only`, `prospect`). Check that org/client scoping can filter the data meaningfully.

---

## 7. Cross-Page Filter Cohesion (from Ikenna 2026-03-28)

### 7.1 Global scope consumption across pages

- [ ] doc
- [ ] done
- **What:** `GlobalScopeFilters` (Org/Client/Strategy) writes to `useGlobalScope` store, but most pages don't read and apply those IDs to filter their data. Selecting an org should affect what data is shown on every page the user navigates to.
- **Scope:** Audit all platform pages → identify which ones consume `useGlobalScope` → wire remaining pages to filter by selected org/client/strategy.
- **Source:** Ikenna: "When we click the filters on a high-level filter we should be able to move between pages and see how that affects things."

### 7.2 Workspace saving (filter + layout state)

- [ ] doc
- [ ] done
- **What:** "Try to make saving workspace possible as well" — the widget layout workspace saving exists, but a full "named workspace" that saves filters + layout + active tab across all pages is not yet implemented.
- **Source:** Ikenna 2026-03-28

---

## 8. Research Pipeline — Config Parity with ML (from Ikenna 2026-03-28)

### 8.1 Strategy configuration wizard (like ML)

- [ ] doc
- [ ] done
- **What:** ML pipeline has rich config UX (training config, experiments, features, registry, etc.). Strategy research has backtests/compare/results but no configuration wizard — no grid search setup, no hyperparameter config, no projected compute hours/cost, no feature selection for strategies.
- **Source:** Ikenna: "I'm not sure I see a way to actually configure and set up strategies and execution in a look and feel that's similar to ML yet."
- **Note:** PHASED OUT — needs Ikenna in loop for requirements.

### 8.2 Execution algo configuration wizard (like ML)

- [ ] doc
- [ ] done
- **What:** Execution research has backtest comparison but no algo configuration UI — no way to configure execution algo parameters, grid search over algo params, or define execution config from scratch.
- **Note:** PHASED OUT — needs Ikenna in loop.

### 8.3 ML features selection → training loop

- [ ] doc
- [ ] done
- **What:** End-to-end flow: feature selection → training config → training run → results. Currently the ML sub-routes exist but the flow between them may not be fully connected.
- **Note:** PHASED OUT — needs Ikenna in loop.

---

## 9. Strategy Instruction ↔ Execution Algo Binding (from Ikenna 2026-03-28)

### 9.1 Per-instruction algo binding UI

- [ ] doc
- [ ] done
- **What:** Currently forced to have one algo for a set of strategy instructions. Need a way to tie a specific execution algo to each individual strategy instruction. Each instruction row should have an algo selector.
- **Current state:** Strategy → "Send to Execution" links as a whole backtest. `CandidateBasket` treats strategy_config, model_version, execution_algo as parallel types — not linked. Trading Instructions page has no algo-binding controls.
- **Source:** Ikenna: "We need a way to tie an algo to a strategy instruction, which I think is already in our strategy or execution algo config."
- **Note:** PHASED OUT — backend alignment needed (algo config schema).

---

## 10. Platform Review Meeting Items — Remaining (from 2026-03-25 docs)

### 10.1 Quick View — persistent panel on every tab

- [ ] doc
- [ ] done
- **What:** Persistent Quick View panel showing critical alerts, key portfolio metrics (total P&L, margin, largest position), system health — visible regardless of which tab user is on. Shell-level component (layout, not per-tab).
- **Source:** `cross-cutting-quickview-news-liveasof.md` §1

### 10.2 News category filtering + severity

- [ ] doc
- [ ] done
- **What:** Enhance `/services/observe/news` with category filters (Sports, DeFi, TradFi → Fixed Income/Currencies/Equities/Commodities, General) and severity levels (critical/high/medium/low) with visual indicators and filters.
- **Source:** `cross-cutting-quickview-news-liveasof.md` §2

### 10.3 Accounts tab — time series + filters

- [ ] doc
- [ ] done
- **What:** Accounts page needs time-series charts (borrow pattern from positions), client/venue filtering. Currently snapshot-only.
- **Source:** `trading-accounts-risk-pnl-reconciliation.md` §1

### 10.4 Risk tab — Greeks, scenario analysis, liquidation distance

- [ ] doc
- [ ] done
- **What:** Greeks display (delta, gamma, vega, theta), Deribit-style scenario analysis (price × vol sliders with combinatorial grid, P&L at each point, liquidation indicator), liquidation distance metric.
- **Source:** `trading-accounts-risk-pnl-reconciliation.md` §3

### 10.5 Position health + quick reconcile + trade matching

- [ ] doc
- [ ] done
- **What:** Health status per position (reconciled/unreconciled/pending), sortable by health, click-to-reconcile flow, two-column trade matching deep-dive (our trades vs exchange trades with algorithmic matching).
- **Source:** `trading-accounts-risk-pnl-reconciliation.md` §4

### 10.6 P&L residual alerts

- [ ] doc
- [ ] done
- **What:** Alert threshold on unexplained P&L residual — if it exceeds X% of total P&L, fire an alert. The unexplained component already exists in the P&L breakdown; just needs the threshold + alert integration.
- **Source:** `trading-accounts-risk-pnl-reconciliation.md` §5

### 10.7 Sports fixture browser + arb grid

- [ ] doc
- [ ] done
- **What:** Visual fixture cards with team logos, historical fixture browsing with time filters, bookmaker arb grid (rows = fixtures, cols = bookmakers, highlight arb opportunities), subscription-tiered bookmaker access.
- **Source:** `trading-sports-predictions.md` §1

### 10.8 Predictions enrichment — delta overlay, historical replay, arb streaming

- [ ] doc
- [ ] done
- **What:** Options delta overlay on prediction markets, time-slider historical replay, arb streaming with fresh-arb detection, decay logic, configurable threshold, historical synthetic arb trades.
- **Source:** `trading-sports-predictions.md` §2

### 10.9 Grid search config, feature visualization, correlation analysis

- [ ] doc
- [ ] done
- **What:** UI-based grid search for backtests (fix one point = single run, grid = many runs with projected compute/cost), feature visualization (TradingView-style indicators), cross-strategy correlation analysis, strategy vs benchmark correlation.
- **Source:** `research-build-enhancements.md` (referenced in review chat decisions, doc may not exist yet)

### 10.10 Deployment UI integration

- [ ] doc
- [ ] done
- **What:** Integration with deployment-service for deployment status, readiness, and control from the UI.
- **Note:** PHASED OUT for later stage.

---

## 12. Error Handling & Resilience

### 12.1 Add error.tsx to route groups

- [ ] doc
- [ ] done
- **What:** Create `error.tsx` in `app/`, `app/(platform)/`, `app/(platform)/services/`, `app/(ops)/`, `app/(public)/`
- **Current:** ZERO error.tsx files exist across 138 pages

### 12.2 Add loading.tsx to route groups

- [ ] doc
- [ ] done
- **What:** Create `loading.tsx` with Skeleton placeholders in `app/(platform)/services/` and `app/(ops)/`
- **Current:** ZERO loading.tsx files

### 12.3 Add not-found.tsx

- [ ] doc
- [ ] done
- **What:** Create styled 404 page in `app/not-found.tsx`

### 12.4 Enforce tristate in data-fetching pages

- [ ] doc
- [ ] done
- **What:** Add loading/error/empty handling to 45 pages that have no error handling at all
- **Priority:** Trading pages first, then dashboard, research, ops

### 12.5 Extend ErrorBoundary coverage

- [ ] doc
- [ ] done
- **What:** Add ErrorBoundary to execution layout, settings layout, ops layout

---

## 13. Shared Component & Utility Consolidation

### 13.1 Delete dead code (0-importer files)

- [x] doc
- [ ] done
- **What:** Delete `components/shared/data-card.tsx`, `components/platform/batch-live-comparison-frame.tsx`, `components/platform/service-hub.tsx`
- **Current:** 3 files, 669 lines, zero importers

### 13.2 Delete duplicate component definitions

- [x] doc
- [ ] done
- **What:** Remove duplicate StatusBadge (2 extra defs), MetricCard (1 extra def), CatStatusBadge (1 extra def). Migrate the 2 consumers of research/execution/status-helpers.tsx to canonical imports.
- **Current:** 3 StatusBadge definitions, 2 MetricCard definitions, 2 CatStatusBadge definitions

### 13.3 Move `formatDateTime` from `lib/utils.ts` to `lib/utils/formatters.ts`

- [x] doc
- [ ] done
- **What:** `lib/utils.ts` should export only `cn()`. Move `formatDateTime` → `formatDate` in formatters.ts, update all importers.

### 13.4 Move StatusBadge + StatusDot to `components/shared/`

- [x] doc
- [ ] done
- **What:** Move from `components/trading/status-badge.tsx` → `components/shared/status-badge.tsx`. Update 47 importers.
- **Why:** Cross-cutting component used by trading, ops, data, research, dashboards — not trading-specific.

### 13.5 Move PageHeader, AlertRow, FilterBar to `components/shared/`

- [x] doc
- [ ] done
- **What:** Move 3 files from `components/platform/` → `components/shared/`. Update ~93 importers.

### 13.6 Move KpiStrip + widgets/shared to `components/shared/`

- [x] doc
- [ ] done
- **What:** Move 5 files from `components/widgets/shared/` → `components/shared/`. Delete empty `widgets/shared/` dir. Update ~42 importers.

### 13.7 Move custom components out of `components/ui/`

- [x] doc
- [ ] done
- **What:** Move 8 custom components (Spinner, EmptyState, ErrorBoundary, DataTable, etc.) from `components/ui/` → `components/shared/`. `components/ui/` becomes shadcn-only. Update ~121 importers.

### 13.8 Merge `empty.tsx` and `empty-state.tsx`

- [x] doc
- [ ] done
- **What:** Two empty-state components exist. Merge into one canonical `EmptyState` in `components/shared/`.

### 13.9 Create barrel + update .cursorrules

- [x] doc
- [ ] done
- **What:** Create `components/shared/index.ts` barrel exporting all shared components. Update `.cursorrules` with new architecture.

---

## Summary — Status Counts

| Section                            | Total Tasks | Docs Created | Implemented |
| ---------------------------------- | ----------- | ------------ | ----------- |
| 1. Nav & Shell Bugs                | 3           | 3            | 3           |
| 2. UI-UX Enhancements              | 7           | 0            | 0           |
| 3. Component Centralization        | 6           | 1            | 0           |
| 4. Widget Merging                  | 10          | 0            | 0           |
| 5. Mock Data Centralization        | 6           | 1            | 0           |
| 6. Mock Data Alignment             | 5           | 1            | 0           |
| 7. Cross-Page Filter Cohesion      | 2           | 0            | 0           |
| 8. Research Config Parity          | 3           | 0            | 0           |
| 9. Algo-Instruction Binding        | 1           | 0            | 0           |
| 10. Platform Review Remaining      | 10          | 0            | 0           |
| 11. Code Org (file splits)         | 6 groups    | 1            | 1           |
| 12. Error Handling                 | 5           | 1            | 0           |
| 13. Shared Component Consolidation | 9           | 1            | 0           |
| **TOTAL**                          | **73**      | **9**        | **4**       |

> **Phased out (later):** §8 (all), §9.1, §10.10, §2.6 (cross-tab widgets — depends on §4)
>
> **Task docs location:** `docs/tasks/`
>
> - `11-code-org-split-oversized-files.md` — 37 files over 900 lines, split into 6 agent groups (A-F)
> - `04-shared-components-extraction.md` — 12 parts: PageHeader, MetricCard, StatusBadge, Spinner, Tooltip, Skeleton, EmptyState, DataTable, formatters, PnL tokens, unused UI cleanup
> - `05-mock-data-centralization.md` — 10 parts: move mock data to lib/mocks/, set up MSW handlers, schema audit, persona scoping
> - `12-error-handling.md` — 5 parts: error.tsx, loading.tsx, not-found.tsx, tristate enforcement, ErrorBoundary coverage
> - `13-shared-component-consolidation.md` — 9 parts: delete dead code, remove duplicates, consolidate all shared components into `components/shared/`, make `components/ui/` shadcn-only, create barrel, update .cursorrules
