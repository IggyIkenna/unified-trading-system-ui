"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { KPICard } from "@/components/trading/kpi-card";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useOverviewDataSafe } from "./overview-data-context";
import { MOCK_PORTFOLIO_DELTA, STRATEGY_RISK_PROFILES } from "@/lib/mocks/fixtures/defi-risk";
import { formatNumber } from "@/lib/utils/formatters";

/** Returns true when DeFi strategies are active (mock: true when profiles exist). */
function useHasDefiStrategies(): boolean {
  return STRATEGY_RISK_PROFILES.length > 0;
}

export function KPIStripWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  const { scope: context } = useGlobalScope();
  const hasDefi = useHasDefiStrategies();

  if (!ctx) return <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">Navigate to Overview tab</div>;
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

  const defiDeltaSummary = hasDefi
    ? `USD ${MOCK_PORTFOLIO_DELTA.total_delta_usd > 0 ? "+" : ""}$${formatNumber(MOCK_PORTFOLIO_DELTA.total_delta_usd / 1000, 0)}K | ETH ${MOCK_PORTFOLIO_DELTA.total_delta_eth > 0 ? "+" : ""}${formatNumber(MOCK_PORTFOLIO_DELTA.total_delta_eth, 1)}`
    : undefined;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-3 h-full">
      <KPICard
        title={context.mode === "live" ? "P&L (Today)" : "P&L (As-Of)"}
        value={coreLoading ? "—" : formatCurrency(totalPnl)}
        accentColor={totalPnl >= 0 ? "var(--pnl-positive)" : "var(--pnl-negative)"}
      />
      <KPICard
        title="Net Exposure"
        value={coreLoading ? "—" : formatCurrency(totalExposure)}
        accentColor="var(--surface-trading)"
      />
      <KPICard
        title="Margin Used"
        value={coreLoading ? "—" : `${Math.round((totalExposure / totalNav) * 100)}%`}
        accentColor="var(--status-warning)"
      />
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
      {hasDefi && (
        <KPICard
          title="DeFi Delta"
          value={`$${formatNumber(MOCK_PORTFOLIO_DELTA.total_delta_usd / 1000, 0)}K`}
          subtitle={defiDeltaSummary}
          accentColor="var(--surface-config)"
        />
      )}
    </div>
  );
}
