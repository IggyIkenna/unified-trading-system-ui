# ML / Models Tab — Tracking Document

> **Route:** `/services/research/ml`
> **Position:** Tab 4 of 7 in the Build lifecycle (`Overview | Features | Feature ETL | **Models** | Strategies | Execution | Quant Workspace`)
> **Status:** In progress — legacy ML platform pages exist, need major restructuring.
> **Companion docs:** `BUILD_SECTION_SPEC.md §3`, `RESEARCH_BUILD_SECTION_AUDIT.md §2.2–2.7`, `MOCK_DATA_TRACKING.md`

---

## 1. Vision

### What This Tab Is

The Models tab is the **ML research laboratory**. Everything related to making models
better lives here — configuring, training, evaluating, iterating, and comparing. The
quant researcher lives in this tab until the model is good enough to send for team review.

> "Configure, train, evaluate, iterate — and when it's good enough, send it for review."

The researcher's iterative loop:

1. Select features → configure model → train → evaluate results
2. Not good enough? Try different features, more/fewer epochs, different walk-forward window
3. Compare v5 against v4 — is it actually better or just noise?
4. Check regime breakdown — does it work in trending AND ranging markets?
5. Satisfied? Mark the model for team review in Promote tab.

**Everything to make the model better happens HERE.** Promote is only the sign-off gate
where the team reviews an already-good model.

It is NOT for:

- **Feature definition/computation** → Features tab + Feature ETL tab
- **Strategy backtesting (signal generation)** → Strategies tab
- **Execution simulation (TWAP/VWAP fills)** → Execution tab
- **Team review & sign-off of completed models** → Promote lifecycle tab
- **Live model monitoring / drift detection** → Observe lifecycle tab
- **Deployment / rollout** → Promote lifecycle tab

### Pipeline Position

```
Processed Data (Acquire) → Features (define) → Feature ETL (compute) → MODELS (train) → Strategies (backtest) → Execution (simulate) → Promote (evaluate & deploy)
```

### Build Tab Boundaries (How the 7 Tabs Relate)

```
┌──────────────────────────────────────────────────────────────────────┐
│ BUILD LIFECYCLE — The researcher's workspace                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Features ──→ Feature ETL ──→ MODELS ──→ Strategies ──→ Execution   │
│  "What do     "Compute       "Train     "Take signals,   "Take       │
│   we measure?" features       models.    apply sizing     signals,    │
│               at scale"      Iterate    & signal rules.  simulate    │
│                              until      Assumes fills     real fills  │
│                              good."     w/ min slippage"  w/ TWAP/   │
│                                                          VWAP etc."  │
│                                                                      │
│  The researcher's loop:                                              │
│  1. Define features (Features tab)                                   │
│  2. Compute them (Feature ETL tab)                                   │
│  3. Train model → evaluate → iterate (Models tab)                    │
│  4. Best model → generate signals (Strategies tab)                   │
│  5. Signals → simulate real execution (Execution tab)                │
│  6. Good results → send to Promote for team review                   │
│                                                                      │
│  Key insight: Steps 3-5 form a tight feedback loop. The researcher   │
│  may find that model signals don't survive execution slippage, and   │
│  come back to Models to retrain with different features/params.      │
└──────────────────────────────────────────────────────────────────────┘
```

### What Promote Tab Does (and Does NOT Do)

Promote receives models/strategies that the researcher has ALREADY fully evaluated.

| Promote tab does                                                | Promote tab does NOT do                 |
| --------------------------------------------------------------- | --------------------------------------- |
| Team review and sign-off (multi-person approval)                | Re-evaluate the model from scratch      |
| Champion vs challenger comparison (live model vs new candidate) | Feature selection or epoch tuning       |
| Risk officer sign-off (does this meet firm risk standards?)     | Walk-forward analysis or regime testing |
| Deployment configuration (shadow mode, canary, full)            | Hyperparameter tuning                   |
| Production readiness checklist                                  | Any iterative improvement               |

The researcher's analysis (feature importance, regime breakdown, walk-forward folds, significance tests) lives in the Training Lab. Promote reviewers can VIEW this analysis by clicking "View Training Run" in the Registry, but they don't create new analysis.

### Design Philosophy

**We are not building a generic MLOps platform.** We are building the training cockpit
for a multi-asset trading firm managing millions in AUM across CeFi, DeFi, TradFi,
Sports, and Prediction Markets.

When someone from Citadel or Jane Street sees this UI, they should see:

1. **Institutional-grade training pipeline** — walk-forward validation (never random splits),
   embargo periods, feature-version pinning, full reproducibility lineage
2. **Financial-native metrics** — not generic accuracy/loss, but Sharpe on validation period,
   directional accuracy, calibration quality, regime stability
3. **Production awareness** — GPU queue management, training throughput, resource allocation
   that scales to hundreds of models across 5 asset classes
4. **Effortless configuration** — dynamic forms that adapt per model family (XGBoost shows
   tree depth, LSTM shows hidden size, Transformer shows attention heads), smart presets
   for common trading model configs

**Inspiration sources (adapted, not copied):**

| Platform               | What We Take                                                                                           | What We Skip                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| **Weights & Biases**   | Experiment table with queryable columns, metric comparison panels, training run workspace organization | Generic ML focus — we add financial metrics natively         |
| **Neptune.ai**         | Real-time loss curve monitoring, hardware consumption tracking, customizable dashboards                | Their dashboard builder — we have fixed, opinionated layouts |
| **MLflow**             | Model registry with versioning, experiment-to-model lineage                                            | Their bare-bones UI — we make it beautiful                   |
| **Tecton / Hopsworks** | Feature-to-model linkage, feature freshness monitoring                                                 | Feature store UI — our Features tab handles this             |
| **QuantConnect**       | Financial backtest statistics, walk-forward visualization                                              | Consumer quant focus — we need institutional depth           |

**What we DON'T do (because we're not building for CV/NLP):**

- No image/text preview panels
- No dataset browser (data lives in Acquire tab)
- No model serving/endpoint management (this is Promote tab)
- No A/B testing UI (this is Promote tab champion/challenger)
- No notebook-style interface (Quant Workspace handles that)

---

## 2. Target Architecture — 4 Pages

### Route Structure (Final)

```
/services/research/ml                   ← Overview (landing page — what's happening?)
/services/research/ml/training          ← Training (configure, launch, monitor active runs)
/services/research/ml/analysis          ← Analysis (post-training: evaluate, compare, decide)
/services/research/ml/registry          ← Registry (completed models shelf → send to Promote)
```

**4 routes. No sub-nav bar. Navigation via cards on the landing page.**

The current 12-route, 10-sub-tab structure collapses completely.

**Why 4 and not 3?** Training and Analysis are different mindsets:

- **Training** = "I'm configuring and watching something happen" (active, forward-looking)
- **Analysis** = "I'm studying what happened and deciding what to try next" (reflective, comparative)

Cramming both into one page creates a 7-tab detail view which is bloated. Splitting them
keeps each page focused and scannable.

### What Goes Where

| Current Page           | Decision                | Target Page                                      | Rationale                                                              |
| ---------------------- | ----------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `ml/page.tsx` (root)   | **KEEP → Overview**     | Overview                                         | Landing page showing pipeline status                                   |
| `ml/overview/`         | **MERGE into root**     | Overview                                         | Duplicate of root — eliminate                                          |
| `ml/experiments/`      | **SPLIT**               | Training (runs table) + Analysis (evaluation)    | Runs table in Training, post-training analysis in Analysis             |
| `ml/experiments/[id]/` | **SPLIT**               | Training (live view) + Analysis (completed view) | Active runs monitored in Training, completed runs analyzed in Analysis |
| `ml/training/`         | **KEEP → Training**     | Training                                         | Configure, launch, monitor                                             |
| `ml/config/`           | **MERGE into Training** | Training                                         | Config wizard becomes the "New Training Run" form                      |
| `ml/validation/`       | **MERGE into Analysis** | Analysis                                         | Walk-forward results, regime analysis, calibration                     |
| `ml/features/`         | **REMOVE**              | —                                                | Features tab (Tab 1 in BUILD_TABS) handles this                        |
| `ml/registry/`         | **KEEP → Registry**     | Registry                                         | Completed models ready for review                                      |
| `ml/deploy/`           | **MOVE to Promote**     | —                                                | Deployment is not a Build concern                                      |
| `ml/monitoring/`       | **MOVE to Observe**     | —                                                | Live monitoring is not a Build concern                                 |
| `ml/governance/`       | **REMOVE**              | —                                                | Audit trail lives in Quant Workspace / Promote                         |

### The Four Pages in Detail

---

### Page 1: Overview (`/services/research/ml`)

**The Pipeline Dashboard.** User lands here and immediately sees what's happening
across the entire model training pipeline.

```
┌─────────────────────────────────────────────────────────────────┐
│ ML TRAINING PIPELINE                           [+ New Training] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ KPI ROW ─────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Model Families │ Active Training │ Completed (7d) │ In    │  │
│  │  ┌─────────┐   │  ┌─────────┐    │  ┌─────────┐  │ Queue │  │
│  │  │   6     │   │  │   3     │    │  │   12    │  │ ┌────┐│  │
│  │  │ families│   │  │ running │    │  │ models  │  │ │  5 ││  │
│  │  │         │   │  │ 2 GPU   │    │  │ +4 vs   │  │ │jobs││  │
│  │  │CeFi(2)  │   │  │ 1 CPU   │    │  │ last wk │  │ │    ││  │
│  │  │DeFi(1)  │   │  │         │    │  │         │  │ │    ││  │
│  │  │Sports(2)│   │  │         │    │  │         │  │ │    ││  │
│  │  │TradFi(1)│   │  │         │    │  │         │  │ │    ││  │
│  │  └─────────┘   │  └─────────┘    │  └─────────┘  │ └────┘│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ ACTIVE TRAINING RUNS ────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Model                │ Status   │ Progress │ Val Loss│ ETA│  │
│  │  ─────────────────────┼──────────┼──────────┼─────────┼────│  │
│  │  BTC Directional v5   │ Training │ Ep 47/100│ 0.298   │ 12m│  │
│  │  ETH Vol Regime v2    │ Training │ Ep 12/50 │ 0.445   │ 22m│  │
│  │  NFL Match Outcome v3 │ Queued   │ —        │ —       │ —  │  │
│  │  DeFi Health v4       │ Training │ Ep 89/100│ 0.189   │ 3m │  │
│  │                                                            │  │
│  │  Click any row → opens in Training Lab                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ TWO-COLUMN: RECENT + ALERTS ─────────────────────────────┐  │
│  │                                                            │  │
│  │  RECENTLY COMPLETED            │  ALERTS                   │  │
│  │  • SOL Funding v1 — 0.215 val │  ⚠ BTC Dir v3: val loss   │  │
│  │    → Ready for review          │    plateaued since ep 40  │  │
│  │  • BTC Basis v6 — 0.181 val   │  ⚠ ETH Vol: feature stale│  │
│  │    → In Registry               │    funding_rate > 24h     │  │
│  │  • LaLiga xG v2 — 0.198 val   │  ✓ DeFi Health v4 nearly  │  │
│  │    → Ready for review          │    done — best val at 78  │  │
│  │                                │                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ NAVIGATION CARDS ────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐│  │
│  │  │  TRAINING      │  │  ANALYSIS      │  │  REGISTRY    ││  │
│  │  │                │  │                │  │              ││  │
│  │  │  Configure,    │  │  Evaluate      │  │  Browse 47   ││  │
│  │  │  launch, and   │  │  completed     │  │  trained     ││  │
│  │  │  monitor       │  │  runs. Compare │  │  models.     ││  │
│  │  │  training runs │  │  versions.     │  │  Send to     ││  │
│  │  │                │  │  Decide next.  │  │  Promote.    ││  │
│  │  │  3 active →    │  │  8 to review → │  │  12 this wk →││  │
│  │  └────────────────┘  └────────────────┘  └──────────────┘│  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Key design points:**

- **No sub-navigation.** Three clickable cards at the bottom navigate to Training, Analysis, and Registry.
- **Active runs table is the hero.** This is what matters on a day-to-day basis — what's cooking right now.
- **Recently completed** shows models that finished and need analysis (bridges to Analysis page).
- **Alerts** are training-specific: stale features, plateaued losses, failed runs, queue congestion.
- **"+ New Training" button** opens Training page in configuration mode.

---

### Page 2: Training (`/services/research/ml/training`)

**Configure, launch, and monitor training runs.** This page is about the active work —
setting up a new run and watching it train. Think of it as the "cockpit" where you
press buttons and watch gauges.

The page has three modes:

- **List mode** (default): All training runs — running, queued, completed, failed
- **Detail mode**: Click a run → live monitoring with loss curves, metrics, config, data
- **New run mode**: Configure and launch a new training run

#### List Mode

```
┌─────────────────────────────────────────────────────────────────┐
│ TRAINING                                 [+ New Training Run]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters: [Status ▾] [Model Family ▾] [Shard ▾] [Search...]    │
│                                                                  │
│  ┌─ RUNS TABLE (sortable, filterable) ───────────────────────┐  │
│  │                                                            │  │
│  │  Run Name              │ Family  │Shard │Status  │ Ep    │  │
│  │  ──────────────────────┼─────────┼──────┼────────┼───────│  │
│  │  BTC Directional v5    │ XGBoost │ CeFi │🔵 Train│ 47/100│  │
│  │  ETH Vol Regime v2     │ LSTM    │ CeFi │🔵 Train│ 12/50 │  │
│  │  NFL Match Outcome v3  │ XGBoost │ Sport│⏳ Queue│ —     │  │
│  │  DeFi Health v4        │ GBT     │ DeFi │🔵 Train│ 89/100│  │
│  │  BTC Basis v6          │ XGBoost │ CeFi │✅ Done │ 80/80 │  │
│  │  SOL Funding v1        │ GBT     │ DeFi │✅ Done │ 60/60 │  │
│  │  LaLiga xG v2          │ RF      │ Sport│✅ Done │ 200/200│  │
│  │  BTC Momentum v3       │ LSTM    │ CeFi │❌ Fail │ 15/100│  │
│  │                                                            │  │
│  │  Additional columns (toggleable):                          │  │
│  │  Train Loss, Val Loss, Best Val, Best Epoch, Duration,     │  │
│  │  Features (#), Instruments, GPU Type, Started, Created By  │  │
│  │                                                            │  │
│  │  Row actions: [Analyze →] (goes to Analysis page for run)  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ GPU RESOURCE BAR ────────────────────────────────────────┐  │
│  │  GPUs: 3/4 in use │ A100: 2 busy │ V100: 1 busy, 1 free  │  │
│  │  Queue: 5 jobs waiting │ Est. wait: ~45 min                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

#### Detail Mode (click a run — focused on live monitoring)

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Runs    BTC Directional v5           [Pause] [Cancel] │
│ Status: TRAINING (epoch 47/100)    ETA: ~12 min                  │
│                                         [Analyze →] (when done)  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ LOSS CURVES (real-time) ─────────────────────────────────┐  │
│  │                                                            │  │
│  │  Loss ▲                                                    │  │
│  │  0.8  │\                                                   │  │
│  │  0.6  │ \___                                               │  │
│  │  0.4  │     \____          ── train                        │  │
│  │  0.2  │          \______   -- valid                        │  │
│  │  0.0  │─────────────────────────────▶ Epochs               │  │
│  │       0    20     40     60     80    100                   │  │
│  │                                                            │  │
│  │  Overfitting indicator: ✅ No (gap < 15%)                  │  │
│  │  Best validation: 0.285 at epoch 42                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ LIVE METRICS ─────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  Train Loss │ Val Loss │ Train Acc │ Val Acc │ Best Val     │  │
│  │  0.234      │ 0.298    │ 78.3%     │ 71.2%  │ 0.285 (ep42)│  │
│  │                                                             │  │
│  │  ── FINANCIAL VALIDATION METRICS (computed on val set) ──   │  │
│  │  Sharpe     │ Dir. Acc │ Calibration│ Max DD  │ Profit Fac  │  │
│  │  1.82       │ 64.2%    │ 0.87       │ -8.3%  │ 1.65        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ TABS: Config │ Features │ Data │ Logs ────────────────────┐  │
│  │                                                             │  │
│  │  CONFIG TAB:                                                │  │
│  │  Architecture:  XGBoost                                     │  │
│  │  Target:        price_direction (binary classification)     │  │
│  │  Instruments:   BTC-PERP (Binance, Hyperliquid)             │  │
│  │  Timeframe:     1H                                          │  │
│  │  Train:         2024-01-01 → 2025-12-31 (17,520 samples)   │  │
│  │  Validation:    2026-01-01 → 2026-02-28 (1,416 samples)    │  │
│  │  Walk-Forward:  retrain every 30d, expanding window         │  │
│  │  Hyperparameters:                                           │  │
│  │    n_estimators=500, max_depth=6, learning_rate=0.01,       │  │
│  │    subsample=0.8, colsample_bytree=0.8                      │  │
│  │                                                             │  │
│  │  FEATURES TAB:                                              │  │
│  │  15 features pinned to exact versions:                      │  │
│  │  • ema_50 v2.1 (length=50, source=close, 1H)               │  │
│  │  • rsi_14 v1.3 (length=14, overbought=70)                  │  │
│  │  • funding_rate v3.0 (settlement=8h, EMA-3)                 │  │
│  │  • basis_spot_perp v2.0 (lag=3)                             │  │
│  │  • ... 11 more                                              │  │
│  │  ⚠ 2 features updated since this config was created         │  │
│  │                                                             │  │
│  │  DATA TAB:                                                  │  │
│  │  Training samples: 17,520                                   │  │
│  │  Validation samples: 1,416                                  │  │
│  │  Class balance: 52% positive / 48% negative                 │  │
│  │  Feature completeness: 100% (no nulls in training window)  │  │
│  │  ── DATA INTEGRITY CHECKS ──                                │  │
│  │  ✅ No look-ahead bias detected                             │  │
│  │  ✅ Embargo period: 2 days between train/val                │  │
│  │  ✅ No feature leakage (target not in features)             │  │
│  │  ✅ Feature coverage: 100% for training window              │  │
│  │  ⚠  Class imbalance: 52/48 — within tolerance              │  │
│  │                                                             │  │
│  │  LOGS TAB:                                                  │  │
│  │  [2026-03-25 14:23:01] INFO  Starting epoch 47             │  │
│  │  [2026-03-25 14:22:58] INFO  Epoch 46: loss=0.238 val=0.30│  │
│  │  [2026-03-25 14:22:45] INFO  Checkpoint saved              │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

#### New Training Run Form

```
┌─────────────────────────────────────────────────────────────────┐
│ NEW TRAINING RUN                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── IDENTITY ──                                                  │
│  Model Family:    [BTC Directional ▾] (existing) or [+ New]     │
│  Run Name:        [BTC Directional v5]  (auto-incremented)      │
│  Description:     [Added 3 new features, increased estimators]  │
│                                                                  │
│  ── ARCHITECTURE ── (dynamic per model family)                   │
│  Architecture:    [XGBoost ▾]                                    │
│                                                                  │
│  XGBoost params:                     │  LSTM params:             │
│    n_estimators: [500]               │    hidden_size: [128]     │
│    max_depth: [6]                    │    num_layers: [2]        │
│    learning_rate: [0.01]             │    dropout: [0.2]         │
│    subsample: [0.8]                  │    sequence_length: [60]  │
│    colsample_bytree: [0.8]           │    batch_size: [256]      │
│    early_stopping: [50 rounds]       │    bidirectional: [✓]     │
│                                                                  │
│  ── TARGET ──                                                    │
│  Target Variable:  [price_direction ▾]                           │
│  Target Type:      [Binary Classification ▾]                     │
│  Instruments:      [BTC-PERP ▾] [+ Add]                         │
│  Timeframe:        [1H ▾]                                        │
│                                                                  │
│  ── FEATURES ── (from Features tab, pinned to versions)          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Feature         │ Version │ Status  │ Params              │  │
│  │  ────────────────┼─────────┼─────────┼─────────────────────│  │
│  │  ✅ ema_50       │ v2.1    │ ✅ Fresh│ length=50, close    │  │
│  │  ✅ rsi_14       │ v1.3    │ ✅ Fresh│ length=14           │  │
│  │  ✅ funding_rate │ v3.0    │ ⚠ Stale│ 8h, EMA-3           │  │
│  │  [+ Add Feature]                                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│  Feature freshness: ⚠ 1 feature stale (funding_rate > 24h)     │
│                                                                  │
│  ── DATA WINDOWS ──                                              │
│  Training:     [2024-01-01] → [2025-12-31]                      │
│  Validation:   [2026-01-01] → [2026-02-28]                      │
│  Walk-Forward: [✓ Enabled] Retrain every [30d] Expanding [✓]   │
│  Embargo:      [2 days]                                          │
│                                                                  │
│  ── RESOURCES ──                                                 │
│  GPU Type:     [A100 ▾]    Priority: [Normal ▾]                 │
│                                                                  │
│         [Start Training]       [Save as Draft]                   │
└──────────────────────────────────────────────────────────────────┘
```

**Key design points for Training:**

- **Runs table is the W&B-style experiment table** — sortable, filterable, queryable. Every column can be sorted. Filters persist.
- **Detail mode is focused on monitoring** — loss curves at the top (real-time for running jobs), then 4 tabs: Config, Features, Data, Logs. Clean and uncluttered.
- **"Analyze →" button bridges to the Analysis page** — visible in the runs table row action and in the detail view header (when run is completed). One click takes you to the deep dive.
- **Financial validation metrics shown live** — Sharpe, directional accuracy, calibration computed on the validation set as training progresses. Early signal of whether the run is heading somewhere good.
- **Feature-version pinning in the form** — features selected from the Features tab catalogue, pinned to exact versions, with freshness status indicators.
- **Dynamic hyperparameter forms** — selecting XGBoost shows tree-specific params, selecting LSTM shows RNN-specific params. Not a generic key-value editor.
- **Data integrity checks in the Data tab** — automated verification: no look-ahead bias, embargo respected, no feature leakage, feature coverage complete.
- **GPU resource bar** — at-a-glance view of cluster capacity and queue depth.

---

### Page 3: Analysis (`/services/research/ml/analysis`)

**The post-training research lab.** This is where the quant researcher studies completed
runs, compares versions, and decides what to try next. Think of it as the "study" where
you review results and make decisions.

Training is forward-looking ("watch this run"). Analysis is backward-looking ("study what happened").

The page has two modes:

- **Run analysis** (default): Deep dive into a single completed run
- **Comparison mode**: Side-by-side comparison of 2-4 runs from the same family

#### Run Analysis Mode (select a completed run)

```
┌─────────────────────────────────────────────────────────────────┐
│ ANALYSIS                                                         │
│ Run: [BTC Directional v5 ▾] (dropdown of completed runs)        │
│                                      [Compare Runs] [→ Registry] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ SUMMARY BAR ────────────────────────────────────────────────┐│
│  │ Val Loss: 0.285 │ Sharpe: 1.82 │ Dir Acc: 64.2% │ MaxDD: -8%││
│  │ Epochs: 100 (best at 42) │ Features: 15 │ Duration: 28 min  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ FEATURE IMPORTANCE ─────────────────────────────────────────┐│
│  │                                                               ││
│  │  funding_rate v3.0     ████████████████ 0.18                  ││
│  │  basis_spot_perp v2.0  ██████████████  0.15                  ││
│  │  ema_50 v2.1           ████████████    0.13                  ││
│  │  rsi_14 v1.3           ██████████      0.11                  ││
│  │  volume_ma v1.2        ████████        0.08                  ││
│  │  ...                                                          ││
│  │  oi_change v1.0        ██              0.02                  ││
│  │                                                               ││
│  │  → Top 5 features = 65% importance.                           ││
│  │  → Consider dropping oi_change (2%) in next run.              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ TWO-COLUMN LAYOUT ─────────────────────────────────────────┐│
│  │                                                               ││
│  │  REGIME ANALYSIS              │  WALK-FORWARD RESULTS         ││
│  │  ┌──────────┬───────┬──────┐ │  ┌──────┬──────────┬───────┐ ││
│  │  │ Regime   │Sharpe │MaxDD │ │  │ Fold │ Test     │Sharpe │ ││
│  │  ├──────────┼───────┼──────┤ │  ├──────┼──────────┼───────┤ ││
│  │  │ Trending │ 2.41  │-4.2% │ │  │  1   │ Q1 2025  │ 1.94  │ ││
│  │  │ Ranging  │ 0.85  │-12.1%│ │  │  2   │ Q2 2025  │ 2.12  │ ││
│  │  │ Volatile │ 1.63  │-8.9% │ │  │  3   │ Q3 2025  │ 1.67  │ ││
│  │  │ Crisis   │-0.42  │-21.3%│ │  │  4   │ Q4 2025  │ 0.91  │ ││
│  │  └──────────┴───────┴──────┘ │  │  5   │ Q1 2026  │ 1.82  │ ││
│  │  ⚠ Crisis regime: Sharpe <0  │  └──────┴──────────┴───────┘ ││
│  │  Consider crisis features.   │  Stability: 3/5 above 1.5     ││
│  │                               │  ⚠ Fold 4 weak (ranging mkt) ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ PREDICTION DISTRIBUTION & CALIBRATION ──────────────────────┐│
│  │  (histogram of predicted probs vs actual outcomes)            ││
│  │  Calibration: 0.87 — predicted 60% events happen 58%         ││
│  │  Overconfidence zones: 0.85-0.95 range slightly inflated     ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ EPOCH HISTORY (this model family) ──────────────────────────┐│
│  │  Run  │ Date       │ Epochs │ Best Val │ Best Ep │ Duration   ││
│  │  v5   │ 2026-03-25 │ 100    │ 0.285    │ 42      │ 28min      ││
│  │  v4   │ 2026-03-15 │ 80     │ 0.298    │ 62      │ 24min      ││
│  │  v3   │ 2026-03-01 │ 100    │ 0.312    │ 71      │ 31min      ││
│  │  → Best epoch trending DOWN (71→62→42). Model converging     ││
│  │    faster with more features. Try 60 epochs next run.         ││
│  │                                                               ││
│  │  ── OVERLAID LOSS CURVES (v5 vs v4 vs v3) ──                 ││
│  │  (three learning curves on same chart, different colors)      ││
│  │  v5 (blue) dropping faster than v4 (green) and v3 (gray)     ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ RESEARCHER VERDICT ─────────────────────────────────────────┐│
│  │  Based on analysis, this model:                               ││
│  │  ✅ Feature importance: clear top features, no deadweight     ││
│  │  ✅ Regime: performs well in 3/4 regimes                      ││
│  │  ⚠  Crisis: underperforms (consider crisis-specific model)   ││
│  │  ✅ Walk-forward: 3/5 folds above target Sharpe               ││
│  │  ✅ Calibration: well-calibrated (0.87)                       ││
│  │                                                               ││
│  │  [← Train New Run] [Compare with Previous →] [Send to Reg →] ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

#### Comparison Mode (select 2-4 runs)

```
┌─────────────────────────────────────────────────────────────────┐
│ ANALYSIS — COMPARISON MODE                                       │
│ Select runs: [✓ v5] [✓ v4] [✓ v3] [  v2 ]   [← Single Run]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ SIDE-BY-SIDE METRICS ───────────────────────────────────────┐│
│  │                                                               ││
│  │  Metric        │  v5        │  v4        │  v3                ││
│  │  ──────────────┼────────────┼────────────┼──────────          ││
│  │  Val Loss      │  0.285 ↓   │  0.298     │  0.312             ││
│  │  Sharpe        │  1.82 ↑    │  1.65      │  1.43              ││
│  │  Dir. Accuracy │  64.2% ↑   │  62.1%     │  59.8%             ││
│  │  Max Drawdown  │  -8.3%     │  -9.1%     │  -11.2%            ││
│  │  Profit Factor │  1.65 ↑    │  1.52      │  1.38              ││
│  │  Stability     │  0.82      │  0.78      │  0.71              ││
│  │  Features (#)  │  15        │  12        │  12                ││
│  │  Epochs (best) │  42        │  62        │  71                ││
│  │                                                               ││
│  │  All green: v5 is better on every metric.                     ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ STATISTICAL SIGNIFICANCE ───────────────────────────────────┐│
│  │  v5 vs v4: Sharpe +0.17 (p=0.032) — ✅ significant           ││
│  │  v5 vs v3: Sharpe +0.39 (p=0.001) — ✅ significant           ││
│  │  → v5 is a real improvement, not random variation.            ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ CONFIG DIFF (what changed between runs) ────────────────────┐│
│  │  v5 vs v4:                                                    ││
│  │  + Added features: funding_rate v3.0, oi_change v1.0,        ││
│  │    vol_skew v1.1                                              ││
│  │  ~ Changed: n_estimators 400→500, max_depth 5→6              ││
│  │  = Same: target, instruments, timeframe, walk-forward         ││
│  │                                                               ││
│  │  v4 vs v3:                                                    ││
│  │  ~ Changed: learning_rate 0.05→0.01, subsample 0.7→0.8       ││
│  │  = Same: features (12), architecture, target                  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ OVERLAID LOSS CURVES ───────────────────────────────────────┐│
│  │  (three learning curves, different colors, same axes)         ││
│  │  v5 (blue) converges faster and to lower val loss             ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ REGIME COMPARISON ──────────────────────────────────────────┐│
│  │  (same regime table but side-by-side for each run)            ││
│  │  Trending:  v5=2.41  v4=2.15  v3=1.89  — all improving      ││
│  │  Ranging:   v5=0.85  v4=0.71  v3=0.52  — improving but weak ││
│  │  Crisis:    v5=-0.42 v4=-0.38 v3=-0.61 — still negative     ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Key design points for Analysis:**

- **Single-run analysis is a scrollable dashboard** — not tabs. All the important panels visible at once, top-to-bottom: summary → feature importance → regime + walk-forward → calibration → epoch history → verdict. The researcher can scan the whole picture without clicking tabs.
- **Comparison mode is the decision tool** — "is v5 really better?" with actual numbers, significance tests, and config diffs. This answers "what changed and did it help?"
- **"Researcher Verdict" panel** at the bottom summarizes findings with action buttons: train again (iterate), compare with others, or send to Registry (satisfied).
- **Epoch history with overlaid curves** — drives decisions about how many epochs to use in the next run. Cross-run learning curves on the same chart make the trend obvious.
- **Regime comparison in comparison mode** — shows how each regime improved across versions, making it clear where the model is getting better and where it's still struggling.
- **Direct navigation to Training** — "Train New Run" button pre-fills the form with the current config as a starting point, so the researcher can tweak and launch without re-entering everything.

**The researcher's iterative loop across Training and Analysis:**

```
1. TRAINING: Configure + launch a run → watch loss curves live
2. Training completes → click "Analyze →" → lands on ANALYSIS page
3. ANALYSIS: Study feature importance, regime breakdown, walk-forward folds
   - "oi_change only 2% importance — drop it"
   - "Crisis regime Sharpe is -0.42 — need crisis features"
   - "Fold 4 weak — try 3-month walk-forward instead of 1-year"
4. ANALYSIS (compare): Switch to comparison mode → is v5 better than v4?
   - Side-by-side: "yes, better on all metrics"
   - Significance: "p=0.032 — real improvement, not noise"
   - Config diff: "added 3 features, increased estimators — that's what helped"
5. ANALYSIS (history): Check epoch trend → "best epoch trending down, try 60 next run"
6. Decision:
   - Satisfied? → click "Send to Registry →" → model goes to Registry page
   - Not satisfied? → click "← Train New Run" → back to TRAINING with pre-filled config
```

---

### Page 4: Model Registry (`/services/research/ml/registry`)

**A clean registry of completed, trained models.** This is the "artifact shelf" —
models that have finished training and are available for use.

Deep research and iteration does NOT happen here — that's the Training Lab's job.
The Registry is where the researcher says "I've done my work, this model is ready
for the team to review." The "Send to Promote" action is a deliberate hand-off —
the researcher is confident enough to put it in front of the team.

The Promote lifecycle tab then handles the team sign-off process — not re-evaluating
the model from scratch, but confirming the researcher's assessment meets the firm's
risk and performance standards.

```
┌─────────────────────────────────────────────────────────────────┐
│ MODEL REGISTRY                              [Search...]          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters: [Family ▾] [Shard ▾] [Status ▾]                       │
│                                                                  │
│  ┌─ MODEL FAMILIES ──────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  BTC Directional (CeFi)                     [5 versions]  │  │
│  │  ├── v5  │ 2026-03-25 │ XGBoost │ Val: 0.285 │ 🔵 Training│  │
│  │  ├── v4  │ 2026-03-15 │ XGBoost │ Val: 0.298 │ ✅ Ready   │  │
│  │  ├── v3  │ 2026-03-01 │ XGBoost │ Val: 0.312 │ 📦 In Use  │  │
│  │  ├── v2  │ 2026-02-01 │ LSTM    │ Val: 0.345 │ 📁 Archived│  │
│  │  └── v1  │ 2026-01-15 │ LSTM    │ Val: 0.378 │ 📁 Archived│  │
│  │                                                            │  │
│  │  ETH Vol Regime (CeFi)                      [3 versions]  │  │
│  │  ├── v2  │ 2026-03-22 │ LSTM    │ Val: 0.445 │ 🔵 Training│  │
│  │  ├── v1  │ 2026-02-15 │ LSTM    │ Val: 0.312 │ ✅ Ready   │  │
│  │  └── v0  │ 2026-01-20 │ GBT     │ Val: 0.410 │ 📁 Archived│  │
│  │                                                            │  │
│  │  NFL Match Outcome (Sports)                 [2 versions]  │  │
│  │  ...                                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Click any version → shows summary card:                         │
│  ┌─ v4: BTC Directional ─────────────────────────────────────┐  │
│  │  Architecture: XGBoost │ Features: 15 │ Epochs: 80        │  │
│  │  Val Loss: 0.298 │ Sharpe (val): 1.82 │ Dir Acc: 64.2%   │  │
│  │  Trained: 2026-03-15 │ By: iggy │ Duration: 24min         │  │
│  │                                                            │  │
│  │  [View Training Run] [Send to Promote →] [Download Artifact]│  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Key design points for Registry:**

- **Grouped by model family** — collapsible accordion per family, versions listed newest-first.
- **Status badges** are clear: Training (still running), Ready (completed, not yet reviewed), In Use (deployed via Promote), Archived (older versions).
- **Summary card on click** — shows key metrics and training config at a glance. NOT a deep evaluation — just enough to know what this model is.
- **"Send to Promote" is the deliberate hand-off** — the researcher has already done feature selection, epoch tuning, regime analysis, significance testing, and cross-run comparison in the Training Lab. Sending to Promote means "I've done my work — this is ready for team review."
- **"View Training Run" links back to Training Lab** — if someone wants to see the full analysis (feature importance, regime breakdown, walk-forward folds), they click through to the Training Lab detail view.
- **Simple and scannable** — this is a library shelf, not a laboratory. Keep it clean.

---

## 3. Current Implementation Inventory

### 3.1 Existing Pages (12 routes → collapsing to 4)

| Page                   | Lines | Decision                | Action                                 |
| ---------------------- | ----- | ----------------------- | -------------------------------------- |
| `ml/page.tsx` (root)   | 701   | **KEEP → Overview**     | Redesign as pipeline dashboard         |
| `ml/overview/`         | 810   | **MERGE into root**     | Cherry-pick best elements, delete page |
| `ml/experiments/`      | 860   | **MERGE into Training** | Runs table replaces experiment table   |
| `ml/experiments/[id]/` | 949   | **MERGE into Training** | Detail mode absorbs this               |
| `ml/training/`         | 858   | **KEEP → Training Lab** | Major redesign                         |
| `ml/config/`           | 796   | **MERGE into Training** | Config wizard becomes training form    |
| `ml/validation/`       | 1077  | **MERGE into Training** | Validation metrics shown per run       |
| `ml/features/`         | 809   | **REMOVE**              | Features tab handles this              |
| `ml/registry/`         | 818   | **KEEP → Registry**     | Redesign as clean registry             |
| `ml/deploy/`           | 812   | **MOVE → Promote tab**  | Content relocates                      |
| `ml/monitoring/`       | 665   | **MOVE → Observe tab**  | Content relocates                      |
| `ml/governance/`       | 630   | **REMOVE**              | Audit trail handled elsewhere          |

**Total current: ~8,802 lines across 13 files.**
**Target: ~2,500-3,000 lines across 4 pages + shared components.**

### 3.2 Existing Components to Reuse

| Component                                   | Lines | Keep?                        | Where It Goes                    |
| ------------------------------------------- | ----- | ---------------------------- | -------------------------------- |
| `components/ml/loss-curves.tsx`             | 432   | **YES** — core widget        | Training Lab detail mode         |
| `components/ml/ml-nav.tsx`                  | 143   | **NO** — removing sub-nav    | Delete                           |
| `components/dashboards/quant-dashboard.tsx` | 1417  | **NO** — Quant Workspace tab | Stays in Quant Workspace, not ML |

### 3.3 Types (`lib/ml-types.ts` — 513 lines)

Key types that survive:

| Type                     | Keep?                          | Notes                                        |
| ------------------------ | ------------------------------ | -------------------------------------------- |
| `ModelFamily`            | YES                            | Archetype, assets, versions, strategies      |
| `Experiment`             | **RENAME → `TrainingRun`**     | Align naming — experiments ARE training runs |
| `TrainingConfig`         | YES                            | Epochs, batch, LR, optimizer, GPU            |
| `ExperimentMetrics`      | **RENAME → `TrainingMetrics`** | Add financial metrics (Sharpe, dir accuracy) |
| `TrainingRun` (current)  | **MERGE with Experiment**      | Currently separate from Experiment — unify   |
| `ModelVersion`           | YES                            | Version, status, champion flag, metrics      |
| `FeatureSetVersion`      | YES                            | Feature pinning for lineage                  |
| `ValidationPackage`      | **MERGE into TrainingMetrics** | Validation results shown per run             |
| `LiveDeployment`         | **MOVE to Promote types**      | Not a Build concern                          |
| `ChampionChallengerPair` | **MOVE to Promote types**      | Not a Build concern                          |
| `MLAlert`                | YES                            | Alerts for overview page                     |
| `FeatureProvenance`      | YES                            | Feature freshness for training form          |

### 3.4 Mock Data (`lib/ml-mock-data.ts` — 1,226 lines)

| Export                          | Keep?                           | Notes                                        |
| ------------------------------- | ------------------------------- | -------------------------------------------- |
| `MODEL_FAMILIES` (6)            | YES                             | Overview + Registry                          |
| `EXPERIMENTS` (5)               | **RENAME → TRAINING_RUNS_DATA** | Training Lab list                            |
| `TRAINING_RUNS` (2)             | **MERGE with EXPERIMENTS**      | Unify                                        |
| `MODEL_VERSIONS` (4)            | YES                             | Registry                                     |
| `LIVE_DEPLOYMENTS` (3)          | **MOVE**                        | Promote tab                                  |
| `CHAMPION_CHALLENGER_PAIRS` (1) | YES                             | Training Lab compare tab (v5 vs v4)          |
| `ML_ALERTS` (3)                 | YES                             | Overview                                     |
| `FEATURE_PROVENANCE` (6)        | YES                             | Training form feature freshness              |
| `REGIME_STATES` (1)             | YES                             | Training Lab analysis tab (regime breakdown) |
| `AUDIT_EVENTS` (4)              | **REMOVE**                      | Governance removed                           |
| `SIGNAL_STATES` (1)             | **MOVE**                        | Promote tab                                  |
| `DATASET_SNAPSHOTS` (2)         | YES                             | Training data tab                            |
| `FEATURE_SET_VERSIONS` (2)      | YES                             | Feature pinning                              |
| `VALIDATION_PACKAGES` (1)       | **MERGE into training metrics** |                                              |
| `DEPLOYMENT_CANDIDATES` (1)     | **MOVE**                        | Promote tab                                  |

### 3.5 API Hooks (`hooks/api/use-ml-models.ts` — 14 hooks)

| Hook                        | Keep?                               | Notes                          |
| --------------------------- | ----------------------------------- | ------------------------------ |
| `useModelFamilies`          | YES                                 | Overview + Registry + Training |
| `useExperiments`            | **RENAME → `useTrainingRuns`**      | Training Lab list              |
| `useExperimentDetail`       | **RENAME → `useTrainingRunDetail`** | Training Lab detail            |
| `useTrainingRuns` (current) | **MERGE**                           | Unify with experiments         |
| `useCreateTrainingJob`      | YES                                 | Training form                  |
| `useModelVersions`          | YES                                 | Registry                       |
| `usePromoteModel`           | **MOVE**                            | Promote tab                    |
| `useMLDeployments`          | **MOVE**                            | Promote tab                    |
| `useFeatureProvenance`      | YES                                 | Training form + Overview       |
| `useDatasets`               | YES                                 | Training form data tab         |
| `useValidationResults`      | **MERGE into run detail**           | Per-run validation             |
| `useMLMonitoring`           | **MOVE**                            | Observe tab                    |
| `useMLGovernance`           | **REMOVE**                          | Governance removed             |
| `useMLConfig`               | **REMOVE**                          | Merged into training form      |

---

## 4. New Types Needed

### `ModelConfig` (feature-version linkage)

```typescript
interface ModelConfig {
  model_id: string;
  model_name: string;
  version: string;
  model_family: string;
  target_variable: string;
  target_type: "binary_classification" | "multi_class" | "regression";
  feature_inputs: FeatureVersionPin[];
  instruments: string[];
  timeframe: string;
  training_window: { start: string; end: string };
  validation_window: { start: string; end: string };
  test_window: { start: string; end: string };
  hyperparameters: Record<string, unknown>;
  walk_forward?: {
    retrain_every: string;
    expanding_window: boolean;
    embargo_days: number;
  };
  gpu_type: string;
  priority: "low" | "normal" | "high";
  created_by: string;
  created_at: string;
  version_note: string;
}

interface FeatureVersionPin {
  feature_id: string;
  feature_name: string;
  version: string;
  parameters_summary: string;
  freshness_status: "fresh" | "stale" | "unavailable";
  last_computed: string;
}
```

### `FinancialValidationMetrics` (trading-native evaluation)

```typescript
interface FinancialValidationMetrics {
  sharpe_ratio: number;
  directional_accuracy: number;
  calibration_score: number;
  max_drawdown_pct: number;
  profit_factor: number;
  hit_rate: number;
  sortino_ratio: number;
  information_ratio: number;
  stability_score: number;
}
```

### `FeatureImportance` (post-training analysis)

```typescript
interface FeatureImportance {
  feature_id: string;
  feature_name: string;
  version: string;
  importance_score: number; // 0-1, sums to 1 across all features
  importance_rank: number;
  insight?: string; // auto-generated: "Consider dropping — only 2% importance"
}
```

### `RegimePerformance` (model behavior per market condition)

```typescript
interface RegimePerformance {
  regime:
    | "trending"
    | "ranging"
    | "volatile"
    | "crisis"
    | "low_vol"
    | "high_vol";
  sample_count: number;
  sharpe_ratio: number;
  directional_accuracy: number;
  max_drawdown_pct: number;
  warning?: string; // auto-generated if Sharpe < 0 or dir_acc < 50%
}
```

### `WalkForwardFold` (per-fold results)

```typescript
interface WalkForwardFold {
  fold_number: number;
  train_start: string;
  train_end: string;
  test_start: string;
  test_end: string;
  sharpe_ratio: number;
  directional_accuracy: number;
  val_loss: number;
}
```

### `RunComparison` (cross-run significance)

```typescript
interface RunComparison {
  run_a_id: string;
  run_b_id: string;
  metric: string;
  value_a: number;
  value_b: number;
  improvement: number;
  p_value: number;
  is_significant: boolean; // p < 0.05
}
```

### `DataIntegrityCheck` (pre/post-training verification)

```typescript
interface DataIntegrityCheck {
  check_name: string; // "no_lookahead_bias", "embargo_respected", "no_feature_leakage", etc.
  status: "pass" | "warn" | "fail";
  message: string;
  details?: Record<string, unknown>;
}
```

---

## 5. New Components Needed

| Component                                          | Purpose                                                                                   | Used By                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| **Training page components:**                      |                                                                                           |                         |
| `components/research/training-run-form.tsx`        | Comprehensive training config form with dynamic hyperparams per family                    | Training                |
| `components/research/feature-pin-selector.tsx`     | Select features + versions from catalogue with freshness status                           | Training form           |
| `components/research/training-runs-table.tsx`      | W&B-style sortable/filterable runs table with toggleable columns                          | Training                |
| `components/research/training-detail.tsx`          | Live monitoring: loss curves + metrics + 4-tab detail (Config/Features/Data/Logs)         | Training                |
| `components/research/data-integrity-panel.tsx`     | Pre/post-training data checks: leakage, embargo, coverage, class balance                  | Training (Data tab)     |
| **Analysis page components:**                      |                                                                                           |                         |
| `components/research/run-analysis-dashboard.tsx`   | Single-run analysis layout: summary → feature importance → regime → calibration → history | Analysis                |
| `components/research/feature-importance-chart.tsx` | Horizontal bar chart of feature importance scores with drop insights                      | Analysis                |
| `components/research/regime-analysis-panel.tsx`    | Table of model performance per market regime with warnings                                | Analysis                |
| `components/research/walk-forward-results.tsx`     | Fold-by-fold walk-forward validation results with stability score                         | Analysis                |
| `components/research/prediction-distribution.tsx`  | Histogram of predicted probabilities vs actuals (calibration)                             | Analysis                |
| `components/research/run-comparison-table.tsx`     | Side-by-side metrics for 2-4 selected runs with significance tests                        | Analysis (compare mode) |
| `components/research/config-diff-viewer.tsx`       | Shows what changed between two runs (features added/removed, params changed)              | Analysis (compare mode) |
| `components/research/run-history-comparison.tsx`   | Cross-run learning curves overlaid + epoch insight table                                  | Analysis                |
| `components/research/researcher-verdict.tsx`       | Summary panel with findings + action buttons (train again / compare / send to registry)   | Analysis                |
| **Registry page components:**                      |                                                                                           |                         |
| `components/research/model-family-accordion.tsx`   | Grouped accordion of model versions with status badges                                    | Registry                |
| `components/research/model-version-card.tsx`       | Summary card for a model version with key metrics + actions                               | Registry                |

---

## 6. Implementation Checklist

### Phase 1: Structural Cleanup

- [ ] **P1-1.** Remove `ml/layout.tsx` ML_SUB_TABS (eliminate 3rd nav level)
- [ ] **P1-2.** Delete `ml/features/` page (Features tab handles this)
- [ ] **P1-3.** Move inline mock data from all pages to `lib/ml-mock-data.ts`
- [ ] **P1-4.** Plan content relocation for deploy → Promote, monitoring → Observe

### Phase 2: Overview Page (Root `/services/research/ml`)

- [ ] **P2-1.** Redesign root page: KPI row + active runs table + recent/alerts + nav cards
- [ ] **P2-2.** Delete `ml/overview/` page (merged into root)
- [ ] **P2-3.** Wire up hooks: useModelFamilies, useTrainingRuns, useMLAlerts

### Phase 3: Training Page (`/services/research/ml/training`)

- [ ] **P3-1.** Build `training-runs-table.tsx` (sortable, filterable, toggleable columns, "Analyze →" row action)
- [ ] **P3-2.** Build `training-run-form.tsx` (dynamic hyperparams per family, feature-version pins)
- [ ] **P3-3.** Build `feature-pin-selector.tsx` (feature selection with version + freshness)
- [ ] **P3-4.** Build `training-detail.tsx` (live monitoring: loss curves + metrics + 4 tabs: Config/Features/Data/Logs)
- [ ] **P3-5.** Build `data-integrity-panel.tsx` (leakage, embargo, coverage checks — for Data tab)
- [ ] **P3-6.** Add `ModelConfig`, `FeatureVersionPin`, `FinancialValidationMetrics` types
- [ ] **P3-7.** Add mock data: realistic training runs with feature pins and financial metrics
- [ ] **P3-8.** Merge content from experiments and config pages into Training page
- [ ] **P3-9.** Delete merged pages (experiments, config)

### Phase 4: Analysis Page (`/services/research/ml/analysis`) — NEW

**4a — Single-run analysis:**

- [ ] **P4-1.** Build `run-analysis-dashboard.tsx` (scrollable layout: summary → importance → regime → calibration → history → verdict)
- [ ] **P4-2.** Build `feature-importance-chart.tsx` (horizontal bar chart with drop insights)
- [ ] **P4-3.** Build `regime-analysis-panel.tsx` (per-regime performance table with warnings)
- [ ] **P4-4.** Build `walk-forward-results.tsx` (fold-by-fold table with stability score)
- [ ] **P4-5.** Build `prediction-distribution.tsx` (calibration histogram)
- [ ] **P4-6.** Build `run-history-comparison.tsx` (overlaid learning curves + epoch insight)
- [ ] **P4-7.** Build `researcher-verdict.tsx` (summary findings + action buttons)

**4b — Comparison mode:**

- [ ] **P4-8.** Build `run-comparison-table.tsx` (side-by-side metrics + significance tests)
- [ ] **P4-9.** Build `config-diff-viewer.tsx` (what changed between runs)
- [ ] **P4-10.** Regime comparison (side-by-side regime performance across selected runs)

**4c — Mock data + merge:**

- [ ] **P4-11.** Add mock data: feature importance, regime analysis, walk-forward folds, prediction distribution
- [ ] **P4-12.** Merge content from validation page into Analysis
- [ ] **P4-13.** Delete validation page

### Phase 5: Model Registry (`/services/research/ml/registry`)

- [ ] **P5-1.** Build `model-family-accordion.tsx` (grouped, collapsible)
- [ ] **P5-2.** Build `model-version-card.tsx` (summary + actions)
- [ ] **P5-3.** Redesign registry page with family accordion layout
- [ ] **P5-4.** Add "Send to Promote" action + "View Analysis" link (back to Analysis page)

### Phase 6: Cleanup & Relocation

- [ ] **P6-1.** Move deploy page content → Promote lifecycle tab
- [ ] **P6-2.** Move monitoring page content → Observe lifecycle tab
- [ ] **P6-3.** Delete governance page
- [ ] **P6-4.** Delete ml-nav.tsx component
- [ ] **P6-5.** Update `ML_SUB_TABS` in service-tabs.tsx → remove entirely
- [ ] **P6-6.** Add MSW handlers for any new/renamed endpoints
- [ ] **P6-7.** Verify all 4 pages render correctly in mock mode
- [ ] **P6-8.** Verify cross-page navigation: Training → Analysis → Registry flow

---

## 7. Dependencies & Cross-References

### Upstream (what feeds into Models)

| Source                  | What It Provides                                            |
| ----------------------- | ----------------------------------------------------------- |
| Features tab (Tab 1)    | Feature catalogue + versions for pinning in training form   |
| Feature ETL tab (Tab 2) | Feature freshness status (are features computed and ready?) |

### Downstream (what consumes from Models)

| Consumer               | What It Needs                                                                | Boundary                                                                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Strategies tab (Tab 5) | Trained model ID + version to generate signals for backtest                  | Strategies assumes fills with minimal slippage. Takes model output (signals/probabilities) and applies signal rules + position sizing.                                                                       |
| Execution tab (Tab 6)  | Strategy backtest results → simulates real execution with TWAP/VWAP algos    | Takes signals, uses real order book data, simulates actual fills with slippage/market impact.                                                                                                                |
| Promote lifecycle tab  | Completed models from Registry that researcher has marked "ready for review" | Does NOT re-evaluate the model. The team reviews the researcher's analysis (which lives in Training Lab) and does sign-off/approval. May do champion/challenger comparison against the currently live model. |
| Observe lifecycle tab  | Live model monitoring, drift detection (content moves here)                  | Post-deployment only. Not a Models concern.                                                                                                                                                                  |

### Lineage Chain

```
processed data (Acquire)
  → feature v2.1 (Features tab — define, version, pin)
  → model v4.0 (Models tab — configure, train, register)
  → strategy backtest (Strategies tab — signal rules, sizing)
  → execution backtest (Execution tab — algo, venue, slippage)
  → strategy candidate (Promote tab — evaluate, champion/challenger, deploy)
```

---

## 8. Agent Assignment Guide

| Task                                | Files Touched                                                                                                                                          | Complexity |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| **Phase 1** (cleanup)               | `ml/layout.tsx`, `ml/features/`, `service-tabs.tsx`, `lib/ml-mock-data.ts`                                                                             | Low        |
| **Phase 2** (overview)              | `ml/page.tsx`, delete `ml/overview/`                                                                                                                   | Medium     |
| **Phase 3** (training page)         | `training-runs-table`, `training-run-form`, `feature-pin-selector`, `training-detail`, `data-integrity-panel`, types, merge experiments + config       | High       |
| **Phase 4a** (analysis: single-run) | `run-analysis-dashboard`, `feature-importance-chart`, `regime-analysis-panel`, `walk-forward-results`, `prediction-distribution`, `researcher-verdict` | High       |
| **Phase 4b** (analysis: comparison) | `run-comparison-table`, `config-diff-viewer`, regime comparison                                                                                        | Medium     |
| **Phase 4c** (analysis: merge)      | Merge validation page, mock data for analysis                                                                                                          | Medium     |
| **Phase 5** (registry)              | `model-family-accordion`, `model-version-card`, registry page                                                                                          | Medium     |
| **Phase 6** (cleanup)               | Delete files, move content, MSW handlers, verify cross-page nav                                                                                        | Medium     |

**Parallelization:** Phase 3 (Training) and Phase 4 (Analysis) can be built in parallel
by different agents — they're separate pages with separate components. Phase 4a and 4b
can also be parallelized within the Analysis page. Phase 5 (Registry) depends on nothing
from Phase 3 or 4 and can run in parallel too. Phase 6 waits for all others.

### Context Files an Agent MUST Read

1. **This document** — `docs/build lifecycle tab/ML_MODELS_TAB_SPEC.md`
2. **Build spec §3** — `docs/build lifecycle tab/BUILD_SECTION_SPEC.md` (lines 617–897)
3. **Types** — `lib/ml-types.ts`
4. **Mock data** — `lib/ml-mock-data.ts`
5. **Hooks** — `hooks/api/use-ml-models.ts`
6. **Codex ML pipeline** — `unified-trading-codex/09-strategy/cross-cutting/ml-pipeline.md`

---

## 9. Resolved Questions (From Previous TBD)

| #   | Question                           | Decision                                                                    | Rationale                                                                                                                                                                                                                    |
| --- | ---------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | ML_SUB_TABS removed or reduced?    | **REMOVED entirely**                                                        | 3 pages with card navigation from overview. No sub-nav bar.                                                                                                                                                                  |
| Q2  | Root absorbs overview?             | **YES — root IS the overview**                                              | One landing page, not two dashboards.                                                                                                                                                                                        |
| Q3  | Config wizard merge into training? | **YES — merged into training form**                                         | Config is how you start a training run. Same page.                                                                                                                                                                           |
| Q4  | Feature-version pinning location?  | **Inline in training form**                                                 | Feature selector widget embedded in the "New Training Run" form.                                                                                                                                                             |
| Q5  | Components first or incremental?   | **Incremental by page**                                                     | Build Overview first, then Training Lab, then Registry.                                                                                                                                                                      |
| Q6  | What about experiments page?       | **Merged into Training Lab**                                                | Experiments ARE training runs. One concept, one table.                                                                                                                                                                       |
| Q7  | Validation — where does it go?     | **Merged into Training Lab detail view**                                    | Validation metrics shown per training run in the detail mode.                                                                                                                                                                |
| Q8  | Governance?                        | **Removed from Models tab**                                                 | Audit trail handled by Quant Workspace / Promote.                                                                                                                                                                            |
| Q9  | Model evaluation depth?            | **Training Lab = full research. Registry = scan. Promote = team sign-off.** | Feature importance, regime analysis, walk-forward fold analysis, cross-run comparison, significance tests — all in Training Lab. Researcher iterates here until satisfied, then sends to Registry → Promote for team review. |

---

## 10. Changelog

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | By    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 2026-03-25 | Initial document created with full inventory, gap analysis, and implementation plan                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Agent |
| 2026-03-25 | **v2: Major rewrite.** Collapsed from 12 routes to 3 pages. Merged experiments into training. Removed governance. Added W&B/Neptune-inspired training lab design. Added financial validation metrics as first-class. Resolved all open questions.                                                                                                                                                                                                                                                                                      | Agent |
| 2026-03-25 | **v3: Research lab scope expansion.** Added full post-training analysis capabilities (feature importance, regime analysis, walk-forward folds, prediction distribution, cross-run comparison, significance tests, config diff). Moved regime analysis and champion/challenger comparison BACK from Promote to Models tab. Updated boundary: everything to make the model better stays in Models tab; Promote is team sign-off only. Added 6 new types.                                                                                 | Agent |
| 2026-03-25 | **v4: Split into 4 pages.** Training Lab was bloated (7 tabs in detail view). Split into Training (configure, launch, monitor — 4 tabs) and Analysis (evaluate, compare, decide — scrollable dashboard + comparison mode). Now 4 pages: Overview, Training, Analysis, Registry. Training is forward-looking ("watch this run"), Analysis is backward-looking ("study what happened"). 6 implementation phases (was 5). Added `run-analysis-dashboard.tsx` and `researcher-verdict.tsx` components. Phases 3, 4, 5 can run in parallel. | Agent |
| 2026-03-25 | **v5: IMPLEMENTATION COMPLETE.** All 4 pages built and functional. 13 new types in `lib/ml-types.ts`. Mock data enriched with 6 `UnifiedTrainingRun`s, full analysis data, GPU queue, pipeline status. Mock data changelog created (`ML_MOCK_DATA_CHANGELOG.md`). Old ML pages archived to `archive/`. Training page: 4-tab detail (Config, Features, Data, Logs). Analysis page: scrollable dashboard + comparison mode with significance tests. Registry: updated with back-nav. Overview: hub with nav cards to all 3 sub-pages.    | Agent |
