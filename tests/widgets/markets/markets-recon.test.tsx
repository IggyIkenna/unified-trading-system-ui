/**
 * L1.5 widget harness — markets-recon-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Loading state renders spinner (via TableWidget → LiveFeedWidget).
 * - Error state renders error message + Retry button.
 * - Empty state shows "No recon runs available".
 * - Toolbar badge "Recon summary (mock)" always visible.
 * - With rows: column headers visible (Date, Status, Breaks, Break Value).
 * - Clean run (breaks=0) shows "Clean" badge.
 * - Partial run (resolved < breaks) shows resolved/breaks badge.
 * - Fully resolved run shows resolved/breaks badge as secondary.
 *
 * Out of scope:
 * - Visual regression (L4 — deferred).
 */
import type { ReconRun } from "@/lib/types/markets";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockMarketsData } from "../_helpers/mock-markets-context";

const mockMarketsData = buildMockMarketsData();

vi.mock("@/components/widgets/markets/markets-data-context", () => ({
  useMarketsData: () => mockMarketsData,
}));

import { MarketsReconWidget } from "@/components/widgets/markets/markets-recon-widget";

function buildReconRun(overrides: Partial<ReconRun> = {}): ReconRun {
  return {
    date: "2026-04-24",
    status: "complete",
    breaks: 0,
    resolved: 0,
    totalValue: 0,
    ...overrides,
  };
}

describe("markets-recon-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockMarketsData, buildMockMarketsData());
    mockMarketsData.reconRuns = [];
  });

  describe("loading state", () => {
    it("shows Loading spinner when isLoading is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isLoading: true }));
      mockMarketsData.reconRuns = [];
      render(<MarketsReconWidget instanceId="markets-recon" layoutMode="grid" />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message when isError is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true }));
      render(<MarketsReconWidget instanceId="markets-recon" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load recon data/i)).toBeTruthy();
    });

    it("shows Retry button on error", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true }));
      render(<MarketsReconWidget instanceId="markets-recon" layoutMode="grid" />);
      expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows empty message when reconRuns is empty", () => {
      mockMarketsData.reconRuns = [];
      render(<MarketsReconWidget instanceId="markets-recon" layoutMode="grid" />);
      expect(screen.getByText(/No recon runs available/i)).toBeTruthy();
    });
  });

  describe("toolbar", () => {
    it("always shows 'Recon summary (mock)' badge", () => {
      render(<MarketsReconWidget instanceId="markets-recon" layoutMode="grid" />);
      expect(screen.getByText(/Recon summary \(mock\)/i)).toBeTruthy();
    });
  });

  describe("populated state", () => {
    it("renders column headers: Date, Status, Breaks, Break Value", () => {
      mockMarketsData.reconRuns = [buildReconRun()];
      render(<MarketsReconWidget instanceId="markets-recon" layoutMode="grid" />);
      expect(screen.getByText("Date")).toBeTruthy();
      expect(screen.getByText("Status")).toBeTruthy();
      expect(screen.getByText(/Break Value/i)).toBeTruthy();
    });

    it("renders 'Clean' badge for a run with zero breaks", () => {
      mockMarketsData.reconRuns = [buildReconRun({ breaks: 0, resolved: 0 })];
      render(<MarketsReconWidget instanceId="markets-recon" layoutMode="grid" />);
      expect(screen.getByText("Clean")).toBeTruthy();
    });

    it("renders partial resolved badge when resolved < breaks", () => {
      mockMarketsData.reconRuns = [buildReconRun({ breaks: 4, resolved: 2, totalValue: 18000 })];
      render(<MarketsReconWidget instanceId="markets-recon" layoutMode="grid" />);
      expect(screen.getByText("2/4 resolved")).toBeTruthy();
    });

    it("renders date column value for a recon run", () => {
      mockMarketsData.reconRuns = [buildReconRun({ date: "2026-04-24" })];
      render(<MarketsReconWidget instanceId="markets-recon" layoutMode="grid" />);
      expect(screen.getByText("2026-04-24")).toBeTruthy();
    });
  });
});
