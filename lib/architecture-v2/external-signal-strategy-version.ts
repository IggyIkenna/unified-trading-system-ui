/**
 * ExternalSignalStrategyVersion — the Signals-In path.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §4.8.5.
 *
 * Signals-In clients bring their own research. DART does NOT train their
 * models, does NOT own their feature library, does NOT run their backtests.
 * What DART provides:
 *
 *   - Registers the external strategy with a typed version object.
 *   - Validates the client's signal payload schema.
 *   - Maps client instructions onto DART execution / risk / reporting configs.
 *   - Tags every fill and report with the external version so the client
 *     can compare new-version performance to prior-version performance
 *     (idempotency by version tag).
 *
 * The client never edits their own external version registration through the
 * cockpit. New version = new registration. This is the idempotency rule.
 *
 * Catalogue does NOT show external strategies in Discover (they are
 * client-private). They DO show in the client's Reality view in Strategies
 * mode.
 *
 * Phase 1B SCOPE: typed object only — no UI, no registry. The
 * `surface=signals` shell wires registration in Phase 3+; Reports tags
 * fills in Phase 7+.
 */

import type { ShareClass } from "./enums";

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle status (Signals-In has its own state machine — there is no
// Discover/Build/Train. Registration is the entry point; paper validates
// schema/mapping; live runs real money. Retirement is explicit.)
// ─────────────────────────────────────────────────────────────────────────────

export type ExternalSignalStatus =
  | "registered" // client declared a new external version; awaiting validation
  | "validating" // schema + mapping under validation
  | "paper" // running on paper to confirm fills + reporting alignment
  | "approved_for_live"
  | "live"
  | "paused"
  | "retired";

export const EXTERNAL_SIGNAL_STATUSES: readonly ExternalSignalStatus[] = [
  "registered",
  "validating",
  "paper",
  "approved_for_live",
  "live",
  "paused",
  "retired",
] as const;

const FORWARD_TRANSITIONS: Readonly<Record<ExternalSignalStatus, readonly ExternalSignalStatus[]>> = {
  registered: ["validating", "retired"],
  validating: ["paper", "registered", "retired"], // back to "registered" if validation surfaces a fixable schema issue
  paper: ["approved_for_live", "validating", "paused", "retired"],
  approved_for_live: ["live", "retired"],
  live: ["monitor", "paused", "retired"] as readonly ExternalSignalStatus[] satisfies readonly ExternalSignalStatus[],
  paused: ["paper", "live", "retired"],
  retired: [],
};

/**
 * True iff `from → to` is a permitted external-version transition. The
 * Signals-In service uses this to gate state-machine writes.
 */
export function canTransitionExternalSignalStatus(from: ExternalSignalStatus, to: ExternalSignalStatus): boolean {
  if (from === to) return false;
  // The "monitor" placeholder isn't yet in ExternalSignalStatus — it's a
  // forward-looking marker. Drop it from runtime checks.
  return (FORWARD_TRANSITIONS[from] ?? []).includes(to);
}

// ─────────────────────────────────────────────────────────────────────────────
// ExternalSignalStrategyVersion
// ─────────────────────────────────────────────────────────────────────────────

export interface ExternalSignalStrategyVersion {
  /** Client's identifier for the strategy (cockpit treats opaque). */
  readonly externalStrategyId: string;
  /** Client's version tag — semver, hash, or arbitrary string. */
  readonly externalVersion: string;
  readonly clientId: string;

  // DART-side schema + mapping versions (assigned by DART, not the client).
  /** DART-assigned signal payload schema the client conforms to. */
  readonly signalSchemaVersion: string;
  /** Translation rules: external instructions → DART execution wire format. */
  readonly instructionMappingVersion: string;

  // DART-side configs attached to this external version.
  readonly executionConfigVersion: string;
  readonly riskConfigVersion: string;
  /** Optional — populated when the external strategy uses DART treasury policy. */
  readonly treasuryPolicyConfigVersion?: string;
  /** Tag set propagated through reports for client-side attribution. */
  readonly reportingTagSetVersion: string;

  // Routing context.
  readonly accountOrMandateId?: string;
  readonly shareClass?: ShareClass;

  // Validation evidence (Signals-In equivalent of bundle validation).
  readonly validationRunIds: readonly string[]; // schema validation, instruction-mapping verification
  readonly paperRunIds?: readonly string[];

  // Lifecycle.
  readonly status: ExternalSignalStatus;

  // Audit.
  readonly registeredBy: string;
  readonly registeredAt: string; // ISO 8601
  readonly retiredBy?: string;
  readonly retiredAt?: string;
}

/**
 * Compose the canonical idempotency key — `${externalStrategyId}@${externalVersion}`.
 * Reports tag every fill with this key so a client can compare new-version
 * performance to prior-version performance without re-keying anything.
 */
export function externalVersionKey(version: Pick<ExternalSignalStrategyVersion, "externalStrategyId" | "externalVersion">): string {
  return `${version.externalStrategyId}@${version.externalVersion}`;
}
