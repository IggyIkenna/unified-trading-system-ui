"use client";

/**
 * Per-client treasury deep-dive page.
 *
 * Renders:
 *   - ClientTreasuryCard  — NAV + source attribution + pending withdrawals
 *   - SubscriptionsList   — share-class subscriptions + allocations
 *   - CustodyPingBadges   — live status summary row
 *   - Post-trade history  — recent settled trades
 *   - WithdrawalRequestButton — opens modal to request withdrawal
 *
 * Data: GET /api/clients/{id}/treasury + GET /api/clients/{id}/subscriptions
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.C.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ArrowUpDown } from "lucide-react";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientTreasuryCard } from "@/components/treasury/client-treasury-card";
import { SubscriptionsList } from "@/components/treasury/subscriptions-list";
import { CustodyPingBadges } from "@/components/treasury/custody-ping-badges";
import { WithdrawalRequestButton } from "@/components/treasury/withdrawal-request-button";
import {
  getClientTreasury,
  getClientSubscriptions,
} from "@/lib/api/treasury-client";
import type {
  ClientTreasuryView,
  ClientSubscriptionList,
  PostTradeHistoryEntry,
} from "@/lib/api/treasury-client";

// ─── Post-trade history table ─────────────────────────────────────────────────

function formatUsd(v: string): string {
  const n = parseFloat(v);
  if (isNaN(n)) return "—";
  const prefix = n >= 0 ? "" : "";
  return prefix + new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TradeRow({ trade }: { readonly trade: PostTradeHistoryEntry }) {
  const pnlNum = parseFloat(trade.net_pnl_usd);
  const pnlClass = pnlNum >= 0 ? "text-emerald-400" : "text-[var(--pnl-negative)]";
  return (
    <tr
      className="border-b border-border last:border-0"
      data-testid={`trade-row-${trade.trade_id}`}
    >
      <td className="py-2 pr-4 text-xs text-muted-foreground">{formatTs(trade.settled_at)}</td>
      <td className="py-2 pr-4 text-xs font-medium">{trade.archetype_id.replace(/_/g, " ")}</td>
      <td className="py-2 pr-4 text-xs">{trade.venue}</td>
      <td className="py-2 pr-4 text-xs font-mono">{trade.instrument}</td>
      <td className={`py-2 text-xs font-mono font-medium text-right ${pnlClass}`}>
        {formatUsd(trade.net_pnl_usd)}
      </td>
    </tr>
  );
}

function PostTradeHistory({ trades, loading }: { readonly trades: readonly PostTradeHistoryEntry[]; readonly loading: boolean }) {
  return (
    <Card data-testid="post-trade-history-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowUpDown className="size-4 text-primary" />
          Post-Trade History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : trades.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="post-trade-empty">
            No recent settled trades.
          </p>
        ) : (
          <table className="w-full" data-testid="post-trade-table">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase">
                <th className="pb-2 text-left font-medium">Settled</th>
                <th className="pb-2 text-left font-medium">Archetype</th>
                <th className="pb-2 text-left font-medium">Venue</th>
                <th className="pb-2 text-left font-medium">Instrument</th>
                <th className="pb-2 text-right font-medium">Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <TradeRow key={t.trade_id} trade={t} />
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientTreasuryPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId ?? "demo-client-001";

  const [treasury, setTreasury] = React.useState<ClientTreasuryView | null>(null);
  const [treasuryError, setTreasuryError] = React.useState<string | null>(null);
  const treasuryLoading = treasury === null && treasuryError === null;

  const [subscriptions, setSubscriptions] = React.useState<ClientSubscriptionList | null>(null);
  const [subsError, setSubsError] = React.useState<string | null>(null);
  const subsLoading = subscriptions === null && subsError === null;

  React.useEffect(() => {
    let cancelled = false;

    getClientTreasury(clientId)
      .then((data) => {
        if (!cancelled) setTreasury(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setTreasuryError(err instanceof Error ? err.message : String(err));
      });

    getClientSubscriptions(clientId)
      .then((data) => {
        if (!cancelled) setSubscriptions(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setSubsError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const sourcesForPing = treasury?.source_attribution ?? [];

  return (
    <main className="flex-1 p-6 space-y-6" data-testid="client-treasury-page">
      {/* Back nav */}
      <div>
        <Link
          href="/services/treasury"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid="treasury-back-link"
        >
          <ChevronLeft className="size-3" />
          Treasury Overview
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <PageHeader
          title={`Client: ${clientId}`}
          description="Per-client treasury attribution, subscriptions, custody pings, and withdrawal queue."
        />
        <WithdrawalRequestButton
          clientId={clientId}
          onSuccess={() => {
            // Refresh treasury view on successful withdrawal request
            getClientTreasury(clientId)
              .then((data) => setTreasury(data))
              .catch(() => { /* silent on refresh error */ });
          }}
        />
      </div>

      {/* Custody ping status row */}
      {!treasuryLoading && sourcesForPing.length > 0 && (
        <Card data-testid="custody-pings-card">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Custody Source Status
            </p>
            <CustodyPingBadges sources={sourcesForPing} />
          </CardContent>
        </Card>
      )}

      {/* Two-column grid: treasury card + subscriptions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ClientTreasuryCard
          clientId={clientId}
          data={treasury}
          loading={treasuryLoading}
          error={treasuryError}
        />
        <SubscriptionsList
          data={subscriptions}
          loading={subsLoading}
          error={subsError}
        />
      </div>

      {/* Post-trade history (full width) */}
      <PostTradeHistory
        trades={treasury?.recent_trades ?? []}
        loading={treasuryLoading}
      />
    </main>
  );
}
