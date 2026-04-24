/**
 * L1.5 widget harness — alerts-preview (overview/bottom-widgets).
 *
 * Scope:
 * - Renders recent-alert rows (up to 4)
 * - Severity badge text: CRIT / HIGH / MED
 * - Loading spinner via alertsLoading
 * - Empty-state when mockAlerts is []
 * - "View All" link + per-alert Link wrapper targets /services/trading/alerts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { buildMockOverviewData, buildMockOverviewAlert } from "../_helpers/mock-overview-context";

const mockData = buildMockOverviewData();

vi.mock("@/components/widgets/overview/overview-data-context", () => ({
  useOverviewDataSafe: () => mockData,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement("a", { href, ...rest }, children),
}));

import { AlertsPreviewWidget } from "@/components/widgets/overview/bottom-widgets";

describe("alerts-preview — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
  });

  it("renders severity badges for seeded alerts", () => {
    render(<AlertsPreviewWidget {...({} as never)} />);
    // Default mock has one high + one critical alert
    expect(screen.getByText("HIGH")).toBeTruthy();
    expect(screen.getByText("CRIT")).toBeTruthy();
  });

  it("renders alert message text", () => {
    render(<AlertsPreviewWidget {...({} as never)} />);
    expect(screen.getByText(/Funding spike on BINANCE ETH-PERP/)).toBeTruthy();
    expect(screen.getByText(/Kill switch tripped on AAVE lending/)).toBeTruthy();
  });

  it("renders MED badge for medium severity", () => {
    Object.assign(
      mockData,
      buildMockOverviewData({
        mockAlerts: [buildMockOverviewAlert({ severity: "medium", message: "Mild drift" })],
      }),
    );
    render(<AlertsPreviewWidget {...({} as never)} />);
    expect(screen.getByText("MED")).toBeTruthy();
  });

  it("caps displayed alerts at 4 even when more exist", () => {
    const manyAlerts = Array.from({ length: 10 }, (_, i) =>
      buildMockOverviewAlert({ id: `alert-${i}`, severity: "high", message: `Alert ${i}` }),
    );
    Object.assign(mockData, buildMockOverviewData({ mockAlerts: manyAlerts }));
    render(<AlertsPreviewWidget {...({} as never)} />);
    expect(screen.getAllByText("HIGH").length).toBe(4);
  });

  it("shows spinner while alertsLoading", () => {
    Object.assign(mockData, buildMockOverviewData({ alertsLoading: true }));
    const { container } = render(<AlertsPreviewWidget {...({} as never)} />);
    expect(container.querySelector("svg.animate-spin, [role='status']")).toBeTruthy();
    expect(screen.queryByText("HIGH")).toBeNull();
  });

  it("shows 'No active alerts' empty-state", () => {
    Object.assign(mockData, buildMockOverviewData({ mockAlerts: [] }));
    render(<AlertsPreviewWidget {...({} as never)} />);
    expect(screen.getByText(/No active alerts/i)).toBeTruthy();
  });

  it("each alert row links to /services/trading/alerts", () => {
    render(<AlertsPreviewWidget {...({} as never)} />);
    const alertsLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href") === "/services/trading/alerts");
    // 1 View All + 2 per-row = 3
    expect(alertsLinks.length).toBe(3);
  });

  it("falls back to 'Navigate to Overview tab' when context null", async () => {
    vi.resetModules();
    vi.doMock("@/components/widgets/overview/overview-data-context", () => ({
      useOverviewDataSafe: () => null,
    }));
    const mod = await import("@/components/widgets/overview/bottom-widgets");
    render(<mod.AlertsPreviewWidget {...({} as never)} />);
    expect(screen.getByText(/Navigate to Overview tab/i)).toBeTruthy();
    vi.doUnmock("@/components/widgets/overview/overview-data-context");
  });
});
