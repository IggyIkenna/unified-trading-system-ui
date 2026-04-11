import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import type { PerformanceSummary } from "@/lib/mocks/fixtures/client-performance";
import {
  getMockPerformanceSummary,
  MOCK_CLIENTS,
  MOCK_COIN_BREAKDOWN,
  MOCK_POSITIONS,
  MOCK_TRADES,
  MOCK_BALANCE_BREAKDOWN,
  type ClientInfo,
  type PositionRecord,
  type CoinBreakdown,
  type TradeRecord,
  type BalanceBreakdown,
} from "@/lib/mocks/fixtures/client-performance";

const isMock = process.env.NEXT_PUBLIC_MOCK_API === "true";

export function useClients() {
  const { user, token } = useAuth();

  return useQuery<ClientInfo[]>({
    queryKey: ["client-reporting-clients", user?.id],
    queryFn: async () => {
      if (isMock) return MOCK_CLIENTS;
      const data = await apiFetch("/api/reporting/clients", token);
      return data as ClientInfo[];
    },
    enabled: !!user,
  });
}

export function usePerformanceSummary(clientId: string | null) {
  const { user, token } = useAuth();

  return useQuery<PerformanceSummary>({
    queryKey: ["performance-summary", clientId, user?.id],
    queryFn: async () => {
      if (isMock) return getMockPerformanceSummary(clientId!);
      const data = await apiFetch(`/api/reporting/performance/summary?client_id=${clientId}`, token);
      return data as PerformanceSummary;
    },
    enabled: !!user && !!clientId,
  });
}

export function useOpenPositions(clientId: string | null) {
  const { user, token } = useAuth();

  return useQuery<{ client_id: string; positions: PositionRecord[] }>({
    queryKey: ["open-positions", clientId, user?.id],
    queryFn: async () => {
      if (isMock) return { client_id: clientId!, positions: MOCK_POSITIONS };
      const data = await apiFetch(`/api/reporting/performance/positions?client_id=${clientId}`, token);
      return data as { client_id: string; positions: PositionRecord[] };
    },
    enabled: !!user && !!clientId,
  });
}

export function useCoinBreakdown(clientId: string | null) {
  const { user, token } = useAuth();

  return useQuery<{ client_id: string; coins: CoinBreakdown[] }>({
    queryKey: ["coin-breakdown", clientId, user?.id],
    queryFn: async () => {
      if (isMock) return { client_id: clientId!, coins: MOCK_COIN_BREAKDOWN };
      const data = await apiFetch(`/api/reporting/performance/coin-breakdown?client_id=${clientId}`, token);
      return data as { client_id: string; coins: CoinBreakdown[] };
    },
    enabled: !!user && !!clientId,
  });
}

export function useBalanceBreakdown(clientId: string | null) {
  const { user, token } = useAuth();

  return useQuery<{ client_id: string } & BalanceBreakdown>({
    queryKey: ["balance-breakdown", clientId, user?.id],
    queryFn: async () => {
      if (isMock) return { client_id: clientId!, ...MOCK_BALANCE_BREAKDOWN };
      const data = await apiFetch(`/api/reporting/performance/balances?client_id=${clientId}`, token);
      return data as { client_id: string } & BalanceBreakdown;
    },
    enabled: !!user && !!clientId,
  });
}

export function useTradeHistory(clientId: string | null, params?: { symbol?: string; side?: string; limit?: number; offset?: number }) {
  const { user, token } = useAuth();
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
    queryKey: ["trade-history", clientId, params?.symbol, params?.side, limit, offset, user?.id],
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
      const data = await apiFetch(`/api/reporting/trades?${qs.toString()}`, token);
      return data as ReturnType<typeof useTradeHistory> extends { data: infer T } ? T : never;
    },
    enabled: !!user && !!clientId,
  });
}
