"use client";

import * as React from "react";
import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { usePositionsData } from "./positions-data-context";

export function PositionsKpiWidget(_props: WidgetComponentProps) {
  const { summary } = usePositionsData();

  const metrics: KpiMetric[] = React.useMemo(
    () => [
      {
        label: "Positions",
        value: String(summary.totalPositions),
        sentiment: "neutral",
      },
      {
        label: "Total Notional",
        value: `$${formatCurrency(summary.totalNotional)}`,
        sentiment: "neutral",
      },
      {
        label: "Unrealized P&L",
        value: `${summary.unrealizedPnL >= 0 ? "+" : ""}$${formatCurrency(Math.abs(summary.unrealizedPnL))}`,
        sentiment: summary.unrealizedPnL >= 0 ? "positive" : "negative",
      },
      {
        label: "Total Margin",
        value: `$${formatCurrency(summary.totalMargin)}`,
        sentiment: "neutral",
      },
      {
        label: "Long Exposure",
        value: `$${formatCurrency(summary.longExposure)}`,
        sentiment: "neutral",
      },
      {
        label: "Short Exposure",
        value: `$${formatCurrency(summary.shortExposure)}`,
        sentiment: "neutral",
      },
    ],
    [summary],
  );

  return <KpiSummaryWidget metrics={metrics} storageKey="uts-positions-kpi-layout" />;
}
