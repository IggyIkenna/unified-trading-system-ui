# 04 - Architecture Principles

## TL;DR

- **17 pipeline service repos** (see `unified-trading-pm/workspace-manifest.json` for full repo registry); **core
  pipeline** forms a strict DAG: instruments -> market-tick-data-service -> market-data-processing -> features -> ML ->
  strategy -> execution.
- **Batch**: GCS is the message bus. Service A writes Parquet to a bucket; Service B reads it. No inter-service RPCs. No
  PubSub.
- **Live**: two distinct concerns — **feature calculation** uses the embedded package model (strategy/execution import
  the feature calculator library in-process; no RPC, no network for the calculation itself); **data transport** uses
  PubSub topics for async inter-service streaming (replacing BigQuery polling). PubSub is a message queue, not REST/RPC
  — the "no network hops" rule applies to synchronous HTTP/REST calls between services, not async messaging.
- **Live deployments**: 7-8 standalone processes: (1) TARDIS persistence, (2) instruments-service, (3)
  features-calendar-service, (4) features-delta-one-service, (5) features-volatility-service, (6)
  features-onchain-service, (7) strategy-service, (8) execution-service (per-client). See
  [deployment-topology-diagrams.md](deployment-topology-diagrams.md) for visuals.
- **Sync**: HTTP/REST only for the deployment API and health checks. Never for data flow.
- **Scaling**: horizontal via sharding (category x venue x date = one container); vertical via VM sizing. Each shard is
  a fully independent unit of work.
- **Client isolation**: one execution thread per client-strategy pair. Market data is shared; positions are never
  shared.
- **Cloud-agnostic**: all services use `unified-trading-services` abstractions. `CLOUD_PROVIDER` env var switches
  between GCP and AWS.
- **Deterministic**: batch runs produce identical output for identical inputs. Live runs log enough state for post-hoc
  reconstruction.

---

## Pipeline DAG

The 13 pipeline services (12 original + features-sports-service) form a directed acyclic graph with strict topological
ordering. **Mermaid source (machine-readable):** `unified-trading-codex/04-architecture/pipeline-service-layers.md`

```
Layer 1: Data I/O (root services -- no upstream dependencies)
  instruments-service
  features-calendar-service

Layer 2: Raw Market Data
  instruments-service (corporate-actions domain, deprecated)  <-- instruments-service (TRADFI only)
  market-tick-data-service        <-- instruments-service

Layer 3: Processed Market Data
  market-data-processing-service <-- market-tick-data-service
                                     + instruments-service

Layer 4: Feature Engineering
  features-delta-one-service     <-- market-data-processing-service
                                     + features-calendar-service
  features-volatility-service    <-- market-tick-data-service (raw options/futures)
  features-onchain-service       <-- market-data-processing-service (CEFI/DEFI only)
  features-sports-service        <-- market-data-processing-service + instruments-service (SPORTS only)

Layer 5: Machine Learning
  ml-training-service   <-- features-delta-one (required)
                            + features-volatility (optional)
                            + features-onchain (optional)
  ml-inference-service  <-- ml-training-service + features-delta-one

Layer 6: Strategy & Execution
  strategy-service      <-- ml-inference (optional) + features-delta-one
                            + instruments-service
  execution-service    <-- strategy-service + market-tick-data-service
                            + instruments-service
```

### Execution Order (Topologically Sorted)

```
1.  instruments-service
2.  instruments-service (corporate-actions domain, deprecated)
3.  market-tick-data-service
4.  market-data-processing-service
5.  features-calendar-service
6.  features-delta-one-service
7.  features-volatility-service
8.  features-onchain-service
9.  features-sports-service (SPORTS only)
10. ml-training-service
11. ml-inference-service
12. strategy-service
13. execution-service
```

Services at the same layer (e.g., features-calendar and features-delta-one) may run in parallel if their upstream
dependencies are satisfied.

---

## Service Topology

### Four Categories, Shared Pipeline

The pipeline processes four market categories through the same service graph:

| Category   | Description           | Venues                                                            | Data Sources                                          |
| ---------- | --------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **CEFI**   | Centralized Finance   | Binance, Deribit, Bybit, OKX, Upbit, Coinbase, Hyperliquid, Aster | Tardis API, Protocol APIs                             |
| **TRADFI** | Traditional Finance   | CME, CBOE, NASDAQ, NYSE, ICE, FX                                  | Databento API, Yahoo Finance                          |
| **DEFI**   | Decentralized Finance | Uniswap V2/V3/V4, Curve, AAVE V3, Morpho, Lido, EtherFi, Ethena   | The Graph, Protocol SDKs                              |
| **SPORTS** | Sports Betting        | Betfair, Pinnacle, Polymarket, Odds API bookmakers                | Odds API, API-Football, Betfair Stream, USEI adapters |

Each category shares the same pipeline services but with different venues, data types, instrument types, and external
API dependencies. SPORTS was added as the fourth asset class (2026-03-01) and flows through the existing services
(instruments, market-data-processing, strategy, execution) with `asset_group=SPORTS`. The only new standalone service is
`features-sports-service` (sports-specific feature engineering). See `sports-integration-plan.md` for full details.

### Service Roles

| Service                                                    | Role                                                   | External Dependencies            | Sports Augmentation (2026-03-01)                                              |
| ---------------------------------------------------------- | ------------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------- |
| instruments-service                                        | Generate instrument definitions from exchange APIs     | Tardis, Databento, The Graph     | Sports parser, fixture matching, team normalization                           |
| instruments-service (corporate-actions domain, deprecated) | Dividends, splits, earnings for TRADFI equities        | yfinance                         | N/A                                                                           |
| market-tick-data-service                                   | Download raw tick data from exchanges                  | Tardis, Databento, Protocol APIs | N/A                                                                           |
| market-data-processing-service                             | Aggregate raw ticks into candles (1m, 5m, 15m, 1h, 4h) | None                             | Odds API, Betfair Stream, API-Football; odds processing + arbitrage detection |
| features-calendar-service                                  | Temporal and economic event features                   | FRED API, Earnings APIs          | N/A                                                                           |
| features-delta-one-service                                 | Technical indicators, momentum, volume features        | None                             | N/A                                                                           |
| features-volatility-service                                | IV, term structure, volatility features                | None                             | N/A                                                                           |
| features-onchain-service                                   | TVL, sentiment, on-chain metrics (CEFI/DEFI)           | None                             | N/A                                                                           |
| **features-sports-service**                                | **19 feature categories, time horizons (SPORTS only)** | **None**                         | **NEW standalone service**                                                    |
| ml-training-service                                        | Train LightGBM models (3-stage pipeline)               | None                             | Sports configs, walk-forward validation                                       |
| ml-inference-service                                       | Generate ML predictions from trained models            | None                             | Sports model loading                                                          |
| strategy-service                                           | Generate trading signals and strategy instructions     | None                             | Arbitrage, value betting, Kelly criterion                                     |
| execution-service                                          | Backtest execution on tick-level data (NautilusTrader) | None                             | Betfair, Pinnacle, Polymarket via USEI                                        |

---

## Communication Philosophy

Three communication patterns, each chosen for a specific reason:

### 1. Batch: GCS as Message Bus [IMPLEMENTED]

Services communicate exclusively through GCS (or S3) Parquet files. Service A writes output to a well-known bucket path;
Service B reads from that path. There are no inter-service RPCs, no message queues, no PubSub topics.

**Why**: Parquet files are self-describing, schema-validated, and immutable. GCS provides built-in versioning, lifecycle
management, and BigQuery/Athena compatibility. The coupling is through data contracts (schema + path), not API
contracts.

### 2. Live: Embedded Package (Feature Calculation) + PubSub (Data Transport) [PLANNED]

Live mode has two distinct communication layers that must not be conflated:

**Feature calculation — embedded package model**: The strategy process imports the feature calculator library as a
Python package. Feature computation and ML inference happen in-process. No synchronous network call is made for the
calculation itself.

**Data transport — PubSub async messaging**: Inter-service data flow in live mode uses PubSub topics (replacing BigQuery
polling). Upstream services publish computed data; downstream services subscribe. PubSub is an async message queue, not
a synchronous RPC mechanism.

**Clarification — "no network hops" scope**: This rule prohibits synchronous HTTP/REST calls between pipeline services
for data. It does NOT prohibit PubSub, which is the standard async transport for live streaming data. The distinction
is:

- Forbidden: `service-A.internal/api/features` → HTTP GET → service-B (synchronous, blocking, RPC-style)
- Allowed: service-A publishes to `projects/.../topics/features-delta-one` → service-B subscribes (async, decoupled)

**Batch vs Live transport summary:**

|                     | Batch Mode                        | Live Mode                                         |
| ------------------- | --------------------------------- | ------------------------------------------------- |
| Data transport      | GCS Parquet files                 | PubSub topics                                     |
| Feature calculation | Loaded from GCS                   | Embedded package (in-process)                     |
| ML inference        | Batch prediction via GCS          | PubSub subscription → prediction → PubSub publish |
| Latency target      | Minutes/hours                     | Sub-second                                        |
| Network pattern     | GCS read/write                    | PubSub subscribe/publish (async)                  |
| Forbidden pattern   | Synchronous REST between services | Synchronous REST between services                 |

**Why embedded packages for calculation**: the latency budget is <2 seconds for 1-5 minute signal granularity.
In-process computation avoids serialization, network latency, and connection management overhead on the hot path.

**Why PubSub for transport**: BigQuery polling introduces seconds-to-minutes latency and is not suitable for sub-second
live streaming. PubSub delivers messages with low latency and decouples producers from consumers without requiring
synchronous coordination.

**See**: [BATCH-LIVE-SYMMETRY.md](BATCH-LIVE-SYMMETRY.md) for the full batch/live distinction, mode toggle pattern, and
anti-drift guards.

### 3. Sync: HTTP/REST for Control Plane [IMPLEMENTED]

HTTP/REST is used only for:

- Deployment API (React frontend + FastAPI backend)
- Health check endpoints
- Deployment status queries

HTTP is never used for data flow between pipeline services.

**See**: [communication-patterns.md](communication-patterns.md) for detailed data flow diagrams and technical decisions.

---

## Core Architectural Constraints

### 1. No Inter-Service Synchronous RPCs

Services never call each other's APIs synchronously. In batch mode all data exchange happens through GCS; in live mode
data transport uses PubSub async messaging. This means:

- Any service can be restarted without affecting others
- Services can be developed, tested, and deployed independently
- Batch coupling is through data contracts (Parquet schemas + GCS paths)
- Live coupling is through PubSub topic contracts (message schemas + topic names)
- Neither mode uses synchronous HTTP/REST for data flow between pipeline services

### 2. Dependency Validation Before Run

Before a service runs, its upstream dependencies are validated by checking for the existence of expected GCS objects. If
upstream data is missing, the service fails fast with a clear error rather than producing partial or incorrect output.

```yaml
# From dependencies.yaml
upstream:
  - service: instruments-service
    required: true
    check:
      bucket_template: "instruments-store-{category_lower}-{project_id}"
      path_template: "instrument_availability/by_date/day={date}/instruments.parquet"
```

### 3. Immutable Outputs

Once a service writes Parquet files for a given (date, shard), those files are treated as immutable. Re-runs overwrite
the entire output for that shard; they never append.

### 4. Cloud-Agnostic by Design

All services use `unified-trading-services` abstractions. The `CLOUD_PROVIDER` environment variable (`gcp` or `aws`)
selects the underlying implementation. No service imports `google.cloud` or `boto3` directly.

### 5. Deterministic Reproducibility

Batch runs with identical inputs produce identical outputs. Random seeds are fixed. Time-dependent logic uses the
processing date, not wall-clock time.

---

## Related Documents

| Document                                                           | Description                                                                              |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [deployment-topology-diagrams.md](deployment-topology-diagrams.md) | Visual diagrams: batch (12 containers) vs live (7-8 deployments with package embedding)  |
| [scaling.md](scaling.md)                                           | Horizontal sharding model, vertical scaling, client isolation                            |
| [concurrency.md](concurrency.md)                                   | MAX_WORKERS, adaptive resource management, CPU vs I/O-bound, batch/live parallelism      |
| [communication-patterns.md](communication-patterns.md)             | GCS batch bus, embedded live streaming, HTTP control plane                               |
| [compute.md](compute.md)                                           | VM vs Cloud Run decision matrix, resource allocation                                     |
| [BATCH-LIVE-SYMMETRY.md](BATCH-LIVE-SYMMETRY.md)                   | Batch vs live distinction: transport, calculation, forbidden patterns, anti-drift guards |
| [batch/README.md](batch/README.md)                                 | Job-based execution model, shard-per-container                                           |
| [live/README.md](live/README.md)                                   | Long-running processes, per-client isolation                                             |
