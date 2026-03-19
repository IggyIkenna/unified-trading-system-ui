import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useServiceOverview() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["service-overview", personaId],
    queryFn: () => fetchWithPersona("/api/service-status/overview", personaId),
    enabled: !!user,
    refetchInterval: 30000, // refresh every 30s for health monitoring
  })
}

export function useFeatureFreshness() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["feature-freshness", personaId],
    queryFn: () => fetchWithPersona("/api/service-status/features", personaId),
    enabled: !!user,
  })
}
