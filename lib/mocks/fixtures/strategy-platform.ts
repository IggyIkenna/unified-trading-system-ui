// =============================================================================
// Strategy Research Platform Mock Data
// Realistic seeded data for institutional strategy research workspace
// =============================================================================

import {
  StrategyTemplate,
  StrategyConfig,
  BacktestRun,
  BacktestMetrics,
  ResultSlice,
  BatchLiveComparison,
  StrategyCandidate,
  StrategyAlert,
  StrategyArchetype,
  AssetClass,
  TestingStage,
  StrategySignal,
  SignalQualityMetrics,
  SignalOverlapMetrics,
} from "@/lib/types/strategy-platform";
import { generateBacktestAnalytics } from "@/lib/mocks/fixtures/backtest-analytics";
import type { BacktestAnalytics } from "@/lib/types/backtest-analytics";

// =============================================================================
// Strategy Templates
// =============================================================================

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: "tpl-eth-basis",
    name: "ETH Basis Trade",
    description: "Captures funding rate differential between spot and perpetual futures",
    archetype: "BASIS_TRADE",
    assetClasses: ["CeFi", "DeFi"],
    signals: ["funding_rate", "basis_spread", "liquidity_score"],
    riskTypes: ["delta", "funding", "basis", "liquidity"],
    venues: ["BINANCE", "OKX", "DERIBIT", "HYPERLIQUID"],
    instruments: ["ETH-PERP", "ETH-USDT", "ETH-USD-PERP"],
    createdAt: "2024-06-15T10:00:00Z",
    createdBy: "quant_team",
    version: "3.2.1",
    linkedModels: ["mdl-funding-pred", "mdl-basis-timing"],
  },
  {
    id: "tpl-btc-mm",
    name: "BTC Market Making",
    description: "Provides liquidity on BTC perpetual markets with inventory management",
    archetype: "MARKET_MAKING",
    assetClasses: ["CeFi"],
    signals: ["order_imbalance", "volatility_regime", "spread_pred"],
    riskTypes: ["delta", "gamma", "inventory", "adverse_selection"],
    venues: ["BINANCE", "OKX", "BYBIT"],
    instruments: ["BTC-PERP", "BTC-USDT-PERP"],
    createdAt: "2024-03-20T14:30:00Z",
    createdBy: "mm_team",
    version: "4.1.0",
    linkedModels: ["mdl-spread-opt", "mdl-inv-mgmt"],
  },
  {
    id: "tpl-stat-arb",
    name: "Cross-Exchange Statistical Arb",
    description: "Exploits mean-reversion in price differentials across exchanges",
    archetype: "STATISTICAL_ARB",
    assetClasses: ["CeFi"],
    signals: ["price_deviation", "cointegration_score", "execution_prob"],
    riskTypes: ["execution", "latency", "correlation"],
    venues: ["BINANCE", "OKX", "BYBIT", "COINBASE"],
    instruments: ["BTC-USDT", "ETH-USDT", "SOL-USDT"],
    createdAt: "2024-01-10T08:00:00Z",
    createdBy: "arb_team",
    version: "2.5.3",
    linkedModels: ["mdl-coint-detector"],
  },
  {
    id: "tpl-options-mm",
    name: "ETH Options Market Making",
    description: "Delta-neutral options market making with volatility surface management",
    archetype: "OPTIONS",
    assetClasses: ["CeFi"],
    signals: ["iv_surface", "skew_signal", "vol_regime"],
    riskTypes: ["delta", "gamma", "vega", "theta", "volga", "vanna"],
    venues: ["DERIBIT"],
    instruments: ["ETH-OPTIONS"],
    createdAt: "2024-05-01T11:00:00Z",
    createdBy: "vol_team",
    version: "1.8.2",
    linkedModels: ["mdl-vol-surface", "mdl-greeks-pred"],
  },
  {
    id: "tpl-momentum",
    name: "Multi-Asset Momentum",
    description: "Trend-following strategy across crypto and tradfi futures",
    archetype: "DIRECTIONAL",
    assetClasses: ["CeFi", "TradFi"],
    signals: ["trend_strength", "momentum_score", "regime_indicator"],
    riskTypes: ["delta", "drawdown", "correlation"],
    venues: ["BINANCE", "CME", "ICE"],
    instruments: ["BTC-PERP", "ETH-PERP", "ES-FUT", "CL-FUT"],
    createdAt: "2024-02-15T09:00:00Z",
    createdBy: "macro_team",
    version: "3.0.1",
    linkedModels: ["mdl-trend-ml", "mdl-regime-class"],
  },
  {
    id: "tpl-aave-yield",
    name: "Aave Yield Optimizer",
    description: "Dynamic lending/borrowing optimization across Aave markets",
    archetype: "YIELD",
    assetClasses: ["DeFi"],
    signals: ["utilization_rate", "yield_spread", "liquidation_risk"],
    riskTypes: ["protocol_risk", "liquidity", "interest_rate"],
    venues: ["AAVE_V3"],
    instruments: ["USDC-AAVE", "ETH-AAVE", "WBTC-AAVE"],
    createdAt: "2024-04-10T16:00:00Z",
    createdBy: "defi_team",
    version: "2.2.0",
    linkedModels: ["mdl-util-pred", "mdl-rate-forecast"],
  },
  {
    id: "tpl-football-arb",
    name: "Football Odds Arbitrage",
    description: "Cross-book arbitrage on football match outcomes",
    archetype: "ARBITRAGE",
    assetClasses: ["Sports"],
    signals: ["odds_deviation", "market_efficiency", "liquidity_score"],
    riskTypes: ["execution", "odds_movement", "book_limits"],
    venues: ["BETFAIR", "PINNACLE", "BET365"],
    instruments: ["FOOTBALL-MATCH"],
    createdAt: "2024-07-01T12:00:00Z",
    createdBy: "sports_team",
    version: "1.5.0",
    linkedModels: ["mdl-odds-fair-value"],
  },
];

// =============================================================================
// Strategy Configs (multiple versions per template)
// =============================================================================

export const STRATEGY_CONFIGS: StrategyConfig[] = [
  // ETH Basis configs
  {
    id: "cfg-eth-basis-v1",
    templateId: "tpl-eth-basis",
    templateName: "ETH Basis Trade",
    version: "1.0.0",
    name: "ETH Basis Conservative",
    description: "Conservative parameters with lower leverage",
    archetype: "BASIS_TRADE",
    assetClass: "CeFi",
    parameters: {
      entry_threshold: 0.05,
      exit_threshold: 0.02,
      max_leverage: 2.0,
      rebalance_interval: "1h",
      funding_weight: 0.7,
    },
    riskLimits: {
      maxPosition: 500000,
      maxDrawdown: 0.05,
      maxVaR: 25000,
      maxLeverage: 2.0,
      maxConcentration: 0.3,
      stopLoss: 0.03,
    },
    executionConfig: {
      executionAlgo: "TWAP",
      urgencyMode: "passive",
      maxSlippage: 0.001,
      venues: ["BINANCE", "OKX"],
      orderTypes: ["LIMIT", "POST_ONLY"],
    },
    status: "live",
    createdAt: "2024-06-20T10:00:00Z",
    createdBy: "quant_team",
    approvedAt: "2024-07-01T14:00:00Z",
    approvedBy: "risk_mgr",
  },
  {
    id: "cfg-eth-basis-v2",
    templateId: "tpl-eth-basis",
    templateName: "ETH Basis Trade",
    version: "2.0.0",
    name: "ETH Basis Aggressive",
    description: "Higher leverage with ML-enhanced entry timing",
    archetype: "BASIS_TRADE",
    assetClass: "CeFi",
    parameters: {
      entry_threshold: 0.03,
      exit_threshold: 0.01,
      max_leverage: 4.0,
      rebalance_interval: "15m",
      funding_weight: 0.5,
      ml_signal_weight: 0.5,
    },
    riskLimits: {
      maxPosition: 1000000,
      maxDrawdown: 0.08,
      maxVaR: 50000,
      maxLeverage: 4.0,
      maxConcentration: 0.4,
      stopLoss: 0.05,
    },
    executionConfig: {
      executionAlgo: "ADAPTIVE",
      urgencyMode: "normal",
      maxSlippage: 0.002,
      venues: ["BINANCE", "OKX", "HYPERLIQUID"],
      orderTypes: ["LIMIT", "POST_ONLY", "IOC"],
    },
    status: "shadow",
    createdAt: "2024-09-15T10:00:00Z",
    createdBy: "quant_team",
    approvedAt: null,
    approvedBy: null,
  },
  // BTC MM configs
  {
    id: "cfg-btc-mm-v3",
    templateId: "tpl-btc-mm",
    templateName: "BTC Market Making",
    version: "3.0.0",
    name: "BTC MM Tight Spread",
    description: "Tighter spreads with aggressive inventory skew",
    archetype: "MARKET_MAKING",
    assetClass: "CeFi",
    parameters: {
      base_spread: 0.0002,
      inventory_skew: 0.5,
      quote_size: 0.1,
      max_inventory: 5.0,
      fade_factor: 0.8,
    },
    riskLimits: {
      maxPosition: 2000000,
      maxDrawdown: 0.03,
      maxVaR: 40000,
      maxLeverage: 1.5,
      maxConcentration: 0.5,
      stopLoss: 0.02,
    },
    executionConfig: {
      executionAlgo: "MAKER_ONLY",
      urgencyMode: "passive",
      maxSlippage: 0.0001,
      venues: ["BINANCE"],
      orderTypes: ["POST_ONLY"],
    },
    status: "live",
    createdAt: "2024-08-01T14:00:00Z",
    createdBy: "mm_team",
    approvedAt: "2024-08-10T10:00:00Z",
    approvedBy: "risk_mgr",
  },
  // More configs...
  {
    id: "cfg-stat-arb-v2",
    templateId: "tpl-stat-arb",
    templateName: "Cross-Exchange Statistical Arb",
    version: "2.0.0",
    name: "Stat Arb Multi-Pair",
    description: "Multi-pair cointegration with dynamic hedge ratios",
    archetype: "STATISTICAL_ARB",
    assetClass: "CeFi",
    parameters: {
      lookback_period: 168,
      entry_zscore: 2.0,
      exit_zscore: 0.5,
      hedge_ratio_update: "4h",
      min_cointegration: 0.8,
    },
    riskLimits: {
      maxPosition: 800000,
      maxDrawdown: 0.04,
      maxVaR: 30000,
      maxLeverage: 3.0,
      maxConcentration: 0.25,
      stopLoss: 0.025,
    },
    executionConfig: {
      executionAlgo: "SMART_ROUTER",
      urgencyMode: "aggressive",
      maxSlippage: 0.0015,
      venues: ["BINANCE", "OKX", "BYBIT"],
      orderTypes: ["LIMIT", "IOC"],
    },
    status: "validated",
    createdAt: "2024-10-01T09:00:00Z",
    createdBy: "arb_team",
    approvedAt: null,
    approvedBy: null,
  },
];

// =============================================================================
// Backtest Runs
// =============================================================================

function generateMetrics(seed: number, archetype: StrategyArchetype): BacktestMetrics {
  const r = (base: number, variance: number) => base + (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * variance;

  const sharpeBase = archetype === "MARKET_MAKING" ? 2.5 : archetype === "BASIS_TRADE" ? 1.8 : 1.2;
  const returnBase = archetype === "MARKET_MAKING" ? 0.35 : archetype === "BASIS_TRADE" ? 0.25 : 0.2;

  return {
    totalReturn: r(returnBase, 0.15),
    annualizedReturn: r(returnBase, 0.12),
    cagr: r(returnBase * 0.9, 0.1),
    sharpe: r(sharpeBase, 0.8),
    sortino: r(sharpeBase * 1.3, 1.0),
    calmar: r(sharpeBase * 0.7, 0.5),
    maxDrawdown: r(0.08, 0.04),
    volatility: r(0.12, 0.05),
    var95: r(0.015, 0.008),
    cvar95: r(0.022, 0.01),
    turnover: r(2.5, 1.5),
    avgSlippage: r(0.0008, 0.0004),
    totalSlippage: r(0.02, 0.01),
    fillRate: r(0.95, 0.05),
    alpha: r(0.08, 0.06),
    beta: r(0.15, 0.1),
    informationRatio: r(1.2, 0.6),
    hitRate: r(0.55, 0.08),
    profitFactor: r(1.6, 0.4),
    avgWin: r(0.012, 0.005),
    avgLoss: r(0.008, 0.003),
    winLossRatio: r(1.5, 0.4),
    regimeBreakdown: [
      {
        regime: "TRENDING",
        sharpe: r(2.0, 0.5),
        return: r(0.15, 0.05),
        drawdown: r(0.03, 0.02),
        sampleSize: 45,
      },
      {
        regime: "MEAN_REVERTING",
        sharpe: r(1.8, 0.4),
        return: r(0.12, 0.04),
        drawdown: r(0.04, 0.02),
        sampleSize: 38,
      },
      {
        regime: "VOLATILE",
        sharpe: r(0.8, 0.6),
        return: r(0.05, 0.08),
        drawdown: r(0.08, 0.03),
        sampleSize: 22,
      },
      {
        regime: "LOW_VOL",
        sharpe: r(1.5, 0.3),
        return: r(0.08, 0.03),
        drawdown: r(0.02, 0.01),
        sampleSize: 30,
      },
    ],
    grossPnl: r(280000, 80000),
    netPnl: r(250000, 70000),
    tradingCosts: r(18000, 8000),
    fundingCosts: r(12000, 6000),
  };
}

export const BACKTEST_RUNS: BacktestRun[] = [
  // ETH Basis backtests
  {
    id: "bt-eth-basis-001",
    configId: "cfg-eth-basis-v2",
    configVersion: "2.0.0",
    templateId: "tpl-eth-basis",
    templateName: "ETH Basis Trade",
    archetype: "BASIS_TRADE",
    status: "completed",
    progress: 100,
    instrument: "ETH-PERP",
    venue: "BINANCE",
    dateWindow: { start: "2024-01-01", end: "2024-06-30" },
    shard: "SHARD_1",
    strategyKind: "ml",
    isCandidate: true,
    testingStage: "HISTORICAL",
    dataSource: "HISTORICAL_TICK",
    dataSnapshotId: "snap-2024-h1",
    asOfDate: "2024-07-01",
    metrics: generateMetrics(1001, "BASIS_TRADE"),
    startedAt: "2024-10-15T08:00:00Z",
    completedAt: "2024-10-15T08:45:00Z",
    durationMs: 2700000,
    codeCommitHash: "abc123def",
    configHash: "cfg-hash-001",
    liveAnalogId: "live-eth-basis-001",
    driftScore: 0.12,
  },
  {
    id: "bt-eth-basis-002",
    configId: "cfg-eth-basis-v2",
    configVersion: "2.0.0",
    templateId: "tpl-eth-basis",
    templateName: "ETH Basis Trade",
    archetype: "BASIS_TRADE",
    status: "completed",
    progress: 100,
    instrument: "ETH-PERP",
    venue: "OKX",
    dateWindow: { start: "2024-01-01", end: "2024-06-30" },
    shard: "SHARD_1",
    strategyKind: "ml",
    testingStage: "HISTORICAL",
    dataSource: "HISTORICAL_TICK",
    dataSnapshotId: "snap-2024-h1",
    asOfDate: "2024-07-01",
    metrics: generateMetrics(1002, "BASIS_TRADE"),
    startedAt: "2024-10-15T08:00:00Z",
    completedAt: "2024-10-15T08:50:00Z",
    durationMs: 3000000,
    codeCommitHash: "abc123def",
    configHash: "cfg-hash-001",
    liveAnalogId: null,
    driftScore: null,
  },
  {
    id: "bt-eth-basis-003",
    configId: "cfg-eth-basis-v1",
    configVersion: "1.0.0",
    templateId: "tpl-eth-basis",
    templateName: "ETH Basis Trade",
    archetype: "BASIS_TRADE",
    status: "completed",
    progress: 100,
    instrument: "ETH-PERP",
    venue: "BINANCE",
    dateWindow: { start: "2024-01-01", end: "2024-06-30" },
    shard: "SHARD_1",
    strategyKind: "rule",
    testingStage: "HISTORICAL",
    dataSource: "HISTORICAL_TICK",
    dataSnapshotId: "snap-2024-h1",
    asOfDate: "2024-07-01",
    metrics: generateMetrics(1003, "BASIS_TRADE"),
    startedAt: "2024-10-14T08:00:00Z",
    completedAt: "2024-10-14T08:40:00Z",
    durationMs: 2400000,
    codeCommitHash: "abc123def",
    configHash: "cfg-hash-002",
    liveAnalogId: "live-eth-basis-002",
    driftScore: 0.08,
  },
  // BTC MM backtests
  {
    id: "bt-btc-mm-001",
    configId: "cfg-btc-mm-v3",
    configVersion: "3.0.0",
    templateId: "tpl-btc-mm",
    templateName: "BTC Market Making",
    archetype: "MARKET_MAKING",
    status: "completed",
    progress: 100,
    instrument: "BTC-PERP",
    venue: "BINANCE",
    dateWindow: { start: "2024-04-01", end: "2024-09-30" },
    shard: "SHARD_1",
    strategyKind: "ml",
    isCandidate: true,
    testingStage: "HISTORICAL",
    dataSource: "HISTORICAL_TICK",
    dataSnapshotId: "snap-2024-q2q3",
    asOfDate: "2024-10-01",
    metrics: generateMetrics(2001, "MARKET_MAKING"),
    startedAt: "2024-10-16T10:00:00Z",
    completedAt: "2024-10-16T11:30:00Z",
    durationMs: 5400000,
    codeCommitHash: "def456ghi",
    configHash: "cfg-hash-003",
    liveAnalogId: "live-btc-mm-001",
    driftScore: 0.05,
  },
  {
    id: "bt-btc-mm-002",
    configId: "cfg-btc-mm-v3",
    configVersion: "3.0.0",
    templateId: "tpl-btc-mm",
    templateName: "BTC Market Making",
    archetype: "MARKET_MAKING",
    status: "completed",
    progress: 100,
    instrument: "BTC-PERP",
    venue: "OKX",
    dateWindow: { start: "2024-04-01", end: "2024-09-30" },
    shard: "SHARD_2",
    strategyKind: "ml",
    testingStage: "HISTORICAL",
    dataSource: "HISTORICAL_TICK",
    dataSnapshotId: "snap-2024-q2q3",
    asOfDate: "2024-10-01",
    metrics: generateMetrics(2002, "MARKET_MAKING"),
    startedAt: "2024-10-18T09:00:00Z",
    completedAt: "2024-10-18T10:55:00Z",
    durationMs: 6900000,
    codeCommitHash: "def456ghi",
    configHash: "cfg-hash-003",
    liveAnalogId: "live-btc-mm-002",
    driftScore: 0.07,
  },
  // Stat Arb backtests
  {
    id: "bt-stat-arb-001",
    configId: "cfg-stat-arb-v2",
    configVersion: "2.0.0",
    templateId: "tpl-stat-arb",
    templateName: "Cross-Exchange Statistical Arb",
    archetype: "STATISTICAL_ARB",
    status: "completed",
    progress: 100,
    instrument: "BTC-USDT",
    venue: "MULTI",
    dateWindow: { start: "2024-06-01", end: "2024-09-30" },
    shard: "SHARD_1",
    strategyKind: "rule",
    testingStage: "LIVE_MOCK",
    dataSource: "HISTORICAL_TICK",
    dataSnapshotId: "snap-2024-q3",
    asOfDate: "2024-10-05",
    metrics: generateMetrics(3001, "STATISTICAL_ARB"),
    startedAt: "2024-10-17T14:00:00Z",
    completedAt: "2024-10-17T15:20:00Z",
    durationMs: 4800000,
    codeCommitHash: "ghi789jkl",
    configHash: "cfg-hash-004",
    liveAnalogId: null,
    driftScore: null,
  },
];

// =============================================================================
// Strategy Alerts
// =============================================================================

export const STRATEGY_ALERTS: StrategyAlert[] = [
  {
    id: "alert-001",
    type: "backtest_complete",
    severity: "info",
    configId: "cfg-eth-basis-v2",
    backtestRunId: "bt-eth-basis-001",
    message: "Backtest completed: ETH Basis Aggressive on BINANCE",
    details: { sharpe: 2.34, return: 0.28 },
    triggeredAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 1.75 * 3600000).toISOString(),
    resolvedAt: null,
  },
  {
    id: "alert-002",
    type: "drift_detected",
    severity: "warning",
    configId: "cfg-eth-basis-v1",
    backtestRunId: "bt-eth-basis-003",
    message: "Batch/Live drift elevated: 12% Sharpe deviation",
    details: { batchSharpe: 1.92, liveSharpe: 1.69, driftPct: 12 },
    triggeredAt: new Date(Date.now() - 45 * 60000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
  },
  {
    id: "alert-003",
    type: "validation_failed",
    severity: "critical",
    configId: "cfg-stat-arb-v2",
    backtestRunId: "bt-stat-arb-001",
    message: "Validation failed: Drawdown exceeds threshold in VOLATILE regime",
    details: { regime: "VOLATILE", drawdown: 0.12, threshold: 0.08 },
    triggeredAt: new Date(Date.now() - 10 * 60000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
  },
];

// =============================================================================
// Strategy Candidates
// =============================================================================

export const STRATEGY_CANDIDATES: StrategyCandidate[] = [
  {
    id: "cand-001",
    configId: "cfg-eth-basis-v2",
    configVersion: "2.0.0",
    backtestRunId: "bt-eth-basis-001",
    selectedAt: "2024-10-15T10:00:00Z",
    selectedBy: "quant_analyst_1",
    rationale: "Strong Sharpe improvement over v1, acceptable drift score",
    reviewState: "in_review",
    reviewComments: [
      {
        id: "rc-001",
        userId: "risk_mgr",
        userName: "Risk Manager",
        comment: "Need to verify drawdown behavior in volatile regimes",
        createdAt: "2024-10-16T14:00:00Z",
      },
    ],
    metricsSnapshot: generateMetrics(1001, "BASIS_TRADE"),
    promotionPackageId: null,
  },
  {
    id: "cand-002",
    configId: "cfg-btc-mm-v3",
    configVersion: "3.0.0",
    backtestRunId: "bt-btc-mm-001",
    selectedAt: "2024-10-16T12:00:00Z",
    selectedBy: "mm_lead",
    rationale: "Excellent fill rate and low drift vs live",
    reviewState: "approved",
    reviewComments: [],
    metricsSnapshot: generateMetrics(2001, "MARKET_MAKING"),
    promotionPackageId: "pkg-001",
  },
];

// =============================================================================
// Filter Options
// =============================================================================

export const ARCHETYPE_OPTIONS = [
  { value: "ARBITRAGE", label: "Arbitrage", count: 2 },
  { value: "MARKET_MAKING", label: "Market Making", count: 3 },
  { value: "DIRECTIONAL", label: "Directional", count: 2 },
  { value: "YIELD", label: "Yield", count: 1 },
  { value: "STATISTICAL_ARB", label: "Statistical Arb", count: 2 },
  { value: "BASIS_TRADE", label: "Basis Trade", count: 4 },
  { value: "OPTIONS", label: "Options", count: 1 },
];

export const ASSET_CLASS_OPTIONS = [
  { value: "CeFi", label: "CeFi", count: 8 },
  { value: "DeFi", label: "DeFi", count: 3 },
  { value: "TradFi", label: "TradFi", count: 2 },
  { value: "Sports", label: "Sports", count: 1 },
  { value: "Prediction", label: "Prediction", count: 1 },
];

export const VENUE_OPTIONS = [
  { value: "BINANCE", label: "Binance", count: 6 },
  { value: "OKX", label: "OKX", count: 4 },
  { value: "DERIBIT", label: "Deribit", count: 2 },
  { value: "BYBIT", label: "Bybit", count: 2 },
  { value: "HYPERLIQUID", label: "Hyperliquid", count: 1 },
];

export const TESTING_STAGE_OPTIONS = [
  { value: "HISTORICAL", label: "Historical Backtest", count: 5 },
  { value: "LIVE_MOCK", label: "Validation", count: 2 },
  { value: "LIVE_TESTNET", label: "Paper", count: 1 },
  { value: "STAGING", label: "Shadow", count: 1 },
];

// =============================================================================
// Signal Generation (for strategy backtest detail views)
// =============================================================================

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateSignals(
  backtestId: string,
  seed: number,
  count: number = 130,
  instrument: string = "BTC-PERP",
): StrategySignal[] {
  const rng = seededRng(seed);
  const signals: StrategySignal[] = [];
  const startDate = new Date("2026-01-01T00:00:00Z");
  const regimes = ["trending", "ranging", "volatile", "crisis"] as const;

  for (let i = 0; i < count; i++) {
    const hoursOffset = Math.floor(rng() * 90 * 24);
    const timestamp = new Date(startDate.getTime() + hoursOffset * 3600000);
    const isLong = rng() > 0.42;
    const isClose = i > 0 && rng() > 0.7;
    const confidence = 0.5 + rng() * 0.45;
    const isWin = rng() < (confidence > 0.7 ? 0.72 : 0.55);
    const pnlMagnitude = rng() * 400 + 50;
    const pnl = isWin ? pnlMagnitude : -pnlMagnitude * 0.65;

    signals.push({
      id: `${backtestId}-sig-${String(i + 1).padStart(3, "0")}`,
      timestamp: timestamp.toISOString(),
      direction: isClose ? "CLOSE" : isLong ? "LONG" : "SHORT",
      instrument,
      size_usd: 10000,
      confidence: Math.round(confidence * 100) / 100,
      model_prediction: Math.round((confidence + (rng() - 0.5) * 0.1) * 100) / 100,
      outcome: isClose ? null : isWin ? "win" : "loss",
      pnl_usd: isClose ? null : Math.round(pnl * 100) / 100,
      pnl_pct: isClose ? null : Math.round((pnl / 10000) * 10000) / 100,
      hold_duration_hours: isClose ? null : Math.round((1 + rng() * 24) * 10) / 10,
      bars_held: isClose ? null : Math.round(2 + rng() * 16),
      mfe_pct: isClose ? null : Math.round((rng() * 5 + 0.5) * 100) / 100,
      mae_pct: isClose ? null : Math.round((-rng() * 3 - 0.2) * 100) / 100,
      regime_at_signal: regimes[Math.floor(rng() * regimes.length)],
    });
  }

  return signals.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function generateSignalQuality(seed: number, totalSignals: number = 130): SignalQualityMetrics {
  const rng = seededRng(seed);

  return {
    total_signals: totalSignals,
    signals_per_day: Math.round((totalSignals / 90) * 10) / 10,
    hit_rate: Math.round((55 + rng() * 15) * 10) / 10,
    avg_confidence: Math.round((0.65 + rng() * 0.12) * 100) / 100,
    confidence_distribution: [
      { bucket: "0.50-0.60", count: Math.round(totalSignals * 0.21), pct: 21 },
      { bucket: "0.60-0.70", count: Math.round(totalSignals * 0.29), pct: 29 },
      { bucket: "0.70-0.80", count: Math.round(totalSignals * 0.32), pct: 32 },
      { bucket: "0.80-0.90", count: Math.round(totalSignals * 0.14), pct: 14 },
      { bucket: "0.90-1.00", count: Math.round(totalSignals * 0.04), pct: 4 },
    ],
    high_confidence_hit_rate: Math.round((70 + rng() * 12) * 10) / 10,
    avg_hold_duration_hours: Math.round((4 + rng() * 8) * 10) / 10,
    max_consecutive_losses: Math.round(3 + rng() * 5),
    regime_sharpe: {
      trending: Math.round((2.5 + rng() * 1.5) * 100) / 100,
      ranging: Math.round((0.5 + rng() * 1.0) * 100) / 100,
      volatile: Math.round((-0.5 + rng() * 1.5) * 100) / 100,
      crisis: Math.round((-1.0 + rng() * 1.0) * 100) / 100,
    },
  };
}

/** Synthetic mid price for signal overlay chart (random walk, hourly bars). */
export interface SyntheticPricePoint {
  time: number;
  value: number;
}

export function generateSyntheticPriceSeries(
  seed: number,
  pointCount: number = 720,
  startPrice: number = 65200,
): SyntheticPricePoint[] {
  const rng = seededRng(seed);
  let price = startPrice;
  const nowSec = Math.floor(Date.now() / 1000);
  const start = nowSec - pointCount * 3600;
  const out: SyntheticPricePoint[] = [];
  for (let i = 0; i < pointCount; i++) {
    price *= 1 + (rng() - 0.5) * 0.006;
    out.push({
      time: start + i * 3600,
      value: Math.round(price * 100) / 100,
    });
  }
  return out;
}

/** Pairwise signal agreement for compare view (same direction within tolerance). */
export function computeSignalOverlap(
  backtestAId: string,
  backtestBId: string,
  signalsA: StrategySignal[],
  signalsB: StrategySignal[],
  toleranceHours: number = 48,
): SignalOverlapMetrics {
  const tolMs = toleranceHours * 3600000;

  const directional = (s: StrategySignal) => s.direction === "LONG" || s.direction === "SHORT";

  const listA = signalsA.filter(directional);
  const listB = signalsB.filter(directional);
  const usedB = new Set<number>();
  let overlapCount = 0;

  for (const a of listA) {
    const ta = new Date(a.timestamp).getTime();
    for (let bi = 0; bi < listB.length; bi++) {
      if (usedB.has(bi)) continue;
      const b = listB[bi];
      const tb = new Date(b.timestamp).getTime();
      if (Math.abs(ta - tb) <= tolMs && a.direction === b.direction && a.instrument === b.instrument) {
        overlapCount++;
        usedB.add(bi);
        break;
      }
    }
  }

  const denom = Math.max(1, Math.min(listA.filter((s) => s.direction !== "CLOSE").length, listB.length));
  const overlapPct = Math.round((overlapCount / denom) * 10000) / 100;

  return {
    backtest_a_id: backtestAId,
    backtest_b_id: backtestBId,
    overlap_pct: overlapPct,
    confluence_zones:
      overlapCount > 0
        ? [
            {
              start: new Date(Date.now() - 86400000 * 45).toISOString(),
              end: new Date(Date.now() - 86400000 * 35).toISOString(),
              direction: "LONG",
            },
          ]
        : [],
    divergence_zones:
      overlapPct < 40
        ? [
            {
              start: new Date(Date.now() - 86400000 * 20).toISOString(),
              end: new Date(Date.now() - 86400000 * 14).toISOString(),
              a_direction: "LONG",
              b_direction: "SHORT",
            },
          ]
        : [],
  };
}

/**
 * For 2+ strategies: share of the first strategy's directional signals for which
 * every other strategy has a same-direction, same-instrument match within tolerance.
 */
export function computeFullConfluenceAllStrategies(
  items: { id: string; signals: StrategySignal[] }[],
  toleranceHours: number = 48,
): { all_agree_pct: number; matched: number; anchor: number } {
  if (items.length < 2) {
    return { all_agree_pct: 0, matched: 0, anchor: 0 };
  }

  const tolMs = toleranceHours * 3600000;
  const directional = (s: StrategySignal) => s.direction === "LONG" || s.direction === "SHORT";

  const anchorList = items[0].signals.filter(directional);
  let matched = 0;

  for (const a of anchorList) {
    const ta = new Date(a.timestamp).getTime();
    let allMatch = true;
    for (let si = 1; si < items.length; si++) {
      const others = items[si].signals.filter(directional);
      const found = others.some((b) => {
        const tb = new Date(b.timestamp).getTime();
        return Math.abs(ta - tb) <= tolMs && a.direction === b.direction && a.instrument === b.instrument;
      });
      if (!found) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) matched++;
  }

  const anchor = anchorList.length;
  const pct = anchor === 0 ? 0 : Math.round((matched / anchor) * 10000) / 100;
  return { all_agree_pct: pct, matched, anchor };
}

// =============================================================================
// Precomputed Analytics per Backtest
// =============================================================================

export const BACKTEST_ANALYTICS: Record<string, BacktestAnalytics> = {};
export const BACKTEST_SIGNALS: Record<string, StrategySignal[]> = {};
export const BACKTEST_SIGNAL_QUALITY: Record<string, SignalQualityMetrics> = {};

for (const bt of BACKTEST_RUNS) {
  if (bt.status !== "completed" || !bt.metrics) continue;

  const netProfit = bt.metrics.netPnl;
  const totalSignals = Math.round(50 + Math.abs(netProfit / 2000));
  const seedBase = parseInt(bt.id.replace(/\D/g, "").slice(0, 6) || "1000", 10);

  BACKTEST_ANALYTICS[bt.id] = generateBacktestAnalytics(seedBase, {
    days: 90,
    totalTrades: totalSignals,
    netProfit,
  });

  BACKTEST_SIGNALS[bt.id] = generateSignals(bt.id, seedBase + 100, totalSignals, bt.instrument);
  BACKTEST_SIGNAL_QUALITY[bt.id] = generateSignalQuality(seedBase + 200, totalSignals);
}
