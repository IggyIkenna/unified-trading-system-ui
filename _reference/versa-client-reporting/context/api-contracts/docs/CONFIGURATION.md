# Configuration

Environment and config for consumers of unified-api-contracts.

## Consumers (UMI / UOI / services)

- Use **path dependency** `../unified-api-contracts` (see workspace path-dependency-ci and [README — Consuming from UMI / UOI](../README.md#consuming-from-umi--uoi)).
- No package-specific env vars required for import; config is in the consuming service (e.g. `UnifiedCloudConfig`, API keys via Secret Manager).

## This repo (AC only)

- **No API keys or live verification in AC.** Quality gates run schema and example validation only; no collection or VCR recording. **Live validation and VCR recording** are done in the six interfaces (they hold API keys).
- **`GCP_PROJECT_ID`** — Not required for AC quality gates (replay-only tests).

See [CONTRIBUTING.md](../CONTRIBUTING.md) and [docs/API_CONTRACTS_CHAIN_OF_EVENTS.md](API_CONTRACTS_CHAIN_OF_EVENTS.md) for the full chain (config → SDK → schema validation → adapter output).

---

## Path Dependency Setup

Consuming repos declare UAC as a path dependency so CI and local development resolve the same source tree
without a published package. Add the following to the consuming service's `pyproject.toml`:

```toml
[project.dependencies]
unified-api-contracts = "*"

[tool.uv.sources]
unified-api-contracts = { path = "../unified-api-contracts", editable = true }
```

Then install with:

```bash
uv pip install -e ".[dev]"
```

The `editable = true` flag means schema changes in UAC are visible immediately without reinstalling.
CI clones both repos side-by-side (ensured by the workspace manifest), so the relative path
`../unified-api-contracts` resolves correctly in all environments.

---

## The Six Interface Repos

UAC defines the canonical schemas. Each interface repo wraps an external provider or internal
boundary and owns VCR cassettes + live API keys. The interfaces are:

| Interface repo                       | Purpose                                           |
| ------------------------------------ | ------------------------------------------------- |
| `unified-market-interface`           | Spot/perp OHLCV, order book, trades (CEX + DEX)   |
| `unified-trade-execution-interface`  | Order placement and lifecycle management          |
| `unified-sports-execution-interface` | Sports bet placement and settlement               |
| `unified-reference-data-interface`   | Instrument universe, metadata, exchange calendars |
| `unified-position-interface`         | Position tracking, portfolio state, P&L           |
| `unified-cloud-interface`            | GCS / BigQuery / PubSub intent-API abstractions   |

Each interface holds its own API keys in Secret Manager and records VCR cassettes against live
endpoints. AC only replays those cassettes — it never makes live requests.

---

## Config Chain

The following env vars are used by consuming services (not UAC itself):

| Variable         | Where set                    | Description                                       |
| ---------------- | ---------------------------- | ------------------------------------------------- |
| `GCP_PROJECT_ID` | Cloud Run env / `.env.local` | GCP project; passed to `UnifiedCloudConfig`       |
| `ENVIRONMENT`    | Cloud Run env / `.env.local` | `development` / `staging` / `production`          |
| `GCP_SECRET_*`   | Secret Manager (IAM-gated)   | API keys for exchanges; loaded at startup via UCI |

Services access secrets through `UnifiedCloudConfig` (from `unified-cloud-interface`), never via
`os.getenv()` directly. This ensures secrets are audited and rotated in one place.

---

## Schema Versioning

UAC follows semantic versioning. When schemas change:

1. Bump the UAC version in `pyproject.toml` (patch for additive fields, minor for new venues, major
   for breaking schema changes).
2. Each consuming interface pins the new UAC version in its own `pyproject.toml`.
3. The version cascade pipeline propagates the bump downstream: interface → service → ML.

Downstream repos that pin `unified-api-contracts = "*"` via path dependency always resolve the
workspace-local source, so pinning in those repos is not required during development. In CI the
manifest enforces that the declared version in each consuming repo matches the UAC tag being tested.
