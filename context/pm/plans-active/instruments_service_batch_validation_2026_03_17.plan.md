---
name: instruments-service-batch-validation
overview: |
  End-to-end instruments-service architecture fix + batch validation.
  Serves as TEMPLATE for rolling the same pattern to all services.
  Covers: reference data centralization (UAC SSOT), cloud-storage config loading
  (ConfigReloader + TimeSeriesConfigStore), topology-driven transport, QG hardening.
type: infra
epic: epic-code-completion
status: active

completion_gates:
  code: C4
  deployment: D2
  business: B4

repo_gates:
  - repo: unified-api-contracts
    code: C4
    deployment: none
    business: none
  - repo: instruments-service
    code: C0
    deployment: none
    business: none
  - repo: market-data-processing-service
    code: C0
    deployment: none
    business: none
  - repo: unified-trading-library
    code: C0
    deployment: none
    business: none
  - repo: unified-config-interface
    code: C0
    deployment: none
    business: none

depends_on: []

todos:
  # ═══════════════════════════════════════════════════════════════
  # PHASE B1: UAC Reference Data Centralization (DONE)
  # ═══════════════════════════════════════════════════════════════
  - id: b1-tradfi-symbology
    content: |
      - [x] [AGENT] P0. Create UAC registry/tradfi_symbology.py
      Move DATABENTO_VALID_PARENT_SYMBOLS (86), DATABENTO_VALID_OPTIONS_SYMBOLS (8),
      EXCHANGE_CODE_TO_NAME (47), TRADFI_VENUE_MAPPINGS (51), KNOWN_ETFS (43),
      SPACE_TO_DOT_SYMBOLS (4) from instruments-service to UAC.
    status: done
    note: ""

  - id: b1-defi-protocol-registry
    content: |
      - [x] [AGENT] P0. Create UAC registry/defi_protocol_registry.py
      Move DEFI_VENUE_TO_PROTOCOL (14), DEFI_PROTOCOLS (15) from instruments-service.
    status: done
    note: ""

  - id: b1-market-data-categories
    content: |
      - [x] [AGENT] P0. Create UAC registry/market_data_categories.py
      Move DATA_TYPES_BY_CATEGORY, VENUES_BY_CATEGORY, TIMEFRAMES from MDPS.
    status: done
    note: ""

  - id: b1-venue-mapping-expansion
    content: |
      - [x] [AGENT] P0. Expand VenueMapping.all_tardis_exchanges from 10 to 19 venues
      Added Tier 2 (bitfinex, gemini, bitstamp) and Tier 3 (huobi, gate-io, phemex).
      Updated tardis_to_venue, venue_to_ccxt, venue_start_dates, instrument_type mappings.
      Preserved existing canonical names (BYBIT, OKX, COINBASE) for backward compat.
    status: done
    note: ""

  - id: b1-facade-exports
    content: |
      - [x] [AGENT] P0. Update UAC registry/__init__.py + __init__.py facade exports
      All new symbols importable via: from unified_api_contracts import TRADFI_VENUE_MAPPINGS, ...
    status: done
    note: ""

  - id: b1-qg
    content: |
      - [x] [AGENT] P0. UAC quality gates pass (pre-existing violations only)
    status: done
    note: "Pre-existing: __init__.py >900L, broad except in venue_context.py"

  # ═══════════════════════════════════════════════════════════════
  # PHASE B2: Consumer Updates (PARALLEL — 4 repos)
  # ═══════════════════════════════════════════════════════════════
  - id: b2-instruments-service
    content: |
      - [ ] [AGENT] P0. Update instruments-service: delete duplicates, import from UAC
      DELETE: config.py (501L legacy dup), config/defi_definitions.py (46L dup), config/tradfi_exchange_mappings.py
      MODIFY: config/instrument_definitions.py (remove TRADFI/DEFI constants, keep tickers)
      MODIFY: config/venue_config.py (import KNOWN_ETFS, SPACE_TO_DOT, EXCHANGE_CODE_TO_NAME from UAC)
      MODIFY: config/__init__.py (update re-exports)
      UPDATE: all importers across app/, cli/, engine/, tests/ to import from UAC
    status: in_progress
    note: "Background agent running"

  - id: b2-mdps
    content: |
      - [ ] [AGENT] P0. Update market-data-processing-service: import from UAC
      Remove local DATA_TYPES_BY_CATEGORY, VENUES_BY_CATEGORY, TIMEFRAMES.
      Import from unified_api_contracts. Convert enum keys to string keys for lookup.
    status: in_progress
    note: "Background agent running"

  - id: b2-features-delta-one
    content: |
      - [ ] [AGENT] P1. Update features-delta-one-service: import DATA_TYPES_BY_CATEGORY from UAC
    status: todo
    note: ""

  - id: b2-qg
    content: |
      - [ ] [AGENT] P0. Quality gates pass on all updated repos
    status: todo
    note: "SEQUENTIAL — after all B2 updates complete"

  # ═══════════════════════════════════════════════════════════════
  # PHASE C: Cloud Storage Config Loading (CRITICAL — Pattern Hardening)
  # This is the TEMPLATE PATTERN for all services.
  # ═══════════════════════════════════════════════════════════════
  - id: c1-config-gen-script
    content: |
      - [ ] [AGENT] P0. Create instruments-service config generation script
      Script: instruments-service/scripts/generate_domain_config.py
      Generates InstrumentDomainConfig + TickerUniverseConfig YAML.
      Uploads to cloud storage via ConfigStore.save_config() (cloud-agnostic — UCI routes to GCS/S3 based on CLOUD_PROVIDER).
      Path convention: {bucket}/instruments-reference-data/schema-v1.0/config-v{timestamp}.yaml
      Modes: --dry-run (print YAML), --upload (push to cloud storage), --historical (generate dated snapshots)
      Initially: same config for every date (S&P 500 current composition).
      Service doesn't know about GCS — it uses UCI ConfigStore which routes based on mode vars.
    status: todo
    note: "This script is the TEMPLATE for other services' config generators"

  - id: c2-wire-config-loading
    content: |
      - [ ] [AGENT] P0. Wire instruments-service to load config from cloud storage at startup
      instruments-service already has config_reloaders.py with DomainConfigReloader for InstrumentDomainConfig.
      Add: TickerUniverseConfig loading via TimeSeriesConfigStore.
      Batch mode: replay_at(target_date) loads config effective at that date.
      Live mode: start_watching() subscribes to PubSub for hot-reload.
      Fallback: when cloud storage is empty or CLOUD_MOCK_MODE=true, use embedded tickers.json defaults.
      Key: service uses UCI (cloud-agnostic), NOT direct GCS/S3 calls. UCI routes based on CLOUD_PROVIDER mode var.
    status: todo
    note: ""

  - id: c3-add-ticker-universe-config
    content: |
      - [ ] [AGENT] P1. Add TickerUniverseConfig to UCI domain_configs.py
      Fields: effective_date, sp500_tickers, etf_tickers, nasdaq_tickers, known_etf_symbols.
      Schema version 1.0. Extends BaseConfig.
    status: todo
    note: ""

  - id: c4-bootstrap-config
    content: |
      - [ ] [HUMAN+AGENT] P0. Generate and upload initial domain config to cloud storage
      Run: python scripts/generate_domain_config.py --upload --effective-date 2026-01-05
      Verify: config appears in cloud storage bucket at expected path
      Verify: instruments-service startup loads it via ConfigReloader
    status: todo
    note: "Requires cloud storage bucket to exist"

  - id: c5-verify-batch-replay
    content: |
      - [ ] [AGENT] P1. Verify batch replay_at() loads historical config correctly
      Test: TimeSeriesConfigStore.config_for_date(date(2026, 1, 5)) returns the uploaded config
      Test: ConfigReloader.replay_at(datetime(2026, 1, 5)) returns same config
      Test: instruments-service in batch mode uses replayed config, not hardcoded defaults
    status: todo
    note: ""

  - id: c6-defi-mvp-toggle
    content: |
      - [ ] [AGENT] P1. Add use_defi_mvp_tokens config toggle (default True)
      Add to InstrumentsServiceConfig. When True: filter DeFi to MVP tokens. When False: all tokens.
      This should be a config field that can be changed via cloud storage config, not just env var.
    status: todo
    note: ""

  # ═══════════════════════════════════════════════════════════════
  # PHASE B3: Topology-Driven Transport (UTL Extraction)
  # ═══════════════════════════════════════════════════════════════
  - id: b3-extract-topology-resolver
    content: |
      - [ ] [AGENT] P1. Extract topology resolver from deployment-service to UTL
      New module: unified_trading_library/topology/resolver.py
      Functions: read_runtime_topology(), resolve_transport(), get_downstream_consumers()
      deployment-service refactored to import from UTL instead of local impl.
      Update pyproject.toml + workspace-manifest.json if dep changes.
    status: todo
    note: ""

  - id: b3-wire-instruments-topology
    content: |
      - [ ] [AGENT] P1. Wire instruments-service to UTL topology resolver
      Replace hardcoded transport with mode-resolved (batch=cloud-storage, live=PubSub).
      Use VenueMapping.venue_to_data_provider (already in UAC) for protocol resolution.
    status: todo
    note: ""

  # ═══════════════════════════════════════════════════════════════
  # PHASE B4: Cleanup + Verification
  # ═══════════════════════════════════════════════════════════════
  - id: b4-cleanup
    content: |
      - [ ] [AGENT] P0. Delete all duplicate/superseded files, update deps, workspace grep
      Verify: zero stale imports, zero local definitions of UAC-owned symbols.
      No re-exports, no shims, no "# removed" comments.
      If any repo gains new deps: update pyproject.toml + workspace-manifest.json.
    status: todo
    note: ""

  # ═══════════════════════════════════════════════════════════════
  # PHASE A: Batch Validation (After Architecture is Clean)
  # ═══════════════════════════════════════════════════════════════
  - id: a1-api-keys
    content: |
      - [ ] [HUMAN] P0. Verify API keys (Tardis, Databento, TheGraph)
      Test both Tardis keys on free first-of-month date. Use whichever works.
      instruments-service hands key NAME to UMI/URDI; interface does actual connecting.
    status: todo
    note: ""

  - id: a2-batch-run
    content: |
      - [ ] [HUMAN+AGENT] P0. Run instruments-service batch for Jan 5 2026
      All 3 categories (CEFI, TRADFI, DEFI) with --force --dry-run first.
      Then real cloud storage write if buckets available.
      Verify: config loaded from cloud storage (not hardcoded), output parquet valid.
    status: todo
    note: ""

  # ═══════════════════════════════════════════════════════════════
  # PHASE D: Cross-Service Rollout (Use This Plan as Template)
  # ═══════════════════════════════════════════════════════════════
  - id: d-rollout-template
    content: |
      - [ ] [AGENT] P2. Use instruments-service as template — audit + fix all 17 services
      For each service: (1) move hardcoded reference data to UAC, (2) wire config loading
      from cloud storage via ConfigReloader, (3) create config generation script,
      (4) verify topology-driven transport, (5) run quality gates.
      Pattern: config generation script per domain, cloud-agnostic via UCI,
      batch=replay_at(), live=start_watching().
    status: todo
    note: "PARALLEL — up to 17 agents after instruments-service pattern is proven"

  # ═══════════════════════════════════════════════════════════════
  # PHASE E: Quality Gate Hardening
  # ═══════════════════════════════════════════════════════════════
  - id: e-qg-checks
    content: |
      - [ ] [AGENT] P2. Add codex checks that catch these architectural violations
      E1: No local venue/protocol/data-type lists in services (should import from UAC)
      E2: No duplicate constants across repos (workspace-level check)
      E3: Config-from-cloud-storage readiness (ConfigReloader/TimeSeriesConfigStore usage)
      E4: MVP hardcoding detection (behind config toggle, not hardcoded)
      Start as WARN, graduate to FAIL after rollout complete.
    status: todo
    note: ""

isProject: false
---

## Context

### Problem

Services hardcode reference data and config that should come from:

1. **UAC** (static reference data — venues, symbology, protocols)
2. **Cloud storage** via UCI ConfigStore (dynamic config — ticker universes, strategy params)
3. **Runtime topology DAG** (transport selection — batch=cloud-storage, live=PubSub)

### Config Loading Architecture (How It Should Work)

```
Mode vars (CLOUD_MOCK_MODE, CLOUD_PROVIDER, RUNTIME_MODE)
  → UTL receives, injects into libraries
  → UCI ConfigStore routes to cloud storage (GCS/S3 — cloud-agnostic)
  → ConfigReloader:
      batch → replay_at(target_date) loads historical config from cloud storage
      live  → start_watching() subscribes to PubSub for hot-reload
  → Runtime topology DAG resolves: transport, downstream consumers
  → UAC venue registry resolves: available venues, data sources, protocols
  → Service self-configures from mode + topology + registry + cloud config
```

Key: **Services never know about GCS/S3 directly.** They use UCI ConfigStore which routes based on CLOUD_PROVIDER mode
var. Cloud storage is an implementation detail.

### Config Infrastructure State (as of 2026-03-18)

- ConfigReloader: ✅ supports both batch replay_at() and live start_watching()
- TimeSeriesConfigStore: ✅ supports config_for_date() for historical snapshots
- DomainConfigReloader: ✅ wired in 30+ services (including instruments-service)
- Domain configs in cloud storage: ❌ NONE generated yet
- Config generation scripts: ❌ NONE exist for domain configs
- This plan fixes instruments-service first, then templates for all services.

### Execution DAG

```
Phase B1 (UAC additions) ✅ DONE
     │
     ▼
Phase B2 (consumer updates) — IN PROGRESS (background agents)
     │  + Phase C (cloud storage config) — NEXT
     │
     ▼
Phase B3 (topology: extract resolver to UTL)
     │
     ▼
Phase B4 (cleanup)
     │
     ▼
Phase A (batch validation with clean architecture)
     │
     ▼
Phase D (cross-service rollout using instruments-service as template)
     │
     ▼
Phase E (QG hardening — catch violations automatically)
```

### Template Pattern for All Services (established by instruments-service)

1. **Reference data** → import from UAC (no local definitions)
2. **Domain config** → load from cloud storage via ConfigReloader (UCI routes cloud-agnostically)
3. **Config generation** → per-service script that populates ConfigStore
4. **Batch mode** → `TimeSeriesConfigStore.config_for_date(date)` loads historical config
5. **Live mode** → `DomainConfigReloader.start_watching()` subscribes to PubSub
6. **Transport** → resolved from runtime topology DAG via UTL resolver
7. **Fallback** → embedded defaults when cloud storage empty or CLOUD_MOCK_MODE=true
