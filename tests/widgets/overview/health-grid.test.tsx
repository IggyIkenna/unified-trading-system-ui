/**
 * L1.5 widget harness — health-grid (overview/bottom-widgets).
 *
 * Scope:
 * - Renders HealthStatusGrid with service rows
 * - Loading spinner via coreLoading
 * - Empty-state when allMockServices=[]
 * - Caps services at 6
 * - null-context fallback
 * - "View All" link to /services/observe/health
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { buildMockOverviewData, buildMockServiceHealth } from "../_helpers/mock-overview-context";

const mockData = buildMockOverviewData();

vi.mock("@/components/widgets/overview/overview-data-context", () => ({
  useOverviewDataSafe: () => mockData,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement("a", { href, ...rest }, children),
}));

import { HealthGridWidget } from "@/components/widgets/overview/bottom-widgets";

describe("health-grid — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
  });

  it("renders service names", () => {
    render(<HealthGridWidget {...({} as never)} />);
    expect(screen.getByText("market-data")).toBeTruthy();
    expect(screen.getByText("pricing-service")).toBeTruthy();
  });

  it("renders health-grid table columns", () => {
    render(<HealthGridWidget {...({} as never)} />);
    expect(screen.getByRole("columnheader", { name: /^Service$/i })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /Freshness/i })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /SLA/i })).toBeTruthy();
  });

  it("caps rendered services at 6", () => {
    const many = Array.from({ length: 12 }, (_, i) => buildMockServiceHealth({ name: `svc-${i}` }));
    Object.assign(mockData, buildMockOverviewData({ allMockServices: many }));
    render(<HealthGridWidget {...({} as never)} />);
    // 0..5 visible, 6+ not
    expect(screen.getByText("svc-0")).toBeTruthy();
    expect(screen.getByText("svc-5")).toBeTruthy();
    expect(screen.queryByText("svc-6")).toBeNull();
  });

  it("shows spinner while coreLoading", () => {
    Object.assign(mockData, buildMockOverviewData({ coreLoading: true }));
    const { container } = render(<HealthGridWidget {...({} as never)} />);
    expect(container.querySelector("svg.animate-spin, [role='status']")).toBeTruthy();
    expect(screen.queryByText("market-data")).toBeNull();
  });

  it("shows 'No services reported' empty-state", () => {
    Object.assign(mockData, buildMockOverviewData({ allMockServices: [] }));
    render(<HealthGridWidget {...({} as never)} />);
    expect(screen.getByText(/No services reported/i)).toBeTruthy();
  });

  it("View All link targets /services/observe/health", () => {
    render(<HealthGridWidget {...({} as never)} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/services/observe/health")).toBe(true);
  });

  it("falls back to 'Navigate to Overview tab' when context null", async () => {
    vi.resetModules();
    vi.doMock("@/components/widgets/overview/overview-data-context", () => ({
      useOverviewDataSafe: () => null,
    }));
    const mod = await import("@/components/widgets/overview/bottom-widgets");
    render(<mod.HealthGridWidget {...({} as never)} />);
    expect(screen.getByText(/Navigate to Overview tab/i)).toBeTruthy();
    vi.doUnmock("@/components/widgets/overview/overview-data-context");
  });
});
