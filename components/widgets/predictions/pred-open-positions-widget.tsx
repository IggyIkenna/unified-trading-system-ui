"use client";

import * as React from "react";
import { TableWidget } from "@/components/shared/table-widget";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { PredictionPosition } from "@/components/trading/predictions/types";
import { fmtUsdPrecise } from "@/components/trading/predictions/helpers";
import { VenueChip } from "@/components/trading/predictions/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { usePredictionsData } from "./predictions-data-context";

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function pnlColour(pnl: number) {
  return pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-muted-foreground";
}

const columns: ColumnDef<PredictionPosition, unknown>[] = [
  {
    accessorKey: "marketQuestion",
    header: "Market",
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      return (
        <div className="max-w-[200px]">
          <p className="font-medium leading-snug line-clamp-2 text-left font-sans">{r.marketQuestion}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <VenueChip venue={r.venue} />
            <Badge variant="outline" className="text-[9px] border-zinc-700/50 text-zinc-500">
              {categoryLabel(r.category)}
            </Badge>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "side",
    header: () => <span className="flex justify-center">Side</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className={cn(
              "font-bold text-[10px]",
              r.side === "yes" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400",
            )}
          >
            {r.side.toUpperCase()} — {r.outcome}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "sharesHeld",
    header: () => <span className="flex justify-end">Shares</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-right font-mono">{row.getValue<number>("sharesHeld")}</div>,
  },
  {
    id: "entry",
    header: () => <span className="flex justify-end">Entry / Now</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      const priceChange = r.currentPricePerShare - r.entryPricePerShare;
      return (
        <div className="flex flex-col items-end">
          <span>{r.entryPricePerShare}¢</span>
          <span
            className={cn(
              "text-[10px] font-sans",
              priceChange > 0 ? "text-emerald-400" : priceChange < 0 ? "text-red-400" : "text-zinc-500",
            )}
          >
            now {r.currentPricePerShare}¢
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalStaked",
    header: () => <span className="flex justify-end">Staked</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-right font-mono">{fmtUsdPrecise(row.getValue<number>("totalStaked"))}</div>,
  },
  {
    accessorKey: "unrealisedPnl",
    header: () => <span className="flex justify-end">Unr. P&L</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const pnl = row.getValue<number>("unrealisedPnl");
      return (
        <div className={cn("text-right font-mono font-semibold", pnlColour(pnl))}>
          {pnl > 0 ? "+" : ""}
          {fmtUsdPrecise(pnl)}
        </div>
      );
    },
  },
  {
    accessorKey: "resolutionDate",
    header: () => <span className="flex justify-end">Resolves</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const date = row.getValue<string | undefined>("resolutionDate");
      return date ? (
        <div className="text-right font-mono text-[10px]">{date}</div>
      ) : (
        <div className="text-right text-zinc-600">—</div>
      );
    },
  },
];

export function PredOpenPositionsWidget(_props: WidgetComponentProps) {
  const { openPositions } = usePredictionsData();

  return (
    <TableWidget
      columns={columns}
      data={openPositions}
      enableSorting
      enableColumnVisibility={false}
      emptyMessage="No open positions"
    />
  );
}
