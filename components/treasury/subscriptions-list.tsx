"use client";

/**
 * SubscriptionsList — share-class subscription list for a client.
 *
 * Renders the per-archetype subscriptions from GET /api/clients/{id}/subscriptions.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.C.
 */

import * as React from "react";
import { FileText, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ClientSubscriptionList,
  ClientShareClassSubscriptionView,
} from "@/lib/api/treasury-client";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { readonly status: ClientShareClassSubscriptionView["status"] }) {
  const variants = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400",
    SUSPENDED: "bg-amber-500/10 text-amber-400",
    PENDING: "bg-blue-500/10 text-blue-400",
  } as const;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${variants[status]}`}>
      {status}
    </span>
  );
}

// ─── Single subscription row ──────────────────────────────────────────────────

function SubscriptionRow({ sub }: { readonly sub: ClientShareClassSubscriptionView }) {
  const feeRate = (parseFloat(sub.perf_fee_rate) * 100).toFixed(0);
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-border last:border-0"
      data-testid={`subscription-row-${sub.subscription_id}`}
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" data-testid="subscription-archetype">
            {sub.archetype_id.replace(/_/g, " ")}
          </p>
          <StatusBadge status={sub.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {sub.share_class_id} · {sub.crystallization_cadence} crystallization
          · {feeRate}% perf fee
        </p>
      </div>
      <div className="text-right">
        <p
          className="text-sm font-mono font-semibold"
          data-testid="subscription-allocation-pct"
        >
          {sub.allocation_pct}%
        </p>
        <p className="text-xs text-muted-foreground">allocation</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SubscriptionsListProps {
  readonly data: ClientSubscriptionList | null;
  readonly loading: boolean;
  readonly error: string | null;
}

export function SubscriptionsList({ data, loading, error }: SubscriptionsListProps) {
  return (
    <Card data-testid="subscriptions-list-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          Share-Class Subscriptions
          {data ? (
            <Badge variant="outline" className="ml-auto text-[10px]">
              {data.active_count} active
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div
            className="flex items-center gap-2 text-sm text-[var(--pnl-negative)]"
            data-testid="subscriptions-error"
          >
            <AlertTriangle className="size-4 shrink-0" />
            {error}
          </div>
        ) : loading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : data.subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="subscriptions-empty">
            No active subscriptions.
          </p>
        ) : (
          <>
            <div data-testid="subscriptions-list">
              {data.subscriptions.map((sub) => (
                <SubscriptionRow key={sub.subscription_id} sub={sub} />
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total allocation</p>
              <p
                className="text-sm font-mono font-semibold"
                data-testid="subscriptions-total-pct"
              >
                {data.total_active_allocation_pct}%
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
