/**
 * L1.5 widget harness — pnl-chart (overview).
 *
 * Heavier dependencies (recharts via LiveBatchComparison, DriftAnalysisPanel)
 * are mocked to thin stubs so happy-dom doesn't try to measure SVG sizes.
 *
 * Scope:
 * - Mounts with tabs (P&L / NAV / Exposure)
 * - Mode badge (Live vs Batch)
 * - Time-series toggle (show/hide button)
 * - Empty-state message when no series data
 * - Loading spinner via timeseriesLoading/liveBatchLoading
 * - null-context fallback
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { buildMockOverviewData, buildMockGlobalScope } from "../_helpers/mock-overview-context";

const mockData = buildMockOverviewData();
const mockScope = buildMockGlobalScope();

vi.mock("@/components/widgets/overview/overview-data-context", () => ({
  useOverviewDataSafe: () => mockData,
}));

vi.mock("@/lib/stores/global-scope-store", () => ({
  useGlobalScope: () => mockScope,
}));

// Stub heavy chart subcomponents — we only care that the widget wires them.
vi.mock("@/components/trading/live-batch-comparison", () => ({
  LiveBatchComparison: ({ title }: { title: string }) =>
    React.createElement("div", { "data-testid": "live-batch-comparison" }, title),
}));

vi.mock("@/components/trading/drift-analysis-panel", () => ({
  DriftAnalysisPanel: () => React.createElement("div", { "data-testid": "drift-analysis-panel" }, "Drift Analysis"),
}));

vi.mock("@/components/trading/value-format-toggle", () => ({
  ValueFormatToggle: () => React.createElement("div", { "data-testid": "value-format-toggle" }),
  useValueFormat: () => ({ format: "dollar", setFormat: vi.fn() }),
}));

import { PnLChartWidget } from "@/components/widgets/overview/pnl-chart-widget";

describe("pnl-chart — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
    Object.assign(mockScope, buildMockGlobalScope());
  });

  it("renders tabs for P&L, NAV, Exposure", () => {
    render(<PnLChartWidget {...({} as never)} />);
    expect(screen.getByRole("tab", { name: /P&L/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /NAV/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Exposure/i })).toBeTruthy();
  });

  it("renders Live mode badge when scope.mode=live", () => {
    render(<PnLChartWidget {...({} as never)} />);
    expect(screen.getByText(/^Live$/)).toBeTruthy();
  });

  it("renders Batch mode badge in batch mode", () => {
    Object.assign(mockScope, buildMockGlobalScope({ mode: "batch", asOfDatetime: "2026-04-23T00:00:00Z" }));
    render(<PnLChartWidget {...({} as never)} />);
    expect(screen.getByText(/Batch \(2026-04-23\)/)).toBeTruthy();
  });

  it("renders Hide Time Series toggle button by default (shown)", () => {
    render(<PnLChartWidget {...({} as never)} />);
    expect(screen.getByText(/Hide Time Series/i)).toBeTruthy();
  });

  it("toggles to Show Time Series on click", () => {
    render(<PnLChartWidget {...({} as never)} />);
    fireEvent.click(screen.getByText(/Hide Time Series/i));
    expect(screen.getByText(/Show Time Series/i)).toBeTruthy();
    // Chart sub-panels should no longer be mounted
    expect(screen.queryByTestId("drift-analysis-panel")).toBeNull();
  });

  it("mounts mocked LiveBatchComparison + DriftAnalysisPanel when expanded", () => {
    render(<PnLChartWidget {...({} as never)} />);
    expect(screen.getAllByTestId("live-batch-comparison").length).toBeGreaterThan(0);
    expect(screen.getByTestId("drift-analysis-panel")).toBeTruthy();
  });

  it("shows empty-state when no series data available", () => {
    Object.assign(
      mockData,
      buildMockOverviewData({
        liveTimeSeries: { pnl: [], nav: [], exposure: [] },
        batchTimeSeries: { pnl: [], nav: [], exposure: [] },
        realtimePnlPoints: [],
      }),
    );
    render(<PnLChartWidget {...({} as never)} />);
    expect(screen.getByText(/No time series data available/i)).toBeTruthy();
  });

  it("shows spinner when timeseriesLoading", () => {
    Object.assign(mockData, buildMockOverviewData({ timeseriesLoading: true }));
    const { container } = render(<PnLChartWidget {...({} as never)} />);
    expect(container.querySelector("svg.animate-spin, [role='status']")).toBeTruthy();
  });

  it("falls back to 'Navigate to Overview tab' when context null", async () => {
    vi.resetModules();
    vi.doMock("@/components/widgets/overview/overview-data-context", () => ({
      useOverviewDataSafe: () => null,
    }));
    vi.doMock("@/lib/stores/global-scope-store", () => ({
      useGlobalScope: () => mockScope,
    }));
    const mod = await import("@/components/widgets/overview/pnl-chart-widget");
    render(<mod.PnLChartWidget {...({} as never)} />);
    expect(screen.getByText(/Navigate to Overview tab/i)).toBeTruthy();
    vi.doUnmock("@/components/widgets/overview/overview-data-context");
    vi.doUnmock("@/lib/stores/global-scope-store");
  });
});
