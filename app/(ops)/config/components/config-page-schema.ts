import { VENUE_CATEGORIES, VENUE_CATEGORY_MAP } from "@/lib/reference-data";
// Config parameter schema types
export interface ConfigParam {
  key: string;
  label: string;
  type: "slider" | "select" | "multiselect" | "number" | "switch";
  value: number | string | boolean | string[];
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

// Mock strategy schemas with params for config editing
export const strategySchemas: Record<
  string,
  {
    params: ConfigParam[];
    versions: {
      version: string;
      status: string;
      date: string;
      author: string;
      message: string;
    }[];
  }
> = {
  "btc-basis": {
    params: [
      {
        key: "min_funding_rate",
        label: "Min Funding Rate",
        type: "slider",
        value: 0.0001,
        min: 0.0001,
        max: 0.01,
        step: 0.0001,
        description: "Minimum funding rate to enter position",
      },
      {
        key: "max_leverage",
        label: "Max Leverage",
        type: "slider",
        value: 2.5,
        min: 1.0,
        max: 5.0,
        step: 0.5,
        description: "Maximum allowed leverage",
      },
      {
        key: "fractional_kelly",
        label: "Fractional Kelly",
        type: "slider",
        value: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Kelly criterion fraction",
      },
      {
        key: "delta_drift_threshold",
        label: "Delta Drift Threshold",
        type: "slider",
        value: 0.05,
        min: 0.01,
        max: 0.1,
        step: 0.01,
        description: "Rebalance when delta drifts beyond this",
      },
      {
        key: "execution_mode",
        label: "Execution Mode",
        type: "select",
        value: "HUF",
        options: ["SCE", "HUF", "EVT"],
        description: "Order execution strategy",
      },
      {
        key: "benchmark_type",
        label: "Benchmark Type",
        type: "select",
        value: "ARRIVAL",
        options: ["ARRIVAL", "ORACLE", "TWAP", "CLOSE"],
        description: "P&L benchmark reference",
      },
      {
        key: "allowed_venues",
        label: "Allowed Venues",
        type: "multiselect",
        value: ["BINANCE", "OKX", "BYBIT"],
        options: ["BINANCE", "OKX", "BYBIT", "COINBASE", "KRAKEN", "DERIBIT"],
        description: "Venues enabled for trading",
      },
      {
        key: "initial_capital",
        label: "Initial Capital",
        type: "number",
        value: 500000,
        description: "Starting capital allocation",
      },
      {
        key: "position_limit_usd",
        label: "Position Limit USD",
        type: "number",
        value: 1000000,
        description: "Maximum position size",
      },
      {
        key: "sor_enabled",
        label: "SOR Enabled",
        type: "switch",
        value: true,
        description: "Enable smart order routing",
      },
      {
        key: "post_only",
        label: "Post Only",
        type: "switch",
        value: false,
        description: "Only post maker orders",
      },
    ],
    versions: [
      {
        version: "v3.2",
        status: "Active",
        date: "Mar 15, 2026",
        author: "quant@odum.io",
        message: "Increase funding threshold",
      },
      {
        version: "v3.1",
        status: "Previous",
        date: "Mar 10, 2026",
        author: "quant@odum.io",
        message: "Initial config",
      },
      {
        version: "v3.0",
        status: "Archived",
        date: "Mar 5, 2026",
        author: "auto-deploy",
        message: "Grid sweep winner #42",
      },
    ],
  },
};

// Mock clients data - using real venues from registry
export const clients = [
  {
    id: "delta-one",
    name: "Delta One",
    status: "active" as const,
    strategies: 6,
    aum: 12500000,
    riskProfile: "moderate",
    venues: ["BINANCE-FUTURES", "HYPERLIQUID", "DERIBIT"], // Real venue IDs
  },
  {
    id: "quant-fund",
    name: "Quant Fund",
    status: "active" as const,
    strategies: 4,
    aum: 8200000,
    riskProfile: "aggressive",
    venues: ["BINANCE-FUTURES", "OKX", "BYBIT"],
  },
  {
    id: "sports-desk",
    name: "Sports Desk",
    status: "active" as const,
    strategies: 3,
    aum: 2100000,
    riskProfile: "moderate",
    venues: ["PINNACLE", "BETFAIR", "DRAFTKINGS"],
  },
  {
    id: "alpha-crypto",
    name: "Alpha Crypto",
    status: "onboarding" as const,
    strategies: 2,
    aum: 5000000,
    riskProfile: "conservative",
    venues: ["AAVEV3_ETHEREUM", "UNISWAPV3-ETHEREUM"],
  },
];

// Mock strategies for config
export const strategyConfigs = [
  {
    id: "btc-basis-v3",
    name: "BTC Basis v3",
    version: "3.3.0",
    status: "live",
    lastPublished: "2d ago",
    clients: ["Delta One", "Quant Fund"],
  },
  {
    id: "eth-staked",
    name: "ETH Staked Basis",
    version: "2.5.1",
    status: "live",
    lastPublished: "5d ago",
    clients: ["Delta One"],
  },
  {
    id: "ml-directional",
    name: "ML Directional",
    version: "1.2.0",
    status: "paper",
    lastPublished: "1d ago",
    clients: ["Quant Fund"],
  },
  {
    id: "sports-arb",
    name: "Sports Arbitrage",
    version: "1.0.3",
    status: "live",
    lastPublished: "12h ago",
    clients: ["Sports Desk"],
  },
];

// Venues from real registry data
export const venues = [
  // CeFi CLOB venues
  {
    id: "BINANCE-FUTURES",
    name: "Binance Futures",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["BINANCE-FUTURES"]],
    status: "connected" as const,
    latency: 2.1,
    rateLimit: "85%",
  },
  {
    id: "HYPERLIQUID",
    name: "Hyperliquid",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["HYPERLIQUID"]],
    status: "connected" as const,
    latency: 0.8,
    rateLimit: "45%",
  },
  {
    id: "DERIBIT",
    name: "Deribit",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["DERIBIT"]],
    status: "connected" as const,
    latency: 3.2,
    rateLimit: "62%",
  },
  {
    id: "OKX",
    name: "OKX",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["OKX"]],
    status: "degraded" as const,
    latency: 8.4,
    rateLimit: "92%",
  },
  {
    id: "BYBIT",
    name: "Bybit",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["BYBIT"]],
    status: "connected" as const,
    latency: 1.8,
    rateLimit: "55%",
  },
  // DeFi
  {
    id: "AAVEV3_ETHEREUM",
    name: "Aave V3 (ETH)",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["AAVEV3_ETHEREUM"]],
    status: "connected" as const,
    latency: 1.2,
    rateLimit: "30%",
  },
  {
    id: "UNISWAPV3-ETHEREUM",
    name: "Uniswap V3",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["UNISWAPV3-ETHEREUM"]],
    status: "connected" as const,
    latency: 2.1,
    rateLimit: "25%",
  },
  // Sports
  {
    id: "PINNACLE",
    name: "Pinnacle",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["PINNACLE"]],
    status: "connected" as const,
    latency: 45,
    rateLimit: "70%",
  },
  {
    id: "BETFAIR",
    name: "Betfair",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["BETFAIR"]],
    status: "connected" as const,
    latency: 32,
    rateLimit: "60%",
  },
];

// Risk config
export const riskLimits = [
  { name: "Max Leverage", value: "3x", limit: "5x", utilization: 60 },
  { name: "Gross Exposure", value: "$8.2m", limit: "$15m", utilization: 55 },
  { name: "Single Position", value: "15%", limit: "25%", utilization: 60 },
  { name: "Daily Drawdown", value: "2.1%", limit: "5%", utilization: 42 },
];
