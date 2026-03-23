# Acquire / Data Pipeline — Specification

> **Purpose:** Detailed specification for the Acquire lifecycle tab — the data pipeline that
> feeds the entire trading system.
> **Status:** DRAFT v2 — updated with scope clarification: Acquire = Instruments + Raw + Processed ONLY.
> Features belong to Build tab (see BUILD_SECTION_SPEC.md §2 Feature ETL Pipeline).
> **Companion:** `../build lifecycle tab/BUILD_SECTION_SPEC.md` (Build section, consumes Acquire output)

---

## Pipeline Overview

The Acquire section covers getting data into the system. Three stages, strictly ordered:

```
External Data Sources (Tardis, Databento, IBKR, CCXT, on-chain RPCs, sports APIs, prediction APIs)
    │
    ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  1. INSTRUMENTS  │───▶│  2. RAW DATA     │───▶│  3. PROCESSED    │
│                  │    │  INGESTION       │    │  DATA            │
│  What exists to  │    │                  │    │                  │
│  trade? Which    │    │  Download raw    │    │  Convert raw     │
│  symbols on      │    │  ticks, trades,  │    │  into canonical  │
│  which venues,   │    │  events, odds,   │    │  OHLCV candles,  │
│  since when?     │    │  match data      │    │  multi-timeframe │
│                  │    │  from providers   │    │  aggregations    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
   instruments-service   market-tick-data-svc    market-data-processing-svc
   corporate-actions     (Tardis, Databento)     (1m→5m→15m→1H→4H→1D)
```

### Output → Build Pipeline

The processed data from Stage 3 is the INPUT to the Build pipeline:

- **Features** use processed candles, on-chain events, match stats, odds
- **ML models** train on features computed from processed data
- **Backtests** simulate trading using historical processed data

---

## Data Sources & Asset Classes

| Asset Class            | Data Providers                                            | Raw Data Types                                                      | Canonical Output                           |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| **CeFi** (Crypto)      | Tardis (REST + WS), CCXT                                  | Tick trades, order book snapshots, funding rates, liquidations      | OHLCV candles (1m→1D), open interest       |
| **TradFi**             | Databento (CME, ICE, NASDAQ), IBKR, FRED                  | Tick trades, L2 book, corporate actions, macro indicators           | OHLCV candles, greeks, IV surfaces         |
| **DeFi**               | On-chain RPCs (Ethereum, Arbitrum, etc.), Hyperliquid API | Pool events, lending state, DEX swaps, liquidations, health factors | On-chain event timeseries, pool snapshots  |
| **Sports**             | Football data APIs (currently football only)              | Match data, head-to-head, odds, team stats, goals, passes, attacks  | Match event timeseries, odds movement      |
| **Prediction Markets** | Polymarket, Kalshi, etc.                                  | Bet data, market resolution, implied probabilities                  | Market state timeseries, resolution events |

### Scale

- **50-100+ TB** of data across all sources, growing constantly
- New data sources being added regularly
- Downloads can run for **multiple days** for historical backfill
- Each venue × date is a separate shard — downloads are parallelized across shards

---

## Stage 1: Instruments

### What It Does

The `instruments-service` discovers and catalogs all tradeable instruments across all venues
and asset classes. It answers: "What can be traded, where, and since when?"

### Backend Architecture (from codex)

```
instruments-service
  writes → instruments-store-{category}-{project}/
             instrument_availability/by_date/day={date}/instruments.parquet

Categories: cefi, tradfi, defi (separate buckets per category)
Sharding: category × date
Sources: Tardis (CeFi), CCXT, Databento/IBKR (TradFi), on-chain (DeFi)
```

### What the UI Needs to Show

| View                          | Description                                                    | Current State                                                                                                                                                                                                                                 |
| ----------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Instrument Catalogue**      | Browsable registry grouped by asset class → venue → instrument | EXISTS — Instrument Catalogue tab on overview page. Shows categories (Crypto CeFi, TradFi, DeFi, Onchain Perps, Predictions, Sports), venues within each, instrument types (spot, perpetuals, options, futures), coverage % and "since" date. |
| **Instrument Count / Growth** | How many instruments exist, growth over time                   | PARTIAL — KPI card shows "23 Instruments" but this is mock data. Should show real counts per category.                                                                                                                                        |
| **New Instruments Detection** | Alert when new instruments appear on a venue                   | MISSING                                                                                                                                                                                                                                       |
| **Corporate Actions**         | Stock splits, delistings, symbol changes (TradFi)              | MISSING from UI (service exists: `corporate-actions`)                                                                                                                                                                                         |

### Venue Registry

The Instrument Catalogue already shows venues grouped by category:

| Category      | Venues (from current UI)                          |
| ------------- | ------------------------------------------------- |
| Crypto CeFi   | Binance, Bybit, Coinbase, OKX, Deribit, Upbit     |
| TradFi        | Databento (CME, ICE, NASDAQ), IBKR, FRED + others |
| DeFi          | 12 venues (Aave V3, Uniswap, Compound, etc.)      |
| Onchain Perps | Hyperliquid                                       |
| Predictions   | Polymarket, Kalshi                                |
| Sports        | 2 venues (football data providers)                |

### What's Working vs What's Missing

- **Working:** Category grouping, venue list, expand/collapse, instrument type badges, coverage %
- **Missing:** Real instrument counts (mock shows "4 instruments" for CeFi which has thousands),
  individual instrument list within a venue (expand a venue to see BTC-PERP, ETH-PERP, etc.),
  instrument detail view (trading pairs, start date, tick size, lot size), corporate actions

---

## Stage 2: Raw Data Ingestion

### What It Does

The `market-tick-data-service` downloads raw market data from external providers for every
instrument discovered in Stage 1. This is the heaviest data pipeline — 50-100+ TB.

### Backend Architecture (from codex)

```
market-tick-data-service
  reads  ← instruments-store-{cat}-{proj}/  (what to download)
  writes → market-data-tick-{cat}-{proj}/
             raw_tick_data/by_date/day={date}/
               data_type={data_type}/
               instrument_type={asset_class}/
               venue={venue}/
               {instrument}.parquet

Sharding: category × venue × date
Data types: trades, ohlcv, book_snapshot, funding_rate, liquidation, ...
```

### What Each Shard Contains

A single shard = **one venue, one date**. It downloads ALL instruments that were traded on
that venue on that date (instrument list comes from the instruments-service).

Example: `cefi / binance / 2026-03-22` downloads raw tick data for all ~400 Binance instruments
that traded on March 22, 2026.

### Data Types by Asset Class

| Asset Class     | Raw Data Types Downloaded                                                               |
| --------------- | --------------------------------------------------------------------------------------- |
| **CeFi**        | `trades`, `ohlcv` (1m), `book_snapshot`, `funding_rate`, `liquidation`, `open_interest` |
| **TradFi**      | `trades`, `ohlcv`, `book_l2`, `corporate_actions`                                       |
| **DeFi**        | `pool_events`, `swap_events`, `lending_state`, `liquidation_events`, `health_factor`    |
| **Sports**      | `match_events`, `odds_movement`, `head_to_head`, `team_stats`, `match_outcome`          |
| **Predictions** | `market_state`, `bet_events`, `resolution_events`, `implied_probability`                |

### ETL Pipeline View — What Users Need

This is where the bulk of the ETL tracking happens. Downloads run for days. Users need:

1. **Overall progress** — How much of the historical data has been downloaded?
2. **Per-venue progress** — Which venues are complete, which have gaps?
3. **Per-date coverage** — Heatmap showing which dates have data (like the Data Freshness tab)
4. **Active download jobs** — What's downloading right now? How many instances?
5. **Missing data detection** — Where are the gaps? Can we backfill?
6. **Cost tracking** — API call costs (Tardis/Databento charge per request)

### Current UI State

| Page                               | What It Shows                                                                                                            | Assessment                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pipeline Status tab** (overview) | Service health bars — instruments-service (99.2%), market-tick-data-service (98.8%), features-service (97.5%)            | Good start but too high-level. No per-venue or per-date breakdown.                                                                                    |
| **Venue Coverage tab**             | Venues with coverage %, cloud badge (GCP/AWS), instrument count, last refresh date                                       | Good structure but instrument counts are mock (e.g., "2 instruments" for Binance should be ~400+). Coverage % has too many decimal places.            |
| **Data Freshness tab**             | Heatmap per venue showing complete/partial/missing/stale days                                                            | Excellent pattern. Shows Binance (perpetuals/GCP/ohlcv), Databento (futures/AWS/trades), Aave_v3 (lending/GCP+AWS/pool_state). This is exactly right. |
| **Missing Data page**              | Gap detection table — severity, instrument, venue, data type, category, gap start/end, duration, status, backfill button | Excellent. Has All/Raw/Processed/Derived tabs, status filters, severity filters.                                                                      |
| **Coverage Matrix page**           | Not explored yet                                                                                                         | —                                                                                                                                                     |
| **Venue Health page**              | Not explored yet                                                                                                         | —                                                                                                                                                     |
| **ETL Logs page**                  | Not explored yet                                                                                                         | —                                                                                                                                                     |

### What's Missing

- **Download job management** — No way to trigger new downloads, see running instances, or
  configure sharding parameters. The deployment-ui at port 5183 has this (Deploy tab with
  mode, cloud provider, region, date range, category selection) but the main UI doesn't.
- **Per-instrument progress** — Can't see which specific instruments within a venue have been
  downloaded vs which are missing.
- **Batch vs Live toggle** — The deployment-ui Data Status tab has Batch/Live toggle. The
  main UI has Live/As-Of but it's not the same concept (As-Of = historical view, not batch mode).
- **Cost / API usage** — No visibility into Tardis/Databento API usage and costs.
- **Download queue** — No priority/queue management for backfill jobs.

---

## Stage 3: Data Processing

### What It Does

The `market-data-processing-service` converts raw tick/trade data into canonical OHLCV candles
at multiple timeframes, plus other processed formats.

### Backend Architecture (from codex)

```
market-data-processing-service
  reads  ← market-data-tick-{cat}-{proj}/raw_tick_data/**  (raw ticks)
  writes → market-data-tick-{cat}-{proj}/
             processed_candles/by_date/day={date}/
               timeframe={timeframe}/
               data_type={data_type}/
               {asset_class}/
               {instrument}.parquet

Sharding: category × venue × date
Timeframes produced: 1m, 5m, 15m, 1H, 4H, 1D
```

### Processing Pipeline

```
Raw Trades (tick-by-tick)
    │
    ▼
1-Minute Candles (OHLCV + volume + open interest)
    │
    ├──▶ 5-Minute Candles
    ├──▶ 15-Minute Candles
    ├──▶ 1-Hour Candles
    ├──▶ 4-Hour Candles
    └──▶ Daily Candles
```

Each timeframe is a separate Parquet file per instrument per date.

### What the UI Needs to Show

| View                    | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| **Processing progress** | For each venue × date, which timeframes have been processed? |
| **Timeframe coverage**  | Heatmap: dates × timeframes showing completion status        |
| **Processing queue**    | What's being processed now? What's queued?                   |
| **Quality checks**      | OHLCV validation — are there gaps in the candle series?      |
| **Reprocessing**        | Trigger reprocessing for a specific venue × date × timeframe |

### Current UI State

The current Pipeline Status tab shows a single "features-service" entry with 97.5% (95/98, 1 failed).
There's no dedicated view for the processing stage. Users can't see:

- Which timeframes are complete for which venues
- Processing queue/status
- Quality validation results

---

## Shared ETL Component Architecture

### Scope Boundary: Acquire vs Build

**Acquire tab owns:** Instruments, Raw Data, Processed Data (Layers 1-2 in deployment-ui)
**Build tab owns:** Feature ETL, ML Training ETL (Layers 3-4 in deployment-ui)

The Feature ETL pipeline was previously considered for Acquire but has been moved to Build
because features are the first step of the research workflow — they use processed data as
input, and their output feeds directly into ML model training. Keeping Feature ETL in Build
means the entire research chain (features → models → backtesting) lives under one tab.

> **Note:** The ETL component architecture is shared across BOTH tabs. When we build the
> reusable `PipelineStatusView` component for Acquire, it will also be used by Feature ETL
> and Model Training ETL in the Build tab. Design it generically from the start.

### Shared Patterns

All pipeline stages share the same UI patterns:

| Pattern                | Instruments        | Raw Data                           | Processing                 | Feature ETL (Build)             | Model Training (Build)          |
| ---------------------- | ------------------ | ---------------------------------- | -------------------------- | ------------------------------- | ------------------------------- |
| **Sharding**           | category × date    | category × venue × date            | category × venue × date    | category × feature_group × date | instrument × timeframe × config |
| **Progress bars**      | Per-category       | Per-venue per-category             | Per-timeframe per-venue    | Per-feature-service             | Per-model                       |
| **Completion heatmap** | date × category    | date × venue                       | date × timeframe           | date × category                 | model × date_range              |
| **Job management**     | Trigger discovery  | Trigger download                   | Trigger processing         | Trigger computation             | Trigger training                |
| **Gap detection**      | Missing dates      | Missing venue × date               | Missing timeframe × date   | Missing feature × date          | —                               |
| **Batch/Live toggle**  | Historical vs live | Download historical vs stream live | Process historical vs live | Compute historical vs live      | Train historical vs retrain     |

**Reusable component:** `PipelineStatusView` — takes a service config (sharding dims, progress
endpoint, heatmap endpoint, job trigger endpoint) and renders the standard ETL dashboard.
This component is used by **both** Acquire and Build tabs.

---

## Deployment-UI Integration

The deployment-ui at `localhost:5183` already has all the operational controls:

| Deployment-UI Feature | What It Does                                                                         | Main UI Equivalent Needed                                        |
| --------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **Deploy tab**        | Configure sharding (category, venue, date range), select cloud/compute, trigger jobs | "Start Download" / "Start Processing" buttons with config dialog |
| **Status tab**        | Running job status, health checks                                                    | Active Jobs panel in the ETL view                                |
| **History tab**       | Past deployment/job history                                                          | Job history table                                                |
| **Data Status tab**   | Batch/Live filter, date range, category filter, completion heatmap                   | Data Freshness tab (already exists, needs enhancement)           |
| **Readiness tab**     | Pre-deployment checklist                                                             | Not needed in main UI (ops concern)                              |
| **Config tab**        | Service configuration                                                                | Not needed in main UI (ops concern)                              |

**Key decision:** The main UI should NOT replicate the full deployment-ui. Instead:

- **Main UI (Acquire tab):** Shows status, coverage, freshness, gaps, progress — the
  "what's the state of my data?" view for researchers and traders.
- **Deployment-UI:** The operational tool for triggering deploys, managing infrastructure,
  configuring services — for ops/engineers.
- **Cross-link:** The main UI links to deployment-ui for "Deploy" / "Run" actions when
  the user needs to trigger something.

---

## Existing Codebase Inventory

### Types

| File                        | Key Types                                                                                                                               | Lines |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `lib/data-service-types.ts` | `DataOrg`, `InstrumentEntry`, `CatalogueEntry`, `ETLPipelineStatus`, `ETLStage`, `DataGap`, `VENUES_BY_CATEGORY`, `FOLDERS_BY_CATEGORY` | 387   |
| `lib/types/deployment.ts`   | `Service`, `ServiceDimension`, `DataStatusResponse`, `DeploymentRequest` (sharding dims)                                                | 674+  |

### Mock Data

| File                            | Key Exports                                                                                                                                                                        | Lines |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `lib/data-service-mock-data.ts` | `MOCK_ORGS`, `MOCK_INSTRUMENTS`, `MOCK_CATALOGUE`, `MOCK_SUBSCRIPTIONS`, `MOCK_SHARD_AVAILABILITY`, `MOCK_ETL_PIPELINES`, `MOCK_VENUE_COVERAGE`, `MOCK_DATA_GAPS`, `VENUE_DISPLAY` | 701   |
| `lib/api/mock-handler.ts`       | Intercepts `/api/instruments/*`, `/api/market-data/*`, synthetic candle/orderbook generation                                                                                       | 1298  |

### Hooks

| File                           | Key Hooks                                                                                   | Lines |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ----- |
| `hooks/api/use-instruments.ts` | `useInstruments`, `useCatalogue`                                                            | 59    |
| `hooks/api/use-market-data.ts` | `useCandles`, `useOrderBook`, `useTrades`, `useTickers`, `useOptionsChain`, `useVolSurface` | 73    |

### Components

| File                                            | What It Does                                                                | Lines |
| ----------------------------------------------- | --------------------------------------------------------------------------- | ----- |
| `components/data/shard-catalogue.tsx`           | Shard browsing with category grouping                                       | 325   |
| `components/data/freshness-heatmap.tsx`         | Date × venue freshness heatmap (the green/yellow/red dots)                  | 193   |
| `components/data/data-subscription-manager.tsx` | Data access/subscription management                                         | 222   |
| `components/data/cloud-pricing-selector.tsx`    | Cloud pricing/access mode                                                   | 192   |
| `components/data/org-data-selector.tsx`         | Org selector for data views                                                 | 111   |
| `components/ops/deployment/DataStatusTab.tsx`   | Full deployment-ui style data status (imported from deployment-ui patterns) | 4019  |

### Pages

| Route                                            | What It Shows                                                              | Lines |
| ------------------------------------------------ | -------------------------------------------------------------------------- | ----- |
| `app/(platform)/services/data/overview/page.tsx` | Pipeline Status, Venue Coverage, Data Freshness, Instrument Catalogue tabs | 330   |
| `app/(platform)/services/data/venues/page.tsx`   | Venue status list                                                          | 133   |
| `app/(platform)/services/data/missing/page.tsx`  | Gap detection table with severity, backfill buttons                        | 166   |
| `app/(ops)/internal/data-etl/page.tsx`           | Internal ETL dashboard (ops-only)                                          | 595   |

---

## Current Sub-Navigation Structure

### Top-Level Tabs (main overview page)

```
Pipeline Status │ Venue Coverage │ Data Freshness │ Instrument Catalogue
```

### Left Sidebar Links

```
Pipeline Status
Coverage Matrix
Missing Data
Venue Health
ETL Logs
```

### Assessment

The current structure mixes concerns:

- "Pipeline Status" appears both as a tab and a sidebar link
- There's no clear separation between the three stages (Instruments → Raw → Processed)
- ETL operational views (logs, job management) are mixed with research views (coverage, freshness)

---

## Proposed Tab Structure

Reorganize around the three pipeline stages plus cross-cutting views:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Instruments │ Raw Data │ Processing │ Coverage │ Gaps & Quality     │
└─────────────────────────────────────────────────────────────────────┘
```

| Tab                | What It Shows                                                                                | Key Views                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Instruments**    | Instrument catalogue, venue registry, instrument counts, growth over time, corporate actions | Category → venue → instruments tree, "since" dates, instrument type badges                                                                                   |
| **Raw Data**       | Raw data download status, per-venue progress, download jobs, API usage                       | Progress bars per venue, date × venue heatmap, active download jobs, cost tracking                                                                           |
| **Processing**     | Processed data status, timeframe completion, processing queue                                | Progress per timeframe, date × timeframe heatmap, quality validation                                                                                         |
| **Coverage**       | Cross-cutting coverage matrix across Acquire stages                                          | Venue × date matrix with color coding (instruments ✓, raw ✓, processed ✓). Features column shown as a "downstream readiness" indicator linking to Build tab. |
| **Gaps & Quality** | Missing data detection, gap backfill, data quality alerts                                    | Gap table (current Missing Data page), quality checks, backfill queue, severity tracking                                                                     |

> **Note:** Features are NOT a tab in Acquire. Feature ETL lives in the Build tab.
> The Coverage matrix shows a "Features" column as a read-only indicator of downstream
> readiness — clicking it navigates to Build → Feature ETL. This is the bridge between
> the two lifecycle stages.

### Stage-Specific Views (within each tab)

Each of the first three tabs follows the same layout pattern:

```
┌──────────────────────────────────────────────────────────────────┐
│ [Stage Name] Pipeline                                 [Refresh]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ OVERALL PROGRESS ─────────────────────────────────────────┐ │
│  │  CeFi    ████████████████████░░░░  82%   2,456 / 3,000    │ │
│  │  TradFi  ██████████████████████░░  91%   1,420 / 1,560    │ │
│  │  DeFi    ████████████████░░░░░░░░  67%   1,340 / 2,000    │ │
│  │  Sports  ████████████░░░░░░░░░░░░  52%     650 / 1,250    │ │
│  │  Pred.   ██████░░░░░░░░░░░░░░░░░░  28%     160 /   570   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ PER-VENUE / PER-SERVICE BREAKDOWN ────────────────────────┐ │
│  │  Service/Venue       │ Status │ Progress │ Shards │ Actions│ │
│  │  ────────────────────┼────────┼──────────┼────────┼────────│ │
│  │  Binance (CeFi)      │ ✅ OK  │ 94%      │ 2,400  │ [View] │ │
│  │  Databento (TradFi)  │ ⚠ Slow │ 78%      │ 1,200  │ [View] │ │
│  │  Aave V3 (DeFi)      │ ✅ OK  │ 88%      │   900  │ [View] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ─── CLICK A ROW TO EXPAND ───                                   │
│                                                                  │
│  ┌─ EXPANDED: Binance ────────────────────────────────────────┐ │
│  │  Sharding: category × venue × date                         │ │
│  │                                                             │ │
│  │  ┌─ COMPLETION HEATMAP (date × data_type) ──────────────┐ │ │
│  │  │         Mar 16  Mar 17  Mar 18  Mar 19  Mar 20  ...  │ │ │
│  │  │  ohlcv   ██      ██      ██      ██      ░░          │ │ │
│  │  │  trades  ██      ██      ██      ░░      ░░          │ │ │
│  │  │  book    ██      ██      ░░      ░░      ░░          │ │ │
│  │  │  funding ██      ██      ██      ██      ██          │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  [Download Missing]  [View Logs]  [Open in Deployment UI]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ ACTIVE JOBS ──────────────────────────────────────────────┐ │
│  │  Job ID       │ Venue     │ Dates    │ Progress │ ETA     │ │
│  │  dl-bin-0323  │ Binance   │ Mar 20-22│ ███░ 75% │ 4h      │ │
│  │  dl-db-0323   │ Databento │ Mar 18-22│ █░░░ 22% │ 18h     │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Coverage Matrix — The Cross-Pipeline View

The Coverage tab is the "big picture" view showing the state across Acquire's three stages,
with a read-only downstream indicator for features (owned by Build):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ COVERAGE MATRIX                                          [Refresh]      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Filters: [CeFi ▾]  Date: [2026-03-16 → 2026-03-22]                   │
│                                                                          │
│                        ──── ACQUIRE ────          ── BUILD ──            │
│  Venue     │ Date     │ Instruments │ Raw Data │ Processed │ Features ↗ │
│  ──────────┼──────────┼─────────────┼──────────┼───────────┼────────────│
│  Binance   │ Mar 22   │ ✅ 412       │ ✅ 100%   │ ✅ 6/6 tf  │ ✅ 89%     │
│  Binance   │ Mar 21   │ ✅ 412       │ ✅ 100%   │ ✅ 6/6 tf  │ ✅ 92%     │
│  Binance   │ Mar 20   │ ✅ 410       │ ⚠ 98%    │ ✅ 6/6 tf  │ ✅ 88%     │
│  Binance   │ Mar 19   │ ✅ 410       │ ✅ 100%   │ ⚠ 5/6 tf  │ ⚠ 71%     │
│  Databento │ Mar 22   │ ✅ 85        │ ⚠ 94%    │ ✅ 6/6 tf  │ ❌ 0%      │
│  Databento │ Mar 21   │ ✅ 85        │ ✅ 100%   │ ✅ 6/6 tf  │ ✅ 95%     │
│  ...                                                                     │
│                                                                          │
│  Legend: ✅ complete  ⚠ partial  ❌ missing  — not applicable            │
│  Features ↗ = read-only indicator; click to navigate to Build → Feature ETL │
│                                                                          │
│  A gap at any Acquire stage blocks downstream Build stages.              │
└──────────────────────────────────────────────────────────────────────────┘
```

This matrix answers: "Is the data ready for research?" — if Instruments, Raw, and Processed
are all green for a venue × date, the Build tab can compute features for it. The Features
column is a convenience indicator (fetched from the Build pipeline API) that shows whether
the downstream step has been completed, but it's not managed from here.

---

## Cloud Infrastructure

All pipeline services run on GCP or AWS (cloud-agnostic via `unified-cloud-interface`):

| Concern             | Details                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloud Providers** | GCP (primary), AWS (secondary). Azure planned for future.                                                                                                      |
| **Compute**         | Cloud Run (serverless) or VM instances (for heavy downloads)                                                                                                   |
| **Storage**         | GCS (GCP) or S3 (AWS). Parquet format. Hive-style partitioning.                                                                                                |
| **Regions**         | Asia-northeast1 (Tokyo) primary. Auto-zone rotation within region.                                                                                             |
| **Buckets**         | Category-scoped: `market-data-tick-cefi-{project}`, `instruments-store-tradfi-{project}`, etc. Shared: `ml-models-store-{project}`, `strategy-store-{project}` |
| **Data Format**     | Apache Parquet with Hive-style partition keys (`day=YYYY-MM-DD/venue=X/`)                                                                                      |

---

## GCS Path Structure (from codex SSOT)

| Service                  | Bucket                           | Path Template                                                                                                  |
| ------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| instruments-service      | `instruments-store-{cat}-{proj}` | `instrument_availability/by_date/day={date}/instruments.parquet`                                               |
| market-tick-data-service | `market-data-tick-{cat}-{proj}`  | `raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={class}/venue={venue}/{instrument}.parquet` |
| market-data-processing   | `market-data-tick-{cat}-{proj}`  | `processed_candles/by_date/day={date}/timeframe={tf}/data_type={type}/{class}/{instrument}.parquet`            |

---

## Questions for Design Decisions

> **Instructions:** Answer each question below inline (replace the `YOUR ANSWER:` line).
> These answers will drive the implementation spec and wireframes.

---

### A. INSTRUMENTS

---

#### Q1. Instrument Discovery Scope

The `instruments-service` discovers instruments. How complete is this today?

- How many instruments exist across ALL venues combined (rough order of magnitude)?
  Binance alone has ~400+ perpetuals/spot/options. Across all venues?
- Are ALL instruments downloaded, or is there a whitelist/filter (e.g., "only top 50 by
  volume per venue")?
- When a new instrument appears on a venue (new listing), how quickly does it need to be
  discovered? Same day? Real-time?

**YOUR ANSWER:**

---

#### Q2. Instrument Metadata Depth

What metadata does the instruments-service capture per instrument?

- Just the symbol name and venue? Or also: tick size, lot size, contract size, margin
  requirements, trading hours, listing date, delisting date, settlement type?
- For options: strike prices, expiries, option type?
- For DeFi: pool address, token pair, fee tier, TVL?
- For sports: league, teams, match date, competition type?

**YOUR ANSWER:**

---

#### Q3. Corporate Actions (TradFi)

The `corporate-actions` service exists. What does it handle?

- Stock splits, reverse splits, symbol changes, delistings, dividends?
- How does a corporate action affect historical data? Does raw data get reprocessed?
- Is there a "corporate actions timeline" view that users need?

**YOUR ANSWER:**

---

#### Q4. Instrument Growth / New Listings

Should the UI show:

- A timeline of when instruments were added to each venue?
- Alerts when new instruments appear (e.g., "15 new perpetuals listed on Binance this week")?
- Instrument "lifecycle" — listed → active → low volume → delisted?

**YOUR ANSWER:**

---

### B. RAW DATA INGESTION

---

#### Q5. Data Provider Details

You mentioned Tardis, Databento, and "several other data sources." Can you list ALL current
and planned providers?

- **CeFi:** Tardis (REST + WebSocket). Any others? CCXT for exchange-direct?
- **TradFi:** Databento (CME, ICE, NASDAQ). IBKR for what? FRED for macro? Others?
- **DeFi:** Which RPCs / indexers? TheGraph? Alchemy? Direct node calls?
- **Sports:** Which football data providers specifically? How many?
- **Prediction Markets:** Polymarket API? Kalshi? Others?

For each: is it a paid API with rate limits / costs per request, or free/self-hosted?

**YOUR ANSWER:**

---

#### Q6. Raw Data Types — Full Inventory

I listed some data types per asset class but I'm probably missing many. For each asset class,
what are ALL the raw data types you download?

**CeFi example — is this complete?**

- Trades (tick-by-tick)
- OHLCV (1-minute candles from exchange)
- Order book snapshots (L2)
- Funding rates (perpetual contracts)
- Liquidations
- Open interest
- **Missing?** Mark price? Index price? Insurance fund? Borrowing rates?

**TradFi — what specifically?**

- Trades, L2 book — same as CeFi?
- Corporate actions — separate service
- Macro indicators from FRED — what types? CPI, interest rates, employment?
- Earnings data? Options chains? Implied volatility surfaces?

**DeFi — what specifically?**

- Pool events (swaps, adds, removes) — by protocol?
- Lending state (borrow/supply rates, utilization) — Aave, Compound?
- Liquidation events
- Health factor snapshots
- **Missing?** TVL time series? Token price feeds? Gas prices? MEV data?

**Sports — what specifically?**

- Match data — what fields? Score, possession, shots, xG, passes, cards?
- Head-to-head — historical match results between two teams?
- Odds — pre-match, in-play, closing? Which bookmakers?
- Team stats — seasonal aggregates?
- Player stats? Injuries? Suspensions?

**Prediction Markets — what specifically?**

- Market state — current prices/probabilities?
- Bet/trade history?
- Resolution events — when market resolves?
- Order book / liquidity?

**YOUR ANSWER:**

---

#### Q7. Download Granularity & Sharding

You said a shard = one venue × one date. Some clarifying questions:

- Is it truly ALL instruments for that venue × date in one shard, or can you download
  a single instrument × date?
- For TradFi (Databento), is the sharding the same? Or is it by exchange (CME vs NASDAQ)
  rather than "venue = databento"?
- For DeFi, what's a "venue"? A protocol (Aave V3)? A chain (Ethereum)?
  Or a protocol × chain combination (Aave V3 on Ethereum vs Aave V3 on Arbitrum)?
- For sports, is a shard = one league × one matchday? Or one match?
- For prediction markets, is a shard = one market × one date?
- Can shards be sub-divided further if they're too large? (e.g., Binance has 400+
  instruments — is downloading all of them in one shard feasible?)

**YOUR ANSWER:**

---

#### Q8. Download Duration & Scale

Downloads can run for "multiple days." Can you give me real numbers?

- How long does it take to download one day of Binance CeFi data? (all instruments)
- How long for one day of Databento TradFi?
- What's the total historical backfill scope? (e.g., "Binance from Sep 2019 to today =
  ~2,400 days × 400 instruments")
- How many concurrent download jobs can run? Is there a limit?
- What's the typical VM/Cloud Run instance allocation? (e.g., 4 VMs downloading in parallel)

**YOUR ANSWER:**

---

#### Q9. Download Failures & Retries

When a download fails (API error, rate limit, timeout, partial data):

- Does it auto-retry? How many times? With backoff?
- Does a partial shard get saved or discarded? (e.g., downloaded 350/400 instruments
  before failure — do we keep the 350?)
- Can users manually retry a specific failed shard from the UI?
- Is there a concept of "download health" per provider? (e.g., Tardis API is responding
  slowly today → all CeFi downloads are delayed)

**YOUR ANSWER:**

---

#### Q10. API Costs & Rate Limits

Data providers charge money and have rate limits:

- Tardis: pricing model? Per-request? Per-GB? Monthly subscription?
- Databento: same question?
- Are there daily/monthly cost caps? ("Don't spend more than $X on Tardis this month")
- Do rate limits affect download speed? (e.g., "Tardis allows 100 req/min, so downloading
  400 instruments × 1 request each = 4 minutes minimum per date")
- Should the UI show cost estimates before triggering a download? ("This backfill will
  cost approximately $X and take ~Y hours")

**YOUR ANSWER:**

---

#### Q11. Batch vs Live — How Does Live Work?

The deployment-ui has Batch/Live toggle. For the Live mode:

- What does "live" mean for raw data? WebSocket streaming from Tardis? Direct exchange feeds?
- Is live data a continuous stream, or periodic polling?
- What latency is expected? Sub-second? Seconds? Minutes?
- Does live data go through the same pipeline (raw → processed → features)?
- Should the Acquire tab show a "Live Feed Status" panel? (connections active, message
  rate, last message timestamp, latency)
- When live data has a gap (connection dropped for 5 minutes), how is it backfilled?

**YOUR ANSWER:**

---

### C. DATA PROCESSING

---

#### Q12. Processing Pipeline Details

Raw → Processed conversion:

- Trades → 1-minute candles: is this the only conversion, or are there others?
  (e.g., raw order book → aggregated book, raw funding → normalized funding)
- The 1m→5m→15m→1H→4H→1D aggregation — is this always the full set, or configurable?
  (e.g., "I only need 1H and 1D for this venue")
- OHLCV fields: Open, High, Low, Close, Volume — anything else? VWAP? Trade count?
  Open interest at each candle close?
- For DeFi, what does "processed" data look like? Pool state snapshots at regular
  intervals? Aggregated swap volume per period?
- For sports, what's a "processed candle equivalent"? Match events don't fit OHLCV.
  Is it something like "odds time series at 1-minute intervals"?
- For prediction markets, same question — what's the canonical processed format?

**YOUR ANSWER:**

---

#### Q13. Processing Quality & Validation

How do we know the processed data is correct?

- Are there validation checks? (e.g., High ≥ Open, High ≥ Close, Volume ≥ 0)
- What happens when raw data is bad? (e.g., exchange reports a trade at price $0)
- Is there a "data quality score" per instrument × date?
- Can users see quality issues? ("BTC-PERP on Mar 22 has 3 suspicious candles with
  zero volume in the middle of trading hours")
- Should the UI show quality metrics alongside completion status?

**YOUR ANSWER:**

---

#### Q14. Reprocessing

When does data need to be reprocessed?

- If a new raw data type is added (e.g., we didn't download funding rates before,
  now we do) — does all historical data need reprocessing?
- If the processing logic changes (e.g., fix a bug in VWAP calculation) — can users
  trigger a full reprocess for a date range?
- If a corporate action happens (stock split) — does historical data get adjusted?
- How long does reprocessing take vs initial processing?

**YOUR ANSWER:**

---

### D. OPERATIONAL CONCERNS

---

#### Q15. Who Uses This Tab?

Different users have different needs:

- **Quant researcher:** "Is data ready for my backtest? Do I have clean 1H candles for
  BTC from Jan 2024 to today?" → Needs coverage matrix, freshness, quality.
- **Data engineer / ops:** "Why did the Databento download fail? How do I restart it?
  What's our API usage this month?" → Needs job management, logs, costs.
- **Client (external):** "What data is included in my subscription? How fresh is it?" →
  Needs catalogue, freshness, SLA compliance.
- **Portfolio manager:** "Do we have enough data to launch a new TradFi strategy?" →
  Needs coverage breadth, venue availability.

Which of these personas should the Acquire tab serve? All of them? Or should some views
be in the (ops) section instead?

**YOUR ANSWER:**

---

#### Q16. Download Triggering

Should the main UI (Acquire tab) allow users to trigger downloads?

- (a) Yes — full deploy form like deployment-ui (select venue, dates, cloud, compute target)
- (b) Partial — "Request Download" button that creates a job request, ops reviews and approves
- (c) No — Acquire tab is read-only status view, deployment-ui handles all triggering
- (d) Role-based — internal users can trigger, clients can only view status

If (a) or (b): should the deploy form be inline in the Acquire tab, or should it open
the deployment-ui in a new tab/modal?

**YOUR ANSWER:**

---

#### Q17. Notifications & Alerts

What events should generate alerts visible in the Acquire tab?

- Download job completed / failed?
- New gap detected?
- Data staleness (venue hasn't been updated in X hours)?
- API rate limit approaching?
- Cost threshold reached?
- New instruments discovered?
- Processing queue backed up?

Should these be in-app notifications, or do they go to Telegram/Slack (already set up)?
Or both?

**YOUR ANSWER:**

---

#### Q18. Data Retention & Archiving

The codex mentions retention policies:

- How long is raw tick data kept? Forever? Or archived after X months?
- Is there a "cold storage" tier? (e.g., data older than 1 year moves to cheaper storage)
- Can users request data from cold storage? ("I need Binance raw ticks from 2020")
- Should the UI show storage usage? ("CeFi raw data: 45 TB, TradFi: 12 TB, ...")
- Should the UI show estimated storage costs?

**YOUR ANSWER:**

---

#### Q19. Multi-Cloud Strategy

You support GCP and AWS, with Azure planned:

- Is data duplicated across clouds, or is each venue/category assigned to one cloud?
- The Venue Coverage tab shows GCP/AWS badges — does this mean some venues are GCP-only
  and others AWS-only? Or can the same venue's data exist on both?
- Can users choose which cloud to download to? Or is it automatic?
- Should the UI show cloud-specific status? (e.g., "Binance: GCP ✅, AWS ⚠ syncing")

**YOUR ANSWER:**

---

### E. MISSING DATA & GAP DETECTION

---

#### Q20. Gap Detection — How Does It Work?

The Missing Data page is one of the strongest existing views. Deeper questions:

- How are gaps detected? Automated scan on a schedule? On-demand? Both?
- What constitutes a "gap"? Missing file? File exists but has zero rows? File exists
  but fewer rows than expected?
- The current page shows severity (CRITICAL, WARNING, INFO). What determines severity?
  Is it based on how recent the gap is? How many instruments are affected? Whether it
  blocks downstream pipelines?
- What does "backfilling" status mean exactly? A download job was triggered? It's in
  progress? It's queued?

**YOUR ANSWER:**

---

#### Q21. Gap Resolution Workflow

When a gap is detected, what's the workflow?

- Auto-backfill for recent gaps (last 7 days)? Or always manual?
- Who can trigger a backfill? Any user? Only ops?
- Can you backfill a single instrument within a shard, or must you redo the entire shard?
- What's the typical time to resolve a gap? Minutes? Hours? Days?
- Should the UI track gap resolution time? ("Average gap resolution: 4.2 hours")

**YOUR ANSWER:**

---

#### Q22. Data Completeness Definition

When is a shard "complete"?

- All instruments for that venue × date have files? Or just the "expected" instruments?
- If a new instrument was listed on Mar 20, does Mar 19 become "incomplete" because it
  doesn't have that instrument? Or is completeness based on what was available at the time?
- For sports, what's "complete" for a match day? All matches played that day have data?
- Is there a "100% complete" state, or is it asymptotic? (e.g., an exchange may report
  trades retroactively)

**YOUR ANSWER:**

---

### F. UI/UX EXPERIENCE

---

#### Q23. Real-Time Updates

Should the Acquire tab update in real-time?

- Pipeline status progress bars — update live as shards complete? Or poll every N seconds?
- Heatmap — refresh automatically when new data arrives?
- Active jobs — live progress? Or periodic refresh?
- WebSocket for real-time updates? Or polling?

**YOUR ANSWER:**

---

#### Q24. Historical View / Time Travel

The current UI has a "Live / As-Of" toggle:

- What does "As-Of" mean for the data pipeline? "Show me what the coverage looked like
  on Mar 15" (time travel)?
- Or is it "Show me data for dates up to Mar 15" (date range filter)?
- Is this useful for auditing? ("On Mar 15, we only had 80% coverage for Binance, but
  by Mar 18 we backfilled it to 100%")

**YOUR ANSWER:**

---

#### Q25. Search & Navigation

With 30+ venues, thousands of instruments, and years of historical data:

- Should there be a global search? ("Show me everything about BTC-PERP")
- Should instruments be searchable across the entire Acquire tab? (e.g., search for
  "ETH" and see: instruments → raw data status → processing status → gaps)
- Should venues be filterable by status? ("Show me only venues with gaps")

**YOUR ANSWER:**

---

#### Q26. Comparison & Trends

Should the Acquire tab show historical trends?

- "Binance coverage has improved from 85% to 99% over the last month" (trend chart)
- "Download speed for Tardis has degraded 20% this week" (performance trend)
- "Data gap frequency is decreasing — 12 gaps last week, 5 this week" (quality trend)
- "We added 45 new instruments this month" (growth trend)

Or is the current-state view sufficient?

**YOUR ANSWER:**

---

#### Q27. Export & API Access

Should users be able to:

- Export coverage reports? (CSV/JSON of the coverage matrix)
- Export instrument catalogues? (full list of instruments with metadata)
- Export gap reports? (for auditing or external sharing)
- Access Acquire status via API? (for programmatic monitoring, Grafana dashboards)

**YOUR ANSWER:**

---

### G. EDGE CASES & FUTURE

---

#### Q28. Venue Onboarding

When a new venue is added to the system:

- What's the workflow? Add to instruments-service config → discover instruments → start
  downloading?
- Should the UI show a "venue onboarding wizard" or checklist?
- How long does it take from "new venue added" to "historical data fully backfilled"?

**YOUR ANSWER:**

---

#### Q29. Data Provider Switching

If you switch providers (e.g., move from Tardis to a different CeFi data provider):

- Does historical data need to be re-downloaded?
- How does the UI handle the transition? Show data from both providers during overlap?
- Are there data quality differences between providers that the UI should surface?

**YOUR ANSWER:**

---

#### Q30. Scale Projections

The system is currently at 50-100 TB. Looking forward:

- What's the expected growth rate? (TB per month?)
- Are there plans to add significantly more venues or asset classes?
- At what point does the UI need to handle 100+ venues or 10,000+ instruments?
- Should the UI be designed for current scale or 10x scale?

**YOUR ANSWER:**

---

#### Q31. Dependency Chain Visibility

The pipeline has strict ordering: instruments → raw → processed. Downstream: features →
ML → backtests. Should the Acquire tab show:

- A DAG (directed acyclic graph) visualization of the pipeline?
- "What's blocking?" — if features aren't computing, trace back to which Acquire stage
  has the gap?
- Cross-tab linking? (click a gap in Acquire → see which Build pipeline steps are blocked)

**YOUR ANSWER:**

---

#### Q32. Anything Else?

What have I still missed? Any workflows, edge cases, provider quirks, operational patterns,
user complaints about the current system, or future plans that should inform the UI design?

**YOUR ANSWER:**
