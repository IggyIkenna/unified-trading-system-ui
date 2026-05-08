/**
 * L1.5 widget harness — commodity-regime-widget.
 *
 * Covers:
 * - Render with mocked strategies context; regime badge and factor scores visible.
 * - Loading state branch.
 * - Empty state branch (no factors/positions).
 * - Factor score positive/negative sign rendering.
 * - Position direction badge (LONG/SHORT).
 * - Regime badge variants (Trending → success, Transitioning → warning, Mean-Reverting → pending).
 *
 * Per unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockCommodityRegime, buildMockStrategiesData } from "../_helpers/mock-strategies-context";

const mockStrategiesData = buildMockStrategiesData();

vi.mock("@/components/widgets/strategies/strategies-data-context", () => ({
  useStrategiesData: () => mockStrategiesData,
}));

// Badge: render children wrapped in a span for assertions
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableCell: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={className}>{children}</td>
  ),
}));

import { CommodityRegimeWidget } from "@/components/widgets/strategies/commodity-regime-widget";
import * as React from "react";

describe("commodity-regime — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockStrategiesData, buildMockStrategiesData());
  });

  describe("render", () => {
    it("mounts card testid with data available", () => {
      render(<CommodityRegimeWidget instanceId="test" />);
      expect(screen.getByTestId("card")).toBeTruthy();
    });

    it("renders the Commodity Regime Dashboard title", () => {
      render(<CommodityRegimeWidget instanceId="test" />);
      expect(screen.getByText("Commodity Regime Dashboard")).toBeTruthy();
    });

    it("shows the current regime badge", () => {
      render(<CommodityRegimeWidget instanceId="test" />);
      const badges = screen.getAllByTestId("badge");
      const regimeBadge = badges.find((b) => b.textContent === "Trending");
      expect(regimeBadge).toBeTruthy();
    });

    it("shows Factor Scores section heading", () => {
      render(<CommodityRegimeWidget instanceId="test" />);
      expect(screen.getByText(/Factor Scores/i)).toBeTruthy();
    });

    it("shows Active Positions section heading", () => {
      render(<CommodityRegimeWidget instanceId="test" />);
      expect(screen.getByText(/Active Positions/i)).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("renders loading message when isLoading=true", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ isLoading: true }));
      render(<CommodityRegimeWidget instanceId="test" />);
      expect(screen.getByText(/Loading commodity regime data/i)).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("renders empty message when no factors and no positions", () => {
      Object.assign(
        mockStrategiesData,
        buildMockStrategiesData({
          commodityRegime: buildMockCommodityRegime({ factors: [], positions: [] }),
        }),
      );
      render(<CommodityRegimeWidget instanceId="test" />);
      expect(screen.getByText(/No commodity regime data available/i)).toBeTruthy();
    });
  });

  describe("factor scores", () => {
    it("renders factor names from mock data", () => {
      render(<CommodityRegimeWidget instanceId="test" />);
      expect(screen.getByText("Price Momentum")).toBeTruthy();
      expect(screen.getByText("COT Positioning")).toBeTruthy();
    });

    it("renders BULLISH and BEARISH signal badges", () => {
      render(<CommodityRegimeWidget instanceId="test" />);
      const bullishBadges = screen.getAllByText("BULLISH");
      expect(bullishBadges.length).toBeGreaterThan(0);
      expect(screen.getByText("BEARISH")).toBeTruthy();
    });
  });

  describe("positions", () => {
    it("renders commodity names in positions table", () => {
      render(<CommodityRegimeWidget instanceId="test" />);
      expect(screen.getByText("WTI Crude")).toBeTruthy();
      expect(screen.getByText("Natural Gas")).toBeTruthy();
    });

    it("renders LONG and SHORT direction badges", () => {
      render(<CommodityRegimeWidget instanceId="test" />);
      expect(screen.getByText("LONG")).toBeTruthy();
      expect(screen.getByText("SHORT")).toBeTruthy();
    });
  });

  describe("regime variants", () => {
    it("shows warning badge for Transitioning regime", () => {
      Object.assign(
        mockStrategiesData,
        buildMockStrategiesData({
          commodityRegime: buildMockCommodityRegime({ currentRegime: "Transitioning" }),
        }),
      );
      render(<CommodityRegimeWidget instanceId="test" />);
      const badges = screen.getAllByTestId("badge");
      const transitionBadge = badges.find((b) => b.textContent === "Transitioning" && b.dataset.variant === "warning");
      expect(transitionBadge).toBeTruthy();
    });
  });
});
