import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useOrganizations() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["organizations", user?.id],
    queryFn: () => apiFetch("/api/trading/organizations", token),
    enabled: !!user,
  })
}

export function useTradingClients() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["trading-clients", user?.id],
    queryFn: () => apiFetch("/api/trading/clients", token),
    enabled: !!user,
  })
}

export function usePnL() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["pnl", user?.id],
    queryFn: () => apiFetch("/api/trading/pnl", token),
    enabled: !!user,
  })
}

export function usePnLTimeseries() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["pnl-timeseries", user?.id],
    queryFn: () => apiFetch("/api/trading/timeseries", token),
    enabled: !!user,
  })
}

export function useStrategyPerformance() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["strategy-performance", user?.id],
    queryFn: () => apiFetch("/api/trading/performance", token),
    enabled: !!user,
  })
}

export function useLiveBatchDelta() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["live-batch-delta", user?.id],
    queryFn: () => apiFetch("/api/trading/live-batch-delta", token),
    enabled: !!user,
  })
}
