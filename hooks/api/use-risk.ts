import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useRiskLimits() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["risk-limits", user?.id],
    queryFn: () => apiFetch("/api/risk/limits", token),
    enabled: !!user,
  })
}

export function useVaR() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["var", user?.id],
    queryFn: () => apiFetch("/api/risk/var", token),
    enabled: !!user,
  })
}

export function useGreeks() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["greeks", user?.id],
    queryFn: () => apiFetch("/api/risk/greeks", token),
    enabled: !!user,
  })
}

export function useStressScenarios() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["stress-scenarios", user?.id],
    queryFn: () => apiFetch("/api/risk/stress", token),
    enabled: !!user,
  })
}
