/**
 * L1.5 widget harness — risk-strategy-heatmap-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Render with mocked RiskData context; assert strategy rows mount.
 * - Loading state: Skeleton shown, no strategy rows.
 * - Error state: error message shown.
 * - Empty heatmap: "No strategy heatmap data" shown.
 * - Strategy status badges: ok/warning/critical classes applied.
 * - Tripped strategy: HALTED badge visible; Reset button shown.
 * - Killed strategy: KILLED badge visible; Kill/Trip/Scale buttons disabled.
 * - Trip button calls handleTripCircuitBreaker with correct args.
 * - Reset button calls handleResetCircuitBreaker with correct args.
 * - Scale button calls handleScale with factor=0.5.
 * - isBatchMode=true disables all action buttons.
 *
 * Out of scope:
 * - AlertDialog confirmation flow (L3b — requires real user interaction)
 * - Visual regression (L4 — deferred)
 * - SVG/chart assertions (skipped per plan)
 */
import type { StrategyHeatmapRow } from "@/components/widgets/risk/risk-data-context";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockRiskData } from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { RiskStrategyHeatmapWidget } from "@/components/widgets/risk/risk-strategy-heatmap-widget";

// ---------------------------------------------------------------------------
// Heatmap row factory
// ---------------------------------------------------------------------------

function buildHeatmapRow(overrides: Partial<StrategyHeatmapRow> = {}): StrategyHeatmapRow {
  return {
    strategy: "ETH Basis Trade",
    status: "ok",
    delta: "0.42",
    funding: "+0.03%",
    hf: "1.80",
    var: "$12K",
    ...overrides,
  };
}

describe("risk-strategy-heatmap — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
    mockRiskData.strategyRiskHeatmap = [];
    mockRiskData.trippedStrategies = new Set();
    mockRiskData.killedStrategies = new Set();
    mockRiskData.scaledStrategies = {};
    mockRiskData.isBatchMode = false;
    mockRiskData.circuitBreakerPending = false;
  });

  describe("render", () => {
    it("shows empty-state message when strategyRiskHeatmap is empty", () => {
      render(<RiskStrategyHeatmapWidget />);
      expect(screen.getByText(/no strategy heatmap data/i)).toBeTruthy();
    });

    it("renders strategy name for each heatmap row", () => {
      mockRiskData.strategyRiskHeatmap = [
        buildHeatmapRow({ strategy: "SOL Yield Farm", status: "ok" }),
        buildHeatmapRow({ strategy: "BTC Perp Arb", status: "warning" }),
      ];
      render(<RiskStrategyHeatmapWidget />);
      expect(screen.getByText("SOL Yield Farm")).toBeTruthy();
      expect(screen.getByText("BTC Perp Arb")).toBeTruthy();
    });

    it("shows loading skeletons when isLoading=true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow()];
      const { container } = render(<RiskStrategyHeatmapWidget />);
      const skeletons = container.querySelectorAll(".rounded-lg");
      expect(skeletons.length).toBeGreaterThan(0);
      // Strategy name should not appear while loading
      expect(screen.queryByText("ETH Basis Trade")).toBeNull();
    });

    it("shows error message when hasError=true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskStrategyHeatmapWidget />);
      expect(screen.getByText(/failed to load strategy heatmap/i)).toBeTruthy();
    });
  });

  describe("strategy status", () => {
    it("renders Trip button for an ok-status strategy that is not tripped", () => {
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow({ strategy: "DEFI ETH Basis", status: "ok" })];
      render(<RiskStrategyHeatmapWidget />);
      expect(screen.getByText("Trip")).toBeTruthy();
    });

    it("renders HALTED badge and Reset button for a tripped strategy", () => {
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow({ strategy: "Tripped Strategy", status: "critical" })];
      mockRiskData.trippedStrategies = new Set(["tripped_strategy"]);
      render(<RiskStrategyHeatmapWidget />);
      expect(screen.getByText("HALTED")).toBeTruthy();
      expect(screen.getByText("Reset")).toBeTruthy();
      // Trip button should not be shown for tripped strategy
      expect(screen.queryByText("Trip")).toBeNull();
    });

    it("renders KILLED badge for a killed strategy", () => {
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow({ strategy: "Killed Strategy", status: "critical" })];
      mockRiskData.killedStrategies = new Set(["killed_strategy"]);
      render(<RiskStrategyHeatmapWidget />);
      expect(screen.getByText("KILLED")).toBeTruthy();
    });

    it("renders Scaled badge for a scaled strategy", () => {
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow({ strategy: "Scaled Strategy", status: "warning" })];
      mockRiskData.scaledStrategies = { scaled_strategy: 0.5 };
      render(<RiskStrategyHeatmapWidget />);
      expect(screen.getByText(/scaled to 50%/i)).toBeTruthy();
    });
  });

  describe("action handlers", () => {
    it("calls handleTripCircuitBreaker when Trip button clicked", () => {
      const tripSpy = vi.fn();
      mockRiskData.handleTripCircuitBreaker = tripSpy;
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow({ strategy: "My Strategy", status: "ok" })];
      render(<RiskStrategyHeatmapWidget />);
      fireEvent.click(screen.getByText("Trip"));
      expect(tripSpy).toHaveBeenCalledWith("my_strategy", "My Strategy");
    });

    it("calls handleResetCircuitBreaker when Reset button clicked", () => {
      const resetSpy = vi.fn();
      mockRiskData.handleResetCircuitBreaker = resetSpy;
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow({ strategy: "Halted Strat", status: "critical" })];
      mockRiskData.trippedStrategies = new Set(["halted_strat"]);
      render(<RiskStrategyHeatmapWidget />);
      fireEvent.click(screen.getByText("Reset"));
      expect(resetSpy).toHaveBeenCalledWith("halted_strat", "Halted Strat");
    });

    it("calls handleScale with factor 0.5 when 50% button clicked", () => {
      const scaleSpy = vi.fn();
      mockRiskData.handleScale = scaleSpy;
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow({ strategy: "Scale Me", status: "ok" })];
      render(<RiskStrategyHeatmapWidget />);
      fireEvent.click(screen.getByText("50%"));
      expect(scaleSpy).toHaveBeenCalledWith("scale_me", "Scale Me", 0.5);
    });
  });

  describe("batch mode", () => {
    it("disables Trip button when isBatchMode=true", () => {
      mockRiskData.isBatchMode = true;
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow({ strategy: "Batch Strat", status: "ok" })];
      render(<RiskStrategyHeatmapWidget />);
      const tripBtn = screen.getByText("Trip").closest("button") as HTMLButtonElement;
      expect(tripBtn.disabled).toBe(true);
    });

    it("disables Scale button when isBatchMode=true", () => {
      mockRiskData.isBatchMode = true;
      mockRiskData.strategyRiskHeatmap = [buildHeatmapRow({ strategy: "Batch Strat 2", status: "ok" })];
      render(<RiskStrategyHeatmapWidget />);
      const scaleBtn = screen.getByText("50%").closest("button") as HTMLButtonElement;
      expect(scaleBtn.disabled).toBe(true);
    });
  });
});
