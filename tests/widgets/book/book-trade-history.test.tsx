/**
 * L1.5 widget harness — book-trade-history.
 *
 * Scope (per cert docs/manifest/widget-certification/book-trade-history.json):
 * - Render with mocked trades; testid on TableWidget (cert L0.7).
 * - Empty state when trades list is empty (cert L0.7).
 * - Instrument / venue rendering for provided rows.
 * - Search filter narrows the rendered rows (cert L4.1 / L4.4).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { buildMockBookData, buildMockBookTrade } from "../_helpers/mock-book-context";

const mockBookData = buildMockBookData();

vi.mock("@/components/widgets/book/book-data-context", () => ({
  useBookTradeData: () => mockBookData,
}));

import { BookTradeHistoryWidget } from "@/components/widgets/book/book-trade-history-widget";

describe("book-trade-history — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(
      mockBookData,
      buildMockBookData({
        trades: [
          buildMockBookTrade({ id: "t-1", instrument: "BTC-USDT", venue: "Binance", side: "buy" }),
          buildMockBookTrade({
            id: "t-2",
            instrument: "ETH-USDT",
            venue: "Coinbase",
            side: "sell",
            tradeType: "OTC",
          }),
          buildMockBookTrade({
            id: "t-3",
            instrument: "SOL-USDT",
            venue: "Hyperliquid",
            side: "buy",
            tradeType: "DeFi",
            status: "settled",
          }),
        ],
      }),
    );
  });

  const renderWidget = () => render(<BookTradeHistoryWidget instanceId="book-trade-history-1" />);

  describe("render", () => {
    it("mounts TableWidget testid with trades present", () => {
      renderWidget();
      expect(screen.getByTestId("book-trade-history-widget")).toBeTruthy();
    });

    it("renders a row for each trade in the mock context", () => {
      renderWidget();
      const root = screen.getByTestId("book-trade-history-widget");
      expect(within(root).getByText("BTC-USDT")).toBeTruthy();
      expect(within(root).getByText("ETH-USDT")).toBeTruthy();
      expect(within(root).getByText("SOL-USDT")).toBeTruthy();
    });

    it("renders empty-search message when trades list is empty", () => {
      Object.assign(mockBookData, buildMockBookData({ trades: [] }));
      renderWidget();
      expect(screen.getByText(/no trades match your search/i)).toBeTruthy();
    });

    it("surfaces tradeType badge value per row", () => {
      renderWidget();
      const root = screen.getByTestId("book-trade-history-widget");
      expect(within(root).getByText("Exchange")).toBeTruthy();
      expect(within(root).getByText("OTC")).toBeTruthy();
      expect(within(root).getByText("DeFi")).toBeTruthy();
    });
  });

  describe("search filter", () => {
    it("narrows rows to the instrument matching the query", () => {
      renderWidget();
      const search = screen.getByPlaceholderText(/search trades/i);
      fireEvent.change(search, { target: { value: "BTC" } });
      const root = screen.getByTestId("book-trade-history-widget");
      expect(within(root).getByText("BTC-USDT")).toBeTruthy();
      expect(within(root).queryByText("ETH-USDT")).toBeNull();
      expect(within(root).queryByText("SOL-USDT")).toBeNull();
    });

    it("matches by venue case-insensitively", () => {
      renderWidget();
      fireEvent.change(screen.getByPlaceholderText(/search trades/i), { target: { value: "hyperliquid" } });
      const root = screen.getByTestId("book-trade-history-widget");
      expect(within(root).getByText("SOL-USDT")).toBeTruthy();
      expect(within(root).queryByText("BTC-USDT")).toBeNull();
    });

    it("shows empty-search message when query has no matches", () => {
      renderWidget();
      fireEvent.change(screen.getByPlaceholderText(/search trades/i), { target: { value: "zzz-nomatch" } });
      expect(screen.getByText(/no trades match your search/i)).toBeTruthy();
    });
  });
});
