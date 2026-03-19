# Dynamic Config Injection

**Last Updated:** 2026-03-06 **Status:** Production **Owner:** Platform Engineering

---

## Overview

Dynamic config injection enables runtime configuration changes (instruments, strategies, clients, venues) without
service redeployment. Config changes propagate to all live services in <10 seconds via cloud-agnostic pub/sub event
topics.

**What requires a redeploy:** Code changes only. **What does NOT require a redeploy:** Config value changes
(subscription lists, enabled venues, strategy parameters, client configs).

---

## Architecture

```
Config Writer (deployment-ui Config tab)
    ↓ POST /api/config-store/{domain}
deployment-api routes/config_management.py
    ↓ validate schema (Pydantic) + write versioned YAML
UCI get_storage_client() → GCS or S3
  {config-store bucket}/{domain}/schema-v{N}/config-v{timestamp}.yaml
  {config-store bucket}/{domain}/active.yaml  ← pointer updated
    ↓ publish event
UCI get_event_bus() → PubSub or SQS
  topic: config-domain-{domain}
  message: {domain, config_path, timestamp, updated_by}
    ↓ fan-out to ALL subscribing services
DomainConfigReloader (UTL) — per service, per domain
    ↓ download config bytes from cloud storage
UCI get_storage_client().download_bytes(bucket, path)
    ↓ parse YAML + validate Pydantic model
    ↓ call registered component callbacks
Service component restart hook (e.g. instrument_manager.sync(new_config))
```

---

## Domain Config Topics

| Domain        | Topic                       | Subscribing Services                                                  |
| ------------- | --------------------------- | --------------------------------------------------------------------- |
| `instruments` | `config-domain-instruments` | execution-service, strategy-service, instruments-service, market-data |
| `strategies`  | `config-domain-strategies`  | strategy-service, execution-service                                   |
| `clients`     | `config-domain-clients`     | execution-service, client-reporting-api                               |
| `venues`      | `config-domain-venues`      | execution-service, strategy-service                                   |

---

## Domain Config Schemas

All schemas live in `unified_config_interface.domain_configs` and extend `BaseConfig`.

### InstrumentDomainConfig

```python
from unified_config_interface import InstrumentDomainConfig

config = InstrumentDomainConfig(
    subscription_list=["BTC-PERP", "ETH-PERP", "SOL-PERP"],
    enabled_venues=["BINANCE-FUTURES", "OKX", "HYPERLIQUID"],
    categories=["cefi"],
)
```

### StrategyDomainConfig

```python
from unified_config_interface import StrategyDomainConfig

config = StrategyDomainConfig(
    enabled_strategies=["momentum-v2", "mean-reversion-v1"],
    strategy_params={
        "momentum-v2": {"lookback_bars": 20, "threshold": 0.002},
    },
)
```

### ClientDomainConfig

```python
from unified_config_interface import ClientDomainConfig

config = ClientDomainConfig(
    active_clients=["client-001", "client-002"],
    client_configs={
        "client-001": {"max_position_usd": 100000, "allowed_venues": ["BINANCE-FUTURES"]},
    },
)
```

### VenueDomainConfig

```python
from unified_config_interface import VenueDomainConfig

config = VenueDomainConfig(
    enabled_venues=["BINANCE-FUTURES", "OKX"],
    venue_configs={
        "BINANCE-FUTURES": {"maker_fee": 0.0002, "taker_fee": 0.0004},
    },
)
```

---

## Adding a New Domain

1. **Add schema** to `unified_config_interface/domain_configs.py`:

   ```python
   class RiskDomainConfig(BaseConfig):
       __config_schema_version__ = "1.0"
       domain: Literal["risk"] = "risk"
       max_drawdown_pct: float
       position_limits: dict[str, float]  # instrument → max notional
   ```

2. **Register in `VALID_DOMAINS`** in `domain_configs.py`:

   ```python
   VALID_DOMAINS: frozenset[str] = frozenset({"instruments", "strategies", "clients", "venues", "risk"})
   ```

3. **Add to `schema_for_domain()`** mapping in `domain_configs.py`.

4. **Update deployment-api** `VALID_DOMAINS` set and `DOMAIN_CONFIG_CLASSES` dict in `routes/config_management.py`.

5. **Wire `DomainConfigReloader`** in subscribing services (see Service Wiring Pattern below).

6. **Add topic row** to the domain config topics table above.

---

## Service Wiring Pattern

### Step 1: Add `config_store_bucket` to service config

```python
# my_service/config.py
from unified_config_interface import UnifiedCloudConfig
from pydantic import AliasChoices, Field

class MyServiceConfig(UnifiedCloudConfig):
    # ... existing fields ...
    config_store_bucket: str = Field(
        default="",
        validation_alias=AliasChoices("CONFIG_STORE_BUCKET"),
        description="Config store bucket for domain config hot-reload. "
                    "Set to empty string to disable hot-reload (e.g. local dev).",
    )
```

### Step 2: Create config_reloaders.py

```python
# my_service/config_reloaders.py
import logging
from unified_trading_library import DomainConfigReloader
from unified_config_interface import InstrumentDomainConfig

logger = logging.getLogger(__name__)

_instrument_reloader: DomainConfigReloader[InstrumentDomainConfig] | None = None


def _on_instruments_reload(config: InstrumentDomainConfig) -> None:
    logger.info(
        "Instruments config reloaded: %d instruments, %d venues",
        len(config.subscription_list),
        len(config.enabled_venues),
    )
    # TODO: update in-memory registry here


def start_domain_config_reloaders(service_config: MyServiceConfig) -> None:
    global _instrument_reloader
    if not service_config.config_store_bucket:
        logger.info("config_store_bucket not set — domain config hot-reload disabled")
        return
    _instrument_reloader = DomainConfigReloader(
        domain="instruments",
        config_class=InstrumentDomainConfig,
        config_bucket=service_config.config_store_bucket,
        project_id=service_config.gcp_project_id or None,
    )
    _instrument_reloader.on_reload(_on_instruments_reload)
    _instrument_reloader.start_watching()
    logger.info("Domain config reloaders started")


def stop_domain_config_reloaders() -> None:
    if _instrument_reloader is not None:
        _instrument_reloader.stop_watching()
    logger.info("Domain config reloaders stopped")
```

### Step 3: Wire into service lifecycle

```python
# FastAPI lifespan example
from contextlib import asynccontextmanager
from fastapi import FastAPI
from my_service.config_reloaders import start_domain_config_reloaders, stop_domain_config_reloaders

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_domain_config_reloaders(service_config)
    yield
    stop_domain_config_reloaders()

app = FastAPI(lifespan=lifespan)
```

---

## Writing Config (API)

All config writes go through `deployment-api`. Services MUST NOT write configs directly.

### Write new config version

```bash
curl -X POST https://deployment-api/api/config-store/instruments \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "subscription_list": ["BTC-PERP", "ETH-PERP"],
      "enabled_venues": ["BINANCE-FUTURES"],
      "categories": ["cefi"]
    },
    "updated_by": "ops-team"
  }'
```

### Read active config

```bash
curl https://deployment-api/api/config-store/instruments \
  -H "X-API-Key: $API_KEY"
```

### List versions

```bash
curl https://deployment-api/api/config-store/instruments/versions \
  -H "X-API-Key: $API_KEY"
```

### Diff two versions

```bash
curl "https://deployment-api/api/config-store/instruments/versions/20260306T120000Z/diff/20260306T130000Z" \
  -H "X-API-Key: $API_KEY"
```

### Rollback

```bash
curl -X POST "https://deployment-api/api/config-store/instruments/rollback/20260306T120000Z" \
  -H "X-API-Key: $API_KEY"
```

---

## UI Usage

Navigate to the **Config Store** tab in `deployment-ui`.

1. Select a domain (instruments / strategies / clients / venues) using the tab row
2. **Version History** panel (left): shows all saved versions newest-first with timestamps and `active` badge
3. **Config Viewer** panel (right): shows the selected version's JSON content
4. **Edit**: click Edit → modify JSON in dialog → Save (validates against Pydantic schema)
5. **Diff**: click two versions in history panel → "Diff Selected" to see unified diff
6. **Rollback**: click "Rollback" on any historical version to re-save it as the new active version

---

## Config Versioning

Every write creates a new immutable version:

```
{config-store bucket}/
  instruments/
    schema-v1.0/
      config-v20260306T120000Z.yaml    ← version 1
      config-v20260306T130000Z.yaml    ← version 2
      config-v20260306T140000Z.yaml    ← version 3 (active)
    active.yaml                        ← pointer → latest path
```

Full history is retained. Rollback re-saves an old version with a new timestamp (preserves audit trail).

---

## Batch Replay

For backtesting/batch jobs that need the config as it was at a specific time:

```python
from datetime import UTC, datetime
from unified_trading_library import ConfigReloader
from unified_config_interface import InstrumentDomainConfig

# Load config effective at 2026-01-15 10:00 UTC
config = ConfigReloader.replay_at(
    timestamp=datetime(2026, 1, 15, 10, 0, 0, tzinfo=UTC),
    config_class=InstrumentDomainConfig,
    service_name="instruments",
    bucket_name="config-store-my-project",
    project_id="my-project",
)
```

---

## Cloud-Agnostic Implementation

All cloud I/O uses `unified_cloud_interface` (UCI) abstractions:

| Operation            | UCI Call                                                            |
| -------------------- | ------------------------------------------------------------------- |
| Write config YAML    | `get_storage_client().upload_bytes(bucket, path, data)`             |
| Read config YAML     | `get_storage_client().download_bytes(bucket, path)`                 |
| Publish update event | `get_event_bus().publish(topic, data)`                              |
| Subscribe to updates | `get_queue_client().subscribe_streaming(topic, sub_name, callback)` |

GCP routing: GCS + PubSub. AWS routing: S3 + SQS. Local: filesystem + in-memory queue.

---

## Anti-Patterns

| Anti-Pattern                                                  | Why Banned                                | Correct Alternative                                      |
| ------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| `ConfigStore(bucket_name=..., service_name=...)` in services  | Bypasses factory, no bucket resolution    | `get_config_store(domain)`                               |
| `google.cloud.pubsub_v1` in service code                      | Cloud-specific, breaks AWS                | `get_queue_client()`                                     |
| Hardcoded instrument/strategy lists in Python                 | Cannot hot-reload                         | `DomainConfigReloader` with `InstrumentDomainConfig`     |
| Direct `subscribe_streaming` on `config-domain-*` in services | Bypasses DomainConfigReloader abstraction | `DomainConfigReloader.start_watching()`                  |
| `GCP_PROJECT_ID` env var                                      | Non-standard naming                       | `GCP_PROJECT_ID` via `UnifiedCloudConfig.gcp_project_id` |
| Config writes in service code                                 | No versioning, no audit trail             | `POST /api/config-store/{domain}`                        |

---

## Quality Gate

STEP 5.12 in all quality gate scripts checks for direct `ConfigStore()` construction:

```bash
# Fails if ConfigStore() found outside of persistence.py and test files
grep -r "ConfigStore(" "$SOURCE_DIR" --include="*.py" | grep -v "get_config_store\|TimeSeriesConfigStore\|test_\|conftest\|persistence\.py"
```
