import { describe, expect, it } from "vitest";

import {
  DEFAULT_BUNDLE_GUARDRAILS,
  type ReleaseBundleOverrideGuardrails,
} from "@/lib/architecture-v2/strategy-release-bundle";
import {
  GUARDRAIL_REJECTION_MESSAGE,
  RUNTIME_OVERRIDE_TYPES,
  validateOverrideAgainstGuardrails,
  type RuntimeOverrideValue,
} from "@/lib/architecture-v2/runtime-override";

const PERMISSIVE_GUARDRAILS: ReleaseBundleOverrideGuardrails = {
  ...DEFAULT_BUNDLE_GUARDRAILS,
  sizeMultiplierRange: [0, 1],
  venueDisableAllowed: true,
  executionPresets: ["passive", "aggressive", "conservative"],
  riskTighteningAllowed: true,
  pauseEntriesAllowed: true,
  exitOnlyAllowed: true,
  treasuryRouteOverridesAllowed: true,
};

describe("validateOverrideAgainstGuardrails — size_multiplier", () => {
  it("allows multipliers in range", () => {
    const ov: RuntimeOverrideValue = {
      overrideType: "size_multiplier",
      value: { multiplier: 0.5 },
    };
    expect(validateOverrideAgainstGuardrails(ov, PERMISSIVE_GUARDRAILS)).toEqual({ allowed: true });
  });

  it("rejects multipliers above 1 (no scaling up)", () => {
    const ov: RuntimeOverrideValue = {
      overrideType: "size_multiplier",
      value: { multiplier: 1.5 },
    };
    const result = validateOverrideAgainstGuardrails(ov, PERMISSIVE_GUARDRAILS);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("size_multiplier_above_one");
  });

  it("rejects multipliers below the bundle's lower bound", () => {
    const tighter: ReleaseBundleOverrideGuardrails = {
      ...PERMISSIVE_GUARDRAILS,
      sizeMultiplierRange: [0.25, 1],
    };
    const ov: RuntimeOverrideValue = {
      overrideType: "size_multiplier",
      value: { multiplier: 0.1 },
    };
    const result = validateOverrideAgainstGuardrails(ov, tighter);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("size_multiplier_out_of_range");
  });

  it("allows zero (full pause) inside the default range", () => {
    const ov: RuntimeOverrideValue = {
      overrideType: "size_multiplier",
      value: { multiplier: 0 },
    };
    expect(validateOverrideAgainstGuardrails(ov, PERMISSIVE_GUARDRAILS).allowed).toBe(true);
  });
});

describe("validateOverrideAgainstGuardrails — venue_disable", () => {
  it("rejected when bundle disallows venue disable", () => {
    const restrictive: ReleaseBundleOverrideGuardrails = {
      ...PERMISSIVE_GUARDRAILS,
      venueDisableAllowed: false,
    };
    const ov: RuntimeOverrideValue = {
      overrideType: "venue_disable",
      value: { venueOrProtocolId: "binance" },
    };
    const result = validateOverrideAgainstGuardrails(ov, restrictive);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("venue_disable_not_allowed");
  });

  it("allowed when bundle permits", () => {
    const ov: RuntimeOverrideValue = {
      overrideType: "venue_disable",
      value: { venueOrProtocolId: "binance" },
    };
    expect(validateOverrideAgainstGuardrails(ov, PERMISSIVE_GUARDRAILS).allowed).toBe(true);
  });
});

describe("validateOverrideAgainstGuardrails — execution_preset", () => {
  it("allows presets approved on the bundle", () => {
    const ov: RuntimeOverrideValue = {
      overrideType: "execution_preset",
      value: { presetId: "passive" },
    };
    expect(validateOverrideAgainstGuardrails(ov, PERMISSIVE_GUARDRAILS).allowed).toBe(true);
  });

  it("rejects unapproved presets", () => {
    const ov: RuntimeOverrideValue = {
      overrideType: "execution_preset",
      value: { presetId: "unauthorized-leveraged-preset" },
    };
    const result = validateOverrideAgainstGuardrails(ov, PERMISSIVE_GUARDRAILS);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("execution_preset_not_approved");
  });
});

describe("validateOverrideAgainstGuardrails — risk_limit_tightening", () => {
  it("allowed by default", () => {
    const ov: RuntimeOverrideValue = {
      overrideType: "risk_limit_tightening",
      value: { limit: "max_loss_usd", newValue: 1000 },
    };
    expect(validateOverrideAgainstGuardrails(ov, PERMISSIVE_GUARDRAILS).allowed).toBe(true);
  });

  it("rejected when bundle disables the lever", () => {
    const off: ReleaseBundleOverrideGuardrails = {
      ...PERMISSIVE_GUARDRAILS,
      riskTighteningAllowed: false,
    };
    const ov: RuntimeOverrideValue = {
      overrideType: "risk_limit_tightening",
      value: { limit: "max_drawdown_pct", newValue: 5 },
    };
    const result = validateOverrideAgainstGuardrails(ov, off);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("risk_loosening_forbidden");
  });
});

describe("validateOverrideAgainstGuardrails — treasury_route", () => {
  it("rejected when bundle disallows route overrides", () => {
    const ov: RuntimeOverrideValue = {
      overrideType: "treasury_route",
      value: { toWalletId: "wallet-backup-1" },
    };
    const result = validateOverrideAgainstGuardrails(ov, DEFAULT_BUNDLE_GUARDRAILS);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("treasury_route_not_allowed");
  });

  it("allowed when bundle permits", () => {
    const ov: RuntimeOverrideValue = {
      overrideType: "treasury_route",
      value: { toWalletId: "wallet-backup-1" },
    };
    expect(validateOverrideAgainstGuardrails(ov, PERMISSIVE_GUARDRAILS).allowed).toBe(true);
  });
});

describe("validateOverrideAgainstGuardrails — pause / exit-only", () => {
  it("allowed by default", () => {
    expect(
      validateOverrideAgainstGuardrails({ overrideType: "pause_entries", value: {} }, PERMISSIVE_GUARDRAILS).allowed,
    ).toBe(true);
    expect(
      validateOverrideAgainstGuardrails({ overrideType: "exit_only", value: {} }, PERMISSIVE_GUARDRAILS).allowed,
    ).toBe(true);
  });

  it("rejected when bundle disables", () => {
    const noPause: ReleaseBundleOverrideGuardrails = {
      ...PERMISSIVE_GUARDRAILS,
      pauseEntriesAllowed: false,
      exitOnlyAllowed: false,
    };
    expect(validateOverrideAgainstGuardrails({ overrideType: "pause_entries", value: {} }, noPause).reason).toBe(
      "pause_entries_not_allowed",
    );
    expect(validateOverrideAgainstGuardrails({ overrideType: "exit_only", value: {} }, noPause).reason).toBe(
      "exit_only_not_allowed",
    );
  });
});

describe("validateOverrideAgainstGuardrails — kill_switch (always allowed)", () => {
  it("allowed even on the most restrictive guardrails", () => {
    const lockdown: ReleaseBundleOverrideGuardrails = {
      sizeMultiplierRange: [1, 1],
      venueDisableAllowed: false,
      executionPresets: [],
      riskTighteningAllowed: false,
      pauseEntriesAllowed: false,
      exitOnlyAllowed: false,
      treasuryRouteOverridesAllowed: false,
    };
    const ov: RuntimeOverrideValue = {
      overrideType: "kill_switch",
      value: {},
    };
    expect(validateOverrideAgainstGuardrails(ov, lockdown).allowed).toBe(true);
  });
});

describe("RUNTIME_OVERRIDE_TYPES enumeration", () => {
  it("has 8 canonical override types", () => {
    expect(RUNTIME_OVERRIDE_TYPES).toHaveLength(8);
    expect(new Set(RUNTIME_OVERRIDE_TYPES).size).toBe(8);
  });

  it("includes kill_switch as the safety lever", () => {
    expect(RUNTIME_OVERRIDE_TYPES).toContain("kill_switch");
  });
});

describe("GUARDRAIL_REJECTION_MESSAGE — single source of truth", () => {
  it("matches the canonical copy from §4.8.3", () => {
    expect(GUARDRAIL_REJECTION_MESSAGE).toBe(
      "This change exceeds the bundle's override guardrails. Promote a new bundle or contact risk.",
    );
  });
});
