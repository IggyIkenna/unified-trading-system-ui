"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { KpiStrip, type KpiMetric } from "../shared";
import { useOrdersData } from "./orders-data-context";

export function OrdersKpiStripWidget(_props: WidgetComponentProps) {
  const { summary, isLoading } = useOrdersData();

  const metrics: KpiMetric[] = [
    { label: "Total Orders", value: isLoading ? "—" : summary.total, sentiment: "neutral" },
    { label: "Open", value: isLoading ? "—" : summary.open, sentiment: "neutral" },
    {
      label: "Partial",
      value: isLoading ? "—" : summary.partial,
      sentiment: summary.partial > 0 ? "negative" : "neutral",
    },
    { label: "Filled", value: isLoading ? "—" : summary.filled, sentiment: "positive" },
  ];

  return (
    <div className="h-full flex items-center p-2">
      <KpiStrip metrics={metrics} columns={4} className="w-full" />
    </div>
  );
}
