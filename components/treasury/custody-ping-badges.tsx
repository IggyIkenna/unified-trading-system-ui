"use client";

/**
 * CustodyPingBadge / CustodyPingBadges — status badges per custody source.
 *
 * Shows visual status indicator for each TreasurySource ping:
 *   OK          → green dot + source name
 *   DEGRADED    → amber dot + "slow" label
 *   UNREACHABLE → red dot + "unreachable" label
 *   UNKNOWN     → grey dot + "unknown" label
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.C.
 */

import * as React from "react";
import type { TreasurySource, CustodyPingStatus } from "@/lib/api/treasury-client";

// ─── Source display name map ──────────────────────────────────────────────────

const SOURCE_LABEL: Record<TreasurySource, string> = {
  COPPER: "Copper",
  CEFFU: "CEFFU",
  DEFI_HOT_WALLET: "DeFi Wallet",
  SUB_ACCOUNT_BINANCE: "Binance",
  SUB_ACCOUNT_BYBIT: "Bybit",
  SUB_ACCOUNT_OKX: "OKX",
  SUB_ACCOUNT_DERIBIT: "Deribit",
  SUB_ACCOUNT_KRAKEN: "Kraken",
  SUB_ACCOUNT_HYPERLIQUID: "Hyperliquid",
  SUB_ACCOUNT_ASTER: "Aster",
};

// ─── Status colour + label ────────────────────────────────────────────────────

interface StatusMeta {
  readonly dotClass: string;
  readonly label: string;
}

function getStatusMeta(status: CustodyPingStatus): StatusMeta {
  switch (status) {
    case "OK":
      return { dotClass: "bg-emerald-400", label: "OK" };
    case "DEGRADED":
      return { dotClass: "bg-amber-400", label: "slow" };
    case "UNREACHABLE":
      return { dotClass: "bg-red-500", label: "unreachable" };
    default:
      return { dotClass: "bg-muted-foreground", label: "unknown" };
  }
}

// ─── Single badge ─────────────────────────────────────────────────────────────

interface CustodyPingBadgeProps {
  readonly source: TreasurySource;
  readonly status: CustodyPingStatus;
  readonly latencyMs?: number | null;
}

export function CustodyPingBadge({ source, status, latencyMs }: CustodyPingBadgeProps) {
  const meta = getStatusMeta(status);
  const label = SOURCE_LABEL[source] ?? source;
  return (
    <div
      className="flex items-center gap-1.5"
      data-testid={`custody-ping-badge-${source.toLowerCase()}`}
      data-status={status}
    >
      <span
        className={`inline-block size-2 rounded-full shrink-0 ${meta.dotClass}`}
        aria-label={`${label} status: ${meta.label}`}
      />
      <span className="text-sm font-medium">{label}</span>
      {status !== "OK" && (
        <span className="text-xs text-muted-foreground">({meta.label})</span>
      )}
      {status === "DEGRADED" && latencyMs !== null && latencyMs !== undefined && (
        <span className="text-xs text-amber-400">{latencyMs}ms</span>
      )}
    </div>
  );
}

// ─── Multi-source badge grid ──────────────────────────────────────────────────

interface SourceWithPing {
  readonly source: TreasurySource;
  readonly ping_status: CustodyPingStatus;
  readonly ping_latency_ms?: number | null;
}

interface CustodyPingBadgesProps {
  readonly sources: readonly SourceWithPing[];
}

export function CustodyPingBadges({ sources }: CustodyPingBadgesProps) {
  return (
    <div
      className="flex flex-wrap gap-3"
      data-testid="custody-ping-badges"
    >
      {sources.map((s) => (
        <CustodyPingBadge
          key={s.source}
          source={s.source}
          status={s.ping_status}
          latencyMs={s.ping_latency_ms}
        />
      ))}
    </div>
  );
}
