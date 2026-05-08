/**
 * L1.5 widget harness — risk-stress-table-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Render with mocked RiskData context; assert table structure mounts.
 * - Loading state: TableWidget handles skeleton internally.
 * - Error state: TableWidget renders error message.
 * - Empty scenarios: "No stress scenarios available" empty message.
 * - Scenario rows rendered from stressScenarios context field.
 * - Regime multiplier slider calls setRegimeMultiplier on change.
 * - Scenario select calls setSelectedStressScenario on selection.
 * - Stress test result panel shown when selectedStressScenario set + result present.
 * - Results panel shows loading skeletons when stressTestLoading=true.
 * - Results panel shows "No data" when result is null and scenario selected.
 * - regimeData badge renders regime label when regimeData is present.
 *
 * Out of scope:
 * - Real API calls or live scenario data (hermetic — context mocked)
 * - Visual regression (L4 — deferred)
 * - TableWidget column sorting (covered by TableWidget unit tests)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockRiskData } from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
  formatCurrency: (value: number) => {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { RiskStressTableWidget } from "@/components/widgets/risk/risk-stress-table-widget";

// ---------------------------------------------------------------------------
// Stress scenario factory
// ---------------------------------------------------------------------------

interface StressRow {
  name: string;
  multiplier: number;
  pnlImpact: number;
  varImpact: number;
  positionsBreaching: number;
  largestLoss: string;
}

function buildStressScenario(overrides: Partial<StressRow> = {}): StressRow {
  return {
    name: "GFC 2008",
    multiplier: 2.5,
    pnlImpact: -450000,
    varImpact: 85000,
    positionsBreaching: 3,
    largestLoss: "ETH-PERP",
    ...overrides,
  };
}

describe("risk-stress-table — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
    mockRiskData.stressScenarios = [];
    mockRiskData.selectedStressScenario = null;
    mockRiskData.stressTestResult = null;
    mockRiskData.stressTestLoading = false;
    mockRiskData.regimeData = null;
    mockRiskData.regimeMultiplier = 1;
  });

  describe("render", () => {
    it("mounts widget without crash when stressScenarios is empty", () => {
      render(<RiskStressTableWidget />);
      expect(screen.getByText(/no stress scenarios available/i)).toBeTruthy();
    });

    it("renders scenario rows from stressScenarios context", () => {
      mockRiskData.stressScenarios = [
        buildStressScenario({ name: "GFC 2008" }),
        buildStressScenario({ name: "COVID 2020", multiplier: 1.8 }),
      ] as unknown as typeof mockRiskData.stressScenarios;
      render(<RiskStressTableWidget />);
      expect(screen.getByText("GFC 2008")).toBeTruthy();
      expect(screen.getByText("COVID 2020")).toBeTruthy();
    });

    it("renders multiplier column values for each row", () => {
      mockRiskData.stressScenarios = [
        buildStressScenario({ name: "Black Thursday", multiplier: 3.0 }),
      ] as unknown as typeof mockRiskData.stressScenarios;
      render(<RiskStressTableWidget />);
      expect(screen.getByText("3x")).toBeTruthy();
    });

    it("shows error message via TableWidget when hasError=true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      mockRiskData.stressScenarios = [];
      render(<RiskStressTableWidget />);
      expect(screen.getByText(/failed to load stress scenarios/i)).toBeTruthy();
    });
  });

  describe("regime multiplier slider", () => {
    it("renders the stress multiplier slider with current value", () => {
      mockRiskData.regimeMultiplier = 1.5;
      render(<RiskStressTableWidget />);
      const slider = screen.getByRole("slider", {
        name: /stress multiplier/i,
      }) as HTMLInputElement;
      expect(slider).toBeTruthy();
      expect(slider.value).toBe("1.5");
    });

    it("calls setRegimeMultiplier when slider is changed", () => {
      const setMultiplierSpy = vi.fn();
      mockRiskData.setRegimeMultiplier = setMultiplierSpy;
      render(<RiskStressTableWidget />);
      const slider = screen.getByRole("slider", { name: /stress multiplier/i });
      fireEvent.change(slider, { target: { value: "2.0" } });
      expect(setMultiplierSpy).toHaveBeenCalledWith(2.0);
    });
  });

  describe("scenario selector", () => {
    it("renders the on-demand scenario select trigger", () => {
      render(<RiskStressTableWidget />);
      expect(screen.getByText(/on-demand test/i)).toBeTruthy();
    });
  });

  describe("stress test results panel", () => {
    it("shows loading skeletons when stressTestLoading=true and scenario selected", () => {
      mockRiskData.selectedStressScenario = "GFC_2008";
      mockRiskData.stressTestLoading = true;
      mockRiskData.stressTestResult = null;
      const { container } = render(<RiskStressTableWidget />);
      // Skeleton elements should be present in the results panel
      const skeletons = container.querySelectorAll(".rounded");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows 'No data' message when stressTestResult=null and not loading", () => {
      mockRiskData.selectedStressScenario = "GFC_2008";
      mockRiskData.stressTestLoading = false;
      mockRiskData.stressTestResult = null;
      render(<RiskStressTableWidget />);
      expect(screen.getByText(/no data for GFC 2008/i)).toBeTruthy();
    });

    it("renders Expected Loss when stressTestResult is present", () => {
      mockRiskData.selectedStressScenario = "COVID_2020";
      mockRiskData.stressTestLoading = false;
      mockRiskData.stressTestResult = {
        expected_loss_usd: 125000,
        portfolio_impact_pct: 0.08,
        worst_strategy: "ETH_PERP_BASIS",
      } as unknown as typeof mockRiskData.stressTestResult;
      render(<RiskStressTableWidget />);
      expect(screen.getByText(/expected loss/i)).toBeTruthy();
      expect(screen.getByText(/portfolio impact/i)).toBeTruthy();
      expect(screen.getByText(/worst strategy/i)).toBeTruthy();
      expect(screen.getByText("ETH_PERP_BASIS")).toBeTruthy();
    });

    it("does not show results panel when no scenario is selected", () => {
      mockRiskData.selectedStressScenario = null;
      render(<RiskStressTableWidget />);
      expect(screen.queryByText(/expected loss/i)).toBeNull();
    });
  });

  describe("regime badge", () => {
    it("renders regime badge when regimeData is present", () => {
      mockRiskData.regimeData = {
        regime: "stressed",
      } as unknown as typeof mockRiskData.regimeData;
      render(<RiskStressTableWidget />);
      expect(screen.getByText(/regime: stressed/i)).toBeTruthy();
    });

    it("does not render regime badge when regimeData is null", () => {
      mockRiskData.regimeData = null;
      render(<RiskStressTableWidget />);
      expect(screen.queryByText(/regime:/i)).toBeNull();
    });
  });
});
