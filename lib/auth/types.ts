import type { UserRole, Entitlement, EntitlementOrWildcard, TradingEntitlement, Org } from "@/lib/config/auth";

/** Account status from the backend user_profiles collection. */
export type UserStatus = "active" | "pending_approval" | "rejected" | "disabled" | "unknown";

/** Authenticated user shape shared across all auth providers. */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  org: Org;
  entitlements: readonly (EntitlementOrWildcard | TradingEntitlement)[];
  authorized?: boolean;
  status?: UserStatus;
  capabilities?: string[];
}

/**
 * AuthProvider interface — the seam for swapping between demo,
 * OAuth, and Firebase auth without touching consumers.
 *
 * Implementations:
 *   - DemoAuthProvider     (lib/auth/demo-provider.ts) — localStorage personas
 *   - OAuthProvider        (lib/auth/oauth-provider.ts) — stub for real OAuth
 *   - FirebaseAuthProvider (lib/auth/firebase-provider.ts) — Firebase Auth
 */
export interface AuthProvider {
  /** Attempt login. Returns the authenticated user or null on failure. */
  login(credential: string, secret?: string): Promise<AuthUser | null>;

  /** Clear session state. */
  logout(): Promise<void>;

  /** Return a bearer token (or null if unauthenticated). */
  getToken(): Promise<string | null>;

  /** Return the currently authenticated user (or null). */
  getUser(): AuthUser | null;

  /** Whether a valid session exists. */
  isAuthenticated(): boolean;

  /** Check a specific entitlement against the current user. */
  hasEntitlement(entitlement: Entitlement): boolean;

  /**
   * Subscribe to auth state changes (Firebase onAuthStateChanged).
   * Returns an unsubscribe function. Providers that don't support
   * reactive auth state can return a no-op.
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
}
