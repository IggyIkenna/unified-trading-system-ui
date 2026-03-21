# Phase 2d: Run Tab — Component Inventory

**Audit date:** 2026-03-21
**Scope:** All pages under TRADING_TABS (6) + EXECUTION_TABS (5) + orphans (2) + standalone (2)

---

## Summary

| Category | Pages | Functional | Placeholder | Total Lines |
| -------- | ----- | ---------- | ----------- | ----------- |
| Trading | 6 | 4 | 2 | ~3,366 |
| Execution | 7 | 7 | 0 | ~2,320 |
| Standalone | 2 | 2 | 0 | ~590 |
| **Total** | **15** | **13** | **2** | **~6,276** |

---

## Trading Pages

### Terminal (`/service/trading/overview`) — 560 lines

| Component | Source | Purpose |
| --------- | ------ | ------- |
| `OrderBookWithDepth` | `@/components/trading/order-book` | Combined order book + depth chart |
| `OrderBook` | `@/components/trading/order-book` | Standalone order book |
| `DepthChart` | `@/components/trading/order-book` | Market depth visualization |
| `CandlestickChart` | `@/components/trading/candlestick-chart` | Price chart (uses lightweight-charts) |
| `Card`, `Button`, `Badge`, `Tabs`, `Select`, `Input` | `@/components/ui/*` | UI primitives |
| recharts (`AreaChart`, `BarChart`, etc.) | `recharts` | P&L/volume charts |

**Hooks:** `useGlobalScope`, `useState` (7), `useEffect` (2), `useMemo` (3), `useRef` (1)
**Data:** `lib/trading-data` (STRATEGIES, ACCOUNTS, CLIENTS, ORGANIZATIONS) + inline mocks

---

### Positions (`/service/trading/positions`) — 620 lines

| Component | Source | Purpose |
| --------- | ------ | ------- |
| `ExecutionModeToggle` | `@/components/trading/execution-mode-toggle` | Live/paper toggle |
| `ExecutionModeIndicator` | `@/components/trading/execution-mode-toggle` | Mode status badge |
| `Card`, `Table`, `Select`, `Input`, `Collapsible`, `Progress`, `Badge`, `Button` | `@/components/ui/*` | UI primitives |

**Hooks:** `useSearchParams`, `useExecutionMode`, `useState` (5), `useEffect` (1), `useMemo` (3)
**Data:** `lib/strategy-registry` (getAllPositions, getStrategyById, STRATEGIES) + `lib/reference-data`

---

### Orders (`/service/trading/orders`) — 25 lines ⚠ PLACEHOLDER

| Component | Source | Purpose |
| --------- | ------ | ------- |
| `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge` | `@/components/ui/*` | UI primitives |
| `ArrowUpDown` | `lucide-react` | Icon |

**Hooks:** None
**Data:** None (static "Coming Soon")

---

### Accounts (`/service/trading/accounts`) — 25 lines ⚠ PLACEHOLDER

| Component | Source | Purpose |
| --------- | ------ | ------- |
| `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge` | `@/components/ui/*` | UI primitives |
| `Wallet` | `lucide-react` | Icon |

**Hooks:** None
**Data:** None (static "Coming Soon")

---

### Markets (`/service/trading/markets`) — 2,111 lines ⚠ OVERSIZED

| Component | Source | Purpose |
| --------- | ------ | ------- |
| `PnLValue` | `@/components/trading/pnl-value` | P&L number formatting |
| `PnLChange` | `@/components/trading/pnl-value` | P&L delta display |
| `EntityLink` | `@/components/trading/entity-link` | Navigable entity references |
| `Card`, `Button`, `Tabs`, `Badge`, `Select`, `Input` | `@/components/ui/*` | UI primitives |
| recharts | `recharts` | Charts |

**Hooks:** `useGlobalScope`, `useState` (6+), `useMemo` (5+)
**Data:** `lib/trading-data`, `lib/reference-data` + 7 inline generators

**Note:** Content is P&L attribution, not market data. File is byte-identical to `/service/data/markets`.

---

### Dashboard / Command Center (`/dashboard`) — 475 lines

| Component | Source | Purpose |
| --------- | ------ | ------- |
| `KPICard` | `@/components/trading/kpi-card` | Key metrics cards |
| `AlertsFeed` | `@/components/trading/alerts-feed` | Alert stream |
| `PnLAttributionPanel` | `@/components/trading/pnl-attribution-panel` | P&L waterfall |
| `HealthStatusGrid` | `@/components/trading/health-status-grid` | Service health overview |
| `LimitBar` | `@/components/trading/limit-bar` | Risk limit utilization |
| `LiveBatchComparison` | `@/components/trading/live-batch-comparison` | Live vs batch delta |
| `ValueFormatToggle` | `@/components/trading/value-format-toggle` | $ / % / bps toggle |
| `InterventionControls` | `@/components/trading/intervention-controls` | Emergency actions |
| `ScopeSummary` | `@/components/trading/scope-summary` | Current filter scope display |
| `MarginUtilization` | `@/components/trading/margin-utilization` | Venue margin bars |
| `DriftAnalysisPanel` | `@/components/trading/drift-analysis-panel` | Strategy drift metrics |
| `KillSwitchPanel` | `@/components/trading/kill-switch-panel` | Emergency kill switches |
| `CircuitBreakerGrid` | `@/components/trading/circuit-breaker-grid` | Circuit breaker status |
| `StrategyAuditTrail` | `@/components/trading/strategy-audit-trail` | Recent strategy actions |
| `Card`, `Table`, `Tabs`, `Badge`, `Button`, `Tooltip` | `@/components/ui/*` | UI primitives |

**Hooks:** `useGlobalScope`, `useState` (4), `useMemo` (6), `useCallback` (2), `useValueFormat`
**Data:** `lib/trading-data` (7 functions/constants) + inline mocks

---

## Execution Pages

All execution pages import `ExecutionNav` from `@/components/execution-platform/execution-nav`.
**Warning:** ExecutionNav links use `/execution/*` (missing `/service/` prefix) — all 7 links are broken.

### Analytics (`/service/execution/overview`) — 330 lines

| Component | Source |
| --------- | ------ |
| `ExecutionNav` | `@/components/execution-platform/execution-nav` |
| `Card`, `Table`, `Badge`, `Progress` | `@/components/ui/*` |

**Data:** `lib/execution-platform-mock-data` (MOCK_VENUES, MOCK_RECENT_ORDERS, MOCK_EXECUTION_METRICS, MOCK_EXECUTION_ALGOS)

### Algos (`/service/execution/algos`) — 305 lines

| Component | Source |
| --------- | ------ |
| `ExecutionNav` | `@/components/execution-platform/execution-nav` |
| `Card`, `Table`, `Badge`, `Button`, `Checkbox`, `Tabs` | `@/components/ui/*` |

**Data:** `lib/execution-platform-mock-data` (MOCK_EXECUTION_ALGOS, MOCK_ALGO_BACKTESTS)

### Venues (`/service/execution/venues`) — 310 lines

| Component | Source |
| --------- | ------ |
| `ExecutionNav` | `@/components/execution-platform/execution-nav` |
| `Card`, `Table`, `Badge`, `Button`, `Select`, `Progress` | `@/components/ui/*` |

**Data:** `lib/execution-platform-mock-data` (MOCK_VENUES) + inline VENUE_MATRIX

### TCA (`/service/execution/tca`) — 315 lines

| Component | Source |
| --------- | ------ |
| `ExecutionNav` | `@/components/execution-platform/execution-nav` |
| `Card`, `Table`, `Badge`, `Button`, `Select` | `@/components/ui/*` |
| recharts | `recharts` |

**Data:** `lib/execution-platform-mock-data` (MOCK_RECENT_ORDERS) + inline TCA_BREAKDOWN, EXECUTION_TIMELINE, SLIPPAGE_DISTRIBUTION

### Benchmarks (`/service/execution/benchmarks`) — 330 lines

| Component | Source |
| --------- | ------ |
| `ExecutionNav` | `@/components/execution-platform/execution-nav` |
| `Card`, `Table`, `Badge`, `Button`, `Select`, `Tabs` | `@/components/ui/*` |

**Data:** Inline BENCHMARKS, mockBenchmarkPerformance, generateSlippageTimeSeries()

### Candidates (`/service/execution/candidates`) — 350 lines ⚠ ORPHAN

| Component | Source |
| --------- | ------ |
| `ExecutionNav` | `@/components/execution-platform/execution-nav` |
| `Card`, `Table`, `Badge`, `Button`, `Checkbox` | `@/components/ui/*` |

**Data:** Inline mockCandidates
**Access:** Only via broken ExecutionNav link (`/execution/candidates` — wrong path)

### Handoff (`/service/execution/handoff`) — 370 lines ⚠ ORPHAN

| Component | Source |
| --------- | ------ |
| `ExecutionNav` | `@/components/execution-platform/execution-nav` |
| `Card`, `Badge`, `Button`, `Checkbox`, `Textarea`, `Select`, `Separator` | `@/components/ui/*` |

**Data:** Inline mockHandoff
**Access:** Only via broken ExecutionNav link (`/execution/handoff` — wrong path)

---

## Standalone Pages

### Service Hub (`/service/overview`) — 115 lines

| Component | Source |
| --------- | ------ |
| `ServiceHub` | `@/components/platform/service-hub` |
| `ActivityFeed` | `@/components/platform/activity-feed` |
| `QuickActions` | `@/components/platform/quick-actions` |
| `HealthBar` | `@/components/platform/health-bar` |
| `Badge` | `@/components/ui/badge` |

**Hooks:** `useAuth`
**Auth:** `user`, `isInternal()` — subscription banner for non-internal; ServiceHub entitlement locking

---

## Shared Component Dependency Map

```
Trading Terminal ─── order-book ─── candlestick-chart ─── trading-data
                                                     └─── global-scope-store
Positions ────────── execution-mode-toggle ─── strategy-registry ─── reference-data
Orders ───────────── (placeholder)
Accounts ─────────── (placeholder)
Markets ──────────── pnl-value ─── entity-link ─── trading-data ─── reference-data
                                               └─── global-scope-store
Dashboard ────────── kpi-card ─── alerts-feed ─── pnl-attribution-panel
                 ├── health-status-grid ─── limit-bar
                 ├── live-batch-comparison ─── value-format-toggle
                 ├── intervention-controls ─── scope-summary
                 ├── margin-utilization ─── drift-analysis-panel
                 ├── kill-switch-panel ─── circuit-breaker-grid
                 └── strategy-audit-trail
                                               └─── trading-data ─── global-scope-store

Execution (all) ──── execution-nav ─── execution-platform-mock-data
```

---

## Layout Summary

| Layout | File | Tab Set | Live/As-Of | Auth |
| ------ | ---- | ------- | ---------- | ---- |
| Trading | `service/trading/layout.tsx` | TRADING_TABS | ✓ (`LIVE_ASOF_VISIBLE.run`) | `user?.entitlements` |
| Execution | `service/execution/layout.tsx` | EXECUTION_TABS | ✓ (`LIVE_ASOF_VISIBLE.run`) | `user?.entitlements` |
