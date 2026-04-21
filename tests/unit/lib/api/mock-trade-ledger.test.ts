import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  amendMockOrder,
  cancelMockOrder,
  computeDefiLedgerPnL,
  getFilledDefiOrders,
  getOrders,
  getOrdersByStatus,
  placeMockOrder,
  resetMockOrders,
  type PlaceOrderParams,
} from "@/lib/api/mock-trade-ledger";

/**
 * Mock trade ledger — pure-logic unit tests.
 *
 * Focus areas:
 *  - `instruction_type` is preserved end-to-end on placeMockOrder
 *    (regression test for the bug where trade-history rows derived type
 *    from instrument_id string matching because the field was dropped).
 *  - Pending → filled transition after the simulated 200 ms fill delay.
 *  - Cancel, amend, reset, and filter queries behave as documented.
 *
 * Fake timers: placeMockOrder uses setTimeout(fill, 200). We drive that
 * explicitly via vi.advanceTimersByTime so tests stay deterministic.
 */

function baseParams(overrides: Partial<PlaceOrderParams> = {}): PlaceOrderParams {
  return {
    client_id: "internal-trader",
    instrument_id: "AAVEV3-ETHEREUM:LEND:ETH",
    venue: "AAVEV3-ETHEREUM",
    side: "buy",
    order_type: "market",
    quantity: 10,
    price: 1,
    asset_class: "DeFi",
    lane: "defi",
    ...overrides,
  };
}

describe("mock-trade-ledger", () => {
  beforeEach(() => {
    resetMockOrders();
    vi.useFakeTimers();
  });

  describe("placeMockOrder", () => {
    it("persists instruction_type when the caller passes one", () => {
      const order = placeMockOrder(baseParams({ instruction_type: "LEND" }));
      expect(order.instruction_type).toBe("LEND");

      // And it survives the pending → filled transition
      vi.advanceTimersByTime(250);
      const filled = getOrders().find((o) => o.id === order.id);
      expect(filled?.instruction_type).toBe("LEND");
    });

    it("stores null when caller omits instruction_type (legacy compatibility)", () => {
      const order = placeMockOrder(baseParams());
      expect(order.instruction_type).toBeNull();
    });

    it("transitions pending → filled after ~200 ms", () => {
      const order = placeMockOrder(baseParams({ instruction_type: "SWAP" }));
      expect(order.status).toBe("pending");

      vi.advanceTimersByTime(250);
      const filled = getOrders().find((o) => o.id === order.id);
      expect(filled?.status).toBe("filled");
      expect(filled?.filled_quantity).toBe(order.quantity);
      expect(filled?.average_fill_price).not.toBeNull();
    });

    it("applies slippage within max_slippage_bps tolerance", () => {
      const order = placeMockOrder(baseParams({ side: "buy", price: 1000, max_slippage_bps: 100 }));
      vi.advanceTimersByTime(250);

      const filled = getOrders().find((o) => o.id === order.id);
      const fill = filled?.average_fill_price ?? 0;
      // Buy-side slippage is positive (slipMultiplier = 1 + x/10000)
      expect(fill).toBeGreaterThanOrEqual(1000);
      // Upper bound: 100 bps = 1% → fill ≤ 1010
      expect(fill).toBeLessThanOrEqual(1010);
    });
  });

  describe("cancelMockOrder", () => {
    it("transitions pending → cancelled", () => {
      const order = placeMockOrder(baseParams());
      const cancelled = cancelMockOrder(order.id);
      expect(cancelled?.status).toBe("cancelled");
    });

    it("returns null for unknown order id", () => {
      expect(cancelMockOrder("does-not-exist")).toBeNull();
    });
  });

  describe("amendMockOrder", () => {
    it("updates quantity and price while preserving other fields", () => {
      const order = placeMockOrder(baseParams({ quantity: 5, price: 100 }));
      const amended = amendMockOrder(order.id, { quantity: 8, price: 105 });
      expect(amended?.quantity).toBe(8);
      expect(amended?.price).toBe(105);
      expect(amended?.instrument_id).toBe(order.instrument_id);
    });

    it("returns null for unknown order id", () => {
      expect(amendMockOrder("nope", { quantity: 1 })).toBeNull();
    });
  });

  describe("resetMockOrders", () => {
    it("restores the default seed orders", () => {
      const order = placeMockOrder(baseParams({ instruction_type: "LEND" }));
      expect(getOrders().some((o) => o.id === order.id)).toBe(true);

      resetMockOrders();
      expect(getOrders().some((o) => o.id === order.id)).toBe(false);
      // Default fixture seeds at least a handful of historical rows.
      expect(getOrders().length).toBeGreaterThan(0);
    });
  });

  describe("query helpers", () => {
    it("getOrdersByStatus filters by the given status", () => {
      placeMockOrder(baseParams({ instruction_type: "LEND" }));
      // One new pending order + any pending seeds. Filter should find ≥ 1.
      expect(getOrdersByStatus("pending").length).toBeGreaterThan(0);
    });

    it("getFilledDefiOrders returns only filled DeFi orders (optionally filtered by strategy)", () => {
      const order = placeMockOrder(
        baseParams({ strategy_id: "YIELD_ROTATION_LENDING@test", instruction_type: "LEND" }),
      );
      vi.advanceTimersByTime(250);

      const all = getFilledDefiOrders();
      expect(all.every((o) => o.asset_class === "DeFi" && o.status === "filled")).toBe(true);
      expect(all.some((o) => o.id === order.id)).toBe(true);

      const scoped = getFilledDefiOrders("YIELD_ROTATION_LENDING@test");
      expect(scoped.every((o) => o.strategy_id === "YIELD_ROTATION_LENDING@test")).toBe(true);
      expect(scoped.some((o) => o.id === order.id)).toBe(true);
    });

    it("computeDefiLedgerPnL returns the documented shape", () => {
      const pnl = computeDefiLedgerPnL();
      expect(pnl).toHaveProperty("totalGasCost");
      expect(pnl).toHaveProperty("totalSlippage");
      expect(pnl).toHaveProperty("totalNetCost");
      expect(pnl).toHaveProperty("byStrategy");
      expect(typeof pnl.byStrategy).toBe("object");
    });
  });
});
