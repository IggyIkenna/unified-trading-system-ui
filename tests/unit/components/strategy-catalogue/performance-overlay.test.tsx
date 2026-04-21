import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PerformanceOverlay } from "@/components/strategy-catalogue/PerformanceOverlay";
import type { PerformanceSeriesResponse } from "@/lib/api/performance-overlay";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "admin" }, token: null }),
}));

// Recharts does not play well with jsdom's 0×0 ResizeObserver; we stub
// ResponsiveContainer so child chart marks up without measurement.
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-container">{children}</div>
    ),
  };
});

function baseSeries(
  overrides: Partial<PerformanceSeriesResponse> = {},
): PerformanceSeriesResponse {
  return {
    instance_id: "test-instance",
    series: {
      backtest: {
        aggregate: [
          { t: "2025-01-01T00:00:00Z", pnl: 0, equity: 1_000_000 },
          { t: "2025-06-01T00:00:00Z", pnl: 15_000, equity: 1_015_000 },
        ],
        per_venue: null,
      },
      paper: {
        aggregate: [
          { t: "2025-06-02T00:00:00Z", pnl: 15_000, equity: 1_015_000 },
          { t: "2025-10-01T00:00:00Z", pnl: 42_500, equity: 1_042_500 },
        ],
        per_venue: null,
      },
      live: {
        aggregate: [
          { t: "2025-10-02T00:00:00Z", pnl: 42_500, equity: 1_042_500 },
          { t: "2026-04-01T00:00:00Z", pnl: 61_000, equity: 1_061_000 },
        ],
        per_venue: null,
      },
    },
    transition_markers: {
      paper_started_at: "2025-06-01T00:00:00Z",
      live_started_at: "2025-10-01T00:00:00Z",
    },
    phase_annotations: [
      { phase: "paper_1d", at: "2025-06-01T00:00:00Z" },
      { phase: "live_early", at: "2025-10-01T00:00:00Z" },
    ],
    ...overrides,
  };
}

describe("<PerformanceOverlay> Plan C rendering", () => {
  it("overlay mode renders a chart container with all three view toggles", () => {
    render(
      <PerformanceOverlay
        instanceId="test-instance"
        mode="overlay"
        views={["backtest", "paper", "live"]}
        seriesOverride={baseSeries()}
      />,
    );
    expect(screen.getByTestId("performance-overlay")).toHaveAttribute("data-mode", "overlay");
    const toggles = screen.getByTestId("performance-overlay-toggles");
    expect(toggles.querySelectorAll("button[data-view]")).toHaveLength(3);
  });

  it("stitched mode renders without view toggles when showViewToggles=false", () => {
    render(
      <PerformanceOverlay
        instanceId="test-instance"
        mode="stitched"
        views={["backtest", "paper", "live"]}
        showViewToggles={false}
        showStats={false}
        seriesOverride={baseSeries()}
      />,
    );
    expect(screen.queryByTestId("performance-overlay-toggles")).toBeNull();
  });

  it("split mode renders a separate sub-chart per view", () => {
    render(
      <PerformanceOverlay
        instanceId="test-instance"
        mode="split"
        views={["backtest", "paper", "live"]}
        seriesOverride={baseSeries()}
      />,
    );
    expect(screen.getByTestId("performance-overlay-split")).toBeInTheDocument();
  });

  it("missing-view fallback disables the toggle with a tooltip", () => {
    const series = baseSeries();
    const withoutLive: PerformanceSeriesResponse = {
      ...series,
      series: { backtest: series.series.backtest, paper: series.series.paper },
    };
    render(
      <PerformanceOverlay
        instanceId="test-instance"
        mode="stitched"
        views={["backtest", "paper", "live"]}
        seriesOverride={withoutLive}
      />,
    );
    const toggles = screen.getByTestId("performance-overlay-toggles");
    const liveBtn = toggles.querySelector('[data-view="live"]') as HTMLButtonElement;
    expect(liveBtn).toBeDisabled();
    expect(liveBtn.getAttribute("title")).toMatch(/not available/i);
  });

  it("renders the stats sidecar when showStats=true (default)", () => {
    render(
      <PerformanceOverlay
        instanceId="test-instance"
        mode="overlay"
        views={["backtest", "paper", "live"]}
        seriesOverride={baseSeries()}
      />,
    );
    expect(screen.getByTestId("performance-overlay-stats")).toBeInTheDocument();
    expect(screen.getByTestId("performance-overlay-stats-row-backtest")).toBeInTheDocument();
    expect(screen.getByTestId("performance-overlay-stats-row-paper")).toBeInTheDocument();
    expect(screen.getByTestId("performance-overlay-stats-row-live")).toBeInTheDocument();
  });

  it("residual row appears in stats sidecar when exactly two views selected", () => {
    render(
      <PerformanceOverlay
        instanceId="test-instance"
        mode="overlay"
        views={["paper", "live"]}
        seriesOverride={baseSeries()}
      />,
    );
    expect(screen.getByTestId("performance-overlay-stats-residual")).toBeInTheDocument();
  });

  it("renders the empty-state fallback when no views have data", () => {
    const empty: PerformanceSeriesResponse = {
      ...baseSeries(),
      series: {
        backtest: { aggregate: [], per_venue: null },
        paper: { aggregate: [], per_venue: null },
        live: { aggregate: [], per_venue: null },
      },
    };
    render(
      <PerformanceOverlay
        instanceId="test-instance"
        mode="stitched"
        views={["backtest", "paper", "live"]}
        seriesOverride={empty}
      />,
    );
    expect(screen.getByTestId("performance-overlay-empty")).toBeInTheDocument();
  });

  it("split + perVenue renders the per-venue breakdown lines", () => {
    const base = baseSeries();
    const withVenues: PerformanceSeriesResponse = {
      ...base,
      series: {
        ...base.series,
        live: {
          aggregate: base.series.live!.aggregate,
          per_venue: {
            OKX: [
              { t: "2025-10-02T00:00:00Z", pnl: 21_000, equity: 1_021_000 },
              { t: "2026-04-01T00:00:00Z", pnl: 30_000, equity: 1_030_000 },
            ],
            BINANCE: [
              { t: "2025-10-02T00:00:00Z", pnl: 21_500, equity: 1_021_500 },
              { t: "2026-04-01T00:00:00Z", pnl: 31_000, equity: 1_031_000 },
            ],
          },
        },
      },
    };
    render(
      <PerformanceOverlay
        instanceId="test-instance"
        mode="split"
        views={["backtest", "paper", "live"]}
        perVenue
        seriesOverride={withVenues}
      />,
    );
    expect(screen.getByTestId("performance-overlay-split")).toBeInTheDocument();
  });
});
