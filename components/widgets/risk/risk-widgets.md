# Risk Page — Widget Decomposition Spec

**Source:** `app/(platform)/services/trading/risk/page.tsx` (2764 lines)
**Tab ID:** `risk`
**Date:** 2026-03-27

---

## 1. Page Analysis

### Current Sections (top → bottom)

The risk page is the **largest page in the UI** at 2764 lines. It uses a 7-tab layout (Risk Summary, VaR & Stress, Exposure, Greeks, Margin, Term Structure, Limits) plus 7 standalone "Parts" sections below the tabs.

| #   | Section                     | Lines     | Tab/Part   | Description                                                                             |
| --- | --------------------------- | --------- | ---------- | --------------------------------------------------------------------------------------- |
| 1   | Kill Switch Banner          | 608–619   | Global     | Red banner when any kill switch is active                                               |
| 2   | Header + Status             | 621–651   | Global     | Title, critical/warning counts, kill switch count                                       |
| 3   | **Tab: Risk Summary**       | 689–1158  | Tab 1      | 9 KPI cards (3×3) + Strategy Risk Heatmap + Highest Utilization                         |
| 4   | **Tab: VaR & Stress**       | 1164–1378 | Tab 2      | Component VaR bar chart + Stress scenarios table + Regime multiplier slider             |
| 5   | **Tab: Exposure**           | 1383–1589 | Tab 3      | Exposure attribution table (collapsible groups) + Exposure time series chart            |
| 6   | **Tab: Greeks**             | 1594–1830 | Tab 4      | Portfolio Greeks cards + per-position table + time series chart + second-order risks    |
| 7   | **Tab: Margin**             | 1835–2064 | Tab 5      | CeFi margin bars + SPAN summary + DeFi health factor + HF time series + distance-to-liq |
| 8   | **Tab: Term Structure**     | 2069–2140 | Tab 6      | Exposure by maturity bucket stacked bar chart                                           |
| 9   | **Tab: Limits**             | 2145–2322 | Tab 7      | Hierarchy tree table + all limits detail table                                          |
| 10  | Part 2: VaR Summary         | 2328–2394 | Below tabs | 4 cards: Historical/Parametric/CVaR/Monte Carlo VaR (99%)                               |
| 11  | Part 3: Stress Scenario     | 2399–2501 | Below tabs | On-demand stress test with scenario selector                                            |
| 12  | Part 4: Portfolio Greeks    | 2506–2632 | Below tabs | Net greeks cards + per-underlying breakdown table                                       |
| 13  | Part 5: What-If Slider      | 2637–2704 | Below tabs | BTC price shock slider → estimated PnL                                                  |
| 14  | Part 6: Circuit Breakers    | 2709–2754 | Below tabs | Venue circuit breaker status grid                                                       |
| 15  | Part 7: Correlation Heatmap | 2759      | Below tabs | Dynamic import of `CorrelationHeatmap`                                                  |

### Data Hooks Used

- `useRiskLimits()` → limits hierarchy, exposure rows, heatmap, HF time series, distance-to-liq
- `useVaR()` → component VaR data, term structure
- `useGreeks()` → portfolio greeks, position greeks, time series, second-order risks
- `useStressScenarios()` → stress scenario table data
- `useVarSummary()` → VaR summary cards (99%)
- `useStressTest(scenario)` → on-demand stress test results
- `useRegime()` → market regime indicator (normal/stressed/crisis)
- `usePortfolioGreeks()` → detailed portfolio + per-underlying greeks
- `useVenueCircuitBreakers()` → venue CB status grid
- `useCircuitBreakerMutation()` → trip/reset circuit breakers
- `useKillSwitchMutation()` → activate kill switch
- `useGlobalScope()` → batch mode check
- `apiFetch` (direct, line 1041–1067) — inline scale-down call (should use `useScaleDownMutation`)

### Inline Mock Data

- `MOCK_STRATEGIES` array (lines 235–278) — 7 hardcoded strategies with archetype mapping
- `STRATEGY_RISK_MAP` (lines 159–178) — strategy archetype → risk type arrays
- `COMPONENT_TO_RISK_TYPE` (lines 281–305) — exposure component → risk key mapping
- Hardcoded KPI values: `totalVar95 = 2100000`, `totalVar99 = 4800000`, etc. (lines 513–516)
- Hardcoded SPAN margin values: `$180K`, `$135K`, `$22K offset` (lines 1868–1898)
- `RiskLimit` interface (line 138) — should be in `lib/types/`
- `ExposureRow` interface (line 182) — should be in `lib/types/`

---

## 2. Widget Decomposition

The risk page is complex enough to warrant **13 widgets**, mapping closely to each distinct visual section. Users can then compose custom risk views by mixing widgets.

| #   | Widget ID                   | Label                  | Description                                                                        | Icon            | minW | minH | defaultW | defaultH | Singleton |
| --- | --------------------------- | ---------------------- | ---------------------------------------------------------------------------------- | --------------- | ---- | ---- | -------- | -------- | --------- |
| 1   | `risk-kpi-strip`            | Risk KPIs              | 9 metrics: P&L, exposure, margin%, VaR95, ES95, alerts, VaR99, ES99, kill switches | `Shield`        | 4    | 1    | 12       | 2        | yes       |
| 2   | `risk-strategy-heatmap`     | Strategy Heatmap       | Strategy risk status with action buttons (CB trip/reset, scale, kill)              | `Zap`           | 6    | 3    | 12       | 4        | yes       |
| 3   | `risk-utilization`          | Highest Utilization    | Top N limits ranked by utilization with LimitBars                                  | `BarChart3`     | 4    | 2    | 12       | 3        | yes       |
| 4   | `risk-var-chart`            | Component VaR          | Horizontal bar chart: marginal VaR contribution by position                        | `BarChart3`     | 4    | 3    | 12       | 4        | yes       |
| 5   | `risk-stress-table`         | Stress Scenarios       | Historical stress scenario table with multiplier, P&L, breaches                    | `AlertTriangle` | 6    | 3    | 12       | 4        | yes       |
| 6   | `risk-exposure-attribution` | Exposure Attribution   | Grouped exposure table (first/second/structural/operational/domain)                | `TrendingUp`    | 6    | 3    | 12       | 5        | yes       |
| 7   | `risk-greeks-summary`       | Portfolio Greeks       | 5 Greek cards + per-position table + second-order risks                            | `Activity`      | 4    | 2    | 12       | 5        | yes       |
| 8   | `risk-margin`               | Margin & Health        | CeFi margin bars + SPAN summary + DeFi HF + distance-to-liq                        | `Wallet`        | 4    | 3    | 6        | 5        | yes       |
| 9   | `risk-term-structure`       | Term Structure         | Stacked bar chart: exposure by maturity bucket                                     | `Clock`         | 4    | 3    | 6        | 4        | yes       |
| 10  | `risk-limits-hierarchy`     | Limits Hierarchy       | Interactive 6-level hierarchy tree table + all limits detail                       | `AlertTriangle` | 6    | 3    | 12       | 5        | yes       |
| 11  | `risk-what-if-slider`       | What-If Slider         | BTC price shock slider with estimated PnL                                          | `Target`        | 4    | 2    | 12       | 2        | yes       |
| 12  | `risk-circuit-breakers`     | Circuit Breaker Status | Per-venue circuit breaker cards with status badges                                 | `Zap`           | 4    | 2    | 12       | 3        | yes       |
| 13  | `risk-correlation-heatmap`  | Correlation Heatmap    | Asset correlation matrix heatmap (dynamic import)                                  | `LineChart`     | 4    | 3    | 12       | 4        | yes       |

### Notes

- The 7-tab structure in the current page maps well to individual widgets. By widgetizing, tabs become **optional** — users can place all widgets on one view or create custom tab-like presets.
- Part 2–7 below the tabs are redundant with content inside tabs (e.g., Part 2 VaR Summary duplicates Tab 1 KPIs, Part 4 duplicates Tab 4 Greeks). During widgetization, **consolidate** — each widget instance shows the definitive version, no duplication.
- The `risk-kpi-strip` widget should consolidate the 9 KPI cards (Tab 1) with the VaR Summary cards (Part 2) into a single comprehensive KPI strip.
- The regime multiplier slider and VaR method toggle are **controls** that affect multiple widgets. Place these in a shared `risk-controls` section of the data context, not as a separate widget.

---

## 3. Data Context Shape

```typescript
interface RiskDataContext {
  // Raw data from hooks
  riskLimits: RiskLimit[];
  componentVarData: VarComponent[];
  stressScenarios: StressScenario[];
  portfolioGreeks: GreekValues;
  positionGreeks: PositionGreek[];
  greeksTimeSeries: GreeksTimeSeriesPoint[];
  secondOrderRisks: { volga: number; vanna: number; slide: number };
  varSummary: VarSummaryData | null;
  regimeData: RegimeData | null;
  portfolioGreeksData: PortfolioGreeksResponse | null;
  venueCircuitBreakers: VenueCircuitBreakerStatus[];
  strategyRiskHeatmap: StrategyHeatmapRow[];
  exposureRows: ExposureRow[];
  exposureTimeSeries: ExposureTimeSeriesPoint[];
  termStructureData: TermStructureBucket[];
  hfTimeSeries: HFTimeSeriesPoint[];
  distanceToLiquidation: DistToLiqRow[];
  sortedLimits: RiskLimit[];

  // Loading states
  isLoading: boolean;
  hasError: boolean;

  // Controls (shared across widgets)
  varMethod: "historical" | "parametric" | "monte_carlo" | "filtered_historical";
  setVarMethod: (m: string) => void;
  regimeMultiplier: number;
  setRegimeMultiplier: (m: number) => void;
  exposurePeriod: "1W" | "1M" | "3M";
  setExposurePeriod: (p: string) => void;

  // Strategy filter
  riskFilterStrategy: string;
  setRiskFilterStrategy: (s: string) => void;
  filteredExposureRows: ExposureRow[];
  groupedExposure: Record<string, ExposureRow[]>;

  // Hierarchy selection
  selectedNode: string | null;
  setSelectedNode: (node: string | null) => void;

  // Stress test
  selectedStressScenario: string | null;
  setSelectedStressScenario: (s: string | null) => void;
  stressTestResult: StressTestResult | null;
  stressTestLoading: boolean;

  // What-if slider
  btcPriceChangePct: number;
  setBtcPriceChangePct: (pct: number) => void;
  estimatedPnl: number;

  // Computed KPIs
  totalVar95: number;
  totalVar99: number;
  totalES95: number;
  totalES99: number;
  criticalCount: number;
  warningCount: number;

  // Actions
  handleTripCircuitBreaker: (strategyId: string, name: string) => void;
  handleResetCircuitBreaker: (strategyId: string, name: string) => void;
  handleKillSwitch: (strategyId: string, name: string) => void;
  trippedStrategies: Set<string>;
  killedStrategies: Set<string>;
  scaledStrategies: Record<string, number>;

  // Mode
  isBatchMode: boolean;
}
```

---

## 4. Mock Data Instructions

| Current Location                         | Target Location                                         | Action                                                           |
| ---------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| `MOCK_STRATEGIES` (line 235)             | `lib/mocks/fixtures/risk-strategies.ts`                 | Move — fixture data, should be in MSW mock                       |
| `STRATEGY_RISK_MAP` (line 159)           | `lib/config/services/risk.config.ts`                    | Move — strategy archetype config                                 |
| `COMPONENT_TO_RISK_TYPE` (line 281)      | `lib/config/services/risk.config.ts`                    | Move — risk type mapping config                                  |
| Hardcoded KPIs (lines 513–516)           | Compute from API response                               | Replace — derive from `useVarSummary()` data                     |
| Hardcoded SPAN margins (lines 1868–1898) | `lib/mocks/fixtures/margin.ts` or API                   | Move — should come from API                                      |
| `RiskLimit` interface (line 138)         | `lib/types/risk.ts`                                     | Extract — shared type                                            |
| `ExposureRow` interface (line 182)       | `lib/types/risk.ts`                                     | Extract — shared type                                            |
| `formatCurrency()` (line 209)            | `lib/reference-data.ts` (already exists)                | Remove — use existing `formatCurrency` from `lib/reference-data` |
| Inline `apiFetch` for scale (line 1041)  | Use `useScaleDownMutation` from `hooks/api/use-risk.ts` | Replace — mutation hook already exists                           |

The MSW handlers at `lib/mocks/handlers/risk.ts` should provide all data shapes. Verify these endpoints are mocked:

- `/api/risk/limits` — must include `heatmap`, `exposureRows`, `exposureTimeSeries`, `hfTimeSeries`, `distanceToLiquidation`
- `/api/risk/var` — must include `components`, `termStructure`
- `/api/risk/greeks` — must include `portfolio`, `positions`, `timeSeries`, `secondOrder`
- `/api/risk/stress` — scenario list
- `/api/risk/var-summary` — 4 VaR values
- `/api/risk/regime` — regime indicator
- `/api/derivatives/portfolio-greeks` — portfolio + per_underlying
- `/api/risk/venue-circuit-breakers` — CB status list

---

## 5. UI/UX Notes

- **Monster file:** At 2764 lines this page must be split. Widgetization naturally splits it into ~13 widget components of ~100-200 lines each plus a data context of ~200 lines.
- **Tab duplication:** The tabs (1–7) and Parts (2–7) show overlapping data. Consolidate:
  - Tab 1 KPIs + Part 2 VaR Summary → single `risk-kpi-strip`
  - Tab 2 Stress + Part 3 Stress → single `risk-stress-table`
  - Tab 4 Greeks + Part 4 Portfolio Greeks → single `risk-greeks-summary`
- **KPI cards:** Current 3×3 grid uses `text-2xl font-bold`. Convert to `KpiStrip` for consistency. The 9 metrics naturally form a 3×3 or a 1×9 strip depending on widget width.
- **Regime multiplier slider:** Currently inside Tab 2. In widget mode, this should be a control inside the `risk-var-chart` widget header or in a shared controls widget. It affects VaR KPIs globally.
- **Strategy action buttons:** The Trip CB / Scale 50% / Kill buttons are critical for risk management. Ensure they remain prominent and disabled in batch mode. Consider adding confirmation for all destructive actions (currently only Kill has a confirmation dialog).
- **Inline `apiFetch` (line 1041):** The scale-down action calls `apiFetch` directly instead of using the existing `useScaleDownMutation` hook. Fix during widgetization.
- **Chart heights:** Most Recharts have fixed `h-[250px]` or `h-[350px]`. In widget mode, charts should use `h-full` and fill the widget's available space via `ResponsiveContainer`.

---

## 6. Collapsible Candidates

| Section                                           | Default State                                            | Reason                                                      |
| ------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| Exposure groups (first_order, second_order, etc.) | **first_order & domain_specific open**; others collapsed | Already uses collapsible groups. Maintain current behavior. |
| Per-position Greeks table                         | Open                                                     | Important detail                                            |
| Second-order risks                                | **Collapsed**                                            | Niche — mainly for options traders                          |
| Distance to Liquidation table                     | Open                                                     | Critical safety info                                        |
| All Limits Detail table                           | **Collapsed**                                            | Very long; hierarchy table above is the primary view        |
| Kill Switch Banner                                | —                                                        | Not collapsible — must always be visible when active        |

---

## 7. Reusable Component Usage

| Shared Component     | Used In Widget                                     | Notes                                                                                                                                               |
| -------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KpiStrip`           | `risk-kpi-strip`                                   | 9 metrics. Use `columns={3}` for a 3×3 grid inside the widget. Sentiments: P&L=dynamic, VaR/ES=negative (amber/red), alerts=warning, kills=negative |
| `FilterBarWidget`    | —                                                  | Not needed — risk page uses strategy archetype filter, not a generic FilterBar. Custom filter inside `risk-exposure-attribution`.                   |
| `DataTableWidget`    | `risk-stress-table`, `risk-limits-hierarchy`       | Stress scenario table + limits table fit the DataTableWidget pattern with sortable columns                                                          |
| `CollapsibleSection` | `risk-exposure-attribution`, `risk-greeks-summary` | Wrap exposure category groups and second-order risks section                                                                                        |

Additionally, the risk page uses custom components:

- `LimitBar` → `components/trading/limit-bar.tsx` — used in utilization + margin widgets
- `PnLValue` → `components/trading/pnl-value.tsx` — used in exposure table
- `StatusBadge` → `components/trading/status-badge.tsx` — used throughout
- `CorrelationHeatmap` → `components/risk/correlation-heatmap.tsx` — dynamic import, self-contained widget

---

## 8. Default Preset Layout

12-column grid. Due to the page's complexity, provide two presets.

### Preset 1: "CRO Morning Briefing" (default)

Replicates the current page's top-to-bottom flow.

```typescript
registerPresets("risk", [
  {
    id: "risk-cro-briefing",
    name: "CRO Morning Briefing",
    tab: "risk",
    isPreset: true,
    layouts: [
      { widgetId: "risk-kpi-strip", instanceId: "risk-kpi-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "risk-strategy-heatmap", instanceId: "risk-heatmap-1", x: 0, y: 2, w: 12, h: 4 },
      { widgetId: "risk-utilization", instanceId: "risk-util-1", x: 0, y: 6, w: 6, h: 3 },
      { widgetId: "risk-var-chart", instanceId: "risk-var-1", x: 6, y: 6, w: 6, h: 3 },
      { widgetId: "risk-stress-table", instanceId: "risk-stress-1", x: 0, y: 9, w: 12, h: 4 },
      { widgetId: "risk-exposure-attribution", instanceId: "risk-exposure-1", x: 0, y: 13, w: 12, h: 5 },
      { widgetId: "risk-greeks-summary", instanceId: "risk-greeks-1", x: 0, y: 18, w: 12, h: 5 },
      { widgetId: "risk-margin", instanceId: "risk-margin-1", x: 0, y: 23, w: 6, h: 5 },
      { widgetId: "risk-term-structure", instanceId: "risk-term-1", x: 6, y: 23, w: 6, h: 4 },
      { widgetId: "risk-what-if-slider", instanceId: "risk-whatif-1", x: 0, y: 28, w: 12, h: 2 },
      { widgetId: "risk-circuit-breakers", instanceId: "risk-cb-1", x: 0, y: 30, w: 6, h: 3 },
      { widgetId: "risk-correlation-heatmap", instanceId: "risk-corr-1", x: 6, y: 30, w: 6, h: 4 },
      { widgetId: "risk-limits-hierarchy", instanceId: "risk-limits-1", x: 0, y: 34, w: 12, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);
```

Visual layout (12 cols):

```
┌──────────────────────────────────────────────┐ y=0, h=2
│  risk-kpi-strip (9 KPIs)                     │
├──────────────────────────────────────────────┤ y=2, h=4
│  risk-strategy-heatmap (strategies + actions)│
├──────────────────────┬───────────────────────┤ y=6, h=3
│  risk-utilization    │  risk-var-chart       │
├──────────────────────┴───────────────────────┤ y=9, h=4
│  risk-stress-table                           │
├──────────────────────────────────────────────┤ y=13, h=5
│  risk-exposure-attribution                   │
├──────────────────────────────────────────────┤ y=18, h=5
│  risk-greeks-summary                         │
├──────────────────────┬───────────────────────┤ y=23, h=5/4
│  risk-margin         │  risk-term-structure  │
├──────────────────────┴───────────────────────┤ y=28, h=2
│  risk-what-if-slider                         │
├──────────────────────┬───────────────────────┤ y=30, h=3/4
│  risk-circuit-break  │  risk-correlation     │
├──────────────────────┴───────────────────────┤ y=34, h=5
│  risk-limits-hierarchy                       │
└──────────────────────────────────────────────┘
```

### Preset 2: "Quick Risk" (compact)

Essential risk view for quick checks — KPIs, heatmap, VaR, margins only.

```typescript
{
  id: "risk-quick",
  name: "Quick Risk",
  tab: "risk",
  isPreset: true,
  layouts: [
    { widgetId: "risk-kpi-strip",        instanceId: "risk-kpi-1",      x: 0, y: 0, w: 12, h: 2 },
    { widgetId: "risk-strategy-heatmap", instanceId: "risk-heatmap-1", x: 0, y: 2, w: 12, h: 4 },
    { widgetId: "risk-var-chart",        instanceId: "risk-var-1",     x: 0, y: 6, w: 6,  h: 4 },
    { widgetId: "risk-margin",           instanceId: "risk-margin-1",  x: 6, y: 6, w: 6,  h: 4 },
    { widgetId: "risk-circuit-breakers", instanceId: "risk-cb-1",      x: 0, y: 10, w: 12, h: 3 },
  ],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}
```

---

## 9. Questions to Resolve

1. **Tab elimination:** The current page uses a 7-tab `Tabs` component. Widgetization makes tabs unnecessary since each tab's content becomes a separate widget. Should the risk page in widget mode show ALL widgets in a scrollable grid (like the presets above), or should it provide a tabbed-preset switcher (e.g., "Summary" preset, "VaR" preset, "Greeks" preset)? Recommendation: one scrollable grid with a "CRO Briefing" default preset.

2. **Regime multiplier scope:** The `regimeMultiplier` affects VaR KPIs, adjusted VaR data, and stress outputs. In widget mode, should it be a global control in the data context (affecting all widgets), or a per-widget control (e.g., only the VaR chart respects it)? Recommendation: global, in the data context.

3. **Kill switch banner:** This is a global alert, not a widget. Should it render as a persistent banner above the widget grid (like the terminal's execution mode indicator), or as a special widget? Recommendation: persistent banner in the page layout, outside the grid.

4. **Chart responsiveness:** All Recharts in the current page use fixed heights (`h-[250px]`, `h-[350px]`). Widgets need `h-full` to fill allocated grid space. Confirm that `ResponsiveContainer` with `height="100%"` works correctly inside `react-grid-layout` cells.

5. **Inline `apiFetch` for scale-down:** Line 1041 calls `apiFetch` directly for the 50% scale action. The hook `useScaleDownMutation` already exists in `hooks/api/use-risk.ts`. Replace during widgetization.

6. **Correlation heatmap:** Already a dynamically-imported standalone component. Should it become a self-contained widget that calls `useCorrelationMatrix()` internally, or should the data context provide the correlation data? Recommendation: self-contained (it already manages its own data).

7. **`formatCurrency` duplication:** The risk page defines its own `formatCurrency()` (line 209) which is similar but not identical to `lib/reference-data.ts`'s `formatCurrency`. Reconcile — use the lib version.

8. **Hardcoded KPI values:** Lines 513–516 hardcode `totalVar95 = 2100000 * regimeMultiplier`, etc. These should derive from `varSummaryData` when available, with hardcoded fallbacks only for loading/error states. Clarify the intended data flow.

9. **13 widgets in one tab:** Is this too many? The risk page is genuinely information-dense. Users can use the "Quick Risk" preset for a subset. But should we merge some closely related widgets (e.g., `risk-var-chart` + `risk-stress-table` into `risk-var-and-stress`)? Recommendation: keep separate for maximum composability.
