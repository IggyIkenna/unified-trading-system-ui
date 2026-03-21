# Phase 2b: Build Tab — Data Wiring Matrix

**Generated:** 2026-03-21 | **Source:** Phase 2b Audit

---

## Overview

The Build tab ecosystem has **three data layers** that are currently disconnected:

```
Layer 1: React Query Hooks (hooks/api/use-ml-models.ts, use-strategies.ts)
   ↕ NOT CONNECTED
Layer 2: MSW Handlers (lib/mocks/handlers/ml.ts, strategy.ts, execution.ts)
   ↕ NOT CONNECTED
Layer 3: Pages (direct import from lib/*-mock-data.ts or inline constants)
```

**Target state:** Pages → React Query Hooks → fetch() → MSW intercepts → returns mock data
**Current state:** Pages → direct import from flat mock files OR inline constants

---

## Per-Page Data Source Matrix

| # | Page | React Query Hook | MSW Handler | Flat Mock Import | Inline Mock | Status |
| - | ---- | ---------------- | ----------- | ---------------- | ----------- | ------ |
| 1 | overview | — | — | — | ✓ (workflow defs, stats) | Inline only |
| 2 | ml/features | — | — | — | ✓ (featureCatalog, featureHistory, featureUsageMatrix) | Inline only |
| 3 | ml (models) | — | ✓ ml.ts | ✓ ml-mock-data.ts | — | Import, not via hook |
| 4 | strategy/backtests | — | ✓ strategy.ts | ✓ strategy-platform-mock-data.ts | — | Import, not via hook |
| 5 | strategy/compare | — | ✓ strategy.ts | ✓ strategy-platform-mock-data.ts | — | Import, not via hook |
| 6 | ml/validation | — | — | — | ✓ (6 inline objects) | Inline only |
| 7 | execution/algos | — | ✓ execution.ts | ✓ execution-platform-mock-data.ts | — | Import, not via hook |
| 8 | ml/overview | — | ✓ ml.ts | ✓ ml-mock-data.ts | ✓ (some inline) | Mixed |
| 9 | ml/experiments | — | ✓ ml.ts | ✓ ml-mock-data.ts | — | Import, not via hook |
| 10 | ml/experiments/[id] | — | ✓ ml.ts | ✓ ml-mock-data.ts | — | Import, not via hook |
| 11 | ml/training | — | ✓ ml.ts | ✓ ml-mock-data.ts | — | Import, not via hook |
| 12 | ml/registry | — | ✓ ml.ts | ✓ ml-mock-data.ts | — | Import, not via hook |
| 13 | ml/monitoring | — | — | — | ✓ (activeModels, recentAlerts, featureHealth) | Inline only |
| 14 | ml/deploy | — | — | — | ✓ (deploymentChecklist, stages, recentDeployments) | Inline only |
| 15 | ml/governance | — | — | — | ✓ (auditLog, pendingApprovals, accessControl, complianceReports) | Inline only |
| 16 | ml/config | — | ✓ ml.ts | ✓ ml-mock-data.ts | — | Import, not via hook |
| 17 | strategy/overview | — | ✓ strategy.ts | ✓ strategy-platform-mock-data.ts | — | Import, not via hook |
| 18 | strategy/results | — | ✓ strategy.ts | ✓ strategy-platform-mock-data.ts | — | Import, not via hook |
| 19 | strategy/heatmap | — | — | — | ✓ (local grid data) | Inline only |
| 20 | execution/venues | — | — | ✓ execution-platform-mock-data.ts | — | Import, not via hook |
| 21 | execution/benchmarks | — | — | — | ✓ (local benchmark data) | Inline only |
| 22 | quant | — | — | — | ✓ (QuantDashboard internal) | Component-internal |

---

## React Query Hooks — Available but Unused

### `hooks/api/use-ml-models.ts`

| Hook | queryKey | fetchFn Endpoint | Pages That Should Use It |
| ---- | -------- | ---------------- | ------------------------ |
| `useModelFamilies` | `model-families` | `/api/ml/model-families` | ml (models), ml/overview, ml/config, ml/experiments |
| `useExperiments` | `experiments` | `/api/ml/experiments` | ml/experiments, ml/overview |
| `useTrainingRuns` | `training-runs` | `/api/ml/training-runs` | ml/training, ml (models) |
| `useModelVersions` | `model-versions` | `/api/ml/versions` | ml/registry |
| `useMLDeployments` | `ml-deployments` | `/api/ml/deployments` | ml/deploy |
| `useFeatureProvenance` | `feature-provenance` | `/api/ml/features` | ml (models), ml/features |
| `useDatasets` | `datasets` | `/api/ml/datasets` | ml/experiments, ml/config |

### `hooks/api/use-strategies.ts`

| Hook | queryKey | fetchFn Endpoint | Pages That Should Use It |
| ---- | -------- | ---------------- | ------------------------ |
| `useStrategyTemplates` | `strategy-templates` | `/api/strategy/templates` | strategy/backtests, strategy/overview |
| `useStrategyConfigs` | `strategy-configs` | `/api/strategy/configs` | strategy/compare, strategy/overview |
| `useBacktests` | `backtests` | `/api/strategy/backtests` | strategy/backtests, strategy/results, strategy/compare |
| `useStrategyCandidates` | `strategy-candidates` | `/api/strategy/candidates` | strategy/overview |
| `useStrategyAlerts` | `strategy-alerts` | `/api/strategy/alerts` | strategy/overview |

---

## MSW Handler Coverage

### Covered (endpoints exist)

| Handler File | Endpoint | Mock Data Source |
| ------------ | -------- | ---------------- |
| `handlers/ml.ts` | `GET /api/ml/model-families` | `ml-mock-data.ts` → `MODEL_FAMILIES` |
| `handlers/ml.ts` | `GET /api/ml/experiments` | `ml-mock-data.ts` → `EXPERIMENTS` |
| `handlers/ml.ts` | `GET /api/ml/training-runs` | `ml-mock-data.ts` → `TRAINING_RUNS` |
| `handlers/ml.ts` | `GET /api/ml/versions` | `ml-mock-data.ts` → `MODEL_VERSIONS` |
| `handlers/ml.ts` | `GET /api/ml/deployments` | `ml-mock-data.ts` → `LIVE_DEPLOYMENTS` |
| `handlers/ml.ts` | `GET /api/ml/features` | `ml-mock-data.ts` → `FEATURE_PROVENANCE` |
| `handlers/ml.ts` | `GET /api/ml/datasets` | `ml-mock-data.ts` → `DATASET_SNAPSHOTS` |
| `handlers/strategy.ts` | `GET /api/strategy/templates` | `strategy-platform-mock-data.ts` → `STRATEGY_TEMPLATES` |
| `handlers/strategy.ts` | `GET /api/strategy/configs` | `strategy-platform-mock-data.ts` → `STRATEGY_CONFIGS` |
| `handlers/strategy.ts` | `GET /api/strategy/backtests` | `strategy-platform-mock-data.ts` → `BACKTEST_RUNS` |
| `handlers/strategy.ts` | `GET /api/strategy/candidates` | `strategy-platform-mock-data.ts` → `STRATEGY_CANDIDATES` |
| `handlers/strategy.ts` | `GET /api/strategy/alerts` | `strategy-platform-mock-data.ts` → `STRATEGY_ALERTS` |
| `handlers/execution.ts` | `GET /api/execution/algo-backtests` | `execution-platform-mock-data.ts` → `MOCK_ALGO_BACKTESTS` |

### Not Covered (pages use inline data, no MSW endpoint)

| Page | Data Needed | Suggested Endpoint |
| ---- | ----------- | ------------------ |
| ml/monitoring | activeModels, recentAlerts, featureHealth | `GET /api/ml/monitoring/health` |
| ml/deploy | deploymentChecklist, stages, recentDeployments | `GET /api/ml/deployments/readiness` |
| ml/governance | auditLog, pendingApprovals, accessControl, complianceReports | `GET /api/ml/governance/audit` |
| ml/validation | validationResults, timeSeriesComparison, etc. | `GET /api/ml/validation/{champion_id}/{challenger_id}` |
| ml/features | featureCatalog, featureHistory, featureUsageMatrix | `GET /api/ml/features/catalog` |
| strategy/heatmap | heatmap grid data | `GET /api/strategy/heatmap` |
| execution/venues | venue data (partially covered by execution handler) | `GET /api/execution/venues` |
| execution/benchmarks | benchmark definitions, heatmap | `GET /api/execution/benchmarks` |

---

## Flat Mock File Sizes

| File | Lines | Exports |
| ---- | ----- | ------- |
| `lib/ml-mock-data.ts` | ~1,019 | 9 exports |
| `lib/strategy-platform-mock-data.ts` | ~617 | 5 exports |
| `lib/execution-platform-mock-data.ts` | ~200 | 4 exports |
| `lib/strategy-registry.ts` | ~1,856 | 3 exports |
| **Total flat mock lines** | **~3,692** | — |

---

## Type File Coverage

| Type File | Covers |
| --------- | ------ |
| `lib/ml-types.ts` | ModelFamily, Experiment, ModelVersion, TrainingRun, DatasetSnapshot, FeatureSetVersion, FeatureProvenance, LiveDeployment |
| `lib/strategy-platform-types.ts` | StrategyTemplate, StrategyConfig, BacktestRun, BacktestMetrics, StrategyCandidate, StrategyAlert |
| `lib/execution-platform-mock-data.ts` | Inline types only (no separate type file) |

**Gap:** No `lib/execution-platform-types.ts` — types are defined inline in mock-data file.

---

## Migration Priority

| Priority | Action | Pages Affected | Effort |
| -------- | ------ | -------------- | ------ |
| 1 | Wire ML pages to `useModelFamilies`, `useExperiments`, etc. | 7 ML pages | Medium |
| 2 | Wire strategy pages to `useStrategyConfigs`, `useBacktests`, etc. | 5 strategy pages | Medium |
| 3 | Create MSW handlers for uncovered pages (monitoring, deploy, governance, validation, features, heatmap) | 8 pages | Medium |
| 4 | Create `execution-platform-types.ts` and wire execution pages to hooks | 4 execution pages | Low |
| 5 | Extract inline mock data from 9 pages into fixtures/ or mock-data files | 9 pages | Low |
