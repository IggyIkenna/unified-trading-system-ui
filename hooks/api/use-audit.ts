import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useAuditEvents() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["audit-events", personaId],
    queryFn: () => fetchWithPersona("/api/audit/events", personaId),
    enabled: !!user,
  })
}

export function useComplianceStatus() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["compliance-status", personaId],
    queryFn: () => fetchWithPersona("/api/audit/compliance", personaId),
    enabled: !!user,
  })
}

export function useDataHealth() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["data-health", personaId],
    queryFn: () => fetchWithPersona("/api/audit/data-health", personaId),
    enabled: !!user,
  })
}
