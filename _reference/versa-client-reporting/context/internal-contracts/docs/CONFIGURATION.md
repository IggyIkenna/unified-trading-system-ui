# Configuration

`unified-internal-contracts` is a pure Pydantic schema library. It has no runtime
configuration, no environment variables, and no cloud SDK dependencies.

## No Runtime Config Required

This repo defines only types — `BaseModel` subclasses, `StrEnum` members, and typed
constants. There are no initialisation steps, no credentials, and no connection setup
required by the library itself.

Consuming services supply all runtime context (API keys, project IDs, topic names) via
their own config layer — typically `UnifiedCloudConfig` from `unified-config-interface`.
UIC does not read from `os.environ`, Secret Manager, or any external source.

## Consuming This Library

Add UIC as a path dependency in `pyproject.toml` of the consuming repo:

```toml
[tool.uv.sources]
unified-internal-contracts = { path = "../unified-internal-contracts", editable = true }

[project.dependencies]
unified-internal-contracts = "*"
```

Then install with:

```bash
uv pip install -e ".[dev]"
```

No additional environment setup is needed. UIC has a single runtime dependency: `pydantic>=2.12.5,<3.0.0`.

## Schema Versioning

Each Pydantic model that crosses a serialisation boundary carries a `schema_version` field
(default `"1.0.0"`). The canonical version table is in `schema_registry.json` at the
repo root. Consumers should validate `schema_version` when deserialising messages from
dead-letter queues or persisted event logs, where schema drift is possible.

## No Cloud Config

Unlike interface repos (e.g. `unified-market-interface`), UIC contains no:

- `GCP_PROJECT_ID` references
- Pub/Sub topic subscriptions
- Secret Manager lookups
- Cloud Storage bucket names

All of those live in the implementing library (`unified-trading-library`) or the
relevant interface repo. UIC provides only the schema contracts those components exchange.
