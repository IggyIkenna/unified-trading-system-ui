import { describe, expect, it } from "vitest";
import {
  MOCK_REWARD_PNL,
  getDefaultRewardFactors,
  getRewardFactorsForStrategyId,
} from "@/lib/mocks/fixtures/defi-walkthrough";

/**
 * defi-walkthrough.ts — archetype → reward-factor-list resolver.
 *
 * These helpers drive the DeFi reward-PnL widget's factor breakdown. They
 * bridge the v1 legacy strategy_id space with the v2 archetype space until
 * the backend plumbs archetype through directly (see docstring in source).
 */

describe("defi-walkthrough reward factor resolver", () => {
  describe("getDefaultRewardFactors", () => {
    it("returns the archetype-specific factor list when archetype is known", () => {
      const factors = getDefaultRewardFactors("YIELD_ROTATION_LENDING");
      expect(Array.isArray(factors)).toBe(true);
      expect(factors.length).toBeGreaterThan(0);
    });

    it("falls back to MOCK_REWARD_PNL when archetype is undefined", () => {
      const factors = getDefaultRewardFactors(undefined);
      expect(factors).toBe(MOCK_REWARD_PNL);
    });

    it("falls back to MOCK_REWARD_PNL when archetype is unrecognised", () => {
      const factors = getDefaultRewardFactors("NOT_A_REAL_ARCHETYPE" as never);
      expect(factors).toBe(MOCK_REWARD_PNL);
    });
  });

  describe("getRewardFactorsForStrategyId", () => {
    it("maps AAVE_LENDING → YIELD_ROTATION_LENDING factors", () => {
      const aaveFactors = getRewardFactorsForStrategyId("AAVE_LENDING");
      const archetypeFactors = getDefaultRewardFactors("YIELD_ROTATION_LENDING");
      expect(aaveFactors).toEqual(archetypeFactors);
    });

    it("maps BASIS_TRADE → CARRY_BASIS_PERP factors", () => {
      const basisFactors = getRewardFactorsForStrategyId("BASIS_TRADE");
      const archetypeFactors = getDefaultRewardFactors("CARRY_BASIS_PERP");
      expect(basisFactors).toEqual(archetypeFactors);
    });

    it("maps STAKED_BASIS → CARRY_STAKED_BASIS factors", () => {
      const stakedFactors = getRewardFactorsForStrategyId("STAKED_BASIS");
      const archetypeFactors = getDefaultRewardFactors("CARRY_STAKED_BASIS");
      expect(stakedFactors).toEqual(archetypeFactors);
    });

    it("returns MOCK_REWARD_PNL for unknown strategy ids", () => {
      expect(getRewardFactorsForStrategyId("MADE_UP_STRATEGY")).toBe(MOCK_REWARD_PNL);
    });

    it("returns MOCK_REWARD_PNL for undefined", () => {
      expect(getRewardFactorsForStrategyId(undefined)).toBe(MOCK_REWARD_PNL);
    });
  });
});
