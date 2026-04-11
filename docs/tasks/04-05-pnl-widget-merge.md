# 4.5 P&L — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **WORK_TRACKER ref:** §4.5
> **Page route:** `/services/trading/pnl`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `pnl-controls` | P&L Controls | `PnlControlsWidget` | 96 | yes | 12x2 at (0,0) |
| `pnl-waterfall` | P&L Waterfall | `PnlWaterfallWidget` | 124 | yes | 7x8 at (0,2) |
| `pnl-time-series` | P&L Time Series | `PnlTimeSeriesWidget` | 114 | yes | 12x5 (2nd preset only) |
| `pnl-by-client` | P&L by Client | `PnlByClientWidget` | 46 | yes | 5x8 at (7,2) |
| `pnl-factor-drilldown` | Factor Breakdown | `PnlFactorDrilldownWidget` | 113 | yes | 12x5 at (0,10) |
| `pnl-report-button` | P&L Report | `PnlReportButtonWidget` | 16 | yes | Not in any preset |

**Total: 6 widgets** — the most complex domain.

**Data provider:** `PnLDataProvider` (258 lines) wraps the page. Manages view mode, data mode, date range, group-by, factor selection, scope filtering.

**Presets:** 2 presets:
1. **"Default"** — Controls → Waterfall (7 cols) + By Client (5 cols) → Factor Drilldown
2. **"Time Series"** — Controls → Time Series chart → Waterfall + By Client

---

## What Each Widget Does

### pnl-controls (96 lines)
- Toggle bar for: Cross-Section / Time Series view mode, Live / Batch data mode, date range selector, group-by buttons (Total, Client, Strategy, Venue, Asset).
- No data display — purely controls state that other widgets react to.

### pnl-waterfall (124 lines)
- Structural P&L section (Realized, Unrealized) with bar charts.
- Factor Attribution section — clickable rows (Funding, Carry, Basis, Delta, Gamma, Rebates, Vega, Theta, Slippage, Fees) with bar widths.
- Residual (unexplained) P&L with warning styling.
- Net P&L summary at bottom.
- Clicking a factor sets `selectedFactor` → drives `pnl-factor-drilldown`.

### pnl-time-series (114 lines)
- Stacked area chart (Recharts) of 10 factors over time (positive stack: Funding, Carry, Basis, Delta, Gamma, Rebates; negative stack: Vega, Theta, Slippage, Fees).
- Net P&L value at top.

### pnl-by-client (46 lines)
- Client list with EntityLink, P&L value, change percentage.
- "View All Clients" button at bottom.
- Scrollable list.

### pnl-factor-drilldown (113 lines)
- Appears when a factor is selected in the waterfall.
- Left column: per-strategy breakdown bars for the selected factor.
- Right column: mini area chart showing that factor's time series by strategy.
- "Clear" button to deselect.
- Empty state: prompt to select a factor.

### pnl-report-button (16 lines)
- Single "Generate Report" button. Pure placeholder — no functionality.
- Not in any preset (available for manual adding only).

---

## Data Flow

```
PnLDataProvider (page.tsx)
├── useTickers()               → market data (used for P&L calculation)
├── useStrategyPerformance()   → strategy-level performance data
├── useOrganizationsList()     → org data for client grouping
├── useGlobalScope()           → scope filtering
├── State: viewMode, dataMode, dateRange, groupBy, selectedFactor
├── Generators: pnlComponents, structuralPnL, residualPnL, timeSeriesData, clientPnL
├── factorDrilldown           → derived when selectedFactor is set
└── provides all via React Context
    ├── PnlControlsWidget        reads/writes: viewMode, dataMode, dateRange, groupBy
    ├── PnlWaterfallWidget       reads: structuralPnL, pnlComponents, residualPnL, netPnL; writes: selectedFactor
    ├── PnlTimeSeriesWidget      reads: timeSeriesData, timeSeriesNetPnL
    ├── PnlByClientWidget        reads: clientPnL
    ├── PnlFactorDrilldownWidget reads: selectedFactorData, viewMode; writes: selectedFactor
    └── PnlReportButtonWidget    reads: nothing (static)
```

---

## Known Issues (reported by user)

1. **P&L by Client:** User reported "I don't see anything in client" — the `clientPnL` data may be empty or the generators may not produce data under certain scope filters.
2. **Time Series:** User reported "there was something I guess before but I can't see it now" — the time series chart may be blank or the `timeSeriesData` generator may be broken.
3. **Controls dependency:** Without `pnl-controls`, other widgets can't change view mode or date range — critical widget.

---

## Testing Checklist

- [ ] **Controls:** View mode toggle (Cross-Section / Time Series) switches correctly
- [ ] **Controls:** Live/Batch toggle updates data mode badge
- [ ] **Controls:** Date range selector works (Today, Yesterday, WTD, MTD, YTD)
- [ ] **Controls:** Group-by buttons work (Total, Client, Strategy, Venue, Asset)
- [ ] **Waterfall:** Shows structural P&L (Realized/Unrealized) with non-zero bars
- [ ] **Waterfall:** Factor Attribution rows render with bars and values
- [ ] **Waterfall:** Residual P&L shows
- [ ] **Waterfall:** Net P&L value at bottom
- [ ] **Waterfall:** Clicking a factor highlights it and drives the drilldown
- [ ] **Time Series:** Stacked area chart renders with visible data
- [ ] **Time Series:** Net P&L value at top
- [ ] **By Client:** Client list shows rows with names, P&L, change%
- [ ] **Factor Drilldown:** Selecting a factor shows per-strategy bars + mini chart
- [ ] **Factor Drilldown:** "Clear" button deselects factor
- [ ] **Report Button:** Present (even if non-functional)

---

## Merge Proposal

**WORK_TRACKER target:** "Merge small P&L controls + factor drilldown into waterfall."

This domain is complex — 6 widgets with heavy cross-widget interaction (controls drive everything, waterfall drives drilldown). Merge carefully.

### Option A — Merge controls + report into waterfall, keep rest separate (recommended)
- Embed the P&L Controls row as a sticky header inside `PnlWaterfallWidget`.
- Add the "Generate Report" button to the controls row.
- Keep `pnl-time-series`, `pnl-by-client`, and `pnl-factor-drilldown` as separate widgets — they serve distinct visualization needs and benefit from independent resizing.
- Delete `pnl-controls` and `pnl-report-button` registrations.
- **Result:** 4 widgets (waterfall-with-controls, time-series, by-client, factor-drilldown).

### Option B — Merge controls + waterfall + drilldown into one, keep time-series and by-client separate
- The waterfall and drilldown are tightly coupled (factor selection).
- Embed controls + waterfall + drilldown in a single tabbed/collapsible widget.
- **Result:** 3 widgets (waterfall-console, time-series, by-client).

### Option C — Merge controls + drilldown into waterfall only
- Embed the drilldown panel below the waterfall (expands when factor selected).
- Keep controls as separate (it acts as a global toolbar).
- **Result:** 4 widgets (controls, waterfall-with-drilldown, time-series, by-client).

### Option D — No merge
- The current separation is logical and the presets handle layout well.
- Focus on fixing data issues (client PnL, time series blank).

---

## Questions for User

1. **Merge scope:** A (controls+report into waterfall), B (controls+waterfall+drilldown), C (drilldown only into waterfall), or D (no merge)? This is the most complex domain — over-merging could make the single widget too large.
2. **Data issues — PRIORITY:** Client P&L and Time Series are reportedly broken/empty. Should we fix data generators first before any merge work?
3. **Report button:** Is this worth keeping at all, or should it be removed entirely since it's non-functional?
4. **Presets:** The page has 2 presets (Default, Time Series). After merging, should we keep both, or consolidate?
