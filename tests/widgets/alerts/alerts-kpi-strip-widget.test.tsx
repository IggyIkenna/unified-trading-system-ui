/**
 * L1.5 widget harness — alerts-kpi-strip.
 *
 * Scope:
 * - Render with mocked AlertsDataContext; root testid mounts.
 * - Loading state shows em-dash for each metric.
 * - Active/critical counts reflect context values.
 * - Metric labels present (Active Alerts, Critical, Avg Resolution, Last 24h).
 * - Mock constants for Avg Resolution / Last 24h surface from
 *   lib/config/services/alerts.config.ts (widget cert L1.7 knownIssue).
 *
 * Out of scope: L2 route smoke, L3/L4 trader flow, layout-mode persistence.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockAlert, buildMockAlertsData } from "../_helpers/mock-alerts-context";

const mockData = buildMockAlertsData();

vi.mock("@/components/widgets/alerts/alerts-data-context", () => ({
  useAlertsData: () => mockData,
}));

// KpiSummaryWidget persists layout via localStorage; happy-dom provides it,
// but guard the chrome-context hook so the widget doesn't try to mount a
// header slot in isolation.
vi.mock("@/components/widgets/widget-chrome-context", () => ({
  useWidgetHeaderEndSlot: () => null,
}));

import { AlertsKpiStripWidget } from "@/components/widgets/alerts/alerts-kpi-strip-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("alerts-kpi-strip — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockAlertsData());
  });

  describe("render", () => {
    it("mounts root testid", () => {
      render(<AlertsKpiStripWidget {...noopProps} />);
      expect(screen.getByTestId("alerts-kpi-strip-widget")).toBeTruthy();
    });

    it("renders all four KPI labels", () => {
      render(<AlertsKpiStripWidget {...noopProps} />);
      expect(screen.getByText("Active Alerts")).toBeTruthy();
      expect(screen.getByText("Critical")).toBeTruthy();
      expect(screen.getByText("Avg Resolution")).toBeTruthy();
      expect(screen.getByText("Last 24h")).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("renders em-dash for every metric when isLoading=true", () => {
      Object.assign(mockData, buildMockAlertsData({ isLoading: true }));
      render(<AlertsKpiStripWidget {...noopProps} />);
      const dashes = screen.getAllByText("—");
      // 4 metrics, each em-dash while loading
      expect(dashes.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("counts", () => {
    it("renders activeCount and criticalCount from context", () => {
      Object.assign(
        mockData,
        buildMockAlertsData({
          alerts: [
            buildMockAlert({ id: "a1", severity: "critical", status: "active" }),
            buildMockAlert({ id: "a2", severity: "critical", status: "active" }),
            buildMockAlert({ id: "a3", severity: "high", status: "active" }),
          ],
        }),
      );
      render(<AlertsKpiStripWidget {...noopProps} />);
      // activeCount = 3, criticalCount = 2
      expect(screen.getByText("3")).toBeTruthy();
      expect(screen.getByText("2")).toBeTruthy();
    });

    it("renders 0 counts when alerts are empty", () => {
      Object.assign(mockData, buildMockAlertsData({ alerts: [] }));
      render(<AlertsKpiStripWidget {...noopProps} />);
      // 0 Active + 0 Critical — at least two "0" tiles present
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("mock constants", () => {
    it("renders MOCK_AVG_RESOLUTION_DISPLAY (12m) when not loading", () => {
      render(<AlertsKpiStripWidget {...noopProps} />);
      expect(screen.getByText("12m")).toBeTruthy();
    });

    it("renders MOCK_LAST_24H_DISPLAY (23) when not loading", () => {
      // Use a distinct non-clashing active count so "23" is unambiguous.
      Object.assign(mockData, buildMockAlertsData({ activeCount: 1, criticalCount: 0 }));
      render(<AlertsKpiStripWidget {...noopProps} />);
      expect(screen.getByText("23")).toBeTruthy();
    });
  });
});
