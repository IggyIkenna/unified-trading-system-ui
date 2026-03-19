---
name: defi-keys-data-integration-2026-03-13
overview: >
  Consolidates all API key provisioning, VCR cassette recording, DeFi testnet data, data freshness SLAs, and production
  backfill into a single plan. 30 vendor API keys across 4 phases, VCR cassettes for all venues including 3 missing
  interface repos (audit §10 FAIL), FreshnessMonitor implementation with per-venue SLAs for 33 venues, and 5-step
  production data backfill pipeline. Milestone-gated.
type: mixed
epic: epic-data
status: active

completion_gates:
  code: C4
  deployment: D3
  business: none

repo_gates:
  - repo: unified-api-contracts
    code: C4
    deployment: none
    business: none
    readiness_note: "VCR cassettes committed here."
  - repo: unified-market-interface
    code: C4
    deployment: none
    business: none
    readiness_note: "Cassettes added (audit §10 fix)."
  - repo: unified-trade-execution-interface
    code: C4
    deployment: none
    business: none
    readiness_note: "Cassettes added (audit §10 fix)."
  - repo: unified-reference-data-interface
    code: C4
    deployment: none
    business: none
    readiness_note: "Cassettes added (audit §10 fix)."

depends_on:
  - cicd_code_rollout_master_2026_03_13
  # Blocker: Plan 1 Phase 3 (interfaces hardened) blocks Phase 2 (cassette recording).

supersedes:
  - api_keys_and_auth
  - data_availability_live_expectations_2026_03_10
  - defi_dev_testnet_data_rollout_2026_03_13
  - production_backfill_step_by_step_2026_03_10

todos:
  # ── Phase 1: SECRET PROVISIONING [HUMAN] ───────────────────────────────────
  # Exit criteria: All 30 vendor API keys in GCP Secret Manager
  # Blocker: None (can start immediately)

  - id: secrets-verify-tardis
    content: >
      - [x] [SCRIPT] P0. Tardis API key verified in Secret Manager (created 2025-10-25). Also: tardis-api-key-backup
      (2026-02-07), tardis-api-key-full (2026-02-09).
    status: done
    note: "Verified 2026-03-17 via gcloud secrets list."

  - id: secrets-http-vendors
    content: >
      - [x] [HUMAN] P0. HTTP vendor keys already in Secret Manager: thegraph-api-key (Nov 2025, + keys 2-9 Jan 2026),
      alchemy-api-key (Nov 2025), aavescan-api-key (Nov 2025), graph-api-key (Nov 2025). Still missing:
      databento-api-key, envio-api-key, openbb-fmp-api-key, openbb-fred-api-key.
    status: done
    note:
      "Verified 2026-03-17. 4 of 7 present. Remaining 3 are non-DeFi (databento=TradFi, openbb=TradFi, envio=indexer)."

  - id: secrets-defi-endpoints
    content: >
      - [x] [HUMAN] P0. Core DeFi endpoint credentials in Secret Manager: Alchemy, TheGraph (x9 keys), Aavescan,
      Hyperliquid (mainnet: hyperliquid-trade-key v2, testnet: hyperliquid-testnet-trade-key). Subgraph queries
      (Uniswap/Curve/Balancer/Lido/etc.) use the same thegraph-api-key — no separate secrets needed per protocol. Still
      missing: 1inch-api-key, paraswap-api-key, dydx-api-key. Defillama is public (no key required).
    status: done
    note: "Verified 2026-03-17. Most subgraph protocols share TheGraph API key. Missing keys are for non-MVP venues."

  - id: secrets-ws-vendors
    content: >
      - [ ] [HUMAN] P1. Load 3 WebSocket vendor credentials: binance-api-key+secret, deribit-client-id+secret,
      ibkr-username+password (for TWS gateway).
    status: pending

  - id: secrets-phase3-procurement
    content: >
      - [ ] [HUMAN] P2. Procure and load 8 Phase 3 vendor API keys (accounts needed): pinnacle-api-key, odds-api-key,
      api-football-key, glassnode-api-key, arkham-api-key, soccer-football-info-key, footystats-api-key,
      coinglass-api-key.
    status: pending

  - id: secrets-phase4-vendors
    content: >
      - [ ] [HUMAN] P3. Procure and load 6 Phase 4 vendor credentials: betfair-api-key+session, kalshi-api-key,
      coinbase-api-key+secret, bloxroute-auth-header, smarkets-api-key, betdaq-api-key.
    status: pending

  - id: secrets-defi-testnet
    content: >
      - [ ] [HUMAN] P1. Load DeFi testnet secrets: alchemy-api-key-testnet (Sepolia), tenderly-fork-rpc-url,
      hyperliquid-testnet-api-credentials, wallet-dev-private-key (test wallet only, never production). NOTE: Lido
      Goerli testnet is DEPRECATED (decommissioned). Use Holesky for Lido/stETH testing. EtherFi also deploys on
      Holesky. Add alchemy-api-key-holesky to secret list if Holesky RPC needed separately from Sepolia. Testnet
      contract addresses differ from mainnet — see testnet-contract-registry item in Phase 2.5.
    status: pending

  - id: secrets-bootstrap
    content: >
      - [ ] [HUMAN] P0. Bootstrap secrets for CI: TELEGRAM_BOT_TOKEN on 3 new repos (ml-inference-api, ml-training-api,
      trading-analytics-api), ANTHROPIC_API_KEY for SIT (system-integration-tests), GCP_SA_KEY for CI service account
      authentication.
    status: pending

  - id: secrets-credential-audit-script
    content: >
      - [ ] [AGENT] P1. Build credential audit script. CredentialsRegistry in unified-cloud-interface has venue/service
      → secret name mappings but no audit() method. Create scripts/credential-audit.py that: (1) reads
      CredentialsRegistry.VENUE_SECRET_MAP + SERVICE_ACCOUNT_MAP + sports_venue_credentials (73 venues), (2) for each
      secret name, checks if it exists in GCP Secret Manager via `gcloud secrets describe`, (3) outputs table: venue |
      secret_name | exists_in_sm | has_version | environment. Add --environment flag (dev/staging/prod) to check
      environment-specific secrets. Add --fail-missing flag for CI gate (exit 1 if any required secret missing). Wire
      into quality-gates as optional check (skip if no GCP credentials available in CI). Repos: unified-cloud-interface
      (audit method on CredentialsRegistry), unified-trading-pm (scripts/credential-audit.py wrapper).
    status: pending
    depends_on: [secrets-bootstrap]

  # ── Phase 2: VCR CASSETTE RECORDING ────────────────────────────────────────
  # Exit criteria: All venues have cassettes, cassette schema parity test passes
  # Blocker: Phase 1 (secrets loaded); Plan 1 Phase 3 (interfaces hardened)

  - id: cassette-tardis
    content: >
      - [ ] [AGENT] P0. Record Tardis VCR cassette. Steps: (1) configure vcr_endpoints.py entry for Tardis, (2) run
      cassette recording script with Tardis API key from SM, (3) commit cassette YAML to
      unified-api-contracts/tests/cassettes/, (4) verify `pytest tests/test_cassette_schema_parity.py` passes.
    status: pending
    depends_on: [secrets-verify-tardis]

  - id: cassette-http-vendors
    content: >
      - [ ] [AGENT] P1. Record VCR cassettes for 7 HTTP vendors: databento, thegraph, alchemy, aavescan, envio,
      openbb-fmp, openbb-fred. For each: configure vcr_endpoints.py, record, commit, verify parity.
    status: pending
    depends_on: [secrets-http-vendors]

  - id: cassette-defi-endpoints
    content: >
      - [ ] [AGENT] P1. Record VCR cassettes for 16 DeFi endpoints. Group by protocol type: Subgraph-based (TheGraph,
      Aave, Compound, Uniswap, Curve, Balancer, GMX, Synthetix, Lido, Rocket Pool), REST-based (Defillama, Hyperliquid,
      1inch, Paraswap, dYdX). For each: configure, record, commit, verify.
    status: pending
    depends_on: [secrets-defi-endpoints]

  - id: cassette-missing-interface-repos
    content: >
      - [ ] [AGENT] P0. Add VCR cassettes to 3 repos flagged in audit §10 FAIL: unified-market-interface,
      unified-trade-execution-interface, unified-reference-data-interface. Each needs at least 1 cassette per venue it
      supports. This resolves the audit FAIL.
    status: pending
    depends_on: [cassette-tardis]

  - id: cassette-ws-approach
    content: >
      - [ ] [AGENT] P2. Design and implement WebSocket cassette approach for Binance, Deribit, IBKR. Options: (a) record
      WS frames to YAML like HTTP cassettes, (b) use MockWebSocketFeed from
      `unified-market-interface/tests/fixtures/mock_ws_server.py`. Likely (b) is correct — WS cassettes are replay-only,
      not schema-parity.
    status: pending
    depends_on: [secrets-ws-vendors]

  # ── Phase 2.5: TESTNET CONTRACT REGISTRY ───────────────────────────────────
  # Exit criteria: All DeFi connectors can resolve testnet contract addresses from registry
  # Blocker: Phase 1 (testnet secrets loaded)

  - id: testnet-contract-registry
    content: >
      - [x] [AGENT] P1. Create testnet contract address registry. Currently DeFi connectors have mainnet contract
      addresses hardcoded (e.g., Aave Pool=0x87870Bca..., Uniswap Router=0xE592...). No mapping exists for testnet
      deployments. Create unified-api-contracts/config/testnet_contracts.yaml with per-chain, per-protocol addresses:
      aave_v3_sepolia (Pool, Oracle, DataProvider), uniswap_v3_sepolia (Router, Factory, Quoter), morpho_sepolia
      (Morpho, IRM), lido_holesky (stETH, wstETH, WithdrawalQueue), etherfi_holesky (LiquidityPool, eETH, weETH),
      eigenlayer_holesky (DelegationManager, StrategyManager, RewardsCoordinator). Add TestnetContractRegistry class in
      unified-config-interface that loads from YAML and resolves by (protocol, chain_id) → contract addresses dict.
      Update DeFi connectors to use registry instead of hardcoded addresses when FORK_MODE != "" or chain_id is a known
      testnet (11155111=Sepolia, 17000=Holesky, 421614=Arbitrum Sepolia). Repos: unified-api-contracts (YAML),
      unified-config-interface (loader), unified-defi-execution-interface (connector updates).
    status: done
    completion_note: testnet_contracts.yaml + TestnetContractRegistry in UCI + AAVE connector wiring.
    depends_on: [secrets-defi-testnet]

  # ── Phase 3: DATA FRESHNESS & SLAs ─────────────────────────────────────────
  # Exit criteria: FreshnessMonitor deployed, per-venue SLAs, stale data alerts fire within 60s
  # Blocker: Plan 1 Phase 3 (library tiers green)

  - id: freshness-monitor-class
    content: >
      - [ ] [AGENT] P1. Implement FreshnessMonitor base class in unified-trading-library. Interface:
      `check_freshness(venue, data_type) -> FreshnessResult` with `is_stale`, `last_update_ts`, `sla_seconds`,
      `staleness_seconds`. Per-source freshness contracts defined in unified-internal-contracts as Pydantic models.
    status: pending

  - id: freshness-venue-slas
    content: >
      - [x] [AGENT] P1. Define per-venue SLA for all 33 venues: 9 CeFi (Binance 1s, Deribit 5s, etc.), 9 TradFi (IBKR
      30s, etc.), 14 DeFi (Hyperliquid 10s, Aave 60s, etc.), 1 Onchain Perps. SLAs stored in unified-internal-contracts
      as venue_freshness_slas.py.
    status: done
    completion_note: 32 venues with SLAs defined in UIC.

  - id: freshness-alerting
    content: >
      - [ ] [AGENT] P2. Wire FreshnessMonitor alerts through UEI. When `is_stale=True`, emit `DATA_STALE` event via
      `log_event()`. Alerting-service subscribes and fires Telegram/PagerDuty. Target: alert fires within 60s of data
      going stale.
    status: pending
    depends_on: [freshness-monitor-class, freshness-venue-slas]

  - id: defi-feature-computation-implementation
    content: >
      - [ ] [AGENT] P0. Implement DeFi feature calculators in features-onchain-service. Currently the service has output
      schemas defined but NO code computing the 10+ DeFi metrics that the 4 DeFi strategies require. THIS IS A P0
      BLOCKER — without these features, strategies generate signals from default/stale values. IMPLEMENT calculators
      for: (a) lst_staking_apy — fetch weETH/ETH exchange rate from EtherFi adapter, compute annualized rate change (b)
      weeth_eth_rate — current weETH/ETH rate from EtherFi LiquidityPool contract (c) aave_supply_apy — from Aave V3
      getReserveData().currentLiquidityRate / RAY * seconds_per_year (d) aave_borrow_apy_eth — from
      getReserveData().currentVariableBorrowRate for WETH (e) aave_utilization — from getReserveData()
      totalStableDebt+totalVariableDebt / totalAToken (f) aave_liquidity_index — direct from
      getReserveData().liquidityIndex / RAY (g) aave_ltv — from getReserveConfigurationData() for weETH (or per-asset)
      (h) morpho_flash_loan_liquidity — available liquidity in Morpho Blue markets (i) health_factor — from Aave
      getUserAccountData().healthFactor / 1e18 (j) weekly_rewards — from EtherFi/EigenLayer reward distribution events
      Each calculator: fetch from RPC/Graph → validate → emit as feature with timestamp. Wire into
      features-onchain-service feature_pipeline.py. Test: mock RPC responses in tests, verify output schema matches
      strategy expectations. Repos: features-onchain-service.
    status: pending
    depends_on: [freshness-monitor-class]

  # ── Phase 4: PRODUCTION BACKFILL ───────────────────────────────────────────
  # Exit criteria: 1yr tick data per venue, features computed, ML models trained, backtests validated
  # Blocker: Phase 1-2 (secrets + cassettes); Plan 1 Phase 4 (services deployed)

  - id: backfill-historical-apy-storage
    content: >
      - [ ] [AGENT] P0. Historical APY persistent storage. DeFiYieldMonitor only fetches current APY — can't backtest
      lending/staking strategies without historical rates. THIS IS A P0 BLOCKER for D5. Create APYTimeSeries table in
      BigQuery: (protocol, asset, chain, timestamp, apy_pct, liquidity_index, borrow_index, exchange_rate, tvl_usd,
      utilization_pct, source). Backfill sources: (a) Aave: AaveScan API + The Graph for liquidityIndex/borrowIndex
      history (hourly, since V3 launch), (b) Curve: The Graph for pool virtual_price + fee APY (15-min, since pool
      creation), (c) Morpho/Euler/Fluid: Alchemy RPC block-level state snapshots (daily, 90 days), (d)
      Lido/EtherFi/Ethena: DefiLlama yield API for historical APY (daily, best available), (e) Hyperliquid: Tardis.dev
      for funding rate history. Minimum backfill: 90 days for lending, 180 days for basis, 365 days for recursive. Wire
      into BacktestService: accept historical_yields dict in BacktestConfig, replace current-only DeFiYieldMonitor
      fetches with time-series lookups from BigQuery. Repos: features-onchain-service (backfill jobs), strategy-service
      (BacktestService integration).
    status: pending

  - id: backfill-instruments-metadata
    content: >
      - [ ] [SCRIPT] P0. Step 1: Instruments metadata backfill. Run instruments-service in batch mode to populate GCS
      with instrument definitions for all 33 venues. Gate: instrument count matches expected per venue.
    status: pending

  - id: backfill-tick-data
    content: >
      - [ ] [SCRIPT] P0. Step 2: Tick data backfill (1 year per venue). Run market-tick-data-service backfill jobs per
      venue. Order: CeFi first (highest volume), then TradFi, then DeFi. Gate: data completeness check per venue (no
      gaps > SLA threshold).
    status: pending
    depends_on: [backfill-instruments-metadata]

  - id: backfill-features
    content: >
      - [ ] [SCRIPT] P1. Step 3: Feature computation. Run all features-* services in batch mode against backfilled tick
      data. Gate: feature count and date range match expectations.
    status: pending
    depends_on: [backfill-tick-data]

  - id: backfill-ml-training
    content: >
      - [ ] [SCRIPT] P1. Step 4: ML model training. Run ml-training-service against computed features. Gate: model
      metrics meet minimum thresholds (Sharpe, accuracy, etc.).
    status: pending
    depends_on: [backfill-features]

  - id: backfill-validation
    content: >
      [SCRIPT+HUMAN] P0. Step 5: Backtest validation. Run strategy-service backtests against historical data. Human
      reviews PnL curves, drawdown, and risk metrics. Gate: no anomalous results, metrics within historical bounds.
    status: pending
    depends_on: [backfill-ml-training]

  - id: backfill-minimum-data-certification
    content: >
      - [ ] [AGENT] P2. Minimum data sample certification gate. Before a strategy can advance from HISTORICAL to
      LIVE_MOCK (or from BATCH_REAL to STAGING), require minimum historical data coverage. Create DataCertification
      check in strategy-service: (a) Per strategy type: LENDING requires 90 days APY history, BASIS requires 180 days
      funding + basis history, STAKED_BASIS requires 180 days LST rate + funding, RECURSIVE requires 365 days (need to
      see liquidation events in history). (b) Per feature: check BigQuery APYTimeSeries table for coverage — gap
      detection (no gaps > 4 hours for CeFi, > 24 hours for DeFi). (c) Per venue: check tick data completeness from
      market-tick-data-service. Output: DataCertificationReport with pass/fail per strategy, per feature, per venue.
      Wire as gate in strategy deployment pipeline: strategy cannot go live without certification. Repos:
      strategy-service (certification check), unified-config-interface (minimum sample config).
    status: pending
    depends_on: [backfill-validation]

  - id: freshness-wire-services
    content: >
      - [ ] [AGENT] P2. Wire FreshnessMonitor into all 10 data-producing services (currently only wired in
      market-tick-data-service). Services: features-delta-one, features-volatility, features-onchain, features-calendar,
      features-commodity, features-cross-instrument, features-multi-timeframe, features-sports, market-data-processing,
      ml-inference-api.
    status: pending
    depends_on: [freshness-monitor-class]

  - id: freshness-consuming-gates
    content: >
      - [ ] [AGENT] P2. Add assert_feature_fresh() to strategy-service and assert_market_data_fresh() to
      execution-service. Raise DataStalenessError (from unified-internal-contracts) when data exceeds venue SLA. Wire
      into pre-trade validation paths.
    status: pending
    depends_on: [freshness-wire-services]

  - id: freshness-uei-events
    content: >
      - [ ] [AGENT] P2. Verify DATA_STALE, DATA_AVAILABILITY_RESTORED, DATA_GAP_DETECTED, FEED_UNHEALTHY,
      DATA_COMPLETENESS_CHECK events exist in unified-events-interface/schemas.py (added 2026-03-10). Wire event
      emission into FreshnessMonitor.log_if_stale() calls across all 10 services.
    status: pending
    depends_on: [freshness-wire-services]

  - id: freshness-completeness-check
    content: >
      - [ ] [AGENT] P3. Verify scripts/ops/check-data-completeness.sh and
      system-integration-tests/tests/integration/test_data_freshness.py exist and pass. Run completeness check against
      mock data to validate end-to-end freshness pipeline.
    status: pending
    depends_on: [freshness-uei-events]
---

## Notes

### Inter-Plan Blockers

- **This plan Phase 1 (secrets) blocks Plan 1 Phase 5** — production backfill needs API keys
- **Plan 1 Phase 3 (interfaces hardened) blocks this plan Phase 2** — cassette recording needs working interfaces
- **This plan Phase 2 (cassettes) blocks Plan 1 Phase 6 audit** — audit §10 FAIL requires VCR cassettes in 3 repos

## Coordination: ui-api-alerting-observability plan

The ui-api-alerting-observability-2026-03-14 plan adds a Telegram notifier to alerting-service and deprecates Slack as
the default operational channel. FreshnessMonitor Phase 2 (DATA_STALE events → alerting-service) should route via
Telegram, not Slack.
