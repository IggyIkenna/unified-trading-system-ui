/**
 * L1.5 widget harness — scope-summary (overview).
 *
 * scope-summary pulls in InterventionControls (useUnwindPreview + ticking-now)
 * and ScopeSummary. We stub the heavier dependencies to the surface the
 * widget cares about.
 *
 * Scope:
 * - Loading state via coreLoading (skeletons)
 * - Renders "Open Trading Terminal" action link
 * - Renders intervention-controls stub slot
 * - Filters organizations/clients by scope arrays
 * - null-context fallback
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { buildMockOverviewData, buildMockGlobalScope } from "../_helpers/mock-overview-context";

const mockData = buildMockOverviewData();
const mockScope = buildMockGlobalScope();

vi.mock("@/components/widgets/overview/overview-data-context", () => ({
  useOverviewDataSafe: () => mockData,
}));

vi.mock("@/lib/stores/workspace-scope-store", () => ({
  useWorkspaceScope: () => mockScope.scope,
  useWorkspaceScopeStore: (selector?: (s: typeof mockScope) => unknown) => (selector ? selector(mockScope) : mockScope),
  useWorkspaceScopeActions: () => mockScope,
}));

// Stub the nested trading surfaces — they have their own tests elsewhere.
vi.mock("@/components/trading/scope-summary", () => ({
  ScopeSummary: ({
    organizations,
    clients,
    totalStrategies,
  }: {
    organizations: { id: string; name: string }[];
    clients: { id: string; name: string }[];
    totalStrategies: number;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "scope-summary-inner" },
      `orgs=${organizations.length} clients=${clients.length} strategies=${totalStrategies}`,
    ),
}));

vi.mock("@/components/trading/intervention-controls", () => ({
  InterventionControls: ({ scope }: { scope: { strategyCount: number; scopeLabel: string } }) =>
    React.createElement(
      "div",
      { "data-testid": "intervention-controls-inner" },
      `count=${scope.strategyCount} label=${scope.scopeLabel}`,
    ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement("a", { href, ...rest }, children),
}));

import { ScopeSummaryWidget } from "@/components/widgets/overview/scope-summary-widget";

describe("scope-summary — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockOverviewData());
    Object.assign(mockScope, buildMockGlobalScope());
  });

  it("renders ScopeSummary and InterventionControls inner stubs", () => {
    render(<ScopeSummaryWidget {...({} as never)} />);
    expect(screen.getByTestId("scope-summary-inner")).toBeTruthy();
    expect(screen.getByTestId("intervention-controls-inner")).toBeTruthy();
  });

  it("renders 'Open Trading Terminal' link to terminal route", () => {
    render(<ScopeSummaryWidget {...({} as never)} />);
    const links = screen.getAllByRole("link");
    const terminal = links.find((l) => l.getAttribute("href") === "/services/workspace?surface=terminal&tm=command");
    expect(terminal).toBeTruthy();
    expect(terminal?.textContent).toMatch(/Open Trading Terminal/i);
  });

  it("shows skeleton placeholders while coreLoading", () => {
    Object.assign(mockData, buildMockOverviewData({ coreLoading: true }));
    render(<ScopeSummaryWidget {...({} as never)} />);
    // Skeletons are rendered; inner component stubs should not be
    expect(screen.queryByTestId("scope-summary-inner")).toBeNull();
    expect(screen.queryByTestId("intervention-controls-inner")).toBeNull();
  });

  it("passes unfiltered org/client counts when scope arrays empty", () => {
    Object.assign(mockScope, buildMockGlobalScope({ organizationIds: [], clientIds: [] }));
    render(<ScopeSummaryWidget {...({} as never)} />);
    // zero selected → ScopeSummary mock reports orgs=0 clients=0
    expect(screen.getByTestId("scope-summary-inner").textContent).toContain("orgs=0 clients=0");
  });

  it("filters orgs and clients when scope selection present", () => {
    Object.assign(mockScope, buildMockGlobalScope({ organizationIds: ["org-1"], clientIds: ["client-1"] }));
    render(<ScopeSummaryWidget {...({} as never)} />);
    expect(screen.getByTestId("scope-summary-inner").textContent).toContain("orgs=1 clients=1");
  });

  it("passes 'All Strategies' label when no scope filter", () => {
    render(<ScopeSummaryWidget {...({} as never)} />);
    expect(screen.getByTestId("intervention-controls-inner").textContent).toContain("label=All Strategies");
  });

  it("passes 'Filtered' label when scope filter active", () => {
    Object.assign(mockScope, buildMockGlobalScope({ organizationIds: ["org-1"] }));
    render(<ScopeSummaryWidget {...({} as never)} />);
    expect(screen.getByTestId("intervention-controls-inner").textContent).toContain("label=Filtered");
  });

  it("falls back to 'Navigate to Overview tab' when context null", async () => {
    vi.resetModules();
    vi.doMock("@/components/widgets/overview/overview-data-context", () => ({
      useOverviewDataSafe: () => null,
    }));
    vi.doMock("@/lib/stores/workspace-scope-store", () => ({
      useWorkspaceScope: () => mockScope.scope,
      useWorkspaceScopeStore: (selector?: (s: typeof mockScope) => unknown) =>
        selector ? selector(mockScope) : mockScope,
      useWorkspaceScopeActions: () => mockScope,
    }));
    const mod = await import("@/components/widgets/overview/scope-summary-widget");
    render(<mod.ScopeSummaryWidget {...({} as never)} />);
    expect(screen.getByText(/Navigate to Overview tab/i)).toBeTruthy();
    vi.doUnmock("@/components/widgets/overview/overview-data-context");
    vi.doUnmock("@/lib/stores/workspace-scope-store");
  });
});
