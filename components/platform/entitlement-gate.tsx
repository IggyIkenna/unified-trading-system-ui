"use client";

/**
 * EntitlementGate — wraps service page content.
 * If user has the required entitlement, renders children.
 * Otherwise, shows UpgradeCard with the FOMO lock effect.
 */

import { useAuth } from "@/hooks/use-auth";
import { UpgradeCard } from "./upgrade-card";
import {
  isTradingEntitlement,
  checkTradingEntitlement,
  type Entitlement,
  type TradingEntitlement,
} from "@/lib/config/auth";

interface EntitlementGateProps {
  entitlement?: Entitlement | TradingEntitlement;
  entitlements?: (string | TradingEntitlement)[];
  serviceName: string;
  description?: string;
  children: React.ReactNode;
}

const ENTITLEMENT_HIERARCHY: Record<string, string[]> = {
  "data-basic": ["data-basic", "data-pro"],
  "execution-basic": ["execution-basic", "execution-full"],
};

export function hasAnyEntitlement(
  required: (string | TradingEntitlement)[],
  checker: (e: Entitlement) => boolean,
  userEnts: readonly (string | TradingEntitlement)[] = [],
): boolean {
  return required.some((e) => {
    if (isTradingEntitlement(e)) return checkTradingEntitlement(userEnts as never, e);
    const acceptable = ENTITLEMENT_HIERARCHY[e] ?? [e];
    return acceptable.some((a) => checker(a as Entitlement));
  });
}

export function EntitlementGate({
  entitlement,
  entitlements,
  serviceName,
  description,
  children,
}: EntitlementGateProps) {
  const { hasEntitlement, isAdmin, isInternal, user } = useAuth();

  if (isAdmin() || isInternal()) return <>{children}</>;

  const requiredList = entitlements ?? (entitlement ? [entitlement] : []);
  if (requiredList.length === 0) return <>{children}</>;

  if (hasAnyEntitlement(requiredList, hasEntitlement, user?.entitlements ?? [])) return <>{children}</>;

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
