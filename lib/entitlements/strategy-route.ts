/**
 * Per-strategy access resolver.
 *
 * Computes whether a given user has terminal access, reports-only access,
 * locked-but-visible (greyed with upgrade CTA), or hidden access for a
 * given strategy slot or archetype.
 *
 * Decision sources (priority order):
 *   1. Explicit `assigned_strategies` on the user/persona (catalogue slot
 *      labels routed to this org). When present, that's the authoritative list.
 *   2. Entitlement-based fallback — `strategy-full` + `execution-full` →
 *      terminal; `reporting` only → reports-only; nothing → locked-visible.
 *   3. Archetype-level capability (e.g. ML_DIRECTIONAL requires `ml-full`).
 *
 * Phase 9's AdminStrategyAssignment model (UAC-side) is the long-term truth;
 * this resolver is the UI-side projection layer.
 */

import type { AuthUser } from "@/lib/auth/types";

export type StrategyAccess =
  | "terminal"
  | "reports-only"
  | "locked-visible"
  | "hidden";

interface UserWithAssignedStrategies extends AuthUser {
  assigned_strategies?: readonly string[];
}

const FULL_TIER_ENTITLEMENTS = new Set([
  "strategy-full",
  "execution-full",
  "ml-full",
]);

const REPORTING_ENTITLEMENTS = new Set(["reporting", "investor-platform"]);

const ML_REQUIRED_ARCHETYPE_PREFIXES = [
  "ML_DIRECTIONAL",
  "MARKET_MAKING_ML_LEAN",
  "VOL_ML_LEAN",
];

const TERMINAL_BLOCKED_ARCHETYPES = new Set<string>([
  // MEV strategies — restricted to whitelisted clients only
  "ARBITRAGE_MEV_SANDWICH",
]);

function userEntitlements(user: AuthUser): Set<string> {
  return new Set(user.entitlements.map(String));
}

function hasFullTierAccess(ents: Set<string>): boolean {
  return ents.has("strategy-full") && ents.has("execution-full");
}

function hasReportingAccess(ents: Set<string>): boolean {
  for (const r of REPORTING_ENTITLEMENTS) {
    if (ents.has(r)) return true;
  }
  return false;
}

function archetypeNeedsML(archetypeId: string): boolean {
  return ML_REQUIRED_ARCHETYPE_PREFIXES.some((p) => archetypeId.startsWith(p));
}

/**
 * Resolve access for a specific strategy slot (slotKey from
 * strategy_instruments.json — e.g.
 * `CARRY_BASIS_PERP@cefi-perp-binance`).
 */
export function resolveSlotAccess(
  user: AuthUser | null,
  slotKey: string,
): StrategyAccess {
  if (!user) return "hidden";
  const ents = userEntitlements(user);
  const u = user as UserWithAssignedStrategies;

  // 1. Explicit assignment wins
  if (u.assigned_strategies && u.assigned_strategies.length > 0) {
    if (u.assigned_strategies.includes(slotKey)) {
      return hasFullTierAccess(ents) ? "terminal" : "reports-only";
    }
    // Assigned set is closed — anything not in it is locked-visible
    return "locked-visible";
  }

  // 2. Entitlement-based fallback
  const archetypeId = slotKey.split("@")[0];
  if (TERMINAL_BLOCKED_ARCHETYPES.has(archetypeId)) {
    return hasReportingAccess(ents) ? "reports-only" : "locked-visible";
  }
  if (archetypeNeedsML(archetypeId) && !ents.has("ml-full")) {
    return hasReportingAccess(ents) ? "reports-only" : "locked-visible";
  }
  if (hasFullTierAccess(ents)) return "terminal";
  if (hasReportingAccess(ents)) return "reports-only";
  return "locked-visible";
}

/**
 * Coarser variant — at the archetype level rather than the instance level.
 * Used by the catalogue accordion to render archetype-level lock badges.
 */
export function resolveArchetypeAccess(
  user: AuthUser | null,
  archetypeId: string,
): StrategyAccess {
  if (!user) return "hidden";
  const ents = userEntitlements(user);
  const u = user as UserWithAssignedStrategies;

  if (u.assigned_strategies && u.assigned_strategies.length > 0) {
    const anyAssigned = u.assigned_strategies.some((s) =>
      s.startsWith(`${archetypeId}@`),
    );
    if (anyAssigned) {
      return hasFullTierAccess(ents) ? "terminal" : "reports-only";
    }
    return "locked-visible";
  }

  if (TERMINAL_BLOCKED_ARCHETYPES.has(archetypeId)) {
    return hasReportingAccess(ents) ? "reports-only" : "locked-visible";
  }
  if (archetypeNeedsML(archetypeId) && !ents.has("ml-full")) {
    return hasReportingAccess(ents) ? "reports-only" : "locked-visible";
  }
  if (hasFullTierAccess(ents)) return "terminal";
  if (hasReportingAccess(ents)) return "reports-only";
  return "locked-visible";
}

export const ACCESS_LABELS: Record<StrategyAccess, string> = {
  terminal: "Available — terminal & reports",
  "reports-only": "Reports only — upgrade for terminal",
  "locked-visible": "Locked — upgrade to access",
  hidden: "Not available",
};

export const ACCESS_BADGE_VARIANTS: Record<StrategyAccess, string> = {
  terminal: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  "reports-only": "bg-amber-500/10 text-amber-600 border-amber-500/30",
  "locked-visible": "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
  hidden: "bg-red-500/10 text-red-600 border-red-500/30",
};

/**
 * Helper: should a user be able to enter the terminal for this strategy?
 * Used by terminal order-entry to gate the action button.
 */
export function canEnterTerminal(
  user: AuthUser | null,
  slotKey: string,
): boolean {
  return resolveSlotAccess(user, slotKey) === "terminal";
}

/**
 * Helper: should a user see the strategy at all (in any surface)?
 * `hidden` returns false; everything else (including locked-visible) is true.
 */
export function isVisible(user: AuthUser | null, slotKey: string): boolean {
  return resolveSlotAccess(user, slotKey) !== "hidden";
}
