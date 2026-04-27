"use client";

/**
 * EntitlementGate — wraps service page content.
 * If user has the required entitlement, renders children.
 * Otherwise, shows UpgradeCard with the FOMO lock effect.
 */

import { useAuth } from "@/hooks/use-auth";
import { UpgradeCard } from "./upgrade-card";
import {
  checkStrategyFamilyEntitlement,
  checkTradingEntitlement,
  isStrategyFamilyEntitlement,
  isTradingEntitlement,
  type Entitlement,
  type StrategyFamilyEntitlement,
  type TradingEntitlement,
} from "@/lib/config/auth";

type GateEntitlement = Entitlement | TradingEntitlement | StrategyFamilyEntitlement;

interface EntitlementGateProps {
  entitlement?: GateEntitlement;
  entitlements?: GateEntitlement[];
  /**
   * If true, holding any strategy-family entitlement (regardless of which
   * family) is enough to satisfy the gate. Use on routes that have inner
   * family-aware widget gates — the route gate just keeps non-trading users
   * out, and the widget layer does the family-specific filtering.
   */
  acceptAnyFamilyEntitlement?: boolean;
  serviceName: string;
  description?: string;
  children: React.ReactNode;
}

const ENTITLEMENT_HIERARCHY: Record<string, string[]> = {
  "data-basic": ["data-basic", "data-pro"],
  "execution-basic": ["execution-basic", "execution-full"],
};

export function hasAnyEntitlement(
  required: GateEntitlement[],
  checker: (e: Entitlement) => boolean,
  userEnts: readonly (string | TradingEntitlement | StrategyFamilyEntitlement)[] = [],
): boolean {
  return required.some((e) => {
    if (isTradingEntitlement(e)) return checkTradingEntitlement(userEnts as never, e);
    if (isStrategyFamilyEntitlement(e)) return checkStrategyFamilyEntitlement(userEnts as never, e);
    const acceptable = ENTITLEMENT_HIERARCHY[e] ?? [e];
    return acceptable.some((a) => checker(a as Entitlement));
  });
}

function userHoldsAnyFamilyEntitlement(
  userEnts: readonly (string | TradingEntitlement | StrategyFamilyEntitlement)[],
): boolean {
  if ((userEnts as readonly unknown[]).includes("*")) return true;
  return userEnts.some((e) => isStrategyFamilyEntitlement(e));
}

export function EntitlementGate({
  entitlement,
  entitlements,
  acceptAnyFamilyEntitlement,
  serviceName,
  description,
  children,
}: EntitlementGateProps) {
  const { hasEntitlement, isAdmin, isInternal, user } = useAuth();

  if (isAdmin() || isInternal()) return <>{children}</>;

  const requiredList = entitlements ?? (entitlement ? [entitlement] : []);
  if (requiredList.length === 0) return <>{children}</>;

  const userEnts = user?.entitlements ?? [];
  if (hasAnyEntitlement(requiredList, hasEntitlement, userEnts)) return <>{children}</>;

  if (acceptAnyFamilyEntitlement && userHoldsAnyFamilyEntitlement(userEnts)) {
    return <>{children}</>;
  }

  return (
    <div className="p-8">
      <UpgradeCard
        serviceName={serviceName}
        description={
          description ??
          `Your current subscription doesn't include access to ${serviceName}. Contact us to upgrade and unlock this capability.`
        }
      />
    </div>
  );
}
