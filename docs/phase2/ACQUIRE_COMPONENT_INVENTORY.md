# Acquire Tab — Component Inventory

**Generated:** 2026-03-21 | **Source:** Phase 2a Audit

---

## Page Status Summary

| # | Tab Label | Route | Page Exists | Status |
| - | --------- | ----- | ----------- | ------ |
| 1 | Pipeline Status | `/service/data/overview` | Yes | Functional — flat mocks |
| 2 | Coverage Matrix | `/service/data/coverage` | **NO** | P0 — 404 |
| 3 | Missing Data | `/service/data/missing` | Yes | Placeholder ("Coming Soon") |
| 4 | Venue Health | `/service/data/venues` | Yes | Placeholder ("Coming Soon") |
| 5 | Markets | `/service/data/markets` | Yes | Functional — inline generators + flat mocks |
| 6 | ETL Logs | `/service/data/logs` | **NO** | P0 — 404 |
| — | (orphan) | `/service/data/markets/pnl` | Yes | Functional — flat mocks |

---

## 1. Pipeline Status (`/service/data/overview/page.tsx`)

### Layout & Tabs

4 internal tabs: Status | Venue Coverage | Data Freshness | Catalogue

### Components

| Component | Import Path | Props | Data Source |
| --------- | ----------- | ----- | ----------- |
| Link | `next/link` | `href="/service/data-catalogue"` | hardcoded |
| Badge | `@/components/ui/badge` | variant, className | hardcoded |
| Button | `@/components/ui/button` | variant, size | hardcoded (no onClick) |
| Card / CardContent / CardHeader / CardTitle | `@/components/ui/card` | className, children | layout |
| Tabs / TabsList / TabsTrigger / TabsContent | `@/components/ui/tabs` | defaultValue="status" | hardcoded |
| Input | `@/components/ui/input` | placeholder, value, onChange | local state |
| Progress | `@/components/ui/progress` | value, className | flat-mock / hardcoded |
| ShardCatalogue | `@/components/data/shard-catalogue` | orgMode, activeSubscriptions | flat-mock |
| FreshnessHeatmap | `@/components/data/freshness-heatmap` | dateMap, label, cloud, weeksToShow | flat-mock |
| Database, Clock, AlertTriangle, RefreshCw, Search, Globe, Activity | `lucide-react` | className | hardcoded |

### Data Sources

| Source | Type | Content |
| ------ | ---- | ------- |
| `PIPELINE_SERVICES` | hardcoded (inline) | 8 pipeline services |
| `VENUE_STATUS` | hardcoded (inline) | 12 venues |
| `MOCK_SHARD_AVAILABILITY` | flat-mock (`lib/data-service-mock-data`) | Shard availability data |
| `MOCK_DATA_GAPS` | flat-mock (`lib/data-service-mock-data`) | Data gap alerts |
| `PLATFORM_STATS` | flat-mock (`lib/config/platform-stats`) | Asset class count |

### Hooks Used

| Hook | Source | Returns |
| ---- | ------ | ------- |
| `useAuth` | `@/hooks/use-auth` | user, isInternal, hasEntitlement |

### Auth/Scoping

- `isInternal` or `hasEntitlement("data-pro")` → all venues; otherwise CEFI-only
- Admin → shows Data Gaps card
- Non-admin → shows "Manage Subscription" link

---

## 2. Coverage Matrix (`/service/data/coverage/page.tsx`)

**FILE DOES NOT EXIST — P0-blocking**

---

## 3. Missing Data (`/service/data/missing/page.tsx`)

### Components

| Component | Import Path | Props | Data Source |
| --------- | ----------- | ----- | ----------- |
| Card / CardHeader / CardTitle / CardContent | `@/components/ui/card` | className | hardcoded |
| Badge | `@/components/ui/badge` | variant="outline" | hardcoded ("Coming Soon") |
| AlertTriangle | `lucide-react` | className | hardcoded |

### Data Sources

None — static placeholder page.

### Hooks Used

None.

---

## 4. Venue Health (`/service/data/venues/page.tsx`)

### Components

| Component | Import Path | Props | Data Source |
| --------- | ----------- | ----- | ----------- |
| Card / CardHeader / CardTitle / CardContent | `@/components/ui/card` | className | hardcoded |
| Badge | `@/components/ui/badge` | variant="outline" | hardcoded ("Coming Soon") |
| Activity | `lucide-react` | className | hardcoded |

### Data Sources

None — static placeholder page.

### Hooks Used

None.

---

## 5. Markets (`/service/data/markets/page.tsx`)

### Layout & Tabs

Complex multi-section page with internal tabs and sub-views.

### Components

| Component | Import Path | Props | Data Source |
| --------- | ----------- | ----- | ----------- |
| Card / CardContent / CardHeader / CardTitle | `@/components/ui/card` | className, children | layout |
| Button | `@/components/ui/button` | variant, size, onClick | hardcoded / dead link |
| Tabs / TabsList / TabsTrigger / TabsContent | `@/components/ui/tabs` | defaultValue | hardcoded |
| Badge | `@/components/ui/badge` | variant, className | hardcoded |
| Select / SelectTrigger / SelectValue / SelectContent / SelectItem | `@/components/ui/select` | value, onValueChange | hardcoded |
| PnLValue | `@/components/trading/pnl-value` | value, size, showSign | flat-mock |
| PnLChange | `@/components/trading/pnl-value` | value, size, className | flat-mock |
| EntityLink | `@/components/trading/entity-link` | type, id, label, className | flat-mock |
| AreaChart / Area / XAxis / YAxis / CartesianGrid / Tooltip / ResponsiveContainer / Legend | `recharts` | data, various | flat-mock |
| Native table (table/thead/tbody/tr/th/td) | — | — | flat-mock |

### Data Sources

| Source | Type | Content |
| ------ | ---- | ------- |
| `PNL_FACTORS` | flat-mock (`lib/reference-data`) | P&L factor definitions |
| `SERVICES` | flat-mock (`lib/reference-data`) | Service registry |
| `ORGANIZATIONS` | flat-mock (`lib/trading-data`) | Organization list |
| `CLIENTS` | flat-mock (`lib/trading-data`) | Client list |
| `STRATEGIES` | flat-mock (`lib/trading-data`) | Strategy list |
| `structuralPnL` | hardcoded (inline) | Structural P&L value |
| `residualPnL` | hardcoded (inline) | Residual P&L value |
| `FACTOR_COLORS` | hardcoded (inline) | Chart color map |
| `generateTimeSeriesData()` | hardcoded (inline generator) | Time series for charts |
| `generatePnLComponents()` | hardcoded (inline generator) | P&L component breakdown |
| `generateStrategyBreakdown()` | hardcoded (inline generator) | Strategy-level breakdown |
| `generateFactorTimeSeries()` | hardcoded (inline generator) | Factor time series |
| `generateClientPnL()` | hardcoded (inline generator) | Client P&L table |
| `generateLiveBookUpdates()` | hardcoded (inline generator) | Live book update feed |
| `generateOrderFlowData()` | hardcoded (inline generator) | Order flow table |
| `reconRuns` | hardcoded (inline) | Reconciliation run table |
| `latencyMetrics` | hardcoded (inline) | Latency metrics table |
| `CRYPTO_VENUES` / `TRADFI_VENUES` / `DEFI_VENUES` | hardcoded (inline) | Venue categorization |

### Hooks Used

| Hook | Source | Returns |
| ---- | ------ | ------- |
| `useState` (multiple) | React | Local UI state |
| `useMemo` (multiple) | React | Computed data |

### Auth/Scoping

None — no `useAuth()` import, no persona-based filtering.

---

## 5b. Markets PnL (`/service/data/markets/pnl/page.tsx`)

### Components

| Component | Import Path | Props | Data Source |
| --------- | ----------- | ----- | ----------- |
| Card / CardContent / CardHeader / CardTitle / CardDescription | `@/components/ui/card` | className | layout |
| Button | `@/components/ui/button` | variant, size, onClick | hardcoded |
| Badge | `@/components/ui/badge` | variant, className | hardcoded |
| Select / SelectTrigger / SelectValue / SelectContent / SelectItem | `@/components/ui/select` | value, onValueChange | hardcoded |
| Table / TableHeader / TableBody / TableRow / TableHead / TableCell | `@/components/ui/table` | — | layout |
| PnLValue | `@/components/trading/pnl-value` | value, size, showSign | flat-mock |
| EntityLink | `@/components/trading/entity-link` | type, id, label, className | flat-mock |
| Link | `next/link` | href | hardcoded |

### Data Sources

| Source | Type | Content |
| ------ | ---- | ------- |
| `PNL_FACTORS` | flat-mock (`lib/reference-data`) | P&L factor definitions |
| `factorBreakdowns` | hardcoded (inline) | Per-factor breakdown data |
| `factorTotals` | hardcoded (inline) | Factor total values |

### Navigation

| Target | Type | Note |
| ------ | ---- | ---- |
| `/service/data/markets` | Link | Back button |
| `/strategies/${id}` | Link + EntityLink | Strategy detail |

---

## 6. ETL Logs (`/service/data/logs/page.tsx`)

**FILE DOES NOT EXIST — P0-blocking**

---

## Unique Components Summary

Components unique to Acquire data pages (not found elsewhere):

| Component | Used By | Import |
| --------- | ------- | ------ |
| ShardCatalogue | overview | `@/components/data/shard-catalogue` |
| FreshnessHeatmap | overview | `@/components/data/freshness-heatmap` |

Components shared with other lifecycle tabs (Phase 3 targets):

| Component | Used By (Data) | Also Used By |
| --------- | -------------- | ------------ |
| PnLValue | markets, markets/pnl | trading/positions, reports, strategies |
| PnLChange | markets | trading/positions, reports |
| EntityLink | markets, markets/pnl | trading/positions, strategies, research |
