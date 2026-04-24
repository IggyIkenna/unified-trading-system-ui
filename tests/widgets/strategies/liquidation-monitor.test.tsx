/**
 * L1.5 widget harness — liquidation-monitor-widget.
 *
 * Covers:
 * - Render with mocked strategies context; table + KPI strip visible.
 * - At-risk count KPI (HF < 1.5 → at-risk).
 * - Cascade zone and 24h liquidated KPI values.
 * - Loading state.
 * - Empty state (no at-risk positions).
 * - High-risk position (HF < 1.5) reflected in at-risk count.
 *
 * Per unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockStrategiesData, buildMockAtRiskPosition } from "../_helpers/mock-strategies-context";

const mockStrategiesData = buildMockStrategiesData();

vi.mock("@/components/widgets/strategies/strategies-data-context", () => ({
  useStrategiesData: () => mockStrategiesData,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | false | null)[]) => args.filter(Boolean).join(" "),
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
      <div data-testid="liquidation-monitor-widget">
        {summary}
        <div data-testid="table-rows">{data.length} rows</div>
      </div>
    );
  },
}));

vi.mock("@/components/shared/kpi-strip", () => ({
  KpiStrip: ({ metrics }: { metrics: Array<{ label: string; value: string; sentiment?: string }> }) => (
    <div data-testid="kpi-strip">
      {metrics.map((m) => (
        <span
          key={m.label}
          data-testid={`kpi-${m.label.toLowerCase().replace(/[\s&]+/g, "-")}`}
          data-sentiment={m.sentiment}
        >
          {m.label}: {m.value}
        </span>
      ))}
    </div>
  ),
}));

import * as React from "react";
import { LiquidationMonitorWidget } from "@/components/widgets/strategies/liquidation-monitor-widget";

describe("liquidation-monitor — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockStrategiesData, buildMockStrategiesData());
  });

  describe("render", () => {
    it("mounts root testid with positions available", () => {
      render(<LiquidationMonitorWidget instanceId="test" />);
      expect(screen.getByTestId("liquidation-monitor-widget")).toBeTruthy();
    });

    it("renders KPI strip", () => {
      render(<LiquidationMonitorWidget instanceId="test" />);
      expect(screen.getByTestId("kpi-strip")).toBeTruthy();
    });

    it("shows correct row count", () => {
      render(<LiquidationMonitorWidget instanceId="test" />);
      // default mock has 2 positions
      expect(screen.getByTestId("table-rows").textContent).toContain("2");
    });
  });

  describe("KPI metrics", () => {
    it("shows At Risk count (positions with HF < 1.5)", () => {
      // default mock: HF=1.18 (at risk) + HF=1.42 (at risk) = 2 at risk
      render(<LiquidationMonitorWidget instanceId="test" />);
      const atRiskKpi = screen.getByTestId("kpi-at-risk");
      expect(atRiskKpi.textContent).toContain("2");
    });

    it("At Risk KPI has negative sentiment when count > 0", () => {
      render(<LiquidationMonitorWidget instanceId="test" />);
      const atRiskKpi = screen.getByTestId("kpi-at-risk");
      expect(atRiskKpi.dataset.sentiment).toBe("negative");
    });

    it("shows Cascade Zone KPI", () => {
      render(<LiquidationMonitorWidget instanceId="test" />);
      const cascadeKpi = screen.getByTestId("kpi-cascade-zone");
      expect(cascadeKpi.textContent).toContain("$");
    });

    it("shows 24h Liquidated KPI", () => {
      render(<LiquidationMonitorWidget instanceId="test" />);
      const liqKpi = screen.getByTestId("kpi-24h-liquidated");
      expect(liqKpi.textContent).toContain("$");
    });

    it("At Risk KPI has neutral sentiment when count is 0", () => {
      // All positions with HF >= 1.5
      Object.assign(
        mockStrategiesData,
        buildMockStrategiesData({
          liquidationPositions: [
            buildMockAtRiskPosition({ healthFactor: 2.0, distancePct: 20 }),
            buildMockAtRiskPosition({ healthFactor: 1.8, distancePct: 15 }),
          ],
        }),
      );
      render(<LiquidationMonitorWidget instanceId="test" />);
      const atRiskKpi = screen.getByTestId("kpi-at-risk");
      expect(atRiskKpi.dataset.sentiment).toBe("neutral");
    });
  });

  describe("loading state", () => {
    it("renders loading state when isLoading=true", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ isLoading: true }));
      render(<LiquidationMonitorWidget instanceId="test" />);
      expect(screen.getByTestId("table-loading")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no at-risk positions", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ liquidationPositions: [] }));
      render(<LiquidationMonitorWidget instanceId="test" />);
      expect(screen.getByTestId("table-empty").textContent).toContain("No at-risk positions");
    });
  });
});
