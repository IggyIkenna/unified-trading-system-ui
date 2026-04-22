/**
 * Visibility-slicing matrix generator (G3.6).
 *
 * Thin parameterisation layer on top of `visibility-slicing-expected.ts`. Keeps
 * the spec file lean by pre-grouping the matrix into the shapes Playwright
 * `test.describe` / `for` loops consume.
 *
 * The matrix shapes:
 *   - `MATRIX_CELLS`        — full 7×3×~25 cell grid (≥525 entries)
 *   - `PHASE_CELLS`         — phase-sensitive routes × 3 phases
 *   - `DASHBOARD_CASES`     — per-persona × per-flavour (21 entries) for the
 *                             dashboard tile-state sweep (one page-load per
 *                             entry, each entry asserts the per-tile state for
 *                             every covered tile)
 *   - `LOCKED_VISIBLE_CELLS` — filtered subset of MATRIX_CELLS that expect
 *                             `padlocked-visible` — used for modal/tooltip copy
 *                             assertions
 *
 * The grouping avoids O(N^3) page reloads: the Playwright spec loads
 * `/dashboard` once per (persona, flavour) and asserts every tile in that
 * single DOM snapshot.
 */

import {
  buildMatrix,
  buildPhaseMatrix,
  computeCell,
  FLAVOUR_COLUMNS,
  MATRIX_SIZE,
  PERSONA_ROWS,
  PHASE_MATRIX_SIZE,
  ROUTE_ROWS,
  type ExpectedCell,
  type PersonaRow,
  type PhaseCell,
  type TileRouteRow,
} from "./visibility-slicing-expected";
import type { DemoFlavour } from "../../../lib/architecture-v2/restriction-profiles";

export { buildMatrix, buildPhaseMatrix, computeCell };
export { FLAVOUR_COLUMNS, PERSONA_ROWS, ROUTE_ROWS, MATRIX_SIZE, PHASE_MATRIX_SIZE };
export type { ExpectedCell, PersonaRow, PhaseCell, TileRouteRow };

/** Full cross-product — 7 × 3 × 25+ cells. */
export const MATRIX_CELLS: readonly ExpectedCell[] = buildMatrix();

/** Phase-sensitive sub-matrix — routes × {research, paper, live}. */
export const PHASE_CELLS: readonly PhaseCell[] = buildPhaseMatrix();

/** Per-persona × per-flavour dashboard cases. Used for the dashboard tile-state
 * sweep — one page-load per case, assertions cover every route's tileId. */
export interface DashboardCase {
  readonly persona: PersonaRow;
  readonly flavour: DemoFlavour | undefined;
  /** Short, unique label for test.describe titles. */
  readonly label: string;
}

export const DASHBOARD_CASES: readonly DashboardCase[] = (() => {
  const cases: DashboardCase[] = [];
  for (const persona of PERSONA_ROWS) {
    for (const flavour of FLAVOUR_COLUMNS) {
      cases.push({
        persona,
        flavour,
        label: `${persona.seedId}/${flavour ?? "base"}`,
      });
    }
  }
  return cases;
})();

/** Cells where tileState === "padlocked-visible" — drive the modal/tooltip
 * copy assertions. De-duplicated by (profileId, flavour, tileId) so we only
 * click each distinct padlocked tile once. */
export interface LockedVisibleCell {
  readonly persona: PersonaRow;
  readonly flavour: DemoFlavour | undefined;
  readonly tileId: ExpectedCell["route"]["tileId"];
  readonly sampleRoute: string;
}

export const LOCKED_VISIBLE_CELLS: readonly LockedVisibleCell[] = (() => {
  const seen = new Set<string>();
  const acc: LockedVisibleCell[] = [];
  for (const cell of MATRIX_CELLS) {
    if (cell.tileState !== "padlocked-visible") continue;
    const key = `${cell.persona.profileId}|${cell.flavour ?? "base"}|${cell.route.tileId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    acc.push({
      persona: cell.persona,
      flavour: cell.flavour,
      tileId: cell.route.tileId,
      sampleRoute: cell.route.route,
    });
  }
  return acc;
})();

/**
 * Orphan-reachability set: every cell whose tileState is `"unlocked"` MUST
 * have a reachable route. The spec navigates to each unique route once (per
 * persona) rather than N×flavour times, since `phaseForPath` doesn't change
 * reachability semantics.
 */
export interface OrphanReachabilityCase {
  readonly persona: PersonaRow;
  readonly route: TileRouteRow;
}

export const ORPHAN_REACHABILITY_CASES: readonly OrphanReachabilityCase[] = (() => {
  const acc: OrphanReachabilityCase[] = [];
  for (const persona of PERSONA_ROWS) {
    for (const route of ROUTE_ROWS) {
      // Evaluate at base flavour — reachability is a router-level concern and
      // ignores flavour overrides. If the persona can see the tile at base OR
      // any flavour, we consider the route in-scope for reachability.
      const anyUnlocked = FLAVOUR_COLUMNS.some(
        (f) => computeCell(persona, f, route).tileState === "unlocked",
      );
      if (anyUnlocked) {
        acc.push({ persona, route });
      }
    }
  }
  return acc;
})();

/**
 * Dev-vs-staging parity: staging-emulator run is gated on refactor_g2_6
 * (staging Firebase provisioning). Until G2.6 lands, the staging leg is
 * skipped with a clear TODO.
 */
export function isStagingFirebaseUnavailable(): boolean {
  // NEXT_PUBLIC_USE_FIREBASE_AUTH + a reachable staging URL are both required.
  // Playwright does not have a handle on either in local dev, so we treat the
  // emulator leg as "unavailable" unless the CI env explicitly sets it.
  const useFirebase = process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH === "true";
  const stagingBase =
    process.env.STAGING_FIREBASE_BASE_URL ?? process.env.PLAYWRIGHT_STAGING_BASE_URL;
  return !(useFirebase && stagingBase && stagingBase.length > 0);
}
