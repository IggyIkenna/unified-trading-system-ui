/**
 * Reports Hooks
 * 
 * React Query / SWR hooks for reporting/settlement service.
 * All data is client-scoped via org context from useAuth().
 */

import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface Report {
  id: string
  type: "daily-pnl" | "monthly-summary" | "risk-report" | "trade-recap" | "settlement" | "regulatory" | "custom"
  name: string
  description: string
  status: "pending" | "generating" | "ready" | "failed" | "expired"
  format: "pdf" | "csv" | "xlsx" | "json"
  periodStart: string
  periodEnd: string
  fileUrl?: string
  fileSize?: number
  generatedAt?: string
  expiresAt?: string
  createdBy: string
  createdAt: string
}

export interface SettlementRecord {
  id: string
  tradeId: string
  instrument: string
  venue: string
  settlementDate: string
  status: "pending" | "confirmed" | "failed" | "manual-review"
  amount: number
  currency: string
  counterparty: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ReconciliationResult {
  id: string
  type: "position" | "cash" | "trade"
  date: string
  status: "matched" | "discrepancy" | "pending"
  internalValue: number
  externalValue: number
  difference: number
  differencePercent: number
  source: string
  notes?: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface Invoice {
  id: string
  type: "management-fee" | "performance-fee" | "data-fee" | "infrastructure"
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  periodStart: string
  periodEnd: string
  amount: number
  currency: string
  dueDate: string
  paidDate?: string
  lineItems: InvoiceLineItem[]
  createdAt: string
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UseReportsOptions {
  type?: Report["type"]
  status?: Report["status"]
  limit?: number
}

export interface UseSettlementOptions {
  status?: SettlementRecord["status"]
  startDate?: string
  endDate?: string
}

export interface UseReconciliationOptions {
  type?: ReconciliationResult["type"]
  status?: ReconciliationResult["status"]
  date?: string
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch reports data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch reports list.
 */
export function useReports(options: UseReportsOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.type) params.set("type", options.type)
  if (options.status) params.set("status", options.status)
  if (options.limit) params.set("limit", options.limit.toString())
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/reports?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<Report[]>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  return {
    reports: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch a single report by ID.
 */
export function useReport(reportId: string | undefined) {
  const url = reportId
    ? `${API_CONFIG.baseUrl}/api/reports/${reportId}`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<Report>(
    url,
    fetcher
  )
  
  return {
    report: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch settlement records.
 */
export function useSettlement(options: UseSettlementOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.status) params.set("status", options.status)
  if (options.startDate) params.set("start", options.startDate)
  if (options.endDate) params.set("end", options.endDate)
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/settlement?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<SettlementRecord[]>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  return {
    settlements: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch reconciliation results.
 */
export function useReconciliation(options: UseReconciliationOptions = {}) {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const params = new URLSearchParams()
  if (options.type) params.set("type", options.type)
  if (options.status) params.set("status", options.status)
  if (options.date) params.set("date", options.date)
  params.set("orgId", orgId)
  
  const url = `${API_CONFIG.baseUrl}/api/reconciliation?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<ReconciliationResult[]>(
    url,
    fetcher
  )
  
  return {
    results: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch invoices.
 */
export function useInvoices() {
  const { user } = useAuth()
  const orgId = user?.org || "default"
  
  const url = `${API_CONFIG.baseUrl}/api/invoices?orgId=${orgId}`
  
  const { data, error, isLoading, mutate } = useSWR<Invoice[]>(
    url,
    fetcher
  )
  
  return {
    invoices: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
