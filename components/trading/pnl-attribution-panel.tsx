"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PnLComponent {
  name: string;
  pnl: number;
  exposure?: string;
}

interface PnLAttributionPanelProps {
  components: PnLComponent[];
  totalPnl: number;
  showExposure?: boolean;
  onComponentClick?: (componentName: string) => void;
  className?: string;
}

export function PnLAttributionPanel({
  components,
  totalPnl,
  showExposure = true,
  onComponentClick,
  className,
}: PnLAttributionPanelProps) {
  const maxAbsPnl = Math.max(...components.map((c) => Math.abs(c.pnl)));

  const formatPnL = (value: number) => {
    // Guard against NaN, undefined, or infinite values
    if (
      value === null ||
      value === undefined ||
      !isFinite(value) ||
      isNaN(value)
    ) {
      return "$0";
    }
    const absVal = Math.abs(value);
    const prefix = value >= 0 ? "+" : "-";
    if (absVal >= 1_000_000)
      return `${prefix}$${(absVal / 1_000_000).toFixed(0)}m`;
    if (absVal >= 1_000) return `${prefix}$${(absVal / 1_000).toFixed(0)}k`;
    return `${prefix}$${absVal.toFixed(0)}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        {components.map((component) => {
          const isPositive = component.pnl >= 0;
          const barWidth =
            maxAbsPnl > 0 ? (Math.abs(component.pnl) / maxAbsPnl) * 100 : 0;

          return (
            <div
              key={component.name}
              className={cn(
                "group cursor-pointer rounded-md p-2 transition-colors hover:bg-muted/30",
                onComponentClick && "hover:bg-muted/50",
              )}
              onClick={() => onComponentClick?.(component.name)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{component.name}</span>
                <div className="flex items-center gap-3">
                  {showExposure && component.exposure && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {component.exposure}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-sm font-mono tabular-nums font-medium",
                      isPositive ? "pnl-positive" : "pnl-negative",
                    )}
                  >
                    {formatPnL(component.pnl)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: isPositive
                      ? "var(--pnl-positive)"
                      : "var(--pnl-negative)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total / Net */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">NET</span>
          <span
            className={cn(
              "text-lg font-mono tabular-nums font-semibold",
              totalPnl >= 0 ? "pnl-positive" : "pnl-negative",
            )}
          >
            {formatPnL(totalPnl)}
          </span>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-col gap-1 pt-2">
        <Link href="/markets/pnl" passHref>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
          >
            Full P&L in Markets
            <ChevronRight className="size-3" />
          </Button>
        </Link>
        <Link href="/services/trading/risk" passHref>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
          >
            Full Risk Detail
            <ChevronRight className="size-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
