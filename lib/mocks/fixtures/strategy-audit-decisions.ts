export type DecisionType = "ENTRY" | "EXIT" | "HOLD" | "REBALANCE" | "SKIP";
export type SignalSource = "ML_MODEL" | "RULE_ENGINE" | "MANUAL" | "RISK_OVERRIDE";

export interface StrategyDecision {
  id: string;
  timestamp: string;
  strategyId: string;
  strategyName: string;
  decisionType: DecisionType;
  signalSource: SignalSource;
  confidence: number;
  modelVersion?: string;
  inputFeatures: { name: string; value: number | string }[];
  instrument?: string;
  side?: "BUY" | "SELL";
  size?: number;
  entryPrice?: number;
  riskChecks: { name: string; passed: boolean; details: string }[];
  executed: boolean;
  executionId?: string;
  executionPrice?: number;
  slippage?: number;
  overrideReason?: string;
  overrideBy?: string;
}

export const MOCK_DECISIONS: StrategyDecision[] = [
  {
    id: "dec-001",
    timestamp: "14:32:01",
    strategyId: "DEFI_ETH_BASIS_SCE_1H",
    strategyName: "ETH Basis Trade",
    decisionType: "ENTRY",
    signalSource: "ML_MODEL",
    confidence: 0.82,
    modelVersion: "v3.2.1",
    inputFeatures: [
      { name: "funding_rate", value: "0.0245%" },
      { name: "basis_spread", value: "1.2%" },
      { name: "volume_24h", value: "$45.2M" },
      { name: "volatility_1h", value: 0.032 },
    ],
    instrument: "ETH-PERP",
    side: "BUY",
    size: 50000,
    entryPrice: 2450.25,
    riskChecks: [
      { name: "Position Limit", passed: true, details: "Within 80% of max" },
      { name: "Margin Available", passed: true, details: "25% buffer" },
      {
        name: "Correlation Check",
        passed: true,
        details: "No correlated position",
      },
      {
        name: "Drawdown Limit",
        passed: true,
        details: "DD at 2.1% < 5% limit",
      },
    ],
    executed: true,
    executionId: "exec-24891",
    executionPrice: 2450.18,
    slippage: -0.003,
  },
  {
    id: "dec-002",
    timestamp: "14:28:30",
    strategyId: "CEFI_BTC_ML_DIR_HUF_4H",
    strategyName: "BTC ML Momentum",
    decisionType: "SKIP",
    signalSource: "RULE_ENGINE",
    confidence: 0.45,
    inputFeatures: [
      { name: "momentum_score", value: 0.32 },
      { name: "trend_strength", value: 0.18 },
      { name: "volume_ratio", value: 0.85 },
    ],
    riskChecks: [
      {
        name: "Min Confidence",
        passed: false,
        details: "0.45 < 0.65 threshold",
      },
    ],
    executed: false,
  },
  {
    id: "dec-003",
    timestamp: "14:15:00",
    strategyId: "CEFI_ETH_OPT_MM_EVT_TICK",
    strategyName: "ETH Options MM",
    decisionType: "REBALANCE",
    signalSource: "RISK_OVERRIDE",
    confidence: 1.0,
    inputFeatures: [
      { name: "delta_exposure", value: "+$125K" },
      { name: "gamma_exposure", value: "-$45K" },
      { name: "theta_decay", value: "$2.1K/day" },
    ],
    instrument: "ETH-28MAR25-2600-C",
    side: "SELL",
    size: 25,
    riskChecks: [
      {
        name: "Delta Limit",
        passed: false,
        details: "$125K > $100K soft limit",
      },
      {
        name: "Auto-hedge Enabled",
        passed: true,
        details: "Triggered rebalance",
      },
    ],
    executed: true,
    executionId: "exec-24888",
    overrideReason: "Delta soft limit breach - auto-hedge",
  },
  {
    id: "dec-004",
    timestamp: "13:58:45",
    strategyId: "SPORT_NFL_ARBIT_EVT_GAME",
    strategyName: "NFL Arbitrage",
    decisionType: "ENTRY",
    signalSource: "RULE_ENGINE",
    confidence: 0.95,
    inputFeatures: [
      { name: "edge", value: "2.3%" },
      { name: "liquidity_available", value: "$15K" },
      { name: "time_to_event", value: "45 min" },
    ],
    instrument: "KC Chiefs ML",
    side: "BUY",
    size: 5000,
    entryPrice: -145,
    riskChecks: [
      { name: "Min Edge", passed: true, details: "2.3% > 1.5% threshold" },
      { name: "Liquidity Check", passed: true, details: "$15K available" },
      { name: "Event Time", passed: true, details: "45m > 30m min" },
    ],
    executed: true,
    executionId: "exec-24885",
    executionPrice: -145,
    slippage: 0,
  },
  {
    id: "dec-005",
    timestamp: "13:42:00",
    strategyId: "DEFI_AAVE_LEND_EVT_1D",
    strategyName: "Aave Lending",
    decisionType: "REBALANCE",
    signalSource: "ML_MODEL",
    confidence: 0.78,
    modelVersion: "v2.1.0",
    inputFeatures: [
      { name: "health_factor", value: 1.38 },
      { name: "utilization_rate", value: "82%" },
      { name: "borrow_apy", value: "4.2%" },
    ],
    riskChecks: [
      {
        name: "Min Health Factor",
        passed: false,
        details: "1.38 < 1.5 threshold",
      },
      { name: "Gas Price", passed: true, details: "28 gwei < 50 max" },
    ],
    executed: true,
    executionId: "exec-24880",
    overrideReason: "Health factor drift - rebalance to 1.6",
  },
];
