# Markets Page — Widget Decomposition Spec

Tab: `markets`
Source: `app/(platform)/services/trading/markets/page.tsx`
Lines: ~1725

---

## 1. Page Analysis

This is the second-largest page, structured as a tabbed interface with three main tabs: Trade Desk (order flow analytics), Latency (service performance), and Reconciliation. It also includes the full P&L attribution tab from the markets version. The P&L section is nearly identical to the standalone `pnl/page.tsx` — see the pnl-widgets spec for that portion.

### Current Sections

| Section                          | Lines     | Description                                                                                   |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| Header + Controls                | 712–782   | Title, view/data mode toggles, date range, generate report button                             |
| Tabs                             | 785–799   | `Trade Desk`, `Latency`, `Reconciliation`                                                     |
| **Trade Desk Tab**               | 803–1253  |                                                                                               |
| ├── Controls bar                 | 805–865   | View toggle (Market Orders/Live Book/My Orders), asset class selector, date range, book depth |
| ├── DeFi Notice                  | 868–883   | Warning card for DeFi AMM vs order book                                                       |
| ├── Market Orders view           | 886–962   | Scrollable table: exch time, local time, delay, type, side, price, size, venue, aggressor     |
| ├── Live Book view (CeFi/TradFi) | 965–1112  | HFT-style flattened table: bid levels (reversed), center trade column, ask levels + legend    |
| ├── DeFi AMM view                | 1115–1169 | Liquidity pool activity table: swaps, LP actions, price impact, gas                           |
| └── My Orders view               | 1172–1252 | Own order table with order ID, timestamps, fill indicators                                    |
| **Reconciliation Tab**           | 1256–1297 | Recon runs list: date, break count, resolved/total, break value                               |
| **Latency Tab**                  | 1300–1718 |                                                                                               |
| ├── Controls bar                 | 1302–1372 | View mode (cross-section/time-series), data mode (live/batch/compare), back button            |
| ├── Summary view                 | 1375–1471 | Service list with health dot, p50/p95/p99 columns, clickable drill-down                       |
| ├── Detail: Service header       | 1481–1532 | Selected service KPIs (p50/p95/p99) with compare deltas                                       |
| ├── Detail: Lifecycle breakdown  | 1535–1585 | Per-stage latency bars with percentage                                                        |
| ├── Detail: Time series          | 1588–1651 | Recharts AreaChart p50/p95/p99 over 24h                                                       |
| └── Detail: Compare table        | 1654–1715 | Live vs Batch side-by-side latency per stage                                                  |

### Data Hooks Used

- `useTickers()` — market data, also carries reconRuns, latencyMetrics, structuralPnL, residualPnL from API
- `useStrategyPerformance()` — strategy list
- `useOrganizationsList()` — org/client hierarchy
- `useGlobalScope()` — global scope filtering

### Inline Mock Data

- **All P&L generators** (lines 78–412) — identical to pnl/page.tsx (see pnl spec)
- **Order flow generators**: `generateOrderFlowData()` (~100 lines), `generateLiveBookUpdates()` (~100 lines) — seeded random generators
- **Venue constants**: `CRYPTO_VENUES`, `TRADFI_VENUES`, `DEFI_VENUES` (lines 458–461)
- **Recon runs**: `reconRuns` fallback array (lines 482–487)
- **Latency metrics**: `_latencyMetricsPlaceholder` (~130 lines, lines 695–816) — 5 services with lifecycle stages, batch comparisons, time series
- **Order flow types**: `OrderFlowEntry`, `LiveBookUpdate` interfaces (~50 lines)

This page has **~700 lines of inline mock data and generators** — the most of any page.

---

## 2. Widget Decomposition

| id                        | label              | description                                                                                    | icon             | minW | minH | defaultW | defaultH | singleton |
| ------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- | ---------------- | ---- | ---- | -------- | -------- | --------- |
| `markets-controls`        | Markets Controls   | View mode, data mode, date range, asset class selector                                         | `LayoutGrid`     | 4    | 1    | 12       | 1        | yes       |
| `markets-order-flow`      | Market Order Flow  | Scrollable order table with timestamps, latency, side, venue, aggressor indicators             | `ArrowRightLeft` | 6    | 4    | 12       | 7        | yes       |
| `markets-live-book`       | Live Order Book    | HFT-style flattened book view: bid levels + center trade + ask levels with update highlighting | `BarChart3`      | 8    | 4    | 12       | 7        | yes       |
| `markets-my-orders`       | My Orders          | Own order history with fill status, order IDs, latency                                         | `FileText`       | 6    | 3    | 12       | 5        | yes       |
| `markets-recon`           | Reconciliation     | Recon run list with break counts, resolution status, break value                               | `AlertTriangle`  | 4    | 3    | 12       | 4        | yes       |
| `markets-latency-summary` | Latency Summary    | Service health grid with p50/p95/p99 columns, clickable drill-down                             | `Clock`          | 4    | 3    | 12       | 5        | yes       |
| `markets-latency-detail`  | Latency Detail     | Selected service deep-dive: KPIs, lifecycle breakdown bars, time series chart, compare table   | `Activity`       | 6    | 4    | 12       | 6        | yes       |
| `markets-defi-amm`        | DeFi Pool Activity | Liquidity pool swap and LP activity table for DeFi venues                                      | `Database`       | 6    | 3    | 12       | 5        | yes       |

---

## 3. Data Context Shape

```typescript
export interface MarketsData {
  // Order flow
  orderFlowData: OrderFlowEntry[];
  liveBookUpdates: LiveBookUpdate[];
  ownOrders: OrderFlowEntry[];

  // Controls
  orderFlowRange: "1d" | "1w" | "1m";
  setOrderFlowRange: (r: "1d" | "1w" | "1m") => void;
  orderFlowView: "orders" | "book" | "own";
  setOrderFlowView: (v: "orders" | "book" | "own") => void;
  assetClass: "crypto" | "tradfi" | "defi";
  setAssetClass: (ac: "crypto" | "tradfi" | "defi") => void;
  bookDepth: number;
  setBookDepth: (d: number) => void;

  // Reconciliation
  reconRuns: ReconRun[];

  // Latency
  latencyMetrics: LatencyMetric[];
  selectedLatencyService: string | null;
  setSelectedLatencyService: (id: string | null) => void;
  latencyViewMode: "cross-section" | "time-series";
  setLatencyViewMode: (m: "cross-section" | "time-series") => void;
  latencyDataMode: "live" | "batch" | "compare";
  setLatencyDataMode: (m: "live" | "batch" | "compare") => void;

  // Global
  viewMode: "cross-section" | "time-series";
  setViewMode: (m: "cross-section" | "time-series") => void;
  dataMode: "live" | "batch";
  setDataMode: (m: "live" | "batch") => void;
  dateRange: string;
  setDateRange: (d: string) => void;

  // Loading
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

interface OrderFlowEntry {
  id: string;
  exchangeTime: string;
  localTime: string;
  delayMs: number;
  type: "bid" | "ask" | "trade";
  side: "buy" | "sell";
  price: number;
  size: number;
  venue: string;
  isOwn: boolean;
  orderId?: string;
  aggressor?: "buyer" | "seller";
  level?: number;
}

interface LiveBookUpdate {
  id: string;
  exchangeTime: string;
  localTime: string;
  delayMs: number;
  updateType: "book" | "trade";
  bidLevels?: Array<{ price: number; size: number; updated?: boolean }>;
  askLevels?: Array<{ price: number; size: number; updated?: boolean }>;
  trade?: {
    price: number;
    size: number;
    side: "buy" | "sell";
    aggressor: "buyer" | "seller";
    isOwn: boolean;
    orderId?: string;
  };
  venue: string;
}

interface ReconRun {
  date: string;
  status: string;
  breaks: number;
  resolved: number;
  totalValue: number;
}

interface LatencyMetric {
  service: string;
  serviceId: string;
  p50: number;
  p95: number;
  p99: number;
  status: "healthy" | "warning" | "critical";
  lifecycle: Array<{ stage: string; p50: number; p95: number; p99: number }>;
  batch: { p50: number; p95: number; p99: number };
  timeSeries: Array<{ time: string; p50: number; p95: number; p99: number }>;
}
```

---

## 4. Mock Data Instructions

- **Move**: `generateOrderFlowData()`, `generateLiveBookUpdates()` → `lib/mocks/generators/order-flow-generators.ts`
- **Move**: `OrderFlowEntry`, `LiveBookUpdate` interfaces → `lib/types/markets.ts`
- **Move**: `CRYPTO_VENUES`, `TRADFI_VENUES`, `DEFI_VENUES` → `lib/config/services/markets.config.ts`
- **Move**: `LatencyMetric` interface + `_latencyMetricsPlaceholder` → `lib/mocks/fixtures/latency-metrics.ts` + `lib/types/markets.ts`
- **Move**: `reconRuns` fallback → `lib/mocks/fixtures/recon-runs.ts`
- **Shared P&L generators**: Already covered in pnl spec — extract once, import in both pages
- **Add MSW handlers**:
  - `useOrderFlow()` — order flow data
  - `useLiveBook()` — book updates
  - `useReconRuns()` — reconciliation runs
  - `useLatencyMetrics()` — service latency
- **Total inline mock data to extract**: ~700 lines (the most of any page)

---

## 5. UI/UX Notes

- **Live Book table complexity**: The HFT-style flattened book view (bid levels reversed, center trade column, ask levels) is the most complex table in the codebase. In widget form, this needs careful responsive handling:
  - At `w=8+`: Full depth display
  - At `w=6-7`: Reduce to 3 levels
  - At `w<6`: Not recommended (set `minW=8` for this widget)
- **DeFi notice card**: When `assetClass === "defi"` and `orderFlowView === "book"`, show the AMM notice. In widget form, the DeFi Pool Activity widget (`markets-defi-amm`) replaces the Live Book widget contextually.
- **Latency drill-down**: Clicking a service in the summary navigates to the detail view. In widget form, `markets-latency-summary` and `markets-latency-detail` communicate via `selectedLatencyService` in the data context.
- **Compare mode**: The latency compare table (live vs batch per stage) is wide — needs horizontal scroll at narrow widths. Set `minW=6`.
- **Color coding**: Latency uses health dots (green/amber/red) and threshold-based coloring (p99 > 30ms = warning). Preserve these in widget form.
- **Legend bar**: The Live Book has a legend row explaining color codes (Market Trade, Own Trade, Updated Bid/Ask). Include this as a footer in the widget.

---

## 6. Collapsible Candidates

| Section                     | Collapsible?       | Reason                                      |
| --------------------------- | ------------------ | ------------------------------------------- |
| Controls bar                | No                 | Essential for all widgets                   |
| DeFi AMM notice             | No                 | Contextual warning, small footprint         |
| Order flow table legend     | Yes (default open) | Can collapse for more data rows             |
| Latency lifecycle breakdown | No                 | Core detail content                         |
| Latency compare table       | Yes (default open) | Dense data, can collapse when not comparing |
| Recon runs                  | No                 | Already compact                             |

---

## 7. Reusable Component Usage

| Shared Component     | Used In                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `KpiStrip`           | `markets-latency-detail` — p50/p95/p99 KPIs for selected service                                       |
| `DataTableWidget`    | `markets-order-flow` — order flow rows; `markets-my-orders` — own orders; `markets-recon` — recon runs |
| `CollapsibleSection` | Latency compare table, order flow legend                                                               |
| `FilterBarWidget`    | Not used — controls are toggle buttons/selects, not filter pattern                                     |

---

## 8. Default Preset Layout

12-column grid — three preset options for the three sub-domains:

### Default (Trade Desk Focus)

```
| markets-controls (0,0) w=12 h=1                                |
| markets-order-flow (0,1) w=12 h=7                              |
| markets-recon (0,8) w=6 h=4    | markets-latency-summary (6,8) w=6 h=4 |
```

### Live Book Focus

```
| markets-controls (0,0) w=12 h=1                                |
| markets-live-book (0,1) w=12 h=8                               |
| markets-my-orders (0,9) w=12 h=4                               |
```

### Latency Focus

```
| markets-controls (0,0) w=12 h=1                                |
| markets-latency-summary (0,1) w=5 h=6 | markets-latency-detail (5,1) w=7 h=6 |
| markets-recon (0,7) w=12 h=4                                   |
```

```typescript
registerPresets("markets", [
  {
    id: "markets-default",
    name: "Trade Desk",
    tab: "markets",
    isPreset: true,
    layouts: [
      { widgetId: "markets-controls", instanceId: "markets-controls-1", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "markets-order-flow", instanceId: "markets-order-flow-1", x: 0, y: 1, w: 12, h: 7 },
      { widgetId: "markets-recon", instanceId: "markets-recon-1", x: 0, y: 8, w: 6, h: 4 },
      { widgetId: "markets-latency-summary", instanceId: "markets-latency-summary-1", x: 6, y: 8, w: 6, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "markets-live-book",
    name: "Live Book",
    tab: "markets",
    isPreset: true,
    layouts: [
      { widgetId: "markets-controls", instanceId: "markets-controls-1", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "markets-live-book", instanceId: "markets-live-book-1", x: 0, y: 1, w: 12, h: 8 },
      { widgetId: "markets-my-orders", instanceId: "markets-my-orders-1", x: 0, y: 9, w: 12, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "markets-latency",
    name: "Latency",
    tab: "markets",
    isPreset: true,
    layouts: [
      { widgetId: "markets-controls", instanceId: "markets-controls-1", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "markets-latency-summary", instanceId: "markets-latency-summary-1", x: 0, y: 1, w: 5, h: 6 },
      { widgetId: "markets-latency-detail", instanceId: "markets-latency-detail-1", x: 5, y: 1, w: 7, h: 6 },
      { widgetId: "markets-recon", instanceId: "markets-recon-1", x: 0, y: 7, w: 12, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);
```

---

## 9. Questions to Resolve

1. **P&L overlap with pnl/ page**: The markets page's original `markets/page.tsx` has a P&L Attribution tab that is nearly identical to `pnl/page.tsx`. The newer API-backed version (`markets/page.tsx` with hooks) removes it. Should P&L widgets be shared across both `pnl` and `markets` tabs via `availableOn: ["pnl", "markets"]`?
2. **Tab structure → Widget presets**: The current page uses Tabs (Trade Desk / Latency / Recon). In widget form, these become preset layouts rather than tabs. Is that the desired UX, or should tabs remain within a single widget?
3. **Live Book minimum width**: The HFT book table needs significant horizontal space (2 \* depth columns + 3 metadata columns + center trade). Should `minW` be 8 (recommended) or is 6 acceptable with horizontal scroll?
4. **Asset class switching**: Changing asset class switches between CeFi order book view and DeFi AMM view. Should these be separate widgets (`markets-live-book` + `markets-defi-amm`) or a single adaptive widget?
5. **Latency detail as overlay vs panel**: Currently, clicking a service replaces the summary with a detail view (navigational). In widget form, summary and detail are side-by-side. Does the detail widget show empty state when no service is selected, or should it be hidden and auto-added to layout on click?
6. **Order flow data volume**: Generators create 100–2000 entries per call. In widget form with auto-refresh, should pagination be added to limit rendering? The current `slice(0, 100)` is a good pattern.
7. **Recon runs data**: Currently a small hardcoded array of 4 items. Is there a planned API endpoint, or should this use a `useReconRuns()` hook with MSW?
