"use client";

import Link from "next/link";
import * as React from "react";
import { Building2, FilePlus, Repeat, ScrollText, Wallet } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getNavHistory,
  listRedemptions,
  listSubscriptions,
  type AllocatorRedemption,
  type AllocatorSubscription,
  type NavSnapshot,
} from "@/lib/api/fund-administration";
import {
  MOCK_DEFAULT_FUND_ID,
  MOCK_DEFAULT_SHARE_CLASS,
} from "@/lib/mocks/fund-administration";

interface OverviewData {
  subscriptions: AllocatorSubscription[];
  redemptions: AllocatorRedemption[];
  navHistory: NavSnapshot[];
}

const CHILD_LINKS = [
  {
    href: "/services/im/funds/subscriptions",
    label: "Subscriptions",
    description: "Investor capital inflows — PENDING → APPROVED → SETTLED",
    icon: FilePlus,
    testId: "im-funds-overview-link-subscriptions",
  },
  {
    href: "/services/im/funds/redemptions",
    label: "Redemptions",
    description: "Investor capital outflows — grace period, process, settle",
    icon: ScrollText,
    testId: "im-funds-overview-link-redemptions",
  },
  {
    href: "/services/im/funds/allocations",
    label: "Allocations",
    description: "Treasury → strategy capital routing + rebalance",
    icon: Repeat,
    testId: "im-funds-overview-link-allocations",
  },
  {
    href: "/services/im/funds/history",
    label: "History",
    description: "Per-allocator ledger + NAV snapshots",
    icon: Wallet,
    testId: "im-funds-overview-link-history",
  },
];

export default function ImFundsOverviewPage() {
  const [data, setData] = React.useState<OverviewData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      listSubscriptions(),
      listRedemptions(),
      getNavHistory(MOCK_DEFAULT_FUND_ID, MOCK_DEFAULT_SHARE_CLASS),
    ])
      .then(([subscriptions, redemptions, navHistory]) => {
        if (!cancelled) setData({ subscriptions, redemptions, navHistory });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingSubs = data?.subscriptions.filter((s) => s.status === "PENDING").length ?? 0;
  const pendingReds = data?.redemptions.filter((r) => r.status === "PENDING").length ?? 0;
  const latestNav = data?.navHistory[0]?.nav_usd ?? null;

  return (
    <main className="flex-1 p-6 space-y-6" data-testid="im-funds-overview-page">
      <PageHeader
        title="Fund Administration"
        description={`Pooled IM fund — subscriptions, redemptions, capital allocation, and NAV history for ${MOCK_DEFAULT_FUND_ID} / ${MOCK_DEFAULT_SHARE_CLASS}.`}
      />

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-[var(--pnl-negative)]" data-testid="im-funds-overview-error">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        <Card data-testid="im-funds-kpi-nav">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="size-5 text-primary" />
              </div>
              <div>
                {data ? (
                  <p className="text-xl font-semibold font-mono">{latestNav ?? "—"}</p>
                ) : (
                  <Skeleton className="h-7 w-24" />
                )}
                <p className="text-xs text-muted-foreground">Share-class NAV (USD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="im-funds-kpi-pending-subs">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-blue)]/10">
                <FilePlus className="size-5" style={{ color: "var(--accent-blue)" }} />
              </div>
              <div>
                {data ? (
                  <p className="text-xl font-semibold font-mono">{pendingSubs}</p>
                ) : (
                  <Skeleton className="h-7 w-16" />
                )}
                <p className="text-xs text-muted-foreground">Pending subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="im-funds-kpi-pending-reds">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <ScrollText className="size-5 text-emerald-400" />
              </div>
              <div>
                {data ? (
                  <p className="text-xl font-semibold font-mono">{pendingReds}</p>
                ) : (
                  <Skeleton className="h-7 w-16" />
                )}
                <p className="text-xs text-muted-foreground">Pending redemptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Fund-administration sub-surfaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {CHILD_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={link.testId}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-1.5 rounded bg-muted shrink-0">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {link.label}
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Phase 3
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
