"use client";

import * as React from "react";
import type { TradingClient, TradingOrganization } from "@/lib/types/trading";
import type { PnLBreakdown, TimeSeriesPoint } from "@/lib/mocks/fixtures/trading-data";
import type { PnLComponent } from "@/components/trading/pnl-attribution-panel";
import type { ServiceHealth } from "@/components/trading/health-status-grid";

export interface OverviewData {
  organizations: TradingOrganization[];
  clients: TradingClient[];
  aggregatedPnL: PnLBreakdown;
  liveTimeSeries: { pnl: TimeSeriesPoint[]; nav: TimeSeriesPoint[]; exposure: TimeSeriesPoint[] };
  batchTimeSeries: { pnl: TimeSeriesPoint[]; nav: TimeSeriesPoint[]; exposure: TimeSeriesPoint[] };
  realtimePnlPoints: TimeSeriesPoint[];
  strategyPerformance: Array<Record<string, unknown>>;
  filteredSortedStrategies: Array<Record<string, unknown>>;
  realtimePnl: Record<string, number>;
  mockAlerts: Array<{
    id: string;
    message: string;
    severity: "critical" | "high" | "medium" | "low";
    timestamp: string;
    source: string;
  }>;
  ordersData: unknown;
  allMockServices: ServiceHealth[];
  pnlComponents: PnLComponent[];
  totalPnl: number;
  totalExposure: number;
  totalNav: number;
  liveStrategies: number;
  warningStrategies: number;
  criticalAlerts: number;
  highAlerts: number;
  coreLoading: boolean;
  alertsLoading: boolean;
  ordersLoading: boolean;
  perfLoading: boolean;
  timeseriesLoading: boolean;
  liveBatchLoading: boolean;
  error: unknown;
  formatCurrency: (v: number) => string;
  formatDollar: (v: number) => string;
}

const OverviewDataContext = React.createContext<OverviewData | null>(null);

export function OverviewDataProvider({ value, children }: { value: OverviewData; children: React.ReactNode }) {
  return <OverviewDataContext.Provider value={value}>{children}</OverviewDataContext.Provider>;
}

export function useOverviewData(): OverviewData {
  const ctx = React.useContext(OverviewDataContext);
  if (!ctx) throw new Error("useOverviewData must be used within OverviewDataProvider");
  return ctx;
}

/** Safe version — returns null when used outside OverviewDataProvider (cross-tab widgets). */
export function useOverviewDataSafe(): OverviewData | null {
  return React.useContext(OverviewDataContext);
}
