import type { StrategyArchetypeV2 } from "@/lib/architecture-v2/enums";
import type {
  DeFiStrategyId,
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

// ---------------------------------------------------------------------------
// 3. Two-Waterfall Weights
// ---------------------------------------------------------------------------

export const MOCK_WATERFALL_WEIGHTS: WaterfallWeights = {
  coin_weights: {
    ETH: 0.35,
    BTC: 0.25,
    SOL: 0.2,
    DOGE: 0.1,
    AVAX: 0.05,
    LINK: 0.05,
  },
  venue_weights: {
    ETH: { HYPERLIQUID: 0.35, OKX: 0.25, BYBIT: 0.15, BINANCE: 0.2, ASTER: 0.05 },
    BTC: { HYPERLIQUID: 0.3, OKX: 0.25, BYBIT: 0.2, BINANCE: 0.25, ASTER: 0.0 },
    SOL: { HYPERLIQUID: 0.4, OKX: 0.2, BYBIT: 0.15, BINANCE: 0.25, ASTER: 0.0 },
    DOGE: { HYPERLIQUID: 0.5, OKX: 0.25, BYBIT: 0.15, BINANCE: 0.1, ASTER: 0.0 },
    AVAX: { HYPERLIQUID: 0.4, OKX: 0.2, BYBIT: 0.1, BINANCE: 0.3, ASTER: 0.0 },
    LINK: { HYPERLIQUID: 0.35, OKX: 0.25, BYBIT: 0.2, BINANCE: 0.2, ASTER: 0.0 },
  },
  restricted_venues: ["ASTER"],
};

// Patrick-specific: restricted to fewer venues
export const MOCK_WATERFALL_WEIGHTS_PATRICK: WaterfallWeights = {
  coin_weights: {
    ETH: 0.4,
    BTC: 0.3,
    SOL: 0.2,
    DOGE: 0.1,
  },
  venue_weights: {
    ETH: { HYPERLIQUID: 0.4, OKX: 0.3, BINANCE: 0.3 },
    BTC: { HYPERLIQUID: 0.35, OKX: 0.3, BINANCE: 0.35 },
    SOL: { HYPERLIQUID: 0.45, OKX: 0.25, BINANCE: 0.3 },
    DOGE: { HYPERLIQUID: 0.5, OKX: 0.25, BINANCE: 0.25 },
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
  collateral_token: "weETH",
  collateral_oracle_rate: 1.0352,
  collateral_market_rate: 1.0348,
  oracle_market_gap_pct: 0.04,
  borrow_rate_pct: 2.1,
  staking_rate_pct: 3.2,
  net_spread_pct: 1.1,
  leverage: 2.5,
  leveraged_spread_pct: 2.75,
  monitoring_interval: "5 minutes",
  emergency_exit_description: "unwind the recursive staking position",
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
// 6. Reward / P&L Breakdown (per-archetype)
// ---------------------------------------------------------------------------

/**
 * Default reward / P&L factor lists per strategy archetype.
 *
 * SSOT for the shape (archetype → ordered factor list) lives on the strategy
 * instance as `instance.pnl_factors[]`. Until the backend instance contract
 * lands, we seed realistic defaults here keyed by `StrategyArchetypeV2`.
 *
 * The widget is archetype-agnostic — adding a new archetype is a fixture-only
 * change. Factor `amount` values here are illustrative mock data; the widget
 * reads them verbatim.
 */
export const DEFAULT_REWARD_FACTORS_BY_ARCHETYPE: Partial<Record<StrategyArchetypeV2, RewardPnLBreakdown>> = {
  // Staking (simple native staking — rebase / exchange-rate yield).
  YIELD_STAKING_SIMPLE: [
    { key: "staking_yield", label: "Staking yield (30d, 3.4% APY)", amount: 2100 },
    { key: "restaking_reward", label: "Restaking rewards (EIGEN)", amount: 420 },
    { key: "seasonal_reward", label: "Seasonal rewards (ETHFI Q2)", amount: 0 },
    { key: "reward_unrealised", label: "Unclaimed rewards (M2M)", amount: 42 },
  ],
  // Lending rotation (supply APY + protocol incentives + fee kickbacks).
  YIELD_ROTATION_LENDING: [
    { key: "supply_apy", label: "Supply APY (30d, weighted)", amount: 1820 },
    { key: "incentive_rewards", label: "Incentive rewards (COMP / MORPHO)", amount: 260 },
    { key: "fee_earnings", label: "Fee earnings / rebates", amount: 85 },
  ],
  // Carry basis perp (cash-and-carry: funding + basis + exec alpha net of fees).
  CARRY_BASIS_PERP: [
    { key: "funding", label: "Funding (perp short, 30d)", amount: 1540 },
    { key: "basis_spread", label: "Basis spread capture", amount: 310 },
    { key: "trading", label: "Trading P&L", amount: 85 },
    { key: "fees", label: "Exchange / gas fees", amount: -140 },
    { key: "exec_alpha", label: "Execution alpha (vs benchmark)", amount: 62 },
  ],
  // Carry staked basis (LST yield + perp funding − borrow cost).
  CARRY_STAKED_BASIS: [
    { key: "staking", label: "Staking yield (weETH)", amount: 1680 },
    { key: "funding", label: "Funding (perp short)", amount: 1120 },
    { key: "borrow_cost", label: "Borrow cost (USDC)", amount: -540 },
  ],
  // Recursive staked basis (leveraged loop on LST collateral).
  CARRY_RECURSIVE_STAKED: [
    { key: "staking", label: "Staking yield (weETH)", amount: 2460 },
    { key: "funding", label: "Funding (perp short)", amount: 1220 },
    { key: "borrow_cost", label: "Borrow cost (WETH)", amount: -880 },
    { key: "leverage_factor", label: "Leverage uplift (2.5x)", amount: 540 },
  ],
  // Note: AMM LP (ALP) archetype has no v2 enum mapping yet; retained in the
  // getter below for preset lookups keyed on legacy strategy_id "AMM_LP".
};

/**
 * AMM LP default factor list. Keyed by legacy strategy_id because v2 enums
 * do not yet carry an AMM_LP archetype.
 */
export const AMM_LP_REWARD_FACTORS: RewardPnLBreakdown = [
  { key: "fees_earned", label: "LP fees earned (30d)", amount: 1240 },
  { key: "il_realised", label: "Impermanent loss realised", amount: -380 },
  { key: "incentive_rewards", label: "Incentive rewards (UNI / OP)", amount: 220 },
];

/**
 * Default fallback when the strategy archetype is unknown — staking list,
 * since staking is the historical default for the walkthrough preset.
 */
export const MOCK_REWARD_PNL: RewardPnLBreakdown =
  DEFAULT_REWARD_FACTORS_BY_ARCHETYPE.YIELD_STAKING_SIMPLE as RewardPnLBreakdown;

/**
 * Look up the default factor list for a strategy identified by v2 archetype.
 * Falls back to AMM LP when the legacy `AMM_LP` strategy_id is passed; falls
 * back to the staking default otherwise.
 */
export function getDefaultRewardFactors(archetype: StrategyArchetypeV2 | "AMM_LP" | undefined): RewardPnLBreakdown {
  if (archetype === "AMM_LP") return AMM_LP_REWARD_FACTORS;
  if (archetype && DEFAULT_REWARD_FACTORS_BY_ARCHETYPE[archetype]) {
    return DEFAULT_REWARD_FACTORS_BY_ARCHETYPE[archetype] as RewardPnLBreakdown;
  }
  return MOCK_REWARD_PNL;
}

/**
 * Mapping from legacy DeFi `strategy_id` to v2 archetype — used to resolve
 * which factor list applies when a strategy filter is active. Will be
 * replaced by `instance.archetype` once the backend instance contract
 * plumbs archetype through to the UI.
 */
export const STRATEGY_ID_TO_ARCHETYPE: Partial<Record<DeFiStrategyId, StrategyArchetypeV2 | "AMM_LP">> = {
  AAVE_LENDING: "YIELD_ROTATION_LENDING",
  ETH_LENDING: "YIELD_ROTATION_LENDING",
  MULTICHAIN_LENDING: "YIELD_ROTATION_LENDING",
  CROSS_CHAIN_YIELD_ARB: "YIELD_ROTATION_LENDING",
  BASIS_TRADE: "CARRY_BASIS_PERP",
  BTC_BASIS: "CARRY_BASIS_PERP",
  SOL_BASIS: "CARRY_BASIS_PERP",
  L2_BASIS: "CARRY_BASIS_PERP",
  STAKED_BASIS: "CARRY_STAKED_BASIS",
  RECURSIVE_STAKED_BASIS: "CARRY_RECURSIVE_STAKED",
  UNHEDGED_RECURSIVE: "CARRY_RECURSIVE_STAKED",
  USDT_HEDGED_RECURSIVE: "CARRY_RECURSIVE_STAKED",
  AMM_LP: "AMM_LP",
  LIQUIDATION_CAPTURE: "LIQUIDATION_CAPTURE",
  CROSS_CHAIN_SOR: "ARBITRAGE_PRICE_DISPERSION",
};

/**
 * Resolve the default factor list for a DeFi strategy instance by its
 * legacy `strategy_id`. Returns the staking default when the id is
 * unrecognised or undefined.
 */
export function getRewardFactorsForStrategyId(strategyId: DeFiStrategyId | string | undefined): RewardPnLBreakdown {
  if (!strategyId) return MOCK_REWARD_PNL;
  const archetype = STRATEGY_ID_TO_ARCHETYPE[strategyId as DeFiStrategyId];
  return getDefaultRewardFactors(archetype);
}
