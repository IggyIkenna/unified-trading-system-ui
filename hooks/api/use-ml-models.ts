/**
 * ML Models Hooks
 * 
 * React Query / SWR hooks for ML service.
 * Data is subscription-filtered based on entitlements.
 */

import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface MLModel {
  id: string
  name: string
  version: string
  type: "classification" | "regression" | "time-series" | "reinforcement"
  status: "training" | "validating" | "deployed" | "archived" | "failed"
  accuracy?: number
  precision?: number
  recall?: number
  f1Score?: number
  mse?: number
  mae?: number
  sharpeRatio?: number
  targetVariable: string
  features: string[]
  trainingDataStart: string
  trainingDataEnd: string
  deployedAt?: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

export interface MLExperiment {
  id: string
  name: string
  modelId: string
  status: "running" | "completed" | "failed" | "cancelled"
  hyperparameters: Record<string, number | string | boolean>
  metrics: Record<string, number>
  startedAt: string
  completedAt?: string
  duration?: number
  notes?: string
}

export interface Feature {
  id: string
  name: string
  type: "numeric" | "categorical" | "temporal" | "text"
  source: string
  description: string
  importance?: number
  correlation?: number
  missingRate?: number
  lastUpdated: string
}

export interface TrainingJob {
  id: string
  modelId: string
  status: "queued" | "running" | "completed" | "failed"
  progress: number
  currentEpoch?: number
  totalEpochs?: number
  loss?: number
  validationLoss?: number
  startedAt: string
  estimatedCompletion?: string
  logs: string[]
}

export interface ModelValidation {
  id: string
  modelId: string
  type: "backtest" | "cross-validation" | "holdout" | "walk-forward"
  status: "running" | "completed" | "failed"
  results: ValidationResult[]
  startedAt: string
  completedAt?: string
}

export interface ValidationResult {
  metric: string
  value: number
  benchmark?: number
  percentile?: number
}

export interface ModelGovernance {
  modelId: string
  approvalStatus: "pending" | "approved" | "rejected"
  riskRating: "low" | "medium" | "high"
  complianceChecks: ComplianceCheck[]
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
}

export interface ComplianceCheck {
  name: string
  status: "pass" | "fail" | "warning"
  message: string
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UseMLModelsOptions {
  status?: string
  type?: string
}

export interface UseExperimentsOptions {
  modelId?: string
  status?: string
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch ML data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch ML models list.
 */
export function useMLModels(options: UseMLModelsOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.status) params.set("status", options.status)
  if (options.type) params.set("type", options.type)
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/ml/models?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<MLModel[]>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  return {
    models: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch a single ML model by ID.
 */
export function useMLModel(modelId: string | undefined) {
  const url = modelId
    ? `${API_CONFIG.baseUrl}/api/ml/models/${modelId}`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<MLModel>(
    url,
    fetcher
  )
  
  return {
    model: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch ML experiments.
 */
export function useExperiments(options: UseExperimentsOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.modelId) params.set("modelId", options.modelId)
  if (options.status) params.set("status", options.status)
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/ml/experiments?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<MLExperiment[]>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    experiments: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch available features for ML models.
 */
export function useFeatures() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/ml/features?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<Feature[]>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  return {
    features: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch training jobs.
 */
export function useTrainingJobs(modelId?: string) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (modelId) params.set("modelId", modelId)
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/ml/training?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<TrainingJob[]>(
    url,
    fetcher,
    { refreshInterval: 5000 } // Training jobs need frequent updates
  )
  
  return {
    jobs: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch model validation results.
 */
export function useModelValidation(modelId: string | undefined) {
  const url = modelId
    ? `${API_CONFIG.baseUrl}/api/ml/models/${modelId}/validation`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<ModelValidation[]>(
    url,
    fetcher
  )
  
  return {
    validations: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch model governance and compliance info.
 */
export function useModelGovernance(modelId: string | undefined) {
  const url = modelId
    ? `${API_CONFIG.baseUrl}/api/ml/models/${modelId}/governance`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<ModelGovernance>(
    url,
    fetcher
  )
  
  return {
    governance: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
