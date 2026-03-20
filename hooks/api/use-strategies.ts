/**
 * Strategy API Hooks
 * 
 * React Query hooks for the Strategy Service API.
 * Provides cached, deduplicated data fetching for:
 * - Strategies
 * - Backtests
 * 
 * Usage:
 *   const { strategies, isLoading } = useStrategies({ status: "live" })
 *   const { strategy, isLoading } = useStrategy("strat-001")
 */

import useSWR from "swr"
import type { StrategyStatus } from "@/lib/stores/filters-store"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

// Generic fetcher
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }))
    throw new Error(error.error || "Request failed")
  }
  return res.json()
}

// Build query string
function buildQueryString(params: Record<string, string | null | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") searchParams.set(key, value)
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ""
}

// Types
export interface Strategy {
  id: string
  name: string
  description: string
  status: "live" | "paper" | "backtest" | "draft"
  pnl30d: number
  sharpe: number
  maxDrawdown: number
  instruments: string[]
  createdAt: string
  updatedAt: string
}

export interface Backtest {
  id: string
  strategyId: string
  strategyName: string
  status: "running" | "completed" | "failed"
  startDate: string
  endDate: string
  totalReturn: number
  sharpe: number
  maxDrawdown: number
  trades: number
  winRate: number
  createdAt: string
}

// Strategies hook
export interface UseStrategiesOptions {
  status?: StrategyStatus
  org?: string | null
  enabled?: boolean
}

export function useStrategies(options: UseStrategiesOptions = {}) {
  const { status, org, enabled = true } = options
  
  const queryString = buildQueryString({
    status: status === "all" ? undefined : status,
    org,
  })
  
  const { data, error, isLoading, mutate } = useSWR<{ strategies: Strategy[]; total: number }>(
    enabled ? `${API_BASE}/api/strategies${queryString}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )
  
  return {
    strategies: data?.strategies ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Single strategy hook
export function useStrategy(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ strategy: Strategy; org: string }>(
    id ? `${API_BASE}/api/strategies/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )
  
  return {
    strategy: data?.strategy ?? null,
    org: data?.org ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Backtests hook
export interface UseBacktestsOptions {
  strategyId?: string | null
  status?: string | null
  enabled?: boolean
}

export function useBacktests(options: UseBacktestsOptions = {}) {
  const { strategyId, status, enabled = true } = options
  
  const queryString = buildQueryString({ strategyId, status })
  
  const { data, error, isLoading, mutate } = useSWR<{ backtests: Backtest[]; total: number }>(
    enabled ? `${API_BASE}/api/backtests${queryString}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Poll for running backtests
    }
  )
  
  return {
    backtests: data?.backtests ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Single backtest hook
export function useBacktest(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ backtest: Backtest; org: string }>(
    id ? `${API_BASE}/api/backtests/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: (data) => 
        data?.backtest?.status === "running" ? 5000 : 0, // Poll while running
    }
  )
  
  return {
    backtest: data?.backtest ?? null,
    org: data?.org ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Strategy stats aggregations
export function useStrategyStats() {
  const { strategies, isLoading } = useStrategies({ enabled: true })
  
  if (isLoading || strategies.length === 0) {
    return {
      totalPnl: 0,
      avgSharpe: 0,
      liveCount: 0,
      paperCount: 0,
      isLoading,
    }
  }
  
  const liveStrategies = strategies.filter((s) => s.status === "live")
  const paperStrategies = strategies.filter((s) => s.status === "paper")
  
  const totalPnl = liveStrategies.reduce((sum, s) => sum + s.pnl30d, 0)
  const avgSharpe = liveStrategies.length > 0
    ? liveStrategies.reduce((sum, s) => sum + s.sharpe, 0) / liveStrategies.length
    : 0
  
  return {
    totalPnl,
    avgSharpe,
    liveCount: liveStrategies.length,
    paperCount: paperStrategies.length,
    isLoading,
  }
}
