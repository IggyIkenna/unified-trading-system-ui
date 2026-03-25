"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchAuthorization,
  type AuthorizeResult,
} from "@/lib/auth/authorize-client"

export type AppRole = "viewer" | "editor" | "admin" | "owner"

export interface AppAccessState {
  authorized: boolean
  role: AppRole | null
  capabilities: string[]
  loading: boolean
  error: string | null
  hasCapability: (cap: string) => boolean
  hasAnyCapability: (...caps: string[]) => boolean
}

const AppAccessContext = React.createContext<AppAccessState | null>(null)

export function AppAccessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [authzResult, setAuthzResult] = React.useState<AuthorizeResult | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user) {
      setAuthzResult(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchAuthorization(user.id)
      .then((result) => {
        if (cancelled) return
        setAuthzResult(result)
        if (result.error) setError(result.error)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setAuthzResult({
          authorized: false,
          role: null,
          capabilities: [],
          source: "none",
          environments: [],
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const hasCapability = React.useCallback(
    (cap: string): boolean => {
      if (!authzResult?.authorized) return false
      if (authzResult.capabilities.includes("*")) return true
      return authzResult.capabilities.includes(cap)
    },
    [authzResult],
  )

  const hasAnyCapability = React.useCallback(
    (...caps: string[]): boolean => {
      if (!authzResult?.authorized) return false
      if (authzResult.capabilities.includes("*")) return true
      return caps.some((c) => authzResult.capabilities.includes(c))
    },
    [authzResult],
  )

  const value = React.useMemo<AppAccessState>(
    () => ({
      authorized: authzResult?.authorized ?? false,
      role: authzResult?.role ?? null,
      capabilities: authzResult?.capabilities ?? [],
      loading,
      error,
      hasCapability,
      hasAnyCapability,
    }),
    [authzResult, loading, error, hasCapability, hasAnyCapability],
  )

  return (
    <AppAccessContext.Provider value={value}>
      {children}
    </AppAccessContext.Provider>
  )
}

export function useAppAccess(): AppAccessState {
  const context = React.useContext(AppAccessContext)
  if (!context) {
    throw new Error("useAppAccess must be used within an AppAccessProvider")
  }
  return context
}
