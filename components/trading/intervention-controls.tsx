"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTickingNowMs } from "@/hooks/use-ticking-now";
import { cn } from "@/lib/utils";
import {
  AlertOctagon,
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  Shield,
  TrendingDown,
} from "lucide-react";
import * as React from "react";

interface InterventionControlsProps {
  scope: {
    strategyCount: number;
    totalExposure: number;
    scopeLabel: string;
  };
  onPauseAll?: () => void;
  onReduceExposure?: (percent: number) => void;
  onEmergencyFlatten?: () => void;
  onResumeAll?: () => void;
  className?: string;
}

export function InterventionControls({
  scope,
  onPauseAll,
  onReduceExposure,
  onEmergencyFlatten,
  onResumeAll,
  className,
}: InterventionControlsProps) {
  const nowMs = useTickingNowMs(1000);
  const [showReduceDialog, setShowReduceDialog] = React.useState(false);
  const [showFlattenDialog, setShowFlattenDialog] = React.useState(false);
  const [reducePercent, setReducePercent] = React.useState(50);
  const [flattenConfig, setFlattenConfig] = React.useState<
    "aggressive" | "conservative"
  >("conservative");
  const [isPaused, setIsPaused] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [lastAction, setLastAction] = React.useState<{
    type: string;
    timestamp: Date;
  } | null>(null);

  const formatExposure = (v: number) => {
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v.toFixed(0)}`;
  };

  const handlePauseAll = async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsPaused(true);
    setLastAction({ type: "Paused all strategies", timestamp: new Date() });
    setIsProcessing(false);
    onPauseAll?.();
  };

  const handleResumeAll = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsPaused(false);
    setLastAction({ type: "Resumed all strategies", timestamp: new Date() });
    setIsProcessing(false);
    onResumeAll?.();
  };

  const handleReduceExposure = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLastAction({
      type: `Reduced exposure by ${reducePercent}%`,
      timestamp: new Date(),
    });
    setIsProcessing(false);
    setShowReduceDialog(false);
    onReduceExposure?.(reducePercent);
  };

  const handleEmergencyFlatten = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLastAction({
      type: "Emergency flatten executed",
      timestamp: new Date(),
    });
    setIsProcessing(false);
    setShowFlattenDialog(false);
    onEmergencyFlatten?.();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Scope indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border">
        <Shield className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Scope:{" "}
          <span className="font-medium text-foreground">
            {scope.scopeLabel}
          </span>
        </span>
        <span className="text-[10px] text-muted-foreground">
          ({scope.strategyCount} strategies,{" "}
          {formatExposure(scope.totalExposure)} exposed)
        </span>
      </div>

      {/* Pause/Resume */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isPaused ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-1.5",
                isPaused &&
                  "bg-[var(--status-warning)] hover:bg-[var(--status-warning)]/90",
              )}
              onClick={isPaused ? handleResumeAll : handlePauseAll}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : isPaused ? (
                <Play className="size-3.5" />
              ) : (
                <Pause className="size-3.5" />
              )}
              {isPaused ? "Resume" : "Pause All"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isPaused
                ? "Resume all paused strategies"
                : "Pause all strategies in scope"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Reduce Exposure */}
      <Dialog open={showReduceDialog} onOpenChange={setShowReduceDialog}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <TrendingDown className="size-3.5" />
                  Reduce
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reduce exposure across all strategies</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reduce Exposure</DialogTitle>
            <DialogDescription>
              This will reduce position sizes across {scope.strategyCount}{" "}
              strategies. Current exposure:{" "}
              {formatExposure(scope.totalExposure)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Reduction Amount</span>
                <span className="font-mono text-sm font-medium">
                  {reducePercent}%
                </span>
              </div>
              <Slider
                value={[reducePercent]}
                onValueChange={([v]) => setReducePercent(v)}
                min={10}
                max={100}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-md space-y-1">
              <div className="flex justify-between text-sm">
                <span>Current Exposure</span>
                <span className="font-mono">
                  {formatExposure(scope.totalExposure)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>After Reduction</span>
                <span className="font-mono text-[var(--status-warning)]">
                  {formatExposure(
                    scope.totalExposure * (1 - reducePercent / 100),
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Reduction</span>
                <span className="font-mono text-[var(--pnl-negative)]">
                  -{formatExposure(scope.totalExposure * (reducePercent / 100))}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReduceDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReduceExposure}
              disabled={isProcessing}
              className="bg-[var(--status-warning)] hover:bg-[var(--status-warning)]/90"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                  Processing...
                </>
              ) : (
                <>Confirm Reduction</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Flatten */}
      <Dialog open={showFlattenDialog} onOpenChange={setShowFlattenDialog}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-[var(--status-error)] text-[var(--status-error)] hover:bg-[var(--status-error)]/10"
                >
                  <AlertOctagon className="size-3.5" />
                  Flatten
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Emergency: Close all positions immediately</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--status-error)]">
              <AlertOctagon className="size-5" />
              Emergency Flatten
            </DialogTitle>
            <DialogDescription>
              This will immediately close ALL positions across{" "}
              {scope.strategyCount} strategies. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Flatten Config Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Flatten Configuration
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFlattenConfig("conservative")}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    flattenConfig === "conservative"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-border/80",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="size-4 text-[var(--status-live)]" />
                    <span className="font-medium text-sm">Conservative</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    TWAP over 15-30 min. Lower slippage (~0.2-0.5%), safer for
                    large positions.
                  </p>
                </button>
                <button
                  onClick={() => setFlattenConfig("aggressive")}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    flattenConfig === "aggressive"
                      ? "border-[var(--status-error)] bg-[var(--status-error)]/5 ring-2 ring-[var(--status-error)]/20"
                      : "border-border hover:border-border/80",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertOctagon className="size-4 text-[var(--status-error)]" />
                    <span className="font-medium text-sm">Aggressive</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Market orders immediately. Higher slippage (~1-3%), fastest
                    exit.
                  </p>
                </button>
              </div>
            </div>

            <div className="p-4 bg-[var(--status-error)]/10 border border-[var(--status-error)]/30 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-[var(--status-error)] font-medium">
                <AlertOctagon className="size-4" />
                Warning: This is an emergency action
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground ml-6 list-disc">
                <li>
                  All open positions will be{" "}
                  {flattenConfig === "aggressive"
                    ? "market-sold immediately"
                    : "closed via TWAP"}
                </li>
                <li>
                  Expected slippage:{" "}
                  {flattenConfig === "aggressive" ? "~1-3%" : "~0.2-0.5%"}
                </li>
                <li>
                  Estimated time:{" "}
                  {flattenConfig === "aggressive" ? "< 1 min" : "15-30 min"}
                </li>
                <li>Strategies will be paused after flatten</li>
                <li>
                  This will affect {formatExposure(scope.totalExposure)} in
                  exposure
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFlattenDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmergencyFlatten}
              disabled={isProcessing}
              className="bg-[var(--status-error)] hover:bg-[var(--status-error)]/90"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                  Flattening...
                </>
              ) : (
                <>Confirm Emergency Flatten</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Last action indicator */}
      {lastAction && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded text-xs text-muted-foreground">
          <CheckCircle2 className="size-3 text-[var(--status-live)]" />
          {lastAction.type}
          <span className="text-[10px]">
            ({Math.round((nowMs - lastAction.timestamp.getTime()) / 1000)}s ago)
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for embedding in headers
export function InterventionControlsCompact({
  scope,
  onPauseAll,
  className,
}: {
  scope: { strategyCount: number };
  onPauseAll?: () => void;
  className?: string;
}) {
  const [isPaused, setIsPaused] = React.useState(false);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                isPaused && "text-[var(--status-warning)]",
              )}
              onClick={() => {
                setIsPaused(!isPaused);
                if (!isPaused) onPauseAll?.();
              }}
            >
              {isPaused ? (
                <Play className="size-3.5" />
              ) : (
                <Pause className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isPaused ? "Resume" : "Pause"} {scope.strategyCount} strategies
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[var(--status-error)]"
            >
              <AlertOctagon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Emergency Flatten</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
