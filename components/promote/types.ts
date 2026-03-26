import type { GateStatus } from "@/components/shared/gate-status";

export type { GateStatus };

export type PromotionStage =
  | "data_validation"
  | "model_assessment"
  | "risk_stress"
  | "execution_readiness"
  | "champion"
  | "paper_trading"
  | "capital_allocation"
  | "governance";

export type ReviewDecision =
  | "approved"
  | "rejected"
  | "pending"
  | "requires_changes";

export type PromoteWorkflowAction =
  | "approve"
  | "reject"
  | "retest"
  | "override"
  | "demote";

export interface GateCheck {
  id: string;
  label: string;
  status: GateStatus;
  detail?: string;
  mandatory: boolean;
  threshold?: string;
  actual?: string;
  category?: string;
}

export interface StrategyMetrics {
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  totalReturn: number;
  hitRate: number;
  profitFactor: number;
  calmar: number;
  avgTrade: number;
  winLossRatio: number;
  dailyVaR: number;
  cvar: number;
  tailRatio: number;
}

export interface RegimePerformanceRow {
  regime: string;
  sharpe: number;
  return: number;
  maxDrawdown: number;
  hitRate: number;
  tradeCount: number;
  duration: string;
}

export interface WalkForwardWindow {
  windowId: number;
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
  sharpe: number;
  return: number;
  maxDrawdown: number;
  tStat: number;
  /** Two-sided approximate p-value for t-stat vs zero (reporting only) */
  pValue?: number;
}

export interface ChampionInfo {
  id: string;
  name: string;
  version: string;
  metrics: StrategyMetrics;
  deployedSince: string;
  capitalDeployed: number;
  /** Per-regime Sharpe path for champion (same regime keys as challenger) */
  regimePerformance?: RegimePerformanceRow[];
}

export interface PaperTradingInfo {
  status: "running" | "completed" | "failed";
  startDate: string;
  endDate?: string;
  daysCompleted: number;
  daysRequired: number;
  pnl: number;
  sharpe: number;
  backtestSharpeForPeriod: number;
  fillRate: number;
  avgSlippageBps: number;
  latencyImpactBps: number;
  uptime: number;
  errorCount: number;
  divergenceRatio: number;
  partialFillRate?: number;
  queuePositionSummary?: string;
  feedInterruptions?: number;
  recoveryTimeMinutes?: number;
  returnDivergencePct?: number;
  maxDdDivergencePct?: number;
  hitRateDivergencePct?: number;
  /** Daily shadow P&amp;L (USD) for sparkline */
  dailyPnlUsd?: number[];
}

export interface CapitalAllocationInfo {
  proposedUsd: number;
  proposedPctAum: number;
  kellyOptimal: number;
  riskParityWeight: number;
  cioMaxCap: number;
  rampWeeks: number;
  varBudgetPct: number;
  marginalVar: number;
  stressLossBudget: number;
  halfKelly?: number;
  conservativeSizingUsd?: number;
  rampGateChecks?: { week: number; label: string; status: GateStatus }[];
  marginByVenue?: {
    venue: string;
    initialUsd: string;
    maintenanceUsd: string;
    utilizationPct: number;
  }[];
}

export interface FeatureStabilityRow {
  featureName: string;
  importanceAtTraining: number;
  importanceCurrent: number;
  psi: number;
  status: "stable" | "drifting" | "dead";
}

export interface ModelDriftInfo {
  icCurrent: number;
  icAtTraining: number;
  signalHalfLifeDays: number;
  hitRateTrend: "improving" | "stable" | "declining";
  autoCorrelation: number;
}

export interface DocumentationChecklistItem {
  label: string;
  complete: boolean;
  lastUpdated?: string;
}

export interface ComplianceInfo {
  modelId?: string;
  modelTier: 1 | 2 | 3;
  modelOwner: string;
  lastValidationDate: string;
  nextValidationDate: string;
  regulatoryClassification: string;
  documentationComplete: boolean;
  mrcReviewed: boolean;
  fcaNotified: boolean;
  riskMaterialityScore?: number;
  sec17a4Compliant?: boolean;
  finra4512Compliant?: boolean;
  documentationChecklist?: DocumentationChecklistItem[];
}

export interface ReviewHistoryEntry {
  id: string;
  reviewer: string;
  role: string;
  decision: ReviewDecision;
  comment: string;
  timestamp: string;
  stage: PromotionStage;
  isOverride?: boolean;
}

export interface CandidateStrategy {
  id: string;
  name: string;
  version: string;
  archetype: string;
  assetClass: string;
  currentStage: PromotionStage;
  submittedBy: string;
  submittedAt: string;
  daysInCurrentStage?: number;
  slaDaysExpected?: number;
  stages: Record<PromotionStage, { status: GateStatus; completedAt?: string }>;
  metrics: StrategyMetrics;
  dataQuality: {
    coverageScore: number;
    freshnessMinutes: number;
    gapCount: number;
    integrityScore: number;
    venues: string[];
    instruments: number;
    timeRange: string;
    crossVenueMaxDeviationBps?: number;
    survivorshipIncludesDelisted?: boolean;
    etlPipelineVersion?: string;
    primaryVendor?: string;
  };
  mlMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    auc: number;
    informationCoefficient: number;
    featureCount: number;
    trainingPeriod: string;
    validationPeriod: string;
    oosPerformance: number;
  };
  riskProfile: {
    worstDay: number;
    worstWeek: number;
    worstMonth: number;
    stressScenarios: { name: string; impact: number; status: GateStatus }[];
    correlationToPortfolio: number;
    concentrationRisk: number;
    liquidityScore: number;
  };
  executionReadiness: {
    venues: {
      name: string;
      connected: boolean;
      latencyMs: number;
      fillRate: number;
    }[];
    avgSlippageBps: number;
    capacityUsd: number;
    marketImpact: number;
  };
  reviewHistory: ReviewHistoryEntry[];
  regimePerformance: RegimePerformanceRow[];
  walkForward: WalkForwardWindow[];
  champion?: ChampionInfo;
  paperTrading?: PaperTradingInfo;
  capitalAllocation?: CapitalAllocationInfo;
  featureStability: FeatureStabilityRow[];
  modelDrift: ModelDriftInfo;
  compliance: ComplianceInfo;
  configDiff?: {
    parameter: string;
    currentValue: string;
    proposedValue: string;
    impact: string;
  }[];
  deploymentPlan?: {
    targetEnv: string;
    rollbackConditions: string[];
    monitoringPlan: { period: string; checks: string[] }[];
    escalationContacts: string[];
  };
}

export const STAGE_ORDER: PromotionStage[] = [
  "data_validation",
  "model_assessment",
  "risk_stress",
  "execution_readiness",
  "champion",
  "paper_trading",
  "capital_allocation",
  "governance",
];
