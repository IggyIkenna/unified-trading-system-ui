"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Filter,
} from "lucide-react"

// ---------- Types ----------

interface StrategySignal {
  direction: string
  confidence: number
  timestamp: string
}

interface StrategyInstructionDetail {
  operationType: string
  side: string
  quantity: number
  price: number
  venue: string
}

interface StrategyFill {
  fillPrice: number
  fillQty: number
  slippageBps: number
  status: string
}

interface StrategyInstruction {
  id: string
  strategyId: string
  strategyType: string
  signal: StrategySignal
  instruction: StrategyInstructionDetail
  fill: StrategyFill | null
}

// ---------- Mock Data ----------

const MOCK_INSTRUCTIONS: StrategyInstruction[] = [
  {
    id: "inst-001",
    strategyId: "CEFI_BTC_MOMENTUM_HUF_5M_V1",
    strategyType: "MOMENTUM",
    signal: { direction: "LONG", confidence: 0.87, timestamp: "2026-03-23T10:32:15Z" },
    instruction: { operationType: "TRADE", side: "BUY", quantity: 0.15, price: 67234.50, venue: "Binance" },
    fill: { fillPrice: 67236.80, fillQty: 0.15, slippageBps: 3.4, status: "FILLED" },
  },
  {
    id: "inst-002",
    strategyId: "CEFI_ETH_MARKET_MAKING_5M_V2",
    strategyType: "MARKET_MAKING",
    signal: { direction: "NEUTRAL", confidence: 0.92, timestamp: "2026-03-23T10:33:00Z" },
    instruction: { operationType: "TRADE", side: "BUY", quantity: 2.5, price: 3456.20, venue: "Binance" },
    fill: { fillPrice: 3456.20, fillQty: 2.5, slippageBps: 0.0, status: "FILLED" },
  },
  {
    id: "inst-003",
    strategyId: "DEFI_AAVE_LEND_USDC_V1",
    strategyType: "DEX_ARB",
    signal: { direction: "LONG", confidence: 0.78, timestamp: "2026-03-23T10:33:45Z" },
    instruction: { operationType: "SWAP", side: "BUY", quantity: 5000, price: 1.0002, venue: "Uniswap" },
    fill: { fillPrice: 1.0005, fillQty: 4998.5, slippageBps: 3.0, status: "FILLED" },
  },
  {
    id: "inst-004",
    strategyId: "DEFI_FLASH_ARB_ETH_V1",
    strategyType: "FLASH_ARB",
    signal: { direction: "LONG", confidence: 0.95, timestamp: "2026-03-23T10:34:10Z" },
    instruction: { operationType: "FLASH_BORROW", side: "BUY", quantity: 100, price: 3456.00, venue: "Aave" },
    fill: { fillPrice: 3456.00, fillQty: 100, slippageBps: 0.0, status: "FILLED" },
  },
  {
    id: "inst-005",
    strategyId: "CEFI_BTC_MOMENTUM_HUF_5M_V1",
    strategyType: "MOMENTUM",
    signal: { direction: "SHORT", confidence: 0.65, timestamp: "2026-03-23T10:35:00Z" },
    instruction: { operationType: "TRADE", side: "SELL", quantity: 0.08, price: 67280.00, venue: "OKX" },
    fill: { fillPrice: 67275.30, fillQty: 0.05, slippageBps: 7.0, status: "PARTIAL_FILL" },
  },
  {
    id: "inst-006",
    strategyId: "SPORTS_EPL_ML_V3",
    strategyType: "SPORTS_ML",
    signal: { direction: "BACK", confidence: 0.72, timestamp: "2026-03-23T10:35:30Z" },
    instruction: { operationType: "SPORTS_EXCHANGE_ORDER", side: "BUY", quantity: 500, price: 2.10, venue: "Betfair" },
    fill: { fillPrice: 2.08, fillQty: 350, slippageBps: 9.5, status: "PARTIAL_FILL" },
  },
  {
    id: "inst-007",
    strategyId: "DEFI_LIDO_STAKE_V1",
    strategyType: "YIELD",
    signal: { direction: "LONG", confidence: 0.91, timestamp: "2026-03-23T10:36:00Z" },
    instruction: { operationType: "STAKE", side: "BUY", quantity: 32, price: 3456.78, venue: "Lido" },
    fill: null,
  },
  {
    id: "inst-008",
    strategyId: "PRED_POLYMARKET_V1",
    strategyType: "PREDICTION",
    signal: { direction: "YES", confidence: 0.83, timestamp: "2026-03-23T10:36:30Z" },
    instruction: { operationType: "PREDICTION_BET", side: "BUY", quantity: 1000, price: 0.62, venue: "Polymarket" },
    fill: { fillPrice: 0.63, fillQty: 1000, slippageBps: 16.1, status: "FILLED" },
  },
  {
    id: "inst-009",
    strategyId: "CEFI_SOL_BASIS_V1",
    strategyType: "BASIS",
    signal: { direction: "LONG", confidence: 0.88, timestamp: "2026-03-23T10:37:00Z" },
    instruction: { operationType: "FUTURES_ROLL", side: "BUY", quantity: 50, price: 156.42, venue: "Deribit" },
    fill: { fillPrice: 156.45, fillQty: 50, slippageBps: 1.9, status: "FILLED" },
  },
  {
    id: "inst-010",
    strategyId: "DEFI_UNI_LP_V2",
    strategyType: "LP",
    signal: { direction: "NEUTRAL", confidence: 0.85, timestamp: "2026-03-23T10:37:30Z" },
    instruction: { operationType: "ADD_LIQUIDITY", side: "BUY", quantity: 10000, price: 1.00, venue: "Uniswap" },
    fill: { fillPrice: 1.00, fillQty: 10000, slippageBps: 0.0, status: "FILLED" },
  },
]

const STRATEGY_TYPES = [
  "ALL", "MOMENTUM", "MARKET_MAKING", "DEX_ARB", "FLASH_ARB",
  "SPORTS_ML", "YIELD", "PREDICTION", "BASIS", "LP",
] as const

const OPERATION_TYPES = [
  "ALL", "TRADE", "SWAP", "FLASH_BORROW", "FLASH_REPAY", "STAKE", "UNSTAKE",
  "LEND", "BORROW", "WITHDRAW", "REPAY", "ADD_LIQUIDITY", "REMOVE_LIQUIDITY",
  "COLLECT_FEES", "BET", "CANCEL_BET", "SPORTS_EXCHANGE", "OPTIONS_COMBO",
  "FUTURES_ROLL", "PREDICTION_BET", "SPORTS_BET", "SPORTS_EXCHANGE_ORDER", "TRANSFER",
] as const

// ---------- Helpers ----------

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function getStatusColor(status: string): string {
  switch (status) {
    case "FILLED": return "text-emerald-400"
    case "PARTIAL_FILL": return "text-amber-400"
    case "REJECTED": return "text-rose-400"
    default: return "text-muted-foreground"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "FILLED": return <CheckCircle2 className="size-3.5 text-emerald-500" />
    case "PARTIAL_FILL": return <AlertTriangle className="size-3.5 text-amber-500" />
    case "REJECTED": return <XCircle className="size-3.5 text-rose-500" />
    default: return <Clock className="size-3.5 text-muted-foreground" />
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return "text-emerald-400"
  if (confidence >= 0.70) return "text-amber-400"
  return "text-rose-400"
}

function getSlippageColor(bps: number): string {
  if (bps <= 2) return "text-emerald-400"
  if (bps <= 5) return "text-amber-400"
  return "text-rose-400"
}

function getOperationBadgeVariant(opType: string): "default" | "secondary" | "outline" | "destructive" {
  if (["TRADE", "SWAP"].includes(opType)) return "default"
  if (["FLASH_BORROW", "FLASH_REPAY"].includes(opType)) return "destructive"
  if (["STAKE", "LEND", "ADD_LIQUIDITY"].includes(opType)) return "secondary"
  return "outline"
}

// ---------- Component ----------

interface StrategyInstructionViewerProps {
  className?: string
}

export function StrategyInstructionViewer({ className }: StrategyInstructionViewerProps) {
  const [strategyFilter, setStrategyFilter] = React.useState("ALL")
  const [opTypeFilter, setOpTypeFilter] = React.useState("ALL")
  const [selectedRow, setSelectedRow] = React.useState<string | null>(null)

  const filtered = React.useMemo(() => {
    return MOCK_INSTRUCTIONS.filter((inst) => {
      if (strategyFilter !== "ALL" && inst.strategyType !== strategyFilter) return false
      if (opTypeFilter !== "ALL" && inst.instruction.operationType !== opTypeFilter) return false
      return true
    })
  }, [strategyFilter, opTypeFilter])

  const summary = React.useMemo(() => {
    const total = filtered.length
    const filled = filtered.filter((i) => i.fill?.status === "FILLED").length
    const partial = filtered.filter((i) => i.fill?.status === "PARTIAL_FILL").length
    const pending = filtered.filter((i) => i.fill === null).length
    const avgSlippage = filtered
      .filter((i) => i.fill !== null)
      .reduce((sum, i) => sum + (i.fill?.slippageBps ?? 0), 0)
    const fillCount = filtered.filter((i) => i.fill !== null).length
    return {
      total,
      filled,
      partial,
      pending,
      avgSlippage: fillCount > 0 ? avgSlippage / fillCount : 0,
    }
  }, [filtered])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="size-4" />
            Strategy Instruction Pipeline
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5">
            <RefreshCw className="size-3" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-2">
          <Filter className="size-3.5 text-muted-foreground" />
          <Select value={strategyFilter} onValueChange={setStrategyFilter}>
            <SelectTrigger className="h-7 w-40 text-xs">
              <SelectValue placeholder="Strategy Type" />
            </SelectTrigger>
            <SelectContent>
              {STRATEGY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t === "ALL" ? "All Strategies" : t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={opTypeFilter} onValueChange={setOpTypeFilter}>
            <SelectTrigger className="h-7 w-48 text-xs">
              <SelectValue placeholder="Operation Type" />
            </SelectTrigger>
            <SelectContent>
              {OPERATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t === "ALL" ? "All Operations" : t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 py-2 px-3 bg-muted/30 rounded mt-2 text-xs">
          <span className="text-muted-foreground">
            Total: <span className="font-mono text-foreground">{summary.total}</span>
          </span>
          <span className="text-muted-foreground">
            Filled: <span className="font-mono text-emerald-400">{summary.filled}</span>
          </span>
          <span className="text-muted-foreground">
            Partial: <span className="font-mono text-amber-400">{summary.partial}</span>
          </span>
          <span className="text-muted-foreground">
            Pending: <span className="font-mono text-muted-foreground">{summary.pending}</span>
          </span>
          <span className="text-muted-foreground">
            Avg Slippage: <span className={cn("font-mono", getSlippageColor(summary.avgSlippage))}>
              {summary.avgSlippage.toFixed(1)} bps
            </span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-0">
        {/* Column headers */}
        <div className="grid grid-cols-3 gap-0 border-b border-border">
          <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Signal
          </div>
          <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-x border-border">
            Instruction
          </div>
          <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Fill / Diff
          </div>
        </div>

        {/* Instruction rows */}
        <div className="max-h-[600px] overflow-y-auto">
          {filtered.map((inst) => {
            const isSelected = selectedRow === inst.id
            const fillQtyPct = inst.fill ? (inst.fill.fillQty / inst.instruction.quantity) * 100 : 0

            return (
              <div key={inst.id}>
                <div
                  className={cn(
                    "grid grid-cols-3 gap-0 border-b border-border cursor-pointer hover:bg-muted/20 transition-colors",
                    isSelected && "bg-muted/30"
                  )}
                  onClick={() => setSelectedRow(isSelected ? null : inst.id)}
                >
                  {/* Signal Column */}
                  <div className="px-3 py-2.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {inst.signal.direction === "LONG" || inst.signal.direction === "BACK" || inst.signal.direction === "YES" ? (
                        <TrendingUp className="size-3 text-emerald-500" />
                      ) : inst.signal.direction === "SHORT" ? (
                        <TrendingDown className="size-3 text-rose-500" />
                      ) : (
                        <ArrowRight className="size-3 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "text-xs font-medium",
                        (inst.signal.direction === "LONG" || inst.signal.direction === "BACK" || inst.signal.direction === "YES")
                          ? "text-emerald-400"
                          : inst.signal.direction === "SHORT"
                            ? "text-rose-400"
                            : "text-muted-foreground"
                      )}>
                        {inst.signal.direction}
                      </span>
                      <span className={cn("text-[10px] font-mono", getConfidenceColor(inst.signal.confidence))}>
                        {(inst.signal.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate" title={inst.strategyId}>
                      {inst.strategyId}
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {inst.strategyType}
                    </Badge>
                  </div>

                  {/* Instruction Column */}
                  <div className="px-3 py-2.5 space-y-1 border-x border-border">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={getOperationBadgeVariant(inst.instruction.operationType)}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {inst.instruction.operationType}
                      </Badge>
                      <span className={cn(
                        "text-xs font-medium",
                        inst.instruction.side === "BUY" ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {inst.instruction.side}
                      </span>
                    </div>
                    <div className="text-xs font-mono">
                      {inst.instruction.quantity.toLocaleString()} @ ${inst.instruction.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {inst.instruction.venue}
                    </div>
                  </div>

                  {/* Fill / Diff Column */}
                  <div className="px-3 py-2.5 space-y-1">
                    {inst.fill ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(inst.fill.status)}
                          <span className={cn("text-xs font-medium", getStatusColor(inst.fill.status))}>
                            {inst.fill.status}
                          </span>
                        </div>
                        <div className="text-xs font-mono">
                          {inst.fill.fillQty.toLocaleString()} @ ${inst.fill.fillPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] font-mono", getSlippageColor(inst.fill.slippageBps))}>
                            {inst.fill.slippageBps > 0 ? "+" : ""}{inst.fill.slippageBps.toFixed(1)} bps
                          </span>
                          {fillQtyPct < 100 && (
                            <span className="text-[10px] text-amber-400 font-mono">
                              {fillQtyPct.toFixed(0)}% filled
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5 animate-pulse" />
                        Pending...
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded detail row */}
                {isSelected && (
                  <div className="bg-muted/20 border-b border-border px-4 py-3">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signal Detail</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-mono">{formatTimestamp(inst.signal.timestamp)}</span>
                          <span className="text-muted-foreground">Direction</span>
                          <span className="font-medium">{inst.signal.direction}</span>
                          <span className="text-muted-foreground">Confidence</span>
                          <span className={cn("font-mono", getConfidenceColor(inst.signal.confidence))}>
                            {(inst.signal.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Instruction Detail</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                          <span className="text-muted-foreground">Op Type</span>
                          <span className="font-mono">{inst.instruction.operationType}</span>
                          <span className="text-muted-foreground">Notional</span>
                          <span className="font-mono">
                            ${(inst.instruction.quantity * inst.instruction.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-muted-foreground">Venue</span>
                          <span>{inst.instruction.venue}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Discrepancy</p>
                        {inst.fill ? (
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                            <span className="text-muted-foreground">Price Diff</span>
                            <span className={cn("font-mono", getSlippageColor(inst.fill.slippageBps))}>
                              ${(inst.fill.fillPrice - inst.instruction.price).toFixed(2)}
                            </span>
                            <span className="text-muted-foreground">Qty Diff</span>
                            <span className={cn(
                              "font-mono",
                              inst.fill.fillQty < inst.instruction.quantity ? "text-amber-400" : "text-emerald-400"
                            )}>
                              {(inst.fill.fillQty - inst.instruction.quantity).toLocaleString()}
                            </span>
                            <span className="text-muted-foreground">Slippage</span>
                            <span className={cn("font-mono", getSlippageColor(inst.fill.slippageBps))}>
                              {inst.fill.slippageBps.toFixed(1)} bps
                            </span>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No fill yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No instructions match the current filters
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
