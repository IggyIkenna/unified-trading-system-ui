---
name: mock-data-rollout-2026-03-18
overview: >
  Wire SyntheticDataGenerator + MockStateStore into all services, create dependency-ordered seed orchestration, generate
  1-year mock data to dev GCS, add APY→index conversion utility, and validate full-stack mock mode. Covers 27 repos
  across 6 phases with upstream validation at each layer boundary.
type: mixed
epic: epic-code-completion
status: active

completion_gates:
  code: C5
  deployment: none
  business: none

repo_gates:
  # Phase 1 — Library Foundation
  - repo: unified-trading-library
    code: C2
    deployment: none
    business: none
    readiness_note: "DONE: APY→index converter (facf971d), 20 new tests, 1398 total passing"
  - repo: unified-internal-contracts
    code: C2
    deployment: none
    business: none
    readiness_note: "DONE: SyntheticDataGenerator index columns + staking rates, 21 new tests"
  - repo: unified-cloud-interface
    code: C2
    deployment: none
    business: none
    readiness_note: "DONE: get_event_sink() factory (4f548d6), 13 new tests, all 6 provider×mode combos"
  - repo: unified-config-interface
    code: C2
    deployment: none
    business: none
    readiness_note: "DONE: cloud_mock_mode deprecation + is_mock_mode() (a014abc), 8 new tests"
  # Phase 2 — Seed Infrastructure
  - repo: unified-trading-pm
    code: C2
    deployment: none
    business: none
    readiness_note: "DONE: generate-mock-data.sh (b38ed34), runtime topology dual-cloud (ca6bcd3), validate-mock-upstream.sh (d4355ad)"
  # Phase 3 — Service Wiring (Layer 1-2: Data Ingestion)
  - repo: instruments-service
    code: C0
    deployment: none
    business: none
  - repo: market-tick-data-service
    code: C0
    deployment: none
    business: none
  - repo: market-data-processing-service
    code: C0
    deployment: none
    business: none
  # Phase 3 — Service Wiring (Layer 3: Features — all PARALLEL)
  - repo: features-delta-one-service
    code: C0
    deployment: none
    business: none
  - repo: features-volatility-service
    code: C0
    deployment: none
    business: none
  - repo: features-onchain-service
    code: C0
    deployment: none
    business: none
  - repo: features-cross-instrument-service
    code: C0
    deployment: none
    business: none
  - repo: features-multi-timeframe-service
    code: C0
    deployment: none
    business: none
  - repo: features-commodity-service
    code: C0
    deployment: none
    business: none
  - repo: features-calendar-service
    code: C0
    deployment: none
    business: none
  - repo: features-sports-service
    code: C0
    deployment: none
    business: none
  # Phase 3 — Service Wiring (Layer 4: ML)
  - repo: ml-training-service
    code: C0
    deployment: none
    business: none
  - repo: ml-inference-service
    code: C0
    deployment: none
    business: none
  # Phase 3 — Service Wiring (Layer 5: Strategy + Execution)
  - repo: strategy-service
    code: C0
    deployment: none
    business: none
  - repo: execution-service
    code: C0
    deployment: none
    business: none
  # Phase 3 — Service Wiring (Layer 6: Monitoring)
  - repo: risk-and-exposure-service
    code: C0
    deployment: none
    business: none
  - repo: position-balance-monitor-service
    code: C0
    deployment: none
    business: none
  - repo: pnl-attribution-service
    code: C0
    deployment: none
    business: none
  - repo: alerting-service
    code: C0
    deployment: none
    business: none
  - repo: batch-live-reconciliation-service
    code: C0
    deployment: none
    business: none
  - repo: trading-agent-service
    code: C0
    deployment: none
    business: none
  # Phase 5 — Validation
  - repo: system-integration-tests
    code: C0
    deployment: none
    business: none

depends_on:
  - instruments-service-batch-validation-2026-03-17

todos:
  # ═══════════════════════════════════════════════════════════════════
  # PHASE 1: Library Foundation (PARALLEL — no inter-dependencies)
  # Gate: All 4 library QGs pass before Phase 2 starts
  # ═══════════════════════════════════════════════════════════════════

  - id: p1-utl-apy-index
    content: |
      - [x] [AGENT] P0. Add apy_to_cumulative_index(apy_series, timestamps) and staking_rate_to_index(rate_series, timestamps) utilities to unified-trading-library/core/. Both take a time-series of annualised rates and produce a cumulative index (base=1.0). Used by SyntheticDataGenerator and all downstream consumers. Add unit tests (edge cases: zero APY, negative rates, single-point series, leap seconds). PARALLEL with p1-uic-synth, p1-uci-sink, p1-ucfgi-deprecate.
    status: done
  - id: p1-uic-synth
    content: |
      - [x] [AGENT] P0. Enhance SyntheticDataGenerator in unified-internal-contracts/testing/synthetic.py: (a) generate_defi_yields() now also returns cumulative index columns (liquidity_index, variable_borrow_index) using UTL's apy_to_cumulative_index(), (b) add generate_staking_rates() for ETH staking / LST rates using OU mean reversion + rate→index conversion, (c) seed_spec.yaml: add staking parameters (Lido, EtherFi, Rocket Pool) alongside existing Aave/Curve/Uniswap. Add tests validating index monotonicity and APY↔index round-trip consistency. PARALLEL.
    status: done
  - id: p1-uci-sink
    content: |
      - [x] [AGENT] P1. Add get_event_sink(mode, service_name, project_id_or_region) factory to unified-cloud-interface that auto-selects the correct EventSink based on CLOUD_PROVIDER + RUNTIME_MODE: (GCP+batch→GcsEventSink, GCP+live→CompositeEventSink[PubSub+GCS], AWS+batch→S3EventSink, AWS+live→CompositeEventSink[Queue+S3], local→LocalFsEventSink). Remove hardcoded GcsEventSink from service bootstrap code (execution-service, strategy-service, market-tick-data-service — update their main.py to call get_event_sink). Add unit tests for all 6 provider×mode combinations. PARALLEL.
    status: done
  - id: p1-ucfgi-deprecate
    content: |
      - [x] [AGENT] P1. In unified-config-interface cloud_config.py: add DeprecationWarning on cloud_mock_mode property access ("Use data_mode instead"). Update docstring to mark as legacy. Do NOT remove the field (backwards compat bridge stays). Grep all 31 services for direct cloud_mock_mode access — document list in this plan's notes section. Migration of services to data_mode is Phase 3 work. PARALLEL.
    status: done

  # ═══════════════════════════════════════════════════════════════════
  # PHASE 2: Seed Infrastructure (depends on Phase 1)
  # Gate: PM QG passes before Phase 3 starts
  # ═══════════════════════════════════════════════════════════════════

  - id: p2-topology-dual-cloud
    content: |
      - [x] [AGENT] P1. Update unified-trading-pm/configs/runtime-topology.yaml: each edge's transport_by_mode must define BOTH gcp and aws options. batch: {gcp: gcs, aws: s3}, live: {gcp: pubsub, aws: sqs}. Persistence sink: {gcp: gcs, aws: s3}. Update deployment-service runtime_topology_validator.py to validate dual-cloud structure. The actual transport used is determined by CLOUD_PROVIDER at deployment time, not hardcoded. SEQUENTIAL before p2-seed-script.
    status: done
  - id: p2-seed-script
    content: |
      - [x] [AGENT] P0. Create unified-trading-pm/scripts/dev/generate-mock-data.sh — dependency-ordered seed orchestration: (1) instruments, (2) market-tick-data + market-data-processing, (3) all 8 feature services PARALLEL, (4) ML services PARALLEL, (5) strategy + execution PARALLEL, (6) risk + position-balance + pnl-attribution PARALLEL, (7) alerting + reconciliation + trading-agent PARALLEL. Each step: (a) validates upstream mock data exists in GCS (or local emulator) via DependencyChecker path templates, (b) calls per-service scripts/seed_mock_data.py, (c) reports success/failure. Fail-fast: if upstream validation fails, skip downstream and report. Uses SyntheticDataGenerator with seed_spec.yaml (scenario=normal, seed=42). Output: Parquet files at SeedDataWriter partition paths. Env-tagged bucket via UCI get_bucket_name(). SEQUENTIAL after p2-topology-dual-cloud.
    status: done
  - id: p2-upstream-validator
    content: |
      - [x] [AGENT] P1. Create unified-trading-pm/scripts/dev/validate-mock-upstream.sh — standalone script that checks if upstream mock data exists for a given service. Reads runtime-topology.yaml to find upstream producers, resolves GCS paths via DependencyChecker templates, checks blob existence. Exit 0 if all upstream present, exit 1 with missing list. Called by generate-mock-data.sh before each service seed step. Also usable standalone: `bash validate-mock-upstream.sh --service features-delta-one-service --env dev`. PARALLEL with p2-seed-script.
    status: done

  # ═══════════════════════════════════════════════════════════════════
  # PHASE 3: Per-Service Seed Data Wiring (depends on Phase 1+2)
  # SEQUENTIAL by dependency layer; PARALLEL within each layer
  # Gate: Each layer's QG passes before next layer starts
  # ═══════════════════════════════════════════════════════════════════

  # --- Layer 1: Data Ingestion (SEQUENTIAL — instruments first) ---

  - id: p3-L1-instruments
    content: |
      - [ ] [AGENT] P0. instruments-service: Create scripts/seed_mock_data.py that generates mock instrument definitions using real instrument lists where available (CeFi: top 50 crypto pairs, TradFi: S&P 100 + major futures, DeFi: Aave/Uniswap/Lido pools). For instruments without live data, use SyntheticDataGenerator seed_spec.yaml instrument list. Output: instrument_availability Parquet at DependencyChecker path template. TODO: replace with real instruments when live data pipeline is ready (no code change needed — just repoint seed source). Wire DATA_MODE check in service startup: when mock, load from seed Parquet instead of live API. SEQUENTIAL — must complete before Layer 2.
    status: done

  # --- Layer 2: Market Data (depends on Layer 1; PARALLEL within) ---

  - id: p3-L2-tick-data
    content: |
      - [x] [AGENT] P0. market-tick-data-service: Create scripts/seed_mock_data.py that reads instrument list from Layer 1 seed output, generates 1-year of synthetic tick data per instrument using SyntheticDataGenerator.generate_tick_trades(). Output: Parquet at tick/{venue}/{symbol}/data.parquet. Validate instrument IDs match Layer 1 output. PARALLEL with p3-L2-processing.
    status: done
  - id: p3-L2-processing
    content: |
      - [x] [AGENT] P0. market-data-processing-service: Create scripts/seed_mock_data.py that reads tick data from Layer 2 seed output (or generates OHLCV directly from SyntheticDataGenerator.generate_ohlcv()). Includes oracle adapter mock: oracle prices + yields for DeFi instruments using generate_defi_yields() with index columns. Output: CandleOutput Parquet at ohlcv/{symbol}/{year}/{month}/{day}/data.parquet. DeFi oracle output includes mark_price, rate, liquidity_index, variable_borrow_index columns. PARALLEL with p3-L2-tick-data.
    status: done

  # --- Layer 3: Features (depends on Layer 2; ALL PARALLEL) ---

  - id: p3-L3-features
    content: |
      - [x] [AGENT] P0. ALL 8 feature services (features-delta-one, features-volatility, features-onchain, features-cross-instrument, features-multi-timeframe, features-commodity, features-calendar, features-sports): Create scripts/seed_mock_data.py in EACH that reads upstream candle/oracle data from Layer 2, runs the service's feature calculation pipeline in mock mode, outputs feature Parquet. Ensure minimum lookback requirement is met (typically 30-90 days; use service's own MIN_LOOKBACK constant). For features-onchain: use index-based calculations (liquidity_index from Layer 2 oracle data, NOT raw APY proxy). For features-sports: use SyntheticDataGenerator.generate_match_odds(). ALL 8 services run PARALLEL. Each service's scripts/seed_mock_data.py validates upstream candle data exists before running.
    status: done

  # --- Layer 4: ML (depends on Layer 3; PARALLEL within) ---

  - id: p3-L4-ml
    content: |
      - [ ] [AGENT] P1. ml-training-service + ml-inference-service: Create scripts/seed_mock_data.py in each. ml-training reads feature data from Layer 3, produces mock trained model artifacts (serialised dummy model + metrics). ml-inference reads model artifacts + feature data, produces mock prediction outputs. Both already have some seed scripts (ml-training has seed_mock_features_to_gcs.py) — extend or align with SyntheticDataGenerator output format. PARALLEL within layer.
    status: done

  # --- Layer 5: Strategy + Execution (depends on Layers 3-4; PARALLEL) ---

  - id: p3-L5-strategy-execution
    content: |
      - [ ] [AGENT] P0. strategy-service + execution-service: Create/update scripts/seed_mock_data.py. strategy-service reads features + ML predictions, produces mock strategy signals and backtest results. execution-service reads strategy signals, produces mock order fills and execution results (already has create_mock_data.py — align with upstream seed format). Both use index-based settlement for DeFi positions (liquidity_index growth, not raw APY). Validate DeFi P&L uses apy_to_cumulative_index() from UTL. PARALLEL within layer.
    status: done

  # --- Layer 6: Monitoring (depends on Layer 5; PARALLEL) ---

  - id: p3-L6-monitoring
    content: |
      - [ ] [AGENT] P1. risk-and-exposure-service + position-balance-monitor-service + pnl-attribution-service: Create scripts/seed_mock_data.py in each. Read execution results from Layer 5, produce mock risk metrics, position snapshots, PnL attribution reports. risk-and-exposure uses index-based DeFi reconciliation (defi_reconciliation.py). PARALLEL within layer.
    status: done

  # --- Layer 7: Alerting + Support (depends on Layer 6; PARALLEL) ---

  - id: p3-L7-support
    content: |
      - [ ] [AGENT] P2. alerting-service + batch-live-reconciliation-service + trading-agent-service: Create scripts/seed_mock_data.py in each. alerting reads risk events from Layer 6, produces mock alerts. reconciliation reads position + execution data, produces mock reconciliation reports. trading-agent reads strategy signals, produces mock agent decisions. PARALLEL within layer.
    status: done

  # --- Service data_mode migration (PARALLEL with Layer wiring) ---

  - id: p3-data-mode-migration
    content: |
      - [ ] [AGENT] P0. Migrate ALL 22 repos (10 APIs + 11 workers + UTL) from cloud_mock_mode to is_mock_mode(). 120 production code references across 22 repos. Replace cfg.cloud_mock_mode with cfg.is_mock_mode(), config.cloud_mock_mode with config.is_mock_mode(), health endpoint reports with is_mock_mode(). Services with own cloud_mock_mode field (market-tick-data, market-data-processing, deployment-api): remove redundant field, delegate to UnifiedCloudConfig. Run QG per repo.
    status: done

  - id: p3-seed-cloud-storage
    content: |
      - [ ] [AGENT] P0. Upgrade all 21 seed scripts to support cloud storage writes. Create shared UTL seed_writer.py (LocalWriter + CloudWriter). When --env local: write to filesystem (existing). When --env dev: write to GCS/S3 via get_storage_client() at mock/ prefix (get_data_path_prefix()). Update all 21 scripts to use shared writer. Mock data goes to gs://{bucket}/mock/{path} — same bucket as real data, isolated by prefix. Services read from mock/ prefix when DATA_MODE=mock (DependencyChecker already handles this via get_data_path_prefix).
    status: done

  # ═══════════════════════════════════════════════════════════════════
  # PHASE 4: Data Generation & GCS Upload (depends on Phase 3)
  # Gate: generate-mock-data.sh completes with 0 failures
  # ═══════════════════════════════════════════════════════════════════

  - id: p4-generate-upload
    content: |
      - [ ] [HUMAN+AGENT] P0. Run generate-mock-data.sh against dev GCS bucket (or local fake-gcs-server emulator): (1) Set DEPLOYMENT_ENV=dev, CLOUD_PROVIDER=local (or gcp if dev project available), DATA_MODE=mock. (2) Execute full dependency chain — instruments through alerting. (3) Verify Parquet files at expected paths. (4) Verify total data size (1 year × 100+ instruments ≈ estimate and document). (5) If using real GCS: verify bucket naming follows UCI convention ({prefix}-{category}-dev-{project_id}).
    status: todo
  - id: p4-api-seed-alignment
    content: |
      - [ ] [AGENT] P1. Align existing 10 API MockStateStore seed data with generated mock data. APIs (config-api, ml-training-api, ml-inference-api, execution-results-api, trading-analytics-api, batch-audit-api, market-data-api, client-reporting-api, deployment-api) already have mock_data.py — verify their mock instruments, symbols, and IDs match the seed_spec.yaml instrument list. Update static mock data to reference the same instrument IDs used in generated Parquet. PARALLEL within phase.
    status: todo

  # ═══════════════════════════════════════════════════════════════════
  # PHASE 5: Validation (depends on Phase 4)
  # Gate: All services start in mock mode and consume upstream data
  # ═══════════════════════════════════════════════════════════════════

  - id: p5-mock-mode-smoke
    content: |
      - [ ] [AGENT] P0. system-integration-tests: Add tests/smoke/test_mock_data_chain.py — starts each service layer sequentially in mock mode (DATA_MODE=mock, CLOUD_PROVIDER=local), validates: (a) service starts without error, (b) upstream data is found by DependencyChecker, (c) service produces expected output format, (d) output matches UIC/UAC schemas. Uses existing GCP emulators (fake-gcs-server, PubSub emulator). Runs as part of SIT quality gates.
    status: todo
  - id: p5-workspace-qg
    content: |
      - [ ] [AGENT] P0. Run quality-gates.sh for ALL 27 affected repos. All must pass. Document any pre-existing failures vs new regressions. This is the final gate before plan completion.
    status: todo

  # ═══════════════════════════════════════════════════════════════════
  # OUT-OF-SCOPE (tracked as related items, not blockers)
  # ═══════════════════════════════════════════════════════════════════

  - id: oos-cloud-agnostic-bootstrap
    content: |
      - [ ] [AGENT] P2. OUT-OF-SCOPE for this plan (tracked for follow-up). Service bootstrap code hardcodes GcsEventSink in several services. Phase 1 p1-uci-sink creates the factory; this item updates ALL remaining services to use it. Deferred because p1-uci-sink covers the 3 most critical services.
    status: todo
    note: "Deferred — p1-uci-sink covers execution-service, strategy-service, market-tick-data-service"
  - id: oos-gcp-fallback-removal
    content: |
      - [ ] [AGENT] P2. OUT-OF-SCOPE. Remove hardcoded "gcp" fallback defaults in service code (strategy-service cloud_provider defaults to "gcp" if missing). Should raise ValueError instead. Requires workspace-wide grep + fix.
    status: todo
    note: "Deferred — does not block mock data rollout"
  - id: oos-real-instruments
    content: |
      - [ ] [HUMAN] P3. OUT-OF-SCOPE. Replace mock instrument seed with real instruments from live exchanges. No code change needed in services — just update seed source in instruments-service/scripts/seed_mock_data.py to pull from live reference data instead of seed_spec.yaml.
    status: todo
    note: "TODO — mock instruments work for now; switch to real when live pipeline is ready"
  - id: oos-fault-config-wiring
    content: |
      - [ ] [AGENT] P3. OUT-OF-SCOPE. Wire FaultConfig from ScenarioConfig YAML into mock venue/client factories so services automatically get fault injection when running scenarios like bust.yaml or delayed_data.yaml. Framework exists but services don't consume it.
    status: todo
    note: "Deferred — separate concern from mock data"
  - id: oos-perf-regression-ci
    content: |
      - [ ] [AGENT] P3. OUT-OF-SCOPE. Automated benchmark regression detection — compare current vs main, alert on >5% regression. Memory leak CI gate (tracemalloc threshold). Currently defined in codex but not enforced.
    status: todo
    note: "Deferred — separate plan for CI/CD hardening"
  - id: oos-cloud-storage-mock-prefix
    content: |
      - [x] [AGENT] P1. MOVED IN-SCOPE as p3-seed-cloud-storage. UCI get_data_path_prefix (e6fd313) + UTL DependencyChecker mock/ prefix (59a9942f) done. Seed script upgrade in progress.
    status: done
    note: "Promoted from OOS to in-scope 2026-03-18"

isProject: false
---

# Mock Data Rollout — Context & Architecture

## Execution DAG (Dependency Graph)

```mermaid
flowchart TD
    subgraph Phase1["Phase 1: Library Foundation (PARALLEL)"]
        UTL[UTL: APY→index converter]
        UIC[UIC: SyntheticDataGenerator + index]
        UCI[UCI: get_event_sink factory]
        UCfgI[UCfgI: cloud_mock_mode deprecation]
    end

    subgraph Phase2["Phase 2: Seed Infrastructure"]
        TOPO[PM: Topology dual-cloud]
        SEED[PM: generate-mock-data.sh]
        VALID[PM: validate-mock-upstream.sh]
        TOPO --> SEED
    end

    Phase1 --> Phase2

    subgraph Phase3["Phase 3: Per-Service Wiring (SEQUENTIAL layers)"]
        L1[L1: instruments-service]
        L2[L2: market-tick-data + processing]
        L3[L3: 8 feature services PARALLEL]
        L4[L4: ML training + inference]
        L5[L5: strategy + execution]
        L6[L6: risk + position + pnl]
        L7[L7: alerting + reconciliation + agent]
        DM[data_mode migration — all services]

        L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7
    end

    Phase2 --> Phase3

    subgraph Phase4["Phase 4: Generate & Upload"]
        GEN[Run generate-mock-data.sh → dev GCS]
        API[Align API MockStateStore seed data]
    end

    Phase3 --> Phase4

    subgraph Phase5["Phase 5: Validation"]
        SMOKE[SIT: mock data chain smoke test]
        QG[All 27 repos QG pass]
    end

    Phase4 --> Phase5
```

## Key Design Decisions

1. **Mock in yield space, consume in index space**: SyntheticDataGenerator produces APY via OU mean reversion (easier to
   model), then UTL's `apy_to_cumulative_index()` converts to cumulative indices for downstream consumption. Services
   never see raw APY — they get index columns in their candle/feature data.

2. **Real instruments preferred, mock as starting point**: instruments-service seed uses real instrument lists (top 50
   crypto, S&P 100, major DeFi pools) where available. Synthetic prices are generated against real instrument IDs. When
   live reference data pipeline is ready, just repoint seed source — no code change.

3. **Seed scripts live in services, orchestration in PM**: Each service owns `scripts/seed_mock_data.py` (knows its
   domain). PM owns `scripts/dev/generate-mock-data.sh` (knows the dependency order from runtime-topology.yaml).

4. **1-year of data, normal scenario, seed=42**: Deterministic and reproducible. `seed_spec.yaml` already defines 100+
   instruments with calibrated GBM parameters. Volume profiles use hour-of-day weighting. Cross-asset correlations
   preserved (BTC-ETH: 0.85).

5. **Upstream validation before seeding**: Each layer validates its upstream mock data exists before running. Fail-fast:
   if instruments seed is missing, don't attempt market data generation.

6. **APIs already done, workers need seed data**: 10 HTTP APIs have MockStateStore (complete). 21 worker services need
   `scripts/seed_mock_data.py` (generates Parquet for their domain). Workers don't need MockStateStore — they need mock
   INPUT data at their DependencyChecker path templates.

7. **Oracle data is not a standalone service**: It's `DefiOracleAdapter` inside market-data-processing-service. Oracle
   mock data (mark_price, liquidity_index, borrow_index) is generated in Layer 2 as part of market-data-processing seed.

## Pre-Audit Manifest

### Symbols being added (new exports)

| Symbol                      | Repo | File                   | Consumers                                                                                                   |
| --------------------------- | ---- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `apy_to_cumulative_index()` | UTL  | `core/index_utils.py`  | UIC SyntheticDataGenerator, features-onchain, strategy-service settlement, all DeFi seed scripts            |
| `staking_rate_to_index()`   | UTL  | `core/index_utils.py`  | UIC SyntheticDataGenerator, features-onchain LST calculator, strategy-service LST settlement                |
| `get_event_sink()`          | UCI  | `factory.py`           | execution-service, strategy-service, market-tick-data-service (Phase 1); all other services (OOS follow-up) |
| `generate_staking_rates()`  | UIC  | `testing/synthetic.py` | Seed scripts for features-onchain, strategy-service DeFi settlement tests                                   |

### Symbols being deprecated (not removed)

| Symbol                     | Repo  | File              | Action                                                                          |
| -------------------------- | ----- | ----------------- | ------------------------------------------------------------------------------- |
| `cloud_mock_mode` property | UCfgI | `cloud_config.py` | Add DeprecationWarning; keep bridge; services migrate to `data_mode` in Phase 3 |

### Services checked for mock readiness (audit 2026-03-18)

All 31 services:

- 31/31 use UnifiedCloudConfig (no os.getenv for mock mode)
- 31/31 reference CLOUD_MOCK_MODE in config
- 10/31 have MockStateStore (all HTTP APIs — complete)
- 21/31 need seed data scripts (worker services — this plan)
- 0/31 have hardcoded mock data or fraudulent implementations
- 0/31 use direct cloud SDK in production paths (except deployment-service — approved exception)

### Cloud-agnosticism audit (2026-03-18)

| Component                                          | Status                    | Gap                                            |
| -------------------------------------------------- | ------------------------- | ---------------------------------------------- |
| UCI factory (get_storage_client, get_queue_client) | Cloud-agnostic            | None                                           |
| UTL DependencyChecker                              | Cloud-agnostic (uses UCI) | Property named gcs_client (legacy naming only) |
| Event sinks (UTL)                                  | Both GCP+AWS implemented  | No auto-select factory (fixed in p1-uci-sink)  |
| Runtime topology YAML                              | GCP-only                  | Fixed in p2-topology-dual-cloud                |
| Service bootstrap                                  | Mostly agnostic           | Some GCP fallback defaults (OOS fix)           |

### DeFi index vs APY audit (2026-03-18)

- Strategy-service settlement: correctly uses index-based P&L (liquidity_index, variableBorrowIndex growth)
- LST staking: uses weETH/ETH rate appreciation (rate proxy, not true index)
- SyntheticDataGenerator: generates raw APY only — NO index output (fixed in p1-uic-synth)
- features-onchain: uses simplified APY→index proxy (1.0 + apy/100) — should use cumulative index
- No shared APY→index converter exists (added in p1-utl-apy-index)

## Success Criteria

### Phase 1

- UTL: `apy_to_cumulative_index()` and `staking_rate_to_index()` exist with ≥95% test coverage
- UIC: `generate_defi_yields()` returns both APY and index columns; `generate_staking_rates()` exists
- UCI: `get_event_sink()` factory exists, tested for all 6 provider×mode combinations
- UCfgI: `cloud_mock_mode` access emits DeprecationWarning; `data_mode` documented as canonical
- All 4 library QGs pass

### Phase 2

- `generate-mock-data.sh` exists and runs end-to-end (even if services don't have seed scripts yet — it should
  gracefully report "no seed script" per service)
- `validate-mock-upstream.sh` exists and correctly identifies missing upstream data
- Runtime topology YAML has dual-cloud transport options
- PM QG passes

### Phase 3

- All 21 worker services have `scripts/seed_mock_data.py`
- Each seed script generates domain-appropriate Parquet at DependencyChecker path templates
- All services use `data_mode` instead of `cloud_mock_mode`
- Per-layer QG pass (run after each layer completes)

### Phase 4

- Full dependency chain runs without failures
- 1-year Parquet data at expected GCS/emulator paths for all services
- API MockStateStore seed data uses same instrument IDs as generated Parquet

### Phase 5

- SIT mock data chain smoke test passes
- All 27 affected repo QGs pass
- No pre-existing failures introduced as regressions

## Related Plans

- `production_mock_e2e_plan_d90c8f20` — E2E testability (VCR, mock replay, CI hermeticity). Complementary, not
  overlapping. That plan = test-time mocking. This plan = runtime mock data generation.
- `instruments_service_batch_validation_2026_03_17` — instruments-service architecture fix. Our p3-L1-instruments
  depends on the ConfigReloader + topology-driven transport patterns from that plan.
- `live_batch_alignment_audit_2026_03_18` — live/batch parity remediation. Our event sink factory (p1-uci-sink) aligns
  with that plan's event sink fixes.
- `defi_operation_capability_and_pipeline_2026_03_17` — DeFi pipeline. Our APY→index converter (p1-utl-apy-index)
  directly supports that plan's DeFi settlement calculations.
