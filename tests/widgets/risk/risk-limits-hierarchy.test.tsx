/**
 * L1.5 widget harness — risk-limits-hierarchy-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Render with mocked RiskData context; assert table rows mount.
 * - Loading state: Skeleton shown, table hidden.
 * - Error state: error message shown.
 * - Node selection: clicking a row sets selectedNode; breadcrumb appears.
 * - Clear button resets selectedNode.
 * - Empty limits list: table body renders with no rows.
 *
 * Out of scope:
 * - Real route wiring (L2 smoke)
 * - Multi-widget cross-selection flows (L3b)
 * - Visual regression (L4 — deferred)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockRiskData, buildMockRiskLimit } from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
  getUtilization: (value: number, limit: number) => (limit === 0 ? 0 : Math.min((value / limit) * 100, 100)),
  getStatusFromUtil: (util: number) => {
    if (util < 70) return "live";
    if (util < 90) return "warning";
    return "critical";
  },
  formatCurrency: (value: number) => {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { RiskLimitsHierarchyWidget } from "@/components/widgets/risk/risk-limits-hierarchy-widget";

describe("risk-limits-hierarchy — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
  });

  describe("render", () => {
    it("mounts widget with risk limits table rows", () => {
      render(<RiskLimitsHierarchyWidget />);
      // Should render the entity name from the default mock limit
      expect(screen.getByText("portfolio")).toBeTruthy();
    });

    it("renders limit entity names from context", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          filteredExposureRows: [],
        }),
      );
      // Override riskLimits with a named limit
      mockRiskData.riskLimits = [buildMockRiskLimit({ entity: "ACME-Corp", entityType: "company" })];
      mockRiskData.sortedLimits = [...mockRiskData.riskLimits];
      render(<RiskLimitsHierarchyWidget />);
      expect(screen.getByText("ACME-Corp")).toBeTruthy();
    });

    it("shows loading skeletons when isLoading=true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      const { container } = render(<RiskLimitsHierarchyWidget />);
      // Skeleton elements should be rendered (6 of them per widget source)
      const skeletons = container.querySelectorAll(".rounded");
      expect(skeletons.length).toBeGreaterThan(0);
      // Table should not appear
      expect(screen.queryByRole("table")).toBeNull();
    });

    it("shows error message when hasError=true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskLimitsHierarchyWidget />);
      expect(screen.getByText(/failed to load risk limits/i)).toBeTruthy();
    });

    it("renders multiple hierarchy levels from sorted limits", () => {
      const limits = [
        buildMockRiskLimit({
          id: "l0",
          entity: "GlobalFund",
          entityType: "company",
          level: 0,
        }),
        buildMockRiskLimit({
          id: "l1",
          entity: "ClientA",
          entityType: "client",
          level: 1,
          parentId: "l0",
        }),
      ];
      mockRiskData.riskLimits = limits;
      mockRiskData.sortedLimits = limits;
      render(<RiskLimitsHierarchyWidget />);
      expect(screen.getByText("GlobalFund")).toBeTruthy();
      expect(screen.getByText("ClientA")).toBeTruthy();
    });
  });

  describe("node selection", () => {
    it("shows breadcrumb scope bar when a node is selected", () => {
      const limits = [
        buildMockRiskLimit({
          id: "l0",
          entity: "FundAlpha",
          entityType: "company",
          level: 0,
        }),
      ];
      mockRiskData.riskLimits = limits;
      mockRiskData.sortedLimits = limits;
      mockRiskData.selectedNode = "FundAlpha";
      render(<RiskLimitsHierarchyWidget />);
      expect(screen.getByText("Scope:")).toBeTruthy();
      expect(screen.getAllByText("FundAlpha").length).toBeGreaterThan(0);
    });

    it("calls setSelectedNode when a table row is clicked", () => {
      const setSelectedNodeSpy = vi.fn();
      mockRiskData.riskLimits = [buildMockRiskLimit({ entity: "ClickableEntity", entityType: "strategy" })];
      mockRiskData.sortedLimits = [...mockRiskData.riskLimits];
      mockRiskData.selectedNode = null;
      mockRiskData.setSelectedNode = setSelectedNodeSpy;
      render(<RiskLimitsHierarchyWidget />);
      const row = screen.getByText("ClickableEntity").closest("tr");
      if (row) fireEvent.click(row);
      expect(setSelectedNodeSpy).toHaveBeenCalledWith("ClickableEntity");
    });

    it("calls setSelectedNode(null) when Clear button is clicked", () => {
      const setSelectedNodeSpy = vi.fn();
      const limits = [
        buildMockRiskLimit({
          entity: "ClearMe",
          entityType: "company",
          level: 0,
        }),
      ];
      mockRiskData.riskLimits = limits;
      mockRiskData.sortedLimits = limits;
      mockRiskData.selectedNode = "ClearMe";
      mockRiskData.setSelectedNode = setSelectedNodeSpy;
      render(<RiskLimitsHierarchyWidget />);
      // "Clear" appears as a button label; use role to target the button specifically
      const clearBtn = screen.getByRole("button", { name: /clear/i });
      fireEvent.click(clearBtn);
      expect(setSelectedNodeSpy).toHaveBeenCalledWith(null);
    });
  });

  describe("empty state", () => {
    it("renders table with no data rows when riskLimits is empty", () => {
      mockRiskData.riskLimits = [];
      mockRiskData.sortedLimits = [];
      render(<RiskLimitsHierarchyWidget />);
      // Table should still mount (with header) but no entity rows
      expect(screen.queryByText("portfolio")).toBeNull();
    });
  });
});
