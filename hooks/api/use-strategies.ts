import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useStrategyTemplates() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["strategy-templates", personaId],
    queryFn: () => fetchWithPersona("/api/strategy/templates", personaId),
    enabled: !!user,
  })
}

export function useStrategyConfigs() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["strategy-configs", personaId],
    queryFn: () => fetchWithPersona("/api/strategy/configs", personaId),
    enabled: !!user,
  })
}

export function useBacktests() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["backtests", personaId],
    queryFn: () => fetchWithPersona("/api/strategy/backtests", personaId),
    enabled: !!user,
  })
}

export function useStrategyCandidates() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["strategy-candidates", personaId],
    queryFn: () => fetchWithPersona("/api/strategy/candidates", personaId),
    enabled: !!user,
  })
}

export function useStrategyAlerts() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["strategy-alerts", personaId],
    queryFn: () => fetchWithPersona("/api/strategy/alerts", personaId),
    enabled: !!user,
  })
}
