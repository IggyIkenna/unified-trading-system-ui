import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import type { PaginatedResponse } from "@/lib/api/types";
import { withMode } from "@/lib/api/with-mode";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import type { TradingClient, TradingOrganization } from "@/lib/types/trading";
import type { PnLBreakdown, TimeSeriesPoint } from "@/lib/mocks/fixtures/trading-data";
import { useQuery } from "@tanstack/react-query";

// ---- Response shapes ----

/** Paginated response with backward-compat `organizations` alias */
interface TradingOrgsResponse extends PaginatedResponse<TradingOrganization> {
  /** @deprecated use `data` — kept for backward compat */
  organizations?: TradingOrganization[];
}

/** Paginated response with backward-compat `clients` alias */
interface TradingClientsResponse extends PaginatedResponse<TradingClient> {
  /** @deprecated use `data` — kept for backward compat */
  clients?: TradingClient[];
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

/** Paginated response with backward-compat `strategies` alias */
interface TradingPerformanceResponse extends PaginatedResponse<StrategyPerformanceRow> {
  /** @deprecated use `data` — kept for backward compat */
  strategies?: StrategyPerformanceRow[];
}

interface LiveBatchDeltaResponse {
  pnl: TimeSeriesPoint[];
  nav: TimeSeriesPoint[];
  exposure: TimeSeriesPoint[];
}

// ---- Hooks ----

export function useTradingOrgs() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<TradingOrgsResponse>({
    queryKey: ["trading-organizations", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(
        withMode("/api/trading/organizations", scope.mode, scope.asOfDatetime),
        token,
      ) as Promise<TradingOrgsResponse>,
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useTradingClients() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<TradingClientsResponse>({
    queryKey: ["trading-clients", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(
        withMode("/api/trading/clients", scope.mode, scope.asOfDatetime),
        token,
      ) as Promise<TradingClientsResponse>,
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useTradingPnl() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<PnLBreakdown>({
    queryKey: ["trading-pnl", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/trading/pnl", scope.mode, scope.asOfDatetime), token) as Promise<PnLBreakdown>,
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useTradingTimeseries() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<TradingTimeseriesResponse>({
    queryKey: ["trading-timeseries", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(
        withMode("/api/trading/timeseries", scope.mode, scope.asOfDatetime),
        token,
      ) as Promise<TradingTimeseriesResponse>,
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useTradingPerformance() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<TradingPerformanceResponse>({
    queryKey: ["trading-performance", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(
        withMode("/api/trading/performance", scope.mode, scope.asOfDatetime),
        token,
      ) as Promise<TradingPerformanceResponse>,
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useTradingLiveBatchDelta() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<LiveBatchDeltaResponse>({
    queryKey: ["trading-live-batch-delta", user?.id, scope.mode],
    // This endpoint compares live vs batch internally — always send mode=live
    queryFn: () =>
      apiFetch(withMode("/api/trading/live-batch-delta", "live"), token) as Promise<LiveBatchDeltaResponse>,
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
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
