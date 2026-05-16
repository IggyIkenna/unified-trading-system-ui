"use client";

/**
 * ClientTreasuryCard — per-client treasury attribution view.
 *
 * Renders NAV + custody source attribution from GET /api/clients/{id}/treasury.
 * Shows per-source allocation + custody ping status.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.C.
 */

import * as React from "react";
import { Wallet, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustodyPingBadge } from "@/components/treasury/custody-ping-badges";
import type { ClientTreasuryView, TreasurySourceAttribution } from "@/lib/api/treasury-client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUsd(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Attribution row ──────────────────────────────────────────────────────────

function AttributionRow({ attr }: { readonly attr: TreasurySourceAttribution }) {
  return (
    <div
      className="flex items-center justify-between py-2 border-b border-border last:border-0"
      data-testid={`attribution-row-${attr.source.toLowerCase()}`}
    >
      <CustodyPingBadge source={attr.source} status={attr.ping_status} />
      <div className="text-right">
        <p className="text-sm font-mono font-medium">{formatUsd(attr.client_share_usd)}</p>
        <p className="text-xs text-muted-foreground">{attr.allocation_pct}%</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ClientTreasuryCardProps {
  readonly clientId: string;
  readonly data: ClientTreasuryView | null;
  readonly loading: boolean;
  readonly error: string | null;
}

export function ClientTreasuryCard({ clientId, data, loading, error }: ClientTreasuryCardProps) {
  return (
    <Card data-testid="client-treasury-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wallet className="size-4 text-primary" />
          Treasury — {clientId}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div
            className="flex items-center gap-2 text-sm text-[var(--pnl-negative)]"
            data-testid="client-treasury-error"
          >
            <AlertTriangle className="size-4 shrink-0" />
            {error}
          </div>
        ) : loading || !data ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <>
            {/* NAV summary */}
            <div className="mb-4" data-testid="client-treasury-nav">
              <p className="text-2xl font-semibold font-mono">{formatUsd(data.nav_usd)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Client NAV · as of {formatTs(data.as_of)}
              </p>
              {data.hwm_nav_usd && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  HWM: {formatUsd(data.hwm_nav_usd)}
                  {data.last_crystallization_at
                    ? ` · last crystallized ${formatTs(data.last_crystallization_at)}`
                    : ""}
                </p>
              )}
            </div>

            {/* Source attribution */}
            <div className="mb-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Source Attribution</p>
              <div data-testid="client-treasury-attribution-list">
                {data.source_attribution.map((attr) => (
                  <AttributionRow key={attr.source} attr={attr} />
                ))}
              </div>
            </div>

            {/* Pending withdrawals summary */}
            {data.pending_withdrawals.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Pending Withdrawals ({data.pending_withdrawals.length})
                </p>
                {data.pending_withdrawals.map((w) => (
                  <div
                    key={w.request_id}
                    className="flex items-center justify-between text-xs py-1"
                    data-testid={`pending-withdrawal-${w.request_id}`}
                  >
                    <span className="text-muted-foreground">
                      {w.source} → {w.destination.slice(0, 16)}…
                    </span>
                    <span className="font-mono">{formatUsd(w.amount_usd)}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
