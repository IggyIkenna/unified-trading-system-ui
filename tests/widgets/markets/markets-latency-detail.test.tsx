/**
 * L1.5 widget harness — markets-latency-detail-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Loading state renders spinner.
 * - Error state renders error message.
 * - No-service-selected empty state.
 * - With selected service: service name visible, KPI strip labels, lifecycle breakdown.
 * - latencyViewMode=cross-section shows lifecycle breakdown card.
 * - latencyDataMode=compare shows compare note.
 * - latencyDataMode=batch shows Batch badge.
 *
 * Out of scope:
 * - Recharts SVG chart internals (happy-dom can't render them).
 * - Real WebSocket interactions (L3b).
 * - Visual regression (L4 — deferred).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockLatencyMetric, buildMockMarketsData } from "../_helpers/mock-markets-context";

const mockMarketsData = buildMockMarketsData();

vi.mock("@/components/widgets/markets/markets-data-context", () => ({
  useMarketsData: () => mockMarketsData,
}));

import { MarketsLatencyDetailWidget } from "@/components/widgets/markets/markets-latency-detail-widget";

describe("markets-latency-detail-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockMarketsData, buildMockMarketsData());
  });

  describe("loading state", () => {
    it("shows Loading spinner when isLoading is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isLoading: true }));
      render(<MarketsLatencyDetailWidget instanceId="markets-latency-detail" layoutMode="grid" />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message when isError is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true }));
      render(<MarketsLatencyDetailWidget instanceId="markets-latency-detail" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load latency data/i)).toBeTruthy();
    });
  });

  describe("no-service-selected state", () => {
    it("shows prompt when selectedLatencyService is null", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ selectedLatencyService: null }));
      render(<MarketsLatencyDetailWidget instanceId="markets-latency-detail" layoutMode="grid" />);
      expect(screen.getByText(/Select a service in Latency Summary/i)).toBeTruthy();
    });
  });

  describe("with selected service", () => {
    it("renders service name when a matching service is selected", () => {
      const metric = buildMockLatencyMetric({ service: "Execution Service", serviceId: "execution-service" });
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({ latencyMetrics: [metric], selectedLatencyService: "execution-service" }),
      );
      render(<MarketsLatencyDetailWidget instanceId="markets-latency-detail" layoutMode="grid" />);
      expect(screen.getByText("Execution Service")).toBeTruthy();
    });

    it("renders p50/p95/p99 KPI labels", () => {
      const metric = buildMockLatencyMetric({ serviceId: "execution-service" });
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({ latencyMetrics: [metric], selectedLatencyService: "execution-service" }),
      );
      render(<MarketsLatencyDetailWidget instanceId="markets-latency-detail" layoutMode="grid" />);
      // p50/p95/p99 appear in both KPI strip and lifecycle footer — use getAllByText
      expect(screen.getAllByText("p50").length).toBeGreaterThan(0);
      expect(screen.getAllByText("p95").length).toBeGreaterThan(0);
      expect(screen.getAllByText("p99").length).toBeGreaterThan(0);
    });

    it("shows Lifecycle breakdown section in cross-section mode", () => {
      const metric = buildMockLatencyMetric({ serviceId: "execution-service" });
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({
          latencyMetrics: [metric],
          selectedLatencyService: "execution-service",
          latencyViewMode: "cross-section",
        }),
      );
      render(<MarketsLatencyDetailWidget instanceId="markets-latency-detail" layoutMode="grid" />);
      expect(screen.getByText(/Lifecycle breakdown/i)).toBeTruthy();
    });

    it("shows lifecycle stage names when cross-section mode is active", () => {
      const metric = buildMockLatencyMetric({ serviceId: "execution-service" });
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({
          latencyMetrics: [metric],
          selectedLatencyService: "execution-service",
          latencyViewMode: "cross-section",
        }),
      );
      render(<MarketsLatencyDetailWidget instanceId="markets-latency-detail" layoutMode="grid" />);
      expect(screen.getByText("Order Validation")).toBeTruthy();
    });

    it("shows compare note when latencyDataMode is compare", () => {
      const metric = buildMockLatencyMetric({ serviceId: "execution-service" });
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({
          latencyMetrics: [metric],
          selectedLatencyService: "execution-service",
          latencyDataMode: "compare",
        }),
      );
      render(<MarketsLatencyDetailWidget instanceId="markets-latency-detail" layoutMode="grid" />);
      expect(screen.getByText(/Compare row uses live vs simulated batch/i)).toBeTruthy();
    });

    it("shows Batch badge when latencyDataMode is batch", () => {
      const metric = buildMockLatencyMetric({ serviceId: "execution-service" });
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({
          latencyMetrics: [metric],
          selectedLatencyService: "execution-service",
          latencyDataMode: "batch",
        }),
      );
      render(<MarketsLatencyDetailWidget instanceId="markets-latency-detail" layoutMode="grid" />);
      expect(screen.getByText("Batch")).toBeTruthy();
    });
  });
});
