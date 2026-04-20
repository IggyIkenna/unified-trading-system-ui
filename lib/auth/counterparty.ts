/**
 * Counterparty persona integration (Plan B Phase 5, D9 resolution).
 *
 * A "counterparty" is NOT a UI persona (see lib/auth/personas.ts which is
 * reserved for demo/prospect personas). Counterparties are real tenants
 * consuming the signal-broadcast channel — a separate domain entity whose
 * canonical SSOT is the UAC Python type
 * `unified_api_contracts.internal.domain.signal_broadcast.Counterparty`.
 *
 * This module owns the minimal auth-layer wiring that lets the UI recognise
 * counterparty-type authenticated users and route them to their dashboard
 * after login. A full counterparty-auth implementation (org-scoped JWT claims
 * + per-client API keys) is tracked as a follow-up in the plan under
 * roadmap/next-waves.md; the constants here are the stub a future agent can
 * wire into the auth middleware without refactoring the AuthUser shape.
 */

import type { AuthUser } from "./types";

/**
 * UserType discriminator for counterparty-authenticated sessions. We avoid
 * collapsing this into `UserRole` ("admin" | "internal" | "client") because
 * a counterparty is semantically neither an internal Odum user nor an Odum
 * capital-allocation client — they're a third domain axis.
 */
export const COUNTERPARTY_USER_TYPE = "counterparty" as const;

/**
 * Post-authentication redirect for counterparty users. Owned by B-3a's
 * dashboard route — see `app/(platform)/services/signals/dashboard/`.
 */
export const COUNTERPARTY_POST_AUTH_REDIRECT =
  "/services/signals/dashboard" as const;

/**
 * Return true if the authenticated user is a counterparty-type tenant.
 *
 * Looks for an explicit `userType === "counterparty"` discriminator on the
 * user object. The field doesn't exist on the current `AuthUser` shape — the
 * FirebaseAuthProvider / OAuthProvider must stamp it from org metadata /
 * custom JWT claims once the full counterparty-auth flow lands.
 *
 * Until then, this helper returns `false` for every existing persona (safe
 * default: no existing user is routed to the counterparty dashboard).
 */
export function isCounterpartyUser(
  user: AuthUser | null | undefined,
): boolean {
  if (user == null) return false;
  // Discriminator is attached via `entitlements` until full JWT claims land.
  // Look for the counterparty-tenant marker; strictly opt-in so no existing
  // persona is accidentally mis-routed.
  return user.entitlements.includes(
    "counterparty-tenant" as never,
  );
}

/**
 * Compute the post-login redirect for a user. Counterparty users land on the
 * observability dashboard (B-3a); all other users fall through to the caller's
 * default (typically `/dashboard`).
 */
export function postAuthRedirectFor(
  user: AuthUser | null | undefined,
  fallback: string = "/dashboard",
): string {
  if (isCounterpartyUser(user)) {
    return COUNTERPARTY_POST_AUTH_REDIRECT;
  }
  return fallback;
}
