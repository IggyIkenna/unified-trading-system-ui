"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Layers,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Zap,
  ArrowRight,
  Copy,
  Play,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
} from "lucide-react"

// ---------- Types ----------

const ALL_OPERATION_TYPES = [
  "LEND", "BORROW", "WITHDRAW", "REPAY",
  "STAKE", "UNSTAKE",
  "SWAP", "TRADE", "TRANSFER",
  "FLASH_BORROW", "FLASH_REPAY",
  "ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES",
  "BET", "CANCEL_BET", "SPORTS_EXCHANGE",
  "OPTIONS_COMBO", "FUTURES_ROLL",
  "PREDICTION_BET", "SPORTS_BET", "SPORTS_EXCHANGE_ORDER",
] as const

type OperationType = typeof ALL_OPERATION_TYPES[number]

const VENUES = [
  "Binance", "Deribit", "Hyperliquid", "Coinbase", "OKX", "Bybit",
  "Uniswap", "Curve", "Aave", "Sushiswap", "Balancer",
  "Lido", "EtherFi", "RocketPool",
  "Betfair", "Pinnacle", "Bet365", "Smarkets",
  "Polymarket", "Kalshi",
] as const

const INSTRUMENTS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BTC/USD-PERP", "ETH/USD-PERP",
  "ETH", "USDC", "USDT", "DAI", "WBTC", "LINK",
  "BTC-28MAR26-70000-C", "BTC-28MAR26-65000-P",
  "Arsenal vs Chelsea", "Man City vs Liverpool",
  "YES-Arsenal-EPL", "NO-Arsenal-EPL",
] as const

interface BundleStep {
  id: string
  operationType: OperationType
  instrument: string
  venue: string
  side: "BUY" | "SELL"
  quantity: string
  price: string
  dependsOn: string | null
}

interface BundleTemplate {
  name: string
  description: string
  category: string
  steps: Omit<BundleStep, "id">[]
  estimatedCost: number
  estimatedProfit: number
}

// ---------- Mock Data ----------

const TEMPLATES: BundleTemplate[] = [
  {
    name: "Flash Loan Arb",
    description: "Borrow via flash loan, swap on DEX A, swap back on DEX B, repay",
    category: "DeFi",
    steps: [
      { operationType: "FLASH_BORROW", instrument: "ETH", venue: "Aave", side: "BUY", quantity: "100", price: "3456.00", dependsOn: null },
      { operationType: "SWAP", instrument: "ETH/USDT", venue: "Uniswap", side: "SELL", quantity: "100", price: "3456.00", dependsOn: null },
      { operationType: "SWAP", instrument: "ETH/USDT", venue: "Curve", side: "BUY", quantity: "345800", price: "3458.00", dependsOn: null },
      { operationType: "FLASH_REPAY", instrument: "ETH", venue: "Aave", side: "SELL", quantity: "100.05", price: "3456.00", dependsOn: null },
    ],
    estimatedCost: 69.80,
    estimatedProfit: 130.20,
  },
  {
    name: "Basis Trade",
    description: "Buy spot, sell perp to capture funding rate",
    category: "CeFi",
    steps: [
      { operationType: "TRADE", instrument: "BTC/USDT", venue: "Binance", side: "BUY", quantity: "0.1", price: "67234.50", dependsOn: null },
      { operationType: "TRADE", instrument: "BTC/USD-PERP", venue: "Hyperliquid", side: "SELL", quantity: "0.1", price: "67280.00", dependsOn: null },
    ],
    estimatedCost: 8.05,
    estimatedProfit: 4.55,
  },
  {
    name: "DeFi Deleverage",
    description: "Repay debt then withdraw collateral",
    category: "DeFi",
    steps: [
      { operationType: "REPAY", instrument: "USDC", venue: "Aave", side: "SELL", quantity: "5000", price: "1.00", dependsOn: null },
      { operationType: "WITHDRAW", instrument: "ETH", venue: "Aave", side: "BUY", quantity: "2", price: "3456.00", dependsOn: null },
    ],
    estimatedCost: 12.30,
    estimatedProfit: 0,
  },
  {
    name: "Options Spread",
    description: "Buy call + sell call at different strikes (bull call spread)",
    category: "Options",
    steps: [
      { operationType: "OPTIONS_COMBO", instrument: "BTC-28MAR26-65000-P", venue: "Deribit", side: "BUY", quantity: "1", price: "2450.00", dependsOn: null },
      { operationType: "OPTIONS_COMBO", instrument: "BTC-28MAR26-70000-C", venue: "Deribit", side: "SELL", quantity: "1", price: "1200.00", dependsOn: null },
    ],
    estimatedCost: 1250.00,
    estimatedProfit: 3750.00,
  },
  {
    name: "Sports Arb",
    description: "Back at one exchange, lay/bet opposite at another",
    category: "Sports",
    steps: [
      { operationType: "SPORTS_EXCHANGE_ORDER", instrument: "Arsenal vs Chelsea", venue: "Betfair", side: "BUY", quantity: "500", price: "1.65", dependsOn: null },
      { operationType: "SPORTS_BET", instrument: "Arsenal vs Chelsea", venue: "Pinnacle", side: "SELL", quantity: "300", price: "2.20", dependsOn: null },
    ],
    estimatedCost: 800.00,
    estimatedProfit: 18.40,
  },
]

function getOperationColor(opType: string): string {
  if (["FLASH_BORROW", "FLASH_REPAY"].includes(opType)) return "text-amber-400"
  if (["SWAP", "TRADE"].includes(opType)) return "text-sky-400"
  if (["LEND", "BORROW", "REPAY", "WITHDRAW"].includes(opType)) return "text-violet-400"
  if (["STAKE", "UNSTAKE"].includes(opType)) return "text-emerald-400"
  if (["ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES"].includes(opType)) return "text-cyan-400"
  if (["BET", "CANCEL_BET", "SPORTS_EXCHANGE", "SPORTS_BET", "SPORTS_EXCHANGE_ORDER", "PREDICTION_BET"].includes(opType)) return "text-orange-400"
  if (["OPTIONS_COMBO", "FUTURES_ROLL"].includes(opType)) return "text-pink-400"
  return "text-muted-foreground"
}

function getOperationBadgeClass(opType: string): string {
  if (["FLASH_BORROW", "FLASH_REPAY"].includes(opType)) return "border-amber-500/50 text-amber-400"
  if (["SWAP", "TRADE"].includes(opType)) return "border-sky-500/50 text-sky-400"
  if (["LEND", "BORROW", "REPAY", "WITHDRAW"].includes(opType)) return "border-violet-500/50 text-violet-400"
  if (["STAKE", "UNSTAKE"].includes(opType)) return "border-emerald-500/50 text-emerald-400"
  if (["ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES"].includes(opType)) return "border-cyan-500/50 text-cyan-400"
  if (["BET", "CANCEL_BET", "SPORTS_EXCHANGE", "SPORTS_BET", "SPORTS_EXCHANGE_ORDER", "PREDICTION_BET"].includes(opType)) return "border-orange-500/50 text-orange-400"
  if (["OPTIONS_COMBO", "FUTURES_ROLL"].includes(opType)) return "border-pink-500/50 text-pink-400"
  return ""
}

// ---------- Component ----------

interface BundleBuilderProps {
  className?: string
}

export function BundleBuilder({ className }: BundleBuilderProps) {
  const [steps, setSteps] = React.useState<BundleStep[]>([])
  const [showTemplates, setShowTemplates] = React.useState(true)

  const addStep = () => {
    setSteps([...steps, {
      id: `step-${Date.now()}`,
      operationType: "TRADE",
      instrument: "BTC/USDT",
      venue: "Binance",
      side: "BUY",
      quantity: "",
      price: "",
      dependsOn: null,
    }])
    setShowTemplates(false)
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id))
  }

  const moveStep = (id: string, direction: "up" | "down") => {
    const idx = steps.findIndex((s) => s.id === id)
    if (idx < 0) return
    const newIdx = direction === "up" ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= steps.length) return
    const newSteps = [...steps]
    const temp = newSteps[idx]
    newSteps[idx] = newSteps[newIdx]
    newSteps[newIdx] = temp
    setSteps(newSteps)
  }

  const updateStep = (id: string, field: keyof BundleStep, value: string | null) => {
    setSteps(steps.map((s) => s.id === id ? { ...s, [field]: value } : s))
  }

  const loadTemplate = (template: BundleTemplate) => {
    const newSteps: BundleStep[] = template.steps.map((s, i) => ({
      ...s,
      id: `step-${Date.now()}-${i}`,
    }))
    setSteps(newSteps)
    setShowTemplates(false)
  }

  const duplicateStep = (id: string) => {
    const step = steps.find((s) => s.id === id)
    if (!step) return
    const idx = steps.findIndex((s) => s.id === id)
    const newStep = { ...step, id: `step-${Date.now()}`, dependsOn: null }
    const newSteps = [...steps]
    newSteps.splice(idx + 1, 0, newStep)
    setSteps(newSteps)
  }

  // P&L estimation
  const totalCost = steps.reduce((sum, s) => {
    const qty = parseFloat(s.quantity) || 0
    const price = parseFloat(s.price) || 0
    if (s.side === "BUY") return sum + qty * price
    return sum
  }, 0)

  const totalRevenue = steps.reduce((sum, s) => {
    const qty = parseFloat(s.quantity) || 0
    const price = parseFloat(s.price) || 0
    if (s.side === "SELL") return sum + qty * price
    return sum
  }, 0)

  const estimatedGas = steps.length * 14.50
  const netPnl = totalRevenue - totalCost - estimatedGas

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="size-4" />
            Atomic Bundle Builder
            <Badge variant="outline" className="text-[10px]">{steps.length} steps</Badge>
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <FileText className="size-3 mr-1" />
              Templates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSteps([])}
              disabled={steps.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Templates */}
        {showTemplates && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pre-built Templates</p>
            <div className="grid grid-cols-1 gap-1.5">
              {TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  className="w-full p-2.5 rounded-lg border text-left hover:bg-muted/20 transition-colors"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{template.name}</span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">{template.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-rose-400 font-mono">-${template.estimatedCost.toFixed(0)}</span>
                      {template.estimatedProfit > 0 && (
                        <span className="text-emerald-400 font-mono">+${template.estimatedProfit.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{template.description}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    {template.steps.map((s, i) => (
                      <React.Fragment key={i}>
                        <Badge
                          variant="outline"
                          className={cn("text-[8px] px-1 py-0", getOperationBadgeClass(s.operationType))}
                        >
                          {s.operationType}
                        </Badge>
                        {i < template.steps.length - 1 && (
                          <ArrowRight className="size-2.5 text-muted-foreground shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Step list */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Execution Steps</p>

            {/* Visual DAG */}
            <div className="flex items-center gap-1 px-1 py-2 overflow-x-auto">
              {steps.map((step, i) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div className={cn(
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold",
                      getOperationBadgeClass(step.operationType)
                    )}>
                      {i + 1}
                    </div>
                    <span className={cn("text-[8px] truncate max-w-[60px]", getOperationColor(step.operationType))}>
                      {step.operationType}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="size-3 text-muted-foreground shrink-0 mt-[-12px]" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step cards */}
            {steps.map((step, index) => (
              <div key={step.id} className="p-3 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="size-3.5 text-muted-foreground cursor-grab" />
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0", getOperationBadgeClass(step.operationType))}
                    >
                      Step {index + 1}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveStep(step.id, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveStep(step.id, "down")}
                      disabled={index === steps.length - 1}
                    >
                      <ChevronDown className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => duplicateStep(step.id)}
                    >
                      <Copy className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:text-rose-400"
                      onClick={() => removeStep(step.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Step fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Operation</label>
                    <Select
                      value={step.operationType}
                      onValueChange={(v) => updateStep(step.id, "operationType", v)}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_OPERATION_TYPES.map((op) => (
                          <SelectItem key={op} value={op}>
                            <span className={getOperationColor(op)}>{op}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Instrument</label>
                    <Select
                      value={step.instrument}
                      onValueChange={(v) => updateStep(step.id, "instrument", v)}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INSTRUMENTS.map((inst) => (
                          <SelectItem key={inst} value={inst}>
                            <span className="font-mono">{inst}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Venue</label>
                    <Select
                      value={step.venue}
                      onValueChange={(v) => updateStep(step.id, "venue", v)}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VENUES.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Side</label>
                    <div className="grid grid-cols-2 gap-0.5">
                      <Button
                        variant={step.side === "BUY" ? "default" : "outline"}
                        size="sm"
                        className={cn("h-7 text-[10px]", step.side === "BUY" && "bg-emerald-600 hover:bg-emerald-700")}
                        onClick={() => updateStep(step.id, "side", "BUY")}
                      >
                        BUY
                      </Button>
                      <Button
                        variant={step.side === "SELL" ? "default" : "outline"}
                        size="sm"
                        className={cn("h-7 text-[10px]", step.side === "SELL" && "bg-rose-600 hover:bg-rose-700")}
                        onClick={() => updateStep(step.id, "side", "SELL")}
                      >
                        SELL
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Depends On</label>
                    <Select
                      value={step.dependsOn ?? "none"}
                      onValueChange={(v) => updateStep(step.id, "dependsOn", v === "none" ? null : v)}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (parallel)</SelectItem>
                        {steps
                          .filter((s) => s.id !== step.id)
                          .map((s, i) => (
                            <SelectItem key={s.id} value={s.id}>
                              Step {steps.indexOf(s) + 1}: {s.operationType}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Quantity</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={step.quantity}
                      onChange={(e) => updateStep(step.id, "quantity", e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Price</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={step.price}
                      onChange={(e) => updateStep(step.id, "price", e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Notional */}
                {(parseFloat(step.quantity) || 0) > 0 && (parseFloat(step.price) || 0) > 0 && (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span>Notional</span>
                    <span className={cn(
                      "font-mono",
                      step.side === "BUY" ? "text-rose-400" : "text-emerald-400"
                    )}>
                      {step.side === "BUY" ? "-" : "+"}$
                      {((parseFloat(step.quantity) || 0) * (parseFloat(step.price) || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            ))}

            <Button variant="outline" size="sm" className="w-full text-xs" onClick={addStep}>
              <Plus className="size-3 mr-1.5" />
              Add Step
            </Button>
          </div>
        )}

        {/* Empty state */}
        {steps.length === 0 && !showTemplates && (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
            <Layers className="size-8 opacity-30" />
            <p className="text-sm">No steps in bundle</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={addStep}>
                <Plus className="size-3 mr-1.5" />
                Add Step
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowTemplates(true)}>
                <FileText className="size-3 mr-1.5" />
                Use Template
              </Button>
            </div>
          </div>
        )}

        {/* P&L Preview */}
        {steps.length > 0 && (
          <>
            <Separator />
            <div className="p-3 rounded-lg border space-y-2">
              <p className="text-xs font-medium flex items-center gap-1.5">
                <DollarSign className="size-3.5" />
                P&L Estimate
              </p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-muted-foreground">Buy Notional</span>
                <span className="font-mono text-rose-400 text-right">
                  -${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">Sell Notional</span>
                <span className="font-mono text-emerald-400 text-right">
                  +${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">Est. Gas ({steps.length} txns)</span>
                <span className="font-mono text-rose-400 text-right">
                  -${estimatedGas.toFixed(2)}
                </span>
                <Separator className="col-span-2 my-1" />
                <span className="font-medium">Net P&L</span>
                <span className={cn(
                  "font-mono font-bold text-right",
                  netPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {netPnl >= 0 ? "+" : ""}${netPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>

              {netPnl < 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                  <AlertTriangle className="size-3" />
                  Bundle has negative expected P&L
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="text-xs h-9">
                <Play className="size-3.5 mr-1.5" />
                Simulate (Dry Run)
              </Button>
              <Button className="text-xs h-9" disabled={steps.length === 0}>
                <Send className="size-3.5 mr-1.5" />
                Submit Bundle
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
