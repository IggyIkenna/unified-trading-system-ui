"use client";

/**
 * useStrategyVisibility — shared hook that runs the StrategyAvailabilityResolver
 * against the demo strategy spread and returns the per-state counts.
 *
 * Per audit polish #3: the resolver should drive cockpit rendering — not just
 * the summary strip. Consumers:
 *
 *   - StrategyVisibilitySummary  → renders the count chips
 *   - ContextualLockedPreview    → hides itself when nothing is locked
 *   - PresetSelector             → adds per-preset visibility badge
 *
 * Sharing the hook means every surface reads from one canonical decision
 * pipeline — change the resolver inputs once, every surface updates.
 */

import * as React from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  resolveVisibleStrategyInstances,
  type AuthUserForResolver,
  type StrategyInstanceForResolver,
  type StrategyVisibilityDecision,
  type StrategyVisibilityState,
} from "@/lib/architecture-v2/strategy-availability-resolver";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";

/**
 * Representative spread of strategy instances covering every combination of
 * (maturity × availability × routing × coverage) the resolver needs to
 * exercise. This is the SSOT spread; both StrategyVisibilitySummary and the
 * resolver-aware FOMO/preset surfaces share it.
 */
export const DEMO_INSTANCES: readonly StrategyInstanceForResolver[] = [
  // Mainstream owned (DART-Full subscription paths)
  {
    id: "arb-cefi-defi-spot",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "carry-basis-perp-cefi",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "yield-rotation-defi",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "stat-arb-pairs",
    maturityPhase: "paper_14d",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "vol-deribit",
    maturityPhase: "paper_1d",
    coverageStatus: "PARTIAL",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "ml-directional",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "BTC",
  },

  // Available-to-request (Tier-3 catalogue)
  {
    id: "carry-recursive-staked",
    maturityPhase: "paper_14d",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "liquidation-capture-defi",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "event-driven-sports",
    maturityPhase: "paper_14d",
    coverageStatus: "PARTIAL",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: null,
  },
  {
    id: "market-making-prediction",
    maturityPhase: "paper_14d",
    coverageStatus: "PARTIAL",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: null,
  },

  // IM-reserved
  {
    id: "im-reserved-mandate-a",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "im_only",
    availabilityState: "INVESTMENT_MANAGEMENT_RESERVED",
    shareClass: "USDT",
  },
  {
    id: "im-reserved-mandate-b",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "im_only",
    availabilityState: "INVESTMENT_MANAGEMENT_RESERVED",
    shareClass: "BTC",
  },

  // Pre-maturity (hidden client-side; visible admin)
  {
    id: "smoke-experimental",
    maturityPhase: "smoke",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "backtest-only",
    maturityPhase: "backtest_30d",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },

  // Internal admin-only
  {
    id: "internal-only-vol",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "internal_only",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },

  // Retired (always hidden client-side)
  {
    id: "retired-arb-old",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "RETIRED",
    shareClass: "USDT",
  },

  // Coverage-blocked (hidden for clients; visible internally)
  {
    id: "blocked-tradfi-options",
    maturityPhase: "paper_1d",
    coverageStatus: "BLOCKED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },

  // Client-exclusive (visible to IM-desk as read_only; hidden from prospects)
  {
    id: "client-exclusive-mandate",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "im_only",
    availabilityState: "CLIENT_EXCLUSIVE",
    shareClass: "USDT",
  },
];

export interface VisibilityCounts {
  readonly owned: number;
  readonly available_to_request: number;
  readonly locked_by_tier: number;
  readonly locked_by_workflow: number;
  readonly hidden: number;
  readonly admin_only: number;
  readonly read_only: number;
}

export interface StrategyVisibilityResult {
  readonly counts: VisibilityCounts;
  readonly decisions: readonly { instance: StrategyInstanceForResolver; decision: StrategyVisibilityDecision }[];
  readonly totalVisible: number;
  readonly totalInstances: number;
  /** True iff at least one instance is `locked_by_tier` or `locked_by_workflow`. */
  readonly hasLockedCapabilities: boolean;
  /** True iff at least one instance is `available_to_request`. */
  readonly hasAvailableToRequest: boolean;
}

const ZERO_COUNTS: VisibilityCounts = {
  owned: 0,
  available_to_request: 0,
  locked_by_tier: 0,
  locked_by_workflow: 0,
  hidden: 0,
  admin_only: 0,
  read_only: 0,
};

export function useStrategyVisibility(): StrategyVisibilityResult {
  const { user } = useAuth();
  const scope = useWorkspaceScope();

  const resolverUser: AuthUserForResolver = React.useMemo(() => {
    if (!user) return { role: "client", entitlements: [], subscriptions: [] };
    return {
      role: user.role === "admin" ? "admin" : user.role === "internal" ? "internal" : "client",
      entitlements: (user.entitlements ?? []).map((e) => {
        if (typeof e === "string") return e;
        // Discriminate the union: TradingEntitlement has `domain`,
        // StrategyFamilyEntitlement has `family`.
        if ("domain" in e) return `${e.domain}:${e.tier}`;
        return `${e.family}:${e.tier}`;
      }),
      // Demo: a DART-Full subscription overlays "owned" on the first two
      // representative instances. Production wires the real list.
      subscriptions:
        user.role === "client" && user.entitlements?.some((e) => typeof e === "string" && e === "strategy-full")
          ? ["arb-cefi-defi-spot", "carry-basis-perp-cefi"]
          : [],
    };
  }, [user]);

  return React.useMemo<StrategyVisibilityResult>(() => {
    const decisions = resolveVisibleStrategyInstances(DEMO_INSTANCES, resolverUser, scope.surface);
    // Mutable working buckets; cast to VisibilityCounts (readonly) when
    // returning. Keeps the public type immutable while letting the
    // accumulation loop stay simple.
    const counts: { -readonly [K in keyof VisibilityCounts]: VisibilityCounts[K] } = { ...ZERO_COUNTS };
    for (const { decision } of decisions) {
      counts[decision.visibility as StrategyVisibilityState] += 1;
    }
    const totalVisible = decisions.length - counts.hidden;
    return {
      counts,
      decisions,
      totalVisible,
      totalInstances: DEMO_INSTANCES.length,
      hasLockedCapabilities: counts.locked_by_tier + counts.locked_by_workflow > 0,
      hasAvailableToRequest: counts.available_to_request > 0,
    };
  }, [resolverUser, scope.surface]);
}
