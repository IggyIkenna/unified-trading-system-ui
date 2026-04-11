"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { DataTableWidget, type DataTableColumn } from "@/components/shared/data-table-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { PredictionPosition, SettlementOutcome } from "@/components/trading/predictions/types";
import { fmtUsdPrecise, fmtRelativeTime } from "@/components/trading/predictions/helpers";
import { VenueChip } from "@/components/trading/predictions/shared";
import { usePredictionsData } from "./predictions-data-context";

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function pnlColour(pnl: number) {
  return pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-muted-foreground";
}

function settlementBadge(outcome: SettlementOutcome) {
  switch (outcome) {
    case "won":
      return (
        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
          Won
        </Badge>
      );
    case "lost":
      return (
        <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400">
          Lost
        </Badge>
      );
    case "void":
      return (
        <Badge variant="outline" className="text-[10px] border-zinc-600 text-zinc-400">
          Void
        </Badge>
      );
  }
}

export function PredSettledPositionsWidget(_props: WidgetComponentProps) {
  const { settledPositions } = usePredictionsData();

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
        key: "outcome",
        label: "Outcome",
        align: "center",
        accessor: (row) => (row.settlementOutcome ? settlementBadge(row.settlementOutcome) : "—"),
      },
      {
        key: "entry",
        label: "Entry",
        align: "right",
        accessor: (row) => `${row.entryPricePerShare}¢`,
      },
      {
        key: "staked",
        label: "Staked",
        align: "right",
        accessor: (row) => fmtUsdPrecise(row.totalStaked),
      },
      {
        key: "realised",
        label: "Realised P&L",
        align: "right",
        accessor: (row) => (
          <span className={cn("font-semibold", pnlColour(row.realisedPnl ?? 0))}>
            {(row.realisedPnl ?? 0) > 0 ? "+" : ""}
            {fmtUsdPrecise(row.realisedPnl ?? 0)}
          </span>
        ),
      },
      {
        key: "settled",
        label: "Settled",
        align: "right",
        accessor: (row) => (row.settledAt ? fmtRelativeTime(row.settledAt) : "—"),
      },
    ],
    [],
  );

  return (
    <CollapsibleSection title="Settled Positions" defaultOpen={false} count={settledPositions.length}>
      <DataTableWidget
        columns={columns}
        data={settledPositions}
        rowKey={(row) => row.id}
        emptyMessage="No settled positions"
        className="max-h-[320px]"
      />
    </CollapsibleSection>
  );
}
