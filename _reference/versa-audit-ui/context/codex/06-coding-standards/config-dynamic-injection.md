# Config Dynamic Injection Standard

**Last Updated:** 2026-03-08 **Status:** Production **Owner:** Platform Engineering **SSOT:**
`unified-trading-codex/08-workflows/config-injection.md` (architecture detail)

---

## What is Dynamic Config Injection?

Dynamic config injection is the pattern by which runtime configuration changes (instrument lists, strategy parameters,
client configs, venue settings) propagate to live services **without redeployment**.

Key invariant:

- **Code changes** (new algorithms, new adapters, new endpoints) → require redeploy
- **Config changes** (subscription lists, thresholds, enabled venues, strategy params) → hot-reload via
  DomainConfigReloader

---

## UnifiedCloudConfig — The Only Config Source

Services MUST source all config from `UnifiedCloudConfig` via field-validated Pydantic models.

```python
# CORRECT: config field on UnifiedCloudConfig subclass
from unified_cloud_interface import UnifiedCloudConfig
from pydantic import AliasChoices, Field

class MyServiceConfig(UnifiedCloudConfig):
    config_store_bucket: str = Field(
        default="",
        validation_alias=AliasChoices("CONFIG_STORE_BUCKET"),
        description="Config store bucket for domain config hot-reload.",
    )
```

```python
# WRONG: never call os.getenv() in service code
import os
bucket = os.getenv("CONFIG_STORE_BUCKET", "")  # BANNED
```

---

## lru_cache Singleton Pattern

When a service module needs to access `UnifiedCloudConfig` at module level or from multiple call sites, use an
`@lru_cache(maxsize=1)` singleton rather than constructing a new instance each time.

```python
from functools import lru_cache
from unified_cloud_interface import UnifiedCloudConfig

@lru_cache(maxsize=1)
def _get_config() -> UnifiedCloudConfig:
    return UnifiedCloudConfig()
```

This prevents multiple uncoordinated reads of env vars and ensures a single validated instance per process.

---

## DomainConfigReloader — Hot-Reload Pattern

Use `DomainConfigReloader` from `unified_trading_library` to subscribe a service to a config domain topic and receive
hot-reloaded config without restarting.

```python
from unified_trading_library import DomainConfigReloader
from unified_config_interface import InstrumentDomainConfig

reloader: DomainConfigReloader[InstrumentDomainConfig] = DomainConfigReloader(
    domain="instruments",
    config_class=InstrumentDomainConfig,
    config_bucket=service_config.config_store_bucket,
    project_id=service_config.gcp_project_id or None,
)
reloader.on_reload(lambda cfg: instrument_manager.sync(cfg))
reloader.start_watching()
```

Full wiring guide: `unified-trading-codex/08-workflows/config-injection.md` — Service Wiring Pattern.

---

## get_config_store() Factory

Config store access MUST go through the `get_config_store()` factory from `unified_cloud_interface`. Direct
`ConfigStore()` construction is banned.

```python
# CORRECT
from unified_cloud_interface import get_config_store
store = get_config_store(domain="instruments")

# WRONG — direct construction bypasses factory and bucket resolution
from unified_config_interface import ConfigStore
store = ConfigStore(bucket_name="...", service_name="...")  # BANNED
```

---

## No os.getenv()

`os.getenv()` is banned in all production service and library code. The only valid config source is `UnifiedCloudConfig`
subclasses (Pydantic field declarations with `AliasChoices`).

Exceptions (must be documented with `# config-bootstrap:` comment):

- UCI `factory.py` bootstrap (reads `CLOUD_PROVIDER` to initialize the factory itself)
- OTEL standard env vars in tracing bootstrap (`OTEL_EXPORTER_OTLP_ENDPOINT`, etc.)

---

## Anti-Patterns

| Anti-Pattern                                              | Why Banned                    | Correct Alternative                                  |
| --------------------------------------------------------- | ----------------------------- | ---------------------------------------------------- |
| `os.getenv("CONFIG_STORE_BUCKET")`                        | Bypasses Pydantic validation  | `UnifiedCloudConfig.config_store_bucket` field       |
| `ConfigStore(bucket_name=...)`                            | Bypasses factory              | `get_config_store(domain)`                           |
| Hardcoded instrument/strategy lists in Python             | Cannot hot-reload             | `DomainConfigReloader` with `InstrumentDomainConfig` |
| `google.cloud.pubsub_v1` in service code                  | Cloud-specific, breaks AWS    | `get_queue_client()`                                 |
| Config writes in service code                             | No versioning, no audit trail | `POST /api/config-store/{domain}` via deployment-api |
| Direct `UnifiedCloudConfig()` at import time (not cached) | Multiple instances, wasteful  | `@lru_cache(maxsize=1)` singleton accessor           |

---

## Quality Gate Enforcement

STEP 5.12 in all quality gate scripts blocks direct `ConfigStore()` construction:

```bash
# Fails if ConfigStore() found outside persistence.py and test files
grep -r "ConfigStore(" "$SOURCE_DIR" --include="*.py" \
  | grep -v "get_config_store\|TimeSeriesConfigStore\|test_\|conftest\|persistence\.py"
```

Additionally, `os.getenv` is blocked in all non-UCI source files by STEP 5.x os.getenv scan.

---

## See Also

- Full architecture: `unified-trading-codex/08-workflows/config-injection.md`
- Cursor rule: `cursor-rules/config/dynamic-config-injection.mdc`
- Domain schemas: `unified_config_interface.domain_configs` (InstrumentDomainConfig, StrategyDomainConfig, etc.)
- Audit check: `trading_system_audit_prompt.plan.md` § `audit-config-injection`
