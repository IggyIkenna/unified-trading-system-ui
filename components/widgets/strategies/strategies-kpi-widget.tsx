"use client";

import { Spinner } from "@/components/shared/spinner";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { useStrategiesData } from "./strategies-data-context";

export function StrategiesKpiWidget(_props: WidgetComponentProps) {
  const { isLoading, activeCount, strategies, totalAUM, totalPnL, totalMTDPnL } = useStrategiesData();

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[48px] items-center justify-center text-muted-foreground">
        <Spinner className="size-5" />
      </div>
    );
  }

  const metrics: KpiMetric[] = [
    {
      label: "Active Strategies",
      value: `${activeCount} / ${strategies.length}`,
      sentiment: "neutral",
    },
    {
      label: "Total AUM",
      value: `$${formatCurrency(totalAUM)}`,
      sentiment: "neutral",
    },
    {
      label: "Total P&L",
      value: `${totalPnL >= 0 ? "+" : "-"}$${formatCurrency(Math.abs(totalPnL))}`,
      sentiment: totalPnL >= 0 ? "positive" : "negative",
    },
    {
      label: "MTD P&L",
      value: `${totalMTDPnL >= 0 ? "+" : "-"}$${formatCurrency(Math.abs(totalMTDPnL))}`,
      sentiment: totalMTDPnL >= 0 ? "positive" : "negative",
    },
  ];

  return <KpiStrip metrics={metrics} columns={4} />;
}
