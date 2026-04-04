import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";

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

  return useQuery<RiskLimitsResponse>({
    queryKey: ["risk-limits", user?.id],
    queryFn: () =>
      typedFetch<RiskLimitsResponse>("/api/risk/limits", token),
    enabled: !!user,
  });
}

export function useVaR() {
  const { user, token } = useAuth();

  return useQuery<VaRResponse>({
    queryKey: ["var", user?.id],
    queryFn: () => typedFetch<VaRResponse>("/api/risk/var", token),
    enabled: !!user,
  });
}

export function useGreeks() {
  const { user, token } = useAuth();

  return useQuery<GreeksResponse>({
    queryKey: ["greeks", user?.id],
    queryFn: () => typedFetch<GreeksResponse>("/api/risk/greeks", token),
    enabled: !!user,
  });
}

export function useStressScenarios() {
  const { user, token } = useAuth();

  return useQuery<StressScenariosResponse>({
    queryKey: ["stress-scenarios", user?.id],
    queryFn: () =>
      typedFetch<StressScenariosResponse>("/api/risk/stress", token),
    enabled: !!user,
  });
}

// =============================================================================
// VAR SUMMARY
// =============================================================================

export function useVarSummary() {
  const { user, token } = useAuth();

  return useQuery<VarSummaryData>({
    queryKey: ["var-summary", user?.id],
    queryFn: () =>
      typedFetch<VarSummaryData>("/api/risk/var-summary", token),
    enabled: !!user,
  });
}

// =============================================================================
// STRESS TEST (on-demand scenario)
// =============================================================================

export function useStressTest(scenario: string | null) {
  const { user, token } = useAuth();

  return useQuery<StressTestResult>({
    queryKey: ["stress-test", scenario, user?.id],
    queryFn: () =>
      typedFetch<StressTestResult>(
        `/api/risk/stress-test?scenario=${scenario}`,
        token,
      ),
    enabled: !!user && !!scenario,
  });
}

// =============================================================================
// REGIME INDICATOR
// =============================================================================

export function useRegime() {
  const { user, token } = useAuth();

  return useQuery<RegimeData>({
    queryKey: ["risk-regime", user?.id],
    queryFn: () => typedFetch<RegimeData>("/api/risk/regime", token),
    enabled: !!user,
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

  return useQuery<PortfolioGreeksResponse>({
    queryKey: ["portfolio-greeks", user?.id],
    queryFn: () =>
      typedFetch<PortfolioGreeksResponse>(
        "/api/derivatives/portfolio-greeks",
        token,
      ),
    enabled: !!user,
  });
}

// =============================================================================
// CORRELATION MATRIX
// =============================================================================

export function useCorrelationMatrix() {
  const { user, token } = useAuth();

  return useQuery<CorrelationMatrixResponse>({
    queryKey: ["correlation-matrix", user?.id],
    queryFn: () =>
      typedFetch<CorrelationMatrixResponse>(
        "/api/risk/correlation-matrix",
        token,
      ),
    enabled: !!user,
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

  return useQuery<VenueCircuitBreakerStatus[]>({
    queryKey: ["venue-circuit-breakers", user?.id],
    queryFn: () =>
      typedFetch<VenueCircuitBreakerStatus[]>(
        "/api/risk/venue-circuit-breakers",
        token,
      ),
    enabled: !!user,
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
