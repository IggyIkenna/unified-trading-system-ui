import { describe, expect, it } from "vitest";
import {
  BRIDGE_PROTOCOLS,
  DEFI_CHAINS,
  DEFI_TOKENS,
  GAS_TOKEN_MIN_THRESHOLDS,
  MOCK_CHAIN_PORTFOLIOS,
  MOCK_TOKEN_BALANCES,
  getMockBridgeRoutes,
} from "@/lib/mocks/fixtures/defi-transfer";

describe("defi-transfer fixtures", () => {
  it("DEFI_CHAINS / DEFI_TOKENS / BRIDGE_PROTOCOLS are non-empty readonly arrays", () => {
    expect(DEFI_CHAINS.length).toBeGreaterThan(0);
    expect(DEFI_TOKENS.length).toBeGreaterThan(0);
    expect(BRIDGE_PROTOCOLS.length).toBeGreaterThan(0);
    expect(DEFI_CHAINS).toContain("ETHEREUM");
    expect(DEFI_TOKENS).toContain("USDC");
  });

  it("MOCK_TOKEN_BALANCES has positive numeric values", () => {
    for (const [token, bal] of Object.entries(MOCK_TOKEN_BALANCES)) {
      expect(typeof token).toBe("string");
      expect(typeof bal).toBe("number");
      expect(bal).toBeGreaterThan(0);
    }
  });

  it("MOCK_CHAIN_PORTFOLIOS entries have the documented fields", () => {
    expect(MOCK_CHAIN_PORTFOLIOS.length).toBeGreaterThan(0);
    for (const p of MOCK_CHAIN_PORTFOLIOS) {
      expect(typeof p.chain).toBe("string");
      expect(typeof p.totalUsd).toBe("number");
      expect(typeof p.gasTokenBalance).toBe("number");
      expect(typeof p.gasTokenSymbol).toBe("string");
      expect(typeof p.tokenBreakdown).toBe("object");
    }
  });

  it("getMockBridgeRoutes returns 4 route quotes for a positive amount", () => {
    const routes = getMockBridgeRoutes("USDC", 1000, "ETHEREUM", "ARBITRUM");
    expect(routes.length).toBe(4);
    // Exactly one route flagged as best-return
    const best = routes.filter((r) => r.isBestReturn);
    expect(best.length).toBe(1);
    for (const r of routes) {
      expect(typeof r.protocol).toBe("string");
      expect(typeof r.feePct).toBe("number");
      expect(typeof r.feeUsd).toBe("number");
      expect(typeof r.estimatedTimeMin).toBe("number");
      expect(typeof r.outputAmount).toBe("number");
    }
  });

  it("getMockBridgeRoutes returns an empty list for zero/negative amount", () => {
    expect(getMockBridgeRoutes("USDC", 0, "ETHEREUM", "ARBITRUM")).toEqual([]);
    expect(getMockBridgeRoutes("USDC", -10, "ETHEREUM", "ARBITRUM")).toEqual([]);
  });

  it("GAS_TOKEN_MIN_THRESHOLDS defines a floor for ETH / SOL / MATIC / BNB / AVAX", () => {
    expect(GAS_TOKEN_MIN_THRESHOLDS.ETH).toBeGreaterThan(0);
    expect(GAS_TOKEN_MIN_THRESHOLDS.SOL).toBeGreaterThan(0);
    expect(GAS_TOKEN_MIN_THRESHOLDS.MATIC).toBeGreaterThan(0);
    expect(GAS_TOKEN_MIN_THRESHOLDS.BNB).toBeGreaterThan(0);
    expect(GAS_TOKEN_MIN_THRESHOLDS.AVAX).toBeGreaterThan(0);
  });
});
