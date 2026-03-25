---
name: live-batch-alignment-audit
overview: |
  Full live/batch alignment remediation. Services should think they're doing the same thing
  regardless of mode — only infrastructure (transport, triggering, lifecycle) differs.
  Covers: matching-engine wiring, CanonicalFill convergence, L0 matcher for top-of-book,
  topology_reader move to UTL, feature service live readiness, event sink fixes,
  sharding SSOT docs, ServiceMode deletion.
type: mixed
epic: epic-code-completion
status: active
locked_by: live-defi-rollout
locked_since: 2026-03-18

completion_gates:
  code: C0
  deployment: D2
  business: none

repo_gates:
  - repo: matching-engine-library
    code: C0
    deployment: none
    business: none
  - repo: unified-internal-contracts
    code: C0
    deployment: none
    business: none
  - repo: unified-api-contracts
    code: C0
    deployment: none
    business: none
  - repo: unified-trade-execution-interface
    code: C0
    deployment: none
    business: none
  - repo: unified-cloud-interface
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
  - repo: execution-service
    code: C0
    deployment: none
    business: none
  - repo: strategy-service
    code: C0
    deployment: none
    business: none
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
  - repo: features-sports-service
    code: C0
    deployment: none
    business: none
  - repo: features-calendar-service
    code: C0
    deployment: none
    business: none
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
  - repo: ml-training-service
    code: C0
    deployment: none
    business: none
  - repo: ml-inference-service
    code: C0
    deployment: none
    business: none
  - repo: position-balance-monitor-service
    code: C0
    deployment: none
    business: none
  - repo: risk-and-exposure-service
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
    code: C0
    deployment: none
    business: none
  - repo: unified-defi-execution-interface
    code: C0
    deployment: none
    business: none
  - repo: deployment-service
    code: C0
    deployment: none
    business: none
  - repo: unified-trading-pm
    code: C0
    deployment: none
    business: none
  - repo: unified-trading-codex
    code: C0
    deployment: none
    business: none

depends_on: []

todos:
  # =================================================================
  # PHASE 0: LIBRARY FOUNDATIONS (T0/T1 — no service changes)
  # All items PARALLEL within phase. QG gate before Phase 1.
  # =================================================================

  # --- 0A: Matching Engine — L0 Matcher + Sports Routing ---

  - id: p0a-l0-matcher
    content: |
      - [x] [AGENT] P0. Add L0Matcher (top-of-book only, no trades) to matching-engine-library
      New BookType: L0_TOB (Top of Book) in unified-internal-contracts domain/matching_engine.
      L0Matcher: fills at best bid/offer, no partial fills, no trade tape.
      Use case: scraped bookmakers, any source with only top-of-book quotes.
      Routing: BookmakerCategory.SCRAPER -> L0_TOB, BookmakerCategory.AGGREGATOR -> L0_TOB.
      Files: unified-internal-contracts/unified_internal_contracts/domain/matching_engine/__init__.py (add L0_TOB),
      matching-engine-library/matching_engine_library/engine.py (add L0Matcher class + routing).
      Tests: unit tests for L0Matcher with top-of-book-only data.
    status: done
    note: "Completed 2026-03-18. L0_TOB added to BookType, L0Matcher class + 17 tests."

  - id: p0a-sports-routing
    content: |
      - [x] [AGENT] P0. Add sports venue routing to matching-engine-library
      Map BookmakerCategory (from UAC bookmaker_registry.py) to BookType:
        EXCHANGE (Betfair, Smarkets, Polymarket, Kalshi) -> L2_MBP (multi-level depth)
        BOOKMAKER_API (Pinnacle, 1xBet) -> L1_MBP (top of book with some depth)
        STREAMING_API (OpticOdds, OddsJam) -> L1_MBP
        AGGREGATOR (The Odds API) -> L0_TOB (top of book only)
        SCRAPER (50+ bookmakers) -> L0_TOB (top of book only)
      Add category "sports" to CATEGORY_DEFAULT_BOOK_TYPE in engine.py.
      Add PREDICTION_MARKET instruction type -> L2_MBP mapping.
      Files: matching-engine-library/matching_engine_library/engine.py (routing tables),
      unified-internal-contracts BookType enum (if PREDICTION_MARKET instruction type needed).
      Tests: unit tests for sports venue routing, prediction market routing.
    status: done
    note: "Completed 2026-03-18. Sports/prediction categories, BOOKMAKER_BOOK_TYPE mapping, BET instruction type."

  # --- 0B: CanonicalFill Convergence ---

  - id: p0b-canonical-fill-audit
    content: |
      - [x] [AGENT] P0. Pre-audit all fill types across the system
      RESULT: CanonicalFill (UAC) is already the SSOT. 25+ importers across 9+ repos.
      All local Fill types (FillRecord, FillEvent, TradeFill, FillDict, HOFillRecord, etc.)
      are intentionally scoped for specific purposes (API models, analytics TypeDicts, caching).
      No convergence migration needed. Zero duplicate definitions of CanonicalFill.
      MatchResult (UIC matching_engine) is NOT a fill — it's an order matching result.
      Remaining work: add MatchResult.to_canonical_fill() converter in Phase 1A when
      matching-engine-library is wired into execution-service.
    status: done
    note: "Completed 2026-03-18. Architecture already converged."

  - id: p0b-match-result-converter
    content: |
      - [x] [AGENT] P1. Add MatchResult.to_canonical_fill() converter to matching-engine-library
      MatchResult (UIC domain/matching_engine) needs a method to produce CanonicalFill (UAC).
      Maps: filled_quantity -> quantity, fill_price -> price, fee_amount -> fee,
      price_impact_bps -> fee_rate (bps). Generates fill_id (uuid4). Requires caller to
      pass order_id, venue, instrument_id, side, timestamp (not available in MatchResult).
      Signature: to_canonical_fill(order_id, venue, instrument_id, side, timestamp) -> CanonicalFill.
      Files: matching-engine-library/matching_engine_library/engine.py (add method to MatchResult
      or create standalone converter function).
      Tests: unit test that MatchResult -> CanonicalFill produces valid fields.
    status: done
    note: "Completed 2026-03-18. converters.py + 13 tests. UAC dep added to pyproject.toml."

  # --- 0C: Delete ServiceMode Duplicate ---

  - id: p0c-delete-servicemode
    content: |
      - [x] [AGENT] P1. Delete ServiceMode enum from unified-cloud-interface
      ServiceMode(StrEnum) in unified_cloud_interface/protocol.py:16-18 duplicates
      RuntimeMode in unified-internal-contracts/modes.py:38-48.
      1. Replace all ServiceMode references in UCI with RuntimeMode from UIC.
      2. Update factory.py get_service_mode() to return RuntimeMode.
      3. Update all downstream consumers that import ServiceMode.
      Pre-audit: grep for "ServiceMode" across all repos; update each import.
      Clean break — no re-export, no deprecation wrapper.
    status: done
    note:
      "Completed 2026-03-18. 9 files across 3 repos (UCI, instruments-service, deployment-api). UCI constants.py
      RuntimeMode used."

  # --- 0D: Move topology_reader to UTL ---

  - id: p0d-move-topology-reader
    content: |
      - [x] [AGENT] P0. Move topology_reader from unified-config-interface to unified-trading-library
      Rationale: all services depend on UTL; not all depend on UCI. topology_reader belongs
      where services can reach it without adding a new dependency.
      1. Move unified_config_interface/topology_reader.py -> unified_trading_library/topology/topology_reader.py
      2. Update unified_trading_library/__init__.py exports:
         get_messaging_protocol, get_storage_protocol, get_deployment_target,
         get_allowed_transports, get_topology_version.
      3. Delete topology_reader.py from unified-config-interface (clean break, no re-export).
      4. Update all consumers that import from unified_config_interface.topology_reader -> unified_trading_library.
      Pre-audit: grep "topology_reader" across all repos for import manifest.
      Tests: move tests from UCI to UTL; ensure topology resolution still works.
    status: done
    note: "Completed 2026-03-18. Moved to UTL topology/ module, 20 tests, deployment-service import updated. Clean break."

  # --- 0E: Sharding SSOT Docs + Symlink ---

  - id: p0e-sharding-ssot-docs
    content: |
      - [x] [AGENT] P1. Confirm sharding SSOT in PM and update all references
      Sharding configs already live in PM (configs/sharding_config.yaml + 16 per-service files).
      deployment-service/configs/ has NO sharding copies — no conflict.
      1. Create symlink: deployment-service/configs/sharding/ -> ../../unified-trading-pm/configs/
         (or symlink individual sharding.*.yaml files so ConfigLoader finds them at default path).
         Verify ConfigLoader(config_dir="configs") resolves sharding files via symlink.
      2. Update deployment-service e2e test (test_deployment_e2e.py:105) config_dir fixture
         to resolve through symlink.
      3. Update SSOT-INDEX (unified-trading-codex/00-SSOT-INDEX.md) to document:
         "Sharding SSOT: unified-trading-pm/configs/sharding_config.yaml + sharding.*.yaml"
      4. Update any codex/cursor-rules that reference sharding as deployment-service-owned.
      5. Update runtime-topology.yaml header comments if they reference deployment-service for sharding.
    status: done
    note: "Completed 2026-03-18. 38 symlinks in deployment-service/configs/, 6 codex docs updated, PM is SSOT."

  # === QG GATE: Phase 0 complete ===
  # Run QG on: matching-engine-library, unified-internal-contracts, unified-api-contracts,
  # unified-cloud-interface, unified-trading-library, unified-config-interface, deployment-service.
  # All must pass before Phase 1.

  # =================================================================
  # PHASE 1: EXECUTION & STRATEGY CONVERGENCE (depends on Phase 0)
  # =================================================================

  - id: p1a-wire-matching-engine
    content: |
      - [x] [AGENT] P0. Wire matching-engine-library into execution-service batch path
      Replace execution_service/engine/modes/batch/matching_engine.py (BatchMatchingEngine
      with hardcoded 5bps slippage) with matching-engine-library matchers.
      Routing: instrument_id -> category -> BookType -> matcher (L1/L2/AMM/Benchmark/L0).
      Batch mode: ALWAYS uses matching-engine-library (simulated fills).
      Live mode with real API keys or testnet: uses UTEI adapters (real exchange fills).
      Live mode without real keys (paper): uses matching-engine-library (same as batch).
      Both paths return CanonicalFill (from Phase 0B).
      Delete BatchMatchingEngine class. Update LiveMatchingEngine to also wrap CanonicalFill.
      Files: execution-service/engine/modes/batch/matching_engine.py (replace),
      execution-service/engine/modes/live/matching_engine.py (update return type),
      execution-service/engine/modes/live/factory.py (add paper mode routing).
      Tests: update all execution-service matching tests.
    status: done
    blocked_by: p0a-l0-matcher, p0a-sports-routing, p0b-converge-fills
    note: "Completed 2026-03-18. BatchMatchingEngine rewritten with MEL, PaperMatchingEngine added, 10 files."

  - id: p1b-strategy-fill-interface
    content: |
      - [x] [AGENT] P1. Unify strategy-service fill interface
      Abstract FillSimulator (batch) and CascadeSubscriber (live) behind a common interface.
      Both produce CanonicalFill. Strategy engine consumes fills from the interface
      regardless of source.
      1. Create FillSource protocol/ABC: async def get_fills(signals) -> list[CanonicalFill]
      2. SimulatedFillSource: wraps matching-engine-library (for batch + paper live)
      3. ExchangeFillSource: wraps CascadeSubscriber (for real live + testnet live)
      4. Strategy engine receives FillSource at init, doesn't know which one it has.
      Files: strategy-service/engine/ (new fill_source.py protocol),
      strategy-service/engine/backtest/fill_simulator.py (implement SimulatedFillSource),
      strategy-service/adapters/cascade_subscriber.py (implement ExchangeFillSource).
      Tests: test both sources produce same CanonicalFill schema.
    status: done
    blocked_by: p0b-converge-fills
    note: "Completed 2026-03-18. FillSource protocol, SimulatedFillSource, ExchangeFillSource, 35 tests."

  # === QG GATE: Phase 1 complete ===
  # Run QG on: execution-service, strategy-service.

  # =================================================================
  # PHASE 2: FEATURE SERVICES LIVE READINESS (depends on Phase 0D)
  # All items PARALLEL within phase.
  # =================================================================

  - id: p2a-features-delta-one-merge
    content: |
      - [x] [AGENT] P1. Merge features-delta-one live/batch calculation paths
      Current: batch uses OrchestrationService, live uses PubSubSubscriber with separate calc.
      Target: single calculation engine. Live handler triggers same OrchestrationService
      but with PubSub input + PubSub/GCS output (via topology_reader).
      Batch handler triggers same engine with GCS input + GCS output.
      Use topology_reader.get_messaging_protocol(mode) to select transport.
      Files: features_delta_one_service/cli/handlers/live_handler.py (rewrite),
      features_delta_one_service/cli/handlers/batch_handler.py (extract shared calc),
      features_delta_one_service/app/orchestration_service.py (make transport-agnostic).
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. topology_reader added, shared OrchestrationService path."

  - id: p2b-features-sports-merge
    content: |
      - [x] [AGENT] P1. Merge features-sports live/batch calculation paths
      Current: batch uses SportsFeatureService.compute_features(), live uses separate
      PubSub handler class. Target: single compute path, two triggers.
      Use topology_reader for transport. Live subscribes to upstream events,
      batch receives date range from CLI.
      Files: features_sports_service/cli/main.py (unify dispatch),
      features_sports_service/cli/handlers/ (merge live + batch handlers).
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. topology_reader added, shared process_sports_record() path."

  - id: p2c-features-onchain-live
    content: |
      - [x] [AGENT] P1. Implement features-onchain live mode
      Current: batch-only (only BatchHandler exists, no LiveHandler).
      Target: LiveHandler that subscribes to upstream onchain data events,
      runs same calculation as batch, publishes features via PubSub.
      Use topology_reader for transport selection.
      Pattern: follow features-volatility (closest to parity — run_live wraps same engine).
      Files: features_onchain_service/cli/handlers/live_handler.py (new),
      features_onchain_service/cli/main.py (wire into get_handler_for_mode).
      Tests: unit test for live handler with mock PubSub.
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. LiveHandler rewritten with OnChainOrchestrationService."

  - id: p2d-features-multi-timeframe-live
    content: |
      - [x] [AGENT] P1. Implement features-multi-timeframe live mode
      Current: orchestrator.run_live() is async stub loop.
      Target: real implementation using same MtfFeatureService.compute_features() as batch,
      triggered by upstream feature-ready events, publishes results via topology_reader.
      Files: features_multi_timeframe_service/cli/main.py (wire live dispatch),
      features_multi_timeframe_service/app/orchestration_service.py (implement run_live).
      Tests: unit test for live mode with mock events.
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. Stub replaced with real run_live() using shared compute_features()."

  - id: p2e-features-cross-instrument-impl
    content: |
      - [x] [AGENT] P2. Implement features-cross-instrument service (both modes)
      Current: entire service is a stub (log_event calls only, no computation).
      Target: full cross-instrument feature calculation for both batch and live.
      This requires understanding what cross-instrument features are needed
      (correlation matrices, spread features, relative value signals).
      Use unified-feature-calculator-library for calculation.
      Use topology_reader for transport.
      Files: features_cross_instrument_service/cli/main.py (implement),
      features_cross_instrument_service/cli/handlers/ (batch + live handlers),
      features_cross_instrument_service/app/ (core calculation logic).
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. CLI main.py wired to BatchHandler/LiveHandler. BatchHandler reads delta-one parquet from GCS input bucket, dispatches to CrossInstrumentFeatureService.compute_features() per group, writes results to GCS output bucket. LiveHandler uses topology_reader (get_messaging_protocol/get_storage_protocol). 11 calculators already implemented with 360+ tests."

  - id: p2f-features-calendar-live
    content: |
      - [x] [AGENT] P1. Wire features-calendar live mode
      Current: manifest declares batch only, but LiveDataSource and BroadcastSink
      adapters exist and are tested (test_live_seams.py). CLI is batch-only.
      Target: add --mode live to CLI, wire LiveDataSource + BroadcastSink into
      live handler, use topology_reader for transport.
      Files: features_calendar_service/cli/ (add live handler),
      features_calendar_service/adapters/live_data_source.py (already exists),
      features_calendar_service/adapters/broadcast_sink.py (already exists).
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. LiveHandler rewritten with CalendarOrchestrationService."

  - id: p2g-features-volatility-verify
    content: |
      - [x] [AGENT] P2. Verify features-volatility live/batch alignment
      Current: closest to parity — run_live() wraps same engine as run_batch().
      Verify: same calculation path, topology_reader usage, event schemas.
      Fix any minor gaps found. Add topology_reader for transport if missing.
      Files: features_volatility_service/cli/handlers/base_handler.py (verify),
      features_volatility_service/cli/main.py (add topology_reader if missing).
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. Verified alignment, topology_reader added."

  # === QG GATE: Phase 2 complete ===
  # Run QG on: all 7 feature services.

  # =================================================================
  # PHASE 3: DATA PIPELINE + ALL SERVICES — TOPOLOGY_READER ADOPTION
  # (depends on Phase 0D)
  # All items PARALLEL within phase.
  # =================================================================

  - id: p3a-instruments-live-wiring
    content: |
      - [x] [AGENT] P1. Wire instruments-service live handler into CLI dispatch
      Current: LiveModeHandler exists but is NOT reachable from CLI parser.
      --interval arg is built but not exposed in parser.
      Target: expose --interval in parser, wire LiveModeHandler into
      get_handler_for_mode("live"), make --start-date optional for live mode.
      Use topology_reader for transport selection.
      Files: instruments_service/cli/parser.py (expose --interval, make dates optional for live),
      instruments_service/cli/main.py (wire LiveModeHandler into dispatch).
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. Live handler registered, --interval exposed, --start-date optional for live."

  - id: p3b-mdps-coordination-events
    content: |
      - [x] [AGENT] P1. Add coordination event subscription to market-data-processing-service
      Current: no upstream event subscription in live mode (unlike market-tick-data-service
      which subscribes to INSTRUMENTS_READY).
      Target: live mode subscribes to upstream MARKET_DATA_READY or INSTRUMENTS_READY
      coordination event before starting candle processing.
      Use topology_reader for transport.
      Files: market_data_processing_service/cli/main.py (add event subscription),
      market_data_processing_service/cli/handlers/live_mode_handler.py (trigger on event).
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. INSTRUMENTS_READY subscription + callback in live handler."

  - id: p3c-topology-reader-adoption-data
    content: |
      - [x] [AGENT] P1. Adopt topology_reader in all data pipeline services
      Services: instruments-service, market-tick-data-service, market-data-processing-service.
      Replace hardcoded GCS/PubSub transport selection with:
        protocol = get_messaging_protocol(mode=runtime_mode, service=service_name)
      Each service currently hardcodes its transport — change to dynamic resolution.
      Files: each service's main.py or handler files where transport is initialized.
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. 3 services updated with topology-driven sink selection."

  - id: p3d-topology-reader-adoption-monitoring
    content: |
      - [x] [AGENT] P1. Adopt topology_reader in ML and monitoring services
      Services: ml-training-service, ml-inference-service, position-balance-monitor-service,
      risk-and-exposure-service, pnl-attribution-service, alerting-service.
      Same pattern: replace hardcoded transport with topology_reader calls.
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. 4 services updated with topology-driven sink selection."

  - id: p3e-fix-event-sinks
    content: |
      - [x] [AGENT] P1. Fix incorrect event sinks across services
      Current issues:
        - ml-training-service: uses MockEventSink (should be GCSEventSink)
        - position-balance-monitor-service: uses MockEventSink (should be real sink)
        - pnl-attribution-service: uses GCSEventSink for live (should also PubSub)
        - ml-inference-service: uses GCSEventSink for live (should also PubSub)
      Target: live mode uses PubSub (transport) + GCS (persistence), per topology.
      Batch mode uses GCS (transport = persistence).
      Use topology_reader to determine sink type.
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. MockEventSink replaced in 2 services, PubSub added to 2 services."

  - id: p3f-risk-service-extract-calc
    content: |
      - [x] [AGENT] P2. Extract shared risk calculation from risk-and-exposure-service
      Current: live = async monitor_loop() + FastAPI server, batch = one-shot calculation.
      Two completely different code paths for same risk models.
      Target: extract RiskCalculator into shared function/class.
      Live handler: calls RiskCalculator in async loop + serves via API.
      Batch handler: calls same RiskCalculator once + writes GCS snapshot.
      Trigger and presentation differ; calculation is identical.
      Files: risk_and_exposure_service/cli/main.py (refactor run_live/run_batch),
      risk_and_exposure_service/core/ (extract RiskCalculator).
    status: done
    blocked_by: p0d-move-topology-reader
    note: "Completed 2026-03-18. RiskCalculator extracted to core/risk_calculator.py, RiskMonitor delegates."

  # === QG GATE: Phase 3 complete ===
  # Run QG on: all data pipeline services, all ML/monitoring services.

  # =================================================================
  # PHASE 4: DEFI ALIGNMENT (depends on Phase 0)
  # =================================================================

  - id: p4a-defi-handler-stubs
    content: |
      Stubs: stake_handler, lend_handler, borrow_handler, swap_handler, flash_loan_handler
      (8 functions across 5 files).
      Target: full Web3 transaction building, signing, and broadcasting for each operation.
      Reference implementation: Aave V3 connector in unified-defi-execution-interface
      (protocols/aave.py _Web3LiveExecutor).
      Each handler should work with paper_trading=True (sign but don't broadcast) and
      paper_trading=False (broadcast to chain).
    status: done
    note: "Completed 2026-03-18. Protocol-to-handler routing, signal-to-order conversion, paper/live dispatch."

  - id: p4b-defi-reconnection
    content: |
      Current: if any adapter connection drops, strategy loop continues but trades fail silently.
      No fault tolerance.
      Target: exponential backoff reconnection for RPC connections.
      AdapterRegistry.reconnect(adapter_name) method. Strategy loop catches connection
      failures, calls reconnect, retries. After max retries, emit CIRCUIT_BREAKER_OPEN event.
      Also add to unified-defi-execution-interface BaseConnector: reconnect() abstract method.
      unified-defi-execution-interface/protocols/base.py (reconnect abstract method),
      unified-defi-execution-interface/connectors/registry.py (reconnect_all method).
    status: done
    note:
      "Completed 2026-03-18. BaseConnector.reconnect(), registry.reconnect_all(), exp-backoff 1-16s, circuit breaker
      event."

  # === QG GATE: Phase 4 complete ===

  # =================================================================
  # PHASE 5: ML LIVE READINESS (depends on Phase 3)
  # =================================================================

  - id: p5a-ml-training-promotion-flow
    content: |
      - [x] [AGENT] P2. Document and implement ML model train/promote/rollout flow
      Training is ALWAYS a batch job — never "live training". Two triggers:
        1. Cloud Scheduler (monthly/quarterly) — spins up VM, runs training pipeline
        2. Human manual trigger — CLI or GHA workflow_dispatch
      Both produce a trained model artifact in GCS (models bucket).
      Post-training flow:
        1. Training completes -> emit MODEL_TRAINED coordination event
        2. Telegram notification to human: "Model X v2 trained, metrics: ..."
        3. Human validates (reviews metrics, compares to current model)
        4. Human approves promotion via /approve command or UI action
        5. On approval -> emit MODEL_PROMOTED event
        6. ml-inference-service subscribes to MODEL_PROMOTED, hot-reloads model
      Implementation:
        - ml-training-service: emit MODEL_TRAINED event on completion (add to existing batch flow)
        - alerting-service: route MODEL_TRAINED to Telegram with metrics summary
        - ml-inference-service: subscribe to MODEL_PROMOTED, reload model from GCS
        - Promotion is a human decision — no auto-promote
      Files: ml_training_service/cli/main.py (add MODEL_TRAINED event emission),
      alerting-service (add MODEL_TRAINED routing),
      ml-inference-service (add MODEL_PROMOTED subscription + hot-reload).
      Do NOT touch any UI for this — command-line and Telegram only for now.
    status: done
    blocked_by: p3e-fix-event-sinks
    note: "Completed 2026-03-18. MODEL_TRAINED event, Telegram routing, MODEL_PROMOTED hot-reload subscriber."

  # === QG GATE: Phase 5 complete ===
  # Run QG on: ml-training-service.

  # =================================================================
  # PHASE 6: CROSS-SYSTEM VALIDATION (depends on all prior phases)
  # =================================================================

  - id: p6a-vcr-parity-tests
    content: |
      - [x] [AGENT] P2. Add VCR cassette parity tests for live/batch schema equivalence
      Current: cassettes validate individual endpoints, NOT cross-mode consistency.
      Target: for each venue with both live (WebSocket) and historical (REST) adapters,
      add a test that verifies the normalized output schema is identical.
      E.g., Binance live WS trade == Binance historical REST trade (same CanonicalTrade fields).
      Focus: UMI adapters for CeFi venues (Binance, Coinbase, Bybit, OKX, Deribit).
      Files: unified-market-interface/tests/ (new test_live_batch_schema_parity.py),
      unified-api-contracts/tests/ (extend test_cassette_schema_parity.py).
    status: done
    blocked_by: p1a-wire-matching-engine
    note: "Completed 2026-03-18. 113 tests across 5 CeFi venues x 3 data types + cross-venue consistency."

  - id: p6b-workspace-qg-sweep
    content: |
      - [ ] [AGENT] P0. Run QG on all 30 affected repos
      Final validation: bash scripts/quality-gates.sh in every repo listed in repo_gates.
      All must pass. Any failure must be fixed before plan can be archived.
    status: todo
    blocked_by: p6a-vcr-parity-tests
    note: "SEQUENTIAL — final gate"

isProject: false
---

# Notes & Context

## Execution DAG

```
Phase 0 (PARALLEL — library foundations)
  |-- 0A: L0Matcher + sports routing (matching-engine-library, UIC)
  |-- 0B: CanonicalFill convergence (UAC, UTEI, execution-service, strategy-service)
  |-- 0C: Delete ServiceMode (UCI -> use RuntimeMode from UIC)
  |-- 0D: Move topology_reader (UCI -> UTL)
  |-- 0E: Sharding SSOT docs + deployment-service symlink
  |
  v  [QG GATE: matching-engine-library, UIC, UAC, UCI, UTL, deployment-service]
  |
  +--------------------------------------------------+
  |              |              |              |
Phase 1       Phase 2       Phase 3       Phase 4
(execution)   (features)    (services)    (DeFi)
ALL FOUR PHASES RUN IN PARALLEL after Phase 0
  |              |              |              |
  1A: Wire MEL  2A: delta-one  3A: instr     4A: DeFi stubs
  1B: Strategy  2B: sports     3B: MDPS      4B: DeFi reconn
                2C: onchain    3C: topo data
                2D: multi-tf   3D: topo ML
                2E: cross-inst 3E: event sinks
                2F: calendar   3F: risk calc
                2G: volatility
  |              |              |              |
  +--------------------------------------------------+
  |
Phase 5 (depends on Phase 3 event sink fixes)
  |-- 5A: ML train/promote/rollout flow
  |
Phase 6 (depends on ALL)
  |-- 6A: VCR parity tests
  |-- 6B: Workspace QG sweep
```

## Legitimate Live/Batch Differences (NOT bugs)

These are the ONLY things that should differ between live and batch:

| Concern      | Batch                               | Live                                                    |
| ------------ | ----------------------------------- | ------------------------------------------------------- |
| Transport    | GCS parquet                         | PubSub + separate GCS persist                           |
| Triggering   | --start-date / --end-date           | Event-driven or wall-clock interval                     |
| Lifecycle    | Finite Cloud Run Job                | Long-lived Cloud Run Service                            |
| Matching     | matching-engine-library (simulated) | Real exchange (UTEI) OR matching-engine-library (paper) |
| Alerts       | Suppressed                          | Active (Telegram, PagerDuty)                            |
| Startup      | Date range + data existence         | Upstream readiness (coordination events) + health gate  |
| Reconnection | N/A                                 | Exp-backoff + GCS backfill                              |

Everything else (calculation logic, event schemas, sharding dimensions, GCS persistence, fill schemas, feature schemas)
MUST be identical.

## Matching Engine Routing Table (Target State)

| Category                    | Instruction Type  | BookType   | Matcher                                 |
| --------------------------- | ----------------- | ---------- | --------------------------------------- |
| cefi                        | TRADE             | L2_MBP     | L2Matcher (5-level order book)          |
| tradfi                      | TRADE             | L1_MBP     | L1Matcher (trade + aggressor)           |
| defi                        | SWAP              | AMM        | AMMMatcher (x\*y=k)                     |
| defi                        | LEND/BORROW/STAKE | ALPHA_ZERO | BenchmarkMatcher (instant fill)         |
| sports (exchange)           | PREDICTION_MARKET | L2_MBP     | L2Matcher (betting exchange order book) |
| sports (bookmaker API)      | PREDICTION_MARKET | L1_MBP     | L1Matcher (top of book + some depth)    |
| sports (scraper/aggregator) | PREDICTION_MARKET | L0_TOB     | L0Matcher (top of book only)            |

## Pre-Audit Manifest (to be populated by executing agents)

### ServiceMode consumers (Phase 0C)

TBD — grep "ServiceMode" across all repos before execution.

### topology_reader consumers (Phase 0D)

TBD — grep "topology_reader" across all repos before execution.

### Fill type consumers (Phase 0B)

TBD — grep "Fill|MatchResult|FillResult" across execution-service, strategy-service, matching-engine-library before
execution.
