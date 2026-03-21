"use client"

import * as React from "react"
import type { UserRole, Entitlement, EntitlementOrWildcard, Org } from "@/lib/config/auth"
import { ALL_ENTITLEMENTS } from "@/lib/config/auth"
import {
  PERSONAS,
  getPersonaByEmail,
  getPersonaById,
} from "@/lib/mocks/fixtures/personas"
import { useAuthStore } from "@/lib/stores/auth-store"

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  org: Org
  entitlements: readonly EntitlementOrWildcard[]
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (personaId: string) => boolean
  loginByEmail: (email: string, password: string) => boolean
  switchPersona: (personaId: string) => void
  logout: () => void
  hasEntitlement: (entitlement: Entitlement) => boolean
  isInternal: () => boolean
  personas: typeof PERSONAS
}

const STORAGE_KEY = "portal_user"
const TOKEN_KEY = "portal_token"

function loadUser(): { user: AuthUser | null; token: string | null } {
  if (typeof window === "undefined") return { user: null, token: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const token = localStorage.getItem(TOKEN_KEY)
    if (!raw) return { user: null, token: null }
    const stored = JSON.parse(raw)
    const persona =
      getPersonaById(stored.id) ?? getPersonaByEmail(stored.email)
    if (persona) {
      return {
        user: {
          id: persona.id,
          email: persona.email,
          displayName: persona.displayName,
          role: persona.role,
          org: persona.org,
          entitlements: persona.entitlements,
        },
        token: token ?? `demo-token-${persona.id}`,
      }
    }
    return { user: null, token: null }
  } catch {
    return { user: null, token: null }
  }
}

const AuthContext = React.createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const syncZustand = useAuthStore((s) => s.setPersonaId)

  React.useEffect(() => {
    const loaded = loadUser()
    setUser(loaded.user)
    setToken(loaded.token)
    syncZustand(loaded.user?.id ?? null)
    setLoading(false)
  }, [syncZustand])

  const login = React.useCallback(
    (personaId: string): boolean => {
      const persona = getPersonaById(personaId)
      if (!persona) return false
      const authUser: AuthUser = {
        id: persona.id,
        email: persona.email,
        displayName: persona.displayName,
        role: persona.role,
        org: persona.org,
        entitlements: persona.entitlements,
      }
      const demoToken = `demo-token-${persona.id}`
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      localStorage.setItem(TOKEN_KEY, demoToken)
      setUser(authUser)
      setToken(demoToken)
      syncZustand(persona.id)
      return true
    },
    [syncZustand],
  )

  const loginByEmail = React.useCallback(
    (email: string, password: string): boolean => {
      const persona = getPersonaByEmail(email)
      if (!persona || persona.password !== password) return false
      return login(persona.id)
    },
    [login],
  )

  const switchPersona = React.useCallback(
    (personaId: string) => {
      login(personaId)
    },
    [login],
  )

  const logout = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem("odum_user")
    setUser(null)
    setToken(null)
    syncZustand(null)
  }, [syncZustand])

  const hasEntitlement = React.useCallback(
    (entitlement: Entitlement): boolean => {
      if (!user) return false
      if (user.entitlements.includes(ALL_ENTITLEMENTS)) return true
      return user.entitlements.includes(entitlement)
    },
    [user],
  )

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
      isInternal,
      personas: PERSONAS,
    }),
    [user, token, loading, login, loginByEmail, switchPersona, logout, hasEntitlement, isInternal],
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
