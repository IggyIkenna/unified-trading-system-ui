import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useTradingOrgs() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["trading-organizations", user?.id],
    queryFn: () => apiFetch("/api/users/organizations", token),
    enabled: !!user,
  })
}

export function useTradingPnl() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["pnl", user?.id],
    queryFn: () => apiFetch("/api/analytics/pnl", token),
    enabled: !!user,
  })
}

export function useTradingTimeseries() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["pnl-timeseries", user?.id],
    queryFn: () => apiFetch("/api/analytics/timeseries", token),
    enabled: !!user,
  })
}

export function useTradingPerformance() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["trading-performance", user?.id],
    queryFn: () => apiFetch("/api/analytics/performance", token),
    enabled: !!user,
  })
}
