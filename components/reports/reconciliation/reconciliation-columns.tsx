"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle, Search, ArrowRight, PenLine } from "lucide-react";
import type { BreakType, ReconciliationRecord, ReconciliationResolution, ReconciliationStatus } from "./reconciliation-types";
import { formatNumber } from "@/lib/utils/formatters";

export function buildHistoryColumns(handlers: {
  onResolveAction: (record: ReconciliationRecord, action: "accept" | "reject" | "investigate") => void;
  onBookCorrection: (record: ReconciliationRecord) => void;
  onViewMarket: (record: ReconciliationRecord) => void;
}): ColumnDef<ReconciliationRecord, unknown>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.original.date}</span>,
    },
    {
      accessorKey: "venue",
      header: "Venue",
    },
    {
      accessorKey: "breakType",
      header: "Break Type",
      cell: ({ row }) => breakTypeBadge(row.original.breakType),
    },
    {
      accessorKey: "liveValue",
      header: () => <span className="flex justify-end">Live Value</span>,
      cell: ({ row }) => <span className="flex justify-end font-mono">{formatNumeric(row.original.liveValue)}</span>,
    },
    {
      accessorKey: "batchValue",
      header: () => <span className="flex justify-end">Batch Value</span>,
      cell: ({ row }) => <span className="flex justify-end font-mono">{formatNumeric(row.original.batchValue)}</span>,
    },
    {
      accessorKey: "delta",
      header: () => <span className="flex justify-end">Delta</span>,
      cell: ({ row }) => {
        const delta = row.original.delta;
        const colorClass =
          delta > 0 ? "text-[var(--pnl-positive)]" : delta < 0 ? "text-[var(--pnl-negative)]" : "text-muted-foreground";
        return (
          <span className={`flex justify-end font-mono ${colorClass}`}>
            {delta > 0 ? "+" : ""}
            {formatNumeric(delta)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="flex justify-end">Status</span>,
      cell: ({ row }) => <span className="flex justify-end">{statusBadge(row.original.status)}</span>,
    },
    {
      id: "resolution",
      header: () => <span className="flex justify-end">Resolution</span>,
      cell: ({ row }) => {
        const res = row.original.resolution;
        if (!res) return <span className="flex justify-end text-[10px] text-muted-foreground">--</span>;
        return <span className="flex justify-end">{resolutionBadge(res)}</span>;
      },
    },
    {
      id: "actions",
      header: () => <span className="flex justify-end">Actions</span>,
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex justify-end items-center gap-1">
            {record.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                  onClick={() => handlers.onResolveAction(record, "accept")}
                >
                  <CheckCircle2 className="size-3" />
                  Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 gap-1 text-[10px] text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                  onClick={() => handlers.onResolveAction(record, "reject")}
                >
                  <XCircle className="size-3" />
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 gap-1 text-[10px] text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                  onClick={() => handlers.onResolveAction(record, "investigate")}
                >
                  <Search className="size-3" />
                  Investigate
                </Button>
              </>
            )}
            {record.status !== "pending" && record.status !== "resolved" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Accept"
                  onClick={() => handlers.onResolveAction(record, "accept")}
                >
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Reject"
                  onClick={() => handlers.onResolveAction(record, "reject")}
                >
                  <XCircle className="size-3.5 text-rose-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Investigate"
                  onClick={() => handlers.onResolveAction(record, "investigate")}
                >
                  <Search className="size-3.5 text-blue-500" />
                </Button>
              </>
            )}
            {record.status === "rejected" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Book Correction"
                onClick={() => handlers.onBookCorrection(record)}
              >
                <PenLine className="size-3.5 text-amber-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="View Market"
              onClick={() => handlers.onViewMarket(record)}
            >
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        );
      },
    },
  ];
}

function breakTypeBadge(bt: BreakType) {
  const map: Record<BreakType, { className: string }> = {
    position: {
      className: "border-[var(--status-warning)] text-[var(--status-warning)]",
    },
    pnl: {
      className: "border-[var(--pnl-negative)] text-[var(--pnl-negative)]",
    },
    fee: { className: "border-primary text-primary" },
    balance: { className: "border-[var(--surface-config)] text-[var(--surface-config)]" },
    gas: { className: "border-[var(--muted-foreground)] text-[var(--muted-foreground)]" },
  };
  const style = map[bt];
  return (
    <Badge variant="outline" className={`text-[10px] uppercase ${style.className}`}>
      {bt}
    </Badge>
  );
}

function statusBadge(status: ReconciliationStatus) {
  const map: Record<ReconciliationStatus, string> = {
    resolved: "bg-[var(--status-live)]/10 text-[var(--status-live)]",
    pending: "bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
    investigating: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]",
    rejected: "bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)]",
    accepted: "bg-[var(--status-live)]/10 text-[var(--status-live)]",
  };
  return (
    <Badge variant="outline" className={`text-[10px] capitalize ${map[status]}`}>
      {status}
    </Badge>
  );
}

function resolutionBadge(resolution: ReconciliationResolution) {
  const map: Record<ReconciliationResolution, string> = {
    system_correct: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    chain_correct: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    adjusted: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };
  const labelMap: Record<ReconciliationResolution, string> = {
    system_correct: "System Correct",
    chain_correct: "Chain Correct",
    adjusted: "Adjusted",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${map[resolution]}`}>
      {labelMap[resolution]}
    </Badge>
  );
}

function formatNumeric(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${formatNumber(v / 1_000_000, 2)}M`;
  if (Math.abs(v) >= 1_000) return `${formatNumber(v / 1_000, 2)}k`;
  if (Math.abs(v) < 1 && v !== 0) return formatNumber(v, 4);
  return formatNumber(v, 2);
}
