/**
 * L1.5 widget harness — pnl-chart (overview).
 *
 * Migrated 2026-04-29: the widget no longer has a "Hide Time Series" toggle
 * or DriftAnalysisPanel; the legacy "Live"/"Batch" mode badge was replaced
 * by a viewMode Tabs control (Live/Batch/Split/Delta) above the chart.
 *
 * Heavier subcomponents (recharts via LiveBatchComparison, DateRangePicker,
 * usePnlChartData) are mocked to thin stubs so happy-dom doesn't try to
 * measure SVG sizes.
 *
 * Scope:
 * - Mounts with metric tabs (P&L / NAV / Exposure)
 * - viewMode Tabs strip (Live / Batch / Split / Delta) renders
 * - LiveBatchComparison sub-component receives current viewMode + data
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { buildMockOverviewData, buildMockGlobalScope } from "../_helpers/mock-overview-context";

const mockData = buildMockOverviewData();
const mockScope = buildMockGlobalScope();

vi.mock("@/components/widgets/overview/overview-data-context", () => ({
  useOverviewDataSafe: () => mockData,
}));

vi.mock("@/lib/stores/workspace-scope-store", () => ({
  useWorkspaceScope: () => mockScope.scope, useWorkspaceScopeStore: (selector?: (s: typeof mockScope) => unknown) => (selector ? selector(mockScope) : mockScope), useWorkspaceScopeActions: () => mockScope,
}));

vi.mock("@/components/trading/live-batch-comparison", () => ({
  LiveBatchComparison: ({ viewMode }: { viewMode: string }) =>
    React.createElement("div", { "data-testid": "live-batch-comparison", "data-view-mode": viewMode }),
}));

vi.mock("@/components/trading/value-format-toggle", () => ({
  ValueFormatToggle: () => React.createElement("div", { "data-testid": "value-format-toggle" }),
  useValueFormat: () => ({ format: "dollar", setFormat: vi.fn() }),
}));

vi.mock("@/components/shared/date-range-picker", () => ({
  DateRangePicker: () => React.createElement("div", { "data-testid": "date-range-picker" }),
}));

vi.mock("@/components/widgets/overview/use-pnl-chart-data", () => ({
  usePnlChartData: () => ({
    live: { pnl: [{ t: 1, v: 100 }], nav: [], exposure: [] },
    batch: { pnl: [], nav: [], exposure: [] },
  }),
  CHART_DATA_START: "2024-01-01",
}));

import { PnLChartWidget } from "@/components/widgets/overview/pnl-chart-widget";

describe("pnl-chart — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
    Object.assign(mockScope, buildMockGlobalScope());
  });

  it("renders metric tabs for P&L, NAV, Exposure", () => {
    render(<PnLChartWidget {...({} as never)} />);
    expect(screen.getByRole("tab", { name: /P&L/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /NAV/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Exposure/i })).toBeTruthy();
  });

  it("renders viewMode Tabs strip with Live / Batch / Split / Delta", () => {
    render(<PnLChartWidget {...({} as never)} />);
    // Live appears in two roles (metric and viewMode); use getAllByRole.
    expect(screen.getAllByRole("tab", { name: /Live/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("tab", { name: /Batch/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: /Split/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Delta/i })).toBeTruthy();
  });

  it("default viewMode is split — LiveBatchComparison receives viewMode='split'", () => {
    render(<PnLChartWidget {...({} as never)} />);
    const chart = screen.getByTestId("live-batch-comparison");
    expect(chart.getAttribute("data-view-mode")).toBe("split");
  });

  it("mounts the LiveBatchComparison sub-component", () => {
    render(<PnLChartWidget {...({} as never)} />);
    expect(screen.getAllByTestId("live-batch-comparison").length).toBeGreaterThan(0);
  });
});
