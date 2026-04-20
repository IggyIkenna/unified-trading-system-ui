/**
 * Stub hook for resolving a ServiceTile's lock state from the user's restriction
 * profile. This is a STUB — every tile currently returns `"unlocked"`.
 *
 * **Refactor G1.7 (restriction-profile engine)** replaces the body of this hook
 * with a real lookup that consults:
 *   1. The user's role (admin → always "unlocked").
 *   2. The derivation engine's `access_control(user, route, item, phase)`
 *      resolution per `codex/14-playbooks/infra-spec/stage-3c-derivation-engine.md`.
 *   3. Any per-tile admin override persisted by the admin toggle UI
 *      (Phase 10.5 → extended with tile-level override by G1.7).
 *
 * Until G1.7 lands, keep this a pure identity stub so the tile component's
 * padlock branch can be unit-tested and hand-inspected via the admin persona
 * seed without a real restriction-profile registry wired in.
 *
 * SSOTs:
 *   - codex/14-playbooks/cross-cutting/visibility-slicing.md
 *   - codex/14-playbooks/demo-ops/demo-restriction-profiles.md
 *   - codex/14-playbooks/infra-spec/stage-3c-derivation-engine.md
 */

import type { TileLockState } from "./tile-lock-state";

/**
 * @param tileId Service-key identifier (matches `ServiceDefinition.key`).
 *               Reserved for G1.7 to resolve per-tile profile lookups; ignored
 *               here to keep the stub deterministic.
 */
export function useTileLockState(_tileId: string): TileLockState {
  // TODO(G1.7): replace with `deriveTileLockState(user, tile)` per
  // codex/14-playbooks/infra-spec/stage-3c-derivation-engine.md §access_control.
  return "unlocked";
}
