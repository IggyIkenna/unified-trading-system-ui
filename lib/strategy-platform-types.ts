// =============================================================================
// Strategy Research Platform Type Definitions
// Institutional-grade strategy backtest and research operating system
// =============================================================================

// Taxonomy imports — SSOT for enums lives in taxonomy.ts
import type { StrategyArchetype, AssetClass, TestingStage } from "./taxonomy";
export type { StrategyArchetype, AssetClass, TestingStage };
export { STRATEGY_ARCHETYPES, ASSET_CLASSES, TESTING_STAGES } from "./taxonomy";

// Strategy lifecycle stages
export const STRATEGY_LIFECYCLE_STAGES = [
  "DESIGN",
  "BACKTEST",
  "VALIDATE",
  "PAPER",
  "SHADOW",
  "PROMOTE",
  "LIVE",
  "MONITOR",
  "REVIEW",
] as const;

export type StrategyLifecycleStage = (typeof STRATEGY_LIFECYCLE_STAGES)[number];

// Context type
export type ContextType = "BATCH" | "LIVE";

// =============================================================================
// Core Entities
// =============================================================================

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  archetype: StrategyArchetype;
  assetClasses: AssetClass[];
  signals: string[];
  riskTypes: string[];
  venues: string[];
  instruments: string[];
  createdAt: string;
  createdBy: string;
  version: string;
  linkedModels: string[];
}

export interface StrategyConfig {
  id: string;
  templateId: string;
  templateName: string;
  version: string;
  name: string;
  description: string;
  archetype: StrategyArchetype;
  assetClass: AssetClass;
  parameters: Record<string, number | string | boolean>;
  riskLimits: RiskLimits;
  executionConfig: ExecutionConfig;
  status:
    | "draft"
    | "backtest"
    | "validated"
    | "paper"
    | "shadow"
    | "live"
    | "deprecated";
  createdAt: string;
  createdBy: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface RiskLimits {
  maxPosition: number;
  maxDrawdown: number;
  maxVaR: number;
  maxLeverage: number;
  maxConcentration: number;
  stopLoss: number;
}

export interface ExecutionConfig {
  executionAlgo: string;
  urgencyMode: "passive" | "normal" | "aggressive";
  maxSlippage: number;
  venues: string[];
  orderTypes: string[];
}

// =============================================================================
// Backtest Entities
// =============================================================================

export interface BacktestRun {
  id: string;
  configId: string;
  configName?: string;
  configVersion: string;
  templateId: string;
  templateName: string;
  archetype: StrategyArchetype;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;

  // Dimensions
  instrument: string;
  venue: string;
  dateWindow: { start: string; end: string };
  shard: string;
  testingStage: TestingStage;

  // Data provenance
  dataSource: string;
  dataSnapshotId: string;
  asOfDate: string;

  // Metrics
  metrics: BacktestMetrics | null;

  // Timing
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;

  // Lineage
  codeCommitHash: string;
  configHash: string;

  // Batch/Live comparison
  liveAnalogId: string | null;
  driftScore: number | null;
}

export interface BacktestMetrics {
  // Returns
  totalReturn: number;
  annualizedReturn: number;
  cagr: number;

  // Risk-adjusted
  sharpe: number;
  sortino: number;
  calmar: number;

  // Risk
  maxDrawdown: number;
  volatility: number;
  var95: number;
  cvar95: number;

  // Execution
  turnover: number;
  avgSlippage: number;
  totalSlippage: number;
  fillRate: number;

  // Alpha
  alpha: number;
  beta: number;
  informationRatio: number;

  // Quality
  hitRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;

  // Regime
  regimeBreakdown: RegimeMetrics[];

  // Cost-adjusted
  grossPnl: number;
  netPnl: number;
  tradingCosts: number;
  fundingCosts: number;
}

export interface RegimeMetrics {
  regime: string;
  sharpe: number;
  return: number;
  drawdown: number;
  sampleSize: number;
}

// =============================================================================
// Result Slice (for detailed analysis)
// =============================================================================

export interface ResultSlice {
  id: string;
  backtestRunId: string;
  sliceType: "daily" | "weekly" | "monthly" | "regime" | "instrument" | "venue";
  sliceKey: string;
  dateRange: { start: string; end: string };

  // Metrics
  pnl: number;
  return: number;
  sharpe: number;
  drawdown: number;
  trades: number;
  hitRate: number;

  // Attribution
  grossPnl: number;
  slippage: number;
  fees: number;
  funding: number;
  netPnl: number;

  // Signals
  signalCount: number;
  signalAccuracy: number;
  avgSignalStrength: number;

  // Risk
  maxExposure: number;
  avgExposure: number;
  varContribution: number;
}

// =============================================================================
// Batch/Live Comparison
// =============================================================================

export interface BatchLiveComparison {
  id: string;
  backtestRunId: string;
  liveRunId: string;
  configId: string;
  dateRange: { start: string; end: string };

  // Overall drift
  overallDriftScore: number;
  driftCategory: "minimal" | "acceptable" | "elevated" | "critical";

  // Metric comparison
  batchMetrics: BacktestMetrics;
  liveMetrics: BacktestMetrics;

  // Detailed drift
  metricDrift: MetricDrift[];

  // Attribution
  driftAttribution: DriftAttribution[];
}

export interface MetricDrift {
  metric: string;
  batchValue: number;
  liveValue: number;
  absoluteDrift: number;
  percentDrift: number;
  significance: "low" | "medium" | "high";
}

export interface DriftAttribution {
  factor: string;
  contribution: number;
  explanation: string;
}

// =============================================================================
// Config Comparison
// =============================================================================

export interface ConfigComparison {
  baseConfigId: string;
  compareConfigIds: string[];
  dimensions: string[];

  // Comparison results
  results: ConfigComparisonResult[];
}

export interface ConfigComparisonResult {
  configId: string;
  configVersion: string;
  configName: string;

  // Parameter diffs
  parameterDiffs: ParameterDiff[];

  // Metric comparison
  metrics: BacktestMetrics;

  // Relative performance
  sharpeVsBase: number;
  returnVsBase: number;
  drawdownVsBase: number;
}

export interface ParameterDiff {
  parameter: string;
  baseValue: number | string | boolean;
  compareValue: number | string | boolean;
  impact: "positive" | "negative" | "neutral" | "unknown";
}

// =============================================================================
// Candidate Selection
// =============================================================================

export interface StrategyCandidate {
  id: string;
  configId: string;
  configVersion: string;
  backtestRunId: string;

  // Selection metadata
  selectedAt: string;
  selectedBy: string;
  rationale: string;

  // Review state
  reviewState: "pending" | "in_review" | "approved" | "rejected";
  reviewComments: ReviewComment[];

  // Metrics at selection
  metricsSnapshot: BacktestMetrics;

  // Handoff
  promotionPackageId: string | null;
}

export interface ReviewComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

// =============================================================================
// Promotion Package
// =============================================================================

export interface PromotionPackage {
  id: string;
  candidates: StrategyCandidate[];
  targetStage: StrategyLifecycleStage;

  // Validation checklist
  validationChecks: ValidationCheck[];

  // Approval workflow
  status: "draft" | "submitted" | "in_review" | "approved" | "rejected";
  submittedAt: string | null;
  submittedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;

  // Notes
  submissionNotes: string;
  reviewNotes: string;
}

export interface ValidationCheck {
  id: string;
  name: string;
  category: "performance" | "risk" | "compliance" | "operational";
  status: "pending" | "passed" | "failed" | "skipped";
  required: boolean;
  details: string;
  checkedAt: string | null;
}

// =============================================================================
// Heatmap Configuration
// =============================================================================

export interface HeatmapConfig {
  rows: HeatmapDimension;
  columns: HeatmapDimension;
  metric: string;
  colorScale: "diverging" | "sequential" | "categorical";
  aggregation: "mean" | "median" | "sum" | "count" | "min" | "max";
}

export type HeatmapDimension =
  | "strategy"
  | "config_version"
  | "instrument"
  | "venue"
  | "date_window"
  | "shard"
  | "testing_stage"
  | "archetype"
  | "asset_class"
  | "regime";

// =============================================================================
// Alerts
// =============================================================================

export interface StrategyAlert {
  id: string;
  type:
    | "backtest_complete"
    | "validation_failed"
    | "drift_detected"
    | "config_expired"
    | "review_required";
  severity: "info" | "warning" | "critical";
  configId: string;
  backtestRunId: string | null;
  message: string;
  details: Record<string, unknown>;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}
