# Correlation ID Propagation

## Overview

Every request flowing through the unified trading system carries a `correlation_id` that traces it end-to-end across
services, event bus messages, and storage writes. This enables log aggregation, distributed tracing, and incident
root-cause analysis without a service mesh.

---

## Format

- **Type**: UUIDv4 (128 bits, random)
- **String form**: lowercase hyphenated, e.g. `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`
- **Generation**: `import uuid; correlation_id = str(uuid.uuid4())`

Generated once at the API ingress point. Never regenerated mid-pipeline. Never truncated or hashed.

---

## Transport Headers

| Transport  | Field name                     | Notes                                           |
| ---------- | ------------------------------ | ----------------------------------------------- |
| HTTP       | `X-Correlation-ID`             | Present on every inbound and outbound request   |
| PubSub     | `correlation_id`               | In the message `attributes` dict (not the body) |
| GCS object | `x-goog-meta-correlation-id`   | Custom metadata on every written object         |
| BigQuery   | Column `correlation_id STRING` | In every row that supports it                   |

---

## Propagation Path

```
API ingress (generate if absent)
    │  X-Correlation-ID header
    ▼
Service A
    │  passes to EventBus publish as PubSub attribute
    ▼
EventBus (PubSub)
    │  attributes["correlation_id"] preserved by PubSub
    ▼
Service B (consumer)
    │  reads from PubSub attributes, adds to log context
    ▼
Storage (GCS / BigQuery)
    │  written as metadata / column
    ▼
API response
    │  X-Correlation-ID echoed back in response headers
    ▼
Client
```

The chain must be unbroken. Any service that drops the `correlation_id` creates an invisible gap in the audit trail.

---

## HTTP Ingress: Generate or Forward

```python
import uuid
from fastapi import Request

def get_or_create_correlation_id(request: Request) -> str:
    return request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
```

Attach to all outgoing HTTP calls:

```python
headers = {"X-Correlation-ID": correlation_id, "Authorization": f"Bearer {token}"}
response = await client.post(url, headers=headers, json=payload)
```

---

## PubSub: Attributes Dict

```python
# Publishing
future = publisher.publish(
    topic_path,
    data=message_bytes,
    correlation_id=correlation_id,   # PubSub attribute — NOT in data body
    event_type="TRADE_REPORTED_MIFID",
)

# Consuming
correlation_id = message.attributes.get("correlation_id", "")
```

The `correlation_id` lives in `attributes`, not in the JSON body. This keeps the schema clean and allows Pub/Sub filters
to route on it.

---

## Logging Context

Every log statement in a request-handling code path must include `correlation_id` in its structured fields:

```python
import structlog

log = structlog.get_logger()

log.info(
    "order.submitted",
    correlation_id=correlation_id,
    order_id=order.id,
    venue=order.venue,
)
```

When using `log_event()` from `unified_trading_library.events`, pass `correlation_id` in the `details` dict:

```python
from unified_trading_library.events import log_event

log_event(
    event_type=ORDER_SUBMITTED_MIFID,
    details={
        "order_id": order.id,
        "correlation_id": correlation_id,
    },
)
```

---

## Rules

- API ingress generates a `correlation_id` if the inbound request does not provide one.
- Every service that receives a `correlation_id` (HTTP or PubSub) must forward it to all outbound calls.
- Never generate a new `correlation_id` inside a service mid-pipeline — only ingress creates it.
- `correlation_id` must be logged on every `INFO` and above log statement in a request path.
- Missing `correlation_id` in a service-to-service call is a bug — treat it as a test failure.
- GCS writes that belong to a request context must tag the object with `x-goog-meta-correlation-id`.

---

## Related

- `03-observability/lifecycle-events.md` — lifecycle events carry `correlation_id` in details
- `07-security/compliance.md` — compliance events should include `correlation_id` for audit linkage
- `07-security/audit-logging.md` — audit log schema includes `correlation_id`
- Phase 3 plan: `obs-correlation-id-propagation` (end-to-end correlation_id)
