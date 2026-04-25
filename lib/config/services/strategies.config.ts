/** Strategies trading page — filters and presentation tokens */

export const asset_group_COLORS: Record<string, string> = {
  DeFi: "#4ade80",
  CeFi: "#60a5fa",
  TradFi: "#a78bfa",
  Sports: "#fbbf24",
  Prediction: "#f472b6",
};

export const ARCHETYPES = [
  { id: "BASIS_TRADE", label: "Basis Trade" },
  { id: "RECURSIVE_STAKED_BASIS", label: "Recursive Staked Basis" },
  { id: "MARKET_MAKING", label: "Market Making" },
  { id: "AMM_LP", label: "AMM LP" },
  { id: "ARBITRAGE", label: "Arbitrage" },
  { id: "YIELD", label: "Yield" },
  { id: "DIRECTIONAL", label: "Directional" },
  { id: "MOMENTUM", label: "Momentum" },
  { id: "MEAN_REVERSION", label: "Mean Reversion" },
  { id: "ML_DIRECTIONAL", label: "ML Directional" },
  { id: "STATISTICAL_ARB", label: "Statistical Arb" },
  { id: "OPTIONS", label: "Options" },
  { id: "PREDICTION_ARB", label: "Prediction Arb" },
  { id: "SPORTS_ARB", label: "Sports Arb" },
] as const;

/** Maps V2 archetype enum values and lowercase-dashed API values → ARCHETYPES config IDs. */
const ARCHETYPE_NORMALIZE_MAP: Record<string, string> = {
  // V2 enum → taxonomy ID
  ML_DIRECTIONAL_CONTINUOUS: "ML_DIRECTIONAL",
  ML_DIRECTIONAL_EVENT_SETTLED: "ML_DIRECTIONAL",
  RULES_DIRECTIONAL_CONTINUOUS: "DIRECTIONAL",
  RULES_DIRECTIONAL_EVENT_SETTLED: "DIRECTIONAL",
  CARRY_BASIS_DATED: "BASIS_TRADE",
  CARRY_BASIS_PERP: "BASIS_TRADE",
  CARRY_STAKED_BASIS: "BASIS_TRADE",
  CARRY_RECURSIVE_STAKED: "RECURSIVE_STAKED_BASIS",
  YIELD_ROTATION_LENDING: "YIELD",
  YIELD_STAKING_SIMPLE: "YIELD",
  ARBITRAGE_PRICE_DISPERSION: "ARBITRAGE",
  LIQUIDATION_CAPTURE: "ARBITRAGE",
  MARKET_MAKING_CONTINUOUS: "MARKET_MAKING",
  MARKET_MAKING_EVENT_SETTLED: "MARKET_MAKING",
  EVENT_DRIVEN: "ARBITRAGE",
  VOL_TRADING_OPTIONS: "OPTIONS",
  STAT_ARB_PAIRS_FIXED: "STATISTICAL_ARB",
  STAT_ARB_CROSS_SECTIONAL: "STATISTICAL_ARB",
  // lowercase-dashed (from trading-data.ts mapArchetype) → taxonomy ID
  "ml-directional": "ML_DIRECTIONAL",
  "sports-ml": "ML_DIRECTIONAL",
  "basis-trade": "BASIS_TRADE",
  "recursive-staked-basis": "RECURSIVE_STAKED_BASIS",
  "aave-lending": "YIELD",
  arbitrage: "ARBITRAGE",
  "market-making-lp": "MARKET_MAKING",
  "sports-market-making": "MARKET_MAKING",
  "options-vol": "OPTIONS",
  "statistical-arb": "STATISTICAL_ARB",
};

/** Normalise any strategy archetype format to the taxonomy ID used by ARCHETYPES config. */
export function normalizeArchetype(archetype: string): string {
  return ARCHETYPE_NORMALIZE_MAP[archetype] ?? archetype;
}

export const STATUSES = [
  { id: "live", label: "Live", color: "var(--status-live)" },
  { id: "paused", label: "Paused", color: "var(--status-idle)" },
  { id: "warning", label: "Warning", color: "var(--status-warning)" },
  { id: "development", label: "Development", color: "var(--status-running)" },
] as const;
