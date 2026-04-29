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
import { useAuth } from "@/hooks/use-auth";

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
 */
export function useDefaultLanding(): () => string {
  const { user, hasEntitlement, isAdmin, isInternal } = useAuth();

  return React.useCallback((): string => {
    if (isAdmin() || isInternal()) {
      return "/dashboard";
    }
    if (hasEntitlement("investor-board") || hasEntitlement("investor-archive")) {
      return "/investor-relations";
    }
    if (user?.email && IR_EMAILS.has(user.email.toLowerCase())) {
      return "/investor-relations";
    }
    return "/dashboard";
    // user dep is the whole object — React Compiler can't preserve a more
    // specific `user?.email` source dep without diverging from inferred,
    // and the email check is the only field accessed from `user`. Stable
    // identity from useAuth keeps re-renders quiet.
  }, [hasEntitlement, isAdmin, isInternal, user]);
}
