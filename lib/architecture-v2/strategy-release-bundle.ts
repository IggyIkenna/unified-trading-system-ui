/**
 * StrategyReleaseBundle — the immutable promotion artifact.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.md §4.8.2.
 *
 * Every strategy that runs in DART Terminal MUST be backed by a release
 * bundle. The bundle pins every dimension that affects strategy behaviour
 * (research config, feature set, model, execution config, risk, treasury
 * policy, venue set, instrument universe, slippage curves, signal/instruction
 * schemas) plus the validation evidence that justifies promoting it.
 *
 * Properties:
 *   - Immutable. Once created, never mutated. State transitions
 *     (draft → candidate → approved_for_paper → ...) are separate audit
 *     entries, not bundle edits.
 *   - Bit-identical reproducibility. Every version pin is content-hashed;
 *     rerun-from-bundle produces the same backtest, the same paper run, the
 *     same model.
 *   - One bundle = one strategy version. Promoting a model retrain creates a
 *     new bundle. Promoting an execution-config tweak creates a new bundle.
 *   - Signals-In bundles use the sibling `ExternalSignalStrategyVersion`
 *     shape (see `external-signal-strategy-version.ts`).
 *
 * The `runtimeOverrideGuardrails` block declares what RuntimeOverrides are
 * allowed without re-promotion. Overrides outside these bounds are rejected
 * at write time with the message:
 *   "This change exceeds the bundle's override guardrails. Promote a new
 *    bundle or contact risk."
 *
 * Phase 1B SCOPE: typed object only — no UI, no registry. The Promote
 * surface (Research stage) wires bundle creation in Phase 4; the Terminal
 * Strategies surface wires bundle acceptance in Phase 3.
 */

import type { ShareClass } from "./enums";
import type { StrategyMaturityPhase } from "./lifecycle";

// ─────────────────────────────────────────────────────────────────────────────
// Promotion lifecycle (state machine)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bundle promotion status — one bundle moves through this state machine.
 *
 * Per §4.8.7: aligned with the canonical lifecycle stages
 *   draft → candidate → approved_for_paper → paper → approved_for_pilot
 *         → pilot → approved_for_live → live → monitor → retired
 *                                                       ↘ rolled_back
 */
export type ReleaseBundlePromotionStatus =
  | "draft"
  | "candidate"
  | "approved_for_paper"
  | "paper"
  | "approved_for_pilot"
  | "pilot"
  | "approved_for_live"
  | "live"
  | "paused"
  | "monitor"
  | "retired"
  | "rolled_back";

export const RELEASE_BUNDLE_PROMOTION_STATUSES: readonly ReleaseBundlePromotionStatus[] = [
  "draft",
  "candidate",
  "approved_for_paper",
  "paper",
  "approved_for_pilot",
  "pilot",
  "approved_for_live",
  "live",
  "paused",
  "monitor",
  "retired",
  "rolled_back",
] as const;

/**
 * Permitted forward transitions for `promotionStatus`. Bundles may also
 * transition to `paused`, `rolled_back`, or `retired` from any non-terminal
 * status; those are handled separately in `canTransitionPromotionStatus`.
 */
const FORWARD_TRANSITIONS: Readonly<Record<ReleaseBundlePromotionStatus, readonly ReleaseBundlePromotionStatus[]>> = {
  draft: ["candidate", "retired"],
  candidate: ["approved_for_paper", "retired"],
  approved_for_paper: ["paper", "retired"],
  paper: ["approved_for_pilot", "paused", "retired"],
  approved_for_pilot: ["pilot", "retired"],
  pilot: ["approved_for_live", "paused", "retired"],
  approved_for_live: ["live", "retired"],
  live: ["monitor", "paused", "retired", "rolled_back"],
  paused: ["paper", "pilot", "live", "monitor", "retired", "rolled_back"],
  monitor: ["live", "paused", "retired"],
  retired: [],
  rolled_back: ["candidate", "retired"],
};

/**
 * True iff `from → to` is a permitted promotion transition. Used by the
 * Promote surface (Research) and the Strategies surface (Terminal) to
 * gate state-machine writes.
 */
export function canTransitionPromotionStatus(
  from: ReleaseBundlePromotionStatus,
  to: ReleaseBundlePromotionStatus,
): boolean {
  if (from === to) return false;
  return (FORWARD_TRANSITIONS[from] ?? []).includes(to);
}

// ─────────────────────────────────────────────────────────────────────────────
// Override guardrails (declared at bundle creation; enforced at runtime)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bounds and switches that determine which RuntimeOverrides are allowed on
 * top of this bundle without re-promotion. Mutating outside these bounds
 * requires a new bundle.
 */
export interface ReleaseBundleOverrideGuardrails {
  /**
   * Permitted size-multiplier range as `[min, max]`. Convention is
   * `[0, ≤1]` — strategies can scale down (including to zero) without a
   * re-promotion, but never up. Out-of-band scaling requires a new bundle.
   */
  readonly sizeMultiplierRange: readonly [number, number];

  /** Optional bound on how the treasury rebalance trigger may move at runtime. */
  readonly treasuryRebalanceThresholdRange?: readonly [number, number];

  /** When false, `venue_disable` overrides are rejected. */
  readonly venueDisableAllowed: boolean;

  /** Approved execution presets a runtime operator may switch to. */
  readonly executionPresets: readonly string[];

  /** Risk-tightening (lower limits) is always allowed when true; loosening always rejected. */
  readonly riskTighteningAllowed: boolean;

  readonly pauseEntriesAllowed: boolean;
  readonly exitOnlyAllowed: boolean;

  /** Routing within the bundle-declared wallet whitelist may flip. */
  readonly treasuryRouteOverridesAllowed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// StrategyReleaseBundle
// ─────────────────────────────────────────────────────────────────────────────

export interface StrategyReleaseBundle {
  readonly releaseId: string; // e.g. "rb-arbitrage-cefi-defi-v3.2.1"
  readonly strategyId: string;
  readonly strategyVersion: string; // semver

  // Version pins — every dimension that affects strategy behaviour.
  readonly researchConfigVersion: string;
  readonly featureSetVersion?: string; // optional for rules-based (non-ML) strategies
  readonly modelVersion?: string; // optional for rules-based
  readonly executionConfigVersion: string;
  readonly riskConfigVersion: string;
  readonly treasuryPolicyConfigVersion?: string;
  readonly venueSetVersion: string;
  readonly instrumentUniverseVersion: string;
  readonly dataAssumptionVersion: string; // slippage curves, fee schedules, latency model
  readonly signalSchemaVersion?: string; // for strategies emitting external signals
  readonly instructionSchemaVersion: string; // wire format strategy → execution-service

  // Routing context.
  readonly shareClass?: ShareClass;
  readonly accountOrMandateId?: string;

  // Execution-aware validation evidence (REQUIRED — see §4.8.4).
  readonly validationRunIds: readonly string[];
  readonly backtestRunIds: readonly string[];
  readonly paperRunIds?: readonly string[];
  readonly pilotRunIds?: readonly string[];

  // Promotion lifecycle.
  readonly promotionStatus: ReleaseBundlePromotionStatus;

  // Override guardrails.
  readonly runtimeOverrideGuardrails: ReleaseBundleOverrideGuardrails;

  // Maturity phase the bundle currently sits at; mirror of promotionStatus
  // resolved against the strategy-architecture taxonomy in lifecycle.ts.
  readonly maturityPhase: StrategyMaturityPhase;

  // Audit + lineage.
  readonly createdBy: string;
  readonly createdAt: string; // ISO 8601
  readonly approvedBy?: string;
  readonly approvedAt?: string;
  readonly acceptedByTerminal?: string; // distinct from approver
  readonly acceptedAt?: string;
  readonly retiredBy?: string;
  readonly retiredAt?: string;
  readonly rolledBackFromReleaseId?: string;

  // Reproducibility.
  readonly contentHash: string; // hash of all version pins + guardrails
  readonly lineageHash: string; // hash of upstream data + features + model lineage
}

// ─────────────────────────────────────────────────────────────────────────────
// Promotion-status → maturity-phase mapping (§4.8.7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical mapping from bundle `promotionStatus` to the strategy-architecture
 * maturity-phase taxonomy. The §4.5 resolver keys off `maturityPhase` so this
 * table is the single source of truth for that bridge.
 *
 * The mapping is many-to-one: paper_1d/paper_14d/paper_stable all collapse to
 * the canonical paper-window granularity at bundle level, and the Validate
 * stage (research) selects which subdivision applies to each backtest run.
 */
export const PROMOTION_STATUS_TO_MATURITY: Readonly<Record<ReleaseBundlePromotionStatus, StrategyMaturityPhase>> = {
  draft: "smoke",
  candidate: "backtest_multi_year",
  approved_for_paper: "backtest_multi_year",
  paper: "paper_stable",
  approved_for_pilot: "paper_stable",
  pilot: "pilot",
  approved_for_live: "pilot",
  live: "live_stable",
  paused: "live_stable",
  monitor: "monitor",
  retired: "retired",
  rolled_back: "retired",
};

/**
 * Resolve the canonical maturity phase from a bundle's promotionStatus.
 * Helper for consumers that want the resolver-aligned phase without manually
 * indexing the map.
 */
export function maturityPhaseForPromotionStatus(status: ReleaseBundlePromotionStatus): StrategyMaturityPhase {
  return PROMOTION_STATUS_TO_MATURITY[status];
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty-bundle helper (test-only seed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default override guardrails — the most conservative shape: no scaling above
 * 1×, no venue disable, no treasury rerouting. Bundles may widen these at
 * creation time but defaulting to "tight" is the right safety posture.
 */
export const DEFAULT_BUNDLE_GUARDRAILS: ReleaseBundleOverrideGuardrails = {
  sizeMultiplierRange: [0, 1],
  venueDisableAllowed: false,
  executionPresets: [],
  riskTighteningAllowed: true,
  pauseEntriesAllowed: true,
  exitOnlyAllowed: true,
  treasuryRouteOverridesAllowed: false,
};
