"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DataTableWidget, type DataTableColumn } from "@/components/shared/data-table-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { PredictionPosition } from "@/components/trading/predictions/types";
import { fmtUsdPrecise } from "@/components/trading/predictions/helpers";
import { VenueChip } from "@/components/trading/predictions/shared";
import { usePredictionsData } from "./predictions-data-context";

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function pnlColour(pnl: number) {
  return pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-muted-foreground";
}

export function PredOpenPositionsWidget(_props: WidgetComponentProps) {
  const { openPositions } = usePredictionsData();

  const columns = React.useMemo<DataTableColumn<PredictionPosition>[]>(
    () => [
      {
        key: "market",
        label: "Market",
        accessor: (row) => (
          <div className="max-w-[200px]">
            <p className="font-medium leading-snug line-clamp-2 text-left font-sans">{row.marketQuestion}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <VenueChip venue={row.venue} />
              <Badge variant="outline" className="text-[9px] border-zinc-700/50 text-zinc-500">
                {categoryLabel(row.category)}
              </Badge>
            </div>
          </div>
        ),
        className: "align-top whitespace-normal",
      },
      {
        key: "side",
        label: "Side",
        align: "center",
        accessor: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "font-bold text-[10px]",
              row.side === "yes" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400",
            )}
          >
            {row.side.toUpperCase()} — {row.outcome}
          </Badge>
        ),
      },
      {
        key: "shares",
        label: "Shares",
        align: "right",
        accessor: "sharesHeld",
        sortable: true,
      },
      {
        key: "entry",
        label: "Entry / Now",
        align: "right",
        accessor: (row) => {
          const priceChange = row.currentPricePerShare - row.entryPricePerShare;
          return (
            <div className="flex flex-col items-end">
              <span>{row.entryPricePerShare}¢</span>
              <span
                className={cn(
                  "text-[10px] font-sans",
                  priceChange > 0 ? "text-emerald-400" : priceChange < 0 ? "text-red-400" : "text-zinc-500",
                )}
              >
                now {row.currentPricePerShare}¢
              </span>
            </div>
          );
        },
      },
      {
        key: "staked",
        label: "Staked",
        align: "right",
        accessor: (row) => fmtUsdPrecise(row.totalStaked),
      },
      {
        key: "pnl",
        label: "Unr. P&L",
        align: "right",
        accessor: (row) => (
          <span className={cn("font-semibold", pnlColour(row.unrealisedPnl))}>
            {row.unrealisedPnl > 0 ? "+" : ""}
            {fmtUsdPrecise(row.unrealisedPnl)}
          </span>
        ),
      },
      {
        key: "resolves",
        label: "Resolves",
        align: "right",
        accessor: (row) =>
          row.resolutionDate ? (
            <span className="font-mono text-[10px]">{row.resolutionDate}</span>
          ) : (
            <span className="text-zinc-600">—</span>
          ),
      },
    ],
    [],
  );

  return (
    <DataTableWidget
      columns={columns}
      data={openPositions}
      rowKey={(row) => row.id}
      emptyMessage="No open positions"
      className="h-full"
    />
  );
}
