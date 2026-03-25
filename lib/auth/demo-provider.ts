import { ALL_ENTITLEMENTS } from "@/lib/config/auth"
import type { Entitlement } from "@/lib/config/auth"
import {
  getPersonaById,
  getPersonaByEmail,
} from "@/lib/auth/personas"
import type { AuthProvider, AuthUser } from "./types"

const STORAGE_KEY = "portal_user"
const TOKEN_KEY = "portal_token"

function personaToAuthUser(persona: {
  id: string
  email: string
  displayName: string
  role: "internal" | "client" | "admin"
  org: { id: string; name: string }
  entitlements: readonly string[]
}): AuthUser {
  return {
    id: persona.id,
    email: persona.email,
    displayName: persona.displayName,
    role: persona.role,
    org: persona.org,
    entitlements: persona.entitlements as AuthUser["entitlements"],
  }
}

export class DemoAuthProvider implements AuthProvider {
  private user: AuthUser | null = null
  private token: string | null = null

  constructor() {
    this.restore()
  }

  private restore(): void {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const savedToken = localStorage.getItem(TOKEN_KEY)
      if (!raw) return
      const stored = JSON.parse(raw) as { id: string; email: string }
      const persona =
        getPersonaById(stored.id) ?? getPersonaByEmail(stored.email)
      if (persona) {
        this.user = personaToAuthUser(persona)
        this.token = savedToken ?? `demo-token-${persona.id}`
      }
    } catch {
      // Corrupted localStorage — start fresh
    }
  }

  async login(credential: string, secret?: string): Promise<AuthUser | null> {
    let persona = getPersonaById(credential)

    if (!persona) {
      persona = getPersonaByEmail(credential)
      if (persona && secret !== undefined && persona.password !== secret) {
        return null
      }
    }

    if (!persona) {
      // Check mock signup users (created during signup flow)
      try {
        const raw = localStorage.getItem("mock-signup-users")
        if (raw) {
          const signupUsers = JSON.parse(raw) as Array<{ id: string; email: string; password: string; uid: string }>
          const match = signupUsers.find((u) => u.email === credential && u.password === secret)
          if (match) {
            this.user = {
              id: match.id,
              email: match.email,
              displayName: match.email.split("@")[0],
              role: "client",
              org: { id: "pending", name: "Pending Approval" },
              entitlements: [],
            }
            this.token = `demo-token-${match.uid}`
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
            localStorage.setItem(TOKEN_KEY, this.token)
            return this.user
          }
        }
      } catch { /* ignore */ }
      return null
    }

    this.user = personaToAuthUser(persona)
    this.token = `demo-token-${persona.id}`
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
    localStorage.setItem(TOKEN_KEY, this.token)
    return this.user
  }

  async logout(): Promise<void> {
    this.user = null
    this.token = null
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem("odum_user")
  }

  async getToken(): Promise<string | null> {
    return this.token
  }

  getUser(): AuthUser | null {
    return this.user
  }

  isAuthenticated(): boolean {
    return this.user !== null
  }

  hasEntitlement(entitlement: Entitlement): boolean {
    if (!this.user) return false
    if (this.user.entitlements.includes(ALL_ENTITLEMENTS)) return true
    return this.user.entitlements.includes(entitlement)
  }

  onAuthStateChanged(_callback: (user: AuthUser | null) => void): () => void {
    return () => {}
  }
}
