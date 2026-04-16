# BP-2 — Widget Foundation Audit

**Date:** 2026-04-16
**Status:** FINDINGS — awaiting Harsh's review
**Scope:** All widgets under `components/widgets/` (17 domains, ~130 widgets)
**Related:** [boss_points.md](../initial-boss/boss_points.md) § BP-2, [07_trading_target_state.md](../initial-boss/07_trading_target_state.md) § 2–4

---

## Executive Summary

The widget system is **architecturally sound** — consistent registration, clean typing, good grid engine, working persistence. But it has **three structural gaps** that will cause pain at scale: no error boundaries, no loading state standard, and a split between context-driven widgets (good) and mock-importing widgets (bad). Four strategy widgets are completely disconnected from the data layer.

---

## 1. Widget Registry

**Files:** `components/widgets/widget-registry.ts` (70 lines), `register-all.ts` (22 lines)

**Mechanism:** Imperative side-effect. Each domain has a `register.ts` that calls `registerWidget(def)` on import. `register-all.ts` is a barrel importing all 17 domain registers. Called once at trading layout mount → populates a `Map<string, WidgetDefinition>`.

**`WidgetDefinition` fields:**

| Field                   | Type                                  | Purpose                  |
| ----------------------- | ------------------------------------- | ------------------------ |
| `id`                    | `string`                              | Unique widget ID         |
| `label`                 | `string`                              | Display name             |
| `description`           | `string`                              | Catalogue description    |
| `icon`                  | `LucideIcon`                          | Catalogue icon           |
| `category`              | `string`                              | Grouping in catalogue UI |
| `minW` / `minH`         | `number`                              | Min grid cells           |
| `maxW` / `maxH`         | `number?`                             | Optional max             |
| `defaultW` / `defaultH` | `number`                              | Initial placement size   |
| `requiredEntitlements`  | `string[]`                            | Entitlement gate         |
| `availableOn`           | `string[]`                            | Which tabs can host it   |
| `singleton`             | `boolean?`                            | Prevents duplicates      |
| `component`             | `ComponentType<WidgetComponentProps>` | React component          |

**`WidgetComponentProps`:** `{ instanceId: string; config?: Record<string, unknown> }`

**Assessment:** Clean, well-typed, no issues. The registry is solid.

---

## 2. Widget Count by Domain

| Domain       | Widgets  | Data Context Lines | Notes                                   |
| ------------ | -------- | ------------------ | --------------------------------------- |
| DeFi         | 16–17    | 553                | 7+ widgets also import mocks directly   |
| Risk         | 13       | 173                | 1 widget imports mocks directly         |
| Predictions  | 10–11    | 510                |                                         |
| Sports       | 9        | 215                | 3 widgets import mocks directly         |
| Options      | 9        | 413                |                                         |
| Strategies   | 7–9      | 241                | 4 widgets have NO context — inline mock |
| Markets      | 8        | 154                |                                         |
| Terminal     | 8        | 69                 |                                         |
| Accounts     | 6        | 169                | 1 widget imports mocks directly         |
| Book         | 6        | 573                |                                         |
| PnL          | 4–6      | 311                | 2 dead files (see § 8)                  |
| Bundles      | 4–5      | 218                |                                         |
| Overview     | 4–5      | 65                 | 1 widget imports mocks directly         |
| Instructions | 3        | 187                |                                         |
| Alerts       | 3        | 386                |                                         |
| Positions    | 2        | 759                |                                         |
| Orders       | 2        | 543                |                                         |
| **Total**    | **~130** | **5,539**          |                                         |

---

## 3. Base / Shared Components (Composition, Not Inheritance)

There are **no class-based base widgets**. The extension pattern is **composition via shared shell components**:

| Component            | File                                       | Used by              | Purpose                                                 |
| -------------------- | ------------------------------------------ | -------------------- | ------------------------------------------------------- |
| `TableWidget`        | `components/shared/table-widget.tsx`       | ~17 widgets          | TanStack Table wrapper with search, filters, export     |
| `KpiSummaryWidget`   | `components/shared/kpi-summary-widget.tsx` | ~8 widgets           | KPI strip with layout mode picker, localStorage persist |
| `WidgetScroll`       | `components/shared/widget-scroll.tsx`      | Universal            | Scroll wrapper used by `WidgetWrapper`                  |
| `LiveFeedWidget`     | `components/shared/live-feed-widget.tsx`   | Terminal/Markets     | Live-stream display                                     |
| `KpiStrip`           | `components/shared/kpi-strip.tsx`          | Via KpiSummaryWidget | Metrics bar (low-level)                                 |
| `CollapsibleSection` | `components/shared/`                       | Various              | Foldable content block                                  |
| `FilterBar`          | `components/shared/`                       | Various              | Shared filter UI                                        |

**Assessment:** The composition approach is correct — not a problem. But there is no shared base for chart widgets or form widgets. Charts (recharts) and forms are built bespoke per widget.

---

## 4. Data Flow Pattern

**The canonical pattern (good):**

```
Domain DataContext (provider) → use*Data() hook → Widget → Shared shell (TableWidget, KpiSummaryWidget)
```

All 17 domains have a `*-data-context.tsx`. Total: 5,539 lines of context code.

**Every widget receives exactly `WidgetComponentProps` (`instanceId`, `config?`).** No widget fetches data via inline `useQuery` or direct API calls. This is consistent and correct.

**Three providers are NOT in `AllWidgetProviders`:** `OverviewDataProvider`, `TerminalDataProvider`, `RiskDataProvider` — they require a `value` prop. Widgets from these domains placed on other tabs hit `WidgetContextGuard` and show a placeholder. This is known and by design.

---

## 5. Finding: Widgets That Bypass the Context Layer

These widgets import mock data directly from `lib/mocks/` alongside (or instead of) their domain context. This creates a mixed data-sourcing pattern that will break when real APIs arrive.

### Fully disconnected (no context at all — inline mocks):

| Widget                                           | Mock pattern                           |
| ------------------------------------------------ | -------------------------------------- |
| `strategies/active-lp-dashboard-widget.tsx:19`   | `const MOCK_LP_POSITIONS`              |
| `strategies/liquidation-monitor-widget.tsx:19`   | `const MOCK_POSITIONS`                 |
| `strategies/lending-arb-dashboard-widget.tsx:17` | `const MOCK_DATA`                      |
| `strategies/commodity-regime-widget.tsx:29,37`   | `const MOCK_FACTORS`, `MOCK_POSITIONS` |

### Mixed (use context AND import mocks):

| Widget                                 | Direct mock imports                                                     |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `defi/defi-swap-widget.tsx`            | `generateSwapRoute`, `getMockPrice`, `MOCK_CHAIN_PORTFOLIOS`            |
| `defi/defi-transfer-widget.tsx`        | `MOCK_CHAIN_PORTFOLIOS`, `getMockPrice`                                 |
| `defi/defi-wallet-summary-widget.tsx`  | `MOCK_CHAIN_PORTFOLIOS`                                                 |
| `defi/defi-basis-trade-widget.tsx`     | `BASIS_TRADE_MOCK_DATA`                                                 |
| `defi/defi-lending-widget.tsx`         | `calculateHealthFactorDelta`, `getAssetParams`                          |
| `defi/defi-funding-matrix-widget.tsx`  | `FUNDING_RATE_VENUES`, `FUNDING_RATE_FLOOR`                             |
| `defi/defi-flash-loans-widget.tsx`     | `SWAP_TOKENS`                                                           |
| `defi/defi-yield-chart-widget.tsx`     | mock generators                                                         |
| `risk/risk-kpi-strip-widget.tsx`       | `getFilledDefiOrders`, `MOCK_PORTFOLIO_DELTA`, `STRATEGY_RISK_PROFILES` |
| `overview/kpi-strip-widget.tsx`        | `MOCK_PORTFOLIO_DELTA`, `STRATEGY_RISK_PROFILES`                        |
| `accounts/saft-portfolio-widget.tsx`   | `MOCK_SAFTS`                                                            |
| `sports/sports-standings-widget.tsx`   | `MOCK_STANDINGS`                                                        |
| `sports/sports-clv-widget.tsx`         | `MOCK_CLV_RECORDS`                                                      |
| `sports/sports-predictions-widget.tsx` | `MOCK_FIXTURES`, `MOCK_PREDICTIONS`                                     |
| `sports/sports-ml-status-widget.tsx`   | `MOCK_MODEL_FAMILIES`, `MOCK_FEATURE_FRESHNESS`                         |

---

## 6. Finding: No Error Boundaries in Any Widget

**Zero widgets** have error boundary wrappers. A single widget crash can take down the entire grid.

The trading layout has one `ErrorBoundary` around `children` at the layout level (`app/(platform)/services/trading/layout.tsx`), but no per-widget isolation exists.

**Risk:** An agent edits one widget's data context, a runtime error propagates, and the entire trading tab goes white. This is exactly the BP-2 concern.

---

## 7. Finding: No Standard Loading State

- **13 widgets** have loading states — all via `TableWidget`'s built-in `isLoading` prop
- **~117 widgets** have no loading state handling
- Chart widgets, form widgets, KPI widgets — none handle loading
- No shared `WidgetSkeleton` or `WidgetLoading` component exists

---

## 8. Finding: Dead Widget Files

| File                               | Lines | Status                           |
| ---------------------------------- | ----- | -------------------------------- |
| `pnl/pnl-report-button-widget.tsx` | 3     | Comment: "can be safely deleted" |
| `pnl/pnl-controls-widget.tsx`      | 4     | Comment: "can be safely deleted" |

These should be deleted and their registrations removed.

---

## 9. Finding: Size Outliers

| File                                         | Lines | Concern                           |
| -------------------------------------------- | ----- | --------------------------------- |
| `defi/defi-strategy-config-widget.tsx`       | 1,157 | Uses `Math.random()` at line 1146 |
| `strategies/cefi-strategy-config-widget.tsx` | 567   |                                   |
| `bundles/defi-atomic-bundle-widget.tsx`      | 472   |                                   |
| `alerts/alerts-table-widget.tsx`             | 448   |                                   |
| `positions/positions-table-widget.tsx`       | 439   |                                   |
| `accounts/accounts-transfer-widget.tsx`      | 426   |                                   |
| `risk/risk-kpi-strip-widget.tsx`             | 421   |                                   |

These are large but not necessarily wrong — config widgets (DeFi, CeFi) are genuinely complex. Worth reviewing for decomposition opportunities.

---

## 10. Widget Grid System

**Engine:** `react-grid-layout` (`ResponsiveGridLayout`)
**File:** `components/widgets/widget-grid.tsx` (150 lines)

| Property       | Value                 |
| -------------- | --------------------- |
| Row height     | 80px                  |
| Columns        | 12 (all breakpoints)  |
| Margin         | [2, 2]px              |
| Resize handles | `se`, `e`, `s`        |
| Drag handle    | `.widget-drag-handle` |

**Persistence stack:**

| Layer     | Mechanism                                       |
| --------- | ----------------------------------------------- |
| Local     | Zustand `persist` → `localStorage`              |
| Remote    | Firestore `workspaces/{userId}`, 500ms debounce |
| Schema    | `version: 2` with migration chain `v0→v1→v2`    |
| Undo      | In-memory stack (max 30) per tab                |
| Snapshots | Named snapshots (max 20/workspace), persisted   |
| Profiles  | `WorkspaceProfile` bundles per-tab layouts      |

**Assessment:** Grid system is solid and well-engineered. No concerns.

---

## 11. Type Safety

**Zero `any` types or `@ts-ignore` found in widget files.** Clean.

---

## Summary: What's Good vs What Needs Work

### Good (leave alone)

- Widget registry — clean, well-typed, extensible
- `WidgetDefinition` / `WidgetComponentProps` contract
- Composition via shared shells (`TableWidget`, `KpiSummaryWidget`)
- Data context pattern — 17 domains, consistent hook-based access
- Grid engine + persistence stack
- Type safety — zero `any`/`@ts-ignore`
- Entitlement gating on `WidgetDefinition`

### Needs Work (ordered by impact)

| #   | Issue                                                 | Scope                                                 | Impact                                   |
| --- | ----------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------- |
| 1   | No per-widget error boundaries                        | All 130 widgets                                       | One crash kills entire tab               |
| 2   | 4 strategy widgets fully disconnected from data layer | `strategies/`                                         | Will never show real data                |
| 3   | 15+ widgets import mocks directly (bypassing context) | `defi/`, `sports/`, `risk/`, `overview/`, `accounts/` | Mixed data sourcing breaks on API switch |
| 4   | No standard loading state outside TableWidget         | ~117 widgets                                          | Flash of empty content                   |
| 5   | 2 dead widget files in `pnl/`                         | `pnl/`                                                | Clutter                                  |
| 6   | No shared base for chart widgets                      | Chart widgets across domains                          | Each reimplements recharts boilerplate   |
| 7   | `defi-strategy-config-widget.tsx` at 1,157 lines      | Single file                                           | Maintenance burden                       |
