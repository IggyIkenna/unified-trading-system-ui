# Orders Page — Widget Decomposition Spec

**Source:** `app/(platform)/services/trading/orders/page.tsx` (824 lines)
**Tab ID:** `orders`
**Date:** 2026-03-27

---

## 1. Page Analysis

### Current Sections (top → bottom)

| #   | Section               | Lines   | Description                                                                   |
| --- | --------------------- | ------- | ----------------------------------------------------------------------------- |
| 1   | Header                | 638–662 | Page title, order count badge, Refresh + Export buttons                       |
| 2   | Summary Badges        | 665–684 | 3 status badges: Open, Partial, Filled counts                                 |
| 3   | Instrument Type Pills | 687–699 | Horizontal button group: All/Spot/Perp/Futures/Options/DeFi/Prediction        |
| 4   | FilterBar             | 702–708 | Unified filter bar (search, venue, status)                                    |
| 5   | Inline Filters        | 711–749 | Duplicate search input + venue select + status select                         |
| 6   | Orders DataTable      | 752–762 | Full orders table via `DataTable` (tanstack) with 15 columns + action buttons |
| 7   | Amend Dialog          | 765–820 | Modal dialog for amending order qty/price                                     |

### Data Hooks Used

- `useOrders()` → `hooks/api/use-orders.ts` — orders array from `/api/execution/orders`
- `useCancelOrder()` → `hooks/api/use-orders.ts` — mutation to cancel an order
- `useAmendOrder()` → `hooks/api/use-orders.ts` — mutation to amend order price/qty
- `useGlobalScope()` → `lib/stores/global-scope-store.ts` — strategy ID scoping

### Inline Mock Data

- `InstrumentType` / `INSTRUMENT_TYPES` (lines 52–69) — **identical to positions page**, must be extracted
- `classifyInstrument()` (lines 71–97) — **identical to positions page**
- `getInstrumentRoute()` (lines 99–117) — **identical to positions page**
- `STATUS_COLORS` map (lines 138–144) — order status color mapping, keep near orders config
- `OrderRecord` interface (lines 119–136) — order type definition

---

## 2. Widget Decomposition

| #   | Widget ID          | Label         | Description                                     | Icon          | minW | minH | defaultW | defaultH | Singleton |
| --- | ------------------ | ------------- | ----------------------------------------------- | ------------- | ---- | ---- | -------- | -------- | --------- |
| 1   | `orders-kpi-strip` | Order Summary | 4 KPIs: total, open, partial, filled counts     | `ArrowUpDown` | 4    | 1    | 12       | 1        | yes       |
| 2   | `orders-filter`    | Order Filters | Unified filter bar + instrument type pills      | `Filter`      | 4    | 1    | 12       | 2        | yes       |
| 3   | `orders-table`     | Orders Table  | Full orders DataTable with cancel/amend actions | `Table2`      | 6    | 3    | 12       | 8        | yes       |

### Notes

- The **Amend Dialog** is not a widget — it's a modal triggered from the table. Keep it inside the `orders-table` widget component or in the data context provider (since it needs mutation hooks).
- The inline filters section (lines 711–749) **duplicates** the FilterBar. Remove during widgetization.
- Header (title + badge) is redundant in widget mode — the workspace toolbar shows the tab name. The Refresh and Export buttons should move to widget header actions.
- The current page uses tanstack `DataTable` component (not raw `<Table>`). The widget can wrap this directly rather than converting to `DataTableWidget` shared component, since `DataTable` already has sorting, column visibility, and pagination.

---

## 3. Data Context Shape

```typescript
interface OrdersDataContext {
  // Raw data from hooks
  orders: OrderRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;

  // Mutations
  cancelOrder: (orderId: string) => void;
  isCancelling: boolean;
  openAmendDialog: (order: OrderRecord) => void;
  submitAmend: (orderId: string, qty: number, price: number) => void;
  isAmending: boolean;

  // Derived / filtered
  filteredOrders: OrderRecord[];
  summary: {
    total: number;
    open: number;
    filled: number;
    partial: number;
  };

  // Filter state
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  venueFilter: string;
  setVenueFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  instrumentTypeFilter: InstrumentType;
  setInstrumentTypeFilter: (t: InstrumentType) => void;
  resetFilters: () => void;

  // Unique values for filter dropdowns
  uniqueVenues: string[];
  uniqueStatuses: string[];

  // Amend dialog state
  amendTarget: OrderRecord | null;
  setAmendTarget: (order: OrderRecord | null) => void;
}
```

---

## 4. Mock Data Instructions

| Current Location                                | Target Location                                | Action                               |
| ----------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| `InstrumentType` / `INSTRUMENT_TYPES` (line 52) | `lib/config/services/trading.config.ts`        | Extract — shared with positions page |
| `classifyInstrument()` (line 71)                | `lib/utils/instrument-classification.ts`       | Extract — shared with positions page |
| `getInstrumentRoute()` (line 99)                | `lib/utils/instrument-classification.ts`       | Extract — shared with positions page |
| `STATUS_COLORS` (line 138)                      | `lib/config/services/orders.config.ts`         | Move — order-specific config         |
| `OrderRecord` interface (line 119)              | `lib/types/trading.ts`                         | Extract — shared type                |
| `isActionable()` (line 154)                     | `lib/utils/order-utils.ts` or inline in widget | Extract                              |
| Export columns (line 597)                       | Keep inline in `orders-table` widget           | No move needed                       |

The MSW handler at `lib/mocks/handlers/orders.ts` (or similar) should provide mock orders with `edge_bps`, `instant_pnl`, `mark_price`, and `strategy_name` fields. Verify these fields are present.

---

## 5. UI/UX Notes

- **Duplicate filters:** Lines 711–749 are a second search/venue/status row that duplicates the FilterBar at line 702. Remove the inline filters entirely during widgetization.
- **Summary badges vs KPI strip:** The current 3 inline badges (Open/Partial/Filled) are text-only. Converting to `KpiStrip` with 4 metrics (adding Total) gives a more consistent look across pages.
- **Column density:** The DataTable has 15 columns (order_id, instrument, side, type, price, mark, edge, instant_pnl, strategy, qty, filled, status, venue, created, actions). This is wide. Consider:
  - Default column visibility: hide `order_id` (truncated anyway), `mark_price`, and `rho` by default
  - The DataTable already has `enableColumnVisibility` — users can toggle
- **Action buttons:** Cancel (red) and Amend (blue) are compact (`h-7 px-2 text-xs`). Good sizing. Keep as-is.
- **Amend dialog:** Uses full `Dialog` component with qty + price inputs. This is fine — keep as modal. No widget needed.

---

## 6. Collapsible Candidates

| Section      | Default State | Reason                             |
| ------------ | ------------- | ---------------------------------- |
| KPI Strip    | Open          | Lightweight summary; always useful |
| Filters      | Open          | Primary interaction point          |
| Orders Table | Open          | Primary content — this IS the page |

No sections need collapsing. The orders page is relatively flat — filters + table. The `CollapsibleSection` is not needed here.

---

## 7. Reusable Component Usage

| Shared Component     | Used In Widget     | Notes                                                                                                                                         |
| -------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `KpiStrip`           | `orders-kpi-strip` | 4 metrics: Total (neutral), Open (chart-1 color), Partial (warning), Filled (live). `columns={4}`                                             |
| `FilterBarWidget`    | `orders-filter`    | Pass `orderFilterDefs`. Add instrument type pills as trailing row                                                                             |
| `DataTableWidget`    | —                  | **Not used** — the page already uses tanstack `DataTable` which is more feature-rich (sorting, column visibility, pagination). Wrap directly. |
| `CollapsibleSection` | —                  | Not needed for this page                                                                                                                      |

---

## 8. Default Preset Layout

12-column grid. Row height unit = ~40px.

```typescript
registerPresets("orders", [
  {
    id: "orders-default",
    name: "Default",
    tab: "orders",
    isPreset: true,
    layouts: [
      { widgetId: "orders-filter", instanceId: "orders-filter-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "orders-kpi-strip", instanceId: "orders-kpi-strip-1", x: 0, y: 2, w: 12, h: 1 },
      { widgetId: "orders-table", instanceId: "orders-table-1", x: 0, y: 3, w: 12, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);
```

Visual layout (12 cols):

```
┌──────────────────────────────────────────────┐ y=0, h=2
│  orders-filter (search + pills)              │
├──────────────────────────────────────────────┤ y=2, h=1
│  orders-kpi-strip (total/open/partial/filled)│
├──────────────────────────────────────────────┤ y=3, h=8
│  orders-table (DataTable + actions)          │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 9. Questions to Resolve

1. **Amend dialog ownership:** Should the Amend `Dialog` component live inside the `orders-table` widget, or in the `OrdersDataProvider` context? If in the provider, any widget can trigger it (e.g., a future "quick amend" widget). Recommendation: keep in the data provider.

2. **Column visibility defaults:** With 15 columns, some will overflow on smaller screens. Should the widget spec define default visible columns, or leave that to user preference stored in workspace config?

3. **Cancel confirmation:** Currently `cancelOrder.mutate(orderId)` fires immediately with no confirmation. Should widgetization add a confirmation toast/dialog? (Risk: accidental cancellation.)

4. **Global scope filtering:** The `scopedOrders` memo filters by `globalScope.strategyIds` but falls back to showing all if `strategy_id` is missing on the order record (line 474–477). Is this correct behavior, or should orders without a strategy_id be hidden when a global scope is active?

5. **Instrument type classification:** The `classifyInstrument()` function is duplicated verbatim from positions. This **must** be extracted to a shared utility before widgetization to avoid triple maintenance (positions, orders, and potentially future pages).
