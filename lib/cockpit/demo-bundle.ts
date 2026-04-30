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

import { DEFAULT_BUNDLE_GUARDRAILS, type StrategyReleaseBundle } from "@/lib/architecture-v2/strategy-release-bundle";
import type { RuntimeOverride } from "@/lib/architecture-v2/runtime-override";
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
