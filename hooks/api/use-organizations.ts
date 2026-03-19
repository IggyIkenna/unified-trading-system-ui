import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useOrganizationsList() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["user-organizations", personaId],
    queryFn: () => fetchWithPersona("/api/users/organizations", personaId),
    enabled: !!user,
  })
}

export function useOrgMembers(orgId: string) {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["org-members", orgId, personaId],
    queryFn: () => fetchWithPersona(`/api/users/organizations/${orgId}/members`, personaId),
    enabled: !!user && !!orgId,
  })
}

export function useSubscriptions() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["user-subscriptions", personaId],
    queryFn: () => fetchWithPersona("/api/users/subscriptions", personaId),
    enabled: !!user,
  })
}
