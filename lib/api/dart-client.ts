/**
 * DART API client — typed wrappers around the 4 DART backend endpoints.
 *
 * Endpoints:
 *   POST /api/archetypes/{archetypeId}/preview          — pre-trade preview
 *   POST /api/manual/submit                             — submit manual instruction
 *   GET  /api/instructions/{instructionId}/status       — poll instruction status
 *   POST /api/archetypes/{archetypeId}/operational-mode — flip automation mode
 *
 * Mirrors the `lib/api/strategy-versions.ts` shape: raw fetch wrappers,
 * typed request/response interfaces, error classes. Consumers should import
 * from this module — NOT hit the endpoints ad-hoc. This provides a single
 * intercept point for mock injection in tests.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/dart_manual_trade_ux_refactor_2026_05_13.md
 *   Phase C.3.
 */

import { apiFetch } from "@/lib/api/fetch";

// ─── Shared types ────────────────────────────────────────────────────────────

export type ManualInstructionStatus =
  | "pending"
  | "partial"
  | "filled"
  | "cancelled"
  | "rejected";

export type OperationalMode = "MANUAL" | "PAPER" | "LIVE" | "BACKTEST";

// ─── Preview endpoint ─────────────────────────────────────────────────────────

export interface PreviewRequest {
  readonly archetype: string;
  readonly venue: string;
  /** Side: "buy" | "sell" for TRADE; action name for DeFi instructions. */
  readonly side: string;
  /** Size as percentage of NAV (0–100). */
  readonly size_pct_nav: number;
  /** Limit price; omit for market orders. */
  readonly limit_price?: number;
  /** Execution algorithm, e.g. "MARKET" | "TWAP" | "VWAP". */
  readonly algo?: string;
  /** Dry-run: validate without persisting. */
  readonly dry_run?: boolean;
  /** Strategy ID attribution per CLAUDE.md strategy_id grammar. */
  readonly strategy_id?: string;
}

export interface RiskCheckResult {
  readonly rule: string;
  readonly passed: boolean;
  readonly reason?: string;
  readonly warning?: string;
}

export interface PreviewResponse {
  readonly correlation_id: string;
  readonly archetype: string;
  readonly venue: string;
  readonly side: string;
  readonly projected_fill_price: number | null;
  readonly slippage_bps: number | null;
  readonly collateral_required_usd: number | null;
  readonly max_drawdown_impact_pct: number | null;
  readonly risk_checks: readonly RiskCheckResult[];
  readonly risk_check_passed: boolean;
  readonly estimated_at: string;
}

export class PreviewRiskBlockError extends Error {
  readonly correlation_id: string;
  readonly failed_checks: readonly RiskCheckResult[];
  status = 422 as const;

  constructor(correlationId: string, failedChecks: readonly RiskCheckResult[]) {
    const labels = failedChecks.map((c) => c.rule).join(", ");
    super(`Pre-trade risk check failed: ${labels}`);
    this.name = "PreviewRiskBlockError";
    this.correlation_id = correlationId;
    this.failed_checks = failedChecks;
  }
}

export async function previewManualInstruction(
  archetypeId: string,
  request: PreviewRequest,
  token: string | null,
): Promise<PreviewResponse> {
  const result = (await apiFetch(
    `/api/archetypes/${encodeURIComponent(archetypeId)}/preview`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  )) as PreviewResponse;

  if (!result.risk_check_passed) {
    const failed = result.risk_checks.filter((c) => !c.passed);
    throw new PreviewRiskBlockError(result.correlation_id, failed);
  }

  return result;
}

// ─── Submit endpoint ──────────────────────────────────────────────────────────

export interface SubmitRequest {
  /** Correlation ID from the preview step; links submit to the preview. */
  readonly correlation_id: string;
  readonly archetype: string;
  readonly venue: string;
  readonly side: string;
  readonly size_pct_nav: number;
  readonly limit_price?: number;
  readonly algo?: string;
  readonly dry_run?: boolean;
  readonly strategy_id?: string;
}

export interface SubmitResponse {
  readonly instruction_id: string;
  readonly archetype: string;
  readonly venue: string;
  readonly status: ManualInstructionStatus;
  readonly submitted_at: string;
  readonly strategy_id?: string;
}

export async function submitManualInstruction(
  request: SubmitRequest,
  token: string | null,
): Promise<SubmitResponse> {
  return (await apiFetch("/api/manual/submit", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })) as SubmitResponse;
}

// ─── Status endpoint ──────────────────────────────────────────────────────────

export interface InstructionStatusResponse {
  readonly instruction_id: string;
  readonly status: ManualInstructionStatus;
  readonly filled_qty: number;
  readonly avg_fill_price: number | null;
  readonly unrealized_pnl: number | null;
  readonly last_update_ts: string;
  readonly venue?: string;
  readonly instrument?: string;
}

export async function fetchInstructionStatus(
  instructionId: string,
  token: string | null,
): Promise<InstructionStatusResponse> {
  return (await apiFetch(
    `/api/instructions/${encodeURIComponent(instructionId)}/status`,
    token,
  )) as InstructionStatusResponse;
}

// ─── Operational-mode endpoint ────────────────────────────────────────────────

export interface ModeTransitionRequest {
  readonly operational_mode: OperationalMode;
}

export interface ModeTransitionResponse {
  readonly archetype_id: string;
  readonly operational_mode: OperationalMode;
  readonly transitioned_at: string;
}

export async function transitionOperationalMode(
  archetypeId: string,
  request: ModeTransitionRequest,
  token: string | null,
): Promise<ModeTransitionResponse> {
  return (await apiFetch(
    `/api/archetypes/${encodeURIComponent(archetypeId)}/operational-mode`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  )) as ModeTransitionResponse;
}
