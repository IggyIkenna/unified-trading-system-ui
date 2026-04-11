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
 *     entitlement="defi-trading"
 *     featureName="DeFi Trading"
 *   >
 *     <DeFiPage />
 *   </PageEntitlementGate>
 */

import { useAuth } from "@/hooks/use-auth";
import { hasAnyEntitlement } from "./entitlement-gate";
import type { Entitlement } from "@/lib/config/auth";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageEntitlementGateProps {
  /** Single entitlement required */
  entitlement?: Entitlement;
  /** OR: any of these entitlements grants access */
  entitlements?: string[];
  /** Human-readable feature name for the lock message */
  featureName: string;
  /** Optional description below the lock title */
  description?: string;
  children: React.ReactNode;
}

export function PageEntitlementGate({
  entitlement,
  entitlements,
  featureName,
  description,
  children,
}: PageEntitlementGateProps) {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();

  // Admins and internal users always pass
  if (isAdmin() || isInternal()) return <>{children}</>;

  const requiredList = entitlements ?? (entitlement ? [entitlement] : []);
  if (requiredList.length === 0) return <>{children}</>;

  if (hasAnyEntitlement(requiredList, hasEntitlement)) return <>{children}</>;

  // Locked — render content blurred with overlay
  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred content behind the overlay — gives FOMO effect */}
      <div
        className="pointer-events-none select-none blur-[6px] opacity-40"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Frosted glass overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-5 text-center max-w-md px-6">
          <div className="flex size-14 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
            <Lock className="size-6 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-tight">
              {featureName} requires an upgrade
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description ??
                `Your current subscription doesn't include ${featureName}. Contact your account manager to unlock this capability.`}
            </p>
          </div>

          <Button
            variant="outline"
            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
          >
            Get in Touch
          </Button>
        </div>
      </div>
    </div>
  );
}
