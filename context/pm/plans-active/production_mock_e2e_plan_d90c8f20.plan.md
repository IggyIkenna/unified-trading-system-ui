---
name: production-mock-e2e-plan-d90c8f20
overview:
  "Bring all 60+ repos to production-standard mock E2E testability: libraries via UAC/UIC validation and VCR cassettes;
  services and APIs via mock data replay, error handling, events, and load/performance checks; UIs via mock API, smoke
  tests, and demo mode. Mock-only default in CI; optional sandbox mode when secrets present."
type: infra
epic: epic-infra
status: active

completion_gates:
  code: C5
  deployment: none
  business: none

repo_gates:
  - repo: unified-api-contracts
    code: C1
    deployment: none
    business: none
    readiness_note: "DR N/A: local developer tooling — no cloud deployment required. BR N/A: internal tooling, no commercial KPI."
  - repo: unified-cloud-interface
    code: C2
    deployment: none
    business: none
    readiness_note: "DR N/A: local developer tooling — no cloud deployment required. BR N/A: internal tooling, no commercial KPI."
  - repo: unified-market-interface
    code: C2
    deployment: none
    business: none
    readiness_note: "DR N/A: local developer tooling — no cloud deployment required. BR N/A: internal tooling, no commercial KPI."
  - repo: unified-defi-execution-interface
    code: C2
    deployment: none
    business: none
    readiness_note: "DR N/A: local developer tooling — no cloud deployment required. BR N/A: internal tooling, no commercial KPI."
  - repo: system-integration-tests
    code: C2
    deployment: none
    business: none
    readiness_note: "DR N/A: local developer tooling — no cloud deployment required. BR N/A: internal tooling, no commercial KPI."
  - repo: unified-trading-pm
    code: C2
    deployment: none
    business: none
    readiness_note: "DR N/A: local developer tooling — no cloud deployment required. BR N/A: internal tooling, no commercial KPI."

depends_on: []

todos:
  - id: phase1-vcr-consolidate
    content: >
      - [x] Consolidate VCR cassettes into UAC; migrate unified-defi-execution-interface and execution-service cassettes
    status: done
    completion_note: >
      4 cassettes migrated to UAC, cassette_loader.py utility created, local copies deleted from execution-service and
      UDEI.
  - id: phase1-orphan-check
    content: >
      - [x] Add cassette orphan check to quality gates or codex (no orphan cassettes, no orphan tests)
    status: done
    completion_note: >
      cassette_orphan_checker.py module created in UAC with 16 tests.
  - id: phase1-interface-vcr
    content: >
      - [x] Ensure all 7 external interfaces have VCR tests and cassettes in UAC
    status: done
    completion_note: >
      All 7 external interfaces have VCR tests (pre-existing).
  - id: phase2-service-mock-replay
    content: >
      - [x] Add mock data replay E2E/integration tests for all services (live + batch)
    status: done
    completion_note: >
      mock_replay.py utility + E2E tests in 5 services (execution, strategy, instruments, market-tick-data, alerting).
  - id: phase2-error-events
    content: >
      - [x] Add error handling and event propagation tests per service
    status: done
    completion_note: >
      Error event propagation tests in 5 services with MockEventSink and ErrorCategory validation.
  - id: phase2-load-memory
    content: >
      - [x] Add load and memory behavior tests where applicable
    status: done
    completion_note: >
      Performance tests in 3 services (execution 1000 orders, strategy 100 signals, market-tick 10000 ticks).
  - id: phase3-api-integration
    content: >
      - [x] Add tests/integration/ and domain data mocking for all API repos
    status: done
    completion_note: >
      test_api_workflow.py in all 8 API repos (86 tests total using FastAPI TestClient with CLOUD_MOCK_MODE=true).
  - id: phase4-ui-smoke
    content: >
      - [x] Add smoke tests for every major UI route and feature with VITE_MOCK_API
    status: done
    completion_note: >
      All 11 UIs have smoke tests (pre-existing).
  - id: phase4-ui-websocket
    content: >
      - [x] Add WebSocket mock and edge-case scenarios for UIs
    status: done
    completion_note: >
      All 4 real-time UIs use polling not WebSocket; polling pattern tests created (27 tests).
  - id: phase5-sandbox-mode
    content: >
      - [ ] Define CLOUD_SANDBOX_MODE and VITE_SANDBOX_MODE; optional CI job when secrets present
    status: pending
    notes: >
      CHECKED 2026-03-16: CLOUD_SANDBOX_MODE and VITE_SANDBOX_MODE not found anywhere in workspace except in this plan
      file itself. No env var definitions, no CI job, no documentation. Fully pending.
  - id: phase5-extreme-fixtures
    content: >
      - [x] Create extreme load and market move fixtures; wire into services and UIs
    status: done
    completion_note: >
      6 fixture files in unified-trading-pm/fixtures/extreme/ with schema validation.
  - id: phase5-mock-feature-dynamics
    content: >
      - [x] [AGENT] P2. Mock feature dynamics for DeFi. Currently mock mode returns static seed data — APYs, funding
      rates, health factors are fixed values. For realistic mock testing, mock data should simulate time-varying market
      dynamics: (a) APY oscillation: Aave supply APY varies 2-8% with utilization-driven spikes, (b) Funding rate
      cycles: Hyperliquid funding flips positive/negative on 8h cycle, (c) Health factor degradation: simulate
      collateral price drop → HF approaches 1.0, (d) weETH rate appreciation: ~0.01% per day steady growth with
      occasional jumps, (e) Liquidation cascade scenario: rapid HF drop below 1.0 with penalty, (f) Gas spike scenario:
      gas jumps from 30 to 500 gwei blocking flash loans. Implement as MockDeFiDynamics class in
      unified-trading-library/core/mock_state_store.py that generates realistic time-series when
      MOCK_STATE_MODE=interactive. Deterministic mode (CI) uses fixed values. Interactive mode (dev) uses dynamic
      simulation. This enables "mock covers what live would deliver" — same event schemas, realistic values. Repos:
      unified-trading-library (MockDeFiDynamics), strategy-service (wire into mock provider).
    status: done
    completion_note: >
      MockDeFiDynamics class in UTL with 4 simulators, event recording, MockStateStore integration, 32 tests.
  - id: phase6-rollout
    content: >
      - [ ] Rollout across all 60+ repos; create per-repo checklist from manifest
    status: pending
  - id: h5-2-cassette-parity
    content:
      "P0: Add test_cassette_schema_parity.py to UAC — validates every committed cassette against UAC Pydantic models on
      every commit"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h8-credential-free-gate
    content:
      "P0: Add credential-free CI gate to system-integration-tests — network_block_plugin.py + CLOUD_PROVIDER=local +
      CLOUD_MOCK_MODE=true; fails if any live network call escapes"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h2-moto-aws
    content:
      "P1: Add moto[s3,secretsmanager,sqs]>=5.0.0 to UCI test deps; create tests/integration/test_aws_mode.py with
      @mock_aws coverage for all UCI AWS provider impls; gates aws_migration codebuild canary"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h1-1-pubsub-emulator
    content:
      "P1: Wire PUBSUB_EMULATOR_HOST=localhost:8085 into UCI + system-integration-tests conftest; run
      gcr.io/google.com/cloudsdktool/google-cloud-cli emulator in CI Docker before test suite"
    status: done
    notes:
      "DONE 2026-03-11: pubsub_emulator_host + with_pubsub_emulator fixtures already in both conftest.py files; added
      pubsub-emulator Docker service + PUBSUB_EMULATOR_HOST env to quality-gates.yml in system-integration-tests
      (bca6482) and unified-cloud-interface (6cfc26f)"
  - id: h4-1-hyperliquid-responses
    content:
      "P1: Add responses library fixtures for Hyperliquid REST (order place/cancel/query) in
      unified-defi-execution-interface/tests/fixtures/hyperliquid_responses.py; assert passthrough=False so zero live
      calls escape"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h3-websocket-simulator
    content:
      "P2: Create MockWebSocketFeed in unified-market-interface/tests/fixtures/mock_ws_server.py; add
      ws_ticks_binance/deribit/hyperliquid.json fixtures; add integration tests for UMI WS manager and execution-service
      deribit_ws"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h1-2-gcs-emulator
    content:
      "P2: Wire fsouza/fake-gcs-server (port 4443) into UCI + system-integration-tests conftest via
      STORAGE_EMULATOR_HOST; covers bucket lifecycle, ACLs, signed URLs missing from LocalStorageProvider"
    status: done
    notes:
      "DONE 2026-03-11: gcs_emulator + with_gcs_emulator + storage_client_emulator fixtures already in both conftest.py
      files; added gcs-emulator Docker service + STORAGE_EMULATOR_HOST env to quality-gates.yml in
      system-integration-tests (bca6482) and unified-cloud-interface (6cfc26f)"
  - id: h7-thirdparty-fixtures
    content:
      "P2: Add aioresponses fixtures for TheGraph (per query hash), responses fixtures for Alchemy/Infura JSON-RPC, and
      complete VCR cassette coverage for Databento/Tardis used endpoints"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h6-fault-injection
    content:
      "P3: Create FaultInjectionMiddleware in unified-trading-pm/scripts/dev/fixtures/fault_injection.py; add
      test_fault_scenarios.py to execution-service, market-data-service, UCI tests"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h9-tick-replay
    content:
      "P3: Create TickReplayEngine in unified-trading-pm/scripts/dev/fixtures/tick_replay.py; reads from
      mock_data_dev_project seed fixtures; freezegun integration; UAC-validated Tick schema"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h1-3-bigquery-emulator
    content: >
      - [x] P3: Wire ghcr.io/goccy/bigquery-emulator (port 9050) into trading-analytics-api and client-reporting-api
      test suites via BIGQUERY_EMULATOR_HOST
    status: done
    completion_note: >
      BigQuery emulator fixture wired into client-reporting-api (matching trading-analytics-api pattern).
  - id: h5-1-cassette-drift
    content:
      "P4: Create unified-trading-pm/.github/workflows/cassette-drift-check.yml — nightly re-record cassettes vs real
      APIs, schema-level diff, GitHub issue + Telegram alert on drift"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h10-1-docker-compose-mock
    content:
      "P4: Create unified-trading-pm/docker/docker-compose.mock.yml — all T2/T3 services in CLOUD_MOCK_MODE=true,
      optional GCP emulator containers, seed fixture mounts"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
  - id: h10-2-demo-mode-script
    content:
      "P4: Create unified-trading-pm/scripts/demo-mode.sh — single-command demo: starts all services (mock) + all UIs
      (VITE_MOCK_API=true) + seeds data; stakeholder-ready"
    status: done
    notes: "DONE 2026-03-11 (via cicd_mock_hardening_2026_03_11)"
isProject: false
---

# Production-Standard Mock E2E for All Repos

## Current State (from audit + explore)

| Area               | Status                                                                    | Gap                                                                                                   |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **VCR cassettes**  | UAC has `unified_api_contracts_external/<venue>/mocks/`; 46 cassette dirs | `unified-defi-execution-interface`, `execution-service` use per-repo `tests/cassettes/` — not aligned |
| **Libraries**      | Integration tests in 7+ interface repos; UAC/UIC alignment tests          | Orphan cassette check; vcrpy vs manual YAML; cassette placement rule enforcement                      |
| **Services**       | `tests/integration/` in many; CLOUD_MOCK_MODE in base scripts             | API-level mock replay; error/event/load/memory checks; batch vs live symmetry                         |
| **APIs**           | Some conftest fixtures                                                    | Often lack `tests/integration/`; domain data mocking                                                  |
| **UIs**            | `mock-api.ts` + `VITE_MOCK_API` per UI                                    | No shared mock package; smoke coverage gaps; WebSocket mock; demo mode                                |
| **Sandbox**        | Not formalized                                                            | No `CLOUD_SANDBOX_MODE` / `VITE_SANDBOX_MODE` for optional live-like runs                             |
| **GCP emulators**  | None — UCI uses in-memory LocalProvider                                   | No `PUBSUB_EMULATOR_HOST`, `STORAGE_EMULATOR_HOST`, `BIGQUERY_EMULATOR_HOST` in any repo or CI        |
| **AWS mock**       | `unittest.mock.patch` only                                                | No moto; AWS migration active with pending CodeBuild canary                                           |
| **WS feeds**       | UMI WebSocket manager has zero mock coverage                              | No `MockWebSocketFeed`; Deribit WS, Binance WS entirely untested in CI                                |
| **DeFi REST**      | Hyperliquid VCR explicitly excluded (`is_live=True` gate)                 | Full DeFi execution path unreachable in CI without live credentials                                   |
| **Cassette drift** | Static YAML committed to git                                              | No nightly re-record; no cassette → UAC schema parity check; stale cassettes fail silently            |
| **CI hermeticity** | No gate                                                                   | No proof CI makes zero live network calls; TheGraph 9-key rotation fires in CI                        |

---

## Phase 1: Libraries — UAC/UIC + VCR Consolidation

**Goal:** Libraries are production-ready when UAC/UIC validated and every external schema has a VCR cassette with no
orphans.

### 1.1 VCR Cassette SSOT

- **Canonical location:**
  `unified-api-contracts/unified_api_contracts/unified_api_contracts_external/<venue>/mocks/<endpoint>.yaml`
- **Migration:** Move per-repo cassettes from `unified-defi-execution-interface/tests/cassettes/` and
  `execution-service/tests/cassettes/` into UAC under the correct venue paths. Update tests to load from UAC path (or
  via a shared helper).
- **Orphan check:** Add a quality-gate step (or codex check) that fails if any cassette in UAC has no corresponding test
  that replays it, and if any test references a cassette that does not exist.
- **vcrpy vs manual:** Standardize on vcrpy for recording/replay where possible; document manual YAML loading as
  fallback for non-HTTP flows.

### 1.2 External Interfaces (7 repos)

Per [trading_system_audit_prompt.md](unified-trading-pm/plans/audit/trading_system_audit_prompt.md) Section 10:

- `unified-market-interface`, `unified-trade-execution-interface`, `unified-reference-data-interface`,
  `unified-position-interface`, `unified-sports-execution-interface`, `unified-defi-execution-interface`,
  `unified-cloud-interface`
- Each must have VCR-recorded integration tests validating schemas from UAC.
- Cassettes in `unified_api_contracts_external/<venue>/mocks/`.
- All integration tests run with mocked deps (no live cloud in quickmerge).

### 1.3 UIC as SSOT

- UIC schemas are internal SSOT; no separate “validation” beyond contract alignment tests.
- Ensure `test_contract_alignment.py` and `test_ac_uic_alignment.py` (or equivalent) pass in UAC/UIC and dependent
  repos.
- Libraries with private deps: `tests/integration/` with Layer 1.5 mock integration tests per dep boundary.

---

## Phase 2: Services — Mock Replay, Errors, Events, Load, Memory

**Goal:** Services are E2E-testable with mock data in live and batch mode; error handling, event propagation, and
resource behavior validated.

### 2.1 Mock Data Replay

- Each service has `tests/e2e/` or `tests/integration/` scenarios that:
  - Start the service (or its engine) with `CLOUD_MOCK_MODE=true`.
  - Replay mock data from fixtures (aligned with UAC/UIC schemas).
  - Exercise live and batch code paths where applicable.
- Use existing patterns: `tests/fixtures/`, `tests/conftest.py`, `tests/mocks.py` (e.g.
  [deployment-service](deployment-service/tests/mocks.py)).

### 2.2 Error and Config Handling

- Tests for: missing upstream data, missing optional config, partial failures.
- Fail-fast behavior per [hardening-standards.mdc](.cursor/rules/standards/hardening-standards.mdc).
- Add or extend `test_error_handling.py` / `test_config_handling.py` per service.

### 2.3 Event Propagation

- Per [observability-compliance.mdc](.cursor/rules/misc/observability-compliance.mdc): `AUTH_FAILURE`,
  `SECRET_ACCESSED`, `CONFIG_CHANGED`, etc.
- Add `test_event_logging.py` where missing (audit notes 46 repos already have it).
- Assert required events are emitted for key flows.

### 2.4 Load and Performance

- Rate limiting: validate at interface/adapter level (e.g. circuit breaker, backoff).
- Memory: tests that exercise high-volume or long-running flows with mock data; assert no unbounded growth (or document
  expected bounds).
- Use `pytest-benchmark` or similar for regression detection where appropriate.

### 2.5 API-Level Testing

- Services that expose HTTP: smoke tests against `/health`, `/readiness`, and key domain endpoints with mock data.
- Reuse `system-integration-tests` patterns for Layer 3a smoke.

---

## Phase 3: APIs — Same as Services + Domain Data

**Goal:** APIs have the same guarantees as services, plus domain data mocking.

### 3.1 Integration Tests

- Add `tests/integration/` where missing (e.g. [client-reporting-api](client-reporting-api) has conftest but not full
  integration layout).
- One test file per private dependency boundary.

### 3.2 Domain Data Mocking

- Use VCR-style fixtures or in-memory mocks so APIs can run E2E without live services.

### 3.3 Smoke Tests

- `/health`, `/readiness`, and critical GET/POST endpoints with mock payloads.

---

## Phase 4: UIs — Mock API, Smoke, Edge Cases, Demo Mode

**Goal:** UIs are demo- and test-ready with mock data; every screen and flow has smoke coverage; edge cases and
WebSockets covered.

### 4.1 Shared Mock API (Optional)

- Evaluate `@unified-trading/ui-kit` or a new `unified-mock-api` package for shared mock handlers and data shapes.
- Current: each UI has `src/lib/mock-api.ts`; consolidate where it reduces duplication without over-engineering.

### 4.2 Smoke Tests

- Vitest/Playwright: smoke test for every major route and feature.
- Use `VITE_MOCK_API=true` so no real backend required.
- Cover: navigation, forms, tables, charts, error states.

### 4.3 Edge Cases and WebSockets

- Mock WebSocket streams with synthetic data (e.g. random ticks, extreme moves).
- Test: empty states, loading states, error states, large datasets.
- Scenarios: extreme loads, flash crashes, missing instruments.

### 4.4 Demo Mode

- `VITE_MOCK_API=true` as default for local dev and CI.
- Document how to run UIs in “demo mode” for stakeholders.

---

## Phase 5: Sandbox and Extreme Scenarios

**Goal:** Optional sandbox mode for CI when secrets present; synthetic extreme scenarios for load and market moves.

### 5.1 Sandbox Mode

- **Env vars:** `CLOUD_SANDBOX_MODE`, `VITE_SANDBOX_MODE` (or equivalent).
- **Behavior:** When set and sandbox/UAT API keys are available, tests can call real sandbox endpoints.
- **CI:** Default remains mock-only; add optional job or flag (e.g. `--sandbox`) to run sandbox tests when secrets
  exist.
- **Docs:** Document in [dev-environment-vars.md](unified-trading-pm/docs/dev-environment-vars.md).

### 5.2 Extreme Scenarios

- Fixtures for: high message volume, extreme price moves, missing instruments, partial failures.
- Replay these in services and UIs to validate stability and UX under stress.

---

## Phase 6: Quality Gates and Rollout

### 6.1 Quality Gate Updates

- Add cassette orphan check to UAC (or codex step).
- Add `tests/integration/` presence check for services and APIs (or extend existing).
- Ensure `CLOUD_MOCK_MODE=true` in all Python repo workflows (per
  [mft_audit_full_remediation_2026_03_11.md](unified-trading-pm/plans/active/mft_audit_full_remediation_2026_03_11.md)).
- UI repos: ensure `VITE_MOCK_API` is set in CI for test runs.

### 6.2 Rollout Order

1. **Libraries** (T0/T1): UAC, UIC, interfaces — cassette consolidation, orphan check.
2. **Services** (T2/T3): mock replay, error/event/load tests.
3. **APIs**: integration tests, domain mocks, smoke.
4. **UIs**: smoke, edge cases, WebSocket mocks, demo mode.
5. **Sandbox + extreme**: optional modes and fixtures.

### 6.3 Repo Inventory

- Use `workspace-manifest.json` to enumerate repos by `type` and `arch_tier`.
- Create checklist per repo: VCR, integration tests, mock replay, events, load, smoke, sandbox.

---

## Key Files and References

| Reference                                                                                       | Purpose                                       |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [trading_system_audit_prompt.md](unified-trading-pm/plans/audit/trading_system_audit_prompt.md) | Audit Sections 10 (integration), 14 (orphans) |
| [integration-testing-layers.mdc](.cursor/rules/testing/integration-testing-layers.mdc)          | 5-layer strategy; cassette placement          |
| [CI-CD-FLOW.md](unified-trading-pm/docs/repo-management/CI-CD-FLOW.md)                          | run-all-quality-gates, CLOUD_MOCK_MODE        |
| [observability-compliance.mdc](.cursor/rules/misc/observability-compliance.mdc)                 | Event requirements                            |
| `unified_api_contracts_external/<venue>/mocks/`                                                 | Canonical cassette location                   |

---

## Mermaid: Test Mode Flow

```mermaid
flowchart TB
    subgraph CI [CI Quality Gates]
        MockOnly[CLOUD_MOCK_MODE=true]
        MockOnly --> QG[Quality Gates]
    end

    subgraph Optional [Optional Sandbox]
        Sandbox[CLOUD_SANDBOX_MODE + keys]
        Sandbox --> SandboxQG[Sandbox E2E]
    end

    subgraph Local [Local / Demo]
        ViteMock[VITE_MOCK_API=true]
        ViteMock --> UIDemo[UI Demo Mode]
    end

    QG --> Pass[PASS]
    SandboxQG --> Pass
    UIDemo --> Demo[Demo Ready]
```

---

## Success Criteria

- **Libraries:** UAC/UIC alignment pass; every external schema has a cassette; zero cassette orphans.
- **Services/APIs:** Integration tests per dep boundary; mock replay in live and batch; error/event/load tests; smoke on
  key endpoints.
- **UIs:** Smoke tests for all major flows; mock API and WebSocket; demo mode works.
- **Sandbox:** Optional CI mode when secrets present; documented.
- **Extreme:** Fixtures and scenarios for load and market stress; replayable in tests.
- **CI hermeticity (Phase 7):** Zero live network calls in CI proven by credential-free gate; all cassettes validate
  against UAC schemas; GCP emulators + moto replace all live cloud calls.

---

## Phase 7: CI/CD Hardening — Citadel-Grade Mock Infrastructure

**Goal:** Prove CI is fully hermetic (zero live calls), cloud interactions are protocol-faithful, and cassettes never
silently diverge from real exchange APIs.

### 7.1 Credential-Free CI Gate (H8) — P0

- **New pytest plugin:** `unified-trading-pm/scripts/dev/network_block_plugin.py`
  - Registers `responses` in `passthrough=False` mode for the full session
  - Any unexpected network call → immediate test failure with URL logged
- **CI step** in `system-integration-tests` workflow:
  `CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true pytest -m "not sandbox"`
- **Gate:** CI exits non-zero if any test makes a live network call

### 7.2 Cassette → UAC Schema Parity (H5.2) — P0

- **New file:** `unified-api-contracts/tests/test_cassette_schema_parity.py`
- Loads every YAML cassette from all `unified_api_contracts_external/<venue>/mocks/` dirs
- Validates response body against the corresponding UAC Pydantic model
- Runs on every commit (fast — no network); fails QG on schema violation
- Catches stale cassettes that recorded responses now violating current contracts

### 7.3 AWS Mock via moto (H2) — P1

- **Add to** `unified-cloud-interface/pyproject.toml` test deps: `"moto[s3,secretsmanager,sqs]>=5.0.0,<6.0.0"`
- **New file:** `unified-cloud-interface/tests/integration/test_aws_mode.py`
  - `@mock_aws` wrapping all S3StorageClient, AWSSecretClient, SQS queue tests
  - Protocol-faithful: real bucket/key semantics in memory
- **Gate for** `aws_migration.md` `codebuild-canary-run` todo: moto tests must pass first

### 7.4 GCP Pub/Sub Emulator (H1.1) — P1

- **Env:** `PUBSUB_EMULATOR_HOST=localhost:8085` — `google-cloud-pubsub` SDK auto-detects; no code changes
- **CI:** Add Docker service `gcr.io/google.com/cloudsdktool/google-cloud-cli` before test suite
- **conftest.py** fixture in `system-integration-tests/` and per-service integration dirs
- **Scope:** Any test exercising `log_event()`, `EventBus.publish()`, subscription pull

### 7.5 Hyperliquid `responses` Mock (H4.1) — P1

- **New file:** `unified-defi-execution-interface/tests/fixtures/hyperliquid_responses.py`
  - `@responses.activate` wrapping order placement, cancellation, status query
  - `passthrough=False` asserted — zero live calls escape
- **Note:** VCR not applicable for this repo; `responses` library is the correct pattern
- Unblocks the entire DeFi execution path in CI without live credentials

### 7.6 GCS Emulator (H1.2) — P2

- **Docker:** `fsouza/fake-gcs-server:latest` port `4443`
- **Env:** `STORAGE_EMULATOR_HOST=http://localhost:4443`
- **Scope:** bucket lifecycle, ACLs, signed URL generation — not covered by UCI LocalStorageProvider
- Required by `cloud_infra_bucket_auth_2026_03_10.md` tests

### 7.7 WebSocket Feed Simulator (H3) — P2

- **New file:** `unified-market-interface/tests/fixtures/mock_ws_server.py`
  - `MockWebSocketFeed` — replays JSON tick fixtures over a local WS server (aiohttp.test_utils)
- **Fixture files:** `ws_ticks_binance.json`, `ws_ticks_deribit.json`, `ws_ticks_hyperliquid.json` (UAC-validated)
- **Tests:** `unified-market-interface/tests/integration/test_ws_manager.py`,
  `execution-service/tests/integration/test_deribit_ws.py`

### 7.8 Third-Party Data Provider Fixtures (H7) — P2

| Provider                                  | Fix                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **TheGraph** (9-key rotation fires in CI) | `aioresponses` fixtures per query hash in `unified-market-interface/tests/fixtures/thegraph_responses.py` |
| **Alchemy/Infura** (live RPC)             | `responses` fixtures for JSON-RPC `eth_call` patterns                                                     |
| **Databento, Tardis**                     | Complete VCR cassette coverage for all used endpoints                                                     |
| **Pyth, BloxRoute**                       | Fixtures if used in any production code path                                                              |

### 7.9 Fault Injection / Chaos Middleware (H6) — P3

- **New file:** `unified-trading-pm/scripts/dev/fixtures/fault_injection.py`
  - `FaultInjectionMiddleware(latency_ms, error_rate, timeout_rate)` for httpx/aiohttp
- **Test files:** `test_fault_scenarios.py` in execution-service, market-data-service, UCI
- **Scenarios:** timeout → circuit breaker opens; 429 → backoff; 50% error → degraded mode; cascade → alert event

### 7.10 Deterministic Tick Replay Engine (H9) — P3

- **New file:** `unified-trading-pm/scripts/dev/fixtures/tick_replay.py`
  - `TickReplayEngine` reads from `mock_data_dev_project` seed fixtures
  - `freezegun` for deterministic time; UAC `Tick` schema validation
- **Depends on:** `mock_data_dev_project_seeding_2026_03_10.md` seed fixtures

### 7.11 BigQuery Emulator (H1.3) — P3

- **Docker:** `ghcr.io/goccy/bigquery-emulator:latest` port `9050`
- **Env:** `BIGQUERY_EMULATOR_HOST=localhost:9050`
- **Scope:** trading-analytics-api, client-reporting-api DataSink writes

### 7.12 Nightly Cassette Drift Detection (H5.1) — P4

- **Workflow:** `unified-trading-pm/.github/workflows/cassette-drift-check.yml` — nightly 02:00 UTC
- Re-records cassettes against real APIs; schema-level diff (not byte diff) via Pydantic
- On drift: GitHub issue + Telegram alert (alerting-only, not blocking CI)

### 7.13 docker-compose.mock.yml + Demo Mode (H10) — P4

- **`unified-trading-pm/docker/docker-compose.mock.yml`** — all T2/T3 services in mock mode; optional GCP emulators;
  seed mounts
- **`unified-trading-pm/scripts/demo-mode.sh`** — single command: services + UIs (VITE_MOCK_API=true) + seeded data

---

### 7.x Venue / API Coverage Matrix

| Domain           | Venues                                                     | Current CI State             | After Phase 7       |
| ---------------- | ---------------------------------------------------------- | ---------------------------- | ------------------- |
| CeFi execution   | Binance, Coinbase, ByBit, OKX, Deribit, Hyperliquid, Upbit | `mode="sim"` ✓               | + fault injection   |
| TradFi execution | CME, CBOE, NYSE, NASDAQ, ICE, FX (IBKR)                    | `MagicMock(spec=IB)` ✓       | + WS TWS mock       |
| DeFi execution   | Hyperliquid REST, Aave, Morpho, Uniswap, Lido, EtherFi     | Hyperliquid excluded ✗       | H4.1 `responses` ✓  |
| Sports execution | 1xBet + others                                             | `aioresponses` + VCR ✓       | Complete cassettes  |
| Market data WS   | Binance WS, Deribit WS, OKX WS                             | No mock ✗                    | H3 WS simulator ✓   |
| Market data REST | Databento, Tardis, Yahoo Finance                           | VCR partial                  | H7 complete         |
| Market data DeFi | TheGraph, Alchemy, Pyth, BloxRoute                         | Live calls in CI ✗           | H7 `aioresponses` ✓ |
| Cloud infra GCP  | GCS, Pub/Sub, Secret Manager, BigQuery                     | LocalProvider partial        | H1 emulators ✓      |
| Cloud infra AWS  | S3, SQS, Secrets Manager                                   | `unittest.mock.patch` only ✗ | H2 moto ✓           |
| Reference data   | Databento, Tardis, OpenBB, FRED, ECB                       | VCR partial                  | H7 complete         |
