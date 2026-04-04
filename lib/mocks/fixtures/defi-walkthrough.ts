import type {
  EmergencyExitEstimate,
  FundingRateMatrix,
  HealthFactorDashboard,
  RewardPnLBreakdown,
  StakingReward,
  WaterfallWeights,
} from "@/lib/types/defi";

// ---------------------------------------------------------------------------
// 1. Staking Rewards
// ---------------------------------------------------------------------------

export const MOCK_STAKING_REWARDS: StakingReward[] = [
  {
    token: "EIGEN",
    accrued_amount: 12.5,
    accrued_value_usd: 42.0,
    claimed_amount: 0,
    sold_amount: 0,
    sold_value_usd: 0,
    next_payout: "2026-04-07T00:00:00Z",
    frequency: "WEEKLY",
  },
  {
    token: "ETHFI",
    accrued_amount: 0,
    accrued_value_usd: 0,
    claimed_amount: 0,
    sold_amount: 0,
    sold_value_usd: 0,
    next_payout: "2026-06-15T00:00:00Z",
    frequency: "QUARTERLY",
  },
];

// ---------------------------------------------------------------------------
// 2. Funding Rate Matrix
// ---------------------------------------------------------------------------

export const MOCK_FUNDING_RATES: FundingRateMatrix = {
  ETH: { HYPERLIQUID: 6.2, OKX: 5.1, BYBIT: 4.8, BINANCE: 5.5, ASTER: 4.3 },
  BTC: { HYPERLIQUID: 5.8, OKX: 4.9, BYBIT: 4.5, BINANCE: 5.2, ASTER: 4.1 },
  SOL: { HYPERLIQUID: 8.1, OKX: 6.2, BYBIT: 5.9, BINANCE: 7.1, ASTER: 5.5 },
  DOGE: { HYPERLIQUID: 12.3, OKX: 9.8, BYBIT: 8.5, BINANCE: 10.2, ASTER: null },
  AVAX: { HYPERLIQUID: 3.2, OKX: 2.8, BYBIT: 2.1, BINANCE: 3.0, ASTER: 2.5 },
  LINK: { HYPERLIQUID: 4.5, OKX: 3.8, BYBIT: 3.2, BINANCE: 4.1, ASTER: 3.0 },
  ARB: { HYPERLIQUID: 7.2, OKX: 5.5, BYBIT: 4.9, BINANCE: 6.1, ASTER: null },
  OP: { HYPERLIQUID: 6.8, OKX: 5.0, BYBIT: 4.3, BINANCE: 5.8, ASTER: null },
};

export const FUNDING_RATE_VENUES = ["HYPERLIQUID", "OKX", "BYBIT", "BINANCE", "ASTER"] as const;
export const FUNDING_RATE_FLOOR = 2.5;

// ---------------------------------------------------------------------------
// 3. Two-Waterfall Weights
// ---------------------------------------------------------------------------

export const MOCK_WATERFALL_WEIGHTS: WaterfallWeights = {
  coin_weights: {
    ETH: 0.35,
    BTC: 0.25,
    SOL: 0.20,
    DOGE: 0.10,
    AVAX: 0.05,
    LINK: 0.05,
  },
  venue_weights: {
    ETH: { HYPERLIQUID: 0.35, OKX: 0.25, BYBIT: 0.15, BINANCE: 0.20, ASTER: 0.05 },
    BTC: { HYPERLIQUID: 0.30, OKX: 0.25, BYBIT: 0.20, BINANCE: 0.25, ASTER: 0.00 },
    SOL: { HYPERLIQUID: 0.40, OKX: 0.20, BYBIT: 0.15, BINANCE: 0.25, ASTER: 0.00 },
    DOGE: { HYPERLIQUID: 0.50, OKX: 0.25, BYBIT: 0.15, BINANCE: 0.10, ASTER: 0.00 },
    AVAX: { HYPERLIQUID: 0.40, OKX: 0.20, BYBIT: 0.10, BINANCE: 0.30, ASTER: 0.00 },
    LINK: { HYPERLIQUID: 0.35, OKX: 0.25, BYBIT: 0.20, BINANCE: 0.20, ASTER: 0.00 },
  },
  restricted_venues: ["ASTER"],
};

// Patrick-specific: restricted to fewer venues
export const MOCK_WATERFALL_WEIGHTS_PATRICK: WaterfallWeights = {
  coin_weights: {
    ETH: 0.40,
    BTC: 0.30,
    SOL: 0.20,
    DOGE: 0.10,
  },
  venue_weights: {
    ETH: { HYPERLIQUID: 0.40, OKX: 0.30, BINANCE: 0.30 },
    BTC: { HYPERLIQUID: 0.35, OKX: 0.30, BINANCE: 0.35 },
    SOL: { HYPERLIQUID: 0.45, OKX: 0.25, BINANCE: 0.30 },
    DOGE: { HYPERLIQUID: 0.50, OKX: 0.25, BINANCE: 0.25 },
  },
  restricted_venues: ["ASTER", "BYBIT"],
};

// ---------------------------------------------------------------------------
// 4. Health Factor Dashboard
// ---------------------------------------------------------------------------

export const MOCK_HEALTH_FACTOR: HealthFactorDashboard = {
  current_hf: 1.38,
  liquidation_at: 1.0,
  warning_at: 1.3,
  buffer_pct: 27.5,
  weeth_oracle_rate: 1.0352,
  weeth_market_rate: 1.0348,
  oracle_market_gap_pct: 0.04,
  borrow_rate_pct: 2.1,
  staking_rate_pct: 3.2,
  net_spread_pct: 1.1,
  leverage: 2.5,
  leveraged_spread_pct: 2.75,
  monitoring_interval: "5 minutes",
};

// ---------------------------------------------------------------------------
// 5. Emergency Exit
// ---------------------------------------------------------------------------

export const MOCK_EMERGENCY_EXIT: EmergencyExitEstimate = {
  estimated_gas_usd: 85,
  estimated_slippage_usd: 320,
  estimated_exchange_fees_usd: 45,
  total_cost_usd: 450,
  total_as_pct_of_nav: 0.3,
  estimated_time_minutes: 15,
  steps: [
    "Close perp shorts (HYPERLIQUID)",
    "Repay WETH debt (AAVEV3-ETHEREUM)",
    "Withdraw weETH collateral (AAVEV3-ETHEREUM)",
    "Unwrap weETH -> ETH",
    "Transfer to treasury",
  ],
};

// ---------------------------------------------------------------------------
// 6. Reward P&L Breakdown
// ---------------------------------------------------------------------------

export const MOCK_REWARD_PNL: RewardPnLBreakdown = {
  staking_yield: { amount: 1050, label: "Staking Yield (weETH appreciation)" },
  restaking_reward: { amount: 420, label: "Restaking Rewards (EIGEN)" },
  seasonal_reward: { amount: 0, label: "Seasonal Rewards (pending)" },
  reward_unrealised: { amount: 42, label: "Unclaimed Rewards (M2M)" },
};
