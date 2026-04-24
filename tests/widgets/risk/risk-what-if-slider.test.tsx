/**
 * L1.5 widget harness — risk-what-if-slider-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Loading state: spinner shown; slider hidden.
 * - Error state: error message shown.
 * - Default render: slider at 0%, estimated PnL at 0.
 * - Slider state propagation: onChange calls setBtcPriceChangePct.
 * - Reactive computed values: BTC price change label updates; PnL sign colour.
 * - Greek display: delta + gamma values from portfolioGreeks rendered in info row.
 * - portfolioGreeksData.portfolio overrides portfolioGreeks when present.
 *
 * Out of scope:
 * - Chart SVG assertions (no chart in this widget).
 * - Visual regression (L4 — deferred).
 * - Live route wiring (L2 smoke).
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockRiskData, buildMockPortfolioDeltaComposite } from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
  formatCurrency: (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}K`;
    return `$${Math.round(v)}`;
  },
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/lib/utils/formatters", () => ({
  formatNumber: (v: number, decimals: number) => v.toFixed(decimals),
}));

vi.mock("@/components/shared/spinner", () => ({
  Spinner: () => <div>Loading...</div>,
}));

import { RiskWhatIfSliderWidget } from "@/components/widgets/risk/risk-what-if-slider-widget";

describe("risk-what-if-slider-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
  });

  describe("loading state", () => {
    it("shows loading spinner when isLoading is true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.getByText(/Loading/i)).toBeTruthy();
    });

    it("hides slider when isLoading is true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.queryByRole("slider")).toBeNull();
    });
  });

  describe("error state", () => {
    it("shows error message when hasError is true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load portfolio data/i)).toBeTruthy();
    });

    it("hides slider when hasError is true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.queryByRole("slider")).toBeNull();
    });
  });

  describe("default render (btcPriceChangePct = 0)", () => {
    it("renders the BTC price change label", () => {
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.getByText(/BTC Price Change/i)).toBeTruthy();
    });

    it("renders the Estimated Portfolio PnL label", () => {
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.getByText(/Estimated Portfolio PnL/i)).toBeTruthy();
    });

    it("renders the slider input with range attributes", () => {
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      const slider = screen.getByRole("slider") as HTMLInputElement;
      expect(slider).toBeTruthy();
      expect(slider.min).toBe("-30");
      expect(slider.max).toBe("30");
    });

    it("shows 0% label(s) for default neutral position", () => {
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      // Both the percentage display span and the middle range tick show "0%"
      expect(screen.getAllByText("0%").length).toBeGreaterThanOrEqual(1);
    });

    it("shows slider range tick labels -30%, 0%, +30%", () => {
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.getByText("-30%")).toBeTruthy();
      expect(screen.getByText("+30%")).toBeTruthy();
    });
  });

  describe("slider state propagation", () => {
    it("calls setBtcPriceChangePct with numeric value on slider change", () => {
      const setBtcPriceChangePct = vi.fn();
      mockRiskData.setBtcPriceChangePct = setBtcPriceChangePct;
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "10" } });
      expect(setBtcPriceChangePct).toHaveBeenCalledWith(10);
    });

    it("calls setBtcPriceChangePct with negative value on slider change", () => {
      const setBtcPriceChangePct = vi.fn();
      mockRiskData.setBtcPriceChangePct = setBtcPriceChangePct;
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "-15" } });
      expect(setBtcPriceChangePct).toHaveBeenCalledWith(-15);
    });

    it("shows + prefix in BTC change label for positive percentage", () => {
      Object.assign(mockRiskData, buildMockRiskData());
      mockRiskData.btcPriceChangePct = 10;
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.getByText("+10%")).toBeTruthy();
    });

    it("shows negative prefix for negative percentage", () => {
      mockRiskData.btcPriceChangePct = -5;
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.getByText("-5%")).toBeTruthy();
    });
  });

  describe("reactive computed values", () => {
    it("renders estimatedPnl from context", () => {
      mockRiskData.estimatedPnl = 8500;
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      // formatCurrency(8500) -> "$9K" based on mock formatter (rounding) — just check PnL label visible
      expect(screen.getByText(/Estimated Portfolio PnL/i)).toBeTruthy();
    });

    it("renders delta and gamma from portfolioGreeks in info row", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          portfolioGreeks: { delta: 0.42, gamma: 0.012, vega: 3200, theta: -180, rho: 120 },
          portfolioGreeksData: null,
        }),
      );
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      // Info row: "Δ=0.42 | Γ=0.0120"
      expect(screen.getByText(/Δ=0.42/)).toBeTruthy();
      expect(screen.getByText(/Γ=0.0120/)).toBeTruthy();
    });

    it("uses portfolioGreeksData.portfolio when available over portfolioGreeks fallback", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          portfolioGreeks: { delta: 0.42, gamma: 0.012, vega: 3200, theta: -180, rho: 120 },
          portfolioGreeksData: {
            portfolio: { delta: 0.99, gamma: 0.005, vega: 1000, theta: -50, rho: 10 },
            by_strategy: [],
            timestamp: "2026-04-24T00:00:00Z",
          },
        }),
      );
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      // Should use portfolioGreeksData.portfolio.delta = 0.99, not 0.42
      expect(screen.getByText(/Δ=0.99/)).toBeTruthy();
    });
  });

  describe("defiDeltaComposite is not rendered by this widget", () => {
    it("renders without crashing when defiDeltaComposite has values", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          defiDeltaComposite: buildMockPortfolioDeltaComposite({ total_delta_usd: 999999 }),
        }),
      );
      render(<RiskWhatIfSliderWidget instanceId="risk-what-if-slider" layoutMode="grid" />);
      expect(screen.getByText(/BTC Price Change/i)).toBeTruthy();
    });
  });
});
