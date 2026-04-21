// Testing stage colors (reserved for testing pipeline UI)
export const STAGE_COLORS: Record<string, string> = {
  done: "var(--status-live)",
  pending: "var(--status-warning)",
  blocked: "var(--status-error)",
};

// Model-Strategy linkage map (keyed on v2 slot labels)
export const MODEL_STRATEGY_MAP: Record<string, { modelId: string; modelName: string; version: string }> = {
  "ML_DIRECTIONAL_CONTINUOUS@binance-btc-usdt-5m-usdt-prod": {
    modelId: "momentum-btc-xgb",
    modelName: "BTC Momentum XGBoost",
    version: "v3.2",
  },
  "ML_DIRECTIONAL_CONTINUOUS@hyperliquid-eth-perp-5m-usdt-v2-prod": {
    modelId: "momentum-eth-xgb",
    modelName: "ETH Momentum XGBoost",
    version: "v2.1",
  },
  "ML_DIRECTIONAL_CONTINUOUS@uniswap-ethereum-weth-usdc-5m-usdc-prod": {
    modelId: "defi-signal-lstm",
    modelName: "DeFi Signal LSTM",
    version: "v1.8",
  },
  "ML_DIRECTIONAL_EVENT_SETTLED@unity-epl-1x2-usd-prod": {
    modelId: "sports-edge-gb",
    modelName: "Sports Edge GradientBoost",
    version: "v4.0",
  },
};
