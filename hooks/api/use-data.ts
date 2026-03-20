/**
 * Data API Hooks
 * 
 * React Query hooks for the Data Service API.
 * Provides cached, deduplicated data fetching for:
 * - Catalogue entries
 * - Instruments
 * - Freshness data
 * 
 * Usage:
 *   const { data, isLoading, error } = useCatalogue({ category: "cefi" })
 */

import useSWR from "swr"
import type { DataCategory, CloudProvider } from "@/lib/stores/filters-store"
import type { CatalogueEntry, InstrumentEntry } from "@/lib/data-service-types"

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

// Build query string from params
function buildQueryString(params: Record<string, string | null | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") {
      searchParams.set(key, value)
    }
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ""
}

// Types for API responses
interface CatalogueResponse {
  entries: CatalogueEntry[]
  total: number
  persona?: string
}

interface InstrumentsResponse {
  instruments: InstrumentEntry[]
  total: number
}

interface FreshnessResponse {
  instrumentKey: string
  freshnessMap: Record<string, string>
  completeness: number
}

// Catalogue hook
export interface UseCatalogueOptions {
  category?: DataCategory
  venue?: string | null
  cloud?: CloudProvider
  search?: string
  enabled?: boolean
}

export function useCatalogue(options: UseCatalogueOptions = {}) {
  const { category, venue, cloud, search, enabled = true } = options
  
  const queryString = buildQueryString({
    category: category === "all" ? undefined : category,
    venue,
    cloud: cloud === "all" ? undefined : cloud,
    search,
  })
  
  const { data, error, isLoading, mutate } = useSWR<CatalogueResponse>(
    enabled ? `${API_BASE}/api/data/catalogue${queryString}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )
  
  return {
    entries: data?.entries ?? [],
    total: data?.total ?? 0,
    persona: data?.persona,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Instruments hook
export interface UseInstrumentsOptions {
  category?: DataCategory
  venue?: string | null
  enabled?: boolean
}

export function useInstruments(options: UseInstrumentsOptions = {}) {
  const { category, venue, enabled = true } = options
  
  const queryString = buildQueryString({
    category: category === "all" ? undefined : category,
    venue,
  })
  
  const { data, error, isLoading, mutate } = useSWR<InstrumentsResponse>(
    enabled ? `${API_BASE}/api/data/instruments${queryString}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )
  
  return {
    instruments: data?.instruments ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Single instrument hook
export function useInstrument(instrumentKey: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    instrumentKey 
      ? `${API_BASE}/api/data/instruments/${encodeURIComponent(instrumentKey)}` 
      : null,
    fetcher<{ instrument: InstrumentEntry; catalogue?: CatalogueEntry }>,
    {
      revalidateOnFocus: false,
    }
  )
  
  return {
    instrument: data?.instrument ?? null,
    catalogue: data?.catalogue ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Freshness heatmap hook
export function useFreshness(instrumentKey: string | null) {
  const { data, error, isLoading, mutate } = useSWR<FreshnessResponse>(
    instrumentKey 
      ? `${API_BASE}/api/data/freshness/${encodeURIComponent(instrumentKey)}` 
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache longer since freshness changes slowly
    }
  )
  
  return {
    freshnessMap: data?.freshnessMap ?? {},
    completeness: data?.completeness ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Unique values for filter dropdowns
export function useUniqueVenues() {
  const { instruments, isLoading } = useInstruments({ enabled: true })
  
  const venues = [...new Set(instruments.map((i) => i.venue))].sort()
  
  return {
    venues,
    isLoading,
  }
}

export function useUniqueCategories() {
  const { instruments, isLoading } = useInstruments({ enabled: true })
  
  const categories = [...new Set(instruments.map((i) => i.category))].sort()
  
  return {
    categories,
    isLoading,
  }
}
