import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useStrategyTemplates() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["strategy-templates", user?.id],
    queryFn: () => apiFetch("/api/strategy/templates", token),
    enabled: !!user,
  })
}

export function useStrategyConfigs() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["strategy-configs", user?.id],
    queryFn: () => apiFetch("/api/strategy/configs", token),
    enabled: !!user,
  })
}

export function useBacktests() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["backtests", user?.id],
    queryFn: () => apiFetch("/api/strategy/backtests", token),
    enabled: !!user,
  })
}

export function useStrategyCandidates() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["strategy-candidates", user?.id],
    queryFn: () => apiFetch("/api/strategy/candidates", token),
    enabled: !!user,
  })
}

export function useStrategyAlerts() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["strategy-alerts", user?.id],
    queryFn: () => apiFetch("/api/strategy/alerts", token),
    enabled: !!user,
  })
}
