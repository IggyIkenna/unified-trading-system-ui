/**
 * L1.5 widget harness — positions-kpi-strip.
 *
 * Covers:
 * - Render with mocked context, root testid mounts.
 * - All six KPI labels render.
 * - Loading state: all metric values show em-dash.
 * - Error state: widget renders "Failed to load positions" instead of KPI strip.
 * - Sentiment: positive/negative unrealized P&L driven by summary.unrealizedPnL sign.
 * - Numeric values are formatted via formatCurrency (K/M suffix).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockPositionsData, buildMockPositionsSummary } from "../_helpers/mock-positions-context";

const mockData = buildMockPositionsData();

vi.mock("@/components/widgets/positions/positions-data-context", () => ({
  usePositionsData: () => mockData,
}));

// Force the tier-zero hook into "unsupported" so the widget falls through to
// the legacy positions-data path the test asserts on. Real cockpit usage
// resolves a wide-open scope to "match" + every scenario; that path is
// exercised by tests/e2e/cockpit-tier-zero-filters.spec.ts.
vi.mock("@/lib/cockpit/use-tier-zero-scenario", () => ({
  useTierZeroScenario: () => ({
    matchedScenarios: [],
    strategies: [],
    positions: [],
    backtests: [],
    bundles: [],
    status: "unsupported" as const,
  }),
}));

import { PositionsKpiWidget } from "@/components/widgets/positions/positions-kpi-widget";

const WIDGET_PROPS = { instanceId: "positions-kpi-strip-test" };

describe("positions-kpi-strip — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockPositionsData());
  });

  describe("render", () => {
    it("mounts root testid", () => {
      render(<PositionsKpiWidget {...WIDGET_PROPS} />);
      expect(screen.getByTestId("positions-kpi-widget")).toBeTruthy();
    });

    it("renders all six KPI labels", () => {
      render(<PositionsKpiWidget {...WIDGET_PROPS} />);
      expect(screen.getByText("Positions")).toBeTruthy();
      expect(screen.getByText("Total Notional")).toBeTruthy();
      expect(screen.getByText("Unrealized P&L")).toBeTruthy();
      expect(screen.getByText("Total Margin")).toBeTruthy();
      expect(screen.getByText("Long Exposure")).toBeTruthy();
      expect(screen.getByText("Short Exposure")).toBeTruthy();
    });

    it("renders the position count from summary", () => {
      Object.assign(mockData, buildMockPositionsData({ summary: buildMockPositionsSummary({ totalPositions: 42 }) }));
      render(<PositionsKpiWidget {...WIDGET_PROPS} />);
      expect(screen.getByText("42")).toBeTruthy();
    });
  });

  describe("formatting", () => {
    it("formats large totals with M suffix via formatCurrency", () => {
      Object.assign(
        mockData,
        buildMockPositionsData({
          summary: buildMockPositionsSummary({ totalNotional: 12_500_000 }),
        }),
      );
      render(<PositionsKpiWidget {...WIDGET_PROPS} />);
      // formatCurrency(12_500_000, 0) -> "13M"; prefixed with $
      expect(screen.getByText(/\$13M/)).toBeTruthy();
    });

    it("prefixes unrealized P&L with + sign when positive", () => {
      Object.assign(mockData, buildMockPositionsData({ summary: buildMockPositionsSummary({ unrealizedPnL: 1_500 }) }));
      render(<PositionsKpiWidget {...WIDGET_PROPS} />);
      // formatCurrency(1500) = "2K" at 0 decimals -> "+$2K"
      expect(screen.getByText(/^\+\$2K$/)).toBeTruthy();
    });

    it("does not prefix unrealized P&L with + when negative", () => {
      Object.assign(
        mockData,
        buildMockPositionsData({ summary: buildMockPositionsSummary({ unrealizedPnL: -3_200 }) }),
      );
      render(<PositionsKpiWidget {...WIDGET_PROPS} />);
      // abs formatted -> "3K"; no + prefix because value < 0
      const match = screen.getByText(/^\$3K$/);
      expect(match).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("renders dash for all six metrics when isLoading", () => {
      Object.assign(mockData, buildMockPositionsData({ isLoading: true }));
      render(<PositionsKpiWidget {...WIDGET_PROPS} />);
      // Widget renders ASCII hyphen "-" as the loading placeholder.
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("error state", () => {
    it("renders error fallback instead of the KPI strip when positionsError is set", () => {
      Object.assign(mockData, buildMockPositionsData({ positionsError: new Error("network down") }));
      render(<PositionsKpiWidget {...WIDGET_PROPS} />);
      expect(screen.getByText("Failed to load positions")).toBeTruthy();
      expect(screen.queryByTestId("positions-kpi-widget")).toBeNull();
    });
  });
});
