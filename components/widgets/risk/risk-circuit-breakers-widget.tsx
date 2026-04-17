"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData } from "./risk-data-context";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/utils";
import { WidgetScroll } from "@/components/shared/widget-scroll";

export function RiskCircuitBreakersWidget(_props: WidgetComponentProps) {
  const { venueCircuitBreakers, isLoading, hasError } = useRiskData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Spinner className="size-4" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-rose-400">
        Failed to load circuit breaker data
      </div>
    );
  }

  if (!venueCircuitBreakers || venueCircuitBreakers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No venue CB data</div>
    );
  }

  return (
    <WidgetScroll axes="vertical">
      <div className="grid grid-cols-2 gap-1.5 p-1">
        {venueCircuitBreakers.map((vcb) => (
          <div key={`${vcb.venue}-${vcb.strategy_id}`} className="p-2.5 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-[11px]">{vcb.venue}</span>
              <Badge
                className={cn(
                  "text-[9px] h-4",
                  vcb.status === "CLOSED" && "bg-emerald-500/20 text-emerald-400",
                  vcb.status === "HALF_OPEN" && "bg-amber-500/20 text-amber-400",
                  vcb.status === "OPEN" && "bg-rose-500/20 text-rose-400",
                )}
              >
                {vcb.status}
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground truncate">{vcb.strategy_id}</div>
            {vcb.kill_switch_active && (
              <Badge variant="destructive" className="mt-1 text-[9px] h-4">
                Kill Switch Active
              </Badge>
            )}
          </div>
        ))}
      </div>
    </WidgetScroll>
  );
}
