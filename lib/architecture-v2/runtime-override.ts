/**
 * RuntimeOverride — typed, audited, bounded live mutations on top of a
 * running `StrategyReleaseBundle`.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §4.8.3.
 *
 * DART Full users do not change strategy logic on the fly. They DO sometimes
 * need to: pause a venue, scale to 50% size, switch to a more conservative
 * execution preset, widen hedge tolerance, route treasury from wallet A to
 * wallet B, or flip exit-only during a regime event. Those are
 * `RuntimeOverride`s — typed, audited, bounded by the bundle's
 * `runtimeOverrideGuardrails`, and never silent.
 *
 * Rules:
 *   - Never rewrites the underlying release bundle. The bundle stays the
 *     source of truth; overrides are an additive audit layer.
 *   - Explain mode and Reports MUST show both the approved release bundle
 *     AND any runtime overrides active during the reporting period.
 *     Performance attribution that hides overrides is forbidden.
 *   - Overrides that exceed bundle guardrails are rejected at write time.
 *   - `kill_switch` is always allowed regardless of guardrails. Always
 *     audited.
 *
 * Typing approach: the plan's sketch left `value: unknown` open. We instead
 * model `RuntimeOverride` as a discriminated union keyed on `overrideType`
 * so the cockpit cannot ship a malformed payload at compile time.
 *
 * Phase 1B SCOPE: typed object only — no UI, no registry. The Command mode
 * (Terminal) wires override authoring in Phase 3.
 */

import type { ReleaseBundleOverrideGuardrails } from "./strategy-release-bundle";
import type { WorkspaceScope } from "./workspace-scope";

// ─────────────────────────────────────────────────────────────────────────────
// Override type discriminants
// ─────────────────────────────────────────────────────────────────────────────

export type RuntimeOverrideType =
  | "size_multiplier"
  | "venue_disable"
  | "execution_preset"
  | "risk_limit_tightening"
  | "treasury_route"
  | "pause_entries"
  | "exit_only"
  | "kill_switch";

export const RUNTIME_OVERRIDE_TYPES: readonly RuntimeOverrideType[] = [
  "size_multiplier",
  "venue_disable",
  "execution_preset",
  "risk_limit_tightening",
  "treasury_route",
  "pause_entries",
  "exit_only",
  "kill_switch",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Per-type value shapes (the discriminated union body)
// ─────────────────────────────────────────────────────────────────────────────

export interface SizeMultiplierValue {
  /** Multiplier in [0, bundle.runtimeOverrideGuardrails.sizeMultiplierRange[1]]. */
  readonly multiplier: number;
}

export interface VenueDisableValue {
  /** Venue / protocol id to disable. Bundle re-routes around it. */
  readonly venueOrProtocolId: string;
}

export interface ExecutionPresetValue {
  /** Approved preset id from `bundle.runtimeOverrideGuardrails.executionPresets`. */
  readonly presetId: string;
}

export interface RiskLimitTighteningValue {
  /**
   * Tighter limits ONLY (lower numbers). Loosening is forbidden — even if a
   * caller passes a higher value, the cockpit is expected to reject.
   */
  readonly limit: "max_loss_usd" | "max_drawdown_pct" | "max_concentration_pct";
  readonly newValue: number;
}

export interface TreasuryRouteValue {
  /** Bundle-whitelisted alternate wallet / protocol id. */
  readonly toWalletId: string;
  /** Optional source wallet id (when routing AWAY from a specific account). */
  readonly fromWalletId?: string;
}

/** No payload — a pure boolean toggle. */
export type PauseEntriesValue = Record<string, never>;
/** No payload — a pure boolean toggle. */
export type ExitOnlyValue = Record<string, never>;

export interface KillSwitchValue {
  /** Optional liquidation algo (defaults to bundle's flatten-immediate). */
  readonly liquidationAlgo?: string;
  /** Whether to halt new entries while liquidating. Defaults true. */
  readonly haltNewEntries?: boolean;
}

/**
 * Discriminated union — narrow on `overrideType` to access the typed value.
 * This is the single shape that flows through the cockpit, audit log, and
 * Explain reports.
 */
export type RuntimeOverrideValue =
  | { readonly overrideType: "size_multiplier"; readonly value: SizeMultiplierValue }
  | { readonly overrideType: "venue_disable"; readonly value: VenueDisableValue }
  | { readonly overrideType: "execution_preset"; readonly value: ExecutionPresetValue }
  | { readonly overrideType: "risk_limit_tightening"; readonly value: RiskLimitTighteningValue }
  | { readonly overrideType: "treasury_route"; readonly value: TreasuryRouteValue }
  | { readonly overrideType: "pause_entries"; readonly value: PauseEntriesValue }
  | { readonly overrideType: "exit_only"; readonly value: ExitOnlyValue }
  | { readonly overrideType: "kill_switch"; readonly value: KillSwitchValue };

// ─────────────────────────────────────────────────────────────────────────────
// RuntimeOverride
// ─────────────────────────────────────────────────────────────────────────────

interface RuntimeOverrideAudit {
  readonly overrideId: string;
  /** Bundle this override sits on top of. */
  readonly releaseId: string;
  /** Active scope at time of override (for analytics + funnel attribution). */
  readonly scope: WorkspaceScope;

  /** Mandatory free-text reason. Cockpit-side validation enforces non-empty. */
  readonly reason: string;

  readonly createdBy: string;
  readonly createdAt: string; // ISO 8601
  /** Optional auto-revert deadline (e.g. event-window pauses). */
  readonly expiresAt?: string;

  /** True iff this override required (and received) a second-signoff. */
  readonly requiresApproval: boolean;
  readonly approvedBy?: string;
  readonly approvedAt?: string;

  /** Snapshot of live state immediately before applying the override. */
  readonly preOverrideState: Readonly<Record<string, unknown>>;
  /** Snapshot of live state immediately after applying the override. */
  readonly postOverrideState: Readonly<Record<string, unknown>>;

  /** Event-sink reference for downstream queries (Reports / Explain). */
  readonly auditEventId: string;
}

/**
 * The full runtime override record — discriminated union × audit metadata.
 * Narrowing on `overrideType` gives `value: <PerTypeShape>` for free.
 */
export type RuntimeOverride = RuntimeOverrideAudit & RuntimeOverrideValue;

// ─────────────────────────────────────────────────────────────────────────────
// Guardrail enforcement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Guardrail-rejection codes. Returned by `validateOverrideAgainstGuardrails`
 * so the cockpit can show the precise reason a write was blocked.
 */
export type GuardrailRejectionCode =
  | "size_multiplier_out_of_range"
  | "size_multiplier_above_one"
  | "venue_disable_not_allowed"
  | "execution_preset_not_approved"
  | "risk_loosening_forbidden"
  | "treasury_route_not_allowed"
  | "pause_entries_not_allowed"
  | "exit_only_not_allowed";

export interface GuardrailValidationResult {
  /** True iff the override is permitted by the bundle's guardrails. */
  readonly allowed: boolean;
  /**
   * When `allowed === false`, the rejection code identifies which rule was
   * violated. The cockpit message is then assembled from the standard copy:
   *
   *   "This change exceeds the bundle's override guardrails. Promote a new
   *    bundle or contact risk."
   */
  readonly reason?: GuardrailRejectionCode;
}

const ALLOWED: GuardrailValidationResult = { allowed: true };

/**
 * Validate a candidate override against a bundle's `runtimeOverrideGuardrails`.
 * `kill_switch` is always allowed regardless of guardrails per §4.8.3.
 */
export function validateOverrideAgainstGuardrails(
  override: RuntimeOverrideValue,
  guardrails: ReleaseBundleOverrideGuardrails,
): GuardrailValidationResult {
  switch (override.overrideType) {
    case "kill_switch":
      // Always allowed — never bounded.
      return ALLOWED;

    case "size_multiplier": {
      const m = override.value.multiplier;
      const [lo, hi] = guardrails.sizeMultiplierRange;
      if (m > 1) return { allowed: false, reason: "size_multiplier_above_one" };
      if (m < lo || m > hi) return { allowed: false, reason: "size_multiplier_out_of_range" };
      return ALLOWED;
    }

    case "venue_disable":
      if (!guardrails.venueDisableAllowed) {
        return { allowed: false, reason: "venue_disable_not_allowed" };
      }
      return ALLOWED;

    case "execution_preset":
      if (!guardrails.executionPresets.includes(override.value.presetId)) {
        return { allowed: false, reason: "execution_preset_not_approved" };
      }
      return ALLOWED;

    case "risk_limit_tightening":
      // The discriminant says "tightening". We rely on the call-site to have
      // confirmed this is in fact a tightening (newValue < currentValue);
      // here we only enforce that the bundle permits the lever. Risk
      // *loosening* is a separate code path that always rejects.
      if (!guardrails.riskTighteningAllowed) {
        return { allowed: false, reason: "risk_loosening_forbidden" };
      }
      return ALLOWED;

    case "treasury_route":
      if (!guardrails.treasuryRouteOverridesAllowed) {
        return { allowed: false, reason: "treasury_route_not_allowed" };
      }
      return ALLOWED;

    case "pause_entries":
      if (!guardrails.pauseEntriesAllowed) {
        return { allowed: false, reason: "pause_entries_not_allowed" };
      }
      return ALLOWED;

    case "exit_only":
      if (!guardrails.exitOnlyAllowed) {
        return { allowed: false, reason: "exit_only_not_allowed" };
      }
      return ALLOWED;
  }
}

/**
 * Standard cockpit copy for guardrail rejections — single source of truth so
 * the Command mode and the audit log surface the same message.
 */
export const GUARDRAIL_REJECTION_MESSAGE =
  "This change exceeds the bundle's override guardrails. Promote a new bundle or contact risk.";
