import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";
import { withMode } from "@/lib/api/with-mode";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";

// Generated response types for endpoints that exist in api-generated.ts
type RiskLimitsResponse = GatewayApiResponse<"/api/risk/limits">;
type VaRResponse = GatewayApiResponse<"/api/risk/var">;
type GreeksResponse = GatewayApiResponse<"/api/risk/greeks">;
type StressScenariosResponse = GatewayApiResponse<"/api/risk/stress">;

// Exported aliases consumed by risk-data-context.tsx and other widgets
export type VarSummaryData = GatewayApiResponse<"/api/risk/var-summary">;
export type StressTestResult = GatewayApiResponse<"/api/risk/stress-test">;
export type RegimeData = GatewayApiResponse<"/api/risk/regime">;
export type CorrelationMatrixResponse = GatewayApiResponse<"/api/risk/correlation-matrix">;

// =============================================================================
// QUERY HOOKS
// =============================================================================

export function useRiskLimits() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<RiskLimitsResponse>({
    queryKey: ["risk-limits", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<RiskLimitsResponse>(withMode("/api/risk/limits", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useVaR() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<VaRResponse>({
    queryKey: ["var", user?.id, scope.mode],
    queryFn: () => typedFetch<VaRResponse>(withMode("/api/risk/var", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useGreeks() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<GreeksResponse>({
    queryKey: ["greeks", user?.id, scope.mode],
    queryFn: () => typedFetch<GreeksResponse>(withMode("/api/risk/greeks", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useStressScenarios() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<StressScenariosResponse>({
    queryKey: ["stress-scenarios", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<StressScenariosResponse>(withMode("/api/risk/stress", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

// =============================================================================
// VAR SUMMARY
// =============================================================================

export function useVarSummary() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<VarSummaryData>({
    queryKey: ["var-summary", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<VarSummaryData>(withMode("/api/risk/var-summary", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

// =============================================================================
// STRESS TEST (on-demand scenario)
// =============================================================================

export function useStressTest(scenario: string | null) {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<StressTestResult>({
    queryKey: ["stress-test", scenario, user?.id, scope.mode],
    queryFn: () =>
      typedFetch<StressTestResult>(
        withMode(`/api/risk/stress-test?scenario=${scenario}`, scope.mode, scope.asOfTs ?? undefined),
        token,
      ),
    enabled: !!user && !!scenario,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

// =============================================================================
// REGIME INDICATOR
// =============================================================================

export function useRegime() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<RegimeData>({
    queryKey: ["risk-regime", user?.id, scope.mode],
    queryFn: () => typedFetch<RegimeData>(withMode("/api/risk/regime", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

// =============================================================================
// PORTFOLIO GREEKS (derivatives — no generated path, keep local types)
// =============================================================================

export interface GreekValues {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export interface UnderlyingGreeks {
  underlying: string;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export interface PortfolioGreeksResponse {
  portfolio: GreekValues;
  per_underlying: UnderlyingGreeks[];
}

export function usePortfolioGreeks() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<PortfolioGreeksResponse>({
    queryKey: ["portfolio-greeks", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<PortfolioGreeksResponse>(
        withMode("/api/derivatives/portfolio-greeks", scope.mode, scope.asOfTs ?? undefined),
        token,
      ),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

// =============================================================================
// CORRELATION MATRIX
// =============================================================================

export function useCorrelationMatrix() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<CorrelationMatrixResponse>({
    queryKey: ["correlation-matrix", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<CorrelationMatrixResponse>(
        withMode("/api/risk/correlation-matrix", scope.mode, scope.asOfTs ?? undefined),
        token,
      ),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

// =============================================================================
// VENUE CIRCUIT BREAKER STATUS (no generated path, keep local type)
// =============================================================================

export interface VenueCircuitBreakerStatus {
  venue: string;
  status: "CLOSED" | "HALF_OPEN" | "OPEN";
  strategy_id: string;
  kill_switch_active: boolean;
}

export function useVenueCircuitBreakers() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<VenueCircuitBreakerStatus[]>({
    queryKey: ["venue-circuit-breakers", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<VenueCircuitBreakerStatus[]>(
        withMode("/api/risk/venue-circuit-breakers", scope.mode, scope.asOfTs ?? undefined),
        token,
      ),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

// =============================================================================
// MUTATION HOOKS (POST — keep apiFetch, no generated GET type)
// =============================================================================

export interface CircuitBreakerParams {
  strategy_id: string;
  action: "trip" | "reset";
}

export function useCircuitBreakerMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CircuitBreakerParams) =>
      apiFetch("/api/risk/circuit-breaker", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-limits"] });
      queryClient.invalidateQueries({ queryKey: ["venue-circuit-breakers"] });
      queryClient.invalidateQueries({ queryKey: ["stress-scenarios"] });
    },
  });
}

export interface KillSwitchParams {
  scope: "strategy";
  target_id: string;
}

export function useKillSwitchMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: KillSwitchParams) =>
      apiFetch("/api/risk/kill-switch", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-limits"] });
      queryClient.invalidateQueries({ queryKey: ["venue-circuit-breakers"] });
    },
  });
}

export interface ScaleDownParams {
  scale_factor: number;
}

export function useScaleDownMutation(strategyId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ScaleDownParams) =>
      apiFetch(`/api/analytics/strategies/${strategyId}/scale`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-limits"] });
    },
  });
}
