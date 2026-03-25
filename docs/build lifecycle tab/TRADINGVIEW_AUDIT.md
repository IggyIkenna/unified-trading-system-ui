# TradingView Strategy Tester Audit — What We Have vs What They Have

> **Purpose:** Cross-reference TradingView's Strategy Report with our Strategies + Execution
> tab specs. Identify what we're missing, what we already have, and what we should adapt.
>
> **NOT a copy exercise.** TV is retail. We are institutional. We take the structure and
> metric depth, skip what doesn't apply, and add what they don't have (regime analysis,
> signal confidence, multi-strategy comparison, ML lineage, shard-specific metrics).
>
> **Reference screenshots:** `assets/Screenshot_from_2026-03-25_11-3*` (6 images)

---

## TradingView Strategy Report — Structure Breakdown

### Top-Level Layout

TV uses **two main views**, toggled via tabs at the top:

```
[Metrics]  [List of Trades]
```

Under **Metrics**, the page is a **single scrollable column** with collapsible accordion sections:

```
┌────────────────────────────────────────────┐
│  HEADER: Strategy Name + Date Range        │
│  KPI Bar: Total P&L | Max DD | Trades | %  │
│                                             │
│  EQUITY CHART (with layer toggles)         │
│    Layers: Equity | Buy & Hold | Trade     │
│            executions | Runup/Drawdowns     │
│                                             │
│  ▶ Performance (collapsible)               │
│  ▶ Trades Analysis (collapsible)           │
│  ▶ Capital Efficiency (collapsible)        │
│  ▶ Run-ups and Drawdowns (collapsible)     │
└────────────────────────────────────────────┘
```

Under **List of Trades**, it's a detailed trade-by-trade table.

### Key Design Patterns We Should Adopt

1. **Collapsible accordion sections** — not separate tabs. The user scrolls and expands
   what they need. This is better than tabs because you can have multiple sections open
   simultaneously for comparison within the same backtest.

2. **KPI bar at top** — 5 numbers always visible: Total P&L, Max Equity Drawdown,
   Total Trades, Profitable Trades (count + %), Profit Factor. These never scroll away.

3. **Equity chart with toggle layers** — not a static chart. TV has 4 toggleable overlays:
   Equity line, Buy & Hold overlay, Trade execution markers, Runup/Drawdown bars.
   Each can be toggled independently.

4. **Three-column metric tables** — All | Long | Short columns everywhere. This is their
   signature pattern and it's extremely useful. Every metric is broken down by direction.

---

## Section-by-Section Audit

### 1. KPI Bar (Top 5 Numbers)

**TradingView has:**

| KPI                 | Format             | Shown          |
| ------------------- | ------------------ | -------------- |
| Total P&L           | Amount + % + color | Always visible |
| Max equity drawdown | Amount + %         | Always visible |
| Total trades        | Count              | Always visible |
| Profitable trades   | % + count/total    | Always visible |
| Profit factor       | Ratio              | Always visible |

**Our current state:**

| Tab            | What we have                                       | What's missing                         |
| -------------- | -------------------------------------------------- | -------------------------------------- |
| **Strategies** | Total Backtests, Complete, Candidates, Best Sharpe | No per-backtest KPI bar in detail view |
| **Execution**  | Total Backtests, Complete, Running, Best Sharpe    | No per-backtest KPI bar in detail view |

**Action:** Add a KPI bar to BOTH the Strategies detail panel and the Execution results panel.
When a backtest is selected, show: **Total P&L | Max DD | Total Signals/Trades | Win Rate | Profit Factor**
These 5 numbers stay pinned at the top of the detail/results panel while the user scrolls sections below.

**Where it lives:**

- Strategies tab → detail panel header (signal-focused: P&L, Max DD, Total Signals, Hit Rate, Profit Factor)
- Execution tab → results panel header (execution-focused: Net P&L, Max DD, Total Trades, Fill Rate, Profit Factor)

---

### 2. Equity Chart (with layer toggles)

**TradingView has:**

4 toggleable layers on the equity chart:

1. **Equity** — the main equity curve line
2. **Buy & Hold** — benchmark overlay (dashed line)
3. **Trade executions** — vertical bars showing where trades happened (green = profit, red = loss)
4. **Runup/Drawdowns** — colored bars at each trade showing the max favorable/adverse excursion

All 4 are independently toggleable via checkboxes on the left.

The equity drawdown tooltip shows: amount, %, and the date range of the drawdown.

**Our current state:**

| Tab            | What we have                             | What's missing                                                        |
| -------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| **Strategies** | Spec has equity curve + buy/sell markers | No layer toggles. No trade execution bars. No runup/drawdown overlay. |
| **Execution**  | Has equity curve                         | Missing buy & hold overlay, trade markers, runup/drawdown bars        |

**Action:**

Both tabs should have the **same equity chart component** with 4 toggleable layers:

1. **Equity** — always on
2. **Buy & Hold** — toggleable benchmark overlay
3. **Trade/Signal markers** — green/red vertical bars at each trade (Execution) or signal (Strategies)
4. **Runup/Drawdown bars** — shows max favorable/adverse excursion per trade

This is a **shared component** (`components/research/equity-chart-with-layers.tsx`) used by
both Strategies and Execution detail views.

**Chart tooltip:** On hover, show equity drawdown (amount + %) with the date range.

---

### 3. Performance Section

**TradingView has (from Screenshot 2):**

#### Profit Structure (visual)

- Bar chart: Gross Profit (green), Gross Loss (red), Commission (blue), Total P&L (dark)
- Benchmarking: side-by-side bar comparison — P&L for Buy & Hold vs P&L for Strategy

#### Returns Table (3 columns: All | Long | Short)

| Metric          | All                 | Long                 | Short              |
| --------------- | ------------------- | -------------------- | ------------------ |
| Initial capital | 1,000,000.00        | —                    | —                  |
| Open P&L        | 0                   | —                    | —                  |
| Net P&L         | +2,047.85 (+0.20%)  | +59,261.30 (-0.5%)   | -57,213.45 (-0.5%) |
| Gross profit    | 162,902.19 (14.39%) | 162,902.19 (16.39%)  | 0 (0.00%)          |
| Gross loss      | -160,854.34         | -103,640.89 (10.56%) | -57,213.45 (0.19%) |
| Profit factor   | 1.013               | 1.572                | 0                  |
| Commission paid | 0                   | 0                    | 0                  |
| Expected payoff | 25.28               | 1,033.67             | -2,383.89          |

#### Benchmark Comparison

| Metric                  | All                      |
| ----------------------- | ------------------------ |
| Buy & hold return       | -5,075,586.84 (-103.66%) |
| Buy & hold % gain       | 343.96%                  |
| Strategy outperformance | -5,617,416.05            |

#### Risk-Adjusted Performance

| Metric        | All    |
| ------------- | ------ |
| Sharpe ratio  | -0.319 |
| Sortino ratio | -0.514 |

**Our current state:**

| Tab                 | What we have                                            | What's missing from TV's layout                                                                                                              |
| ------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strategies spec** | Performance tab with Long/Short/All split ✅            | Missing: Profit Structure visual (bar chart). Missing: Benchmark comparison section. Missing: Expected payoff. Missing: Commission paid row. |
| **Execution spec**  | Performance tab exists (9 metrics, no Long/Short split) | Missing: Long/Short/All split. Missing: Profit Structure visual. Missing: Benchmark section. Missing: Risk-adjusted section as named group.  |

**Action:**

The Performance section (in BOTH tabs) should have these sub-sections:

1. **Profit Structure** (visual) — bar chart of Gross Profit / Gross Loss / Commission / Net P&L
   Plus benchmarking visual: strategy P&L vs Buy & Hold P&L side by side.

2. **Returns** (table, 3-col: All | Long | Short) — Initial capital, Net P&L (amount + %),
   Gross profit (amount + %), Gross loss, Profit factor, Commission, Expected payoff.

3. **Benchmark Comparison** — Buy & hold return, Buy & hold % gain, Strategy outperformance.
   (Only in "All" column — benchmarks are direction-agnostic.)

4. **Risk-Adjusted Performance** — Sharpe ratio, Sortino ratio, Calmar ratio (we add this — TV doesn't have it).

We already have most of these METRICS in our types. What we're missing is the **visual grouping
and the profit structure charts**. The Long/Short/All columns are in the Strategies spec but
not yet in the Execution spec.

---

### 4. Trades Analysis Section

**TradingView has (from Screenshot 3):**

#### P&L Distribution (visual)

- Histogram of trade P&L distribution (buckets from -5% to +6%)
- Red bars = losses, green bars = profits
- Dashed lines: average loss (-1.06%), average profit (+3.49%)

#### Win/Loss Ratio (visual)

- Donut chart: 81 total trades → Wins (13, 16.05%), Losses (59, 71.60%), Break even (9, 11.11%)

#### Details Table (3 columns: All | Long | Short)

| Metric                              | All               | Long              | Short              |
| ----------------------------------- | ----------------- | ----------------- | ------------------ |
| Total trades                        | 81                | 57                | 24                 |
| Total open trades                   | 0                 | 0                 | 0                  |
| Winning trades                      | 13                | 13                | 0                  |
| Losing trades                       | 20                | 16                | 21                 |
| Percent profitable                  | 19.05%            | 22.81%            | 0.00%              |
| Avg P&L                             | 25.28 (-0.31%)    | 1,033.67 (0.04%)  | -2,383.89 (-0.19%) |
| Avg winning trade                   | 12,530.94 (4.89%) | 12,530.94 (5.81%) | —                  |
| Avg losing trade                    | 2,726.34 (1.68%)  | 2,717.39 (1.78%)  | 2,714.45 (1.18%)   |
| Ratio avg win / avg loss            | 4.596             | —                 | 4.154              |
| Largest winning trade               | 19,371.18         | 19,371.18         | —                  |
| Largest winning trade percent       | 19.31%            | 19.31%            | —                  |
| Largest winner as % of gross profit | 12.26%            | 12.06%            | 0.00%              |
| Largest losing trade                | 3,997.58          | 3,991.50          | 3,915.03           |
| Largest losing trade percent        | 4.55%             | 4.55%             | 2.97%              |
| Largest loser as % of gross loss    | 3.49%             | 3.86%             | 6.98%              |
| Avg # bars in trades                | 8                 | 10                | 4                  |
| Avg # bars in winning trades        | 18                | 18                | 0                  |
| Avg # bars in losing trades         | 7                 | 5                 | 5                  |

**Our current state:**

| Tab                 | What we have                                                  | What's missing from TV                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strategies spec** | Hit rate, avg hold time, signals/day, confidence distribution | Missing: P&L distribution histogram. Missing: Win/Loss donut. Missing: Ratio avg win/avg loss. Missing: Largest winner/loser stats. Missing: Largest as % of gross profit/loss. Missing: Avg bars in winning/losing trades. |
| **Execution spec**  | Trade-level data specified but not built.                     | Missing: All of the above visualizations.                                                                                                                                                                                   |

**Action:**

Add a **Trades Analysis** section (both tabs) with:

1. **P&L Distribution Histogram** — trade P&L buckets with red/green bars + avg loss/profit dashed lines
2. **Win/Loss Donut Chart** — total trades split by win/loss/break-even
3. **Details Table** (3-col: All | Long | Short) with ALL the metrics TV shows:
   - Total trades, open trades, winning, losing, percent profitable
   - Avg P&L, avg winning trade, avg losing trade, ratio avg win/avg loss
   - Largest winning/losing trade (amount, %, and as % of gross profit/loss)
   - Avg bars in trades (all, winning, losing)

The **Strategies tab** version shows signals (not trades). The terminology shifts:
"winning signal" instead of "winning trade", "avg bars in signal" = avg hold time.
But the STRUCTURE is the same.

---

### 5. Capital Efficiency Section

**TradingView has (from Screenshot 5):**

#### Capital Usage (3-col: All | Long | Short)

| Metric                          | All       | Long      | Short      |
| ------------------------------- | --------- | --------- | ---------- |
| Annualized return (CAGR)        | 0.01%     | 0.25%     | -0.26%     |
| Return on initial capital       | 0.20%     | 5.93%     | -5.72%     |
| Account size required           | 48,162.40 | —         | —          |
| Return on account size required | 4.25%     | 123.04%   | -118.79%   |
| Net profit as % of largest loss | 51.21%    | 1,482.40% | -1,452.19% |

#### Margin Usage

| Metric            | All |
| ----------------- | --- |
| Avg margin used   | 0   |
| Max margin used   | 0   |
| Margin efficiency | 0   |
| Margin calls      | 0   |

**Our current state:**

| Tab                 | What we have                  | What's missing       |
| ------------------- | ----------------------------- | -------------------- |
| **Strategies spec** | Nothing on capital efficiency | **Entirely missing** |
| **Execution spec**  | Nothing on capital efficiency | **Entirely missing** |

**Action:**

Add a **Capital Efficiency** section to the Execution tab detail view:

1. **Capital Usage** (3-col) — CAGR, Return on initial capital, Account size required,
   Return on account size required, Net profit as % of largest loss.

2. **Margin Usage** — Avg/Max margin used, Margin efficiency, Margin calls.

For the **Strategies tab**: show a simplified version — CAGR, Return on capital, Account size
required. Skip margin (margin is an execution concern).

This section matters for institutional context — "what capital do I need allocated to run
this strategy?" is one of the first questions a PM asks.

---

### 6. Run-ups and Drawdowns Section

**TradingView has (from Screenshot 6):**

#### Run-ups

| Metric                                               | All                |
| ---------------------------------------------------- | ------------------ |
| Avg equity run-up duration (close-to-close)          | 906 days           |
| Avg equity run-up (close-to-close)                   | 36,105.12 (+3.61%) |
| Max equity run-up (close-to-close)                   | 43,966.65 (+4.10%) |
| Max equity run-up (intrabar)                         | 91,012.83 (+9.04%) |
| Max equity run-up as % of initial capital (intrabar) | 9.10%              |

#### Drawdowns

| Metric                                                 | All                |
| ------------------------------------------------------ | ------------------ |
| Avg equity drawdown duration (close-to-close)          | 914 days           |
| Avg equity drawdown (close-to-close)                   | 24,803.19 (-2.48%) |
| Max equity drawdown (close-to-close)                   | 39,966.32 (-4.05%) |
| Max equity drawdown (intrabar)                         | 48,162.40 (-4.82%) |
| Max equity drawdown as % of initial capital (intrabar) | 4.82%              |
| Return of max equity drawdown                          | 0.04               |

**Our current state:**

| Tab                 | What we have                                    | What's missing                                                                                   |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Strategies spec** | Max drawdown in metrics                         | Missing: Avg drawdown, drawdown duration, intrabar vs close-to-close distinction, run-up metrics |
| **Execution spec**  | Max drawdown in metrics, drawdown chart planned | Missing: All run-up metrics. Missing: Duration metrics. Missing: intrabar distinction.           |

**Action:**

Add a **Run-ups & Drawdowns** section to BOTH tabs:

1. **Run-ups** — avg duration, avg run-up (amount + %), max run-up (close-to-close),
   max run-up (intrabar), max as % of initial capital.

2. **Drawdowns** — avg duration, avg drawdown (amount + %), max drawdown (close-to-close),
   max drawdown (intrabar), max as % of initial capital, return of max drawdown.

The intrabar vs close-to-close distinction is important for risk management. A strategy
might look fine on close-to-close but have terrifying intrabar drawdowns. We need both.

---

### 7. List of Trades (separate view)

**TradingView has (from Screenshot 4):**

A full-page trade table with columns:

| Column              | Description                                       |
| ------------------- | ------------------------------------------------- |
| Trade #             | Numbered, color-coded (green = long, red = short) |
| Type                | Entry / Exit                                      |
| Date and Time       | Full timestamp                                    |
| Signal              | Entry signal name (e.g., ShortTP3, LongTP2)       |
| Price               | Execution price                                   |
| Position size       | Number of contracts/units                         |
| Net P&L             | Per-trade P&L (amount + %)                        |
| Favorable excursion | Max favorable move during the trade               |
| Adverse excursion   | Max adverse move during the trade                 |
| Cumulative P&L      | Running total                                     |

Each trade is shown as Entry + Exit row pair, grouped by trade number.

**Our current state:**

| Tab                 | What we have                       | What's missing                                                                                     |
| ------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Strategies spec** | Signals tab with signal list       | Missing: Favorable/Adverse excursion. Missing: Cumulative P&L column. Missing: Entry/Exit pairing. |
| **Execution spec**  | Trades tab specified but not built | Missing: All of the above.                                                                         |

**Action:**

**Strategies tab — Signals tab:** Keep the current signal-focused table but add:

- Favorable/Adverse excursion per signal (how far price moved in your favor / against you)
- Cumulative P&L column
- Entry/Exit pairing (group LONG+CLOSE as one "trade")

**Execution tab — Trades tab:** Build with full TV parity:

- Trade # with color coding
- Entry/Exit row pairs
- Signal name, Price, Fill Price, Position size
- Net P&L (amount + %)
- Favorable/Adverse excursion
- Cumulative P&L
- Additional: Slippage bps, Fill time, Venue (execution-specific columns)

---

## Summary: What's New We Need to Add

### Metrics We're Missing (that TV has and we should add)

| Metric                                   | TV Section                  | Where to Add (Our Tabs) | Priority |
| ---------------------------------------- | --------------------------- | ----------------------- | -------- |
| Expected payoff                          | Performance → Returns       | Both                    | Medium   |
| Ratio avg win / avg loss                 | Trades Analysis             | Both                    | High     |
| Largest winner as % of gross profit      | Trades Analysis             | Both                    | Medium   |
| Largest loser as % of gross loss         | Trades Analysis             | Both                    | Medium   |
| Avg # bars in winning/losing trades      | Trades Analysis             | Both                    | High     |
| CAGR (Annualized return)                 | Capital Efficiency          | Both                    | High     |
| Account size required                    | Capital Efficiency          | Execution               | High     |
| Return on account size required          | Capital Efficiency          | Execution               | Medium   |
| Net profit as % of largest loss          | Capital Efficiency          | Both                    | Medium   |
| Avg margin used / Max margin             | Capital Efficiency → Margin | Execution               | Low      |
| Margin efficiency / Margin calls         | Capital Efficiency → Margin | Execution               | Low      |
| Avg equity run-up duration               | Run-ups & Drawdowns         | Both                    | Medium   |
| Avg/Max equity run-up (close + intrabar) | Run-ups & Drawdowns         | Both                    | Medium   |
| Avg equity drawdown duration             | Run-ups & Drawdowns         | Both                    | High     |
| Max drawdown (intrabar)                  | Run-ups & Drawdowns         | Both                    | High     |
| Return of max equity drawdown            | Run-ups & Drawdowns         | Both                    | Medium   |
| Favorable/Adverse excursion per trade    | List of Trades              | Both                    | High     |
| Cumulative P&L column                    | List of Trades              | Both                    | Medium   |

### Visuals We're Missing (that TV has and we should add)

| Visual                                     | TV Section      | Where to Add            | Priority     |
| ------------------------------------------ | --------------- | ----------------------- | ------------ |
| Equity chart layer toggles (4 layers)      | Equity Chart    | Both (shared component) | **Critical** |
| Profit Structure bar chart                 | Performance     | Both                    | High         |
| Benchmarking visual (strategy vs B&H bars) | Performance     | Both                    | High         |
| P&L Distribution histogram (per trade)     | Trades Analysis | Both                    | High         |
| Win/Loss/Break-even donut chart            | Trades Analysis | Both                    | High         |
| Drawdown tooltip (amount + % + date range) | Equity Chart    | Both                    | Medium       |
| Trade execution bars on equity chart       | Equity Chart    | Both                    | Medium       |
| Runup/Drawdown bars on equity chart        | Equity Chart    | Both                    | Medium       |

### Section Structure We're Missing

| Section                                | TV Has It | Our Strategies Tab | Our Execution Tab |
| -------------------------------------- | --------- | ------------------ | ----------------- |
| **KPI Bar** (pinned 5-number header)   | ✅        | ❌ Missing         | ❌ Missing        |
| **Collapsible accordion sections**     | ✅        | ❌ Using tabs      | ❌ Using tabs     |
| **Performance → Profit Structure**     | ✅        | ❌                 | ❌                |
| **Performance → Benchmark Comparison** | ✅        | ✅ In spec         | ❌ Missing        |
| **Performance → Risk-Adjusted**        | ✅        | ✅ In spec         | ❌ Missing        |
| **Trades Analysis → P&L Distribution** | ✅        | ❌                 | ❌                |
| **Trades Analysis → Win/Loss Donut**   | ✅        | ❌                 | ❌                |
| **Capital Efficiency**                 | ✅        | ❌ Entirely new    | ❌ Entirely new   |
| **Run-ups & Drawdowns**                | ✅        | ❌ Partially       | ❌ Partially      |

---

## What We Have That TV Does NOT

These are our institutional advantages — do not remove them to match TV:

| Our Feature                                                   | Why TV Doesn't Have It               | Keep?                                          |
| ------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------- |
| **Multi-strategy signal comparison on price chart**           | TV only shows one strategy at a time | ✅ Keep — core institutional feature           |
| **Regime performance breakdown** (trending/ranging/crisis)    | TV doesn't do regime analysis        | ✅ Keep — risk officers need this              |
| **Confidence distribution histogram**                         | TV doesn't have ML signal confidence | ✅ Keep — ML-specific feature                  |
| **Signal overlap % between strategies**                       | TV doesn't compare strategies        | ✅ Keep — institutional comparison             |
| **Model lineage (feature versions, model version)**           | TV doesn't have ML models            | ✅ Keep — reproducibility                      |
| **Shard-specific metrics** (Sports: CLV/Kelly, DeFi: APY/gas) | TV is financial only                 | ✅ Keep — multi-asset firm                     |
| **Two-phase backtest** (signals separate from execution)      | TV couples them                      | ✅ Keep — isolates signal vs execution quality |
| **Strategy candidate promotion flow**                         | TV doesn't have deployment pipeline  | ✅ Keep — operational workflow                 |
| **Overlaid equity curves in compare view**                    | TV shows one at a time               | ✅ Keep — side-by-side visual                  |
| **Send signals to Execution Tab** handoff                     | TV doesn't separate the two          | ✅ Keep — pipeline workflow                    |

---

## Recommended Section Structure (Updated)

### Strategies Tab — Detail Panel (when a backtest is selected)

```
┌──────────────────────────────────────────────┐
│  KPI BAR: P&L | Max DD | Signals | Hit Rate │
│           | Profit Factor                     │
├──────────────────────────────────────────────┤
│  EQUITY CHART (with 4 layer toggles)         │
│    [✓] Equity  [✓] Buy & Hold               │
│    [✓] Signal markers  [ ] Runup/Drawdowns   │
├──────────────────────────────────────────────┤
│  ▶ Performance                               │
│     Profit Structure (bar chart)             │
│     Returns (All | Long | Short table)       │
│     Benchmark Comparison                     │
│     Risk-Adjusted (Sharpe, Sortino, Calmar)  │
├──────────────────────────────────────────────┤
│  ▶ Signals Analysis                          │
│     P&L Distribution Histogram               │
│     Win/Loss Donut                           │
│     Confidence Distribution (OUR ADDITION)   │
│     Details (All | Long | Short table)       │
│     Regime Performance (OUR ADDITION)        │
├──────────────────────────────────────────────┤
│  ▶ Capital Efficiency                        │
│     CAGR, Return on capital, Account size    │
├──────────────────────────────────────────────┤
│  ▶ Run-ups & Drawdowns                       │
│     Run-ups (avg, max, duration)             │
│     Drawdowns (avg, max, intrabar, duration) │
├──────────────────────────────────────────────┤
│  ▶ Configuration                             │
│     Model version, Signal rules, Risk params │
│     Feature versions (full lineage)          │
├──────────────────────────────────────────────┤
│  [List of Signals] toggle at top (like TV)   │
└──────────────────────────────────────────────┘
```

### Execution Tab — Results Panel (when a backtest is selected)

```
┌──────────────────────────────────────────────┐
│  KPI BAR: Net P&L | Max DD | Trades |        │
│           Fill Rate | Profit Factor           │
├──────────────────────────────────────────────┤
│  EQUITY CHART (with 4 layer toggles)         │
│    [✓] Equity  [✓] Buy & Hold               │
│    [✓] Trade markers  [ ] Runup/Drawdowns    │
├──────────────────────────────────────────────┤
│  ▶ Performance                               │
│     Profit Structure (bar chart)             │
│     Returns (All | Long | Short table)       │
│     Benchmark Comparison                     │
│     Risk-Adjusted (Sharpe, Sortino, Calmar)  │
├──────────────────────────────────────────────┤
│  ▶ Trades Analysis                           │
│     P&L Distribution Histogram               │
│     Win/Loss Donut                           │
│     Details (All | Long | Short table)       │
├──────────────────────────────────────────────┤
│  ▶ Execution Quality (OUR ADDITION)          │
│     Slippage Distribution Histogram          │
│     IS Decomposition                         │
│     Venue Breakdown Table                    │
├──────────────────────────────────────────────┤
│  ▶ Capital Efficiency                        │
│     CAGR, Return on capital, Account size    │
│     Margin Usage                             │
├──────────────────────────────────────────────┤
│  ▶ Run-ups & Drawdowns                       │
│     Run-ups (avg, max, duration)             │
│     Drawdowns (avg, max, intrabar, duration) │
├──────────────────────────────────────────────┤
│  ▶ Configuration                             │
│     Strategy backtest source, Algo params    │
│     Venues, Routing, Slippage model          │
├──────────────────────────────────────────────┤
│  [List of Trades] toggle at top (like TV)    │
└──────────────────────────────────────────────┘
```

---

## Key Design Decision: Tabs vs Collapsible Accordions

**TradingView uses collapsible accordions in a single scrollable view.**
**Our current spec uses separate tabs (Overview, Performance, Signals, Config).**

**Recommendation: Adopt TV's accordion approach.**

Why:

- Accordions let you have multiple sections open at once — e.g., see Performance AND Trades Analysis
  simultaneously. Tabs force you to pick one.
- Scrollable single page with collapsible sections is more scannable — you see all section
  headers at once and open what you need.
- The equity chart + KPI bar stays pinned at the top regardless of which sections are expanded.
- This is what the team already uses in TV and loves — consistency reduces learning curve.
- Tabs make sense when sections are mutually exclusive. Our sections are NOT — they're
  complementary views of the same backtest.

**Exception:** The top-level toggle between `[Metrics]` and `[List of Signals/Trades]` should
remain as two view modes (like TV's `[Metrics]` and `[List of Trades]` toggle). This is because
the signal/trade list is a full-width table that doesn't coexist well with the accordion layout.

---

## Implementation Impact on Existing Specs

### Changes to `STRATEGIES_PAGE_SPEC.md`

1. **Phase 3 restructure:** Replace 4-tab detail view with accordion layout:
   - Remove tabs (Overview, Signals, Performance, Config)
   - Replace with: KPI bar + equity chart + 5 collapsible sections + signal list toggle
2. **Add 18 missing metrics** from the table above
3. **Add 8 missing visuals** (profit structure chart, P&L distribution, win/loss donut, etc.)
4. **Add Capital Efficiency section** (entirely new)
5. **Add Run-ups & Drawdowns section** (partially new)
6. **Equity chart component** becomes shared with layer toggles

### Changes to `EXECUTION_TAB_SPEC.md`

1. **Results panel restructure:** Replace 5-tab view with accordion layout matching Strategies tab
2. **Add Long/Short/All split** to Performance (was listed as gap, now with full metric list from TV)
3. **Add Trades Analysis section** with P&L distribution + Win/Loss donut + full details table
4. **Add Capital Efficiency section** (entirely new — includes margin)
5. **Add Run-ups & Drawdowns section** (entirely new)
6. **Equity chart** uses same shared component as Strategies
7. **Trades tab becomes "List of Trades" toggle** (top-level view mode, not a tab)

### New Shared Components

| Component                        | Used By                | What It Does                                                                         |
| -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| `equity-chart-with-layers.tsx`   | Strategies + Execution | 4-layer toggleable equity chart                                                      |
| `performance-section.tsx`        | Strategies + Execution | Profit structure visual + Returns table (All/Long/Short) + Benchmark + Risk-adjusted |
| `trades-analysis-section.tsx`    | Strategies + Execution | P&L distribution + Win/Loss donut + Details table (All/Long/Short)                   |
| `capital-efficiency-section.tsx` | Strategies + Execution | CAGR, account size, margin (Execution only)                                          |
| `runups-drawdowns-section.tsx`   | Strategies + Execution | Run-up + drawdown metrics with duration                                              |
| `kpi-bar.tsx`                    | Strategies + Execution | Pinned 5-number summary at top of detail panel                                       |
| `profit-structure-chart.tsx`     | Strategies + Execution | Bar chart: Gross Profit / Loss / Commission / Net                                    |
| `pnl-distribution-histogram.tsx` | Strategies + Execution | Per-trade/signal P&L bucket histogram                                                |
| `win-loss-donut.tsx`             | Strategies + Execution | Donut chart: wins / losses / break-even                                              |

---

## Effort Estimate (Additional Work from This Audit)

| Category                                              | Items                      | Effort |
| ----------------------------------------------------- | -------------------------- | ------ |
| Restructure detail views from tabs → accordions       | 2 (Strategies + Execution) | Medium |
| Build shared equity chart with layer toggles          | 1 component                | High   |
| Build profit structure visual                         | 1 component                | Medium |
| Build P&L distribution histogram                      | 1 component                | Medium |
| Build win/loss donut chart                            | 1 component                | Small  |
| Build KPI bar                                         | 1 component                | Small  |
| Build capital efficiency section                      | 1 component                | Small  |
| Build run-ups & drawdowns section                     | 1 component                | Small  |
| Add 18 missing metrics to types + mock data           | Type + data changes        | Medium |
| Add favorable/adverse excursion to signal/trade lists | Type + data + column       | Small  |
| Total new shared components                           | 9                          | —      |

The good news: **most of these components are shared** between Strategies and Execution.
Build once, use twice. The sections are identical in structure — only the metric labels
change (signals vs trades, signal confidence vs fill rate).

---

## Implementation Status (Updated 2026-03-25)

### Decisions Made

| Decision                            | Choice                                            | Rationale                                                                                         |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Chart library for equity chart      | **TradingView Lightweight Charts v5**             | Already installed (`^5.1.0`). Native financial time-series handling — crosshair, zoom, time axis. |
| Chart library for histograms/donuts | **Recharts**                                      | Already installed. Suited for categorical/distribution charts.                                    |
| Detail view layout                  | **Collapsible accordions** (not tabs)             | User can expand multiple sections simultaneously. KPI bar stays pinned while scrolling.           |
| Component sharing                   | **9 shared components in `components/research/`** | Built once, used by both Strategies and Execution tabs.                                           |
| Implementation sequence             | **Strategies tab first**                          | Execution tab handled by another agent using the shared components.                               |

### Shared Components — All Built

| Component                  | File                                                 | Status   |
| -------------------------- | ---------------------------------------------------- | -------- |
| `KpiBar`                   | `components/research/kpi-bar.tsx`                    | ✅ Built |
| `EquityChartWithLayers`    | `components/research/equity-chart-with-layers.tsx`   | ✅ Built |
| `ProfitStructureChart`     | `components/research/profit-structure-chart.tsx`     | ✅ Built |
| `PnlDistributionHistogram` | `components/research/pnl-distribution-histogram.tsx` | ✅ Built |
| `WinLossDonut`             | `components/research/win-loss-donut.tsx`             | ✅ Built |
| `PerformanceSection`       | `components/research/performance-section.tsx`        | ✅ Built |
| `TradesAnalysisSection`    | `components/research/trades-analysis-section.tsx`    | ✅ Built |
| `CapitalEfficiencySection` | `components/research/capital-efficiency-section.tsx` | ✅ Built |
| `RunupsDrawdownsSection`   | `components/research/runups-drawdowns-section.tsx`   | ✅ Built |

### Strategies Tab — Fully Implemented

- Two-panel layout (list + detail/compare)
- KPI bar pinned at top of detail panel
- Equity chart with 4 toggleable layers (Lightweight Charts)
- 5 collapsible accordion sections (Performance, Signals Analysis, Capital Efficiency, Run-ups & Drawdowns, Configuration)
- Metrics/List of Signals top-level toggle
- Signal list view with MFE/MAE, cumulative P&L, regime columns
- Compare view with overlaid equity curves and delta metrics
- Card-style backtest listing with inline stats

### Execution Tab — Pending (Another Agent)

Handoff document: `docs/build lifecycle tab/EXECUTION_AGENT_HANDOFF.md`

Remaining work:

- Wire shared components into Execution tab with execution-specific terminology
- Add Execution Quality section (slippage distribution, IS decomposition, venue breakdown)
- Add Margin Usage sub-section to Capital Efficiency
- Build List of Trades view with Entry/Exit pairing and execution-specific columns
- Add execution-specific mock data in `lib/backtest-analytics-mock.ts`

### Types & Mock Data — Built

| File                                 | Status      | What                                                                   |
| ------------------------------------ | ----------- | ---------------------------------------------------------------------- |
| `lib/backtest-analytics-types.ts`    | ✅ New      | Shared analytics interfaces (13 types)                                 |
| `lib/backtest-analytics-mock.ts`     | ✅ New      | Seeded mock data generators for all analytics                          |
| `lib/strategy-platform-types.ts`     | ✅ Extended | Added `StrategySignal`, `SignalQualityMetrics`, `SignalOverlapMetrics` |
| `lib/strategy-platform-mock-data.ts` | ✅ Extended | Integrated analytics + signal generators, linked to backtest runs      |
