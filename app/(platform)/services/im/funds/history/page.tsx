"use client";

import * as React from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getNavHistory,
  listAllocations,
  listRedemptions,
  listSubscriptions,
  type AllocatorRedemption,
  type AllocatorSubscription,
  type FundAllocation,
  type NavSnapshot,
} from "@/lib/api/fund-administration";
import {
  MOCK_DEFAULT_FUND_ID,
  MOCK_DEFAULT_SHARE_CLASS,
} from "@/lib/mocks/fund-administration";

interface LedgerEntry {
  kind: "subscription" | "redemption" | "allocation";
  id: string;
  allocator_id: string | null;
  amount: string;
  status: string;
  timestamp: string;
}

function toLedger(
  subs: AllocatorSubscription[],
  reds: AllocatorRedemption[],
  allocs: FundAllocation[],
): LedgerEntry[] {
  const rows: LedgerEntry[] = [];
  for (const s of subs) {
    rows.push({
      kind: "subscription",
      id: s.subscription_id,
      allocator_id: s.allocator_id,
      amount: s.requested_amount_usd,
      status: s.status,
      timestamp: s.requested_timestamp,
    });
  }
  for (const r of reds) {
    rows.push({
      kind: "redemption",
      id: r.redemption_id,
      allocator_id: r.allocator_id,
      amount: r.cash_amount_due_usd ?? r.units_to_redeem,
      status: r.status,
      timestamp: r.requested_timestamp,
    });
  }
  for (const a of allocs) {
    rows.push({
      kind: "allocation",
      id: a.allocation_id,
      allocator_id: null,
      amount: a.executed_amount_usd ?? a.target_amount_usd,
      status: a.execution_status,
      timestamp: a.allocation_timestamp,
    });
  }
  return rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export default function HistoryPage() {
  const [data, setData] = React.useState<{
    subs: AllocatorSubscription[];
    reds: AllocatorRedemption[];
    allocs: FundAllocation[];
    nav: NavSnapshot[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [allocator, setAllocator] = React.useState<string>("ALL");

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      listSubscriptions(),
      listRedemptions(),
      listAllocations(MOCK_DEFAULT_FUND_ID),
      getNavHistory(MOCK_DEFAULT_FUND_ID, MOCK_DEFAULT_SHARE_CLASS),
    ])
      .then(([subs, reds, allocs, nav]) => {
        if (!cancelled) setData({ subs, reds, allocs, nav });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allocatorIds = React.useMemo(() => {
    if (!data) return ["ALL"];
    const ids = new Set<string>();
    for (const s of data.subs) ids.add(s.allocator_id);
    for (const r of data.reds) ids.add(r.allocator_id);
    return ["ALL", ...Array.from(ids).sort()];
  }, [data]);

  const ledger = React.useMemo(() => {
    if (!data) return null;
    const full = toLedger(data.subs, data.reds, data.allocs);
    if (allocator === "ALL") return full;
    return full.filter((row) => row.allocator_id === allocator);
  }, [data, allocator]);

  return (
    <main className="flex-1 p-6 space-y-6" data-testid="im-funds-history-page">
      <PageHeader
        title="History"
        description="Per-allocator ledger of cash movements and position attribution, alongside NAV snapshots."
      />

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Allocator</span>
        <Select value={allocator} onValueChange={setAllocator}>
          <SelectTrigger className="w-[200px] h-8 text-xs" data-testid="im-funds-history-allocator-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allocatorIds.map((id) => (
              <SelectItem key={id} value={id} className="text-xs">
                {id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">NAV snapshots</CardTitle>
            {data ? (
              <Badge variant="outline" className="text-xs font-mono">
                {data.nav.length} snapshot{data.nav.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-[var(--pnl-negative)]" data-testid="im-funds-history-error">
              {error}
            </p>
          ) : data === null ? (
            <Skeleton className="h-20" />
          ) : data.nav.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No NAV snapshots yet.</p>
          ) : (
            <Table data-testid="im-funds-history-nav-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Snapshot ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">NAV (USD)</TableHead>
                  <TableHead className="text-right">Δ USD</TableHead>
                  <TableHead className="text-right">Δ %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.nav.map((n) => (
                  <TableRow key={n.snapshot_id}>
                    <TableCell className="text-xs font-mono">{n.snapshot_id}</TableCell>
                    <TableCell className="text-xs font-mono">{n.snapshot_timestamp}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{n.nav_usd}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{n.nav_change_usd ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{n.nav_change_pct ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Ledger — cash movements + allocations</CardTitle>
            {ledger ? (
              <Badge variant="outline" className="text-xs font-mono">
                {ledger.length} entr{ledger.length === 1 ? "y" : "ies"}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {ledger === null ? (
            <Skeleton className="h-40" />
          ) : ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No ledger entries for this allocator.</p>
          ) : (
            <Table data-testid="im-funds-history-ledger-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Allocator</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((row) => (
                  <TableRow
                    key={`${row.kind}-${row.id}`}
                    data-testid={`im-funds-history-row-${row.kind}-${row.id}`}
                  >
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {row.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{row.id}</TableCell>
                    <TableCell className="text-sm">{row.allocator_id ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{row.amount}</TableCell>
                    <TableCell className="text-xs">{row.status}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{row.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
