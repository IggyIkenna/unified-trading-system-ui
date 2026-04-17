"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { KPICard } from "@/components/trading/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useOverviewDataSafe } from "./overview-data-context";

export function KPIStripWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  const { scope: context } = useGlobalScope();

  if (!ctx)
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );

  const {
    totalPnl,
    totalExposure,
    totalNav,
    liveStrategies,
    warningStrategies,
    criticalAlerts,
    highAlerts,
    coreLoading,
    formatCurrency,
  } = ctx;

  if (coreLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3 h-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-full min-h-[4rem] rounded-md" />
        ))}
      </div>
    );
  }

  const hasData = totalNav > 0 || liveStrategies > 0 || criticalAlerts > 0 || highAlerts > 0;

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        No portfolio data available for the selected scope.
      </div>
    );
  }

  const marginUsed = totalNav > 0 ? `${Math.round((totalExposure / totalNav) * 100)}%` : "—";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3 h-full">
      <KPICard
        title={context.mode === "live" ? "P&L (Today)" : "P&L (As-Of)"}
        value={formatCurrency(totalPnl)}
        accentColor={totalPnl >= 0 ? "var(--pnl-positive)" : "var(--pnl-negative)"}
      />
      <KPICard title="Net Exposure" value={formatCurrency(totalExposure)} accentColor="var(--surface-trading)" />
      <KPICard title="Margin Used" value={marginUsed} accentColor="var(--status-warning)" />
      <KPICard
        title="Live Strategies"
        value={`${liveStrategies}`}
        subtitle={warningStrategies > 0 ? `${warningStrategies} warning` : "All healthy"}
        accentColor="var(--status-live)"
      />
      <KPICard
        title="Alerts"
        value={`${criticalAlerts + highAlerts}`}
        subtitle={`${criticalAlerts} critical, ${highAlerts} high`}
        accentColor={criticalAlerts > 0 ? "var(--status-error)" : "var(--status-warning)"}
      />
    </div>
  );
}
