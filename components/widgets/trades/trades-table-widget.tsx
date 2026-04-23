"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig, TableFilterConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/utils/export";
import { formatDate } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, X } from "lucide-react";
import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useTradesData, type TradeRecord } from "./trades-data-context";

// ---------------------------------------------------------------------------
// Status / side colour helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  settled: "border-[var(--status-live)] text-[var(--status-live)]",
  pending: "border-[var(--status-warning)] text-[var(--status-warning)]",
};

function getStatusColor(status: string): string {
  return STATUS_COLORS[status.toLowerCase()] ?? "border-muted-foreground text-muted-foreground";
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function buildColumns(): ColumnDef<TradeRecord, unknown>[] {
  return [
    {
      accessorKey: "id",
      header: "Trade ID",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue<string>("id")}</span>,
    },
    {
      accessorKey: "timestamp",
      header: "Time",
      meta: { type: "datetime" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {formatDate(row.getValue<string>("timestamp"), "long")}
        </div>
      ),
    },
    {
      accessorKey: "instrument",
      header: "Instrument",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono font-medium text-foreground">{row.getValue<string>("instrument")}</span>
      ),
    },
    {
      accessorKey: "venue",
      header: "Venue",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs">{row.getValue<string>("venue")}</span>,
    },
    {
      accessorKey: "side",
      header: "Side",
      meta: { type: "badge" },
      enableSorting: true,
      cell: ({ row }) => {
        const side = row.getValue<"buy" | "sell">("side");
        return (
          <div className="flex justify-center">
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
              {side.toUpperCase()}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      meta: { type: "number" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono">{row.getValue<number>("quantity").toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      meta: { type: "currency" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          $
          {row
            .getValue<number>("price")
            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
      ),
    },
    {
      accessorKey: "fees",
      header: "Fees",
      meta: { type: "currency" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono text-muted-foreground">${row.getValue<number>("fees").toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "total",
      header: "Total",
      meta: { type: "currency" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono font-medium">${row.getValue<number>("total").toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "tradeType",
      header: "Type",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs">{row.getValue<string>("tradeType")}</span>,
    },
    {
      accessorKey: "counterparty",
      header: "Counterparty",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs max-w-[140px] truncate block">{row.getValue<string>("counterparty")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { type: "badge" },
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <div className="flex justify-center">
            <Badge variant="outline" className={cn("text-xs capitalize", getStatusColor(status))}>
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "settlementDate",
      header: "Settlement",
      meta: { type: "datetime" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {formatDate(row.getValue<string>("settlementDate"), "short")}
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Export columns
// ---------------------------------------------------------------------------

const TRADE_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "id", header: "Trade ID" },
  { key: "timestamp", header: "Timestamp" },
  { key: "instrument", header: "Instrument" },
  { key: "venue", header: "Venue" },
  { key: "side", header: "Side" },
  { key: "quantity", header: "Quantity", format: "number" },
  { key: "price", header: "Price", format: "currency" },
  { key: "fees", header: "Fees", format: "currency" },
  { key: "total", header: "Total", format: "currency" },
  { key: "tradeType", header: "Type" },
  { key: "counterparty", header: "Counterparty" },
  { key: "status", header: "Status" },
  { key: "settlementDate", header: "Settlement Date" },
];

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

const COLUMNS = buildColumns();

export function TradesTableWidget(_props: WidgetComponentProps) {
  const {
    filteredTrades,
    isLoading,
    positionIdFilter,
    setPositionIdFilter,
    sideFilter,
    setSideFilter,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    venueFilter,
    setVenueFilter,
    searchQuery,
    setSearchQuery,
    resetFilters,
    uniqueVenues,
    activeFilterCount,
  } = useTradesData();

  const filterConfig: TableFilterConfig = {
    search: {
      query: searchQuery,
      onChange: setSearchQuery,
      placeholder: "Search trades…",
    },
    selectFilters: [
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
        onChange: (v) => setSideFilter(v as typeof sideFilter),
        placeholder: "Side",
        allLabel: "Both Sides",
        width: "w-24",
        options: [
          { value: "buy", label: "Buy" },
          { value: "sell", label: "Sell" },
        ],
      },
      {
        value: typeFilter,
        onChange: (v) => setTypeFilter(v as typeof typeFilter),
        placeholder: "Type",
        allLabel: "All Types",
        width: "w-28",
        options: [
          { value: "Exchange", label: "Exchange" },
          { value: "OTC", label: "OTC" },
          { value: "DeFi", label: "DeFi" },
          { value: "Manual", label: "Manual" },
        ],
      },
      {
        value: statusFilter,
        onChange: (v) => setStatusFilter(v as typeof statusFilter),
        placeholder: "Status",
        allLabel: "All Statuses",
        width: "w-28",
        options: [
          { value: "settled", label: "Settled" },
          { value: "pending", label: "Pending" },
        ],
      },
    ],
    activeFilterCount,
    onReset: resetFilters,
  };

  const actionsConfig: TableActionsConfig = {
    extraActions: positionIdFilter ? (
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1 shrink-0"
        onClick={() => setPositionIdFilter("")}
      >
        <X className="size-3" />
        {positionIdFilter}
      </Button>
    ) : undefined,
    export: {
      data: filteredTrades as unknown as Record<string, unknown>[],
      columns: TRADE_EXPORT_COLUMNS,
      filename: "trades",
    },
  };

  return (
    <TableWidget
      columns={COLUMNS}
      data={filteredTrades}
      filterConfig={filterConfig}
      actions={actionsConfig}
      isLoading={isLoading}
      error={null}
      emptyMessage="No trades match your filters"
      enableSorting
      enableColumnVisibility
    />
  );
}
