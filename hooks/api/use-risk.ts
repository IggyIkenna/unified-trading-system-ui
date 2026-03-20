/**
 * Risk Hooks
 * 
 * React Query / SWR hooks for risk service.
 * All data is client-scoped via org context from useAuth().
 */

import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface RiskLimit {
  id: string
  name: string
  type: "position" | "exposure" | "var" | "drawdown" | "concentration"
  scope: "portfolio" | "venue" | "category" | "instrument"
  scopeValue?: string
  limit: number
  current: number
  utilizationPercent: number
  status: "ok" | "warning" | "breach"
  warningThreshold: number
  breachThreshold: number
  updatedAt: string
}

export interface Exposure {
  gross: number
  net: number
  long: number
  short: number
  byVenue: Record<string, number>
  byCategory: Record<string, number>
  byRiskGroup: Record<string, number>
}

export interface VaRMetrics {
  var95: number
  var99: number
  cvar95: number
  cvar99: number
  horizon: string
  method: "historical" | "parametric" | "monte-carlo"
  confidence: number
  byVenue?: Record<string, number>
  byCategory?: Record<string, number>
  breakdown?: VaRBreakdown[]
}

export interface VaRBreakdown {
  component: string
  contribution: number
  marginalVar: number
  componentVar: number
}

export interface Greeks {
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  byInstrument?: Record<string, Greeks>
}

export interface StressScenario {
  id: string
  name: string
  description: string
  type: "historical" | "hypothetical"
  impact: number
  impactPercent: number
  assumptions: Record<string, number>
  results: StressScenarioResult[]
}

export interface StressScenarioResult {
  metric: string
  baseline: number
  stressed: number
  change: number
  changePercent: number
}

export interface RiskSummary {
  overallStatus: "ok" | "warning" | "critical"
  totalLimits: number
  breachedLimits: number
  warningLimits: number
  portfolioVar: number
  netExposure: number
  grossExposure: number
  lastUpdated: string
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UseRiskLimitsOptions {
  scope?: "portfolio" | "venue" | "category" | "instrument"
  status?: "ok" | "warning" | "breach"
}

export interface UseStressScenariosOptions {
  type?: "historical" | "hypothetical"
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch risk data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch risk summary dashboard data.
 */
export function useRiskSummary() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/risk/summary?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<RiskSummary>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    summary: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch risk limits with optional filtering.
 */
export function useRiskLimits(options: UseRiskLimitsOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.scope) params.set("scope", options.scope)
  if (options.status) params.set("status", options.status)
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/risk/limits?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<RiskLimit[]>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    limits: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch exposure breakdown.
 */
export function useExposure() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/risk/exposure?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<Exposure>(
    url,
    fetcher,
    { refreshInterval: 5000 }
  )
  
  return {
    exposure: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch VaR metrics.
 */
export function useVaR() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/risk/var?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<VaRMetrics>(
    url,
    fetcher,
    { refreshInterval: 60000 } // VaR calculated less frequently
  )
  
  return {
    var: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch portfolio Greeks.
 */
export function useGreeks() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/risk/greeks?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<Greeks>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    greeks: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch stress test scenarios and results.
 */
export function useStressScenarios(options: UseStressScenariosOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.type) params.set("type", options.type)
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/risk/stress?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<StressScenario[]>(
    url,
    fetcher,
    { refreshInterval: 300000 } // Stress tests run infrequently
  )
  
  return {
    scenarios: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
