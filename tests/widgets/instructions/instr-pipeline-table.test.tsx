/**
 * L1.5 widget harness — instructions-pipeline-table-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Toolbar mounts with filter selects and Refresh button.
 * - Table header columns (Signal, Instruction, Fill / Diff) render.
 * - Instructions rows render direction and side labels.
 * - Empty state shown when filteredInstructions is empty.
 * - Refresh button calls refresh() + fires toast.
 * - Reset filters button visible when filterValues has active entries.
 *
 * Out of scope: real route wiring (L2), E2E row click → detail panel (L3b), visual regression (L4).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockInstructionsData, buildMockInstruction } from "../_helpers/mock-instructions-context";

const mockData = buildMockInstructionsData();

vi.mock("@/components/widgets/instructions/instructions-data-context", () => ({
  useInstructionsData: () => mockData,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { InstructionsPipelineTableWidget } from "@/components/widgets/instructions/instructions-pipeline-table-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { toast } from "sonner";

const noopProps = {} as unknown as WidgetComponentProps;

describe("instr-pipeline-table — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockInstructionsData());
    vi.clearAllMocks();
  });

  describe("render", () => {
    it("renders the Refresh button", () => {
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      expect(screen.getByText("Refresh")).toBeTruthy();
    });

    it("renders Signal column header", () => {
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      expect(screen.getByText("Signal")).toBeTruthy();
    });

    it("renders Instruction column header", () => {
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      expect(screen.getByText("Instruction")).toBeTruthy();
    });

    it("renders Fill / Diff column header", () => {
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      expect(screen.getByText("Fill / Diff")).toBeTruthy();
    });

    it("renders strategy type label from mocked instruction", () => {
      const inst = buildMockInstruction({ strategyType: "MOMENTUM" });
      Object.assign(mockData, buildMockInstructionsData({ filteredInstructions: [inst] }));
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      expect(screen.getByText("MOMENTUM")).toBeTruthy();
    });

    it("renders signal direction for each instruction row", () => {
      const inst = buildMockInstruction({
        signal: { direction: "LONG", confidence: 0.8, timestamp: "2026-04-24T10:00:00Z" },
      });
      Object.assign(mockData, buildMockInstructionsData({ filteredInstructions: [inst] }));
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      expect(screen.getByText("LONG")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows 'No instructions match the current filters' when list is empty", () => {
      Object.assign(mockData, buildMockInstructionsData({ filteredInstructions: [] }));
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      expect(screen.getByText(/no instructions match the current filters/i)).toBeTruthy();
    });
  });

  describe("refresh action", () => {
    it("calls refresh() when Refresh button is clicked", () => {
      const refresh = vi.fn();
      Object.assign(mockData, buildMockInstructionsData({ refresh }));
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      fireEvent.click(screen.getByText("Refresh"));
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it("fires toast.info when Refresh button is clicked", () => {
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      fireEvent.click(screen.getByText("Refresh"));
      expect(toast.info).toHaveBeenCalledTimes(1);
    });
  });

  describe("reset filters button", () => {
    it("shows Reset button when a filter is active", () => {
      Object.assign(mockData, buildMockInstructionsData({ filterValues: { strategyType: "MOMENTUM" } }));
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      expect(screen.getByText(/reset/i)).toBeTruthy();
    });

    it("hides Reset button when no filters are active", () => {
      Object.assign(mockData, buildMockInstructionsData({ filterValues: {} }));
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      expect(screen.queryByText(/^reset/i)).toBeNull();
    });

    it("calls resetFilters() when Reset button is clicked", () => {
      const resetFilters = vi.fn();
      Object.assign(mockData, buildMockInstructionsData({ filterValues: { strategyType: "MOMENTUM" }, resetFilters }));
      render(<InstructionsPipelineTableWidget {...noopProps} />);
      fireEvent.click(screen.getByText(/reset/i));
      expect(resetFilters).toHaveBeenCalledTimes(1);
    });
  });
});
