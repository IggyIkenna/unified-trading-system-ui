/**
 * Treasury API client — typed wrappers around the 4 treasury backend endpoints.
 *
 * Endpoints:
 *   GET /api/treasury/rollup                    — canonical multi-source NAV rollup
 *   GET /treasury/nav?client_id=<id>            — per-client NAV
 *   GET /api/clients/{id}/treasury              — per-client attribution view
 *   GET /api/clients/{id}/subscriptions         — per-client share-class subscription list
 *   POST /api/clients/{id}/treasury/withdrawal  — request a withdrawal (stub)
 *
 * Mock mode: when NEXT_PUBLIC_MOCK_API=true all methods return fixtures from
 * @/lib/api/mocks/treasury instead of making HTTP calls.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.C + 6.D.
 *
 * UAC schemas: unified_api_contracts.internal.domain.treasury
 *   TreasurySourceAttribution / ClientTreasuryView / ClientShareClassSubscriptionView /
 *   ClientSubscriptionList / TreasurySourceBalance / TreasuryRollupResponse / TreasuryNAVByClient
 */

import { isMockDataMode } from "@/lib/runtime/data-mode";
import {
  mockGetTreasuryRollup,
  mockGetClientNav,
  mockGetClientTreasury,
  mockGetClientSubscriptions,
  mockRequestWithdrawal,
} from "@/lib/api/mocks/treasury";

// ─── Treasury source types ────────────────────────────────────────────────────

export type TreasurySource =
  | "COPPER"
  | "CEFFU"
  | "DEFI_HOT_WALLET"
  | "SUB_ACCOUNT_BINANCE"
  | "SUB_ACCOUNT_BYBIT"
  | "SUB_ACCOUNT_OKX"
  | "SUB_ACCOUNT_DERIBIT"
  | "SUB_ACCOUNT_KRAKEN"
  | "SUB_ACCOUNT_HYPERLIQUID"
  | "SUB_ACCOUNT_ASTER";

export type CustodyPingStatus = "OK" | "DEGRADED" | "UNREACHABLE" | "UNKNOWN";
export type CrystallizationCadence = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";
export type WithdrawalStatus =
  | "REQUESTED"
  | "APPROVED"
  | "EXECUTED"
  | "RECONCILED"
  | "COMPLETED"
  | "FAILED";

// ─── TreasurySourceBalance ────────────────────────────────────────────────────

export interface TreasurySourceBalance {
  readonly source: TreasurySource;
  readonly balance_usd: string;
  readonly as_of: string;
  readonly ping_status: CustodyPingStatus;
  readonly ping_latency_ms: number | null;
}

// ─── TreasuryRollupResponse ───────────────────────────────────────────────────

export interface TreasuryRollupResponse {
  readonly total_nav_usd: string;
  readonly as_of: string;
  readonly sources: readonly TreasurySourceBalance[];
  readonly reconciliation_ok: boolean;
}

// ─── TreasuryNAVByClient ──────────────────────────────────────────────────────

export interface TreasuryNAVByClient {
  readonly client_id: string;
  readonly nav_usd: string;
  readonly as_of: string;
  readonly allocated_pct: string;
}

// ─── TreasurySourceAttribution ────────────────────────────────────────────────

export interface TreasurySourceAttribution {
  readonly source: TreasurySource;
  readonly balance_usd: string;
  readonly client_share_usd: string;
  readonly allocation_pct: string;
  readonly ping_status: CustodyPingStatus;
}

// ─── ClientShareClassSubscriptionView ────────────────────────────────────────

export interface ClientShareClassSubscriptionView {
  readonly subscription_id: string;
  readonly client_id: string;
  readonly archetype_id: string;
  readonly share_class_id: string;
  readonly allocation_pct: string;
  readonly subscribed_at: string;
  readonly crystallization_cadence: CrystallizationCadence;
  readonly perf_fee_rate: string;
  readonly status: "ACTIVE" | "SUSPENDED" | "PENDING";
}

// ─── ClientSubscriptionList ───────────────────────────────────────────────────

export interface ClientSubscriptionList {
  readonly client_id: string;
  readonly subscriptions: readonly ClientShareClassSubscriptionView[];
  readonly active_count: number;
  readonly total_active_allocation_pct: string;
}

// ─── Post-trade history entries ───────────────────────────────────────────────

export interface PostTradeHistoryEntry {
  readonly trade_id: string;
  readonly archetype_id: string;
  readonly settled_at: string;
  readonly gross_pnl_usd: string;
  readonly net_pnl_usd: string;
  readonly fee_usd: string;
  readonly side: "buy" | "sell";
  readonly venue: string;
  readonly instrument: string;
}

// ─── ClientTreasuryView ───────────────────────────────────────────────────────

export interface ClientTreasuryView {
  readonly client_id: string;
  readonly nav_usd: string;
  readonly as_of: string;
  readonly source_attribution: readonly TreasurySourceAttribution[];
  readonly pending_withdrawals: readonly PendingWithdrawal[];
  readonly recent_trades: readonly PostTradeHistoryEntry[];
  readonly hwm_nav_usd: string | null;
  readonly last_crystallization_at: string | null;
}

// ─── Withdrawal types ─────────────────────────────────────────────────────────

export interface PendingWithdrawal {
  readonly request_id: string;
  readonly source: TreasurySource;
  readonly amount_usd: string;
  readonly requested_at: string;
  readonly status: WithdrawalStatus;
  readonly destination: string;
}

export interface WithdrawalRequest {
  readonly source: TreasurySource;
  readonly amount_usd: string;
  readonly destination: string;
  readonly idempotency_key: string;
}

export interface WithdrawalRequestResponse {
  readonly request_id: string;
  readonly status: WithdrawalStatus;
  readonly requested_at: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const DEPLOYMENT_API =
  process.env.NEXT_PUBLIC_DEPLOYMENT_API_URL || "http://localhost:8004";

function jsonHeaders(token?: string | null): HeadersInit {
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
    throw new Error(`treasury-api HTTP ${res.status}${detail}`);
  }
  return (await res.json()) as T;
}

// ─── Public client functions ──────────────────────────────────────────────────

/**
 * GET /api/treasury/rollup — canonical multi-source NAV.
 * Deployed by deployment-api@dc5c68a.
 */
export async function getTreasuryRollup(
  token?: string | null,
): Promise<TreasuryRollupResponse> {
  if (isMockDataMode()) return mockGetTreasuryRollup();
  const res = await fetch(`${DEPLOYMENT_API}/api/treasury/rollup`, {
    headers: jsonHeaders(token),
  });
  return parseJsonOrThrow<TreasuryRollupResponse>(res);
}

/**
 * GET /treasury/nav?client_id=<id> — per-client NAV.
 * Deployed by deployment-api@dc5c68a.
 */
export async function getClientNav(
  clientId: string,
  token?: string | null,
): Promise<TreasuryNAVByClient> {
  if (isMockDataMode()) return mockGetClientNav(clientId);
  const res = await fetch(
    `${DEPLOYMENT_API}/treasury/nav?client_id=${encodeURIComponent(clientId)}`,
    { headers: jsonHeaders(token) },
  );
  return parseJsonOrThrow<TreasuryNAVByClient>(res);
}

/**
 * GET /api/clients/{id}/treasury — per-client attribution view.
 * Deployed by deployment-api@b1aa800.
 */
export async function getClientTreasury(
  clientId: string,
  token?: string | null,
): Promise<ClientTreasuryView> {
  if (isMockDataMode()) return mockGetClientTreasury(clientId);
  const res = await fetch(
    `${DEPLOYMENT_API}/api/clients/${encodeURIComponent(clientId)}/treasury`,
    { headers: jsonHeaders(token) },
  );
  return parseJsonOrThrow<ClientTreasuryView>(res);
}

/**
 * GET /api/clients/{id}/subscriptions — per-client share-class subscription list.
 * Deployed by deployment-api@b1aa800.
 */
export async function getClientSubscriptions(
  clientId: string,
  token?: string | null,
): Promise<ClientSubscriptionList> {
  if (isMockDataMode()) return mockGetClientSubscriptions(clientId);
  const res = await fetch(
    `${DEPLOYMENT_API}/api/clients/${encodeURIComponent(clientId)}/subscriptions`,
    { headers: jsonHeaders(token) },
  );
  return parseJsonOrThrow<ClientSubscriptionList>(res);
}

/**
 * POST /api/clients/{id}/treasury/withdrawal — request a withdrawal.
 * Endpoint may be stubbed if not yet shipped; mock mode handles it cleanly.
 */
export async function requestWithdrawal(
  clientId: string,
  req: WithdrawalRequest,
  token?: string | null,
): Promise<WithdrawalRequestResponse> {
  if (isMockDataMode()) return mockRequestWithdrawal(clientId, req);
  const res = await fetch(
    `${DEPLOYMENT_API}/api/clients/${encodeURIComponent(clientId)}/treasury/withdrawal`,
    {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify(req),
    },
  );
  return parseJsonOrThrow<WithdrawalRequestResponse>(res);
}
