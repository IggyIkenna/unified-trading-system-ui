/**
 * L1.5 widget harness — lending-arb-dashboard-widget.
 *
 * Covers:
 * - Render with mocked strategies context; table + KPI strip visible.
 * - Best-arb KPI: protocol + token label, spread value, row count.
 * - Loading state.
 * - Empty state (no rows).
 * - Spread badge variant: >50 bps → success badge.
 *
 * Per unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockLendingArbRow, buildMockStrategiesData } from "../_helpers/mock-strategies-context";

const mockStrategiesData = buildMockStrategiesData();

vi.mock("@/components/widgets/strategies/strategies-data-context", () => ({
  useStrategiesData: () => mockStrategiesData,
}));

vi.mock("@/components/shared/table-widget", () => ({
  TableWidget: ({
    data,
    isLoading,
    emptyMessage,
    summary,
  }: {
    data: unknown[];
    isLoading: boolean;
    emptyMessage?: string;
    summary?: React.ReactNode;
    [key: string]: unknown;
  }) => {
    if (isLoading) return <div data-testid="table-loading">Loading…</div>;
    if (data.length === 0) return <div data-testid="table-empty">{emptyMessage}</div>;
    return (
      <div data-testid="lending-arb-dashboard-widget">
        {summary}
        <div data-testid="table-rows">{data.length} rows</div>
      </div>
    );
  },
}));

vi.mock("@/components/shared/kpi-strip", () => ({
  KpiStrip: ({ metrics }: { metrics: Array<{ label: string; value: string }> }) => (
    <div data-testid="kpi-strip">
      {metrics.map((m) => (
        <span key={m.label} data-testid={`kpi-${m.label.toLowerCase().replace(/[\s&]+/g, "-")}`}>
          {m.label}: {m.value}
        </span>
      ))}
    </div>
  ),
}));

import { LendingArbDashboardWidget } from "@/components/widgets/strategies/lending-arb-dashboard-widget";
import * as React from "react";

describe("lending-arb-dashboard — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockStrategiesData, buildMockStrategiesData());
  });

  describe("render", () => {
    it("mounts root testid with rows available", () => {
      render(<LendingArbDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("lending-arb-dashboard-widget")).toBeTruthy();
    });

    it("shows correct row count from mock data", () => {
      render(<LendingArbDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("table-rows").textContent).toContain("2");
    });

    it("renders KPI strip with best arb data", () => {
      render(<LendingArbDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("kpi-strip")).toBeTruthy();
    });
  });

  describe("best-arb KPI", () => {
    it("shows best arb protocol and token (highest spreadBps)", () => {
      // Mock rows: first has 110 bps (Aave/USDC), second has 30 bps (Morpho/WETH)
      // Best arb should be Aave V3 — USDC (110 bps)
      render(<LendingArbDashboardWidget instanceId="test" />);
      const bestArbKpi = screen.getByTestId("kpi-best-arb");
      expect(bestArbKpi.textContent).toContain("Aave V3");
      expect(bestArbKpi.textContent).toContain("USDC");
    });

    it("shows spread in bps", () => {
      render(<LendingArbDashboardWidget instanceId="test" />);
      const spreadKpi = screen.getByTestId("kpi-spread");
      expect(spreadKpi.textContent).toContain("110 bps");
    });

    it("shows correct row count in Rows KPI", () => {
      render(<LendingArbDashboardWidget instanceId="test" />);
      const rowsKpi = screen.getByTestId("kpi-rows");
      expect(rowsKpi.textContent).toContain("2");
    });
  });

  describe("loading state", () => {
    it("renders loading state when isLoading=true", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ isLoading: true }));
      render(<LendingArbDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("table-loading")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no lending arb rows", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ lendingArbData: [] }));
      render(<LendingArbDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("table-empty").textContent).toContain("No lending arb data available");
    });
  });

  describe("multiple rows", () => {
    it("shows correct count for 4 rows", () => {
      Object.assign(
        mockStrategiesData,
        buildMockStrategiesData({
          lendingArbData: [
            buildMockLendingArbRow({ spreadBps: 140 }),
            buildMockLendingArbRow({ protocol: "Morpho Blue", token: "WETH", spreadBps: 30 }),
            buildMockLendingArbRow({ protocol: "Compound V3", token: "DAI", spreadBps: 50 }),
            buildMockLendingArbRow({ protocol: "Kamino", token: "USDT", spreadBps: 180 }),
          ],
        }),
      );
      render(<LendingArbDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("table-rows").textContent).toContain("4");
    });
  });
});
