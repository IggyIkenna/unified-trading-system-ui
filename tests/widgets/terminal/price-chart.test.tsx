/**
 * L1.5 widget harness — price-chart-widget
 *
 * Pattern: unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 * Plan: unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Render: loading state, error state, empty-candle state, chart container mounts.
 * - Chart type toggle: Candles / Line buttons call setChartType.
 * - Timeframe buttons: clicking a timeframe calls setTimeframe.
 * - Indicator buttons: clicking an indicator calls toggleIndicator.
 * - SVG internals intentionally skipped (CandlestickChart is a canvas lib).
 *
 * Out of scope: real canvas rendering (browser-only), route wiring (L2), L4 visual.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockTerminalData } from "../_helpers/mock-terminal-context";

const mockData = buildMockTerminalData();

vi.mock("@/components/widgets/terminal/terminal-data-context", () => ({
  useTerminalData: () => mockData,
}));

// CandlestickChart renders a canvas — stub it out for happy-dom
vi.mock("@/components/trading/candlestick-chart", () => ({
  CandlestickChart: () => <div data-testid="candlestick-chart" />,
}));

import { PriceChartWidget } from "@/components/widgets/terminal/price-chart-widget";

describe("price-chart — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockTerminalData());
  });

  describe("render", () => {
    it("shows loading spinner when isLoading is true", () => {
      Object.assign(mockData, buildMockTerminalData({ isLoading: true }));
      render(<PriceChartWidget instanceId="pc-1" />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });

    it("shows error text when context reports an error", () => {
      Object.assign(mockData, buildMockTerminalData({ error: "Market data unavailable" }));
      render(<PriceChartWidget instanceId="pc-1" />);
      expect(screen.getByText("Market data unavailable")).toBeTruthy();
    });

    it("shows empty-state message when candleData is empty", () => {
      Object.assign(mockData, buildMockTerminalData());
      mockData.candleData = [];
      render(<PriceChartWidget instanceId="pc-1" />);
      expect(screen.getByText(/no chart data available/i)).toBeTruthy();
      expect(screen.queryByTestId("candlestick-chart")).toBeNull();
    });

    it("renders the candlestick chart when candleData is present", () => {
      Object.assign(mockData, buildMockTerminalData());
      mockData.candleData = [
        { time: 1700000000, open: 63000, high: 64000, low: 62000, close: 63500, volume: 100 },
        { time: 1700003600, open: 63500, high: 64500, low: 63000, close: 64000, volume: 120 },
      ];
      render(<PriceChartWidget instanceId="pc-1" />);
      expect(screen.getByTestId("candlestick-chart")).toBeTruthy();
    });
  });

  describe("chart type toggle", () => {
    it("renders Candles and Line buttons", () => {
      render(<PriceChartWidget instanceId="pc-1" />);
      expect(screen.getByRole("button", { name: /candles/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /line/i })).toBeTruthy();
    });

    it("clicking Line calls setChartType('line')", () => {
      const setChartType = vi.fn();
      Object.assign(mockData, buildMockTerminalData());
      mockData.setChartType = setChartType;
      render(<PriceChartWidget instanceId="pc-1" />);
      fireEvent.click(screen.getByRole("button", { name: /line/i }));
      expect(setChartType).toHaveBeenCalledWith("line");
    });

    it("clicking Candles calls setChartType('candles')", () => {
      const setChartType = vi.fn();
      Object.assign(mockData, buildMockTerminalData());
      mockData.chartType = "line";
      mockData.setChartType = setChartType;
      render(<PriceChartWidget instanceId="pc-1" />);
      fireEvent.click(screen.getByRole("button", { name: /candles/i }));
      expect(setChartType).toHaveBeenCalledWith("candles");
    });
  });

  describe("timeframe controls", () => {
    it("renders all expected timeframe buttons", () => {
      render(<PriceChartWidget instanceId="pc-1" />);
      for (const tf of ["1m", "5m", "15m", "1H", "4H", "1D"]) {
        expect(screen.getByRole("button", { name: tf })).toBeTruthy();
      }
    });

    it("clicking 4H calls setTimeframe('4H')", () => {
      const setTimeframe = vi.fn();
      Object.assign(mockData, buildMockTerminalData());
      mockData.setTimeframe = setTimeframe;
      render(<PriceChartWidget instanceId="pc-1" />);
      fireEvent.click(screen.getByRole("button", { name: "4H" }));
      expect(setTimeframe).toHaveBeenCalledWith("4H");
    });
  });

  describe("indicator controls", () => {
    it("renders SMA 20, SMA 50, EMA 12, BB indicator buttons", () => {
      render(<PriceChartWidget instanceId="pc-1" />);
      for (const label of ["SMA 20", "SMA 50", "EMA 12", "BB"]) {
        expect(screen.getByRole("button", { name: label })).toBeTruthy();
      }
    });

    it("clicking SMA 20 calls toggleIndicator('sma20')", () => {
      const toggleIndicator = vi.fn();
      Object.assign(mockData, buildMockTerminalData());
      mockData.toggleIndicator = toggleIndicator;
      render(<PriceChartWidget instanceId="pc-1" />);
      fireEvent.click(screen.getByRole("button", { name: "SMA 20" }));
      expect(toggleIndicator).toHaveBeenCalledWith("sma20");
    });
  });
});
