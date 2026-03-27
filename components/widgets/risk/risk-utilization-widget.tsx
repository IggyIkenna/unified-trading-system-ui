"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData } from "./risk-data-context";
import { LimitBar } from "@/components/trading/limit-bar";
import { WidgetScroll } from "@/components/shared/widget-scroll";

export function RiskUtilizationWidget(_props: WidgetComponentProps) {
  const { sortedLimits } = useRiskData();

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
        {sortedLimits.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-6">No limits data</div>
        )}
      </div>
    </WidgetScroll>
  );
}
