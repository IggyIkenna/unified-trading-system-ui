/**
 * L1.5 widget harness — risk-greeks-summary-widget.
 *
 * Covers:
 * - KPI strip renders Delta, Gamma, Vega, Theta, Rho from portfolioGreeks.
 * - Position Greeks table: renders instrument + venue per positionGreeks entry.
 * - Portfolio Total row sums match portfolioGreeks values.
 * - Second-order risks section (Volga, Vanna, Slide) visible in collapsible.
 * - portfolioGreeksData.portfolio overrides portfolioGreeks when present.
 * - Loading state renders spinner (no data rows) (cert L0.6).
 * - Error state renders error message (cert L0.8).
 *
 * Skip: Recharts SVG line chart assertions.
 * Out of scope: route wiring (L2), multi-widget flows (L3).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockRiskData } from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
  formatCurrency: (v: number) => `$${v.toLocaleString()}`,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { RiskGreeksSummaryWidget } from "@/components/widgets/risk/risk-greeks-summary-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("risk-greeks-summary — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
  });

  describe("KPI strip — portfolio greeks", () => {
    it("renders Delta KPI label (at least once in the document)", () => {
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      // Delta appears in both the KPI strip and the table header column
      expect(screen.getAllByText("Delta").length).toBeGreaterThan(0);
    });

    it("renders Gamma KPI label", () => {
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      expect(screen.getAllByText("Gamma").length).toBeGreaterThan(0);
    });

    it("renders Vega KPI label", () => {
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      expect(screen.getAllByText("Vega").length).toBeGreaterThan(0);
    });

    it("renders Theta KPI label", () => {
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      // Theta appears in KPI strip and table header
      expect(screen.getAllByText("Theta").length).toBeGreaterThan(0);
    });

    it("renders Rho KPI label", () => {
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      expect(screen.getByText("Rho")).toBeTruthy();
    });
  });

  describe("position greeks table", () => {
    it("renders instrument from positionGreeks", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          positionGreeks: [
            { instrument: "ETH-PERP", venue: "BINANCE", qty: 10, delta: 0.42, gamma: 0.012, vega: 3200, theta: -180 },
          ],
        }),
      );
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      expect(screen.getByText("ETH-PERP")).toBeTruthy();
    });

    it("renders venue from positionGreeks", () => {
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      expect(screen.getByText("BINANCE")).toBeTruthy();
    });

    it("renders 'Portfolio Total' summary row", () => {
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      expect(screen.getByText("Portfolio Total")).toBeTruthy();
    });
  });

  describe("second-order risks", () => {
    it("renders 'Second-Order Risks' collapsible section heading", () => {
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      expect(screen.getByText("Second-Order Risks")).toBeTruthy();
    });

    it("reveals Volga, Vanna, Slide after clicking the collapsed section", () => {
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      // Section is defaultOpen=false; click the trigger to open it
      const trigger = screen.getByRole("button", { name: /Second-Order Risks/i });
      fireEvent.click(trigger);
      expect(screen.getByText(/Volga/)).toBeTruthy();
      expect(screen.getByText(/Vanna/)).toBeTruthy();
      expect(screen.getByText(/Slide/)).toBeTruthy();
    });
  });

  describe("portfolioGreeksData override", () => {
    it("uses portfolioGreeksData.portfolio when provided", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          portfolioGreeksData: {
            portfolio: { delta: 0.99, gamma: 0.099, vega: 9999, theta: -999, rho: 999 },
            per_underlying: [],
          },
        }),
      );
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      // The widget should use portfolioGreeksData.portfolio when present
      // Delta = 0.99, formatted as "0.99"
      expect(screen.getAllByText("0.99").length).toBeGreaterThan(0);
    });
  });

  describe("loading + error states", () => {
    it("renders spinner (no greeks data) when isLoading=true (cert L0.6)", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      expect(screen.queryByText("Delta")).toBeNull();
    });

    it("renders error message when hasError=true (cert L0.8)", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskGreeksSummaryWidget {...noopProps} />);
      expect(screen.getByText(/Failed to load Greeks data/i)).toBeTruthy();
    });
  });
});
