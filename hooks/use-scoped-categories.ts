"use client";

/**
 * useScopedCategories — returns data categories split into subscribed vs locked.
 *
 * Internal/admin users (entitlements: ["*"]) get all categories as subscribed.
 * Client users see categories filtered by their entitlements:
 *   - "data-basic"  → cefi
 *   - "data-pro"    → cefi, tradfi, defi, onchain_perps
 *   - "internal-only" categories → only shown to internal/admin
 *
 * Subscribed categories are shown first; locked categories shown below with
 * a lock icon and upgrade CTA (per "one platform, filtered" principle).
 */

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORY_ENTITLEMENT_MAP, type DataCategory } from "@/lib/types/data-service";

const ALL_CATEGORIES = Object.keys(CATEGORY_ENTITLEMENT_MAP) as DataCategory[];

export interface ScopedCategories {
  /** Categories the current user can access — shown first */
  subscribed: DataCategory[];
  /** Categories the user cannot access — shown below with lock */
  locked: DataCategory[];
  /** Whether the current user has wildcard access (internal/admin) */
  isUnrestricted: boolean;
}

export function useScopedCategories(): ScopedCategories {
  const { user } = useAuth();

  return useMemo(() => {
    // Unauthenticated or loading — show nothing
    if (!user) {
      return { subscribed: [], locked: [], isUnrestricted: false };
    }

    // Internal and admin see everything
    const isUnrestricted =
      user.role === "internal" || user.role === "admin" || (user.entitlements as readonly string[]).includes("*");

    if (isUnrestricted) {
      return {
        subscribed: ALL_CATEGORIES,
        locked: [],
        isUnrestricted: true,
      };
    }

    const entitlementSet = new Set(user.entitlements as readonly string[]);

    const subscribed: DataCategory[] = [];
    const locked: DataCategory[] = [];

    for (const category of ALL_CATEGORIES) {
      const required = CATEGORY_ENTITLEMENT_MAP[category];

      if (required === "internal-only") {
        // Never shown to clients
        continue;
      }

      // data-pro is a superset of data-basic: it unlocks all non-internal categories.
      // data-basic only unlocks categories requiring "data-basic".
      if (entitlementSet.has(required) || entitlementSet.has("data-pro")) {
        subscribed.push(category);
      } else {
        locked.push(category);
      }
    }

    return { subscribed, locked, isUnrestricted: false };
  }, [user]);
}
