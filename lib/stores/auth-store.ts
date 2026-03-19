/**
 * Auth Store
 * 
 * Global authentication state using Zustand.
 * Manages current user, persona, and login state.
 * 
 * Usage:
 *   const { user, login, logout, switchPersona } = useAuthStore()
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { DemoPersona, Role, Entitlement, Organization } from "@/lib/config/auth"
import { DEMO_PERSONAS, getPersonaById, getDefaultPersona } from "@/lib/mocks/fixtures/personas"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  org: Organization
  entitlements: Entitlement[]
}

interface AuthState {
  // State
  user: AuthUser | null
  personaId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password?: string) => Promise<void>
  logout: () => void
  switchPersona: (personaId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
  
  // Computed helpers
  isInternal: () => boolean
  hasEntitlement: (entitlement: Entitlement) => boolean
  canAccess: (requiredEntitlements: Entitlement[]) => boolean
}

const initialState = {
  user: null,
  personaId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      login: async (email: string, _password?: string) => {
        set({ isLoading: true, error: null })
        
        try {
          // In demo mode, look up persona by email
          const persona = DEMO_PERSONAS.find((p) => p.email === email) || getDefaultPersona()
          
          const user: AuthUser = {
            id: persona.id,
            email: persona.email,
            name: persona.name,
            role: persona.role,
            org: persona.org,
            entitlements: persona.entitlements,
          }
          
          set({
            user,
            personaId: persona.id,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          })
        }
      },
      
      logout: () => {
        set(initialState)
      },
      
      switchPersona: (personaId: string) => {
        const persona = getPersonaById(personaId)
        if (!persona) {
          set({ error: "Invalid persona ID" })
          return
        }
        
        const user: AuthUser = {
          id: persona.id,
          email: persona.email,
          name: persona.name,
          role: persona.role,
          org: persona.org,
          entitlements: persona.entitlements,
        }
        
        set({
          user,
          personaId: persona.id,
          isAuthenticated: true,
          error: null,
        })
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      reset: () => set(initialState),
      
      // Computed helpers
      isInternal: () => {
        const { user } = get()
        return user?.role === "internal" || user?.role === "admin" || user?.entitlements.includes("*")
      },
      
      hasEntitlement: (entitlement: Entitlement) => {
        const { user } = get()
        if (!user) return false
        return user.entitlements.includes("*") || user.entitlements.includes(entitlement)
      },
      
      canAccess: (requiredEntitlements: Entitlement[]) => {
        const { user } = get()
        if (!user) return false
        if (user.entitlements.includes("*")) return true
        return requiredEntitlements.some((e) => user.entitlements.includes(e))
      },
    }),
    {
      name: "odum-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        personaId: state.personaId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
