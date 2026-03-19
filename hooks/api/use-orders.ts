import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useOrders() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["orders", personaId],
    queryFn: () => fetchWithPersona("/api/execution/orders", personaId),
    enabled: !!user,
  })
}

export function useAlgos() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["algos", personaId],
    queryFn: () => fetchWithPersona("/api/execution/algos", personaId),
    enabled: !!user,
  })
}

export function useVenues() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["execution-venues", personaId],
    queryFn: () => fetchWithPersona("/api/execution/venues", personaId),
    enabled: !!user,
  })
}

export function useAlgoBacktests() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["algo-backtests", personaId],
    queryFn: () => fetchWithPersona("/api/execution/algo-backtests", personaId),
    enabled: !!user,
  })
}
