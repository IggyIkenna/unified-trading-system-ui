# OpenTelemetry Tracing

## When to Use Tracing

Every service that processes requests, executes trades, or runs batch pipelines should enable distributed tracing.
Tracing provides:

- **Request flow visibility** across service boundaries (e.g. order placement through execution-service,
  risk-and-exposure-service, alerting-service).
- **Latency breakdown** per span, so you can identify slow database calls, venue API round-trips, or serialisation
  bottlenecks.
- **Error attribution** — exceptions recorded on spans propagate context upstream.

Enable tracing in all production and staging deployments. Disable only in unit-test and local-dev modes via
`TRACING_ENABLED=false`.

## Canonical Setup

Use `setup_service_observability()` from `unified-trading-library`. This single call wires events, tracing, and the
memory watchdog:

```python
from unified_trading_library.core.observability import setup_service_observability

setup_service_observability(
    "my-service",
    mode="live",          # "batch" for CLI workers, "live" for servers
    sink=event_sink,      # EventSink instance (None only in local/test)
    enable_tracing=True,  # default
)
```

Under the hood this calls `setup_tracing()` from `unified_trading_library.utils.tracing`, which configures a
`TracerProvider` with `BatchSpanProcessor` and `OTLPSpanExporter`. The call is idempotent.

**Do NOT:**

- Create custom `otel_setup.py` files in your service.
- Instantiate `TracerProvider` directly.
- Call `trace.set_tracer_provider()` yourself.
- Use `try/except ImportError` around OTel imports — if deps are missing, `setup_tracing()` degrades gracefully and logs
  a warning.

## Adding Manual Spans

After observability is initialised, obtain a tracer and create spans:

```python
from unified_trading_library.utils.tracing import get_tracer

tracer = get_tracer("execution_service.engine")

with tracer.start_as_current_span("process_order") as span:
    span.set_attribute("order.client_id", client_id)
    span.set_attribute("order.venue", venue)
    span.set_attribute("order.side", side.value)
    result = execute(order)
```

Guidelines for manual spans:

- Use **dot-separated** instrumentation scope names matching the Python package path (e.g.
  `risk_and_exposure_service.calculator`).
- Set semantic attributes (`order.*`, `venue.*`, `instrument.*`) — avoid dumping full payloads.
- Call `span.record_exception(exc)` in error paths before re-raising.
- Keep span names short and stable (no dynamic IDs) — they become metric cardinality dimensions.

When `TRACING_ENABLED=false` or the OTel SDK is not installed, `get_tracer()` returns a `_NoOpTracer` that silently
drops all span operations, so instrumented code runs without overhead.

## Environment Variables

| Variable                      | Purpose                                                     | Default                 |
| ----------------------------- | ----------------------------------------------------------- | ----------------------- |
| `TRACING_ENABLED`             | Master switch. Set `"false"` to disable all tracing.        | `"true"`                |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP gRPC collector endpoint.                               | `http://localhost:4317` |
| `OTEL_SERVICE_NAME`           | Overrides the `service_name` argument to `setup_tracing()`. | (function arg)          |
| `OTEL_TRACES_SAMPLER`         | Sampler type: `always_on`, `always_off`, `traceidratio`.    | SDK default             |
| `OTEL_TRACES_SAMPLER_ARG`     | Sample ratio when using `traceidratio` (0.0 - 1.0).         | `1.0`                   |

These are standard OpenTelemetry environment variables. They are read during bootstrap before `UnifiedCloudConfig` is
available, so they use `get_env_var()` from the UTL env-bootstrap module (this is an approved config-bootstrap
exception).

## Collector Setup (Cloud Run Sidecar)

On Cloud Run, the OpenTelemetry Collector runs as a sidecar container listening on `localhost:4317` (gRPC). The
collector forwards traces to Google Cloud Trace.

Cloud Run service YAML excerpt:

```yaml
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/container-dependencies: '{"app":["otel-collector"]}'
    spec:
      containers:
        - name: app
          # ... service container
          env:
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: "http://localhost:4317"
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:latest
          ports:
            - containerPort: 4317
```

For local development, either:

- Set `TRACING_ENABLED=false` (recommended for unit tests).
- Run a local collector: `docker run -p 4317:4317 otel/opentelemetry-collector-contrib:latest`.

## Auto-Instrumentation

UTL's `setup_tracing()` configures the core SDK. The following auto-instrumentation libraries are available and should
be declared in each service's `pyproject.toml`:

| Library                                        | What it traces                            |
| ---------------------------------------------- | ----------------------------------------- |
| `opentelemetry-instrumentation-fastapi`        | Inbound HTTP requests (FastAPI/Starlette) |
| `opentelemetry-instrumentation-requests`       | Outbound HTTP via `requests`              |
| `opentelemetry-instrumentation-aiohttp-client` | Outbound HTTP via `aiohttp`               |

FastAPI instrumentation is activated automatically when `opentelemetry-instrumentation-fastapi` is installed and a
`TracerProvider` is set. No manual `Instrumentor().instrument()` call is needed in service code.

## Required Dependencies

Every service that enables tracing must include these in `pyproject.toml` under `[project.dependencies]` (flat deps
only, no optional groups):

```toml
[project.dependencies]
# ... other deps
"opentelemetry-api>=1.27.0,<2.0.0",
"opentelemetry-sdk>=1.27.0,<2.0.0",
"opentelemetry-exporter-otlp-proto-grpc>=1.27.0,<2.0.0",
"opentelemetry-instrumentation-fastapi>=0.48b0,<1.0.0",
```

Services get these transitively through `unified-trading-library`, but explicit pinning ensures version alignment and
makes the dependency visible.

## Reference Files

- **Tracing setup + helpers:** `unified-trading-library/unified_trading_library/utils/tracing.py`
- **Observability bootstrap:** `unified-trading-library/unified_trading_library/core/observability.py`
- **Env bootstrap (config-bootstrap exception):**
  `unified-trading-library/unified_trading_library/core/_env_bootstrap.py`
