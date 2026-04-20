"use client";

import * as React from "react";
import { Repeat } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsOpsUser } from "@/lib/auth/ops-user";
import {
  listAllocations,
  rebalanceAllocations,
  type AllocationExecutionStatus,
  type FundAllocation,
} from "@/lib/api/fund-administration";
import { MOCK_DEFAULT_FUND_ID, MOCK_DEFAULT_SHARE_CLASS } from "@/lib/mocks/fund-administration";

function executionStatusBadge(status: AllocationExecutionStatus) {
  const styles: Record<AllocationExecutionStatus, string> = {
    PENDING: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    IN_PROGRESS: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    FAILED: "bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)] border-[var(--pnl-negative)]/20",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] ${styles[status]}`}
      data-testid={`im-funds-alloc-status-${status}`}
    >
      {status}
    </Badge>
  );
}

function sumDecimal(values: Array<string | null>): number {
  return values.reduce<number>((acc, v) => {
    if (v === null) return acc;
    const n = Number(v);
    return Number.isFinite(n) ? acc + n : acc;
  }, 0);
}

export default function AllocationsPage() {
  const [rows, setRows] = React.useState<FundAllocation[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [rebalancing, setRebalancing] = React.useState(false);
  const isOps = useIsOpsUser();

  const refresh = React.useCallback(() => {
    listAllocations(MOCK_DEFAULT_FUND_ID)
      .then((data) => setRows(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const targetSum = React.useMemo(
    () => (rows === null ? 0 : sumDecimal(rows.map((r) => r.target_amount_usd))),
    [rows],
  );
  const executedSum = React.useMemo(
    () => (rows === null ? 0 : sumDecimal(rows.map((r) => r.executed_amount_usd))),
    [rows],
  );
  const reservePct = targetSum > 0 ? Math.min(100, (executedSum / targetSum) * 100) : 0;

  async function onRebalance() {
    if (!rows || !isOps) return;
    setRebalancing(true);
    setError(null);
    try {
      const targets = rows.map((r) => ({
        allocation_id: r.allocation_id,
        strategy_id: r.strategy_id,
        target_amount_usd: r.target_amount_usd,
        venue: "mock-venue",
        from_wallet: "treasury-wallet",
        to_wallet: `strategy-${r.strategy_id}`,
        token: "USDC",
      }));
      await rebalanceAllocations(MOCK_DEFAULT_FUND_ID, {
        share_class: MOCK_DEFAULT_SHARE_CLASS,
        targets,
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRebalancing(false);
    }
  }

  return (
    <main className="flex-1 p-6 space-y-6" data-testid="im-funds-allocations-page">
      <PageHeader
        title="Allocations"
        description="Fund → strategy capital routing. Treasury health and per-strategy allocation deltas."
      >
        <Button
          size="sm"
          onClick={onRebalance}
          disabled={!isOps || rebalancing || rows === null}
          data-testid="im-funds-alloc-rebalance-button"
          title={isOps ? undefined : "Ops role required"}
        >
          <Repeat className="size-4 mr-1.5" />
          {rebalancing ? "Rebalancing…" : "Rebalance"}
        </Button>
      </PageHeader>

      {!isOps ? (
        <Card>
          <CardContent className="pt-4 text-xs text-muted-foreground" data-testid="im-funds-alloc-ops-gate">
            Rebalance action is restricted to ops users. Sign in with the `admin` or `internal` persona in mock
            mode to enable it.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <Card data-testid="im-funds-alloc-kpi-reserve">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Treasury health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Executed / target = {reservePct.toFixed(1)}%
            </div>
            <Progress value={reservePct} />
            <div className="flex items-center justify-between text-xs font-mono">
              <span>Executed: ${executedSum.toLocaleString()}</span>
              <span>Target: ${targetSum.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="im-funds-alloc-kpi-delta">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Allocation delta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground">Target minus executed across all strategies</div>
            <div className="text-2xl font-semibold font-mono">
              ${Math.max(0, targetSum - executedSum).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Strategy allocations</CardTitle>
            {rows ? (
              <Badge variant="outline" className="text-xs font-mono">
                {rows.length} row{rows.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-[var(--pnl-negative)]" data-testid="im-funds-alloc-error">
              {error}
            </p>
          ) : rows === null ? (
            <Skeleton className="h-40" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No allocations recorded for this fund.</p>
          ) : (
            <Table data-testid="im-funds-alloc-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Allocation ID</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Share class</TableHead>
                  <TableHead className="text-right">Target (USD)</TableHead>
                  <TableHead className="text-right">Executed (USD)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.allocation_id} data-testid={`im-funds-alloc-row-${row.allocation_id}`}>
                    <TableCell className="text-xs font-mono">{row.allocation_id}</TableCell>
                    <TableCell className="text-sm">{row.strategy_id}</TableCell>
                    <TableCell className="text-sm">{row.share_class}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{row.target_amount_usd}</TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {row.executed_amount_usd ?? "—"}
                    </TableCell>
                    <TableCell>{executionStatusBadge(row.execution_status)}</TableCell>
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
