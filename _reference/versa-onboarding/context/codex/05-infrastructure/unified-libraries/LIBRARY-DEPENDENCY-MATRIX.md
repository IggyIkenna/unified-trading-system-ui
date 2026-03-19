# Library Dependency Matrix

> **Supersedes:** `archive/dependency-matrix.md` (2026-02-26). unified-api-contracts version table moved to
> `02-data/unified-api-contracts-chain.md`.

> ⚠️ **THIS IS NOT THE TIER SSOT.**
>
> **Authoritative tier model:** [`04-architecture/TIER-ARCHITECTURE.md`](../../04-architecture/TIER-ARCHITECTURE.md) —
> defines the full 5-tier system (T0 pure leaves → T1 service runtime → T2 domain interfaces → T3 domain data client →
> T4/service)
>
> **Machine-readable SSOT:**
> [`unified-trading-pm/workspace-manifest.json`](../../../../unified-trading-pm/workspace-manifest.json) — canonical
> `arch_tier`, `dependencies`, `completion_paths`, `tier_rules` per repo
>
> This document covers the **library layer only** (T0–T3) — which library imports which, and why. For services and UIs,
> see `04-architecture/TIER-ARCHITECTURE.md`.

**Last updated:** 2026-02-28

---

## Library Tier Diagram (T0–T3 only)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  TIER 0 — Pure Leaves (zero unified-* imports; stdlib + external packages only)  │
│                                                                                  │
│  unified-api-contracts (AC)                unified-cloud-interface (UCLI)                │
│  unified-internal-contracts (UIC_INT)  unified-config-interface (UCI)            │
│  unified-events-interface (UEI)    unified-reference-data-interface (URDI)       │
│  execution-algo-library (EAL)      matching-engine-library (MEL)                 │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │ T0 imports only
┌──────────────────────────────────────▼───────────────────────────────────────────┐
│  TIER 1 — Shared Cloud Runtime (imports T0 only)                                 │
│  unified-trading-services (UTS)                                                  │
│  ConfigStore · GCSEventSink · PubSubEventSink · ServiceCLI · BatchOrchestrator   │
│  setup_service · @with_retry · StateStore · GracefulShutdownHandler              │
└────────────┬──────────────────────────────────────────────────────┬──────────────┘
             │ T0+T1 imports                                        │ T0+T1 imports
┌────────────▼──────────────────┐   ┌──────────────────────────────▼──────────────┐
│  TIER 3 — Domain Data Client  │   │  TIER 2 — Domain/Market Interfaces           │
│                               │   │                                              │
│  unified-domain-client (UDC)  │   │  unified-market-interface (UMI)              │
│  PATH_REGISTRY · 20 datasets  │   │  unified-trade-execution-interface (UTEI)    │
│  14 typed domain clients      │   │  unified-defi-execution-interface (UDEI)     │
│  DirectReader/Writer          │   │  unified-sports-execution-interface (USEI)   │
│  BigQueryCatalog · GlueCatalog│   │  unified-ml-interface (UML)                  │
│  DataCompletionChecker        │   │  unified-feature-calculator-library (UFC)    │
│                               │   │  unified-position-interface (UPI)            │
└───────────────────────────────┘   └─────────────────────────────────────────────┘
             │                                        │
             └─────────────────┬──────────────────────┘
                               │ T0–T3 imports (never cross-tier, never service→service)
            ┌──────────────────▼──────────────────────────────────────────────┐
            │  TIER 4 / SERVICES — 17+ service repos                          │
            │  instruments-service · market-tick-data-service                 │
            │  market-data-processing-service · features-* · ml-*             │
            │  strategy-service · execution-service · pnl-attribution-service│
            │  position-balance-monitor-service · risk-and-exposure-service   │
            │  alerting-service                                               │
            └─────────────────────────────────────────────────────────────────┘
```

---

## Import Rules

| Tier    | May import from                 | Violation check                                           |
| ------- | ------------------------------- | --------------------------------------------------------- |
| 0       | stdlib + external packages only | Zero `from unified_` imports                              |
| 1       | Tier 0 only                     | No T2/T3 imports                                          |
| 2       | Tier 0 + Tier 1                 | No `from unified_domain_client` (T3); no other T2 imports |
| 3       | Tier 0 + Tier 1                 | No T2 imports                                             |
| service | T0 + T1 + T2 + T3               | Never imports another service                             |
| api/ui  | T0 only (no internal libs)      | Call services via REST/SSE only                           |

> ⚠️ **Known violation:** `unified-market-interface` currently imports `unified-domain-client` (T2→T3 lateral). Must be
> removed — tracked as `cohesion-umi-udc-dep-violation` in consolidated plan.

---

## Diamond Pattern (safe — Python sys.modules cache)

```
Services → UTS (T1) → UCLI (T0)
Services → UDC (T3) → UCLI (T0)
Services → UMI (T2) → UCLI (T0)
```

All three paths converge on T0 libs. Python loads each package once.

---

## Tier 0 Library Quick-Reference

| Library                          | Package                            | Key exports                                                                                             | External deps               |
| -------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------- |
| unified-api-contracts            | `unified_api_contracts`            | Pydantic v2 schemas, VCR cassettes, `unified_api_contracts.external`, `unified_api_contracts.canonical` | pydantic, aiohttp           |
| unified-internal-contracts       | `unified_internal_contracts`       | `MessagingTopic`, `EventEnvelope`, PubSub topic names, req/resp/error envelopes                         | pydantic                    |
| unified-config-interface         | `unified_config_interface`         | `UnifiedCloudConfig`, `BaseConfig`, env loading, venue constants                                        | pydantic, pyyaml            |
| unified-events-interface         | `unified_events_interface`         | `EventSink` Protocol, `setup_events`, `log_event`, `MockEventSink`                                      | pydantic                    |
| unified-cloud-interface          | `unified_cloud_interface`          | `StorageClient`, `SecretClient`, `QueueClient`; GCP/AWS/Local providers                                 | google-cloud-storage, boto3 |
| unified-reference-data-interface | `unified_reference_data_interface` | REST venue adapters, instrument definitions, IBKR corp actions, API key resolution                      | aiohttp, pydantic           |
| execution-algo-library           | `execution_algo_library`           | TWAP, VWAP, Iceberg — pure compute, zero inter-lib deps                                                 | pydantic, python-dateutil   |
| matching-engine-library          | `matching_engine_library`          | Pure order matching logic, zero inter-lib deps                                                          | pydantic                    |

## Tier 1 Library Quick-Reference

| Library                  | Package                    | Key exports                                                                                                                                                                                                                                 | Imports (T0)            |
| ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| unified-trading-services | `unified_trading_services` | `get_secret_client`, `handle_api_errors`, `GCSEventSink`, `PubSubEventSink`, `QueueEventSink`, `ConfigStore`, `ServiceCLI`, `BatchOrchestrator`, `setup_service`, `@with_retry`, `StateStore`, `BaseCloudWriter`, `GracefulShutdownHandler` | UCLI, UCI, UEI, UIC_INT |

## Tier 2 Library Quick-Reference

| Library                            | Package                              | Key exports                                                                                                                         | Imports (T0+T1)                              |
| ---------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| unified-market-interface           | `unified_market_interface`           | `CanonicalTick`, `BaseWebSocketClient`, `VenueRateLimiter`, venue WS adapters (Binance, OKX, Deribit, Bybit, Hyperliquid, Coinbase) | UTS, UCI, AC ⚠️ also imports UDC (violation) |
| unified-trade-execution-interface  | `unified_trade_execution_interface`  | `BaseExecutionAdapter`, `BaseCLOBAdapter`, `OrderTracker`, `SmartOrderRouter`, `OMS`, fill/order Pydantic schemas                   | UTS, UCI, AC                                 |
| unified-defi-execution-interface   | `unified_defi_execution_interface`   | `BaseAMMAdapter`, Uniswap/Curve/Aave adapters, on-chain position schemas                                                            | UTS, UCI, AC                                 |
| unified-sports-execution-interface | `unified_sports_execution_interface` | `BaseSportsAdapter`, Betfair/Pinnacle adapters ⟪v0.1 scaffold⟫                                                                      | UTS, UCI                                     |
| unified-ml-interface               | `unified_ml_interface`               | ML model protocols, `CrossValidationResult`, `ModelDegradationAlert`, prediction schemas                                            | UTS, UCI                                     |
| unified-feature-calculator-library | `unified_feature_calculator_library` | `FeatureCalculatorRegistry`, `BaseFeatureService`, `FeatureStalenessConfig`                                                         | UTS, UCI                                     |
| unified-position-interface         | `unified_position_interface`         | `CanonicalPosition`, `CanonicalBalance`; CCXT/OKX/IBKR adapters ⟪v0.1 scaffold⟫                                                     | UTS, UCI, AC                                 |

## Tier 3 Library Quick-Reference

| Library               | Package                 | Key exports                                                                                                                                                                                                     | Imports (T0+T1) |
| --------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| unified-domain-client | `unified_domain_client` | `PATH_REGISTRY` (20 datasets), 14 typed domain clients, `DirectReader`, `DirectWriter`, `BigQueryCatalog`, `GlueCatalog`, `DataCompletionChecker`, `get_available_date_range`, `StandardizedDomainCloudService` | UTS, UCLI, UCI  |

---

## Full Service → Library Dependency Matrix

All 17 active/scaffolded services × all 16 libraries. `●` = direct dependency. `○` = not required. `⟪f⟫` =
future/scaffolded service.

| Service                              | UTS | UCI | UEI | UCLI | AC  | UIC | URDI | EAL | MEL | UMI | UTEI | UDEI | USEI | UML | UFC | UPI | UDC |
| ------------------------------------ | :-: | :-: | :-: | :--: | :-: | :-: | :--: | :-: | :-: | :-: | :--: | :--: | :--: | :-: | :-: | :-: | :-: |
| **instruments-service**              |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ●   |  ○  |  ○  |  ●  |  ○   |  ○   |  ○   |  ○  |  ○  |  ○  |  ●  |
| **market-tick-data-service**         |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ●  |  ○   |  ○   |  ○   |  ○  |  ○  |  ○  |  ●  |
| **market-data-processing-service**   |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ●  |  ○   |  ○   |  ○   |  ○  |  ○  |  ○  |  ●  |
| **features-calendar-service**        |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ○  |  ○   |  ○   |  ○   |  ○  |  ●  |  ○  |  ○  |
| **features-delta-one-service**       |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ●  |  ○   |  ○   |  ○   |  ○  |  ●  |  ○  |  ●  |
| **features-volatility-service**      |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ●  |  ○   |  ○   |  ○   |  ○  |  ●  |  ○  |  ●  |
| **features-onchain-service**         |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ○  |  ○   |  ●   |  ○   |  ○  |  ●  |  ○  |  ●  |
| **features-sports-service** ⟪f⟫      |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ○  |  ○   |  ○   |  ●   |  ○  |  ●  |  ○  |  ●  |
| **ml-training-service**              |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ○  |  ○   |  ○   |  ○   |  ●  |  ○  |  ○  |  ●  |
| **ml-inference-service**             |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ○  |  ○   |  ○   |  ○   |  ●  |  ○  |  ○  |  ●  |
| **strategy-service**                 |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ●  |  ○   |  ○   |  ○   |  ●  |  ○  |  ○  |  ●  |
| **execution-service**                |  ●  |  ●  |  ●  |  ○   |  ●  |  ○  |  ○   |  ●  |  ●  |  ●  |  ●   |  ○   |  ○   |  ○  |  ○  |  ○  |  ●  |
| **pnl-attribution-service**          |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ○  |  ○   |  ○   |  ○   |  ○  |  ○  |  ○  |  ●  |
| **position-balance-monitor-service** |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ○  |  ○   |  ○   |  ○   |  ○  |  ○  |  ●  |  ●  |
| **risk-and-exposure-service**        |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ○  |  ○   |  ○   |  ○   |  ○  |  ○  |  ○  |  ●  |
| **alerting-service**                 |  ●  |  ●  |  ●  |  ○   |  ○  |  ○  |  ○   |  ○  |  ○  |  ○  |  ○   |  ○   |  ○   |  ○  |  ○  |  ○  |  ○  |

**Column key:** UTS=unified-trading-services, UCI=unified-config-interface, UEI=unified-events-interface,
UCLI=unified-cloud-interface, AC=unified-api-contracts, UIC=unified-internal-contracts,
URDI=unified-reference-data-interface, EAL=execution-algo-library, MEL=matching-engine-library,
UMI=unified-market-interface, UTEI=unified-trade-execution-interface, UDEI=unified-defi-execution-interface,
USEI=unified-sports-execution-interface, UML=unified-ml-interface, UFC=unified-feature-calculator-library,
UPI=unified-position-interface, UDC=unified-domain-client

---

## Library Usage Count (by consumer count)

| Library                                           | Services using | Service list                                                                           |
| ------------------------------------------------- | :------------: | -------------------------------------------------------------------------------------- |
| **UTS** (unified-trading-services)                |       17       | All                                                                                    |
| **UCI** (unified-config-interface)                |       17       | All                                                                                    |
| **UEI** (unified-events-interface)                |       17       | All (via UTS re-export)                                                                |
| **UDC** (unified-domain-client)                   |       13       | instruments, MTDH, MDPS, FDS, FVS, FOS, FSS, MLTR, MLIN, STR, EXEC, PNL, PBM, RAE, SVS |
| **UMI** (unified-market-interface)                |       5        | instruments, MTDH, MDPS, FDS, FVS, STR, EXEC                                           |
| **UFC** (unified-feature-calculator-library)      |       5        | FCS, FDS, FVS, FOS, FSS                                                                |
| **UML** (unified-ml-interface)                    |       3        | MLTR, MLIN, STR                                                                        |
| **UTEI** (unified-trade-execution-interface)      |       1        | execution-service                                                                      |
| **EAL** (execution-algo-library)                  |       1        | execution-service                                                                      |
| **MEL** (matching-engine-library)                 |       1        | execution-service                                                                      |
| **URDI** (unified-reference-data-interface)       |       1        | instruments-service                                                                    |
| **UDEI** (unified-defi-execution-interface)       |       1        | features-onchain-service                                                               |
| **UPI** (unified-position-interface)              |       1        | position-balance-monitor-service                                                       |
| **AC** (unified-api-contracts)                    |       1        | execution-service (direct); others via UMI/UTEI transitively                           |
| **USEI** (unified-sports-execution-interface) ⟪f⟫ |       1        | features-sports-service                                                                |
| **UCLI** (unified-cloud-interface)                |    0 direct    | All get via UTS transitively                                                           |
| **UIC_INT** (unified-internal-contracts)          |    0 direct    | Via UTS transitively                                                                   |

---

## QG Tier Enforcement

Quality gate step checks:

- `STEP 5.5`: no direct `google.cloud` or `boto3` imports in library source (use UCLI)
- `STEP 5.6`: tier compliance via `REPO_ARCH_TIER` env variable
  - Tier 0: zero `from unified_` imports anywhere in source
  - Tier 2: no `from unified_domain_client` imports (T2 must not import T3)
  - Services: no `from <other_service>` imports
- `STEP 5.7`: `unified-api-contracts` version alignment for T2 consumers (UTEI, UTEI, UMI)
