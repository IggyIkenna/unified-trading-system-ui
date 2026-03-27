"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { DataTableWidget, type DataTableColumn } from "@/components/widgets/shared";
import { Badge } from "@/components/ui/badge";
import { useMarketsData, type OrderFlowEntry } from "./markets-data-context";

export function MarketsOrderFlowWidget(_props: WidgetComponentProps) {
  const { orderFlowData, assetClass, orderFlowRange } = useMarketsData();
  const rows = React.useMemo(() => orderFlowData.slice(0, 100), [orderFlowData]);

  const columns: DataTableColumn<OrderFlowEntry>[] = React.useMemo(
    () => [
      {
        key: "exchangeTime",
        label: "Exch Time",
        accessor: (row) => (
          <span className="font-mono text-[10px]">{new Date(row.exchangeTime).toLocaleTimeString()}</span>
        ),
        minWidth: 88,
      },
      {
        key: "localTime",
        label: "Local",
        accessor: (row) => (
          <span className="font-mono text-[10px] text-muted-foreground">
            {new Date(row.localTime).toLocaleTimeString()}
          </span>
        ),
        minWidth: 88,
      },
      {
        key: "delayMs",
        label: "Delay",
        align: "right",
        accessor: (row) => <span className="font-mono text-[10px] text-muted-foreground">{row.delayMs}ms</span>,
      },
      {
        key: "type",
        label: "Type",
        accessor: (row) => (
          <Badge variant={row.type === "trade" ? "default" : "outline"} className="text-[10px] px-1 py-0">
            {row.type}
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

  return (
    <div className="p-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <Badge variant="outline" className="text-[10px]">
          {assetClass === "crypto" ? "Crypto" : assetClass === "tradfi" ? "TradFi" : "DeFi"}
        </Badge>
        <span>
          {orderFlowRange.toUpperCase()} · {orderFlowData.length} orders · showing 100
        </span>
      </div>
      <DataTableWidget
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        getRowClassName={(row) => (row.isOwn ? "bg-yellow-500/10" : undefined)}
        compact
        className="max-h-[min(420px,50vh)]"
      />
    </div>
  );
}
