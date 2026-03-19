/**
 * Service Status Hooks
 * 
 * React Query / SWR hooks for service health and system overview.
 * Full view is internal-only; clients see limited health status.
 */

import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceHealth {
  id: string
  name: string
  displayName: string
  status: "operational" | "degraded" | "partial-outage" | "major-outage" | "maintenance"
  uptime: number
  uptimePercent: number
  lastIncident?: string
  lastIncidentAt?: string
  responseTime: number
  errorRate: number
}

export interface SystemOverview {
  overallStatus: "operational" | "degraded" | "outage"
  services: ServiceHealth[]
  totalServices: number
  healthyServices: number
  degradedServices: number
  downServices: number
  lastUpdated: string
}

export interface FeatureFreshness {
  feature: string
  service: string
  lastUpdated: string
  staleness: number // seconds since last update
  status: "fresh" | "stale" | "critical"
  threshold: number // max acceptable staleness
}

export interface Incident {
  id: string
  title: string
  status: "investigating" | "identified" | "monitoring" | "resolved"
  severity: "minor" | "major" | "critical"
  affectedServices: string[]
  startedAt: string
  resolvedAt?: string
  updates: IncidentUpdate[]
}

export interface IncidentUpdate {
  timestamp: string
  status: Incident["status"]
  message: string
  author: string
}

export interface MaintenanceWindow {
  id: string
  title: string
  description: string
  affectedServices: string[]
  scheduledStart: string
  scheduledEnd: string
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch service status data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch system overview (aggregated health status).
 */
export function useSystemOverview() {
  const { user } = useAuth()
  const isInternal = user?.role === "internal" || user?.entitlements?.includes("*")
  
  // Internal users get full view, clients get limited view
  const url = isInternal
    ? `${API_CONFIG.baseUrl}/api/status/overview?full=true`
    : `${API_CONFIG.baseUrl}/api/status/overview`
  
  const { data, error, isLoading, mutate } = useSWR<SystemOverview>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  return {
    overview: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch individual service health.
 */
export function useServiceHealth(serviceId: string | undefined) {
  const url = serviceId
    ? `${API_CONFIG.baseUrl}/api/status/services/${serviceId}`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<ServiceHealth>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    health: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch feature freshness (data staleness tracking).
 * Internal-only for full view.
 */
export function useFeatureFreshness() {
  const url = `${API_CONFIG.baseUrl}/api/status/freshness`
  
  const { data, error, isLoading, mutate } = useSWR<FeatureFreshness[]>(
    url,
    fetcher,
    { refreshInterval: 30000 }
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
 * Fetch active and recent incidents.
 */
export function useIncidents(includeResolved: boolean = false) {
  const url = `${API_CONFIG.baseUrl}/api/status/incidents?includeResolved=${includeResolved}`
  
  const { data, error, isLoading, mutate } = useSWR<Incident[]>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  return {
    incidents: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch scheduled maintenance windows.
 */
export function useMaintenanceWindows() {
  const url = `${API_CONFIG.baseUrl}/api/status/maintenance`
  
  const { data, error, isLoading, mutate } = useSWR<MaintenanceWindow[]>(
    url,
    fetcher,
    { refreshInterval: 300000 } // Maintenance windows don't change often
  )
  
  return {
    windows: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
