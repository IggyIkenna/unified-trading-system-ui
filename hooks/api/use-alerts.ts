import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import type { ApiResponse } from "@/lib/api/typed-fetch"
import { typedFetch } from "@/lib/api/typed-fetch"

/** Typed response: array of alert objects from client-reporting-api. */
type AlertsResponse = ApiResponse<"/client-reporting-api/alerts">

export function useAlerts() {
  const { user, token } = useAuth()

  return useQuery<AlertsResponse>({
    queryKey: ["alerts", user?.id],
    queryFn: () => typedFetch<AlertsResponse>("/api/alerts", token),
    enabled: !!user,
  })
}

export function useAlertsSummary() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["alerts-summary", user?.id],
    queryFn: () => typedFetch<unknown>("/api/alerts/summary", token),
    enabled: !!user,
  })
}

export function useAcknowledgeAlert() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) =>
      typedFetch<unknown>(`/api/alerts/${alertId}/acknowledge`, token, { method: "PATCH" }),
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
      typedFetch<unknown>(`/api/alerts/${alertId}/resolve`, token, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["alerts-summary"] })
    },
  })
}
