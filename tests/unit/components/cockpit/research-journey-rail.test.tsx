/**
 * ResearchJourneyRail — component-level unit tests.
 *
 * Phase 4 of dart_ux_cockpit_refactor §5.3 + §17.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResearchJourneyRail } from "@/components/cockpit/research-journey-rail";
import { useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";

const mockUsePathname = vi.fn<() => string>(() => "/dashboard");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({
      href,
      children,
      onClick,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
      onClick?: () => void;
      [k: string]: unknown;
    }) =>
      React.createElement(
        "a",
        {
          href,
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            onClick?.();
          },
          ...rest,
        },
        children,
      ),
  };
});

beforeEach(() => {
  mockUsePathname.mockReturnValue("/dashboard");
  act(() => {
    useWorkspaceScopeStore.getState().reset();
  });
});

describe("ResearchJourneyRail — render", () => {
  it("renders all 6 stage chips", () => {
    render(<ResearchJourneyRail />);
    expect(screen.getByTestId("research-stage-discover")).toBeTruthy();
    expect(screen.getByTestId("research-stage-build")).toBeTruthy();
    expect(screen.getByTestId("research-stage-train")).toBeTruthy();
    expect(screen.getByTestId("research-stage-validate")).toBeTruthy();
    expect(screen.getByTestId("research-stage-allocate")).toBeTruthy();
    expect(screen.getByTestId("research-stage-promote")).toBeTruthy();
  });

  it("renders 5 progress arrows between the 6 stages", () => {
    render(<ResearchJourneyRail />);
    expect(screen.getByTestId("research-stage-arrow-0")).toBeTruthy();
    expect(screen.getByTestId("research-stage-arrow-1")).toBeTruthy();
    expect(screen.getByTestId("research-stage-arrow-2")).toBeTruthy();
    expect(screen.getByTestId("research-stage-arrow-3")).toBeTruthy();
    expect(screen.getByTestId("research-stage-arrow-4")).toBeTruthy();
    expect(screen.queryByTestId("research-stage-arrow-5")).toBeNull();
  });

  it("each stage renders a sequence number 1-6", () => {
    render(<ResearchJourneyRail />);
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
  });

  it("each stage has a tagline", () => {
    render(<ResearchJourneyRail />);
    expect(screen.getByText(/Strategy universe/i)).toBeTruthy();
    expect(screen.getByText(/Data, features, datasets/i)).toBeTruthy();
    expect(screen.getByText(/ML experiments/i)).toBeTruthy();
    expect(screen.getByText(/Backtests, paper/i)).toBeTruthy();
    expect(screen.getByText(/Capital, risk/i)).toBeTruthy();
    expect(screen.getByText(/Release bundle/i)).toBeTruthy();
  });
});

describe("ResearchJourneyRail — active stage resolution", () => {
  it("falls back to 'discover' when path + scope are both empty", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<ResearchJourneyRail />);
    expect(screen.getByTestId("research-journey-rail").getAttribute("data-active-stage")).toBe("discover");
  });

  it("URL path wins over scope.researchStage", () => {
    mockUsePathname.mockReturnValue("/services/research/ml/training");
    act(() => {
      useWorkspaceScopeStore.getState().setSurface("research", "scope-bar");
      useWorkspaceScopeStore.getState().setResearchStage("allocate", "scope-bar");
    });
    render(<ResearchJourneyRail />);
    // Despite scope says "allocate", URL says "train".
    expect(screen.getByTestId("research-journey-rail").getAttribute("data-active-stage")).toBe("train");
  });

  it("falls back to scope.researchStage when URL doesn't match", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    act(() => {
      useWorkspaceScopeStore.getState().setSurface("research", "scope-bar");
      useWorkspaceScopeStore.getState().setResearchStage("validate", "scope-bar");
    });
    render(<ResearchJourneyRail />);
    expect(screen.getByTestId("research-journey-rail").getAttribute("data-active-stage")).toBe("validate");
  });

  it("renders the indicator on the active stage only", () => {
    mockUsePathname.mockReturnValue("/services/research/strategy/backtests");
    render(<ResearchJourneyRail />);
    expect(screen.getByTestId("research-stage-validate-indicator")).toBeTruthy();
    expect(screen.queryByTestId("research-stage-discover-indicator")).toBeNull();
    expect(screen.queryByTestId("research-stage-promote-indicator")).toBeNull();
  });

  it("aria-current='page' marks the active stage", () => {
    mockUsePathname.mockReturnValue("/services/research/allocate");
    render(<ResearchJourneyRail />);
    expect(screen.getByTestId("research-stage-allocate").getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("research-stage-discover").getAttribute("aria-current")).toBeNull();
  });
});

describe("ResearchJourneyRail — click flips scope.researchStage + scope.surface", () => {
  it("clicking Train sets researchStage='train' + surface='research'", async () => {
    const user = userEvent.setup();
    mockUsePathname.mockReturnValue("/dashboard");
    render(<ResearchJourneyRail />);
    await user.click(screen.getByTestId("research-stage-train"));
    expect(useWorkspaceScopeStore.getState().scope.researchStage).toBe("train");
    expect(useWorkspaceScopeStore.getState().scope.surface).toBe("research");
  });

  it("the link href routes to the stage's defaultHref", () => {
    render(<ResearchJourneyRail />);
    expect(screen.getByTestId("research-stage-discover").getAttribute("href")).toBe(
      "/services/research/strategies",
    );
    expect(screen.getByTestId("research-stage-build").getAttribute("href")).toBe(
      "/services/research/features",
    );
    expect(screen.getByTestId("research-stage-train").getAttribute("href")).toBe(
      "/services/research/ml",
    );
    expect(screen.getByTestId("research-stage-validate").getAttribute("href")).toBe(
      "/services/research/strategy/backtests",
    );
    expect(screen.getByTestId("research-stage-allocate").getAttribute("href")).toBe(
      "/services/research/allocate",
    );
    expect(screen.getByTestId("research-stage-promote").getAttribute("href")).toBe(
      "/services/research/strategy/handoff",
    );
  });
});

describe("ResearchJourneyRail — route → scope auto-sync", () => {
  it("auto-flips scope.surface=research + scope.researchStage on mount", () => {
    mockUsePathname.mockReturnValue("/services/research/strategy/backtests");
    render(<ResearchJourneyRail />);
    expect(useWorkspaceScopeStore.getState().scope.surface).toBe("research");
    expect(useWorkspaceScopeStore.getState().scope.researchStage).toBe("validate");
  });

  it("does NOT mutate scope when URL doesn't match a Research route", () => {
    mockUsePathname.mockReturnValue("/services/trading/overview");
    act(() => {
      useWorkspaceScopeStore.getState().setSurface("dashboard", "scope-bar");
      useWorkspaceScopeStore.getState().setResearchStage(null, "scope-bar");
    });
    render(<ResearchJourneyRail />);
    expect(useWorkspaceScopeStore.getState().scope.surface).toBe("dashboard");
    expect(useWorkspaceScopeStore.getState().scope.researchStage).toBeNull();
  });
});
