import { describe, expect, it } from "vitest";

import {
  EXTERNAL_SIGNAL_STATUSES,
  canTransitionExternalSignalStatus,
  externalVersionKey,
  type ExternalSignalStatus,
  type ExternalSignalStrategyVersion,
} from "@/lib/architecture-v2/external-signal-strategy-version";

describe("ExternalSignalStrategyVersion state machine", () => {
  it("forward path: registered → validating → paper → approved_for_live → live", () => {
    expect(canTransitionExternalSignalStatus("registered", "validating")).toBe(true);
    expect(canTransitionExternalSignalStatus("validating", "paper")).toBe(true);
    expect(canTransitionExternalSignalStatus("paper", "approved_for_live")).toBe(true);
    expect(canTransitionExternalSignalStatus("approved_for_live", "live")).toBe(true);
  });

  it("validating can fall back to registered (fixable schema issue)", () => {
    expect(canTransitionExternalSignalStatus("validating", "registered")).toBe(true);
  });

  it("paper can fall back to validating (re-validate after schema rev)", () => {
    expect(canTransitionExternalSignalStatus("paper", "validating")).toBe(true);
  });

  it("registered cannot skip validation to paper", () => {
    expect(canTransitionExternalSignalStatus("registered", "paper")).toBe(false);
  });

  it("registered cannot skip to live", () => {
    expect(canTransitionExternalSignalStatus("registered", "live")).toBe(false);
  });

  it("paper cannot skip the approval gate to live", () => {
    expect(canTransitionExternalSignalStatus("paper", "live")).toBe(false);
  });

  it("paused can resume to paper or live, or retire", () => {
    expect(canTransitionExternalSignalStatus("paused", "paper")).toBe(true);
    expect(canTransitionExternalSignalStatus("paused", "live")).toBe(true);
    expect(canTransitionExternalSignalStatus("paused", "retired")).toBe(true);
  });

  it("retired is terminal", () => {
    for (const target of EXTERNAL_SIGNAL_STATUSES) {
      if (target === "retired") continue;
      expect(canTransitionExternalSignalStatus("retired", target)).toBe(false);
    }
  });

  it("any non-terminal can transition to retired", () => {
    const nonTerminal: readonly ExternalSignalStatus[] = [
      "registered",
      "validating",
      "paper",
      "approved_for_live",
      "live",
      "paused",
    ];
    for (const from of nonTerminal) {
      expect(canTransitionExternalSignalStatus(from, "retired")).toBe(true);
    }
  });

  it("self-transitions are rejected", () => {
    for (const status of EXTERNAL_SIGNAL_STATUSES) {
      expect(canTransitionExternalSignalStatus(status, status)).toBe(false);
    }
  });
});

describe("externalVersionKey — idempotency tag", () => {
  it("composes externalStrategyId@externalVersion", () => {
    const v: Pick<ExternalSignalStrategyVersion, "externalStrategyId" | "externalVersion"> = {
      externalStrategyId: "client-alpha-momentum",
      externalVersion: "v3.4.1",
    };
    expect(externalVersionKey(v)).toBe("client-alpha-momentum@v3.4.1");
  });

  it("differentiates versions by tag (not by strategy id alone)", () => {
    const v1: Pick<ExternalSignalStrategyVersion, "externalStrategyId" | "externalVersion"> = {
      externalStrategyId: "x",
      externalVersion: "v1",
    };
    const v2: Pick<ExternalSignalStrategyVersion, "externalStrategyId" | "externalVersion"> = {
      externalStrategyId: "x",
      externalVersion: "v2",
    };
    expect(externalVersionKey(v1)).not.toBe(externalVersionKey(v2));
  });
});

describe("ExternalSignalStrategyVersion — type-shape spot check", () => {
  it("constructs a minimal compliant external version", () => {
    const v: ExternalSignalStrategyVersion = {
      externalStrategyId: "alpha-momentum",
      externalVersion: "v1.0.0",
      clientId: "client-alpha",
      signalSchemaVersion: "ssv-2026.04",
      instructionMappingVersion: "imv-2026.04",
      executionConfigVersion: "ec-2026.04.10",
      riskConfigVersion: "rk-2026.04.05",
      reportingTagSetVersion: "rts-v3",
      validationRunIds: ["vr-001"],
      status: "registered",
      registeredBy: "client-portal",
      registeredAt: "2026-04-29T12:00:00Z",
    };
    expect(v.status).toBe("registered");
    expect(externalVersionKey(v)).toBe("alpha-momentum@v1.0.0");
  });
});
