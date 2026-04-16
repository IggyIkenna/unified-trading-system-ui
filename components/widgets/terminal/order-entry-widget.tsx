"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Shield, Target, Zap, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STRATEGIES } from "@/lib/strategy-registry";
import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";
import { useTerminalData } from "./terminal-data-context";
import * as React from "react";
import { formatNumber } from "@/lib/utils/formatters";

export function OrderEntryWidget(_props: WidgetComponentProps) {
  const {
    selectedInstrument,
    livePrice,
    orderType,
    setOrderType,
    orderSide,
    setOrderSide,
    orderPrice,
    setOrderPrice,
    orderSize,
    setOrderSize,
    linkedStrategyId,
    setLinkedStrategyId,
    linkedStrategy,
    strategyWarnings,
    handleSubmitOrder,
    isContextComplete,
    isBatchMode,
  } = useTerminalData();
  const { isSubmitting, error, clearError, handleSubmit } = useFormSubmit();

  const [constraintsOpen, setConstraintsOpen] = React.useState(false);
  const sizeNum = parseFloat(orderSize) || 0;
  const priceNum = orderType === "market" ? livePrice : parseFloat(orderPrice) || 0;
  const total = sizeNum * priceNum;

  const formatPrice = (v: number) => {
    if (v >= 1000) return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (v >= 1) return formatNumber(v, 4);
    return formatNumber(v, 6);
  };

  return (
    <Card className="h-full border-0 rounded-none flex flex-col">
      <FormWidget error={error} onClearError={clearError} className="flex-1 overflow-auto px-3 pb-3 pt-2">
        {/* Buy / Sell toggle */}
        <div className="grid grid-cols-2 gap-1">
          <Button
            variant={orderSide === "buy" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8", orderSide === "buy" && "bg-emerald-600 hover:bg-emerald-700")}
            onClick={() => setOrderSide("buy")}
          >
            <TrendingUp className="size-3 mr-1" /> Buy
          </Button>
          <Button
            variant={orderSide === "sell" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8", orderSide === "sell" && "bg-rose-600 hover:bg-rose-700")}
            onClick={() => setOrderSide("sell")}
          >
            <TrendingDown className="size-3 mr-1" /> Sell
          </Button>
        </div>

        {/* Order type */}
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "limit" | "market")}>
          <TabsList className="w-full">
            <TabsTrigger value="limit" className="flex-1 text-xs">
              Limit
            </TabsTrigger>
            <TabsTrigger value="market" className="flex-1 text-xs">
              Market
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Price */}
        {orderType === "limit" && (
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Price</label>
            <Input
              type="number"
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              placeholder={formatPrice(livePrice)}
              className="h-8 text-xs font-mono"
            />
          </div>
        )}

        {/* Size */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground">Size</label>
          <Input
            type="number"
            value={orderSize}
            onChange={(e) => setOrderSize(e.target.value)}
            placeholder="0.00"
            className="h-8 text-xs font-mono"
          />
          <div className="flex gap-1 mt-1">
            {[25, 50, 75, 100].map((pct) => (
              <Button
                key={pct}
                variant="ghost"
                size="sm"
                className="flex-1 h-5 text-[9px]"
                onClick={() => setOrderSize(String(pct / 10))}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between py-2 border-y border-border text-xs">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-medium">
            ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Strategy link */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground">Strategy</label>
          <Select
            value={linkedStrategyId ?? "manual"}
            onValueChange={(v) => setLinkedStrategyId(v === "manual" ? null : v)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual" className="text-xs">
                Manual Trade
              </SelectItem>
              {STRATEGIES.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Strategy constraints */}
        {linkedStrategy && (
          <Collapsible open={constraintsOpen} onOpenChange={setConstraintsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full">
              {constraintsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              <Shield className="size-3" /> Strategy Constraints
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-2 rounded-md bg-muted/30 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>Archetype:</span>
                <Badge variant="outline" className="text-[9px] h-4">
                  {String((linkedStrategy as Record<string, unknown>).archetype ?? "")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Execution:</span>
                <span className="font-mono">
                  {String((linkedStrategy as Record<string, unknown>).executionMode ?? "")}
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Warnings */}
        {strategyWarnings.length > 0 && (
          <div className="space-y-1">
            {strategyWarnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 p-2 rounded-md bg-amber-500/10 text-[10px] text-amber-400"
              >
                <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <Button
          className={cn(
            "w-full h-9 font-medium",
            orderSide === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
          )}
          disabled={!isContextComplete || sizeNum <= 0 || isBatchMode || isSubmitting}
          onClick={() => handleSubmit(handleSubmitOrder)}
        >
          {orderSide === "buy" ? "Buy" : "Sell"} {selectedInstrument.symbol}
        </Button>

        {isBatchMode && (
          <p className="text-[10px] text-amber-500 text-center">Order submission disabled in batch mode</p>
        )}
      </FormWidget>
    </Card>
  );
}
