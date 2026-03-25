# ML Mock Data Changelog

Tracks changes to `lib/ml-mock-data.ts` so the backend team can align API responses.

---

## 2026-03-25 — v2: New 4-Page Architecture Data

### New exports added

| Export                  | Type                   | Purpose                                                |
| ----------------------- | ---------------------- | ------------------------------------------------------ |
| `GPU_QUEUE_STATUS`      | `QueueStatus`          | GPU cluster status for Training page                   |
| `UNIFIED_TRAINING_RUNS` | `UnifiedTrainingRun[]` | 6 runs (2 running, 2 completed, 1 failed, 1 queued)    |
| `RUN_COMPARISONS`       | `RunComparison[]`      | Significance test results for Analysis comparison mode |
| `ML_PIPELINE_STATUS`    | derived object         | Computed KPI summary for Overview page                 |

### New types added to `lib/ml-types.ts`

| Type                         | Fields of note                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `ModelConfig`                | Full training config: architecture, features, walk-forward, hyperparams                    |
| `FeatureVersionPin`          | Links features to exact versions for reproducibility                                       |
| `FinancialValidationMetrics` | Sharpe, directional accuracy, calibration, drawdown, profit factor, Sortino, IR, stability |
| `FeatureImportance`          | Per-feature importance with auto-generated insights                                        |
| `RegimePerformance`          | Performance breakdown by market regime (trending, ranging, crisis, etc.)                   |
| `WalkForwardFold`            | Individual walk-forward fold with embargo-respecting windows                               |
| `RunComparison`              | Side-by-side metric comparison with p-values                                               |
| `DataIntegrityCheck`         | Automated checks: lookahead bias, embargo, leakage, coverage                               |
| `EpochMetric`                | Per-epoch train/val loss, accuracy, learning rate                                          |
| `RunAnalysis`                | Complete post-training analysis bundle                                                     |
| `UnifiedTrainingRun`         | Unified type merging old Experiment + TrainingRun                                          |
| `GpuResourceStatus`          | Per-GPU-type allocation                                                                    |
| `QueueStatus`                | Queue depth + GPU availability                                                             |

### Backend API endpoints expected

| Endpoint                           | Method | Returns                    | Notes                          |
| ---------------------------------- | ------ | -------------------------- | ------------------------------ |
| `/api/ml/training/runs`            | GET    | `UnifiedTrainingRun[]`     | Filterable by status, family   |
| `/api/ml/training/runs/:id`        | GET    | `UnifiedTrainingRun`       | Full run detail with config    |
| `/api/ml/training/runs`            | POST   | `UnifiedTrainingRun`       | Create and queue new run       |
| `/api/ml/training/runs/:id/cancel` | POST   | `{ status: "cancelled" }`  | Cancel running/queued run      |
| `/api/ml/training/queue`           | GET    | `QueueStatus`              | GPU queue and resource status  |
| `/api/ml/analysis/runs/:id`        | GET    | `RunAnalysis`              | Post-training analysis bundle  |
| `/api/ml/analysis/compare`         | POST   | `RunComparison[]`          | Body: `{ run_a_id, run_b_id }` |
| `/api/ml/registry/models`          | GET    | `ModelVersion[]`           | Registered models (completed)  |
| `/api/ml/pipeline/status`          | GET    | `ML_PIPELINE_STATUS` shape | Overview KPIs                  |
| `/api/ml/alerts`                   | GET    | `MLAlert[]`                | Active alerts (overview strip) |

**Client mock:** When `NEXT_PUBLIC_MOCK_API=true`, `lib/api/mock-handler.ts` implements the v2 routes above (plus POST create/compare/cancel) so React Query hooks resolve without a live API.

### Existing exports unchanged

All original exports (`MODEL_FAMILIES`, `EXPERIMENTS`, `TRAINING_RUNS`, `MODEL_VERSIONS`, `LIVE_DEPLOYMENTS`, etc.) remain unchanged. New code should prefer `UNIFIED_TRAINING_RUNS` over the older `EXPERIMENTS` + `TRAINING_RUNS` combination.

---

## 2026-03-18 — v1: Initial mock data

- 6 model families (BTC Direction, ETH Vol, Multi-Momentum, Funding Rate, NFL, Polymarket)
- 5 experiments with varied statuses
- 2 active training runs
- 4 model versions (3 live, 1 shadow)
- 3 live deployments
- 1 champion/challenger pair
- Alerts, feature provenance, regime states, audit events
- Dataset snapshots, feature set versions, validation packages, deployment candidates
