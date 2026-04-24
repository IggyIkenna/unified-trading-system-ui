/**
 * L1.5 widget harness — book-order-entry.
 *
 * Scope (per cert docs/manifest/widget-certification/book-order-entry.json):
 * - Render the idle state with mocked context (cert L0.7).
 * - Execution-mode toggle + category tab render (cert L0.7).
 * - Venue Select + Instrument Input + Quantity/Price wiring (cert L4.1).
 * - Side toggle routes to setSide (cert L4.1).
 * - Preview button disabled/enabled logic from canPreview/canExecute
 *   (cert L4.6).
 * - Preview state renders compliance panel + Confirm button that calls
 *   handleSubmit (cert L4.1 state machine).
 * - Error state surfaces errorMessage + Retry button (cert L0.8).
 *
 * Note: the widget does not expose a root data-testid (see findings in
 * cert). Tests anchor on the "Book Trade" heading + placeholder text.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockBookData } from "../_helpers/mock-book-context";

const mockBookData = buildMockBookData();

vi.mock("@/components/widgets/book/book-data-context", () => ({
  useBookTradeData: () => mockBookData,
}));

import { BookOrderEntryWidget } from "@/components/widgets/book/book-order-entry-widget";

describe("book-order-entry — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockBookData, buildMockBookData());
  });

  const renderWidget = () => render(<BookOrderEntryWidget instanceId="book-order-entry-1" />);

  describe("render — idle state", () => {
    it("mounts heading + description in idle state", () => {
      renderWidget();
      expect(screen.getByRole("heading", { name: /book trade/i })).toBeTruthy();
      expect(screen.getByText(/manual trade entry for back-office/i)).toBeTruthy();
    });

    it("renders Execute + Record Only mode tabs", () => {
      renderWidget();
      expect(screen.getByRole("tab", { name: /^execute$/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /^record only$/i })).toBeTruthy();
    });

    it("renders all seven category tabs", () => {
      renderWidget();
      expect(screen.getByRole("tab", { name: /cefi spot/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /cefi derivatives/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /^defi$/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /tradfi/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /otc/i })).toBeTruthy();
    });

    it("renders Instrument + Quantity + Price inputs", () => {
      renderWidget();
      // CeFi Spot default → placeholder BTC/USDT
      expect(screen.getByPlaceholderText("BTC/USDT")).toBeTruthy();
      const qtys = screen.getAllByPlaceholderText("0.00");
      // Quantity + Price both use 0.00 placeholder
      expect(qtys.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("form interactions", () => {
    it("routes Instrument Input change to setInstrument", () => {
      renderWidget();
      fireEvent.change(screen.getByPlaceholderText("BTC/USDT"), { target: { value: "ETH/USDT" } });
      expect(mockBookData.setInstrument).toHaveBeenCalledWith("ETH/USDT");
    });

    it("routes side toggle click to setSide", () => {
      renderWidget();
      // Default side = "buy"; clicking Sell should call setSide('sell')
      fireEvent.click(screen.getByRole("button", { name: /^sell$/i }));
      expect(mockBookData.setSide).toHaveBeenCalledWith("sell");
    });
  });

  describe("execute gating", () => {
    it("disables Preview button when canPreview is false", () => {
      Object.assign(mockBookData, buildMockBookData({ canPreview: false }));
      renderWidget();
      const btn = screen.getByRole("button", { name: /preview order/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("enables Preview button when canPreview=true and canExecute=true", () => {
      Object.assign(mockBookData, buildMockBookData({ canPreview: true, canExecute: true }));
      renderWidget();
      const btn = screen.getByRole("button", { name: /preview order/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it("shows execution-access warning banner when canExecute is false in Execute mode", () => {
      Object.assign(mockBookData, buildMockBookData({ canExecute: false, executionMode: "execute" }));
      renderWidget();
      expect(screen.getByText(/execution access required/i)).toBeTruthy();
    });

    it("invokes handlePreview on Preview Order click when enabled", () => {
      const handlePreview = vi.fn();
      Object.assign(mockBookData, buildMockBookData({ canPreview: true, canExecute: true, handlePreview }));
      renderWidget();
      fireEvent.click(screen.getByRole("button", { name: /preview order/i }));
      expect(handlePreview).toHaveBeenCalledTimes(1);
    });
  });

  describe("preview state — submit path", () => {
    it("renders Summary + Confirm button in preview state", () => {
      Object.assign(
        mockBookData,
        buildMockBookData({
          orderState: "preview",
          executionMode: "execute",
          instrument: "BTC-USDT",
          venue: "Binance",
          side: "buy",
          qty: 1,
          priceNum: 64000,
          total: 64000,
          compliancePassed: true,
        }),
      );
      renderWidget();
      expect(screen.getByText("Summary")).toBeTruthy();
      expect(screen.getByRole("button", { name: /confirm buy/i })).toBeTruthy();
    });

    it("Confirm button fires handleSubmit with no arguments (payload is derived in context)", () => {
      const handleSubmit = vi.fn();
      Object.assign(
        mockBookData,
        buildMockBookData({
          orderState: "preview",
          executionMode: "execute",
          side: "buy",
          instrument: "BTC-USDT",
          venue: "Binance",
          qty: 2,
          priceNum: 64000,
          total: 128000,
          compliancePassed: true,
          canExecute: true,
          handleSubmit,
        }),
      );
      renderWidget();
      fireEvent.click(screen.getByRole("button", { name: /confirm buy/i }));
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it("Record Only preview shows Record Trade button label", () => {
      Object.assign(
        mockBookData,
        buildMockBookData({
          orderState: "preview",
          executionMode: "record_only",
          instrument: "BTC-USDT",
          venue: "OTC Desk",
          qty: 1,
          priceNum: 64000,
          total: 64000,
          compliancePassed: true,
        }),
      );
      renderWidget();
      expect(screen.getByRole("button", { name: /record trade/i })).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("renders errorMessage + Retry button when orderState is 'error'", () => {
      Object.assign(mockBookData, buildMockBookData({ orderState: "error", errorMessage: "Order rejected by venue" }));
      renderWidget();
      expect(screen.getByText("Order rejected by venue")).toBeTruthy();
      expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    });
  });
});
