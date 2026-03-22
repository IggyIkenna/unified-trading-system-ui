import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useMandates() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["mandates", user?.id],
    queryFn: () => apiFetch("/api/config/mandates", token),
    enabled: !!user,
  })
}

export function useFeeSchedules() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["fee-schedules", user?.id],
    queryFn: () => apiFetch("/api/config/fee-schedules", token),
    enabled: !!user,
  })
}

export function useDocuments() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["documents", user?.id],
    queryFn: () => apiFetch("/api/documents/list", token),
    enabled: !!user,
  })
}

export function useGenerateReport() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      type: string
      client_id?: string
      date_range?: { start: string; end: string }
      format: "pdf" | "csv" | "xlsx"
    }) =>
      apiFetch("/api/reporting/generate", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}

export function useScheduledReports() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["scheduled-reports", user?.id],
    queryFn: () => apiFetch("/api/reporting/schedules", token),
    enabled: !!user,
  })
}
