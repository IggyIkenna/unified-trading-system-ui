/**
 * Visibility-slicing expected-state engine (G3.6).
 *
 * This module is the UI-side mirror of the G1.6 derivation engine surface
 * `access_control(user, route, item, phase)` + the G1.7 restriction-profile
 * resolver. It compiles the triple (persona, flavour, route) into the expected
 * observable state the Playwright spec asserts.
 *
 * Source of truth stack (in overlay order):
 *   1. `lib/architecture-v2/restriction-profiles.ts` — per-persona base tile
 *      lock-state matrix (admin/anon/client-full/prospect-dart/prospect-im/
 *      prospect-regulatory) + flavour overrides. Auto-generated from
 *      `unified-trading-pm/codex/14-playbooks/demo-ops/profiles/*.yaml` via
 *      `scripts/propagation/sync-restriction-profiles-to-ui.sh --write`.
 *   2. `lib/phase/use-phase-from-route.ts` — pure `phaseForPath()` derivation:
 *      research prefix → research, trading/execution prefix → live,
 *      `?phase=…` query override wins.
 *   3. `lib/config/services.ts` — `getVisibleServices()` entitlement gate
 *      (feeds the dashboard tile `padlocked-visible` fallback when the
 *      restriction profile returns `unlocked`).
 *
 * The expected-state fixture is a pure function of the triple — no network, no
 * React. Used both by the Playwright spec (per-cell assertions) and by a
 * vitest parity test that asserts this mirror stays aligned with the
 * auto-generated restriction-profiles module.
 *
 * Decision (2026-04-20): keep this as a hand-written mirror rather than
 * re-exporting `resolveTileLockState` directly so the spec can fail loud on
 * any unexpected profile widening — any drift between the YAML-driven
 * registry and this fixture is a signal that a visibility change slipped
 * through without updating the test contract.
 */

import {
  RESTRICTION_PROFILES,
  resolveTileLockState,
  type DemoFlavour,
  type PersonaId,
  type TileId,
} from "../../../lib/architecture-v2/restriction-profiles";
import { phaseForPath } from "../../../lib/phase/use-phase-from-route";
import type { Phase } from "../../../lib/phase/types";
import type { TileLockState } from "../../../lib/visibility/tile-lock-state";

/** Fallback persona used when an unknown persona-id is seeded. Matches the
 * "unknown persona → hidden" branch in `resolveTileLockState`. */
export const FALLBACK_PERSONA_ID: PersonaId = "anon";

/**
 * Personas covered by the matrix. Seven seed ids — all must resolve to a known
 * `PersonaId` in the restriction-profile registry. Seeds that don't have a
 * dedicated profile fall back to `FALLBACK_PERSONA_ID` (unknown → hidden).
 *
 * Columns:
 *   seedId      — id passed to `seedPersona()` in the Playwright spec
 *   profileId   — id the restriction-profile engine resolves to
 */
export interface PersonaRow {
  readonly seedId: string;
  readonly profileId: PersonaId;
  readonly description: string;
}

export const PERSONA_ROWS: readonly PersonaRow[] = [
  { seedId: "admin", profileId: "admin", description: "Full-system admin" },
  {
    seedId: "internal-trader",
    profileId: "admin",
    description: "Internal trader — mapped to admin profile (no dedicated YAML yet)",
  },
  { seedId: "client-full", profileId: "client-full", description: "Paying full-DART client" },
  {
    seedId: "client-data-only",
    profileId: FALLBACK_PERSONA_ID,
    description: "Data-basic-only client — no dedicated restriction profile; falls back to anon",
  },
  { seedId: "prospect-im", profileId: "prospect-im", description: "IM warm prospect" },
  { seedId: "prospect-dart", profileId: "prospect-dart", description: "DART warm prospect" },
  {
    seedId: "prospect-regulatory",
    profileId: "prospect-regulatory",
    description: "Reg Umbrella warm prospect",
  },
] as const;

/**
 * Demo flavours covered by the matrix. Closed set of three (base + two
 * overrides). Keeping the matrix at three balances breadth (enough to catch
 * flavour-driven widenings/narrowings) against CI cost (Playwright page-load
 * is not cheap).
 */
export const FLAVOUR_COLUMNS: readonly (DemoFlavour | undefined)[] = [
  undefined, // base profile — no flavour override
  "turbo", // narrow-by-default flavour
  "deep_dive", // widen-by-default flavour
] as const;

/** A single tile in the restriction-profile engine. */
export interface TileRouteRow {
  /** Path navigated in the Playwright spec. */
  readonly route: string;
  /** Restriction-profile tile the route maps to. */
  readonly tileId: TileId;
  /** Human label for reporting / debugging. */
  readonly label: string;
  /** Does the route honour `?phase=` query param (G1.1)? */
  readonly phaseSensitive: boolean;
  /** Does the route live under the (ops) / admin route group? */
  readonly adminOnly: boolean;
}

/**
 * ~25 authenticated routes covering every tile and every lifecycle stage.
 * Public / marketing routes (under `(public)/`) are intentionally excluded —
 * they are the open surface area and have their own spec
 * (`marketing-public-shell.spec.ts`).
 */
export const ROUTE_ROWS: readonly TileRouteRow[] = [
  // ── data tile ────────────────────────────────────────────────────────────
  { route: "/services/data/overview", tileId: "data", label: "Data overview", phaseSensitive: false, adminOnly: false },
  { route: "/services/data/instruments", tileId: "data", label: "Data — instruments", phaseSensitive: false, adminOnly: false },
  { route: "/services/data/coverage", tileId: "data", label: "Data — coverage", phaseSensitive: false, adminOnly: false },
  // ── research tile ────────────────────────────────────────────────────────
  { route: "/services/research/overview", tileId: "research", label: "Research overview", phaseSensitive: true, adminOnly: false },
  { route: "/services/research/features", tileId: "research", label: "Research — features", phaseSensitive: true, adminOnly: false },
  { route: "/services/research/ml", tileId: "research", label: "Research — ML", phaseSensitive: true, adminOnly: false },
  // ── promote tile ─────────────────────────────────────────────────────────
  { route: "/services/promote", tileId: "promote", label: "Promote hub", phaseSensitive: false, adminOnly: false },
  // ── trading tile (execution routes collapse onto trading) ────────────────
  { route: "/services/trading/overview", tileId: "trading", label: "Trading overview", phaseSensitive: true, adminOnly: false },
  { route: "/services/trading/terminal", tileId: "trading", label: "Trading terminal", phaseSensitive: true, adminOnly: false },
  { route: "/services/trading/pnl", tileId: "trading", label: "Trading P&L", phaseSensitive: true, adminOnly: false },
  { route: "/services/trading/orders", tileId: "trading", label: "Trading orders", phaseSensitive: true, adminOnly: false },
  { route: "/services/execution/overview", tileId: "trading", label: "Execution overview", phaseSensitive: true, adminOnly: false },
  { route: "/services/execution/tca", tileId: "trading", label: "Execution TCA", phaseSensitive: true, adminOnly: false },
  // ── observe tile ─────────────────────────────────────────────────────────
  { route: "/services/observe/health", tileId: "observe", label: "Observe health", phaseSensitive: false, adminOnly: false },
  { route: "/services/observe/risk", tileId: "observe", label: "Observe risk", phaseSensitive: false, adminOnly: false },
  { route: "/services/observe/alerts", tileId: "observe", label: "Observe alerts", phaseSensitive: false, adminOnly: false },
  // ── reports tile ─────────────────────────────────────────────────────────
  { route: "/services/reports/overview", tileId: "reports", label: "Reports overview", phaseSensitive: false, adminOnly: false },
  { route: "/services/reports/settlement", tileId: "reports", label: "Reports — settlement", phaseSensitive: false, adminOnly: false },
  { route: "/services/reports/regulatory", tileId: "reports", label: "Reports — regulatory", phaseSensitive: false, adminOnly: false },
  { route: "/services/reports/executive", tileId: "reports", label: "Reports — executive", phaseSensitive: false, adminOnly: false },
  // ── investor-relations tile ──────────────────────────────────────────────
  { route: "/investor-relations", tileId: "investor-relations", label: "IR hub", phaseSensitive: false, adminOnly: false },
  { route: "/investor-relations/board-presentation", tileId: "investor-relations", label: "IR board presentation", phaseSensitive: false, adminOnly: false },
  { route: "/investor-relations/plan-presentation", tileId: "investor-relations", label: "IR plan presentation", phaseSensitive: false, adminOnly: false },
  // ── admin tile (ops route group) ─────────────────────────────────────────
  { route: "/admin", tileId: "admin", label: "Admin hub", phaseSensitive: false, adminOnly: true },
  { route: "/admin/users", tileId: "admin", label: "Admin users", phaseSensitive: false, adminOnly: true },
  { route: "/admin/system-health", tileId: "admin", label: "Admin system health", phaseSensitive: false, adminOnly: true },
] as const;

/**
 * Expected observable state for a single (persona, flavour, route) cell.
 *
 * `tileState` is what the dashboard's `<ServiceTile>` wrapper must render for
 * the route's backing tile. The Playwright spec does NOT assert server-side
 * 403s on the route itself — today the Next.js router does not enforce
 * audience-level route gating (that lands in G2.1 real-Firebase claims +
 * middleware). Per-tile padlocking on `/dashboard` is the visible safety
 * contract.
 *
 * `dashboardReachable` is always true in the current architecture — every
 * authenticated route renders its page component; the padlock is purely a
 * dashboard-level affordance. Future: when Next middleware gates by claims
 * (G2.1+), this flips to `false` for `hidden` cells and the spec tightens.
 */
export interface ExpectedCell {
  readonly persona: PersonaRow;
  readonly flavour: DemoFlavour | undefined;
  readonly route: TileRouteRow;
  readonly tileState: TileLockState;
  readonly dashboardReachable: true;
  /** Expected phase when `?phase=` is omitted — for phase-sensitive routes. */
  readonly defaultPhase: Phase;
}

/** Deterministic cell builder — pure function of its inputs. */
export function computeCell(
  persona: PersonaRow,
  flavour: DemoFlavour | undefined,
  route: TileRouteRow,
): ExpectedCell {
  const tileState = resolveTileLockState(persona.profileId, route.tileId, flavour);
  const defaultPhase = phaseForPath(route.route, null);
  return {
    persona,
    flavour,
    route,
    tileState,
    dashboardReachable: true,
    defaultPhase,
  };
}

/** Full matrix — (personas × flavours × routes). */
export function buildMatrix(): readonly ExpectedCell[] {
  const cells: ExpectedCell[] = [];
  for (const persona of PERSONA_ROWS) {
    for (const flavour of FLAVOUR_COLUMNS) {
      for (const route of ROUTE_ROWS) {
        cells.push(computeCell(persona, flavour, route));
      }
    }
  }
  return cells;
}

/** Pre-computed matrix size for smoke-level assertions in vitest. */
export const MATRIX_SIZE = PERSONA_ROWS.length * FLAVOUR_COLUMNS.length * ROUTE_ROWS.length;

/** Breakdown of expected tile-state counts across the full matrix. */
export function countStateBreakdown(): Readonly<Record<TileLockState, number>> {
  const counts: Record<TileLockState, number> = {
    unlocked: 0,
    "padlocked-visible": 0,
    hidden: 0,
  };
  for (const cell of buildMatrix()) {
    counts[cell.tileState] += 1;
  }
  return counts;
}

/**
 * Phase-toggle sub-matrix. For each phase-sensitive route, assert the
 * `?phase=paper|live|research` query param round-trips through the page
 * unchanged (G1.1 contract). Runs only for admin (universe-wide coverage) to
 * keep CI cost bounded; flavour axis is not relevant for phase semantics
 * because phase is a route-level concern, not a profile-level one.
 */
export interface PhaseCell {
  readonly route: TileRouteRow;
  readonly phase: Phase;
}

export function buildPhaseMatrix(): readonly PhaseCell[] {
  const phases: readonly Phase[] = ["research", "paper", "live"];
  const cells: PhaseCell[] = [];
  for (const route of ROUTE_ROWS) {
    if (!route.phaseSensitive) continue;
    for (const phase of phases) {
      cells.push({ route, phase });
    }
  }
  return cells;
}

export const PHASE_MATRIX_SIZE = buildPhaseMatrix().length;

/** Exported registry of known persona-ids — for parity tests. */
export const KNOWN_PROFILE_IDS: readonly PersonaId[] = Object.keys(
  RESTRICTION_PROFILES,
).sort() as PersonaId[];
