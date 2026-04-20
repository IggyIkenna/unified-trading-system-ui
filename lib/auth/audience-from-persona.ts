/**
 * Persona → Audience mapping for strategy-catalogue visibility filtering.
 *
 * Bridges `AuthUser` (from lib/auth/types.ts) to the `Audience` enum in
 * `lib/architecture-v2/availability.ts` which drives `slotsVisibleTo()` and
 * `validateAllocationAuthorised()` filters.
 *
 * SSOT for mapping rules:
 *   unified-trading-pm/codex/14-playbooks/implementation-mapping/persona-and-user-prototype-mapping.md
 *   unified-trading-pm/codex/14-playbooks/shared-core/strategy-allocation-lock-matrix.md
 *
 * Rule 03 (same-system principle) — persona doesn't change which code runs; it
 * changes which slice of catalogue data the audience can see. This file owns
 * that mapping.
 *
 * Rule 06 (show / don't-show discipline) — DART prospects never see
 * INVESTMENT_MANAGEMENT_RESERVED cells; this mapping sends them to the
 * `trading_platform_subscriber` audience whose `slotsVisibleTo` filter hides
 * those cells.
 */

import type { Audience } from "@/lib/architecture-v2/availability";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Audience for an authenticated user. Returns `"trading_platform_subscriber"`
 * as a conservative default for unknown personas (stricter visibility; safer).
 *
 * - admin / internal-trader → `admin` (full visibility)
 * - IM-desk internal use (future staffing) → `im_desk` (all except pre-CODE_AUDITED)
 * - prospect-im / investor / advisor (IM-allocator audience) → `im_client`
 * - prospect-platform / elysium-defi / client-full / client-data-only /
 *   client-premium / prospect-regulatory → `trading_platform_subscriber`
 */
export function audienceForUser(user: AuthUser | null | undefined): Audience {
  if (user == null) return "trading_platform_subscriber";

  if (user.role === "admin") return "admin";
  if (user.role === "internal") {
    // Odum internal trader — not admin, but has full catalogue visibility for
    // operational purposes. Map to admin for catalogue reads; mutation paths
    // elsewhere enforce admin-only writes.
    return "admin";
  }

  // IM allocator personas — they evaluate / receive allocation into Odum-run
  // strategies. They should see PUBLIC + their own CLIENT_EXCLUSIVE via
  // im_client (IM_RESERVED visibility handled by a separate entitlement-level
  // filter on the Investment Management demo, not this audience filter).
  if (user.id === "prospect-im" || user.id === "investor" || user.id === "advisor") {
    return "im_client";
  }

  // All other client personas are platform subscribers (DART / Reg Umbrella /
  // elysium-defi / client-* etc). IM_RESERVED + RETIRED + pre-BACKTESTED hidden
  // unless the cell is PUBLIC or their CLIENT_EXCLUSIVE.
  return "trading_platform_subscriber";
}

/**
 * Compact helper for when only the persona id is available (not the full
 * AuthUser). Returns the same mapping.
 */
export function audienceForPersonaId(
  personaId: string | null | undefined,
  role?: "admin" | "internal" | "client",
): Audience {
  if (personaId == null) return "trading_platform_subscriber";

  if (role === "admin") return "admin";
  if (role === "internal") return "admin";

  if (personaId === "admin" || personaId === "internal-trader") return "admin";
  if (personaId === "prospect-im" || personaId === "investor" || personaId === "advisor") {
    return "im_client";
  }
  return "trading_platform_subscriber";
}
