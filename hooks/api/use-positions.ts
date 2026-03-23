import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function usePositions(mode?: string, asOf?: string) {
  const { user, token } = useAuth()
  const params = new URLSearchParams()
  if (mode) params.set("mode", mode)
  if (asOf) params.set("as_of", asOf)
  const qs = params.toString()

  return useQuery({
    queryKey: ["positions", mode, asOf, user?.id],
    queryFn: () => apiFetch(`/api/positions/active${qs ? `?${qs}` : ""}`, token),
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
