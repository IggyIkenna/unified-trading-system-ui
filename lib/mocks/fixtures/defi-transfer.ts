export const DEFI_CHAINS = ["Ethereum", "Arbitrum", "Optimism", "Base", "Polygon"] as const;

export const DEFI_TOKENS = ["ETH", "USDC", "USDT", "WETH", "WBTC", "DAI"] as const;

export const BRIDGE_PROTOCOLS = ["Auto (best rate)", "Across", "Stargate", "Hop"] as const;

export const MOCK_TOKEN_BALANCES: Record<string, number> = {
  ETH: 12.45,
  USDC: 34_520,
  USDT: 18_200,
  WETH: 5.2,
  WBTC: 0.85,
  DAI: 12_100,
};
