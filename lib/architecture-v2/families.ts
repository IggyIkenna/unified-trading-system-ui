import type { StrategyArchetypeV2, StrategyFamilyV2 } from "./enums";
import { ARCHETYPE_TO_FAMILY, STRATEGY_FAMILIES_V2 } from "./enums";

/**
 * Human-friendly metadata for each of the 8 v2 families.
 *
 * Mirror of `unified-trading-pm/codex/09-strategy/architecture-v2/families/*.md`
 * — keep the short description tight (one line) so family tiles stay readable.
 */

export interface FamilyMetadata {
  family: StrategyFamilyV2;
  label: string;
  slug: string;
  alphaSource: string;
  shortDescription: string;
  docHref: string;
  archetypes: readonly StrategyArchetypeV2[];
  accentClass: string;
  iconName:
    | "Brain"
    | "ListChecks"
    | "Coins"
    | "GitCompare"
    | "LineChart"
    | "Calendar"
    | "Activity"
    | "Shuffle";
}

const BY_FAMILY: Readonly<Record<StrategyFamilyV2, StrategyArchetypeV2[]>> = (() => {
  const out: Record<StrategyFamilyV2, StrategyArchetypeV2[]> = {
    ML_DIRECTIONAL: [],
    RULES_DIRECTIONAL: [],
    CARRY_AND_YIELD: [],
    ARBITRAGE_STRUCTURAL: [],
    MARKET_MAKING: [],
    EVENT_DRIVEN: [],
    VOL_TRADING: [],
    STAT_ARB_PAIRS: [],
  };
  for (const [archetype, family] of Object.entries(ARCHETYPE_TO_FAMILY)) {
    out[family].push(archetype as StrategyArchetypeV2);
  }
  return out;
})();

export const FAMILY_METADATA: Readonly<Record<StrategyFamilyV2, FamilyMetadata>> = {
  ML_DIRECTIONAL: {
    family: "ML_DIRECTIONAL",
    label: "ML Directional",
    slug: "ml-directional",
    alphaSource: "Model-predicted outcome probability vs implied",
    shortDescription:
      "Train models to forecast directional outcomes (price, odds, event probabilities) and trade when predicted probability exceeds implied.",
    docHref:
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/families/ml-directional.md",
    archetypes: BY_FAMILY.ML_DIRECTIONAL,
    accentClass: "text-violet-400 border-violet-500/40 bg-violet-500/10",
    iconName: "Brain",
  },
  RULES_DIRECTIONAL: {
    family: "RULES_DIRECTIONAL",
    label: "Rules Directional",
    slug: "rules-directional",
    alphaSource: "Hand-coded feature-threshold rules producing fire / no-fire signals",
    shortDescription:
      "Deterministic rule sets fire trades when feature thresholds are crossed (SMA cross, momentum filters, news-driven triggers).",
    docHref:
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/families/rules-directional.md",
    archetypes: BY_FAMILY.RULES_DIRECTIONAL,
    accentClass: "text-sky-400 border-sky-500/40 bg-sky-500/10",
    iconName: "ListChecks",
  },
  CARRY_AND_YIELD: {
    family: "CARRY_AND_YIELD",
    label: "Carry & Yield",
    slug: "carry-and-yield",
    alphaSource: "Rate / yield differential capture (funding, lending, staking, basis)",
    shortDescription:
      "Hedged rate trades: cash-and-carry basis, perp funding capture, staking plus short, lending rotation, recursive staked basis.",
    docHref:
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/families/carry-and-yield.md",
    archetypes: BY_FAMILY.CARRY_AND_YIELD,
    accentClass: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    iconName: "Coins",
  },
  ARBITRAGE_STRUCTURAL: {
    family: "ARBITRAGE_STRUCTURAL",
    label: "Arbitrage / Structural",
    slug: "arbitrage-structural",
    alphaSource: "Price dispersion or protocol mechanics (risk-free or near risk-free payments)",
    shortDescription:
      "Cross-venue price dispersion and protocol mechanics — Aave liquidations via flash loan, CEX vs DEX mispricing, sports arb.",
    docHref:
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/families/arbitrage-structural.md",
    archetypes: BY_FAMILY.ARBITRAGE_STRUCTURAL,
    accentClass: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    iconName: "GitCompare",
  },
  MARKET_MAKING: {
    family: "MARKET_MAKING",
    label: "Market Making",
    slug: "market-making",
    alphaSource: "Bid-ask spread capture via two-sided quoting",
    shortDescription:
      "Post two-sided liquidity — continuous MM on CEX / DEX pools plus event-settled back/lay quoting on sports exchanges.",
    docHref:
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/families/market-making.md",
    archetypes: BY_FAMILY.MARKET_MAKING,
    accentClass: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
    iconName: "LineChart",
  },
  EVENT_DRIVEN: {
    family: "EVENT_DRIVEN",
    label: "Event-Driven",
    slug: "event-driven",
    alphaSource: "Scheduled external events with measurable surprise",
    shortDescription:
      "Trade the surprise of scheduled releases — macro prints, earnings, token unlocks, sports kickoff, prediction resolution.",
    docHref:
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/families/event-driven.md",
    archetypes: BY_FAMILY.EVENT_DRIVEN,
    accentClass: "text-pink-400 border-pink-500/40 bg-pink-500/10",
    iconName: "Calendar",
  },
  VOL_TRADING: {
    family: "VOL_TRADING",
    label: "Vol Trading",
    slug: "vol-trading",
    alphaSource: "Vol-metric dislocation (IV/RV, skew, term, cross-asset vol)",
    shortDescription:
      "Trade implied vs realised vol, skew, and term structure — options expression via Deribit with delta + gamma hedges.",
    docHref:
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/families/vol-trading.md",
    archetypes: BY_FAMILY.VOL_TRADING,
    accentClass: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    iconName: "Activity",
  },
  STAT_ARB_PAIRS: {
    family: "STAT_ARB_PAIRS",
    label: "Stat Arb / Pairs",
    slug: "stat-arb-pairs",
    alphaSource: "Spread mean-reversion or momentum on paired underlyings",
    shortDescription:
      "Co-integrated pair mean-reversion and cross-sectional basket ranking — equities, perps, and synthetic DeFi pairs.",
    docHref:
      "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/families/stat-arb-pairs.md",
    archetypes: BY_FAMILY.STAT_ARB_PAIRS,
    accentClass: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
    iconName: "Shuffle",
  },
};

export function getFamilyForArchetype(archetype: StrategyArchetypeV2): StrategyFamilyV2 {
  return ARCHETYPE_TO_FAMILY[archetype];
}

export function listFamiliesOrdered(): readonly FamilyMetadata[] {
  return STRATEGY_FAMILIES_V2.map((f) => FAMILY_METADATA[f]);
}

export function resolveFamilyBySlug(slug: string): FamilyMetadata | null {
  for (const family of STRATEGY_FAMILIES_V2) {
    const meta = FAMILY_METADATA[family];
    if (meta.slug === slug) {
      return meta;
    }
  }
  return null;
}
