import type {
  UserRole,
  Entitlement,
  EntitlementOrWildcard,
  StrategyFamilyEntitlement,
  TradingEntitlement,
  Org,
} from "@/lib/config/auth";

/** Account status from the backend user_profiles collection. */
export type UserStatus = "active" | "pending_approval" | "rejected" | "disabled" | "unknown";

/**
 * Discriminator for tenants outside the admin/internal/client axis.
 * Currently only `counterparty` (Signal Leasing tenants — see
 * `lib/auth/counterparty.ts` + plan `signal_leasing_broadcast_architecture_2026_04_20`).
 * Stamped from custom JWT claims (Firebase custom claim `userType` /
 * OAuth introspection `user_type`) by the active `AuthProvider`.
 */
export type AuthUserType = "counterparty";

/** Authenticated user shape shared across all auth providers. */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  org: Org;
  entitlements: readonly (EntitlementOrWildcard | TradingEntitlement | StrategyFamilyEntitlement)[];
  /**
   * Closed list of strategy slot labels this user is routed to (mirrors the
   * `assigned_strategies` field on `AuthPersona`). When set, this is the
   * narrowest scope — widgets tagged with a matching archetype unlock even
   * if the user lacks broader entitlements. See `lib/widgets/access.ts`.
   */
  assigned_strategies?: readonly string[];
  authorized?: boolean;
  status?: UserStatus;
  capabilities?: string[];
  /**
   * Tenant-type discriminator outside the standard role axis. `role` stays
   * as-is (typically `"client"`) for counterparty tenants so existing
   * entitlement checks still work; `userType` lets the router / middleware
   * branch to the counterparty dashboard on login. See
   * `lib/auth/counterparty.ts`.
   */
  userType?: AuthUserType;
  /**
   * Canonical counterparty identifier (matches UAC `Counterparty.id`).
   * Populated by the auth provider from custom JWT claim `counterparty_id`.
   * Used by the dashboard + observability API to scope queries to the
   * counterparty's entitled slots only.
   */
  counterpartyId?: string;
  /**
   * Scoped admin permissions. Present only on `role === "admin"` users
   * provisioned via the admin UI (`/ops/admin/users/[id]/modify`). Bootstrap
   * seed users (ikenna / femi) MAY omit this claim entirely — the
   * `hasAdminPermission` gate falls back to "full admin" when `undefined`.
   * See SSOT: `codex/14-playbooks/cross-cutting/admin-permissions.md`.
   */
  admin_permissions?: readonly string[];
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
