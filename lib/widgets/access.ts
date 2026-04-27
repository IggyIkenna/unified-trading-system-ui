/**
 * Shared widget-access predicate used by `widget-wrapper.tsx` (renders the
 * widget body or the upgrade card) and `widget-catalog-drawer.tsx` (greys out
 * locked widgets in the picker).
 *
 * Three unlock paths (any one is sufficient):
 *
 * 1. `requiredEntitlements` (OR-semantics). Any single entry passing unlocks
 *    the widget. Asset-group + family + flat-string entitlements live here.
 *    This is the legacy field and the default.
 *
 * 2. `requiredEntitlementsAll` (AND-semantics). Every entry here must pass
 *    in addition to the OR-check. Used to express "Carry & Yield (premium)
 *    AND CeFi (basic)" without inventing a new entitlement type.
 *
 * 3. `assigned_strategies` slot-label match. If the user holds a slot label
 *    whose archetype prefix is in the widget's `archetypes` tag, the widget
 *    unlocks. This is the most-precise scope mechanism — when a persona's
 *    spec is "exactly these N strategies, nothing else" (e.g. Patrick gets
 *    CARRY_BASIS_PERP@... and CARRY_STAKED_BASIS@... only).
 *
 * Permissive composition: paths 1, 2, and 3 are additive. A user passes if
 * ANY of (path 1 OR path 3) is satisfied AND path 2 (when set) holds.
 *
 * Admin and internal users pass unconditionally.
 *
 * SSOT: docs/audits/global-filters-v2.md §11.3 + persona slot labels in
 * lib/auth/personas.ts (`assigned_strategies` field).
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
  /**
   * Optional closed list of strategy slot labels routed to this user. Slot
   * label grammar: `{ARCHETYPE_ID}@{venue_scope}-...`. The check below
   * extracts the archetype prefix and matches against widget tags.
   * Persona definitions populate this for clients who paid for a closed
   * strategy list (Patrick, Desmond). Empty / undefined = no slot-level scope.
   */
  assigned_strategies?: readonly string[];
}

/** Extract the archetype prefix from a slot label (everything before the `@`). */
function archetypeFromSlot(slotLabel: string): string {
  const at = slotLabel.indexOf("@");
  return at === -1 ? slotLabel : slotLabel.slice(0, at);
}

/** Stateless: given a user shape and a widget def, returns whether the user has access. */
export function checkWidgetAccess(
  user: WidgetAccessUser | null | undefined,
  def: Pick<WidgetDefinition, "requiredEntitlements" | "requiredEntitlementsAll" | "archetypes">,
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

  // Slot-label fallback: a closed-list assignment of slot labels can unlock
  // widgets even when the user lacks the broader entitlement. Permissive —
  // path 3 (slot match) is additive to path 1 (OR-list).
  if (!orOk && def.archetypes && def.archetypes.length > 0 && user?.assigned_strategies?.length) {
    const widgetArchetypes = new Set<string>(def.archetypes);
    const slotMatch = user.assigned_strategies.some((slot) => widgetArchetypes.has(archetypeFromSlot(slot)));
    if (slotMatch) return andOk;
  }

  return orOk && andOk;
}
