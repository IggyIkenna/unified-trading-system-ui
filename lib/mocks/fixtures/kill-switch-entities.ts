export const MOCK_ENTITIES = {
  firms: [
    { id: "odum", name: "Odum Research" },
    { id: "alpha", name: "Alpha Capital" },
  ],
  clients: [
    { id: "apex-capital", name: "Apex Capital" },
    { id: "meridian", name: "Meridian Fund" },
    { id: "quantedge", name: "QuantEdge HK" },
  ],
  strategies: [
    { id: "DEFI_ETH_BASIS_HUF_1H", name: "ETH Basis Trade" },
    { id: "CEFI_BTC_MM_EVT_TICK", name: "BTC Market Making" },
    { id: "CEFI_ETH_OPT_MM_EVT_TICK", name: "ETH Options MM" },
  ],
  venues: [
    { id: "BINANCE-SPOT", name: "BINANCE-SPOT" },
    { id: "OKX-SPOT", name: "OKX-SPOT" },
    { id: "DERIBIT", name: "DERIBIT" },
    { id: "HYPERLIQUID", name: "HYPERLIQUID" },
    { id: "AAVEV3-ETHEREUM", name: "AAVEV3-ETHEREUM" },
  ],
  instruments: [
    { id: "btc-usdt", name: "BTC/USDT" },
    { id: "eth-usdt", name: "ETH/USDT" },
    { id: "eth-perp", name: "ETH-PERP" },
  ],
} as const;
