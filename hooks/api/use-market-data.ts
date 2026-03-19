import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

async function fetchWithPersona(url: string, personaId: string) {
  const res = await fetch(url, { headers: { "x-demo-persona": personaId } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useCandles(symbol: string, timeframe = "1H", count = 100) {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["candles", symbol, timeframe, count, personaId],
    queryFn: () =>
      fetchWithPersona(
        `/api/market-data/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&count=${count}`,
        personaId
      ),
    enabled: !!user && !!symbol,
  })
}

export function useOrderBook(symbol: string) {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["orderbook", symbol, personaId],
    queryFn: () =>
      fetchWithPersona(`/api/market-data/orderbook?symbol=${encodeURIComponent(symbol)}`, personaId),
    enabled: !!user && !!symbol,
    refetchInterval: 5000, // refresh every 5s for semi-live feel
  })
}

export function useTrades(symbol: string) {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["trades", symbol, personaId],
    queryFn: () =>
      fetchWithPersona(`/api/market-data/trades?symbol=${encodeURIComponent(symbol)}`, personaId),
    enabled: !!user && !!symbol,
    refetchInterval: 3000,
  })
}

export function useTickers() {
  const { user } = useAuth()
  const personaId = user?.id ?? "internal-trader"

  return useQuery({
    queryKey: ["tickers", personaId],
    queryFn: () => fetchWithPersona("/api/market-data/tickers", personaId),
    enabled: !!user,
    refetchInterval: 10000,
  })
}
