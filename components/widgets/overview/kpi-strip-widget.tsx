"use client";

import * as React from "react";
import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import type { WidgetComponentProps } from "../widget-registry";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { useOverviewDataSafe } from "./overview-data-context";

export function KPIStripWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  const context = useWorkspaceScope();

  const metrics = React.useMemo<KpiMetric[]>(() => {
    if (!ctx) return [];
    const {
      totalPnl,
      totalExposure,
      totalNav,
      liveStrategies,
      warningStrategies,
      criticalAlerts,
      highAlerts,
      formatCurrency,
    } = ctx;
    const marginUsed = totalNav > 0 ? `${Math.round((totalExposure / totalNav) * 100)}%` : "-";
    const totalAlerts = criticalAlerts + highAlerts;
    return [
      {
        label: context.mode === "live" ? "P&L (Today)" : "P&L (As-Of)",
        value: formatCurrency(totalPnl),
        sentiment: totalPnl > 0 ? "positive" : totalPnl < 0 ? "negative" : "neutral",
      },
      {
        label: "Net Exposure",
        value: formatCurrency(totalExposure),
        sentiment: "neutral",
      },
      {
        label: "Margin Used",
        value: marginUsed,
        sentiment: "neutral",
      },
      {
        label: "Live Strategies",
        value: `${liveStrategies} · ${warningStrategies > 0 ? `${warningStrategies} warning` : "All healthy"}`,
        sentiment: warningStrategies > 0 ? "negative" : "positive",
      },
      {
        label: "Alerts",
        value: `${totalAlerts} · ${criticalAlerts} critical, ${highAlerts} high`,
        sentiment: criticalAlerts > 0 ? "negative" : highAlerts > 0 ? "neutral" : "positive",
      },
    ];
  }, [ctx, context.mode]);

  if (!ctx) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );
  }

  if (ctx.coreLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3 h-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-full min-h-[4rem] rounded-md" />
        ))}
      </div>
    );
  }

  const hasData = ctx.totalNav > 0 || ctx.liveStrategies > 0 || ctx.criticalAlerts > 0 || ctx.highAlerts > 0;

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        No portfolio data available for the selected scope.
      </div>
    );
  }

  return (
    <div data-testid="overview-kpi-strip" className="h-full">
      <KpiSummaryWidget metrics={metrics} storageKey="uts-overview-kpi-layout" />
    </div>
  );
}
