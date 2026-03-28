"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ShieldX,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { ALGOS, VENUES } from "./constants";
import type { ManualTradingPanelProps, OrderState, PreTradeCheckResponse } from "./types";

export interface SingleOrderFormProps extends Pick<
  ManualTradingPanelProps,
  "instruments" | "strategies" | "currentPrice"
> {
  side: "buy" | "sell";
  setSide: (s: "buy" | "sell") => void;
  orderType: "limit" | "market";
  setOrderType: (t: "limit" | "market") => void;
  instrument: string;
  setInstrument: (v: string) => void;
  venue: string;
  setVenue: (v: string) => void;
  quantity: string;
  setQuantity: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  strategyId: string;
  setStrategyId: (v: string) => void;
  reason: string;
  setReason: (v: string) => void;
  algo: string;
  setAlgo: (v: string) => void;
  algoParams: Record<string, number>;
  setAlgoParams: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  executionMode: "execute" | "record_only";
  setExecutionMode: (v: "execute" | "record_only") => void;
  counterparty: string;
  setCounterparty: (v: string) => void;
  sourceReference: string;
  setSourceReference: (v: string) => void;
  orderState: OrderState;
  setOrderState: (s: OrderState) => void;
  errorMessage: string;
  complianceResult: PreTradeCheckResponse | null;
  complianceUnavailable: boolean;
  complianceLoading: boolean;
  effectivePrice: number;
  qty: number;
  total: number;
  canPreview: boolean;
  handlePreview: () => void;
  handleSubmit: () => void;
}

export function SingleOrderForm({
  instruments = [],
  strategies = [],
  currentPrice = 0,
  side,
  setSide,
  orderType,
  setOrderType,
  instrument,
  setInstrument,
  venue,
  setVenue,
  quantity,
  setQuantity,
  price,
  setPrice,
  strategyId,
  setStrategyId,
  reason,
  setReason,
  algo,
  setAlgo,
  algoParams,
  setAlgoParams,
  executionMode,
  setExecutionMode,
  counterparty,
  setCounterparty,
  sourceReference,
  setSourceReference,
  orderState,
  setOrderState,
  errorMessage,
  complianceResult,
  complianceUnavailable,
  complianceLoading,
  effectivePrice,
  qty,
  total,
  canPreview,
  handlePreview,
  handleSubmit,
}: SingleOrderFormProps) {
  const compliancePassed = complianceUnavailable || (complianceResult?.passed ?? false);
  const failedCheck = complianceResult?.checks.find((c) => !c.passed);

  return (
    <>
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

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Venue</label>
        <Select value={venue} onValueChange={setVenue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VENUES.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "limit" | "market")}>
        <TabsList className="w-full">
          <TabsTrigger value="limit" className="flex-1">
            Limit
          </TabsTrigger>
          <TabsTrigger value="market" className="flex-1">
            Market
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Algo</label>
        <Select
          value={algo}
          onValueChange={(v) => {
            setAlgo(v);
            setAlgoParams({});
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALGOS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {algo === "TWAP" && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Duration (minutes)</label>
          <Input
            type="number"
            placeholder="e.g. 30"
            value={algoParams.duration_minutes ?? ""}
            onChange={(e) =>
              setAlgoParams({
                ...algoParams,
                duration_minutes: parseFloat(e.target.value) || 0,
              })
            }
            className="font-mono"
          />
        </div>
      )}
      {algo === "ICEBERG" && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Number of Slices</label>
          <Input
            type="number"
            placeholder="e.g. 5"
            value={algoParams.num_slices ?? ""}
            onChange={(e) =>
              setAlgoParams({
                ...algoParams,
                num_slices: parseFloat(e.target.value) || 0,
              })
            }
            className="font-mono"
          />
        </div>
      )}
      {algo === "SOR" && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Max Slippage (bps)</label>
          <Input
            type="number"
            placeholder="e.g. 10"
            value={algoParams.max_slippage_bps ?? ""}
            onChange={(e) =>
              setAlgoParams({
                ...algoParams,
                max_slippage_bps: parseFloat(e.target.value) || 0,
              })
            }
            className="font-mono"
          />
        </div>
      )}

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

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Link to Strategy</label>
        <Select value={strategyId} onValueChange={setStrategyId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual (unlinked)</SelectItem>
            {strategies.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Reason (optional)</label>
        <Input placeholder="e.g. hedge delta exposure" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Execution Mode</label>
        <Tabs value={executionMode} onValueChange={(v) => setExecutionMode(v as "execute" | "record_only")}>
          <TabsList className="w-full">
            <TabsTrigger value="execute" className="flex-1">
              Execute
            </TabsTrigger>
            <TabsTrigger value="record_only" className="flex-1">
              Record Only
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {executionMode === "record_only" && (
        <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Counterparty</label>
            <Input
              placeholder="e.g. Goldman Sachs"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Source Reference</label>
            <Input
              placeholder="e.g. Bloomberg ticket #12345"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
            />
          </div>
        </div>
      )}

      <Separator />

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
            <span className="font-mono">
              $
              {effectivePrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-mono">{qty}</span>
            <span className="text-muted-foreground">Venue</span>
            <span>{venue}</span>
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono font-medium">
              $
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      )}

      {orderState === "preview" && (
        <div className="p-3 rounded-lg border space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5">
            {complianceLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            {!complianceLoading && complianceResult?.passed && <ShieldCheck className="size-3.5 text-emerald-500" />}
            {!complianceLoading && complianceResult && !complianceResult.passed && (
              <ShieldX className="size-3.5 text-rose-500" />
            )}
            {!complianceLoading && complianceUnavailable && <AlertTriangle className="size-3.5 text-amber-500" />}
            Pre-Trade Compliance
          </p>

          {complianceLoading && <p className="text-xs text-muted-foreground">Running compliance checks...</p>}

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
                          check.passed && "border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {check.passed ? "PASS" : "FAIL"}
                      </Badge>
                      <span className="text-muted-foreground">{check.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-muted-foreground" title="Limit">
                        {check.limit_value}
                      </span>
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
                    : "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400",
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
                side === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
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
    </>
  );
}
