# Strategies Page — Widget Decomposition Spec

Tab: `strategies`
Source: `app/(platform)/services/trading/strategies/page.tsx`
Lines: ~669

---

## 1. Page Analysis

### Current Sections

| Section              | Lines   | Description                                                                                                                                                     |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header + Mode Toggle | 177–196 | Title, ExecutionModeIndicator, ExecutionModeToggle, "New Strategy" button                                                                                       |
| KPI Summary          | 199–246 | 4-card grid: Active Strategies, Total AUM, Total P&L, MTD P&L                                                                                                   |
| Filters              | 249–433 | Search input + 3 dropdown menus (Asset Class, Archetype, Status) + active filter badges + clear                                                                 |
| Strategy Cards       | 436–647 | Grouped by asset class, 2-column card grid with: name, status, version, venues, instruction types, metrics (Sharpe/Return/MaxDD/MTD), sparkline, action buttons |
| Empty State          | 649–654 | No-match message                                                                                                                                                |
| Grid Link            | 657–664 | Full-width button linking to DimensionalGrid batch analysis                                                                                                     |

### Data Hooks Used

- `useStrategyPerformance()` — fetches strategy list with performance data
- `useExecutionMode()` — live vs batch mode toggle
- Imports from `@/lib/strategy-registry`: `STRATEGIES`, `getTotalAUM`, `getTotalPnL`, `getTotalMTDPnL`

### Inline Mock Data

- `ASSET_CLASS_COLORS` — color map for asset classes (move to config)
- `ARCHETYPES` — archetype filter list (move to config)
- `STATUSES` — status filter list (move to config)
- `DEFAULT_STRATEGIES` fallback from `lib/strategy-registry` — already centralized

---

## 2. Widget Decomposition

| id                      | label              | description                                                          | icon         | minW | minH | defaultW | defaultH | singleton |
| ----------------------- | ------------------ | -------------------------------------------------------------------- | ------------ | ---- | ---- | -------- | -------- | --------- |
| `strategies-kpi-strip`  | Strategy Summary   | Active count, total AUM, total P&L, MTD P&L                          | `Activity`   | 4    | 1    | 12       | 2        | yes       |
| `strategies-filter-bar` | Strategy Filters   | Search + asset class + archetype + status multi-select filters       | `Filter`     | 4    | 1    | 12       | 1        | yes       |
| `strategies-catalogue`  | Strategy Catalogue | Grouped card grid with performance metrics, sparklines, action links | `LayoutGrid` | 6    | 4    | 12       | 8        | yes       |
| `strategies-grid-link`  | Batch Grid Link    | CTA to open DimensionalGrid for batch analysis                       | `LineChart`  | 4    | 1    | 12       | 1        | yes       |

---

## 3. Data Context Shape

```typescript
export interface StrategiesData {
  strategies: Strategy[];
  filteredStrategies: Strategy[];
  groupedStrategies: Record<string, Strategy[]>;
  isLoading: boolean;

  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedAssetClasses: string[];
  toggleAssetClass: (ac: string) => void;
  selectedArchetypes: string[];
  toggleArchetype: (arch: string) => void;
  selectedStatuses: string[];
  toggleStatus: (status: string) => void;
  hasFilters: boolean;
  clearFilters: () => void;

  // Computed
  totalAUM: number;
  totalPnL: number;
  totalMTDPnL: number;
  activeCount: number;

  // Mode
  isLive: boolean;
  mode: string;
}
```

---

## 4. Mock Data Instructions

- **Move**: `ASSET_CLASS_COLORS` to `lib/config/services/strategies.config.ts`
- **Move**: `ARCHETYPES` and `STATUSES` constants to `lib/config/services/strategies.config.ts`
- **No new mock data needed** — `useStrategyPerformance()` already sources from MSW
- `getTotalAUM()`, `getTotalPnL()`, `getTotalMTDPnL()` are already in `lib/strategy-registry` — keep as-is or refactor to accept a strategy array parameter instead of using the global `STRATEGIES`

---

## 5. UI/UX Notes

- **Card density**: Currently 2-column grid. In widget form, detect widget width and switch between 1-col (narrow) and 2-col (wide). Use `minW: 6` to ensure at least one card is readable.
- **Sparkline sizing**: `SparklineCell` uses `w-20 h-8` inline. In compact widget mode, reduce to `w-16 h-6`.
- **Filter badges**: Active filter badges with X buttons are great UX — keep in widget version.
- **ExecutionModeToggle**: Currently in the header. As a widget system, the mode toggle should live in the toolbar or context bar, not per-widget. The `ExecutionModeIndicator` (badge) can stay in the KPI strip.
- **Action buttons per card**: "View Live", "Details", "Config" — these navigate to other routes. Ensure they work correctly when the page is widgetized (they should still use Next.js `Link`).

---

## 6. Collapsible Candidates

| Section                | Collapsible?       | Reason                                                        |
| ---------------------- | ------------------ | ------------------------------------------------------------- |
| KPI strip              | No                 | Always-visible summary                                        |
| Filter bar             | No                 | Essential for catalogue navigation                            |
| Each asset-class group | Yes (default open) | Allow collapsing DeFi/TradFi/etc groups to focus on one class |
| Grid Link              | No                 | Single CTA, small footprint                                   |

---

## 7. Reusable Component Usage

| Shared Component     | Used In                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `KpiStrip`           | `strategies-kpi-strip` — 4 metrics with PnLValue formatting                                                                                |
| `FilterBarWidget`    | Could replace custom dropdowns, but the multi-select checkbox pattern is more complex than FilterBar supports. Keep bespoke filter widget. |
| `CollapsibleSection` | Each asset-class group header in the catalogue widget                                                                                      |
| `DataTableWidget`    | Not used — strategies use card grid, not table                                                                                             |

---

## 8. Default Preset Layout

12-column grid:

```
| strategies-kpi-strip (0,0) w=12 h=2                |
| strategies-filter-bar (0,2) w=12 h=1               |
| strategies-catalogue (0,3) w=12 h=8                |
| strategies-grid-link (0,11) w=12 h=1               |
```

```typescript
registerPresets("strategies", [
  {
    id: "strategies-default",
    name: "Default",
    tab: "strategies",
    isPreset: true,
    layouts: [
      { widgetId: "strategies-kpi-strip", instanceId: "strategies-kpi-strip-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "strategies-filter-bar", instanceId: "strategies-filter-bar-1", x: 0, y: 2, w: 12, h: 1 },
      { widgetId: "strategies-catalogue", instanceId: "strategies-catalogue-1", x: 0, y: 3, w: 12, h: 8 },
      { widgetId: "strategies-grid-link", instanceId: "strategies-grid-link-1", x: 0, y: 11, w: 12, h: 1 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);
```

---

## 9. Questions to Resolve

1. **Card vs Table view toggle?** The page uses cards. Should a widget allow switching to a compact table view for dense layouts? This would let `strategies-catalogue` adapt to narrow widths.
2. **ExecutionModeToggle placement**: Currently in the page header. Should it be part of the KPI strip widget, a separate widget, or moved to the workspace toolbar?
3. **Filter state coupling**: The filter-bar widget controls what the catalogue widget shows. Should filters be embedded in the catalogue widget (simpler) or kept separate (more layout flexibility)?
4. **DimensionalGrid link**: Is this still the desired UX, or should it become a tabbed view within the catalogue widget?
5. **Strategy count display**: The subtitle "X strategies across Y asset classes" — should this move into the KPI strip or stay as a subtitle in the catalogue widget?
