"use client";

import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import type { CostPreview } from "@/lib/mocks/fixtures/position-recon";

interface CostPreviewCardProps {
  cost: CostPreview;
  label: string;
  className?: string;
  compact?: boolean;
}

export function CostPreviewCard({ cost, label, className, compact }: CostPreviewCardProps) {
  return (
    <div className={cn("p-3 bg-muted/50 rounded-lg border border-border space-y-2", className)}>
      <h4 className={cn("font-medium", compact ? "text-xs" : "text-sm")}>{label}</h4>
      <div className="border-t border-border/50" />
      <div className="space-y-1">
        <CostLine label="Slippage" dollars={cost.slippageDollars} bps={cost.slippageBps} compact={compact} />
        <CostLine label="Gas" dollars={cost.gasDollars} compact={compact} />
        <CostLine label="Exchange fees" dollars={cost.exchangeFeeDollars} compact={compact} />
        <CostLine label="Bridge fees" dollars={cost.bridgeFeeDollars} compact={compact} />
      </div>
      <div className="border-t border-border/50" />
      <div className="space-y-1">
        <div className={cn("flex justify-between font-medium", compact ? "text-xs" : "text-sm")}>
          <span>Total</span>
          <span className="font-mono text-[var(--status-warning)]">
            ${formatNumber(cost.totalDollars, 0)} ({cost.totalBps} bps)
          </span>
        </div>
        <div className={cn("flex justify-between text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          <span>Duration</span>
          <span className="font-mono">{cost.durationLabel}</span>
        </div>
        <div className={cn("flex justify-between text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          <span>Impact</span>
          <span className="font-mono">~{cost.impactBps} bps</span>
        </div>
        <div className={cn("flex justify-between text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          <span>Confidence</span>
          <span
            className={cn(
              "font-mono",
              cost.confidence === "High" && "text-emerald-400",
              cost.confidence === "Medium" && "text-amber-400",
              cost.confidence === "Low" && "text-rose-400",
            )}
          >
            {cost.confidence}
          </span>
        </div>
      </div>
    </div>
  );
}

function CostLine({
  label,
  dollars,
  bps,
  compact,
}: {
  label: string;
  dollars: number;
  bps?: number;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex justify-between text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
      <span>{label}</span>
      <span className="font-mono">
        ${formatNumber(dollars, 0)}
        {bps !== undefined && ` (${bps} bps)`}
      </span>
    </div>
  );
}

interface CostComparisonProps {
  conservative: CostPreview;
  aggressive: CostPreview;
  className?: string;
}

export function CostComparison({ conservative, aggressive, className }: CostComparisonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-xs font-medium">Cost Comparison</h4>
      <div className="grid grid-cols-2 gap-3">
        <CostPreviewCard cost={conservative} label="TWAP (Conservative)" compact />
        <CostPreviewCard cost={aggressive} label="Market (Aggressive)" compact />
      </div>
      <div className="text-[10px] text-muted-foreground text-center">
        TWAP: ${formatNumber(conservative.totalDollars, 0)} ({conservative.totalBps} bps, {conservative.durationLabel})
        vs Market: ${formatNumber(aggressive.totalDollars, 0)} ({aggressive.totalBps} bps, {aggressive.durationLabel})
      </div>
    </div>
  );
}
