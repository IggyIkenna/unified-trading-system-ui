import { describe, expect, it } from "vitest";

import {
  DEFAULT_BUNDLE_GUARDRAILS,
  PROMOTION_STATUS_TO_MATURITY,
  RELEASE_BUNDLE_PROMOTION_STATUSES,
  canTransitionPromotionStatus,
  maturityPhaseForPromotionStatus,
  type ReleaseBundlePromotionStatus,
  type StrategyReleaseBundle,
} from "@/lib/architecture-v2/strategy-release-bundle";
import { STRATEGY_MATURITY_PHASES } from "@/lib/architecture-v2/lifecycle";

describe("ReleaseBundle promotion-status state machine", () => {
  it("forward path: draft → candidate → approved_for_paper → paper → approved_for_pilot → pilot → approved_for_live → live", () => {
    expect(canTransitionPromotionStatus("draft", "candidate")).toBe(true);
    expect(canTransitionPromotionStatus("candidate", "approved_for_paper")).toBe(true);
    expect(canTransitionPromotionStatus("approved_for_paper", "paper")).toBe(true);
    expect(canTransitionPromotionStatus("paper", "approved_for_pilot")).toBe(true);
    expect(canTransitionPromotionStatus("approved_for_pilot", "pilot")).toBe(true);
    expect(canTransitionPromotionStatus("pilot", "approved_for_live")).toBe(true);
    expect(canTransitionPromotionStatus("approved_for_live", "live")).toBe(true);
  });

  it("rejects skipping the approval gate (paper → pilot directly)", () => {
    expect(canTransitionPromotionStatus("paper", "pilot")).toBe(false);
  });

  it("rejects skipping the live approval gate (pilot → live directly)", () => {
    expect(canTransitionPromotionStatus("pilot", "live")).toBe(false);
  });

  it("rejects skipping all the way to live (draft → live)", () => {
    expect(canTransitionPromotionStatus("draft", "live")).toBe(false);
  });

  it("monitor → live is reversible (decay measured, lift back)", () => {
    expect(canTransitionPromotionStatus("monitor", "live")).toBe(true);
  });

  it("paused can resume to paper / pilot / live or retire", () => {
    expect(canTransitionPromotionStatus("paused", "paper")).toBe(true);
    expect(canTransitionPromotionStatus("paused", "pilot")).toBe(true);
    expect(canTransitionPromotionStatus("paused", "live")).toBe(true);
    expect(canTransitionPromotionStatus("paused", "retired")).toBe(true);
  });

  it("retired is terminal — no outgoing transitions", () => {
    for (const target of RELEASE_BUNDLE_PROMOTION_STATUSES) {
      if (target === "retired") continue;
      expect(canTransitionPromotionStatus("retired", target)).toBe(false);
    }
  });

  it("rolled_back can recandidate or retire", () => {
    expect(canTransitionPromotionStatus("rolled_back", "candidate")).toBe(true);
    expect(canTransitionPromotionStatus("rolled_back", "retired")).toBe(true);
    expect(canTransitionPromotionStatus("rolled_back", "live")).toBe(false);
  });

  it("any non-terminal state can transition to retired", () => {
    const nonTerminal: readonly ReleaseBundlePromotionStatus[] = [
      "draft",
      "candidate",
      "approved_for_paper",
      "paper",
      "approved_for_pilot",
      "pilot",
      "approved_for_live",
      "live",
      "paused",
      "monitor",
      "rolled_back",
    ];
    for (const from of nonTerminal) {
      expect(canTransitionPromotionStatus(from, "retired")).toBe(true);
    }
  });

  it("self-transitions are rejected", () => {
    for (const status of RELEASE_BUNDLE_PROMOTION_STATUSES) {
      expect(canTransitionPromotionStatus(status, status)).toBe(false);
    }
  });
});

describe("ReleaseBundle promotion-status → maturity-phase mapping", () => {
  it("every promotion status maps to a known maturity phase", () => {
    for (const status of RELEASE_BUNDLE_PROMOTION_STATUSES) {
      const phase = maturityPhaseForPromotionStatus(status);
      expect(STRATEGY_MATURITY_PHASES).toContain(phase);
    }
  });

  it("paper promotion status maps to paper_stable maturity phase", () => {
    expect(maturityPhaseForPromotionStatus("paper")).toBe("paper_stable");
  });

  it("pilot promotion status maps to pilot maturity phase (the new one)", () => {
    expect(maturityPhaseForPromotionStatus("pilot")).toBe("pilot");
  });

  it("live promotion status maps to live_stable maturity phase", () => {
    expect(maturityPhaseForPromotionStatus("live")).toBe("live_stable");
  });

  it("monitor promotion status maps to monitor maturity phase", () => {
    expect(maturityPhaseForPromotionStatus("monitor")).toBe("monitor");
  });

  it("rolled_back maps to retired (the bundle is non-deployable)", () => {
    expect(maturityPhaseForPromotionStatus("rolled_back")).toBe("retired");
  });

  it("PROMOTION_STATUS_TO_MATURITY is exhaustive", () => {
    expect(Object.keys(PROMOTION_STATUS_TO_MATURITY).sort()).toEqual([...RELEASE_BUNDLE_PROMOTION_STATUSES].sort());
  });
});

describe("DEFAULT_BUNDLE_GUARDRAILS — conservative defaults", () => {
  it("sizeMultiplierRange is [0, 1] — scale down only, never up", () => {
    expect(DEFAULT_BUNDLE_GUARDRAILS.sizeMultiplierRange).toEqual([0, 1]);
  });

  it("venue disable + treasury reroute default to false (require explicit widening)", () => {
    expect(DEFAULT_BUNDLE_GUARDRAILS.venueDisableAllowed).toBe(false);
    expect(DEFAULT_BUNDLE_GUARDRAILS.treasuryRouteOverridesAllowed).toBe(false);
  });

  it("risk tightening + pause / exit-only default to true (safety affordances)", () => {
    expect(DEFAULT_BUNDLE_GUARDRAILS.riskTighteningAllowed).toBe(true);
    expect(DEFAULT_BUNDLE_GUARDRAILS.pauseEntriesAllowed).toBe(true);
    expect(DEFAULT_BUNDLE_GUARDRAILS.exitOnlyAllowed).toBe(true);
  });
});

describe("StrategyReleaseBundle — type-shape spot check", () => {
  it("constructs a minimal compliant bundle", () => {
    const bundle: StrategyReleaseBundle = {
      releaseId: "rb-arbitrage-cefi-defi-v3.2.1",
      strategyId: "ARBITRAGE_PRICE_DISPERSION",
      strategyVersion: "3.2.1",
      researchConfigVersion: "rc-2026.04.01",
      executionConfigVersion: "ec-2026.04.10",
      riskConfigVersion: "rk-2026.04.05",
      venueSetVersion: "vs-cefi-defi-2026.04.20",
      instrumentUniverseVersion: "iu-btc-eth-2026.04.20",
      dataAssumptionVersion: "da-2026.04.20",
      instructionSchemaVersion: "is-v4",
      validationRunIds: ["vr-001", "vr-002"],
      backtestRunIds: ["bt-001", "bt-002"],
      promotionStatus: "approved_for_paper",
      runtimeOverrideGuardrails: DEFAULT_BUNDLE_GUARDRAILS,
      maturityPhase: "backtest_multi_year",
      createdBy: "research-agent",
      createdAt: "2026-04-29T12:00:00Z",
      contentHash: "sha256:abc",
      lineageHash: "sha256:def",
    };
    expect(bundle.promotionStatus).toBe("approved_for_paper");
    expect(bundle.runtimeOverrideGuardrails.sizeMultiplierRange[1]).toBe(1);
  });
});
