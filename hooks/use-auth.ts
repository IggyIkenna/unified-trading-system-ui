"use client"

import * as React from "react"
import type { UserRole, Entitlement, EntitlementOrWildcard, Org } from "@/lib/config/auth"
import { ALL_ENTITLEMENTS } from "@/lib/config/auth"
import {
  PERSONAS,
  getPersonaByEmail,
  getPersonaById,
} from "@/lib/mocks/fixtures/personas"

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  org: Org
  entitlements: readonly EntitlementOrWildcard[]
}

const STORAGE_KEY = "portal_user"

function loadUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw)
    // Migrate legacy format: match by email or id
    const persona =
      getPersonaById(stored.id) ?? getPersonaByEmail(stored.email)
    if (persona) {
      return {
        id: persona.id,
        email: persona.email,
        displayName: persona.displayName,
        role: persona.role,
        org: persona.org,
        entitlements: persona.entitlements,
      }
    }
    // Fallback for unknown stored users (shouldn't happen in demo)
    return null
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setUser(loadUser())
    setLoading(false)
  }, [])

  function login(personaId: string) {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    setUser(authUser)
    return true
  }

  function loginByEmail(email: string, password: string): boolean {
    const persona = getPersonaByEmail(email)
    if (!persona || persona.password !== password) return false
    return login(persona.id)
  }

  function switchPersona(personaId: string) {
    login(personaId)
    window.location.reload()
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem("odum_user") // legacy key cleanup
    setUser(null)
  }

  /** Check if user has a specific entitlement */
  function hasEntitlement(entitlement: Entitlement): boolean {
    if (!user) return false
    if (user.entitlements.includes(ALL_ENTITLEMENTS)) return true
    return user.entitlements.includes(entitlement)
  }

  /** Check if user has internal/admin access */
  function isInternal(): boolean {
    return user?.role === "internal" || user?.role === "admin"
  }

  return {
    user,
    loading,
    login,
    loginByEmail,
    switchPersona,
    logout,
    hasEntitlement,
    isInternal,
    personas: PERSONAS,
  }
}
