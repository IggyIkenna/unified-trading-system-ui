/**
 * L1.5 widget harness — order-book-widget.
 *
 * Pattern: unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 * Plan:    unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Render with mocked terminal data-context.
 * - Loading, error, empty-state branches (L0.6/0.7/0.8).
 * - Bid/ask price rows rendered from context.
 * - "Last:" price indicator.
 * - Spread/spreadBps not tested directly (embedded in OrderBook child component
 *   that uses hideTitle mode — spread row only appears when hideTitle=false).
 *
 * Out of scope:
 * - Chart/SVG internals (skip per rules)
 * - Visual regression (L4 — deferred)
 * - OrderBook decimal selector interaction (child component internals)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockTerminalData } from "../_helpers/mock-terminal-context";

const mockData = buildMockTerminalData();

vi.mock("@/components/widgets/terminal/terminal-data-context", () => ({
  useTerminalData: () => mockData,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { OrderBookWidget } from "@/components/widgets/terminal/order-book-widget";

describe("order-book — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockTerminalData());
  });

  describe("render", () => {
    it("renders bid prices from mocked context", () => {
      render(<OrderBookWidget />);
      // Default bids: 63440, 63430, 63420 — formatted to 2 decimals
      expect(screen.getByText("63,440.00")).toBeTruthy();
    });

    it("renders ask prices from mocked context", () => {
      render(<OrderBookWidget />);
      // Default asks: 63460, 63470, 63480
      expect(screen.getByText("63,460.00")).toBeTruthy();
    });

    it("renders Bid Price column header", () => {
      render(<OrderBookWidget />);
      expect(screen.getByText("Bid Price")).toBeTruthy();
    });

    it("renders Ask Price column header", () => {
      render(<OrderBookWidget />);
      expect(screen.getByText("Ask Price")).toBeTruthy();
    });

    it("renders last price indicator", () => {
      render(<OrderBookWidget />);
      expect(screen.getByText(/Last:/)).toBeTruthy();
    });
  });

  describe("states", () => {
    it("shows loading state", () => {
      Object.assign(mockData, buildMockTerminalData({ isLoading: true }));
      render(<OrderBookWidget />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });

    it("shows error state with message", () => {
      Object.assign(mockData, buildMockTerminalData({ error: "Order book unavailable" }));
      render(<OrderBookWidget />);
      expect(screen.getByText(/order book unavailable/i)).toBeTruthy();
    });

    it("shows empty state when bids and asks are both empty", () => {
      Object.assign(mockData, buildMockTerminalData({ bids: [], asks: [] }));
      render(<OrderBookWidget />);
      expect(screen.getByText(/no order book data/i)).toBeTruthy();
    });
  });

  describe("data integrity", () => {
    it("renders custom bid levels when overridden", () => {
      Object.assign(
        mockData,
        buildMockTerminalData({
          bids: [{ price: 50000, size: 1.0, total: 1.0 }],
          asks: [{ price: 50100, size: 0.5, total: 0.5 }],
        }),
      );
      render(<OrderBookWidget />);
      expect(screen.getByText("50,000.00")).toBeTruthy();
      expect(screen.getByText("50,100.00")).toBeTruthy();
    });

    it("renders multiple bid rows", () => {
      render(<OrderBookWidget />);
      const bidPrices = ["63,440.00", "63,430.00", "63,420.00"];
      for (const price of bidPrices) {
        expect(screen.getByText(price)).toBeTruthy();
      }
    });
  });
});
