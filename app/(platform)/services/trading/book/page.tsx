"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlaceOrder, usePreTradeCheck } from "@/hooks/api/use-orders"
import { useOrganizationsList } from "@/hooks/api/use-organizations"
import { useAuth } from "@/hooks/use-auth"

// ── Types ────────────────────────────────────────────────────────────────────

type ExecutionMode = "execute" | "record_only"
type CategoryTab = "cefi_spot" | "cefi_derivatives" | "defi" | "tradfi" | "sports" | "prediction"
type AlgoType = "MARKET" | "TWAP" | "VWAP" | "ICEBERG" | "SOR" | "BEST_PRICE" | "BENCHMARK_FILL"
type OrderState = "idle" | "preview" | "submitting" | "success" | "error"

interface ComplianceCheckResult {
  name: string
  passed: boolean
  limit_value: number | string
  current_value: number | string
  proposed_value: number | string
}

interface PreTradeCheckResponse {
  passed: boolean
  checks: ComplianceCheckResult[]
}

interface PrefillData {
  org_id?: string
  client_id?: string
  strategy_id?: string
  execution_mode?: ExecutionMode
  category?: CategoryTab
  venue?: string
  instrument?: string
  side?: "buy" | "sell"
  quantity?: string
  price?: string
  algo?: AlgoType
}

// ── Venue lists per category ─────────────────────────────────────────────────

const VENUES_BY_CATEGORY: Record<CategoryTab, string[]> = {
  cefi_spot: ["Binance", "Coinbase", "OKX", "Bybit", "Kraken", "Gemini"],
  cefi_derivatives: ["Deribit", "OKX", "Bybit", "Binance", "BitMEX"],
  defi: ["Uniswap", "Aave", "Hyperliquid", "SushiSwap", "Curve"],
  tradfi: ["NYSE", "NASDAQ", "LSE", "CME", "ICE", "Eurex"],
  sports: ["Betfair", "Smarkets", "Pinnacle"],
  prediction: ["Polymarket", "Kalshi"],
}

const CATEGORY_LABELS: Record<CategoryTab, string> = {
  cefi_spot: "CeFi Spot",
  cefi_derivatives: "CeFi Derivatives",
  defi: "DeFi",
  tradfi: "TradFi",
  sports: "Sports",
  prediction: "Prediction",
}

const ALGO_OPTIONS: AlgoType[] = [
  "MARKET", "TWAP", "VWAP", "ICEBERG", "SOR", "BEST_PRICE", "BENCHMARK_FILL",
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BookTradePage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const placeOrder = usePlaceOrder()
  const preTradeCheck = usePreTradeCheck()
  const { data: organizations } = useOrganizationsList()

  // ── Hierarchy state ──────────────────────────────────────────────────────
  const [orgId, setOrgId] = React.useState("")
  const [clientId, setClientId] = React.useState("")
  const [strategyId, setStrategyId] = React.useState("manual")

  // ── Mode & category ─────────────────────────────────────────────────────
  const [executionMode, setExecutionMode] = React.useState<ExecutionMode>("execute")
  const [category, setCategory] = React.useState<CategoryTab>("cefi_spot")

  // ── Core fields ──────────────────────────────────────────────────────────
  const [venue, setVenue] = React.useState("")
  const [instrument, setInstrument] = React.useState("")
  const [side, setSide] = React.useState<"buy" | "sell">("buy")
  const [quantity, setQuantity] = React.useState("")
  const [price, setPrice] = React.useState("")

  // ── EXECUTE mode fields ──────────────────────────────────────────────────
  const [algo, setAlgo] = React.useState<AlgoType>("MARKET")
  const [algoParamDuration, setAlgoParamDuration] = React.useState("")
  const [algoParamSlices, setAlgoParamSlices] = React.useState("")
  const [algoParamDisplayQty, setAlgoParamDisplayQty] = React.useState("")
  const [algoParamBenchmark, setAlgoParamBenchmark] = React.useState("")

  // ── RECORD_ONLY mode fields ──────────────────────────────────────────────
  const [counterparty, setCounterparty] = React.useState("")
  const [sourceReference, setSourceReference] = React.useState("")
  const [fee, setFee] = React.useState("")

  // ── Order state ──────────────────────────────────────────────────────────
  const [orderState, setOrderState] = React.useState<OrderState>("idle")
  const [errorMessage, setErrorMessage] = React.useState("")
  const [complianceResult, setComplianceResult] = React.useState<PreTradeCheckResponse | null>(null)
  const [complianceUnavailable, setComplianceUnavailable] = React.useState(false)
  const [complianceLoading, setComplianceLoading] = React.useState(false)

  // ── URL prefill ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    const prefillRaw = searchParams.get("prefill")
    if (!prefillRaw) return
    try {
      const data = JSON.parse(prefillRaw) as PrefillData
      if (data.org_id) setOrgId(data.org_id)
      if (data.client_id) setClientId(data.client_id)
      if (data.strategy_id) setStrategyId(data.strategy_id)
      if (data.execution_mode) setExecutionMode(data.execution_mode)
      if (data.category) setCategory(data.category)
      if (data.venue) setVenue(data.venue)
      if (data.instrument) setInstrument(data.instrument)
      if (data.side) setSide(data.side)
      if (data.quantity) setQuantity(data.quantity)
      if (data.price) setPrice(data.price)
      if (data.algo) setAlgo(data.algo)
    } catch {
      // Invalid prefill JSON — silently ignore
    }
  }, [searchParams])

  // Reset venue when category changes
  React.useEffect(() => {
    setVenue("")
  }, [category])

  // ── Derived ──────────────────────────────────────────────────────────────
  const qty = parseFloat(quantity) || 0
  const priceNum = parseFloat(price) || 0
  const total = priceNum * qty
  const canPreview = qty > 0 && priceNum > 0 && instrument.length > 0 && venue.length > 0

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!canPreview) return
    setOrderState("preview")
    setComplianceResult(null)
    setComplianceUnavailable(false)

    if (executionMode === "execute") {
      setComplianceLoading(true)
      try {
        const result = await preTradeCheck.mutateAsync({
          instrument,
          side,
          quantity: qty,
          price: priceNum,
          strategy_id: strategyId === "manual" ? undefined : strategyId,
        }) as PreTradeCheckResponse
        setComplianceResult(result)
      } catch {
        setComplianceUnavailable(true)
      } finally {
        setComplianceLoading(false)
      }
    }
  }

  const compliancePassed =
    executionMode === "record_only" ||
    complianceUnavailable ||
    (complianceResult?.passed ?? false)
  const failedCheck = complianceResult?.checks.find((c) => !c.passed)

  const handleSubmit = async () => {
    setOrderState("submitting")
    setErrorMessage("")
    try {
      await placeOrder.mutateAsync({
        instrument,
        side,
        order_type: executionMode === "execute" ? "limit" : "market",
        quantity: qty,
        price: priceNum || undefined,
        venue,
        strategy_id: strategyId === "manual" ? undefined : strategyId,
        client_id: clientId || orgId || user?.org?.id,
        reason: undefined,
        execution_mode: executionMode,
        counterparty: executionMode === "record_only" ? counterparty || undefined : undefined,
        source_reference: executionMode === "record_only" ? sourceReference || undefined : undefined,
        category: CATEGORY_LABELS[category],
        portfolio_id: orgId || undefined,
      })
      setOrderState("success")
      setTimeout(() => {
        resetForm()
      }, 2000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Order failed")
      setOrderState("error")
    }
  }

  const resetForm = () => {
    setInstrument("")
    setQuantity("")
    setPrice("")
    setFee("")
    setCounterparty("")
    setSourceReference("")
    setAlgoParamDuration("")
    setAlgoParamSlices("")
    setAlgoParamDisplayQty("")
    setAlgoParamBenchmark("")
    setOrderState("idle")
    setErrorMessage("")
    setComplianceResult(null)
    setComplianceUnavailable(false)
    setComplianceLoading(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const orgList = Array.isArray(organizations) ? organizations as Array<{ id: string; name: string }> : []

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar: Hierarchy selectors ───────────────────────────────── */}
      <div className="border-b border-border bg-card/30 px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Organization */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Org</label>
            <Select value={orgId} onValueChange={(v) => { setOrgId(v); setClientId("") }}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Select org" />
              </SelectTrigger>
              <SelectContent>
                {orgList.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
                {orgList.length === 0 && (
                  <SelectItem value="default" disabled>No organizations</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Client */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Client</label>
            <Input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID"
              className="w-[160px] h-8 text-xs"
            />
          </div>

          {/* Strategy */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Strategy</label>
            <Select value={strategyId} onValueChange={setStrategyId}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (unlinked)</SelectItem>
                <SelectItem value="market-making">Market Making</SelectItem>
                <SelectItem value="stat-arb">Statistical Arbitrage</SelectItem>
                <SelectItem value="momentum">Momentum</SelectItem>
                <SelectItem value="mean-reversion">Mean Reversion</SelectItem>
                <SelectItem value="delta-hedge">Delta Hedge</SelectItem>
                <SelectItem value="basis-trade">Basis Trade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Main form ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-lg font-semibold">Book Trade</h1>
            <p className="text-sm text-muted-foreground">
              Manual trade entry for back-office booking and live execution
            </p>
          </div>

          {/* ── Execution Mode Toggle ──────────────────────────────────── */}
          <Tabs
            value={executionMode}
            onValueChange={(v) => setExecutionMode(v as ExecutionMode)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="execute" className="flex-1">Execute</TabsTrigger>
              <TabsTrigger value="record_only" className="flex-1">Record Only</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* ── Category Tabs ──────────────────────────────────────────── */}
          <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryTab)}>
            <TabsList className="w-full flex-wrap h-auto gap-0.5">
              {(Object.entries(CATEGORY_LABELS) as Array<[CategoryTab, string]>).map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="flex-1 text-xs">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* ── Core Fields Card ───────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Venue */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Venue</label>
                <Select value={venue} onValueChange={setVenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENUES_BY_CATEGORY[category].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Instrument */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Instrument</label>
                <Input
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  placeholder={category === "cefi_spot" ? "BTC/USDT" : category === "tradfi" ? "AAPL" : "ETH/USDC"}
                  className="font-mono"
                />
              </div>

              {/* Side */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Side</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={side === "buy" ? "default" : "outline"}
                    className={cn("w-full", side === "buy" && "bg-emerald-600 hover:bg-emerald-700")}
                    onClick={() => setSide("buy")}
                  >
                    <TrendingUp className="size-4 mr-2" />
                    Buy
                  </Button>
                  <Button
                    type="button"
                    variant={side === "sell" ? "default" : "outline"}
                    className={cn("w-full", side === "sell" && "bg-rose-600 hover:bg-rose-700")}
                    onClick={() => setSide("sell")}
                  >
                    <TrendingDown className="size-4 mr-2" />
                    Sell
                  </Button>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Quantity</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Price</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* ── EXECUTE mode extras ────────────────────────────────────── */}
          {executionMode === "execute" && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">Algo Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Algorithm</label>
                  <Select value={algo} onValueChange={(v) => setAlgo(v as AlgoType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALGO_OPTIONS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional algo params */}
                {(algo === "TWAP" || algo === "VWAP") && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Duration (seconds)</label>
                      <Input
                        type="number"
                        placeholder="3600"
                        value={algoParamDuration}
                        onChange={(e) => setAlgoParamDuration(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Slices</label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={algoParamSlices}
                        onChange={(e) => setAlgoParamSlices(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </>
                )}

                {algo === "ICEBERG" && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Display Quantity</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={algoParamDisplayQty}
                      onChange={(e) => setAlgoParamDisplayQty(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                )}

                {algo === "BENCHMARK_FILL" && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Benchmark</label>
                    <Select value={algoParamBenchmark} onValueChange={setAlgoParamBenchmark}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select benchmark" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARRIVAL">Arrival Price</SelectItem>
                        <SelectItem value="CLOSE">Close Price</SelectItem>
                        <SelectItem value="OPEN">Open Price</SelectItem>
                        <SelectItem value="VWAP">VWAP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── RECORD_ONLY mode extras ────────────────────────────────── */}
          {executionMode === "record_only" && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">Trade Record Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Counterparty</label>
                  <Input
                    value={counterparty}
                    onChange={(e) => setCounterparty(e.target.value)}
                    placeholder="e.g. Goldman Sachs, Jump Trading"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Source Reference</label>
                  <Input
                    value={sourceReference}
                    onChange={(e) => setSourceReference(e.target.value)}
                    placeholder="e.g. Bloomberg ticket ID, chat reference"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Fee</label>
                  <Input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="0.00"
                    className="font-mono"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* ── Preview ────────────────────────────────────────────────── */}
          {orderState === "preview" && (
            <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
              <p className="text-sm font-medium">Order Preview</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">Mode</span>
                <span>
                  <Badge variant="outline" className="text-[10px]">
                    {executionMode === "execute" ? "EXECUTE" : "RECORD ONLY"}
                  </Badge>
                </span>
                <span className="text-muted-foreground">Category</span>
                <span>{CATEGORY_LABELS[category]}</span>
                <span className="text-muted-foreground">Side</span>
                <span className={cn("font-medium", side === "buy" ? "text-emerald-500" : "text-rose-500")}>
                  {side.toUpperCase()}
                </span>
                <span className="text-muted-foreground">Instrument</span>
                <span className="font-mono">{instrument}</span>
                <span className="text-muted-foreground">Venue</span>
                <span>{venue}</span>
                <span className="text-muted-foreground">Price</span>
                <span className="font-mono">
                  {priceNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-mono">{qty}</span>
                <span className="text-muted-foreground">Total</span>
                <span className="font-mono font-medium">
                  {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                {executionMode === "execute" && (
                  <>
                    <span className="text-muted-foreground">Algorithm</span>
                    <span>{algo}</span>
                  </>
                )}
                {executionMode === "record_only" && counterparty && (
                  <>
                    <span className="text-muted-foreground">Counterparty</span>
                    <span>{counterparty}</span>
                  </>
                )}
                {executionMode === "record_only" && sourceReference && (
                  <>
                    <span className="text-muted-foreground">Source Ref</span>
                    <span className="font-mono">{sourceReference}</span>
                  </>
                )}
                {executionMode === "record_only" && fee && (
                  <>
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-mono">{fee}</span>
                  </>
                )}
                {orgId && (
                  <>
                    <span className="text-muted-foreground">Organization</span>
                    <span>{orgId}</span>
                  </>
                )}
                {clientId && (
                  <>
                    <span className="text-muted-foreground">Client</span>
                    <span>{clientId}</span>
                  </>
                )}
                {strategyId !== "manual" && (
                  <>
                    <span className="text-muted-foreground">Strategy</span>
                    <span>{strategyId}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Compliance Check (EXECUTE mode only) ───────────────────── */}
          {orderState === "preview" && executionMode === "execute" && (
            <div className="p-4 rounded-lg border space-y-3">
              <p className="text-xs font-medium flex items-center gap-1.5">
                {complianceLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                {!complianceLoading && complianceResult?.passed && <ShieldCheck className="size-3.5 text-emerald-500" />}
                {!complianceLoading && complianceResult && !complianceResult.passed && <ShieldX className="size-3.5 text-rose-500" />}
                {!complianceLoading && complianceUnavailable && <AlertTriangle className="size-3.5 text-amber-500" />}
                Pre-Trade Compliance
              </p>

              {complianceLoading && (
                <p className="text-xs text-muted-foreground">Running compliance checks...</p>
              )}

              {complianceUnavailable && (
                <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Compliance check unavailable — submission permitted with caution
                  </span>
                </div>
              )}

              {complianceResult && (
                <>
                  <div className="space-y-1.5">
                    {complianceResult.checks.map((check) => (
                      <div key={check.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={check.passed ? "outline" : "destructive"}
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              check.passed && "border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {check.passed ? "PASS" : "FAIL"}
                          </Badge>
                          <span className="text-muted-foreground">{check.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="text-muted-foreground" title="Limit">{check.limit_value}</span>
                          <span className="text-muted-foreground">/</span>
                          <span title="Current">{check.current_value}</span>
                          <span className="text-muted-foreground">-&gt;</span>
                          <span className={cn(!check.passed && "text-rose-500 font-medium")} title="Proposed">
                            {check.proposed_value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-2 p-2 rounded text-xs",
                      complianceResult.passed
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {complianceResult.passed ? (
                      <>
                        <ShieldCheck className="size-3.5 shrink-0" />
                        Pre-trade checks passed
                      </>
                    ) : (
                      <>
                        <ShieldX className="size-3.5 shrink-0" />
                        Order rejected — {failedCheck?.name ?? "compliance check"} violated
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Status Messages ────────────────────────────────────────── */}
          {orderState === "success" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm text-emerald-500">
                {executionMode === "execute" ? "Order submitted successfully" : "Trade recorded successfully"}
              </span>
            </div>
          )}
          {orderState === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <XCircle className="size-4 text-rose-500" />
              <span className="text-sm text-rose-500">{errorMessage}</span>
            </div>
          )}

          {/* ── Action Buttons ─────────────────────────────────────────── */}
          <div className="flex gap-2">
            {orderState === "idle" && (
              <Button className="flex-1" onClick={handlePreview} disabled={!canPreview}>
                Preview Order
              </Button>
            )}
            {orderState === "preview" && (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setOrderState("idle")}>
                  Edit
                </Button>
                <Button
                  className={cn(
                    "flex-1",
                    side === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  )}
                  onClick={handleSubmit}
                  disabled={complianceLoading || (!compliancePassed && !complianceLoading)}
                >
                  {complianceLoading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : executionMode === "execute" ? (
                    <>Confirm {side === "buy" ? "Buy" : "Sell"}</>
                  ) : (
                    <>Record Trade</>
                  )}
                </Button>
              </>
            )}
            {orderState === "submitting" && (
              <Button className="flex-1" disabled>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {executionMode === "execute" ? "Submitting..." : "Recording..."}
              </Button>
            )}
            {orderState === "error" && (
              <Button variant="outline" className="flex-1" onClick={() => setOrderState("preview")}>
                Retry
              </Button>
            )}
          </div>

          {/* ── User Badge ─────────────────────────────────────────────── */}
          {user && (
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">{user.org?.id ?? "unknown org"}</Badge>
              <span>Submitted by {user.displayName ?? user.email ?? "unknown"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
