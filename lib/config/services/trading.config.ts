/**
 * Canonical operation types for trading UIs (instructions, bundles workspace, DeFi).
 * Filter UIs add an implicit "All" via FilterBar — do not include a sentinel here.
 */
export const TRADING_OPERATION_TYPES = [
  "TRADE",
  "SWAP",
  "FLASH_BORROW",
  "FLASH_REPAY",
  "STAKE",
  "UNSTAKE",
  "LEND",
  "BORROW",
  "WITHDRAW",
  "REPAY",
  "ADD_LIQUIDITY",
  "REMOVE_LIQUIDITY",
  "COLLECT_FEES",
  "BET",
  "CANCEL_BET",
  "SPORTS_EXCHANGE",
  "OPTIONS_COMBO",
  "FUTURES_ROLL",
  "PREDICTION_BET",
  "SPORTS_BET",
  "SPORTS_EXCHANGE_ORDER",
  "TRANSFER",
] as const;

export type TradingOperationType = (typeof TRADING_OPERATION_TYPES)[number];

/** Reference data for book trade (venues, categories, algos). */
export type BookCategoryTab = "cefi_spot" | "cefi_derivatives" | "defi" | "tradfi" | "sports" | "prediction" | "otc";

export type BookAlgoType = "MARKET" | "TWAP" | "VWAP" | "ICEBERG" | "SOR" | "BEST_PRICE" | "BENCHMARK_FILL";

export const BOOK_VENUES_BY_CATEGORY: Record<BookCategoryTab, string[]> = {
  cefi_spot: ["Binance", "Coinbase", "OKX", "Bybit", "Gemini"],
  cefi_derivatives: ["Deribit", "OKX", "Bybit", "Binance", "BitMEX"],
  defi: ["Uniswap", "Aave", "Hyperliquid", "SushiSwap", "Curve"],
  tradfi: ["NYSE", "NASDAQ", "LSE", "CME", "ICE", "Eurex"],
  sports: ["Betfair", "Smarkets", "Pinnacle"],
  prediction: ["Polymarket", "Kalshi"],
  otc: ["OTC Desk", "Jane Street", "Jump Trading", "Wintermute", "DRW", "Cumberland", "Galaxy Digital"],
};

export const BOOK_CATEGORY_LABELS: Record<BookCategoryTab, string> = {
  cefi_spot: "CeFi Spot",
  cefi_derivatives: "CeFi Derivatives",
  defi: "DeFi",
  tradfi: "TradFi",
  sports: "Sports",
  prediction: "Prediction",
  otc: "OTC / Bilateral",
};

export const BOOK_ALGO_OPTIONS: BookAlgoType[] = [
  "MARKET",
  "TWAP",
  "VWAP",
  "ICEBERG",
  "SOR",
  "BEST_PRICE",
  "BENCHMARK_FILL",
];
