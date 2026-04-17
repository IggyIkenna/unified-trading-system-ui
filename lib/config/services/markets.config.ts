export const CRYPTO_VENUES = ["Binance", "Coinbase", "OKX", "Bybit"] as const;
export const TRADFI_VENUES = ["NYSE", "NASDAQ", "CBOE", "IEX", "BATS"] as const;
export const DEFI_VENUES = ["Uniswap", "Curve", "Balancer", "SushiSwap", "1inch"] as const;

export type MarketsAssetClass = "crypto" | "tradfi" | "defi";
