/**
 * Alerts Hooks
 * 
 * React Query / SWR hooks for alerting service.
 * All data is client-scoped via org context from useAuth().
 */

import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { useAuth } from "@/hooks/use-auth"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface Alert {
  id: string
  type: "risk" | "execution" | "system" | "compliance" | "position" | "market"
  severity: "critical" | "high" | "medium" | "low" | "info"
  status: "active" | "acknowledged" | "resolved" | "snoozed"
  title: string
  message: string
  source: string
  metadata?: Record<string, unknown>
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedBy?: string
  resolvedAt?: string
  snoozedUntil?: string
  createdAt: string
  updatedAt: string
}

export interface AlertRule {
  id: string
  name: string
  type: Alert["type"]
  severity: Alert["severity"]
  condition: string
  threshold?: number
  enabled: boolean
  channels: ("email" | "slack" | "sms" | "webhook")[]
  recipients: string[]
  cooldown: number // minutes between repeat alerts
  createdAt: string
  updatedAt: string
}

export interface AlertStats {
  total: number
  active: number
  acknowledged: number
  resolved: number
  bySeverity: Record<Alert["severity"], number>
  byType: Record<Alert["type"], number>
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UseAlertsOptions {
  type?: Alert["type"]
  severity?: Alert["severity"]
  status?: Alert["status"]
  limit?: number
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch alerts data")
    throw error
  }
  return res.json()
}

const mutationFetcher = async (url: string, { arg }: { arg: Record<string, unknown> }) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  })
  if (!res.ok) {
    const error = new Error("Failed to update alert")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch alerts with optional filtering.
 */
export function useAlerts(options: UseAlertsOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.type) params.set("type", options.type)
  if (options.severity) params.set("severity", options.severity)
  if (options.status) params.set("status", options.status)
  if (options.limit) params.set("limit", options.limit.toString())
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/alerts?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<Alert[]>(
    url,
    fetcher,
    { refreshInterval: 5000 } // Alerts need frequent updates
  )
  
  return {
    alerts: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch a single alert by ID.
 */
export function useAlert(alertId: string | undefined) {
  const url = alertId
    ? `${API_CONFIG.baseUrl}/api/alerts/${alertId}`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<Alert>(
    url,
    fetcher
  )
  
  return {
    alert: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch alert statistics.
 */
export function useAlertStats() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/alerts/stats?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<AlertStats>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    stats: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch alert rules.
 */
export function useAlertRules() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/alerts/rules?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<AlertRule[]>(
    url,
    fetcher
  )
  
  return {
    rules: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Acknowledge an alert.
 */
export function useAcknowledgeAlert(alertId: string) {
  const url = `${API_CONFIG.baseUrl}/api/alerts/${alertId}/acknowledge`
  
  const { trigger, isMutating, error } = useSWRMutation(url, mutationFetcher)
  
  return {
    acknowledge: () => trigger({}),
    isLoading: isMutating,
    error,
  }
}

/**
 * Resolve an alert.
 */
export function useResolveAlert(alertId: string) {
  const url = `${API_CONFIG.baseUrl}/api/alerts/${alertId}/resolve`
  
  const { trigger, isMutating, error } = useSWRMutation(url, mutationFetcher)
  
  return {
    resolve: (notes?: string) => trigger({ notes }),
    isLoading: isMutating,
    error,
  }
}

/**
 * Snooze an alert.
 */
export function useSnoozeAlert(alertId: string) {
  const url = `${API_CONFIG.baseUrl}/api/alerts/${alertId}/snooze`
  
  const { trigger, isMutating, error } = useSWRMutation(url, mutationFetcher)
  
  return {
    snooze: (durationMinutes: number) => trigger({ durationMinutes }),
    isLoading: isMutating,
    error,
  }
}
