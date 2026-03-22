import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useCandles(venue: string, instrument: string, timeframe = "1H", count = 100) {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["candles", venue, instrument, timeframe, count, user?.id],
    queryFn: () =>
      apiFetch(
        `/api/market-data/candles?venue=${encodeURIComponent(venue)}&instrument=${encodeURIComponent(instrument)}&timeframe=${timeframe}&count=${count}`,
        token
      ),
    enabled: !!user && !!venue && !!instrument,
  })
}

export function useOrderBook(venue: string, instrument: string) {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["orderbook", venue, instrument, user?.id],
    queryFn: () =>
      apiFetch(`/api/market-data/orderbook?venue=${encodeURIComponent(venue)}&instrument=${encodeURIComponent(instrument)}`, token),
    enabled: !!user && !!venue && !!instrument,
    refetchInterval: 5000, // refresh every 5s for semi-live feel
  })
}

export function useTrades(venue: string, instrument: string) {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["trades", venue, instrument, user?.id],
    queryFn: () =>
      apiFetch(`/api/market-data/trades?venue=${encodeURIComponent(venue)}&instrument=${encodeURIComponent(instrument)}`, token),
    enabled: !!user && !!venue && !!instrument,
    refetchInterval: 3000,
  })
}

export function useTickers() {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["tickers", user?.id],
    queryFn: () => apiFetch("/api/market-data/tickers", token),
    enabled: !!user,
    refetchInterval: 10000,
  })
}
