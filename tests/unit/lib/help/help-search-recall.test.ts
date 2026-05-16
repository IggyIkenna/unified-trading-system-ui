/**
 * Search-recall breadth — per-widget, per-archetype, per-family, per-asset-group.
 *
 * The smoke tests in help-tree.test.ts cover ~10 hand-picked queries.
 * This file expands to **every** primitive: for each widget / archetype /
 * family / asset group, we tokenise the user-visible label, run the
 * search, and assert the matching node appears in the top-K results.
 *
 * Catches regressions like: widget renamed → its old keyword stops
 * matching; new archetype shipped → search doesn't reach it; help-search
 * synonym table edited and floods scoring on unrelated queries.
 *
 * Allow some slack — labels with very generic words ("Table", "Chart",
 * "Overview") may not surface in top-5. The test runs both:
 *   - strict: every primitive in top-10 from its label
 *   - loose: every primitive in top-25 from its id (the id is a unique token)
 */

import { describe, expect, it } from "vitest";

import "@/components/widgets/register-all";
import { getAllWidgets } from "@/components/widgets/widget-registry";
import { STRATEGY_ARCHETYPES_V2, STRATEGY_FAMILIES_V2, VENUE_ASSET_GROUPS_V2 } from "@/lib/architecture-v2/enums";
import { FAMILY_METADATA } from "@/lib/architecture-v2/families";
import { searchHelp } from "@/lib/help/help-search";

const TOP_K_STRICT = 10;
const TOP_K_LOOSE = 25;

describe("help-search recall — every widget is reachable from its label", () => {
  const widgets = getAllWidgets();

  // Some widget labels are shared across domains (e.g. several pages have a
  // "Trade History" widget). For those, label-only search can't deterministically
  // surface the specific id — the user is ambiguous. The strict label test
  // runs on widgets with UNIQUE labels; the loose id-search test below
  // covers all widgets unconditionally.
  const labelCounts = new Map<string, number>();
  for (const w of widgets) labelCounts.set(w.label, (labelCounts.get(w.label) ?? 0) + 1);
  const uniqueLabelWidgets = widgets.filter((w) => labelCounts.get(w.label) === 1);

  // Known generic-label widgets — labels like "Quick Trade" / "Order Book" /
  // "Positions" are too overloaded by the existing trade/order/positions
  // synonym fan-out to deterministically surface a single widget id in
  // top-K. They're all reachable via id-search (loose test below) and via
  // the catalogue browse menu. If a widget is added with one of these
  // labels and it actually IS the canonical one, remove it from the
  // ambiguous list and the strict test will start asserting recall.
  const AMBIGUOUS_LABELS = new Set<string>(["Quick Trade", "Order Book", "Trade Book"]);
  const strictLabelWidgets = uniqueLabelWidgets.filter((w) => !AMBIGUOUS_LABELS.has(w.label));

  it.each(strictLabelWidgets.map((w) => [w.id, w.label] as const))(
    "search '%s' (label) finds widget-%s in top %d",
    (id, label) => {
      const matches = searchHelp(label, TOP_K_STRICT);
      const ids = matches.map((m) => m.id);
      expect(
        ids,
        `widget "${label}" not reachable in top ${TOP_K_STRICT} via its label.\nReturned: ${ids.join(", ")}`,
      ).toContain(`widget-${id}`);
    },
  );

  // For shared-label widgets, assert that AT LEAST ONE widget with that
  // label is in top-K — the bot returns A relevant answer, even if it
  // can't disambiguate without more context.
  const sharedLabelEntries = Array.from(labelCounts.entries()).filter(([, c]) => c > 1);
  it.each(sharedLabelEntries.map(([label, count]) => [label, count] as const))(
    "search '%s' (shared by %d widgets) returns at least one matching widget node",
    (label) => {
      const matches = searchHelp(label, TOP_K_STRICT);
      const ids = matches.map((m) => m.id);
      const matching = widgets.filter((w) => w.label === label).map((w) => `widget-${w.id}`);
      const hit = matching.some((id) => ids.includes(id));
      expect(hit, `none of [${matching.join(", ")}] reached top ${TOP_K_STRICT} for label "${label}"`).toBe(true);
    },
  );

  it.each(widgets.map((w) => [w.id] as const))("search '%s' (raw id) finds widget-%s in top %d (loose)", (id) => {
    // Search the raw widget id verbatim — should be a near-perfect match
    // because the help-node id contains it. This is the loose recall test;
    // it should always pass even when label search is fuzzy.
    const matches = searchHelp(id, TOP_K_LOOSE);
    const ids = matches.map((m) => m.id);
    expect(
      ids,
      `widget "${id}" not reachable in top ${TOP_K_LOOSE} via id-token search.\nReturned: ${ids.slice(0, 10).join(", ")}…`,
    ).toContain(`widget-${id}`);
  });
});

describe("help-search recall — every archetype is reachable", () => {
  it.each(STRATEGY_ARCHETYPES_V2.map((a) => [a] as const))(
    "search archetype id '%s' finds the node in top %d",
    (archetype) => {
      const matches = searchHelp(archetype, TOP_K_STRICT);
      const ids = matches.map((m) => m.id);
      expect(
        ids,
        `archetype ${archetype} not reachable in top ${TOP_K_STRICT}.\nReturned: ${ids.join(", ")}`,
      ).toContain(`archetype-${archetype}`);
    },
  );

  it.each(STRATEGY_ARCHETYPES_V2.map((a) => [a, a.toLowerCase().replace(/_/g, " ")] as const))(
    "search archetype natural-language '%s' (from %s) finds the node in top %d (loose)",
    (archetype, query) => {
      // E.g. "carry recursive staked" should find CARRY_RECURSIVE_STAKED.
      const matches = searchHelp(query, TOP_K_LOOSE);
      const ids = matches.map((m) => m.id);
      expect(
        ids,
        `archetype ${archetype} not reachable from natural-language "${query}" in top ${TOP_K_LOOSE}`,
      ).toContain(`archetype-${archetype}`);
    },
  );
});

describe("help-search recall — every family is reachable", () => {
  it.each(STRATEGY_FAMILIES_V2.map((f) => [f, FAMILY_METADATA[f].label] as const))(
    "search '%s' (label %s) finds family-%s in top %d",
    (family, label) => {
      const matches = searchHelp(label, TOP_K_STRICT);
      const ids = matches.map((m) => m.id);
      expect(
        ids,
        `family ${family} not reachable in top ${TOP_K_STRICT} via label "${label}".\nReturned: ${ids.join(", ")}`,
      ).toContain(`family-${family}`);
    },
  );
});

describe("help-search recall — every asset group is reachable", () => {
  it.each(VENUE_ASSET_GROUPS_V2.map((g) => [g] as const))("search '%s' finds asset-group-%s in top %d", (group) => {
    const matches = searchHelp(group, TOP_K_STRICT);
    const ids = matches.map((m) => m.id);
    expect(ids, `asset group ${group} not reachable in top ${TOP_K_STRICT}.\nReturned: ${ids.join(", ")}`).toContain(
      `asset-group-${group}`,
    );
  });
});
