/**
 * L1.5 widget harness — risk-var-chart-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5
 *
 * Scope:
 * - Loading state: spinner shown; method buttons hidden.
 * - Error state: error message shown.
 * - Empty state when adjustedVarData is empty.
 * - Method toggle buttons all four methods rendered.
 * - setVarMethod called when a method button is clicked.
 * - Asset-class legend items all four rendered.
 *
 * Out of scope:
 * - Recharts SVG bar assertions (chart internals; skipped per harness rules).
 * - Visual regression (L4 — deferred).
 * - Live route wiring (L2 smoke).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockRiskData } from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
  formatCurrency: (v: number) => `$${v}`,
  getAssetClassColor: (cls: string) => `color-${cls}`,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

vi.mock("@/components/shared/spinner", () => ({
  Spinner: () => <div>Loading...</div>,
}));

import { RiskVarChartWidget } from "@/components/widgets/risk/risk-var-chart-widget";

const MOCK_VAR_DATA = [
  { instrument: "ETH-PERP", var95: 12000, pct: 26, venue: "BINANCE", assetClass: "defi" },
  { instrument: "BTC-PERP", var95: 20000, pct: 43, venue: "DYDX", assetClass: "cefi" },
];

describe("risk-var-chart-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
  });

  describe("loading state", () => {
    it("shows loading spinner when isLoading is true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      expect(screen.getByText(/Loading/i)).toBeTruthy();
    });

    it("does not render VaR method buttons while loading", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      expect(screen.queryByRole("button", { name: /historical/i })).toBeNull();
    });
  });

  describe("error state", () => {
    it("shows error message when hasError is true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load VaR data/i)).toBeTruthy();
    });

    it("does not render method buttons on error", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      expect(screen.queryByRole("button", { name: /historical/i })).toBeNull();
    });
  });

  describe("empty state", () => {
    it("shows no-data message when adjustedVarData is empty", () => {
      // buildMockRiskData defaults adjustedVarData: []
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      expect(screen.getByText(/No VaR data available/i)).toBeTruthy();
    });

    it("does not render method buttons when adjustedVarData is empty", () => {
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      expect(screen.queryByRole("button", { name: /historical/i })).toBeNull();
    });
  });

  describe("populated state — method toggles", () => {
    beforeEach(() => {
      mockRiskData.adjustedVarData = MOCK_VAR_DATA;
    });

    it("renders all four VaR method buttons", () => {
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      // Use exact text matching to avoid /historical/ matching "filtered historical"
      expect(screen.getByRole("button", { name: "historical" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "parametric" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "monte carlo" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "filtered historical" })).toBeTruthy();
    });

    it("calls setVarMethod when 'parametric' button is clicked", () => {
      const setVarMethod = vi.fn();
      mockRiskData.setVarMethod = setVarMethod;
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      fireEvent.click(screen.getByRole("button", { name: /parametric/i }));
      expect(setVarMethod).toHaveBeenCalledWith("parametric");
    });

    it("calls setVarMethod when 'monte_carlo' button is clicked", () => {
      const setVarMethod = vi.fn();
      mockRiskData.setVarMethod = setVarMethod;
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      fireEvent.click(screen.getByRole("button", { name: /monte carlo/i }));
      expect(setVarMethod).toHaveBeenCalledWith("monte_carlo");
    });

    it("calls setVarMethod when 'filtered_historical' button is clicked", () => {
      const setVarMethod = vi.fn();
      mockRiskData.setVarMethod = setVarMethod;
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      fireEvent.click(screen.getByRole("button", { name: /filtered historical/i }));
      expect(setVarMethod).toHaveBeenCalledWith("filtered_historical");
    });
  });

  describe("populated state — asset-class legend", () => {
    beforeEach(() => {
      mockRiskData.adjustedVarData = MOCK_VAR_DATA;
    });

    it("renders all four asset-class legend labels", () => {
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      expect(screen.getByText("DeFi")).toBeTruthy();
      expect(screen.getByText("CeFi")).toBeTruthy();
      expect(screen.getByText("TradFi")).toBeTruthy();
      expect(screen.getByText("Sports")).toBeTruthy();
    });

    it("does not show error or empty state when data is present", () => {
      render(<RiskVarChartWidget instanceId="risk-var-chart" layoutMode="grid" />);
      expect(screen.queryByText(/Failed to load VaR data/i)).toBeNull();
      expect(screen.queryByText(/No VaR data available/i)).toBeNull();
    });
  });
});
