import type { StrategyFamilyV2 } from "./enums";

/**
 * Legacy free-text family label → v2 StrategyFamilyV2 mapping.
 *
 * The existing `strategy-catalog-data.ts` fixture (53 strategies) was written
 * before the v2 taxonomy landed. Rather than regenerate the fixture in this
 * phase 9 session — which would cascade into the 6 detail tabs — we map at
 * read time so the family dashboards aggregate correctly.
 *
 * Follow-up: regenerate the catalog fixture from UAC
 * `StrategyInstanceDefinition` rows once phase 11 (strategy migration) lands
 * and delete this mapping.
 */

export const LEGACY_FAMILY_TO_V2: Readonly<Record<string, StrategyFamilyV2>> = {
  // Directional
  "ML Directional": "ML_DIRECTIONAL",
  Momentum: "RULES_DIRECTIONAL",
  "Mean Reversion": "RULES_DIRECTIONAL",
  Directional: "RULES_DIRECTIONAL",
  "Rules Directional": "RULES_DIRECTIONAL",
  // Carry + yield
  "Basis Trade": "CARRY_AND_YIELD",
  Lending: "CARRY_AND_YIELD",
  Yield: "CARRY_AND_YIELD",
  Staking: "CARRY_AND_YIELD",
  "Recursive Staked": "CARRY_AND_YIELD",
  // Arbitrage
  Arbitrage: "ARBITRAGE_STRUCTURAL",
  "Sports Arbitrage": "ARBITRAGE_STRUCTURAL",
  "Prediction Arbitrage": "ARBITRAGE_STRUCTURAL",
  Liquidation: "ARBITRAGE_STRUCTURAL",
  // Market making
  "Market Making": "MARKET_MAKING",
  "AMM LP": "MARKET_MAKING",
  // Event-driven
  "Event Driven": "EVENT_DRIVEN",
  "Event-Driven": "EVENT_DRIVEN",
  Events: "EVENT_DRIVEN",
  Macro: "EVENT_DRIVEN",
  // Vol
  Options: "VOL_TRADING",
  Volatility: "VOL_TRADING",
  Vol: "VOL_TRADING",
  // Stat arb / pairs
  "Statistical Arbitrage": "STAT_ARB_PAIRS",
  "Statistical Arb": "STAT_ARB_PAIRS",
  StatArb: "STAT_ARB_PAIRS",
  Pairs: "STAT_ARB_PAIRS",
};

/**
 * Map a catalog entry's legacy family text to the v2 family enum.
 * Falls back to RULES_DIRECTIONAL for truly unknown labels so dashboards
 * do not silently drop rows (dashboards show an "unmapped" chip when this
 * fallback fires — see family-grid component).
 */
export function legacyFamilyToV2(legacy: string): StrategyFamilyV2 {
  return LEGACY_FAMILY_TO_V2[legacy] ?? "RULES_DIRECTIONAL";
}
