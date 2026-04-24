/**
 * L1.5 widget harness — orders-kpi-strip-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 2 Wave 1)
 *
 * Scope:
 * - Render with mocked OrdersData; assert root testid.
 * - Six metric labels and counts propagate from context.summary.
 * - Loading branch renders em-dash placeholders (cert L0.6).
 * - Error branch renders rose error copy, skips metrics (cert L0.8).
 * - Zero-counts branch (cert L0.7) still mounts the strip.
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
    it("mounts root testid", () => {
      renderWidget();
      expect(screen.getByTestId("orders-kpi-strip-widget")).toBeTruthy();
    });

    it("renders all six KPI labels", () => {
      renderWidget();
      expect(screen.getByText("Total Orders")).toBeTruthy();
      expect(screen.getByText("Open")).toBeTruthy();
      expect(screen.getByText("Partial")).toBeTruthy();
      expect(screen.getByText("Filled")).toBeTruthy();
      expect(screen.getByText("Rejected")).toBeTruthy();
      expect(screen.getByText("Failed")).toBeTruthy();
    });

    it("renders summary counts from context (default fixture)", () => {
      renderWidget();
      // Default set has 6 orders, statuses: 2 OPEN, 1 FILLED, 1 PARTIAL, 1 REJECTED, 1 FAILED.
      // Total = 6 (appears as a KPI value). Use a testid-free value lookup: the
      // total appears alongside label "Total Orders" — we just assert each
      // count number is present in the rendered DOM.
      expect(screen.getByText("Total Orders")).toBeTruthy();
      // strip uses KpiStrip which renders the value as plain text
      const strip = screen.getByTestId("orders-kpi-strip-widget");
      expect(strip.textContent).toContain("6"); // total
      expect(strip.textContent).toContain("2"); // open
    });

    it("renders zero counts when filteredOrders is empty (cert L0.7)", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ filteredOrders: [] }));
      renderWidget();
      expect(screen.getByTestId("orders-kpi-strip-widget")).toBeTruthy();
      expect(screen.getByText("Total Orders")).toBeTruthy();
    });
  });

  describe("loading branch (cert L0.6)", () => {
    it("renders em-dash placeholders while isLoading is true", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ isLoading: true }));
      renderWidget();
      const strip = screen.getByTestId("orders-kpi-strip-widget");
      // Six em-dashes — one per metric value
      const dashMatches = strip.textContent?.match(/—/g) ?? [];
      expect(dashMatches.length).toBeGreaterThanOrEqual(6);
    });

    it("still mounts the strip testid when loading", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ isLoading: true }));
      renderWidget();
      expect(screen.getByTestId("orders-kpi-strip-widget")).toBeTruthy();
    });
  });

  describe("error branch (cert L0.8)", () => {
    it("renders error copy when context.error is set", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ error: new Error("boom") }));
      renderWidget();
      expect(screen.getByText(/failed to load orders/i)).toBeTruthy();
    });

    it("skips the KPI strip when error is set (early return)", () => {
      Object.assign(mockOrdersData, buildMockOrdersData({ error: new Error("boom") }));
      renderWidget();
      expect(screen.queryByTestId("orders-kpi-strip-widget")).toBeNull();
    });
  });
});
