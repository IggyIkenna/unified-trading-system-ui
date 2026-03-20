/**
 * Execution API Hooks
 * 
 * React Query hooks for the Execution Service API.
 * Provides cached, deduplicated data fetching for:
 * - Venues
 * - Algos
 * - Orders
 * - TCA metrics
 * 
 * Usage:
 *   const { venues, isLoading } = useVenues()
 *   const { orders, isLoading } = useOrders({ status: "filled" })
 */

import useSWR from "swr"
import type { DateRange } from "@/lib/stores/filters-store"

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
    if (value) searchParams.set(key, value)
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ""
}

// Types
export interface Venue {
  id: string
  name: string
  type: string
  status: "online" | "degraded" | "offline"
  latencyMs: number
}

export interface Algo {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface Order {
  id: string
  symbol: string
  side: "buy" | "sell"
  qty: number
  filledQty: number
  price: number
  status: "pending" | "partial" | "filled" | "cancelled"
  venue: string
  algo: string
  createdAt: string
}

export interface TCAMetrics {
  avgSlippage: number
  avgLatencyMs: number
  fillRate: number
  totalVolume: number
  orderCount: number
}

export interface TCAByVenue {
  venue: string
  slippage: number
  latencyMs: number
  fillRate: number
}

// Venues hook
export function useVenues() {
  const { data, error, isLoading, mutate } = useSWR<{ venues: Venue[] }>(
    `${API_BASE}/api/execution/venues`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )
  
  return {
    venues: data?.venues ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Algos hook
export function useAlgos() {
  const { data, error, isLoading, mutate } = useSWR<{ algos: Algo[] }>(
    `${API_BASE}/api/execution/algos`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
  
  return {
    algos: data?.algos ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Orders hook
export interface UseOrdersOptions {
  status?: string | null
  venue?: string | null
  enabled?: boolean
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { status, venue, enabled = true } = options
  
  const queryString = buildQueryString({ status, venue })
  
  const { data, error, isLoading, mutate } = useSWR<{ orders: Order[]; total: number }>(
    enabled ? `${API_BASE}/api/execution/orders${queryString}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 10000, // Poll for order updates
    }
  )
  
  return {
    orders: data?.orders ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// TCA hook
export interface UseTCAOptions {
  period?: DateRange
  enabled?: boolean
}

export function useTCA(options: UseTCAOptions = {}) {
  const { period = "7d", enabled = true } = options
  
  const queryString = buildQueryString({ period })
  
  const { data, error, isLoading, mutate } = useSWR<{
    period: string
    metrics: TCAMetrics
    byVenue: TCAByVenue[]
  }>(
    enabled ? `${API_BASE}/api/execution/tca${queryString}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
  
  return {
    period: data?.period ?? period,
    metrics: data?.metrics ?? null,
    byVenue: data?.byVenue ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}
