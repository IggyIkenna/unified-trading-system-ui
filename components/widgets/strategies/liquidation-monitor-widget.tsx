"use client";

import { TableWidget } from "@/components/shared/table-widget";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { useStrategiesData, type AtRiskPosition } from "./strategies-data-context";

function hfBadgeVariant(hf: number): "success" | "warning" | "error" {
  if (hf > 2.0) return "success";
  if (hf >= 1.5) return "warning";
  return "error";
}

function hfColor(hf: number): string {
  if (hf > 2.0) return "text-emerald-400";
  if (hf >= 1.5) return "text-amber-400";
  return "text-red-400";
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const columns: ColumnDef<AtRiskPosition, unknown>[] = [
  {
    accessorKey: "protocol",
    header: "Protocol",
    enableSorting: true,
    cell: ({ row }) => <span className="text-xs">{row.getValue<string>("protocol")}</span>,
  },
  {
    id: "collateralInfo",
    header: "Collateral",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs">
        <span className="font-mono">{row.original.collateral}</span>
        <span className="text-muted-foreground ml-1 text-[10px]">{formatUsd(row.original.collateralUsd)}</span>
      </span>
    ),
  },
  {
    id: "debtInfo",
    header: "Debt",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs">
        <span className="font-mono">{row.original.debt}</span>
        <span className="text-muted-foreground ml-1 text-[10px]">{formatUsd(row.original.debtUsd)}</span>
      </span>
    ),
  },
  {
    accessorKey: "healthFactor",
    header: () => <span className="flex justify-end">HF</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const hf = row.getValue<number>("healthFactor");
      return (
        <div className="flex justify-end">
          <Badge variant={hfBadgeVariant(hf)} className="text-[10px] font-mono">
            {hf.toFixed(2)}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "liquidationPrice",
    header: () => <span className="flex justify-end">Liq. Price</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const price = row.getValue<number>("liquidationPrice");
      const hf = row.original.healthFactor;
      return (
        <div className={cn("text-xs font-mono text-right", hfColor(hf))}>
          {price < 1000 ? `$${price}` : `$${price.toLocaleString()}`}
        </div>
      );
    },
  },
  {
    accessorKey: "distancePct",
    header: () => <span className="flex justify-end">Distance</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const dist = row.getValue<number>("distancePct");
      return (
        <div className={cn("text-xs font-mono text-right", dist < 3 ? "text-red-400" : "text-muted-foreground")}>
          {dist.toFixed(1)}%
        </div>
      );
    },
  },
];

export function LiquidationMonitorWidget(_props: WidgetComponentProps) {
  const { liquidationPositions, isLoading } = useStrategiesData();

  const atRiskCount = React.useMemo(
    () => liquidationPositions.filter((p) => p.healthFactor < 1.5).length,
    [liquidationPositions],
  );

  const headerMetrics: KpiMetric[] = [
    { label: "At Risk", value: String(atRiskCount), sentiment: atRiskCount > 0 ? "negative" : "neutral" },
    { label: "Cascade Zone", value: "$2,740", sentiment: "negative" },
    { label: "24h Liquidated", value: "$4.2M", sentiment: "neutral" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border/40 shrink-0">
        <KpiStrip metrics={headerMetrics} columns={3} />
      </div>
      <TableWidget
        columns={columns}
        data={liquidationPositions}
        isLoading={isLoading}
        enableSorting
        enableColumnVisibility={false}
        emptyMessage="No at-risk positions"
        className="flex-1 min-h-0"
      />
    </div>
  );
}
