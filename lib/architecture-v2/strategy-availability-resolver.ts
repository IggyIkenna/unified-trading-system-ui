/**
 * StrategyAvailabilityResolver — the bridge between scope and visibility.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.md §4.5:
 *
 *   Scope decides relevance.
 *   This resolver decides visibility.
 *   Preset strategy-backing decides honesty.
 *   Mock/data badges decide trust.
 *
 * Returns a full StrategyVisibilityDecision (visibility + reason + cta +
 * coverageQualifier) so downstream consumers (locked previews, empty states,
 * catalogue cards, FOMO surfaces) can tailor copy. **Never** return a bare
 * visibility state — copy gets generic and demos lose specificity.
 *
 * Persona-rule defaults applied in this order; first match wins:
 *   1. admin / internal-trader / im-desk-operator → all states
 *   2. DART-Full client → owned + available_to_request + locked subsets
 *   3. Signals-In client → routed-only + tier-locked for Full surfaces
 *   4. IM client / advisor → SMA owned + IM-reserved read-only + DART-op hidden
 *   5. Regulatory client → reports + signals only; allocation hidden
 *   6. Prospect → PUBLIC FOMO-safe subset only
 */

import type { ShareClass } from "./enums";
import type { ProductRouting, StrategyMaturityPhase } from "./lifecycle";
import type { AvailabilityState, CoverageStatus, WorkspaceSurface } from "./workspace-scope";

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────────────────────

export type StrategyVisibilityState =
  | "owned" // user is subscribed / allocated; show Reality
  | "available_to_request" // visible in Catalogue Explore tab; CTA = request access
  | "locked_by_tier" // user lacks the tier entitlement
  | "locked_by_workflow" // workflow gate unmet (KYC / questionnaire / mandate review)
  | "hidden" // pre-maturity, retired, or product-routing fails — never surfaced
  | "admin_only" // internal QA / lifecycle editor only
  | "read_only"; // IM desk seeing client-exclusive (read but not allocate)

export type StrategyVisibilityReason =
  | "owned_subscription"
  | "public_requestable"
  | "missing_tier"
  | "missing_questionnaire"
  | "missing_kyc"
  | "missing_mandate_review"
  | "pre_maturity"
  | "wrong_product_routing"
  | "retired"
  | "admin_only"
  | "client_exclusive_read_only"
  | "im_reserved"
  | "coverage_blocked";

export type StrategyVisibilityCta =
  | "request_access"
  | "request_allocation"
  | "complete_questionnaire"
  | "complete_kyc"
  | "upgrade_to_dart_full"
  | "contact_im_desk"
  | "none";

export interface StrategyVisibilityDecision {
  readonly visibility: StrategyVisibilityState;
  readonly reason: StrategyVisibilityReason;
  readonly cta: StrategyVisibilityCta;
  readonly coverageQualifier?: "supported" | "partial" | "blocked";
}

export type ResolverRole = "admin" | "internal" | "client";

export interface StrategyAvailabilityContext {
  readonly persona: string;
  readonly role: ResolverRole;
  readonly entitlements: readonly string[];
  readonly orgId?: string;
  readonly clientId?: string;
  readonly subscriptions: readonly string[]; // strategy_ids the user owns
  readonly productRouting: ProductRouting;
  readonly maturityPhase: StrategyMaturityPhase;
  readonly coverageStatus: CoverageStatus;
  readonly availabilityState: AvailabilityState;
  readonly shareClass: ShareClass | null;
  readonly venueSetVariant: string;
}

/**
 * Persona class — derived from role + entitlements. Used by the resolver to
 * pick which rule branch to apply.
 */
export type ResolverPersonaClass =
  | "admin"
  | "internal-trader"
  | "im-desk-operator"
  | "dart-full"
  | "signals-in"
  | "im-client"
  | "regulatory"
  | "prospect";

// ─────────────────────────────────────────────────────────────────────────────
// Persona classification
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ENTITLEMENTS = new Set(["admin", "*", "internal:*"]);
const INTERNAL_TRADER_ENTITLEMENTS = new Set(["internal-trader", "trader-full"]);
const IM_DESK_ENTITLEMENTS = new Set(["im-desk-operator", "im-desk", "im-allocator"]);

function hasAny(entitlements: readonly string[], required: ReadonlySet<string>): boolean {
  for (const e of entitlements) {
    if (required.has(e)) return true;
  }
  return false;
}

function hasAll(entitlements: readonly string[], required: readonly string[]): boolean {
  const set = new Set(entitlements);
  return required.every((r) => set.has(r));
}

export function classifyPersona(ctx: Pick<StrategyAvailabilityContext, "role" | "entitlements">): ResolverPersonaClass {
  if (ctx.role === "admin" || hasAny(ctx.entitlements, ADMIN_ENTITLEMENTS)) {
    return "admin";
  }
  if (ctx.role === "internal") {
    if (hasAny(ctx.entitlements, IM_DESK_ENTITLEMENTS)) return "im-desk-operator";
    if (hasAny(ctx.entitlements, INTERNAL_TRADER_ENTITLEMENTS)) {
      return "internal-trader";
    }
    return "internal-trader";
  }
  // role === "client"
  if (hasAll(ctx.entitlements, ["strategy-full", "ml-full"])) {
    return "dart-full";
  }
  if (ctx.entitlements.includes("signals-in") || ctx.entitlements.includes("signals-receive")) {
    return "signals-in";
  }
  if (
    ctx.entitlements.includes("im-client") ||
    ctx.entitlements.includes("im-advisor") ||
    ctx.entitlements.includes("investor-board")
  ) {
    return "im-client";
  }
  if (ctx.entitlements.includes("regulatory") || ctx.entitlements.includes("compliance-only")) {
    return "regulatory";
  }
  return "prospect";
}

// ─────────────────────────────────────────────────────────────────────────────
// Coverage qualifier resolution
// ─────────────────────────────────────────────────────────────────────────────

function coverageQualifier(status: CoverageStatus): "supported" | "partial" | "blocked" {
  return status === "SUPPORTED" ? "supported" : status === "PARTIAL" ? "partial" : "blocked";
}

// ─────────────────────────────────────────────────────────────────────────────
// Maturity gate (determines if a strategy is mature enough to surface)
// ─────────────────────────────────────────────────────────────────────────────

const PRE_MATURITY_PHASES: ReadonlySet<StrategyMaturityPhase> = new Set([
  "smoke",
  "backtest_30d",
  "paper_1d",
] as readonly StrategyMaturityPhase[]);

const RETIRED_PHASES: ReadonlySet<StrategyMaturityPhase> = new Set(["retired"] as readonly StrategyMaturityPhase[]);

function isPreMaturity(phase: StrategyMaturityPhase): boolean {
  return PRE_MATURITY_PHASES.has(phase);
}

function isRetired(phase: StrategyMaturityPhase): boolean {
  return RETIRED_PHASES.has(phase) || phase === "retired";
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy instance shape (resolver input)
// ─────────────────────────────────────────────────────────────────────────────

export interface StrategyInstanceForResolver {
  readonly id: string;
  readonly maturityPhase: StrategyMaturityPhase;
  readonly coverageStatus: CoverageStatus;
  readonly productRouting: ProductRouting;
  readonly availabilityState: AvailabilityState;
  readonly shareClass: ShareClass | null;
}

export interface AuthUserForResolver {
  readonly role: ResolverRole;
  readonly entitlements: readonly string[];
  readonly subscriptions: readonly string[];
  readonly orgId?: string;
  readonly clientId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Decision helpers
// ─────────────────────────────────────────────────────────────────────────────

function ownedDecision(qualifier: "supported" | "partial" | "blocked"): StrategyVisibilityDecision {
  return {
    visibility: "owned",
    reason: "owned_subscription",
    cta: "none",
    coverageQualifier: qualifier,
  };
}

function hiddenDecision(reason: StrategyVisibilityReason): StrategyVisibilityDecision {
  return { visibility: "hidden", reason, cta: "none" };
}

function lockedByTierDecision(qualifier: "supported" | "partial" | "blocked"): StrategyVisibilityDecision {
  return {
    visibility: "locked_by_tier",
    reason: "missing_tier",
    cta: "upgrade_to_dart_full",
    coverageQualifier: qualifier,
  };
}

function availableDecision(
  qualifier: "supported" | "partial" | "blocked",
  cta: StrategyVisibilityCta = "request_access",
): StrategyVisibilityDecision {
  return {
    visibility: "available_to_request",
    reason: "public_requestable",
    cta,
    coverageQualifier: qualifier,
  };
}

function readOnlyDecision(
  reason: Extract<StrategyVisibilityReason, "client_exclusive_read_only" | "im_reserved">,
  qualifier: "supported" | "partial" | "blocked",
): StrategyVisibilityDecision {
  return {
    visibility: "read_only",
    reason,
    cta: "none",
    coverageQualifier: qualifier,
  };
}

function adminOnlyDecision(): StrategyVisibilityDecision {
  return {
    visibility: "admin_only",
    reason: "admin_only",
    cta: "none",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main resolver entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the visibility decision for a single strategy instance, given a user
 * and the active scope + surface. The resolver is pure; it does not consult
 * scope filters (that's the caller's job) — it answers "given this user, can
 * they see this strategy at all, and how?"
 *
 * Surface-aware: catalogue surfaces apply stricter rules (pre-maturity = hidden;
 * product-routing failures = hidden) than cockpit surfaces (where workflow FOMO
 * is more permissive).
 */
export function resolveStrategyVisibility(
  instance: StrategyInstanceForResolver,
  user: AuthUserForResolver,
  surface: WorkspaceSurface,
): StrategyVisibilityDecision {
  const personaClass = classifyPersona(user);
  const qualifier = coverageQualifier(instance.coverageStatus);

  // Coverage-blocked is hidden for client-tier; visible only to admin / internal.
  if (instance.coverageStatus === "BLOCKED" && user.role === "client") {
    return hiddenDecision("coverage_blocked");
  }

  // Admin / internal-trader: see everything as owned (or admin-only flagged).
  if (personaClass === "admin" || personaClass === "internal-trader") {
    if (instance.availabilityState === "RETIRED") {
      return adminOnlyDecision();
    }
    return ownedDecision(qualifier);
  }

  // IM-desk-operator: client-exclusive shows as read-only; IM-reserved shows
  // as read-only; everything else as owned.
  if (personaClass === "im-desk-operator") {
    if (instance.availabilityState === "CLIENT_EXCLUSIVE") {
      return readOnlyDecision("client_exclusive_read_only", qualifier);
    }
    if (instance.availabilityState === "INVESTMENT_MANAGEMENT_RESERVED") {
      return readOnlyDecision("im_reserved", qualifier);
    }
    if (instance.availabilityState === "RETIRED") {
      return adminOnlyDecision();
    }
    return ownedDecision(qualifier);
  }

  // From here: client-tier rules. Pre-maturity is hidden; retired is hidden.
  if (isPreMaturity(instance.maturityPhase)) {
    return hiddenDecision("pre_maturity");
  }
  if (isRetired(instance.maturityPhase)) {
    return hiddenDecision("retired");
  }
  if (instance.availabilityState === "RETIRED") {
    return hiddenDecision("retired");
  }

  // Owned check — works for any client-tier persona who's subscribed.
  const isOwned = user.subscriptions.includes(instance.id);
  if (isOwned) {
    return ownedDecision(qualifier);
  }

  // Surface-specific rules (catalogue vs cockpit):
  // - Catalogue Reality tab shows ONLY owned; Catalogue Explore shows
  //   available_to_request.
  // - Cockpit (terminal/research) shows owned + available_to_request +
  //   contextual locked previews.
  // The resolver returns the visibility state; the SURFACE caller decides
  // whether to render Reality vs Explore vs FOMO based on that state.

  // Persona-specific gating from here:

  if (personaClass === "regulatory") {
    // Regulatory clients see reports + signals only — no allocation surface.
    if (surface === "reports" || surface === "signals") {
      return availableDecision(qualifier, "request_access");
    }
    return hiddenDecision("wrong_product_routing");
  }

  if (personaClass === "im-client") {
    // IM clients see their SMA / mandate-allocated strategies as owned, plus
    // IM-reserved (in their mandate) as read-only. DART-operational hidden.
    if (instance.availabilityState === "INVESTMENT_MANAGEMENT_RESERVED") {
      return readOnlyDecision("im_reserved", qualifier);
    }
    if (instance.productRouting === "im_only" || instance.productRouting === "both") {
      return availableDecision(qualifier, "request_allocation");
    }
    return hiddenDecision("wrong_product_routing");
  }

  if (personaClass === "signals-in") {
    // Signals-In clients see Signals-In-routed strategies as available;
    // Full-only (DART research / ml) as locked_by_tier.
    if (instance.productRouting === "internal_only" || instance.productRouting === "im_only") {
      return hiddenDecision("wrong_product_routing");
    }
    if (surface === "research" || surface === "terminal" || surface === "dashboard") {
      // For research/terminal, Signals-In gates much of the cockpit
      return lockedByTierDecision(qualifier);
    }
    return availableDecision(qualifier, "request_access");
  }

  if (personaClass === "dart-full") {
    // DART-Full clients see PUBLIC strategies routed for DART as available.
    if (instance.productRouting === "internal_only" || instance.productRouting === "im_only") {
      return hiddenDecision("wrong_product_routing");
    }
    if (instance.availabilityState === "PUBLIC") {
      return availableDecision(qualifier, "request_access");
    }
    if (instance.availabilityState === "CLIENT_EXCLUSIVE") {
      return hiddenDecision("wrong_product_routing");
    }
    if (instance.availabilityState === "INVESTMENT_MANAGEMENT_RESERVED") {
      return hiddenDecision("wrong_product_routing");
    }
    return availableDecision(qualifier, "request_access");
  }

  // Prospect — only PUBLIC FOMO-safe subset surfaces, and only as available.
  if (
    instance.availabilityState === "PUBLIC" &&
    instance.productRouting !== "internal_only" &&
    instance.productRouting !== "im_only"
  ) {
    return availableDecision(qualifier, "request_access");
  }
  return hiddenDecision("wrong_product_routing");
}

/**
 * Resolve visibility decisions for a list of strategy instances. Returns the
 * full mapping; callers can filter by visibility state to render Reality /
 * Explore / FOMO buckets per surface.
 */
export function resolveVisibleStrategyInstances<T extends StrategyInstanceForResolver>(
  instances: readonly T[],
  user: AuthUserForResolver,
  surface: WorkspaceSurface,
): readonly { instance: T; decision: StrategyVisibilityDecision }[] {
  return instances.map((instance) => ({
    instance,
    decision: resolveStrategyVisibility(instance, user, surface),
  }));
}

/**
 * Convenience filter — return only the instances visible (in any non-hidden
 * state) to the user on the given surface.
 */
export function filterVisibleStrategyInstances<T extends StrategyInstanceForResolver>(
  instances: readonly T[],
  user: AuthUserForResolver,
  surface: WorkspaceSurface,
): readonly { instance: T; decision: StrategyVisibilityDecision }[] {
  return resolveVisibleStrategyInstances(instances, user, surface).filter(
    ({ decision }) => decision.visibility !== "hidden",
  );
}
