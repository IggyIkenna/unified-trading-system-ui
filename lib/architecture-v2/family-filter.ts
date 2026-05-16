/**
 * Family / archetype filter predicate used by trading surfaces
 * (orders / positions / P&L) to narrow a generic strategy dimension via
 * `FamilyArchetypePicker` selection persisted in `useWorkspaceScope`.
 *
 * Matching strategy (tolerant of heterogeneous seed/mock/real-API data):
 *   1. If both `family` and `archetype` are undefined → always match.
 *   2. If `archetype` is set, match when the record's `strategy_id` starts
 *      with the archetype token (signals-dashboard convention:
 *      `<ARCHETYPE>@<slot>`), OR the record's `strategy_family` equals the
 *      archetype's family (fallback when only family metadata is populated).
 *   3. If only `family` is set, match when `strategy_family` equals the
 *      family string (case-insensitive, label or enum key), OR the
 *      record's `strategy_id` starts with any archetype token belonging
 *      to the family.
 *
 * The predicate is deliberately forgiving for un-populated mock rows —
 * if a row has neither `strategy_family` nor a recognisable `strategy_id`
 * prefix, the filter falls back to "keep" so operators don't stare at
 * empty tables during early seed-coverage work. Hard filtering should
 * kick in when real strategy-service wiring lands.
 *
 * For full WorkspaceScope filtering (asset_group / instrument_type /
 * share_class / venue / strategy_id), see {@link matchesScope} in
 * ./workspace-scope.ts. This file's predicate covers the narrow
 * family/archetype axis used by legacy trading surfaces.
 *
 * Plan SSOT: dart_ux_cockpit_refactor_2026_04_29.md §17 Phase 1.
 */
import type { StrategyArchetype, StrategyFamily } from "./enums";
import { ARCHETYPE_TO_FAMILY } from "./enums";
import { FAMILY_METADATA } from "./families";

// Re-export the canonical scope predicate so callers that only need the
// generalised matcher can import it from this file (avoids deep imports
// chasing).
export { matchesScope, matchesScopeStrict } from "./workspace-scope";
export type { ScopeMatchableRow } from "./workspace-scope";

export interface FamilyFilterRow {
  readonly strategy_id?: string;
  readonly strategy_family?: string;
}

function normalise(value: string | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

function familyMatchesLabelOrKey(rowFamily: string | undefined, family: StrategyFamily): boolean {
  if (rowFamily === undefined || rowFamily === "") return false;
  const up = normalise(rowFamily);
  if (up === family) return true; // enum key ("CARRY_AND_YIELD")
  const meta = FAMILY_METADATA[family];
  if (meta && normalise(meta.label) === up) return true; // human label
  if (meta && normalise(meta.slug) === normalise(rowFamily)) return true; // slug
  return false;
}

function archetypeFromSlotLabel(slotOrId: string | undefined): string | undefined {
  if (!slotOrId) return undefined;
  // Signals-dashboard convention: "<ARCHETYPE>@<venue_etc>".
  const token = slotOrId.split("@")[0];
  return token && token.length > 0 ? token : undefined;
}

/**
 * Predicate factory. Returns `() => true` when no filter is active.
 *
 * `strict` flag (default false) makes rows without identifying info
 * (`strategy_id` + `strategy_family` both missing) fail the filter
 * when any axis is active. Leave as `false` for mock-heavy surfaces.
 */
export function makeFamilyFilterPredicate(args: {
  readonly family: StrategyFamily | undefined;
  readonly archetype: StrategyArchetype | undefined;
  readonly strict?: boolean;
}): (row: FamilyFilterRow) => boolean {
  const { family, archetype, strict = false } = args;
  if (!family && !archetype) return () => true;

  return (row: FamilyFilterRow) => {
    const rowArchetype = archetypeFromSlotLabel(row.strategy_id);

    // Archetype axis (narrower) — check first.
    if (archetype) {
      if (rowArchetype && rowArchetype === archetype) return true;
      // Fallback: only family is known on the row → accept if it matches
      // the archetype's parent family (keeps mock rows visible).
      const parentFamily = ARCHETYPE_TO_FAMILY[archetype];
      if (familyMatchesLabelOrKey(row.strategy_family, parentFamily)) return true;
      if (rowArchetype !== undefined || row.strategy_family !== undefined) {
        // Row is identifiable and does not match → drop.
        return false;
      }
      // Row has no identifying info.
      return !strict;
    }

    // Family axis only.
    if (family) {
      if (familyMatchesLabelOrKey(row.strategy_family, family)) return true;
      if (rowArchetype !== undefined) {
        const archetypeKey = rowArchetype as StrategyArchetype;
        if (ARCHETYPE_TO_FAMILY[archetypeKey] === family) return true;
        return false;
      }
      if (row.strategy_family !== undefined) return false;
      return !strict;
    }

    return true;
  };
}
