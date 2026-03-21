import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function usePositions() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["positions", user?.id],
    queryFn: () => apiFetch("/api/positions", token),
    enabled: !!user,
  })
}

export function usePositionsSummary() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["positions-summary", user?.id],
    queryFn: () => apiFetch("/api/positions/summary", token),
    enabled: !!user,
  })
}

export function useBalances() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["balances", user?.id],
    queryFn: () => apiFetch("/api/positions/balances", token),
    enabled: !!user,
  })
}
