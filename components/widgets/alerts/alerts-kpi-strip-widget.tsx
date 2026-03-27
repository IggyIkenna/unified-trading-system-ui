"use client";

import { KpiStrip, type KpiMetric } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAlertsData } from "./alerts-data-context";

/** Placeholder until resolution metrics are returned by the alerts API. */
const AVG_RESOLUTION_DISPLAY = "12m";
const LAST_24H_DISPLAY = "23";

export function AlertsKpiStripWidget(_props: WidgetComponentProps) {
  const { activeCount, criticalCount, isLoading } = useAlertsData();

  const metrics: KpiMetric[] = [
    {
      label: "Active Alerts",
      value: isLoading ? "—" : activeCount,
      sentiment: "neutral",
    },
    {
      label: "Critical",
      value: isLoading ? "—" : criticalCount,
      sentiment: criticalCount > 0 ? "negative" : "neutral",
    },
    {
      label: "Avg Resolution",
      value: isLoading ? "—" : AVG_RESOLUTION_DISPLAY,
      sentiment: "neutral",
    },
    {
      label: "Last 24h",
      value: isLoading ? "—" : LAST_24H_DISPLAY,
      sentiment: "neutral",
    },
  ];

  return <KpiStrip metrics={metrics} columns={4} />;
}
