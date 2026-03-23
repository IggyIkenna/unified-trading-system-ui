"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ExportDropdown } from "@/components/ui/export-dropdown"
import type { ExportColumn } from "@/lib/utils/export"
import { useOrders } from "@/hooks/api/use-orders"
import { useGlobalScope } from "@/lib/stores/global-scope-store"
import { FilterBar, type FilterDefinition } from "@/components/platform/filter-bar"

// Order shape from the API
interface OrderRecord {
  order_id: string
  instrument: string
  side: "BUY" | "SELL"
  type: string
  price: number
  mark_price: number
  quantity: number
  filled: number
  status: string
  venue: string
  strategy_id: string
  strategy_name: string
  edge_bps: number
  instant_pnl: number
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  FILLED: "border-[var(--status-live)] text-[var(--status-live)]",
  PARTIAL: "border-[var(--status-warning)] text-[var(--status-warning)]",
  OPEN: "border-[var(--chart-1)] text-[var(--chart-1)]",
  CANCELLED: "border-muted-foreground text-muted-foreground",
  REJECTED: "border-[var(--status-error)] text-[var(--status-error)]",
}

function getStatusColor(status: string): string {
  const upper = status.toUpperCase()
  for (const [key, val] of Object.entries(STATUS_COLORS)) {
    if (upper.includes(key)) return val
  }
  return "border-muted-foreground text-muted-foreground"
}

const columns: ColumnDef<OrderRecord, unknown>[] = [
  {
    accessorKey: "order_id",
    header: "Order ID",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue<string>("order_id")}</span>
    ),
  },
  {
    accessorKey: "instrument",
    header: "Instrument",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.getValue<string>("instrument")}</span>
    ),
  },
  {
    accessorKey: "side",
    header: () => <span className="flex justify-center">Side</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const side = row.getValue<"BUY" | "SELL">("side")
      return (
        <div className="text-center">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs",
              side === "BUY"
                ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
                : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]"
            )}
          >
            {side === "BUY" ? (
              <ArrowUpRight className="size-3 mr-1" />
            ) : (
              <ArrowDownRight className="size-3 mr-1" />
            )}
            {side}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs uppercase">{row.getValue<string>("type")}</span>
    ),
  },
  {
    accessorKey: "price",
    header: () => <span className="flex justify-end">Price</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        ${row.getValue<number>("price").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    ),
  },
  {
    accessorKey: "mark_price",
    header: () => <span className="flex justify-end">Mark</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const mark = row.getValue<number>("mark_price")
      return (
        <div className="text-right font-mono text-muted-foreground">
          {mark ? `$${mark.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "edge_bps",
    header: () => <span className="flex justify-end">Edge</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const edge = row.getValue<number>("edge_bps") ?? 0
      return (
        <div className={cn("text-right font-mono text-xs", edge >= 0 ? "text-emerald-400" : "text-rose-400")}>
          {edge >= 0 ? "+" : ""}{edge.toFixed(1)} bps
        </div>
      )
    },
  },
  {
    accessorKey: "instant_pnl",
    header: () => <span className="flex justify-end">Instant P&L</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const pnl = row.getValue<number>("instant_pnl") ?? 0
      const fmt = Math.abs(pnl) >= 1000 ? `$${(pnl / 1000).toFixed(1)}K` : `$${pnl.toFixed(0)}`
      return (
        <div className={cn("text-right font-mono font-medium", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
          {pnl >= 0 ? "+" : ""}{fmt}
        </div>
      )
    },
  },
  {
    accessorKey: "strategy_name",
    header: "Strategy",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground truncate max-w-24 block">{row.getValue<string>("strategy_name") || "—"}</span>
    ),
  },
  {
    accessorKey: "quantity",
    header: () => <span className="flex justify-end">Qty</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {row.getValue<number>("quantity").toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "filled",
    header: () => <span className="flex justify-end">Filled</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const filled = row.getValue<number>("filled")
      const quantity = row.original.quantity
      const fillPct = quantity > 0 ? (filled / quantity) * 100 : 0
      return (
        <div className="flex flex-col items-end">
          <span className="font-mono">{filled.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground">{fillPct.toFixed(0)}%</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => <span className="flex justify-center">Status</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.getValue<string>("status")
      return (
        <div className="text-center">
          <Badge variant="outline" className={cn("text-xs", getStatusColor(status))}>
            {status}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "venue",
    header: "Venue",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue<string>("venue")}</span>
    ),
  },
  {
    accessorKey: "created_at",
    header: () => <span className="flex justify-end">Created</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right text-xs text-muted-foreground">
        {row.getValue<string>("created_at")}
      </div>
    ),
  },
]

export default function OrdersPage() {
  const { data: ordersRaw, isLoading, error, refetch } = useOrders()
  const { scope: globalScope } = useGlobalScope()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [venueFilter, setVenueFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Coerce API response to typed array
  const orders: OrderRecord[] = React.useMemo(() => {
    if (!ordersRaw) return []
    const raw = ordersRaw as Record<string, unknown>
    const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).orders
    return Array.isArray(arr) ? (arr as OrderRecord[]) : []
  }, [ordersRaw])

  // Apply global scope filter
  const scopedOrders = React.useMemo(() => {
    if (globalScope.strategyIds.length === 0) return orders
    // Filter orders by strategy_id if available, otherwise show all
    return orders.filter(o =>
      !o.strategy_id || globalScope.strategyIds.includes(o.strategy_id)
    )
  }, [orders, globalScope.strategyIds])

  // Filtered orders
  const filteredOrders = React.useMemo(() => {
    let result = scopedOrders

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(o =>
        o.order_id.toLowerCase().includes(query) ||
        o.instrument.toLowerCase().includes(query) ||
        o.venue.toLowerCase().includes(query)
      )
    }

    if (venueFilter !== "all") {
      result = result.filter(o => o.venue === venueFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter(o => o.status.toUpperCase() === statusFilter)
    }

    return result
  }, [orders, searchQuery, venueFilter, statusFilter])

  // Unique values for filters
  const uniqueVenues = React.useMemo(() =>
    [...new Set(orders.map(o => o.venue))].sort(),
    [orders]
  )

  const uniqueStatuses = React.useMemo(() =>
    [...new Set(orders.map(o => o.status.toUpperCase()))].sort(),
    [orders]
  )

  // FilterBar definitions
  const orderFilterDefs: FilterDefinition[] = React.useMemo(() => [
    {
      key: "search",
      label: "Search",
      type: "search" as const,
      placeholder: "Search by order ID, instrument, venue...",
    },
    {
      key: "venue",
      label: "Venue",
      type: "select" as const,
      options: uniqueVenues.map(v => ({ value: v, label: v })),
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: uniqueStatuses.map(s => ({ value: s, label: s })),
    },
  ], [uniqueVenues, uniqueStatuses])

  const orderFilterValues = React.useMemo(() => ({
    search: searchQuery || undefined,
    venue: venueFilter !== "all" ? venueFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }), [searchQuery, venueFilter, statusFilter])

  const handleFilterChange = React.useCallback((key: string, value: unknown) => {
    switch (key) {
      case "search":
        setSearchQuery((value as string) || "")
        break
      case "venue":
        setVenueFilter((value as string) || "all")
        break
      case "status":
        setStatusFilter((value as string) || "all")
        break
    }
  }, [])

  const handleFilterReset = React.useCallback(() => {
    setSearchQuery("")
    setVenueFilter("all")
    setStatusFilter("all")
  }, [])

  // Summary counts
  const summary = React.useMemo(() => ({
    total: filteredOrders.length,
    open: filteredOrders.filter(o => o.status.toUpperCase().includes("OPEN")).length,
    filled: filteredOrders.filter(o => o.status.toUpperCase().includes("FILLED")).length,
    partial: filteredOrders.filter(o => o.status.toUpperCase().includes("PARTIAL")).length,
  }), [filteredOrders])

  const orderExportColumns: ExportColumn[] = React.useMemo(() => [
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
  ], [])

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading orders...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertCircle className="size-8 text-destructive" />
        <p>Failed to load orders</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowUpDown className="size-5 text-emerald-400" />
          <h1 className="text-xl font-semibold">Orders</h1>
          <Badge variant="outline" className="text-xs font-mono">{summary.total} orders</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <ExportDropdown
            data={filteredOrders as unknown as Record<string, unknown>[]}
            columns={orderExportColumns}
            filename="orders"
          />
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs border-[var(--chart-1)] text-[var(--chart-1)]">
          {summary.open} Open
        </Badge>
        <Badge variant="outline" className="text-xs border-[var(--status-warning)] text-[var(--status-warning)]">
          {summary.partial} Partial
        </Badge>
        <Badge variant="outline" className="text-xs border-[var(--status-live)] text-[var(--status-live)]">
          {summary.filled} Filled
        </Badge>
      </div>

      {/* Unified Filter Bar */}
      <FilterBar
        filters={orderFilterDefs}
        values={orderFilterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        className="-mx-6 rounded-none"
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, instrument, venue..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={venueFilter} onValueChange={setVenueFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venues</SelectItem>
            {uniqueVenues.map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredOrders}
            enableSorting
            enableColumnVisibility
            emptyMessage="No orders match your filters"
          />
        </CardContent>
      </Card>
    </main>
  )
}
