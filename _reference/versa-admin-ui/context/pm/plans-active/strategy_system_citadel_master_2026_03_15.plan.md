---
name: strategy-system-citadel-master-2026-03-15
overview: |
  Citadel-grade master plan consolidating strategy universe expansion (mean reversion, options ML 3 types,
  sports market making, prediction market arb), instrument availability (Polymarket/Kalshi canonical mapping),
  strategy manifest with maturity tracking (code/deployment/business readiness), config system N10
  (audit trail, slice subscriptions, reloader expansion), events canonicalization (17 ad-hoc + CI/CD + agent events),
  UI/API completeness (6 orphaned mappings, strategy onboarding), comprehensive testing (scenario framework,
  strategy readiness QG), dependency chain tracking (reverse lookup, usage tags, interactive viz), and legacy cleanup.
  Stripped of already-completed items from March 13 audit. Built up with enhanced detail on options ML prediction types,
  canonical instrument ID mapping for prediction markets, and strategy-venue-instrument validation matrix.
type: mixed
epic: epic-code-completion

status: active

completion_gates:
  code: C5
  deployment: D3
  business: B4

repo_gates:
  - repo: strategy-service
    code: C0
    deployment: none
    business: none
    readiness_note: "8 new strategy classes + mean reversion + options ML + legacy cleanup"
  - repo: unified-config-interface
    code: C0
    deployment: none
    business: none
    readiness_note: "Config audit trail, slice subscriptions, instrument enums"
  - repo: unified-internal-contracts
    code: C0
    deployment: none
    business: none
    readiness_note: "LifecycleEventType expansion, CI/CD events, error hierarchy"
  - repo: unified-events-interface
    code: C0
    deployment: none
    business: none
    readiness_note: "17 ad-hoc events canonicalized, agent events, GHA emission helpers"
  - repo: unified-api-contracts
    code: C0
    deployment: none
    business: none
    readiness_note: "PREDICTION_MARKET InstrumentType, Sport StrEnum, prediction market canonical mapping"
  - repo: unified-market-interface
    code: C0
    deployment: none
    business: none
    readiness_note: "Aster VENUE_REGISTRY, prediction market adapters"
  - repo: unified-trading-library
    code: C0
    deployment: none
    business: none
    readiness_note: "DomainConfigReloader slice subscriptions, config diff"
  - repo: instruments-service
    code: C0
    deployment: none
    business: none
    readiness_note: "VX futures, livestock, prediction market instrument defs"
  - repo: execution-service
    code: C0
    deployment: none
    business: none
    readiness_note: "Options ML strike resolution, prediction market execution"
  - repo: unified-trading-pm
    code: C0
    deployment: none
    business: none
    readiness_note: "strategy-manifest.json, reverse dep lookup, QG strategy readiness tests"
  - repo: system-integration-tests
    code: C0
    deployment: none
    business: none
    readiness_note: "Scenario framework, strategy readiness validation"
  - repo: live-health-monitor-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Interactive dependency visualization"
  - repo: onboarding-ui
    code: C0
    deployment: none
    business: none
    readiness_note: "Strategy/venue/client onboarding flows"

depends_on:
  - cicd-code-rollout-master-2026-03-13

todos:
  # ============================================================
  # PHASE 1: STRATEGY MANIFEST & MATURITY INFRASTRUCTURE (P0)
  # Must exist before new strategies — provides tracking, validation, visualization
  # ============================================================

  - id: p1-strategy-manifest-schema
    content: |
      - [x] [AGENT] P0. Create `unified-trading-pm/strategy-manifest.json` — SSOT for all strategies.
      Schema per strategy entry:
      ```json
      {
        "strategy_id": "CEFI_MOMENTUM_BTC_1H",
        "display_name": "CeFi BTC Momentum (1H)",
        "category": "CEFI",
        "subcategory": "MOMENTUM",
        "domain": "cefi",
        "asset_classes": ["PERPETUAL", "SPOT_PAIR"],
        "venues": ["BINANCE_FUTURES", "BYBIT"],
        "instruments": ["BINANCE-FUTURES:PERPETUAL:BTCUSDT"],
        "data_sources": {
          "features": ["features-delta-one-service"],
          "market_data_processed": true,
          "market_data_tick": false,
          "ml_model_id": "swing_breakout_btc_1h",
          "ml_required": true
        },
        "config_file": "strategy-service/strategy_service/configs/cefi_momentum_btc.yaml",
        "class_path": "strategy_service.engine.strategies.cefi_momentum.CeFiMomentumStrategy",
        "factory_function": "create_btc_momentum_strategy",
        "maturity": {
          "code": { "status": "C4", "class_exists": true, "unit_tests": true, "qg_pass": true, "merged": false },
          "deployment": { "status": "D0", "batch_analytics": false, "mock_smoke": false, "batch_live_recon": false },
          "business": { "status": "B0", "backtest_profitable": false, "live_1d_match": false, "live_1w_match": false, "strategy_deck": false }
        },
        "restrictions": {
          "allowed_features": ["delta_one", "cross_instrument"],
          "allowed_ml_targets": ["SWING_HIGH", "SWING_LOW"],
          "min_timeframe": "1m",
          "max_timeframe": "1d"
        },
        "api_served_by": "strategy-api",
        "ui_rendered_in": ["strategy-ui", "trading-analytics-ui"],
        "batch_capable": true,
        "live_capable": true,
        "testnet_capable": false,
        "api_keys_required": ["BINANCE_API_KEY", "BINANCE_SECRET"]
      }
      ```
      Populate for ALL 21 existing strategies (16 modern + 5 legacy).
      Strategy ID convention: `{DOMAIN}_{SUBCATEGORY}_{ASSET}_{TIMEFRAME}` — human-readable, uppercase, underscores.
      Examples: `CEFI_MOMENTUM_BTC_1H`, `DEFI_BASIS_ETH_USDT`, `SPORTS_ARB_FOOTBALL_EPL`, `TRADFI_MOMENTUM_SPY_1D`,
      `OPTIONS_VOL_ML_BTC_DERIBIT`, `PREDICTION_ARB_POLYMARKET_CROSS`.
      Acceptance: JSON validates, every existing strategy has an entry, `jq` parses cleanly.
    status: done

  - id: p1-strategy-manifest-qg-tests
    content: |
      - [x] [AGENT] P0. Add strategy manifest validation to `unified-trading-pm/scripts/quality-gates.sh`:
      1. Parse strategy-manifest.json — valid JSON, no duplicate strategy_ids
      2. For each entry where `maturity.code.class_exists=true`: verify class_path importable
         (`python -c "from {class_path} import {class_name}"`)
      3. For each entry where `maturity.code.unit_tests=true`: verify test file exists
      4. For each entry: verify `config_file` path exists on disk
      5. For each entry: verify `venues[]` are all in UCI Venue enum
      6. For each entry: verify `asset_classes[]` are all in UAC InstrumentType enum
      7. For each entry: verify `api_served_by` exists in workspace-manifest.json
      8. For each entry: verify `ui_rendered_in[]` exist in workspace-manifest.json
      9. Generate `STRATEGY_MANIFEST_DAG.svg` visualization (strategy → venue → instrument → features)
      Test: `cd unified-trading-pm && bash scripts/quality-gates.sh` passes with new checks.
    status: done
    completion_note: validate-strategy-manifest.py created, wired into QG, 44 tests.

  - id: p1-strategy-maturity-checklist
    content: |
      - [x] [AGENT] P1. Create `unified-trading-pm/scripts/manifest/check-strategy-maturity.py`:
      Reads strategy-manifest.json and for each strategy prints a maturity report card:
      ```
      CEFI_MOMENTUM_BTC_1H:
        Code:       C4 [x] class [x] tests [x] QG [ ] merged
        Deployment: D0 [ ] batch_analytics [ ] mock_smoke [ ] batch_live_recon
        Business:   B0 [ ] backtest_profitable [ ] live_1d [ ] live_1w [ ] deck
        Data:       [x] features [ ] tick [x] ML model [ ] testnet [ ] API keys
      ```
      Exit 1 if any strategy with `maturity.code.status >= C2` has `unit_tests=false`.
      Exit 1 if any strategy with `maturity.deployment.status >= D2` has `mock_smoke=false`.
      Acceptance: script runs, produces table for all strategies, exits 0 on current state.
    status: done

  - id: p1-strategy-manifest-svg
    content: |
      - [x] [AGENT] P1. Create `unified-trading-pm/scripts/manifest/generate_strategy_manifest_dag.py`:
      Reads strategy-manifest.json and generates STRATEGY_MANIFEST_DAG.svg showing:
      - Strategies grouped by domain (CeFi/TradFi/DeFi/Sports/Options/Prediction)
      - Color-coded by maturity.code.status (red=C0, yellow=C2, green=C4, blue=C5)
      - Edges from strategy → venues, strategy → features services, strategy → ML models
      - Legend with maturity stage meanings
      Follow pattern from `generate_workspace_dag.py`.
      Symlink output to `unified-trading-codex/04-architecture/STRATEGY_MANIFEST_DAG.svg`.
      Acceptance: SVG renders, shows all strategies with correct colors and edges.
    status: done

  # ============================================================
  # PHASE 2: STRATEGY UNIVERSE EXPANSION (P0)
  # New strategy classes, configs, and factory functions
  # ============================================================

  # --- Stream 2A: Mean Reversion (TradFi + CeFi) ---

  - id: p2a-mean-reversion-base
    content: |
      - [x] [AGENT] P0. Create `strategy-service/strategy_service/engine/strategies/mean_reversion/mean_reversion_strategy.py`:
      `MeanReversionStrategy(BaseStrategy)` — ML-bypass strategy that subscribes to features via config.
      Config-driven: reads feature names from strategy YAML config (same pattern as momentum).
      Signal logic: entry when price deviates > N sigma from rolling mean, exit on reversion to mean.
      Configurable: lookback_window, entry_sigma, exit_sigma, use_ml (bool — if true, consumes ML prediction
      for mean level instead of simple rolling mean).
      Add `MeanReversionConfig(TypedDict)` to `config.py`:
      ```python
      class MeanReversionConfig(TypedDict):
          strategy_id: str
          instrument: str
          lookback_window: int  # bars for rolling mean
          entry_sigma: float  # default 2.0
          exit_sigma: float  # default 0.5
          use_ml: bool  # if true, ML predicts mean level
          ml_model_id: str  # only used when use_ml=True
          feature_subscriptions: list[str]  # features to subscribe to from config
      ```
      Add mode `"mean_reversion"` to `StrategyServiceConfig.default_mode` description.
      Add factory: `create_mean_reversion_strategy(config: MeanReversionConfig) -> MeanReversionStrategy`.
      Export from `strategies/__init__.py`.
      Acceptance: class importable, factory works, `ruff check` + `basedpyright` clean.
    status: done

  - id: p2a-mean-reversion-tradfi-configs
    content: |
      - [x] [AGENT] P0. Create YAML configs for TradFi mean reversion (same asset classes as momentum):
      1. `configs/mean_reversion_spy.yaml` — S&P 500 (ES/SPY), entry_sigma=2.0, lookback=20d
      2. `configs/mean_reversion_fx.yaml` — FX pairs (6E, 6J, 6B, 6C, 6A, 6S), multi-instrument
      3. `configs/mean_reversion_oil.yaml` — Crude Oil (CL.FUT), lookback=10d
      4. `configs/mean_reversion_stocks.yaml` — Equity pairs (same as stat_arb stocks)
      Each config follows existing YAML pattern from `stat_arb_btc_eth.yaml`.
      Add strategy-manifest.json entries for each (maturity.code.class_exists=true, rest=false).
      Acceptance: YAML parses, `load_strategy_config()` loads each without error.
    status: done
    completion_note: 4 YAML configs created/enhanced.

  - id: p2a-mean-reversion-cefi-configs
    content: |
      - [x] [AGENT] P0. Create YAML configs for CeFi mean reversion:
      1. `configs/mean_reversion_btc.yaml` — BTC mean reversion
      2. `configs/mean_reversion_eth.yaml` — ETH mean reversion
      3. `configs/mean_reversion_sol.yaml` — SOL mean reversion
      Same instruments as CeFi momentum but with mean reversion parameters.
      Acceptance: YAML parses, strategy-manifest.json entries added.
    status: done
    completion_note: 3 YAML configs created/enhanced.

  - id: p2a-mean-reversion-tests
    content: |
      - [x] [AGENT] P0. Create `tests/unit/test_mean_reversion_strategy.py`:
      Tests: signal generation on deviation, no signal within band, exit on reversion,
      ML mode (mock ML prediction as mean level), config loading, factory function.
      Min 10 test cases. Pattern: follow `test_stat_arb_strategy.py`.
      Acceptance: all tests pass, `bash scripts/quality-gates.sh` passes.
    status: done

  # --- Stream 2B: TradFi ML Strategies ---

  - id: p2b-tradfi-ml-directional
    content: |
      - [x] [AGENT] P0. Create `strategy-service/strategy_service/engine/strategies/tradfi_ml_directional.py`:
      `TradFiMLDirectionalStrategy(BaseStrategy)` — ML-driven directional for TradFi assets.
      Same pattern as `CeFiMomentumStrategy` but for TradFi instruments.
      Consumes ML predictions (swing_high_pred, swing_low_pred) for SPY, FX, Oil, Stocks.
      Add `TradFiMLConfig(TypedDict)` to config.py with ml_model_id, confidence_threshold,
      execution_mode (SCE/HUF), instrument, venue.
      Factory functions: `create_spy_ml_strategy()`, `create_fx_ml_strategy()`, `create_oil_ml_strategy()`.
      Export from `strategies/__init__.py`.
      YAML configs: `tradfi_ml_spy.yaml`, `tradfi_ml_fx.yaml`, `tradfi_ml_oil.yaml`.
      Tests: `tests/unit/test_tradfi_ml_directional.py` — min 8 tests.
      Acceptance: QG passes, strategy-manifest.json entries added.
    status: done
    completion_note: TradFiMLDirectionalStrategy enhanced with validation, SL/TP, venue, 22 unit + 11 integration tests.

  # --- Stream 2C: Options ML (3 Prediction Types) ---

  - id: p2c-options-ml-types-enum
    content: |
      - [x] [AGENT] P0. Add `OptionMLPredictionType` StrEnum to `strategy-service/strategy_service/types.py`:
      ```python
      class OptionMLPredictionType(StrEnum):
          STRIKE_SELECTION = "strike_selection"    # ML picks optimal normalized strike + expiry
          DELTA_CONVERSION = "delta_conversion"    # ML predicts delta → convert to fixed strike
          VOLATILITY_COMBO = "volatility_combo"    # ML predicts vol → trade straddle/combo
      ```
      Add `OptionsMLConfig(TypedDict)` to config.py:
      ```python
      class OptionsMLConfig(TypedDict):
          strategy_id: str
          prediction_type: str  # OptionMLPredictionType value
          underlying: str
          venue: str  # deribit, cboe, etc.
          ml_model_id: str
          # Type 1: Strike Selection
          scoring_metrics: list[str]  # ["pnl", "greeks_delta", "greeks_gamma", "vol_risk", "theta_decay"]
          prediction_horizon_days: int
          # Type 2: Delta Conversion
          target_delta: float  # e.g. 0.30 for 30-delta
          target_expiry_days: int  # e.g. 1 for closest 1-day option
          direction: str  # "call" or "put" — from ML prediction
          # Type 3: Volatility Combo
          combo_type: str  # "STRADDLE", "STRANGLE", "CALENDAR_SPREAD"
          target_zero_delta: bool  # True = closest to zero delta straddle
      ```
      Acceptance: types importable, basedpyright clean.
    status: done
    completion_note: OptionMLPredictionType already existed.

  - id: p2c-options-ml-strategy-class
    content: |
      - [x] [AGENT] P0. Create `strategy-service/strategy_service/engine/strategies/options_ml/options_ml_strategy.py`:
      `OptionsMLStrategy(BaseStrategy)` with 3 internal signal paths based on `prediction_type`:

      **Type 1 — Strike Selection ML:**
      ML model trained on normalized strike coordinates (via NormalizedStrikeCoordinate from UAC).
      Model outputs: optimal normalized_strike, optimal expiry_bucket, expected_pnl, greek_risk_score.
      Scoring combines: PnL prediction, Greeks risk (delta/gamma/vega exposure over prediction horizon),
      theta decay cost, vol-of-vol risk. Strategy selects highest-scoring (strike, expiry) combination.
      Uses `StrikeMapper` in execution-service to convert normalized strike → real strike at execution time.

      **Type 2 — Delta Conversion:**
      ML predicts direction (bullish/bearish) with confidence.
      Strategy converts to: "buy closest-to-{target_expiry_days}-day, closest-to-{target_delta} put/call".
      Example: ML says bearish → buy 1-day 30-delta put. Simple, fast, no complex optimization.
      Uses `StrikeMapper.delta_to_strike(delta=0.30, expiry_days=1, side="put")`.

      **Type 3 — Volatility Combo:**
      ML predicts realized vol will exceed/undershoot implied vol.
      Strategy: if vol_prediction > current_iv → buy straddle (long vol). Else → sell straddle (short vol).
      Converts zero-delta straddle into real combo: ATM call + ATM put (or closest to zero-delta).
      Can also trade specific strikes: ITM, ATM, OTM equivalent via normalized strike.

      All 3 types share: feature subscription from config, risk limits, position sizing from base.
      Acceptance: class importable, 3 code paths testable independently.
    status: done
    completion_note: OptionsMLStrategy already existed. Fixed OptionsMLConfig TypedDict.

  - id: p2c-options-ml-tests
    content: |
      - [x] [AGENT] P0. Create `tests/unit/test_options_ml_strategy.py`:
      Test each prediction type separately:
      - Type 1: mock ML output with normalized strikes, verify scoring selects best, verify StrikeMapper called
      - Type 2: mock ML direction prediction, verify delta→strike conversion, verify correct put/call selection
      - Type 3: mock vol prediction, verify straddle construction, verify zero-delta targeting
      - Config loading for each type
      - Factory function for each
      - Edge cases: no valid strikes, expired options, zero liquidity
      Min 15 test cases.
      Acceptance: all tests pass, QG passes.
    status: done
    completion_note: 32 tests already existed.

  - id: p2c-options-ml-configs
    content: |
      - [x] [AGENT] P1. Create YAML configs for options ML strategies:
      1. `configs/options_ml_strike_btc_deribit.yaml` — Type 1 for BTC options on Deribit
      2. `configs/options_ml_delta_spy_cboe.yaml` — Type 2 for SPY options on CBOE
      3. `configs/options_ml_vol_eth_deribit.yaml` — Type 3 for ETH vol on Deribit
      4. `configs/options_ml_delta_btc_deribit.yaml` — Type 2 for BTC on Deribit (CeFi delta-options ML)
      Add strategy-manifest.json entries for each.
      Acceptance: YAML parses, manifest entries valid.
    status: done
    completion_note: 4 YAML configs already existed.

  # --- Stream 2D: Sports Extensions ---

  - id: p2d-sports-halftime-ml
    content: |
      - [x] [AGENT] P0. Create `strategy-service/strategy_service/engine/strategies/sports/halftime_ml.py`:
      `HalftimeMLStrategy(SportsBaseStrategy)` — ML prediction at pre-game and halftime.
      Uses existing HT types: `SportsMarketHTDict`, `OddsHTSnapshotDict` from types.py.
      Two prediction windows: pre_game (before kickoff) and halftime (at HT whistle).
      ML model receives: pre-game features (team form, h2h, odds movement) + halftime features
      (score, xG, possession, shots, cards — from features-sports-service).
      Signal: if ml_confidence > threshold → bet on predicted outcome via Kelly sizing.
      Config: `HalftimeMLConfig(TypedDict)` with pre_game_model_id, halftime_model_id,
      confidence_threshold, sports, leagues, bookmakers.
      Tests: `tests/unit/test_halftime_ml_strategy.py` — min 8 tests (pre-game signal, HT signal,
      no signal below threshold, Kelly sizing, config loading).
      Acceptance: QG passes, strategy-manifest.json entries added.
    status: done
    completion_note:
      HalftimeMLStrategy enhanced with venue routing, BetSide, validate_config. 24 unit + 7 integration tests.

  - id: p2d-sports-market-making-vol
    content: |
      - [x] [AGENT] P1. Enhance `strategy-service/strategy_service/engine/strategies/sports/market_making.py`:
      Add volatility-around-theo market making mode. Current `SportsMarketMakingStrategy` exists but
      needs: theo price calculation (vig-free probability from bookmaker registry),
      spread around theo (configurable ticks), inventory risk management,
      skew adjustment based on position (lean away from exposure).
      This is analogous to options market making but in probability space.
      Config additions to existing `SportsStrategyManagerConfig`:
      - `theo_source`: "vig_free_avg" | "ml_model" | "sharp_book" (Pinnacle/Betfair)
      - `half_spread_pct`: float (default 2.0%)
      - `max_inventory_units`: int (max exposure per market)
      - `skew_per_unit`: float (spread adjustment per unit of inventory)
      Tests: extend `tests/unit/test_sports_strategies.py` with market making vol tests.
      Acceptance: QG passes.
    status: done

  # --- Stream 2E: Prediction Market Arbitrage ---

  - id: p2e-prediction-market-canonical-mapping
    content: |
      - [x] [AGENT] P0. Create canonical instrument ID mapping system for Polymarket/Kalshi in
      `unified-api-contracts/unified_api_contracts/canonical/domain/prediction/`:
      New module `prediction_mapping.py`:

      **Problem:** Polymarket/Kalshi markets cover politics, financial outcomes, sports, crypto —
      no single taxonomy. Markets are ephemeral (created/resolved). Structure differs
      (Polymarket = binary token pairs, Kalshi = event contracts with strike-like outcomes).

      **Solution:**
      1. `PredictionMarketCategory` StrEnum: POLITICS, FINANCIAL, SPORTS, CRYPTO, WEATHER, ENTERTAINMENT, OTHER
      2. `CanonicalPredictionMarket` Pydantic model:
         - canonical_id: str (format: `PRED:{category}:{normalized_question_hash}`)
         - source_venue: str (polymarket, kalshi, etc.)
         - source_market_id: str (venue-native ID)
         - category: PredictionMarketCategory
         - question_normalized: str (lowercased, stripped, canonical form)
         - resolution_date: datetime | None
         - outcomes: list[str] (["YES", "NO"] for binary)
         - mapped_sport_event_id: str | None (if sports — link to canonical sport event)
         - mapped_instrument_id: str | None (if financial — link to canonical instrument)
      3. `PredictionMarketMapper` class:
         - `map_polymarket(condition_id: str, question: str) -> CanonicalPredictionMarket`
         - `map_kalshi(ticker: str, title: str) -> CanonicalPredictionMarket`
         - Mapping rules: keyword extraction → category classification → normalization → dedup
         - `find_cross_venue_matches(market: CanonicalPredictionMarket) -> list[CanonicalPredictionMarket]`
           (same question on different venues = arb opportunity)
      4. `MappingRule` registry: extensible rules for new market types
      5. `OrphanDetector`: markets that couldn't be mapped → logged for new rule creation

      Tests in UAC: `tests/test_prediction_market_mapping.py` — test mapping, cross-venue matching,
      orphan detection, category classification. Use historical Polymarket/Kalshi data from VCR cassettes.
      Acceptance: UAC QG passes, mapping covers >90% of cassette markets.
      COMPLETED 2026-03-16: CanonicalPredictionMarket + mapping in strategy-service/prediction/prediction_mapping.py (246 LOC). Tests: test_prediction_mapping.py (374 LOC).
    status: done

  - id: p2e-prediction-arb-enhanced
    content: |
      - [x] [AGENT] P1. Enhance existing `PredictionArbStrategy` to use canonical mapping:
      Currently uses raw token IDs. Switch to `CanonicalPredictionMarket` for cross-venue matching.
      Add: Kalshi as full arb venue (not just Polymarket + sports books).
      Vig-free probability already calculated — use it for edge detection across all mapped venues.
      Note: prediction markets are structurally different (bet on probability) but canonical vig-free
      probabilities make them comparable to sports odds.
      Tests: update `test_prediction_arb_strategy.py` with canonical mapping tests.
      Acceptance: QG passes, strategy-manifest.json entries updated.
      COMPLETED 2026-03-16: PredictionArbStrategy now imports CanonicalPredictionMarket. test_prediction_mapping.py (374 LOC).
    status: done

  # --- Stream 2F: Legacy Cleanup ---

  # --- Stream 2G: Execution Service — Strategy-Agnostic Instruction Layer ---

  - id: p2g-strategy-instruction-exhaustive
    content: |
      - [ ] [AGENT] P0. Make execution-service strategy-agnostic by exhaustively covering all strategy
      instruction types across CeFi, DeFi, TradFi, Sports, Options, Prediction Markets.

      **Current state:** execution-service has `strategy_instructions/strategies.py` that translates
      StrategyInstruction → venue-specific orders. Some instruction mocks exist. Schemas partially
      in UIC and UAC. Execution is NOT exhaustive for all domains.

      **Target state:** Execution-service receives a `StrategyInstruction` and doesn't care which
      strategy produced it. It services different algos and execution configs per domain, and passes
      back `ExecutionAlpha` (execution quality metrics) and `ExecutionResult` (fill/reject).

      **Step 1: Canonical StrategyInstruction schemas in UAC/UIC:**
      All instruction types must live in UAC (canonical) or UIC (internal contracts) — NOT in
      execution-service or strategy-service local types. Move any local instruction schemas to UAC.

      Exhaustive `InstructionType` coverage (extend existing in UCI instrument.py):
      - TRADE: CLOB execution (TWAP, VWAP, Iceberg, Almgren-Chriss, POV, Hybrid) — CeFi + TradFi
      - SWAP: DEX execution (SOR, max slippage) — DeFi
      - ZERO_ALPHA: No execution algo (lending, staking, yield deposit) — DeFi
      - OPTIONS_COMBO: Multi-leg options execution (straddle, strangle, spread) — Options
      - FUTURES_ROLL: Calendar roll (near → far contract) — TradFi futures
      - PREDICTION_BET: Binary outcome bet (Polymarket/Kalshi) — Prediction markets
      - SPORTS_BET: Bookmaker bet placement (API or browser automation) — Sports
      - SPORTS_EXCHANGE: Exchange-style bet (Betfair/Smarkets) — Sports exchanges

      **Step 2: ExecutionAlpha canonical schema in UAC:**
      ```
      ExecutionAlpha:
        strategy_id, instruction_id, venue, algo_used,
        arrival_price, fill_price, execution_alpha_bps,
        slippage_bps, market_impact_bps, timing_alpha_bps,
        fill_rate_pct, latency_ms, fees_bps
      ```

      **Step 3: Per-domain execution configs in execution-service:**
      - CeFi: venue API keys, rate limits, position limits, margin mode
      - TradFi: IBKR gateway, session hours, halt handling, settlement
      - DeFi: gas limits, slippage tolerance, MEV protection, chain configs
      - Options: strike resolution (StrikeMapper), combo leg sequencing, delta hedging
      - Sports: bookmaker credentials, stake limits, account rotation, anti-detection
      - Prediction: market resolution handling, position limits, outcome settlement

      **Step 4: Tests:**
      - Unit test each InstructionType handler in isolation
      - Integration test: strategy → instruction → execution → alpha for each domain
      - Verify all schemas in UAC/UIC (not local to execution-service)

      Acceptance: execution-service QG passes, all InstructionTypes handled,
      ExecutionAlpha returned for every execution, no strategy-specific logic in execution-service.
      IN PROGRESS 2026-03-16: InstructionType (8 types) in UAC. StrategyInstruction model in strategy-service. Steps 2-4 pending.
    status: in_progress

  - id: p2g-move-instruction-schemas-to-uac
    content: |
      - [ ] [AGENT] P0. Audit and migrate all StrategyInstruction/ExecutionResult schemas:
      1. Grep execution-service and strategy-service for local instruction/result TypedDicts/Pydantic models
      2. For each: determine if it belongs in UAC (cross-service canonical) or UIC (internal contract)
      3. Move to correct location following UAC citadel import rules
      4. Update all consumers to import from UAC/UIC facade
      5. Verify no instruction schemas remain local to any service (except config-specific TypedDicts)
      Acceptance: grep for StrategyInstruction/ExecutionResult in service-local types returns 0.
      IN PROGRESS 2026-03-16: InstructionType moved to UAC. StrategyInstruction + ExecutionAlpha still local.
    status: in_progress

  # --- Stream 2F: Legacy Cleanup ---

  # --- Stream 2H: Execution Infrastructure (from 09-strategy TODO-CODIFYs) ---

  - id: p2h-instruction-validation-matrix
    content: |
      - [x] [AGENT] P0. Codify instruction type × order feature validation matrix as machine-readable
        registry. Currently documentation-only in 09-strategy/cross-cutting/config-architecture.md.
        Create YAML or Python dict in unified-api-contracts/registry/instruction_constraints.py:
        Map each OperationType to allowed order features (post_only, limit, market, TWAP, atomic).
        Example: SWAP → no post_only, no limit, yes market (SOR), no TWAP, yes atomic (DeFi).
        TRADE (CeFi CLOB) → yes post_only, yes limit, yes market, yes TWAP, no atomic.
        Execution router MUST validate incoming instructions against this matrix and REJECT invalid
        combinations before attempting execution. Also codify algo × instruction compatibility:
        each ExecAlgorithm declares supported_operation_types in its registry entry.
        Repos: unified-api-contracts (constraint registry), execution-service (router validation).
    status: done
    completion_note: instruction_constraints.py with validate_instruction(). 11 instruction types.
    note: "PARALLEL with p2g. Codifies Layer 1+3 from execution constraint hierarchy."

  - id: p2h-venue-sub-capabilities
    content: |
      - [x] [AGENT] P0. Extend VENUE_CAPABILITIES with order-type-level sub-capabilities:
        - POST_ONLY — can send maker-only orders (Binance, Deribit, Hyperliquid: YES; Uniswap: NO)
        - REDUCE_ONLY — can restrict to position-reducing orders
        - CANCEL_REPLACE — atomic cancel+replace in one call
        - BATCH_PLACE — submit multiple orders in one API call (Betfair, Kalshi: YES)
        - BATCH_CANCEL — cancel multiple/all orders in one call
        - MASS_QUOTE — submit quotes for multiple instruments simultaneously (Deribit, CME FIX: YES)
        - MASS_PULL — cancel all by underlying/account/market (Deribit, Betfair: YES)
        - CANCEL_ALL_MARKET — cancel all orders on a market (Betfair: YES)
        - MARKET_VERSION_SAFETY — stale-quote protection (Betfair: YES)
        Populate for ALL 33+ venues in VENUE_CAPABILITIES dict.
        Execution-service router validates: if strategy requests post_only on a venue without
        POST_ONLY capability, reject with clear error.
        Repos: unified-api-contracts (venue_constants.py), execution-service (router validation).
    status: done
    completion_note: VenueOrderCapability StrEnum + VENUE_ORDER_CAPABILITIES for 122 venues.
    note: "PARALLEL. Codifies Layer 2+4 from execution constraint hierarchy."

  - id: p2h-execution-preferences-config
    content: |
      - [x] [AGENT] P1. Create ExecutionPreferencesConfig schema and typed StrategyInstruction fields.
        Currently execution preferences are stuffed into StrategyInstruction.metadata dict (untyped).
        Add first-class typed fields to StrategyInstruction:
        - execution_style: Literal["passive", "aggressive", "urgent"]
        - ref_underlying: str | None (instrument key for underlying tracking)
        - edge_offset: Decimal | None (price offset from ref underlying)
        - leg_group_id: str | None (multi-leg group identifier)
        - leg_role: Literal["leader", "follower"] | None
        - execution_mode: ExecutionMode StrEnum (same_candle_exit, hold_until_flip, passive_limit, aggressive_fill)
        Create ExecutionMode StrEnum in unified-internal-contracts.
        Create ExecutionPreferencesConfig TypedDict in execution-service for per-strategy execution
        tuning: max_leader_slippage_bps, allow_cross_spread, urgency_escalation_minutes,
        ref_update_threshold_bps, ref_update_rate_limit_per_second.
        Repos: unified-internal-contracts (ExecutionMode), strategy-service (StrategyInstruction fields),
        execution-service (ExecutionPreferencesConfig).
    status: done
    completion_note: ExecutionMode + UrgencyLevel StrEnums + ExecutionPreferencesConfig TypedDict in UIC.
    note: "PARALLEL. Enables typed execution hints instead of stringly-typed metadata."

  - id: p2h-reference-pricing-underlying-tracker
    content: |
      - [x] [AGENT] P1. Implement reference pricing / UnderlyingTracker in execution-service.
        When a strategy sends ref_underlying on an instruction, execution-service monitors that
        underlying's price and updates the order price on move > threshold.
        Key distinction: benchmark_price = measure slippage AFTER fill. ref_underlying = track
        and adjust BEFORE fill. Strategy sets the EDGE; execution maintains it.
        Applies to: market-making (all asset classes), options, arbitrage (leader/follower legs).
        Implementation: UnderlyingTracker component subscribes to fast market data feed for ref
        instrument, recalculates order price using edge_offset on each move.
        For options: delta-adjusted pricing (new_price ≈ old_price + delta * underlying_change).
        Repos: execution-service (UnderlyingTracker component, order manager integration).
    status: done
    completion_note: UnderlyingTracker implemented in execution-service with 31 tests.
    note: "PARALLEL. Critical for MM and arb strategies."

  - id: p2h-leader-follower-execution
    content: |
      - [x] [AGENT] P1. Implement leader/follower multi-leg execution in execution-service.
        For non-atomic multi-leg trades (cross-exchange arb, spot-perp basis, calendar spreads):
        Follower = less liquid leg, execute first (passive). Leader = more liquid leg, hedge
        aggressively once follower fills.
        Create MultiLegInstruction model with legs: list[LegInstruction], each leg having
        role (leader/follower), ref_underlying, edge_offset.
        Create MultiLegOrchestrator that watches follower fills and auto-triggers leader legs.
        Strategy sends leg_group_id + leg_role on StrategyInstruction (from p2h-execution-preferences).
        Config: leader_follower_config with max_leader_slippage_bps, follower_staleness_timeout_seconds.
        Repos: execution-service (MultiLegOrchestrator, models).
    status: done
    completion_note: MultiLegOrchestrator + MultiLegInstruction implemented in execution-service/UIC with 19 tests.
    note: "PARALLEL. Required for arb and basis strategies."

  - id: p2h-trigger-subscriptions
    content: |
      - [x] [AGENT] P1. Implement TriggerSubscription model and engine filtering.
        Currently strategies get ALL features on every candle — no filtering.
        Create TriggerSubscription Pydantic model in unified-internal-contracts:
        source (str), filter (str), threshold (Decimal | None), granularity (str | None).
        Add trigger_subscriptions: list[TriggerSubscription] to strategy config TypedDict.
        EventDrivenStrategyEngine must filter incoming events against subscriptions before
        invoking generate_signal(). This enables: same pub/sub topic, different strategies
        filtering differently (MM triggers on 5bp move, DeFi triggers on hourly features only).
        Repos: unified-internal-contracts (model), strategy-service (config + engine filtering).
    status: done
    completion_note: TriggerSubscription in UIC + TriggerRouter in strategy-service with 29 tests.
    note: "PARALLEL. Enables efficient multi-strategy per instance."

  - id: p2h-strategy-default-templates
    content: |
      - [ ] [AGENT] P2. Create default config templates per strategy type.
        Each strategy type gets a YAML template in strategy-service/configs/defaults/ with the
        "usual" execution preferences pre-filled. New client configs start from template and
        override only what they need. Prevents building configs from scratch.
        Templates: defi_basis_default.yaml, defi_staked_basis_default.yaml,
        defi_lending_default.yaml, defi_recursive_default.yaml, cefi_momentum_default.yaml,
        cefi_mm_default.yaml, tradfi_ml_default.yaml, options_mm_default.yaml,
        sports_arb_default.yaml, sports_mm_default.yaml, prediction_arb_default.yaml.
        Each template references strategy doc in 09-strategy/ for rationale.
        Repos: strategy-service (configs/defaults/).
    status: todo
    note: "PARALLEL. Config DRY rule — defaults are the path of least resistance."

  - id: p2h-lp-operation-types
    content: |
      - [x] [AGENT] P1. Add AMM liquidity provision operation types.
        New OperationType values in both UAC and UDEI:
        ADD_LIQUIDITY, REMOVE_LIQUIDITY, COLLECT_FEES.
        New SettlementType: LP_FEE_ACCRUAL (in UIC).
        Update INSTRUCTION_VALID_DOMAINS: ADD_LIQUIDITY → defi domain, LP_POSITION instrument type.
        VenueCapability.PROVIDE_LIQUIDITY already exists — just needs instruction path.
        Add instruction factory functions in UDEI: create_uniswap_v3_lp_instruction(),
        create_curve_lp_instruction(), create_balancer_lp_instruction().
        Repos: unified-api-contracts (OperationType), unified-defi-execution-interface (factories),
        unified-internal-contracts (SettlementType).
    status: done
    completion_note: ADD_LIQUIDITY, REMOVE_LIQUIDITY, COLLECT_FEES added to UAC + UDEI factory functions.
    note: "PARALLEL. Enables DeFi AMM LP market-making strategy."

  - id: p2h-algo-venue-compatibility
    content: |
      - [x] [AGENT] P2. Create algo × venue compatibility registry.
        No machine-readable mapping of which execution algos work on which venues.
        Create algo_venue_compatibility.yaml in execution-service/config/:
        TWAP: [BINANCE, DERIBIT, HYPERLIQUID], VWAP: [BINANCE, DERIBIT], etc.
        SOR: [UNISWAPV3-ETH, CURVE-ETH, BALANCER-ETH].
        Router validates algo+venue before dispatching.
        Repos: execution-service (config YAML + router validation).
    status: done
    completion_note: algo_venue_compatibility.yaml + instruction_constraints validation covers algo-venue compatibility.
    note: "PARALLEL. Codifies Layer 4 from execution constraint hierarchy."

  - id: p2h-prediction-market-venue-wiring
    content: |
      - [x] [AGENT] P1. Wire Polymarket and Kalshi into production VENUE_REGISTRY.
        Currently in PLANNED_VENUES, not VENUE_REGISTRY — get_adapter() can't instantiate.
        Move to VENUE_REGISTRY with adapter class references.
        Add SourceCapability declarations in UAC capability_declarations/.
        Add Kalshi demo-api.kalshi.com as testnet equivalent in testnet registry.
        Add PredictionMarketUseCase enum to UIC: FEATURE, TRADABLE, ARB_SURFACE, BOTH.
        Build prediction_market_classifier.py in features-cross-instrument-service that
        periodically pulls all markets, classifies them, identifies cross-platform matches,
        publishes classified registry to GCS.
        Repos: unified-market-interface (VENUE_REGISTRY), unified-api-contracts (capabilities),
        unified-internal-contracts (PredictionMarketUseCase), features-cross-instrument-service.
    status: done
    completion_note: Polymarket/Kalshi moved to active VENUE_REGISTRY + PredictionMarketUseCase enum added.
    note: "PARALLEL. Activates prediction market infrastructure that's already built."

  - id: p2h-betfair-suspension-handling
    content: |
      - [x] [AGENT] P1. Add Betfair marketVersion safety and suspension event handling.
        BetfairAdapter must: (a) pass marketVersion on all placeOrders calls,
        (b) subscribe to suspension events from Betfair Stream API,
        (c) emit MARKET_SUSPENDED / MARKET_RESUMED events via UEI,
        (d) strategy-service must handle these events (halt quoting on suspend, recalculate on resume).
        Repos: unified-sports-execution-interface (BetfairAdapter), unified-events-interface (events).
    status: done
    completion_note: marketVersion tracking + suspension events in BetfairAdapter with 12 tests.
    note: "PARALLEL. Critical for sports market-making safety."

  - id: p2f-legacy-core-cleanup
    content: |
      - [x] [AGENT] P0. Remove legacy `strategy_service/engine/core/strategies/` duplicates:
      1. `eth_basis_strategy.py` (210 LOC) — superseded by `defi_basis.py` (396 LOC)
      2. `btc_basis_strategy.py` (185 LOC) — superseded by `defi_basis.py` (trivial BTC variant)
      3. `pure_lending_strategy.py` (162 LOC) — superseded by `defi_lending.py` (289 LOC)
      4. `pure_lending_eth_strategy.py` (157 LOC) — superseded by `defi_lending.py`
      5. `ml_btc_directional_strategy.py` (256 LOC) — superseded by `cefi_momentum.py` (272 LOC)
      For each: verify no imports outside of core/ reference it (grep across workspace).
      If referenced: add deprecation re-export in core/__init__.py pointing to modern class.
      If not referenced: delete file, remove from __init__.py exports, remove tests.
      Update `base_strategy_manager.py` (159 LOC) — if only used by deleted strategies, delete too.
      Acceptance: no broken imports across workspace, QG passes, ~1100 LOC removed.
    status: done
    completion_note: 5 files deleted (~969 LOC), 8 legacy test files deleted.

  - id: p2f-config-mode-cleanup
    content: |
      - [x] [AGENT] P1. Update `StrategyServiceConfig.default_mode` description to include all new modes:
      Current: "pure_lending, basis, momentum, sports_arb, sports_value, sports_kelly, rel_vol, stat_arb,
      vol_surface, prediction_arb, cross_exchange"
      Add: "mean_reversion, tradfi_ml, options_strike_ml, options_delta_ml, options_vol_ml,
      sports_halftime_ml, sports_market_making"
      Update `get_sports_strategy_config()` strategy_id_map with new sports modes.
      Acceptance: all modes loadable, config.py basedpyright clean.
    status: done
    completion_note: default_mode already includes all modes. get_sports_strategy_config updated.

  # ============================================================
  # PHASE 3: INSTRUMENT & VENUE COMPLETENESS (P0)
  # Enum additions, venue registration, canonical mapping
  # ============================================================

  - id: p3-prediction-market-instrument-type
    content: |
      - [x] [AGENT] P0. Add `PREDICTION_MARKET` to InstrumentType enum in
      `unified-api-contracts/unified_api_contracts/canonical/domain/reference/__init__.py`.
      Position: after CURRENCY, before any aliases. Value: "prediction_market".
      Acceptance: UAC QG passes, no broken imports.
    status: done

  - id: p3-sport-str-enum
    content: |
      - [x] [AGENT] P0. Add `Sport` StrEnum to `unified-api-contracts/unified_api_contracts/canonical/domain/sports/`:
      Values: FOOTBALL, BASKETBALL, BASEBALL, HOCKEY, TENNIS, CRICKET, RUGBY, GOLF, MMA, BOXING,
      MOTORSPORT, AMERICAN_FOOTBALL, HANDBALL, VOLLEYBALL, TABLE_TENNIS, DARTS, SNOOKER, ESPORTS.
      Export from UAC sports facade. Wire into `SportsStrategyManagerConfig.sport` type annotation.
      Acceptance: UAC QG passes.
    status: done

  - id: p3-venue-enum-prediction-markets
    content: |
      - [x] [AGENT] P1. Add POLYMARKET and KALSHI to Venue enum in
      `unified-config-interface/unified_config_interface/instrument.py`.
      Category: prediction_markets (new section after onchain_perps).
      Acceptance: UCI QG passes.
    status: done

  - id: p3-aster-venue-registry
    content: |
      - [x] [AGENT] P1. Register Aster adapter in VENUE_REGISTRY in
      `unified-market-interface/unified_market_interface/factory.py`.
      Aster adapter exists at `aster_adapter.py` — just needs registration line.
      Update comment from "Onchain Perps (1 venue - Aster incomplete)" to "(2 venues)".
      Acceptance: UMI QG passes.
    status: done

  - id: p3-livestock-vx-instruments
    content: |
      - [ ] [AGENT] P2. Add instrument definitions in instruments-service:
      1. VX futures (VIX futures on CFE): add to `instruments_service/config/` — contract specs,
         expiry cycle (monthly), settlement (AM cash settlement), trading hours
      2. Livestock: LE (Live Cattle) and HE (Lean Hogs) on CME — add to TRADFI_VENUE_MAPPINGS
      3. Add to instruments-service config if needed for futures chain resolution
      Acceptance: instruments-service QG passes.
    status: pending

  - id: p3-strategy-instrument-matrix
    content: |
      - [x] [AGENT] P1. Generate strategy-instrument validation matrix from strategy-manifest.json.
      Add validation to `check-strategy-maturity.py`:
      - For each strategy: verify every `venues[]` entry maps to an adapter in UMI VENUE_REGISTRY
      - For each strategy: verify every `asset_classes[]` entry maps to an InstrumentType in UAC
      - For each strategy: verify every `instruments[]` entry exists in instruments-service definitions
      - For each strategy: verify `data_sources.features[]` services exist in workspace-manifest.json
      - WARN if a strategy uses venues/instruments not yet in VENUE_REGISTRY or instrument definitions
      Output: matrix table showing strategy × capability coverage
      Acceptance: script runs, produces matrix, identifies gaps.
    status: done
    completion_note: generate-strategy-instrument-matrix.py created in PM with 22 tests.

  # ============================================================
  # PHASE 4: CONFIG SYSTEM N10 (P1)
  # Audit trail, slice subscriptions, reloader expansion
  # Blocker: Phase 2 strategy configs must use UCI persistence pattern
  # ============================================================

  - id: p4-config-audit-trail
    content: |
      - [x] [AGENT] P1. Create config audit trail in unified-config-interface:
      1. New models in `unified_config_interface/persistence.py`:
         - `ConfigAuditEntry(BaseModel)`: timestamp, domain, author, diff_summary, previous_hash, new_hash
         - `ConfigAuditLog`: append-only JSONL reader/writer at `{bucket}/{service}/audit/config_audit.jsonl`
      2. Modify `ConfigStore.save_config()`: after saving, compute diff vs previous version,
         write ConfigAuditEntry to audit log
      3. Add `ConfigStore.get_audit_trail(limit: int = 50) -> list[ConfigAuditEntry]`
      4. Tests: `tests/test_config_audit.py` — save config, verify audit entry written,
         verify diff content, verify get_audit_trail returns entries in order
      Acceptance: UCI QG passes.
    status: done

  - id: p4-config-diff-library
    content: |
      - [x] [AGENT] P1. Move config diff from deployment-api to unified-config-interface:
      1. New `config_diff()` method on ConfigStore — accepts two version timestamps,
         returns `ConfigDiff` model (list of `ConfigFieldChange` with field_path, old_value, new_value)
      2. New models: `ConfigDiff`, `ConfigFieldChange` in persistence.py
      3. Include diff in ConfigAuditEntry and CONFIG_CHANGED event details
      4. deployment-api: refactor to call `ConfigStore.config_diff()` instead of local difflib
      Acceptance: UCI + deployment-api QG pass.
    status: done

  - id: p4-slice-subscriptions
    content: |
      - [ ] [AGENT] P1. Add slice-based subscription to DomainConfigReloader in unified-trading-library:
      Extend `on_reload(callback, fields: list[str] | None = None)`:
      - If `fields` is None: behaves as today (callback receives full config)
      - If `fields` is provided: callback only fires when those specific fields changed
      Implementation:
      1. Add `_last_config: T | None` caching to DomainConfigReloader
      2. On reload: deep-compare new config vs _last_config at field level
      3. For each callback with fields filter: check if intersection of changed fields and watched fields is non-empty
      4. Only fire callbacks whose watched fields intersect with changed fields
      File: `unified-trading-library/unified_trading_library/domain_config_reloader.py`
      Tests: `tests/test_domain_config_reloader.py` — callback with fields=[X] only fires when X changes,
      callback without fields fires on any change.
      Acceptance: UTL QG passes.
    status: pending

  - id: p4-config-reloader-expansion
    content: |
      - [x] [AGENT] P1. Add config_reloaders.py to remaining 24 services (currently only 3/27 have it):
      Template from `instruments-service/instruments_service/config_reloaders.py`.
      For each service: create `{service_package}/config_reloaders.py` with:
      - `start_domain_config_reloaders()` and `stop_domain_config_reloaders()`
      - Domain-specific reload callbacks that emit CONFIG_CHANGED event via log_event
      - Wire into service startup (cli/main.py or app initialization)
      Priority order: risk-and-exposure-service, pnl-attribution-service, alerting-service,
      all 7 features services, then remaining services.
      Acceptance: each service QG passes after adding reloader.
    status: done
    completion_note: 24 services now have config_reloaders.py (27/27 total).

  # ============================================================
  # PHASE 5: EVENTS CANONICALIZATION (P1)
  # Ad-hoc remediation, CI/CD events, agent events
  # ============================================================

  - id: p5-adhoc-events-canonicalize
    content: |
      - [x] [AGENT] P1. Canonicalize 17 ad-hoc event strings across services:
      **Add to STANDARD_LIFECYCLE_EVENTS in unified-events-interface/schemas.py:**
      - SLACK_MESSAGE_SENT, ALERT_ROUTED, DATA_FRESHNESS_ALERT_ROUTED, DATA_FRESHNESS_ALERT_FAILED
      - MODE_INITIALIZED, STAGE_INITIALIZED, FEATURE_LOADING_STARTED, FEATURE_LOADING_COMPLETED
      - STAGE3_STARTED, STAGE3_COMPLETED, MODEL_SAVING_STARTED, MODEL_SAVING_COMPLETED
      - VALIDATION_FAILED (already in UIC LifecycleEventType — just use canonical constant)
      - FEATURE_GROUP_PROCESSING_STARTED, FEATURE_GROUP_PROCESSING_COMPLETED
      - PIPELINE_UAT_ERROR, RECONCILIATION_STARTED
      **Then update services to import from UEI constants instead of string literals:**
      - alerting-service/alerting_service/notifiers/slack.py
      - ml-training-service/ml_training_service/cli/main.py
      - features-onchain-service/features_onchain_service/app/core/onchain_orchestration.py
      - deployment-api/deployment_api/ (PIPELINE_UAT_ERROR)
      - position-balance-monitor-service/ (RECONCILIATION_STARTED)
      Acceptance: grep for string literal events in services returns 0 matches.
    status: done

  - id: p5-cicd-events
    content: |
      - [x] [AGENT] P1. Add CI/CD event taxonomy to unified-internal-contracts/events.py:
      New members in LifecycleEventType (or new CICDEventType StrEnum):
      QG_PASSED, QG_FAILED, DEPLOYMENT_STARTED, DEPLOYMENT_COMPLETED, DEPLOYMENT_FAILED,
      WORKFLOW_TRIGGERED, VERSION_BUMPED, CASCADE_DISPATCHED, SIT_STARTED, SIT_PASSED, SIT_FAILED.
      Detail models in UIC: `QualityGateDetails`, `DeploymentDetails`, `VersionBumpDetails`.
      Add to STANDARD_LIFECYCLE_EVENTS in UEI.
      Acceptance: UIC + UEI QG pass.
    status: done
    completion_note: CI/CD event types added to LifecycleEventType + detail models.

  - id: p5-agent-events
    content: |
      - [x] [AGENT] P2. Add autonomous agent event types:
      AGENT_INVESTIGATION_TRIGGERED, AGENT_INVESTIGATION_COMPLETED,
      AGENT_FIX_APPLIED, AGENT_FIX_FAILED.
      Detail model: `AgentEventDetails(event_type, repo, trigger_reason, resolution)`.
      EventActionMapping registry concept: declarative mapping from event → automated action
      (e.g., QG_FAILED → AGENT_INVESTIGATION_TRIGGERED).
      Acceptance: UIC + UEI QG pass.
    status: done
    completion_note: Agent event types added + AgentEventDetails extended.

  - id: p5-error-event-hierarchy
    content: |
      - [x] [AGENT] P2. Formalize error event hierarchy in UIC:
      New `ErrorCategory` StrEnum: INFRASTRUCTURE, APPLICATION, DATA, EXECUTION, COMPLIANCE.
      Extend existing `FailedDetails` model with: `error_category: ErrorCategory`,
      `is_retryable: bool`, `escalation_level: str` (INFO/WARN/PAGE).
      Acceptance: UIC QG passes, no breaking changes to existing FailedDetails consumers.
    status: done
    completion_note: ErrorCategory StrEnum created + FailedDetails extended.

  # ============================================================
  # PHASE 6: UI/API COMPLETENESS (P1)
  # Fix orphans, strategy rendering, onboarding
  # ============================================================

  - id: p6-fix-orphaned-ui-api-mappings
    content: |
      - [x] [AGENT] P1. Fix 6 orphaned UI-API mappings in workspace-manifest.json:
      "Orphaned" means a UI exists but no API declares `serves_ui` for it.
      1. deployment-ui → deployment-api: add `"serves_ui": ["deployment-ui"]`
      2. execution-analytics-ui → execution-results-api or new: add serves_ui
      3. onboarding-ui → config-api or new: add serves_ui
      4. settlement-ui → determine which API serves it, add serves_ui
      5. strategy-ui → strategy-api or config-api: add serves_ui
      6. unified-admin-ui → config-api: add serves_ui
      Also fix 3 APIs missing serves_ui: config-api, deployment-api, unified-api-contracts.
      Note: one API can serve multiple UIs, one UI can consume multiple APIs — that's fine.
      Acceptance: `check-strategy-maturity.py` shows no orphaned UI-API mappings.
    status: done
    completion_note: 6 orphaned UI-API mappings fixed in workspace-manifest.json.

  - id: p6-strategy-onboarding-ui
    content: |
      - [ ] [AGENT] P2. Enhance onboarding-ui to support strategy/venue/client onboarding:
      New pages/flows:
      1. **Strategy Onboarding**: list all strategies from strategy-manifest.json,
         show maturity status, allow configuration of new strategy instances
      2. **Venue Onboarding**: list all venues, show connection status, credential status
      3. **Client Onboarding**: existing flow — ensure it links strategies to clients
      Strategy IDs must be canonical (from strategy-manifest.json), human-readable, standardized.
      Acceptance: onboarding-ui builds, Playwright smoke tests pass, strategy list renders.
    status: pending

  - id: p6-remaining-ui-charting
    content: |
      - [ ] [AGENT] P2. Add Recharts to 4 remaining UIs without it:
      Identify which 4 of 12 UIs lack Recharts. For each:
      `npm install recharts` + add at least one meaningful chart component.
      Priority: any UI that displays time series or cross-sectional data.
      Acceptance: `npm run build` passes for each UI.
    status: pending

  # ============================================================
  # PHASE 7: COMPREHENSIVE TESTING (P0 — cross-cutting)
  # Scenario framework, strategy readiness QG, data availability
  # ============================================================

  - id: p7-scenario-testing-framework
    content: |
      - [x] [AGENT] P0. Create scenario testing framework in system-integration-tests:
      New directory: `system-integration-tests/tests/scenarios/`
      Core class: `ScenarioPlaybook` extending `MockWebSocketFeed`:
      ```python
      class ScenarioPlaybook:
          """Plays back a sequence of market events for domain-specific testing."""
          def __init__(self, name: str, domain: str, events: list[ScenarioEvent]): ...
          def play(self) -> ScenarioResult: ...
      ```
      Domain playbooks (one file each):
      - `tradfi_scenarios.py`: market_halt, session_transition, settlement, corporate_action, circuit_breaker
      - `cefi_scenarios.py`: liquidation_cascade, funding_rate_spike, exchange_downtime, 24_7_ops
      - `defi_scenarios.py`: gas_spike, slippage_beyond_threshold, mev_attack, chain_reorg, oracle_failure
      - `sports_scenarios.py`: pregame_to_inplay, halftime_odds_shift, cancellation, late_lineup_change, walkover
      Each scenario: setup → event sequence → expected state transitions → assertions.
      Tests: `test_scenario_framework.py` — verify playback, assertions, result reporting.
      Acceptance: SIT QG passes, at least 5 scenarios per domain defined.
    status: done

  - id: p7-strategy-readiness-qg-tests
    content: |
      - [x] [AGENT] P0. Add strategy readiness tests to system-integration-tests:
      New: `tests/integration/test_strategy_readiness.py`
      For each strategy in strategy-manifest.json:
      1. Verify class is importable (code readiness)
      2. Verify config file exists and parses (code readiness)
      3. Verify instruments[] are resolvable in instruments-service (data readiness)
      4. Verify features services in data_sources are importable (data readiness)
      5. Verify ML model IDs are registered in ml-inference config (if ml_required=true)
      6. Verify API endpoint exists for strategy queries (API readiness)
      7. Verify venue adapters are registered for all strategy venues (execution readiness)
      Run as part of SIT quality gates.
      Acceptance: SIT QG passes, all currently-implemented strategies pass all checks.
    status: done

  - id: p7-data-availability-tests
    content: |
      - [x] [AGENT] P1. Add data availability validation to strategy readiness:
      For each strategy in strategy-manifest.json:
      1. `batch_capable=true`: verify historical data exists (VCR cassettes or GCS mock data)
      2. `live_capable=true`: verify WebSocket/REST feed adapter exists for each venue
      3. `testnet_capable`: verify testnet endpoint configured for each venue (if applicable)
      4. `api_keys_required[]`: verify each key name exists in Secret Manager config
         (mock mode: verify CLOUD_MOCK_MODE handles missing keys gracefully)
      Script: `unified-trading-pm/scripts/manifest/check-strategy-data-availability.py`
      Acceptance: script runs, reports per-strategy data availability matrix.
    status: done

  # ============================================================
  # PHASE 8: DEPENDENCY CHAIN TRACKING (P2)
  # Reverse lookup, usage tags, interactive viz
  # ============================================================

  - id: p8-reverse-dependency-lookup
    content: |
      - [x] [AGENT] P2. Create `unified-trading-pm/scripts/manifest/reverse-dependency-lookup.py`:
      Input: repo name → Output: direct dependents, transitive dependents, impact count.
      Parse workspace-manifest.json, build reverse adjacency graph, BFS traversal.
      Support: `--repo unified-market-interface` shows all repos that depend on UMI (direct + transitive).
      Support: `--tag cefi` filters by tag (requires usage tags — can degrade gracefully without).
      Acceptance: script runs, produces correct output for known dependency chains.
    status: done

  - id: p8-usage-tags
    content: |
      - [ ] [AGENT] P2. Add `tags` array to each repo in workspace-manifest.json:
      Tag categories:
      - capability: `data-ingestion`, `execution`, `feature-computation`, `ml-training`, `ml-inference`,
        `risk`, `pnl`, `monitoring`, `alerting`, `onboarding`, `analytics`
      - domain: `cefi`, `tradfi`, `defi`, `sports`, `prediction`, `cross-domain`
      - criticality: `critical` (T0-T1), `important` (T2), `standard` (T3-T4)
      Populate for all 67+ repos based on existing `type`, `cluster`, `completion_path` fields.
      Acceptance: all repos have tags, `reverse-dependency-lookup.py --tag cefi` works.
    status: pending

  - id: p8-interactive-dependency-viz
    content: |
      - [ ] [AGENT] P2. Add `/dependencies` route to live-health-monitor-ui:
      Interactive DAG using D3.js or vis.js (check which is already in package.json).
      Features: click-to-highlight dependents, filter by tag/tier/domain, blast radius mode
      (click a repo → highlight all transitive dependents), search.
      Data source: fetch workspace-manifest.json + strategy-manifest.json from config-api or static file.
      Acceptance: UI builds, Playwright smoke test for /dependencies route passes.
    status: pending

isProject: false
---

# Strategy & System Citadel Master Plan

## Context

This plan consolidates the remaining work from the March 13 "7 plans" initiative (polished-baking-creek Claude plan),
stripped of items completed since then, and built up with enhanced detail on:

- **Mean reversion strategies** (TradFi + CeFi) as ML-bypass plans alongside momentum
- **3 types of Options ML predictions** (strike selection, delta conversion, volatility combo)
- **Sports market making** with volatility around a theoretical price
- **Prediction market canonical mapping** (Polymarket/Kalshi → canonical IDs across politics/financial/sports)
- **Strategy manifest** (JSON, like workspace-manifest.json) with maturity tracking and QG validation
- **Strategy-venue-instrument validation matrix** ensuring strategies are wired to correct data sources
- **Config N10** (audit trail, slice subscriptions, reloader expansion to all 27 services)
- **Events canonicalization** (17 ad-hoc strings, CI/CD events, agent events)
- **UI/API orphan fixes** and strategy onboarding
- **Scenario testing framework** by domain

## What's Already Done (stripped from plan)

| Item                                                               | Status                                 | Evidence                                    |
| ------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------- |
| 16 modern strategies (DeFi 4, CeFi 1, TradFi 1, Sports 5, Quant 5) | DONE                                   | strategy_service/engine/strategies/         |
| 5 legacy strategies (core/)                                        | DONE (but need cleanup — see Phase 2F) | engine/core/strategies/                     |
| 75+ canonical events in UEI                                        | DONE                                   | schemas.py STANDARD_LIFECYCLE_EVENTS        |
| 81 VCR cassettes across 73 venues                                  | DONE                                   | unified-api-contracts/external/\*/mocks/    |
| Cassette parity testing on every commit                            | DONE                                   | test_cassette_schema_parity.py              |
| 47 repos with library dep integration tests                        | DONE                                   | test_library_deps_integration.py            |
| Performance baselines + latency tests                              | DONE                                   | system-integration-tests/tests/performance/ |
| All 12 UIs: Vitest + Playwright                                    | DONE                                   | 100% adoption                               |
| 8/12 UIs: Recharts charting                                        | DONE                                   | Analytics UIs covered                       |
| Version cascade automation (full pipeline)                         | DONE                                   | bump → dispatch → SIT → merge               |
| DAG visualization (SVG)                                            | DONE                                   | generate_workspace_dag.py                   |
| Runtime deps declared per repo                                     | DONE                                   | workspace-manifest.json dependencies[]      |
| Data flow manifest                                                 | DONE                                   | data-flow-manifest.json                     |
| CONFIG_CHANGED/CONFIG_LOADED events                                | DONE                                   | Working with graceful exception handling    |
| Config diff (deployment-api endpoint)                              | PARTIAL                                | API only, not library function              |
| Config reloaders (3/27 services)                                   | PARTIAL                                | instruments, strategy, execution            |
| Bookmaker registry (67 keys)                                       | DONE                                   | bookmaker_registry.py                       |
| 29 venues in Venue enum                                            | DONE                                   | instrument.py                               |
| InstrumentType.BOND                                                | DONE                                   | UAC reference                               |
| VIX static index defined                                           | DONE                                   | special_instruments.py                      |
| 39 TradFi commodities + FX                                         | DONE                                   | TRADFI_VENUE_MAPPINGS                       |

## Phase Dependency Graph

```
Phase 1 (Manifest) ──blocks──> Phase 2 (Strategies) — need manifest entries for new strategies
Phase 1 (Manifest) ──blocks──> Phase 7 (Testing) — readiness tests read manifest
Phase 2 (Strategies) ──blocks──> Phase 4 (Config) — strategy configs use UCI persistence
Phase 3 (Instruments) ──blocks──> Phase 2E (Prediction Arb) — canonical mapping needed
Phase 5 (Events) ──blocks──> Phase 4 (Config) — CONFIG_CHANGED must be canonical first
Phase 1 (Manifest) ──blocks──> Phase 6 (UI/API) — UI rendering checks manifest
Phase 3 (Instruments) ──blocks──> Phase 7 (Testing) — instrument validation in readiness tests
```

## CRITICAL: Zero QG Regression Rule

**Every change in this plan MUST pass quality gates in the affected repo AND all downstream dependents.**

Currently all repos pass QG. Any change that introduces a regression is a blocker — fix before proceeding.

For each todo:

1. Run `cd <repo> && bash scripts/quality-gates.sh` on the changed repo
2. Identify downstream dependents from workspace-manifest.json
3. Run QG on each direct dependent that imports changed symbols
4. If any QG fails: fix the regression before marking the todo as done

Dependency chains to watch (changes cascade downward):

```
UAC (T0) → UMI, UTL, URDI, all services, all APIs
UIC (T0) → UCI, UTL, all services
UCI (T1) → all services (config imports)
UEI (T0) → all services (event imports)
UTL (T1) → all T2+ repos
execution-service (T4) → system-integration-tests
strategy-service (T4) → system-integration-tests
```

## Verification

After all phases complete:

1. `cd strategy-service && bash scripts/quality-gates.sh` — passes with all new strategies
2. `cd unified-trading-pm && bash scripts/quality-gates.sh` — passes with manifest validation
3. `cd system-integration-tests && bash scripts/quality-gates.sh` — passes with scenario + readiness tests
4. `cd execution-service && bash scripts/quality-gates.sh` — passes with exhaustive instruction types
5. `cd unified-api-contracts && bash scripts/quality-gates.sh` — passes with new schemas
6. `cd unified-internal-contracts && bash scripts/quality-gates.sh` — passes with new event types
7. `cd unified-events-interface && bash scripts/quality-gates.sh` — passes with canonicalized events
8. `cd unified-config-interface && bash scripts/quality-gates.sh` — passes with audit trail + enums
9. `cd unified-trading-library && bash scripts/quality-gates.sh` — passes with slice subscriptions
10. `cd unified-market-interface && bash scripts/quality-gates.sh` — passes with Aster registration
11. `python scripts/manifest/check-strategy-maturity.py` — all strategies show correct maturity
12. `python scripts/manifest/check-strategy-data-availability.py` — data availability matrix complete
13. STRATEGY_MANIFEST_DAG.svg renders all strategies with correct colors
14. Zero ad-hoc event strings in services (grep returns 0)
15. Zero orphaned UI-API mappings in workspace-manifest.json
16. All 27 services have config_reloaders.py
17. Scenario playbooks execute for all 4 domains (20+ scenarios total)
18. execution-service handles ALL InstructionTypes, returns ExecutionAlpha for every execution
19. Zero StrategyInstruction/ExecutionResult schemas local to services (all in UAC/UIC)
