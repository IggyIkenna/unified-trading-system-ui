# Cloud Mode Indicator Pattern

How to add `cloud_provider` and `mock_mode` to health endpoint responses.

## Why

Every service should expose its runtime environment in `/health` so operators can instantly tell:

- Which cloud provider the service is targeting (gcp, aws, local)
- Whether mock mode is active (true = no live cloud calls)

This prevents the "is this service pointing at prod or mock?" debugging scenario.

## How (for FastAPI services using UTL health_router)

The `make_health_router` in `unified-trading-library/unified_trading_library/core/health_router.py` accepts
`cloud_provider` and `mock_mode` parameters. Pass them from `UnifiedCloudConfig`:

```python
from unified_config_interface import UnifiedCloudConfig
from unified_trading_library.core.health_router import make_health_router

cfg = UnifiedCloudConfig()

router = make_health_router(
    service_name="my-service",
    version="0.1.0",
    cloud_provider=cfg.cloud_provider,
    mock_mode=cfg.cloud_mock_mode,
    health_checks={"config": _check_config},
)
app.include_router(router)
```

The `/health` response will include:

```json
{
  "status": "ok",
  "service": "my-service",
  "version": "0.1.0",
  "cloud_provider": "local",
  "mock_mode": true,
  "checks": { "config": "ok" }
}
```

## For batch/CLI services (no FastAPI)

Batch services like instruments-service run as CLI tools, not web servers. Add cloud mode to their CLI output/logging
instead:

```python
from unified_config_interface import UnifiedCloudConfig

cfg = UnifiedCloudConfig()
logger.info(
    "Service startup: cloud_provider=%s mock_mode=%s",
    cfg.cloud_provider,
    cfg.cloud_mock_mode,
)
```

For the CLI result dict, include environment info:

```python
result = {
    "status": "success",
    "cloud_provider": cfg.cloud_provider,
    "mock_mode": cfg.cloud_mock_mode,
    ...
}
```

## Canary: instruments-service

instruments-service was the first service to adopt this pattern (batch/CLI variant). See
`instruments_service/cli/main.py` for the implementation.

## Rollout checklist

Services that should adopt this pattern (FastAPI variant):

- execution-service
- risk-and-exposure-service
- position-balance-monitor-service
- alerting-service
- market-data-api
- ml-inference-api
- ml-training-api
- execution-results-api
- deployment-api
