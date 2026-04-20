import { describe, expect, it } from "vitest";

import {
  ARCHETYPE_COVERAGE,
  INSTRUMENT_TYPES_V2,
  allCoverageCells,
  blockedCells,
  cellsForInstrumentPair,
  cellsMatching,
  coverageForArchetype,
  rollingFutureCells,
  supportedCells,
} from "@/lib/architecture-v2/coverage";

describe("INSTRUMENT_TYPES_V2", () => {
  it("exports 8 instrument types", () => {
    expect(INSTRUMENT_TYPES_V2).toHaveLength(8);
    expect(INSTRUMENT_TYPES_V2).toContain("spot");
    expect(INSTRUMENT_TYPES_V2).toContain("event_settled");
  });
});

describe("allCoverageCells", () => {
  it("aggregates cells from every archetype", () => {
    const all = allCoverageCells();
    expect(all.length).toBeGreaterThan(0);
    // Sanity: total should equal sum of per-archetype cells
    let expected = 0;
    for (const arch of Object.keys(ARCHETYPE_COVERAGE) as (keyof typeof ARCHETYPE_COVERAGE)[]) {
      expected += ARCHETYPE_COVERAGE[arch].cells.length;
    }
    expect(all.length).toBe(expected);
  });

  it("every cell has required fields", () => {
    for (const c of allCoverageCells()) {
      expect(c.archetype).toBeDefined();
      expect(c.category).toBeDefined();
      expect(c.instrumentType).toBeDefined();
      expect(c.status).toBeDefined();
      expect(Array.isArray(c.representativeVenueIds)).toBe(true);
      expect(Array.isArray(c.signalVariants)).toBe(true);
      expect(Array.isArray(c.blockListRefs)).toBe(true);
      expect(Array.isArray(c.representativeSlotLabels)).toBe(true);
    }
  });
});

describe("coverageForArchetype", () => {
  it("returns the specific archetype coverage bundle", () => {
    const ml = coverageForArchetype("ML_DIRECTIONAL_CONTINUOUS");
    expect(ml.archetype).toBe("ML_DIRECTIONAL_CONTINUOUS");
    expect(ml.cells.length).toBeGreaterThan(0);
  });

  it("usesRollingFutures flag is set for rolling archetypes", () => {
    expect(coverageForArchetype("ML_DIRECTIONAL_CONTINUOUS").usesRollingFutures).toBe(true);
    expect(coverageForArchetype("YIELD_STAKING_SIMPLE").usesRollingFutures).toBe(false);
  });
});

describe("cellsMatching", () => {
  it("filters cells by predicate", () => {
    const cefiCells = cellsMatching((c) => c.category === "CEFI");
    expect(cefiCells.length).toBeGreaterThan(0);
    for (const c of cefiCells) {
      expect(c.category).toBe("CEFI");
    }
  });

  it("returns empty array when predicate rejects all", () => {
    const nothing = cellsMatching(() => false);
    expect(nothing).toEqual([]);
  });

  it("returns all cells when predicate accepts all", () => {
    const all = cellsMatching(() => true);
    expect(all.length).toBe(allCoverageCells().length);
  });
});

describe("cellsForInstrumentPair", () => {
  it("returns only pair-relevant archetypes", () => {
    const pairs = cellsForInstrumentPair("spot", "perp");
    const pairArchetypes = new Set(pairs.map((c) => c.archetype));
    const allowed = new Set([
      "ARBITRAGE_PRICE_DISPERSION",
      "CARRY_BASIS_PERP",
      "CARRY_BASIS_DATED",
      "STAT_ARB_PAIRS_FIXED",
      "STAT_ARB_CROSS_SECTIONAL",
      "CARRY_STAKED_BASIS",
    ]);
    for (const arch of pairArchetypes) {
      expect(allowed.has(arch)).toBe(true);
    }
  });

  it("matches cells whose instrumentType equals either leg", () => {
    const pairs = cellsForInstrumentPair("spot", "perp");
    for (const c of pairs) {
      expect(c.instrumentType === "spot" || c.instrumentType === "perp").toBe(true);
    }
  });

  it("returns non-empty for a common pair", () => {
    expect(cellsForInstrumentPair("spot", "perp").length).toBeGreaterThan(0);
  });
});

describe("blockedCells", () => {
  it("returns only cells with status BLOCKED", () => {
    const blocked = blockedCells();
    expect(blocked.length).toBeGreaterThan(0);
    for (const c of blocked) {
      expect(c.status).toBe("BLOCKED");
    }
  });
});

describe("supportedCells", () => {
  it("returns only cells with status SUPPORTED", () => {
    const supported = supportedCells();
    expect(supported.length).toBeGreaterThan(0);
    for (const c of supported) {
      expect(c.status).toBe("SUPPORTED");
    }
  });
});

describe("rollingFutureCells", () => {
  it("returns only cells with rollMode rolling or both", () => {
    const rolling = rollingFutureCells();
    expect(rolling.length).toBeGreaterThan(0);
    for (const c of rolling) {
      expect(c.rollMode === "rolling" || c.rollMode === "both").toBe(true);
    }
  });
});

describe("ARCHETYPE_COVERAGE registry", () => {
  it("has 18 archetypes", () => {
    expect(Object.keys(ARCHETYPE_COVERAGE)).toHaveLength(18);
  });

  it("each archetype has a non-empty cells array", () => {
    for (const arch of Object.keys(ARCHETYPE_COVERAGE) as (keyof typeof ARCHETYPE_COVERAGE)[]) {
      expect(ARCHETYPE_COVERAGE[arch].cells.length).toBeGreaterThan(0);
    }
  });
});
