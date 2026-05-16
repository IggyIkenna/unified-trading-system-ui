/**
 * L1.5 widget harness — risk-utilization-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5
 *
 * Scope:
 * - Loading state: spinner shown.
 * - Error state: error message shown.
 * - Empty state when sortedLimits is empty.
 * - Populated state: limit name + entity label visible for each LimitBar.
 * - Top-8 slice: only first 8 limits rendered when more than 8 supplied.
 *
 * Out of scope:
 * - LimitBar internals (bar fill, status colours) — tested in LimitBar unit spec.
 * - Visual regression (L4 — deferred).
 * - Live route wiring (L2 smoke).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockRiskData, buildMockRiskLimit } from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
}));

vi.mock("@/components/trading/limit-bar", () => ({
  LimitBar: ({ label }: { label: string }) => <div data-testid="limit-bar">{label}</div>,
}));

vi.mock("@/components/shared/widget-scroll", () => ({
  WidgetScroll: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/shared/spinner", () => ({
  Spinner: () => <div>Loading...</div>,
}));

import { RiskUtilizationWidget } from "@/components/widgets/risk/risk-utilization-widget";

describe("risk-utilization-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
  });

  describe("loading state", () => {
    it("shows loading spinner when isLoading is true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      render(<RiskUtilizationWidget instanceId="risk-utilization" layoutMode="grid" />);
      expect(screen.getByText(/Loading/i)).toBeTruthy();
    });

    it("does not render limit bars while loading", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      render(<RiskUtilizationWidget instanceId="risk-utilization" layoutMode="grid" />);
      expect(screen.queryAllByTestId("limit-bar")).toHaveLength(0);
    });
  });

  describe("error state", () => {
    it("shows error message when hasError is true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskUtilizationWidget instanceId="risk-utilization" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load utilization data/i)).toBeTruthy();
    });

    it("does not render limit bars on error", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskUtilizationWidget instanceId="risk-utilization" layoutMode="grid" />);
      expect(screen.queryAllByTestId("limit-bar")).toHaveLength(0);
    });
  });

  describe("empty state", () => {
    it("shows no-limits message when sortedLimits is empty", () => {
      Object.assign(mockRiskData, buildMockRiskData({ sortedLimits: [] } as Parameters<typeof buildMockRiskData>[0]));
      mockRiskData.sortedLimits = [];
      render(<RiskUtilizationWidget instanceId="risk-utilization" layoutMode="grid" />);
      expect(screen.getByText(/No limits data/i)).toBeTruthy();
    });
  });

  describe("populated state", () => {
    it("renders one LimitBar per sorted limit", () => {
      const limits = [
        buildMockRiskLimit({ id: "l1", name: "Gross Delta", entity: "portfolio", value: 500000, limit: 1000000 }),
        buildMockRiskLimit({ id: "l2", name: "Net Gamma", entity: "strategy", value: 100000, limit: 500000 }),
      ];
      mockRiskData.sortedLimits = limits;
      render(<RiskUtilizationWidget instanceId="risk-utilization" layoutMode="grid" />);
      expect(screen.getAllByTestId("limit-bar")).toHaveLength(2);
    });

    it("includes entity name in the LimitBar label", () => {
      const limits = [
        buildMockRiskLimit({
          id: "l1",
          name: "Gross Delta Exposure",
          entity: "portfolio",
          value: 500000,
          limit: 1000000,
        }),
      ];
      mockRiskData.sortedLimits = limits;
      render(<RiskUtilizationWidget instanceId="risk-utilization" layoutMode="grid" />);
      expect(screen.getByText(/Gross Delta Exposure \(portfolio\)/i)).toBeTruthy();
    });

    it("slices to a maximum of 8 limits", () => {
      const limits = Array.from({ length: 12 }, (_, i) =>
        buildMockRiskLimit({ id: `l${i}`, name: `Limit ${i}`, entity: "portfolio", value: i * 10000, limit: 1000000 }),
      );
      mockRiskData.sortedLimits = limits;
      render(<RiskUtilizationWidget instanceId="risk-utilization" layoutMode="grid" />);
      expect(screen.getAllByTestId("limit-bar")).toHaveLength(8);
    });

    it("does not show error or empty state when limits are present", () => {
      mockRiskData.sortedLimits = [buildMockRiskLimit({ id: "l1", name: "Gross Delta", entity: "portfolio" })];
      render(<RiskUtilizationWidget instanceId="risk-utilization" layoutMode="grid" />);
      expect(screen.queryByText(/Failed to load utilization data/i)).toBeNull();
      expect(screen.queryByText(/No limits data/i)).toBeNull();
    });
  });
});
