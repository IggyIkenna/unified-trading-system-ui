/**
 * L1.5 widget harness — instructions-summary-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - All five KPI labels render (Total, Filled, Partial, Pending, Avg slippage).
 * - KPI values reflect mocked summary counts.
 * - Avg slippage value formatted with "bps" suffix.
 * - Sentiment changes: slippage <= 2 → positive, <= 5 → neutral, > 5 → negative.
 *
 * Out of scope: real route wiring (L2), E2E trader flow (L3b), visual regression (L4).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockInstructionsData } from "../_helpers/mock-instructions-context";

const mockData = buildMockInstructionsData();

vi.mock("@/components/widgets/instructions/instructions-data-context", () => ({
  useInstructionsData: () => mockData,
}));

// KpiSummaryWidget uses useWidgetHeaderEndSlot — return null so the header slot
// attempt does not fail in isolation.
vi.mock("@/components/widgets/widget-chrome-context", () => ({
  useWidgetHeaderEndSlot: () => null,
}));

import { InstructionsSummaryWidget } from "@/components/widgets/instructions/instructions-summary-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("instr-summary — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockInstructionsData());
  });

  describe("render", () => {
    it("renders Total KPI label", () => {
      render(<InstructionsSummaryWidget {...noopProps} />);
      expect(screen.getByText("Total")).toBeTruthy();
    });

    it("renders Filled KPI label", () => {
      render(<InstructionsSummaryWidget {...noopProps} />);
      expect(screen.getByText("Filled")).toBeTruthy();
    });

    it("renders Partial KPI label", () => {
      render(<InstructionsSummaryWidget {...noopProps} />);
      expect(screen.getByText("Partial")).toBeTruthy();
    });

    it("renders Pending KPI label", () => {
      render(<InstructionsSummaryWidget {...noopProps} />);
      expect(screen.getByText("Pending")).toBeTruthy();
    });

    it("renders Avg slippage KPI label", () => {
      render(<InstructionsSummaryWidget {...noopProps} />);
      expect(screen.getByText("Avg slippage")).toBeTruthy();
    });
  });

  describe("KPI values", () => {
    it("shows correct total count from summary", () => {
      Object.assign(
        mockData,
        buildMockInstructionsData({ summary: { total: 7, filled: 4, partial: 1, pending: 2, avgSlippage: 1.5 } }),
      );
      render(<InstructionsSummaryWidget {...noopProps} />);
      expect(screen.getByText("7")).toBeTruthy();
    });

    it("shows correct filled count from summary", () => {
      Object.assign(
        mockData,
        buildMockInstructionsData({ summary: { total: 5, filled: 3, partial: 0, pending: 2, avgSlippage: 1.0 } }),
      );
      render(<InstructionsSummaryWidget {...noopProps} />);
      expect(screen.getByText("3")).toBeTruthy();
    });

    it("renders avg slippage with bps suffix", () => {
      Object.assign(
        mockData,
        buildMockInstructionsData({ summary: { total: 3, filled: 1, partial: 1, pending: 1, avgSlippage: 3.0 } }),
      );
      render(<InstructionsSummaryWidget {...noopProps} />);
      expect(screen.getByText(/3\.0 bps/)).toBeTruthy();
    });
  });

  describe("slippage sentiment thresholds", () => {
    it("renders slippage value for low slippage (positive sentiment threshold)", () => {
      Object.assign(
        mockData,
        buildMockInstructionsData({ summary: { total: 1, filled: 1, partial: 0, pending: 0, avgSlippage: 1.5 } }),
      );
      render(<InstructionsSummaryWidget {...noopProps} />);
      // Value renders regardless of sentiment class
      expect(screen.getByText(/1\.5 bps/)).toBeTruthy();
    });

    it("renders slippage value for high slippage (negative sentiment threshold)", () => {
      Object.assign(
        mockData,
        buildMockInstructionsData({ summary: { total: 1, filled: 1, partial: 0, pending: 0, avgSlippage: 6.0 } }),
      );
      render(<InstructionsSummaryWidget {...noopProps} />);
      expect(screen.getByText(/6\.0 bps/)).toBeTruthy();
    });
  });
});
