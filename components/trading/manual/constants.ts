export const VENUES = [
  "Binance",
  "Deribit",
  "Hyperliquid",
  "Coinbase",
  "OKX",
  "Bybit",
  "Uniswap",
  "Aave",
  "Betfair",
  "Polymarket",
  "Kalshi",
] as const;

export const ALGOS = ["MARKET", "TWAP", "VWAP", "ICEBERG", "SOR", "BEST_PRICE", "BENCHMARK_FILL"] as const;

export const DEFAULT_QUOTE_INSTRUMENTS = [
  {
    symbol: "BTC/USDT",
    venue: "Binance",
    bidPrice: 67250.0,
    askPrice: 67280.0,
    bidSize: 0.5,
    askSize: 0.5,
  },
  {
    symbol: "ETH/USDT",
    venue: "Binance",
    bidPrice: 3420.5,
    askPrice: 3422.8,
    bidSize: 5.0,
    askSize: 5.0,
  },
  {
    symbol: "SOL/USDT",
    venue: "OKX",
    bidPrice: 142.3,
    askPrice: 142.55,
    bidSize: 50.0,
    askSize: 50.0,
  },
  {
    symbol: "BTC/USDT",
    venue: "OKX",
    bidPrice: 67248.0,
    askPrice: 67282.0,
    bidSize: 0.25,
    askSize: 0.25,
  },
  {
    symbol: "ETH/USDT",
    venue: "OKX",
    bidPrice: 3419.8,
    askPrice: 3423.1,
    bidSize: 10.0,
    askSize: 10.0,
  },
] as const;
