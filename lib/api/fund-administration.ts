/**
 * Typed REST client for fund-administration-service.
 *
 * Mirror of the UAC `fund_administration` domain contract
 * (`unified_api_contracts.fund_administration`). Types are field-for-field
 * analogues of the Python pydantic models — `Decimal` ↔ `string` on the wire
 * (JSON), AwareDatetime ↔ ISO-8601 string.
 *
 * When `NEXT_PUBLIC_MOCK_API=true` every method returns deterministic
 * fixtures from `@/lib/mocks/fund-administration` instead of making HTTP
 * calls. The single service endpoint is configured via
 * `NEXT_PUBLIC_FUND_ADMIN_API_URL` (default `http://localhost:8031`).
 */

import { isMockDataMode } from "@/lib/runtime/data-mode";
import {
  mockApproveRedemption,
  mockApproveSubscription,
  mockCreateRedemption,
  mockCreateSubscription,
  mockGetNavHistory,
  mockGetRedemption,
  mockGetSubscription,
  mockListAllocations,
  mockListRedemptions,
  mockListSubscriptions,
  mockProcessRedemption,
  mockRebalanceAllocations,
  mockRejectRedemption,
  mockRejectSubscription,
  mockSettleRedemption,
  mockSettleSubscription,
} from "@/lib/mocks/fund-administration";

const FUND_ADMIN_API =
  process.env.NEXT_PUBLIC_FUND_ADMIN_API_URL || "http://localhost:8031";

// ---------------------------------------------------------------------------
// Enum types — string-literal unions mirroring the Python StrEnums in UAC.
// ---------------------------------------------------------------------------

export type SubscriptionStatus = "PENDING" | "APPROVED" | "REJECTED" | "SETTLED";

export type RedemptionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSED"
  | "SETTLED";

export type AllocationExecutionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

// ---------------------------------------------------------------------------
// Domain types — mirror `AllocatorSubscription`, `AllocatorRedemption`,
// `FundAllocation` from `unified_api_contracts.fund_administration`.
// Decimals are carried as strings on the wire to preserve precision.
// ---------------------------------------------------------------------------

export interface AllocatorSubscription {
  subscription_id: string;
  fund_id: string;
  allocator_id: string;
  share_class: string;
  requested_amount_usd: string;
  requested_timestamp: string;
  status: SubscriptionStatus;
  nav_strike_snapshot_id: string | null;
  units_issued: string | null;
  approval_timestamp: string | null;
  rejection_reason: string | null;
}

export interface AllocatorRedemption {
  redemption_id: string;
  fund_id: string;
  allocator_id: string;
  share_class: string;
  units_to_redeem: string;
  destination: string;
  requested_timestamp: string;
  status: RedemptionStatus;
  grace_period_days: number;
  redemption_nav_snapshot_id: string | null;
  cash_amount_due_usd: string | null;
  settlement_timestamp: string | null;
  settlement_reference: string | null;
  rejection_reason: string | null;
}

export interface FundAllocation {
  allocation_id: string;
  fund_id: string;
  share_class: string;
  strategy_id: string;
  target_amount_usd: string;
  allocation_timestamp: string;
  execution_status: AllocationExecutionStatus;
  executed_amount_usd: string | null;
  executed_timestamp: string | null;
}

/**
 * Minimal NAV snapshot shape needed by the UI history page. Full FundNAVSnapshot
 * carries many more fields — we only project the ones the table renders, so the
 * service can hydrate from its richer internal model without breaking the UI.
 */
export interface NavSnapshot {
  snapshot_id: string;
  fund_id: string;
  share_class: string;
  snapshot_timestamp: string;
  nav_usd: string;
  nav_change_usd: string | null;
  nav_change_pct: string | null;
}

// ---------------------------------------------------------------------------
// Request DTOs — mirror `api_requests.py` in UAC.
// ---------------------------------------------------------------------------

export interface SubscribeRequest {
  subscription_id: string;
  fund_id: string;
  allocator_id: string;
  share_class: string;
  requested_amount_usd: string;
}

export interface RedeemRequest {
  redemption_id: string;
  fund_id: string;
  allocator_id: string;
  share_class: string;
  units_to_redeem: string;
  destination: string;
  grace_period_days: number | null;
}

export interface ApproveSubscriptionRequest {
  nav_per_unit: string;
}

export interface ProcessRedemptionRequest {
  settlement_nav: string;
  settlement_reference: string;
}

export interface RejectRequest {
  reason: string;
}

export interface RebalanceTarget {
  allocation_id: string;
  strategy_id: string;
  target_amount_usd: string;
  venue: string;
  from_wallet: string;
  to_wallet: string;
  token: string;
}

export interface RebalanceRequest {
  share_class: string;
  targets: RebalanceTarget[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function jsonHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { detail?: string };
      detail = body?.detail ? ` — ${body.detail}` : "";
    } catch {
      /* ignore body parse errors */
    }
    throw new Error(`fund-administration-service HTTP ${res.status}${detail}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Public client
// ---------------------------------------------------------------------------

export interface FundAdminClientOptions {
  /** Bearer token. Optional — mock mode and local dev don't require one. */
  token?: string;
  /** Override the base URL (defaults to NEXT_PUBLIC_FUND_ADMIN_API_URL). */
  baseUrl?: string;
}

const defaultOptions: FundAdminClientOptions = {};

// --- Subscriptions ---------------------------------------------------------

export async function createSubscription(
  req: SubscribeRequest,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorSubscription> {
  if (isMockDataMode()) return mockCreateSubscription(req);
  const res = await fetch(`${opts.baseUrl ?? FUND_ADMIN_API}/subscriptions`, {
    method: "POST",
    headers: jsonHeaders(opts.token),
    body: JSON.stringify(req),
  });
  return parseJsonOrThrow<AllocatorSubscription>(res);
}

export async function getSubscription(
  id: string,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorSubscription> {
  if (isMockDataMode()) return mockGetSubscription(id);
  const res = await fetch(`${opts.baseUrl ?? FUND_ADMIN_API}/subscriptions/${id}`, {
    headers: jsonHeaders(opts.token),
  });
  return parseJsonOrThrow<AllocatorSubscription>(res);
}

export async function approveSubscription(
  id: string,
  req: ApproveSubscriptionRequest,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorSubscription> {
  if (isMockDataMode()) return mockApproveSubscription(id, req);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/subscriptions/${id}/approve`,
    {
      method: "POST",
      headers: jsonHeaders(opts.token),
      body: JSON.stringify(req),
    },
  );
  return parseJsonOrThrow<AllocatorSubscription>(res);
}

export async function rejectSubscription(
  id: string,
  req: RejectRequest,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorSubscription> {
  if (isMockDataMode()) return mockRejectSubscription(id, req);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/subscriptions/${id}/reject`,
    {
      method: "POST",
      headers: jsonHeaders(opts.token),
      body: JSON.stringify(req),
    },
  );
  return parseJsonOrThrow<AllocatorSubscription>(res);
}

export async function settleSubscription(
  id: string,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorSubscription> {
  if (isMockDataMode()) return mockSettleSubscription(id);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/subscriptions/${id}/settle`,
    {
      method: "POST",
      headers: jsonHeaders(opts.token),
    },
  );
  return parseJsonOrThrow<AllocatorSubscription>(res);
}

/**
 * List subscriptions. The REST surface is single-record today, so the UI
 * pages rely on the mock fixtures to drive the list view. When the service
 * grows a real list endpoint the live branch will use it; for now we throw
 * in non-mock mode so dev errors are loud (fail-fast per citadel rules —
 * no silent fallbacks).
 */
export async function listSubscriptions(
  _opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorSubscription[]> {
  if (isMockDataMode()) return mockListSubscriptions();
  throw new Error(
    "fund-administration-service: list-subscriptions is not yet exposed; enable VITE_MOCK_API=true for the UI list view.",
  );
}

// --- Redemptions -----------------------------------------------------------

export async function createRedemption(
  req: RedeemRequest,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorRedemption> {
  if (isMockDataMode()) return mockCreateRedemption(req);
  const res = await fetch(`${opts.baseUrl ?? FUND_ADMIN_API}/redemptions`, {
    method: "POST",
    headers: jsonHeaders(opts.token),
    body: JSON.stringify(req),
  });
  return parseJsonOrThrow<AllocatorRedemption>(res);
}

export async function getRedemption(
  id: string,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorRedemption> {
  if (isMockDataMode()) return mockGetRedemption(id);
  const res = await fetch(`${opts.baseUrl ?? FUND_ADMIN_API}/redemptions/${id}`, {
    headers: jsonHeaders(opts.token),
  });
  return parseJsonOrThrow<AllocatorRedemption>(res);
}

export async function approveRedemption(
  id: string,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorRedemption> {
  if (isMockDataMode()) return mockApproveRedemption(id);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/redemptions/${id}/approve`,
    {
      method: "POST",
      headers: jsonHeaders(opts.token),
    },
  );
  return parseJsonOrThrow<AllocatorRedemption>(res);
}

export async function rejectRedemption(
  id: string,
  req: RejectRequest,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorRedemption> {
  if (isMockDataMode()) return mockRejectRedemption(id, req);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/redemptions/${id}/reject`,
    {
      method: "POST",
      headers: jsonHeaders(opts.token),
      body: JSON.stringify(req),
    },
  );
  return parseJsonOrThrow<AllocatorRedemption>(res);
}

export async function processRedemption(
  id: string,
  req: ProcessRedemptionRequest,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorRedemption> {
  if (isMockDataMode()) return mockProcessRedemption(id, req);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/redemptions/${id}/process`,
    {
      method: "POST",
      headers: jsonHeaders(opts.token),
      body: JSON.stringify(req),
    },
  );
  return parseJsonOrThrow<AllocatorRedemption>(res);
}

export async function settleRedemption(
  id: string,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorRedemption> {
  if (isMockDataMode()) return mockSettleRedemption(id);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/redemptions/${id}/settle`,
    {
      method: "POST",
      headers: jsonHeaders(opts.token),
    },
  );
  return parseJsonOrThrow<AllocatorRedemption>(res);
}

export async function listRedemptions(
  _opts: FundAdminClientOptions = defaultOptions,
): Promise<AllocatorRedemption[]> {
  if (isMockDataMode()) return mockListRedemptions();
  throw new Error(
    "fund-administration-service: list-redemptions is not yet exposed; enable VITE_MOCK_API=true for the UI list view.",
  );
}

// --- Allocations -----------------------------------------------------------

export async function listAllocations(
  fund_id: string,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<FundAllocation[]> {
  if (isMockDataMode()) return mockListAllocations(fund_id);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/funds/${fund_id}/allocations`,
    {
      headers: jsonHeaders(opts.token),
    },
  );
  return parseJsonOrThrow<FundAllocation[]>(res);
}

export async function rebalanceAllocations(
  fund_id: string,
  req: RebalanceRequest,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<FundAllocation[]> {
  if (isMockDataMode()) return mockRebalanceAllocations(fund_id, req);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/funds/${fund_id}/allocations/rebalance`,
    {
      method: "POST",
      headers: jsonHeaders(opts.token),
      body: JSON.stringify(req),
    },
  );
  return parseJsonOrThrow<FundAllocation[]>(res);
}

// --- NAV history -----------------------------------------------------------

export async function getNavHistory(
  fund_id: string,
  share_class: string,
  opts: FundAdminClientOptions = defaultOptions,
): Promise<NavSnapshot[]> {
  if (isMockDataMode()) return mockGetNavHistory(fund_id, share_class);
  const res = await fetch(
    `${opts.baseUrl ?? FUND_ADMIN_API}/funds/${fund_id}/nav/history?share_class=${encodeURIComponent(share_class)}`,
    {
      headers: jsonHeaders(opts.token),
    },
  );
  // The service returns `{fund_id, share_class, history: [...]}` — project to
  // the flat array the UI consumes. When history is empty, return [].
  const body = await parseJsonOrThrow<{ history?: NavSnapshot[] }>(res);
  return body.history ?? [];
}
