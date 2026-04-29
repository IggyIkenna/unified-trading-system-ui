"use client";

/**
 * Shared post-auth default-landing resolver.
 *
 * Used by:
 *   - `app/(public)/login/page.tsx` — post-login redirect target
 *   - `app/(public)/page.tsx` (HomePageClient) — auto-redirect already-
 *     authenticated visitors away from the marketing homepage
 *
 * Routing:
 *   1. Admin / internal users → /dashboard (their `["*"]` wildcard would
 *      otherwise hit every entitlement check and route to IR).
 *   2. `investor-board` or `investor-archive` entitlement → /investor-relations.
 *   3. Email in IR_EMAILS (belt-and-suspenders for slow/empty backend) →
 *      /investor-relations.
 *   4. Otherwise → /dashboard.
 *
 * An explicit `?redirect=...` query param always wins (handled by callers,
 * not here — this resolver only computes the default destination).
 */

import * as React from "react";
import { useAuth, type AuthUser } from "@/hooks/use-auth";

/**
 * Hardcoded IR-recipient email fallback. Module-scope so the Set isn't
 * recreated on every render.
 */
const IR_EMAILS: ReadonlySet<string> = new Set([
  // Canonical IR distribution aliases (com + co.uk).
  "investors@odum-research.com",
  "investors@odum-research.co.uk",
  // Seeded singular personas (legacy demo accounts).
  "investor@odum-research.co.uk",
  "advisor@odum-research.co.uk",
]);

/**
 * Resolve the default post-auth landing path for the current user.
 * Returns "/dashboard" until auth has loaded — callers should defer the
 * redirect until `useAuth().loading === false`.
 *
 * The returned resolver accepts an optional `override` AuthUser. The login
 * page passes the freshly-authenticated user from `loginByEmail` here:
 * immediately after that resolves, the React `user` state hasn't committed
 * yet, so role-based checks (`isAdmin()` / `isInternal()`) would read stale
 * state and let wildcard `["*"]` admins fall through to the entitlement
 * branch (which DOES see fresh provider state) — routing them incorrectly
 * to /investor-relations. The homepage caller doesn't need an override
 * (its effect only runs once `user` is in React state).
 */
export function useDefaultLanding(): (override?: AuthUser | null) => string {
  const { user, hasEntitlement } = useAuth();

  return React.useCallback(
    (override?: AuthUser | null): string => {
      const effective = override ?? user;
      const role = effective?.role;
      if (role === "admin" || role === "internal") {
        return "/dashboard";
      }
      if (hasEntitlement("investor-board") || hasEntitlement("investor-archive")) {
        return "/investor-relations";
      }
      const email = effective?.email;
      if (email && IR_EMAILS.has(email.toLowerCase())) {
        return "/investor-relations";
      }
      return "/dashboard";
    },
    [hasEntitlement, user],
  );
}
