/**
 * Resolve a ServiceTile's lock state from the active persona's restriction
 * profile (G1.7 — restriction-profile engine).
 *
 * SSOT flow:
 *   codex/14-playbooks/demo-ops/profiles/<persona>.yaml
 *   → UAC `unified_api_contracts.internal.architecture_v2.restriction_profiles.resolve_profile`
 *   → PM sync-script generates `lib/architecture-v2/restriction-profiles.ts`
 *   → this hook reads the TS mirror + current persona context.
 *
 * Drift detection: `scripts/quality-gates.sh` runs
 * `bash unified-trading-pm/scripts/propagation/sync-restriction-profiles-to-ui.sh --check`
 * pre-QG so any hand edit to the TS mirror OR a missing regen after a YAML
 * change blocks the push.
 *
 * Follow-ups that will layer on this hook:
 *   - G1.10 questionnaire-response wiring (tile-level widenings on vague
 *     answers — currently a no-op in the UAC engine).
 *   - G1.13 tempt-logic overlays (sales-operator layering).
 *
 * SSOTs:
 *   - unified-trading-pm/codex/14-playbooks/demo-ops/profiles/*.yaml
 *   - unified-api-contracts/.../internal/architecture_v2/restriction_profiles.py
 *   - codex/14-playbooks/cross-cutting/visibility-slicing.md
 */

import { useAuth } from "@/hooks/use-auth";

import type { DemoFlavour, PersonaId, TileId } from "../architecture-v2/restriction-profiles";
import { resolveTileLockState } from "../architecture-v2/restriction-profiles";

import type { TileLockState } from "./tile-lock-state";

/**
 * Resolve the tile's lock-state for the currently seeded persona.
 *
 * Reads `useAuth().user.id` (the persona id — mock-provider seeds it from the
 * persona registry, Firebase staging/prod seeds it from the authenticated
 * user id mapped through `getPersonaById`). Falls back to `"anon"` when no
 * user is loaded so public-site visitors see the deterministic anon profile.
 *
 * @param tileId ServiceDefinition.key — must be a known TileId; unknown ids
 *               resolve to `"hidden"` to fail closed (we'd rather hide a
 *               mis-named tile than accidentally reveal it).
 * @param flavour Optional demo flavour override. When omitted the persona's
 *                base profile applies.
 * @returns TileLockState from the restriction profile.
 */
export function useTileLockState(tileId: string, flavour?: DemoFlavour): TileLockState {
  const { user } = useAuth();
  const personaId = (user?.id ?? "anon") as PersonaId | string;
  // TileId enum is closed; cast lets the consumer pass a ServiceDefinition.key
  // (string). If the key is not a known TileId the resolver falls back to
  // "hidden" via the unknown-persona branch (matches anon semantics).
  return resolveTileLockState(personaId, tileId as TileId, flavour);
}
