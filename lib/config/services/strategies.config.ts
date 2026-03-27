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
  { id: "MARKET_MAKING", label: "Market Making" },
  { id: "ARBITRAGE", label: "Arbitrage" },
  { id: "YIELD", label: "Yield" },
  { id: "DIRECTIONAL", label: "Directional" },
  { id: "OPTIONS", label: "Options" },
  { id: "MOMENTUM", label: "Momentum" },
] as const;

export const STATUSES = [
  { id: "live", label: "Live", color: "var(--status-live)" },
  { id: "paused", label: "Paused", color: "var(--status-idle)" },
  { id: "warning", label: "Warning", color: "var(--status-warning)" },
  { id: "development", label: "Development", color: "var(--status-running)" },
] as const;
