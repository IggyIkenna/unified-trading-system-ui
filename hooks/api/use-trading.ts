import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import type { PnLBreakdown, TimeSeriesPoint, TradingClient, TradingOrganization } from "@/lib/trading-data";
import { useQuery } from "@tanstack/react-query";

// ---- Response shapes ----

interface TradingOrgsResponse {
  organizations: TradingOrganization[];
  total: number;
}

interface TradingClientsResponse {
  clients: TradingClient[];
  total: number;
}

interface TradingTimeseriesResponse {
  timeseries: {
    pnl: TimeSeriesPoint[];
    nav: TimeSeriesPoint[];
    exposure: TimeSeriesPoint[];
  };
}

export interface StrategyPerformanceRow {
  id: string;
  name: string;
  assetClass: string;
  archetype: string;
  clientName: string;
  orgName: string;
  /** Present on seed / merged rows for scope filtering by id */
  orgId?: string;
  clientId?: string;
  status: string;
  executionMode: string;
  pnl: number;
  pnlChange: number;
  sharpe: number;
  maxDrawdown: number;
  nav: number;
  exposure: number;
}

interface TradingPerformanceResponse {
  strategies: StrategyPerformanceRow[];
  total: number;
}

interface LiveBatchDeltaResponse {
  pnl: TimeSeriesPoint[];
  nav: TimeSeriesPoint[];
  exposure: TimeSeriesPoint[];
}

// ---- Hooks ----

export function useTradingOrgs() {
  const { user, token } = useAuth();

  return useQuery<TradingOrgsResponse>({
    queryKey: ["trading-organizations", user?.id],
    queryFn: () => apiFetch("/api/trading/organizations", token) as Promise<TradingOrgsResponse>,
    enabled: !!user,
  });
}

export function useTradingClients() {
  const { user, token } = useAuth();

  return useQuery<TradingClientsResponse>({
    queryKey: ["trading-clients", user?.id],
    queryFn: () => apiFetch("/api/trading/clients", token) as Promise<TradingClientsResponse>,
    enabled: !!user,
  });
}

export function useTradingPnl() {
  const { user, token } = useAuth();

  return useQuery<PnLBreakdown>({
    queryKey: ["trading-pnl", user?.id],
    queryFn: () => apiFetch("/api/trading/pnl", token) as Promise<PnLBreakdown>,
    enabled: !!user,
  });
}

export function useTradingTimeseries() {
  const { user, token } = useAuth();

  return useQuery<TradingTimeseriesResponse>({
    queryKey: ["trading-timeseries", user?.id],
    queryFn: () => apiFetch("/api/trading/timeseries", token) as Promise<TradingTimeseriesResponse>,
    enabled: !!user,
  });
}

export function useTradingPerformance() {
  const { user, token } = useAuth();

  return useQuery<TradingPerformanceResponse>({
    queryKey: ["trading-performance", user?.id],
    queryFn: () => apiFetch("/api/trading/performance", token) as Promise<TradingPerformanceResponse>,
    enabled: !!user,
  });
}

export function useTradingLiveBatchDelta() {
  const { user, token } = useAuth();

  return useQuery<LiveBatchDeltaResponse>({
    queryKey: ["trading-live-batch-delta", user?.id],
    queryFn: () => apiFetch("/api/trading/live-batch-delta", token) as Promise<LiveBatchDeltaResponse>,
    enabled: !!user,
  });
}

// Re-export response types for consumers
export type {
  LiveBatchDeltaResponse,
  TradingClientsResponse,
  TradingOrgsResponse,
  TradingPerformanceResponse,
  TradingTimeseriesResponse,
};
