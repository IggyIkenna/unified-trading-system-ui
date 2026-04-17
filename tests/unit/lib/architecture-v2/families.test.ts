import { describe, expect, it } from "vitest";
import {
  FAMILY_METADATA,
  STRATEGY_FAMILIES_V2,
  getFamilyForArchetype,
  listArchetypesForFamily,
  listFamiliesOrdered,
  resolveFamilyBySlug,
} from "@/lib/architecture-v2";

describe("family metadata", () => {
  it("has metadata for every family", () => {
    for (const family of STRATEGY_FAMILIES_V2) {
      const meta = FAMILY_METADATA[family];
      expect(meta).toBeDefined();
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.slug.length).toBeGreaterThan(0);
      expect(meta.archetypes.length).toBeGreaterThan(0);
    }
  });

  it("listFamiliesOrdered returns 8 entries in registration order", () => {
    const families = listFamiliesOrdered();
    expect(families).toHaveLength(8);
    expect(families.map((f) => f.family)).toEqual([...STRATEGY_FAMILIES_V2]);
  });

  it("listArchetypesForFamily returns the same archetypes as the metadata", () => {
    for (const family of STRATEGY_FAMILIES_V2) {
      const meta = FAMILY_METADATA[family];
      const listed = listArchetypesForFamily(family);
      expect(listed.map((a) => a.archetype).sort()).toEqual([...meta.archetypes].sort());
    }
  });

  it("getFamilyForArchetype agrees with ARCHETYPE_TO_FAMILY", () => {
    expect(getFamilyForArchetype("ML_DIRECTIONAL_CONTINUOUS")).toBe("ML_DIRECTIONAL");
    expect(getFamilyForArchetype("LIQUIDATION_CAPTURE")).toBe("ARBITRAGE_STRUCTURAL");
    expect(getFamilyForArchetype("VOL_TRADING_OPTIONS")).toBe("VOL_TRADING");
  });

  it("resolveFamilyBySlug round-trips and returns null for unknown", () => {
    const meta = resolveFamilyBySlug("carry-and-yield");
    expect(meta?.family).toBe("CARRY_AND_YIELD");
    expect(resolveFamilyBySlug("nope-not-a-family")).toBeNull();
  });
});
