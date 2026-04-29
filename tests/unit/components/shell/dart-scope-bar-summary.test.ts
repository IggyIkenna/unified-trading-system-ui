import { describe, expect, it } from "vitest";

import { compactScopeLine, compactScopeSegments } from "@/components/shell/dart-scope-bar-summary";
import { EMPTY_WORKSPACE_SCOPE, type WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";

function scope(overrides: Partial<WorkspaceScope> = {}): WorkspaceScope {
  return { ...EMPTY_WORKSPACE_SCOPE, ...overrides };
}

describe("compactScopeSegments", () => {
  it("default empty scope reads as Cross-asset · All families · Monitor · Paper", () => {
    expect(compactScopeSegments(EMPTY_WORKSPACE_SCOPE)).toEqual([
      "Cross-asset",
      "All families",
      "Monitor",
      "Paper",
    ]);
  });

  it("joins multiple asset groups with '+'", () => {
    expect(compactScopeSegments(scope({ assetGroups: ["CEFI", "DEFI"] }))[0]).toBe("CeFi + DeFi");
  });

  it("collapses three asset groups into 'CeFi + DeFi + TradFi'", () => {
    expect(compactScopeSegments(scope({ assetGroups: ["CEFI", "DEFI", "TRADFI"] }))[0]).toBe("CeFi + DeFi + TradFi");
  });

  it("formats a single family with humanised name", () => {
    const segs = compactScopeSegments(scope({ families: ["CARRY_AND_YIELD"] }));
    expect(segs).toContain("Carry & Yield");
  });

  it("collapses multiple families to a count", () => {
    const segs = compactScopeSegments(
      scope({ families: ["CARRY_AND_YIELD", "ARBITRAGE_STRUCTURAL", "VOL_TRADING"] }),
    );
    expect(segs).toContain("3 families");
  });

  it("includes archetype when single, hides when none", () => {
    expect(compactScopeSegments(scope({ archetypes: ["CARRY_BASIS_PERP"] }))).toContain(
      "Basis Carry: Funding Rate (Perp)",
    );
    expect(compactScopeSegments(EMPTY_WORKSPACE_SCOPE).some((s) => s.toLowerCase().includes("archetype"))).toBe(false);
  });

  it("collapses multiple archetypes to a count", () => {
    const segs = compactScopeSegments(scope({ archetypes: ["A", "B", "C", "D"] }));
    expect(segs).toContain("4 archetypes");
  });

  it("joins share classes with '/'", () => {
    expect(compactScopeSegments(scope({ shareClasses: ["BTC", "ETH"] }))).toContain("BTC/ETH");
  });

  it("omits share class when empty", () => {
    expect(compactScopeSegments(EMPTY_WORKSPACE_SCOPE).some((s) => s.includes("/"))).toBe(false);
  });

  it("renders engagement + stream as the trailing two segments", () => {
    const segs = compactScopeSegments(scope({ engagement: "replicate", executionStream: "live" }));
    expect(segs.slice(-2)).toEqual(["Replicate", "Live"]);
  });
});

describe("compactScopeLine", () => {
  it("prefixes with 'Scope: ' and joins with ' · '", () => {
    expect(compactScopeLine(EMPTY_WORKSPACE_SCOPE)).toBe("Scope: Cross-asset · All families · Monitor · Paper");
  });

  it("renders the §6 example: arbitrage / price dispersion / BTC/ETH / CeFi+DeFi / Monitor / Paper", () => {
    const s = scope({
      assetGroups: ["CEFI", "DEFI"],
      families: ["ARBITRAGE_STRUCTURAL"],
      archetypes: ["ARBITRAGE_PRICE_DISPERSION"],
      shareClasses: ["BTC", "ETH"],
      engagement: "monitor",
      executionStream: "paper",
    });
    expect(compactScopeLine(s)).toBe(
      "Scope: CeFi + DeFi · Structural Arbitrage · Price Dispersion Arbitrage · BTC/ETH · Monitor · Paper",
    );
  });
});
