# Acquire Tab — Domain Alignment Assessment

**Generated:** 2026-03-21 | **Source:** Phase 2a Audit (revised)
**Context:** Mock data is intentionally identical to real backend data. The goal is to assess whether the components visible on each page are correct for the Acquire lifecycle use case, and whether redirections make sense — not whether data fetching is API-backed yet.

---

## What "Acquire" Means (Domain Definition)

The Acquire lifecycle stage covers:

1. **Data downloading** — acquiring market data from venues/providers via APIs
2. **Gap detection** — identifying which data is missing across instruments/venues/dates
3. **Deployment creation** — spinning up new data download jobs to fill missing data
4. **Market tick data service** — managing `market-tick-data-service` instances that download historical tick data
5. **Data processing** — `market-data-processing-service` that processes raw downloads into normalised formats
6. **Historical data coverage** — ensuring complete coverage across all venues, instruments, and time ranges

The user responsible for this tab is a **Data Science / Data Engineering** persona who cares about: "Is all my data downloaded? What's missing? How do I fill the gaps? Are my pipelines healthy?"

---

## Tab-by-Tab Alignment Assessment

### 1. Pipeline Status (`/service/data/overview`) — ALIGNED

| Aspect | Assessment |
| ------ | ---------- |
| **Domain fit** | Correct. Shows pipeline service health, shard completion, venue coverage, data freshness heatmaps, instrument catalogue. |
| **Components present** | KPI strip (venues, instruments, coverage, asset classes), pipeline service rows with shard progress, venue coverage cards, freshness heatmaps, instrument catalogue. |
| **Components sensible** | Yes — all directly relate to "is my data being acquired successfully?" |
| **Mock data quality** | Good — `PIPELINE_SERVICES` lists real service names (`market-tick-data-service`, `market-data-processing-service`, `features-delta-one-service`, `features-volatility-service`), real categories (CEFI, TRADFI, DEFI), realistic shard counts. |
| **Redirections** | `/service/data-catalogue` (Manage Subscription) — sensible for non-admin users. |
| **What's missing** | No "create deployment" or "trigger backfill" action. Data gaps card (admin-only) lists gaps but doesn't offer a remediation action (e.g., "Deploy backfill job"). Consider adding action buttons on gap entries. |

**Verdict: PASS — well aligned. Minor gap: no remediation actions for data gaps.**

---

### 2. Coverage Matrix (`/service/data/coverage`) — MISSING PAGE, CONCEPT ALIGNED

| Aspect | Assessment |
| ------ | ---------- |
| **Domain fit** | The concept of a "Coverage Matrix" is exactly right for Acquire — a venue × instrument × date grid showing what data exists. |
| **Page exists** | No — P0 missing. |
| **Expected components** | A matrix/heatmap showing coverage by venue (rows) × instrument or date range (columns), with color coding for complete/partial/missing. Filter by category (CEFI/TRADFI/DEFI/SPORTS). Should link to gap detection for cells that are red/missing. |
| **Recommendation** | Must be built. This is a core Acquire page — the user needs to see "across all my venues and instruments, where do I have data and where don't I?" |

**Verdict: CORRECT CONCEPT, NEEDS IMPLEMENTATION.**

---

### 3. Missing Data (`/service/data/missing`) — PLACEHOLDER, CONCEPT ALIGNED

| Aspect | Assessment |
| ------ | ---------- |
| **Domain fit** | Exactly right. Gap detection → gap tracking → backfill triggering. This is the "what's missing and how do I fix it?" page. |
| **Placeholder description** | "Missing data alerts by venue/instrument, gap duration timelines, auto-backfill status, SLA breach tracking." — all correct for Acquire. |
| **Expected components** | Gap list (venue, instrument, date range, duration), backfill job status, SLA breach indicators, "trigger backfill" buttons, auto-backfill queue status. |
| **Recommendation** | Correct placeholder description. When built, should have direct "Deploy backfill" action that creates a `market-tick-data-service` job. |

**Verdict: PASS — correct concept, waiting for implementation.**

---

### 4. Venue Health (`/service/data/venues`) — PLACEHOLDER, CONCEPT ALIGNED

| Aspect | Assessment |
| ------ | ---------- |
| **Domain fit** | Correct. Venue connectivity is the foundation of data acquisition — if a venue API is down, data can't be downloaded. |
| **Placeholder description** | "Per-venue health cards with latency P50/P99, uptime %, reconnection history, rate limit headroom, circuit breaker status." — all relevant to data acquisition. |
| **Expected components** | Per-venue cards (Binance, OKX, Databento, etc.) showing: API status (up/degraded/down), latency, rate limit usage, last successful download, connection uptime, error rates. |
| **Relationship to overview** | Overview already has venue coverage rows with coverage %. Venue Health goes deeper — not "how much data do I have?" but "is the connection to this venue working right now?" |
| **Recommendation** | Correct concept. Differentiation from overview's venue coverage tab is clear (health vs coverage). |

**Verdict: PASS — correct concept, waiting for implementation.**

---

### 5. Markets (`/service/data/markets`) — MISALIGNED

| Aspect | Assessment |
| ------ | ---------- |
| **Domain fit** | **WRONG DOMAIN.** The page title is "Market Intelligence — P&L attribution, reconciliation, and post-trade analytics." This is trading/execution analytics, NOT data acquisition. |
| **What's actually on this page** | 4 inner tabs: |
| | **P&L tab:** P&L attribution waterfall, factor decomposition (Funding, Carry, Basis, Delta, Gamma, Vega, Theta), strategy breakdown, client P&L table |
| | **Desk tab:** Order flow analysis, live book updates (bids/asks/trades), own order tracking |
| | **Recon tab:** Reconciliation runs (exchange vs internal position matching) |
| | **Latency tab:** Service latency metrics (Execution Service, Market Data, P&L Attribution, ML Inference, Alerting) |
| **Why it's misaligned** | P&L attribution belongs in **Report** (post-trade analytics). Order flow and desk views belong in **Run** (live trading). Recon is **Report**. Latency monitoring belongs in **Observe** (system health). None of these are about data acquisition. |
| **Mock data quality** | The mock data itself is fine — realistic P&L factors, strategy breakdowns, order flow, latency metrics. But it's the right data in the wrong lifecycle tab. |
| **What SHOULD be on a "Markets" page in Acquire** | Market data exploration: "What instruments does each venue offer? What data types (OHLCV, tick, orderbook) are available? What date ranges? Which data providers cover which markets?" — essentially a market data catalogue/explorer, not post-trade analytics. |

**Verdict: MISALIGNED — this page belongs in Report/Run/Observe, NOT in Acquire.**

**Recommendation:** Either:
- **Option A (preferred):** Rename/repurpose this tab to "Market Data Explorer" and replace content with: instrument-by-venue coverage, available data types per venue, historical date range availability, data provider comparison. Move the current P&L/desk/recon/latency content to appropriate lifecycle tabs.
- **Option B:** Move this entire page to the Report lifecycle tab and create a new Acquire-appropriate "Markets" page.
- **Option C:** Remove this tab from DATA_TABS entirely. The overview page's "Venue Coverage" and "Instrument Catalogue" tabs already cover basic market data browsing. Replace with something more actionable like "Download Jobs" or "Deployments."

---

### 5b. Markets PnL Sub-page (`/service/data/markets/pnl`) — MISALIGNED (same as parent)

| Aspect | Assessment |
| ------ | ---------- |
| **Domain fit** | **WRONG DOMAIN.** P&L factor attribution detail is Report/Run, not Acquire. |
| **Recommendation** | If parent Markets page is moved/repurposed, this sub-page moves with it. |

**Verdict: MISALIGNED — follows parent.**

---

### 6. ETL Logs (`/service/data/logs`) — MISSING PAGE, CONCEPT ALIGNED

| Aspect | Assessment |
| ------ | ---------- |
| **Domain fit** | Correct. ETL pipeline logs are core Acquire — "what happened during my last data download run?" |
| **Page exists** | No — P0 missing. |
| **Expected components** | Log viewer with: pipeline name, run timestamp, status (success/failed/partial), records processed, errors, warnings. Filter by pipeline, date range, severity. Click-through to detailed logs. |
| **Relationship to overview** | Overview shows pipeline health summary. ETL Logs provides the detailed run history for debugging failed/degraded pipelines. |
| **Recommendation** | Must be built. Consider linking from overview's pipeline status rows ("click to see logs for this pipeline"). |

**Verdict: CORRECT CONCEPT, NEEDS IMPLEMENTATION.**

---

## Summary: Tab Alignment Scorecard

| # | Tab | Concept Aligned? | Content Aligned? | Action Needed |
| - | --- | ---------------- | ---------------- | ------------- |
| 1 | Pipeline Status | Yes | Yes | Minor: add remediation actions for gaps |
| 2 | Coverage Matrix | Yes | N/A (missing) | Build page |
| 3 | Missing Data | Yes | Placeholder OK | Build when backend ready |
| 4 | Venue Health | Yes | Placeholder OK | Build when backend ready |
| 5 | **Markets** | **No** | **No** | **Repurpose or relocate** — P&L/desk/recon/latency ≠ Acquire |
| 6 | ETL Logs | Yes | N/A (missing) | Build page |

---

## Proposed Acquire Tab Set (Revised)

If the Markets misalignment is addressed, the ideal DATA_TABS for Acquire would be:

| # | Tab Label | Purpose | Status |
| - | --------- | ------- | ------ |
| 1 | Pipeline Status | Overall pipeline health, shard progress, data gaps | Exists (overview) |
| 2 | Coverage Matrix | Venue × instrument × date coverage heatmap | Needs build |
| 3 | Missing Data | Gap detection, backfill tracking, SLA breaches | Placeholder exists |
| 4 | Venue Health | Per-venue connectivity, latency, rate limits, uptime | Placeholder exists |
| 5 | **Market Data Explorer** (renamed) | Instrument catalogue by venue, data types available, date ranges, provider comparison | Needs build (replaces current Markets P&L page) |
| 6 | ETL Logs | Pipeline run history, detailed logs, error debugging | Needs build |

The current Markets page content (P&L attribution, desk order flow, recon, latency) should be redistributed:
- P&L tab content → Report lifecycle (`/service/reports/pnl-attribution`)
- Desk tab content → Run lifecycle (`/service/trading/desk` or `/service/execution/orderflow`)
- Recon tab content → Report lifecycle (`/service/reports/reconciliation`)
- Latency tab content → Observe lifecycle (`/service/observe/latency` or existing `/health`)

---

## Cross-Lifecycle Link Assessment

| Link | From | To | Sensible? |
| ---- | ---- | -- | --------- |
| `/service/data-catalogue` | overview | Service Hub | Yes — subscription management is outside Acquire workflow |
| `/strategies/${id}` | markets | Build lifecycle | **No** — makes sense if this were a Report page, not Acquire |
| `/ops/services?service=${id}` | markets | Ops | **No** — makes sense if this were an Observe page, not Acquire |
| `/markets/pnl?client=${id}` | markets | markets/pnl sub-page | **No** — both are misaligned |

After realignment, Acquire pages should cross-link to:
- **Ops/DevOps** — "Deploy backfill job" actions from Missing Data page
- **Service Hub** — subscription management from overview
- **Observe** — "Check venue health" from Missing Data (if gap is caused by venue issue)

---

## What's NOT on Any Acquire Tab But Should Be

| Missing Capability | Description | Priority |
| ------------------ | ----------- | -------- |
| **Backfill job management** | Create, monitor, cancel data backfill deployments (`market-tick-data-service` instances) | High — core Acquire action |
| **Download job queue** | View queued/running/completed download jobs across all providers | High |
| **Provider status** | Which data providers (Binance API, Databento API, etc.) are reachable and within rate limits | Medium (partial in Venue Health placeholder) |
| **Data type coverage** | For each venue: which data types (OHLCV candles, tick trades, orderbook snapshots, funding rates) are being collected | Medium |
| **Date range explorer** | For any instrument: what date range has data? Visual timeline with gaps highlighted | Medium (could be part of Coverage Matrix) |
| **Auto-backfill rules** | Configure rules like "if gap > 1 day, auto-deploy backfill" | Low — advanced feature |
