"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { DriftAnalysisPanel } from "@/components/trading/drift-analysis-panel";
import { useReconciliation } from "@/hooks/api/use-reports";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { AlertTriangle, Scale, DollarSign, Receipt, RefreshCw, TrendingDown, PackageX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { buildHistoryColumns } from "./reconciliation-columns";
import {
  BREAK_TYPES,
  DRIFT_METRICS,
  FALLBACK_HISTORY,
  STATUS_OPTIONS,
  UNRECONCILED_ITEMS,
  VENUES,
} from "./reconciliation-constants";
import type { ReconciliationRecord, ReconciliationResolution, ReconciliationStatus } from "./reconciliation-types";
import { ReconciliationLoadingSkeleton } from "./reconciliation-loading-skeleton";

export function ReconciliationPageClient() {
  const router = useRouter();
  const { data: apiData, isLoading, isError, refetch } = useReconciliation();

  const [breakTypeFilter, setBreakTypeFilter] = React.useState("all");
  const [venueFilter, setVenueFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [resolvingBreak, setResolvingBreak] = React.useState<ReconciliationRecord | null>(null);
  const [resolveAction, setResolveAction] = React.useState<"accept" | "reject" | "investigate">("accept");
  const [resolveNote, setResolveNote] = React.useState("");
  const [localOverrides, setLocalOverrides] = React.useState<
    Record<string, { status: ReconciliationStatus; resolution?: ReconciliationResolution }>
  >({});

  const history: ReconciliationRecord[] = React.useMemo(() => {
    const raw = (apiData as Record<string, unknown>)?.history as ReconciliationRecord[] | undefined;
    const base = raw ?? FALLBACK_HISTORY;
    return base.map((r) => {
      const override = localOverrides[r.id];
      if (!override) return r;
      return { ...r, status: override.status, resolution: override.resolution };
    });
  }, [apiData, localOverrides]);

  const filtered = React.useMemo(() => {
    return history.filter((r) => {
      if (breakTypeFilter !== "all" && r.breakType !== breakTypeFilter) return false;
      if (venueFilter !== "All" && r.venue !== venueFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [history, breakTypeFilter, venueFilter, statusFilter]);

  const handleResolveAction = React.useCallback(
    (record: ReconciliationRecord, action: "accept" | "reject" | "investigate") => {
      setResolvingBreak(record);
      setResolveAction(action);
      setResolveNote("");
    },
    [],
  );

  const handleBookCorrection = React.useCallback(
    (record: ReconciliationRecord) => {
      const prefill = {
        venue: record.venue,
        instrument_id: record.id,
        quantity: Math.abs(record.delta),
        side: record.delta > 0 ? "BUY" : "SELL",
        execution_mode: "record_only",
        reason: `Correction for break ${record.id}`,
      };
      router.push(`/services/trading/book?prefill=${encodeURIComponent(JSON.stringify(prefill))}`);
    },
    [router],
  );

  const handleViewMarket = React.useCallback(
    (record: ReconciliationRecord) => {
      router.push(`/services/trading/markets?instrument=${record.id}`);
    },
    [router],
  );

  const handleConfirmResolve = React.useCallback(() => {
    if (!resolvingBreak || resolveNote.length < 10) return;
    const statusMap: Record<"accept" | "reject" | "investigate", ReconciliationStatus> = {
      accept: "accepted",
      reject: "rejected",
      investigate: "investigating",
    };
    const resolutionMap: Record<"accept" | "reject" | "investigate", ReconciliationResolution | undefined> = {
      accept: "system_correct",
      reject: "chain_correct",
      investigate: undefined,
    };
    setLocalOverrides((prev) => ({
      ...prev,
      [resolvingBreak.id]: {
        status: statusMap[resolveAction],
        resolution: resolutionMap[resolveAction],
      },
    }));
    setResolvingBreak(null);
    setResolveNote("");
  }, [resolvingBreak, resolveAction, resolveNote]);

  const historyColumns = React.useMemo(
    () =>
      buildHistoryColumns({
        onResolveAction: handleResolveAction,
        onBookCorrection: handleBookCorrection,
        onViewMarket: handleViewMarket,
      }),
    [handleResolveAction, handleBookCorrection, handleViewMarket],
  );

  const totalBreaks = history.filter((r) => r.status !== "resolved").length;
  const positionBreaks = history.filter((r) => r.breakType === "position" && r.status !== "resolved").length;
  const pnlDiscrepancies = history.filter((r) => r.breakType === "pnl" && r.status !== "resolved").length;
  const feeMismatches = history.filter((r) => r.breakType === "fee" && r.status !== "resolved").length;

  if (isLoading) return <ReconciliationLoadingSkeleton />;

  if (isError) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="size-10 text-[var(--status-warning)] mx-auto" />
            <div>
              <p className="font-semibold">Failed to load reconciliation data</p>
              <p className="text-sm text-muted-foreground mt-1">
                Could not reach the reporting API. Check connectivity and try again.
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (history.length === 0) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <PackageX className="size-10 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold">No reconciliation data</p>
              <p className="text-sm text-muted-foreground mt-1">
                There are no reconciliation records yet. Records will appear after the first batch/live comparison
                cycle.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          tone="grid"
          density="compact"
          contentClassName="!items-stretch !justify-center !px-4 !py-3 !text-left"
          body={
            <div className="flex w-full items-center gap-3">
              <div className="rounded-lg bg-[var(--status-warning)]/10 p-2">
                <Scale className="size-5" style={{ color: "var(--status-warning)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-2xl font-semibold">{totalBreaks}</p>
                <p className="text-xs text-muted-foreground">Total Breaks</p>
              </div>
            </div>
          }
        />
        <MetricCard
          tone="grid"
          density="compact"
          contentClassName="!items-stretch !justify-center !px-4 !py-3 !text-left"
          body={
            <div className="flex w-full items-center gap-3">
              <div className="rounded-lg bg-[var(--pnl-negative)]/10 p-2">
                <TrendingDown className="size-5" style={{ color: "var(--pnl-negative)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-2xl font-semibold">{positionBreaks}</p>
                <p className="text-xs text-muted-foreground">Position Breaks</p>
              </div>
            </div>
          }
        />
        <MetricCard
          tone="grid"
          density="compact"
          contentClassName="!items-stretch !justify-center !px-4 !py-3 !text-left"
          body={
            <div className="flex w-full items-center gap-3">
              <div className="rounded-lg bg-[var(--accent-blue)]/10 p-2">
                <DollarSign className="size-5" style={{ color: "var(--accent-blue)" }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-2xl font-semibold">{pnlDiscrepancies}</p>
                <p className="text-xs text-muted-foreground">PnL Discrepancies</p>
              </div>
            </div>
          }
        />
        <MetricCard
          tone="grid"
          density="compact"
          contentClassName="!items-stretch !justify-center !px-4 !py-3 !text-left"
          body={
            <div className="flex w-full items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Receipt className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-2xl font-semibold">{feeMismatches}</p>
                <p className="text-xs text-muted-foreground">Fee Mismatches</p>
              </div>
            </div>
          }
        />
      </div>

      <DriftAnalysisPanel
        metrics={DRIFT_METRICS}
        unreconciledItems={UNRECONCILED_ITEMS}
        batchAsOf="2026-03-22 00:00 UTC"
        liveAsOf="2026-03-22 14:35 UTC"
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Reconciliation History</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={breakTypeFilter} onValueChange={setBreakTypeFilter}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BREAK_TYPES.map((bt) => (
                    <SelectItem key={bt.value} value={bt.value} className="text-xs">
                      {bt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={venueFilter} onValueChange={setVenueFilter}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENUES.map((v) => (
                    <SelectItem key={v} value={v} className="text-xs">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ExportDropdown
                data={filtered.map((r) => ({ ...r }))}
                columns={[
                  { key: "date", header: "Date" },
                  { key: "venue", header: "Venue" },
                  { key: "breakType", header: "Break Type" },
                  {
                    key: "liveValue",
                    header: "Live Value",
                    format: "currency",
                  },
                  {
                    key: "batchValue",
                    header: "Batch Value",
                    format: "currency",
                  },
                  { key: "delta", header: "Delta", format: "currency" },
                  { key: "status", header: "Status" },
                  { key: "resolution", header: "Resolution" },
                ]}
                filename="reconciliation-history"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={historyColumns}
            data={filtered}
            enableColumnVisibility={false}
            className="text-xs"
            emptyMessage="No reconciliation records match your filters."
          />
        </CardContent>
      </Card>

      <Dialog
        open={resolvingBreak !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResolvingBreak(null);
            setResolveNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Break {resolvingBreak?.id}</DialogTitle>
            <DialogDescription>Confirm resolution action for this reconciliation break.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Action:</span>
              <Badge
                variant="outline"
                className={
                  resolveAction === "accept"
                    ? "border-emerald-500 text-emerald-500"
                    : resolveAction === "reject"
                      ? "border-rose-500 text-rose-500"
                      : "border-blue-500 text-blue-500"
                }
              >
                {resolveAction.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Note (min 10 characters)</label>
              <Textarea
                placeholder="Describe the rationale for this resolution..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                className="min-h-[80px]"
              />
              {resolveNote.length > 0 && resolveNote.length < 10 && (
                <p className="text-[10px] text-rose-500">{10 - resolveNote.length} more characters required</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolvingBreak(null);
                setResolveNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={resolveNote.length < 10}
              onClick={handleConfirmResolve}
              className={
                resolveAction === "accept"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : resolveAction === "reject"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-blue-600 hover:bg-blue-700"
              }
            >
              Confirm {resolveAction.charAt(0).toUpperCase() + resolveAction.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
