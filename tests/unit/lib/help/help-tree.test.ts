import { describe, expect, it } from "vitest";

import "@/components/widgets/register-all";
import { getAllWidgets } from "@/components/widgets/widget-registry";
import { STRATEGY_ARCHETYPES_V2, STRATEGY_FAMILIES_V2, VENUE_ASSET_GROUPS_V2 } from "@/lib/architecture-v2/enums";
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

describe("help-tree — generated catalogue branch covers every primitive", () => {
  const ALL_IDS = new Set(ALL.map((n) => n.id));

  it("includes the top-level browse-catalogue branch", () => {
    expect(ALL_IDS.has("browse-catalogue")).toBe(true);
    expect(ALL_IDS.has("browse-widgets")).toBe(true);
    expect(ALL_IDS.has("browse-archetypes")).toBe(true);
    expect(ALL_IDS.has("browse-families")).toBe(true);
    expect(ALL_IDS.has("browse-asset-groups")).toBe(true);
  });

  it("has a generated node for every registered widget", () => {
    const widgets = getAllWidgets();
    // Lower bound: registry has ~150 widgets at the time the help-tree was
    // wired. Allow growth but flag if a register.ts goes silently missing.
    expect(widgets.length).toBeGreaterThanOrEqual(120);
    for (const w of widgets) {
      expect(ALL_IDS.has(`widget-${w.id}`), `missing help node for widget "${w.id}"`).toBe(true);
    }
  });

  it("has a generated node for every strategy archetype", () => {
    for (const archetype of STRATEGY_ARCHETYPES_V2) {
      expect(ALL_IDS.has(`archetype-${archetype}`), `missing help node for archetype ${archetype}`).toBe(true);
    }
  });

  it("has a generated node for every strategy family", () => {
    for (const family of STRATEGY_FAMILIES_V2) {
      expect(ALL_IDS.has(`family-${family}`), `missing help node for family ${family}`).toBe(true);
    }
  });

  it("has a generated node for every asset group", () => {
    for (const group of VENUE_ASSET_GROUPS_V2) {
      expect(ALL_IDS.has(`asset-group-${group}`), `missing help node for asset group ${group}`).toBe(true);
    }
  });

  it("every generated widget node carries a workspace deep-link", () => {
    const widgetNodes = ALL.filter((n) => n.id.startsWith("widget-") && !n.id.startsWith("widget-group-"));
    expect(widgetNodes.length).toBeGreaterThanOrEqual(120);
    for (const node of widgetNodes) {
      expect(node.link?.href, `widget node ${node.id} has no link`).toBeDefined();
      expect(node.link?.href, `widget node ${node.id} link should target workspace cockpit`).toContain(
        "/services/workspace",
      );
    }
  });

  it("every archetype node links to strategy catalogue with arch= filter", () => {
    for (const archetype of STRATEGY_ARCHETYPES_V2) {
      const node = ALL.find((n) => n.id === `archetype-${archetype}`);
      expect(node?.link?.href).toContain(`arch=${archetype}`);
    }
  });

  it("every family node links to strategy catalogue with fam= filter", () => {
    for (const family of STRATEGY_FAMILIES_V2) {
      const node = ALL.find((n) => n.id === `family-${family}`);
      expect(node?.link?.href).toContain(`fam=${family}`);
    }
  });

  it("every asset-group node links to workspace with ag= filter", () => {
    for (const group of VENUE_ASSET_GROUPS_V2) {
      const node = ALL.find((n) => n.id === `asset-group-${group}`);
      expect(node?.link?.href).toContain(`ag=${group}`);
    }
  });
});

describe("help-tree — silent-regression guards", () => {
  // Without these, a new archetype / new widget would generate a "thin" node
  // (no blurb, empty description, generic fallback text) and tests above
  // would still pass — bot would technically have a node but the answer
  // would be useless. These guards force the generator (and the data it
  // pulls from) to stay rich.

  it("every archetype has a non-generic blurb in its generated answer", () => {
    for (const archetype of STRATEGY_ARCHETYPES_V2) {
      const node = ALL.find((n) => n.id === `archetype-${archetype}`);
      expect(node, `missing node for archetype ${archetype}`).toBeDefined();
      // Generic fallback text from help-tree-generated.ts when an
      // archetype is missing from ARCHETYPE_BLURB. If this fires, add a
      // blurb in lib/help/help-tree-generated.ts ARCHETYPE_BLURB.
      expect(
        node!.answer,
        `archetype ${archetype} fell back to the generic blurb — add an entry to ARCHETYPE_BLURB`,
      ).not.toMatch(/Strategy archetype in the .* family\.$/);
      // Family line is mandatory.
      expect(node!.answer, `archetype ${archetype} missing family line`).toMatch(/\*\*Family:\*\*/);
    }
  });

  it("every generated widget node has a non-empty description in its answer", () => {
    const widgetNodes = ALL.filter((n) => n.id.startsWith("widget-") && !n.id.startsWith("widget-group-"));
    for (const node of widgetNodes) {
      // Synthesised widget answer leads with widget.description; if a
      // register.ts ever sets description="" or omits it, the answer
      // starts with a newline — flag that as a regression.
      const firstLine = node.answer.split("\n")[0];
      expect(firstLine.trim().length, `widget ${node.id} has an empty description in the registry`).toBeGreaterThan(10);
    }
  });

  it("no help-tree node id collides with another (curated vs generated)", () => {
    const seen = new Map<string, number>();
    for (const node of ALL) {
      seen.set(node.id, (seen.get(node.id) ?? 0) + 1);
    }
    const dupes = Array.from(seen.entries()).filter(([, count]) => count > 1);
    expect(
      dupes,
      `duplicate help-node ids (curated may be shadowing a generated node): ${JSON.stringify(dupes)}`,
    ).toHaveLength(0);
  });

  it("every help-tree node has a non-empty answer", () => {
    for (const node of ALL) {
      expect(node.answer.trim().length, `node ${node.id} has empty answer`).toBeGreaterThan(0);
    }
  });

  it("every help-tree link href starts with / (no malformed URLs)", () => {
    const linked = ALL.filter((n) => n.link);
    for (const node of linked) {
      expect(node.link!.href, `node ${node.id} has malformed href: ${node.link!.href}`).toMatch(/^\//);
    }
  });
});

describe("help-search — generated nodes are searchable", () => {
  it("'iv smile widget' returns the generated widget node", () => {
    const matches = searchHelp("iv smile widget", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("widget-options-iv-smile");
  });

  it("'carry recursive staked' returns the archetype node", () => {
    const matches = searchHelp("carry recursive staked", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("archetype-CARRY_RECURSIVE_STAKED");
  });

  it("'liquidation capture' returns the archetype node", () => {
    const matches = searchHelp("liquidation capture", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("archetype-LIQUIDATION_CAPTURE");
  });

  it("'market making family' returns the family node", () => {
    const matches = searchHelp("market making family", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("family-MARKET_MAKING");
  });

  it("'arbitrage structural' returns a relevant family / archetype node", () => {
    const matches = searchHelp("arbitrage structural", 5);
    const ids = matches.map((m) => m.id);
    // Top-5 should surface at least one Arbitrage-Structural node — either the
    // family node, the archetype-group node, or one of the archetypes in it.
    const hit = ids.some(
      (id) =>
        id === "family-ARBITRAGE_STRUCTURAL" ||
        id === "archetype-group-arbitrage-structural" ||
        id.startsWith("archetype-ARBITRAGE") ||
        id === "archetype-LIQUIDATION_CAPTURE",
    );
    expect(hit, `expected an arbitrage-structural node in top 5: ${ids.join(", ")}`).toBe(true);
  });

  it("'cefi asset group' returns the asset-group node", () => {
    const matches = searchHelp("cefi asset group", 5);
    const ids = matches.map((m) => m.id);
    expect(ids).toContain("asset-group-CEFI");
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
