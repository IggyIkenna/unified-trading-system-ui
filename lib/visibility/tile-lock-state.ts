/**
 * Service-tile lock-state enum (Refactor G1.3 — LOCKED-VISIBLE UI service-tile mode).
 *
 * Three-state closed enum for service-card padlocking:
 *   - "unlocked"         — tile is fully navigable (today's default behaviour).
 *   - "padlocked-visible" — tile renders with a lock icon + "request access"
 *                           tooltip; click is disabled.
 *   - "hidden"           — tile is not rendered at all (returns null).
 *
 * SSOTs:
 *   - codex/14-playbooks/infra-spec/stage-3e-refactor-plan.md §1.3
 *   - codex/14-playbooks/_ssot-rules/06-show-dont-show-discipline.md
 *   - codex/14-playbooks/cross-cutting/visibility-slicing.md
 *   - codex/14-playbooks/demo-ops/demo-restriction-profiles.md
 *
 * NOTE: Do NOT confuse this with the strategy-slot `LockState` in
 * `lib/architecture-v2/availability.ts`, which is a 4-value enum
 * (PUBLIC | INVESTMENT_MANAGEMENT_RESERVED | CLIENT_EXCLUSIVE | RETIRED) for
 * strategy-catalogue entries. That is a different domain (strategy availability)
 * from this one (UI service tiles).
 */

export type TileLockState = "unlocked" | "padlocked-visible" | "hidden";

export const TILE_LOCK_STATES: readonly TileLockState[] = [
  "unlocked",
  "padlocked-visible",
  "hidden",
] as const;

/** Human-readable labels for aria + tooltip copy. */
export const TILE_LOCK_STATE_LABEL: Readonly<Record<TileLockState, string>> = {
  unlocked: "Available",
  "padlocked-visible": "Locked — request access",
  hidden: "Hidden",
};

/**
 * Canonical tooltip copy shown on hover of a padlocked tile.
 *
 * Sourced verbatim from the padlock affordance row of the Decisions table in
 * `plans/active/refactor_g1_3_locked_visible_ui_service_tile_mode_2026_04_20.plan`.
 * The "<package>" placeholder is filled in by callers that know the audience's
 * entitlement package (keeps this module pure).
 */
export function padlockTooltipCopy(pkg = "full DART"): string {
  return `Available on ${pkg}; contact sales`;
}
