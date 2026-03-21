import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useAlerts() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["alerts", user?.id],
    queryFn: () => apiFetch("/api/alerts", token),
    enabled: !!user,
  })
}

export function useAlertsSummary() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["alerts-summary", user?.id],
    queryFn: () => apiFetch("/api/alerts/summary", token),
    enabled: !!user,
  })
}

export function useAcknowledgeAlert() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch(`/api/alerts/${alertId}/acknowledge`, token, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["alerts-summary"] })
    },
  })
}

export function useResolveAlert() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch(`/api/alerts/${alertId}/resolve`, token, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["alerts-summary"] })
    },
  })
}
