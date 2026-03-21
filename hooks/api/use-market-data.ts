import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export function useCandles(symbol: string, timeframe = "1H", count = 100) {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["candles", symbol, timeframe, count, user?.id],
    queryFn: () =>
      apiFetch(
        `/api/market-data/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&count=${count}`,
        token
      ),
    enabled: !!user && !!symbol,
  })
}

export function useOrderBook(symbol: string) {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["orderbook", symbol, user?.id],
    queryFn: () =>
      apiFetch(`/api/market-data/orderbook?symbol=${encodeURIComponent(symbol)}`, token),
    enabled: !!user && !!symbol,
    refetchInterval: 5000, // refresh every 5s for semi-live feel
  })
}

export function useTrades(symbol: string) {
  const { user, token } = useAuth()

  return useQuery({
    queryKey: ["trades", symbol, user?.id],
    queryFn: () =>
      apiFetch(`/api/market-data/trades?symbol=${encodeURIComponent(symbol)}`, token),
    enabled: !!user && !!symbol,
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
