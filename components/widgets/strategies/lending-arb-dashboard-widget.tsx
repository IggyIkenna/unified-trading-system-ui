"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig } from "@/components/shared/table-widget";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { useStrategiesData, type LendingArbRow } from "./strategies-data-context";

const columns: ColumnDef<LendingArbRow, unknown>[] = [
  {
    accessorKey: "protocol",
    header: "Protocol",
    enableSorting: true,
    cell: ({ row }) => <span className="text-xs">{row.getValue<string>("protocol")}</span>,
  },
  {
    accessorKey: "token",
    header: "Token",
    enableSorting: true,
    cell: ({ row }) => <span className="text-xs font-mono">{row.getValue<string>("token")}</span>,
  },
  {
    accessorKey: "supplyApy",
    header: () => <span className="flex justify-end">Supply APY</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-xs font-mono text-right">{row.getValue<number>("supplyApy").toFixed(1)}%</div>
    ),
  },
  {
    accessorKey: "borrowApy",
    header: () => <span className="flex justify-end">Borrow APY</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-xs font-mono text-right">{row.getValue<number>("borrowApy").toFixed(1)}%</div>
    ),
  },
  {
    accessorKey: "spreadBps",
    header: () => <span className="flex justify-end">Spread</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const bps = row.getValue<number>("spreadBps");
      return (
        <div className="flex justify-end">
          <Badge variant={bps > 50 ? "success" : "secondary"} className="text-micro">
            {bps} bps
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "utilization",
    header: () => <span className="flex justify-end">Util %</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-xs font-mono text-right">{row.getValue<number>("utilization").toFixed(1)}</div>
    ),
  },
];

export function LendingArbDashboardWidget(_props: WidgetComponentProps) {
  const { lendingArbData, isLoading } = useStrategiesData();

  const bestArb = React.useMemo(
    () => lendingArbData.reduce((best, row) => (row.spreadBps > best.spreadBps ? row : best), lendingArbData[0]),
    [lendingArbData],
  );

  const headerMetrics: KpiMetric[] = bestArb
    ? [
        { label: "Best Arb", value: `${bestArb.protocol} — ${bestArb.token}`, sentiment: "positive" as const },
        { label: "Spread", value: `${bestArb.spreadBps} bps`, sentiment: "positive" as const },
        { label: "Rows", value: String(lendingArbData.length), sentiment: "neutral" as const },
      ]
    : [];

  const actionsConfig: TableActionsConfig = {};

  return (
    <TableWidget
      columns={columns}
      data={lendingArbData}
      actions={actionsConfig}
      summary={bestArb ? <KpiStrip metrics={headerMetrics} layoutMode="single-row" compact /> : undefined}
      isLoading={isLoading}
      enableSorting
      enableColumnVisibility={false}
      emptyMessage="No lending arb data available"
      className="h-full min-h-0"
    />
  );
}
