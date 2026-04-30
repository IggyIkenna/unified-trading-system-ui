import { describe, expect, it } from "vitest";

import { LOCKED_PREVIEWS, previewsForScope } from "@/lib/cockpit/locked-previews";
import { EMPTY_WORKSPACE_SCOPE, type WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";

function scope(overrides: Partial<WorkspaceScope> = {}): WorkspaceScope {
  return { ...EMPTY_WORKSPACE_SCOPE, ...overrides };
}

describe("LOCKED_PREVIEWS — registry shape", () => {
  it("ships at least 5 scope-aware previews", () => {
    expect(LOCKED_PREVIEWS.length).toBeGreaterThanOrEqual(5);
  });

  it("each preview has title / buyerValue / capabilities / cta + ctaHref", () => {
    for (const p of LOCKED_PREVIEWS) {
      expect(p.title).toBeTruthy();
      expect(p.buyerValue).toBeTruthy();
      expect(p.lockedCapabilities.length).toBeGreaterThan(0);
      expect(p.cta).toBeTruthy();
      expect(p.ctaHref).toMatch(/^\//);
    }
  });

  it("CTAs route to /help/system-map by default (Phase 7 single help surface)", () => {
    for (const p of LOCKED_PREVIEWS) {
      expect(p.ctaHref).toBe("/help/system-map");
    }
  });
});

describe("previewsForScope — scope-specific filtering", () => {
  it("DEFI scope → DeFi yield research surfaces", () => {
    const matched = previewsForScope(scope({ assetGroups: ["DEFI"] }));
    expect(matched.find((p) => p.id === "defi-yield-research")).toBeDefined();
  });

  it("DEFI-only scope hides Vol Lab + Sports previews (no scope match)", () => {
    const matched = previewsForScope(scope({ assetGroups: ["DEFI"] }));
    expect(matched.find((p) => p.id === "volatility-lab")).toBeUndefined();
    expect(matched.find((p) => p.id === "sports-execution-simulation")).toBeUndefined();
  });

  it("ARBITRAGE_STRUCTURAL family → arbitrage-promotion-checks surfaces", () => {
    const matched = previewsForScope(scope({ families: ["ARBITRAGE_STRUCTURAL"] }));
    expect(matched.find((p) => p.id === "arbitrage-promotion-checks")).toBeDefined();
  });

  it("option instrumentType → vol lab surfaces", () => {
    const matched = previewsForScope(scope({ instrumentTypes: ["option"] }));
    expect(matched.find((p) => p.id === "volatility-lab")).toBeDefined();
  });

  it("VOL_TRADING family → vol lab surfaces", () => {
    const matched = previewsForScope(scope({ families: ["VOL_TRADING"] }));
    expect(matched.find((p) => p.id === "volatility-lab")).toBeDefined();
  });

  it("SPORTS scope → sports preview surfaces", () => {
    const matched = previewsForScope(scope({ assetGroups: ["SPORTS"] }));
    expect(matched.find((p) => p.id === "sports-execution-simulation")).toBeDefined();
  });

  it("PREDICTION scope also matches sports preview (event-driven)", () => {
    const matched = previewsForScope(scope({ assetGroups: ["PREDICTION"] }));
    expect(matched.find((p) => p.id === "sports-execution-simulation")).toBeDefined();
  });

  it("surface=signals → signal-quality-analytics surfaces", () => {
    const matched = previewsForScope(scope({ surface: "signals" }));
    expect(matched.find((p) => p.id === "signal-quality-analytics")).toBeDefined();
  });

  it("empty scope → arbitrage-promotion-checks (default-on for cross-asset users)", () => {
    const matched = previewsForScope(EMPTY_WORKSPACE_SCOPE);
    expect(matched.find((p) => p.id === "arbitrage-promotion-checks")).toBeDefined();
  });
});
