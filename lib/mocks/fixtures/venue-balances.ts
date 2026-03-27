/**
 * Legacy per-venue per-asset demo map (archived).
 * Transfer panel availability is derived from `useBalances()` at runtime.
 */
export const MOCK_VENUE_ASSET_BALANCES: Record<string, Record<string, number>> = {
  Binance: { USDC: 125_400, BTC: 3.2, ETH: 45.8, SOL: 312 },
  OKX: { USDC: 89_200, BTC: 1.8, ETH: 22.1, SOL: 150 },
  Deribit: { USDC: 45_000, BTC: 2.1, ETH: 15.0, SOL: 0 },
  Bybit: { USDC: 67_800, BTC: 0.9, ETH: 31.5, SOL: 85 },
  Hyperliquid: { USDC: 34_500, BTC: 0, ETH: 10.2, SOL: 0 },
};
