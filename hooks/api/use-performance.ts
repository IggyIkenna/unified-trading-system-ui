import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { withMode } from "@/lib/api/with-mode";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import type { PerformanceSummary } from "@/lib/mocks/fixtures/client-performance";
import {
  getMockPerformanceSummary,
  MOCK_CLIENTS,
  MOCK_ORGANISATIONS,
  MOCK_STRATEGIES,
  MOCK_COIN_BREAKDOWN,
  MOCK_POSITIONS,
  MOCK_TRADES,
  MOCK_BALANCE_BREAKDOWN,
  type ClientInfo,
  type ClientsResponse,
  type OrganisationInfo,
  type StrategyInfo,
  type PositionRecord,
  type CoinBreakdown,
  type TradeRecord,
  type BalanceBreakdown,
} from "@/lib/mocks/fixtures/client-performance";
import { isMockDataMode } from "@/lib/runtime/data-mode";

const isMock = isMockDataMode();

export function useClients() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<ClientsResponse>({
    queryKey: ["client-reporting-clients", user?.id, scope.mode],
    queryFn: async () => {
      if (isMock) return { clients: MOCK_CLIENTS, organisations: MOCK_ORGANISATIONS, strategies: MOCK_STRATEGIES };
      const data = await apiFetch(withMode("/api/reporting/clients", scope.mode, scope.asOfTs ?? undefined), token);
      // Handle both old (array) and new (object) response shapes
      if (Array.isArray(data)) {
        return { clients: data as ClientInfo[], organisations: [] as OrganisationInfo[], strategies: [] as StrategyInfo[] };
      }
      return data as ClientsResponse;
    },
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function usePerformanceSummary(clientId: string | null) {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<PerformanceSummary>({
    queryKey: ["performance-summary", clientId, user?.id, scope.mode],
    queryFn: async () => {
      if (isMock) return getMockPerformanceSummary(clientId!);
      const data = await apiFetch(withMode(`/api/reporting/performance/summary?client_id=${clientId}`, scope.mode, scope.asOfTs ?? undefined), token);
      return data as PerformanceSummary;
    },
    enabled: !!user && !!clientId,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useOpenPositions(clientId: string | null) {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<{ client_id: string; positions: PositionRecord[] }>({
    queryKey: ["open-positions", clientId, user?.id, scope.mode],
    queryFn: async () => {
      if (isMock) return { client_id: clientId!, positions: MOCK_POSITIONS };
      const data = await apiFetch(withMode(`/api/reporting/performance/positions?client_id=${clientId}`, scope.mode, scope.asOfTs ?? undefined), token);
      return data as { client_id: string; positions: PositionRecord[] };
    },
    enabled: !!user && !!clientId,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useCoinBreakdown(clientId: string | null) {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<{ client_id: string; coins: CoinBreakdown[] }>({
    queryKey: ["coin-breakdown", clientId, user?.id, scope.mode],
    queryFn: async () => {
      if (isMock) return { client_id: clientId!, coins: MOCK_COIN_BREAKDOWN };
      const data = await apiFetch(withMode(`/api/reporting/performance/coin-breakdown?client_id=${clientId}`, scope.mode, scope.asOfTs ?? undefined), token);
      return data as { client_id: string; coins: CoinBreakdown[] };
    },
    enabled: !!user && !!clientId,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useBalanceBreakdown(clientId: string | null) {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<{ client_id: string } & BalanceBreakdown>({
    queryKey: ["balance-breakdown", clientId, user?.id, scope.mode],
    queryFn: async () => {
      if (isMock) return { client_id: clientId!, ...MOCK_BALANCE_BREAKDOWN };
      const data = await apiFetch(withMode(`/api/reporting/performance/balances?client_id=${clientId}`, scope.mode, scope.asOfTs ?? undefined), token);
      return data as { client_id: string } & BalanceBreakdown;
    },
    enabled: !!user && !!clientId,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useTradeHistory(clientId: string | null, params?: { symbol?: string; side?: string; limit?: number; offset?: number }) {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;

  return useQuery<{
    client_id: string;
    trades: TradeRecord[];
    total: number;
    offset: number;
    limit: number;
    aggregates: {
      total_trades: number;
      total_volume_usd: number;
      total_fees_usd: number;
      net_realized_pnl: number;
    };
  }>({
    queryKey: ["trade-history", clientId, params?.symbol, params?.side, limit, offset, user?.id, scope.mode],
    queryFn: async () => {
      if (isMock) {
        let trades = [...MOCK_TRADES];
        if (params?.symbol) trades = trades.filter((t) => t.symbol === params.symbol);
        if (params?.side) trades = trades.filter((t) => t.side === params.side);
        const total = trades.length;
        trades = trades.slice(offset, offset + limit);
        const totalVolume = MOCK_TRADES.reduce((s, t) => s + t.notional_usd, 0);
        const totalFees = MOCK_TRADES.reduce((s, t) => s + t.fee, 0);
        const netPnl = MOCK_TRADES.reduce((s, t) => s + t.realized_pnl, 0);
        return {
          client_id: clientId!,
          trades,
          total,
          offset,
          limit,
          aggregates: {
            total_trades: MOCK_TRADES.length,
            total_volume_usd: Math.round(totalVolume * 100) / 100,
            total_fees_usd: Math.round(totalFees * 100) / 100,
            net_realized_pnl: Math.round(netPnl * 100) / 100,
          },
        };
      }
      const qs = new URLSearchParams({ client_id: clientId!, limit: String(limit), offset: String(offset) });
      if (params?.symbol) qs.set("symbol", params.symbol);
      if (params?.side) qs.set("side", params.side);
      const data = await apiFetch(withMode(`/api/reporting/trades?${qs.toString()}`, scope.mode, scope.asOfTs ?? undefined), token);
      return data as {
        client_id: string;
        trades: TradeRecord[];
        total: number;
        offset: number;
        limit: number;
        aggregates: {
          total_trades: number;
          total_volume_usd: number;
          total_fees_usd: number;
          net_realized_pnl: number;
        };
      };
    },
    enabled: !!user && !!clientId,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}
