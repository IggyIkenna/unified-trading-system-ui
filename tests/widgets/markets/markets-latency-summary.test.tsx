/**
 * L1.5 widget harness — markets-latency-summary-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Loading state renders spinner.
 * - Error state renders error message.
 * - Empty state when latencyMetrics is empty.
 * - With metrics: service name visible, stage count visible.
 * - View controls: Cross/Series buttons visible.
 * - Data mode controls: Live/Batch/Compare buttons visible.
 * - "Clear selection" button visible when a service is selected.
 * - Badge shows correct label for each data mode.
 *
 * Out of scope:
 * - onClick interactions that call setSelectedLatencyService (L3/L4).
 * - Visual regression (L4 — deferred).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockLatencyMetric, buildMockMarketsData } from "../_helpers/mock-markets-context";

const mockMarketsData = buildMockMarketsData();

vi.mock("@/components/widgets/markets/markets-data-context", () => ({
  useMarketsData: () => mockMarketsData,
}));

import { MarketsLatencySummaryWidget } from "@/components/widgets/markets/markets-latency-summary-widget";

describe("markets-latency-summary-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockMarketsData, buildMockMarketsData());
  });

  describe("loading state", () => {
    it("shows Loading spinner when isLoading is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isLoading: true }));
      render(<MarketsLatencySummaryWidget instanceId="markets-latency-summary" layoutMode="grid" />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message when isError is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true }));
      render(<MarketsLatencySummaryWidget instanceId="markets-latency-summary" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load latency metrics/i)).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows no-data message when latencyMetrics is empty", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ latencyMetrics: [] }));
      render(<MarketsLatencySummaryWidget instanceId="markets-latency-summary" layoutMode="grid" />);
      expect(screen.getByText(/No latency data available/i)).toBeTruthy();
    });
  });

  describe("populated state", () => {
    it("renders service name from latencyMetrics", () => {
      const metric = buildMockLatencyMetric({ service: "Execution Service" });
      Object.assign(mockMarketsData, buildMockMarketsData({ latencyMetrics: [metric] }));
      render(<MarketsLatencySummaryWidget instanceId="markets-latency-summary" layoutMode="grid" />);
      expect(screen.getByText("Execution Service")).toBeTruthy();
    });

    it("renders lifecycle stage count for each metric", () => {
      const metric = buildMockLatencyMetric();
      Object.assign(mockMarketsData, buildMockMarketsData({ latencyMetrics: [metric] }));
      render(<MarketsLatencySummaryWidget instanceId="markets-latency-summary" layoutMode="grid" />);
      expect(screen.getByText(/3 stages/i)).toBeTruthy();
    });

    it("renders View control buttons Cross and Series", () => {
      render(<MarketsLatencySummaryWidget instanceId="markets-latency-summary" layoutMode="grid" />);
      expect(screen.getByRole("button", { name: /Cross/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Series/i })).toBeTruthy();
    });

    it("renders Data mode buttons Live, Batch, Compare", () => {
      render(<MarketsLatencySummaryWidget instanceId="markets-latency-summary" layoutMode="grid" />);
      expect(screen.getByRole("button", { name: /Live/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Batch/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Compare/i })).toBeTruthy();
    });

    it("shows badge 'Live vs batch' when latencyDataMode is compare", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ latencyDataMode: "compare" }));
      render(<MarketsLatencySummaryWidget instanceId="markets-latency-summary" layoutMode="grid" />);
      expect(screen.getByText("Live vs batch")).toBeTruthy();
    });

    it("shows 'Clear selection' button when a service is selected", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ selectedLatencyService: "execution-service" }));
      render(<MarketsLatencySummaryWidget instanceId="markets-latency-summary" layoutMode="grid" />);
      expect(screen.getByRole("button", { name: /Clear selection/i })).toBeTruthy();
    });
  });
});
