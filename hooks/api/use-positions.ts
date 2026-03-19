/**
 * Positions Hooks
 * 
 * React Query / SWR hooks for position-balance-monitor service.
 * All data is client-scoped via org context from useAuth().
 */

import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface Position {
  id: string
  instrumentId: string
  symbol: string
  venue: string
  category: string
  side: "long" | "short"
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  realizedPnL: number
  costBasis: number
  exposure: number
  riskGroup?: string
  openedAt: string
  updatedAt: string
}

export interface PositionSummary {
  totalPositions: number
  longPositions: number
  shortPositions: number
  totalMarketValue: number
  totalUnrealizedPnL: number
  totalRealizedPnL: number
  netExposure: number
  grossExposure: number
}

export interface RiskGroup {
  id: string
  name: string
  positions: Position[]
  totalMarketValue: number
  unrealizedPnL: number
  exposure: number
  limit: number
  utilizationPercent: number
}

export interface MarginInfo {
  availableMargin: number
  usedMargin: number
  marginUtilization: number
  maintenanceMargin: number
  marginCallThreshold: number
  equity: number
}

export interface HistoricalSnapshot {
  timestamp: string
  positions: Position[]
  summary: PositionSummary
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UsePositionsOptions {
  venue?: string
  category?: string
  riskGroup?: string
  side?: "long" | "short"
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch positions data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch all positions for the current organization.
 * Supports filtering by venue, category, risk group, or side.
 */
export function usePositions(options: UsePositionsOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  // Build query params
  const params = new URLSearchParams()
  if (options.venue) params.set("venue", options.venue)
  if (options.category) params.set("category", options.category)
  if (options.riskGroup) params.set("riskGroup", options.riskGroup)
  if (options.side) params.set("side", options.side)
  params.set("orgId", orgId)
  
  const queryString = params.toString()
  const url = `${API_CONFIG.baseUrl}/api/positions?${queryString}`
  
  const { data, error, isLoading, mutate } = useSWR<Position[]>(
    url,
    fetcher,
    {
      refreshInterval: 5000, // Real-time-ish updates
      revalidateOnFocus: true,
    }
  )
  
  return {
    positions: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch position summary aggregates.
 */
export function usePositionSummary() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/positions/summary?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<PositionSummary>(
    url,
    fetcher,
    { refreshInterval: 5000 }
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
 * Fetch positions grouped by risk group.
 */
export function useRiskGroups() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/positions/risk-groups?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<RiskGroup[]>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    riskGroups: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch margin information.
 */
export function useMargin() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/positions/margin?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<MarginInfo>(
    url,
    fetcher,
    { refreshInterval: 5000 }
  )
  
  return {
    margin: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch historical position snapshots for a date range.
 */
export function usePositionHistory(startDate: string, endDate: string) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/positions/history?orgId=${orgId}&start=${startDate}&end=${endDate}`
  
  const { data, error, isLoading, mutate } = useSWR<HistoricalSnapshot[]>(
    startDate && endDate ? url : null,
    fetcher
  )
  
  return {
    history: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
