/**
 * L1.5 widget harness — kpi-strip (overview).
 *
 * Scope:
 * - Mounts with data-backed content
 * - Loading-state skeletons via coreLoading
 * - Empty-state message when all aggregates zero
 * - Mode-dependent P&L title (live vs batch)
 * - Margin used = exposure / nav formatting
 * - Alerts subtitle reflects critical+high breakdown
 *
 * Mirrors defi-lending-widget pilot pattern (vi.mock data-context,
 * Object.assign reset in beforeEach).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockOverviewData, buildMockGlobalScope } from "../_helpers/mock-overview-context";

const mockData = buildMockOverviewData();
const mockScope = buildMockGlobalScope();

vi.mock("@/components/widgets/overview/overview-data-context", () => ({
  useOverviewDataSafe: () => mockData,
}));

vi.mock("@/lib/stores/workspace-scope-store", () => ({
  useWorkspaceScope: () => mockScope.scope, useWorkspaceScopeStore: (selector?: (s: typeof mockScope) => unknown) => (selector ? selector(mockScope) : mockScope), useWorkspaceScopeActions: () => mockScope,
}));

import { KPIStripWidget } from "@/components/widgets/overview/kpi-strip-widget";

describe("kpi-strip — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
    Object.assign(mockScope, buildMockGlobalScope());
  });

  it("renders five KPI cards with aggregated values", () => {
    render(<KPIStripWidget {...({} as never)} />);
    expect(screen.getByText(/P&L \(Today\)/i)).toBeTruthy();
    expect(screen.getByText(/Net Exposure/i)).toBeTruthy();
    expect(screen.getByText(/Margin Used/i)).toBeTruthy();
    expect(screen.getByText(/Live Strategies/i)).toBeTruthy();
    expect(screen.getByText(/^Alerts$/i)).toBeTruthy();
  });

  it("uses 'P&L (Today)' title in live mode", () => {
    Object.assign(mockScope, buildMockGlobalScope({ mode: "live" }));
    render(<KPIStripWidget {...({} as never)} />);
    expect(screen.getByText(/P&L \(Today\)/i)).toBeTruthy();
    expect(screen.queryByText(/P&L \(As-Of\)/i)).toBeNull();
  });

  it("switches to 'P&L (As-Of)' title in batch mode", () => {
    Object.assign(mockScope, buildMockGlobalScope({ mode: "batch" }));
    render(<KPIStripWidget {...({} as never)} />);
    expect(screen.getByText(/P&L \(As-Of\)/i)).toBeTruthy();
  });

  it("shows skeleton grid while coreLoading=true", () => {
    Object.assign(mockData, buildMockOverviewData({ coreLoading: true }));
    const { container } = render(<KPIStripWidget {...({} as never)} />);
    expect(container.querySelectorAll(".h-full.min-h-\\[4rem\\]").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Net Exposure/i)).toBeNull();
  });

  it("shows empty-state message when no portfolio data", () => {
    Object.assign(
      mockData,
      buildMockOverviewData({
        totalNav: 0,
        totalExposure: 0,
        liveStrategies: 0,
        criticalAlerts: 0,
        highAlerts: 0,
      }),
    );
    render(<KPIStripWidget {...({} as never)} />);
    expect(screen.getByText(/No portfolio data available/i)).toBeTruthy();
  });

  it("computes margin-used as exposure/nav percent", () => {
    Object.assign(mockData, buildMockOverviewData({ totalExposure: 50_000, totalNav: 100_000 }));
    render(<KPIStripWidget {...({} as never)} />);
    expect(screen.getByText(/50%/)).toBeTruthy();
  });

  it("renders dash margin when nav is zero but other data exists", () => {
    // liveStrategies keeps hasData=true even with nav=0 path. Widget uses
    // ASCII hyphen "-" as the placeholder for divide-by-zero margin.
    Object.assign(mockData, buildMockOverviewData({ totalNav: 0, liveStrategies: 2, totalExposure: 1000 }));
    render(<KPIStripWidget {...({} as never)} />);
    expect(screen.getByText("-")).toBeTruthy();
  });

  it("shows alert count subtitle with critical/high breakdown", () => {
    Object.assign(mockData, buildMockOverviewData({ criticalAlerts: 2, highAlerts: 3 }));
    render(<KPIStripWidget {...({} as never)} />);
    expect(screen.getByText(/2 critical, 3 high/i)).toBeTruthy();
  });

  it("shows 'All healthy' subtitle when no strategy warnings", () => {
    Object.assign(mockData, buildMockOverviewData({ liveStrategies: 3, warningStrategies: 0 }));
    render(<KPIStripWidget {...({} as never)} />);
    expect(screen.getByText(/All healthy/i)).toBeTruthy();
  });

  it("renders 'Navigate to Overview tab' when context is null", async () => {
    vi.resetModules();
    vi.doMock("@/components/widgets/overview/overview-data-context", () => ({
      useOverviewDataSafe: () => null,
    }));
    vi.doMock("@/lib/stores/workspace-scope-store", () => ({
      useWorkspaceScope: () => mockScope.scope, useWorkspaceScopeStore: (selector?: (s: typeof mockScope) => unknown) => (selector ? selector(mockScope) : mockScope), useWorkspaceScopeActions: () => mockScope,
    }));
    const mod = await import("@/components/widgets/overview/kpi-strip-widget");
    render(<mod.KPIStripWidget {...({} as never)} />);
    expect(screen.getByText(/Navigate to Overview tab/i)).toBeTruthy();
    vi.doUnmock("@/components/widgets/overview/overview-data-context");
    vi.doUnmock("@/lib/stores/workspace-scope-store");
  });
});
