# Research / Build Lifecycle — Enhancements

> **Source:** Platform review meeting 2026-03-25
> **Lifecycle stage:** Build (`/services/research/`)
> **Status:** Not started (Promote tab in progress first)

---

## 1. Multi-Tab Execution in Research

**From meeting:**

> "Multi-tab execution, keeping the high-level tab the same, multi-tab for strategy, machine learning, and execution. All the while allowing the user to quickly filter through a lot of information to less information to get their fixed config set up and then hyperparameter is their grid search for all of the dynamic stuff with UI-based grid searching."

**What this means:**

- The Research section keeps its current top-level tabs (Strategy, ML, Execution, Features, etc.)
- Within each, the user workflow is: **filter broadly → narrow down → set fixed config → define grid search for dynamic params**
- The UI should show how many backtests a given grid config will spin up
- It should show projected compute hours and cost estimate
- This pattern is the **same across Strategy, ML, and Execution research tabs**

**Current state:** Research tabs exist (`/services/research/strategies`, `/services/research/ml`, `/services/research/execution`) but lack:

- Grid search UI (hyperparameter grid builder)
- Backtest count estimator
- Compute cost projector
- Fixed vs dynamic config split in the UI

---

## 2. Features Visualisation — Shared with Data Pipeline

**From meeting:**

> "The features visualisation is super cool. Features and ETL, we can steal a lot of that stuff and put it on the data pipeline as well."

**What this means:**

- The features visualisation components built in `/services/research/features` and `/services/research/feature-etl` should be reusable
- The Data Pipeline section (`/services/data/`) should borrow the same visualisation patterns
- This is a component-sharing opportunity, not a new build — extract shared visualisation components

---

## 3. Strategy Comparison & Execution Comparison

**From meeting:**

> "Strategy comparison and execution comparison. Here we need a way to be able to see visually all the things in comparison mode versus absolute mode."

**What this means:**

- `/services/research/strategy/compare` exists — needs two viewing modes:
  1. **Absolute mode** — each strategy's metrics shown independently
  2. **Comparison mode** — metrics shown as deltas / relative to a baseline or each other
- Same concept needed for execution comparison (algo A vs algo B performance)

---

## 4. Features as a Subscription Product (TradingView Model)

**From meeting:**

> "The same way that TradingView allows you to subscribe to advanced technical indicators, those advanced technical indicators would effectively be our features library. We decide what we're willing to give away in terms of our IP, and they can subscribe to enhanced models. But in the basic level, you give them the Bollinger Bands, EMAs, RSIs — all that kind of basic stuff where they can quickly parameterize them as well."

> "Those existing features are pre-computed and live as well. We just make sure that they're also computed live. So that's just our store of features that are generic."

**What this means:**

- Features library has two tiers:
  1. **Basic (free / included):** Bollinger Bands, EMA, RSI, standard technical indicators — parameterisable in the UI
  2. **Advanced (subscription):** ODUM proprietary features, ML-derived signals — locked behind entitlement
- All features (basic and advanced) must be:
  - Pre-computed historically
  - Also computed live (streaming)
  - Available for plotting on the Strategy tab
- ODUM internally uses different permutations of these features for ML models, but the vanilla versions are what's exposed to clients

**UI implications (Strategy tab in Research):**

- Feature library browser with search/filter
- Per-feature parameterisation controls
- Lock icon on advanced features for non-subscribed users
- Overlay features on strategy equity curves / charts

---

## 5. Correlation Analysis (Strategy Tab)

**From meeting:**

> "Correlation between signals, correlation between strategies, and correlation between strategies and a chosen underlying. Your chosen underlying could be any of our instruments but maybe to start with just Bitcoin, S&P, and gold — benchmark asset classes — so we can look at correlation of our P&L between strategies and each other and the strategies in the underlying."

> "Strategies in each other would be our way of saying are we building a diversified portfolio, and strategies versus the benchmark would be our way of saying are we achieving alpha over the benchmark visually."

**What this means:**

Three correlation views needed on the Strategy research tab:

1. **Signal-to-signal correlation** — are our signals redundant?
2. **Strategy-to-strategy correlation** — are we diversified? (portfolio construction angle)
3. **Strategy-to-benchmark correlation** — are we generating alpha? (performance angle)

**Benchmark underlyings (to start):** Bitcoin, S&P 500, Gold — can expand to any instrument later.

**Visualisations:**

- Correlation matrix heatmap (strategy × strategy)
- Rolling correlation chart (strategy vs benchmark over time)
- Diversification score (portfolio-level metric)

---

## 6. Execution Decision — Not a Standalone Service (For Now)

**From meeting:**

> "What do we split into the execution build or what do we put execution as a service? Or we drop the concept of execution as a service."

**Decision (confirmed 2026-03-26):**

- Execution is **NOT a standalone service** for now
- Instead, execution is integrated into Trading — clients choose basic or advanced algos
- **Basic algos (included):** Limit orders, Market orders, TWAP, VWAP — switchable via config
- **Advanced algos (premium):** ODUM's algo garden — clients promote different algos to production
- May revisit as a standalone service later once the offering is clearer

**UI impact:**

- `/services/execution/` route group may be consolidated into Trading or kept as an internal-only view
- Client-facing execution controls live within the Trading terminal
- Algo selection is config-driven, not a separate service subscription

---

## 7. Research Overview Tabs — Missing

**From meeting (confirmed 2026-03-26):**

- `/services/research/strategies` and `/services/research/execution` are missing overview/summary tabs
- Need high-level overview pages that give a quick summary before diving into details

---

## Resolved Decisions (2026-03-26)

- **Correlation analysis** → Strategy sub-tab (not a standalone Research tab)
- **Implementation priority** → Decompose oversized pages first, then Grid Search (Item 1) as highest priority new feature
- **Features Finder layout** → Extract as a generic `<FinderBrowser>` component, reuse across features catalogue + all Data Pipeline pages (instruments, raw, processing). See `generic-finder-browser-decisions.md`
- **Data page column hierarchies** → Driven by `deployment-service/configs/sharding_config.yaml` (SSOT). Each page defines its own columns based on its service's sharding dimensions
- **Detail panel** → Collapsible (open by default), generic renderer per page

## Open Questions

- What specific features go in basic vs advanced tier? (needs product decision)
- How many backtests is the compute estimator expected to handle? (scaling concern)
