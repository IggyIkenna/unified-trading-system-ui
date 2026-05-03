/**
 * L1.5 widget harness — strategies-kpi-strip-widget (StrategiesKpiWidget).
 *
 * Widget ID: strategies-kpi-strip
 * File: components/widgets/strategies/strategies-kpi-widget.tsx
 *
 * Covers:
 * - Renders KPI metrics from mocked strategies context.
 * - Loading state: all metric values render as em-dash "—".
 * - Positive/negative P&L sentiment from context totals.
 * - Active count shown as "n / total".
 * - AUM formatted with currency prefix.
 *
 * Per unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockStrategiesData, buildMockStrategy } from "../_helpers/mock-strategies-context";

const mockStrategiesData = buildMockStrategiesData();

vi.mock("@/components/widgets/strategies/strategies-data-context", () => ({
  useStrategiesData: () => mockStrategiesData,
}));

vi.mock("@/lib/reference-data", () => ({
  formatCurrency: (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
}));

vi.mock("@/components/shared", () => ({
  KpiSummaryWidget: ({ metrics }: { metrics: Array<{ label: string; value: string; sentiment?: string }> }) => (
    <div data-testid="kpi-summary-widget">
      {metrics.map((m) => (
        <div
          key={m.label}
          data-testid={`kpi-metric-${m.label.toLowerCase().replace(/[\s/&]+/g, "-")}`}
          data-sentiment={m.sentiment}
        >
          <span data-testid="kpi-label">{m.label}</span>
          <span data-testid="kpi-value">{m.value}</span>
        </div>
      ))}
    </div>
  ),
}));

import * as React from "react";
import { StrategiesKpiWidget } from "@/components/widgets/strategies/strategies-kpi-widget";

describe("strategies-kpi-strip — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockStrategiesData, buildMockStrategiesData());
  });

  describe("render", () => {
    it("mounts KPI summary widget", () => {
      render(<StrategiesKpiWidget instanceId="test" />);
      expect(screen.getByTestId("kpi-summary-widget")).toBeTruthy();
    });

    it("renders Active Strategies metric", () => {
      render(<StrategiesKpiWidget instanceId="test" />);
      expect(screen.getByText("Active Strategies")).toBeTruthy();
    });

    it("renders Total AUM metric", () => {
      render(<StrategiesKpiWidget instanceId="test" />);
      expect(screen.getByText("Total AUM")).toBeTruthy();
    });

    it("renders Total P&L metric", () => {
      render(<StrategiesKpiWidget instanceId="test" />);
      expect(screen.getByText("Total P&L")).toBeTruthy();
    });

    it("renders MTD P&L metric", () => {
      render(<StrategiesKpiWidget instanceId="test" />);
      expect(screen.getByText("MTD P&L")).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("renders dash for all values when isLoading=true", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ isLoading: true }));
      render(<StrategiesKpiWidget instanceId="test" />);
      const values = screen.getAllByTestId("kpi-value");
      // Widget renders ASCII hyphen "-" as the loading placeholder.
      const allDash = values.every((v) => v.textContent === "-");
      expect(allDash).toBe(true);
    });
  });

  describe("active count", () => {
    it("shows activeCount / strategies.length format", () => {
      // default mock: 1 active, 1 total strategy
      Object.assign(mockStrategiesData, buildMockStrategiesData({ activeCount: 1 }));
      render(<StrategiesKpiWidget instanceId="test" />);
      const activeMetric = screen.getByTestId("kpi-metric-active-strategies");
      expect(activeMetric.textContent).toContain("1 / 1");
    });

    it("shows 0/0 when strategies list is empty", () => {
      Object.assign(
        mockStrategiesData,
        buildMockStrategiesData({
          strategies: [],
          filteredStrategies: [],
          groupedStrategies: {},
          activeCount: 0,
          totalAUM: 0,
          totalPnL: 0,
          totalMTDPnL: 0,
        }),
      );
      render(<StrategiesKpiWidget instanceId="test" />);
      const activeMetric = screen.getByTestId("kpi-metric-active-strategies");
      expect(activeMetric.textContent).toContain("0 / 0");
    });
  });

  describe("P&L sentiment", () => {
    it("renders positive sentiment for positive totalPnL", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ totalPnL: 50_000 }));
      render(<StrategiesKpiWidget instanceId="test" />);
      // "Total P&L" label maps to testid "kpi-metric-total-p-l" (& → -)
      const pnlMetric = screen.getByTestId("kpi-metric-total-p-l");
      expect(pnlMetric.dataset.sentiment).toBe("positive");
    });

    it("renders negative sentiment for negative totalPnL", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ totalPnL: -10_000 }));
      render(<StrategiesKpiWidget instanceId="test" />);
      const pnlMetric = screen.getByTestId("kpi-metric-total-p-l");
      expect(pnlMetric.dataset.sentiment).toBe("negative");
    });
  });

  describe("AUM formatting", () => {
    it("includes $ prefix in AUM value", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ totalAUM: 1_500_000 }));
      render(<StrategiesKpiWidget instanceId="test" />);
      const aumMetric = screen.getByTestId("kpi-metric-total-aum");
      expect(aumMetric.textContent).toContain("$");
    });
  });
});
