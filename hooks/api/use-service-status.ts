import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useServiceHealth() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["service-health", user?.id],
    queryFn: () => apiFetch("/api/service-status/health", token),
    enabled: !!user,
    refetchInterval: 30000, // refresh every 30s for health monitoring
  })
}

export function useFeatureFreshness() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["feature-freshness", user?.id],
    queryFn: () => apiFetch("/api/service-status/feature-freshness", token),
    enabled: !!user,
  })
}

export function useServiceActivity() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["service-activity", user?.id],
    queryFn: () => apiFetch("/api/service-status/activity", token),
    enabled: !!user,
    refetchInterval: 30000,
  })
}

export function useServicesList() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["services-list", user?.id],
    queryFn: () => apiFetch("/api/service-status/services", token),
    enabled: !!user,
    refetchInterval: 30000,
  })
}
