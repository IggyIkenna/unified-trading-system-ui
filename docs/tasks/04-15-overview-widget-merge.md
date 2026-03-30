# 4.15 Overview — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **Page route:** `/services/trading/overview`

---

## Current Widget Inventory

| widgetId | Label | Component | Singleton | Default Preset |
|----------|-------|-----------|-----------|----------------|
| `scope-summary` | Scope & Controls | `ScopeSummaryWidget` | yes | 12x2 at (0,0) |
| `pnl-chart` | P&L / NAV / Exposure Charts | `PnLChartWidget` | yes | 12x4 at (0,2) |
| `kpi-strip` | Key Metrics | `KPIStripWidget` | yes | 12x2 at (0,6) |
| `strategy-table` | Strategy Performance | `StrategyTableWidget` | yes | 12x4 at (0,8) |
| `pnl-attribution` | P&L Attribution | `PnLAttributionWidget` | yes | 3x3 at (0,12) |
| `alerts-preview` | Alerts | `AlertsPreviewWidget` | yes | 3x3 at (3,12) |
| `recent-fills` | Recent Fills | `RecentFillsWidget` | yes | 3x3 at (6,12) |
| `health-grid` | System Health | `HealthGridWidget` | yes | 3x3 at (9,12) |

**Total: 8 widgets.**

**Data provider:** The page (408 lines) wraps `WidgetGrid` with an `OverviewDataProvider`.

**Presets:** 1 preset ("Default") — vertically stacked: Scope → P&L Chart → KPI Strip → Strategy Table → 4 bottom cards (3 cols each: Attribution, Alerts, Fills, Health).

---

## What Each Widget Does

### scope-summary
- Global scope summary with intervention controls and terminal link.
- Shows active org/client/strategy scope and quick actions.

### pnl-chart
- Live vs batch time series comparison with drift analysis.
- P&L, NAV, or Exposure chart modes.

### kpi-strip
- Aggregate KPIs: P&L, exposure, margin, live strategies count, active alerts.

### strategy-table
- Filterable strategy table grouped by asset class with real-time P&L.

### pnl-attribution (bottom card)
- Breakdown of P&L by factor: funding, carry, basis, delta, etc.

### alerts-preview (bottom card)
- Recent critical and high alerts with severity indicators.

### recent-fills (bottom card)
- Latest order fills with side, instrument, and status.

### health-grid (bottom card)
- Service health grid showing status of platform services.

---

## Testing Checklist

- [ ] **Scope Summary:** Shows scope info and intervention controls
- [ ] **P&L Chart:** Time series renders with live vs batch comparison
- [ ] **KPI Strip:** All aggregate metrics show values
- [ ] **Strategy Table:** Strategies appear grouped by asset class with P&L
- [ ] **P&L Attribution:** Factor breakdown renders
- [ ] **Alerts Preview:** Recent alerts with severity badges
- [ ] **Recent Fills:** Fill entries with side/instrument/status
- [ ] **Health Grid:** Service status cards render

---

## Merge Proposal

### Option A — Merge the 4 bottom cards into a single "Quick Glance" widget (recommended)
- The 4 bottom cards (attribution, alerts, fills, health) are all small 3x3 preview widgets.
- Combine into a single widget with 4 sections/tabs or a 2x2 grid.
- Keep scope, chart, kpi, strategy table separate — they're all distinct and full-width.
- **Result:** 5 widgets.

### Option B — Merge scope + kpi into one header
- Scope controls + KPI metrics as a single top bar.
- **Result:** 7 widgets.

### Option C — No merge
- The dashboard layout is clean. Each widget serves a clear purpose.
- The 8-widget grid is a standard dashboard pattern.

---

## Questions for User

1. **Merge?** A (4 bottom cards into one), B (scope+kpi), C (no merge)?
2. **P&L Chart:** Is the live vs batch comparison functional?
3. **4 bottom cards:** Are these useful as quick previews, or would users prefer links to the full pages instead?
4. **Any broken data?** Which widgets show data on the overview page?
