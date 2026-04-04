// Default validation results used when API returns no data
export const DEFAULT_VALIDATION_RESULTS = {
  champion: {
    modelId: "funding-pred-v2.3.1",
    name: "Funding Rate Predictor",
    version: "2.3.1",
    stage: "CHAMPION",
    metrics: {
      sharpe: 2.41,
      accuracy: 0.847,
      precision: 0.823,
      recall: 0.871,
      f1: 0.846,
      auc: 0.912,
      maxDrawdown: -0.034,
      calmarRatio: 1.82,
      informationRatio: 1.94,
    },
    validationDate: "2026-03-15",
    dataWindow: "2025-09-01 to 2026-03-01",
    samples: 45200,
  },
  challenger: {
    modelId: "funding-pred-v2.4.0-rc1",
    name: "Funding Rate Predictor",
    version: "2.4.0-rc1",
    stage: "CHALLENGER",
    metrics: {
      sharpe: 2.58,
      accuracy: 0.862,
      precision: 0.841,
      recall: 0.883,
      f1: 0.862,
      auc: 0.928,
      maxDrawdown: -0.029,
      calmarRatio: 2.14,
      informationRatio: 2.12,
    },
    validationDate: "2026-03-17",
    dataWindow: "2025-09-01 to 2026-03-01",
    samples: 45200,
  },
};

// Default regime performance breakdown
export const DEFAULT_REGIME_PERFORMANCE = [
  {
    regime: "Low Vol",
    championSharpe: 2.8,
    challengerSharpe: 3.1,
    samples: 12400,
    description: "VIX < 15",
  },
  {
    regime: "Normal",
    championSharpe: 2.4,
    challengerSharpe: 2.6,
    samples: 24100,
    description: "15 ≤ VIX < 25",
  },
  {
    regime: "High Vol",
    championSharpe: 1.9,
    challengerSharpe: 2.2,
    samples: 6800,
    description: "VIX ≥ 25",
  },
  {
    regime: "Trending",
    championSharpe: 2.6,
    challengerSharpe: 2.9,
    samples: 15200,
    description: "ADX > 25",
  },
  {
    regime: "Ranging",
    championSharpe: 2.1,
    challengerSharpe: 2.3,
    samples: 18900,
    description: "ADX ≤ 25",
  },
];

// Default walk-forward validation windows
export const DEFAULT_WALK_FORWARD_RESULTS = [
  {
    window: "W1",
    trainStart: "2025-03",
    trainEnd: "2025-06",
    testStart: "2025-07",
    testEnd: "2025-08",
    champSharpe: 2.31,
    challSharpe: 2.48,
    champAcc: 0.841,
    challAcc: 0.858,
  },
  {
    window: "W2",
    trainStart: "2025-05",
    trainEnd: "2025-08",
    testStart: "2025-09",
    testEnd: "2025-10",
    champSharpe: 2.45,
    challSharpe: 2.62,
    champAcc: 0.852,
    challAcc: 0.867,
  },
  {
    window: "W3",
    trainStart: "2025-07",
    trainEnd: "2025-10",
    testStart: "2025-11",
    testEnd: "2025-12",
    champSharpe: 2.38,
    challSharpe: 2.51,
    champAcc: 0.844,
    challAcc: 0.859,
  },
  {
    window: "W4",
    trainStart: "2025-09",
    trainEnd: "2025-12",
    testStart: "2026-01",
    testEnd: "2026-02",
    champSharpe: 2.52,
    challSharpe: 2.71,
    champAcc: 0.856,
    challAcc: 0.871,
  },
  {
    window: "W5",
    trainStart: "2025-11",
    trainEnd: "2026-02",
    testStart: "2026-03",
    testEnd: "2026-03",
    champSharpe: 2.44,
    challSharpe: 2.59,
    champAcc: 0.848,
    challAcc: 0.864,
  },
];

// Default statistical tests
export const DEFAULT_STATISTICAL_TESTS = [
  {
    test: "Paired t-test (Sharpe)",
    statistic: 3.42,
    pValue: 0.0012,
    significant: true,
    conclusion: "Challenger significantly better",
  },
  {
    test: "Diebold-Mariano",
    statistic: 2.87,
    pValue: 0.0041,
    significant: true,
    conclusion: "Challenger forecasts are superior",
  },
  {
    test: "Model Confidence Set",
    statistic: "N/A",
    pValue: 0.018,
    significant: true,
    conclusion: "Challenger in MCS, Champion excluded",
  },
  {
    test: "Bootstrap Sharpe Diff",
    statistic: "0.17 [0.08, 0.26]",
    pValue: 0.0023,
    significant: true,
    conclusion: "95% CI excludes zero",
  },
  {
    test: "Kolmogorov-Smirnov",
    statistic: 0.089,
    pValue: 0.142,
    significant: false,
    conclusion: "Return distributions similar",
  },
];

// Default feature importance comparison
export const DEFAULT_FEATURE_IMPORTANCE = [
  { feature: "funding_rate_8h", champion: 0.23, challenger: 0.21 },
  { feature: "oi_change_1h", champion: 0.18, challenger: 0.22 },
  { feature: "volume_imbalance", champion: 0.15, challenger: 0.16 },
  { feature: "basis_spread", champion: 0.14, challenger: 0.12 },
  { feature: "liquidation_ratio", champion: 0.11, challenger: 0.14 },
  { feature: "spot_perp_spread", champion: 0.1, challenger: 0.09 },
  { feature: "whale_flow", champion: 0.09, challenger: 0.06 },
];
