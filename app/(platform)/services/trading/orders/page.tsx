"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { formatCurrency } from "@/lib/reference-data"
import { useOrders } from "@/hooks/api/use-orders"
import { FilterBar, type FilterDefinition } from "@/components/platform/filter-bar"

// Order shape from the API
interface OrderRecord {
  order_id: string
  instrument: string
  side: "BUY" | "SELL"
  type: string
  price: number
  quantity: number
  filled: number
  status: string
  venue: string
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

export default function OrdersPage() {
  const { data: ordersRaw, isLoading, error, refetch } = useOrders()

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

  // Filtered orders
  const filteredOrders = React.useMemo(() => {
    let result = orders

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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Order ID</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead className="text-center">Side</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Filled</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const fillPct = order.quantity > 0 ? (order.filled / order.quantity) * 100 : 0
                return (
                  <TableRow key={order.order_id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{order.order_id}</TableCell>
                    <TableCell className="font-mono font-medium">{order.instrument}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-xs",
                          order.side === "BUY"
                            ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
                            : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]"
                        )}
                      >
                        {order.side === "BUY" ? (
                          <ArrowUpRight className="size-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="size-3 mr-1" />
                        )}
                        {order.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs uppercase">{order.type}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${order.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {order.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono">{order.filled.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground">{fillPct.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{order.venue}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{order.created_at}</TableCell>
                  </TableRow>
                )
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No orders match your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
