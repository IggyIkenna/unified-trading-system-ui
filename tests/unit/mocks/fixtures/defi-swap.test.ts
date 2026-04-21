import { describe, expect, it } from "vitest";
import { generateSwapRoute, getMockPrice } from "@/lib/mocks/fixtures/defi-swap";

/**
 * defi-swap.ts — pure calculation helpers backing DeFiSwapWidget.
 *
 * Tests focus on determinism and the algo-type branch (SOR_DEX vs SOR_TWAP)
 * since those are the two modes the widget actually drives. We don't pin
 * exact fill prices — floating-point noise + venue rotation makes that
 * brittle — instead we assert structural invariants that would break if
 * the route generation regressed.
 */

describe("defi-swap fixtures", () => {
  describe("getMockPrice", () => {
    it("returns a positive price for known tokens", () => {
      expect(getMockPrice("ETH")).toBeGreaterThan(0);
      expect(getMockPrice("USDC")).toBeGreaterThan(0);
    });

    it("returns the documented fallback (1) for unknown tokens", () => {
      expect(getMockPrice("UNKNOWN_TOKEN_XYZ")).toBe(1);
    });
  });

  describe("generateSwapRoute", () => {
    it("returns a structurally valid route with all documented fields", () => {
      const route = generateSwapRoute("ETH", "USDC", 10);
      expect(route.path.length).toBeGreaterThanOrEqual(2);
      expect(route.pools.length).toBeGreaterThan(0);
      expect(route.expectedOutput).toBeGreaterThan(0);
      expect(route.gasEstimateEth).toBeGreaterThan(0);
      expect(route.gasEstimateUsd).toBeGreaterThan(0);
      expect(route.venue_fills!.length).toBeGreaterThan(0);
      expect(route.reference_price).toBeGreaterThan(0);
    });

    it("is deterministic for the same inputs", () => {
      const a = generateSwapRoute("ETH", "USDC", 5);
      const b = generateSwapRoute("ETH", "USDC", 5);
      expect(a.expectedOutput).toBe(b.expectedOutput);
      expect(a.gasEstimateEth).toBe(b.gasEstimateEth);
      expect(a.venue_fills!.map((f) => f.venue)).toEqual(b.venue_fills!.map((f) => f.venue));
    });

    it("SOR_TWAP concentrates on ≤2 venues (vs SOR_DEX which fans out)", () => {
      const dex = generateSwapRoute("ETH", "USDC", 100, "SOR_DEX");
      const twap = generateSwapRoute("ETH", "USDC", 100, "SOR_TWAP");
      expect(twap.venue_fills!.length).toBeLessThanOrEqual(2);
      expect(twap.venue_fills!.length).toBeLessThanOrEqual(dex.venue_fills!.length);
    });

    it("venue allocations sum to ~100% (within rounding tolerance)", () => {
      const route = generateSwapRoute("ETH", "USDC", 10);
      const total = route.venue_fills!.reduce((s, f) => s + f.allocation_pct, 0);
      expect(Math.abs(total - 100)).toBeLessThan(0.5);
    });

    it("stablecoin → stablecoin uses a direct 2-hop path", () => {
      const route = generateSwapRoute("USDC", "USDT", 1000);
      expect(route.path).toEqual(["USDC", "USDT"]);
    });

    it("non-stable pair routes through WETH", () => {
      const route = generateSwapRoute("LINK", "UNI", 100);
      expect(route.path).toContain("WETH");
    });
  });
});
