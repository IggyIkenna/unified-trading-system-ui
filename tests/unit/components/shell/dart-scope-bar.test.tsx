/**
 * DartScopeBar — component-level unit tests.
 *
 * Covers the Phase 2 acceptance contract:
 *   - Renders compact summary by default; expands on click
 *   - Surface dial: shows TerminalMode toggle when surface=terminal,
 *     ResearchStage toggle when surface=research
 *   - Engagement toggle reachable in ≤1 click on every surface
 *   - §4.3 Live confirm dialog fires on Paper → Live
 *   - Personas without `execution-full` see Live as disabled-with-tooltip
 *     (the option is reachable but not clickable)
 *   - Reset button clears all dials back to defaults
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DartScopeBar } from "@/components/shell/dart-scope-bar";
import { useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";

let hasEntitlementMock = vi.fn<(e: string) => boolean>(() => true);

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "test-user",
      email: "test@example.com",
      role: "client",
      org: { id: "test-org", name: "Test Org" },
      entitlements: ["execution-full", "data-pro"],
    },
    hasEntitlement: hasEntitlementMock,
    token: "test-token",
    isAdmin: () => false,
    isInternal: () => false,
  }),
}));

beforeEach(() => {
  hasEntitlementMock = vi.fn<(e: string) => boolean>(() => true);
  // Reset store state between tests.
  act(() => {
    useWorkspaceScopeStore.getState().reset();
  });
});

describe("DartScopeBar — compact / expand", () => {
  it("renders the compact summary line by default", () => {
    render(<DartScopeBar />);
    expect(screen.getByTestId("dart-scope-bar")).toBeTruthy();
    expect(screen.getByTestId("dart-scope-bar-toggle")).toBeTruthy();
    expect(screen.queryByTestId("dart-scope-bar-body")).toBeNull();
  });

  it("expands on click revealing the chip + dial controls", async () => {
    const user = userEvent.setup();
    render(<DartScopeBar />);
    await user.click(screen.getByTestId("dart-scope-bar-toggle"));
    expect(screen.getByTestId("dart-scope-bar-body")).toBeTruthy();
    // Surface dial visible
    expect(screen.getByTestId("scope-surface-dashboard")).toBeTruthy();
    // Engagement dial visible
    expect(screen.getByTestId("scope-engagement-monitor")).toBeTruthy();
  });

  it("renders pre-expanded when defaultExpanded=true", () => {
    render(<DartScopeBar defaultExpanded />);
    expect(screen.getByTestId("dart-scope-bar-body")).toBeTruthy();
  });
});

describe("DartScopeBar — Surface dial drives Mode/Stage cascade", () => {
  it("shows TerminalMode toggle when surface=terminal (and not the research-stage toggle)", async () => {
    const user = userEvent.setup();
    render(<DartScopeBar defaultExpanded />);
    await user.click(screen.getByTestId("scope-surface-terminal"));
    expect(screen.getByTestId("scope-terminal-mode-command")).toBeTruthy();
    expect(screen.queryByTestId("scope-research-stage-discover")).toBeNull();
  });

  it("shows ResearchStage toggle when surface=research", async () => {
    const user = userEvent.setup();
    render(<DartScopeBar defaultExpanded />);
    await user.click(screen.getByTestId("scope-surface-research"));
    expect(screen.getByTestId("scope-research-stage-discover")).toBeTruthy();
    expect(screen.queryByTestId("scope-terminal-mode-command")).toBeNull();
  });

  it("hides both toggles on dashboard / reports / signals / ops", async () => {
    const user = userEvent.setup();
    render(<DartScopeBar defaultExpanded />);
    await user.click(screen.getByTestId("scope-surface-reports"));
    expect(screen.queryByTestId("scope-terminal-mode-command")).toBeNull();
    expect(screen.queryByTestId("scope-research-stage-discover")).toBeNull();
  });
});

describe("DartScopeBar — Engagement toggle reachable in 1 click", () => {
  it("toggles monitor → replicate", async () => {
    const user = userEvent.setup();
    render(<DartScopeBar defaultExpanded />);
    await user.click(screen.getByTestId("scope-engagement-replicate"));
    expect(useWorkspaceScopeStore.getState().scope.engagement).toBe("replicate");
  });

  it("toggles back replicate → monitor", async () => {
    const user = userEvent.setup();
    act(() => {
      useWorkspaceScopeStore.getState().setEngagement("replicate", "scope-bar");
    });
    render(<DartScopeBar defaultExpanded />);
    await user.click(screen.getByTestId("scope-engagement-monitor"));
    expect(useWorkspaceScopeStore.getState().scope.engagement).toBe("monitor");
  });
});

describe("DartScopeBar — §4.3 Live confirm dialog", () => {
  it("fires the confirm dialog on Paper → Live (with execution-full)", async () => {
    const user = userEvent.setup();
    hasEntitlementMock = vi.fn(() => true);
    render(<DartScopeBar defaultExpanded />);
    await user.click(screen.getByTestId("scope-execution-stream-live"));
    expect(screen.getByTestId("execution-stream-live-confirm")).toBeTruthy();
    // The store has NOT yet flipped to live — confirm pending.
    expect(useWorkspaceScopeStore.getState().scope.executionStream).toBe("paper");
  });

  it("Cancel keeps stream on paper", async () => {
    const user = userEvent.setup();
    render(<DartScopeBar defaultExpanded />);
    await user.click(screen.getByTestId("scope-execution-stream-live"));
    await user.click(screen.getByTestId("execution-stream-live-cancel"));
    expect(useWorkspaceScopeStore.getState().scope.executionStream).toBe("paper");
  });

  it("Confirm flips to live", async () => {
    const user = userEvent.setup();
    render(<DartScopeBar defaultExpanded />);
    await user.click(screen.getByTestId("scope-execution-stream-live"));
    await user.click(screen.getByTestId("execution-stream-live-confirm-button"));
    expect(useWorkspaceScopeStore.getState().scope.executionStream).toBe("live");
  });

  it("Live → Paper does NOT fire the confirm dialog (downgrade is unconditionally allowed)", async () => {
    const user = userEvent.setup();
    act(() => {
      useWorkspaceScopeStore.getState().setExecutionStream("live", "scope-bar");
    });
    render(<DartScopeBar defaultExpanded />);
    await user.click(screen.getByTestId("scope-execution-stream-paper"));
    expect(screen.queryByTestId("execution-stream-live-confirm")).toBeNull();
    expect(useWorkspaceScopeStore.getState().scope.executionStream).toBe("paper");
  });
});

describe("DartScopeBar — persona without execution-full", () => {
  it("renders Live as disabled-with-aria — clicking does not flip stream", async () => {
    const user = userEvent.setup();
    hasEntitlementMock = vi.fn(() => false);
    render(<DartScopeBar defaultExpanded />);
    const liveButton = screen.getByTestId("scope-execution-stream-live");
    expect(liveButton.getAttribute("aria-disabled")).toBe("true");
    // Clicking should be a no-op — no confirm dialog, no state change.
    await user.click(liveButton);
    expect(screen.queryByTestId("execution-stream-live-confirm")).toBeNull();
    expect(useWorkspaceScopeStore.getState().scope.executionStream).toBe("paper");
  });
});

describe("DartScopeBar — Reset", () => {
  it("clears all chips back to EMPTY_WORKSPACE_SCOPE", async () => {
    const user = userEvent.setup();
    act(() => {
      const store = useWorkspaceScopeStore.getState();
      store.setAssetGroups(["DEFI"]);
      store.setFamilies(["CARRY_AND_YIELD"]);
      store.setEngagement("replicate", "scope-bar");
    });
    render(<DartScopeBar />);
    await user.click(screen.getByTestId("dart-scope-bar-reset"));
    const s = useWorkspaceScopeStore.getState().scope;
    expect(s.assetGroups).toEqual([]);
    expect(s.families).toEqual([]);
    expect(s.engagement).toBe("monitor");
  });
});

describe("DartScopeBar — active filter chips render in expanded body", () => {
  it("shows asset_group / family / archetype chips when set", async () => {
    const user = userEvent.setup();
    act(() => {
      const store = useWorkspaceScopeStore.getState();
      store.setAssetGroups(["DEFI"]);
      store.setFamilies(["CARRY_AND_YIELD"]);
      store.setArchetypes(["CARRY_BASIS_PERP"]);
    });
    render(<DartScopeBar />);
    await user.click(screen.getByTestId("dart-scope-bar-toggle"));
    const body = screen.getByTestId("dart-scope-bar-body");
    expect(within(body).getByText("DEFI")).toBeTruthy();
    expect(within(body).getByText("CARRY_AND_YIELD")).toBeTruthy();
    expect(within(body).getByText("CARRY_BASIS_PERP")).toBeTruthy();
  });

  it("renders editable chip rows with 'all' placeholder when no filters set", async () => {
    // 2026-04-30 polish-pass-1: the read-only "none — viewing all strategies"
    // copy was replaced with editable chip rows. When a row has no chips
    // selected, the placeholder is "all" inline next to the axis label.
    const user = userEvent.setup();
    render(<DartScopeBar />);
    await user.click(screen.getByTestId("dart-scope-bar-toggle"));
    // 6 axis rows render: ag, it, fam, arch, sc, venue.
    expect(screen.getByTestId("scope-chip-axis-ag")).toBeTruthy();
    expect(screen.getByTestId("scope-chip-axis-fam")).toBeTruthy();
    expect(screen.getByTestId("scope-chip-axis-arch")).toBeTruthy();
    expect(screen.getByTestId("scope-chip-axis-sc")).toBeTruthy();
    expect(screen.getByTestId("scope-chip-axis-it")).toBeTruthy();
    expect(screen.getByTestId("scope-chip-axis-venue")).toBeTruthy();
  });
});

describe("DartScopeBar — Live badge", () => {
  it("shows the LIVE pulse badge when stream=live", async () => {
    act(() => {
      useWorkspaceScopeStore.getState().setExecutionStream("live", "scope-bar");
    });
    render(<DartScopeBar defaultExpanded />);
    expect(screen.getByTestId("scope-execution-stream-live-badge")).toBeTruthy();
  });

  it("hides the LIVE badge when stream=paper", () => {
    render(<DartScopeBar defaultExpanded />);
    expect(screen.queryByTestId("scope-execution-stream-live-badge")).toBeNull();
  });
});
