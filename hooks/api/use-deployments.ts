import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useDeploymentServices() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["deployment-services", personaId],
    queryFn: () => fetchWithPersona("/api/deployment/services", personaId),
    enabled: !!user,
  })
}

export function useDeployments() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["deployments", personaId],
    queryFn: () => fetchWithPersona("/api/deployment/deployments", personaId),
    enabled: !!user,
  })
}

export function useBuildTriggers() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["build-triggers", personaId],
    queryFn: () => fetchWithPersona("/api/deployment/builds", personaId),
    enabled: !!user,
  })
}
