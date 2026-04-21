import { describe, expect, it } from "vitest";

import { makeFamilyFilterPredicate } from "@/lib/architecture-v2/family-filter";

describe("makeFamilyFilterPredicate", () => {
  it("returns the identity predicate when no filter is active", () => {
    const predicate = makeFamilyFilterPredicate({
      family: undefined,
      archetype: undefined,
    });
    expect(predicate({ strategy_id: "anything" })).toBe(true);
    expect(predicate({})).toBe(true);
  });

  it("keeps rows whose strategy_id starts with the picked archetype token", () => {
    const predicate = makeFamilyFilterPredicate({
      family: "CARRY_AND_YIELD",
      archetype: "CARRY_BASIS_PERP",
    });
    expect(
      predicate({ strategy_id: "CARRY_BASIS_PERP@BINANCE:BTCUSDT" }),
    ).toBe(true);
  });

  it("drops rows with a different archetype token", () => {
    const predicate = makeFamilyFilterPredicate({
      family: "CARRY_AND_YIELD",
      archetype: "CARRY_BASIS_PERP",
    });
    expect(
      predicate({ strategy_id: "ML_DIRECTIONAL_CONTINUOUS@CME:ES" }),
    ).toBe(false);
  });

  it("falls back to strategy_family match when archetype token is absent", () => {
    const predicate = makeFamilyFilterPredicate({
      family: "CARRY_AND_YIELD",
      archetype: "CARRY_BASIS_PERP",
    });
    // Row has no recognisable archetype prefix but declares the family.
    expect(
      predicate({
        strategy_id: "mock-strategy-123",
        strategy_family: "CARRY_AND_YIELD",
      }),
    ).toBe(true);
  });

  it("matches strategy_family by enum key, label, or slug", () => {
    const predicate = makeFamilyFilterPredicate({
      family: "ML_DIRECTIONAL",
      archetype: undefined,
    });
    expect(predicate({ strategy_family: "ML_DIRECTIONAL" })).toBe(true);
    expect(predicate({ strategy_family: "ML Directional" })).toBe(true);
    expect(predicate({ strategy_family: "ml-directional" })).toBe(true);
  });

  it("drops rows whose strategy_family is a different family", () => {
    const predicate = makeFamilyFilterPredicate({
      family: "ML_DIRECTIONAL",
      archetype: undefined,
    });
    expect(predicate({ strategy_family: "CARRY_AND_YIELD" })).toBe(false);
  });

  it("keeps mock-unidentified rows by default (tolerant)", () => {
    // Mock rows frequently have neither strategy_id nor strategy_family.
    const predicate = makeFamilyFilterPredicate({
      family: "ML_DIRECTIONAL",
      archetype: undefined,
    });
    expect(predicate({})).toBe(true);
  });

  it("drops mock-unidentified rows when strict=true", () => {
    const predicate = makeFamilyFilterPredicate({
      family: "ML_DIRECTIONAL",
      archetype: undefined,
      strict: true,
    });
    expect(predicate({})).toBe(false);
    expect(predicate({ strategy_id: "" })).toBe(false);
  });

  it("matches archetype via parent family when only family is populated", () => {
    const predicate = makeFamilyFilterPredicate({
      family: "CARRY_AND_YIELD",
      archetype: "CARRY_BASIS_PERP",
    });
    // Row is identified by family only — should pass because family is the
    // archetype's parent.
    expect(
      predicate({
        strategy_id: "opaque-id",
        strategy_family: "Carry & Yield",
      }),
    ).toBe(true);
  });

  it("drops archetype-identified rows that do not match the archetype", () => {
    const predicate = makeFamilyFilterPredicate({
      family: "CARRY_AND_YIELD",
      archetype: "CARRY_BASIS_PERP",
    });
    expect(
      predicate({ strategy_id: "CARRY_BASIS_DATED@CME:BTC-JUN26" }),
    ).toBe(false);
  });
});
