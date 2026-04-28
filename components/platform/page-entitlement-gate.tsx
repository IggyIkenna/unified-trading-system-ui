"use client";

/**
 * PageEntitlementGate — page-level entitlement check with frosted overlay.
 *
 * Unlike the layout-level EntitlementGate (which replaces content entirely),
 * this component renders children behind a frosted-glass overlay so the user
 * can see what they're missing — the FOMO lock pattern.
 *
 * 2026-04-28 (DART tile-split SSOT): added `requiredInstrumentTypes`,
 * `requiredAssetGroups`, and `derivationMode` props. When set, the gate
 * resolves the user's effective instrument types via
 * `instrumentTypesForUser(user, mode)` (lib/architecture-v2/user-instrument-
 * types.ts) and unlocks the page iff the user's set intersects the required
 * set. Default mode is "fomo" — non-DART-Full users see views matching their
 * teaser strategies too. Admin (`["*"]`) bypasses (already in place).
 *
 * Usage:
 *   <PageEntitlementGate
 *     entitlement={{ domain: "trading-defi", tier: "basic" }}
 *     featureName="DeFi Trading"
 *   >
 *     <DeFiPage />
 *   </PageEntitlementGate>
 *
 *   <PageEntitlementGate
 *     requiredAssetGroups={["SPORTS"]}
 *     featureName="Sports Trading"
 *     description="Subscribe to a sports strategy to unlock this view."
 *   >
 *     <SportsPage />
 *   </PageEntitlementGate>
 */

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { hasAnyEntitlement } from "./entitlement-gate";
import {
  isStrategyFamilyEntitlement,
  type Entitlement,
  type StrategyFamilyEntitlement,
  type StrategyFamilyKey,
  type TradingEntitlement,
} from "@/lib/config/auth";
import {
  type AssetGroup,
  type DerivationMode,
  instrumentTypesForUser,
} from "@/lib/architecture-v2/user-instrument-types";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

type GateEntitlement = Entitlement | TradingEntitlement | StrategyFamilyEntitlement;

interface PageEntitlementGateProps {
  /** Single entitlement required */
  entitlement?: GateEntitlement;
  /** OR: any of these entitlements grants access */
  entitlements?: GateEntitlement[];
  /**
   * If set, holding a strategy-family entitlement for any family in this list
   * also grants access to the page. Inner widgets gate themselves more
   * narrowly. Use on pages that surface a small set of family-specific widgets
   * within an otherwise asset-group-gated route (e.g. DeFi page accepting
   * CARRY_AND_YIELD because it carries Carry & Yield-tagged widgets).
   */
  acceptFamilies?: StrategyFamilyKey[];
  /**
   * If set, the user's `assigned_strategies` list is checked: any slot whose
   * archetype prefix is in this list grants page access. Use when a page
   * surfaces archetype-specific widgets (e.g. DeFi page accepts users with
   * a CARRY_BASIS_PERP slot even without `trading-defi` domain entitlement).
   */
  acceptArchetypes?: string[];
  /**
   * If set, the user must have at least one entitled (or teaser, in FOMO mode)
   * strategy whose `instrument_type` is in this list. Drives view-gating for
   * /services/trading/options (["option", "future"]) etc. Resolved via
   * `instrumentTypesForUser(user, derivationMode)`.
   */
  requiredInstrumentTypes?: string[];
  /**
   * If set, the user must have at least one entitled (or teaser) strategy
   * whose `category` (asset_group) is in this list. Drives view-gating for
   * /services/trading/sports (["SPORTS"]), /services/trading/defi (["DEFI"]),
   * /services/trading/predictions (["PREDICTION"]).
   */
  requiredAssetGroups?: AssetGroup[];
  /**
   * Derivation mode for `instrumentTypesForUser`. Default "fomo" — non-DART-
   * Full users see views matching their teaser strategies too, driving upsell
   * exposure. Set "reality" for strict entitled-only gating.
   */
  derivationMode?: DerivationMode;
  /** Human-readable feature name for the lock message */
  featureName: string;
  /** Optional description below the lock title */
  description?: string;
  children: React.ReactNode;
}

export function PageEntitlementGate({
  entitlement,
  entitlements,
  acceptFamilies,
  acceptArchetypes,
  requiredInstrumentTypes,
  requiredAssetGroups,
  derivationMode = "fomo",
  featureName,
  description,
  children,
}: PageEntitlementGateProps) {
  const { hasEntitlement, isAdmin, isInternal, user } = useAuth();

  // Async-resolved instrument-type / asset-group sets for the user. Initial
  // value `null` means "not yet resolved" — we render children optimistically
  // until the lookup completes (avoids a content flash on every navigation).
  // Once resolved, the gate-decision logic below checks intersection.
  const [resolvedInstrumentTypes, setResolvedInstrumentTypes] = React.useState<Set<string> | null>(null);
  const [resolvedAssetGroups, setResolvedAssetGroups] = React.useState<Set<AssetGroup> | null>(null);

  const wantsInstrumentGate =
    (requiredInstrumentTypes && requiredInstrumentTypes.length > 0) ||
    (requiredAssetGroups && requiredAssetGroups.length > 0);

  React.useEffect(() => {
    if (!wantsInstrumentGate) return;
    let cancelled = false;
    void instrumentTypesForUser(user ?? null, derivationMode)
      .then((derived) => {
        if (cancelled) return;
        setResolvedInstrumentTypes(derived.instrumentTypes);
        setResolvedAssetGroups(derived.assetGroups);
      })
      .catch(() => {
        if (cancelled) return;
        // On lookup failure, default to empty sets — the gate falls through
        // to the FOMO overlay rather than silently unlocking.
        setResolvedInstrumentTypes(new Set<string>());
        setResolvedAssetGroups(new Set<AssetGroup>());
      });
    return () => {
      cancelled = true;
    };
  }, [user, derivationMode, wantsInstrumentGate]);

  // Admins and internal users always pass
  if (isAdmin() || isInternal()) return <>{children}</>;

  const requiredList = entitlements ?? (entitlement ? [entitlement] : []);
  const userEnts = user?.entitlements ?? [];

  // If the caller declared instrument-type / asset-group requirements, those
  // are the primary gate. Resolve them first; fall through to entitlement-
  // based gating only when both checks fail.
  if (wantsInstrumentGate) {
    // While the async lookup is in-flight, optimistic render — a flash of
    // content is preferable to a flash of FOMO overlay.
    if (resolvedInstrumentTypes === null || resolvedAssetGroups === null) {
      return <>{children}</>;
    }
    const instrumentTypeMatch =
      !requiredInstrumentTypes ||
      requiredInstrumentTypes.length === 0 ||
      requiredInstrumentTypes.some((t) => resolvedInstrumentTypes.has(t));
    const assetGroupMatch =
      !requiredAssetGroups ||
      requiredAssetGroups.length === 0 ||
      requiredAssetGroups.some((g) => resolvedAssetGroups.has(g));
    if (instrumentTypeMatch && assetGroupMatch) return <>{children}</>;
    // Instrument-type / asset-group gate failed — fall through to FOMO overlay
    // (skipping the entitlement-list short-circuit since the caller has opted
    // into instrument-type-driven gating).
  } else {
    if (requiredList.length === 0) return <>{children}</>;
    if (hasAnyEntitlement(requiredList, hasEntitlement, userEnts)) return <>{children}</>;
  }

  // Family-axis fallback: if the page declares family fallbacks and the user
  // holds an entitlement for any of them, let the page render. Inner widget
  // gates narrow it to which widgets actually unlock.
  if (acceptFamilies && acceptFamilies.length > 0) {
    const allowed = new Set<StrategyFamilyKey>(acceptFamilies);
    const hasAcceptableFamily = userEnts.some((e) => isStrategyFamilyEntitlement(e) && allowed.has(e.family));
    if (hasAcceptableFamily) return <>{children}</>;
  }

  // Slot-label fallback: if the user's assigned_strategies includes a slot
  // whose archetype prefix is in `acceptArchetypes`, let the page render.
  if (acceptArchetypes && acceptArchetypes.length > 0 && user?.assigned_strategies?.length) {
    const allowed = new Set<string>(acceptArchetypes);
    const hasAcceptableSlot = user.assigned_strategies.some((slot) => {
      const at = slot.indexOf("@");
      const archetype = at === -1 ? slot : slot.slice(0, at);
      return allowed.has(archetype);
    });
    if (hasAcceptableSlot) return <>{children}</>;
  }

  // Locked — render content blurred with overlay
  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred content behind the overlay — gives FOMO effect */}
      <div className="pointer-events-none select-none blur-[6px] opacity-40" aria-hidden="true">
        {children}
      </div>

      {/* Frosted glass overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-5 text-center max-w-md px-6">
          <div className="flex size-14 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
            <Lock className="size-6 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-tight">{featureName} requires an upgrade</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description ??
                `Your current subscription doesn't include ${featureName}. Contact your account manager to unlock this capability.`}
            </p>
          </div>

          <Button variant="outline" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
            Get in Touch
          </Button>
        </div>
      </div>
    </div>
  );
}
