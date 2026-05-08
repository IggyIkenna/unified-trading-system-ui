/**
 * Admin permission model.
 *
 * SSOT: `unified-trading-pm/codex/14-playbooks/cross-cutting/admin-permissions.md`.
 * Plan: `plans/active/ui_unification_v2_sanitisation_2026_04_20.md` Phase 6.
 *
 * Gates destructive admin-only actions that binary `role === "admin"` must not
 * be sufficient for. Bootstrap admins (ikenna / femi seed users) carry
 * `role === "admin"` with NO `admin_permissions` claim; they fall back to
 * "legacy full admin" behaviour (pass every check). Scoped admins explicitly
 * enumerate their permitted operations.
 */
import type { AuthUser } from "@/lib/auth/types";

export type AdminPermission =
  | "admin:grant_role"
  | "admin:create_org"
  | "admin:lock_strategy"
  | "admin:impersonate"
  | "admin:rotate_secret"
  | "admin:modify_user"
  | "admin:offboard_user"
  | "admin:view_audit"
  | "admin:manage_apps"
  | "admin:manage_entitlements";

/** Complete admin-permission set. Keep in sync with the codex SSOT. */
export const ADMIN_PERMISSIONS: readonly AdminPermission[] = [
  "admin:grant_role",
  "admin:create_org",
  "admin:lock_strategy",
  "admin:impersonate",
  "admin:rotate_secret",
  "admin:modify_user",
  "admin:offboard_user",
  "admin:view_audit",
  "admin:manage_apps",
  "admin:manage_entitlements",
] as const;

/**
 * Admin user shape. Extends `AuthUser` with the optional
 * `admin_permissions` custom-claim array.
 *
 * The claim is stamped by the auth provider from the Firebase ID token's
 * `admin_permissions` custom claim (see scripts/admin/bootstrap-admin-user.mjs
 * for seeding). `undefined` = legacy bootstrap admin (full permissions).
 * `[]` = view-only admin (no destructive rights).
 */
export interface AdminAuthUser extends AuthUser {
  admin_permissions?: readonly AdminPermission[];
}

/**
 * Gate for destructive admin operations.
 *
 * Rules (mirrors codex SSOT §Runtime gate):
 *   1. Non-admin users always fail every permission check.
 *   2. Admin users with NO `admin_permissions` claim pass every check
 *      (bootstrap legacy fallback — ikenna + femi seed users).
 *   3. Admin users with `admin_permissions === []` fail every check
 *      (view-only admin).
 *   4. Admin users with `admin_permissions` present pass only the checks
 *      whose permission appears in the array.
 */
export function hasAdminPermission(
  user: AdminAuthUser | AuthUser | null,
  permission: AdminPermission,
): boolean {
  if (!user || user.role !== "admin") return false;
  const adminUser = user as AdminAuthUser;
  // Rule 2: bootstrap admin (claim omitted entirely) → pass everything.
  if (adminUser.admin_permissions === undefined) return true;
  // Rules 3 + 4: scoped admin. Empty array fails; present array checks membership.
  return adminUser.admin_permissions.includes(permission);
}

/**
 * True iff the user has ALL requested permissions. Use when a single UI
 * surface gates on multiple destructive operations (e.g. admin user-edit page
 * covers modify + offboard + grant-role).
 */
export function hasAllAdminPermissions(
  user: AdminAuthUser | AuthUser | null,
  permissions: readonly AdminPermission[],
): boolean {
  return permissions.every((p) => hasAdminPermission(user, p));
}

/**
 * True iff the user has ANY of the requested permissions. Use when gating a
 * nav surface that should remain visible if the admin has *any* inbound
 * action enabled (e.g. the audit-log tab is visible if the admin has either
 * `admin:view_audit` or any destructive grant — non-admins still won't see it).
 */
export function hasAnyAdminPermission(
  user: AdminAuthUser | AuthUser | null,
  permissions: readonly AdminPermission[],
): boolean {
  return permissions.some((p) => hasAdminPermission(user, p));
}
