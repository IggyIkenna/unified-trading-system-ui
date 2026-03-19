/**
 * Audit Hooks
 * 
 * React Query / SWR hooks for compliance/audit service (internal-only).
 */

import useSWR from "swr"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface ComplianceCheck {
  id: string
  name: string
  category: "regulatory" | "risk" | "operational" | "security" | "data"
  status: "pass" | "fail" | "warning" | "skipped"
  severity: "critical" | "high" | "medium" | "low"
  description: string
  details?: string
  remediation?: string
  lastRun: string
  nextRun?: string
  affectedEntities?: string[]
}

export interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  actorType: "user" | "system" | "api"
  action: string
  resource: string
  resourceId?: string
  outcome: "success" | "failure" | "error"
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export interface DataHealthMetric {
  id: string
  name: string
  source: string
  status: "healthy" | "stale" | "missing" | "error"
  lastUpdate: string
  staleness: number
  recordCount?: number
  errorRate?: number
  details?: string
}

export interface ComplianceSummary {
  totalChecks: number
  passedChecks: number
  failedChecks: number
  warningChecks: number
  criticalFailures: number
  lastFullRun: string
  overallStatus: "compliant" | "non-compliant" | "at-risk"
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UseComplianceChecksOptions {
  category?: ComplianceCheck["category"]
  status?: ComplianceCheck["status"]
}

export interface UseAuditEventsOptions {
  actor?: string
  action?: string
  startDate?: string
  endDate?: string
  limit?: number
}

export interface UseDataHealthOptions {
  source?: string
  status?: DataHealthMetric["status"]
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch audit data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch compliance check results.
 */
export function useComplianceChecks(options: UseComplianceChecksOptions = {}) {
  const params = new URLSearchParams()
  if (options.category) params.set("category", options.category)
  if (options.status) params.set("status", options.status)
  
  const url = `${API_CONFIG.baseUrl}/api/internal/compliance/checks?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<ComplianceCheck[]>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  return {
    checks: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch compliance summary.
 */
export function useComplianceSummary() {
  const url = `${API_CONFIG.baseUrl}/api/internal/compliance/summary`
  
  const { data, error, isLoading, mutate } = useSWR<ComplianceSummary>(
    url,
    fetcher,
    { refreshInterval: 60000 }
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
 * Fetch audit event history.
 */
export function useAuditEvents(options: UseAuditEventsOptions = {}) {
  const params = new URLSearchParams()
  if (options.actor) params.set("actor", options.actor)
  if (options.action) params.set("action", options.action)
  if (options.startDate) params.set("start", options.startDate)
  if (options.endDate) params.set("end", options.endDate)
  if (options.limit) params.set("limit", options.limit.toString())
  
  const url = `${API_CONFIG.baseUrl}/api/internal/audit/events?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<AuditEvent[]>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  return {
    events: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch data health metrics.
 */
export function useDataHealth(options: UseDataHealthOptions = {}) {
  const params = new URLSearchParams()
  if (options.source) params.set("source", options.source)
  if (options.status) params.set("status", options.status)
  
  const url = `${API_CONFIG.baseUrl}/api/internal/data-health?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<DataHealthMetric[]>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  return {
    metrics: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
