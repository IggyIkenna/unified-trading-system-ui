// Testing stage colors (reserved for testing pipeline UI)
export const STAGE_COLORS: Record<string, string> = {
  done: "var(--status-live)",
  pending: "var(--status-warning)",
  blocked: "var(--status-error)",
};

// Model-Strategy linkage map
export const MODEL_STRATEGY_MAP: Record<string, { modelId: string; modelName: string; version: string }> = {
  CEFI_BTC_ML_DIR_HUF_4H: {
    modelId: "momentum-btc-xgb",
    modelName: "BTC Momentum XGBoost",
    version: "v3.2",
  },
  CEFI_ETH_ML_DIR_HUF_4H: {
    modelId: "momentum-eth-xgb",
    modelName: "ETH Momentum XGBoost",
    version: "v2.1",
  },
  DEFI_ETH_ML_DIR_SCE_1H: {
    modelId: "defi-signal-lstm",
    modelName: "DeFi Signal LSTM",
    version: "v1.8",
  },
  SPORTS_FOOTBALL_ML_ARB: {
    modelId: "sports-edge-gb",
    modelName: "Sports Edge GradientBoost",
    version: "v4.0",
  },
};
