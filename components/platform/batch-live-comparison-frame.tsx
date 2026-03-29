"use client";

/**
 * BatchLiveComparisonFrame — Structural batch/live comparison layout.
 *
 * This is the core pattern for the platform's biggest USP:
 * "same config, same hierarchy, same operating grammar,
 *  batch and live as parallel realities."
 *
 * Usage:
 *   <BatchLiveComparisonFrame
 *     scope="Strategy: ETH Basis v3"
 *     batchAsOf="2026-03-26 T+1"
 *     liveAsOf="Real-time"
 *     batchContent={<StrategyBacktestResults />}
 *     liveContent={<StrategyLiveState />}
 *     driftMetrics={[
 *       { label: "P&L", batchValue: 138920, liveValue: 142380 },
 *     ]}
 *   />
 *
 * Modes:
 *   - "split"  — side-by-side batch and live (default)
 *   - "batch"  — batch only
 *   - "live"   — live only
 *   - "delta"  — drift/delta view
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Radio, Database, SplitSquareVertical, ArrowLeftRight, AlertTriangle, Clock } from "lucide-react";
import { formatPercent } from "@/lib/utils/formatters";

export type ComparisonViewMode = "split" | "batch" | "live" | "delta";

export interface DriftMetric {
  label: string;
  batchValue: number;
  liveValue: number;
  unit?: string;
  threshold?: number;
}

interface BatchLiveComparisonFrameProps {
  scope: string;
  batchAsOf: string;
  liveAsOf: string;
  batchContent: React.ReactNode;
  liveContent: React.ReactNode;
  deltaContent?: React.ReactNode;
  driftMetrics?: DriftMetric[];
  defaultMode?: ComparisonViewMode;
  onModeChange?: (mode: ComparisonViewMode) => void;
  className?: string;
}

export function BatchLiveComparisonFrame({
  scope,
  batchAsOf,
  liveAsOf,
  batchContent,
  liveContent,
  deltaContent,
  driftMetrics = [],
  defaultMode = "split",
  onModeChange,
  className,
}: BatchLiveComparisonFrameProps) {
  const [viewMode, setViewMode] = React.useState<ComparisonViewMode>(defaultMode);

  const handleModeChange = (mode: ComparisonViewMode) => {
    setViewMode(mode);
    onModeChange?.(mode);
  };

  const significantDrifts = driftMetrics.filter((m) => {
    const pct = m.batchValue !== 0 ? Math.abs((m.liveValue - m.batchValue) / Math.abs(m.batchValue)) * 100 : 0;
    return pct > (m.threshold ?? 5);
  });

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Comparison header bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-muted/20">
        {/* Left: scope + timestamps */}
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium truncate max-w-[300px]">{scope}</span>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Database className="size-3 text-primary" />
            <span>{batchAsOf}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Radio className="size-3 text-[var(--status-live)]" />
            <span>{liveAsOf}</span>
          </div>
          {significantDrifts.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] border-[var(--status-warning)] text-[var(--status-warning)]"
            >
              <AlertTriangle className="size-2.5 mr-1" />
              {significantDrifts.length} drift{significantDrifts.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Right: view mode toggle */}
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <ModeButton
            active={viewMode === "batch"}
            onClick={() => handleModeChange("batch")}
            icon={<Database className="size-3" />}
            label="Batch"
            activeColor="text-primary bg-primary/10"
          />
          <ModeButton
            active={viewMode === "live"}
            onClick={() => handleModeChange("live")}
            icon={<Radio className="size-3" />}
            label="Live"
            activeColor="text-[var(--status-live)] bg-[var(--status-live)]/10"
          />
          <ModeButton
            active={viewMode === "split"}
            onClick={() => handleModeChange("split")}
            icon={<SplitSquareVertical className="size-3" />}
            label="Split"
            activeColor="text-foreground bg-secondary"
          />
          {deltaContent && (
            <ModeButton
              active={viewMode === "delta"}
              onClick={() => handleModeChange("delta")}
              icon={<ArrowLeftRight className="size-3" />}
              label="Delta"
              activeColor="text-foreground bg-secondary"
            />
          )}
        </div>
      </div>

      {/* Drift summary strip (if metrics provided) */}
      {driftMetrics.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-1.5 border-b bg-muted/10 text-xs overflow-x-auto">
          {driftMetrics.map((m) => {
            const delta = m.liveValue - m.batchValue;
            const pct = m.batchValue !== 0 ? (delta / Math.abs(m.batchValue)) * 100 : 0;
            return (
              <div key={m.label} className="flex items-center gap-1.5 shrink-0">
                <span className="text-muted-foreground">{m.label}</span>
                <span
                  className={cn("font-mono", delta >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]")}
                >
                  {delta >= 0 ? "+" : ""}
                  {formatPercent(pct, 1)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === "batch" && <div className="h-full overflow-auto">{batchContent}</div>}
        {viewMode === "live" && <div className="h-full overflow-auto">{liveContent}</div>}
        {viewMode === "split" && (
          <div className="h-full grid grid-cols-2 divide-x divide-border">
            <div className="overflow-auto">
              <div className="sticky top-0 z-10 flex items-center gap-1.5 px-3 py-1 bg-muted/30 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <Database className="size-2.5 text-primary" />
                Batch ({batchAsOf})
              </div>
              {batchContent}
            </div>
            <div className="overflow-auto">
              <div className="sticky top-0 z-10 flex items-center gap-1.5 px-3 py-1 bg-muted/30 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <Radio className="size-2.5 text-[var(--status-live)]" />
                Live ({liveAsOf})
              </div>
              {liveContent}
            </div>
          </div>
        )}
        {viewMode === "delta" && deltaContent && <div className="h-full overflow-auto">{deltaContent}</div>}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
        active ? activeColor : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Handoff pattern: promote batch candidate to live review ────────────────

interface HandoffBannerProps {
  candidateLabel: string;
  batchMetrics: Record<string, string>;
  onReviewLive: () => void;
  onDismiss: () => void;
  className?: string;
}

export function BatchToLiveHandoffBanner({
  candidateLabel,
  batchMetrics,
  onReviewLive,
  onDismiss,
  className,
}: HandoffBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-2 border border-primary/20 bg-primary/5 rounded-lg",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-xs">
        <Database className="size-4 text-primary" />
        <div>
          <span className="font-medium">{candidateLabel}</span>
          <span className="text-muted-foreground ml-2">Batch candidate ready for live review</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {Object.entries(batchMetrics).map(([key, val]) => (
            <span key={key} className="font-mono">
              {key}: {val}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onReviewLive}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Radio className="size-3" />
          Review Live
        </button>
        <button
          onClick={onDismiss}
          className="px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
