# Phase 2b: Build Tab — Workflow & Component Alignment Assessment

**Generated:** 2026-03-21 | **Source:** Phase 2b Audit (workflow-focused re-assessment)

**Context:** Mock data mirrors real API responses. The assessment focuses on whether components, page layouts, redirections, and information architecture align with the quant workflow: **Features → ML Models → Strategies → Backtests → Signals → Execution Configs**.

---

## The Build Workflow

A quant working in the Build lifecycle does this:

```
1. FEATURES    — Calculate features from acquired data (funding rates, OI, volume, basis, etc.)
2. ML MODELS   — Train prediction models using those features
3. STRATEGIES  — Define strategy archetypes that consume model signals
4. BACKTESTS   — Run parameter grid backtests, compare results
5. SIGNALS     — Validate model signals (champion vs challenger)
6. EXECUTION   — Choose execution algos, venues, analyse transaction costs
```

Each stage feeds into the next. The UI should reflect this flow.

---

## Tab-by-Tab Alignment Assessment

### Tab 1: Research Hub (`/service/research/overview`) — WELL ALIGNED

**What it shows:** Three workflow pipelines (ML, Strategy, Execution) with numbered steps linking to sub-pages. Quick stats. Entitlement badges.

**Alignment verdict:** This is the right entry point. The three pipelines correctly model the workflow:
- ML: Select → Features → Train → Validate → Deploy → Monitor
- Strategy: Configure → Backtest → Compare → Candidates → Handoff
- Execution: Algos → Venues → TCA → Benchmarks

**Issues:**

| Issue | Severity | Detail |
| ----- | -------- | ------ |
| Quick stats are hardcoded | P3 | Values like "6 Model Families", "12 Active Experiments" are inline constants, not derived from data. When connected to real API, these need to be live counts. The mock data already has the right structure — just needs wiring. |
| No "Features" quick stat | P2 | Feature calculation is step 1 of the build workflow, but the stats section only shows ML-related numbers. Should show feature freshness/coverage stats too. |
| Strategy/Execution tabs have no stats | P2 | Only the ML tab has the "quick stats" grid. Strategy tab should show: Active Configs, Running Backtests, Candidates Pending, Best Sharpe. Execution tab should show: Active Algos, Avg Slippage, Venues Connected. |
| Workflow steps don't show status | P2 | Each workflow card is static. They should show a status indicator (e.g., "3 features degraded", "2 training runs active", "1 candidate pending review") to pull the user into the flow. |

---

### Tab 2: Features (`/service/research/ml/features`) — WELL ALIGNED

**What it shows:** Feature catalog with health status, source, freshness, data quality. Filter by source/status. Detail panel with history. Feature-model usage matrix.

**Alignment verdict:** This is correctly positioned as the foundation of the build workflow. Features are the raw material that feeds ML training.

**What works well:**
- Feature health status (healthy/warning/stale) gives immediate situational awareness
- Feature-model usage matrix shows dependencies — which models use which features
- Source tracking (exchange, on-chain, derived) matches real data provenance

**Issues:**

| Issue | Severity | Detail |
| ----- | -------- | ------ |
| No link to data acquisition | P2 | Feature freshness depends on data pipelines (Acquire tab). When a feature shows "stale", the user should be able to click through to the data pipeline status for that source. Currently there's no cross-lifecycle link to `/service/data/overview`. |
| No "Create Feature" action | P2 | The page is read-only. A quant needs to define new features (e.g., new rolling window, new derived metric). There should be a "Define Feature" or "Create Feature Set" action that links to the config/orchestration layer. |
| Feature history chart missing | P1 | The detail panel mentions history but it's a simple list. Feature stability over time (distribution drift, coverage gaps) needs a time-series chart — this is critical for deciding whether a feature is reliable enough for model training. |
| No feature correlation view | P2 | Quants need to see feature correlation matrices to avoid multicollinearity. This is a standard step before model training. |

---

### Tab 3: ML Models (`/service/research/ml`) — WELL ALIGNED

**What it shows:** Model families grid, training status summary, "Train New Model" dialog, feature freshness sidebar, ML alerts.

**Alignment verdict:** Good overview page for the ML domain. The model families grid is the right entry point — a quant picks a family, then drills into experiments.

**What works well:**
- Model families grid with architecture, instruments, and experiment counts
- Training status (running/queued/completed/failed) gives operational awareness
- Feature freshness sidebar connects ML to the feature layer
- ML alerts (drift detected, accuracy drop) are actionable

**Issues:**

| Issue | Severity | Detail |
| ----- | -------- | ------ |
| "Train New Model" dialog is too simple | P2 | The dialog has: model family, experiment name, epochs, batch size, learning rate, optimizer, GPU type. But a real training config needs: feature set selection, target variable, train/validation split, dataset snapshot, regularization params. The `/ml/config` page has this full wizard but is an orphan — it should be the primary training flow, not this simplified dialog. |
| No connection to feature sets | P1 | The "Train New Model" dialog doesn't let you pick features. In reality, feature selection is the most important part of model config. The dialog should either embed feature selection or link to `/ml/config` which has the full wizard. |
| Model families are static cards | P2 | Each family card shows experiment count and "Latest" info, but doesn't show the current champion model's live performance. A quant wants to see: "BTC Funding Predictor: champion v2.3.1, live Sharpe 1.85, accuracy 67%". |

---

### Tab 4: Strategies (`/service/research/strategy/backtests`) — WELL ALIGNED

**What it shows:** Backtest management with filter bar (archetype, venue, stage), sortable results table (Sharpe, Return, Max DD, Sortino, Hit Rate), candidate basket, "Run New Backtest" dialog.

**Alignment verdict:** This is the core strategy development page. The workflow is right: filter existing backtests, compare results, star winners, promote to candidates.

**What works well:**
- Filter bar with archetype/venue/stage is exactly what a quant needs
- Sortable metrics table with the right financial metrics
- Star toggle + candidate basket for building a shortlist
- "Promote Selected to Candidates" button closes the build→promote loop

**Issues:**

| Issue | Severity | Detail |
| ----- | -------- | ------ |
| No link to the model that generated signals | P2 | A strategy backtest uses ML model signals. The table shows the strategy archetype and venue but not which model version produced the signals. This is critical for reproducibility — if model v2.3 was retrained, which backtests used its signals? |
| "Run New Backtest" dialog missing model selection | P2 | The dialog has: template, instrument, venue, dates, entry/exit threshold, max leverage. But it doesn't ask which ML model to use for signal generation. In reality, a backtest = strategy config + model version + data range. |
| No batch comparison view | P2 | You can star individual runs but can't select 3-4 and see them side-by-side without going to the Compare tab. An inline "Compare Selected" button that opens a modal would speed up the workflow. |
| Stage filter ("dev", "staging", "paper", "live") is good | — | This correctly reflects the lifecycle: a backtest progresses through stages. No issue. |

---

### Tab 5: Backtests / Compare (`/service/research/strategy/compare`) — WELL ALIGNED

**What it shows:** Up to 5 config selectors with "Set as Base", performance metrics comparison (Sharpe, Return, Max Drawdown, Sortino, Hit Rate, Turnover, Avg Slippage), parameter diff table, ContextBar with BATCH/LIVE toggle, BatchLiveRail showing lifecycle stages.

**Alignment verdict:** This is a strong comparison page. The "Set as Base" + delta view is exactly what quants need.

**What works well:**
- Side-by-side comparison with delta highlighting (green = better, red = worse)
- Parameter diff table shows exact config differences between runs
- ContextBar gives hierarchical context (fund → client → template → config version)
- BATCH/LIVE toggle aligns with the real workflow (backtest results vs live performance)
- BatchLiveRail shows the strategy lifecycle stages

**Issues:**

| Issue | Severity | Detail |
| ----- | -------- | ------ |
| No chart visualization | P1 | Comparing 5 strategies with only a metrics table is limiting. This page needs: equity curves overlay, drawdown comparison, monthly return heatmaps. Strategy comparison is visual — a Sharpe of 1.8 vs 1.6 means more when you see the equity curve shape. |
| No regime-aware comparison | P2 | The comparison is aggregate metrics only. Quants need to see: "How did each config perform in trending vs mean-reverting vs high-vol regimes?" The data model supports this (regime analysis exists on results page) but it's not exposed in the comparison view. |
| "Add Selected to Basket" — basket state unclear | P3 | The basket concept exists here and on the backtests page, but it's unclear whether they share state. If I star items on backtests and come here, do I see them? |

---

### Tab 6: Signals / Validation (`/service/research/ml/validation`) — WELL ALIGNED

**What it shows:** Champion vs Challenger model comparison with: performance metrics, cumulative returns, rolling Sharpe, promotion recommendation, tabs for regime analysis, walk-forward validation, statistical tests, feature importance.

**Alignment verdict:** This is the right page for model validation before promotion. It correctly sits between "train" and "deploy" in the ML workflow.

**What works well:**
- Champion vs Challenger framing is exactly right
- Promotion recommendation with confidence score is actionable
- Walk-forward validation prevents overfitting
- Statistical tests (t-test, KS-test, Diebold-Mariano) are the right validation tools
- Feature importance comparison shows if the challenger learned different patterns

**Issues:**

| Issue | Severity | Detail |
| ----- | -------- | ------ |
| Only compares 2 models | P2 | The page is hardcoded for champion vs 1 challenger. In practice, you might want to compare the champion against 3-4 challengers simultaneously. The data model supports this but the UI is pair-only. |
| No connection to live performance | P2 | Validation compares backtest metrics. But the real question is: "How does the challenger compare to the champion's LIVE performance?" The BATCH/LIVE toggle should switch between comparing backtest results vs comparing against live production metrics. |
| Tab label "Signals" is misleading | P2 | This page is about model validation, not signal monitoring. The BUILD_TABS label "Signals" suggests real-time signal watching. Should be "Validation" or "Model Review" to match what the page actually does. |

---

### Tab 7: Execution Research (`/service/research/execution/algos`) — WELL ALIGNED

**What it shows:** Execution algorithm comparison table (TWAP, VWAP, Iceberg, etc.) with metrics: slippage, fill rate, latency, cost vs benchmark, aggressiveness. Compare mode for side-by-side. Recent backtests.

**Alignment verdict:** Correct placement — after building and validating a strategy, you need to choose how to execute it. This page helps compare execution algorithms.

**What works well:**
- Algorithm comparison table with the right metrics (slippage, fill rate, latency)
- Compare mode for side-by-side analysis
- Recent backtests show algo performance over time

**Issues:**

| Issue | Severity | Detail |
| ----- | -------- | ------ |
| No strategy-aware recommendation | P2 | The algo comparison is generic. It should factor in the strategy type: a momentum strategy needs different execution than a mean-reversion strategy (urgency, aggressiveness, venue preference). The page should ask "Which strategy are you executing?" and tailor the comparison. |
| No venue-algo combination analysis | P2 | Algos perform differently on different venues. The comparison should show: "TWAP on Binance vs TWAP on OKX" — not just "TWAP overall". The venues page exists but isn't linked from this view. |
| ExecutionNav links to wrong routes | P1 | ExecutionNav uses `/execution/*` hrefs. In the research context these should be `/service/research/execution/*`. Clicking any nav item navigates away from the research layout. |

---

## Orphan Pages: Workflow Alignment

### ML Orphans — Mostly Well Aligned

| Page | Workflow Position | Alignment | Key Issue |
| ---- | ----------------- | --------- | --------- |
| **ml/overview** | ML dashboard / entry point | ✓ Good | Should be reachable from ML Models tab. Currently orphaned from tab navigation. |
| **ml/experiments** | Track experiment runs | ✓ Good | Core page for tracking training experiments. Should be more prominent (own tab or sub-nav). |
| **ml/experiments/[id]** | Drill into single experiment | ✓ Good | Correct detail page. Training curves, validation metrics, feature importance, lineage — all right. |
| **ml/training** | Monitor training jobs | ✓ Good | Running/queued/completed/failed status. Resource usage. Correct operational view. |
| **ml/registry** | Version catalog + champion/challenger | ✓ Good | Connects to validation. Deploy dialog closes the build→promote loop. |
| **ml/config** | Full training config wizard | ✓ Best workflow page | This is the BEST training flow — 6-step wizard: Select → Features → Target → Grid → Run → Results. Should REPLACE the simplified "Train New Model" dialog on ml/page.tsx. |
| **ml/monitoring** | Live model health | ⚠ Wrong lifecycle | This is an Observe function, not Build. Correctly mapped to observe in routeMappings. Lives here because it's part of the ML tooling, but should eventually move or be cross-referenced. |
| **ml/deploy** | Deploy readiness checklist | ⚠ Wrong lifecycle | This is a Promote function. Readiness score, rollout stages, config — all promote-stage concerns. |
| **ml/governance** | Audit, access control, compliance | ⚠ Wrong lifecycle | This is a Manage function. Audit logs, approvals, access control — all governance. |

**Key insight:** `ml/config` is the most workflow-aligned page in the entire Build tab but it's completely hidden (URL-only access, not in any tab or nav). It should be the primary "Train New Model" flow.

### Strategy Orphans — Partially Aligned

| Page | Workflow Position | Alignment | Key Issue |
| ---- | ----------------- | --------- | --------- |
| **strategy/overview** | Strategy dashboard | ✓ Good | KPIs, configs table, recent backtests, alerts — right content. Overlaps with backtests tab. |
| **strategy/results** | Single backtest deep-dive | ✓ Good | PnL curve, drawdown, regime analysis, attribution — exactly what you need after running a backtest. |
| **strategy/heatmap** | Parameter grid visualization | ✓ Excellent | Heatmap over parameter space is the core quant tool for strategy optimization. Should be more prominent. |

**Key insight:** `strategy/heatmap` is critical for the backtesting workflow (visualize Sharpe across parameter grid) but is almost undiscoverable. It should be linked from the backtests table — "View Heatmap" button per backtest run.

### Execution Orphans — Aligned

| Page | Workflow Position | Alignment | Key Issue |
| ---- | ----------------- | --------- | --------- |
| **execution/venues** | Venue comparison | ✓ Good | Routing matrix, quality metrics, fee structure, market share — right content for venue selection. |
| **execution/benchmarks** | Benchmark analysis | ✓ Good | Algo vs benchmark heatmap, drill-down by order size/urgency — correct for TCA. |

### Quant Page — Misaligned

| Page | Workflow Position | Alignment | Key Issue |
| ---- | ----------------- | --------- | --------- |
| **quant** | All-in-one dashboard | ⚠ Redundant | QuantDashboard duplicates content from backtests, training, config, and execution pages. It's a legacy "everything on one page" view. Should be either retired or re-scoped to be a personal quant workbench with pinned items from other pages. |

---

## Navigation Flow Assessment

### Current Flow vs Ideal Flow

**Current:** User lands on Research Hub → picks one of 3 domains → navigates to a tab page → cannot easily find orphan pages → must know URLs.

**Ideal:** User lands on Research Hub → sees their active work (running experiments, pending backtests, candidate strategies) → clicks into a workflow → sub-nav guides them through the stages → cross-links connect related pages.

### Missing Navigation Patterns

| Gap | Impact | Recommendation |
| --- | ------ | -------------- |
| **No "My Active Work" section on Research Hub** | User must hunt for their running experiments and backtests | Add a "Currently Running" section at the top: active training runs, running backtests, pending promotions |
| **No workflow continuity links** | After training completes, user must manually navigate to validation | Add "Next step" links: training complete → "Validate Model" button; backtest complete → "View Results" / "Compare" / "Add to Candidates" |
| **ml/config wizard is hidden** | The best training flow is undiscoverable | Either: (a) make ml/config the target of "Train New Model", or (b) embed the wizard steps in the existing dialog |
| **strategy/heatmap is hidden** | The most valuable backtesting visualization is undiscoverable | Add "View Heatmap" button on each backtest run row in the backtests table |
| **strategy/results is disconnected** | After running a backtest, no way to get to the detailed results view | Add "View Details" link on each backtest run row that opens results for that run |
| **No breadcrumbs** | On deep pages (ml/experiments/[id]), user can't see where they are | Add breadcrumbs: Research > ML > Experiments > EXP-001 |

---

## Cross-Page Component Assessment

### Components That Are In The Right Place

| Component | Page | Why It's Right |
| --------- | ---- | -------------- |
| WorkflowPipeline | Research Hub | Numbered steps → sub-pages is the right pattern for guided workflows |
| Feature-Model Usage Matrix | Features | Showing which models use which features is critical for impact analysis |
| Candidate Basket + Star Toggle | Backtests | Building a shortlist from many backtest runs is the right UX for strategy selection |
| Champion vs Challenger | Validation | Pair comparison is the standard model validation pattern |
| Parameter Diff Table | Compare | Showing exact config differences between strategy versions is essential |
| ContextBar (BATCH/LIVE) | Compare, Results | Separating backtest results from live results is core to the platform USP |
| Readiness Checklist | Deploy | Gate-based deployment readiness is the right pattern for ML ops |
| Heatmap Grid | Heatmap | Parameter grid visualization is the core quant tool |

### Components That Need Improvement

| Component | Page | Issue | Recommendation |
| --------- | ---- | ----- | -------------- |
| "Train New Model" Dialog | ML Models | Too simple — no feature selection, no target variable | Replace with link to ml/config wizard, or embed the full wizard |
| "Run New Backtest" Dialog | Backtests | Missing model version selection | Add model/signal source selector to the dialog |
| Quick Stats Grid | Research Hub | Only on ML tab, hardcoded values | Add to all three tabs, wire to data |
| ExecutionNav | All execution pages | Wrong href prefix | Make context-aware with `basePath` prop |
| MLNav | ml/overview | Wrong href prefix (`/ml/*` instead of `/service/research/ml/*`) | Fix prefixes |

### Components That Are Missing

| Missing Component | Where It Should Go | Why |
| ----------------- | ------------------ | --- |
| **Feature Correlation Matrix** | Features page | Quants need to check multicollinearity before training |
| **Equity Curve Chart** | Compare page | Visual comparison of strategy performance is essential |
| **Backtest → Results link** | Backtests table rows | Each row should link to its detailed results |
| **Backtest → Heatmap link** | Backtests page | "View Parameter Heatmap" per strategy template |
| **Model → Experiment link** | ML Models family cards | Click a model family → see its experiments |
| **Training Complete → Validate link** | Training page | After a run completes, prompt the user to validate |
| **Active Work Dashboard** | Research Hub top section | Show running training, active backtests, pending promotions |
| **Breadcrumbs** | All pages deeper than 1 level | Orientation for deep pages |

---

## Redirect & Link Sensibility

### Links That Are Correct

| Source | Target | Sensible? |
| ------ | ------ | --------- |
| Research Hub ML "Select" step | `/service/research/ml/overview` | ✓ Right — overview is the starting point |
| Research Hub ML "Features" step | `/service/research/ml/features` | ✓ Right — feature selection comes early |
| Research Hub ML "Train" step | `/service/research/ml/training` | ✓ Right — but should go to `/ml/config` (wizard) not `/ml/training` (monitoring) |
| Research Hub ML "Validate" step | `/service/research/ml/validation` | ✓ Right — validation after training |
| Research Hub ML "Deploy" step | `/service/research/ml/deploy` | ✓ Right — deploy after validation |
| Research Hub ML "Monitor" step | `/service/research/ml/monitoring` | ✓ Right — monitor after deploy |
| Research Hub "Open ML Dashboard" | `/service/research/ml/overview` | ✓ Right |
| Research Hub "View Experiments" | `/service/research/ml/experiments` | ✓ Right |
| Research Hub Strategy "Configure" step | `/service/research/strategy/backtests` | ⚠ Questionable — "Configure" implies setup, but backtests page is results listing |
| Research Hub Strategy "Backtest" step | `/service/research/strategy/heatmap` | ✓ Right — heatmap shows the grid of results |
| Research Hub Strategy "Compare" step | `/service/research/strategy/compare` | ✓ Right |
| Research Hub Strategy "Candidates" step | `/service/research/strategy/candidates` | ✓ Right — but this is a Promote page |
| Research Hub Strategy "Handoff" step | `/service/research/strategy/handoff` | ✓ Right — but this is a Promote page |
| Research Hub "Open Backtests" | `/service/research/strategy/backtests` | ✓ Right |
| Research Hub "View Candidates" | `/service/research/strategy/candidates` | ✓ Right |
| Backtests "Promote Selected to Candidates" | In-page action | ✓ Right — moves from build to promote |
| Validation "Promote Challenger" banner | In-page action | ✓ Right — promotes model version |

### Links That Need Fixing

| Source | Target | Issue | Fix |
| ------ | ------ | ----- | --- |
| Research Hub ML "Train" step | `/service/research/ml/training` | Links to training *monitor*, not training *config*. The "Train" step should start the training wizard. | Change target to `/service/research/ml/config` |
| Research Hub Strategy "Configure" step | `/service/research/strategy/backtests` | "Configure" implies creating a new config, but backtests page shows existing results | Change target to `/service/research/strategy/overview` (which has the "New Backtest" dialog) or create a dedicated config page |
| Research Hub "Upgrade to access" links | `/service/ml`, `/service/research-backtesting`, `/service/execution` | These go to non-existent marketing pages | Should go to existing public service pages: `/services/platform`, `/services/backtesting`, `/services/execution` |
| All MLNav links | `/ml/*` | Wrong prefix | `/service/research/ml/*` |
| All StrategyPlatformNav links | `/strategy-platform/*` | Wrong prefix | `/service/research/strategy/*` |
| All ExecutionNav links | `/execution/*` | Wrong prefix, context-dependent | Accept `basePath` prop |

---

## Summary: What's Working and What Needs Attention

### Working Well (keep as-is)

1. **Research Hub as a guided entry point** — three workflow pipelines with numbered steps
2. **Feature catalog with health monitoring** — right information for feature management
3. **Backtest results table with star/basket** — correct UX for strategy shortlisting
4. **Champion vs Challenger validation** — right pattern for model promotion decisions
5. **Strategy comparison with parameter diff** — essential for understanding config differences
6. **ContextBar BATCH/LIVE toggle** — aligns with the platform's batch-vs-live USP
7. **Deploy readiness checklist** — gate-based deployment is correct for ML ops
8. **Heatmap grid for parameter space** — core quant tool, well implemented

### Needs Attention (prioritized)

| Priority | Issue | Impact | Effort |
| -------- | ----- | ------ | ------ |
| **P1** | Fix sub-nav prefixes (MLNav, StrategyPlatformNav, ExecutionNav) | All orphan pages unreachable via in-page nav | Low — prefix fix |
| **P1** | Surface ml/config wizard as primary "Train New Model" flow | Best training UX is hidden | Low — change dialog to redirect |
| **P1** | Add equity curve charts to Compare page | Strategy comparison without charts is unusable for quants | Medium |
| **P1** | Add backtest → results/heatmap links in backtests table | Can't drill into individual backtest results | Low |
| **P2** | Fix Research Hub "Train" step target (→ ml/config, not ml/training) | Workflow step links to wrong page | Low |
| **P2** | Add "Currently Active" section to Research Hub | No overview of running work | Medium |
| **P2** | Add model version to backtest config | Can't trace which model produced signals | Medium |
| **P2** | Add feature correlation matrix to Features page | Standard quant workflow step missing | Medium |
| **P2** | Rename "Signals" tab to "Validation" or "Model Review" | Tab label doesn't match content | Low |
| **P2** | Add stats to Strategy and Execution tabs on Research Hub | Only ML tab has quick stats | Low |
| **P3** | Add breadcrumbs to deep pages | Orientation issue on ml/experiments/[id] etc. | Low |
| **P3** | Decide future of quant page (retire or re-scope) | Duplicates other pages | — |
