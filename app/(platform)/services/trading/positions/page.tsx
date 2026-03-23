"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataFreshness } from "@/components/ui/data-freshness"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ExecutionModeToggle, ExecutionModeIndicator } from "@/components/trading/execution-mode-toggle"
import { useExecutionMode } from "@/lib/execution-mode-context"
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Activity,
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ExportDropdown } from "@/components/ui/export-dropdown"
import type { ExportColumn } from "@/lib/utils/export"
import { formatCurrency } from "@/lib/reference-data"
import { usePositions, useBalances } from "@/hooks/api/use-positions"
import { useGlobalScope } from "@/lib/stores/global-scope-store"
import { FilterBar, useFilterState, type FilterDefinition } from "@/components/platform/filter-bar"
import { useWebSocket } from "@/hooks/use-websocket"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"

// DeFi venues that may have health factors
const DEFI_VENUES = new Set(["AAVE_V3", "COMPOUND_V3", "AAVE", "COMPOUND", "MORPHO", "EULER"])

// Instrument type classification
type InstrumentType = "All" | "Spot" | "Perp" | "Futures" | "Options" | "DeFi" | "Prediction"

const INSTRUMENT_TYPES: InstrumentType[] = ["All", "Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"]

function classifyInstrument(instrument: string): Exclude<InstrumentType, "All"> {
  const upper = instrument.toUpperCase()
  // Options: strike+C/P suffix or contains OPTIONS
  if (/\d+-[CP]$/.test(upper) || upper.includes("OPTIONS")) return "Options"
  // Perp
  if (upper.includes("PERPETUAL") || upper.includes("PERP")) return "Perp"
  // Dated futures: e.g. BTC-26JUN26 (asset-datecode, no strike/C/P)
  if (/^[A-Z]+-\d{1,2}[A-Z]{3}\d{2,4}$/.test(upper)) return "Futures"
  // DeFi
  if (upper.includes("AAVE") || upper.includes("UNISWAP") || upper.includes("LIDO") || upper.includes("WALLET:") || upper.includes("MORPHO")) return "DeFi"
  // Prediction
  if (upper.includes("BETFAIR") || upper.includes("POLYMARKET") || upper.includes("KALSHI") || upper.includes("NBA:") || upper.includes("NFL:") || upper.includes("EPL:") || upper.includes("LALIGA:")) return "Prediction"
  // Default → Spot
  return "Spot"
}

function getInstrumentRoute(instrument: string, type: Exclude<InstrumentType, "All">): string {
  const asset = instrument.split("-")[0].split(":")[0].toUpperCase()
  switch (type) {
    case "Spot":
    case "Perp":
      return "/services/trading/terminal"
    case "Options":
      return `/services/trading/options?tab=chain&asset=${asset}`
    case "Futures":
      return `/services/trading/options?tab=futures&asset=${asset}`
    case "DeFi":
      return "/services/trading/defi"
    case "Prediction":
      return "/services/trading/sports"
  }
}

// Position shape from the API
interface PositionRecord {
  id: string
  strategy_id: string
  strategy_name: string
  instrument: string
  side: "LONG" | "SHORT"
  quantity: number
  entry_price: number
  current_price: number
  pnl: number
  pnl_pct: number
  unrealized_pnl?: number
  venue: string
  margin: number
  leverage: number
  updated_at: string
  health_factor?: number
}

// Balance shape from the API
interface BalanceRecord {
  venue: string
  free: number
  locked: number
  total: number
}

function PositionsPageContent() {
  const searchParams = useSearchParams()
  const strategyIdFilter = searchParams.get("strategy_id")
  const { scope: globalScope } = useGlobalScope()

  const { isLive } = useExecutionMode()
  const { data: positionsRaw, isLoading: positionsLoading, error: positionsError, refetch: refetchPositions } = usePositions()
  const { data: balancesRaw, isLoading: balancesLoading } = useBalances()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [venueFilter, setVenueFilter] = React.useState("all")
  const [sideFilter, setSideFilter] = React.useState<"all" | "LONG" | "SHORT">("all")
  const [strategyFilter, setStrategyFilter] = React.useState(strategyIdFilter || "all")
  const [instrumentTypeFilter, setInstrumentTypeFilter] = React.useState<InstrumentType>("All")
  const [balancesOpen, setBalancesOpen] = React.useState(false)

  // Real-time PnL updates via WebSocket
  const queryClient = useQueryClient()
  const handleWsMessage = React.useCallback((msg: Record<string, unknown>) => {
    if (msg.channel === "positions" && msg.type === "pnl_update") {
      const updatedPositions = (msg.data as Record<string, unknown>)?.positions as PositionRecord[] | undefined
      if (updatedPositions) {
        queryClient.setQueryData(["positions", undefined], (old: unknown) => {
          if (!old) return old
          const oldData = old as Record<string, unknown>
          const oldPositions = (oldData.positions ?? oldData) as PositionRecord[]
          if (!Array.isArray(oldPositions)) return old
          const updateMap = new Map(updatedPositions.map((p) => [p.instrument + p.venue, p]))
          const merged = oldPositions.map((p) => {
            const update = updateMap.get(p.instrument + p.venue)
            if (update) {
              return { ...p, unrealized_pnl: update.unrealized_pnl, current_price: update.current_price }
            }
            return p
          })
          return { ...oldData, positions: merged }
        })
      }
    }
  }, [queryClient])

  useWebSocket({
    url: "ws://localhost:8030/ws",
    enabled: isLive,
    onMessage: handleWsMessage,
  })

  // Update filter when URL param changes
  React.useEffect(() => {
    if (strategyIdFilter) {
      setStrategyFilter(strategyIdFilter)
    }
  }, [strategyIdFilter])

  // Coerce API response to typed arrays, then filter by global scope
  const positions: PositionRecord[] = React.useMemo(() => {
    if (!positionsRaw) return []
    const raw = positionsRaw as Record<string, unknown>
    const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).positions
    let result = Array.isArray(arr) ? (arr as PositionRecord[]) : []
    // Apply global scope strategy filter
    if (globalScope.strategyIds.length > 0) {
      result = result.filter(p => globalScope.strategyIds.includes(p.strategy_id))
    }
    return result
  }, [positionsRaw, globalScope.strategyIds])

  const balances: BalanceRecord[] = React.useMemo(() => {
    if (!balancesRaw) return []
    const raw = balancesRaw as Record<string, unknown>
    const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).balances
    return Array.isArray(arr) ? (arr as BalanceRecord[]) : []
  }, [balancesRaw])

  // Filter positions
  const filteredPositions = React.useMemo(() => {
    let result = positions

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.strategy_name.toLowerCase().includes(query) ||
        p.instrument.toLowerCase().includes(query) ||
        p.venue.toLowerCase().includes(query)
      )
    }

    if (strategyFilter !== "all") {
      result = result.filter(p => p.strategy_id === strategyFilter)
    }

    if (venueFilter !== "all") {
      result = result.filter(p => p.venue === venueFilter)
    }

    if (sideFilter !== "all") {
      result = result.filter(p => p.side === sideFilter)
    }

    if (instrumentTypeFilter !== "All") {
      result = result.filter(p => classifyInstrument(p.instrument) === instrumentTypeFilter)
    }

    return result
  }, [positions, searchQuery, strategyFilter, venueFilter, sideFilter, instrumentTypeFilter])

  // Summary stats
  const summary = React.useMemo(() => ({
    totalPositions: filteredPositions.length,
    totalNotional: filteredPositions.reduce((sum, p) => sum + Math.abs(p.quantity * p.current_price), 0),
    unrealizedPnL: filteredPositions.reduce((sum, p) => sum + p.pnl, 0),
    totalMargin: filteredPositions.reduce((sum, p) => sum + p.margin, 0),
    longExposure: filteredPositions.filter(p => p.side === "LONG").reduce((sum, p) => sum + Math.abs(p.quantity * p.current_price), 0),
    shortExposure: filteredPositions.filter(p => p.side === "SHORT").reduce((sum, p) => sum + Math.abs(p.quantity * p.current_price), 0),
  }), [filteredPositions])

  // Unique values for filters
  const uniqueVenues = React.useMemo(() =>
    [...new Set(positions.map(p => p.venue))].sort(),
    [positions]
  )

  const uniqueStrategies = React.useMemo(() => {
    const map = new Map<string, string>()
    positions.forEach(p => map.set(p.strategy_id, p.strategy_name))
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [positions])

  // FilterBar definitions
  const positionFilterDefs: FilterDefinition[] = React.useMemo(() => [
    {
      key: "search",
      label: "Search",
      type: "search" as const,
      placeholder: "Search positions...",
    },
    {
      key: "strategy",
      label: "Strategy",
      type: "select" as const,
      options: uniqueStrategies.map(([id, name]) => ({ value: id, label: name })),
    },
    {
      key: "venue",
      label: "Venue",
      type: "select" as const,
      options: uniqueVenues.map(v => ({ value: v, label: v })),
    },
    {
      key: "side",
      label: "Side",
      type: "select" as const,
      options: [
        { value: "LONG", label: "Long" },
        { value: "SHORT", label: "Short" },
      ],
    },
  ], [uniqueVenues, uniqueStrategies])

  const positionFilterValues = React.useMemo(() => ({
    search: searchQuery || undefined,
    strategy: strategyFilter !== "all" ? strategyFilter : undefined,
    venue: venueFilter !== "all" ? venueFilter : undefined,
    side: sideFilter !== "all" ? sideFilter : undefined,
  }), [searchQuery, strategyFilter, venueFilter, sideFilter])

  const handleFilterChange = React.useCallback((key: string, value: unknown) => {
    switch (key) {
      case "search":
        setSearchQuery((value as string) || "")
        break
      case "strategy":
        setStrategyFilter((value as string) || "all")
        break
      case "venue":
        setVenueFilter((value as string) || "all")
        break
      case "side":
        setSideFilter(((value as string) || "all") as "all" | "LONG" | "SHORT")
        break
    }
  }, [])

  const handleFilterReset = React.useCallback(() => {
    setSearchQuery("")
    setStrategyFilter("all")
    setVenueFilter("all")
    setSideFilter("all")
    setInstrumentTypeFilter("All")
  }, [])

  const positionExportColumns: ExportColumn[] = React.useMemo(() => [
    { key: "instrument", header: "Instrument" },
    { key: "side", header: "Side" },
    { key: "quantity", header: "Quantity", format: "number" },
    { key: "entry_price", header: "Entry Price", format: "currency" },
    { key: "current_price", header: "Current Price", format: "currency" },
    { key: "pnl", header: "P&L", format: "currency" },
    { key: "venue", header: "Venue" },
    { key: "updated_at", header: "Updated" },
  ], [])

  if (positionsLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading positions...</span>
      </div>
    )
  }

  if (positionsError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertCircle className="size-8 text-destructive" />
        <p>Failed to load positions</p>
        <Button variant="outline" size="sm" onClick={() => refetchPositions()}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Unified Filter Bar */}
      <FilterBar
        filters={positionFilterDefs}
        values={positionFilterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        className="mb-6 -mx-6 rounded-none"
      />

      {/* Instrument Type Filter */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {INSTRUMENT_TYPES.map((type) => (
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
      </div>

      {/* Account Balances - Collapsible */}
      <Collapsible open={balancesOpen} onOpenChange={setBalancesOpen} className="mb-6">
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="size-5 text-muted-foreground" />
                  <CardTitle className="text-base">Account Balances</CardTitle>
                  {!balancesLoading && balances.length > 0 && (
                    <Badge variant="outline" className="ml-2 font-mono">
                      ${formatCurrency(balances.reduce((sum, b) => sum + b.total, 0))} total
                    </Badge>
                  )}
                </div>
                {balancesOpen ? (
                  <ChevronDown className="size-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {balancesLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">Loading balances...</span>
                </div>
              ) : balances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No balance data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Venue</TableHead>
                      <TableHead className="text-right">Free</TableHead>
                      <TableHead className="text-right">Locked</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[200px]">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((balance) => {
                      const utilization = balance.total > 0 ? (balance.locked / balance.total) * 100 : 0
                      return (
                        <TableRow key={balance.venue}>
                          <TableCell className="font-medium">{balance.venue}</TableCell>
                          <TableCell className="text-right font-mono">${formatCurrency(balance.free)}</TableCell>
                          <TableCell className="text-right font-mono">${formatCurrency(balance.locked)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">${formatCurrency(balance.total)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={utilization} className="h-2 flex-1" />
                              <span className="text-xs font-mono w-10 text-right">{utilization.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Positions</span>
            </div>
            <div className="text-2xl font-semibold font-mono">{summary.totalPositions}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Notional</span>
            </div>
            <div className="text-2xl font-semibold font-mono">${formatCurrency(summary.totalNotional)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Unrealized P&L</div>
            <div className={cn(
              "text-2xl font-semibold font-mono",
              summary.unrealizedPnL >= 0 ? "pnl-positive" : "pnl-negative"
            )}>
              {summary.unrealizedPnL >= 0 ? "+" : ""}${formatCurrency(Math.abs(summary.unrealizedPnL))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Margin</div>
            <div className="text-2xl font-semibold font-mono">${formatCurrency(summary.totalMargin)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-[var(--pnl-positive)]" />
              <span className="text-xs text-muted-foreground">Long</span>
            </div>
            <div className="text-2xl font-semibold font-mono text-[var(--pnl-positive)]">
              ${formatCurrency(summary.longExposure)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="size-4 text-[var(--pnl-negative)]" />
              <span className="text-xs text-muted-foreground">Short</span>
            </div>
            <div className="text-2xl font-semibold font-mono text-[var(--pnl-negative)]">
              ${formatCurrency(summary.shortExposure)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search positions..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={strategyFilter} onValueChange={setStrategyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strategies</SelectItem>
            {uniqueStrategies.map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <Select value={sideFilter} onValueChange={v => setSideFilter(v as "all" | "LONG" | "SHORT")}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Side" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="LONG">Long</SelectItem>
            <SelectItem value="SHORT">Short</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetchPositions()}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>

        <ExportDropdown
          data={filteredPositions as unknown as Record<string, unknown>[]}
          columns={positionExportColumns}
          filename="positions"
        />

        {strategyFilter !== "all" && (
          <Link href={`/services/trading/strategies/${strategyFilter}`}>
            <Button variant="outline" size="sm">
              View Strategy Details
            </Button>
          </Link>
        )}
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Positions</CardTitle>
          <DataFreshness lastUpdated={new Date()} isWebSocket={isLive} isBatch={!isLive} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Instrument</TableHead>
                <TableHead className="text-center">Side</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Entry Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead className="text-right">Health</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((pos) => (
                <TableRow key={pos.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={getInstrumentRoute(pos.instrument, classifyInstrument(pos.instrument))}
                        className="font-mono font-medium text-primary hover:underline cursor-pointer"
                      >
                        {pos.instrument}
                      </Link>
                      <span className="text-xs text-muted-foreground">{pos.strategy_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-xs",
                        pos.side === "LONG"
                          ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
                          : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]"
                      )}
                    >
                      {pos.side === "LONG" ? (
                        <ArrowUpRight className="size-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="size-3 mr-1" />
                      )}
                      {pos.side}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {pos.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${pos.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${pos.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "font-mono font-medium",
                        pos.pnl >= 0 ? "pnl-positive" : "pnl-negative"
                      )}>
                        {pos.pnl >= 0 ? "+" : ""}${formatCurrency(Math.abs(pos.pnl))}
                      </span>
                      <span className={cn(
                        "text-xs font-mono",
                        pos.pnl_pct >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"
                      )}>
                        {pos.pnl_pct >= 0 ? "+" : ""}{pos.pnl_pct.toFixed(2)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{pos.venue}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {DEFI_VENUES.has(pos.venue) && pos.health_factor != null ? (
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "font-mono text-sm font-medium",
                          pos.health_factor >= 2.0 && "text-emerald-500",
                          pos.health_factor >= 1.5 && pos.health_factor < 2.0 && "text-amber-500",
                          pos.health_factor < 1.5 && "text-rose-500"
                        )}>
                          {pos.health_factor.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {((pos.health_factor - 1.0) / pos.health_factor * 100).toFixed(0)}% to liq
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {pos.updated_at}
                  </TableCell>
                </TableRow>
              ))}
              {filteredPositions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No positions match your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Wrap with Suspense for useSearchParams (required for static generation)
export default function PositionsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading positions...</div>}>
      <PositionsPageContent />
    </Suspense>
  )
}
