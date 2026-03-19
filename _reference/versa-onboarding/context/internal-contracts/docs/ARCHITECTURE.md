# unified-internal-contracts — Architecture

## Purpose

`unified-internal-contracts` (UIC) is the canonical source of truth for all internal
service-to-service message schemas in the unified-trading system. It defines the shapes of
requests, responses, events, and errors that cross service boundaries — with no implementations,
no I/O, and no cloud SDK dependencies.

## Design Principles

- **Contracts only** — types and schemas; no google-cloud-\*, boto3, redis
- **Tier 0** — no dependencies on unified-trading-services or unified-domain-client
- **Backend-agnostic** — `MessagingScope` and `MessagingTopic` drive backend selection in
  implementing libraries; UIC itself is transport-neutral

## Package Layout

```
unified_internal_contracts/
  __init__.py        — public re-exports: all key schema types
  messaging.py       — MessagingScope enum, MessagingTopic enum (canonical names)
  ml.py              — InferenceRequest, InferenceResponse, TrainingJobSpec, ModelMetadata
  risk.py            — PreTradeCheckRequest, PreTradeCheckResponse, RiskMetrics,
                       ExposureAlert, AccountState
  features.py        — DeltaOneFeatureSet, VolSurfaceSnapshot, TermStructureSnapshot
  events.py          — LifecycleEventEnvelope, CoordinationEventEnvelope
  pubsub.py          — InternalPubSubTopic enum, typed message envelopes per topic
  schemas/
    __init__.py
    errors.py        — ErrorClassification, ErrorContext, RecoveryStrategy
```

## Data Flow

### Producers → UIC schemas → Consumers

| Schema                      | Producing service                   | Consuming service                       |
| --------------------------- | ----------------------------------- | --------------------------------------- |
| `InferenceRequest`          | strategy-service                    | ml-inference-service                    |
| `InferenceResponse`         | ml-inference-service                | strategy-service, cascade-service       |
| `PreTradeCheckRequest`      | execution-service                   | risk-and-exposure-service               |
| `PreTradeCheckResponse`     | risk-and-exposure-service           | execution-service                       |
| `RiskMetrics`               | risk-and-exposure-service           | alerting-service, dashboard             |
| `ExposureAlert`             | risk-and-exposure-service           | alerting-service                        |
| `DeltaOneFeatureSet`        | features-delta-one                  | ml-inference-service, strategy-service  |
| `VolSurfaceSnapshot`        | features-volatility                 | ml-inference-service                    |
| `LifecycleEventEnvelope`    | all services (via UEI)              | event-store, monitoring                 |
| `CoordinationEventEnvelope` | execution-service, alerting-service | all services                            |
| `ErrorContext`              | all services                        | alerting-service, dead-letter consumers |

All services import UIC schemas directly — no service-to-service imports are permitted.

## MessagingScope Semantics

`MessagingScope` determines how a message is transported:

| Value        | Transport                              | Latency         | Use case                      |
| ------------ | -------------------------------------- | --------------- | ----------------------------- |
| `IN_PROCESS` | Direct function call / shared object   | sub-microsecond | Same service, same thread     |
| `SAME_VM`    | Thread-safe queue or in-process broker | microseconds    | Worker threads in one service |
| `CROSS_VM`   | Pub/Sub (GCP) or equivalent            | milliseconds    | Cross-service, cross-host     |

Implementing libraries (e.g., unified-cloud-interface) inspect `MessagingScope` at setup time to
select the correct backend. UIC defines the enum; it never instantiates any transport.

## InternalPubSubTopic Enum

Canonical topic names defined in `pubsub.py`:

| Topic                 | Publisher                           | Subscribers                       |
| --------------------- | ----------------------------------- | --------------------------------- |
| `INFERENCE_REQUESTS`  | strategy-service                    | ml-inference-service              |
| `INFERENCE_RESPONSES` | ml-inference-service                | strategy-service, cascade-service |
| `PRE_TRADE_CHECKS`    | execution-service                   | risk-and-exposure-service         |
| `RISK_ALERTS`         | risk-and-exposure-service           | alerting-service                  |
| `COORDINATION_EVENTS` | execution-service, alerting-service | all services                      |
| `LIFECYCLE_EVENTS`    | all services (via UEI)              | event-store                       |
| `FEATURE_SNAPSHOTS`   | features-\* services                | ml-inference-service              |
| `DEAD_LETTERS`        | any service on unrecoverable error  | alerting-service                  |

## Error Classification

`schemas/errors.py` provides a standard classification layer used by all services:

| `ErrorClassification` | Meaning                          | Default `RecoveryStrategy` |
| --------------------- | -------------------------------- | -------------------------- |
| `TRANSIENT`           | Network blip, temporary overload | `RETRY` (with backoff)     |
| `PERMANENT`           | Bad data, schema violation       | `DEAD_LETTER`              |
| `CONFIGURATION`       | Missing secret, wrong env var    | `ALERT`                    |
| `DEPENDENCY`          | Upstream service unavailable     | `CIRCUIT_BREAK`            |

`ErrorContext` carries the full diagnostic chain: service name, operation, correlation ID, and the
upstream error sequence. Alerting-service inspects `ErrorContext` to route to PagerDuty or Slack.

## Versioning

UIC follows semantic versioning:

- **PATCH** — additive fields with defaults, documentation fixes
- **MINOR** — new schemas or new optional fields; backward-compatible
- **MAJOR** — breaking field renames, removed fields, type changes

MAJOR version bumps require a PR to `staging` and SIT validation before merging to `main`. The
version cascade flow propagates the bump to all dependent repos via `manifest-updated` dispatch.

See `unified-trading-pm/docs/repo-management/version-cascade-flow.md` for the full cascade model.

## Cross-References

- `README.md` — module list, key schemas, consuming services
- `unified-events-interface` — UEI `LifecycleEvent` / `CoordinationEvent` (T0 peer)
- `unified-trading-codex/06-coding-standards/` — no Any types, no os.getenv()
- `unified-trading-pm/docs/repo-management/version-cascade-flow.md` — version bump propagation
