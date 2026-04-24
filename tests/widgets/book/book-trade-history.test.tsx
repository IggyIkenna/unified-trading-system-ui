/**
 * L1.5 widget harness — book-trade-history.
 *
 * Scope (per cert docs/manifest/widget-certification/book-trade-history.json):
 * - Render with mocked trades; anchor on the search input + row cells.
 * - Empty state when trades list is empty (cert L0.7).
 * - Instrument / venue rendering for provided rows.
 * - Search filter narrows the rendered rows (cert L4.1 / L4.4).
 *
 * Note: the widget no longer forwards data-testid to TableWidget
 * (see cert findings). Tests anchor on visible text instead.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    it("mounts the search input + table surface with trades present", () => {
      renderWidget();
      expect(screen.getByPlaceholderText(/search trades/i)).toBeTruthy();
    });

    it("renders instrument cells for each trade in the mock context", () => {
      renderWidget();
      expect(screen.getByText("BTC-USDT")).toBeTruthy();
      expect(screen.getByText("ETH-USDT")).toBeTruthy();
      expect(screen.getByText("SOL-USDT")).toBeTruthy();
    });

    it("renders empty-search message when trades list is empty", () => {
      Object.assign(mockBookData, buildMockBookData({ trades: [] }));
      renderWidget();
      expect(screen.getByText(/no trades match your search/i)).toBeTruthy();
    });

    it("surfaces tradeType badge value per row", () => {
      renderWidget();
      expect(screen.getByText("Exchange")).toBeTruthy();
      expect(screen.getByText("OTC")).toBeTruthy();
      expect(screen.getByText("DeFi")).toBeTruthy();
    });
  });

  describe("search filter", () => {
    it("narrows rows to the instrument matching the query", () => {
      renderWidget();
      const search = screen.getByPlaceholderText(/search trades/i);
      fireEvent.change(search, { target: { value: "BTC" } });
      expect(screen.getByText("BTC-USDT")).toBeTruthy();
      expect(screen.queryByText("ETH-USDT")).toBeNull();
      expect(screen.queryByText("SOL-USDT")).toBeNull();
    });

    it("matches by venue case-insensitively", () => {
      renderWidget();
      fireEvent.change(screen.getByPlaceholderText(/search trades/i), { target: { value: "hyperliquid" } });
      expect(screen.getByText("SOL-USDT")).toBeTruthy();
      expect(screen.queryByText("BTC-USDT")).toBeNull();
    });

    it("shows empty-search message when query has no matches", () => {
      renderWidget();
      fireEvent.change(screen.getByPlaceholderText(/search trades/i), { target: { value: "zzz-nomatch" } });
      expect(screen.getByText(/no trades match your search/i)).toBeTruthy();
    });
  });
});
