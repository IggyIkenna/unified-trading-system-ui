"use client"

import * as React from "react"
import type { Entitlement } from "@/lib/config/auth"
import { PERSONAS } from "@/lib/auth/personas"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getAuthProvider } from "@/lib/auth/get-provider"
import type { AuthUser } from "@/lib/auth/types"

// Re-export AuthUser so existing consumers keep working
export type { AuthUser } from "@/lib/auth/types"

export interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (personaId: string) => boolean
  loginByEmail: (email: string, password: string) => boolean
  switchPersona: (personaId: string) => void
  logout: () => void
  hasEntitlement: (entitlement: Entitlement) => boolean
  isAdmin: () => boolean
  isInternal: () => boolean
  personas: typeof PERSONAS
}

const AuthContext = React.createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const provider = React.useMemo(() => getAuthProvider(), [])
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const syncZustand = useAuthStore((s) => s.setPersonaId)

  // Restore session from provider on mount
  React.useEffect(() => {
    const restored = provider.getUser()
    const restoredToken = provider.getToken()
    setUser(restored)
    setToken(restoredToken)
    syncZustand(restored?.id ?? null)
    setLoading(false)
  }, [provider, syncZustand])

  const login = React.useCallback(
    (personaId: string): boolean => {
      const result = provider.login(personaId)
      if (!result) return false
      setUser(result)
      setToken(provider.getToken())
      syncZustand(result.id)
      return true
    },
    [provider, syncZustand],
  )

  const loginByEmail = React.useCallback(
    (email: string, password: string): boolean => {
      const result = provider.login(email, password)
      if (!result) return false
      setUser(result)
      setToken(provider.getToken())
      syncZustand(result.id)
      return true
    },
    [provider, syncZustand],
  )

  const switchPersona = React.useCallback(
    (personaId: string) => {
      login(personaId)
    },
    [login],
  )

  const logout = React.useCallback(() => {
    provider.logout()
    setUser(null)
    setToken(null)
    syncZustand(null)
  }, [provider, syncZustand])

  const hasEntitlement = React.useCallback(
    (entitlement: Entitlement): boolean => {
      return provider.hasEntitlement(entitlement)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, user],
  )

  const isAdmin = React.useCallback((): boolean => {
    return user?.role === "admin"
  }, [user])

  const isInternal = React.useCallback((): boolean => {
    return user?.role === "internal" || user?.role === "admin"
  }, [user])

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      login,
      loginByEmail,
      switchPersona,
      logout,
      hasEntitlement,
      isAdmin,
      isInternal,
      personas: PERSONAS,
    }),
    [user, token, loading, login, loginByEmail, switchPersona, logout, hasEntitlement, isAdmin, isInternal],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
