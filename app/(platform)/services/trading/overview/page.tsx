"use client";

/**
 * G1.1 intentional split — /services/trading/overview is the live-phase
 * trading desk landing (data-freshness strip, widget grid bound to live
 * positions / orders). Its research-phase counterpart at
 * /services/research/overview is a distinct surface (research activity feed,
 * build jobs, catalogue roll-up), NOT a phase fork. Per Stage 3E §1.1, the
 * phase prop pattern applies only to surfaces that SHARE a conceptual role
 * across research / paper / live — these do not.
 */
import * as React from "react";
import { ApiError } from "@/components/shared/api-error";
import { DataFreshnessStrip, type DataSource } from "@/components/shared/data-freshness-strip";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { OverviewDataProvider } from "@/components/widgets/overview/overview-data-context";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { useOverviewPageData } from "@/components/widgets/overview/use-overview-page-data";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { formatNumber } from "@/lib/utils/formatters";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function OverviewPage() {
  const {
    overviewData,
    coreLoading,
    firstError,
    refetchOverview,
    totalPnl,
    totalExposure,
    totalNav,
    liveStrategies,
    warningStrategies,
    criticalAlerts,
    highAlerts,
    formatDollar,
    liveTimeSeries,
    batchTimeSeries,
  } = useOverviewPageData();

  const { scope: context } = useGlobalScope();

  const dataSources: DataSource[] = React.useMemo(() => {
    const now = new Date().toISOString();
    return [
      { label: "Positions", source: "live" as const, asOf: now, staleAfterSeconds: 30 },
      { label: "P&L", source: "live" as const, asOf: now, staleAfterSeconds: 60 },
      { label: "Batch Recon", source: "batch" as const, asOf: getToday() + "T08:00:00Z", staleAfterSeconds: 86400 },
    ];
  }, []);

  return (
    <div className="h-full bg-background flex flex-col">
      {firstError ? (
        <div className="p-4">
          <ApiError error={firstError as Error} onRetry={refetchOverview} title="Failed to load dashboard data" />
        </div>
      ) : null}
      {/* Data freshness + command center status strip */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/20 gap-4">
        <DataFreshnessStrip sources={dataSources} />
        <div className="flex items-center gap-4 text-[10px] font-mono">
          {/* P&L + exposure relationship */}
          <span className={totalPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}>
            P&L {totalPnl >= 0 ? "+" : ""}
            {formatDollar(totalPnl)}
          </span>
          <span className="text-muted-foreground">Exposure {formatDollar(totalExposure)}</span>
          <span className="text-muted-foreground/50">|</span>
          {/* Batch vs live delta */}
          {batchTimeSeries.pnl.length > 0 && liveTimeSeries.pnl.length > 0 && (
            <>
              <span className="text-muted-foreground">
                B/L Δ{" "}
                <span
                  className={
                    (liveTimeSeries.pnl.at(-1)?.value ?? 0) >= (batchTimeSeries.pnl.at(-1)?.value ?? 0)
                      ? "text-[var(--pnl-positive)]"
                      : "text-amber-400"
                  }
                >
                  {(liveTimeSeries.pnl.at(-1)?.value ?? 0) - (batchTimeSeries.pnl.at(-1)?.value ?? 0) >= 0 ? "+" : ""}
                  {formatDollar((liveTimeSeries.pnl.at(-1)?.value ?? 0) - (batchTimeSeries.pnl.at(-1)?.value ?? 0))}
                </span>
              </span>
              <span className="text-muted-foreground/50">|</span>
            </>
          )}
          {/* Status counts */}
          <span className="text-muted-foreground">{liveStrategies} live</span>
          {warningStrategies > 0 && <span className="text-amber-400">{warningStrategies} warning</span>}
          {criticalAlerts > 0 && <span className="text-red-400">{criticalAlerts} critical</span>}
          {highAlerts > 0 && <span className="text-amber-400">{highAlerts} high</span>}
        </div>
      </div>
      {/* Situational awareness: what's happening, what matters, what's wrong, what to do */}
      <SituationalAwareness
        totalPnl={totalPnl}
        totalExposure={totalExposure}
        totalNav={totalNav}
        liveStrategies={liveStrategies}
        warningStrategies={warningStrategies}
        criticalAlerts={criticalAlerts}
        highAlerts={highAlerts}
        formatDollar={formatDollar}
        isLive={context.mode === "live"}
      />
      <WidgetScroll viewportClassName="p-2">
        <OverviewDataProvider value={overviewData}>
          <WidgetGrid tab="overview" />
        </OverviewDataProvider>
      </WidgetScroll>
    </div>
  );
}

// ─── Situational Awareness ──────────────────────────────────────────────────

function SituationalAwareness({
  totalPnl,
  totalExposure,
  totalNav,
  liveStrategies,
  warningStrategies,
  criticalAlerts,
  highAlerts,
  formatDollar,
  isLive,
}: {
  totalPnl: number;
  totalExposure: number;
  totalNav: number;
  liveStrategies: number;
  warningStrategies: number;
  criticalAlerts: number;
  highAlerts: number;
  formatDollar: (v: number) => string;
  isLive: boolean;
}) {
  const riskUtil = totalNav > 0 ? (totalExposure / totalNav) * 100 : 0;
  const hasCritical = criticalAlerts > 0;
  const hasWarning = warningStrategies > 0 || highAlerts > 0;

  // Build "what to do next" guidance
  let actionGuidance: string;
  if (hasCritical) {
    actionGuidance = `${criticalAlerts} critical alert${criticalAlerts !== 1 ? "s" : ""} require immediate review.`;
  } else if (warningStrategies > 0 && highAlerts > 0) {
    actionGuidance = `${warningStrategies} strateg${warningStrategies !== 1 ? "ies" : "y"} in warning state and ${highAlerts} high-severity alert${highAlerts !== 1 ? "s" : ""} to triage.`;
  } else if (warningStrategies > 0) {
    actionGuidance = `${warningStrategies} strateg${warningStrategies !== 1 ? "ies" : "y"} in warning state — check for drift or execution issues.`;
  } else if (highAlerts > 0) {
    actionGuidance = `${highAlerts} high-severity alert${highAlerts !== 1 ? "s" : ""} pending triage.`;
  } else {
    actionGuidance = "All systems nominal — no action required.";
  }

  const borderColor = hasCritical
    ? "border-red-500/30 bg-red-500/5"
    : hasWarning
      ? "border-amber-500/20 bg-amber-500/5"
      : "border-border/30 bg-muted/5";

  return (
    <div className={`flex items-start gap-3 px-3 py-2 border-b text-[11px] leading-relaxed ${borderColor}`}>
      <div className="flex-1 min-w-0">
        <span className="text-muted-foreground">
          {isLive ? "Live" : "Batch"} — {liveStrategies} strategies running, {formatDollar(totalExposure)} gross
          exposure ({formatNumber(riskUtil, 0)}% of NAV). P&L{" "}
          <span className={totalPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}>
            {totalPnl >= 0 ? "+" : ""}
            {formatDollar(totalPnl)}
          </span>{" "}
          today.{" "}
        </span>
        <span className={hasCritical ? "text-red-400 font-medium" : hasWarning ? "text-amber-400" : "text-emerald-400"}>
          {actionGuidance}
        </span>
      </div>
    </div>
  );
}
