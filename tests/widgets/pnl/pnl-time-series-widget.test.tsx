/**
 * L1.5 widget harness — pnl-time-series-widget.
 *
 * Chart widget: Recharts LineChart via ResponsiveContainer won't render
 * meaningful SVG in happy-dom. Tests assert on surrounding controls
 * (overlay toggle, factor chips), text content (cumulative net), and
 * loading/empty branches — not on SVG paths.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { buildMockPnLData } from "../_helpers/mock-pnl-context";

const mockPnLData = buildMockPnLData();

vi.mock("@/components/widgets/pnl/pnl-data-context", () => ({
  usePnLData: () => mockPnLData,
}));

import { PnlTimeSeriesWidget } from "@/components/widgets/pnl/pnl-time-series-widget";

function renderWidget() {
  return render(<PnlTimeSeriesWidget instanceId="pnl-time-series-test" />);
}

describe("pnl-time-series-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockPnLData, buildMockPnLData());
  });

  describe("render", () => {
    it("renders overlay toggle buttons on mount", () => {
      renderWidget();
      expect(screen.getByRole("button", { name: /factor lines/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /backtest vs live/i })).toBeTruthy();
    });

    it("shows loading skeleton when isLoading is true", () => {
      Object.assign(mockPnLData, buildMockPnLData({ isLoading: true }));
      const { container } = renderWidget();
      // Loading branch — overlay toggle buttons are not rendered.
      expect(screen.queryByRole("button", { name: /factor lines/i })).toBeNull();
      expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
    });

    it("shows empty-state copy when both timeSeries and backtest are empty", () => {
      Object.assign(mockPnLData, buildMockPnLData({ timeSeriesData: [], backtestVsLive: [] }));
      renderWidget();
      expect(screen.getByText(/no p&l time series data available/i)).toBeTruthy();
    });

    it("renders cumulative net PnL in default factors overlay", () => {
      Object.assign(mockPnLData, buildMockPnLData({ timeSeriesNetPnL: 12345 }));
      renderWidget();
      expect(screen.getByText(/cumulative net/i)).toBeTruthy();
    });
  });

  describe("overlay toggle", () => {
    it("defaults to Factor Lines overlay (cumulative net visible)", () => {
      renderWidget();
      expect(screen.getByText(/cumulative net/i)).toBeTruthy();
    });

    it("switches to Backtest overlay when the button is clicked", () => {
      renderWidget();
      fireEvent.click(screen.getByRole("button", { name: /backtest vs live/i }));
      // Cumulative Net KPI is only shown in factors overlay — gone after
      // switching to backtest.
      expect(screen.queryByText(/cumulative net/i)).toBeNull();
      // Backtest footer copy appears.
      expect(screen.getByText(/blue = backtest prediction/i)).toBeTruthy();
    });

    it("returns to Factor Lines overlay after toggling", () => {
      renderWidget();
      fireEvent.click(screen.getByRole("button", { name: /backtest vs live/i }));
      fireEvent.click(screen.getByRole("button", { name: /factor lines/i }));
      expect(screen.getByText(/cumulative net/i)).toBeTruthy();
    });
  });

  describe("factor chips", () => {
    it("renders all 10 factor chips with visible labels", () => {
      renderWidget();
      // FACTORS array in widget: Funding, Carry, Basis, Delta, Gamma, Rebates, Slippage, Fees, Theta, Vega.
      for (const label of [
        "Funding",
        "Carry",
        "Basis",
        "Delta",
        "Gamma",
        "Rebates",
        "Slippage",
        "Fees",
        "Theta",
        "Vega",
      ]) {
        expect(screen.getByRole("button", { name: label })).toBeTruthy();
      }
    });

    it("toggles a factor chip opacity class when clicked", () => {
      renderWidget();
      const chip = screen.getByRole("button", { name: "Funding" });
      const initialOpacity = chip.className.includes("opacity-30");
      fireEvent.click(chip);
      const afterClick = chip.className.includes("opacity-30");
      expect(afterClick).toBe(!initialOpacity);
    });
  });
});
