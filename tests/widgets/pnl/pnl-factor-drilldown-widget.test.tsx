/**
 * L1.5 widget harness — pnl-factor-drilldown-widget.
 *
 * Two-state widget:
 *   - No selectedFactor → FactorSummaryTable listing all factors (sortable rows).
 *   - selectedFactor set → drilldown view with per-strategy horizontal bars
 *     and stacked Recharts Area chart.
 *
 * Recharts AreaChart renders SVG paths that happy-dom draws at 0x0 — we
 * assert on surrounding controls, factor rows, and text content only.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { buildMockFactorDrilldown, buildMockPnLData } from "../_helpers/mock-pnl-context";

const mockPnLData = buildMockPnLData();

vi.mock("@/components/widgets/pnl/pnl-data-context", () => ({
  usePnLData: () => mockPnLData,
}));

import { PnlFactorDrilldownWidget } from "@/components/widgets/pnl/pnl-factor-drilldown-widget";

function renderWidget() {
  return render(<PnlFactorDrilldownWidget instanceId="pnl-factor-drilldown-test" />);
}

describe("pnl-factor-drilldown-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockPnLData, buildMockPnLData());
  });

  describe("render — summary state (no factor selected)", () => {
    it("shows Factor Breakdown header", () => {
      renderWidget();
      expect(screen.getByText(/factor breakdown/i)).toBeTruthy();
    });

    it("renders a row per pnlComponent in the summary table", () => {
      renderWidget();
      for (const label of ["Funding", "Carry", "Basis", "Delta", "Slippage", "Fees"]) {
        expect(screen.getByText(label)).toBeTruthy();
      }
    });

    it("renders Net P&L footer row", () => {
      renderWidget();
      expect(screen.getByText(/net p&l/i)).toBeTruthy();
    });

    it("shows loading skeleton when isLoading is true", () => {
      Object.assign(mockPnLData, buildMockPnLData({ isLoading: true }));
      const { container } = renderWidget();
      // Header ("Factor Breakdown") is NOT rendered in loading branch.
      expect(screen.queryByText(/factor breakdown/i)).toBeNull();
      expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
    });
  });

  describe("summary table interactions", () => {
    it("calls setSelectedFactor with factor name when a row is clicked", () => {
      const setSelectedFactor = vi.fn();
      Object.assign(mockPnLData, buildMockPnLData({ setSelectedFactor }));
      renderWidget();
      // Each <tr> has role='button' + aria-label="Drill into {name} factor"
      fireEvent.click(screen.getByRole("button", { name: /drill into funding factor/i }));
      expect(setSelectedFactor).toHaveBeenCalledWith("Funding");
    });

    it("calls setSelectedFactor on Enter key for keyboard users", () => {
      const setSelectedFactor = vi.fn();
      Object.assign(mockPnLData, buildMockPnLData({ setSelectedFactor }));
      renderWidget();
      const row = screen.getByRole("button", { name: /drill into carry factor/i });
      fireEvent.keyDown(row, { key: "Enter" });
      expect(setSelectedFactor).toHaveBeenCalledWith("Carry");
    });
  });

  describe("render — drilldown state (factor selected)", () => {
    it("shows '<factor> — by strategy' header when selectedFactorData set", () => {
      Object.assign(
        mockPnLData,
        buildMockPnLData({
          selectedFactor: "Funding",
          selectedFactorData: buildMockFactorDrilldown(),
        }),
      );
      renderWidget();
      // Widget renders "<Factor>: by strategy" (colon, not em-dash).
      expect(screen.getByText(/funding: by strategy/i)).toBeTruthy();
    });

    it("renders back button and calls setSelectedFactor(null) on click", () => {
      const setSelectedFactor = vi.fn();
      Object.assign(
        mockPnLData,
        buildMockPnLData({
          selectedFactor: "Funding",
          selectedFactorData: buildMockFactorDrilldown(),
          setSelectedFactor,
        }),
      );
      renderWidget();
      fireEvent.click(screen.getByRole("button", { name: /all factors/i }));
      expect(setSelectedFactor).toHaveBeenCalledWith(null);
    });

    it("renders strategy breakdown rows from selectedFactorData.breakdown", () => {
      Object.assign(
        mockPnLData,
        buildMockPnLData({
          selectedFactor: "Funding",
          selectedFactorData: buildMockFactorDrilldown(),
        }),
      );
      renderWidget();
      // Breakdown strategy names from helper: "ETH Basis", "BTC Carry"
      expect(screen.getByText("ETH Basis")).toBeTruthy();
      expect(screen.getByText("BTC Carry")).toBeTruthy();
    });
  });
});
