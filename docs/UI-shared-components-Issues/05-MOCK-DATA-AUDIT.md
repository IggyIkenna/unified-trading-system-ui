# 05 — Mock Data Placement Audit

**Date:** 2026-03-27
**Scope:** All `.tsx` / `.ts` files in `unified-trading-system-ui`
**Goal:** All mock data should live in `lib/` (centralized). No page or component should contain inline mock data. When APIs are wired, migration should require changing imports in `lib/`, not hunting through 80+ files.

---

## 1. Architecture: Prescribed vs Actual

### What `.cursorrules` Prescribes

```
lib/
├── mocks/
│   ├── handlers/     ← MSW request handlers
│   └── fixtures/     ← Mock data fixtures matching openapi.json
│       └── personas.ts
```

- Mock data via **MSW** (Mock Service Worker) centralized in `lib/mocks/`
- Fixtures must match `lib/registry/openapi.json` schemas
- Same endpoint URL, different response per persona (dimensional mocking)
- No per-component mocks
- API calls via React Query hooks only (`hooks/api/`)

### What Actually Exists

```
lib/
├── api/
│   ├── mock-handler.ts          ← Central fetch interceptor (replaces MSW)
│   ├── mock-provisioning-state.ts
│   ├── mock-trade-ledger.ts
│   └── mock-onboarding-state.ts
├── trading-data.ts              ← 1,057 lines — orgs, clients, P&L, time series
├── strategy-platform-mock-data.ts ← 938 lines — strategy templates, backtests
├── ml-mock-data.ts              ← 2,907 lines — ML families, experiments, runs
├── execution-platform-mock-data.ts ← 554 lines — execution algos, venues, orders
├── data-service-mock-data.ts    ← 2,452 lines — data catalogue, instruments, ETL
├── build-mock-data.ts           ← 2,591 lines — build overview, features, ETL
├── backtest-analytics-mock.ts   ← 410 lines — equity curve generators
├── deterministic-mock.ts        ← 19 lines — seeded PRNG helpers
├── reference-data.ts            ← 1,370 lines — reference constants
├── strategy-registry.ts         ← 7,691 lines — strategy catalog (SSOT)
├── taxonomy.ts                  ← 990 lines — asset classes, venues, enums
├── demo-ids.ts                  ← 27 lines — ID factories
├── auth/personas.ts             ← Persona definitions (not in lib/mocks/)
```

**Key gaps:**

- **No `lib/mocks/` directory** exists (only `__tests__/lib/mocks/`)
- **No MSW** — `msw` is not in `package.json`
- **No `lib/mocks/handlers/`** or **`lib/mocks/fixtures/`**
- Mock interception uses a **custom `mock-handler.ts`** env-gated via `NEXT_PUBLIC_MOCK_API=true`
- Personas live in `lib/auth/personas.ts`, not `lib/mocks/fixtures/personas.ts`

**What works well:**

- `hooks/api/*.ts` files all use React Query + `apiFetch('/api/...')` — no inline data fetching ✅
- `mock-handler.ts` acts as a centralized routing layer (functionally similar to MSW) ✅
- Most `lib/*-mock-data.ts` files have separate `*-types.ts` files ✅

---

## 2. Inline Mock Data in Pages 🔴

These page files contain mock data arrays/objects that should be in `lib/`:

### 2a. Large Fixture Arrays (API-shaped data)

| File                                                            | Variables                                                                | Lines    | Items       | Domain               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ | -------- | ----------- | -------------------- |
| `app/(platform)/services/reports/settlement/page.tsx`           | `MOCK_SETTLEMENTS`, `MOCK_INVOICES`                                      | 39–243   | 15 + 5      | Settlement/billing   |
| `app/(platform)/services/reports/reconciliation/page.tsx`       | `FALLBACK_HISTORY`, `DRIFT_METRICS`, `UNRECONCILED_ITEMS`                | 71–270   | 12 + 5 + 7  | Reconciliation       |
| `app/(platform)/services/manage/compliance/page.tsx`            | `FALLBACK_RULES`, `FALLBACK_VIOLATIONS`, `FALLBACK_AUDIT`                | 64–246   | 10 + 7 + 6  | Compliance           |
| `app/(platform)/services/manage/mandates/page.tsx`              | `FALLBACK_MANDATES`                                                      | 64–289   | 10 (nested) | Client mandates      |
| `app/(platform)/services/trading/risk/page.tsx`                 | `MOCK_STRATEGIES`                                                        | 235–278  | 7           | Risk filters         |
| `app/(platform)/services/trading/strategies/grid/page.tsx`      | `DEFAULT_BACKTEST_RESULTS`                                               | 16–129   | 8           | Backtest grid        |
| `app/(platform)/services/trading/terminal/page.tsx`             | `DEFAULT_INSTRUMENTS`                                                    | 125–168  | 6           | Terminal instruments |
| `app/(platform)/services/trading/accounts/page.tsx`             | `MOCK_TRANSFER_HISTORY`, `MOCK_VENUE_BALANCES`                           | 99–158   | 5 + 5       | Treasury             |
| `app/(platform)/settings/api-keys/page.tsx`                     | `SUPPORTED_VENUES`                                                       | 35–44    | 8           | Venue list           |
| `app/(platform)/investor-relations/board-presentation/page.tsx` | `VENUE_LIST`, `slides`                                                   | 28–1900+ | 38 + large  | IR deck              |
| `app/(public)/demo/preview/page.tsx`                            | `heatmapData`, `backtestResults`, `livePositions`                        | 37–129   | 6 + 4 + 3   | Demo preview         |
| `app/(ops)/ops/page.tsx`                                        | `batchJobs`, `services`, `dataCompleteness`, `recentDeploys`, `auditLog` | 30–188   | 4+6+5+4+4   | Ops dashboard        |
| `app/(ops)/config/page.tsx`                                     | `strategySchemas`, `clients`, `strategyConfigs`, `venues`, `riskLimits`  | 87–382   | 1+4+4+10+4  | Config editor        |

### 2b. Data Generation Functions in Pages

| File                                                         | Functions                                                                                                                                                                           | Lines    | Domain                 |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------- |
| `app/(platform)/services/trading/pnl/page.tsx`               | `generateTimeSeriesData`, `generatePnLComponents`, `generateStrategyBreakdown`, `generateFactorTimeSeries`, `generateClientPnL`, `generateLiveBookUpdates`, `generateOrderFlowData` | 108–850+ | P&L charts, order book |
| `app/(platform)/services/trading/markets/page.tsx`           | Same family — `generateTimeSeriesData`, `generatePnLComponents`, etc.                                                                                                               | 78–430+  | Markets charts         |
| `app/(platform)/services/trading/terminal/page.tsx`          | `generateCandleData`                                                                                                                                                                | 172–223  | Price chart            |
| `app/(platform)/services/research/strategy/results/page.tsx` | `generateTimeSeriesData`, `generateRegimeData`, `generateAttributionData`                                                                                                           | 52–136   | Backtest results       |
| `app/(platform)/services/research/ml/training/page.tsx`      | `generateResourceData`                                                                                                                                                              | 161–175  | GPU/memory sparkline   |

**Impact:** The P&L and Markets pages each have **700+ lines** of data generation code that is **duplicated** between them.

---

## 3. Inline Mock Data in Components 🔴

### 3a. Dedicated Mock Files Next to Components (Should Be in `lib/`)

| File                                          | Lines  | Domain              | Exports                                                                                      |
| --------------------------------------------- | ------ | ------------------- | -------------------------------------------------------------------------------------------- |
| `components/trading/sports/mock-data.ts`      | ~1,500 | Sports betting      | `MOCK_FIXTURES`, `MOCK_ODDS`, `MOCK_ARB_STREAM`, `MOCK_BETS`, helpers                        |
| `components/trading/predictions/mock-data.ts` | ~600   | Prediction markets  | `MOCK_MARKETS`, positions, arbs                                                              |
| `components/promote/mock-fixtures.ts`         | ~674   | Promotion lifecycle | `SR_11_7_ITEMS`, `STANDARD_REGIMES`, champion, drift, compliance, `HISTORICAL_APPROVALS_30D` |
| `components/trading/sports/mock-fixtures.ts`  | ~46    | Sports config       | Leagues, bookmakers, odds markets                                                            |

**Total: ~2,820 lines** of mock data living next to components instead of in `lib/`.

### 3b. Inline Mock Arrays in Component Files

| File                                                 | Variables                                                                                                                                                                                                    | Lines   | Domain           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------- |
| `components/trading/defi-ops-panel.tsx`              | `LENDING_PROTOCOLS`, `SWAP_TOKENS`, `MOCK_SWAP_ROUTE`, `LIQUIDITY_POOLS`, `STAKING_PROTOCOLS`, `FEE_TIERS`, `FLASH_OPERATION_TYPES`, `DEFI_CHAINS`, `DEFI_TOKENS`, `BRIDGE_PROTOCOLS`, `MOCK_TOKEN_BALANCES` | 92–1209 | DeFi operations  |
| `components/trading/strategy-instruction-viewer.tsx` | `MOCK_INSTRUCTIONS`                                                                                                                                                                                          | 61–289  | Strategy fills   |
| `components/trading/strategy-audit-trail.tsx`        | `MOCK_DECISIONS`                                                                                                                                                                                             | 61–208  | Audit decisions  |
| `components/trading/kill-switch-panel.tsx`           | `EXIT_PLAYBOOKS`, `ACTIVE_KILL_SWITCHES`, `MOCK_ENTITIES`                                                                                                                                                    | 41–139  | Kill switch      |
| `components/ops/event-stream-viewer.tsx`             | `MOCK_EVENTS`                                                                                                                                                                                                | 39–256  | Ops event stream |
| `components/dashboards/trader-dashboard.tsx`         | `mockStrategies`, `mockAlerts`, `mockPnLComponents`, `mockServices`                                                                                                                                          | 42–151  | Trader dashboard |
| `components/platform/health-bar.tsx`                 | `MOCK_HEALTH`                                                                                                                                                                                                | 19–30   | Service health   |
| `components/platform/activity-feed.tsx`              | `MOCK_ACTIVITY`                                                                                                                                                                                              | 31–114  | Activity feed    |
| `components/ml/loss-curves.tsx`                      | `mockModelStrategyLinks`, `mockExperimentLossCurves`                                                                                                                                                         | 78–158  | ML training      |
| `components/trading/predictions/odum-focus-tab.tsx`  | `FOOTBALL_MARKETS`                                                                                                                                                                                           | 322–351 | Football markets |

### 3c. Data Generator Functions in Components

| File                                              | Function                                         | Domain              |
| ------------------------------------------------- | ------------------------------------------------ | ------------------- |
| `components/trading/vol-surface-chart.tsx`        | `generateMockVolSurface`                         | Options vol surface |
| `components/trading/order-book.tsx`               | `generateMockOrderBook`                          | Order book          |
| `components/trading/options-chain.tsx`            | `generateMockExpiry`, `generateMockOptionsChain` | Options chain       |
| `components/trading/time-series-panel.tsx`        | `generateTimeSeriesData`                         | P&L/NAV charts      |
| `components/marketing/data-services-showcase.tsx` | `generateMockHeatmap`                            | Marketing heatmap   |
| `components/ml/loss-curves.tsx`                   | `generateLossCurve`                              | ML loss curves      |

---

## 4. Inline Mock Data in Hooks 🟡

| File                            | Variable                | Lines    | Items     | Domain                            |
| ------------------------------- | ----------------------- | -------- | --------- | --------------------------------- |
| `hooks/api/use-strategies.ts`   | `SEED_STRATEGIES`       | 152–321  | 12        | Strategy health (placeholderData) |
| `hooks/api/use-news.ts`         | `SEED_NEWS`             | 17–168   | 15        | News feed (placeholderData)       |
| `hooks/deployment/_api-stub.ts` | Multiple stub functions | 387–806+ | ~20 stubs | Deployment UI stubs               |

---

## 5. Consumer Map — Who Imports What from `lib/`

### Well-Centralized (imported from `lib/` — good pattern)

| `lib/` Module                        | Consumer Count | Primary Consumers                                |
| ------------------------------------ | -------------- | ------------------------------------------------ |
| `@/lib/data-service-mock-data`       | 18 files       | Data pages, finder configs, marketing, ops admin |
| `@/lib/build-mock-data`              | 10 files       | Research features, execution components          |
| `@/lib/reference-data`               | 11 files       | Trading pages, ops config/jobs                   |
| `@/lib/trading-data`                 | 8 files        | Reports, trading overview/markets, context bar   |
| `@/lib/strategy-platform-mock-data`  | 3 files        | Research strategies, mock-handler                |
| `@/lib/ml-mock-data`                 | 1 file         | mock-handler only                                |
| `@/lib/execution-platform-mock-data` | 1 file         | mock-handler only                                |
| `@/lib/deterministic-mock`           | 7 files        | Sidebar, order book, terminal, archive           |

### Not Centralized (inline — should be moved to `lib/`)

| Domain                | Current Location                               | Inline Lines | Should Be                                              |
| --------------------- | ---------------------------------------------- | ------------ | ------------------------------------------------------ |
| Settlement/billing    | `settlement/page.tsx`                          | ~205         | `lib/reports-mock-data.ts`                             |
| Reconciliation        | `reconciliation/page.tsx`                      | ~200         | `lib/reports-mock-data.ts`                             |
| Compliance            | `compliance/page.tsx`                          | ~183         | `lib/manage-mock-data.ts`                              |
| Mandates              | `mandates/page.tsx`                            | ~226         | `lib/manage-mock-data.ts`                              |
| Sports betting        | `components/trading/sports/mock-data.ts`       | ~1,500       | `lib/sports-mock-data.ts`                              |
| Predictions           | `components/trading/predictions/mock-data.ts`  | ~600         | `lib/predictions-mock-data.ts`                         |
| Promote fixtures      | `components/promote/mock-fixtures.ts`          | ~674         | `lib/promote-mock-data.ts`                             |
| DeFi operations       | `components/trading/defi-ops-panel.tsx` inline | ~300         | `lib/defi-mock-data.ts`                                |
| Strategy instructions | `strategy-instruction-viewer.tsx`              | ~228         | `lib/trading-mock-data.ts`                             |
| Audit decisions       | `strategy-audit-trail.tsx`                     | ~147         | `lib/trading-mock-data.ts`                             |
| Kill switch           | `kill-switch-panel.tsx`                        | ~100         | `lib/trading-mock-data.ts`                             |
| Ops events            | `event-stream-viewer.tsx`                      | ~217         | `lib/ops-mock-data.ts`                                 |
| Trader dashboard      | `trader-dashboard.tsx`                         | ~110         | `lib/dashboard-mock-data.ts`                           |
| Health/activity       | `health-bar.tsx`, `activity-feed.tsx`          | ~95          | `lib/platform-mock-data.ts`                            |
| ML loss curves        | `loss-curves.tsx`                              | ~80          | `lib/ml-mock-data.ts` (extend existing)                |
| P&L generators        | `pnl/page.tsx`                                 | ~700+        | `lib/generators/pnl-generators.ts`                     |
| Markets generators    | `markets/page.tsx`                             | ~350+        | `lib/generators/market-generators.ts` (share with P&L) |
| Options chain         | `options-chain.tsx`                            | ~100         | `lib/generators/options-generators.ts`                 |
| Vol surface           | `vol-surface-chart.tsx`                        | ~50          | `lib/generators/vol-generators.ts`                     |
| Order book            | `order-book.tsx`                               | ~60          | `lib/generators/book-generators.ts`                    |
| News seed             | `use-news.ts`                                  | ~152         | `lib/news-mock-data.ts`                                |
| Strategy seed         | `use-strategies.ts`                            | ~170         | `lib/strategy-health-mock-data.ts`                     |
| Config editor         | `config/page.tsx`                              | ~296         | `lib/ops-mock-data.ts`                                 |
| Ops dashboard         | `ops/page.tsx`                                 | ~158         | `lib/ops-mock-data.ts`                                 |
| Board presentation    | `board-presentation/page.tsx`                  | ~1,900       | `lib/ir-mock-data.ts`                                  |

**Estimated total inline mock data:** ~7,500+ lines across pages and components that should be in `lib/`.

---

## 6. Duplication Between Pages

The most critical duplication:

### P&L ↔ Markets Generator Functions

`pnl/page.tsx` and `markets/page.tsx` both define **identical** functions:

- `generateTimeSeriesData` (both files)
- `generatePnLComponents` (both files)
- `generateStrategyBreakdown` (both files)
- `generateFactorTimeSeries` (both files)
- `generateClientPnL` (both files)
- `generateLiveBookUpdates` (both files)
- `generateOrderFlowData` (both files)
- `structuralPnL` / `residualPnL` constants (both files)
- `CRYPTO_VENUES` / `TRADFI_VENUES` / `DEFI_VENUES` (both files)

**This is ~700 lines duplicated** between two page files. A single `lib/generators/trading-generators.ts` would eliminate this.

### KpiTile ↔ Sports Mock Data

`components/trading/sports/shared.tsx` defines `KpiTile` + `EmptyState` alongside mock helpers. The mock helpers should separate from the UI components.

---

## 7. Types Mixed with Mock Data 🟡

| File                                    | Issue                                                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `lib/build-mock-data.ts` (~2,591 lines) | Defines many `interface` / `export interface` types **inline** alongside mock data arrays. Types should be in `lib/build-types.ts` |
| `lib/trading-data.ts` (~1,057 lines)    | Interfaces co-located with data generators                                                                                         |

Other files have proper separation: `ml-mock-data.ts` → `ml-types.ts`, `execution-platform-mock-data.ts` → `execution-platform-types.ts`, etc.

---

## 8. Recommended Target Architecture

```
lib/
├── mocks/
│   ├── fixtures/
│   │   ├── trading.ts          ← Strategies, orders, positions, P&L
│   │   ├── reports.ts          ← Settlement, reconciliation
│   │   ├── manage.ts           ← Compliance, mandates
│   │   ├── sports.ts           ← Move from components/trading/sports/mock-data.ts
│   │   ├── predictions.ts      ← Move from components/trading/predictions/mock-data.ts
│   │   ├── promote.ts          ← Move from components/promote/mock-fixtures.ts
│   │   ├── defi.ts             ← DeFi lending, swap, staking data
│   │   ├── ops.ts              ← Ops dashboard, config, events
│   │   ├── platform.ts         ← Health, activity feed, news
│   │   ├── research.ts         ← ML, features, execution
│   │   ├── ir.ts               ← Board presentation slides
│   │   └── personas.ts         ← Move from lib/auth/personas.ts
│   ├── generators/
│   │   ├── trading-generators.ts  ← P&L, time series, book, order flow
│   │   ├── options-generators.ts  ← Vol surface, options chain
│   │   ├── ml-generators.ts       ← Loss curves, resource data
│   │   └── chart-generators.ts    ← Candle data, heatmaps
│   └── handler.ts              ← Move from lib/api/mock-handler.ts
├── types/                      ← Already partially exists
│   ├── trading.ts
│   ├── reports.ts
│   └── ...
```

### Migration Rules

1. **Pages import from `lib/mocks/fixtures/` or `lib/mocks/generators/`** — never define mock data inline
2. **Components never import mock data directly** — they receive data via props from pages, or pages use hooks that route through `mock-handler`
3. **Hooks use `placeholderData` from `lib/mocks/fixtures/`** — not inline seed arrays
4. **Generator functions live in `lib/mocks/generators/`** — shared across all pages that need them
5. **Types live in `lib/types/`** — never co-located with mock data
6. **`mock-handler.ts` is the single routing layer** — all mock API responses flow through it

---

## 9. Remediation Priority

### Phase 1 — Eliminate Duplication (Days 1–2)

1. Extract P&L/Markets shared generators into `lib/mocks/generators/trading-generators.ts`
2. Both pages import from the shared module
3. **Impact:** Removes ~700 lines of duplication immediately

### Phase 2 — Move Component-Adjacent Mock Files (Days 3–4)

1. Move `components/trading/sports/mock-data.ts` → `lib/mocks/fixtures/sports.ts`
2. Move `components/trading/predictions/mock-data.ts` → `lib/mocks/fixtures/predictions.ts`
3. Move `components/promote/mock-fixtures.ts` → `lib/mocks/fixtures/promote.ts`
4. Move `components/trading/sports/mock-fixtures.ts` → merge into `lib/mocks/fixtures/sports.ts`
5. Update all import paths
6. **Impact:** ~2,820 lines moved to centralized location

### Phase 3 — Extract Page Inline Mocks (Days 5–8)

1. Settlement + Reconciliation → `lib/mocks/fixtures/reports.ts`
2. Compliance + Mandates → `lib/mocks/fixtures/manage.ts`
3. Ops dashboard + Config → `lib/mocks/fixtures/ops.ts`
4. Terminal instruments, risk strategies, grid backtests → `lib/mocks/fixtures/trading.ts`
5. Board presentation → `lib/mocks/fixtures/ir.ts`
6. DeFi panel inline data → `lib/mocks/fixtures/defi.ts`
7. **Impact:** ~3,000+ lines extracted from pages

### Phase 4 — Extract Component Inline Mocks (Days 9–11)

1. Strategy instruction viewer, audit trail, kill switch → `lib/mocks/fixtures/trading.ts`
2. Event stream viewer → `lib/mocks/fixtures/ops.ts`
3. Trader dashboard → `lib/mocks/fixtures/dashboard.ts`
4. Health bar, activity feed → `lib/mocks/fixtures/platform.ts`
5. ML loss curves → extend `lib/ml-mock-data.ts`
6. Options chain, vol surface, order book generators → `lib/mocks/generators/`
7. **Impact:** ~1,500+ lines extracted from components

### Phase 5 — Extract Hook Inline Data (Day 12)

1. `SEED_STRATEGIES` from `use-strategies.ts` → `lib/mocks/fixtures/trading.ts`
2. `SEED_NEWS` from `use-news.ts` → `lib/mocks/fixtures/platform.ts`
3. **Impact:** ~320 lines extracted from hooks

### Phase 6 — Separate Types from Mock Data (Day 13)

1. Extract interfaces from `lib/build-mock-data.ts` → `lib/build-types.ts` (or `lib/types/build.ts`)
2. Extract interfaces from `lib/trading-data.ts` → consolidate into `lib/types/trading.ts`
3. **Impact:** Cleaner separation of concerns

---

## 10. Migration Readiness Scorecard

When backend APIs are ready, the migration effort depends on where mock data lives:

| Current State                                                   | API Wiring Effort                                                      | Risk      |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- | --------- |
| Mock in `lib/mocks/fixtures/` + `mock-handler` routing          | **Low** — update `mock-handler` routes or switch to real API in hooks  | Minimal   |
| Mock in `lib/*-mock-data.ts` (current pattern for some domains) | **Medium** — update imports in pages/components to use hooks instead   | Moderate  |
| Mock **inline in page/component**                               | **High** — must refactor each file, extract types, create hooks        | High      |
| Mock **duplicated across multiple pages**                       | **Very High** — must find all copies, ensure consistency, then migrate | Very High |

**Current distribution:**

- ✅ Centralized in `lib/`: ~10,000 lines (trading, data-service, ML, execution, build, strategy-platform)
- ❌ Inline in pages: ~4,000+ lines across ~15 pages
- ❌ Inline in components: ~3,000+ lines across ~15 components
- ❌ Adjacent to components: ~2,820 lines in 4 mock files
- ❌ Inline in hooks: ~320 lines in 2 hooks
- ❌ Duplicated between pages: ~700 lines (P&L ↔ Markets)

**Bottom line:** ~40% of mock data is properly centralized. ~60% needs to be extracted to `lib/` before API wiring can proceed efficiently.
