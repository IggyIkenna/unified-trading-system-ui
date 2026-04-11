/** Token valuation page — pricing, waterfall, overrides, audit fixtures. */

export type PricingSource = "exchange" | "otc" | "model" | "manual";

export interface TokenPricing {
  token: string;
  symbol: string;
  exchangePrice: number | null;
  otcPrice: number | null;
  modelPrice: number | null;
  finalMark: number;
  source: PricingSource;
  staleness: string;
  lastUpdated: string;
}

export const MOCK_PRICING: TokenPricing[] = [
  {
    token: "Bitcoin",
    symbol: "BTC",
    exchangePrice: 67432.5,
    otcPrice: 67420.0,
    modelPrice: 67445.12,
    finalMark: 67432.5,
    source: "exchange",
    staleness: "2s",
    lastUpdated: "2026-03-28T14:32:18Z",
  },
  {
    token: "Ethereum",
    symbol: "ETH",
    exchangePrice: 3456.78,
    otcPrice: 3454.5,
    modelPrice: 3458.2,
    finalMark: 3456.78,
    source: "exchange",
    staleness: "2s",
    lastUpdated: "2026-03-28T14:32:18Z",
  },
  {
    token: "Solana",
    symbol: "SOL",
    exchangePrice: 178.45,
    otcPrice: 178.3,
    modelPrice: 178.52,
    finalMark: 178.45,
    source: "exchange",
    staleness: "3s",
    lastUpdated: "2026-03-28T14:32:17Z",
  },
  {
    token: "Polygon",
    symbol: "MATIC",
    exchangePrice: 0.9234,
    otcPrice: 0.9228,
    modelPrice: 0.924,
    finalMark: 0.9234,
    source: "exchange",
    staleness: "2s",
    lastUpdated: "2026-03-28T14:32:18Z",
  },
  {
    token: "Uniswap",
    symbol: "UNI",
    exchangePrice: 12.87,
    otcPrice: 12.84,
    modelPrice: 12.89,
    finalMark: 12.87,
    source: "exchange",
    staleness: "4s",
    lastUpdated: "2026-03-28T14:32:16Z",
  },
  {
    token: "Aave",
    symbol: "AAVE",
    exchangePrice: 298.56,
    otcPrice: null,
    modelPrice: 298.8,
    finalMark: 298.56,
    source: "exchange",
    staleness: "5s",
    lastUpdated: "2026-03-28T14:32:15Z",
  },
  {
    token: "Chainlink",
    symbol: "LINK",
    exchangePrice: 18.92,
    otcPrice: 18.88,
    modelPrice: 18.95,
    finalMark: 18.92,
    source: "exchange",
    staleness: "3s",
    lastUpdated: "2026-03-28T14:32:17Z",
  },
  {
    token: "Arbitrum",
    symbol: "ARB",
    exchangePrice: 1.234,
    otcPrice: null,
    modelPrice: 1.238,
    finalMark: 1.234,
    source: "exchange",
    staleness: "6s",
    lastUpdated: "2026-03-28T14:32:14Z",
  },
  {
    token: "Optimism",
    symbol: "OP",
    exchangePrice: 3.67,
    otcPrice: null,
    modelPrice: 3.69,
    finalMark: 3.67,
    source: "exchange",
    staleness: "4s",
    lastUpdated: "2026-03-28T14:32:16Z",
  },
  {
    token: "Maker",
    symbol: "MKR",
    exchangePrice: null,
    otcPrice: 3245.0,
    modelPrice: 3250.2,
    finalMark: 3245.0,
    source: "otc",
    staleness: "45s",
    lastUpdated: "2026-03-28T14:31:33Z",
  },
  {
    token: "Synthetix",
    symbol: "SNX",
    exchangePrice: null,
    otcPrice: null,
    modelPrice: 4.56,
    finalMark: 4.56,
    source: "model",
    staleness: "2m",
    lastUpdated: "2026-03-28T14:30:18Z",
  },
  {
    token: "Curve",
    symbol: "CRV",
    exchangePrice: 0.678,
    otcPrice: null,
    modelPrice: 0.682,
    finalMark: 0.678,
    source: "exchange",
    staleness: "8s",
    lastUpdated: "2026-03-28T14:32:12Z",
  },
  {
    token: "Lido",
    symbol: "LDO",
    exchangePrice: null,
    otcPrice: 2.89,
    modelPrice: 2.91,
    finalMark: 2.89,
    source: "otc",
    staleness: "1m",
    lastUpdated: "2026-03-28T14:31:18Z",
  },
  {
    token: "Rocket Pool",
    symbol: "RPL",
    exchangePrice: null,
    otcPrice: null,
    modelPrice: 28.45,
    finalMark: 29.5,
    source: "manual",
    staleness: "15m",
    lastUpdated: "2026-03-28T14:17:18Z",
  },
  {
    token: "Compound",
    symbol: "COMP",
    exchangePrice: 67.89,
    otcPrice: null,
    modelPrice: 68.02,
    finalMark: 67.89,
    source: "exchange",
    staleness: "5s",
    lastUpdated: "2026-03-28T14:32:15Z",
  },
];

export interface WaterfallLevel {
  level: number;
  name: string;
  description: string;
  enabled: boolean;
  stalenessThreshold: string;
}

export const MOCK_WATERFALL: WaterfallLevel[] = [
  {
    level: 1,
    name: "Exchange Mid",
    description: "Volume-weighted mid from top 3 exchanges",
    enabled: true,
    stalenessThreshold: "30s",
  },
  {
    level: 2,
    name: "OTC Dealer Quote",
    description: "Best bid/ask from registered OTC desks",
    enabled: true,
    stalenessThreshold: "5m",
  },
  {
    level: 3,
    name: "Model (TWAP)",
    description: "24h time-weighted average price from historical trades",
    enabled: true,
    stalenessThreshold: "30m",
  },
  {
    level: 4,
    name: "Manual Override",
    description: "Manually set price by authorised risk officer",
    enabled: true,
    stalenessThreshold: "24h",
  },
];

export interface PriceOverride {
  token: string;
  symbol: string;
  overridePrice: number;
  reason: string;
  setBy: string;
  timestamp: string;
  expiry: string;
}

export const MOCK_OVERRIDES: PriceOverride[] = [
  {
    token: "Rocket Pool",
    symbol: "RPL",
    overridePrice: 29.5,
    reason: "Exchange feeds down — using last known + dealer quote average",
    setBy: "J. Chen",
    timestamp: "2026-03-28T14:17:00Z",
    expiry: "2026-03-28T20:00:00Z",
  },
  {
    token: "Helium",
    symbol: "HNT",
    overridePrice: 8.12,
    reason: "Token migration — exchange prices unreliable during swap period",
    setBy: "M. Patel",
    timestamp: "2026-03-28T10:30:00Z",
    expiry: "2026-03-29T10:30:00Z",
  },
  {
    token: "Render",
    symbol: "RNDR",
    overridePrice: 11.45,
    reason: "Circuit breaker triggered — locked at pre-event price pending review",
    setBy: "J. Chen",
    timestamp: "2026-03-28T13:00:00Z",
    expiry: "2026-03-28T17:00:00Z",
  },
];

export interface AuditEntry {
  id: string;
  timestamp: string;
  token: string;
  symbol: string;
  event: string;
  oldValue: string;
  newValue: string;
  user: string;
}

export const MOCK_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    timestamp: "2026-03-28T14:17:00Z",
    token: "Rocket Pool",
    symbol: "RPL",
    event: "Override Set",
    oldValue: "$28.45 (Model)",
    newValue: "$29.50 (Manual)",
    user: "J. Chen",
  },
  {
    id: "a2",
    timestamp: "2026-03-28T13:00:00Z",
    token: "Render",
    symbol: "RNDR",
    event: "Override Set",
    oldValue: "$11.32 (Exchange)",
    newValue: "$11.45 (Manual)",
    user: "J. Chen",
  },
  {
    id: "a3",
    timestamp: "2026-03-28T10:30:00Z",
    token: "Helium",
    symbol: "HNT",
    event: "Override Set",
    oldValue: "$7.98 (Exchange)",
    newValue: "$8.12 (Manual)",
    user: "M. Patel",
  },
  {
    id: "a4",
    timestamp: "2026-03-28T09:15:00Z",
    token: "Maker",
    symbol: "MKR",
    event: "Source Changed",
    oldValue: "Exchange Mid",
    newValue: "OTC Quote",
    user: "System",
  },
  {
    id: "a5",
    timestamp: "2026-03-28T08:00:00Z",
    token: "Synthetix",
    symbol: "SNX",
    event: "Source Changed",
    oldValue: "OTC Quote",
    newValue: "Model (TWAP)",
    user: "System",
  },
  {
    id: "a6",
    timestamp: "2026-03-28T06:45:00Z",
    token: "Lido",
    symbol: "LDO",
    event: "Source Changed",
    oldValue: "Exchange Mid",
    newValue: "OTC Quote",
    user: "System",
  },
  {
    id: "a7",
    timestamp: "2026-03-28T06:00:00Z",
    token: "Aave",
    symbol: "AAVE",
    event: "Price Updated",
    oldValue: "$296.12",
    newValue: "$298.56",
    user: "System",
  },
  {
    id: "a8",
    timestamp: "2026-03-27T23:59:00Z",
    token: "Rocket Pool",
    symbol: "RPL",
    event: "Override Expired",
    oldValue: "$30.10 (Manual)",
    newValue: "$28.45 (Model)",
    user: "System",
  },
  {
    id: "a9",
    timestamp: "2026-03-27T22:30:00Z",
    token: "Bitcoin",
    symbol: "BTC",
    event: "Price Updated",
    oldValue: "$67,100.00",
    newValue: "$67,432.50",
    user: "System",
  },
  {
    id: "a10",
    timestamp: "2026-03-27T18:00:00Z",
    token: "Ethereum",
    symbol: "ETH",
    event: "Price Updated",
    oldValue: "$3,420.10",
    newValue: "$3,456.78",
    user: "System",
  },
];
