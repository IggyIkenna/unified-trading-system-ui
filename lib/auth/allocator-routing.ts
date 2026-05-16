/**
 * G2.10 — Audience-resolved allocator route.
 *
 * The portfolio-allocator is a commercial allocation surface, not a research
 * surface (rule 03 same-system-principle). Two distinct UI flows share the
 * same Python ``portfolio_allocator`` core via instance-configuration:
 *
 * * IM-desk audiences → ``/services/investment-management/allocator`` —
 *   careful, human-approved proposal-then-apply flow. Shows the
 *   ``<ApprovalQueue>`` of pending directives.
 * * Trading-platform-subscriber audiences →
 *   ``/services/trading-platform/allocator`` — auto-apply flow. Shows
 *   ``<AllocationApplied>`` confirmation + history.
 *
 * Audience is resolved from the G2.1 ``audience`` JWT claim. In mock mode
 * (``NEXT_PUBLIC_USE_FIREBASE_AUTH=false``) the claim is seeded from the
 * persona's ``lib/auth/audience-from-persona.ts`` mapping; in staging /
 * prod the claim comes from Firebase. Both resolve through this helper
 * so audience-routing stays environment-agnostic.
 *
 * SSOT:
 *   plans/active/refactor_g2_10_allocator_ui_split_2026_04_20.plan
 *   plans/active/refactor_g2_1_org_scoped_jwt_claims_2026_04_20.plan
 */
import type { Audience } from "@/lib/architecture-v2/availability";

/**
 * IM-side allocator route (route group ``(platform)``). IM desks + IM
 * clients land here; they see the proposal queue + apply flow.
 */
export const IM_ALLOCATOR_ROUTE = "/services/investment-management/allocator";

/**
 * Platform-side allocator route (route group ``(platform)``). DART /
 * trading-platform subscribers land here; they see the auto-apply flow.
 */
export const PLATFORM_ALLOCATOR_ROUTE = "/services/trading-platform/allocator";

/**
 * Legacy research-side allocator route — DELETED as of G2.10 Phase E.
 * Kept as a string constant so the 308 redirect in ``next.config.mjs``
 * and any telemetry emitter agree on the URL.
 */
export const LEGACY_RESEARCH_ALLOCATOR_ROUTE = "/services/research/strategy/allocator";

/**
 * Resolve the canonical allocator route for a given audience.
 *
 * * ``im_desk`` / ``im_client`` → IM-side surface (proposal-apply).
 * * ``admin`` → IM-side surface (admin supervises the approval queue).
 * * ``trading_platform_subscriber`` → platform-side surface (auto-apply).
 *
 * The conservative default for an unknown / null audience is the
 * platform-side route (tighter surface, no approval controls exposed).
 */
export function resolveAllocatorRoute(audience: Audience | null | undefined): string {
  if (audience == null) return PLATFORM_ALLOCATOR_ROUTE;
  if (audience === "im_desk" || audience === "im_client" || audience === "admin") {
    return IM_ALLOCATOR_ROUTE;
  }
  return PLATFORM_ALLOCATOR_ROUTE;
}

/**
 * Does a given route match one of the allocator surfaces? Useful for nav
 * active-state highlighting.
 */
export function isAllocatorRoute(pathname: string): boolean {
  return (
    pathname.startsWith(IM_ALLOCATOR_ROUTE) ||
    pathname.startsWith(PLATFORM_ALLOCATOR_ROUTE) ||
    pathname.startsWith(LEGACY_RESEARCH_ALLOCATOR_ROUTE)
  );
}
