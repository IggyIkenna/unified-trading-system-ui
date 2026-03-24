import type { Entitlement } from "@/lib/config/auth"
import { ALL_ENTITLEMENTS } from "@/lib/config/auth"
import type { AuthProvider, AuthUser } from "./types"

/**
 * OAuth provider stub — to be implemented when real OAuth is wired.
 */
export class OAuthProvider implements AuthProvider {
  private user: AuthUser | null = null
  private token: string | null = null

  async login(_credential: string, _secret?: string): Promise<AuthUser | null> {
    return null
  }

  async logout(): Promise<void> {
    this.user = null
    this.token = null
  }

  async getToken(): Promise<string | null> {
    return this.token
  }

  getUser(): AuthUser | null {
    return this.user
  }

  isAuthenticated(): boolean {
    return this.user !== null && this.token !== null
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
