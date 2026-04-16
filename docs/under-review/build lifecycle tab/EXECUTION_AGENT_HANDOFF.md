# Execution Tab — Agent Handoff Document

> **For:** The agent that will implement the Execution tab redesign
> **From:** The Strategies tab agent (completed 2026-03-25)
> **Read alongside:** `EXECUTION_TAB_SPEC.md`, `TRADINGVIEW_AUDIT.md`, `STRATEGIES_PAGE_SPEC.md`

---

## 1. What Was Done (Strategies Tab)

The Strategies page (`/services/research/strategies`) was rewritten with:

- **Two-panel layout:** Left = backtest card-list, Right = detail/compare panel
- **Accordion detail view** (not tabs) — matching TradingView's pattern
- **KPI bar** pinned at top of detail panel (5 numbers: P&L, Max DD, Signals, Win Rate, Profit Factor)
- **Equity chart with 4 toggleable layers** (Equity, Buy & Hold, Signal Markers, Drawdowns)
- **5 collapsible accordion sections:** Performance, Signals Analysis, Capital Efficiency, Run-ups & Drawdowns, Configuration
- **Metrics/Signals toggle** at the top (like TV's Metrics / List of Trades)
- **Signal list view** with MFE/MAE, confidence, regime columns
- **Confidence Distribution** histogram + regime performance breakdown (our additions over TV)

---

## 2. Shared Components — READY TO USE

All shared components live in `components/research/`. They are designed for both tabs.

| Component                    | File                             | Props                                                                                          | Notes                                                                                                                              |
| ---------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **KpiBar**                   | `kpi-bar.tsx`                    | `items: KpiBarItem[]`                                                                          | 5-number pinned bar. For Execution: change labels to "Total Trades", "Fill Rate" instead of "Total Signals", "Win Rate"            |
| **EquityChartWithLayers**    | `equity-chart-with-layers.tsx`   | `equityCurve: EquityPoint[]`, `tradeMarkers: TradeMarker[]`                                    | 4 toggleable layers via Lightweight Charts v5. For Execution: change "Signal Markers" label to "Trade Markers" via `initialLayers` |
| **PerformanceSection**       | `performance-section.tsx`        | `all/long/short: DirectionPerformance`, `benchmark: BenchmarkComparison`                       | Profit Structure bar chart + Returns table (All/Long/Short) + Benchmark + Risk-adjusted. Drop-in for Execution.                    |
| **TradesAnalysisSection**    | `trades-analysis-section.tsx`    | `all/long/short: DirectionPerformance`, `pnlBuckets`, `avgProfitPct/avgLossPct`, `signalMode?` | P&L Distribution histogram + Win/Loss donut + Details table. Set `signalMode={false}` for Execution (uses "trades" labels).        |
| **CapitalEfficiencySection** | `capital-efficiency-section.tsx` | `data: CapitalEfficiency`, `showMargin?`                                                       | For Execution: set `showMargin={true}` to show margin usage section.                                                               |
| **RunupsDrawdownsSection**   | `runups-drawdowns-section.tsx`   | `data: RunupDrawdownStats`                                                                     | Identical for both tabs.                                                                                                           |
| **ProfitStructureChart**     | `profit-structure-chart.tsx`     | `grossProfit/grossLoss/commission/netPnl`                                                      | Used inside PerformanceSection. Can also be used standalone.                                                                       |
| **PnlDistributionHistogram** | `pnl-distribution-histogram.tsx` | `buckets: PnlBucket[]`, `avgProfitPct/avgLossPct`                                              | Red/green dual-color histogram. Used inside TradesAnalysisSection.                                                                 |
| **WinLossDonut**             | `win-loss-donut.tsx`             | `wins/losses/breakEven`                                                                        | Donut chart. Used inside TradesAnalysisSection.                                                                                    |

### Barrel export

```typescript
import {
  KpiBar,
  EquityChartWithLayers,
  PerformanceSection,
  TradesAnalysisSection,
  CapitalEfficiencySection,
  RunupsDrawdownsSection,
  MonthlyReturnsHeatmap,
  SignalConfidenceHistogram,
  RegimePerformanceMini,
  OverlaidEquityCurves,
  SignalOverlayChart,
  SignalOverlapPanel,
} from "@/components/research";
```

### Strategies → Execution query params (handoff)

The Strategies tab links to `/services/research/execution` with:

| Query                 | Meaning                                                 |
| --------------------- | ------------------------------------------------------- |
| `from=strategies`     | Show the handoff banner on the Execution page           |
| `strategyBacktestId`  | Primary backtest id (single send, or “best” in compare) |
| `strategyBacktestIds` | Comma-separated ids when sending a compare set          |

The Execution page reads these with `useSearchParams()` and shows a read-only banner until the execution API consumes them.

---

## 3. Shared Types

All shared types live in `lib/backtest-analytics-types.ts`:

- `DirectionPerformance` — All | Long | Short metrics (31 fields each)
- `EquityPoint` — `{ time, equity, buy_hold, drawdown_pct }`
- `TradeMarker` — `{ time, direction, pnl, pnl_pct }`
- `PnlBucket` — `{ bucket, min_pct, max_pct, count }`
- `CapitalEfficiency` — CAGR, account size required, return on account size, etc.
- `RunupDrawdownStats` — run-up/drawdown stats with intrabar vs close-to-close
- `BenchmarkComparison` — buy & hold return, strategy outperformance
- `KpiBarItem` — `{ label, value, sub_value?, color? }`
- `BacktestAnalytics` — full bundle combining all of the above

### Mock data generators

`lib/backtest-analytics-mock.ts` exports:

- `generateBacktestAnalytics(seed, opts?)` — generates a complete `BacktestAnalytics` bundle
- `generateEquityCurve(seed, days, initialCapital, targetReturn)` — standalone curve generator
- `generateTradeMarkers(seed, days, avgTradesPerDay)` — trade/signal marker positions
- `generatePnlDistribution(seed, totalTrades)` — P&L bucket histogram data
- `generateDirectionPerformance(seed, totalTrades, netProfit)` — All/Long/Short metrics
- `generateCapitalEfficiency(seed, netProfit, maxDrawdown)`
- `generateRunupDrawdownStats(seed)`
- `generateBenchmark(seed, strategyReturn)`

All are seeded for deterministic output. Use different seeds for different backtests.

---

## 4. How to Use in the Execution Tab

### 4.1 Page Structure Target

```
┌──────────────────────────────────────────────────┐
│  KPI BAR: Net P&L | Max DD | Trades | Fill Rate  │
│           | Profit Factor                         │
├──────────────────────────────────────────────────┤
│  EQUITY CHART (4 toggleable layers)              │
│    [✓] Equity  [✓] Buy & Hold                   │
│    [✓] Trade markers  [ ] Runup/Drawdowns        │
├──────────────────────────────────────────────────┤
│  ▶ Performance (accordion)                       │
│  ▶ Trades Analysis (accordion)                   │
│  ▶ Execution Quality (YOUR ADDITION — keep this) │
│  ▶ Capital Efficiency (accordion, showMargin=true)│
│  ▶ Run-ups & Drawdowns (accordion)              │
│  ▶ Configuration (accordion)                     │
├──────────────────────────────────────────────────┤
│  [List of Trades] toggle at top                  │
└──────────────────────────────────────────────────┘
```

### 4.2 Differences from Strategies Tab

| Aspect                                | Strategies                                       | Execution                                                                     |
| ------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| KPI labels                            | Total Signals, Hit Rate                          | Total Trades, Fill Rate                                                       |
| TradesAnalysisSection `signalMode`    | `true`                                           | `false`                                                                       |
| CapitalEfficiencySection `showMargin` | `false`                                          | `true`                                                                        |
| Extra accordion section               | Confidence Distribution + Regime Performance     | **Execution Quality** (slippage histogram, IS decomposition, venue breakdown) |
| Trade list                            | Signal list (confidence, regime)                 | Trade entry/exit pairs (slippage, fill time, venue, MFE/MAE)                  |
| Compare panel                         | Signal quality comparison + signal overlay chart | Algo comparison (TWAP vs VWAP vs Aggressive)                                  |

### 4.3 Execution Quality Section — NOT Shared

The "Execution Quality" accordion section is Execution-tab-only. It contains:

1. Slippage Distribution Histogram (already exists in current page)
2. Implementation Shortfall Decomposition (already exists)
3. Venue Breakdown Table (already exists)

These should remain as they are — they are NOT in the shared components because they're execution-specific.

### 4.4 Mock Data for Execution

Use `generateBacktestAnalytics(seed, { label: "execution", ... })` to generate the shared
analytics bundle. This sets the KPI label to "Total Trades" instead of "Total Signals".

For execution-specific mock data (slippage, IS decomposition, venue breakdown), continue using
the existing mock data in `lib/build-mock-data.ts`.

---

## 5. Chart Library Notes

### Lightweight Charts v5

- **Package:** `lightweight-charts@^5.1.0` (already installed)
- **Existing wrapper:** `components/trading/candlestick-chart.tsx` — for OHLCV data
- **New wrapper:** `components/research/equity-chart-with-layers.tsx` — for equity curves

The equity chart uses `LineSeries` (not `CandlestickSeries`). It creates 4 series on one chart:

1. `LineSeries` for equity (green, lineWidth 2)
2. `LineSeries` for buy & hold (indigo, dashed)
3. `HistogramSeries` for trade markers (green/red, bottom 15%)
4. `HistogramSeries` for drawdown fill (red, bottom 20%)

Each series has a `visible` property toggled by checkboxes.

#### Time ordering (do not skip)

Lightweight Charts requires **strictly ascending** `time` for every series passed to `setData`.
Duplicate UNIX timestamps (e.g. several markers on the same second) throw at runtime:
`Assertion failed: data must be asc ordered by time`.

- **Shared helper:** `lib/lightweight-charts-series.ts` exports `bumpDuplicateTimes` — sorts by time,
  then bumps ties so each row is strictly greater than the previous (typically +1 second).
- **Call sites:** `equity-chart-with-layers.tsx`, `overlaid-equity-curves.tsx`, `signal-overlay-chart.tsx`
  all normalize series before chart updates.
- **Mocks/API:** When generating OHLC, equity, or marker points, avoid duplicate `time` values at the
  source where possible; still run through `bumpDuplicateTimes` at the chart boundary for safety.

### Recharts

Used for P&L Distribution Histogram and Win/Loss Donut (inside `components/research/`).
The equity chart uses Lightweight Charts because it handles time-series financial data better.

---

## 6. Caveats and Known Issues

1. **Accordion component** — Uses `@radix-ui/react-accordion` via `components/ui/accordion.tsx`.
   Already exists, no need to install anything.

2. **The Checkbox** inside EquityChartWithLayers uses `@/components/ui/checkbox`. Ensure it's
   in your component imports.

3. **`BacktestAnalytics.kpi` labels** — The KPI bar receives an array of `KpiBarItem`. The labels
   are set by the caller, not hardcoded in the component. So you control what the bar shows.

4. **Dark theme** — All components assume a dark theme (same as the rest of the platform).
   Colors use Tailwind classes (`text-emerald-400`, `text-red-400`) and CSS variables
   (`hsl(var(--card))`). No light theme adaptation needed.

5. **Responsive** — The accordion sections stack vertically. Tables use `overflow-x-auto` for
   horizontal scrolling on narrow screens. The two-panel layout uses `flex` with a fixed-width
   left panel (340px) and flex-1 right panel.

6. **TypeScript strict mode** — All components are fully typed. No `any` usage. Import types
   from `@/lib/backtest-analytics-types`.

---

## 7. Files Created/Modified (Full List)

### New files

| File                                                 | Purpose                                              |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `lib/backtest-analytics-types.ts`                    | Shared types for both tabs                           |
| `lib/backtest-analytics-mock.ts`                     | Shared mock data generators                          |
| `lib/lightweight-charts-series.ts`                   | `bumpDuplicateTimes` — LWCharts ascending-time guard |
| `components/research/kpi-bar.tsx`                    | Pinned KPI bar                                       |
| `components/research/equity-chart-with-layers.tsx`   | 4-layer equity chart (Lightweight Charts)            |
| `components/research/profit-structure-chart.tsx`     | Gross profit/loss/commission bar chart               |
| `components/research/pnl-distribution-histogram.tsx` | P&L distribution (Recharts)                          |
| `components/research/win-loss-donut.tsx`             | Win/Loss/Break-even donut (Recharts)                 |
| `components/research/performance-section.tsx`        | Full Performance accordion content                   |
| `components/research/trades-analysis-section.tsx`    | Full Trades Analysis accordion content               |
| `components/research/capital-efficiency-section.tsx` | Capital Efficiency section                           |
| `components/research/runups-drawdowns-section.tsx`   | Run-ups & Drawdowns section                          |
| `components/research/index.ts`                       | Barrel export                                        |

### Modified files

| File                                                   | What Changed                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `lib/strategy-platform-types.ts`                       | Added `StrategySignal`, `SignalQualityMetrics`, `SignalOverlapMetrics` |
| `lib/strategy-platform-mock-data.ts`                   | Added signal generators, precomputed analytics map                     |
| `app/(platform)/services/research/strategies/page.tsx` | Full rewrite — two-panel + accordion                                   |

---

## 8. What Remains for the Execution Tab Agent

### Must do

1. **Restructure** the existing execution results view from 5-tab to accordion layout
2. **Add Long/Short/All split** to Performance tab (currently only "All" column)
3. **Add P&L Distribution + Win/Loss Donut** to Trades Analysis section
4. **Add Capital Efficiency section** with `showMargin={true}`
5. **Add Run-ups & Drawdowns section**
6. **Add equity chart layer toggles** (replace current static equity chart)
7. **Add KPI bar** at top of results panel
8. **Add Metrics / List of Trades toggle** at the top

### Keep as-is

- Slippage Distribution Histogram
- Implementation Shortfall Decomposition
- Venue Breakdown Table
- Strategy Candidate Promotion flow
- Compare panel (algo comparison: TWAP vs VWAP)
- Left-list + right-results two-panel layout

### Phase 3 additions (Trades List)

- Entry/Exit paired rows (per `EXECUTION_TAB_SPEC.md` §3A)
- MFE/MAE columns (per §3B)
- Cumulative P&L column
- These are NOT in the shared components — they're execution-specific trade log features

---

## 9. Pre-review QA (Build lifecycle / research)

- **Row-2 tabs:** `BUILD_TABS` in `components/shell/service-tabs.tsx` only link to routes that exist under `app/(platform)/services/research/`.
- **Handoff query params:** `from=strategies`, `strategyBacktestId`, `strategyBacktestIds` — Execution page shows a banner + link back to Strategy Backtests.
- **Primary actions:** Strategy “New Backtest” dialog defaults the template `Select` to the first template when opened; Execution “Export CSV” on the Trades tab downloads trade rows; Strategy heatmap Export downloads the grid CSV; Fullscreen uses the Fullscreen API with toast feedback.
- **Typecheck / lint:** `npx tsc --noEmit` and ESLint on touched files before review.

## 10. Context Files to Read

1. **This document** — you're reading it
2. **`EXECUTION_TAB_SPEC.md`** — full spec with gap analysis and implementation plan
3. **`TRADINGVIEW_AUDIT.md`** — TV comparison, section structure recommendations
4. **`lib/backtest-analytics-types.ts`** — shared types
5. **`lib/backtest-analytics-mock.ts`** — mock data generators
6. **`components/research/index.ts`** — barrel export of all shared components
7. **Existing execution page:** `app/(platform)/services/research/execution/page.tsx`
8. **Existing execution mock data:** `lib/build-mock-data.ts`
