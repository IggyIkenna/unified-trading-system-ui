/**
 * ML MSW Handler
 * 
 * Mock handlers for ML service.
 * Data is subscription-filtered based on entitlements.
 * 
 * REAL endpoints (exist in openapi.json):
 *   GET /api/ml/models — list models
 *   GET /api/ml/models/:id — get model details
 *   GET /api/ml/experiments — list experiments
 * 
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/ml/features — feature store
 *   GET /api/ml/training — training jobs
 *   GET /api/ml/models/:id/validation — validation results
 *   GET /api/ml/models/:id/governance — compliance info
 */

import { http, HttpResponse, delay } from "msw"
import { API_CONFIG } from "@/lib/config"
import { getPersonaFromRequest, generateMockId } from "../utils"

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

const MODEL_TYPES = ["classification", "regression", "time-series", "reinforcement"]
const MODEL_STATUSES = ["training", "validating", "deployed", "archived"]
const FEATURES = [
  "price_momentum_1h", "price_momentum_24h", "volume_ratio", "volatility_7d",
  "rsi_14", "macd_signal", "bollinger_position", "order_book_imbalance",
  "funding_rate", "open_interest_change", "social_sentiment", "whale_activity"
]

function generateModels(count: number, hasFullAccess: boolean) {
  return Array.from({ length: count }, (_, i) => ({
    id: generateMockId(),
    name: `Model-${["Alpha", "Beta", "Gamma", "Delta", "Epsilon"][i % 5]}-${i + 1}`,
    version: `${Math.floor(i / 5) + 1}.${i % 5}.0`,
    type: MODEL_TYPES[i % MODEL_TYPES.length] as "classification" | "regression" | "time-series" | "reinforcement",
    status: hasFullAccess ? MODEL_STATUSES[i % MODEL_STATUSES.length] as "training" | "validating" | "deployed" | "archived" : "deployed",
    accuracy: 0.75 + Math.random() * 0.2,
    precision: 0.7 + Math.random() * 0.25,
    recall: 0.65 + Math.random() * 0.3,
    f1Score: 0.7 + Math.random() * 0.2,
    sharpeRatio: 1.5 + Math.random() * 2,
    targetVariable: ["price_direction", "volatility", "return", "risk"][i % 4],
    features: FEATURES.slice(0, 6 + (i % 6)),
    trainingDataStart: "2023-01-01",
    trainingDataEnd: "2024-01-01",
    deployedAt: MODEL_STATUSES[i % MODEL_STATUSES.length] === "deployed" 
      ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() 
      : undefined,
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { framework: "pytorch", gpu: true },
  }))
}

function generateExperiments(modelId: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: generateMockId(),
    name: `Experiment-${i + 1}`,
    modelId,
    status: ["running", "completed", "failed", "cancelled"][i % 4] as "running" | "completed" | "failed" | "cancelled",
    hyperparameters: {
      learning_rate: 0.001 * (i + 1),
      batch_size: 32 * Math.pow(2, i % 4),
      epochs: 50 + i * 10,
      dropout: 0.1 + (i % 5) * 0.1,
    },
    metrics: {
      accuracy: 0.7 + Math.random() * 0.25,
      loss: 0.1 + Math.random() * 0.3,
      val_accuracy: 0.65 + Math.random() * 0.25,
      val_loss: 0.15 + Math.random() * 0.35,
    },
    startedAt: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: i % 4 !== 0 ? new Date(Date.now() - (count - i - 1) * 24 * 60 * 60 * 1000).toISOString() : undefined,
    duration: i % 4 !== 0 ? Math.floor(Math.random() * 3600) + 600 : undefined,
  }))
}

function generateFeatures() {
  return FEATURES.map((name, i) => ({
    id: generateMockId(),
    name,
    type: ["numeric", "categorical", "temporal"][i % 3] as "numeric" | "categorical" | "temporal",
    source: ["market_data", "on_chain", "social", "derived"][i % 4],
    description: `Feature description for ${name}`,
    importance: Math.random(),
    correlation: Math.random() * 2 - 1,
    missingRate: Math.random() * 0.05,
    lastUpdated: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
  }))
}

function generateTrainingJobs(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: generateMockId(),
    modelId: generateMockId(),
    status: ["queued", "running", "completed", "failed"][i % 4] as "queued" | "running" | "completed" | "failed",
    progress: i % 4 === 1 ? Math.floor(Math.random() * 100) : i % 4 === 2 ? 100 : 0,
    currentEpoch: i % 4 === 1 ? Math.floor(Math.random() * 50) : undefined,
    totalEpochs: 100,
    loss: i % 4 >= 1 ? 0.1 + Math.random() * 0.3 : undefined,
    validationLoss: i % 4 >= 1 ? 0.15 + Math.random() * 0.35 : undefined,
    startedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    estimatedCompletion: i % 4 === 1 ? new Date(Date.now() + Math.random() * 6 * 60 * 60 * 1000).toISOString() : undefined,
    logs: [`[INFO] Training started`, `[INFO] Epoch ${Math.floor(Math.random() * 50)} completed`],
  }))
}

// =============================================================================
// HANDLERS
// =============================================================================

export const mlHandlers = [
  // GET /api/ml/models (REAL)
  http.get(`${API_CONFIG.baseUrl}/api/ml/models`, async ({ request }) => {
    await delay(200)
    
    const persona = getPersonaFromRequest(request)
    const url = new URL(request.url)
    
    const hasMLAccess = persona.role === "internal" || persona.entitlements?.includes("ml-full")
    if (!hasMLAccess) {
      return HttpResponse.json([]) // Limited access shows no models
    }
    
    const modelCount = persona.role === "internal" ? 20 : 10
    let models = generateModels(modelCount, persona.role === "internal")
    
    // Apply filters
    const status = url.searchParams.get("status")
    const type = url.searchParams.get("type")
    
    if (status) models = models.filter(m => m.status === status)
    if (type) models = models.filter(m => m.type === type)
    
    return HttpResponse.json(models)
  }),

  // GET /api/ml/models/:id (REAL)
  http.get(`${API_CONFIG.baseUrl}/api/ml/models/:id`, async ({ request, params }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const hasMLAccess = persona.role === "internal" || persona.entitlements?.includes("ml-full")
    
    if (!hasMLAccess) {
      return new HttpResponse(null, { status: 403 })
    }
    
    const models = generateModels(1, persona.role === "internal")
    const model = { ...models[0], id: params.id as string }
    
    return HttpResponse.json(model)
  }),

  // GET /api/ml/experiments (REAL)
  http.get(`${API_CONFIG.baseUrl}/api/ml/experiments`, async ({ request }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const url = new URL(request.url)
    const modelId = url.searchParams.get("modelId") || generateMockId()
    
    const hasMLAccess = persona.role === "internal" || persona.entitlements?.includes("ml-full")
    if (!hasMLAccess) {
      return HttpResponse.json([])
    }
    
    const experimentCount = persona.role === "internal" ? 15 : 8
    let experiments = generateExperiments(modelId, experimentCount)
    
    const status = url.searchParams.get("status")
    if (status) experiments = experiments.filter(e => e.status === status)
    
    return HttpResponse.json(experiments)
  }),

  // GET /api/ml/features (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/ml/features`, async ({ request }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const hasMLAccess = persona.role === "internal" || persona.entitlements?.includes("ml-full")
    
    if (!hasMLAccess) {
      return HttpResponse.json([])
    }
    
    const features = generateFeatures()
    return HttpResponse.json(features)
  }),

  // GET /api/ml/training (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/ml/training`, async ({ request }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const hasMLAccess = persona.role === "internal" || persona.entitlements?.includes("ml-full")
    
    if (!hasMLAccess) {
      return HttpResponse.json([])
    }
    
    const jobCount = persona.role === "internal" ? 10 : 5
    const jobs = generateTrainingJobs(jobCount)
    
    return HttpResponse.json(jobs)
  }),

  // GET /api/ml/models/:id/validation (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/ml/models/:id/validation`, async ({ request }) => {
    await delay(200)
    
    const validations = [
      {
        id: generateMockId(),
        modelId: "model-1",
        type: "backtest" as const,
        status: "completed" as const,
        results: [
          { metric: "Sharpe Ratio", value: 1.85, benchmark: 1.5, percentile: 75 },
          { metric: "Max Drawdown", value: -0.12, benchmark: -0.15, percentile: 80 },
          { metric: "Win Rate", value: 0.58, benchmark: 0.55, percentile: 65 },
        ],
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
    
    return HttpResponse.json(validations)
  }),

  // GET /api/ml/models/:id/governance (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/ml/models/:id/governance`, async ({ request, params }) => {
    await delay(150)
    
    const governance = {
      modelId: params.id,
      approvalStatus: "approved" as const,
      riskRating: "medium" as const,
      complianceChecks: [
        { name: "Data Privacy", status: "pass" as const, message: "No PII detected in training data" },
        { name: "Model Explainability", status: "pass" as const, message: "SHAP values available" },
        { name: "Bias Check", status: "warning" as const, message: "Minor temporal bias detected" },
      ],
      reviewedBy: "compliance@odum.io",
      reviewedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    }
    
    return HttpResponse.json(governance)
  }),
]
