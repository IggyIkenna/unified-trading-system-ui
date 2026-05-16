/**
 * Deterministic mock fixtures for the Treasury API client.
 *
 * Used when NEXT_PUBLIC_MOCK_API=true (CI, Playwright, local dev without backends).
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.C + 6.D.
 */

import type {
  TreasuryRollupResponse,
  TreasuryNAVByClient,
  ClientTreasuryView,
  ClientSubscriptionList,
  WithdrawalRequest,
  WithdrawalRequestResponse,
} from "@/lib/api/treasury-client";

// ─── Rollup mock ──────────────────────────────────────────────────────────────

export function mockGetTreasuryRollup(): TreasuryRollupResponse {
  return {
    total_nav_usd: "12750000.00",
    as_of: "2026-05-13T10:00:00Z",
    reconciliation_ok: true,
    sources: [
      {
        source: "COPPER",
        balance_usd: "3200000.00",
        as_of: "2026-05-13T09:58:00Z",
        ping_status: "OK",
        ping_latency_ms: 42,
      },
      {
        source: "CEFFU",
        balance_usd: "4100000.00",
        as_of: "2026-05-13T09:57:00Z",
        ping_status: "OK",
        ping_latency_ms: 67,
      },
      {
        source: "DEFI_HOT_WALLET",
        balance_usd: "2650000.00",
        as_of: "2026-05-13T10:00:00Z",
        ping_status: "OK",
        ping_latency_ms: 12,
      },
      {
        source: "SUB_ACCOUNT_BYBIT",
        balance_usd: "1450000.00",
        as_of: "2026-05-13T09:59:00Z",
        ping_status: "OK",
        ping_latency_ms: 55,
      },
      {
        source: "SUB_ACCOUNT_OKX",
        balance_usd: "850000.00",
        as_of: "2026-05-13T09:59:30Z",
        ping_status: "DEGRADED",
        ping_latency_ms: 980,
      },
      {
        source: "SUB_ACCOUNT_DERIBIT",
        balance_usd: "500000.00",
        as_of: "2026-05-13T10:00:00Z",
        ping_status: "OK",
        ping_latency_ms: 34,
      },
    ],
  };
}

// ─── Client NAV mock ──────────────────────────────────────────────────────────

const CLIENT_NAV_MAP: Record<string, string> = {
  "demo-client-001": "12750000.00",
  "client-full": "5000000.00",
};

export function mockGetClientNav(clientId: string): TreasuryNAVByClient {
  return {
    client_id: clientId,
    nav_usd: CLIENT_NAV_MAP[clientId] ?? "1000000.00",
    as_of: "2026-05-13T10:00:00Z",
    allocated_pct: "100.00",
  };
}

// ─── Client treasury view mock ────────────────────────────────────────────────

export function mockGetClientTreasury(clientId: string): ClientTreasuryView {
  const nav = CLIENT_NAV_MAP[clientId] ?? "1000000.00";
  return {
    client_id: clientId,
    nav_usd: nav,
    as_of: "2026-05-13T10:00:00Z",
    hwm_nav_usd: "12900000.00",
    last_crystallization_at: "2026-05-12T00:00:00Z",
    source_attribution: [
      {
        source: "COPPER",
        balance_usd: "3200000.00",
        client_share_usd: "3200000.00",
        allocation_pct: "25.10",
        ping_status: "OK",
      },
      {
        source: "CEFFU",
        balance_usd: "4100000.00",
        client_share_usd: "4100000.00",
        allocation_pct: "32.16",
        ping_status: "OK",
      },
      {
        source: "DEFI_HOT_WALLET",
        balance_usd: "2650000.00",
        client_share_usd: "2650000.00",
        allocation_pct: "20.78",
        ping_status: "OK",
      },
      {
        source: "SUB_ACCOUNT_BYBIT",
        balance_usd: "1450000.00",
        client_share_usd: "1450000.00",
        allocation_pct: "11.37",
        ping_status: "OK",
      },
      {
        source: "SUB_ACCOUNT_OKX",
        balance_usd: "850000.00",
        client_share_usd: "850000.00",
        allocation_pct: "6.67",
        ping_status: "DEGRADED",
      },
      {
        source: "SUB_ACCOUNT_DERIBIT",
        balance_usd: "500000.00",
        client_share_usd: "500000.00",
        allocation_pct: "3.92",
        ping_status: "OK",
      },
    ],
    pending_withdrawals: [
      {
        request_id: "wr-001",
        source: "COPPER",
        amount_usd: "200000.00",
        requested_at: "2026-05-13T08:30:00Z",
        status: "APPROVED",
        destination: "client-cold-wallet-0xabc",
      },
    ],
    recent_trades: [
      {
        trade_id: "trd-001",
        archetype_id: "carry_staked_basis",
        settled_at: "2026-05-13T07:45:00Z",
        gross_pnl_usd: "4200.00",
        net_pnl_usd: "3950.00",
        fee_usd: "250.00",
        side: "buy",
        venue: "BYBIT",
        instrument: "ETH-USDT-PERP",
      },
      {
        trade_id: "trd-002",
        archetype_id: "arbitrage_price_dispersion",
        settled_at: "2026-05-13T06:15:00Z",
        gross_pnl_usd: "-1100.00",
        net_pnl_usd: "-1245.00",
        fee_usd: "145.00",
        side: "sell",
        venue: "OKX",
        instrument: "BTC-USDC-PERP",
      },
      {
        trade_id: "trd-003",
        archetype_id: "carry_staked_basis",
        settled_at: "2026-05-12T22:30:00Z",
        gross_pnl_usd: "7800.00",
        net_pnl_usd: "7420.00",
        fee_usd: "380.00",
        side: "buy",
        venue: "DERIBIT",
        instrument: "ETH-0628-C",
      },
    ],
  };
}

// ─── Client subscriptions mock ────────────────────────────────────────────────

export function mockGetClientSubscriptions(clientId: string): ClientSubscriptionList {
  return {
    client_id: clientId,
    active_count: 2,
    total_active_allocation_pct: "100.00",
    subscriptions: [
      {
        subscription_id: "sub-001",
        client_id: clientId,
        archetype_id: "carry_staked_basis",
        share_class_id: "class-a-carry",
        allocation_pct: "60.00",
        subscribed_at: "2026-05-10T09:00:00Z",
        crystallization_cadence: "MONTHLY",
        perf_fee_rate: "0.20",
        status: "ACTIVE",
      },
      {
        subscription_id: "sub-002",
        client_id: clientId,
        archetype_id: "arbitrage_price_dispersion",
        share_class_id: "class-b-arb",
        allocation_pct: "40.00",
        subscribed_at: "2026-05-10T09:00:00Z",
        crystallization_cadence: "QUARTERLY",
        perf_fee_rate: "0.15",
        status: "ACTIVE",
      },
    ],
  };
}

// ─── Withdrawal request mock ──────────────────────────────────────────────────

let _withdrawalCounter = 0;

export function mockRequestWithdrawal(
  _clientId: string,
  _req: WithdrawalRequest,
): WithdrawalRequestResponse {
  _withdrawalCounter += 1;
  return {
    request_id: `wr-mock-${String(_withdrawalCounter).padStart(3, "0")}`,
    status: "REQUESTED",
    requested_at: new Date().toISOString(),
  };
}
