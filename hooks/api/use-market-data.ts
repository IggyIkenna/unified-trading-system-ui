import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";

type CandlesResponse = GatewayApiResponse<"/api/market-data/candles">;
type OrderBookResponse = GatewayApiResponse<"/api/market-data/orderbook">;
type TradesResponse = GatewayApiResponse<"/api/market-data/trades">;
type TickersResponse = GatewayApiResponse<"/api/market-data/tickers">;
const mockDataMode = isMockDataMode();

export function useCandles(
  venue: string,
  instrument: string,
  timeframe = "1H",
  count = 100,
  mode?: string,
  asOf?: string,
) {
  const { user, token } = useAuth();
  const params = new URLSearchParams({
    venue,
    instrument,
    timeframe,
    count: String(count),
  });
  if (mode) params.set("mode", mode);
  if (asOf) params.set("as_of", asOf);

  return useQuery<CandlesResponse>({
    queryKey: [
      "candles",
      venue,
      instrument,
      timeframe,
      count,
      mode,
      asOf,
      user?.id,
    ],
    queryFn: () =>
      typedFetch<CandlesResponse>(
        `/api/market-data/candles?${params.toString()}`,
        token,
      ),
    enabled: !!user && !!venue && !!instrument,
  });
}

export function useOrderBook(
  venue: string,
  instrument: string,
  mode?: string,
  asOf?: string,
) {
  const { user, token } = useAuth();
  const params = new URLSearchParams({ venue, instrument });
  if (mode) params.set("mode", mode);
  if (asOf) params.set("as_of", asOf);

  return useQuery<OrderBookResponse>({
    queryKey: ["orderbook", venue, instrument, mode, asOf, user?.id],
    queryFn: () =>
      typedFetch<OrderBookResponse>(
        `/api/market-data/orderbook?${params.toString()}`,
        token,
      ),
    enabled: !!user && !!venue && !!instrument,
    refetchInterval:
      mode === "batch" || mockDataMode
        ? false
        : 5000,
  });
}

export function useTrades(venue: string, instrument: string) {
  const { user, token } = useAuth();

  return useQuery<TradesResponse>({
    queryKey: ["trades", venue, instrument, user?.id],
    queryFn: () =>
      typedFetch<TradesResponse>(
        `/api/market-data/trades?venue=${encodeURIComponent(venue)}&instrument=${encodeURIComponent(instrument)}`,
        token,
      ),
    enabled: !!user && !!venue && !!instrument,
    refetchInterval: mockDataMode ? false : 3000,
  });
}

export function useTickers() {
  const { user, token } = useAuth();

  return useQuery<TickersResponse>({
    queryKey: ["tickers", user?.id],
    queryFn: () =>
      typedFetch<TickersResponse>("/api/market-data/tickers", token),
    enabled: !!user,
    refetchInterval:
      mockDataMode ? false : 10000,
  });
}

export function useOptionsChain(underlying: string, venue: string) {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: ["options-chain", underlying, venue, user?.id],
    queryFn: () =>
      apiFetch(
        `/api/derivatives/options-chain?underlying=${encodeURIComponent(underlying)}&venue=${encodeURIComponent(venue)}`,
        token,
      ),
    enabled: !!user && !!underlying,
  });
}

export function useVolSurface(underlying: string) {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: ["vol-surface", underlying, user?.id],
    queryFn: () =>
      apiFetch(
        `/api/derivatives/vol-surface?underlying=${encodeURIComponent(underlying)}`,
        token,
      ),
    enabled: !!user && !!underlying,
  });
}
