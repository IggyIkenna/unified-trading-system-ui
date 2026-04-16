# 4.16 Risk — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **Page route:** `/services/trading/risk`

---

## Current Widget Inventory

| widgetId | Label | Component | Singleton | Default Preset |
|----------|-------|-----------|-----------|----------------|
| `risk-kpi-strip` | Risk KPIs | `RiskKpiStripWidget` | yes | 12x2 at (0,0) — both presets |
| `risk-strategy-heatmap` | Strategy Heatmap | `RiskStrategyHeatmapWidget` | yes | 12x4 at (0,2) — both presets |
| `risk-utilization` | Highest Utilization | `RiskUtilizationWidget` | yes | 6x3 — CRO only |
| `risk-var-chart` | Component VaR | `RiskVarChartWidget` | yes | 6x3/6x4 — both presets |
| `risk-stress-table` | Stress Scenarios | `RiskStressTableWidget` | yes | 12x4 — CRO only |
| `risk-exposure-attribution` | Exposure Attribution | `RiskExposureAttributionWidget` | yes | 12x5 — CRO only |
| `risk-greeks-summary` | Portfolio Greeks | `RiskGreeksSummaryWidget` | yes | 12x5 — CRO only |
| `risk-margin` | Margin & Health | `RiskMarginWidget` | yes | 6x5 — both presets |
| `risk-term-structure` | Term Structure | `RiskTermStructureWidget` | yes | 6x4 — CRO only |
| `risk-limits-hierarchy` | Limits Hierarchy | `RiskLimitsHierarchyWidget` | yes | 12x5 — CRO only |
| `risk-what-if-slider` | What-If Slider | `RiskWhatIfSliderWidget` | yes | 12x2 — CRO only |
| `risk-circuit-breakers` | Circuit Breaker Status | `RiskCircuitBreakersWidget` | yes | 6x3/12x3 — both presets |
| `risk-correlation-heatmap` | Correlation Heatmap | `RiskCorrelationHeatmapWidget` | yes | 6x4 — CRO only |

**Total: 13 widgets** — the second-largest domain after Predictions.

**Data provider:** Page is 450 lines, wraps with a `RiskDataProvider`.

**Presets:** 2 presets:
1. **"CRO Morning Briefing"** — All 13 widgets in a long vertical scroll (comprehensive risk report).
2. **"Quick Risk"** — 5 widgets: KPIs + Heatmap + VaR + Margin + Circuit Breakers.

---

## What Each Widget Does

### risk-kpi-strip
- 9 metrics: P&L, exposure, margin%, VaR95, ES95, alerts, VaR99, ES99, kill switches.

### risk-strategy-heatmap
- Strategy risk status grid with circuit breaker trip/reset, scale, and kill actions per strategy.

### risk-utilization
- Top N limits ranked by utilization with progress bars.

### risk-var-chart
- Horizontal bar chart: marginal VaR contribution by position.

### risk-stress-table
- Historical stress scenario table with multiplier, P&L impact, breach count, on-demand stress test button.

### risk-exposure-attribution
- Grouped exposure table (first/second/structural/operational/domain risk orders) with time series chart.

### risk-greeks-summary
- 5 Greek cards (Delta, Gamma, Theta, Vega, Rho), per-position table, time series, second-order risks.

### risk-margin
- CeFi margin bars, SPAN summary, DeFi health factor, distance to liquidation per venue.

### risk-term-structure
- Stacked bar chart: exposure by maturity bucket.

### risk-limits-hierarchy
- Interactive 6-level hierarchy tree table (Firm → Org → Client → Strategy → Instrument → Venue) + all limits detail.

### risk-what-if-slider
- BTC price shock slider with estimated PnL via delta + gamma approximation.

### risk-circuit-breakers
- Per-venue circuit breaker cards with status badges (armed/tripped/cooldown).

### risk-correlation-heatmap
- Asset correlation matrix heatmap (self-contained, dynamic import).

---

## Testing Checklist

- [ ] **KPIs:** All 9 metrics show values
- [ ] **Strategy Heatmap:** Strategy tiles render with CB status and actions
- [ ] **Utilization:** Top limits with progress bars
- [ ] **VaR Chart:** Bar chart renders with position contributions
- [ ] **Stress Table:** Scenarios render; on-demand stress test button works
- [ ] **Exposure Attribution:** Grouped table and time series chart render
- [ ] **Greeks Summary:** 5 Greek cards and per-position table render
- [ ] **Margin:** CeFi/DeFi margin bars and health factors render
- [ ] **Term Structure:** Stacked bar chart renders
- [ ] **Limits Hierarchy:** Tree table expands/collapses through 6 levels
- [ ] **What-If Slider:** Slider works; estimated PnL updates
- [ ] **Circuit Breakers:** Venue cards with status badges render
- [ ] **Correlation Heatmap:** Matrix renders

---

## Merge Proposal

### Option A — No merge (recommended)
- Risk is an analytics/monitoring domain where each widget represents a distinct risk dimension.
- CROs need to add/remove/resize these independently based on their focus.
- The 2 presets (comprehensive vs quick) already serve different use cases.
- 13 widgets is a lot, but each is conceptually distinct.
- **Result:** 13 widgets (no change).

### Option B — Merge KPI + what-if slider into one controls strip
- Both are thin horizontal widgets. Combine into a single top bar with KPIs and the shock slider.
- **Result:** 12 widgets.

### Option C — Merge utilization + var-chart
- Both are visual breakdowns of risk concentration. Combine with tabs.
- **Result:** 12 widgets.

---

## Questions for User

1. **Merge?** A (no merge), B (KPI+slider), or C (util+var)?
2. **13 widgets feels like the right level for a risk dashboard.** Do you agree, or is it too many?
3. **CRO Morning Briefing preset:** Is this preset useful as-is, or should it be trimmed?
4. **Any broken data?** This page has a lot of generated data — which widgets show empty?
