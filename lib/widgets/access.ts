/**
 * Shared widget-access predicate used by `widget-wrapper.tsx` (renders the
 * widget body or the upgrade card) and `widget-catalog-drawer.tsx` (greys out
 * locked widgets in the picker).
 *
 * Two layers:
 *
 * 1. `requiredEntitlements` — OR-semantics. Any single entry passing unlocks
 *    the widget. This is the legacy field and the default.
 * 2. `requiredEntitlementsAll` — AND-semantics. Every entry here must pass
 *    in addition to the OR-check. Used to express "Carry & Yield (premium)
 *    AND CeFi (basic)" without inventing a new entitlement type.
 *
 * Admin and internal users pass unconditionally (they're never locked).
 */
import {
  checkStrategyFamilyEntitlement,
  checkTradingEntitlement,
  isStrategyFamilyEntitlement,
  isTradingEntitlement,
  type EntitlementOrWildcard,
  type StrategyFamilyEntitlement,
  type TradingEntitlement,
} from "@/lib/config/auth";
import type { WidgetDefinition, WidgetEntitlement } from "@/components/widgets/widget-registry";

export interface WidgetAccessUser {
  role: string;
  entitlements: readonly (EntitlementOrWildcard | TradingEntitlement | StrategyFamilyEntitlement)[];
}

/** Stateless: given a user shape and a widget def, returns whether the user has access. */
export function checkWidgetAccess(
  user: WidgetAccessUser | null | undefined,
  def: Pick<WidgetDefinition, "requiredEntitlements" | "requiredEntitlementsAll">,
): boolean {
  // Admin / internal pass unconditionally.
  if (user?.role === "admin" || user?.role === "internal") return true;
  const userEnts = user?.entitlements ?? [];

  const satisfies = (entry: WidgetEntitlement): boolean => {
    if (isTradingEntitlement(entry)) return checkTradingEntitlement(userEnts, entry);
    if (isStrategyFamilyEntitlement(entry)) return checkStrategyFamilyEntitlement(userEnts, entry);
    // Flat string entitlement — match against userEnts (string equality) plus
    // wildcard. Mirrors `useAuth().hasEntitlement` semantics without pulling
    // the React hook here.
    if ((userEnts as readonly unknown[]).includes("*")) return true;
    return (userEnts as readonly unknown[]).includes(entry);
  };

  const required = def.requiredEntitlements ?? [];
  const requiredAll = def.requiredEntitlementsAll ?? [];

  const orOk = required.length === 0 || required.some(satisfies);
  const andOk = requiredAll.length === 0 || requiredAll.every(satisfies);
  return orOk && andOk;
}
