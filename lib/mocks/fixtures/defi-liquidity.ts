import type { LiquidityPool } from "@/lib/types/defi";

export const LIQUIDITY_POOLS: LiquidityPool[] = [
  {
    name: "ETH/USDC",
    token0: "ETH",
    token1: "USDC",
    feeTier: 0.05,
    tvl: 485_000_000,
    apr24h: 18.4,
  },
  {
    name: "ETH/USDT",
    token0: "ETH",
    token1: "USDT",
    feeTier: 0.05,
    tvl: 312_000_000,
    apr24h: 15.2,
  },
  {
    name: "WBTC/ETH",
    token0: "WBTC",
    token1: "ETH",
    feeTier: 0.3,
    tvl: 198_000_000,
    apr24h: 8.7,
  },
  {
    name: "USDC/USDT",
    token0: "USDC",
    token1: "USDT",
    feeTier: 0.01,
    tvl: 542_000_000,
    apr24h: 4.1,
  },
  {
    name: "ETH/DAI",
    token0: "ETH",
    token1: "DAI",
    feeTier: 0.3,
    tvl: 87_000_000,
    apr24h: 12.3,
  },
];
