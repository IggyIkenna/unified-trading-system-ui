import { describe, expect, it } from "vitest";
import { MOCK_STRATEGY_ALLOCATIONS } from "@/lib/mocks/fixtures/position-recon";

describe("position-recon fixtures", () => {
  it("MOCK_STRATEGY_ALLOCATIONS is a non-empty array of well-formed entries", () => {
    expect(Array.isArray(MOCK_STRATEGY_ALLOCATIONS)).toBe(true);
    expect(MOCK_STRATEGY_ALLOCATIONS.length).toBeGreaterThan(0);
    for (const e of MOCK_STRATEGY_ALLOCATIONS) {
      expect(typeof e.strategyId).toBe("string");
      expect(typeof e.strategyName).toBe("string");
      expect(["ETH", "BTC", "USDT"]).toContain(e.shareClass);
      expect(typeof e.targetEquity).toBe("number");
      expect(typeof e.actualEquity).toBe("number");
      expect(typeof e.driftPct).toBe("number");
      expect(["normal", "warning", "critical"]).toContain(e.severity);
    }
  });

  it("every allocation has a unique strategyId", () => {
    const ids = MOCK_STRATEGY_ALLOCATIONS.map((e) => e.strategyId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
