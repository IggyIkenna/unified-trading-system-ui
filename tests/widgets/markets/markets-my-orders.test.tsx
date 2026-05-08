/**
 * L1.5 widget harness — markets-my-orders-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Loading state renders spinner (via TableWidget → LiveFeedWidget).
 * - Error state renders error message + Retry button.
 * - Empty state shows "No own orders" message.
 * - With rows: table column headers visible (Order ID, Exch Time, Side, Venue).
 * - A trade-type row shows "Fill" badge.
 * - Buy/sell side rows show BUY/SELL.
 * - Venue name rendered per row.
 *
 * Out of scope:
 * - Column sorting click interactions (L4).
 * - Visual regression (L4 — deferred).
 */
import type { OrderFlowEntry } from "@/lib/types/markets";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockMarketsData, buildMockOrderFlowEntry } from "../_helpers/mock-markets-context";

const mockMarketsData = buildMockMarketsData();

vi.mock("@/components/widgets/markets/markets-data-context", () => ({
  useMarketsData: () => mockMarketsData,
}));

import { MarketsMyOrdersWidget } from "@/components/widgets/markets/markets-my-orders-widget";

/** Helper: own order with isOwn=true. */
function buildOwnOrder(overrides: Partial<OrderFlowEntry> = {}): OrderFlowEntry {
  return buildMockOrderFlowEntry({ isOwn: true, ...overrides });
}

describe("markets-my-orders-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockMarketsData, buildMockMarketsData());
    // reset ownOrders to empty between tests
    mockMarketsData.ownOrders = [];
  });

  describe("loading state", () => {
    it("shows Loading spinner when isLoading is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isLoading: true }));
      mockMarketsData.ownOrders = [];
      render(<MarketsMyOrdersWidget instanceId="markets-my-orders" layoutMode="grid" />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message when isError is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true }));
      render(<MarketsMyOrdersWidget instanceId="markets-my-orders" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load orders/i)).toBeTruthy();
    });

    it("shows Retry button on error", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true }));
      render(<MarketsMyOrdersWidget instanceId="markets-my-orders" layoutMode="grid" />);
      expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows empty message when ownOrders is empty", () => {
      mockMarketsData.ownOrders = [];
      render(<MarketsMyOrdersWidget instanceId="markets-my-orders" layoutMode="grid" />);
      expect(screen.getByText(/No own orders in the generated range/i)).toBeTruthy();
    });
  });

  describe("populated state", () => {
    it("renders column headers: Order ID, Exch Time, Side, Venue", () => {
      mockMarketsData.ownOrders = [buildOwnOrder()];
      render(<MarketsMyOrdersWidget instanceId="markets-my-orders" layoutMode="grid" />);
      expect(screen.getByText("Order ID")).toBeTruthy();
      expect(screen.getByText("Exch Time")).toBeTruthy();
      expect(screen.getByText("Side")).toBeTruthy();
      expect(screen.getByText("Venue")).toBeTruthy();
    });

    it("renders 'Fill' badge for a trade-type own order", () => {
      mockMarketsData.ownOrders = [buildOwnOrder({ type: "trade" })];
      render(<MarketsMyOrdersWidget instanceId="markets-my-orders" layoutMode="grid" />);
      expect(screen.getByText("Fill")).toBeTruthy();
    });

    it("renders 'BUY' for a buy-side own order", () => {
      mockMarketsData.ownOrders = [buildOwnOrder({ side: "buy" })];
      render(<MarketsMyOrdersWidget instanceId="markets-my-orders" layoutMode="grid" />);
      expect(screen.getByText("BUY")).toBeTruthy();
    });

    it("renders 'SELL' for a sell-side own order", () => {
      mockMarketsData.ownOrders = [buildOwnOrder({ side: "sell" })];
      render(<MarketsMyOrdersWidget instanceId="markets-my-orders" layoutMode="grid" />);
      expect(screen.getByText("SELL")).toBeTruthy();
    });

    it("renders venue name in a populated row", () => {
      mockMarketsData.ownOrders = [buildOwnOrder({ venue: "Binance" })];
      render(<MarketsMyOrdersWidget instanceId="markets-my-orders" layoutMode="grid" />);
      expect(screen.getByText("Binance")).toBeTruthy();
    });
  });
});
