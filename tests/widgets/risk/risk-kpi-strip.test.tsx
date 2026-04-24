/**
 * L1.5 widget harness — risk-kpi-strip-widget.
 *
 * Covers:
 * - Base KPI metrics labels render (VaR 95%, ES 95%, VaR 99%, ES 99%,
 *   Active Alerts, Kill Switches).
 * - Active Alerts count = criticalCount + warningCount.
 * - Kill Switches count = killedStrategies.size + 1 (sentinel).
 * - regimeMultiplier != 1 appends multiplier to VaR/ES labels.
 * - DeFi section visible when hasDefiStrategies=true.
 * - DeFi section hidden when hasDefiStrategies=false.
 * - DeFi delta composite values render (Delta USD, Delta ETH, Delta SOL, Liq. Cost).
 * - Table/Chart toggle switches DeFi risk view.
 * - Error state renders error message (cert L0.8).
 *
 * Skip: Recharts line chart SVG assertions.
 * Out of scope: route wiring (L2), multi-widget flows (L3).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  buildMockRiskData,
  buildMockPortfolioDeltaComposite,
  buildMockStrategyRiskProfile,
} from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
  formatCurrency: (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(2)}`;
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { RiskKpiStripWidget } from "@/components/widgets/risk/risk-kpi-strip-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("risk-kpi-strip — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
  });

  describe("base KPI labels", () => {
    it("renders VaR 95% label", () => {
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText(/VaR 95%/)).toBeTruthy();
    });

    it("renders ES 95% label", () => {
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText(/ES 95%/)).toBeTruthy();
    });

    it("renders VaR 99% label", () => {
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText(/VaR 99%/)).toBeTruthy();
    });

    it("renders ES 99% label", () => {
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText(/ES 99%/)).toBeTruthy();
    });

    it("renders Active Alerts label", () => {
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText("Active Alerts")).toBeTruthy();
    });

    it("renders Kill Switches label", () => {
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText("Kill Switches")).toBeTruthy();
    });
  });

  describe("KPI values", () => {
    it("Active Alerts count = criticalCount + warningCount", () => {
      Object.assign(mockRiskData, buildMockRiskData({ criticalCount: 2, warningCount: 3 }));
      render(<RiskKpiStripWidget {...noopProps} />);
      // sum = 5; getAllByText handles multiple nodes with same text
      expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    });

    it("Kill Switches = killedStrategies.size + 1 (sentinel)", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({ killedStrategies: new Set(["s1", "s2"]), criticalCount: 0, warningCount: 0 }),
      );
      render(<RiskKpiStripWidget {...noopProps} />);
      // killedStrategies.size=2 + 1 sentinel = 3
      // Use getAllByText since KpiSummaryWidget may render the value in multiple nodes
      expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    });

    it("appends regime multiplier to VaR label when regimeMultiplier != 1", () => {
      Object.assign(mockRiskData, buildMockRiskData({ regimeMultiplier: 1.5 }));
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText(/VaR 95%.*×1\.5/)).toBeTruthy();
    });
  });

  describe("DeFi section", () => {
    it("renders DeFi Delta Exposure section when hasDefiStrategies=true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasDefiStrategies: true }));
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText("DeFi Delta Exposure")).toBeTruthy();
    });

    it("renders Delta USD, Delta ETH, Delta SOL, Liq. Cost % cells", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          hasDefiStrategies: true,
          defiDeltaComposite: buildMockPortfolioDeltaComposite({
            total_delta_usd: 12000,
            total_delta_eth: 3.5,
            total_delta_sol: 10.0,
            total_liquidation_cost_pct: 0.4,
          }),
        }),
      );
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText("Delta USD")).toBeTruthy();
      expect(screen.getByText("Delta ETH")).toBeTruthy();
      expect(screen.getByText("Delta SOL")).toBeTruthy();
      expect(screen.getByText("Liq. Cost %")).toBeTruthy();
    });

    it("hides DeFi sections when hasDefiStrategies=false", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasDefiStrategies: false }));
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.queryByText("DeFi Delta Exposure")).toBeNull();
    });

    it("renders DeFi Strategy Risk Profiles table by default (defiRiskView='table')", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          hasDefiStrategies: true,
          defiRiskProfiles: [buildMockStrategyRiskProfile()],
        }),
      );
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText("DeFi Strategy Risk Profiles")).toBeTruthy();
      // Table column headers
      expect(screen.getByText("Protocol")).toBeTruthy();
    });

    it("switches to chart view when Chart button is clicked", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          hasDefiStrategies: true,
          defiRiskTimeSeries: [{ time: "T1", healthFactor: 1.8, netDeltaUsd: 5000, treasuryPct: 12 }],
        }),
      );
      render(<RiskKpiStripWidget {...noopProps} />);
      const chartBtn = screen.getByRole("button", { name: /Chart/i });
      fireEvent.click(chartBtn);
      // After toggle, "Protocol" table header should be gone
      expect(screen.queryByText("Protocol")).toBeNull();
    });
  });

  describe("error state", () => {
    it("renders error message when hasError=true (cert L0.8)", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskKpiStripWidget {...noopProps} />);
      expect(screen.getByText(/Failed to load risk KPIs/i)).toBeTruthy();
    });
  });
});
