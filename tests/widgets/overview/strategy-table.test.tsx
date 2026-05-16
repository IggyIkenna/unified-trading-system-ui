/**
 * L1.5 widget harness — strategy-table (overview).
 *
 * Scope:
 * - Toolbar: search input, asset-class select, status select, reset button
 * - Renders asset-class groups + row count
 * - Empty data → "No strategy data available"
 * - Filter-mismatch → "No strategies match the current filters"
 * - Show all / show 15 toggle appears when filtered > 15
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { buildMockOverviewData, buildMockStrategy } from "../_helpers/mock-overview-context";

const mockData = buildMockOverviewData();

vi.mock("@/components/widgets/overview/overview-data-context", () => ({
  useOverviewDataSafe: () => mockData,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement("a", { href, ...rest }, children),
}));

import { StrategyTableWidget } from "@/components/widgets/overview/strategy-table-widget";

describe("strategy-table — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
  });

  it("renders search input and filter selects", () => {
    render(<StrategyTableWidget {...({} as never)} />);
    expect(screen.getByPlaceholderText(/Search strategies/i)).toBeTruthy();
    // Two <Select> triggers: asset class + status
    expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(2);
  });

  it("renders strategy count in toolbar", () => {
    render(<StrategyTableWidget {...({} as never)} />);
    expect(screen.getByText(/3 strategies/)).toBeTruthy();
  });

  it("renders asset-class groups", () => {
    render(<StrategyTableWidget {...({} as never)} />);
    expect(screen.getByText("DeFi")).toBeTruthy();
    expect(screen.getByText("CeFi")).toBeTruthy();
  });

  it("filters by strategy-name search", () => {
    render(<StrategyTableWidget {...({} as never)} />);
    const input = screen.getByPlaceholderText(/Search strategies/i);
    fireEvent.change(input, { target: { value: "BTC" } });
    expect(screen.getByText(/1 strategies/)).toBeTruthy();
    expect(screen.queryByText("DeFi")).toBeNull();
  });

  it("reset button appears once a filter is applied", () => {
    render(<StrategyTableWidget {...({} as never)} />);
    const input = screen.getByPlaceholderText(/Search strategies/i);
    fireEvent.change(input, { target: { value: "BTC" } });
    expect(screen.getByText(/Reset \(1\)/)).toBeTruthy();
  });

  it("shows 'No strategies match' when filter excludes all", () => {
    render(<StrategyTableWidget {...({} as never)} />);
    const input = screen.getByPlaceholderText(/Search strategies/i);
    fireEvent.change(input, { target: { value: "ZZZNONEXISTENT" } });
    expect(screen.getByText(/No strategies match the current filters/i)).toBeTruthy();
  });

  it("shows 'No strategy data' empty-state when context has no strategies", () => {
    Object.assign(mockData, buildMockOverviewData({ strategyPerformance: [], filteredSortedStrategies: [] }));
    render(<StrategyTableWidget {...({} as never)} />);
    expect(screen.getByText(/No strategy data available/i)).toBeTruthy();
  });

  it("renders Show all toggle when strategies > 15", () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      buildMockStrategy({ id: `s-${i}`, name: `Strat ${i}`, assetClass: "DeFi" }),
    );
    Object.assign(mockData, buildMockOverviewData({ strategyPerformance: many, filteredSortedStrategies: many }));
    render(<StrategyTableWidget {...({} as never)} />);
    expect(screen.getByText(/Show all 20 strategies/i)).toBeTruthy();
  });

  it("View All link targets /services/strategy-catalogue", () => {
    render(<StrategyTableWidget {...({} as never)} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/services/strategy-catalogue")).toBe(true);
  });

  it("falls back to 'Navigate to Overview tab' when context null", async () => {
    vi.resetModules();
    vi.doMock("@/components/widgets/overview/overview-data-context", () => ({
      useOverviewDataSafe: () => null,
    }));
    const mod = await import("@/components/widgets/overview/strategy-table-widget");
    render(<mod.StrategyTableWidget {...({} as never)} />);
    expect(screen.getByText(/Navigate to Overview tab/i)).toBeTruthy();
    vi.doUnmock("@/components/widgets/overview/overview-data-context");
  });
});
