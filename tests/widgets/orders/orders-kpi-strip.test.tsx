/**
 * L1.5 widget harness — orders-kpi-strip-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 2 Wave 1)
 *
 * Scope:
 * - Render with mocked OrdersData; assert the six metric labels mount.
 * - Summary counts propagate from context to KPI values.
 * - Loading branch renders em-dash placeholders (cert L0.6).
 * - Error branch renders rose error copy, skips metrics (cert L0.8).
 * - Zero-counts branch (cert L0.7) still renders labels.
 *
 * Query strategy: we assert against the visible metric labels and values
 * rather than a `data-testid` on the outer wrapper, so the spec stays
 * stable whether or not the optional testid attribute is present on the
 * widget.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockOrdersData } from "../_helpers/mock-orders-context";

const mockOrdersData = buildMockOrdersData();

vi.mock("@/components/widgets/orders/orders-data-context", () => ({
  useOrdersData: () => mockOrdersData,
  classifyInstrument: (_: string) => "Spot" as const,
  ASSET_CLASS_OPTIONS: ["Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"],
}));

import { OrdersKpiStripWidget } from "@/components/widgets/orders/orders-kpi-strip-widget";

function renderWidget() {
  return render(<OrdersKpiStripWidget instanceId="test-orders-kpi" />);
}

describe("orders-kpi-strip — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockOrdersData, buildMockOrdersData());
  });

  describe("render", () => {
    it("renders all six KPI labels", () => {
      renderWidget();
      expect(screen.getByText("Total Orders")).toBeTruthy();
      expect(screen.getByText("Open")).toBeTruthy();
      expect(screen.getByText("Partial")).toBeTruthy();
      expect(screen.getByText("Filled")).toBeTruthy();
      expect(screen.getByText("Rejected")).toBeTruthy();
      expect(screen.getByText("Failed")).toBeTruthy();
    });

    it("renders summary total count from context (default fixture of 6)", () => {
      renderWidget();
      // Total Orders label and the total value both mount. Default set is 6 orders.
      const totalLabel = screen.getByText("Total Orders");
      // The tile for Total Orders contains both the label and value; walk up
      // to the tile container and assert "6" is present inside it.
      const tile = totalLabel.parentElement;
      expect(tile).toBeTruthy();
      expect(tile!.textContent).toContain("6");
    });

    it("still renders labels when filteredOrders is empty (cert L0.7)", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ filteredOrders: [] }));
      renderWidget();
      expect(screen.getByText("Total Orders")).toBeTruthy();
      expect(screen.getByText("Open")).toBeTruthy();
    });
  });

  describe("loading branch (cert L0.6)", () => {
    it("renders em-dash placeholder for each metric while isLoading is true", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ isLoading: true }));
      const { container } = renderWidget();
      // Six em-dashes — one per metric value
      const dashMatches = container.textContent?.match(/—/g) ?? [];
      expect(dashMatches.length).toBeGreaterThanOrEqual(6);
    });

    it("still renders all six labels while isLoading is true", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ isLoading: true }));
      renderWidget();
      expect(screen.getByText("Total Orders")).toBeTruthy();
      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });

  describe("error branch (cert L0.8)", () => {
    it("renders error copy when context.error is set", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ error: new Error("boom") }));
      renderWidget();
      expect(screen.getByText(/failed to load orders/i)).toBeTruthy();
    });

    it("hides the KPI labels when error is set (early return)", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ error: new Error("boom") }));
      renderWidget();
      expect(screen.queryByText("Total Orders")).toBeNull();
      expect(screen.queryByText("Filled")).toBeNull();
    });
  });
});
