/**
 * Client for the Plan C performance-series endpoint.
 *
 * Backed by `unified-trading-api`
 * `GET /api/v1/strategy-instances/{id}/performance` — see
 * `unified-trading-pm/codex/09-strategy/architecture-v2/performance-overlay.md`
 * for the contract.
 */

import { apiFetch } from "@/lib/api/fetch";

export type PerformanceView = "backtest" | "paper" | "live";

export interface PerformanceSeriesPoint {
  readonly t: string;
  readonly pnl: number;
  readonly equity: number;
}

export interface PerformancePerViewSeries {
  readonly aggregate: readonly PerformanceSeriesPoint[];
  readonly per_venue?: Readonly<Record<string, readonly PerformanceSeriesPoint[]>> | null;
}

export interface PerformanceTransitionMarkers {
  readonly paper_started_at: string | null;
  readonly live_started_at: string | null;
}

export interface PerformancePhaseAnnotation {
  readonly phase: string;
  readonly at: string;
}

export interface PerformanceSeriesResponse {
  readonly instance_id: string;
  readonly series: Readonly<Partial<Record<PerformanceView, PerformancePerViewSeries>>>;
  readonly transition_markers: PerformanceTransitionMarkers;
  readonly phase_annotations: readonly PerformancePhaseAnnotation[];
}

export interface PerformanceQueryParams {
  readonly views: readonly PerformanceView[];
  readonly from?: string;
  readonly to?: string;
  readonly perVenue?: boolean;
}

/** UI gateway path; Next.js rewrite proxies to UTA. */
const UTA_BASE = process.env.NEXT_PUBLIC_UTA_BASE_URL || "/api/uta";
const UI_GATEWAY_PREFIX = `${UTA_BASE}/v1/strategy-instances`;

export function buildPerformanceUrl(instanceId: string, params: PerformanceQueryParams): string {
  const search = new URLSearchParams({
    views: params.views.join(","),
  });
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.perVenue) search.set("per_venue", "true");
  return `${UI_GATEWAY_PREFIX}/${encodeURIComponent(instanceId)}/performance?${search.toString()}`;
}

export async function fetchPerformanceSeries(
  instanceId: string,
  params: PerformanceQueryParams,
  token: string | null,
): Promise<PerformanceSeriesResponse> {
  const url = buildPerformanceUrl(instanceId, params);
  const raw = await apiFetch(url, token);
  return raw as PerformanceSeriesResponse;
}
