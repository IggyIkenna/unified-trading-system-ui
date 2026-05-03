import { describe, expect, it } from "vitest";

import {
  TERMINAL_MODES,
  TERMINAL_MODE_META,
  defaultTerminalMode,
  terminalModeForPath,
} from "@/lib/cockpit/terminal-modes";

describe("TERMINAL_MODES — 5 buyer-facing modes per §5.2", () => {
  it("has exactly 5 modes", () => {
    expect(TERMINAL_MODES).toHaveLength(5);
  });

  it("includes Command, Markets, Strategies, Explain, Ops", () => {
    expect(TERMINAL_MODES).toContain("command");
    expect(TERMINAL_MODES).toContain("markets");
    expect(TERMINAL_MODES).toContain("strategies");
    expect(TERMINAL_MODES).toContain("explain");
    expect(TERMINAL_MODES).toContain("ops");
  });

  it("every mode has metadata + a defaultHref", () => {
    for (const mode of TERMINAL_MODES) {
      const meta = TERMINAL_MODE_META[mode];
      expect(meta.label).toBeTruthy();
      expect(meta.tagline).toBeTruthy();
      expect(meta.defaultHref).toMatch(/^\/services\//);
      expect(meta.routePrefixes.length).toBeGreaterThan(0);
    }
  });
});

describe("terminalModeForPath — route → mode resolution", () => {
  it("resolves Command for /services/trading/overview + nested routes", () => {
    expect(terminalModeForPath("/services/trading/overview")).toBe("command");
    expect(terminalModeForPath("/services/trading/positions")).toBe("command");
    expect(terminalModeForPath("/services/trading/orders/foo/bar")).toBe("command");
    expect(terminalModeForPath("/services/trading/pnl")).toBe("command");
    expect(terminalModeForPath("/services/trading/alerts")).toBe("command");
  });

  it("resolves Markets for asset-group market surfaces", () => {
    expect(terminalModeForPath("/services/trading/markets")).toBe("markets");
    expect(terminalModeForPath("/services/trading/defi")).toBe("markets");
    expect(terminalModeForPath("/services/trading/sports/bet")).toBe("markets");
    expect(terminalModeForPath("/services/trading/options/combos")).toBe("markets");
    expect(terminalModeForPath("/services/trading/predictions")).toBe("markets");
    expect(terminalModeForPath("/services/trading/tradfi")).toBe("markets");
  });

  it("resolves Strategies for the strategy operating surfaces", () => {
    expect(terminalModeForPath("/services/trading/strategies")).toBe("strategies");
    expect(terminalModeForPath("/services/trading/strategy-config")).toBe("strategies");
    expect(terminalModeForPath("/services/trading/deployment")).toBe("strategies");
  });

  it("resolves Explain for attribution / drift surfaces", () => {
    expect(terminalModeForPath("/services/observe/reconciliation")).toBe("explain");
    expect(terminalModeForPath("/services/observe/scenarios")).toBe("explain");
    expect(terminalModeForPath("/services/observe/strategy-health")).toBe("explain");
  });

  it("resolves Ops for service-health / audit / recovery", () => {
    expect(terminalModeForPath("/services/observe/health")).toBe("ops");
    expect(terminalModeForPath("/services/observe/event-audit")).toBe("ops");
    expect(terminalModeForPath("/services/observe/recovery")).toBe("ops");
    expect(terminalModeForPath("/services/observe/risk")).toBe("ops");
    expect(terminalModeForPath("/services/observe/news")).toBe("ops");
  });

  it("longest prefix wins — explain-specific routes resolve to explain, not ops", () => {
    // /services/observe/reconciliation matches the explicit explain prefix
    // (length 35) AND the generic ops prefix /services/observe (length 17).
    // Explain must win.
    expect(terminalModeForPath("/services/observe/reconciliation")).toBe("explain");
  });

  it("falls back to ops for unspecific /services/observe paths", () => {
    expect(terminalModeForPath("/services/observe")).toBe("ops");
  });

  it("returns null for non-cockpit paths", () => {
    expect(terminalModeForPath("/dashboard")).toBeNull();
    expect(terminalModeForPath("/services/research/strategies")).toBeNull();
    expect(terminalModeForPath("/")).toBeNull();
    expect(terminalModeForPath("/login")).toBeNull();
  });

  it("empty path returns null", () => {
    expect(terminalModeForPath("")).toBeNull();
  });
});

describe("defaultTerminalMode", () => {
  it("returns 'command' as the cockpit default", () => {
    expect(defaultTerminalMode()).toBe("command");
  });
});
