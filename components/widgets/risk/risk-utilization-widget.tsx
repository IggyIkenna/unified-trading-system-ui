"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData } from "./risk-data-context";
import { LimitBar } from "@/components/trading/limit-bar";
import { Spinner } from "@/components/shared/spinner";
import { WidgetScroll } from "@/components/shared/widget-scroll";

export function RiskUtilizationWidget(_props: WidgetComponentProps) {
  const { sortedLimits, isLoading, hasError } = useRiskData();

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
        Failed to load utilization data
      </div>
    );
  }

  if (sortedLimits.length === 0) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No limits data</div>;
  }

  return (
    <WidgetScroll axes="vertical">
      <div className="space-y-2.5 p-1">
        {sortedLimits.slice(0, 8).map((limit) => (
          <LimitBar
            key={limit.id}
            label={`${limit.name} (${limit.entity})`}
            value={limit.value}
            limit={limit.limit}
            unit={limit.unit}
            showStatus={false}
          />
        ))}
      </div>
    </WidgetScroll>
  );
}
