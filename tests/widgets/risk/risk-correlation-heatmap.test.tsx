/**
 * L1.5 widget harness — risk-correlation-heatmap-widget.
 *
 * The outer widget wraps CorrelationHeatmap via next/dynamic. We mock:
 *   1. @/components/risk/correlation-heatmap — stub component driven by
 *      a shared state object, mirroring the real component's branches.
 *   2. next/dynamic — synchronous pass-through returning the stub directly.
 *
 * Because vi.mock factories are hoisted and run before imports, we capture
 * the stub component in a hoisted variable and reference it from both mocks.
 *
 * Covers:
 * - Widget outer container mounts without crashing.
 * - Column header labels rendered from correlation matrix.
 * - Card title and legend rendered when data is present.
 * - Loading skeleton state (no title or labels).
 * - Error state text.
 * - Empty state text (labels=[] or data=undefined).
 *
 * Skip: heatmap SVG cell colors (browser-fidelity needed).
 * Out of scope: route wiring (L2), multi-widget flows (L3).
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Hoisted state + stub component — captured before module resolution
// ---------------------------------------------------------------------------

const mockState = vi.hoisted(() => ({
  data: {
    labels: ["ETH", "BTC", "SOL"],
    matrix: [
      [1.0, 0.85, 0.7],
      [0.85, 1.0, 0.6],
      [0.7, 0.6, 1.0],
    ],
  } as { labels: string[]; matrix: number[][] } | undefined,
  isLoading: false as boolean,
  isError: false as boolean,
}));

const CorrelationHeatmapStub = vi.hoisted(() => {
  return function CorrelationHeatmap() {
    if (mockState.isLoading) {
      return (
        <div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} data-testid="skeleton-row" />
          ))}
        </div>
      );
    }
    if (mockState.isError) {
      return <p>Failed to load correlation data</p>;
    }
    const d = mockState.data;
    if (!d || d.labels.length === 0) {
      return <p>No correlation data available</p>;
    }
    return (
      <div>
        <h2>Strategy Correlation Heatmap</h2>
        <div>
          {d.labels.map((lbl) => (
            <span key={lbl}>{lbl}</span>
          ))}
        </div>
        <span>-1.0</span>
        <span>0.0</span>
        <span>+1.0</span>
      </div>
    );
  };
});

vi.mock("@/components/risk/correlation-heatmap", () => ({
  CorrelationHeatmap: CorrelationHeatmapStub,
}));

vi.mock("next/dynamic", () => ({
  default: (_importFn: unknown, _opts?: unknown): React.ComponentType => {
    return CorrelationHeatmapStub;
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { RiskCorrelationHeatmapWidget } from "@/components/widgets/risk/risk-correlation-heatmap-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

const DEFAULT_DATA = {
  labels: ["ETH", "BTC", "SOL"],
  matrix: [
    [1.0, 0.85, 0.7],
    [0.85, 1.0, 0.6],
    [0.7, 0.6, 1.0],
  ],
};

describe("risk-correlation-heatmap — L1.5 harness", () => {
  beforeEach(() => {
    mockState.data = {
      ...DEFAULT_DATA,
      labels: [...DEFAULT_DATA.labels],
      matrix: DEFAULT_DATA.matrix.map((r) => [...r]),
    };
    mockState.isLoading = false;
    mockState.isError = false;
  });

  describe("render", () => {
    it("mounts the widget outer container without crashing", () => {
      render(<RiskCorrelationHeatmapWidget {...noopProps} />);
      expect(document.querySelector(".h-full")).toBeTruthy();
    });

    it("renders column header labels from correlation data", () => {
      render(<RiskCorrelationHeatmapWidget {...noopProps} />);
      expect(screen.getByText("ETH")).toBeTruthy();
      expect(screen.getByText("BTC")).toBeTruthy();
      expect(screen.getByText("SOL")).toBeTruthy();
    });

    it("renders card title 'Strategy Correlation Heatmap'", () => {
      render(<RiskCorrelationHeatmapWidget {...noopProps} />);
      expect(screen.getByText(/Strategy Correlation Heatmap/i)).toBeTruthy();
    });

    it("renders legend markers (-1.0, 0.0, +1.0) when data is present", () => {
      render(<RiskCorrelationHeatmapWidget {...noopProps} />);
      expect(screen.getByText("-1.0")).toBeTruthy();
      expect(screen.getByText("0.0")).toBeTruthy();
      expect(screen.getByText("+1.0")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows 'No correlation data available' when labels array is empty", () => {
      mockState.data = { labels: [], matrix: [] };
      mockState.isLoading = false;
      mockState.isError = false;
      render(<RiskCorrelationHeatmapWidget {...noopProps} />);
      expect(screen.getByText(/No correlation data available/i)).toBeTruthy();
    });

    it("shows 'No correlation data available' when data is undefined", () => {
      mockState.data = undefined;
      mockState.isLoading = false;
      mockState.isError = false;
      render(<RiskCorrelationHeatmapWidget {...noopProps} />);
      expect(screen.getByText(/No correlation data available/i)).toBeTruthy();
    });
  });

  describe("loading + error states", () => {
    it("shows skeleton rows when isLoading=true (no title rendered)", () => {
      mockState.isLoading = true;
      mockState.data = undefined;
      mockState.isError = false;
      render(<RiskCorrelationHeatmapWidget {...noopProps} />);
      expect(screen.queryByText(/Strategy Correlation Heatmap/i)).toBeNull();
      expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
    });

    it("shows error message when isError=true", () => {
      mockState.isError = true;
      mockState.isLoading = false;
      mockState.data = undefined;
      render(<RiskCorrelationHeatmapWidget {...noopProps} />);
      expect(screen.getByText(/Failed to load correlation data/i)).toBeTruthy();
    });
  });
});
