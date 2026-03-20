/**
 * Market Data Hooks
 * 
 * React Query / SWR hooks for market data (OHLCV, book snapshots, trades).
 * Market data is shared (not client-scoped) as it comes from public feeds.
 * 
 * Note: Real-time streaming via WebSocket is handled separately.
 * These hooks are for REST-based historical/snapshot data.
 */

import useSWR from "swr"
import { API_CONFIG } from "@/lib/config"

// =============================================================================
// TYPES
// =============================================================================

export interface OHLCV {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap?: number
  trades?: number
}

export interface OrderBookSnapshot {
  timestamp: string
  symbol: string
  venue: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  spread: number
  midPrice: number
}

export interface OrderBookLevel {
  price: number
  size: number
  orders?: number
}

export interface Trade {
  id: string
  timestamp: string
  symbol: string
  venue: string
  price: number
  size: number
  side: "buy" | "sell"
  aggressor: "buyer" | "seller"
}

export interface MarketStats {
  symbol: string
  venue: string
  lastPrice: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  vwap24h: number
  openInterest?: number
  fundingRate?: number
}

export interface Ticker {
  symbol: string
  venue: string
  bid: number
  ask: number
  last: number
  volume: number
  timestamp: string
}

// =============================================================================
// OPTIONS TYPES
// =============================================================================

export interface UseOHLCVOptions {
  symbol: string
  venue: string
  interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w"
  startTime?: string
  endTime?: string
  limit?: number
}

export interface UseTradesOptions {
  symbol: string
  venue: string
  limit?: number
  startTime?: string
  endTime?: string
}

// =============================================================================
// FETCHER
// =============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch market data")
    throw error
  }
  return res.json()
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch OHLCV candlestick data.
 */
export function useOHLCV(options: UseOHLCVOptions) {
  const params = new URLSearchParams()
  params.set("symbol", options.symbol)
  params.set("venue", options.venue)
  params.set("interval", options.interval)
  if (options.startTime) params.set("start", options.startTime)
  if (options.endTime) params.set("end", options.endTime)
  if (options.limit) params.set("limit", options.limit.toString())
  
  const url = `${API_CONFIG.baseUrl}/api/market-data/ohlcv?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<OHLCV[]>(
    options.symbol && options.venue ? url : null,
    fetcher,
    { refreshInterval: 60000 } // Candles update at interval boundaries
  )
  
  return {
    candles: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch order book snapshot.
 */
export function useOrderBook(symbol: string, venue: string, depth: number = 10) {
  const params = new URLSearchParams()
  params.set("symbol", symbol)
  params.set("venue", venue)
  params.set("depth", depth.toString())
  
  const url = `${API_CONFIG.baseUrl}/api/market-data/orderbook?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<OrderBookSnapshot>(
    symbol && venue ? url : null,
    fetcher,
    { refreshInterval: 1000 } // Order book needs frequent updates
  )
  
  return {
    orderBook: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch recent trades.
 */
export function useTrades(options: UseTradesOptions) {
  const params = new URLSearchParams()
  params.set("symbol", options.symbol)
  params.set("venue", options.venue)
  if (options.limit) params.set("limit", options.limit.toString())
  if (options.startTime) params.set("start", options.startTime)
  if (options.endTime) params.set("end", options.endTime)
  
  const url = `${API_CONFIG.baseUrl}/api/market-data/trades?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<Trade[]>(
    options.symbol && options.venue ? url : null,
    fetcher,
    { refreshInterval: 5000 }
  )
  
  return {
    trades: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch market statistics for a symbol.
 */
export function useMarketStats(symbol: string, venue: string) {
  const params = new URLSearchParams()
  params.set("symbol", symbol)
  params.set("venue", venue)
  
  const url = `${API_CONFIG.baseUrl}/api/market-data/stats?${params.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR<MarketStats>(
    symbol && venue ? url : null,
    fetcher,
    { refreshInterval: 10000 }
  )
  
  return {
    stats: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

/**
 * Fetch tickers for multiple symbols.
 */
export function useTickers(symbols: Array<{ symbol: string; venue: string }>) {
  const symbolsParam = symbols.map(s => `${s.venue}:${s.symbol}`).join(",")
  
  const url = symbols.length > 0
    ? `${API_CONFIG.baseUrl}/api/market-data/tickers?symbols=${symbolsParam}`
    : null
  
  const { data, error, isLoading, mutate } = useSWR<Ticker[]>(
    url,
    fetcher,
    { refreshInterval: 5000 }
  )
  
  return {
    tickers: data ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}
