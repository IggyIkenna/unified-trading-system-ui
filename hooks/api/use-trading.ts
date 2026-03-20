/**
 * Trading Hooks
 * 
 * React Query / SWR hooks for trading/P&L data.
 * All data is client-scoped via org context from useAuth().
 */

import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface PnLSummary {
  totalPnL: number
  realizedPnL: number
  unrealizedPnL: number
  todayPnL: number
  mtdPnL: number
  ytdPnL: number
  fees: number
  netPnL: number
}

export interface PnLTimeSeries {
  timestamp: string
  cumulative: number
  daily: number
  realized: number
  unrealized: number
}

export interface PnLAttribution {
  byVenue: Record<string, number>
  byCategory: Record<string, number>
  byStrategy: Record<string, number>
  byInstrument: Record<string, number>
}

export interface PerformanceMetrics {
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  maxDrawdownDuration: number
  winRate: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  payoffRatio: number
  calmarRatio: number
  volatility: number
  beta?: number
  alpha?: number
}

export interface TradingActivity {
  totalTrades: number
  buyTrades: number
  sellTrades: number
  avgTradeSize: number
  totalVolume: number
  avgHoldingPeriod: number
  turnover: number
}

export interface DailyPnL {
  date: string
  pnl: number
  trades: number
  volume: number
  fees: number
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UsePnLTimeSeriesOptions {
  startDate?: string
  endDate?: string
  interval?: "1h" | "1d" | "1w" | "1M"
}

export interface UseDailyPnLOptions {
  startDate?: string
  endDate?: string
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch trading data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch P&L summary.
 */
export function usePnLSummary() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/trading/pnl/summary?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<PnLSummary>(
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
 * Fetch P&L time series data.
 */
export function usePnLTimeSeries(options: UsePnLTimeSeriesOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.startDate) params.set("start", options.startDate)
  if (options.endDate) params.set("end", options.endDate)
  if (options.interval) params.set("interval", options.interval)
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/trading/pnl/timeseries?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<PnLTimeSeries[]>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  return {
    timeSeries: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch P&L attribution breakdown.
 */
export function usePnLAttribution() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/trading/pnl/attribution?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<PnLAttribution>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  return {
    attribution: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch performance metrics.
 */
export function usePerformanceMetrics() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/trading/performance?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<PerformanceMetrics>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  return {
    metrics: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch trading activity summary.
 */
export function useTradingActivity() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/trading/activity?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<TradingActivity>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  return {
    activity: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch daily P&L data for calendar views.
 */
export function useDailyPnL(options: UseDailyPnLOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.startDate) params.set("start", options.startDate)
  if (options.endDate) params.set("end", options.endDate)
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/trading/pnl/daily?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<DailyPnL[]>(
    url,
    fetcher
  )
  
  return {
    dailyPnL: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
