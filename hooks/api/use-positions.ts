import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function usePositions() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["positions", personaId],
    queryFn: () => fetchWithPersona("/api/positions", personaId),
    enabled: !!user,
  })
}

export function usePositionsSummary() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["positions-summary", personaId],
    queryFn: () => fetchWithPersona("/api/positions/summary", personaId),
    enabled: !!user,
  })
}

export function useBalances() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["balances", personaId],
    queryFn: () => fetchWithPersona("/api/positions/balances", personaId),
    enabled: !!user,
  })
}
