# Build / Research Section — Expanded Specification

> **Purpose:** Detailed specification for the 7 tabs of the Build lifecycle stage.
> **Status:** v4 — all design decisions finalized (see RESEARCH_BUILD_SECTION_AUDIT.md §4).
> **Companion:** `RESEARCH_BUILD_SECTION_AUDIT.md` (current state analysis + decisions)

---

## Pipeline Overview

The Build section covers the research-to-backtest pipeline. Users land on an **Overview**
tab showing pipeline status, then navigate into 5 pipeline tabs + a workspace tab.

```
                                    Processed Data (from Acquire)
                                              │
                                              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ 0. OVERVIEW│  │ 1. FEATURES│─▶│ 2. FEATURE │─▶│ 3. MODELS  │─▶│ 4.STRATEGY │─▶│ 5.EXECUTION│  │ 6. QUANT   │
│ Pipeline   │  │ Catalogue  │  │ ETL        │  │ Training & │  │ Signal     │  │ Exec algo  │  │ WORKSPACE  │
│ status,    │  │ & Config   │  │ Pipeline   │  │ Evaluation │  │ Backtest   │  │ Backtest   │  │            │
│ active     │  │            │  │            │  │            │  │            │  │            │  │ Historical │
│ jobs,      │  │ Define,    │  │ Compute    │  │ Config,    │  │ Generate   │  │ TWAP/VWAP  │  │ reports,   │
│ alerts,    │  │ version,   │  │ features,  │  │ train,     │  │ signals,   │  │ simulation,│  │ saved      │
│ activity   │  │ presets,   │  │ track      │  │ evaluate,  │  │ compare    │  │ TradingView│  │ comparisons│
│ feed       │  │ deps       │  │ progress   │  │ compare    │  │ strategies │  │ results    │  │ governance │
└────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘
```

Tab 0 is the landing page. Tabs 1-5 form the pipeline. Tab 6 is a workspace for historical
reports, saved comparisons, and model governance. Each tab also has its own mini-overview
at the top before drilling into detail.

### Core Principle: Everything is Configured, Versioned, and Linked

Every entity in the pipeline carries **metadata + configuration + version**:

- A **feature** has a config (which input data, which symbols, which parameters like EMA length)
  and a version. Changing any parameter creates a new version. Features can depend on other
  features (e.g., MACD depends on two EMAs) — version changes cascade.
- A **model** has a config (which architecture, which features at which versions, which
  hyperparameters) and a version. The config records exact feature versions used for training.
- A **strategy backtest** records which model version produced the signals.
- An **execution backtest** records which signals + which execution algo produced the trades.

This creates a full lineage chain:
`processed data → feature v1.2 → model v3.1 → strategy backtest (signals) → execution backtest (trades) → candidate for promotion`

---

## Existing Codebase Inventory

Before designing, here's what already exists in the codebase that we can reuse:

### Types (already defined)

| File                             | Key Types                                                                                                                                                                                                            | Lines         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `lib/ml-types.ts`                | `TrainingConfig`, `Experiment`, `ExperimentMetrics`, `FeatureDefinition`, `FeatureSetVersion`, `FeatureProvenance`, `ModelFamily`, `ModelVersion`, `ValidationPackage`, `RegimeValidation`, `ChampionChallengerPair` | 467           |
| `lib/strategy-platform-types.ts` | `BacktestRun`, `BacktestMetrics` (returns, risk, execution, alpha, regimeBreakdown), `StrategyTemplate`, `StrategyConfig`, `RiskLimits`, `ExecutionConfig`, `StrategyCandidate`                                      | 404           |
| `lib/taxonomy.ts`                | `StrategyArchetype`, `AssetClass`, `TestingStage`                                                                                                                                                                    | (re-exported) |

### Mock Data (already defined)

| File                                 | Key Exports                                                                                                                                                                         | Lines |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `lib/ml-mock-data.ts`                | `MODEL_FAMILIES`, `EXPERIMENTS`, `TRAINING_RUNS`, `FEATURE_SET_VERSIONS`, `FEATURE_PROVENANCE`, `VALIDATION_PACKAGES`, `LIVE_DEPLOYMENTS`, `CHAMPION_CHALLENGER_PAIRS`, `ML_ALERTS` | 1020  |
| `lib/strategy-platform-mock-data.ts` | `STRATEGY_TEMPLATES`, `STRATEGY_CONFIGS`, `BACKTEST_RUNS` (with `generateMetrics()`), `STRATEGY_CANDIDATES`, filter option arrays                                                   | 619   |

### Hooks (already defined)

| File                          | Key Hooks                                                                                                                                                         | Lines |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `hooks/api/use-ml-models.ts`  | `useModelFamilies`, `useExperiments`, `useTrainingRuns`, `useCreateTrainingJob`, `useFeatureProvenance`, `useValidationResults`, `useMLMonitoring`, `useMLConfig` | 173   |
| `hooks/api/use-strategies.ts` | `useStrategyBacktests`, `useCreateBacktest`, `useStrategyTemplates`, `useStrategyCandidates`, `useBacktestDetail`, `useStrategyHealth`                            | 172   |

### Components (already defined)

| File                                        | What It Does                                                                                     | Lines |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----- |
| `components/research/strategy-wizard.tsx`   | Multi-step strategy creation wizard (template → instrument → venue → dates → capital)            | 694   |
| `components/ml/loss-curves.tsx`             | Training/validation loss curve charts + model-strategy linkage table                             | 327   |
| `components/ml/ml-nav.tsx`                  | ML sub-navigation (overview, experiments, training, features, validation, deploy, monitoring)    | 95    |
| `components/dashboards/quant-dashboard.tsx` | Full quant workspace with sub-views: Overview, Backtest, ConfigGrid, Training, Features, Results | 948   |

### What's Missing (needs to be built)

- Feature **configuration** UI (parameter editing, input data selection, symbol selection)
- Feature **versioning** display and comparison
- Model-to-feature-version **linkage** tracking
- ETL pipeline progress views (both Feature and Data share this pattern)
- TradingView-style backtest results (equity curve, performance split, trade list)

---

## 0. Overview Tab (Landing Page)

### What It Is

The first thing users see when they enter the Build section. Shows pipeline status
across all tabs, active jobs, alerts, and recent activity. More comprehensive than
Acquire's simple overview — Build is detailed and covers many workflows.

Each subsequent tab (Features, Models, etc.) also has its own mini-overview at the top
of its landing page, so the Overview tab is the cross-cutting summary.

### Page Content

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD — Research & Backtesting Pipeline                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ PIPELINE STATUS (one card per stage) ────────────────────┐  │
│  │                                                            │  │
│  │  Features     Feature ETL    Models        Strategies      │  │
│  │  ┌────────┐  ┌────────┐     ┌────────┐   ┌────────┐      │  │
│  │  │  847   │  │ 72.9%  │     │   12   │   │    8   │      │  │
│  │  │defined │  │computed│     │trained │   │ tested │      │  │
│  │  │+23 new │  │+2.1%/d │     │3 active│   │5 cands │      │  │
│  │  └────────┘  └────────┘     └────────┘   └────────┘      │  │
│  │                                                            │  │
│  │  Execution     Quant Workspace                             │  │
│  │  ┌────────┐   ┌────────┐                                  │  │
│  │  │    5   │   │   14   │                                  │  │
│  │  │backtestd│  │ reports│                                  │  │
│  │  │2 in prog│  │3 saved │                                  │  │
│  │  └────────┘   └────────┘                                  │  │
│  │                                                            │  │
│  │  Cards are clickable → navigate to corresponding tab       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ ACTIVE JOBS ─────────────────────────────────────────────┐  │
│  │  Feature Computation  │ CeFi Delta-One │ 78% │ 2h remaining│  │
│  │  Model Training       │ BTC Dir. v5    │ 45% │ epoch 29/65 │  │
│  │  Strategy Backtest    │ Momentum v4    │ 100%│ Complete     │  │
│  │  Execution Backtest   │ TWAP sim       │ 62% │ 1h remaining│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ ALERTS ──────────────────────────────────────────────────┐  │
│  │  ⚠ Model drift detected: BTC Basis v2 — accuracy dropped  │  │
│  │  ⚠ Feature stale > 24h: funding_rate for SOL-PERP          │  │
│  │  ✓ Backtest complete: ETH Momentum v3 — Sharpe 2.14        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ RECENT ACTIVITY ─────────────────────────────────────────┐  │
│  │  • Feature ema_50 updated to v2.1 (added SOL-PERP)  2h ago│  │
│  │  • Model BTC Directional v5 training started         4h ago│  │
│  │  • Strategy "Mean Reversion v2" marked as candidate  1d ago│  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Design Notes

- **Not a copy of Acquire's overview** — Build is more comprehensive.
- **Cards are interactive** — clicking navigates to the corresponding tab.
- **Active jobs span all pipeline stages** — feature computation, model training,
  strategy backtests, execution backtests all show here.
- **Alerts surface issues** across the entire pipeline, not just one stage.
- Takes inspiration from the current ML Overview page (which has KPIs, model families,
  training status, alerts) and extends it to cover the full Build pipeline.

---

## 1. Feature Catalogue

### What It Is

A browsable registry of **all features** available in the system. Features are the computed
inputs that ML models and strategies consume. They are NOT raw market data — they are derived
from processed data (candles, trades, on-chain events, odds, match stats).

### Grouping Dimensions

Features are organized along three axes:

| Axis                 | Values                                                                                          | Example                                |
| -------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Type / Family**    | Delta-One, Volatility, On-Chain, Sports, Calendar, Multi-Timeframe, Cross-Instrument, Commodity | `funding_rate` → Delta-One             |
| **Category / Shard** | CeFi, DeFi, TradFi, Sports, Prediction Markets                                                  | `odds_movement` → Sports               |
| **Feature Group**    | Technical, Fundamental, Sentiment, Microstructure, Risk, ML-Derived                             | `orderbook_imbalance` → Microstructure |

These map directly to the backend feature services visible in the deployment-ui:

| Feature Service                     | Shard Coverage | Sharding Dimensions             |
| ----------------------------------- | -------------- | ------------------------------- |
| `features-calendar-service`         | All            | category × date                 |
| `features-delta-one-service`        | CeFi, TradFi   | category × feature_group × date |
| `features-volatility-service`       | CeFi, TradFi   | category × feature_group × date |
| `features-onchain-service`          | DeFi           | category × feature_group × date |
| `features-sports-service`           | Sports         | category × feature_group × date |
| `features-multi-timeframe-service`  | All            | category × timeframe × date     |
| `features-cross-instrument-service` | All            | category × feature_group × date |
| `features-commodity-service`        | TradFi         | category × feature_group × date |

### Three View Modes for 10K+ Features

With potentially tens of thousands of features across all asset classes and categories,
users need multiple ways to browse. All three views are available (toggle between them):

1. **Card Grid** — Shard-level cards (CeFi: 312, DeFi: 198, Sports: 124...). Click to
   drill into that shard's features. Best for high-level orientation.

2. **Collapsible Tree** — Hierarchical accordion: Shard → Type → Group → Feature.
   Like a file explorer. Best for browsing related features.

3. **Filtered Table** — Flat table with multi-level filters (shard, type, group, status).
   Click any row for detail panel. Best for searching/filtering specific features.

Users can experience all three and we'll refine based on which gets used most.

### Page Layout — Feature Catalogue (Table View)

```
┌─────────────────────────────────────────────────────────────────┐
│ FEATURE CATALOGUE                                    [Search]   │
├─────────────┬───────────────────────────────────────────────────┤
│ FILTERS     │  FEATURE LIST / GRID                              │
│             │                                                   │
│ Shard:      │  ┌───────────────────────────────────────────┐    │
│ [All ▾]     │  │ Feature Name    │ Type       │ Shard │ Grp│    │
│             │  ├─────────────────┼────────────┼───────┼────┤    │
│ Type:       │  │ funding_rate    │ Delta-One  │ CeFi  │ T  │    │
│ [All ▾]     │  │ basis_spot_perp │ Delta-One  │ CeFi  │ T  │    │
│             │  │ realized_vol    │ Volatility │ CeFi  │ R  │    │
│ Group:      │  │ lst_exchange_rt │ On-Chain   │ DeFi  │ F  │    │
│ [All ▾]     │  │ odds_movement   │ Sports     │ Sport │ S  │    │
│             │  │ iv_surface      │ Volatility │ TradFi│ T  │    │
│ Status:     │  │ pool_tick_data  │ On-Chain   │ DeFi  │ M  │    │
│ [All ▾]     │  │ team_form_5     │ Sports     │ Sport │ F  │    │
│             │  └───────────────────────────────────────────┘    │
│ [Clear]     │                                                   │
│             │  ─── CLICK ROW TO EXPAND ───                      │
├─────────────┤                                                   │
│ SUMMARY     │  ┌─ FEATURE DETAIL (expanded) ──────────────────┐ │
│             │  │ funding_rate                                  │ │
│ Total: 847  │  │                                               │ │
│ CeFi:  312  │  │ Description: Perpetual funding rate for the   │ │
│ DeFi:  198  │  │   configured asset, published every 8h.       │ │
│ TradFi: 156 │  │                                               │ │
│ Sports: 124 │  │ Source Service: features-delta-one-service     │ │
│ Pred:   57  │  │ Input Data: Processed candles (1H)             │ │
│             │  │ Update Frequency: Every funding interval       │ │
│             │  │ SLA: < 30s after venue publish                 │ │
│             │  │                                                │ │
│             │  │ INSTRUMENTS: BTC-PERP, ETH-PERP, SOL-PERP...  │ │
│             │  │ (142 instruments)                              │ │
│             │  │                                                │ │
│             │  │ CONSUMED BY MODELS:                            │ │
│             │  │  • BTC Basis Model (v2.3)                      │ │
│             │  │  • ETH Funding Carry (v1.1)                    │ │
│             │  │  • Multi-Asset Momentum (v3.0)                 │ │
│             │  │                                                │ │
│             │  │ CONSUMED BY STRATEGIES:                        │ │
│             │  │  • DEFI_BASIS_ETH                              │ │
│             │  │  • DEFI_STAKED_BASIS_WEETH                     │ │
│             │  │                                                │ │
│             │  │ [View Lineage Graph]  [View Computation Jobs]  │ │
│             │  └────────────────────────────────────────────────┘ │
└─────────────┴───────────────────────────────────────────────────┘
```

### Key Data Per Feature (Identity)

| Field            | Description                       | Example                                       |
| ---------------- | --------------------------------- | --------------------------------------------- |
| Name             | Feature identifier                | `funding_rate`                                |
| Display Name     | Human label                       | Perpetual Funding Rate                        |
| Type             | Which feature service computes it | Delta-One                                     |
| Category / Shard | Asset class                       | CeFi                                          |
| Feature Group    | Logical grouping                  | Technical                                     |
| Description      | What it measures                  | 8-hourly funding rate for perpetual contracts |
| Source Service   | Backend service                   | `features-delta-one-service`                  |
| Status           | Computation state                 | Active / Stale / Not Computed                 |
| Current Version  | Latest version number             | v2.1                                          |

### Feature Configuration (the core of each feature definition)

Each feature is defined by its **configuration** — the set of parameters that determines
exactly how it's computed. This is where hundreds of indicators live, each with their own
parameter sets. Changing any parameter creates a new version.

#### Input Data Specification

| Config Field          | Description                           | Example                                                     |
| --------------------- | ------------------------------------- | ----------------------------------------------------------- |
| Input Data Type       | What processed data this feature uses | Candles (OHLCV), Trades, On-chain Events, Odds, Match Stats |
| Input Timeframe       | Which candle/bar period               | 1H, 4H, 1D                                                  |
| Symbols / Instruments | Which specific symbols to compute for | Single: `BTC-PERP` / Multi: `BTC-PERP, ETH-PERP, SOL-PERP`  |
| Symbol Selection Mode | How symbols are specified             | Single, List, All in Category, All in Shard                 |
| Data Source           | Where the processed data comes from   | `market-data-processing-service` output                     |
| Date Range            | Historical range to compute over      | 2024-01-01 → 2026-03-23                                     |

**Note on multi-symbol features:** Some features use only a single symbol's data (e.g., EMA
of BTC price). Others use multiple symbols (e.g., cross-instrument correlation, beta vs index,
relative strength). The config must specify this clearly.

#### Computation Parameters

These are the hundreds of indicator-specific settings. Examples by feature type:

| Feature                          | Parameters                                    | Example Values         |
| -------------------------------- | --------------------------------------------- | ---------------------- |
| EMA (Exponential Moving Average) | `length`                                      | 9, 21, 50, 200         |
| RSI (Relative Strength Index)    | `length`, `overbought`, `oversold`            | 14, 70, 30             |
| MACD                             | `fast_length`, `slow_length`, `signal_length` | 12, 26, 9              |
| Bollinger Bands                  | `length`, `std_dev`                           | 20, 2.0                |
| ATR (Average True Range)         | `length`                                      | 14                     |
| Funding Rate                     | `settlement_interval`, `smoothing`            | 8h, EMA-3              |
| Orderbook Imbalance              | `depth_levels`, `window`                      | 10, 5min               |
| IV Surface                       | `strikes`, `expiries`, `model`                | 20, 5, Black-Scholes   |
| Odds Movement                    | `lookback_window`, `threshold`                | 30min, 2%              |
| Team Form                        | `n_matches`, `weighting`                      | 5, exponential         |
| Health Factor                    | `protocol`, `collateral_types`                | Aave V3, [weETH, WETH] |

The configuration form should dynamically show relevant parameters based on the feature
type selected. An EMA config form looks very different from an IV Surface config form.

#### Configuration Storage Model

```
FeatureConfig {
  feature_id:        "ema_50"
  feature_name:      "EMA 50"
  feature_type:      "delta-one"          // which service computes it
  shard:             "cefi"
  version:           "v2.1"               // incremented on any param change

  // Input specification
  input_data_type:   "candles"
  input_timeframe:   "1H"
  symbols:           ["BTC-PERP", "ETH-PERP", "SOL-PERP"]
  symbol_mode:       "list"               // single | list | all_in_category | all_in_shard
  date_range:        { start: "2024-01-01", end: "2026-03-23" }

  // Computation parameters (varies per feature type)
  parameters: {
    length: 50,
    source: "close"                       // open, high, low, close, volume
  }

  // Metadata
  created_by:        "iggy"
  created_at:        "2026-03-20T10:00:00Z"
  updated_at:        "2026-03-22T14:30:00Z"
  description:       "50-period EMA on hourly close price"
  tags:              ["technical", "trend", "momentum"]
}
```

### Feature Versioning

Every feature has a version history. Changing any configuration parameter (length, symbols,
input timeframe, etc.) creates a new version. This is critical because ML models are trained
on specific feature versions — you need to know exactly which EMA length was used.

```
┌─ VERSION HISTORY: ema_50 ────────────────────────────────────────┐
│                                                                   │
│  Version │ Date       │ Changed              │ By    │ Status    │
│  ────────┼────────────┼──────────────────────┼───────┼───────────│
│  v2.1    │ 2026-03-22 │ Added SOL-PERP       │ iggy  │ Current   │
│  v2.0    │ 2026-03-15 │ Changed length 20→50 │ iggy  │ Archived  │
│  v1.1    │ 2026-02-10 │ Added ETH-PERP       │ sarah │ Archived  │
│  v1.0    │ 2026-01-05 │ Initial (BTC only)   │ iggy  │ Archived  │
│                                                                   │
│  ── MODELS USING EACH VERSION ──                                  │
│  v2.1 → BTC Directional v4, Multi-Asset Momentum v3              │
│  v2.0 → BTC Directional v3 (deprecated)                          │
│  v1.0 → BTC Directional v1, v2 (deprecated)                      │
│                                                                   │
│  [Compare v2.0 ↔ v2.1]  [Revert to v2.0]                        │
└───────────────────────────────────────────────────────────────────┘
```

### Feature Dependency Chains

Features can depend on other features. The Feature Catalogue displays this as a dependency
tree. Version changes **cascade** through the dependency chain.

```
┌─ DEPENDENCY TREE: macd_12_26_9 ──────────────────────────────────┐
│                                                                   │
│  macd_12_26_9 (v1.3)                                              │
│  ├── ema_12 (v2.0)   ← fast EMA                                  │
│  │   └── raw candles (close)                                      │
│  ├── ema_26 (v1.5)   ← slow EMA                                  │
│  │   └── raw candles (close)                                      │
│  └── signal_line: ema(macd_line, 9)                               │
│                                                                   │
│  CASCADE ALERT:                                                   │
│  ⚠ ema_12 updated from v1.9 → v2.0 (2026-03-20)                 │
│  → macd_12_26_9 auto-bumped v1.2 → v1.3                          │
│  → 3 models flagged for retraining:                               │
│    • BTC Momentum v4 (uses macd_12_26_9 v1.2 — STALE)            │
│    • ETH Trend Follower v2 (uses macd_12_26_9 v1.2 — STALE)      │
│    • Multi-Asset Momentum v3 (uses macd_12_26_9 v1.3 — CURRENT)  │
│                                                                   │
│  [View Full Lineage Graph]  [Suppress Cascade for This Update]    │
└───────────────────────────────────────────────────────────────────┘
```

When a feature version bumps:

1. All features that depend on it auto-bump their version
2. All models that use stale feature versions are flagged in the Models tab
3. The Feature ETL tab shows which dependent features need recomputation

### Feature Presets

For common indicators, offer standard presets that users can apply with one click and
then customize if needed:

| Preset         | Feature Type | Parameters                            | Notes                    |
| -------------- | ------------ | ------------------------------------- | ------------------------ |
| EMA-9          | Delta-One    | length=9, source=close                | Short-term trend         |
| EMA-21         | Delta-One    | length=21, source=close               | Medium-term trend        |
| EMA-50         | Delta-One    | length=50, source=close               | Long-term trend          |
| EMA-200        | Delta-One    | length=200, source=close              | Major trend              |
| RSI-14         | Delta-One    | length=14, overbought=70, oversold=30 | Standard RSI             |
| MACD-12-26-9   | Delta-One    | fast=12, slow=26, signal=9            | Standard MACD            |
| Bollinger-20-2 | Volatility   | length=20, std_dev=2.0                | Standard Bollinger Bands |
| ATR-14         | Volatility   | length=14                             | Standard ATR             |

Presets appear as quick-apply buttons when creating a new feature. The user clicks
"EMA-50 Preset" → all parameters pre-fill → user can adjust symbols, date range,
or override any parameter before saving.

### Downstream Consumers

| Field                         | Description                                              | Example                               |
| ----------------------------- | -------------------------------------------------------- | ------------------------------------- |
| Models Using This Feature     | Which ML models consume this feature (and which version) | BTC Directional v4 uses `ema_50 v2.1` |
| Strategies Using This Feature | Which strategies depend on this feature                  | DEFI_BASIS_ETH                        |
| Update Frequency              | How often it's recomputed                                | Every funding interval (~8h)          |
| SLA                           | Max acceptable staleness                                 | 30 seconds after venue publish        |
| Last Computed                 | Timestamp                                                | 2026-03-23 14:00:00 UTC               |

### Existing Types to Extend

The codebase already has `FeatureDefinition` and `FeatureSetVersion` in `lib/ml-types.ts`,
and `FEATURE_SET_VERSIONS` / `FEATURE_PROVENANCE` in `lib/ml-mock-data.ts`. These need to
be extended with the configuration/parameter model described above. The current types have
lineage and provenance but lack the **computation parameters** and **version diffing**.

### Inspiration / Reference

- **Tecton.ai** — Feature platform with definitions, lineage, freshness monitoring
- **Feast.dev** — Feature store with feature groups and materialization status
- **Hopsworks** — Feature lineage visualization and monitoring

---

## 2. Feature ETL Pipeline

### What It Is

The operational view for **computing features** from processed data. This is the equivalent
of the Data ETL pipeline (in the Acquire tab) but for features. Users need to:

1. See what features have been computed and what's remaining
2. Track computation progress across instruments and date ranges
3. Spin up / trigger computation jobs (including VM spin-up) for missing features
4. Monitor pipeline health and throughput

### THIS IS the primary UI for feature computation

The Feature ETL tab is the **main UI** for managing feature computation. `deployment-ui`
is being reduced to deployment-only (spinning up dev/stage/prod machines). Both the
Acquire tab (Data ETL) and the Build tab (Feature ETL) own their pipeline views for
triggering computes, monitoring progress, and managing jobs.

### Design Inspiration: deployment-ui patterns (reused, not linked)

The deployment-ui at `localhost:5183` has an excellent pattern we reuse:

- **Left panel:** Service list organized by layer (Layer 3 = Feature Engineering)
- **Deploy tab:** Configure sharding dimensions (category, feature_group, date range) and trigger runs
- **Data Status tab:** Filter by mode (Batch/Live), date range, categories — shows completion heatmap
- **Status tab:** Job progress and health
- **Config tab:** Service configuration

The Feature ETL page reuses the same concepts (progress bars, heatmaps, sharding dimension
filters, job management) through a research-oriented lens.

### Sub-Tabs

Feature ETL has its own sub-tabs:

- **Progress Overview** — overall pipeline progress bars by shard + service breakdown
- **Active Jobs** — running computation jobs with progress, ETA, controls
- **Completion Heatmap** — venue × date × feature_group completion matrix
- **History** — completed jobs, past runs, throughput trends

### Page Layout — Feature ETL Pipeline (Progress Overview)

```
┌─────────────────────────────────────────────────────────────────┐
│ FEATURE COMPUTATION PIPELINE                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ PIPELINE PROGRESS ──────────────────────────────────────┐   │
│  │                                                           │   │
│  │  CeFi Features    ████████████████████░░░░  82%  2,456/3K│   │
│  │  DeFi Features    ████████████████░░░░░░░░  67%  1,340/2K│   │
│  │  TradFi Features  ██████████████████████░░  91%  1,420/1.5K  │
│  │  Sports Features  ████████████░░░░░░░░░░░░  52%    650/1.2K  │
│  │  Prediction       ██████░░░░░░░░░░░░░░░░░░  28%    160/570│  │
│  │                                                           │   │
│  │  Overall: 6,026 / 8,270 features computed  (72.9%)       │   │
│  │  Last updated: 2 min ago    [Refresh]                     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ FEATURE SERVICE BREAKDOWN ───────────────────────────────┐   │
│  │                                                           │   │
│  │  Service                    │ Status │ Progress │ Actions │   │
│  │  ──────────────────────────┼────────┼──────────┼─────────│   │
│  │  features-delta-one        │ ✅ OK  │ 89%      │ [Run]   │   │
│  │  features-volatility       │ ✅ OK  │ 85%      │ [Run]   │   │
│  │  features-onchain          │ ⚠ Slow │ 67%      │ [Run]   │   │
│  │  features-sports           │ ✅ OK  │ 52%      │ [Run]   │   │
│  │  features-calendar         │ ✅ OK  │ 98%      │ [Run]   │   │
│  │  features-multi-timeframe  │ ✅ OK  │ 78%      │ [Run]   │   │
│  │  features-cross-instrument │ ❌ Err │ 41%      │ [Retry] │   │
│  │  features-commodity        │ ✅ OK  │ 91%      │ [Run]   │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─── CLICK A SERVICE TO EXPAND ───                               │
│                                                                  │
│  ┌─ features-delta-one-service (expanded) ───────────────────┐   │
│  │                                                           │   │
│  │  Sharding: category × feature_group × date                │   │
│  │  Estimated Shards: ~2,400                                 │   │
│  │                                                           │   │
│  │  ┌─ COMPLETION HEATMAP (date × category) ──────────────┐ │   │
│  │  │                                                      │ │   │
│  │  │         Mar 16  Mar 17  Mar 18  Mar 19  Mar 20  ... │ │   │
│  │  │  cefi    ██      ██      ██      ██      ░░         │ │   │
│  │  │  tradfi  ██      ██      ██      ░░      ░░         │ │   │
│  │  │  defi    ██      ██      ░░      ░░      ░░         │ │   │
│  │  │                                                      │ │   │
│  │  │  ██ = complete    ░░ = pending    ▓▓ = running       │ │   │
│  │  └──────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │  [Compute Missing]  [Compute Date Range]  [View Logs]    │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ ACTIVE JOBS ─────────────────────────────────────────────┐   │
│  │  Job ID       │ Service          │ Shards │ Progress │ ETA│   │
│  │  feat-d1-0423 │ delta-one        │ 240    │ ███░ 75% │ 8m│   │
│  │  feat-vc-0423 │ volatility       │ 180    │ █░░░ 30% │ 22│   │
│  │  feat-sp-0423 │ sports           │ 320    │ ██░░ 55% │ 15│   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Shared Patterns Across ALL ETL Pipelines

The same pipeline pattern applies to Data ETL, Feature ETL, AND Model Training ETL:

| Pattern              | Data ETL (Acquire)                    | Feature ETL (Build)             | Model Training ETL (Build)                    |
| -------------------- | ------------------------------------- | ------------------------------- | --------------------------------------------- |
| Layered service list | Layer 1 (instruments), Layer 2 (data) | Layer 3 (feature engineering)   | Layer 4 (ML training)                         |
| Sharding dimensions  | category × venue × date               | category × feature_group × date | instrument × timeframe × target_type × config |
| Completion heatmap   | date × venue                          | date × category                 | model × date_range                            |
| Batch/Live toggle    | Download historical vs stream         | Compute historical vs live      | Train on history vs retrain on new data       |
| Job management       | Trigger downloads, monitor            | Trigger computation, monitor    | Trigger training, monitor epochs              |
| Progress metric      | Files downloaded / total              | Shards computed / total         | Epochs complete / total                       |

The component architecture should be shared — build a reusable `PipelineStatusView` component
that all three ETL views can use with different data sources.

### Model Training as an ETL Pipeline

The user specifically called out that model training also has an ETL tracking view:

```
┌─ MODEL TRAINING PIPELINE ────────────────────────────────────────┐
│                                                                   │
│  ┌─ ACTIVE TRAINING JOBS ──────────────────────────────────────┐ │
│  │  Model               │ Status   │ Epoch │ Train Loss│ Val   │ │
│  │  ────────────────────┼──────────┼───────┼───────────┼───────│ │
│  │  BTC Directional v4  │ Training │ 47/100│ 0.234     │ 0.298 │ │
│  │  ETH Vol Regime v2   │ Training │ 12/50 │ 0.412     │ 0.445 │ │
│  │  Multi-Asset Mom v3  │ Queued   │ 0/200 │ —         │ —     │ │
│  │  SOL Funding v1      │ Complete │ 80/80 │ 0.189     │ 0.215 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Key insight: "Next time we train this model, we can see how     │
│  many epochs would be enough" — the training loss/validation     │
│  loss history per model version tells you optimal epoch count.   │
│                                                                   │
│  ┌─ TRAINING HISTORY (SOL Funding v1) ─────────────────────────┐ │
│  │  Run  │ Date       │ Epochs │ Best Val │ Best Epoch │ Time  │ │
│  │  ─────┼────────────┼────────┼──────────┼────────────┼───────│ │
│  │  #3   │ 2026-03-22 │ 80     │ 0.215    │ 62         │ 24m   │ │
│  │  #2   │ 2026-03-15 │ 100    │ 0.228    │ 71         │ 31m   │ │
│  │  #1   │ 2026-03-01 │ 100    │ 0.245    │ 68         │ 30m   │ │
│  │                                                              │ │
│  │  → Insight: best val found at ~65 epochs. 80 is sufficient.  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Inspiration / Reference

- **deployment-ui (localhost:5183)** — Already built. Layer 3 services, deploy form with
  sharding dimensions, data status tab with date range + category filters, completion heatmap
- **Dagster Cloud** — Asset materialization status, freshness monitoring, pipeline DAG
- **Prefect Cloud** — Flow runs, task states, scheduling
- **Weights & Biases** — Training run tracking, loss curves, hyperparameter sweep visualization

---

## 3. ML Model Training & Evaluation

### What It Is

The workspace for training ML models using computed features. This covers the full lifecycle:

1. **Configure** — Select model architecture, features (with exact versions), hyperparameters
2. **Train** — Run training jobs, monitor progress (epochs, losses)
3. **Evaluate** — Review accuracy, algo-trading-specific statistics
4. **Compare** — Champion vs challenger, experiment comparison

### 3A. Model Configuration & Metadata

The model config is the mirror of the feature config. Just as a feature records "which
input data, which symbols, which parameters", a model records "which features at which
versions, which architecture, which hyperparameters". Every model config change creates
a new model version.

#### Core Configuration

| Setting         | Description                   | Example Values                                                     |
| --------------- | ----------------------------- | ------------------------------------------------------------------ |
| Model Family    | Architecture type             | XGBoost, LSTM, Transformer, Random Forest, Ensemble                |
| Target Variable | What the model predicts       | price_direction, volatility_regime, optimal_entry, win_probability |
| Target Type     | Classification vs regression  | Binary classification, multi-class, regression                     |
| Instruments     | Which instruments to train on | BTC-PERP, ETH-PERP, or "All CeFi Perps"                            |
| Timeframe       | Bar/candle period             | 1m, 5m, 15m, 1h, 4h, 1d                                            |

#### Feature Version Linkage (Critical)

This is the key relationship: a model config explicitly records which feature versions it
uses. This means when you retrain, you know exactly which features were inputs.

```
Model: BTC Directional v4
├── Feature Inputs:
│   ├── ema_50         v2.1  (length=50, symbols=[BTC,ETH,SOL], 1H)
│   ├── rsi_14         v1.3  (length=14, overbought=70, 1H)
│   ├── funding_rate   v3.0  (settlement=8h, smoothing=EMA-3)
│   ├── basis_spot_perp v2.0  (lag_bars=3)
│   ├── realized_vol   v1.1  (window=24h, method=garman_klass)
│   └── ... 10 more features, each pinned to a specific version
│
├── Architecture: XGBoost
├── Hyperparameters:
│   ├── n_estimators: 500
│   ├── max_depth: 6
│   ├── learning_rate: 0.01
│   ├── subsample: 0.8
│   └── colsample_bytree: 0.8
│
├── Data Windows:
│   ├── Training:    2024-01-01 → 2025-12-31 (17,520 samples)
│   ├── Validation:  2026-01-01 → 2026-02-28 (1,416 samples)
│   └── Test:        2026-03-01 → 2026-03-23 (552 samples)
│
└── Walk-Forward: retrain_every=30d, expanding_window=True
```

When a feature is updated (e.g., `ema_50` goes from v2.1 to v2.2), the model config
can either:

- **Pin** to the old version (keep using v2.1 data)
- **Upgrade** to the new version (creates a new model version that retrains)

#### Hyperparameters (varies by model family)

| Model Family       | Key Hyperparameters                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| XGBoost / LightGBM | n_estimators, max_depth, learning_rate, subsample, colsample_bytree, min_child_weight, gamma, reg_alpha, reg_lambda |
| LSTM / GRU         | hidden_size, num_layers, dropout, bidirectional, sequence_length, batch_size                                        |
| Transformer        | n_heads, d_model, n_layers, d_ff, dropout, positional_encoding, context_length                                      |
| Random Forest      | n_estimators, max_depth, min_samples_split, min_samples_leaf, max_features                                          |
| Ensemble           | base_models[], aggregation_method (voting, stacking, blending), meta_learner                                        |

The configuration form should dynamically show relevant hyperparameters based on the
model family selected (same dynamic pattern as feature config forms).

#### Model Configuration Storage Model

```
ModelConfig {
  model_id:          "btc_directional"
  model_name:        "BTC Directional Model"
  version:           "v4.0"               // incremented on any config change

  // Architecture
  model_family:      "xgboost"
  target_variable:   "price_direction"
  target_type:       "binary_classification"

  // Feature linkage (pinned versions)
  feature_inputs: [
    { feature_id: "ema_50",         version: "v2.1" },
    { feature_id: "rsi_14",         version: "v1.3" },
    { feature_id: "funding_rate",   version: "v3.0" },
    // ... each feature at a specific version
  ]

  // Training scope
  instruments:       ["BTC-PERP"]
  timeframe:         "1H"
  training_window:   { start: "2024-01-01", end: "2025-12-31" }
  validation_window: { start: "2026-01-01", end: "2026-02-28" }
  test_window:       { start: "2026-03-01", end: "2026-03-23" }

  // Hyperparameters
  hyperparameters: {
    n_estimators: 500,
    max_depth: 6,
    learning_rate: 0.01,
    // ...
  }

  // Walk-forward
  walk_forward: { retrain_every: "30d", expanding_window: true }

  // Metadata
  created_by:        "iggy"
  created_at:        "2026-03-20T10:00:00Z"
  version_note:      "Added SOL funding_rate feature, increased estimators"
}
```

#### Model Version History (mirrors Feature Version History)

```
┌─ VERSION HISTORY: btc_directional ───────────────────────────────┐
│                                                                   │
│  Version │ Date       │ Changed                    │ Training     │
│  ────────┼────────────┼────────────────────────────┼──────────────│
│  v4.0    │ 2026-03-20 │ +3 features, epochs 500    │ Completed    │
│  v3.1    │ 2026-03-10 │ learning_rate 0.05→0.01    │ Completed    │
│  v3.0    │ 2026-02-28 │ Switched to XGBoost        │ Completed    │
│  v2.0    │ 2026-02-01 │ Added walk-forward         │ Completed    │
│  v1.0    │ 2026-01-15 │ Initial (LSTM, 5 features) │ Completed    │
│                                                                   │
│  ── FEATURE VERSIONS DIFF v3.1 → v4.0 ──                         │
│  ADDED:   orderbook_imbalance v1.0, volume_profile v2.1,         │
│           funding_rate_delta v1.0                                  │
│  CHANGED: n_estimators 300→500                                    │
│  SAME:    ema_50 v2.1, rsi_14 v1.3, funding_rate v3.0 (6 more)  │
│                                                                   │
│  [Compare v3.1 ↔ v4.0]  [Retrain with Latest Features]          │
└───────────────────────────────────────────────────────────────────┘
```

### Existing Types to Extend

The codebase already has `TrainingConfig` (epochs, batchSize, learningRate, optimizer, etc.)
and `Experiment` in `lib/ml-types.ts`, plus `MODEL_FAMILIES` and `EXPERIMENTS` in
`lib/ml-mock-data.ts`. The existing `TrainingConfig` covers the hyperparameter side but
lacks the **feature version linkage** model above. The `FeatureSetVersion` type exists but
doesn't connect to model configs. These need to be linked.

### 3B. Training Progress

Once a training job is launched:

```
┌─────────────────────────────────────────────────────────────────┐
│ TRAINING: BTC Directional Model v4                               │
│ Status: TRAINING (epoch 47/100)              [Pause] [Cancel]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ LOSS CURVES ────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  Loss ▲                                                   │   │
│  │  0.8  │\                                                  │   │
│  │  0.6  │ \___                                              │   │
│  │  0.4  │     \____          train ───                      │   │
│  │  0.2  │          \______   valid ---                      │   │
│  │  0.0  │─────────────────────────────▶ Epochs              │   │
│  │       0    20     40     60     80    100                  │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ TRAINING DETAILS ───────────────────────────────────────┐   │
│  │  Model:       XGBoost (classification)                    │   │
│  │  Features:    funding_rate, basis_spot_perp, realized_vol │   │
│  │               + 12 more (15 total)                        │   │
│  │  Instrument:  BTC-PERP (Binance, Hyperliquid)             │   │
│  │  Timeframe:   1H                                          │   │
│  │  Train:       2024-01-01 → 2025-12-31 (17,520 samples)   │   │
│  │  Validation:  2026-01-01 → 2026-02-28 (1,416 samples)    │   │
│  │  ETA:         ~12 minutes remaining                       │   │
│  │  GPU/CPU:     CPU (4 cores allocated)                     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ LIVE METRICS (updating every epoch) ────────────────────┐   │
│  │  Train Loss: 0.234    │  Val Loss: 0.298                 │   │
│  │  Train Acc:  78.3%    │  Val Acc:  71.2%                  │   │
│  │  Best Val:   0.285 (epoch 42)                             │   │
│  │  Overfitting: No (val/train gap < 15%)                    │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 3C. Model Evaluation — Algo Trading Statistics

After training completes, the model evaluation page shows statistics specifically relevant
to algorithmic trading. These are NOT generic ML metrics — they are what a quant researcher
needs to decide whether to deploy a model for signal generation.

**Inspiration:** Weights & Biases run dashboard + TradingView-style performance summary

#### Signal Quality Metrics

| Metric      | Description                                        | Good Range            |
| ----------- | -------------------------------------------------- | --------------------- |
| Accuracy    | % of correct predictions                           | > 55% for directional |
| Precision   | % of predicted longs that were actually profitable | > 60%                 |
| Recall      | % of actually profitable periods that model caught | > 50%                 |
| F1 Score    | Harmonic mean of precision/recall                  | > 0.55                |
| AUC-ROC     | Area under ROC curve                               | > 0.65                |
| Log Loss    | Probabilistic calibration quality                  | < 0.65                |
| Brier Score | Probability calibration (especially for sports)    | < 0.25                |

#### Trading-Specific Metrics (Simulated on Validation Period)

| Metric                 | Description                                     | What It Tells You                 |
| ---------------------- | ----------------------------------------------- | --------------------------------- |
| Hit Rate               | % of signals that resulted in profitable trades | Core signal quality               |
| Profit Factor          | Gross profit / gross loss                       | > 1.5 is good                     |
| Sharpe Ratio           | Risk-adjusted return                            | > 1.5 for hourly, > 2.0 for daily |
| Sortino Ratio          | Downside risk-adjusted return                   | > 2.0                             |
| Max Drawdown           | Largest peak-to-trough decline                  | < 15% for most strategies         |
| Max Drawdown Duration  | Longest time in drawdown                        | < 30 days                         |
| Calmar Ratio           | Annual return / max drawdown                    | > 2.0                             |
| Win/Loss Ratio         | Average winning trade / average losing trade    | > 1.5                             |
| Average Trade Duration | How long signals stay active                    | Strategy-dependent                |
| Expectancy             | Expected $ per trade                            | Positive and meaningful           |
| Recovery Factor        | Net profit / max drawdown                       | > 3.0                             |

#### Per-Regime Analysis

Models should be evaluated across market regimes:

| Regime           | Description                | Metrics Split                      |
| ---------------- | -------------------------- | ---------------------------------- |
| Trending Up      | Sustained positive returns | Accuracy, Sharpe, Hit Rate         |
| Trending Down    | Sustained negative returns | Same — should still be positive    |
| Ranging / Choppy | Low directional conviction | Hit Rate may drop — acceptable     |
| High Volatility  | Extreme moves              | Drawdown, recovery                 |
| Low Volatility   | Compressed ranges          | Signal frequency, opportunity cost |

#### Feature Importance

After training, show which features contributed most to predictions:

```
Feature Importance (top 10):
  funding_rate          ████████████████████  0.23
  basis_spot_perp       ██████████████████    0.19
  realized_vol          █████████████         0.14
  rsi_14                ██████████            0.11
  orderbook_imbalance   ████████              0.09
  volume_profile        ███████               0.08
  macd_signal           ██████                0.06
  atr_14                █████                 0.05
  momentum_20           ████                  0.03
  funding_rate_delta    ███                   0.02
```

#### Confusion Matrix (for classification models)

```
                  Predicted
              │  Long  │ Short │ Neutral │
  Actual Long │  1,240 │   180 │     95  │
  Actual Short│   195  │ 1,105 │    110  │
  Actual Neut │   120  │   105 │    850  │
```

### Inspiration / Reference

- **Weights & Biases** — Run dashboard, metric visualization, experiment comparison
- **MLflow** — Model registry, experiment tracking, artifact logging
- **Neptune.ai** — Experiment comparison, model lineage
- **QuantConnect** — Backtest statistics panel (Sharpe, drawdown, profit factor)

---

## 4. Strategies Tab — Signal Generation & Comparison

### What It Is

The Strategies tab is where trained models are turned into **trading signals**. Users
configure a strategy (which model, signal rules, sizing, risk limits), run a strategy
backtest that generates signals, and compare signals across different strategies.

This tab answers: **"What should we trade, when, and how much?"**

The output (a signal list) feeds into the Execution tab (Section 5), which answers
**"How should we execute those trades?"**

### Design Inspiration

- **TradingView Strategy Tester** — "Very evolved, very mature, has almost everything we
  need. Replicate and adjust." We split TradingView's single backtest into two phases:
  Strategies (signal quality) and Execution (execution quality).
- **QuantConnect** — Strategy library, multi-asset support

### 4A. Strategy Backtest — Signal Generation

The strategy backtest takes a trained model and generates **signals**: what to trade,
when to trade, and how much. This is purely about the MODEL's decision quality.

#### Strategy Backtest Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ NEW STRATEGY BACKTEST                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── MODEL SELECTION ──                                           │
│  Model:           [BTC Directional v4 ▾]  (from trained models) │
│  Model Version:   [v4.0 ▾]                                      │
│  Strategy Type:   [Momentum ▾]                                   │
│                                                                  │
│  ── SIGNAL RULES ──                                              │
│  Signal Threshold: [0.65]  (model confidence to generate signal) │
│  Signal Type:      [Long/Short/Neutral ▾]                        │
│  Position Sizing:  [Fixed $ ▾]  Amount: [$10,000]               │
│  Max Concurrent:   [3 positions]                                  │
│                                                                  │
│  ── TIME RANGE ──                                                │
│  Start:  [2026-01-01]                                            │
│  End:    [2026-03-23]                                            │
│  Warmup: [20 bars]  (initial bars before generating signals)    │
│                                                                  │
│  ── RISK CONSTRAINTS ──                                          │
│  Max Position Size: [$50,000]                                    │
│  Max Drawdown Stop: [15%]                                        │
│  Max Daily Loss:    [$5,000]                                     │
│                                                                  │
│         [Run Strategy Backtest]       [Save as Template]         │
└──────────────────────────────────────────────────────────────────┘
```

#### Strategy Backtest Output: Signal List

The output of the strategy backtest is a list of signals — this becomes the INPUT
to the execution backtest:

```
┌─────────────────────────────────────────────────────────────────┐
│ STRATEGY BACKTEST SIGNALS: BTC Momentum v4                       │
│ Period: 2026-01-01 → 2026-03-23        Signals generated: 130   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  #  │ Time              │ Signal │ Instrument│ Size   │ Confidence│
│  ───┼────────────────────┼────────┼───────────┼────────┼──────────│
│  1  │ 2026-01-02 08:00  │ LONG   │ BTC-PERP  │ $10K   │ 0.78     │
│  2  │ 2026-01-02 14:00  │ CLOSE  │ BTC-PERP  │ —      │ 0.42     │
│  3  │ 2026-01-03 02:00  │ SHORT  │ BTC-PERP  │ $10K   │ 0.71     │
│  ... │                   │        │           │        │          │
│                                                                  │
│  Signal Quality Summary:                                         │
│  • 130 signals over 82 days (1.6 signals/day)                   │
│  • 81 winning signals (62.3% hit rate)                           │
│  • Avg confidence: 0.72                                          │
│                                                                  │
│         [Proceed to Execution Backtest →]                        │
└──────────────────────────────────────────────────────────────────┘
```

### 4C. Signal Comparison

Compare signals from multiple strategies on the same chart. This helps answer:
"Which strategy generates better signals for the same model and time period?"

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPARE STRATEGIES                           [Add Strategy +]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ SIGNAL TIMELINE (overlaid on price chart) ────────────────┐ │
│  │                                                             │ │
│  │  Price ▲                                                    │ │
│  │  $45K  │          /\                                        │ │
│  │  $44K  │     ____/  \    /\                                 │ │
│  │  $43K  │    /        \__/  \___                             │ │
│  │  $42K  │___/                                                │ │
│  │        └────────────────────────────────────▶ Time          │ │
│  │                                                             │ │
│  │  Strategy A (Momentum v4): ▲ = buy, ▼ = sell  (blue)       │ │
│  │  Strategy B (Mean Rev v2): ▲ = buy, ▼ = sell  (green)      │ │
│  │  Strategy C (Vol Regime):  ▲ = buy, ▼ = sell  (orange)     │ │
│  │                                                             │ │
│  │  Visual: see where strategies agree (same direction) and    │ │
│  │  disagree (opposite signals at same time)                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ SIGNAL QUALITY COMPARISON ─────────────────────────────────┐ │
│  │  Metric          │ A (Mom v4)│ B (MR v2) │ C (Vol Reg)     │ │
│  │  ────────────────┼───────────┼───────────┼─────────────────│ │
│  │  Total Signals   │ 130       │ 95        │ 42              │ │
│  │  Signals/Day     │ 1.6       │ 1.2       │ 0.5             │ │
│  │  Hit Rate        │ 62.3% ★   │ 58.1%     │ 71.4% ★         │ │
│  │  Avg Confidence  │ 0.72      │ 0.68      │ 0.81 ★           │ │
│  │  Signal Overlap  │ —         │ 34% w/ A  │ 12% w/ A        │ │
│  │                                                             │ │
│  │  ★ = best in category                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Send All to Execution Tab]  [Send Best to Execution Tab]       │
└──────────────────────────────────────────────────────────────────┘
```

### Backtest Mode: Single-Instrument vs Portfolio

Strategy backtests support two modes:

- **Single-instrument** (default): One model, one instrument, straightforward signal list.
  This is the simpler case and the primary workflow.
- **Portfolio-level**: One model (or ensemble), multiple instruments simultaneously. Signals
  are generated across all instruments with cross-asset position limits. The signal list
  includes instrument-level breakdown and portfolio-level aggregation.

The mode is selected in the strategy backtest configuration form.

---

## 5. Execution Tab — Execution Backtest & TradingView-Style Results

### What It Is

The Execution tab takes signals from the Strategies tab and simulates how they would be
EXECUTED in the real market. This is about the execution QUALITY — slippage, fill times,
order types, and execution algorithms.

This tab answers: **"How well can we actually execute these trades?"**

#### Execution Backtest Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ EXECUTION BACKTEST                                               │
│ Input: 130 signals from "BTC Momentum v4 Strategy Backtest"      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── EXECUTION ALGORITHM ──                                       │
│  Algorithm:        [TWAP ▾]                                      │
│     Options:  TWAP / VWAP / Iceberg / Best Execution /           │
│               Aggressive Limit / Passive Limit / Market Only     │
│                                                                  │
│  ── ALGO PARAMETERS (dynamic per algorithm) ──                   │
│                                                                  │
│  TWAP:                              │  VWAP:                     │
│    Execution Window: [5 min]        │    Volume Participation: [10%]│
│    Slices: [10]                     │    Max Participation: [25%] │
│    Urgency: [Medium ▾]             │    Price Limit: [± 10 bps] │
│                                     │                            │
│  Iceberg:                           │  Aggressive Limit:         │
│    Visible Qty: [20%]              │    Limit Offset: [2 bps]   │
│    Refresh Rate: [500ms]           │    Cancel After: [30s]     │
│                                                                  │
│  ── ORDER TYPE ──                                                │
│  Primary:    [Limit ▾]  (Limit / Market / Limit-then-Market)   │
│  Maker Fee:  [2 bps]                                             │
│  Taker Fee:  [5 bps]                                             │
│                                                                  │
│  ── VENUE SELECTION ──                                           │
│  Venues: [✓ Binance] [✓ Hyperliquid] [✓ Deribit]               │
│  Routing: [Smart Order Router ▾]  (SOR / Venue-specific / Split)│
│                                                                  │
│  ── MARKET SIMULATION ──                                         │
│  Slippage Model:    [Orderbook-based ▾]  (Fixed BPS / OB-based) │
│  Execution Delay:   [100ms]                                       │
│  Market Impact:     [Linear ▾]  (None / Linear / Square-root)   │
│  Partial Fill:      [✓ Allow partial fills]                      │
│                                                                  │
│        [Run Execution Backtest]       [Save Config]              │
└──────────────────────────────────────────────────────────────────┘
```

### 5A. Execution Backtest Configuration

(See wireframe above)

#### Execution Algo Library (fixed for now, extensible later)

| Algo             | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| TWAP             | Time-weighted execution across fixed time slices                 |
| VWAP             | Volume-weighted participation targeting intraday volume curve    |
| Iceberg          | Hidden large order with small visible quantity                   |
| Aggressive Limit | Limit order with tight offset, cancel and re-enter if not filled |
| Passive Limit    | Post-only limit order at best bid/ask                            |
| Market Only      | Immediate market order (highest slippage, fastest fill)          |

The architecture supports adding custom algos later, but the UI initially shows only this fixed list.

#### Execution Backtest Metrics (specific to execution quality)

| Metric                   | Description                                           | What It Tells You            |
| ------------------------ | ----------------------------------------------------- | ---------------------------- |
| Avg Slippage (bps)       | Difference between signal price and fill price        | Execution efficiency         |
| Slippage Cost ($)        | Total cost of slippage across all trades              | Dollar impact                |
| Avg Fill Time            | Time from signal to full fill                         | Execution speed              |
| Fill Rate (%)            | % of signals that were fully filled                   | Liquidity sufficiency        |
| Partial Fill Rate        | % of orders that were only partially filled           | Liquidity depth              |
| Market Impact (bps)      | Price movement caused by our order                    | Our footprint                |
| Maker/Taker Ratio        | % of fills at maker vs taker fee                      | Fee optimization             |
| Total Commission ($)     | Total fees paid                                       | Cost of execution            |
| Implementation Shortfall | Diff between decision price and final execution price | Overall execution quality    |
| Venue Breakdown          | Volume and fill quality per venue                     | Best venue for this strategy |

---

### 5B. Results Review — TradingView-Style (5 Sub-Tabs)

After the execution backtest completes, the results review combines strategy performance +
execution quality into a unified TradingView-inspired dashboard with 5 tabs.

TradingView has 4 tabs (Overview, Performance, Trades, Properties). We add a 5th:
**Execution Quality** — showing slippage distribution, venue breakdown, and implementation
shortfall. TradingView doesn't have this because it doesn't simulate realistic execution.

#### Results — Overview Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ BACKTEST: BTC Momentum v4 — 2026-01-01 → 2026-03-23            │
│ ┌──────────┬──────────────┬────────────┬────────────┬─────────┐ │
│ │ Overview │ Performance  │ Trades     │ Execution  │ Config  │ │
│ └──────────┴──────────────┴────────────┴────────────┴─────────┘ │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ EQUITY CURVE ───────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  $12K ▲           ___/\                                   │   │
│  │  $11K │        __/     \    /\__/\                        │   │
│  │  $10K │    ___/              \                             │   │
│  │  $9K  │   /                                               │   │
│  │  $8K  │──/──────────────────────────────▶                 │   │
│  │       Jan      Feb       Mar                              │   │
│  │                                                           │   │
│  │  ── Strategy ── Buy & Hold ── Drawdown (shaded below)     │   │
│  │  Hover: Shows trade markers (▲ buy, ▼ sell), DD, P&L     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ KEY METRICS ────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  Net Profit      │  $2,340 (+23.4%)    │  ✅              │   │
│  │  Sharpe Ratio    │  2.14               │  ✅              │   │
│  │  Max Drawdown    │  -$890 (-8.2%)      │  ✅ (< 15%)     │   │
│  │  Profit Factor   │  1.82               │  ✅              │   │
│  │  Win Rate        │  62.3% (81/130)     │  ✅              │   │
│  │  Avg Trade       │  $18.00             │                  │   │
│  │  Total Trades    │  130                │                  │   │
│  │  Avg Duration    │  4.2 hours          │                  │   │
│  │  vs Buy & Hold   │  +$1,420 (+14.2%)   │  Outperformed   │   │
│  │                                                           │   │
│  │  EXECUTION SUMMARY:                                       │   │
│  │  Avg Slippage    │  3.2 bps            │  ✅ (< 5 bps)   │   │
│  │  Total Fees      │  $312               │                  │   │
│  │  Fill Rate       │  98.5%              │  ✅              │   │
│  │  Avg Fill Time   │  1.2s               │                  │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

Note the **5th tab "Execution"** — our addition to TradingView's 4-tab model.

#### Results — Performance Tab

Detailed statistics split by All Trades / Longs Only / Shorts Only
(same split as TradingView):

```
┌─────────────────────────────────────────────────────────────────┐
│            │  All Trades  │  Long Trades  │  Short Trades       │
│  ──────────┼──────────────┼───────────────┼───────────────────  │
│  RETURNS                                                        │
│  Net Profit         │  $2,340      │  $1,680       │  $660     │
│  Gross Profit       │  $5,120      │  $3,440       │  $1,680   │
│  Gross Loss         │  -$2,780     │  -$1,760      │  -$1,020  │
│  Max Run-Up         │  $3,100      │  $2,200       │  $1,100   │
│  Max Drawdown       │  -$890       │  -$620        │  -$480    │
│  Buy & Hold Return  │  $920        │                           │
│                                                                  │
│  RATIOS                                                          │
│  Sharpe Ratio       │  2.14        │  2.45         │  1.52     │
│  Sortino Ratio      │  3.21        │  3.80         │  2.05     │
│  Profit Factor      │  1.84        │  1.95         │  1.65     │
│  Calmar Ratio       │  2.63        │  2.71         │  1.38     │
│  Recovery Factor    │  2.63        │  2.71         │  1.38     │
│                                                                  │
│  TRADES                                                          │
│  Total Trades       │  130         │  78           │  52       │
│  Win Rate           │  62.3%       │  65.4%        │  57.7%    │
│  Avg Winning Trade  │  $83.61      │  $67.19       │  $56.00   │
│  Avg Losing Trade   │  -$56.73     │  -$65.19      │  -$48.57  │
│  Largest Winner     │  $420        │  $420         │  $310     │
│  Largest Loser      │  -$290       │  -$290        │  -$195    │
│  Avg Trade Duration │  4.2h        │  5.1h         │  2.8h     │
│  Avg Bars in Trade  │  4.2         │  5.1          │  2.8      │
│  Max Consec. Wins   │  8           │  7            │  5        │
│  Max Consec. Losses │  4           │  3            │  4        │
│                                                                  │
│  RISK                                                            │
│  Max DD Duration    │  3.2 days    │  2.1 days     │  1.8 days │
│  Expectancy ($)     │  $18.00      │  $21.54       │  $12.69   │
│  Expectancy (R)     │  0.32 R      │  0.33 R       │  0.26 R   │
│  Daily VaR (95%)    │  -$180       │  -$120        │  -$95     │
└──────────────────────────────────────────────────────────────────┘
```

#### Results — Trades Tab

Complete trade record (TradingView-style):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  #  │ Date/Time         │ Signal │ Instrument│ Price  │ Fill   │ Slip │ P&L │
│  ───┼────────────────────┼────────┼───────────┼────────┼────────┼──────┼─────│
│  1  │ 2026-01-02 08:00  │ LONG   │ BTC-PERP  │ 42,150 │ 42,153 │ 0.7bp│+$82│
│  2  │ 2026-01-02 14:00  │ EXIT   │ BTC-PERP  │ 42,490 │ 42,488 │ 0.5bp│    │
│  3  │ 2026-01-03 02:00  │ SHORT  │ BTC-PERP  │ 42,680 │ 42,684 │ 0.9bp│-$45│
│  ... │                   │        │           │        │        │      │    │
│  130 │ 2026-03-22 18:00 │ EXIT   │ BTC-PERP  │ 68,440 │ 68,436 │ 0.6bp│    │
│                                                                              │
│  Additional columns (toggleable):                                            │
│  • Drawdown / Run-up per trade       • Execution algo used                   │
│  • Cumulative P&L                    • Fill time (ms)                        │
│  • Commission paid (maker/taker)     • Venue routed to                       │
│  • Trade duration (bars)             • Partial fill %                        │
│  • Model confidence at signal time   • Market impact (bps)                   │
│                                                                              │
│  [Export CSV]  [Export JSON]                         Showing 130 trades      │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Results — Execution Tab (our addition to TradingView's model)

```
┌─────────────────────────────────────────────────────────────────┐
│ EXECUTION QUALITY ANALYSIS                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ EXECUTION SUMMARY ───────────────────────────────────────┐  │
│  │  Algorithm:              TWAP (5min, 10 slices)            │  │
│  │  Order Type:             Limit → Market fallback           │  │
│  │  Venues:                 Binance (72%), Hyperliquid (28%) │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ SLIPPAGE DISTRIBUTION ────────────────────────────────────┐  │
│  │  (histogram: # of trades by slippage bucket)               │  │
│  │                                                             │  │
│  │  0-1 bps:  ████████████████████████  54 trades (41.5%)     │  │
│  │  1-3 bps:  ██████████████████        42 trades (32.3%)     │  │
│  │  3-5 bps:  █████████                 22 trades (16.9%)     │  │
│  │  5-10bps:  ████                      10 trades (7.7%)      │  │
│  │  >10 bps:  █                          2 trades (1.5%)      │  │
│  │                                                             │  │
│  │  Mean: 2.1 bps   │  Median: 1.4 bps  │  P95: 7.8 bps     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ VENUE BREAKDOWN ──────────────────────────────────────────┐  │
│  │  Venue        │ Fills │ Avg Slip │ Maker % │ Avg Fill Time │  │
│  │  ─────────────┼───────┼──────────┼─────────┼───────────────│  │
│  │  Binance      │  94   │ 1.8 bps  │  68%    │  0.9s         │  │
│  │  Hyperliquid  │  36   │ 2.9 bps  │  52%    │  1.8s         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ IMPLEMENTATION SHORTFALL ──────────────────────────────────┐  │
│  │  Decision Price → Arrival Price → Final Fill Price           │  │
│  │  Total shortfall: 4.2 bps ($176)                             │  │
│  │    Delay cost:       1.1 bps ($46)                           │  │
│  │    Market impact:    1.8 bps ($76)                           │  │
│  │    Fees:             1.3 bps ($54)                           │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Compare: TWAP vs VWAP vs Market]  [Re-run with different algo] │
└──────────────────────────────────────────────────────────────────┘
```

#### Results — Config Tab (Properties)

Shows the full configuration chain for reproducibility:

```
┌─────────────────────────────────────────────────────────────────┐
│ BACKTEST CONFIGURATION (full lineage)                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MODEL:     BTC Directional v4.0 (XGBoost)                      │
│  FEATURES:  ema_50 v2.1, rsi_14 v1.3, funding_rate v3.0 +12    │
│  STRATEGY:  Momentum, threshold=0.65, sizing=Fixed $10K         │
│  EXECUTION: TWAP (5min/10 slices), Limit→Market, SOR            │
│  VENUES:    Binance, Hyperliquid                                 │
│  PERIOD:    2026-01-01 → 2026-03-23 (82 days, 20-bar warmup)   │
│  RISK:      Max DD 15%, Max daily loss $5K, Max 3 positions     │
│                                                                  │
│  [Edit & Re-run]  [Clone to New Backtest]  [Export Config JSON]  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 5C. Execution Quality Comparison

Compare execution quality across different algos for the **same signals**. This is stats-focused
(not chart overlay like signal comparison in the Strategies tab).

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPARE EXECUTION ALGOS                        [Add Backtest +]  │
│ Using signals from: "BTC Momentum v4 Strategy Backtest"           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ EQUITY CURVES (overlaid) ───────────────────────────────┐   │
│  │                                                           │   │
│  │  A: TWAP (5min, 10 slices)             ───  blue         │   │
│  │  B: VWAP (10% participation)           ---  green        │   │
│  │  C: Market Only                        ···  orange       │   │
│  │  Buy & Hold                            ─── gray          │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ EXECUTION QUALITY COMPARISON ──────────────────────────┐    │
│  │  Metric           │  A (TWAP)  │  B (VWAP)  │  C (Mkt)  │   │
│  │  ─────────────────┼────────────┼────────────┼───────────│   │
│  │  Avg Slippage     │  2.1 bps   │  1.8 bps ★ │  5.2 bps  │   │
│  │  Total Slip Cost  │  $176      │  $152  ★   │  $437     │   │
│  │  Avg Fill Time    │  1.2s      │  2.4s      │  0.1s ★   │   │
│  │  Fill Rate        │  98.5%     │  97.2%     │  100% ★   │   │
│  │  Partial Fill %   │  4.6%      │  8.1%      │  0% ★     │   │
│  │  Maker/Taker      │  68/32%    │  72/28% ★  │  0/100%   │   │
│  │  Total Fees       │  $312      │  $298  ★   │  $410     │   │
│  │  Impl. Shortfall  │  4.2 bps   │  3.8 bps ★ │  8.1 bps  │   │
│  │  Market Impact    │  1.8 bps   │  1.4 bps ★ │  3.2 bps  │   │
│  │                                                           │   │
│  │  ★ = best in category                                     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ NET PROFIT COMPARISON (same signals, different execution) ┐  │
│  │  A (TWAP):       $2,340 ★  │  Net after execution costs    │  │
│  │  B (VWAP):       $2,280    │                                │  │
│  │  C (Market):     $2,050    │                                │  │
│  │                                                             │  │
│  │  Insight: VWAP has lowest slippage and fees, but TWAP nets  │  │
│  │  highest profit due to faster fills on volatile bars.        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Mark Best as Strategy Candidate →]                             │
└──────────────────────────────────────────────────────────────────┘
```

### 5D. Strategy Candidate → Promote

After reviewing execution backtest results, users can mark a backtest as a **strategy candidate**.
This is an intermediate stage within the Build section — the candidate appears with a
"candidate" badge and summary metrics. The full Promote lifecycle tab picks up candidates
for formal review and stage progression (dev → staging → prod).

The candidate record captures the full lineage:

- Feature versions used
- Model version and architecture
- Strategy config (signal rules, sizing, risk)
- Execution config (algo, venues, order types)
- Key metrics (P&L, Sharpe, slippage, fill rate)

### Inspiration / Reference

- **TradingView Strategy Tester** — Overview (equity curve + metrics), Performance Summary
  (detailed stats split by long/short), List of Trades (full trade table), Properties (params).
  "Very evolved, very mature, has almost everything we need. Replicate and adjust."
- **QuantConnect** — Backtest results page, strategy library, multi-asset support
- **Alpaca** — Paper trading → live promotion flow
- **Transaction Cost Analysis (TCA)** platforms — Implementation shortfall decomposition,
  venue analysis, execution algo comparison

---

## 6. Quant Workspace — Historical Reports, Comparisons & Governance

### What It Is

The Quant Workspace covers what the other tabs do NOT — the long-term view:

1. **Historical reports** — archived experiment results, past backtest outcomes, research logs
2. **Saved comparisons** — bookmarked strategy comparisons, execution algo evaluations
3. **Model governance** — audit trails, approval workflows, compliance tracking
   (moved here from the old ML Deploy/Monitoring sub-tabs)

While the Overview tab shows live pipeline status and the other tabs handle active
workflows, the Quant Workspace is the archival and governance layer.

### DEFERRED for initial build

Focus is on tabs 0-5 (Overview + 5 pipeline tabs). The Quant Workspace will be built
after the pipeline tabs are functional and we know exactly what gap remains.

The existing `QuantDashboard` component (948 lines) will be preserved but not
restructured until we have clarity on what reports and governance views are needed.

### Planned Content (when built)

| Section               | Content                                                        | Source                                 |
| --------------------- | -------------------------------------------------------------- | -------------------------------------- |
| **Reports**           | Archived backtest results, experiment summaries, research logs | Saved from Strategies + Execution tabs |
| **Saved Comparisons** | Bookmarked strategy comparisons, algo evaluations              | Saved from Compare views               |
| **Governance**        | Model audit trail, approval workflows, compliance tracking     | Moved from ML Governance sub-tab       |
| **Research Metrics**  | Experiments run, strategies tested, model accuracy trends      | Aggregated across all tabs             |

---

## Asset Class Variations

Each pipeline stage adapts to the asset class being researched:

### Features By Shard

| Shard          | Feature Examples                                                 | Source Services       |
| -------------- | ---------------------------------------------------------------- | --------------------- |
| **CeFi**       | funding_rate, basis_spot_perp, orderbook_imbalance, realized_vol | delta-one, volatility |
| **DeFi**       | health_factor, lst_exchange_rate, pool_liquidity, borrow_apy     | onchain               |
| **TradFi**     | iv_surface, greeks, earnings_surprise, macro_indicators          | volatility, commodity |
| **Sports**     | team_form, odds_movement, xg_rolling, head_to_head               | sports                |
| **Prediction** | market_sentiment, implied_probability, volume_profile            | cross-instrument      |

### Models By Shard

| Shard          | Model Types                    | Target Variables                                 |
| -------------- | ------------------------------ | ------------------------------------------------ |
| **CeFi**       | XGBoost, LSTM, Transformer     | price_direction, volatility_regime, funding_sign |
| **DeFi**       | Gradient Boosting, Risk Models | health_factor_prediction, yield_regime           |
| **TradFi**     | Factor Models, Options ML      | return_prediction, vol_surface_prediction        |
| **Sports**     | Classification (binary/multi)  | match_outcome, halftime_score, over_under        |
| **Prediction** | Calibrated classifiers         | event_probability, resolution_timing             |

### Backtest Metrics By Shard

| Shard           | Primary Metrics                   | Special Metrics                              |
| --------------- | --------------------------------- | -------------------------------------------- |
| **CeFi/TradFi** | Sharpe, Max DD, Profit Factor     | Turnover, Market Impact                      |
| **DeFi**        | APY, Health Factor Min, Gas Costs | IL (impermanent loss), Liquidation Proximity |
| **Sports**      | ROI, CLV, Kelly Fraction          | Bankroll DD, Max Stake %, Void Rate          |
| **Prediction**  | Brier Score, ROI                  | Binary Accuracy, Market Efficiency           |

---

## Quick Reference — Tab Structure (7 tabs)

```
Overview (§0) │ Features (§1) │ Feature ETL (§2) │ Models (§3) │ Strategies (§4) │ Execution (§5) │ Quant Workspace (§6)
```

See the Pipeline Overview at the top of this document for the full tab table and
individual sections §0-§6 for detailed wireframes and specifications.

---

## All Design Decisions — RESOLVED

All questions have been answered through the Q&A session (2026-03-23). Full answers are
in `RESEARCH_BUILD_SECTION_AUDIT.md §4`.

### From User Feedback (Round 1)

1. **Feature configuration depth:** Full config — input data type, symbols, computation params.
   → **§1 Feature Catalogue**
2. **Feature versioning:** Every parameter change = new version.
   → **§1 Feature Versioning**
3. **Model-to-feature linkage:** Exact feature versions pinned in model config.
   → **§3 Model Configuration**
4. **Model training ETL:** Epoch tracking, loss curves, historical run data.
   → **§2 Model Training Pipeline**
5. **Visualization reuse:** Reuse existing components aggressively.
   → **Existing Codebase Inventory section**
6. **Two-phase backtesting:** Strategy → signals, Execution → trades.
   → **§4 (Strategies) + §5 (Execution)**
7. **TradingView replication:** 5-tab results (Overview, Performance, Trades, Execution Quality, Config).
   → **§5B Results Review**
8. **Signals not separate:** Output of strategy backtest, not standalone page.
   → **§4A signal list output**

### From Q&A Session (Round 2) — ALL RESOLVED

9. **Tab structure:** 7 tabs — Overview, Features, Feature ETL, Models, Strategies, Execution,
   Quant Workspace. Overview is the landing page. Strategies and Execution are SEPARATE tabs.
   → **Tab Structure section**

10. **Feature ETL is the primary UI:** ETL pipeline views (Acquire and Build) are the main UI
    for managing data/feature computation. deployment-ui is deployment-only (dev/stage/prod VMs).
    → **§2 Feature ETL Pipeline**

11. **Feature presets:** YES — offer standard presets (EMA-9/21/50/200, RSI-14, MACD-12-26-9,
    Bollinger-20-2, ATR-14). One-click apply, then customize.
    → **§1 Feature Presets**

12. **Feature dependency chains:** YES — features can depend on other features. MACD depends
    on EMA-12 and EMA-26. Version changes cascade. Feature Catalogue shows dependency tree.
    → **§1 Feature Dependency Chains**

13. **Multi-asset backtests:** BOTH — single-instrument (default) AND portfolio-level.
    Separate modes in backtest configuration form.
    → **§4 Strategies Tab** (backtest mode subsection)

14. **Backtest → Promote flow:** Intermediate "strategy candidate" stage within Build.
    User marks a backtest result as candidate → appears in Promote lifecycle tab.
    → **§5D Strategy Candidate → Promote**

15. **Execution algo library:** Fixed for now (TWAP, VWAP, Iceberg, Aggressive Limit,
    Passive Limit, Market Only). Architecture extensible for custom algos later.
    → **§5A Execution Algo Library**

16. **Signal comparison:** In Strategies tab — overlay signals from multiple strategies on
    same price chart with different colors. Show signal timing diffs and quality stats.
    → **§4C Signal Comparison**

17. **Execution quality comparison:** In Execution tab — stats-focused comparison of
    execution algos (slippage, fill time, fill rate, impl. shortfall, venue breakdown).
    → **§5C Execution Quality Comparison**

---

## Open Questions

None remaining. All design decisions have been finalized.
