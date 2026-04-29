/**
 * L1.5 widget harness — alerts-preview (overview/alerts-preview-widget).
 *
 * Migrated 2026-04-28 from useOverviewDataSafe → useAlertsData. The widget
 * was refactored to consume the AlertsDataContext (shared with the rest of
 * the alerts cluster); this test now mocks that hook and uses the
 * buildMockAlertsData helper. Top-N is 3, not 4 — the widget caps at 3
 * recent rows.
 *
 * Scope:
 * - Renders recent-alert rows (up to 3)
 * - Severity badge text: CRIT / HIGH / MED
 * - Loading spinner via isLoading
 * - Empty-state when no active alerts
 * - "View All" link + per-alert Link wrapper targets /services/trading/alerts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { buildMockAlert, buildMockAlertsData } from "../_helpers/mock-alerts-context";

const mockData = buildMockAlertsData();

vi.mock("@/components/widgets/alerts/alerts-data-context", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useAlertsData: () => mockData,
  };
});

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement("a", { href, ...rest }, children),
}));

import { AlertsPreviewWidget } from "@/components/widgets/overview/alerts-preview-widget";

describe("alerts-preview — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(
      mockData,
      buildMockAlertsData({
        alerts: [
          buildMockAlert({ id: "a-1", severity: "high", title: "Funding spike on BINANCE ETH-PERP" }),
          buildMockAlert({ id: "a-2", severity: "critical", title: "Kill switch tripped on AAVE lending" }),
        ],
      }),
    );
  });

  it("renders severity badges for seeded alerts", () => {
    render(<AlertsPreviewWidget {...({} as never)} />);
    expect(screen.getByText("HIGH")).toBeTruthy();
    expect(screen.getByText("CRIT")).toBeTruthy();
  });

  it("renders alert title text", () => {
    render(<AlertsPreviewWidget {...({} as never)} />);
    expect(screen.getByText(/Funding spike on BINANCE ETH-PERP/)).toBeTruthy();
    expect(screen.getByText(/Kill switch tripped on AAVE lending/)).toBeTruthy();
  });

  it("renders MED badge for medium severity", () => {
    Object.assign(
      mockData,
      buildMockAlertsData({
        alerts: [buildMockAlert({ severity: "medium", title: "Mild drift" })],
      }),
    );
    render(<AlertsPreviewWidget {...({} as never)} />);
    expect(screen.getByText("MED")).toBeTruthy();
  });

  it("caps displayed rows at 3 even when more exist (severity count badge unaffected)", () => {
    const manyAlerts = Array.from({ length: 10 }, (_, i) =>
      buildMockAlert({ id: `alert-${i}`, severity: "high", title: `Alert ${i}` }),
    );
    Object.assign(mockData, buildMockAlertsData({ alerts: manyAlerts }));
    render(<AlertsPreviewWidget {...({} as never)} />);
    // Per-row badges were removed during the AlertsDataContext refactor — only
    // a single severity-count summary badge renders the "HIGH" text. The
    // row-cap of 3 is asserted via the per-row /services/trading/alerts links.
    expect(screen.getAllByText("HIGH").length).toBe(1);
    const rowLinks = screen.getAllByRole("link").filter((l) => l.getAttribute("href") === "/services/trading/alerts");
    // 1 View All + 3 capped rows = 4.
    expect(rowLinks.length).toBe(4);
  });

  it("shows spinner while isLoading", () => {
    Object.assign(mockData, buildMockAlertsData({ alerts: [], isLoading: true }));
    const { container } = render(<AlertsPreviewWidget {...({} as never)} />);
    expect(container.querySelector("svg.animate-spin, [role='status']")).toBeTruthy();
    expect(screen.queryByText("HIGH")).toBeNull();
  });

  it("shows 'No active alerts' empty-state", () => {
    Object.assign(mockData, buildMockAlertsData({ alerts: [] }));
    render(<AlertsPreviewWidget {...({} as never)} />);
    expect(screen.getByText(/No active alerts/i)).toBeTruthy();
  });

  it("each alert row links to /services/trading/alerts", () => {
    render(<AlertsPreviewWidget {...({} as never)} />);
    const alertsLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href") === "/services/trading/alerts");
    // 1 View All + 2 per-row = 3 (test seeded 2 alerts).
    expect(alertsLinks.length).toBe(3);
  });
});
