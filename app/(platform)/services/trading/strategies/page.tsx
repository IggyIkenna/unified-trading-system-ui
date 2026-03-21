"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/trading/status-badge"
import { PnLValue } from "@/components/trading/pnl-value"
import { SparklineCell } from "@/components/trading/kpi-card"
import { EntityLink } from "@/components/trading/entity-link"
import { ExecutionModeToggle, ExecutionModeIndicator } from "@/components/trading/execution-mode-toggle"
import { useExecutionMode } from "@/lib/execution-mode-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  STRATEGIES,
  type Strategy,
  getTotalAUM,
  getTotalPnL,
  getTotalMTDPnL,
} from "@/lib/strategy-registry"
import { formatCurrency } from "@/lib/reference-data"
import Link from "next/link"
import { 
  Plus, 
  BarChart2, 
  LineChart, 
  Play, 
  Settings, 
  Search,
  Filter,
  ChevronDown,
  X,
  Activity,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Asset class colors
const ASSET_CLASS_COLORS: Record<string, string> = {
  DeFi: "#4ade80",
  CeFi: "#60a5fa",
  TradFi: "#a78bfa",
  Sports: "#fbbf24",
  Prediction: "#f472b6",
}

// Archetype filters
const ARCHETYPES = [
  { id: "BASIS_TRADE", label: "Basis Trade" },
  { id: "MARKET_MAKING", label: "Market Making" },
  { id: "ARBITRAGE", label: "Arbitrage" },
  { id: "YIELD", label: "Yield" },
  { id: "DIRECTIONAL", label: "Directional" },
  { id: "OPTIONS", label: "Options" },
  { id: "MOMENTUM", label: "Momentum" },
] as const

// Status filters
const STATUSES = [
  { id: "live", label: "Live", color: "var(--status-live)" },
  { id: "paused", label: "Paused", color: "var(--status-idle)" },
  { id: "warning", label: "Warning", color: "var(--status-warning)" },
  { id: "development", label: "Development", color: "var(--status-running)" },
] as const

export default function StrategiesPage() {
  const { mode, isLive } = useExecutionMode()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedAssetClasses, setSelectedAssetClasses] = React.useState<string[]>([])
  const [selectedArchetypes, setSelectedArchetypes] = React.useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([])

  // Filter strategies
  const filteredStrategies = React.useMemo(() => {
    let result = STRATEGIES

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.venues.some(v => v.toLowerCase().includes(query))
      )
    }

    if (selectedAssetClasses.length > 0) {
      result = result.filter(s => selectedAssetClasses.includes(s.assetClass))
    }

    if (selectedArchetypes.length > 0) {
      result = result.filter(s => selectedArchetypes.includes(s.archetype))
    }

    if (selectedStatuses.length > 0) {
      result = result.filter(s => selectedStatuses.includes(s.status))
    }

    return result
  }, [searchQuery, selectedAssetClasses, selectedArchetypes, selectedStatuses])

  // Group by asset class
  const groupedStrategies = React.useMemo(() => {
    const groups: Record<string, Strategy[]> = {}
    filteredStrategies.forEach(s => {
      if (!groups[s.assetClass]) groups[s.assetClass] = []
      groups[s.assetClass].push(s)
    })
    return groups
  }, [filteredStrategies])

  const hasFilters = selectedAssetClasses.length > 0 || selectedArchetypes.length > 0 || selectedStatuses.length > 0

  const clearFilters = () => {
    setSelectedAssetClasses([])
    setSelectedArchetypes([])
    setSelectedStatuses([])
  }

  const toggleAssetClass = (ac: string) => {
    setSelectedAssetClasses(prev => 
      prev.includes(ac) ? prev.filter(x => x !== ac) : [...prev, ac]
    )
  }

  const toggleArchetype = (arch: string) => {
    setSelectedArchetypes(prev => 
      prev.includes(arch) ? prev.filter(x => x !== arch) : [...prev, arch]
    )
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(x => x !== status) : [...prev, status]
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header with Mode Toggle */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold">Strategy Catalogue</h1>
              <ExecutionModeIndicator />
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredStrategies.length} strategies across {Object.keys(groupedStrategies).length} asset classes
              {isLive ? " - Live execution" : " - Batch reconstruction"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExecutionModeToggle showDescription />
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              New Strategy
            </Button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Active Strategies</span>
              </div>
              <div className="text-2xl font-semibold font-mono">
                {STRATEGIES.filter(s => s.status === "live").length}
                <span className="text-sm text-muted-foreground font-normal"> / {STRATEGIES.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total AUM</span>
              </div>
              <div className="text-2xl font-semibold font-mono">
                ${formatCurrency(getTotalAUM())}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total P&L</span>
              </div>
              <PnLValue value={getTotalPnL()} size="lg" />
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">MTD P&L</span>
              </div>
              <PnLValue value={getTotalMTDPnL()} size="lg" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search strategies, venues..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Asset Class Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-1.5",
                  selectedAssetClasses.length > 0 && "border-primary"
                )}
              >
                <Filter className="size-3.5" />
                Asset Class
                {selectedAssetClasses.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {selectedAssetClasses.length}
                  </Badge>
                )}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs">Asset Classes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys(ASSET_CLASS_COLORS).map(ac => (
                <DropdownMenuCheckboxItem
                  key={ac}
                  checked={selectedAssetClasses.includes(ac)}
                  onCheckedChange={() => toggleAssetClass(ac)}
                >
                  <span className="flex items-center gap-2">
                    <span 
                      className="size-2 rounded-full"
                      style={{ backgroundColor: ASSET_CLASS_COLORS[ac] }}
                    />
                    {ac}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Archetype Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-1.5",
                  selectedArchetypes.length > 0 && "border-primary"
                )}
              >
                Archetype
                {selectedArchetypes.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {selectedArchetypes.length}
                  </Badge>
                )}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs">Strategy Types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ARCHETYPES.map(arch => (
                <DropdownMenuCheckboxItem
                  key={arch.id}
                  checked={selectedArchetypes.includes(arch.id)}
                  onCheckedChange={() => toggleArchetype(arch.id)}
                >
                  {arch.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-1.5",
                  selectedStatuses.length > 0 && "border-primary"
                )}
              >
                Status
                {selectedStatuses.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {selectedStatuses.length}
                  </Badge>
                )}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUSES.map(status => (
                <DropdownMenuCheckboxItem
                  key={status.id}
                  checked={selectedStatuses.includes(status.id)}
                  onCheckedChange={() => toggleStatus(status.id)}
                >
                  <span className="flex items-center gap-2">
                    <span 
                      className="size-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active filter badges */}
          {selectedAssetClasses.map(ac => (
            <Badge
              key={ac}
              variant="secondary"
              className="h-6 gap-1 pl-2 pr-1"
              style={{ borderColor: ASSET_CLASS_COLORS[ac], borderWidth: 1 }}
            >
              <span 
                className="size-1.5 rounded-full"
                style={{ backgroundColor: ASSET_CLASS_COLORS[ac] }}
              />
              {ac}
              <button onClick={() => toggleAssetClass(ac)} className="hover:bg-secondary rounded p-0.5">
                <X className="size-3" />
              </button>
            </Badge>
          ))}

          {selectedArchetypes.map(arch => {
            const label = ARCHETYPES.find(a => a.id === arch)?.label || arch
            return (
              <Badge key={arch} variant="secondary" className="h-6 gap-1 pl-2 pr-1">
                {label}
                <button onClick={() => toggleArchetype(arch)} className="hover:bg-secondary rounded p-0.5">
                  <X className="size-3" />
                </button>
              </Badge>
            )
          })}

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
              Clear all
            </Button>
          )}
        </div>

        {/* Strategy Cards - Grouped by Asset Class */}
        {Object.entries(groupedStrategies).map(([assetClass, strategies]) => (
          <div key={assetClass} className="space-y-3">
            {/* Asset Class Header */}
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: ASSET_CLASS_COLORS[assetClass] }}
              />
              <h2 className="text-lg font-semibold" style={{ color: ASSET_CLASS_COLORS[assetClass] }}>
                {assetClass}
              </h2>
              <span className="text-sm text-muted-foreground">
                ({strategies.length} {strategies.length === 1 ? "strategy" : "strategies"})
              </span>
            </div>

            {/* Strategy Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {strategies.map(strategy => (
                <Card
                  key={strategy.id}
                  className="cursor-pointer overflow-hidden transition-all duration-150 ease-out hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <EntityLink
                            type="strategy"
                            id={strategy.id}
                            label={strategy.name}
                            className="text-lg font-semibold"
                          />
                          <StatusBadge status={strategy.status} />
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {strategy.version}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {strategy.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground">
                          {strategy.strategyType}
                        </span>
                        {/* Execution Mode Tag (SCE/HUF/EVT) per critique 1.6 */}
                        <Badge 
                          variant="outline" 
                          className="text-[10px] font-mono"
                          title={
                            strategy.dataArchitecture.executionMode === "same_candle_exit" ? "Same Candle Exit" :
                            strategy.dataArchitecture.executionMode === "hold_until_flip" ? "Hold Until Flip" : "Event-Driven Continuous"
                          }
                        >
                          {strategy.dataArchitecture.executionMode === "same_candle_exit" ? "SCE" : 
                           strategy.dataArchitecture.executionMode === "hold_until_flip" ? "HUF" : "EVT"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Venues */}
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      {strategy.venues.slice(0, 3).map(venue => (
                        <Badge key={venue} variant="outline" className="text-[10px] px-1.5 py-0">
                          {venue}
                        </Badge>
                      ))}
                      {strategy.venues.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{strategy.venues.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Instruction Types (critique 1.7) */}
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      {strategy.instructionTypes.map(inst => (
                        <Badge 
                          key={inst} 
                          variant="secondary" 
                          className="text-[9px] px-1.5 py-0 font-mono"
                        >
                          {inst}
                        </Badge>
                      ))}
                    </div>

                    {/* Metrics Row */}
                    <div className="flex items-center justify-between py-3 border-t border-border">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-xs text-muted-foreground block">Sharpe</span>
                          <span className="text-sm font-mono font-semibold">
                            {strategy.performance.sharpe.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Return</span>
                          <span
                            className={cn(
                              "text-sm font-mono font-semibold",
                              strategy.performance.returnPct >= 0 ? "pnl-positive" : "pnl-negative"
                            )}
                          >
                            {strategy.performance.returnPct >= 0 ? "+" : ""}
                            {strategy.performance.returnPct.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Max DD</span>
                          <span className="text-sm font-mono text-muted-foreground">
                            {strategy.performance.maxDrawdown.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">MTD P&L</span>
                          <PnLValue value={strategy.performance.pnlMTD} size="sm" />
                        </div>
                      </div>
                      <SparklineCell data={strategy.sparklineData} className="w-20 h-8" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <Link href={`/positions?strategy_id=${strategy.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Play className="size-3" />
                          View Live
                        </Button>
                      </Link>
                      <Link href={`/services/trading/strategies/${strategy.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <BarChart2 className="size-3" />
                          Details
                        </Button>
                      </Link>
                      <Link href={`/config/strategies/${strategy.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Settings className="size-3" />
                          Config
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {filteredStrategies.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No strategies match your filters. Try adjusting your search criteria.
          </div>
        )}

        {/* Grid Link */}
        <div className="pt-4">
          <Link href="/services/trading/strategies/grid">
            <Button variant="outline" className="w-full gap-2">
              <LineChart className="size-4" />
              Open DimensionalGrid for Batch Analysis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
