"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, Database, Radio, Clock } from "lucide-react";

interface ExecutionModeToggleProps {
  className?: string;
  showDescription?: boolean;
  size?: "sm" | "default";
}

export function ExecutionModeToggle({
  className,
  showDescription = false,
  size = "default",
}: ExecutionModeToggleProps) {
  const { mode, setMode, config, isLive, isBatch } = useExecutionMode();

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center p-0.5 rounded-lg bg-muted/50 border border-border",
                size === "sm" ? "h-7" : "h-9",
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("live")}
                className={cn(
                  "gap-1.5 rounded-md transition-all",
                  size === "sm" ? "h-6 px-2 text-xs" : "h-8 px-3 text-sm",
                  isLive
                    ? "bg-[var(--status-live)] text-white hover:bg-[var(--status-live)] hover:text-white shadow-sm"
                    : "hover:bg-muted text-muted-foreground",
                )}
              >
                <Radio
                  className={cn(
                    size === "sm" ? "size-3" : "size-3.5",
                    isLive && "animate-pulse",
                  )}
                />
                Live
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("batch")}
                className={cn(
                  "gap-1.5 rounded-md transition-all",
                  size === "sm" ? "h-6 px-2 text-xs" : "h-8 px-3 text-sm",
                  isBatch
                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground",
                )}
              >
                <Database
                  className={cn(size === "sm" ? "size-3" : "size-3.5")}
                />
                Batch
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">
                {isLive ? "Live Mode" : "Batch Mode"}
              </p>
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Data:</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {config.dataSource.toUpperCase()}
                </Badge>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {showDescription && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{config.latency}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                isLive
                  ? "border-[var(--status-live)] text-[var(--status-live)]"
                  : "",
              )}
            >
              {config.dataSource.toUpperCase()}
            </Badge>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Compact inline indicator for headers
interface ExecutionModeIndicatorProps {
  className?: string;
}

export function ExecutionModeIndicator({
  className,
}: ExecutionModeIndicatorProps) {
  const { mode, isLive } = useExecutionMode();

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {isLive ? (
        <>
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--status-live)] opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-[var(--status-live)]" />
          </span>
          <span className="text-xs font-medium text-[var(--status-live)] uppercase">
            Live
          </span>
        </>
      ) : (
        <>
          <Clock className="size-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Batch
          </span>
        </>
      )}
    </div>
  );
}

// Full-width mode selector with details (for settings/config pages)
interface ExecutionModeSelectorProps {
  className?: string;
}

export function ExecutionModeSelector({
  className,
}: ExecutionModeSelectorProps) {
  const { mode, setMode, config } = useExecutionMode();

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <button
        onClick={() => setMode("live")}
        className={cn(
          "p-4 rounded-lg border-2 text-left transition-all",
          mode === "live"
            ? "border-[var(--status-live)] bg-[var(--status-live)]/5"
            : "border-border hover:border-muted-foreground",
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Radio
            className={cn(
              "size-5",
              mode === "live" && "text-[var(--status-live)] animate-pulse",
            )}
          />
          <span className="font-semibold">Live Mode</span>
          {mode === "live" && (
            <Badge className="bg-[var(--status-live)] text-white text-[10px]">
              Active
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Real-time market data via Pub/Sub. Execute trades immediately.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="size-3" />
            Pub/Sub
          </span>
          <span>Sub-second latency</span>
        </div>
      </button>

      <button
        onClick={() => setMode("batch")}
        className={cn(
          "p-4 rounded-lg border-2 text-left transition-all",
          mode === "batch"
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground",
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Database
            className={cn("size-5", mode === "batch" && "text-primary")}
          />
          <span className="font-semibold">Batch Mode</span>
          {mode === "batch" && <Badge className="text-[10px]">Active</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Historical reconstruction from GCS. Same algos, backtested data.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Database className="size-3" />
            GCS
          </span>
          <span>Historical replay</span>
        </div>
      </button>
    </div>
  );
}
