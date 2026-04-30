/**
 * Demo StrategyReleaseBundle + RuntimeOverride fixture for the cockpit shell.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §13 (mock-mode liveness):
 * the cockpit needs a representative bundle + override to demo "this is
 * the operating system, not just a dashboard". This fixture is rendered
 * inside the ReleaseBundlePanel so a buyer sees an actual bundle + audit
 * trail on first load.
 *
 * Phase 9 SCOPE: ship the demo data so the panel is non-empty; replace
 * with real data when the Promote stage's bundle-creation form ships.
 */

import type { AccountConnectivityConfig } from "@/lib/architecture-v2/account-connectivity-config";
import type { AssumptionDriftReport, AssumptionStack } from "@/lib/architecture-v2/assumption-stack";
import { DEFAULT_BUNDLE_GUARDRAILS, type StrategyReleaseBundle } from "@/lib/architecture-v2/strategy-release-bundle";
import type { RuntimeOverride } from "@/lib/architecture-v2/runtime-override";
import type { TreasuryOperationalConfig } from "@/lib/architecture-v2/treasury-config";
import { EMPTY_WORKSPACE_SCOPE } from "@/lib/architecture-v2/workspace-scope";

export const DEMO_BUNDLE: StrategyReleaseBundle = {
  releaseId: "rb-arbitrage-cefi-defi-v3.2.1",
  strategyId: "ARBITRAGE_PRICE_DISPERSION",
  strategyVersion: "3.2.1",
  researchConfigVersion: "rc-2026.04.20",
  featureSetVersion: "fs-cross-venue-spread-v7",
  modelVersion: "mdl-spread-classifier-v4",
  executionConfigVersion: "ec-2026.04.10",
  riskConfigVersion: "rk-2026.04.05",
  treasuryPolicyConfigVersion: "tp-1.2.0",
  venueSetVersion: "vs-cefi-defi-2026.04.20",
  instrumentUniverseVersion: "iu-btc-eth-2026.04.20",
  dataAssumptionVersion: "da-2026.04.20",
  signalSchemaVersion: "ssv-internal-v3",
  instructionSchemaVersion: "is-v4",
  shareClass: "USDT",
  accountOrMandateId: "mandate-arbitrage-001",
  validationRunIds: ["vr-001", "vr-002", "vr-003"],
  backtestRunIds: ["bt-001", "bt-002"],
  paperRunIds: ["pp-001", "pp-002"],
  pilotRunIds: ["pl-001"],
  promotionStatus: "live",
  runtimeOverrideGuardrails: {
    ...DEFAULT_BUNDLE_GUARDRAILS,
    sizeMultiplierRange: [0, 1],
    venueDisableAllowed: true,
    executionPresets: ["passive", "aggressive", "conservative"],
    riskTighteningAllowed: true,
    pauseEntriesAllowed: true,
    exitOnlyAllowed: true,
    treasuryRouteOverridesAllowed: true,
  },
  maturityPhase: "live_stable",
  createdBy: "research-agent",
  createdAt: "2026-04-25T10:00:00Z",
  approvedBy: "approver-femi",
  approvedAt: "2026-04-26T14:30:00Z",
  acceptedByTerminal: "trader-desmond",
  acceptedAt: "2026-04-27T09:15:00Z",
  contentHash: "sha256:7f3a9b8c4e1d2f5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
  lineageHash: "sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
};

export const DEMO_OVERRIDES: readonly RuntimeOverride[] = [
  {
    overrideId: "ov-2026-04-30-001",
    releaseId: "rb-arbitrage-cefi-defi-v3.2.1",
    scope: EMPTY_WORKSPACE_SCOPE,
    overrideType: "size_multiplier",
    value: { multiplier: 0.5 },
    reason: "Reducing size during low-liquidity weekend window",
    createdBy: "trader-desmond",
    createdAt: "2026-04-29T18:00:00Z",
    expiresAt: "2026-05-02T08:00:00Z",
    requiresApproval: false,
    preOverrideState: { sizeMultiplier: 1.0 },
    postOverrideState: { sizeMultiplier: 0.5 },
    auditEventId: "evt-001",
  },
  {
    overrideId: "ov-2026-04-30-002",
    releaseId: "rb-arbitrage-cefi-defi-v3.2.1",
    scope: EMPTY_WORKSPACE_SCOPE,
    overrideType: "venue_disable",
    value: { venueOrProtocolId: "okx" },
    reason: "OKX gateway degraded — disable until incident resolved",
    createdBy: "trader-desmond",
    createdAt: "2026-04-30T00:30:00Z",
    requiresApproval: false,
    preOverrideState: { okxEnabled: true },
    postOverrideState: { okxEnabled: false },
    auditEventId: "evt-002",
  },
];

/**
 * Demo TreasuryOperationalConfig — mutable, audited, unversioned routing
 * companion to the bundled `TreasuryPolicyConfig`. Surfaces in the Admin
 * Operational config editor so a buyer sees the live wallet routing that
 * RuntimeOverride.treasury_route mutates.
 */
export const DEMO_TREASURY_OPERATIONAL: TreasuryOperationalConfig = {
  operationalConfigId: "ops-treasury-arbitrage-001",
  inboundDefaultWalletId: "wallet-stable-treasury-01",
  outboundDefaultWalletId: "wallet-trading-collateral-01",
  feeBucketWalletId: "wallet-fees-01",
  settlementVenueId: "binance",
  lastUpdatedBy: "ops-priya",
  lastUpdatedAt: "2026-04-29T22:15:00Z",
  lastAuditEventId: "evt-treasury-001",
};

/**
 * Demo AccountConnectivityConfig — CeFi accounts + DeFi wallets + signer
 * profiles + outbound endpoints. Surfaces in the Admin Operational config
 * editor; Promote validation reads it via `hasCefiAccountsForVenues` and
 * `hasDefiWalletsForProtocols` to gate approval.
 */
export const DEMO_CONNECTIVITY: AccountConnectivityConfig = {
  connectivityConfigId: "conn-arbitrage-001",
  cefiAccounts: [
    {
      accountId: "acct-binance-mandate-01",
      venueId: "binance",
      apiKeyRef: "secret://binance/mandate-arbitrage-001/api-key",
      apiSecretRef: "secret://binance/mandate-arbitrage-001/api-secret",
      permissions: ["read", "trade"],
      status: "connected",
      accountOrMandateId: "mandate-arbitrage-001",
    },
    {
      accountId: "acct-okx-mandate-01",
      venueId: "okx",
      apiKeyRef: "secret://okx/mandate-arbitrage-001/api-key",
      apiSecretRef: "secret://okx/mandate-arbitrage-001/api-secret",
      permissions: ["read", "trade"],
      status: "degraded",
      accountOrMandateId: "mandate-arbitrage-001",
    },
    {
      accountId: "acct-deribit-mandate-01",
      venueId: "deribit",
      apiKeyRef: "secret://deribit/mandate-arbitrage-001/api-key",
      apiSecretRef: "secret://deribit/mandate-arbitrage-001/api-secret",
      permissions: ["read", "trade"],
      status: "connected",
      accountOrMandateId: "mandate-arbitrage-001",
    },
  ],
  defiWallets: [
    {
      walletId: "wallet-trading-collateral-01",
      address: "0xA1B2c3D4E5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0",
      chainId: 1,
      signerRef: "kms://gcp/projects/odum/locations/us-east4/keyRings/treasury/cryptoKeys/eth-signer-01",
      signerKind: "smart_account",
      approvedProtocols: ["aave_v3", "uniswap_v3"],
      status: "connected",
    },
    {
      walletId: "wallet-stable-treasury-01",
      address: "0xB2c3D4E5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1",
      chainId: 1,
      signerRef: "safe://eth/0xB2c3D4E5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1",
      signerKind: "multisig",
      approvedProtocols: ["aave_v3"],
      status: "connected",
    },
    {
      walletId: "wallet-fees-01",
      address: "0xC3D4E5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2",
      chainId: 1,
      signerRef: "kms://gcp/projects/odum/locations/us-east4/keyRings/treasury/cryptoKeys/fees-01",
      signerKind: "hot_eoa",
      approvedProtocols: ["uniswap_v3"],
      status: "connected",
    },
  ],
  signerProfiles: [
    {
      signerProfileId: "signer-gcp-kms-treasury",
      provider: "gcp_kms",
      providerRef: "projects/odum/locations/us-east4/keyRings/treasury",
      status: "connected",
    },
    {
      signerProfileId: "signer-safe-multisig",
      provider: "secret_manager",
      providerRef: "safe://eth/treasury-multisig",
      status: "connected",
    },
  ],
  outboundEndpoints: [
    {
      endpointId: "out-counterparty-acme",
      counterpartyId: "acme-fund",
      url: "https://signals.acme-fund.example/v1/intake",
      authTokenRef: "secret://signals/acme-fund/hmac-secret",
      status: "connected",
    },
  ],
  lastUpdatedBy: "ops-priya",
  lastUpdatedAt: "2026-04-29T22:15:00Z",
  lastAuditEventId: "evt-conn-001",
};

/**
 * Demo AssumptionStack — the Odum USP made visible. Shows the 9-layer stack
 * for the same arbitrage strategy DEMO_BUNDLE represents. Renders inside the
 * cockpit on Research/Validate + Research/Promote + Terminal/Explain.
 */
export const DEMO_ASSUMPTION_STACK: AssumptionStack = {
  id: "as-arbitrage-cefi-defi-v3.2.1",
  version: "3.2.1",
  hash: "sha256:a1s2s3u4m5p6t7i8o9n0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
  strategyId: "ARBITRAGE_PRICE_DISPERSION",
  strategyVersion: "3.2.1",
  modelVersionIds: ["mdl-spread-classifier-v4"],
  featureSetVersionIds: ["fs-cross-venue-spread-v7"],
  executionAssumptions: {
    slippageModel: "venue_book_replay",
    slippageBps: 4.5,
    commissionBps: 2.0,
    latencyMs: 120,
    makerRebateBps: -0.5,
    queuePositionAware: true,
    executionPresets: ["passive", "aggressive", "conservative"],
  },
  gasFeeAssumptions: {
    chainIds: [1, 8453, 42161],
    baseFeeGwei: 18,
    priorityFeeGwei: 1.5,
    stressMultipliers: [0.5, 4.0],
    avgGasUnits: {
      swap: 180_000,
      lending_supply: 220_000,
      lending_borrow: 280_000,
      approve: 46_000,
      claim: 95_000,
      transfer: 21_000,
    },
    mevProtectionEnabled: true,
  },
  treasuryPolicy: {
    shareClass: "USDT",
    approvedCollateral: ["USDT", "USDC", "BTC", "ETH"],
    hedgeRatioRange: [0.85, 1.05],
    maxGrossLeverage: 3.0,
    maxNetLeverage: 1.0,
    autoRebalanceEnabled: true,
    rebalanceThreshold: 0.05,
  },
  depositWithdrawalAssumptions: {
    avgDailyDepositPct: 0.005,
    avgDailyWithdrawalPct: 0.004,
    redemptionStress: { pct: 0.3, days: 5 },
    noticePeriodDays: 7,
    liquidityBufferPct: 0.15,
  },
  liquidationAssumptions: {
    initialMarginPct: 0.2,
    maintenanceMarginPct: 0.1,
    collateralHaircuts: { USDT: 0, USDC: 0, BTC: 0.1, ETH: 0.15 },
    maxLtv: 0.7,
    forceRebalanceLtv: 0.6,
    priceShockPct: 0.2,
  },
  portfolioRebalanceAssumptions: {
    method: "vol_target",
    volTarget: 0.12,
    cadence: "drift_threshold",
    driftThreshold: 0.05,
    maxSingleWeight: 0.4,
  },
  venueRoutingAssumptions: {
    mode: "SOR_AT_EXECUTION",
    approvedVenues: ["binance", "okx", "deribit", "aave_v3", "uniswap_v3"],
    venueBias: { binance: 1.1, okx: 0.95, deribit: 1.0 },
    preferSameVenueLeg: false,
  },
  riskAssumptions: {
    maxDrawdownPct: 0.08,
    maxConcentrationPct: 0.25,
    maxGrossExposure: 3.0,
    maxNetExposure: 1.0,
    maxUnrealisedLossUsd: 250_000,
    maxVenueConcentrationPct: 0.4,
  },
  reportingAssumptions: {
    pnlBasis: "blended",
    markSource: "weighted_average",
    navFrequency: "intraday",
    settlementLagDays: 1,
    executionAttributionIncluded: true,
  },
  createdBy: "research-agent",
  createdAt: "2026-04-25T10:00:00Z",
  notes: "Production-grade stack — promotion-ready for paper + pilot.",
};

/**
 * Demo drift report — shown in Explain mode. Adherence score 87/100; gas +
 * client-flow layers are drifting beyond simulation (+9 bps and +4 bps
 * respectively in adverse direction).
 */
export const DEMO_DRIFT_REPORT: AssumptionDriftReport = {
  stackId: "as-arbitrage-cefi-defi-v3.2.1",
  perLayerDrift: {
    execution: 1.2,
    gas_fees: 9.4,
    treasury: 0.3,
    client_flows: 3.8,
    liquidation: -0.5,
    portfolio_rebalance: 0.0,
    venue_routing: 0.8,
    risk: 0.0,
    reporting: 0.0,
  },
  adherenceScore: 87,
  alerts: ["gas_fees", "client_flows"],
};
