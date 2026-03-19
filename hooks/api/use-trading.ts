import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useOrganizations() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["organizations", personaId],
    queryFn: () => fetchWithPersona("/api/trading/organizations", personaId),
    enabled: !!user,
  })
}

export function useTradingClients() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["trading-clients", personaId],
    queryFn: () => fetchWithPersona("/api/trading/clients", personaId),
    enabled: !!user,
  })
}

export function usePnL() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["pnl", personaId],
    queryFn: () => fetchWithPersona("/api/trading/pnl", personaId),
    enabled: !!user,
  })
}

export function usePnLTimeseries() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["pnl-timeseries", personaId],
    queryFn: () => fetchWithPersona("/api/trading/timeseries", personaId),
    enabled: !!user,
  })
}

export function useStrategyPerformance() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["strategy-performance", personaId],
    queryFn: () => fetchWithPersona("/api/trading/performance", personaId),
    enabled: !!user,
  })
}

export function useLiveBatchDelta() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["live-batch-delta", personaId],
    queryFn: () => fetchWithPersona("/api/trading/live-batch-delta", personaId),
    enabled: !!user,
  })
}
