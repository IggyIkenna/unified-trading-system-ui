# P&L Page — Widget Decomposition Spec

Tab: `pnl`
Source: `app/(platform)/services/trading/pnl/page.tsx`
Lines: ~1715

---

## 1. Page Analysis

This is the largest page in the trading section. It contains P&L attribution with time-series charts, factor drilldowns, order flow analytics, reconciliation, and latency monitoring — all in one mega-page.

### Current Sections

| Section                           | Lines     | Description                                                                                                             |
| --------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Header + Controls                 | 1048–1117 | Title, view mode toggle (cross-section/time-series), live/batch toggle, date range selector, generate report button     |
| P&L Tab — Group By Controls       | 1131–1161 | Button group: Total/Client/Strategy/Venue/Asset + data mode badge                                                       |
| P&L Tab — Time Series Chart       | 1164–1312 | Recharts AreaChart: 10-factor stacked chart (Funding, Carry, Basis, Delta, Gamma, Vega, Theta, Slippage, Fees, Rebates) |
| P&L Tab — Cross-Section Waterfall | 1314–1493 | Structural P&L (Realized/Unrealized), Factor Attribution bars (clickable drill-down), Residual diagnostic, Net total    |
| P&L Tab — By Client               | 1496–1541 | Client P&L list with org, strategy count, change%                                                                       |
| P&L Tab — Component Breakdown     | 1546–1708 | Drill-down panel: strategy breakdown table + factor time series chart per strategy                                      |

**Note**: The page also references Tabs for future sections but only "pnl" tab is rendered in the version at `app/(platform)/services/trading/pnl/page.tsx`. The `markets/page.tsx` version has Trade Desk, Latency, and Reconciliation tabs — these are covered in the markets spec.

### Data Hooks Used

- `useTickers()` — tickers data (markets version)
- `useStrategyPerformance()` — strategy list
- `useOrganizationsList()` — org/client hierarchy
- `useGlobalScope()` — scope filtering

### Inline Mock Data

- `structuralPnL` (lines 76–83) — realized/unrealized breakdown
- `residualPnL` (line 86–91) — unexplained P&L component
- `FACTOR_COLORS` (lines 94–105) — color map for chart factors
- `generateTimeSeriesData()` (lines 108–237) — seeded random time series generator
- `generatePnLComponents()` (lines 240–318) — filter-aware P&L factor generator
- `generateStrategyBreakdown()` (lines 321–356) — per-strategy factor breakdown
- `generateFactorTimeSeries()` (lines 359–412) — per-strategy time series
- `generateClientPnL()` (lines 415–455) — client-level P&L generator
- Multiple venue constants, order flow types, book update generators (~lines 458–665)

This page has the **heaviest inline mock data** of all 5 pages — ~600 lines of data generation functions.

---

## 2. Widget Decomposition

| id                     | label            | description                                                                                           | icon         | minW | minH | defaultW | defaultH | singleton |
| ---------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- | ------------ | ---- | ---- | -------- | -------- | --------- |
| `pnl-controls`         | P&L Controls     | View mode (cross-section/time-series), live/batch toggle, date range, group-by selector               | `LayoutGrid` | 4    | 1    | 12       | 1        | yes       |
| `pnl-waterfall`        | P&L Waterfall    | Structural P&L (realized/unrealized) + factor attribution bars with drill-down + residual + net total | `BarChart3`  | 4    | 4    | 7        | 8        | yes       |
| `pnl-time-series`      | P&L Time Series  | Stacked area chart: 10 factors over time with legend                                                  | `LineChart`  | 4    | 3    | 12       | 5        | yes       |
| `pnl-by-client`        | P&L by Client    | Client-level P&L summary with org, strategy count, % change                                           | `TrendingUp` | 3    | 3    | 5        | 8        | yes       |
| `pnl-factor-drilldown` | Factor Breakdown | Per-strategy breakdown for selected factor + mini time series chart                                   | `Activity`   | 4    | 3    | 12       | 5        | yes       |
| `pnl-report-button`    | Generate Report  | CTA button to trigger P&L report generation                                                           | `FileText`   | 2    | 1    | 2        | 1        | yes       |

---

## 3. Data Context Shape

```typescript
export interface PnLData {
  // Core data
  pnlComponents: PnLComponent[];
  structuralPnL: PnLComponent[];
  residualPnL: PnLComponent;
  netPnL: number;
  clientPnL: ClientPnLRow[];
  timeSeriesData: Array<Record<string, number | string>>;
  timeSeriesNetPnL: number;

  // Controls
  viewMode: "cross-section" | "time-series";
  setViewMode: (m: "cross-section" | "time-series") => void;
  dataMode: "live" | "batch";
  setDataMode: (m: "live" | "batch") => void;
  dateRange: string;
  setDateRange: (d: string) => void;
  groupBy: string;
  setGroupBy: (g: string) => void;

  // Drill-down
  selectedFactor: string | null;
  setSelectedFactor: (f: string | null) => void;
  selectedFactorData: FactorDrilldown | null;

  // Scope filters
  selectedOrgIds: string[];
  selectedClientIds: string[];
  selectedStrategyIds: string[];

  // Loading
  isLoading: boolean;
}

interface PnLComponent {
  name: string;
  value: number;
  percentage: number;
  isNegative?: boolean;
  category?: "structural" | "factor" | "diagnostic";
}

interface ClientPnLRow {
  id: string;
  name: string;
  org: string;
  pnl: number;
  strategies: number;
  change: number;
}

interface FactorDrilldown {
  factor: PnLComponent;
  breakdown: Array<{ id: string; name: string; client: string; value: number; percentage: number }>;
  timeSeries: Array<Record<string, string | number>>;
  strategyNames: string[];
}
```

---

## 4. Mock Data Instructions

- **Move**: `structuralPnL`, `residualPnL` → `lib/mocks/fixtures/pnl-attribution.ts`
- **Move**: `FACTOR_COLORS` → `lib/config/services/pnl.config.ts`
- **Move**: `generateTimeSeriesData()`, `generatePnLComponents()`, `generateStrategyBreakdown()`, `generateFactorTimeSeries()`, `generateClientPnL()` → `lib/mocks/generators/pnl-generators.ts` (these are complex generators, not simple fixtures)
- **Add MSW handler**: P&L attribution should come from a dedicated hook `usePnLAttribution()` backed by MSW, rather than calling generator functions directly in the component
- **Shared with markets page**: Both `pnl/page.tsx` and `markets/page.tsx` contain duplicate copies of these generators. Extract once and share.

---

## 5. UI/UX Notes

- **View mode toggle**: Cross-section view shows the waterfall + client sidebar. Time-series view shows the stacked chart. These are mutually exclusive display modes — in widget form, each becomes its own widget. The user can show one or both simultaneously.
- **Drill-down interaction**: Clicking a factor bar in the waterfall populates the factor-drilldown widget. This cross-widget communication goes through the data context (`selectedFactor` state).
- **Date range selector**: In the current page, it's in the header. As a widget system, it should be part of `pnl-controls` or the workspace toolbar.
- **Recharts sizing**: Time series chart uses `h-[400px]` with `ResponsiveContainer`. In widget form, use `100%` height and let the grid cell control sizing.
- **Waterfall bar interaction**: Hover/selected states on factor bars are well-implemented (ring highlight). Keep in widget form.
- **Residual diagnostic**: The dashed-border warning styling for unexplained P&L is important — preserve this visual treatment.

---

## 6. Collapsible Candidates

| Section                                   | Collapsible?       | Reason                                                         |
| ----------------------------------------- | ------------------ | -------------------------------------------------------------- |
| Controls bar                              | No                 | Essential navigation                                           |
| Structural P&L section (within waterfall) | Yes (default open) | Can collapse to focus on factor attribution                    |
| Residual section (within waterfall)       | No                 | Diagnostic always visible                                      |
| Factor drilldown                          | No                 | Only shown when factor selected; empty state message otherwise |
| Client P&L                                | No                 | Always useful context next to waterfall                        |

---

## 7. Reusable Component Usage

| Shared Component     | Used In                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `KpiStrip`           | Not directly — P&L page doesn't have a KPI row, but `pnl-controls` could include net P&L as a KPI metric |
| `CollapsibleSection` | Structural P&L section within the waterfall widget                                                       |
| `DataTableWidget`    | Not used — custom bar visualizations for waterfall and breakdown                                         |
| `FilterBarWidget`    | Not used — controls are toggle buttons, not filter dropdowns                                             |

---

## 8. Default Preset Layout

12-column grid — two preset options:

### Default (Cross-Section Focus)

```
| pnl-controls (0,0) w=12 h=1                                    |
| pnl-waterfall (0,1) w=7 h=8    | pnl-by-client (7,1) w=5 h=8  |
| pnl-factor-drilldown (0,9) w=12 h=5                            |
```

```typescript
registerPresets("pnl", [
  {
    id: "pnl-default",
    name: "Default",
    tab: "pnl",
    isPreset: true,
    layouts: [
      { widgetId: "pnl-controls", instanceId: "pnl-controls-1", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "pnl-waterfall", instanceId: "pnl-waterfall-1", x: 0, y: 1, w: 7, h: 8 },
      { widgetId: "pnl-by-client", instanceId: "pnl-by-client-1", x: 7, y: 1, w: 5, h: 8 },
      { widgetId: "pnl-factor-drilldown", instanceId: "pnl-factor-drilldown-1", x: 0, y: 9, w: 12, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "pnl-time-series",
    name: "Time Series",
    tab: "pnl",
    isPreset: true,
    layouts: [
      { widgetId: "pnl-controls", instanceId: "pnl-controls-1", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "pnl-time-series", instanceId: "pnl-time-series-1", x: 0, y: 1, w: 12, h: 5 },
      { widgetId: "pnl-waterfall", instanceId: "pnl-waterfall-1", x: 0, y: 6, w: 7, h: 6 },
      { widgetId: "pnl-by-client", instanceId: "pnl-by-client-1", x: 7, y: 6, w: 5, h: 6 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);
```

---

## 9. Questions to Resolve

1. **Duplicate code between pnl/ and markets/ pages**: Both contain identical generator functions and type definitions. Should the P&L attribution widgets be shared across both tabs, or should each tab have its own copy of the widgets?
2. **View mode as widget toggle or separate widgets?** Currently cross-section and time-series are mutually exclusive views toggled by a button. As widgets, both can coexist. Should the toggle remain (to swap which widget is visible) or should users just add/remove the time-series widget?
3. **Group-by controls**: These change data grouping. Should group-by be part of the waterfall widget or a separate controls widget?
4. **Report generation**: The "Generate Report" button currently doesn't do anything. Is there a planned endpoint, or should this remain a placeholder CTA?
5. **Global scope vs local filters**: The page uses `useGlobalScope()` for org/client/strategy filtering, plus local `selectedOrgIds`/`selectedClientIds` state. Should these be unified through the data context?
6. **PnLComponent type**: Used in both structural and factor sections. Should there be separate types for structural vs factor P&L, or is the current unified type fine?
