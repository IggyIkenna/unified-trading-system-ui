import type { LiquidityPool } from "@/lib/types/defi";

export const LIQUIDITY_POOLS: LiquidityPool[] = [
  {
    name: "ETH/USDC",
    venue_id: "UNISWAPV3-ETHEREUM",
    token0: "ETH",
    token1: "USDC",
    feeTier: 0.05,
    tvl: 485_000_000,
    apr24h: 18.4,
  },
  {
    name: "ETH/USDT",
    venue_id: "UNISWAPV3-ETHEREUM",
    token0: "ETH",
    token1: "USDT",
    feeTier: 0.05,
    tvl: 312_000_000,
    apr24h: 15.2,
  },
  {
    name: "WBTC/ETH",
    venue_id: "UNISWAPV3-ETHEREUM",
    token0: "WBTC",
    token1: "ETH",
    feeTier: 0.3,
    tvl: 198_000_000,
    apr24h: 8.7,
  },
  {
    name: "USDC/USDT",
    venue_id: "CURVE-ETHEREUM",
    token0: "USDC",
    token1: "USDT",
    feeTier: 0.01,
    tvl: 542_000_000,
    apr24h: 4.1,
  },
  {
    name: "ETH/DAI",
    venue_id: "BALANCER-ETHEREUM",
    token0: "ETH",
    token1: "DAI",
    feeTier: 0.3,
    tvl: 87_000_000,
    apr24h: 12.3,
  },
];
