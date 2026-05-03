/**
 * TerminalModeTabs — component-level unit tests.
 *
 * Phase 3 of dart_ux_cockpit_refactor §5.2 + §17.
 *
 * Coverage:
 *   - All 5 modes render
 *   - Active mode resolved from URL (terminalModeForPath wins)
 *   - Falls back to scope.terminalMode when path doesn't match
 *   - Falls back to "command" default when neither URL nor scope has a mode
 *   - Click flips scope.terminalMode + scope.surface
 *   - Route navigation auto-syncs scope.terminalMode
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TerminalModeTabs } from "@/components/cockpit/terminal-mode-tabs";
import { useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";

// Mocked next/navigation pathname — set per-test via mockReturnValue.
const mockUsePathname = vi.fn<() => string>(() => "/dashboard");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mocked next/link — render as a regular <a> so userEvent.click works.
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
            // Prevent jsdom from trying to navigate the document.
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

describe("TerminalModeTabs — render", () => {
  it("renders all 5 mode tabs", () => {
    render(<TerminalModeTabs />);
    expect(screen.getByTestId("terminal-mode-tab-command")).toBeTruthy();
    expect(screen.getByTestId("terminal-mode-tab-markets")).toBeTruthy();
    expect(screen.getByTestId("terminal-mode-tab-strategies")).toBeTruthy();
    expect(screen.getByTestId("terminal-mode-tab-explain")).toBeTruthy();
    expect(screen.getByTestId("terminal-mode-tab-ops")).toBeTruthy();
  });

  it("each tab has a meaningful tagline", () => {
    render(<TerminalModeTabs />);
    expect(screen.getByText(/Live P&L, positions, orders, alerts/i)).toBeTruthy();
    expect(screen.getByText(/Spreads, order books, liquidity, vol/i)).toBeTruthy();
    expect(screen.getByText(/Running, paper, promoted, config/i)).toBeTruthy();
    expect(screen.getByText(/P&L attribution, execution quality, drift/i)).toBeTruthy();
    expect(screen.getByText(/Service health, incidents, audit, feeds/i)).toBeTruthy();
  });
});

describe("TerminalModeTabs — active mode resolution", () => {
  it("falls back to 'command' when path + scope are both empty", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<TerminalModeTabs />);
    expect(screen.getByTestId("terminal-mode-tabs").getAttribute("data-active-mode")).toBe("command");
  });

  it("URL path wins over scope.terminalMode", () => {
    mockUsePathname.mockReturnValue("/services/observe/event-audit");
    act(() => {
      useWorkspaceScopeStore.getState().setSurface("terminal", "scope-bar");
      useWorkspaceScopeStore.getState().setTerminalMode("strategies", "scope-bar");
    });
    render(<TerminalModeTabs />);
    // /services/observe/event-audit → ops (URL wins despite scope says "strategies")
    expect(screen.getByTestId("terminal-mode-tabs").getAttribute("data-active-mode")).toBe("ops");
  });

  it("falls back to scope.terminalMode when URL doesn't match a Terminal route", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    act(() => {
      useWorkspaceScopeStore.getState().setSurface("terminal", "scope-bar");
      useWorkspaceScopeStore.getState().setTerminalMode("explain", "scope-bar");
    });
    render(<TerminalModeTabs />);
    expect(screen.getByTestId("terminal-mode-tabs").getAttribute("data-active-mode")).toBe("explain");
  });

  it("renders the indicator bar on the active tab only", () => {
    mockUsePathname.mockReturnValue("/services/trading/markets");
    render(<TerminalModeTabs />);
    expect(screen.getByTestId("terminal-mode-tab-markets-indicator")).toBeTruthy();
    expect(screen.queryByTestId("terminal-mode-tab-command-indicator")).toBeNull();
    expect(screen.queryByTestId("terminal-mode-tab-explain-indicator")).toBeNull();
  });

  it("aria-current='page' marks the active tab", () => {
    mockUsePathname.mockReturnValue("/services/trading/strategies");
    render(<TerminalModeTabs />);
    expect(screen.getByTestId("terminal-mode-tab-strategies").getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("terminal-mode-tab-command").getAttribute("aria-current")).toBeNull();
  });
});

describe("TerminalModeTabs — click flips scope.terminalMode + scope.surface", () => {
  it("clicking Markets sets scope.terminalMode='markets' and scope.surface='terminal'", async () => {
    const user = userEvent.setup();
    mockUsePathname.mockReturnValue("/dashboard");
    render(<TerminalModeTabs />);
    await user.click(screen.getByTestId("terminal-mode-tab-markets"));
    expect(useWorkspaceScopeStore.getState().scope.terminalMode).toBe("markets");
    expect(useWorkspaceScopeStore.getState().scope.surface).toBe("terminal");
  });

  it("clicking Explain switches mode without re-flipping surface (already terminal)", async () => {
    const user = userEvent.setup();
    mockUsePathname.mockReturnValue("/dashboard");
    act(() => {
      useWorkspaceScopeStore.getState().setSurface("terminal", "scope-bar");
    });
    render(<TerminalModeTabs />);
    await user.click(screen.getByTestId("terminal-mode-tab-explain"));
    expect(useWorkspaceScopeStore.getState().scope.terminalMode).toBe("explain");
    expect(useWorkspaceScopeStore.getState().scope.surface).toBe("terminal");
  });

  it("the link href routes to the mode's defaultHref", () => {
    render(<TerminalModeTabs />);
    expect(screen.getByTestId("terminal-mode-tab-command").getAttribute("href")).toBe(
      "/services/trading/overview",
    );
    expect(screen.getByTestId("terminal-mode-tab-markets").getAttribute("href")).toBe(
      "/services/trading/markets",
    );
    expect(screen.getByTestId("terminal-mode-tab-strategies").getAttribute("href")).toBe(
      "/services/trading/strategies",
    );
    expect(screen.getByTestId("terminal-mode-tab-explain").getAttribute("href")).toBe(
      "/services/observe/reconciliation",
    );
    expect(screen.getByTestId("terminal-mode-tab-ops").getAttribute("href")).toBe("/services/observe/risk");
  });
});

describe("TerminalModeTabs — route → scope auto-sync (deep-link contract)", () => {
  it("auto-flips scope.surface=terminal + scope.terminalMode when URL anchors a mode", () => {
    mockUsePathname.mockReturnValue("/services/trading/orders");
    render(<TerminalModeTabs />);
    // The useEffect runs after first render; assert AFTER mount.
    expect(useWorkspaceScopeStore.getState().scope.surface).toBe("terminal");
    expect(useWorkspaceScopeStore.getState().scope.terminalMode).toBe("command");
  });

  it("auto-flips to explain when landing on /services/observe/reconciliation", () => {
    mockUsePathname.mockReturnValue("/services/observe/reconciliation");
    render(<TerminalModeTabs />);
    expect(useWorkspaceScopeStore.getState().scope.surface).toBe("terminal");
    expect(useWorkspaceScopeStore.getState().scope.terminalMode).toBe("explain");
  });

  it("does NOT mutate scope when URL doesn't match a Terminal route", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    act(() => {
      useWorkspaceScopeStore.getState().setSurface("dashboard", "scope-bar");
      useWorkspaceScopeStore.getState().setTerminalMode(null, "scope-bar");
    });
    render(<TerminalModeTabs />);
    expect(useWorkspaceScopeStore.getState().scope.surface).toBe("dashboard");
    expect(useWorkspaceScopeStore.getState().scope.terminalMode).toBeNull();
  });
});
