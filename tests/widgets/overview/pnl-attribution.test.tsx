/**
 * L1.5 widget harness — pnl-attribution (overview/pnl-attribution-widget).
 *
 * Scope:
 * - Renders PnLAttributionPanel with component rows + total
 * - Loading spinner via coreLoading
 * - Empty-state message when pnlComponents is []
 * - null-context fallback text
 * - "View All" link to /services/workspace?surface=terminal&tm=explain
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { buildMockOverviewData } from "../_helpers/mock-overview-context";

const mockData = buildMockOverviewData();

vi.mock("@/components/widgets/overview/overview-data-context", () => ({
  useOverviewDataSafe: () => mockData,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement("a", { href, ...rest }, children),
}));

import { PnLAttributionWidget } from "@/components/widgets/overview/pnl-attribution-widget";

describe("pnl-attribution — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
  });

  it("renders View All link to pnl route", () => {
    render(<PnLAttributionWidget {...({} as never)} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/services/workspace?surface=terminal&tm=explain")).toBe(true);
  });

  it("renders component rows when pnlComponents populated", () => {
    render(<PnLAttributionWidget {...({} as never)} />);
    expect(screen.getByText("Funding")).toBeTruthy();
    expect(screen.getByText("Carry")).toBeTruthy();
    expect(screen.getByText("Basis")).toBeTruthy();
  });

  it("renders NET total label", () => {
    render(<PnLAttributionWidget {...({} as never)} />);
    expect(screen.getByText("NET")).toBeTruthy();
  });

  it("shows spinner while coreLoading", () => {
    Object.assign(mockData, buildMockOverviewData({ coreLoading: true }));
    const { container } = render(<PnLAttributionWidget {...({} as never)} />);
    expect(container.querySelector("svg.animate-spin, svg.lucide-loader, [role='status']")).toBeTruthy();
    expect(screen.queryByText("Funding")).toBeNull();
  });

  it("shows empty-state when no pnl attribution components", () => {
    Object.assign(mockData, buildMockOverviewData({ pnlComponents: [] }));
    render(<PnLAttributionWidget {...({} as never)} />);
    expect(screen.getByText(/No P&amp;L attribution data|No P&L attribution data/)).toBeTruthy();
  });

  it("falls back to 'Navigate to Overview tab' when context null", async () => {
    vi.resetModules();
    vi.doMock("@/components/widgets/overview/overview-data-context", () => ({
      useOverviewDataSafe: () => null,
    }));
    const mod = await import("@/components/widgets/overview/pnl-attribution-widget");
    render(<mod.PnLAttributionWidget {...({} as never)} />);
    expect(screen.getByText(/Navigate to Overview tab/i)).toBeTruthy();
    vi.doUnmock("@/components/widgets/overview/overview-data-context");
  });

  it("renders totalPnl formatted with prefix", () => {
    Object.assign(
      mockData,
      buildMockOverviewData({ totalPnl: 12_500, pnlComponents: [{ name: "Funding", pnl: 12_500 }] }),
    );
    render(<PnLAttributionWidget {...({} as never)} />);
    // formatPnL produces "+$13k" for 12500 (rounds at /1000)
    expect(screen.getAllByText(/\+\$/).length).toBeGreaterThan(0);
  });
});
