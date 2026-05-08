/**
 * L1.5 widget harness — bundle-builder-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Root testid mounts.
 * - Empty state (no steps) shows "No legs in this bundle yet" + Add leg button.
 * - Add leg button calls addStep().
 * - Steps section renders when steps are present.
 * - Remove step button calls removeStep() with the correct step id.
 * - Move step up/down buttons call moveStep() with correct args.
 * - Duplicate step button calls duplicateStep().
 * - Submit bundle button visible and enabled when steps present and not readOnly.
 * - Submit bundle button disabled when readOnly=true.
 * - Template toggle button shows/hides template gallery.
 * - Template gallery renders template names.
 * - Clear all button visible when steps present.
 * - KPI strip metrics (Buy notional, Sell notional, Gas, Net P&L) visible when steps present.
 *
 * Out of scope: DnD internals, Simulate backend stub, real route wiring (L2), visual regression (L4).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildMockBundlesData,
  buildMockBundleStep,
  buildMockBundleTemplate,
  buildMockSellStep,
} from "../_helpers/mock-bundles-context";

const mockData = buildMockBundlesData();

vi.mock("@/components/widgets/bundles/bundles-data-context", () => ({
  useBundlesData: () => mockData,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { BundleBuilderWidget } from "@/components/widgets/bundles/bundle-builder-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { toast } from "sonner";

const noopProps = {} as unknown as WidgetComponentProps;

describe("bundle-builder-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockBundlesData());
    vi.clearAllMocks();
  });

  describe("render", () => {
    it("mounts root testid", () => {
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByTestId("bundle-builder-widget")).toBeTruthy();
    });

    it("renders Bundle Builder heading", () => {
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByText("Bundle Builder")).toBeTruthy();
    });

    it("renders template toggle button", () => {
      render(<BundleBuilderWidget {...noopProps} />);
      // showTemplates=true by default — button reads "Hide templates"
      expect(screen.getByTestId("template-toggle")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows 'No legs in this bundle yet' when steps list is empty and templates are hidden", () => {
      Object.assign(mockData, buildMockBundlesData({ steps: [], showTemplates: false }));
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByText(/no legs in this bundle yet/i)).toBeTruthy();
    });

    it("shows Add leg button in empty state", () => {
      Object.assign(mockData, buildMockBundlesData({ steps: [], showTemplates: false }));
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByTestId("add-leg-button")).toBeTruthy();
    });

    it("calls addStep() when Add leg button clicked in empty state", () => {
      const addStep = vi.fn();
      Object.assign(mockData, buildMockBundlesData({ steps: [], showTemplates: false, addStep }));
      render(<BundleBuilderWidget {...noopProps} />);
      fireEvent.click(screen.getByTestId("add-leg-button"));
      expect(addStep).toHaveBeenCalledTimes(1);
    });
  });

  describe("template gallery", () => {
    it("renders template names when showTemplates=true", () => {
      const template = buildMockBundleTemplate({ name: "Flash Loan Arb" });
      Object.assign(mockData, buildMockBundlesData({ steps: [], showTemplates: true, templates: [template] }));
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByText("Flash Loan Arb")).toBeTruthy();
    });

    it("toggles showTemplates when template-toggle button clicked", () => {
      const setShowTemplates = vi.fn();
      Object.assign(mockData, buildMockBundlesData({ steps: [], showTemplates: false, setShowTemplates }));
      render(<BundleBuilderWidget {...noopProps} />);
      fireEvent.click(screen.getByTestId("template-toggle"));
      expect(setShowTemplates).toHaveBeenCalledWith(true);
    });
  });

  describe("steps section", () => {
    it("renders 'Visual order' section heading when steps are present", () => {
      const step = buildMockBundleStep();
      Object.assign(mockData, buildMockBundlesData({ steps: [step], showTemplates: false }));
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByText("Visual order")).toBeTruthy();
    });

    it("renders Leg 1 badge when one step is present", () => {
      const step = buildMockBundleStep();
      Object.assign(mockData, buildMockBundlesData({ steps: [step], showTemplates: false }));
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByText("Leg 1")).toBeTruthy();
    });

    it("calls removeStep() with step id when remove button clicked", () => {
      const removeStep = vi.fn();
      const step = buildMockBundleStep({ id: "step-x" });
      Object.assign(mockData, buildMockBundlesData({ steps: [step], showTemplates: false, removeStep }));
      render(<BundleBuilderWidget {...noopProps} />);
      const removeBtn = screen.getByLabelText("Remove leg 1");
      fireEvent.click(removeBtn);
      expect(removeStep).toHaveBeenCalledWith("step-x");
    });

    it("calls duplicateStep() when duplicate button clicked", () => {
      const duplicateStep = vi.fn();
      const step = buildMockBundleStep({ id: "step-dup" });
      Object.assign(mockData, buildMockBundlesData({ steps: [step], showTemplates: false, duplicateStep }));
      render(<BundleBuilderWidget {...noopProps} />);
      fireEvent.click(screen.getByLabelText("Duplicate leg 1"));
      expect(duplicateStep).toHaveBeenCalledWith("step-dup");
    });

    it("calls moveStep() with 'down' when chevron-down clicked on first of two steps", () => {
      const moveStep = vi.fn();
      const step1 = buildMockBundleStep({ id: "s1" });
      const step2 = buildMockBundleStep({ id: "s2" });
      Object.assign(mockData, buildMockBundlesData({ steps: [step1, step2], showTemplates: false, moveStep }));
      render(<BundleBuilderWidget {...noopProps} />);
      fireEvent.click(screen.getByLabelText("Move leg 1 down"));
      expect(moveStep).toHaveBeenCalledWith("s1", "down");
    });

    it("calls moveStep() with 'up' when chevron-up clicked on second step", () => {
      const moveStep = vi.fn();
      const step1 = buildMockBundleStep({ id: "s1" });
      const step2 = buildMockBundleStep({ id: "s2" });
      Object.assign(mockData, buildMockBundlesData({ steps: [step1, step2], showTemplates: false, moveStep }));
      render(<BundleBuilderWidget {...noopProps} />);
      fireEvent.click(screen.getByLabelText("Move leg 2 up"));
      expect(moveStep).toHaveBeenCalledWith("s2", "up");
    });

    it("renders Clear all button when steps are present", () => {
      const step = buildMockBundleStep();
      Object.assign(mockData, buildMockBundlesData({ steps: [step], showTemplates: false }));
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByText("Clear all")).toBeTruthy();
    });
  });

  describe("KPI strip", () => {
    it("renders Buy notional metric label when steps are present", () => {
      const step = buildMockBundleStep({ quantity: "1", price: "50000" });
      Object.assign(
        mockData,
        buildMockBundlesData({
          steps: [step],
          showTemplates: false,
          totalCost: 50000,
          totalRevenue: 0,
          estimatedGas: 14.5,
          netPnl: -50014.5,
        }),
      );
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByText("Buy notional")).toBeTruthy();
    });

    it("renders Sell notional metric label when steps are present", () => {
      const step = buildMockSellStep({ quantity: "1", price: "50100" });
      Object.assign(
        mockData,
        buildMockBundlesData({
          steps: [step],
          showTemplates: false,
          totalCost: 0,
          totalRevenue: 50100,
          estimatedGas: 14.5,
          netPnl: 50085.5,
        }),
      );
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByText("Sell notional")).toBeTruthy();
    });

    it("renders Net P&L metric label when steps are present", () => {
      const step = buildMockBundleStep();
      Object.assign(
        mockData,
        buildMockBundlesData({
          steps: [step],
          showTemplates: false,
          totalCost: 100,
          totalRevenue: 0,
          estimatedGas: 14.5,
          netPnl: -114.5,
        }),
      );
      render(<BundleBuilderWidget {...noopProps} />);
      expect(screen.getByText("Net P&L")).toBeTruthy();
    });
  });

  describe("submit bundle button", () => {
    it("is visible and enabled when steps present and not readOnly", () => {
      const step = buildMockBundleStep();
      Object.assign(mockData, buildMockBundlesData({ steps: [step], showTemplates: false, readOnly: false }));
      render(<BundleBuilderWidget {...noopProps} />);
      const btn = screen.getByTestId("submit-bundle-button") as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.disabled).toBe(false);
    });

    it("is disabled when readOnly=true", () => {
      const step = buildMockBundleStep();
      Object.assign(mockData, buildMockBundlesData({ steps: [step], showTemplates: false, readOnly: true }));
      render(<BundleBuilderWidget {...noopProps} />);
      const btn = screen.getByTestId("submit-bundle-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("fires toast.success when Submit bundle clicked", () => {
      const step = buildMockBundleStep();
      Object.assign(mockData, buildMockBundlesData({ steps: [step], showTemplates: false, readOnly: false }));
      render(<BundleBuilderWidget {...noopProps} />);
      fireEvent.click(screen.getByTestId("submit-bundle-button"));
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it("submit toast description mentions step count", () => {
      const step1 = buildMockBundleStep({ id: "sa" });
      const step2 = buildMockSellStep({ id: "sb" });
      Object.assign(mockData, buildMockBundlesData({ steps: [step1, step2], showTemplates: false, readOnly: false }));
      render(<BundleBuilderWidget {...noopProps} />);
      fireEvent.click(screen.getByTestId("submit-bundle-button"));
      const call = (toast.success as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(JSON.stringify(call)).toContain("2");
    });
  });
});
