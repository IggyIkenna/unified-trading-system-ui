# UIC Orphan Adoption Recommendations

**Generated:** 2026-03-06
**Source audit:** Phase 2 agent live grep (76 true orphans — 5 schemas shown orphaned in
ADOPTION_MATRIX.md script are actually adopted; see stale-script note at end).

Orphans are split into three categories:

| Category                                 | Count | Action                                                                                  |
| ---------------------------------------- | ----- | --------------------------------------------------------------------------------------- |
| **A — Ready to adopt now**               | 33    | Assign to owning service; wire import + use                                             |
| **B — Deferred (no active service yet)** | 8     | Hold in UIC; adopt when service activates                                               |
| **C — Needs service-level wiring**       | 33    | PubSub infrastructure exists (`get_event_bus()`); needs per-service emit/consume wiring |

---

## Category A — Ready to Adopt Now

### A1. Alerting & Security (→ `alerting-service`)

These schemas already have well-defined semantics; `alerting-service` is the natural consumer.

| Schema                  | Change Required                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `AlertMessage`          | Replace any local alert struct in `alerting_service/core/` with this type; it is the normalized alert output shape |
| `AlertContextData`      | Attach to `AlertMessage.context` field; already references this type by design                                     |
| `HealthAlertMessage`    | Add to `alerting_service/handlers/health.py`; used when health-check threshold breached                            |
| `RiskAlertMessage`      | Receive from `risk-and-exposure-service` PubSub topic; deserialize using this type                                 |
| `AuthFailureEvent`      | Subscribe to `AUTH_FAILURE` PubSub topic; deserialize to this type for alerting                                    |
| `AuthFailureDetails`    | Used as `.details` payload inside `AuthFailureEvent` — import alongside it                                         |
| `SecretAccessedEvent`   | Subscribe to `SECRET_ACCESSED` topic; deserialize here                                                             |
| `SecretAccessedDetails` | Imported alongside `SecretAccessedEvent`                                                                           |
| `ConfigChangedEvent`    | Subscribe to `CONFIG_CHANGED` topic; log + forward to monitoring                                                   |
| `ConfigChangedDetails`  | Imported alongside `ConfigChangedEvent`                                                                            |

**Where:** `alerting-service/alerting_service/handlers/` — one handler per event type.

### A2. Risk Events (→ `risk-and-exposure-service` as emitter)

| Schema             | Change Required                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `RiskAlertMessage` | Emit to `RISK_ALERTS` PubSub topic when `RiskStatus` crosses threshold; construct here, publish via `get_event_bus()`                        |
| `ExposureSummary`  | Already in UIC `risk.py`; import in `risk_and_exposure_service/monitors/exposure_monitor.py` as the output type for `get_exposure_summary()` |
| `LimitCheckResult` | Import in `risk_and_exposure_service/pre_trade/limit_checker.py` as return type of `check_limits()`                                          |
| `PositionSide`     | Import in `risk_and_exposure_service/models/position.py` as the direction enum replacing raw `"long"/"short"` strings                        |

**Where:** `risk-and-exposure-service/risk_and_exposure_service/` — monitors + pre-trade modules.

### A3. Execution Safety (→ `execution-service`)

| Schema                       | Change Required                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CircuitBreakerEventMessage` | Emit to `CIRCUIT_BREAKER` PubSub topic when circuit opens/closes; construct in `execution_service/engine/circuit_breaker.py`; `alerting-service` consumes it  |
| `LimitCheckResult`           | Consume from `risk-and-exposure-service` response; import as return type in `execution_service/pre_trade/checker.py`                                          |
| `LiquidationMessage`         | Emit when venue sends liquidation event; construct in `execution_service/handlers/liquidation.py`; `alerting-service` + `risk-and-exposure-service` subscribe |
| `FillEventMessage`           | Emit on each fill; construct in `execution_service/engine/fill_handler.py`; `pnl-attribution-service` subscribes                                              |
| `StrategySignalMessage`      | Consume from `strategy-service` PubSub topic; deserialize as entry point to execution pipeline                                                                |

**Where:** `execution-service/execution_service/engine/` and `execution_service/handlers/`.

### A4. Strategy → Execution Signal (→ `strategy-service` as emitter)

| Schema                  | Change Required                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StrategySignalMessage` | Emit to `STRATEGY_SIGNALS` PubSub topic at end of each decision cycle; construct in `strategy_service/managers/base_strategy_manager.py` alongside `StrategyDecision` domain event |

**Where:** `strategy-service/strategy_service/managers/`.

### A5. PnL & Fee Attribution (→ `pnl-attribution-service`)

| Schema             | Change Required                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `FillEventMessage` | Subscribe to `FILLS` PubSub topic; deserialize here as input to `pnl_attribution_service/calculators/` |
| `FeeStructure`     | Import in `pnl_attribution_service/calculators/fee_calculator.py` as the exchange fee tier type        |

**Where:** `pnl-attribution-service/pnl_attribution_service/`.

### A6. Market Data Flow Messages

| Schema                    | Target Service                                                                 | Change Required                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `MarketTickMessage`       | `market-tick-data-service` (emit) + `market-data-processing-service` (consume) | Emit on each tick batch publication; subscribe at processing entry point                                          |
| `DerivativeTickerMessage` | `market-data-processing-service` (emit) + `execution-service` (consume)        | Emit after normalizing `CanonicalDerivativeTicker`; execution subscribes for mark-price updates                   |
| `DataBroadcastDetails`    | `market-data-processing-service`                                               | Log as detail payload in `ProcessingCompletedDetails` on each candle write batch                                  |
| `OHLCVSource`             | `market-data-processing-service`                                               | Import in `market_data_processing_service/adapters/ohlcv_adapter.py` as source-type enum for OHLCV origin tagging |

**Where:**

- `market-tick-data-service/market_tick_data_service/publishers/`
- `market-data-processing-service/market_data_processing_service/orchestration_workers.py`

### A7. Feature Pipeline Messages

| Schema                   | Target Service                                                      | Change Required                                                                                                    |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `FeatureUpdateMessage`   | All `features-*` services (emit) + `ml-inference-service` (consume) | Emit after each feature vector computed; each feature service creates one per compute cycle                        |
| `MLPredictionMessage`    | `ml-inference-service` (emit) + `execution-service` (consume)       | Emit in `ml_inference_service/prediction_publisher.py` after each inference; execution subscribes                  |
| `FeatureSnapshotRequest` | `ml-inference-service` (consume) + `features-*` services (respond)  | Accept snapshot requests via API/PubSub in feature services; construct in inference service for on-demand features |

**Where:**

- Feature services: `*_service/publishers/` or `*_service/calculators/`
- `ml-inference-service/ml_inference_service/prediction_publisher.py`

### A8. ML Configuration (→ `ml-training-service`)

| Schema               | Change Required                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `MLConfigDict`       | Import in `ml_training_service/config/training_config.py` as the typed config dict for training runs    |
| `ModelType`          | Replace string literals `"xgboost"`, `"lstm"`, etc. with this enum; import in `ml_training_service/ml/` |
| `ModelVariantConfig` | Import in `ml_training_service/ml/models.py` as the per-variant configuration wrapper                   |

**Where:** `ml-training-service/ml_training_service/ml/` and `ml_training_service/config/`.

### A9. DeFi Position & Market Data (→ `features-onchain-service`)

#### Position schemas (output types)

| Schema                | Change Required                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `DeFiLPPosition`      | Import in `features_onchain_service/monitors/lp_monitor.py` as output type for LP position snapshots                             |
| `DeFiLendingPosition` | Import in `features_onchain_service/monitors/lending_monitor.py` (AAVE, Compound, Morpho positions)                              |
| `DeFiStakingPosition` | Import in `features_onchain_service/monitors/staking_monitor.py` (Lido, EtherFi positions)                                       |
| `CeFiPosition`        | Import in `features_onchain_service/monitors/cefi_position_monitor.py` as unified CEX position shape                             |
| `LendingEntry`        | Import in `features_onchain_service/monitors/lending_monitor.py` as per-asset row inside `DeFiLendingPosition.supplied/borrowed` |
| `GasCostAction`       | Import in `features_onchain_service/gas/gas_estimator.py` as the action-type enum for gas estimation                             |
| `GasCostEstimate`     | Import in `features_onchain_service/gas/gas_estimator.py` as return type of `estimate_gas()`                                     |

#### Market data schemas (input/context — required for position valuation)

These were incorrectly placed in Category B. `features-onchain-service` is active; lending/LP/oracle
data is the input that drives position valuation and risk computation.

| Schema                   | Fields of note                                                                                                    | Change Required                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CanonicalLendingRate`   | `supply_index`, `borrow_index` (AAVE/Morpho accumulation indices), `borrow_apy_variable`, `health_factor`, `lltv` | Import in `features_onchain_service/monitors/lending_monitor.py` — fetch per-asset rate on each cycle; use `borrow_index` to compute actual accrued debt (actual_debt = scaled_debt × borrow_index) |
| `CanonicalLiquidityPool` | `reserve0/1`, `tvl`, `sqrt_price_x96`, `tick_current`, `apy`, `volume_24h`                                        | Import in `features_onchain_service/monitors/lp_monitor.py` — pool state snapshot needed to value LP position at current tick                                                                       |
| `CanonicalOraclePrice`   | `price`, `confidence`, `publish_time`                                                                             | Import in `features_onchain_service/monitors/valuation.py` — Chainlink/Pyth price feeds used to denominate all DeFi positions in USD; required for health factor recalculation                      |
| `CanonicalStakingRate`   | `apy`, `total_staked`, `rewards_per_second`                                                                       | Import in `features_onchain_service/monitors/staking_monitor.py` — staking APY needed to compute yield inside `DeFiStakingPosition`                                                                 |

**Why these are Category A, not B:** `DeFiLendingPosition.health_factor` is meaningless without
current oracle prices. `DeFiLendingPosition.net_apy` is meaningless without `supply_apy`/`borrow_apy_variable`.
Actual accrued debt = `scaled_debt_token_balance × borrow_index` — `borrow_index` comes from
`CanonicalLendingRate.borrow_index`. These four schemas are inputs that enable the position
schemas to be correctly populated, not optional extras.

#### DEX swap events

| Schema          | Change Required                                                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CanonicalSwap` | Stub adapter created at `features_onchain_service/adapters/dex_swap_adapter.py` — `UniswapV3SwapAdapter` and `CurveSwapAdapter` normalize subgraph events to this type. Import in `features_onchain_service/engine/` or a new `dex_swap_engine.py` as the output type emitted to the swap analytics topic. |

**Where:** `features-onchain-service/features_onchain_service/monitors/` and `features_onchain_service/gas/`.

### A10. Lifecycle Event Messages (→ all services with PubSub)

These two schemas are infra-level but have immediate consumers:

| Schema                         | Target Services                                                                   | Change Required                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `ServiceLifecycleEventMessage` | Every service that emits `LifecycleEventType.SERVICE_STARTED` / `SERVICE_STOPPED` | Wrap the existing `log_event()` call in a `ServiceLifecycleEventMessage` envelope and publish to `SERVICE_LIFECYCLE` topic |
| `PubSubLifecycleEventMessage`  | Any service that subscribes/publishes to PubSub                                   | Emit on successful subscription/connection; already defined, just needs wiring                                             |

**Where:** Existing `log_event()` call sites in each service's startup/shutdown path.

---

## Category B — Deferred (No Active Service Yet)

These schemas are well-defined but their consumer service is not yet active. Keep in UIC; adopt when the service ships.

`CanonicalLendingRate`, `CanonicalLiquidityPool`, `CanonicalOraclePrice`, `CanonicalStakingRate`, and `CanonicalSwap`
have been moved to **Category A** (see A9 above) — `features-onchain-service` is active and requires them.

| Schema                | Waiting For                                  | Notes                                                                                |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `CanonicalBondData`   | Fixed-income trading service (not yet built) | Bond/treasury data shape; UAC already has normalizer gaps for fixed income           |
| `CanonicalOHLCV`      | OHLCV consolidation refactor                 | Currently covered by `CanonicalOhlcvBar`; evaluate if both are needed or merge       |
| `CanonicalYieldCurve` | Fixed income / rates service (not yet built) | Term structure data                                                                  |
| `AuditRequirement`    | Compliance / regulatory reporting service    | Defines per-schema audit retention rules; not yet consumed by any service            |
| `AuditRetention`      | Same as `AuditRequirement`                   | Retention period enum                                                                |
| `EXECUTION_AUDIT`     | Compliance service                           | Audit constant for execution log retention                                           |
| `STRATEGY_AUDIT`      | Compliance service                           | Audit constant for strategy log retention                                            |
| `AssetClass`          | Market data categorization refactor          | Enum for asset categorization; adopt when instruments-service adds asset_group field |

**Note:** The `CanonicalOptions*` family (`CanonicalOptionsChainEntry`) is currently orphaned but has normalizers in UAC. Candidate consumer: `market-data-processing-service` options candle adapter when options tick processing is activated.

---

## Category C — Needs Service-Level Wiring

The PubSub infrastructure is **already implemented** — `get_event_bus()` from `unified_cloud_interface`
returns a cloud-agnostic `EventBus` (GCP Pub/Sub in production, local queue in batch/test). There is no
infrastructure blocker. These schemas are orphaned only because per-service emit/consume wiring has not
been added yet. Each group below is a discrete wiring task that can be done independently.

### C1. Messaging Framework (adopt together as a set)

| Schema                  | Role                                                     |
| ----------------------- | -------------------------------------------------------- |
| `MessagingScope`        | Topic scoping enum (INTERNAL, CROSS_SERVICE, BROADCAST)  |
| `MessagingTopic`        | Topic descriptor with scope + name + schema_class        |
| `InternalPubSubTopic`   | Enum of all internal PubSub topic names                  |
| `PubSubMessageEnvelope` | Standard message wrapper with correlation_id + timestamp |

**Wiring task:** Add a `messaging.py` helper to `unified_trading_library` that wraps `get_event_bus().publish()` with `PubSubMessageEnvelope` serialization. Wire `InternalPubSubTopic` enum as the topic-name source for all `*Message` publish calls (A3–A7).

### C2. Event Metadata (adopt together)

| Schema                   | Role                                                       |
| ------------------------ | ---------------------------------------------------------- |
| `EventMetadata`          | Common event header (source_service, version, environment) |
| `EventSeverity`          | Severity enum for all events                               |
| `LifecycleEventEnvelope` | Typed envelope wrapping any lifecycle event with metadata  |

**Wiring task:** Update each service's `log_event()` call sites to construct `LifecycleEventEnvelope` with `EventMetadata` and publish via `get_event_bus()`. No new infrastructure needed — just typed wrappers around the existing `log_event()` pattern.

### C3. Lifecycle Instrumentation Detail Schemas

These companion schemas carry structured payloads for lifecycle events. They should be adopted when C2 is wired — pass them as the `details` dict inside `EventMetadata`.

| Schema Group    | Schemas                                                          | Target                                                                                |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Persistence** | `PersistenceStartedDetails`, `PersistenceCompletedDetails`       | `market-data-processing-service`, `instruments-service` — emit on GCS write start/end |
| **Processing**  | `ProcessingStartedDetails`, `ProcessingCompletedDetails`         | `market-data-processing-service` — emit on candle batch start/end                     |
| **Validation**  | `ValidationStartedDetails`, `ValidationCompletedDetails`         | `instruments-service` — emit on schema validation start/end                           |
| **Generic**     | `StartedDetails`, `StartedEvent`, `FailedDetails`, `FailedEvent` | All services — standardized start/fail events                                         |

### C4. WebSocket Connectivity Events (adopt in interface repos, not services)

| Schema                       | Correct Consumer                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `WebSocketConnectEvent`      | `unified-market-interface` + `unified-sports-execution-interface` — emit at WS connect |
| `WebSocketDisconnectEvent`   | Same                                                                                   |
| `WebSocketErrorEvent`        | Same                                                                                   |
| `WebSocketPingEvent`         | Same                                                                                   |
| `WebSocketPongEvent`         | Same                                                                                   |
| `WebSocketReconnectEvent`    | Same                                                                                   |
| `WebSocketSubscribeAckEvent` | Same                                                                                   |

**Note:** These are correctly used by interface repos (not terminal consumer services), which is why the adoption script shows 0 terminal-service importers. They are NOT orphaned — this is a script scoping issue.

---

## Implementation Priority

| Priority                         | Schemas                                                                                    | Effort                                                              | Owner                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **P0 — High impact, low effort** | `FillEventMessage`, `StrategySignalMessage`, `MLPredictionMessage`, `FeatureUpdateMessage` | Add emit+consume wiring to existing pipeline                        | execution-service, strategy-service, ml-inference-service, features-\* |
| **P1 — Risk safety critical**    | `CircuitBreakerEventMessage`, `LiquidationMessage`, `LimitCheckResult`, `RiskAlertMessage` | New handler + PubSub topic                                          | execution-service, risk-and-exposure-service, alerting-service         |
| **P2 — Alerting/security**       | All A1 + A2 alert schemas (10 schemas)                                                     | New alerting-service handlers                                       | alerting-service                                                       |
| **P3 — DeFi positions**          | All A9 (7 schemas)                                                                         | New monitor classes in features-onchain                             | features-onchain-service                                               |
| **P4 — ML config**               | `MLConfigDict`, `ModelType`, `ModelVariantConfig`                                          | Replace string literals in ml-training                              | ml-training-service                                                    |
| **P5 — Service wiring**          | All Category C (33 schemas)                                                                | Add typed envelope + per-service emit/consume via `get_event_bus()` | cross-service                                                          |

---

## ADOPTION_MATRIX.md Script Note

The script-generated `ADOPTION_MATRIX.md` shows **81 orphans** (125 total). The live grep audit
finds **76 true orphans** (124 total). Discrepancy: the script missed imports in
`position-balance-monitor-service` (`AccountState`, `InternalPosition`, `PositionUpdateMessage`,
`MarginState`) and `execution-service` (`ExecutionResultMessage`, `OrderRequestMessage`).

**To refresh:** Regenerate `ADOPTION_MATRIX.md` via `python scripts/check_uic_adoption.py` from
the workspace root after confirming the script's service directory list includes
`position-balance-monitor-service`.
