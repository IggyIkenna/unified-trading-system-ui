import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import type { ApiResponse } from "@/lib/api/typed-fetch"
import { typedFetch } from "@/lib/api/typed-fetch"

/** Typed response: map of client_id -> string[] from risk-and-exposure-service. */
type RiskLimitsResponse = ApiResponse<"/risk/limits">

type VaRResponse = ApiResponse<"/risk/var">

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
