# Config Reloader Pattern

## When to Use

| Class                       | Use When                                                   |
| --------------------------- | ---------------------------------------------------------- |
| `ConfigReloader`            | Simple key/value config from PubSub `config-updates` topic |
| `DomainConfigReloader`      | Domain-typed config with schema validation                 |
| Static `UnifiedCloudConfig` | Bootstrap / one-time read at startup                       |

## Required: CONFIG_LOADED on Init

Every service using `ConfigReloader` or `DomainConfigReloader` must receive a `CONFIG_LOADED` event on initialisation.
This is emitted automatically by UTL since version 0.3.151.

## Batch Pattern: replay_at(timestamp)

For batch pipeline workers that need to load config as-of a specific date:

```python
reloader = ConfigReloader(config_class=MyConfig, service_name="my-service", callback=..., project_id=...)
cfg = ConfigReloader.replay_at(
    timestamp=datetime(2026, 3, 10, tzinfo=UTC),
    config_class=MyConfig,
    service_name="my-service",
    bucket_name="config-store-my-project",
)
```

## Live Pattern: subscribe to CONFIG_CHANGED

Long-running services receive `CONFIG_CHANGED` events when config is updated. The `ConfigReloader` handles this
automatically via PubSub subscription:

```python
reloader = ConfigReloader(
    config_class=MyConfig,
    service_name="my-service",
    callback=on_config_change,
    project_id=cfg.gcp_project_id,
    config_file="gs://config-bucket/my-service.yaml",
)
reloader.start_watching()
```

## Rules

1. `CONFIG_LOADED` must fire on `__init__()` (enforced by UTL since 0.3.151)
2. `CONFIG_CHANGED` fires on every live reload (handled by `ConfigReloader._on_message_bytes`)
3. Never read raw env vars for domain config — use `ConfigReloader` or `DomainConfigReloader`
4. `replay_at(timestamp)` is the canonical pattern for batch workers needing historical config
5. Pass `project_id` explicitly — do not rely on env fallback in production code
