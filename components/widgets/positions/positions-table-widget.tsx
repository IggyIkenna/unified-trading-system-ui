"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig, TableFilterConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/utils/export";
import { formatPercent } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import type { AssetClassFilter } from "./positions-data-context";
import { usePositionsData, type PositionRecord } from "./positions-data-context";

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "instrument", header: "Instrument" },
  { key: "side", header: "Side" },
  { key: "quantity", header: "Quantity", format: "number" },
  { key: "entry_price", header: "Entry Price", format: "currency" },
  { key: "current_price", header: "Current Price", format: "currency" },
  { key: "today_pnl", header: "Today's P&L", format: "currency" },
  { key: "net_pnl", header: "Net P&L", format: "currency" },
  { key: "net_delta", header: "Net Delta", format: "number" },
  { key: "health_factor", header: "Health Factor", format: "number" },
  { key: "venue", header: "Venue" },
  { key: "updated_at", header: "Updated" },
];

function formatInstrumentId(id: string): string {
  const parts = id.split(":");
  if (parts.length < 3) return id;
  const [venue, type, symbolPart] = parts;
  const symbol = symbolPart.split("@")[0];

  const venueLabel: Record<string, string> = {
    "AAVEV3-ETHEREUM": "Aave V3",
    "AAVEV3-ARBITRUM": "Aave V3 Arb",
    "AAVEV3-OPTIMISM": "Aave V3 Op",
    ETHERFI: "EtherFi",
    LIDO: "Lido",
    WALLET: "",
    HYPERLIQUID: "Hyperliquid",
    BINANCE: "Binance",
    COINBASE: "Coinbase",
    DERIBIT: "Deribit",
  };

  const typeLabel: Record<string, string> = {
    PERPETUAL: "PERP",
    FUTURE: "FUT",
    OPTION: "OPT",
    SPOT: "",
    SPOT_ASSET: "",
    A_TOKEN: "",
    DEBT_TOKEN: "",
    LST: "",
  };

  const vLabel = Object.prototype.hasOwnProperty.call(venueLabel, venue) ? venueLabel[venue] : venue;
  const tLabel = Object.prototype.hasOwnProperty.call(typeLabel, type) ? typeLabel[type] : type;

  const suffix = tLabel ? ` ${tLabel}` : "";
  const venueStr = vLabel ? ` (${vLabel})` : "";
  return `${symbol}${suffix}${venueStr}`;
}

function deriveCanonicalId(row: PositionRecord): string {
  const venue = row.venue?.toUpperCase().replace(/\s+/g, "_") ?? "UNKNOWN";
  const instrument = row.instrument?.toUpperCase() ?? "";

  let type = "SPOT";
  if (
    row.strategy_id?.includes("BASIS") ||
    row.strategy_id?.includes("PERP") ||
    instrument.endsWith("-PERP") ||
    instrument.endsWith("-USD")
  ) {
    type = "PERPETUAL";
  } else if (
    row.strategy_id?.includes("AAVE") ||
    instrument.startsWith("A_") ||
    instrument.startsWith("AUSDC") ||
    instrument.startsWith("AWETH")
  ) {
    type = "A_TOKEN";
  } else if (
    row.strategy_id?.includes("STAKED") ||
    row.strategy_id?.includes("RECURSIVE") ||
    instrument.startsWith("WEETH") ||
    instrument.startsWith("STETH") ||
    instrument.startsWith("WSTETH")
  ) {
    type = "LST";
  }

  return `${venue}:${type}:${instrument}`;
}

function PnlCell({ abs, pct }: { abs: number; pct: number }) {
  return (
    <div className="flex flex-col items-end">
      <span className={cn("font-mono font-medium", abs >= 0 ? "pnl-positive" : "pnl-negative")}>
        {abs >= 0 ? "+" : ""}${formatCurrency(Math.abs(abs))}
      </span>
      <span
        className={cn("text-[10px] font-mono", pct >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]")}
      >
        {pct >= 0 ? "+" : ""}
        {formatPercent(pct, 2)}
      </span>
    </div>
  );
}

function buildColumns(
  getInstrumentRoute: (instrument: string, type: AssetClassFilter) => string,
  classifyInstrument: (instrument: string) => AssetClassFilter,
): ColumnDef<PositionRecord, unknown>[] {
  return [
    {
      accessorKey: "instrument",
      header: "Instrument",
      enableSorting: true,
      cell: ({ row }) => {
        const r = row.original;
        const canonicalId = deriveCanonicalId(r);
        return (
          <div className="flex flex-col min-w-[160px]">
            <div className="flex items-center gap-1">
              <Link
                href={getInstrumentRoute(r.instrument, classifyInstrument(r.instrument))}
                className="font-mono font-medium text-primary hover:underline cursor-pointer"
              >
                {formatInstrumentId(r.instrument)}
              </Link>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-2.5 text-muted-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px]">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-medium text-muted-foreground">Canonical ID</p>
                      <p className="font-mono text-xs select-all">{canonicalId}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-[10px] text-muted-foreground">{r.strategy_name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "side",
      header: () => <span className="flex justify-center">Side</span>,
      enableSorting: true,
      cell: ({ row }) => {
        const side = row.getValue<"LONG" | "SHORT">("side");
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[10px]",
                side === "LONG"
                  ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
                  : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]",
              )}
            >
              {side === "LONG" ? (
                <ArrowUpRight className="size-2.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="size-2.5 mr-0.5" />
              )}
              {side}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: () => <span className="flex justify-end">Quantity</span>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono text-[11px]">{row.getValue<number>("quantity").toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "entry_price",
      header: () => <span className="flex justify-end">Entry Price</span>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono text-[11px]">
          $
          {row
            .getValue<number>("entry_price")
            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: "current_price",
      header: () => <span className="flex justify-end">Current Price</span>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono text-[11px]">
          $
          {row
            .getValue<number>("current_price")
            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: "today_pnl",
      header: () => <span className="flex justify-end">Today&apos;s P&amp;L</span>,
      enableSorting: true,
      cell: ({ row }) => <PnlCell abs={row.original.today_pnl} pct={row.original.today_pnl_pct} />,
    },
    {
      accessorKey: "net_pnl",
      header: () => <span className="flex justify-end">Net P&L</span>,
      enableSorting: true,
      cell: ({ row }) => <PnlCell abs={row.original.net_pnl} pct={row.original.net_pnl_pct} />,
    },
    {
      accessorKey: "net_delta",
      header: () => <span className="flex justify-end">Net Delta</span>,
      enableSorting: true,
      cell: ({ row }) => {
        const delta = row.getValue<number | undefined>("net_delta");
        return delta != null ? (
          <span
            className={cn(
              "font-mono text-[11px] block text-right",
              delta > 0 ? "pnl-positive" : delta < 0 ? "pnl-negative" : "text-muted-foreground",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground text-[10px] block text-right">--</span>
        );
      },
    },
    {
      accessorKey: "health_factor",
      header: () => <span className="flex justify-end">HF</span>,
      enableSorting: true,
      cell: ({ row }) => {
        const hf = row.getValue<number | undefined>("health_factor");
        return hf != null ? (
          <div className="flex justify-end">
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[10px] px-1.5 py-0",
                hf >= 1.5
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : hf >= 1.25
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/20 text-rose-400 border-rose-500/30",
              )}
            >
              {hf.toFixed(2)}
            </Badge>
          </div>
        ) : (
          <span className="text-muted-foreground text-[10px] block text-right">--</span>
        );
      },
    },
    {
      accessorKey: "venue",
      header: "Venue",
      enableSorting: true,
      cell: ({ row }) => <span className="text-[11px]">{row.getValue<string>("venue")}</span>,
    },
    {
      accessorKey: "updated_at",
      header: () => <span className="flex justify-end">Updated</span>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right text-[11px] text-muted-foreground font-mono">
          {row.getValue<string>("updated_at")}
        </div>
      ),
    },
    {
      id: "trades",
      header: () => <span className="flex justify-end">Trades</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Link
            href={`/services/trading/positions/trades?position_id=${encodeURIComponent(row.original.id)}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            View trades
            <ExternalLink className="size-3 shrink-0" />
          </Link>
        </div>
      ),
    },
  ];
}

export function PositionsTableWidget(_props: WidgetComponentProps) {
  const {
    filteredPositions,
    isLoading: positionsLoading,
    positionsError,
    refetchPositions,
    isLive,
    classifyInstrument,
    getInstrumentRoute,
    searchQuery,
    setSearchQuery,
    venueFilter,
    setVenueFilter,
    sideFilter,
    setSideFilter,
    strategyFilter,
    setStrategyFilter,
    instrumentTypeFilters,
    toggleInstrumentTypeFilter,
    assetClassOptions,
    uniqueVenues,
    uniqueStrategies,
    resetFilters,
  } = usePositionsData();

  const activeFilterCount =
    [
      searchQuery,
      venueFilter !== "all" ? venueFilter : "",
      sideFilter !== "all" ? sideFilter : "",
      strategyFilter !== "all" ? strategyFilter : "",
    ].filter(Boolean).length + instrumentTypeFilters.length;

  const columns = React.useMemo(
    () => buildColumns(getInstrumentRoute, classifyInstrument),
    [getInstrumentRoute, classifyInstrument],
  );

  const filterConfig: TableFilterConfig = {
    search: {
      query: searchQuery,
      onChange: setSearchQuery,
      placeholder: "Search positions…",
    },
    selectFilters: [
      {
        value: strategyFilter,
        onChange: setStrategyFilter,
        placeholder: "Strategy",
        allLabel: "All Strategies",
        width: "w-32",
        options: uniqueStrategies.filter(([id]) => id).map(([id, name]) => ({ value: id, label: name })),
      },
      {
        value: venueFilter,
        onChange: setVenueFilter,
        placeholder: "Venue",
        allLabel: "All Venues",
        width: "w-32",
        options: uniqueVenues.filter(Boolean).map((v) => ({ value: v, label: v })),
      },
      {
        value: sideFilter,
        onChange: (v) => setSideFilter(v as "all" | "LONG" | "SHORT"),
        placeholder: "Side",
        allLabel: "Both Sides",
        width: "w-24",
        options: [
          { value: "LONG", label: "Long" },
          { value: "SHORT", label: "Short" },
        ],
      },
    ],
    assetClass: {
      options: assetClassOptions as string[],
      active: instrumentTypeFilters as string[],
      onToggle: (cls) => toggleInstrumentTypeFilter(cls as AssetClassFilter),
    },
    activeFilterCount,
    onReset: resetFilters,
  };

  const actionsConfig: TableActionsConfig = {
    onRefresh: refetchPositions,
    dataFreshness: {
      lastUpdated: new Date(),
      isWebSocket: isLive,
      isBatch: !isLive,
    },
    export: {
      data: filteredPositions as unknown as Record<string, unknown>[],
      columns: EXPORT_COLUMNS,
      filename: "positions",
    },
  };

  return (
    <TableWidget
      columns={columns}
      data={filteredPositions}
      filterConfig={filterConfig}
      actions={actionsConfig}
      isLoading={positionsLoading}
      error={positionsError ? "Failed to load positions" : null}
      onRetry={refetchPositions}
      emptyMessage="No positions match your filters"
      enableSorting
      enableColumnVisibility
    />
  );
}
