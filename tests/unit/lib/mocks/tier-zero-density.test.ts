import { describe, expect, it } from "vitest";

import { TIER_ZERO_SCENARIOS } from "@/lib/mocks/tier-zero-scenario";

/**
 * Fixture-density invariants — guards against rolling the tier-zero scenarios
 * back to thin demo numbers. Per the 2026-05-01 audit pass: each scenario
 * must carry enough rows to feel like a real cluster, not a sketch.
 */

const MIN_STRATEGIES = 4;
const MIN_POSITIONS = 3;
const MIN_BACKTESTS = 3;
const MIN_BUNDLES = 2;

describe("tier-zero fixture density", () => {
  it.each(TIER_ZERO_SCENARIOS.map((s) => [s.id, s] as const))(
    "%s carries dense strategies / positions / backtests / bundles",
    (_id, scenario) => {
      expect(scenario.strategies.length, `${scenario.id} strategies`).toBeGreaterThanOrEqual(MIN_STRATEGIES);
      expect(scenario.positions.length, `${scenario.id} positions`).toBeGreaterThanOrEqual(MIN_POSITIONS);
      expect(scenario.backtests.length, `${scenario.id} backtests`).toBeGreaterThanOrEqual(MIN_BACKTESTS);
      expect(scenario.bundles.length, `${scenario.id} bundles`).toBeGreaterThanOrEqual(MIN_BUNDLES);
    },
  );

  it("aggregate row counts are large enough to feel real", () => {
    const totals = TIER_ZERO_SCENARIOS.reduce(
      (acc, s) => ({
        strategies: acc.strategies + s.strategies.length,
        positions: acc.positions + s.positions.length,
        backtests: acc.backtests + s.backtests.length,
        bundles: acc.bundles + s.bundles.length,
      }),
      { strategies: 0, positions: 0, backtests: 0, bundles: 0 },
    );
    // Conservative aggregate floors — rebalance if scenarios are added.
    expect(totals.strategies).toBeGreaterThanOrEqual(25);
    expect(totals.positions).toBeGreaterThanOrEqual(20);
    expect(totals.backtests).toBeGreaterThanOrEqual(18);
    expect(totals.bundles).toBeGreaterThanOrEqual(15);
  });

  it("each strategy row has consistent venue + share_class + asset_group axes", () => {
    for (const sc of TIER_ZERO_SCENARIOS) {
      for (const s of sc.strategies) {
        expect(sc.assetGroups, `${s.id} assetGroup`).toContain(s.assetGroup);
        expect(sc.venues, `${s.id} venue`).toContain(s.venue);
        expect(sc.shareClasses, `${s.id} shareClass`).toContain(s.shareClass);
      }
    }
  });

  it("every position has a corresponding strategy id in the scenario", () => {
    for (const sc of TIER_ZERO_SCENARIOS) {
      const strategyIds = new Set(sc.strategies.map((s) => s.id));
      for (const p of sc.positions) {
        expect(strategyIds.has(p.strategyId), `${p.id} → ${p.strategyId}`).toBe(true);
      }
    }
  });

  it("every backtest references a strategy + matches archetype", () => {
    for (const sc of TIER_ZERO_SCENARIOS) {
      const byId = new Map(sc.strategies.map((s) => [s.id, s]));
      for (const bt of sc.backtests) {
        const strat = byId.get(bt.strategyId);
        expect(strat, `${bt.id} → ${bt.strategyId}`).toBeDefined();
        if (strat) {
          expect(strat.archetype, `${bt.id} archetype`).toBe(bt.archetype);
        }
      }
    }
  });

  it("every bundle references a strategy in the scenario", () => {
    for (const sc of TIER_ZERO_SCENARIOS) {
      const strategyIds = new Set(sc.strategies.map((s) => s.id));
      for (const b of sc.bundles) {
        expect(strategyIds.has(b.strategyId), `${b.releaseId} → ${b.strategyId}`).toBe(true);
      }
    }
  });
});
