# Phase 2b: Build Lifecycle Tab — Deep Audit Results

**Audit date:** 2026-03-21
**Repo:** unified-trading-system-ui
**Plan:** `unified-trading-pm/plans/active/ui_phase2_build_tab_audit_2026_03_21.plan.md`

---

## Context

Mock data is intentionally identical to real API responses. The data wiring status (D1-D4) documents the current mock architecture for reference, but **data wiring is not a current concern**. The real focus of this audit is: do the components, page layouts, redirections, and information architecture align with the quant workflow (Features → ML Models → Strategies → Backtests → Signals → Execution)?

See `BUILD_WORKFLOW_ALIGNMENT.md` for the detailed workflow-focused assessment.

---

## Executive Summary

| Category | Total | PASS | ISSUE | INFO |
| -------- | ----- | ---- | ----- | ---- |
| A. Component Inventory | 7 | 7 | 0 | 0 |
| B. Orphan Pages | 3 | 0 | 3 | 0 |
| C. Navigation & Routing | 5 | 1 | 3 | 1 |
| D. Data Wiring | 4 | 1 | 2 | 1 |
| E. UX Audit | 5 | 1 | 3 | 1 |
| F. Entitlement Gating | 3 | 0 | 2 | 1 |
| G. Cross-Reference | 3 | 0 | 2 | 1 |
| **Total** | **30** | **10** | **15** | **5** |

**Severity breakdown:**

| Severity | Count |
| -------- | ----- |
| P0-blocking | 0 |
| P1-fix | 7 |
| P2-improve | 6 |
| P3-cosmetic | 2 |

---

## A. Component Inventory (7 Tab Pages)

### A1. Research Hub (`/service/research/overview`)

```
Task: A1
Status: PASS
Component/Route: ResearchOverviewPage
Finding: Well-structured hub page. 252 lines.
Severity: —
Recommendation: —
```

| Component | Source | Props | Data Source |
| --------- | ------ | ----- | ---------- |
| `Tabs / TabsList / TabsTrigger / TabsContent` | `@/components/ui/tabs` | defaultValue="ml" | — |
| `WorkflowPipeline` | Local (not exported) | `steps` array | `ML_WORKFLOWS`, `STRATEGY_WORKFLOWS`, `EXECUTION_WORKFLOWS` (inline constants) |
| `Card / CardContent / CardHeader / CardTitle / CardDescription` | `@/components/ui/card` | — | — |
| `Badge` | `@/components/ui/badge` | variant="outline" | — |
| `Button` | `@/components/ui/button` | asChild, size="sm" | — |
| `useAuth` | `@/hooks/use-auth` | — | `hasEntitlement("ml-full")`, `hasEntitlement("strategy-full")`, `hasEntitlement("execution-basic")` |
| Icons | `lucide-react` | Brain, FlaskConical, Zap, etc. | — |

**Internal links:** `/service/research/ml/overview`, `/service/research/ml/experiments`, `/service/research/ml/features`, `/service/research/ml/training`, `/service/research/ml/validation`, `/service/research/ml/deploy`, `/service/research/ml/monitoring`, `/service/research/strategy/backtests`, `/service/research/strategy/heatmap`, `/service/research/strategy/compare`, `/service/research/strategy/candidates`, `/service/research/strategy/handoff`, `/service/research/execution/algos`, `/service/research/execution/venues`, `/service/research/execution/tca`, `/service/research/execution/benchmarks`

**Quick stats cards:** Model Families (6), Active Experiments (12), Feature Sets (8), Deployed Models (4) — all hardcoded inline.

---

### A2. Features (`/service/research/ml/features`)

```
Task: A2
Status: PASS
Component/Route: FeaturesPage
Finding: Feature catalog with detail panel and usage matrix. 437 lines.
Severity: —
Recommendation: —
```

| Component | Source | Props | Data Source |
| --------- | ------ | ----- | ---------- |
| `Card / CardContent / CardHeader / CardTitle` | `@/components/ui/card` | — | — |
| `Badge` | `@/components/ui/badge` | — | — |
| `Input` | `@/components/ui/input` | search filter | — |
| `Select / SelectContent / SelectItem / SelectTrigger / SelectValue` | `@/components/ui/select` | source, status filters | — |
| Stats cards | Inline | — | Inline constants (Total Features: 6) |

**Data source:** `featureCatalog`, `featureHistory`, `featureUsageMatrix` — all inline mock data within the file. No React Query hook. No external mock import.

---

### A3. ML Models (`/service/research/ml`)

```
Task: A3
Status: PASS
Component/Route: MLModelsPage
Finding: ML platform dashboard with training dialog. 434 lines. matchPrefix /service/research/ml causes this tab to highlight for all ML sub-pages.
Severity: —
Recommendation: —
```

| Component | Source | Props | Data Source |
| --------- | ------ | ----- | ---------- |
| `Card / CardContent / CardHeader / CardTitle` | `@/components/ui/card` | — | — |
| `Badge` | `@/components/ui/badge` | — | — |
| `Dialog / DialogContent / DialogHeader / DialogTitle / DialogTrigger` | `@/components/ui/dialog` | "Train New Model" | — |
| `Select` components | `@/components/ui/select` | Model family, optimizer, GPU type | — |
| KPI cards | Inline | — | `MODEL_FAMILIES`, `EXPERIMENTS`, `TRAINING_RUNS` |

**Data source:** Imports from `@/lib/ml-mock-data` (`MODEL_FAMILIES`, `EXPERIMENTS`, `TRAINING_RUNS`, `FEATURE_PROVENANCE`, `ML_ALERTS`). Types from `@/lib/ml-types`.

---

### A4. Strategies (`/service/research/strategy/backtests`)

```
Task: A4
Status: PASS
Component/Route: StrategyBacktestsPage
Finding: Backtest management with filter bar, sortable table, candidate basket, and new backtest dialog. 477 lines.
Severity: —
Recommendation: —
```

| Component | Source | Props | Data Source |
| --------- | ------ | ----- | ---------- |
| `Card / CardContent / CardHeader / CardTitle` | `@/components/ui/card` | — | — |
| `Badge` | `@/components/ui/badge` | — | — |
| `Dialog` components | `@/components/ui/dialog` | "Run New Backtest" | — |
| `Select` components | `@/components/ui/select` | Archetype, venue, stage, template filters | — |
| `Input` | `@/components/ui/input` | search filter | — |

**Data source:** Imports from `@/lib/strategy-platform-mock-data` (`BACKTEST_RUNS`, `STRATEGY_TEMPLATES`, `ARCHETYPE_OPTIONS`, `VENUE_OPTIONS`, `TESTING_STAGE_OPTIONS`).

---

### A5. Backtests (`/service/research/strategy/compare`)

```
Task: A5
Status: PASS
Component/Route: StrategyComparePage
Finding: Config comparison page with up to 5 selectors, performance metrics diff, parameter diff table. 451 lines.
Severity: —
Recommendation: —
```

| Component | Source | Props | Data Source |
| --------- | ------ | ----- | ---------- |
| `ContextBar` | `@/components/platform/context-bar` | platform="strategy", context="BATCH" | — |
| `BatchLiveRail` | `@/components/platform/batch-live-rail` | platform="strategy" | — |
| `Card` components | `@/components/ui/card` | — | — |
| `Select` components | `@/components/ui/select` | Config selectors | — |
| `Badge` | `@/components/ui/badge` | — | — |

**Data source:** Imports from `@/lib/strategy-platform-mock-data` (`STRATEGY_CONFIGS`, `BACKTEST_RUNS`).

---

### A6. Signals (`/service/research/ml/validation`)

```
Task: A6
Status: PASS
Component/Route: ValidationPage
Finding: Model validation with champion vs challenger comparison, 5 analysis tabs. Most complex research page. 538 lines.
Severity: —
Recommendation: —
```

| Component | Source | Props | Data Source |
| --------- | ------ | ----- | ---------- |
| `Card` components | `@/components/ui/card` | — | — |
| `Badge` | `@/components/ui/badge` | — | — |
| `Tabs / TabsList / TabsTrigger / TabsContent` | `@/components/ui/tabs` | Performance, Regime, Walk-Forward, Statistical Tests, Feature Analysis | — |
| `Alert / AlertDescription / AlertTitle` | `@/components/ui/alert` | Promotion recommendation | — |
| `Progress` | `@/components/ui/progress` | Confidence bars | — |

**Data source:** All inline mock data (`validationResults`, `timeSeriesComparison`, `regimePerformance`, `walkForwardResults`, `statisticalTests`, `featureImportance`). No React Query hook. No external mock import.

---

### A7. Execution Research (`/service/research/execution/algos`)

```
Task: A7
Status: PASS
Component/Route: AlgoComparisonPage
Finding: Algo comparison with side-by-side mode, sortable table, recent backtests grid. 302 lines.
Severity: —
Recommendation: —
```

| Component | Source | Props | Data Source |
| --------- | ------ | ----- | ---------- |
| `ExecutionNav` | `@/components/execution-platform/execution-nav` | — | — |
| `Card` components | `@/components/ui/card` | — | — |
| `Badge` | `@/components/ui/badge` | — | — |
| `Checkbox` | `@/components/ui/checkbox` | Compare selection | — |

**Data source:** Imports from `@/lib/execution-platform-mock-data` (`MOCK_EXECUTION_ALGOS`, `MOCK_ALGO_BACKTESTS`).

---

## B. Orphan Pages Audit

### B1. ML Orphan Pages (9 pages)

```
Task: B1
Status: ISSUE
Component/Route: Routes 8–16
Finding: 9 ML orphan pages exist with no BUILD_TABS entry. Discoverability varies widely — some are linked from Research Hub and sub-nav, others are URL-only.
Severity: P2-improve
Recommendation: Add in-page sub-navigation (MLNav is available but only used on ml/overview). Consider adding most-accessed orphans to BUILD_TABS or a secondary nav tier.
```

| # | Route | Lines | Discoverable From | Sub-Nav | routeMappings |
| - | ----- | ----- | ----------------- | ------- | ------------- |
| 8 | `/service/research/ml/overview` | 451 | Research Hub "Open ML Dashboard" link | Uses `MLNav` | ✓ build |
| 9 | `/service/research/ml/experiments` | 509 | Research Hub "View Experiments" link; MLNav | — | ✓ build |
| 10 | `/service/research/ml/experiments/[id]` | 461 | experiments list row click | — | ✗ (prefix match to experiments) |
| 11 | `/service/research/ml/training` | 416 | MLNav; ml/overview "Training Jobs" link | — | ✓ build |
| 12 | `/service/research/ml/registry` | 454 | MLNav | — | ✓ build (secondary: promote) |
| 13 | `/service/research/ml/monitoring` | 437 | MLNav; ml/overview "Monitoring" link | — | ✓ observe |
| 14 | `/service/research/ml/deploy` | 363 | MLNav; ml/overview "Deploy" link | — | ✓ promote |
| 15 | `/service/research/ml/governance` | 412 | MLNav | — | ✓ manage |
| 16 | `/service/research/ml/config` | 457 | URL-only | — | ✗ |

**Key finding:** `MLNav` component uses `/ml/*` hrefs (e.g., `/ml/overview`), NOT `/service/research/ml/*`. These links are **broken** — they navigate to non-existent pages outside the research layout. This means MLNav provides zero actual discoverability. Only direct links from the Research Hub page and other ML pages provide navigation.

---

### B2. Strategy Orphan Pages (3 pages)

```
Task: B2
Status: ISSUE
Component/Route: Routes 17–19
Finding: 3 strategy orphan pages have limited discoverability. StrategyPlatformNav uses /strategy-platform/* hrefs — also broken links.
Severity: P2-improve
Recommendation: Fix StrategyPlatformNav hrefs to use /service/research/strategy/* prefix. Add strategy/overview as a sub-tab or entry point.
```

| # | Route | Lines | Discoverable From | Sub-Nav | routeMappings |
| - | ----- | ----- | ----------------- | ------- | ------------- |
| 17 | `/service/research/strategy/overview` | 459 | URL-only | Uses `StrategyPlatformNav` (broken hrefs) | ✗ |
| 18 | `/service/research/strategy/results` | 416 | URL-only (potentially from backtest row click) | Uses `ContextBar`, `BatchLiveRail` | ✓ build |
| 19 | `/service/research/strategy/heatmap` | 335 | Research Hub "Backtest" workflow step link | Uses `StrategyPlatformNav` (broken hrefs) | ✓ build |

---

### B3. Execution & Quant Orphan Pages (3 pages)

```
Task: B3
Status: ISSUE
Component/Route: Routes 20–22
Finding: 2 execution orphans use ExecutionNav with /execution/* hrefs (broken — should be /service/research/execution/*). Quant page is a standalone dashboard wrapper.
Severity: P2-improve
Recommendation: Fix ExecutionNav hrefs for research context. Consider whether quant page should be promoted to a tab or merged into Research Hub.
```

| # | Route | Lines | Discoverable From | Sub-Nav | routeMappings |
| - | ----- | ----- | ----------------- | ------- | ------------- |
| 20 | `/service/research/execution/venues` | 307 | Research Hub "Venues" workflow link | Uses `ExecutionNav` (broken hrefs) | ✓ build (secondary: acquire) |
| 21 | `/service/research/execution/benchmarks` | 335 | Research Hub "Benchmarks" workflow link | Uses `ExecutionNav` (broken hrefs) | ✓ build |
| 22 | `/service/research/quant` | 8 | URL-only | Renders `QuantDashboard` | ✗ |

---

## C. Navigation & Routing

### C1. Tab Active State

```
Task: C1
Status: PASS
Component/Route: ServiceTabs active logic
Finding: Tab highlighting logic works correctly for all 7 tabs in isolation.
Severity: —
Recommendation: —
```

The active-state logic in `ServiceTabs`:

```
isActive = pathname === tab.href || pathname.startsWith(matchPath + "/")
```

| Tab | href | matchPrefix | Active when... |
| --- | ---- | ----------- | -------------- |
| Research Hub | `/service/research/overview` | (href) | Exactly `/service/research/overview` |
| Features | `/service/research/ml/features` | (href) | Exactly `/service/research/ml/features` |
| ML Models | `/service/research/ml` | `/service/research/ml` | `/service/research/ml` OR `/service/research/ml/*` |
| Strategies | `/service/research/strategy/backtests` | `/service/research/strategy` | `/service/research/strategy/backtests` OR `/service/research/strategy/*` |
| Backtests | `/service/research/strategy/compare` | (href) | Exactly `/service/research/strategy/compare` |
| Signals | `/service/research/ml/validation` | (href) | Exactly `/service/research/ml/validation` |
| Execution Research | `/service/research/execution/algos` | `/service/research/execution` | `/service/research/execution/algos` OR `/service/research/execution/*` |

---

### C2. matchPrefix Overlap

```
Task: C2
Status: ISSUE
Component/Route: ML Models vs Features vs Signals tab highlighting
Finding: ML Models matchPrefix /service/research/ml overlaps with Features (/service/research/ml/features) and Signals (/service/research/ml/validation). On orphan ML pages, ML Models highlights — correct. But Features and Signals NEVER highlight because ML Models is checked first by iteration order.
Severity: P1-fix
Recommendation: Either: (a) Add explicit matchPrefix to Features and Signals tabs that takes priority, or (b) Change the active-state algorithm to prefer exact href match before prefix match, or (c) Use more specific matchPrefixes.
```

**Detail:**

The `tabs.map()` iterates in order. Each tab checks `pathname.startsWith(matchPath + "/")`. For Features at `/service/research/ml/features`:

- ML Models: `matchPath = "/service/research/ml"` → `"/service/research/ml/features".startsWith("/service/research/ml/")` → **TRUE**
- Features: `matchPath = "/service/research/ml/features"` → `"/service/research/ml/features" === "/service/research/ml/features"` → **TRUE** (exact match)

Since the check is `pathname === tab.href || pathname.startsWith(matchPath + "/")`, both ML Models AND Features show as active. The UI renders both with `border-primary text-primary`. This is a **dual-highlight bug**: when on `/service/research/ml/features`, both ML Models and Features tabs appear active.

Similarly for Signals at `/service/research/ml/validation`: both ML Models and Signals tabs highlight.

**On orphan ML pages** (e.g., `/service/research/ml/training`): only ML Models highlights — correct.

---

### C3. Lifecycle Nav Highlight

```
Task: C3
Status: ISSUE
Component/Route: lifecycle-nav.tsx + getRouteMapping()
Finding: Lifecycle nav highlights correctly for pages WITH routeMappings entries. But 4 research routes have no routeMappings and get no lifecycle highlight. Multi-stage orphans correctly show their primary stage (not Build) — but this creates a mismatch where Row 1 shows e.g. Observe while Row 2 shows BUILD_TABS.
Severity: P1-fix
Recommendation: Add routeMappings entries for /service/research/ml/experiments/[id], /service/research/ml/config, /service/research/strategy/overview, /service/research/quant. Document that multi-stage orphans intentionally show mismatched Row 1 vs Row 2.
```

| Route | getRouteMapping() result | Lifecycle highlight | Row 2 tabs | Mismatch? |
| ----- | ------------------------ | ------------------- | ---------- | --------- |
| `/service/research/ml/experiments/[id]` | prefix-matches `/service/research/ml/experiments` → build | Build ✓ | BUILD_TABS ✓ | No |
| `/service/research/ml/config` | No match | None ✗ | BUILD_TABS | Yes — no lifecycle highlight |
| `/service/research/strategy/overview` | No match | None ✗ | BUILD_TABS | Yes — no lifecycle highlight |
| `/service/research/quant` | No match | None ✗ | BUILD_TABS | Yes — no lifecycle highlight |
| `/service/research/ml/monitoring` | observe | Observe | BUILD_TABS | Yes — Row 1 ≠ Row 2 |
| `/service/research/ml/deploy` | promote | Promote | BUILD_TABS | Yes — Row 1 ≠ Row 2 |
| `/service/research/ml/governance` | manage | Manage | BUILD_TABS | Yes — Row 1 ≠ Row 2 |

---

### C4. Internal Navigation

```
Task: C4
Status: INFO
Component/Route: All research internal links
Finding: Research Hub serves as the primary navigation hub with links to 16 of 22 research pages. Sub-nav components (MLNav, StrategyPlatformNav, ExecutionNav) exist but use WRONG href prefixes — they link to /ml/*, /strategy-platform/*, /execution/* instead of /service/research/ml/*, /service/research/strategy/*, /service/research/execution/*.
Severity: P1-fix
Recommendation: Fix all three sub-nav components to use /service/research/ prefixes. This is the single highest-impact bug — fixing it makes all 15 orphan pages navigable.
```

**Navigation flow:**

```
Research Hub (overview)
├── ML tab → ml/overview → (MLNav links BROKEN) → training, experiments, registry, validation, deploy, monitoring, features, governance
├── Strategy tab → strategy/backtests → (StrategyPlatformNav links BROKEN) → overview, compare, results, heatmap, candidates, handoff
└── Execution tab → execution/algos → (ExecutionNav links BROKEN) → overview, venues, tca, benchmarks, candidates, handoff
```

---

### C5. Cross-Lifecycle Links

```
Task: C5
Status: INFO
Component/Route: Cross-lifecycle references from research pages
Finding: Research Hub links to 3 "Upgrade" pages outside research (marketing pages). No other research pages link outside /service/research/.
Severity: —
Recommendation: —
```

| Source | Target | Context |
| ------ | ------ | ------- |
| Research Hub | `/service/ml` | "Upgrade to access" badge link (ML section) |
| Research Hub | `/service/research-backtesting` | "Upgrade to access" badge link (Strategy section) |
| Research Hub | `/service/execution` | "Upgrade to access" badge link (Execution section) |

---

## D. Data Wiring

### D1. React Query Hooks

```
Task: D1
Status: INFO
Component/Route: hooks/api/
Finding: Comprehensive React Query hooks exist for strategy and ML data. However, most research pages import mock data DIRECTLY instead of using these hooks.
Severity: P2-improve
Recommendation: Migrate pages to use React Query hooks instead of direct mock imports. This is prerequisite for MSW → real API migration.
```

| Hook File | Hook | queryKey | Used By Page |
| --------- | ---- | -------- | ------------ |
| `use-ml-models.ts` | `useModelFamilies` | `model-families` | **Not used by any research page** |
| `use-ml-models.ts` | `useExperiments` | `experiments` | **Not used by any research page** |
| `use-ml-models.ts` | `useTrainingRuns` | `training-runs` | **Not used by any research page** |
| `use-ml-models.ts` | `useModelVersions` | `model-versions` | **Not used by any research page** |
| `use-ml-models.ts` | `useMLDeployments` | `ml-deployments` | **Not used by any research page** |
| `use-ml-models.ts` | `useFeatureProvenance` | `feature-provenance` | **Not used by any research page** |
| `use-ml-models.ts` | `useDatasets` | `datasets` | **Not used by any research page** |
| `use-strategies.ts` | `useStrategyTemplates` | `strategy-templates` | **Not used by any research page** |
| `use-strategies.ts` | `useStrategyConfigs` | `strategy-configs` | **Not used by any research page** |
| `use-strategies.ts` | `useBacktests` | `backtests` | **Not used by any research page** |
| `use-strategies.ts` | `useStrategyCandidates` | `strategy-candidates` | **Not used by any research page** |
| `use-strategies.ts` | `useStrategyAlerts` | `strategy-alerts` | **Not used by any research page** |

---

### D2. Flat Mock Files

```
Task: D2
Status: ISSUE
Component/Route: Research mock data sources
Finding: All 22 research pages use either imported flat mock files or inline mock data. Zero pages use React Query hooks.
Severity: P2-improve
Recommendation: Phase 3+ should migrate to React Query hooks with MSW handlers providing the mock layer.
```

| Page | Data Source | Type |
| ---- | ---------- | ---- |
| overview | Inline constants (`ML_WORKFLOWS`, `STRATEGY_WORKFLOWS`, `EXECUTION_WORKFLOWS`, stats) | Inline |
| ml/features | Inline constants (`featureCatalog`, `featureHistory`, `featureUsageMatrix`) | Inline |
| ml (models) | `@/lib/ml-mock-data` (`MODEL_FAMILIES`, `EXPERIMENTS`, `TRAINING_RUNS`, `FEATURE_PROVENANCE`, `ML_ALERTS`) | Import |
| strategy/backtests | `@/lib/strategy-platform-mock-data` (`BACKTEST_RUNS`, `STRATEGY_TEMPLATES`, etc.) | Import |
| strategy/compare | `@/lib/strategy-platform-mock-data` (`STRATEGY_CONFIGS`, `BACKTEST_RUNS`) | Import |
| ml/validation | Inline constants (6 mock data objects) | Inline |
| execution/algos | `@/lib/execution-platform-mock-data` (`MOCK_EXECUTION_ALGOS`, `MOCK_ALGO_BACKTESTS`) | Import |
| ml/overview | `@/lib/ml-mock-data` + inline | Import + Inline |
| ml/experiments | `@/lib/ml-mock-data` | Import |
| ml/experiments/[id] | `@/lib/ml-mock-data` | Import |
| ml/training | `@/lib/ml-mock-data` | Import |
| ml/registry | `@/lib/ml-mock-data` | Import |
| ml/monitoring | Inline mock data | Inline |
| ml/deploy | Inline mock data | Inline |
| ml/governance | Inline mock data | Inline |
| ml/config | `@/lib/ml-mock-data` | Import |
| strategy/overview | `@/lib/strategy-platform-mock-data` | Import |
| strategy/results | `@/lib/strategy-platform-mock-data` | Import |
| strategy/heatmap | Inline mock data | Inline |
| execution/venues | `@/lib/execution-platform-mock-data` | Import |
| execution/benchmarks | Inline mock data | Inline |
| quant | `QuantDashboard` (internal mock) | Component |

---

### D3. MSW Handler Coverage

```
Task: D3
Status: PASS
Component/Route: lib/mocks/handlers/
Finding: MSW handlers exist for ML and strategy endpoints. Execution handler exists for algo-backtests. The handlers are wired in handlers/index.ts.
Severity: —
Recommendation: —
```

| Handler | Endpoints | Covers Pages |
| ------- | --------- | ------------ |
| `handlers/ml.ts` | `/api/ml/model-families`, `/api/ml/experiments`, `/api/ml/training-runs`, `/api/ml/versions`, `/api/ml/deployments`, `/api/ml/features`, `/api/ml/datasets` | ml/*, ml/experiments, ml/training, ml/registry, ml/features |
| `handlers/strategy.ts` | `/api/strategy/templates`, `/api/strategy/configs`, `/api/strategy/backtests`, `/api/strategy/candidates`, `/api/strategy/alerts` | strategy/backtests, strategy/compare, strategy/overview |
| `handlers/execution.ts` | `/api/execution/algo-backtests` | execution/algos |

**Gap:** No MSW handlers for: ml/monitoring, ml/deploy, ml/governance, ml/config, ml/validation, strategy/results, strategy/heatmap, execution/venues, execution/benchmarks. These pages use inline mock data.

---

### D4. Strategy/ML Data Model

```
Task: D4
Status: ISSUE
Component/Route: Shared types
Finding: Shared type files exist (ml-types.ts, strategy-platform-types.ts) but many pages define inline types instead of importing from them.
Severity: P3-cosmetic
Recommendation: Consolidate inline type definitions to shared type files.
```

| Type File | Types | Used By |
| --------- | ----- | ------- |
| `lib/ml-types.ts` | `ModelFamily`, `Experiment`, `ModelVersion`, `TrainingRun`, `DatasetSnapshot`, `FeatureSetVersion`, `FeatureProvenance`, `LiveDeployment` | ml page, ml/experiments, ml/training, ml/registry, ml/config |
| `lib/strategy-platform-types.ts` | `StrategyTemplate`, `StrategyConfig`, `BacktestRun`, `BacktestMetrics`, `StrategyCandidate`, `StrategyAlert` | strategy/backtests, strategy/compare, strategy/overview |
| `lib/execution-platform-mock-data.ts` | Inline types only | execution/algos, execution/venues |

---

## E. UX Audit

### E1. Loading States

```
Task: E1
Status: ISSUE
Component/Route: All 22 research pages
Finding: ZERO research pages implement loading states (Skeleton, Spinner, isLoading). All pages render immediately with mock data — no async data fetching.
Severity: P1-fix
Recommendation: When migrating to React Query hooks, every page must add Skeleton/loading states for the async fetch period.
```

| Page | Loading pattern |
| ---- | -------------- |
| All 22 pages | None — mock data is synchronously available, rendered immediately |

---

### E2. Error States

```
Task: E2
Status: ISSUE
Component/Route: All 22 research pages
Finding: ZERO research pages implement error boundaries, error toasts, or inline error displays. Some pages reference "error" as a data field (e.g., errorRate in monitoring, status-error CSS class) but no actual error handling UI exists.
Severity: P1-fix
Recommendation: When migrating to React Query, add error boundaries at the layout level and inline error states per page.
```

---

### E3. Empty States

```
Task: E3
Status: ISSUE
Component/Route: All 22 research pages
Finding: ZERO research pages implement empty states (no data, no results). All render with pre-populated mock data.
Severity: P2-improve
Recommendation: Add empty state illustrations/messages for: empty experiment list, empty backtest results, empty feature catalog, empty model registry.
```

---

### E4. Responsive Behavior

```
Task: E4
Status: INFO
Component/Route: All 7 tab pages
Finding: Only 2 of 7 tab pages use responsive breakpoint classes. Research Hub has the best responsive support (sm:, md:, lg:). Strategy/Backtests has minimal (sm:max-w-lg for dialog). Other tab pages use fixed grid-cols with no responsive variants.
Severity: P2-improve
Recommendation: Add responsive breakpoints to all tab pages, especially tables and grids that will overflow on mobile.
```

| Tab Page | Responsive Classes |
| -------- | ------------------ |
| Research Hub | `sm:grid-cols-2`, `lg:grid-cols-3`, `md:grid-cols-4`, `grid-cols-1` |
| Features | None |
| ML Models | None |
| Strategies (backtests) | `sm:max-w-lg` (dialog only) |
| Backtests (compare) | None |
| Signals (validation) | None |
| Execution Research | None |

---

### E5. Live/As-Of Toggle

```
Task: E5
Status: PASS
Component/Route: research layout → LiveAsOfToggle
Finding: LiveAsOfToggle is rendered in the research layout when LIVE_ASOF_VISIBLE.build is true (which it is). The toggle appears in the service tabs right slot for all research pages.
Severity: —
Recommendation: —
```

The toggle is rendered at the layout level via:

```tsx
rightSlot={LIVE_ASOF_VISIBLE.build ? <LiveAsOfToggle /> : undefined}
```

Individual research pages do not reference the toggle directly. The toggle is cosmetic in the current mock state — no pages consume the live/as-of context for data switching.

---

## F. Entitlement Gating

### F1. ml-full Gating

```
Task: F1
Status: ISSUE
Component/Route: Features, ML Models, Signals tabs + research layout
Finding: Tab-level gating works correctly — Features, ML Models, and Signals show lock icon when user lacks ml-full. However, nav-level gating uses a different check (strategy-full OR ml-full for entire /service/research/* prefix). A user with execution-basic but no ml-full/strategy-full is blocked at nav level from ALL research pages, even though execution/algos tab only requires execution-basic.
Severity: P1-fix
Recommendation: Align nav-level isItemAccessible with tab-level entitlements. Either: (a) remove the /service/research/* nav block and let tab-level handle it, or (b) make nav check per-route not per-prefix.
```

**Test: client-data-only (entitlements: ["data-basic"])**

| Tab | Tab Lock | Nav Lock | URL Direct | Result |
| --- | -------- | -------- | ---------- | ------ |
| Research Hub | ✗ no gate | ✓ locked (needs strategy-full/ml-full) | Accessible | Nav-locked but URL-bypass works |
| Features | ✓ locked (ml-full) | ✓ locked | Accessible but tab locked | Consistent |
| ML Models | ✓ locked (ml-full) | ✓ locked | Accessible but tab locked | Consistent |
| Strategies | ✓ locked (strategy-full) | ✓ locked | Accessible but tab locked | Consistent |
| Backtests | ✓ locked (strategy-full) | ✓ locked | Accessible but tab locked | Consistent |
| Signals | ✓ locked (ml-full) | ✓ locked | Accessible but tab locked | Consistent |
| Execution Research | ✓ locked (execution-basic) | ✓ locked | **Accessible and tab-unlockable** | **GAP** — user has none of the required entitlements |

**Test: user with only execution-basic**

- Nav blocks all `/service/research/*` — needs strategy-full OR ml-full
- But Execution Research tab only requires execution-basic
- User cannot reach the page via nav but CAN via direct URL
- On direct URL visit, tab shows as unlocked (correct per tab entitlement) but nav shows locked state

---

### F2. strategy-full Gating

```
Task: F2
Status: ISSUE
Component/Route: Strategies, Backtests tabs
Finding: Tab-level gating works correctly for strategy-full. A client-premium user (has strategy-full, no ml-full) sees Strategies and Backtests unlocked but ML-related tabs (Features, ML Models, Signals) locked. Correct behavior.
Severity: —
Recommendation: No change needed for tab-level. Nav-level gap from F1 applies here too.
```

**Test: client-premium (entitlements: ["data-pro", "execution-full", "strategy-full"])**

| Tab | Tab Lock | Nav Lock | Result |
| --- | -------- | -------- | ------ |
| Research Hub | ✗ unlocked | ✓ accessible (has strategy-full) | ✓ Correct |
| Features | ✓ locked (ml-full) | accessible | Tab locked, correct |
| ML Models | ✓ locked (ml-full) | accessible | Tab locked, correct |
| Strategies | ✗ unlocked | accessible | ✓ Correct |
| Backtests | ✗ unlocked | accessible | ✓ Correct |
| Signals | ✓ locked (ml-full) | accessible | Tab locked, correct |
| Execution Research | ✗ unlocked | accessible | ✓ Correct |

---

### F3. execution-basic Gating

```
Task: F3
Status: INFO
Component/Route: Execution Research tab
Finding: Execution Research tab correctly shows lock for users without execution-basic. The issue is at the nav level (F1) where /service/research/* requires strategy-full OR ml-full, not execution-basic.
Severity: P1-fix (covered by F1)
Recommendation: See F1.
```

---

## G. Cross-Reference Markers

### G1. Shared Components

```
Task: G1
Status: INFO
Component/Route: Components used in research AND other areas
Finding: 3 components are shared between research pages and non-research pages. These are Phase 3 targets for cross-reference analysis.
Severity: —
Recommendation: Document for Phase 3.
```

| Component | Research Pages | Non-Research Pages |
| --------- | -------------- | ------------------ |
| `KPICard` | ml/overview | dashboard |
| `EntityLink` | ml/overview, ml/training, ml/experiments/[id] | strategies, trading/markets, reports, data/markets, ops, config |
| `ExecutionNav` | execution/algos, execution/venues, execution/benchmarks, execution/tca | service/execution/* (6 pages) |

---

### G2. Promote-Stage Routes in Research Layout

```
Task: G2
Status: ISSUE
Component/Route: /service/research/strategy/candidates, /service/research/execution/tca, /service/research/strategy/handoff
Finding: These routes are defined in PROMOTE_TABS but served by the research layout. User experience: Row 1 lifecycle nav highlights Promote (correct via routeMappings), but Row 2 shows BUILD_TABS (incorrect — should show PROMOTE_TABS).
Severity: P1-fix
Recommendation: Implement contextual tab switching in the research layout based on routeMappings primaryStage, or create a promote layout.
```

**Detailed UX for `/service/research/strategy/candidates`:**

1. User clicks Promote in lifecycle nav → dropdown shows "Strategy Candidates"
2. User clicks → navigates to `/service/research/strategy/candidates`
3. `getRouteMapping("/service/research/strategy/candidates")` returns `primaryStage: "promote"`
4. Row 1: Promote tab highlights ✓
5. Page renders under `service/research/layout.tsx` → BUILD_TABS in Row 2
6. Row 2: Research Hub | Features | ML Models | **Strategies** (active via matchPrefix) | Backtests | Signals | Execution Research
7. User sees mismatched layers: Promote context in Row 1, Build tabs in Row 2

Same issue for `/service/research/execution/tca` (primaryStage: observe) and `/service/research/strategy/handoff` (primaryStage: promote).

---

### G3. Multi-Stage Orphans

```
Task: G3
Status: ISSUE
Component/Route: /service/research/ml/monitoring, /service/research/ml/deploy, /service/research/ml/governance
Finding: These pages are under /service/research/ but mapped to observe, promote, and manage lifecycle stages respectively. Row 1 correctly shows their primary stage. Row 2 shows BUILD_TABS. The mismatch is intentional from a file-system perspective (they live in research) but confusing for users.
Severity: P2-improve
Recommendation: Options: (a) Accept the mismatch and document it, (b) Move these pages to their own layouts under /service/observe/, /service/promote/, /service/manage/, (c) Implement stage-aware tab switching in the research layout.
```

| Route | primaryStage | Row 1 Highlight | Row 2 Tabs | User Impact |
| ----- | ------------ | --------------- | ---------- | ----------- |
| `/service/research/ml/monitoring` | observe | Observe | BUILD_TABS | User navigating from Observe stage lands on a page showing Build tabs |
| `/service/research/ml/deploy` | promote | Promote | BUILD_TABS | Same mismatch |
| `/service/research/ml/governance` | manage | Manage | BUILD_TABS | Same mismatch |

---

## Priority Summary

### P1-fix (7 items)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| C2 | matchPrefix overlap: ML Models + Features + Signals dual-highlight | Fix active-state algorithm to prefer exact match |
| C3 | 4 routes missing from routeMappings; multi-stage mismatch | Add missing routeMappings entries |
| C4 | MLNav, StrategyPlatformNav, ExecutionNav use wrong href prefixes | Fix to use `/service/research/` prefixes |
| E1 | Zero loading states on all 22 pages | Add Skeleton/loading when migrating to React Query |
| E2 | Zero error states on all 22 pages | Add error boundaries and inline error UI |
| F1 | Nav-level blocks execution-basic users from Research Hub despite tab allowing it | Align isItemAccessible with tab entitlements |
| G2 | Promote-stage routes show BUILD_TABS | Implement contextual tab switching or promote layout |

### P2-improve (6 items)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| B1 | 9 ML orphan pages with limited discoverability | Fix MLNav hrefs; add secondary nav tier |
| B2 | 3 strategy orphan pages with broken StrategyPlatformNav | Fix hrefs to `/service/research/strategy/` |
| B3 | 3 execution/quant orphan pages with broken ExecutionNav | Fix hrefs to `/service/research/execution/` |
| D1 | React Query hooks exist but unused by research pages | Migrate pages to use hooks |
| E3 | Zero empty states | Add empty state UI |
| E4 | 5 of 7 tab pages have no responsive breakpoints | Add responsive classes |

### P3-cosmetic (2 items)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| D4 | Pages define inline types instead of using shared type files | Consolidate to ml-types.ts / strategy-platform-types.ts |
| Phase 1 F1 | RESEARCH_TABS alias is dead code | Remove export |
