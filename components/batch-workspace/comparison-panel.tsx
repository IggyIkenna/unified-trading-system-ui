"use client";

/**
 * ComparisonPanel — side-by-side comparison of 2+ candidates.
 *
 * Used across Strategy (configs), ML (model versions), and Execution (algo configs).
 * Renders a table of metrics with visual highlighting for best/worst values.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus, ShoppingBasket, X } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

export interface ComparisonEntity {
  id: string;
  name: string;
  version: string;
  platform: "strategy" | "ml" | "execution";
  metrics: Record<string, number>;
  metadata?: Record<string, string>;
}

export interface MetricDefinition {
  key: string;
  label: string;
  format?: "number" | "percent" | "currency" | "duration";
  higherIsBetter?: boolean;
  group?: string;
}

interface ComparisonPanelProps {
  entities: ComparisonEntity[];
  metricDefinitions: MetricDefinition[];
  onRemove?: (id: string) => void;
  onAddToBasket?: (id: string) => void;
  highlightBest?: boolean;
  className?: string;
}

function formatMetric(value: number, format?: MetricDefinition["format"]): string {
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

function getBestIndex(values: (number | undefined)[], higherIsBetter: boolean): number {
  let bestIdx = -1;
  let bestVal = higherIsBetter ? -Infinity : Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === undefined) continue;
    if (higherIsBetter ? v > bestVal : v < bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function ComparisonPanel({
  entities,
  metricDefinitions,
  onRemove,
  onAddToBasket,
  highlightBest = true,
  className,
}: ComparisonPanelProps) {
  if (entities.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">Select 2 or more items to compare.</p>
        </CardContent>
      </Card>
    );
  }

  const groups = Array.from(new Set(metricDefinitions.map((m) => m.group || "General")));

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          Comparison
          <Badge variant="secondary" className="text-[10px]">
            {entities.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 bg-card z-10 px-4 py-2 text-left font-medium text-muted-foreground w-[160px]">
                  Metric
                </th>
                {entities.map((entity) => (
                  <th key={entity.id} className="px-4 py-2 text-center min-w-[140px]">
                    <div className="space-y-1">
                      <div className="font-mono font-medium truncate max-w-[140px]">{entity.name}</div>
                      <Badge variant="outline" className="text-[9px] font-mono">
                        v{entity.version}
                      </Badge>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {onAddToBasket && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5"
                            onClick={() => onAddToBasket(entity.id)}
                          >
                            <ShoppingBasket className="size-3" />
                          </Button>
                        )}
                        {onRemove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemove(entity.id)}
                          >
                            <X className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const groupMetrics = metricDefinitions.filter((m) => (m.group || "General") === group);
                return (
                  <React.Fragment key={group}>
                    {groups.length > 1 && (
                      <tr>
                        <td
                          colSpan={entities.length + 1}
                          className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30"
                        >
                          {group}
                        </td>
                      </tr>
                    )}
                    {groupMetrics.map((metric) => {
                      const values = entities.map((e) => e.metrics[metric.key]);
                      const bestIdx = highlightBest ? getBestIndex(values, metric.higherIsBetter ?? true) : -1;

                      return (
                        <tr key={metric.key} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="sticky left-0 bg-card z-10 px-4 py-2 text-muted-foreground font-medium">
                            {metric.label}
                          </td>
                          {values.map((value, i) => (
                            <td
                              key={entities[i].id}
                              className={cn(
                                "px-4 py-2 text-center font-mono",
                                highlightBest && i === bestIdx && "text-[var(--status-live)] font-semibold",
                              )}
                            >
                              {value !== undefined ? formatMetric(value, metric.format) : "-"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
