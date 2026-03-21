# Acquire Tab — Data Wiring Audit

**Generated:** 2026-03-21 | **Source:** Phase 2a Audit

---

## Data Architecture Status

| Layer | Status | Detail |
| ----- | ------ | ------ |
| React Query hooks (`hooks/api/`) | Exist but UNUSED | `useInstruments`, `useCatalogue`, `useMarketData` available |
| MSW handlers (`lib/mocks/handlers/data.ts`) | Exist but UNUSED | 7 handlers with persona scoping |
| Flat mock files (`lib/*.ts`) | ACTIVE — primary data source | 3 files, ~2,400 lines |
| Inline hardcoded data | ACTIVE — secondary data source | 2 inline arrays + 7 generators in page files |

**Gap:** The API layer (React Query → MSW) is fully built but data pages bypass it entirely, importing mock data directly. This means persona-scoped responses, loading states, error handling, and caching are all unavailable.

---

## React Query Hooks Available (Not Used)

| Hook | File | Endpoint | Persona Scoping |
| ---- | ---- | -------- | --------------- |
| `useInstruments` | `hooks/api/use-instruments.ts` | `/api/data/instruments` | By entitlement |
| `useCatalogue` | `hooks/api/use-instruments.ts` | `/api/data/catalogue` | By entitlement |
| `useMarketCandles` | `hooks/api/use-market-data.ts` | `/api/data/candles` | — |
| `useOrderbook` | `hooks/api/use-market-data.ts` | `/api/data/orderbook` | — |
| `useTrades` | `hooks/api/use-market-data.ts` | `/api/data/trades` | — |
| `useTickers` | `hooks/api/use-market-data.ts` | `/api/data/tickers` | — |

---

## MSW Handler Coverage

| Endpoint | Method | Persona Scoping | Mapped to Page |
| -------- | ------ | --------------- | -------------- |
| `/api/data/instruments` | GET | `scopeByEntitlement` — wildcard/data-pro: all categories; basic: CEFI + limit 180 | Could serve overview venue data |
| `/api/data/catalogue` | GET | `isWildcard`/`hasDataPro` → full; basic → CEFI only | Could serve overview ShardCatalogue |
| `/api/data/subscriptions` | GET | Internal: all orgs; client: own org only | Not mapped |
| `/api/data/shard-availability` | GET | `isWildcard`/`hasDataPro` → all; basic → CEFI only | Could serve overview freshness |
| `/api/data/venues` | GET | `isWildcard`/`hasDataPro` → all; basic → CEFI only | Could serve overview venue coverage |
| `/api/data/etl/pipelines` | GET | Internal/admin only | Could serve overview pipeline status |
| `/api/data/admin/summary` | GET | Internal/admin only | Not mapped |

---

## Flat Mock File Usage

### `lib/data-service-mock-data.ts` (~624 lines)

**Used by:** overview page, ShardCatalogue component

| Export | Type | Consumer | Content |
| ------ | ---- | -------- | ------- |
| `MOCK_SHARD_AVAILABILITY` | Array | overview → FreshnessHeatmap | Shard objects with byDate heatmap data |
| `MOCK_DATA_GAPS` | Array | overview (admin only) | Data gap entries |
| `MOCK_CATALOGUE` | Array | ShardCatalogue component | Full catalogue with venue/instrument data |
| `VENUE_DISPLAY` | Object | ShardCatalogue component | Venue display names |

### `lib/reference-data.ts` (~895 lines)

**Used by:** markets page, markets/pnl page

| Export | Type | Consumer | Content |
| ------ | ---- | -------- | ------- |
| `PNL_FACTORS` | Array | markets, markets/pnl | P&L factor definitions (uppercase keys) |
| `SERVICES` | Array | markets | Service registry |

### `lib/trading-data.ts` (~769 lines)

**Used by:** markets page

| Export | Type | Consumer | Content |
| ------ | ---- | -------- | ------- |
| `ORGANIZATIONS` | Array | markets | Organization list for dropdowns |
| `CLIENTS` | Array | markets | Client list for P&L table |
| `STRATEGIES` | Array | markets | Strategy list for breakdown |

### `lib/config/platform-stats.ts` (~90 lines)

**Used by:** overview page

| Export | Type | Consumer | Content |
| ------ | ---- | -------- | ------- |
| `PLATFORM_STATS` | Object | overview | Venue count, asset class count |

---

## Inline Hardcoded Data

### In `overview/page.tsx`

| Name | Items | Description |
| ---- | ----- | ----------- |
| `PIPELINE_SERVICES` | 8 | Pipeline service status rows |
| `VENUE_STATUS` | 12 | Venue coverage rows |

### In `markets/page.tsx`

| Name | Type | Description |
| ---- | ---- | ----------- |
| `structuralPnL` | number | Static structural P&L value |
| `residualPnL` | number | Static residual P&L value |
| `FACTOR_COLORS` | object | Chart color mapping |
| `generateTimeSeriesData()` | function | Generates random time series for charts |
| `generatePnLComponents()` | function | Generates P&L component breakdown |
| `generateStrategyBreakdown()` | function | Generates strategy-level P&L breakdown |
| `generateFactorTimeSeries()` | function | Generates factor-specific time series |
| `generateClientPnL()` | function | Generates client P&L table data |
| `generateLiveBookUpdates()` | function | Generates live book update entries |
| `generateOrderFlowData()` | function | Generates order flow table data |
| `reconRuns` | array | Static reconciliation run data |
| `latencyMetrics` | array | Static latency metric data |
| `CRYPTO_VENUES` / `TRADFI_VENUES` / `DEFI_VENUES` | arrays | Venue categorization lists |

### In `markets/pnl/page.tsx`

| Name | Type | Description |
| ---- | ---- | ----------- |
| `factorBreakdowns` | Record | Per-factor P&L breakdown (lowercase keys — BUG) |
| `factorTotals` | Record | Per-factor totals |

---

## Migration Path: Flat Mocks → React Query + MSW

| Page | Current Source | Target Hook | Target MSW Endpoint |
| ---- | -------------- | ----------- | ------------------- |
| overview (pipelines) | `PIPELINE_SERVICES` inline | New `usePipelines()` | `/api/data/etl/pipelines` (exists) |
| overview (venues) | `VENUE_STATUS` inline | New `useVenueHealth()` | `/api/data/venues` (exists) |
| overview (freshness) | `MOCK_SHARD_AVAILABILITY` | New `useShardAvailability()` | `/api/data/shard-availability` (exists) |
| overview (gaps) | `MOCK_DATA_GAPS` | New `useDataGaps()` | New endpoint needed |
| overview (catalogue) | `MOCK_CATALOGUE` via ShardCatalogue | `useCatalogue()` (exists) | `/api/data/catalogue` (exists) |
| overview (stats) | `PLATFORM_STATS` | New `usePlatformStats()` | New endpoint needed |
| markets (P&L) | Inline generators | New `useMarketPnL()` | New endpoint needed |
| markets (order flow) | Inline generators | New `useOrderFlow()` | New endpoint needed |
| markets (book updates) | Inline generators | New `useBookUpdates()` | New endpoint needed |
| markets (recon) | Inline array | New `useReconRuns()` | New endpoint needed |
| markets/pnl | Inline objects | New `usePnLAttribution()` | New endpoint needed |

**Existing MSW handlers that can be used immediately:**
- `/api/data/etl/pipelines` → pipeline status
- `/api/data/venues` → venue health
- `/api/data/shard-availability` → data freshness
- `/api/data/catalogue` → shard catalogue

**New MSW handlers needed:**
- `/api/data/gaps` → data gaps
- `/api/data/stats` → platform stats
- `/api/data/markets/pnl` → P&L analytics
- `/api/data/markets/orderflow` → order flow
- `/api/data/markets/book` → book updates
- `/api/data/markets/recon` → reconciliation runs
- `/api/data/markets/pnl/attribution` → P&L factor attribution

---

## Shared Component Data Dependencies

| Component | Own Data Source | Could Be API-Backed |
| --------- | -------------- | -------------------- |
| ShardCatalogue | `MOCK_CATALOGUE`, `VENUE_DISPLAY` from `lib/data-service-mock-data` | Yes — `useCatalogue()` exists |
| FreshnessHeatmap | Props only (dateMap from parent) | Yes — parent would use `useShardAvailability()` |
| PnLValue | Props only | N/A — presentational |
| PnLChange | Props only | N/A — presentational |
| EntityLink | Props only (generates href from type + id) | N/A — navigation only |
