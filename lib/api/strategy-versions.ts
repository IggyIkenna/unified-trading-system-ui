/**
 * Plan D — typed client for the UTA strategy-version governance endpoints.
 *
 * UTA endpoints:
 *   POST /api/v1/strategy-versions/{vid}/request-approval
 *   POST /api/v1/strategy-versions/{vid}/approve
 *   POST /api/v1/strategy-versions/{vid}/reject
 *   POST /api/v1/strategy-versions/{vid}/rollout
 *
 * SSOT: plans/active/dart_exclusive_subscription_research_fork_2026_04_21.plan.md
 */

const UTA_BASE = process.env.NEXT_PUBLIC_UTA_BASE_URL || "/api/uta";

export type VersionStatus = "draft" | "pending_approval" | "approved" | "rolled_out" | "retired" | "rejected";

export type StrategyMaturityPhase =
  | "smoke"
  | "backtest_minimal"
  | "backtest_1yr"
  | "backtest_multi_year"
  | "paper_1d"
  | "paper_14d"
  | "paper_stable"
  | "live_early"
  | "live_stable"
  | "retired";

export interface VersionRecord {
  readonly version_id: string;
  readonly parent_instance_id: string;
  readonly parent_version_id: string | null;
  readonly maturity_phase: string;
  readonly status: VersionStatus;
  readonly authored_by: string;
}

export class ApprovalBelowFloorError extends Error {
  status = 412 as const;
  constructor(message: string) {
    super(message);
    this.name = "ApprovalBelowFloorError";
  }
}

async function postJson(path: string, body: object, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(`${UTA_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

export async function requestApproval(versionId: string, authToken?: string): Promise<VersionRecord> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await postJson(
    `/api/v1/strategy-versions/${encodeURIComponent(versionId)}/request-approval`,
    {},
    headers,
  );
  if (!response.ok) {
    throw new Error(`request-approval ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as VersionRecord;
}

export async function approveVersion(args: {
  versionId: string;
  approvedBy: string;
  backtestSeriesRef: string;
  backtestMaturity: StrategyMaturityPhase;
  reviewNotes?: string;
  authToken?: string;
}): Promise<VersionRecord> {
  const headers: Record<string, string> = {};
  if (args.authToken) headers.Authorization = `Bearer ${args.authToken}`;
  const response = await postJson(
    `/api/v1/strategy-versions/${encodeURIComponent(args.versionId)}/approve`,
    {
      approved_by: args.approvedBy,
      backtest_series_ref: args.backtestSeriesRef,
      backtest_maturity: args.backtestMaturity,
      review_notes: args.reviewNotes,
    },
    headers,
  );
  if (response.status === 412) {
    const body = (await response.json()) as { detail?: string };
    throw new ApprovalBelowFloorError(body.detail ?? "below BACKTEST_1YR floor");
  }
  if (!response.ok) {
    throw new Error(`approve ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as VersionRecord;
}

export async function rejectVersion(args: {
  versionId: string;
  rejectedBy: string;
  rejectionReason: string;
  authToken?: string;
}): Promise<VersionRecord> {
  const headers: Record<string, string> = {};
  if (args.authToken) headers.Authorization = `Bearer ${args.authToken}`;
  const response = await postJson(
    `/api/v1/strategy-versions/${encodeURIComponent(args.versionId)}/reject`,
    { rejected_by: args.rejectedBy, rejection_reason: args.rejectionReason },
    headers,
  );
  if (!response.ok) {
    throw new Error(`reject ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as VersionRecord;
}

export async function rolloutVersion(versionId: string, authToken?: string): Promise<VersionRecord> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await postJson(`/api/v1/strategy-versions/${encodeURIComponent(versionId)}/rollout`, {}, headers);
  if (!response.ok) {
    throw new Error(`rollout ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as VersionRecord;
}
