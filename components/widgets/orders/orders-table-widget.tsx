"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig, TableFilterConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/utils/export";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, Pencil, XCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { classifyInstrument, useOrdersData, type AssetClassFilter, type OrderRecord } from "./orders-data-context";

const STATUS_COLORS: Record<string, string> = {
  FILLED: "border-[var(--status-live)] text-[var(--status-live)]",
  PARTIAL: "border-[var(--status-warning)] text-[var(--status-warning)]",
  OPEN: "border-[var(--chart-1)] text-[var(--chart-1)]",
  CANCELLED: "border-muted-foreground text-muted-foreground",
  REJECTED: "border-status-critical text-status-critical",
};

function getStatusColor(status: string): string {
  const upper = status.toUpperCase();
  for (const [key, val] of Object.entries(STATUS_COLORS)) {
    if (upper.includes(key)) return val;
  }
  return "border-muted-foreground text-muted-foreground";
}

function isActionable(status: string): boolean {
  const s = status.toUpperCase();
  return s === "OPEN" || s === "PENDING" || s === "PARTIALLY_FILLED";
}

function getInstrumentRoute(instrument: string, type: string): string {
  const asset = instrument.split("-")[0].split(":")[0].toUpperCase();
  switch (type) {
    case "Spot":
    case "Perp":
      return "/services/trading/terminal";
    case "Options":
      return `/services/trading/options?tab=chain&asset=${asset}`;
    case "Futures":
      return `/services/trading/options?tab=futures&asset=${asset}`;
    case "DeFi":
      return "/services/trading/defi";
    case "Prediction":
      return "/services/trading/sports";
    default:
      return "/services/trading/terminal";
  }
}

function buildColumns(
  onCancel: (orderId: string) => void,
  onAmend: (order: OrderRecord) => void,
): ColumnDef<OrderRecord, unknown>[] {
  return [
    {
      accessorKey: "order_id",
      header: "Order ID",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue<string>("order_id")}</span>,
    },
    {
      accessorKey: "instrument",
      header: "Instrument",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => {
        const instrument = row.getValue<string>("instrument");
        const type = classifyInstrument(instrument);
        return (
          <Link
            href={getInstrumentRoute(instrument, type)}
            className="font-mono font-medium text-primary hover:underline cursor-pointer"
          >
            {instrument}
          </Link>
        );
      },
    },
    {
      accessorKey: "side",
      header: "Side",
      meta: { type: "badge" },
      enableSorting: true,
      cell: ({ row }) => {
        const side = row.getValue<"BUY" | "SELL">("side");
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-xs",
                side === "BUY"
                  ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
                  : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]",
              )}
            >
              {side === "BUY" ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
              {side}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs uppercase">{row.getValue<string>("type")}</span>,
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
            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: "mark_price",
      header: "Mark",
      meta: { type: "currency" },
      enableSorting: true,
      cell: ({ row }) => {
        const mark = row.getValue<number>("mark_price");
        return (
          <div className="text-right font-mono text-muted-foreground">
            {mark ? `$${mark.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "edge_bps",
      header: "Edge",
      meta: { type: "number" },
      enableSorting: true,
      cell: ({ row }) => {
        const edge = row.getValue<number>("edge_bps") ?? 0;
        return (
          <div className={cn("text-right font-mono text-xs", edge >= 0 ? "text-pnl-positive" : "text-pnl-negative")}>
            {edge >= 0 ? "+" : ""}
            {formatNumber(edge, 1)} bps
          </div>
        );
      },
    },
    {
      accessorKey: "instant_pnl",
      header: "Instant P&L",
      meta: { type: "currency" },
      enableSorting: true,
      cell: ({ row }) => {
        const pnl = row.getValue<number>("instant_pnl") ?? 0;
        const fmt = Math.abs(pnl) >= 1000 ? `$${formatNumber(pnl / 1000, 1)}K` : `$${formatNumber(pnl, 0)}`;
        return (
          <div className={cn("text-right font-mono font-medium", pnl >= 0 ? "text-pnl-positive" : "text-pnl-negative")}>
            {pnl >= 0 ? "+" : ""}
            {fmt}
          </div>
        );
      },
    },
    {
      accessorKey: "strategy_name",
      header: "Strategy",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground truncate max-w-24 block">
          {row.getValue<string>("strategy_name") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Client",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => {
        const val = row.getValue<string | undefined>("client_name");
        return val ? <span className="text-xs">{val}</span> : <span className="text-muted-foreground text-xs">--</span>;
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => {
        const val = row.getValue<string | undefined>("category");
        return val ? <span className="text-xs">{val}</span> : <span className="text-muted-foreground text-xs">--</span>;
      },
    },
    {
      accessorKey: "strategy_family",
      header: "Family",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => {
        const val = row.getValue<string | undefined>("strategy_family");
        return val ? <span className="text-xs">{val}</span> : <span className="text-muted-foreground text-xs">--</span>;
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
      accessorKey: "filled",
      header: "Filled",
      meta: { type: "number" },
      enableSorting: true,
      cell: ({ row }) => {
        const filled = row.getValue<number>("filled");
        const quantity = row.original.quantity;
        const fillPct = quantity > 0 ? (filled / quantity) * 100 : 0;
        return (
          <div className="flex flex-col items-end">
            <span className="font-mono">{filled.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{formatPercent(fillPct, 0)}</span>
          </div>
        );
      },
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
            <Badge variant="outline" className={cn("text-xs", getStatusColor(status))}>
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "venue",
      header: "Venue",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm">{row.getValue<string>("venue")}</span>,
    },
    {
      accessorKey: "created_at",
      header: "Created",
      meta: { type: "datetime" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right text-xs text-muted-foreground font-mono">{row.getValue<string>("created_at")}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      meta: { type: "actions" },
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const status = row.original.status;
        if (!isActionable(status)) return <div className="text-center text-xs text-muted-foreground">—</div>;
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onCancel(row.original.order_id)}
            >
              <XCircle className="size-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
              onClick={() => onAmend(row.original)}
            >
              <Pencil className="size-3.5 mr-1" />
              Amend
            </Button>
          </div>
        );
      },
    },
  ];
}

const ORDER_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "order_id", header: "Order ID" },
  { key: "instrument", header: "Instrument" },
  { key: "side", header: "Side" },
  { key: "type", header: "Type" },
  { key: "price", header: "Price", format: "currency" },
  { key: "quantity", header: "Quantity", format: "number" },
  { key: "filled", header: "Filled", format: "number" },
  { key: "status", header: "Status" },
  { key: "venue", header: "Venue" },
  { key: "client_name", header: "Client" },
  { key: "category", header: "Category" },
  { key: "strategy_family", header: "Family" },
  { key: "created_at", header: "Created" },
];

export function OrdersTableWidget(_props: WidgetComponentProps) {
  const {
    filteredOrders,
    isLoading,
    error,
    refetch,
    cancelOrder,
    openAmendDialog,
    searchQuery,
    setSearchQuery,
    venueFilter,
    setVenueFilter,
    statusFilter,
    setStatusFilter,
    strategyFilter,
    setStrategyFilter,
    sideFilter,
    setSideFilter,
    instrumentTypeFilters,
    toggleInstrumentTypeFilter,
    assetClassOptions,
    uniqueVenues,
    uniqueStatuses,
    uniqueStrategies,
    resetFilters,
  } = useOrdersData();

  const activeFilterCount =
    [
      searchQuery,
      venueFilter !== "all" ? venueFilter : "",
      statusFilter !== "all" ? statusFilter : "",
      strategyFilter !== "all" ? strategyFilter : "",
      sideFilter !== "all" ? sideFilter : "",
    ].filter(Boolean).length + instrumentTypeFilters.length;

  const columns = React.useMemo(() => buildColumns(cancelOrder, openAmendDialog), [cancelOrder, openAmendDialog]);

  const filterConfig: TableFilterConfig = {
    search: {
      query: searchQuery,
      onChange: setSearchQuery,
      placeholder: "Search orders…",
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
        value: statusFilter,
        onChange: setStatusFilter,
        placeholder: "Status",
        allLabel: "All Statuses",
        width: "w-28",
        options: uniqueStatuses.filter(Boolean).map((s) => ({ value: s, label: s })),
      },
      {
        value: sideFilter,
        onChange: (v) => setSideFilter(v as "all" | "BUY" | "SELL"),
        placeholder: "Side",
        allLabel: "Both Sides",
        width: "w-24",
        options: [
          { value: "BUY", label: "Buy" },
          { value: "SELL", label: "Sell" },
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
    onRefresh: refetch,
    extraActions:
      strategyFilter !== "all" ? (
        <Link href={`/services/trading/strategies/${strategyFilter}`} className="shrink-0">
          <Button variant="outline" size="sm" className="h-7 text-xs">
            View Strategy
          </Button>
        </Link>
      ) : undefined,
    export: {
      data: filteredOrders as unknown as Record<string, unknown>[],
      columns: ORDER_EXPORT_COLUMNS,
      filename: "orders",
    },
  };

  return (
    <TableWidget
      data-testid="orders-table-widget"
      columns={columns}
      data={filteredOrders}
      filterConfig={filterConfig}
      actions={actionsConfig}
      isLoading={isLoading}
      error={error ? "Failed to load orders" : null}
      onRetry={refetch}
      emptyMessage="No orders match your filters"
      enableSorting
      enableColumnVisibility
    />
  );
}
