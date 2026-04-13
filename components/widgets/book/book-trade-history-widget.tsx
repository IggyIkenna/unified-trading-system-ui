"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableFilterConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useBookTradeData, type BookTrade } from "./book-data-context";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

const STATUS_COLORS: Record<string, string> = {
  filled: "border-[var(--status-live)] text-[var(--status-live)]",
  partially_filled: "border-[var(--status-warning)] text-[var(--status-warning)]",
  settled: "border-[var(--chart-1)] text-[var(--chart-1)]",
};

const columns: ColumnDef<BookTrade, unknown>[] = [
  {
    accessorKey: "timestamp",
    header: "Time",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatTimestamp(row.getValue<string>("timestamp"))}
      </span>
    ),
  },
  {
    accessorKey: "instrument",
    header: "Instrument",
    enableSorting: true,
    cell: ({ row }) => <span className="font-mono font-medium text-sm">{row.getValue<string>("instrument")}</span>,
  },
  {
    accessorKey: "venue",
    header: "Venue",
    enableSorting: true,
    cell: ({ row }) => <span className="text-sm">{row.getValue<string>("venue")}</span>,
  },
  {
    accessorKey: "side",
    header: () => <span className="flex justify-center">Side</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const side = row.getValue<"buy" | "sell">("side");
      return (
        <div className="text-center">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs uppercase",
              side === "buy"
                ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
                : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]",
            )}
          >
            {side === "buy" ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
            {side}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: () => <span className="flex justify-end">Qty</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-right font-mono">{row.getValue<number>("quantity").toLocaleString()}</div>,
  },
  {
    accessorKey: "price",
    header: () => <span className="flex justify-end">Price</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        $
        {row
          .getValue<number>("price")
          .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    ),
  },
  {
    accessorKey: "fees",
    header: () => <span className="flex justify-end">Fees</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-mono text-muted-foreground">
        $
        {row.getValue<number>("fees").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    ),
  },
  {
    accessorKey: "total",
    header: () => <span className="flex justify-end">Total</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-mono font-medium">
        $
        {row
          .getValue<number>("total")
          .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    ),
  },
  {
    accessorKey: "tradeType",
    header: "Type",
    enableSorting: true,
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">
        {row.getValue<string>("tradeType")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: () => <span className="flex justify-center">Status</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      return (
        <div className="text-center">
          <Badge variant="outline" className={cn("text-xs capitalize", STATUS_COLORS[status] ?? "")}>
            {status.replace("_", " ")}
          </Badge>
        </div>
      );
    },
  },
];

export function BookTradeHistoryWidget(_props: WidgetComponentProps) {
  const { trades } = useBookTradeData();
  const [searchQuery, setSearchQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!searchQuery) return trades;
    const q = searchQuery.toLowerCase();
    return trades.filter(
      (t) =>
        t.instrument.toLowerCase().includes(q) ||
        t.venue.toLowerCase().includes(q) ||
        t.side.includes(q) ||
        t.tradeType.toLowerCase().includes(q) ||
        t.counterparty.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    );
  }, [trades, searchQuery]);

  const filterConfig: TableFilterConfig = {
    search: {
      query: searchQuery,
      onChange: setSearchQuery,
      placeholder: "Search trades…",
    },
  };

  return (
    <TableWidget
      columns={columns}
      data={filtered}
      filterConfig={filterConfig}
      enableSorting
      enableColumnVisibility={false}
      emptyMessage="No trades match your search"
    />
  );
}
