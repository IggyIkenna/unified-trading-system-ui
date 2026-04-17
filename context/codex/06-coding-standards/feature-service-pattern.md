# Feature Service Pattern

## Overview

`BaseFeatureServiceV2` (exported from `unified-feature-calculator-library`, Tier 2) is the mandatory abstract base class
for all `features-*-service` repos. It eliminates repeated boilerplate by providing:

- `UnifiedCloudConfig` singleton wiring (via `@lru_cache`)
- `GCSEventSink` setup and UEI lifecycle events (`STARTED` / `STOPPED`)
- `FeatureServiceMetrics` bundle (Prometheus `Counter` + `Histogram`) instantiated automatically
- FastAPI `/health` + `/readiness` router factory
- `correlation_id_var` `ContextVar` for request-level correlation ID propagation

Each service implements exactly one method — `compute_features()` — and removes all manually duplicated boilerplate.

---

## Extending BaseFeatureServiceV2

```python
from unified_feature_calculator.service_base import BaseFeatureServiceV2

class CalendarService(BaseFeatureServiceV2[CalendarRequest, CalendarResult]):
    """Concrete calendar feature service."""

    async def compute_features(self, payload: CalendarRequest) -> CalendarResult:
        start = time.monotonic()
        try:
            result = _compute(payload)
            self.metrics.records_processed.labels(
                service_name=self.service_name,
                feature_group="calendar",
                status="success",
            ).inc()
            return result
        finally:
            elapsed = time.monotonic() - start
            self.metrics.processing_latency.labels(
                service_name=self.service_name,
                feature_group="calendar",
            ).observe(elapsed)
```

Lifecycle wiring in FastAPI:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

svc = CalendarService(service_name="features-calendar-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await svc.startup()
    yield
    await svc.shutdown()

app = FastAPI(lifespan=lifespan)
app.include_router(svc.build_health_router())
```

---

## FeatureServiceMetrics Setup via build_feature_metrics()

`BaseFeatureServiceV2.__init__` calls `build_feature_metrics(service_name)` automatically and exposes the result as
`self.metrics`. Services should not call `build_feature_metrics()` directly unless constructing metrics outside the base
class (e.g. in standalone scripts or tests).

```python
from unified_feature_calculator.service_base import build_feature_metrics, FeatureServiceMetrics

# Only needed outside BaseFeatureServiceV2 context:
metrics: FeatureServiceMetrics = build_feature_metrics("features-calendar-service")
```

`FeatureServiceMetrics` is a frozen dataclass:

| Field                | Type        | Labels                                    |
| -------------------- | ----------- | ----------------------------------------- |
| `records_processed`  | `Counter`   | `service_name`, `feature_group`, `status` |
| `processing_latency` | `Histogram` | `service_name`, `feature_group`           |

`status` label values: `"success"` or `"error"`.

Histogram latency buckets (seconds): `0.005 0.01 0.025 0.05 0.1 0.25 0.5 1.0 2.5 5.0`.

---

## /health and /readiness Router Wiring via build_health_router()

`svc.build_health_router()` (convenience wrapper on the service instance) or the standalone factory
`build_health_router(service_name)` both return a `fastapi.APIRouter` tagged `observability`.

```python
from unified_feature_calculator.service_base import build_health_router

router = build_health_router("features-calendar-service")
app.include_router(router)
```

Route behaviour:

| Route        | Success body                                                                       | Failure body                                                 | HTTP code |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------- |
| `/health`    | `{"status": "ok", "service": "..."}` — always 200 while process runs               | —                                                            | 200       |
| `/readiness` | `{"status": "ready", "service": "...", "project_id": "...", "environment": "..."}` | `{"status": "not_ready", "service": "...", "detail": "..."}` | 200 / 503 |

`/readiness` internally calls `UnifiedCloudConfig` via the `lru_cache` singleton; returns 503 if config is not yet
loaded or raises.

Do not add manual `/health` or `/readiness` FastAPI route handlers in service code. Use this factory exclusively.

---

## correlation_id Propagation Pattern

`correlation_id_var` is a `ContextVar[str]` exported from `base_service.py`. Set it at the entry point of each request
or tick; reset it after the request completes.

```python
from unified_feature_calculator.service_base import correlation_id_var

async def handle_request(request: Request) -> Response:
    cid = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
    token = correlation_id_var.set(cid)
    try:
        return await process(request)
    finally:
        correlation_id_var.reset(token)
```

`BaseFeatureServiceV2.startup()` and `shutdown()` read `correlation_id_var` automatically when emitting `STARTED` /
`STOPPED` UEI lifecycle events. No manual `details={"correlation_id": ...}` argument is needed in service code.

---

## Prohibited Patterns

| Pattern                                                             | Reason                                                                    |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `os.getenv("PROJECT_ID")`                                           | Violates no-os-getenv rule — use `UnifiedCloudConfig`                     |
| `Any` type annotations                                              | Violates no-type-any rule — use TypeVar, TypedDict, or Protocol           |
| Manual `/health` endpoint in service code                           | Duplicates library-provided route — use `build_health_router()`           |
| Manual `/readiness` endpoint in service code                        | Same as above                                                             |
| Inline `Counter(...)` / `Histogram(...)` in service code            | Duplicates library-provided metrics — use `self.metrics`                  |
| `try/except ImportError` around `unified_feature_calculator` import | Violates no-empty-fallbacks rule — fail loud                              |
| `setup_events()` called directly in service code                    | Lifecycle managed by `BaseFeatureServiceV2.startup()` — do not call again |

---

## Tier Architecture Note

`unified-feature-calculator-library` is **Tier 2**. Its allowed upstream dependencies are:

| Tier | Libraries                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| T0   | `unified_trading_library.events` (UEI), `unified_market_interface` (UMI)                                           |
| T1   | `unified_config_interface` (UCI), `unified_trading_library` (UTL), `unified_reference_data_interface` (URDI) |

`BaseFeatureServiceV2` imports:

- `unified_config_interface.UnifiedCloudConfig` (T1/UCI)
- `unified_trading_library.events.{setup_events,log_event,close_events}` (T0/UEI)
- `unified_trading_library.GCSEventSink` (T1/UTL)

No Tier 2 → Tier 2 imports are permitted. No circular imports.

For the full dependency rule set, see `library-tier-architecture.mdc`.

---

## References

- Library source: `unified-feature-calculator-library/src/unified_feature_calculator/service_base/`
- Tier rules: `unified-trading-pm/cursor-rules/library-tier-architecture.mdc`
- Prometheus metrics standard: `unified-trading-codex/06-coding-standards/prometheus-metrics.md`
- Correlation ID standard: `unified-trading-codex/06-coding-standards/correlation-id.md`
- No-os-getenv rule: `.cursor/rules/no-type-any-use-specific.mdc`
- No-empty-fallbacks rule: `.cursor/rules/no-empty-fallbacks.mdc`
