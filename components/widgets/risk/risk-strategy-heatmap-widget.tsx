"use client";

import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData } from "./risk-data-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Zap, RotateCcw, ArrowDownToLine, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Skeleton } from "@/components/ui/skeleton";

export function RiskStrategyHeatmapWidget(_props: WidgetComponentProps) {
  const {
    strategyRiskHeatmap,
    trippedStrategies,
    killedStrategies,
    scaledStrategies,
    isBatchMode,
    circuitBreakerPending,
    isLoading,
    hasError,
    handleTripCircuitBreaker,
    handleResetCircuitBreaker,
    handleKillSwitch,
    handleScale,
  } = useRiskData();

  if (isLoading) {
    return (
      <div className="space-y-1.5 p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Failed to load strategy heatmap
      </div>
    );
  }

  return (
    <WidgetScroll axes="vertical">
      <div className="space-y-1.5 p-1">
        {strategyRiskHeatmap.map((row) => {
          const strategyId = row.strategy.replace(/\s+/g, "_").toLowerCase();
          const isTripped = trippedStrategies.has(strategyId);
          const isKilled = killedStrategies.has(strategyId);
          const scaleFactor = scaledStrategies[strategyId];

          return (
            <div
              key={row.strategy}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-lg border text-xs",
                isKilled && "border-rose-500 bg-rose-500/20",
                !isKilled && row.status === "ok" && "border-border bg-muted/30",
                !isKilled && row.status === "warning" && "border-amber-500/50 bg-amber-500/10",
                !isKilled && row.status === "critical" && "border-rose-500/50 bg-rose-500/10",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    row.status === "ok" && "bg-emerald-500",
                    row.status === "warning" && "bg-amber-500",
                    row.status === "critical" && "bg-rose-500",
                  )}
                />
                <span className="font-mono font-medium truncate">{row.strategy}</span>
                {isTripped && (
                  <Badge variant="destructive" className="text-[10px] h-4 shrink-0">
                    HALTED
                  </Badge>
                )}
                {isKilled && <Badge className="bg-rose-600 text-white text-[10px] h-4 shrink-0">KILLED</Badge>}
                {scaleFactor !== undefined && (
                  <Badge variant="secondary" className="text-[10px] h-4 shrink-0">
                    Scaled to {Math.round(scaleFactor * 100)}%
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden lg:flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
                  {row.delta && (
                    <span>
                      Δ: <strong className="text-foreground">{row.delta}</strong>
                    </span>
                  )}
                  {row.funding && (
                    <span>
                      Fund: <strong className="text-foreground">{row.funding}</strong>
                    </span>
                  )}
                  {row.hf && (
                    <span>
                      HF: <strong className="text-foreground">{row.hf}</strong>
                    </span>
                  )}
                  {row.var && (
                    <span>
                      VaR: <strong className="text-foreground">{row.var}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {isTripped ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-1.5 text-[10px]"
                            disabled={isBatchMode || circuitBreakerPending}
                            onClick={() => handleResetCircuitBreaker(strategyId, row.strategy)}
                          >
                            <RotateCcw className="size-3 mr-0.5" />
                            Reset
                          </Button>
                        </TooltipTrigger>
                        {isBatchMode && <TooltipContent>Switch to live mode</TooltipContent>}
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-amber-400 border-amber-500/50 hover:bg-amber-500/10"
                            disabled={isBatchMode || isKilled || circuitBreakerPending}
                            onClick={() => handleTripCircuitBreaker(strategyId, row.strategy)}
                          >
                            <Zap className="size-3 mr-0.5" />
                            Trip
                          </Button>
                        </TooltipTrigger>
                        {isBatchMode && <TooltipContent>Switch to live mode</TooltipContent>}
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-1.5 text-[10px]"
                          disabled={isBatchMode || isKilled}
                          onClick={() => handleScale(strategyId, row.strategy, 0.5)}
                        >
                          <ArrowDownToLine className="size-3 mr-0.5" />
                          50%
                        </Button>
                      </TooltipTrigger>
                      {isBatchMode && <TooltipContent>Switch to live mode</TooltipContent>}
                    </Tooltip>
                  </TooltipProvider>

                  <AlertDialog>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-6 px-1.5 text-[10px]"
                              disabled={isBatchMode || isKilled}
                            >
                              <Power className="size-3 mr-0.5" />
                              Kill
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        {isBatchMode && <TooltipContent>Switch to live mode</TooltipContent>}
                      </Tooltip>
                    </TooltipProvider>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Activate Kill Switch</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will immediately halt all trading activity for <strong>{row.strategy}</strong>. All open
                          orders will be cancelled. This action requires manual intervention to reverse.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-rose-600 hover:bg-rose-700"
                          onClick={() => handleKillSwitch(strategyId, row.strategy)}
                        >
                          Confirm Kill Switch
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
        {strategyRiskHeatmap.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-6">No strategy heatmap data</div>
        )}
      </div>
    </WidgetScroll>
  );
}
