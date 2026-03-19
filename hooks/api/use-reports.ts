import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useReports() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["reports", personaId],
    queryFn: () => fetchWithPersona("/api/reporting/reports", personaId),
    enabled: !!user,
  })
}

export function useSettlements() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["settlements", personaId],
    queryFn: () => fetchWithPersona("/api/reporting/settlements", personaId),
    enabled: !!user,
  })
}

export function useReconciliation() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["reconciliation", personaId],
    queryFn: () => fetchWithPersona("/api/reporting/reconciliation", personaId),
    enabled: !!user,
  })
}
