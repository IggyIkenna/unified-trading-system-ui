/**
 * L1.5 widget harness — markets-order-flow-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Loading state renders spinner (via TableWidget → LiveFeedWidget).
 * - Error state renders error message + Retry button.
 * - Empty state shows "No order flow data yet".
 * - With rows: table column headers visible (Exch Time, Type, Side, Price, Venue).
 * - Asset class badge in toolbar (Crypto / TradFi / DeFi).
 * - Order count shown in toolbar.
 * - Side BUY/SELL rendered per row.
 * - Venue name rendered per row.
 *
 * Out of scope:
 * - useLiveFeed ring-buffer capping internals (L3b).
 * - Visual regression (L4 — deferred).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockMarketsData, buildMockOrderFlowEntry } from "../_helpers/mock-markets-context";

const mockMarketsData = buildMockMarketsData();

vi.mock("@/components/widgets/markets/markets-data-context", () => ({
  useMarketsData: () => mockMarketsData,
}));

import { MarketsOrderFlowWidget } from "@/components/widgets/markets/markets-order-flow-widget";

describe("markets-order-flow-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockMarketsData, buildMockMarketsData());
  });

  describe("loading state", () => {
    it("shows Loading spinner when isLoading is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isLoading: true, orderFlowData: [] }));
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message when isError is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true, orderFlowData: [] }));
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load order flow/i)).toBeTruthy();
    });

    it("shows Retry button on error", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true, orderFlowData: [] }));
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows empty message when orderFlowData is empty", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ orderFlowData: [] }));
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByText(/No order flow data yet/i)).toBeTruthy();
    });
  });

  describe("populated state", () => {
    it("renders column headers: Exch Time, Type, Side, Venue", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ orderFlowData: [buildMockOrderFlowEntry()] }));
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByText("Exch Time")).toBeTruthy();
      expect(screen.getByText("Type")).toBeTruthy();
      expect(screen.getByText("Side")).toBeTruthy();
      expect(screen.getByText("Venue")).toBeTruthy();
    });

    it("shows 'Crypto' badge in toolbar when assetClass is crypto", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({ assetClass: "crypto", orderFlowData: [buildMockOrderFlowEntry()] }),
      );
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByText("Crypto")).toBeTruthy();
    });

    it("shows 'DeFi' badge in toolbar when assetClass is defi", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({ assetClass: "defi", orderFlowData: [buildMockOrderFlowEntry()] }),
      );
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByText("DeFi")).toBeTruthy();
    });

    it("shows order count in toolbar", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({ orderFlowData: [buildMockOrderFlowEntry(), buildMockOrderFlowEntry({ id: "ofid-2" })] }),
      );
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByText(/2 orders/i)).toBeTruthy();
    });

    it("renders BUY for a buy-side order", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({ orderFlowData: [buildMockOrderFlowEntry({ side: "buy" })] }),
      );
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByText("BUY")).toBeTruthy();
    });

    it("renders venue name per row", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({ orderFlowData: [buildMockOrderFlowEntry({ venue: "Coinbase" })] }),
      );
      render(<MarketsOrderFlowWidget instanceId="markets-order-flow" layoutMode="grid" />);
      expect(screen.getByText("Coinbase")).toBeTruthy();
    });
  });
});
