import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useServiceOverview() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["service-overview", user?.id],
    queryFn: () => apiFetch("/api/service-status/overview", token),
    enabled: !!user,
    refetchInterval: 30000, // refresh every 30s for health monitoring
  })
}

export function useFeatureFreshness() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["feature-freshness", user?.id],
    queryFn: () => apiFetch("/api/service-status/features", token),
    enabled: !!user,
  })
}
