# Execution Tab — Page Specification (v2)

> **Route:** `/services/research/execution`
> **Tab position:** Tab 5 of 7 in the Build/Research lifecycle section
> **Purpose:** Working spec for aligning the current implementation against TradingView-calibre strategy reporting and institutional quant standards.
>
> Read alongside: `BUILD_SECTION_SPEC.md §5` (authoritative target spec), `RESEARCH_BUILD_SECTION_AUDIT.md` (design decisions)
>
> **v2 update:** Full audit against TradingView Strategy Report + institutional benchmarks (Citadel/Jane Street/BlackRock style). The previous version focused on gap analysis from `BUILD_SECTION_SPEC.md`. This version expands the target significantly.

---

## 1. Reference: TradingView Strategy Report Structure

TradingView's strategy report (the screenshots) is the gold standard for retail+institutional backtesting UIs. Their report has:

### Top-level layout

- **Two primary modes** toggled via pill buttons: **Metrics** (analytics) and **List of Trades** (raw trade log)
- **Hero stats row** pinned at the very top: Total P&L · Max Equity Drawdown · Total Trades · Profitable Trades · Profit Factor — always visible regardless of scroll position
- **Equity chart** — the centrepiece. Multi-layer with toggleable overlays:
  - Equity line (green)
  - Buy & Hold line (comparison benchmark)
  - Trade markers (green = profit, red = loss, bar height = magnitude)
  - Drawdown/Runup area below
- **Collapsible accordion sections** below the chart: Performance · Trades Analysis · Capital Efficiency · Run-ups and Drawdowns

### Performance section (expanded)

- **Profit structure** — bar chart showing: Total Profit (green) + Total Loss (red) + Commission (blue) + Total P&L (net)
- **Benchmarking** — stacked/grouped chart comparing strategy P&L vs Buy & Hold P&L — shows when/where strategy outperforms
- **Returns table** (All / Long / Short columns):
  - Initial capital, Open P&L, Net P&L (with $ and %), Gross profit ($ and %), Gross loss ($), Profit factor, Commission paid, Expected payoff
- **Benchmark comparison** subsection:
  - Buy & hold return ($, %), Buy & hold % gain, Strategy outperformance ($)
- **Risk-adjusted performance** subsection:
  - Sharpe ratio, Sortino ratio

### Trades Analysis section (expanded)

- **P&L Distribution** — histogram of trade returns (% buckets from -4% to +6%), dual-colour (loss/profit), with vertical lines marking average loss and average profit
- **Win/Loss ratio** — donut chart showing Wins / Losses / Break-even counts and percentages
- **Details table** (All / Long / Short columns):
  - Total trades, Total open trades, Winning trades, Losing trades, Percent profitable
  - Avg P&L ($ and %), Avg winning trade ($ and %), Avg losing trade ($ and %)
  - Ratio avg win / avg loss
  - Largest winning trade ($), Largest winning trade percent, Largest winner as % of gross profit
  - Largest losing trade ($), Largest losing trade percent, Largest loser as % of gross loss
  - Avg # bars in trades, Avg # bars in winning trades, Avg # bars in losing trades

### Capital Efficiency section (expanded)

- **Capital usage** (All / Long / Short columns):
  - Annualised return (CAGR), Return on initial capital, Account size required, Return on account size required, Net profit as % of largest loss
- **Margin usage** (All column):
  - Avg margin used, Max margin used, Margin efficiency, Margin calls

### Run-ups and Drawdowns section (expanded)

- **Run-ups**: Avg/Max equity run-up duration (close-to-close), Avg/Max equity run-up ($, close-to-close), Max equity run-up (close-to-close, intrabar), Max equity run-up as % of initial capital (intrabar)
- **Drawdowns**: Avg equity drawdown duration (close-to-close), Avg/Max equity drawdown (close-to-close, $ and %), Max equity drawdown (intrabar, $ and %), Max equity drawdown as % of initial capital (intrabar), Return of max equity drawdown

### List of Trades mode

- Entry/Exit paired rows per trade
- Columns: Trade #, Type (Long/Short), Date and Time, Signal name, Price, Position size, Net P&L ($ and %), Favourable excursion ($ and %), Adverse excursion ($ and %), Cumulative P&L

---

## 2. Current State — What We Have

After the initial implementation pass, our page now has:

### 2.1 Overall layout

- Stats row: Total Backtests, Complete, Running, Best Sharpe ✅
- Left-list / right-results two-panel layout ✅
- Compare panel (appears when 2+ selected) with equity overlay + stats table ✅
- New Backtest dialog with expanded algo params ✅
- Strategy Candidate promotion button + confirmation dialog ✅

### 2.2 Results tabs (5 tabs — matching spec)

| Tab                   | Current state                                                                                                                  | Quality     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| **Overview**          | 4 hero metrics + equity curve + 4 inline execution stats + 4 secondary metrics                                                 | ✅ Solid    |
| **Performance**       | Long/Short/All column split table with Returns/Ratios/Trades sections + drawdown chart                                         | ✅ Good     |
| **Trades**            | 60-row table with #, Time, Signal, Instrument, Signal Price, Fill Price, Slippage, Fill Time, Venue, Commission, P&L, Cum. P&L | ✅ Good     |
| **Execution Quality** | 8 metric cards + slippage distribution histogram (colored) + IS breakdown (progress bars) + venue table                        | ✅ Good     |
| **Config**            | Key-value list + algo params                                                                                                   | ✅ Complete |

### 2.3 Compare panel

- Equity curve overlay (multi-line, algo-colored) ✅
- Metrics comparison table with star on best value ✅
- Net profit comparison summary ✅

---

## 3. Gap Analysis: Current vs TradingView + Institutional Standard

### What TradingView has that we DON'T have

This is the core audit. Each item is rated by institutional importance:

### 3.1 EQUITY CHART UPGRADES — Priority: HIGH

Our equity chart is a simple filled area. TradingView's is a multi-layer information-dense chart.

| Missing element                   | What it adds                                                                                                                                                                                                                                                         | Priority |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Buy & Hold line overlay**       | Green dashed line for buy-and-hold benchmark. Currently we show it as text ("vs Buy & Hold +28.4%") but NOT as a visual line on the chart. Jane Street / Citadel quants need to see the visual divergence — when did strategy alpha emerge vs the passive benchmark. | HIGH     |
| **Trade markers on equity curve** | Green (win) and red (loss) bars at the x-position of each trade on the equity chart. TradingView shows these as a histogram-like overlay below/above the equity line. This immediately shows trade frequency, win/loss clustering, and drawdown correlation.         | HIGH     |
| **Drawdown as fill under equity** | TradingView renders drawdown as a red-shaded area below the equity line (same chart, not separate). Our drawdown chart is in the Performance tab as a separate chart. Consider: drawdown _below_ the equity in the same chart (toggle: "Runup/Drawdowns" checkbox).  | MEDIUM   |
| **Chart layer toggles**           | TradingView has checkboxes: Equity, Buy & Hold, Trade executions, Runup/Drawdowns — each toggleable. Our chart is static — no toggles.                                                                                                                               | HIGH     |

### 3.2 PROFIT STRUCTURE & BENCHMARKING — Priority: HIGH

TradingView has a dedicated "Performance" accordion with two visual charts that we completely lack.

| Missing element                  | What it adds                                                                                                                                                                                | Priority |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Profit structure bar chart**   | Stacked vertical bars: Total Profit (green) · Total Loss (red) · Commission (grey/blue) · Total P&L (net). Visual breakdown of where money went. We show numbers but no visual.             | HIGH     |
| **Benchmarking chart**           | Stacked area showing strategy P&L curve vs buy-and-hold P&L curve over time, with the gap shaded to show outperformance/underperformance periods.                                           | HIGH     |
| **Benchmark comparison metrics** | Buy & hold return ($, %), Buy & hold % gain, Strategy outperformance/underperformance ($). We have `buy_hold_return_pct` in data but don't show it prominently with a dedicated subsection. | MEDIUM   |

### 3.3 P&L DISTRIBUTION — Priority: HIGH

| Missing element                | What it adds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Priority |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **P&L distribution histogram** | A histogram showing the distribution of per-trade P&L returns (e.g., -4% to +6% in 0.5% buckets), dual-colored (red for loss zone, green for profit zone). With vertical marker lines for "Average Loss" and "Average Profit". This is the single most important chart for understanding risk — it shows if your strategy has fat tails, skew, normal distribution, etc. TradingView makes it prominent. We have a slippage distribution but NOT a P&L distribution. These are fundamentally different. | HIGH     |
| **Win/Loss donut chart**       | Donut/ring chart: Wins count (green), Losses count (red), Break-even (grey). Shows the proportions visually. Quick read for any quant.                                                                                                                                                                                                                                                                                                                                                                  | MEDIUM   |

### 3.4 TRADES ANALYSIS METRICS — Priority: MEDIUM

Our Performance tab has a long/short split table with good metrics. But TradingView adds several we're missing:

| Missing metric                          | Where TradingView shows it | Our status                                                                                             | Priority                               |
| --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Total open trades                       | Trades Analysis > Details  | Missing                                                                                                | LOW (backtest — all trades are closed) |
| Ratio avg win / avg loss                | Trades Analysis > Details  | Missing — we have the raw numbers but not the ratio                                                    | MEDIUM                                 |
| Largest winning trade percent           | Trades Analysis > Details  | Missing                                                                                                | LOW                                    |
| Largest winner as % of gross profit     | Trades Analysis > Details  | Missing — institutional risk metric (concentration risk)                                               | MEDIUM                                 |
| Largest loser as % of gross loss        | Trades Analysis > Details  | Missing — same reason                                                                                  | MEDIUM                                 |
| Avg # bars in trades / winning / losing | Trades Analysis > Details  | We have `avg_trade_duration_hours` but not the bar-count split for winning vs losing trades separately | LOW                                    |

### 3.5 CAPITAL EFFICIENCY — Priority: MEDIUM-HIGH

This is a section TradingView has that we completely lack. For an institutional fund managing millions in AUM, capital efficiency is critical.

| Missing element                     | What it adds                                                                                                                                                    | Priority        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| **Annualised return (CAGR)**        | Compound Annual Growth Rate. Every institutional investor asks for this. We don't show it.                                                                      | HIGH            |
| **Return on initial capital**       | Simple % return over the period. Different from net_profit_pct which is total return — this is on the initial capital base.                                     | MEDIUM          |
| **Account size required**           | Min capital needed (max drawdown $ amount). For position sizing and risk allocation.                                                                            | MEDIUM          |
| **Return on account size required** | How much you'd earn on the minimum capital. Better risk-adjusted picture.                                                                                       | MEDIUM          |
| **Net profit as % of largest loss** | Risk metric — how many worst-case losses can the strategy absorb.                                                                                               | MEDIUM          |
| **Margin usage**                    | Avg/Max margin used, Margin efficiency. For leveraged crypto strategies (perps, futures), this is essential. We trade on Binance/OKX/Bybit — all margin venues. | HIGH for crypto |

### 3.6 RUN-UPS AND DRAWDOWNS — Priority: MEDIUM

| Missing element                                 | What it adds                                                                    | Priority |
| ----------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| **Avg/Max equity run-up** (close-to-close)      | How high does equity climb between dips? Recovery analysis.                     | MEDIUM   |
| **Run-up duration**                             | How long do winning streaks last?                                               | LOW      |
| **Avg drawdown duration**                       | How long are underwater periods? Institutional risk teams ask this.             | HIGH     |
| **Max drawdown intrabar vs close-to-close**     | Shows if worst losses happened intraday (flash crash) vs over multiple periods. | MEDIUM   |
| **Return of max equity drawdown**               | How long to recover from the worst drawdown. Key institutional risk metric.     | HIGH     |
| **Max equity drawdown as % of initial capital** | Another way to express the worst-case scenario.                                 | MEDIUM   |

### 3.7 TRADES LIST ENHANCEMENTS — Priority: MEDIUM

| Missing element                | What it adds                                                                                                                                                                                                                           | Priority |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Entry/Exit paired rows**     | TradingView shows each trade as TWO rows (Entry + Exit) paired together, with the trade # and type on the first row. Our table is one row per event. TradingView's format is much clearer for understanding complete trade lifecycles. | HIGH     |
| **Favourable excursion (MFE)** | Maximum favourable excursion — how far the trade went in your favour before closing. Key for: "am I taking profits too early?"                                                                                                         | HIGH     |
| **Adverse excursion (MAE)**    | Maximum adverse excursion — how far the trade went against you. Key for: "are my stops too tight/loose?"                                                                                                                               | HIGH     |
| **Signal name**                | TradingView shows which signal triggered the trade (e.g., "ShortTP3", "LongTP1", "LongTP2"). We have `signal` as LONG/SHORT/EXIT but not the specific signal variant.                                                                  | MEDIUM   |

### 3.8 UX/LAYOUT — Priority: MEDIUM

| Missing element                     | What it adds                                                                                                                                                                                                                                                                           | Priority   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Hero stat bar that stays pinned** | TradingView pins the top 5 stats (Total P&L, Max DD, Total Trades, Profitable %, Profit Factor) — they're always visible. Our stats are at the page top and scroll away.                                                                                                               | MEDIUM     |
| **Collapsible accordion sections**  | TradingView uses expandable sections (Performance, Trades Analysis, Capital Efficiency, Run-ups and Drawdowns). This lets users focus on what matters. Our tab layout is fine for the 5-tab split, but WITHIN each tab, we should consider collapsible sub-sections for dense content. | LOW        |
| **Dual-value display ($ and %)**    | TradingView shows most monetary metrics in both absolute $ AND percentage. We typically show one or the other, not both.                                                                                                                                                               | MEDIUM     |
| **Date range selector**             | TradingView has a date range in the header. Our backtests have fixed date ranges but no way to zoom into a sub-period.                                                                                                                                                                 | LOW for v1 |

---

## 4. What We Have That TradingView DOESN'T

Important: We're not just copying TradingView. Our execution backtest page has domain-specific features that TradingView's generic strategy report doesn't address.

| Our advantage                                      | Why it matters                                                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Execution algorithm comparison** (compare panel) | TradingView backtests ONE strategy. We test the SAME signals through DIFFERENT execution algorithms (TWAP vs VWAP vs Aggressive Limit). This is execution research, not strategy research. |
| **Slippage distribution histogram**                | TradingView doesn't show slippage at all — they assume zero slippage. We model realistic slippage.                                                                                         |
| **Implementation Shortfall decomposition**         | TCA-grade breakdown (delay + market impact + fees). This is institutional-level execution analytics.                                                                                       |
| **Venue breakdown table**                          | Multi-venue execution analytics per venue. Relevant for crypto SOR.                                                                                                                        |
| **Execution algo parameters**                      | Per-algo config (participation rate, urgency, limit offset, etc.).                                                                                                                         |
| **Strategy candidate promotion**                   | Pipeline integration — promoting a result to candidate for the Promote lifecycle tab.                                                                                                      |
| **Multi-venue SOR config**                         | Smart order routing, venue-specific routing, split routing.                                                                                                                                |
| **Market impact modeling**                         | None/Linear/Square-root market impact simulation.                                                                                                                                          |

These are our differentiators. They stay and get enhanced, not removed.

---

## 5. What We DON'T Need From TradingView

Some TradingView features don't apply to our execution backtest context:

| TradingView feature              | Decision                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open trades / open P&L           | **Skip** — backtest = all trades closed. No open positions in a completed backtest.                                                                                                                                      |
| Margin calls                     | **Partially relevant** — extreme slippage can make signals unusable. Backend decides; UI shows what API provides. Don't invent margin logic in frontend, but display margin/usability warnings if the API includes them. |
| Avg # bars in trades             | **INCLUDE** — we run execution backtests on configurable timeframes (5min, 30min, etc.). Bar counts AND time duration both matter. Add `avg_bars_in_trade`, `avg_bars_in_winning_trades`, `avg_bars_in_losing_trades`.   |
| Signal names (LongTP1, ShortTP3) | **Skip** — TradingView pine script paradigm. Our signals are LONG/SHORT/EXIT with model confidence.                                                                                                                      |

---

## 6. Recommended Changes — Prioritised Implementation Plan

### PHASE 1: Chart & Visual Upgrades (HIGH IMPACT)

These changes make the biggest visual and analytical difference.

#### 1A. Enhanced Equity Chart (Overview tab)

**Current:** Simple filled area chart showing equity only.

**Target:** Multi-layer chart with toggleable overlays:

- Equity line (green, filled below)
- Buy & Hold line (dashed, secondary colour — shows passive benchmark)
- Trade markers (bars below the chart — green for winning trades, red for losing trades, height proportional to P&L magnitude)
- Toggle checkboxes above chart: ☑ Equity ☑ Buy & Hold ☑ Trade Markers ☑ Drawdown

**Mock data needed:** Buy-and-hold equity curve (simple: `100000 * (1 + buy_hold_return_pct / 100)` linear interpolation or from price data). Trade markers come from `results.trades[]` (already exist).

**Visual reference:** TradingView screenshot 1 (top chart).

#### 1B. P&L Distribution Histogram (new — Performance tab)

**Current:** Not present. (We have slippage distribution in Execution Quality but NOT P&L distribution.)

**Target:** Dual-color histogram of per-trade P&L returns:

- X-axis: P&L % buckets (e.g., -4% to +6% in 0.5% steps)
- Y-axis: Trade count
- Red bars for negative buckets, green bars for positive buckets
- Vertical dashed lines for "Average Loss" and "Average Profit"
- Legend at bottom: "Loss" (red) · "Profit" (green) · "Average loss: -1.68%" · "Average profit: 3.49%"

**Visual reference:** TradingView screenshot 4 (top-left).

#### 1C. Win/Loss Donut Chart (Performance tab)

**Current:** We show win_rate as a number. No visual.

**Target:** Donut/ring chart next to the P&L distribution:

- Wins (green arc): count + percentage
- Losses (red arc): count + percentage
- Break-even (grey arc, if any): count + percentage
- Centre: total trade count

**Visual reference:** TradingView screenshot 4 (top-right, "Win/loss ratio" donut).

#### 1D. Profit Structure Bar Chart (Performance tab)

**Current:** We show gross_profit, gross_loss, total_commission as numbers in the table.

**Target:** Horizontal or vertical bar chart:

- Green bar: Gross Profit
- Red bar: Gross Loss
- Blue/Grey bar: Commission
- Outlined/net bar: Total P&L
- Simple, clean, institutional. Not flashy — informative.

**Visual reference:** TradingView screenshot 3 (top-left, "Profit structure").

---

### PHASE 2: Metrics & Sections (MEDIUM IMPACT)

#### 2A. Capital Efficiency Section (new — Performance tab)

**Current:** Not present.

**Target:** New collapsible sub-section in the Performance tab:

| Metric                          | All     | Long  | Short |
| ------------------------------- | ------- | ----- | ----- |
| Annualised return (CAGR)        | 28.4%   | 32.1% | 18.7% |
| Return on initial capital       | 41.8%   | 26.1% | 15.7% |
| Account size required           | $12,400 | —     | —     |
| Return on account size required | 337.3%  | —     | —     |
| Net profit as % of largest loss | 19.2x   | —     | —     |

**Mock data needed:** `cagr`, `return_on_initial_capital`, `account_size_required` (= max drawdown $), `return_on_account_size` (= net_profit / account_size_required), `net_profit_as_pct_of_largest_loss`.

#### 2B. Run-ups and Drawdowns Section (new — Performance tab)

**Current:** We have a drawdown chart. But no detailed run-up/drawdown statistics.

**Target:** New collapsible sub-section:

| Metric                               | Value           |
| ------------------------------------ | --------------- |
| **Run-ups**                          |                 |
| Avg equity run-up duration           | 12 days         |
| Avg equity run-up (close-to-close)   | $8,420 (4.2%)   |
| Max equity run-up (close-to-close)   | $18,340 (9.1%)  |
| **Drawdowns**                        |                 |
| Avg equity drawdown duration         | 6 days          |
| Avg equity drawdown (close-to-close) | $4,810 (2.4%)   |
| Max equity drawdown (close-to-close) | $12,400 (12.4%) |
| Max equity drawdown (intrabar)       | $14,200 (14.2%) |
| Recovery from max drawdown           | 8 days          |

**Mock data needed:** `drawdown_stats` and `runup_stats` objects.

#### 2C. Additional Metrics in Trades Analysis

Add to the Performance tab's existing All/Long/Short table:

| Metric                                | Currently         | Action                                      |
| ------------------------------------- | ----------------- | ------------------------------------------- |
| Ratio avg win / avg loss              | Have raw numbers  | Add computed ratio row                      |
| Largest winner as % of gross profit   | Missing           | Add to mock data + table                    |
| Largest loser as % of gross loss      | Missing           | Add to mock data + table                    |
| CAGR                                  | Missing           | Add                                         |
| Avg winning trade ($ AND %)           | Have $ only       | Add % alongside                             |
| Avg losing trade ($ AND %)            | Have $ only       | Add % alongside                             |
| All P&L values dual-display ($ and %) | Show one or other | Show both: "$41,820" + "41.8%" on same cell |

#### 2D. Benchmark Comparison Sub-Section (Performance tab)

Add below the returns table:

| Metric                  | All               |
| ----------------------- | ----------------- |
| Buy & hold return       | $28,400 (28.4%)   |
| Strategy outperformance | +$13,420 (+13.4%) |

---

### PHASE 3: Trades List Enhancements (MEDIUM IMPACT)

#### 3A. Entry/Exit Paired Rows

**Current:** Each event (LONG, EXIT, SHORT, EXIT) is a single row.

**Target:** Group trades into Entry/Exit pairs. Each trade gets a trade number. The entry row shows the opening signal, price, venue. The exit row shows the closing signal, price, P&L. Visual grouping with alternating row backgrounds per trade pair.

**Why:** This is how every institutional trade blotter works. Paired rows let you immediately see the complete lifecycle of a trade: entry → exit → P&L.

#### 3B. MFE/MAE Columns

Add Maximum Favourable Excursion (MFE) and Maximum Adverse Excursion (MAE) to the trades table. These are fundamental execution quality metrics:

- MFE: "My trade went $X in my favour at peak — did I leave money on the table?"
- MAE: "My trade went $X against me at worst — are my stops positioned correctly?"

**Mock data needed:** `mfe_pct` and `mae_pct` per trade.

---

### PHASE 4: UX Polish (LOWER IMPACT, HIGH POLISH)

#### 4A. Pinned Hero Stats Bar

**Current:** Stats scroll away.

**Target:** When user scrolls past the stats row, show a sticky condensed bar at the top of the results panel: "ETH Basis VWAP 2h | P&L +$41,820 | Sharpe 1.94 | DD 12.4% | Win 62.3%"

#### 4B. Dual-Value Display

Systematically show both $ and % for all monetary metrics. Format: `$41,820` with `41.8%` as a secondary line or inline. TradingView does this consistently — it's small but signals institutional polish.

#### 4C. Collapsible Sub-Sections

Within the Performance tab (which is getting denser), add collapsible accordion sub-sections:

- Returns (expanded by default)
- Benchmark Comparison (expanded)
- Capital Efficiency (collapsed by default)
- Run-ups and Drawdowns (collapsed)

---

## 7. Updated Mock Data Requirements

| Field                             | Type                                                                         | Where                                  | Phase |
| --------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------- | ----- |
| `buy_hold_equity_curve`           | `EquityPoint[]`                                                              | `EXECUTION_COMPARE_CURVES` or separate | 1A    |
| `trade_pnl_distribution`          | `{bucket: string, count: number, pct: number}[]`                             | `ExecutionBacktestResults`             | 1B    |
| `avg_profit_pct` / `avg_loss_pct` | `number`                                                                     | `DirectionStats`                       | 1B    |
| `break_even_trades`               | `number`                                                                     | `DirectionStats`                       | 1C    |
| `cagr`                            | `number`                                                                     | `ExecutionBacktestResults`             | 2A    |
| `account_size_required`           | `number`                                                                     | `ExecutionBacktestResults`             | 2A    |
| `return_on_account_size`          | `number`                                                                     | `ExecutionBacktestResults`             | 2A    |
| `net_profit_pct_of_largest_loss`  | `number`                                                                     | `ExecutionBacktestResults`             | 2A    |
| `drawdown_stats`                  | `{avg_duration_days, avg_dd_pct, max_dd_close, max_dd_intra, recovery_days}` | `ExecutionBacktestResults`             | 2B    |
| `runup_stats`                     | `{avg_duration_days, avg_runup_pct, max_runup_close, max_runup_intra}`       | `ExecutionBacktestResults`             | 2B    |
| `largest_winner_pct_of_gross`     | `number`                                                                     | `DirectionStats`                       | 2C    |
| `largest_loser_pct_of_gross`      | `number`                                                                     | `DirectionStats`                       | 2C    |
| `ratio_avg_win_loss`              | `number`                                                                     | `DirectionStats`                       | 2C    |
| `mfe_pct` / `mae_pct` per trade   | `number`                                                                     | `ExecutionTrade`                       | 3B    |

---

## 8. What Must NOT Change

- Page route: `/services/research/execution`
- Left-list + right-results layout
- 5-tab structure (Overview, Performance, Trades, Execution Quality, Config)
- Our differentiators: Algo comparison, Slippage histogram, IS decomposition, Venue breakdown, Strategy Candidate promotion
- Mock data location in `lib/build-mock-data.ts`

---

## 9. Vision Summary

### Where we are now

A solid execution backtesting page with 5 result tabs, algo comparison, slippage distribution, IS breakdown, venue analytics, and strategy candidate promotion. Functional but data-table-heavy, light on visual analytics.

### Where we're going

A page that would make a Citadel quant feel at home. The execution backtest report should be the most information-dense, visually rich screen in the entire platform. When a portfolio manager clicks on a backtest result, they should see:

1. **At a glance** (< 2 seconds): Is this strategy worth deploying? Hero stats + equity chart with benchmark overlay + trade marker density.
2. **Deep dive** (< 30 seconds): Performance by direction, P&L distribution shape, profit structure, capital efficiency, drawdown recovery.
3. **Execution quality** (our differentiator): Slippage distribution, IS decomposition, venue-level fill analysis — things TradingView doesn't even attempt.
4. **Trade-level forensics** (when needed): Entry/exit paired rows with MFE/MAE, each trade inspectable.

The combination of TradingView-calibre analytics + institutional-grade execution quality metrics + pipeline-integrated strategy promotion is what no other platform offers. BlackRock has execution analytics but not strategy backtesting. TradingView has backtesting but no execution modeling. We have both, in one screen, connected to the full research pipeline.

### Implementation priority

Phase 1 (chart & visual upgrades) delivers 70% of the perceived quality improvement. The enhanced equity chart with overlays and the P&L distribution histogram are the two highest-impact changes. Phase 2 adds institutional depth. Phase 3 polishes the trade log. Phase 4 is UX refinement.

---

## 10. Open Questions — RESOLVED

All questions answered by user (2026-03-25).

| #   | Question                                                                   | Decision                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Performance tab density — collapsible within Performance, or separate tab? | **Important metrics in grouped cards; use best judgement for layout.** Keep in Performance tab. Use metric cards for the most important values; secondary detail in collapsible sub-sections.                                     |
| 2   | P&L Distribution placement                                                 | **Top of Performance tab** (option A) — most visible.                                                                                                                                                                             |
| 3   | Profit structure chart — bar chart or horizontal segments?                 | **Both — provide a toggle** to switch between full bar chart and compact horizontal segments.                                                                                                                                     |
| 4   | Entry/Exit paired trade rows — v1 or v2?                                   | **Definitely v1.** Implement now.                                                                                                                                                                                                 |
| 5   | Chart library                                                              | **TradingView Lightweight Charts** (already installed as `lightweight-charts@^5.1.0`, existing wrapper at `components/trading/candlestick-chart.tsx`). Fall back to recharts if something isn't possible with Lightweight Charts. |

### Additional corrections from user review

- **Bar count metrics**: We DO care about bar counts. Execution backtests run on configurable timeframes (e.g., "execute full signal in next 5 minutes" vs "next 30 minutes"). We care about both bar counts and time duration. Add `avg_bars_in_trade`, `avg_bars_in_winning_trades`, `avg_bars_in_losing_trades` to metrics.
- **Margin calls**: Partially relevant — if slippage is extreme, signals may become unusable. However, this is decided by the backend; UI only displays what the API provides. Include margin/usability warning fields in mock data if the API sends them, but don't invent margin logic in the frontend.

---

## 11. Implementation Status & Delegation Guide

_Updated 2026-03-25_

### What Was Done (architectural bridge — completed)

The **core architectural work** has been completed: a data adapter and shared component integration that lets the Execution tab reuse every shared `components/research/` component built for the Strategies tab, without modifying any shared component.

#### Files created

1. **`lib/execution-analytics-adapter.ts`** — Bridge function `executionResultsToAnalytics(r, equityCurve)`.
   - Takes `ExecutionBacktestResults` + `ExecEquityPoint[]` (from `build-mock-data.ts`)
   - Returns `BacktestAnalytics` (from `backtest-analytics-types.ts`)
   - Helper functions: `mapDirectionStats`, `convertEquityCurve`, `extractTradeMarkers`, `buildPnlDistribution`, `buildMonthlyReturns`
   - Derives values not in the execution model: `avg_bars_in_winning/losing`, `CapitalEfficiency`, `RunupDrawdownStats`, `BenchmarkComparison`, `MonthlyReturn[]`, `PnlBucket[]`, `KpiBarItem[]`
   - Some derived values use approximations (e.g., `cagr_long = cagr * 0.65`). When the backend API provides real values, replace these with API data.

#### Files modified

2. **`app/(platform)/services/research/execution/page.tsx`** — `ResultsView` component refactored:
   - **KpiBar** added above the Tabs container (hero stats always visible at top of results)
   - **Overview tab**: `recharts` AreaChart replaced with `EquityChartWithLayers` (TradingView Lightweight Charts, multi-layer with toggles)
   - **Performance tab**: Hand-rolled tables replaced with `PerformanceSection` + `MonthlyReturnsHeatmap` + `CapitalEfficiencySection` + `RunupsDrawdownsSection`
   - **Trades tab**: `TradesAnalysisSection` (P&L distribution + win/loss donut) added above the existing trade log table
   - **Execution Quality** and **Config** tabs: unchanged (execution-specific content, no shared component analogue)
   - Removed: `recharts` AreaChart/Area imports, unused `TrendingUp` icon

### Tab structure decision

The team chose to **keep the existing 5-tab layout** (Overview, Performance, Trades, Execution Quality, Config). Do NOT switch to TradingView-style collapsible accordion sections. The Strategies page uses accordions — keeping both layouts lets the team compare approaches before choosing one.

### What Remains — Delegated Tasks

Each task below is independently implementable. They do NOT depend on each other. An agent can pick any task and complete it in isolation.

#### TASK A: Entry/Exit Paired Trade Rows (Phase 3A — HIGH priority)

**File:** `page.tsx` → Trades tab → existing `<Table>` (around line 990–1040)

**Current:** One row per event (LONG, EXIT, SHORT, EXIT). Each row is flat.

**Target:** Group trades into Entry/Exit pairs. Each trade pair gets a trade number (#). Entry row shows opening signal, price, venue. Exit row shows closing signal, price, P&L. Alternate row backgrounds per pair for visual grouping.

**How:**

1. In `ResultsView`, after the existing `r.trades` reference, write a grouping function that pairs consecutive LONG→EXIT and SHORT→EXIT events.
2. Render each pair as two `<TableRow>` elements with a shared visual group (e.g., alternating `bg-muted/50`).
3. Show trade # on the first row of each pair, span into the second row.
4. Keep all existing columns. The current table structure is fine — just group the rows.

**Mock data note:** `r.trades` already has alternating LONG→EXIT / SHORT→EXIT events. The pairing logic can iterate sequentially.

#### TASK B: MFE/MAE Columns (Phase 3B — HIGH priority)

**Files:**

- `lib/build-mock-data.ts` — Add `mfe_pct` and `mae_pct` fields to `ExecutionTrade` interface and generate mock values for each trade in `EXECUTION_BACKTESTS[*].trades[]`.
- `page.tsx` → Trades tab `<Table>` — Add two columns: "MFE" and "MAE" with conditional coloring.

**How:**

1. In `build-mock-data.ts`, extend the `ExecutionTrade` type: `mfe_pct: number; mae_pct: number;`
2. Generate realistic mock values: MFE between 0.5% and 8% for winning trades, MAE between 0.1% and 5% for losing trades.
3. In the trades table, add columns after "P&L" and before "Cumulative P&L".
4. Color: green for high MFE (left money on the table indicator), red for high MAE (stop too loose indicator).

#### TASK C: Pinned Hero Stats Bar (Phase 4A — MEDIUM priority)

**File:** `page.tsx` → `ResultsView`

**Current:** `KpiBar` is static at the top of the results area. When user scrolls, it scrolls away.

**Target:** Make the KpiBar sticky. When the user scrolls past it, it should remain pinned at the top of the results panel.

**How:** Wrap the `<KpiBar>` in a `sticky top-0 z-10 bg-background` container. The `ResultsView` container may need `overflow-y-auto` if not already set. Test that the sticky behavior works within the two-panel layout (left list + right results).

#### TASK D: Dual-Value Display (Phase 4B — MEDIUM priority)

**File:** `lib/execution-analytics-adapter.ts` — may need extended data, but mostly a display change in the shared components or the execution page's metric cards.

**Current:** Most monetary metrics show either $ or %. TradingView shows both.

**Target:** For key metrics (Net Profit, Gross Profit, Gross Loss, Avg Winning Trade, Avg Losing Trade, Largest Win, Largest Loss), show both formats: `$41,820` with `+41.8%` as a secondary line.

**How:** This is primarily a display change in the components that render the three-column table (shared `PerformanceSection`). Check if the shared component already supports dual display. If not, either:

- Extend the shared component (preferred if Strategies tab also benefits)
- Or override at the Execution page level (if Strategies tab doesn't want it)

#### TASK E: Profit Structure Toggle Chart (Phase 1D — MEDIUM priority)

**Current:** Gross Profit, Gross Loss, and Commission are shown as numbers in the performance table.

**Target:** A dedicated bar chart showing the profit structure (Gross Profit green, Gross Loss red, Commission blue, Net P&L outlined). User requested a toggle between full vertical bar chart and compact horizontal segments.

**How:**

1. Create a new component `components/research/profit-structure-chart.tsx` (or add to existing shared components).
2. Use recharts `BarChart` for vertical mode, horizontal stacked bar for compact mode.
3. Add a toggle (small icon button) in the top-right of the chart container.
4. Data comes from `analytics.performance_by_direction.all`: `gross_profit`, `gross_loss`, `commission_paid`, `net_profit`.

#### TASK F: Benchmark Comparison Visual (Phase 1 — MEDIUM priority)

**Current:** Buy-and-hold is shown as a line overlay on the equity chart (via `EquityChartWithLayers`). The `BenchmarkComparison` object exists in the adapter output but has no dedicated visual section.

**Target:** Below the equity chart in the Overview tab or as a sub-section in Performance, show:

- Buy & Hold Return: $X (X%)
- Strategy Outperformance: +$X (+X%)
- Optional: stacked area chart showing the gap between strategy and benchmark over time.

**How:** Data is already available in `analytics.benchmark`. Create a small card or sub-section. The shaded area chart is lower priority — the numeric comparison is sufficient for v1.

### Pre-existing lint notes

Lines 1077-1091 in `page.tsx` have `'data' is of type 'unknown'` errors from `Object.entries(r.venue_breakdown)`. These pre-date the shared component integration. To fix: cast the venue breakdown type or type the `Object.entries` call:

```typescript
Object.entries(
  r.venue_breakdown as Record<
    string,
    {
      fills: number;
      avg_slippage_bps: number;
      maker_pct: number;
      avg_fill_time_s: number;
    }
  >,
);
```

### Shared component reference

All shared components live in `components/research/` and export from `components/research/index.ts`:

- `KpiBar` — hero stats bar, takes `items: KpiBarItem[]`
- `EquityChartWithLayers` — TradingView Lightweight Charts wrapper, takes `equityCurve`, `tradeMarkers`, `height`
- `PerformanceSection` — three-column All/Long/Short table with Returns, Ratios, Trades sections
- `TradesAnalysisSection` — P&L distribution histogram + win/loss donut + summary stats
- `CapitalEfficiencySection` — CAGR, return on capital, account size required
- `RunupsDrawdownsSection` — run-up and drawdown statistics tables
- `MonthlyReturnsHeatmap` — month × year return heatmap
- `PnlDistributionHistogram` — standalone P&L distribution (used inside TradesAnalysisSection)
- `WinLossDonut` — standalone donut chart (used inside TradesAnalysisSection)

Data types: `lib/backtest-analytics-types.ts` — all interfaces documented inline.

### Adapter reference

`lib/execution-analytics-adapter.ts` exports:

```typescript
function executionResultsToAnalytics(
  r: ExecutionBacktestResults,
  equityCurve: ExecEquityPoint[],
): BacktestAnalytics;
```

The adapter is used in `ResultsView` via:

```typescript
const analytics = React.useMemo(
  () => executionResultsToAnalytics(r, equityCurve),
  [r, equityCurve],
);
```

To extend: add fields to `BacktestAnalytics` (in `backtest-analytics-types.ts`), populate them in the adapter, and consume them in the relevant shared component or page-level component.
