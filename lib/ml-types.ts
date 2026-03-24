// =============================================================================
// ML Platform Type Definitions
// Institutional-grade ML operating system for systematic trading
// =============================================================================

// Lifecycle stages for models
export const MODEL_LIFECYCLE_STAGES = [
  "DESIGN",
  "TRAIN",
  "VALIDATE",
  "REGISTER",
  "SHADOW",
  "PROMOTE",
  "LIVE",
  "MONITOR",
  "REVIEW",
] as const;

export type ModelLifecycleStage = (typeof MODEL_LIFECYCLE_STAGES)[number];

// Model family taxonomy by strategy archetype
export const MODEL_ARCHETYPES = [
  "ARBITRAGE",
  "MARKET_MAKING",
  "DIRECTIONAL",
  "YIELD",
  "SPORTS_ML",
  "PREDICTION_MARKET_ML",
] as const;

export type ModelArchetype = (typeof MODEL_ARCHETYPES)[number];

// Timeframe granularity for cascade predictions
export const PREDICTION_TIMEFRAMES = [
  "TICK",
  "1S",
  "1M",
  "5M",
  "15M",
  "1H",
  "4H",
  "1D",
] as const;

export type PredictionTimeframe = (typeof PREDICTION_TIMEFRAMES)[number];

// Context type (batch vs live)
export type ContextType = "BATCH" | "LIVE";

// =============================================================================
// Core Entities
// =============================================================================

export interface ModelFamily {
  id: string;
  name: string;
  description: string;
  archetype: ModelArchetype;
  assetClasses: string[];
  currentChampion: string | null;
  currentChallenger: string | null;
  totalVersions: number;
  linkedStrategies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  modelFamilyId: string;
  status: "draft" | "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  datasetSnapshotId: string;
  featureSetVersionId: string;
  hyperparameters: Record<string, number | string | boolean>;
  trainingConfig: TrainingConfig;
  metrics: ExperimentMetrics | null;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: string;
  lossFunction: string;
  earlyStopping: boolean;
  earlyStoppingPatience: number;
  gpuType: string;
  numGpus: number;
}

export interface ExperimentMetrics {
  accuracy: number;
  loss: number;
  sharpe: number;
  directionalAccuracy: number;
  calibration: number;
  precision: number;
  recall: number;
  turnover: number;
  maxDrawdown: number;
  latencyCost: number;
  stabilityScore: number;
}

export interface TrainingRun {
  id: string;
  experimentId: string;
  status:
    | "queued"
    | "initializing"
    | "training"
    | "validating"
    | "completed"
    | "failed";
  stage:
    | "data_loading"
    | "preprocessing"
    | "training"
    | "validation"
    | "checkpointing"
    | "finalizing";
  stageProgress: number;
  currentEpoch: number;
  totalEpochs: number;
  trainLoss: number;
  valLoss: number;
  gpuUtilization: number;
  memoryUsage: number;
  estimatedTimeRemaining: string;
  logs: TrainingLog[];
  startedAt: string;
  artifacts: TrainingArtifact[];
  checkpoints: string[];
}

export interface TrainingLog {
  timestamp: string;
  level: "info" | "warning" | "error" | "debug";
  message: string;
}

export interface TrainingArtifact {
  id: string;
  type: "model" | "checkpoint" | "metrics" | "config" | "logs";
  path: string;
  size: number;
  createdAt: string;
}

export interface ModelVersion {
  id: string;
  modelFamilyId: string;
  version: string;
  experimentId: string;
  status:
    | "registered"
    | "validating"
    | "validated"
    | "shadow"
    | "live"
    | "deprecated"
    | "archived";
  isChampion: boolean;
  isChallenger: boolean;
  metrics: ModelMetrics;
  validationPackageId: string | null;
  deploymentCandidateId: string | null;
  liveDeploymentId: string | null;
  registeredAt: string;
  registeredBy: string;
  approvedAt: string | null;
  approvedBy: string | null;
  lineage: ModelLineage;
}

export interface ModelMetrics {
  accuracy: number;
  sharpe: number;
  maxDrawdown: number;
  directionalAccuracy: number;
  calibration: number;
  inferenceLatencyP50: number;
  inferenceLatencyP99: number;
  predictionCount: number;
  lastPredictionAt: string | null;
}

export interface ModelLineage {
  parentModelId: string | null;
  datasetSnapshotId: string;
  featureSetVersionId: string;
  trainingConfigHash: string;
  codeCommitHash: string;
}

export interface DatasetSnapshot {
  id: string;
  name: string;
  description: string;
  instruments: string[];
  dateRange: { start: string; end: string };
  rowCount: number;
  sizeBytes: number;
  features: string[];
  createdAt: string;
  createdBy: string;
}

export interface FeatureSetVersion {
  id: string;
  name: string;
  version: string;
  features: FeatureDefinition[];
  services: string[];
  createdAt: string;
  createdBy: string;
  featureCount?: number;
  coveragePct?: number;
}

export interface FeatureDefinition {
  name: string;
  type: "numeric" | "categorical" | "embedding" | "timeseries";
  source: string;
  sla: string;
  description: string;
}

export interface ValidationPackage {
  id: string;
  modelVersionId: string;
  status: "pending" | "running" | "passed" | "failed" | "review_required";
  validationType:
    | "backtest"
    | "walk_forward"
    | "regime_analysis"
    | "factor_sensitivity";
  periodStart: string;
  periodEnd: string;
  regimes: RegimeValidation[];
  factorSensitivity: FactorSensitivity[];
  comparisonResults: ModelComparison | null;
  createdAt: string;
  completedAt: string | null;
}

export interface RegimeValidation {
  regime: string;
  sharpe: number;
  accuracy: number;
  drawdown: number;
  sampleSize: number;
}

export interface FactorSensitivity {
  factor: string;
  sensitivity: number;
  pValue: number;
}

export interface ModelComparison {
  baselineModelId: string;
  sharpeUplift: number;
  accuracyUplift: number;
  drawdownReduction: number;
  significanceLevel: number;
}

export interface DeploymentCandidate {
  id: string;
  modelVersionId: string;
  targetStrategyIds: string[];
  status:
    | "pending"
    | "shadow_ready"
    | "shadow_running"
    | "gate_1d"
    | "gate_1w"
    | "approved"
    | "rejected";
  configVersion: string;
  featureDependencies: FeatureDependencyCheck[];
  shadowResults: ShadowResults | null;
  gates: DeploymentGate[];
  blockingIssues: string[];
  expectedImpact: ExpectedImpact;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface FeatureDependencyCheck {
  featureName: string;
  service: string;
  status: "available" | "degraded" | "unavailable";
  latency: number;
  freshness: string;
}

export interface ShadowResults {
  duration: string;
  predictionCount: number;
  accuracy: number;
  latencyP50: number;
  latencyP99: number;
  errorRate: number;
  championComparison: {
    accuracyDelta: number;
    latencyDelta: number;
  };
}

export interface DeploymentGate {
  id: string;
  name: string;
  type: "shadow" | "1d" | "1w" | "maturity" | "manual";
  status: "pending" | "passed" | "failed" | "skipped";
  requiredMetric: string;
  threshold: number;
  actualValue: number | null;
  passedAt: string | null;
}

export interface ExpectedImpact {
  sharpeChange: number;
  accuracyChange: number;
  latencyChange: number;
  capitalAtRisk: number;
}

export interface LiveDeployment {
  id: string;
  modelVersionId: string;
  strategyIds: string[];
  status: "active" | "paused" | "degraded" | "rollback_pending";
  deployedAt: string;
  deployedBy: string;
  health: DeploymentHealth;
  metrics: LiveMetrics;
}

export interface DeploymentHealth {
  overall: "healthy" | "warning" | "critical";
  predictionDrift: "normal" | "elevated" | "critical";
  featureDrift: "normal" | "elevated" | "critical";
  conceptDrift: "normal" | "elevated" | "critical";
  calibrationDrift: "normal" | "elevated" | "critical";
  latencyHealth: "normal" | "elevated" | "critical";
  confidenceHealth: "normal" | "collapsed" | "critical";
}

export interface LiveMetrics {
  predictionsToday: number;
  accuracyToday: number;
  latencyP50: number;
  latencyP99: number;
  featureFreshness: Record<string, string>;
  lastPredictionAt: string;
  errorRate: number;
}

export interface ChampionChallengerPair {
  id: string;
  modelFamilyId: string;
  championId: string;
  challengerId: string;
  trafficSplit: { champion: number; challenger: number };
  startedAt: string;
  status: "active" | "evaluating" | "switching" | "completed";
  comparisonMetrics: {
    championAccuracy: number;
    challengerAccuracy: number;
    championSharpe: number;
    challengerSharpe: number;
    significanceLevel: number;
  };
}

export interface SignalState {
  strategyId: string;
  modelId: string;
  timestamp: string;
  context: ContextType;
  directionalSignal: number;
  volatilitySignal: number;
  timingSignal: number;
  sizingSignal: number;
  metaScore: number;
  regimeState: string;
  thresholds: SignalThreshold[];
  blockers: string[];
  confidence: number;
  recentTransitions: SignalTransition[];
}

export interface SignalThreshold {
  name: string;
  currentValue: number;
  threshold: number;
  passed: boolean;
}

export interface SignalTransition {
  timestamp: string;
  from: string;
  to: string;
  reason: string;
}

export interface RegimeState {
  id: string;
  name: string;
  description: string;
  indicators: RegimeIndicator[];
  activeModels: string[];
  startedAt: string;
}

export interface RegimeIndicator {
  name: string;
  value: number;
  threshold: number;
  weight: number;
}

export interface PredictionSnapshot {
  id: string;
  modelId: string;
  timestamp: string;
  context: ContextType;
  timeframe: PredictionTimeframe;
  prediction: number;
  confidence: number;
  features: Record<string, number>;
  outcome: number | null;
  correct: boolean | null;
}

// =============================================================================
// Governance & Audit
// =============================================================================

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | "model_registered"
    | "model_promoted"
    | "model_deployed"
    | "model_deprecated"
    | "experiment_started"
    | "validation_completed"
    | "rollback"
    | "config_changed"
    | "approval_granted";
  entityType: "model" | "experiment" | "deployment" | "config";
  entityId: string;
  userId: string;
  userName: string;
  details: Record<string, unknown>;
  rationale: string | null;
}

// =============================================================================
// Alerts & Notifications
// =============================================================================

export interface MLAlert {
  id: string;
  type:
    | "drift"
    | "latency"
    | "accuracy_drop"
    | "feature_stale"
    | "confidence_collapse"
    | "regime_mismatch"
    | "error_spike";
  severity: "info" | "warning" | "critical";
  modelId: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

// =============================================================================
// Feature Provenance
// =============================================================================

export interface FeatureProvenance {
  featureName: string;
  service: string;
  instruments: string[];
  freshness: string;
  sla: string;
  status: "healthy" | "degraded" | "stale" | "unavailable";
  dependencyChain: string[];
  dataQualityScore: number;
  lastUpdated: string;
  computedBy: string;
  version: string;
}
