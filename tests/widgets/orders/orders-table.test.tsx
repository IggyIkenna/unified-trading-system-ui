/**
 * L1.5 widget harness — orders-table-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 2 Wave 1)
 *
 * Scope:
 * - Render with mocked OrdersData; rows render from filteredOrders.
 * - Search input propagates to setSearchQuery (cert L4.1).
 * - Reset button calls resetFilters.
 * - Refresh button calls refetch.
 * - Cancel button on OPEN rows invokes cancelOrder(orderId) (cert L4.1).
 * - Amend button on OPEN rows invokes openAmendDialog(order) (cert L4.1).
 * - Non-actionable statuses (FILLED) hide cancel/amend actions.
 * - Loading branch renders spinner + "Loading…" copy (cert L0.6).
 * - Empty branch renders emptyMessage (cert L0.7).
 * - Error branch renders error copy + Retry button (cert L0.8).
 *
 * Query strategy: we assert against visible cell text, roles, and placeholder
 * copy rather than the TableWidget `data-testid` prop, so the spec stays
 * stable whether or not that attribute is present on the widget.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { buildMockOrdersData, buildMockOrder } from "../_helpers/mock-orders-context";

const mockOrdersData = buildMockOrdersData();

vi.mock("@/components/widgets/orders/orders-data-context", () => ({
  useOrdersData: () => mockOrdersData,
  classifyInstrument: (instrument: string) => {
    const upper = instrument.toUpperCase();
    if (upper.includes("PERP")) return "Perp" as const;
    if (upper.includes("AAVE") || upper.includes("UNISWAP")) return "DeFi" as const;
    return "Spot" as const;
  },
  ASSET_CLASS_OPTIONS: ["Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"],
}));

import { OrdersTableWidget } from "@/components/widgets/orders/orders-table-widget";

function renderWidget() {
  return render(<OrdersTableWidget instanceId="test-orders-table" />);
}

describe("orders-table — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockOrdersData, buildMockOrdersData());
  });

  describe("render", () => {
    it("renders the search input with the expected placeholder", () => {
      renderWidget();
      expect(screen.getByPlaceholderText(/search orders/i)).toBeTruthy();
    });

    it("renders rows for filteredOrders from context", () => {
      renderWidget();
      expect(screen.getByText("ORD-OPEN-1")).toBeTruthy();
      expect(screen.getByText("ORD-FILLED-1")).toBeTruthy();
    });
  });

  describe("filter interactions", () => {
    it("calls setSearchQuery when typing in the search input", () => {
      const setSearchQuery = vi.fn();
      Object.assign(mockOrdersData, buildMockOrdersData({ setSearchQuery }));
      renderWidget();
      const input = screen.getByPlaceholderText(/search orders/i);
      fireEvent.change(input, { target: { value: "BTC" } });
      expect(setSearchQuery).toHaveBeenCalledWith("BTC");
    });

    it("calls resetFilters when Reset button is clicked", () => {
      const resetFilters = vi.fn();
      // Force activeFilterCount > 0 so Reset button renders
      Object.assign(mockOrdersData, buildMockOrdersData({ searchQuery: "BTC", resetFilters }));
      renderWidget();
      const resetBtn = screen.getByRole("button", { name: /reset/i });
      fireEvent.click(resetBtn);
      expect(resetFilters).toHaveBeenCalledTimes(1);
    });

    it("calls refetch when Refresh button is clicked", () => {
      const refetch = vi.fn();
      Object.assign(mockOrdersData, buildMockOrdersData({ refetch }));
      renderWidget();
      const refreshBtn = screen.getByRole("button", { name: /refresh/i });
      fireEvent.click(refreshBtn);
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("row actions (cert L4.1)", () => {
    it("renders Cancel + Amend buttons on OPEN status rows", () => {
      Object.assign(
        mockOrdersData,
        buildMockOrdersData({
          filteredOrders: [buildMockOrder({ order_id: "ORD-ACTIONABLE", status: "OPEN" })],
        }),
      );
      renderWidget();
      const row = screen.getByText("ORD-ACTIONABLE").closest("tr");
      expect(row).toBeTruthy();
      expect(within(row!).getByRole("button", { name: /cancel/i })).toBeTruthy();
      expect(within(row!).getByRole("button", { name: /amend/i })).toBeTruthy();
    });

    it("hides Cancel + Amend on non-actionable FILLED rows", () => {
      Object.assign(
        mockOrdersData,
        buildMockOrdersData({
          filteredOrders: [buildMockOrder({ order_id: "ORD-FILLED-ONLY", status: "FILLED" })],
        }),
      );
      renderWidget();
      const row = screen.getByText("ORD-FILLED-ONLY").closest("tr");
      expect(row).toBeTruthy();
      expect(within(row!).queryByRole("button", { name: /^cancel$/i })).toBeNull();
      expect(within(row!).queryByRole("button", { name: /^amend$/i })).toBeNull();
    });

    it("invokes cancelOrder(orderId) when Cancel is clicked", () => {
      const cancelOrder = vi.fn();
      Object.assign(
        mockOrdersData,
        buildMockOrdersData({
          filteredOrders: [buildMockOrder({ order_id: "ORD-CANCEL-ME", status: "OPEN" })],
          cancelOrder,
        }),
      );
      renderWidget();
      const row = screen.getByText("ORD-CANCEL-ME").closest("tr")!;
      fireEvent.click(within(row).getByRole("button", { name: /cancel/i }));
      expect(cancelOrder).toHaveBeenCalledWith("ORD-CANCEL-ME");
    });

    it("invokes openAmendDialog(order) when Amend is clicked", () => {
      const openAmendDialog = vi.fn();
      const order = buildMockOrder({ order_id: "ORD-AMEND-ME", status: "OPEN" });
      Object.assign(mockOrdersData, buildMockOrdersData({ filteredOrders: [order], openAmendDialog }));
      renderWidget();
      const row = screen.getByText("ORD-AMEND-ME").closest("tr")!;
      fireEvent.click(within(row).getByRole("button", { name: /amend/i }));
      expect(openAmendDialog).toHaveBeenCalledTimes(1);
      expect(openAmendDialog.mock.calls[0]![0]).toMatchObject({ order_id: "ORD-AMEND-ME" });
    });
  });

  describe("loading / empty / error branches", () => {
    it("renders loading state when isLoading is true (cert L0.6)", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ isLoading: true }));
      renderWidget();
      expect(screen.getByText(/loading…/i)).toBeTruthy();
    });

    it("renders emptyMessage when filteredOrders is empty (cert L0.7)", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ filteredOrders: [] }));
      renderWidget();
      expect(screen.getByText(/no orders match your filters/i)).toBeTruthy();
    });

    it("renders error copy + Retry button when context.error is set (cert L0.8)", () => {
      const refetch = vi.fn();
      Object.assign(mockOrdersData, buildMockOrdersData({ error: new Error("boom"), refetch }));
      renderWidget();
      expect(screen.getByText(/failed to load orders/i)).toBeTruthy();
      const retry = screen.getByRole("button", { name: /retry/i });
      fireEvent.click(retry);
      expect(refetch).toHaveBeenCalled();
    });
  });
});
