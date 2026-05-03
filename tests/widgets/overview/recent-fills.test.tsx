/**
 * L1.5 widget harness — recent-fills (overview/recent-fills-widget).
 *
 * Scope:
 * - Renders up to 5 fill rows
 * - BUY/SELL badge + instrument + status display
 * - Loading spinner via ordersLoading
 * - Empty-state for [] and {orders: []} response shapes
 * - "View All" Link to /services/workspace?surface=terminal&tm=command
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { buildMockOverviewData, buildMockOrder } from "../_helpers/mock-overview-context";

const mockData = buildMockOverviewData();

vi.mock("@/components/widgets/overview/overview-data-context", () => ({
  useOverviewDataSafe: () => mockData,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement("a", { href, ...rest }, children),
}));

import { RecentFillsWidget } from "@/components/widgets/overview/recent-fills-widget";

describe("recent-fills — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
  });

  it("renders BUY/SELL badges for seeded orders", () => {
    render(<RecentFillsWidget {...({} as never)} />);
    expect(screen.getByText("BUY")).toBeTruthy();
    expect(screen.getByText("SELL")).toBeTruthy();
  });

  it("renders instrument names", () => {
    render(<RecentFillsWidget {...({} as never)} />);
    // Both default orders use ETH-PERP
    expect(screen.getAllByText("ETH-PERP").length).toBeGreaterThan(0);
  });

  it("renders status text", () => {
    render(<RecentFillsWidget {...({} as never)} />);
    expect(screen.getAllByText("FILLED").length).toBeGreaterThan(0);
  });

  it("caps rows at 5 even when more orders exist", () => {
    const many = Array.from({ length: 8 }, (_, i) => buildMockOrder({ order_id: `o-${i}`, side: "BUY" }));
    Object.assign(mockData, buildMockOverviewData({ ordersData: many }));
    render(<RecentFillsWidget {...({} as never)} />);
    expect(screen.getAllByText("BUY").length).toBe(5);
  });

  it("accepts {orders: []} wrapped response shape", () => {
    Object.assign(
      mockData,
      buildMockOverviewData({ ordersData: { orders: [buildMockOrder({ instrument: "SOL-PERP" })] } }),
    );
    render(<RecentFillsWidget {...({} as never)} />);
    expect(screen.getByText("SOL-PERP")).toBeTruthy();
  });

  it("shows spinner while ordersLoading", () => {
    Object.assign(mockData, buildMockOverviewData({ ordersLoading: true }));
    const { container } = render(<RecentFillsWidget {...({} as never)} />);
    expect(container.querySelector("svg.animate-spin, [role='status']")).toBeTruthy();
    expect(screen.queryByText("BUY")).toBeNull();
  });

  it("shows 'No recent fills' empty-state for []", () => {
    Object.assign(mockData, buildMockOverviewData({ ordersData: [] }));
    render(<RecentFillsWidget {...({} as never)} />);
    expect(screen.getByText(/No recent fills/i)).toBeTruthy();
  });

  it("shows empty-state for {orders: []}", () => {
    Object.assign(mockData, buildMockOverviewData({ ordersData: { orders: [] } }));
    render(<RecentFillsWidget {...({} as never)} />);
    expect(screen.getByText(/No recent fills/i)).toBeTruthy();
  });

  it("View All link targets /services/workspace?surface=terminal&tm=command", () => {
    render(<RecentFillsWidget {...({} as never)} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/services/workspace?surface=terminal&tm=command")).toBe(true);
  });
});
