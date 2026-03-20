/**
 * Deployments Hooks
 * 
 * React Query / SWR hooks for deployment service (internal-only).
 * Only accessible to users with role="internal".
 */

import useSWR from "swr"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface Service {
  id: string
  name: string
  displayName: string
  description: string
  status: "healthy" | "degraded" | "down" | "maintenance"
  version: string
  replicas: number
  targetReplicas: number
  cpu: number
  memory: number
  lastDeployed: string
  environment: "production" | "staging" | "development"
  team: string
  repository: string
  endpoints: ServiceEndpoint[]
}

export interface ServiceEndpoint {
  path: string
  method: string
  latencyP50: number
  latencyP99: number
  requestsPerMinute: number
  errorRate: number
}

export interface Deployment {
  id: string
  serviceId: string
  serviceName: string
  version: string
  status: "pending" | "deploying" | "deployed" | "failed" | "rolled-back"
  deployedBy: string
  startedAt: string
  completedAt?: string
  duration?: number
  changes: string[]
  rollbackTo?: string
}

export interface Shard {
  id: string
  name: string
  region: string
  status: "active" | "draining" | "inactive"
  services: string[]
  load: number
  capacity: number
  organizations: string[]
}

export interface CloudBuild {
  id: string
  repository: string
  branch: string
  commit: string
  status: "queued" | "building" | "testing" | "deploying" | "success" | "failed"
  triggeredBy: string
  startedAt: string
  completedAt?: string
  logs?: string
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UseDeploymentsOptions {
  serviceId?: string
  status?: Deployment["status"]
  limit?: number
}

export interface UseServicesOptions {
  environment?: Service["environment"]
  status?: Service["status"]
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch deployment data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch services list.
 */
export function useServices(options: UseServicesOptions = {}) {
  const params = new URLSearchParams()
  if (options.environment) params.set("environment", options.environment)
  if (options.status) params.set("status", options.status)
  
  const url = `${API_CONFIG.baseUrl}/api/internal/services?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<Service[]>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  return {
    services: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch a single service by ID.
 */
export function useService(serviceId: string | undefined) {
  const url = serviceId
    ? `${API_CONFIG.baseUrl}/api/internal/services/${serviceId}`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<Service>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    service: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch deployments list.
 */
export function useDeployments(options: UseDeploymentsOptions = {}) {
  const params = new URLSearchParams()
  if (options.serviceId) params.set("serviceId", options.serviceId)
  if (options.status) params.set("status", options.status)
  if (options.limit) params.set("limit", options.limit.toString())
  
  const url = `${API_CONFIG.baseUrl}/api/internal/deployments?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<Deployment[]>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    deployments: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch shards information.
 */
export function useShards() {
  const url = `${API_CONFIG.baseUrl}/api/internal/shards`
  
  const { data, error, isLoading, mutate } = useSWR<Shard[]>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  return {
    shards: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch cloud builds.
 */
export function useCloudBuilds(limit: number = 20) {
  const url = `${API_CONFIG.baseUrl}/api/internal/builds?limit=${limit}`
  
  const { data, error, isLoading, mutate } = useSWR<CloudBuild[]>(
    url,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    builds: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
