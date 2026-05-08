/**
 * L1.5 widget harness — order-entry-widget
 *
 * Pattern: unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 * Plan: unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5
 *
 * Scope:
 * - Render: form widget mounts, loading state, error state, batch-mode advisory.
 * - Side toggle: buy / sell triggers setOrderSide.
 * - Order type: limit shows price input, market hides it.
 * - Submit enable/disable: size=0, isContextComplete=false, isBatchMode=true all block.
 * - Submit enabled when size>0 + isContextComplete + !isBatchMode.
 * - handleSubmitOrder called on valid submit click.
 *
 * Out of scope: real route (L2), multi-widget flow (L3b), visual regression (L4).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockTerminalData } from "../_helpers/mock-terminal-context";

const mockData = buildMockTerminalData();

vi.mock("@/components/widgets/terminal/terminal-data-context", () => ({
  useTerminalData: () => mockData,
}));

vi.mock("@/lib/mocks/fixtures/strategy-instances", () => ({
  STRATEGIES: [
    { id: "strat-1", name: "Basis Trade", archetype: "BASIS_TRADE", executionMode: "HUF" },
    { id: "strat-2", name: "Yield Rotation", archetype: "YIELD", executionMode: "BATCH" },
  ],
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/shared/form-widget", () => ({
  FormWidget: ({ children }: { children: any }) => <div data-testid="form-widget">{children}</div>,
  useFormSubmit: () => ({
    isSubmitting: false,
    error: null,
    clearError: vi.fn(),
    handleSubmit: (fn: () => void) => fn(),
  }),
}));

import { OrderEntryWidget } from "@/components/widgets/terminal/order-entry-widget";

describe("order-entry — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockTerminalData());
  });

  describe("render", () => {
    it("mounts the form widget when context is loaded", () => {
      render(<OrderEntryWidget instanceId="oe-1" />);
      expect(screen.getByTestId("form-widget")).toBeTruthy();
    });

    it("shows loading spinner when isLoading is true", () => {
      Object.assign(mockData, buildMockTerminalData({ isLoading: true }));
      render(<OrderEntryWidget instanceId="oe-1" />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
      expect(screen.queryByTestId("form-widget")).toBeNull();
    });

    it("shows error text when context reports an error", () => {
      Object.assign(mockData, buildMockTerminalData({ error: "Connection failed" }));
      render(<OrderEntryWidget instanceId="oe-1" />);
      expect(screen.getByText("Connection failed")).toBeTruthy();
      expect(screen.queryByTestId("form-widget")).toBeNull();
    });

    it("displays the selected instrument symbol in the form", () => {
      render(<OrderEntryWidget instanceId="oe-1" />);
      // symbol appears in the "Instrument" label area and/or submit button
      const symbolEls = screen.getAllByText(/BTC-USDT/);
      expect(symbolEls.length).toBeGreaterThan(0);
    });
  });

  describe("buy/sell toggle", () => {
    it("defaults to Buy side — submit button shows Buy BTC-USDT", () => {
      render(<OrderEntryWidget instanceId="oe-1" />);
      const submitBtns = screen.getAllByRole("button", { name: /buy btc-usdt/i });
      expect(submitBtns.length).toBeGreaterThan(0);
    });

    it("clicking Sell calls setOrderSide('sell')", () => {
      const setOrderSide = vi.fn();
      Object.assign(mockData, buildMockTerminalData());
      mockData.setOrderSide = setOrderSide;
      render(<OrderEntryWidget instanceId="oe-1" />);
      const sellBtn = screen
        .getAllByRole("button")
        .find((b) => b.textContent?.match(/sell/i) && !b.textContent?.match(/btc-usdt/i));
      expect(sellBtn).toBeTruthy();
      fireEvent.click(sellBtn!);
      expect(setOrderSide).toHaveBeenCalledWith("sell");
    });
  });

  describe("order type", () => {
    it("shows price placeholder when order type is limit", () => {
      render(<OrderEntryWidget instanceId="oe-1" />);
      // limit mode: two number inputs rendered (price + size); use getAllBy and expect >=2
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it("hides price input when order type is market", () => {
      Object.assign(mockData, buildMockTerminalData());
      mockData.orderType = "market";
      render(<OrderEntryWidget instanceId="oe-1" />);
      // market mode: only size input with placeholder "0.00"
      const inputs = screen.getAllByRole("spinbutton");
      // Should only be the size input, not price
      expect(inputs.length).toBe(1);
    });
  });

  describe("submit enable/disable", () => {
    it("is disabled when orderSize is empty", () => {
      Object.assign(mockData, buildMockTerminalData());
      mockData.orderSize = "";
      mockData.isContextComplete = true;
      mockData.isBatchMode = false;
      render(<OrderEntryWidget instanceId="oe-1" />);
      const btn = screen.getByRole("button", { name: /buy btc-usdt/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("is disabled when isContextComplete is false", () => {
      Object.assign(mockData, buildMockTerminalData());
      mockData.orderSize = "1.0";
      mockData.isContextComplete = false;
      mockData.isBatchMode = false;
      render(<OrderEntryWidget instanceId="oe-1" />);
      const btn = screen.getByRole("button", { name: /buy btc-usdt/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("is disabled in batch mode and shows advisory message", () => {
      Object.assign(mockData, buildMockTerminalData());
      mockData.orderSize = "1.0";
      mockData.isContextComplete = true;
      mockData.isBatchMode = true;
      render(<OrderEntryWidget instanceId="oe-1" />);
      const btn = screen.getByRole("button", { name: /buy btc-usdt/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(screen.getByText(/disabled in batch mode/i)).toBeTruthy();
    });

    it("is enabled when size > 0, isContextComplete, !isBatchMode", () => {
      Object.assign(mockData, buildMockTerminalData());
      mockData.orderSize = "0.5";
      mockData.isContextComplete = true;
      mockData.isBatchMode = false;
      render(<OrderEntryWidget instanceId="oe-1" />);
      const btn = screen.getByRole("button", { name: /buy btc-usdt/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });
  });

  describe("submit payload", () => {
    it("calls handleSubmitOrder on valid submit click", () => {
      const handleSubmitOrder = vi.fn();
      Object.assign(mockData, buildMockTerminalData());
      mockData.orderSize = "0.5";
      mockData.orderSide = "buy";
      mockData.isContextComplete = true;
      mockData.isBatchMode = false;
      mockData.handleSubmitOrder = handleSubmitOrder;
      render(<OrderEntryWidget instanceId="oe-1" />);
      fireEvent.click(screen.getByRole("button", { name: /buy btc-usdt/i }));
      expect(handleSubmitOrder).toHaveBeenCalledTimes(1);
    });
  });
});
