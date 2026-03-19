// =============================================================================
// ML Platform Mock Data
// Realistic seeded data for institutional ML operating system
// =============================================================================

import type {
  ModelFamily,
  Experiment,
  TrainingRun,
  ModelVersion,
  DatasetSnapshot,
  FeatureSetVersion,
  ValidationPackage,
  DeploymentCandidate,
  LiveDeployment,
  ChampionChallengerPair,
  SignalState,
  RegimeState,
  MLAlert,
  FeatureProvenance,
  AuditEvent,
} from "./ml-types"

// =============================================================================
// Model Families
// =============================================================================

export const MODEL_FAMILIES: ModelFamily[] = [
  {
    id: "mf-btc-direction",
    name: "BTC Direction Prediction",
    description: "Multi-timeframe directional prediction for BTC using transformer architecture",
    archetype: "DIRECTIONAL",
    assetClasses: ["CeFi", "DeFi"],
    currentChampion: "mv-btc-dir-v3.2.1",
    currentChallenger: "mv-btc-dir-v3.3.0-rc1",
    totalVersions: 12,
    linkedStrategies: ["CEFI_BTC_ML_DIR_HUF_4H", "CEFI_BTC_BASIS_SCE_1H"],
    createdAt: "2025-06-15T10:00:00Z",
    updatedAt: "2026-03-18T08:30:00Z",
  },
  {
    id: "mf-eth-volatility",
    name: "ETH Volatility Surface",
    description: "Real-time volatility surface prediction for ETH options pricing",
    archetype: "MARKET_MAKING",
    assetClasses: ["CeFi"],
    currentChampion: "mv-eth-vol-v2.1.0",
    currentChallenger: null,
    totalVersions: 8,
    linkedStrategies: ["CEFI_ETH_OPT_MM_EVT_TICK"],
    createdAt: "2025-08-20T14:00:00Z",
    updatedAt: "2026-03-17T16:45:00Z",
  },
  {
    id: "mf-multi-momentum",
    name: "Multi-Asset Momentum",
    description: "Cross-asset momentum signals with regime awareness",
    archetype: "DIRECTIONAL",
    assetClasses: ["CeFi", "TradFi"],
    currentChampion: "mv-momentum-v1.2.0",
    currentChallenger: "mv-momentum-v1.3.0-beta",
    totalVersions: 6,
    linkedStrategies: ["CEFI_ETH_MOM_HUF_4H", "CEFI_SOL_MOM_HUF_4H"],
    createdAt: "2025-11-01T09:00:00Z",
    updatedAt: "2026-03-18T07:15:00Z",
  },
  {
    id: "mf-funding-rate",
    name: "Funding Rate Predictor",
    description: "Predicts funding rate movements for basis trade entry/exit",
    archetype: "ARBITRAGE",
    assetClasses: ["CeFi", "DeFi"],
    currentChampion: "mv-funding-v2.0.0",
    currentChallenger: null,
    totalVersions: 5,
    linkedStrategies: ["CEFI_BTC_BASIS_SCE_1H", "DEFI_ETH_RSB_SCE_8H"],
    createdAt: "2025-09-10T11:00:00Z",
    updatedAt: "2026-03-16T19:30:00Z",
  },
  {
    id: "mf-sports-nfl",
    name: "NFL Outcome Predictor",
    description: "Game outcome and spread prediction for NFL using ensemble methods",
    archetype: "SPORTS_ML",
    assetClasses: ["Sports"],
    currentChampion: "mv-nfl-v1.5.0",
    currentChallenger: "mv-nfl-v1.6.0-rc1",
    totalVersions: 9,
    linkedStrategies: ["SPORTS_NFL_ARB_EVT_GAME"],
    createdAt: "2025-07-01T08:00:00Z",
    updatedAt: "2026-03-18T06:00:00Z",
  },
  {
    id: "mf-polymarket-btc",
    name: "Polymarket BTC Predictor",
    description: "Binary outcome prediction for BTC price prediction markets",
    archetype: "PREDICTION_MARKET_ML",
    assetClasses: ["Prediction"],
    currentChampion: "mv-poly-btc-v1.0.0",
    currentChallenger: null,
    totalVersions: 3,
    linkedStrategies: ["PRED_BTC_CEFI_ARB_SCE_5M"],
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-03-18T09:00:00Z",
  },
]

// =============================================================================
// Experiments
// =============================================================================

export const EXPERIMENTS: Experiment[] = [
  {
    id: "exp-456",
    name: "BTC Direction v3.3 - Attention Layers",
    description: "Testing increased attention heads with reduced embedding dimension",
    modelFamilyId: "mf-btc-direction",
    status: "running",
    progress: 72,
    datasetSnapshotId: "ds-btc-2024-q1-q4",
    featureSetVersionId: "fs-delta-one-v4.2",
    hyperparameters: {
      attention_heads: 12,
      embedding_dim: 256,
      dropout: 0.15,
      learning_rate: 0.0008,
      warmup_steps: 1000,
    },
    trainingConfig: {
      epochs: 150,
      batchSize: 256,
      learningRate: 0.0008,
      optimizer: "AdamW",
      lossFunction: "CrossEntropyWithLabelSmoothing",
      earlyStopping: true,
      earlyStoppingPatience: 15,
      gpuType: "A100",
      numGpus: 4,
    },
    metrics: {
      accuracy: 0.718,
      loss: 0.298,
      sharpe: 2.1,
      directionalAccuracy: 0.682,
      calibration: 0.92,
      precision: 0.71,
      recall: 0.69,
      turnover: 0.42,
      maxDrawdown: 0.08,
      latencyCost: 0.002,
      stabilityScore: 0.88,
    },
    startedAt: "2026-03-18T06:00:00Z",
    completedAt: null,
    createdBy: "j.chen",
    createdAt: "2026-03-17T22:00:00Z",
  },
  {
    id: "exp-455",
    name: "ETH Vol Surface - Larger Context Window",
    description: "Expanding context from 1h to 4h for vol surface modeling",
    modelFamilyId: "mf-eth-volatility",
    status: "completed",
    progress: 100,
    datasetSnapshotId: "ds-eth-options-2024",
    featureSetVersionId: "fs-volatility-v3.1",
    hyperparameters: {
      context_window: "4h",
      hidden_layers: 6,
      hidden_dim: 512,
      learning_rate: 0.0005,
    },
    trainingConfig: {
      epochs: 200,
      batchSize: 128,
      learningRate: 0.0005,
      optimizer: "Adam",
      lossFunction: "MSE",
      earlyStopping: true,
      earlyStoppingPatience: 20,
      gpuType: "A100",
      numGpus: 2,
    },
    metrics: {
      accuracy: 0.685,
      loss: 0.412,
      sharpe: 1.6,
      directionalAccuracy: 0.71,
      calibration: 0.89,
      precision: 0.68,
      recall: 0.72,
      turnover: 0.38,
      maxDrawdown: 0.12,
      latencyCost: 0.001,
      stabilityScore: 0.91,
    },
    startedAt: "2026-03-17T14:00:00Z",
    completedAt: "2026-03-17T22:30:00Z",
    createdBy: "m.patel",
    createdAt: "2026-03-17T13:00:00Z",
  },
  {
    id: "exp-454",
    name: "Multi-Momentum - Regime-Aware Gating",
    description: "Adding regime detection gating to momentum signals",
    modelFamilyId: "mf-multi-momentum",
    status: "completed",
    progress: 100,
    datasetSnapshotId: "ds-multi-asset-2024",
    featureSetVersionId: "fs-cross-instrument-v2.0",
    hyperparameters: {
      regime_embedding_dim: 32,
      gating_layers: 2,
      momentum_lookback: "20d",
      learning_rate: 0.001,
    },
    trainingConfig: {
      epochs: 100,
      batchSize: 512,
      learningRate: 0.001,
      optimizer: "AdamW",
      lossFunction: "HuberLoss",
      earlyStopping: true,
      earlyStoppingPatience: 10,
      gpuType: "V100",
      numGpus: 2,
    },
    metrics: {
      accuracy: 0.742,
      loss: 0.285,
      sharpe: 2.4,
      directionalAccuracy: 0.74,
      calibration: 0.94,
      precision: 0.76,
      recall: 0.71,
      turnover: 0.35,
      maxDrawdown: 0.06,
      latencyCost: 0.0015,
      stabilityScore: 0.93,
    },
    startedAt: "2026-03-16T20:00:00Z",
    completedAt: "2026-03-17T04:00:00Z",
    createdBy: "a.kumar",
    createdAt: "2026-03-16T19:00:00Z",
  },
  {
    id: "exp-453",
    name: "NFL Predictor - Ensemble Expansion",
    description: "Adding gradient boosting to neural ensemble",
    modelFamilyId: "mf-sports-nfl",
    status: "running",
    progress: 45,
    datasetSnapshotId: "ds-nfl-2020-2025",
    featureSetVersionId: "fs-sports-v2.1",
    hyperparameters: {
      ensemble_members: 5,
      xgb_max_depth: 8,
      xgb_learning_rate: 0.05,
      nn_hidden_dim: 256,
    },
    trainingConfig: {
      epochs: 80,
      batchSize: 64,
      learningRate: 0.001,
      optimizer: "Adam",
      lossFunction: "BCEWithLogits",
      earlyStopping: true,
      earlyStoppingPatience: 12,
      gpuType: "V100",
      numGpus: 1,
    },
    metrics: {
      accuracy: 0.612,
      loss: 0.521,
      sharpe: 1.3,
      directionalAccuracy: 0.58,
      calibration: 0.85,
      precision: 0.61,
      recall: 0.64,
      turnover: 0.25,
      maxDrawdown: 0.15,
      latencyCost: 0.0,
      stabilityScore: 0.82,
    },
    startedAt: "2026-03-18T08:00:00Z",
    completedAt: null,
    createdBy: "s.williams",
    createdAt: "2026-03-18T07:30:00Z",
  },
  {
    id: "exp-452",
    name: "Funding Rate - LSTM vs Transformer",
    description: "A/B comparison of LSTM and Transformer for funding prediction",
    modelFamilyId: "mf-funding-rate",
    status: "failed",
    progress: 23,
    datasetSnapshotId: "ds-funding-2024-2025",
    featureSetVersionId: "fs-delta-one-v4.2",
    hyperparameters: {
      model_type: "transformer",
      num_layers: 4,
      learning_rate: 0.002,
    },
    trainingConfig: {
      epochs: 120,
      batchSize: 256,
      learningRate: 0.002,
      optimizer: "AdamW",
      lossFunction: "MSE",
      earlyStopping: true,
      earlyStoppingPatience: 15,
      gpuType: "A100",
      numGpus: 2,
    },
    metrics: null,
    startedAt: "2026-03-17T10:00:00Z",
    completedAt: "2026-03-17T12:15:00Z",
    createdBy: "j.chen",
    createdAt: "2026-03-17T09:00:00Z",
  },
]

// =============================================================================
// Training Runs
// =============================================================================

export const TRAINING_RUNS: TrainingRun[] = [
  {
    id: "run-456-1",
    experimentId: "exp-456",
    status: "training",
    stage: "training",
    stageProgress: 72,
    currentEpoch: 108,
    totalEpochs: 150,
    trainLoss: 0.298,
    valLoss: 0.312,
    gpuUtilization: 94,
    memoryUsage: 78,
    estimatedTimeRemaining: "2h 15m",
    startedAt: "2026-03-18T06:05:00Z",
    logs: [
      { timestamp: "2026-03-18T09:30:00Z", level: "info", message: "Epoch 108/150 completed. Train loss: 0.298, Val loss: 0.312" },
      { timestamp: "2026-03-18T09:28:00Z", level: "info", message: "Checkpoint saved: ckpt-108.pt" },
      { timestamp: "2026-03-18T09:15:00Z", level: "warning", message: "GPU memory usage above 75%, consider reducing batch size" },
    ],
    artifacts: [
      { id: "art-1", type: "checkpoint", path: "s3://ml-artifacts/exp-456/ckpt-108.pt", size: 1200000000, createdAt: "2026-03-18T09:28:00Z" },
      { id: "art-2", type: "metrics", path: "s3://ml-artifacts/exp-456/metrics.json", size: 45000, createdAt: "2026-03-18T09:30:00Z" },
    ],
    checkpoints: ["ckpt-25.pt", "ckpt-50.pt", "ckpt-75.pt", "ckpt-100.pt", "ckpt-108.pt"],
  },
  {
    id: "run-453-1",
    experimentId: "exp-453",
    status: "training",
    stage: "training",
    stageProgress: 45,
    currentEpoch: 36,
    totalEpochs: 80,
    trainLoss: 0.521,
    valLoss: 0.548,
    gpuUtilization: 82,
    memoryUsage: 65,
    estimatedTimeRemaining: "3h 45m",
    startedAt: "2026-03-18T08:10:00Z",
    logs: [
      { timestamp: "2026-03-18T09:35:00Z", level: "info", message: "Epoch 36/80 completed. Train loss: 0.521, Val loss: 0.548" },
      { timestamp: "2026-03-18T09:00:00Z", level: "info", message: "Ensemble member 3/5 initialized" },
    ],
    artifacts: [
      { id: "art-3", type: "checkpoint", path: "s3://ml-artifacts/exp-453/ckpt-36.pt", size: 450000000, createdAt: "2026-03-18T09:35:00Z" },
    ],
    checkpoints: ["ckpt-25.pt", "ckpt-36.pt"],
  },
]

// =============================================================================
// Model Versions
// =============================================================================

export const MODEL_VERSIONS: ModelVersion[] = [
  {
    id: "mv-btc-dir-v3.2.1",
    modelFamilyId: "mf-btc-direction",
    version: "3.2.1",
    experimentId: "exp-420",
    status: "live",
    isChampion: true,
    isChallenger: false,
    metrics: {
      accuracy: 0.72,
      sharpe: 2.1,
      maxDrawdown: 0.085,
      directionalAccuracy: 0.68,
      calibration: 0.91,
      inferenceLatencyP50: 3.2,
      inferenceLatencyP99: 8.5,
      predictionCount: 142850,
      lastPredictionAt: "2026-03-18T09:45:00Z",
    },
    validationPackageId: "vp-btc-dir-v321",
    deploymentCandidateId: null,
    liveDeploymentId: "ld-btc-dir-001",
    registeredAt: "2026-02-15T10:00:00Z",
    registeredBy: "j.chen",
    approvedAt: "2026-02-18T14:00:00Z",
    approvedBy: "d.smith",
    lineage: {
      parentModelId: "mv-btc-dir-v3.2.0",
      datasetSnapshotId: "ds-btc-2024-q1-q4",
      featureSetVersionId: "fs-delta-one-v4.1",
      trainingConfigHash: "abc123def456",
      codeCommitHash: "7890abc",
    },
  },
  {
    id: "mv-btc-dir-v3.3.0-rc1",
    modelFamilyId: "mf-btc-direction",
    version: "3.3.0-rc1",
    experimentId: "exp-445",
    status: "shadow",
    isChampion: false,
    isChallenger: true,
    metrics: {
      accuracy: 0.735,
      sharpe: 2.25,
      maxDrawdown: 0.072,
      directionalAccuracy: 0.71,
      calibration: 0.93,
      inferenceLatencyP50: 3.8,
      inferenceLatencyP99: 9.2,
      predictionCount: 8420,
      lastPredictionAt: "2026-03-18T09:45:00Z",
    },
    validationPackageId: "vp-btc-dir-v330rc1",
    deploymentCandidateId: "dc-btc-v330rc1",
    liveDeploymentId: null,
    registeredAt: "2026-03-12T11:00:00Z",
    registeredBy: "j.chen",
    approvedAt: null,
    approvedBy: null,
    lineage: {
      parentModelId: "mv-btc-dir-v3.2.1",
      datasetSnapshotId: "ds-btc-2024-q1-q4",
      featureSetVersionId: "fs-delta-one-v4.2",
      trainingConfigHash: "def456ghi789",
      codeCommitHash: "abc1234",
    },
  },
  {
    id: "mv-eth-vol-v2.1.0",
    modelFamilyId: "mf-eth-volatility",
    version: "2.1.0",
    experimentId: "exp-398",
    status: "live",
    isChampion: true,
    isChallenger: false,
    metrics: {
      accuracy: 0.68,
      sharpe: 1.6,
      maxDrawdown: 0.12,
      directionalAccuracy: 0.65,
      calibration: 0.88,
      inferenceLatencyP50: 2.8,
      inferenceLatencyP99: 6.5,
      predictionCount: 89420,
      lastPredictionAt: "2026-03-18T09:44:58Z",
    },
    validationPackageId: "vp-eth-vol-v210",
    deploymentCandidateId: null,
    liveDeploymentId: "ld-eth-vol-001",
    registeredAt: "2026-01-20T09:00:00Z",
    registeredBy: "m.patel",
    approvedAt: "2026-01-25T11:00:00Z",
    approvedBy: "d.smith",
    lineage: {
      parentModelId: "mv-eth-vol-v2.0.0",
      datasetSnapshotId: "ds-eth-options-2024",
      featureSetVersionId: "fs-volatility-v3.0",
      trainingConfigHash: "xyz789abc123",
      codeCommitHash: "def5678",
    },
  },
  {
    id: "mv-momentum-v1.2.0",
    modelFamilyId: "mf-multi-momentum",
    version: "1.2.0",
    experimentId: "exp-412",
    status: "live",
    isChampion: true,
    isChallenger: false,
    metrics: {
      accuracy: 0.71,
      sharpe: 2.0,
      maxDrawdown: 0.09,
      directionalAccuracy: 0.69,
      calibration: 0.90,
      inferenceLatencyP50: 4.1,
      inferenceLatencyP99: 10.2,
      predictionCount: 45620,
      lastPredictionAt: "2026-03-18T09:45:00Z",
    },
    validationPackageId: "vp-momentum-v120",
    deploymentCandidateId: null,
    liveDeploymentId: "ld-momentum-001",
    registeredAt: "2026-02-28T15:00:00Z",
    registeredBy: "a.kumar",
    approvedAt: "2026-03-02T10:00:00Z",
    approvedBy: "d.smith",
    lineage: {
      parentModelId: "mv-momentum-v1.1.0",
      datasetSnapshotId: "ds-multi-asset-2024",
      featureSetVersionId: "fs-cross-instrument-v1.9",
      trainingConfigHash: "hij456klm789",
      codeCommitHash: "ghi9012",
    },
  },
]

// =============================================================================
// Live Deployments
// =============================================================================

export const LIVE_DEPLOYMENTS: LiveDeployment[] = [
  {
    id: "ld-btc-dir-001",
    modelVersionId: "mv-btc-dir-v3.2.1",
    strategyIds: ["CEFI_BTC_ML_DIR_HUF_4H", "CEFI_BTC_BASIS_SCE_1H"],
    status: "active",
    deployedAt: "2026-02-20T08:00:00Z",
    deployedBy: "d.smith",
    health: {
      overall: "healthy",
      predictionDrift: "normal",
      featureDrift: "normal",
      conceptDrift: "normal",
      calibrationDrift: "normal",
      latencyHealth: "normal",
      confidenceHealth: "normal",
    },
    metrics: {
      predictionsToday: 4280,
      accuracyToday: 0.715,
      latencyP50: 3.4,
      latencyP99: 8.8,
      featureFreshness: {
        "btc_price": "0.5s",
        "funding_rate": "2s",
        "orderbook_imbalance": "0.2s",
      },
      lastPredictionAt: "2026-03-18T09:45:00Z",
      errorRate: 0.001,
    },
  },
  {
    id: "ld-eth-vol-001",
    modelVersionId: "mv-eth-vol-v2.1.0",
    strategyIds: ["CEFI_ETH_OPT_MM_EVT_TICK"],
    status: "degraded",
    deployedAt: "2026-01-28T10:00:00Z",
    deployedBy: "d.smith",
    health: {
      overall: "warning",
      predictionDrift: "elevated",
      featureDrift: "normal",
      conceptDrift: "elevated",
      calibrationDrift: "normal",
      latencyHealth: "normal",
      confidenceHealth: "normal",
    },
    metrics: {
      predictionsToday: 12450,
      accuracyToday: 0.642,
      latencyP50: 2.9,
      latencyP99: 6.8,
      featureFreshness: {
        "eth_iv": "1s",
        "eth_skew": "2s",
        "eth_term_structure": "5s",
      },
      lastPredictionAt: "2026-03-18T09:44:58Z",
      errorRate: 0.002,
    },
  },
  {
    id: "ld-momentum-001",
    modelVersionId: "mv-momentum-v1.2.0",
    strategyIds: ["CEFI_ETH_MOM_HUF_4H", "CEFI_SOL_MOM_HUF_4H"],
    status: "active",
    deployedAt: "2026-03-05T09:00:00Z",
    deployedBy: "d.smith",
    health: {
      overall: "healthy",
      predictionDrift: "normal",
      featureDrift: "normal",
      conceptDrift: "normal",
      calibrationDrift: "normal",
      latencyHealth: "normal",
      confidenceHealth: "normal",
    },
    metrics: {
      predictionsToday: 48,
      accuracyToday: 0.729,
      latencyP50: 4.2,
      latencyP99: 10.5,
      featureFreshness: {
        "momentum_20d": "1m",
        "regime_state": "5m",
        "cross_asset_correlation": "1m",
      },
      lastPredictionAt: "2026-03-18T08:00:00Z",
      errorRate: 0.0,
    },
  },
]

// =============================================================================
// Champion/Challenger Pairs
// =============================================================================

export const CHAMPION_CHALLENGER_PAIRS: ChampionChallengerPair[] = [
  {
    id: "cc-btc-dir-001",
    modelFamilyId: "mf-btc-direction",
    championId: "mv-btc-dir-v3.2.1",
    challengerId: "mv-btc-dir-v3.3.0-rc1",
    trafficSplit: { champion: 90, challenger: 10 },
    startedAt: "2026-03-15T08:00:00Z",
    status: "active",
    comparisonMetrics: {
      championAccuracy: 0.715,
      challengerAccuracy: 0.738,
      championSharpe: 2.08,
      challengerSharpe: 2.31,
      significanceLevel: 0.82,
    },
  },
]

// =============================================================================
// ML Alerts
// =============================================================================

export const ML_ALERTS: MLAlert[] = [
  {
    id: "alert-001",
    type: "drift",
    severity: "warning",
    modelId: "mv-eth-vol-v2.1.0",
    message: "Prediction drift detected: model accuracy dropped 4% below baseline",
    metric: "accuracy",
    currentValue: 0.642,
    threshold: 0.68,
    triggeredAt: "2026-03-18T08:30:00Z",
    acknowledgedAt: null,
    resolvedAt: null,
  },
  {
    id: "alert-002",
    type: "feature_stale",
    severity: "info",
    modelId: "mv-momentum-v1.2.0",
    message: "Feature 'regime_state' freshness exceeds SLA by 2 minutes",
    metric: "freshness",
    currentValue: 7,
    threshold: 5,
    triggeredAt: "2026-03-18T07:45:00Z",
    acknowledgedAt: "2026-03-18T08:00:00Z",
    resolvedAt: "2026-03-18T08:15:00Z",
  },
  {
    id: "alert-003",
    type: "latency",
    severity: "warning",
    modelId: "mv-btc-dir-v3.3.0-rc1",
    message: "Challenger model P99 latency elevated during shadow testing",
    metric: "latency_p99",
    currentValue: 12.5,
    threshold: 10.0,
    triggeredAt: "2026-03-18T09:15:00Z",
    acknowledgedAt: null,
    resolvedAt: null,
  },
]

// =============================================================================
// Feature Provenance
// =============================================================================

export const FEATURE_PROVENANCE: FeatureProvenance[] = [
  {
    featureName: "btc_price",
    service: "features-delta-one-service",
    instruments: ["BTCUSDT", "BTCUSD"],
    freshness: "0.5s",
    sla: "1s",
    status: "healthy",
    dependencyChain: ["binance-ws", "okx-ws", "aggregator"],
    dataQualityScore: 0.998,
    lastUpdated: "2026-03-18T09:45:00Z",
    computedBy: "delta-one-pipeline",
    version: "4.2.1",
  },
  {
    featureName: "funding_rate",
    service: "features-delta-one-service",
    instruments: ["BTCUSDT-PERP", "ETHUSDT-PERP"],
    freshness: "2s",
    sla: "5s",
    status: "healthy",
    dependencyChain: ["binance-api", "bybit-api", "funding-aggregator"],
    dataQualityScore: 0.995,
    lastUpdated: "2026-03-18T09:44:58Z",
    computedBy: "delta-one-pipeline",
    version: "4.2.1",
  },
  {
    featureName: "eth_iv",
    service: "features-volatility-service",
    instruments: ["ETH-OPTIONS"],
    freshness: "1s",
    sla: "2s",
    status: "healthy",
    dependencyChain: ["deribit-ws", "okx-options-ws", "vol-surface-builder"],
    dataQualityScore: 0.992,
    lastUpdated: "2026-03-18T09:44:59Z",
    computedBy: "volatility-pipeline",
    version: "3.1.0",
  },
  {
    featureName: "regime_state",
    service: "features-multi-timeframe-service",
    instruments: ["BTC", "ETH", "SOL"],
    freshness: "45s",
    sla: "30s",
    status: "degraded",
    dependencyChain: ["price-feeds", "vol-feeds", "regime-classifier"],
    dataQualityScore: 0.975,
    lastUpdated: "2026-03-18T09:44:15Z",
    computedBy: "regime-pipeline",
    version: "2.0.3",
  },
  {
    featureName: "momentum_20d",
    service: "features-cross-instrument-service",
    instruments: ["BTC", "ETH", "SOL", "AVAX"],
    freshness: "1m",
    sla: "2m",
    status: "healthy",
    dependencyChain: ["daily-prices", "momentum-calculator"],
    dataQualityScore: 0.999,
    lastUpdated: "2026-03-18T09:44:00Z",
    computedBy: "momentum-pipeline",
    version: "2.1.0",
  },
  {
    featureName: "orderbook_imbalance",
    service: "features-delta-one-service",
    instruments: ["BTCUSDT", "ETHUSDT"],
    freshness: "0.2s",
    sla: "0.5s",
    status: "healthy",
    dependencyChain: ["binance-ws", "okx-ws", "orderbook-processor"],
    dataQualityScore: 0.997,
    lastUpdated: "2026-03-18T09:45:00Z",
    computedBy: "orderbook-pipeline",
    version: "4.2.1",
  },
]

// =============================================================================
// Regime States
// =============================================================================

export const REGIME_STATES: RegimeState[] = [
  {
    id: "regime-current",
    name: "Risk-On Trending",
    description: "Positive momentum with elevated volatility but bullish bias",
    indicators: [
      { name: "trend_strength", value: 0.72, threshold: 0.5, weight: 0.3 },
      { name: "volatility_regime", value: 0.65, threshold: 0.7, weight: 0.25 },
      { name: "correlation_regime", value: 0.45, threshold: 0.6, weight: 0.2 },
      { name: "liquidity_regime", value: 0.82, threshold: 0.5, weight: 0.25 },
    ],
    activeModels: ["mv-btc-dir-v3.2.1", "mv-momentum-v1.2.0"],
    startedAt: "2026-03-15T14:00:00Z",
  },
]

// =============================================================================
// Audit Events
// =============================================================================

export const AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "audit-001",
    timestamp: "2026-03-18T09:00:00Z",
    eventType: "experiment_started",
    entityType: "experiment",
    entityId: "exp-456",
    userId: "j.chen",
    userName: "Jason Chen",
    details: { gpus: 4, estimated_duration: "8h" },
    rationale: "Testing attention layer improvements for v3.3 release",
  },
  {
    id: "audit-002",
    timestamp: "2026-03-15T08:00:00Z",
    eventType: "model_promoted",
    entityType: "model",
    entityId: "mv-btc-dir-v3.3.0-rc1",
    userId: "d.smith",
    userName: "David Smith",
    details: { from_stage: "validated", to_stage: "shadow", traffic_split: "10%" },
    rationale: "Challenger shows +2.3% accuracy improvement in validation. Starting shadow test.",
  },
  {
    id: "audit-003",
    timestamp: "2026-03-12T11:00:00Z",
    eventType: "model_registered",
    entityType: "model",
    entityId: "mv-btc-dir-v3.3.0-rc1",
    userId: "j.chen",
    userName: "Jason Chen",
    details: { version: "3.3.0-rc1", experiment_id: "exp-445" },
    rationale: "New release candidate with improved attention mechanism",
  },
  {
    id: "audit-004",
    timestamp: "2026-02-20T08:00:00Z",
    eventType: "model_deployed",
    entityType: "deployment",
    entityId: "ld-btc-dir-001",
    userId: "d.smith",
    userName: "David Smith",
    details: { model_version: "3.2.1", strategies: ["CEFI_BTC_ML_DIR_HUF_4H", "CEFI_BTC_BASIS_SCE_1H"] },
    rationale: "Production deployment after successful 1-week gate",
  },
]

// =============================================================================
// Signal States (for Signal State page)
// =============================================================================

export const SIGNAL_STATES: SignalState[] = [
  {
    strategyId: "CEFI_BTC_ML_DIR_HUF_4H",
    modelId: "mv-btc-dir-v3.2.1",
    timestamp: "2026-03-18T09:45:00Z",
    context: "LIVE",
    directionalSignal: 0.68,
    volatilitySignal: 0.45,
    timingSignal: 0.72,
    sizingSignal: 0.55,
    metaScore: 0.61,
    regimeState: "Risk-On Trending",
    thresholds: [
      { name: "min_directional", currentValue: 0.68, threshold: 0.5, passed: true },
      { name: "min_meta_score", currentValue: 0.61, threshold: 0.4, passed: true },
      { name: "max_volatility", currentValue: 0.45, threshold: 0.8, passed: true },
      { name: "min_confidence", currentValue: 0.82, threshold: 0.7, passed: true },
    ],
    blockers: [],
    confidence: 0.82,
    recentTransitions: [
      { timestamp: "2026-03-18T08:00:00Z", from: "HOLD", to: "LONG", reason: "Directional signal crossed threshold" },
      { timestamp: "2026-03-17T16:00:00Z", from: "LONG", to: "HOLD", reason: "Meta score dropped below threshold" },
    ],
  },
]

// =============================================================================
// Dataset Snapshots
// =============================================================================

export const DATASET_SNAPSHOTS: DatasetSnapshot[] = [
  {
    id: "ds-btc-2024-q1-q4",
    name: "BTC Training Data 2024 Q1-Q4",
    description: "Full year BTC data with orderbook, funding, and price features",
    instruments: ["BTCUSDT", "BTCUSD", "BTCUSDT-PERP"],
    dateRange: { start: "2024-01-01", end: "2024-12-31" },
    rowCount: 31536000,
    sizeBytes: 8500000000,
    features: ["price", "volume", "orderbook_imbalance", "funding_rate", "oi_change"],
    createdAt: "2025-01-05T10:00:00Z",
    createdBy: "data-pipeline",
  },
  {
    id: "ds-eth-options-2024",
    name: "ETH Options Data 2024",
    description: "ETH options chain data with vol surface features",
    instruments: ["ETH-OPTIONS"],
    dateRange: { start: "2024-01-01", end: "2024-12-31" },
    rowCount: 15768000,
    sizeBytes: 4200000000,
    features: ["iv", "skew", "term_structure", "greeks", "spot_price"],
    createdAt: "2025-01-10T14:00:00Z",
    createdBy: "data-pipeline",
  },
]

// =============================================================================
// Feature Set Versions
// =============================================================================

export const FEATURE_SET_VERSIONS: FeatureSetVersion[] = [
  {
    id: "fs-delta-one-v4.2",
    name: "Delta One Features",
    version: "4.2",
    features: [
      { name: "btc_price", type: "numeric", source: "features-delta-one-service", sla: "1s", description: "BTC mid price" },
      { name: "funding_rate", type: "numeric", source: "features-delta-one-service", sla: "5s", description: "Perp funding rate" },
      { name: "orderbook_imbalance", type: "numeric", source: "features-delta-one-service", sla: "0.5s", description: "Top 10 level imbalance" },
      { name: "oi_change", type: "numeric", source: "features-delta-one-service", sla: "5s", description: "Open interest change 1h" },
    ],
    services: ["features-delta-one-service"],
    createdAt: "2026-02-01T10:00:00Z",
    createdBy: "a.kumar",
  },
  {
    id: "fs-volatility-v3.1",
    name: "Volatility Features",
    version: "3.1",
    features: [
      { name: "eth_iv", type: "numeric", source: "features-volatility-service", sla: "2s", description: "ETH ATM implied vol" },
      { name: "eth_skew", type: "numeric", source: "features-volatility-service", sla: "2s", description: "25-delta skew" },
      { name: "eth_term_structure", type: "timeseries", source: "features-volatility-service", sla: "5s", description: "Term structure curve" },
    ],
    services: ["features-volatility-service"],
    createdAt: "2026-01-15T09:00:00Z",
    createdBy: "m.patel",
  },
]

// =============================================================================
// Validation Packages
// =============================================================================

export const VALIDATION_PACKAGES: ValidationPackage[] = [
  {
    id: "vp-btc-dir-v330rc1",
    modelVersionId: "mv-btc-dir-v3.3.0-rc1",
    status: "passed",
    validationType: "walk_forward",
    periodStart: "2024-07-01",
    periodEnd: "2024-12-31",
    regimes: [
      { regime: "Risk-On", sharpe: 2.45, accuracy: 0.74, drawdown: 0.06, sampleSize: 1200 },
      { regime: "Risk-Off", sharpe: 1.85, accuracy: 0.71, drawdown: 0.09, sampleSize: 800 },
      { regime: "High-Vol", sharpe: 2.1, accuracy: 0.69, drawdown: 0.12, sampleSize: 450 },
      { regime: "Low-Vol", sharpe: 2.6, accuracy: 0.76, drawdown: 0.04, sampleSize: 950 },
    ],
    factorSensitivity: [
      { factor: "BTC_trend", sensitivity: 0.82, pValue: 0.001 },
      { factor: "funding_rate", sensitivity: 0.45, pValue: 0.02 },
      { factor: "volatility", sensitivity: -0.32, pValue: 0.05 },
    ],
    comparisonResults: {
      baselineModelId: "mv-btc-dir-v3.2.1",
      sharpeUplift: 0.15,
      accuracyUplift: 0.023,
      drawdownReduction: 0.013,
      significanceLevel: 0.95,
    },
    createdAt: "2026-03-10T10:00:00Z",
    completedAt: "2026-03-11T14:00:00Z",
  },
]

// =============================================================================
// Deployment Candidates
// =============================================================================

export const DEPLOYMENT_CANDIDATES: DeploymentCandidate[] = [
  {
    id: "dc-btc-v330rc1",
    modelVersionId: "mv-btc-dir-v3.3.0-rc1",
    targetStrategyIds: ["CEFI_BTC_ML_DIR_HUF_4H", "CEFI_BTC_BASIS_SCE_1H"],
    status: "shadow_running",
    configVersion: "cfg-btc-dir-v12",
    featureDependencies: [
      { featureName: "btc_price", service: "features-delta-one-service", status: "available", latency: 3.2, freshness: "0.5s" },
      { featureName: "funding_rate", service: "features-delta-one-service", status: "available", latency: 2.1, freshness: "2s" },
      { featureName: "orderbook_imbalance", service: "features-delta-one-service", status: "available", latency: 1.8, freshness: "0.2s" },
    ],
    shadowResults: {
      duration: "3d",
      predictionCount: 8420,
      accuracy: 0.738,
      latencyP50: 3.8,
      latencyP99: 9.2,
      errorRate: 0.0008,
      championComparison: {
        accuracyDelta: 0.023,
        latencyDelta: 0.6,
      },
    },
    gates: [
      { id: "g-shadow", name: "Shadow Test", type: "shadow", status: "passed", requiredMetric: "error_rate", threshold: 0.01, actualValue: 0.0008, passedAt: "2026-03-18T08:00:00Z" },
      { id: "g-1d", name: "1-Day Gate", type: "1d", status: "pending", requiredMetric: "accuracy", threshold: 0.70, actualValue: 0.738, passedAt: null },
      { id: "g-1w", name: "1-Week Gate", type: "1w", status: "pending", requiredMetric: "sharpe", threshold: 1.8, actualValue: null, passedAt: null },
    ],
    blockingIssues: [],
    expectedImpact: {
      sharpeChange: 0.15,
      accuracyChange: 0.023,
      latencyChange: 0.6,
      capitalAtRisk: 250000,
    },
    createdAt: "2026-03-15T08:00:00Z",
    approvedAt: null,
    approvedBy: null,
  },
]
