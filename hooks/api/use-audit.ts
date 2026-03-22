import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useAuditEvents() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["audit-events", user?.id],
    queryFn: () => apiFetch("/api/audit/events", token),
    enabled: !!user,
  })
}

export function useComplianceStatus() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["compliance-status", user?.id],
    queryFn: () => apiFetch("/api/audit/compliance", token),
    enabled: !!user,
  })
}

export function useDataHealth() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["data-health", user?.id],
    queryFn: () => apiFetch("/api/audit/data-health", token),
    enabled: !!user,
  })
}

export function useBatchJobs() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["batch-jobs", user?.id],
    queryFn: () => apiFetch("/api/audit/batch-jobs", token),
    enabled: !!user,
    refetchInterval: 15000, // refresh every 15s for running jobs
  })
}
