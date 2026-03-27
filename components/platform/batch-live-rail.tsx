"use client";

// Unified Batch/Live Rail - shows lifecycle stages and batch/live toggle
// Shared across Strategy, ML, and Execution platforms

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

// Lifecycle stages per platform
export const STRATEGY_LIFECYCLE_STAGES = [
  "Design",
  "Backtest",
  "Validate",
  "Paper",
  "Shadow",
  "Promote",
  "Live",
  "Monitor",
  "Review",
] as const;

export const ML_LIFECYCLE_STAGES = [
  "Design",
  "Train",
  "Validate",
  "Register",
  "Shadow",
  "Promote",
  "Live",
  "Monitor",
  "Review",
] as const;

export const EXECUTION_LIFECYCLE_STAGES = [
  "Design",
  "Simulate",
  "Validate",
  "Paper",
  "Shadow",
  "Promote",
  "Live",
  "Monitor",
  "Review",
] as const;

export type StrategyLifecycleStage = (typeof STRATEGY_LIFECYCLE_STAGES)[number];
export type MLLifecycleStage = (typeof ML_LIFECYCLE_STAGES)[number];
export type ExecutionLifecycleStage =
  (typeof EXECUTION_LIFECYCLE_STAGES)[number];
export type LifecycleStage =
  | StrategyLifecycleStage
  | MLLifecycleStage
  | ExecutionLifecycleStage;

interface LifecycleRailProps {
  platform: "strategy" | "ml" | "execution";
  currentStage: string;
  stageStatuses?: Record<
    string,
    "completed" | "current" | "pending" | "blocked"
  >;
  onStageClick?: (stage: string) => void;
  compact?: boolean;
  className?: string;
}

const platformColors = {
  strategy: "var(--surface-strategy)",
  ml: "var(--surface-ml)",
  execution: "hsl(200 70% 50%)",
};

function getStages(platform: "strategy" | "ml" | "execution") {
  switch (platform) {
    case "strategy":
      return STRATEGY_LIFECYCLE_STAGES;
    case "ml":
      return ML_LIFECYCLE_STAGES;
    case "execution":
      return EXECUTION_LIFECYCLE_STAGES;
  }
}

function StageIndicator({
  status,
  platform,
}: {
  status: "completed" | "current" | "pending" | "blocked";
  platform: "strategy" | "ml" | "execution";
}) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-3 text-[var(--status-live)]" />;
    case "current":
      return (
        <div
          className="size-3 rounded-full animate-pulse"
          style={{ backgroundColor: platformColors[platform] }}
        />
      );
    case "blocked":
      return <AlertCircle className="size-3 text-[var(--status-critical)]" />;
    default:
      return <Circle className="size-3 text-muted-foreground/30" />;
  }
}

export function LifecycleRail({
  platform,
  currentStage,
  stageStatuses,
  onStageClick,
  compact = false,
  className,
}: LifecycleRailProps) {
  const stages = getStages(platform);
  const currentIndex = stages.findIndex(
    (s) => s.toLowerCase() === currentStage.toLowerCase(),
  );

  const getStatus = (stage: string, index: number) => {
    if (stageStatuses?.[stage]) {
      return stageStatuses[stage];
    }
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "current";
    return "pending";
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {stages.map((stage, i) => {
          const status = getStatus(stage, i);
          return (
            <TooltipProvider key={stage}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "size-2 rounded-full transition-all",
                      status === "completed" && "bg-[var(--status-live)]",
                      status === "current" && "animate-pulse",
                      status === "pending" && "bg-muted-foreground/20",
                      status === "blocked" && "bg-[var(--status-critical)]",
                    )}
                    style={
                      status === "current"
                        ? { backgroundColor: platformColors[platform] }
                        : undefined
                    }
                    onClick={() => onStageClick?.(stage)}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {stage}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs", className)}>
      {stages.map((stage, i) => {
        const status = getStatus(stage, i);
        const isClickable = !!onStageClick;

        return (
          <React.Fragment key={stage}>
            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded transition-colors",
                isClickable && "hover:bg-muted/50",
                status === "current" && "font-medium",
                status === "pending" && "text-muted-foreground/50",
              )}
              onClick={() => onStageClick?.(stage)}
              disabled={!isClickable}
              style={
                status === "current"
                  ? { color: platformColors[platform] }
                  : undefined
              }
            >
              <StageIndicator status={status} platform={platform} />
              <span className="hidden md:inline">{stage}</span>
              <span className="md:hidden text-[9px]">{i + 1}</span>
            </button>
            {i < stages.length - 1 && (
              <ChevronRight className="size-3 text-muted-foreground/30 flex-shrink-0 hidden sm:block" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Batch/Live toggle component
interface BatchLiveToggleProps {
  value: "BATCH" | "LIVE";
  onChange: (value: "BATCH" | "LIVE") => void;
  platform: "strategy" | "ml" | "execution";
  disabled?: boolean;
  className?: string;
}

export function BatchLiveToggle({
  value,
  onChange,
  platform,
  disabled = false,
  className,
}: BatchLiveToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center p-0.5 rounded-lg bg-muted/50 border",
        className,
      )}
    >
      <button
        className={cn(
          "px-3 py-1 rounded-md text-xs font-medium transition-all",
          value === "BATCH"
            ? "bg-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        style={
          value === "BATCH" ? { color: platformColors[platform] } : undefined
        }
        onClick={() => onChange("BATCH")}
        disabled={disabled}
      >
        BATCH
      </button>
      <button
        className={cn(
          "px-3 py-1 rounded-md text-xs font-medium transition-all",
          value === "LIVE"
            ? "bg-background shadow-sm text-[var(--status-live)]"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onChange("LIVE")}
        disabled={disabled}
      >
        LIVE
      </button>
    </div>
  );
}

// Combined rail with batch/live toggle
interface BatchLiveRailProps {
  platform: "strategy" | "ml" | "execution";
  currentStage: string;
  context: "BATCH" | "LIVE";
  onContextChange?: (context: "BATCH" | "LIVE") => void;
  onStageClick?: (stage: string) => void;
  stageStatuses?: Record<
    string,
    "completed" | "current" | "pending" | "blocked"
  >;
  showToggle?: boolean;
  compact?: boolean;
  className?: string;
}

export function BatchLiveRail({
  platform,
  currentStage,
  context,
  onContextChange,
  onStageClick,
  stageStatuses,
  showToggle = true,
  compact = false,
  className,
}: BatchLiveRailProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-2 border-b bg-muted/30",
        className,
      )}
    >
      <LifecycleRail
        platform={platform}
        currentStage={currentStage}
        stageStatuses={stageStatuses}
        onStageClick={onStageClick}
        compact={compact}
      />

      {showToggle && onContextChange && (
        <BatchLiveToggle
          value={context}
          onChange={onContextChange}
          platform={platform}
        />
      )}
    </div>
  );
}
