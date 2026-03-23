# context/ — Backend Reference Material for Agents

The `context/` folder is **not** React context files. It contains read-only reference material from the backend system — API contracts, internal schemas, configuration registry, and project management artefacts. It exists so agents working on the UI can understand the backend without accessing other repos.

**Do not modify files in `context/`.** They are snapshots synced from source repos. Edits belong in the source repos listed at the bottom of this document.

---

## When to Use This Folder

Before building any UI feature that:
- calls a backend API → read `context/api-contracts/openapi/`
- displays typed data → read `context/api-contracts/canonical-schemas/`
- needs to know what backend config fields exist → read `context/api-contracts/openapi/config-registry.json`
- touches data partitioning (shards, venues) → read `context/SHARDING_DIMENSIONS.md`
- might depend on an unbuilt API → read `context/API_FRONTEND_GAPS.md`
- needs to understand the full service topology → read `context/pm/TOPOLOGY-DAG.md`

---

## Folder Structure

```
context/
├── CONTEXT_GUIDE.md                 How to use this folder (detailed checklist)
├── AGENT_UI_STRUCTURE.md            Platform vision and role model document
├── CONFIG_REFERENCE.md              Guide to backend service configuration
├── SHARDING_DIMENSIONS.md           How data is partitioned by shard / venue
├── API_FRONTEND_GAPS.md             Known gaps between what the UI needs and what APIs provide
│
├── api-contracts/                   External API schemas and specs (source: unified-api-contracts)
│   ├── docs/                        Human-readable: venue matrix, schema audit, architecture
│   ├── openapi/                     OpenAPI 3.0 YAML specs — one per API service
│   │   └── config-registry.json     Machine-readable catalogue of every service config field
│   ├── canonical-schemas/           Pydantic models: CanonicalTrade, CanonicalPosition, etc.
│   └── facades/                     Top-level domain facades (market.py, execution.py, ...)
│
├── internal-contracts/              Internal service-to-service types (source: unified-internal-contracts)
│   ├── docs/                        Schema changelog, architecture, adoption matrix
│   ├── schemas/                     Python type files: events, positions, execution, features
│   │   └── domain/                  Per-service schemas: execution_service/, risk_service/, ...
│   └── schema_registry.json         Machine-readable index of every schema type
│
├── codex/                           Coding standards and architecture docs (source: unified-trading-codex)
│
└── pm/                              Project management artefacts (source: unified-trading-pm)
    ├── docs/                        Dev environment, CI/CD, cloud mode patterns
    ├── plans-active/                Current active work plans
    ├── data-flow-manifest.json      service → API → UI mapping for every data domain
    ├── TOPOLOGY-DAG.md              Full system Mermaid diagram (T0–T3 tiers, all services)
    └── workspace-manifest.json      Repo list, versions, tier membership, shard model
```

---

## Key Files — What They Tell You

### AGENT_UI_STRUCTURE.md
The platform vision document. Read this to understand:
- What the platform is (not a SaaS dashboard — an institutional trading system)
- The three experience modes: public / client / internal
- The 8 service areas and which ones are internal-only
- The role model: organisation-first, service-entitlement driven
- The lifecycle model: Design → Simulate → Promote → Run → Monitor → Explain → Reconcile
- The design doctrine: dark, institutional, premium, operator-grade

### CONFIG_REFERENCE.md
Step-by-step guide to finding what backend configuration fields exist. Use this before building any config UI panel — it tells you what fields are real and what their types are.

### SHARDING_DIMENSIONS.md
Explains how data is partitioned:
- Shards: CEFI, DeFi, Sports, TradFi
- Data is always: shard → venue → instrument
- Per-shard config and resource limits
- How to build shard-aware filters and selectors

### API_FRONTEND_GAPS.md
A living document of known API/UI mismatches. Status codes:
- 🔴 BLOCKED — API does not exist yet, do not build the UI feature
- 🟡 IN PROGRESS — API being built, plan the feature but don't start
- 🟢 AVAILABLE — API exists, safe to build

Check this before starting any new feature to avoid building against a non-existent API.

---

## api-contracts/ — What APIs Return

### openapi/
OpenAPI 3.0 YAML specs. One file per API service. These define:
- Endpoint paths and HTTP methods
- Request parameters and body schemas
- Response shapes and status codes

To find the API spec for a domain: `api-contracts/openapi/<service-name>-api.yaml`

Examples:
- `execution-results-api.yaml` — execution fills, TCA, venue data
- `client-reporting-api.yaml` — portfolio performance, P&L, statements
- `deployment-api.yaml` — service health, deployment triggers

### openapi/config-registry.json
Machine-readable. Contains every backend service's config class with:
- Field names and types
- Required vs optional
- Default values
- Validation rules

Use this before building any configuration UI panel. Search by service name (e.g. `"execution-service"`, `"risk-and-exposure-service"`).

### canonical-schemas/
Pydantic model files. These are the ground-truth data shapes for everything the API returns. The canonical types are what all venues and data sources normalise to before being sent to the UI.

Key types:
- `CanonicalTrade` — normalised trade record
- `CanonicalFill` — normalised fill record
- `CanonicalPosition` — position record
- `CanonicalOrderBook` — order book snapshot
- `CanonicalTicker` — ticker data
- `CanonicalOhlcvBar` — OHLCV candle

---

## internal-contracts/ — How Services Talk to Each Other

### schemas/events.py
Every event type on the internal event bus. Use this if the UI needs to display system events or audit logs.

### schemas/domain/
Per-service schemas. Each folder is one backend service. Read these if you need to understand what a specific service emits (e.g. `execution_service/output.py` — what execution events look like).

### schema_registry.json
Machine-readable index. Maps schema class names to their file paths. Use this to quickly find where a type is defined.

---

## pm/ — Project and System State

### data-flow-manifest.json
Answers: "for domain X, which service produces the data, which API serves it, and which UI renders it?"

Entry format:
```json
{
  "id": "execution",
  "domain": "execution",
  "mode": "live",
  "service": "execution-service",
  "data_source": "pubsub",
  "api": "execution-results-api",
  "ui": "unified-trading-system-ui"
}
```

### TOPOLOGY-DAG.md
Full Mermaid diagram showing all repos, their tier levels (T0–T3), and dependency edges. Read this to understand which service a given API sits behind.

### workspace-manifest.json
The canonical repo registry. Lists all repos, their current versions, tier membership, and dependencies. Also contains shard definitions that the UI's shard-related filters should match.

### plans-active/
Current active work plans from the project management repo. Read these to understand what is being built right now and avoid duplicating planned work.

---

## Key Terms (from context/CONTEXT_GUIDE.md)

| Term | Meaning |
|---|---|
| UAC | Unified API Contracts — normalised schemas for external data |
| UIC | Unified Internal Contracts — internal service-to-service types |
| Canonical | A normalised schema that all venues map to before reaching the UI |
| T0–T3 | Library dependency tiers (T0 = pure leaf with no dependencies, T3 = service layer) |
| Shard | A single-venue processing slice within a service |
| HWM | High-water mark — baseline for performance fee calculation |
| VCR cassette | Recorded HTTP response used in tests |
| Mock mode | `NEXT_PUBLIC_MOCK_API=true` — no real backend needed |
| Pub/Sub | Google Cloud Pub/Sub — live event bus between services |
| GCS | Google Cloud Storage — batch data store between services |

---

## Source Repos (do not edit files here)

| context/ subfolder | Source repo |
|---|---|
| `api-contracts/` | `unified-trading-system-repos/unified-api-contracts` |
| `internal-contracts/` | `unified-trading-system-repos/unified-internal-contracts` |
| `codex/` (if present) | `unified-trading-system-repos/unified-trading-codex` |
| `pm/` | `unified-trading-system-repos/unified-trading-pm` |

If you find something wrong or outdated, fix it in the source repo and re-sync. Do not edit `context/` directly.
