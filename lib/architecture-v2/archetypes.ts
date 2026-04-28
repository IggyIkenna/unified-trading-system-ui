import type { StrategyArchetype, StrategyFamily } from "./enums";
import { ARCHETYPE_TO_FAMILY } from "./enums";

/**
 * Short-form metadata per archetype. Mirrors
 * `unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/*.md` at
 * label + one-line level. The UI uses this to render family dashboards and the
 * archetype row in the strategy catalog.
 */

export interface ArchetypeMetadata {
  archetype: StrategyArchetype;
  family: StrategyFamily;
  label: string;
  settlementShape: "continuous" | "event_settled" | "dated" | "one_shot" | "basket";
  shortDescription: string;
}

export const ARCHETYPE_METADATA: Readonly<Record<StrategyArchetype, ArchetypeMetadata>> = {
  ML_DIRECTIONAL_CONTINUOUS: {
    archetype: "ML_DIRECTIONAL_CONTINUOUS",
    family: ARCHETYPE_TO_FAMILY.ML_DIRECTIONAL_CONTINUOUS,
    label: "ML Directional: Continuous",
    settlementShape: "continuous",
    shortDescription: "Continuous ML forecasts with rolling entries and hold-until-flip.",
  },
  ML_DIRECTIONAL_EVENT_SETTLED: {
    archetype: "ML_DIRECTIONAL_EVENT_SETTLED",
    family: ARCHETYPE_TO_FAMILY.ML_DIRECTIONAL_EVENT_SETTLED,
    label: "ML Directional: Event Settled",
    settlementShape: "event_settled",
    shortDescription: "ML outcome models firing once per scheduled event (sports, prediction).",
  },
  RULES_DIRECTIONAL_CONTINUOUS: {
    archetype: "RULES_DIRECTIONAL_CONTINUOUS",
    family: ARCHETYPE_TO_FAMILY.RULES_DIRECTIONAL_CONTINUOUS,
    label: "Rules Directional: Continuous",
    settlementShape: "continuous",
    shortDescription: "Threshold-based rules on continuous feeds (crossovers, band breaks).",
  },
  RULES_DIRECTIONAL_EVENT_SETTLED: {
    archetype: "RULES_DIRECTIONAL_EVENT_SETTLED",
    family: ARCHETYPE_TO_FAMILY.RULES_DIRECTIONAL_EVENT_SETTLED,
    label: "Rules Directional: Event Settled",
    settlementShape: "event_settled",
    shortDescription: "Rule-based bets firing on scheduled events (pre-game, earnings).",
  },
  CARRY_BASIS_DATED: {
    archetype: "CARRY_BASIS_DATED",
    family: ARCHETYPE_TO_FAMILY.CARRY_BASIS_DATED,
    label: "Carry Basis: Dated",
    settlementShape: "dated",
    shortDescription: "Cash-and-carry into a dated future; held to expiry convergence.",
  },
  CARRY_BASIS_PERP: {
    archetype: "CARRY_BASIS_PERP",
    family: ARCHETYPE_TO_FAMILY.CARRY_BASIS_PERP,
    label: "Carry Basis: Perp",
    settlementShape: "continuous",
    shortDescription: "Spot + perp hedge capturing funding; rebalanced continuously.",
  },
  CARRY_STAKED_BASIS: {
    archetype: "CARRY_STAKED_BASIS",
    family: ARCHETYPE_TO_FAMILY.CARRY_STAKED_BASIS,
    label: "Carry: Staked Basis",
    settlementShape: "continuous",
    shortDescription: "LST collateral + lend + short perp: stacks staking + funding.",
  },
  CARRY_RECURSIVE_STAKED: {
    archetype: "CARRY_RECURSIVE_STAKED",
    family: ARCHETYPE_TO_FAMILY.CARRY_RECURSIVE_STAKED,
    label: "Carry: Recursive Staked",
    settlementShape: "continuous",
    shortDescription: "Leveraged-lending loop on LST collateral; managed LTV band.",
  },
  YIELD_ROTATION_LENDING: {
    archetype: "YIELD_ROTATION_LENDING",
    family: ARCHETYPE_TO_FAMILY.YIELD_ROTATION_LENDING,
    label: "Yield: Lending Rotation",
    settlementShape: "continuous",
    shortDescription: "Rotate supply across lending markets for best risk-adjusted APY.",
  },
  YIELD_STAKING_SIMPLE: {
    archetype: "YIELD_STAKING_SIMPLE",
    family: ARCHETYPE_TO_FAMILY.YIELD_STAKING_SIMPLE,
    label: "Yield: Staking (simple)",
    settlementShape: "continuous",
    shortDescription: "Pure native staking with slash exposure and claim scheduling.",
  },
  ARBITRAGE_PRICE_DISPERSION: {
    archetype: "ARBITRAGE_PRICE_DISPERSION",
    family: ARCHETYPE_TO_FAMILY.ARBITRAGE_PRICE_DISPERSION,
    label: "Arbitrage: Price Dispersion",
    settlementShape: "continuous",
    shortDescription: "Cross-venue mispricing (CEX/DEX, sports books) above TCA threshold.",
  },
  LIQUIDATION_CAPTURE: {
    archetype: "LIQUIDATION_CAPTURE",
    family: ARCHETYPE_TO_FAMILY.LIQUIDATION_CAPTURE,
    label: "Liquidation Capture",
    settlementShape: "one_shot",
    shortDescription: "Flash-loan assisted Aave liquidation with on-chain atomic bundle.",
  },
  MARKET_MAKING_CONTINUOUS: {
    archetype: "MARKET_MAKING_CONTINUOUS",
    family: ARCHETYPE_TO_FAMILY.MARKET_MAKING_CONTINUOUS,
    label: "Market Making: Continuous",
    settlementShape: "continuous",
    shortDescription: "Two-sided inventory-aware quoting on CEX / AMM venues.",
  },
  MARKET_MAKING_EVENT_SETTLED: {
    archetype: "MARKET_MAKING_EVENT_SETTLED",
    family: ARCHETYPE_TO_FAMILY.MARKET_MAKING_EVENT_SETTLED,
    label: "Market Making: Event Settled",
    settlementShape: "event_settled",
    shortDescription: "Back/lay quoting on exchange markets; settles at event resolution.",
  },
  EVENT_DRIVEN: {
    archetype: "EVENT_DRIVEN",
    family: ARCHETYPE_TO_FAMILY.EVENT_DRIVEN,
    label: "Event-Driven",
    settlementShape: "event_settled",
    shortDescription: "Trade scheduled releases: macro, earnings, token unlocks.",
  },
  VOL_TRADING_OPTIONS: {
    archetype: "VOL_TRADING_OPTIONS",
    family: ARCHETYPE_TO_FAMILY.VOL_TRADING_OPTIONS,
    label: "Vol Trading: Options",
    settlementShape: "continuous",
    shortDescription: "Options expression of vol views with delta + gamma hedging.",
  },
  STAT_ARB_PAIRS_FIXED: {
    archetype: "STAT_ARB_PAIRS_FIXED",
    family: ARCHETYPE_TO_FAMILY.STAT_ARB_PAIRS_FIXED,
    label: "Stat Arb: Fixed Pairs",
    settlementShape: "continuous",
    shortDescription: "Co-integrated fixed-pair mean-reversion with breakdown kill.",
  },
  STAT_ARB_CROSS_SECTIONAL: {
    archetype: "STAT_ARB_CROSS_SECTIONAL",
    family: ARCHETYPE_TO_FAMILY.STAT_ARB_CROSS_SECTIONAL,
    label: "Stat Arb: Cross Sectional",
    settlementShape: "basket",
    shortDescription: "Cross-sectional basket ranking with long-short dollar neutrality.",
  },
};

export function listArchetypesForFamily(family: StrategyFamily): readonly ArchetypeMetadata[] {
  const out: ArchetypeMetadata[] = [];
  for (const archetype of Object.keys(ARCHETYPE_METADATA) as StrategyArchetype[]) {
    if (ARCHETYPE_TO_FAMILY[archetype] === family) {
      out.push(ARCHETYPE_METADATA[archetype]);
    }
  }
  return out;
}
