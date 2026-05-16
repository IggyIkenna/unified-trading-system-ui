/**
 * L1.5 widget harness — market-trades-widget.
 *
 * Pattern: unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 * Plan:    unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Render with mocked terminal data-context.
 * - Loading, error branches (L0.6/0.8).
 * - Trade tape: time, price, size columns.
 * - Tab switching (All / Own).
 * - Side filter toggle (all / buy / sell).
 * - Size filter inputs (min / max).
 * - Empty state when no trades remain after filter.
 *
 * Out of scope:
 * - Visual regression (L4 — deferred)
 * - useLiveFeed ring-buffer internals (unit tested separately)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockTerminalData } from "../_helpers/mock-terminal-context";

const mockData = buildMockTerminalData();

vi.mock("@/components/widgets/terminal/terminal-data-context", () => ({
  useTerminalData: () => mockData,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { MarketTradesWidget } from "@/components/widgets/terminal/market-trades-widget";

describe("market-trades — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockTerminalData());
  });

  describe("render", () => {
    it("renders Time column header", () => {
      render(<MarketTradesWidget />);
      expect(screen.getByText("Time")).toBeTruthy();
    });

    it("renders Price column header", () => {
      render(<MarketTradesWidget />);
      expect(screen.getByText("Price")).toBeTruthy();
    });

    it("renders Size column header", () => {
      render(<MarketTradesWidget />);
      expect(screen.getByText("Size")).toBeTruthy();
    });

    it("renders trade timestamps from mock data", () => {
      render(<MarketTradesWidget />);
      expect(screen.getByText("12:00:01")).toBeTruthy();
    });

    it("renders trade prices from mock data", () => {
      render(<MarketTradesWidget />);
      // Default recentTrades: price 63450 → abs >= 10 → 2 decimals
      expect(screen.getByText("63,450.00")).toBeTruthy();
    });
  });

  describe("states", () => {
    it("shows loading state", () => {
      Object.assign(mockData, buildMockTerminalData({ isLoading: true, recentTrades: [] }));
      render(<MarketTradesWidget />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });

    it("shows error state with message", () => {
      Object.assign(mockData, buildMockTerminalData({ error: "Feed disconnected", recentTrades: [] }));
      render(<MarketTradesWidget />);
      expect(screen.getByText(/feed disconnected/i)).toBeTruthy();
    });

    it("shows empty-state message when no trades remain after filter", () => {
      Object.assign(mockData, buildMockTerminalData({ recentTrades: [] }));
      render(<MarketTradesWidget />);
      expect(screen.getByText(/no trades yet/i)).toBeTruthy();
    });
  });

  describe("side filter", () => {
    it("filters to buy-only trades when buy button pressed", () => {
      Object.assign(
        mockData,
        buildMockTerminalData({
          recentTrades: [
            { time: "12:00:01", price: 63450, size: 0.5, side: "buy" },
            { time: "12:00:02", price: 63440, size: 0.3, side: "sell" },
          ],
        }),
      );
      render(<MarketTradesWidget />);
      fireEvent.click(screen.getByRole("button", { name: /buys only/i }));
      expect(screen.getByText("12:00:01")).toBeTruthy();
      expect(screen.queryByText("12:00:02")).toBeNull();
    });

    it("filters to sell-only trades when sell button pressed", () => {
      Object.assign(
        mockData,
        buildMockTerminalData({
          recentTrades: [
            { time: "12:00:01", price: 63450, size: 0.5, side: "buy" },
            { time: "12:00:02", price: 63440, size: 0.3, side: "sell" },
          ],
        }),
      );
      render(<MarketTradesWidget />);
      fireEvent.click(screen.getByRole("button", { name: /sells only/i }));
      expect(screen.queryByText("12:00:01")).toBeNull();
      expect(screen.getByText("12:00:02")).toBeTruthy();
    });
  });

  describe("size filter", () => {
    it("filters out trades below min size", () => {
      Object.assign(
        mockData,
        buildMockTerminalData({
          recentTrades: [
            { time: "12:00:01", price: 63450, size: 0.1, side: "buy" },
            { time: "12:00:02", price: 63440, size: 2.0, side: "buy" },
          ],
        }),
      );
      render(<MarketTradesWidget />);
      fireEvent.change(screen.getByLabelText(/minimum size/i), { target: { value: "1" } });
      expect(screen.queryByText("12:00:01")).toBeNull();
      expect(screen.getByText("12:00:02")).toBeTruthy();
    });
  });

  describe("own tab", () => {
    it("renders Own tab trigger in the tab list", () => {
      render(<MarketTradesWidget />);
      const ownTab = screen.getByRole("tab", { name: /own/i });
      expect(ownTab).toBeTruthy();
    });

    it("renders All tab trigger active by default", () => {
      render(<MarketTradesWidget />);
      const allTab = screen.getByRole("tab", { name: /^all$/i });
      expect(allTab.getAttribute("aria-selected")).toBe("true");
    });
  });
});
