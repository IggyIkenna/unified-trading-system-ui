"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig } from "@/components/shared/table-widget";
import { LiveFeedWidget, useLiveFeed } from "@/components/shared/live-feed-widget";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatNumber } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { useMarketsData, type OrderFlowEntry } from "./markets-data-context";

const columns: ColumnDef<OrderFlowEntry, unknown>[] = [
  {
    accessorKey: "exchangeTime",
    header: "Exch Time",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-[10px]">
        {new Date(row.getValue<string>("exchangeTime")).toLocaleTimeString()}
      </span>
    ),
  },
  {
    accessorKey: "localTime",
    header: "Local",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-[10px] text-muted-foreground">
        {new Date(row.getValue<string>("localTime")).toLocaleTimeString()}
      </span>
    ),
  },
  {
    accessorKey: "delayMs",
    header: () => <span className="flex justify-end">Delay</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right font-mono text-[10px] text-muted-foreground">{row.getValue<number>("delayMs")}ms</div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => {
      const type = row.getValue<string>("type");
      return (
        <Badge variant={type === "trade" ? "default" : "outline"} className="text-[10px] px-1 py-0">
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "side",
    header: "Side",
    enableSorting: false,
    cell: ({ row }) => {
      const side = row.getValue<string>("side");
      return (
        <span className={side === "buy" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}>
          {side.toUpperCase()}
        </span>
      );
    },
  },
  {
    accessorKey: "price",
    header: () => <span className="flex justify-end">Price</span>,
    enableSorting: false,
    cell: ({ row }) => <div className="text-right font-mono">${row.getValue<number>("price").toLocaleString()}</div>,
  },
  {
    accessorKey: "size",
    header: () => <span className="flex justify-end">Size</span>,
    enableSorting: false,
    cell: ({ row }) => <div className="text-right font-mono">{formatNumber(row.getValue<number>("size"), 4)}</div>,
  },
  {
    accessorKey: "venue",
    header: "Venue",
    enableSorting: false,
    cell: ({ row }) => <span className="text-muted-foreground text-[10px]">{row.getValue<string>("venue")}</span>,
  },
  {
    accessorKey: "aggressor",
    header: "Aggressor",
    enableSorting: false,
    cell: ({ row }) => {
      const aggressor = row.getValue<string | null>("aggressor");
      if (!aggressor) return <span>—</span>;
      return (
        <span
          className={`text-[10px] ${aggressor === "buyer" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}
        >
          {aggressor}
        </span>
      );
    },
  },
];

export function MarketsOrderFlowWidget(_props: WidgetComponentProps) {
  const { orderFlowData, assetClass, orderFlowRange } = useMarketsData();
  const rows = useLiveFeed(orderFlowData, 500);

  const actionsConfig: TableActionsConfig = {
    extraActions: (
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-[10px]">
          {assetClass === "crypto" ? "Crypto" : assetClass === "tradfi" ? "TradFi" : "DeFi"}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {orderFlowRange.toUpperCase()} · {orderFlowData.length} orders
        </span>
      </div>
    ),
  };

  return (
    <TableWidget
      columns={columns}
      data={rows}
      actions={actionsConfig}
      enableSorting={false}
      enableColumnVisibility={false}
      emptyMessage="No order flow data yet"
    />
  );
}
