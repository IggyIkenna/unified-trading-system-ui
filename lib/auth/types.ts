import type {
  UserRole,
  Entitlement,
  EntitlementOrWildcard,
  Org,
} from "@/lib/config/auth";

/** Authenticated user shape shared across all auth providers. */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  org: Org;
  entitlements: readonly EntitlementOrWildcard[];
}

/**
 * AuthProvider interface — the seam for swapping between demo
 * (persona-based) auth and real OAuth without touching consumers.
 *
 * Implementations:
 *   - DemoAuthProvider  (lib/auth/demo-provider.ts) — localStorage personas
 *   - OAuthProvider     (lib/auth/oauth-provider.ts) — stub for real OAuth
 */
export interface AuthProvider {
  /** Attempt login. Returns the authenticated user or null on failure. */
  login(credential: string, secret?: string): AuthUser | null;

  /** Clear session state. */
  logout(): void;

  /** Return a bearer token (or null if unauthenticated). */
  getToken(): string | null;

  /** Return the currently authenticated user (or null). */
  getUser(): AuthUser | null;

  /** Whether a valid session exists. */
  isAuthenticated(): boolean;

  /** Check a specific entitlement against the current user. */
  hasEntitlement(entitlement: Entitlement): boolean;
}
