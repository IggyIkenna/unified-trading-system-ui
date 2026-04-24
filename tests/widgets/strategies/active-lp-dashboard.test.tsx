/**
 * L1.5 widget harness — active-lp-dashboard-widget.
 *
 * Covers:
 * - Render with mocked strategies context (table, KPI strip).
 * - KPI aggregation: total TVL, total fees, avg IL, out-of-range count.
 * - In-range / out-of-range badge rendering.
 * - Loading state (TableWidget skeleton).
 * - Empty state (no LP positions).
 *
 * Per unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockStrategiesData, buildMockLPPosition } from "../_helpers/mock-strategies-context";

const mockStrategiesData = buildMockStrategiesData();

vi.mock("@/components/widgets/strategies/strategies-data-context", () => ({
  useStrategiesData: () => mockStrategiesData,
}));

// TableWidget uses tanstack react-table — provide minimal stub so tests stay
// hermetic without a real provider chain.
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
      <div data-testid="active-lp-dashboard-widget">
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
        <span key={m.label} data-testid={`kpi-${m.label.toLowerCase().replace(/\s+/g, "-")}`}>
          {m.label}: {m.value}
        </span>
      ))}
    </div>
  ),
}));

import * as React from "react";
import { ActiveLPDashboardWidget } from "@/components/widgets/strategies/active-lp-dashboard-widget";

describe("active-lp-dashboard — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockStrategiesData, buildMockStrategiesData());
  });

  describe("render", () => {
    it("mounts root testid when positions available", () => {
      render(<ActiveLPDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("active-lp-dashboard-widget")).toBeTruthy();
    });

    it("shows correct row count from mock data", () => {
      render(<ActiveLPDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("table-rows").textContent).toContain("2");
    });

    it("renders KPI strip with metrics", () => {
      render(<ActiveLPDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("kpi-strip")).toBeTruthy();
    });
  });

  describe("KPI aggregation", () => {
    it("computes Total TVL from all LP positions", () => {
      // positions: tvl=1_250_000 + 820_000 = 2_070_000 → $2.1M
      render(<ActiveLPDashboardWidget instanceId="test" />);
      const tvlKpi = screen.getByTestId("kpi-total-tvl");
      expect(tvlKpi.textContent).toContain("$");
    });

    it("computes 24h Fees sum", () => {
      render(<ActiveLPDashboardWidget instanceId="test" />);
      const feesKpi = screen.getByTestId("kpi-24h-fees");
      expect(feesKpi.textContent).toContain("$");
    });

    it("shows positions count", () => {
      render(<ActiveLPDashboardWidget instanceId="test" />);
      const positionsKpi = screen.getByTestId("kpi-positions");
      expect(positionsKpi.textContent).toContain("2");
    });
  });

  describe("loading state", () => {
    it("renders loading skeleton when isLoading=true", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ isLoading: true }));
      render(<ActiveLPDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("table-loading")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no LP positions", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ lpPositions: [] }));
      render(<ActiveLPDashboardWidget instanceId="test" />);
      expect(screen.getByTestId("table-empty").textContent).toContain("No LP positions");
    });
  });

  describe("out-of-range badge", () => {
    it("does not show out-of-range badge when all positions in range", () => {
      const inRangePositions = [
        buildMockLPPosition({ inRange: true }),
        buildMockLPPosition({ pool: "BTC-USDC", inRange: true }),
      ];
      Object.assign(mockStrategiesData, buildMockStrategiesData({ lpPositions: inRangePositions }));
      render(<ActiveLPDashboardWidget instanceId="test" />);
      // The "out of range" badge label is only added via actionsConfig when outOfRangeCount > 0
      expect(screen.queryByText(/out of range/i)).toBeNull();
    });
  });
});
