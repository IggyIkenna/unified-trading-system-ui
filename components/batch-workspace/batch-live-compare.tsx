"use client";

/**
 * BatchLiveCompare — batch vs live metrics comparison.
 *
 * Shows the same entity in batch (backtest) and live (production) modes
 * side by side, with drift indicators and significance markers.
 *
 * This is the core "batch/live is structural" component from UX_OPERATING_RULES.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus, AlertTriangle } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

export interface BatchLiveMetric {
  key: string;
  label: string;
  batchValue: number;
  liveValue: number;
  format?: "number" | "percent" | "currency" | "duration";
  higherIsBetter?: boolean;
  /** Threshold (as fraction) above which drift is flagged */
  driftThreshold?: number;
}

interface BatchLiveCompareProps {
  entityName: string;
  entityVersion: string;
  metrics: BatchLiveMetric[];
  batchLabel?: string;
  liveLabel?: string;
  batchAsOf?: string;
  liveAsOf?: string;
  compact?: boolean;
  className?: string;
}

function formatValue(value: number, format?: BatchLiveMetric["format"]): string {
  switch (format) {
    case "percent":
      return `${formatNumber(value * 100, 2)}%`;
    case "currency":
      return `$${formatNumber(value, 0)}`;
    case "duration":
      return `${formatNumber(value, 1)}s`;
    default:
      return formatNumber(value, 2);
  }
}

function getDrift(batch: number, live: number): number {
  if (batch === 0) return live === 0 ? 0 : 1;
  return (live - batch) / Math.abs(batch);
}

function DriftIndicator({
  drift,
  higherIsBetter,
  threshold,
}: {
  drift: number;
  higherIsBetter: boolean;
  threshold: number;
}) {
  const absDrift = Math.abs(drift);
  const isSignificant = absDrift > threshold;
  const isPositive = higherIsBetter ? drift > 0 : drift < 0;

  if (absDrift < 0.001) {
    return (
      <span className="flex items-center gap-0.5 text-muted-foreground">
        <Minus className="size-3" />
        <span className="text-[10px]">0%</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex items-center gap-0.5",
        isSignificant && isPositive && "text-[var(--status-live)]",
        isSignificant && !isPositive && "text-[var(--status-error)]",
        !isSignificant && "text-muted-foreground",
      )}
    >
      {drift > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      <span className="text-[10px] font-mono">{formatNumber(absDrift * 100, 1)}%</span>
      {isSignificant && !isPositive && <AlertTriangle className="size-3 ml-0.5" />}
    </span>
  );
}

export function BatchLiveCompare({
  entityName,
  entityVersion,
  metrics,
  batchLabel = "Batch",
  liveLabel = "Live",
  batchAsOf,
  liveAsOf,
  compact = false,
  className,
}: BatchLiveCompareProps) {
  const significantDrifts = metrics.filter((m) => {
    const drift = Math.abs(getDrift(m.batchValue, m.liveValue));
    return drift > (m.driftThreshold ?? 0.1);
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{batchLabel} vs {liveLabel}</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {entityName} v{entityVersion}
            </Badge>
          </div>
          {significantDrifts.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {significantDrifts.length} drift{significantDrifts.length > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
        {(batchAsOf || liveAsOf) && (
          <div className="flex gap-4 text-[10px] text-muted-foreground">
            {batchAsOf && <span>{batchLabel} as of: {batchAsOf}</span>}
            {liveAsOf && <span>{liveLabel} as of: {liveAsOf}</span>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-1.5 font-medium">Metric</th>
              <th className="text-right py-1.5 font-medium">{batchLabel}</th>
              <th className="text-right py-1.5 font-medium">{liveLabel}</th>
              <th className="text-right py-1.5 font-medium">Drift</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => {
              const drift = getDrift(metric.batchValue, metric.liveValue);
              const threshold = metric.driftThreshold ?? 0.1;

              return (
                <tr key={metric.key} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-1.5 text-muted-foreground font-medium">
                    {metric.label}
                  </td>
                  <td className="py-1.5 text-right font-mono">
                    {formatValue(metric.batchValue, metric.format)}
                  </td>
                  <td className="py-1.5 text-right font-mono">
                    {formatValue(metric.liveValue, metric.format)}
                  </td>
                  <td className="py-1.5 text-right">
                    <DriftIndicator
                      drift={drift}
                      higherIsBetter={metric.higherIsBetter ?? true}
                      threshold={threshold}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
