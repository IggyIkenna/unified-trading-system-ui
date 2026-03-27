# Alerts Page — Widget Decomposition Spec

Tab: `alerts`
Source: `app/(platform)/services/trading/alerts/page.tsx`
Lines: ~967

---

## 1. Page Analysis

### Current Sections

| Section              | Lines   | Description                                                                               |
| -------------------- | ------- | ----------------------------------------------------------------------------------------- |
| Header + Kill Switch | 665–870 | Title, DataFreshness badge, severity counts, export dropdown, Kill Switch sheet panel     |
| Unified FilterBar    | 874–880 | `FilterBar` component with search/status/severity filters                                 |
| Stats Row (KPIs)     | 883–916 | 4-card grid: Active Alerts, Critical, Avg Resolution, Last 24h                            |
| Legacy Filters       | 918–954 | Duplicate search + status + severity selects (redundant with FilterBar)                   |
| Alerts DataTable     | 957–963 | `DataTable` with columns: severity, title, entity, value/threshold, status, time, actions |
| Detail Sheet         | 468–611 | Side sheet with full alert details + action buttons (per-row)                             |

### Data Hooks Used

- `useAlerts()` — fetches alert list
- `useAcknowledgeAlert()` — mutation
- `useEscalateAlert()` — mutation
- `useResolveAlert()` — mutation
- `useGlobalScope()` — global scope filtering

### Inline Mock Data

- `ALERT_EXPORT_COLUMNS` — export column definitions (can stay inline or move to config)
- No hardcoded alert data — all from `useAlerts()` hook
- Kill Switch panel has hardcoded entity lists (`btc-basis`, `eth-staked`, `ml-directional`) and impact preview values

---

## 2. Widget Decomposition

| id                   | label         | description                                                                      | icon          | minW | minH | defaultW | defaultH | singleton |
| -------------------- | ------------- | -------------------------------------------------------------------------------- | ------------- | ---- | ---- | -------- | -------- | --------- |
| `alerts-kpi-strip`   | Alert Summary | Active count, critical count, avg resolution, 24h total                          | `Bell`        | 4    | 1    | 12       | 2        | yes       |
| `alerts-filter-bar`  | Alert Filters | Search + status + severity filters for the alert feed                            | `Search`      | 4    | 1    | 12       | 1        | yes       |
| `alerts-table`       | Alert Feed    | Filterable alert table with severity, entity, actions, detail sheet              | `AlertCircle` | 6    | 3    | 12       | 8        | yes       |
| `alerts-kill-switch` | Kill Switch   | Emergency intervention panel: scope selector, actions, rationale, impact preview | `Power`       | 3    | 4    | 4        | 6        | yes       |

---

## 3. Data Context Shape

```typescript
export interface AlertsData {
  alerts: Alert[];
  filteredAlerts: Alert[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  severityFilter: string;
  setSeverityFilter: (s: string) => void;
  resetFilters: () => void;

  // Computed
  activeCount: number;
  criticalCount: number;
  highCount: number;

  // Mutations
  acknowledgeAlert: (id: string) => void;
  escalateAlert: (alert: Alert) => void;
  resolveAlert: (id: string) => void;

  // Mode
  isBatchMode: boolean;
}
```

---

## 4. Mock Data Instructions

- **No new mock data needed** — `useAlerts()` already sources from MSW handlers
- **Move**: `ALERT_EXPORT_COLUMNS` to `lib/config/services/alerts.config.ts` (export column config)
- **Add**: Kill Switch entity list should come from `useStrategies()` hook rather than hardcoded list
- **Hardcoded values in Kill Switch**: Impact preview ("Affected positions: 2, Open orders: 5, Estimated market impact: ~$2,400") should be dynamic from an API call or removed as placeholder

---

## 5. UI/UX Notes

- **Remove duplicate filters**: The page has both a `FilterBar` component (line 874) AND manual selects (lines 918–954). Remove the manual selects — the `FilterBar` is the standard.
- **Kill Switch**: Currently in a Sheet triggered from the header. As a widget, it becomes a standalone panel (always visible when added to layout, collapsible). This is better for emergency situations — no hunting for a button.
- **KPI strip**: Currently 4 cards with `text-3xl`. In widget form, use `KpiStrip` shared component with `columns={4}` for consistent sizing.
- **Compact mode**: Alert table action buttons use `hidden lg:inline` for labels — keep this responsive behavior.
- **BatchGuardButton**: Tooltip wrapper for disabled actions in batch mode — keep as-is, works well in widget context.

---

## 6. Collapsible Candidates

| Section            | Collapsible?            | Reason                                                               |
| ------------------ | ----------------------- | -------------------------------------------------------------------- |
| Kill Switch widget | Yes (default collapsed) | Destructive actions should not be casually visible; expand on demand |
| KPI strip          | No                      | Always-visible summary                                               |
| Filter bar         | No                      | Always needed for table interaction                                  |
| Alert table        | No                      | Primary content                                                      |

---

## 7. Reusable Component Usage

| Shared Component     | Used In                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `KpiStrip`           | `alerts-kpi-strip` — 4 metrics: active, critical, avg resolution, 24h                                           |
| `FilterBarWidget`    | `alerts-filter-bar` — wraps FilterBar with widget scroll                                                        |
| `DataTableWidget`    | `alerts-table` — could use, but existing `DataTable` + custom columns + Sheet is complex enough to keep bespoke |
| `CollapsibleSection` | Kill Switch widget body                                                                                         |

---

## 8. Default Preset Layout

12-column grid:

```
| alerts-kpi-strip (0,0) w=12 h=2                    |
| alerts-filter-bar (0,2) w=12 h=1                   |
| alerts-table (0,3) w=9 h=8      | kill-switch (9,3) w=3 h=8 |
```

```typescript
registerPresets("alerts", [
  {
    id: "alerts-default",
    name: "Default",
    tab: "alerts",
    isPreset: true,
    layouts: [
      { widgetId: "alerts-kpi-strip", instanceId: "alerts-kpi-strip-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "alerts-filter-bar", instanceId: "alerts-filter-bar-1", x: 0, y: 2, w: 12, h: 1 },
      { widgetId: "alerts-table", instanceId: "alerts-table-1", x: 0, y: 3, w: 9, h: 8 },
      { widgetId: "alerts-kill-switch", instanceId: "alerts-kill-switch-1", x: 9, y: 3, w: 3, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);
```

---

## 9. Questions to Resolve

1. **Kill Switch as standalone widget vs sheet?** Currently a Sheet overlay. As a widget, it would be a permanent panel. Is permanent visibility preferred for emergency controls, or should it remain a button-triggered Sheet within the alerts-table widget?
2. **FilterBar integration**: Should `alerts-filter-bar` be a separate widget or embedded in `alerts-table`? Separate gives layout flexibility but adds coupling (filter state must be shared via context).
3. **Legacy filters removal**: The duplicate manual filter selects (lines 918–954) — confirm they should be deleted when the `FilterBar` component is the sole filter mechanism.
4. **Export location**: Export dropdown is in the header. Should it move into the alerts-table widget header, or be a standalone toolbar widget?
