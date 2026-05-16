import { describe, expect, it } from "vitest";

import {
  matchWidgetToScope,
  synthesiseDartMetaFromAssetGroup,
  type DartWidgetMeta,
} from "@/lib/cockpit/widget-meta";
import { EMPTY_WORKSPACE_SCOPE, type WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";

function scope(overrides: Partial<WorkspaceScope> = {}): WorkspaceScope {
  return { ...EMPTY_WORKSPACE_SCOPE, ...overrides };
}

describe("matchWidgetToScope", () => {
  it("returns 'primary' for legacy widgets without dartMeta", () => {
    expect(matchWidgetToScope(undefined, EMPTY_WORKSPACE_SCOPE)).toBe("primary");
  });

  it("respects the surfaces axis — out-of-scope when scope.surface isn't listed", () => {
    const meta: DartWidgetMeta = { surfaces: ["terminal"] };
    expect(matchWidgetToScope(meta, scope({ surface: "research" }))).toBe("out-of-scope");
    expect(matchWidgetToScope(meta, scope({ surface: "terminal" }))).toBe("primary");
  });

  it("respects the terminalModes axis when surface=terminal", () => {
    const meta: DartWidgetMeta = { surfaces: ["terminal"], terminalModes: ["command"] };
    expect(matchWidgetToScope(meta, scope({ surface: "terminal", terminalMode: "command" }))).toBe("primary");
    expect(matchWidgetToScope(meta, scope({ surface: "terminal", terminalMode: "markets" }))).toBe(
      "out-of-scope",
    );
  });

  it("ignores terminalModes when surface=research", () => {
    const meta: DartWidgetMeta = { terminalModes: ["command"] };
    // Research surface — terminalModes axis doesn't apply.
    expect(matchWidgetToScope(meta, scope({ surface: "research", terminalMode: "command" }))).toBe("primary");
  });

  it("respects the researchStages axis when surface=research", () => {
    const meta: DartWidgetMeta = { surfaces: ["research"], researchStages: ["validate"] };
    expect(matchWidgetToScope(meta, scope({ surface: "research", researchStage: "validate" }))).toBe("primary");
    expect(matchWidgetToScope(meta, scope({ surface: "research", researchStage: "discover" }))).toBe(
      "out-of-scope",
    );
  });

  it("respects the engagement axis", () => {
    const meta: DartWidgetMeta = { engagements: ["replicate"] };
    expect(matchWidgetToScope(meta, scope({ engagement: "monitor" }))).toBe("out-of-scope");
    expect(matchWidgetToScope(meta, scope({ engagement: "replicate" }))).toBe("primary");
  });

  it("respects the executionStream axis", () => {
    const meta: DartWidgetMeta = { executionStreams: ["paper"] };
    expect(matchWidgetToScope(meta, scope({ executionStream: "live" }))).toBe("out-of-scope");
    expect(matchWidgetToScope(meta, scope({ executionStream: "paper" }))).toBe("primary");
  });

  it("scopePredicate is a hard veto", () => {
    const meta: DartWidgetMeta = {
      scopePredicate: (s) => s.assetGroups.includes("DEFI"),
    };
    expect(matchWidgetToScope(meta, scope({ assetGroups: [] }))).toBe("out-of-scope");
    expect(matchWidgetToScope(meta, scope({ assetGroups: ["DEFI"] }))).toBe("primary");
  });

  it("downgrades to 'secondary' when meta.importance='secondary'", () => {
    const meta: DartWidgetMeta = { importance: "secondary" };
    expect(matchWidgetToScope(meta, EMPTY_WORKSPACE_SCOPE)).toBe("secondary");
  });

  it("'supporting' also collapses to secondary in the match return type", () => {
    const meta: DartWidgetMeta = { importance: "supporting" };
    expect(matchWidgetToScope(meta, EMPTY_WORKSPACE_SCOPE)).toBe("secondary");
  });

  it("empty arrays on declared axes don't constrain matching", () => {
    const meta: DartWidgetMeta = { surfaces: [], engagements: [] };
    expect(matchWidgetToScope(meta, EMPTY_WORKSPACE_SCOPE)).toBe("primary");
  });

  it("scope.terminalMode=null bypasses the terminalModes axis (no constraint)", () => {
    const meta: DartWidgetMeta = { surfaces: ["terminal"], terminalModes: ["command"] };
    expect(matchWidgetToScope(meta, scope({ surface: "terminal", terminalMode: null }))).toBe("primary");
  });
});

describe("synthesiseDartMetaFromAssetGroup", () => {
  it("PLATFORM widgets surface across dashboard / terminal / research / reports", () => {
    const meta = synthesiseDartMetaFromAssetGroup("PLATFORM");
    expect(meta.surfaces).toContain("dashboard");
    expect(meta.surfaces).toContain("terminal");
    expect(meta.surfaces).toContain("research");
    expect(meta.surfaces).toContain("reports");
  });

  it("PLATFORM widget has no scope predicate (always primary regardless of asset_group)", () => {
    const meta = synthesiseDartMetaFromAssetGroup("PLATFORM");
    expect(meta.scopePredicate).toBeUndefined();
    expect(matchWidgetToScope(meta, scope({ assetGroups: ["DEFI"] }))).toBe("primary");
    expect(matchWidgetToScope(meta, EMPTY_WORKSPACE_SCOPE)).toBe("primary");
  });

  it("DEFI widget is primary when scope is cross-asset", () => {
    const meta = synthesiseDartMetaFromAssetGroup("DEFI");
    expect(matchWidgetToScope(meta, EMPTY_WORKSPACE_SCOPE)).toBe("primary");
  });

  it("DEFI widget is primary when scope.assetGroups includes DEFI", () => {
    const meta = synthesiseDartMetaFromAssetGroup("DEFI");
    expect(matchWidgetToScope(meta, scope({ assetGroups: ["DEFI"] }))).toBe("primary");
  });

  it("DEFI widget is out-of-scope when scope.assetGroups excludes DEFI", () => {
    const meta = synthesiseDartMetaFromAssetGroup("DEFI");
    expect(matchWidgetToScope(meta, scope({ assetGroups: ["CEFI"] }))).toBe("out-of-scope");
  });

  it("SPORTS widget is out-of-scope under DEFI-only scope", () => {
    const meta = synthesiseDartMetaFromAssetGroup("SPORTS");
    expect(matchWidgetToScope(meta, scope({ assetGroups: ["DEFI"] }))).toBe("out-of-scope");
  });
});
