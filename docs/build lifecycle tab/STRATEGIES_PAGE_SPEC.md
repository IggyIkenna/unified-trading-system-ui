# Strategies Tab — Page Specification

> **Route:** `/services/research/strategies`
> **Tab position:** Tab 4 of 7 in the Build lifecycle (`Overview | Features | Feature ETL | Models | **Strategies** | Execution | Quant Workspace`)
> **Status:** v3 — Strategies tab implemented. Accordion layout, shared components built, TradingView-inspired detail view live.
> **Companion docs:** `BUILD_SECTION_SPEC.md §4`, `ML_MODELS_TAB_SPEC.md`, `EXECUTION_TAB_SPEC.md`, `MOCK_DATA_TRACKING.md`, `TRADINGVIEW_AUDIT.md`, `EXECUTION_AGENT_HANDOFF.md`

---

## 1. Vision

### What This Tab Is

The Strategies tab is the **signal laboratory**. The researcher takes trained models
(from Models tab) and tests them on real market data to answer one question:

> "Does this model generate good trading signals?"

A strategy backtest takes a model, applies it to instruments over a date range, and
produces a **signal list** — entries, exits, sizes, and confidence scores. The backtest
assumes fills happen with minimal slippage (ideal execution). The researcher evaluates
signal quality: hit rate, signal frequency, regime behavior, risk-adjusted returns.

The signal list then flows into the Execution tab, which answers the _separate_ question:
"How well can we actually _execute_ these signals with real-world slippage, market impact,
and venue-specific dynamics?"

This two-phase split is deliberate. Separating signal quality from execution quality
lets the researcher isolate whether a bad result comes from a bad model or bad execution.
It also lets you compare multiple execution algos on the same signals — a comparison
that is impossible if signal generation and execution are coupled.

### What This Tab Is NOT

- **NOT about model training or feature selection** → that's the Models tab
- **NOT about execution simulation** → that's the Execution tab
- **NOT about live monitoring** → that's the Observe lifecycle tab
- **NOT about deployment/promotion** → that's the Promote lifecycle tab

### Pipeline Position

```
Processed Data (Acquire) → Features (define) → Feature ETL (compute) → Models (train) → [STRATEGIES (signals)] → Execution (trades) → Candidate → Promote
```

### Two Backtest Modes

The tab supports two modes of backtesting:

| Mode                  | Description                                                                                                                   | Use Case                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Single-Instrument** | One model, one instrument per backtest. Run 10 backtests for 10 instruments.                                                  | Directional strategies, single-asset alpha research       |
| **Portfolio**         | One model (or ensemble), multiple instruments in a single backtest. Cross-asset position limits, portfolio-level aggregation. | Multi-asset momentum, stat arb, cross-exchange strategies |

The mode is selected when configuring a new backtest. Portfolio mode is the more complex
workflow and may be deferred to Phase 5.

### Two Strategy Types

The tab supports both ML-based AND rule-based strategies:

| Type           | Description                                                                  | Example                                                 |
| -------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| **ML-Based**   | Takes a trained model from Registry, applies signal threshold + sizing rules | BTC Directional v5 (XGBoost, 73% confidence → LONG)     |
| **Rule-Based** | Applies indicator-based rules without an ML model                            | Golden Cross (EMA 50 > EMA 200 → LONG, reverse → SHORT) |

Both produce the same output: a signal list. Both can be compared head-to-head.
The researcher can overlay ML signals and rule-based signals on the same chart
to see where they agree and disagree — that's where the real insight is.

### Design Philosophy

**We are not building a retail strategy tester.** We are building the signal research
cockpit for an asset management firm with millions under AUM across CeFi, DeFi, TradFi,
Sports, and Prediction Markets.

When a PM from Citadel sees this UI, they should see:

1. **Institutional signal evaluation** — not just P&L, but signal frequency, hit rate by
   regime (trending/ranging/crisis), confidence distribution, and statistical significance
   of outperformance vs baseline
2. **Multi-strategy comparison on price charts** — overlay 3 strategies' signals on BTC-USDT,
   see where they agree, where they diverge, and which catches the move first
3. **Full lineage** — every backtest records which model version, which feature versions,
   which parameters. Reproducibility is not optional when you manage real capital.
4. **Signal → Execution handoff** — one click sends the signal list to the Execution tab.
   The researcher sees how their signals survive real-world fills.
5. **Multi-shard awareness** — CeFi basis trades, DeFi yield optimization, TradFi momentum,
   sports halftime predictions, prediction market calibration — each shard has different
   signal semantics, and the UI adapts metrics accordingly

**Inspiration sources (adapted for our domain):**

| Platform                        | What We Take                                                                                                               | What We Skip                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **TradingView Strategy Tester** | 4-tab results (Overview, Performance, Trades, Config), equity curve with buy/sell markers, performance split by Long/Short | Retail simplicity — we need institutional depth       |
| **QuantConnect**                | Backtest statistics panel, multi-asset portfolio support, drawdown plots, trade-level details with run-up/drawdown         | Consumer quant focus — we need firm-grade lineage     |
| **Bloomberg PORT**              | Risk attribution, factor decomposition, regime analysis, portfolio-level analytics                                         | Pricing/licensing — we build our own                  |
| **Weights & Biases**            | Sortable run table, metric comparison, queryable columns, experiment workspace                                             | Generic ML — we add financial signal metrics natively |
| **Star Lizard** (sports quant)  | Cross-league global model approach, calibrated probability evaluation, CLV as core metric                                  | Proprietary — we replicate the evaluation methodology |

---

## 2. Target Architecture — 2 Views

### Route Structure

```
/services/research/strategies              ← Main page: backtest list + comparison
/services/research/strategies (detail)     ← Inline detail panel (right side) when a backtest is selected
```

**Single page, two-panel layout.** Left panel: backtest list. Right panel: detail view
of the selected backtest (or comparison view when 2+ are selected). This is the same
pattern as the Execution tab — consistent UX across the pipeline.

No sub-routes needed. The detail view is inline, not a separate page. This keeps the
comparison workflow fast — you can select backtests from the list while viewing results.

### What Goes Where

| Current Page           | Decision               | Rationale                                       |
| ---------------------- | ---------------------- | ----------------------------------------------- |
| `strategies/page.tsx`  | **KEEP → Main page**   | Redesign with two-panel layout                  |
| `strategy/backtests/`  | **MERGE into main**    | Redundant — the main page IS the backtests list |
| `strategy/results/`    | **MERGE into main**    | Results shown inline in right panel             |
| `strategy/compare/`    | **MERGE into main**    | Comparison is inline (ComparePanel + chart)     |
| `strategy/candidates/` | **KEEP**               | Candidate tracking page (Phase 5)               |
| `strategy/handoff/`    | **MOVE → Promote tab** | Promotion handoff is not a Build concern        |
| `strategy/heatmap/`    | **MERGE into main**    | Heatmap can be a view mode in the main page     |
| `strategy/overview/`   | **MERGE into main**    | Overview stats are the top section of main page |

---

## 3. Page Layout — Detailed Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ STRATEGY BACKTESTS                      [+ New Backtest]  [🔍 Compare Mode] │
│ Signal generation research. Test models and rules against historical data.  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ KPI ROW ─────────────────────────────────────────────────────────────┐  │
│  │  Total Backtests │ Complete     │ Running  │ Candidates │ Best Sharpe  │  │
│  │  ┌────────┐      │ ┌────────┐  │ ┌──────┐ │ ┌────────┐ │ ┌────────┐  │  │
│  │  │  24    │      │ │  18    │  │ │  2   │ │ │   5    │ │ │ 2.41   │  │  │
│  │  │backtests│     │ │        │  │ │      │ │ │ ⭐     │ │ │        │  │  │
│  │  └────────┘      │ └────────┘  │ └──────┘ │ └────────┘ │ └────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ FILTERS ─────────────────────────────────────────────────────────────┐  │
│  │  [Search...] [Archetype ▾] [Shard ▾] [Status ▾] [Type ▾ ML|Rule|All] │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─── LEFT PANEL: BACKTEST LIST ───┐  ┌─── RIGHT PANEL: DETAIL / COMPARE ─┐│
│  │                                  │  │                                    ││
│  │  ☐ Name           │Shard│Status │  │  (nothing selected)                ││
│  │  ──────────────────┼─────┼──────│  │                                    ││
│  │  ☐ BTC Mom v4     │CeFi │✅ Done│  │  Select a backtest from the list   ││
│  │    XGBoost v5 · BTC-PERP        │  │  to view detailed results.         ││
│  │    Sharpe 2.41 · 130 signals    │  │                                    ││
│  │  ──────────────────────────────  │  │  Or select 2-3 backtests to        ││
│  │  ☐ ETH Basis v2  │CeFi │✅ Done│  │  compare them side-by-side.        ││
│  │    GBT v3 · ETH-PERP            │  │                                    ││
│  │    Sharpe 1.89 · 95 signals     │  │                                    ││
│  │  ──────────────────────────────  │  │                                    ││
│  │  ☐ NFL HT ML     │Sport│🔵 Run │  │                                    ││
│  │    RF v2 · NFL-MATCH             │  │                                    ││
│  │    In progress: 67%              │  │                                    ││
│  │  ──────────────────────────────  │  │                                    ││
│  │  ☐ Golden Cross   │CeFi │✅ Done│  │                                    ││
│  │    Rule-based · BTC-PERP         │  │                                    ││
│  │    Sharpe 0.92 · 42 signals     │  │                                    ││
│  │  ──────────────────────────────  │  │                                    ││
│  │  ☐ DeFi Health v1 │DeFi │✅ Done│  │                                    ││
│  │    GBT v4 · AAVE-ETH            │  │                                    ││
│  │    Sharpe 1.34 · 78 signals     │  │                                    ││
│  │                                  │  │                                    ││
│  │  [Load More]                     │  │                                    ││
│  └──────────────────────────────────┘  └────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### When a Single Backtest is Selected → Detail Panel

```
┌─── RIGHT PANEL: BACKTEST DETAIL ────────────────────────────────────────────┐
│ BTC Momentum v4                                          [⭐ Candidate] [↗]│
│ XGBoost v5 · BTC-PERP · 2026-01-01 → 2026-03-23 · 130 signals             │
│                                                                              │
│ ┌─ TABS ─────────────────────────────────────────────────────────────────┐  │
│ │ [Overview] [Signals] [Performance] [Config]                            │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ ── OVERVIEW TAB ──                                                           │
│                                                                              │
│  ┌─ EQUITY CURVE ────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  P&L ▲                                    ▲ = buy signal               │  │
│  │  $3K  │              /\    /\  ▲           ▼ = sell signal              │  │
│  │  $2K  │         ▲  /  \  /  \/  ▼                                     │  │
│  │  $1K  │   ▲   / \/    \/        \                                     │  │
│  │  $0   │──/──\/                    \__  ▲                               │  │
│  │ -$500 │ ▼                             \/                               │  │
│  │       └─────────────────────────────────────────▶ Date                 │  │
│  │       Jan    Feb    Mar                                                │  │
│  │                                                                        │  │
│  │  ── vs Buy & Hold (dashed) ──                                          │  │
│  │  Strategy: +$2,340 (+23.4%)    Buy & Hold: +$1,890 (+18.9%)           │  │
│  │  Alpha: +4.5%                  Excess Sharpe: +0.62                    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ SIGNAL QUALITY METRICS (what matters for signal evaluation) ──────────┐ │
│  │                                                                         │ │
│  │  RETURNS              │ SIGNAL QUALITY         │ RISK                   │ │
│  │  Total Return  +23.4% │ Hit Rate      62.3%    │ Max Drawdown   -8.3%  │ │
│  │  Sharpe         2.41  │ Avg Confidence 0.72    │ Calmar Ratio    2.82  │ │
│  │  Sortino        3.15  │ Signals/Day    1.6     │ Max Consec Loss    4  │ │
│  │  Profit Factor  1.85  │ Avg Hold Time  6.2h    │ Tail Ratio      1.24  │ │
│  │                       │                        │                       │ │
│  │  REGIME PERFORMANCE (how signals perform across market conditions)     │ │
│  │  Trending: Sharpe 3.21 ✅  │  Ranging: 0.85 ⚠  │  Crisis: -0.42 ❌  │ │
│  │  → Model is strong in trends, weak in ranges. Flag for risk review.   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  [→ Send Signals to Execution Tab]    [⭐ Mark as Candidate]                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Signals Tab (within detail panel)

```
┌─── SIGNALS TAB ─────────────────────────────────────────────────────────────┐
│                                                                              │
│  Filter: [All ▾] [LONG only ▾] [HIGH confidence ▾]    Export: [CSV] [JSON] │
│                                                                              │
│  #  │ Timestamp          │ Direction │ Instrument│ Size    │ Conf  │Outcome │
│  ───┼────────────────────┼───────────┼───────────┼─────────┼───────┼────────│
│  1  │ 2026-01-02 08:00   │ LONG  ▲   │ BTC-PERP  │ $10,000 │ 0.78  │ ✅ Win │
│  2  │ 2026-01-02 14:00   │ CLOSE ■   │ BTC-PERP  │ —       │ 0.42  │ —      │
│  3  │ 2026-01-03 02:00   │ SHORT ▼   │ BTC-PERP  │ $10,000 │ 0.71  │ ❌ Loss│
│  4  │ 2026-01-03 18:00   │ CLOSE ■   │ BTC-PERP  │ —       │ 0.38  │ —      │
│  5  │ 2026-01-05 10:00   │ LONG  ▲   │ BTC-PERP  │ $10,000 │ 0.83  │ ✅ Win │
│  ...                                                                        │
│                                                                              │
│  Showing 130 signals · 81 wins · 49 losses                                  │
│                                                                              │
│  CONFIDENCE DISTRIBUTION:                                                    │
│  0.50-0.60: ████████████ 28 signals (21%)                                   │
│  0.60-0.70: ████████████████ 38 signals (29%)                               │
│  0.70-0.80: ██████████████████████ 45 signals (35%)                         │
│  0.80-0.90: ████████ 15 signals (12%)                                       │
│  0.90-1.00: ██ 4 signals (3%)                                               │
│                                                                              │
│  → Signals with confidence > 0.75 have 78% hit rate (vs 62% overall)       │
│  → Consider raising threshold from 0.65 to 0.75 for higher conviction      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Performance Tab (within detail panel)

```
┌─── PERFORMANCE TAB ─────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─ PERFORMANCE BY DIRECTION (TradingView-style) ─────────────────────────┐│
│  │  Metric              │ All Signals │ Long Only  │ Short Only            ││
│  │  ────────────────────┼─────────────┼────────────┼───────────────────────││
│  │  Net Profit           │ $2,340      │ $1,680     │ $660                 ││
│  │  Gross Profit         │ $4,120      │ $2,950     │ $1,170               ││
│  │  Gross Loss           │ -$1,780     │ -$1,270    │ -$510                ││
│  │  Total Trades         │ 65          │ 38         │ 27                   ││
│  │  Winning Trades       │ 41 (63.1%)  │ 25 (65.8%) │ 16 (59.3%)          ││
│  │  Losing Trades        │ 24 (36.9%)  │ 13 (34.2%) │ 11 (40.7%)          ││
│  │  Largest Win          │ $420        │ $420       │ $310                 ││
│  │  Largest Loss         │ -$380       │ -$380      │ -$210                ││
│  │  Avg Win              │ $100.49     │ $118.00    │ $73.13               ││
│  │  Avg Loss             │ -$74.17     │ -$97.69    │ -$46.36              ││
│  │  Avg Bars in Trade    │ 6.2         │ 7.1        │ 4.8                  ││
│  │  Profit Factor        │ 2.31        │ 2.32       │ 2.29                 ││
│  │  Sharpe Ratio         │ 2.41        │ 2.68       │ 1.82                 ││
│  │  Sortino Ratio        │ 3.15        │ 3.42       │ 2.31                 ││
│  │  Max Drawdown         │ -8.3%       │ -6.1%      │ -5.2%               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─ DRAWDOWN CHART ───────────────────────────────────────────────────────┐ │
│  │  0%   │─────────────────────────────────                               │ │
│  │  -2%  │      \    /\      /                                            │ │
│  │  -5%  │       \  /  \    /                                             │ │
│  │  -8%  │        \/    \  /                                              │ │
│  │ -10%  │              \/                                                │ │
│  │       └──────────────────────────────────▶ Date                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ MONTHLY RETURNS HEATMAP ──────────────────────────────────────────────┐ │
│  │       Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov  │ │
│  │ 2026  +3.2  +5.1  -1.4                                                │ │
│  │       (green)(green)(red)                                              │ │
│  │ → Q1 performance: +7.0% (strong start)                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### When 2-3 Backtests Are Selected → Compare View

```
┌─── RIGHT PANEL: COMPARE VIEW ──────────────────────────────────────────────┐
│ Comparing 3 Backtests                                        [Clear All]    │
│                                                                              │
│  ┌─ SIGNAL OVERLAY ON PRICE CHART ────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  Price ▲                                                                │ │
│  │  $45K  │          /\                                                    │ │
│  │  $44K  │     ____/  \    /\                                             │ │
│  │  $43K  │    /        \__/  \___                                         │ │
│  │  $42K  │___/                                                            │ │
│  │        └────────────────────────────────────▶ Date                      │ │
│  │                                                                         │ │
│  │  🔵 BTC Momentum v4 (ML):   ▲ = buy, ▼ = sell                          │ │
│  │  🟢 Mean Reversion v2 (ML): ▲ = buy, ▼ = sell                          │ │
│  │  🟠 Golden Cross (Rule):    ▲ = buy, ▼ = sell                           │ │
│  │                                                                         │ │
│  │  Note: Where signals AGREE = highest conviction zones                   │ │
│  │  Jan 15: All 3 strategies signaled LONG → strong confluence             │ │
│  │  Feb 22: ML strategies LONG, Rule strategy SHORT → divergence           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ OVERLAID EQUITY CURVES ───────────────────────────────────────────────┐ │
│  │  (three equity curves on same chart, different colors)                  │ │
│  │  🔵 BTC Mom v4: +23.4% │ 🟢 Mean Rev v2: +18.1% │ 🟠 GC: +8.2%      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ SIGNAL QUALITY COMPARISON ─────────────────────────────────────────────┐ │
│  │  Metric          │ 🔵 Mom v4   │ 🟢 MR v2    │ 🟠 Golden Cross        │ │
│  │  ────────────────┼─────────────┼─────────────┼────────────────────────│ │
│  │  Type            │ ML (XGB v5) │ ML (GBT v3) │ Rule-based             │ │
│  │  Sharpe          │ 2.41 ★      │ 1.89        │ 0.92                   │ │
│  │  Sortino         │ 3.15 ★      │ 2.31        │ 1.14                   │ │
│  │  Total Return    │ +23.4% ★    │ +18.1%      │ +8.2%                  │ │
│  │  Max Drawdown    │ -8.3%       │ -6.1% ★     │ -12.4%                 │ │
│  │  Hit Rate        │ 62.3%       │ 58.1%       │ 71.4% ★               │ │
│  │  Signals/Day     │ 1.6         │ 1.2         │ 0.5                    │ │
│  │  Avg Confidence  │ 0.72        │ 0.68        │ N/A (rule)             │ │
│  │  Profit Factor   │ 2.31 ★      │ 1.95        │ 1.42                   │ │
│  │  Signal Count    │ 130         │ 95          │ 42                     │ │
│  │  ────────────────┼─────────────┼─────────────┼────────────────────────│ │
│  │  SIGNAL OVERLAP (% of signals that agree with another strategy)       │ │
│  │  🔵 vs 🟢: 34%   │ 🔵 vs 🟠: 12% │ 🟢 vs 🟠: 8%                     │ │
│  │                                                                         │ │
│  │  ★ = best in category                                                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  [→ Send Best to Execution Tab]  [→ Send All to Execution Tab]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### New Backtest Configuration Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│ NEW STRATEGY BACKTEST                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── STRATEGY TYPE ──                                             │
│  Type: [ML-Based ▾] / [Rule-Based ▾]                            │
│                                                                  │
│  ── ML: MODEL SELECTION ── (shown if ML-Based)                   │
│  Model Family:  [BTC Directional ▾]  (from Model Registry)      │
│  Model Version: [v5.0 ▾]            (latest = default)           │
│  Strategy Archetype: [Momentum ▾]                                │
│                                                                  │
│  ── RULE: INDICATOR RULES ── (shown if Rule-Based)               │
│  Rule Name:     [Golden Cross]                                   │
│  Entry Rule:    [EMA(50) crosses above EMA(200) → LONG]         │
│  Exit Rule:     [EMA(50) crosses below EMA(200) → EXIT]         │
│  Features Used: [ema_50 v2.1, ema_200 v1.0]                     │
│                                                                  │
│  ── SIGNAL RULES ──                                              │
│  Signal Threshold: [0.65]  ← model confidence required           │
│  Signal Type:      [Long/Short/Neutral ▾]                        │
│  Position Sizing:  [Fixed $ ▾]  Amount: [$10,000]               │
│  Max Concurrent:   [3 positions]                                  │
│                                                                  │
│  ── BACKTEST MODE ──                                             │
│  Mode: (•) Single-Instrument  ( ) Portfolio                      │
│                                                                  │
│  ── INSTRUMENTS ──                                               │
│  Instrument:    [BTC-PERP ▾]  (single mode: one)                │
│  — or for portfolio mode: —                                      │
│  Instruments:   [BTC-PERP] [ETH-PERP] [SOL-PERP] [+ Add]       │
│  Portfolio Limit: [$50,000 total across all positions]           │
│                                                                  │
│  ── TIME RANGE ──                                                │
│  Start:  [2026-01-01]                                            │
│  End:    [2026-03-23]                                            │
│  Warmup: [20 bars]                                               │
│                                                                  │
│  ── RISK CONSTRAINTS ──                                          │
│  Max Position Size: [$50,000]                                    │
│  Max Drawdown Stop: [15%]                                        │
│  Max Daily Loss:    [$5,000]                                     │
│                                                                  │
│         [Run Backtest]     [Save as Template]                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Current Implementation Inventory

### 4.1 Main Page (`strategies/page.tsx` — REWRITTEN)

The page was fully rewritten to a two-panel layout with TradingView-inspired accordion detail view.

| Component                        | Status   | Notes                                                     |
| -------------------------------- | -------- | --------------------------------------------------------- |
| Two-panel layout (list + detail) | ✅ Built | Left panel: card list. Right panel: detail/compare        |
| KPI bar (pinned 5 metrics)       | ✅ Built | Uses shared `KpiBar` component                            |
| Equity chart (4 layers)          | ✅ Built | Uses shared `EquityChartWithLayers` (Lightweight Charts)  |
| Performance accordion            | ✅ Built | Uses shared `PerformanceSection`                          |
| Signals Analysis accordion       | ✅ Built | Uses shared `TradesAnalysisSection` (signals terminology) |
| Capital Efficiency accordion     | ✅ Built | Uses shared `CapitalEfficiencySection`                    |
| Run-ups & Drawdowns accordion    | ✅ Built | Uses shared `RunupsDrawdownsSection`                      |
| Configuration accordion          | ✅ Built | Model, params, instruments, date range                    |
| Signal list view                 | ✅ Built | MFE/MAE, cumulative P&L, regime columns                   |
| Compare view                     | ✅ Built | Overlaid equity curves + delta metrics                    |
| Card-style backtest listing      | ✅ Built | Status, Sharpe, P&L, candidate badge, model info          |

### 4.2 Legacy Strategy Sub-Pages (to merge/delete)

| Page                   | Lines | Decision                                            |
| ---------------------- | ----- | --------------------------------------------------- |
| `strategy/backtests/`  | 858   | **MERGE** — absorb useful components into main page |
| `strategy/results/`    | 746   | **MERGE** — becomes right-panel detail view         |
| `strategy/compare/`    | 711   | **MERGE** — becomes compare view in right panel     |
| `strategy/candidates/` | 636   | **KEEP** — separate candidate management page       |
| `strategy/handoff/`    | ?     | **MOVE** — to Promote lifecycle tab                 |
| `strategy/overview/`   | ?     | **MERGE** — stats become KPI row                    |
| `strategy/heatmap/`    | ?     | **MERGE** — optional view in main page              |

### 4.3 Types

| File                              | Status      | What                                                                   |
| --------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `lib/strategy-platform-types.ts`  | ✅ Extended | Added `StrategySignal`, `SignalQualityMetrics`, `SignalOverlapMetrics` |
| `lib/backtest-analytics-types.ts` | ✅ New      | 13 shared analytics interfaces (used by both Strategies and Execution) |

Key types: `StrategyTemplate`, `StrategyConfig`, `BacktestRun`, `BacktestMetrics`,
`StrategyCandidate`, `StrategyAlert`, `StrategySignal`, `SignalQualityMetrics`,
`BacktestAnalytics`, `DirectionPerformance`, `EquityPoint`, `TradeMarker`, etc.

### 4.4 Mock Data

| File                                 | Status      | What                                                                                                                                        |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/strategy-platform-mock-data.ts` | ✅ Extended | Integrated analytics + signal generators, `BACKTEST_ANALYTICS` / `BACKTEST_SIGNALS` / `BACKTEST_SIGNAL_QUALITY` maps                        |
| `lib/backtest-analytics-mock.ts`     | ✅ New      | Seeded mock generators for equity curves, trade markers, P&L distribution, direction performance, capital efficiency, run-up/drawdown stats |

### 4.5 Hooks (`hooks/api/use-strategies.ts` — 341 lines)

14 hooks total. Key ones: `useStrategyBacktests`, `useStrategyTemplates`,
`useCreateBacktest`, `useBacktestDetail`, `useStrategyCandidates`.

---

## 5. Gap Analysis

### 5A. Page Structure

| Requirement                              | Current        | Gap                                             |
| ---------------------------------------- | -------------- | ----------------------------------------------- |
| Two-panel layout (list + detail)         | ✅ Implemented | —                                               |
| KPI bar (5 pinned metrics)               | ✅ Implemented | —                                               |
| Card-style backtest list                 | ✅ Implemented | —                                               |
| Compare view with overlaid equity curves | ✅ Implemented | —                                               |
| Filters: shard, type (ML/Rule)           | ❌ Not yet     | **Missing** — need shard + type filters on list |
| Sort by any column                       | ❌ Not yet     | **Missing**                                     |

### 5B. Backtest Configuration

| Requirement                               | Current                 | Gap         |
| ----------------------------------------- | ----------------------- | ----------- |
| Model + version selection (from Registry) | ❌ Template select only | **Missing** |
| Rule-based strategy definition            | ❌ Not supported        | **Missing** |
| Signal rules (threshold, type, sizing)    | ❌ Not in dialog        | **Missing** |
| Risk constraints                          | ❌ Not in dialog        | **Missing** |
| Warmup bars, max concurrent               | ❌ Not in dialog        | **Missing** |
| Portfolio mode toggle                     | ❌ Not in dialog        | **Missing** |
| Save as template                          | ❌ Not in dialog        | **Missing** |

### 5C. Detail View (right panel)

| Requirement                                                                          | Current                          | Gap          |
| ------------------------------------------------------------------------------------ | -------------------------------- | ------------ |
| KPI bar with 5 pinned metrics                                                        | ✅ Implemented                   | —            |
| Equity chart with 4 toggleable layers (Lightweight Charts)                           | ✅ Implemented                   | —            |
| Performance accordion: profit structure + All/Long/Short + benchmark + risk-adjusted | ✅ Implemented                   | —            |
| Signals Analysis accordion: P&L histogram + win/loss donut + details table           | ✅ Implemented                   | —            |
| Capital Efficiency accordion: CAGR, return on capital, account size                  | ✅ Implemented                   | —            |
| Run-ups & Drawdowns accordion: run-up + drawdown stats with duration                 | ✅ Implemented                   | —            |
| Configuration accordion: model version, params, instruments, date range              | ✅ Implemented                   | —            |
| Signal list view (Metrics/Signals toggle)                                            | ✅ Implemented                   | —            |
| Buy & Hold comparison on equity curve                                                | ✅ Toggleable layer              | —            |
| Regime performance breakdown                                                         | ❌ Type exists, visual not built | **Deferred** |
| Monthly returns heatmap                                                              | ❌ Not implemented               | **Deferred** |
| Confidence distribution histogram                                                    | ❌ Not implemented               | **Deferred** |

### 5D. Compare View

| Requirement                               | Current                             | Gap                        |
| ----------------------------------------- | ----------------------------------- | -------------------------- |
| Signal overlay on price chart             | ❌ Not implemented                  | **Missing**                |
| Overlaid equity curves                    | ❌ Not implemented                  | **Missing**                |
| Signal quality comparison table           | ✅ Partial (financial metrics only) | Extend with signal metrics |
| Signal overlap %                          | ❌ Not implemented                  | **Missing**                |
| "Send to Execution Tab"                   | ❌ Not implemented                  | **Missing**                |
| Confluence callouts (where signals agree) | ❌ Not implemented                  | **Missing**                |

### 5E. Candidate Flow

| Requirement                   | Current                | Gap         |
| ----------------------------- | ---------------------- | ----------- |
| "Mark as Candidate" button    | ❌ Not implemented     | **Missing** |
| Candidate badge on list items | ❌ Count in stats only | **Missing** |
| Full lineage capture          | ❌ Not implemented     | **Missing** |

---

## 6. What Works Well (Keep)

- **KPI stats row** — clean, informative. Extend with 5th stat.
- **StatusBadge + MetricValue** — good utility components.
- **Compare checkbox pattern** — up to 3. Good UX.
- **ComparePanel metric table** — extend, don't replace.
- **Loading skeleton + empty state** — proper patterns.
- **Strategy templates** — rich mock data with linked models, venues, instruments.
- **Strategy configs** — versioned configs per template with risk limits.

---

## 7. New Types Needed

### `StrategySignal`

```typescript
interface StrategySignal {
  id: string;
  timestamp: string;
  direction: "LONG" | "SHORT" | "CLOSE" | "NEUTRAL";
  instrument: string;
  size_usd: number;
  confidence: number;
  model_prediction: number;
  outcome: "win" | "loss" | "open" | null;
  pnl_usd: number | null;
  hold_duration_hours: number | null;
  regime_at_signal: "trending" | "ranging" | "volatile" | "crisis" | null;
}
```

### `SignalQualityMetrics`

```typescript
interface SignalQualityMetrics {
  total_signals: number;
  signals_per_day: number;
  hit_rate: number;
  avg_confidence: number;
  confidence_distribution: { bucket: string; count: number; pct: number }[];
  high_confidence_hit_rate: number; // hit rate for confidence > 0.75
  avg_hold_duration_hours: number;
  max_consecutive_losses: number;
  regime_sharpe: Record<string, number>; // { "trending": 3.21, "ranging": 0.85, ... }
}
```

### `BacktestRunExtended` (extends current BacktestRun)

```typescript
interface BacktestRunExtended extends BacktestRun {
  modelId: string;
  modelVersion: string;
  modelFamily: string;
  strategyType: "ml" | "rule";
  shard: "CeFi" | "DeFi" | "TradFi" | "Sports" | "Prediction";
  instruments: string[];
  dateRange: { start: string; end: string };
  backtestMode: "single" | "portfolio";
  signalCount: number;
  isCandidate: boolean;
  candidateAt: string | null;
  featureVersions: { featureId: string; version: string }[];
  signalConfig: {
    threshold: number;
    signalType: string;
    sizingMode: string;
    sizingValue: number;
    maxConcurrent: number;
  };
  riskConfig: {
    maxPosition: number;
    maxDrawdownStop: number;
    maxDailyLoss: number;
  };
  signals: StrategySignal[];
  signalQuality: SignalQualityMetrics;
  equityCurve: { date: string; value: number; buyHold: number }[];
  drawdownCurve: { date: string; drawdown: number }[];
  monthlyReturns: { month: string; return_pct: number }[];
  performanceByDirection: {
    all: DirectionPerformance;
    long: DirectionPerformance;
    short: DirectionPerformance;
  };
}

interface DirectionPerformance {
  net_profit: number;
  gross_profit: number;
  gross_loss: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  largest_win: number;
  largest_loss: number;
  avg_win: number;
  avg_loss: number;
  avg_bars_in_trade: number;
  profit_factor: number;
  sharpe: number;
  sortino: number;
  max_drawdown: number;
}
```

### `SignalOverlapMetrics` (for compare view)

```typescript
interface SignalOverlapMetrics {
  backtest_a_id: string;
  backtest_b_id: string;
  overlap_pct: number; // % of signals that agree in direction within N bars
  confluence_zones: { start: string; end: string; direction: string }[];
  divergence_zones: {
    start: string;
    end: string;
    a_direction: string;
    b_direction: string;
  }[];
}
```

---

## 8. Components

### 8A. Shared Components — BUILT (in `components/research/`)

| Component                        | Purpose                                                               | Status   |
| -------------------------------- | --------------------------------------------------------------------- | -------- |
| `kpi-bar.tsx`                    | Sticky 5-metric KPI bar at top of detail panel                        | ✅ Built |
| `equity-chart-with-layers.tsx`   | 4-layer toggleable equity chart (Lightweight Charts)                  | ✅ Built |
| `performance-section.tsx`        | Profit structure + All/Long/Short returns + benchmark + risk-adjusted | ✅ Built |
| `trades-analysis-section.tsx`    | P&L histogram + win/loss donut + details table (All/Long/Short)       | ✅ Built |
| `capital-efficiency-section.tsx` | CAGR, return on capital, account size, optional margin                | ✅ Built |
| `runups-drawdowns-section.tsx`   | Run-up + drawdown stats with duration                                 | ✅ Built |
| `profit-structure-chart.tsx`     | Bar chart: gross profit / loss / commission / net                     | ✅ Built |
| `pnl-distribution-histogram.tsx` | Per-signal/trade P&L histogram with avg lines (Recharts)              | ✅ Built |
| `win-loss-donut.tsx`             | Donut chart: wins / losses / break-even (Recharts)                    | ✅ Built |
| `index.ts`                       | Barrel export for all shared components                               | ✅ Built |

### 8B. Components Still Needed (optional extractions)

These behaviours **exist inline** on `strategies/page.tsx` or as built components; remaining work is optional file splits for reuse.

| Component                         | Purpose                                                          | Status                                                   |
| --------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| `signal-overlay-chart.tsx`        | Price + multi-strategy markers (Lightweight Charts candlesticks) | ✅ Built                                                 |
| `overlaid-equity-curves.tsx`      | Compare equity curves                                            | ✅ Built                                                 |
| `signal-overlap-panel.tsx`        | Pairwise overlap + zones                                         | ✅ Built                                                 |
| `regime-performance-mini.tsx`     | Regime Sharpe row                                                | ✅ Built                                                 |
| `monthly-returns-heatmap.tsx`     | Monthly returns grid                                             | ✅ Built                                                 |
| `signal-confidence-histogram.tsx` | Confidence buckets                                               | ✅ Built                                                 |
| `strategy-config-form.tsx`        | Extracted full-screen form                                       | ⏳ Optional — `NewBacktestDialog` in page covers P2 stub |
| `model-version-picker.tsx`        | Standalone registry picker                                       | ⏳ Optional — inline `Select` in dialog covers mock flow |

---

## 9. Implementation Plan — Phased

### Phase 1: Structural Foundation (Quick Wins)

- [x] **P1-1.** Two-panel layout: split page into left list + right detail area ✅
- [x] **P1-2.** Add shard filter, type filter (ML/Rule/All), KPI row stats ✅
- [x] **P1-3.** Add candidate badge (⭐) to list items — `isCandidate` data already exists ✅
- [x] **P1-4.** Add model version + date range info to list items ✅
- [x] **P1-5.** ComparePanel signal-quality rows (signals/day, hit rate, avg confidence) ✅

### Phase 2: Configuration Form

- [x] **P2-1.** Stub satisfied by `NewBacktestDialog` (full parameter surface in-page) — optional extract to `strategy-config-form.tsx`
- [x] **P2-2.** Model version `Select` + template-linked models in dialog — optional extract to `model-version-picker.tsx`
- [x] **P2-3.** Signal rules (threshold, warmup, max concurrent) ✅
- [x] **P2-4.** Risk constraints (max position %, max DD stop) ✅
- [x] **P2-5.** Portfolio mode toggle ✅
- [x] **P2-6.** “Save as template” checkbox + demo toast ✅

### Phase 3: Detail View (the big one) — COMPLETED (accordion layout, not tabs)

**Note:** Phase 3 was implemented with TradingView-inspired collapsible accordions instead of the
originally specified 4-tab layout. See `TRADINGVIEW_AUDIT.md` for the decision rationale.

**3a — Shell + Equity Chart + KPI Bar:**

- [x] **P3-1.** Built accordion-based detail panel (not tabs) with KPI bar pinned at top ✅
- [x] **P3-2.** Built `equity-chart-with-layers.tsx` — 4 toggleable layers using Lightweight Charts ✅
- [x] **P3-3.** `regime-performance-mini.tsx` — regime Sharpe row ✅
- [x] **P3-4.** Signal quality metrics visible in KPI bar + Performance section ✅

**3b — Signals Analysis (accordion section, not separate tab):**

- [x] **P3-5.** Built `SignalListView` — MFE/MAE, per-signal + cumulative P&L, regime columns ✅
- [x] **P3-6.** Built `pnl-distribution-histogram.tsx` — P&L distribution with avg profit/loss lines ✅
- [x] **P3-7.** Built `win-loss-donut.tsx` — wins/losses/break-even donut ✅

**3c — Performance (accordion section):**

- [x] **P3-8.** Built `performance-section.tsx` — All/Long/Short split + benchmark + risk-adjusted ✅
- [x] **P3-9.** Drawdown included as equity chart layer toggle (not separate chart) ✅
- [x] **P3-10.** `monthly-returns-heatmap.tsx` — color-coded monthly grid ✅

**3d — Configuration (accordion section):**

- [x] **P3-11.** Config snapshot showing model version, parameters, instruments, date range ✅

**3e — Mock data:**

- [x] **P3-12.** Created `backtest-analytics-types.ts` + extended `BacktestRun` with full analytics ✅
- [x] **P3-13.** Created `backtest-analytics-mock.ts` — seeded generators for all analytics + signals ✅
- [x] **P3-14.** Mock equity curves, trade markers, P&L distribution, direction performance all generated ✅

**3f — New sections from TradingView audit:**

- [x] **P3-15.** Built `capital-efficiency-section.tsx` — CAGR, return on capital, account size ✅
- [x] **P3-16.** Built `runups-drawdowns-section.tsx` — run-up + drawdown stats with duration ✅
- [x] **P3-17.** Built `profit-structure-chart.tsx` — gross profit/loss/commission/net bar chart ✅

### Phase 4: Compare View (signal overlay charts)

- [x] **P4-1.** `signal-overlay-chart.tsx` — Lightweight Charts candlesticks + markers ✅
- [x] **P4-2.** `overlaid-equity-curves.tsx` ✅
- [x] **P4-3.** `signal-overlap-panel.tsx` + pairwise overlap chips ✅
- [x] **P4-4.** “Send to Execution” / “Send best …” with `?from=strategies&strategyBacktestId(s)=…` ✅
- [x] **P4-5.** Full confluence callout (`computeFullConfluenceAllStrategies`) when ≥25% anchor alignment ✅

### Phase 5: Candidate Flow + Portfolio Mode

- [x] **P5-1.** “Candidate” button → demo toast (lineage API TBD) ✅
- [x] **P5-2.** Candidate badge on list + Candidates KPI card ✅
- [ ] **P5-3.** Portfolio mode: multi-instrument backtest with cross-asset limits _(data/API)_
- [ ] **P5-4.** Portfolio-level signal aggregation _(data/API)_

### Phase 6: Cleanup

- [ ] **P6-1.** Merge useful components from `strategy/backtests/`, `strategy/results/`, `strategy/compare/`
- [ ] **P6-2.** Delete merged legacy pages
- [ ] **P6-3.** Move `strategy/handoff/` content to Promote lifecycle tab
- [ ] **P6-4.** Add MSW handlers for new/renamed endpoints
- [ ] **P6-5.** Verify all views render correctly in mock mode

---

## 10. Shard-Specific Adaptations

The detail view adapts metrics based on the backtest's shard:

### CeFi / TradFi (Financial)

Standard metrics as wireframed above: Sharpe, Sortino, Max DD, Profit Factor, etc.
Regime performance: Trending, Ranging, Volatile, Crisis.

### DeFi

Additional metrics: APY equivalent, gas costs simulated, impermanent loss (for LP strategies),
health factor minimum (for lending strategies), liquidation proximity.
Regime: High Gas, Low Gas, High TVL, TVL Decline.

### Sports

Different metric set entirely:

- ROI (return on investment per unit staked)
- CLV (Closing Line Value — did we beat the closing odds?)
- Kelly Fraction (optimal bet sizing vs actual)
- Bankroll Drawdown (max % of bankroll lost)
- Void Rate (% of signals on voided/cancelled events)
- Hit Rate by League (Premier League vs La Liga vs NBA breakdown)

Regime: In-Season, Off-Season, Tournament, Derby Week.

### Prediction Markets

- Brier Score (calibration of predicted probabilities)
- ROI per market type
- Resolution accuracy (did the market resolve as predicted?)
- Market efficiency index

---

## 11. Connection to Other Tabs

### Upstream (what feeds into Strategies)

| Source                | What It Provides                                                       |
| --------------------- | ---------------------------------------------------------------------- |
| Models tab → Registry | Trained model ID + version for ML-based backtests                      |
| Features tab          | Feature catalogue + versions (displayed in Config tab for lineage)     |
| Feature ETL tab       | Feature computation status (are features computed for the date range?) |

### Downstream (what consumes from Strategies)

| Consumer              | What It Receives                                                           |
| --------------------- | -------------------------------------------------------------------------- |
| Execution tab         | Signal list from a strategy backtest → simulates fills with TWAP/VWAP/etc. |
| Candidates page       | Strategy candidate record with full lineage                                |
| Promote lifecycle tab | Candidates for team review and deployment                                  |
| Overview tab          | Backtest counts, active jobs, best Sharpe for pipeline status cards        |

### The Handoff to Execution

When the user clicks "Send Signals to Execution Tab":

1. The signal list is passed (via URL state or shared store) to the Execution tab
2. The Execution tab pre-populates its "New Execution Backtest" dialog with:
   - Strategy backtest ID (for lineage)
   - Signal list reference
   - Instrument(s) from the strategy backtest
   - Date range from the strategy backtest
3. The user only needs to select the execution algo and params — everything else is inherited

---

## 12. Agent Assignment Guide

| Task                                   | Files Touched                                                                             | Complexity |
| -------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- |
| **Phase 1** (structural)               | `strategies/page.tsx`, types                                                              | Medium     |
| **Phase 2** (config form)              | New `strategy-config-form.tsx`, `model-version-picker.tsx`                                | Medium     |
| **Phase 3a** (detail shell + overview) | New `strategy-detail-panel.tsx`, `signal-equity-chart.tsx`                                | High       |
| **Phase 3b** (signals tab)             | New `signal-list-table.tsx`, `signal-confidence-histogram.tsx`                            | Medium     |
| **Phase 3c** (performance tab)         | New `strategy-performance-panel.tsx`, `drawdown-chart.tsx`, `monthly-returns-heatmap.tsx` | Medium     |
| **Phase 3d** (config tab)              | Within `strategy-detail-panel.tsx`                                                        | Low        |
| **Phase 3e** (mock data)               | `lib/strategy-platform-mock-data.ts`, types                                               | Medium     |
| **Phase 4** (compare charts)           | New `signal-overlay-chart.tsx`, `overlaid-equity-curves.tsx`                              | High       |
| **Phase 5** (candidate + portfolio)    | `strategies/page.tsx`, types, mock data                                                   | Medium     |
| **Phase 6** (cleanup)                  | Delete 4+ pages, merge content                                                            | Medium     |

**Parallelization:** Phase 3a-3d can be split across agents since they're separate
components in separate tabs. Phase 3e (mock data) must be done first or in parallel
with 3a since the detail view needs data to render.

### Context Files an Agent MUST Read

1. **This document** — `docs/build lifecycle tab/STRATEGIES_PAGE_SPEC.md`
2. **Build spec §4** — `docs/build lifecycle tab/BUILD_SECTION_SPEC.md` (lines 899-1038)
3. **Types** — `lib/strategy-platform-types.ts`
4. **Mock data** — `lib/strategy-platform-mock-data.ts`
5. **Hooks** — `hooks/api/use-strategies.ts`
6. **ML Models tab spec** — `docs/build lifecycle tab/ML_MODELS_TAB_SPEC.md` (for model picker integration)
7. **Execution tab spec** — `docs/build lifecycle tab/EXECUTION_TAB_SPEC.md` (for handoff interface)

---

## 13. Resolved Questions

| #   | Question                          | Decision                                                                                    | Rationale                                                                                                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Model vs template in New Backtest | **Both: template = preset, model = override**                                               | Templates are pre-configured strategies. ML backtests also select model + version from Registry.                                                                                             |
| Q2  | Detail view: drawer or page?      | **Inline right panel**                                                                      | Same pattern as Execution tab. Fast for comparison workflows. Consistent UX.                                                                                                                 |
| Q3  | Chart library                     | **TradingView Lightweight Charts v5** for equity chart. **Recharts** for histograms/donuts. | LW Charts is already installed (`^5.1.0`), handles time-series financial data natively with proper crosshair, zoom, time axis. Recharts for non-time-series charts (bar charts, pie charts). |
| Q4  | Portfolio mode scope              | **Phase 5**                                                                                 | Single-instrument is the primary workflow. Portfolio adds complexity.                                                                                                                        |
| Q5  | Candidate badge color             | **Amber ⭐**                                                                                | Matches existing stats card color. Star icon = candidate.                                                                                                                                    |
| Q6  | Rule-based strategies             | **Supported from Phase 2**                                                                  | Essential for comparing ML vs rules on same data. Key research workflow.                                                                                                                     |
| Q7  | Signal overlap calculation        | **Within N bars (configurable, default=2)**                                                 | Two signals "agree" if same direction within 2 bars.                                                                                                                                         |
| Q8  | Shard-specific metrics            | **Adaptive detail panel**                                                                   | Sports shows ROI/CLV/Kelly, DeFi shows APY/gas/IL, CeFi shows standard Sharpe/DD.                                                                                                            |
| Q9  | Tabs vs Accordions                | **Collapsible accordions** (TradingView pattern)                                            | User can have multiple sections open simultaneously. Scrollable single-page with KPI bar pinned. Tabs force single-section focus.                                                            |
| Q10 | Shared components with Execution  | **9 shared components in `components/research/`**                                           | Built once, used by both tabs. See `EXECUTION_AGENT_HANDOFF.md` for usage guide.                                                                                                             |

---

## 14. Changelog

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                              | By    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 2026-03-25 | v1: Initial document — gap analysis + basic build plan                                                                                                                                                                                                                                                                                                                                                              | Agent |
| 2026-03-25 | v2: Full rewrite. Institutional vision. Two-panel layout. Rule-based + ML strategy support. Shard-specific metrics. TradingView-inspired detail view with 4 tabs. Signal overlay comparison chart. Confidence distribution histogram. Regime performance breakdown. Monthly returns heatmap. Full type definitions. 6-phase implementation plan with 35 items. Agent assignment guide. Resolved all open questions. | Agent |
| 2026-03-25 | v3: Implementation complete. Replaced 4-tab detail view with TradingView-inspired accordion layout. Built 9 shared components in `components/research/`. Created shared types + mock generators. Full rewrite of `strategies/page.tsx`. Created `EXECUTION_AGENT_HANDOFF.md`. Chart: LW Charts for equity, Recharts for histograms/donuts. Added Q9 + Q10. Updated gap analysis 5C to reflect completion.           | Agent |
