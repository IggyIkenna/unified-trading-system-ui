import type {
  ComplianceInfo,
  DocumentationChecklistItem,
  FeatureStabilityRow,
  ModelDriftInfo,
  RegimePerformanceRow,
  StrategyMetrics,
  WalkForwardWindow,
} from "@/components/promote/types";

/** SR 11-7 documentation rows — shared by compliance UI and mock checklist data. */
export const SR_11_7_ITEMS: { id: string; label: string }[] = [
  { id: "purpose", label: "Model purpose and intended use documented" },
  { id: "assumptions", label: "Assumptions and limitations documented" },
  { id: "lineage", label: "Data sources and lineage documented" },
  { id: "method", label: "Methodology and algorithms documented" },
  { id: "validation", label: "Validation approach and results documented" },
  { id: "benchmarks", label: "Performance benchmarks defined" },
  { id: "monitoring", label: "Ongoing monitoring plan defined" },
  { id: "escalation", label: "Escalation procedures defined" },
  { id: "change", label: "Model change management process defined" },
];

export function buildDocumentationChecklist(mode: "all" | "none" | "partial"): DocumentationChecklistItem[] {
  const base = new Date("2026-02-15T12:00:00Z");
  return SR_11_7_ITEMS.map((item, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() - (SR_11_7_ITEMS.length - i));
    const dateStr = d.toISOString().slice(0, 10);
    if (mode === "all") return { label: item.label, complete: true, lastUpdated: dateStr };
    if (mode === "none") return { label: item.label, complete: false };
    return {
      label: item.label,
      complete: i < 5,
      lastUpdated: i < 5 ? dateStr : undefined,
    };
  });
}

export const STANDARD_REGIMES: RegimePerformanceRow[] = [
  {
    regime: "Bull",
    sharpe: 1.82,
    return: 0.118,
    maxDrawdown: -0.041,
    hitRate: 0.64,
    tradeCount: 412,
    duration: "182d",
  },
  {
    regime: "Bear",
    sharpe: 0.94,
    return: 0.031,
    maxDrawdown: -0.089,
    hitRate: 0.55,
    tradeCount: 198,
    duration: "96d",
  },
  {
    regime: "Sideways / Range",
    sharpe: 1.21,
    return: 0.052,
    maxDrawdown: -0.033,
    hitRate: 0.58,
    tradeCount: 276,
    duration: "140d",
  },
  {
    regime: "Crisis / Shock",
    sharpe: -0.32,
    return: -0.028,
    maxDrawdown: -0.112,
    hitRate: 0.42,
    tradeCount: 54,
    duration: "18d",
  },
  {
    regime: "High Volatility",
    sharpe: 1.05,
    return: 0.044,
    maxDrawdown: -0.067,
    hitRate: 0.52,
    tradeCount: 189,
    duration: "88d",
  },
  {
    regime: "Low Volatility",
    sharpe: 1.45,
    return: 0.069,
    maxDrawdown: -0.022,
    hitRate: 0.61,
    tradeCount: 305,
    duration: "210d",
  },
  {
    regime: "Regime Transition",
    sharpe: 0.71,
    return: 0.019,
    maxDrawdown: -0.051,
    hitRate: 0.49,
    tradeCount: 92,
    duration: "42d",
  },
];

/** Champion-side regime path (scaled from STANDARD_REGIMES for head-to-head). */
export function championRegimes(sharpeFactor: number): RegimePerformanceRow[] {
  return STANDARD_REGIMES.map((r) => ({
    ...r,
    sharpe: r.sharpe * sharpeFactor,
    return: r.return * sharpeFactor * 0.98,
    maxDrawdown: r.maxDrawdown * (sharpeFactor > 1 ? 0.95 : 1.05),
  }));
}

export const STANDARD_WALK_FORWARD: WalkForwardWindow[] = [
  {
    windowId: 1,
    trainStart: "2023-01",
    trainEnd: "2024-06",
    testStart: "2024-07",
    testEnd: "2024-12",
    sharpe: 2.01,
    return: 0.112,
    maxDrawdown: -0.048,
    tStat: 2.34,
    pValue: 0.019,
  },
  {
    windowId: 2,
    trainStart: "2023-07",
    trainEnd: "2025-01",
    testStart: "2025-01",
    testEnd: "2025-06",
    sharpe: 1.87,
    return: 0.098,
    maxDrawdown: -0.055,
    tStat: 2.01,
    pValue: 0.044,
  },
  {
    windowId: 3,
    trainStart: "2024-01",
    trainEnd: "2025-06",
    testStart: "2025-07",
    testEnd: "2025-12",
    sharpe: 1.72,
    return: 0.081,
    maxDrawdown: -0.061,
    tStat: 1.76,
    pValue: 0.078,
  },
  {
    windowId: 4,
    trainStart: "2024-07",
    trainEnd: "2026-01",
    testStart: "2026-01",
    testEnd: "2026-03",
    sharpe: 1.58,
    return: 0.067,
    maxDrawdown: -0.059,
    tStat: 1.52,
    pValue: 0.128,
  },
];

/** Shorter history strategies (~2y effective). */
export const WALK_FORWARD_SHORT: WalkForwardWindow[] = [
  {
    windowId: 1,
    trainStart: "2024-01",
    trainEnd: "2024-09",
    testStart: "2024-10",
    testEnd: "2024-12",
    sharpe: 1.45,
    return: 0.08,
    maxDrawdown: -0.055,
    tStat: 1.62,
    pValue: 0.105,
  },
  {
    windowId: 2,
    trainStart: "2024-04",
    trainEnd: "2025-03",
    testStart: "2025-04",
    testEnd: "2025-09",
    sharpe: 1.28,
    return: 0.062,
    maxDrawdown: -0.072,
    tStat: 1.21,
    pValue: 0.226,
  },
  {
    windowId: 3,
    trainStart: "2024-10",
    trainEnd: "2025-09",
    testStart: "2025-10",
    testEnd: "2026-03",
    sharpe: 1.05,
    return: 0.041,
    maxDrawdown: -0.09,
    tStat: 0.94,
    pValue: 0.345,
  },
];

/** Long-history sleeves (equities / macro-style). */
export const WALK_FORWARD_LONG: WalkForwardWindow[] = [
  {
    windowId: 1,
    trainStart: "2019-01",
    trainEnd: "2020-06",
    testStart: "2020-07",
    testEnd: "2020-12",
    sharpe: 1.92,
    return: 0.102,
    maxDrawdown: -0.062,
    tStat: 2.12,
    pValue: 0.034,
  },
  {
    windowId: 2,
    trainStart: "2019-07",
    trainEnd: "2021-06",
    testStart: "2021-07",
    testEnd: "2021-12",
    sharpe: 1.78,
    return: 0.091,
    maxDrawdown: -0.055,
    tStat: 1.98,
    pValue: 0.048,
  },
  {
    windowId: 3,
    trainStart: "2020-01",
    trainEnd: "2022-06",
    testStart: "2022-07",
    testEnd: "2022-12",
    sharpe: 1.55,
    return: 0.068,
    maxDrawdown: -0.081,
    tStat: 1.64,
    pValue: 0.1,
  },
  {
    windowId: 4,
    trainStart: "2021-01",
    trainEnd: "2023-06",
    testStart: "2023-07",
    testEnd: "2023-12",
    sharpe: 1.48,
    return: 0.059,
    maxDrawdown: -0.07,
    tStat: 1.51,
    pValue: 0.131,
  },
  {
    windowId: 5,
    trainStart: "2022-01",
    trainEnd: "2024-06",
    testStart: "2024-07",
    testEnd: "2024-12",
    sharpe: 1.38,
    return: 0.052,
    maxDrawdown: -0.065,
    tStat: 1.35,
    pValue: 0.177,
  },
  {
    windowId: 6,
    trainStart: "2023-01",
    trainEnd: "2025-06",
    testStart: "2025-07",
    testEnd: "2026-03",
    sharpe: 1.22,
    return: 0.044,
    maxDrawdown: -0.058,
    tStat: 1.12,
    pValue: 0.263,
  },
];

export const STANDARD_FEATURES: FeatureStabilityRow[] = [
  {
    featureName: "funding_imbalance_z",
    importanceAtTraining: 0.142,
    importanceCurrent: 0.138,
    psi: 0.04,
    status: "stable",
  },
  {
    featureName: "basis_roll_slope",
    importanceAtTraining: 0.118,
    importanceCurrent: 0.105,
    psi: 0.11,
    status: "stable",
  },
  {
    featureName: "vol_surface_skew",
    importanceAtTraining: 0.096,
    importanceCurrent: 0.088,
    psi: 0.09,
    status: "stable",
  },
  {
    featureName: "liquidity_depth_ratio",
    importanceAtTraining: 0.081,
    importanceCurrent: 0.072,
    psi: 0.14,
    status: "drifting",
  },
  {
    featureName: "cross_venue_spread",
    importanceAtTraining: 0.074,
    importanceCurrent: 0.069,
    psi: 0.07,
    status: "stable",
  },
  {
    featureName: "open_interest_delta",
    importanceAtTraining: 0.063,
    importanceCurrent: 0.041,
    psi: 0.28,
    status: "drifting",
  },
  {
    featureName: "macro_beta_resid",
    importanceAtTraining: 0.058,
    importanceCurrent: 0.055,
    psi: 0.05,
    status: "stable",
  },
  {
    featureName: "order_flow_imbalance",
    importanceAtTraining: 0.052,
    importanceCurrent: 0.018,
    psi: 0.42,
    status: "dead",
  },
  {
    featureName: "term_structure_curv",
    importanceAtTraining: 0.049,
    importanceCurrent: 0.047,
    psi: 0.04,
    status: "stable",
  },
  {
    featureName: "realized_jump_count",
    importanceAtTraining: 0.045,
    importanceCurrent: 0.044,
    psi: 0.03,
    status: "stable",
  },
];

export const CRYPTO_FEATURES: FeatureStabilityRow[] = [
  {
    featureName: "funding_rate_24h",
    importanceAtTraining: 0.151,
    importanceCurrent: 0.146,
    psi: 0.05,
    status: "stable",
  },
  {
    featureName: "basis_spread_z",
    importanceAtTraining: 0.128,
    importanceCurrent: 0.119,
    psi: 0.09,
    status: "stable",
  },
  {
    featureName: "oi_change_velocity",
    importanceAtTraining: 0.095,
    importanceCurrent: 0.082,
    psi: 0.16,
    status: "drifting",
  },
  {
    featureName: "liquidation_cluster_prox",
    importanceAtTraining: 0.072,
    importanceCurrent: 0.069,
    psi: 0.06,
    status: "stable",
  },
  {
    featureName: "perp_spot_imbalance",
    importanceAtTraining: 0.068,
    importanceCurrent: 0.051,
    psi: 0.22,
    status: "drifting",
  },
  {
    featureName: "vol_regime_flag",
    importanceAtTraining: 0.055,
    importanceCurrent: 0.054,
    psi: 0.03,
    status: "stable",
  },
  {
    featureName: "cex_depth_slope",
    importanceAtTraining: 0.048,
    importanceCurrent: 0.021,
    psi: 0.38,
    status: "dead",
  },
  {
    featureName: "stablecoin_flow_z",
    importanceAtTraining: 0.044,
    importanceCurrent: 0.043,
    psi: 0.04,
    status: "stable",
  },
];

export const SPORTS_FEATURES: FeatureStabilityRow[] = [
  {
    featureName: "elo_delta_7d",
    importanceAtTraining: 0.138,
    importanceCurrent: 0.124,
    psi: 0.12,
    status: "drifting",
  },
  {
    featureName: "injury_impact_score",
    importanceAtTraining: 0.112,
    importanceCurrent: 0.108,
    psi: 0.05,
    status: "stable",
  },
  {
    featureName: "h2h_form_ratio",
    importanceAtTraining: 0.089,
    importanceCurrent: 0.086,
    psi: 0.04,
    status: "stable",
  },
  {
    featureName: "market_overround",
    importanceAtTraining: 0.076,
    importanceCurrent: 0.071,
    psi: 0.08,
    status: "stable",
  },
  {
    featureName: "closing_line_offset",
    importanceAtTraining: 0.064,
    importanceCurrent: 0.058,
    psi: 0.11,
    status: "stable",
  },
  {
    featureName: "pace_adjustment",
    importanceAtTraining: 0.052,
    importanceCurrent: 0.033,
    psi: 0.31,
    status: "drifting",
  },
  {
    featureName: "weather_wind_component",
    importanceAtTraining: 0.041,
    importanceCurrent: 0.04,
    psi: 0.03,
    status: "stable",
  },
];

export const TRADFI_FEATURES: FeatureStabilityRow[] = [
  {
    featureName: "factor_momentum_12m",
    importanceAtTraining: 0.128,
    importanceCurrent: 0.121,
    psi: 0.07,
    status: "stable",
  },
  {
    featureName: "earnings_surprise_z",
    importanceAtTraining: 0.101,
    importanceCurrent: 0.088,
    psi: 0.14,
    status: "drifting",
  },
  {
    featureName: "sector_rotation_score",
    importanceAtTraining: 0.086,
    importanceCurrent: 0.084,
    psi: 0.03,
    status: "stable",
  },
  {
    featureName: "credit_spread_beta",
    importanceAtTraining: 0.074,
    importanceCurrent: 0.072,
    psi: 0.04,
    status: "stable",
  },
  {
    featureName: "fx_carry_residual",
    importanceAtTraining: 0.062,
    importanceCurrent: 0.045,
    psi: 0.24,
    status: "drifting",
  },
  {
    featureName: "rates_curve_slope",
    importanceAtTraining: 0.055,
    importanceCurrent: 0.054,
    psi: 0.02,
    status: "stable",
  },
  {
    featureName: "liquidity_amihud",
    importanceAtTraining: 0.048,
    importanceCurrent: 0.019,
    psi: 0.41,
    status: "dead",
  },
];

/** Pre-addition book max correlation (portfolio SSOT mock). */
export const PORTFOLIO_PRE_ADD_MAX_CORRELATION = 0.58;

/** Historical governance approvals in last 30d not represented in current pipeline snapshot. */
export const HISTORICAL_APPROVALS_30D = 2;

export const STANDARD_DRIFT: ModelDriftInfo = {
  icCurrent: 0.038,
  icAtTraining: 0.045,
  signalHalfLifeDays: 94,
  hitRateTrend: "stable",
  autoCorrelation: 0.08,
};

export function compliance(
  tier: 1 | 2 | 3,
  owner: string,
  classification: string,
  overrides?: Partial<ComplianceInfo>,
): ComplianceInfo {
  return {
    modelTier: tier,
    modelOwner: owner,
    lastValidationDate: "2026-02-15",
    nextValidationDate: "2026-08-15",
    regulatoryClassification: classification,
    documentationComplete: true,
    mrcReviewed: tier <= 2,
    fcaNotified: false,
    sec17a4Compliant: true,
    finra4512Compliant: true,
    riskMaterialityScore: tier === 1 ? 88 : tier === 2 ? 62 : 38,
    ...overrides,
  };
}

export const CHAMPION_BTC_V2: {
  id: string;
  name: string;
  version: string;
  metrics: StrategyMetrics;
  deployedSince: string;
  capitalDeployed: number;
} = {
  id: "strat-champ-btc-fund",
  name: "BTC Funding Arb",
  version: "2.4.0",
  deployedSince: "2024-06-01",
  capitalDeployed: 18_000_000,
  metrics: {
    sharpe: 2.01,
    sortino: 2.88,
    maxDrawdown: -0.072,
    totalReturn: 0.368,
    hitRate: 0.71,
    profitFactor: 2.55,
    calmar: 5.12,
    avgTrade: 380,
    winLossRatio: 2.0,
    dailyVaR: -0.019,
    cvar: -0.034,
    tailRatio: 1.35,
  },
};

export const CHAMPION_MM_V1: typeof CHAMPION_BTC_V2 = {
  id: "strat-champ-mm",
  name: "Cross-Exchange MM",
  version: "1.2.0",
  deployedSince: "2023-11-10",
  capitalDeployed: 32_000_000,
  metrics: {
    sharpe: 2.89,
    sortino: 3.95,
    maxDrawdown: -0.048,
    totalReturn: 0.492,
    hitRate: 0.79,
    profitFactor: 3.2,
    calmar: 10.25,
    avgTrade: 92,
    winLossRatio: 2.65,
    dailyVaR: -0.011,
    cvar: -0.02,
    tailRatio: 1.62,
  },
};

export const CHAMPION_MOM_V1: typeof CHAMPION_BTC_V2 = {
  id: "strat-champ-mom",
  name: "Equity Momentum",
  version: "1.0.0",
  deployedSince: "2025-01-08",
  capitalDeployed: 12_000_000,
  metrics: {
    sharpe: 1.62,
    sortino: 2.1,
    maxDrawdown: -0.112,
    totalReturn: 0.221,
    hitRate: 0.58,
    profitFactor: 1.85,
    calmar: 1.97,
    avgTrade: 2400,
    winLossRatio: 1.45,
    dailyVaR: -0.022,
    cvar: -0.038,
    tailRatio: 1.08,
  },
};

export const CHAMPION_EPL_V1: typeof CHAMPION_BTC_V2 = {
  id: "strat-champ-epl",
  name: "EPL Rule-Based",
  version: "1.0.0",
  deployedSince: "2025-08-01",
  capitalDeployed: 2_500_000,
  metrics: {
    sharpe: 1.21,
    sortino: 1.65,
    maxDrawdown: -0.095,
    totalReturn: 0.156,
    hitRate: 0.54,
    profitFactor: 1.72,
    calmar: 1.64,
    avgTrade: 450,
    winLossRatio: 1.32,
    dailyVaR: -0.028,
    cvar: -0.045,
    tailRatio: 0.98,
  },
};

export const CHAMPION_ETH_VOL_V2: typeof CHAMPION_BTC_V2 = {
  id: "strat-champ-eth-vol",
  name: "ETH Volatility Arb",
  version: "2.1.0",
  deployedSince: "2025-04-20",
  capitalDeployed: 8_000_000,
  metrics: {
    sharpe: 1.95,
    sortino: 2.55,
    maxDrawdown: -0.081,
    totalReturn: 0.298,
    hitRate: 0.66,
    profitFactor: 2.15,
    calmar: 3.68,
    avgTrade: 620,
    winLossRatio: 1.92,
    dailyVaR: -0.021,
    cvar: -0.036,
    tailRatio: 1.22,
  },
};
