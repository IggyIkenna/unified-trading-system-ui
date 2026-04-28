"use client";

import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { useStrategiesData } from "./strategies-data-context";

export function StrategiesKpiWidget(_props: WidgetComponentProps) {
  const { isLoading, activeCount, strategies, totalAUM, totalPnL, totalMTDPnL } = useStrategiesData();

  const metrics: KpiMetric[] = [
    {
      label: "Active Strategies",
      value: isLoading ? "-" : `${activeCount} / ${strategies.length}`,
      sentiment: "neutral",
    },
    {
      label: "Total AUM",
      value: isLoading ? "-" : `$${formatCurrency(totalAUM)}`,
      sentiment: "neutral",
    },
    {
      label: "Total P&L",
      value: isLoading ? "-" : `${totalPnL >= 0 ? "+" : "-"}$${formatCurrency(Math.abs(totalPnL))}`,
      sentiment: isLoading ? "neutral" : totalPnL >= 0 ? "positive" : "negative",
    },
    {
      label: "MTD P&L",
      value: isLoading ? "-" : `${totalMTDPnL >= 0 ? "+" : "-"}$${formatCurrency(Math.abs(totalMTDPnL))}`,
      sentiment: isLoading ? "neutral" : totalMTDPnL >= 0 ? "positive" : "negative",
    },
  ];

  return <KpiSummaryWidget metrics={metrics} storageKey="uts-strategies-kpi-layout" />;
}
