"use client";

import * as React from "react";
import { TableWidget } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { OrderFlowEntry } from "./markets-data-context";
import { useMarketsData } from "./markets-data-context";
import { formatNumber } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<OrderFlowEntry, unknown>[] = [
  {
    accessorKey: "orderId",
    header: "Order ID",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-[10px] text-yellow-500">{row.getValue<string | null>("orderId") ?? "—"}</span>
    ),
  },
  {
    accessorKey: "exchangeTime",
    header: "Exch Time",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-[10px]">
        {new Date(row.getValue<string>("exchangeTime")).toLocaleTimeString()}
      </span>
    ),
  },
  {
    accessorKey: "localTime",
    header: "Local",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-[10px] text-muted-foreground">
        {new Date(row.getValue<string>("localTime")).toLocaleTimeString()}
      </span>
    ),
  },
  {
    accessorKey: "delayMs",
    header: () => <span className="flex justify-end">Delay</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground text-xs">{row.getValue<number>("delayMs")}ms</div>
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
          {type === "trade" ? "Fill" : type}
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
    enableSorting: true,
    cell: ({ row }) => <div className="text-right font-mono">${row.getValue<number>("price").toLocaleString()}</div>,
  },
  {
    accessorKey: "size",
    header: () => <span className="flex justify-end">Size</span>,
    enableSorting: true,
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

export function MarketsMyOrdersWidget(_props: WidgetComponentProps) {
  const { ownOrders } = useMarketsData();

  return (
    <TableWidget
      columns={columns}
      data={ownOrders}
      enableSorting
      enableColumnVisibility={false}
      emptyMessage="No own orders in the generated range"
    />
  );
}
