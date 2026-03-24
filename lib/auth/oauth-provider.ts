import type { Entitlement } from "@/lib/config/auth";
import { ALL_ENTITLEMENTS } from "@/lib/config/auth";
import type { AuthProvider, AuthUser } from "./types";

/**
 * OAuth provider stub — to be implemented when real OAuth is wired.
 *
 * Current state: returns null for everything. Swap to real OAuth by:
 *   1. Implementing the OIDC / OAuth2 PKCE flow in login()
 *   2. Storing the access token from the IdP
 *   3. Parsing the ID token claims into AuthUser
 *   4. Setting NEXT_PUBLIC_AUTH_PROVIDER=oauth in .env
 *
 * The consumer (useAuth) does not need to change — it talks to the
 * AuthProvider interface, not the concrete class.
 */
export class OAuthProvider implements AuthProvider {
  private user: AuthUser | null = null;
  private token: string | null = null;

  login(_credential: string, _secret?: string): AuthUser | null {
    // TODO: Implement OAuth2 PKCE flow
    // 1. Redirect to IdP authorize endpoint
    // 2. Exchange auth code for tokens
    // 3. Parse ID token claims → AuthUser
    return null;
  }

  logout(): void {
    this.user = null;
    this.token = null;
    // TODO: Revoke token at IdP + clear session cookies
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null && this.token !== null;
  }

  hasEntitlement(entitlement: Entitlement): boolean {
    if (!this.user) return false;
    if (this.user.entitlements.includes(ALL_ENTITLEMENTS)) return true;
    return this.user.entitlements.includes(entitlement);
  }
}
