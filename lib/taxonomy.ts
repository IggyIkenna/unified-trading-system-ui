/**
 * CANONICAL TAXONOMY - Single Source of Truth
 *
 * All domain terminology, enumerations, and type definitions live here.
 * Import from this file in all other modules to ensure consistency.
 *
 * Categories:
 * - Asset Classes (DeFi, CeFi, TradFi, Sports, Prediction)
 * - Strategy Types (Basis, MarketMaking, Directional, etc.)
 * - Execution Modes (SCE, HUF, EVT for strategy; live/batch for system)
 * - Instruction Types (SWAP, TRADE, LEND, etc.)
 * - Testing Stages (MOCK → LIVE_REAL progression)
 * - Status Values (live, warning, error, paused, stopped)
 * - Venues (canonical IDs and display names)
 */

// =============================================================================
// ASSET CLASSES
// =============================================================================

export const ASSET_GROUPS = ["DeFi", "CeFi", "TradFi", "Sports", "Prediction"] as const;
export type AssetClass = (typeof ASSET_GROUPS)[number];

export const asset_group_CONFIG: Record<
  AssetClass,
  {
    label: string;
    description: string;
    color: string;
    icon: string;
  }
> = {
  DeFi: {
    label: "DeFi",
    description: "Decentralized Finance - on-chain protocols",
    color: "#22c55e", // green
    icon: "Coins",
  },
  CeFi: {
    label: "CeFi",
    description: "Centralized Finance - exchanges & brokers",
    color: "#3b82f6", // blue
    icon: "Building2",
  },
  TradFi: {
    label: "TradFi",
    description: "Traditional Finance - equities, options, futures",
    color: "#8b5cf6", // purple
    icon: "TrendingUp",
  },
  Sports: {
    label: "Sports",
    description: "Sports betting and odds arbitrage",
    color: "#f59e0b", // amber
    icon: "Trophy",
  },
  Prediction: {
    label: "Prediction",
    description: "Prediction markets and event contracts",
    color: "#ec4899", // pink
    icon: "Target",
  },
};

// =============================================================================
// STRATEGY TYPES / ARCHETYPES
// =============================================================================

export const STRATEGY_ARCHETYPES = [
  "BASIS_TRADE",
  "RECURSIVE_STAKED_BASIS",
  "MARKET_MAKING",
  "AMM_LP",
  "DIRECTIONAL",
  "ML_DIRECTIONAL",
  "OPTIONS",
  "ARBITRAGE",
  "SPORTS_ARB",
  "PREDICTION_ARB",
  "YIELD",
  "MOMENTUM",
  "MEAN_REVERSION",
  "STATISTICAL_ARB",
] as const;
export type StrategyArchetype = (typeof STRATEGY_ARCHETYPES)[number];

export const STRATEGY_ARCHETYPE_CONFIG: Record<
  StrategyArchetype,
  {
    label: string;
    shortLabel: string;
    description: string;
    assetClasses: AssetClass[];
  }
> = {
  BASIS_TRADE: {
    label: "Basis Trade",
    shortLabel: "Basis",
    description: "Exploit price differences between spot and derivatives",
    assetClasses: ["DeFi", "CeFi"],
  },
  RECURSIVE_STAKED_BASIS: {
    label: "Recursive Staked Basis",
    shortLabel: "Recursive",
    description: "Leveraged basis via recursive lending/borrowing",
    assetClasses: ["DeFi"],
  },
  MARKET_MAKING: {
    label: "Market Making",
    shortLabel: "MM",
    description: "Provide liquidity and capture spreads",
    assetClasses: ["CeFi", "TradFi"],
  },
  AMM_LP: {
    label: "AMM Liquidity Provision",
    shortLabel: "LP",
    description: "Concentrated liquidity provision on DEXs",
    assetClasses: ["DeFi"],
  },
  DIRECTIONAL: {
    label: "Directional",
    shortLabel: "Dir",
    description: "Take directional positions based on signals",
    assetClasses: ["CeFi", "TradFi", "DeFi"],
  },
  ML_DIRECTIONAL: {
    label: "ML Directional",
    shortLabel: "ML",
    description: "Machine learning driven directional trading",
    assetClasses: ["CeFi", "TradFi"],
  },
  OPTIONS: {
    label: "Options Market Making",
    shortLabel: "Opt MM",
    description: "Market making in options with delta hedging",
    assetClasses: ["TradFi", "CeFi"],
  },
  ARBITRAGE: {
    label: "Arbitrage",
    shortLabel: "Arb",
    description: "Risk-free cross-venue arbitrage",
    assetClasses: ["CeFi", "DeFi"],
  },
  SPORTS_ARB: {
    label: "Sports Arbitrage",
    shortLabel: "Sports",
    description: "Cross-bookmaker odds arbitrage",
    assetClasses: ["Sports"],
  },
  PREDICTION_ARB: {
    label: "Prediction Arbitrage",
    shortLabel: "Pred",
    description: "Cross-platform prediction market arbitrage (includes BTC prediction vs CeFi derivatives)",
    assetClasses: ["Prediction", "CeFi"],
  },
  YIELD: {
    label: "Yield Optimization",
    shortLabel: "Yield",
    description: "Optimize lending yields across protocols",
    assetClasses: ["DeFi"],
  },
  MOMENTUM: {
    label: "Momentum",
    shortLabel: "Mom",
    description: "Trend-following momentum strategies",
    assetClasses: ["CeFi", "TradFi"],
  },
  MEAN_REVERSION: {
    label: "Mean Reversion",
    shortLabel: "MR",
    description: "Fade extremes via z-scores, bands, or cointegration",
    assetClasses: ["CeFi", "TradFi"],
  },
  STATISTICAL_ARB: {
    label: "Statistical Arbitrage",
    shortLabel: "StatArb",
    description: "Pairs trading and statistical relationships",
    assetClasses: ["CeFi", "DeFi"],
  },
};

// =============================================================================
// CROSS-ASSET-CLASS ARBITRAGE LINKS
// =============================================================================
// These define which asset classes can be arbitraged against each other
// Used for topology visualization and strategy validation

export interface CrossAssetLink {
  from: AssetClass;
  to: AssetClass;
  instruments: string[];
  description: string;
  archetypes: StrategyArchetype[];
}

export const CROSS_asset_group_LINKS: CrossAssetLink[] = [
  {
    from: "Prediction",
    to: "CeFi",
    instruments: ["BTC", "ETH", "SOL"],
    description: "BTC/ETH prediction markets (up/down binary) vs CeFi futures/options",
    archetypes: ["PREDICTION_ARB", "ARBITRAGE"],
  },
  {
    from: "CeFi",
    to: "DeFi",
    instruments: ["BTC", "ETH", "USDT", "USDC"],
    description: "CEX spot/perps vs DEX/AMM pricing",
    archetypes: ["ARBITRAGE", "BASIS_TRADE"],
  },
  {
    from: "Sports",
    to: "Prediction",
    instruments: ["NFL", "NBA", "Soccer", "Tennis"],
    description: "Traditional sportsbook odds vs prediction market implied probabilities",
    archetypes: ["SPORTS_ARB", "PREDICTION_ARB"],
  },
  {
    from: "TradFi",
    to: "CeFi",
    instruments: ["BTC", "ETH"],
    description: "CME/CBOE futures vs crypto exchange derivatives",
    archetypes: ["BASIS_TRADE", "ARBITRAGE"],
  },
];

// =============================================================================
// EXECUTION MODES (Strategy-Level)
// =============================================================================

export const STRATEGY_EXECUTION_MODES = ["SCE", "HUF", "EVT"] as const;
export type StrategyExecutionMode = (typeof STRATEGY_EXECUTION_MODES)[number];

export const STRATEGY_EXECUTION_MODE_CONFIG: Record<
  StrategyExecutionMode,
  {
    label: string;
    fullName: string;
    description: string;
  }
> = {
  SCE: {
    label: "SCE",
    fullName: "Same Candle Exit",
    description: "Enter and exit within the same candle/interval",
  },
  HUF: {
    label: "HUF",
    fullName: "Hold Until Flip",
    description: "Hold position until signal reverses",
  },
  EVT: {
    label: "EVT",
    fullName: "Event-Driven Continuous",
    description: "Continuous event-driven execution with no fixed intervals",
  },
};

// =============================================================================
// SYSTEM EXECUTION MODES (Live vs Batch)
// =============================================================================

export const SYSTEM_MODES = ["live", "paper", "batch"] as const;
export type SystemMode = (typeof SYSTEM_MODES)[number];

export const SYSTEM_MODE_CONFIG: Record<
  SystemMode,
  {
    label: string;
    description: string;
    dataSource: string;
    latency: string;
    color: string;
  }
> = {
  live: {
    label: "Live",
    description: "Real-time data, real execution — orders hit venues",
    dataSource: "Pub/Sub streams",
    latency: "Sub-second to seconds",
    color: "var(--status-live)",
  },
  paper: {
    label: "Paper",
    description: "Real-time data, simulated fills — no real money at risk",
    dataSource: "Pub/Sub streams",
    latency: "Sub-second to seconds",
    color: "var(--status-warning)",
  },
  batch: {
    label: "Batch",
    description: "Historical end-of-day data for backtesting and reconciliation",
    dataSource: "GCS / Data warehouse",
    latency: "T+1 by 08:00",
    color: "var(--surface-markets)",
  },
};

// =============================================================================
// INSTRUCTION TYPES
// =============================================================================

export const INSTRUCTION_TYPES = [
  "SWAP",
  "TRADE",
  "FLASH_BORROW",
  "FLASH_REPAY",
  "LEND",
  "BORROW",
  "REPAY",
  "WITHDRAW",
  "ADD_LIQUIDITY",
  "REMOVE_LIQUIDITY",
  "COLLECT_FEES",
  "REBALANCE",
  "HEDGE",
  "SETTLE",
] as const;
export type InstructionType = (typeof INSTRUCTION_TYPES)[number];

export const INSTRUCTION_TYPE_CONFIG: Record<
  InstructionType,
  {
    label: string;
    description: string;
    assetClasses: AssetClass[];
  }
> = {
  SWAP: {
    label: "Swap",
    description: "Exchange one asset for another",
    assetClasses: ["DeFi"],
  },
  TRADE: {
    label: "Trade",
    description: "Place a buy or sell order",
    assetClasses: ["CeFi", "TradFi", "Sports", "Prediction"],
  },
  FLASH_BORROW: {
    label: "Flash Borrow",
    description: "Atomic flash loan borrow",
    assetClasses: ["DeFi"],
  },
  FLASH_REPAY: {
    label: "Flash Repay",
    description: "Atomic flash loan repayment",
    assetClasses: ["DeFi"],
  },
  LEND: {
    label: "Lend",
    description: "Supply assets to lending protocol",
    assetClasses: ["DeFi"],
  },
  BORROW: {
    label: "Borrow",
    description: "Borrow assets from lending protocol",
    assetClasses: ["DeFi"],
  },
  REPAY: {
    label: "Repay",
    description: "Repay borrowed assets",
    assetClasses: ["DeFi"],
  },
  WITHDRAW: {
    label: "Withdraw",
    description: "Withdraw supplied assets",
    assetClasses: ["DeFi"],
  },
  ADD_LIQUIDITY: {
    label: "Add Liquidity",
    description: "Provide liquidity to AMM pool",
    assetClasses: ["DeFi"],
  },
  REMOVE_LIQUIDITY: {
    label: "Remove Liquidity",
    description: "Withdraw liquidity from AMM pool",
    assetClasses: ["DeFi"],
  },
  COLLECT_FEES: {
    label: "Collect Fees",
    description: "Collect accumulated LP fees",
    assetClasses: ["DeFi"],
  },
  REBALANCE: {
    label: "Rebalance",
    description: "Rebalance position or portfolio",
    assetClasses: ["DeFi", "CeFi", "TradFi"],
  },
  HEDGE: {
    label: "Hedge",
    description: "Execute hedging trade",
    assetClasses: ["CeFi", "TradFi"],
  },
  SETTLE: {
    label: "Settle",
    description: "Settle position or contract",
    assetClasses: ["TradFi", "Sports", "Prediction"],
  },
};

// =============================================================================
// TESTING STAGES
// =============================================================================

// Correct 6-stage testing progression (BATCH_REAL removed - does not exist in real system)
export const TESTING_STAGES = ["MOCK", "HISTORICAL", "LIVE_MOCK", "LIVE_TESTNET", "STAGING", "LIVE_REAL"] as const;
export type TestingStage = (typeof TESTING_STAGES)[number];

export const TESTING_STAGE_CONFIG: Record<
  TestingStage,
  {
    label: string;
    description: string;
    order: number;
    color: string;
  }
> = {
  MOCK: {
    label: "Mock",
    description: "Unit tests with mocked data",
    order: 1,
    color: "#64748b",
  },
  HISTORICAL: {
    label: "Historical",
    description: "Backtest with historical data",
    order: 2,
    color: "#8b5cf6",
  },
  LIVE_MOCK: {
    label: "Live Mock",
    description: "Live data, mock execution",
    order: 3,
    color: "#f59e0b",
  },
  LIVE_TESTNET: {
    label: "Live Testnet",
    description: "Live testnet execution",
    order: 4,
    color: "#f97316",
  },
  STAGING: {
    label: "Staging",
    description: "Pre-production with real data",
    order: 5,
    color: "#06b6d4",
  },
  LIVE_REAL: {
    label: "Live Real",
    description: "Full production deployment",
    order: 6,
    color: "#22c55e",
  },
};

// =============================================================================
// STATUS VALUES
// =============================================================================

export const STRATEGY_STATUSES = ["live", "warning", "error", "paused", "stopped"] as const;
export type StrategyStatus = (typeof STRATEGY_STATUSES)[number];

export const STRATEGY_STATUS_CONFIG: Record<
  StrategyStatus,
  {
    label: string;
    description: string;
    color: string;
    canTrade: boolean;
  }
> = {
  live: {
    label: "Live",
    description: "Actively trading",
    color: "var(--status-live)",
    canTrade: true,
  },
  warning: {
    label: "Warning",
    description: "Operating with alerts",
    color: "var(--status-warning)",
    canTrade: true,
  },
  error: {
    label: "Error",
    description: "Error state, trading halted",
    color: "var(--status-error)",
    canTrade: false,
  },
  paused: {
    label: "Paused",
    description: "Temporarily paused",
    color: "var(--status-stale)",
    canTrade: false,
  },
  stopped: {
    label: "Stopped",
    description: "Permanently stopped",
    color: "var(--muted-foreground)",
    canTrade: false,
  },
};

// =============================================================================
// VENUES
// =============================================================================

export const VENUES = {
  // CeFi Exchanges
  binance: { label: "Binance", assetClass: "CeFi", type: "exchange" },
  okx: { label: "OKX", assetClass: "CeFi", type: "exchange" },
  deribit: { label: "Deribit", assetClass: "CeFi", type: "exchange" },
  bybit: { label: "Bybit", assetClass: "CeFi", type: "exchange" },
  coinbase: { label: "Coinbase", assetClass: "CeFi", type: "exchange" },

  // DeFi Protocols
  hyperliquid: { label: "Hyperliquid", assetClass: "DeFi", type: "perp-dex" },
  uniswap: { label: "Uniswap", assetClass: "DeFi", type: "amm" },
  aave: { label: "Aave", assetClass: "DeFi", type: "lending" },
  morpho: { label: "Morpho", assetClass: "DeFi", type: "lending" },
  compound: { label: "Compound", assetClass: "DeFi", type: "lending" },
  curve: { label: "Curve", assetClass: "DeFi", type: "amm" },
  gmx: { label: "GMX", assetClass: "DeFi", type: "perp-dex" },

  // TradFi
  ibkr: { label: "Interactive Brokers", assetClass: "TradFi", type: "broker" },
  cme: { label: "CME", assetClass: "TradFi", type: "exchange" },
  cboe: { label: "CBOE", assetClass: "TradFi", type: "exchange" },

  // Sports Betting
  betfair: { label: "Betfair", assetClass: "Sports", type: "exchange" },
  pinnacle: { label: "Pinnacle", assetClass: "Sports", type: "bookmaker" },
  draftkings: { label: "DraftKings", assetClass: "Sports", type: "bookmaker" },
  fanduel: { label: "FanDuel", assetClass: "Sports", type: "bookmaker" },
  bet365: { label: "Bet365", assetClass: "Sports", type: "bookmaker" },

  // Prediction Markets
  polymarket: {
    label: "Polymarket",
    assetClass: "Prediction",
    type: "prediction",
  },
  kalshi: { label: "Kalshi", assetClass: "Prediction", type: "prediction" },
  metaculus: {
    label: "Metaculus",
    assetClass: "Prediction",
    type: "prediction",
  },
} as const;

export type VenueId = keyof typeof VENUES;
export type VenueConfig = (typeof VENUES)[VenueId];

// =============================================================================
// P&L FACTORS
// =============================================================================

export const PNL_FACTORS = [
  "funding",
  "carry",
  "basis",
  "delta",
  "gamma",
  "vega",
  "theta",
  "slippage",
  "fees",
  "rebates",
  "residual",
  "staking_yield",
  "borrow_cost",
  "impermanent_loss",
  "interest_accrual",
  "arb_pnl",
  "spread_earned",
  "liquidation_penalty",
  "rewards",
  "gas",
  "commission",
] as const;
export type PnLFactor = (typeof PNL_FACTORS)[number];

export const PNL_FACTOR_CONFIG: Record<
  PnLFactor,
  {
    label: string;
    description: string;
    color: string;
    isExpense: boolean;
  }
> = {
  funding: {
    label: "Funding",
    description: "Funding rate payments (perps)",
    color: "#22c55e",
    isExpense: false,
  },
  carry: {
    label: "Carry",
    description: "Interest/yield differential",
    color: "#3b82f6",
    isExpense: false,
  },
  basis: {
    label: "Basis",
    description: "Spot-derivative price convergence",
    color: "#8b5cf6",
    isExpense: false,
  },
  delta: {
    label: "Delta",
    description: "Directional price exposure",
    color: "#f59e0b",
    isExpense: false,
  },
  gamma: {
    label: "Gamma",
    description: "Convexity / acceleration",
    color: "#ec4899",
    isExpense: false,
  },
  vega: {
    label: "Vega",
    description: "Implied volatility exposure",
    color: "#ef4444",
    isExpense: false,
  },
  theta: {
    label: "Theta",
    description: "Time decay",
    color: "#f97316",
    isExpense: true,
  },
  slippage: {
    label: "Slippage",
    description: "Execution price impact",
    color: "#dc2626",
    isExpense: true,
  },
  fees: {
    label: "Fees",
    description: "Exchange/protocol fees",
    color: "#991b1b",
    isExpense: true,
  },
  rebates: {
    label: "Rebates",
    description: "Maker rebates and incentives",
    color: "#14b8a6",
    isExpense: false,
  },
  residual: {
    label: "Residual",
    description: "Unexplained P&L",
    color: "#64748b",
    isExpense: false,
  },
  staking_yield: {
    label: "Staking Yield",
    description: "LST staking rate appreciation",
    color: "#10b981",
    isExpense: false,
  },
  borrow_cost: {
    label: "Borrow Cost",
    description: "DeFi lending protocol borrow interest",
    color: "#f43f5e",
    isExpense: true,
  },
  impermanent_loss: {
    label: "Impermanent Loss",
    description: "AMM LP divergence loss vs HODL",
    color: "#ef4444",
    isExpense: true,
  },
  interest_accrual: {
    label: "Interest Accrual",
    description: "Lending protocol supply yield accrual",
    color: "#06b6d4",
    isExpense: false,
  },
  arb_pnl: {
    label: "Arbitrage P&L",
    description: "Cross-venue or cross-market arbitrage profit",
    color: "#a855f7",
    isExpense: false,
  },
  spread_earned: {
    label: "Spread Earned",
    description: "Market making bid-ask spread capture",
    color: "#22d3ee",
    isExpense: false,
  },
  liquidation_penalty: {
    label: "Liquidation Penalty",
    description: "DeFi protocol liquidation cost",
    color: "#b91c1c",
    isExpense: true,
  },
  rewards: {
    label: "Protocol Rewards",
    description: "Token incentives and airdrops",
    color: "#84cc16",
    isExpense: false,
  },
  gas: {
    label: "Gas Costs",
    description: "On-chain transaction gas fees",
    color: "#78716c",
    isExpense: true,
  },
  commission: {
    label: "Commission",
    description: "Exchange or bookmaker commission",
    color: "#a8a29e",
    isExpense: true,
  },
};

// =============================================================================
// ALERT SEVERITIES
// =============================================================================

export const ALERT_SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    label: string;
    color: string;
    priority: number;
    autoEscalate: boolean;
    escalateAfterMinutes: number | null;
  }
> = {
  critical: {
    label: "Critical",
    color: "var(--status-error)",
    priority: 1,
    autoEscalate: true,
    escalateAfterMinutes: 5,
  },
  high: {
    label: "High",
    color: "#f97316",
    priority: 2,
    autoEscalate: true,
    escalateAfterMinutes: 15,
  },
  medium: {
    label: "Medium",
    color: "var(--status-warning)",
    priority: 3,
    autoEscalate: false,
    escalateAfterMinutes: null,
  },
  low: {
    label: "Low",
    color: "#3b82f6",
    priority: 4,
    autoEscalate: false,
    escalateAfterMinutes: null,
  },
  info: {
    label: "Info",
    color: "var(--muted-foreground)",
    priority: 5,
    autoEscalate: false,
    escalateAfterMinutes: null,
  },
};

// =============================================================================
// UNDERLYINGS
// =============================================================================

export const UNDERLYINGS = {
  // Crypto
  BTC: { label: "Bitcoin", symbol: "BTC", assetClass: "CeFi" as AssetClass },
  ETH: { label: "Ethereum", symbol: "ETH", assetClass: "CeFi" as AssetClass },
  SOL: { label: "Solana", symbol: "SOL", assetClass: "CeFi" as AssetClass },
  ARB: { label: "Arbitrum", symbol: "ARB", assetClass: "DeFi" as AssetClass },
  OP: { label: "Optimism", symbol: "OP", assetClass: "DeFi" as AssetClass },
  MATIC: {
    label: "Polygon",
    symbol: "MATIC",
    assetClass: "DeFi" as AssetClass,
  },
  AVAX: {
    label: "Avalanche",
    symbol: "AVAX",
    assetClass: "DeFi" as AssetClass,
  },

  // TradFi
  SPX: { label: "S&P 500", symbol: "SPX", assetClass: "TradFi" as AssetClass },
  NDX: {
    label: "Nasdaq 100",
    symbol: "NDX",
    assetClass: "TradFi" as AssetClass,
  },
  VIX: { label: "VIX", symbol: "VIX", assetClass: "TradFi" as AssetClass },

  // Sports
  NBA: { label: "NBA", symbol: "NBA", assetClass: "Sports" as AssetClass },
  NFL: { label: "NFL", symbol: "NFL", assetClass: "Sports" as AssetClass },
  MLB: { label: "MLB", symbol: "MLB", assetClass: "Sports" as AssetClass },
  EPL: {
    label: "English Premier League",
    symbol: "EPL",
    assetClass: "Sports" as AssetClass,
  },

  // Prediction
  POLITICS: {
    label: "Politics",
    symbol: "POL",
    assetClass: "Prediction" as AssetClass,
  },
  ECONOMICS: {
    label: "Economics",
    symbol: "ECON",
    assetClass: "Prediction" as AssetClass,
  },
} as const;

export type UnderlyingId = keyof typeof UNDERLYINGS;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getAssetClassColor(assetClass: AssetClass): string {
  return asset_group_CONFIG[assetClass].color;
}

export function getStrategyStatusColor(status: StrategyStatus): string {
  return STRATEGY_STATUS_CONFIG[status].color;
}

export function getTestingStageProgress(stage: TestingStage): number {
  return (TESTING_STAGE_CONFIG[stage].order / TESTING_STAGES.length) * 100;
}

export function getVenuesByAssetClass(assetClass: AssetClass): VenueId[] {
  return (Object.keys(VENUES) as VenueId[]).filter((id) => VENUES[id].assetClass === assetClass);
}

export function getUnderlyingsByAssetClass(assetClass: AssetClass): UnderlyingId[] {
  return (Object.keys(UNDERLYINGS) as UnderlyingId[]).filter((id) => UNDERLYINGS[id].assetClass === assetClass);
}

// =============================================================================
// NAVIGATION SURFACES
// =============================================================================

export const NAVIGATION_SURFACES = ["strategy", "markets", "ops", "ml", "config", "reports"] as const;
export type NavigationSurface = (typeof NAVIGATION_SURFACES)[number];

export const NAVIGATION_SURFACE_CONFIG: Record<
  NavigationSurface,
  {
    label: string;
    description: string;
    color: string;
    href: string;
  }
> = {
  strategy: {
    label: "Strategy",
    description: "Strategy catalogue and configuration",
    color: "var(--surface-strategy)",
    href: "/services/trading/strategies",
  },
  markets: {
    label: "Markets",
    description: "P&L attribution and market analysis",
    color: "var(--surface-markets)",
    href: "/markets",
  },
  ops: {
    label: "Ops",
    description: "Operations, deployments, and monitoring",
    color: "var(--surface-ops)",
    href: "/ops",
  },
  ml: {
    label: "ML",
    description: "Machine learning models and experiments",
    color: "var(--surface-ml)",
    href: "/ml",
  },
  config: {
    label: "Config",
    description: "Client and system configuration",
    color: "var(--surface-config)",
    href: "/config",
  },
  reports: {
    label: "Reports",
    description: "Reporting and settlement",
    color: "var(--surface-reports)",
    href: "/reports",
  },
};

// =============================================================================
// LIFECYCLE STAGES — CANONICAL LABELS
// =============================================================================
// These are the platform-wide lifecycle stages. Every navigation item, service
// card, route label, and documentation reference MUST use these labels exactly.
// The `stage` key is the machine identifier; `label` is the only user-facing name.
// Do NOT invent synonyms ("Build" for "Research", "Run" for "Trading", etc.).

export const PLATFORM_LIFECYCLE_STAGES = ["acquire", "build", "promote", "run", "observe", "manage", "report"] as const;
export type PlatformLifecycleStage = (typeof PLATFORM_LIFECYCLE_STAGES)[number];

export const PLATFORM_LIFECYCLE_CONFIG: Record<
  PlatformLifecycleStage,
  {
    label: string;
    description: string;
    order: number;
    icon: string;
    color: string;
  }
> = {
  acquire: {
    label: "Data",
    description: "Instrument catalogue, market data, venue coverage, and freshness monitoring",
    order: 1,
    icon: "Database",
    color: "text-sky-400",
  },
  build: {
    label: "Research",
    description: "ML models, strategy development, execution research, and backtesting",
    order: 2,
    icon: "FlaskConical",
    color: "text-violet-400",
  },
  promote: {
    label: "Promote",
    description: "Strategy review, risk analysis, and deployment approval",
    order: 3,
    icon: "ArrowUpCircle",
    color: "text-amber-400",
  },
  run: {
    label: "DART",
    description:
      "Data-Analytics-Research-Trading umbrella — terminal, positions, orders, P&L, strategy config, deployment, observe, signal intake",
    order: 4,
    icon: "TrendingUp",
    color: "text-emerald-400",
  },
  observe: {
    label: "Observe",
    description: "Risk monitoring, alerts, strategy health, and system health",
    order: 5,
    icon: "Eye",
    color: "text-cyan-400",
  },
  manage: {
    label: "Manage",
    description: "Clients, mandates, fees, and regulatory operations",
    order: 6,
    icon: "Settings2",
    color: "text-rose-400",
  },
  report: {
    label: "Reports",
    description: "P&L attribution, settlement, reconciliation, and compliance reporting",
    order: 7,
    icon: "FileText",
    color: "text-slate-400",
  },
};

// =============================================================================
// CANONICAL SERVICE LABELS — SSOT for all user-facing service names
// =============================================================================
// Every surface (nav, cards, tabs, docs, marketing) MUST use these exact names.
// No synonyms. "Research & Backtesting" is wrong — it's "Research".

export const SERVICE_LABELS = {
  data: "Data",
  research: "Research",
  promote: "Promote",
  trading: "DART",
  observe: "Observe",
  reports: "Reports",
  "investor-relations": "Investor Relations",
  admin: "Admin & Ops",
} as const;
export type ServiceKey = keyof typeof SERVICE_LABELS;

// =============================================================================
// CANDIDATE LIFECYCLE WORDING — canonical verbs for strategy progression
// =============================================================================
// Use these exact terms across all surfaces. No synonyms.

export const CANDIDATE_LIFECYCLE_VERBS = {
  design: "Design",
  backtest: "Backtest",
  validate: "Validate",
  review: "Review",
  promote: "Promote",
  deploy: "Deploy",
  monitor: "Monitor",
  retire: "Retire",
} as const;

// =============================================================================
// STRATEGY LIFECYCLE STAGES — progression from design to retirement
// =============================================================================

export const STRATEGY_LIFECYCLE_STAGES = [
  "design",
  "backtest",
  "validate",
  "paper",
  "shadow",
  "promote",
  "live",
  "monitor",
  "review",
] as const;
export type StrategyLifecycleStage = (typeof STRATEGY_LIFECYCLE_STAGES)[number];

export const STRATEGY_LIFECYCLE_CONFIG: Record<
  StrategyLifecycleStage,
  {
    label: string;
    description: string;
    order: number;
    color: string;
  }
> = {
  design: {
    label: "Design",
    description: "Define strategy hypothesis and parameters",
    order: 1,
    color: "#64748b",
  },
  backtest: {
    label: "Backtest",
    description: "Run historical simulation",
    order: 2,
    color: "#8b5cf6",
  },
  validate: {
    label: "Validate",
    description: "Statistical and risk validation of results",
    order: 3,
    color: "#f59e0b",
  },
  paper: {
    label: "Paper",
    description: "Live data, simulated execution",
    order: 4,
    color: "#f97316",
  },
  shadow: {
    label: "Shadow",
    description: "Live data, parallel to production, no capital",
    order: 5,
    color: "#06b6d4",
  },
  promote: {
    label: "Promote",
    description: "Governance review and deployment approval",
    order: 6,
    color: "#eab308",
  },
  live: {
    label: "Live",
    description: "Active production trading",
    order: 7,
    color: "#22c55e",
  },
  monitor: {
    label: "Monitor",
    description: "Ongoing performance and drift tracking",
    order: 8,
    color: "#3b82f6",
  },
  review: {
    label: "Review",
    description: "Periodic performance review and revalidation",
    order: 9,
    color: "#a855f7",
  },
};

// =============================================================================
// CANDIDATE STATUSES — states within the promote/review pipeline
// =============================================================================

export const CANDIDATE_STATUSES = [
  "draft",
  "shortlisted",
  "under_review",
  "approved",
  "rejected",
  "promoted",
  "retired",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CANDIDATE_STATUS_CONFIG: Record<
  CandidateStatus,
  {
    label: string;
    description: string;
    color: string;
    terminal: boolean;
  }
> = {
  draft: {
    label: "Draft",
    description: "Initial candidate, not yet submitted for review",
    color: "#64748b",
    terminal: false,
  },
  shortlisted: {
    label: "Shortlisted",
    description: "Selected for comparison and review",
    color: "#3b82f6",
    terminal: false,
  },
  under_review: {
    label: "Under Review",
    description: "Active governance and risk review",
    color: "#f59e0b",
    terminal: false,
  },
  approved: {
    label: "Approved",
    description: "Approved for production deployment",
    color: "#22c55e",
    terminal: false,
  },
  rejected: {
    label: "Rejected",
    description: "Failed review criteria",
    color: "#ef4444",
    terminal: true,
  },
  promoted: {
    label: "Promoted",
    description: "Deployed to production",
    color: "#10b981",
    terminal: true,
  },
  retired: {
    label: "Retired",
    description: "Removed from production",
    color: "#78716c",
    terminal: true,
  },
};

// =============================================================================
// READINESS STATES — deployment/testing readiness
// =============================================================================

export const READINESS_STATES = ["not_ready", "partial", "ready", "validated", "deployed"] as const;
export type ReadinessState = (typeof READINESS_STATES)[number];

export const READINESS_STATE_CONFIG: Record<
  ReadinessState,
  {
    label: string;
    description: string;
    color: string;
    icon: string;
  }
> = {
  not_ready: {
    label: "Not Ready",
    description: "Prerequisites not met",
    color: "#ef4444",
    icon: "XCircle",
  },
  partial: {
    label: "Partial",
    description: "Some checks passing, others pending",
    color: "#f59e0b",
    icon: "AlertCircle",
  },
  ready: {
    label: "Ready",
    description: "All prerequisites met, awaiting action",
    color: "#3b82f6",
    icon: "CheckCircle2",
  },
  validated: {
    label: "Validated",
    description: "Passed all validation gates",
    color: "#22c55e",
    icon: "ShieldCheck",
  },
  deployed: {
    label: "Deployed",
    description: "Active in target environment",
    color: "#10b981",
    icon: "Rocket",
  },
};

// =============================================================================
// SERVICE AVAILABILITY STATES — hub display states
// =============================================================================

export const SERVICE_AVAILABILITY_STATES = ["available", "locked", "degraded", "hidden", "maintenance"] as const;
export type ServiceAvailabilityState = (typeof SERVICE_AVAILABILITY_STATES)[number];

export const SERVICE_AVAILABILITY_CONFIG: Record<
  ServiceAvailabilityState,
  {
    label: string;
    description: string;
    color: string;
    icon: string;
  }
> = {
  available: {
    label: "Available",
    description: "Fully operational",
    color: "#22c55e",
    icon: "CheckCircle2",
  },
  locked: {
    label: "Locked",
    description: "Requires subscription upgrade",
    color: "#64748b",
    icon: "Lock",
  },
  degraded: {
    label: "Degraded",
    description: "Partially operational, reduced functionality",
    color: "#f59e0b",
    icon: "AlertTriangle",
  },
  hidden: {
    label: "Hidden",
    description: "Not visible to current role",
    color: "#1e293b",
    icon: "EyeOff",
  },
  maintenance: {
    label: "Maintenance",
    description: "Temporarily unavailable for maintenance",
    color: "#06b6d4",
    icon: "Wrench",
  },
};

// =============================================================================
// STRATEGY REGISTRY ENTRY — canonical shape for strategy-facing pages
// =============================================================================
// Every strategy card, detail page, comparison view, and candidate basket
// must be able to render from this shape. The actual data lives in
// strategy-registry.ts; this is the contract.

export interface StrategyRegistryEntry {
  /** Unique strategy identifier */
  id: string;
  /** User-facing display name */
  displayName: string;
  /** Strategy archetype from taxonomy */
  archetype: StrategyArchetype;
  /** Primary asset class */
  assetClass: AssetClass;
  /** Strategy-level execution mode (SCE/HUF/EVT) */
  executionMode: StrategyExecutionMode;
  /** Instruction types this strategy can generate */
  instructionTypes: readonly InstructionType[];
  /** Default venues for this strategy */
  defaultVenues: readonly string[];
  /** Short template-level description */
  templateDescription: string;
  /** Whether this strategy supports batch/backtest mode */
  supportsBatch: boolean;
  /** Whether this strategy supports live trading */
  supportsLive: boolean;
  /** Whether this strategy supports promotion pipeline */
  supportsPromotion: boolean;
  /** Current lifecycle stage */
  lifecycleStage: StrategyLifecycleStage;
  /** Current candidate status (if in promote pipeline) */
  candidateStatus?: CandidateStatus;
  /** Strategy version string */
  version: string;
}

// =============================================================================
// CANDIDATE PACKAGE — shared shape for research family handoff
// =============================================================================
// Used across Strategy, ML, and Execution candidate baskets.

export interface CandidatePackage {
  /** Which research domain this candidate comes from */
  sourceDomain: "strategy" | "ml" | "execution";
  /** Domain-specific entity ID */
  entityId: string;
  /** Type of entity (strategy config, model version, algo config) */
  entityType: string;
  /** Semantic version or run ID */
  version: string;
  /** Key metrics snapshot for comparison */
  summaryMetrics: Record<string, number | string>;
  /** Why this candidate was selected */
  rationale: string;
  /** Current review state */
  reviewState: CandidateStatus;
  /** Where this candidate should be handed off to */
  targetHandoff: "promote" | "deploy" | "archive";
}

// =============================================================================
// LEGACY LIFECYCLE PHASES (deprecated — use PLATFORM_LIFECYCLE_STAGES)
// =============================================================================

export const LIFECYCLE_PHASES = ["build", "stage", "run", "explain", "reconcile"] as const;
export type LifecyclePhase = (typeof LIFECYCLE_PHASES)[number];

export const LIFECYCLE_PHASE_CONFIG: Record<
  LifecyclePhase,
  {
    label: string;
    description: string;
    order: number;
  }
> = {
  build: {
    label: "Build",
    description: "Design and configure strategies",
    order: 1,
  },
  stage: {
    label: "Stage",
    description: "Test and validate before production",
    order: 2,
  },
  run: {
    label: "Run",
    description: "Execute in production",
    order: 3,
  },
  explain: {
    label: "Explain",
    description: "Analyze performance and attribution",
    order: 4,
  },
  reconcile: {
    label: "Reconcile",
    description: "Settle and report",
    order: 5,
  },
};
