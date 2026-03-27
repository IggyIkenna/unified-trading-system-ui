/** DeFi reference data (fee tiers, flash operation types, venues). */

export const DEFI_FEE_TIERS = [
  { value: "0.01", label: "0.01%", description: "Stable pairs" },
  { value: "0.05", label: "0.05%", description: "Standard" },
  { value: "0.3", label: "0.30%", description: "Most pairs" },
  { value: "1", label: "1.00%", description: "Exotic pairs" },
] as const;

export const FLASH_OPERATION_TYPES = [
  "SWAP",
  "LEND",
  "BORROW",
  "REPAY",
  "WITHDRAW",
  "ADD_LIQUIDITY",
  "REMOVE_LIQUIDITY",
  "TRADE",
  "TRANSFER",
] as const;

export const FLASH_VENUES = ["Uniswap", "Curve", "Aave", "Sushiswap", "Balancer"] as const;
