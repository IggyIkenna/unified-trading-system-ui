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

- [x] doc
- [ ] done — **PARTIAL**: `PageHelp` shows `internalNotes` for `isInternal()` users on some pages (positions, orders, DeFi, data, ML, health). Gaps: many `PAGE_DESCRIPTIONS` entries have no `internalNotes`; API endpoints not consistently documented per page.
- **What:** For internal users, enhance the existing PageHelp descriptions to also cover backend functionality, API endpoints, data sources, and operational context.
- **Source:** UI-UX-Enhancements.md § help and tips

### 2.2 Sharded components standardization

- [x] doc
- [ ] done — **PARTIAL**: `globals.css` has font tokens (`--font-sans`, `--font-mono`), card/surface/spacing tokens, and shadcn primitives are consistent. Gaps: scrollbars not centralized (split across `widget-scroll.tsx` / `scroll-area.tsx`); no unified card-type taxonomy beyond `--card` + shared `Card`; form fields follow shadcn but no explicit standardization doc.
- **What:** Centralize and standardize across the UI:
  - Horizontal and vertical scroll bars (consistent styling)
  - Font size, font color, font type (design tokens)
  - Central color templates (theme tokens in `globals.css`)
  - Multiple card types by use case (stat card, action card, info card, etc.)
  - Form fields (checkboxes, switches, dropdowns, date ranges, inputs — consistent primitives)
- **Source:** UI-UX-Enhancements.md § sharded components list

### 2.3 Widget catalogue — show ALL widgets on every page, grouped with details

- [x] doc
- [x] done (2026-03-30)
- **What:** The widget catalogue drawer (`widget-catalog-drawer.tsx`) currently only shows widgets whose `register.ts` has been side-effect imported by the current route page. All 104 widgets should be visible from every page.
- **Implemented:** `components/widgets/register-all.ts` barrel imported once in `trading/layout.tsx`; catalogue rewritten using `FinderBrowser` (2-column category+widget + detail panel + "Add to Workspace" button). `widget-catalog-finder-config.tsx` holds column defs + context stats.
- **Source:** UI-UX-Enhancements.md § Widgets Enhancements, user direction 2026-03-30

### 2.4 Workspace export/import — workspace-level (all pages), not per-tab

- [x] doc
- [x] done (2026-03-30)
- **What:** Workspace export/import currently covers only the active workspace on the current tab. It should operate at the **workspace level** — exporting/importing all pages' widget layouts in a single JSON file.
- **Implemented:** `WorkspaceProfile` type (version 2 JSON) bundles all tabs + custom panels. `exportProfile` / `importProfile` / `saveCurrentAsProfile` / `duplicateProfile` / `deleteProfile` added to workspace-store. Profile selector and profile-level export/import moved into `WorkspaceToolbar`. Import auto-renames duplicates; names are unique (case-insensitive).
- **Source:** UI-UX-Enhancements.md § Widgets Enhancements, user direction 2026-03-30

### 2.5 Add widget button + workspace toolbar on all pages

- [x] doc
- [x] done (2026-03-30) — **PARTIAL**: Toolbar renders on all 17 standard widget tabs + custom panels. Gap: `STANDALONE_PAGES` (basis-trade, defi staking, sports bet, model-portfolios, etc.) set `widgetTab=null` so no toolbar appears on those routes.
- **What:** `WorkspaceToolbar` (Add Widget, workspace select, export/import, edit mode) currently only renders on trading widget tabs. Should be available on all service pages that use `WidgetGrid`.
- **Implemented:** `WorkspaceToolbar` renders for all trading widget tabs via `useWidgetTab()` in `trading/layout.tsx`, including all 17 standard tabs and dynamically routed custom panels (`custom-<id>`). Profile selector, Add Widget, edit mode, undo, camera screenshot, layout snapshot history, and overflow menu are all present.
- **Source:** UI-UX-Enhancements.md § Widgets Enhancements

### 2.6 Cross-tab widget adding (enabled by §2.3 catalogue fix)

- [x] doc
- [x] done (2026-03-30)
- **What:** Once all widgets are visible from all pages (§2.3), users can add any widget to any tab. Widgets that need a domain-specific data provider should either auto-wrap with the provider or show a "native tab" hint. Ultimate goal: user creates their own workspace from scratch (with backend limits).
- **Implemented:** All 104 widgets are visible from every page via `register-all.ts`. The catalogue's "Add to Workspace" button calls `addWidget(tab, widgetId)` for the current tab. Singleton widgets show disabled state if already placed. Native-tab hints shown via `availableOn` badges in the detail panel.
- **Source:** UI-UX-Enhancements.md § Widgets Enhancements

### 2.7 Top navbar layout — breadcrumbs and filters

- [x] doc
- [x] done
- **What:** Option A from UI-UX-Enhancements.md:
  - Move breadcrumbs to top bar, right side of ODUM logo
  - Move Org/Client/Strategy filters to top bar, right side of lifecycle tabs (currently in breadcrumbs row)
- **Implemented:** `breadcrumbs.tsx` places crumbs + `PageHelp` on the left and `GlobalScopeFilters` (org/client/strategy) on the same row (`justify-between`), rendered in the sticky top stack via `unified-shell.tsx`.
- **Source:** UI-UX-Enhancements.md § Top NavBar Enhancements

---

## 3. Component Centralization (from codebase audit)

### 3.1 KPI metric strip primitive

- [x] doc
- [x] done
- **What:** 8+ separate `*-kpi-strip` widgets across domains (positions, orders, alerts, strategies, accounts, P&L, markets, risk) all implement similar metric-strip patterns. Extract a shared `MetricStrip` component driven by a config array `{label, value, format, trend}`.
- **Target:** `components/widgets/primitives/metric-strip.tsx`
- **Implemented:** `components/shared/kpi-strip.tsx` serves this role — `KpiStrip` with `KpiMetric` config array, `responsive`, `layoutMode` (`fluid`, `single-row`, etc.), `compact`, `fill` props. All domain KPI widgets use it. Not at the planned path but functionally complete.
- **Consumers:** All `*-kpi-strip` widgets use the shared `KpiStrip`.

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
- [ ] done — **PARTIAL**: Capabilities split across `components/shared/data-table.tsx` (TanStack, `enableColumnVisibility`, empty state) and `components/shared/data-table-widget.tsx` (`compact` density, `emptyMessage`). No single unified shell with density + empty + loading + column visibility combined. No `data-table-shell.tsx`.
- **What:** Repeated DataTable patterns across all `*-table-widget` files. Extract shared table wrapper with consistent density, empty state, column visibility, loading skeleton.
- **Target:** `components/ui/data-table-shell.tsx`

### 3.5 Quick stat card

- [ ] doc
- [ ] done — **PARTIAL**: `components/shared/metric-card.tsx` covers most of this role (label, primary, secondary, hint, tone, density variants, layout modes). No separate `quick-stat-card.tsx` but `MetricCard` is used across promote, data, reports, dashboards.
- **What:** Trading sidebar (`TradingSidebar` in layout) builds repeated Card + CardContent blocks for positions/alerts/orders/health/accounts/news with similar structure. Extract a reusable `QuickStatCard` component.
- **Target:** `components/trading/quick-stat-card.tsx`

### 3.6 Unify active-tab logic

- [x] doc
- [x] done
- **What:** `ServiceTabs` and `TradingVerticalNav` duplicate the exact same `isActive` logic (matchPrefix, exact, pathname.startsWith). Extract to a shared helper.
- **Target:** `lib/utils/nav-helpers.ts`
- **Implemented:** `lib/utils/nav-helpers.ts` exports `isServiceTabActive()` and `isPathActive()`. Both `service-tabs.tsx` and `trading-vertical-nav.tsx` import from it — no duplicate logic.
- **Consumers:** `components/shell/service-tabs.tsx`, `components/shell/trading-vertical-nav.tsx`

---

## 4. Widget Merging & Workspace Architecture

**Scope (updated 2026-03-30):** §4 covers three pillars:

1. **Widget merging** (§4.1–4.10): Consolidate small widgets into larger integrated panels where it makes sense. Not aggressive — review what remains once all widgets are visible via §2.3. Most merging is already scoped below.
2. **Default workspace** (§4.11): ✅ Done — `buildDefaultProfile()` in `components/widgets/default-profile.ts` creates a Default profile from all 17 tab presets.
3. **Workspace-level selection** (§4.12): ✅ Done — Profile selector in toolbar applies to all tabs + custom panels at once. `setActiveProfile` restores tab layouts and custom panel list together. Custom panels are saved per profile; switching profiles swaps the nav panel list.

**Additional widget page docs (not tracked in §4.1–4.10):** Audit docs also created for Accounts (04-11), Bundles (04-12), DeFi (04-13), Options (04-14), Overview (04-15), Risk (04-16), Terminal (04-17) — all DRAFT status in `docs/tasks/`. **Note:** DeFi doc (04-13) is stale — says 8 widgets but code now has 10 (added `defi-trade-history`, `defi-strategy-config`).

**Future work (not now):** Once the above is working, create additional themed workspace presets (Compact, Extensive, Trader, etc.) similar to what platforms like Binance/Deribit provide — pre-configured layouts per use case so users don't have to customize from scratch.

### 4.1 Positions: KPI + table → single widget

- [x] doc (APPROVED — `docs/tasks/04-01-positions-widget-merge.md`)
- [ ] done — **PARTIAL**: `account-balances` widget removed (deleted from register + component file). KPI strip and table still separate (2 widgets). Doc specifies further changes: responsive KPI, filter bar overhaul, split P&L columns, trades drill-down page. Code changes pending agent implementation.
- **Current:** `positions-kpi-strip` + `positions-table` (2 widgets)
- **Target:** Responsive KPI, overhauled table filters, P&L split, trades drill-down.
- **Files:** `components/widgets/positions/register.ts` and widget files

### 4.2 Orders: KPI + table → single widget

- [x] doc (APPROVED — `docs/tasks/04-02-orders-widget-merge.md`)
- [ ] done — Doc specifies: responsive KPI with 6 cards (add Rejected + Failed), filter bar overhaul (remove toggle, multi-select asset class, add side + strategy dropdowns). Still 2 widgets, no code changes yet. Pending agent implementation.
- **Current:** `orders-kpi-strip` + `orders-table` (2 widgets)
- **Target:** Responsive KPI (6 cards), overhauled table filters matching positions pattern.
- **Files:** `components/widgets/orders/register.ts`

### 4.3 Alerts: KPI + table + kill-switch → single console

- [x] doc (DRAFT — `docs/tasks/04-03-alerts-widget-merge.md`)
- [ ] done
- **Current:** `alerts-kpi-strip` + `alerts-table` + `alerts-kill-switch`
- **Target:** Single Alerts console (summary strip + feed + action column).
- **Files:** `components/widgets/alerts/register.ts`

### 4.4 Strategies: KPI + catalogue → single panel

- [x] doc (DRAFT — `docs/tasks/04-04-strategies-widget-merge.md`)
- [ ] done
- **Current:** `strategies-kpi` + `strategies-catalogue` + grid link
- **Target:** Single Strategies panel; keep grid link as CTA or inline.
- **Files:** `components/widgets/strategies/register.ts`

### 4.5 P&L: controls + charts → single widget with tabs

- [x] doc (DRAFT — `docs/tasks/04-05-pnl-widget-merge.md`)
- [ ] done
- **Current:** `pnl-controls` + waterfall/TS/client/factor (6 widgets total)
- **Target:** Single P&L widget with internal tab sections.
- **Files:** `components/widgets/pnl/register.ts`

### 4.6 Sports: fixtures + detail → master-detail

- [x] doc (DRAFT — `docs/tasks/04-06-sports-widget-merge.md`)
- [ ] done
- **Current:** `sports-fixtures` + `sports-fixture-detail`
- **Target:** Single split widget using master-detail primitive (§3.3).
- **Files:** `components/widgets/sports/register.ts`

### 4.7 Predictions: grid + detail + trade → single desk

- [x] doc (DRAFT — `docs/tasks/04-07-predictions-widget-merge.md`)
- [ ] done
- **Current:** `pred-markets-grid` + `pred-market-detail` + `pred-trade-panel` (12 total)
- **Target:** Single predictions desk; KPI + positions as sections.
- **Files:** `components/widgets/predictions/register.ts`

### 4.8 Instructions: summary + table + detail → master-detail

- [x] doc (DRAFT — `docs/tasks/04-08-instructions-widget-merge.md`)
- [ ] done
- **Current:** `instr-summary` + `instr-pipeline-table` + `instr-detail-panel`
- **Target:** Master-detail using shared primitive.
- **Files:** `components/widgets/instructions/register.ts`

### 4.9 Book: 6 widgets → single book-trade wizard

- [x] doc (DRAFT — `docs/tasks/04-09-book-widget-merge.md`)
- [ ] done
- **Current:** hierarchy + order form + algo + record + preview + actions (6 widgets)
- **Target:** Single book-trade wizard with step flow.
- **Files:** `components/widgets/book/register.ts`

### 4.10 Markets: controls + main surfaces → single desk

- [x] doc (DRAFT — `docs/tasks/04-10-markets-widget-merge.md`)
- [ ] done
- **Current:** `markets-controls` + flow/book/latency/recon (8 widgets — tracker previously said 9)
- **Target:** Controls + main surface merged; recon/latency can stay as satellites.
- **Files:** `components/widgets/markets/register.ts`

### 4.11 Default workspace — cross-tab preset with all pages

- [x] doc
- [x] done (2026-03-30)
- **What:** Create a single "Default" workspace profile that provides sensible widget layouts for ALL tabs (overview, terminal, positions, orders, alerts, strategies, pnl, risk, markets, sports, predictions, instructions, book, accounts, bundles, defi, options). Each tab gets its widgets placed according to domain group and type. Currently presets are registered per-tab in each `register.ts` — there is no concept of a cross-tab workspace profile.
- **Implemented:** `components/widgets/default-profile.ts` exports `buildDefaultProfile()` and `buildFullProfile()`, building a `WorkspaceProfile` from each tab's default preset across all 17 `ALL_WIDGET_TABS`. `WorkspaceProfile` type in `workspace-store.ts` bundles `tabs: Record<string, Workspace>` + `customPanels` + metadata.
- **Source:** User direction 2026-03-30

### 4.12 Workspace selection — apply to ALL pages, not just current tab

- [x] doc
- [x] done (2026-03-30)
- **What:** When a user selects a workspace (profile), it should apply across all pages simultaneously — not just the current tab. Currently `setActiveWorkspace(tab, id)` only updates `activeWorkspaceId[tab]`, so switching workspace on the positions page doesn't affect the orders page.
- **Implemented:** `workspace-store.ts` has `profiles`, `activeProfileId`, `setActiveProfile` which restores tab layouts and custom panel list together. Profile selector in `WorkspaceToolbar` shows profiles (not per-tab workspaces). `exportProfile`/`importProfile` operate at the profile level.
- **Source:** User direction 2026-03-30

---

## 5. Mock Data Audit — Centralization

### 5.1 Move promote mock data to lib/

- [x] doc
- [x] done
- **Source files:**
  - `components/promote/mock-data.ts` (~1,685 lines — candidate strategies)
  - `components/promote/mock-fixtures.ts` (~674 lines — regime/walk-forward/features)
- **Target:** `lib/mocks/fixtures/promote-candidates.ts`, `lib/mocks/fixtures/promote-fixtures.ts`
- **Update imports** in all promote components.

### 5.2 Move sports mock data to lib/

- [x] doc
- [x] done
- **Source files:**
  - `components/trading/sports/mock-data.ts` (~1,556 lines — fixtures, odds, arbs, bets)
  - `components/trading/sports/mock-fixtures.ts` (~46 lines — leagues, bookmakers)
- **Target:** `lib/mocks/fixtures/sports-data.ts`, `lib/mocks/fixtures/sports-fixtures.ts`

### 5.3 Move predictions mock data to lib/

- [x] doc
- [x] done
- **Source files:**
  - `components/trading/predictions/mock-data.ts` (~798 lines — markets, positions, arbs, fills)
- **Target:** `lib/mocks/fixtures/predictions-data.ts`

### 5.4 Move risk mock data to lib/

- [x] doc
- [x] done
- **Source files:**
  - `components/widgets/risk/risk-data-context.tsx` (inline `MOCK_STRATEGIES`, `STRATEGY_RISK_MAP`, `COMPONENT_TO_RISK_TYPE` — ~50 lines)
- **Target:** `lib/mocks/fixtures/risk-data.ts`
- **Note:** Extract mock data only; leave the context provider in place.

### 5.5 Move order-book mock generator to lib/

- [x] doc
- [x] done
- **Source:** `components/trading/order-book.tsx` — `generateMockOrderBook()` (~50 lines)
- **Target:** `lib/mocks/generators/order-book.ts`

### 5.6 Move app/ inline fallback data to lib/

- [x] doc
- [x] done
- **Source files:**
  - `app/(platform)/services/trading/strategies/grid/page.tsx` — `DEFAULT_BACKTEST_RESULTS` (~~114 lines), `METRICS` (~~8 lines)
  - `app/(platform)/services/trading/terminal/page.tsx` — `DEFAULT_INSTRUMENTS` (~~14 lines), `strategyInstruments` (~~5 lines), `generateCandleData()` (~20 lines)
- **Target:** `lib/mocks/fixtures/trading-grid-data.ts`, `lib/mocks/generators/candle-data.ts`

---

## 6. Mock Data Alignment — First Pass

### 6.1 Schema consistency audit

- [ ] doc
- [ ] done — **PARTIAL**: Audit material exists (`docs/audits/audit-scripts/E-mock-data.md`, `docs/audits/TIER_ZERO_AUDIT_2026_03_23.md` notes mock/API gaps). No automated mock-vs-OpenAPI validation.
- **What:** Review all mock data for consistent field naming conventions, required fields present, types matching TypeScript interfaces. Flag mismatches.

### 6.2 ID format standardization

- [ ] doc
- [ ] done — **PARTIAL**: Seed uses `strat-btc-mom-alpha` style for strategies but inconsistent elsewhere (e.g. `BASIS_TRADE` vs `basis-trade`). No formal standardization pass done.
- **What:** Check ID formats across all mock data. Ensure consistent patterns (e.g., `strat-001` vs `strategy_001` vs UUIDs). Standardize to one convention per entity type.

### 6.3 Cross-domain reference integrity

- [x] doc
- [x] done
- **What:** Verify that strategy IDs referenced in positions match strategy IDs in the strategy mock data. Same for client IDs, org IDs, instrument IDs across trading/promote/research mock data.
- **Implemented:** Seed types carry `strategyId` on positions/orders/trades/alerts; `mock-data-index.ts` resolves scope via `resolveStrategyIds` and filters by those IDs so references stay aligned.

### 6.4 Realistic values audit

- [ ] doc
- [ ] done — **PARTIAL**: Seed uses plausible ranges (sharpe, mtdReturn, aum, prices). No formal audit pass or checklist produced.
- **What:** Check that mock numeric values (P&L, prices, volumes, Greeks, etc.) are realistic and internally consistent. Flag nonsensical values (e.g., negative volumes, Sharpe > 10, etc.).

### 6.5 Persona scoping readiness

- [x] doc
- [x] done
- **What:** Review whether mock data is structured to support the 4 demo personas (`internal-trader`, `client-full`, `client-data-only`, `prospect`). Check that org/client scoping can filter the data meaningfully.
- **Implemented:** `SeedPosition` and all seed types include `orgId`/`clientId`; `mock-data-index.ts` implements org/client/strategy scoping; `global-scope-store.ts` persists org/client/strategy selection.

---

## 7. Cross-Page Filter Cohesion (from Ikenna 2026-03-28)

### 7.1 Global scope consumption across pages

- [ ] doc
- [ ] done — **PARTIAL**: `useGlobalScope` consumed in trading layout, overview, risk, terminal, and several widget data contexts (positions, orders, book, defi, kpi-strip). Not wired broadly across all `app/(platform)` pages (e.g. research, data, reports, execute pages do not filter by global scope).
- **What:** `GlobalScopeFilters` (Org/Client/Strategy) writes to `useGlobalScope` store, but most pages don't read and apply those IDs to filter their data. Selecting an org should affect what data is shown on every page the user navigates to.
- **Scope:** Audit all platform pages → identify which ones consume `useGlobalScope` → wire remaining pages to filter by selected org/client/strategy.
- **Source:** Ikenna: "When we click the filters on a high-level filter we should be able to move between pages and see how that affects things."

### 7.2 Workspace saving (filter + layout state)

- [ ] doc
- [ ] done
- **What:** A full "named workspace" that saves filters + layout + active tab across all pages is not yet implemented. The layout side is being addressed by §4.11 (workspace profiles) and §4.12 (profile-level selection). This task adds saving global scope filter state (Org/Client/Strategy) as part of the workspace profile, so restoring a profile also restores the user's filter context.
- **Source:** Ikenna 2026-03-28
- **Depends on:** §4.11, §4.12

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

- [x] doc
- [x] done
- **What:** Persistent Quick View panel showing critical alerts, key portfolio metrics (total P&L, margin, largest position), system health — visible regardless of which tab user is on. Shell-level component (layout, not per-tab).
- **Implemented:** Resizable Quick View panel with `TradingSidebar` in `trading/layout.tsx` — positions/alerts/orders/health/accounts/news stats visible on every trading tab.
- **Source:** `cross-cutting-quickview-news-liveasof.md` §1

### 10.2 News category filtering + severity

- [ ] doc
- [ ] done — **PARTIAL**: News page has severity filter (`SEVERITIES`) and source filter (`SOURCES`). Missing: category dimension (Sports, DeFi, TradFi, General) as separate filter.
- **What:** Enhance `/services/observe/news` with category filters (Sports, DeFi, TradFi → Fixed Income/Currencies/Equities/Commodities, General) and severity levels (critical/high/medium/low) with visual indicators and filters.
- **Source:** `cross-cutting-quickview-news-liveasof.md` §2

### 10.3 Accounts tab — time series + filters

- [ ] doc
- [ ] done — **PARTIAL**: Account widgets include KPIs, transfers, SAFT vesting timeline UI. Missing: equity/balance-over-time Recharts chart suite; no dedicated time-series charts under accounts widgets.
- **What:** Accounts page needs time-series charts (borrow pattern from positions), client/venue filtering. Currently snapshot-only.
- **Source:** `trading-accounts-risk-pnl-reconciliation.md` §1

### 10.4 Risk tab — Greeks, scenario analysis, liquidation distance

- [x] doc
- [x] done
- **What:** Greeks display (delta, gamma, vega, theta), Deribit-style scenario analysis (price × vol sliders with combinatorial grid, P&L at each point, liquidation indicator), liquidation distance metric.
- **Implemented:** `risk-greeks-summary-widget.tsx` (Delta/Gamma/Vega/Theta/Rho, position greeks); `risk-stress-table-widget.tsx` (stress scenarios with scenario selection).
- **Source:** `trading-accounts-risk-pnl-reconciliation.md` §3

### 10.5 Position health + quick reconcile + trade matching

- [ ] doc
- [ ] done — **PARTIAL**: `health_factor` column with styling in positions table + data context. DeFi mock context exposes `reconciliationRecords`. Missing: click-to-reconcile flow, two-column trade matching deep-dive, position health status (reconciled/unreconciled/pending).
- **What:** Health status per position (reconciled/unreconciled/pending), sortable by health, click-to-reconcile flow, two-column trade matching deep-dive (our trades vs exchange trades with algorithmic matching).
- **Source:** `trading-accounts-risk-pnl-reconciliation.md` §4

### 10.6 P&L residual alerts

- [ ] doc
- [ ] done — **PARTIAL**: `pnl-waterfall-widget.tsx` shows residual/unexplained P&L with warning styling and copy. Missing: configurable threshold alert workflow (threshold config + alert firing integration).
- **What:** Alert threshold on unexplained P&L residual — if it exceeds X% of total P&L, fire an alert. The unexplained component already exists in the P&L breakdown; just needs the threshold + alert integration.
- **Source:** `trading-accounts-risk-pnl-reconciliation.md` §5

### 10.7 Sports fixture browser + arb grid

- [x] doc
- [x] done
- **What:** Visual fixture cards with team logos, historical fixture browsing with time filters, bookmaker arb grid (rows = fixtures, cols = bookmakers, highlight arb opportunities), subscription-tiered bookmaker access.
- **Implemented:** `fixtures-tab.tsx` with `FixturesMatchCard`, grouping, `onViewArb`; `arb-grid.tsx` for bookmaker arb grid.
- **Source:** `trading-sports-predictions.md` §1

### 10.8 Predictions enrichment — delta overlay, historical replay, arb streaming

- [ ] doc
- [ ] done — **PARTIAL**: `PriceHistoryChart` (Recharts `AreaChart` on probability history) exists in `markets-tab.tsx`. Missing: replay slider, options delta overlay, arb streaming with decay logic.
- **What:** Options delta overlay on prediction markets, time-slider historical replay, arb streaming with fresh-arb detection, decay logic, configurable threshold, historical synthetic arb trades.
- **Source:** `trading-sports-predictions.md` §2

### 10.9 Grid search config, feature visualization, correlation analysis

- [x] doc
- [x] done
- **What:** UI-based grid search for backtests (fix one point = single run, grid = many runs with projected compute/cost), feature visualization (TradingView-style indicators), cross-strategy correlation analysis, strategy vs benchmark correlation.
- **Implemented:** `components/research/shared/grid-search-dialog.tsx` with usage from `strategies/page.tsx` and `execution/page.tsx` ("Grid Search" buttons).
- **Source:** `research-build-enhancements.md` (referenced in review chat decisions, doc may not exist yet)

### 10.10 Deployment UI integration

- [ ] doc
- [ ] done
- **What:** Integration with deployment-service for deployment status, readiness, and control from the UI.
- **Note:** PHASED OUT for later stage.

---

## 12. Error Handling & Resilience

### 12.1 Add error.tsx to route groups

- [x] doc
- [x] done
- **What:** Create `error.tsx` in `app/`, `app/(platform)/`, `app/(platform)/services/`, `app/(ops)/`, `app/(public)/`
- **Delivered:** 5 error.tsx files + shared `RouteErrorPage` component

### 12.2 Add loading.tsx to route groups

- [x] doc
- [x] done
- **What:** Create `loading.tsx` with Skeleton placeholders in `app/(platform)/services/` and `app/(ops)/`
- **Delivered:** 2 loading.tsx files with Skeleton layouts

### 12.3 Add not-found.tsx

- [x] doc
- [x] done
- **What:** Create styled 404 page in `app/not-found.tsx`

### 12.4 Enforce tristate in data-fetching pages

- [x] doc
- [x] done
- **What:** Add loading/error/empty handling to 45 pages that have no error handling at all
- **Delivered:** 32 pages now use ApiError, 13 use EmptyState, 16 use Spinner

### 12.5 Extend ErrorBoundary coverage

- [x] doc
- [x] done
- **What:** Add ErrorBoundary to execution layout, settings layout, ops layout
- **Delivered:** 10 service layouts now have ErrorBoundary wrappers

---

## 13. Shared Component & Utility Consolidation

**Status (2026-03-29):** Implemented — cross-domain UI is under `components/shared/`, shadcn primitives under `components/ui/`, `components/widgets/shared/` removed. See `docs/tasks/13-shared-component-consolidation.md` and `UI_STRUCTURE_MANIFEST.json` (`changes_task_13_shared_components`).

### 13.1 Delete dead code (0-importer files)

- [x] doc
- [x] done
- **What:** Delete `components/shared/data-card.tsx`, `components/platform/batch-live-comparison-frame.tsx`, `components/platform/service-hub.tsx`
- **Current:** 3 files, 669 lines, zero importers

### 13.2 Delete duplicate component definitions

- [x] doc
- [x] done
- **What:** Remove duplicate StatusBadge (2 extra defs), MetricCard (1 extra def), CatStatusBadge (1 extra def). Migrate the 2 consumers of research/execution/status-helpers.tsx to canonical imports.
- **Current:** 3 StatusBadge definitions, 2 MetricCard definitions, 2 CatStatusBadge definitions

### 13.3 Move `formatDateTime` from `lib/utils.ts` to `lib/utils/formatters.ts`

- [x] doc
- [x] done
- **What:** `lib/utils.ts` should export only `cn()`. Move `formatDateTime` → `formatDate` in formatters.ts, update all importers.

### 13.4 Move StatusBadge + StatusDot to `components/shared/`

- [x] doc
- [x] done
- **What:** Move from `components/trading/status-badge.tsx` → `components/shared/status-badge.tsx`. Update 47 importers.
- **Why:** Cross-cutting component used by trading, ops, data, research, dashboards — not trading-specific.

### 13.5 Move PageHeader, AlertRow, FilterBar to `components/shared/`

- [x] doc
- [x] done
- **What:** Move 3 files from `components/platform/` → `components/shared/`. Update ~93 importers.

### 13.6 Move KpiStrip + widgets/shared to `components/shared/`

- [x] doc
- [x] done
- **What:** Move 5 files from `components/widgets/shared/` → `components/shared/`. Delete empty `widgets/shared/` dir. Update ~42 importers.

### 13.7 Move custom components out of `components/ui/`

- [x] doc
- [x] done
- **What:** Move 8 custom components (Spinner, EmptyState, ErrorBoundary, DataTable, etc.) from `components/ui/` → `components/shared/`. `components/ui/` becomes shadcn-only. Update ~121 importers.

### 13.8 Merge `empty.tsx` and `empty-state.tsx`

- [x] doc
- [x] done
- **What:** Two empty-state components exist. Merge into one canonical `EmptyState` in `components/shared/`.

### 13.9 Create barrel + update .cursorrules

- [x] doc
- [x] done
- **What:** Create `components/shared/index.ts` barrel exporting all shared components. Update `.cursorrules` with new architecture.

---

## Summary — Status Counts (audited 2026-03-30)

| Section                            | Total  | Done   | Partial  | Not Started | Phased Out |
| ---------------------------------- | ------ | ------ | -------- | ----------- | ---------- |
| 1. Nav & Shell Bugs                | 3      | 3      | 0        | 0           | 0          |
| 2. UI-UX Enhancements              | 7      | 3      | 3        | 1 (§2.1)    | 0          |
| 3. Component Centralization        | 6      | 2      | 2        | 2           | 0          |
| 4. Widget Merging (§4.1–4.10)      | 10     | 0      | 1 (§4.1) | 9           | 0          |
| 4. Workspace (§4.11–4.12)          | 2      | 2      | 0        | 0           | 0          |
| 5. Mock Data Centralization        | 6      | 6      | 0        | 0           | 0          |
| 6. Mock Data Alignment             | 5      | 2      | 2        | 1           | 0          |
| 7. Cross-Page Filter Cohesion      | 2      | 0      | 1        | 1           | 0          |
| 8. Research Config Parity          | 3      | 0      | 0        | 0           | 3          |
| 9. Algo-Instruction Binding        | 1      | 0      | 0        | 0           | 1          |
| 10. Platform Review Remaining      | 10     | 4      | 4        | 1           | 1          |
| 12. Error Handling                 | 5      | 5      | 0        | 0           | 0          |
| 13. Shared Component Consolidation | 9      | 9      | 0        | 0           | 0          |
| **TOTAL**                          | **69** | **36** | **13**   | **15**      | **5**      |

> **Phased out (later):** §8 (all), §9.1, §10.10
>
> **Task docs location:** `docs/tasks/`
>
> - `11-code-org-split-oversized-files.md` — 37 files over 900 lines, split into 6 agent groups (A-F)
> - `04-shared-components-extraction.md` — 12 parts: PageHeader, MetricCard, StatusBadge, Spinner, Tooltip, Skeleton, EmptyState, DataTable, formatters, PnL tokens, unused UI cleanup
> - `05-mock-data-centralization.md` — 13 parts: move mock data to lib/mocks/, relocate lib/ root modules, fix ID collisions, deterministic generators, hook cleanup, schema audit, persona scoping (MSW deferred)
> - `12-error-handling.md` — 5 parts: error.tsx, loading.tsx, not-found.tsx, tristate enforcement, ErrorBoundary coverage
> - `13-shared-component-consolidation.md` — 9 parts: delete dead code, remove duplicates, consolidate all shared components into `components/shared/`, make `components/ui/` shadcn-only, create barrel, update .cursorrules
