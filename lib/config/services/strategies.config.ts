/** Strategies trading page — filters and presentation tokens */

export const ASSET_CLASS_COLORS: Record<string, string> = {
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

export const STATUSES = [
  { id: "live", label: "Live", color: "var(--status-live)" },
  { id: "paused", label: "Paused", color: "var(--status-idle)" },
  { id: "warning", label: "Warning", color: "var(--status-warning)" },
  { id: "development", label: "Development", color: "var(--status-running)" },
] as const;
