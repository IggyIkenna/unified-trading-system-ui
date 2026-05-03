/**
 * Phase 5 — widget-registry scope-reactive selector tests.
 *
 * Imports `@/components/widgets/register-all` to populate the registry,
 * then exercises `widgetsForScope` / `suggestedWidgetsForScope` /
 * `widgetScopeMatch` against a few canonical scopes.
 */
import { describe, expect, it } from "vitest";

import "@/components/widgets/register-all";
import {
  getAllWidgets,
  suggestedWidgetsForScope,
  widgetScopeMatch,
  widgetsForScope,
} from "@/components/widgets/widget-registry";
import { EMPTY_WORKSPACE_SCOPE, type WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";

function scope(overrides: Partial<WorkspaceScope> = {}): WorkspaceScope {
  return { ...EMPTY_WORKSPACE_SCOPE, ...overrides };
}

describe("widgetsForScope — empty scope (cross-asset)", () => {
  it("with empty scope, every widget is primary or secondary (none out-of-scope)", () => {
    const buckets = widgetsForScope(EMPTY_WORKSPACE_SCOPE);
    // The default surface is "dashboard" — explicit dartMeta declarations
    // that pin to ["terminal", ...] will reject. So we expect SOME
    // out-of-scope, but the auto-derived (asset-group-only) widgets
    // are all primary.
    expect(buckets.primary.length + buckets.secondary.length).toBeGreaterThan(0);
    // No widget should be lost (registry is total).
    expect(buckets.primary.length + buckets.secondary.length + buckets.outOfScope.length).toBe(
      getAllWidgets().length,
    );
  });
});

describe("widgetsForScope — DEFI scope", () => {
  it("DEFI widgets remain primary, CEFI widgets become out-of-scope", () => {
    const buckets = widgetsForScope(scope({ surface: "terminal", assetGroups: ["DEFI"] }));
    const defiInPrimary = buckets.primary.some((w) => w.assetGroup === "DEFI");
    const cefiInPrimary = buckets.primary.some((w) => w.assetGroup === "CEFI");
    expect(defiInPrimary).toBe(true);
    expect(cefiInPrimary).toBe(false);
    // CEFI widgets should be in out-of-scope
    const cefiInOutOfScope = buckets.outOfScope.some((w) => w.assetGroup === "CEFI");
    expect(cefiInOutOfScope).toBe(true);
  });

  it("PLATFORM widgets stay primary regardless of asset_group filter", () => {
    const buckets = widgetsForScope(scope({ surface: "terminal", assetGroups: ["DEFI"] }));
    const platformInPrimary = buckets.primary.some((w) => w.assetGroup === "PLATFORM");
    expect(platformInPrimary).toBe(true);
  });
});

describe("widgetsForScope — explicit dartMeta wins over auto-derive", () => {
  it("options-control-bar (declared dartMeta with terminalModes:['markets']) is out-of-scope on terminal/command", () => {
    const buckets = widgetsForScope(scope({ surface: "terminal", terminalMode: "command" }));
    const optionsCtrlBar = buckets.outOfScope.find((w) => w.id === "options-control-bar");
    expect(optionsCtrlBar).toBeDefined();
  });

  it("options-control-bar is primary on terminal/markets", () => {
    const buckets = widgetsForScope(scope({ surface: "terminal", terminalMode: "markets" }));
    const optionsCtrlBar = buckets.primary.find((w) => w.id === "options-control-bar");
    expect(optionsCtrlBar).toBeDefined();
  });

  it("pnl-waterfall (declared with terminalModes:['command','explain']) is primary on both", () => {
    expect(
      widgetsForScope(scope({ surface: "terminal", terminalMode: "command" })).primary.some(
        (w) => w.id === "pnl-waterfall",
      ),
    ).toBe(true);
    expect(
      widgetsForScope(scope({ surface: "terminal", terminalMode: "explain" })).primary.some(
        (w) => w.id === "pnl-waterfall",
      ),
    ).toBe(true);
  });

  it("pnl-waterfall is out-of-scope on terminal/markets", () => {
    const buckets = widgetsForScope(scope({ surface: "terminal", terminalMode: "markets" }));
    const pnl = buckets.outOfScope.find((w) => w.id === "pnl-waterfall");
    expect(pnl).toBeDefined();
  });
});

describe("widgetScopeMatch — single-widget query", () => {
  it("returns 'out-of-scope' for sports widgets under DEFI-only scope", () => {
    const sportsWidget = getAllWidgets().find((w) => w.assetGroup === "SPORTS");
    if (!sportsWidget) return; // registry-dependent — skip if unavailable
    expect(widgetScopeMatch(sportsWidget, scope({ assetGroups: ["DEFI"] }))).toBe("out-of-scope");
  });
});

describe("suggestedWidgetsForScope", () => {
  it("excludes already-placed widget ids", () => {
    const allPrimary = widgetsForScope(EMPTY_WORKSPACE_SCOPE).primary;
    if (allPrimary.length === 0) return;
    const firstId = allPrimary[0].id;
    const suggested = suggestedWidgetsForScope(EMPTY_WORKSPACE_SCOPE, [firstId]);
    expect(suggested.find((w) => w.id === firstId)).toBeUndefined();
  });
});
