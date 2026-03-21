# Phase 2b: Build Tab — Component Inventory

**Generated:** 2026-03-21 | **Source:** Phase 2b Audit

**Note:** Mock data mirrors real API responses. "Data Source" column documents where mock data comes from for reference. When real APIs are connected, the data shape will be identical — only the transport layer changes.

---

## Tab Pages (7)

| # | Tab | Route | File | Lines | Key Components | Data Source |
| - | --- | ----- | ---- | ----- | -------------- | ----------- |
| 1 | Research Hub | `/service/research/overview` | `app/(platform)/service/research/overview/page.tsx` | 252 | Tabs, WorkflowPipeline (local), Card, Badge, Button, useAuth | Inline constants |
| 2 | Features | `/service/research/ml/features` | `app/(platform)/service/research/ml/features/page.tsx` | 437 | Card, Badge, Input, Select, detail panel, usage matrix | Inline mock data |
| 3 | ML Models | `/service/research/ml` | `app/(platform)/service/research/ml/page.tsx` | 434 | Card, Badge, Dialog (Train New Model), Select, KPI cards | `@/lib/ml-mock-data` |
| 4 | Strategies | `/service/research/strategy/backtests` | `app/(platform)/service/research/strategy/backtests/page.tsx` | 477 | Card, Badge, Dialog (Run New Backtest), Select, Input, sortable table, candidate basket | `@/lib/strategy-platform-mock-data` |
| 5 | Backtests | `/service/research/strategy/compare` | `app/(platform)/service/research/strategy/compare/page.tsx` | 451 | ContextBar, BatchLiveRail, Card, Select, Badge, parameter diff table | `@/lib/strategy-platform-mock-data` |
| 6 | Signals | `/service/research/ml/validation` | `app/(platform)/service/research/ml/validation/page.tsx` | 538 | Card, Badge, Tabs (5 analysis tabs), Alert, Progress, charts | Inline mock data |
| 7 | Execution Research | `/service/research/execution/algos` | `app/(platform)/service/research/execution/algos/page.tsx` | 302 | ExecutionNav, Card, Badge, Checkbox, comparison table | `@/lib/execution-platform-mock-data` |

---

## Orphan Pages — ML (9)

| # | Route | File | Lines | Key Components | Data Source | Sub-Nav |
| - | ----- | ---- | ----- | -------------- | ----------- | ------- |
| 8 | `/service/research/ml/overview` | `ml/overview/page.tsx` | 451 | MLNav, EntityLink, KPICard, lifecycle rail, health grid | `@/lib/ml-mock-data` + inline | MLNav (broken hrefs) |
| 9 | `/service/research/ml/experiments` | `ml/experiments/page.tsx` | 509 | Card, Dialog (New Experiment), table, comparison | `@/lib/ml-mock-data` | — |
| 10 | `/service/research/ml/experiments/[id]` | `ml/experiments/[id]/page.tsx` | 461 | LossCurves, EntityLink, Tabs (6), Recharts | `@/lib/ml-mock-data` | — |
| 11 | `/service/research/ml/training` | `ml/training/page.tsx` | 416 | Card, job list, job details, logs, artifacts | `@/lib/ml-mock-data` | — |
| 12 | `/service/research/ml/registry` | `ml/registry/page.tsx` | 454 | Card, champion/challenger pairs, versions table, deploy dialog | `@/lib/ml-mock-data` | — |
| 13 | `/service/research/ml/monitoring` | `ml/monitoring/page.tsx` | 437 | Card, real-time charts, models table, feature health, alerts | Inline mock data | — |
| 14 | `/service/research/ml/deploy` | `ml/deploy/page.tsx` | 363 | Card, readiness checklist, rollout stages, deployment config | Inline mock data | — |
| 15 | `/service/research/ml/governance` | `ml/governance/page.tsx` | 412 | Card, Tabs (Approvals, Audit Log, Access Control, Compliance) | Inline mock data | — |
| 16 | `/service/research/ml/config` | `ml/config/page.tsx` | 457 | Card, step wizard (6 steps), model family selector, feature sets, parameter grid | `@/lib/ml-mock-data` | — |

---

## Orphan Pages — Strategy (3)

| # | Route | File | Lines | Key Components | Data Source | Sub-Nav |
| - | ----- | ---- | ----- | -------------- | ----------- | ------- |
| 17 | `/service/research/strategy/overview` | `strategy/overview/page.tsx` | 459 | Card, KPI cards, configs table, backtests list, alerts, New Backtest dialog | `@/lib/strategy-platform-mock-data` | StrategyPlatformNav (broken) |
| 18 | `/service/research/strategy/results` | `strategy/results/page.tsx` | 416 | ContextBar, BatchLiveRail, Card, Tabs (PnL, Drawdown, Regime, Attribution) | `@/lib/strategy-platform-mock-data` | — |
| 19 | `/service/research/strategy/heatmap` | `strategy/heatmap/page.tsx` | 335 | StrategyPlatformNav (broken), Card, heatmap grid, dimension selectors | Inline mock data | StrategyPlatformNav (broken) |

---

## Orphan Pages — Execution & Quant (3)

| # | Route | File | Lines | Key Components | Data Source | Sub-Nav |
| - | ----- | ---- | ----- | -------------- | ----------- | ------- |
| 20 | `/service/research/execution/venues` | `execution/venues/page.tsx` | 307 | ExecutionNav (broken), Card, venue grid, routing matrix | `@/lib/execution-platform-mock-data` | ExecutionNav (broken) |
| 21 | `/service/research/execution/benchmarks` | `execution/benchmarks/page.tsx` | 335 | ExecutionNav (broken), Card, KPI cards, benchmark table, heatmap | Inline mock data | ExecutionNav (broken) |
| 22 | `/service/research/quant` | `quant/page.tsx` | 8 | QuantDashboard | Component-internal mock | — |

---

## Shared Component Map

| Component | Location | Research Pages Using | Non-Research Pages Using |
| --------- | -------- | -------------------- | ------------------------ |
| `Card / CardContent / CardHeader / CardTitle` | `@/components/ui/card` | All 22 pages | Everywhere |
| `Badge` | `@/components/ui/badge` | All 22 pages | Everywhere |
| `Button` | `@/components/ui/button` | 18 pages | Everywhere |
| `Tabs / TabsList / TabsTrigger / TabsContent` | `@/components/ui/tabs` | overview, ml/validation, ml/governance | Multiple |
| `Dialog / DialogContent / DialogHeader / DialogTitle` | `@/components/ui/dialog` | ml (models), strategy/backtests, ml/experiments, ml/registry, strategy/overview | Multiple |
| `Select / SelectContent / SelectItem / SelectTrigger` | `@/components/ui/select` | ml (models), strategy/backtests, ml/features, strategy/compare, strategy/heatmap | Multiple |
| `Input` | `@/components/ui/input` | ml/features, strategy/backtests | Multiple |
| `Checkbox` | `@/components/ui/checkbox` | execution/algos | Multiple |
| `Alert / AlertDescription / AlertTitle` | `@/components/ui/alert` | ml/validation | Multiple |
| `Progress` | `@/components/ui/progress` | ml/validation | Multiple |
| `ContextBar` | `@/components/platform/context-bar` | strategy/compare, strategy/results | **Research only** |
| `BatchLiveRail` | `@/components/platform/batch-live-rail` | strategy/compare, strategy/results | **Research only** |
| `ExecutionNav` | `@/components/execution-platform/execution-nav` | execution/algos, execution/venues, execution/benchmarks | service/execution/* (6 pages) |
| `MLNav` | `@/components/ml/ml-nav` | ml/overview | **Research only** |
| `StrategyPlatformNav` | `@/components/strategy-platform/strategy-nav` | strategy/heatmap, strategy/handoff | **Research only** |
| `KPICard` | `@/components/trading/kpi-card` | ml/overview | dashboard |
| `EntityLink` | `@/components/trading/entity-link` | ml/overview, ml/training, ml/experiments/[id] | strategies, trading, reports, data, ops, config |
| `LossCurves` | `@/components/ml/loss-curves` | ml/experiments/[id] | **Research only** |
| `QuantDashboard` | `@/components/dashboards/quant-dashboard` | quant | **Research only** |
| `LiveAsOfToggle` | `@/components/platform/live-asof-toggle` | research layout (all pages) | data, trading, execution layouts |

---

## Total Lines by Area

| Area | Pages | Total Lines |
| ---- | ----- | ----------- |
| Tab pages (7) | 7 | 2,891 |
| ML orphans (9) | 9 | 3,960 |
| Strategy orphans (3) | 3 | 1,210 |
| Execution/quant orphans (3) | 3 | 650 |
| **Total** | **22** | **8,711** |
