"use client";

import { FilterBar } from "@/components/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/shared/data-table";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/utils/export";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, ArrowDownRight, ArrowUpRight, ChevronDown, Pencil, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { classifyInstrument, useOrdersData, type AssetClassFilter, type OrderRecord } from "./orders-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

const STATUS_COLORS: Record<string, string> = {
  FILLED: "border-[var(--status-live)] text-[var(--status-live)]",
  PARTIAL: "border-[var(--status-warning)] text-[var(--status-warning)]",
  OPEN: "border-[var(--chart-1)] text-[var(--chart-1)]",
  CANCELLED: "border-muted-foreground text-muted-foreground",
  REJECTED: "border-[var(--status-error)] text-[var(--status-error)]",
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
      enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue<string>("order_id")}</span>,
    },
    {
      accessorKey: "instrument",
      header: "Instrument",
      enableSorting: false,
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
      header: () => <span className="flex justify-center">Side</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const side = row.getValue<"BUY" | "SELL">("side");
        return (
          <div className="text-center">
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
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs uppercase">{row.getValue<string>("type")}</span>,
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
      accessorKey: "mark_price",
      header: () => <span className="flex justify-end">Mark</span>,
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
      header: () => <span className="flex justify-end">Edge</span>,
      enableSorting: true,
      cell: ({ row }) => {
        const edge = row.getValue<number>("edge_bps") ?? 0;
        return (
          <div className={cn("text-right font-mono text-xs", edge >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {edge >= 0 ? "+" : ""}
            {formatNumber(edge, 1)} bps
          </div>
        );
      },
    },
    {
      accessorKey: "instant_pnl",
      header: () => <span className="flex justify-end">Instant P&L</span>,
      enableSorting: true,
      cell: ({ row }) => {
        const pnl = row.getValue<number>("instant_pnl") ?? 0;
        const fmt = Math.abs(pnl) >= 1000 ? `$${formatNumber(pnl / 1000, 1)}K` : `$${formatNumber(pnl, 0)}`;
        return (
          <div className={cn("text-right font-mono font-medium", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {pnl >= 0 ? "+" : ""}
            {fmt}
          </div>
        );
      },
    },
    {
      accessorKey: "strategy_name",
      header: "Strategy",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground truncate max-w-24 block">
          {row.getValue<string>("strategy_name") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: () => <span className="flex justify-end">Qty</span>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono">{row.getValue<number>("quantity").toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "filled",
      header: () => <span className="flex justify-end">Filled</span>,
      enableSorting: true,
      cell: ({ row }) => {
        const filled = row.getValue<number>("filled");
        const quantity = row.original.quantity;
        const fillPct = quantity > 0 ? (filled / quantity) * 100 : 0;
        return (
          <div className="flex flex-col items-end">
            <span className="font-mono">{filled.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">{formatPercent(fillPct, 0)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="flex justify-center">Status</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <div className="text-center">
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
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm">{row.getValue<string>("venue")}</span>,
    },
    {
      accessorKey: "created_at",
      header: () => <span className="flex justify-end">Created</span>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right text-xs text-muted-foreground">{row.getValue<string>("created_at")}</div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="flex justify-center">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.original.status;
        if (!isActionable(status)) return <div className="text-center text-xs text-muted-foreground">—</div>;
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-400/10"
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
    filterDefs,
    filterValues,
    handleFilterChange,
    resetFilters,
    instrumentTypeFilters,
    toggleInstrumentTypeFilter,
    assetClassOptions,
    strategyFilter,
  } = useOrdersData();

  const assetClassLabel =
    instrumentTypeFilters.length === 0
      ? "All asset classes"
      : instrumentTypeFilters.length === 1
        ? instrumentTypeFilters[0]
        : `${instrumentTypeFilters.length} classes`;

  const columns = React.useMemo(() => buildColumns(cancelOrder, openAmendDialog), [cancelOrder, openAmendDialog]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
        <Spinner className="size-5" />
        <span>Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <AlertCircle className="size-8 text-destructive" />
        <p>Failed to load orders</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      <div className="flex items-center justify-end px-3 py-1.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => refetch()}>
            <RefreshCw className="size-3" />
            Refresh
          </Button>
          <ExportDropdown
            data={filteredOrders as unknown as Record<string, unknown>[]}
            columns={ORDER_EXPORT_COLUMNS}
            filename="orders"
          />
        </div>
      </div>
      <div className="px-3 py-2 border-b border-border/30 bg-muted/20 shrink-0">
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
                      id={`orders-asset-${opt}`}
                      checked={instrumentTypeFilters.includes(opt)}
                      onCheckedChange={() => toggleInstrumentTypeFilter(opt)}
                    />
                    <Label htmlFor={`orders-asset-${opt}`} className="text-xs font-normal cursor-pointer">
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
      <div className="flex-1 overflow-auto min-h-0">
        <Card className="border-0 rounded-none h-full">
          <CardContent className="p-0 overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredOrders}
              enableSorting
              enableColumnVisibility
              emptyMessage="No orders match your filters"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
