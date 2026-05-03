"use client";

import * as React from "react";
import type { OverviewData } from "./overview-data-context";
import type { ServiceHealth } from "@/components/trading/health-status-grid";
import type { PnLComponent } from "@/components/trading/pnl-attribution-panel";
import { useValueFormat } from "@/components/trading/value-format-toggle";
import { useAlertsData } from "@/components/widgets/alerts/alerts-data-context";
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
  type StrategyPerformanceRow,
} from "@/hooks/api/use-trading";
import { useWebSocket } from "@/hooks/use-websocket";
import { getAggregatedPnlForScope, getStrategiesForScope } from "@/lib/mocks/fixtures/mock-data-index";
import type { SeedStrategy } from "@/lib/mocks/fixtures/mock-data-seed";
import type { TradingClient, TradingOrganization } from "@/lib/types/trading";
import type { PnLBreakdown, TimeSeriesPoint } from "@/lib/mocks/fixtures/trading-data";
import { CLIENTS, ORGANIZATIONS } from "@/lib/mocks/fixtures/trading-data";
import { SEED_SERVICES } from "@/lib/mocks/fixtures/trading-pages";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { formatNumber, formatCurrency as formatUsdCompact } from "@/lib/utils/formatters";

function seedToStrategyPerformanceRow(s: SeedStrategy): StrategyPerformanceRow {
  return {
    id: s.id,
    name: s.name,
    assetClass: "Crypto",
    archetype: s.archetype,
    clientName: s.clientId,
    orgName: s.orgId,
    orgId: s.orgId,
    clientId: s.clientId,
    status: s.status,
    executionMode: "live",
    pnl: (s.aum * s.mtdReturn) / 100,
    pnlChange: 0,
    sharpe: s.sharpe,
    maxDrawdown: 0,
    nav: s.aum,
    exposure: s.aum * 0.8,
  };
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export interface OverviewPageResult {
  overviewData: OverviewData;
  coreLoading: boolean;
  firstError: unknown;
  refetchOverview: () => void;
  /** Computed KPIs for the page chrome */
  totalPnl: number;
  totalExposure: number;
  totalNav: number;
  liveStrategies: number;
  warningStrategies: number;
  criticalAlerts: number;
  highAlerts: number;
  formatDollar: (v: number) => string;
  liveTimeSeries: { pnl: TimeSeriesPoint[]; nav: TimeSeriesPoint[]; exposure: TimeSeriesPoint[] };
  batchTimeSeries: { pnl: TimeSeriesPoint[]; nav: TimeSeriesPoint[]; exposure: TimeSeriesPoint[] };
}

/**
 * Extracted from overview/page.tsx — all data construction logic for the Overview tab.
 */
export function useOverviewPageData(): OverviewPageResult {
  const mockDataMode = isMockDataMode();
  const { data: orgsData, isLoading: orgsLoading, error: orgsError, refetch: refetchOrgs } = useTradingOrgs();
  const {
    data: clientsData,
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useTradingClients();
  const { data: pnlData, isLoading: pnlLoading, error: pnlError, refetch: refetchPnl } = useTradingPnl();
  const {
    data: timeseriesData,
    isLoading: timeseriesLoading,
    error: timeseriesError,
    refetch: refetchTimeseries,
  } = useTradingTimeseries();
  const {
    data: performanceData,
    isLoading: perfLoading,
    error: perfError,
    refetch: refetchPerformance,
  } = useTradingPerformance();
  const {
    data: liveBatchData,
    isLoading: liveBatchLoading,
    error: liveBatchError,
    refetch: refetchLiveBatch,
  } = useTradingLiveBatchDelta();
  const {
    filteredAlerts: alertsFromContext,
    isLoading: alertsLoading,
    isError: alertsHasError,
    refetch: refetchAlerts,
  } = useAlertsData();
  const alertsError = alertsHasError ? new Error("Alerts fetch failed") : null;
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useOrders();
  const { error: positionsError, refetch: refetchPositions } = usePositions();
  const { data: healthData, error: healthError, refetch: refetchHealth } = useServiceHealth();

  const [realtimePnl, setRealtimePnl] = React.useState<Record<string, number>>({});
  const [realtimePnlPoints, setRealtimePnlPoints] = React.useState<TimeSeriesPoint[]>([]);
  const wsScope = useWorkspaceScope();

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

  const organizations: TradingOrganization[] =
    orgsData?.data ?? orgsData?.organizations ?? (mockDataMode ? ORGANIZATIONS : []);
  const clients: TradingClient[] = clientsData?.data ?? clientsData?.clients ?? (mockDataMode ? CLIENTS : []);

  const mockAlerts = React.useMemo(
    () =>
      alertsFromContext.map((a) => ({
        id: a.id,
        message: a.title || a.description,
        severity: a.severity,
        timestamp: a.timestamp,
        source: a.source,
      })),
    [alertsFromContext],
  );

  const healthRaw = healthData as Record<string, unknown> | undefined;
  const allMockServices: ServiceHealth[] = (healthRaw?.data ??
    healthRaw?.services ??
    (mockDataMode ? SEED_SERVICES : [])) as ServiceHealth[];

  const seedPnlTotal = React.useMemo(() => {
    const agg = getAggregatedPnlForScope(wsScope.organizationIds, wsScope.clientIds, wsScope.strategyIds);
    return agg.reduce((sum, d) => sum + d.pnl, 0);
  }, [wsScope.organizationIds, wsScope.clientIds, wsScope.strategyIds]);

  const aggregatedPnL: PnLBreakdown =
    pnlData ??
    (mockDataMode
      ? {
          strategyId: "AGGREGATE",
          clientId: "MULTIPLE",
          orgId: "MULTIPLE",
          date: getToday(),
          mode: "live",
          delta: Math.round(seedPnlTotal * 0.35),
          funding: Math.round(seedPnlTotal * 0.15),
          basis: Math.round(seedPnlTotal * 0.12),
          interest_rate: Math.round(seedPnlTotal * 0.05),
          greeks: Math.round(seedPnlTotal * 0.08),
          mark_to_market: Math.round(seedPnlTotal * 0.1),
          carry: Math.round(seedPnlTotal * 0.06),
          fx: Math.round(seedPnlTotal * 0.02),
          fees: Math.round(seedPnlTotal * -0.03),
          slippage: Math.round(seedPnlTotal * -0.02),
          residual: Math.round(seedPnlTotal * 0.12),
          total: Math.round(seedPnlTotal),
        }
      : {
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
        });

  const seedTimeSeries = React.useMemo(() => {
    if (!mockDataMode) return null;
    const agg = getAggregatedPnlForScope(wsScope.organizationIds, wsScope.clientIds, wsScope.strategyIds);
    if (agg.length === 0) return null;
    let cumulativePnl = 0;
    const baseNav = 50_000_000;
    const pnl: TimeSeriesPoint[] = [];
    const nav: TimeSeriesPoint[] = [];
    const exposure: TimeSeriesPoint[] = [];
    for (const d of agg) {
      cumulativePnl += d.pnl;
      pnl.push({ timestamp: d.date, value: Math.round(cumulativePnl) });
      nav.push({ timestamp: d.date, value: Math.round(baseNav + cumulativePnl) });
      exposure.push({ timestamp: d.date, value: Math.round(baseNav * 0.8 + cumulativePnl * 0.3) });
    }
    return { pnl, nav, exposure };
  }, [mockDataMode, wsScope.organizationIds, wsScope.clientIds, wsScope.strategyIds]);

  const emptyTs: TimeSeriesPoint[] = [];
  const liveTimeSeries = timeseriesData?.timeseries ??
    (mockDataMode ? seedTimeSeries : null) ?? { pnl: emptyTs, nav: emptyTs, exposure: emptyTs };
  const batchTimeSeries = liveBatchData ??
    (mockDataMode ? seedTimeSeries : null) ?? { pnl: emptyTs, nav: emptyTs, exposure: emptyTs };

  const apiStrategies = performanceData?.data ?? performanceData?.strategies ?? [];
  const context = useWorkspaceScope();

  const allStrategies = React.useMemo((): StrategyPerformanceRow[] => {
    if (apiStrategies.length > 0) return apiStrategies;
    if (!mockDataMode) return [];
    const seed = getStrategiesForScope(context.organizationIds, context.clientIds, context.strategyIds);
    return seed.map(seedToStrategyPerformanceRow);
  }, [apiStrategies, mockDataMode, context.organizationIds, context.clientIds, context.strategyIds]);

  const strategyPerformance = React.useMemo((): StrategyPerformanceRow[] => {
    let result = [...allStrategies];
    if (context.organizationIds.length > 0) {
      result = result.filter((s) => {
        const oid = s.orgId ?? s.orgName;
        return oid ? context.organizationIds.includes(oid) : true;
      });
    }
    if (context.clientIds.length > 0) {
      result = result.filter((s) => {
        const cid = s.clientId ?? s.clientName;
        return cid ? context.clientIds.includes(cid) : true;
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

  const refetchOverview = React.useCallback(() => {
    void refetchOrgs();
    void refetchClients();
    void refetchPnl();
    void refetchTimeseries();
    void refetchPerformance();
    void refetchLiveBatch();
    void refetchAlerts();
    void refetchOrders();
    void refetchPositions();
    void refetchHealth();
  }, [
    refetchOrgs,
    refetchClients,
    refetchPnl,
    refetchTimeseries,
    refetchPerformance,
    refetchLiveBatch,
    refetchAlerts,
    refetchOrders,
    refetchPositions,
    refetchHealth,
  ]);

  const hasRealtimePnl = Object.keys(realtimePnl).length > 0;
  const totalPnl = hasRealtimePnl ? Object.values(realtimePnl).reduce((sum, v) => sum + v, 0) : aggregatedPnL.total;
  const kpiStrategies = strategyPerformance;
  const totalNav = kpiStrategies.reduce((sum, s) => sum + (s.nav ?? 0), 0) || 1;
  const totalExposure = kpiStrategies.reduce((sum, s) => sum + (s.exposure ?? 0), 0);
  const liveStrategies = kpiStrategies.filter((s) => s.status === "live").length;
  const warningStrategies = kpiStrategies.filter((s) => s.status === "warning").length;
  const criticalAlerts = alertsFromContext.filter((a) => a.severity === "critical" && a.status === "active").length;
  const highAlerts = alertsFromContext.filter((a) => a.severity === "high" && a.status === "active").length;

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
        return `${pct >= 0 ? "+" : ""}${formatNumber(pct, 2)}%`;
      }
      if (Math.abs(v) >= 1000000) return `$${formatNumber(v / 1000000, 2)}M`;
      if (Math.abs(v) >= 1000) return `$${formatNumber(v / 1000, 0)}k`;
      return formatUsdCompact(v, "USD", 0);
    },
    [valueFormat, totalNav],
  );

  const formatDollar = React.useCallback((v: number) => {
    if (Math.abs(v) >= 1000000) return `$${formatNumber(v / 1000000, 2)}M`;
    if (Math.abs(v) >= 1000) return `$${formatNumber(v / 1000, 0)}k`;
    return formatUsdCompact(v, "USD", 0);
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
      error: firstError,
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
      firstError,
      formatCurrency,
      formatDollar,
    ],
  );

  return {
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
  };
}
