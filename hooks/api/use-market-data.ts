import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useCandles(venue: string, instrument: string, timeframe = "1H", count = 100, mode?: string, asOf?: string) {
  const { user, token } = useAuth()
  const params = new URLSearchParams({
    venue, instrument, timeframe, count: String(count),
  })
  if (mode) params.set("mode", mode)
  if (asOf) params.set("as_of", asOf)

  return useQuery({
    queryKey: ["candles", venue, instrument, timeframe, count, mode, asOf, user?.id],
    queryFn: () => apiFetch(`/api/market-data/candles?${params.toString()}`, token),
    enabled: !!user && !!venue && !!instrument,
  })
}

export function useOrderBook(venue: string, instrument: string, mode?: string, asOf?: string) {
  const { user, token } = useAuth()
  const params = new URLSearchParams({ venue, instrument })
  if (mode) params.set("mode", mode)
  if (asOf) params.set("as_of", asOf)

  return useQuery({
    queryKey: ["orderbook", venue, instrument, mode, asOf, user?.id],
    queryFn: () => apiFetch(`/api/market-data/orderbook?${params.toString()}`, token),
    enabled: !!user && !!venue && !!instrument,
    refetchInterval: mode === "batch" || process.env.NEXT_PUBLIC_MOCK_API === "true" ? false : 5000,
  })
}

export function useTrades(venue: string, instrument: string) {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["trades", venue, instrument, user?.id],
    queryFn: () =>
      apiFetch(`/api/market-data/trades?venue=${encodeURIComponent(venue)}&instrument=${encodeURIComponent(instrument)}`, token),
    enabled: !!user && !!venue && !!instrument,
    refetchInterval: process.env.NEXT_PUBLIC_MOCK_API === "true" ? false : 3000,
  })
}

export function useTickers() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["tickers", user?.id],
    queryFn: () => apiFetch("/api/market-data/tickers", token),
    enabled: !!user,
    refetchInterval: process.env.NEXT_PUBLIC_MOCK_API === "true" ? false : 10000,
  })
}

export function useOptionsChain(underlying: string, venue: string) {
  const { user, token } = useAuth()
  return useQuery({
    queryKey: ["options-chain", underlying, venue, user?.id],
    queryFn: () => apiFetch(`/api/derivatives/options-chain?underlying=${encodeURIComponent(underlying)}&venue=${encodeURIComponent(venue)}`, token),
    enabled: !!user && !!underlying,
  })
}

export function useVolSurface(underlying: string) {
  const { user, token } = useAuth()
  return useQuery({
    queryKey: ["vol-surface", underlying, user?.id],
    queryFn: () => apiFetch(`/api/derivatives/vol-surface?underlying=${encodeURIComponent(underlying)}`, token),
    enabled: !!user && !!underlying,
  })
}
