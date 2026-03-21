import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useReports() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["reports", user?.id],
    queryFn: () => apiFetch("/api/reporting/reports", token),
    enabled: !!user,
  })
}

export function useSettlements() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["settlements", user?.id],
    queryFn: () => apiFetch("/api/reporting/settlements", token),
    enabled: !!user,
  })
}

export function useReconciliation() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["reconciliation", user?.id],
    queryFn: () => apiFetch("/api/reporting/reconciliation", token),
    enabled: !!user,
  })
}
