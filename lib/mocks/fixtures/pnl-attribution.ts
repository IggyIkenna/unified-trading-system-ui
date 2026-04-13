import type { ClientPnLRow, PnLComponent } from "@/lib/types/pnl";

export const DEFAULT_STRUCTURAL_PNL: PnLComponent[] = [
  { name: "Realized", value: 847200, percentage: 81.4, category: "structural" },
  { name: "Unrealized", value: 193400, percentage: 18.6, category: "structural" },
];

export const DEFAULT_RESIDUAL_PNL: PnLComponent = {
  name: "Residual",
  value: 7300,
  percentage: 0.7,
  category: "diagnostic",
};

/** Static fallback used when the API returns no client/org data */
export const DEFAULT_CLIENT_PNL: ClientPnLRow[] = [
  { id: "cl-alpha", name: "Nexus Capital", org: "Nexus Group", pnl: 487200, strategies: 4, change: 8.4 },
  { id: "cl-beta", name: "Orion Trading", org: "Orion Partners", pnl: 342100, strategies: 3, change: 5.2 },
  { id: "cl-gamma", name: "Meridian Fund", org: "Nexus Group", pnl: 298750, strategies: 5, change: 11.1 },
  { id: "cl-delta", name: "Apex Strategies", org: "Apex Holdings", pnl: 189400, strategies: 2, change: -2.8 },
  { id: "cl-epsilon", name: "Stellar Arbitrage", org: "Stellar Group", pnl: 156300, strategies: 3, change: 6.7 },
];
