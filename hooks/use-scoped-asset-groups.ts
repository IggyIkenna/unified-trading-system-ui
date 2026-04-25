"use client";

/**
 * useScopedAssetGroups — returns data asset groups (shard axis) split into subscribed vs locked.
 *
 * Internal/admin users (entitlements: ["*"]) get all asset groups as subscribed.
 * Client users see asset groups filtered by their entitlements:
 *   - "data-basic"  → cefi
 *   - "data-pro"    → cefi, tradfi, defi, onchain_perps
 *   - "internal-only" asset groups → only shown to internal/admin
 *
 * Subscribed asset groups are shown first; locked asset groups are shown below with
 * a lock icon and upgrade CTA (per "one platform, filtered" principle).
 */

import { useAuth } from "@/hooks/use-auth";
import { CATEGORY_ENTITLEMENT_MAP, type DataCategory } from "@/lib/types/data-service";
import { useMemo } from "react";

const ALL_DATA_ASSET_GROUPS = Object.keys(CATEGORY_ENTITLEMENT_MAP) as DataCategory[];

export interface ScopedAssetGroups {
  /** Asset groups the current user can access — shown first */
  subscribed: DataCategory[];
  /** Asset groups the user cannot access — shown below with lock */
  locked: DataCategory[];
  /** Whether the current user has wildcard access (internal/admin) */
  isUnrestricted: boolean;
}

export function useScopedAssetGroups(): ScopedAssetGroups {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return { subscribed: [], locked: [], isUnrestricted: false };
    }

    const isUnrestricted =
      user.role === "internal" || user.role === "admin" || (user.entitlements as readonly string[]).includes("*");

    if (isUnrestricted) {
      return {
        subscribed: ALL_DATA_ASSET_GROUPS,
        locked: [],
        isUnrestricted: true,
      };
    }

    const entitlementSet = new Set(user.entitlements as readonly string[]);

    const subscribed: DataCategory[] = [];
    const locked: DataCategory[] = [];

    for (const assetGroup of ALL_DATA_ASSET_GROUPS) {
      const required = CATEGORY_ENTITLEMENT_MAP[assetGroup];

      if (required === "internal-only") {
        continue;
      }

      if (entitlementSet.has(required) || entitlementSet.has("data-pro")) {
        subscribed.push(assetGroup);
      } else {
        locked.push(assetGroup);
      }
    }

    return { subscribed, locked, isUnrestricted: false };
  }, [user]);
}
