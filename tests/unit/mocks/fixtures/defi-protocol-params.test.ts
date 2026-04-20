import { describe, expect, it } from "vitest";
import {
  AAVE_V3_PARAMS,
  ALL_PROTOCOLS,
  COMPOUND_PARAMS,
  MORPHO_PARAMS,
  calculateHealthFactorDelta,
  getAssetParams,
} from "@/lib/mocks/fixtures/defi-protocol-params";

describe("defi-protocol-params fixtures", () => {
  it("AAVE_V3_PARAMS has the documented protocol shape", () => {
    expect(AAVE_V3_PARAMS.protocol).toBe("AAVEV3");
    expect(AAVE_V3_PARAMS.venue_id).toContain("AAVEV3");
    expect(typeof AAVE_V3_PARAMS.name).toBe("string");
    expect(Object.keys(AAVE_V3_PARAMS.assets).length).toBeGreaterThan(0);
    const eth = AAVE_V3_PARAMS.assets.ETH;
    expect(eth.symbol).toBe("ETH");
    expect(typeof eth.collateral_factor).toBe("number");
    expect(typeof eth.liquidation_threshold).toBe("number");
  });

  it("MORPHO_PARAMS uses higher ETH LTV than AAVE", () => {
    expect(MORPHO_PARAMS.assets.ETH.collateral_factor).toBeGreaterThan(
      AAVE_V3_PARAMS.assets.ETH.collateral_factor,
    );
  });

  it("COMPOUND_PARAMS carries the same asset keys as AAVE", () => {
    for (const key of Object.keys(AAVE_V3_PARAMS.assets)) {
      expect(COMPOUND_PARAMS.assets[key]).toBeDefined();
    }
  });

  it("ALL_PROTOCOLS lists AAVE + MORPHO + COMPOUND", () => {
    expect(ALL_PROTOCOLS.length).toBe(3);
    const names = ALL_PROTOCOLS.map((p) => p.protocol);
    expect(names).toContain("AAVEV3");
    expect(names).toContain("MORPHO");
    expect(names).toContain("COMPOUND");
  });

  it("getAssetParams returns params for valid (protocol, asset) pair", () => {
    const p = getAssetParams("AAVEV3", "ETH");
    expect(p).not.toBeNull();
    expect(p?.symbol).toBe("ETH");
  });

  it("getAssetParams returns null for an unknown asset", () => {
    expect(getAssetParams("AAVEV3", "NOT_REAL")).toBeNull();
  });

  it("calculateHealthFactorDelta LEND returns positive delta", () => {
    const delta = calculateHealthFactorDelta("AAVEV3", "ETH", "LEND", 10000, 2.0);
    expect(delta).toBeGreaterThan(0);
  });

  it("calculateHealthFactorDelta BORROW returns negative delta", () => {
    const delta = calculateHealthFactorDelta("AAVEV3", "ETH", "BORROW", 10000, 2.0);
    expect(delta).toBeLessThan(0);
  });

  it("calculateHealthFactorDelta WITHDRAW returns negative delta", () => {
    const delta = calculateHealthFactorDelta("AAVEV3", "ETH", "WITHDRAW", 10000, 2.0);
    expect(delta).toBeLessThan(0);
  });

  it("calculateHealthFactorDelta REPAY returns positive delta", () => {
    const delta = calculateHealthFactorDelta("AAVEV3", "ETH", "REPAY", 10000, 2.0);
    expect(delta).toBeGreaterThan(0);
  });

  it("calculateHealthFactorDelta returns 0 for unknown asset", () => {
    const delta = calculateHealthFactorDelta("AAVEV3", "BOGUS", "LEND", 1000, 2);
    expect(delta).toBe(0);
  });
});
