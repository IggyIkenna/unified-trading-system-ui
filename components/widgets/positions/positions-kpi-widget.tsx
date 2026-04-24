"use client";

import * as React from "react";
import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { usePositionsData } from "./positions-data-context";

export function PositionsKpiWidget(_props: WidgetComponentProps) {
  const { summary, isLoading, positionsError } = usePositionsData();

  const metrics: KpiMetric[] = React.useMemo(
    () => [
      {
        label: "Positions",
        value: isLoading ? "—" : String(summary.totalPositions),
        sentiment: "neutral",
      },
      {
        label: "Total Notional",
        value: isLoading ? "—" : `$${formatCurrency(summary.totalNotional)}`,
        sentiment: "neutral",
      },
      {
        label: "Unrealized P&L",
        value: isLoading
          ? "—"
          : `${summary.unrealizedPnL >= 0 ? "+" : ""}$${formatCurrency(Math.abs(summary.unrealizedPnL))}`,
        sentiment: summary.unrealizedPnL >= 0 ? "positive" : "negative",
      },
      {
        label: "Total Margin",
        value: isLoading ? "—" : `$${formatCurrency(summary.totalMargin)}`,
        sentiment: "neutral",
      },
      {
        label: "Long Exposure",
        value: isLoading ? "—" : `$${formatCurrency(summary.longExposure)}`,
        sentiment: "neutral",
      },
      {
        label: "Short Exposure",
        value: isLoading ? "—" : `$${formatCurrency(summary.shortExposure)}`,
        sentiment: "neutral",
      },
    ],
    [summary, isLoading],
  );

  if (positionsError) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-rose-400">Failed to load positions</p>
      </div>
    );
  }

  return (
    <div data-testid="positions-kpi-widget" className="h-full">
      <KpiSummaryWidget metrics={metrics} storageKey="uts-positions-kpi-layout" />
    </div>
  );
}
