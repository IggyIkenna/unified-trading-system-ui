# Runtime Topology — Architectural Decisions

**SSOT:** `unified-trading-pm/configs/runtime-topology.yaml` (moved from `unified-trading-deployment-v3/configs/` — now owned by PM).
**Companion:** `RUNTIME_DEPLOYMENT_TOPOLOGY_DAG.svg` (deployment-service/configs/) · `runtime-topology.yaml` (`unified-trading-pm/configs/`, machine-readable).
**Readers:** `unified-trading-codex/04-architecture/` holds symlinks to these files for easy access.

**Last updated:** 2026-02-28

This document captures the WHY behind every topology decision. When agents or humans modify the
architecture, they must check this document first. If a change conflicts with a principle here,
the principle wins — update the code, not the principle (unless explicitly overridden by the user).

---

## 1. Naming Conventions

Every repo falls into exactly one category. The name MUST reflect the category:

| Category           | Naming Pattern                                    | Deploys?             | Owns Domain Data?                              | Examples                                             |
| ------------------ | ------------------------------------------------- | -------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| **library**        | `*-interface`, `*-library`, `unified-*-interface` | No                   | No — provides protocols, schemas, utilities    | `unified-market-interface`, `execution-algo-library` |
| **service**        | `*-service`                                       | Yes (Cloud Run / VM) | Yes — produces and persists domain data to GCS | `instruments-service`, `ml-training-service`         |
| **ui**             | `*-ui`                                            | Yes (static hosting) | No — never reads GCS or PubSub directly        | `trading-analytics-ui`, `deployment-ui`              |
| **infrastructure** | named by function                                 | Depends              | No                                             | `ibkr-gateway-infra`, `deployment-engine`            |

**Rule:** If something doesn't fit a pattern, the architecture is wrong — restructure it, don't
rename to hide the mismatch.

---

## 2. UI → API → Service Chain (UI Never Owns Data)

Every UI MUST have a backing API service as its data engine. UIs never:

- Read from GCS, PubSub, BigQuery, or Redis directly
- Own domain data or business logic
- Import Python packages

The chain is always: **UI → API (HTTP/SSE) → Service (engine) → Storage/Messaging**

| UI Group                                                    | API Gateway(s)              | Engine (data source) |
| ----------------------------------------------------------- | --------------------------- | -------------------- |
| trading-analytics-ui, execution-analytics-ui, settlement-ui | execution-results-api :8002 | execution-service    |

> **Consolidation note:** `trading-analytics-ui` is functionally overlapped by the batch research UIs: `execution-analytics-ui` (provides live fill viewing via `execution-results-api` SSE) and `client-reporting-ui` (P&L). Candidate for consolidation into `execution-analytics-ui` in a future phase. See `consolidated_remaining_work.plan.md` todo `arch-trading-analytics-ui-consolidate`.
> | strategy-ui | strategy-api :8004 ⟪planned⟫ | strategy-service |
> | deployment-ui, live-health-monitor-ui, batch-audit-ui, logs-dashboard-ui, onboarding-ui | deployment-api :8001 | deployment-engine |
> | client-reporting-ui | client-reporting-api :8005 | pnl-attribution-service, risk-and-exposure-service, position-balance-monitor-service |

---

## 2a. Three Batch Research Tiers and UI Naming

Each tier of batch research work has its own dedicated UI. These are separate repos from their backing services.

| Tier                  | Purpose                                                | API Gateway            | Service engine   | UI repo         |
| --------------------- | ------------------------------------------------------ | ---------------------- | ---------------- | --------------- |
| **Strategy backtest** | Signal backtest; parameter tuning; strategy deployment | strategy-api ⟪planned⟫ | strategy-service | **strategy-ui** |

**Repo naming status:**

- `ml-training-ui` — COMPLETE. GitHub repo and local directory renamed from `ml-training-ui`.
- `execution-analytics-ui` — COMPLETE. GitHub repo and local directory renamed from `execution-analytics-ui`. Content migration (extraction of `execution-service/visualizer-ui/` into this repo) tracked separately as `arch-exec-services-visualizer-extract`.
- `features-multi-timeframe-service` — COMPLETE. GitHub repo created, initial implementation pushed.
- `strategy-api` — new planned repo. Thin FastAPI gateway over strategy-service batch outputs (signals_backtest_results GCS). Port 8004.

**Execution Visualizer (still inside execution-service):**
`execution-service/visualizer-ui/` (React, port 5174) and `execution-service/visualizer-api/` (FastAPI, port 8001) have NOT yet been extracted. These are an active architecture violation (UI inside a Python service repo). Extraction: `visualizer-ui` → `execution-analytics-ui` repo; `visualizer-api` → merge into `execution-results-api`. Until extraction, the execution backtest UI is only accessible via local execution-service dev setup.

## 3. Messaging Rules: Live vs Batch

### The Core Rule

> **If the producer is live AND the consumer is live → use messaging (PubSub / in_memory / Redis).**
> **If the producer is batch/infrequent AND the consumer needs data → consumer reads from persistence (GCS).**
> **Nothing should ever read from persistence "live" when the data source is also live.**

### Why This Matters

Reading from GCS in a live loop means polling + latency + eventual consistency. If the producer is
updating in real-time, the consumer should receive real-time updates via messaging. Persistence
(GCS) is the durable archive, not the transport channel in live mode.

### Transport Decision Matrix

| Producer Mode    | Consumer Mode | Transport                               | Example                            |
| ---------------- | ------------- | --------------------------------------- | ---------------------------------- |
| Live             | Live          | PubSub (or in_memory if co-located)     | MTDH → MDPS live tick data         |
| Batch            | Batch         | GCS (read/write)                        | MTDH → MDPS historical tick replay |
| Batch/infrequent | Live          | GCS read (persistence)                  | ML training models → ML inference  |
| Live             | Batch         | N/A (consumer waits for next batch run) | —                                  |

### Exceptions

- **Instruments service:** Updates are infrequent (~every 15 minutes) BUT sends PubSub events for
  instrument additions/removals/status changes so that live services can react immediately without
  polling. The GCS write is the persistence; the PubSub event is the notification.

### Persistence Is Always Required

Regardless of transport mode, every service that produces data MUST persist to GCS:

- In **batch**: the GCS write IS the transport (same operation)
- In **live**: the PubSub publish is transport, and a SEPARATE GCS write is persistence
- This ensures: (a) durability, (b) batch replay capability, (c) audit trail

---

## 4. Co-Location Policy

Some services benefit from running on the same VM to avoid network/PubSub latency on the hot path.

| Co-Located Group                    | Reason                                                                                                                                                                                                                       | Live Transport |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **MTDH + MDPS + execution-service** | All three share the same VM. MDPS processes raw ticks from MTDH (hot path); execution-service needs the same live market feed. In_memory avoids PubSub latency for both. Single co-location group — not two separate groups. | in_memory      |

**Co-location constraints (apply to ALL groups):**

- Co-location does NOT create Python import dependencies between services
- Each service remains independently deployable and testable
- In distributed profile, the same flow uses PubSub instead of in_memory
- The deployment profile is a config choice, not a code dependency
- Co-location is a deployment optimization — the services don't "know" they're co-located;
  they receive data via an adapter that happens to use in_memory instead of PubSub

---

## 5. Per-Service Batch vs Live Behavior

This section documents what each service actually DOES differently in each mode — what a user
or operator would see/experience differently.

### Layer 1 — Data Ingestion

**instruments-service**

- **Batch:** Fetches full instrument universe from venues (URDI), writes to GCS. One-shot per run.
- **Live:** Polls venue APIs periodically (~15 min). Publishes PubSub events when instruments are
  added, removed, or change status (e.g., halted, delisted). Other services listen and react.
- **Data produced:** `instruments_universe` (GCS parquet), instrument change events (PubSub)

**market-tick-data-service (MTDH)**

- **Batch:** Reads historical tick data from external APIs (Tardis, Databento), writes raw ticks to GCS.
- **Live:** Maintains WebSocket connections to venues. Streams raw ticks. Publishes to PubSub
  (or in_memory if co-located with MDPS/execution-service). Also persists to GCS.
- **Data produced:** `raw_tick_data` (GCS), live tick stream (PubSub/in_memory)
- **Data consumed:** instruments universe (GCS read, PubSub listen)

### Layer 2 — Market Data Processing

**market-data-processing-service (MDPS)**

- **Batch:** Reads raw ticks from GCS, computes candles/OHLCV, writes processed data to GCS.
- **Live:** Receives live ticks from MTDH (PubSub or in_memory). Computes candles in real-time.
  Publishes processed data to PubSub. Persists to GCS.
- **Data produced:** `processed_candles_ohlcv` (GCS), live candle stream (PubSub)
- **Data consumed:** raw ticks from MTDH, instruments from instruments-service

- **Batch:** Serves historical order book snapshots and candles via HTTP REST from GCS.
- **Live:** Streams live order book via SSE (from MTDH PubSub), streams live candles via SSE (from MDPS PubSub).
- **Not a pipeline participant** — it's a read-only HTTP/SSE gateway.
- **Data consumed:** order book stream (MTDH PubSub), candle stream (MDPS PubSub), historical data (GCS)
- **Target:** Should serve both orderbook AND candles (current implementation: orderbook only)

### Layer 3 — Features

**features-calendar-service**

- **Batch only.** Computes calendar-based features (holidays, trading hours, economic events).
  No live mode — calendar data changes infrequently.
- **Data produced:** `calendar_features` (GCS)

**features-delta-one-service**

- **Batch:** Reads processed candles from GCS, computes delta-one features, writes to GCS.
- **Live:** Receives live candle stream from MDPS (PubSub), computes features in real-time,
  publishes to PubSub. Persists to GCS.
- **Data produced:** `delta_one_features` (GCS), live features (PubSub)

**features-volatility-service**

- **Batch:** Same pattern as delta-one — reads candles, computes vol features, writes GCS.
- **Live:** Receives live candles, computes realized/implied vol, publishes to PubSub. Persists to GCS.
- **Data produced:** `volatility_features` (GCS), live features (PubSub)

**features-cross-instrument-service**

- **Batch:** Reads processed candles from GCS for all instruments of an underlying, computes
  cross-instrument features (basis, correlation, spread, funding rate, liquidity dispersion),
  writes to GCS.
- **Live:** Subscribes to live candle streams from MDPS (PubSub) for all instruments of an
  underlying. Maintains in-memory state. Computes cross-instrument features on each candle
  update. Publishes to PubSub (one topic per underlying). Persists to GCS.
- **Representative underlying pattern:** Uses one canonical instrument per asset (e.g., Binance
  BTC-PERP for all BTC instruments) as the reference for cross-instrument calculations.
- **Data produced:** `cross_instrument_features` (GCS), live features (PubSub per underlying)
- **Data consumed:** candles from MDPS (all instruments of an underlying)
- **Key design:** Many-to-one aggregation — subscribes to multiple upstream topics (one per
  instrument), publishes to one downstream topic (one per underlying).
- **See:** `02-data/cross-instrument-features-architecture.md` for full design.

**features-onchain-service**

- **Batch only.** Reads on-chain data (Aave, Uniswap, Curve), computes DeFi features. No live
  mode — on-chain data is fetched periodically.
- **Data produced:** `onchain_features` (GCS)

### Layer 4 — ML Pipeline

**ml-training-service**

- **Batch only.** Runs periodically (e.g., quarterly, or on new significant data). Reads
  feature vectors from GCS, trains models, writes model artifacts + registry to GCS.
  No live mode — training is computationally expensive and infrequent.
- **Data produced:** `model_artifacts_registry` (GCS)
- **Data consumed:** feature vectors from all feature services (GCS), instruments (GCS)

**ml-inference-service**

- **Batch:** Reads models from GCS, reads features from GCS, generates predictions, writes to GCS.
- **Live:** Loads models from GCS (infrequent reload — models change rarely). Receives LIVE
  features from feature services via PubSub (not from GCS — because features are live, use
  messaging per Rule 3). Generates predictions in real-time. Publishes predictions to PubSub.
  Persists to GCS.
- **Why features come via PubSub in live:** Features services are live producers. ML inference
  is a live consumer. Per the messaging rule: live→live = PubSub, not GCS polling.
- **Why models come from GCS:** ML training is batch/infrequent. Per the messaging rule:
  batch→live = GCS read. No PubSub needed for model updates.
- **Current implementation gap:** Currently reads features from BigQuery (polling). Target: PubSub subscription.
- **Data produced:** `predictions` (GCS), live predictions (PubSub)
- **Data consumed:** models (GCS from ml-training), features (PubSub from feature services)

### Layer 5 — Strategy & Execution

**strategy-service**

- **Batch:** Reads predictions, features, market data from GCS. Generates signals. Writes backtest
  results to GCS. Simulates execution.
- **Live:** Receives live predictions from ML inference (PubSub), live market data from MDPS
  (PubSub), live features from feature services (PubSub). Generates trade signals. Sends
  orders to execution-service (PubSub). Receives order handshakes from execution-service.
- **Position:** Gets current position from position-balance-monitor-service (PubSub subscription).
  At startup, PBM publishes initial position state (from exchange query). Strategy uses this to
  decide trades. Strategy does NOT query execution-service for position.
- **Current implementation gap:** Uses internal PositionMonitor. Target: subscribes to PBM.
- **Data produced:** `signals_backtest_results` (GCS), live trade signals (PubSub)
- **Data consumed:** predictions (PubSub), market data (PubSub), features (PubSub), positions (PubSub from PBM)

**execution-service**

- **Batch:** Replays historical orders from GCS, simulates execution, writes results to GCS.
- **Live:** Receives trade signals from strategy-service (PubSub). Executes on exchanges.
  Publishes full order lifecycle events to PubSub:
  - `ORDER_CREATED` — order submitted to venue
  - `ORDER_UPDATED` — order modified (price/quantity change)
  - `ORDER_CANCELLED` — order cancelled
  - `ORDER_FILLED` — fill received (partial or complete)
  - `ORDER_REJECTED` — venue rejected order
    Sends order handshakes back to strategy-service (PubSub).
    Publishes fill events to PBM for position reconciliation.
    Writes execution results to GCS. Maintains hot order state in Redis.
- **Current implementation gap:** Only publishes fills externally. Target: full order lifecycle.
- **Co-located with MTDH** for live market feed (one stream, many allocation clients).
- **Data produced:** `execution_results` (GCS), order lifecycle events (PubSub), hot state (Redis)
- **Data consumed:** trade signals (PubSub from strategy), market feed (in_memory from MTDH)

### Layer 6 — Risk, PnL, Monitoring

**position-balance-monitor-service (PBM)**

- **Batch:** Reads execution results from GCS, computes position snapshots, writes to GCS.
- **Live:** Subscribes to fill events from execution-service (PubSub). Also maintains its own
  position feed from exchanges (independent verification). Reconciles exchange positions vs
  filled orders. Publishes position updates to PubSub (consumed by strategy, risk, PnL,
  client-reporting). Publishes balance alerts to alerting-service.
- **Key role:** PBM is the authoritative source of position truth. Strategy reads from PBM,
  not from execution. PBM reconciles what execution sent to the exchange vs what the exchange
  reports.
- **Data produced:** `position_snapshots` (GCS), position updates (PubSub), balance alerts (PubSub)
- **Data consumed:** fills (PubSub from execution), exchange position feed (direct API)

**risk-and-exposure-service**

- **Batch:** Reads position snapshots + market data from GCS, computes VaR/Greeks/DeFi LTV, writes to GCS.
- **Live:** Subscribes to position updates from PBM (PubSub), market data from MDPS (PubSub).
  Computes risk in real-time. Publishes risk metrics to PubSub (consumed by PnL, client-reporting).
  Publishes risk alerts to alerting-service (circuit breaker triggers).
- **Data produced:** `risk_metrics` (GCS), risk updates (PubSub), risk alerts (PubSub)
- **Data consumed:** positions (PubSub from PBM), market data (PubSub from MDPS)

**pnl-attribution-service**

- **Batch:** Reads execution results, risk metrics, market data from GCS. Computes P&L attribution
  (delta, basis, funding, Greeks dimensions). Writes reports to GCS.
- **Live:** Subscribes to execution events (PubSub from execution), risk metrics (PubSub from risk),
  position updates (PubSub from PBM). Computes live P&L. Publishes to PubSub (consumed by
  client-reporting, alerting).
- **Data produced:** `pnl_reports` (GCS), live P&L (PubSub)
- **Data consumed:** execution results (PubSub from execution), risk metrics (PubSub from risk),
  positions (PubSub from PBM)

**client-reporting-api**

- **Batch:** Generates historical P&L reports, portfolio summaries, investor decks, invoicing.
  Reads from GCS (PnL reports, risk metrics, position snapshots). Serves via HTTP REST.
- **Live:** Streams live P&L updates via SSE (receives from pnl-attribution PubSub).
  Dashboard for clients to see real-time portfolio performance.
- **Current implementation gap:** Batch only. Target: batch + live SSE streaming.
- **Data produced:** Reports, decks, invoices (GCS or direct HTTP response)
- **Data consumed:** PnL (PubSub/GCS from pnl-attribution), risk (PubSub/GCS from risk),
  positions (PubSub/GCS from PBM)

### Alerting System (Cross-Cutting)

**alerting-service**

- **Both batch and live.** Cross-cutting concern that sits above the pipeline.
- **Consumes:** ALL lifecycle and coordination events from ALL services via PubSub subscription
  to the unified events topic. Also receives specific alert events from risk (circuit breaker
  triggers), PBM (balance discrepancy alerts), and execution (order rejection spikes).
- **Publishes:**
  - **Circuit breaker commands** to services (PubSub): e.g., "halt all execution" if risk breach
  - **External notifications:** Slack webhooks, PagerDuty alerts, email
  - **Deployment commands:** Can trigger deployment-api to stop/restart services
- **Architecture:** Uses unified-events-interface EventSink for consuming events. The event
  infrastructure (UEI) provides the standardized event schema; alerting-service provides the
  rules engine and dispatch logic.
- **Disaster recovery:** Alerting-system is the trigger for DR workflows. It publishes circuit
  breaker events that services subscribe to and must honor (graceful shutdown, position flatten).
- **Current implementation gap:** Stub. Slack webhook implemented, PagerDuty config only, no
  circuit breakers. Target: full rules engine + multi-channel dispatch + circuit breakers.

### Deployment Layer

**deployment-engine**

- **Batch:** Orchestrates batch deployments — builds shards, configures Cloud Run jobs, manages
  Terraform state. Triggers quality gates and integration tests.
- **Live:** Orchestrates live deployments — starts Cloud Run services, configures PubSub topics,
  manages VM co-location groups. Monitors service health.
- **Key difference:** In batch, deployment creates Cloud Run _jobs_ (run once, exit). In live,
  deployment creates Cloud Run _services_ (long-running) with autoscaling.

**deployment-api**

- **Same endpoints in both modes.** The "mode" is a parameter on deployment requests, not a
  different set of endpoints. API handles: deployments, services, config, data-status,
  service-status, cloud-builds, checklists.
- **Live-specific:** SSE endpoint for health monitoring events (consumed by live-health-monitor-ui).

---

## 6. The Strategy-Execution-Position Loop

This is the core live trading loop. Understanding this flow is critical:

```
                    ┌─── position state ────┐
                    │                       │
                    ▼                       │
    ┌──────────────────┐            ┌──────────────────────────┐
    │  strategy-service │            │ position-balance-monitor-service │
    │                  │            │        -service          │
    │  Decides: trade  │            │                          │
    │  or no trade     │            │  Reconciles:             │
    │  based on:       │            │  - fills from execution  │
    │  - position (PBM)│            │  - exchange position feed│
    │  - signals (ML)  │◄───────────│                          │
    │  - market data   │  positions │  Authoritative position  │
    └────────┬─────────┘   (PubSub) │  source of truth         │
             │                      └──────────┬───────────────┘
             │ orders                           │
             │ (PubSub)                         │ fill events
             ▼                                  │ (PubSub)
    ┌──────────────────┐                        │
    │ execution-service│                       │
    │                  │────────────────────────┘
    │  Executes on     │
    │  exchange.       │───► exchange venue APIs
    │  Sends handshake │
    │  back to strategy│
    │  (PubSub)        │
    └──────────────────┘
```

**Startup sequence:**

1. PBM starts → queries exchange for current positions → publishes initial state to PubSub
2. Strategy starts → subscribes to PBM positions → knows current position (even if zero)
3. Strategy computes signals → sends orders to execution via PubSub
4. Execution executes → sends fill events to PBM + handshake to strategy
5. PBM reconciles → publishes updated position → strategy sees new state

**Why strategy reads from PBM, not execution:**

- Execution knows what it SENT, but PBM knows what the EXCHANGE actually holds
- PBM reconciles discrepancies (partial fills, venue rejections, connection drops)
- If strategy restarts, it gets authoritative position from PBM immediately

---

## 7. Data Lineage — Where Does Each Dataset Originate?

Every dataset has exactly ONE authoritative producer. Consumers read from GCS (batch) or
subscribe to PubSub (live).

| Dataset                   | Authoritative Producer            | GCS Path Pattern             | PubSub Topic (live)                      |
| ------------------------- | --------------------------------- | ---------------------------- | ---------------------------------------- |
| instruments_universe      | instruments-service               | `instruments/by_date/`       | `instrument-events`                      |
| raw_tick_data             | market-tick-data-service          | `ticks/raw/by_venue/`        | `raw-ticks-{venue}`                      |
| processed_candles_ohlcv   | market-data-processing-service    | `candles/by_venue/`          | `processed-candles-{venue}`              |
| calendar_features         | features-calendar-service         | `features/calendar/`         | — (batch only)                           |
| delta_one_features        | features-delta-one-service        | `features/delta_one/`        | `features-delta-one`                     |
| volatility_features       | features-volatility-service       | `features/volatility/`       | `features-volatility`                    |
| cross_instrument_features | features-cross-instrument-service | `features/cross_instrument/` | `features-cross-instrument-{underlying}` |
| onchain_features          | features-onchain-service          | `features/onchain/`          | — (batch only)                           |
| model_artifacts_registry  | ml-training-service               | `ml/models/`                 | — (batch only)                           |
| predictions               | ml-inference-service              | `predictions/by_date/`       | `predictions-live`                       |
| signals_backtest_results  | strategy-service                  | `signals/by_date/`           | `trade-signals`                          |
| execution_results         | execution-service                 | `execution/by_date/`         | `order-events-{venue}`                   |
| hot_order_state           | execution-service                 | — (Redis, transient)         | —                                        |
| position_snapshots        | position-balance-monitor-service  | `positions/by_date/`         | `position-updates`                       |
| risk_metrics              | risk-and-exposure-service         | `risk/by_date/`              | `risk-metrics`                           |
| pnl_reports               | pnl-attribution-service           | `pnl/by_date/`               | `pnl-updates`                            |

**API Contract Schemas (SSOT: unified-internal-contracts + unified-api-contracts):**
Full field-level types, Correlation ID, and Client Order ID are defined in:

- `unified-internal-contracts/schemas/` — internal service-to-service contracts
- `unified-api-contracts/` — external API schemas and VCR mocks

Key cross-cutting fields:

- **`correlation_id`**: Required on all events; propagated end-to-end (strategy → execution → PBM → risk → PnL → client-reporting)
- **`client_order_id`**: Required on all execution events; client-assigned, idempotency key
- **`exchange_timestamp`**: Required on all market data events
- Audit retention: `unified-internal-contracts/schemas/audit.py` — 7yr execution audit, 3yr strategy audit
- Error recovery: `unified-internal-contracts/schemas/errors.py` — `ErrorCategory`, `ErrorRecoveryStrategy`

---

## 8. Optionality — Everything Is Configurable

Not every path in the pipeline is required. The topology shows the FULL system, but individual
deployments may enable subsets:

- **Minimal:** instruments → MTDH → MDPS → execution (no ML, no features)
- **With ML:** adds features → ML training → ML inference → strategy
- **With risk:** adds PBM → risk → PnL → client-reporting
- **DeFi:** adds features-onchain-service + unified-defi-execution-interface
- **Sports:** adds features-sports-service + unified-sports-execution-interface (future)

Each service checks config for which upstream data is available. Missing optional upstream
data = service runs without that input (gracefully). Required upstream data = service fails
fast with clear error.

---

## 9. Current Implementation vs Target (Gaps)

| Area                         | Current State                   | Target State                                                     | Gap Severity                                           |
| ---------------------------- | ------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| ML inference features        | Reads from BigQuery (polling)   | PubSub subscription for live features                            | P1 — violates live messaging rule                      |
| Strategy position            | Internal PositionMonitor        | PubSub subscription to PBM                                       | P1 — no position reconciliation                        |
| Execution events             | Fills only published            | Full order lifecycle (created/updated/cancelled/filled/rejected) | P1 — trading analytics UI needs granularity            |
| Execution + MTDH co-location | Path dependency, WebSocket stub | Co-located VM with in_memory adapter                             | P2 — works via PubSub, co-location is optimization     |
| Client reporting live        | Batch only                      | Batch + live SSE (streaming P&L)                                 | P2 — live P&L is UX enhancement                        |
| Market data API candles      | Order book only                 | Order book + candles SSE                                         | P2 — candles available in MDPS, just need SSE endpoint |
| Alerting circuit breakers    | Stub (Slack only)               | Full rules engine + multi-channel + circuit breaker commands     | P1 — DR workflow depends on this                       |
| Strategy → PBM data source   | Not connected                   | PBM publishes, strategy subscribes                               | P1 — required for live trading                         |
| PBM exchange reconciliation  | Consumes fills from execution   | Also needs direct exchange position feed                         | P1 — reconciliation needs both sides                   |

---

## 10. References

- **Visual diagram:** `unified-trading-codex/04-architecture/RUNTIME_DEPLOYMENT_TOPOLOGY_DAG.svg`
- **Machine-readable SSOT:** `unified-trading-pm/configs/runtime-topology.yaml`
- **Code DAG (tiers + versions):** `unified-trading-pm/workspace-manifest.json`
- **Tier rules:** `unified-trading-codex/04-architecture/TIER-ARCHITECTURE.md`
- **Library deps:** `unified-trading-codex/05-infrastructure/unified-libraries/INTERNAL_DEPENDENCY_GRAPH.md`
- **Integration testing:** `unified-trading-codex/06-coding-standards/integration-testing-layers.md`
- **Event logging:** `unified-trading-codex/03-observability/lifecycle-events.md`

---

## 11. Sharding Dimensions

Every service has a finest-granularity shard that defines one complete unit of work, one scaling unit, and one PubSub topic.

### Two-Plane Model

The pipeline splits into two planes with different dimension sets:

**Shared data plane (L1-L4):** Dimensions are `category x venue x instrument_type x ...`. No client concept. All clients see the same market data, features, and models. Scales by venue count x instrument type count.

**Client-specific plane (L5-L6):** Adds `client x subaccount x strategy_id`. The "client" dimension enters at strategy-service and propagates downstream. Scales by client count x subaccount count.

### Per-Service Dimensions

| Service                          | Batch Dims                                            | Live Dims                           | Topic Template                              |
| -------------------------------- | ----------------------------------------------------- | ----------------------------------- | ------------------------------------------- |
| instruments-service              | category x venue x date                               | venue                               | `instrument-events-{venue}`                 |
| market-tick-data-service         | category x venue x instrument_type x data_type x date | venue x instrument_type x data_type | `raw-ticks-{venue}-{inst_type}-{data_type}` |
| market-data-processing-service   | category x venue x instrument_type x date x timeframe | venue x instrument_type             | `candles-{venue}-{inst_type}-{timeframe}`   |
| features-delta-one / volatility  | category x venue x feature_category x date            | venue x feature_category            | `features-{cat}-{venue}`                    |
| features-cross-instrument        | underlying x date                                     | underlying                          | `features-cross-instrument-{underlying}`    |
| features-calendar / onchain      | category x date / protocol x chain x date             | N/A (batch only)                    | N/A                                         |
| ml-training-service              | model x instrument x timeframe x target_type x config | N/A (batch only)                    | N/A                                         |
| ml-inference-service             | model x venue x instrument x date                     | model x venue x instrument          | `predictions-{model}-{venue}-{inst}`        |
| strategy-service                 | strategy_id x client x date                           | strategy_id x client                | `signals-{strategy}-{client}`               |
| execution-service                | client x subaccount x date                            | client x subaccount                 | `orders-{client}-{sub}-{venue}`             |
| position-balance-monitor-service | client x venue x date                                 | client x venue                      | `positions-{client}-{venue}`                |
| risk-and-exposure-service        | client x date                                         | client                              | `risk-{client}`                             |
| pnl-attribution-service          | client x date                                         | client                              | `pnl-{client}`                              |
| alerting-service                 | N/A                                                   | singleton                           | N/A                                         |

### Key Decisions

- **Strategy is NOT sharded by venue** — arb strategies span multiple venues. Shard by `strategy_id x client`.
- **instrument_type** added to MTDH and MDPS — memory/SSD gets heavy per venue; splitting by instrument type helps and allows different processing requirements.
- **feature_category** added to features — allows swapping features in/out for optionality.
- **Cross-instrument features shard by underlying** — one shard per underlying (BTC, ETH, etc.). Each shard aggregates data from all instruments of that underlying across all venues. Independent scaling as underlying count grows.
- **Execution uses subaccount even in batch** — default subaccount for backtest keeps uniform implementation.
- **Position is raw at finest granularity** — PBM outputs `client x subaccount x venue x instrument`. Risk, PnL, and reporting aggregate to higher dimensions.
- **Batch trigger is not a dimension** — batch is run affirmatively; the processing interval (day/week/month) comes from the sharding config.

### Underlying and Pool Concepts

- **Underlying:** Aggregation key for cross-instrument exposure. Used by strategy (arb exposure), execution (spread trades), risk (Greeks aggregation), PnL (attribution by underlying). Examples: BTC (aggregates BTC-PERP, BTC-FUT-MAR, BTC options), ETH, SPY.
- **Pool:** Group of correlated underlyings for portfolio-level risk. Examples: "crypto-majors" (BTC, ETH), "defi-bluechip" (AAVE, UNI, CRV). Risk can aggregate at pool level for concentration monitoring.

---

## 12. Event Trigger Taxonomy

| Trigger Type          | Cadence          | Services                                          | What Triggers It             |
| --------------------- | ---------------- | ------------------------------------------------- | ---------------------------- |
| continuous-stream     | ~0ms             | MTDH                                              | WebSocket message arrival    |
| time-throttled-short  | ~15s             | MDPS                                              | Timer (aggregate buffer)     |
| event-driven-chain    | after MDPS       | features-delta-one, features-vol                  | MDPS completion PubSub event |
| event-driven          | on upstream data | ML inference, strategy, execution, PBM, risk, PnL | Upstream PubSub event        |
| time-throttled-medium | ~15 min          | instruments-service                               | Timer (poll venues)          |
| scheduled-long        | ~quarterly       | ML training                                       | Cloud Scheduler / manual     |

**Multi-timeframe update rule (MDPS):** The smallest timeframe (~15s) drives the trigger. Larger timeframes update only on their natural boundaries: 1min every 4 triggers, 5min every 20, 15min every 60, 1h every 240.

**Features are event-chained, not time-triggered:** Features services subscribe to MDPS completion events. This ensures features never run before MDPS finishes its aggregation cycle.

---

## 13. Recovery and Replay Patterns

### Recovery Priority Chains by Asset Class

**CeFi crypto:**

1. UMI WebSocket reconnect (exponential backoff 1s-32s, max 10 attempts)
2. Venue REST API backfill (gaps < 3 months for most exchanges)
3. Tardis.dev replay (~7yr lookback, WS-style replay identical to live format)
4. GCS historical data (our own persistence, last resort)

**TradFi:**

1. Venue reconnect
2. Databento replay (7yr lookback, live-identical format, CME/Nasdaq/NYSE)
3. IBKR TWS API backfill (6mo tick, rate-limited)
4. GCS historical data

**DeFi:**

1. Chain RPC reconnect (The Graph / Alchemy / direct node)
2. Replay from block number (blockchain is immutable, full history always available)
3. No third-party dependency needed — the chain is the canonical source

**Reference data:** Trivial — latest live state only, can drop a packet. Re-fetch from venues on restart.

**Internal services (MDPS, features, ML inference, strategy, risk, PnL):** Concurrent replay + live with flip pattern. Subscribe to live PubSub, replay from GCS on separate thread, drain queue at merge point, deduplicate by timestamp.

### Venue Replay Capabilities (SSOT: unified-api-contracts)

| Provider        | Lookback                | Replay Method                    | Asset Classes          |
| --------------- | ----------------------- | -------------------------------- | ---------------------- |
| Tardis.dev      | ~7 years                | WS-style replay (Tardis Machine) | Crypto (40+ exchanges) |
| Databento       | 7 years                 | REST + live-identical replay     | TradFi (60+ venues)    |
| Binance futures | 3 months                | REST pagination                  | Crypto                 |
| OKX             | 3 months                | REST pagination                  | Crypto                 |
| Deribit         | shallow                 | REST only                        | Crypto options/futures |
| Bybit           | 2 years (7-day windows) | REST pagination                  | Crypto                 |
| IBKR            | 6 months tick           | TWS API, rate-limited            | Multi-asset            |
| DeFi            | unlimited               | Block replay via RPC             | On-chain               |

### Persistence-to-Live Switchover

1. Service starts, subscribes to live PubSub topic (messages queue)
2. Replays from GCS up to last persisted timestamp (separate thread)
3. Drains queued PubSub messages
4. At merge point: live processing takes over, replay stops
5. Overlap deduplicated by timestamp

Since we publish + persist in PARALLEL (not sequentially), there may be a small overlap window. Consumer deduplicates by timestamp.

### MDPS Rolling Window Warmup

MDPS maintains a ~1 year rolling window of historical candles in Redis/memcached (survives restarts). On startup, loads from GCS. Downstream features services do not need their own warmup — MDPS provides candles with sufficient history context.

---

## 14. Publish + Persist Policy

**Rule: publish and persist in parallel, not sequentially.**

Persistence (GCS write) is too slow to block live publishing (PubSub). The service publishes to PubSub immediately and persists to GCS in parallel. This means:

- Live latency is NOT blocked by persistence
- Switchover may have a small overlap window — consumers deduplicate by timestamp
- If GCS persistence fails, the PubSub message was still delivered (data not lost for live consumers)
- If PubSub publish fails, GCS persistence still completes (data not lost for batch consumers)

---

## 15. Timestamp Ordering

**Rule: publisher publishes as-is. Consumer decides ordering strategy.**

Each message carries:

- `exchange_timestamp` — canonical ordering key (when the exchange says it happened)
- `local_timestamp` — when our system received it (for latency monitoring)
- `sequence_number` — per-stream sequence for gap detection

Consumer options:

- **Process in arrival order:** lowest latency, acceptable for most use cases
- **Reorder by exchange_timestamp:** correctness-critical consumers (PBM reconciliation)
- **Skip late messages:** MDPS candle aggregation ignores ticks after candle close

Gap detection: MTDH tracks sequence numbers per stream. Gaps trigger recovery from venue REST or Tardis/Databento replay.

Why not enforce at publisher: enforcing ordering adds latency. Different consumers have different requirements. Let the publisher be fast, let consumers be correct.

---

## 16. Kill Switches and Circuit Breakers

### Manual Kill Switch (human-initiated)

- deployment-api exposes `/kill-switch/{service}/activate` (OAuth-gated)
- Propagates via PubSub topic `kill-switch-commands`
- Target services: execution-service, strategy-service
- State persisted in Secret Manager (few ms latency, survives restarts)
- live-health-monitor-ui shows kill switch status per service

### Automated Circuit Breaker (alerting-initiated)

- alerting-service publishes `CIRCUIT_BREAKER_OPEN` to `circuit-breaker-commands` PubSub topic
- Triggers: risk breach, order rejection spike, balance discrepancy, connectivity loss
- Target services: execution-service (halt orders), strategy-service (halt signals)
- Escalation: PubSub command -> Slack -> PagerDuty (if not acknowledged in N minutes)

### Circuit Breaker Reset Policy (error-type-dependent)

| Error Type           | Reset Strategy                                                       |
| -------------------- | -------------------------------------------------------------------- |
| Position mismatch    | Reconciliation on restart, then auto-reset                           |
| Network connectivity | Restart execution stack, strategy waits, auto-reset when reconnected |
| Risk breach          | Manual reset only (human decision)                                   |
| Rate limit           | Auto-reset after cooldown (per venue rate limit window)              |

---

## 17. Error Retry Policy (SSOT: unified-internal-contracts)

Error categories and recovery strategies are defined in `unified-internal-contracts/schemas/errors.py` (`ErrorCategory` and `ErrorRecoveryStrategy` enums). The topology layer references, not duplicates, those definitions.

| Error Category | Strategy           | Max Retries | Backoff             | After Exhaustion        |
| -------------- | ------------------ | ----------- | ------------------- | ----------------------- |
| RATE_LIMIT     | RETRY_WITH_BACKOFF | 5           | exp 1s-60s + jitter | ALERT + SKIP            |
| TIMEOUT        | RETRY              | 3           | linear 2s           | ALERT + FAIL            |
| NETWORK        | RETRY_WITH_BACKOFF | 10          | exp 1s-120s         | CIRCUIT_BREAKER + ALERT |
| SERVER_ERROR   | RETRY              | 3           | linear 5s           | ALERT + FAIL            |
| VALIDATION     | FAIL_FAST          | 0           | none                | ALERT + LOG             |
| AUTH_FAILURE   | FAIL_FAST          | 0           | none                | CIRCUIT_BREAKER + ALERT |

Key principles: NETWORK gets most retries (transient). VALIDATION and AUTH never retry. RATE_LIMIT skips and resumes.

---

## 18. T+1 Backtest vs Live Reconciliation

Two separate T+1 reconciliations, aggregated:

**Strategy T+1** (`batch-live-reconciliation-service`):

- Validates: signals, strategy instructions, positions at snapshot points
- Compares: live signals vs batch-replayed signals given same inputs
- Output: strategy PnL = PnL assuming fills at benchmark price
- ML signals should be identical (deterministic). Strategy instructions should be close (time-triggered).

**Execution T+1** (`execution-service` or `batch-live-reconciliation-service`):

- Validates: order execution timing, fill quality, slippage
- Compares: live fills vs benchmark (TWAP/VWAP/arrival price)
- Output: execution alpha PnL = actual fill price vs benchmark

**Aggregated:** Overall PnL = strategy PnL + execution alpha PnL. Answers: wrong strategy or expensive execution? Full report, no threshold initially — eventually AI-interpreted.

---

## 19. Order State Reconciliation

On connectivity loss:

1. WebSocket reconnect (UMI exponential backoff)
2. Query exchange REST API for all open orders and recent fills
3. Compare exchange state vs internal OMS state
4. Missing fills -> apply to OMS
5. Unknown orders -> cancel or adopt
6. Stale orders -> cancel
7. PBM independently reconciles from exchange feed vs accumulated fills
8. Reconciliation events published to alerting-service

---

## 20. Initial State Bootstrap

| Service             | Source                       | Method                                     |
| ------------------- | ---------------------------- | ------------------------------------------ |
| instruments-service | Venue REST APIs              | Full fetch on start                        |
| MTDH                | Venue WebSocket + Tardis     | Subscribe + backfill gaps                  |
| MDPS                | GCS + Redis/memcached        | Load rolling window (~1yr)                 |
| features-\*         | GCS historical features      | Load from GCS, recalculate if stale        |
| ML inference        | GCS models + PubSub features | Load model, subscribe features             |
| strategy            | PBM + ML + MDPS PubSub       | Subscribe PBM (initial snapshot), ML, MDPS |
| execution           | Exchange REST + Redis        | Query exchange open orders, restore Redis  |
| PBM                 | Exchange REST (positions)    | Query exchange, publish initial snapshot   |
| risk                | PBM + MDPS PubSub            | Subscribe to both                          |
| PnL                 | GCS + live PubSub            | Load GCS, subscribe execution + risk       |
| alerting            | PubSub replay                | Cloud Run auto-restart, PubSub retention   |

---

## 21. Deployment Targets

**UI deployment:** All UIs are Cloud Run Services serving the React/TypeScript static build. UI and API are deployed as **separate** Cloud Run Services — separate repos, separate auto-scaling, separate rollouts.

**API auth:** All API services (:8001-:8005) use **OAuth** authentication (Google Identity / OIDC).

### Per-Service Deployment Targets

| Service                               | Deploy Type       | Scaling Mode                             | Reason                                                                                        |
| ------------------------------------- | ----------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| **market-tick-data-service**          | VM (co-located)   | always-on                                | Continuous WebSocket connections; co-located with MDPS + execution for in_memory transport    |
| **market-data-processing-service**    | VM (co-located)   | always-on                                | Co-located with MTDH for in_memory hot path; maintains ~1yr Redis candle window               |
| **execution-service**                 | VM (co-located)   | always-on                                | Co-located with MTDH for live market feed; maintains Redis order state                        |
| **ml-training-service**               | VM (standalone)   | manual/scheduled                         | Heavy compute (~2hr training runs); Cloud Run max timeout too short                           |
| **strategy-service**                  | Cloud Run Service | always-on                                | Live PubSub subscriber; stateless enough for Cloud Run; auto-restarts on crash                |
| **position-balance-monitor-service**  | Cloud Run Service | always-on                                | Continuous exchange feed + PubSub subscription; stateless between restarts                    |
| **risk-and-exposure-service**         | Cloud Run Service | always-on                                | Live PubSub subscriber; computes risk on every position update                                |
| **alerting-service**                  | Cloud Run Service | always-on                                | Must be available 24/7; auto-restart + PubSub retention for recovery                          |
| **ml-inference-service**              | Cloud Run Service | always-on (live) / scale-to-zero (batch) | Mode-dependent: live needs persistent PubSub subscription                                     |
| **features-delta-one-service**        | Cloud Run Service | always-on (live) / scale-to-zero (batch) | Mode-dependent: live needs MDPS event subscription                                            |
| **features-volatility-service**       | Cloud Run Service | always-on (live) / scale-to-zero (batch) | Mode-dependent                                                                                |
| **features-cross-instrument-service** | Cloud Run Service | always-on (live) / scale-to-zero (batch) | Mode-dependent; subscribes to multiple MDPS topics per underlying                             |
| **instruments-service**               | Cloud Run Job     | scale-to-zero                            | Infrequent (~15min polls); one-shot batch runs; no persistent state needed                    |
| **features-calendar-service**         | Cloud Run Job     | scale-to-zero                            | Batch only; calendar data changes rarely                                                      |
| **features-onchain-service**          | Cloud Run Job     | scale-to-zero                            | Batch only; periodic on-chain data fetch                                                      |
| **pnl-attribution-service**           | Cloud Run Service | always-on                                | Continuous subscriber to execution + risk PubSub events; runs P&L attribution on every update |
| **features-multi-timeframe-service**  | Cloud Run Service | always-on (live) / scale-to-zero (batch) | Mode-dependent: live subscribes to FDS completion events                                      |
| **execution-results-api**             | Cloud Run Service | auto-scale                               | Scales with HTTP/SSE connection count; min-instances configurable                             |
| **deployment-api**                    | Cloud Run Service | auto-scale                               | Request-driven; SSE for health monitoring stream                                              |
| **client-reporting-api**              | Cloud Run Job     | scale-to-zero                            | Batch report generation; occasional live SSE (target state)                                   |
| **All UIs**                           | Cloud Run Service | auto-scale                               | Serve React static build; scale with concurrent users                                         |

---

## 22. Async Startup Dependency Chain

Each service waits for upstream data availability via PubSub event (not a wall-clock timer). This ensures the whole stack starts correctly regardless of launch order or startup time.

**Startup chain (event-driven dependencies):**

1. **position-balance-monitor-service** starts → queries exchange → publishes initial position state snapshot
2. **instruments-service** starts → polls venue REST APIs → publishes instrument snapshot
3. **market-tick-data-service** starts → subscribes to venue WebSocket → starts emitting raw ticks (PubSub + in_memory)
4. **market-data-processing-service** waits for first MTDH tick event → starts candle timer → clock-aligns to even time boundary since midnight before first candle publish
5. **Feature services** (FDS, FVS, FOS, FCIS, FMTS) wait for first MDPS candle completion event before first feature publish
6. **ml-inference-service** waits for first feature publish + model artifact present in GCS
7. **strategy-service** waits for PBM initial position snapshot + first ML prediction event
8. **execution-service** waits for strategy first signal event

**Clock-alignment rule (MDPS):** MDPS only starts processing at even time boundaries since midnight (e.g., 00:00, 00:15, 00:30 for 15m candles). This ensures all downstream consumers receive complete candle blocks, not partial ones.

**Implication:** The system is safe to start in any order. Downstream services wait indefinitely via PubSub subscription until upstream data arrives. No hardcoded sleep or startup timeout required.
