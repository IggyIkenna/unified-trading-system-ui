"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOK_VENUES_BY_CATEGORY, type BookCategoryTab } from "@/lib/config/services/trading.config";
import { DEFI_INSTRUCTION_TYPES, SLIPPAGE_OPTIONS } from "@/lib/config/services/defi.config";
import type { InstructionType, AlgoType } from "@/lib/types/defi";
import type { BookExecutionMode } from "./book-data-context";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useBookTradeData } from "./book-data-context";

export function BookOrderFormWidget(_props: WidgetComponentProps) {
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
    orderState,
    canPreview,
    canExecute,
    handlePreview,
    user,
    categoryLabels,
    isDefiCategory,
    defiInstructionType,
    setDefiInstructionType,
    defiAlgo,
    setDefiAlgo,
    maxSlippageBps,
    setMaxSlippageBps,
    availableDefiAlgos,
  } = useBookTradeData();

  const categoryEntries = Object.entries(categoryLabels) as Array<[BookCategoryTab, string]>;

  return (
    <div className="p-2 space-y-3">
      <div>
        <h2 className="text-base font-semibold">Book Trade</h2>
        <p className="text-xs text-muted-foreground">Manual trade entry for back-office booking and live execution</p>
      </div>

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
            <TabsTrigger key={key} value={key} className="flex-1 text-[10px] px-1">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <span className="text-xs font-medium text-muted-foreground">Instrument & size</span>
        </CardHeader>
        <CardContent className="space-y-3 px-3 pb-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Venue</label>
            <Select value={venue} onValueChange={setVenue}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                {BOOK_VENUES_BY_CATEGORY[category].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Instrument</label>
            <Input
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              placeholder={category === "cefi_spot" ? "BTC/USDT" : category === "tradfi" ? "AAPL" : "ETH/USDC"}
              className="h-8 font-mono text-xs"
            />
          </div>

          {isDefiCategory ? (
            <>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Instruction Type</label>
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
                        <span className="ml-1.5 text-muted-foreground text-[10px]">{it.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Algo</label>
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
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Max Slippage</label>
                <Select
                  value={String(maxSlippageBps)}
                  onValueChange={(v) => setMaxSlippageBps(Number(v))}
                >
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
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Side</label>
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

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Quantity</label>
            <Input
              type="number"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Price</label>
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {!canExecute && executionMode === "execute" && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] text-amber-600 dark:text-amber-400">
            Execution access required — contact admin to upgrade
          </span>
        </div>
      )}

      {orderState === "idle" && (
        <Button
          className="w-full h-8"
          onClick={handlePreview}
          disabled={!canPreview || (!canExecute && executionMode === "execute")}
        >
          Preview Order
        </Button>
      )}

      {user && (
        <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
          <Badge variant="outline" className="text-[9px]">
            {user.org?.id ?? "unknown org"}
          </Badge>
          <span>Submitted by {user.displayName ?? user.email ?? "unknown"}</span>
        </div>
      )}
    </div>
  );
}
