import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useRiskLimits() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["risk-limits", personaId],
    queryFn: () => fetchWithPersona("/api/risk/limits", personaId),
    enabled: !!user,
  })
}

export function useVaR() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["var", personaId],
    queryFn: () => fetchWithPersona("/api/risk/var", personaId),
    enabled: !!user,
  })
}

export function useGreeks() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["greeks", personaId],
    queryFn: () => fetchWithPersona("/api/risk/greeks", personaId),
    enabled: !!user,
  })
}

export function useStressScenarios() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["stress-scenarios", personaId],
    queryFn: () => fetchWithPersona("/api/risk/stress", personaId),
    enabled: !!user,
  })
}
