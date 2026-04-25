import { describe, it, expect } from "vitest";
import {
  INSTRUCTION_VENUE_CONSTRAINTS,
  ARCHETYPE_INSTRUCTION_TYPES,
  getValidVenueAssetGroups,
} from "@/components/research/shared/grid-config-panel";

describe("Instruction Venue Constraints", () => {
  it("TRADE instructions only allow CeFi and TradFi venues", () => {
    const valid = INSTRUCTION_VENUE_CONSTRAINTS.TRADE;
    expect(valid.has("CeFi")).toBe(true);
    expect(valid.has("TradFi")).toBe(true);
    expect(valid.has("DeFi")).toBe(false);
  });

  it("SWAP instructions only allow DeFi venues", () => {
    const valid = INSTRUCTION_VENUE_CONSTRAINTS.SWAP;
    expect(valid.has("DeFi")).toBe(true);
    expect(valid.has("CeFi")).toBe(false);
  });

  it("LEND/STAKE/BORROW instructions only allow DeFi venues", () => {
    for (const type of ["LEND", "STAKE", "BORROW"]) {
      const valid = INSTRUCTION_VENUE_CONSTRAINTS[type];
      expect(valid.has("DeFi")).toBe(true);
      expect(valid.has("CeFi")).toBe(false);
    }
  });
});

describe("Archetype Instruction Types", () => {
  it("momentum archetype uses TRADE instructions", () => {
    expect(ARCHETYPE_INSTRUCTION_TYPES.momentum).toEqual(["TRADE"]);
  });

  it("yield archetype uses LEND, SWAP, STAKE instructions", () => {
    expect(ARCHETYPE_INSTRUCTION_TYPES.yield).toEqual(["LEND", "SWAP", "STAKE"]);
  });

  it("value_betting archetype uses TRADE instructions", () => {
    expect(ARCHETYPE_INSTRUCTION_TYPES.value_betting).toEqual(["TRADE"]);
  });
});

describe("getValidVenueAssetGroups", () => {
  it("momentum → CeFi + TradFi (TRADE instruction)", () => {
    const cats = getValidVenueAssetGroups("momentum");
    expect(cats.has("CeFi")).toBe(true);
    expect(cats.has("TradFi")).toBe(true);
    expect(cats.has("DeFi")).toBe(false);
  });

  it("yield → DeFi only (LEND + SWAP + STAKE instructions)", () => {
    const cats = getValidVenueAssetGroups("yield");
    expect(cats.has("DeFi")).toBe(true);
    expect(cats.has("CeFi")).toBe(false);
    expect(cats.has("TradFi")).toBe(false);
  });

  it("statistical_arb → CeFi + TradFi", () => {
    const cats = getValidVenueAssetGroups("statistical_arb");
    expect(cats.has("CeFi")).toBe(true);
    expect(cats.has("TradFi")).toBe(true);
  });

  it("unknown archetype defaults to TRADE → CeFi + TradFi", () => {
    const cats = getValidVenueAssetGroups("nonexistent_archetype");
    expect(cats.has("CeFi")).toBe(true);
    expect(cats.has("TradFi")).toBe(true);
  });
});
