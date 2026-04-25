/**
 * L1.5 widget harness — health-grid (overview/health-grid-widget).
 *
 * Scope:
 * - Renders HealthStatusGrid with service rows
 * - Loading spinner via coreLoading
 * - Empty-state when allMockServices=[]
 * - Renders the full service list (no preview cap)
 * - Refresh button invalidates the service-health query
 * - null-context fallback
 * - "View All" link to /services/observe/health
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

import { HealthGridWidget } from "@/components/widgets/overview/health-grid-widget";

function renderWidget(client?: QueryClient) {
  const qc = client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    qc,
    ...render(
      <QueryClientProvider client={qc}>
        <HealthGridWidget {...({} as never)} />
      </QueryClientProvider>,
    ),
  };
}

describe("health-grid — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
  });

  it("renders service names", () => {
    renderWidget();
    expect(screen.getByText("market-data")).toBeTruthy();
    expect(screen.getByText("pricing-service")).toBeTruthy();
  });

  it("renders health-grid table columns", () => {
    renderWidget();
    expect(screen.getByRole("columnheader", { name: /^Service$/i })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /Freshness/i })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /SLA/i })).toBeTruthy();
  });

  it("renders every service the context provides", () => {
    const many = Array.from({ length: 12 }, (_, i) => buildMockServiceHealth({ name: `svc-${i}` }));
    Object.assign(mockData, buildMockOverviewData({ allMockServices: many }));
    renderWidget();
    for (let i = 0; i < 12; i++) {
      expect(screen.getByText(`svc-${i}`)).toBeTruthy();
    }
  });

  it("shows spinner while coreLoading", () => {
    Object.assign(mockData, buildMockOverviewData({ coreLoading: true }));
    const { container } = renderWidget();
    expect(container.querySelector("svg.animate-spin, [role='status']")).toBeTruthy();
    expect(screen.queryByText("market-data")).toBeNull();
  });

  it("shows 'No services reported' empty-state", () => {
    Object.assign(mockData, buildMockOverviewData({ allMockServices: [] }));
    renderWidget();
    expect(screen.getByText(/No services reported/i)).toBeTruthy();
  });

  it("Refresh button invalidates the service-health query", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderWidget(qc);
    fireEvent.click(screen.getByRole("button", { name: /Refresh/i }));
    expect(spy).toHaveBeenCalledWith({ queryKey: ["service-health"] });
  });

  it("View All link targets /services/observe/health", () => {
    renderWidget();
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/services/observe/health")).toBe(true);
  });

  it("falls back to 'Navigate to Overview tab' when context null", async () => {
    vi.resetModules();
    vi.doMock("@/components/widgets/overview/overview-data-context", () => ({
      useOverviewDataSafe: () => null,
    }));
    const mod = await import("@/components/widgets/overview/health-grid-widget");
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <mod.HealthGridWidget {...({} as never)} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Navigate to Overview tab/i)).toBeTruthy();
    vi.doUnmock("@/components/widgets/overview/overview-data-context");
  });
});
