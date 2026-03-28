import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { useGlobalScope } from "@/lib/stores/global-scope-store";

function withMode(base: string, mode: string): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}mode=${mode}`;
}

export function useStrategyBacktests() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["strategy-backtests", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/execution/backtests", scope.mode), token),
    enabled: !!user,
  });
}

export function useCreateBacktest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/api/execution/backtests", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategy-backtests"] });
    },
  });
}

export function useGridConfigs(domain?: string) {
  const { user, token } = useAuth();
  const domainParam = domain ? `?domain=${domain}` : "";

  return useQuery({
    queryKey: ["grid-configs", user?.id, domain],
    queryFn: () =>
      apiFetch(`/api/execution/grid-configs${domainParam}`, token),
    enabled: !!user,
  });
}

export function useStrategyPerformance() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["strategy-performance", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/trading/performance", scope.mode), token),
    enabled: !!user,
  });
}

export function useStrategyTemplates() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["strategy-templates", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/analytics/strategy-configs", scope.mode), token),
    enabled: !!user,
  });
}

export function useStrategyCandidates() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["strategy-candidates", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(
        withMode("/api/analytics/strategy-candidates", scope.mode),
        token,
      ),
    enabled: !!user,
  });
}

export function usePromoteStrategy() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/analytics/strategies/${id}/promote`, token, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategy-candidates"] });
    },
  });
}

export function useRejectStrategy() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/analytics/strategies/${id}/reject`, token, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategy-candidates"] });
    },
  });
}

export function useStrategyHandoffs() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["strategy-handoffs", user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode("/api/analytics/strategy-handoffs", scope.mode), token),
    enabled: !!user,
  });
}

export function useBacktestDetail(id: string) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["backtest-detail", id, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(withMode(`/api/execution/backtests/${id}`, scope.mode), token),
    enabled: !!user && !!id,
  });
}

export type PnlDrift = "on_track" | "drifting" | "off_track";
export type SignalFreshness = "fresh" | "stale" | "expired";
export type ExecutionQuality = "normal" | "degraded" | "poor";

export interface StrategyHealth {
  id: string;
  name: string;
  assetClass: string;
  healthScore: number;
  pnlDrift: PnlDrift;
  signalFreshness: SignalFreshness;
  executionQuality: ExecutionQuality;
  drawdownPct: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  pnlToday: number;
  status: "live" | "paper" | "paused";
}

const SEED_STRATEGIES: StrategyHealth[] = [
  {
    id: "s-1",
    name: "BTC Momentum Alpha",
    assetClass: "Crypto",
    healthScore: 92,
    pnlDrift: "on_track",
    signalFreshness: "fresh",
    executionQuality: "normal",
    drawdownPct: 2.1,
    maxDrawdownPct: 15,
    sharpeRatio: 2.4,
    pnlToday: 14200,
    status: "live",
  },
  {
    id: "s-2",
    name: "ETH Basis Arb",
    assetClass: "Crypto",
    healthScore: 87,
    pnlDrift: "on_track",
    signalFreshness: "fresh",
    executionQuality: "normal",
    drawdownPct: 1.3,
    maxDrawdownPct: 10,
    sharpeRatio: 3.1,
    pnlToday: 8700,
    status: "live",
  },
  {
    id: "s-3",
    name: "Macro Rates RV",
    assetClass: "Fixed Income",
    healthScore: 74,
    pnlDrift: "drifting",
    signalFreshness: "fresh",
    executionQuality: "degraded",
    drawdownPct: 5.8,
    maxDrawdownPct: 12,
    sharpeRatio: 1.6,
    pnlToday: -3200,
    status: "live",
  },
  {
    id: "s-4",
    name: "DeFi Yield Harvest",
    assetClass: "DeFi",
    healthScore: 68,
    pnlDrift: "drifting",
    signalFreshness: "stale",
    executionQuality: "normal",
    drawdownPct: 7.2,
    maxDrawdownPct: 20,
    sharpeRatio: 1.2,
    pnlToday: -1800,
    status: "live",
  },
  {
    id: "s-5",
    name: "SOL Breakout v2",
    assetClass: "Crypto",
    healthScore: 45,
    pnlDrift: "off_track",
    signalFreshness: "stale",
    executionQuality: "degraded",
    drawdownPct: 11.4,
    maxDrawdownPct: 15,
    sharpeRatio: 0.7,
    pnlToday: -9600,
    status: "live",
  },
  {
    id: "s-6",
    name: "Equity Stat Arb",
    assetClass: "Equities",
    healthScore: 83,
    pnlDrift: "on_track",
    signalFreshness: "fresh",
    executionQuality: "normal",
    drawdownPct: 3.1,
    maxDrawdownPct: 10,
    sharpeRatio: 2.0,
    pnlToday: 5400,
    status: "live",
  },
  {
    id: "s-7",
    name: "FX Carry Trade",
    assetClass: "FX",
    healthScore: 56,
    pnlDrift: "drifting",
    signalFreshness: "fresh",
    executionQuality: "poor",
    drawdownPct: 8.9,
    maxDrawdownPct: 12,
    sharpeRatio: 0.9,
    pnlToday: -4100,
    status: "live",
  },
  {
    id: "s-8",
    name: "Sports Value Betting",
    assetClass: "Sports",
    healthScore: 91,
    pnlDrift: "on_track",
    signalFreshness: "fresh",
    executionQuality: "normal",
    drawdownPct: 1.8,
    maxDrawdownPct: 8,
    sharpeRatio: 2.8,
    pnlToday: 6300,
    status: "live",
  },
  {
    id: "s-9",
    name: "Aave Flash Loan Arb",
    assetClass: "DeFi",
    healthScore: 35,
    pnlDrift: "off_track",
    signalFreshness: "expired",
    executionQuality: "poor",
    drawdownPct: 14.2,
    maxDrawdownPct: 20,
    sharpeRatio: 0.3,
    pnlToday: -12400,
    status: "paused",
  },
  {
    id: "s-10",
    name: "BTC Mean Reversion",
    assetClass: "Crypto",
    healthScore: 78,
    pnlDrift: "on_track",
    signalFreshness: "fresh",
    executionQuality: "normal",
    drawdownPct: 4.5,
    maxDrawdownPct: 12,
    sharpeRatio: 1.8,
    pnlToday: 2900,
    status: "paper",
  },
  {
    id: "s-11",
    name: "Cross-Exchange Spread",
    assetClass: "Crypto",
    healthScore: 62,
    pnlDrift: "drifting",
    signalFreshness: "stale",
    executionQuality: "degraded",
    drawdownPct: 6.7,
    maxDrawdownPct: 15,
    sharpeRatio: 1.1,
    pnlToday: -2200,
    status: "live",
  },
  {
    id: "s-12",
    name: "Commodity Trend",
    assetClass: "Commodities",
    healthScore: 85,
    pnlDrift: "on_track",
    signalFreshness: "fresh",
    executionQuality: "normal",
    drawdownPct: 2.9,
    maxDrawdownPct: 10,
    sharpeRatio: 2.2,
    pnlToday: 7800,
    status: "live",
  },
];

export function useStrategyHealth() {
  const { user, token } = useAuth();

  return useQuery<StrategyHealth[]>({
    queryKey: ["strategy-health", user?.id],
    queryFn: async () => {
      const data = await apiFetch("/api/analytics/strategies/health", token);
      const items = (data as Record<string, unknown>)?.data ?? data;
      if (Array.isArray(items) && items.length > 0) {
        return items as StrategyHealth[];
      }
      return SEED_STRATEGIES;
    },
    enabled: !!user,
    placeholderData: SEED_STRATEGIES,
    retry: false,
  });
}
