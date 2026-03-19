/**
 * handlers/market-data.ts — Market data service mock handlers (REST only).
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /market-data-api/api/candles — OHLCV candle data
 *   GET /market-data-api/api/orderbook — order book snapshot
 *   GET /market-data-api/api/trades — recent trades
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/market-data/candles — OHLCV with timeframe param
 *   GET /api/market-data/orderbook — book snapshot with depth
 *   GET /api/market-data/trades — recent trade list
 *   GET /api/market-data/ticker — current price ticker
 *
 * NOTE: WebSocket real-time feeds are NOT handled by MSW.
 * The trading page's Brownian motion simulation stays client-side.
 */

import { http, HttpResponse } from "msw"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateCandles(symbol: string, count: number, timeframe: string) {
  const rand = seededRandom(symbol.length * 1000 + count)
  const basePrice = symbol.includes("BTC") ? 67000 : symbol.includes("ETH") ? 3400 : 150
  const candles = []
  let price = basePrice

  const intervalMs: Record<string, number> = {
    "1m": 60000, "5m": 300000, "15m": 900000,
    "1H": 3600000, "4H": 14400000, "1D": 86400000,
  }
  const interval = intervalMs[timeframe] || 3600000
  const now = Date.now()

  for (let i = count - 1; i >= 0; i--) {
    const change = (rand() - 0.48) * basePrice * 0.005
    price = Math.max(price + change, basePrice * 0.8)
    const open = price
    const close = price + (rand() - 0.5) * basePrice * 0.003
    const high = Math.max(open, close) + rand() * basePrice * 0.002
    const low = Math.min(open, close) - rand() * basePrice * 0.002
    const volume = Math.round(rand() * 1000 + 100)

    candles.push({
      time: now - i * interval,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
      tickCount: Math.round(rand() * 500 + 50),
    })
  }
  return candles
}

function generateOrderBook(midPrice: number) {
  const rand = seededRandom(Math.round(midPrice * 100))
  const bids = []
  const asks = []

  for (let i = 0; i < 15; i++) {
    bids.push({
      price: Math.round((midPrice - (i + 1) * midPrice * 0.0002) * 100) / 100,
      quantity: Math.round((rand() * 10 + 0.5) * 1000) / 1000,
    })
    asks.push({
      price: Math.round((midPrice + (i + 1) * midPrice * 0.0002) * 100) / 100,
      quantity: Math.round((rand() * 10 + 0.5) * 1000) / 1000,
    })
  }

  return {
    bids,
    asks,
    spread: Math.round((asks[0].price - bids[0].price) * 100) / 100,
    spreadBps: Math.round(((asks[0].price - bids[0].price) / midPrice) * 10000 * 100) / 100,
    timestamp: Date.now(),
  }
}

const TICKERS = [
  { symbol: "BTC/USDT", venue: "Binance", midPrice: 67234.50, change24h: 2.4, volume24h: 1420000000 },
  { symbol: "ETH/USDT", venue: "Binance", midPrice: 3421.80, change24h: -1.2, volume24h: 890000000 },
  { symbol: "SOL/USDT", venue: "Binance", midPrice: 148.25, change24h: 5.1, volume24h: 320000000 },
  { symbol: "BTC-PERP", venue: "Hyperliquid", midPrice: 67280.00, change24h: 2.5, volume24h: 2100000000 },
  { symbol: "ETH-PERP", venue: "Hyperliquid", midPrice: 3425.50, change24h: -1.1, volume24h: 1500000000 },
  { symbol: "wstETH/ETH", venue: "Uniswap", midPrice: 1.157, change24h: 0.02, volume24h: 45000000 },
]

export const marketDataHandlers = [
  http.get("*/api/market-data/candles", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const symbol = url.searchParams.get("symbol") || "BTC/USDT"
    const timeframe = url.searchParams.get("timeframe") || "1H"
    const count = Math.min(parseInt(url.searchParams.get("count") || "100"), 500)

    const candles = generateCandles(symbol, count, timeframe)
    return HttpResponse.json({ candles, symbol, timeframe, total: candles.length })
  }),

  http.get("*/api/market-data/orderbook", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const symbol = url.searchParams.get("symbol") || "BTC/USDT"
    const ticker = TICKERS.find((t) => t.symbol === symbol)
    const midPrice = ticker?.midPrice || 67000

    return HttpResponse.json({ symbol, ...generateOrderBook(midPrice) })
  }),

  http.get("*/api/market-data/trades", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const symbol = url.searchParams.get("symbol") || "BTC/USDT"
    const ticker = TICKERS.find((t) => t.symbol === symbol)
    const mid = ticker?.midPrice || 67000
    const rand = seededRandom(Date.now() % 10000)

    const trades = Array.from({ length: 20 }, (_, i) => ({
      id: `trade-${Date.now()}-${i}`,
      time: new Date(Date.now() - i * 1200).toISOString(),
      side: rand() > 0.5 ? "buy" : "sell",
      price: Math.round((mid + (rand() - 0.5) * mid * 0.001) * 100) / 100,
      size: Math.round(rand() * 5 * 1000) / 1000,
    }))

    return HttpResponse.json({ trades, symbol, total: trades.length })
  }),

  http.get("*/api/market-data/tickers", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ tickers: TICKERS, total: TICKERS.length })
  }),
]
