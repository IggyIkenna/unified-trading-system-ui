/**
 * Backend API client for the promote workflow (Phase U3/U4).
 *
 * Calls POST /api/promote/{strategyId}/{manifestId} on the deployment-api
 * and GET /api/strategy/{strategyId}/runs?mode=batch|paper|live.
 *
 * Used by promote-workflow-context.tsx and the strategy detail page.
 */

import { apiFetch } from "./fetch";

export type PromoteTargetPhase = "paper_1d" | "live_early";

export interface PromoteRequest {
  target_phase: PromoteTargetPhase;
  promoter: string;
  reason: string;
}

export interface PromoteResponse {
  manifest_id: string;
  strategy_id: string;
  strategy_instance_id: string;
  target_phase: string;
  promoter: string;
  promoted_at: string;
  event_emitted: string;
}

export interface RunRecord {
  run_id: string;
  strategy_id: string;
  mode: string;
  run_date: string;
  realized_pnl: number;
  unrealized_pnl: number;
  fill_count: number;
  event_count: number;
  slippage_bps_avg: number;
  order_latency_p99_ms: number;
}

export interface StrategyRunsResponse {
  strategy_id: string;
  mode: string;
  runs: RunRecord[];
  total_count: number;
  page: number;
  page_size: number;
}

export async function promoteCandidate(
  strategyId: string,
  manifestId: string,
  request: PromoteRequest,
  token: string | null,
): Promise<PromoteResponse> {
  return apiFetch(`/api/promote/${encodeURIComponent(strategyId)}/${encodeURIComponent(manifestId)}`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }) as Promise<PromoteResponse>;
}

export interface DemoteRequest {
  demote_to_stage: string;
  operator: string;
  reason: string;
}

export interface DemoteResponse {
  strategy_id: string;
  manifest_id: string;
  demoted_to_stage: string;
  operator: string;
  demoted_at: string;
  event_emitted: string;
}

export interface OverrideRequest {
  override_stage: string;
  operator: string;
  reason: string;
  risk_ack: boolean;
}

export interface OverrideResponse {
  strategy_id: string;
  manifest_id: string;
  override_stage: string;
  operator: string;
  overridden_at: string;
  event_emitted: string;
}

export async function demoteCandidate(
  strategyId: string,
  manifestId: string,
  request: DemoteRequest,
  token: string | null,
): Promise<DemoteResponse> {
  return apiFetch(`/api/promote/${encodeURIComponent(strategyId)}/${encodeURIComponent(manifestId)}/demote`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }) as Promise<DemoteResponse>;
}

export async function overrideCandidate(
  strategyId: string,
  manifestId: string,
  request: OverrideRequest,
  token: string | null,
): Promise<OverrideResponse> {
  return apiFetch(`/api/promote/${encodeURIComponent(strategyId)}/${encodeURIComponent(manifestId)}/override`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }) as Promise<OverrideResponse>;
}

export async function fetchStrategyRuns(
  strategyId: string,
  mode: "batch" | "paper" | "live",
  token: string | null,
): Promise<StrategyRunsResponse> {
  return apiFetch(
    `/api/strategy/${encodeURIComponent(strategyId)}/runs?mode=${mode}`,
    token,
  ) as Promise<StrategyRunsResponse>;
}
