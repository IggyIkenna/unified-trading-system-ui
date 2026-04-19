import { describe, expect, it } from "vitest";

import {
  BLOCK_LIST,
  allCoverageCells,
  blockListEntryById,
  blockedCells,
} from "@/lib/architecture-v2";

describe("block-list metadata", () => {
  it("has exactly 10 entries BL-1 through BL-10", () => {
    expect(BLOCK_LIST).toHaveLength(10);
    for (let i = 1; i <= 10; i++) {
      expect(blockListEntryById(`BL-${i}`)).toBeDefined();
    }
  });

  it("every entry has a non-empty summary and remediation", () => {
    for (const entry of BLOCK_LIST) {
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(entry.remediation.length).toBeGreaterThan(0);
      expect(entry.archetypesAffected.length).toBeGreaterThan(0);
    }
  });

  it("every BLOCKED coverage cell references a BL- id that exists in BLOCK_LIST", () => {
    const knownIds = new Set(BLOCK_LIST.map((entry) => entry.id));
    for (const cell of blockedCells()) {
      for (const ref of cell.blockListRefs) {
        expect(
          knownIds.has(ref),
          `cell ${cell.archetype} × ${cell.category} × ${cell.instrumentType} references unknown ${ref}`,
        ).toBe(true);
      }
    }
  });

  it("every BL- id in BLOCK_LIST is referenced by at least one coverage cell", () => {
    const referencedIds = new Set<string>();
    for (const cell of allCoverageCells()) {
      for (const ref of cell.blockListRefs) {
        referencedIds.add(ref);
      }
    }
    for (const entry of BLOCK_LIST) {
      expect(
        referencedIds.has(entry.id),
        `${entry.id} is defined but no coverage cell references it`,
      ).toBe(true);
    }
  });
});
