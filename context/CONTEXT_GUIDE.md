# System Context Guide for Unified Trading System UI

This `context/` folder contains reference material from the Unified Trading System backend.
This guide explains what is in each folder, when to use it, and how to understand backend configuration, API surface, and data flows.

---

## Folder Map

```
context/
├── CONTEXT_GUIDE.md                  ← you are here
├── AGENT_UI_STRUCTURE.md             ← first-pass implementation prompt for UI refactor
│
├── CONFIG_REFERENCE.md               ★ START HERE for backend configuration
├── SHARDING_DIMENSIONS.md            ★ START HERE for data partitioning model
├── API_FRONTEND_GAPS.md              ★ START HERE for known API/UI misalignments
│
├── codex/                            ← architecture standards, domain glossary, coding rules
├── api-contracts/                    ← external/normalised data schemas (what APIs return to UIs)
│   ├── docs/                         ← human-readable: venue matrix, schema audit, architecture
│   ├── openapi/                      ← OpenAPI 3.0 specs — the API surface UIs call
│   │   └── config-registry.json      ← CRITICAL: every service config class, all fields + types
│   ├── canonical-schemas/            ← Pydantic models: CanonicalTrade, CanonicalPosition, etc.
│   └── facades/                      ← top-level domain facades (market.py, execution.py, …)
├── internal-contracts/               ← internal service-to-service data types
│   ├── docs/                         ← schema changelog, architecture, adoption matrix
│   ├── schemas/                      ← Python types: events, positions, execution, features, …
│   │   └── domain/                   ← per-service schemas (execution_service/, risk_service/, …)
│   └── schema_registry.json          ← machine-readable index of every schema type
└── pm/
    ├── docs/                         ← dev environment, CI/CD, cloud mode patterns, handover notes
    ├── plans-active/                 ← current active work plans (what is being built right now)
    ├── data-flow-manifest.json       ← service → API → UI mapping for every data domain
    ├── TOPOLOGY-DAG.md               ← full system Mermaid diagram (T0–T3 tiers, all services)
    └── workspace-manifest.json       ← canonical repo list, versions, tier membership, sharding model
```

**★ NEW: Configuration & Sharding Guides** — Start with these three documents if you're building UI features that depend on backend configuration or data availability.

---

## Essential Reading for UI Builders

### Configuration & Sharding (READ FIRST)

**Before building any UI feature**, understand what configuration actually exists and how data is partitioned:

#### 1. **`CONFIG_REFERENCE.md`** — What can be configured?

Where to find backend configurations, what fields exist, how they map to UI controls.

- Find config for any service (execution, risk, strategy, etc.)
- Understand types, defaults, required fields
- Learn how to build config UI panels without guessing
- Know when to regenerate `config-registry.json`

**Key artifact:** `api-contracts/openapi/config-registry.json` — machine-readable catalogue of every service's config fields.

#### 2. **`SHARDING_DIMENSIONS.md`** — How is data partitioned?

Understand how data is split across domains (CEFI, DeFi, Sports, TradFi) and venues (BINANCE, KRAKEN, UNISWAP, etc.).

- Know which data belongs to which shard
- Understand shard-level failure isolation
- Build shard-aware UIs (selector, filters, badges)
- Avoid mixing data across incompatible shards
- See per-shard configuration and resource limits

**Key insight:** Data is **always** partitioned by shard → venue → instrument. Never ignore shard.

#### 3. **`API_FRONTEND_GAPS.md`** — What's missing?

A living document of what the UI needs but the APIs don't yet provide.

- Don't build features that require 🔴 blocked APIs
- Plan deferred features that depend on 🟡 in-progress APIs
- Understand known API/UI misalignments (status terminology, price formats, etc.)
- Add discoveries as you build

---

### System Architecture (READ SECOND)

#### 4. **`pm/TOPOLOGY-DAG.md`**

The full system map as a Mermaid diagram. Shows every repo, how they depend on each other (T0→T1→T2→T3), which
services talk to which APIs, and which UIs consume which APIs. Use this to understand where any given repo sits in
the system.

#### 5. **`pm/data-flow-manifest.json`**

A compact JSON that answers the question "for domain X, which backend service produces the data, which API serves
it, and which UI renders it?" One entry per data domain (execution, risk, features, etc.).

Example entry:

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

#### 6. **`codex/04-architecture/data-flow-map.md`**

Prose explanation of how data moves through the pipeline: market data ingestion → feature calculation → strategy
→ execution → reporting. Read this before reading any schema files.

---

## Before You Start Building a Feature

Follow this checklist every time:

### Step 1: Understand Data Partitioning (5 min)

- [ ] Read [`SHARDING_DIMENSIONS.md`](./SHARDING_DIMENSIONS.md) → Identify which shard(s) your feature belongs to
- [ ] Check: Is this feature per-shard? Per-venue? Multi-shard?
- [ ] Plan your UI: shard selector? venue filters? how to show shard context?

### Step 2: Find the Configuration (10 min)

- [ ] Read [`CONFIG_REFERENCE.md`](./CONFIG_REFERENCE.md) → Find the backend service's config class
- [ ] Open `api-contracts/openapi/config-registry.json`
- [ ] Search for your service (e.g., "execution-service", "risk-and-exposure-service")
- [ ] List all configurable fields, their types, defaults
- [ ] Plan your config UI: which fields to expose? validation rules? defaults?

### Step 3: Check for API Gaps (5 min)

- [ ] Read [`API_FRONTEND_GAPS.md`](./API_FRONTEND_GAPS.md)
- [ ] Does your feature depend on any 🔴 **BLOCKED** APIs? If yes, defer the feature.
- [ ] Does it depend on 🟡 **IN PROGRESS** APIs? Plan it, but don't start yet.
- [ ] Any known differentials that affect your UI? (status terminology, timestamp format, aggregation semantics)

### Step 4: Find API Specs & Schemas (10 min)

- [ ] Open `api-contracts/openapi/<your-api>.yaml` → see endpoint signatures and response shapes
- [ ] Open `api-contracts/canonical-schemas/` → see Pydantic models (the ground truth)
- [ ] Open `internal-contracts/schemas/` → see internal event types if your feature consumes events

### Step 5: Check Data Flow & Sharding (5 min)

- [ ] Open `pm/data-flow-manifest.json` → find your domain, confirm service→API→UI flow
- [ ] Open `pm/TOPOLOGY-DAG.md` → confirm service dependencies
- [ ] Check `pm/workspace-manifest.json` → confirm shard list matches your feature's scope

### Done ✓

You now have:

- ✓ Shard model for your UI (CEFI vs DeFi vs Sports)
- ✓ List of configurable fields (no guessing)
- ✓ Known API gaps (no surprises mid-build)
- ✓ Endpoint specs and data shapes (ready to implement)
- ✓ Data flow diagram (know which service provides what)

**Start coding.**

---

## What Data Flows Where

The system has two parallel pipelines running the same data in different modes:

```
LIVE (real-time)                          BATCH (end-of-day)
─────────────────                         ──────────────────
Exchange WS feeds                         Historical GCS files
    ↓                                           ↓
market-tick-data-service                  instrument-service
    ↓                                           ↓
feature-services (7×)               feature-services (7×)
    ↓                                           ↓
strategy-service                          strategy-service
    ↓                                           ↓
execution-service ──────────────────── execution-service
    ↓                                           ↓
risk-service                              risk-service
    ↓                                           ↓
pnl-attribution-service              pnl-attribution-service
    ↓                                           ↓
Pub/Sub topics                            GCS buckets
    ↓                                           ↓
[ API services ]                      [ API services ]
    ↓                                           ↓
[ UI / versa repos ]               [ UI / versa repos ]
```

**Key rule:** UIs never talk to backend services directly. They talk to API services, which read from Pub/Sub
(live) or GCS (batch). The API services normalise everything to the schemas in `api-contracts/canonical-schemas/`
before sending to the UI.

---

## Per-Repo Quick Reference

### versa-client-reporting

What clients see: portfolio performance, monthly returns, statement downloads.

| What you need                  | Where to find it                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Portfolio/returns data shape   | `api-contracts/canonical-schemas/position.py`, `internal-contracts/schemas/reporting/` |
| API endpoints                  | `api-contracts/openapi/client-reporting-api.yaml`                                      |
| Monthly PnL types              | `internal-contracts/schemas/domain/market_data_api/`                                   |
| How batch reporting works      | `codex/04-architecture/batch-live-symmetry.md`                                         |
| Data flow for client reporting | `pm/data-flow-manifest.json` → entries with `"domain": "client-reporting"`             |

### versa-audit-ui

Internal ops dashboard: batch job status, event logs, data quality, alert inbox.

| What you need                  | Where to find it                                                  |
| ------------------------------ | ----------------------------------------------------------------- |
| Event schema (every log entry) | `internal-contracts/schemas/events.py`                            |
| Alert types                    | `internal-contracts/schemas/domain/events_service/`               |
| Batch job status types         | `internal-contracts/schemas/domain/data_quality/`, `domain/cicd/` |
| Exchange connectivity status   | `internal-contracts/schemas/connectivity/`                        |
| Observability patterns         | `codex/03-observability/`                                         |

### versa-execution-analytics-ui

Trade execution analytics: fill analysis, slippage, venue comparison.

| What you need          | Where to find it                                                       |
| ---------------------- | ---------------------------------------------------------------------- |
| Fill/trade schema      | `api-contracts/canonical-schemas/` → `CanonicalFill`, `CanonicalTrade` |
| Execution event types  | `internal-contracts/schemas/execution.py`, `domain/execution_service/` |
| API endpoints          | `api-contracts/openapi/execution-results-api.yaml`                     |
| Venue-specific nuances | `api-contracts/docs/TRADFI_VENUE_NUANCES.md`                           |
| DeFi execution types   | `internal-contracts/schemas/defi.py`                                   |

### versa-deployment-ui

Deployment command centre: service health, version tracking, cloud topology.

| What you need            | Where to find it                                                       |
| ------------------------ | ---------------------------------------------------------------------- |
| Deployment state types   | `internal-contracts/schemas/deployment.py`                             |
| Service health schema    | `internal-contracts/schemas/domain/health/`                            |
| Runtime mode (mock/live) | `internal-contracts/schemas/modes.py`                                  |
| Cloud topology           | `codex/04-architecture/TOPOLOGY-DAG.md` (also in `pm/TOPOLOGY-DAG.md`) |
| Env var conventions      | `pm/docs/dev-environment-vars.md`                                      |

### versa-admin-ui

Internal admin: auth management, GCP/AWS/Slack integration status.

| What you need              | Where to find it                           |
| -------------------------- | ------------------------------------------ |
| Cloud provider types       | `internal-contracts/schemas/deployment.py` |
| Service connectivity types | `internal-contracts/schemas/connectivity/` |
| Auth pattern               | `codex/07-security/`                       |
| Cloud integrations         | `codex/05-infrastructure/`                 |

### versa-onboarding

Client onboarding portal: KYC docs, IMA signing, account status.

| What you need                        | Where to find it                                   |
| ------------------------------------ | -------------------------------------------------- |
| Domain glossary                      | `codex/01-domain/`                                 |
| Client account types                 | `internal-contracts/schemas/domain/cefi_accounts/` |
| System overview (for client context) | `codex/00-getting-started/`                        |

### versa-invoicing

Fee calculation, invoice generation, performance reports.

| What you need        | Where to find it                                                         |
| -------------------- | ------------------------------------------------------------------------ |
| PnL / position types | `internal-contracts/schemas/domain/market_data_api/`                     |
| Reporting schemas    | `internal-contracts/schemas/reporting/` (if porting to a proper backend) |
| Fee/business rules   | `client_specifics.md` and `clients/*.md` in this repo                    |

---

## How to Find a Specific Schema

**"What does the API return for X?"**

1. Check `api-contracts/openapi/` — find the YAML for the relevant API service
2. Cross-reference with `api-contracts/canonical-schemas/` — the Pydantic class is the ground truth

**"What type does service X emit on the event bus?"**

1. Check `internal-contracts/schemas/events.py` — all event type names
2. Then `internal-contracts/schemas/domain/<service_name>/` for the full payload schema

**"What is topic/bucket Y used for?"**

1. `codex/05-infrastructure/` → infrastructure docs
2. `pm/docs/bucket-permissions-per-service.md` — which service owns which GCS bucket

**"Which venues support data type Z?"**

1. `api-contracts/docs/CROSS_VENUE_MATRIX.md` — the full venue × data-type support matrix
2. `api-contracts/docs/VENUE_DATA_TYPES.md` — per-venue capability breakdown

**"What does 'canonical' mean in this codebase?"**
→ `api-contracts/docs/ARCHITECTURE.md` — the normalisation pipeline explained

---

## Key Concepts

| Term             | Meaning                                                              | Where defined                                            |
| ---------------- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| **UAC**          | Unified API Contracts — normalised schemas for external data         | `api-contracts/docs/ARCHITECTURE.md`                     |
| **UIC**          | Unified Internal Contracts — internal service-to-service types       | `internal-contracts/docs/ARCHITECTURE.md`                |
| **HWM**          | High-water mark — the baseline for performance fee calculation       | `clients/*.md` in versa-invoicing                        |
| **Canonical**    | A normalised schema that all venues/sources map to                   | `api-contracts/canonical-schemas/`                       |
| **T0–T3**        | Library dependency tiers (T0 = pure leaf, T3 = service layer)        | `pm/TOPOLOGY-DAG.md`                                     |
| **Shard**        | A single-venue processing slice within a service                     | `codex/04-architecture/shard-level-failure-isolation.md` |
| **L0/L2**        | Order book depth: L0 = top-of-book (best bid/ask), L2 = full depth   | `internal-contracts/schemas/domain/market_tick_data/`    |
| **VCR cassette** | A recorded HTTP response used in tests instead of live API calls     | `api-contracts/docs/MOCKS_AND_VCR.md`                    |
| **Pub/Sub**      | Google Cloud Pub/Sub — the live event bus between services           | `codex/05-infrastructure/`                               |
| **GCS**          | Google Cloud Storage — batch data store between services             | `codex/05-infrastructure/`                               |
| **Mock mode**    | `VITE_MOCK_API=true` / `CLOUD_MOCK_MODE=true` — no real cloud needed | `pm/docs/dev-environment-vars.md`                        |

---

## Important: This Folder is Read-Only Reference

The `context/` folder is a snapshot. Do not edit files here — they will be overwritten when the context is
refreshed. If you find something wrong or outdated, the fix belongs in the source repo
(`unified-trading-codex`, `unified-api-contracts`, `unified-internal-contracts`, or `unified-trading-pm`).

Source repos live at:

- `unified-trading-system-repos/unified-trading-codex`
- `unified-trading-system-repos/unified-api-contracts`
- `unified-trading-system-repos/unified-internal-contracts`
- `unified-trading-system-repos/unified-trading-pm`
