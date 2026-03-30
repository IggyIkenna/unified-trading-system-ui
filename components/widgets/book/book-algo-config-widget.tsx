"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BOOK_ALGO_OPTIONS } from "@/lib/config/services/trading.config";
import { DEFI_ALGO_TYPES } from "@/lib/config/services/defi.config";
import type { BookAlgoType } from "./book-data-context";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { useBookTradeData } from "./book-data-context";

export function BookAlgoConfigWidget(_props: WidgetComponentProps) {
  const {
    executionMode,
    algo,
    setAlgo,
    algoParams,
    setAlgoParam,
    isDefiCategory,
    defiInstructionType,
    defiAlgo,
    availableDefiAlgos,
    maxSlippageBps,
  } = useBookTradeData();

  if (executionMode !== "execute") {
    return <div className="p-2 text-[11px] text-muted-foreground">Switch to Execute mode to configure algorithms.</div>;
  }

  // DeFi algo config — shows a summary of the selections made in the order form
  // plus DeFi-specific parameters
  if (isDefiCategory) {
    const algoMeta = DEFI_ALGO_TYPES.find((a) => a.value === defiAlgo);
    return (
      <div className="p-2">
        <CollapsibleSection title="DeFi execution parameters" defaultOpen>
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-3 pt-1 px-2 pb-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Instruction</label>
                <div className="text-xs font-medium">{defiInstructionType.replace(/_/g, " ")}</div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Selected Algo</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{algoMeta?.label ?? defiAlgo}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {availableDefiAlgos.length} available
                  </Badge>
                </div>
                {algoMeta && (
                  <p className="text-[10px] text-muted-foreground">{algoMeta.description}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Max Slippage</label>
                <div className="text-xs font-mono">{(maxSlippageBps / 100).toFixed(2)}% ({maxSlippageBps} bps)</div>
              </div>

              {(defiAlgo === "SOR_TWAP") && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Duration (seconds)</label>
                    <Input
                      type="number"
                      placeholder="3600"
                      value={algoParams.duration}
                      onChange={(e) => setAlgoParam("duration", e.target.value)}
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Slices</label>
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

              {defiAlgo === "BENCHMARK_FILL" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Benchmark</label>
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
        </CollapsibleSection>
      </div>
    );
  }

  // CeFi algo config (unchanged)
  return (
    <div className="p-2">
      <CollapsibleSection title="TWAP, VWAP & routing parameters" defaultOpen>
        <Card className="border-0 shadow-none">
          <CardContent className="space-y-3 pt-1 px-2 pb-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Algorithm</label>
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
                  <label className="text-[10px] text-muted-foreground">Duration (seconds)</label>
                  <Input
                    type="number"
                    placeholder="3600"
                    value={algoParams.duration}
                    onChange={(e) => setAlgoParam("duration", e.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Slices</label>
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
                <label className="text-[10px] text-muted-foreground">Display Quantity</label>
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
                <label className="text-[10px] text-muted-foreground">Benchmark</label>
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
      </CollapsibleSection>
    </div>
  );
}
