"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { DataTableWidget, type DataTableColumn } from "@/components/widgets/shared";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { useMarketsData, type OrderFlowEntry } from "./markets-data-context";

export function MarketsMyOrdersWidget(_props: WidgetComponentProps) {
  const { ownOrders } = useMarketsData();

  const columns: DataTableColumn<OrderFlowEntry>[] = React.useMemo(
    () => [
      {
        key: "orderId",
        label: "Order ID",
        accessor: (row) => <span className="font-mono text-[10px] text-yellow-500">{row.orderId ?? "—"}</span>,
        minWidth: 96,
      },
      {
        key: "exchangeTime",
        label: "Exch Time",
        accessor: (row) => (
          <span className="font-mono text-[10px]">{new Date(row.exchangeTime).toLocaleTimeString()}</span>
        ),
      },
      {
        key: "localTime",
        label: "Local",
        accessor: (row) => (
          <span className="font-mono text-[10px] text-muted-foreground">
            {new Date(row.localTime).toLocaleTimeString()}
          </span>
        ),
      },
      {
        key: "delayMs",
        label: "Delay",
        align: "right",
        accessor: (row) => <span className="text-muted-foreground">{row.delayMs}ms</span>,
      },
      {
        key: "type",
        label: "Type",
        accessor: (row) => (
          <Badge variant={row.type === "trade" ? "default" : "outline"} className="text-[10px] px-1 py-0">
            {row.type === "trade" ? "Fill" : row.type}
          </Badge>
        ),
      },
      {
        key: "side",
        label: "Side",
        accessor: (row) => (
          <span className={row.side === "buy" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}>
            {row.side.toUpperCase()}
          </span>
        ),
      },
      {
        key: "price",
        label: "Price",
        align: "right",
        accessor: (row) => <span className="font-mono">${row.price.toLocaleString()}</span>,
      },
      {
        key: "size",
        label: "Size",
        align: "right",
        accessor: (row) => <span className="font-mono">{row.size.toFixed(4)}</span>,
      },
      {
        key: "venue",
        label: "Venue",
        accessor: (row) => <span className="text-muted-foreground text-[10px]">{row.venue}</span>,
      },
      {
        key: "aggressor",
        label: "Aggressor",
        accessor: (row) =>
          row.aggressor ? (
            <span
              className={`text-[10px] ${row.aggressor === "buyer" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}
            >
              {row.aggressor}
            </span>
          ) : (
            "—"
          ),
      },
    ],
    [],
  );

  if (ownOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <FileText className="size-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">No orders</p>
        <p className="text-xs text-muted-foreground mt-1">No own orders in the generated range.</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      <div className="text-[10px] text-muted-foreground">{ownOrders.length} own orders</div>
      <DataTableWidget
        columns={columns}
        data={ownOrders}
        rowKey={(row) => row.id}
        getRowClassName={() => "bg-yellow-500/5"}
        compact
        className="max-h-[min(400px,45vh)]"
      />
    </div>
  );
}
