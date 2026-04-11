"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { WidgetComponentProps } from "../widget-registry";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search) return trades;
    const q = search.toLowerCase();
    return trades.filter(
      (t) =>
        t.instrument.toLowerCase().includes(q) ||
        t.venue.toLowerCase().includes(q) ||
        t.side.includes(q) ||
        t.tradeType.toLowerCase().includes(q) ||
        t.counterparty.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    );
  }, [trades, search]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
        <Search className="size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search trades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs flex-1"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filtered.length} trade{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none">
          <CardContent className="p-0">
            <DataTable columns={columns} data={filtered} enableSorting emptyMessage="No trades match your search" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
