# Research / Build Section — Current State Audit & Design Plan

> **Purpose:** Working document for the research/build section redesign.
> Documents current state, identifies issues, and captures design decisions.

---

## 1. Architecture Overview

### Lifecycle Position

The **Build** stage is the second lifecycle stage (after **Acquire/Data**). It maps to the `/services/research/` route tree.

**Pipeline flow:**

```
Acquire (Data) → Build (Research) → Promote → Run → Execute → Observe → Manage → Report
```

The Build/Research section is responsible for:

1. **ML Model Training** — Create/train ML models on downloaded data
2. **Strategy Creation** — Define strategies that use those ML models
3. **Signal Generation** — Generate trading signals from strategies for backtesting
4. **Execution Backtesting** — Use signals to simulate trades and evaluate P&L

### Route Structure (Current)

```
/services/research/
├── overview            ← Research Hub (landing page with 3-tab workflow cards)
├── features            ← Feature pipeline status (MOCK_FEATURES inline)
├── signals             ← Signal monitor (MOCK_SIGNALS inline)
├── quant               ← Quant Workspace (delegates to QuantDashboard component)
│
├── ml/                 ← ML sub-section
│   ├── (root)          ← ML Platform dashboard (model families, training status, alerts)
│   ├── overview/       ← ML Platform Overview (KPIs, live model health, regime, promotions)
│   ├── experiments/    ← Experiment tracking table with compare feature
│   │   └── [id]/       ← Individual experiment detail (placeholder)
│   ├── training/       ← Training runs manager (GPU queue, loss curves, logs)
│   ├── features/       ← Feature Catalog & Provenance (detailed feature management)
│   ├── validation/     ← Champion vs Challenger validation (statistical tests, regime analysis)
│   ├── registry/       ← Model registry (placeholder/minimal)
│   ├── monitoring/     ← Live model monitoring (placeholder/minimal)
│   ├── deploy/         ← Deployment management (placeholder/minimal)
│   ├── config/         ← ML config (placeholder/minimal)
│   └── governance/     ← ML governance (placeholder/minimal)
│
├── strategy/           ← Strategy sub-section
│   ├── overview/       ← Strategy overview (placeholder)
│   ├── backtests/      ← Backtest runner (create/run backtests, strategy wizard)
│   ├── results/        ← Backtest results (placeholder)
│   ├── candidates/     ← Strategy candidates for promotion
│   ├── compare/        ← Side-by-side strategy comparison
│   ├── handoff/        ← Handoff to live trading
│   └── heatmap/        ← Parameter grid heatmap
```

### Tab Bar (BUILD_TABS — Row 2 Navigation)

| Tab Label       | Route                                 | Entitlement   |
| --------------- | ------------------------------------- | ------------- |
| Research Hub    | /services/research/overview           | —             |
| Features        | /services/research/ml/features        | ml-full       |
| ML Models       | /services/research/ml                 | ml-full       |
| Strategies      | /services/research/strategy/backtests | strategy-full |
| Backtests       | /services/research/strategy/compare   | strategy-full |
| Signals         | /services/research/ml/validation      | ml-full       |
| Quant Workspace | /services/research/quant              | strategy-full |

---

## 2. Page-by-Page Analysis

### 2.1 Research Hub (Overview)

**Route:** `/services/research/overview`
**File:** `app/(platform)/services/research/overview/page.tsx` (252 lines)

**What it does:**

- Landing page with a 3-tab card UI (ML Models, Strategy, Execution)
- Each tab shows a numbered workflow pipeline (6 steps for ML, 5 for Strategy, 4 for Execution)
- Quick stats row with model families, active experiments, feature sets, deployed models
- Uses real API hooks: `useModelFamilies()`, `useExperiments()`

**Issues:**

- [ ] Stats row values fall back to hardcoded strings ("8", "4") when API returns empty
- [ ] Execution tab links to `/services/execution/` (different lifecycle stage) — confusing navigation
- [ ] No clear CTA to start a new workflow (buried in sub-tabs)
- [ ] The 3-tab layout duplicates what the tab bar already provides

### 2.2 ML Platform Root

**Route:** `/services/research/ml`
**File:** `app/(platform)/services/research/ml/page.tsx` (599 lines)

**What it does:**

- Full ML dashboard: KPI cards, model families grid, training status list, feature freshness, alerts
- "Train New Model" dialog with hyperparameter configuration
- Uses hooks: `useExperiments`, `useModelFamilies`, `useTrainingRuns`, `useFeatureProvenance`, `useMLMonitoring`, `useCreateTrainingJob`

**Issues:**

- [ ] Duplicates content heavily with ML Overview (`ml/overview/`)
- [ ] 599 lines — should be split into components
- [ ] ML root and ML overview are confusingly separate pages with overlapping content

### 2.3 ML Platform Overview

**Route:** `/services/research/ml/overview`
**File:** `app/(platform)/services/research/ml/overview/page.tsx` (642 lines)

**What it does:**

- More advanced ML dashboard: lifecycle rail, KPI row, live model health, champion/challenger pairs
- Training jobs, top experiment candidates, feature freshness, regime state, pending promotions
- Uses `MLNav` component for sub-navigation
- Has BATCH/LIVE context badges

**Issues:**

- [ ] 642 lines — too large for a single page component
- [ ] Overlaps heavily with `ml/page.tsx` (the root ML page)
- [ ] Two ML "dashboards" is confusing — users don't know which to use
- [ ] `MLNav` component adds another navigation layer inside the tab bar → 3 levels of nav

### 2.4 Experiments Page

**Route:** `/services/research/ml/experiments`
**File:** `app/(platform)/services/research/ml/experiments/page.tsx` (736 lines)

**What it does:**

- Full experiment tracking table with filter bar (family, status, search)
- Side-by-side comparison when 2+ experiments selected
- "New Experiment" dialog with model family, feature set, dataset, hyperparameter config
- Export dropdown for data export
- Good error/empty/loading states

**Status:** Well-built. One of the more complete pages.

### 2.5 Training Runs Page

**Route:** `/services/research/ml/training`
**File:** `app/(platform)/services/research/ml/training/page.tsx` (625 lines)

**What it does:**

- GPU cluster management and job queue
- Left panel: tabbed list (Running / Queued / Completed / Failed)
- Right panel: detailed view with loss curve, resource usage charts, logs, artifacts
- Uses `useTrainingRuns`, `useExperiments`

**Issues:**

- [ ] Some mock data still inline (QUEUED_JOBS, COMPLETED_JOBS, FAILED_JOBS constants)
- [ ] 625 lines — could be split

**Status:** Functionally strong, needs mock data migration.

### 2.6 Feature Catalog & Provenance

**Route:** `/services/research/ml/features`
**File:** `app/(platform)/services/research/ml/features/page.tsx` (678 lines)

**What it does:**

- Feature catalog with search/filter (source, status)
- Detail panel on click (metadata, tags, data lineage, statistics)
- Feature-Model usage matrix
- Export capability
- DEFAULT_FEATURE_CATALOG with 6 features as fallback

**Issues:**

- [ ] Hardcoded DEFAULT_FEATURE_CATALOG (234 lines of inline data)
- [ ] Has its own sticky header which conflicts with main layout

### 2.7 Validation Page (Champion vs Challenger)

**Route:** `/services/research/ml/validation`
**File:** `app/(platform)/services/research/ml/validation/page.tsx` (733 lines)

**What it does:**

- Champion vs Challenger model comparison
- 5 tabbed views: Performance, Regime Analysis, Walk-Forward, Statistical Tests, Feature Analysis
- Charts: cumulative returns, rolling Sharpe, regime bar charts, feature importance
- Promotion recommendation banner
- Uses `useValidationResults()`

**Issues:**

- [ ] 733 lines — largest page, needs splitting
- [ ] Hardcoded DEFAULT constants for all data (regime, walk-forward, statistical tests, features)
- [ ] Has its own sticky header
- [ ] Tab bar labels this as "Signals" but it's actually model validation — confusing

### 2.8 Strategy Backtests

**Route:** `/services/research/strategy/backtests`
**File:** `app/(platform)/services/research/strategy/backtests/page.tsx` (741 lines)

**What it does:**

- Backtest runner with filter bar, DataTable, and StrategyWizard for creating new backtests
- Export capability
- Uses `useStrategyBacktests`, `useCreateBacktest`, `useStrategyTemplates`

**Status:** Functional but large file.

### 2.9 Strategy Compare

**Route:** `/services/research/strategy/compare`
**File:** `app/(platform)/services/research/strategy/compare/page.tsx` (671 lines)

**What it does:**

- Side-by-side strategy comparison with batch/live rail
- Context bar for org/client/strategy filters
- Metric cards showing Sharpe, return, drawdown, win rate per selected config

### 2.10 Signals Page

**Route:** `/services/research/signals`
**File:** `app/(platform)/services/research/signals/page.tsx` (192 lines)

**What it does:**

- Simple signal monitor table showing active signals
- 100% hardcoded MOCK_SIGNALS (7 entries)
- No API hooks — completely static

**Issues:**

- [ ] No API integration
- [ ] Purely mock data, no search/filter
- [ ] Very thin compared to other pages

### 2.11 Features Pipeline Page

**Route:** `/services/research/features`
**File:** `app/(platform)/services/research/features/page.tsx` (181 lines)

**What it does:**

- Feature pipeline status table
- 100% hardcoded MOCK_FEATURES (10 entries)
- No API hooks

**Issues:**

- [ ] No API integration — completely static
- [ ] Duplicates the ML Feature Catalog concept (ml/features/) but at a much simpler level
- [ ] Confusing to have TWO "Features" pages at different depths

### 2.12 Quant Workspace

**Route:** `/services/research/quant`
**File:** `app/(platform)/services/research/quant/page.tsx` (7 lines)

**What it does:**

- Delegates entirely to `QuantDashboard` component
- Likely a notebook/workspace concept

---

## 3. Cross-Cutting Issues

### 3.1 Navigation Confusion

- **3 levels of navigation**: Lifecycle nav (Row 1) → Service tabs (Row 2) → ML sub-nav (Row 3 via MLNav component)
- Tab bar says "Signals" but links to `/services/research/ml/validation` (model validation, not signals)
- Tab bar says "Features" but links to ML features, not the standalone features page
- Two separate "Features" pages exist

### 3.2 Duplicate Content

- ML root (`/ml`) and ML overview (`/ml/overview`) are nearly identical dashboards
- Features tab page and ML Features page overlap
- Overview page's 3-tab workflow cards duplicate what the tab bar provides

### 3.3 Mock Data

| Page               | Mock Data Status                                     |
| ------------------ | ---------------------------------------------------- |
| ML root            | API hooks ✅                                         |
| ML overview        | API hooks ✅                                         |
| Experiments        | API hooks ✅                                         |
| Training           | API hooks + inline mocks (queued, completed, failed) |
| ML Features        | API hooks + DEFAULT_FEATURE_CATALOG fallback         |
| Validation         | API hooks + DEFAULT\_\* fallbacks (5 constants)      |
| Strategy Backtests | API hooks ✅                                         |
| Strategy Compare   | API hooks ✅                                         |
| Signals            | 100% inline mocks ❌                                 |
| Features (top)     | 100% inline mocks ❌                                 |
| Quant Workspace    | Delegates to component                               |

### 3.4 File Sizes

Multiple pages exceed 600 lines — several are above 700. These should be split.

### 3.5 Missing Pieces (Based on Your Description)

The pipeline you described: **data → train models → create strategies → generate signals → execution backtests**

Current gaps:

- [ ] **No clear "pipeline" flow** — pages exist but there's no guided workflow from data → model → strategy → signals → backtest
- [ ] **Execution Backtests** live under `/services/execution/`, not under research — should they be here?
- [ ] **Signal generation** page is a thin mock with no connection to strategies or models
- [ ] **No asset-class awareness** — the pages don't differentiate between CeFi (candles/trades), DeFi (on-chain events), Sports (match/odds), or Prediction Markets (bets)
- [ ] **No connection to Acquire/Data** — can't see which instruments have data ready for research

---

## 3.6 Context From Existing Docs (Summaries)

These summaries capture what the existing docs folder tells us about the Research/Build
section and the broader platform vision, so we don't lose context between sessions.

### From AGENT_FINDINGS.md (Full Audit — 2026-03-23)

**What was audited:** All personas, all routes, all strategy families.

**Research/ML specific findings:**

- ML platform page shows **0 model families / 0 training runs** despite the Research Hub showing 6 families and 12 experiments → data desync between hub and detail pages
- `/services/research/backtests` was a 404 (broken Build/Backtest loop)
- `/services/research/features` was a 404 (features tab broken)
- `/services/research/signals` was a 404 (signals route broken)
- Research overview SSR 500 error caused by `guided-tour.tsx` build error
- **Feature Source Attribution: FAIL** — no screen attributes features to their pipeline source
- **20.B** says the Research Features tab "should become the primary home for feature lineage"

**Strategy representation quality:**

- PASS: 5 strategies (Aave Lending, Momentum, Mean Reversion, TradFi ML, Options ML)
- PARTIAL: 11 strategies (most DeFi, Sports, CeFi MM, Prediction)
- FAIL: 2 (Sports MM — not represented; Kelly Criterion — not surfaced)
- Systematic mock data contamination: wrong instruments assigned to strategy names
  (e.g., NBA Halftime ML → ETH-PERP, NFL Value Betting → BNB-USDT)

**Key architectural validations that passed:**

- G1–G8 global rules mostly pass (strategies don't consume raw ticks, event-driven, etc.)
- PnL attribution waterfall is well-built (funding, carry, basis, delta, fees)
- 5-shard model is correct (CeFi, DeFi, Sports, TradFi, Prediction)

### From STRUCTURE_APP.md (Route Architecture)

- All platform content lives under `app/(platform)/services/`
- Research section is at `services/research/` with sub-trees: `ml/`, `strategy/`, `execution/`
- **Research already has its own `execution/` sub-tree** with `algos/`, `benchmarks/`, `tca/`, `venues/` pages — these exist under `/services/research/execution/`
- Legacy flat routes redirect to canonical `/services/*` paths
- No sub-layouts remain under `(platform)/services/` — layout is at the platform level only
  (but we added `research/layout.tsx` which provides BUILD_TABS)

### From STRUCTURE_COMPONENTS.md (Component Architecture)

- **`components/research/`** has only 1 file: `strategy-wizard.tsx`
- **`components/ml/`** has 2 files: `loss-curves.tsx`, `ml-nav.tsx`
- **`components/dashboards/quant-dashboard.tsx`** exists (what `/research/quant` delegates to)
- There are 30 `trading/` components but only 1 `research/` component — the research
  section is under-componentized relative to its complexity

### From STRUCTURE_HOOKS.md (Data Hooks)

- `hooks/api/use-ml-models.ts` — ML domain hooks (experiments, model families, training runs, etc.)
- `hooks/api/use-strategies.ts` — Strategy domain hooks (backtests, templates, candidates)
- These are the two primary API hook files that research pages consume
- All hooks use React Query with MSW mock intercept in dev mode
- Pattern: `queryKey: ['domain', ...params]` for cache management

### From STRUCTURE_LIB.md (Data Layer)

- Mock data lives in flat files: `lib/ml-mock-data.ts`, `lib/strategy-platform-mock-data.ts`
- Types live in: `lib/ml-types.ts`, `lib/strategy-platform-types.ts`
- MSW handlers: `lib/mocks/handlers/ml.ts`, `lib/mocks/handlers/strategy.ts`
- **Inline mock data in pages is a known structural gap** — should be in `lib/*-mock-data.ts`
- Zustand stores: `global-scope-store.ts` (org/shard/date filters) should drive data in research

### From MOCK_STATIC_BROWSER_AGENT_HANDBOOK.md (Strategy Catalog)

This is the **most detailed document** — 719 lines of per-strategy specifications including:

- Instruments, features consumed, PnL attribution buckets, risk profiles
- Latency expectations per strategy type
- Execution patterns (atomic bundles for DeFi, SOR for CeFi, BACK/LAY for Sports)
- Per-strategy UI checklist: Discover, Shard, Inputs, Execution, Risk, Attribution, Consistency

**Key insight for Build/Research section:**

- Each strategy archetype has specific **feature dependencies** (funding_rate, basis_spot_perp,
  lst_eth_exchange_rate, odds_movement, ml_prediction_probs, etc.)
- Model families map to shards: BTC/ETH/Funding → CeFi, DeFi features → DeFi, NFL/LaLiga → Sports
- The Research section should surface these **feature → model → strategy** dependencies

### From PLANS_3.md (Service Architecture Completion)

- **Universal Service Funnel:** Every service follows the same pattern (prospect → client → internal)
  with subscribed/locked/internal states. Research pages must support this.
- **PLANS_3 is the master implementation plan** — Phase 5B covers Research & Backtesting:
  - Service hub card for research
  - Strategy wizard completion
  - ML experiment tracking
  - Backtest comparison
- The plan emphasizes: "not slides in the form of web pages — interactions must be REAL
  (forms submit, state changes, new items appear in lists, filters work end-to-end)"
- **Porting strategy:** Reference UIs in `_reference/` should be adapted, not just referenced

### From STRUCTURE_CONTEXT.md (Backend Reference)

- `context/api-contracts/openapi/` has OpenAPI specs per service
- `context/SHARDING_DIMENSIONS.md` explains CeFi/DeFi/Sports/TradFi partitioning
- `context/API_FRONTEND_GAPS.md` tracks what APIs exist vs what UI needs
- Before building any research feature, check if the backend API exists

### Answers to My Earlier "Unsure" Questions (from docs)

1. **Who uses this?** Both internal quants AND external clients. The universal service funnel
   (PLANS_3) means the same pages serve both, data-scoped by entitlements. Internal sees all;
   clients see their subscribed strategies/models.

2. **Execution backtests location:** Already partially answered — `services/research/execution/`
   exists with algos, benchmarks, tca, venues pages. The route tree IS inside research.

3. **Scale:** PLANS_3 says "COMPLETE platform experience" — full redesign, not just structure fixes.

4. **Quant Workspace:** `dashboards/quant-dashboard.tsx` exists as a real component, suggesting
   it's more than a placeholder. Likely a dashboard-style workspace, not a notebook.

---

## 4. Design Decisions — FINALIZED

> All questions have been answered through the Q&A session (2026-03-23).
> These decisions drive the implementation plan in Section 5.

---

### Q1. Pipeline Flow UX — ANSWER: (c) Hybrid

Overview page shows pipeline status summary (features computed, models trained, backtests
complete). Sub-pages (each tab) are fully independent dashboards — users can jump to any
tab freely without stepping through a wizard.

---

### Q2. Tab Structure — ANSWER: 6 tabs matching the pipeline

```
Features │ Feature ETL │ Models │ Strategies │ Execution │ Quant Workspace
```

**Current → New mapping:**

| Current Tab     | New Tab         | What Changed                                                               |
| --------------- | --------------- | -------------------------------------------------------------------------- |
| Research Hub    | (removed)       | Replaced by overview/hub within each tab's landing page                    |
| Features        | Features        | Extended with config, versioning, dependency trees, presets                |
| (new)           | Feature ETL     | New: computation pipeline (progress, heatmaps, jobs)                       |
| ML Models       | Models          | Extended with feature-version linkage, training ETL                        |
| Strategies      | Strategies      | Now includes: strategy config + run signal backtest + signal comparison    |
| Backtests       | (removed)       | Split into Strategies (signal backtest) and Execution (exec backtest)      |
| Signals         | (removed)       | Signals are output of strategy backtest, not a standalone page             |
| (new)           | Execution       | New: execution algo config + run exec backtest + TradingView-style results |
| Quant Workspace | Quant Workspace | Research KPI dashboard — high-level metrics across everything              |

**Strategies vs Execution split:**

- **Strategies tab** = configure strategy + run strategy backtest (signal generation) + view
  signal results + compare signals across different strategies (chart overlay, different colors)
- **Execution tab** = configure execution algo (TWAP/VWAP/etc) + run execution backtest +
  TradingView-style results (5 sub-tabs: Overview, Performance, Trades, Execution Quality,
  Config) + compare execution quality across different algos (slippage, fill time, fill rate)

---

### Q3. Execution Backtests Location — ANSWER: (a) Move into Build

All backtesting (both strategy and execution) lives in the Build/Research section.
The "Execute" lifecycle tab is for LIVE execution monitoring only, not historical backtesting.

---

### Q4. Asset Class Awareness — ANSWER: (c) Same UI, asset class filters options

One Platform, Filtered. The UI is identical across shards. Asset class selection drives:

- Which features are available in the Feature Catalogue
- Which model types and target variables appear in Model Config
- Which metrics are shown in backtest results (CeFi: Sharpe/MaxDD, Sports: ROI/CLV/Kelly)

---

### Q5. Signals Page — ANSWER: (e) Not a separate page

Signals are the output of the strategy backtest (Strategies tab) and the input to the
execution backtest (Execution tab). Visible in strategy results as a signal list and in
trade details. No standalone "Signals" tab.

---

### Q6. Two Features Pages — ANSWER: Replace both

- **"Features" tab** = Feature Catalogue (definitions, configs, versions, lineage, dependency
  trees, presets, downstream consumers)
- **"Feature ETL" tab** = Feature Computation Pipeline (progress bars, service breakdown,
  completion heatmaps, active job monitoring, trigger/compute actions)

Both current pages (`/services/research/features` and `/services/research/ml/features`)
are replaced — they are too thin for the new requirements.

---

### Q7. Quant Workspace — ANSWER: (d) Research KPI dashboard

High-level metrics dashboard spanning all models, strategies, and backtests. The existing
`QuantDashboard` (948 lines) sub-views will be cannibalized by the dedicated tabs. What
remains is an overview/KPI surface showing research productivity and quality metrics.

---

### Q8. ML Dashboard Style — ANSWER: Deferred

Deferred until after the initial refactor makes existing pages visible and navigable.
Once the new Models tab structure is in place, the user will decide on the dashboard
landing page style by seeing what's actually there.

---

### Q9. Pipeline Connection to Acquire — ANSWER: (c) Both

- **Data Readiness panel** on the Build overview showing instrument coverage from Acquire
- **Connected instrument selectors** in feature/model config that show data availability
  (green = processed data ready, amber = partial, red = not downloaded)

---

### Q10. Component Architecture — ANSWER: (c) Full refactor

- Types: extend `lib/ml-types.ts` and `lib/strategy-platform-types.ts`
- Mock data: extend `lib/ml-mock-data.ts` and `lib/strategy-platform-mock-data.ts`
- Hooks: extend `hooks/api/use-ml-models.ts` and `hooks/api/use-strategies.ts`
- Components: new files in `components/research/` (feature-config-form, version-history,
  model-config-form, strategy-config-form, backtest-results-panel, pipeline-status-view,
  execution-quality-panel, signal-comparison-chart, etc.)
- Pages: thin orchestrators that compose components + hooks

---

### Q11. Additional Decisions

**Q11a. Feature Presets — YES.** Offer standard presets for common indicators (EMA-9, EMA-21,
EMA-50, EMA-200, RSI-14, MACD-12-26-9, Bollinger-20-2, ATR-14). Users can apply with one
click and customize parameters after.

**Q11b. Feature Dependency Chains — YES, with cascade.** Features can depend on other features
(e.g., MACD depends on EMA-12 and EMA-26). The Feature Catalogue shows the dependency tree.
Version changes cascade: if EMA-12 bumps from v1.0 to v1.1, MACD auto-bumps its version
and downstream models are flagged for retraining.

**Q11c. Multi-Asset Backtests — BOTH modes.** Support single-instrument backtests (the default,
simpler case) AND portfolio-level backtests across multiple instruments simultaneously.
These are separate modes in the backtest configuration form.

**Q11d. Backtest → Promote — Candidate stage.** After a successful backtest, the user marks
it as a "strategy candidate" within the Build section (Strategies or Execution tab). The
candidate then appears in the Promote lifecycle tab for formal review and stage progression.
There is no automatic promotion.

**Q11e. Execution Algo Library — Fixed for now.** Initial set: TWAP, VWAP, Iceberg,
Aggressive Limit, Passive Limit, Market Only. Architecture should be extensible for
custom algos later, but UI only shows the fixed list for now.

**Q11f. Feature ETL is the primary UI.** The ETL pipeline views (both Acquire and Build)
are the main UI for managing data and feature computation. deployment-ui is being reduced
to deployment-only (spinning up dev/stage/prod machines). Acquire and Build each own their
ETL pipeline views for triggering computes and monitoring progress.

---

### Round 3 Decisions (Page-Level & UX Details — 2026-03-23)

**Q12. Build layout style:** Build is more workflow-oriented than dashboard-oriented.
Unlike Acquire's simple card layout, Build pages are detailed and comprehensive.
No copy-paste from any one mature system — diversified approach taking the best
from W&B, Tecton, MLflow, TradingView, and our own themes.

**Q13. Locked shards:** Lock at the data level — can't compute features for locked
shards since data isn't downloaded. But feature definitions are visible (show what
would be available if they upgrade).

**Q14. Job tracking components:** Build jobs are more complex than Acquire's download
jobs (epochs, loss curves, validation) — need a different component, not reuse of
PipelineStatusView directly.

**Q15. Alerts:** Yes — similar alerts section: "Model drift detected", "Feature stale

> 24h", "Backtest failed". On the overview page.

**Q16. Entitlements:** One gate for entire Build section.

**Q17. Data readiness cross-links:** Not for initial build, add later.

**Q18. Implementation approach:** Define what each page should look like FIRST,
then compare against current UI, then implement. Vision → diff → execute.

**Q19. Mock data updates:** Use existing where possible, update when insufficient,
and document changes for backend API alignment.

**Q20. Deploy/Monitoring/Governance:** Deploy → Promote tab. Monitoring → Observe tab.
Governance stays in Build under Quant Workspace.

**Q21. Model workflow:** Defer detailed ML sub-tab restructuring until current pages
are visible and working. Define ideal workflow first.

**Q22. Feature lineage visualization:** Text-based dependency list for now. Tree/list
toggle is appealing but needs proper mock data. Make everything work first, upgrade
to visual graph later.

**Q23. Comparison UX:** Simple for now — select 2-5 strategies, chart overlay + metrics
table. No parallel coordinates or advanced features yet.

**Q24. Sweep/auto-optimization:** Not needed for initial build. Could add later if
backend supports it and it's useful for trading models specifically.

**Q25. Real-time job updates:** Simulated real-time for now (mock progress), implement
actual polling when backend exists.

**Q26. Tab structure — 7 tabs with Overview:**

```
Overview | Features | Feature ETL | Models | Strategies | Execution | Quant Workspace
```

Overview is the landing page. Each tab also has its own mini-overview at the top
before drilling into detail.

**Q27. Features catalogue — drill-down with 10K+ features:** Support all three
views (collapsible tree, filtered table, card grid). Show all three, let user
experience drive future refinement on which to keep.

**Q28. Feature ETL sub-tabs:** Yes — Progress Overview | Active Jobs | Completion
Heatmap | History.

**Q29. Strategies flow:** My Strategies as landing page. New Strategy is a full
page (not modal). Compare is a full page.

**Q30. Execution results:** TradingView-style sub-tabs (Overview, Performance,
Trades, Execution Quality, Config).

**Q31. Quant Workspace:** Historical reports, saved comparisons, research logs.
Governance also lives here. Deferred for later — focus on 5 pipeline tabs + overview first.

**Q32. Sub-tabs — keep minimal.** Only add sub-tabs where truly needed. Not every
tab needs a full sub-tab bar.

---

## 5. Implementation Plan

See `BUILD_SECTION_SPEC.md` for the detailed specification.

### Implementation order:

1. Define vision for each page (what it should look like)
2. Compare against current UI (what exists vs what's needed)
3. Execute changes (update/migrate/remove)

### Tab structure (final — 7 tabs):

```
Overview | Features | Feature ETL | Models | Strategies | Execution | Quant Workspace
```
