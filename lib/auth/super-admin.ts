/**
 * Pure helpers for the super-admin / full-admin distinction.
 *
 * Super admin = can onboard people into external systems (Workspace /
 * GitHub / GCP / Slack) and grant other users wildcard entitlements.
 *
 * Full admin = scoped to the UTS UI — view/manage/mint inside the app
 * only. Cannot grant wildcard entitlements to others.
 *
 * Source of truth is the `superAdmin` Firebase custom claim. Legacy
 * accounts pre-dating the flag (e.g. ikenna@odum-research.com with
 * `entitlements:["*"]`) are treated as super admin via back-compat so
 * we don't accidentally demote them on rollout.
 */

export interface AdminClaimShape {
  readonly role?: unknown;
  readonly admin?: unknown;
  readonly superAdmin?: unknown;
  readonly entitlements?: unknown;
}

/**
 * Resolve the super-admin status of a caller from their decoded ID-token
 * claims. Pure — no Firebase calls. Use this anywhere you need to enforce
 * the super-vs-full distinction.
 */
export function isSuperAdminClaim(claims: AdminClaimShape | null | undefined): boolean {
  if (!claims) return false;
  if (claims.superAdmin === true) return true;
  if (claims.superAdmin === false) return false;
  // No explicit flag — back-compat: treat the legacy wildcard-only shape
  // (role:admin + entitlements:["*"], no superAdmin field) as super admin.
  const ents = claims.entitlements;
  const isAdminRole = claims.role === "admin" || claims.admin === true;
  return isAdminRole && Array.isArray(ents) && ents.includes("*");
}

/**
 * Entitlement values that effectively grant super-admin power. Granting any
 * of these to another user via /api/admin/set-claims requires the caller
 * to itself be a super admin.
 */
export const RESTRICTED_ENTITLEMENTS: ReadonlySet<string> = new Set(["*", "admin", "super_admin"]);

export function isRestrictedEntitlementGrant(ents: readonly unknown[]): boolean {
  return ents.some((e) => typeof e === "string" && RESTRICTED_ENTITLEMENTS.has(e));
}
