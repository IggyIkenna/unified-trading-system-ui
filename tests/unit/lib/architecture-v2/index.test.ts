import { describe, expect, it } from "vitest";

import * as facade from "@/lib/architecture-v2";

/**
 * The facade module re-exports every sub-module. This smoke test asserts
 * that the public surface is intact — if a sub-module export is removed or
 * renamed accidentally the test flags it.
 */
describe("architecture-v2 facade (index.ts)", () => {
  it("re-exports enum constants", () => {
    expect(facade.STRATEGY_FAMILIES_V2).toBeDefined();
    expect(facade.STRATEGY_ARCHETYPES_V2).toBeDefined();
    expect(facade.ALLOCATOR_ARCHETYPES).toBeDefined();
    expect(facade.VENUE_CATEGORIES_V2).toBeDefined();
    expect(facade.ARCHETYPE_TO_FAMILY).toBeDefined();
  });

  it("re-exports coverage helpers", () => {
    expect(typeof facade.allCoverageCells).toBe("function");
    expect(typeof facade.coverageForArchetype).toBe("function");
    expect(typeof facade.cellsMatching).toBe("function");
    expect(typeof facade.cellsForInstrumentPair).toBe("function");
    expect(typeof facade.blockedCells).toBe("function");
    expect(typeof facade.supportedCells).toBe("function");
    expect(typeof facade.rollingFutureCells).toBe("function");
    expect(facade.INSTRUMENT_TYPES_V2).toBeDefined();
    expect(facade.ARCHETYPE_COVERAGE).toBeDefined();
  });

  it("re-exports block-list helpers", () => {
    expect(Array.isArray(facade.BLOCK_LIST)).toBe(true);
    expect(typeof facade.blockListEntryById).toBe("function");
  });
});
