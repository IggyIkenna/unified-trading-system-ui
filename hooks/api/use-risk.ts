import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import type { ApiResponse } from "@/lib/api/typed-fetch"
import { typedFetch } from "@/lib/api/typed-fetch"
import { apiFetch } from "@/lib/api/fetch"

/** Typed response: map of client_id -> string[] from risk-and-exposure-service. */
type RiskLimitsResponse = ApiResponse<"/risk/limits">

type VaRResponse = ApiResponse<"/risk/var">

// =============================================================================
// QUERY HOOKS
// =============================================================================

export function useRiskLimits() {
  const { user, token } = useAuth()

  return useQuery<RiskLimitsResponse>({
    queryKey: ["risk-limits", user?.id],
    queryFn: () => typedFetch<RiskLimitsResponse>("/api/risk/limits", token),
    enabled: !!user,
  })
}

export function useVaR() {
  const { user, token } = useAuth()

  return useQuery<VaRResponse>({
    queryKey: ["var", user?.id],
    queryFn: () => typedFetch<VaRResponse>("/api/risk/var", token),
    enabled: !!user,
  })
}

export function useGreeks() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["greeks", user?.id],
    queryFn: () => typedFetch<unknown>("/api/risk/greeks", token),
    enabled: !!user,
  })
}

export function useStressScenarios() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["stress-scenarios", user?.id],
    queryFn: () => typedFetch<unknown>("/api/risk/stress", token),
    enabled: !!user,
  })
}

// =============================================================================
// VAR SUMMARY
// =============================================================================

export interface VarSummaryData {
  historical_var_99: number
  parametric_var_99: number
  cvar_99: number
  monte_carlo_var_99: number
}

export function useVarSummary() {
  const { user, token } = useAuth()

  return useQuery<VarSummaryData>({
    queryKey: ["var-summary", user?.id],
    queryFn: () => apiFetch("/api/risk/var-summary", token) as Promise<VarSummaryData>,
    enabled: !!user,
  })
}

// =============================================================================
// STRESS TEST (on-demand scenario)
// =============================================================================

export interface StressTestResult {
  expected_loss_usd: number
  portfolio_impact_pct: number
  worst_strategy: string
}

export function useStressTest(scenario: string | null) {
  const { user, token } = useAuth()

  return useQuery<StressTestResult>({
    queryKey: ["stress-test", scenario, user?.id],
    queryFn: () =>
      apiFetch(`/api/risk/stress-test?scenario=${scenario}`, token) as Promise<StressTestResult>,
    enabled: !!user && !!scenario,
  })
}

// =============================================================================
// REGIME INDICATOR
// =============================================================================

export interface RegimeData {
  regime: "normal" | "stressed" | "crisis"
}

export function useRegime() {
  const { user, token } = useAuth()

  return useQuery<RegimeData>({
    queryKey: ["risk-regime", user?.id],
    queryFn: () => apiFetch("/api/risk/regime", token) as Promise<RegimeData>,
    enabled: !!user,
  })
}

// =============================================================================
// PORTFOLIO GREEKS (derivatives)
// =============================================================================

export interface GreekValues {
  delta: number
  gamma: number
  vega: number
  theta: number
  rho: number
}

export interface UnderlyingGreeks {
  underlying: string
  delta: number
  gamma: number
  vega: number
  theta: number
  rho: number
}

export interface PortfolioGreeksResponse {
  portfolio: GreekValues
  per_underlying: UnderlyingGreeks[]
}

export function usePortfolioGreeks() {
  const { user, token } = useAuth()

  return useQuery<PortfolioGreeksResponse>({
    queryKey: ["portfolio-greeks", user?.id],
    queryFn: () =>
      apiFetch("/api/derivatives/portfolio-greeks", token) as Promise<PortfolioGreeksResponse>,
    enabled: !!user,
  })
}

// =============================================================================
// CORRELATION MATRIX
// =============================================================================

export interface CorrelationMatrixResponse {
  labels: string[]
  matrix: number[][]
}

export function useCorrelationMatrix() {
  const { user, token } = useAuth()

  return useQuery<CorrelationMatrixResponse>({
    queryKey: ["correlation-matrix", user?.id],
    queryFn: () =>
      apiFetch("/api/risk/correlation-matrix", token) as Promise<CorrelationMatrixResponse>,
    enabled: !!user,
  })
}

// =============================================================================
// VENUE CIRCUIT BREAKER STATUS
// =============================================================================

export interface VenueCircuitBreakerStatus {
  venue: string
  status: "CLOSED" | "HALF_OPEN" | "OPEN"
  strategy_id: string
  kill_switch_active: boolean
}

export function useVenueCircuitBreakers() {
  const { user, token } = useAuth()

  return useQuery<VenueCircuitBreakerStatus[]>({
    queryKey: ["venue-circuit-breakers", user?.id],
    queryFn: () =>
      apiFetch("/api/risk/venue-circuit-breakers", token) as Promise<VenueCircuitBreakerStatus[]>,
    enabled: !!user,
  })
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

export interface CircuitBreakerParams {
  strategy_id: string
  action: "trip" | "reset"
}

export function useCircuitBreakerMutation() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CircuitBreakerParams) =>
      apiFetch("/api/risk/circuit-breaker", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-limits"] })
      queryClient.invalidateQueries({ queryKey: ["venue-circuit-breakers"] })
      queryClient.invalidateQueries({ queryKey: ["stress-scenarios"] })
    },
  })
}

export interface KillSwitchParams {
  scope: "strategy"
  target_id: string
}

export function useKillSwitchMutation() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: KillSwitchParams) =>
      apiFetch("/api/risk/kill-switch", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-limits"] })
      queryClient.invalidateQueries({ queryKey: ["venue-circuit-breakers"] })
    },
  })
}

export interface ScaleDownParams {
  scale_factor: number
}

export function useScaleDownMutation(strategyId: string) {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: ScaleDownParams) =>
      apiFetch(`/api/analytics/strategies/${strategyId}/scale`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-limits"] })
    },
  })
}
