import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "x-demo-persona": personaId, ...options?.headers },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useAlerts() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["alerts", personaId],
    queryFn: () => fetchWithPersona("/api/alerts", personaId),
    enabled: !!user,
  })
}

export function useAlertsSummary() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["alerts-summary", personaId],
    queryFn: () => fetchWithPersona("/api/alerts/summary", personaId),
    enabled: !!user,
  })
}

export function useAcknowledgeAlert() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) =>
      fetchWithPersona(`/api/alerts/${alertId}/acknowledge`, personaId, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["alerts-summary"] })
    },
  })
}

export function useResolveAlert() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) =>
      fetchWithPersona(`/api/alerts/${alertId}/resolve`, personaId, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["alerts-summary"] })
    },
  })
}
