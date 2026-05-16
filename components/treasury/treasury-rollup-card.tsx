"use client";

/**
 * TreasuryRollupCard — multi-source NAV breakdown widget.
 *
 * Displays total NAV + per-source balance breakdown from GET /api/treasury/rollup.
 * Uses CustodyPingBadges for per-source status.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.C.
 */

import * as React from "react";
import { Building2, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustodyPingBadge } from "@/components/treasury/custody-ping-badges";
import type { TreasuryRollupResponse, TreasurySourceBalance } from "@/lib/api/treasury-client";

interface TreasuryRollupCardProps {
  readonly data: TreasuryRollupResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

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

function SourceRow({ source }: { readonly source: TreasurySourceBalance }) {
  return (
    <div
      className="flex items-center justify-between py-2 border-b border-border last:border-0"
      data-testid={`treasury-source-row-${source.source.toLowerCase()}`}
    >
      <div className="flex items-center gap-2">
        <CustodyPingBadge source={source.source} status={source.ping_status} latencyMs={source.ping_latency_ms} />
      </div>
      <div className="text-right">
        <p className="text-sm font-mono font-medium">{formatUsd(source.balance_usd)}</p>
        {source.ping_latency_ms !== null && (
          <p className="text-xs text-muted-foreground">{source.ping_latency_ms}ms</p>
        )}
      </div>
    </div>
  );
}

export function TreasuryRollupCard({ data, loading, error }: TreasuryRollupCardProps) {
  return (
    <Card data-testid="treasury-rollup-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          Multi-source NAV Rollup
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div
            className="flex items-center gap-2 text-sm text-[var(--pnl-negative)]"
            data-testid="treasury-rollup-error"
          >
            <AlertTriangle className="size-4 shrink-0" />
            {error}
          </div>
        ) : loading || !data ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <>
            <div className="mb-4" data-testid="treasury-rollup-total-nav">
              <p className="text-2xl font-semibold font-mono">
                {formatUsd(data.total_nav_usd)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  Total NAV · as of{" "}
                  {new Date(data.as_of).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })}
                </p>
                {data.reconciliation_ok ? (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400"
                    data-testid="treasury-reconciliation-ok"
                  >
                    reconciled
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)]"
                    data-testid="treasury-reconciliation-warn"
                  >
                    recon drift
                  </span>
                )}
              </div>
            </div>
            <div
              className="space-y-0"
              data-testid="treasury-source-list"
            >
              {data.sources.map((source) => (
                <SourceRow key={source.source} source={source} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
