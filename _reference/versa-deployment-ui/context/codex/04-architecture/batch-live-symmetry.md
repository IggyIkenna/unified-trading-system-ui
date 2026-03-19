# Batch vs Live Symmetry

This document defines the architectural distinction between batch mode and live mode across the unified trading
pipeline. Both modes execute the same business logic (feature calculation, ML inference, strategy signal generation) but
use different data transport and computation patterns appropriate to their latency requirements.

---

## TL;DR

|                     | Batch Mode                        | Live Mode                                         |
| ------------------- | --------------------------------- | ------------------------------------------------- |
| Data transport      | GCS Parquet files                 | PubSub topics                                     |
| Feature calculation | Loaded from GCS                   | Embedded package (in-process)                     |
| ML inference        | Batch prediction via GCS          | PubSub subscription → prediction → PubSub publish |
| Latency target      | Minutes/hours                     | Sub-second                                        |
| Network pattern     | GCS read/write                    | PubSub subscribe/publish (async)                  |
| Forbidden pattern   | Synchronous REST between services | Synchronous REST between services                 |

---

## Data Transport

### Batch: GCS as Message Bus

Services communicate exclusively through GCS (or S3) Parquet files. Service A writes output to a well-known bucket path;
Service B reads from that path on its next scheduled run.

- Coupling is through data contracts: Parquet schema + GCS path convention
- No inter-service RPCs, no message queues, no PubSub in batch mode
- Outputs are immutable: re-runs overwrite the entire shard, never append
- Self-describing, schema-validated, BigQuery/Athena compatible

### Live: PubSub as Message Bus

Inter-service data flow in live mode uses PubSub topics (replacing BigQuery polling). Upstream services publish computed
data to a topic; downstream services subscribe and consume asynchronously.

- Coupling is through async message contracts: Protobuf/Avro schema + topic name convention
- No inter-service synchronous HTTP/REST calls for data
- PubSub is a message queue, not REST/RPC — see "No Network Hops Clarification" below
- Publishers and subscribers are independently deployable and restartable

---

## Feature Calculation

### Batch: GCS-loaded features

Feature data is written to GCS Parquet by the relevant feature service, then read by the strategy/execution service as
part of its batch run. The feature values exist as files on object storage.

### Live: Embedded package (in-process)

The strategy process (and execution process) imports the feature calculator library directly as a Python package.
Feature computation happens in the same process, in memory, with no network call for the calculation itself.

- `unified-feature-calculator-library` is imported as a dependency, not called via HTTP
- No RPC to a feature service during the hot path
- Latency for the calculation is CPU-bound only — no serialization, no network round-trip

This is the "embedded package model." It is distinct from the data transport layer (PubSub). The raw market tick data
that feeds into the in-process feature calculation arrives via PubSub subscription; the calculation itself is local.

---

## ML Inference

### Batch: GCS batch prediction

ML models are trained and artifacts written to GCS. Inference runs as a batch job: reads feature Parquet from GCS, runs
prediction, writes prediction Parquet back to GCS.

### Live: PubSub subscription → in-process prediction → PubSub publish

The ML inference service subscribes to the feature PubSub topic, runs inference in-process on each message, and
publishes the prediction result to a downstream PubSub topic consumed by the strategy service.

---

## The "No Network Hops" Rule — Clarification

The rule "no network hops on the hot path" specifically prohibits **synchronous HTTP/REST calls between pipeline
services for data**. It does NOT prohibit PubSub.

| Pattern                                                            | Allowed?             | Reason                           |
| ------------------------------------------------------------------ | -------------------- | -------------------------------- |
| `GET http://features-service/api/v1/compute` from strategy-service | FORBIDDEN            | Synchronous RPC between services |
| `POST http://ml-service/api/v1/predict` from strategy-service      | FORBIDDEN            | Synchronous RPC between services |
| Subscribe to `topics/features-delta-one` and consume async         | ALLOWED              | Async message queue, not RPC     |
| Publish to `topics/strategy-signals` after computing               | ALLOWED              | Async message queue, not RPC     |
| Import `unified_feature_calculator_library` and call in-process    | ALLOWED              | Embedded package, no network     |
| Read `gs://features-bucket/day=2026-03-04/features.parquet`        | ALLOWED (batch only) | GCS object storage, not RPC      |

The distinction is synchronous vs asynchronous:

- **Synchronous RPC** (HTTP/REST, gRPC): caller blocks waiting for a response from another service. Forbidden for data
  flow.
- **Async messaging** (PubSub): publisher does not block; subscriber processes when ready. This is the standard live
  data transport.
- **In-process** (embedded library): no network at all for computation. Used for feature calculation and ML inference on
  the hot path.

---

## Mode Toggle Pattern (4 Seams)

The same pipeline business logic runs in both modes. The 4 seams that differ between modes are:

1. **Data source seam**: batch reads GCS Parquet; live subscribes to PubSub topic
2. **Feature seam**: batch loads feature Parquet from GCS; live calls embedded library in-process
3. **ML inference seam**: batch reads prediction Parquet from GCS; live subscribes to prediction PubSub topic
4. **Output seam**: batch writes Parquet to GCS; live publishes to PubSub topic

All other logic (signal generation, position sizing, risk checks) is shared and mode-agnostic.

---

## Anti-Drift Guards

To prevent batch and live modes from drifting apart in business logic:

1. **Shared engine**: strategy and execution business logic lives in `unified-trading-library` (T1), imported by both
   batch and live service entrypoints. Logic is never duplicated per mode.
2. **Schema parity**: the Parquet schema (batch) and PubSub message schema (live) for each data type are derived from
   the same Pydantic/dataclass definitions in `unified-api-contracts` (T0).
3. **Determinism tests**: batch runs with known inputs produce known outputs. The same inputs fed through the live
   embedded feature calculation path must produce bit-identical outputs. This is validated in integration tests.
4. **No mode-specific business logic**: `if mode == "live": ... else: ...` branches inside business logic are forbidden.
   Mode differences belong only at the 4 seams above.

---

## Batch-Only Service Exemptions

Not all services implement both modes. The following services are explicitly exempt from the batch/live symmetry
requirement because their workload is inherently offline and has no real-time streaming equivalent.

| Service             | Code | Mode       | Reason                                                                                                                                                                                  |
| ------------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ml-training-service | MLTR | Batch only | Model training is an offline optimization pass over historical data. There is no live training mode; training artifacts are consumed by ml-inference-service (which does support live). |

### MLTR — ml-training-service

`ml-training-service` is **batch-only by design**. Model training requires full historical feature data loaded from GCS
Parquet, optimizer convergence over multiple epochs, and artifact serialization back to GCS. These properties are
fundamentally incompatible with a live streaming mode:

- Training consumes entire dataset partitions (not individual tick events)
- Gradient descent requires multiple passes over the data — not possible in a single-message PubSub handler
- Trained model artifacts are written to GCS and consumed by `ml-inference-service`, which handles live prediction

The `--mode live` CLI flag **must not** be added to `ml-training-service`. Any CI check validating batch/live symmetry
must exclude MLTR from its scope.

---

## Service Audit Matrix (2026-03-11)

Current batch/live symmetry state across all pipeline services. Updated as part of
`live_batch_protocol_completeness_2026_03_10` plan (phase 4 codex update).

| Service                        | Code | Batch Handler           | Live Handler           | `--mode` CLI flag | Test Coverage       | Notes                                         |
| ------------------------------ | ---- | ----------------------- | ---------------------- | ----------------- | ------------------- | --------------------------------------------- |
| features-commodity-service     | FCS  | `BatchHandler`          | `LiveHandler`          | batch / live      | unit: both modes    | Wired in `cli/main.py` (p1-todo-05)           |
| features-volatility-service    | FVS  | `BatchHandler`          | `LiveHandler`          | batch / live      | unit: both modes    | Pre-existing live handler                     |
| features-onchain-service       | FOS  | `BatchHandler`          | `LiveHandler`          | batch / live      | unit: both modes    | Pre-existing live handler                     |
| features-sports-service        | FSS  | `BatchHandler`          | n/a (batch-first)      | batch             | unit: batch handler | Live handler is future work (p1-todo-10)      |
| market-tick-data-service       | MTDS | `DownloadBatchHandler`  | n/a (download-only)    | batch             | unit: batch handler | Download service — no live streaming mode     |
| market-data-processing-service | MDPS | `process_candles`       | `LiveModeHandler`      | batch / live      | parser tests        | Lazy-imported; wired via `_mode_dispatch`     |
| instruments-service            | INS  | `InstrumentsBatchMode`  | n/a (catalogue-only)   | batch             | parser tests        | `--run-mode` renamed to `--mode` (p1-todo-09) |
| strategy-service               | STR  | `StrategyBatchHandler`  | `StrategyLiveHandler`  | batch / live      | unit: both modes    | `LiveHandler` facade added (p1-todo-13)       |
| ml-inference-service           | MLIN | `BatchInferenceHandler` | `LiveInferenceHandler` | batch / live      | unit: both modes    | Pre-existing                                  |
| ml-training-service            | MLTR | `TrainingHandler`       | **EXEMPT**             | batch only        | unit: batch handler | Batch-only by design (see exemption above)    |
| execution-service              | EXS  | n/a                     | `ExecutionLiveHandler` | live only         | integration         | Execution is always live; no batch mode       |
| risk-service                   | RSK  | `RiskBatchHandler`      | `RiskLiveHandler`      | batch / live      | unit: both modes    | Pre-existing                                  |
| alerting-service               | ALS  | n/a                     | `AlertingHandler`      | live only         | integration         | Event-driven only; no batch mode              |

### Handler Pattern Reference

All services that support both modes follow the `BaseModeHandler` pattern from `unified-trading-library`:

```
cli/handlers/
  batch_handler.py  — BatchHandler (or service-specific name)
  live_handler.py   — LiveHandler wrapping the domain BaseModeHandler
  __init__.py       — exports both + get_handler_for_mode()
```

The CLI entry point (`cli/main.py` or `cli/parser.py`) dispatches on `--mode batch|live` and constructs the appropriate
handler. Business logic lives in the service engine, shared by both modes — only the 4 seams differ.

---

## Related Documents

| Document                                                           | Description                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| [README.md](README.md)                                             | Architecture overview, pipeline DAG, communication philosophy |
| [communication-patterns.md](communication-patterns.md)             | GCS batch bus, PubSub live streaming, HTTP control plane      |
| [deployment-topology-diagrams.md](deployment-topology-diagrams.md) | Batch containers vs live long-running processes               |
| [live/README.md](live/README.md)                                   | Long-running process model, per-client isolation              |
| [batch/README.md](batch/README.md)                                 | Job-based execution model, shard-per-container                |

---

## Cross-References

- Strategy config architecture: see `09-strategy/cross-cutting/config-architecture.md`
- Data flow map: see `04-architecture/data-flow-map.md`
