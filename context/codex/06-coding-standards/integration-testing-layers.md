# Integration Testing Layers

**Last Updated:** 2026-03-04 **SSOT for:** The 5-layer integration testing strategy across all repos. **Cross-refs:**

- Repo registry: `unified-trading-pm/workspace-manifest.json`
- Plan: `unified-trading-pm/plans/cursor-plans/consolidated_remaining_work.md`
- Cursor rule: `.cursor/rules/integration-testing-layers.mdc`
- Tier architecture: `04-architecture/TIER-ARCHITECTURE.md`
- Topology DAG: `04-architecture/TOPOLOGY-DAG.md`

---

## Overview

Five testing layers, each with a distinct purpose, location, dependency profile, and trigger point. Layers are
cumulative: Layer N+1 is meaningless if Layer N fails.

```
Layer 0:   Contract Alignment         (T0, no credentials, no cloud, fast)
Layer 1:   Schema Robustness          (per-service, no credentials, fast)
Layer 1.5: Per-Component Integration  (per-service, mocked deps, no live infra, fast)
Layer 2:   Infrastructure Verify      (deployment-service, needs GCP creds, medium)
Layer 3:   Pipeline Smoke & E2E       (system-integration-tests, needs GCP sandbox, slow)
           ├── 3a: Smoke (fast, pre-deploy gate)
           └── 3b: Full (thorough, post-deploy validation)
```

---

## Layer 0 — Contract Alignment

**Question answered:** Do all schemas describing the same data agree with each other across repos?

**What it tests:**

- Every producer schema and consumer schema for the same entity are structurally compatible
- Field names, types, required/optional alignment
- AC external schemas → AC normalized schemas → UIC internal schemas form a valid chain
- Bidirectional: AC validates against UIC; UIC validates against AC

**Where it lives:**

- `unified-api-contracts/tests/unit/test_contract_alignment.py` — AC internal consistency (coverage tracked in AC)
- `unified-api-contracts/tests/integration/test_ac_uic_alignment.py` — AC→UIC schema pairs (co-located in AC for
  coverage)
- `unified-internal-contracts/tests/unit/test_contract_alignment.py` — UIC internal consistency (coverage tracked in
  UIC)
- `unified-internal-contracts/tests/integration/test_uic_ac_alignment.py` — UIC→AC schema pairs (co-located in UIC for
  coverage)

**Schema and cassette endpoint definitions:**

- Schema/contract definitions live in `unified-api-contracts` and `unified-internal-contracts`
- VCR cassette endpoint definitions live in `unified-api-contracts/vcr_endpoints.py`
- Contract alignment tests are co-located in `AC/tests/` and `UIC/tests/` for coverage tracking

**VCR-based integration test execution:**

VCR-based integration tests do NOT run standalone from AC. They EXECUTE from within the owning interface repos
(`unified-cloud-interface`, `unified-market-interface`, `unified-reference-data-interface`), which declare
`unified-api-contracts` as a dependency and provide the normalization layer under test. This ensures the cassette
replays are exercised against the actual adapter code, not in isolation.

See `vcr-cassette-pattern.md` for the full VCR cassette workflow (recording, storage locations, replay pattern in
interface repos).

**Tier:** T0 (both repos are T0 pure leaves)

**Credentials needed:** None

**Trigger:** Every quickmerge of AC, UIC, or any owning interface repo (`unified-cloud-interface`,
`unified-market-interface`, `unified-reference-data-interface`). Part of STEP B at TIER 0 in the meta-flow.

**Implementation pattern:**

```python
from unified_api_contracts.databento.schemas import DatabentoOhlcvBar
from unified_internal_contracts.market_data import InternalOhlcvBar

def test_ohlcv_field_alignment():
    ac_fields = set(DatabentoOhlcvBar.model_fields.keys())
    uic_fields = set(InternalOhlcvBar.model_fields.keys())
    shared = ac_fields & uic_fields
    for field in shared:
        ac_type = DatabentoOhlcvBar.model_fields[field].annotation
        uic_type = InternalOhlcvBar.model_fields[field].annotation
        assert ac_type == uic_type, f"Type mismatch on {field}: AC={ac_type}, UIC={uic_type}"
```

**Why both directions:** AC owns external/normalized schemas; UIC owns internal messaging schemas. A rename in one
without the other creates silent data loss at service boundaries.

---

## Layer 1 — Schema Robustness (Per-Service)

**Question answered:** Does this service fail fast on bad input and handle optional fields correctly?

**What it tests:**

- Required field missing → `ValidationError` raised immediately
- Optional field absent → passes with default, no exception
- Wrong type → fails loudly (no silent coercion)
- Boundary values (empty strings, zero, negative, extreme timestamps)
- Corner cases specific to the service's domain

**Where it lives:**

- Each service's own test suite: `tests/unit/test_schema_robustness.py`
- Each T1/T2 library's test suite where that library defines schemas consumers depend on

**Tier:** Same tier as the owning repo. A T4 service tests its own schema handling. A T2 library tests schemas it
exports.

**Credentials needed:** None

**Trigger:** Every quickmerge of that repo. Part of STEP B in the meta-flow at the owning tier.

**Implementation pattern:**

```python
import pytest
from pydantic import ValidationError
from my_service.schemas import InputRecord

class TestSchemaRobustness:
    def test_missing_required_field_raises(self):
        with pytest.raises(ValidationError):
            InputRecord(optional_field="present")

    def test_optional_field_absent_ok(self):
        record = InputRecord(required_field="value")
        assert record.optional_field is None

    @pytest.mark.parametrize("bad_value", ["", None, -1, "not-a-timestamp"])
    def test_invalid_types_rejected(self, bad_value):
        with pytest.raises((ValidationError, TypeError)):
            InputRecord(required_field=bad_value)
```

**Hypothesis property-based tests encouraged** for services with complex input domains (features, ML).

---

## Layer 1.5 — Per-Component Integration Tests

**Question answered:** Does this component correctly interact with its direct dependencies (adapters, event sinks,
config sources) in isolation from live infrastructure?

**What it tests:**

- A service correctly calls its UMI adapter with the expected parameters
- Event publication correctly invokes `EventSink` with the right topic and payload shape
- Config loading works correctly against a mock `SecretClient`
- Adapter wiring: the component under test connects to its declared dependency, not a stub of itself
- No live external calls, no live cloud resources — all dependencies are mocked or faked

**Where it lives:**

- `tests/integration/test_<component>_integration.py` in each repo

**Tier:** Same tier as the owning repo.

**Credentials needed:** None (all external dependencies are mocked)

**Run command:**

```bash
pytest tests/integration/ -v --timeout=30
```

**Trigger:** Blocking in quickmerge — the last local gate before Layer 2 post-deploy verification. Runs after Layer 1
(unit/schema) tests pass.

**NOT in scope for Layer 1.5:**

- Live infrastructure (GCS, PubSub, Secret Manager)
- Live trading venues or data sources
- Cross-service calls (those belong in Layer 3)

**Implementation pattern:**

```python
# tests/integration/test_market_data_service_integration.py
import pytest
from unittest.mock import MagicMock, call
from my_service.market_data_service import MarketDataService

@pytest.mark.integration
def test_service_calls_umi_adapter_with_correct_params():
    mock_adapter = MagicMock()
    mock_adapter.get_candles.return_value = []
    service = MarketDataService(adapter=mock_adapter)

    service.fetch("BTCUSDT", "1h", limit=10)

    mock_adapter.get_candles.assert_called_once_with("BTCUSDT", "1h", limit=10)

@pytest.mark.integration
def test_event_publication_invokes_event_sink():
    mock_sink = MagicMock()
    service = MarketDataService(event_sink=mock_sink)

    service.publish_tick({"symbol": "BTCUSDT", "price": 50000.0})

    assert mock_sink.publish.called
    topic, payload = mock_sink.publish.call_args[0]
    assert topic == "market-data-ticks"
    assert payload["symbol"] == "BTCUSDT"
```

#### Emulator vs Mock Fixture Decision Matrix

| Test scenario                          | Recommended tool                          | Reason                                                     |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| GCP Pub/Sub event propagation          | `PUBSUB_EMULATOR_HOST`                    | Protocol-faithful gRPC; SDK auto-detects                   |
| GCS bucket lifecycle / signed URLs     | `STORAGE_EMULATOR_HOST` (fake-gcs-server) | LocalStorageProvider skips ACLs and signed URLs            |
| BigQuery analytics queries             | `BIGQUERY_EMULATOR_HOST`                  | SQL query validation (avoid window functions)              |
| AWS S3 / Secrets / SQS                 | `@mock_aws` (moto)                        | SDK-level intercept; no emulator process needed            |
| Exchange REST APIs (Hyperliquid, etc.) | `responses` library (`passthrough=False`) | HTTP-level intercept; proves zero live calls               |
| WebSocket market data feeds            | `MockWebSocketFeed` (UMI)                 | In-process WS server; deterministic tick replay            |
| DeFi on-chain protocols                | Sim mode + `responses passthrough=False`  | Pure in-process arithmetic; assert zero I/O                |
| VCR cassette re-use                    | vcrpy cassette in UAC                     | Protocol-faithful for REST; use for external API contracts |

**Key rule**: If the GCP/AWS SDK is on the call path, use an emulator or moto — not `unittest.mock.patch` on internals.
If only HTTP is on the call path, use `responses` or `aioresponses`.

#### Cassette Parity & Drift

- Every cassette is validated against UAC models on each commit:
  `cd unified-api-contracts && pytest tests/test_cassette_schema_parity.py`
- Nightly drift detection re-records cassettes and alerts on schema changes (alerting-only, not blocking)

#### CI Hermeticity (Credential-Free Gate)

All tests must pass with `CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true`. To prove zero live network calls:

```bash
pytest --block-network  # from unified-trading-pm/scripts/dev/network_block_plugin.py
```

Tests connecting to LOCAL emulators use `@pytest.mark.allow_network`. This opt-out must be commented explaining it is an
emulator (not a live API). Each opt-out emits a CI warning.

---

## Layer 2 — Infrastructure Connectivity Verification

**Question answered:** Are all GCS buckets, PubSub topics, Secret Manager entries, and IAM permissions actually
provisioned so that the deployed services can communicate?

**What it tests:**

- All GCS buckets defined in `configs/` exist and have correct IAM
- All PubSub topics defined in `unified-internal-contracts` exist with correct subscriptions
- Service accounts have the permissions they need
- Secret Manager entries exist (not their values — just existence)
- BigQuery datasets referenced by UDC exist and are accessible

**Where it lives:**

- `deployment-service/scripts/verify_infra.py`
- Exposed as `deployment-api` endpoint: `GET /infra/health`

**Tier:** T5 (deployment-service is the orchestrator tier)

**Credentials needed:** GCP project credentials (service account with read-only access to buckets, topics, secrets)

**Trigger:** Automatically by `deployment-api` before declaring a deployment "successful." If Layer 2 fails, the
deployment is marked "deployed but unhealthy" — Layer 3 does not run.

**Ordering:** Layer 2 runs AFTER deployment, BEFORE Layer 3. It is NOT part of quickmerge.

**Sports vertical (Phase 3):** `verify_infra.py` must include sports GCS buckets (sports-reference-data,
sports-odds-data, sports-processed-odds, sports-features, sports-strategy, sports-executions), PubSub topics
(sports-reference-data-updated, sports-odds-updated, sports-processed-odds-updated, sports-arbitrage-detected,
sports-features-computed, sports-bet-orders, sports-bet-executions), and Secret Manager entries for sports API keys.
Health endpoint: `GET /infra/health` with `.sports` checks.

**Implementation pattern:**

```python
from google.cloud import storage, pubsub_v1, secretmanager

def verify_infrastructure(config: DeploymentConfig) -> InfraHealthReport:
    results: list[CheckResult] = []
    for bucket in config.required_buckets:
        exists = storage_client.bucket(bucket).exists()
        results.append(CheckResult(resource=f"gs://{bucket}", ok=exists))
    for topic in config.required_topics:
        try:
            publisher.get_topic(topic=topic)
            results.append(CheckResult(resource=topic, ok=True))
        except NotFound:
            results.append(CheckResult(resource=topic, ok=False))
    return InfraHealthReport(checks=results, healthy=all(r.ok for r in results))
```

---

## Layer 3 — Pipeline Smoke & E2E

**Question answered:** Does mock data actually flow through the full service pipeline end-to-end without error?

### Layer 3a — Smoke (fast, pre-deploy gate)

**What it tests:**

- Happy path: one date, one venue, one instrument through the full pipeline
- Schema round-trip: data written by producer is readable by consumer
- Service-to-service auth flows work (OAuth tokens accepted)
- All API endpoints return 200 with valid mock input

**pytest marker:** `@pytest.mark.smoke`

**Runtime:** <5 minutes

**Trigger:** Can be triggered manually before staging merge as a confidence check. Also runs as the first phase of the
post-deploy validation.

### Layer 3b — Full E2E (thorough, post-deploy validation)

**What it tests:**

- Corner case data: missing optional fields, boundary values, multi-venue
- Multi-date pipeline: validates date partitioning and alignment
- Auth edge cases: expired tokens, wrong scope, revoked permissions
- Infrastructure interactions: PubSub publish→subscribe round-trip, GCS write→read
- Data completeness: all expected output files/topics populated
- Performance baseline: pipeline completes within expected time bounds

**pytest marker:** `@pytest.mark.full_e2e`

**Runtime:** 15–30 minutes

**Trigger:** Automatically by `deployment-api` AFTER a successful deployment AND Layer 3a passes. Sequential: 3a must
pass before 3b starts. If 3a fails, 3b is skipped and the deployment is flagged.

### Where it lives

`system-integration-tests/` — a standalone repo, NOT part of the tier DAG.

**Repo characteristics:**

- Topological position: L10 in the workspace DAG — after all services and UIs have been deployed
- Zero cross-service Python imports — interacts via HTTP, GCS, and PubSub only
- Discovers live services via `deployment-api GET /services` rather than hardcoding endpoints
- pytest markers: `@pytest.mark.smoke` (Layer 3a, <5 min) and `@pytest.mark.full_e2e` (Layer 3b, 15–30 min)
- Created as part of the UTD V3 four-way split (Phase 1 Stream B)

```
system-integration-tests/
├── tests/
│   ├── layer3a_smoke/
│   │   ├── test_pipeline_happy_path.py
│   │   ├── test_schema_round_trip.py
│   │   └── test_auth_flows.py
│   └── layer3b_full_e2e/
│       ├── test_corner_case_data.py
│       ├── test_multi_date_pipeline.py
│       ├── test_auth_edge_cases.py
│       ├── test_pubsub_round_trip.py
│       └── test_performance_baseline.py
├── fixtures/
│   ├── mock_ohlcv_data.parquet
│   ├── mock_tick_data.parquet
│   └── mock_corner_cases/
├── conftest.py           # GCP sandbox project, test bucket lifecycle
├── pyproject.toml
└── scripts/
    └── quality-gates.sh
```

**Credentials needed:** GCP sandbox project credentials. Test buckets and topics are created/destroyed by `conftest.py`.

**Sports pipeline (Phase 3):** Add `tests/smoke/test_sports_pipeline_smoke.py` and
`tests/e2e/test_sports_full_pipeline.py` with markers `@pytest.mark.smoke` and `@pytest.mark.full_e2e`, `-k "sports"`.
Tests: reference data → GCS; odds snapshot → processing → ProcessedOddsOutput; arbitrage → BetOrder; BetOrder →
execution → BetExecution. No `from footballbets`; no PostgreSQL.

**Tier:** `integration` (not T0–T6; sits above all tiers as a consumer of everything)

**Key design constraint:** system-integration-tests does NOT import Python internals from any service. It interacts via:

- HTTP (calling deployment-api, execution-results-api, etc.)
- GCS (reading output files written by services)
- PubSub (subscribing to topics published by services)
- `deployment-api GET /services` (to discover what to test)

This means zero cross-service Python imports. Clean separation.

---

## When Each Layer Runs

| Layer | Trigger                                            | In quickmerge?                 | Credentials   | Blocks                      |
| ----- | -------------------------------------------------- | ------------------------------ | ------------- | --------------------------- |
| 0     | Every AC, UIC, or owning interface repo quickmerge | Yes (unit + integration tests) | None          | T0 green gate               |
| 1     | Every repo quickmerge                              | Yes (unit tests)               | None          | That repo's green gate      |
| 1.5   | Every repo quickmerge (after Layer 1 passes)       | Yes (last local gate)          | None          | That repo's green gate      |
| 2     | Post-deployment (deployment-api trigger)           | No                             | GCP read-only | Layer 3                     |
| 3a    | Post-deployment (after Layer 2 passes)             | No                             | GCP sandbox   | Layer 3b                    |
| 3b    | Post-deployment (after Layer 3a passes)            | No                             | GCP sandbox   | "Deployment healthy" status |

---

## Ordering in the Plan

```
TIER 0: Layer 0 tests are written and pass (AC↔UIC alignment)
TIER 1–4: Layer 1 tests exist per-repo (schema robustness in each service)
TIER 1–4: Layer 1.5 tests exist per-repo (per-component integration tests, mocked deps)
TIER 5 (deployment split):
  - deployment-service extracted with verify_infra.py (Layer 2)
  - system-integration-tests repo created with Layer 3a + 3b
POST-REFACTOR VALIDATION (after all tiers green):
  - Deploy to sandbox
  - Layer 2 runs → passes
  - Layer 3a runs → passes
  - Layer 3b runs → passes
  - System declared healthy
```

---

## References

- **Cursor rule:** `.cursor/rules/integration-testing-layers.mdc`
- **Plan:** `unified-trading-pm/plans/cursor-plans/consolidated_remaining_work.md`
- **Manifest:** `unified-trading-pm/workspace-manifest.json`
- **Topology DAG:** `04-architecture/TOPOLOGY-DAG.md`
- **Service pair flows:** `08-workflows/service-pair-flows.md` (SSOT for producer→consumer schema pairs)
