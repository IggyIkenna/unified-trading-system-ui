import { describe, expect, it } from "vitest";

import { PHASES, type Phase, isPhase } from "@/lib/phase/types";
import { phaseForPath } from "@/lib/phase/use-phase-from-route";

describe("G1.1 phase — types", () => {
  it("exposes exactly 3 phases in the closed enum", () => {
    expect(PHASES).toEqual(["research", "paper", "live"]);
    expect(PHASES).toHaveLength(3);
  });

  it("isPhase narrows valid values", () => {
    expect(isPhase("research")).toBe(true);
    expect(isPhase("paper")).toBe(true);
    expect(isPhase("live")).toBe(true);
  });

  it("isPhase rejects invalid values", () => {
    expect(isPhase("observe")).toBe(false);
    expect(isPhase("")).toBe(false);
    expect(isPhase(null)).toBe(false);
    expect(isPhase(undefined)).toBe(false);
    expect(isPhase(42)).toBe(false);
  });
});

describe("G1.1 phase — phaseForPath route inference", () => {
  const makeSearch = (entries: Record<string, string>): URLSearchParams => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(entries)) params.set(k, v);
    return params;
  };

  it("returns 'research' for /services/research/** with no querystring", () => {
    expect(phaseForPath("/services/research/strategies")).toBe("research");
    expect(phaseForPath("/services/research/ml/training")).toBe("research");
    expect(phaseForPath("/services/research/overview", null)).toBe("research");
  });

  it("returns 'live' for /services/trading/** with no querystring", () => {
    expect(phaseForPath("/services/trading/strategies")).toBe("live");
    expect(phaseForPath("/services/trading/terminal")).toBe("live");
    expect(phaseForPath("/services/trading/positions", new URLSearchParams())).toBe("live");
  });

  it("returns 'live' for /services/execution/**", () => {
    expect(phaseForPath("/services/execution/overview")).toBe("live");
    expect(phaseForPath("/services/execution/tca")).toBe("live");
  });

  it("returns 'paper' when ?phase=paper querystring is present", () => {
    expect(phaseForPath("/services/trading/strategies", makeSearch({ phase: "paper" }))).toBe("paper");
    expect(phaseForPath("/services/research/strategies", makeSearch({ phase: "paper" }))).toBe("paper");
  });

  it("falls back to 'research' for unknown paths", () => {
    expect(phaseForPath("/services/reports/executive")).toBe("research");
    expect(phaseForPath("/")).toBe("research");
    expect(phaseForPath("")).toBe("research");
  });

  it("querystring phase overrides route inference only for valid Phase values", () => {
    // Invalid phase querystring is ignored, falls back to route inference.
    expect(phaseForPath("/services/trading/strategies", makeSearch({ phase: "observe" }))).toBe("live");
    expect(phaseForPath("/services/research/strategies", makeSearch({ phase: "bogus" }))).toBe("research");
  });
});

describe("G1.1 phase — Phase type is closed", () => {
  it("compiles with exhaustive switch", () => {
    // This test exists so that adding a phase without updating the enum
    // causes a TS compile error. Run at author time, green at runtime.
    const label = (p: Phase): string => {
      switch (p) {
        case "research":
          return "R";
        case "paper":
          return "P";
        case "live":
          return "L";
      }
    };
    expect(label("research")).toBe("R");
    expect(label("paper")).toBe("P");
    expect(label("live")).toBe("L");
  });
});
