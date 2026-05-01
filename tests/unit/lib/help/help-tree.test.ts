import { describe, expect, it } from "vitest";

import { searchHelp } from "@/lib/help/help-search";
import { HELP_TREE, type HelpNode } from "@/lib/help/help-tree";

function flatten(nodes: readonly HelpNode[]): HelpNode[] {
  const out: HelpNode[] = [];
  function walk(list: readonly HelpNode[]) {
    for (const n of list) {
      out.push(n);
      if (n.children) walk(n.children);
    }
  }
  walk(nodes);
  return out;
}

const ALL = flatten(HELP_TREE);
const ALL_HREFS = ALL.map((n) => n.link?.href).filter((h): h is string => Boolean(h));

describe("help-tree — top-level cockpit knowledge sections", () => {
  it("ships the 5 new cockpit-knowledge top-level nodes", () => {
    const ids = new Set(HELP_TREE.map((n) => n.id));
    expect(ids.has("cockpit"), "cockpit primer node missing").toBe(true);
    expect(ids.has("presets"), "presets node missing").toBe(true);
    expect(ids.has("availability"), "availability resolver node missing").toBe(true);
    expect(ids.has("config-lifecycle"), "config-lifecycle node missing").toBe(true);
    expect(ids.has("mock-mode"), "mock-mode node missing").toBe(true);
  });

  it("the cockpit primer covers scope, modes, research stages, engagement, and deep links", () => {
    const cockpit = HELP_TREE.find((n) => n.id === "cockpit");
    expect(cockpit).toBeDefined();
    const childIds = new Set(cockpit!.children?.map((c) => c.id));
    expect(childIds.has("cockpit-scope-bar")).toBe(true);
    expect(childIds.has("cockpit-modes")).toBe(true);
    expect(childIds.has("cockpit-research-stages")).toBe(true);
    expect(childIds.has("cockpit-monitor-vs-replicate")).toBe(true);
    expect(childIds.has("cockpit-deep-link")).toBe(true);
  });

  it("ships an entry for every starter preset (8 presets)", () => {
    const presets = HELP_TREE.find((n) => n.id === "presets");
    expect(presets).toBeDefined();
    const childIds = new Set(presets!.children?.map((c) => c.id));
    for (const id of [
      "preset-arbitrage-command",
      "preset-defi-yield",
      "preset-vol-lab",
      "preset-sports-prediction",
      "preset-signals-in",
      "preset-research-to-live",
      "preset-live-trading-desk",
      "preset-executive",
    ]) {
      expect(childIds.has(id), `${id} preset description missing`).toBe(true);
    }
  });
});

describe("help-tree — regression guards on legacy URLs", () => {
  // After Phase 9 wave 2, the cockpit owns positions/orders/risk/pnl/etc.
  // Help-tree links must not reference deleted routes.
  const DELETED_PATHS = [
    "/services/trading/positions",
    "/services/trading/orders",
    "/services/trading/risk",
    "/services/trading/pnl",
    "/services/trading/alerts",
    "/services/trading/accounts",
    "/services/trading/markets",
    "/services/trading/terminal",
    "/services/trading/book",
    "/services/trading/instructions",
    "/services/trading/deployment",
    "/services/trading/strategy-config",
    "/services/trading/overview",
    "/services/trading/defi",
    "/services/trading/sports",
    "/services/trading/predictions",
    "/services/trading/options",
    "/services/trading/tradfi",
    "/services/observe/health",
    "/services/observe/risk",
    "/services/observe/news",
    "/services/observe/alerts",
    "/services/observe/registry",
    "/services/observe/strategy-health",
    "/services/observe/scenarios",
    "/services/observe/recovery",
    "/services/observe/event-audit",
    "/services/observe/reconciliation",
  ];

  it.each(DELETED_PATHS)("no help-tree node links to deleted path %s", (path) => {
    // Allow these as scope-suffixed (e.g. workspace?...&ag=DEFI) but never as
    // bare deleted-page hrefs.
    const hits = ALL_HREFS.filter((h) => h === path || h.startsWith(`${path}?`) || h.startsWith(`${path}/`));
    expect(hits, `help-tree still links to ${path}: ${hits.join(", ")}`).toHaveLength(0);
  });
});

describe("help-search — cockpit vocabulary surfaces relevant nodes", () => {
  it("'cockpit' returns the cockpit primer", () => {
    const matches = searchHelp("cockpit", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("cockpit");
  });

  it("'workspace presets' returns presets node", () => {
    const matches = searchHelp("workspace presets", 5);
    const ids = matches.map((m) => m.id);
    expect(ids.some((id) => id === "presets" || id.startsWith("preset-"))).toBe(true);
  });

  it("'arbitrage command' returns the arbitrage preset", () => {
    const matches = searchHelp("arbitrage command", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("preset-arbitrage-command");
  });

  it("'replicate engagement' returns the monitor-vs-replicate node", () => {
    const matches = searchHelp("replicate engagement", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("cockpit-monitor-vs-replicate");
  });

  it("'locked preview' returns the FOMO node", () => {
    const matches = searchHelp("locked preview", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("availability-locked-preview");
  });

  it("'assumption stack' returns the assumption-stack node", () => {
    const matches = searchHelp("assumption stack", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("config-assumption-stack");
  });

  it("'freeze mock data' returns the freeze node", () => {
    const matches = searchHelp("freeze mock data", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("mock-freeze");
  });

  it("'tier zero scenario' returns the scenario-matrix node", () => {
    const matches = searchHelp("tier zero scenario", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("mock-scenarios");
  });

  it("'where did /services/observe go' returns the deep-link node", () => {
    const matches = searchHelp("where did observe go", 5);
    const ids = matches.map((m) => m.id);
    expect(ids.some((id) => id === "cockpit-deep-link" || id === "nav-observe")).toBe(true);
  });
});
