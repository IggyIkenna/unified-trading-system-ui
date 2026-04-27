"use client";

/**
 * PageEntitlementGate — page-level entitlement check with frosted overlay.
 *
 * Unlike the layout-level EntitlementGate (which replaces content entirely),
 * this component renders children behind a frosted-glass overlay so the user
 * can see what they're missing — the FOMO lock pattern.
 *
 * Usage:
 *   <PageEntitlementGate
 *     entitlement={{ domain: "trading-defi", tier: "basic" }}
 *     featureName="DeFi Trading"
 *   >
 *     <DeFiPage />
 *   </PageEntitlementGate>
 */

import { useAuth } from "@/hooks/use-auth";
import { hasAnyEntitlement } from "./entitlement-gate";
import {
  isStrategyFamilyEntitlement,
  type Entitlement,
  type StrategyFamilyEntitlement,
  type StrategyFamilyKey,
  type TradingEntitlement,
} from "@/lib/config/auth";
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
  featureName,
  description,
  children,
}: PageEntitlementGateProps) {
  const { hasEntitlement, isAdmin, isInternal, user } = useAuth();

  // Admins and internal users always pass
  if (isAdmin() || isInternal()) return <>{children}</>;

  const requiredList = entitlements ?? (entitlement ? [entitlement] : []);
  if (requiredList.length === 0) return <>{children}</>;

  const userEnts = user?.entitlements ?? [];
  if (hasAnyEntitlement(requiredList, hasEntitlement, userEnts)) return <>{children}</>;

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
