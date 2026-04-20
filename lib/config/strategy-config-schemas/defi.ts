/**
 * DeFi strategy config schemas — declarative field definitions per strategy.
 *
 * Adding a new DeFi strategy:
 *   1. Add its ID to DEFI_STRATEGY_IDS in lib/types/defi.ts
 *   2. Add a schema entry to DEFI_STRATEGY_SCHEMAS below
 *   3. Add it to the appropriate family in DEFI_STRATEGY_FAMILIES
 *   4. Done — the widget renders it automatically
 */

import type { DeFiStrategyId } from "@/lib/types/defi";
import type { StrategyConfigSchema, StrategyFamilyGroup } from "./types";
import {
  BASIS_COIN_OPTIONS,
  BENCHMARK_TOKEN_OPTIONS,
  BRIDGE_PROVIDER_OPTIONS,
  BTC_COIN_OPTIONS,
  CHAIN_OPTIONS,
  FLASH_LOAN_PROVIDER_OPTIONS,
  L2_CHAIN_OPTIONS,
  LENDING_BASKET_OPTIONS,
  LIQUIDATION_TARGET_PROTOCOLS,
  LP_POOL_OPTIONS,
  LST_TOKEN_OPTIONS,
  MEV_POLICY_OPTIONS,
  PERP_VENUE_OPTIONS,
  PERP_VENUE_SINGLE_OPTIONS,
  REWARD_MODE_OPTIONS,
  SOL_COIN_OPTIONS,
} from "./options";

// ---------------------------------------------------------------------------
// Per-strategy schemas
// ---------------------------------------------------------------------------

export const DEFI_STRATEGY_SCHEMAS: Record<DeFiStrategyId, StrategyConfigSchema> = {
  AAVE_LENDING: {
    fields: [
      {
        key: "lending_basket",
        label: "Lending Basket",
        type: "multi-select",
        options: LENDING_BASKET_OPTIONS,
        default: ["USDC", "USDT"],
      },
      { key: "min_apy_threshold", label: "Min APY Threshold", type: "number", suffix: "%", step: 0.5, default: 2.5 },
      { key: "chain", label: "Chain", type: "dropdown", options: CHAIN_OPTIONS, default: "ETHEREUM" },
    ],
  },

  ETH_LENDING: {
    fields: [
      {
        key: "lending_basket",
        label: "Lending Basket",
        type: "multi-select",
        options: LENDING_BASKET_OPTIONS,
        default: ["ETH", "WETH"],
      },
      { key: "min_apy_threshold", label: "Min APY Threshold", type: "number", suffix: "%", step: 0.5, default: 1.5 },
      { key: "chain", label: "Chain", type: "dropdown", options: CHAIN_OPTIONS, default: "ETHEREUM" },
    ],
  },

  MULTICHAIN_LENDING: {
    fields: [
      {
        key: "lending_basket",
        label: "Lending Basket",
        type: "multi-select",
        options: LENDING_BASKET_OPTIONS,
        default: ["USDC", "USDT"],
      },
      {
        key: "chains",
        label: "Chains (SOR across)",
        type: "multi-select",
        options: CHAIN_OPTIONS,
        default: ["ETHEREUM", "ARBITRUM", "BASE", "OPTIMISM"],
      },
      { key: "min_apy_threshold", label: "Min APY Threshold", type: "number", suffix: "%", step: 0.5, default: 3.0 },
    ],
  },

  BASIS_TRADE: {
    fields: [
      {
        key: "basis_coins",
        label: "Basis Coins",
        type: "multi-select",
        options: BASIS_COIN_OPTIONS,
        default: ["ETH", "BTC"],
      },
      {
        key: "perp_venues",
        label: "Perp Venues",
        type: "multi-select",
        options: PERP_VENUE_OPTIONS,
        default: ["HYPERLIQUID", "BINANCE-FUTURES"],
      },
      {
        key: "min_funding_rate",
        label: "Min Funding Rate",
        type: "number",
        suffix: "% / 8h",
        step: 0.001,
        default: 0.005,
      },
      { key: "max_single_venue_pct", label: "Max Single Venue %", type: "number", suffix: "%", step: 5, default: 40 },
      { key: "max_single_coin_pct", label: "Max Single Coin %", type: "number", suffix: "%", step: 5, default: 50 },
    ],
  },

  BTC_BASIS: {
    fields: [
      {
        key: "coins",
        label: "Coins",
        type: "multi-select",
        options: BTC_COIN_OPTIONS,
        default: ["BTC", "WBTC", "cbBTC"],
      },
      {
        key: "perp_venues",
        label: "Perp Venues",
        type: "multi-select",
        options: PERP_VENUE_OPTIONS,
        default: ["BINANCE-FUTURES", "OKX", "BYBIT"],
      },
      {
        key: "min_funding_rate",
        label: "Min Funding Rate",
        type: "number",
        suffix: "% / 8h",
        step: 0.001,
        default: 0.004,
      },
      { key: "max_single_venue_pct", label: "Max Single Venue %", type: "number", suffix: "%", step: 5, default: 50 },
    ],
  },

  SOL_BASIS: {
    fields: [
      { key: "coins", label: "Coins", type: "multi-select", options: SOL_COIN_OPTIONS, default: ["SOL", "mSOL"] },
      {
        key: "perp_venues",
        label: "Perp Venues",
        type: "multi-select",
        options: PERP_VENUE_OPTIONS,
        default: ["DRIFT", "HYPERLIQUID"],
      },
      {
        key: "min_funding_rate",
        label: "Min Funding Rate",
        type: "number",
        suffix: "% / 8h",
        step: 0.001,
        default: 0.006,
      },
      { key: "max_single_venue_pct", label: "Max Single Venue %", type: "number", suffix: "%", step: 5, default: 60 },
    ],
  },

  L2_BASIS: {
    fields: [
      { key: "l2_chain", label: "L2 Chain", type: "dropdown", options: L2_CHAIN_OPTIONS, default: "ARBITRUM" },
      {
        key: "coins",
        label: "Coins",
        type: "multi-select",
        options: BASIS_COIN_OPTIONS,
        default: ["ETH", "ARB", "OP"],
      },
      {
        key: "perp_venues",
        label: "Perp Venues",
        type: "multi-select",
        options: PERP_VENUE_OPTIONS,
        default: ["HYPERLIQUID", "BINANCE-FUTURES"],
      },
      {
        key: "min_funding_rate",
        label: "Min Funding Rate",
        type: "number",
        suffix: "% / 8h",
        step: 0.001,
        default: 0.005,
      },
      { key: "max_single_venue_pct", label: "Max Single Venue %", type: "number", suffix: "%", step: 5, default: 50 },
    ],
  },

  STAKED_BASIS: {
    fields: [
      { key: "lst_token", label: "LST Token", type: "dropdown", options: LST_TOKEN_OPTIONS, default: "weETH" },
      {
        key: "perp_venue",
        label: "Perp Venue",
        type: "dropdown",
        options: PERP_VENUE_SINGLE_OPTIONS,
        default: "HYPERLIQUID",
      },
      {
        key: "max_delta_deviation",
        label: "Max Delta Deviation",
        type: "number",
        suffix: "%",
        step: 0.5,
        default: 2.0,
      },
    ],
  },

  ETHENA_BENCHMARK: {
    fields: [
      { key: "token", label: "Token", type: "dropdown", options: BENCHMARK_TOKEN_OPTIONS, default: "sUSDe" },
      { key: "chain", label: "Chain", type: "dropdown", options: CHAIN_OPTIONS, default: "ETHEREUM" },
      { key: "auto_compound", label: "Auto-Compound", type: "boolean", default: true },
    ],
  },

  RECURSIVE_STAKED_BASIS: {
    fields: [
      { key: "target_leverage", label: "Target Leverage", type: "number", suffix: "x", step: 0.5, default: 3.0 },
      { key: "max_leverage", label: "Max Leverage", type: "number", suffix: "x", step: 0.5, default: 4.5 },
      { key: "min_net_apy", label: "Min Net APY", type: "number", suffix: "%", step: 1, default: 8.0 },
      { key: "hedged", label: "Hedged", type: "boolean", default: true },
      { key: "reward_mode", label: "Reward Mode", type: "dropdown", options: REWARD_MODE_OPTIONS, default: "all" },
      {
        key: "max_depeg_tolerance",
        label: "Max Depeg Tolerance",
        type: "number",
        suffix: "%",
        step: 0.5,
        default: 1.5,
      },
      {
        key: "flash_loan_provider",
        label: "Flash Loan Provider",
        type: "dropdown",
        options: FLASH_LOAN_PROVIDER_OPTIONS,
        default: "MORPHO",
      },
    ],
  },

  UNHEDGED_RECURSIVE: {
    fields: [
      { key: "target_leverage", label: "Target Leverage", type: "number", suffix: "x", step: 0.5, default: 3.5 },
      { key: "max_leverage", label: "Max Leverage", type: "number", suffix: "x", step: 0.5, default: 5.0 },
      { key: "min_net_apy", label: "Min Net APY", type: "number", suffix: "%", step: 1, default: 15.0 },
      { key: "hedged", label: "Hedged", type: "boolean", default: false },
      { key: "reward_mode", label: "Reward Mode", type: "dropdown", options: REWARD_MODE_OPTIONS, default: "all" },
      {
        key: "max_depeg_tolerance",
        label: "Max Depeg Tolerance",
        type: "number",
        suffix: "%",
        step: 0.5,
        default: 2.0,
      },
      {
        key: "flash_loan_provider",
        label: "Flash Loan Provider",
        type: "dropdown",
        options: FLASH_LOAN_PROVIDER_OPTIONS,
        default: "MORPHO",
      },
    ],
  },

  USDT_HEDGED_RECURSIVE: {
    fields: [
      {
        key: "recursive_allocation_pct",
        label: "Recursive Allocation",
        type: "number",
        suffix: "%",
        step: 5,
        default: 50,
      },
      { key: "hedge_allocation_pct", label: "Hedge Allocation", type: "number", suffix: "%", step: 5, default: 50 },
      { key: "target_leverage", label: "Target Leverage", type: "number", suffix: "x", step: 0.5, default: 2.5 },
      { key: "max_leverage", label: "Max Leverage", type: "number", suffix: "x", step: 0.5, default: 3.0 },
      {
        key: "hedge_venues",
        label: "Hedge Venues",
        type: "multi-select",
        options: PERP_VENUE_OPTIONS,
        default: ["HYPERLIQUID", "BINANCE-FUTURES", "OKX"],
      },
      { key: "min_net_apy", label: "Min Net APY", type: "number", suffix: "%", step: 1, default: 12.0 },
      {
        key: "flash_loan_provider",
        label: "Flash Loan Provider",
        type: "dropdown",
        options: FLASH_LOAN_PROVIDER_OPTIONS,
        default: "MORPHO",
      },
    ],
  },

  CROSS_CHAIN_YIELD_ARB: {
    fields: [
      {
        key: "source_chains",
        label: "Source Chains",
        type: "multi-select",
        options: CHAIN_OPTIONS,
        default: ["ETHEREUM", "ARBITRUM"],
      },
      {
        key: "target_chains",
        label: "Target Chains",
        type: "multi-select",
        options: CHAIN_OPTIONS,
        default: ["BASE", "OPTIMISM"],
      },
      { key: "min_spread_bps", label: "Min Spread", type: "number", suffix: "bps", step: 5, default: 50 },
      {
        key: "bridge_provider",
        label: "Bridge Provider",
        type: "dropdown",
        options: BRIDGE_PROVIDER_OPTIONS,
        default: "ACROSS",
      },
    ],
  },

  CROSS_CHAIN_SOR: {
    fields: [
      {
        key: "source_chains",
        label: "Source Chains",
        type: "multi-select",
        options: CHAIN_OPTIONS,
        default: ["ETHEREUM", "ARBITRUM", "BASE"],
      },
      {
        key: "target_chains",
        label: "Target Chains",
        type: "multi-select",
        options: CHAIN_OPTIONS,
        default: ["OPTIMISM", "POLYGON"],
      },
      { key: "min_spread_bps", label: "Min Spread", type: "number", suffix: "bps", step: 5, default: 25 },
      {
        key: "bridge_provider",
        label: "Bridge Provider",
        type: "dropdown",
        options: BRIDGE_PROVIDER_OPTIONS,
        default: "SOCKET",
      },
    ],
  },

  AMM_LP: {
    fields: [
      { key: "pool_pair", label: "Pool Pair", type: "dropdown", options: LP_POOL_OPTIONS, default: "ETH-USDC" },
      { key: "range_width_pct", label: "Range Width", type: "number", suffix: "%", step: 1, default: 10 },
      {
        key: "rebalance_threshold_pct",
        label: "Rebalance Threshold",
        type: "number",
        suffix: "%",
        step: 1,
        default: 5,
      },
      { key: "chain", label: "Chain", type: "dropdown", options: CHAIN_OPTIONS, default: "ETHEREUM" },
    ],
  },

  LIQUIDATION_CAPTURE: {
    fields: [
      {
        key: "target_protocols",
        label: "Target Protocols",
        type: "multi-select",
        options: LIQUIDATION_TARGET_PROTOCOLS,
        default: ["AAVE_V3", "COMPOUND_V3", "MORPHO"],
      },
      { key: "min_bonus_bps", label: "Min Liquidation Bonus", type: "number", suffix: "bps", step: 25, default: 500 },
      {
        key: "min_expected_profit_usd",
        label: "Min Expected Profit",
        type: "number",
        suffix: "USD",
        step: 50,
        default: 500,
      },
      {
        key: "mev_policy",
        label: "MEV Policy",
        type: "dropdown",
        options: MEV_POLICY_OPTIONS,
        default: "FLASHBOTS",
      },
      { key: "max_gas_gwei", label: "Max Gas", type: "number", suffix: "gwei", step: 5, default: 200 },
      {
        key: "flash_loan_provider",
        label: "Flash Loan Provider",
        type: "dropdown",
        options: FLASH_LOAN_PROVIDER_OPTIONS,
        default: "AAVE",
      },
      {
        key: "chains",
        label: "Chains",
        type: "multi-select",
        options: CHAIN_OPTIONS,
        default: ["ETHEREUM", "ARBITRUM", "BASE"],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Strategy family groupings for the dropdown
// ---------------------------------------------------------------------------

export const DEFI_STRATEGY_FAMILIES: StrategyFamilyGroup<DeFiStrategyId>[] = [
  {
    label: "Lending",
    strategies: [
      { id: "AAVE_LENDING", name: "AAVE Lending" },
      { id: "ETH_LENDING", name: "ETH Lending" },
      { id: "MULTICHAIN_LENDING", name: "Multi-Chain Lending" },
    ],
  },
  {
    label: "Basis Trade",
    strategies: [
      { id: "BASIS_TRADE", name: "Multi-Venue Basis Trade" },
      { id: "BTC_BASIS", name: "BTC Basis Trade" },
      { id: "SOL_BASIS", name: "SOL Basis Trade" },
      { id: "L2_BASIS", name: "L2 Basis Trade" },
    ],
  },
  {
    label: "Staking",
    strategies: [
      { id: "STAKED_BASIS", name: "Staked Basis (weETH)" },
      { id: "ETHENA_BENCHMARK", name: "Ethena sUSDe Benchmark" },
    ],
  },
  {
    label: "Recursive",
    strategies: [
      { id: "RECURSIVE_STAKED_BASIS", name: "Recursive Staked Basis (Hedged)" },
      { id: "UNHEDGED_RECURSIVE", name: "Recursive Staked Basis (Unhedged)" },
      { id: "USDT_HEDGED_RECURSIVE", name: "USDT Hedged Recursive" },
    ],
  },
  {
    label: "Cross-Chain",
    strategies: [
      { id: "CROSS_CHAIN_YIELD_ARB", name: "Cross-Chain Yield Arb" },
      { id: "CROSS_CHAIN_SOR", name: "Cross-Chain SOR" },
    ],
  },
  { label: "LP / Market Making", strategies: [{ id: "AMM_LP", name: "AMM LP (Uniswap V3/V4)" }] },
  {
    label: "Liquidation",
    strategies: [{ id: "LIQUIDATION_CAPTURE", name: "Liquidation Capture" }],
  },
];
