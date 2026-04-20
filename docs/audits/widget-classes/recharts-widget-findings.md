# § 1 — Recharts Widgets Audit Findings

**Date:** 2026-04-16
**Auditor:** Claude Agent (BP-2)
**Widget count:** 10
**Decision:** No base widget, no reference pattern. These 10 widgets are too different in layout, purpose, and schema to share a meaningful base class or a single reference to propagate from. Each widget is improved individually. Phase 1 fixes complete.

---

## 1. Files Audited

| #   | Widget ID                   | File                                                           | Lines | Chart Types                                             |
| --- | --------------------------- | -------------------------------------------------------------- | ----- | ------------------------------------------------------- |
| 1   | `risk-var-chart`            | `components/widgets/risk/risk-var-chart-widget.tsx`            | 83    | BarChart + Cell                                         |
| 2   | `risk-term-structure`       | `components/widgets/risk/risk-term-structure-widget.tsx`       | 63    | BarChart (stacked)                                      |
| 3   | `risk-exposure-attribution` | `components/widgets/risk/risk-exposure-attribution-widget.tsx` | 172   | LineChart (embedded in table widget)                    |
| 4   | `risk-greeks-summary`       | `components/widgets/risk/risk-greeks-summary-widget.tsx`       | 196   | LineChart (dual Y-axis)                                 |
| 5   | `risk-margin`               | `components/widgets/risk/risk-margin-widget.tsx`               | 188   | AreaChart + ReferenceLine                               |
| 6   | `pnl-time-series`           | `components/widgets/pnl/pnl-time-series-widget.tsx`            | 302   | LineChart (factor lines) + LineChart (backtest vs live) |
| 7   | `pnl-factor-drilldown`      | `components/widgets/pnl/pnl-factor-drilldown-widget.tsx`       | 196   | AreaChart (stacked by strategy)                         |
| 8   | `markets-latency-detail`    | `components/widgets/markets/markets-latency-detail-widget.tsx` | 258   | AreaChart (p50/p95/p99 overlay)                         |
| 9   | `defi-yield-chart`          | `components/widgets/defi/defi-yield-chart-widget.tsx`          | 202   | AreaChart + LineChart (multi-strategy)                  |
| 10  | `risk-kpi-strip`            | `components/widgets/risk/risk-kpi-strip-widget.tsx`            | 421   | LineChart (3 separate sparkline-style charts)           |

---

## 2. Why No Base Widget

The original spec grouped these 10 widgets as "recharts-chart class" assuming they share enough structure for a common base. After auditing every file:

- **5 of 10 are hybrids** where the chart is a minor embedded section inside a larger KPI/table/collapsible layout. A chart base would wrap <20% of the widget.
- **Each widget has completely different layout, data shape, and interaction model.** The only shared code is Recharts boilerplate (ResponsiveContainer, Tooltip styling, CartesianGrid) which is better addressed with shared constants, not a base component.
- **Forcing a base adds indirection without reducing complexity.**

### What IS shared (can be extracted as constants, not a base)

| Pattern              | Coverage | Candidate                      |
| -------------------- | -------- | ------------------------------ |
| Tooltip contentStyle | 9/10     | `CHART_TOOLTIP_STYLE` constant |
| CartesianGrid props  | 10/10    | `CHART_GRID_PROPS` constant    |
| Axis stroke/font     | 10/10    | `CHART_AXIS_DEFAULTS` constant |
| Legend fontSize      | 6/10     | `CHART_LEGEND_STYLE` constant  |

These can be extracted into a shared `lib/config/chart-theme.ts` if needed in future. Not blocking — each widget is handled individually.

---

## 3. Issues to Fix (Phase 1)

### 3.1 Mock Import Violations (§ 0.3)

| Widget             | Import                                                                                                        | Fix                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `risk-kpi-strip`   | `import { MOCK_PORTFOLIO_DELTA, STRATEGY_RISK_PROFILES } from "@/lib/mocks/fixtures/defi-risk"`               | Already in `defi-data-context` — consume from `useRiskData()` or add to risk context           |
| `risk-kpi-strip`   | `import { getFilledDefiOrders } from "@/lib/api/mock-trade-ledger"`                                           | Ledger-derived data belongs in data context; widget should read from context                   |
| `defi-yield-chart` | `import { generateAllYieldSeries, generateYieldSummary } from "@/lib/mocks/generators/defi-yield-generators"` | Move generation into `defi-data-context.tsx`; widget consumes `yieldSeries` and `yieldSummary` |

**Spec correction:** The migration spec stated "None of these widgets import mocks directly" — this is wrong. 2 of 10 do.

### 3.2 Inline Mock Data

| Widget            | Constant                | Rows | Fix                                                 |
| ----------------- | ----------------------- | ---- | --------------------------------------------------- |
| `pnl-time-series` | `BACKTEST_VS_LIVE_DATA` | 14   | Move to `pnl-data-context.tsx` as `backtestVsLive`  |
| `risk-kpi-strip`  | `DEFI_RISK_TIME_SERIES` | 7    | Move to `risk-data-context` as `defiRiskTimeSeries` |

### 3.3 Error Boundary — Missing Retry Button

`WidgetErrorBoundary` in `widget-wrapper.tsx:29-52` works but has no Retry button. The class component needs a `resetErrorBoundary` mechanism (clear error state + re-render children).

### 3.4 Missing Loading State (0/10)

No widget checks `isLoading` from its data context. Context availability:

| Context                | Exposes `isLoading` | Exposes `error`                              |
| ---------------------- | ------------------- | -------------------------------------------- |
| `risk-data-context`    | Yes (`isLoading`)   | Yes (`hasError`)                             |
| `pnl-data-context`     | Yes (`isLoading`)   | Handled at provider level (renders error UI) |
| `markets-data-context` | Yes (`isLoading`)   | No                                           |
| `defi-data-context`    | No                  | No                                           |

For risk/pnl/markets widgets, we can wire `isLoading` immediately. For `defi-yield-chart`, the defi context doesn't expose loading — mock data is synchronous.

### 3.5 Missing Empty State (8/10)

Only `risk-term-structure` and `markets-latency-detail` guard against empty data. The other 8 render empty charts silently.

### 3.6 Widget-local Mock Logic in risk-kpi-strip

`useLedgerVersion()` and `useHasDefiStrategies()` subscribe to `window` events (`mock-order-filled`, `mock-ledger-reset`) directly in the widget. This mock-specific event wiring belongs in the data context.

---

## 4. Cross-Cutting Requirements Status

| Requirement            | Status       | Notes                                                                                    |
| ---------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| § 0.1 Error Boundary   | Exists       | In `widget-wrapper.tsx`. Missing Retry button.                                           |
| § 0.2 Loading Skeleton | Not done     | 0/10 widgets handle loading. 3/4 data contexts expose `isLoading`.                       |
| § 0.3 Mock Cleanup     | 2 violations | `risk-kpi-strip` and `defi-yield-chart`.                                                 |
| § 0.4 Dead Code        | N/A          | No dead recharts widgets. (Dead code items are in pnl domain stubs, separate work unit.) |

---

## 5. Fix Complexity per Widget

| Widget                      | Fixes needed                                              | Complexity |
| --------------------------- | --------------------------------------------------------- | ---------- |
| `risk-var-chart`            | Add empty state guard                                     | Low        |
| `risk-term-structure`       | Already has empty state — no fixes                        | None       |
| `risk-exposure-attribution` | Add empty state guard for chart section                   | Low        |
| `risk-greeks-summary`       | Add empty state guard for chart section                   | Low        |
| `risk-margin`               | Add empty state guard for chart section                   | Low        |
| `pnl-time-series`           | Move `BACKTEST_VS_LIVE_DATA` to data context              | Medium     |
| `pnl-factor-drilldown`      | Add empty state guard                                     | Low        |
| `markets-latency-detail`    | Already has empty state — no fixes                        | None       |
| `defi-yield-chart`          | Move mock generators to defi-data-context                 | Medium     |
| `risk-kpi-strip`            | Move mock imports + inline data + event wiring to context | High       |

---

## 6. Widget Descriptions

Suitable for `widget_catalogue.md` and UI help tooltips. Each under 50 words.

| Widget ID                   | Description                                                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `risk-var-chart`            | Horizontal bar chart of 95% Value-at-Risk per instrument, colour-coded by asset class (DeFi, CeFi, TradFi, Sports). Switchable between historical, parametric, Monte Carlo, and filtered-historical methods. |
| `risk-term-structure`       | Stacked bar chart showing risk exposure across expiry buckets. Breaks down short-term vs medium-term vs long-term notional by venue.                                                                         |
| `risk-exposure-attribution` | Strategy-level exposure table with inline sparkline charts. Filter by strategy, view net/gross exposure, utilisation percentage, and status per position with collapsible detail rows.                       |
| `risk-greeks-summary`       | Portfolio Greeks dashboard: KPI strip (Delta, Gamma, Vega, Theta, Rho), per-position Greeks table, dual-axis time-series chart of Delta and Gamma evolution, and second-order risk metrics.                  |
| `risk-margin`               | Margin and collateral monitor: CeFi venue margin bars, SPAN margin breakdown, LTV limit bars, health-factor time-series area chart, and distance-to-liquidation indicators.                                  |
| `pnl-time-series`           | Dual-mode P&L chart. "Factor Lines" shows cumulative P&L per attribution factor (funding, carry, fees, etc.) with toggleable chips. "Backtest vs Live" overlays predicted vs realised P&L.                   |
| `pnl-factor-drilldown`      | Drill-down into a single P&L factor: stacked area chart of per-strategy contribution over time, summary KPIs, and a breakdown table. Click any factor in the waterfall to open.                              |
| `markets-latency-detail`    | Service latency detail: p50/p95/p99 area chart over time, KPI strip with current values, per-stage breakdown table. Supports live vs batch comparison mode.                                                  |
| `defi-yield-chart`          | DeFi strategy yield visualisation: switchable between cumulative P&L, APY%, and daily P&L views. Summary KPI cards per strategy, 30/60/90-day range selector, and toggle chips to show/hide strategies.      |
| `risk-kpi-strip`            | Top-level risk overview: KPI grid (total VaR, utilisation, drawdown, Sharpe) with card/chart toggle, DeFi strategy risk profiles table, portfolio delta composite, and DeFi risk time-series chart.          |
