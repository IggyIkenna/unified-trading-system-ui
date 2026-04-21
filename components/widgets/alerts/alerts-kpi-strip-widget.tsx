"use client";

import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { MOCK_AVG_RESOLUTION_DISPLAY, MOCK_LAST_24H_DISPLAY } from "@/lib/config/services/alerts.config";
import { useAlertsData } from "./alerts-data-context";

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
      value: isLoading ? "—" : MOCK_AVG_RESOLUTION_DISPLAY,
      sentiment: "neutral",
    },
    {
      label: "Last 24h",
      value: isLoading ? "—" : MOCK_LAST_24H_DISPLAY,
      sentiment: "neutral",
    },
  ];

  return <KpiSummaryWidget metrics={metrics} storageKey="uts-alerts-kpi-layout" />;
}
