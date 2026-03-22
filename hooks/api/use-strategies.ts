import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useStrategyBacktests() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["strategy-backtests", user?.id],
    queryFn: () => apiFetch("/api/execution/backtests", token),
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
