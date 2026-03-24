# Build Tab — Mock Data Tracking

> **Purpose:** Track all mock data changes made for the Build tab so backend API changes
> can be made to reflect the same structure. This is the SSOT for what the frontend expects.
>
> **Rule:** Every time mock data is added, updated, or removed, document it here.
> Backend team reads this to know what API contracts are needed.

---

## Data Location Map

| Source File                          | Used By                                                         | Purpose                                                  |
| ------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------- |
| `lib/ml-mock-data.ts`                | ML sub-pages (training, experiments, etc.)                      | ML training runs, experiments, model versions            |
| `lib/strategy-platform-mock-data.ts` | Strategy pages                                                  | Strategy templates, backtest runs, candidates            |
| `lib/build-mock-data.ts`             | **NEW** — Build Overview, Features, Feature ETL, Execution tabs | Feature catalogue, feature ETL jobs, execution backtests |

---

## NEW FILE: `lib/build-mock-data.ts`

**Created:** 2026-03-23
**Purpose:** Centralized mock data for the new Build tab pages that didn't exist before.

### Exports and expected API endpoints:

#### `BUILD_OVERVIEW_STATS`

Aggregated pipeline status for the Build Overview landing page.

```typescript
export interface BuildOverviewStats {
  features: {
    total_defined: number; // total features in catalogue
    new_this_week: number; // features added in last 7 days
    computed_pct: number; // % of features computed
    stale_count: number; // features with stale computation
  };
  feature_etl: {
    overall_pct: number; // overall feature computation %
    shards_complete: number; // completed shards
    shards_total: number; // total shards
    active_jobs: number; // currently running jobs
  };
  models: {
    total_trained: number; // all model versions
    active_jobs: number; // currently training
    champion_count: number; // deployed champions
    pending_retrain: number; // models flagged for retrain
  };
  strategies: {
    total_run: number; // all strategy backtests
    candidates: number; // marked as candidates
    new_this_week: number;
  };
  execution: {
    total_backtested: number; // all execution backtests
    in_progress: number; // currently running
    best_sharpe: number; // best result
  };
}
// Expected API: GET /api/build/stats
```

#### `BUILD_ACTIVE_JOBS`

Currently running jobs across all Build pipeline stages.

```typescript
export interface BuildActiveJob {
  id: string;
  type:
    | "feature_computation"
    | "model_training"
    | "strategy_backtest"
    | "execution_backtest";
  name: string;
  description: string; // e.g., "CeFi Delta-One features"
  progress_pct: number;
  eta_minutes: number | null; // null = unknown
  started_at: string; // ISO timestamp
  status: "running" | "paused" | "queued";
  detail: string; // e.g., "Epoch 29/65" or "78% shards complete"
}
// Expected API: GET /api/build/jobs/active
```

#### `BUILD_ALERTS`

Recent alerts and notifications for the Build pipeline.

```typescript
export interface BuildAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  message: string;
  detail: string | null;
  timestamp: string;
  source: "features" | "feature_etl" | "models" | "strategies" | "execution";
  action_href: string | null; // link to the relevant page
}
// Expected API: GET /api/build/alerts
```

#### `BUILD_RECENT_ACTIVITY`

Audit log of recent changes across the Build pipeline.

```typescript
export interface BuildActivity {
  id: string;
  action: string; // e.g., "Feature ema_50 updated to v2.1"
  actor: string;
  timestamp: string;
  href: string | null; // link to the affected entity
}
// Expected API: GET /api/build/activity?limit=20
```

---

#### `FEATURE_CATALOGUE`

Master list of all features across all shards.

```typescript
export interface FeatureCatalogueEntry {
  id: string;
  name: string;
  display_name: string;
  shard: "CeFi" | "DeFi" | "TradFi" | "Sports" | "Prediction";
  feature_type:
    | "Delta-One"
    | "Volatility"
    | "On-Chain"
    | "Sports"
    | "Calendar"
    | "Multi-Timeframe"
    | "Cross-Instrument"
    | "Commodity";
  feature_group:
    | "Technical"
    | "Fundamental"
    | "Sentiment"
    | "Microstructure"
    | "Risk"
    | "ML-Derived";
  source_service: string; // e.g., "features-delta-one-service"
  current_version: string; // e.g., "v2.1"
  status: "active" | "stale" | "not_computed" | "deprecated";
  symbols: string[]; // instruments this feature is computed for
  last_computed: string | null; // ISO timestamp
  description: string;
  parameters: Record<string, unknown>; // feature-specific config params
  dependencies: string[]; // IDs of features this one depends on
  consumed_by_models: string[]; // model IDs using this feature
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}
// Expected API: GET /api/features/catalogue?shard=&type=&group=&status=&search=
```

#### `FEATURE_VERSIONS`

Version history for each feature.

```typescript
export interface FeatureVersion {
  feature_id: string;
  version: string;
  changed_fields: string[]; // what params changed
  changed_by: string;
  changed_at: string;
  change_summary: string;
  models_using_this_version: string[];
}
// Expected API: GET /api/features/:id/versions
```

#### `FEATURE_PRESETS`

Standard presets for common indicators.

```typescript
export interface FeaturePreset {
  id: string;
  name: string; // e.g., "EMA-50"
  feature_type: string;
  parameters: Record<string, unknown>;
  description: string;
  common_use: string; // e.g., "Long-term trend"
}
// Expected API: GET /api/features/presets
```

---

#### `FEATURE_ETL_SERVICES`

Feature computation services with their pipeline status.

```typescript
export interface FeatureEtlService {
  id: string;
  name: string; // e.g., "features-delta-one-service"
  shard: string;
  overall_pct: number;
  shards_complete: number;
  shards_total: number;
  active_jobs: number;
  failed_jobs: number;
  last_updated: string;
  by_category: Record<string, { pct: number; complete: number; total: number }>;
}
// Expected API: GET /api/features/etl/services

export interface FeatureEtlJob {
  id: string;
  service_id: string;
  shard: string;
  category: string;
  date_range: { start: string; end: string };
  progress_pct: number;
  status: "running" | "queued" | "complete" | "failed" | "paused";
  started_at: string;
  completed_at: string | null;
  error: string | null;
  shards_done: number;
  shards_total: number;
}
// Expected API: GET /api/features/etl/jobs?status=running|queued|complete|failed

export interface FeatureEtlHeatmapCell {
  shard: string;
  feature_group: string;
  date: string; // YYYY-MM-DD
  pct: number; // 0-100
  status: "complete" | "partial" | "missing";
}
// Expected API: GET /api/features/etl/heatmap?shard=&group=
```

---

#### `EXECUTION_BACKTESTS`

Execution backtest runs (new concept — did not exist before).

```typescript
export interface ExecutionBacktest {
  id: string;
  name: string;
  strategy_backtest_id: string; // signals source
  strategy_name: string;
  algo:
    | "TWAP"
    | "VWAP"
    | "Iceberg"
    | "Aggressive Limit"
    | "Passive Limit"
    | "Market Only";
  algo_params: Record<string, unknown>;
  order_type: "Limit" | "Market" | "Limit-then-Market";
  venues: string[];
  routing: "SOR" | "venue-specific" | "split";
  slippage_model: "fixed_bps" | "orderbook_based";
  execution_delay_ms: number;
  market_impact: "none" | "linear" | "square_root";
  date_range: { start: string; end: string };
  instrument: string;
  status: "complete" | "running" | "failed";
  created_at: string;
  created_by: string;
  // Results (null if not complete)
  results: ExecutionBacktestResults | null;
}

export interface ExecutionBacktestResults {
  // Strategy performance
  net_profit: number;
  net_profit_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  profit_factor: number;
  win_rate: number;
  total_trades: number;
  avg_trade_duration_hours: number;
  // Execution quality
  avg_slippage_bps: number;
  total_slippage_cost: number;
  avg_fill_time_seconds: number;
  fill_rate_pct: number;
  partial_fill_pct: number;
  maker_pct: number;
  total_commission: number;
  implementation_shortfall_bps: number;
  venue_breakdown: Record<
    string,
    {
      fills: number;
      avg_slippage_bps: number;
      maker_pct: number;
      avg_fill_time_s: number;
    }
  >;
}
// Expected API: GET /api/research/execution-backtests
// Expected API: POST /api/research/execution-backtests (create new)
// Expected API: GET /api/research/execution-backtests/:id (detail)
```

---

## MODIFIED: `lib/ml-mock-data.ts`

**Status:** No structural changes. Used as-is for ML sub-pages.
Frontend reads `TRAINING_RUNS`, `MODEL_FAMILIES`, `EXPERIMENTS`, `FEATURE_SET_VERSIONS`.

## MODIFIED: `lib/strategy-platform-mock-data.ts`

**Status:** No structural changes. The Strategies tab reuses existing `STRATEGY_TEMPLATES`,
`BACKTEST_RUNS`, `STRATEGY_CANDIDATES`, and `STRATEGY_CONFIGS`.

The Strategies tab now maps to these backend endpoints:

- `GET /api/analytics/strategy-configs` → `STRATEGY_CONFIGS`
- `GET /api/execution/backtests` → `BACKTEST_RUNS`
- `GET /api/analytics/strategy-configs` (templates) → `STRATEGY_TEMPLATES`
- `GET /api/analytics/strategy-candidates` → `STRATEGY_CANDIDATES`

---

## RETIRED Mock Data

| Variable                                      | Old Location                   | Reason                                                        | Replacement                                     |
| --------------------------------------------- | ------------------------------ | ------------------------------------------------------------- | ----------------------------------------------- |
| `MOCK_FEATURES` (inline in features/page.tsx) | features/page.tsx lines 41-120 | Inline, not reusable, no config/versioning                    | `FEATURE_CATALOGUE` in `lib/build-mock-data.ts` |
| `MOCK_SIGNALS` (inline in signals/page.tsx)   | signals/page.tsx               | Signals tab removed — signals are output of strategy backtest | N/A                                             |

---

## API Endpoint Summary (for backend team)

| Endpoint                                | Method | Description                                  |
| --------------------------------------- | ------ | -------------------------------------------- |
| `/api/build/stats`                      | GET    | Overview pipeline status across all tabs     |
| `/api/build/jobs/active`                | GET    | Active jobs across all Build pipeline stages |
| `/api/build/alerts`                     | GET    | Recent alerts from all pipeline stages       |
| `/api/build/activity`                   | GET    | Recent activity feed (audit log)             |
| `/api/features/catalogue`               | GET    | Feature catalogue with filters               |
| `/api/features/:id/versions`            | GET    | Version history for a feature                |
| `/api/features/presets`                 | GET    | Standard indicator presets                   |
| `/api/features/:id/dependencies`        | GET    | Dependency tree for a feature                |
| `/api/features/etl/services`            | GET    | Feature computation service status           |
| `/api/features/etl/jobs`                | GET    | Feature computation jobs                     |
| `/api/features/etl/heatmap`             | GET    | Completion heatmap data                      |
| `/api/research/execution-backtests`     | GET    | All execution backtests                      |
| `/api/research/execution-backtests`     | POST   | Create new execution backtest                |
| `/api/research/execution-backtests/:id` | GET    | Execution backtest detail + results          |
