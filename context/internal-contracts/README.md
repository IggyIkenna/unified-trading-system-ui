# unified-internal-contracts

Internal message schemas, topic names, and request/response/error contracts for unified-trading services.

**NO cloud SDKs** — this package must NOT depend on `google-cloud-*`, `boto3`, or `redis`. Pure Pydantic schemas only.

## Contents

- **messaging.py** — `MessagingScope`, `MessagingTopic` (canonical topic names)
- **ml.py** — ML model metadata, inference requests/responses, training jobs
- **risk.py** — Risk metrics, alerts, exposure, pre-trade checks, account state
- **features.py** — Delta-one features, vol surface, term structure
- **events.py** — Lifecycle event envelopes, per-type metadata
- **pubsub.py** — Pub/Sub message bodies, `InternalPubSubTopic`, typed envelopes
- **schemas/errors.py** — Error classification, context, recovery strategy

## Usage

```python
from unified_internal_contracts import MessagingScope, MessagingTopic, InferenceRequest, PreTradeCheckResponse
```

## Key Schemas

### messaging.py

- **`MessagingScope`** — enum: `IN_PROCESS` (same function call), `SAME_VM` (thread/queue),
  `CROSS_VM` (Pub/Sub across service boundaries)
- **`MessagingTopic`** — enum of all canonical internal topic names; consumed by implementing
  libraries to select correct backend

### ml.py

- **`InferenceRequest`** — feature vector + model ID + request metadata for live inference
- **`InferenceResponse`** — prediction output, confidence, latency, model version
- **`TrainingJobSpec`** — dataset ref, hyperparameters, resource requirements
- **`ModelMetadata`** — model ID, version, feature schema, training timestamp

### risk.py

- **`PreTradeCheckRequest`** — order intent submitted to risk-service before execution
- **`PreTradeCheckResponse`** — approved/rejected + rejection reason + breached limits
- **`RiskMetrics`** — VaR, CVaR, delta, gamma, theta at portfolio and venue level
- **`ExposureAlert`** — threshold-breach alert with severity and affected positions
- **`AccountState`** — current balances, margin usage, open positions summary

### features.py

- **`DeltaOneFeatureSet`** — computed delta-one features ready for model consumption
- **`VolSurfaceSnapshot`** — implied vol grid keyed by strike and expiry
- **`TermStructureSnapshot`** — forward curve and carry metrics across tenors

### events.py

- **`LifecycleEventEnvelope`** — wraps `LifecycleEvent` with routing metadata
- **`CoordinationEventEnvelope`** — wraps `CoordinationEvent` for cross-service dispatch

### pubsub.py

- **`InternalPubSubTopic`** — enum of canonical Pub/Sub topic names used system-wide
- Typed message envelopes for each topic (one envelope type per topic)

### schemas/errors.py

- **`ErrorClassification`** — enum: `TRANSIENT`, `PERMANENT`, `CONFIGURATION`, `DEPENDENCY`
- **`ErrorContext`** — service name, operation, correlation ID, upstream error chain
- **`RecoveryStrategy`** — enum: `RETRY`, `DEAD_LETTER`, `ALERT`, `CIRCUIT_BREAK`

## Consuming Services

| Module              | Primary consumers                                             |
| ------------------- | ------------------------------------------------------------- |
| `messaging.py`      | All services (scope/topic selection at startup)               |
| `ml.py`             | ml-inference-service, strategy-service, cascade subscribers   |
| `risk.py`           | risk-and-exposure-service, execution-service (pre-trade gate) |
| `features.py`       | features-delta-one, features-volatility, ml-inference-service |
| `events.py`         | All services (via unified-events-interface envelopes)         |
| `pubsub.py`         | alerting-service, cascade-service, execution-service          |
| `schemas/errors.py` | All services (error handling and dead-letter routing)         |

## Dependency Rule

UIC is **Tier 0**. It imports ONLY:

- `pydantic` — schema definition and validation
- Python standard library — `enum`, `datetime`, `typing`, `uuid`

No `google-cloud-*`, `boto3`, `redis`, `httpx`, or any other third-party runtime dep is permitted.
Violations are caught by the quality gate import scanner.

## Quality Gates

- Ruff, basedpyright, pytest
- **No cloud SDKs** — dependencies and imports must not include google-cloud-\*, boto3, redis
- Tier 0 — no imports from unified-trading-services or unified-domain-client
