"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle, Search, ArrowRight, PenLine } from "lucide-react";
import type { BreakType, ReconciliationRecord, ReconciliationStatus } from "./reconciliation-types";

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
      id: "actions",
      header: () => <span className="flex justify-end">Actions</span>,
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex justify-end items-center gap-1">
            {record.status !== "resolved" && (
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
  };
  return (
    <Badge variant="outline" className={`text-[10px] capitalize ${map[status]}`}>
      {status}
    </Badge>
  );
}

function formatNumeric(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(2)}k`;
  if (Math.abs(v) < 1 && v !== 0) return v.toFixed(4);
  return v.toFixed(2);
}
