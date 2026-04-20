import { describe, expect, it } from "vitest";
import {
  BASIS_TRADE_MOCK_DATA,
  MOCK_BASIS_TRADE_HISTORY,
  calculateBasisTradeCostOfCarry,
  calculateBasisTradeExpectedOutput,
  calculateBasisTradeFundingImpact,
  calculateBasisTradeMarginUsage,
  calculateBreakenvenFundingRate,
} from "@/lib/mocks/fixtures/defi-basis-trade";

describe("defi-basis-trade fixtures", () => {
  it("BASIS_TRADE_MOCK_DATA has the expected top-level shape", () => {
    expect(Array.isArray(BASIS_TRADE_MOCK_DATA.assets)).toBe(true);
    expect(BASIS_TRADE_MOCK_DATA.assets.length).toBeGreaterThan(0);
    expect(Array.isArray(BASIS_TRADE_MOCK_DATA.spotVenues)).toBe(true);
    expect(Array.isArray(BASIS_TRADE_MOCK_DATA.perpVenues)).toBe(true);
    expect(typeof BASIS_TRADE_MOCK_DATA.marketData.ETH.spotPrice).toBe("number");
    expect(typeof BASIS_TRADE_MOCK_DATA.marketData.ETH.fundingRate).toBe("number");
    expect(typeof BASIS_TRADE_MOCK_DATA.marginRequirements.ETH.initialMarginPercent).toBe("number");
  });

  it("MOCK_BASIS_TRADE_HISTORY entries each include required fields", () => {
    expect(Array.isArray(MOCK_BASIS_TRADE_HISTORY)).toBe(true);
    expect(MOCK_BASIS_TRADE_HISTORY.length).toBeGreaterThan(0);
    const first = MOCK_BASIS_TRADE_HISTORY[0];
    expect(typeof first.seq).toBe("number");
    expect(typeof first.timestamp).toBe("string");
    expect(typeof first.asset).toBe("string");
    expect(["SWAP", "TRADE", "BOTH"]).toContain(first.operation);
    expect(["pending", "filled", "failed"]).toContain(first.status);
    expect(typeof first.runningPnL).toBe("number");
  });

  it("calculateBasisTradeExpectedOutput returns a positive number for BOTH on a known asset", () => {
    const output = calculateBasisTradeExpectedOutput(100000, "ETH", "BOTH", 5);
    expect(output).toBeGreaterThan(0);
  });

  it("calculateBasisTradeExpectedOutput returns 0 for an unknown asset", () => {
    const output = calculateBasisTradeExpectedOutput(100000, "UNKNOWN", "BOTH", 5);
    expect(output).toBe(0);
  });

  it("calculateBasisTradeExpectedOutput handles the SWAP branch", () => {
    const output = calculateBasisTradeExpectedOutput(100000, "BTC", "SWAP", 5);
    expect(output).toBeGreaterThan(0);
  });

  it("calculateBasisTradeExpectedOutput handles the TRADE branch", () => {
    const output = calculateBasisTradeExpectedOutput(100000, "SOL", "TRADE", 5);
    expect(output).toBeGreaterThan(0);
  });

  it("calculateBasisTradeMarginUsage returns a number for a known asset", () => {
    const usage = calculateBasisTradeMarginUsage(100000, "ETH", 0.00015);
    expect(typeof usage).toBe("number");
  });

  it("calculateBasisTradeFundingImpact returns annualised funding (percentage)", () => {
    const impact = calculateBasisTradeFundingImpact("ETH");
    expect(impact).toBeGreaterThan(0);
  });

  it("calculateBasisTradeCostOfCarry returns a positive cost", () => {
    const cost = calculateBasisTradeCostOfCarry(500000, "ETH");
    expect(cost).toBeGreaterThan(0);
  });

  it("calculateBreakenvenFundingRate returns a non-zero breakeven for a known asset", () => {
    const be = calculateBreakenvenFundingRate(500000, "BTC");
    expect(be).toBeGreaterThan(0);
  });

  it("helpers for unknown assets return 0 without throwing", () => {
    expect(calculateBasisTradeMarginUsage(1000, "UNKNOWN", 0)).toBe(0);
    expect(calculateBasisTradeFundingImpact("UNKNOWN")).toBe(0);
    expect(calculateBasisTradeCostOfCarry(1000, "UNKNOWN")).toBe(0);
    expect(calculateBreakenvenFundingRate(1000, "UNKNOWN")).toBe(0);
  });

  it("slippageByCapital ramps with capital size", () => {
    const base = 0.0005;
    expect(BASIS_TRADE_MOCK_DATA.slippageByCapital(50_000, base)).toBe(base);
    expect(BASIS_TRADE_MOCK_DATA.slippageByCapital(500_000, base)).toBeGreaterThan(base);
    expect(BASIS_TRADE_MOCK_DATA.slippageByCapital(10_000_000, base)).toBeGreaterThan(
      BASIS_TRADE_MOCK_DATA.slippageByCapital(2_000_000, base),
    );
  });

  it("calculateFundingPnL scales with notional", () => {
    const pnl = BASIS_TRADE_MOCK_DATA.calculateFundingPnL(10, 3400, 0.0001);
    expect(pnl).toBeCloseTo(10 * 3400 * 0.0001, 6);
  });

  it("calculateBasisPnL returns the scaled basis delta", () => {
    const pnl = BASIS_TRADE_MOCK_DATA.calculateBasisPnL(10, 200, 250);
    expect(typeof pnl).toBe("number");
    expect(pnl).not.toBe(0);
  });

  it("calculateMarginUsage returns a bounded percentage", () => {
    const usage = BASIS_TRADE_MOCK_DATA.calculateMarginUsage(100_000, 0.0001, 0.05);
    expect(typeof usage).toBe("number");
    expect(usage).toBeGreaterThan(0);
  });

  it("calculateCostOfCarry returns a positive annualised rate", () => {
    const apy = BASIS_TRADE_MOCK_DATA.calculateCostOfCarry(100_000, 3400, 3401);
    expect(apy).toBeGreaterThan(0);
  });
});
