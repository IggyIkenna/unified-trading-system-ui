"use client";

import * as React from "react";
import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { ReconRun } from "./markets-data-context";
import { useMarketsData } from "./markets-data-context";
import { formatNumber } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<ReconRun, unknown>[] = [
  {
    accessorKey: "date",
    header: "Date",
    enableSorting: true,
    cell: ({ row }) => <span className="font-mono text-micro">{row.getValue<string>("date")}</span>,
  },
  {
    accessorKey: "breaks",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      return (
        <Badge
          variant={r.breaks === 0 ? "default" : r.resolved === r.breaks ? "secondary" : "destructive"}
          className="text-micro"
        >
          {r.breaks === 0 ? "Clean" : `${r.resolved}/${r.breaks} resolved`}
        </Badge>
      );
    },
  },
  {
    id: "breaksCount",
    header: () => <span className="flex justify-end">Breaks</span>,
    enableSorting: false,
    cell: ({ row }) => <div className="text-right font-mono">{row.original.breaks}</div>,
  },
  {
    accessorKey: "totalValue",
    header: () => <span className="flex justify-end">Break Value</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const val = row.getValue<number>("totalValue");
      return val > 0 ? (
        <div className="text-right text-muted-foreground">${formatNumber(val / 1000, 1)}k</div>
      ) : (
        <div className="text-right">-</div>
      );
    },
  },
];

export function MarketsReconWidget(_props: WidgetComponentProps) {
  const { reconRuns, isLoading, isError, refetch } = useMarketsData();

  const actionsConfig: TableActionsConfig = {
    extraActions: (
      <Badge variant="outline" className="gap-1 text-micro shrink-0">
        <AlertTriangle className="size-3" />
        Recon summary (mock)
      </Badge>
    ),
  };

  return (
    <TableWidget
      columns={columns}
      data={reconRuns}
      actions={actionsConfig}
      isLoading={isLoading}
      error={isError ? "Failed to load recon data" : null}
      onRetry={refetch}
      enableSorting
      enableColumnVisibility={false}
      emptyMessage="No recon runs available"
    />
  );
}
