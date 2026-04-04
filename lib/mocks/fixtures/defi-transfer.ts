import type { BridgeRouteQuote, ChainPortfolio } from "@/lib/types/defi";

export const DEFI_CHAINS = [
  "ETHEREUM", "ARBITRUM", "OPTIMISM", "BASE", "POLYGON",
  "BSC", "AVALANCHE", "SCROLL", "LINEA", "ZKSYNC",
  "SOLANA",
] as const;

export const DEFI_TOKENS = ["ETH", "USDC", "USDT", "WETH", "WBTC", "DAI"] as const;

export const BRIDGE_PROTOCOLS = ["Auto (best rate)", "Across", "Stargate", "Hop", "CCTP"] as const;

export const MOCK_TOKEN_BALANCES: Record<string, number> = {
  ETH: 12.45,
  USDC: 34_520,
  USDT: 18_200,
  WETH: 5.2,
  WBTC: 0.85,
  DAI: 12_100,
};

/** Mock bridge route quotes for route comparison display. */
export function getMockBridgeRoutes(
  token: string,
  amount: number,
  _fromChain: string,
  _toChain: string,
): BridgeRouteQuote[] {
  if (amount <= 0) return [];
  return [
    {
      protocol: "Across",
      feePct: 0.04,
      feeUsd: amount * 0.0004,
      estimatedTimeMin: 2,
      outputAmount: amount * 0.9996,
      isBestReturn: true,
      isFastest: true,
    },
    {
      protocol: "Stargate",
      feePct: 0.06,
      feeUsd: amount * 0.0006,
      estimatedTimeMin: 5,
      outputAmount: amount * 0.9994,
      isBestReturn: false,
      isFastest: false,
    },
    {
      protocol: "CCTP",
      feePct: 0.0,
      feeUsd: 0,
      estimatedTimeMin: 15,
      outputAmount: amount,
      isBestReturn: false,
      isFastest: false,
    },
    {
      protocol: "Hop",
      feePct: 0.08,
      feeUsd: amount * 0.0008,
      estimatedTimeMin: 8,
      outputAmount: amount * 0.9992,
      isBestReturn: false,
      isFastest: false,
    },
  ];
}

/** Mock per-chain portfolio for wallet summary. */
export const MOCK_CHAIN_PORTFOLIOS: ChainPortfolio[] = [
  {
    chain: "ETHEREUM",
    totalUsd: 125_400,
    tokenBreakdown: { ETH: 8.2, USDC: 22_000, WBTC: 0.85, DAI: 12_100 },
    gasTokenBalance: 8.2,
    gasTokenSymbol: "ETH",
  },
  {
    chain: "ARBITRUM",
    totalUsd: 42_300,
    tokenBreakdown: { ETH: 2.5, USDC: 8_500, USDT: 12_000 },
    gasTokenBalance: 2.5,
    gasTokenSymbol: "ETH",
  },
  {
    chain: "BASE",
    totalUsd: 18_700,
    tokenBreakdown: { ETH: 1.2, USDC: 4_020, WETH: 3.0 },
    gasTokenBalance: 1.2,
    gasTokenSymbol: "ETH",
  },
  {
    chain: "OPTIMISM",
    totalUsd: 8_200,
    tokenBreakdown: { ETH: 0.5, USDT: 6_200 },
    gasTokenBalance: 0.5,
    gasTokenSymbol: "ETH",
  },
  {
    chain: "POLYGON",
    totalUsd: 3_100,
    tokenBreakdown: { USDC: 3_100 },
    gasTokenBalance: 45.2,
    gasTokenSymbol: "MATIC",
  },
  {
    chain: "BSC",
    totalUsd: 1_200,
    tokenBreakdown: { USDT: 1_200 },
    gasTokenBalance: 0.15,
    gasTokenSymbol: "BNB",
  },
  {
    chain: "SOLANA",
    totalUsd: 15_800,
    tokenBreakdown: { SOL: 85.5, USDC: 2_300, mSOL: 12.0 },
    gasTokenBalance: 85.5,
    gasTokenSymbol: "SOL",
  },
];

/** Gas token minimum thresholds (below = insufficient warning). */
export const GAS_TOKEN_MIN_THRESHOLDS: Record<string, number> = {
  ETH: 0.01,
  MATIC: 1.0,
  BNB: 0.005,
  AVAX: 0.1,
  SOL: 0.05,
};
