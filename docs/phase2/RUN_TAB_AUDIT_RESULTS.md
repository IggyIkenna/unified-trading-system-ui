# Phase 2d: Run Lifecycle Tab — Deep Audit Results

**Audit date:** 2026-03-21
**Auditor:** Claude (automated)
**Repo:** unified-trading-system-ui
**Plan:** `unified-trading-pm/plans/active/ui_phase2_run_tab_audit_2026_03_21.plan.md`

---

## Executive Summary

| Category | Total Checks | PASS | ISSUE | INFO |
| -------- | ------------ | ---- | ----- | ---- |
| A. Component Inventory — Trading | 6 | 2 | 3 | 1 |
| B. Component Inventory — Execution | 5 | 0 | 4 | 1 |
| C. Navigation & Routing | 5 | 1 | 3 | 1 |
| D. Data Wiring | 4 | 0 | 4 | 0 |
| E. UX Audit | 4 | 0 | 4 | 0 |
| F. Cross-Reference Markers | 4 | 0 | 3 | 1 |
| **Total** | **28** | **3** | **21** | **4** |

**Severity breakdown:**

| Severity | Count | Description |
| ----------- | ----- | --------------------------------------------------------- |
| P0-blocking | 1 | Execution orphan pages use broken link paths |
| P1-fix | 10 | Must fix — entitlement gaps, missing states, duplication |
| P2-improve | 8 | Should fix — placeholder pages, missing routeMappings |
| P3-cosmetic | 2 | Nice to fix — legacy labels, minor UX polish |

---

## Section A: Component Inventory — Trading (6 tasks)

### A1. Terminal (`/service/trading/overview`)

```
Task: A1
Status: PASS
Severity: —
```

**Component:** `TradingPage` (default export)
**Lines:** ~560
**Source:** `app/(platform)/service/trading/overview/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `OrderBookWithDepth`, `OrderBook`, `DepthChart`, `generateMockOrderBook` (from `@/components/trading/order-book`); `CandlestickChart` (from `@/components/trading/candlestick-chart`); `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Button`, `Badge`, `Tabs`, `Select`, `Input` (from `@/components/ui/*`); recharts (`AreaChart`, `BarChart`, etc.) |
| **Hooks** | `useGlobalScope`, `useState`, `useEffect`, `useMemo`, `useRef` |
| **Data source** | Flat mock from `lib/trading-data` (`STRATEGIES`, `ACCOUNTS`, `getFilteredStrategies`, `getAccountsForClient`, `CLIENTS`, `ORGANIZATIONS`); inline instruments array, `generateCandleData()`, `generateMockOrderBook()` |
| **Scope/auth** | Uses `useGlobalScope` (org/client/strategy filtering); `isContextComplete` requires org + client + account |
| **Loading/error/empty** | "Loading trades..." when `!isClient` (SSR guard); "No trades yet" for empty own-trades; no error state |
| **Real-time** | `setInterval` (500ms) for live price ticks and recent-trade animation |
| **React Query** | No |

**Finding:** Most complex trading page. Well-structured with order book, candlestick chart, order entry panel, and P&L readout. Uses `useGlobalScope` for multi-level filtering. Real-time simulation via `setInterval` — acceptable for mock phase. Strong alignment with trader workflow: strategy-instrument mapping, account context enforcement, live price ticks, market trades + own trades feed. Missing: open orders sidebar, position summary for selected instrument, running P&L for selected strategy, and backtest price overlay for stress-testing.

---

### A2. Positions (`/service/trading/positions`)

```
Task: A2
Status: PASS
Severity: —
```

**Component:** `PositionsPage` → `PositionsPageContent` (inner) → `PositionDetail` (collapsible)
**Lines:** ~620
**Source:** `app/(platform)/service/trading/positions/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `ExecutionModeToggle`, `ExecutionModeIndicator` (from `@/components/trading/execution-mode-toggle`); `Card`, `Table`, `Select`, `Input`, `Collapsible`, `Progress`, `Badge`, `Button` (from `@/components/ui/*`) |
| **Hooks** | `useSearchParams`, `useExecutionMode`, `useState`, `useEffect`, `useMemo` |
| **Data source** | `getAllPositions()`, `getStrategyById()` from `lib/strategy-registry`; `formatCurrency`, `CLOB_VENUES`, `ZERO_ALPHA_VENUES` from `lib/reference-data`; inline `accountBalances` |
| **Scope/auth** | None — no entitlement or org scoping |
| **Loading/error/empty** | `Suspense` fallback "Loading positions..."; "No positions match your filters" for empty filter results |
| **React Query** | No |

**Finding:** Strongest page in the Run tab for trader workflow. Comprehensive position table with type-specific detail cards (LP: tick range/IL, Lending: health factor/APY, Perp: liquidation price/funding, Staking: rewards/APY). Excellent filtering (5 dimensions). `Suspense` for loading — good pattern. Missing: position sorting (by P&L, notional, liquidation distance), live updating, "close position" action, position-level live-vs-batch comparison, no auth/entitlement scoping.

---

### A3. Orders (`/service/trading/orders`)

```
Task: A3
Status: ISSUE
Severity: P2-improve
```

**Component:** `OrdersPage` (default export)
**Lines:** 25
**Source:** `app/(platform)/service/trading/orders/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`; `ArrowUpDown` icon |
| **Hooks** | None |
| **Data source** | Static "Coming Soon" placeholder |
| **Scope/auth** | None |
| **Loading/error/empty** | None — entirely static |
| **React Query** | No |

**Finding:** Placeholder page with "Coming Soon" badge. No functional content. Planned feature: order blotter with real-time status, routing details, fill analysis, modification history, algo execution progress. **React Query hooks exist** (`hooks/api/use-orders.ts` exports `useOrders`, `useAlgos`, `useVenues`, `useAlgoBacktests`) but are NOT wired into this page.

**Recommendation:** Wire `useOrders()` hook into this page to show at minimum a static table of mock order data via MSW. The hook infrastructure is ready.

---

### A4. Accounts (`/service/trading/accounts`)

```
Task: A4
Status: ISSUE
Severity: P2-improve
```

**Component:** `AccountsPage` (default export)
**Lines:** 25
**Source:** `app/(platform)/service/trading/accounts/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`; `Wallet` icon |
| **Hooks** | None |
| **Data source** | Static "Coming Soon" placeholder |
| **Scope/auth** | None |
| **Loading/error/empty** | None — entirely static |
| **React Query** | No |

**Finding:** Placeholder page with "Coming Soon" badge. No functional content. Planned feature: per-venue account cards with balance, margin, API key health, account-strategy matrix. No React Query hook exists for accounts specifically (positions hook has `useBalances()` which partially covers this).

**Recommendation:** Create `hooks/api/use-accounts.ts` and wire into this page.

---

### A5. Markets (`/service/trading/markets`)

```
Task: A5
Status: ISSUE
Severity: P1-fix
```

**Component:** Default export (unnamed in source)
**Lines:** ~2,111
**Source:** `app/(platform)/service/trading/markets/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `PnLValue`, `PnLChange`, `EntityLink` (from `@/components/trading/*`); `Card`, `Button`, `Tabs`, `Badge`, `Select`, `Input` (from `@/components/ui/*`); recharts |
| **Hooks** | `useGlobalScope`, `useState`, `useMemo` |
| **Data source** | `ORGANIZATIONS`, `CLIENTS`, `STRATEGIES` from `lib/trading-data`; `PNL_FACTORS`, `SERVICES` from `lib/reference-data`; large volume of inline mock generators (`generateTimeSeriesData`, `generatePnLComponents`, `generateStrategyBreakdown`, `generateFactorTimeSeries`, `generateClientPnL`, `generateLiveBookUpdates`, `generateOrderFlowData`) |
| **Scope/auth** | `useGlobalScope` for filtering |
| **Loading/error/empty** | Not verified (file too large) |
| **React Query** | No |

**Finding:** Despite the "Markets" label, this is actually a **P&L Attribution / Analytics** page — and the content is excellent for a trader. It contains structural P&L decomposition (realized vs unrealized), factor-level P&L (funding, carry, basis, delta, gamma, vega, theta, slippage, fees), client P&L breakdown, live book updates, and order flow data. This is highly valuable for the trader's end-of-day P&L review and factor analysis workflow.

**The problem is the label, not the content.** A trader clicking "Markets" expects instrument prices and market overview, not P&L attribution. The tab should be renamed to "P&L" or "Analytics".

**Code quality issues:** At 2,111 lines it far exceeds the 900-line limit. This file is **byte-identical** to `app/(platform)/service/data/markets/page.tsx` — full code duplication (see F1).

**Recommendation:**
1. Rename tab label from "Markets" to "P&L" in TRADING_TABS
2. Extract shared P&L/analytics components to `components/trading/pnl-analytics/`
3. Split the 2,111-line file into focused sub-components
4. Deduplicate with `/service/data/markets` (see F1)

---

### A6. Dashboard / Command Center (`/dashboard`)

```
Task: A6
Status: INFO
Severity: —
```

**Component:** `OverviewPage` (default export)
**Lines:** ~475
**Source:** `app/(platform)/dashboard/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `KPICard`, `AlertsFeed`, `PnLAttributionPanel`, `HealthStatusGrid`, `LimitBar`, `LiveBatchComparison`, `ValueFormatToggle`, `useValueFormat`, `InterventionControls`, `ScopeSummary`, `MarginUtilization`, `DriftAnalysisPanel`, `KillSwitchPanel`, `CircuitBreakerGrid`, `StrategyAuditTrail` (from `@/components/trading/*`); `Card`, `Table`, `Tabs`, `Badge`, `Button`, `Tooltip` (from `@/components/ui/*`) |
| **Hooks** | `useGlobalScope`, `useState`, `useMemo`, `useCallback`, `useValueFormat` |
| **Data source** | `ORGANIZATIONS`, `CLIENTS`, `STRATEGIES`, `getFilteredStrategies`, `getAggregatedPnL`, `getAggregatedTimeSeries`, `getStrategyPerformance`, `getFilteredServices`, `getFilteredAlerts` from `lib/trading-data`; inline `mockAlerts`, `venueMargins`, `allMockServices` |
| **Scope/auth** | `useGlobalScope` for org/client/strategy scoping |
| **Loading/error/empty** | None |
| **React Query** | No |

**Finding:** The strongest page in the Run lifecycle and the crown jewel for trader workflow. 15+ trading components covering every aspect of the trader's morning check. Key highlights:

- **`LiveBatchComparison`** with 4 view modes (live/batch/split/delta) directly serves the backtest-vs-live comparison use case for alpha decay analysis
- **`DriftAnalysisPanel`** with P&L drift %, exposure drift %, NAV drift % and configurable thresholds — exactly what's needed for strategy stress-testing
- **`KillSwitchPanel` + `CircuitBreakerGrid`** — emergency controls accessible from the dashboard
- **`PnLAttributionPanel`** — factor-level P&L waterfall (funding, carry, basis, delta, greeks, slippage, fees, residual)
- **`MarginUtilization`** — per-venue margin with trend and margin call distance

Scope filtering via `useGlobalScope` means all data cascades when trader narrows to a specific org/client/strategy. Missing: drawdown chart (max drawdown, current drawdown), per-strategy alpha decay trend over time, loading/error states. Not in any `*_TABS` — standalone page via lifecycle nav. Correct by design.

---

## Section B: Component Inventory — Execution (5 tasks)

### B1. Analytics (`/service/execution/overview`)

```
Task: B1
Status: INFO
Severity: —
```

**Component:** `ExecutionOverviewPage` (default export)
**Lines:** ~330
**Source:** `app/(platform)/service/execution/overview/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `ExecutionNav` (from `@/components/execution-platform/execution-nav`); `Card`, `Table`, `Badge`, `Progress` (from `@/components/ui/*`) |
| **Hooks** | None |
| **Data source** | `MOCK_VENUES`, `MOCK_RECENT_ORDERS`, `MOCK_EXECUTION_METRICS`, `MOCK_EXECUTION_ALGOS` from `lib/execution-platform-mock-data` |
| **Scope/auth** | None |
| **Loading/error/empty** | None |
| **React Query** | No |

**Finding:** Renders `ExecutionNav` (a secondary in-page nav) above the content. This creates **two navigation layers within the execution layout**: Row 2 EXECUTION_TABS (from layout.tsx) + ExecutionNav inside the page. ExecutionNav includes links to `candidates` and `handoff` (the orphan pages). All execution pages render this secondary nav. No auth, no loading states.

---

### B2. Algos (`/service/execution/algos`)

```
Task: B2
Status: ISSUE
Severity: P2-improve
```

**Component:** `ExecutionAlgosPage` (default export)
**Lines:** ~305
**Source:** `app/(platform)/service/execution/algos/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `ExecutionNav`; `Card`, `Table`, `Badge`, `Button`, `Checkbox`, `Tabs` |
| **Hooks** | `useState` |
| **Data source** | `MOCK_EXECUTION_ALGOS`, `MOCK_ALGO_BACKTESTS` from `lib/execution-platform-mock-data` |
| **Scope/auth** | None |
| **Loading/error/empty** | None |
| **React Query** | No |

**Finding:** Functional page with algo comparison table and backtest results. Missing loading/error/empty states. No auth scoping. routeMappings marks this as `primaryStage: "build"` — which means lifecycle nav will highlight Build, not Run, when on this page.

**Recommendation:** Verify if `primaryStage: "build"` is intentional for `/service/execution/algos`. If this is the live algo dashboard (not research), it should be `primaryStage: "run"`.

---

### B3. Venues (`/service/execution/venues`)

```
Task: B3
Status: ISSUE
Severity: P2-improve
```

**Component:** `ExecutionVenuesPage` (default export)
**Lines:** ~310
**Source:** `app/(platform)/service/execution/venues/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `ExecutionNav`; `Card`, `Table`, `Badge`, `Button`, `Select`, `Progress` |
| **Hooks** | `useState` |
| **Data source** | `MOCK_VENUES` from `lib/execution-platform-mock-data`; inline `VENUE_MATRIX` |
| **Scope/auth** | None |
| **Loading/error/empty** | None |
| **React Query** | No |

**Finding:** Venue health matrix and connectivity status. Same issues as B2: no loading/error states, no auth. routeMappings: `primaryStage: "build"` — lifecycle nav highlights Build.

---

### B4. TCA (`/service/execution/tca`)

```
Task: B4
Status: ISSUE
Severity: P2-improve
```

**Component:** `ExecutionTCAPage` (default export)
**Lines:** ~315
**Source:** `app/(platform)/service/execution/tca/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `ExecutionNav`; `Card`, `Table`, `Badge`, `Button`, `Select`; recharts |
| **Hooks** | `useState` |
| **Data source** | `MOCK_RECENT_ORDERS` from `lib/execution-platform-mock-data`; inline `TCA_BREAKDOWN`, `EXECUTION_TIMELINE`, `SLIPPAGE_DISTRIBUTION` |
| **Scope/auth** | None |
| **Loading/error/empty** | None |
| **React Query** | No |

**Finding:** Transaction Cost Analysis page with slippage charts, timeline, and breakdown. routeMappings: `primaryStage: "observe"` — lifecycle nav highlights Observe, not Run. Same structural issues.

---

### B5. Benchmarks (`/service/execution/benchmarks`)

```
Task: B5
Status: ISSUE
Severity: P2-improve
```

**Component:** `ExecutionBenchmarksPage` (default export)
**Lines:** ~330
**Source:** `app/(platform)/service/execution/benchmarks/page.tsx`

| Category | Detail |
| -------- | ------ |
| **Imported components** | `ExecutionNav`; `Card`, `Table`, `Badge`, `Button`, `Select`, `Tabs` |
| **Hooks** | `useState` |
| **Data source** | Inline `BENCHMARKS`, `mockBenchmarkPerformance`, `generateSlippageTimeSeries()` |
| **Scope/auth** | None |
| **Loading/error/empty** | None |
| **React Query** | No |

**Finding:** Benchmark comparison page. NOT in routeMappings at all — lifecycle nav has no mapping for this route. Research path `/service/research/execution/benchmarks` IS mapped (`primaryStage: "build"`), but `/service/execution/benchmarks` is unmapped.

---

## Section C: Navigation & Routing (5 tasks)

### C1. Tab active state — TRADING_TABS

```
Task: C1
Status: ISSUE
Severity: P1-fix
```

**Active state logic** (from `service-tabs.tsx` line 42–43):

```typescript
const matchPath = tab.matchPrefix || tab.href
const isActive = pathname === tab.href || pathname.startsWith(matchPath + "/")
```

| Tab | href | matchPrefix | Active when... | Correct? |
| --- | ---- | ----------- | -------------- | -------- |
| Terminal | `/service/trading/overview` | — | `pathname === "/service/trading/overview"` | ✓ |
| Positions | `/service/trading/positions` | — | `pathname === "/service/trading/positions"` | ✓ |
| Orders | `/service/trading/orders` | — | `pathname === "/service/trading/orders"` | ✓ |
| Execution Analytics | `/service/execution/overview` | `/service/execution` | `pathname === "/service/execution/overview"` OR `pathname.startsWith("/service/execution/")` | ⚠ See below |
| Accounts | `/service/trading/accounts` | — | `pathname === "/service/trading/accounts"` | ✓ |
| Markets | `/service/trading/markets` | — | `pathname === "/service/trading/markets"` | ✓ |

**Issue with "Execution Analytics" tab:** The `matchPrefix: "/service/execution"` means this tab would show as active for ALL `/service/execution/*` routes. But when you navigate to `/service/execution/overview`, the layout switches from `trading/layout.tsx` to `execution/layout.tsx` — so TRADING_TABS is no longer rendered. The matchPrefix is effectively dead code because it can never fire in the context of TRADING_TABS (the user is already in the execution layout).

**However:** If user navigates to `/service/execution/overview` via the browser address bar while viewing a trading page, the framework renders execution layout first, so the matchPrefix logic in TRADING_TABS never executes. This is architecturally correct but confusing in the tab definition.

**Finding:** Tab active states work correctly for 5 of 6 tabs. The "Execution Analytics" matchPrefix is technically unreachable in practice because layout switching happens before tab rendering.

---

### C2. Tab active state — EXECUTION_TABS

```
Task: C2
Status: PASS
Severity: —
```

| Tab | href | Active when... | Correct? |
| --- | ---- | -------------- | -------- |
| Analytics | `/service/execution/overview` | exact match | ✓ |
| Algos | `/service/execution/algos` | exact match | ✓ |
| Venues | `/service/execution/venues` | exact match | ✓ |
| TCA | `/service/execution/tca` | exact match | ✓ |
| Benchmarks | `/service/execution/benchmarks` | exact match | ✓ |

**Finding:** All 5 tabs highlight correctly. No matchPrefix used, so no ambiguity.

---

### C3. Layout switching (Trading → Execution)

```
Task: C3
Status: ISSUE
Severity: P1-fix
```

**Confirmed behavior (Phase 1 SR2):**

1. User is on `/service/trading/overview` → sees TRADING_TABS (6 tabs)
2. User clicks "Execution Analytics" tab → navigates to `/service/execution/overview`
3. Next.js App Router renders `execution/layout.tsx` instead of `trading/layout.tsx`
4. Row 2 tab bar switches from TRADING_TABS (6 tabs) to EXECUTION_TABS (5 tabs)
5. User sees completely different tab set with no context of where they came from

**Navigation asymmetry:**

- TRADING_TABS → has "Execution Analytics" entry pointing into execution layout
- EXECUTION_TABS → has NO "Back to Trading" entry or breadcrumb
- Browser back button works but is not discoverable

**Additional finding:** All 5 execution pages render `ExecutionNav` — a secondary in-page navigation bar — creating a **double navigation layer** (EXECUTION_TABS + ExecutionNav). The ExecutionNav links use wrong paths (see F3).

**Recommendation:**
1. Add a "← Trading" breadcrumb or back-link in the execution layout when referrer was trading
2. OR merge execution into trading as a sub-section (combined tab bar)
3. Remove the redundant `ExecutionNav` — it duplicates EXECUTION_TABS with different labels and broken links

---

### C4. Lifecycle nav highlight

```
Task: C4
Status: ISSUE
Severity: P1-fix
```

**routeMappings coverage for Run lifecycle routes:**

| Route | In routeMappings? | primaryStage | Lifecycle nav highlights... |
| ----- | ----------------- | ------------ | ------------------------- |
| `/dashboard` | ✓ | run | Run ✓ |
| `/service/trading/overview` | ✓ | run | Run ✓ |
| `/service/trading/positions` | ✓ | run (secondary: observe) | Run ✓ |
| `/service/trading/orders` | ✗ MISSING | — | **Nothing** (getRouteMapping returns undefined) |
| `/service/trading/accounts` | ✗ MISSING | — | **Nothing** |
| `/service/trading/markets` | ✗ MISSING | — | **Nothing** |
| `/service/execution/overview` | ✓ | run | Run ✓ |
| `/service/execution/algos` | ✓ | build | **Build** (not Run) |
| `/service/execution/venues` | ✓ | build | **Build** (not Run) |
| `/service/execution/tca` | ✓ | observe | **Observe** (not Run) |
| `/service/execution/benchmarks` | ✗ MISSING | — | **Nothing** |

**Issues found:**

1. **3 trading routes missing from routeMappings** — `/service/trading/orders`, `/service/trading/accounts`, `/service/trading/markets` have no mapping. Lifecycle nav shows no active stage on these pages.
2. **3 execution routes mapped to wrong stage** — `/service/execution/algos` and `/service/execution/venues` map to "build"; `/service/execution/tca` maps to "observe". When user navigates via EXECUTION_TABS (which is under the Run lifecycle), lifecycle nav contradicts the tab context.
3. **1 execution route missing** — `/service/execution/benchmarks` has no mapping.

**Recommendation:** Add routeMappings for all 4 missing routes with `primaryStage: "run"`. Review whether execution sub-pages should map to "run" (when accessed via EXECUTION_TABS) or keep their current cross-lifecycle mappings.

---

### C5. Cross-lifecycle links

```
Task: C5
Status: INFO
Severity: —
```

**Links FROM trading/execution pages TO other lifecycle stages:**

| Source Page | Link Target | Target Lifecycle | Type |
| ---------- | ----------- | ---------------- | ---- |
| Dashboard (`/dashboard`) | `/service/trading/risk` | Observe | Link in strategy table |
| Dashboard | `/service/trading/alerts` | Observe | AlertsFeed links |
| Dashboard | `/health` | Observe | HealthStatusGrid links |
| Trading Terminal | None found | — | Self-contained |
| Positions | None found | — | Self-contained |
| Execution Overview | None found | — | Self-contained |

**Finding:** Cross-lifecycle linking is minimal. Dashboard serves as a hub with links into Observe stage (risk, alerts, health). Individual trading and execution pages are self-contained with no cross-links.

---

## Section D: Data Wiring (4 tasks)

### D1. Trading hooks

```
Task: D1
Status: ISSUE
Severity: P1-fix
```

**React Query hooks available in `hooks/api/`:**

| Hook | File | Endpoint | Used by trading pages? |
| ---- | ---- | -------- | --------------------- |
| `usePositions` | `use-positions.ts` | `/api/positions` | NO |
| `usePositionsSummary` | `use-positions.ts` | `/api/positions/summary` | NO |
| `useBalances` | `use-positions.ts` | `/api/positions/balances` | NO |
| `useOrders` | `use-orders.ts` | `/api/orders` | NO |
| `useAlgos` | `use-orders.ts` | `/api/algos` | NO |
| `useVenues` | `use-orders.ts` | `/api/venues` | NO |
| `useAlgoBacktests` | `use-orders.ts` | `/api/algo-backtests` | NO |
| `useOrganizations` | `use-trading.ts` | `/api/organizations` | NO |
| `useTradingClients` | `use-trading.ts` | `/api/clients` | NO |
| `usePnL` | `use-trading.ts` | `/api/pnl` | NO |
| `usePnLTimeseries` | `use-trading.ts` | `/api/pnl/timeseries` | NO |
| `useStrategyPerformance` | `use-trading.ts` | `/api/strategies/performance` | NO |
| `useLiveBatchDelta` | `use-trading.ts` | `/api/live-batch-delta` | NO |

**Finding:** 13 React Query hooks exist that directly serve trading page data needs (positions, orders, P&L, strategies, organizations). **NONE are used by any trading page.** All trading pages import flat mock data from `lib/trading-data.ts`, `lib/strategy-registry.ts`, or `lib/reference-data.ts`.

**Recommendation:** This is the highest-impact data wiring gap. Trading pages should be migrated to use these hooks, which would enable MSW mock → real API transition.

---

### D2. Execution hooks

```
Task: D2
Status: ISSUE
Severity: P1-fix
```

**Execution pages use:** `lib/execution-platform-mock-data.ts` (flat mock exports: `MOCK_VENUES`, `MOCK_RECENT_ORDERS`, `MOCK_EXECUTION_METRICS`, `MOCK_EXECUTION_ALGOS`, `MOCK_ALGO_BACKTESTS`).

**Available React Query hooks that could serve execution:**

| Hook | File | Could serve... |
| ---- | ---- | -------------- |
| `useAlgos` | `use-orders.ts` | Algos page |
| `useVenues` | `use-orders.ts` | Venues page |
| `useAlgoBacktests` | `use-orders.ts` | Benchmarks page |
| `useOrders` | `use-orders.ts` | TCA page (order analysis) |

**Finding:** Same pattern as trading — hooks exist but none are wired. Execution pages directly import flat mocks from a dedicated mock file.

---

### D3. Flat mock usage

```
Task: D3
Status: ISSUE
Severity: P1-fix
```

**Flat mock data files feeding Run lifecycle pages:**

| Mock File | Approx Lines | Used By |
| --------- | ------------ | ------- |
| `lib/trading-data.ts` | Large | Trading Terminal, Markets, Dashboard |
| `lib/strategy-registry.ts` | Large | Positions |
| `lib/reference-data.ts` | Large | Positions, Markets |
| `lib/execution-platform-mock-data.ts` | Medium | All 5 execution pages |

**Additionally, pages contain large inline mock data:**

| Page | Inline mock examples |
| ---- | ------------------- |
| Trading Terminal | `instruments[]`, `strategyInstruments{}`, `generateCandleData()`, `generateMockOrderBook()` |
| Markets | `generateTimeSeriesData()`, `generatePnLComponents()`, `generateStrategyBreakdown()`, `generateFactorTimeSeries()`, `generateClientPnL()`, `generateLiveBookUpdates()`, `generateOrderFlowData()` |
| Dashboard | `mockAlerts[]`, `venueMargins[]`, `allMockServices[]` |
| Execution TCA | `TCA_BREAKDOWN[]`, `EXECUTION_TIMELINE[]`, `SLIPPAGE_DISTRIBUTION[]` |
| Execution Benchmarks | `BENCHMARKS[]`, `mockBenchmarkPerformance[]`, `generateSlippageTimeSeries()` |

**Finding:** All 11 tab pages + dashboard use flat mocks. Zero pages use React Query or MSW. This is intentional for the current phase — mock data shapes are identical to what the real backend will return. The UI/UX is being validated using this mock data before backend integration. The mock data is split between dedicated files (`lib/*.ts`) and inline arrays/generators inside page files. When ready for backend integration: move all inline mocks to `lib/mocks/fixtures/` and replace flat imports with React Query hooks backed by MSW handlers, then transition to real API endpoints.

---

### D4. Real-time data

```
Task: D4
Status: ISSUE
Severity: P2-improve
```

| Page | Real-time mechanism | Frequency |
| ---- | ------------------- | --------- |
| Trading Terminal | `setInterval` | 500ms — price ticks, recent trades animation |
| All other pages | None | Static render |

**Finding:** Only the Trading Terminal has simulated real-time updates via `setInterval`. No WebSocket hooks exist in `hooks/api/`. No `use-market-data.ts` hooks (which exists in `hooks/api/`) are used. The positions page — which should show live P&L — renders statically.

**Recommendation:**
1. Create `hooks/api/use-websocket.ts` for WebSocket connections
2. Wire `use-market-data.ts` hooks into Terminal and Positions
3. Add `refetchInterval` to React Query hooks for positions/orders for polling fallback

---

## Section E: UX Audit (4 tasks)

### E1. Loading/error/empty states

```
Task: E1
Status: ISSUE
Severity: P1-fix
```

| Page | Loading | Error | Empty |
| ---- | ------- | ----- | ----- |
| Trading Terminal | "Loading trades..." (SSR guard) | ✗ | "No trades yet" |
| Positions | `<Suspense>` "Loading positions..." | ✗ | "No positions match" |
| Orders | ✗ (placeholder) | ✗ | ✗ |
| Accounts | ✗ (placeholder) | ✗ | ✗ |
| Markets | Unknown (2111 lines) | ✗ | ✗ |
| Dashboard | ✗ | ✗ | ✗ |
| Execution Overview | ✗ | ✗ | ✗ |
| Execution Algos | ✗ | ✗ | ✗ |
| Execution Venues | ✗ | ✗ | ✗ |
| Execution TCA | ✗ | ✗ | ✗ |
| Execution Benchmarks | ✗ | ✗ | ✗ |

**Finding:** 2 of 11 pages have loading states. 0 of 11 have error states. 2 of 11 have empty states. No shared `LoadingState`, `ErrorState`, or `EmptyState` component is used across Run lifecycle pages.

**Recommendation:** Create shared state components in `components/ui/` and apply to all pages during React Query migration.

---

### E2. Trading workflow continuity

```
Task: E2
Status: ISSUE
Severity: P2-improve
```

**Expected workflow:** Terminal → place order → see in Orders → see in Positions

| Step | Page | Status |
| ---- | ---- | ------ |
| 1. View market and enter order | Terminal | ✓ Has order entry form (Buy/Sell buttons, quantity, price inputs) |
| 2. See order status | Orders | ✗ "Coming Soon" placeholder — no order blotter |
| 3. See filled position | Positions | ⚠ Shows positions but no link from order fill |
| 4. Track P&L | Dashboard | ✓ Shows P&L with strategy breakdown |

**Finding:** The trading workflow is broken at step 2. The Orders page is a placeholder, so users cannot track order status after placing from the Terminal. There is no navigational link from Terminal order confirmation → Orders page → Positions page. Each page is isolated.

**Recommendation:** Implement Orders page as the priority to complete the trading workflow loop. Add cross-page links (Terminal → "View in Orders", Orders → "View Position").

---

### E3. Responsive behavior

```
Task: E3
Status: ISSUE
Severity: P2-improve
```

**Finding:** No `useMobile()` hook usage in any trading or execution page. No responsive breakpoint handling beyond basic CSS. The `use-mobile.ts` hook exists in `hooks/` but is not imported by any Run lifecycle page.

Specific concerns:
- Trading Terminal: order book + candlestick chart side-by-side layout will not adapt to mobile
- Dashboard: multi-column grid will stack but component density is high
- Execution pages: data tables will overflow on narrow screens
- TRADING_TABS: 6 tabs with `overflow-x-auto` — will require horizontal scroll on mobile

**Recommendation:** Low priority for desktop-first trading platform, but should be addressed before client-facing launch.

---

### E4. Live/As-Of toggle

```
Task: E4
Status: ISSUE
Severity: P2-improve
```

**Configuration:** `LIVE_ASOF_VISIBLE.run = true` — toggle IS rendered in both trading and execution layouts.

**Source:** Both `trading/layout.tsx` and `execution/layout.tsx` render:

```typescript
rightSlot={LIVE_ASOF_VISIBLE.run ? <LiveAsOfToggle /> : undefined}
```

**Finding:** The toggle is rendered but has no effect. No trading or execution page reads the Live/As-Of state. The `LiveAsOfToggle` component likely stores state in a Zustand store, but no page queries data differently based on this toggle.

**Recommendation:** Wire the Live/As-Of toggle to affect data queries once React Query hooks are in place (e.g., pass `mode=live` or `mode=asof` to API calls).

---

## Section F: Cross-Reference Markers (4 tasks)

### F1. Trading Markets vs Data Markets

```
Task: F1
Status: ISSUE
Severity: P1-fix
```

**Comparison:**

| Attribute | `/service/trading/markets` | `/service/data/markets` |
| --------- | ------------------------- | ---------------------- |
| File | `app/(platform)/service/trading/markets/page.tsx` | `app/(platform)/service/data/markets/page.tsx` |
| Lines | ~2,111 | ~2,111 |
| Imports | Identical | Identical |
| Components | Identical | Identical |
| Data sources | Same (`lib/trading-data`, `lib/reference-data`) | Same |
| Layout context | TRADING_TABS (Run) | DATA_TABS (Acquire) |
| Tab label | "Markets" | "Markets" |

**Finding:** The two files have **identical content**. Both are P&L Attribution / Analytics pages with structural P&L, factor analysis, client P&L, and order flow data. This is a full duplication — the same ~2,111-line file copied into two different route directories.

**The name "Markets" is misleading for both** — the content is P&L attribution, not a market data overview. Under DATA_TABS (Acquire lifecycle), P&L content is out of place. Under TRADING_TABS (Run lifecycle), the label "Markets" suggests market data browsing, not P&L analytics.

**Recommendation:**
1. Extract the P&L attribution page into a shared component
2. Rename: `/service/trading/markets` → `/service/trading/pnl` (or keep as "Markets" but with actual market overview content)
3. Decide if Acquire needs a P&L view at all (it shouldn't — P&L is a Run/Observe concern)
4. Remove the duplication — one shared component, two route entries if needed

---

### F2. Execution overlap

```
Task: F2
Status: ISSUE
Severity: P1-fix
```

**The problem:** EXECUTION_TABS pages live at `/service/execution/*`, which is also the `matchPrefix` for TRADING_TABS "Execution Analytics" entry.

**What actually happens:**

1. User is on `/service/trading/overview` (TRADING_TABS visible, "Terminal" active)
2. User clicks "Execution Analytics" tab → navigates to `/service/execution/overview`
3. Next.js renders `execution/layout.tsx` → EXECUTION_TABS replace TRADING_TABS
4. Row 2 changes from 6 tabs (Terminal, Positions, Orders, Exec Analytics, Accounts, Markets) to 5 tabs (Analytics, Algos, Venues, TCA, Benchmarks)
5. User has no visual indication they've left the trading context
6. EXECUTION_TABS has no "Back to Trading" entry

**Additionally:** Execution pages individually render `ExecutionNav` — a third layer of navigation inside the page content. `ExecutionNav` links use `/execution/*` paths (without `/service/` prefix), which do not match any App Router routes. These links are **broken** — see F3.

**Recommendation:** Resolve the dual-layout/dual-nav issue:
- Option A: Merge execution into trading (one combined tab bar, execution pages as sub-tabs)
- Option B: Keep separate layouts but add bidirectional navigation (breadcrumbs, back links)
- Either way: remove `ExecutionNav` component — it duplicates the tab bar with broken links

---

### F3. Orphan execution pages

```
Task: F3
Status: ISSUE
Severity: P0-blocking
```

**`/service/execution/candidates` and `/service/execution/handoff`:**

| Attribute | Value |
| --------- | ----- |
| In EXECUTION_TABS? | No |
| In routeMappings? | No |
| Linked from `ExecutionNav`? | Yes — but with **WRONG PATHS** |

**ExecutionNav paths** (from `components/execution-platform/execution-nav.tsx`):

```typescript
{ href: "/execution/candidates", label: "Candidates", icon: ShoppingBasket },
{ href: "/execution/handoff", label: "Handoff", icon: Send },
```

**Actual App Router paths:**

```
app/(platform)/service/execution/candidates/page.tsx  → /service/execution/candidates
app/(platform)/service/execution/handoff/page.tsx     → /service/execution/handoff
```

**Finding:** `ExecutionNav` links to `/execution/candidates` and `/execution/handoff` — these paths are **missing the `/service/` prefix**. Clicking these links in ExecutionNav navigates to non-existent routes, resulting in a 404 or fallback page. The same broken prefix issue applies to ALL 7 ExecutionNav items (`/execution/overview`, `/execution/algos`, etc.) — none have the `/service/` prefix.

**Impact:** P0-blocking because the only discoverable navigation path to candidates and handoff pages is through broken links.

**Recommendation:**
1. Fix ExecutionNav paths: all hrefs should use `/service/execution/` prefix
2. Add candidates and handoff to EXECUTION_TABS (or document why they're excluded)
3. Add routeMappings entries for both pages
4. OR remove ExecutionNav entirely and add the orphan pages to EXECUTION_TABS

---

### F4. `/service/trading/risk` and `/service/trading/alerts`

```
Task: F4
Status: ISSUE
Severity: P1-fix (confirmed from Phase 1)
```

**Current behavior:**

| Route | Layout used | Tabs shown | Tab highlighted | Lifecycle nav stage |
| ----- | ----------- | ---------- | --------------- | ------------------- |
| `/service/trading/risk` | `trading/layout.tsx` | TRADING_TABS (6 tabs) | **NONE** (risk not in TRADING_TABS) | Observe ✓ |
| `/service/trading/alerts` | `trading/layout.tsx` | TRADING_TABS (6 tabs) | **NONE** (alerts not in TRADING_TABS) | Observe ✓ |

**Why this happens:** Both pages live under `app/(platform)/service/trading/` so they inherit `trading/layout.tsx` which renders TRADING_TABS. But neither `/service/trading/risk` nor `/service/trading/alerts` is an entry in TRADING_TABS — they're in OBSERVE_TABS (which is never rendered because no observe layout exists).

**Result:** User navigates to Risk or Alerts (via lifecycle nav Observe dropdown) and sees the Run lifecycle's TRADING_TABS with no tab highlighted. The page content renders correctly but the Row 2 tab context is wrong.

**Recommendation:**
- Short term: Add risk and alerts as tabs in TRADING_TABS (or a divider section)
- Long term: Create an observe layout that renders OBSERVE_TABS, and move risk/alerts pages to `app/(platform)/service/observe/`

---

## Priority Summary

### P0-blocking (2 items)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| F3 | ExecutionNav uses `/execution/*` paths (missing `/service/` prefix) — all 7 links are broken | Fix paths to `/service/execution/*`; remove ExecutionNav or merge into EXECUTION_TABS |
| A3/E2 | **Orders page is a placeholder — breaks the core trading workflow** (Terminal → place order → track in Orders → see in Positions). This is the single biggest gap for trader daily activity | Implement Orders page with order blotter, fill tracking, cancel/modify actions. React Query hook `useOrders()` already exists |

### P1-fix (9 items)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| A5 | "Markets" tab contains P&L attribution content (which is valuable!) but the label is misleading — trader expects market data | Rename tab to "P&L" or "Analytics" in TRADING_TABS; split 2,111-line file; deduplicate with data/markets |
| E4 | **LiveAsOfToggle renders but is not wired** — the backtest-vs-live comparison only works on Dashboard, not across all tabs | Wire toggle to global state that React Query hooks read; all pages should respect live/as-of mode |
| NEW | **No drawdown display anywhere** — max drawdown, current drawdown, drawdown duration are critical trader metrics | Add drawdown KPI to Dashboard; add drawdown column to strategy performance table |
| C3 | Layout switching from trading to execution is abrupt, no back navigation | Add breadcrumb/back-link or merge layouts |
| C4 | 4 routes missing from routeMappings; 3 execution routes mapped to wrong lifecycle stage | Add routeMappings entries with correct primaryStage |
| E1 | 0/11 error states, 2/11 loading states | Add shared loading/error/empty components |
| F1 | `/service/trading/markets` and `/service/data/markets` are byte-identical 2,111-line duplicates | Extract shared component, deduplicate |
| F4 | `/service/trading/risk` and `/service/trading/alerts` show TRADING_TABS with no tab highlighted | Add to TRADING_TABS or create observe layout |
| C1 | TRADING_TABS "Execution Analytics" matchPrefix is unreachable + no entitlement gating on any trading tab | Remove unreachable matchPrefix; add `requiredEntitlement` |

### P2-improve (10 items)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| NEW | **No position sorting** — Positions table can't sort by P&L, notional, liquidation distance | Add column sorting to positions table |
| NEW | **No open orders panel on Terminal** — trader places order but can't see pending orders on the same screen | Add collapsible open orders sidebar to Terminal |
| NEW | **No position-level live vs batch comparison** — only aggregate on Dashboard | Add batch overlay mode to Positions page showing position diffs |
| NEW | **Positions don't live-update** — static render, no polling or real-time updates | Add `refetchInterval` to position data when using React Query |
| A4 | Accounts page is a "Coming Soon" placeholder | Implement with account hooks (lower priority — Positions covers basics) |
| B2-B5 | Execution pages lack loading/error/empty states | Add shared state components |
| D4 | Only Terminal has real-time (setInterval); no WebSocket | Implement WebSocket hooks |
| E3 | No responsive handling in any Run page | Add `useMobile()` and responsive layouts |
| F2 | Execution overlap — dual layout creates tab bar confusion | Merge or add bidirectional nav |
| NEW | **No cross-page navigation** — Terminal doesn't link to Orders, Orders doesn't link to Positions | Add contextual navigation links between pages |

### P3-cosmetic (2 items)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| B2 | Execution algos/venues mapped as primaryStage "build" in routeMappings | Verify intent or change to "run" |
| — | EXECUTION_TABS labeled "Legacy aliases" in service-tabs.tsx | Remove misleading comment (confirmed in Phase 1 F2) |

### Additional context: Mock data and API integration

All pages currently use flat mock data whose shape is identical to the real backend responses. This is intentional — the current phase validates UI/UX before backend integration. The data wiring issues (D1-D3) in the technical audit above relate to the migration path from flat mocks → React Query hooks → real API, not to the current phase's goals. The D1-D3 findings are reclassified from P1 to **future work** — they become P1 when backend integration begins.

### Additional context: Live vs Backtest comparison

The `LiveBatchComparison` component on Dashboard with 4 view modes (live/batch/split/delta) and `DriftAnalysisPanel` with configurable drift thresholds are **well-aligned** to the trader's need for alpha decay analysis and strategy stress-testing. Key enhancement: extend this capability to the Positions page (position-level diff) and wire the `LiveAsOfToggle` so all pages can switch between live and as-of data consistently.
