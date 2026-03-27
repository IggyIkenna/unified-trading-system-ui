# Positions Page — Widget Decomposition Spec

**Source:** `app/(platform)/services/trading/positions/page.tsx` (912 lines)
**Tab ID:** `positions`
**Date:** 2026-03-27

---

## 1. Page Analysis

### Current Sections (top → bottom)

| #   | Section                        | Lines   | Description                                                                 |
| --- | ------------------------------ | ------- | --------------------------------------------------------------------------- |
| 1   | FilterBar                      | 469–475 | Unified filter bar (search, strategy, venue, side)                          |
| 2   | Instrument Type Pills          | 478–490 | Horizontal button group: All/Spot/Perp/Futures/Options/DeFi/Prediction      |
| 3   | Account Balances (collapsible) | 493–585 | Table of venue balances with utilization progress bars                      |
| 4   | Summary KPIs                   | 588–661 | 6-card grid: Positions, Total Notional, Unrealized P&L, Margin, Long, Short |
| 5   | Inline Filters                 | 664–740 | Duplicate search + dropdowns + Refresh + Export + "View Strategy" link      |
| 6   | Positions Table                | 743–893 | Full positions table with instrument links, side badges, P&L, health factor |

### Data Hooks Used

- `usePositions()` → `hooks/api/use-positions.ts` — positions array from `/api/positions/active`
- `useBalances()` → `hooks/api/use-positions.ts` — balances array from `/api/positions/balances`
- `useGlobalScope()` → `lib/stores/global-scope-store.ts` — strategy ID filtering
- `useExecutionMode()` → `lib/execution-mode-context.ts` — live/batch toggle
- `useWebSocket()` → `hooks/use-websocket.ts` — real-time PnL updates (ws://localhost:8030/ws)
- `useQueryClient()` — manual cache updates from WebSocket messages

### Inline Mock Data

- `DEFI_VENUES` set (lines 67–74) — hardcoded venue names
- `INSTRUMENT_TYPES` array (lines 86–94) — classification list
- `classifyInstrument()` / `getInstrumentRoute()` helper functions (lines 96–148) — should be shared utilities

---

## 2. Widget Decomposition

| #   | Widget ID             | Label            | Description                                                          | Icon       | minW | minH | defaultW | defaultH | Singleton |
| --- | --------------------- | ---------------- | -------------------------------------------------------------------- | ---------- | ---- | ---- | -------- | -------- | --------- |
| 1   | `positions-kpi-strip` | Position Summary | 6 KPIs: count, notional, unrealized P&L, margin, long/short exposure | `Activity` | 4    | 1    | 12       | 2        | yes       |
| 2   | `positions-filter`    | Position Filters | Unified filter bar + instrument type pills                           | `Filter`   | 4    | 1    | 12       | 2        | yes       |
| 3   | `positions-table`     | Positions Table  | Main positions data table with instrument links, side, P&L, health   | `Table2`   | 6    | 3    | 12       | 6        | yes       |
| 4   | `account-balances`    | Account Balances | Venue balances table with utilization bars, collapsible              | `Wallet`   | 4    | 2    | 12       | 3        | yes       |

### Notes

- The inline filters section (lines 664–740) is a **duplicate** of the FilterBar. During widgetization, consolidate into a single `positions-filter` widget using `FilterBarWidget`. Remove the inline search/select/refresh row.
- The "Refresh" button and "Export" dropdown should be toolbar actions on the `positions-table` widget header.
- The "View Strategy Details" link should remain contextual on the filter widget when a strategy is selected.

---

## 3. Data Context Shape

```typescript
interface PositionsDataContext {
  // Raw data from hooks
  positions: PositionRecord[];
  balances: BalanceRecord[];
  isLoading: boolean;
  positionsError: Error | null;
  refetchPositions: () => void;

  // Derived / filtered
  filteredPositions: PositionRecord[];
  summary: {
    totalPositions: number;
    totalNotional: number;
    unrealizedPnL: number;
    totalMargin: number;
    longExposure: number;
    shortExposure: number;
  };

  // Filter state
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  venueFilter: string;
  setVenueFilter: (v: string) => void;
  sideFilter: "all" | "LONG" | "SHORT";
  setSideFilter: (s: "all" | "LONG" | "SHORT") => void;
  strategyFilter: string;
  setStrategyFilter: (s: string) => void;
  instrumentTypeFilter: InstrumentType;
  setInstrumentTypeFilter: (t: InstrumentType) => void;
  resetFilters: () => void;

  // Unique values for filter dropdowns
  uniqueVenues: string[];
  uniqueStrategies: [string, string][];

  // Execution mode
  isLive: boolean;
}
```

---

## 4. Mock Data Instructions

| Current Location                      | Target Location                           | Action                                         |
| ------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `DEFI_VENUES` (line 67)               | `lib/config/services/positions.config.ts` | Move — this is reference config, not mock data |
| `INSTRUMENT_TYPES` (line 86)          | `lib/config/services/trading.config.ts`   | Move — shared across positions & orders pages  |
| `classifyInstrument()` (line 96)      | `lib/utils/instrument-classification.ts`  | Extract — duplicated in orders page            |
| `getInstrumentRoute()` (line 130)     | `lib/utils/instrument-classification.ts`  | Extract — duplicated in orders page            |
| `PositionRecord` interface (line 151) | `lib/types/trading.ts`                    | Extract — used by mock handlers too            |
| `BalanceRecord` interface (line 170)  | `lib/types/trading.ts`                    | Extract — shared type                          |
| Export columns (line 430)             | Keep inline in `positions-table` widget   | No move needed                                 |

The MSW handler at `lib/mocks/handlers/positions.ts` should already provide mock positions and balances. Verify it returns `health_factor` for DeFi venue positions.

---

## 5. UI/UX Notes

- **Duplicate filters:** Lines 664–740 are a second search/select row that duplicates the FilterBar. Remove during widgetization — the `FilterBarWidget` handles everything.
- **KPI card sizing:** Current KPI cards use `text-2xl` which is oversized for a widget panel. Use the shared `KpiStrip` component which uses `text-sm font-mono` — more compact and consistent.
- **Instrument type pills:** Currently `h-7 px-3 text-xs` which is compact. Keep this sizing. Consider integrating as a second row inside the filter widget.
- **Table padding:** The positions table has default Card padding. Inside a widget, use `p-0` on CardContent (already done at line 752).
- **Health factor column:** Only relevant for DeFi venues. Consider conditionally hiding when instrument type filter excludes DeFi.

---

## 6. Collapsible Candidates

| Section          | Default State | Reason                                                                                     |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------ |
| Account Balances | **Collapsed** | Already collapsible in current page; secondary info; most users care about positions first |
| KPI Strip        | Open          | Primary glanceable metrics; always visible                                                 |
| Filters          | Open          | Must be visible to interact                                                                |
| Positions Table  | Open          | Primary content                                                                            |

The `account-balances` widget should use `CollapsibleSection` with `defaultOpen={false}`.

---

## 7. Reusable Component Usage

| Shared Component     | Used In Widget        | Notes                                                                                            |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| `KpiStrip`           | `positions-kpi-strip` | 6 metrics → `columns={6}`. Sentiments: P&L = dynamic, exposure = neutral                         |
| `FilterBarWidget`    | `positions-filter`    | Pass existing `positionFilterDefs`. Add instrument type pills as custom trailing element         |
| `DataTableWidget`    | `positions-table`     | Convert existing table to column definitions. Add `compact={true}`                               |
| `CollapsibleSection` | `account-balances`    | Wrap balance table. `title="Account Balances"`, `defaultOpen={false}`, `count={balances.length}` |

---

## 8. Default Preset Layout

12-column grid. Row height unit = ~40px.

```typescript
registerPresets("positions", [
  {
    id: "positions-default",
    name: "Default",
    tab: "positions",
    isPreset: true,
    layouts: [
      { widgetId: "positions-filter", instanceId: "positions-filter-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "positions-kpi-strip", instanceId: "positions-kpi-strip-1", x: 0, y: 2, w: 12, h: 2 },
      { widgetId: "account-balances", instanceId: "account-balances-1", x: 0, y: 4, w: 12, h: 3 },
      { widgetId: "positions-table", instanceId: "positions-table-1", x: 0, y: 7, w: 12, h: 6 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);
```

Visual layout (12 cols):

```
┌──────────────────────────────────────────────┐ y=0, h=2
│  positions-filter (search + pills)           │
├──────────────────────────────────────────────┤ y=2, h=2
│  positions-kpi-strip (6 metrics)             │
├──────────────────────────────────────────────┤ y=4, h=3
│  account-balances (collapsible table)        │
├──────────────────────────────────────────────┤ y=7, h=6
│  positions-table (main data)                 │
└──────────────────────────────────────────────┘
```

---

## 9. Questions to Resolve

1. **WebSocket integration:** The current page connects to `ws://localhost:8030/ws` for real-time PnL. Should the WebSocket connection live in the data context provider, or should each widget independently subscribe? (Recommendation: data context provider manages the single connection.)

2. **Instrument classification duplication:** `classifyInstrument()` and `getInstrumentRoute()` are duplicated verbatim between positions and orders pages. Should these be extracted to a shared util before or during widgetization?

3. **URL param strategy filter:** The page reads `?strategy_id=` from URL search params. After widgetization, should this remain as URL-driven (good for deep links) or move to widget config?

4. **Export dropdown placement:** Currently in the inline filter row. Should it move to the widget header actions (like the overview widgets), or stay inside the filter widget?

5. **"View Strategy Details" link:** Only visible when a strategy is selected. Keep as a contextual action in the filter widget, or move to the table as a row action?
