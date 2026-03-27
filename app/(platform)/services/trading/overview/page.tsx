"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useAlerts } from "@/hooks/api/use-alerts";
import { useOrders } from "@/hooks/api/use-orders";
import { usePositions } from "@/hooks/api/use-positions";
import { useServiceHealth } from "@/hooks/api/use-service-status";
import {
  useTradingClients,
  useTradingLiveBatchDelta,
  useTradingOrgs,
  useTradingPerformance,
  useTradingPnl,
  useTradingTimeseries,
} from "@/hooks/api/use-trading";
import { useWebSocket } from "@/hooks/use-websocket";
import { useValueFormat } from "@/components/trading/value-format-toggle";
import type { VenueMargin } from "@/components/trading/margin-utilization";
import type { ServiceHealth } from "@/components/trading/health-status-grid";
import type { PnLComponent } from "@/components/trading/pnl-attribution-panel";
import type { PnLBreakdown, TimeSeriesPoint, TradingClient, TradingOrganization } from "@/lib/trading-data";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { OverviewDataProvider, type OverviewData } from "@/components/widgets/overview/overview-data-context";

import "@/components/widgets/overview/register";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mx-4 my-4 p-4 rounded-lg border border-destructive/50 bg-destructive/10 flex items-center gap-3">
      <AlertTriangle className="size-5 text-destructive flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-destructive">Failed to load dashboard data</p>
        <p className="text-xs text-muted-foreground mt-1">{message}</p>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { data: orgsData, isLoading: orgsLoading, error: orgsError } = useTradingOrgs();
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useTradingClients();
  const { data: pnlData, isLoading: pnlLoading, error: pnlError } = useTradingPnl();
  const { data: timeseriesData, isLoading: timeseriesLoading, error: timeseriesError } = useTradingTimeseries();
  const { data: performanceData, isLoading: perfLoading, error: perfError } = useTradingPerformance();
  const { data: liveBatchData, isLoading: liveBatchLoading, error: liveBatchError } = useTradingLiveBatchDelta();
  const { data: alertsData, isLoading: alertsLoading, error: alertsError } = useAlerts();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: positionsData, error: positionsError } = usePositions();
  const { data: healthData, error: healthError } = useServiceHealth();

  const [realtimePnl, setRealtimePnl] = React.useState<Record<string, number>>({});
  const [realtimePnlPoints, setRealtimePnlPoints] = React.useState<TimeSeriesPoint[]>([]);
  const { scope: wsScope } = useGlobalScope();

  const handleWsMessage = React.useCallback((msg: Record<string, unknown>) => {
    if (msg.channel === "analytics" && msg.type === "pnl_snapshot") {
      const strategies = (msg.data as Record<string, unknown>)?.strategies as
        | Array<Record<string, unknown>>
        | undefined;
      if (strategies) {
        const pnlMap: Record<string, number> = {};
        let totalSnapshotPnl = 0;
        for (const s of strategies) {
          if (typeof s.id === "string" && typeof s.pnl === "number") {
            pnlMap[s.id] = s.pnl;
            totalSnapshotPnl += s.pnl;
          }
        }
        setRealtimePnl(pnlMap);
        setRealtimePnlPoints((prev) => {
          const now = new Date().toISOString();
          const next: TimeSeriesPoint[] = [...prev, { timestamp: now, value: totalSnapshotPnl }];
          return next.length > 500 ? next.slice(-500) : next;
        });
      }
    }
  }, []);

  useWebSocket({ url: "ws://localhost:8030/ws", enabled: wsScope.mode === "live", onMessage: handleWsMessage });

  const organizations: TradingOrganization[] = orgsData?.organizations ?? [];
  const clients: TradingClient[] = clientsData?.clients ?? [];

  const alertsRaw = alertsData as Record<string, unknown> | undefined;
  const mockAlerts = (alertsRaw?.data ?? alertsRaw?.alerts ?? []) as Array<{
    id: string;
    message: string;
    severity: "critical" | "high" | "medium" | "low";
    timestamp: string;
    source: string;
  }>;

  const healthRaw = healthData as Record<string, unknown> | undefined;
  const allMockServices: ServiceHealth[] = (healthRaw?.data ?? healthRaw?.services ?? []) as ServiceHealth[];

  const aggregatedPnL: PnLBreakdown = pnlData ?? {
    strategyId: "AGGREGATE",
    clientId: "MULTIPLE",
    orgId: "MULTIPLE",
    date: getToday(),
    mode: "live",
    delta: 0,
    funding: 0,
    basis: 0,
    interest_rate: 0,
    greeks: 0,
    mark_to_market: 0,
    carry: 0,
    fx: 0,
    fees: 0,
    slippage: 0,
    residual: 0,
    total: 0,
  };

  const emptyTs: TimeSeriesPoint[] = [];
  const liveTimeSeries = timeseriesData?.timeseries ?? { pnl: emptyTs, nav: emptyTs, exposure: emptyTs };
  const batchTimeSeries = liveBatchData ?? { pnl: emptyTs, nav: emptyTs, exposure: emptyTs };

  const allStrategies = performanceData?.strategies ?? [];
  const { scope: context } = useGlobalScope();

  const strategyPerformance = React.useMemo(() => {
    let result = allStrategies;
    if (context.organizationIds.length > 0) {
      result = result.filter((s) => {
        const orgHint = (s as unknown as Record<string, unknown>).orgId as string | undefined;
        return orgHint ? context.organizationIds.includes(orgHint) : true;
      });
    }
    if (context.clientIds.length > 0) {
      result = result.filter((s) => {
        const clientHint = (s as unknown as Record<string, unknown>).clientId as string | undefined;
        return clientHint ? context.clientIds.includes(clientHint) : true;
      });
    }
    if (context.strategyIds.length > 0) {
      result = result.filter((s) => context.strategyIds.includes(s.id));
    }
    return result;
  }, [allStrategies, context.organizationIds, context.clientIds, context.strategyIds]);

  const { format: valueFormat } = useValueFormat("dollar");

  const coreLoading = orgsLoading || clientsLoading || pnlLoading || timeseriesLoading || perfLoading;
  const firstError =
    orgsError ??
    clientsError ??
    pnlError ??
    timeseriesError ??
    perfError ??
    alertsError ??
    positionsError ??
    healthError ??
    liveBatchError;

  const hasRealtimePnl = Object.keys(realtimePnl).length > 0;
  const totalPnl = hasRealtimePnl ? Object.values(realtimePnl).reduce((sum, v) => sum + v, 0) : aggregatedPnL.total;
  const kpiStrategies = strategyPerformance;
  const totalNav = kpiStrategies.reduce((sum, s) => sum + (s.nav ?? 0), 0) || 1;
  const totalExposure = kpiStrategies.reduce((sum, s) => sum + (s.exposure ?? 0), 0);
  const liveStrategies = kpiStrategies.filter((s) => s.status === "live").length;
  const warningStrategies = kpiStrategies.filter((s) => s.status === "warning").length;
  const criticalAlerts = mockAlerts.filter((a) => a.severity === "critical").length;
  const highAlerts = mockAlerts.filter((a) => a.severity === "high").length;

  const safeDivide = (num: number, denom: number): number => {
    if (!denom || denom === 0 || !isFinite(num) || !isFinite(denom)) return 0;
    return (num / Math.abs(denom)) * 100;
  };

  const pnlComponents: PnLComponent[] = [
    {
      name: "Funding",
      pnl: aggregatedPnL.funding || 0,
      percentage: safeDivide(aggregatedPnL.funding, aggregatedPnL.total),
    },
    { name: "Carry", pnl: aggregatedPnL.carry || 0, percentage: safeDivide(aggregatedPnL.carry, aggregatedPnL.total) },
    { name: "Basis", pnl: aggregatedPnL.basis || 0, percentage: safeDivide(aggregatedPnL.basis, aggregatedPnL.total) },
    { name: "Delta", pnl: aggregatedPnL.delta || 0, percentage: safeDivide(aggregatedPnL.delta, aggregatedPnL.total) },
    {
      name: "Greeks",
      pnl: aggregatedPnL.greeks || 0,
      percentage: safeDivide(aggregatedPnL.greeks, aggregatedPnL.total),
    },
    {
      name: "Slippage",
      pnl: aggregatedPnL.slippage || 0,
      percentage: safeDivide(aggregatedPnL.slippage, aggregatedPnL.total),
    },
    { name: "Fees", pnl: aggregatedPnL.fees || 0, percentage: safeDivide(aggregatedPnL.fees, aggregatedPnL.total) },
    {
      name: "Residual",
      pnl: aggregatedPnL.residual || 0,
      percentage: safeDivide(aggregatedPnL.residual, aggregatedPnL.total),
    },
  ].filter((c) => Math.abs(c.pnl) > 0.01 && isFinite(c.pnl));

  const formatCurrency = React.useCallback(
    (v: number) => {
      if (valueFormat === "percent") {
        const pct = totalNav > 0 ? (v / totalNav) * 100 : 0;
        return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
      }
      if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
      if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
      return `$${v.toFixed(0)}`;
    },
    [valueFormat, totalNav],
  );

  const formatDollar = React.useCallback((v: number) => {
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v.toFixed(0)}`;
  }, []);

  const overviewData: OverviewData = React.useMemo(
    () => ({
      organizations,
      clients,
      aggregatedPnL,
      liveTimeSeries,
      batchTimeSeries,
      realtimePnlPoints,
      strategyPerformance: strategyPerformance as unknown as Array<Record<string, unknown>>,
      filteredSortedStrategies: strategyPerformance as unknown as Array<Record<string, unknown>>,
      realtimePnl,
      mockAlerts,
      ordersData,
      allMockServices,
      pnlComponents,
      totalPnl,
      totalExposure,
      totalNav,
      liveStrategies,
      warningStrategies,
      criticalAlerts,
      highAlerts,
      coreLoading,
      alertsLoading,
      ordersLoading,
      perfLoading,
      timeseriesLoading,
      liveBatchLoading,
      formatCurrency,
      formatDollar,
    }),
    [
      organizations,
      clients,
      aggregatedPnL,
      liveTimeSeries,
      batchTimeSeries,
      realtimePnlPoints,
      strategyPerformance,
      realtimePnl,
      mockAlerts,
      ordersData,
      allMockServices,
      pnlComponents,
      totalPnl,
      totalExposure,
      totalNav,
      liveStrategies,
      warningStrategies,
      criticalAlerts,
      highAlerts,
      coreLoading,
      alertsLoading,
      ordersLoading,
      perfLoading,
      timeseriesLoading,
      liveBatchLoading,
      formatCurrency,
      formatDollar,
    ],
  );

  return (
    <div className="h-full bg-background flex flex-col">
      {firstError && <ErrorBanner message={(firstError as Error).message ?? "Unknown error"} />}
      <div className="flex-1 overflow-auto p-2">
        <OverviewDataProvider value={overviewData}>
          <WidgetGrid tab="overview" />
        </OverviewDataProvider>
      </div>
    </div>
  );
}
