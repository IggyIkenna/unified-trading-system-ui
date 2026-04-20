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

/** Legacy entitlement marker — retained for backward compatibility with the
 * stub-era wiring. Prefer the `AuthUser.userType === "counterparty"` JWT-claim
 * discriminator for new code. Both paths resolve to `isCounterpartyUser`. */
const COUNTERPARTY_ENTITLEMENT_MARKER = "counterparty-tenant" as const;

/**
 * Return true if the authenticated user is a counterparty-type tenant.
 *
 * Resolution order:
 *   1. `user.userType === "counterparty"` — canonical. Stamped from the
 *      custom JWT claim `userType` (Firebase) / `user_type` (OAuth) by the
 *      active `AuthProvider`.
 *   2. `user.entitlements` contains `"counterparty-tenant"` — legacy marker
 *      kept for the stub-era fixtures. Safe to delete once every provider
 *      stamps `userType`.
 *
 * Safe default: `false` if neither signal is present — no existing persona
 * is accidentally routed to the counterparty dashboard.
 */
export function isCounterpartyUser(
  user: AuthUser | null | undefined,
): boolean {
  if (user == null) return false;
  if (user.userType === COUNTERPARTY_USER_TYPE) return true;
  return user.entitlements.includes(
    COUNTERPARTY_ENTITLEMENT_MARKER as never,
  );
}

/**
 * Return the canonical counterparty identifier for a counterparty-type user.
 * Matches UAC `Counterparty.id`. Used by the dashboard + observability API
 * to scope queries to the counterparty's entitled slots.
 *
 * Returns `null` for non-counterparty users or when the JWT claim is not yet
 * stamped. Callers MUST handle `null` explicitly (never default to a
 * hardcoded counterparty id — cross-tenant-leak risk).
 */
export function getCounterpartyId(
  user: AuthUser | null | undefined,
): string | null {
  if (!isCounterpartyUser(user)) return null;
  return user?.counterpartyId ?? null;
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
