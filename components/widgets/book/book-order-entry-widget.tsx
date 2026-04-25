"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { AlertTriangle, CheckCircle2, ShieldCheck, ShieldX, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOK_ALGO_OPTIONS, BOOK_VENUES_BY_CATEGORY, type BookCategoryTab } from "@/lib/config/services/trading.config";
import { DEFI_ALGO_TYPES, DEFI_INSTRUCTION_TYPES, SLIPPAGE_OPTIONS } from "@/lib/config/services/defi.config";
import type { AlgoType, InstructionType } from "@/lib/types/defi";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useBookTradeData, type BookAlgoType, type BookExecutionMode } from "./book-data-context";

export function BookOrderEntryWidget(_props: WidgetComponentProps) {
  const {
    executionMode,
    setExecutionMode,
    category,
    setCategory,
    venue,
    setVenue,
    instrument,
    setInstrument,
    side,
    setSide,
    quantity,
    setQuantity,
    price,
    setPrice,

    algo,
    setAlgo,
    algoParams,
    setAlgoParam,

    isDefiCategory,
    defiInstructionType,
    setDefiInstructionType,
    defiAlgo,
    setDefiAlgo,
    maxSlippageBps,
    setMaxSlippageBps,
    availableDefiAlgos,

    counterparty,
    setCounterparty,
    sourceReference,
    setSourceReference,
    fee,
    setFee,

    orgId,
    clientId,
    strategyId,

    orderState,
    setOrderState,
    errorMessage,
    complianceResult,
    complianceUnavailable,
    complianceLoading,
    compliancePassed,

    qty,
    priceNum,
    total,
    canPreview,
    canExecute,

    handlePreview,
    handleSubmit,

    user,
    categoryLabels,
  } = useBookTradeData();

  const categoryEntries = Object.entries(categoryLabels) as Array<[BookCategoryTab, string]>;
  const failedCheck = complianceResult?.checks.find((c) => !c.passed);
  const defiAlgoMeta = DEFI_ALGO_TYPES.find((a) => a.value === defiAlgo);
  const showCefiAlgoParams = !isDefiCategory && executionMode === "execute";
  const showDefiInstruction = isDefiCategory;
  const showDefiExecuteExtras = isDefiCategory && executionMode === "execute";
  const showRecordDetails = executionMode === "record_only";

  return (
    <div className="p-2 space-y-3 h-full overflow-auto">
      <div>
        <h2 className="text-base font-semibold">Book Trade</h2>
        <p className="text-xs text-muted-foreground">Manual trade entry for back-office booking and live execution</p>
      </div>

      {orderState === "idle" && (
        <>
          <Tabs value={executionMode} onValueChange={(v) => setExecutionMode(v as BookExecutionMode)}>
            <TabsList className="w-full h-8">
              <TabsTrigger value="execute" className="flex-1 text-xs">
                Execute
              </TabsTrigger>
              <TabsTrigger value="record_only" className="flex-1 text-xs">
                Record Only
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={category} onValueChange={(v) => setCategory(v as BookCategoryTab)}>
            <TabsList className="w-full flex-wrap h-auto gap-0.5">
              {categoryEntries.map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="flex-1 text-caption px-1">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="py-0 gap-0">
              <CardContent className="space-y-3 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-caption text-muted-foreground">Venue</label>
                    <Select value={venue} onValueChange={setVenue}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {(BOOK_VENUES_BY_CATEGORY[category] ?? []).map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-caption text-muted-foreground">Instrument</label>
                    <Input
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value)}
                      placeholder={category === "cefi_spot" ? "BTC/USDT" : category === "tradfi" ? "AAPL" : "ETH/USDC"}
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>

                {isDefiCategory ? (
                  <div className="space-y-1">
                    <label className="text-caption text-muted-foreground">Direction</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={side === "buy" ? "default" : "outline"}
                        className={cn("h-8 text-xs", side === "buy" && "bg-emerald-600 hover:bg-emerald-700")}
                        onClick={() => setSide("buy")}
                      >
                        <TrendingUp className="size-3.5 mr-1" />
                        Buy / In
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={side === "sell" ? "default" : "outline"}
                        className={cn("h-8 text-xs", side === "sell" && "bg-rose-600 hover:bg-rose-700")}
                        onClick={() => setSide("sell")}
                      >
                        <TrendingDown className="size-3.5 mr-1" />
                        Sell / Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-caption text-muted-foreground">Side</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={side === "buy" ? "default" : "outline"}
                        className={cn("h-8 text-xs", side === "buy" && "bg-emerald-600 hover:bg-emerald-700")}
                        onClick={() => setSide("buy")}
                      >
                        <TrendingUp className="size-3.5 mr-1" />
                        Buy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={side === "sell" ? "default" : "outline"}
                        className={cn("h-8 text-xs", side === "sell" && "bg-rose-600 hover:bg-rose-700")}
                        onClick={() => setSide("sell")}
                      >
                        <TrendingDown className="size-3.5 mr-1" />
                        Sell
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-caption text-muted-foreground">Quantity</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="h-8 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-caption text-muted-foreground">Price</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {showDefiInstruction && (
                <Card className="py-0 gap-0">
                  <CardContent className="space-y-3 p-3">
                    <div className="space-y-1">
                      <label className="text-caption text-muted-foreground">Instruction Type</label>
                      <Select
                        value={defiInstructionType}
                        onValueChange={(v) => setDefiInstructionType(v as InstructionType)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select instruction" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFI_INSTRUCTION_TYPES.map((it) => (
                            <SelectItem key={it.value} value={it.value}>
                              <span className="font-medium">{it.label}</span>
                              <span className="ml-1.5 text-muted-foreground text-caption">{it.description}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-caption text-muted-foreground">Algo</label>
                      <Select value={defiAlgo} onValueChange={(v) => setDefiAlgo(v as AlgoType)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select algo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDefiAlgos.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {defiAlgoMeta && <p className="text-caption text-muted-foreground">{defiAlgoMeta.description}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-caption text-muted-foreground">Max Slippage</label>
                      <Select value={String(maxSlippageBps)} onValueChange={(v) => setMaxSlippageBps(Number(v))}>
                        <SelectTrigger className="h-8 text-xs font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SLIPPAGE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              {opt.label} ({opt.value} bps)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {showDefiExecuteExtras && defiAlgo === "SOR_TWAP" && (
                      <>
                        <div className="space-y-1">
                          <label className="text-caption text-muted-foreground">Duration (seconds)</label>
                          <Input
                            type="number"
                            placeholder="3600"
                            value={algoParams.duration}
                            onChange={(e) => setAlgoParam("duration", e.target.value)}
                            className="h-8 font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-caption text-muted-foreground">Slices</label>
                          <Input
                            type="number"
                            placeholder="10"
                            value={algoParams.slices}
                            onChange={(e) => setAlgoParam("slices", e.target.value)}
                            className="h-8 font-mono text-xs"
                          />
                        </div>
                      </>
                    )}

                    {showDefiExecuteExtras && defiAlgo === "BENCHMARK_FILL" && (
                      <div className="space-y-1">
                        <label className="text-caption text-muted-foreground">Benchmark</label>
                        <Select value={algoParams.benchmark} onValueChange={(v) => setAlgoParam("benchmark", v)}>
                          <SelectTrigger className="h-8 text-xs">
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

              {showCefiAlgoParams && (
                <Card className="py-0 gap-0">
                  <CardContent className="space-y-3 p-3">
                    <div className="space-y-1">
                      <label className="text-caption text-muted-foreground">Algorithm</label>
                      <Select value={algo} onValueChange={(v) => setAlgo(v as BookAlgoType)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BOOK_ALGO_OPTIONS.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(algo === "TWAP" || algo === "VWAP") && (
                      <>
                        <div className="space-y-1">
                          <label className="text-caption text-muted-foreground">Duration (seconds)</label>
                          <Input
                            type="number"
                            placeholder="3600"
                            value={algoParams.duration}
                            onChange={(e) => setAlgoParam("duration", e.target.value)}
                            className="h-8 font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-caption text-muted-foreground">Slices</label>
                          <Input
                            type="number"
                            placeholder="10"
                            value={algoParams.slices}
                            onChange={(e) => setAlgoParam("slices", e.target.value)}
                            className="h-8 font-mono text-xs"
                          />
                        </div>
                      </>
                    )}

                    {algo === "ICEBERG" && (
                      <div className="space-y-1">
                        <label className="text-caption text-muted-foreground">Display Quantity</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={algoParams.displayQty}
                          onChange={(e) => setAlgoParam("displayQty", e.target.value)}
                          className="h-8 font-mono text-xs"
                        />
                      </div>
                    )}

                    {algo === "BENCHMARK_FILL" && (
                      <div className="space-y-1">
                        <label className="text-caption text-muted-foreground">Benchmark</label>
                        <Select value={algoParams.benchmark} onValueChange={(v) => setAlgoParam("benchmark", v)}>
                          <SelectTrigger className="h-8 text-xs">
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

                    {algo === "SOR" && (
                      <p className="text-caption text-muted-foreground">
                        Smart Order Routing splits this order across configured venues based on top-of-book liquidity.
                        Per-venue limits and routing rules are managed in the venue registry.
                      </p>
                    )}

                    {algo === "BEST_PRICE" && (
                      <p className="text-caption text-muted-foreground">
                        Routes the full order to the single venue showing the best price at submission time. No
                        additional parameters required.
                      </p>
                    )}

                    {algo === "MARKET" && (
                      <p className="text-caption text-muted-foreground">
                        Marketable order at the best available price. Price field may be left empty.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {showRecordDetails && (
                <Card className="py-0 gap-0">
                  <CardContent className="space-y-3 p-3">
                    <div className="space-y-1">
                      <label className="text-caption text-muted-foreground">Counterparty</label>
                      <Input
                        value={counterparty}
                        onChange={(e) => setCounterparty(e.target.value)}
                        placeholder="e.g. Goldman Sachs, Jump Trading"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-caption text-muted-foreground">Source Reference</label>
                      <Input
                        value={sourceReference}
                        onChange={(e) => setSourceReference(e.target.value)}
                        placeholder="e.g. Bloomberg ticket ID, chat reference"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-caption text-muted-foreground">Fee</label>
                      <Input
                        type="number"
                        value={fee}
                        onChange={(e) => setFee(e.target.value)}
                        placeholder="0.00"
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {!canExecute && executionMode === "execute" && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
              <span className="text-caption text-amber-600 dark:text-amber-400">
                Execution access required — contact admin to upgrade
              </span>
            </div>
          )}

          <Button
            className="w-full h-8"
            onClick={handlePreview}
            disabled={!canPreview || (!canExecute && executionMode === "execute")}
          >
            Preview Order
          </Button>

          {user && (
            <div className="flex items-center gap-2 pt-1 text-caption text-muted-foreground">
              <Badge variant="outline" className="text-nano">
                {user.org?.id ?? "unknown org"}
              </Badge>
              <span>Submitted by {user.displayName ?? user.email ?? "unknown"}</span>
            </div>
          )}
        </>
      )}

      {orderState === "preview" && (
        <>
          <div className="p-3 rounded-md border bg-muted/30 space-y-2">
            <p className="text-xs font-medium">Summary</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-caption">
              <span className="text-muted-foreground">Mode</span>
              <span>
                <Badge variant="outline" className="text-nano">
                  {executionMode === "execute" ? "EXECUTE" : "RECORD ONLY"}
                </Badge>
              </span>
              <span className="text-muted-foreground">Category</span>
              <span>{categoryLabels[category]}</span>
              <span className="text-muted-foreground">Side</span>
              <span className={cn("font-medium", side === "buy" ? "text-emerald-500" : "text-rose-500")}>
                {side.toUpperCase()}
              </span>
              <span className="text-muted-foreground">Instrument</span>
              <span className="font-mono">{instrument}</span>
              <span className="text-muted-foreground">Venue</span>
              <span>{venue}</span>
              <span className="text-muted-foreground">Price</span>
              <span className="font-mono">{priceNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-mono">{qty}</span>
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono font-medium">
                {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {executionMode === "execute" && (
                <>
                  <span className="text-muted-foreground">Algorithm</span>
                  <span>{isDefiCategory ? (defiAlgoMeta?.label ?? defiAlgo) : algo}</span>
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

          {executionMode === "execute" && (
            <div className="p-3 rounded-md border space-y-2">
              <p className="text-caption font-medium flex items-center gap-1.5">
                {complianceLoading && <Spinner size="sm" className="size-3 text-muted-foreground" />}
                {!complianceLoading && complianceResult?.passed && <ShieldCheck className="size-3 text-emerald-500" />}
                {!complianceLoading && complianceResult && !complianceResult.passed && (
                  <ShieldX className="size-3 text-rose-500" />
                )}
                {!complianceLoading && complianceUnavailable && <AlertTriangle className="size-3 text-amber-500" />}
                Pre-Trade Compliance
              </p>

              {complianceLoading && <p className="text-caption text-muted-foreground">Running compliance checks...</p>}

              {complianceUnavailable && (
                <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                  <span className="text-caption text-amber-600 dark:text-amber-400">
                    Compliance check unavailable — submission permitted with caution
                  </span>
                </div>
              )}

              {complianceResult && (
                <>
                  <div className="space-y-1">
                    {complianceResult.checks.map((check) => (
                      <div key={check.name} className="flex items-center justify-between text-caption">
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={check.passed ? "outline" : "destructive"}
                            className={cn(
                              "text-nano px-1 py-0",
                              check.passed && "border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            {check.passed ? "PASS" : "FAIL"}
                          </Badge>
                          <span className="text-muted-foreground">{check.name}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-nano">
                          <span className="text-muted-foreground" title="Limit">
                            {check.limit_value}
                          </span>
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
                      "flex items-center gap-2 p-2 rounded text-caption",
                      complianceResult.passed
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {complianceResult.passed ? (
                      <>
                        <ShieldCheck className="size-3 shrink-0" />
                        Pre-trade checks passed
                      </>
                    ) : (
                      <>
                        <ShieldX className="size-3 shrink-0" />
                        Order rejected — {failedCheck?.name ?? "compliance check"} violated
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-8 text-xs" onClick={() => setOrderState("idle")}>
              Edit
            </Button>
            <Button
              className={cn(
                "flex-1 h-8 text-xs",
                side === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
              )}
              onClick={handleSubmit}
              disabled={
                complianceLoading ||
                (!compliancePassed && !complianceLoading) ||
                (!canExecute && executionMode === "execute")
              }
            >
              {complianceLoading ? (
                <>
                  <Spinner size="sm" className="size-3.5 mr-1.5" />
                  Checking...
                </>
              ) : executionMode === "execute" ? (
                <>Confirm {side === "buy" ? "Buy" : "Sell"}</>
              ) : (
                <>Record Trade</>
              )}
            </Button>
          </div>
        </>
      )}

      {orderState === "submitting" && (
        <Button className="w-full h-8" disabled>
          <Spinner size="sm" className="size-3.5 mr-2" />
          {executionMode === "execute" ? "Submitting..." : "Recording..."}
        </Button>
      )}

      {orderState === "success" && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span className="text-xs text-emerald-500">
            {executionMode === "execute" ? "Order submitted successfully" : "Trade recorded successfully"}
          </span>
        </div>
      )}

      {orderState === "error" && (
        <>
          <div className="flex items-center gap-2 p-2 rounded-md bg-rose-500/10 border border-rose-500/30">
            <XCircle className="size-3.5 text-rose-500" />
            <span className="text-xs text-rose-500">{errorMessage}</span>
          </div>
          <Button variant="outline" className="w-full h-8 text-xs" onClick={() => setOrderState("preview")}>
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
