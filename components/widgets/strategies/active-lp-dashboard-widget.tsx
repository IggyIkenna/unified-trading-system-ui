"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig } from "@/components/shared/table-widget";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { useStrategiesData, type LPPosition } from "./strategies-data-context";

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatRange(low: number, high: number): string {
  if (low >= 1000) return `$${low.toLocaleString()} – $${high.toLocaleString()}`;
  if (low >= 1) return `$${low} – $${high}`;
  return `${low} – ${high}`;
}

const columns: ColumnDef<LPPosition, unknown>[] = [
  {
    accessorKey: "pool",
    header: "Pool",
    enableSorting: true,
    cell: ({ row }) => <span className="text-xs font-mono font-medium">{row.getValue<string>("pool")}</span>,
  },
  {
    id: "range",
    header: "Range",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground">
        {formatRange(row.original.rangeLow, row.original.rangeHigh)}
      </span>
    ),
  },
  {
    accessorKey: "inRange",
    header: "In Range",
    enableSorting: true,
    cell: ({ row }) => {
      const inRange = row.getValue<boolean>("inRange");
      return (
        <Badge variant={inRange ? "success" : "error"} className="text-micro">
          {inRange ? "Yes" : "No"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "tvl",
    header: () => <span className="flex justify-end">TVL</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-xs font-mono text-right">{formatUsd(row.getValue<number>("tvl"))}</div>,
  },
  {
    accessorKey: "fees24h",
    header: () => <span className="flex justify-end">Fees 24h</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-xs font-mono text-right text-emerald-400">{formatUsd(row.getValue<number>("fees24h"))}</div>
    ),
  },
  {
    accessorKey: "ilPct",
    header: () => <span className="flex justify-end">IL %</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const il = row.getValue<number>("ilPct");
      return (
        <div className={`text-xs font-mono text-right ${il < -1 ? "text-red-400" : "text-muted-foreground"}`}>
          {il.toFixed(2)}%
        </div>
      );
    },
  },
  {
    accessorKey: "lastRebalance",
    header: "Rebalance",
    enableSorting: false,
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue<string>("lastRebalance")}</span>,
  },
];

export function ActiveLPDashboardWidget(_props: WidgetComponentProps) {
  const { lpPositions, isLoading } = useStrategiesData();

  const totalTvl = React.useMemo(() => lpPositions.reduce((sum, p) => sum + p.tvl, 0), [lpPositions]);
  const totalFees = React.useMemo(() => lpPositions.reduce((sum, p) => sum + p.fees24h, 0), [lpPositions]);
  const avgIl = React.useMemo(
    () => (lpPositions.length ? lpPositions.reduce((sum, p) => sum + p.ilPct, 0) / lpPositions.length : 0),
    [lpPositions],
  );
  const outOfRangeCount = React.useMemo(() => lpPositions.filter((p) => !p.inRange).length, [lpPositions]);

  const headerMetrics: KpiMetric[] = [
    { label: "Total TVL", value: formatUsd(totalTvl), sentiment: "neutral" },
    { label: "Positions", value: String(lpPositions.length), sentiment: "neutral" },
    { label: "24h Fees", value: formatUsd(totalFees), sentiment: "positive" },
    { label: "IL MTD", value: `${avgIl.toFixed(2)}%`, sentiment: "negative" },
  ];

  const actionsConfig: TableActionsConfig = {
    extraActions:
      outOfRangeCount > 0 ? (
        <Badge variant="warning" className="text-micro shrink-0">
          {outOfRangeCount} out of range
        </Badge>
      ) : undefined,
  };

  return (
    <TableWidget
      columns={columns}
      data={lpPositions}
      actions={actionsConfig}
      summary={<KpiStrip metrics={headerMetrics} layoutMode="single-row" compact />}
      isLoading={isLoading}
      enableSorting
      enableColumnVisibility={false}
      emptyMessage="No LP positions"
      className="h-full min-h-0"
    />
  );
}
