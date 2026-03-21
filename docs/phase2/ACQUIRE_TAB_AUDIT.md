# Phase 2a: Acquire Lifecycle Tab — Deep Audit Results

**Audit date:** 2026-03-21
**Repo:** unified-trading-system-ui
**Plan:** `unified-trading-pm/plans/active/ui_phase2_acquire_tab_audit_2026_03_21.plan.md`

---

## Executive Summary

| Category | Total Tasks | PASS | ISSUE | INFO | PLACEHOLDER |
| -------- | ----------- | ---- | ----- | ---- | ----------- |
| A. Component Inventory | 6 | 1 | 2 | 1 | 2 |
| B. Navigation & Routing | 5 | 1 | 3 | 1 | — |
| C. Data Wiring | 4 | 0 | 3 | 1 | — |
| D. UX Audit | 5 | 1 | 3 | 1 | — |
| E. Entitlement & Access | 2 | 1 | 0 | 1 | — |
| F. Cross-Reference | 2 | 1 | 1 | 0 | — |
| **Total** | **24** | **5** | **12** | **5** | **2** |

**Severity breakdown:**

| Severity | Count | Description |
| -------- | ----- | ----------- |
| P0-blocking | 2 | Missing page files (coverage, logs) — tabs lead to 404 |
| P1-fix | 6 | Markets page is MISALIGNED (wrong domain), routeMappings gaps, orphan access, no loading/error/empty states |
| P2-improve | 3 | Missing remediation actions on gaps, routeMappings additions needed, orphan pnl link |
| P3-cosmetic | 1 | Dead "View All" buttons on markets page |

**NOTE:** Data wiring findings (flat mocks, no React Query, no MSW) are **intentional at this stage** — mock data is identical to real backend data and is the planned approach until UI/UX is validated. These are NOT issues. See revised Section C below.

**NOTE:** A separate domain alignment assessment exists at `docs/phase2/ACQUIRE_DOMAIN_ALIGNMENT.md` with the full analysis of which components belong in Acquire vs other lifecycle tabs.

---

## Section A: Component Inventory

### A1. Pipeline Status (`/service/data/overview`)

```
Task: A1
Status: ISSUE
Route: /service/data/overview
Finding: Functional page with 4 tabbed sections. Uses mix of hardcoded inline data and flat mock imports. No React Query hooks. Non-functional refresh button.
Data source: hardcoded + flat-mock
Recommendation: Migrate to React Query hooks using existing MSW handlers.
```

**Components rendered:**

| Component | Import | Data Source | Source Detail |
| --------- | ------ | ----------- | ------------- |
| Card, CardContent, CardHeader, CardTitle | `@/components/ui/card` | prop from parent | Layout wrappers |
| Badge | `@/components/ui/badge` | hardcoded | Static text ("Last refreshed: just now", category badges) |
| Button | `@/components/ui/button` | hardcoded | Refresh button (no onClick handler) |
| Tabs, TabsList, TabsTrigger, TabsContent | `@/components/ui/tabs` | hardcoded | 4 tabs: Status, Venue Coverage, Data Freshness, Catalogue |
| Input | `@/components/ui/input` | local state | Search filter |
| Progress | `@/components/ui/progress` | hardcoded / flat-mock | Coverage percentages |
| ShardCatalogue | `@/components/data/shard-catalogue` | flat-mock | `MOCK_CATALOGUE`, `VENUE_DISPLAY` from `lib/data-service-mock-data` |
| FreshnessHeatmap | `@/components/data/freshness-heatmap` | flat-mock | `shard.byDate` from `MOCK_SHARD_AVAILABILITY` |
| Database, Clock, AlertTriangle, RefreshCw, Search, Globe, Activity | `lucide-react` | hardcoded | Icons |
| Link | `next/link` | hardcoded | `/service/data-catalogue` |

**Inline hardcoded data:**

| Name | Items | Content |
| ---- | ----- | ------- |
| `PIPELINE_SERVICES` | 8 | Pipeline service rows (name, category, status, lastRun, shards, coveragePct) |
| `VENUE_STATUS` | 12 | Venue rows (venue, category, instruments, coverage, lastUpdate, cloud) |

**Flat mock imports:**

| Import | File | Usage |
| ------ | ---- | ----- |
| `MOCK_SHARD_AVAILABILITY` | `lib/data-service-mock-data` | Freshness tab shard cards + heatmaps |
| `MOCK_DATA_GAPS` | `lib/data-service-mock-data` | Data Gaps card (admin only) |
| `PLATFORM_STATS` | `lib/config/platform-stats` | KPI strip: Asset Classes count |

**Auth usage:** `useAuth()` → `user`, `isInternal`, `hasEntitlement`. Admin-only Data Gaps card. CEFI-only venue filtering for non-`data-pro` users.

---

### A2. Coverage Matrix (`/service/data/coverage`)

```
Task: A2
Status: ISSUE (P0-blocking)
Route: /service/data/coverage
Finding: PAGE FILE DOES NOT EXIST. DATA_TABS links to /service/data/coverage but no page.tsx exists. Tab click produces a 404.
Data source: N/A
Recommendation: Create app/(platform)/service/data/coverage/page.tsx or remove tab from DATA_TABS.
```

---

### A3. Missing Data (`/service/data/missing`)

```
Task: A3
Status: PLACEHOLDER
Route: /service/data/missing
Finding: Static placeholder page with "Coming Soon" badge. No data, no components, no hooks. Card with description of planned functionality.
Data source: hardcoded (static text only)
Recommendation: Implement when data gap detection backend is available.
```

**Components rendered:**

| Component | Import | Data Source |
| --------- | ------ | ----------- |
| Card, CardHeader, CardTitle, CardContent | `@/components/ui/card` | hardcoded |
| Badge | `@/components/ui/badge` | hardcoded ("Coming Soon") |
| AlertTriangle | `lucide-react` | hardcoded |

---

### A4. Venue Health (`/service/data/venues`)

```
Task: A4
Status: PLACEHOLDER
Route: /service/data/venues
Finding: Static placeholder page with "Coming Soon" badge. No data, no components, no hooks. Card with description of planned venue health monitoring.
Data source: hardcoded (static text only)
Recommendation: Implement when venue health monitoring backend is available.
```

**Components rendered:**

| Component | Import | Data Source |
| --------- | ------ | ----------- |
| Card, CardHeader, CardTitle, CardContent | `@/components/ui/card` | hardcoded |
| Badge | `@/components/ui/badge` | hardcoded ("Coming Soon") |
| Activity | `lucide-react` | hardcoded |

---

### A5. Markets (`/service/data/markets`)

```
Task: A5
Status: ISSUE (P1-fix — DOMAIN MISALIGNMENT)
Route: /service/data/markets
Finding: Page title is "Market Intelligence — P&L attribution, reconciliation, and post-trade analytics." Contains 4 inner tabs: P&L (factor decomposition, strategy breakdown, client P&L), Desk (order flow, live book updates), Recon (reconciliation runs), Latency (service latency metrics). NONE of these are data acquisition functions. P&L/Recon → Report. Desk/Order flow → Run. Latency → Observe. This page is the right data in the wrong lifecycle tab.
Data source: flat-mock + hardcoded (inline generators) — mock data quality is good, representing realistic backend data
Recommendation: Repurpose as "Market Data Explorer" (instrument catalogue by venue, data types, date ranges, provider comparison) OR relocate current content to Report/Run/Observe tabs.
```

**Components rendered:**

| Component | Import | Data Source | Source Detail |
| --------- | ------ | ----------- | ------------- |
| Card, CardContent, CardHeader, CardTitle | `@/components/ui/card` | prop from parent | Layout |
| Button | `@/components/ui/button` | hardcoded | Some buttons are dead links |
| Tabs, TabsList, TabsTrigger, TabsContent | `@/components/ui/tabs` | hardcoded | Multiple tab sections |
| Badge | `@/components/ui/badge` | hardcoded | Status badges |
| Select, SelectTrigger, SelectValue, SelectContent, SelectItem | `@/components/ui/select` | hardcoded | Filter dropdowns |
| PnLValue | `@/components/trading/pnl-value` | flat-mock | P&L figures |
| PnLChange | `@/components/trading/pnl-value` | flat-mock | P&L changes |
| EntityLink | `@/components/trading/entity-link` | flat-mock | Strategy/client/service links |
| AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend | `recharts` | flat-mock | Time series charts |
| Native table elements | — | flat-mock | Order flow, book updates, recon, latency |

**Flat mock imports:**

| Import | File |
| ------ | ---- |
| `PNL_FACTORS`, `SERVICES` | `lib/reference-data` |
| `ORGANIZATIONS`, `CLIENTS`, `STRATEGIES` | `lib/trading-data` |

**Inline data generators (not in separate files):**

- `generateTimeSeriesData()`, `generatePnLComponents()`, `generateStrategyBreakdown()`
- `generateFactorTimeSeries()`, `generateClientPnL()`, `generateLiveBookUpdates()`
- `generateOrderFlowData()`
- `structuralPnL`, `residualPnL`, `FACTOR_COLORS`, `reconRuns`, `latencyMetrics`
- `CRYPTO_VENUES`, `TRADFI_VENUES`, `DEFI_VENUES`

**Dead links (P3):** "View All Clients" and "View All Strategies" buttons have no onClick or href.

**Custom Live/Batch toggle:** Has a `dataMode` state toggle (Live vs Batch) with Radio/Database icons — this is NOT the global `LiveAsOfToggle` from the layout.

---

### A5b. Markets PnL Sub-page (`/service/data/markets/pnl`)

```
Task: A5 (sub-page)
Status: INFO
Route: /service/data/markets/pnl
Finding: P&L attribution detail page. Orphan — no tab entry, accessible via EntityLink from markets page or legacy /markets/pnl redirect. Back link to /service/data/markets exists.
Data source: flat-mock + hardcoded
Recommendation: Add in-page link from markets page. Fix PNL_FACTORS key case mismatch.
```

**Components:** Card, Button, Badge, Select, Table (UI primitives), PnLValue, EntityLink, Link.

**Flat mock imports:** `PNL_FACTORS` from `lib/reference-data`. Inline `factorBreakdowns` and `factorTotals`.

**Bug found:** PnL page uses lowercase keys (`"funding"`, `"carry"`) in `factorBreakdowns` while `PNL_FACTORS` uses uppercase (`"FUNDING"`, `"CARRY"`). `breakdown = factorBreakdowns[selectedFactor]` will be `undefined` unless keys are normalized.

---

### A6. ETL Logs (`/service/data/logs`)

```
Task: A6
Status: ISSUE (P0-blocking)
Route: /service/data/logs
Finding: PAGE FILE DOES NOT EXIST. DATA_TABS links to /service/data/logs but no page.tsx exists. Tab click produces a 404.
Data source: N/A
Recommendation: Create app/(platform)/service/data/logs/page.tsx or remove tab from DATA_TABS.
```

---

## Section B: Navigation & Routing

### B1. Tab active state

```
Task: B1
Status: PASS
Route: all 6 DATA_TABS routes
Finding: Tab active state uses pathname matching against href. For existing pages (overview, missing, venues, markets), the correct tab highlights. Coverage and logs tabs link to 404s but would highlight correctly if pages existed. No matchPrefix logic issues — all DATA_TABS use exact href matching.
Recommendation: None for existing pages. Fix P0 missing pages.
```

---

### B2. Lifecycle nav highlight

```
Task: B2
Status: ISSUE (P1-fix)
Route: /service/data/coverage, /service/data/missing, /service/data/venues, /service/data/logs
Finding: Only /service/data/overview and /service/data/markets have routeMappings entries. The other 4 DATA_TABS routes have NO routeMappings entry. getRouteMapping() prefix fallback requires path.startsWith(m.path + "/"), so /service/data/coverage does NOT match /service/data/overview. Result: lifecycle nav will NOT highlight "Acquire" when on coverage, missing, venues, or logs pages.
Recommendation: Add routeMappings entries for all 6 DATA_TABS routes.
```

**getRouteMapping() prefix fallback behavior:**

| Route | Exact match? | Prefix match? | Lifecycle highlight |
| ----- | ------------ | ------------- | ------------------- |
| `/service/data/overview` | Yes | — | Acquire (correct) |
| `/service/data/coverage` | No | No (not child of overview) | NONE (broken) |
| `/service/data/missing` | No | No | NONE (broken) |
| `/service/data/venues` | No | No | NONE (broken) |
| `/service/data/markets` | Yes | — | Acquire (correct) |
| `/service/data/markets/pnl` | No | Yes (child of markets) | Acquire (correct) |
| `/service/data/logs` | No | No | NONE (broken) |

---

### B3. Internal navigation

```
Task: B3
Status: INFO
Route: all data pages
Finding: Minimal internal navigation within data pages. Only the overview page links to /service/data-catalogue (outside /service/data/*). Markets/pnl page has a back link to /service/data/markets. No dead internal links between data pages.
Recommendation: Consider adding cross-links between data pages for discoverability.
```

---

### B4. Cross-lifecycle links

```
Task: B4
Status: ISSUE (P1-fix)
Route: /service/data/markets, /service/data/markets/pnl
Finding: Markets pages use EntityLink component to navigate outside Acquire lifecycle.
Recommendation: Document these for Phase 3 cross-reference audit.
```

**Cross-lifecycle links found:**

| Source Page | Target | Component | Lifecycle Target |
| ----------- | ------ | --------- | ---------------- |
| markets | `/strategies/${id}` | EntityLink (strategy) | Build |
| markets | `/markets/pnl?client=${id}` | EntityLink (client) | Acquire (redirect to /service/data/markets/pnl) |
| markets | `/ops/services?service=${id}` | EntityLink (service) | Manage/Ops |
| markets/pnl | `/strategies/${id}` | EntityLink + Link | Build |
| overview | `/service/data-catalogue` | Link | Service Hub (outside lifecycle) |

---

### B5. Orphan page /service/data/markets/pnl

```
Task: B5
Status: ISSUE (P1-fix)
Route: /service/data/markets/pnl
Finding: Orphan confirmed — no DATA_TABS entry, no direct link from markets page. Accessible via: (1) EntityLink type="client" from markets page → /markets/pnl?client=${id} redirect, (2) pnl-attribution-panel.tsx → /markets/pnl redirect, (3) service hub P&L Attribution link, (4) direct URL. Markets page does NOT have a direct link to the pnl sub-page.
Recommendation: Add explicit link from markets page to /service/data/markets/pnl (e.g. "View P&L Attribution Detail" button).
```

---

## Section C: Data Wiring

**Important context:** Mock data usage is intentional at this stage. The mock data is identical to what the real backend will return. The current workflow is: validate UI/UX with mock data → then integrate real API endpoints. Data wiring findings below are informational, not issues.

### C1. React Query hooks inventory

```
Task: C1
Status: INFO (expected — API integration is Phase 2 milestone, not current phase)
Route: all data pages
Finding: ZERO React Query hooks are used on any data page. Hooks exist in hooks/api/ (useInstruments, useCatalogue, useMarketData) but none are imported. This is by design — pages use mock data for UI/UX validation first.
Recommendation: When UI/UX is validated, migrate to React Query hooks. Hooks and MSW handlers are already prepared.
```

---

### C2. Flat mock files

```
Task: C2
Status: INFO (expected — mock data matches real backend schema)
Route: overview, markets, markets/pnl
Finding: 3 of 5 existing pages import flat mock data from lib/*.ts files. Missing and venues pages are placeholders (no data). Total flat mock footprint: ~2,400 lines across 3 source files. Mock data is schema-identical to real backend responses.
Recommendation: Continue using mock data until UI/UX is validated. API integration is a separate milestone.
```

**Flat mock imports per page:**

| Page | File | Exports Used | Lines |
| ---- | ---- | ------------ | ----- |
| overview | `lib/data-service-mock-data.ts` | `MOCK_SHARD_AVAILABILITY`, `MOCK_DATA_GAPS` | 624 |
| overview | `lib/config/platform-stats.ts` | `PLATFORM_STATS` | 90 |
| markets | `lib/reference-data.ts` | `PNL_FACTORS`, `SERVICES` | 895 |
| markets | `lib/trading-data.ts` | `ORGANIZATIONS`, `CLIENTS`, `STRATEGIES` | 769 |
| markets/pnl | `lib/reference-data.ts` | `PNL_FACTORS` | 895 |

**Additionally, overview page has 2 inline hardcoded arrays:**

- `PIPELINE_SERVICES` (8 items, ~10 lines)
- `VENUE_STATUS` (12 items, ~14 lines)

**Markets page has ~7 inline data generators** producing P&L, order flow, book updates, latency, and recon data.

---

### C3. MSW handler coverage

```
Task: C3
Status: INFO (future integration point — MSW handlers ready for when pages migrate to React Query)
Route: all data pages
Finding: MSW handlers exist in lib/mocks/handlers/data.ts for 7 data endpoints with persona scoping. Pages currently use flat mock imports instead. When API integration happens, these handlers provide the mock-to-real transition layer.
Recommendation: No action now. MSW handlers are ready for the API integration phase.
```

**MSW handler inventory:**

| Endpoint | Handler Exists | Used by Pages | Persona Scoping |
| -------- | -------------- | ------------- | --------------- |
| `/api/data/instruments` | Yes | No | `scopeByEntitlement` |
| `/api/data/catalogue` | Yes | No | `isWildcard` / `hasDataPro` |
| `/api/data/subscriptions` | Yes | No | Internal vs client org |
| `/api/data/shard-availability` | Yes | No | `isWildcard` / `hasDataPro` |
| `/api/data/venues` | Yes | No | `isWildcard` / `hasDataPro` |
| `/api/data/etl/pipelines` | Yes | No | Internal/admin only |
| `/api/data/admin/summary` | Yes | No | Internal/admin only |

---

### C4. Data freshness

```
Task: C4
Status: INFO
Route: all data pages
Finding: Overview page shows static "last refreshed: just now" badge and static lastRun/lastUpdate strings in mock data. Refresh button exists but has no onClick handler. Markets page shows exchangeTime/localTime in order flow table (static mock values). No page has auto-refresh, polling, or refetchInterval.
Recommendation: Wire refresh button to React Query invalidation. Add polling for live data views.
```

---

## Section D: UX Audit

### D1. Loading states

```
Task: D1
Status: ISSUE (P1-fix)
Route: all data pages
Finding: NO page has loading state handling. No skeletons, spinners, or shimmer effects. Overview page has `if (!user) return null` as an early exit but shows no loading indicator. When pages are migrated to React Query, loading states must be added.
Recommendation: Add Skeleton components for each page section during data loading.
```

| Page | Loading State | Mechanism |
| ---- | ------------- | --------- |
| overview | No | `if (!user) return null` — blank screen |
| coverage | N/A | Page missing |
| missing | No | N/A — placeholder |
| venues | No | N/A — placeholder |
| markets | No | No loading handling |
| markets/pnl | No | No loading handling |
| logs | N/A | Page missing |

---

### D2. Error states

```
Task: D2
Status: ISSUE (P1-fix)
Route: all data pages
Finding: NO page has error state handling. No error boundaries, toast notifications, or inline error messages. If data fetch fails (once migrated to React Query), pages will show blank/broken content.
Recommendation: Add error handling per page (React Query error state → inline error card with retry).
```

---

### D3. Empty states

```
Task: D3
Status: ISSUE (P1-fix)
Route: all data pages
Finding: Only markets page has a partial empty state ("No clients match current filters" when client list is empty). No other page handles empty data scenarios. Overview page renders empty tables when PIPELINE_SERVICES or VENUE_STATUS arrays would be empty (currently hardcoded so this never happens).
Recommendation: Add empty state illustrations/messages for each data section.
```

---

### D4. Responsive behavior

```
Task: D4
Status: INFO
Route: all data pages
Finding: Not tested at runtime (audit is code-level). Pages use Tailwind responsive utilities (grid-cols, hidden/flex breakpoints). Markets page has complex multi-column layouts that may overflow at mobile widths. Placeholder pages (missing, venues) are simple single-card layouts that should render fine at all sizes.
Recommendation: Runtime testing needed at 375px, 768px, 1440px breakpoints. Focus on overview (4-tab layout) and markets (multi-column charts/tables).
```

---

### D5. Live/As-Of toggle

```
Task: D5
Status: PASS
Route: all data pages (via layout)
Finding: LiveAsOfToggle IS rendered in the data layout (app/(platform)/service/data/layout.tsx) when LIVE_ASOF_VISIBLE.acquire is true (confirmed true). The toggle appears in the right slot of ServiceTabs. However, NO data page reads or uses the toggle state — it is purely cosmetic. Markets page has its own custom Live/Batch toggle (dataMode state) which is independent of the global LiveAsOfToggle.
Recommendation: Connect LiveAsOfToggle state to data fetching once React Query hooks are wired. Reconcile markets page custom toggle with global LiveAsOfToggle.
```

---

## Section E: Entitlement & Access

### E1. No entitlement gating

```
Task: E1
Status: PASS
Route: all 6 DATA_TABS routes
Finding: Confirmed — all 6 DATA_TABS entries have no requiredEntitlement field. All personas (including client-data-only with data-basic entitlement only) can access all data tabs. This is by design — data service is the base tier.
Recommendation: None — intentional.
```

---

### E2. Data scoping

```
Task: E2
Status: INFO
Route: /service/data/overview
Finding: Overview page implements UI-level data scoping: isInternal or hasEntitlement("data-pro") sees all venues; otherwise CEFI-only venues shown. MOCK_DATA_GAPS shown only to admin. ShardCatalogue receives orgMode ("admin" vs "client"). However, this scoping is done at the UI layer using flat mocks, not enforced by the API. MSW handlers in lib/mocks/handlers/data.ts DO implement persona-based scoping (scopeByEntitlement) but pages don't call them. Markets page has NO persona-based data scoping — all users see the same P&L data.
Recommendation: When migrating to React Query + MSW, rely on API-level scoping (MSW handlers already support it) rather than UI-level filtering.
```

**Current scoping behavior:**

| Page | UI-Level Scoping | API-Level Scoping (MSW) |
| ---- | ---------------- | ----------------------- |
| overview | Yes — venue filtering by entitlement, admin-only gaps card | Yes (unused) — `/api/data/venues`, `/api/data/shard-availability` |
| markets | No — all users see identical data | N/A — no matching endpoint |
| markets/pnl | No | N/A |
| missing | N/A (placeholder) | N/A |
| venues | N/A (placeholder) | Yes (unused) — `/api/data/venues` |

---

## Section F: Cross-Reference Markers

### F1. Shared components

```
Task: F1
Status: ISSUE (P1-fix)
Route: all data pages
Finding: Several components used on data pages also appear on pages in other lifecycle tabs. These are Phase 3 audit targets.
Recommendation: Document for Phase 3 cross-reference audit.
```

**Shared components found:**

| Component | Used on Data Pages | Also Used On | Lifecycle Overlap |
| --------- | ------------------ | ------------ | ----------------- |
| PnLValue | markets, markets/pnl | trading/positions, reports/overview, strategies/* | Run, Report, Build |
| PnLChange | markets | trading/positions, reports/overview | Run, Report |
| EntityLink | markets, markets/pnl | trading/positions, strategies/*, research/* | Run, Build |
| ShardCatalogue | overview | service/[key] (service hub) | Service Hub |
| FreshnessHeatmap | overview | (unique to overview) | — |
| Card, Badge, Button, etc. | all pages | ubiquitous | All |

---

### F2. Domain lane accuracy

```
Task: F2
Status: PASS
Route: all data pages with routeMappings entries
Finding: routeMappings assigns lanes: ["data"] to /service/data/overview and /service/data/markets. Markets page renders P&L analytics, strategy breakdowns, and order flow content — this overlaps with execution and strategy domains. However, the primary purpose is data market intelligence, so lanes: ["data"] is acceptable. The P&L/strategy content is viewed through a data lens (data quality, coverage, freshness).
Recommendation: Consider adding secondary lanes ["data", "execution"] for /service/data/markets if Phase 3 reveals significant overlap. No change needed now.
```

---

## Priority Summary (Revised)

### P0-blocking (2 items — must fix immediately)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| A2 | `/service/data/coverage` page file missing — Coverage Matrix tab leads to 404 | Create page — core Acquire concept |
| A6 | `/service/data/logs` page file missing — ETL Logs tab leads to 404 | Create page — core Acquire concept |

### P1-fix (6 items — must fix)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| **A5** | **Markets page is WRONG DOMAIN** — P&L attribution, desk order flow, recon, latency are NOT data acquisition | **Repurpose as "Market Data Explorer" OR relocate content to Report/Run/Observe** |
| B2 | 4 of 6 DATA_TABS routes missing from routeMappings — lifecycle nav broken | Add routeMappings entries |
| D1 | No loading states on any page | Add skeletons/spinners (needed even with mock data for UX validation) |
| D2 | No error states on any page | Add error state UI |
| D3 | No empty states (except partial on markets) | Add empty state UI |
| BUG-1 | PNL_FACTORS key case mismatch in markets/pnl page | Fix key normalisation (even though page may be relocated) |

### P2-improve (3 items — should fix)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| B5 | `/service/data/markets/pnl` orphan — no direct link from markets page | Add explicit navigation link (if page stays in Acquire) |
| B2+ | Missing routeMappings for coverage, missing, venues, logs, markets/pnl | Add entries for lifecycle nav |
| — | No "remediation action" on data gaps (overview pipeline status) | Add "Deploy backfill" or "Trigger re-download" buttons on gap entries |

### No Longer Issues (reclassified as intentional)

| ID | Previous Status | Revised Status | Reason |
| -- | --------------- | -------------- | ------ |
| C1 | P2-improve | INFO | Mock data is intentional; API integration is a separate milestone |
| C2 | P2-improve | INFO | Mock data matches real backend schema by design |
| C3 | P2-improve | INFO | MSW handlers are ready but pages intentionally bypass API layer for now |
| C4 | INFO | INFO | Static timestamps in mock data are expected; will become dynamic with API integration |

### P3-cosmetic (1 item)

| ID | Finding | Recommendation |
| -- | ------- | -------------- |
| A5b | Markets page "View All Clients" and "View All Strategies" buttons are dead links | Add onClick handlers or remove (especially if page is relocated) |

---

## Bug Found

| ID | Route | Bug | Severity |
| -- | ----- | --- | -------- |
| BUG-1 | `/service/data/markets/pnl` | `PNL_FACTORS` uses uppercase keys ("FUNDING") but `factorBreakdowns` uses lowercase keys ("funding"). `breakdown = factorBreakdowns[selectedFactor]` resolves to `undefined`. | P1-fix |

---

## Feeds Into

- **Phase 3:** Cross-reference audit targets from F1 (PnLValue, EntityLink, ShardCatalogue shared across lifecycles)
- **Phase 3:** Cross-lifecycle links from B4 (data pages → /strategies/*, /ops/services/*)
- **Phase 3:** Domain lane review for /service/data/markets (data + execution overlap)
- **Implementation:** Markets page content (P&L/desk/recon/latency) needs relocation decision before other lifecycle tab audits can confirm where it lands
- **Implementation:** Coverage Matrix and ETL Logs pages need to be built to complete the Acquire tab set
- **Implementation:** Missing Data and Venue Health pages need to transition from placeholder to functional when backend provides data

## Additional Output

- `docs/phase2/ACQUIRE_DOMAIN_ALIGNMENT.md` — full domain alignment assessment with proposed revised tab set
