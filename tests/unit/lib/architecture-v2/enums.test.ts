import { describe, expect, it } from "vitest";
import {
  ALLOCATOR_ARCHETYPES,
  ARCHETYPE_TO_FAMILY,
  STRATEGY_ARCHETYPES_V2,
  STRATEGY_FAMILIES_V2,
  VENUE_CATEGORIES_V2,
} from "@/lib/architecture-v2";

describe("architecture-v2 enums (UAC mirror)", () => {
  it("exposes exactly 8 families", () => {
    expect(STRATEGY_FAMILIES_V2).toHaveLength(8);
  });

  it("exposes exactly 18 archetypes", () => {
    expect(STRATEGY_ARCHETYPES_V2).toHaveLength(18);
  });

  it("exposes exactly 8 allocator archetypes", () => {
    expect(ALLOCATOR_ARCHETYPES).toHaveLength(8);
  });

  it("exposes 5 venue categories", () => {
    expect(VENUE_CATEGORIES_V2).toHaveLength(5);
  });

  it("maps every archetype to exactly one family and every family has archetypes", () => {
    const familySet = new Set(STRATEGY_FAMILIES_V2);
    const seenFamilies = new Set<string>();
    for (const archetype of STRATEGY_ARCHETYPES_V2) {
      const family = ARCHETYPE_TO_FAMILY[archetype];
      expect(family).toBeDefined();
      expect(familySet.has(family)).toBe(true);
      seenFamilies.add(family);
    }
    // Every one of the 8 families has at least one archetype.
    expect(seenFamilies.size).toBe(8);
  });

  it("ARCHETYPE_TO_FAMILY has no stray keys", () => {
    const mapKeys = Object.keys(ARCHETYPE_TO_FAMILY);
    expect(mapKeys.sort()).toEqual([...STRATEGY_ARCHETYPES_V2].sort());
  });
});
