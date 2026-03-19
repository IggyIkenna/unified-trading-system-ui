# Prometheus Metrics

## Overview

Every service in the unified trading system exposes a standard set of Prometheus metrics. Naming conventions, required
metrics, and bucket configurations are defined here and must not diverge per-service.

---

## Naming Convention

```
{service_name}_{metric_type}_{unit}
```

| Segment        | Rule                                                                 | Example                                 |
| -------------- | -------------------------------------------------------------------- | --------------------------------------- |
| `service_name` | Snake-case canonical repo name, with hyphens replaced by underscores | `execution_service`, `alerting_service` |
| `metric_type`  | Noun describing what is measured                                     | `orders`, `records`, `connections`      |
| `unit`         | SI suffix or `_total` for counters                                   | `_total`, `_seconds`, `_bytes`          |

**Counters** always end in `_total`. **Histograms** always end in `_seconds` (for latency) or the measured unit.
**Gauges** use a descriptive noun with no suffix.

Examples:

- `execution_service_orders_total` — counter
- `execution_service_processing_latency_seconds` — histogram
- `market_data_processing_service_records_processed_total` — counter
- `alerting_service_active_connections` — gauge

---

## Required Metrics (All Services)

### Counters

| Name                                | Labels              | Description                            |
| ----------------------------------- | ------------------- | -------------------------------------- |
| `{service}_records_processed_total` | `status` (ok/error) | Records successfully processed         |
| `{service}_errors_total`            | `error_type`        | All unhandled or caught errors by type |

### Histograms

| Name                                   | Labels  | Buckets (seconds)           |
| -------------------------------------- | ------- | --------------------------- |
| `{service}_processing_latency_seconds` | `stage` | 0.001, 0.01, 0.1, 1.0, 10.0 |

The `stage` label distinguishes sub-stages (e.g. `parse`, `validate`, `persist`, `publish`) when a service has multiple
measurable phases.

### Gauges

| Name                           | Labels  | Description                               |
| ------------------------------ | ------- | ----------------------------------------- |
| `{service}_active_connections` | `type`  | Live connections (DB, PubSub, venue feed) |
| `{service}_queue_depth`        | `queue` | Messages waiting in an internal queue     |

---

## Registration Pattern

```python
from prometheus_client import Counter, Histogram, Gauge

RECORDS_PROCESSED = Counter(
    "execution_service_records_processed_total",
    "Number of records processed",
    ["status"],
)
ERRORS_TOTAL = Counter(
    "execution_service_errors_total",
    "Number of errors by type",
    ["error_type"],
)
PROCESSING_LATENCY = Histogram(
    "execution_service_processing_latency_seconds",
    "Processing latency by stage",
    ["stage"],
    buckets=[0.001, 0.01, 0.1, 1.0, 10.0],
)
ACTIVE_CONNECTIONS = Gauge(
    "execution_service_active_connections",
    "Active connections by type",
    ["type"],
)
QUEUE_DEPTH = Gauge(
    "execution_service_queue_depth",
    "Queue depth by queue name",
    ["queue"],
)
```

Register metrics at module level (not inside functions or class `__init__`). This prevents duplicate-metric errors on
process restart and ensures they are visible to Prometheus from startup.

---

## Exposition Endpoint

All services must expose metrics at `GET /metrics` using `prometheus_client.make_asgi_app()` or the FastAPI integration.
The `/metrics` endpoint must NOT require authentication (Prometheus scrapes it from within the VPC).

```python
from prometheus_client import make_asgi_app
from fastapi import FastAPI

app = FastAPI()
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

---

## Alert Rules

Standard alert thresholds (configured in Grafana / Prometheus alert rules):

| Alert                       | Condition                                 | Severity |
| --------------------------- | ----------------------------------------- | -------- |
| `HighErrorRate`             | `rate(errors_total[5m]) > 0.05`           | warning  |
| `HighProcessingLatency`     | `histogram_quantile(0.99, latency) > 5.0` | warning  |
| `ServiceQueueDepthHigh`     | `queue_depth > 10000`                     | warning  |
| `ServiceQueueDepthCritical` | `queue_depth > 100000`                    | critical |
| `NoRecordsProcessed`        | `rate(records_processed_total[10m]) == 0` | warning  |

---

## Rules

- Do not use the generic `prometheus_client.REGISTRY.register()` call — use the typed constructors above.
- Never reuse a metric name across services — always prefix with the canonical service name.
- Do not add high-cardinality labels (e.g. `order_id`, `instrument_id`) — this creates cardinality explosions.
- `PROCESSING_LATENCY` must use the exact bucket sequence `[0.001, 0.01, 0.1, 1.0, 10.0]` for cross-service dashboard
  compatibility.
- Metrics module lives at `{service_package}/metrics.py` (top-level in the package).

---

## Related

- `03-observability/slos.md` — SLO targets that drive alert thresholds
- `03-observability/alerting.md` — alert routing rules
- Phase 3 plan: `obs-metrics-aggregator-api` (alerting-service GET /api/system/metrics)
- Phase 3 plan: `obs-prometheus-codex` (T6 Agent 10)
