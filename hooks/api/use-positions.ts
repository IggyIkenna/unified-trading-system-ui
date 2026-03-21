import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import type { ApiResponse } from "@/lib/api/typed-fetch"
import { typedFetch } from "@/lib/api/typed-fetch"

/** Typed response: array of PositionResponse from position-balance-monitor-service. */
type PositionsResponse = ApiResponse<"/positions/active">

type PositionsSummaryResponse = ApiResponse<"/positions/summary">

export function usePositions() {
  const { user, token } = useAuth()

  return useQuery<PositionsResponse>({
    queryKey: ["positions", user?.id],
    queryFn: () => typedFetch<PositionsResponse>("/api/positions/active", token),
    enabled: !!user,
  })
}

export function usePositionsSummary() {
  const { user, token } = useAuth()

  return useQuery<PositionsSummaryResponse>({
    queryKey: ["positions-summary", user?.id],
    queryFn: () => typedFetch<PositionsSummaryResponse>("/api/positions/summary", token),
    enabled: !!user,
  })
}

export function useBalances() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["balances", user?.id],
    queryFn: () => typedFetch<unknown>("/api/positions/balances", token),
    enabled: !!user,
  })
}
