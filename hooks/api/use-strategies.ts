import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";
import { SEED_STRATEGIES, type StrategyHealth } from "@/lib/mocks/fixtures/strategies-seed";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { useGlobalScope } from "@/lib/stores/global-scope-store";

export type { PnlDrift, SignalFreshness, ExecutionQuality, StrategyHealth } from "@/lib/mocks/fixtures/strategies-seed";

type BacktestsResponse = GatewayApiResponse<"/api/execution/backtests">;
type GridConfigsResponse = GatewayApiResponse<"/api/execution/grid-configs">;
type PerformanceResponse = GatewayApiResponse<"/api/trading/performance">;
type StrategyConfigsResponse = GatewayApiResponse<"/api/analytics/strategy-configs">;
type StrategiesResponse = GatewayApiResponse<"/api/analytics/strategies">;

function withMode(base: string, mode: string): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}mode=${mode}`;
}

export function useStrategyBacktests() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<BacktestsResponse>({
    queryKey: ["strategy-backtests", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<BacktestsResponse>(
        withMode("/api/execution/backtests", scope.mode),
        token,
      ),
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

  return useQuery<GridConfigsResponse>({
    queryKey: ["grid-configs", user?.id, domain],
    queryFn: () =>
      typedFetch<GridConfigsResponse>(
        `/api/execution/grid-configs${domainParam}`,
        token,
      ),
    enabled: !!user,
  });
}

export function useStrategyPerformance() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<PerformanceResponse>({
    queryKey: ["strategy-performance", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<PerformanceResponse>(
        withMode("/api/trading/performance", scope.mode),
        token,
      ),
    enabled: !!user,
  });
}

export function useStrategyTemplates() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<StrategyConfigsResponse>({
    queryKey: ["strategy-templates", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<StrategyConfigsResponse>(
        withMode("/api/analytics/strategy-configs", scope.mode),
        token,
      ),
    enabled: !!user,
  });
}

export function useStrategyCandidates() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<StrategiesResponse>({
    queryKey: ["strategy-candidates", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<StrategiesResponse>(
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
      apiFetch(
        withMode("/api/analytics/strategy-handoffs", scope.mode),
        token,
      ),
    enabled: !!user,
  });
}

export function useBacktestDetail(id: string) {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery({
    queryKey: ["backtest-detail", id, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(
        withMode(`/api/execution/backtests/${id}`, scope.mode),
        token,
      ),
    enabled: !!user && !!id,
  });
}

export interface StrategyCatalogEntry {
  id: string;
  domain: string;
  family: string;
  label: string;
  params: string[];
}

export interface ExecutionInstruction {
  step: number;
  type: string;
  timestamp: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: string;
}

export interface ExecutionAnalysis {
  execution_id: string;
  strategy_id: string;
  instrument: string;
  instructions: ExecutionInstruction[];
  fills: Record<string, unknown>[];
  summary: {
    total_steps: number;
    all_passed: boolean;
    total_fills: number;
    algo_used: string;
  };
}

interface CatalogResponse {
  strategies: StrategyCatalogEntry[];
  families: Record<string, StrategyCatalogEntry[]>;
  total: number;
}

export function useStrategyCatalog(domain?: string) {
  const { user, token } = useAuth();
  const domainParam = domain ? `?domain=${domain}` : "";

  return useQuery({
    queryKey: ["strategy-catalog", user?.id, domain],
    queryFn: async (): Promise<CatalogResponse> => {
      const raw = await apiFetch(`/api/analytics/strategies/catalog${domainParam}`, token);
      const envelope = raw as Record<string, unknown>;
      return (envelope?.data ?? envelope) as CatalogResponse;
    },
    enabled: !!user,
  });
}

export function useExecutionAnalysis(executionId: string) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["execution-analysis", executionId, user?.id],
    queryFn: async (): Promise<ExecutionAnalysis> => {
      const raw = await apiFetch(`/api/execution/analysis/${executionId}`, token);
      const envelope = raw as Record<string, unknown>;
      return (envelope?.data ?? envelope) as ExecutionAnalysis;
    },
    enabled: !!user && !!executionId,
  });
}

export function useStrategyHealth() {
  const { user, token } = useAuth();
  const isMock = isMockDataMode();

  return useQuery<StrategyHealth[]>({
    queryKey: ["strategy-health", user?.id],
    queryFn: async () => {
      const data = await apiFetch("/api/analytics/strategies/health", token);
      const items = (data as Record<string, unknown>)?.data ?? data;
      if (Array.isArray(items) && items.length > 0) {
        return items as StrategyHealth[];
      }
      // Only fall back to seed data in mock mode; in live mode return empty
      return isMock ? SEED_STRATEGIES : [];
    },
    enabled: !!user,
    placeholderData: isMock ? SEED_STRATEGIES : undefined,
    retry: false,
  });
}
