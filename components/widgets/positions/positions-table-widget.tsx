"use client";

import { FilterBar } from "@/components/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataFreshness } from "@/components/shared/data-freshness";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Spinner } from "@/components/shared/spinner";
import { DataTableWidget, type DataTableColumn } from "@/components/shared/data-table-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/utils/export";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Filter, RefreshCw } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { usePositionsData, type PositionRecord } from "./positions-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "instrument", header: "Instrument" },
  { key: "side", header: "Side" },
  { key: "quantity", header: "Quantity", format: "number" },
  { key: "entry_price", header: "Entry Price", format: "currency" },
  { key: "current_price", header: "Current Price", format: "currency" },
  { key: "pnl", header: "P&L", format: "currency" },
  { key: "venue", header: "Venue" },
  { key: "updated_at", header: "Updated" },
];

export function PositionsTableWidget(_props: WidgetComponentProps) {
  const {
    filteredPositions,
    isLoading,
    positionsError,
    refetchPositions,
    isLive,
    classifyInstrument,
    getInstrumentRoute,
    isDeFiVenue,
    filterDefs,
    filterValues,
    handleFilterChange,
    resetFilters,
    instrumentTypeFilter,
    setInstrumentTypeFilter,
    instrumentTypes,
    strategyFilter,
  } = usePositionsData();

  const [showFilters, setShowFilters] = React.useState(true);

  const columns: DataTableColumn<PositionRecord>[] = React.useMemo(
    () => [
      {
        key: "instrument",
        label: "Instrument",
        sortable: true,
        accessor: (row) => (
          <div className="flex flex-col">
            <Link
              href={getInstrumentRoute(row.instrument, classifyInstrument(row.instrument))}
              className="font-mono font-medium text-primary hover:underline cursor-pointer"
            >
              {row.instrument}
            </Link>
            <span className="text-[10px] text-muted-foreground">{row.strategy_name}</span>
          </div>
        ),
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
        key: "pnl",
        label: "P&L",
        sortable: true,
        align: "right" as const,
        accessor: (row) => (
          <div className="flex flex-col items-end">
            <span className={cn("font-mono font-medium", row.pnl >= 0 ? "pnl-positive" : "pnl-negative")}>
              {row.pnl >= 0 ? "+" : ""}${formatCurrency(Math.abs(row.pnl))}
            </span>
            <span
              className={cn(
                "text-[10px] font-mono",
                row.pnl_pct >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]",
              )}
            >
              {row.pnl_pct >= 0 ? "+" : ""}
              {formatPercent(row.pnl_pct, 2)}
            </span>
          </div>
        ),
      },
      {
        key: "venue",
        label: "Venue",
        sortable: true,
        accessor: "venue" as keyof PositionRecord,
      },
      {
        key: "health_factor",
        label: "Health",
        sortable: true,
        align: "right" as const,
        accessor: (row) => {
          if (!isDeFiVenue(row.venue) || row.health_factor == null) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="flex flex-col items-end">
              <span
                className={cn(
                  "font-mono font-medium",
                  row.health_factor >= 2.0 && "text-emerald-500",
                  row.health_factor >= 1.5 && row.health_factor < 2.0 && "text-amber-500",
                  row.health_factor < 1.5 && "text-rose-500",
                )}
              >
                {formatNumber(row.health_factor, 2)}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {formatPercent(((row.health_factor - 1.0) / row.health_factor) * 100, 0)} to liq
              </span>
            </div>
          );
        },
      },
      {
        key: "updated_at",
        label: "Updated",
        sortable: true,
        align: "right" as const,
        accessor: "updated_at" as keyof PositionRecord,
        className: "text-muted-foreground",
      },
    ],
    [classifyInstrument, getInstrumentRoute, isDeFiVenue],
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
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
        <button
          onClick={() => setShowFilters((f) => !f)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Filter className="size-3" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
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
      {showFilters && (
        <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
          <FilterBar
            filters={filterDefs}
            values={filterValues}
            onChange={handleFilterChange}
            onReset={resetFilters}
            className="border-b-0 px-0 py-0"
          />
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {instrumentTypes.map((type) => (
              <Button
                key={type}
                variant={instrumentTypeFilter === type ? "default" : "outline"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setInstrumentTypeFilter(type)}
              >
                {type}
              </Button>
            ))}
            {strategyFilter !== "all" && (
              <Link href={`/services/trading/strategies/${strategyFilter}`} className="ml-auto">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  View Strategy Details
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
      <DataTableWidget<PositionRecord>
        columns={columns}
        data={filteredPositions}
        rowKey={(row) => row.id}
        compact
        emptyMessage="No positions match your filters"
      />
    </div>
  );
}
