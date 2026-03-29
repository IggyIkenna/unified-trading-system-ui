"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { DataTableWidget, type DataTableColumn } from "@/components/widgets/shared";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useMarketsData, type ReconRun } from "./markets-data-context";
import { formatNumber } from "@/lib/utils/formatters";

export function MarketsReconWidget(_props: WidgetComponentProps) {
  const { reconRuns } = useMarketsData();

  const columns: DataTableColumn<ReconRun>[] = React.useMemo(
    () => [
      {
        key: "date",
        label: "Date",
        accessor: (row) => <span className="font-mono text-[10px]">{row.date}</span>,
      },
      {
        key: "status",
        label: "Status",
        accessor: (row) => (
          <Badge
            variant={row.breaks === 0 ? "default" : row.resolved === row.breaks ? "secondary" : "destructive"}
            className="text-[10px]"
          >
            {row.breaks === 0 ? "Clean" : `${row.resolved}/${row.breaks} resolved`}
          </Badge>
        ),
      },
      {
        key: "breaks",
        label: "Breaks",
        align: "right",
        accessor: "breaks",
      },
      {
        key: "totalValue",
        label: "Break value",
        align: "right",
        accessor: (row) =>
          row.totalValue > 0 ? (
            <span className="text-muted-foreground">${formatNumber(row.totalValue / 1000, 1)}k</span>
          ) : (
            "—"
          ),
      },
    ],
    [],
  );

  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1 text-[10px]">
          <AlertTriangle className="size-3" />
          Recon summary (mock)
        </Badge>
      </div>
      <DataTableWidget columns={columns} data={reconRuns} rowKey={(row) => row.date} compact />
    </div>
  );
}
