import { describe, expect, it } from "vitest";

import { EMPTY_WORKSPACE_SCOPE, type WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";
import {
  matchesScope,
  resolveTierZeroScenario,
  suggestNearestScenarios,
  TIER_ZERO_SCENARIOS,
} from "@/lib/mocks/tier-zero-scenario";

const scopeWith = (patch: Partial<WorkspaceScope>): WorkspaceScope => ({
  ...EMPTY_WORKSPACE_SCOPE,
  ...patch,
});

describe("tier-zero-scenario", () => {
  describe("registry coverage", () => {
    it("ships at least one scenario per supported asset group", () => {
      const groups = new Set(TIER_ZERO_SCENARIOS.flatMap((s) => s.assetGroups));
      expect(groups.has("CEFI")).toBe(true);
      expect(groups.has("DEFI")).toBe(true);
      expect(groups.has("SPORTS")).toBe(true);
      expect(groups.has("TRADFI")).toBe(true);
      // PREDICTION is bundled with SPORTS scenario; verify present.
      expect(groups.has("PREDICTION")).toBe(true);
    });

    it("every scenario has at least one strategy + bundle row", () => {
      for (const sc of TIER_ZERO_SCENARIOS) {
        expect(sc.strategies.length, `${sc.id} strategies`).toBeGreaterThan(0);
        expect(sc.bundles.length, `${sc.id} bundles`).toBeGreaterThan(0);
      }
    });

    it("registry covers every WorkspacePreset 1:1 (10 scenarios)", () => {
      const ids = new Set(TIER_ZERO_SCENARIOS.map((s) => s.id));
      // 6 originals
      expect(ids.has("tier0-arbitrage-command")).toBe(true);
      expect(ids.has("tier0-defi-yield-risk")).toBe(true);
      expect(ids.has("tier0-vol-lab")).toBe(true);
      expect(ids.has("tier0-sports-prediction")).toBe(true);
      expect(ids.has("tier0-ml-directional")).toBe(true);
      expect(ids.has("tier0-tradfi-pairs")).toBe(true);
      // 4 first-class additions
      expect(ids.has("tier0-signals-in-monitor")).toBe(true);
      expect(ids.has("tier0-live-trading-desk")).toBe(true);
      expect(ids.has("tier0-executive-overview")).toBe(true);
      expect(ids.has("tier0-research-to-live")).toBe(true);
      expect(TIER_ZERO_SCENARIOS.length).toBe(10);
    });
  });

  describe("matchesScope axis filtering", () => {
    const row = {
      assetGroup: "CEFI" as const,
      family: "ARBITRAGE_STRUCTURAL" as const,
      archetype: "ARBITRAGE_PRICE_DISPERSION" as const,
      venue: "binance",
      shareClass: "USDT" as const,
    };

    it("empty scope matches everything", () => {
      expect(matchesScope(row, EMPTY_WORKSPACE_SCOPE)).toBe(true);
    });

    it("asset_group axis filters", () => {
      expect(matchesScope(row, scopeWith({ assetGroups: ["CEFI"] }))).toBe(true);
      expect(matchesScope(row, scopeWith({ assetGroups: ["DEFI"] }))).toBe(false);
    });

    it("family axis filters", () => {
      expect(matchesScope(row, scopeWith({ families: ["ARBITRAGE_STRUCTURAL"] }))).toBe(true);
      expect(matchesScope(row, scopeWith({ families: ["VOL_TRADING"] }))).toBe(false);
    });

    it("archetype axis filters", () => {
      expect(matchesScope(row, scopeWith({ archetypes: ["ARBITRAGE_PRICE_DISPERSION"] }))).toBe(true);
      expect(matchesScope(row, scopeWith({ archetypes: ["VOL_TRADING_OPTIONS"] }))).toBe(false);
    });

    it("share_class axis filters", () => {
      expect(matchesScope(row, scopeWith({ shareClasses: ["USDT"] }))).toBe(true);
      expect(matchesScope(row, scopeWith({ shareClasses: ["BTC"] }))).toBe(false);
    });

    it("venue axis filters", () => {
      expect(matchesScope(row, scopeWith({ venueOrProtocolIds: ["binance"] }))).toBe(true);
      expect(matchesScope(row, scopeWith({ venueOrProtocolIds: ["okx"] }))).toBe(false);
    });

    it("multi-axis scope ANDs across axes", () => {
      expect(matchesScope(row, scopeWith({ assetGroups: ["CEFI"], families: ["ARBITRAGE_STRUCTURAL"] }))).toBe(true);
      expect(matchesScope(row, scopeWith({ assetGroups: ["CEFI"], families: ["VOL_TRADING"] }))).toBe(false);
    });
  });

  describe("resolveTierZeroScenario", () => {
    it("wide-open scope returns every scenario merged", () => {
      const view = resolveTierZeroScenario(EMPTY_WORKSPACE_SCOPE);
      expect(view.status).toBe("match");
      expect(view.matchedScenarios.length).toBe(TIER_ZERO_SCENARIOS.length);
      expect(view.strategies.length).toBeGreaterThan(0);
    });

    it("DEFI + CARRY_AND_YIELD scope returns DeFi yield scenario only", () => {
      const view = resolveTierZeroScenario(scopeWith({ assetGroups: ["DEFI"], families: ["CARRY_AND_YIELD"] }));
      expect(view.status).toBe("match");
      expect(view.matchedScenarios.map((s) => s.id)).toContain("tier0-defi-yield-risk");
      expect(view.strategies.every((s) => s.assetGroup === "DEFI")).toBe(true);
      expect(view.strategies.every((s) => s.family === "CARRY_AND_YIELD")).toBe(true);
    });

    it("CEFI + VOL_TRADING returns Vol Lab", () => {
      const view = resolveTierZeroScenario(scopeWith({ assetGroups: ["CEFI"], families: ["VOL_TRADING"] }));
      expect(view.matchedScenarios.map((s) => s.id)).toContain("tier0-vol-lab");
      expect(view.strategies.length).toBeGreaterThan(0);
    });

    it("unsupported scope (e.g. PREDICTION + ARBITRAGE_STRUCTURAL) returns unsupported status", () => {
      const view = resolveTierZeroScenario(
        scopeWith({ assetGroups: ["PREDICTION"], families: ["ARBITRAGE_STRUCTURAL"] }),
      );
      expect(view.status).toBe("unsupported");
      expect(view.strategies).toHaveLength(0);
    });

    it("partial_match or unsupported: rare-share-class combinations resolve cleanly", () => {
      // SOL share class is not covered by any tier-zero scenario today.
      // The resolver should land in unsupported (no scenario covers the axis)
      // not in match.
      const view = resolveTierZeroScenario(
        scopeWith({
          assetGroups: ["CEFI"],
          families: ["ARBITRAGE_STRUCTURAL"],
          shareClasses: ["SOL"],
        }),
      );
      // No scenario lists SOL on its shareClasses axis, so scenarioOverlapsScope
      // rules every scenario out → unsupported.
      expect(["unsupported", "partial_match"]).toContain(view.status);
    });

    it("scenarios beyond the original 6 are reachable: SIGNALS_IN_MONITOR matches signals scope", () => {
      // Signals-In Monitor — CEFI + ML_DIRECTIONAL + binance.
      const view = resolveTierZeroScenario(
        scopeWith({
          assetGroups: ["CEFI"],
          families: ["ML_DIRECTIONAL"],
          venueOrProtocolIds: ["binance"],
        }),
      );
      expect(view.status).toBe("match");
      const ids = view.matchedScenarios.map((s) => s.id);
      expect(ids).toContain("tier0-signals-in-monitor");
    });

    it("RESEARCH_TO_LIVE_PIPELINE has rows across every maturity phase", () => {
      const view = resolveTierZeroScenario(EMPTY_WORKSPACE_SCOPE);
      const rtolStrategies = view.strategies.filter((s) => s.id.startsWith("rtol-"));
      const maturities = new Set(rtolStrategies.map((s) => s.maturity));
      expect(maturities.has("smoke")).toBe(true);
      expect(maturities.has("backtest_30d")).toBe(true);
      expect(maturities.has("paper_1d")).toBe(true);
      expect(maturities.has("paper_14d")).toBe(true);
      expect(maturities.has("pilot")).toBe(true);
      expect(maturities.has("live_stable")).toBe(true);
    });

    it("EXECUTIVE_OVERVIEW carries mandate-level aggregate strategies", () => {
      const view = resolveTierZeroScenario(scopeWith({ assetGroups: ["TRADFI"] }));
      const ids = view.matchedScenarios.map((s) => s.id);
      expect(ids).toContain("tier0-executive-overview");
      const execStrategies = view.strategies.filter((s) => s.id.startsWith("exec-mandate-"));
      expect(execStrategies.length).toBeGreaterThan(0);
    });

    it("LIVE_TRADING_DESK matches the broad cross-asset desk view", () => {
      const view = resolveTierZeroScenario(scopeWith({ assetGroups: ["CEFI"] }));
      const ids = view.matchedScenarios.map((s) => s.id);
      expect(ids).toContain("tier0-live-trading-desk");
    });

    it("venue axis narrows rows within a matched scenario", () => {
      // Arbitrage Command covers binance + okx + deribit + aave + uniswap.
      const view = resolveTierZeroScenario(scopeWith({ assetGroups: ["CEFI"], venueOrProtocolIds: ["binance"] }));
      expect(view.status).toBe("match");
      expect(view.strategies.every((s) => s.venue === "binance")).toBe(true);
    });
  });

  describe("suggestNearestScenarios", () => {
    it("returns scenarios that share at least one axis with the scope", () => {
      const suggestions = suggestNearestScenarios(scopeWith({ assetGroups: ["CEFI"], families: ["VOL_TRADING"] }));
      // Vol Lab covers CEFI + VOL_TRADING — should be top.
      expect(suggestions[0]?.id).toBe("tier0-vol-lab");
    });

    it("caps at the requested max", () => {
      const suggestions = suggestNearestScenarios(scopeWith({ assetGroups: ["CEFI"] }), 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });
});
