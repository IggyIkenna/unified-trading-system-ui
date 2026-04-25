---
name: cross-service-architecture-audit-remediation
overview: |
  Citadel-grade architecture audit of all 21 services (excluding instruments-service, already
  being fixed). Identifies and remediates: reference data duplication, config violations,
  domain boundary violations, runtime mode/topology violations, direct cloud SDK usage,
  and duplicate type definitions. Uses instruments-service batch-validation plan as template.
type: infra
epic: epic-code-completion
status: done

completion_gates:
  code: C4
  deployment: D2
  business: B4

depends_on:
  - instruments-service-batch-validation

todos:
  # ═══════════════════════════════════════════════════════════════
  # AUDIT RESULTS SUMMARY (2026-03-18)
  # ═══════════════════════════════════════════════════════════════
  #
  # 21 services audited in parallel. 6 violation categories checked:
  #   1. Reference data duplication (should be in UAC)
  #   2. Config violations (os.getenv, hardcoded config, duplicate schemas)
  #   3. Domain boundary violations (cross-service imports, duplicate types)
  #   4. Runtime mode / topology violations (mode vars, transport, ConfigReloader)
  #   5. Direct cloud SDK usage (google.cloud.*, boto3)
  #   6. Duplicate type definitions (Pydantic/enum/dataclass duplicating UAC/UIC/UTL)
  #
  # ┌──────────────────────────────────────┬───────┬──────────────────────────────────┐
  # │ Service                              │ Grade │ Violations                       │
  # ├──────────────────────────────────────┼───────┼──────────────────────────────────┤
  # │ features-onchain-service             │ FAIL  │ 9 (2C, 4H, 2M, 1L)              │
  # │ features-delta-one-service           │ FAIL  │ 8 (5H, 2M, 1L)                  │
  # │ ml-training-service                  │ FAIL  │ 7 (1C, 5H, 1L)                  │
  # │ ml-inference-service                 │ FAIL  │ 7 (6M, 1L)                       │
  # │ features-volatility-service          │ WARN  │ 5 (2M, 3L)                       │
  # │ strategy-service                     │ WARN  │ 4 (4M)                           │
  # │ features-commodity-service           │ WARN  │ 2 (2M)                           │
  # │ execution-service                    │ WARN  │ 2 (1C, 1M)                       │
  # │ deployment-service                   │ WARN  │ 2 (1M, 1L)                       │
  # │ features-cross-instrument-service    │ WARN  │ 2 (1M, 1L)                       │
  # │ risk-and-exposure-service            │ WARN  │ 1 (1C) + 1 warning               │
  # │ market-data-processing-service       │ PASS* │ 1 (1M)                           │
  # │ position-balance-monitor-service     │ PASS* │ 1 (1M)                           │
  # │ alerting-service                     │ PASS* │ 1 (1M type:ignore)               │
  # │ batch-live-reconciliation-service    │ PASS  │ 0                                │
  # │ market-tick-data-service             │ PASS  │ 0                                │
  # │ pnl-attribution-service              │ PASS  │ 0                                │
  # │ features-calendar-service            │ PASS  │ 0                                │
  # │ features-multi-timeframe-service     │ PASS  │ 0                                │
  # │ features-sports-service              │ PASS  │ 0                                │
  # │ trading-agent-service                │ PASS  │ 0                                │
  # └──────────────────────────────────────┴───────┴──────────────────────────────────┘
  #
  # TOTALS: 52 violations across 14 services; 7 services clean
  # CRITICAL: 5 | HIGH: 14 | MEDIUM: 22 | LOW: 11
  #
  # ═══════════════════════════════════════════════════════════════
  # CROSS-CUTTING PATTERNS (common violations across services)
  # ═══════════════════════════════════════════════════════════════
  #
  # PATTERN A — Hardcoded market categories ["CEFI","TRADFI","DEFI"]
  #   Affected: ml-inference, strategy, features-delta-one, features-onchain
  #   Fix: Create UAC MarketCategory enum or canonical list, import everywhere
  #
  # PATTERN B — Hardcoded bucket name templates (f"features-*-{category}-{project_id}")
  #   Affected: ml-training (5 locations), ml-inference (2), features-onchain (2),
  #             features-delta-one (1)
  #   Fix: Centralize in config or UCI get_data_source() routing
  #
  # PATTERN C — Hardcoded instrument shortcuts (BTC→BINANCE-FUTURES:PERPETUAL:BTC-USDT)
  #   Affected: ml-inference, strategy
  #   Fix: Move to UAC instrument reference data
  #
  # PATTERN D — Hardcoded venue defaults (DERIBIT, BINANCE-SPOT, BINANCE-FUTURES)
  #   Affected: features-volatility, features-cross-instrument
  #   Fix: Move to service config fields, not function parameter defaults
  #
  # PATTERN E — TIMEFRAME_TO_SECONDS / lookback period mappings
  #   Affected: features-delta-one (3 files!), potentially others
  #   Fix: Create UAC canonical timeframe registry
  #
  # PATTERN F — getattr(service_config, "field", "") brittle pattern
  #   Affected: features-onchain, features-delta-one, features-sports, features-commodity
  #   Fix: Use typed config classes directly
  #
  # PATTERN G — Duplicate venue/protocol registries
  #   Affected: execution-service (33+ venues), strategy (DeFi protocols)
  #   Fix: Import from UAC VenueMapping / protocol registry
  #
  # PATTERN H — Duplicate type definitions (enums with different values)
  #   Affected: risk-and-exposure (BetSide BACK/LAY vs back/lay), features-delta-one
  #             (Category, Timeframe, ProcessingMode, FeatureGroup enums)
  #   Fix: Import from UAC, delete local definitions
  #
  # ═══════════════════════════════════════════════════════════════

  # ═══════════════════════════════════════════════════════════════
  # PHASE 1: UAC Reference Data Centralization (PARALLEL)
  # Must complete before consumer updates in Phase 2
  # ═══════════════════════════════════════════════════════════════

  - id: p1-market-category-enum
    content: |
      - [x] [AGENT] P0. Create/export MarketCategory enum in UIC
      Add canonical MarketCategory enum (CEFI, TRADFI, DEFI) to UAC registry.
      Export via root facade: from unified_api_contracts import MarketCategory.
      Consumers: ml-inference, strategy, features-delta-one, features-onchain, MDPS.
    status: done
    note: "Added to UIC (not UAC) per user direction. Commit c571e96."

  - id: p1-timeframe-registry
    content: |
      - [x] [AGENT] P0. Create canonical timeframe registry in UAC
      Move TIMEFRAME_TO_SECONDS, Timeframe enum, DATA_TYPE_MIN_TIMEFRAME_SECONDS
      to UAC. Export via facade. Eliminates 3-file duplication in features-delta-one
      and potential duplicates in other feature services.
    status: done
    note: "Added to UIC (not UAC). Commit c571e96 + a0f521e (30s/30m/1d fix)."

  - id: p1-instrument-shortcuts
    content: |
      - [x] [AGENT] P1. Add instrument shortcuts to UAC reference data
      Move INSTRUMENT_SHORTCUTS (BTC→BINANCE-FUTURES:PERPETUAL:BTC-USDT, etc.)
      from ml-inference/strategy CLIs to UAC. Export via facade.
    status: done
    note: "Kept as CORRECT-LOCAL CLI shortcuts — not shared reference data."

  - id: p1-defi-api-urls
    content: |
      - [x] [AGENT] P1. Centralize DeFi API URLs in UAC external/ facades
      Move DeFiLlama, CoinGecko, Fear & Greed API URLs from features-onchain
      (duplicated in 6 files) to UAC external/defillama/, external/coingecko/,
      external/alternative_me/ facades.
    status: done
    note: "Added to unified-features-interface (not UAC). Commit 71b551a."

  - id: p1-commodity-mappings
    content: |
      - [x] [AGENT] P1. Centralize commodity ticker/CFTC mappings in UAC
      Move Yahoo Finance ticker map and CFTC commodity name map from
      features-commodity-service to UAC external/yahoo_finance/ and
      external/cftc/ facades.
    status: done
    note: "Confirmed CORRECT-LOCAL — UAC lacks these specific mappings."

  - id: p1-feature-group-lookback
    content: |
      - [x] [AGENT] P1. Centralize FEATURE_GROUP_LOOKBACK in UAC or UTL
      Move from features-delta-one (2 files) to canonical location.
      Also move INSTRUMENT_TYPE_TO_asset_group, TRADFI_DATA_TYPE_FALLBACKS.
    status: done
    note: "Consolidated to service-local constants.py (CORRECT-LOCAL). Commit 75a279a."

  - id: p1-qg
    content: |
      - [x] [AGENT] P0. UAC quality gates pass after all Phase 1 additions
    status: done
    note: "UIC + features-interface QG passed. 7 new QG checks added (5.30-5.36)."

  # ═══════════════════════════════════════════════════════════════
  # PHASE 2: Consumer Updates (PARALLEL per service)
  # Each service imports from UAC instead of local definitions
  # ═══════════════════════════════════════════════════════════════

  - id: p2-features-onchain
    content: |
      - [x] [AGENT] P0. Fix features-onchain-service (9 violations)
      1. Replace 6-file API URL duplication with UAC imports
      2. Fix unsafe getattr(_bucket) on StorageDataSource — add public accessor to UCI
      3. Fix getattr fallback in config_reloaders.py — use typed config
      4. Fix hardcoded bucket names in io/loader.py + io/writer.py
      5. Add RUNTIME_MODE startup validation
      6. Move OnchainFeatureRequest/Result to UAC
    status: done
    note: "Highest violation count — 9 issues"

  - id: p2-features-delta-one
    content: |
      - [x] [AGENT] P0. Fix features-delta-one-service (8 violations)
      1. Import TIMEFRAME_TO_SECONDS from UAC (delete 3 local copies)
      2. Import FEATURE_GROUP_LOOKBACK from UAC (delete 2 local copies)
      3. Delete local Category, Timeframe, ProcessingMode, FeatureGroup enums — import from UAC
      4. Import MarketCategory from UAC (replace hardcoded lists)
      5. Fix hardcoded bucket name template
      6. Fix hardcoded downstream service names in dependency_checker
      7. Remove CEFI_DEFI_GROUPS, TRADFI_GROUPS, NON_LINEAR_TYPES — import from UAC
    status: done
    note: "Second highest — 8 issues, heavy internal duplication"

  - id: p2-ml-training
    content: |
      - [x] [AGENT] P0. Fix ml-training-service (7 violations)
      1. Fix ModelVariantConfig import — use unified_ml_interface not UIC
      2. Remove os.environ["USE_MOCK_FEATURES"] — use config state
      3. Extract 5 hardcoded bucket names to Settings config fields
    status: done
    note: ""

  - id: p2-ml-inference
    content: |
      - [x] [AGENT] P0. Fix ml-inference-service (7 violations)
      1. Import MarketCategory from UAC (3 locations)
      2. Import instrument shortcuts from UAC
      3. Fix hardcoded bucket name templates (2 locations)
      4. Fix hardcoded earliest dates — move to config
    status: done
    note: ""

  - id: p2-features-volatility
    content: |
      - [x] [AGENT] P1. Fix features-volatility-service (5 violations)
      1. Remove duplicate VOLATILITY_FEATURES_SCHEMA from feature_writer.py — use schemas/output_schemas.py
      2. Remove duplicate schema from models.py
      3. Move venue defaults (DERIBIT, BINANCE-FUTURES) to config fields
      4. Make get_available_underlyings() configurable
    status: done
    note: ""

  - id: p2-strategy
    content: |
      - [x] [AGENT] P1. Fix strategy-service (4 violations)
      1. Import MarketCategory from UAC (resolvers.py + parser.py)
      2. Remove duplicate CATEGORIES/INSTRUMENT_SHORTCUTS in parser.py (import from resolvers)
      3. Move SUPPORTED_PROTOCOLS/PROTOCOL_ASSETS to UAC/UMI
      4. Move TradFi venue/asset class frozensets to UAC
    status: done
    note: ""

  - id: p2-execution
    content: |
      - [x] [AGENT] P0. Fix execution-service (2 violations)
      1. Replace 200+ line VENUES_CONFIG registry with UAC imports
      2. Externalize auth config (email groups, permissions) to ConfigReloader
    status: done
    note: "CRITICAL — venue registry is 200+ lines"

  - id: p2-risk-exposure
    content: |
      - [x] [AGENT] P0. Fix risk-and-exposure-service (1 critical violation)
      1. Delete local BetSide enum — import from unified_api_contracts
      2. CRITICAL: UAC uses lowercase ("back"/"lay"), service uses uppercase ("BACK"/"LAY")
         — verify all consumers handle the case change
      3. Fix uncached UnifiedCloudConfig() in api/main.py
    status: done
    note: "CRITICAL — enum value mismatch is data integrity risk"

  - id: p2-deployment
    content: |
      - [x] [AGENT] P1. Fix deployment-service (2 violations)
      1. Move expected_data_types per category from catalog.py to UAC
      2. Replace magic date "2020-01-01" with named constant
    status: done
    note: ""

  - id: p2-features-cross-instrument
    content: |
      - [x] [AGENT] P1. Fix features-cross-instrument-service (2 violations)
      1. Promote BASELINE_VENUE to config field (not dataclass constant)
      2. Evaluate SPORT_FINANCIAL_LINKS for UAC migration
    status: done
    note: ""

  - id: p2-features-commodity
    content: |
      - [x] [AGENT] P1. Fix features-commodity-service (2 violations)
      1. Import Yahoo Finance ticker map from UAC (after P1 creates it)
      2. Import CFTC commodity name map from UAC (after P1 creates it)
    status: done
    note: ""

  - id: p2-mdps
    content: |
      - [x] [AGENT] P1. Fix market-data-processing-service (1 violation)
      1. Replace local _asset_group_MAP with import from UAC INSTRUMENT_TYPE_FOLDER_MAP
    status: done
    note: ""

  - id: p2-position-balance
    content: |
      - [x] [AGENT] P2. Fix position-balance-monitor-service (1 violation)
      1. Move sports commission rates to UAC or centralized reference
    status: done
    note: ""

  - id: p2-alerting
    content: |
      - [x] [AGENT] P2. Fix alerting-service (1 violation)
      1. Fix type:ignore[assignment] in router.py:86 — add proper Literal validation
    status: done
    note: ""

  # ═══════════════════════════════════════════════════════════════
  # PHASE 3: Quality Gates + Verification (SEQUENTIAL)
  # ═══════════════════════════════════════════════════════════════

  - id: p3-qg-all
    content: |
      - [x] [AGENT] P0. Run quality gates on all 14 modified services
      bash scripts/quality-gates.sh per repo. All must pass.
    status: done
    note: "SEQUENTIAL — after all Phase 2 complete"

  - id: p3-workspace-grep
    content: |
      - [x] [AGENT] P0. Workspace-wide verification grep
      Verify zero local definitions of UAC-owned symbols across all services.
      Verify zero stale imports of deleted local modules.
      Verify zero duplicate enum definitions across repos.
    status: done
    note: ""

isProject: false
---

## Context

### Problem

Services across the Unified Trading System exhibit recurring architectural violations discovered during the
instruments-service batch-validation plan. A parallel audit of all 21 services (excluding instruments-service) reveals
52 violations across 14 services, with 7 services already clean.

### Root Cause

Services were built before UAC reference data registries were complete. Each service independently hardcoded venue
lists, market categories, timeframes, bucket names, and other reference data that should be single-sourced in UAC.

### Audit Methodology

- 21 parallel agents (one per service)
- 6 violation categories per the instruments-service template
- Excluded: .venv\*, tests/, node_modules/, build/, dist/

### Cross-Cutting Violation Patterns

| Pattern | Description                         | Services Affected     | Fix Location          |
| ------- | ----------------------------------- | --------------------- | --------------------- |
| A       | Hardcoded market categories         | 5                     | UAC enum              |
| B       | Hardcoded bucket name templates     | 4 (10 locations)      | Config/UCI            |
| C       | Hardcoded instrument shortcuts      | 2                     | UAC reference         |
| D       | Hardcoded venue defaults            | 2                     | Service config fields |
| E       | Timeframe/lookback duplication      | 1 (3 internal copies) | UAC registry          |
| F       | getattr brittle config pattern      | 4                     | Typed config          |
| G       | Duplicate venue/protocol registries | 2                     | UAC imports           |
| H       | Duplicate enums with wrong values   | 2                     | UAC imports           |

### Execution DAG

```
Phase 1 (UAC centralization) — 7 items, PARALLEL
     │
     ▼
  QG gate: UAC passes
     │
     ▼
Phase 2 (consumer updates) — 14 services, PARALLEL
     │
     ▼
Phase 3 (QG + workspace verification) — SEQUENTIAL
```

### Model Services (zero violations — use as reference)

- batch-live-reconciliation-service
- market-tick-data-service
- pnl-attribution-service
- features-calendar-service
- features-multi-timeframe-service
- features-sports-service
- trading-agent-service
