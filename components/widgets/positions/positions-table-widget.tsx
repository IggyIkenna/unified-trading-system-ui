"use client";

import { FilterBar } from "@/components/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataFreshness } from "@/components/shared/data-freshness";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/shared/spinner";
import { DataTableWidget, type DataTableColumn } from "@/components/shared/data-table-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/utils/export";
import type { AssetClassFilter } from "./positions-data-context";
import { AlertCircle, ArrowDownRight, ArrowUpRight, ChevronDown, ExternalLink, RefreshCw, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import * as React from "react";
import { usePositionsData, type PositionRecord } from "./positions-data-context";
import { formatPercent } from "@/lib/utils/formatters";

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

/**
 * Derive a canonical VENUE:TYPE:ASSET compound key from a PositionRecord.
 * Format: VENUE:INSTRUMENT_TYPE:ASSET (e.g. HYPERLIQUID:PERPETUAL:ETH-USD)
 */
function deriveCanonicalId(row: PositionRecord): string {
  const venue = row.venue?.toUpperCase().replace(/\s+/g, "_") ?? "UNKNOWN";
  const instrument = row.instrument?.toUpperCase() ?? "";

  // Infer type from strategy_id + instrument pattern
  let type = "SPOT";
  if (row.strategy_id?.includes("BASIS") || row.strategy_id?.includes("PERP") || instrument.endsWith("-PERP") || instrument.endsWith("-USD")) {
    type = "PERPETUAL";
  } else if (row.strategy_id?.includes("AAVE") || instrument.startsWith("A_") || instrument.startsWith("AUSDC") || instrument.startsWith("AWETH")) {
    type = "A_TOKEN";
  } else if (row.strategy_id?.includes("STAKED") || row.strategy_id?.includes("RECURSIVE") || instrument.startsWith("WEETH") || instrument.startsWith("STETH") || instrument.startsWith("WSTETH")) {
    type = "LST";
  } else if (instrument.includes("-") && !instrument.includes("-PERP")) {
    type = "SPOT";
  }

  return `${venue}:${type}:${instrument}`;
}
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

export function PositionsTableWidget(_props: WidgetComponentProps) {
  const {
    filteredPositions,
    isLoading,
    positionsError,
    refetchPositions,
    isLive,
    classifyInstrument,
    getInstrumentRoute,
    filterDefs,
    filterValues,
    handleFilterChange,
    resetFilters,
    instrumentTypeFilters,
    toggleInstrumentTypeFilter,
    assetClassOptions,
    strategyFilter,
  } = usePositionsData();

  const assetClassLabel =
    instrumentTypeFilters.length === 0
      ? "All asset classes"
      : instrumentTypeFilters.length === 1
        ? instrumentTypeFilters[0]
        : `${instrumentTypeFilters.length} classes`;

  const columns: DataTableColumn<PositionRecord>[] = React.useMemo(
    () => [
      {
        key: "instrument",
        label: "Instrument",
        sortable: true,
        accessor: (row) => {
          const canonicalId = deriveCanonicalId(row);
          return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <Link
                href={getInstrumentRoute(row.instrument, classifyInstrument(row.instrument))}
                className="font-mono font-medium text-primary hover:underline cursor-pointer"
              >
                {formatInstrumentId(row.instrument)}
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
            <span className="text-[10px] text-muted-foreground">{row.strategy_name}</span>
          </div>
          );
        },
        minWidth: 160,
      },
      {
        key: "side",
        label: "Side",
        sortable: true,
        align: "center" as const,
        accessor: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px]",
              row.side === "LONG"
                ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
                : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]",
            )}
          >
            {row.side === "LONG" ? (
              <ArrowUpRight className="size-2.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="size-2.5 mr-0.5" />
            )}
            {row.side}
          </Badge>
        ),
      },
      {
        key: "quantity",
        label: "Quantity",
        sortable: true,
        align: "right" as const,
        accessor: (row) => row.quantity.toLocaleString(),
      },
      {
        key: "entry_price",
        label: "Entry Price",
        sortable: true,
        align: "right" as const,
        accessor: (row) =>
          `$${row.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        key: "current_price",
        label: "Current Price",
        sortable: true,
        align: "right" as const,
        accessor: (row) =>
          `$${row.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        key: "today_pnl",
        label: "Today's P&L",
        sortable: true,
        align: "right" as const,
        accessor: (row) => <PnlCell abs={row.today_pnl} pct={row.today_pnl_pct} />,
      },
      {
        key: "net_pnl",
        label: "Net P&L",
        sortable: true,
        align: "right" as const,
        accessor: (row) => <PnlCell abs={row.net_pnl} pct={row.net_pnl_pct} />,
      },
      {
        key: "net_delta",
        label: "Net Delta",
        sortable: true,
        align: "right" as const,
        accessor: (row) =>
          row.net_delta != null ? (
            <span
              className={cn(
                "font-mono text-[11px]",
                row.net_delta > 0 ? "pnl-positive" : row.net_delta < 0 ? "pnl-negative" : "text-muted-foreground",
              )}
            >
              {row.net_delta > 0 ? "+" : ""}
              {row.net_delta.toFixed(2)}
            </span>
          ) : (
            <span className="text-muted-foreground text-[10px]">--</span>
          ),
      },
      {
        key: "health_factor",
        label: "HF",
        sortable: true,
        align: "right" as const,
        accessor: (row) =>
          row.health_factor != null ? (
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[10px] px-1.5 py-0",
                row.health_factor >= 1.5
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : row.health_factor >= 1.25
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/20 text-rose-400 border-rose-500/30",
              )}
            >
              {row.health_factor.toFixed(2)}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-[10px]">--</span>
          ),
      },
      {
        key: "venue",
        label: "Venue",
        sortable: true,
        accessor: "venue" as keyof PositionRecord,
      },
      {
        key: "updated_at",
        label: "Updated",
        sortable: true,
        align: "right" as const,
        accessor: "updated_at" as keyof PositionRecord,
        className: "text-muted-foreground",
      },
      {
        key: "trades",
        label: "Trades",
        sortable: false,
        align: "right" as const,
        accessor: (row) => (
          <Link
            href={`/services/trading/positions/trades?position_id=${encodeURIComponent(row.id)}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            View trades
            <ExternalLink className="size-3 shrink-0" />
          </Link>
        ),
        minWidth: 110,
      },
    ],
    [classifyInstrument, getInstrumentRoute],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
        <Spinner className="size-4" />
        <span className="text-xs">Loading positions...</span>
      </div>
    );
  }

  if (positionsError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-xs">Failed to load positions</p>
        <Button variant="outline" size="sm" onClick={() => refetchPositions()}>
          <RefreshCw className="size-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end px-3 py-1.5 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <DataFreshness lastUpdated={new Date()} isWebSocket={isLive} isBatch={!isLive} />
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => refetchPositions()}>
            <RefreshCw className="size-3 mr-1" />
            Refresh
          </Button>
          <ExportDropdown
            data={filteredPositions as unknown as Record<string, unknown>[]}
            columns={EXPORT_COLUMNS}
            filename="positions"
          />
        </div>
      </div>
      <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
        <FilterBar
          filters={filterDefs}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={resetFilters}
          className="border-b-0 px-0 py-0"
        />
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                {assetClassLabel}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <p className="text-[10px] text-muted-foreground mb-2">Asset class (multi-select)</p>
              <div className="space-y-2">
                {assetClassOptions.map((opt: AssetClassFilter) => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox
                      id={`asset-${opt}`}
                      checked={instrumentTypeFilters.includes(opt)}
                      onCheckedChange={() => toggleInstrumentTypeFilter(opt)}
                    />
                    <Label htmlFor={`asset-${opt}`} className="text-xs font-normal cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
                Empty selection = all classes
              </p>
            </PopoverContent>
          </Popover>
          {strategyFilter !== "all" && (
            <Link href={`/services/trading/strategies/${strategyFilter}`} className="ml-auto">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                View Strategy Details
              </Button>
            </Link>
          )}
        </div>
      </div>
      <DataTableWidget<PositionRecord>
        columns={columns}
        data={filteredPositions}
        rowKey={(row) => row.id}
        compact
        stickyFirstColumn
        emptyMessage="No positions match your filters"
      />
    </div>
  );
}
