/**
 * G1.1 Phase unification — route-phase side-table.
 *
 * User decision 2026-04-20 (decision #3): start with inline `phase` field on
 * `lifecycle-route-mappings.ts`; fall back to this side-table if consumers
 * break at typecheck. We chose the side-table route for G1.1 to keep the
 * commit surgical and avoid touching 300+ inline mapping entries — the
 * `phaseForPath()` derivation in `use-phase-from-route.ts` is the single
 * source of truth and covers every route via prefix matching.
 *
 * Consumers that want a `phase` annotation on a `RouteMapping`-like record
 * should compose via `routePhase(mapping.path)` rather than reading a field
 * directly on the mapping. This keeps the mapping file lean and makes the
 * phase contract a function-level invariant, not a data-level one.
 */

import { phaseForPath } from "./use-phase-from-route";
import { type Phase } from "./types";

export function routePhase(path: string): Phase {
  return phaseForPath(path);
}
