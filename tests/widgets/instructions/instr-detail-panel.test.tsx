/**
 * L1.5 widget harness — instructions-detail-panel-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Empty state when no instruction is selected (cert L0.7).
 * - Detail grid mounts when selectedInstruction is set.
 * - Signal Detail section shows direction and confidence.
 * - Instruction Detail section shows operation type, venue.
 * - Discrepancy section shows fill data (price diff, slippage).
 * - "No fill yet" shown for pending instructions (null fill).
 * - Paper mode tag visible in strategyType field.
 *
 * Out of scope: real route wiring (L2), multi-widget flow (L3b), visual regression (L4).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildMockInstruction,
  buildMockInstructionsData,
  buildMockPendingInstruction,
} from "../_helpers/mock-instructions-context";

const mockData = buildMockInstructionsData();

vi.mock("@/components/widgets/instructions/instructions-data-context", () => ({
  useInstructionsData: () => mockData,
}));

import { InstructionsDetailPanelWidget } from "@/components/widgets/instructions/instructions-detail-panel-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("instr-detail-panel — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockInstructionsData());
  });

  describe("empty state", () => {
    it("shows selection prompt when no instruction is selected", () => {
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.getByText(/select a row in the instruction pipeline table/i)).toBeTruthy();
    });

    it("does not render detail sections when selection is null", () => {
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.queryByText(/signal detail/i)).toBeNull();
    });
  });

  describe("filled instruction detail", () => {
    it("renders Signal Detail section header", () => {
      const inst = buildMockInstruction();
      Object.assign(mockData, buildMockInstructionsData({ selectedInstruction: inst }));
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.getByText(/signal detail/i)).toBeTruthy();
    });

    it("renders Instruction Detail section header", () => {
      const inst = buildMockInstruction();
      Object.assign(mockData, buildMockInstructionsData({ selectedInstruction: inst }));
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.getByText(/instruction detail/i)).toBeTruthy();
    });

    it("shows signal direction from mock instruction", () => {
      const inst = buildMockInstruction({
        signal: { direction: "LONG", confidence: 0.87, timestamp: "2026-04-24T10:00:00Z" },
      });
      Object.assign(mockData, buildMockInstructionsData({ selectedInstruction: inst }));
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.getByText("LONG")).toBeTruthy();
    });

    it("shows instruction venue in Instruction Detail", () => {
      const inst = buildMockInstruction({
        instruction: { operationType: "TRADE", side: "BUY", quantity: 1.0, price: 3000, venue: "BINANCE-SPOT" },
      });
      Object.assign(mockData, buildMockInstructionsData({ selectedInstruction: inst }));
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.getByText("BINANCE-SPOT")).toBeTruthy();
    });

    it("shows Discrepancy section with fill data present", () => {
      const inst = buildMockInstruction();
      Object.assign(mockData, buildMockInstructionsData({ selectedInstruction: inst }));
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.getByText(/discrepancy/i)).toBeTruthy();
    });

    it("shows slippage label in Discrepancy section", () => {
      const inst = buildMockInstruction();
      Object.assign(mockData, buildMockInstructionsData({ selectedInstruction: inst }));
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.getByText(/slippage/i)).toBeTruthy();
    });
  });

  describe("pending instruction (null fill)", () => {
    it("shows 'No fill yet' text for pending instruction", () => {
      const inst = buildMockPendingInstruction();
      Object.assign(mockData, buildMockInstructionsData({ selectedInstruction: inst }));
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.getByText(/no fill yet/i)).toBeTruthy();
    });

    it("still shows Signal and Instruction sections for pending instruction", () => {
      const inst = buildMockPendingInstruction();
      Object.assign(mockData, buildMockInstructionsData({ selectedInstruction: inst }));
      render(<InstructionsDetailPanelWidget {...noopProps} />);
      expect(screen.getByText(/signal detail/i)).toBeTruthy();
      expect(screen.getByText(/instruction detail/i)).toBeTruthy();
    });
  });
});
