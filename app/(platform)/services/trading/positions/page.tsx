"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  CheckCircle,
  AlertTriangle,
  Droplets,
  Coins,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, CLOB_VENUES, ZERO_ALPHA_VENUES } from "@/lib/reference-data"
import { 
  STRATEGIES, 
  getAllPositions, 
  getStrategyById,
  type Position 
} from "@/lib/strategy-registry"
import Link from "next/link"

// Enhanced Position type with new fields
interface EnhancedPosition extends Position {
  realizedPnl: number
  distToLiquidation: number | null
  positionType: "LP" | "LENDING" | "PERP" | "STAKING" | "SPOT" | "OPTION"
  protocolDetails?: {
    // LP specific
    pool?: string
    protocol?: string
    tickRange?: string
    currentTick?: string
    inRange?: boolean
    token0?: { symbol: string; amount: number; value: number }
    token1?: { symbol: string; amount: number; value: number }
    feesEarned?: number
    ilLoss?: number
    // Lending specific
    chain?: string
    supplied?: { symbol: string; amount: number; value: number }
    borrowed?: { symbol: string; amount: number; value: number }
    netApy?: number
    supplyApy?: number
    borrowApy?: number
    stakingApy?: number
    ltvCurrent?: number
    ltvMax?: number
    // Perp specific
    marginType?: "cross" | "isolated"
    liquidationPrice?: number
    fundingRate?: number
    funding8h?: number
    // Staking specific
    stakedAsset?: string
    stakedAmount?: number
    rewardsEarned?: number
    apy?: number
    lockPeriod?: string
  }
}

// Account balances mock data (spec 4.3)
const accountBalances = [
  { venue: "Binance", free: 1240000, locked: 810000, total: 2050000 },
  { venue: "Hyperliquid", free: 452000, locked: 348000, total: 800000 },
  { venue: "Aave V3", free: 0, locked: 513000, total: 513000 },
  { venue: "IBKR", free: 320000, locked: 180000, total: 500000 },
  { venue: "Deribit", free: 180000, locked: 120000, total: 300000 },
  { venue: "Betfair", free: 45000, locked: 12000, total: 57000 },
  { venue: "Wallet (ETH)", free: 95000, locked: 0, total: 95000 },
]

// Enhance positions with additional data
function enhancePosition(pos: Position): EnhancedPosition {
  const venue = pos.venue.toLowerCase()
  const instrument = pos.instrument.toLowerCase()
  
  // Determine position type
  let positionType: EnhancedPosition["positionType"] = "SPOT"
  if (instrument.includes("lp") || venue.includes("uniswap") || venue.includes("curve")) {
    positionType = "LP"
  } else if (venue.includes("aave") || venue.includes("morpho") || venue.includes("compound")) {
    positionType = "LENDING"
  } else if (instrument.includes("perp") || instrument.includes("-perp")) {
    positionType = "PERP"
  } else if (venue.includes("lido") || venue.includes("etherfi") || instrument.includes("steth") || instrument.includes("weeth")) {
    positionType = "STAKING"
  }
  
  // Generate realistic realized P&L (30-70% of unrealized, same sign)
  const realizedPnl = Math.round(pos.unrealizedPnL * (0.3 + Math.random() * 0.4))
  
  // Distance to liquidation based on position type
  let distToLiquidation: number | null = null
  if (positionType === "PERP") {
    distToLiquidation = 20 + Math.random() * 40 // 20-60%
  } else if (positionType === "LENDING") {
    distToLiquidation = pos.healthFactor ? ((pos.healthFactor - 1) / pos.healthFactor) * 100 : 25 + Math.random() * 30
  }
  
  // Protocol-specific details
  let protocolDetails: EnhancedPosition["protocolDetails"] = undefined
  
  if (positionType === "LP") {
    protocolDetails = {
      pool: `${pos.underlying}/USDC 0.3%`,
      protocol: "Uniswap V3",
      tickRange: "1800–2200",
      currentTick: "1950",
      inRange: true,
      token0: { symbol: pos.underlying, amount: 52.3, value: 102000 },
      token1: { symbol: "USDC", amount: 98200, value: 98200 },
      feesEarned: 12450,
      ilLoss: -3200,
    }
  } else if (positionType === "LENDING") {
    protocolDetails = {
      protocol: pos.venue,
      chain: "Ethereum",
      supplied: { symbol: "weETH", amount: 150, value: 285000 },
      borrowed: { symbol: "WETH", amount: 120, value: 228000 },
      netApy: 4.2,
      supplyApy: 3.8,
      borrowApy: 2.1,
      stakingApy: 2.5,
      ltvCurrent: 80,
      ltvMax: 82.5,
    }
  } else if (positionType === "PERP") {
    protocolDetails = {
      marginType: "cross",
      liquidationPrice: pos.currentPrice * (1 - (distToLiquidation || 30) / 100),
      fundingRate: 0.0082,
      funding8h: 42.50,
    }
  } else if (positionType === "STAKING") {
    protocolDetails = {
      protocol: "Lido",
      chain: "Ethereum",
      stakedAsset: "ETH",
      stakedAmount: 200,
      rewardsEarned: 7980,
      apy: 3.5,
      lockPeriod: "None (liquid)",
    }
  }
  
  return {
    ...pos,
    realizedPnl,
    distToLiquidation,
    positionType,
    protocolDetails,
  }
}

// Position Detail Cards based on type
function PositionDetail({ position }: { position: EnhancedPosition }) {
  const details = position.protocolDetails
  if (!details) return null
  
  switch (position.positionType) {
    case "LP":
      return (
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">Pool</div>
            <div className="font-medium">{details.pool}</div>
            <div className="text-xs text-muted-foreground">Protocol: {details.protocol}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tick Range</div>
            <div className="font-mono">{details.tickRange}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Current: {details.currentTick}</span>
              {details.inRange ? (
                <Badge variant="outline" className="text-[10px] text-[var(--status-live)] border-[var(--status-live)]">
                  <CheckCircle className="size-3 mr-1" /> IN RANGE
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-[var(--status-warning)] border-[var(--status-warning)]">
                  OUT OF RANGE
                </Badge>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Token Composition</div>
            <div className="text-sm font-mono">
              {details.token0?.amount.toFixed(1)} {details.token0?.symbol} (${formatCurrency(details.token0?.value || 0)})
            </div>
            <div className="text-sm font-mono">
              {details.token1?.amount.toLocaleString()} {details.token1?.symbol}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Performance</div>
            <div className="text-sm font-mono text-[var(--pnl-positive)]">
              Fees: +${formatCurrency(details.feesEarned || 0)} (7d)
            </div>
            <div className="text-sm font-mono text-[var(--pnl-negative)]">
              IL vs HODL: ${formatCurrency(details.ilLoss || 0)}
            </div>
          </div>
        </div>
      )
      
    case "LENDING":
      return (
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">Protocol</div>
            <div className="font-medium">{details.protocol}</div>
            <div className="text-xs text-muted-foreground">Chain: {details.chain}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Positions</div>
            <div className="text-sm font-mono">
              Supplied: {details.supplied?.amount} {details.supplied?.symbol} (${formatCurrency(details.supplied?.value || 0)})
            </div>
            <div className="text-sm font-mono">
              Borrowed: {details.borrowed?.amount} {details.borrowed?.symbol} (${formatCurrency(details.borrowed?.value || 0)})
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Health Factor / LTV</div>
            <div className={cn(
              "text-lg font-mono font-semibold",
              position.healthFactor && position.healthFactor < 1.3 ? "text-[var(--status-warning)]" : ""
            )}>
              HF: {position.healthFactor?.toFixed(2) || "1.42"}
              <span className="text-xs text-muted-foreground ml-1">(trend: ↘)</span>
            </div>
            <div className="text-sm font-mono">
              LTV: {details.ltvCurrent}% / {details.ltvMax}% max
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Net APY</div>
            <div className="text-lg font-mono font-semibold text-[var(--pnl-positive)]">
              +{details.netApy}%
            </div>
            <div className="text-xs text-muted-foreground">
              (supply {details.supplyApy}% − borrow {details.borrowApy}% + staking {details.stakingApy}%)
            </div>
          </div>
        </div>
      )
      
    case "PERP":
      return (
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">Venue</div>
            <div className="font-medium">{position.venue}</div>
            <div className="text-xs text-muted-foreground">
              Margin: {details.marginType === "cross" ? "Cross" : "Isolated"} | Leverage: {position.leverage}×
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Margin Used</div>
            <div className="font-mono font-medium">${formatCurrency(position.margin)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Liquidation Price</div>
            <div className="font-mono font-medium">${details.liquidationPrice?.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              Distance: {position.distToLiquidation?.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Funding (8h)</div>
            <div className={cn(
              "font-mono font-medium",
              (details.funding8h || 0) >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"
            )}>
              {(details.funding8h || 0) >= 0 ? "+" : ""}${details.funding8h?.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Rate: {((details.fundingRate || 0) * 100).toFixed(4)}%
            </div>
          </div>
        </div>
      )
      
    case "STAKING":
      return (
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">Protocol</div>
            <div className="font-medium">{details.protocol}</div>
            <div className="text-xs text-muted-foreground">Chain: {details.chain}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Staked</div>
            <div className="font-mono font-medium">
              {details.stakedAmount} {details.stakedAsset} → {details.stakedAmount} stETH
            </div>
            <div className="text-xs text-muted-foreground">Type: Liquid Staking</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Rewards Earned</div>
            <div className="font-mono font-medium text-[var(--pnl-positive)]">
              +${formatCurrency(details.rewardsEarned || 0)}
            </div>
            <div className="text-xs text-muted-foreground">APY: {details.apy}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Lock Period</div>
            <div className="font-medium">{details.lockPeriod}</div>
          </div>
        </div>
      )
      
    default:
      return null
  }
}

function PositionsPageContent() {
  const searchParams = useSearchParams()
  const strategyIdFilter = searchParams.get("strategy_id")
  
  const { mode, isLive } = useExecutionMode()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [venueFilter, setVenueFilter] = React.useState("all")
  const [assetFilter, setAssetFilter] = React.useState("all")
  const [sideFilter, setSideFilter] = React.useState<"all" | "LONG" | "SHORT">("all")
  const [strategyFilter, setStrategyFilter] = React.useState(strategyIdFilter || "all")
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const [balancesOpen, setBalancesOpen] = React.useState(false)
  
  // Update filter when URL param changes
  React.useEffect(() => {
    if (strategyIdFilter) {
      setStrategyFilter(strategyIdFilter)
    }
  }, [strategyIdFilter])
  
  // Get all positions from strategy registry and enhance them
  const allPositions = React.useMemo(() => 
    getAllPositions().map(enhancePosition), 
    []
  )
  
  // Filter positions
  const filteredPositions = React.useMemo(() => {
    let result = allPositions
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.strategyName.toLowerCase().includes(query) ||
        p.underlying.toLowerCase().includes(query) ||
        p.venue.toLowerCase().includes(query) ||
        p.instrument.toLowerCase().includes(query)
      )
    }
    
    if (strategyFilter !== "all") {
      result = result.filter(p => p.strategyId === strategyFilter)
    }
    
    if (venueFilter !== "all") {
      result = result.filter(p => p.venue === venueFilter)
    }
    
    if (assetFilter !== "all") {
      result = result.filter(p => p.underlying === assetFilter)
    }
    
    if (sideFilter !== "all") {
      result = result.filter(p => p.side === sideFilter)
    }
    
    return result
  }, [allPositions, searchQuery, strategyFilter, venueFilter, assetFilter, sideFilter])
  
  // Calculate summary stats
  const summary = React.useMemo(() => ({
    totalPositions: filteredPositions.length,
    totalNotional: filteredPositions.reduce((sum, p) => sum + p.notional, 0),
    unrealizedPnL: filteredPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0),
    realizedPnL: filteredPositions.reduce((sum, p) => sum + p.realizedPnl, 0),
    totalMargin: filteredPositions.reduce((sum, p) => sum + p.margin, 0),
    longExposure: filteredPositions.filter(p => p.side === "LONG").reduce((sum, p) => sum + p.notional, 0),
    shortExposure: filteredPositions.filter(p => p.side === "SHORT").reduce((sum, p) => sum + p.notional, 0),
  }), [filteredPositions])
  
  // Get unique values for filters
  const uniqueVenues = React.useMemo(() => 
    [...new Set(allPositions.map(p => p.venue))].sort(), 
    [allPositions]
  )
  
  const uniqueUnderlyings = React.useMemo(() => 
    [...new Set(allPositions.map(p => p.underlying))].sort(), 
    [allPositions]
  )
  
  const selectedStrategy = strategyFilter !== "all" ? getStrategyById(strategyFilter) : null
  
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ExecutionModeIndicator />
          <span className="text-sm text-muted-foreground">
            {isLive ? "Real-time positions" : "Reconstructed positions from batch"}
          </span>
        </div>
        <ExecutionModeToggle showDescription />
      </div>

      {/* Account Balances - Collapsible (spec 4.3) */}
      <Collapsible open={balancesOpen} onOpenChange={setBalancesOpen} className="mb-6">
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="size-5 text-muted-foreground" />
                  <CardTitle className="text-base">Account Balances</CardTitle>
                  <Badge variant="outline" className="ml-2 font-mono">
                    ${formatCurrency(accountBalances.reduce((sum, b) => sum + b.total, 0))} total
                  </Badge>
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
                  {accountBalances.map((balance) => {
                    const utilization = (balance.locked / balance.total) * 100
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
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
            <div className="text-xs text-muted-foreground mb-1">Realized P&L</div>
            <div className={cn(
              "text-2xl font-semibold font-mono",
              summary.realizedPnL >= 0 ? "pnl-positive" : "pnl-negative"
            )}>
              {summary.realizedPnL >= 0 ? "+" : ""}${formatCurrency(Math.abs(summary.realizedPnL))}
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
            {STRATEGIES.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
        
        <Select value={assetFilter} onValueChange={setAssetFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Asset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            {uniqueUnderlyings.map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
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
        
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
        
        {strategyFilter !== "all" && selectedStrategy && (
          <Link href={`/services/trading/strategies/${strategyFilter}`}>
            <Button variant="outline" size="sm">
              View Strategy Details
            </Button>
          </Link>
        )}
      </div>

      {/* Positions Table with Expandable Rows */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"></TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Underlying</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead className="text-center">Side</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Notional</TableHead>
                <TableHead className="text-right">Unrealized P&L</TableHead>
                <TableHead className="text-right">Realized P&L</TableHead>
                <TableHead className="text-right">Dist. to Liq.</TableHead>
                <TableHead className="text-right">Margin / LTV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((pos) => {
                const isExpanded = expandedRows.has(pos.id)
                return (
                  <React.Fragment key={pos.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleRow(pos.id)}
                    >
                      <TableCell className="w-8">
                        {isExpanded ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link 
                            href={`/services/trading/strategies/${pos.strategyId}`}
                            className="font-medium text-primary hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            {pos.strategyName}
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono">{pos.instrument.split(":").slice(0, 2).join(":")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{pos.underlying}</span>
                          <Badge variant="outline" className="text-[10px]">{pos.positionType}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{pos.venue}</span>
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
                        {pos.size.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatCurrency(pos.notional)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "font-mono font-medium",
                            pos.unrealizedPnL >= 0 ? "pnl-positive" : "pnl-negative"
                          )}>
                            {pos.unrealizedPnL >= 0 ? "+" : ""}${formatCurrency(Math.abs(pos.unrealizedPnL))}
                          </span>
                          <span className={cn(
                            "text-xs font-mono",
                            pos.unrealizedPnLPct >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"
                          )}>
                            {pos.unrealizedPnLPct >= 0 ? "+" : ""}{pos.unrealizedPnLPct.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-mono font-medium",
                          pos.realizedPnl >= 0 ? "pnl-positive" : "pnl-negative"
                        )}>
                          {pos.realizedPnl >= 0 ? "+" : ""}${formatCurrency(Math.abs(pos.realizedPnl))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {pos.distToLiquidation !== null ? (
                          <Badge
                            variant={pos.distToLiquidation > 20 ? "outline" : pos.distToLiquidation > 10 ? "secondary" : "destructive"}
                            className={cn(
                              "font-mono",
                              pos.distToLiquidation > 20 ? "text-[var(--status-live)]" : 
                              pos.distToLiquidation > 10 ? "text-[var(--status-warning)]" : ""
                            )}
                          >
                            {pos.distToLiquidation.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-sm">${formatCurrency(pos.margin)}</span>
                          {pos.ltv !== undefined ? (
                            <span className={cn(
                              "text-xs font-mono",
                              pos.ltv > 0.75 ? "text-[var(--status-warning)]" : "text-muted-foreground"
                            )}>
                              LTV: {(pos.ltv * 100).toFixed(0)}%
                            </span>
                          ) : pos.healthFactor !== undefined ? (
                            <span className={cn(
                              "text-xs font-mono",
                              pos.healthFactor < 1.3 ? "text-[var(--status-warning)]" : "text-muted-foreground"
                            )}>
                              HF: {pos.healthFactor.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-muted-foreground">
                              {pos.leverage}x
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Expanded Row Detail */}
                    {isExpanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={11} className="p-0">
                          <div className="px-4 py-3 border-t border-border bg-muted/10">
                            <PositionDetail position={pos} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
              {filteredPositions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
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
