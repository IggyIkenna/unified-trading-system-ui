# Tier Architecture

## 5-Tier Dependency Model

```
TIER 0 — Pure Leaves (no cloud I/O, no trading state, zero inter-lib deps)

  NOTE: T0 has two sub-levels due to a single permitted inter-T0 import (UIC may import UAC):
    T0-L2a (true leaves, no workspace imports):
      unified-api-contracts (UAC)             Canonical schemas, Pydantic v2 models, VCR cassettes, external raw schemas
                                              stdlib + pydantic ONLY — zero unified-* imports, not even in tests.
                                              SSOT for all external API schemas and canonical normalization outputs.
      unified-cloud-interface (UCLI)          StorageClient, SecretClient, QueueClient, GCP+AWS+Local providers
      unified-events-interface (UEI)          EventSink Protocol, setup_events, log_event, MockEventSink
      execution-algo-library (EAL)            TWAP, VWAP, pure compute algorithms, zero inter-lib deps
      ibkr-gateway-infra                      Deploys and manages the IB Gateway Java process (long-lived). All IBKR
                                              connectivity routes through this — UMI, UTEI, UPI, URDI adapters use it for
                                              live trading and integration tests. No unified-* imports. TWS uses proprietary
                                              socket protocol; mock at ib_insync layer for tests (not HTTP VCR).

    T0-L2b (UAC-dependent; builds after L2a):
      unified-internal-contracts (UIC)        MessagingTopic, EventEnvelope, PubSub topics, req/resp/error schemas,
                                              domain/<service-name>/ output schemas for all services.
                                              May import from UAC (normalization canonicals re-exported for messaging).
                                              UAC MUST NOT import from UIC — this direction is a CIRCULAR violation.
                                              Build order: UAC (L2a) → UIC (L2b). merge_level in workspace-manifest: UAC=2, UIC=3.

  ModelArtifactStore — A pure abstract protocol for model artifact storage (save/load ML models). Lives at T0 (in `unified-cloud-interface` or `unified-internal-contracts`) because it has no cloud I/O or trading logic — just an abstract interface. Concrete implementation `CloudModelArtifactStore` lives in UDC (T3) using `get_storage_client()` from UCI (T0). ML services (T4) import the T0 protocol only — the concrete impl is injected at startup via dependency injection. UML (T2) may re-export the protocol for convenience.

TIER 1 — Shared Infrastructure (trading-aware cloud services)
  unified-reference-data-interface (URDI) REST venue adapters, API key resolution, IBKR corp actions  ← T1 per workspace-manifest.json
  unified-config-interface (UCI)          BaseConfig, UnifiedCloudConfig, venue constants (imports UEI for CONFIG_LOADED event)
  matching-engine-library (MEL)           Pure order matching logic, imports schemas from UIC (OrderRecord, FeeResult, SwapResult, MatchResult). Pool impls (UniswapV2/3/4) remain local.
  unified-trading-library (UTL)           [renamed from unified-trading-services; alias package: unified_trading_services still works]
  Note: `unified-trading-services` is being renamed to `unified-trading-library` (UTL) per Phase 2 plan (`lib-phase2-uts-rename-step1`). Codex will be updated after rename is complete. Until then, both names refer to the same T1 library.
    get_storage_client, get_secret_client, handle_api_errors, handle_storage_errors
    ConfigStore, BaseCloudWriter, BaseCloudLoader, generate_date_range
    BaseDependencyChecker, GCSEventSink, PubSubEventSink, CompositeEventSink
    ServiceCLI, BaseModeHandler, BatchOrchestrator, @with_retry   ← service framework
    GracefulShutdownHandler

TIER 2 — Domain/Market Interfaces (protocols + schemas + connectivity, no cloud storage I/O)
  unified-market-interface (UMI)              market data schemas + venue WS adapters + BaseWebSocketClient + VenueRateLimiter
  unified-trade-execution-interface (UTEI)    order/fill schemas + OMS protocols + OrderTracker + SmartOrderRouter
  unified-defi-execution-interface (UDEI)     BaseAMMAdapter, Uniswap/Curve/DeFi pool adapters
  unified-sports-execution-interface (USEI)   BaseSportsAdapter, Betfair/Pinnacle adapters  ⟪v0.1 future⟫
  unified-ml-interface (UML)                  ML model protocols + prediction schemas
  unified-feature-calculator-library (UFC)    feature schemas + FeatureCalculatorRegistry + BaseFeatureService
  unified-position-interface (UPI)            position/account schemas + CCXT/OKX/IBKR adapters  ⟪v0.1 future⟫

TIER 3 — Domain Data Client (cloud storage I/O, uses UCLI + UTS)
  unified-domain-client / unified-domain-client (UDC)
    paths/         PATH_REGISTRY (20 datasets), DataSetSpec, build_bucket, build_path, build_full_uri
    clients/       14 typed domain clients
    readers/       DirectReader, BigQueryExternalReader, AthenaReader, get_reader()
    writers/       DirectWriter, get_writer()
    catalog/       BigQueryCatalog, GlueCatalog
    DataCompletionChecker, get_available_date_range
    CloudModelArtifactStore — concrete impl of ModelArtifactStore T0 protocol; uses get_storage_client() from UCI (T0); does NOT import T2
  UDC provides `CloudModelArtifactStore` implementing the `ModelArtifactStore` T0 protocol. Imports T0 for the protocol + `get_storage_client()`. Does NOT import T2.

TIER 4 — Services (uses Tier 0–3; never import from another service repo)
  14 service repos — all use ServiceCLI, BaseModeHandler/BatchOrchestrator
```

## Topology-Driven Protocol Selection

Services declare WHAT data they produce and which MODE (batch/live) they run in. The runtime topology defines HOW —
messaging transport, storage backend, and deployment target — read from
`unified-trading-pm/configs/runtime-topology.yaml` (the SSOT).

| Concern             | Declared by | Source of truth                      | Read via                                                                         |
| ------------------- | ----------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| Data schema         | Service     | `unified-internal-contracts`         | import at build time                                                             |
| Service mode        | Service     | `PROTOCOL_SERVICE_MODE` env var      | `get_service_mode()` from `unified_cloud_interface.factory`                      |
| Messaging transport | Topology    | `protocols.messaging.{mode}.default` | `get_messaging_protocol(mode)` from `unified_config_interface.topology_reader`   |
| Storage backend     | Topology    | `protocols.storage.{mode}.default`   | `get_storage_protocol(mode)` from `unified_config_interface.topology_reader`     |
| Deployment target   | Topology    | `protocols.deployment.{service}`     | `get_deployment_target(service)` from `unified_config_interface.topology_reader` |

The `unified_config_interface.topology_reader` module is the canonical read layer for topology decisions. Libraries and
deployment-service import from it; services receive injected protocol config via UCI factory (`get_data_sink`,
`get_event_bus`, etc.).

## Import Rules

1. Higher tiers may import from SAME or LOWER tiers only.
2. Tier 0 must NEVER import from Tier 1+.
3. Tier 2 may import from Tier 0 and Tier 1.
4. Tier 3 (UDC) imports from Tier 0 (UCLI) and Tier 1 (UCI, UTL).
5. Services (Tier 4) import from Tier 0–3 only. Never from another service.
6. UIs import from service APIs only (never directly from libraries).

## Import Routing Map

| Symbol                                               | Import from                                           |
| ---------------------------------------------------- | ----------------------------------------------------- |
| StorageClient, get_storage_client                    | unified_cloud_interface                               |
| SecretClient, get_secret_client                      | unified_cloud_interface                               |
| CloudProvider, BlobMetadata                          | unified_cloud_interface                               |
| UnifiedCloudConfig, BaseConfig                       | unified_config_interface                              |
| setup_events, log_event, MockEventSink               | unified_trading_library.events                              |
| get_secret_client, handle_api_errors                 | unified_trading_services (→ unified_trading_services) |
| GCSEventSink, setup_service                          | unified_trading_services (→ unified_trading_services) |
| ServiceCLI, BatchOrchestrator, with_retry            | unified_trading_services (→ unified_trading_services) |
| InstrumentsDomainClient, DataCompletionChecker       | unified_domain_client                                 |
| PATH_REGISTRY, get_reader, get_writer                | unified_domain_client                                 |
| CanonicalTick, BaseWebSocketClient, VenueRateLimiter | unified_market_interface                              |
| UnifiedOrderManager, OrderTracker                    | unified_trade_execution_interface                     |
| FeatureCalculatorRegistry, BaseFeatureService        | unified_feature_calculator (UFC repo)                 |
| get_reference_adapter, BaseReferenceAdapter          | unified_reference_data_interface                      |

## Topology / Level Map

**L10 — system-integration-tests** (standalone repo, created in Phase 1 Stream B UTD V3 four-way split)

- Zero cross-service Python imports — interacts via HTTP, GCS, PubSub only
- Discovers live services via `deployment-api GET /services`
- Contains Layer 3a smoke tests (`@pytest.mark.smoke`, <5 min) and Layer 3b full E2E (`@pytest.mark.full_e2e`, 15–30
  min)
- Depends on: `unified-api-contracts` (schema validation), `unified-internal-contracts` (message schemas)

## T0 Sub-Tier Model (Corrected — Supersedes Outdated Audit Spec)

The T0 tier contains two sub-tiers due to a single permitted inter-T0 import direction:

- **T0-base (true leaves, no workspace imports):** `unified-api-contracts` (UAC) — zero internal workspace dependencies;
  pure external contract schemas, Pydantic v2 models, VCR cassettes. stdlib + pydantic ONLY.
- **T0-consumer (UAC-dependent):** `unified-internal-contracts` (UIC) — may depend on `unified-api-contracts` only
  (internal schemas that reference external contract types). UAC MUST NOT import from UIC — this direction is a CIRCULAR
  violation. Build order: UAC (T0-base) → UIC (T0-consumer).

**T1 sub-ordering:**

- **T1a:** `unified-config-interface` — BaseConfig, UnifiedCloudConfig, topology reader; imports UEI (T0) for
  CONFIG_LOADED event. This is T1, NOT T0. Any audit spec listing it as T0 is outdated.
- **T1b:** `unified-trading-library` — may depend on T1a (unified-config-interface) and T0 libraries.
- **T1c:** `unified-reference-data-interface` — REST venue adapters, API key resolution; may depend on T1a/T1b and T0.

> Note: `unified-config-interface` is T1, not T0. The audit spec listing it as T0 was outdated and has been corrected
> here. The canonical tier assignment is: UAC=T0-base, UIC=T0-consumer, UCI=T1a, UTL=T1b, URDI=T1c.

**T2, T3:** unchanged — see the 5-Tier Dependency Model section above.

## Integer Tier Assignments (workspace-manifest.json)

The `arch_tier` field in `workspace-manifest.json` uses integer values (0, 1, 2, 3, 4) rather than string labels. This
was formalized as part of the UAC Citadel Architecture to enable programmatic tier validation in quality gates and CI.
The mapping is:

| Integer | Tier label | Description                     |
| ------- | ---------- | ------------------------------- |
| 0       | T0         | Pure leaves (no inter-lib deps) |
| 1       | T1         | Shared infrastructure           |
| 2       | T2         | Domain/market interfaces        |
| 3       | T3         | Domain data client (cloud I/O)  |
| 4       | T4         | Services                        |

Quality gates and the version cascade use integer comparison (`arch_tier <= N`) to enforce the tier import invariant.
String `arch_tier` values (e.g., `"T0"`, `"tier-0"`) are deprecated; all repos should use the integer form.

## Known Tier Violations

**Known T2→T3 violation:** `unified-market-interface` (UMI, T2) currently imports from `unified-domain-client` (UDC,
T3). Task: `cohesion-umi-udc-dep-violation` in `phase2_library_tier_hardening.md`. Resolution: move whatever UMI
imports from UDC into a T1 library or a shared T0 protocol. This violation must be fixed in Phase 2 T2 hardening step
before Phase 3 begins.

## Naming Conventions

**Cloud-agnostic naming rule for protocols/interfaces:**

- Public-facing protocol and interface class names MUST use `Cloud*` prefix: `CloudStorageClient`,
  `CloudModelArtifactStore`, `CloudEventSink`
- Provider implementations MAY use cloud-specific prefixes: `GCSStorageClient`, `S3StorageClient` (in
  `providers/gcp.py`, `providers/aws.py`)
- NEVER use `GCS*`, `S3*`, or `GCP*` in public-facing protocol or abstract class names
- Rationale: protocols are cloud-agnostic; provider implementations are not

## Repo Rename Status (in progress)

- unified-trading-services → unified-trading-library (alias package: unified_trading_services still works during
  transition)
- unified-domain-client → unified-domain-client (alias package: unified_domain_client)

Use new package names in all new code. Alias packages ensure backward compat during transition.
