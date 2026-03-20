/**
 * Organizations Hooks
 * 
 * React Query / SWR hooks for user/org management.
 * Internal users see all orgs; clients see only their own org.
 */

import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface Organization {
  id: string
  name: string
  displayName: string
  type: "hedge-fund" | "asset-manager" | "prop-trading" | "family-office" | "other"
  status: "active" | "suspended" | "pending" | "churned"
  subscription: SubscriptionTier
  createdAt: string
  updatedAt: string
  contacts: Contact[]
  limits: OrganizationLimits
  metadata?: Record<string, unknown>
}

export interface SubscriptionTier {
  tier: "basic" | "pro" | "enterprise"
  services: string[]
  features: string[]
  monthlyFee: number
  startDate: string
  endDate?: string
  autoRenew: boolean
}

export interface Contact {
  id: string
  name: string
  email: string
  role: "admin" | "primary" | "billing" | "technical"
  phone?: string
}

export interface OrganizationLimits {
  maxUsers: number
  maxStrategies: number
  maxApiRequests: number
  dataRetentionDays: number
}

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "trader" | "analyst" | "viewer"
  organizationId: string
  organizationName: string
  status: "active" | "inactive" | "pending"
  lastLogin?: string
  createdAt: string
  permissions: string[]
  mfaEnabled: boolean
}

export interface UserActivity {
  userId: string
  userName: string
  action: string
  timestamp: string
  details?: string
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UseOrganizationsOptions {
  status?: Organization["status"]
  type?: Organization["type"]
}

export interface UseUsersOptions {
  organizationId?: string
  role?: User["role"]
  status?: User["status"]
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch organization data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch organizations list.
 * Internal users see all; clients see only their own.
 */
export function useOrganizations(options: UseOrganizationsOptions = {}) {
  const { user } = useAuth()
  const isInternal = user?.role === "internal" || user?.entitlements?.includes("*")
  
  const params = new URLSearchParams()
  if (options.status) params.set("status", options.status)
  if (options.type) params.set("type", options.type)
  
  // Clients can only see their own org
  if (!isInternal && user?.org) {
    params.set("id", user.org)
  }
  
  const url = `${API_CONFIG.baseUrl}/api/organizations?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<Organization[]>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  return {
    organizations: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch a single organization by ID.
 */
export function useOrganization(orgId: string | undefined) {
  const url = orgId
    ? `${API_CONFIG.baseUrl}/api/organizations/${orgId}`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<Organization>(
    url,
    fetcher
  )
  
  return {
    organization: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch the current user's organization.
 */
export function useMyOrganization() {
  const { user } = useAuth()
  return useOrganization(user?.org)
}

/**
 * Fetch users list.
 * Internal users see all; clients see only their org's users.
 */
export function useUsers(options: UseUsersOptions = {}) {
  const { user } = useAuth()
  const isInternal = user?.role === "internal" || user?.entitlements?.includes("*")
  
  const params = new URLSearchParams()
  if (options.organizationId) params.set("orgId", options.organizationId)
  if (options.role) params.set("role", options.role)
  if (options.status) params.set("status", options.status)
  
  // Clients can only see their own org's users
  if (!isInternal && user?.org) {
    params.set("orgId", user.org)
  }
  
  const url = `${API_CONFIG.baseUrl}/api/users?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<User[]>(
    url,
    fetcher,
    { refreshInterval: 60000 }
  )
  
  return {
    users: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch a single user by ID.
 */
export function useUser(userId: string | undefined) {
  const url = userId
    ? `${API_CONFIG.baseUrl}/api/users/${userId}`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<User>(
    url,
    fetcher
  )
  
  return {
    user: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch recent user activity.
 * Internal-only for cross-org view.
 */
export function useUserActivity(organizationId?: string, limit: number = 50) {
  const params = new URLSearchParams()
  if (organizationId) params.set("orgId", organizationId)
  params.set("limit", limit.toString())
  
  const url = `${API_CONFIG.baseUrl}/api/users/activity?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<UserActivity[]>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  )
  
  return {
    activity: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
