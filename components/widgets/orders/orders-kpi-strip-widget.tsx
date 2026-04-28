"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import { useOrdersData } from "./orders-data-context";

export function OrdersKpiStripWidget(_props: WidgetComponentProps) {
  const { summary, isLoading, error } = useOrdersData();

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-rose-400">Failed to load orders</p>
      </div>
    );
  }

  const metrics: KpiMetric[] = [
    { label: "Total Orders", value: isLoading ? "-" : summary.total, sentiment: "neutral" },
    { label: "Open", value: isLoading ? "-" : summary.open, sentiment: "neutral" },
    {
      label: "Partial",
      value: isLoading ? "-" : summary.partial,
      sentiment: summary.partial > 0 ? "negative" : "neutral",
    },
    { label: "Filled", value: isLoading ? "-" : summary.filled, sentiment: "positive" },
    {
      label: "Rejected",
      value: isLoading ? "-" : summary.rejected,
      sentiment: summary.rejected > 0 ? "negative" : "neutral",
    },
    {
      label: "Failed",
      value: isLoading ? "-" : summary.failed,
      sentiment: summary.failed > 0 ? "negative" : "neutral",
    },
  ];

  return (
    <div data-testid="orders-kpi-strip-widget" className="h-full">
      <KpiSummaryWidget metrics={metrics} storageKey="uts-orders-kpi-layout" />
    </div>
  );
}
