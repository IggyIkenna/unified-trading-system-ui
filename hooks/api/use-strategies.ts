import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { SEED_STRATEGIES, type StrategyHealth } from "@/lib/mocks/fixtures/strategies-seed";
import { useGlobalScope } from "@/lib/stores/global-scope-store";

export type { PnlDrift, SignalFreshness, ExecutionQuality, StrategyHealth } from "@/lib/mocks/fixtures/strategies-seed";

function withMode(base: string, mode: string): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}mode=${mode}`;
}

export function useStrategyBacktests() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["strategy-backtests", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/execution/backtests", scope.mode), token),
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
    queryFn: () => apiFetch(`/api/execution/grid-configs${domainParam}`, token),
    enabled: !!user,
  });
}

export function useStrategyPerformance() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["strategy-performance", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/trading/performance", scope.mode), token),
    enabled: !!user,
  });
}

export function useStrategyTemplates() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["strategy-templates", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/analytics/strategy-configs", scope.mode), token),
    enabled: !!user,
  });
}

export function useStrategyCandidates() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["strategy-candidates", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/analytics/strategy-candidates", scope.mode), token),
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
    queryFn: () => apiFetch(withMode("/api/analytics/strategy-handoffs", scope.mode), token),
    enabled: !!user,
  });
}

export function useBacktestDetail(id: string) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["backtest-detail", id, user?.id, scope.mode],
    queryFn: () => apiFetch(withMode(`/api/execution/backtests/${id}`, scope.mode), token),
    enabled: !!user && !!id,
  });
}

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
