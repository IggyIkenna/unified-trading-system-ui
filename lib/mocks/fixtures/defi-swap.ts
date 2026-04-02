import type { SwapRoute } from "@/lib/types/defi";

export const SWAP_TOKENS = [
  "ETH",
  "USDC",
  "USDT",
  "DAI",
  "weETH",
  "WBTC",
  "LINK",
  "UNI",
  "AAVE",
  "CRV",
  "LDO",
] as const;

export type SwapToken = (typeof SWAP_TOKENS)[number];

export const MOCK_SWAP_ROUTE: SwapRoute = {
  path: ["ETH", "USDC"],
  pools: ["UniswapV3 ETH/USDC 0.05%"],
  priceImpactPct: 0.03,
  expectedOutput: 3456.12,
  gasEstimateEth: 0.0042,
  gasEstimateUsd: 14.52,
  algo_type: "SOR_DEX",
};
