# Phase 2d: Run Tab — Data Wiring Analysis

**Audit date:** 2026-03-21
**Scope:** Data sources, hooks, mock patterns, and real-time strategy for Run lifecycle pages

---

## Current State: 100% Flat Mocks

Every Run lifecycle page uses flat mock data. Zero pages use React Query hooks, MSW, or real API calls.

### Mock Data Sources

| Source File | Type | Used By | Key Exports |
| ----------- | ---- | ------- | ----------- |
| `lib/trading-data.ts` | Flat mock | Terminal, Markets, Dashboard | `ORGANIZATIONS`, `CLIENTS`, `STRATEGIES`, `ACCOUNTS`, `getFilteredStrategies`, `getAccountsForClient`, `getAggregatedPnL`, `getAggregatedTimeSeries`, `getLiveBatchDelta`, `getStrategyPerformance`, `getFilteredServices`, `getFilteredAlerts` |
| `lib/strategy-registry.ts` | Flat mock | Positions | `STRATEGIES`, `getAllPositions`, `getStrategyById` |
| `lib/reference-data.ts` | Flat mock | Positions, Markets | `formatCurrency`, `CLOB_VENUES`, `ZERO_ALPHA_VENUES`, `PNL_FACTORS`, `SERVICES` |
| `lib/execution-platform-mock-data.ts` | Flat mock | All execution pages | `MOCK_VENUES`, `MOCK_RECENT_ORDERS`, `MOCK_EXECUTION_METRICS`, `MOCK_EXECUTION_ALGOS`, `MOCK_ALGO_BACKTESTS` |

### Inline Mock Data (per page)

| Page | Inline Mocks |
| ---- | ------------ |
| Trading Terminal | `instruments[]` (6 items), `strategyInstruments{}`, `generateCandleData()`, `generateMockOrderBook()` |
| Trading Markets | `generateTimeSeriesData()`, `generatePnLComponents()`, `generateStrategyBreakdown()`, `generateFactorTimeSeries()`, `generateClientPnL()`, `generateLiveBookUpdates()`, `generateOrderFlowData()` |
| Dashboard | `mockAlerts[]` (8 items), `venueMargins[]` (5 items), `allMockServices[]` |
| Execution TCA | `TCA_BREAKDOWN[]`, `EXECUTION_TIMELINE[]`, `SLIPPAGE_DISTRIBUTION[]` |
| Execution Benchmarks | `BENCHMARKS[]`, `mockBenchmarkPerformance[]`, `generateSlippageTimeSeries()` |
| Execution Candidates | `mockCandidates[]` |
| Execution Handoff | `mockHandoff{}` |

---

## Available React Query Hooks (Not Used)

### `hooks/api/use-positions.ts`

| Hook | Endpoint | Could serve... |
| ---- | -------- | -------------- |
| `usePositions()` | `GET /api/positions` | Positions page (replaces `getAllPositions()` from strategy-registry) |
| `usePositionsSummary()` | `GET /api/positions/summary` | Dashboard KPI cards |
| `useBalances()` | `GET /api/positions/balances` | Accounts page, Dashboard margin utilization |

### `hooks/api/use-orders.ts`

| Hook | Endpoint | Could serve... |
| ---- | -------- | -------------- |
| `useOrders()` | `GET /api/orders` | Orders page (currently placeholder) |
| `useAlgos()` | `GET /api/algos` | Execution Algos page |
| `useVenues()` | `GET /api/venues` | Execution Venues page |
| `useAlgoBacktests()` | `GET /api/algo-backtests` | Execution Benchmarks page |

### `hooks/api/use-trading.ts`

| Hook | Endpoint | Could serve... |
| ---- | -------- | -------------- |
| `useOrganizations()` | `GET /api/organizations` | Terminal, Markets, Dashboard (replaces ORGANIZATIONS import) |
| `useTradingClients()` | `GET /api/clients` | Terminal, Markets, Dashboard (replaces CLIENTS import) |
| `usePnL()` | `GET /api/pnl` | Dashboard P&L cards |
| `usePnLTimeseries()` | `GET /api/pnl/timeseries` | Dashboard P&L chart, Markets time series |
| `useStrategyPerformance()` | `GET /api/strategies/performance` | Dashboard strategy table |
| `useLiveBatchDelta()` | `GET /api/live-batch-delta` | Dashboard LiveBatchComparison |

### `hooks/api/use-market-data.ts`

| Hook | Endpoint | Could serve... |
| ---- | -------- | -------------- |
| `useQuotes()` | `GET /api/market-data/quotes` | Terminal price ticks |
| `useOrderBook()` | `GET /api/market-data/order-book` | Terminal OrderBook component |

### `hooks/api/use-alerts.ts`

| Hook | Endpoint | Could serve... |
| ---- | -------- | -------------- |
| `useAlerts()` | `GET /api/alerts` | Dashboard AlertsFeed |

### `hooks/api/use-risk.ts`

| Hook | Endpoint | Could serve... |
| ---- | -------- | -------------- |
| `useRiskLimits()` | `GET /api/risk/limits` | Dashboard LimitBar |
| `useExposure()` | `GET /api/risk/exposure` | Dashboard risk metrics |

---

## Migration Priority

### Tier 1 — High Impact (enables workflow)

| Page | Current Source | Target Hook | Migration Effort |
| ---- | -------------- | ----------- | ---------------- |
| Positions | `getAllPositions()` flat mock | `usePositions()` | Medium — restructure data flow |
| Orders | Placeholder | `useOrders()` | High — build page from scratch |
| Dashboard KPIs | `getAggregatedPnL()` flat mock | `usePnL()`, `usePnLTimeseries()` | Medium |
| Dashboard Alerts | inline `mockAlerts[]` | `useAlerts()` | Low — swap data source |

### Tier 2 — Execution Platform

| Page | Current Source | Target Hook |
| ---- | -------------- | ----------- |
| Execution Algos | `MOCK_EXECUTION_ALGOS` | `useAlgos()` |
| Execution Venues | `MOCK_VENUES` | `useVenues()` |
| Execution Overview | All flat mocks | Multiple hooks |
| Execution TCA | `MOCK_RECENT_ORDERS` | `useOrders()` with TCA view |
| Execution Benchmarks | Inline mocks | `useAlgoBacktests()` |

### Tier 3 — Complex Pages

| Page | Current Source | Target Hook |
| ---- | -------------- | ----------- |
| Terminal | `lib/trading-data` + inline | `useOrganizations()`, `useTradingClients()`, `useQuotes()`, `useOrderBook()` |
| Markets/P&L | `lib/trading-data` + 7 generators | `usePnL()`, `usePnLTimeseries()`, `useStrategyPerformance()` |
| Dashboard (full) | `lib/trading-data` (7 functions) | All trading hooks |

---

## Real-Time Data Strategy

### Current

| Page | Mechanism | Frequency | Data |
| ---- | --------- | --------- | ---- |
| Terminal | `setInterval` | 500ms | Price ticks, recent trades |
| All others | None | Static | — |

### Recommended

| Page | Mechanism | Frequency | Data |
| ---- | --------- | --------- | ---- |
| Terminal | WebSocket | Real-time | Price ticks, order book, trades |
| Positions | React Query polling | 5s | Position updates, P&L |
| Dashboard | React Query polling | 10s | KPIs, alerts, health |
| Orders | React Query polling | 2s | Order status updates |
| Execution Overview | React Query polling | 30s | Venue health, metrics |

### Implementation

1. Create `hooks/api/use-websocket.ts` with reconnection logic
2. Add `refetchInterval` to React Query hooks for polling
3. Wire `use-market-data.ts` hooks into Terminal
4. Terminal transitions: `setInterval` → WebSocket for price data, React Query for order state

---

## Live/As-Of Toggle Wiring

**Current:** `LIVE_ASOF_VISIBLE.run = true` — toggle renders in both trading and execution layouts. But no page reads the toggle state.

**Target:** Toggle should set a global state (Zustand or URL param) that React Query hooks read to switch between:
- **Live mode:** `GET /api/positions?mode=live` — real-time data with polling
- **As-Of mode:** `GET /api/positions?mode=asof&timestamp=2026-03-20T16:00:00Z` — historical snapshot

**Implementation:**
1. `LiveAsOfToggle` stores state in `lib/stores/live-asof-store.ts`
2. React Query hooks read store: `const { mode, asOfTimestamp } = useLiveAsOfStore()`
3. Pass mode and timestamp as query params to all API calls
4. As-Of mode disables polling/WebSocket; Live mode enables them
