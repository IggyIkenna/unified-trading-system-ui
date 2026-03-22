"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, Loader2, CheckCircle2, XCircle, PenLine, AlertTriangle, ShieldCheck, ShieldX } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlaceOrder, usePreTradeCheck } from "@/hooks/api/use-orders"
import { useAuth } from "@/hooks/use-auth"

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

interface ManualTradingPanelProps {
  defaultInstrument?: string
  defaultVenue?: string
  currentPrice?: number
  instruments?: Array<{ symbol: string; venue: string }>
  strategies?: Array<{ id: string; name: string }>
}

type OrderState = "idle" | "preview" | "submitting" | "success" | "error"

export function ManualTradingPanel({
  defaultInstrument = "BTC/USDT",
  defaultVenue = "Binance",
  currentPrice = 0,
  instruments = [],
  strategies = [],
}: ManualTradingPanelProps) {
  const { user } = useAuth()
  const placeOrder = usePlaceOrder()
  const preTradeCheck = usePreTradeCheck()

  const [open, setOpen] = React.useState(false)
  const [side, setSide] = React.useState<"buy" | "sell">("buy")
  const [orderType, setOrderType] = React.useState<"limit" | "market">("limit")
  const [instrument, setInstrument] = React.useState(defaultInstrument)
  const [venue, setVenue] = React.useState(defaultVenue)
  const [quantity, setQuantity] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [strategyId, setStrategyId] = React.useState("manual")
  const [reason, setReason] = React.useState("")
  const [orderState, setOrderState] = React.useState<OrderState>("idle")
  const [errorMessage, setErrorMessage] = React.useState("")
  const [complianceResult, setComplianceResult] = React.useState<PreTradeCheckResponse | null>(null)
  const [complianceUnavailable, setComplianceUnavailable] = React.useState(false)
  const [complianceLoading, setComplianceLoading] = React.useState(false)

  React.useEffect(() => {
    setInstrument(defaultInstrument)
  }, [defaultInstrument])

  React.useEffect(() => {
    setVenue(defaultVenue)
  }, [defaultVenue])

  const effectivePrice = orderType === "market" ? currentPrice : parseFloat(price) || 0
  const qty = parseFloat(quantity) || 0
  const total = effectivePrice * qty

  const canPreview = qty > 0 && (orderType === "market" || effectivePrice > 0)

  const handlePreview = async () => {
    if (!canPreview) return
    setOrderState("preview")
    setComplianceResult(null)
    setComplianceUnavailable(false)
    setComplianceLoading(true)
    try {
      const result = await preTradeCheck.mutateAsync({
        instrument,
        side,
        quantity: qty,
        price: orderType === "limit" ? effectivePrice : undefined,
        strategy_id: strategyId === "manual" ? undefined : strategyId,
      }) as PreTradeCheckResponse
      setComplianceResult(result)
    } catch {
      setComplianceUnavailable(true)
    } finally {
      setComplianceLoading(false)
    }
  }

  const compliancePassed = complianceUnavailable || (complianceResult?.passed ?? false)
  const failedCheck = complianceResult?.checks.find((c) => !c.passed)

  const handleSubmit = async () => {
    setOrderState("submitting")
    setErrorMessage("")
    try {
      await placeOrder.mutateAsync({
        instrument,
        side,
        order_type: orderType,
        quantity: qty,
        price: orderType === "limit" ? effectivePrice : undefined,
        venue,
        strategy_id: strategyId === "manual" ? undefined : strategyId,
        client_id: user?.org?.id,
        reason: reason || undefined,
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
    setQuantity("")
    setPrice("")
    setReason("")
    setStrategyId("manual")
    setOrderState("idle")
    setErrorMessage("")
    setComplianceResult(null)
    setComplianceUnavailable(false)
    setComplianceLoading(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) resetForm()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <PenLine className="size-3.5" />
          Manual Trade
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manual Trade Entry</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Instrument */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Instrument</label>
            {instruments.length > 0 ? (
              <Select value={instrument} onValueChange={setInstrument}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((inst) => (
                    <SelectItem key={inst.symbol} value={inst.symbol}>
                      <span className="font-mono">{inst.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-2">{inst.venue}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={instrument} onChange={(e) => setInstrument(e.target.value)} className="font-mono" />
            )}
          </div>

          {/* Venue */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Venue</label>
            <Select value={venue} onValueChange={setVenue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Binance", "Deribit", "Hyperliquid", "Coinbase", "OKX", "Bybit", "Uniswap", "Aave"].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Side */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={side === "buy" ? "default" : "outline"}
              className={cn("w-full", side === "buy" && "bg-emerald-600 hover:bg-emerald-700")}
              onClick={() => setSide("buy")}
            >
              <TrendingUp className="size-4 mr-2" />
              Buy
            </Button>
            <Button
              variant={side === "sell" ? "default" : "outline"}
              className={cn("w-full", side === "sell" && "bg-rose-600 hover:bg-rose-700")}
              onClick={() => setSide("sell")}
            >
              <TrendingDown className="size-4 mr-2" />
              Sell
            </Button>
          </div>

          {/* Order Type */}
          <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "limit" | "market")}>
            <TabsList className="w-full">
              <TabsTrigger value="limit" className="flex-1">Limit</TabsTrigger>
              <TabsTrigger value="market" className="flex-1">Market</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Price */}
          {orderType === "limit" && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Price (USD)</label>
              <Input
                type="number"
                placeholder={currentPrice > 0 ? currentPrice.toFixed(2) : "0.00"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono"
              />
            </div>
          )}

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
            <div className="flex items-center gap-1">
              {[25, 50, 75, 100].map((pct) => (
                <Button
                  key={pct}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] flex-1"
                  onClick={() => setQuantity((0.01 * pct).toFixed(4))}
                >
                  {pct}%
                </Button>
              ))}
            </div>
          </div>

          {/* Strategy Link */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Link to Strategy</label>
            <Select value={strategyId} onValueChange={setStrategyId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (unlinked)</SelectItem>
                {strategies.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Reason (optional)</label>
            <Input
              placeholder="e.g. hedge delta exposure"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <Separator />

          {/* Order Preview */}
          {orderState === "preview" && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <p className="text-xs font-medium">Order Preview</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-muted-foreground">Side</span>
                <span className={cn("font-medium", side === "buy" ? "text-emerald-500" : "text-rose-500")}>
                  {side.toUpperCase()}
                </span>
                <span className="text-muted-foreground">Instrument</span>
                <span className="font-mono">{instrument}</span>
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{orderType}</span>
                <span className="text-muted-foreground">Price</span>
                <span className="font-mono">${effectivePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-mono">{qty}</span>
                <span className="text-muted-foreground">Venue</span>
                <span>{venue}</span>
                <span className="text-muted-foreground">Total</span>
                <span className="font-mono font-medium">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* Compliance Check */}
          {orderState === "preview" && (
            <div className="p-3 rounded-lg border space-y-2">
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
                          <span className="text-muted-foreground">→</span>
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

          {/* Status Messages */}
          {orderState === "success" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm text-emerald-500">Order submitted successfully</span>
            </div>
          )}
          {orderState === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <XCircle className="size-4 text-rose-500" />
              <span className="text-sm text-rose-500">{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
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
                  ) : (
                    <>Confirm {side === "buy" ? "Buy" : "Sell"}</>
                  )}
                </Button>
              </>
            )}
            {orderState === "submitting" && (
              <Button className="flex-1" disabled>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Submitting...
              </Button>
            )}
            {orderState === "error" && (
              <Button variant="outline" className="flex-1" onClick={() => setOrderState("preview")}>
                Retry
              </Button>
            )}
          </div>

          {/* Client Badge */}
          {user && (
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">{user.org?.id ?? "unknown org"}</Badge>
              <span>Submitted by {user.displayName ?? user.email ?? "unknown"}</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
