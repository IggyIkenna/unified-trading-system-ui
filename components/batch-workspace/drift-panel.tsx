"use client";

/**
 * DriftPanel — visualizes metric drift over time for a single entity.
 *
 * Shows which metrics have drifted from their batch/baseline values,
 * with severity indicators and trend direction. Used in the research
 * family for monitoring model/strategy/algo health.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

export interface DriftMetric {
  key: string;
  label: string;
  baselineValue: number;
  currentValue: number;
  /** Fraction drift threshold for warning */
  warningThreshold?: number;
  /** Fraction drift threshold for critical */
  criticalThreshold?: number;
  higherIsBetter?: boolean;
  format?: "number" | "percent" | "currency";
}

type DriftSeverity = "ok" | "warning" | "critical";

interface DriftPanelProps {
  title?: string;
  metrics: DriftMetric[];
  baselineLabel?: string;
  currentLabel?: string;
  compact?: boolean;
  className?: string;
}

function getDriftSeverity(
  baseline: number,
  current: number,
  warningThreshold: number,
  criticalThreshold: number,
  higherIsBetter: boolean,
): DriftSeverity {
  if (baseline === 0) return current === 0 ? "ok" : "critical";
  const drift = (current - baseline) / Math.abs(baseline);
  const absDrift = Math.abs(drift);
  const isAdverse = higherIsBetter ? drift < 0 : drift > 0;

  if (!isAdverse) return "ok";
  if (absDrift >= criticalThreshold) return "critical";
  if (absDrift >= warningThreshold) return "warning";
  return "ok";
}

function formatValue(value: number, format?: DriftMetric["format"]): string {
  switch (format) {
    case "percent":
      return `${formatNumber(value * 100, 2)}%`;
    case "currency":
      return `$${formatNumber(value, 0)}`;
    default:
      return formatNumber(value, 2);
  }
}

const severityConfig: Record<
  DriftSeverity,
  { color: string; icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  ok: { color: "text-[var(--status-live)]", icon: CheckCircle2, label: "Healthy" },
  warning: { color: "text-[var(--status-warning)]", icon: AlertTriangle, label: "Drifting" },
  critical: { color: "text-[var(--status-error)]", icon: AlertTriangle, label: "Critical" },
};

export function DriftPanel({
  title = "Drift Analysis",
  metrics,
  baselineLabel = "Baseline",
  currentLabel = "Current",
  compact = false,
  className,
}: DriftPanelProps) {
  const severities = metrics.map((m) =>
    getDriftSeverity(
      m.baselineValue,
      m.currentValue,
      m.warningThreshold ?? 0.1,
      m.criticalThreshold ?? 0.25,
      m.higherIsBetter ?? true,
    ),
  );

  const criticalCount = severities.filter((s) => s === "critical").length;
  const warningCount = severities.filter((s) => s === "warning").length;

  const overallSeverity: DriftSeverity =
    criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "ok";
  const overall = severityConfig[overallSeverity];
  const OverallIcon = overall.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OverallIcon className={cn("size-4", overall.color)} />
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {criticalCount} critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                {warningCount} warning
              </Badge>
            )}
            {criticalCount === 0 && warningCount === 0 && (
              <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                All healthy
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {metrics.map((metric, i) => {
            const severity = severities[i];
            const config = severityConfig[severity];
            const drift =
              metric.baselineValue === 0
                ? 0
                : ((metric.currentValue - metric.baselineValue) /
                    Math.abs(metric.baselineValue)) *
                  100;
            const Icon = config.icon;

            return (
              <div
                key={metric.key}
                className={cn(
                  "flex items-center gap-3 py-1.5",
                  !compact && "px-2 rounded hover:bg-muted/20",
                )}
              >
                <Icon className={cn("size-3.5 shrink-0", config.color)} />
                <span className="text-xs text-muted-foreground w-[120px] truncate">
                  {metric.label}
                </span>
                <span className="text-xs font-mono w-[70px] text-right">
                  {formatValue(metric.baselineValue, metric.format)}
                </span>
                <div className="flex items-center gap-0.5 w-[50px] justify-center">
                  {Math.abs(drift) < 0.1 ? (
                    <Minus className="size-3 text-muted-foreground" />
                  ) : drift > 0 ? (
                    <TrendingUp className={cn("size-3", config.color)} />
                  ) : (
                    <TrendingDown className={cn("size-3", config.color)} />
                  )}
                </div>
                <span className="text-xs font-mono w-[70px] text-right">
                  {formatValue(metric.currentValue, metric.format)}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono w-[60px] text-right",
                    config.color,
                  )}
                >
                  {drift >= 0 ? "+" : ""}
                  {formatNumber(drift, 1)}%
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
