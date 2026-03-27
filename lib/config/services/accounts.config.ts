/** CeFi venues available for transfers and balance UI. */
export const CEFI_VENUES = ["Binance", "OKX", "Deribit", "Bybit", "Hyperliquid"] as const;

export type CefiVenue = (typeof CEFI_VENUES)[number];

export const SUB_ACCOUNT_VENUES = ["Binance", "OKX", "Bybit"] as const;

export const TRANSFER_ASSETS = ["USDC", "BTC", "ETH", "SOL"] as const;

export const NETWORKS = ["Ethereum", "Arbitrum", "Optimism", "Base", "Polygon"] as const;

export const SUB_ACCOUNTS = ["Trading-1", "Trading-2", "MM-Alpha", "Arb-Beta"] as const;
